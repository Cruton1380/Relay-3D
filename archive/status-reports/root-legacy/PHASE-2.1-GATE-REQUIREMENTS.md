# Phase 2.1 Gate Requirements (BLOCKING PHASE 3)

**Date**: 2026-02-06  
**Status**: 🚧 REQUIRED BEFORE PHASE 3  
**User Instruction**: "Do not start Phase 3 until Phase 2.1 gate passes"

---

## 🎯 Current State (Confirmed by Log)

### ✅ What's Working
- Timeboxes visible (8 total: trunk=4, branches=2+2)
- Sheet planes rendering
- Cell grids rendering (48+30 cells)
- 1:many filaments (78 connections)
- Turgor animation running
- LOD transitions functioning

### ❌ What's Blocking Phase 3
```
Current console output:
✅ Tree rendered: 169 entities

This means: ENTITY MODE (not primitives)
```

**Problem**: Entities are "toy-like" and don't scale. Phase 3 requires primitives for segmentation.

---

## 🚪 Phase 2.1 Gate Criteria (All Required)

### A. Primitives for Trunk Geometry ✅ REQUIRED
**Current**: Trunk rendered as Entity with polyline  
**Required**: Trunk rendered as Primitive

```javascript
// Convert from:
this.viewer.entities.add({
    polyline: { positions: [base, top], width: 8 }
});

// To:
const geometry = new Cesium.PolylineVolumeGeometry({
    polylinePositions: [base, top],
    shapePositions: createCircleProfile(radius),
    cornerType: Cesium.CornerType.ROUNDED
});

const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({ geometry }),
    appearance: new Cesium.MaterialAppearance()
});

this.viewer.scene.primitives.add(primitive);
```

**Pass Criteria**: Console shows "Trunk: X primitives" (not entities)

---

### B. Primitives for Branch Geometry ✅ REQUIRED
**Current**: Branches rendered as Entity with polyline  
**Required**: Branches rendered as Primitive with proper volume

```javascript
// Use CorridorGeometry or PolylineVolumeGeometry
const geometry = new Cesium.CorridorGeometry({
    positions: arcPositions,
    width: branchWidth,
    cornerType: Cesium.CornerType.ROUNDED,
    extrudedHeight: 0  // Or appropriate value
});
```

**Pass Criteria**: Console shows "Branches: X primitives" (not entities)

---

### C. Primitives for Cell Filaments (at SHEET/CELL LOD) ✅ REQUIRED
**Current**: 78 cell filaments as Entity polylines  
**Required**: At least sheet→spine conduit as Primitive, or all filaments as primitives at close LOD

**Option 1** (Full primitive):
- Each cell filament as primitive
- Heavy but canonical

**Option 2** (Hybrid LOD):
- FAR zoom (LANIAKEA/PLANETARY): Entities OK (not visible)
- CLOSE zoom (SHEET/CELL): Primitives required

**Pass Criteria**: At SHEET LOD, console shows "Cell filaments: X primitives" (or hybrid count)

---

### D. Entities ONLY for Labels/HUD ✅ REQUIRED
**Current**: Entities used for all geometry  
**Required**: Entities used ONLY for:
- Cell labels (A1, B2, C3...)
- Timebox labels (W1, W2...)
- HUD elements
- Interactive markers

**NOT for**:
- Trunk geometry
- Branch geometry
- Filament geometry (at close LOD)
- Sheet planes (if possible)

**Pass Criteria**: Console shows clear separation:
```
Primitives: [trunk=1, branches=2, filaments=78+] total=81+
Entities: [labels=78, timeboxLabels=8, HUD=N] total=86+ (labels only)
```

---

### E. Console Output Format ✅ REQUIRED

**Current (FAIL)**:
```
✅ Tree rendered: 169 entities
```

**Required (PASS)**:
```
✅ Tree rendered:
  Primitives: 81 (trunk=1, branches=2, filaments=78)
  Entities: 86 (labels only)
```

Or at minimum:
```
✅ Tree rendered: 81 primitives, 86 entities (labels)
```

---

## 📋 Implementation Steps (Ordered)

### Step 1: Trunk Primitives
1. Create `renderTrunkPrimitive(trunk)` method
2. Use `PolylineVolumeGeometry` with circular cross-section
3. Replace `renderTrunk()` to call primitive version
4. Test: Console should show "trunk primitive" count

### Step 2: Branch Primitives
1. Create `renderBranchPrimitive(branch)` method
2. Use `CorridorGeometry` for curved branches
3. Replace `renderBranch()` to call primitive version
4. Test: Console should show "branch primitive" count

### Step 3: Cell Filament Primitives (LOD-based)
1. Modify `renderCellFilaments()` to check LOD
2. At SHEET/CELL LOD: Use primitives
3. At far LOD: Can use entities (or hide)
4. Test: Console shows correct count based on LOD

### Step 4: Update Console Logging
1. Add `this.primitives` array tracking
2. Log primitive count separate from entity count
3. Format: `X primitives, Y entities (labels)`

### Step 5: Capture Proof
1. Screenshot showing tree with primitives
2. Console log showing primitive/entity counts
3. Save to `archive/proofs/phase2.1-primitives-complete.png`
4. Save console to `archive/proofs/phase2.1-primitives-console.log`

---

## 🚫 What NOT to Do Before Phase 2.1 Passes

**DO NOT**:
- Start Phase 3 timebox segmentation
- Implement material-based segmentation
- Add segment click handlers
- Work on timebox metadata UI

**These all require primitives to work properly.**

**DO**:
- Fix branch curvature (monotonic upward first 20%) ✅ DONE
- Add surface reference visual ✅ DONE
- Complete primitives migration
- Test LOD transitions with primitives

---

## 🔍 How to Verify Phase 2.1 PASS

### Visual Test
1. Hard refresh
2. Branches should curve upward initially (not droop)
3. Trunk/branches should look "solid" (not just lines)
4. Horizon/atmosphere visible (spatial reference)

### Console Test
```javascript
// Required output format:
✅ Tree rendered: X primitives, Y entities (labels)

// Where:
X >= 81 (trunk + branches + filaments at SHEET LOD)
Y = labels only (cell labels + timebox labels + HUD)
```

### HUD Test
```
HUD should show:
🌲 Filaments: PRIMITIVE (not ENTITY MODE)
```

---

## 📊 Reference Implementation

See `app/renderers/relationship-renderer.js` - Already uses primitives correctly:
- Line ~100-150: PolylineGeometry creation
- Line ~150-200: GeometryInstance setup
- Line ~200-250: Primitive creation + scene.primitives.add()

Use this as template for trunk/branch/filament migration.

---

## 🎯 Phase 2.1 PASS Criteria Summary

Phase 2.1 = ✅ PASSED only when:

1. ✅ Trunk rendered as primitive
2. ✅ Branches rendered as primitives
3. ✅ Cell filaments as primitives (at SHEET LOD minimum)
4. ✅ Entities used ONLY for labels/HUD
5. ✅ Console shows: "X primitives, Y entities (labels)"
6. ✅ HUD shows: "Filaments: PRIMITIVE"
7. ✅ Screenshot + console log captured
8. ✅ Visual test: branches curve upward, no drooping

Otherwise = REFUSAL with specific reason code.

---

## 🚧 Current Blockers for Phase 3

**Phase 3 requires**:
- Segmented geometry per timebox window
- Material-based state encoding
- Clickable segments with metadata

**All of these REQUIRE primitives because**:
- Can't segment entity polylines dynamically
- Can't apply materials to entities in same way
- Primitives required for proper LOD + click handlers

**Therefore**: Phase 2.1 must pass BEFORE Phase 3 can begin.

---

## 📝 Copy/Paste Instruction for Canon

```
CANON: Phase 2.1 REQUIRED before Phase 3.

Current state: 169 entities (ENTITY MODE) ❌
Required state: X primitives, Y entities (labels) ✅

Migrate:
1. Trunk: PolylineVolumeGeometry primitive
2. Branches: CorridorGeometry primitives  
3. Cell filaments: Primitives at SHEET/CELL LOD
4. Entities ONLY for labels

Reference: relationship-renderer.js (already uses primitives)

Console must show: "X primitives, Y entities (labels)"
HUD must show: "Filaments: PRIMITIVE"

After Phase 2.1 proof captured → Then Phase 3.
```

---

**Status**: Phase 2.1 gate requirements documented. Branch curvature fixed (monotonic upward). Surface reference added. Ready for primitives migration implementation.
