# Phase 2: View Unification Plan
**Date:** 2026-02-02 19:45  
**Status:** 🎯 **READY TO IMPLEMENT**  
**Prerequisites:** Phase 1 COMPLETE ✅ (Topology fixed, Globe restored)

---

## 🎯 **GOAL: ONE Unified 3D View**

**Current Problem:** 4 separate view buttons (Grid, Sheet Volume, History Helix, Tree Scaffold)  
**Target State:** ONE view showing everything simultaneously on the Globe

---

## 📊 **WHAT'S ALREADY WORKING**

Per user console logs (2026-02-02 19:30):
- ✅ Globe mesh exists (radius 10, centered at origin)
- ✅ Tree anchored at Tel Aviv (32.0853°N, 34.7818°E)
- ✅ Sheets visible (Purchase Orders, Invoices, Vendor Quotes)
- ✅ Internal filaments rendering (68 filaments, no overcounting)
- ✅ Camera at (0, 0, 20) can see Globe + Tree
- ✅ Topology lint passing

**Evidence:** User screenshots show Globe with tree emerging, sheets perpendicular to branches.

---

## 🔧 **IMPLEMENTATION TASKS**

### **Task 1: Remove Separate View Logic**
**Current:**
```javascript
function switchView(viewName) {
    if (viewName === 'grid') showGridView();
    if (viewName === 'volume') showSheetVolume();
    if (viewName === 'helix') showHistoryHelix();
    if (viewName === 'scaffold') showTreeScaffold();
}
```

**Target:**
- Remove view-specific rendering functions
- Keep ALL elements visible in ONE scene
- Use layer system or visibility flags for toggle (optional)

**Files:**
- `filament-spreadsheet-prototype.html` lines ~5700-5800 (switchView function)

---

### **Task 2: Integrate Grid/Sheet Volume INTO Globe Scene**
**Current:** Grid view is 2D overlay, separate from 3D scene  
**Target:** Grid becomes a "lens" or overlay that appears ON TOP of 3D scene

**Options:**
a) **CSS Overlay:** Grid as HTML table with `position: absolute`, semi-transparent background
b) **3D Billboard:** Render grid as texture on plane in 3D space
c) **Split View:** Grid on left 30%, 3D Globe on right 70% (both visible)

**Recommendation:** Option (a) - CSS overlay with toggle (press `G` to show/hide)

---

### **Task 3: History Helix → Timeline Ring at Altitude**
**Current:** Helix is separate 3D view  
**Target:** Helix becomes a **time scaffold / timeline ring at altitude** (NOT orbit!)

**Integration:**
- Render helix at altitude (radius 12-15, above Globe surface)
- **Anchored to tree(s)**, not orbiting Globe
- Stage-gated visibility (Stage 4+): `historyLoop.visible = (stageLevel >= 4)`
- Can fly toward it to inspect commits
- Links to tree branches via thin lines

**Critical:** Nothing orbits in Relay - everything flows. Use "history loop" or "timeline ring", never "orbit".

---

### **Task 4: Unified Camera Controller**
**Current:** Camera resets when switching views  
**Target:** Free-fly camera that can navigate between:
- Macro view (see whole Globe + multiple trees)
- Tree view (inspect one company's branches)
- Sheet view (read cell data up close)
- Helix view (fly to commit history ring)

**No view switching - just camera movement!**

---

### **Task 5: Remove View Buttons, Add Navigation HUD**
**Current UI:**
```html
<button onclick="switchView('grid')">Grid View</button>
<button onclick="switchView('volume')">Sheet Volume</button>
<button onclick="switchView('helix')">History Helix</button>
<button onclick="switchView('scaffold')">Tree Scaffold</button>
```

**Target UI:**
```html
<div id="nav-hud" style="position: absolute; top: 10px; right: 10px;">
  Press G: Toggle Grid Overlay
  Press H: Toggle History Loop
  Press T: Fly to Tree anchor
  Press Z: Zoom to Context
  Press M: Macro View (lift to altitude)
  Click object: Inspect
</div>
```

**CRITICAL:** No "orbit" terminology anywhere (including UI text). Use "Zoom/Context/Macro" instead.

**No buttons - just keyboard shortcuts + free-fly!**

---

## 📐 **RENDERING ARCHITECTURE**

### **Scene Graph (Unified):**
```
scene (root)
├── Globe (radius 10, origin)
│   ├── Lat/lon grid (wireframe)
│   ├── Boundaries (extruded polygons) [TODO]
│   └── Tree anchors (geospatial positions)
├── Trees (multiple companies)
│   └── Northwind (Tel Aviv)
│       ├── Branches (responsibility domains)
│       ├── Sheets (perpendicular to branches)
│       ├── Internal filaments (cell→branch)
│       └── Timeboxes (rings at Y intervals)
├── History Helix (altitude 12-15)
│   ├── Commit rings (time sequence)
│   └── Links to tree branches
└── Camera (free-fly, WASD controls)
```

**Everything visible, one scene, one graph!**

---

## ✅ **ACCEPTANCE CRITERIA**

Phase 2 is complete when:
1. ❌ No view buttons remain (only keyboard shortcuts)
2. ❌ Globe + Tree visible simultaneously (stage-gated)
3. ❌ Camera can fly between macro/micro views without "switching"
4. ❌ Grid appears as overlay (press G to toggle)
5. ❌ Scene graph has ONE root (no rebuilds)
6. ❌ **Stage gate controls LOADING** (not just visibility)
7. ❌ At Stage 2, only ONE boundary region loads (containing tree anchor)
8. ❌ Boundary mesh has outline + fill, sits above globe (no z-fighting)
9. ❌ Zooming out reveals globe GRADUALLY (fade-in, not instant pop)
10. ❌ No "orbit" terminology anywhere (UI, code comments, logs)

---

## 🚫 **WHAT NOT TO DO**

- ❌ Don't create new scene for each view (violates one-graph rule)
- ❌ Don't show everything visible at once (violates stage-gate reveal)
- ❌ Don't reset camera on "view switch" (no switches!)
- ❌ Don't rebuild geometry when toggling elements (use visibility)
- ❌ Don't use "orbit" terminology anywhere (UI, code, logs)
- ❌ **Don't load 500 GeoJSONs in prototype** (load only what stage allows)
- ❌ **Don't show world boundaries at Stage 0-1** (tree only)
- ❌ **Don't render whole planet's admin layers even if hidden** (loading bloat)

**CRITICAL: Stage gates control BOTH loading AND visibility!**
```javascript
// Stage 0-1: Don't load globe assets
if (stageLevel < 2) {
  // No globe mesh, no boundaries loaded
}

// Stage 2: Load ONLY local assets
if (stageLevel >= 2) {
  loadGlobeMesh();  // Sphere + grid only
  loadLocalBoundary(treeAnchor);  // ONE boundary polygon containing anchor
  globeMesh.visible = (cameraAltitude > threshold);  // Fade in when zooming out
}

// Stage 3+: Load more tiles progressively
if (stageLevel >= 3) {
  loadNeighborhoodBoundaries(userBasin);  // User's region only
}
```

**Performance Rule:** Don't load 500 GeoJSONs and hide them - load only what stage allows!

---

## 📖 **CANONICAL REFERENCES**

- `RELAY-FINAL-ARCHITECTURE-SPEC.md` - Lock 6 (one scene graph)
- `RELAY-STAGE-GATE-SPEC.md` - Progressive reveal (layers, not views)
- `IMPLEMENTATION-LOCKS-CHECKLIST.md` - Topology must stay 1:1

---

## 🎬 **IMPLEMENTATION ORDER**

1. **Keep Tree Scaffold rendering as-is** (it works!)
2. **Remove view switcher buttons** (lines ~875-879 in HTML)
3. **Add keyboard shortcuts** (G, H, T, O keys)
4. **Render History Helix in same scene** (don't hide tree!)
5. **Grid as CSS overlay** (semi-transparent, toggleable)
6. **Test: Import file → Everything visible at once**

---

**Estimated Complexity:** Medium (mostly removing code, not adding)  
**Risk:** Low (topology foundation is stable)  
**Blocker:** None (Phase 1 complete)

---

**Next Step:** Implement Task 1 (remove separate view logic) and report progress.
