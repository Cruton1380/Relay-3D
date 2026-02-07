# CANON INSTRUCTIONS: Unify System on Globe

**Date:** 2026-02-02  
**Priority:** CRITICAL - Architecture Unification  
**Status:** Ready for implementation

---

## Executive Summary

**Current Problem:** Views are fragmented separate scenes  
**Required Solution:** Single unified 3D system on Globe with boundary layers  
**Restoration Target:** Relay v93 Globe + boundaries module

---

## INSTRUCTION 1: Stop Treating Views as Separate Scenes

### Current (Wrong):
- Grid View = separate 2D render
- Sheet Volume = separate 3D scene
- History Helix = separate 3D scene
- Tree Scaffold = separate 3D scene

**Problem:** Duplicated geometry, fragmented validation, no unified coordinate system

### Required (Correct):
**ONE 3D scene graph with layered visibility**

```
Scene (singular):
  ├─ Globe (Earth mesh)
  ├─ Boundaries Layer (cities, states, countries)
  ├─ Company Tree Layer (Tel Aviv location)
  │   ├─ Trunk (translucent)
  │   ├─ Branches (translucent)
  │   ├─ Internal Filaments (per cell)
  │   ├─ Timeboxes (rings)
  │   └─ Scars (refusals)
  ├─ Sheet Layer (visible at branch tips)
  ├─ History Helix Layer (temporal spiral overlay)
  └─ Graph Lens Layer (dependency edges overlay)
```

**Views toggle layers, NOT scenes**

---

## INSTRUCTION 2: Restore the Globe (Primary Coordinate System)

### What Must Be Restored from Relay v93:

#### A. Globe Mesh
```javascript
// Earth sphere with realistic textures
const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,          // Day texture
    bumpMap: earthBumpMap,      // Terrain height
    specularMap: earthSpecMap,  // Ocean shine
    roughness: 0.7,
    metalness: 0.1
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);
```

#### B. Geographic Coordinate System
```javascript
// Convert lat/lon to 3D position on sphere
function latLonToVector3(lat, lon, radius, altitude = 0) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -((radius + altitude) * Math.sin(phi) * Math.cos(theta));
    const z = ((radius + altitude) * Math.sin(phi) * Math.sin(theta));
    const y = ((radius + altitude) * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}
```

#### C. Tel Aviv Anchor Point
```javascript
// Tel Aviv coordinates: 32.0853°N, 34.7818°E
const telAvivPosition = latLonToVector3(32.0853, 34.7818, 100, 2);
const companyTreeRoot = new THREE.Group();
companyTreeRoot.position.copy(telAvivPosition);
companyTreeRoot.lookAt(0, 0, 0);  // Orient "up" from surface
scene.add(companyTreeRoot);

// All tree nodes are children of this root
companyTreeRoot.add(rootNode);
```

---

## INSTRUCTION 3: Restore Boundary System (Non-Negotiable)

### Boundary Hierarchy:
```
Country (Israel)
  ├─ State/District (Tel Aviv District)
  ├─ City (Tel Aviv)
  └─ Neighborhood (specific area)
```

### Visual Implementation:
```javascript
// Boundaries as translucent shells
function createBoundary(name, center, radius, color, opacity) {
    const boundaryGeom = new THREE.SphereGeometry(radius, 32, 32);
    const boundaryMat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        side: THREE.BackSide,  // Visible from inside
        depthWrite: false
    });
    
    const boundary = new THREE.Mesh(boundaryGeom, boundaryMat);
    boundary.position.copy(center);
    boundary.userData = {
        type: 'boundary',
        name: name,
        jurisdiction: true
    };
    
    return boundary;
}

// Nested boundaries
const countryBoundary = createBoundary('Israel', telAvivPosition, 10, 0x00AAFF, 0.05);
const cityBoundary = createBoundary('Tel Aviv', telAvivPosition, 5, 0x00DDFF, 0.1);
const neighborhoodBoundary = createBoundary('Business District', telAvivPosition, 2, 0x00FFAA, 0.15);

scene.add(countryBoundary);
scene.add(cityBoundary);
scene.add(neighborhoodBoundary);
```

### Boundary Purpose:
- **Authority scopes** (who decides what)
- **Jurisdiction** (regulatory compliance)
- **Pressure sources** (external vs internal)

**User must visually see:**
> *"This pressure is coming from national regulation, not company behavior."*

---

## INSTRUCTION 4: Centralize Logic Around ONE Canonical Object

### Current (Wrong):
- Each view computes its own truth
- Grid calculates ERI
- Graph calculates dependencies
- Tree calculates pressure

**Problem:** Divergent truth, no single source of authority

### Required (Correct):
**ONE canonical state object, views READ ONLY**

```javascript
const canonicalState = {
    globe: {
        position: [0, 0, 0],
        radius: 100,
        boundaries: [...]
    },
    companies: [
        {
            id: 'northwind',
            location: { lat: 32.0853, lon: 34.7818 },
            tree: {
                root: {...},
                branches: [...],
                filaments: [...],
                timeboxes: [...]
            },
            commits: [...],
            pressure: {...},
            confidence: {...}
        }
    ]
};

// Views NEVER modify canonicalState
// Views only READ and render
```

---

## INSTRUCTION 5: Validate ONE Spreadsheet Before Scaling

### Priority Order:
1. **Lock ONE spreadsheet** (e.g., 15-30 cells with formulas)
2. **Verify fractal filaments** (curved, segmented, timebox rings)
3. **Confirm bundling legible** (reuse creates obvious thickness)
4. **Test causality tracing** (can visually follow: input → formula → output)

### Acceptance Test:
**User must be able to say:**
> *"If I change THIS cell, I know exactly what breaks — and why — without reading text."*

**Only after this test passes:**
5. Scale to multiple sheets
6. Add multiple branches
7. Place on Globe in Tel Aviv
8. Add boundary shells
9. Enable multi-company views

---

## INSTRUCTION 6: Layer Visibility System

### Camera Modes:
```javascript
const viewModes = {
    GLOBE: {
        camera: 'orbital',
        layers: ['globe', 'boundaries', 'companies'],
        distance: 300
    },
    REGION: {
        camera: 'orbital',
        layers: ['cityBoundary', 'companyTree', 'neighborhoodBoundary'],
        distance: 50
    },
    COMPANY: {
        camera: 'freeflight',
        layers: ['companyTree', 'branches', 'internalFilaments', 'timeboxes'],
        distance: 20
    },
    SHEET: {
        camera: 'inspect',
        layers: ['sheet', 'cells', 'formulaEdges'],
        distance: 5
    }
};
```

**Keyboard Controls:**
- `1` = Globe view (orbital)
- `2` = Region view (city boundaries)
- `3` = Company view (tree + filaments)
- `4` = Sheet view (cell detail)

**All views use SAME scene, different camera + layer visibility**

---

## INSTRUCTION 7: File Structure for Unification

### Required Files from Relay v93:
```
src/
├─ globe/
│   ├─ globe-mesh.js          (Earth sphere + textures)
│   ├─ boundaries.js          (Nested boundary shells)
│   └─ geo-utils.js           (lat/lon conversion)
├─ tree/
│   ├─ company-tree.js        (Current tree scaffold)
│   ├─ internal-filaments.js  (Fractal filaments)
│   └─ timeboxes.js           (Rings + micro-rings)
├─ layers/
│   ├─ layer-manager.js       (Show/hide by mode)
│   └─ view-modes.js          (Camera presets)
└─ canonical-state.js         (Single truth source)
```

### Integration Points:
1. `canonical-state.js` = single source of truth
2. All modules READ from canonical-state
3. Only commit handlers WRITE to canonical-state
4. Views never compute, only render

---

## INSTRUCTION 8: Phased Implementation Timeline

### Phase 1: Fractal Filaments (ONE spreadsheet) ⏳
**Target:** 3-5 days
- [ ] Implement curved organic paths (no straight segments)
- [ ] Add micro-timeboxes (3 per filament)
- [ ] Verify reuse-based thickness
- [ ] Test causality tracing

### Phase 2: Globe Restoration ⏳
**Target:** 2-3 days
- [ ] Restore Globe mesh from v93
- [ ] Implement lat/lon coordinate system
- [ ] Place company tree in Tel Aviv
- [ ] Test camera transitions (Globe → Company)

### Phase 3: Boundary Shells ⏳
**Target:** 2-3 days
- [ ] Restore boundary rendering from v93
- [ ] Implement nested shells (Country → City → Neighborhood)
- [ ] Add boundary metadata (authority, jurisdiction)
- [ ] Test pressure attribution (external vs internal)

### Phase 4: Layer Unification ⏳
**Target:** 3-4 days
- [ ] Merge all views into single scene
- [ ] Implement layer visibility toggle
- [ ] Add camera mode system
- [ ] Test smooth transitions between modes

### Phase 5: Canonical State Centralization ⏳
**Target:** 2-3 days
- [ ] Create single canonical-state object
- [ ] Refactor all views to read-only
- [ ] Remove duplicate computation logic
- [ ] Verify single truth source

**Total Estimated Time:** 12-18 days for complete unification

---

## INSTRUCTION 9: Immediate Actions (This Week)

### Day 1-2: Fix Fractal Filaments
- Add organic curves (remove straight segments)
- Add micro-timebox rings to each filament
- Verify visually: filaments look like tiny branches

### Day 3: One Spreadsheet Validation
- Create test file: 20 cells with 3-level formula chain
- Verify: reuse creates thickness, formulas converge, trace is clear
- Acceptance: "I can see what breaks if I change this cell"

### Day 4-5: Begin Globe Restoration
- Extract Globe code from Relay v93
- Integrate into current prototype
- Place tree at Tel Aviv coordinates

### Week 2: Complete unification (boundaries + layers)

---

## SUCCESS CRITERIA (Final Tests)

### Test 1: Fractal Grammar ✅
**Question:** If I zoom into a filament, does it look like a tiny branch?  
**Pass:** Curves, segments, micro-timeboxes visible  
**Fail:** Straight line or simple tube

### Test 2: Single Truth Source ✅
**Question:** If I change ONE cell in canonical state, do ALL views update?  
**Pass:** Grid, Tree, Graph all reflect change instantly  
**Fail:** Must manually refresh views or recompute

### Test 3: Geographic Anchoring ✅
**Question:** Can I zoom out and see where this company sits on Earth?  
**Pass:** Tree emerges from Tel Aviv, boundaries visible  
**Fail:** Tree floats in abstract space

### Test 4: Boundary Attribution ✅
**Question:** Can I tell which pressure comes from regulation vs operations?  
**Pass:** Boundary shells show external constraints  
**Fail:** All pressure looks the same

---

## COMPLETION SIGNATURE

**When Canon says:**
> *"The tree is not floating. It is growing from Tel Aviv. The boundaries show me what I cannot control locally. The filaments are fractals of their parent branches. I can trace ONE cell's entire history through timeboxes."*

**Then unification is complete.**

---

**NEXT IMMEDIATE ACTION:** Implement fractal filaments (curved paths + micro-timeboxes) for ONE test spreadsheet

**DO NOT scale up until this works for one sheet.**

---

**The system must be anchored to Earth before it can be trusted at company scale.** 🌍🌳
