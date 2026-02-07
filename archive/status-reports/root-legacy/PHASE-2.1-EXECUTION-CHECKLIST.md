# ✅ Phase 2.1 Execution Checklist - PRIMITIVES MIGRATION

**Date**: 2026-02-06  
**Status**: BLOCKING PHASE 3  
**Purpose**: Migrate live tree renderer from entities to primitives with canonical ENU topology

---

## Gate 0 — ENU Coordinate System Setup

**Action**:
- Create `enuCoordinates` utility module for converting ENU meters → world Cartesian3
- All tree layout defined in **meters** (not degree offsets)
- No hardcoded lon/lat deltas

**Implementation**:
```javascript
// app/utils/enu-coordinates.js
export function createENUFrame(anchorLon, anchorLat, anchorAlt) {
    const anchorPos = Cesium.Cartesian3.fromDegrees(anchorLon, anchorLat, anchorAlt);
    return Cesium.Transforms.eastNorthUpToFixedFrame(anchorPos);
}

export function enuToWorld(enuFrame, eastMeters, northMeters, upMeters) {
    const localOffset = new Cesium.Cartesian3(eastMeters, northMeters, upMeters);
    return Cesium.Matrix4.multiplyByPoint(enuFrame, localOffset, new Cesium.Cartesian3());
}
```

**PASS condition**: No degree arithmetic in tree rendering code. All offsets in meters.

**REFUSAL**: `REFUSAL.DEGREE_OFFSETS_USED`

---

## Step 1 — Define Canonical Tree Layout Constants (ENU meters)

**Action**:
Define tree topology in meters (not degrees):

```javascript
const CANONICAL_LAYOUT = {
    // Trunk
    trunk: {
        baseAlt: 0,           // Ground
        topAlt: 2000,         // meters
        radius: 0.5           // meters
    },
    
    // Branches (horizontal ribs along +East)
    branch: {
        length: 800,          // meters along +East
        separation: 35,       // meters in +North (tight spacing)
        heightOffset: 0,      // At trunk top (0 offset)
        arcAmplitude: 150,    // meters (slight sag/rise for organic look)
        arcAsymmetry: 0.3     // First 30% rises, then curves
    },
    
    // Sheets (horizontal planes above branches)
    sheet: {
        clearanceAboveBranch: 300,  // meters
        width: 280,                  // meters (local X = treeOut)
        height: 220,                 // meters (local Y = treeSide)
        depth: 30,                   // meters (thickness)
        cellRows: 8,
        cellCols: 6
    },
    
    // Timeboxes
    timebox: {
        minSpacing: 250,      // meters between timeboxes
        maxTimeboxes: 12,     // per limb segment
        radiusRatio: 0.75,    // Of parent limb radius
        thicknessBase: 12,    // meters
        thicknessPerCommit: 0.08  // meters per 10 commits
    }
};
```

**PASS condition**: All layout defined in meters. No degree offsets.

**REFUSAL**: `REFUSAL.NON_METRIC_LAYOUT`

---

## Step 2 — Trunk as Primitive (PolylineVolumeGeometry)

**Action**:
Create `renderTrunkPrimitive(trunk)` method.

**Requirements**:
- Use `Cesium.PolylineVolumeGeometry` with circular cross-section
- Anchor at trunk base using ENU frame
- Vertical along ENU Up (not world Z)
- Radius from `CANONICAL_LAYOUT.trunk.radius`

**Code Template**:
```javascript
renderTrunkPrimitive(trunk) {
    // Create ENU frame at trunk base
    const enuFrame = createENUFrame(trunk.lon, trunk.lat, 0);
    
    // Trunk path in local ENU: straight up
    const trunkBase = new Cesium.Cartesian3(0, 0, 0);
    const trunkTop = new Cesium.Cartesian3(0, 0, CANONICAL_LAYOUT.trunk.topAlt);
    
    // Convert to world space
    const worldBase = enuToWorld(enuFrame, 0, 0, 0);
    const worldTop = enuToWorld(enuFrame, 0, 0, 2000);
    
    // Create circular cross-section
    const circleProfile = this.createCircleProfile(CANONICAL_LAYOUT.trunk.radius, 16);
    
    // Create geometry
    const geometry = new Cesium.PolylineVolumeGeometry({
        polylinePositions: [worldBase, worldTop],
        shapePositions: circleProfile,
        cornerType: Cesium.CornerType.ROUNDED,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    // Create primitive
    const geometryInstance = new Cesium.GeometryInstance({
        geometry: geometry,
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.fromCssColorString('#8B4513').withAlpha(0.9)
            )
        },
        id: trunk.id
    });
    
    const primitive = new Cesium.Primitive({
        geometryInstances: geometryInstance,
        appearance: new Cesium.PerInstanceColorAppearance({
            translucent: false,
            closed: true
        })
    });
    
    this.viewer.scene.primitives.add(primitive);
    this.primitives.push(primitive);
}
```

**PASS condition**: Console shows "Trunk: 1 primitive". Trunk visible as solid cylinder.

**REFUSAL**: `REFUSAL.TRUNK_NOT_PRIMITIVE`

---

## Step 3 — Branches as Primitives (Tight Parallel Ribs with Controlled Arc)

**Action**:
Create `renderBranchPrimitive(branch, branchIndex)` method.

**Requirements**:
- All branches extend along +ENU East (parallel)
- Spacing in +ENU North (tight: 35m)
- Height: At trunk top (2000m)
- Arc: Slight controlled sag/rise (150m amplitude), monotonic +East in first 30%
- Use `CorridorGeometry` for visibility

**Code Template**:
```javascript
renderBranchPrimitive(branch, branchIndex) {
    const parent = relayState.tree.nodes.find(n => n.id === branch.parent);
    const enuFrame = createENUFrame(parent.lon, parent.lat, parent.alt);
    
    // Branch layout in ENU meters
    const branchLength = CANONICAL_LAYOUT.branch.length;  // 800m
    const branchSeparation = CANONICAL_LAYOUT.branch.separation;  // 35m
    const northOffset = branchIndex * branchSeparation;
    
    // Create arc path along +East with controlled sag
    const positions = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const eastPos = branchLength * t;  // Monotonic +East
        const northPos = northOffset;       // Constant (tight)
        
        // Controlled arc: First 30% rises monotonically, then gentle sag
        let upPos = 0;
        if (t < 0.3) {
            // First 30%: monotonic rise
            upPos = (t / 0.3) * CANONICAL_LAYOUT.branch.arcAmplitude * 0.5;
        } else {
            // Remaining: gentle sag
            const remainT = (t - 0.3) / 0.7;
            const arcShape = Math.sin(remainT * Math.PI);  // Smooth curve
            upPos = CANONICAL_LAYOUT.branch.arcAmplitude * 0.5 * (1 - arcShape * 0.3);
        }
        
        // Convert ENU to world
        const worldPos = enuToWorld(enuFrame, eastPos, northPos, upPos);
        positions.push(worldPos);
    }
    
    // Create corridor geometry
    const geometry = new Cesium.CorridorGeometry({
        positions: positions,
        width: 10,  // meters
        cornerType: Cesium.CornerType.ROUNDED,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    // Create primitive
    const geometryInstance = new Cesium.GeometryInstance({
        geometry: geometry,
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.fromCssColorString('#8B4513').withAlpha(0.9)
            )
        },
        id: branch.id
    });
    
    const primitive = new Cesium.Primitive({
        geometryInstances: geometryInstance,
        appearance: new Cesium.PerInstanceColorAppearance()
    });
    
    this.viewer.scene.primitives.add(primitive);
    this.primitives.push(primitive);
}
```

**PASS condition**: Console shows "Branches: N primitives". All branches parallel along +East.

**REFUSAL**: `REFUSAL.BRANCHES_NOT_PRIMITIVE` or `REFUSAL.BRANCHES_NOT_PARALLEL`

---

## Step 4 — Sheets as ENU Planes Above Branches

**Action**:
Create `renderSheetPrimitive(sheet, branchIndex)` method.

**Requirements**:
- Position: Branch endpoint ENU + (0, 0, +300m)
- Orientation: Plane normal = ENU Up
- Plane axes: X = treeOut (+East), Y = treeSide (+North)
- Use `RectangleGeometry` or `PlaneGeometry` in ENU frame

**Code Template**:
```javascript
renderSheetPrimitive(sheet, branchIndex) {
    const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
    const trunk = relayState.tree.nodes.find(n => n.id === parent.parent);
    
    // Create ENU frame at trunk anchor
    const enuFrame = createENUFrame(trunk.lon, trunk.lat, trunk.alt);
    
    // Sheet position in ENU: at branch endpoint + clearance
    const branchLength = CANONICAL_LAYOUT.branch.length;
    const branchSeparation = CANONICAL_LAYOUT.branch.separation;
    const sheetClearance = CANONICAL_LAYOUT.sheet.clearanceAboveBranch;
    
    const sheetENU = {
        east: branchLength,
        north: branchIndex * branchSeparation,
        up: sheetClearance  // Above branch
    };
    
    // Sheet center in world space
    const sheetCenter = enuToWorld(enuFrame, sheetENU.east, sheetENU.north, sheetENU.up);
    
    // Create sheet plane geometry (horizontal)
    const sheetWidth = CANONICAL_LAYOUT.sheet.width;
    const sheetHeight = CANONICAL_LAYOUT.sheet.height;
    
    // Create plane in ENU frame (naturally horizontal)
    const planeGeometry = new Cesium.PlaneGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    // Scale and position matrix
    const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(sheetWidth, sheetHeight, 1));
    const translation = Cesium.Matrix4.fromTranslation(sheetCenter);
    const modelMatrix = Cesium.Matrix4.multiply(translation, scale, new Cesium.Matrix4());
    
    // Create primitive
    const eriColor = this.getERIColor(sheet.eri);
    const geometryInstance = new Cesium.GeometryInstance({
        geometry: planeGeometry,
        modelMatrix: modelMatrix,
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(eriColor.withAlpha(0.3))
        },
        id: sheet.id
    });
    
    const primitive = new Cesium.Primitive({
        geometryInstances: geometryInstance,
        appearance: new Cesium.PerInstanceColorAppearance({
            translucent: true,
            closed: false
        })
    });
    
    this.viewer.scene.primitives.add(primitive);
    this.primitives.push(primitive);
    
    // Render cell grid
    this.renderCellGridPrimitive(sheet, enuFrame, sheetENU);
}
```

**PASS condition**: Sheets horizontal (facing up), positioned above branches in ENU.

**REFUSAL**: `REFUSAL.SHEETS_NOT_ENU_ORIENTED`

---

## Step 5 — Cell Grid with Spine Staging

**Action**:
Render cells + SheetBundleSpine in ENU coordinates.

**Requirements**:
- Cells positioned on horizontal sheet plane
- SheetBundleSpine at sheet center (below sheet)
- Filament hierarchy:
  1. Cell → Spine (short, many)
  2. Spine → Branch (one thick conduit)

**Code Template**:
```javascript
renderCellGridPrimitive(sheet, enuFrame, sheetENU) {
    const rows = sheet.rows || 8;
    const cols = sheet.cols || 6;
    const sheetWidth = CANONICAL_LAYOUT.sheet.width;
    const sheetHeight = CANONICAL_LAYOUT.sheet.height;
    
    // Cell spacing in meters
    const cellSpacingX = sheetWidth / (cols + 1);
    const cellSpacingY = sheetHeight / (rows + 1);
    const startX = -sheetWidth/2 + cellSpacingX;
    const startY = sheetHeight/2 - cellSpacingY;
    
    // Sheet bundle spine position (at sheet center, below sheet)
    const spineENU = {
        east: sheetENU.east,
        north: sheetENU.north,
        up: sheetENU.up - 50  // 50m below sheet
    };
    const spineWorldPos = enuToWorld(enuFrame, spineENU.east, spineENU.north, spineENU.up);
    
    // Store cell anchors
    if (!window.cellAnchors) window.cellAnchors = {};
    window.cellAnchors[sheet.id] = {
        cells: {},
        spine: spineWorldPos
    };
    
    // Render each cell
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cellX = startX + col * cellSpacingX;
            const cellY = startY - row * cellSpacingY;
            
            // Cell position in world space
            const cellWorldPos = enuToWorld(
                enuFrame,
                sheetENU.east + cellX,
                sheetENU.north + cellY,
                sheetENU.up + 10  // Slightly above sheet
            );
            
            const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
            
            // Cell marker (entity for now, can be primitive later)
            const cellEntity = this.viewer.entities.add({
                position: cellWorldPos,
                point: {
                    pixelSize: 4,
                    color: this.getCellColor(sheet, row, col, this.getERIColor(sheet.eri)),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                label: {
                    text: cellRef,
                    font: '10px monospace',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    scale: 0.7,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000)
                },
                properties: {
                    type: 'cell',
                    sheetId: sheet.id,
                    cellRef: cellRef
                }
            });
            
            this.entities.push(cellEntity);
            window.cellAnchors[sheet.id].cells[cellRef] = cellWorldPos;
        }
    }
}
```

**PASS condition**: Cells positioned in ENU meters. Spine position stored.

**REFUSAL**: `REFUSAL.CELLS_NOT_ENU_POSITIONED`

---

## Step 6 — Staged Filaments (Cell→Spine→Branch) as Primitives

**Action**:
Create `renderStagedFilaments(sheet, branchIndex)` method.

**Requirements**:
- **Stage 1**: Cell → Spine (many thin primitives)
- **Stage 2**: Spine → Branch (one thick primitive conduit)
- Use primitives at SHEET/CELL LOD
- Can use entities at far LOD (LANIAKEA/PLANETARY)

**Code Template**:
```javascript
renderStagedFilaments(sheet, branchIndex) {
    const cellAnchors = window.cellAnchors[sheet.id];
    if (!cellAnchors) return;
    
    const spinePos = cellAnchors.spine;
    const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
    const trunk = relayState.tree.nodes.find(n => n.id === parent.parent);
    
    // Branch endpoint position (ENU)
    const enuFrame = createENUFrame(trunk.lon, trunk.lat, trunk.alt);
    const branchEndWorld = enuToWorld(
        enuFrame,
        CANONICAL_LAYOUT.branch.length,
        branchIndex * CANONICAL_LAYOUT.branch.separation,
        0  // At trunk top
    );
    
    // LOD check: Only render as primitives at close zoom
    const usePrimitives = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL');
    
    if (usePrimitives) {
        // STAGE 1: Cell → Spine (many thin primitives)
        Object.keys(cellAnchors.cells).forEach(cellRef => {
            const cellPos = cellAnchors.cells[cellRef];
            
            const geometry = new Cesium.PolylineGeometry({
                positions: [cellPos, spinePos],
                width: 1.0,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        this.getERIColor(sheet.eri).withAlpha(0.6)
                    )
                },
                id: `${sheet.id}-${cellRef}`
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PolylineColorAppearance()
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
        });
        
        // STAGE 2: Spine → Branch (one thick conduit)
        const spineGeometry = new Cesium.PolylineGeometry({
            positions: [spinePos, branchEndWorld],
            width: 5.0,  // Thicker conduit
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            arcType: Cesium.ArcType.NONE
        });
        
        const spineInstance = new Cesium.GeometryInstance({
            geometry: spineGeometry,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    this.getERIColor(sheet.eri).withAlpha(0.8)
                )
            },
            id: `${sheet.id}-spine`
        });
        
        const spinePrimitive = new Cesium.Primitive({
            geometryInstances: spineInstance,
            appearance: new Cesium.PolylineColorAppearance()
        });
        
        this.viewer.scene.primitives.add(spinePrimitive);
        this.primitives.push(spinePrimitive);
        
    } else {
        // Far LOD: Can use simplified entity representation
        // (or hide completely)
    }
}
```

**PASS condition**: At SHEET LOD, console shows "Cell filaments: N primitives (staged)".

**REFUSAL**: `REFUSAL.FILAMENTS_NOT_STAGED` or `REFUSAL.FILAMENTS_NOT_PRIMITIVE_AT_SHEET_LOD`

---

## Step 7 — Dynamic Timebox Spacing (Length or Commit-Derived)

**Action**:
Update `generateTimeboxesFromCommits()` to derive spacing from limb length.

**Requirements**:
```javascript
function calculateTimeboxSpacing(limbLength, commits) {
    if (commits && commits.length > 0) {
        // Use commit windows if available
        return commits.length;
    } else {
        // Derive from limb length
        const spacing = CANONICAL_LAYOUT.timebox.minSpacing;  // 250m
        const count = Math.floor(limbLength / spacing);
        return Math.min(count, CANONICAL_LAYOUT.timebox.maxTimeboxes);
    }
}
```

**PASS condition**: Timebox count varies by limb length or commit count (not fixed).

**REFUSAL**: `REFUSAL.FIXED_TIMEBOX_COUNT`

---

## Step 8 — Update Console Logging (Primitive Counts)

**Action**:
Modify console output to show primitive/entity breakdown.

**Required Format**:
```
✅ Tree rendered:
  Primitives: 83 (trunk=1, branches=2, cell-filaments=78, spines=2)
  Entities: 92 (labels=78, timebox-labels=14)
```

**PASS condition**: Console clearly shows primitive vs entity separation.

**REFUSAL**: `REFUSAL.CONSOLE_FORMAT_INCORRECT`

---

## Step 9 — Add Canonical Camera Presets

**Action**:
Add keyboard shortcuts for canonical test views.

**Required Presets**:
```javascript
// Press '1' for TopDownSpreadsheetView
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat + 0.01, 5000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),  // Looking straight down
        roll: 0
    }
});

// Press '2' for SideProfileView
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(trunk.lon - 0.02, trunk.lat, 2000),
    orientation: {
        heading: Cesium.Math.toRadians(90),  // Looking at tree from side
        pitch: 0,
        roll: 0
    }
});
```

**PASS condition**: Camera presets functional. Views show canonical topology.

**REFUSAL**: `REFUSAL.NO_CANONICAL_CAMERA_PRESETS`

---

## Step 10 — Capture Phase 2.1 Proof Artifacts

**Action**:
Capture proof artifacts showing primitives working.

**Required Artifacts**:
1. **Screenshot (TopDown view)**: `archive/proofs/phase2.1-topdown.png`
   - Shows sheets horizontal with cell grids
   - Shows branches parallel
   - Shows timeboxes
   
2. **Screenshot (Side view)**: `archive/proofs/phase2.1-sideprofile.png`
   - Shows trunk vertical
   - Shows branch horizontal with arc
   - Shows sheet above branch
   - Shows filaments staged (cell→spine→branch)
   
3. **Console log**: `archive/proofs/phase2.1-primitives-console.log`
   - Shows primitive counts
   - Shows "Primitives: X, Entities: Y (labels)"
   - Shows LOD level
   - Shows ENU frame confirmation

**PASS condition**: All artifacts captured, showing primitives working with ENU coordinates.

**REFUSAL**: `REFUSAL.PHASE_2_1_PROOF_INCOMPLETE`

---

## ✅ Phase 2.1 Outcome Rule

**PASSED only if**:
1. ✅ All geometry in ENU meters (no degree offsets)
2. ✅ Trunk as primitive (PolylineVolumeGeometry)
3. ✅ Branches as primitives (CorridorGeometry, parallel +East)
4. ✅ Cell filaments as primitives at SHEET LOD (staged: cell→spine→branch)
5. ✅ Entities ONLY for labels/HUD
6. ✅ Console shows: "X primitives, Y entities (labels)"
7. ✅ HUD shows: "Filaments: PRIMITIVE"
8. ✅ Timebox spacing derived (not fixed)
9. ✅ Camera presets functional
10. ✅ Proof artifacts captured (2 screenshots + console log)

**Otherwise**: REFUSAL with specific reason code. Do not continue to Phase 3.

---

## 🔗 Reference Implementation

**Existing primitives code**: `app/renderers/relationship-renderer.js`
- Already uses primitives correctly
- Use as template for geometry creation

**ENU coordinates needed**: Create `app/utils/enu-coordinates.js`
- `createENUFrame(lon, lat, alt)`
- `enuToWorld(frame, east, north, up)`
- `worldToENU(frame, worldPos)`

---

## 📋 Implementation Order

1. Create ENU utility module
2. Update CANONICAL_LAYOUT with meters
3. Implement trunk primitive
4. Implement branch primitives
5. Implement sheet primitives
6. Implement staged filaments
7. Update timebox spacing
8. Add camera presets
9. Update console logging
10. Capture proof artifacts
11. User does pass/fail check
12. If PASS → Phase 3

---

**Status**: Phase 2.1 execution checklist complete. ENU-based implementation required. No degree offsets. All geometry in local meters. Staged filaments. Dynamic timebox spacing. Canonical camera presets.
