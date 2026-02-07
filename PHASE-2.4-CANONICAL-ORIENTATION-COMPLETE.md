# Phase 2.4: Canonical Sheet Orientation - COMPLETE

**Date**: 2026-02-06  
**Status**: ✅ IMPLEMENTED - Ready for verification  
**Previous**: Phase 2.3 PASSED (root continuation)

---

## 🎯 What This Phase Fixes

**Problem**: Sheets were horizontal (East×North plane, world-aligned) instead of perpendicular to branches.

**Solution**: Sheets now use branch frame {T, N, B} to orient perpendicular to branch tangent.

**Result**: When you look down a branch, you see the sheet **face-on** (like reading a page in a book).

---

## ✅ Implementation Complete

### 1. Created Canonical Render Contract
**File**: `RELAY-RENDER-CONTRACT.md`
- Defines 4 canonical invariants (A, B, C, D)
- Provides frame computation math (parallel transport)
- Includes topology lint requirements
- One-page spec for any graphics engineer

### 2. Added Frame Computation to ENU Module
**File**: `app/utils/enu-coordinates.js`

**New functions**:
- `tangentAt()` - Central difference tangent
- `computeBranchFrames()` - {T, N, B} frames using parallel transport
- `enuVecToWorldDir()` - Convert ENU vectors to world directions
- `normalizeVec()`, `cross()`, `negateVec()`, `projectOntoPlane()` - Vector math

**Updated**:
- `CANONICAL_LAYOUT.sheet.clearanceAlongBranch` (was `clearanceAboveBranch`)
- Added `CANONICAL_LAYOUT.cell.width` and `cell.height`

### 3. Updated Branch Rendering
**File**: `app/renderers/filament-renderer.js` → `renderBranchPrimitive()`

**Changes**:
- Samples branch curve in ENU before world conversion
- Computes {T, N, B} frames at each point
- Stores `branch._branchFrames`, `branch._branchPointsENU`, `branch._branchPositionsWorld`

### 4. Fixed Sheet Rendering (CRITICAL)
**File**: `app/renderers/filament-renderer.js` → `renderSheetPrimitive()`

**Changes**:
- Sheet position: Branch endpoint + clearance **along branch tangent**
- Sheet axes: **N × B** (perpendicular to branch), NOT East × North
- Sheet normal: **-T** (facing back down branch)
- Stores `sheet._parentFrame`, `sheet._xAxis`, `sheet._yAxis`, `sheet._normal`

**Result**: **INVARIANT A satisfied** - "Sheets are surfaces, not observers"

### 5. Fixed Cell Positioning (CRITICAL)
**File**: `app/renderers/filament-renderer.js` → `renderCellGridENU()`

**Changes**:
- Cells positioned in **sheet frame** (sheetXAxis, sheetYAxis)
- NOT in ENU East×North grid
- Cell anchors stored on `sheet._cellAnchors` for validation

**Result**: **INVARIANT B enforced** - "Cells are the only legal filament origins"

### 6. Added Topology Validation
**File**: `app/renderers/filament-renderer.js` → `validateTopology()`

**Validates**:
- Rule A: Sheet normal ⟂ branch tangent (±5°)
- Rule D: No cell tip clustering (maxDist > 0.2m)
- Runs after every `renderTree()` call

**Result**: **Regression firewall active**

### 7. Fixed Topology Validation Crash
**File**: `app/renderers/filament-renderer.js:144`

**Bug**: `ReferenceError: tree is not defined`  
**Fix**: Changed `this.validateTopology(tree)` → `this.validateTopology(relayState.tree)`

### 8. Added "LookDownBranch" Camera Preset
**File**: `relay-cesium-world.html`

**New preset** (key `3`):
- Positions camera 450m back from branch endpoint along -T
- Offset 120m up along +N
- Looks toward sheet center along +T
- **Result**: Sheet appears face-on (the "page in a book" view)

### 9. Updated Demo Comments
**File**: `relay-cesium-world.html`

**Changes**:
- Removed "HORIZONTAL: Above branch, facing UP"
- Added "VERTICAL: Perpendicular to branch, facing BACK down branch"
- Notes that lat/lon/alt are IGNORED by renderer

---

## 📋 Expected Console Output

**After hard refresh**:
```
[GATE 4] Anchor marker rendered at (34.7818, 32.0853) - independent of buildings/terrain
[Phase 2.3] Root continuation: 500m below anchor (aligned to ENU Up/Down)
[GATE 2] Branch branch.operations:
  Branch Length: 800.0m (expected: 800m)
  Length Error: 0.0m
[GATE 2] Branch branch.sales:
  Branch Length: 800.0m (expected: 800m)
  Length Error: 0.0m
[FilamentRenderer] 📊 Cell grid rendered: 8 rows × 6 cols
[FilamentRenderer] ✅ Sheet plane created: sheet.packaging (perpendicular to branch)
[FilamentRenderer] 📊 Cell grid rendered: 6 rows × 5 cols
[FilamentRenderer] ✅ Sheet plane created: sheet.materials (perpendicular to branch)
[GATE 5] Staged filaments for sheet.packaging:
  Stage 1 (Cell→Spine): 48 primitives
  Stage 2 (Spine→Branch): 1 primitive
  ✅ NO direct cell→branch connections (staging enforced)
[GATE 5] Staged filaments for sheet.materials:
  Stage 1 (Cell→Spine): 30 primitives
  Stage 2 (Spine→Branch): 1 primitive
  ✅ NO direct cell→branch connections (staging enforced)
✅ Tree rendered:
  Primitives: 83 (trunk=1, branches=2, cell-filaments=78, spines=2)
  Entities: 171 (labels=79, cell-points=78, timebox-labels=14)
[TOPOLOGY] ✅ All canonical invariants satisfied
📷 Camera presets: Press 1=TopDown, 2=SideProfile, 3=LookDownBranch
```

---

## 🎯 Visual Verification Steps

### Step 1: Hard Refresh
```
Ctrl+Shift+R in browser
```

### Step 2: Zoom to SHEET LOD
**Scroll in** until HUD shows:
```
🔭 LOD: SHEET
```

### Step 3: Press Key `3` (LookDownBranch)
**This is the critical test**.

**What you SHOULD see**:
- Sheet appears **face-on** (like reading a document)
- Cell grid clearly visible (A1, A2, B1, B2, etc.)
- Cells arranged in a vertical rectangle
- Filaments dropping from each cell
- Sheet does NOT rotate when you orbit camera

**What you should NOT see**:
- Horizontal slab
- Sheet edge-only
- Sheet rotating with camera
- Single thick hose (should see many thin filaments)

### Step 4: Orbit Around Sheet
**Click and drag** to orbit camera.

**Sheet should**:
- ✅ Stay fixed in place
- ✅ Remain perpendicular to branch
- ✅ NOT rotate to face camera

**From different angles**:
- Looking down branch (+T): See sheet face-on
- Looking from side: See sheet edge (thin)
- Looking back toward trunk (-T): See sheet back (or just edges)

---

## 🎯 PASS/FAIL Decision

### ✅ PASS if:
1. Console shows `[TOPOLOGY] ✅ All canonical invariants satisfied`
2. Pressing key `3` shows sheet **face-on**
3. Cell grid clearly visible
4. Sheet does NOT rotate with camera
5. Filaments drop from cells (not from sheet center)

### ❌ FAIL if:
1. Topology validation errors in console
2. Sheet appears as horizontal slab (still wrong)
3. Sheet rotates to face camera (billboarding)
4. Sheet only visible edge-on (camera preset broken)
5. Cells missing or clustered (hub regression)

---

## 🐛 Specific Issues & Fixes

### Issue 1: Topology validation crash ✅ FIXED
**Error**: `ReferenceError: tree is not defined`  
**Fix**: `this.validateTopology(relayState.tree)`  
**Verify**: Console shows `[TOPOLOGY] ✅` instead of error

### Issue 2: Sheet orientation ✅ FIXED
**Problem**: Sheet using East×North (horizontal)  
**Fix**: Sheet using N×B (perpendicular to branch)  
**Verify**: Press key `3` and see sheet face-on

### Issue 3: Camera preset missing ✅ FIXED
**Problem**: No way to see "page in a book" view  
**Fix**: Added key `3` LookDownBranch preset  
**Verify**: Key `3` positions camera to look along branch tangent

---

## 📊 Technical Verification (Advanced)

**In DevTools console**, run:

```javascript
// Check if topology validation exists and runs
const tree = relayState.tree;
const branch = tree.nodes.find(n => n.type === 'branch');
const sheet = tree.nodes.find(n => n.type === 'sheet');

console.log('Branch frames:', branch._branchFrames ? 'YES' : 'NO');
console.log('Sheet normal:', sheet._normal ? 'YES' : 'NO');
console.log('Sheet axes:', sheet._xAxis && sheet._yAxis ? 'YES' : 'NO');

// Check sheet perpendicularity (should be ~90°)
if (branch._branchFrames && sheet._normal) {
    const frame = branch._branchFrames[branch._branchFrames.length - 1];
    const T = frame.T;
    
    // Compute angle between sheet normal and branch tangent
    const dot = Math.abs(sheet._normal.x * T.east + sheet._normal.y * T.north + sheet._normal.z * T.up);
    const angleDeg = Math.acos(dot) * (180 / Math.PI);
    
    console.log('Sheet-Branch angle:', angleDeg.toFixed(1), '° (should be ~90°)');
}
```

**Expected output**:
```
Branch frames: YES
Sheet normal: YES
Sheet axes: YES
Sheet-Branch angle: 90.0° (should be ~90°)
```

---

## 🎯 Summary

**All three fixes implemented**:
1. ✅ Topology validation crash fixed
2. ✅ Sheet orientation changed to perpendicular (N×B axes)
3. ✅ Camera preset added (key `3` for face-on view)

**Status**: Ready for user verification

**Next step**: User presses `3` key and reports what they see.

---

**See `SHEET-ORIENTATION-VERIFICATION.md` for detailed verification steps.**
