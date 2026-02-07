# Single Branch Proof - Step-by-Step Implementation with Validation Gates

**Purpose**: Fix one branch correctly before expanding to full tree  
**Date**: 2026-02-06

---

## Current Status

✅ **Branches ARE rendering**: Console shows `Primitives: 83 (trunk=1, branches=2, ...)`  
✅ **Visual confirmation**: Screenshot shows trunk + branch + sheet + staged filaments  
⚠️ **Issue**: Need clear anchor marker and validation that ENU→World conversion is correct

---

## Step 1: Single Branch Proof Mode

### Gate 1 - PASS/REFUSAL: Isolate One Branch

**Action**: Add `SINGLE_BRANCH_PROOF` flag to render only trunk + 1 branch

**File**: `relay-cesium-world.html` (around line 303)

**Add before demo tree loading**:
```javascript
// ═══════════════════════════════════════════════════════════
// SINGLE BRANCH PROOF MODE (Step 1)
// ═══════════════════════════════════════════════════════════
const SINGLE_BRANCH_PROOF = true;  // Set to false for full tree
```

**File**: `app/renderers/filament-renderer.js` (in `renderTree()` method)

**Change from**:
```javascript
branches.forEach((branch, index) => {
    this.renderBranchPrimitive(branch, index);
    this.renderTimeboxesPrimitive(branch);
});
```

**Change to**:
```javascript
// SINGLE BRANCH PROOF: Only render first branch
const branchesToRender = window.SINGLE_BRANCH_PROOF ? branches.slice(0, 1) : branches;
branchesToRender.forEach((branch, index) => {
    this.renderBranchPrimitive(branch, index);
    this.renderTimeboxesPrimitive(branch);
});
```

**Similarly for sheets**:
```javascript
// SINGLE BRANCH PROOF: Only render first sheet
const sheetsToRender = window.SINGLE_BRANCH_PROOF ? sheets.slice(0, 1) : sheets;
sheetsToRender.forEach((sheet, index) => {
    this.renderSheetPrimitive(sheet, index);
});
```

**Pass Criteria**:
```
Console output:
✅ Tree rendered:
  Primitives: ~40 (trunk=1, branches=1, cell-filaments=48, spines=1)
  Entities: ~56 (labels=48, timebox-labels=~8)
```

**Visual**: One trunk + one branch + one sheet visible

**REFUSAL**: `REFUSAL.SINGLE_BRANCH_NOT_ISOLATED` if more than 1 branch/sheet renders

---

## Step 2: Validate ENU→World Conversion with Logging

### Gate 2 - PASS/REFUSAL: Conversion is Correct

**Action**: Add detailed logging to branch render to prove ENU→World math is correct

**File**: `app/renderers/filament-renderer.js` (in `renderBranchPrimitive()` method)

**Add after creating ENU frame** (around line 200):
```javascript
const enuFrame = parent._enuFrame;
const layout = CANONICAL_LAYOUT.branch;

// GATE 2: Log ENU→World conversion for validation
const trunkAnchor = Cesium.Cartesian3.fromDegrees(parent.lon, parent.lat, 0);
const branchStartENU = { east: 0, north: branchIndex * layout.separation, up: CANONICAL_LAYOUT.trunk.topAlt };
const branchEndENU = { east: layout.length, north: branchIndex * layout.separation, up: CANONICAL_LAYOUT.trunk.topAlt };

const branchStart = enuToWorld(enuFrame, branchStartENU.east, branchStartENU.north, branchStartENU.up);
const branchEnd = enuToWorld(enuFrame, branchEndENU.east, branchEndENU.north, branchEndENU.up);

const branchLengthMeters = Cesium.Cartesian3.distance(branchStart, branchEnd);
const expectedLength = layout.length;  // 800m

RelayLog.info(`[GATE 2] Branch ${branch.id}:`);
RelayLog.info(`  Anchor: (${parent.lon.toFixed(4)}, ${parent.lat.toFixed(4)})`);
RelayLog.info(`  ENU Start: (E=${branchStartENU.east}, N=${branchStartENU.north}, U=${branchStartENU.up})`);
RelayLog.info(`  ENU End: (E=${branchEndENU.east}, N=${branchEndENU.north}, U=${branchEndENU.up})`);
RelayLog.info(`  World Start: (${branchStart.x.toFixed(1)}, ${branchStart.y.toFixed(1)}, ${branchStart.z.toFixed(1)})`);
RelayLog.info(`  World End: (${branchEnd.x.toFixed(1)}, ${branchEnd.y.toFixed(1)}, ${branchEnd.z.toFixed(1)})`);
RelayLog.info(`  Branch Length: ${branchLengthMeters.toFixed(1)}m (expected: ${expectedLength}m)`);
RelayLog.info(`  Length Error: ${Math.abs(branchLengthMeters - expectedLength).toFixed(1)}m`);
```

**Pass Criteria**:
```
Console output:
[GATE 2] Branch branch.operations:
  Anchor: (34.7818, 32.0853)
  ENU Start: (E=0, N=0, U=2000)
  ENU End: (E=800, N=0, U=2000)
  Branch Length: ~800.0m (expected: 800m)
  Length Error: <10m
```

**REFUSAL**: `REFUSAL.ENU_WORLD_TRANSFORM_INVALID` if:
- Any coordinate is `NaN` or `undefined`
- Branch length is not ~800m (±10m tolerance)
- Length error > 10m

---

## Step 3: Camera Flies to Branch Bounding Sphere

### Gate 3 - PASS/REFUSAL: Camera Targets Branch

**Action**: Replace generic camera presets with bounding-sphere targeting

**File**: `relay-cesium-world.html` (in camera preset section)

**Replace `window.setTopDownView` with**:
```javascript
window.setTopDownView = () => {
    RelayLog.info('📷 Camera: TopDown (Bounding Sphere)');
    
    // Get first trunk for anchor
    const trunk = relayState.tree.nodes.find(n => n.type === 'trunk');
    if (!trunk) {
        RelayLog.warn('No trunk found for camera target');
        return;
    }
    
    // Compute bounding sphere from trunk base to 5km radius
    const trunkBase = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
    const boundingSphere = new Cesium.BoundingSphere(trunkBase, 5000);
    
    // Fly to bounding sphere with downward pitch
    viewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: 0.8,
        offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-90),  // Looking straight down
            5000  // 5km altitude
        )
    });
};
```

**Replace `window.setSideProfileView` with**:
```javascript
window.setSideProfileView = () => {
    RelayLog.info('📷 Camera: Side Profile (Bounding Sphere)');
    
    // Get first trunk for anchor
    const trunk = relayState.tree.nodes.find(n => n.type === 'trunk');
    if (!trunk) {
        RelayLog.warn('No trunk found for camera target');
        return;
    }
    
    // Compute bounding sphere from trunk base to 3km radius
    const trunkBase = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, CANONICAL_LAYOUT.trunk.topAlt / 2);
    const boundingSphere = new Cesium.BoundingSphere(trunkBase, 3000);
    
    // Fly to bounding sphere with side view
    viewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: 0.8,
        offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(90),   // Looking from east
            0,                            // Horizontal pitch
            3000                          // 3km distance
        )
    });
};
```

**Pass Criteria**:
- Press `1` → Camera moves to trunk location, looking down
- Press `2` → Camera moves to trunk location, looking from side
- Trunk + branch + sheet are ALWAYS in view (centered)

**REFUSAL**: `REFUSAL.CAMERA_NOT_BOUND_TO_BRANCH` if camera flies to empty space

---

## Step 4: Add Anchor Marker (No Buildings Dependency)

### Gate 4 - PASS/REFUSAL: Anchor is Always Visible

**Action**: Render a simple anchor marker at trunk base (independent of buildings/imagery)

**File**: `app/renderers/filament-renderer.js` (add new method)

```javascript
/**
 * Render anchor marker at trunk base (always visible, no buildings dependency)
 */
renderAnchorMarker(trunk) {
    try {
        const anchorPos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
        
        // Simple anchor: vertical pin from ground to 50m up
        const anchorTop = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 50);
        
        const geometry = new Cesium.PolylineGeometry({
            positions: [anchorPos, anchorTop],
            width: 8.0,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            arcType: Cesium.ArcType.NONE
        });
        
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: geometry,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.CYAN.withAlpha(0.9)
                )
            },
            id: `${trunk.id}-anchor`
        });
        
        const primitive = new Cesium.Primitive({
            geometryInstances: geometryInstance,
            appearance: new Cesium.PolylineColorAppearance(),
            asynchronous: false
        });
        
        this.viewer.scene.primitives.add(primitive);
        this.primitives.push(primitive);
        
        // Also add a ground point (billboard or point)
        const anchorEntity = this.viewer.entities.add({
            position: anchorPos,
            point: {
                pixelSize: 12,
                color: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: trunk.name || trunk.id,
                font: '14px sans-serif',
                fillColor: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                scale: 0.9
            }
        });
        
        this.entities.push(anchorEntity);
        this.entityCount.labels++;
        
        RelayLog.info(`[GATE 4] Anchor marker rendered at (${trunk.lon}, ${trunk.lat})`);
        
    } catch (error) {
        RelayLog.error(`[FilamentRenderer] ❌ Failed to render anchor marker:`, error);
    }
}
```

**Call in `renderTree()` method**:
```javascript
// Render trunks with timeboxes
trunks.forEach(trunk => {
    this.renderAnchorMarker(trunk);  // NEW: Always render anchor first
    this.renderTrunkPrimitive(trunk);
    this.renderTimeboxesPrimitive(trunk);
});
```

**Pass Criteria**:
- Anchor marker (cyan point + label + vertical pin) visible at trunk base
- Anchor visible even when `Buildings: DEGRADED` in HUD
- Anchor visible on ellipsoid (no terrain/buildings needed)

**REFUSAL**: `REFUSAL.ANCHOR_MARKER_DEPENDS_ON_MAP` if anchor disappears when buildings degrade

---

## Step 5: Re-enable Staged Filaments (Single Branch Only)

### Gate 5 - PASS/REFUSAL: Staging is Enforced

**Action**: Verify staged filaments render correctly for the single branch

**Already implemented** in current code, just verify:

**File**: `app/renderers/filament-renderer.js` (in `renderStagedFilaments()` method)

**Validation logging** (add at end of method):
```javascript
if (usePrimitives) {
    const cellCount = Object.keys(cellAnchors.cells).length;
    RelayLog.info(`[GATE 5] Staged filaments for ${sheet.id}:`);
    RelayLog.info(`  Stage 1 (Cell→Spine): ${cellCount} primitives`);
    RelayLog.info(`  Stage 2 (Spine→Branch): 1 primitive`);
    RelayLog.info(`  Total: ${cellCount + 1} filament primitives`);
}
```

**Pass Criteria**:
```
Console output:
[GATE 5] Staged filaments for sheet.packaging:
  Stage 1 (Cell→Spine): 48 primitives
  Stage 2 (Spine→Branch): 1 primitive
  Total: 49 filament primitives
```

**Visual**:
- Many thin lines from cells converging to ONE spine point
- ONE thick line from spine to branch endpoint
- NO direct cell→branch connections (no spaghetti)

**REFUSAL**: `REFUSAL.STAGING_NOT_ENFORCED` if filaments go directly cell→branch

---

## Implementation Order (Do These in Sequence)

1. **Step 1**: Add `SINGLE_BRANCH_PROOF` flag → Test → Verify console shows `branches=1`
2. **Step 2**: Add Gate 2 logging → Test → Verify branch length ~800m
3. **Step 3**: Update camera presets → Test → Press `1` and `2`, verify centering
4. **Step 4**: Add anchor marker → Test → Verify cyan pin always visible
5. **Step 5**: Verify staged filaments → Test → Verify no spaghetti

**Each step is a PASS/REFUSAL gate. Do not proceed to next step until current step PASSES.**

---

## Expected Final Console Output (After All Gates Pass)

```
[ENU] Coordinate system loaded - all geometry in meters
🚀 Relay Cesium World starting...
🌍 Initializing Cesium Viewer...
✅ Viewer created
⚠️ 3D Buildings unavailable (Ion 401 or network issue)
🌲 Loading demo tree...
🌲 Rendering tree: 5 nodes, 4 edges

[GATE 4] Anchor marker rendered at (34.7818, 32.0853)

[GATE 2] Branch branch.operations:
  Anchor: (34.7818, 32.0853)
  ENU Start: (E=0, N=0, U=2000)
  ENU End: (E=800, N=0, U=2000)
  Branch Length: 800.0m (expected: 800m)
  Length Error: 0.0m

✅ Sheet plane created: sheet.packaging

[GATE 5] Staged filaments for sheet.packaging:
  Stage 1 (Cell→Spine): 48 primitives
  Stage 2 (Spine→Branch): 1 primitive
  Total: 49 filament primitives

✅ Tree rendered:
  Primitives: 50 (trunk=1, branches=1, cell-filaments=48, spines=1, anchor=1)
  Entities: 57 (labels=49, cell-points=48, timebox-labels=8)

[FilamentRenderer] ✅ Turgor force animation started
✅ Demo tree rendered: Avgol @ Tel Aviv
📷 Camera presets: Press 1=TopDown, 2=SideProfile
✅ Relay Cesium World initialized
```

---

## Visual Verification Checklist

After all gates pass:

- [ ] **Anchor marker**: Cyan point + label + vertical pin at trunk base (always visible)
- [ ] **Trunk**: Brown vertical line from anchor (0m) to 2000m
- [ ] **Branch**: Brown horizontal line from trunk top (2000m) extending +East 800m
- [ ] **Sheet**: Rectangular outline 300m above branch endpoint (at 2300m)
- [ ] **Cell grid**: 8×6 cells on sheet (48 total)
- [ ] **Staged filaments**: 
  - 48 thin lines from cells converging to ONE spine point
  - 1 thick line from spine to branch endpoint
  - NO direct cell→branch lines
- [ ] **Camera `1`**: Flies to tree, looking down (trunk/branch/sheet all visible)
- [ ] **Camera `2`**: Flies to tree, looking from side (shows vertical trunk, horizontal branch, sheet above)

---

**Start with Step 1. Implement, test, verify PASS/REFUSAL before proceeding to Step 2.**
