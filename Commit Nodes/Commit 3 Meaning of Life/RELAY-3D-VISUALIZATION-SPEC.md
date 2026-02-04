# 🎨 RELAY 3D VISUALIZATION SPECIFICATION

**Date**: 2026-02-02  
**Status**: CRITICAL FOR STAGE 1  
**Type**: Rendering Rules for Coordination Physics  
**Purpose**: Define how Relay's coordination state is visualized in 3D space

---

## 🎯 CORE PRINCIPLE

**Relay visualization renders coordination physics, not org charts.**

- ❌ Not: Boxes, arrows, hierarchies
- ✅ Is: Fields, flows, constraints in 3D space

**The user must understand state in 1 second by looking at the field.**

---

## 📐 PART 1: THE THREE LAYERS (MANDATORY)

**Every Relay visualization MUST render all three layers simultaneously:**

1. **Scalar Fields** (values — "how much")
2. **Vector Fields** (flows — "where it's going")
3. **Constraint Fields** (limits — "what's allowed")

**If any layer is missing, the visualization is incomplete.**

---

### **1.1 SCALAR FIELDS (Values)**

**Purpose**: Show "how much" at a location (no direction)

**Examples**:
- ERI score
- Confidence level
- Backlog count
- Capacity remaining
- Cognitive load
- Pressure accumulation

---

#### **Render Rule: Scalar = Height + Color**

```yaml
scalar_field_rendering:
  height: magnitude
    - ERI 85 → tall spike
    - ERI 20 → shallow dip
    - Cognitive load 80% → tall
    - Cognitive load 30% → short
  
  color: state_class
    - verified: green
    - degraded: yellow/orange
    - indeterminate: gray/foggy
    - overload: red
  
  never_use: arrows (scalars have no direction)
```

**Visual Example**:
```
High ERI (85):
  ▲ (tall red spike)
  
Low ERI (20):
  ▽ (shallow green dip)
  
Medium confidence (60%):
  ~ (foggy/blurred rendering)
```

---

#### **Scalar Field Formula**

For any point `x` in space (anchor, workflow, region):

```
Scalar Field: S(x)
  S(x) = value at location x
  
Height: h(x) = f(S(x))
  where f is scaling function (e.g., log or linear)
  
Color: c(x) = class(S(x))
  where class maps value to state category
```

**Example (ERI)**:
```yaml
ERI_field:
  S(x) = ERI(x)
  h(x) = log(ERI(x) + 1) * scale_factor
  c(x):
    if ERI(x) < 30: green (verified)
    elif ERI(x) < 70: yellow (degraded)
    else: red (indeterminate)
```

---

### **1.2 VECTOR FIELDS (Flows)**

**Purpose**: Show "where it's going" (direction + strength)

**Examples**:
- Commit flow along filaments
- Dependency flow (who depends on whom)
- Pressure flow (where unresolved state is pushing)
- Authority flow (delegation chains)

---

#### **Render Rule: Vectors = Streamlines on Filaments**

```yaml
vector_field_rendering:
  direction: forward_along_filament_time
    - Past below → Present surface → Future above
    - Flow always follows filament causality
  
  thickness: flow_magnitude
    - High commit rate → thick streamline
    - Low commit rate → thin streamline
    - Rate of change determines visual weight
  
  curvature: follows_ring_basins
    - No straight "org chart" lines
    - Curves follow gravitational wells (ERI basins)
    - Natural flow paths, not geometric grids
```

**Visual Example**:
```
Commit Flow:
  ───▶───▶───▶  (thin, steady flow)
  ═══▶═══▶═══▶  (thick, high-rate flow)

Pressure Flow:
  High ERI region → curves toward Low ERI region
  ╭─────▶
  │      ╲
  ▲       ╲
  │        ╲
  High     Low
```

---

#### **Vector Field Formula**

For flow at point `x`:

```
Vector Field: V(x)
  V(x) = (direction, magnitude)
  
Direction: d(x)
  - Along filament: tangent to commit chain
  - Pressure: -∇S(x) (negative gradient, flows downhill)
  
Magnitude: m(x)
  - Commit rate: commits/hour
  - Pressure: |∇S(x)| (steepness of gradient)
  
Streamline rendering:
  thickness ∝ m(x)
  follows curve of d(x)
```

**Example (Pressure Flow)**:
```yaml
pressure_flow:
  V(x) = -∇ERI(x)
  
  direction: points toward lower ERI (downhill)
  magnitude: |∇ERI(x)| (how steep the slope)
  
  rendering:
    if |∇ERI(x)| > threshold: render visible streamline
    else: no visible flow (stable)
```

---

### **1.3 CONSTRAINT FIELDS (What's Allowed)**

**Purpose**: Show "what motion is possible"

**Examples**:
- Stage gates (Stage 1 active, Stage 2 blocked)
- Authority validity windows (expires soon)
- Pressure budgets (capacity exhausted)
- Cognitive load caps (80% threshold)
- Federation boundaries (cannot cross)

---

#### **Render Rule: Constraints = Surfaces + Gates**

```yaml
constraint_field_rendering:
  surfaces: invisible_until_active
    - Normally transparent/hidden
    - Become visible when:
      - Blocking action (refusal)
      - Binding behavior (near threshold)
  
  when_active:
    appearance: translucent_membrane
    color: depends_on_constraint_type
      - stage_gate: blue
      - authority_expired: yellow
      - pressure_exhausted: red
      - cognitive_load: orange
    
    label: refusal_reason (on hover)
      - "Requires Stage 2 (not active)"
      - "Authority expired (renew required)"
      - "Cognitive load 82% (threshold: 80%)"
  
  never_look_like: warnings
  always_look_like: walls, valves, throttle_plates
```

**Visual Example**:
```
Stage Gate (Blocking):
  User Action ──X╫╫╫  (membrane blocks, shows reason)
               Stage 2
               (not active)

Cognitive Load (Near Threshold):
  Load: 78% ═══▓▓▓▓░░  (bar approaching cap)
              ↑
           threshold (80%)

Authority Expiry (Soon):
  Authority ═══════╲  (shrinking, fading)
                    ╲ (expires in 7 days)
```

---

#### **Constraint Field Formula**

For constraint at point `x`:

```
Constraint Field: C(x)
  C(x) = {allowed, blocked, binding}
  
Rendering:
  if C(x) == allowed:
    surface: invisible
  
  elif C(x) == blocked:
    surface: opaque_membrane
    label: refusal_reason(x)
  
  elif C(x) == binding:
    surface: translucent_membrane
    intensity: distance_to_threshold(x)
```

**Example (Cognitive Load Cap)**:
```yaml
cognitive_load_constraint:
  threshold: 80
  current(user): 78
  
  C(user):
    if current < threshold * 0.9: allowed (invisible)
    elif current < threshold: binding (translucent, warning color)
    else: blocked (opaque, refusal)
  
  rendering:
    intensity = (current / threshold)
    color: lerp(green, red, intensity)
```

---

## 🔍 PART 2: THE FIELD STACK RULE

**When rendering any object/region, the viewer must be able to answer in 1 second:**

1. **What's the scalar level here?** (value)
2. **Where is flow going?** (vector)
3. **What's preventing motion?** (constraint)

**If the visualization can't answer all three, it's incomplete.**

---

### **Field Stack Visual Test**

**Example: Viewing a procurement workflow**

```
User looks at workflow anchor:

1. Scalar: What's the value?
   ▲ ERI = 65 (yellow spike, medium height)
   ✓ Answer in <1 second

2. Vector: Where is flow going?
   ─▶─ Commits flowing toward resolution
   ╲ Pressure flowing toward next reconcile
   ✓ Answer in <1 second

3. Constraint: What's blocking?
   ╫ Cognitive load at 82% (membrane visible)
   X Assignment blocked (refusal reason shown)
   ✓ Answer in <1 second
```

**If any of these takes >1 second to perceive, the rendering is wrong.**

---

## 🏔️ PART 3: ERI AS SCALAR POTENTIAL

**ERI isn't just a number. It's a scalar potential field.**

---

### **3.1 ERI Field Definition**

**For any scope/ring, define**:

```
E(x) = ERI scalar field over surface
  where x = anchors, workflows, regions

∇E(x) = ERI gradient (vector field)
  direction of steepest increase

Interpretation:
  ∇E(x) points to where risk is rising fastest
  -∇E(x) points to "best downhill repair path"
```

---

### **3.2 ERI Gradient Visualization**

**ERI high = "deep well" (high exposure risk)**  
**ERI low = "shallow well" (lower risk)**  
**∇E(x) = pressure to move toward repair**

---

#### **Render Rule: ERI as Surface + Gradients**

```yaml
ERI_rendering:
  always_show:
    surface:
      height: E(x) (magnitude)
      color: risk_class(E(x))
        - E < 30: green
        - 30 ≤ E < 70: yellow
        - E ≥ 70: red
  
  show_gradients_when:
    - user hits HOLD
    - user selects "Repair paths"
  
  gradient_visualization:
    streamlines:
      direction: -∇E(x) (downhill, toward lower risk)
      start: hot_areas (high ERI)
      end: cooler_areas (lower ERI)
    
    streamline_termination:
      if blocked_by:
        - authority_missing
        - stage_gate
        - capacity_exhausted
      then: terminate_with_refusal_marker
      
      else: continue_to_recommended_staged_repair
```

**Visual Example**:
```
ERI Field (Surface View):

    ▲ (ERI = 85, red spike)
   ╱│╲
  ╱ │ ╲
 ╱  │  ╲ (gradient slope)
▁▁▁▁▁▁▁▁ (ERI = 20, green baseline)


ERI Gradient (Repair Path View):

High ERI ═══▶ (streamline flows downhill)
   │         ╲
   ▼          ╲
   ╫ (blocked by authority)
   X "Authority required: site_manager"
   
   OR
   
   │          ╲
   ▼           ╲
   ✓ (passable, recommends repair)
   "Suggested: Create QEP + link to PO"
```

---

### **3.3 ERI Gradient Formula**

```
E(x) = ERI(x)

∇E(x) = (∂E/∂x, ∂E/∂y, ∂E/∂z)
  gradient in 3D space

Magnitude: |∇E(x)| = √((∂E/∂x)² + (∂E/∂y)² + (∂E/∂z)²)
  how steep the slope

Direction: d(x) = -∇E(x) / |∇E(x)|
  unit vector pointing downhill (toward repair)

Streamline rendering:
  start at x where E(x) > threshold
  follow direction d(x)
  thickness ∝ |∇E(x)|
  terminate at constraint or target
```

---

## 🌫️ PART 4: CONFIDENCE MODULATION

**If confidence is low, the field must become foggy/blurred, not "wrong."**

---

### **4.1 Confidence-Modulated Field**

```
E'(x) = E(x) × confidence(x)

where:
  E(x) = raw ERI value
  confidence(x) = confidence level (0-100%)
  E'(x) = displayed ERI (adjusted for confidence)
```

---

### **4.2 Display Rules**

```yaml
confidence_rendering:
  if confidence(x) < confidence_floor:
    display: indeterminate
    visual: gray fog, no gradient
    label: "Insufficient data"
  
  elif confidence(x) < 60%:
    display: low_confidence
    visual: blurred, translucent
    gradient: no_clean_arrows
    label: "Low confidence"
  
  elif confidence(x) < 90%:
    display: moderate_confidence
    visual: slight_blur
    gradient: visible_but_dashed
  
  else:
    display: high_confidence
    visual: crisp, solid
    gradient: clean_streamlines
```

**This prevents false certainty: no clean arrows from uncertain data.**

---

### **4.3 Visual Example**

```
High Confidence (95%):
  ▲ (crisp spike, solid color)
  ───▶ (clean gradient arrows)

Low Confidence (45%):
  ▲ (blurred spike, translucent)
  ··▶ (dashed/dotted gradient)

Indeterminate (<30%):
  ░ (gray fog, no structure)
  ? (no gradient shown)
```

---

## 🔄 PART 5: ROUND-ROBIN AS CONSERVATION LAW

**Round-robin isn't "fairness vibes." It is conservation of coordination energy.**

---

### **5.1 The Conserved Quantity**

**In any group, there is a limited budget of:**
- Attention
- Deliberation time
- Social trust
- Cognitive capacity

**If the same people repeatedly hold roles, two failures occur:**

1. **Legitimacy concentrates** → Their decisions carry "ambient authority" even when not justified
2. **Cognitive load concentrates** → They burn out, become gatekeepers, single points of failure

**Round-robin enforces a physical invariant:**
> **No node may accumulate unlimited coordination work without shedding it.**

**This is the same structure as:**
- Pressure budgets (system capacity)
- Authority decay (power can't persist)
- Cognitive load caps (humans can't be infinite)

---

### **5.2 Formal Rule**

For any role `r` in scope `s`:

```
Let L_u,s = load currently carried by user u in scope s
Let T_u,r,s = time served by user u in role r in scope s

Round-robin constraint:
  T_u,r,s ≤ T_max

After expiry, user enters cooldown:
  u ∉ eligible(r, s) until cooldown ends

Selection of next holder must minimize:
  - L_u,s (don't overload)
  - repeat_frequency (prevent capture)
```

**This is not optional because without it the system violates:**
- No ambient authority
- Pressure budget
- Cognitive load
- Anti-capture mechanics

**So round-robin is conservation: it forces legitimacy + load to circulate, not accumulate.**

---

### **5.3 Round-Robin Visualization Rule**

**When a role is active, render it as a time-boxed occupancy token:**

```yaml
role_token_rendering:
  token:
    location: sits_on_holders_filament
    shape: glowing_orb_or_badge
    
    properties:
      remaining_time:
        visual: shrinks_over_time
        color: fades_from_green_to_yellow_to_red
        size: decreases_proportionally
      
      cooldown_shadow:
        visual: gray_ghost_on_timeline
        meaning: future_unavailability
        duration: shown_ahead_on_filament
  
  on_expiry:
    token_detaches: from_current_holder
    token_flows: to_next_eligible_holder
    handoff_scar: visible_on_filament
    
    visual_transition:
      - Token lifts from Alice's filament
      - Arcs through space to Bob's filament
      - Lands with glow effect
      - Alice's filament shows cooldown shadow
```

**This makes "rotation" feel like physics, not HR policy.**

---

### **5.4 Visual Example**

```
Alice holds "Arbiter" role:

Day 1:  ◉ (full green orb, 90 days remaining)
        ║ (Alice's filament)

Day 45: ◑ (half-size yellow orb, 45 days remaining)
        ║

Day 89: ◔ (small red orb, 1 day remaining)
        ║
        ░░░░ (cooldown shadow ahead, 180 days)

Day 90: Token detaches, flows to Bob
        ↗
       ↗
Alice: ░░░░ (cooldown, cannot hold role)
Bob:   ◉ (full green orb, role starts)
```

---

## 📋 PART 6: IMPLEMENTATION REQUIREMENTS FOR CANON

### **6.1 Core Rendering Primitives**

Canon must implement:

1. **Scalar Field Renderer**
   - Height mapping (value → z-axis)
   - Color mapping (state → RGB)
   - Fog/blur for low confidence

2. **Vector Field Renderer**
   - Streamline generator
   - Thickness based on magnitude
   - Curvature following basins

3. **Constraint Field Renderer**
   - Invisible by default
   - Membrane rendering on activation
   - Refusal reason labels

4. **ERI Gradient Renderer**
   - Surface + height map
   - Gradient calculation (∇E)
   - Repair path streamlines
   - Constraint-aware termination

5. **Round-Robin Token Renderer**
   - Time-boxed token visualization
   - Cooldown shadow
   - Handoff animation

---

### **6.2 Field Stack Compositor**

**Layer composition order** (back to front):

```
1. Scalar field (surface, furthest back)
2. Vector field (streamlines, mid-layer)
3. Constraint field (membranes, front-layer)
4. Role tokens (floating, topmost)
```

**All layers must be visible simultaneously (composited transparency).**

---

### **6.3 Interaction Rules**

**User interactions with fields:**

```yaml
hover:
  scalar: show_exact_value + confidence
  vector: show_flow_rate + direction
  constraint: show_refusal_reason + next_steps

click:
  scalar: drill_down (show commit history)
  vector: trace_flow (show full filament)
  constraint: explain_gate (show policy + authority)

HOLD_button:
  all_fields: show_gradients + repair_paths
```

---

### **6.4 Performance Requirements**

```yaml
field_rendering_performance:
  frame_rate: minimum_30fps
  
  field_resolution:
    scalar: adaptive_LOD (high near camera, low far away)
    vector: max_1000_streamlines_visible
    constraint: only_render_active_constraints
  
  confidence_blur:
    shader_based: true (GPU-accelerated)
    real_time: true (no pre-baking)
```

---

## ✅ PART 7: VALIDATION CHECKLIST

**Stage 1 visualization is complete when:**

- [ ] **Scalar fields** render with height + color
- [ ] **Vector fields** render as streamlines (no straight arrows)
- [ ] **Constraint fields** render as membranes (only when active)
- [ ] **Field stack** answers all 3 questions in <1 second
- [ ] **ERI gradients** show repair paths (with constraint termination)
- [ ] **Confidence** modulates rendering (blur when uncertain)
- [ ] **Round-robin tokens** visualize rotation as physics
- [ ] **All three layers** visible simultaneously (composited)
- [ ] **Hover/click** interactions show details
- [ ] **HOLD button** reveals gradients + repair paths
- [ ] **Performance** maintains 30fps with adaptive LOD

---

## 🔒 FINAL LOCK SENTENCE

> **"Relay visualization renders coordination physics as fields, not diagrams. If the viewer cannot perceive value, flow, and constraint in one second, the rendering is incomplete."**

---

## 📁 INTEGRATION WITH STAGE 1

**This spec integrates with:**
- `RELAY-CONTROL-SYSTEMS-PROOF.md` ⚠️ **CRITICAL** (mathematical foundation: ERI gradients, constraint gating, funnels/membranes)
- `CANON-RELAY-CORE-IMPLEMENTATION.md` (provides data for visualization)
- `RELAY-HUMAN-FLOW-CONTROL-V2.md` (round-robin tokens, cognitive load bars)
- `CANON-IMPLEMENTATION-CHECKLIST.md` (add visualization to Phase 4)

**Mathematical Foundation**:  
This spec implements the visualization layer for the mathematical primitives defined in `RELAY-CONTROL-SYSTEMS-PROOF.md`:
- **Funnels** = ERI scalar potential (depth = Ẽᵢ)
- **Streamlines** = ERI gradients (direction = -∇E)
- **Membranes** = constraint fields (gates = constraint filters)
- **Scars** = reconciliation events (merge commits)

**Visualization is HOW users interact with coordination physics.**

**Without proper rendering, Stage 1 cannot be proven.**

---

**Status**: CRITICAL VISUALIZATION SPEC COMPLETE ✅

**Canon must implement these rendering rules for Stage 1 UI.** 🎨
