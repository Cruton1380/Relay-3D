# Relay Tree Scaffold: Semantic Completion Specification

**Status:** IN PROGRESS  
**Purpose:** Define the final semantic layer that transforms the Tree Scaffold from "structure visualization" to "coordination physics enforcement"

---

## The Core Principle

**Relay is not a visualization of data.**  
**Relay is a visualization of coordination physics.**

The tree must show how **evidence, authority, time, and pressure** interact to create or refuse reality.

---

## 1. The Four Stacks (Data Model Lock)

The tree must render four simultaneous stacks:

### A. Organization Stack
```
Global (Company Root)
  ├─ Region (optional)
  ├─ Site (5 sites: Tel Aviv, Shanghai, etc.)
  └─ Team (optional, department-level)
```

### B. Material Stack
```
Evidence Anchors (typed nodes):
  ├─ Vendor (supplier relationship)
  ├─ Part (inventory item)
  ├─ BOM (bill of materials)
  ├─ Terms (payment/contract)
  ├─ Product (output)
  └─ Customer (buyer relationship)
```

### C. Time Stack
```
Timeboxes (commit buckets)
  ├─ Ring position = timebox boundary
  ├─ Ring metadata = (commits, pressure, confidence)
  ├─ "Now" pointer = current operating point
  └─ Historical depth = visible backward reach
```

### D. Control Stack
```
Authority Scopes (who decides what, until when)
  ├─ Pressure Budgets (capacity limits)
  ├─ Refusals (scar commits)
  └─ Expiry markers (authority decay)
```

**If the tree doesn't show all four stacks, it will always feel like "objects in space."**

---

## 2. Minimum Object Types (Visual Inventory)

Every rendered tree must include:

| Type | Visual | Physics Behavior |
|------|--------|------------------|
| **Company Root** | Large sphere, golden | Singular, append-only anchor |
| **Site Node** | Medium sphere, regional color | Basin structure (rings embedded) |
| **Evidence Anchor** | Small cube/sphere (typed) | Vendor ≠ BOM ≠ Customer (different edge types) |
| **Sheet** | Perpendicular glass pane | Snapshot per timebox (immutable) |
| **Ring** | Horizontal torus | Timebox/pressure boundary |
| **Scar** | Notch/fracture in ring/trunk | Refusal geometry (breaks smoothness) |
| **Filament (Typed)** | Thin line (color = type) | Vendor link ≠ BOM link ≠ Customer link |

---

## 3. The Three Missing Semantic Layers

### A. Pressure Must Dominate Motion

**Goal:** Make pressure **physically felt**, not just visually indicated.

#### Implementation:
1. **Approach Resistance**
   - Movement damping increases as camera approaches high-pressure rings
   - Formula: `damping = baseDamping * (1 + pressureLevel * 2)`
   - User feels "heavier" movement near refusal zones

2. **Branch Tension**
   - Branch thickness subtly increases with unresolved pressure
   - Formula: `radius = baseRadius * (1 + unresolved_count * 0.05)`
   - Visual "swelling" indicates accumulating obligations

3. **Ring Weight**
   - Rings slightly compress/indent trunk where pressure is high
   - Vertex displacement: `y -= pressure * 0.02`
   - Creates visible "stress rings" in trunk geometry

**Acceptance Test:**  
*If I fly into a refusal zone, I should feel it before I read a number.*

---

### B. Scars Must Interrupt Beauty

**Goal:** Refusal must **hurt the geometry**, not just mark it.

#### Implementation:
1. **Ring Notch**
   - Scar creates a gap/break in ring stack
   - Missing 30-60° arc segment at scar position
   - Visible discontinuity when scrubbing timeline

2. **Trunk Displacement**
   - Local vertex displacement at scar Y-position
   - Creates jagged "wound" in trunk surface
   - Roughness increases near scar center

3. **Color Bleed**
   - Fracture line extends along trunk grain
   - Darkened or discolored vertices radiating from scar
   - Makes scar "leak" into surrounding geometry

**Acceptance Test:**  
*If I scrub timeboxes, I should be able to spot refusals instantly without reading.*

---

### C. Hover Must Narrate Causality

**Goal:** **Intent-without-authority** — hover predicts, click executes.

#### Implementation:
1. **Hover Previews** (no commits)
   - Every hoverable element emits a small, fast preview line
   - Format: `relayUI.setPreview("Next: [action] → [consequence]")`
   - Flash → fade cycle (180ms pulse)

2. **Click Executes** (commit/inspect/open)
   - Click triggers stronger flash in log
   - Format: `relayUI.log("[action] committed", "ok")`
   - Persistent entry with fade-out

3. **Contextual Narration**
   - **Ring hover** → "Timebox W3: 12 commits, 3 unresolved drifts, authority expires in 2d"
   - **Scar hover** → "Refusal: Cost +15% exceeded threshold (2024-11-03, policy_ref: budget_v2)"
   - **Sheet hover** → "Snapshot 2024-11-01: 237 rows, 12 changes, confidence 0.89"
   - **Vendor anchor hover** → "Vendor: Acme Corp → 3 sites, 15 BOMs, last update 2024-10-28"

**Acceptance Test:**  
*I can understand a branch's "why" without clicking anything.*

---

## 4. The Final "Feel" (Canonical Judgment Criteria)

When this is correct, it feels like:

- **Heavy:** History has weight; you're not "browsing," you're moving through constraints
- **Honest:** Refusal feels like the world resisting you, not a popup saying "no"
- **Alive:** Hover constantly predicts; your actions are reflected instantly
- **Recoverable:** Every view is a lens; nothing is mysteriously "lost"

**That's the "inevitable" feeling.**

---

## 5. Phase Implementation Plan

### Phase 1: Company-Complete Tree ✅ (Data Model)
- [ ] Render Global → Region → Site as basin structure
- [ ] Add evidence anchor types (Vendor, BOM, Terms, Customer, Inventory)
- [ ] Ensure inactive BOMs show as "historical sheets" (dimmed, still present)
- [ ] Typed edges (vendor link ≠ BOM link ≠ customer link)

### Phase 2: Physics Dominance 🔄 (Motion & Resistance)
- [ ] Pressure → camera resistance (damping increases near high-pressure)
- [ ] Pressure → trunk compression/tension (visual swelling)
- [ ] Refusal → scar as geometry discontinuity (notch, displacement, bleed)
- [ ] Refusal → always visible in timebox scrub

### Phase 3: Hover Intent 🔄 (Narration Layer)
- [ ] Hover always updates "Next action" HUD line
- [ ] Hover over ring → timebox summary
- [ ] Hover over scar → refusal reason + what's missing
- [ ] Hover over sheet → snapshot metadata
- [ ] Hover over evidence anchor → cross-site links + usage frequency

### Phase 4: Deterministic Rebuild Test ✅ (Canonical Verification)
- [ ] Reload page 3x
- [ ] Import same Excel
- [ ] Verify tree matches:
  - Same ring count + placement
  - Same sheet placements
  - Same scars
  - Same edge counts when formula lens toggled

---

## 6. Excel → Company Tree Mapping (Complete Closure Loop)

```
Excel rows/cells
  → commits (typed: FILE_IMPORT, CELL_SET, ASSUMPTION, REFUSAL, etc.)
  → bucket into timeboxes (by commitIndex or timestamp)
  → timeboxes become rings (with pressure metadata)
  → sheets become snapshot panes (perpendicular to branch)
  → relationships become filaments (typed edges)
  → refusals become scars (geometry discontinuities)
```

**This is the complete closure loop.**

---

## 7. Current Status

### ✅ What's Working:
- Excel file loading (guaranteed drop patch applied)
- Commit graph building from typed commits
- Tree Scaffold rendering (trunk, branches, rings, sheets)
- Flight controls (world-up, WASD, Q/E, pointer-lock)
- Alive log (hover previews + action flash/fade)
- View cycling (Tree Scaffold, Sheet Volume, History Helix, Graph Lens, Filament)

### 🔄 What's Next:
- **Phase 1:** Company-complete data model (evidence anchors, typed edges)
- **Phase 2:** Pressure physics (camera resistance, trunk tension, ring compression)
- **Phase 3:** Scar geometry (notch, displacement, color bleed)
- **Phase 4:** Hover causality narration (rich previews for all elements)

---

## 8. Final Note: The Canonical Test

**If a user eventually says:**

> *"Oh… I can feel why this action is not allowed."*

**Not because of rules. Not because of warnings.**  
**Because the geometry itself refuses.**

**Then we're done.**

---

**Next Step:** Implement Phase 1 (Company-Complete Data Model) → Evidence Anchors + Typed Edges
