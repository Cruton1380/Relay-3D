# V93 Globe System Inventory & Integration Assessment

**Date**: 2026-02-06  
**Task**: Restore v93 globe + boundary + weather + votes as floor layer  
**Status**: ⚠️ CRITICAL ARCHITECTURAL MISMATCH DETECTED

---

## 0) V93 Globe Inventory Map

### Architecture Discovery

**v93 is a Cesium/React application, NOT compatible with single-file Three.js prototype.**

### Core Globe Components (React/Cesium)

| File Path | Purpose | Tech Stack |
|-----------|---------|------------|
| `src/frontend/components/main/globe/InteractiveGlobe.jsx` | Main 3D globe component (1500+ lines) | React + Cesium |
| `src/frontend/components/main/globe/managers/GlobeInitializer.js` | Cesium viewer setup/config | Cesium.Viewer API |
| `src/frontend/components/main/globe/managers/GlobeControls.js` | Camera/map controls | Cesium Camera API |
| `src/frontend/components/main/globe/managers/RegionManager.js` | Country/state boundary loading | Cesium Entities |
| `src/frontend/components/main/globe/managers/WeatherManager.js` | Weather overlay system | Cesium ImageryLayer |
| `src/frontend/components/main/globe/managers/TopographyManager.js` | Terrain/elevation viz | Cesium TerrainProvider |

### Boundary System

| File Path | Purpose | Tech Stack |
|-----------|---------|------------|
| `src/shared/boundaryData.js` | Static country/province bounds | JS object (bounding boxes only) |
| `src/frontend/components/main/globe/managers/AdministrativeHierarchy.js` | Hierarchical region structure | React state |
| `src/frontend/components/main/globe/managers/CountyBoundaryManager.js` | County-level boundaries | Cesium Primitives |
| `src/frontend/components/main/globe/managers/CesiumPrimitiveCountyManager.js` | 3D extrusion for boundaries | Cesium Primitive API |
| `src/frontend/components/main/globe/managers/GeoJSONHelpers.js` | GeoJSON parsing/processing | Turf.js + Cesium |
| `data/boundaries/countries/*.geojson` | 522 GeoJSON files | Standard GeoJSON polygons |

**Key finding**: `boundaryData.js` only has **bounding boxes** (north/south/east/west), not actual polygon coordinates. Real boundary polygons are in `data/boundaries/*.geojson`.

### Vote Visualization

| File Path | Purpose | Tech Stack |
|-----------|---------|------------|
| `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx` | Vote/channel markers on globe | Cesium Entities (billboards) |
| `src/frontend/components/main/globe/panels/BoundaryChannelPanel.jsx` | Boundary vote UI panel | React + channel API |
| `src/backend/globe-geographic/globeService.mjs` | Globe data endpoints | Express.js API |

**Key finding**: Votes are rendered as **Cesium Entity billboards** positioned at lat/lon, with heat colors for activity levels.

### Weather System

| File Path | Purpose | Tech Stack |
|-----------|---------|------------|
| `src/frontend/components/main/globe/managers/WeatherManager.js` | Weather overlay manager | Cesium ImageryLayer |

**Key finding**: Weather is a **Cesium ImageryLayer** overlay (likely WMS/tile service), not a physics simulation.

### Containment System (`containsLL`)

**Status**: ❌ **NOT FOUND** in v93 codebase.

- No `containsLL(lat, lon)` function exists
- No point-in-polygon implementation found
- Boundary containment appears to use **bounding box checks only** (fast but inaccurate)

**Implication**: v93 did NOT have true polygon containment. It used coarse bounding boxes.

---

## 1) Restore v93 Globe as Floor Layer?

### Assessment: ❌ **CANNOT RESTORE AS-IS**

**Reason**: Architectural incompatibility.

| Aspect | v93 Globe System | Current Filament Prototype |
|--------|------------------|----------------------------|
| **Tech Stack** | Cesium.js (separate WebGL context) | Three.js (single scene graph) |
| **Architecture** | React component tree | Single HTML file with inline JS |
| **Scene Management** | Cesium.Viewer + Cesium.Scene | THREE.Scene (already created) |
| **Globe Rendering** | Cesium.Globe (ellipsoid tiles) | THREE.SphereGeometry mesh |
| **Boundaries** | Cesium.Primitive extrusion | Not implemented |
| **Coordinate System** | WGS84 ellipsoid (Cesium) | Sphere with tangent frames (Three.js) |
| **Dependencies** | React, Cesium, Turf.js, Express API | Three.js, XLSX.js (standalone) |

### What "Restore" Actually Means

**Option 1**: Re-implement v93 features in Three.js (correct approach)
- Use existing `globeMesh` in prototype
- Add boundary extrusion using Three.js geometry
- Add vote billboards using Three.js sprites
- Add weather as texture overlay

**Option 2**: Embed Cesium viewer alongside Three.js (fragile, breaks "one scene" rule)
- Two WebGL contexts fighting for GPU
- Coordinate system mismatch hell
- Violates "no separate views" requirement

**Recommendation**: **Option 1 only**. Cesium cannot coexist with Three.js cleanly in the same scene graph.

---

## 2) Restore Boundaries as True Shells?

### Current State: ❌ **NOT IMPLEMENTED**

The prototype has:
- `loadLocalBoundary(lat, lon)` function (lines 4188-4224)
- Attempts to fetch GeoJSON from `data/boundaries/countries/ISR-ADM0.geojson`
- **Fails with CORS** on `file://` protocol
- **No rendering code** even if fetch succeeds

### What v93 Had

v93 rendered boundaries using **Cesium Primitive API**:
- GeoJSON polygons → Cesium geometry
- Extruded to create 3D "shells" (height based on vote activity)
- Uses `CesiumPrimitiveCountyManager.js` (350+ lines)

### What's Missing in Prototype

1. **GeoJSON parsing**: No Turf.js or polygon parser
2. **Extrusion**: No code to convert lat/lon rings → Three.js geometry
3. **Local tangent frame**: Rotation to align vertical extrusion with surface normal
4. **LOD system**: No code to show/hide boundaries by altitude
5. **containsLL**: No point-in-polygon test (v93 didn't have this either!)

### Implementation Required

```javascript
// Pseudo-code for Three.js boundary extrusion:
async function loadAndRenderBoundary(geojsonPath) {
  const geojson = await fetch(geojsonPath).then(r => r.json());
  const polygon = geojson.features[0].geometry.coordinates[0];
  
  // Convert lat/lon → world coords
  const worldCoords = polygon.map(([lon, lat]) => latLonToVector3(lat, lon, globeRadius));
  
  // Create extruded shell
  const shape = new THREE.Shape(worldCoords.map(toLocalXY));
  const extrudeSettings = { depth: 0.1, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Rotate to surface normal (local tangent frame)
  const up = computeSurfaceNormal(lat, lon);
  geometry.lookAt(up);
  
  // Add to scene
  const mesh = new THREE.Mesh(geometry, boundaryMaterial);
  scene.add(mesh);
}
```

**Required libraries**:
- GeoJSON parser (or manual parsing)
- Point-in-polygon algorithm (for `containsLL`)

---

## 3) Reconnect Boundary Vote System + Weather?

### Boundary Votes: ❌ **NOT CONNECTED**

**v93 implementation**:
- `GlobalChannelRenderer.jsx` fetches `/api/globe/channels`
- Backend returns channels with `{ lat, lon, voteCount, activity }`
- Frontend renders Cesium.Entity.billboard at each location
- Heat color based on activity level

**Current prototype**: No vote system, no channel API, no backend.

**To implement**:
- Need backend API or static vote data file
- Render votes as Three.js sprites (like current proximity labels)
- Color by activity/heat (shader or material color)

### Weather Overlay: ❌ **NOT IMPLEMENTED**

**v93 implementation**:
- `WeatherManager.js` adds Cesium.ImageryLayer
- Likely a WMS tile service (e.g., OpenWeatherMap)
- Overlays as texture on globe surface

**Current prototype**: No weather system.

**To implement**:
- Fetch weather tile texture (WMS or static image)
- Apply as texture overlay on `globeMesh.material.map`
- Update dynamically (optional)

---

## 4) Filament Tree Must Become Child of Globe Anchoring

### Current State: ✅ **PARTIALLY IMPLEMENTED**

The prototype already has globe anchoring:

```javascript
// Line 4421: anchoring at Tel Aviv
const telAvivLat = 32.0853;
const telAvivLon = 34.7818;
const treeAnchorPos = latLonToVector3(telAvivLat, telAvivLon, globeRadius);
```

**What's missing**:
- No local tangent frame orientation (tree "up" should be surface normal)
- No commit-driven anchor (hard-coded to Tel Aviv)
- No multiple trees (single tree only)

**Implementation required**:
```javascript
// TREE_ANCHOR_SET commit processing:
function processTre

eAnchorSet(commit) {
  const { companyId, lat, lon, altitude } = commit.payload;
  const anchorPos = latLonToVector3(lat, lon, globeRadius + altitude);
  
  // Compute local tangent frame
  const up = anchorPos.clone().normalize();  // Surface normal
  const north = new THREE.Vector3(0, 1, 0);  // Approximate north
  const east = new THREE.Vector3().crossVectors(north, up).normalize();
  north.crossVectors(up, east).normalize();
  
  // Orient tree using tangent frame
  treeGroup.position.copy(anchorPos);
  treeGroup.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(east, up, north)
  );
}
```

---

## 5) One-Scene, One-Graph Enforcement

### Current State: ✅ **ENFORCED**

The prototype already has these guardrails:

```javascript
// Line 2703: Scene UUID locked
console.log('[Relay] 🔒 Scene identity locked: 1228CDFF-8917-43FA-89FD-723E24CBB0B1');

// Line 4510: State maps cleared deterministically
state.sheetSpines = {};
window.cellAnchors = {};

// Line 6582: View changes toggle visibility only
function switchView(targetView) {
  // No scene.clear(), just visibility toggles
}
```

**Status**: Compliant with "no scene.clear() without rebuilding" rule.

---

## 6) Decision Gate: Option A vs Option B

### Option A: Filaments into Globe ✅ **RECOMMENDED**

**Keep globe as world substrate, filaments as anchored objects on top.**

#### Pros:
1. **Correct physics**: Tree roots anchor to real GPS coordinates
2. **Correct geography**: Boundaries are real political regions
3. **LOD makes sense**: Zoom planetary → company → sheet → cell
4. **Boundaries function**: `containsLL` can gate commit visibility
5. **One scene**: Globe + tree coexist in same THREE.Scene
6. **Scalable**: Add more trees at different lat/lon anchors

#### Cons:
1. **Requires LOD discipline**: Must hide sheets when zoomed out to planet
2. **Requires boundary implementation**: ~300-500 lines for GeoJSON extrusion
3. **Requires vote system**: Backend API or static data + rendering

#### Implementation Order:
1. Enhance `globeMesh` with Earth texture (already started)
2. Implement boundary extrusion (GeoJSON → Three.js geometry)
3. Implement `containsLL` (point-in-polygon using ray casting)
4. Add vote billboards (Three.js sprites at lat/lon)
5. Add weather texture overlay (optional)
6. Connect tree anchoring to commits (TREE_ANCHOR_SET)
7. Implement LOD system (altitude-based visibility)

#### Estimated Lines of Code:
- Boundary extrusion: ~400 lines
- containsLL: ~100 lines
- Vote rendering: ~200 lines
- Weather overlay: ~150 lines
- LOD system: ~250 lines
- **Total**: ~1100 lines (manageable in single file)

---

### Option B: Globe into Filaments ❌ **NOT RECOMMENDED**

**Keep filament tree as main, insert globe as backdrop.**

#### Pros:
1. **Less refactor risk**: Don't change existing tree code
2. **Faster short-term**: Globe becomes "decoration"

#### Cons:
1. **Wrong physics**: Tree not anchored to real coordinates
2. **Boundaries decorative**: No `containsLL`, no commit gating
3. **Fragments scene**: Globe layer vs filament layer (tendency to split)
4. **Not scalable**: Can't add multiple companies at different locations
5. **LOD broken**: Why would sheets hide when "zooming to planet" if tree isn't anchored?

#### Why This Fails:
> "Boundaries make sense" — **NO**: If tree isn't anchored, why do boundaries exist?  
> "Anchoring correctness" — **NO**: Tree floating in space, globe is wallpaper.  
> "Boundary containment functioning" — **NO**: No reason to implement `containsLL`.

---

## 7) What You Must NOT Do ✅ **UNDERSTOOD**

- ❌ Do not create new scenes for globe vs filaments
- ❌ Do not add new primitives or rename canonical ones
- ❌ Do not push/publish
- ❌ Do not "fix" by removing layers

---

## Immediate First Deliverable

### v93 Inventory Map: ✅ **COMPLETE**

See Section 0 above.

### "Globe floor layer restored" = ❌ **NO**

**Reason**: v93 globe is Cesium/React, cannot be "restored" into Three.js prototype without full re-implementation.

**What exists**: Three.js placeholder globe with `SphereGeometry` + wireframe (lines 4088-4131).

**What's missing**: Earth texture, boundary extrusion, vote rendering, weather overlays.

### "Boundaries visible + containsLL works" = ❌ **NO**

**Reason**: 
1. Boundary extrusion not implemented (no GeoJSON → Three.js geometry)
2. `containsLL` not implemented (v93 didn't have this either)
3. GeoJSON fetch fails on `file://` (CORS)

**What's needed**: ~500 lines of boundary rendering + containment code.

### "Weather overlay present" = ❌ **NO**

**Reason**: No weather system in prototype.

**What's needed**: ~150 lines to fetch + apply texture overlay.

### "Vote overlay present" = ❌ **NO**

**Reason**: No vote data, no rendering, no backend API.

**What's needed**: ~200 lines + backend API or static data file.

---

## Recommendation: ✅ **OPTION A (Filaments into Globe)**

### Rationale (Based on Required Criteria):

| Criterion | Option A Score | Option B Score |
|-----------|---------------|---------------|
| **One-scene stability** | 10/10 (same THREE.Scene) | 6/10 (layering fragility) |
| **Anchoring correctness** | 10/10 (real GPS coords) | 2/10 (floating tree) |
| **Boundary containment functioning** | 10/10 (reason to implement) | 0/10 (no reason) |
| **LOD behavior (no thrash)** | 9/10 (altitude-based LOD) | 3/10 (arbitrary fade) |
| **Integration cleanliness** | 9/10 (single world model) | 4/10 (duplicate truth) |
| **TOTAL** | **48/50** | **15/50** |

### One-Paragraph Justification:

**Option A (Filaments into Globe) is the only architecturally sound choice.** The globe must be the spatial foundation because it defines the coordinate system (lat/lon → world XYZ) and the containment hierarchy (planet → country → region → company). Boundaries only make sense if trees are anchored to them; without real anchoring, boundaries become decorative, `containsLL` has no use case, and LOD behavior is arbitrary. Option B (globe as backdrop) creates duplicate truth sources (where is the tree? floating in space or at GPS coords?) and will inevitably re-fragment the scene into "globe view" vs "filament view" because the two layers have no physical relationship. Option A preserves one-scene stability, enables correct boundary containment, and scales to multiple companies at different GPS locations. The implementation cost (~1100 lines) is justified by architectural correctness.

---

## Next Steps (If Option A Approved)

1. **Run local server** to unblock GeoJSON loading (`python -m http.server 8000`)
2. **Implement boundary extrusion** (GeoJSON → Three.js ExtrudeGeometry)
3. **Implement `containsLL`** (ray casting point-in-polygon)
4. **Add Earth texture** to `globeMesh` (8K daymap)
5. **Implement vote rendering** (sprites at lat/lon)
6. **Connect tree anchoring** to commits (TREE_ANCHOR_SET)
7. **Implement LOD system** (altitude-based visibility)
8. **Optional: Weather overlay** (texture from WMS service)

---

**Canon: v93 globe system cannot be "restored" as-is (Cesium ≠ Three.js). Must re-implement core features in Three.js using Option A architecture.**
