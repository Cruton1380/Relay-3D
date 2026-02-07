# Cesium Migration Plan: One Final Application

**Date**: 2026-02-06  
**Decision**: ✅ **Cesium is the single world renderer** (not Three.js)  
**Goal**: Migrate filament system INTO Cesium, restore terrain + buildings, enable zoom anywhere

---

## Why Cesium (Not Three.js)

### Product Requirements (User Stated):
> "The globe is the product! We need to be able to zoom in anywhere on the map, see real terrain and buildings from above, and map filament structures to each of them and enable users to zoom down to interact with them."

### What This Requires:
- ✅ Real map tiles (satellite imagery)
- ✅ Real terrain elevation (DEM)
- ✅ 3D buildings (OSM Buildings / 3D Tiles)
- ✅ Zoom anywhere on Earth (planetary → street level)
- ✅ Correct lat/lon anchoring for filaments
- ✅ Consistent LOD and picking

### Why Three.js Cannot Do This:
- ❌ No built-in terrain streaming
- ❌ No 3D Tiles support (would need custom implementation)
- ❌ No WGS84 ellipsoid math (sphere approximation only)
- ❌ Manual tile LOD system required
- **Verdict**: Would require rebuilding Cesium inside Three.js (not feasible)

### Why Cesium Can Do This:
- ✅ Built-in terrain streaming (Cesium World Terrain)
- ✅ 3D Tiles support (OSM Buildings, Google Photorealistic 3D)
- ✅ WGS84 ellipsoid math (precise lat/lon → Cartesian3)
- ✅ Automatic tile LOD + frustum culling
- ✅ Camera constraints (prevent underground, etc.)
- **Verdict**: Designed exactly for this use case

---

## Current State vs Target State

### Current State (Incompatible):

| Component | Tech | Status |
|-----------|------|--------|
| Filaments/Sheets/Cells | Three.js meshes | ✅ Working in prototype |
| Globe | Three.js SphereGeometry | ⚠️ Placeholder (no terrain) |
| Boundaries | Not implemented | ❌ Missing |
| Buildings | None | ❌ Missing |
| Votes | Not implemented | ❌ Missing |

**Problem**: Three.js prototype has filaments working, but cannot show real terrain/buildings without massive effort.

---

### Target State (Unified):

| Component | Tech | Implementation |
|-----------|------|----------------|
| Globe | Cesium.Globe | Real terrain + imagery |
| Buildings | Cesium 3D Tiles | OSM Buildings / Google 3D |
| Filaments | Cesium PolylineVolume | Tubes following lat/lon paths |
| Sheets | Cesium Rectangle/Plane | Oriented in local ENU frame |
| Cells | Cesium instanced geometry | Thin boxes on sheet surface |
| Timeboxes | Segmented Cesium Polylines | Different materials per segment |
| Boundaries | Cesium Polygon extrusion | GeoJSON → Cesium Primitive |
| Votes | Cesium Entities/Billboards | Heat overlays + labels |
| Weather | Cesium ImageryLayer | WMS overlay |

**Result**: One scene graph (Cesium.Viewer.scene), all features native to Cesium.

---

## Migration Strategy: 5 Phases

### Phase 0: Preserve Relay Data Model (Architecture Lock)

**Critical**: Keep Relay state **renderer-agnostic**.

```javascript
// ✅ GOOD: Renderer-agnostic state
const relayState = {
  tree: {
    nodes: [
      { id: 'trunk.northwind', type: 'trunk', anchor: { lat: 32.08, lon: 34.78, alt: 0 } },
      { id: 'branch.finance', type: 'branch', parent: 'trunk.northwind', position: [...] },
      { id: 'sheet.feb2026', type: 'sheet', parent: 'branch.finance', data: [...] }
    ]
  },
  boundaries: [...],
  votes: [...]
};

// ✅ GOOD: Adapter pattern
class CesiumFilamentRenderer {
  render(relayState, cesiumScene) {
    relayState.tree.nodes.forEach(node => {
      if (node.type === 'branch') {
        this.renderBranch(node, cesiumScene);
      }
      // ...
    });
  }
}

// ❌ BAD: Coupling Cesium-specific data to state
const relayState = {
  tree: {
    cesiumPrimitives: [...],  // ❌ Don't store Cesium objects in state
    threeMeshes: [...]        // ❌ Don't store renderer objects
  }
};
```

**Rule**: `RelayState` is just data. Renderer adapters transform it into visuals.

---

### Phase 1: Restore v93 Cesium Base (1-2 days)

**Goal**: Get the v93 Cesium globe working in current workspace.

#### Files to Restore:
1. `src/frontend/components/main/globe/InteractiveGlobe.jsx` (main component)
2. `src/frontend/components/main/globe/managers/GlobeInitializer.js` (Cesium setup)
3. `src/frontend/components/main/globe/managers/GlobeControls.js` (camera)
4. Dependencies: `cesium`, `react`, `react-dom`

#### Configuration:
```javascript
// GlobeInitializer.js - configure terrain + imagery
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrainProvider: Cesium.createWorldTerrain(),
  imageryProvider: new Cesium.IonImageryProvider({ assetId: 3 }), // Bing satellite
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false
});

// Add OSM Buildings (3D Tiles)
const osmBuildings = viewer.scene.primitives.add(
  Cesium.createOsmBuildings()
);
```

#### Test:
- Viewer loads with real terrain
- Can zoom from space to street level
- 3D buildings appear at close zoom
- Camera controls work (click-drag, scroll-zoom)

**Deliverable**: Cesium viewer running, showing Earth with terrain + buildings.

---

### Phase 2: Build FilamentRenderer for Cesium (3-5 days)

**Goal**: Render filaments as Cesium-native geometry.

#### A) Coordinate Conversion

```javascript
class CesiumCoordinateSystem {
  // Relay anchor (lat/lon/alt) → Cesium world position
  static anchorToCartesian3(anchor) {
    return Cesium.Cartesian3.fromDegrees(
      anchor.lon,
      anchor.lat,
      anchor.alt
    );
  }
  
  // Compute local ENU (East-North-Up) frame at anchor
  static computeLocalFrame(anchor) {
    const position = this.anchorToCartesian3(anchor);
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    return transform;
  }
  
  // Convert local offset to world Cartesian3
  static localToWorld(anchor, localOffset) {
    const transform = this.computeLocalFrame(anchor);
    const offset4 = new Cesium.Cartesian4(localOffset.x, localOffset.y, localOffset.z, 1);
    const world4 = Cesium.Matrix4.multiplyByVector(transform, offset4, new Cesium.Cartesian4());
    return new Cesium.Cartesian3(world4.x, world4.y, world4.z);
  }
}
```

#### B) Branch/Trunk Rendering

**Far zoom** (>50km): Thin polylines
```javascript
function renderBranchAsFarPolyline(node, scene) {
  const positions = node.curvePoints.map(p => 
    CesiumCoordinateSystem.localToWorld(node.anchor, p)
  );
  
  scene.primitives.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: positions,
        width: 2.0
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromCssColorString(node.color)
        )
      }
    }),
    appearance: new Cesium.PolylineColorAppearance()
  }));
}
```

**Near zoom** (<5km): Tube volumes
```javascript
function renderBranchAsNearTube(node, scene) {
  const positions = node.curvePoints.map(p => 
    CesiumCoordinateSystem.localToWorld(node.anchor, p)
  );
  
  // Tapered radius function
  const radiusFunction = (t) => {
    return node.baseRadius * (0.5 + t * 0.5); // Taper from 0.5x to 1.0x
  };
  
  scene.primitives.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineVolumeGeometry({
        polylinePositions: positions,
        shapePositions: createCircleShape(node.baseRadius), // Circle cross-section
        cornerType: Cesium.CornerType.ROUNDED
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromCssColorString(node.color).withAlpha(0.7)
        )
      }
    }),
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true
    })
  }));
}

function createCircleShape(radius) {
  const positions = [];
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(new Cesium.Cartesian2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ));
  }
  return positions;
}
```

#### C) Sheet Rendering

**Sheets as planes** (oriented in local ENU frame):
```javascript
function renderSheet(node, scene) {
  const anchor = node.anchor; // { lat, lon, alt }
  const transform = CesiumCoordinateSystem.computeLocalFrame(anchor);
  
  // Create rectangle in local frame
  const width = node.sheetWidth;
  const height = node.sheetHeight;
  
  scene.primitives.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(
          anchor.lon - width / 200000,  // Approximate degrees
          anchor.lat - height / 200000,
          anchor.lon + width / 200000,
          anchor.lat + height / 200000
        ),
        height: anchor.alt,
        extrudedHeight: anchor.alt + node.sheetDepth
      }),
      modelMatrix: transform, // Orient using local ENU
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromCssColorString(node.color).withAlpha(0.3)
        )
      }
    }),
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true
    })
  }));
}
```

#### D) Cell Rendering

**Instanced boxes** (only at close zoom):
```javascript
function renderCells(sheetNode, scene) {
  const instances = [];
  
  sheetNode.cells.forEach((cell, index) => {
    const localPos = cell.localPosition; // {x, y, z} in sheet-local coords
    const worldPos = CesiumCoordinateSystem.localToWorld(sheetNode.anchor, localPos);
    
    instances.push(new Cesium.GeometryInstance({
      geometry: Cesium.BoxGeometry.fromDimensions({
        dimensions: new Cesium.Cartesian3(cell.size, cell.size, cell.thickness)
      }),
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(worldPos),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          getCellColor(cell.eri)
        )
      },
      id: cell.id // For picking
    }));
  });
  
  scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true
    })
  }));
}

function getCellColor(eri) {
  if (eri >= 80) return Cesium.Color.CYAN.withAlpha(0.6);
  if (eri >= 50) return Cesium.Color.SKYBLUE.withAlpha(0.6);
  return Cesium.Color.PURPLE.withAlpha(0.6);
}
```

#### E) Timebox Segmentation

**Segmented polylines** with different materials:
```javascript
function renderSegmentedFilament(filamentNode, scene) {
  const timeboxes = filamentNode.timeboxes;
  
  timeboxes.forEach((timebox, index) => {
    const segmentPositions = filamentNode.curvePoints.slice(
      timebox.startIndex,
      timebox.endIndex + 1
    ).map(p => CesiumCoordinateSystem.localToWorld(filamentNode.anchor, p));
    
    // Segment filament
    scene.primitives.add(new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineVolumeGeometry({
          polylinePositions: segmentPositions,
          shapePositions: createCircleShape(filamentNode.radius)
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            getTimeboxColor(timebox.state)
          )
        }
      }),
      appearance: new Cesium.PerInstanceColorAppearance()
    }));
    
    // Boundary marker (ring at segment joint)
    if (index < timeboxes.length - 1) {
      const boundaryPos = segmentPositions[segmentPositions.length - 1];
      scene.primitives.add(new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.CylinderGeometry({
            length: 0.02,
            topRadius: filamentNode.radius * 2.2,
            bottomRadius: filamentNode.radius * 2.2
          }),
          modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(boundaryPos)
        }),
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: Cesium.Color.YELLOW.withAlpha(0.8)
          })
        })
      }));
    }
  });
}

function getTimeboxColor(state) {
  switch (state) {
    case 'ACTIVE': return Cesium.Color.GREEN.withAlpha(0.7);
    case 'DRIFT': return Cesium.Color.ORANGE.withAlpha(0.7);
    case 'SCAR': return Cesium.Color.RED.withAlpha(0.7);
    default: return Cesium.Color.CYAN.withAlpha(0.7);
  }
}
```

**Deliverable**: Filaments/sheets/cells rendering in Cesium at correct lat/lon anchors.

---

### Phase 3: Implement Relay LOD Governor (2-3 days)

**Goal**: Control visibility based on camera height (with hysteresis).

```javascript
class RelayLODGovernor {
  constructor(cesiumViewer) {
    this.viewer = cesiumViewer;
    this.currentLevel = null;
    this.subscribers = [];
    
    // LOD thresholds (camera height above ground in meters)
    this.thresholds = {
      LANIAKEA: { in: 400000, out: 450000 },
      PLANETARY: { in: 100000, out: 120000 },
      REGION: { in: 50000, out: 60000 },
      COMPANY: { in: 15000, out: 18000 },
      SHEET: { in: 5000, out: 6000 },
      CELL: { in: 0, out: 0 } // Always show when <5000m
    };
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
  
  update() {
    const cameraHeight = this.getCameraHeightAboveGround();
    const newLevel = this.determineLODLevel(cameraHeight);
    
    if (newLevel !== this.currentLevel) {
      console.log(`[LOD] Switching from ${this.currentLevel} → ${newLevel}`);
      this.currentLevel = newLevel;
      
      // Notify all subscribers
      this.subscribers.forEach(callback => callback(newLevel));
    }
  }
  
  getCameraHeightAboveGround() {
    const camera = this.viewer.camera;
    const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    const height = cartographic.height;
    
    // Get terrain height at camera position
    const terrainProvider = this.viewer.terrainProvider;
    const terrainHeight = this.viewer.scene.globe.getHeight(cartographic) || 0;
    
    return height - terrainHeight;
  }
  
  determineLODLevel(height) {
    // Hysteresis: use different thresholds for switching in vs out
    const current = this.currentLevel;
    
    if (height > this.thresholds.LANIAKEA.in) {
      return 'LANIAKEA';
    } else if (height > this.thresholds.PLANETARY.in && 
               (current !== 'LANIAKEA' || height < this.thresholds.LANIAKEA.out)) {
      return 'PLANETARY';
    } else if (height > this.thresholds.REGION.in && 
               (current !== 'PLANETARY' || height < this.thresholds.PLANETARY.out)) {
      return 'REGION';
    } else if (height > this.thresholds.COMPANY.in && 
               (current !== 'REGION' || height < this.thresholds.REGION.out)) {
      return 'COMPANY';
    } else if (height > this.thresholds.SHEET.in && 
               (current !== 'COMPANY' || height < this.thresholds.COMPANY.out)) {
      return 'SHEET';
    } else {
      return 'CELL';
    }
  }
  
  startMonitoring() {
    // Update LOD on camera move
    this.viewer.camera.moveEnd.addEventListener(() => {
      this.update();
    });
    
    // Initial update
    this.update();
  }
}
```

**Usage**:
```javascript
const lodGovernor = new RelayLODGovernor(viewer);

// Subscribe renderers
lodGovernor.subscribe((level) => {
  // Update filament detail
  if (level === 'LANIAKEA' || level === 'PLANETARY') {
    filamentRenderer.useFarPolylines();
  } else if (level === 'REGION' || level === 'COMPANY') {
    filamentRenderer.useNearTubes();
  } else {
    filamentRenderer.useFullDetail();
  }
  
  // Update sheet visibility
  if (level === 'SHEET' || level === 'CELL') {
    sheetRenderer.show();
  } else {
    sheetRenderer.hide();
  }
  
  // Update cell visibility
  if (level === 'CELL') {
    cellRenderer.show();
  } else {
    cellRenderer.hide();
  }
});

lodGovernor.startMonitoring();
```

**Deliverable**: LOD system with hysteresis controlling visibility of all layers.

---

### Phase 4: Add Picking & Interaction (1-2 days)

**Goal**: Click buildings/filaments to interact.

```javascript
class RelayPickHandler {
  constructor(cesiumViewer, relayState) {
    this.viewer = cesiumViewer;
    this.state = relayState;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    // Left click: Select object
    this.handler.setInputAction((click) => {
      const pickedObject = this.viewer.scene.pick(click.position);
      
      if (Cesium.defined(pickedObject)) {
        this.handlePick(pickedObject);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    // Hover: Show tooltip
    this.handler.setInputAction((movement) => {
      const pickedObject = this.viewer.scene.pick(movement.endPosition);
      
      if (Cesium.defined(pickedObject)) {
        this.showTooltip(pickedObject, movement.endPosition);
      } else {
        this.hideTooltip();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
  
  handlePick(pickedObject) {
    const id = pickedObject.id || pickedObject.primitive?.id;
    
    if (!id) return;
    
    // Find corresponding Relay object
    const relayObject = this.state.tree.nodes.find(n => n.id === id);
    
    if (!relayObject) return;
    
    console.log('[Pick] Selected:', relayObject);
    
    // Handle different object types
    switch (relayObject.type) {
      case 'cell':
        this.zoomToCell(relayObject);
        this.showCellInspector(relayObject);
        break;
      case 'sheet':
        this.zoomToSheet(relayObject);
        this.showSheetOverview(relayObject);
        break;
      case 'branch':
        this.highlightBranch(relayObject);
        break;
      case 'building':
        this.showBuildingFilaments(relayObject);
        break;
    }
  }
  
  zoomToCell(cell) {
    const position = CesiumCoordinateSystem.anchorToCartesian3(cell.anchor);
    
    this.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 2.0
    });
  }
  
  showBuildingFilaments(building) {
    // Find all filaments anchored to this building
    const filaments = this.state.tree.nodes.filter(n => 
      n.type === 'trunk' && 
      n.anchor.buildingId === building.id
    );
    
    console.log(`[Pick] Building has ${filaments.length} filament trees`);
    
    // Highlight them
    filaments.forEach(f => this.highlightFilament(f));
  }
}
```

**Deliverable**: Clicking buildings shows their filament trees, clicking cells zooms in.

---

### Phase 5: Restore Boundaries + Votes + Weather (2-3 days)

#### A) Boundary Extrusion (GeoJSON → Cesium Primitives)

```javascript
class CesiumBoundaryRenderer {
  constructor(cesiumViewer) {
    this.viewer = cesiumViewer;
    this.boundaries = [];
  }
  
  async loadBoundary(geojsonPath, options = {}) {
    const response = await fetch(geojsonPath);
    const geojson = await response.json();
    
    const feature = geojson.features[0];
    const coordinates = feature.geometry.coordinates[0]; // First ring
    
    // Convert to Cartesian3
    const positions = [];
    for (let i = 0; i < coordinates.length; i++) {
      const [lon, lat] = coordinates[i];
      positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, options.height || 0));
    }
    
    // Create polygon
    const polygon = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(positions),
      extrudedHeight: options.extrudedHeight || 1000, // Extrude 1km
      perPositionHeight: false
    });
    
    const primitive = this.viewer.scene.primitives.add(new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: polygon,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(options.color || '#00aaff').withAlpha(0.3)
          )
        },
        id: feature.properties.name
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: true,
        closed: false
      })
    }));
    
    this.boundaries.push({ primitive, feature });
    
    return primitive;
  }
  
  // containsLL implementation using Cesium's built-in
  containsLL(boundaryId, lat, lon) {
    const boundary = this.boundaries.find(b => b.feature.properties.name === boundaryId);
    if (!boundary) return false;
    
    const position = Cesium.Cartesian3.fromDegrees(lon, lat);
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    
    // Use Cesium's polygon containment
    const coordinates = boundary.feature.geometry.coordinates[0];
    return this.pointInPolygon(cartographic, coordinates);
  }
  
  pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point.latitude) !== (yj > point.latitude)) &&
        (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
```

#### B) Vote Overlays

```javascript
class CesiumVoteRenderer {
  constructor(cesiumViewer) {
    this.viewer = cesiumViewer;
    this.voteEntities = [];
  }
  
  renderVotes(votes) {
    // Clear existing
    this.voteEntities.forEach(e => this.viewer.entities.remove(e));
    this.voteEntities = [];
    
    votes.forEach(vote => {
      const entity = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(vote.lon, vote.lat, vote.height || 0),
        billboard: {
          image: this.createVoteBillboardCanvas(vote),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: vote.label,
          font: '14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10)
        }
      });
      
      this.voteEntities.push(entity);
    });
  }
  
  createVoteBillboardCanvas(vote) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw heat circle
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(255, ${255 - vote.activity * 2}, 0, 0.9)`);
    gradient.addColorStop(1, `rgba(255, ${255 - vote.activity * 2}, 0, 0.0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return canvas;
  }
}
```

#### C) Weather Overlay

```javascript
class CesiumWeatherRenderer {
  constructor(cesiumViewer) {
    this.viewer = cesiumViewer;
    this.weatherLayer = null;
  }
  
  async addWeatherLayer(wmsUrl, layerName) {
    this.weatherLayer = this.viewer.imageryLayers.addImageryProvider(
      new Cesium.WebMapServiceImageryProvider({
        url: wmsUrl,
        layers: layerName,
        parameters: {
          transparent: true,
          format: 'image/png'
        }
      })
    );
    
    this.weatherLayer.alpha = 0.6; // Transparency
  }
  
  removeWeatherLayer() {
    if (this.weatherLayer) {
      this.viewer.imageryLayers.remove(this.weatherLayer);
      this.weatherLayer = null;
    }
  }
}
```

**Deliverable**: Boundaries, votes, and weather all rendering in Cesium.

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RELAY APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           RELAY STATE (Renderer-Agnostic)            │  │
│  │  - Tree nodes (trunk/branch/sheet/cell)             │  │
│  │  - Boundaries (GeoJSON polygons)                    │  │
│  │  - Votes (lat/lon/activity)                         │  │
│  │  - Weather (layer configs)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               CESIUM ADAPTER LAYER                   │  │
│  │  - CesiumFilamentRenderer                           │  │
│  │  - CesiumBoundaryRenderer                           │  │
│  │  - CesiumVoteRenderer                               │  │
│  │  - CesiumWeatherRenderer                            │  │
│  │  - RelayLODGovernor                                 │  │
│  │  - RelayPickHandler                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            CESIUM.VIEWER.SCENE (Single)              │  │
│  │  - Globe (terrain + imagery)                        │  │
│  │  - 3D Tiles (OSM Buildings)                         │  │
│  │  - Primitives (filaments/boundaries)                │  │
│  │  - Entities (votes/labels)                          │  │
│  │  - ImageryLayers (weather)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: One scene graph (Cesium), one state graph (Relay), adapter in between.

---

## Migration Checklist

### Phase 0: Architecture ✅
- [ ] Define renderer-agnostic RelayState schema
- [ ] Create adapter layer contracts (CesiumFilamentRenderer, etc.)
- [ ] Document coordinate conversion (lat/lon/alt → Cartesian3)

### Phase 1: Restore Cesium Base ✅
- [ ] Install Cesium dependencies
- [ ] Restore GlobeInitializer.js + InteractiveGlobe.jsx
- [ ] Configure terrain provider (Cesium World Terrain)
- [ ] Add OSM Buildings (3D Tiles)
- [ ] Test: Can zoom from space to street level

### Phase 2: Port Filaments to Cesium ✅
- [ ] Implement CesiumCoordinateSystem (lat/lon → Cartesian3)
- [ ] Implement branch rendering (PolylineGeometry far, PolylineVolume near)
- [ ] Implement sheet rendering (Rectangle in local ENU frame)
- [ ] Implement cell rendering (instanced boxes)
- [ ] Implement timebox segmentation (segmented polylines + boundary rings)
- [ ] Test: Filaments visible at correct GPS anchors

### Phase 3: Implement LOD Governor ✅
- [ ] Implement RelayLODGovernor class
- [ ] Define altitude thresholds (LANIAKEA → CELL)
- [ ] Add hysteresis (in/out thresholds)
- [ ] Subscribe all renderers to LOD updates
- [ ] Test: Smooth LOD transitions without thrashing

### Phase 4: Add Picking ✅
- [ ] Implement RelayPickHandler
- [ ] Enable cell picking → zoom + inspector
- [ ] Enable building picking → show filament trees
- [ ] Add hover tooltips
- [ ] Test: Click any object to interact

### Phase 5: Restore Overlays ✅
- [ ] Implement CesiumBoundaryRenderer (GeoJSON extrusion)
- [ ] Implement containsLL (point-in-polygon)
- [ ] Implement CesiumVoteRenderer (billboards + heat)
- [ ] Implement CesiumWeatherRenderer (WMS imagery layer)
- [ ] Test: All overlays visible and interactive

### Final Integration ✅
- [ ] Wire RelayState → adapters → Cesium scene
- [ ] Test end-to-end: Import spreadsheet → see filaments on real buildings
- [ ] Performance test: 1000+ filaments with LOD
- [ ] Verify: No renderer coupling in RelayState

---

## Success Criteria

✅ **Can zoom anywhere on Earth** (planetary → street level)  
✅ **Real terrain + 3D buildings visible** (Cesium World Terrain + OSM Buildings)  
✅ **Filaments anchor to GPS coordinates** (lat/lon/alt → Cartesian3)  
✅ **Filaments visible as tubes** (PolylineVolume geometry)  
✅ **Sheets oriented correctly** (local ENU frame)  
✅ **Cells visible at close zoom** (instanced geometry)  
✅ **Timeboxes segmented** (different materials per timebox)  
✅ **Boundaries extruded from GeoJSON** (Cesium Polygon primitives)  
✅ **containsLL works** (point-in-polygon for boundary containment)  
✅ **Votes rendered as heat overlays** (Cesium billboards)  
✅ **Weather overlay present** (Cesium ImageryLayer)  
✅ **LOD system with hysteresis** (no thrashing)  
✅ **Picking/interaction works** (click buildings → show filaments)  
✅ **One scene graph** (Cesium.Viewer.scene)  
✅ **Renderer-agnostic state** (RelayState → adapter → Cesium)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Cesium learning curve** | Start with v93 Cesium base (already working), adapt incrementally |
| **Performance with many filaments** | Use LOD aggressively, swap to polylines at far zoom |
| **Coordinate math complexity** | Use Cesium's built-in `Transforms.eastNorthUpToFixedFrame` |
| **Picking complexity** | Use Cesium's built-in `scene.pick()`, assign IDs to geometries |
| **Boundary extrusion cost** | Simplify polygons offline per LOD level |
| **Three.js prototype work lost** | NOT LOST: Relay data model + logic preserved, only renderer changes |

---

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 0: Architecture | 0.5 days | Define schemas + adapters |
| Phase 1: Cesium Base | 1-2 days | Restore v93, configure terrain |
| Phase 2: Filament Renderer | 3-5 days | Port to Cesium primitives |
| Phase 3: LOD Governor | 2-3 days | Implement hysteresis system |
| Phase 4: Picking | 1-2 days | Click handlers + interaction |
| Phase 5: Overlays | 2-3 days | Boundaries + votes + weather |
| **TOTAL** | **9-15 days** | ~2 weeks for one developer |

---

## One-Liner to Canon:

**"Cesium is the product renderer. Port filaments into Cesium primitives (PolylineVolume/Corridor/Polyline with LOD by camera height). Restore terrain + 3D tiles buildings. Implement ENU frames for sheet planes and segmented timebox geometry. No mixed-engine scene."**

---

**Canon: Cesium owns the world. Filaments become Cesium-native. One scene graph. LOD by altitude. Adapter preserves Relay state independence.**
