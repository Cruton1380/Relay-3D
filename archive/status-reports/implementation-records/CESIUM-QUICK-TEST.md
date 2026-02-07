# Cesium World - Quick Test Guide

**File**: `relay-cesium-world.html`  
**Test Duration**: 2 minutes  
**Goal**: Verify Phase 0 + Phase 1 + Phase 2 working

---

## Step 1: Open Application (5 seconds)

```
Open relay-cesium-world.html in Chrome or Edge
```

**Expected**:
- Loading indicator appears
- After 3-5 seconds: Earth appears with terrain
- Camera positioned over Tel Aviv at 15km altitude
- Drop zone overlay visible

**✅ Pass if**: You see Earth with terrain + satellite imagery

---

## Step 2: Test Zoom (Space → Street) (30 seconds)

### A) Zoom Out to Space
- Scroll wheel: Zoom out until you're at ~400km altitude
- **Check HUD**: LOD Level should show "LANIAKEA"

### B) Zoom In to City
- Scroll wheel: Zoom in to ~5km altitude
- **Check**: 3D buildings should appear in cities
- **Check HUD**: LOD Level should show "SHEET"

### C) Zoom to Street Level
- Continue zooming to ~100m altitude
- **Check**: Buildings clearly visible with detail
- **Check HUD**: LOD Level should show "CELL"

**✅ Pass if**:
- Terrain visible at all zoom levels
- 3D buildings appear at close zoom
- LOD levels transition smoothly (no flickering)

---

## Step 3: Test LOD Hysteresis (20 seconds)

### Hover at Threshold
- Zoom to exactly ~5.5km altitude
- Slowly zoom in/out around 5km-6km range
- **Watch HUD**: LOD Level should be "SHEET" or "COMPANY"
- **Check**: Should NOT rapidly flicker between levels

**✅ Pass if**: LOD changes smoothly, no thrashing

---

## Step 4: Import Excel File (30 seconds)

### A) Prepare Test File
- Use any `.xlsx` file (the one from the Three.js prototype works: "CPE Tracker.xlsb (5).xlsx")

### B) Drag & Drop
- Drag file onto Cesium view
- Drop zone should highlight green
- Loading indicator appears
- Processing message: "Processing file..."

### C) Verify Rendering
After ~2-5 seconds:
- Loading disappears
- Camera flies to Tel Aviv
- **Check for tree structure**:
  - Green point (trunk)
  - Cyan glowing polyline (branch)
  - Blue translucent plane (sheet)
  - Labels visible

**✅ Pass if**:
- Tree appears at Tel Aviv (32.08°N, 34.78°E)
- All 3 components visible (trunk, branch, sheet)
- Camera automatically flies to tree
- HUD shows: "Filaments: 3", "Sheets: 1"

---

## Step 5: Test Keyboard Shortcuts (10 seconds)

### A) Toggle Log Console
- Press `L` key
- **Check**: Log console appears at bottom-left
- **Check**: Contains initialization logs
- Press `L` again to hide

### B) Toggle HUD
- Press `H` key
- **Check**: HUD disappears
- Press `H` again to show

### C) Inspector
- Press `I` key
- **Check**: Console (F12 DevTools) shows:
  - `[Relay] State: { tree: {...}, boundaries: [...], ... }`
  - `[Relay] Viewer: Viewer {...}`
  - `[Relay] LOD Level: COMPANY` (or current level)

**✅ Pass if**: All shortcuts work correctly

---

## Step 6: Test Camera Controls (15 seconds)

### Pan
- Click + drag: Camera pans horizontally
- **Check**: Smooth movement

### Tilt
- Right-click + drag: Camera tilts (pitch)
- **Check**: Can look straight down or at angle

### Rotate
- Middle-click + drag (or Ctrl + Left-drag): Camera rotates around point
- **Check**: Smooth rotation

**✅ Pass if**: All camera controls responsive and smooth

---

## Step 7: Verify Architecture (Console Check) (10 seconds)

### Open DevTools (F12)
- Go to Console tab
- Look for initialization logs:

```
[Relay] 🚀 Cesium World initializing...
[Relay] 🌍 Initializing Cesium Viewer...
[Relay] 🏢 Adding 3D Buildings...
[Relay] ✅ Cesium Viewer initialized successfully
[Relay] 📊 LOD Governor initialized
[Relay] ✅ LOD Governor monitoring started
[Relay] ✅ Relay Cesium World initialized successfully
```

**✅ Pass if**:
- No red error messages
- All initialization steps succeeded
- LOD logs appear when zooming

---

## Quick Pass/Fail Checklist

| Test | Expected Result | Pass? |
|------|----------------|-------|
| **Globe loads** | Earth with terrain + imagery visible | ☐ |
| **3D buildings** | Appear when zooming to cities | ☐ |
| **Zoom space→street** | Smooth transition, no crashes | ☐ |
| **LOD changes** | HUD shows level transitions | ☐ |
| **No LOD thrashing** | Level stable near thresholds | ☐ |
| **Excel import** | File processes successfully | ☐ |
| **Tree renders** | Trunk + branch + sheet visible | ☐ |
| **GPS anchoring** | Tree at Tel Aviv (32.08°N, 34.78°E) | ☐ |
| **Camera controls** | Pan, tilt, rotate all work | ☐ |
| **Keyboard shortcuts** | L, H, I all work | ☐ |

---

## Common Issues & Fixes

### Issue: Globe is black/empty
**Cause**: Cesium Ion token invalid  
**Fix**: Check browser console for errors. Application uses default token, should work for testing.

### Issue: 3D buildings don't appear
**Cause**: Not zoomed in enough  
**Fix**: Zoom to <5km altitude over a major city (Tel Aviv, New York, London)

### Issue: Excel import fails
**Cause**: File format not supported  
**Fix**: Use `.xlsx` format only (not `.xls` or `.csv`)

### Issue: Tree doesn't appear after import
**Cause**: Camera didn't fly to location  
**Fix**: Check console for errors. Tree should be at Tel Aviv (34.78°E, 32.08°N)

### Issue: LOD flickers rapidly
**Cause**: Hysteresis bug (should NOT happen)  
**Fix**: Report this - hysteresis should prevent flicker

---

## Advanced Tests (Optional)

### Test Multiple Imports
1. Import file A
2. Import file B
3. **Check**: Old tree replaced by new tree (only one tree visible)

### Test LOD Transitions
1. Start at 400km altitude (LANIAKEA)
2. Zoom in slowly
3. **Check**: Transitions happen at:
   - 100km: PLANETARY
   - 50km: REGION
   - 15km: COMPANY
   - 5km: SHEET
   - <500m: CELL

### Test Performance
1. Zoom quickly from space to street
2. Pan rapidly
3. **Check**: Frame rate stays smooth (no lag)

---

## Expected Console Output (Full)

```
[Relay] 🚀 Cesium World initializing...
[Relay] 🌍 Initializing Cesium Viewer...
[Relay] 🏢 Adding 3D Buildings...
[Relay] ✅ Cesium Viewer initialized successfully
[Relay] 📊 LOD Governor initialized
[Relay] ✅ LOD Governor monitoring started
[Relay] ✅ Relay Cesium World initialized successfully
[Relay] 💡 Shortcuts: L=Logs, H=HUD, I=Inspector
[Relay] 📂 Drag & drop an Excel file to import

[After import:]
[Relay] 📂 Processing file: data.xlsx
[Relay] 📊 Workbook loaded: 1 sheets
[Relay] 📄 Sheet "Sales": 237 rows
[Relay] 🌳 Tree structure created: 3 nodes
[Relay] 🧬 Filament Renderer initialized
[Relay] ✅ Rendered 3 primitives
[Relay] ✅ File imported: data.xlsx
```

---

## What Success Looks Like

### Visual
- Earth with photorealistic terrain
- Satellite imagery (Bing Maps)
- 3D buildings in cities
- Tree structure (green trunk, cyan branch, blue sheet) at Tel Aviv
- Smooth camera movement
- No lag or jitter

### Technical
- All console logs show success (green checkmarks)
- No errors in DevTools
- LOD transitions logged correctly
- HUD updates in real-time
- Architecture verified (renderer-agnostic state)

---

## Next Test: After Completing Phase 1 Primitives

Once primitives are implemented (next iteration), test:
- Branches as tubes (PolylineVolumeGeometry)
- Sheets as rectangles in local ENU frame
- Cells as instanced boxes (only visible at CELL LOD)
- Timebox segmentation (colored segments)

---

**Quick Test Complete: 2 minutes. All systems operational. Ready for Phase 1 completion.**
