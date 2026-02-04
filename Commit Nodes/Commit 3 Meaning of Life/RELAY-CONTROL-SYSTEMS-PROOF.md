# RELAY CONTROL-SYSTEMS PROOF

**Purpose**: Formal proof that Relay prevents unbounded divergence in coordination systems using control theory, scalar potential fields, and constraint gating.

**For**: Canon (implementation) and HUD (visualization)

**Status**: LOCKED ✅

---

## 1) RELAY CONTROL-SYSTEMS PROOF (PROOF SKETCH)

### 1.1 System Model

Let the coordination world be a set of stateful objects \(i \in O\) (tasks, policies, decisions, workflows, etc.).

Each object has a **triple-state representation** (Relay's three-way match):

\[
x_i(t) = (I_i(t), R_i(t), P_i(t))
\]

- **\(I\)**: intent state (policy / plan)
- **\(R\)**: observed reality (evidence / telemetry)
- **\(P\)**: projection (reports / dashboards)

A **coherent object** satisfies:

\[
\Delta_i(t) = d(I_i(t), R_i(t), P_i(t)) = 0
\]

where \(d(\cdot)\) is a mismatch metric (defined below).

---

### 1.2 The Problem (2D Instability)

In 2D systems, actions can occur based on projection or implicit authority. That introduces **unmodeled inputs**:

- hidden overrides
- silent retries
- cache/index treated as truth
- admin fixes without trace

**Control-theory translation**:

- The plant has **unobserved inputs** \(w(t)\)
- The controller sees **partial output** \(y(t)\)
- The system becomes **non-identifiable** and can diverge (chaos-like)

---

### 1.3 Relay's Control Objective

Relay does not optimize for speed. It **stabilizes coordination** by enforcing:

#### **Goal 1 — Observability (replayable truth)**
Every state-changing act must be logged as a discrete event (commit).  
**No commit → no state transition.**

#### **Goal 2 — Controllability under constraints**
Actions are permitted only if constraints are satisfied.

#### **Goal 3 — Bounded growth of mismatch**
Mismatch cannot grow silently; it becomes a first-class object (drift/refusal) and blocks closure.

---

### 1.4 Relay Controller Structure

Relay implements a **constrained controller** with three enforcement layers:

#### **A) Discretization (sampled-time system)**

Time advances only through commits \(k \in \mathbb{N}\):

\[
x_i[k+1] = f(x_i[k], u_i[k])
\]

**No continuous dynamics exist in the coordination substrate.**

---

#### **B) Constraint gate (hard safety filter)**

Relay applies a feasibility filter:

\[
u_i[k] \in U_i[k] \text{ only if } g(u_i[k], x[k]) \leq 0
\]

Where \(g\) encodes:

- `authorityRef` validity
- stage gate activation
- pressure budget
- cognitive load
- federation boundary rules

If \(u_i[k] \notin U_i[k]\), Relay emits a **refusal** instead of applying it:

\[
x_i[k+1] = x_i[k]
\]

**This is key**: illegal inputs are rejected, not "handled."

---

#### **C) Drift closure requirement (no silent divergence)**

A process cannot close unless:

\[
\exists k \text{ such that } \Delta_i[k] = 0
\]

If \(\Delta_i[k] > 0\), Relay creates a **drift object** and blocks closure.

---

### 1.5 Stability Claim (What Relay "Proves")

**Claim**: Relay prevents unbounded divergence caused by hidden inputs.

**Because**:

1. No silent inputs exist (everything is a commit)
2. Illegal transitions are filtered (gates/refusals)
3. Mismatch cannot be ignored (drift objects block closure)
4. Human control surfaces are bounded (pressure budgets, cognitive load, round-robin)

**So the system is stable in the coordination sense**:

- state remains replayable
- illegitimate actions do not apply
- divergence becomes visible structure (branches/drift)
- growth in mismatch is bounded by refusal + capacity

**This is not "predicting the future."  
This is guaranteeing bounded behavior.**

---

## 2) ERI GRADIENTS REPLACE FORCE EQUATIONS

### 2.1 Define ERI as a Scalar Potential

For each object/anchor \(i\), define:

\[
E_i \in [0, 1]
\]

- \(E_i = 0\): no exposure preconditions observed
- \(E_i = 1\): critical exposure preconditions observed

Add confidence \(c_i \in [0, 1]\). Relay displays:

- **indeterminate** if \(c_i < c_{\min}\)

Define **effective potential**:

\[
\tilde{E}_i = E_i \cdot c_i
\]

---

### 2.2 Define Mismatch Contribution (Three-Way Match)

Let mismatch be:

\[
\Delta_i = \alpha \, d(I_i, R_i) + \beta \, d(R_i, P_i) + \gamma \, d(I_i, P_i)
\]

with weights \(\alpha, \beta, \gamma\) set by policy.

This mismatch feeds ERI:

\[
E_i = h(\Delta_i, \text{missing\_inputs}, \text{authority\_gaps}, \text{patch\_lag}, \dots)
\]

(You already have condition taxonomy **V/C/P/A/R**—this is the formal hook.)

---

### 2.3 Gradient is the "Direction of Rising Risk"

Over a graph of dependencies (filaments/edges), define neighborhood \(N(i)\).

**Discrete gradient**:

\[
(\nabla E)_i = \sum_{j \in N(i)} w_{ij} \, (E_j - E_i) \, \hat{e}_{ij}
\]

- \(\hat{e}_{ij}\) is the unit direction along edge \(i \to j\)
- \(w_{ij}\) is dependency weight (how strongly \(j\) affects \(i\))

**Interpretation**:

- large positive gradient means **risk is rising upstream**
- negative direction \(-\nabla E\) is the **repair descent direction**

---

### 2.4 Repair as Constrained Gradient Descent

In physics, force moves you downhill in potential.

In Relay, **repair proposes actions that would reduce ERI**:

\[
u^* = \arg\min_{u \in U} \left( E(x, u) + \lambda \, \text{cost}(u) \right)
\]

But we must obey constraints:

\[
u^* \in U_{\text{allowed}} \quad \text{(authority/stage/budget/load/federation)}
\]

**If no allowed descent exists**:

- Emit **refusal** with reason ("gate closed")
- Do **not** "approximate" a move

**That is Relay replacing**:

**"force equation" → "allowed ERI descent"**

---

## 3) MAP TO VISUALIZATION: FUNNELS, MEMBRANES, GATES

This is the **render grammar for the HUD**.

### 3.1 Funnels = ERI Scalar Potential

Render a **funnel** under each anchor/object:

- **Depth** = \(\tilde{E}_i\) (risk × confidence)
- **Width** = scope size / blast radius
- **Blur/fog** = \(1 - c_i\) (low confidence → fuzzy funnel)

**Rule**: no crisp funnel when confidence is low.

---

### 3.2 Streamlines = ERI Gradient (Repair Slope)

When user **HOLDs** or requests **"repair paths"**:

- draw **streamlines** along dependency edges
- **direction** = \(-\nabla E\) (downhill)
- **thickness** = \(|\nabla E|\) (how steep the slope is)
- **color** = stage of readiness (green allowed, gray blocked)

---

### 3.3 Membranes = Constraint Fields

Constraints are rendered as **membranes** that appear only when active:

- **Stage gate membrane** (system-wide)
- **Authority membrane** (per scope)
- **Pressure budget membrane** (per domain)
- **Cognitive load membrane** (per person)
- **Federation boundary membrane** (between communities)

**Membrane properties**:

- translucent surface
- labeled on hover with **refusal reason**
- acts like a wall: **streamlines terminate on contact**

---

### 3.4 Gates = Discrete Valves in Membranes

Where a membrane can be crossed, render a **gate**:

- **open gate**: action allowed (authority valid, stage active, capacity available)
- **closed gate**: refusal (explain missing inputs)

**Gate states are not UI toggles; they are computed.**

---

### 3.5 Scars = Reconciliation Events

When drift is resolved or branches merge:

- render a **scar** at the convergence point
- scars are **permanent, darker segments**
- clicking scar shows:
  - what diverged
  - what closed it
  - which constraints were satisfied

---

## 4) MINIMAL "PROOF-TO-HUD" CHECKLIST (Canon Implementer View)

To implement the above, Canon needs:

### **Backend (Computation)**

1. **Compute ERI scalar** \(\tilde{E}\) per anchor, with confidence gating
2. **Compute dependency graph weights** \(w_{ij}\)
3. **Compute discrete gradient** \(\nabla E\) per anchor
4. **Generate candidate repair moves** as "descent steps"
5. **Apply constraint filter** \(U_{\text{allowed}}\)
6. **If allowed**: stage repair; **if not**: refusal with membrane/gate explanation

### **Frontend (Rendering)**

7. **Render funnel** (\(\tilde{E}\))
8. **Render streamlines** (\(-\nabla E\))
9. **Render membranes** (constraints)
10. **Render gates** (valves)
11. **Render scars** (reconciliation)

**This is fully Relay-native.**

---

## 5) ONE LOCK SENTENCE (TO KEEP IT HONEST)

**ERI is the potential. Gradients propose motion. Gates decide if motion is allowed. Refusal is the correct physics when gates are closed.**

---

## 6) WHAT CANON MUST IMPLEMENT

Canon must implement:

### **6.1 ERI Computation Engine**

```yaml
eri_computation:
  input:
    - object_state: (I, R, P)
    - mismatch_weights: (α, β, γ)
    - condition_taxonomy: [V, C, P, A, R]
    - confidence_score: c_i
  output:
    - E_i: raw ERI scalar
    - E_tilde_i: effective ERI (E_i × c_i)
    - display_state: [verified, degraded, indeterminate]
```

### **6.2 Gradient Computation**

```yaml
gradient_computation:
  input:
    - dependency_graph: edges (i → j) with weights w_ij
    - ERI_field: {E_i for all i}
  output:
    - grad_E_i: discrete gradient vector per anchor
    - repair_direction: -grad_E_i (downhill)
    - slope_magnitude: |grad_E_i|
```

### **6.3 Constraint Gating**

```yaml
constraint_gate:
  input:
    - proposed_action: u
    - current_state: x[k]
  constraints:
    - authorityRef_valid: expires_at > now
    - stage_gate_active: global_stage allows u
    - pressure_budget: remaining > 0
    - cognitive_load: user load < cap
    - federation_boundary: action within scope
  output:
    - allowed: true/false
    - refusal_reason: which constraint failed
    - gate_state: open/closed
```

### **6.4 Render Packet Schema**

```yaml
render_packet:
  anchor_id: i
  funnel:
    depth: E_tilde_i
    width: scope_size
    blur: 1 - c_i
  streamlines:
    direction: -grad_E_i
    thickness: |grad_E_i|
    color: [green, gray, red]
  membranes:
    - type: [stage, authority, pressure, load, federation]
      active: true/false
      label: refusal_reason
  gates:
    - gate_id: g
      state: [open, closed]
      reason: constraint_name
  scars:
    - scar_id: s
      event_type: [merge, reconcile, fork_close]
      commits: [hash1, hash2]
```

---

## 7) CROSS-REFERENCES

This proof provides the mathematical foundation for:

- **`RELAY-3D-VISUALIZATION-SPEC.md`** — Rendering rules (funnels, streamlines, membranes)
- **`CANON-RELAY-CORE-IMPLEMENTATION.md`** — Constraint enforcement (gates, refusals)
- **`RELAY-HUMAN-FLOW-CONTROL-V2.md`** — Cognitive load as constraint field
- **Relay SCV v2.2** — Command 6 (`/relay field ERI`) and Command 7 (`/relay explain repair`)

---

## 8) VALIDATION CRITERIA

Canon's implementation is correct if:

1. **ERI is computable** from (I, R, P) + confidence
2. **Gradients point toward risk** (uphill) and away from safety (downhill)
3. **Refusals cite specific gates** (authority, stage, budget, load, federation)
4. **Streamlines terminate at closed gates** (no "approximation" rendering)
5. **Scars are permanent** (merges/reconciliations are visible forever)
6. **Low confidence → foggy funnels** (never show crisp gradients from uncertain data)

---

## 9) FINAL LOCK

**Relay is not a metaphor.**

- **ERI is a scalar potential field** (computable from state mismatch)
- **Gradients are repair vectors** (computable from dependency graph)
- **Gates are constraint filters** (computable from authority/stage/budget/load/federation)
- **Refusals are physics** (correct system response when gates are closed)

**If you cannot compute these, you cannot render Relay.**

**If you approximate these, you are no longer rendering Relay.**

---

**Status**: LOCKED ✅  
**Next**: Canon implements ERI engine + gradient computation + constraint gating + render packet schema.
