# 🗺 Relay Cesium-First Implementation Roadmap

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Active

This roadmap defines the **phase-ordered implementation** with **pass/fail gates** (no time estimates).

---

## 🔬 Proof Artifact Requirement (MANDATORY)

**Rule**: Every phase marked ✅ PASSED must have verifiable proof artifacts.

**Required Artifacts** (stored in `archive/proofs/`):
- Screenshot(s) showing the passing state
- Console log file (if relevant)
- Test output file (if automated test exists)
- Reference in `archive/proofs/PROOF-INDEX.md`

**Without proof**: Phase is NOT passed (even if someone claims it).

**Example**:
```
Phase 0: Cesium Boot ✅ PASSED
Proof:
- archive/proofs/phase0-boot-2026-02-06.png
- archive/proofs/phase0-console.log
- Referenced in archive/proofs/PROOF-INDEX.md
```

---

## Phase-Ordered Implementation

### Phase 0: Cesium World Boot ✅ COMPLETE

**Goal**: Cesium viewer loads with terrain, imagery, and buildings.

#### Inputs
- Cesium.js library (CDN)
- Cesium Ion token
- Target DOM container (`#cesiumContainer`)

#### Outputs
- `Cesium.Viewer` instance initialized
- Terrain provider loaded (World Terrain)
- Imagery provider loaded (Bing Maps Aerial)
- 3D Buildings layer added (OSM Buildings)
- Camera positioned at initial location (Tel Aviv, 15km altitude)
- Fog, lighting, depth test configured

#### Pass/Fail Checks
- ✅ `window.viewer` exists and is `Cesium.Viewer` instance
- ✅ Terrain visible (elevation data rendered)
- ✅ Imagery visible (satellite photos)
- ✅ 3D buildings visible (at close zoom)
- ✅ No JavaScript errors in console
- ✅ Camera responds to mouse/touch input

#### Blocked By
- None (foundational phase)

#### Status
**PASSED** ✅ - `relay-cesium-world.html` boots successfully

**Evidence**:
- Dev server running: `npm run dev:cesium`
- Open `http://localhost:8000`
- Cesium loads, terrain visible, buildings render

**Proof Artifacts**: See `archive/proofs/PROOF-INDEX.md` → Phase 0

---

### Phase 1: Excel Import → RelayState ✅ COMPLETE

**Goal**: Drag-and-drop Excel file → populate `relayState` with tree structure.

#### Inputs
- Excel file (.xlsx)
- XLSX.js library (CDN)
- Drop zone UI element

#### Outputs
- `relayState.tree.nodes` populated with trunk, branches, sheets
- `relayState.tree.edges` populated with filament/conduit edges
- `relayState.metadata` updated with filename, timestamp
- Drop zone hidden after successful import
- Tree stats logged to console

#### Pass/Fail Checks
- ✅ Drop Excel file triggers import
- ✅ `relayState.tree.nodes.length > 0` after import
- ✅ Trunk node created with correct type
- ✅ Branch nodes created (one per sheet)
- ✅ Sheet nodes created (one per worksheet)
- ✅ Edges created (trunk→branch, branch→sheet)
- ✅ No import errors logged
- ✅ `relayState.metadata.filename` matches dropped file

#### Blocked By
- Phase 0 (Cesium must be initialized)

#### Status
**PASSED** ✅ - Excel import working

**Evidence**:
- `app/excel-importer.js` implements drag-and-drop
- `createTreeFromWorkbook()` generates simple tree structure
- Tree stats visible in HUD after import

**Proof Artifacts**: See `archive/proofs/PROOF-INDEX.md` → Phase 1

---

### Phase 2: Core-Routed Relationships + Primitives ✅ PASSED

**Goal**: Render core-routed global relationships and local trees using Cesium primitives.

#### Inputs
- `relayState.anchors` (tree locations)
- `relayState.relationships` (global connections)
- `relayState.core` (Earth center)

#### Outputs
- Two local trees rendered at distinct lat/lon points (Tel Aviv, NYC)
- Global relationship rendered as V-shape via Earth core:
  - Leg A: Tree A → Earth center
  - Leg B: Earth center → Tree B
- Core marker (temporary, proof mode only)
- All geometry using `Cesium.Primitive` (not entities)
- LOD governor active and reporting level changes

#### Pass/Fail Checks
- ✅ Local Tree Topology: Two distinct trees at separate locations
- ✅ Core-Routed Relationship: V-shape via Earth center (2 legs confirmed)
- ✅ Primitives Used: 5 primitives, 0 geometry entities
- ✅ LOD Functioning: LANIAKEA level at 28,000 km
- ✅ ENU Correctness: Trees anchored at correct coordinates

#### Blocked By
- ~~Phase 0 (Cesium initialized)~~ ✅ COMPLETE
- ~~Phase 1 (relayState populated)~~ ✅ COMPLETE

#### Status
**✅ PASSED** - 2026-02-06

**Proof Artifacts**:
- `archive/proofs/phase2-proof-screenshot.png` ✅
- `archive/proofs/phase2-proof-console.log` ✅
- `archive/proofs/phase2-proof-spec.md` ✅

**Implementation**:
- `RelationshipRenderer` class created (`app/renderers/relationship-renderer.js`)
- Core-routed relationships implemented (2-leg V-shape)
- Test trees rendered with minimal primitives (vertical trunks)
- Critical fix: Added `arcType: Cesium.ArcType.NONE` to prevent terrain sampling errors
- Proof mode disabled after successful verification

**Important**: Phase 2 proof used primitives. Live renderer still uses entities (see Phase 2.1).

**Next Phase**: Phase 2.1 (Primitives Migration) - REQUIRED

---

### Phase 2.1: Primitives Migration 🚧 REQUIRED

**Goal**: Migrate live tree rendering from entities to primitives.

**Blocked By**: ~~Phase 2~~ ✅ PASSED

#### Current Honest Status
- ⚠️ FilamentRenderer uses entities for all geometry
- ⚠️ Console: "Tree rendered: X entities"
- ⚠️ HUD: "Filaments: ⚠️ ENTITY MODE"
- ⚠️ Buildings: DEGRADED (Ion 401)
- ⚠️ Boundaries: DISABLED (feature flag)

#### Target State
- ✅ Geometry rendered as primitives
- ✅ Console: "Tree rendered: X primitives, Y entities (labels)"
- ✅ HUD: "Filaments: PRIMITIVE"
- ✅ Only labels as entities

#### Pass Criteria
- Trunks as primitives (PolylineGeometry or PolylineVolumeGeometry)
- Branches as primitives with LOD-based geometry
- Filaments as primitives with LOD ladder:
  - LANIAKEA/PLANETARY: PolylineGeometry (thin)
  - REGION: CorridorGeometry (ribbons)
  - COMPANY/SHEET: PolylineVolumeGeometry (tubes)
- Sheets as local ENU plane primitives
- Entities ONLY for labels/HUD
- LOD transitions trigger visible geometry changes
- Performance stable (30+ FPS)

#### Proof Artifacts (required)
- `archive/proofs/phase2.1-primitives-console.log`
- `archive/proofs/phase2.1-primitives-screenshot.png`

#### Reference
- See `app/renderers/relationship-renderer.js` (primitives working correctly)
- Spec: `docs/implementation/PHASE-2.1-PRIMITIVES-MIGRATION.md`

**Status**: 🚧 IN PROGRESS (blocks Phase 3)

---

### Phase 3: Timebox Segmentation 📋 BLOCKED

**Goal**: Segment filaments by commit timeboxes (discrete time).

**Blocked By**: Phase 2.1 completion (primitives migration required)

#### Inputs
- Commits for each cell (from Excel metadata or API)
- Timebox generation logic
- Filament curves (from Phase 2.1 primitives)

#### Outputs
- Filaments segmented into discrete ranges
- Each segment has:
  - Start/end positions along curve
  - Material/color based on state (pending, active, complete)
  - Metadata (commitRange, confidence, state)
- Boundary rings at segment edges
- Timebox inspector (click segment → show commits)

#### Pass/Fail Checks
- ⏳ Filaments are visually segmented (not continuous)
- ⏳ Segment count matches commit timebox count
- ⏳ Boundary rings visible at segment edges
- ⏳ Segment material changes by state
- ⏳ Click segment shows timebox detail
- ⏳ No overlapping segments
- ⏳ No gaps between segments

#### Blocked By
- Phase 2 (filament rendering complete)

#### Status
**NOT STARTED** ⏹

---

### Phase 4: Boundaries + containsLL + Extrusion 📋 PLANNED

**Goal**: Load GeoJSON boundaries, implement point-in-polygon, render as 3D shells.

#### Inputs
- GeoJSON files (from `data/boundaries/`)
- LOD level (from LOD Governor)
- Boundary ID (for filtering)

#### Outputs
- `relayState.boundaries` populated from GeoJSON
- `containsLL(boundary, lat, lon)` function working
- Boundaries rendered:
  - **REGION/COMPANY/SHEET/CELL**: Extruded polygons (3D shells)
  - **PLANETARY/LANIAKEA**: Simplified outlines
- Boundary-scoped vote filtering works

#### Pass/Fail Checks
- ⏳ Boundaries load from GeoJSON without errors
- ⏳ `containsLL()` correctly identifies points inside/outside
- ⏳ `containsLL()` handles edge cases (point on boundary)
- ⏳ Extruded boundaries visible at close zoom
- ⏳ Simplified outlines visible at far zoom
- ⏳ LOD transitions smooth (extrusion appears/disappears)
- ⏳ Votes filtered by boundary when boundary selected
- ⏳ No Z-fighting between boundary and terrain

#### Blocked By
- Phase 2 (filament rendering, to avoid render order conflicts)

#### Status
**NOT STARTED** ⏹

**Implementation**:
- Create `core/services/boundaries/` (renderer-agnostic)
  - `loadBoundary(geojsonPath)`
  - `containsLL(boundary, lat, lon)`
  - `simplifyBoundary(boundary, tolerance)`
- Create `app/renderers/boundary-renderer.js` (Cesium-specific)
  - `renderBoundary(boundary, lodLevel)`
  - Use `PolygonGeometry` with `extrudedHeight`

---

### Phase 5: Boundary Votes Overlay 📋 PLANNED

**Goal**: Render votes as heat billboards, scoped to boundaries.

#### Inputs
- `relayState.votes` (vote objects with lat/lon)
- LOD level (from LOD Governor)
- Selected boundary (optional filter)

#### Outputs
- Votes rendered as billboards at lat/lon positions
- Billboard size/color varies by support level
- Labels show vote parameter name
- Votes hidden at far LOD (LANIAKEA, PLANETARY)
- Click vote → show detail inspector

#### Pass/Fail Checks
- ⏳ Votes visible at REGION/COMPANY/SHEET/CELL LOD
- ⏳ Votes hidden at LANIAKEA/PLANETARY LOD
- ⏳ Billboard size proportional to support level
- ⏳ Vote labels readable at close zoom
- ⏳ Click vote shows detail (parameter, value, boundary)
- ⏳ Boundary filter works (only votes within boundary shown)
- ⏳ No performance issues with 1000+ votes

#### Blocked By
- Phase 4 (boundaries loaded, containsLL working)

#### Status
**NOT STARTED** ⏹

**Implementation**:
- Create `app/renderers/vote-renderer.js`
  - `renderVotes(votes, lodLevel, selectedBoundary)`
  - Use `Cesium.Entity` with `billboard` property
  - Filter votes using `containsLL()`

---

### Phase 6: Weather Overlays 📋 PLANNED

**Goal**: Render weather data as imagery layer.

#### Inputs
- Weather overlay URL (WMS/WMTS endpoint or image)
- Sampling grid (bounds, resolution)
- Timestamp

#### Outputs
- Weather imagery rendered on globe
- Overlay opacity adjustable
- Overlay bounds match sampling grid
- Overlay updates on timestamp change

#### Pass/Fail Checks
- ⏳ Weather imagery visible on globe
- ⏳ Imagery bounds correct (aligned to sampling grid)
- ⏳ Opacity control works (0-100%)
- ⏳ Timestamp update triggers re-fetch
- ⏳ No imagery stretched/distorted
- ⏳ Overlay renders above terrain but below buildings/trees

#### Blocked By
- Phase 0 (Cesium initialized)

#### Status
**NOT STARTED** ⏹

**Implementation**:
- Create `app/renderers/weather-renderer.js`
  - `renderWeather(weather)`
  - Use `Cesium.SingleTileImageryProvider` or `Cesium.WebMapServiceImageryProvider`
  - Add to `viewer.imageryLayers`

---

### Phase 7: Interaction/Picking + Inspectors 📋 PLANNED

**Goal**: Click buildings/sheets/cells to inspect and navigate.

#### Inputs
- Mouse/touch click events
- `Cesium.Scene.pick()` results
- `relayState` (for data lookup)

#### Outputs
- Click building → highlight anchored branch, fly to location
- Click sheet → show sheet inspector (name, cells, filaments)
- Click cell → show cell inspector (value, formula, commits, timeboxes, ERI)
- Right-click → context menu (zoom to, hide, inspect)
- Hover → tooltip with basic info

#### Pass/Fail Checks
- ⏳ Click building highlights branch and flies to location
- ⏳ Click sheet opens inspector with correct data
- ⏳ Click cell opens inspector with commits/timeboxes
- ⏳ Right-click shows context menu
- ⏳ Hover shows tooltip without lag
- ⏳ Keyboard shortcuts work (T, Z, F, H, L, I)
- ⏳ Inspector panel closeable (ESC key or X button)

#### Blocked By
- Phase 2 (filaments rendered and pickable)
- Phase 3 (timeboxes exist for cell inspector)

#### Status
**NOT STARTED** ⏹

**Implementation**:
- Create `app/interaction/picker.js`
  - Handle `ScreenSpaceEventType.LEFT_CLICK`
  - Use `viewer.scene.pick()`
  - Identify object type (building, sheet, cell, filament)
- Create `app/ui/inspector-manager.js`
  - `showSheetInspector(sheet)`
  - `showCellInspector(cell)`
  - `showBuildingInfo(building)`

---

### Phase 8: Performance + Polish 📋 PLANNED

**Goal**: Optimize rendering, add visual polish, finalize UX.

#### Inputs
- Profiling data (FPS, memory, render time)
- User feedback
- Visual design guidelines

#### Outputs
- Smooth 60 FPS at all LOD levels (on target hardware)
- Memory usage < 2GB for large datasets (1000+ sheets)
- Render time < 16ms per frame
- Visual polish:
  - Smooth LOD transitions (fade in/out)
  - Subtle animations (branch sway, filament pulse)
  - Particle effects (commits flowing through filaments)
  - Improved materials (PBR shaders, normal maps)
  - Better lighting (dynamic shadows, ambient occlusion)

#### Pass/Fail Checks
- ⏳ Maintain 60 FPS with 1000 sheets visible
- ⏳ Memory usage < 2GB after 1 hour
- ⏳ LOD transitions smooth (no visual pops)
- ⏳ Animations subtle and performant
- ⏳ Materials look realistic (not flat/plastic)
- ⏳ Lighting enhances depth perception
- ⏳ No visual glitches after extended use

#### Blocked By
- All previous phases (complete feature set required)

#### Status
**NOT STARTED** ⏹

**Implementation**:
- Profile with Chrome DevTools Performance tab
- Optimize geometry (reduce vertices, use LOD)
- Use instancing for repeated geometry (cells, timeboxes)
- Implement frustum culling
- Add shader-based effects
- Implement fade transitions for LOD

---

## Phase Dependencies (Diagram)

```
Phase 0: Cesium Boot
    ↓
Phase 1: Excel Import → RelayState
    ↓
Phase 2: Filament Rendering (LOD)
    ↓                     ↓
Phase 3: Timeboxes    Phase 4: Boundaries
    ↓                     ↓
Phase 7: Interaction  Phase 5: Votes
    ↓                     ↓
        Phase 6: Weather
            ↓
    Phase 8: Performance + Polish
```

---

## Current Status Summary

| Phase | Status | Gate |
|-------|--------|------|
| 0: Cesium Boot | ✅ COMPLETE | PASSED |
| 1: Excel Import | ✅ COMPLETE | PASSED |
| 2: Filament Rendering | ⚠️ PARTIAL | PENDING (upgrade to primitives) |
| 3: Timeboxes | ⏹ NOT STARTED | BLOCKED (Phase 2) |
| 4: Boundaries | ⏹ NOT STARTED | BLOCKED (Phase 2) |
| 5: Votes | ⏹ NOT STARTED | BLOCKED (Phase 4) |
| 6: Weather | ⏹ NOT STARTED | BLOCKED (Phase 0) |
| 7: Interaction | ⏹ NOT STARTED | BLOCKED (Phases 2, 3) |
| 8: Performance | ⏹ NOT STARTED | BLOCKED (All) |

---

## Next Immediate Actions

### To Complete Phase 2 (Filament Rendering)

1. **Upgrade trunk rendering** to `PolylineVolumeGeometry`:
   ```javascript
   // Replace entity-based trunk with primitive
   const geometry = new Cesium.PolylineVolumeGeometry({
       polylinePositions: [basePos, topPos],
       shapePositions: circleShape(radius, 16)
   });
   const primitive = new Cesium.Primitive({
       geometryInstances: new Cesium.GeometryInstance({ geometry }),
       appearance: new Cesium.PerInstanceColorAppearance()
   });
   viewer.scene.primitives.add(primitive);
   ```

2. **Implement LOD ladder** for filaments:
   - Far (>100km): `PolylineGeometry` (thin lines)
   - Mid (50-100km): `CorridorGeometry` (ribbons)
   - Near (<50km): `PolylineVolumeGeometry` (tubes)

3. **Add ENU frame** for sheet orientation:
   ```javascript
   const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(anchorPos);
   // Apply transformation to sheet geometry
   ```

4. **Test with large dataset**: 100+ sheets, verify performance

5. **Pass gate**: Run visual inspection + FPS check

---

## Testing Strategy Per Phase

### Phase 0-2: Manual Testing
- Visual inspection (does it look right?)
- Console error check (no red errors)
- FPS check (smooth at 60 FPS?)

### Phase 3-5: Unit + Integration Tests
- Unit tests for `containsLL()`, timebox generation
- Integration tests for LOD transitions
- Vitest for core logic, Playwright for UI

### Phase 6-8: Performance + E2E Tests
- Load testing (1000+ entities)
- Memory profiling (Chrome DevTools)
- E2E scenarios (import → zoom → inspect → export)

---

## Gate Enforcement

**Rule**: Cannot proceed to next phase until current phase gate **PASSES**.

**Exception**: Phases 4, 6 can proceed in parallel with Phase 2 if resources available.

**Gate Criteria**:
- All pass/fail checks green ✅
- No regressions in previous phases
- Code reviewed and approved
- Documentation updated

---

## Non-Goals (Explicitly Out of Scope)

- ❌ Mobile app (web only for v1.0)
- ❌ Offline mode (requires server)
- ❌ Multi-language support (English only for v1.0)
- ❌ Real-time collaboration (future phase)
- ❌ VR/AR support (future phase)

---

## Success Criteria (Overall)

**Relay v1.0 is complete when**:
- ✅ All 8 phases PASS their gates
- ✅ Boot gate passes reliably
- ✅ Can import 100-sheet Excel file and render in <5 seconds
- ✅ Maintain 60 FPS at all LOD levels
- ✅ Click any building/sheet/cell and see correct data
- ✅ Boundaries filter votes correctly
- ✅ Zero critical bugs (crashes, data loss)

---

*This roadmap is living. Update phase status as gates pass. No phase is "done" until its gate criteria are met.*
