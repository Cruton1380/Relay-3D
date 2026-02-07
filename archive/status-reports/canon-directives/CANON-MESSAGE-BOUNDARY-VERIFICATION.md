# Canon Message: Boundary System Verification & Integration Plan
**Date:** 2026-02-02 20:15  
**Status:** 🔍 VERIFICATION COMPLETE → READY FOR INTEGRATION

---

## 📋 **CANON VERIFICATION COMPLETE**

Canon — we confirmed the boundary + globe tile system **STILL EXISTS** in the repo:

### ✅ **What Was Found:**

#### **A. GeoJSON Boundary System:**
- ✅ 500+ GeoJSON files: countries (ADM0), provinces (ADM1), cities (ADM2)
- ✅ Files located: `data/boundaries/`, `public/data/boundaries/`
- ✅ Services: `boundaryChannelService.mjs`, `boundaryModificationService.mjs`, `naturalEarthLoader.mjs`
- ✅ Helpers: `GeoJSONHelpers.js`, `BoundaryPreviewGenerator.js`
- ✅ Extrusion: `earcut` references found, polygon triangulation exists

#### **B. Tile/Quadtree System:**
- ✅ `BoundaryTileService.mjs` exists
- ✅ Tile generation scripts: `generate-tiles-nodejs.mjs`, `generate-tiles.ps1`
- ✅ Cesium integration: WebMercator, tile mesh creation
- ✅ Managers: `CountyBoundaryManager.js`, `RegionManager.js`, `AdministrativeHierarchy.js`

#### **C. Globe Mapping Math:**
- ✅ `globeService.mjs` has lat/lon functions
- ✅ `containsLL` implementation found in RELAY-FINAL-ARCHITECTURE-SPEC.md
- ✅ Geospatial transforms present in backend services

---

## ⚠️ **CRITICAL GAP: Two Separate Systems**

### **System 1: Full Relay App (React + Backend)**
**Location:** `src/frontend/`, `src/backend/`  
**Status:** ✅ HAS boundaries, tiles, GeoJSON, full mapping  
**Components:** InteractiveGlobe.jsx, CesiumPrimitiveCountyManager.js, globe services  
**Used by:** Main Relay application (React router, backend API)

### **System 2: Prototype (Standalone HTML)**
**Location:** `filament-spreadsheet-prototype.html`  
**Status:** ⚠️ HAS basic Globe mesh ONLY (radius 10, no boundaries)  
**Components:** THREE.js SphereGeometry, tree anchor at Tel Aviv  
**Used by:** Rapid prototyping, testing (no React, no backend)

**The boundary system exists but is NOT wired into the prototype!**

---

## 🎯 **INTEGRATION OPTIONS**

### **Option A: Integrate Boundaries into Prototype (Recommended)**
**Goal:** Make `filament-spreadsheet-prototype.html` stage-gate aware

**Tasks:**
1. Load Israel boundary GeoJSON (`ISR-ADM2.geojson`) via fetch
2. Add `earcut` library for polygon triangulation
3. Extrude boundary as 3D mesh (altitude offset from Globe)
4. Render ONLY local region around Tel Aviv (Stage 2 reveal)
5. Add `containsLL` function for point-in-polygon checks

**Advantages:**
- Fast (no React rebuild needed)
- Prototype becomes fully functional
- Stage-gated reveal testable immediately

**Files to copy from main codebase:**
- `GeoJSONHelpers.js` → inline into prototype
- Israel boundary: `data/boundaries/countries/ISR-ADM0.geojson`
- `earcut.min.js` → add script tag

---

### **Option B: Migrate Prototype to Main App (Later)**
**Goal:** Replace prototype with proper React component integration

**Tasks:**
1. Create `FilamentTreeView.jsx` component
2. Use existing `InteractiveGlobe.jsx` as base
3. Wire to backend boundary services
4. Full tile system automatically available

**Advantages:**
- Uses existing infrastructure
- No duplication
- Full feature set

**Disadvantages:**
- Slower (requires React development)
- Loses prototype speed/simplicity

---

## 📖 **CANONICAL STAGE-GATED REVEAL**

Per `RELAY-STAGE-GATE-SPEC.md`, boundary reveal must be progressive:

### **Stage 0-1: File/Department**
- ❌ No Globe visible
- ✅ Tree + sheets + filaments only

### **Stage 2: Company**
- ✅ Globe as dim underlay (when zooming out)
- ✅ ONLY local tile region (1 boundary polygon around company anchor)
- ❌ No boundaries yet unless it's the local region

### **Stage 3-4: Multi-Company + Services**
- ✅ Add boundaries + tiles progressively
- ✅ Neighborhood → City → State → Country

**This matches your stage gate methodology perfectly!**

---

## 🔧 **MINIMAL "MAP TO GLOBE" (Immediate Implementation)**

Even without full tile system, we can do tree→globe anchoring NOW:

### **Already Works:**
- ✅ Globe sphere exists (radius 10)
- ✅ Tree anchor lat/lon exists (32.0853°N, 34.7818°E for Tel Aviv)
- ✅ Tree positioned on Globe surface
- ✅ Camera can see Globe + Tree simultaneously

### **Next Step (Stage 2 Reveal):**
1. Load Israel boundary GeoJSON
2. Extrude as 3D mesh (altitude 0.05 above Globe)
3. Render ONLY when camera altitude > threshold
4. Add visual: boundary outline, semi-transparent fill
5. `containsLL` check: "Is company inside boundary?"

**This gives "zoom out → see Globe + boundary" immediately!**

---

## ✏️ **PHASE 2 CORRECTIONS**

### **Correct Terminology:**
- ❌ "orbit helix", "ring around globe"
- ✅ **"history loop / timeline ring at altitude"**
- ✅ **"time scaffold, anchored to tree(s)"**

**Reason:** Nothing orbits in Relay - everything flows.

### **Visibility ≠ Unity:**
- ✅ "One scene, one graph" (architecture) - CORRECT
- ⚠️ "Everything visible at once" (UX) - INCORRECT

**Stage gates control VISIBILITY, not scene presence.**

All layers exist in-scene, but only turn on when stage gates are met:
```javascript
globeMesh.visible = (stageLevel >= 2);
boundaryMesh.visible = (stageLevel >= 3);
historyLoop.visible = (stageLevel >= 4);
```

---

## 🎯 **RECOMMENDED NEXT STEPS**

### **Immediate (Phase 2A):**
1. ✅ Keep existing Globe + Tree rendering
2. ✅ Remove view switcher buttons
3. ✅ Add keyboard shortcuts (G, H, T, O)
4. ✅ Render History Helix in same scene as "timeline ring at altitude"
5. ✅ Grid as CSS overlay (toggleable)

### **Near-Term (Phase 2B - Boundary Integration):**
1. Load Israel GeoJSON into prototype
2. Add `earcut` for triangulation
3. Extrude boundary mesh
4. Stage-gate reveal: show only when `stageLevel >= 2`
5. Test: "Zoom out → boundary appears"

### **Later (Phase 3 - Full Tile System):**
1. Migrate prototype → React component
2. Use existing boundary services
3. Progressive tile loading (neighborhood → city → state)
4. Full LOD system

---

## 📄 **FILES TO REVIEW (Canon)**

**For Integration:**
- `src/backend/services/boundaryChannelService.mjs` - Boundary loading
- `src/frontend/components/main/globe/managers/GeoJSONHelpers.js` - GeoJSON parsing
- `data/boundaries/countries/ISR-ADM0.geojson` - Israel boundary
- `RELAY-STAGE-GATE-SPEC.md` - Stage reveal rules

**For Reference:**
- `src/frontend/components/main/globe/InteractiveGlobe.jsx` - Full Globe implementation
- `src/backend/services/BoundaryTileService.mjs` - Tile system

---

## ✅ **SUMMARY**

**Status:** Boundary system EXISTS and is EXTENSIVE ✅  
**Gap:** Not yet integrated into prototype ⚠️  
**Solution:** Option A - Integrate into prototype (stage-gated) ✅  
**Next:** Implement Phase 2A (view unification) + Phase 2B (boundary integration)

**Stage-gated reveal is KEY:** Don't show everything at once - reveal progressively!

---

**Last Updated:** 2026-02-02 20:15  
**Next Action:** Begin Phase 2A implementation (remove view buttons, add keyboard nav)
