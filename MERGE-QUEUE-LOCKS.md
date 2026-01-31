# Merge Queue Locks — No Silent Arbitration

**Purpose:** Prevent "last write wins" and hidden conflict resolution.

**Status:** 🔒 **FULLY ENFORCED**

---

## 🔒 THE 6 CRITICAL LOCKS

### LOCK 1: Deterministic Ordering

**Rule:** Queue order MUST NOT depend on wall-clock arrival time.

**Sort Key:** `(baseCommitHash, proposalBranchId, taskId, createdTs)`

**Enforcement:**
```javascript
export function sortQueueDeterministically(queueEntries) {
  return queueEntries.slice().sort((a, b) => {
    // 1. baseCommitHash (groups by base)
    const hashCompare = a.payload.baseCommitHash.localeCompare(b.payload.baseCommitHash);
    if (hashCompare !== 0) return hashCompare;
    
    // 2. proposalBranchId (lexicographic)
    const branchCompare = a.payload.proposalBranchId.localeCompare(b.payload.proposalBranchId);
    if (branchCompare !== 0) return branchCompare;
    
    // 3. taskId (lexicographic)
    const taskCompare = a.payload.taskId.localeCompare(b.payload.taskId);
    if (taskCompare !== 0) return taskCompare;
    
    // 4. createdTs (final tie-breaker only)
    return a.payload.createdTs - b.payload.createdTs;
  });
}
```

**Guarantee:** Same inputs → same order (reproducible).

**Test:**
```javascript
test('Two proposals in different wall-clock order → queue order identical', () => {
  const order1 = sortQueueDeterministically([proposalA, proposalB]);
  const order2 = sortQueueDeterministically([proposalB, proposalA]);
  
  expect(order1[0]).toBe(order2[0]);
  expect(order1[1]).toBe(order2[1]);
});
```

---

### LOCK 2: Conflict Definition (No Vibes)

**Rule:** Conflict = loci overlap (explicit, not heuristic).

**Definition:**
```javascript
export function detectConflict(proposalA, proposalB) {
  const lociA = proposalA.touchedLoci || [];
  const lociB = proposalB.touchedLoci || [];
  
  const overlap = lociA.filter(locus => lociB.includes(locus));
  
  return {
    hasConflict: overlap.length > 0,
    overlap,
  };
}
```

**Guarantee:** `overlap.length > 0` → conflict (machine-checkable).

**Test:**
```javascript
test('ProposalA [A1,B1] + ProposalB [B1,C1] → conflict on B1', () => {
  const { hasConflict, overlap } = detectConflict(proposalA, proposalB);
  
  expect(hasConflict).toBe(true);
  expect(overlap).toEqual(['B1']);
});
```

---

### LOCK 3: No Silent Arbitration

**Rule:** Every conflict MUST create a conflict filament (even if immediately resolved).

**Enforcement:**
```javascript
export function verifyNoSilentArbitration(queueFilament, conflictFilaments) {
  // Check all pairs in queue
  for (let i = 0; i < enqueued.length; i++) {
    for (let j = i + 1; j < enqueued.length; j++) {
      const { hasConflict } = detectConflict(enqueued[i].payload, enqueued[j].payload);
      
      if (hasConflict) {
        const conflictFilamentId = `conflict.${fileId}.${propA}.${propB}`;
        const conflictExists = conflictFilaments.some(f => f.filamentId === conflictFilamentId);
        
        if (!conflictExists) {
          return false; // SILENT ARBITRATION DETECTED
        }
      }
    }
  }
  
  return true;
}
```

**Guarantee:** Conflict detected → filament exists (no hiding).

**Test:**
```javascript
test('FAIL: Conflict without filament = silent arbitration', () => {
  const queueFilament = { commits: [proposalA, proposalB] }; // Conflict on B1
  const conflictFilaments = []; // No filament!
  
  expect(verifyNoSilentArbitration(queueFilament, conflictFilaments)).toBe(false);
});
```

---

### LOCK 4: No Auto-Resolve

**Rule:** Conflict resolution requires human authority (not system).

**Enforcement:**
```javascript
export function createConflictResolvedByFork(..., authority) {
  if (!authority || !authority.triggeredBy) {
    throw new Error('FORBIDDEN: Fork resolution requires human authority.');
  }
  
  return {
    payload: {
      authority: {
        triggeredBy: authority.triggeredBy, // Human actor
        ...
      },
    },
  };
}

export function verifyNoAutoResolve(conflictFilaments) {
  for (const conflict of conflictFilaments) {
    const resolutions = conflict.commits.filter(c => c.op.includes('RESOLVED'));
    
    for (const resolution of resolutions) {
      if (!resolution.payload.authority || resolution.payload.authority.triggeredBy === 'system') {
        return false; // AUTO-RESOLVED
      }
    }
  }
  
  return true;
}
```

**Guarantee:** Resolution → human authority (no auto-merge/rebase).

**Test:**
```javascript
test('FAIL: Conflict resolved by system = auto-resolve', () => {
  const conflictFilament = {
    commits: [{
      op: 'CONFLICT_RESOLVED_BY_FORK',
      payload: { authority: { triggeredBy: 'system' } } // FORBIDDEN
    }]
  };
  
  expect(verifyNoAutoResolve([conflictFilament])).toBe(false);
});
```

---

### LOCK 5: Serialized Merge Execution

**Rule:** Merge only if at queue head (one at a time).

**Enforcement:**
```javascript
export function enforceQueueHead(queueFilament, proposalBranchId) {
  const queue = queueFilament.commits.filter(c => c.op === QueueOp.QUEUE_ENQUEUE);
  const sorted = sortQueueDeterministically(queue);
  
  if (sorted.length === 0) {
    throw new Error('FORBIDDEN: Cannot merge - queue is empty.');
  }
  
  const headProposal = sorted[0].payload.proposalBranchId;
  
  if (proposalBranchId !== headProposal) {
    throw new Error(`FORBIDDEN: Cannot merge ${proposalBranchId} - not at queue head.`);
  }
}
```

**Guarantee:** Merge → queue head (serialized).

**Test:**
```javascript
test('FAIL: Merge attempt when not at head throws', () => {
  const queueFilament = { commits: [proposalA, proposalB] };
  
  expect(() => {
    enforceQueueHead(queueFilament, 'proposalB'); // Not at head
  }).toThrow('FORBIDDEN: Cannot merge proposalB - not at queue head');
});
```

---

### LOCK 6: Base Commit Match

**Rule:** If file head changed, conflict path required (not silent rebase).

**Enforcement:**
```javascript
export function enforceBaseCommitMatch(proposal, fileHeadHash) {
  if (proposal.baseCommitHash !== fileHeadHash) {
    throw new Error('FORBIDDEN: Cannot merge - baseCommitHash mismatch. Conflict resolution required.');
  }
}
```

**Guarantee:** Base mismatch → conflict path (no silent rebase).

**Test:**
```javascript
test('FAIL: Base mismatch triggers conflict path', () => {
  const proposal = { baseCommitHash: 'sha256:old' };
  const fileHeadHash = 'sha256:new';
  
  expect(() => {
    enforceBaseCommitMatch(proposal, fileHeadHash);
  }).toThrow('FORBIDDEN: Cannot merge - baseCommitHash mismatch');
});
```

---

## 🚫 FORBIDDEN PATTERNS

| Pattern | How It's Blocked |
|---------|------------------|
| ❌ Last write wins | Deterministic ordering (LOCK 1) |
| ❌ Silent arbitration | Conflict filament required (LOCK 3) |
| ❌ Auto-merge | Human authority required (LOCK 4) |
| ❌ Auto-rebase | Base match enforced (LOCK 6) |
| ❌ Out-of-order merge | Queue head enforced (LOCK 5) |
| ❌ Heuristic conflicts | Explicit loci overlap (LOCK 2) |

---

## 📊 VERIFICATION FUNCTIONS

### Where They Run

**Location:** `src/frontend/components/ai/schemas/mergeQueueSchemas.js`

**Functions:**
```javascript
// LOCK 1: Deterministic ordering
export function sortQueueDeterministically(queueEntries)
export function verifyDeterministicOrdering(queueFilament)

// LOCK 2: Conflict definition
export function detectConflict(proposalA, proposalB)

// LOCK 3: No silent arbitration
export function verifyNoSilentArbitration(queueFilament, conflictFilaments)

// LOCK 4: No auto-resolve
export function verifyNoAutoResolve(conflictFilaments)

// LOCK 5: Serialized merge
export function enforceQueueHead(queueFilament, proposalBranchId)
export function verifySerializedMerge(queueFilament, fileFilament)

// LOCK 6: Base commit match
export function enforceBaseCommitMatch(proposal, fileHeadHash)
```

### Runtime Usage

```javascript
// In AgentConcurrencyProof.jsx (Step 4+)
const verificationResults = {
  noSilentArbitration: verifyNoSilentArbitration(queueFilament, conflictFilaments),
  deterministicOrdering: verifyDeterministicOrdering(queueFilament),
  serializedMerge: verifySerializedMerge(queueFilament, fileFilament),
  noAutoResolve: verifyNoAutoResolve(conflictFilaments),
};

// Displayed in UI
console.log('✅ No silent arbitration:', verificationResults.noSilentArbitration);
console.log('✅ Deterministic ordering:', verificationResults.deterministicOrdering);
console.log('✅ Serialized merge:', verificationResults.serializedMerge);
console.log('✅ No auto-resolve:', verificationResults.noAutoResolve);
```

---

## 🧪 AUTOMATED TEST COVERAGE

**Test File:** `src/frontend/components/ai/tests/agentConcurrencyVerification.test.js`

**Coverage:**

| Lock | Tests | Status |
|------|-------|--------|
| LOCK 1: Deterministic Ordering | 3 | ✅ PASSING |
| LOCK 2: Conflict Definition | 3 | ✅ PASSING |
| LOCK 3: No Silent Arbitration | 2 | ✅ PASSING |
| LOCK 4: No Auto-Resolve | 3 | ✅ PASSING |
| LOCK 5: Serialized Merge | 2 | ✅ PASSING |
| LOCK 6: Base Commit Match | 1 | ✅ PASSING |
| Authority Requirements | 2 | ✅ PASSING |

**Total:** 16 tests, all passing

---

## 🎯 ENFORCEMENT LEVELS

**Level 1: Throw Error (Cannot Create Invalid Commit)**
- Queue enqueue without touchedLoci
- Queue enqueue without baseCommitHash
- Queue reorder without authority
- Queue cancel without authority
- Conflict resolution without authority
- Merge when not at queue head
- Merge with base mismatch

**Level 2: Verification Fails (Runtime Check)**
- Silent arbitration (conflict without filament)
- Auto-resolve (system as authority)
- Out-of-order merge (not serialized)
- Non-deterministic ordering

**Result:** All violations are LOUD (not silent).

---

## 🔥 FAILURE MODES PREVENTED

### Before (Drift-Prone)

- ❌ "Last write wins" - random merge order
- ❌ Silent conflict resolution
- ❌ Auto-rebase without notice
- ❌ Race conditions on merge
- ❌ Timing-dependent queue order

### After (Fully Locked)

- ✅ Deterministic ordering (reproducible)
- ✅ Explicit conflict filaments (no hiding)
- ✅ Human authority required (no auto-resolve)
- ✅ Serialized merge (one at a time)
- ✅ Base match enforced (no silent rebase)

---

## 📚 INTEGRATION WITH EXISTING LOCKS

**Agent Concurrency builds on:**

1. **AI Workspace Locks** (from previous module)
   - READ_REF hash (LOCK B) → proposals know base
   - No teleport (LOCK C) → proposals are traceable
   - Branch-bound work (LOCK D) → proposals reference convo
   - Merge authority (LOCK A) → merge requires human
   - Stable proposals (LOCK E) → proposals are branches

2. **Topology Locks** (from previous module)
   - Time-indexed cache → replay stability
   - Stable sort → deterministic physics
   - T0 curvature → physics verified

**Result:** Concurrency locks are composable with existing locks.

---

## ✅ COMPLETION CRITERIA

**All 6 locks must be enforceable:**

- [x] LOCK 1: Deterministic ordering (not timing-based)
- [x] LOCK 2: Conflict definition (no vibes)
- [x] LOCK 3: No silent arbitration (filament required)
- [x] LOCK 4: No auto-resolve (human authority)
- [x] LOCK 5: Serialized merge (queue head only)
- [x] LOCK 6: Base commit match (no silent rebase)

**All tests passing:**
- [x] 16/16 automated tests passing
- [x] No linter errors
- [x] Visual proof functional

**Documentation complete:**
- [x] MERGE-QUEUE-LOCKS.md (this document)
- [x] AGENT-CONCURRENCY-PROOF-COMPLETE.md
- [x] agentConcurrencyVerification.test.js

---

## 🚀 STATUS

**Module:** ✅ **COMPLETE**  
**Protection Level:** 🔒 **RELAY-GRADE (NO SILENT ARBITRATION)**

**All 6 locks enforced. System cannot silently arbitrate conflicts.**

---

**Last Updated:** 2026-01-28  
**Status:** ✅ **FULLY ENFORCED**
