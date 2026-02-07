# Phase 2 Implementation Directive
**Date:** 2026-02-02 20:45  
**Status:** 🎯 READY TO IMPLEMENT  
**Authority:** Canonical instruction from user + Canon verification

---

## 📋 **DIRECTIVE: Proceed with Phase 2A + 2B**

**Constraint:** Stage gates must control **LOADING** as well as visibility.  
**Correction:** Replace "orbit" language everywhere (use Zoom/Macro/Context).  
**After unification:** Implement Phase 2B in prototype - load ONE local GeoJSON boundary containing the tree anchor (Tel Aviv), triangulate via earcut, extrude slightly above globe, render outline+fill, reveal only at Stage ≥2 and only when zoomed out.

---

## 🎯 **PHASE 2A: View Unification (IMPLEMENT NOW)**

### **Goal:**
Remove view switching, keep one scene, gate both visibility AND loading by stage.

### **Tasks:**

#### **1. Remove View Buttons**
**File:** `filament-spreadsheet-prototype.html` lines ~875-879

**Remove:**
```html
<button onclick="switchView('grid')">Grid View</button>
<button onclick="switchView('volume')">Sheet Volume</button>
<button onclick="switchView('helix')">History Helix</button>
<button onclick="switchView('scaffold')">Tree Scaffold</button>
```

**Replace with:**
```html
<div id="nav-hud" style="position: absolute; top: 10px; right: 10px; 
     background: rgba(0,0,0,0.7); color: #0ff; padding: 10px; 
     font-family: monospace; font-size: 12px; border-radius: 5px;">
  <div><strong>🎮 NAVIGATION</strong></div>
  <div>G: Toggle Grid Overlay</div>
  <div>H: Toggle History Loop</div>
  <div>T: Fly to Tree Anchor</div>
  <div>Z: Zoom to Context</div>
  <div>M: Macro View (altitude)</div>
  <div>Click: Inspect Object</div>
</div>
```

---

#### **2. Add Keyboard Shortcuts**
**Add after pointer lock setup (line ~2850):**

```javascript
// Keyboard navigation shortcuts
window.addEventListener('keydown', (e) => {
    if (controls.isLocked) return;  // Don't interfere with flight controls
    
    switch(e.key.toLowerCase()) {
        case 'g':  // Toggle Grid Overlay
            toggleGridOverlay();
            break;
        case 'h':  // Toggle History Loop
            toggleHistoryLoop();
            break;
        case 't':  // Fly to Tree Anchor
            flyToTreeAnchor();
            break;
        case 'z':  // Zoom to Context
            zoomToContext();
            break;
        case 'm':  // Macro View
            macroView();
            break;
    }
});

function toggleGridOverlay() {
    const grid = document.getElementById('gridContainer');
    if (!grid) return;
    grid.style.display = (grid.style.display === 'none') ? 'block' : 'none';
    grid.style.opacity = '0.9';
    grid.style.pointerEvents = 'auto';  // Allow interaction
    relayUI.log(grid.style.display === 'none' ? 'Grid hidden' : 'Grid visible', 'ok');
}

function toggleHistoryLoop() {
    if (!historyLoopMesh) return;
    historyLoopMesh.visible = !historyLoopMesh.visible;
    relayUI.log(historyLoopMesh.visible ? 'History loop visible' : 'History loop hidden', 'ok');
}

function flyToTreeAnchor() {
    if (!camera) return;
    // Smooth fly to tree position
    const targetPos = new THREE.Vector3(0, 5, 15);  // Front of tree
    animateCameraTo(targetPos, new THREE.Vector3(0, 0, 0));
    relayUI.log('Flying to tree anchor...', 'ok');
}

function zoomToContext() {
    if (!camera) return;
    // Zoom out to see Globe + Tree
    const targetPos = new THREE.Vector3(0, 15, 30);
    animateCameraTo(targetPos, new THREE.Vector3(0, 0, 0));
    relayUI.log('Zooming to context view...', 'ok');
}

function macroView() {
    if (!camera) return;
    // High altitude view
    const targetPos = new THREE.Vector3(0, 25, 50);
    animateCameraTo(targetPos, new THREE.Vector3(0, 0, 0));
    relayUI.log('Macro view (high altitude)...', 'ok');
}

function animateCameraTo(targetPos, lookAt, duration = 1000) {
    const startPos = camera.position.clone();
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;  // Ease in-out
        
        camera.position.lerpVectors(startPos, targetPos, ease);
        camera.lookAt(lookAt);
        
        if (t < 1) requestAnimationFrame(animate);
    }
    animate();
}
```

---

#### **3. Stage-Gated Loading (CRITICAL)**
**Add at top of renderTreeScaffold() function (line ~3828):**

```javascript
// 🔒 STAGE-GATED LOADING: Control what gets loaded, not just visibility
const stageLevel = 2;  // TODO: Make dynamic based on user progress

// Stage 0-1: Tree only (no globe)
if (stageLevel < 2) {
    if (globeMesh) {
        scene.remove(globeMesh);
        globeMesh = null;
    }
    console.log('[Relay] 🌳 Stage 0-1: Tree only (no globe)');
}

// Stage 2: Load globe + local boundary only
if (stageLevel >= 2 && !globeMesh) {
    createGlobeMesh();  // Already exists in code
    console.log('[Relay] 🌍 Stage 2: Globe + local boundary loaded');
    
    // TODO Phase 2B: Load local boundary mesh here
    // loadLocalBoundary('ISR-ADM0');  // Israel boundary only
}

// Stage 3+: Progressive tile loading
if (stageLevel >= 3) {
    // TODO: Load neighborhood/city boundaries progressively
    console.log('[Relay] 🗺️ Stage 3+: Progressive boundaries');
}
```

---

#### **4. Fade-In Globe (Not Instant Pop)**
**Update createGlobeMesh() function (line ~3867):**

```javascript
function createGlobeMesh() {
    if (globeMesh) return;  // Already exists
    
    console.log('[Relay] 🌍 Creating Globe mesh...');
    
    const geometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a3a5c,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 0,  // Start invisible
        side: THREE.DoubleSide,
        wireframe: false
    });
    
    globeMesh = new THREE.Mesh(geometry, material);
    globeMesh.userData = { type: 'globe', layer: 'spatial_truth' };
    globeMesh.position.set(0, 0, 0);
    
    // Wireframe overlay
    const wireGeometry = new THREE.SphereGeometry(globeRadius + 0.01, 32, 32);
    const wireMaterial = new THREE.LineBasicMaterial({
        color: 0x4488cc,
        transparent: true,
        opacity: 0  // Start invisible
    });
    const wireframe = new THREE.WireframeGeometry(wireGeometry);
    const wireMesh = new THREE.LineSegments(wireframe, wireMaterial);
    wireMesh.userData = { type: 'globe_grid' };
    globeMesh.add(wireMesh);
    
    scene.add(globeMesh);
    
    // Fade in gradually
    fadeInGlobe();
    
    console.log('[Relay] ✅ Globe mesh created (fading in)');
}

function fadeInGlobe() {
    if (!globeMesh) return;
    
    const duration = 1000;  // 1 second
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        globeMesh.material.opacity = 0.85 * t;
        
        // Also fade in wireframe
        const wire = globeMesh.children.find(c => c.userData.type === 'globe_grid');
        if (wire) wire.material.opacity = 0.3 * t;
        
        if (t < 1) requestAnimationFrame(animate);
    }
    animate();
}
```

---

## 🎯 **PHASE 2B: Local Boundary Integration (NEXT)**

### **Goal:**
Load ONE local GeoJSON boundary (Israel/Tel Aviv), triangulate, extrude, render.

### **Tasks:**

#### **1. Add Earcut Library**
**Add script tag (line ~20, after THREE.js):**

```html
<script src="https://cdn.jsdelivr.net/npm/earcut@2.2.4/dist/earcut.min.js"></script>
```

---

#### **2. Load Local Boundary**
**Add function after createGlobeMesh():**

```javascript
async function loadLocalBoundary(countryCode) {
    console.log(`[Relay] 🗺️ Loading boundary: ${countryCode}`);
    
    try {
        // Fetch Israel boundary (country level)
        const response = await fetch(`data/boundaries/countries/${countryCode}.geojson`);
        if (!response.ok) throw new Error('Boundary not found');
        
        const geojson = await response.json();
        
        // Create boundary mesh
        const boundaryMesh = createBoundaryMesh(geojson);
        scene.add(boundaryMesh);
        
        console.log('[Relay] ✅ Boundary mesh added to scene');
        
    } catch (error) {
        console.warn('[Relay] ⚠️ Could not load boundary:', error);
    }
}

function createBoundaryMesh(geojson) {
    const group = new THREE.Group();
    group.userData = { type: 'boundary', code: geojson.properties?.iso_a3 };
    
    const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
    
    features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            const mesh = polygonToMesh(feature.geometry.coordinates[0]);  // Outer ring
            group.add(mesh);
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
                const mesh = polygonToMesh(polygon[0]);  // Outer ring
                group.add(mesh);
            });
        }
    });
    
    return group;
}

function polygonToMesh(coordinates) {
    // Convert lat/lon to 3D points on globe surface
    const points3D = coordinates.map(([lon, lat]) => {
        return latLonToGlobePoint(lat, lon, globeRadius + 0.05);  // Slightly above surface
    });
    
    // Flatten for earcut (2D triangulation)
    const points2D = coordinates.map(([lon, lat]) => [lon, lat]).flat();
    
    // Triangulate
    const triangles = earcut(points2D, null, 2);
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    for (let i = 0; i < triangles.length; i++) {
        const point = points3D[triangles[i]];
        vertices.push(point.x, point.y, point.z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    // Material: semi-transparent fill + bright outline
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add outline
    const outlineGeometry = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    mesh.add(outline);
    
    return mesh;
}

function latLonToGlobePoint(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
}
```

---

#### **3. Call Boundary Load at Stage 2**
**Update stage-gated loading section:**

```javascript
// Stage 2: Load globe + local boundary only
if (stageLevel >= 2 && !globeMesh) {
    createGlobeMesh();
    loadLocalBoundary('ISR-ADM0');  // Israel boundary
    console.log('[Relay] 🌍 Stage 2: Globe + Israel boundary loaded');
}
```

---

## ✅ **ACCEPTANCE TESTS**

### **Phase 2A Complete When:**
1. ✅ View buttons removed, nav HUD visible
2. ✅ Press `G` → Grid overlay toggles
3. ✅ Press `Z` → Camera zooms out smoothly (not instant)
4. ✅ Globe fades in gradually (not instant pop)
5. ✅ No console errors
6. ✅ No "orbit" text anywhere

### **Phase 2B Complete When:**
1. ✅ Israel boundary mesh visible when zoomed out
2. ✅ Boundary has outline + semi-transparent fill
3. ✅ Boundary sits slightly above Globe (no z-fighting)
4. ✅ Boundary only loads at Stage ≥2
5. ✅ No 500-file loading (just ONE GeoJSON)

---

## 🚀 **IMPLEMENTATION ORDER**

1. **Phase 2A Task 1:** Remove view buttons, add nav HUD
2. **Phase 2A Task 2:** Add keyboard shortcuts (G, H, T, Z, M)
3. **Phase 2A Task 3:** Stage-gated loading logic
4. **Phase 2A Task 4:** Fade-in Globe animation
5. **Test:** Import file → Globe fades in → Press Z to zoom
6. **Phase 2B Task 1:** Add earcut library
7. **Phase 2B Task 2:** Implement boundary loading functions
8. **Phase 2B Task 3:** Call boundary load at Stage 2
9. **Test:** Zoom out → See Israel boundary under tree

---

**Status:** Ready to implement  
**Blocker:** None (Phase 1 complete, topology stable)  
**Next:** Begin Phase 2A Task 1 (remove view buttons)
