# Relay State Resilience Spec v1.0

**Status**: Canonical Specification  
**Version**: 1.0.0  
**Date**: 2026-01-31  
**Purpose**: Make Relay unstoppable under scale, crashes, partitions, and load

---

## Principles

1. **Truth lives in append-only logs** (never mutate history)
2. **Snapshots are projections** (never truth)
3. **Every effect is idempotent** (safe to retry)
4. **Refusal is first-class** (honest about limits)
5. **Confidence is explicit** (never overstate)
6. **All progress is visible** (no hidden state)
7. **Crash-only design** (resume from commits)
8. **Policies are versioned** (explain every decision)
9. **Capacity is physics** (explicit backpressure)
10. **Integrity is verifiable** (hash chains + signatures)

---

## 1. Hash-Chained Event Log

### Event Log Format

**File**: `events.jsonl` (append-only, never truncated)

Each line is a hash-chained event:

```json
{
  "event_id": "evt_001",
  "event_type": "CELL_EDIT",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "scope": {
    "scope_type": "branch",
    "repo_id": "relay-main",
    "branch_id": "main",
    "bundle_id": null
  },
  "actor": {
    "user_id": "user_abc",
    "authority_ref": "commit:sha256:..."
  },
  "payload": {
    "filament_id": "candidate_001",
    "column_id": "votes_total",
    "before": 10,
    "after": 11
  },
  "prev_hash": "sha256:...",
  "event_hash": "sha256:...",
  "signature": "ed25519:..."
}
```

### Hash Chain Rules

```javascript
event_hash = SHA256(
  event_id || 
  event_type || 
  timestamp || 
  JSON.stringify(scope) ||
  JSON.stringify(actor) ||
  JSON.stringify(payload) ||
  prev_hash
)

// First event: prev_hash = "0000000000000000"
// Subsequent: prev_hash = previous event's event_hash
```

### Signed Checkpoint Format

**File**: `checkpoints/{range_end}.json`

```json
{
  "checkpoint_id": "ckpt_001",
  "range_start": "evt_000",
  "range_end": "evt_999",
  "merkle_root": "sha256:...",
  "snapshot_hash": "sha256:...",
  "event_count": 1000,
  "timestamp": "2026-01-31T12:00:00.000Z",
  "signer": {
    "authority_id": "relay_authority_1",
    "public_key": "ed25519:...",
    "signature": "ed25519:..."
  },
  "verification": {
    "chain_valid": true,
    "events_verified": 1000,
    "missing_events": []
  }
}
```

### Merkle Tree Construction

```javascript
// Leaf nodes: event hashes
leaves = events.map(e => e.event_hash)

// Build tree bottom-up
while (leaves.length > 1) {
  const level = []
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i]
    const right = leaves[i + 1] || left
    level.push(SHA256(left || right))
  }
  leaves = level
}

merkle_root = leaves[0]
```

### Integrity Verification

```javascript
function verifyEventLog(events, checkpoint) {
  // 1. Verify hash chain
  for (let i = 1; i < events.length; i++) {
    const computed = computeEventHash(events[i])
    if (computed !== events[i].event_hash) {
      return { valid: false, error: `Hash mismatch at ${i}` }
    }
    if (events[i].prev_hash !== events[i-1].event_hash) {
      return { valid: false, error: `Chain broken at ${i}` }
    }
  }
  
  // 2. Verify merkle root
  const computed_merkle = computeMerkleRoot(events)
  if (computed_merkle !== checkpoint.merkle_root) {
    return { valid: false, error: 'Merkle root mismatch' }
  }
  
  // 3. Verify signature
  if (!verifySignature(checkpoint)) {
    return { valid: false, error: 'Invalid signature' }
  }
  
  return { valid: true }
}
```

---

## 2. Deterministic Snapshots

### Snapshot Format

**File**: `snapshots/{scope}/{version}.snapshot.json`

```json
{
  "snapshot_id": "snap_001",
  "snapshot_version": "v1.0.0",
  "scope": {
    "scope_type": "branch",
    "repo_id": "relay-main",
    "branch_id": "main"
  },
  "state": {
    "filaments": {
      "candidate_001": {
        "filament_id": "candidate_001",
        "current_state": { ... },
        "last_commit": "evt_999"
      }
    },
    "aggregates": {
      "total_votes": 12345
    }
  },
  "metadata": {
    "event_id_start": "evt_000",
    "event_id_end": "evt_999",
    "snapshot_hash": "sha256:...",
    "replay_proof": {
      "last_applied_event": "evt_999",
      "last_applied_hash": "sha256:...",
      "state_version": 999
    },
    "created_at": "2026-01-31T12:00:00.000Z",
    "deterministic": true
  }
}
```

### Snapshot Metadata

**File**: `snapshots/{scope}/{version}.meta.json`

```json
{
  "snapshot_id": "snap_001",
  "event_id_end": "evt_999",
  "snapshot_hash": "sha256:...",
  "state_version": 999,
  "replay_proof": {
    "event_hash": "sha256:...",
    "merkle_root": "sha256:...",
    "checkpoint_ref": "ckpt_001"
  },
  "compaction": {
    "replaces": ["snap_000"],
    "retention_policy": "keep_raw_log",
    "compacted_at": "2026-01-31T12:00:00.000Z"
  },
  "verification": {
    "deterministic_replay": true,
    "hash_verified": true,
    "signature": "ed25519:..."
  }
}
```

### Cold Start Procedure

```javascript
async function coldStart(scope) {
  // 1. Find latest snapshot
  const snapshot = await loadLatestSnapshot(scope)
  
  if (!snapshot) {
    // No snapshot - replay from event 0
    return await replayFromBeginning(scope)
  }
  
  // 2. Verify snapshot integrity
  const verified = await verifySnapshot(snapshot)
  if (!verified) {
    throw new Error('Snapshot integrity check failed')
  }
  
  // 3. Load snapshot state
  const state = snapshot.state
  
  // 4. Replay events after snapshot
  const events = await loadEvents({
    scope,
    after: snapshot.metadata.event_id_end
  })
  
  // 5. Apply events to state
  for (const event of events) {
    await applyEvent(state, event)
  }
  
  return state
}
```

### Snapshot Compaction Policy

```json
{
  "compaction_policy": {
    "version": "v1.0.0",
    "rules": {
      "frequency": "every_1000_events",
      "retention": {
        "raw_log": "forever",
        "old_snapshots": "last_3",
        "checkpoints": "all"
      },
      "triggers": [
        {
          "type": "event_count",
          "threshold": 1000
        },
        {
          "type": "time_elapsed",
          "threshold_hours": 24
        },
        {
          "type": "size",
          "threshold_mb": 100
        }
      ]
    },
    "operations": {
      "delete_raw_log": false,
      "replace_old_snapshots": true,
      "verify_before_delete": true
    }
  }
}
```

---

## 3. Idempotency & Outbox Pattern

### Idempotency Key Format

Every external effect carries:

```json
{
  "idempotency_key": "idem_{scope_id}_{filament_id}_{commit_index}",
  "derived_from": {
    "filament_id": "candidate_001",
    "commit_index": 42,
    "event_id": "evt_042"
  },
  "operation": "stage_file",
  "created_at": "2026-01-31T12:00:00.000Z"
}
```

### Outbox Event Types

```typescript
enum OutboxEventType {
  OUTBOX_ENQUEUE = 'OUTBOX_ENQUEUE',
  OUTBOX_ATTEMPT = 'OUTBOX_ATTEMPT',
  OUTBOX_SUCCESS = 'OUTBOX_SUCCESS',
  OUTBOX_FAIL = 'OUTBOX_FAIL',
  OUTBOX_RETRY = 'OUTBOX_RETRY',
  OUTBOX_EXPIRE = 'OUTBOX_EXPIRE'
}
```

### Outbox Entry Format

```json
{
  "event_id": "evt_100",
  "event_type": "OUTBOX_ENQUEUE",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "payload": {
    "outbox_id": "outbox_001",
    "idempotency_key": "idem_relay_candidate_001_42",
    "operation": {
      "type": "stage_file",
      "target": "/var/staging/fix.sh",
      "content_hash": "sha256:...",
      "signature": "ed25519:..."
    },
    "retry_policy": {
      "max_attempts": 3,
      "backoff": "exponential",
      "timeout_ms": 30000
    },
    "state": "pending",
    "attempts": 0
  }
}
```

### Outbox Worker Implementation

```javascript
class OutboxWorker {
  async processOutbox() {
    while (this.running) {
      // 1. Find pending outbox entries
      const entries = await this.findPendingEntries()
      
      for (const entry of entries) {
        // 2. Acquire lease
        const lease = await this.acquireLease(entry.outbox_id)
        if (!lease) continue
        
        try {
          // 3. Check idempotency
          const already_done = await this.checkIdempotency(
            entry.idempotency_key
          )
          
          if (already_done) {
            await this.commitEvent({
              event_type: 'OUTBOX_SUCCESS',
              payload: { 
                outbox_id: entry.outbox_id,
                reason: 'already_completed'
              }
            })
            continue
          }
          
          // 4. Execute operation
          await this.commitEvent({
            event_type: 'OUTBOX_ATTEMPT',
            payload: { 
              outbox_id: entry.outbox_id,
              attempt: entry.attempts + 1
            }
          })
          
          const result = await this.executeOperation(entry.operation)
          
          // 5. Record success
          await this.commitEvent({
            event_type: 'OUTBOX_SUCCESS',
            payload: { 
              outbox_id: entry.outbox_id,
              result
            }
          })
          
        } catch (error) {
          // 6. Record failure
          await this.commitEvent({
            event_type: 'OUTBOX_FAIL',
            payload: { 
              outbox_id: entry.outbox_id,
              error: error.message,
              attempts: entry.attempts + 1
            }
          })
          
          // 7. Schedule retry or expire
          if (entry.attempts + 1 >= entry.retry_policy.max_attempts) {
            await this.commitEvent({
              event_type: 'OUTBOX_EXPIRE',
              payload: { outbox_id: entry.outbox_id }
            })
          }
          
        } finally {
          // 8. Release lease
          await this.releaseLease(lease)
        }
      }
      
      await this.sleep(100)
    }
  }
}
```

---

## 4. Backpressure & Capacity

### Capacity Filament Format

```json
{
  "filament_id": "capacity.branch.main",
  "filament_type": "capacity",
  "scope": {
    "scope_type": "branch",
    "repo_id": "relay-main",
    "branch_id": "main"
  },
  "capacity": {
    "max_concurrent_operations": 100,
    "max_outbox_pending": 1000,
    "max_events_per_second": 10000,
    "supply": {
      "total": 1000,
      "consumed": 250,
      "available": 750
    }
  },
  "policy_ref": "commit:sha256:..."
}
```

### Refusal State Event

```json
{
  "event_id": "evt_200",
  "event_type": "OPERATION_REFUSED",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "payload": {
    "operation_id": "op_123",
    "operation_type": "CELL_EDIT",
    "refusal_reason": "capacity_exhausted",
    "capacity_state": {
      "supply_available": 0,
      "queue_length": 1000,
      "backpressure_level": "critical"
    },
    "required_actions": [
      "wait_for_capacity",
      "reduce_load",
      "increase_capacity"
    ],
    "retry_after_ms": 5000
  }
}
```

### Priority Queue Policy

```json
{
  "queue_policy": {
    "version": "v1.0.0",
    "policy_ref": "commit:sha256:...",
    "rules": {
      "max_inflight_per_scope": 100,
      "max_retries_per_outbox": 3,
      "cooldown_windows": {
        "failed_operation": 60000,
        "capacity_exhausted": 30000
      },
      "priority_levels": {
        "critical": {
          "weight": 10,
          "max_age_ms": 1000
        },
        "high": {
          "weight": 5,
          "max_age_ms": 5000
        },
        "normal": {
          "weight": 1,
          "max_age_ms": 30000
        }
      }
    }
  }
}
```

### Capacity Management

```javascript
class CapacityManager {
  async consumeSupply(scope, amount) {
    const capacity = await this.getCapacity(scope)
    
    if (capacity.supply.available < amount) {
      // Emit refusal
      await this.commitEvent({
        event_type: 'OPERATION_REFUSED',
        payload: {
          refusal_reason: 'capacity_exhausted',
          capacity_state: capacity.supply,
          required_actions: ['wait_for_capacity']
        }
      })
      
      throw new CapacityExhaustedError('No supply available')
    }
    
    // Consume supply
    await this.commitEvent({
      event_type: 'CAPACITY_CONSUMED',
      payload: {
        scope,
        amount,
        remaining: capacity.supply.available - amount
      }
    })
  }
  
  async releaseSupply(scope, amount) {
    await this.commitEvent({
      event_type: 'CAPACITY_RELEASED',
      payload: {
        scope,
        amount
      }
    })
  }
}
```

---

## 5. Confidence-Aware Metrics

### ERI with Confidence

```json
{
  "filament_id": "anchor_device_001",
  "eri": {
    "score": 0.75,
    "confidence": 0.85,
    "visibility_state": "Verified",
    "missing_inputs": [],
    "components": {
      "telemetry": {
        "score": 0.80,
        "confidence": 0.90,
        "last_update": "2026-01-31T12:00:00.000Z"
      },
      "drift_detection": {
        "score": 0.70,
        "confidence": 0.80,
        "last_scan": "2026-01-31T11:55:00.000Z"
      },
      "exploit_patterns": {
        "score": 0.75,
        "confidence": 0.85,
        "last_check": "2026-01-31T11:58:00.000Z"
      }
    }
  },
  "policy_ref": "commit:sha256:..."
}
```

### Visibility States

```typescript
enum VisibilityState {
  Verified = 'Verified',      // All inputs present and verified
  Degraded = 'Degraded',      // Some inputs missing or stale
  Blind = 'Blind',            // No recent inputs
  Recovering = 'Recovering'   // Inputs coming back online
}
```

### Confidence Propagation

```javascript
function computeERIWithConfidence(anchor, telemetry, driftState) {
  const components = []
  
  // Telemetry component
  if (telemetry) {
    components.push({
      name: 'telemetry',
      score: computeTelemetryScore(telemetry),
      confidence: telemetryConfidence(telemetry),
      weight: 0.4
    })
  } else {
    components.push({
      name: 'telemetry',
      score: 0.5,  // Neutral when missing
      confidence: 0.0,
      weight: 0.4,
      missing: true
    })
  }
  
  // Drift detection component
  if (driftState) {
    components.push({
      name: 'drift_detection',
      score: computeDriftScore(driftState),
      confidence: driftConfidence(driftState),
      weight: 0.3
    })
  } else {
    components.push({
      name: 'drift_detection',
      score: 0.5,
      confidence: 0.0,
      weight: 0.3,
      missing: true
    })
  }
  
  // Compute weighted score
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
  const score = components.reduce(
    (sum, c) => sum + c.score * c.weight, 
    0
  ) / totalWeight
  
  // Compute overall confidence (minimum of component confidences)
  const confidence = Math.min(...components.map(c => c.confidence))
  
  // Determine visibility state
  const missing_inputs = components.filter(c => c.missing).map(c => c.name)
  const visibility_state = 
    missing_inputs.length === 0 ? 'Verified' :
    missing_inputs.length < components.length ? 'Degraded' :
    'Blind'
  
  return {
    score,
    confidence,
    visibility_state,
    missing_inputs,
    components
  }
}
```

---

## 6. Multi-Writer Safety

### Per-Anchor Log Structure

```
logs/
├── telemetry/
│   ├── anchor_device_001.jsonl
│   ├── anchor_device_002.jsonl
│   └── ...
├── snapshots/
│   ├── anchor_device_001.jsonl
│   └── ...
└── events.jsonl  (global meta-log)
```

### Anchor-Local Event Format

```json
{
  "event_id": "anchor_device_001_evt_001",
  "anchor_id": "anchor_device_001",
  "local_counter": 1,
  "event_type": "TELEMETRY_UPDATE",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "payload": {
    "cpu": 75.5,
    "memory": 60.2,
    "disk": 45.8
  },
  "prev_hash": "sha256:...",
  "event_hash": "sha256:..."
}
```

### Global Meta-Log Entry

```json
{
  "event_id": "global_evt_001",
  "event_type": "META_INDEX",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "routing": {
    "anchor_id": "anchor_device_001",
    "anchor_event_id": "anchor_device_001_evt_001",
    "anchor_counter": 1,
    "log_file": "telemetry/anchor_device_001.jsonl"
  },
  "ordering": {
    "global_sequence": 1,
    "tie_breaker": "anchor_device_001"
  }
}
```

### Deterministic Merge

```javascript
function mergeMultiWriterLogs(anchorLogs) {
  const events = []
  
  // Collect all events from anchor logs
  for (const [anchorId, log] of anchorLogs) {
    for (const event of log) {
      events.push({
        ...event,
        anchor_id: anchorId,
        ordering_key: `${event.local_counter}_${anchorId}`
      })
    }
  }
  
  // Sort by deterministic ordering
  events.sort((a, b) => {
    // Primary: local counter (monotonic per anchor)
    if (a.local_counter !== b.local_counter) {
      return a.local_counter - b.local_counter
    }
    
    // Tie-breaker: stable anchor ID
    return a.anchor_id.localeCompare(b.anchor_id)
  })
  
  return events
}
```

---

## 7. Policy Versioning

### Policy as Filament

```json
{
  "filament_id": "policy.eri.weights",
  "filament_type": "policy",
  "policy": {
    "version": "v1.2.0",
    "effective_date": "2026-01-31T00:00:00.000Z",
    "weights": {
      "telemetry": 0.4,
      "drift_detection": 0.3,
      "exploit_patterns": 0.3
    },
    "thresholds": {
      "critical": 0.9,
      "high": 0.7,
      "medium": 0.5,
      "low": 0.3
    }
  },
  "policy_ref": "commit:sha256:...",
  "authority_ref": "commit:sha256:...",
  "changelog": [
    {
      "version": "v1.2.0",
      "changes": "Increased telemetry weight from 0.35 to 0.4",
      "reason": "Improved telemetry reliability",
      "approved_by": "authority_001"
    }
  ]
}
```

### Policy Reference in Reports

```json
{
  "report_id": "report_001",
  "report_type": "ERI_ASSESSMENT",
  "anchor_id": "anchor_device_001",
  "eri_score": 0.75,
  "policy_ref": "commit:sha256:abc123...",
  "policy_version": "v1.2.0",
  "explanation": {
    "weights_used": {
      "telemetry": 0.4,
      "drift_detection": 0.3,
      "exploit_patterns": 0.3
    },
    "computation": "0.80*0.4 + 0.70*0.3 + 0.75*0.3 = 0.75",
    "why": "Telemetry shows normal operation, slight drift detected"
  }
}
```

### No Implicit Latest Rule

```javascript
// ❌ BAD: Implicit latest
const policy = await getPolicyLatest('eri.weights')

// ✅ GOOD: Explicit version or ref
const policy = await getPolicy('eri.weights', 'v1.2.0')
const policy = await getPolicyByRef('commit:sha256:abc123...')

// ✅ GOOD: Current as explicit alias with no-cache
const policy = await getPolicyCurrent('eri.weights', { 
  no_cache: true,
  display_warning: 'Using current policy (may change)'
})
```

---

## 8. Crash-Only Worker Design

### Task Progress Events

```typescript
enum TaskEventType {
  TASK_STARTED = 'TASK_STARTED',
  TASK_STEP_APPLIED = 'TASK_STEP_APPLIED',
  TASK_BLOCKED = 'TASK_BLOCKED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED'
}
```

### Task State Commits

```json
{
  "event_id": "evt_300",
  "event_type": "TASK_STARTED",
  "payload": {
    "task_id": "task_001",
    "task_type": "mass_suppression",
    "worker_id": "scv_agent_001",
    "total_steps": 5,
    "current_step": 0,
    "state": "running"
  }
}
```

```json
{
  "event_id": "evt_301",
  "event_type": "TASK_STEP_APPLIED",
  "payload": {
    "task_id": "task_001",
    "step_index": 1,
    "step_name": "acquire_devices",
    "step_result": {
      "devices_acquired": 100
    },
    "current_step": 1,
    "progress": 0.2
  }
}
```

### Lease Management

```json
{
  "event_id": "evt_400",
  "event_type": "LEASE_ACQUIRED",
  "payload": {
    "lease_id": "lease_001",
    "resource_id": "task_001",
    "worker_id": "scv_agent_001",
    "acquired_at": "2026-01-31T12:00:00.000Z",
    "expires_at": "2026-01-31T12:05:00.000Z",
    "lease_duration_ms": 300000
  }
}
```

```json
{
  "event_id": "evt_401",
  "event_type": "LEASE_RELEASED",
  "payload": {
    "lease_id": "lease_001",
    "released_at": "2026-01-31T12:03:00.000Z",
    "reason": "task_completed"
  }
}
```

```json
{
  "event_id": "evt_402",
  "event_type": "LEASE_EXPIRED",
  "payload": {
    "lease_id": "lease_001",
    "expired_at": "2026-01-31T12:05:00.000Z",
    "reason": "timeout",
    "available_for_reacquisition": true
  }
}
```

### Crash Recovery

```javascript
class CrashOnlyWorker {
  async resumeFromLastCommit(task_id) {
    // 1. Find last task state commit
    const lastState = await this.findLastTaskState(task_id)
    
    if (!lastState) {
      throw new Error('No previous state found')
    }
    
    // 2. Check if lease expired
    const lease = await this.findActiveLease(task_id)
    if (lease && !this.isExpired(lease)) {
      throw new Error('Task still leased by another worker')
    }
    
    // 3. Acquire new lease
    const newLease = await this.acquireLease(task_id)
    
    // 4. Resume from last step
    await this.commitEvent({
      event_type: 'TASK_RESUMED',
      payload: {
        task_id,
        worker_id: this.workerId,
        resumed_from_step: lastState.current_step,
        previous_worker: lastState.worker_id
      }
    })
    
    // 5. Continue execution
    await this.continueTask(task_id, lastState.current_step + 1)
  }
}
```

---

## 9. Refusal as First-Class

### Refusal Commit Format

```json
{
  "event_id": "evt_500",
  "event_type": "OPERATION_REFUSED",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "payload": {
    "operation_id": "op_123",
    "operation_type": "MASS_SUPPRESSION",
    "refusal_reason": "capacity_exhausted",
    "reason_code": "CAP_001",
    "required_next_actions": [
      {
        "action": "wait_for_capacity",
        "estimated_wait_ms": 30000
      },
      {
        "action": "reduce_scope",
        "suggestion": "Target fewer devices"
      },
      {
        "action": "increase_capacity",
        "suggestion": "Add more SCV agents"
      }
    ],
    "evidence_refs": [
      "commit:sha256:capacity_state_001",
      "commit:sha256:queue_state_001"
    ],
    "retry_policy": {
      "can_retry": true,
      "retry_after_ms": 30000,
      "max_retries": 3
    }
  }
}
```

### Refusal Reason Codes

```typescript
enum RefusalReasonCode {
  // Capacity
  CAP_001 = 'capacity_exhausted',
  CAP_002 = 'queue_full',
  CAP_003 = 'rate_limited',
  
  // Authority
  AUTH_001 = 'insufficient_authority',
  AUTH_002 = 'policy_violation',
  AUTH_003 = 'signature_invalid',
  
  // State
  STATE_001 = 'scope_locked',
  STATE_002 = 'conflict_detected',
  STATE_003 = 'dependency_missing',
  
  // Integrity
  INT_001 = 'hash_mismatch',
  INT_002 = 'chain_broken',
  INT_003 = 'snapshot_corrupted',
  
  // Degraded
  DEG_001 = 'telemetry_missing',
  DEG_002 = 'confidence_too_low',
  DEG_003 = 'visibility_blind'
}
```

### Recovery from Refusal

```javascript
async function handleRefusal(refusal) {
  const { reason_code, required_next_actions } = refusal.payload
  
  switch (reason_code) {
    case 'CAP_001': // Capacity exhausted
      // Wait for capacity
      await sleep(refusal.payload.retry_policy.retry_after_ms)
      return { action: 'retry', wait: true }
      
    case 'AUTH_001': // Insufficient authority
      // Request authority escalation
      await requestAuthorityEscalation(refusal)
      return { action: 'wait_for_approval' }
      
    case 'STATE_001': // Scope locked
      // Wait for lock release
      await waitForLockRelease(refusal)
      return { action: 'retry' }
      
    case 'DEG_002': // Confidence too low
      // Wait for telemetry
      await waitForTelemetryUpdate(refusal)
      return { action: 'retry' }
      
    default:
      return { action: 'fail', reason: 'unrecoverable' }
  }
}
```

---

## 10. Repair Artifact Integrity

### Content-Addressed Artifact

```json
{
  "artifact_id": "artifact_001",
  "artifact_type": "repair_script",
  "content_hash": "sha256:abc123...",
  "content_size_bytes": 4096,
  "signature": {
    "algorithm": "ed25519",
    "public_key": "ed25519:...",
    "signature": "ed25519:...",
    "signed_by": "authority_001",
    "signed_at": "2026-01-31T12:00:00.000Z"
  },
  "policy_ref": "commit:sha256:policy_001",
  "execution_scope": {
    "allowed_anchors": ["anchor_device_001", "anchor_device_002"],
    "allowed_environments": ["staging", "production"],
    "requires_approval": true
  },
  "metadata": {
    "description": "Fix AD role splinter",
    "severity": "high",
    "created_at": "2026-01-31T12:00:00.000Z"
  }
}
```

### Two-Person Rule (Optional)

```json
{
  "event_id": "evt_600",
  "event_type": "ARTIFACT_STAGED",
  "payload": {
    "artifact_id": "artifact_001",
    "staged_by": "authority_001",
    "staged_at": "2026-01-31T12:00:00.000Z",
    "requires_approval": true,
    "approval_state": "pending"
  }
}
```

```json
{
  "event_id": "evt_601",
  "event_type": "ARTIFACT_APPROVED",
  "payload": {
    "artifact_id": "artifact_001",
    "approved_by": "authority_002",
    "approved_at": "2026-01-31T12:05:00.000Z",
    "approval_signature": "ed25519:..."
  }
}
```

```json
{
  "event_id": "evt_602",
  "event_type": "ARTIFACT_EXECUTED",
  "payload": {
    "artifact_id": "artifact_001",
    "executed_by": "scv_agent_001",
    "executed_at": "2026-01-31T12:06:00.000Z",
    "target_anchor": "anchor_device_001",
    "execution_result": {
      "success": true,
      "output_hash": "sha256:...",
      "duration_ms": 1500
    },
    "staged_by_ref": "evt_600",
    "approved_by_ref": "evt_601"
  }
}
```

---

## Minimal v1 Checklist

### Priority 1: Core Resilience (Implement First)

- [ ] **Hash-chained event logs**
  - Implement event hash computation
  - Add prev_hash linking
  - Create integrity verification function
  
- [ ] **Signed checkpoints**
  - Implement merkle tree construction
  - Add checkpoint signing
  - Create verification function

- [ ] **Snapshot + replay**
  - Define snapshot format
  - Implement cold start procedure
  - Add replay proof metadata

- [ ] **Outbox pattern**
  - Create OUTBOX event types
  - Implement outbox worker
  - Add idempotency key system

- [ ] **Backpressure system**
  - Create capacity filament
  - Implement supply consumption
  - Add refusal state events

### Priority 2: Confidence & Safety

- [ ] **Confidence-aware ERI**
  - Add confidence to all scores
  - Implement visibility states
  - Add missing_inputs tracking

- [ ] **Policy versioning**
  - Store policies as filaments
  - Add policy_ref to all decisions
  - Remove implicit "latest"

- [ ] **Refusal as first-class**
  - Define refusal reason codes
  - Implement refusal commits
  - Add recovery procedures

### Priority 3: Scale & Distribution

- [ ] **Per-anchor logs**
  - Create anchor-local log structure
  - Implement deterministic merge
  - Add global meta-log

- [ ] **Crash-only workers**
  - Add task progress events
  - Implement lease management
  - Add crash recovery

- [ ] **Repair artifact integrity**
  - Define artifact format
  - Add content addressing
  - Implement two-person rule

---

## Test Plan

### Crash Tests

```javascript
describe('Crash Resilience', () => {
  test('worker crash during task', async () => {
    // 1. Start task
    const task = await startTask('mass_suppression')
    
    // 2. Simulate crash after step 2
    await simulateCrash(task.worker_id, { after_step: 2 })
    
    // 3. New worker resumes
    const resumed = await resumeTask(task.task_id)
    
    // 4. Verify resumed from step 3
    expect(resumed.current_step).toBe(3)
    expect(resumed.previous_worker).toBe(task.worker_id)
  })
  
  test('snapshot corruption recovery', async () => {
    // 1. Corrupt snapshot
    await corruptSnapshot('snap_001')
    
    // 2. Cold start should detect and fallback
    const state = await coldStart()
    
    // 3. Verify replayed from log
    expect(state.replayed_from).toBe('evt_000')
    expect(state.snapshot_used).toBe(null)
  })
})
```

### Restart Tests

```javascript
describe('Restart Resilience', () => {
  test('restart with pending outbox', async () => {
    // 1. Enqueue outbox entry
    await enqueueOutbox('stage_file')
    
    // 2. Restart system
    await restart()
    
    // 3. Verify outbox resumes
    const result = await waitForOutboxCompletion('stage_file')
    expect(result.success).toBe(true)
  })
  
  test('restart with expired lease', async () => {
    // 1. Acquire lease
    const lease = await acquireLease('task_001')
    
    // 2. Wait for expiry
    await sleep(lease.lease_duration_ms + 1000)
    
    // 3. Restart and reacquire
    await restart()
    const newLease = await acquireLease('task_001')
    expect(newLease).toBeDefined()
  })
})
```

### Partition Tests

```javascript
describe('Partition Resilience', () => {
  test('anchor partition recovery', async () => {
    // 1. Simulate partition
    await simulatePartition('anchor_device_001')
    
    // 2. Write to anchor log
    await writeAnchorEvent('anchor_device_001', 'telemetry_update')
    
    // 3. Partition heals
    await healPartition('anchor_device_001')
    
    // 4. Verify merge
    const merged = await getMergedView()
    expect(merged).toContainEvent('telemetry_update')
  })
  
  test('degraded mode during partition', async () => {
    // 1. Partition telemetry source
    await simulatePartition('telemetry_service')
    
    // 2. Compute ERI
    const eri = await computeERI('anchor_device_001')
    
    // 3. Verify degraded state
    expect(eri.visibility_state).toBe('Degraded')
    expect(eri.missing_inputs).toContain('telemetry')
    expect(eri.confidence).toBeLessThan(1.0)
  })
})
```

### Load Tests

```javascript
describe('Load Resilience', () => {
  test('capacity exhaustion handling', async () => {
    // 1. Fill capacity
    await fillCapacity()
    
    // 2. Attempt operation
    const result = await attemptOperation('mass_suppression')
    
    // 3. Verify refusal
    expect(result.event_type).toBe('OPERATION_REFUSED')
    expect(result.payload.reason_code).toBe('CAP_001')
  })
  
  test('backpressure under load', async () => {
    // 1. Generate high load
    const operations = Array(1000).fill(0).map(() => 
      submitOperation('cell_edit')
    )
    
    // 2. Monitor refusals
    const results = await Promise.allSettled(operations)
    const refusals = results.filter(r => 
      r.value?.event_type === 'OPERATION_REFUSED'
    )
    
    // 3. Verify backpressure activated
    expect(refusals.length).toBeGreaterThan(0)
  })
})
```

---

## relay-lint:defense Invariants

### Event Log Invariants

```javascript
// Invariant: Hash chain must be unbroken
function checkHashChain(events) {
  for (let i = 1; i < events.length; i++) {
    assert(
      events[i].prev_hash === events[i-1].event_hash,
      `Hash chain broken at event ${i}`
    )
  }
}

// Invariant: Event hashes must match content
function checkEventHashes(events) {
  for (const event of events) {
    const computed = computeEventHash(event)
    assert(
      computed === event.event_hash,
      `Event hash mismatch: ${event.event_id}`
    )
  }
}

// Invariant: Checkpoints must have valid signatures
function checkCheckpointSignatures(checkpoints) {
  for (const checkpoint of checkpoints) {
    assert(
      verifySignature(checkpoint),
      `Invalid checkpoint signature: ${checkpoint.checkpoint_id}`
    )
  }
}
```

### Idempotency Invariants

```javascript
// Invariant: Idempotency keys must be unique
function checkIdempotencyKeys(outboxEntries) {
  const keys = new Set()
  for (const entry of outboxEntries) {
    assert(
      !keys.has(entry.idempotency_key),
      `Duplicate idempotency key: ${entry.idempotency_key}`
    )
    keys.add(entry.idempotency_key)
  }
}

// Invariant: Outbox entries must progress linearly
function checkOutboxProgression(outboxEvents) {
  const progressions = {}
  
  for (const event of outboxEvents) {
    const id = event.payload.outbox_id
    
    if (!progressions[id]) {
      progressions[id] = []
    }
    progressions[id].push(event.event_type)
  }
  
  for (const [id, events] of Object.entries(progressions)) {
    assert(
      isValidProgression(events),
      `Invalid outbox progression for ${id}: ${events.join(' -> ')}`
    )
  }
}
```

### Capacity Invariants

```javascript
// Invariant: Supply never goes negative
function checkSupplyNonNegative(capacityEvents) {
  let supply = 1000 // Initial
  
  for (const event of capacityEvents) {
    if (event.event_type === 'CAPACITY_CONSUMED') {
      supply -= event.payload.amount
    } else if (event.event_type === 'CAPACITY_RELEASED') {
      supply += event.payload.amount
    }
    
    assert(supply >= 0, `Negative supply: ${supply}`)
  }
}

// Invariant: Refusals must have valid reason codes
function checkRefusalReasons(refusalEvents) {
  const validCodes = Object.values(RefusalReasonCode)
  
  for (const event of refusalEvents) {
    assert(
      validCodes.includes(event.payload.reason_code),
      `Invalid refusal reason code: ${event.payload.reason_code}`
    )
  }
}
```

### Confidence Invariants

```javascript
// Invariant: Confidence must be between 0 and 1
function checkConfidenceBounds(eriScores) {
  for (const eri of eriScores) {
    assert(
      eri.confidence >= 0 && eri.confidence <= 1,
      `Confidence out of bounds: ${eri.confidence}`
    )
  }
}

// Invariant: Blind state must have zero confidence
function checkBlindState(eriScores) {
  for (const eri of eriScores) {
    if (eri.visibility_state === 'Blind') {
      assert(
        eri.confidence === 0,
        `Blind state must have zero confidence: ${eri.confidence}`
      )
    }
  }
}
```

### Policy Invariants

```javascript
// Invariant: All decisions must reference a policy
function checkPolicyReferences(decisions) {
  for (const decision of decisions) {
    assert(
      decision.policy_ref,
      `Missing policy reference in decision ${decision.id}`
    )
  }
}

// Invariant: Policy refs must be commit-addressed
function checkPolicyCommitAddressing(policies) {
  for (const policy of policies) {
    assert(
      policy.policy_ref.startsWith('commit:sha256:'),
      `Policy ref not commit-addressed: ${policy.policy_ref}`
    )
  }
}
```

---

## Summary

This spec provides:

✅ **Hash-chained event logs** with signed checkpoints  
✅ **Deterministic snapshots** with replay proof  
✅ **Outbox pattern** for exactly-once effects  
✅ **Backpressure system** with explicit capacity  
✅ **Confidence-aware metrics** with visibility states  
✅ **Multi-writer safety** with per-anchor logs  
✅ **Policy versioning** with commit-addressing  
✅ **Crash-only workers** with lease management  
✅ **Refusal as first-class** with recovery procedures  
✅ **Repair artifact integrity** with content-addressing  

**The system is now truly unstoppable.**

---

**Next Steps**:
1. Implement Priority 1 features (event logs, checkpoints, snapshots, outbox, backpressure)
2. Add relay-lint:defense invariants
3. Run full test suite (crash, restart, partition, load)
4. Document migration path from current system
5. Deploy incrementally with rollback capability

**For implementation questions, reference this spec as canonical.**
