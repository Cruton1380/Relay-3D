# 🚀 Relay Quick Start (5 Minutes)

Get Relay running and see your first 3D tree in under 5 minutes.

---

## Prerequisites

- **Node.js 18+** installed
- **npm 8+** installed
- **Web browser** (Chrome, Firefox, Edge recommended)

---

## Step 1: Clone or Download

If you have the repository:
```bash
cd RelayCodeBaseV93
```

If you need to clone:
```bash
git clone <repository-url>
cd RelayCodeBaseV93
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs development dependencies (build tools, test framework).

**Note**: Cesium and XLSX are loaded from CDN, not npm.

---

## Step 3: Start Development Server

```bash
npm run dev:cesium
```

You should see:
```
🌍 Relay Dev Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running at http://localhost:8000
📂 Serving from: <your-path>
🚀 Open: http://localhost:8000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Press Ctrl+C to stop
```

---

## Step 4: Open in Browser

Navigate to:
```
http://localhost:8000
```

You should see:
- 🌍 **Cesium globe** with terrain and satellite imagery
- 🏙️ **3D buildings** (zoom in to see them)
- 📂 **Drop zone** overlay ("Drop Excel File")

---

## Step 5: Drop an Excel File

### Option A: Use Sample File

Create a simple Excel file with one sheet:
- **Sheet1**: Any data (3+ rows, 3+ columns)
- Save as `test.xlsx`

### Option B: Use Your Own

Any `.xlsx` or `.xls` file works.

### Drop It

1. Drag the file from your file explorer
2. Drop it into the browser window
3. Release

---

## Step 6: See Your Tree

After dropping the file:

1. **Drop zone disappears**
2. **Tree appears** on the globe:
   - **Trunk**: Vertical pillar at Tel Aviv
   - **Branches**: Curved arcs spiraling around trunk
   - **Sheets**: Points at branch endpoints
   - **Labels**: Sheet names visible (press `I` to see tree info)

---

## Step 7: Explore

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **H** | Toggle HUD (shows LOD, altitude, FPS) |
| **I** | Show info panel (tree statistics) |
| **L** | Toggle log console |
| **Mouse** | Rotate, pan, zoom |

### Zoom In

- **Scroll wheel**: Zoom in/out
- **Right-click drag**: Pan camera
- **Left-click drag**: Rotate globe

Watch the **LOD level** change in HUD as you zoom.

---

## Step 8: Verify Everything Works

### Check Console (F12)

Look for:
```
[Relay] 🚀 Relay Cesium World starting...
[Relay] ✅ Cesium Viewer initialized successfully
[Relay] 📂 Drag-and-drop initialized
[Relay] ✅ Tree imported: 4 nodes
[Relay] ✅ Tree rendered: 7 entities
```

No red errors = success! ✅

### Check HUD (Press H)

Should show:
```
🔭 LOD: SHEET
📏 Alt: 15.0 km
🌲 Nodes: 4
⚡ FPS: 60
```

---

## Troubleshooting

### "Server won't start"

**Error**: `EADDRINUSE` (port 8000 already in use)

**Fix**:
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
PORT=8001 npm run dev:cesium
```

### "Cesium doesn't load"

**Symptom**: Black screen, "Loading..." forever

**Fix**:
- Check internet connection (Cesium loads from CDN)
- Check console for CORS errors
- Try different browser

### "Excel import doesn't work"

**Symptom**: File drops but nothing happens

**Fix**:
- Check file format (.xlsx or .xls)
- Open console (F12), look for errors
- Try a simpler Excel file (1 sheet, 3x3 cells)

### "Tree doesn't render"

**Symptom**: Import succeeds but no tree visible

**Fix**:
- Press `I` to check node count
- Zoom out (scroll wheel)
- Check console for "Tree rendered" message
- Try reloading page

---

## What Just Happened?

1. **Cesium viewer** initialized with real Earth terrain/imagery
2. **Excel file** parsed by XLSX.js
3. **RelayState** populated with tree structure:
   - 1 trunk node
   - N branch nodes (one per sheet)
   - N sheet nodes
   - Edges connecting them
4. **CesiumFilamentRenderer** rendered:
   - Trunk as vertical polyline
   - Branches as curved arcs
   - Sheets as points/labels
5. **LOD Governor** monitored camera height and adjusted detail

---

## Next Steps

### Learn the Architecture

Read: [Architecture Overview](../architecture/RELAY-CESIUM-ARCHITECTURE.md)

### Set Up Development Environment

Read: [Dev Setup Guide](./DEV-SETUP.md)

### Run Tests

```bash
npm run boot-gate
npm test
```

### Explore the Code

- **Entry point**: `relay-cesium-world.html`
- **Core logic**: `core/` (renderer-agnostic)
- **Rendering**: `app/` (Cesium-specific)
- **State**: `core/models/relay-state.js`

---

## Common Questions

### Q: Can I use Three.js prototype?

**A**: No. The Three.js prototype (`archive/prototypes/filament-spreadsheet-prototype.html`) is deprecated. Use `relay-cesium-world.html`.

### Q: Can I use my own data?

**A**: Yes! Any Excel file works. Future phases will support:
- Real company locations (geocoding)
- Formula dependencies (filament connections)
- Commit history (timebox segmentation)

### Q: Can I deploy this?

**A**: Not yet. v1.0 is local development only. Deployment guide coming in Phase 8.

### Q: Where's the documentation?

**A**: `docs/` folder. Start with [00-START-HERE.md](../00-START-HERE.md).

---

## Summary

**In 5 minutes you**:
1. ✅ Installed dependencies
2. ✅ Started dev server
3. ✅ Opened Relay in browser
4. ✅ Imported Excel file
5. ✅ Saw 3D tree on globe
6. ✅ Verified everything works

**You now have**: A working Cesium-based Relay instance with Excel import.

---

*Next: [Dev Setup Guide](./DEV-SETUP.md) for deeper development*
