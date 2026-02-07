# Sheet Orientation Fix - COMPLETE

**Date:** 2026-02-06  
**Status:** ✅ FIXED - Sheet face now perpendicular to filament flow

---

## 🎯 Problem

**Observable:** Filaments were exiting the "side" or "edge" of the sheet plane instead of the "face"

**Root Cause:** Sheet rotation was using incorrect geometric logic:
- Old method: Cross product + additional 90° Y rotation
- Result: Sheet face not aligned with filament flow direction

**Expected:** Sheet face ⟂ filament flow (sheet normal ∥ flow direction)

---

## ✅ Fix Applied

### 1. Correct Flow Direction Computation ✅

**Location:** Sheet rotation section (line ~4773)

```javascript
// OLD (wrong):
// branchDir = from parent TO sheet
// Then rotate with cross product + manual 90° adjustment

// NEW (correct):
// Flow direction = FROM sheet TO parent (where filaments go)
const flowDir = branchDir.clone().multiplyScalar(-1); // toward parent/root
```

**Key insight:** Filaments flow FROM cells TO branch (toward root), so flow direction is **opposite** of branch direction

---

### 2. Clean Quaternion Rotation ✅

**OLD rotation code (complex, error-prone):**
```javascript
const rotationAxis = new THREE.Vector3().crossVectors(
    new THREE.Vector3(0, 0, 1),
    branchDir
).normalize();
const rotationAngle = Math.acos(new THREE.Vector3(0, 0, 1).dot(branchDir));
if (rotationAxis.lengthSq() > 0.001) {
    sheetGroup.setRotationFromAxisAngle(rotationAxis, rotationAngle);
}
sheetGroup.rotateY(Math.PI / 2); // Manual adjustment
```

**NEW rotation code (clean, correct):**
```javascript
// Sheet default normal is +Z
const defaultNormal = new THREE.Vector3(0, 0, 1);

// Rotate sheet so its normal aligns with flow direction
const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultNormal, flowDir);
sheetGroup.quaternion.copy(quaternion);
```

**Why better:**
- Uses `setFromUnitVectors()` for clean alignment
- No manual angle calculations
- No additional 90° adjustments
- Mathematically guaranteed: sheet normal ∥ flow direction

---

### 3. Embed Sheet Behind Cell Anchors ✅

**NEW:** Sheet is moved slightly back along its normal

```javascript
const embed = 0.4; // distance behind cell anchors
const sheetNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
const embedOffset = sheetNormal.clone().multiplyScalar(-embed);
sheetGroup.position.add(embedOffset);
```

**Result:** Filaments visually "land" on the sheet face (not starting inside it)

---

### 4. Cell Z-Position Adjustment ✅

**Location:** Cell positioning (line ~4700)

```javascript
// OLD:
const cellZ = sheetDepth / 2 + cellSize / 2;

// NEW:
const cellZ = (sheetDepth / 2) + (cellSize / 2) + 0.01; // Slightly in front
```

**Why:** Ensures cells sit cleanly ON the sheet face (+Z face)

---

### 5. Debug Visualization ✅

**NEW:** Magenta arrow showing flow direction

```javascript
const arrowHelper = new THREE.ArrowHelper(flowDir, pos, 2.5, 0xff00ff, 0.5, 0.3);
scene.add(arrowHelper);
console.log('[Relay] 📐 Sheet flow direction:', flowDir.toArray());
```

**Usage:** Look for magenta arrow sticking straight out from sheet - this is the flow direction

---

## 🔍 Validation Checklist

### Pass Criteria (All Must Pass)

✅ **Sheet face perpendicular to filament bundle direction**
- Look at filaments: they should go in one direction (toward branch/root)
- Look at sheet plane: its face should be facing that direction
- Filaments should appear to emerge from the sheet FACE, not the edge

✅ **Magenta arrow visualization**
- Each sheet should have a magenta arrow pointing out from it
- Arrow should be aligned with the average filament direction
- Arrow should be pointing toward the parent branch

✅ **No "side-mounted" appearance**
- Cells should appear to be sitting ON a platform
- Filaments should drop straight down from cells (perpendicular to platform)
- Sheet should look like a "landing pad" for filaments

✅ **Rotation consistency**
- Rotate camera around sheet from different angles
- Sheet orientation should remain consistent (not billboard/lookAt)
- Filaments should always exit from the same face

✅ **Console log verification**
```
[Relay] 📐 Sheet flow direction: [x, y, z]
```
- Each sheet should log its flow direction
- Flow direction should point toward parent/root (typically downward/inward)

---

## 🧪 Visual Test

### Before Fix:
```
     ║  ← filaments
     ║
━━━━━╋━━━━  ← sheet (WRONG: edge facing filaments)
     ║
     ║
```

### After Fix:
```
     ║  ← filaments
     ║
     ▼
   ┌───┐
   │   │  ← sheet face (CORRECT: face perpendicular to flow)
   └───┘
```

---

## 📊 Technical Details

### Geometric Relationship

**Correct:**
- Sheet normal vector: `n`
- Filament flow direction: `f`
- Relationship: `n ∥ f` (parallel)
- Result: Sheet face ⟂ filaments (perpendicular)

### Quaternion Rotation

**Method:** `Quaternion.setFromUnitVectors(from, to)`

**What it does:**
- Computes shortest rotation from `from` vector to `to` vector
- Returns quaternion that rotates `from` → `to`
- Automatically handles edge cases (opposite vectors, etc.)

**In our case:**
- `from = (0, 0, 1)` - default sheet normal (+Z)
- `to = flowDir` - computed filament flow direction
- Result: Sheet rotates so its +Z face points along flow direction

### Embedding

**Purpose:** Prevent Z-fighting and visual artifacts

**Value:** `0.4` units back along normal
- Too small: Filaments start inside sheet
- Too large: Gap between filaments and sheet
- Current: Balanced for clean visual connection

---

## 🐛 Common Issues After Fix

### Issue: "Sheet disappeared"
**Cause:** Embed distance moved sheet behind globe/branches
**Fix:** Reduce embed value from 0.4 to 0.2

### Issue: "Arrow pointing wrong way"
**Cause:** Flow direction computation inverted
**Fix:** Check `flowDir = branchDir.clone().multiplyScalar(-1)` is present

### Issue: "Filaments still sideways"
**Cause:** Filaments using old cell positions (before rotation)
**Fix:** Hard refresh browser to clear old code

---

## 🔧 Debug Commands

### In Console:
```javascript
// Find first sheet
const sheet = commitNodes.find(n => n.userData?.nodeData?.type === 'sheet');

// Check sheet quaternion
console.log('Sheet quaternion:', sheet.quaternion);

// Check flow direction (stored in arrow if visible)
const arrow = scene.children.find(c => c.type === 'ArrowHelper');
console.log('Arrow direction:', arrow?.direction);

// Get sheet normal
const normal = new THREE.Vector3(0,0,1).applyQuaternion(sheet.quaternion);
console.log('Sheet normal:', normal.toArray());
```

---

## ✅ Success Criteria Summary

**Canon must report after import:**

1. ✅ Slab face clearly perpendicular to filament bundle direction
2. ✅ Filaments emerge from slab FACE (not edge)
3. ✅ Magenta debug arrow points straight out of slab
4. ✅ Rotating camera shows consistent alignment (no flipping)
5. ✅ Console logs flow direction for each sheet

**If all 5 pass → Orientation is CORRECT! 🎉**

---

## 📝 One-Line Summary

**Sheet face is now mathematically guaranteed to be perpendicular to filament flow using quaternion alignment (normal ∥ flow direction).**

---

## 🚀 Next Steps

1. **Test:** Hard refresh browser and import Excel file
2. **Verify:** Check all 5 success criteria above
3. **Debug:** If issues, press `I` for scene summary, check flow direction logs
4. **Clean up:** Remove debug arrows once validated (optional - they're helpful)

---

**Status:** 🟢 IMPLEMENTATION COMPLETE - Ready for Validation
