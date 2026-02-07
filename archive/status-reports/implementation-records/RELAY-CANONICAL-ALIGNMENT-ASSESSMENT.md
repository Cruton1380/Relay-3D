# Relay Canonical Alignment Assessment

**Date:** 2026-02-02  
**Status:** Stage 1.5 Implementation  
**Assessment:** Comparing current implementation against canonical model

---

## Executive Summary

**Current Stage:** 1.5 / 4.0  
**Alignment:** 60% (Topology correct, Causality missing)  
**Critical Gap:** Internal branch structure not implemented

Our implementation has **correct directionality** and **semantic structure**, but lacks the **internal causality** that transforms it from a diagram into a living coordination instrument.

---

## ✅ What Is Implemented Correctly (Stage 1)

### 1. Canonical Directionality ✅
**Status:** CORRECT

- Single downward trunk (history anchor)
- Branches grow upward from history → present
- No orbiting objects, no cycles
- Append-only flow enforced

**Evidence in Code:**
```javascript
// filament-spreadsheet-prototype.html:3814-3843
// Root at bottom, branches grow upward
// Tree structure enforces directional history
```

**Result:** History is append-only, present sits on accumulated commitments

---

### 2. Branches as Semantic Domains ✅
**Status:** CORRECT

- Each branch represents a separate coordination domain
- Branches can diverge (forks)
- Branches can reconcile (merges)
- Each carries independent state

**Evidence in Code:**
```javascript
// state.tree.nodes with types: 'root', 'branch', 'department', 'sheet'
// Each branch has independent:
// - position
// - parent linkage
// - ERI score
// - pressure rings
```

**Result:** 3D cognition upgrade over Excel (separate domains, not rows)

---

### 3. Sheets as Views (Not State) ✅
**Status:** CORRECT

- Sheets are lenses attached to branch endpoints
- Multiple sheets can view same underlying commits
- UI is detachable/inspectable
- Not truth itself, just current surface view

**Evidence in Code:**
```javascript
// Sheet rendering creates Groups attached to branch nodes
// Sheets display current state, not historical record
// Can toggle between Grid/Tree/Graph/Sheet views
```

**Result:** Correctly implements "UI is a lens, not truth"

---

## ⚠️ What Is Partially Implemented (Stage 1.5)

### 4. Filaments Exist But Are Decorative ⚠️
**Status:** INCOMPLETE

**What We Have:**
- Visual tubes connecting nodes
- Curved organic paths (QuadraticBezierCurve3)
- Pressure-scaled thickness
- Natural bark material

**What's Missing:**
- Filaments don't encode **commit density**
- No **dependency reuse** visualization
- No **authority weight** indication
- No **reconciliation cost** embodiment

**Code Location:**
```javascript
// filament-spreadsheet-prototype.html:4230-4295
// TubeGeometry with pressure scaling
// BUT: Single tube per branch (no internal bundling)
```

**Gap:** Brain reads them as "wires" not "responsibility"

**To Fix:** Implement multi-filament bundles inside each branch

---

### 5. Time Exists But Not Legible ⚠️
**Status:** INCOMPLETE

**What We Have:**
- Timeboxes generated from commits
- Rings positioned along trunk
- Data-driven (not decorative)
- Metadata stored (commit range, confidence)

**What's Missing:**
- **Segmentation** not visually strong enough
- Don't clearly mark "this was a boundary"
- Don't feel like **irreversible moments**
- Timebox surfaces are smooth (should be hard edges)

**Code Location:**
```javascript
// filament-spreadsheet-prototype.html:3445-3600
// generateTimeboxesFromCommits() works
// TorusGeometry rings render
// BUT: Need stronger visual boundaries
```

**Gap:** History pressure is not felt

**To Fix:** Make timeboxes cut through branch geometry (hard edges, not smooth rings)

---

### 6. Pressure & Confidence Are Implicit ⚠️
**Status:** INCOMPLETE

**What We Have (Pressure):**
- Camera resistance near high-pressure (✅ implemented)
- Branch thickness scaling by pressure (✅ implemented)
- HUD shows pressure % (✅ implemented)
- Scars interrupt geometry (✅ implemented)

**What's Missing (Pressure):**
- Resistance not **strong enough** yet
- Swelling not **obvious** at a glance
- Scars don't **demand reconciliation** visually

**What We Have (Confidence):**
- Confidence calculated from commits
- Stored in timebox metadata
- Used for ring coloring

**What's Missing (Confidence):**
- No **visual gating** of claims
- No **grayed-out indeterminate states**
- No **blocking** of certain actions when confidence low
- Missing inputs not explicitly shown

**Code Location:**
```javascript
// Pressure physics: lines 2962-3055 (camera resistance)
// Branch scaling: lines 4220-4230 (thickness by pressure)
// Confidence: lines 3519-3560 (ring colors only)
```

**Gap:** Tree doesn't push back strongly enough

**To Fix:** Amplify pressure resistance 3-5x, add confidence overlays on sheets

---

## ❌ What Is Not Implemented Yet (Stage 2+)

### 7. Internal Branch Structure Missing ❌
**Status:** NOT IMPLEMENTED

**Current State:**
- Each branch is a **single smooth tube**
- No visible internal structure
- Cell-level causality hidden

**Canonical Requirement:**
- Branch should be a **braided cable of many filaments**
- Each cell change = one filament
- Reused formulas = bundled filaments
- Shared dependencies = thicker convergent filaments

**What Should Be Visible:**
```
Branch (exterior view):
  └─ Smooth bark surface (trunk)

Branch (cutaway/lens view):
  ├─ Cell A1 filament (thin, independent)
  ├─ Cell B1 filament (thin, independent)
  ├─ Formula C1=A1+B1 (bundled from A1, B1)
  ├─ Formula D1=C1*2 (bundled from C1)
  └─ Convergence where multiple sheets use same cell
      (thickest internal filament = most shared dependency)
```

**Gap:** Excel intuition keeps firing because cell-level causality not visible

**To Fix:** Implement cell-level filament rendering with formula graph bundling

---

### 8. Pressure Not Structural Enough ❌
**Status:** PARTIALLY IMPLEMENTED

**What We Have:**
- Camera resistance (weak)
- Branch thickness scaling (subtle)
- Scars as jagged geometry (good)

**What's Missing:**
- **Swelling** not dramatic enough
- **Stiffness** not preventing movement strongly
- **Camera resistance** should be 5-10x stronger
- **Scars** should block navigation paths, not just mark them

**Canonical Behavior:**
```
Low Pressure (0-30%):
  - Camera moves freely
  - Branches look thin, flexible
  - No resistance

High Pressure (70-100%):
  - Camera struggles to move
  - Branches visibly swollen/bulging
  - Strong resistance force
  - User must "push through" or find alternate path
```

**Gap:** System can't tell you what's wrong without text

**To Fix:** 
- Multiply pressure damping by 5x
- Add vertex displacement for swelling (bulging geometry)
- Make scars create navigation barriers

---

### 9. Confidence Gates Not Enforced Visually ❌
**Status:** NOT IMPLEMENTED

**What We Have:**
- Confidence calculated correctly
- Displayed in HUD (when hovering timeboxes)

**What's Missing:**
- **Low confidence cells** should be grayed/ghosted
- **Indeterminate claims** should have dashed borders
- **Missing inputs** should be explicitly marked (red outline)
- **Blocked actions** when confidence < threshold

**Canonical Behavior:**
```
High Confidence (85%+):
  - Cell displays normally (solid color)
  - Can assert value as "verified"

Medium Confidence (60-85%):
  - Cell displays with caution (amber border)
  - Can assert as "projected" only

Low Confidence (<60%):
  - Cell grayed out (ghosted)
  - Cannot assert, must mark "indeterminate"
  - Shows missing inputs explicitly
```

**Gap:** Everything looks equally assertable (violates "what am I allowed to say without lying?")

**To Fix:** Implement confidence-based visual states on cells/sheets

---

## Reading Grammar Assessment

### How Users Should Read The Tree:

| Axis | What It Shows | Current Status |
|------|---------------|----------------|
| **Vertical (Down→Up)** | Past → Present (time) | ✅ CORRECT |
| **Thickness** | Speculative → Operational (how shared) | ⚠️ PARTIAL (needs internal bundling) |
| **Branching** | Where decisions diverged | ✅ CORRECT (forks work) |
| **Timeboxes** | Material slices (boundaries) | ⚠️ PARTIAL (need harder edges) |
| **Pressure** | Resistance/avoidance | ⚠️ PARTIAL (needs amplification) |
| **Confidence** | What can be claimed | ❌ NOT ENFORCED |

---

## Planets Assessment

**Current Status:** No planets implemented ✅ CORRECT

**Canonical Rule:**
- Planets = external context (basins of attraction)
- NOT internal branch state
- NOT orbiting objects
- NOT confidence or pressure

**Our Implementation:** Correctly has no planets (we don't need them yet)

**When to Add Planets:**
- Only for multi-company/multi-regulatory views
- As stable reference frames outside the tree
- Never inside branches
- Never orbiting

---

## Implementation Priority (Next Steps)

### Phase 2A: Cell-Level Filaments (CRITICAL) 🔴
**Blockers:** 7 of 9 gaps depend on this

**Tasks:**
1. Parse Excel cells → individual commit filaments
2. Parse formulas → dependency bundling
3. Render thin filaments inside branch
4. Convergence where multiple cells reference same formula
5. Make branches visually "braided cables"

**Estimated Complexity:** HIGH (requires refactoring commit structure)

---

### Phase 2B: Timebox Segmentation (HIGH) 🟠
**Blockers:** Time legibility, pressure visibility

**Tasks:**
1. Make timeboxes cut through branch geometry (not just rings)
2. Hard edges at boundaries (not smooth)
3. Visual "weight" at material boundaries
4. Make boundaries feel irreversible

**Estimated Complexity:** MEDIUM (mostly rendering changes)

---

### Phase 2C: Pressure Amplification (MEDIUM) 🟡
**Blockers:** Navigation feedback, reconciliation demand

**Tasks:**
1. Multiply camera resistance by 5-10x
2. Add vertex displacement for swelling (bulging branches)
3. Make scars create navigation barriers
4. Add "heat" visual (glow/pulse) on high-pressure

**Estimated Complexity:** MEDIUM (physics tuning + shader work)

---

### Phase 2D: Confidence Gating (MEDIUM) 🟡
**Blockers:** Visual truthfulness, claim safety

**Tasks:**
1. Gray out low-confidence cells
2. Add dashed borders for indeterminate claims
3. Mark missing inputs explicitly
4. Block actions when confidence < threshold

**Estimated Complexity:** LOW-MEDIUM (mostly UI/shader overlays)

---

## Canonical Compliance Score

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| **Topology** | 90% | 20% | 18% |
| **Directionality** | 100% | 15% | 15% |
| **Semantic Branches** | 90% | 10% | 9% |
| **Internal Structure** | 20% | 25% | 5% |
| **Pressure Physics** | 40% | 15% | 6% |
| **Confidence Gates** | 10% | 10% | 1% |
| **Time Legibility** | 50% | 5% | 2.5% |
| **TOTAL** | — | 100% | **56.5%** |

**Overall Grade:** Stage 1.5 / 4.0 (56.5% canonical)

---

## Key Insight (The "Click" Moment)

> **"The system currently reads as a structured diagram rather than a living coordination instrument."**

This is because:
- We show **structure** (branches, nodes, connections)
- We don't yet show **causality** (what causes what, what's shared, what resists)

**The Click:** Once we implement cell-level filaments with bundling, the entire model will suddenly "click" from "nice visualization" to "instrument you can trust."

---

## One-Sentence Status

**We have successfully built the skeleton (topology + directionality), but we haven't yet grown the muscle (internal filaments + pressure enforcement) that makes it alive.**

---

## Next Concrete Action

**Priority 1:** Implement cell-level filaments inside one branch (e.g., Purchase Orders)

**Success Criteria:**
- Can see individual cell commits as thin filaments
- Can see formula dependencies as bundled filaments
- Can see shared dependencies as thickened convergence
- Branch looks like "braided cable" not "single tube"

Once this works for one branch, replicate to all branches.

---

## Files Requiring Changes

### Phase 2A (Cell-Level Filaments):
- `filament-spreadsheet-prototype.html`:
  - `renderTreeScaffold()` function (add internal filament rendering)
  - `buildDependencyGraphFromCommits()` (expose cell-level graph)
  - New function: `renderInternalFilaments(branchNode, cellCommits)`

### Phase 2B (Timebox Segmentation):
- `filament-spreadsheet-prototype.html`:
  - `renderRingStackBetween()` (add cutting geometry)
  - `generateTimeboxesFromCommits()` (add boundary strength metadata)

### Phase 2C (Pressure Amplification):
- `filament-spreadsheet-prototype.html`:
  - `calculatePressureInfluence()` (multiply output by 5-10x)
  - Add vertex displacement shader for swelling
  - `renderTreeScaffold()` (add pressure heat glow)

### Phase 2D (Confidence Gating):
- `filament-spreadsheet-prototype.html`:
  - New function: `applyConfidenceOverlay(sheetGroup, confidence)`
  - Modify cell rendering to respect confidence thresholds

---

## Completion Criteria

### Stage 2 Complete When:
- [ ] One branch shows internal cell-level filaments
- [ ] Formulas create visible bundling
- [ ] Timeboxes cut through branch geometry
- [ ] Pressure resistance is 5x stronger
- [ ] Confidence gates low-confidence cells

### Stage 3 Complete When:
- [ ] All branches show internal structure
- [ ] Swelling geometry for high pressure
- [ ] Scars block navigation paths
- [ ] Confidence overlays on all sheets
- [ ] Missing inputs explicitly marked

### Stage 4 (Canonical) Complete When:
- [ ] User says: "I can feel why this action is not allowed"
- [ ] Tree pushes back without text explanations
- [ ] Reconciliation demand is visceral
- [ ] System is instrument, not visualization

---

## Assessment Signature

**Current Implementation:** Stage 1.5 / 4.0  
**Canonical Alignment:** 56.5%  
**Critical Gap:** Internal branch structure (cell-level filaments)  
**Next Milestone:** Phase 2A - Implement filament bundling for one branch

**Date:** 2026-02-02  
**Assessor:** Canonical Model Review  
**Status:** Ready for Phase 2 implementation

---

**The tree has bones. Now it needs muscle.**
