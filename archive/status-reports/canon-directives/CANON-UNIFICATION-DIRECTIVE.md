# 🎯 CANON UNIFICATION DIRECTIVE

**Date:** 2026-02-02  
**Priority:** CRITICAL  
**Issue:** Only spiral visible; Globe + Tree + Sheets NOT rendering in unified view

---

## 🚨 **ROOT CAUSE IDENTIFIED**

**Problem:** `switchView('scaffold')` was calling **WRONG RENDER FUNCTION** on first load!

**Evidence from Console:**
```
✅ Auto-transitioning to Tree Scaffold view...
✅ Initializing 3D renderer...
Rendered: 1 main filament + 0 fork(s)  ← WRONG! (simple spiral)
```

**Missing logs:**
```
❌ "🌳 renderTreeScaffold() START"
❌ "🌍 Creating Globe mesh..."
❌ "🧬 Rendering DIRECT filaments..."
```

**Code Flow Bug:**
```javascript
if (!renderer) {
    init3DView();  // Sets up scene + lights
    // ❌ BUG: Never calls renderTreeScaffold()!
    // Result: Shows simple spiral from init3DView's internal render call
} else {
    renderTreeScaffold();  // ✅ Only runs on subsequent switches
}
```

---

## ✅ **IMMEDIATE FIX APPLIED**

Added `renderTreeScaffold()` call after `init3DView()` completes:

```javascript
if (!renderer) {
    console.log('Initializing 3D renderer...');
    init3DView();
    
    // 🔒 CRITICAL FIX: Must call renderTreeScaffold after init!
    console.log('Rendering tree scaffold (first load)...');
    setTimeout(() => {
        renderTreeScaffold();
        console.log('[Relay] ✅ Tree Scaffold rendered after init');
    }, 100);  // Small delay to ensure scene is ready
}
```

---

## 📊 **TESTING INSTRUCTIONS**

### **Step 1: Hard Refresh**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### **Step 2: Import Excel File**
Drag & drop any `.xlsx` file

### **Step 3: Verify Console Logs**

**Expected log sequence (in order):**
```
[Relay] 🚀 Auto-transitioning to Tree Scaffold view...
Initializing 3D renderer...
[Relay] 📐 Container size: XXXX x XXXX
[Relay] 🔒 Scene identity locked: ...
[Relay] 🎮 Initializing PointerLockControls...
Rendering tree scaffold (first load)...
[Relay] 🌳 renderTreeScaffold() START       ← KEY LOG #1
[Relay] 📊 Scene exists? true
[Relay] 📊 Rendering 7 tree nodes            ← KEY LOG #2
[Relay] 🌍 Creating Globe mesh...            ← KEY LOG #3 (if Stage ≥2)
[Relay] 🧬 Rendering DIRECT filaments...     ← KEY LOG #4
[Relay] ✅ Tree Scaffold rendered after init
```

### **Step 4: Visual Verification**

**What you SHOULD see:**
- 🌍 **Globe** (blue-ish sphere, 10-unit radius) at center
- 🌳 **Tree branches** (3 branches from Tel Aviv anchor)
- 📊 **Sheet planes** (perpendicular to branches, semi-transparent)
- 💎 **Cell geometry** (boxes/cubes on sheets)
- 🔵 **Internal filaments** (thin blue lines from cells → branch)
- 🟡 **Timeboxes** (rings along branches)
- ⚫ **Grid** (faint, at Y=-12, nearly invisible)

**What you should NOT see:**
- ❌ Only a yellow spiral
- ❌ Empty black viewport
- ❌ "TREE SCAFFOLD VIEW ACTIVE" debug overlay stuck on screen

---

## 🔍 **DIAGNOSTIC HUD (REQUIRED NEXT STEP)**

Canon must add a **persistent debug HUD** to make missing objects visible:

### **Implementation:**

Add this after `renderTreeScaffold()` function:

```javascript
// 🔍 DIAGNOSTIC HUD - Shows object counts per layer
function updateDiagnosticHUD() {
    let hudText = '';
    
    // Count objects by layer
    const globeCount = scene.children.filter(c => c.name && c.name.includes('globe')).length;
    const treeCount = scene.children.filter(c => c.name && c.name.includes('branch')).length;
    const sheetCount = scene.children.filter(c => c.name && c.name.includes('sheet')).length;
    const filamentCount = scene.children.filter(c => c.name && c.name.includes('filament')).length;
    const timeboxCount = scene.children.filter(c => c.name && c.name.includes('timebox')).length;
    
    hudText = `
🔍 SCENE DIAGNOSTICS:
━━━━━━━━━━━━━━━━━━━━
Total Objects: ${scene.children.length}
🌍 Globe: ${globeCount}
🌳 Tree Nodes: ${treeCount}
📊 Sheets: ${sheetCount}
🔵 Filaments: ${filamentCount}
🟡 Timeboxes: ${timeboxCount}
━━━━━━━━━━━━━━━━━━━━
Camera: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})
Stage Level: ${stageLevel}
    `;
    
    // Update HUD element
    const hud = document.getElementById('diagnosticHUD');
    if (hud) hud.textContent = hudText;
}

// Call in animation loop
function animate() {
    requestAnimationFrame(animate);
    updateDiagnosticHUD();  // ← Add this
    // ... rest of animate logic
}
```

### **HTML:**

Add to HTML body:

```html
<div id="diagnosticHUD" style="
    position: fixed;
    top: 100px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: #00ff88;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    border: 1px solid #00ff88;
    z-index: 9999;
    white-space: pre;
    pointer-events: none;
"></div>
```

**Acceptance Test:** HUD must show non-zero counts for Globe, Tree, Sheets, Filaments after import!

---

## 🎯 **UNIFIED VIEW ARCHITECTURE (CANONICAL MODEL)**

### **Stage-Gated Reveal Rules:**

| Stage | Visible Layers | Loading Rules |
|-------|---------------|---------------|
| 0-1   | Tree only | No Globe/boundaries loaded |
| 2     | Tree + Globe | Load Globe mesh (no boundaries) |
| 3     | Tree + Globe + Local Boundary | Load ONLY 1 GeoJSON (user's region) |
| 4+    | Tree + Globe + Boundaries + History Loop | Progressive tile loading |

### **Scene Graph Structure (REQUIRED):**

```
scene
├── lights (ambient, hemi, directional)
├── grid (Y=-12, opacity=0.05)
├── ground (Y=-12.5)
│
├── globeGroup (Stage ≥2)
│   └── globeMesh (radius=10, semi-transparent)
│
├── boundaryGroup (Stage ≥3)
│   └── localBoundaryMesh (extruded GeoJSON)
│
├── treeGroup
│   ├── trunkMesh (luminescent, translucent)
│   ├── branch1Mesh
│   ├── branch2Mesh
│   └── branch3Mesh
│
├── sheetGroup
│   ├── sheet1Mesh (perpendicular to branch)
│   ├── sheet2Mesh
│   └── sheet3Mesh
│
├── filamentGroup
│   ├── cell_A1_filament
│   ├── cell_A2_filament
│   └── ... (one per populated cell)
│
├── timeboxGroup
│   ├── timebox_0_puck (cylinder with faces)
│   ├── timebox_1_puck
│   └── ... (commit-range-based)
│
└── historyLoopGroup (Stage ≥4 OR toggled)
    └── historyHelix (yellow spiral)
```

**Rules:**
- ✅ Every mesh MUST have a `.name` property
- ✅ Every mesh goes into ONE group (no orphans)
- ✅ Groups are visible/hidden by stage level
- ✅ Camera focuses on `treeGroup` center by default

---

## 🚧 **REMAINING GAPS (PRIORITY ORDER)**

### **Priority 1: Real Timeboxes (NOT micro-rings)**

**Current:** Decorative rings along filaments  
**Required:** Material pucks with faces on branches

**Implementation:**
```javascript
function generateTimeboxesFromCommits(branchNode) {
    const commits = state.commits.filter(c => c.branch === branchNode.id);
    const timeboxes = [];
    
    // Bucket commits into timeboxes (e.g., every 10 commits)
    for (let i = 0; i < commits.length; i += 10) {
        const bucket = commits.slice(i, i + 10);
        timeboxes.push({
            timeboxId: `tb_${branchNode.id}_${i}`,
            commitRange: [i, i + bucket.length - 1],
            commitCount: bucket.length,
            yPosition: branchNode.baseY + (i / commits.length) * branchNode.height
        });
    }
    
    return timeboxes;
}

function renderTimeboxPuck(timebox, branchRadius) {
    const geometry = new THREE.CylinderGeometry(
        branchRadius * 1.05,  // Slightly wider than branch
        branchRadius * 1.05,
        0.3,  // Thin puck
        32, 1, false  // Caps ON (not open-ended)
    );
    
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFAA00,  // Gold
        emissive: 0xFF6600,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6,
        metalness: 0.3,
        roughness: 0.4
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `timebox_${timebox.timeboxId}`;
    mesh.position.y = timebox.yPosition;
    mesh.userData = {
        type: 'timebox',
        timeboxId: timebox.timeboxId,
        commitRange: timebox.commitRange,
        commitCount: timebox.commitCount
    };
    
    return mesh;
}
```

**Acceptance Test:** User can point to a puck and see "Timebox: commits 0-9"

---

### **Priority 2: Continuous Filaments (Root → Cell)**

**Current:** Short segments (cell → branch only)  
**Required:** Multi-segment paths (Cell → Sheet Bundle → Branch Bundle → Trunk → Root)

**Implementation:**
```javascript
function renderContinuousFilament(cellNode, sheetNode, branchNode) {
    // Define waypoints
    const cellAnchor = new THREE.Vector3(
        cellNode.worldX,
        cellNode.worldY,
        cellNode.worldZ
    );
    
    const sheetBundleAnchor = new THREE.Vector3(
        sheetNode.bundleX,  // Behind sheet center
        sheetNode.bundleY,
        sheetNode.bundleZ
    );
    
    const branchBundleAnchor = new THREE.Vector3(
        branchNode.x,
        branchNode.baseY,  // Bottom of branch
        branchNode.z
    );
    
    const rootAnchor = new THREE.Vector3(0, -8, 0);  // Tree root
    
    // Create smooth curve through waypoints
    const curve = new THREE.CatmullRomCurve3([
        cellAnchor,
        sheetBundleAnchor,
        branchBundleAnchor,
        rootAnchor
    ], false, 'catmullrom', 0.3);  // Tension = 0.3 for smooth bends
    
    const points = curve.getPoints(60);  // Smooth resolution
    const geometry = new THREE.TubeGeometry(curve, 60, radius, 8, false);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x00AAFF,
        emissive: 0x0088DD,
        emissiveIntensity: hasFormula ? 1.2 : 0.6,
        transparent: true,
        opacity: 0.7,
        metalness: 0.2,
        roughness: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `filament_${cellNode.id}`;
    return mesh;
}
```

**Bundling Rule:**  
If multiple cells from same column → merge at sheet bundle point → single thicker segment to branch

---

### **Priority 3: Stage-Gated LOADING (Not just visibility)**

**Current Issue:** All boundaries loaded at once (500+ GeoJSON files = crash)

**Correct Implementation:**

```javascript
let stageLevel = 1;  // Start at Stage 1 (Tree only)

async function progressStage() {
    stageLevel++;
    console.log(`[Relay] 📈 Stage progression: ${stageLevel - 1} → ${stageLevel}`);
    
    switch(stageLevel) {
        case 2:
            // Load Globe ONLY (no boundaries yet)
            createGlobe();
            console.log('[Relay] 🌍 Stage 2: Globe loaded');
            break;
        
        case 3:
            // Load ONE local boundary (user's region)
            const userLat = 32.0853;  // Tel Aviv
            const userLon = 34.7818;
            await loadLocalBoundary(userLat, userLon, 'data/boundaries/countries/ISR-ADM0.geojson');
            console.log('[Relay] 🗺️ Stage 3: Local boundary loaded');
            break;
        
        case 4:
            // Show history loop (already in scene, just unhide)
            const historyLoopGroup = scene.getObjectByName('historyLoopGroup');
            if (historyLoopGroup) historyLoopGroup.visible = true;
            console.log('[Relay] 🌀 Stage 4: History loop revealed');
            break;
        
        case 5:
            // Progressive tile loading (quadtree logic)
            // TODO: Implement tile system
            console.log('[Relay] 🗺️ Stage 5: Progressive tiles (TBD)');
            break;
    }
    
    updateStageHUD();
}

// Trigger progression via keyboard (M = Macro view)
document.addEventListener('keydown', (e) => {
    if (e.key === 'M' || e.key === 'm') {
        if (stageLevel < 5) progressStage();
    }
});
```

**Rule:** NEVER load all boundaries at once. Load on-demand based on camera position + user zoom level.

---

### **Priority 4: Pressure/ERI Visualization**

**Current:** ERI logged but not visualized

**Required Mapping:**

| Metric | Visual Property | Formula |
|--------|----------------|---------|
| ERI    | Filament thickness + glow | `thickness = baseRadius * (1 + ERI/100)` |
| Pressure | Branch stiffness + timebox thickness | `emissiveIntensity = 0.6 + (pressure * 0.8)` |
| Confidence | Opacity + color saturation | `opacity = confidence * 0.85` |
| Indeterminate | Dim + outline glow | `color = 0x888888, outline = true` |

**Implementation Example:**

```javascript
function updateFilamentVisualsFromMetrics(filamentMesh, cellMetrics) {
    const eri = cellMetrics.eri || 0;
    const pressure = cellMetrics.pressure || 0;
    const confidence = cellMetrics.confidence || 1.0;
    
    // ERI → Thickness
    filamentMesh.scale.setScalar(1 + (eri / 100));
    
    // ERI → Glow
    filamentMesh.material.emissiveIntensity = 0.6 + (eri / 100) * 0.8;
    
    // Confidence → Opacity
    filamentMesh.material.opacity = confidence * 0.85;
    
    // Pressure → Color temperature (blue → yellow → red)
    if (pressure < 0.3) {
        filamentMesh.material.color.setHex(0x00AAFF);  // Cool blue
    } else if (pressure < 0.7) {
        filamentMesh.material.color.setHex(0xFFAA00);  // Warning yellow
    } else {
        filamentMesh.material.color.setHex(0xFF3300);  // Danger red
    }
}
```

---

## ✅ **ACCEPTANCE CRITERIA (PASS/FAIL)**

Canon must verify EVERY item before declaring "complete":

### **Visual Tests:**

- [ ] **Globe visible** after import (blue sphere, radius ~10 units)
- [ ] **Tree branches visible** (3 branches from Tel Aviv anchor)
- [ ] **Sheets visible** (perpendicular to branches, semi-transparent)
- [ ] **Cells visible** (boxes/cubes on sheets, NOT just texture)
- [ ] **Filaments visible** (thin blue lines connecting cells → branch)
- [ ] **Timeboxes visible** (pucks with faces, not just rings)
- [ ] **History loop hidden** by default (only shows at Stage 4+)

### **Console Log Tests:**

- [ ] `renderTreeScaffold()` START log appears
- [ ] "Creating Globe mesh" appears (if Stage ≥2)
- [ ] "Rendering DIRECT filaments" appears
- [ ] Scene object counts > 0 for all groups

### **Interaction Tests:**

- [ ] **Scroll** changes flight speed (logged to console)
- [ ] **M key** zooms to macro view (shows Globe + Tree)
- [ ] **Z key** zooms to context (closer to tree)
- [ ] **G key** toggles grid (left 40% of screen)
- [ ] **Pointer lock** engages on canvas click (WASD movement works)

### **Data-Driven Tests:**

- [ ] Import file with **0 formula dependencies** → 0 bundled filaments (expected)
- [ ] Import file with **10+ formulas** → see thicker bundled filaments for shared inputs
- [ ] ERI value changes → filament thickness/glow changes visibly

---

## 🚀 **IMMEDIATE NEXT STEPS**

1. **Test the fix:**
   - Hard refresh (`Ctrl+Shift+R`)
   - Import Excel file
   - Verify console logs show `renderTreeScaffold()` execution
   - Report what you see vs expected

2. **Add Diagnostic HUD:**
   - Implement object count display (code above)
   - Verify non-zero counts for all groups

3. **Implement Priority 1 (Real Timeboxes):**
   - Replace micro-rings with pucks
   - Add commit-range metadata
   - Test hover interaction

4. **Create test file with formulas:**
   - 30-50 cells
   - 8-12 formulas (e.g., `=A1+B1`, `=SUM(A1:A10)`)
   - At least 2 shared inputs (e.g., A1 used by 3+ formulas)

---

## 📊 **CANONICAL SCORE UPDATE**

**Previous (incorrect) score:** 87% (counted code existence)  
**Actual score:** **~55%** (semantic completeness)

**Breakdown:**
- ✅ **Topology fixed:** 1:1 cell↔filament (15%)
- ✅ **Globe exists:** Present but may not show (10%)
- ✅ **Auto-transition added:** Working (5%)
- ✅ **Flight controls:** Scroll + WASD working (10%)
- ⚠️ **Unified view:** Scene exists but visibility broken (5%)
- ❌ **Real timeboxes:** Micro-rings ≠ timeboxes (0% of 15%)
- ❌ **Continuous filaments:** Short segments only (0% of 15%)
- ❌ **Stage-gated loading:** Visibility gated, not loading (0% of 10%)
- ❌ **Pressure/ERI visuals:** Logged but not visualized (0% of 10%)
- ❌ **Bundling visible:** Can't test without formula data (0% of 5%)

**Target for "Canonical":** 90%+

---

## 📝 **NEXT STATUS REPORT FORMAT**

Canon must report:

```
CANON STATUS REPORT - [DATE]
════════════════════════════════════════

🔍 VISUAL VERIFICATION:
  [ ] Globe: VISIBLE / NOT VISIBLE / PARTIALLY
  [ ] Tree: X branches visible
  [ ] Sheets: X sheets visible
  [ ] Filaments: X filaments visible
  [ ] Timeboxes: X timeboxes visible
  [ ] History loop: VISIBLE / HIDDEN (expected: HIDDEN)

📊 DIAGNOSTIC HUD OUTPUT:
  Total Objects: X
  Globe: X
  Tree Nodes: X
  Sheets: X
  Filaments: X
  Timeboxes: X

🎮 INTERACTION TESTS:
  [ ] Scroll speed: WORKING / NOT WORKING
  [ ] M key (macro): WORKING / NOT WORKING
  [ ] Z key (zoom): WORKING / NOT WORKING
  [ ] G key (grid): WORKING / NOT WORKING
  [ ] WASD flight: WORKING / NOT WORKING

🧪 DATA TESTS:
  [ ] Import with 0 formulas: X filaments (expected: = cell count)
  [ ] Import with formulas: bundling visible? YES / NO
  [ ] ERI changes: visual change? YES / NO

📈 CANONICAL SCORE: XX%
```

---

## ⚠️ **CRITICAL REMINDER**

**Stop scoring based on "code exists."**  
**Score ONLY on "semantic layer is visible and interactive in the unified view."**

If user sees **only the spiral**, the score is **<50%**, no matter how much code exists.

---

**END OF DIRECTIVE**

Canon: Report back after testing the fix. Include screenshots if Globe/Tree/Sheets are now visible!
