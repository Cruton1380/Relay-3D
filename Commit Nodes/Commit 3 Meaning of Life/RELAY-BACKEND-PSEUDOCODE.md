# 🔧 RELAY BACKEND PSEUDOCODE

**Purpose**: Exact computation loop for generating render packets  
**Stage**: Stage 1 (coordination physics rendering, not execution)  
**Flow**: ERI → Gradient → Constraints → Packet  
**Status**: LOCKED ✅

---

## 🎯 OVERVIEW

This is the **exact Stage 1 computation loop** for rendering coordination physics, not executing actions.

**Backend responsibilities**:
1. Compute ERI from three-way match (Intent, Reality, Projection)
2. Compute ERI gradients on dependency graph
3. Evaluate constraint membranes & gates
4. Mark streamlines as allowed vs blocked
5. Emit render packet (conforming to `RELAY-RENDER-PACKET.schema.json`)

**Frontend responsibilities**:
- Consume packet
- Render funnels, streamlines, membranes, gates, scars
- **NEVER recompute ERI, gradients, or constraints**

---

## 📐 PART 1: COMPUTE ERI FROM THREE-WAY MATCH

### **1.1 Load State**

```pseudocode
for each anchor i in system:
  intent   = load_intent_state(i)      // Policy reference, rule definitions
  reality  = load_reality_state(i)     // Evidence refs, attestations, telemetry (if any)
  proj     = load_projection_state(i)  // Dashboards, summaries (non-authoritative)
```

**Sources**:
- `intent`: Policy filaments, commit-addressed rules
- `reality`: Evidence packs (Merkle-hashed), attestations, telemetry (via State Anchoring Contracts)
- `proj`: Dashboard state, reports, UI projections (read-only)

---

### **1.2 Compute Mismatch**

```pseudocode
  // Three-way match mismatch
  delta_i = α * d(intent, reality) + β * d(reality, proj) + γ * d(intent, proj)
```

**Weights** (configurable by policy):
- `α`: Intent vs Reality mismatch weight
- `β`: Reality vs Projection mismatch weight
- `γ`: Intent vs Projection mismatch weight

**Mismatch metric** `d(·)`:
- Boolean: `0` if aligned, `1` if mismatched
- Continuous: Normalized distance (e.g., edit distance, semantic diff)
- Structural: Count of missing fields, type mismatches, etc.

---

### **1.3 Compute ERI + Confidence**

```pseudocode
  (eri_i, conf_i, missing_inputs_i) = ERI_MODEL(delta_i, conditions, missing_inputs)
```

**ERI Model** (from control-systems proof):
```pseudocode
function ERI_MODEL(delta, conditions, missing_inputs):
  // Aggregate preconditions (V/C/P/A/R taxonomy)
  visibility_risk = conditions.visibility_exposure     // 0-1
  config_risk     = conditions.configuration_drift     // 0-1
  patch_risk      = conditions.patch_lag               // 0-1
  authority_risk  = conditions.authority_gaps          // 0-1
  recovery_risk   = conditions.recovery_readiness      // 0-1
  
  // Raw ERI (weighted sum or max)
  eri_raw = max(visibility_risk, config_risk, patch_risk, authority_risk, recovery_risk)
  
  // Confidence (inverse of missing inputs)
  total_inputs = count(required_inputs)
  available_inputs = total_inputs - count(missing_inputs)
  confidence = available_inputs / total_inputs
  
  return (eri_raw, confidence, missing_inputs)
```

---

### **1.4 Compute Display State**

```pseudocode
  if conf_i < CONF_FLOOR:
      display_state = "indeterminate"
  else if conf_i < DEGRADE_FLOOR:
      display_state = "degraded"
  else:
      display_state = "verified"
  
  // Effective potential (for rendering)
  effective_potential = eri_i * conf_i
  blur = 1 - conf_i
```

**Thresholds** (configurable):
- `CONF_FLOOR`: Minimum confidence for any display (default: `0.3`)
- `DEGRADE_FLOOR`: Minimum confidence for "verified" (default: `0.7`)

---

## 📊 PART 2: COMPUTE ERI GRADIENTS ON DEPENDENCY GRAPH

### **2.1 Load Dependency Graph**

```pseudocode
graph = dependency_graph()  // Edges i → j with weight w_ij
```

**Dependency types**:
- Workflow dependency (Task A must complete before Task B)
- Policy dependency (Policy X references Policy Y)
- Authority delegation (User A delegates to User B)
- Evidence dependency (Evidence E1 required for Evidence E2)

**Edge weights** `w_ij`:
- Strength of dependency (0-1)
- High weight = strong coupling (failure propagates)
- Low weight = weak coupling (failure isolated)

---

### **2.2 Compute Gradient Contributions**

```pseudocode
for each anchor i:
  grad_mag = 0
  streamlines = []
  
  for each neighbor j in N(i):
     deltaE = eri_j - eri_i
     w = weight(i, j)
     
     // Gradient contribution along edge i → j
     contrib = w * deltaE
     
     // Downhill path is toward lower ERI (repair direction)
     direction = (deltaE <= 0) ? "downhill" : "uphill"
     
     streamlines.append({
        from_anchor_id: i,
        to_anchor_id: j,
        magnitude: abs(contrib),
        direction: direction,
        state: "unknown"  // Constraints will mark allowed/blocked later
     })
  
  store streamlines for anchor i
```

**Interpretation**:
- `direction == "downhill"`: Repair path (moving to lower ERI)
- `direction == "uphill"`: Risk propagation (moving to higher ERI)
- `magnitude`: Slope steepness (determines line thickness in rendering)

---

## 🔒 PART 3: EVALUATE CONSTRAINT MEMBRANES & GATES

### **3.1 Constraint Evaluation Function**

```pseudocode
function eval_constraints(anchor i):
  membranes = []
  gates = []
  
  // 0) SYSTEM MODE: SIMULATION blocks all execution
  if system_mode == SIMULATION:
     membranes.add({
        type: "stage_gate",
        active: true,
        reason_code: "SIMULATION_MODE",
        explanation: "System in read-only SIMULATION mode. No commits allowed."
     })
     gates.add({
        type: "execute_commit",
        state: "closed",
        reason_code: "SIMULATION_MODE",
        next_steps: [
           "Review repair proposals in simulation",
           "Request mode transition to LIVE (requires authority)"
        ]
     })
  
  // 1) STAGE GATE: Global stage controls allowed action classes
  if action_requires_future_stage(i):
     membranes.add({
        type: "stage_gate",
        active: true,
        reason_code: "GLOBAL_STAGE_LOCK",
        explanation: "Action requires Stage 2+, but global stage is Stage 1."
     })
     gates.add({
        type: "advance_stage",
        state: "closed",
        reason_code: "GLOBAL_STAGE_LOCK",
        next_steps: [
           "Wait for global stage advancement (governance process)",
           "Simulate Stage 2 actions in individual stage gate"
        ]
     })
  
  // 2) AUTHORITY: Missing or expired authorityRef
  if authority_missing_or_expired(i):
     membranes.add({
        type: "authority",
        active: true,
        reason_code: "AUTHORITY_MISSING_OR_EXPIRED",
        explanation: "No valid authorityRef attached, or authority expired."
     })
     gates.add({
        type: "execute_commit",
        state: "closed",
        reason_code: "AUTHORITY_MISSING_OR_EXPIRED",
        next_steps: [
           "Request delegation from authorized user",
           "Attach valid authorityRef to action",
           "Renew expired authority (requires justification)"
        ]
     })
  
  // 3) PRESSURE BUDGET: Exceeded audit/dispute capacity
  if pressure_budget_exceeded(scope(i)):
     membranes.add({
        type: "pressure_budget",
        active: true,
        reason_code: "PRESSURE_BUDGET_EXCEEDED",
        explanation: "Scope has exhausted pressure budget (too many audits/disputes)."
     })
     gates.add({
        type: "execute_commit",
        state: "closed",
        reason_code: "PRESSURE_BUDGET_EXCEEDED",
        next_steps: [
           "Retry later (after cooldown period)",
           "Reduce active disputes (close drift objects)",
           "Request budget increase (governance)"
        ]
     })
  
  // 4) COGNITIVE LOAD: Assigned actor overloaded
  if assigned_actor_overloaded(i):
     membranes.add({
        type: "cognitive_load",
        active: true,
        reason_code: "COGNITIVE_LOAD_EXCEEDED",
        explanation: "Assigned user has exceeded cognitive load capacity."
     })
     gates.add({
        type: "assign_role",
        state: "closed",
        reason_code: "COGNITIVE_LOAD_EXCEEDED",
        next_steps: [
           "Round-robin rotate role to another user",
           "Schedule recovery window (mandatory cooldown)",
           "Defer task until load decreases"
        ]
     })
  
  // 5) FEDERATION BOUNDARY: Action crosses boundary without permission
  if export_or_action_crosses_federation(i) and not boundary_allows(i):
     membranes.add({
        type: "federation_boundary",
        active: true,
        reason_code: "FEDERATION_BOUNDARY_BLOCK",
        explanation: "Action crosses federation boundary without explicit acceptance."
     })
     gates.add({
        type: "export_evidence",
        state: "closed",
        reason_code: "FEDERATION_BOUNDARY_BLOCK",
        next_steps: [
           "Request evidence export approval from receiving federation",
           "Declare incompatibility (acknowledge divergence)",
           "Keep action within federation boundary"
        ]
     })
  
  return (membranes, gates)
```

---

## 🌊 PART 4: MARK STREAMLINES ALLOWED VS BLOCKED

```pseudocode
for each anchor i:
  (membranes, gates) = eval_constraints(i)
  
  // Check if ANY gate of type "execute_commit" is closed
  blocked = any(gate.type == "execute_commit" and gate.state == "closed" for gate in gates)
  
  for each streamline s in streamlines[i]:
     if s.direction == "downhill":
        // Downhill streamlines are repair paths
        s.state = blocked ? "blocked" : "allowed"
     else:
        // Uphill streamlines are not repair paths
        s.state = "unknown"
```

**Rendering rule**:
- `state == "allowed"`: Green streamline (repair path is passable)
- `state == "blocked"`: Gray streamline (repair path terminates at membrane)
- `state == "unknown"`: Gray/dashed streamline (not a repair path)

---

## 📦 PART 5: EMIT RENDER PACKET

### **5.1 Initialize Packet**

```pseudocode
packet = {
  schema_version: "relay-render-packet-v1",
  system_mode: system_mode,  // "SIMULATION" or "LIVE"
  generated_at: now(),       // ISO 8601 timestamp
  policy_ref: current_policy_commit_ref(),  // For auditability
  anchors: []
}
```

---

### **5.2 Build Anchor Objects**

```pseudocode
for each anchor i:
  // Build funnel object
  funnel = {
     eri: eri_i,
     confidence: conf_i,
     depth: eri_i * conf_i,  // Effective potential Ẽ
     blur: 1 - conf_i,
     display_state: display_state_i  // "verified", "degraded", "indeterminate"
  }
  
  // Load scars from commit history
  scars = scars_from_history(i)  // Reconciliation events, merges, policy changes
  
  // Build anchor object
  packet.anchors.append({
     anchor_id: i,
     scope: scope(i),
     funnel: funnel,
     streamlines: streamlines[i],
     membranes: membranes[i],
     gates: gates[i],
     scars: scars
  })
```

---

### **5.3 Return Packet**

```pseudocode
return packet  // Conforms to RELAY-RENDER-PACKET.schema.json
```

**Validation**:
- Packet MUST validate against JSON Schema
- All required fields present
- All enums valid
- All numbers in range [0, 1]
- `additionalProperties: false` (no extra fields allowed)

---

## ✅ WHAT THIS GIVES CANON IMMEDIATELY

### **1. Strict Backend/Frontend Contract**
- Backend generates packets
- Frontend consumes packets
- **No math recomputation in frontend** (prevents drift)

### **2. ERI "Potential Surface" + Confidence Blur**
- ERI is scalar potential (0-1)
- Confidence modulates display (blur, indeterminate state)
- No crisp gradients from uncertain data

### **3. Repair Slope as Downhill Streamlines**
- Gradients computed on dependency graph
- Downhill direction = -∇E (toward lower ERI)
- Magnitude = slope steepness (line thickness)

### **4. Constraint Membranes That Block Motion**
- Five constraint types (stage, authority, budget, load, federation)
- `active: true` → membrane visible, streamlines terminate
- `active: false` → membrane invisible

### **5. Gates That Match Refusal UX Exactly**
- Gate states computed by backend (NOT UI toggles)
- `state: "closed"` → refusal with reason code + next steps
- `state: "open"` → action allowed (constraints satisfied)

---

## 🔗 CROSS-REFERENCES

This pseudocode implements:
- **`RELAY-CONTROL-SYSTEMS-PROOF.md`** — Mathematical foundation (ERI, gradients, gates)
- **`RELAY-RENDER-PACKET-SCHEMA.md`** — Output format (JSON schema validation)
- **`RELAY-RENDER-PACKET.schema.json`** — Machine-validated contract
- **`CANON-RELAY-CORE-IMPLEMENTATION.md`** — System mode, constraints, enforcement

---

## 🔒 FINAL LOCK

**"Backend computes. Frontend renders. This boundary is immutable."**

If the frontend can compute it, the packet should have already computed it.

---

**Status**: LOCKED ✅  
**Version**: 1.0.0  
**Next**: Canon implements this loop; frontend validates packets against schema.
