# Implementation Locks Checklist
## 8 Critical Locks to Prevent System Re-Fragmentation

**Date:** 2026-02-02  
**Status:** 🔒 FINAL LOCKS APPLIED - READY FOR EXECUTION  
**Purpose:** Prevent Canon from accidentally re-fragmenting the system during v93 Globe + boundary restoration

---

## 🔒 LOCK 1: Fix Geospatial Math (North/East Calculation)

**Problem:** Approximating `north = (0,1,0)` breaks orientation away from equator, causing trees to twist/roll.

**Correct Implementation:**
```javascript
function getLocalTangentFrame(lat, lon) {
    const surfacePos = latLonToVector3(lat, lon, 100, 0);
    
    // Up: radial direction from Earth center
    const up = surfacePos.clone().normalize();
    
    // East: perpendicular to up and world-up (handle poles)
    const worldUp = new THREE.Vector3(0, 1, 0);
    let east = new THREE.Vector3().crossVectors(worldUp, up);
    
    if (east.lengthSq() < 0.001) {
        // At poles, use arbitrary east
        east = new THREE.Vector3(1, 0, 0);
    } else {
        east.normalize();
    }
    
    // North: perpendicular to up and east
    const north = new THREE.Vector3().crossVectors(up, east).normalize();
    
    return { up, north, east };
}
```

**Acceptance Test:**
- [ ] Tree at Tel Aviv (32.0853°N, 34.7818°E) stands correctly
- [ ] Tree at equator (0°N, any lon) stands correctly
- [ ] Tree at high latitude (60°N) stands correctly without rolling
- [ ] Frame is right-handed (cross(east, north) = up)

---

## 🔒 LOCK 2: Boundary Extrusion in Local Up Direction

**Problem:** Extruding in world-Y causes boundaries to lean incorrectly on curved globe.

**Correct Implementation:**
```javascript
function createBoundaryMesh(geojson, extrudeHeight = 20) {
    // 1. Get boundary centroid
    const centroid = calculateCentroid(geojson.geometry.coordinates);
    const centroidPos = latLonToVector3(centroid.lat, centroid.lon, 100, 0);
    const frame = getLocalTangentFrame(centroid.lat, centroid.lon);
    
    // 2. Convert GeoJSON to local tangent plane
    const localPoints = geojson.geometry.coordinates[0].map(coord => {
        const [lon, lat] = coord;
        const worldPos = latLonToVector3(lat, lon, 100, 0);
        const relative = worldPos.clone().sub(centroidPos);
        
        return new THREE.Vector2(
            relative.dot(frame.east),
            relative.dot(frame.north)
        );
    });
    
    // 3. Create shape and extrude in LOCAL space
    const shape = new THREE.Shape(localPoints);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: extrudeHeight,  // Along local "up"
        bevelEnabled: false
    });
    
    // 4. Transform to world space using tangent frame
    const mesh = new THREE.Mesh(geometry);
    mesh.position.copy(centroidPos);
    mesh.up.copy(frame.up);
    mesh.lookAt(centroidPos.clone().add(frame.north));
    
    return mesh;
}
```

**Acceptance Test:**
- [ ] Israel boundary walls rise perpendicular to globe surface
- [ ] Tel Aviv boundary walls rise perpendicular to globe surface
- [ ] No leaning boundaries anywhere on globe

---

## 🔒 LOCK 3: Boundary Containment is Lat/Lon Based (Implementable)

**Problem:** `mesh.containsPoint()` doesn't exist in Three.js. Acceptance tests must be implementable.

**Correct Implementation:**
```javascript
// Point-in-polygon (ray casting algorithm)
function pointInPolygon(point, polygon) {
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
boundary.containsLL = function(lat, lon) {
    const coords = this.geojson.geometry.coordinates;
    for (let polygon of coords) {
        // Check outer ring
        if (pointInPolygon([lon, lat], polygon[0])) {
            // Check holes (exclusion zones)
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
```

**Acceptance Test:**
- [ ] `israelBoundary.containsLL(32.0853, 34.7818)` returns `true` (Tel Aviv inside Israel)
- [ ] `israelBoundary.containsLL(33.0, 44.0)` returns `false` (Iraq outside Israel)
- [ ] Edge cases: points on boundary return consistent results

---

## 🔒 LOCK 4: Boundaries from Git Commits (Content-Hash References)

**Problem:** Having both `BOUNDARY_DEFINE` commits AND `/src/data/boundaries/*.geojson` creates duplicate truth sources.

**Correct Implementation:**
```javascript
// BOUNDARY_DEFINE commit with inline OR content-hash reference
{
    type: 'BOUNDARY_DEFINE',
    schemaVersion: 'relay-visual-v1',
    boundaryId: 'boundary.country.israel',
    
    // OPTION A: Inline (preferred for small boundaries)
    geometry: { type: 'MultiPolygon', coordinates: [[...]] },
    
    // OPTION B: Content-hash reference (for large boundaries)
    // geometryRef: {
    //     contentHash: 'sha256:abc123...',
    //     path: 'boundaries/israel.geojson',
    //     size: 124567
    // },
    
    metadata: { name: 'Israel', admin_level: 0 }
}

// ENFORCEMENT: Renderer must refuse boundaries not reachable from commits
function loadBoundary(boundaryId) {
    const commit = getCommit('BOUNDARY_DEFINE', boundaryId);
    if (!commit) {
        throw new Error(`Boundary ${boundaryId} has no commit - refusing to load`);
    }
    
    // Load geometry from commit (inline or via contentHash)
    const geometry = commit.geometry || 
                    loadGeometryByHash(commit.geometryRef.contentHash);
    
    return createBoundaryMesh(geometry);
}
```

**Acceptance Test:**
- [ ] Removing `BOUNDARY_DEFINE` commit removes boundary from render
- [ ] Even if GeoJSON file still exists in `/src/data/`, boundary doesn't render
- [ ] contentHash verification: wrong hash = refuse to load

---

## 🔒 LOCK 5: LOD Uses Altitude/Scale (Not Just Distance from Origin)

**Problem:** Using `camera.position.length()` causes LOD thrash when orbiting at constant altitude.

**Correct Implementation:**
```javascript
class LODGovernor {
    calculateLevel(camera) {
        const globeRadius = 100;
        const distFromOrigin = camera.position.length();
        
        // 🔒 Use altitude above surface, not distance from core
        const altitude = distFromOrigin - globeRadius;
        
        // Altitude bands (not distance bands)
        if (altitude > 400) return 'LANIAKEA';
        if (altitude > 100) return 'PLANETARY';
        if (altitude > 50) return 'REGIONAL';
        if (altitude > 15) return 'COMPANY';
        if (altitude > 5) return 'SHEET';
        return 'CELL';
    }
}
```

**Acceptance Test:**
- [ ] Orbit Earth at altitude=150 for 10 seconds → LOD stays 'PLANETARY' (no thrash)
- [ ] Zoom in from altitude=200 to altitude=10 → smooth LOD transitions
- [ ] FPS remains stable (>30) during orbit

---

## 🔒 LOCK 6: One Graph, Many Lenses (Technical Enforcement)

**Problem:** Views can accidentally rebuild geometry or create new scenes.

**Correct Implementation:**
```javascript
// Lock graph identity at init
let sceneRootUUID = null;
let graphBuildId = null;

function initScene() {
    scene = new THREE.Scene();
    sceneRootUUID = scene.uuid;
    graphBuildId = generateUUID();
    
    console.log('[Relay] 🔒 Scene locked:', sceneRootUUID);
    console.log('[Relay] 🔒 Graph locked:', graphBuildId);
}

function switchView(viewName) {
    // VERIFY graph integrity
    if (scene.uuid !== sceneRootUUID) {
        throw new Error('🚨 VIOLATION: Scene was replaced!');
    }
    
    // ✅ ALLOWED: Visibility toggles
    scene.traverse(obj => {
        obj.visible = obj.userData.layers?.includes(viewName);
    });
    
    // ✅ ALLOWED: Camera presets
    applyCameraPreset(viewName);
    
    // ❌ FORBIDDEN: scene.clear(), new THREE.Scene(), graphRebuild()
    
    // Run topology lint (guardrail)
    if (!relayLintTopology(state)) {
        console.error('🚨 VIOLATION: View switch broke topology!');
    }
}
```

**Topology Lint Triggers (Mandatory):**
1. After file import
2. After view switch
3. After LOD level change
4. After globe/boundary load from Git

**Acceptance Test:**
- [ ] `graphBuildId` remains constant across view switches (GRID↔TREE↔GLOBE)
- [ ] `scene.uuid` remains constant
- [ ] Topology lint passes after every view switch

---

## 🔒 LOCK 7: Safe Language Consistency (drift → divergence)

**Problem:** Mixed terminology causes confusion. Relay canonical term is "divergence."

**Replacements Required:**

**In Code:**
```javascript
// Before
const driftCount = branch.drift_count;
highDriftBranches.glow();

// After
const divergenceCount = branch.divergence_count;
highDivergenceBranches.glow();
```

**In UI Labels:**
- "Drift Count" → "Divergence Count"
- "High Drift" → "High Divergence"
- "Drift Budget" → "Divergence Budget"

**In Console Logs:**
```javascript
// Before
console.log('[Relay] Branch has high drift');

// After
console.log('[Relay] Branch has high divergence');
```

**Acceptance Test:**
- [ ] Global search for "drift" returns zero results in UI strings
- [ ] Global search for "drift" in code returns zero results (except "drift" in variable names changed to "divergence")
- [ ] All user-facing text uses "divergence" consistently

---

## 🔒 LOCK 8: Phase Order (Not Time Promises)

**Problem:** Reporting includes day/hour breakdown and promises like "report every 2-4 hours" which imply background execution.

**Correct Format:**

**Before (Time Promises):**
```
Phase 1: 2-3 days
  - Hour 1-2: DepthWrite fixes
  - Hour 3-5: Topology lint
  - Report progress every 2-4 hours
```

**After (Phase Order + Pass/Fail Gates):**
```
Phase 1: Last-Mile Fixes
  Pass/Fail Criteria:
  ✅ DepthWrite fix applied
  ✅ Topology lint passes
  ✅ One-scene rule enforced
  ✅ Final validation test passes
  
  Gate: ALL criteria must pass before Phase 2
```

**Acceptance:**
- [ ] No time estimates in implementation plan
- [ ] Clear pass/fail gates for each phase
- [ ] No "report every X hours" language

---

## 🚦 FINAL GO/NO-GO GATE (Before Phase 2)

### **Gate Name:** Phase 2 Entry Clearance

**Required:** `contracts.test.js` passes with ALL checks green

### **Test Suite:**

```javascript
describe('Phase 2 Entry Clearance', () => {
    it('Topology lint passes', () => {
        const result = relayLintTopology(state);
        expect(result.pass).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    
    it('Boundary containsLL works', () => {
        const israelBoundary = getBoundary('boundary.country.israel');
        expect(israelBoundary.containsLL(32.0853, 34.7818)).toBe(true);  // Tel Aviv
        expect(israelBoundary.containsLL(33.0, 44.0)).toBe(false);       // Iraq
    });
    
    it('Tangent frame alignment correct', () => {
        const frame = getLocalTangentFrame(32.0853, 34.7818);
        
        // Frame is right-handed
        const cross = new THREE.Vector3().crossVectors(frame.east, frame.north);
        expect(cross.dot(frame.up)).toBeCloseTo(1, 2);
        
        // Vectors are unit length
        expect(frame.up.length()).toBeCloseTo(1, 5);
        expect(frame.north.length()).toBeCloseTo(1, 5);
        expect(frame.east.length()).toBeCloseTo(1, 5);
    });
    
    it('LOD governor stable over orbit', () => {
        const altitude = 150;
        const samples = [];
        
        // Orbit for 10 seconds at constant altitude
        for (let angle = 0; angle < 360; angle += 10) {
            camera.position.set(
                Math.cos(angle * Math.PI / 180) * (100 + altitude),
                0,
                Math.sin(angle * Math.PI / 180) * (100 + altitude)
            );
            
            lodGov.update();
            samples.push(lodGov.currentLevel);
        }
        
        // All samples should be same level (no thrash)
        const unique = [...new Set(samples)];
        expect(unique).toHaveLength(1);
        expect(unique[0]).toBe('PLANETARY');
    });
    
    it('Scene graph identity stable across view switches', () => {
        const idBefore = graphBuildId;
        const uuidBefore = scene.uuid;
        
        switchView('GRID');
        switchView('TREE');
        switchView('GLOBE');
        switchView('TREE');
        
        expect(graphBuildId).toBe(idBefore);
        expect(scene.uuid).toBe(uuidBefore);
    });
    
    it('Topology lint runs on all triggers', () => {
        const lintCalls = [];
        const originalLint = relayLintTopology;
        relayLintTopology = (...args) => {
            lintCalls.push('called');
            return originalLint(...args);
        };
        
        importFile(testFile);           // Trigger 1
        switchView('TREE');             // Trigger 2
        lodGov.notifySubscribers('COMPANY');  // Trigger 3
        loadBoundaryFromGit(commit);    // Trigger 4
        
        expect(lintCalls.length).toBeGreaterThanOrEqual(4);
        
        relayLintTopology = originalLint;
    });
});
```

### **Pass Criteria:**

```
✅ All 6 tests passing
✅ No console errors
✅ FPS stable (>30) during orbit test
✅ Topology lint passes on all triggers
```

### **Gate Decision:**

```
IF all tests pass:
  ✅ PROCEED to Phase 2 (Globe Restoration)
ELSE:
  ❌ BLOCK Phase 2
  → Fix failing tests
  → Re-run gate
```

---

## ✅ CHECKLIST SUMMARY

**Before starting implementation, verify:**

- [ ] Lock 1: Geospatial math fixed (correct north/east calculation)
- [ ] Lock 2: Boundary extrusion in local up direction
- [ ] Lock 3: Boundary containsLL implemented (point-in-polygon)
- [ ] Lock 4: Boundaries from Git commits (content-hash enforcement)
- [ ] Lock 5: LOD uses altitude (not distance from origin)
- [ ] Lock 6: One graph enforced (sceneRootUUID + graphBuildId)
- [ ] Lock 7: Safe language (drift → divergence)
- [ ] Lock 8: Phase order (no time promises)

**Before Phase 2, verify:**

- [ ] `contracts.test.js` passes (all 6 tests green)
- [ ] Topology lint passes
- [ ] Boundary containsLL works
- [ ] Tangent frame correct
- [ ] LOD stable during orbit
- [ ] Scene graph identity stable

---

## 🎯 WHEN ALL LOCKS VERIFIED

**Status:** ✅ READY FOR IMPLEMENTATION

**Next Action:** Begin Phase 1 (Last-Mile Fixes)

**Expected Outcome:** 
- Current tree canonical and stable
- No hub regressions possible (topology lint enforced)
- Safe to proceed to Globe restoration (Phase 2)

---

**These 8 locks prevent the exact failures seen previously:**
1. ✅ Prevents tree twisting/rolling at different latitudes
2. ✅ Prevents boundary walls leaning on curved globe
3. ✅ Makes containment tests actually implementable
4. ✅ Prevents duplicate truth sources (Git vs file system)
5. ✅ Prevents LOD thrash during orbit
6. ✅ Prevents accidental hub reintroduction
7. ✅ Maintains consistent terminology
8. ✅ Keeps execution plan realistic and gate-based

**The system is locked. Canon cannot accidentally re-fragment.**

🔒 **Implementation is now TRULY ready.**
