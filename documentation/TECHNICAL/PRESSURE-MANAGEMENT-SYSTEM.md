# Pressure Management System

**Status**: LOCKED  
**Commit**: c15  
**Date**: 2026-01-31  
**Depends On**: c14 (Surface Coordination Geometry), Pressure System Invariants

---

## Purpose

This document defines Relay's **Pressure Management System** — the infrastructure that detects, measures, and responds to coordination pressure before it causes systemic failure.

**This is NOT:**
- Security theater (visible but ineffective)
- Threat modeling against external actors
- Speculative resilience planning

**This IS:**
- Systems engineering (detection, measurement, response)
- Resilience against human coordination failures
- Testable, mechanical, auditable

---

## 1. Core Principle

**Pressure is NOT inherently bad.**

Pressure drives reconciliation. Without pressure, coordination stagnates.

**The problem is unmanaged pressure:**
- Exceeds system capacity → overload
- Concentrates in single point → cascading failure
- Bypasses safety mechanisms → hostile manipulation
- Creates noise gradient → signal loss

**Pressure Management ensures:**
- Pressure is **visible** (measurable)
- Pressure is **bounded** (cannot exceed capacity)
- Pressure is **distributed** (no single point of failure)
- Pressure is **accountable** (auditable, not secret)

---

## 2. Threat Model (Human-Scale Coordination Failures)

### **2.1 Cascading Failures**

**Description**: One component fails, triggering chain reaction across dependent systems.

**Example**:
- Finance department reconciliation fails
- Blocks engineering budget approval
- Engineering cannot purchase infrastructure
- Infrastructure failures block deployment
- Deployment failures cascade to customer service
- Customer service cannot respond to incidents
- **System-wide collapse**

**Relay Defense**:
- **Ring isolation** (failure contained to basin)
- **Graceful degradation** (partial function continues)
- **Emergency reconciliation** (priority pathways activated)

### **2.2 Hostile Manipulation**

**Description**: Adversarial actors inject pressure to force specific outcomes or destabilize coordination.

**Example**:
- Attacker floods voting system with noise
- Real votes diluted by coordinated spam
- Reconciliation confidence drops below threshold
- System enters indeterminate state
- Coordination halts

**Relay Defense**:
- **Pressure budget enforcement** (Invariant 1)
- **Vote-weight authentication** (identity-bound force)
- **Confidence floor** (Invariant 2 - never falsely reassure)
- **Attestation auditing** (all pressure visible)

### **2.3 Misinformation Pressure**

**Description**: Coordinated injection of false signals to corrupt reconciliation process.

**Example**:
- Bot network submits false attestations
- Three-way match detects Intent/Reality divergence
- But volume overwhelms verification capacity
- System cannot distinguish signal from noise
- Reconciliation freezes

**Relay Defense**:
- **Rate limiting** (pressure budget per agent)
- **Reputation weighting** (proven agents carry more force)
- **Confidence tracking** (low confidence → indeterminate state)
- **Pressure feed transparency** (all signals visible)

### **2.4 Economic Coercion**

**Description**: Market forces or resource gatekeeping used to force coordination outcomes.

**Example**:
- Single vendor controls critical dependency
- Vendor threatens withdrawal unless specific reconciliation outcome
- Organization forced to comply
- Coordination captured by economic pressure

**Relay Defense**:
- **Dependency visibility** (filament topology shows single points)
- **Redundancy scoring** (alerts on single-vendor risk)
- **Alternative path mapping** (shows escape routes)
- **Pressure source tracking** (who applies force)

### **2.5 Authoritarian Capture**

**Description**: Concentration of authority allowing single actor to override coordination mechanisms.

**Example**:
- CEO demands specific reconciliation outcome
- Overrides vote-weighted consensus
- Policy governance broken
- System becomes command hierarchy

**Relay Defense**:
- **Vote-weighted reconciliation** (no override mechanism)
- **Policy governance** (Invariant 5 - learning recommends, cannot mutate)
- **Authority scope visibility** (ring boundaries explicit)
- **Scar permanence** (override attempts visible forever)

### **2.6 Infrastructure Collapse**

**Description**: Critical infrastructure failure disrupts coordination continuity.

**Example**:
- Data center failure
- Git repository becomes unavailable
- Coordination halts (no filament access)
- Organization paralyzed

**Relay Defense**:
- **Distributed replication** (every agent has full clone)
- **Offline-first coordination** (local reconciliation)
- **Eventual consistency** (sync when connectivity restored)
- **No central dependency** (Git's native model)

---

## 3. Pressure Detection

### **3.1 What We Measure**

**Pressure is force applied toward reconciliation.**

Measurable dimensions:
- **Volume** (how many pressure events)
- **Rate** (events per time unit)
- **Source distribution** (concentrated vs distributed)
- **Direction** (toward which core)
- **Weight** (force per agent)
- **Confidence** (three-way match quality)

### **3.2 Detection Thresholds**

```javascript
pressureThresholds = {
  // Invariant 1: Pressure Budget
  global: {
    maxOpsPerSecond: 1000,        // Total system capacity
    maxOpsPerMinute: 50000,       // Burst tolerance
    refusalThreshold: 0.9         // Refuse at 90% capacity
  },
  
  perAnchor: {
    maxOpsPerSecond: 100,         // Single filament capacity
    maxOpsPerMinute: 5000,
    refusalThreshold: 0.85
  },
  
  perOperator: {
    maxOpsPerSecond: 10,          // Single agent capacity
    maxOpsPerMinute: 500,
    refusalThreshold: 0.8
  },
  
  // Invariant 2: Confidence Floor
  confidence: {
    minimumForDisplay: 0.7,       // Below this = "indeterminate"
    minimumForReconciliation: 0.75, // Below this = block merge
    degradedRange: [0.7, 0.85],   // Show as "degraded"
    verifiedThreshold: 0.85       // Above this = "verified"
  },
  
  // Rate anomaly detection
  rateAnomalies: {
    suddenSpikeMultiplier: 5,     // 5x normal = anomaly
    sustainedLoadMultiplier: 3,   // 3x sustained = overload
    detectionWindow: "5m"         // Sliding window
  }
}
```

### **3.3 Pressure Feed Integration**

All pressure events stream to **Pressure Feed** (SSE):

```javascript
// From PRESSURE-FEED-SPECIFICATION.md
pressureFeedCategories = [
  "attestation",      // Vote/approval events
  "drift",            // Three-way match divergence
  "repair",           // Staged repair proposals
  "confidence",       // ERI changes
  "reconciliation",   // Merge events
  "authority"         // Permission/scope changes
]
```

**Detection uses this feed:**
1. Subscribe to all categories
2. Measure volume, rate, distribution
3. Compare against thresholds
4. Emit alerts when exceeded

---

## 4. Graceful Degradation

### **4.1 Degradation Levels**

**Relay does NOT crash. Relay degrades gracefully.**

```javascript
degradationLevels = {
  NORMAL: {
    eri: "> 85",
    confidence: "> 85%",
    operations: "all enabled",
    latency: "< 100ms",
    message: null
  },
  
  DEGRADED: {
    eri: "70-85",
    confidence: "70-85%",
    operations: "read + vote (repairs queued)",
    latency: "< 500ms",
    message: "⚠️ System under pressure. Reconciliation delayed."
  },
  
  INDETERMINATE: {
    eri: "< 70",
    confidence: "< 70%",
    operations: "read only (no voting)",
    latency: "< 1s",
    message: "⚠️ Cannot verify state. Reconciliation blocked."
  },
  
  REFUSAL: {
    eri: "N/A",
    confidence: "N/A",
    operations: "refuse new requests",
    latency: "immediate",
    message: "❌ System at capacity. Please retry in [time]."
  }
}
```

### **4.2 Degradation Actions**

**When pressure exceeds threshold:**

1. **NORMAL → DEGRADED**
   - Queue non-critical operations
   - Prioritize reconciliation over exploration
   - Display warning to users
   - Continue core functions

2. **DEGRADED → INDETERMINATE**
   - Block new reconciliation attempts
   - Display "cannot verify" state
   - Allow read-only access
   - Emit high-priority alert

3. **INDETERMINATE → REFUSAL**
   - Refuse new operations (Invariant 1)
   - Display backoff timer
   - Preserve existing state
   - Prevent cascading failure

**Degradation is ALWAYS visible.**  
**Users see exact system state, never hidden.**

---

## 5. Ring-Level Isolation

### **5.1 Isolation Principle**

**Failures must be contained within basin boundaries.**

When one ring fails:
- Other rings continue functioning
- Reconciliation to failed ring pauses
- Filaments within failed ring remain accessible
- Cross-ring dependencies degrade gracefully

### **5.2 Isolation Mechanism**

```javascript
ringIsolation = {
  boundary: "encryption_boundary",  // From c14
  mechanism: "pressure_decoupling",
  
  onFailure: {
    withinRing: {
      reconciliation: "paused",
      reads: "continue",
      writes: "queued",
      visibility: "preserved"
    },
    
    crossRing: {
      dependencies: "marked_degraded",
      fallback: "use_cached_state",
      timeout: "exponential_backoff",
      escalation: "notify_authority"
    }
  }
}
```

### **5.3 Example: Finance Ring Failure**

```
Company Ring (Acme Corp)
  ├─ Engineering Ring ✅ (continues operating)
  ├─ Finance Ring ❌ (overload detected)
  └─ Operations Ring ✅ (continues operating)

Finance Ring Status:
- ERI: 45 (INDETERMINATE)
- Confidence: 62% (below floor)
- Operations: Read-only
- Reconciliation: Blocked

Cross-Ring Impact:
- Engineering budget approval: DEGRADED (using cached)
- Operations expense tracking: DEGRADED (using cached)
- Company-wide canonical: DEGRADED (finance excluded)

User Message:
"⚠️ Finance coordination unavailable. Budget approvals delayed.
Engineering and Operations continue normally."
```

**Isolation prevents total system collapse.**

---

## 6. Emergency Reconciliation Throttles

### **6.1 When Pressure Exceeds Capacity**

**Problem**: Too many reconciliation attempts overwhelm system.

**Solution**: Priority-based throttling.

### **6.2 Reconciliation Priority Classes**

```javascript
reconciliationPriorities = {
  CRITICAL: {
    examples: [
      "security_patch",
      "infrastructure_failure_fix",
      "data_integrity_repair"
    ],
    throttle: "never",
    queue: "bypass",
    authority: "emergency_override"
  },
  
  HIGH: {
    examples: [
      "production_deployment",
      "customer_facing_fix",
      "compliance_requirement"
    ],
    throttle: "minimal",
    queue: "priority",
    authority: "ring_consensus"
  },
  
  NORMAL: {
    examples: [
      "feature_merge",
      "documentation_update",
      "refactoring"
    ],
    throttle: "standard",
    queue: "fifo",
    authority: "vote_weighted"
  },
  
  LOW: {
    examples: [
      "experimental_feature",
      "speculative_work",
      "exploratory_branch"
    ],
    throttle: "aggressive",
    queue: "deferred",
    authority: "vote_weighted"
  }
}
```

### **6.3 Throttle Algorithm**

```javascript
function shouldReconcile(request) {
  const currentLoad = getCurrentPressureLoad();
  const capacity = getSystemCapacity();
  const utilization = currentLoad / capacity;
  
  // Invariant 1: Pressure Budget
  if (utilization > 0.9) {
    if (request.priority !== "CRITICAL") {
      return refusal("System at capacity. Retry in 30s.");
    }
  }
  
  // Priority gating
  if (request.priority === "LOW" && utilization > 0.7) {
    return queued("Low-priority reconciliation deferred.");
  }
  
  if (request.priority === "NORMAL" && utilization > 0.85) {
    return queued("Normal-priority reconciliation queued.");
  }
  
  // Confidence check (Invariant 2)
  const confidence = calculateThreeWayMatch(request);
  if (confidence < 0.75) {
    return blocked("Confidence below floor. Cannot reconcile.");
  }
  
  return allowed();
}
```

### **6.4 Emergency Override**

**CRITICAL priority can bypass throttle.**

**Conditions for emergency override:**
1. Designated authority approves (not automated)
2. Justification logged (auditable)
3. Scar recorded (visible forever)
4. Post-incident review required

**This is NOT a backdoor.**  
**This is break-glass emergency response.**

---

## 7. Pressure Distribution Monitoring

### **7.1 Centralization Detection**

**Problem**: Pressure concentrating in single point = cascading failure risk.

**Detection**:
```javascript
function detectCentralization(pressureEvents) {
  const sourceDistribution = groupBy(pressureEvents, 'source');
  const totalPressure = sum(pressureEvents.map(e => e.weight));
  
  for (const [source, events] of sourceDistribution) {
    const sourceWeight = sum(events.map(e => e.weight));
    const concentration = sourceWeight / totalPressure;
    
    if (concentration > 0.5) {
      alert({
        type: "CENTRALIZATION_RISK",
        source: source,
        concentration: `${(concentration * 100).toFixed(1)}%`,
        message: "Single source controls >50% of pressure",
        recommendation: "Distribute authority or add redundancy"
      });
    }
  }
}
```

### **7.2 Dependency Mapping**

**From c14: Filaments show dependency chains.**

```javascript
dependencyRisk = {
  singleVendor: "RED",      // One supplier, no alternative
  twoVendors: "YELLOW",     // Two suppliers, fragile
  threeOrMore: "GREEN",     // Multiple suppliers, resilient
  
  action: {
    RED: "Immediate redundancy planning required",
    YELLOW: "Monitor closely, prepare alternatives",
    GREEN: "Acceptable risk profile"
  }
}
```

**Globe visualization shows:**
- Single-point dependencies as **red filaments**
- Redundant paths as **green filaments**
- Bottlenecks as **heat zones**

---

## 8. Pressure Management API

### **8.1 Pressure Query**

```javascript
GET /api/pressure/current
Response: {
  global: {
    utilization: 0.67,
    capacity: 1000,
    current: 670,
    status: "NORMAL"
  },
  rings: [
    {
      ringId: "acme.engineering",
      utilization: 0.82,
      status: "DEGRADED",
      message: "High reconciliation rate"
    }
  ],
  agents: [
    {
      agentId: "alice",
      utilization: 0.45,
      status: "NORMAL"
    }
  ]
}
```

### **8.2 Pressure History**

```javascript
GET /api/pressure/history?window=24h
Response: {
  timeseries: [
    { timestamp: "2026-01-31T00:00:00Z", utilization: 0.34 },
    { timestamp: "2026-01-31T01:00:00Z", utilization: 0.42 },
    // ...
  ],
  anomalies: [
    {
      timestamp: "2026-01-31T14:23:00Z",
      type: "SPIKE",
      multiplier: 6.2,
      duration: "3m",
      source: "automated_deployment"
    }
  ]
}
```

### **8.3 Throttle Status**

```javascript
GET /api/pressure/throttles
Response: {
  active: true,
  level: "DEGRADED",
  queued: [
    {
      requestId: "req-123",
      priority: "NORMAL",
      queuedAt: "2026-01-31T14:25:00Z",
      estimatedWait: "5m"
    }
  ],
  refused: [
    {
      requestId: "req-456",
      priority: "LOW",
      refusedAt: "2026-01-31T14:26:00Z",
      retryAfter: "30s"
    }
  ]
}
```

---

## 9. Coupling to Resilience & Defense

**Pressure Management is REQUIRED for Resilience & Defense.**

**Why coupling exists:**
1. **Detection requires visibility** (pressure feed)
2. **Response requires control** (throttles, isolation)
3. **Defense requires boundaries** (ring isolation)
4. **Resilience requires measurement** (confidence, ERI)

**Without Pressure Management:**
- Cannot detect hostile manipulation (no visibility)
- Cannot respond to overload (no throttles)
- Cannot isolate failures (no boundaries)
- Cannot verify resilience (no measurement)

**Pressure Management is the sensory and control system.**  
**Resilience & Defense are the response protocols.**

**They are coupled by design.**

---

## 10. Governance Constraints

### **10.1 No Secrecy-By-Obscurity**

**All pressure management is visible:**
- Thresholds published (in this document)
- Current utilization public (API)
- Throttle decisions auditable (logged)
- Refusal reasons explicit (user-facing)

**No hidden controls.**  
**No secret limits.**  
**No invisible authority.**

### **10.2 No Central Kill Switch**

**There is NO mechanism to:**
- Shut down entire system
- Override all ring consensus
- Delete reconciliation history
- Hide pressure events

**Emergency override:**
- Scoped to single critical reconciliation
- Requires explicit authority approval
- Logged and auditable
- Post-incident review mandatory

**Kill switches create single point of failure.**  
**Relay has none.**

### **10.3 No Invisible Authority**

**All authority is:**
- Ring-scoped (basin boundaries)
- Vote-weighted (force proportional to stake)
- Auditable (scar-based history)
- Challengeable (policy governance)

**No hidden admins.**  
**No secret controllers.**  
**All authority visible.**

---

## 11. Summary

**Pressure Management System enables:**

✅ Detection of overload (thresholds, monitoring)  
✅ Graceful degradation (never crash, always visible)  
✅ Ring-level isolation (failures contained)  
✅ Emergency throttles (priority-based queuing)  
✅ Distribution monitoring (centralization alerts)  
✅ Transparent governance (no secrecy)  

**This protects against:**

❌ Cascading failures  
❌ Hostile manipulation  
❌ Misinformation pressure  
❌ Economic coercion  
❌ Authoritarian capture  
❌ Infrastructure collapse  

**This is NOT:**
- Security theater
- Speculative threat modeling
- Alien defense (not external, human-scale)

**This IS:**
- Systems engineering
- Testable, mechanical, auditable
- Boring, reliable safety

---

**Status**: LOCKED ✅  
**Next**: Planetary Resilience & Defense Actions (coupled document)

---

**Last Updated**: 2026-01-31  
**Depends On**: c14 (Surface Coordination Geometry), Pressure System Invariants
