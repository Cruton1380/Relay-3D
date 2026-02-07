# Relay Final Architecture Specification
## Earth's Core → Filaments → Branches → Globe → Laniakea

**Date:** 2026-02-02  
**Status:** 🔒 CANONICAL LOCK  
**Authority:** Final implementation instruction for all Relay visualization

---

## 🌍 PRIME INVARIANT (Non-Negotiable)

**"Relay grows from the center of the Earth outward, so responsibility is never lost as scale increases."**

### Core Principle:
```
All geometry, logic, and interaction must grow outward from a single core.
No layer may introduce a hub or shortcut.
If something aggregates, it must do so by bundling along length, not converging into a node.
```

---

## 📐 SYSTEM TOPOLOGY (Outward from Core)

### Layer 0: Earth's Core (Absolute Origin)
```
Position: (0, 0, 0) in 3D space
Purpose: Anchor of truth, time, conservation
Rule: Nothing connects except primary trunk
```

**Implementation:**
- One immutable root node at origin
- All transforms relative to this
- No camera mode may bypass this hierarchy

---

### Layer 1: Trunk → Branches (History & Responsibility)

```
Core → Trunk → Branches → Sub-branches
```

**Rules:**
- Branch = responsibility domain
- Bundling = shared dependence  
- Pressure = resistance along branch (not just color)
- No merges upward without visible bundling

**Visual Reference:** See provided branch images
- Organic, fractal branching
- Natural splits and convergences
- Visible tension in curves
- No straight segments

---

### Layer 2: Internal Filaments (Fractal Micro-Branches)

**CRITICAL: Inside each branch**

```
One filament per cell
Each filament IS a fractal branch:
  - Curved paths (organic)
  - Segmented (temporal)
  - Time-boxed (micro-rings)
```

**Topology (Clarified):**
```
Top endpoints: CellTipAnchor (N individual cell tips)
Bottom endpoints: BranchBundleSpineAnchors (N anchor points on bundle)
Filament: Connects ONE cell tip to ONE bundle anchor (1:1 per cell)
Branch: Owns MANY bundle anchors (1→many fan-out at branch)
```

**Critical Rules:**
- ❌ NO sheet hub between cell tips and filaments!
- ❌ NO convergence into a node
- ✅ Bundling happens along LENGTH, not by converging into a node

**❌ Forbidden:**
- Sheet hubs
- Straight lines
- Instant jumps
- Hub convergence near spreadsheets

---

### Layer 3: Sheets (Surfaces, NOT Aggregators)

**Rule:** Spreadsheets are surfaces at the tips

```
Cells = twig tips
Each cell owns exactly ONE filament
Sheets do NOT aggregate truth
Sheets do NOT merge filaments
```

**Enforcement:**
- Sheet object must NEVER appear as filament endpoint
- Only cell tip anchors are legal endpoints
- 1 cell = 1 filament tip = 1 bundle anchor

---

### Layer 4: Company Trees (Local Gravity Wells)

**Characteristics:**
```
One coherent branching structure
Physically rooted on Earth's surface
Located at real lat/lon coordinates
```

**Example:** Tel Aviv tree at `32.0853°N, 34.7818°E`

**Visual Reference:** See globe visualization images
- Trees emerge FROM globe surface
- Golden/orange root system visible
- Multiple trees distributed geographically
- Boundary shells visible

**Rules:**
- Trees do NOT float
- Trees do NOT orbit
- Trees emerge from the globe
- Preserves: jurisdiction, accountability, geography-based pressure

---

### Layer 5: The Globe (Earth as Spatial Truth)

**Purpose:** NOT decoration, provides:
```
- Coordinate space (lat/lon → 3D)
- Authority boundaries (jurisdiction)
- Pressure sources (law, regulation, region)
```

**Boundary Shells (Nested):**
```
Neighborhood (smallest)
  ↓
City
  ↓
State/District
  ↓
Country (largest)
```

**Rendering:**
- Translucent volumetric fields
- Intersecting trees (not enclosing)
- Tree inside boundary feels different than outside

**Visual Effect:**
A user must visually understand:
> *"This pressure is coming from national regulation, not company behavior."*

---

### Layer 6: Laniakea (Cosmic Context, NOT Control)

**Outermost layer** representing:
```
- Macro-scale forces
- Long-range coupling
- Non-local constraints
```

**Rules:**
- Laniakea NEVER reaches inward
- Exerts influence ONLY as:
  - Gradients
  - Background pressure
  - Contextual pull
- NO direct references from company/sheet level

---

## 🎯 LOD + CULLING (Performance Architecture)

### Zoom Level Table

| Zoom Level | Visible Elements | Hidden Elements |
|------------|------------------|-----------------|
| **Laniakea** | Supercluster filaments | Globe detail, trees, cells |
| **Planetary** | Globe + major trunks | Branches, filaments, cells |
| **Regional** | Country/state boundaries + trees | Internal filaments, cells |
| **Company** | Branches + bundles | Micro-timeboxes, cell detail |
| **Sheet** | Cells + filaments | Micro-timeboxes |
| **Cell** | Micro-timeboxes + curvature | Laniakea, globe detail |

### Enforcement Rules:

1. **Never render two adjacent scales fully at once**
2. **Fade, collapse, or proxy lower levels**
3. **Geometry complexity ∝ screen relevance**
4. **If performance drops → detail is wrong, not hardware**

### LOD Scaffolding (Minimum Implementation):

```javascript
const LODLevel = {
    LANIAKEA: 6,    // Farthest zoom (supercluster scale)
    GLOBE: 5,       // Planetary scale
    REGION: 4,      // Country/state scale
    COMPANY: 3,     // Company tree scale
    SHEET: 2,       // Spreadsheet scale
    CELL: 1         // Closest zoom (cell detail)
};

// NOTE: Higher enum number = farther zoom level
// This prevents "inverted LOD" implementation bugs

function applyLOD(cameraDistance) {
    // Swap heavy meshes to proxies
    // Hide micro-filaments beyond threshold
    // Hide cell cubes beyond threshold
    // Adjust material LOD (simpler shaders far away)
}
```

---

## 🚨 LAST-MILE CRITICAL FIXES (Before Globe Integration)

### Fix 1: Depth Write on Translucent Materials ⚠️

**Current Problem:**
```javascript
// Branch material (Line ~4299)
depthWrite: true  // ← Can hide internal filaments!
```

**Correct Pattern:**
```javascript
// Branch (translucent shell)
{
    depthWrite: false,
    depthTest: true,
    renderOrder: 100  // Draw early
}

// Internal filaments
{
    depthWrite: false,
    depthTest: true,
    renderOrder: 200  // Draw after branch
}
```

**Acceptance Test:** Rotate camera → filaments never disappear behind branch

---

### Fix 2: Blending Mode for Glow ⚠️

**Current:**
```javascript
blending: THREE.NormalBlending  // May flatten luminescence
```

**Better:**
```javascript
// Branch: Normal (fine)
// Filaments: Additive (for glow against dark + branch)
blending: THREE.AdditiveBlending
opacity: 0.65  // Keep moderate (not 0.85 with additive)
```

**Acceptance Test:** Filaments glow against background AND branch interior

---

### Fix 3: Micro-Timebox Alignment ⚠️

**Current:** Rings positioned arbitrarily along filament

**Required:** Rings must align to PARENT branch timeboxes

```javascript
// Get parent branch's timebox positions
const branchTimeboxes = parentNode.pressureRings;

// Place micro-rings at matching Y positions
branchTimeboxes.forEach((timebox, idx) => {
    const branchY = parentObj.position.y + (idx * timeboxSpacing);
    
    // Find curve parameter where Y is closest to branchY
    // (Three.js curves don't have getPointAtY, so we sample)
    const sampleCount = 50;
    let closestT = 0;
    let closestDist = Infinity;
    
    for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        const point = curve.getPoint(t);
        const dist = Math.abs(point.y - branchY);
        if (dist < closestDist) {
            closestDist = dist;
            closestT = t;
        }
    }
    
    const microRingPos = curve.getPoint(closestT);
    // ... create ring at microRingPos
});
```

**Acceptance Test:** Pause on Timebox T7 → multiple filaments show rings at same height band

---

### Fix 4: Topology Lint Checks (Auto-Fail Hub Regression) 🔒

**Add after graph build:**

```javascript
function relayLintTopology(state) {
    const errors = [];
    
    // Check 1: Unique top anchors
    const topAnchors = new Set();
    state.filaments.forEach(f => {
        if (topAnchors.has(f.topAnchorId)) {
            errors.push(`FAIL: Shared top anchor ${f.topAnchorId}`);
        }
        topAnchors.add(f.topAnchorId);
    });
    
    // Check 2: Sheet object never an endpoint
    state.filaments.forEach(f => {
        if (f.topAnchorId.includes('sheet.') && !f.topAnchorId.includes('.cell')) {
            errors.push(`FAIL: Filament ${f.id} connects to sheet object, not cell`);
        }
    });
    
    // Check 3: 1 cell = 1 filament
    state.sheets.forEach(sheet => {
        const cellCount = sheet.populatedCells.length;
        const filamentCount = state.filaments.filter(f => f.sheetId === sheet.id).length;
        if (cellCount !== filamentCount) {
            errors.push(`FAIL: Sheet ${sheet.id} has ${cellCount} cells but ${filamentCount} filaments`);
        }
    });
    
    // Check 4: No hub clustering near sheets
    state.sheets.forEach(sheet => {
        const sheetFilaments = state.filaments.filter(f => f.sheetId === sheet.id);
        const topPositions = sheetFilaments.map(f => f.topAnchorPosition);
        const avgPos = average(topPositions);
        const maxDist = Math.max(...topPositions.map(p => distance(p, avgPos)));
        if (maxDist < 0.1) {  // All tops within 0.1 units = hub!
            errors.push(`FAIL: Sheet ${sheet.id} has hub-like clustering (maxDist: ${maxDist})`);
        }
    });
    
    if (errors.length > 0) {
        console.error('🚨 TOPOLOGY LINT FAILED:');
        errors.forEach(e => console.error(e));
        return false;
    }
    
    console.log('✅ Topology lint passed');
    return true;
}
```

**Acceptance Test:** Lint fails immediately if hub sneaks back during refactor

---

#### Lint Triggers (Mandatory)

**Topology lint MUST run on ALL of these events:**

```javascript
// 1. After file import
async function importSpreadsheet(file) {
    // ... import logic ...
    const lintPass = relayLintTopology(state);
    if (!lintPass) {
        console.error('Import rejected: topology invalid');
        return { success: false, reason: 'topology_lint_failed' };
    }
}

// 2. After any graph rebuild
function rebuildDependencyGraph() {
    // ... rebuild logic ...
    const lintPass = relayLintTopology(state);
    if (!lintPass) {
        console.error('Graph rebuild produced invalid topology');
        state.pressureState = 'INDETERMINATE';
    }
}

// 3. After view switch
function switchView(viewName) {
    // ... view switch logic ...
    
    // Verify no accidental geometry rebuild
    const lintPass = relayLintTopology(state);
    if (!lintPass) {
        console.error(`View switch to ${viewName} broke topology`);
        rollbackView();
    }
}

// 4. After LOD level change
function onLODChange(newLevel) {
    // ... swap meshes/proxies ...
    
    // Verify proxies didn't introduce hubs
    const lintPass = relayLintTopology(state);
    if (!lintPass) {
        console.error(`LOD change to ${newLevel} broke topology`);
        revertLOD();
    }
}

// 5. After globe/boundary load from Git
async function loadBoundariesFromGit(commits) {
    // ... load boundaries ...
    
    // Verify boundary membership didn't break tree anchoring
    const lintPass = relayLintTopology(state);
    if (!lintPass) {
        console.error('Boundary load broke tree topology');
        return { success: false };
    }
}
```

**Rule:** If lint fails, the operation that triggered it must:
1. Log the specific failure
2. Either rollback or enter DEGRADED/INDETERMINATE state
3. NEVER silently proceed with invalid topology

---

### Fix 5: One-Scene Rule (Enforce Now) 🔒

**Current:** Views rebuild geometry

**Required:** Views ONLY toggle visibility + camera

```javascript
function switchView(viewName) {
    // ❌ FORBIDDEN:
    // scene.clear();
    // rebuildGeometry();
    
    // ✅ ALLOWED:
    switch(viewName) {
        case 'GRID':
            scene.traverse(obj => {
                if (obj.userData.layer === 'grid') obj.visible = true;
                if (obj.userData.layer === 'tree') obj.visible = false;
            });
            camera.position.set(0, 10, 0);
            camera.lookAt(0, 0, 0);
            break;
            
        case 'TREE':
            scene.traverse(obj => {
                if (obj.userData.layer === 'tree') obj.visible = true;
                if (obj.userData.layer === 'grid') obj.visible = false;
            });
            camera.position.set(0, 0, 20);
            camera.lookAt(0, 0, 0);
            break;
    }
}
```

**Acceptance Test:** Switching Grid→TreeScaffold does NOT change mesh IDs / graph IDs

---

### Fix 6: Commit Materiality Gates (Visual Distinction) 🔒

**States:**
```
DRAFT    → Local, reversible (dashed, ghosted)
HOLD     → Frozen, awaiting review (amber glow)
PROPOSE  → Shared proposal (blue outline)
COMMIT   → Accepted into Canon (solid, bright)
REVERT   → Visible rollback (red scar, geometry break)
```

**Visual Rules:**

```javascript
function getCommitMaterial(commitState) {
    switch(commitState) {
        case 'DRAFT':
            return new THREE.LineDashedMaterial({
                color: 0x888888,
                dashSize: 0.1,
                gapSize: 0.05,
                opacity: 0.5
            });
        
        case 'HOLD':
            return new THREE.MeshStandardMaterial({
                color: 0xFFAA00,
                emissive: 0xFFAA00,
                emissiveIntensity: 0.4,
                opacity: 0.7
            });
        
        case 'COMMIT':
            return new THREE.MeshStandardMaterial({
                color: 0x00DDFF,
                emissive: 0x0099CC,
                emissiveIntensity: 0.8,
                opacity: 1.0
            });
        
        case 'REVERT':
            return new THREE.MeshStandardMaterial({
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 0.9,
                roughness: 0.9  // Jagged, burnt
            });
    }
}
```

**REVERT must create geometry discontinuity:**
```javascript
// At revert point, insert jagged break
const scar = new THREE.OctahedronGeometry(0.2, 0);  // Jagged
const scarMesh = new THREE.Mesh(scar, revertMaterial);
scarMesh.position.copy(revertPosition);
scarMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
);
scene.add(scarMesh);

// Add fracture line
const fractureLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
        revertPosition,
        revertPosition.clone().add(new THREE.Vector3(0, -1.5, 0))
    ]),
    new THREE.LineBasicMaterial({ color: 0x880000, linewidth: 2 })
);
scene.add(fractureLine);
```

**Acceptance Test:** COMMIT boundaries visually distinct; REVERT creates visible scar (not silent undo)

---

## 🧪 FINAL VALIDATION TEST (Before Globe)

### Test Spreadsheet Requirements:
```
20-40 populated cells
6-10 formulas
At least 2 shared inputs (referenced by multiple formulas)
```

### Must Verify:

✅ **1. Cell→Filament Mapping (1:1)**
```javascript
assert(cellCount === filamentCount);
assert(new Set(filaments.map(f => f.topAnchorId)).size === filamentCount);
```

✅ **2. Shared Inputs Thicken (Bundling)**
```javascript
const sharedInputCells = findSharedInputs(formulas);
sharedInputCells.forEach(cellRef => {
    const filament = filaments.find(f => f.cellRef === cellRef);
    assert(filament.thickness > baseThickness * 1.5);  // At least 50% thicker
});
```

✅ **3. Micro-Timeboxes Align Across Filaments**
```javascript
const filamentRingsAtY = {};
filaments.forEach(f => {
    f.microTimeboxes.forEach(ring => {
        const y = Math.round(ring.position.y * 10) / 10;  // Bucket by Y
        if (!filamentRingsAtY[y]) filamentRingsAtY[y] = 0;
        filamentRingsAtY[y]++;
    });
});

// Should see clustering at same Y levels (aligned to parent timeboxes)
const alignedLevels = Object.values(filamentRingsAtY).filter(count => count > 1);
assert(alignedLevels.length >= 3);  // At least 3 aligned timebox levels
```

✅ **4. No Hub Node Near Sheet**
```javascript
const topPositions = filaments.map(f => f.topAnchorPosition);
const centroid = average(topPositions);
const maxDistFromCentroid = Math.max(...topPositions.map(p => distance(p, centroid)));
assert(maxDistFromCentroid > 1.0);  // Spread out, not hub
```

✅ **5. Filaments Visible from All Angles**
```javascript
// Rotate camera 360° and verify no popping
for (let angle = 0; angle < 360; angle += 45) {
    camera.position.set(
        Math.cos(angle * Math.PI / 180) * 20,
        0,
        Math.sin(angle * Math.PI / 180) * 20
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    
    const visibleFilaments = countVisibleMeshes(scene, 'internalFilament');
    assert(visibleFilaments >= filamentCount * 0.9);  // 90% always visible
}
```

---

## 📋 PHASED IMPLEMENTATION PLAN

### 🔧 Phase 1: Fix Current Tree (IMMEDIATE)
**Duration:** 2-3 days

- [ ] Fix depthWrite for translucent materials
- [ ] Adjust blending mode for glow
- [ ] Align micro-timeboxes to parent timeboxes
- [ ] Implement topology lint checks
- [ ] Enforce one-scene rule (views = visibility toggle)
- [ ] Add commit materiality visual states
- [ ] Run final validation test with real spreadsheet

**Deliverable:** Tree Scaffold fully canonical (passes all lint + validation tests)

---

### 🌍 Phase 2: Globe Restoration (CRITICAL)
**Duration:** 5-7 days

---

#### 2.0: v93 Globe Restoration Contract (PRECONDITIONS)

**🔒 MANDATORY: Before any Globe restoration work begins**

##### Contract 1: Globe as Primary World Root (NOT Separate Scene)

```
Truth Root: EarthCoreRoot (0,0,0) remains canonical origin
World Root: GlobeRoot is CHILD of core (or sibling with deterministic transform)
```

**Rules:**
- ❌ NO "globe scene" vs "tree scene" separation
- ✅ ONE scene graph containing both
- ✅ Globe view = camera change + LOD + visibility toggle
- ❌ NO mesh rebuilding when switching to Globe view

**Acceptance Test:**
```javascript
// Switching to Globe view must NOT:
// - Clear scene
// - Rebuild geometries
// - Change mesh IDs
// - Re-root scene graph

switchView('GLOBE');
assert(scene.children.length === previousChildCount);  // Same objects
assert(treeRootMesh.uuid === previousTreeRootUuid);    // Same instances
```

**🔒 LOCK 6: Technical Enforcement of One Graph, Many Lenses**

```javascript
// Store immutable graph identifiers at init
let sceneRootUUID = null;
let graphBuildId = null;

function initScene() {
    scene = new THREE.Scene();
    sceneRootUUID = scene.uuid;  // Lock scene identity
    graphBuildId = generateUUID();  // Lock graph identity
    
    console.log('[Relay] 🔒 Scene locked:', sceneRootUUID);
    console.log('[Relay] 🔒 Graph locked:', graphBuildId);
}

function switchView(viewName) {
    // ✅ ALLOWED: Visibility toggles, camera presets
    // ❌ FORBIDDEN: scene.clear(), new THREE.Scene(), graphRebuild()
    
    // VERIFY graph integrity
    if (scene.uuid !== sceneRootUUID) {
        throw new Error('🚨 VIOLATION: Scene was replaced! One graph rule broken.');
    }
    
    // Update visibility based on view layers
    scene.traverse(obj => {
        if (obj.userData.layers) {
            obj.visible = obj.userData.layers.includes(viewName);
        }
    });
    
    // Update camera preset
    applyCameraPreset(viewName);
    
    // Run topology lint (guardrail)
    if (!relayLintTopology(state)) {
        console.error('🚨 VIOLATION: View switch broke topology!');
    }
    
    console.log('[Relay] ✅ View:', viewName, '| graphBuildId:', graphBuildId, '(unchanged)');
}

// ENFORCEMENT TEST
const idBefore = graphBuildId;
const uuidBefore = scene.uuid;
switchView('GRID');
switchView('TREE');
switchView('GLOBE');
assert(graphBuildId === idBefore);     // Must remain constant
assert(scene.uuid === uuidBefore);     // Must remain constant
```

---

##### Contract 2: Boundary System from Git Storage (NOT Hardcoded)

**Restore v93 boundary modules but make them data-driven from Git commits.**

**Required Boundary Levels:**
```
Neighborhood (admin3)
  ↓
City (admin2)
  ↓
State/Region (admin1)
  ↓
Country (admin0)
```

**Git Commit Types Required:**
```javascript
// 1. Define boundary geometry + metadata
// 🔒 LOCK: Geometry is EITHER inline OR content-hash reference (no duplicate truth)
{
    type: 'BOUNDARY_DEFINE',
    schemaVersion: 'relay-visual-v1',
    boundaryId: 'boundary.country.israel',
    parentBoundaryId: null,  // Top-level
    
    // OPTION A: Inline geometry (preferred for small boundaries)
    geometry: { 
        type: 'MultiPolygon',
        coordinates: [[[...]]]  // GeoJSON inline
    },
    
    // OPTION B: Content-hash reference (for large boundaries)
    // geometryRef: {
    //     contentHash: 'sha256:abc123...',
    //     path: 'boundaries/israel.geojson',
    //     size: 124567
    // },
    
    metadata: {
        name: 'Israel',
        admin_level: 0,
        jurisdiction: 'national',
        regulatory_authority: 'israeli_law'
    }
}

// 🔒 ENFORCEMENT: Renderer must refuse boundaries not reachable from commits
// If geometryRef is used, file MUST be addressable by contentHash
// Acceptance: Removing the commit removes the boundary, even if GeoJSON file exists

// 2. Anchor company tree to location
{
    type: 'TREE_ANCHOR_SET',
    companyId: 'company.nw',
    lat: 32.0853,
    lon: 34.7818,
    altitude: 0,
    authorityRef: 'boundary.city.telaviv'
}

// 3. Define boundary membership
{
    type: 'BOUNDARY_MEMBERSHIP_SET',
    companyId: 'company.nw',
    boundaryIds: [
        'boundary.country.israel',
        'boundary.state.telaviv_district',
        'boundary.city.telaviv',
        'boundary.neighborhood.business_district'
    ]
}
```

**Rendering Requirements:**
- Boundaries = translucent volumetric shells/fields
- Boundaries have stable IDs and parent links
- Boundaries provide pressure/context overlay (NOT authority override)
- Boundaries persist across view switches

**Acceptance Test:**
```javascript
const tlvTree = getCompanyTree('company.nw');
const boundaries = getBoundariesForTree(tlvTree.id);

assert(boundaries.includes('boundary.country.israel'));
assert(boundaries.includes('boundary.city.telaviv'));

// Tree must be INSIDE boundary volumes (geospatially)
const treeLat = tlvTree.location.lat;
const treeLon = tlvTree.location.lon;
const israelBoundary = getBoundary('boundary.country.israel');

// 🔒 REQUIRED METHOD IMPLEMENTATION: boundary.containsLL(lat, lon)
// Uses point-in-polygon on GeoJSON (2D lat/lon space) - IMPLEMENTABLE

function pointInPolygon(point, polygon) {
    // Ray casting algorithm
    const [lon, lat] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Add to boundary object
israelBoundary.containsLL = function(lat, lon) {
    // Check all polygons in MultiPolygon
    const coords = this.geojson.geometry.coordinates;
    for (let polygon of coords) {
        // polygon[0] is outer ring, [1]+ are holes
        if (pointInPolygon([lon, lat], polygon[0])) {
            // Check if point is in a hole
            let inHole = false;
            for (let h = 1; h < polygon.length; h++) {
                if (pointInPolygon([lon, lat], polygon[h])) {
                    inHole = true;
                    break;
                }
            }
            if (!inHole) return true;
        }
    }
    return false;
};

// ACCEPTANCE TEST (with real coordinates)
assert(israelBoundary.containsLL(32.0853, 34.7818) === true);  // Tel Aviv (inside Israel)
assert(israelBoundary.containsLL(33.0, 44.0) === false);       // Iraq (outside Israel)
```

---

##### Contract 3: Geospatial Tree Anchoring (Real Lat/Lon)

**Each CompanyTree MUST have:**

```javascript
{
    companyId: 'company.nw',
    location: {
        lat: 32.0853,        // Latitude (degrees)
        lon: 34.7818,        // Longitude (degrees)
        altitude: 0,         // Meters above sea level
        coordinateSystem: 'WGS84'
    },
    localTangentFrame: {
        // ENU (East-North-Up) frame for correct surface orientation
        up: Vector3,         // Normal to Earth surface at this lat/lon
        north: Vector3,      // Tangent pointing north
        east: Vector3        // Tangent pointing east
    }
}
```

**Coordinate Conversion Function:**
```javascript
// Required: ECEF (Earth-Centered Earth-Fixed) or equivalent
function latLonToVector3(lat, lon, radius = 100, altitude = 0) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const r = radius + altitude;
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
}

// Required: Surface normal alignment (CORRECT TANGENT FRAME)
function getLocalTangentFrame(lat, lon) {
    const globeCenter = new THREE.Vector3(0, 0, 0);
    const surfacePos = latLonToVector3(lat, lon, 100, 0);
    
    // Up: radial direction from Earth center
    const up = surfacePos.clone().sub(globeCenter).normalize();
    
    // East: perpendicular to up and world-up (handle poles)
    const worldUp = new THREE.Vector3(0, 1, 0);
    let east = new THREE.Vector3().crossVectors(worldUp, up);
    
    // Handle pole edge cases (where up ≈ worldUp)
    if (east.lengthSq() < 0.001) {
        // At poles, use arbitrary east (e.g., along X)
        east = new THREE.Vector3(1, 0, 0);
    } else {
        east.normalize();
    }
    
    // North: perpendicular to up and east (completes right-handed frame)
    const north = new THREE.Vector3().crossVectors(up, east).normalize();
    
    return { up, north, east };
}

// CRITICAL: This ensures trees "stand" correctly at any lat/lon without rolling
```

**Acceptance Test:**
```javascript
const tlvTree = getCompanyTree('company.nw');
const surfaceNormal = tlvTree.localTangentFrame.up;

// Tree must "stand" on globe (not float)
const treeUp = tlvTree.up;
const alignment = surfaceNormal.dot(treeUp);
assert(alignment > 0.95);  // Nearly aligned (within 18°)

// Tree must be at correct geographic position
const expectedPos = latLonToVector3(32.0853, 34.7818, 100, 0);
const actualPos = tlvTree.position;
assert(expectedPos.distanceTo(actualPos) < 0.5);  // Within 0.5 units
```

---

##### Contract 4: Boundary Geometry Model (NOT Spheres)

**Current placeholder (acceptable for initial prototype):**
```javascript
// Simple radial shells
createBoundary('Israel', telAvivPos, radius=10, color, opacity);
```

**Required for v93 restoration:**
```javascript
// Real geofences as polygon/multipolygon
{
    boundaryId: 'boundary.country.israel',
    geometry: {
        type: 'MultiPolygon',
        coordinates: [
            [  // Outer boundary
                [[34.2, 29.5], [34.3, 29.5], ...],  // [lon, lat] pairs
            ],
            [  // Optional: Exclusion zones
                [[34.9, 31.7], [35.0, 31.7], ...]
            ]
        ]
    }
}
```

**Rendering Methods (Priority Order):**

1. **Extruded Curtain / Volumetric Prism** (Preferred)
   ```javascript
   // 🔒 CRITICAL: Extrude in LOCAL tangent frame, not world Y
   // Otherwise boundaries lean incorrectly on curved globe
   
   function createBoundaryMesh(geojson, extrudeHeight = 20) {
       // 1. Get boundary centroid lat/lon
       const centroid = calculateCentroid(geojson.geometry.coordinates);
       const centroidPos = latLonToVector3(centroid.lat, centroid.lon, 100, 0);
       const frame = getLocalTangentFrame(centroid.lat, centroid.lon);
       
       // 2. Convert GeoJSON coordinates to local tangent plane
       const localPoints = geojson.geometry.coordinates[0].map(coord => {
           const [lon, lat] = coord;
           const worldPos = latLonToVector3(lat, lon, 100, 0);
           
           // Project onto local tangent plane
           const relative = worldPos.clone().sub(centroidPos);
           const localX = relative.dot(frame.east);
           const localY = relative.dot(frame.north);
           
           return new THREE.Vector2(localX, localY);
       });
       
       // 3. Create shape in local 2D space
       const shape = new THREE.Shape(localPoints);
       
       // 4. Extrude in local "up" direction
       const extrudeSettings = {
           depth: extrudeHeight,  // Along local "up"
           bevelEnabled: false
       };
       const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
       
       // 5. Transform geometry to world space using tangent frame
       const mesh = new THREE.Mesh(geometry);
       mesh.position.copy(centroidPos);
       
       // Align mesh to tangent frame
       mesh.up.copy(frame.up);
       mesh.lookAt(centroidPos.clone().add(frame.north));
       
       const material = new THREE.MeshStandardMaterial({
           color: boundaryColor,
           transparent: true,
           opacity: 0.15,
           side: THREE.BackSide  // Visible from inside
       });
       mesh.material = material;
       
       return mesh;
   }
   
   // ACCEPTANCE: Boundary walls rise perpendicular to surface everywhere
   ```

2. **Triangulated Surface Mesh** (Alternative)
   ```javascript
   // Convert polygon to mesh using earcut or similar
   const vertices = triangulate(boundaryPolygon);
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
   ```

**LOD Simplification Required:**
```
admin0 (country): Full detail
admin1 (state):   Medium detail (50% vertices)
admin2 (city):    Low detail (25% vertices)
admin3 (neighborhood): Bounding box only
```

**Acceptance Test:**
```javascript
const israelBoundary = scene.getObjectByName('boundary.country.israel');

// Must look like Israel, not a sphere
assert(israelBoundary.geometry.type !== 'SphereGeometry');
assert(israelBoundary.geometry.attributes.position.count > 100);  // Complex shape

// Must have proper topology
const bbox = israelBoundary.geometry.boundingBox;
assert(bbox.max.x - bbox.min.x > 2);  // Reasonable size
assert(bbox.max.z - bbox.min.z > 3);  // North-south extent
```

---

##### Contract 5: Single LOD Governor (Global Policy)

**🔒 CRITICAL: No module may independently decide visibility**

```javascript
// LOD Governor - Single Source of Truth
class LODGovernor {
    constructor(camera) {
        this.camera = camera;
        this.currentLevel = null;
        this.subscribers = [];
    }
    
    // Called every frame
    update() {
        const newLevel = this.calculateLevel(this.camera);
        if (newLevel !== this.currentLevel) {
            this.currentLevel = newLevel;
            this.notifySubscribers(newLevel);
        }
    }
    
    // 🔒 LOCK: Use altitude/scale, not just camera.position.length()
    // Prevents LOD thrash when orbiting at constant altitude
    calculateLevel(camera) {
        const globeRadius = 100;
        const distFromOrigin = camera.position.length();
        
        // Altitude above globe surface (not distance from core)
        const altitude = distFromOrigin - globeRadius;
        
        // Optional: Screen-space size check for hybrid LOD
        // const screenSize = calculateScreenSpaceSize(object, camera);
        
        if (altitude > 400) return 'LANIAKEA';   // Far from Earth
        if (altitude > 100) return 'PLANETARY';  // View full Earth
        if (altitude > 50) return 'REGIONAL';    // View country/region
        if (altitude > 15) return 'COMPANY';     // View city/company
        if (altitude > 5) return 'SHEET';        // View branch detail
        return 'CELL';                           // View cell detail
    }
    
    // ACCEPTANCE: LOD doesn't thrash when orbiting at constant altitude
    
    subscribe(module) {
        this.subscribers.push(module);
    }
    
    notifySubscribers(level) {
        this.subscribers.forEach(mod => mod.onLODChange(level));
    }
}

// All modules subscribe and obey
const lodGov = new LODGovernor(camera);

// Branch renderer subscribes
lodGov.subscribe({
    onLODChange(level) {
        if (level === 'PLANETARY' || level === 'LANIAKEA') {
            // Hide all internal filaments
            internalFilaments.forEach(f => f.visible = false);
        } else if (level === 'COMPANY') {
            // Show branches, hide micro-timeboxes
            branches.forEach(b => b.visible = true);
            microTimeboxes.forEach(t => t.visible = false);
        }
        // ... etc
    }
});

// Boundary renderer subscribes
lodGov.subscribe({
    onLODChange(level) {
        if (level === 'CELL' || level === 'SHEET') {
            // Hide boundaries at micro scale
            boundaries.forEach(b => b.visible = false);
        } else if (level === 'REGIONAL') {
            // Show only city/state boundaries
            boundaries.forEach(b => {
                b.visible = (b.userData.admin_level <= 2);
            });
        }
        // ... etc
    }
});
```

**Mandatory Culling Systems:**

1. **Frustum Culling** (Three.js automatic)
   ```javascript
   // Already handled by Three.js, but verify:
   mesh.frustumCulled = true;  // Default
   ```

2. **Globe Occlusion Culling** (Custom)
   ```javascript
   // Hide objects behind Earth (on far side from camera)
   function updateGlobeOcclusion(camera) {
       const globeCenter = new THREE.Vector3(0, 0, 0);
       const globeRadius = 100;
       
       scene.traverse(obj => {
           if (obj.userData.cullingEnabled && obj.userData.isOnGlobe) {
               const toCameraDir = camera.position.clone().sub(globeCenter).normalize();
               const toObjectDir = obj.position.clone().sub(globeCenter).normalize();
               
               // Compute angle between camera direction and object direction
               const dotProduct = toCameraDir.dot(toObjectDir);
               const angle = Math.acos(THREE.MathUtils.clamp(dotProduct, -1, 1));
               
               // If angle > 90° + margin, object is on far side
               const marginRadians = Math.PI / 12;  // 15° margin
               if (angle > (Math.PI / 2) + marginRadians) {
                   obj.visible = false;
               } else {
                   obj.visible = true;  // Re-show when rotated back into view
               }
           }
       });
   }
   ```

3. **Distance-Based Filament Suppression**
   ```javascript
   function updateFilamentLOD(camera) {
       const camDist = camera.position.length();
       
       internalFilaments.forEach(filament => {
           const filamentDist = filament.position.distanceTo(camera.position);
           
           if (camDist > 50 || filamentDist > 30) {
               filament.visible = false;  // Too far
           } else if (camDist > 20) {
               // Use low-poly proxy
               filament.geometry = filamentProxyGeometry;
           } else {
               // Full detail
               filament.geometry = filamentFullGeometry;
               filament.visible = true;
           }
       });
   }
   ```

**Acceptance Test:**
```javascript
// Zoom out from Cell → Globe
camera.position.set(0, 0, 10);   // Cell level
lodGov.update();
assert(lodGov.currentLevel === 'CELL');
assert(countVisibleMicroTimeboxes() > 0);

camera.position.set(0, 0, 150);  // Planetary level
lodGov.update();
assert(lodGov.currentLevel === 'PLANETARY');
assert(countVisibleMicroTimeboxes() === 0);  // Hidden at this scale
assert(countVisibleBranches() > 0);          // Trunks still visible

// FPS must remain stable
assert(getFPS() >= 30);  // Minimum acceptable
```

---

##### Contract 6: Boundaries as Pressure/Context Sources (NOT Commands)

**Boundaries provide influence, not control.**

```javascript
// Boundary influences:
{
    boundaryId: 'boundary.country.israel',
    influences: {
        pressureModifier: 1.2,        // Increases resistance by 20%
        heatMapColor: 0xFF6600,       // Orange regulatory pressure
        jurisdictionLabel: 'Israeli Law',
        defaultFilters: {
            local: 0.8,               // Weight local data higher
            foreign: 0.2              // Weight foreign data lower
        }
    }
}
```

**What Boundaries CAN Do:**
✅ Change visual pressure overlays (heat, resistance)  
✅ Adjust default filters (local vs foreign weighting)  
✅ Display jurisdiction labels  
✅ Influence camera resistance near borders  

**What Boundaries CANNOT Do:**
❌ Override commit data  
❌ Block commits from being created  
❌ Change commit materiality states  
❌ Edit historical data  

**Acceptance Test:**
```javascript
const israelBoundary = getBoundary('boundary.country.israel');
const tlvTree = getCompanyTree('company.nw');

// Boundary should influence pressure visualization
const basePressure = calculatePressure(tlvTree);
const boundaryPressure = israelBoundary.influences.pressureModifier;
const displayPressure = basePressure * boundaryPressure;

// But boundary must NOT change actual commit data
const commits = getCommitsForTree(tlvTree.id);
commits.forEach(commit => {
    assert(commit.data === originalData);  // Unchanged
    assert(commit.timestamp === originalTimestamp);  // Unchanged
});

// Boundary only changes HOW it reads, not WHAT is true
```

---

##### Contract 7: Git Commit Schema Versioning (RECOMMENDED)

**Purpose:** Prevent silent breaks when commit structure evolves

**All Git commits MUST include schema version header:**

```javascript
{
    schemaVersion: "relay-visual-v1",  // Required field
    type: 'BOUNDARY_DEFINE',
    // ... rest of commit data
}
```

**Version Registry:**
```javascript
const SCHEMA_VERSIONS = {
    'relay-visual-v1': {
        commitTypes: [
            'FILE_IMPORT',
            'CELL_SET',
            'CELL_FORMULA_SET',
            'ASSUMPTION',
            'REFUSAL',
            'FORK_CREATE',
            'BOUNDARY_DEFINE',
            'TREE_ANCHOR_SET',
            'BOUNDARY_MEMBERSHIP_SET'
        ],
        requiredFields: {
            'BOUNDARY_DEFINE': ['boundaryId', 'geometry', 'metadata'],
            'TREE_ANCHOR_SET': ['companyId', 'lat', 'lon', 'altitude'],
            'BOUNDARY_MEMBERSHIP_SET': ['companyId', 'boundaryIds']
        }
    }
};
```

**Renderer Behavior:**

```javascript
function processCommit(commit) {
    const schema = commit.schemaVersion;
    
    // Unknown schema = REFUSE
    if (!SCHEMA_VERSIONS[schema]) {
        console.error(`Unknown schema version: ${schema}`);
        return {
            accepted: false,
            reason: 'unknown_schema_version',
            state: 'INDETERMINATE'
        };
    }
    
    // Known schema but unsupported commit type = WARN + SKIP
    const knownTypes = SCHEMA_VERSIONS[schema].commitTypes;
    if (!knownTypes.includes(commit.type)) {
        console.warn(`Unsupported commit type '${commit.type}' in ${schema}`);
        return {
            accepted: false,
            reason: 'unsupported_commit_type',
            state: 'DEGRADED'
        };
    }
    
    // Validate required fields
    const required = SCHEMA_VERSIONS[schema].requiredFields[commit.type];
    if (required) {
        const missing = required.filter(field => !commit[field]);
        if (missing.length > 0) {
            console.error(`Missing fields in ${commit.type}: ${missing.join(', ')}`);
            return {
                accepted: false,
                reason: 'missing_required_fields',
                state: 'INDETERMINATE'
            };
        }
    }
    
    // Process commit
    return processCommitData(commit);
}
```

**Migration Strategy:**

When introducing `relay-visual-v2`:
```javascript
// Old commits still work
if (commit.schemaVersion === 'relay-visual-v1') {
    // Apply migration transformations
    const upgraded = migrateV1toV2(commit);
    return processV2Commit(upgraded);
}

// New commits use new schema
if (commit.schemaVersion === 'relay-visual-v2') {
    return processV2Commit(commit);
}
```

**Acceptance Test:**
```javascript
// Commit with unknown schema must be refused
const futureCommit = {
    schemaVersion: 'relay-visual-v99',
    type: 'QUANTUM_WORMHOLE_CREATE',
    // ... future data
};

const result = processCommit(futureCommit);
assert(result.accepted === false);
assert(result.reason === 'unknown_schema_version');
assert(state.pressureState === 'INDETERMINATE');

// Commit with missing required fields must be refused
const invalidCommit = {
    schemaVersion: 'relay-visual-v1',
    type: 'BOUNDARY_DEFINE',
    boundaryId: 'boundary.test'
    // Missing: geometry, metadata
};

const result2 = processCommit(invalidCommit);
assert(result2.accepted === false);
assert(result2.reason === 'missing_required_fields');
```

**Why This Matters:**

✅ **Prevents silent data corruption** when schema evolves  
✅ **Enables graceful degradation** (old renderers skip new commits)  
✅ **Documents commit structure** (schema versions are versioned specs)  
✅ **Supports migration** (v1 → v2 transformations)  
✅ **Makes "indeterminate" explicit** (unknown = refuse, not guess)  

---

**✅ All 7 contracts must be validated before Phase 2.1 implementation begins.**

---

#### 2.1: Globe Mesh & Coordinates
- [ ] Restore Globe sphere from Relay v93
- [ ] Implement `latLonToVector3(lat, lon, radius, altitude)` conversion
- [ ] Place test marker at Tel Aviv coordinates
- [ ] Verify Earth scale feels correct

#### 2.2: Anchor Company Tree
- [ ] Set tree root position to Tel Aviv lat/lon
- [ ] Orient tree "up" from surface (`lookAt(0,0,0)`)
- [ ] Verify tree emerges FROM globe (not floating)
- [ ] Test camera orbit around globe with tree visible

#### 2.3: Boundary Shells
- [ ] Implement nested translucent shells:
  - Country (Israel) - radius 10
  - City (Tel Aviv) - radius 5
  - Neighborhood - radius 2
- [ ] Set shell materials (`BackSide`, low opacity)
- [ ] Verify tree sits INSIDE boundaries
- [ ] Test pressure attribution (boundary vs tree internal)

**Deliverable:** 
- ✅ Company tree rooted on Globe at real lat/lon (Tel Aviv: 32.0853°N, 34.7818°E)
- ✅ Tree properly oriented to surface (using local tangent frame)
- ✅ Boundaries rendered as volumetric shells (extruded polygons, not spheres)
- ✅ Boundaries loaded from Git commits (BOUNDARY_DEFINE, TREE_ANCHOR_SET, BOUNDARY_MEMBERSHIP_SET)
- ✅ Single LOD governor active and subscribed by all modules
- ✅ All 7 v93 Restoration Contracts validated and passing

---

### 📐 Phase 3: LOD System (PERFORMANCE)
**Duration:** 4-5 days

- [ ] Define `LODLevel` enum (Laniakea → Cell)
- [ ] Implement `applyLOD(cameraDistance)` function
- [ ] Create proxy geometries for distant objects
- [ ] Add progressive mesh simplification
- [ ] Implement frustum culling for off-screen branches
- [ ] Add occlusion culling (branches behind globe)
- [ ] Measure FPS at each zoom level (target: 60fps stable)

**Deliverable:** Smooth zoom from Globe → Cell with stable performance

---

### 🌌 Phase 4: Laniakea Layer (CONTEXT)
**Duration:** 3-4 days

- [ ] Create Laniakea supercluster filament structure
- [ ] Position Globe within Laniakea coordinate system
- [ ] Implement gradient pressure from supercluster
- [ ] Add background starfield / cosmic context
- [ ] Ensure Laniakea never renders at Company zoom level
- [ ] Test zoom out from Earth → Planetary → Laniakea

**Deliverable:** Complete zoom range from Cell → Laniakea

---

### 🎯 Phase 5: Unification & Polish (FINAL)
**Duration:** 3-4 days

- [ ] Merge all views into single scene graph
- [ ] Implement smooth camera transitions between zoom levels
- [ ] Add keyboard shortcuts for zoom presets (1-6)
- [ ] Polish materials for each scale
- [ ] Add hover tooltips with scale-appropriate info
- [ ] Create demo sequence (Cell → Branch → Tree → Globe → Laniakea)
- [ ] Final performance audit (LOD tuning)

**Deliverable:** Unified Relay visualization (Core → Laniakea)

---

## ✅ ACCEPTANCE CRITERIA (Final Sign-Off)

### The Ultimate Test:

**User must be able to:**

1. Start at Laniakea scale
2. Zoom to Earth (see Globe + company trunks)
3. Zoom to Israel (see country boundary)
4. Zoom to Tel Aviv (see city boundary + tree emerging)
5. Zoom to company tree (see branches + bundles)
6. Zoom to branch (see internal filaments + timeboxes)
7. Zoom to filament (see micro-timeboxes + curve detail)
8. Zoom to cell (see cell tip anchor)
9. **Trace that cell back to Earth's core**

**WITHOUT:**
- Filaments collapsing into hub
- Sheets aggregating
- Branches teleporting
- Context disappearing
- Scene switching
- FPS dropping below 30

---

## 🔒 CANONICAL LOCK

**This specification is now AUTHORITATIVE.**

Any implementation that violates:
- 1→many topology
- Earth core origin
- No hub nodes
- Outward growth principle

**IS WRONG and must be refactored.**

---

## 📊 CURRENT STATUS SUMMARY

### ✅ Complete:
- Fractal filament paths (curved, organic)
- Direct topology (Cell → Branch, no hub)
- Micro-timeboxes on filaments
- Turgor pressure (branch stiffness from divergence)
- Visibility fixes (materials bright enough)

### 🔧 In Progress:
- Depth write fix for translucent materials
- Blending mode adjustment
- Micro-timebox alignment
- Topology lint checks
- One-scene enforcement

### ⏳ Planned:
- Globe restoration
- Boundary shells
- LOD system
- Laniakea layer
- Full unification

---

## 📐 VISUAL REFERENCE GUIDE

### Branch Structure (See Provided Images):
- Organic, fractal splits
- Natural tension in curves
- No straight segments
- Visible grain/texture
- Multiple scales of branching

### Globe + Trees (See Provided Visualizations):
- Trees emerge FROM surface
- Golden/orange root systems visible
- Geographic distribution
- Boundary shells intersect trees
- Scale shows Earth curvature

---

## 🚀 NEXT IMMEDIATE ACTION

1. **Hard refresh browser** (`Ctrl+Shift+R`)
2. **Verify tree visibility** (should see bright blue glow)
3. **Apply Last-Mile Fixes** (depthWrite, blending, alignment)
4. **Run Final Validation Test** (20-40 cell spreadsheet with formulas)
5. **Begin Globe Restoration** (Phase 2)

---

**The tree grows from Earth's core outward.**  
**Responsibility is never lost as scale increases.**  
**Truth compounds, it does not compress.**

🌍 → 🌳 → 🌌

---

## 📝 CHANGELOG: v93 Globe + Boundary Restoration Requirements

**Added:** 2026-02-02 (Final Specification Lock)

### Critical Additions for Canon's Implementation Plan:

#### ✅ **1. v93 Globe Restoration Contract (Section 2.0)**
Complete preconditions framework added before Phase 2.1, including:

**Contract 1:** Globe as Primary World Root (NOT separate scene)
- ONE scene graph containing both Globe + Trees
- No mesh rebuilding on view switch
- Globe view = camera + LOD + visibility only

**Contract 2:** Boundary System from Git Storage (NOT hardcoded)
- Three new Git commit types:
  - `BOUNDARY_DEFINE` (geometry + metadata)
  - `TREE_ANCHOR_SET` (company → lat/lon)
  - `BOUNDARY_MEMBERSHIP_SET` (company → boundaries)
- Boundaries persist across view switches
- Boundaries are versioned history (not editable state)

**Contract 3:** Geospatial Tree Anchoring (Real Lat/Lon)
- Required: `latLonToVector3()` coordinate conversion
- Required: `getLocalTangentFrame()` for surface orientation
- Trees must "stand" on globe (normal-aligned, not floating)
- Example: Tel Aviv at 32.0853°N, 34.7818°E

**Contract 4:** Boundary Geometry Model (NOT spheres)
- Real geofences as GeoJSON polygon/multipolygon
- Rendering: Extruded curtain / volumetric prism (preferred)
- LOD simplification by admin level (admin0 → admin3)
- Israel boundary must look like Israel, not a sphere

**Contract 5:** Single LOD Governor (Global Policy)
- `LODGovernor` class with subscribe/notify pattern
- All modules obey central LOD decisions
- Mandatory culling: frustum, globe occlusion, distance-based
- No module may independently decide visibility

**Contract 6:** Boundaries as Pressure/Context Sources (NOT commands)
- Boundaries influence visuals (pressure, heat, labels)
- Boundaries CANNOT override commits or edit data
- Boundaries change HOW it reads, not WHAT is true

---

#### ✅ **2. Clarified Filament Topology (Layer 2)**
Updated to prevent hub confusion:

**Before:**
```
Bottom: Cell tip → Filament → Branch bundle spine (1→many)
```

**After:**
```
Top endpoints: CellTipAnchor (N individual cell tips)
Bottom endpoints: BranchBundleSpineAnchors (N anchor points)
Filament: Connects ONE cell tip to ONE bundle anchor (1:1 per cell)
Branch: Owns MANY bundle anchors (1→many convergence at branch)
```

This explicit clarification prevents anyone from reintroducing sheet hubs.

---

#### ✅ **3. Enhanced Phase 2 Deliverables**
Expanded success criteria to include:

- ✅ Company tree rooted at real lat/lon (Tel Aviv: 32.0853°N, 34.7818°E)
- ✅ Tree properly oriented to surface (using local tangent frame)
- ✅ Boundaries rendered as volumetric shells (extruded polygons, not spheres)
- ✅ Boundaries loaded from Git commits (3 new commit types)
- ✅ Single LOD governor active and subscribed by all modules
- ✅ All 7 v93 Restoration Contracts validated and passing

---

### Implementation Impact:

**Before these additions:**
- Globe restoration was vague ("restore globe sphere from v93")
- No storage integration specified
- Boundaries could have been hardcoded
- LOD governance was scattered
- No clear acceptance criteria

**After these additions:**
- Globe restoration has 6 mandatory contracts with acceptance tests
- Git storage integration is explicit (3 new commit types)
- Boundaries must be GeoJSON-based and data-driven
- LOD governance is centralized (LODGovernor class)
- Clear pass/fail criteria for each contract

---

### Canon's Action Items (From These Additions):

1. **Implement 3 new Git commit types** (BOUNDARY_DEFINE, TREE_ANCHOR_SET, BOUNDARY_MEMBERSHIP_SET)
2. **Build LODGovernor class** with subscribe/notify pattern
3. **Implement geospatial functions** (latLonToVector3, getLocalTangentFrame)
4. **Source v93 boundary geometries** as GeoJSON polygon/multipolygon
5. **Implement extruded curtain rendering** for boundary shells
6. **Implement globe occlusion culling** (hide objects behind Earth)
7. **Validate all 7 contracts** before declaring Phase 2 complete

---

### Why These Additions Matter:

**Without explicit contracts:**
- Canon might restore "a globe" (any globe)
- Boundaries might be decorative spheres (not v93 system)
- Storage might stay hardcoded (breaking Git model)
- LOD might be module-specific (causing conflicts)

**With explicit contracts:**
- Canon must restore THE v93 Globe + boundary system
- Boundaries must be real geofences from Git
- Storage is forced to be Git-based
- LOD is guaranteed to be centralized

---

**These additions ensure Canon cannot "restore globe visuals" without actually restoring the v93 boundary system as a Git-versioned, LOD-governed layer inside the same 3D instrument.**

---

**END OF CANONICAL SPECIFICATION**
