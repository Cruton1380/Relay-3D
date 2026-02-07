# **RELAY PROTOTYPE - QUICK START GUIDE**

**File:** `filament-spreadsheet-prototype.html`  
**Status:** ✅ CANONICAL v1 (all flight controls patched)  
**Date:** February 2, 2026

---

## **🚀 HOW TO LAUNCH:**

### **Method 1: Direct Browser Open (Easiest)**
1. **Locate file:** `filament-spreadsheet-prototype.html`
2. **Right-click** → **"Open with"** → **Chrome/Firefox/Edge**
3. System will launch immediately

### **Method 2: Drag to Browser**
1. Open Chrome/Firefox/Edge
2. Drag `filament-spreadsheet-prototype.html` into browser window
3. Drop to open

### **Method 3: File URL**
1. Copy path: `c:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93\filament-spreadsheet-prototype.html`
2. In browser address bar, type: `file:///` + path
3. Press Enter

### **Method 4: Live Server (if using VS Code/Cursor)**
1. Right-click `filament-spreadsheet-prototype.html`
2. Select "Open with Live Server"
3. Opens in browser with auto-reload

---

## **✅ VERIFY SYSTEM LAUNCHED:**

When the file opens, you should see:

### **1. Visual Confirmation:**
- Green header: "🔒 Relay Filament Spreadsheet"
- Status bar: "CANONICAL MODEL | Commit: ee5146f | Enforcement: ACTIVE"
- Left sidebar: Enforcement Status panel
- Main area: Spreadsheet grid (empty initially)
- View buttons: Grid View, Sheet Volume, Filament View, Tree Scaffold, Graph Lens

### **2. Console Confirmation:**
Press **F12** to open Developer Console, you should see:

```
═══════════════════════════════════════════════════════════
🌳 RELAY FILAMENT SPREADSHEET - CANONICAL v1
═══════════════════════════════════════════════════════════
Status: CANONICAL (cycle-safe, replay-safe, privacy-safe)
Flight Controls: Mode A (world-up, H=HOLD, R=return)
Commit Model: Typed commits + bundle model
Formula Physics: Dependency graph + topological sort
═══════════════════════════════════════════════════════════

📊 READY: Import CSV or switch to 3D views
🎮 3D Controls: Click canvas → WASD/QE | H: HOLD | R: return | Esc: unlock

✅ SYSTEM CHECK:
  ✅ DOM Ready
  ✅ THREE.js Loaded
  ✅ State Initialized
  ✅ Grid Container
  ✅ Flight HUD

🚀 RELAY SYSTEM ONLINE - Ready for use
```

### **3. Flight HUD (Top-Right):**
When you switch to a 3D view, you'll see the Flight HUD:
- Mode indicator (⏸️ HOLD by default)
- Speed display
- Lock status (🔓 unlocked)
- Quick help text

---

## **🧪 TEST THE CANONICAL FLIGHT CONTROLS:**

### **Step 1: Switch to 3D View**
1. Click **"🌳 Tree Scaffold"** button (top of main area)
2. 3D view initializes
3. Flight HUD appears (top-right)
4. Console shows: `✅ 3D View Initialized - RTS-Freeflight controls ready (Mode A: world-up)`

### **Step 2: Enter FREE-FLY Mode**
1. **Click the canvas** (3D view area)
2. Pointer locks
3. HUD changes to **"FREE-FLY ✈️"** with lock icon **🔒**
4. Console shows: `✈️ FREE-FLY - WASD/QE | Shift/Ctrl | Scroll speed | H=HOLD | R=return`

### **Step 3: Test Movement**
- **WASD:** Forward/back + strafe
- **Q / E:** Down / up (world-space vertical)
- **Shift:** Fast (4× speed)
- **Ctrl:** Slow/precision (0.25× speed)
- **Scroll:** Adjust speed (0.5 - 60 units/sec)

### **Step 4: Test HOLD Mode**
- **Press H or Tab:** Enters HOLD mode
- Velocity damps to zero smoothly
- HUD shows **"HOLD ⏸️"**
- Console shows: `⏸️ HOLD (hotkey) - click to FREE-FLY`

### **Step 5: Test Anchor Return**
- **Press R:** Returns to origin (or selected node)
- HUD shows **"INSPECT 🎯"**
- Camera glides smoothly (ease-out)
- Stops short if collision detected
- Console shows: `🎯 Returning to anchor...`

### **Step 6: Test Esc (Unlock)**
- **Press Esc:** Unlocks pointer
- HUD shows **"HOLD ⏸️"** + **🔓**
- Velocity damped to zero
- Console shows: `⏸️ HOLD (pointer_unlock) - click to FREE-FLY`

---

## **📊 TEST DATA IMPORT:**

### **Import Sample CSV:**
1. Click **"📂 Import CSV"** button
2. Select a CSV file (or use browser file picker)
3. Data imports as typed commits
4. Grid populates with cells
5. Console shows: `✅ Imported X rows | Y formula dependencies | Branch metrics initialized`

### **Test Formula Physics:**
1. Click a cell in Grid View
2. Type formula: `=A1+B1`
3. Press Enter
4. System creates `CELL_FORMULA_SET` commit
5. Dependency graph builds automatically
6. Console shows: `✅ Topological order for Sheet1: [...]`

---

## **🎮 CANONICAL CONTROL REFERENCE:**

| Input | Action |
|-------|--------|
| **Click canvas** | Lock pointer, enter FREE-FLY |
| **Mouse** | Look (yaw/pitch, clamped -80° to +80°) |
| **WASD** | Forward/back + strafe |
| **Q / E** | Down / up (world-space vertical) |
| **Shift** | Fast (4×) |
| **Ctrl** | Slow (0.25×) |
| **Space** | Up (alternative to E) |
| **H / Tab** | HOLD mode (freeze + damp) |
| **R** | Return to anchor (collision-aware glide) |
| **Esc** | Unlock pointer (auto-enters HOLD) |
| **Scroll** | Speed scalar (0.5 - 60) |

---

## **🔍 TROUBLESHOOTING:**

### **"Nothing happens when I open the file"**
1. Check browser console (F12) for errors
2. Make sure you're using Chrome/Firefox/Edge (not IE)
3. Check if file path is correct (no spaces/special chars issue)

### **"3D view is black/empty"**
1. Check console for THREE.js errors
2. Try switching between different views (Grid → Tree Scaffold → Filament)
3. Import sample data first (gives something to visualize)

### **"Flight controls don't work"**
1. Make sure you **clicked the canvas** to lock pointer
2. Check HUD (top-right) shows **"FREE-FLY ✈️"** and **🔒**
3. If pointer unlocked, click canvas again
4. Try pressing **H** to enter HOLD, then click canvas to re-enter FREE-FLY

### **"HUD doesn't appear"**
1. Switch to a 3D view (Tree Scaffold, Filament View, or Sheet Volume)
2. HUD only shows in 3D views, not Grid View
3. Check browser console for JavaScript errors

### **"Cannot import CSV"**
1. Make sure CSV has headers in first row
2. Check file encoding (should be UTF-8)
3. Check console for import errors
4. Try a simple CSV first (2-3 columns, 5-10 rows)

---

## **📁 FILE DEPENDENCIES:**

The prototype is **standalone** (everything in one file):
- ✅ THREE.js loaded from CDN (no local install needed)
- ✅ All JavaScript inline (no external .js files)
- ✅ All CSS inline (no external .css files)
- ✅ No build step required (just open in browser)

**CDN Dependencies:**
- THREE.js r152: `https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js`

---

## **🎯 NEXT STEPS AFTER LAUNCH:**

### **For Testing:**
1. Import sample data (CSV with formulas)
2. Test all 5 view modes (Grid, Sheet Volume, Filament, Tree Scaffold, Graph Lens)
3. Test flight controls in each 3D view
4. Verify HUD updates correctly
5. Check console for any errors

### **For Video Production:**
1. Open prototype
2. Switch to Tree Scaffold view
3. Enter FREE-FLY mode (click canvas)
4. Record flight movements (WASD, Q/E, Shift/Ctrl)
5. Demo HOLD mode (press H)
6. Demo anchor return (press R)
7. Show HUD status changes

### **For AI Training:**
1. Import real data
2. Perform edits (cell updates, formula changes)
3. Check console for trace emissions
4. Verify aggregated traces (default, no PII)
5. Enable raw trace opt-in if needed (for detailed training)

---

## **✅ CANONICAL STATUS:**

**Flight Controls:** ✅ v1 CANONICAL (all 5 fixes applied)  
**Cycle Detection:** ✅ PASS (creates REFUSAL commits)  
**Topological Sort:** ✅ PASS (deterministic recomputation)  
**Trace Privacy:** ✅ PASS (aggregated default, raw opt-in)  
**Language:** ✅ CANONICAL (no "inevitable" or "complete root")

**System is ready for:**
- 🎬 Video production
- 🤖 AI training pilot
- 🚀 Real deployment

---

**If system launches correctly, you should see the startup banner in console within 1 second of opening the file.** 🌳✨

**Relay is online.** 🟢
