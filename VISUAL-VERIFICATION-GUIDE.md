# Visual Verification Guide

**Date**: 2026-02-06  
**Purpose**: Verify sheet planes and timeboxes are rendering correctly

---

## 🚀 Quick Start

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Wait for load**: System should initialize in ~2-3 seconds
3. **Look for visual changes**: See checklist below

---

## ✅ Visual Checklist

### 1. Trunk with Timebox Rings 🎯 CRITICAL

**What to look for**:
- Trunk is a vertical line at Tel Aviv (lat: 32.0853, lon: 34.7818)
- **4 horizontal discs** (ellipses) along the trunk at different heights
- Discs should be **cyan or blue** colored
- Some discs may have **red tint** (scars) or **orange tint** (drifts)

**If you zoom close**:
- Labels should appear on each disc
- Labels show: "2026-02-W1", "45 commits" (or similar)

**Console should show**:
```
⏰ Rendering 4 timeboxes on trunk: trunk.avgol
✅ Timeboxes rendered: 4
```

**If not visible**:
- Check console for errors
- Try zooming out to see full trunk
- Look for blue/cyan discs at ~500m, 1000m, 1500m, 2000m altitude

---

### 2. Sheet Planes 🎯 CRITICAL

**What to look for**:
- **Two rectangular planes** at branch endpoints
- One at Operations branch (lat: 32.0900, lon: 34.7900, alt: 1000m)
- One at Sales branch (lat: 32.0800, lon: 34.7750, alt: 1000m)
- Planes should be **translucent green** (high ERI = 85, 78)
- Planes should have **visible outlines**

**Console should show**:
```
📄 Rendering sheet plane: sheet.packaging at [34.7900, 32.0900, 1000]
📊 Rendering cell grid: 8 rows × 6 cols
✅ Cell grid complete: 48 cells
✅ Sheet plane created: sheet.packaging

📄 Rendering sheet plane: sheet.materials at [34.7750, 32.0800, 1000]
📊 Rendering cell grid: 6 rows × 5 cols
✅ Cell grid complete: 30 cells
✅ Sheet plane created: sheet.materials
```

**If not visible**:
- Planes are at 1000m altitude - make sure you're looking at the right height
- Try rotating camera to see planes edge-on
- Check opacity (0.2) - they're translucent, not opaque

---

### 3. Cell Grids 🔍 (Zoom In Required)

**What to look for**:
- **White dots** (points) within each sheet plane
- Packaging sheet: **8 rows × 6 columns = 48 cells**
- Materials sheet: **6 rows × 5 columns = 30 cells**

**If you zoom very close** (< 50km):
- **Cell labels** should appear: "A1", "B2", "C3", etc.
- Labels are white text with black outline
- Labels appear above each cell point

**Console should show**:
```
✅ Cell grid complete: 48 cells
✅ Cell grid complete: 30 cells
```

**If not visible**:
- Cells are small (4px) - zoom in closer
- Labels only appear when distance < 50km
- Try looking directly at sheet plane (face-on, not edge-on)

---

## 🎯 Camera Positions to Try

### View 1: Full Tree (Far View)
```
Camera: ~15km altitude
Should see:
- Trunk (vertical line)
- 4 timebox discs (cyan/blue)
- 2 branches (arcs)
- 2 sheet planes (green rectangles)
```

**How to get there**: Default starting position

### View 2: Timebox Detail (Medium View)
```
Camera: ~5km altitude, centered on trunk
Should see:
- Timebox discs clearly visible
- Timebox labels: "2026-02-W1", "45 commits"
- Disc colors show state (cyan = good, red tint = scars)
```

**How to get there**: Zoom in on trunk, rotate to see discs edge-on

### View 3: Sheet and Cell Detail (Close View)
```
Camera: ~1-2km altitude, centered on sheet
Should see:
- Sheet plane (green rectangle)
- Cell grid (48 or 30 white dots)
- Cell labels: "A1", "B2", "C3"...
```

**How to get there**: Zoom in on sheet plane, look directly at it (face-on)

---

## 📊 Expected Console Output (Full)

```
🚀 Relay Cesium World starting...
🌍 Initializing Cesium Viewer...
✅ Terrain provider created (Ellipsoid)
✅ Imagery provider created (OpenStreetMap tiles loading...)
✅ Viewer created
⚠️ 3D Buildings unavailable (Ion 401 or network issue)
⚠️ Buildings marked as DEGRADED
🌍 Cesium Viewer initialized successfully

🧹 Filament renderer cleared
⚠️ Boundaries DISABLED (ENABLE_BOUNDARIES = false)
🌲 Loading demo tree...

🧹 Filament renderer cleared
🌲 Rendering tree: 5 nodes, 4 edges

[Trunk rendering...]
⏰ Rendering 4 timeboxes on trunk: trunk.avgol
✅ Timeboxes rendered: 4

[Branch rendering...]

📄 Rendering sheet plane: sheet.packaging at [34.7900, 32.0900, 1000]
📊 Rendering cell grid: 8 rows × 6 cols
✅ Cell grid complete: 48 cells
✅ Sheet plane created: sheet.packaging

📄 Rendering sheet plane: sheet.materials at [34.7750, 32.0800, 1000]
📊 Rendering cell grid: 6 rows × 5 cols
✅ Cell grid complete: 30 cells
✅ Sheet plane created: sheet.materials

[Filament rendering...]

✅ Tree rendered: [N] entities
✅ Demo tree rendered: Avgol @ Tel Aviv
📂 Drag-and-drop initialized
🔄 LOD: NONE → LANIAKEA
✅ Relay Cesium World initialized
```

---

## 🐛 Troubleshooting

### Issue: "I don't see any timeboxes"

**Possible causes**:
1. Timeboxes are same color as trunk (unlikely - they're cyan/blue)
2. Camera too far away (try zooming to ~5km altitude)
3. Timeboxes not rendering (check console for "⏰ Rendering 4 timeboxes")

**Debug steps**:
```javascript
// In browser console:
viewer.entities.getById('trunk.avgol') // Should exist
viewer.entities.values.filter(e => e.properties?.type?.getValue() === 'timebox') // Should return 4
```

### Issue: "I don't see sheet planes"

**Possible causes**:
1. Sheets are very translucent (opacity 0.2)
2. Camera looking at edge of plane (rotate to see face-on)
3. Sheets not rendering (check console for "📄 Rendering sheet plane")

**Debug steps**:
```javascript
// In browser console:
viewer.entities.values.filter(e => e.properties?.type?.getValue() === 'sheet-plane') // Should return 2
viewer.entities.values.filter(e => e.rectangle) // Should show sheet rectangles
```

### Issue: "I don't see cell labels"

**Possible causes**:
1. Camera too far away (labels only appear < 50km)
2. Labels exist but hidden by distance display condition

**Debug steps**:
```javascript
// In browser console:
viewer.entities.values.filter(e => e.properties?.type?.getValue() === 'cell') // Should return 78 (48+30)
window.cellAnchors // Should have 2 sheets with cell anchors
window.cellAnchors['sheet.packaging'] // Should have 48 cells (A1-F8)
```

### Issue: "Console shows errors"

**Common errors**:
- "Invalid coordinates" - Should not happen with demo tree
- "Failed to render" - Check full error message, may indicate Cesium API issue

**Recovery**:
1. Hard refresh
2. Check browser console for full stack trace
3. If errors persist, check that Cesium loaded correctly

---

## 🎯 Success Criteria

Visual model = ✅ SUCCESS if you can see:

1. **Trunk**: Vertical line from ground to 2000m ✅
2. **Timeboxes**: 4 horizontal discs along trunk ✅
3. **Timebox colors**: Cyan/blue, some with red/orange tints ✅
4. **Branches**: 2 arcs from trunk to sheet positions ✅
5. **Sheet planes**: 2 translucent green rectangles ✅
6. **Cell grids** (zoom in): White dots in grid pattern ✅
7. **Cell labels** (zoom close): "A1", "B2", "C3"... ✅

If all 7 visible → Visual model restored successfully!

---

## 📸 Screenshot Checklist

If everything looks good, capture screenshots for proof:

1. **Far view**: Full tree with timeboxes visible
2. **Medium view**: Timebox detail with labels
3. **Close view**: Sheet plane with cell grid
4. **Very close view**: Cell labels visible

Save as:
- `archive/proofs/visual-model-far.png`
- `archive/proofs/visual-model-timeboxes.png`
- `archive/proofs/visual-model-sheet.png`
- `archive/proofs/visual-model-cells.png`

---

## 🚀 Next Steps After Verification

Once visual model confirmed working:

1. Test Excel import → verify imported data shows on sheets
2. Test LOD transitions → verify detail changes with zoom
3. Capture proof screenshots
4. Proceed to Phase 3: Timebox Segmentation

---

**Status**: Verification guide complete. Ready for user to test and confirm visual model.
