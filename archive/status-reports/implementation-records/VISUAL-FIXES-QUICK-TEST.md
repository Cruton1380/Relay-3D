# Visual Fixes - Quick Test Guide

## What Was Fixed

1. **Scope error**: `spineData is not defined` → Fixed (conduit now re-fetches from state map)
2. **Sheet size**: 3.0 × 3.75 (fixed) → **~2.0 × 2.5** (scales with branch)
3. **Cell geometry**: Bulky cubes → **Thin tiles** (0.088 × 0.088 × 0.026)
4. **Filament thickness**: 0.006 fixed → **~0.0088** (47% thicker, scaled)
5. **Conduit thickness**: 0.025 fixed → **~0.0385** (54% thicker, scaled)
6. **Tree smoothness**: Low segments → **2× smoother** (32-48 segments)
7. **Globe**: Flat blue sphere → **Earth-like** (texture support + better colors)

---

## Quick Test (1 minute)

### Step 1: Hard Reload
```
Ctrl + Shift + R
```
Clear browser cache to get latest code.

### Step 2: Import File
Drag and drop your `.xlsx` file (e.g., "CPE Tracker.xlsb (5).xlsx")

### Step 3: Expected Console Logs (No Crashes)
```
✅ Sheet build START
✅ SheetBundleSpine created for: [sheet.id]
✅ Sheet box created: 1.98 x 2.53 x 0.132  ← Smaller!
✅ Cell grid: 20 rows × 12 cols
✅ Conduit filament: SheetSpine → Branch
```

**No more**:
```
❌ spineData is not defined
```

### Step 4: Visual Checks

| What to Look For | Expected Result |
|------------------|-----------------|
| **Sheets** | ~2× branch size (not 3× dominating) |
| **Cells** | Thin glowing tiles (not bulky cubes) |
| **Filaments** | Visible strands (not hairline threads) |
| **Conduits** | Smooth thick tubes (not faceted) |
| **Globe** | Ocean blue-green (not flat blue) |
| **Branch junctions** | Luminescent spheres (~1.1 size) |

### Step 5: Fly Around (WASD)
- Click canvas → Pointer lock
- `WASD` to fly
- `Q/E` for up/down
- `Shift` for fast

**Check**:
- Sheets feel proportionate to branches
- Cells are visible but not dominating
- Filaments connect cells → spine → branch
- Smooth organic curves (no polygon edges)

---

## For Full Earth Texture (Optional)

### Run Local Server
```bash
# In the project folder:
python -m http.server 8000
```

### Open in Browser
```
http://localhost:8000/filament-spreadsheet-prototype.html
```

### Add Earth Texture (Optional)
Download 8K Earth daymap:
- Place in: `textures/8k_earth_daymap.jpg`
- Globe will auto-load it
- Fallback: procedural ocean blue-green

---

## Pass/Fail

### ✅ PASS if you see:
1. Sheets ~2× branch size (not 3×)
2. Cells as thin tiles (not cubes)
3. Filaments visible as strands
4. Smooth tube curves (spiral-like)
5. Globe ocean blue-green (or textured)
6. No `spineData` crashes

### ❌ FAIL if you see:
1. Sheets still 3× too large
2. Cells still bulky cubes
3. Filaments invisible threads
4. Faceted polygon edges
5. Flat blue globe sphere
6. `ReferenceError: spineData is not defined`

---

## What Changed Under the Hood

All dimensions now **scale from `branchSize`** (not fixed):

```javascript
// OLD (Fixed):
const sheetWidth = 3.0;
const cellSize = 0.12;
const filamentRadius = 0.006;

// NEW (Proportionate):
const branchSize = 1.1;  // Branch junction size
const sheetWidth = branchSize * 1.8;       // ~2.0
const cellSize = branchSize * 0.08;        // ~0.088
const cellThickness = cellSize * 0.3;      // ~0.026 (thin!)
const filamentRadius = branchSize * 0.008; // ~0.0088
```

**Result**: Everything scales together → consistent proportions.

---

## Expected Visual Hierarchy (Diameter)

```
Branch:    ████ (1.1)
Sheet:     ████████ (2.0) ← 1.8× branch
Conduit:   ▌(0.08) ← 7% of branch
Cell:      ▌(0.088) ← 8% of branch
Filament:  ─ (0.018) ← 1.6% of branch
```

Not:
```
Branch:  ████ (1.1)
Sheet:   ████████████ (3.0) ← 2.7× branch (TOO BIG!)
```

---

## If It Still Looks Wrong

1. **Hard reload failed?** → Close browser, reopen, Ctrl+Shift+R
2. **Sheets still huge?** → Check console for "Sheet box created" log (should show ~2.0 not 3.0)
3. **Cells still cubes?** → Check cell geometry (should be 0.088 × 0.088 × 0.026 not 0.12³)
4. **Filaments invisible?** → Zoom in close to sheets, check for thin tubes (not lines)
5. **Crash on load?** → Check console for "spineData" or "timestamp_ms" errors

---

**Quick Pass**: Sheets feel proportionate, cells are elegant tiles, filaments are visible strands, tree is smooth.
