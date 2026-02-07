# Topology Validation Fix - Parallel vs Perpendicular

**Date**: 2026-02-06  
**Issue**: Validation rule was backwards  
**Status**: ✅ FIXED

---

## 🐛 The Bug

**Console showed**:
```
❌ Sheet sheet.packaging: normal not ⟂ branch tangent (angle=0.0°, expected=90°±5°)
```

**Translation**: Validation expected sheet normal to be **perpendicular** (90°) to branch tangent, but it was **parallel** (0°).

---

## 🤔 Why This Was Wrong

### Geometry Basics

For a sheet to appear **face-on** when looking down a branch:
- The **sheet plane** must be perpendicular to the branch tangent
- Which means the **sheet normal** must be **parallel** (or anti-parallel) to the branch tangent

### The Confusion

**Spec said** (correctly):
> "Sheet normal = −T where T is branch tangent"

**But validation checked** (incorrectly):
> "Sheet normal perpendicular to branch tangent (90°)"

This is contradictory! If sheet normal = −T and branch tangent = T, they're **anti-parallel** (opposite directions, 180°), which gives an absolute angle of **0°**, not 90°.

---

## ✅ The Fix

### Changed Validation Rule

**Before** (wrong):
```javascript
// Should be ~90° (perpendicular)
if (Math.abs(angleDeg - 90) > 5) {
    violations.push(`Sheet ${sheet.id}: normal not ⟂ branch tangent (angle=${angleDeg.toFixed(1)}°, expected=90°±5°)`);
}
```

**After** (correct):
```javascript
// Should be ~0° (parallel or anti-parallel)
if (angleDeg > 5) {
    violations.push(`Sheet ${sheet.id}: normal not parallel to branch tangent (angle=${angleDeg.toFixed(1)}°, expected=0°±5°)`);
}
```

### Updated Spec

**File**: `RELAY-RENDER-CONTRACT.md`

**Before**:
```
Lint check: |dot(sheetNormal, branchTangent)| > cos(85°) → FAIL (not perpendicular)
```

**After**:
```
Lint check: |dot(sheetNormal, branchTangent)| < cos(5°) → FAIL (not parallel)

Explanation: Sheet normal = −T means sheet plane is perpendicular to branch.
For validation, we check that sheet normal is parallel (or anti-parallel) to branch tangent (angle ~0° or ~180°).
```

---

## 📐 Math Explanation

### Dot Product & Angles

```
dot(A, B) = |A| · |B| · cos(θ)
```

For unit vectors:
```
dot(A, B) = cos(θ)
```

**If vectors are**:
- **Parallel** (same direction): θ = 0°, cos(0°) = 1, dot = 1
- **Anti-parallel** (opposite): θ = 180°, cos(180°) = -1, dot = -1
- **Perpendicular**: θ = 90°, cos(90°) = 0, dot = 0

**Using abs(dot)**:
- Parallel or anti-parallel: |dot| = 1, angle = arccos(1) = 0°
- Perpendicular: |dot| = 0, angle = arccos(0) = 90°

### For Our Case

- Sheet normal = `-T` (anti-parallel to branch tangent `T`)
- `dot(-T, T) = -1`
- `|dot| = 1`
- `angle = arccos(1) = 0°`

**This is correct!** The sheet plane is perpendicular to the branch.

**Old validation** expected `angle ≈ 90°` which would mean sheet normal is perpendicular to tangent, making the sheet **parallel** to the branch (wrong).

---

## 🎯 Expected Result After Fix

**After hard refresh**, console should show:
```
[FilamentRenderer] ✅ Sheet plane created: sheet.packaging (perpendicular to branch)
[FilamentRenderer] ✅ Sheet plane created: sheet.materials (perpendicular to branch)
[TOPOLOGY] ✅ All canonical invariants satisfied
```

**No more validation errors.**

---

## 📋 Verification Steps

### 1. Hard Refresh
```
Ctrl+Shift+R
```

### 2. Check Console
Should see:
```
✅ Tree rendered:
  Primitives: 83 (trunk=1, branches=2, cell-filaments=78, spines=2)
[TOPOLOGY] ✅ All canonical invariants satisfied
```

Should NOT see:
```
❌ [TOPOLOGY VIOLATION] ...
❌ [TOPOLOGY] ❌ Validation failed: ...
```

### 3. Visual Test (Key `3`)
Press `3` to look down branch tangent. Sheet should appear face-on.

---

## 🔍 Why This Bug Happened

**Root cause**: Terminology confusion between:
- "Sheet perpendicular to branch" (correct - the **plane** is perpendicular)
- "Sheet normal perpendicular to tangent" (wrong - this would make the **plane** parallel)

**The spec correctly said**: "Sheet normal = −T"  
**The validation incorrectly checked**: "Sheet normal ⟂ T"

These are contradictory. The fix aligns validation with spec.

---

## 📝 Files Changed

1. ✅ `app/renderers/filament-renderer.js` - Fixed validation logic (line ~178-196)
2. ✅ `RELAY-RENDER-CONTRACT.md` - Fixed lint check specification (line ~118)

---

**Status**: Fixed and ready for re-test

**Next step**: Hard refresh browser and check for `[TOPOLOGY] ✅ All canonical invariants satisfied`
