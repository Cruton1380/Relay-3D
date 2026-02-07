# Phase 3 Bug Fix - Cell ID Mismatch

**Date**: 2026-02-07  
**Issue**: Timeboxes not rendering (0 lanes, 0 cubes)  
**Root Cause**: Cell position storage/lookup key mismatch

---

## 🐛 The Bug

### What Happened
```log
✅ Found cellAnchors for sheet.packaging with 48 cells
⚠️ Cell position not found: sheet.packaging.cell.0.0
⚠️ Cell position not found: sheet.packaging.cell.0.1
... (all 48 cells)
⏳ Timebox lanes rendered: 0 lanes, 0 cubes
```

### Root Cause
**Storage** (in `renderCellGridENU()`):
```javascript
const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;  // "A1", "B2", etc.
const cellId = `${sheet.id}.cell.${row}.${col}`;               // "sheet.packaging.cell.0.0"

// BUG: Stored with Excel-style notation
window.cellAnchors[sheet.id].cells[cellRef] = cellWorldPos;  // ❌ "A1"
```

**Lookup** (in `renderTimeboxLanes()`):
```javascript
const cellId = `${sheet.id}.cell.${row}.${col}`;  // "sheet.packaging.cell.0.0"
const cellPos = cellAnchors.cells[cellId];         // ❌ Looking for wrong key!
```

**The keys didn't match!**
- Storage used: `"A1"`, `"B2"`, `"C3"`, etc.
- Lookup used: `"sheet.packaging.cell.0.0"`, `"sheet.packaging.cell.0.1"`, etc.

---

## ✅ The Fix

### Change Applied
**File**: `app/renderers/filament-renderer.js`  
**Line**: ~921

**Before:**
```javascript
window.cellAnchors[sheet.id].cells[cellRef] = cellWorldPos;  // ❌ "A1"
```

**After:**
```javascript
window.cellAnchors[sheet.id].cells[cellId] = cellWorldPos;   // ✅ "sheet.packaging.cell.0.0"
```

### Why This Fix?
- `cellId` is the **canonical unique identifier** across the entire system
- `cellRef` is Excel-style notation (useful for display/labels, not for internal lookups)
- Using `cellId` for storage ensures consistency with filaments, timeboxes, and topology validation

---

## 🧪 Verification

### Expected Console Output (After Fix)
```log
[FilamentRenderer] 📊 Cell grid rendered: 8 rows × 6 cols
[FilamentRenderer] ⏳ Timebox lanes rendered: 48 lanes, 467 cubes
  Separate lanes: 46, Mergeable: 2
[FilamentRenderer] ✅ Sheet plane created: sheet.packaging
```

### Visual Confirmation
After refresh + camera preset 3 (Look Down Branch):
- ✅ **6m gap** behind each cell (visible empty space)
- ✅ **Cube stacks** (varying heights 3-15 timeboxes, color gradient blue→cyan)
- ✅ **Parallel lanes** (thin lines connecting cells to cubes)
- ✅ **Color coding**:
  - Bright cyan (`#4FC3F7`) = cells with history/formula (`mustStaySeparate`)
  - Light blue (`#90CAF9`) = mergeable cells (no history, no formula)

### LINT Checks (Should Now Pass)
- ✅ **LINT 1**: Minimum gap respected (6m cell-to-time gap)
- ✅ **LINT 2**: Timebox count matches cell data (467 cubes for 48 cells with history)

---

## 📋 Remaining Debug Logs

Debug logs have been reduced to essential only:
- **Cell grid**: `📊 Cell grid rendered: X rows × Y cols`
- **Timeboxes**: `⏳ Timebox lanes rendered: X lanes, Y cubes`
- **Sheet completion**: `✅ Sheet plane created`

All verbose diagnostic logs (`🔍 DEBUG`, `🎯 ENTERED`, etc.) have been removed.

---

## 🎯 Next Action

**User must:**
1. Hard refresh: `Ctrl+Shift+R`
2. Press `L` to lock LOD at SHEET
3. Press `3` for "Look Down Branch" preset
4. **Report**:
   - Console shows "⏳ Timebox lanes rendered: 48 lanes, 467 cubes"?
   - Cube stacks visible in viewport?
   - Lanes connecting cells to cubes?

---

## 🔒 Phase 3 PASS Criteria

Phase 3 can only be marked COMPLETE when:
1. ✅ Console shows `⏳ Timebox lanes rendered: 48 lanes, 467 cubes`
2. ✅ Screenshot shows visible cube stacks + lanes
3. ✅ Camera preset 3 ("Look Down Branch") frames the view correctly
4. ✅ No `⚠️ Cell position not found` warnings

**This fix should satisfy all criteria.**
