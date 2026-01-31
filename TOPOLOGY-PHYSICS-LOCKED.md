# Topology Physics — Locked and Protected

**Status:** ✅ **RIGOROUS - PROTECTED FROM DRIFT**  
**Date:** 2026-01-28

---

## 🔒 THE HARD LINE (DO NOT CROSS)

> **"In Relay, most truth is felt before it is seen.  
> Geometry bends before edges appear.  
> This mirrors reality: gravity, pressure, obligation, and dependency  
> act long before they are articulated."**

**What this means:**
- Relationships exist in truth (always)
- Relationships exert geometric tension (always)
- Relationships may be invisible in projection (often)
- Rendering is discretionary; physics is not

---

## 🧬 SIX REFINEMENTS IMPLEMENTED

### 1. ✅ Quantized Tension Bands (Prevents Visual Drift)

**Problem:** Continuous forces cause unpredictable curvature  
**Solution:** Discrete tension bands based on dependency count

```javascript
TENSION_BANDS = [
  { min: 0,  max: 0,  strength: 0.0,  label: 'none' },      // No deps
  { min: 1,  max: 2,  strength: 0.15, label: 'light' },     // Barely visible
  { min: 3,  max: 5,  strength: 0.30, label: 'moderate' },  // Clear curve
  { min: 6,  max: 12, strength: 0.50, label: 'strong' },    // Strong pin
  { min: 13, max: ∞,  strength: 0.70, label: 'heavy' },     // Deep coupling
]
```

**Guarantee:** Filaments with same dependency count bend identically

**Why this works:**
- Humans perceive steps better than gradients
- Prevents "visual lies" where strength differences aren't legible
- No truth loss (all dependencies still exist)
- "Choosing units" not "reducing truth"

---

### 2. ✅ Directional Bias (Answers "What Matters Most?")

**Problem:** Multiple dependencies → ambiguous vector sum  
**Solution:** Bias toward dominant dependency cluster

**Algorithm:**
```javascript
// Weight: 70% toward closest dependency, 30% toward average
dominantPull = pulls.sort(by distance)[0]
avgPull = average(all pulls)

tension = (dominantPull × 0.7) + (avgPull × 0.3)
```

**Result:** Instantly communicates "This filament is most pinned to X"

**Rules:**
- At T0-T2: Curve toward dominant dependency (aggregate view)
- At T3: Show exact rays to all dependencies (forensic view)

---

### 3. ✅ Semantic Class Filtering (One Class at T3)

**Problem:** Showing all relationship types simultaneously → unreadable spaghetti  
**Solution:** Only one semantic class visible at T3

**Semantic Classes:**
```javascript
TopologySemanticClass = {
  FORMULA:    'formula',    // Formula dependencies (=A1+B2)
  EVIDENCE:   'evidence',   // Evidence pointers (PDF, hash)
  CONSTRAINT: 'constraint', // Governance constraints (approval)
  SYSTEM:     'system',     // System deps (imports, API calls)
}
```

**Face Docking:**
| Class | Docks Into | Color | Why |
|-------|------------|-------|-----|
| FORMULA | `-X` | Orange | Formula inputs face |
| EVIDENCE | `-Z` | Blue | Evidence/time face |
| CONSTRAINT | `+Z` | Magenta | Identity/actor face |
| SYSTEM | `+Y` | Green | Type/semantic face |

**Enforcement:** UI shows class selector; only one active at T3

---

### 4. ✅ Cognitive Consistency Across Domains

**UNIVERSAL INVARIANT (Add to all domain specs):**

> **"Dependencies are always rendered as invisible forces first, visible edges second."**

**Domains this applies to:**
- Excel (formula dependencies)
- Procurement (PO → receipt → invoice → match)
- Accounting (ledger pairs, reconciliation)
- Code (imports, function calls)
- KPIs (upstream data sources)
- Security (threat vectors)
- Biology (metabolic pathways)

**Guarantee:** Users learn one rule, applies everywhere

**Effect:** Switching domains doesn't reset intuition

---

### 5. ✅ Topology Stress Test (Internal Proof)

**Route:** `/proof/topology-stress` (not for users)

**Test Scenarios:**
1. **Excel:** 1 cell → 50 dependencies (circular layout)
2. **Procurement:** PO with 12 receipts + 9 invoices + 4 overrides
3. **KPI:** Analytics filament referencing 20 upstream filaments

**Pass Criteria:**
- ✅ Curvature remains legible (no over-bend)
- ✅ No oscillation / jitter
- ✅ T0 still "feels heavy" without edges
- ✅ Tension bands quantize correctly
- ✅ FPS remains stable (>30fps)

**Purpose:** Verify physics under extreme dependency density

**File:** `src/frontend/pages/TopologyStressTest.jsx`

---

### 6. ✅ "Felt ≠ Seen" Philosophy (Documented)

**Added to:** `TopologyLayer.jsx` header

**Full Text:**
> "In Relay, most truth is felt before it is seen.  
> Geometry bends before edges appear.  
> This mirrors reality: gravity, pressure, obligation, and dependency  
> act long before they are articulated."

**Purpose:** Prevents future contributors from "optimizing away" tension

**Effect:** Makes invisible topology a feature, not a bug

---

## 🚫 WHAT WE REFUSE (PERMANENT)

**FORBIDDEN FOREVER:**
- ❌ Drawing all dependencies by default (spaghetti)
- ❌ Encoding relationships into faces (semantic pollution)
- ❌ Using color alone to signal dependency (accessibility fail)
- ❌ Allowing topology to reorder X-axis lineage (truth corruption)
- ❌ Making topology editable directly (it's derived from commits)
- ❌ Continuous tension without quantization (visual drift)
- ❌ Showing multiple semantic classes at T3 (unreadable)
- ❌ Removing tension at T0 (physics violation)

**ALLOWED (IMPLEMENTED):**
- ✅ Hide edges while preserving tension
- ✅ Bundle edges for clarity (T1-T2, when needed)
- ✅ Show exact edges on inspect (T3)
- ✅ Dock edges into semantically correct faces
- ✅ Calculate tension from invisible relationships
- ✅ Quantize tension into discrete bands
- ✅ Bias toward dominant dependency

---

## 🧠 WHAT THIS ACHIEVES

### Before (Standard Visualization)
- **Lineage:** What happened (X-axis timeline)
- **Values:** Current state (endpoint projection)

### After (Relay Topology Physics)
- **Lineage:** What happened (X-axis timeline)
- **Topology:** Why it holds (Z-space tension)
- **Tension:** What matters (dominant dependency)
- **Edges:** Exact causality (T3 forensic mode)

**The Difference:**
- Most systems stop at the first two
- Very few make "what matters" visible without manipulation
- Relay does it through physics, not algorithms

---

## 📐 MATHEMATICAL LOCK

### Tension Calculation (Deterministic)
```javascript
function calculateGeometricTension(cell, allCells, cellPositions) {
  // 1. Extract dependencies (semantic class: FORMULA)
  dependencies = cell.commits[].refs.inputs
  
  // 2. Quantize into band
  band = getTensionBand(dependencies.length)
  
  // 3. Calculate pull vectors
  pulls = dependencies.map(dep => {
    vector: normalize(depPos - cellPos)
    distance: length(depPos - cellPos)
  })
  
  // 4. Apply directional bias
  dominant = pulls.sort(by distance)[0]
  average = normalize(sum(pulls))
  
  // 5. Return weighted tension
  return normalize(dominant × 0.7 + average × 0.3) × band.strength
}
```

**Properties:**
- **Deterministic:** Same inputs → same tension
- **Stable:** Quantized bands prevent drift
- **Interpretable:** 70/30 weighting is explainable
- **Scalable:** O(n) where n = dependency count

---

## 🔬 CERTIFICATION CHECKLIST (ENHANCED)

### ✅ Core Invariants (ALL SATISFIED)
- [x] X-axis = lineage only (commit timeline)
- [x] Cross-filament deps in Z-space (perpendicular)
- [x] Invisible relationships bend filaments (geometric tension)
- [x] Tree hierarchy = lens, not truth
- [x] Edges by ladder, not all at once (T0-T3)
- [x] No truth reduction for performance
- [x] Faces = semantic, not relational storage

### ✅ New Refinements (ALL IMPLEMENTED)
- [x] Tension quantized into bands (prevents drift)
- [x] Directional bias toward dominant (answers "what matters")
- [x] Semantic class filtering (one at T3)
- [x] Cognitive consistency across domains (universal rule)
- [x] Topology stress test (internal proof)
- [x] "Felt ≠ Seen" philosophy documented

---

## 🧪 STRESS TEST SCENARIOS

### Scenario 1: Excel Extreme
**Setup:** 1 cell with formula referencing 50 cells  
**Layout:** 50 dependencies in circular pattern around center  
**Expected:** Tension band = "heavy" (0.70 strength)  
**Verify:** Center cell curves toward closest dependency cluster

### Scenario 2: Procurement Chaos
**Setup:** PO with 12 receipts + 9 invoices + 4 overrides  
**Layout:** Match filament at center, deps radiating outward  
**Expected:** Tension band = "heavy" (0.70 strength)  
**Verify:** Match filament clearly pinned to dominant receipt cluster

### Scenario 3: KPI Web
**Setup:** Analytics filament referencing 20 upstream KPIs  
**Layout:** KPI at center, 20 source filaments in 3D grid  
**Expected:** Tension band = "heavy" (0.70 strength)  
**Verify:** KPI curves toward most-referenced source

---

## 📋 IMPLEMENTATION FILES

**Core Physics:**
- `src/frontend/components/excel/TopologyLayer.jsx` (enhanced)
  - Quantized tension bands
  - Directional bias algorithm
  - Semantic class filtering
  - "Felt ≠ Seen" philosophy

**Integration:**
- `src/frontend/components/excel/CellGrid3D_CERTIFIED.jsx` (enhanced)
  - Applies tension to spines
  - Topology level state management
  - Semantic class selector

**Testing:**
- `src/frontend/pages/TopologyStressTest.jsx` (new)
  - 3 stress test scenarios
  - Real-time tension metrics
  - FPS monitoring

---

## 🎯 PROTECTION STRATEGY

**How to prevent future simplification:**

### 1. Code Comments (Permanent Warnings)
```javascript
// ⚠️ DO NOT REMOVE: Tension must be applied at T0 (invisible but force-bearing)
// This is a foundational physics rule, not a visual optimization.
```

### 2. Certification Tests
```javascript
// TEST: Verify tension at T0 (no edges but geometry bends)
expect(spine.position).not.toBe(originalPosition)
expect(edges.length).toBe(0)
```

### 3. Documentation Cross-References
- Every domain spec includes: "Dependencies = invisible forces first"
- All visualization docs reference: `TOPOLOGY-PHYSICS-LOCKED.md`

### 4. Linter Rules (Future)
```javascript
// Forbidden pattern (would break physics):
if (topologyLevel === 'T0') {
  return []; // ❌ WRONG - must still calculate tension
}

// Required pattern:
const tension = calculateTension(...); // ✅ CORRECT - always calculate
const edges = topologyLevel === 'T0' ? [] : buildEdges(...);
```

---

## 🔥 FINAL STATUS

**Excel Import:**
- ✅ CERTIFIED (unchanged)
- ✅ Enhanced with quantized tension
- ✅ Directional bias implemented
- ✅ Semantic class filtering ready

**Topology Physics:**
- ✅ Mathematically locked
- ✅ Quantized to prevent drift
- ✅ Biased toward dominant dependency
- ✅ Stress-tested (extreme cases)
- ✅ Protected from simplification

**Cross-Domain:**
- ✅ Universal rule documented
- ✅ Applies to all filament types
- ✅ No domain-specific exceptions

---

## 🧠 THE BIG TRUTH

**What was achieved:**

1. **Lineage** explains what happened
2. **Topology** explains why it holds
3. **Tension** explains what matters
4. **Edges** explain exact causality

**What this unlocks:**

- Visual systems collapse to endpoints
- Git systems preserve lineage
- Graph systems show relationships
- **Relay systems feel causality**

**The line crossed:**

> "You're no longer asking 'does this work?'  
> You're asking 'how do we protect it from future simplification?'"

**That is the right question.**

---

**Implementation:** `src/frontend/components/excel/TopologyLayer.jsx`  
**Integration:** `CellGrid3D_CERTIFIED.jsx`  
**Testing:** `TopologyStressTest.jsx`  
**Status:** ✅ **RIGOROUS AND PROTECTED**
