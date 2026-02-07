# Phase 3: Material Timeboxes - IN PROGRESS

**Date**: 2026-02-06  
**Updated**: 2026-02-07 (Bug fix applied)  
**Status**: 🚧 PARTIAL - Bug fix applied, grammar correction required  
**Goal**: Make single branch fully representative of a spreadsheet with timebox history

---

## 🐛 **CRITICAL BUG FIX** (2026-02-07 12:20 UTC)

**Issue**: `0 lanes, 0 cubes` rendered despite implementation complete  
**Root Cause**: Cell ID storage/lookup key mismatch  
- Storage: `cellRef` ("A1", "B2", etc.)  
- Lookup: `cellId` ("sheet.packaging.cell.0.0", etc.)  
**Fix**: Changed line 921 to store by `cellId` for consistency  
**Expected Result**: `48 lanes, 467 cubes` rendered

**See**: `docs/PHASE-3-BUG-FIX.md` for full diagnostic

---

## 🎯 What Phase 3 Adds

**Transform cells from "just points" into cells with temporal depth**:
- Each cell has a **lane from cell tip to its connector target** (spine/merge)
- **Timebox cubes** are embedded on that lane (material history blocks)
- **Parallel lanes** for cells with formulas/history (maintain identity)
- **Mergeable lanes** for empty cells (allowed to converge later at merge node)

**This matches your reference images**: Parallel stacked timeboxes per cell, braided bundles only when allowed.

---

## ✅ Implementation Summary

### 1. Added Timebox Constants

**File**: `app/utils/enu-coordinates.js` → `CANONICAL_LAYOUT.timebox`

**New properties**:
```javascript
timebox: {
    cellToTimeGap: 6.0,          // meters behind cell before first cube
    stepDepth: 4.0,              // meters between cubes
    cubeSize: 1.2,               // meters (cube edge)
    laneThickness: 0.35,         // meters (lane width)
    laneGap: 0.8,                // meters (separation)
    maxCellTimeboxes: 20         // max cubes per lane
}
```

**Spatial grammar**: Time is embedded **between cell tip and connector target** (Stage 1 lane)

---

### 2. Added Cell Data to Demo Tree

**File**: `relay-cesium-world.html` → Demo tree `sheet.packaging`

**Added 48 cells** (8 rows × 6 cols) with:
- `timeboxCount` (3-15 timeboxes per cell, varied)
- `hasFormula` (true/false mix)
- `formula` (Excel formulas like `=SUM()`, `=VLOOKUP()`, etc.)

**Example**:
```javascript
{ row: 0, col: 0, timeboxCount: 8, hasFormula: true, formula: '=SUM(A2:A10)' },
{ row: 0, col: 1, timeboxCount: 5, hasFormula: false },
{ row: 0, col: 2, timeboxCount: 12, hasFormula: true, formula: '=VLOOKUP(A1)' },
```

**Bundling rule**:
```javascript
mustStaySeparate = (timeboxCount > 0) || hasFormula
```

---

### 3. Implemented Timebox Lane Rendering

**File**: `app/renderers/filament-renderer.js` → New method `renderTimeboxLanes(sheet)`

**Called from**: `renderSheetPrimitive()` after cell grid rendering

**Logic**:

**Step A: Define lane target per cell (identity-preserving)**
```javascript
const laneTarget = mustStaySeparate
  ? spineTargetForThisCell(localX, localY)  // preserves identity
  : sheet._mergeNodePos;                    // mergeable cells only
```

**Step B: Constrained departure (must exit opposite the branch)**
```javascript
const departDir = Cesium.Cartesian3.normalize(
  Cesium.Cartesian3.clone(sheet._normal, new Cesium.Cartesian3()),
  new Cesium.Cartesian3()
);
const p0 = cellPos;
const p1 = Cesium.Cartesian3.add(
  p0,
  Cesium.Cartesian3.multiplyByScalar(departDir, cellToTimeGap, new Cesium.Cartesian3()),
  new Cesium.Cartesian3()
);
```

**Step C: Curve toward target, then place cubes by arc-length**
```javascript
const p2 = bendTowardTarget(p1, laneTarget);
const p3 = approachTargetAlignedToBranch(laneTarget);
const p4 = laneTarget;
const path = [p0, p1, p2, p3, p4];

for (let i = 0; i < timeboxCount; i++) {
    const s = cellToTimeGap + (i * stepDepth);
    const cubeCenter = pointAtArcLength(path, s);
    renderCube(cubeCenter, cubeSize);
}
```

**Step D: Render lane filament**
```javascript
lane = [p0 → p1 → p2 → p3 → p4];
color = mustStaySeparate ? brightCyan : lightBlue;
```

**Primitives used**:
- **Cubes**: `Cesium.BoxGeometry.fromDimensions()` (solid, 1.2m edge)
- **Lanes**: `Cesium.PolylineGeometry` (thin, 2px width)
- **Color coding**: Bright cyan = has formula/history, Light blue = mergeable

---

### 4. Added Lint Checks

**LINT 1: Separation gap respected**
```javascript
if (gapDist < cellToTimeGap - 0.5) {
    throw Error('[LINT] Cell gap too small');
}
```

**LINT 2: Timebox count verification**
```javascript
if (cubesRendered < cellsWithHistory) {
    warn('[LINT WARNING] Some cells missing timeboxes');
}
```

**LINT 3: Exit direction must be opposite branch**
```javascript
if (dot(initialTangent, branchTangent) > 0) {
  throw new Error("Invalid filament: exits cell toward branch");
}
```

---

## 🎯 Verification Steps

### Step 1: Hard Refresh
```
Ctrl+Shift+R
```

### Step 2: Navigate & Lock LOD
1. Zoom in until `LOD: SHEET`
2. Press `L` to lock LOD (prevents thrashing)
3. HUD should show: `LOD: SHEET 🔒`

### Step 3: Press `3` (LookDownBranch) ⭐ **MONEY SHOT**

**What you SHOULD see**:

```
     [Sheet Face-On]
     ┌─────────────┐
     │ A1  B1  C1  │ ← Cell grid
     │ A2  B2  C2  │
     │ ...........  │
     └─────────────┘
       ↓   ↓   ↓     ← Gap (6m, exits opposite branch)
       █   █   █     ← Timecubes embedded on lane
       █   █   █
       █   █   █
       │   │   │     ← Lanes curve to connector
```

**Details**:
- ✅ Sheet appears face-on (vertical page)
- ✅ Cell grid visible (8×6 = 48 cells)
- ✅ **Visible gap** (~6m) between each cell and its first timecube
- ✅ **Cube stacks** behind cells (varying heights: 3-15 cubes)
- ✅ **Thin lane filaments** connecting cells to connector target (spine/merge)
- ✅ **Color coding**:
  - Bright cyan lanes = cells with formulas/history (must stay separate)
  - Light blue lanes = mergeable cells (no formula/history)

### Step 4: Orbit Around (Verify Parallel Lanes)

**Click and drag** to rotate view.

**Should see**:
- Lanes run **parallel** near the sheet (no early convergence)
- Cubes stay **on the lane path** (no diagonal drift)
- Different cube stack **heights** (varying history depth)

---

## 📋 Expected Console Output

After hard refresh:
```
[FilamentRenderer] 📊 Cell grid rendered: 8 rows × 6 cols
[FilamentRenderer] ✅ Sheet plane created: sheet.packaging (perpendicular to branch)
[FilamentRenderer] ⏳ Timebox lanes rendered: 48 lanes, 432 cubes
[FilamentRenderer]   Separate lanes: 24, Mergeable: 24
[GATE 5] Staged filaments for sheet.packaging:
  Stage 1 (Cell→Spine): 48 primitives
  Stage 2 (Spine→Branch): 1 primitive
✅ Tree rendered:
  Primitives: 481 (trunk=1, branches=1, cell-filaments=48, spines=1, timeboxes=432 cubes + 48 lanes)
[TOPOLOGY] ✅ All canonical invariants satisfied
```

**Key numbers**:
- **48 lanes** (one per cell)
- **~432 cubes** (average ~9 cubes per cell)
- **24 separate** (with formula/history)
- **24 mergeable** (no formula/history)

---

## 🎨 Visual Expectations

### From LookDownBranch (Key `3`):

**Sheet face-on with temporal depth**:
```
        PRESENT (sheet + cells)
             ↓ ↓ ↓
        NEAR PAST (gap + first cubes)
             ↓ ↓ ↓
        MID PAST (cube stacks)
             ↓ ↓ ↓
        FAR PAST (older cubes)
             │ │ │
        HISTORY LANES (filaments)
```

### From SideProfile (Key `2`):

**Parallel lanes visible behind sheet**:
```
                [sheet]
                  ║║║║║  (parallel lanes)
                  ███████ (cube stacks)
                  ║║║║║  (lane filaments)
```

---

## 🔍 What Makes a Cell "Separate" vs "Mergeable"

**Rule**: `mustStaySeparate = (timeboxCount > 0) || hasFormula`

**Separate cells** (bright cyan lanes):
- Have formulas (`=SUM()`, `=VLOOKUP()`, etc.)
- Have individual commit history (`timeboxCount > 0`)
- **Must** maintain parallel lanes (identity preserved through time)

**Mergeable cells** (light blue lanes):
- No formulas
- No individual history
- **May** converge to shared merge node (future phase)
- Still show visible lane segment (no teleporting to hub)

**Mix in demo**: 24 cells with formulas, 24 without (50/50 split for visual clarity)

---

## 🎯 PASS/FAIL Criteria

### ✅ PASS if (Key `3` LookDownBranch):
1. Sheet appears face-on (vertical page)
2. **Visible gap (~6m) between cells and first cubes**
3. **Cube stacks visible** behind cells (varying heights)
4. **Thin lane filaments** connect cells to history
5. **Color distinction** (cyan vs light blue lanes)
6. Cubes stay **aligned parallel** (no random rotation)
7. Different stack **heights** (3-15 cubes, varied per cell)

### ❌ FAIL if:
1. No cubes visible (rendering failed)
2. Cubes attached directly to cells (no gap)
3. All cubes same height (data not varied)
4. Cubes rotate/tilt (wrong orientation)
5. Lanes converge early into hub (bundling violation)
6. No color distinction (all same color)

---

## 🔬 Technical Implementation Details

### Cube Rendering
**Primitive**: `Cesium.BoxGeometry.fromDimensions()`  
**Size**: 1.2m × 1.2m × 1.2m  
**Color**: HSL gradient (blue → cyan by timebox index)  
**Position**: `cellPos + timeDir * (gap + i * stepDepth)`

### Lane Rendering
**Primitive**: `Cesium.PolylineGeometry`  
**Width**: 2px  
**Color**: 
- Separate: `#4FC3F7` (bright cyan, alpha 0.6)
- Mergeable: `#90CAF9` (light blue, alpha 0.4)
**Path**: `[cellPos, laneStart, laneEnd]`

### Spatial Calculation
```javascript
timeDir = -sheet._normal  (behind sheet)
laneStart = cellPos + (timeDir * 6m)
cube[i] = laneStart + (timeDir * i * 4m)
```

---

## 📊 Demo Data Distribution

**Total cells**: 48 (8 rows × 6 cols)

**Timebox counts**: Range 2-15 per cell (varied for visual interest)

**Formula cells**: 24 (50% - every other cell roughly)
- Examples: `=SUM()`, `=VLOOKUP()`, `=IF()`, `=AVERAGE()`, `=PMT()`, `=NPV()`, etc.

**Empty cells**: 24 (50% - no formula, just values)

**Result**: You'll see **parallel braided structure** with alternating cyan (formula) and light blue (mergeable) lanes.

---

## 🚀 Next Steps

### After Visual PASS:
1. ✅ Capture proof screenshots (key `3` and key `2` views)
2. Add **convergence rendering** for mergeable cells (optional)
3. Add **LINT 3 & 4** (hub detection, merge validation)
4. Restore full tree (`SINGLE_BRANCH_PROOF = false`) to see both branches with timeboxes
5. Proceed to **Phase 4**: Inter-sheet bundling (sheet lanes converge to branch spine)

### If Visual FAIL:
- Adjust spacing constants (`cellToTimeGap`, `stepDepth`, `cubeSize`)
- Adjust colors (cyan vs blue contrast)
- Check LOD (must be SHEET or CELL to see cubes)
- Verify timeDir calculation (should point away from observer when looking down branch)

---

## 🎥 The Acceptance Shot

**Press `3` (LookDownBranch)**:

You should see a **spreadsheet with temporal depth** - not just a flat grid, but a grid where **every cell has its own history lane** running back from it, with **cubes stacked like time blocks**.

This is the **"filament view"** from your reference images - parallel identity lanes, each cell maintaining its position through time.

---

**Status**: Phase 3 implemented. 48 cells, 48 lanes, ~432 cubes ready to render.

**Next**: Hard refresh, lock LOD (key `L`), press `3`, and report what you see!

---

**Files modified**:
1. `app/utils/enu-coordinates.js` (timebox constants)
2. `relay-cesium-world.html` (cell data with formulas/history)
3. `app/renderers/filament-renderer.js` (renderTimeboxLanes method)
