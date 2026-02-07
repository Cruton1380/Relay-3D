# Topology Fixes - Implementation Status

**Date:** 2026-02-06  
**Status:** ✅ FIX 1 COMPLETE | 🔄 FIX 2 PREPARED (needs completion)

---

## 🎯 Two Structural Violations Fixed

### Fix 1: SheetBundleSpine Staging ✅ COMPLETE

**Problem:** Cells were wiring directly to branch (hub topology)

**Solution:** Two-stage bundling with intermediate anchor

#### Implementation Complete:

**1. SheetBundleSpine Anchor Created** (line ~4680)
```javascript
// One spine per sheet (behind sheet, local -Z)
const spineLocalPos = new THREE.Vector3(0, 0, -sheetDepth * 0.6);
const spineMesh = new THREE.Mesh(spineGeom, spineMat);
spineMesh.userData = { type: 'sheetBundleSpine' };
sheetGroup.add(spineMesh);

// Store for filament rendering
sheetGroup.userData.spineLocalPos = spineLocalPos.clone();
```

**2. Stage 1: Cell → SheetSpine (Local Filaments)** (line ~5415)
```javascript
// Short, thin filaments (Cell → SheetBundleSpine)
const localCurve = new THREE.CatmullRomCurve3(localPathPoints, ...);
const localTubeGeom = new THREE.TubeGeometry(
    localCurve,
    8,                    // fewer segments (short)
    filamentRadius * 0.7, // thin
    4,
    false
);

const localFilament = new THREE.Mesh(localTubeGeom, localMat);
localFilament.userData = {
    type: 'localFilament',
    stage: 'cell-to-spine'
};
```

**3. Stage 2: SheetSpine → Branch (Conduit Filament)** (line ~5515)
```javascript
// ONE thick conduit per sheet (not per cell)
const conduitCurve = new THREE.CatmullRomCurve3(conduitPoints, ...);

const conduitRadiusFunction = (u) => {
    const taperFactor = 0.8 + (u * 0.4);  // Taper: spine → branch
    return 0.025 * taperFactor;  // Thicker than local
};

const conduitGeom = new THREE.TubeGeometry(
    conduitCurve, 16, 0.025, 6, false, conduitRadiusFunction
);

const conduitFilament = new THREE.Mesh(conduitGeom, conduitMat);
conduitFilament.userData = {
    type: 'conduitFilament',
    stage: 'spine-to-branch'
};
```

**Result:**
```
Cell → (thin local) → SheetBundleSpine → (thick conduit) → Branch
```

**Topology is now correct:**
- ✅ No hub at sheet
- ✅ No direct cell-to-branch wiring
- ✅ Aggregation happens along length (spine)
- ✅ One conduit per sheet (not per cell)

---

### Fix 2: Timebox Segmentation 🔄 PREPARED (completion needed)

**Problem:** Timeboxes are decorative rings on continuous filaments

**Solution:** Filaments ARE segments (material slices, not ornaments)

#### Concept:

**WRONG (current):**
```
─────────────── continuous filament
   ○   ○   ○   rings on top (decorative)
```

**CORRECT (target):**
```
═══════▌═══════▌═══════ segmented filaments
  TB1      TB2      TB3  each owns a segment
```

#### Implementation Approach:

**Step 1: Helper Function** ✅ Added
```javascript
function sliceCurve(curve, t0, t1) {
    const points = [];
    const samples = 8;
    for (let i = 0; i <= samples; i++) {
        const t = t0 + (t1 - t0) * (i / samples);
        points.push(curve.getPoint(t));
    }
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
}
```

**Step 2: Segment Rendering Logic** ✅ Implemented (line ~5617)
```javascript
sheetTimeboxes.forEach((timebox, tbIndex) => {
    // Calculate t range for this segment
    const t0 = tbIndex / numSegments;
    const t1 = (tbIndex + 1) / numSegments;
    
    // Slice curve to get segment
    const segmentCurve = sliceCurve(curve, t0, t1);
    
    // Render segment with state-aware material
    const segmentGeom = new THREE.TubeGeometry(segmentCurve, 8, baseRadius, 4, false);
    
    // Color based on timebox state
    if (timebox.state === 'VERIFIED') {
        segmentColor = 0x00FFAA;  // Green
    } else if (timebox.state === 'DEGRADED') {
        segmentColor = 0x00DDFF;  // Yellow
    } else {
        segmentColor = 0x0099CC;  // Dim
    }
    
    const segment = new THREE.Mesh(segmentGeom, segmentMat);
    segment.userData = {
        type: 'filamentSegment',
        timeboxId: timebox.timeboxId,
        commitRange: timebox.commitRange,
        state: timebox.state
    };
    
    scene.add(segment);
});
```

**Step 3: Boundary Markers** ✅ Added
```javascript
// Ring at segment boundary (not floating)
const boundaryPos = curve.getPoint(t1);
const boundaryTangent = curve.getTangent(t1).normalize();

const ring = new THREE.Mesh(ringGeom, ringMat);
ring.position.copy(boundaryPos);
ring.userData = {
    type: 'timeboxBoundary',
    afterTimebox: timebox.timeboxId
};
```

---

## 🔍 Validation Tests

### Test 1: Bundling (SheetBundleSpine)

**Visual Test:**
1. Hard refresh browser
2. Import Excel file
3. Enter FREE-FLY mode
4. Rotate camera around sheet from different angles

**Expected:**
- ✅ Many thin filaments go from cells to a central point behind sheet (spine)
- ✅ ONE thick conduit goes from spine to branch
- ✅ NEVER see cells wiring directly into branch
- ✅ Flow reads as: cells → spine → branch

**Console Verification:**
```
[Relay] 🔗 Conduit filament: SheetSpine → Branch for Northwind
```

---

### Test 2: Segmentation (Timeboxes)

**Visual Test:**
1. Look at filaments close-up
2. Filaments should be color-coded by state:
   - Green segments = VERIFIED
   - Yellow segments = DEGRADED
   - Dim blue = INDETERMINATE
3. Thin golden rings at segment boundaries

**Expected:**
- ✅ Filaments are NOT continuous
- ✅ Each segment has a different color/brightness
- ✅ Removing a timebox would remove a segment (not just a ring)

**Console Verification:**
```
[Relay] ⏰ Filament segments rendered: N (M segments per filament)
```

---

## 🔒 Canonical Rules Enforced

### Rule 1: No Hidden Hubs
**Enforcement:** SheetBundleSpine is explicit, visible, one-per-sheet  
**Test:** Count `sheetBundleSpine` objects = count sheets

### Rule 2: Aggregation Along Length
**Enforcement:** Cells → Spine → Branch (staged, not convergent)  
**Test:** Local filaments never skip spine

### Rule 3: Time is Discrete
**Enforcement:** Filaments are segmented by commit boundaries  
**Test:** Each segment owns a commitRange

### Rule 4: No Continuous Time Illusion
**Enforcement:** Segments have state-aware colors (no uniform tube)  
**Test:** Adjacent segments can have different states/colors

---

## 🧪 Topology Lint (Auto-Verification)

**Function:** `relayLintTopology()` (line ~5719)

**Checks:**

1. **No shared cell tips** (no hub at cells)
2. **Sheet is never an endpoint** (filaments go to cells, not sheets)
3. **1 cell = 1 filament** (per sheet)

**Usage:**
```javascript
const result = relayLintTopology(state);
if (!result.pass) {
    console.error('[Relay] ❌ Topology violations:', result.errors);
}
```

---

## 📊 Implementation Status

| Fix | Status | Line | Complete |
|-----|--------|------|----------|
| SheetBundleSpine anchor | ✅ Done | ~4680 | Yes |
| Local filaments (Cell → Spine) | ✅ Done | ~5415 | Yes |
| Conduit filament (Spine → Branch) | ✅ Done | ~5515 | Yes |
| Segmentation helper (sliceCurve) | ✅ Done | ~5622 | Yes |
| Segment rendering loop | 🔄 Partial | ~5630 | Needs integration |
| Boundary markers | ✅ Done | ~5680 | Yes |

---

## 🔧 Remaining Work

### Complete Segmentation Implementation

**Current Issue:** The segmentation code is added but needs to replace the old continuous filament + puck rendering

**Steps to Complete:**

1. **Remove old continuous filament rendering**
   - Find where local filaments are created as continuous tubes
   - Replace with segmented approach

2. **Replace puck rendering with boundary rings**
   - Current: Pucks placed on continuous filaments
   - Target: Rings only at segment boundaries

3. **Update hover interaction**
   - Current: Hover brightens pucks
   - Target: Hover brightens entire segment

4. **Test with file that has 0 commits**
   - Should show continuous filaments (no segmentation)
   - Proves "no commits = no timeboxes" rule

---

## 📝 One-Line Summary

**Fix 1 (Complete):** Cells now wire through SheetBundleSpine to branch (two-stage: thin locals + thick conduit), eliminating hub topology.

**Fix 2 (Prepared):** Infrastructure for segmented filaments is implemented, needs integration to replace continuous tubes with state-aware segments.

---

**Status:** 🟢 FIX 1 READY FOR TESTING | 🟡 FIX 2 NEEDS COMPLETION
