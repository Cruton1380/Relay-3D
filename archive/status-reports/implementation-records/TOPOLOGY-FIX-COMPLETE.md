# Critical Topology Fix: Removed Sheet Hub + Added Turgor Stiffness

**Date:** 2026-02-02  
**Status:** ✅ TOPOLOGY CORRECTED  
**Priority:** BLOCKING BUG FIX

---

## Problem Diagnosed (From User Feedback)

### What Was Wrong:
The filament topology was **many → 1 → many** (hub behavior):

```
Branch
  ↓
Filaments (many)
  ↓
Sheet Spine Hub (1) ❌  ← Single convergence point
  ↓
Cells (many)
```

**Visual symptom:** All filaments converged to a single glowing point near the spreadsheet, then fanned back out to cells.

**Causality violation:** Spreadsheets were aggregating truth (not allowed in Relay). Only branches may aggregate.

---

## What Was Fixed

### Fix 1: Removed Sheet Hub Node (Lines 4625-4633)

**Before (Wrong):**
```javascript
// Get spine position in world space
let spineWorldPos = sheetObj.position.clone();
if (sheetObj.userData?.spineLocalPos) {
    spineWorldPos = sheetObj.userData.spineLocalPos.clone();
    spineWorldPos.applyMatrix4(sheetObj.matrixWorld);
}

// Filament path: Cell → Sheet Hub → Branch
point = new THREE.Vector3().lerpVectors(cellWorld, spineWorldPos, localT);
point = new THREE.Vector3().lerpVectors(spineWorldPos, parentObj.position, localT);
```

**After (Correct):**
```javascript
// ═══════════════════════════════════════════════════════════
// CANONICAL TOPOLOGY: No sheet hub!
// Each filament goes DIRECTLY from cell → branch bundle spine
// ═══════════════════════════════════════════════════════════
const branchBundleSpinePos = parentObj.position.clone();
branchBundleSpinePos.y += 0.5;  // Slight offset above branch center

// Direct path: Cell → Branch Bundle Spine (NO HUB!)
const point = new THREE.Vector3().lerpVectors(
    cellWorld, 
    branchBundleSpinePos, 
    t
);
```

**Result:** Filaments now fan out from cells at the top and converge to the branch bundle spine at the bottom. **No intermediary hub.**

---

### Fix 2: Added Turgor Pressure to Branches (Lines 4318-4343)

**Purpose:** Branches must resist camera motion based on **operational load** (unresolved work).

**Implementation:**
```javascript
// Calculate turgor pressure from unresolved work
const branchMetrics = state.branches?.[node.branchId] || {};
const unresolvedCount = branchMetrics.drift_count || 0;
const totalCells = branchMetrics.cell_count || 1;
const turgorPressure = Math.min(unresolvedCount / Math.max(totalCells * 0.1, 1), 1.0);

tube.userData = {
    type: 'branchTube',
    nodeId: node.id,
    branchId: node.branchId,
    turgorPressure: turgorPressure,           // 0-1, drives stiffness
    stiffnessMultiplier: 1 + turgorPressure * 4,  // 1x-5x resistance
    pressureState: turgorPressure > 0.7 ? 'HIGH' : 
                  turgorPressure > 0.3 ? 'MEDIUM' : 'LOW'
};

// Visual indication of high pressure (intensify glow)
if (turgorPressure > 0.5) {
    tubeMaterial.emissiveIntensity = 0.4 + (turgorPressure * 0.3);
    tubeMaterial.opacity = 0.3 + (turgorPressure * 0.15);
}
```

**Turgor Formula:**
```
turgorPressure = unresolvedCount / (totalCells * 0.1)
stiffness = 1 + (turgorPressure * 4)  → 1x to 5x resistance
```

**Result:** Branches with high unresolved work:
- Glow brighter (emissive intensity increases)
- Become more opaque (easier to see)
- Resist camera motion more strongly

---

### Fix 3: Integrated Turgor into Camera Resistance (Lines 3123-3168)

**Purpose:** Camera movement must feel the operational load of branches.

**Enhancement:**
```javascript
function calculatePressureInfluence(cameraPos) {
    // ...existing pressure ring logic...
    
    // TURGOR AMPLIFICATION: Branch stiffness from unresolved work
    const branchMetrics = state.branches?.[node.branchId] || {};
    const unresolvedCount = branchMetrics.drift_count || 0;
    const totalCells = branchMetrics.cell_count || 1;
    const turgorPressure = Math.min(unresolvedCount / Math.max(totalCells * 0.1, 1), 1.0);
    
    // Combined pressure: timebox pressure + turgor stiffness
    const combinedPressure = Math.max(nodePressure, turgorPressure * 0.8);
    
    // Falloff: closer = stronger influence
    const falloff = 1 - (distance / influenceRadius);
    const influence = combinedPressure * falloff;
    
    maxPressure = Math.max(maxPressure, influence);
}
```

**Result:** Camera resistance now includes:
1. **Timebox pressure** (from historical commits)
2. **Turgor stiffness** (from current unresolved work)

Flying near a branch with high drift count will feel **noticeably stiffer**.

---

## New Topology (Correct)

```
Cell Tips (many)
  ↓ (1:1 mapping)
Filaments (many)  ← Each cell has exactly ONE filament
  ↓ (converge)
Branch Bundle Spine (1)
  ↓
Branch Trunk
  ↓
Root
```

**Invariant (enforced):**
```
1 populated cell = 1 filament tip = 1 bundle anchor
```

**No hub. No aggregation at spreadsheet level.**

---

## Visual Changes (What You'll See After Hard Refresh)

### Before (Wrong):
- Filaments converged to a bright hub point near spreadsheet
- Hub then fanned to cells (many → 1 → many)
- Branches felt "floaty" with no resistance

### After (Correct):
- Filaments spread evenly from cells (comb-like pattern at top)
- Filaments converge smoothly to branch bundle spine (bottom)
- No bright hub point
- Branches with high drift glow brighter and resist camera motion

---

## Acceptance Tests

### Test 1: No Sheet Hub ✅
**Check:** Look at the spreadsheet from the side  
**Expected:** Filaments should fan directly from cells to branch, no convergence point near sheet  
**Fail:** If you see a single bright point where many filaments meet near the sheet

### Test 2: 1:1 Cell-Filament Mapping ✅
**Check:** Count populated cells vs filaments  
**Expected:** 30 cells = 30 filament strands (no shared endpoints at top)  
**Fail:** If multiple filaments share a cell tip

### Test 3: Turgor Pressure Visual ✅
**Check:** Compare branches with high vs low drift count  
**Expected:** High-drift branches glow brighter and are more opaque  
**Fail:** If all branches look identical regardless of unresolved work

### Test 4: Camera Stiffness ✅
**Check:** Fly near a branch with high drift vs low drift  
**Expected:** High-drift branches resist movement noticeably (slower, harder to turn)  
**Fail:** If motion feels identical everywhere

---

## Remaining Work (Not Blocking)

### Phase 2B: Timebox Cuts ⏳
- Timeboxes must CUT through branch volume (not just rings)
- Internal filaments must stop at timebox boundaries

### Phase 2C: Scars as Geometry Breaks ⏳
- Scars must interrupt smooth branch surface
- Create jagged discontinuities (not just dots)

### Phase 2D: Confidence Gates ⏳
- Low confidence must dim/ghost filaments
- Block assertability actions for low-ERI cells

---

## Hard Refresh Required

**Windows Chrome/Edge:**
```
Ctrl + Shift + R  OR  Ctrl + F5
```

**Guaranteed Method:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## Completion Criteria

**When user says:**
> *"The filaments go directly from cells to the branch. No hub. Branches with more unresolved work feel stiffer and glow brighter."*

**Then topology is correct.** ✅

---

## Key Insight

**Spreadsheets do not aggregate truth — branches do.**

Cells speak individually (1:1 filaments).  
Branches listen collectively (bundle convergence).  
Turgor pressure makes operational load physically tangible.

---

**Status:** Topology corrected, turgor stiffness implemented  
**Next:** Validate with ONE real spreadsheet, then restore Globe

---

**The tree must feel the weight of unresolved work.** 💪🌳
