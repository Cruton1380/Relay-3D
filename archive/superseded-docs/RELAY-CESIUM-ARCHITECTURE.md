# 🌍 Relay Cesium Architecture

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

This is the **complete architectural specification** for Relay's Cesium-first world.

---

## System Statement

**Globe is the product. Cesium is the renderer. RelayState is renderer-agnostic.**

Relay visualizes organizational structures as living 3D trees anchored to real-world locations on Earth. The globe is not decoration—it IS the product. Every organization, every spreadsheet, every data flow is spatially grounded.

### Core Principle: One Cesium Viewer (Single Rendering Context)

- **One Cesium.Viewer instance** (single WebGL context)
- **One Relay world** rendered via:
  - `viewer.scene.primitives` (geometry instances)
  - `viewer.entities` (high-level objects)
  - `viewer.imageryLayers` (overlays)
- **No parallel renderer contexts** (no Three.js, no second canvas)
- **One truth**: `relayState` holds pure data, renderers adapt it to visuals

**Critical**: Cesium does not expose a "scene graph" like Three.js. It manages a scene with specialized collections (primitives, entities, imagery layers).

---

## World Topology

### 1. Earth as Substrate

**Cesium provides the foundation**:
- **Terrain**: Real elevation data from Cesium World Terrain
- **Imagery**: Satellite imagery from Bing Maps / Cesium Ion
- **3D Buildings**: OSM Buildings layer (real structures)
- **Lighting**: Sun position, fog, atmospheric scattering

**Why this matters**: Organizations exist on a real planet. Relay makes geography explicit.

### 2. Boundaries as Shells

**Geopolitical jurisdictions** rendered as:
- **GeoJSON polygons** (countries, states, cities, custom zones)
- **Extrusion** at close zoom (3D shells with height)
- **LOD simplification** at far zoom (outlines/curtains)

**Purpose**:
- **Voting scope**: Votes are scoped to `boundaryId`
- **Jurisdiction lens**: Show only data within selected boundary
- **containsLL(lat, lon)**: Point-in-polygon test for membership

**Implementation**: `core/services/boundaries/` (renderer-agnostic logic)

### 3. Trees Anchored to Real Lat/Lon (LOCAL ROOTING)

**Each organization/site has its own tree, rooted at its own location:**

```
Tree @ Company A (lat1, lon1)          Tree @ Company B (lat2, lon2)
        |                                       |
      Trunk (local)                           Trunk (local)
        |                                       |
    Branches (local)                        Branches (local)
        |                                       |
     Sheets                                  Sheets
```

**Rule (Locked)**: No trunk or branch may span cities across Earth's surface.

**Within each local tree**:
- **Trunk**: Vertical pillar at anchor lat/lon, grows upward in local ENU frame
- **Branches**: Local arcs within ~2-5km radius of trunk
- **Sheets**: Thin rectangles at branch endpoints (represent Excel files)
- **Cells**: Thin tiles on sheet surface (represent spreadsheet cells)
- **Filaments**: Tubular connections showing data dependencies (within tree)

**Global relationships** (supply chains, shared governance) do NOT create surface-spanning branches.

Instead, they route to **Earth's core**:

```
Tree A (lat1, lon1)        Tree B (lat2, lon2)
     \                         /
      \                       /
       \  (relationship)     /
        \   filaments       /
         \                 /
          \               /
           EARTH CORE
```

**Why**:
- Preserves full, legible commit history from every direction
- Maintains jurisdiction boundaries
- Keeps geography visually correct
- No spaghetti planet bridges
- Core routing preserves causality and replayability

**Implementation**:
- Add to `relayState.core`:
  ```javascript
  relayState.core = {
      id: "earth.core",
      position: Cesium.Cartesian3.ZERO  // Earth center in ECEF
  };
  ```

- Add to `relayState.relationships[]`:
  ```javascript
  {
      id: "rel-companyA-companyB-vendor",
      type: "RELATIONSHIP",
      a: { anchorId: "tree-companyA" },
      b: { anchorId: "tree-companyB" },
      scope: { boundaryId: "USA" },
      commitRefs: ["commit:abc", "commit:def"],
      policyRef: "policy:shared-vendor-1",
      status: "ACTIVE"
  }
  ```

- Create new renderer: `app/renderers/relationship-renderer.js`
  - Renders two-leg filaments (A→Core, Core→B)
  - Segmented with timeboxes (full commit history)
  - Visible at PLANETARY/LANIAKEA LOD only

### 4. Sheets/Cells as Tip Surfaces

**Sheet geometry**:
- **Orientation**: Perpendicular to branch tangent (filaments flow from face)
- **Size**: Proportional to branch radius (no giant slabs)
- **Position**: Slightly behind filament endpoints (visual landing)

**Cell geometry**:
- **Shape**: Thin tiles (not cubes) with cell reference labels
- **Anchoring**: Front-face of sheet (filaments start here)
- **Proximity reveal**: Labels appear only when camera is close

**Staged bundling**:
```
Cell → Local Filament → SheetBundleSpine → Conduit → Branch → Trunk
```

This prevents "filament hubs" (topological violation).

### 5. Time as Discrete Segmentation

**Timeboxes segment filaments**:
- Each commit window = one segment
- Segment material/color varies by state (pending, active, complete)
- Boundary rings mark timebox edges
- No continuous time—discrete windows only

**Why?**: Continuous time creates illusion of seamless flow. Reality is discrete commits.

---

## Core Data Model (RelayState v1)

**Located**: `core/models/relay-state.js`

```javascript
const relayState = {
    // Earth's core (global reconciliation anchor)
    core: {
        id: "earth.core",
        position: "EARTH_CENTER"  // Cesium.Cartesian3.ZERO in ECEF
    },
    
    // Local tree structures
    tree: {
        nodes: [
            // { id, type: 'trunk'|'branch'|'sheet', parent, lat, lon, alt, metadata }
        ],
        edges: [
            // { source, target, type: 'filament'|'conduit', metadata }
        ]
    },
    
    // Global cross-tree relationships (core-routed)
    relationships: [
        // {
        //   id: "rel-companyA-companyB-vendor",
        //   type: "RELATIONSHIP",
        //   a: { anchorId: "tree-companyA" },
        //   b: { anchorId: "tree-companyB" },
        //   scope: { boundaryId: "USA" },
        //   commitRefs: ["commit:abc", "commit:def"],
        //   policyRef: "policy:shared-vendor-1",
        //   status: "ACTIVE"
        // }
    ],
    
    // Building/location anchors (maps buildings to trees)
    anchors: {
        // 'building-osm-12345': { treeId: 'tree-companyA', branchId: 'branch-0' }
    },
    
    // Geospatial overlays
    boundaries: [
        // { id, name, geojson, lod, visibility }
    ],
    
    votes: [
        // { id, lat, lon, type, boundaryId, metadata }
    ],
    
    weather: {
        // { timestamp, mode, overlayUrl, samplingGrid }
    },
    
    // Session metadata
    metadata: {
        filename: null,
        importedAt: null,
        version: '1.0.0'
    }
};
```

### Tree Nodes

**Trunk**:
```javascript
{
    id: 'trunk-0',
    type: 'trunk',
    name: 'Organization Root',
    lat: 32.0853,
    lon: 34.7818,
    alt: 0,
    height: 2000,
    parent: null,
    metadata: { filename: 'org.xlsx' }
}
```

**Branch**:
```javascript
{
    id: 'branch-0',
    type: 'branch',
    name: 'Branch 0',
    lat: 32.1,
    lon: 34.8,
    alt: 1000,
    parent: 'trunk-0',
    metadata: { companyName: 'Acme Corp', index: 0 }
}
```

**Sheet**:
```javascript
{
    id: 'sheet-0',
    type: 'sheet',
    name: 'Sales',
    lat: 32.1,
    lon: 34.8,
    alt: 1000,
    parent: 'branch-0',
    metadata: { sheetName: 'Sales', rows: 100, cols: 20 }
}
```

### Tree Edges

**Filament** (cell → cell dependency):
```javascript
{
    source: 'sheet-0-cell-A1',
    target: 'sheet-0-cell-B2',
    type: 'filament',
    metadata: { formula: '=A1*2', confidence: 0.95 }
}
```

**Conduit** (sheet spine → branch):
```javascript
{
    source: 'sheet-0-spine',
    target: 'branch-0',
    type: 'conduit',
    metadata: { bundleCount: 50 }
}
```

### Boundaries

```javascript
{
    id: 'ISR',
    name: 'Israel',
    geojson: { type: 'Polygon', coordinates: [[...]] },
    lod: 'REGION',  // visibility level
    visibility: true
}
```

### Votes

```javascript
{
    id: 'vote-123',
    lat: 32.0853,
    lon: 34.7818,
    type: 'parameter-change',
    boundaryId: 'ISR',  // scoped to Israel
    metadata: {
        parameter: 'taxRate',
        proposedValue: 0.15,
        currentValue: 0.17,
        timestamp: '2026-02-06T12:00:00Z'
    }
}
```

### Weather

```javascript
{
    timestamp: '2026-02-06T12:00:00Z',
    
    // Demo mode (static overlay - ship first)
    mode: 'DEMO',
    overlayUrl: './data/weather/sample-overlay.png',
    
    // Production mode (WMS/WMTS provider - future)
    // mode: 'WMS',
    // wmsUrl: 'https://weather.service/wms',
    // layer: 'temperature',
    // wmsParams: { time: '2026-02-06T12:00:00Z' },
    
    samplingGrid: {
        resolution: 0.1,  // degrees
        bounds: { north: 33, south: 29, east: 36, west: 34 }
    }
}
```

**Rule**: Do not block implementation on finding real weather provider. Ship with static demo overlays first, upgrade to WMS/WMTS later.

---

## Renderer Adapter Layer

**Principle**: `core/**` holds pure data. `app/**` adapts to Cesium.

### CesiumViewer Initialization

**Located**: `app/cesium/viewer-init.js`

```javascript
const viewer = await initializeCesiumViewer('cesiumContainer', {
    ionToken: '...',
    terrain: true,
    buildings: true,
    lighting: true,
    fog: true,
    initialPosition: { lon: 34.7818, lat: 32.0853, height: 15000 }
});
```

**Responsibilities**:
- Create `Cesium.Viewer` with terrain provider
- Add imagery (Bing Maps Aerial)
- Add 3D buildings (OSM Buildings)
- Configure scene (fog, lighting, depth test)
- Fly to initial position

### CesiumFilamentRenderer

**Located**: `app/renderers/filament-renderer.js`

**LOD Ladder** (altitude-based detail):

| Altitude | Primitive | Purpose |
|----------|-----------|---------|
| > 100km  | `PolylineGeometry` | Thin lines, cheap |
| 50-100km | `CorridorGeometry` | Ribbons, bundled |
| 5-50km   | `PolylineVolumeGeometry` | Tubes, full detail |
| < 5km    | Instanced boxes for cells | Micro-detail |

**Trunk rendering**:
```javascript
renderTrunk(trunk) {
    const positions = [
        Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0),
        Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, trunk.height)
    ];
    
    // Use PolylineVolumeGeometry with circular cross-section
    const geometry = new Cesium.PolylineVolumeGeometry({
        polylinePositions: positions,
        shapePositions: this.circleShape(trunk.radius, 16),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry,
            attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(trunkColor) }
        }),
        appearance: new Cesium.PerInstanceColorAppearance({ closed: true })
    });
    
    viewer.scene.primitives.add(primitive);
}
```

**Branch rendering** (curved arc with WGS84-grounded interpolation):

```javascript
renderBranch(branch) {
    const parent = getParentNode(branch);
    const start = Cesium.Cartesian3.fromDegrees(parent.lon, parent.lat, parent.alt);
    const end = Cesium.Cartesian3.fromDegrees(branch.lon, branch.lat, branch.alt);
    
    const positions = this.createArcPositions(start, end, 16);
    
    // Use PolylineVolumeGeometry for tube rendering
    const geometry = new Cesium.PolylineVolumeGeometry({
        polylinePositions: positions,
        shapePositions: this.circleShape(branchRadius, 12),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
}

/**
 * Create arc positions with WGS84-grounded interpolation
 * Uses great-circle path with parabolic height profile
 */
createArcPositions(start, end, segments = 16) {
    const startCarto = Cesium.Cartographic.fromCartesian(start);
    const endCarto = Cesium.Cartographic.fromCartesian(end);
    
    const positions = [];
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        
        // Great-circle interpolation (follows Earth curvature)
        const lon = Cesium.Math.lerp(startCarto.longitude, endCarto.longitude, t);
        const lat = Cesium.Math.lerp(startCarto.latitude, endCarto.latitude, t);
        
        // Parabolic height profile (arc peaks at midpoint)
        const baseHeight = Cesium.Math.lerp(startCarto.height, endCarto.height, t);
        const arcFactor = 4 * t * (1 - t);  // peaks at t=0.5
        const peakHeight = Math.max(startCarto.height, endCarto.height) * 1.5;
        const height = baseHeight + arcFactor * peakHeight;
        
        positions.push(Cesium.Cartesian3.fromRadians(lon, lat, height));
    }
    
    return positions;
}
```

**Critical**: Without WGS84-grounded interpolation, branches will tunnel, warp, or jitter at high latitudes.

**Sheet rendering** (local plane in ENU frame):

```javascript
renderSheet(sheet) {
    // Anchor position
    const position = Cesium.Cartesian3.fromDegrees(sheet.lon, sheet.lat, sheet.alt);
    
    // Local ENU frame (East-North-Up tangent plane)
    const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    
    // Sheet dimensions (proportional to branch radius)
    const width = branchRadius * 6;
    const height = branchRadius * 7.5;
    const depth = branchRadius * 0.25;
    
    // Create local box geometry (thin slab)
    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        dimensions: new Cesium.Cartesian3(width, height, depth),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    // Orient perpendicular to branch tangent
    const branchTangent = this.getBranchTangentAtTip(branch);
    const rotationQuat = Cesium.Quaternion.fromAxisAngle(branchTangent, 0);
    const rotationMatrix = Cesium.Matrix3.fromQuaternion(rotationQuat);
    
    // Combine ENU frame + orientation
    const modelMatrix = Cesium.Matrix4.multiplyByMatrix3(
        enuFrame,
        rotationMatrix,
        new Cesium.Matrix4()
    );
    
    // Offset slightly behind filament endpoints
    const offset = Cesium.Cartesian3.multiplyByScalar(
        branchTangent,
        -depth,
        new Cesium.Cartesian3()
    );
    Cesium.Matrix4.multiplyByPoint(modelMatrix, offset, offset);
    Cesium.Matrix4.setTranslation(modelMatrix, offset, modelMatrix);
    
    const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: modelMatrix,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.fromCssColorString('#00CED1').withAlpha(0.3)
                )
            }
        }),
        appearance: new Cesium.PerInstanceColorAppearance({
            closed: true,
            translucent: true
        })
    });
    
    viewer.scene.primitives.add(primitive);
}
```

**Critical**: Do NOT use `Cesium.RectangleGeometry` for sheets. RectangleGeometry is geographic-space (map patches), not local planes attached to branch tangents.

**Cell rendering** (instanced with performance cap):

**Performance Rule (Locked)**:
- **Max visible cells per frame**: 10,000 instances
- **Fallback**: Above cap, render sheet as **heatmap texture** showing cell density/state
- **LOD gate**: Cells ONLY visible at CELL level (< 500m altitude)

```javascript
renderCells(cells, lodLevel) {
    if (lodLevel !== 'CELL') {
        // Above CELL LOD: show aggregate heatmap
        this.renderSheetHeatmap(cells);
        return;
    }
    
    // Filter visible cells (frustum culling + distance)
    const visibleCells = this.getVisibleCells(cells);
    
    if (visibleCells.length > 10000) {
        // Too many cells, use heatmap fallback
        this.renderSheetHeatmap(cells);
        return;
    }
    
    // Render as instanced boxes
    const instances = visibleCells.map(cell => new Cesium.GeometryInstance({
        geometry: Cesium.BoxGeometry.fromDimensions({
            dimensions: new Cesium.Cartesian3(cellSize, cellSize, cellThickness)
        }),
        modelMatrix: Cesium.Matrix4.fromTranslation(cellPosition),
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(cellColor)
        }
    }));
    
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance()
    });
    
    viewer.scene.primitives.add(primitive);
}

renderSheetHeatmap(cells) {
    // Fallback: render sheet as colored texture showing cell state/density
    // (Aggregate representation, not individual cells)
}
```

**Why**: Without this cap, performance degrades below "normal systems" and breaks Relay's advantage.

### CesiumBoundaryRenderer

**Located**: `app/renderers/boundary-renderer.js`

**GeoJSON → Cesium Polygon**:
```javascript
renderBoundary(boundary) {
    const positions = boundary.geojson.coordinates[0].map(([lon, lat]) =>
        Cesium.Cartesian3.fromDegrees(lon, lat, 0)
    );
    
    // Close zoom: extruded polygon (3D shell)
    if (lodLevel === 'REGION' || lodLevel === 'COMPANY') {
        const polygon = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(positions),
            extrudedHeight: 5000,  // extrude to 5km
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });
    }
    
    // Far zoom: outline only
    else {
        const polyline = new Cesium.PolylineGeometry({
            positions,
            width: 2
        });
    }
}
```

**containsLL(lat, lon)** - Point-in-polygon with MultiPolygon + holes support:

```javascript
containsLL(boundary, lat, lon) {
    const point = [lon, lat];
    const geojson = boundary.geojson;
    
    // Handle MultiPolygon (e.g., countries with islands)
    if (geojson.type === 'MultiPolygon') {
        return geojson.coordinates.some(polygon =>
            this.pointInPolygon(point, polygon)
        );
    }
    
    // Handle single Polygon
    if (geojson.type === 'Polygon') {
        return this.pointInPolygon(point, geojson.coordinates);
    }
    
    return false;
}

pointInPolygon(point, rings) {
    // First ring is outer boundary
    const outerRing = rings[0];
    
    // Check if point is in outer ring
    if (!this.raycast(point, outerRing)) {
        return false;  // Outside outer boundary
    }
    
    // Check if point is in any hole (remaining rings are holes)
    for (let i = 1; i < rings.length; i++) {
        if (this.raycast(point, rings[i])) {
            return false;  // Inside a hole, therefore outside polygon
        }
    }
    
    return true;  // Inside outer ring, not in any hole
}

raycast(point, ring) {
    // Standard ray casting algorithm
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
            (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    return inside;
}
```

**Critical**: Real country boundaries are often MultiPolygon (with islands) and contain holes (enclaves). Single-ring implementation will fail.

### VoteOverlayRenderer

**Located**: `app/renderers/vote-renderer.js`

**Heat billboards**:
```javascript
renderVotes(votes, lodLevel) {
    votes.forEach(vote => {
        if (lodLevel !== 'REGION' && lodLevel !== 'COMPANY') return;  // only at close zoom
        
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(vote.lon, vote.lat, 100),
            billboard: {
                image: this.generateHeatIcon(vote.metadata.support),
                scale: 1.0,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            },
            label: {
                text: vote.metadata.parameter,
                font: '12pt sans-serif',
                pixelOffset: new Cesium.Cartesian2(0, -30)
            }
        });
    });
}
```

### WeatherOverlayRenderer

**Located**: `app/renderers/weather-renderer.js`

**Imagery layer**:
```javascript
renderWeather(weather) {
    const layer = new Cesium.SingleTileImageryProvider({
        url: weather.overlayUrl,
        rectangle: Cesium.Rectangle.fromDegrees(
            weather.samplingGrid.bounds.west,
            weather.samplingGrid.bounds.south,
            weather.samplingGrid.bounds.east,
            weather.samplingGrid.bounds.north
        )
    });
    
    viewer.imageryLayers.addImageryProvider(layer);
}
```

---

## LOD System

### Cesium Handles Tiles

Cesium's internal LOD system manages:
- Terrain tile refinement
- Imagery tile loading
- 3D building detail

**Relay does NOT interfere** with Cesium's tile LOD.

### Relay LOD Governor Handles Filament Detail

**Located**: `core/services/lod-governor.js`

**Camera height bands** (altitude above ground):

| Level | In Threshold | Out Threshold | Purpose |
|-------|--------------|---------------|---------|
| LANIAKEA | 400km+ | 450km+ | Space view |
| PLANETARY | 100-400km | 120-450km | Continental |
| REGION | 50-100km | 60-120km | Regional |
| COMPANY | 15-50km | 18-60km | City |
| SHEET | 5-15km | 6-18km | Building |
| CELL | 0-5km | 0-6km | Detail |

**Hysteresis** prevents thrashing:
- **Zoom in**: Use `inThreshold`
- **Zoom out**: Use `outThreshold`
- Result: Dead zone between transitions

**Subscriber pattern**:
```javascript
lodGovernor.subscribe((newLevel, oldLevel) => {
    filamentRenderer.setLOD(newLevel);
    boundaryRenderer.setLOD(newLevel);
    voteRenderer.setLOD(newLevel);
});

// In render loop
const height = getCameraHeightAboveGround(viewer);
lodGovernor.update(height);
```

**What each level shows**:

| Level | Filaments | Boundaries | Votes | Sheets | Cells |
|-------|-----------|------------|-------|--------|-------|
| LANIAKEA | Hidden | Outlines | Hidden | Hidden | Hidden |
| PLANETARY | Thin lines | Simplified | Hidden | Hidden | Hidden |
| REGION | Ribbons | Extruded | Heat icons | Points | Hidden |
| COMPANY | Tubes | Extruded | Heat + labels | Rectangles | Hidden |
| SHEET | Full tubes | Extruded | Full | Full | Points |
| CELL | Segmented | Full | Full | Full | Tiles + labels |

---

## Interaction Model

### Click Building → Show Anchored Filament Tree

**Handler** (using real Cesium 3D Tiles features):

```javascript
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction((click) => {
    const pickedFeature = viewer.scene.pick(click.position);
    
    // Check if picked a 3D Tiles feature (building)
    if (pickedFeature && pickedFeature instanceof Cesium.Cesium3DTileFeature) {
        // Extract building identity from 3D Tiles feature
        const buildingKey = 
            pickedFeature.getProperty('id') ||
            pickedFeature.getProperty('osmId') ||
            pickedFeature.getProperty('featureId') ||
            `building-${pickedFeature.primitive.url}-${pickedFeature.featureId}`;
        
        // Map to RelayState anchor
        const anchor = relayState.anchors[buildingKey];
        
        if (anchor && anchor.treeId) {
            const tree = relayState.tree.nodes.find(n => n.id === anchor.treeId);
            
            if (tree) {
                // Highlight tree
                filamentRenderer.highlightTree(tree.id);
                
                // Fly to tree location
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                        tree.lon, 
                        tree.lat, 
                        5000
                    ),
                    duration: 2.0
                });
            }
        } else {
            // No tree anchored to this building
            showTooltip(`Building ${buildingKey}: No Relay tree anchored`);
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

**Implementation requirement**:
- Add `relayState.anchors = {}` mapping:
  ```javascript
  {
      'building-osm-12345': { treeId: 'tree-companyA', branchId: 'branch-0' },
      'building-osm-67890': { treeId: 'tree-companyB', branchId: 'branch-1' }
  }
  ```
- Populate during tree creation or via configuration file

**Critical**: OSM Buildings don't have `.id.type === 'building'`. Must use feature properties.

### Click Sheet → Inspector

**Inspector panel**:
```javascript
showSheetInspector(sheet) {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.innerHTML = `
        <h3>Sheet: ${sheet.name}</h3>
        <p><strong>Parent:</strong> ${sheet.parent}</p>
        <p><strong>Location:</strong> ${sheet.lat.toFixed(4)}, ${sheet.lon.toFixed(4)}</p>
        <p><strong>Cells:</strong> ${sheet.metadata.rows} × ${sheet.metadata.cols}</p>
        <p><strong>Filaments:</strong> ${countFilaments(sheet.id)}</p>
        <button onclick="zoomToSheet('${sheet.id}')">Zoom In</button>
    `;
    infoPanel.style.display = 'block';
}
```

### Click Cell → Commits/Timeboxes/ERI

**Cell detail**:
```javascript
showCellDetail(cell) {
    const commits = getCommitsForCell(cell.id);
    const timeboxes = getTimeboxesForCell(cell.id);
    const eri = calculateERI(cell);
    
    infoPanel.innerHTML = `
        <h3>Cell: ${cell.ref}</h3>
        <p><strong>Value:</strong> ${cell.value}</p>
        <p><strong>Formula:</strong> ${cell.formula || 'None'}</p>
        <p><strong>ERI:</strong> ${eri.toFixed(2)}</p>
        
        <h4>Commits (${commits.length})</h4>
        <ul>${commits.map(c => `<li>${c.timestamp}: ${c.message}</li>`).join('')}</ul>
        
        <h4>Timeboxes (${timeboxes.length})</h4>
        <ul>${timeboxes.map(t => `<li>${t.state}: ${t.commitRange}</li>`).join('')}</ul>
    `;
}
```

### HUD Keys and Modes

| Key | Action |
|-----|--------|
| `H` | Toggle HUD (LOD, altitude, node count, FPS) |
| `L` | Toggle log console |
| `I` | Show info panel (tree stats) |
| `T` | Fly to tree anchor |
| `Z` | Zoom to context (auto-altitude for full tree) |
| `F` | Focus on nearest sheet |

---

## Safety / Governance Locks

### No Mixed Render Engines

**Rule**: Only Cesium. No Three.js, no secondary WebGL contexts.

**Enforcement**: Code review + architectural decision record.

### core/ Cannot Import Cesium (Lock F)

**Rule**: `core/**` must be renderer-agnostic.

**Enforcement**:
```javascript
// ❌ FORBIDDEN in core/
import Cesium from 'cesium';

// ✅ ALLOWED in core/
export class RelayLODGovernor {
    update(cameraHeight) {  // height passed in, no Cesium knowledge
        const level = this.determineLODLevel(cameraHeight);
        this.subscribers.forEach(cb => cb(level));
    }
}
```

**Linter rule** (planned):
```json
{
    "rules": {
        "no-restricted-imports": ["error", {
            "patterns": [{
                "group": ["cesium"],
                "importNames": ["*"],
                "message": "core/ cannot import Cesium (Lock F)"
            }]
        }]
    }
}
```

### Learning Produces Recommendations Only

**Rule**: AI/ML never auto-applies changes. Always recommends → human approves.

**Implementation**:
```javascript
// AI suggests formula optimization
const recommendation = await aiService.analyzeFormula(cell.formula);

// Store recommendation, don't apply
cell.recommendations.push({
    type: 'optimization',
    suggestion: recommendation.optimizedFormula,
    confidence: recommendation.confidence,
    status: 'pending-approval'
});

// Human reviews and approves
if (userApproves(recommendation)) {
    applyRecommendation(cell, recommendation);
}
```

### Minimization / Purpose Limitation (Privacy)

**Rule**: Collect only data required for stated purpose. Delete when no longer needed.

**Implementation**:
```javascript
// Good: collect only what's needed
const userData = {
    userId: user.id,
    voteCast: vote.id,
    timestamp: Date.now()
};

// Bad: collect unnecessary data
// const userData = {
//     userId, email, name, location, voteCast, timestamp, browser, IP
// };
```

### Refusal-First Behavior

**Rule**: When uncertain, refuse operation. Explicit approval required.

**Implementation**:
```javascript
function deleteUserData(userId, reason) {
    if (!isExplicitDeletionRequest(reason)) {
        throw new Error('Refusal: deletion requires explicit user request');
    }
    
    if (!hasUserApproval(userId, 'data-deletion')) {
        throw new Error('Refusal: deletion requires user approval');
    }
    
    // Only proceed with explicit approval
    performDeletion(userId);
}
```

---

## Gates / Tests

### Boot Gate Definition

**Located**: `scripts/boot-gate-test.mjs`

**Must pass ALL**:
1. ✅ Cesium viewer exists (`window.viewer !== undefined`)
2. ✅ Terrain + imagery loaded (no errors)
3. ✅ 3D buildings visible
4. ✅ Excel import system ready (drop zone exists)
5. ✅ No JavaScript errors in console

**Run**: `npm run boot-gate`

### LOD Thrash Test

**Purpose**: Verify hysteresis prevents rapid level switching.

**Test**:
```javascript
describe('LOD Hysteresis', () => {
    it('should not thrash when height oscillates near threshold', () => {
        const governor = new RelayLODGovernor();
        const levels = [];
        
        governor.subscribe(level => levels.push(level));
        
        // Oscillate around 50km threshold (REGION ↔ PLANETARY)
        governor.update(49000);  // REGION (in)
        governor.update(51000);  // Still REGION (hysteresis)
        governor.update(49000);  // Still REGION
        governor.update(51000);  // Still REGION
        governor.update(61000);  // PLANETARY (out threshold crossed)
        
        expect(levels).toEqual(['REGION', 'PLANETARY']);  // only 2 transitions
    });
});
```

### containsLL Correctness Test

**Purpose**: Verify point-in-polygon accuracy.

**Test**:
```javascript
describe('containsLL', () => {
    it('should correctly identify points inside polygon', () => {
        const israel = loadBoundary('ISR');
        
        expect(containsLL(israel, 32.0853, 34.7818)).toBe(true);  // Tel Aviv (inside)
        expect(containsLL(israel, 51.5074, -0.1278)).toBe(false);  // London (outside)
    });
    
    it('should handle edge cases', () => {
        const boundary = simpleBoundary();
        
        // Point on boundary edge
        const edge = boundary.geojson.coordinates[0][0];
        expect(containsLL(boundary, edge[1], edge[0])).toBe(true);
    });
});
```

### "One World" Test

**Purpose**: Ensure no second viewer/scene is created.

**Test**:
```javascript
describe('One World Invariant', () => {
    it('should have exactly one Cesium viewer', () => {
        const viewerCount = document.querySelectorAll('.cesium-viewer').length;
        expect(viewerCount).toBe(1);
    });
    
    it('should not create Three.js renderer', () => {
        expect(window.THREE).toBeUndefined();
        expect(document.querySelector('canvas[data-engine="three"]')).toBeNull();
    });
});
```

---

## Summary

**Relay Cesium Architecture** is:
- **Globe-first**: Earth is the product, not decoration
- **Single scene**: One Cesium viewer, no fragmentation
- **Renderer-agnostic core**: Pure data in `core/`, adapters in `app/`
- **LOD-governed**: Camera height controls detail, hysteresis prevents thrash
- **Topologically correct**: Staged bundling, discrete time, no hubs
- **Safe**: Refusal-first, privacy-aware, learning-only-recommends

**Complete implementation roadmap**: See [ROADMAP-CESIUM-FIRST.md](../implementation/ROADMAP-CESIUM-FIRST.md)

---

*This architecture enables a world where organizations are spatial, data is visible, and governance is explicit.*
