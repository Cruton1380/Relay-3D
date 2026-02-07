# Sheet Plane Debug - Quick Test Guide

## 🚀 How to Test (30 seconds)

### 1. Hard Refresh Browser
```
1. Close ALL tabs with the prototype
2. Open DevTools (F12)
3. Right-click refresh → "Empty Cache and Hard Reload"
```

### 2. Import Excel File
```
1. Drag any .xlsx file onto the drop zone
2. Should auto-switch to Tree Scaffold view
```

### 3. Look for Bright Glowing Rectangles
```
The sheets are now BRIGHT CYAN-GREEN GLOWING RECTANGLES
If you see filaments but no bright rectangles, something is wrong
```

### 4. Test Debug Keys

| Key | Action | Expected Result |
|-----|--------|-----------------|
| `F` | Focus on first sheet | Camera moves to face sheet |
| `I` | Scene info summary | Console shows all objects |
| `G` | Toggle formula lens | Shows formula edges (if file has formulas) |
| `H` | Hold mode | Toggle FREE-FLY / HOLD |

---

## 📊 Console Checklist

After import, console MUST show:

```
✅ [Relay] 📄 Sheet build START Northwind at position: [...]
✅ [Relay] 📄 Sheet box created: 3.0 x 3.75 x 0.15
✅ [Relay] 📄 Sheet created: Northwind ... cell anchors: 48
✅ [Relay] 📄 Sheets in scene: 3 / 3
✅ [Relay] 🧬 Using 48 REAL cell anchors for sheet: Northwind
```

❌ If you see warnings:
```
⚠️ No cell anchors found for sheet: [id]
⚠️ No cell anchor for: A1
```
Something went wrong - press `I` to debug

---

## 🎯 Visual Validation

You should see:
- ✅ Bright cyan-green glowing rectangles (sheets)
- ✅ Golden/cyan frame edges around sheets
- ✅ Small colored cubes on sheet surface (cells)
- ✅ Glowing tubes connecting cells to branches (filaments)
- ✅ Filaments terminate ON cells (not floating)
- ✅ **Filaments emerge from FACE of sheet (not edge)** ← NEW FIX
- ✅ **Magenta arrow pointing out from each sheet** ← DEBUG VISUAL

You should NOT see:
- ❌ Filaments floating in empty space
- ❌ No sheets visible (just tree branches and filaments)
- ❌ Sheets completely hidden behind globe
- ❌ **Filaments exiting from sheet EDGE (sideways)** ← FIXED

---

## 🔧 If Sheet Still Not Visible

Press `I` key and check:
```
Sheets: 3  ← Should be > 0
  - Northwind | pos: [...] | visible: true | children: 147
                                    ↑ MUST be true
                                                ↑ MUST be > 100
```

If `visible: false` → bug in stage gating
If `children: 0` → sheet didn't build
If `Sheets: 0` → renderTreeScaffold() didn't run

---

## 🐛 Common Issues

### Issue: "No sheets visible"
**Fix:** Press `F` - if camera moves but you still see nothing, press `I` and check visible flag

### Issue: "Filaments but no sheet"
**Fix:** This is fixed now - sheets are bright glowing rectangles. Hard refresh.

### Issue: "Cell anchors: 0"
**Fix:** Sheet cells didn't build - check console for errors during renderTreeScaffold()

---

## ✅ Success Criteria

1. Bright glowing rectangles visible ✅
2. Press `F` → camera focuses on sheet ✅
3. Press `I` → shows sheets with visible: true ✅
4. Filaments connect to cell cubes (not floating) ✅
5. **Filaments emerge from sheet FACE (not edge)** ✅ ← NEW
6. **Magenta arrow points straight out from sheet** ✅ ← NEW

**If all 6 pass → Implementation is WORKING! 🎉**

---

## 📝 Next Step (After Validation)

Once validated, revert sheet material to subtle (production mode):
- See SHEET-PLANE-DEBUG-COMPLETE.md section "Reverting Debug Mode"

**Keep these features:**
- Cell anchors system ✅
- F key focus ✅
- I key scene info ✅
- Sheet presence logs ✅
