# Phase 2.1: Primitives Migration Gate

**Date Created**: 2026-02-06  
**Status**: 🚧 REQUIRED BEFORE PHASE 3  
**Blocked By**: Phase 2 ✅ PASSED

---

## 🎯 Goal

Migrate live tree/filament rendering from Cesium Entities to Cesium Primitives.

### Current State (Entity Mode)
- Trees rendered via `viewer.entities.add()`
- Console shows: "Tree rendered: X entities"
- Entities are simpler but not performant for large trees
- HUD shows: `🌲 Filaments: ⚠️ ENTITY MODE`

### Target State (Primitive Mode)
- Trees rendered via `viewer.scene.primitives.add()`
- Console shows: "Tree rendered: X primitives"
- Primitives are performant and scalable
- HUD shows: `🌲 Filaments: PRIMITIVE`

---

## 📋 Pass Criteria (All Required)

### A. Trunk Rendering
- [ ] Trunk rendered as `Cesium.Primitive` with `PolylineVolumeGeometry` or `PolylineGeometry`
- [ ] Trunk appears as vertical pillar from surface to specified height
- [ ] No entities used for trunk geometry (labels OK)

### B. Branch Rendering
- [ ] Branches rendered as `Cesium.Primitive` with curved geometry
- [ ] Use `PolylineGeometry`, `CorridorGeometry`, or `PolylineVolumeGeometry` based on LOD
- [ ] Branches follow great-circle or ENU arc (not straight through Earth)
- [ ] No entities used for branch geometry (labels OK)

### C. Filament Rendering
- [ ] Filaments rendered as `Cesium.Primitive`
- [ ] LOD ladder working:
  - LANIAKEA/PLANETARY: Thin `PolylineGeometry` (or hidden)
  - REGION: `CorridorGeometry` (ribbons)
  - COMPANY/SHEET: `PolylineVolumeGeometry` (tubes)
- [ ] No entities used for filament geometry (labels OK)

### D. Sheet Rendering
- [ ] Sheets rendered as local plane geometry in ENU frame
- [ ] Sheet oriented perpendicular to branch tangent
- [ ] Sheet size proportional to branch radius
- [ ] No giant slabs floating in space

### E. Performance
- [ ] Console shows primitive count: `"Tree primitives: X"`
- [ ] FPS remains stable (30-60 FPS)
- [ ] No significant performance degradation vs entity mode
- [ ] LOD transitions smooth (no sudden pops or freezes)

### F. LOD Integration
- [ ] `filamentRenderer.setLOD(level)` triggers visible geometry changes
- [ ] Zoom in: filaments gain detail (thin → ribbon → tube)
- [ ] Zoom out: filaments lose detail (tube → ribbon → thin)
- [ ] No "all or nothing" visibility (graceful LOD degradation)

### G. Entities Only for Labels
- [ ] Labels rendered as entities (acceptable)
- [ ] HUD elements as entities (acceptable)
- [ ] NO tree geometry (trunks/branches/filaments) as entities

### H. Console Verification
Console must show:
```
🌲 Rendering tree: X nodes, Y edges
✅ Tree rendered: A primitives, B entities (labels)
```

NOT:
```
✅ Tree rendered: X entities  ❌ (Phase 2.1 FAIL)
```

---

## 🚫 Fail Conditions

Any of these = immediate FAIL:

1. **Entities used for tree geometry**
   - Console shows "Tree rendered: X entities" with no primitive count
   - Or primitive count = 0

2. **Primitives don't render**
   - Primitives added but not visible
   - Console errors during primitive creation

3. **LOD ladder not working**
   - All LOD levels look identical
   - Or geometry doesn't change with zoom

4. **Performance regression**
   - FPS drops below 20
   - Or significant lag during zoom/pan

5. **No proof artifacts**
   - Missing screenshot
   - Missing console log

---

## 🔬 Implementation Notes

### Cesium Primitive Architecture

**What changes**:
```javascript
// OLD (Entity mode):
this.viewer.entities.add({
    polyline: { positions, width, material }
});

// NEW (Primitive mode):
const geometry = new Cesium.PolylineGeometry({
    positions,
    width,
    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
    arcType: Cesium.ArcType.NONE
});

const geometryInstance = new Cesium.GeometryInstance({
    geometry: geometry,
    attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
    },
    id: nodeId
});

const primitive = new Cesium.Primitive({
    geometryInstances: geometryInstance,
    appearance: new Cesium.PolylineColorAppearance()
});

this.viewer.scene.primitives.add(primitive);
this.primitives.push(primitive);
```

### LOD Ladder Implementation

**By altitude** (RelayLODGovernor levels):

| LOD Level | Filament Geometry | Width | Color |
|-----------|------------------|-------|-------|
| LANIAKEA | Hidden or very thin | 0.5 | Dim |
| PLANETARY | `PolylineGeometry` | 1.0 | Normal |
| REGION | `CorridorGeometry` | 2.0 | Normal |
| COMPANY | `CorridorGeometry` | 3.0 | Bright |
| SHEET | `PolylineVolumeGeometry` | 4.0 | Bright |
| CELL | Segmented tubes | 5.0 | Full detail |

**On LOD change**: Clear old primitives, rebuild with new geometry type.

### ENU Frame for Sheets

Sheets must be positioned in local tangent frame:

```javascript
const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(sheet.lon, sheet.lat, 0)
);

const sheetGeometry = new Cesium.PlaneGeometry({
    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
});

const geometryInstance = new Cesium.GeometryInstance({
    geometry: sheetGeometry,
    modelMatrix: enuFrame,
    attributes: { color: ... }
});
```

---

## 📊 Proof Artifacts Required

### 1. Console Log
`archive/proofs/phase2.1-primitives-console.log`

Must contain:
```
🌲 Rendering tree: X nodes, Y edges
✅ Tree rendered: A primitives, B entities (labels)
Primitive breakdown:
  - Trunks: X primitives
  - Branches: Y primitives
  - Filaments: Z primitives
  - Sheets: W primitives
Entity breakdown:
  - Labels: B entities
```

### 2. Screenshot
`archive/proofs/phase2.1-primitives-screenshot.png`

Must show:
- Tree visible on globe
- HUD showing: `🌲 Filaments: PRIMITIVE`
- No visual glitches
- Clean rendering

### 3. LOD Transition Video (Optional but Recommended)
`archive/proofs/phase2.1-lod-transition.mp4`

Shows zoom in/out with visible geometry changes.

---

## 🔧 Implementation Checklist

### Step 1: Update FilamentRenderer Class
- [ ] Add `this.primitives = []` array
- [ ] Create `renderTrunkPrimitive(trunk)` method
- [ ] Create `renderBranchPrimitive(branch)` method
- [ ] Create `renderFilamentPrimitive(edge)` method with LOD ladder
- [ ] Create `renderSheetPrimitive(sheet)` method with ENU frame
- [ ] Update `clear()` to remove primitives: `viewer.scene.primitives.remove(p)`

### Step 2: Implement LOD Ladder
- [ ] Create geometry type selector based on `this.currentLOD`
- [ ] LANIAKEA/PLANETARY → `PolylineGeometry` (thin)
- [ ] REGION → `CorridorGeometry` (ribbons)
- [ ] COMPANY/SHEET → `PolylineVolumeGeometry` (tubes)
- [ ] CELL → Segmented tubes with detail

### Step 3: Update `setLOD()` Method
```javascript
setLOD(level) {
    if (level !== this.currentLOD) {
        this.currentLOD = level;
        this.renderTree();  // Re-render with new geometry
    }
}
```

### Step 4: Update Console Logging
```javascript
const primitiveCount = this.primitives.length;
const entityCount = this.entities.length; // Labels only
RelayLog.info(`✅ Tree rendered: ${primitiveCount} primitives, ${entityCount} entities (labels)`);
```

### Step 5: Update HUD Status
Set filament mode to 'PRIMITIVE':
```javascript
window.getFilamentMode = () => 'PRIMITIVE';
```

### Step 6: Test and Capture Proof
- [ ] Hard refresh
- [ ] Import Excel file
- [ ] Verify primitives used (check console)
- [ ] Test LOD transitions (zoom in/out)
- [ ] Capture screenshot
- [ ] Save console log
- [ ] Update PROOF-INDEX.md

---

## 🚫 Anti-Patterns to Avoid

### Don't Mix Entities and Primitives for Same Geometry
❌ BAD:
```javascript
// Trunk as entity, branches as primitives
this.viewer.entities.add({ polyline: trunkPositions });
this.viewer.scene.primitives.add(branchPrimitive);
```

✅ GOOD:
```javascript
// All geometry as primitives
this.viewer.scene.primitives.add(trunkPrimitive);
this.viewer.scene.primitives.add(branchPrimitive);
// Only labels as entities
this.viewer.entities.add({ position, label });
```

### Don't Rebuild All Primitives Every Frame
❌ BAD:
```javascript
function tick() {
    filamentRenderer.clear();
    filamentRenderer.renderTree();  // Expensive!
}
```

✅ GOOD:
```javascript
// Only rebuild on LOD change or data change
setLOD(level) {
    if (level !== this.currentLOD) {
        this.renderTree();  // Rebuild only when needed
    }
}
```

### Don't Skip ENU Frame for Sheets
❌ BAD:
```javascript
// Sheet in world space (will look wrong when rotated)
const sheetPos = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
```

✅ GOOD:
```javascript
// Sheet in local ENU frame (correctly oriented)
const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(anchorPos);
// Apply sheet geometry in local coordinates
```

---

## 📚 Reference Implementation

See: `app/renderers/relationship-renderer.js`

This already uses primitives correctly:
- `Cesium.PolylineGeometry`
- `Cesium.GeometryInstance`
- `Cesium.Primitive`
- `viewer.scene.primitives.add()`

Use this as a template for migrating `filament-renderer.js`.

---

## 🎯 Gate Execution Order

1. **Implement primitives in FilamentRenderer**
2. **Test with demo tree**
3. **Test with imported Excel file**
4. **Verify LOD transitions**
5. **Capture proof artifacts**
6. **Update PROOF-INDEX.md**
7. **Update ROADMAP-CESIUM-FIRST.md**
8. **Mark Phase 2.1 PASSED**

Only after Phase 2.1 passes → proceed to Phase 3 (Timebox Segmentation).

---

## 🔗 Related Documentation

- [RELAY-CESIUM-ARCHITECTURE.md](../architecture/RELAY-CESIUM-ARCHITECTURE.md) - Architecture spec
- [ROADMAP-CESIUM-FIRST.md](./ROADMAP-CESIUM-FIRST.md) - Full roadmap
- [RelationshipRenderer](../../app/renderers/relationship-renderer.js) - Primitives reference implementation

---

## ⚠️ Current Honest Status

| Capability | Status | Notes |
|------------|--------|-------|
| Buildings | 🟡 DEGRADED | Ion 401 error, no 3D building tiles |
| Boundaries | 🔴 DISABLED | Disabled via feature flag (can be re-enabled) |
| Filaments | 🟡 ENTITY MODE | Working but not primitives yet |
| Core Relationships | ✅ PRIMITIVE | Phase 2 proof used primitives |
| LOD Governor | ✅ OK | Level switching working |
| Excel Import | ✅ OK | Fully functional |
| Crash Prevention | ✅ OK | NaN guards working |

**Gate requirement**: All capabilities must be ✅ OK or explicitly documented as degraded in HUD.

---

## 🔒 Acceptance Criteria

Phase 2.1 = PASSED only if:

1. ✅ Console shows "X primitives, Y entities (labels)"
2. ✅ HUD shows "Filaments: PRIMITIVE"
3. ✅ No geometry rendered as entities
4. ✅ LOD ladder working (zoom in/out changes geometry)
5. ✅ Performance stable (30+ FPS)
6. ✅ Proof artifacts captured and indexed

Otherwise Phase 2.1 = REFUSAL with specific reason code.

---

**Status**: Phase 2.1 specification complete. Ready to implement primitives migration.
