# Phase 2 Proof Specification

**Version**: 1.0.0  
**Date**: 2026-02-06  
**Status**: Target specification (implementation pending)

---

## Objective

Produce **one screenshot** that proves the core Phase 2 capabilities:
1. Local tree topology (trees rooted at real locations)
2. Core-routed global relationships (V-shape through Earth's center)
3. Primitives-based rendering (not entities)
4. LOD system functioning
5. ENU orientation correctness

---

## Test Scenario

### Two Real-World Locations

**Tree A**: Tel Aviv, Israel  
- Lat/Lon: `32.0853, 34.7818`
- ID: `tree.telaviv`

**Tree B**: New York City, USA  
- Lat/Lon: `40.7128, -74.0060`
- ID: `tree.nyc`

**Why these locations**:
- Far enough apart to make core-routed V obvious
- Easy to sanity-check on globe
- Not near poles (avoid tangent-frame edge cases)

---

## Relationship to Connect Them

**Type**: `RELATIONSHIP.SUPPLY_CHAIN`

**Details**:
- ID: `rel.telaviv_nyc.packaging_film`
- Label: "Shared supplier: Packaging Film"
- Scope: `boundary.country.global` (or `INTL`)
- Status: `ACTIVE`
- Route: Via `earth.core`

**Structure**:
```javascript
{
    id: "rel.telaviv_nyc.packaging_film",
    type: "RELATIONSHIP.SUPPLY_CHAIN",
    a: { anchorId: "tree.telaviv" },
    b: { anchorId: "tree.nyc" },
    route: "via_earth_core",
    label: "Shared supplier: Packaging Film",
    scope: "INTL",
    status: "ACTIVE"
}
```

---

## Camera Position

**Goal**: Show both trees + core-routed relationship in one frame.

**Camera Spec**:
- **Look-at**: Earth center (always)
- **Altitude**: 25,000–35,000 km above surface
- **Heading**: 0° (or as needed)
- **Pitch**: -35° to -55° (tilted so V filament not hidden behind Earth)
- **Time**: Fixed time for stable lighting (optional)

**Alternative** (if single frame difficult):
- Screenshot A: Both local trees visible
- Screenshot B: Relationship V into core visible

Both count as "proof set" but single screenshot preferred.

---

## PASS Criteria (All Must Be True)

### A) Local Tree Topology ✅

**Required**:
- ✅ Two distinct trees clearly rooted at their own lat/lon points
- ✅ No branch or trunk spans across surface between cities
- ✅ Each tree has at least:
  - Trunk (vertical pillar from anchor)
  - One branch
  - One sheet endpoint (simplified proxy OK)

**Visual check**: Trees stand at their locations, do not reach across planet.

---

### B) Core-Routed Relationship ✅

**Required**:
- ✅ Single relationship rendered as two legs:
  - Tree A → Earth core
  - Earth core → Tree B
- ✅ Two legs form clear V shape converging to Earth's center
- ✅ Relationship visually different from local filaments (thinner, more global)

**Visual check**: V-shape is unmistakable, converges at Earth center.

---

### C) Primitives (Not Entities) ✅

**Required**:
- ✅ Console or HUD confirms primitives used for:
  - Relationship filament
  - Trunks
  - Branches
- ✅ Entities may exist for labels/HUD only, not main geometry
- ✅ Log shows: `viewer.scene.primitives.length > 0`

**Technical check**: Main geometry via `Cesium.Primitive`, not `viewer.entities.add()`.

---

### D) LOD Behavior ✅

**Required at planetary zoom**:
- ✅ Trees visible in simplified representation (trunks/branches proxy OK)
- ✅ Sheets/cells NOT visible (hidden at this LOD)
- ✅ Relationship filament visible (global link shown at planetary)
- ✅ LODGovernor reports `PLANETARY` level

**Visual check**: Appropriate detail for zoom level, no over-detail clutter.

---

### E) ENU Correctness (Minimal Proof) ✅

**Required**:
- ✅ Debug indicator that ENU frames used for each tree anchor:
  - Tiny axis triad, OR
  - Log line: `"ENU frame computed for tree.telaviv"`, OR
  - Second close zoom screenshot showing one sheet perpendicular to branch (later in Phase 2)

**Technical check**: `Cesium.Transforms.eastNorthUpToFixedFrame()` called for each tree.

---

## FAIL Criteria (Refusal Conditions)

**Any of these = immediate Phase 2 FAIL**:

### ❌ Surface Bridge Exists

**Failure**: Any filament/branch visually connecting Tel Aviv to NYC along surface/sky (no core routing).

**Refusal reason**: Violates core topology rule.

---

### ❌ One Trunk Spans Multiple Cities

**Failure**: One tree with branches reaching across continents (planet-spanning tree).

**Refusal reason**: Violates local tree topology.

---

### ❌ Core Is Not Convergence Point

**Failure**: Relationship legs do not converge at Earth center, or converge at arbitrary hub in space.

**Refusal reason**: Violates core-routing physics.

---

### ❌ Entities-Only Rendering

**Failure**: Main geometry implemented via `viewer.entities.add()` instead of primitives (except labels).

**Refusal reason**: Phase 2 requires primitives-based rendering.

---

### ❌ LOD Violates Visibility Rules

**Failure**: 
- Cells/sheets visible at planetary zoom, OR
- Trees vanish entirely while relationship remains (missing local anchor legibility)

**Refusal reason**: LOD governor not functioning.

---

### ❌ No Proof Artifact

**Failure**: Screenshot exists but no accompanying console log showing:
- Primitive usage
- LOD level
- Relationship renderer confirmation

**Refusal reason**: "PASSED" requires proof artifact.

---

## Visual Enhancement (Optional)

**Core marker** (proof mode only):
- Render `earth.core` as tiny, dim neutral marker
- Small white dot (not glowing, not dramatic)
- Just enough to verify convergence
- **Remove/disable after Phase 2 passes**

---

## Proof Artifacts to Store

**Location**: `archive/proofs/`

### 1. Screenshot

**File**: `phase2-proof-screenshot.png`

**Contents**: 
- Both trees visible at their locations
- Core-routed relationship V visible
- Camera view shows Earth curvature

---

### 2. Console Log

**File**: `phase2-proof-console.log`

**Contents**:
```
=== Phase 2 Proof - Console Log ===
Date: 2026-02-06
Cesium Version: 1.113

Current LOD Level: PLANETARY
Camera Height: 28000000 m (28,000 km)

Primitive Counts:
- Total primitives: 5
  - Trunk A: 1 (PolylineVolumeGeometry)
  - Trunk B: 1 (PolylineVolumeGeometry)
  - Branch A: 1 (PolylineGeometry)
  - Branch B: 1 (PolylineGeometry)
  - Relationship: 1 (2 legs via core)

Relationship Renderer:
- Relationship ID: rel.telaviv_nyc.packaging_film
- Leg A: tree.telaviv → earth.core
- Leg B: earth.core → tree.nyc
- Route verified: V-shape converges at EARTH_CENTER

ENU Frames:
- tree.telaviv: ENU frame computed at (32.0853, 34.7818)
- tree.nyc: ENU frame computed at (40.7128, -74.0060)

Entity Count: 3 (labels only, no geometry)

=== End Log ===
```

---

### 3. Spec Document

**File**: `phase2-proof-spec.md` (this document)

---

## Implementation Checklist

Before capturing proof screenshot:

- [ ] `RelayState` has `core` and `relationships` populated
- [ ] Two trees at Tel Aviv and NYC coordinates
- [ ] One relationship connecting them
- [ ] Relationship renderer creates two legs (A→core, core→B)
- [ ] Primitives used (not entities)
- [ ] LOD governor reports PLANETARY
- [ ] ENU frames computed for both trees
- [ ] Console log captures all required data
- [ ] Screenshot shows all PASS criteria

---

## Pass/Fail Decision

**PASS if**: All 5 criteria (A–E) met + no FAIL conditions.

**FAIL if**: Any refusal condition met.

**Phase 2 marked PASSED only after**:
1. Screenshot stored
2. Console log stored
3. This spec stored
4. Reference added to `archive/proofs/PROOF-INDEX.md`

---

**Next**: Implement relationship renderer + capture proof artifacts.
