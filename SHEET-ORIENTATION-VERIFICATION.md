# Sheet Orientation Fix - Verification Guide

**Date**: 2026-02-06  
**Status**: Ready for testing

---

## 🔧 Bugs Fixed

1. ✅ **Topology validation crash**: Fixed `ReferenceError: tree is not defined`
2. ✅ **Sheet orientation**: Changed from horizontal (East×North) to vertical (N×B, perpendicular to branch)
3. ✅ **Cell positioning**: Changed from ENU grid to sheet frame positioning
4. ✅ **Camera preset**: Added "LookDownBranch" view (key `3`) for face-on sheet verification

---

## 🎯 How to Verify (Step by Step)

### 1. Hard Refresh Browser
- Press **Ctrl+Shift+R** to clear cache
- Verify URL is `http://localhost:8000/relay-cesium-world.html`

### 2. Check Console Log

**Must see**:
```
[FilamentRenderer] ✅ Sheet plane created: sheet.packaging (perpendicular to branch)
[FilamentRenderer] ✅ Sheet plane created: sheet.materials (perpendicular to branch)
[TOPOLOGY] ✅ All canonical invariants satisfied
📷 Camera presets: Press 1=TopDown, 2=SideProfile, 3=LookDownBranch
```

**Must NOT see**:
```
[TOPOLOGY] ❌ Validation failed: ReferenceError: tree is not defined
```

---

### 3. Test Camera Presets

**Press `1`** (TopDown):
- Looking straight down from above
- Should see branches extending horizontally
- Sheets should appear as vertical "pages" (edge-on from this view)

**Press `2`** (SideProfile):
- Looking from the side
- Should see trunk vertical, branches horizontal
- Sheets should be visible perpendicular to branches

**Press `3`** (LookDownBranch) ⭐ **CRITICAL TEST**:
- Camera positioned behind trunk, looking along branch tangent
- **Sheet should appear FACE-ON** (like reading a page)
- Should see cell grid clearly
- Filaments should drop from cells

---

### 4. Zoom to SHEET LOD

**Scroll in** until HUD shows:
```
🔭 LOD: SHEET
```

At SHEET LOD, cells and filaments become visible.

**Visual check**:
- ✅ Sheet appears as vertical rectangle (not horizontal slab)
- ✅ Cells arranged in clear grid
- ✅ Filaments drop from cells (not from sheet center)
- ✅ Sheet does NOT rotate to face camera when you orbit

---

## ✅ PASS Criteria

**Console**:
- [x] No topology validation errors
- [x] Sheet created "perpendicular to branch"
- [x] Topology validation passes

**Visual (at SHEET LOD, key `3`)**:
- [x] Sheet appears face-on when looking down branch
- [x] Cell grid clearly visible
- [x] Sheet does NOT rotate with camera
- [x] Filaments drop from cells in orderly fashion

---

## ❌ FAIL Criteria

**If you see**:
- Sheet appears as horizontal slab → Orientation still wrong
- Sheet rotates to face camera → Billboarding detected
- Sheet only visible edge-on → Might be correct but camera angle wrong
- Console shows topology violations → Invariants not satisfied

---

## 🔍 Troubleshooting

### "I don't see any sheets"
- Check LOD (must be SHEET or CELL)
- Press `3` key to trigger face-on view
- Zoom in closer

### "Sheets look like horizontal slabs"
- Check console for "(perpendicular to branch)"
- If missing, sheet orientation fix didn't apply
- Hard refresh (Ctrl+Shift+R)

### "Console shows topology violations"
- Read violation message (angle from tangent, clustering, etc.)
- Report exact violation text

### "Nothing renders at all"
- Check for JavaScript errors in console
- Verify dev server is running on http://localhost:8000
- Check for import errors

---

## 📷 Expected Visuals

### Key `3` (LookDownBranch) - The Money Shot

**What you SHOULD see**:
```
     [Trunk]
        |
        +------ [Branch] -------→ [Sheet face-on]
                                    ╔══════════╗
                                    ║ A1  B1  ║
                                    ║ A2  B2  ║
                                    ║ ...  .. ║
                                    ╚══════════╝
                                    ↓ ↓ ↓ ↓ (filaments)
```

**What you should NOT see**:
- Horizontal slab (looking at sheet edge)
- Sheet rotating as you move camera
- Single thick hose instead of many filaments

---

## 🚀 Next After Verification

**If PASS**: Mark Phase 2.4 complete, proceed to Phase 3 (Material Timeboxes)

**If FAIL**: Report specific failures:
- Console errors (exact text)
- Visual description (what does sheet look like?)
- LOD level when checking
- Which camera preset used

---

**Status**: Ready for user verification  
**Dev Server**: Running on http://localhost:8000  
**Expected Result**: Sheet appears face-on when pressing key `3`
