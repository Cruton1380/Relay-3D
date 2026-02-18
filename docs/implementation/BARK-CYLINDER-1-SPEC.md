# BARK-CYLINDER-1 Specification

**Date:** 2026-02-17
**Status:** SPEC LOCK (pre-implementation)
**Type:** Engine migration (renderer coordinate system)
**Master Plan Reference:** Section 27.2, Tier 1, Slice 1
**Geometry Sections:** §3.1-3.3, §32

---

## Objective

Replace planar sheet/branch assumptions with cylindrical bark coordinates while preserving:

- Stable ID law (§32)
- Deterministic replay guarantees (E3-REPLAY-1)
- Proof discipline + artifacts
- Existing tier stack (CAM, D-Lens, VIS, OSV baseline)

This is a **core engine migration**, not a UI feature. The coordinate system that positions filaments, flattens sheets, snaps cameras, and renders branches changes from planar to cylindrical. Everything above the renderer (commit semantics, IDs, packets, replay, presence) stays untouched.

---

## Hard Constraints

1. No changes to commit semantics, IDs, packets, or replay engine.
2. No new social/voting scope.
3. No "silent compatibility layers" that bypass the new math without proof.
4. Every sub-phase ends with a proof artifact and a gate summary line.
5. No sub-phase begins until the previous sub-phase is PASS.
6. Regression gate (BC1-f) must PASS all prior proof suites before BARK-CYLINDER-1 is marked COMMIT.

---

## BC1 Sub-Phases

### BC1-a: Coordinate Math Library

**What changes:**
Introduce canonical bark coordinate utilities and conversions. Pure math — no rendering, no state mutation, no DOM.

**New module:**
`app/utils/bark-coordinates.js`

**Canonical definitions:**
- `l` = along-branch axis (time direction). `l=0` at trunk junction, `l=L_max` at branch tip.
- `r` = radial distance from branch center (lifecycle maturity). `r=R_max` is outer bark (OPEN/new), `r=0` is center (ABSORBED).
- `theta` = angle around circumference (approach direction). `theta=0` is north, `theta=pi/2` is east. Radians.

**Required API (minimum):**

```javascript
branchFrameFromENU(branch)
// → { origin, T, N, B }
// T = tangent (branch direction along l)
// N = normal (first radial direction)
// B = binormal (second radial direction)
// Right-handed frame: T × N = B

cartesianToBark(pos, frame, radius)
// → { l, r, theta }
// Converts world-space cartesian position to bark coordinates
// relative to branch frame and nominal radius

barkToCartesian({ l, r, theta }, frame, radius)
// → Cartesian3 position in world space
// Inverse of cartesianToBark

projectToBarkSurface({ l, theta }, frame, radius)
// → Cartesian3 position on cylinder surface (r fixed to radius)
// Convenience for placing new filaments at bark level
```

**Proof gate:**
Unit tests only. No render changes.
- Roundtrip: `pos → (l,r,theta) → pos` within ε (ε = 1e-6 meters)
- Surface projection: `r == R_max` stays on cylinder surface within ε
- ENU alignment: `T` matches branch direction vector
- Frame handedness: `T × N = B` (right-handed)
- Edge cases: `theta` wraps at `2*pi`, `l=0` at trunk junction, `r=0` at center

**Logs:**
```
[BC1-a] roundtrip result=PASS maxErr=<m>
[BC1-a] surfaceProjection result=PASS maxErr=<m>
[BC1-a] frame result=PASS handedness=right
[BC1-a] edgeCases result=PASS thetaWrap=PASS lZero=PASS rZero=PASS
[BC1-a] gate-summary result=PASS
```

**Artifact:**
`archive/proofs/bc1-a-coord-math-console-YYYY-MM-DD.log`

**Refusal conditions:**
```
[REFUSAL] reason=BC1A_ROUNDTRIP_ERROR maxErr=<m>
[REFUSAL] reason=BC1A_FRAME_INVALID detail=<...>
[REFUSAL] reason=BC1A_THETA_WRAP_FAIL
```

**Allowed files:**
- `app/utils/bark-coordinates.js` (NEW)
- `scripts/bc1-a-coord-math-proof.mjs` (NEW)
- `archive/proofs/bc1-a-*` (artifacts)

---

### BC1-b: Branch Cylinder Primitive

**What changes:**
Replace planar "branch surface" geometry with an actual cylinder mesh/primitive at BRANCH LOD. Bark UV mapping with placeholder texture or grid lines.

**Allowed:**
- Branch cylinder render (CylinderGeometry or equivalent Cesium primitive)
- Bark UV mapping (placeholder texture/lines acceptable for this phase)
- Branch radius from existing state (or sensible default)

**Not allowed:**
- Repositioning filaments on cylinder (that's BC1-c)
- Changing filament IDs or state
- Modifying commit/replay/packet logic

**Implementation notes:**
- Each branch in the scaffold gets a cylinder primitive with:
  - Length derived from timebox count × timebox spacing
  - Radius from branch radius state (or default)
  - Orientation aligned with branch frame `T` vector from BC1-a
- Existing filament markers continue rendering at their current (planar) positions
- The cylinder is the new branch surface; old planar branch primitive is removed or hidden

**Proof gate:**
Visual + log:
- Branch renders as cylinder at BRANCH LOD
- Existing filaments still show (even if position is approximated/planar)
- No runtime exceptions on load, zoom, navigate
- Scaffold mode (T key) shows cylindrical branches

**Logs:**
```
[BC1-b] branchCylinder result=PASS branch=<id> radius=<m> length=<m>
[BC1-b] filamentVisibility result=PASS count=<n> visible=<n>
[BC1-b] noException result=PASS
[BC1-b] gate-summary result=PASS
```

**Artifact:**
```
archive/proofs/bc1-b-branch-cylinder-console-YYYY-MM-DD.log
archive/proofs/bc1-b-branch-cylinder-YYYY-MM-DD.png (screenshot, optional)
```

**Refusal conditions:**
```
[REFUSAL] reason=BC1B_BRANCH_CYLINDER_MISSING branch=<id>
[REFUSAL] reason=BC1B_RENDER_EXCEPTION msg=<...>
[REFUSAL] reason=BC1B_FILAMENT_INVISIBLE count=<n> missing=<n>
```

**Allowed files:**
- `app/renderers/filament-renderer.js` (branch primitive path)
- `app/utils/bark-coordinates.js` (import only, no changes)
- `relay-cesium-world.html` (if branch primitive creation is inline)
- `scripts/bc1-b-branch-cylinder-proof.mjs` (NEW)
- `archive/proofs/bc1-b-*` (artifacts)

---

### BC1-c: Filament Positioning on Bark Surface

**What changes:**
All filament placement uses bark coordinates `(l, r, theta)` and maps to the cylinder surface via `barkToCartesian`.

**Rules:**
- Filament rows exist at bark surface (`r = R_max`) until lifecycle drives inward (later slices handle inward migration)
- `theta` is stable per filament (approach direction from counterparty, or deterministic hash-based fallback if no counterparty data)
- `l` uses timebox position mapping (existing timebox spacing logic feeds `l`)
- `r = R_max` for all filaments in this phase (radial lifecycle migration is TREE-RING-1, slice 4)

**Position computation:**
```
For each filament F:
  l = timeboxIndex(F) * timeboxSpacing
  r = R_max  (all at bark surface for now)
  theta = approachAngle(F) || deterministicFallback(F.filamentId)
  worldPos = barkToCartesian({l, r, theta}, branchFrame, branchRadius)
```

**Proof gate:**
Deterministic position proofs from known inputs:
- For a set of known filaments: computed `(l, r, theta)` matches expected values
- Rendered positions correspond to `barkToCartesian` output (visual verification)
- No filament ID changes (stable ID law preserved)
- No duplicate positions (each filament has unique `(l, theta)` at minimum)

**Logs:**
```
[BC1-c] filamentPlacement result=PASS count=<n> maxErr=<m>
[BC1-c] sample filament=<id> l=<...> r=<...> theta=<...>
[BC1-c] idStability result=PASS (no ID changes detected)
[BC1-c] noDuplicatePositions result=PASS
[BC1-c] gate-summary result=PASS
```

**Artifact:**
`archive/proofs/bc1-c-filament-placement-console-YYYY-MM-DD.log`

**Refusal conditions:**
```
[REFUSAL] reason=BC1C_FILAMENT_POSITION_MISMATCH filament=<id> err=<m>
[REFUSAL] reason=BC1C_ID_MUTATION filament=<id>
[REFUSAL] reason=BC1C_DUPLICATE_POSITION filament=<id> collidesWith=<id>
```

**Allowed files:**
- `app/renderers/filament-renderer.js` (filament placement path)
- `app/utils/bark-coordinates.js` (import, no changes unless extending API)
- `core/models/relay-state.js` (if filament position state needs `barkPosition` field)
- `scripts/bc1-c-filament-placement-proof.mjs` (NEW)
- `archive/proofs/bc1-c-*` (artifacts)

---

### BC1-d: Bark-to-Flat (Zoom-to-Flat) Transition

**What changes:**
Implement conformal unwrap at SHEET/CELL LOD. The cylindrical bark surface smoothly flattens into a 2D spreadsheet grid as the user zooms in.

**LOD transitions:**
- **BRANCH**: Full cylinder. Bark texture visible. Rows not individually readable.
- **BARK**: Cylinder partially flattening. Column headers appearing. Some curvature remains.
- **SHEET**: Nearly flat. Traditional spreadsheet feel. Full 2D grid.
- **CELL**: Fully flat 2D spreadsheet. Editable. Conformal projection from cylinder to plane.

**Unwrap math:**
The conformal projection maps cylindrical coordinates to screen-space 2D:
```
At CELL LOD:
  screenX = theta * R_max  (angular position → horizontal)
  screenY = l              (branch position → vertical / time axis)
```
With interpolation parameter `t` (0=cylinder, 1=flat):
```
  renderPos = lerp(barkToCartesian({l,r,theta}), flatPosition({l,theta}), t)
  t = lodBlendFactor(cameraDistance, BRANCH_THRESHOLD, CELL_THRESHOLD)
```

**Proof gate:**
- At CELL LOD: grid is flat and editable (select, edit, range, paste, batch commit)
- At BRANCH LOD: grid is fully wrapped (cylinder)
- Zoom out: grid re-wraps deterministically
- No ID changes during transition (same `filamentId`, same `rowRef`)
- No selection loss during transition
- Spreadsheet lens actions still work: select, edit, range operations, paste, batch commit

**Logs:**
```
[BC1-d] unwrap result=PASS mode=<BARK|SHEET|CELL> distortion=<metric>
[BC1-d] editParity result=PASS ops=select,edit,range,paste,batchCommit
[BC1-d] idStability result=PASS (no ID changes through LOD transition)
[BC1-d] rewrap result=PASS (zoom out restores cylinder)
[BC1-d] gate-summary result=PASS
```

**Artifact:**
`archive/proofs/bc1-d-unwrap-console-YYYY-MM-DD.log`

**Refusal conditions:**
```
[REFUSAL] reason=BC1D_UNWRAP_NONDETERMINISTIC
[REFUSAL] reason=BC1D_EDIT_PARITY_FAIL op=<operation>
[REFUSAL] reason=BC1D_ID_MUTATION_DURING_TRANSITION
[REFUSAL] reason=BC1D_REWRAP_MISMATCH
```

**Allowed files:**
- `app/renderers/filament-renderer.js` (LOD transition logic)
- `app/utils/bark-coordinates.js` (add `flattenBark` / `unwrapCylinder` utilities if needed)
- `relay-cesium-world.html` (LOD threshold constants, if inline)
- `scripts/bc1-d-unwrap-proof.mjs` (NEW)
- `archive/proofs/bc1-d-*` (artifacts)

---

### BC1-e: Camera + Snap Migration to Cylindrical Normals

**What changes:**
Update camera docking, snap, orbit, and walk logic to use local bark normals and the branch cylindrical frame. All existing camera behaviors must work on cylindrical branches.

**Camera behaviors that must survive:**
- **Dock**: Camera docks face-on to bark surface (normal = outward radial at dock point)
- **Orbit**: Camera orbits around branch axis (not around a flat sheet normal)
- **Focus sphere**: D-Lens focus frame places camera at correct distance from cylindrical surface
- **Branch walk**: Walking along a branch follows the bark surface (l axis), not a straight line
- **Free-fly**: Unrestricted camera stays unrestricted
- **Ride**: Filament ride (R key) follows filament along cylindrical bark path
- **Presets**: Globe, tree, branch, sheet presets compute correct positions for cylindrical geometry

**Proof gate:**
Run existing camera proof suite against cylindrical bark:
- CAM contracts PASS (all presets, transitions, restore)
- D-Lens focus restore PASS (focus frame computes correct sphere for cylinder)
- Branch walk PASS (follows bark surface, not straight line)
- Filament ride PASS (follows filament (l, theta) path on cylinder)
- No teleport, no trap, no LOD discontinuity
- No camera-inside-branch (ensure minimum distance from center axis)

**Logs:**
```
[BC1-e] camParity result=PASS presets=<n> transitions=<n>
[BC1-e] focusParity result=PASS
[BC1-e] branchWalkParity result=PASS
[BC1-e] filamentRideParity result=PASS
[BC1-e] noTeleport result=PASS
[BC1-e] noCameraInsideBranch result=PASS
[BC1-e] gate-summary result=PASS
```

**Artifact:**
`archive/proofs/bc1-e-camera-parity-console-YYYY-MM-DD.log`

**Refusal conditions:**
```
[REFUSAL] reason=BC1E_CAMERA_RESTORE_FAIL preset=<name>
[REFUSAL] reason=BC1E_LOD_DISCONTINUITY from=<lod> to=<lod>
[REFUSAL] reason=BC1E_CAMERA_INSIDE_BRANCH branch=<id>
[REFUSAL] reason=BC1E_BRANCH_WALK_STRAIGHT (not following bark surface)
```

**Allowed files:**
- `relay-cesium-world.html` (camera logic, presets, snap, dock)
- `app/utils/bark-coordinates.js` (import for normal computation)
- Camera-related modules (if extracted to separate files)
- `scripts/bc1-e-camera-parity-proof.mjs` (NEW)
- `archive/proofs/bc1-e-*` (artifacts)

---

### BC1-f: Regression Gate (Full Suite)

**What changes:**
No new features. Run the full regression suite against the new cylindrical geometry.

**Required proof runs:**
Every previously proven slice must PASS. This includes (but is not limited to):
- OSV-1 baseline
- Headless parity (HEADLESS-0)
- VIS-TREE-SCAFFOLD-1
- VIS-MEGASHEET-1
- VIS-LIFELINE-AMBIENT-1
- CAM0.4.2-FILAMENT-RIDE-V1
- PRESENCE-STREAM-1
- PRESENCE-RENDER-1
- PRESENCE-COMMIT-BOUNDARY-1
- E3-REPLAY-1
- E1-CRYPTO-1
- D0 scale gates

**Special attention:**
- Replay engine must produce byte-identical golden hashes (if filament positions changed in state, replay must still converge)
- Crypto chain integrity must hold (position changes must not break Merkle chains)
- Headless mode must produce same data outputs (headless never touches rendering, but verify no side effects)

**Logs:**
```
[BC1-f] osv1 result=PASS
[BC1-f] headless-parity result=PASS
[BC1-f] vis-scaffold result=PASS
[BC1-f] vis-megasheet result=PASS
[BC1-f] vis-lifeline result=PASS
[BC1-f] cam042-ride result=PASS
[BC1-f] presence-stream result=PASS
[BC1-f] presence-render result=PASS
[BC1-f] presence-commit-boundary result=PASS
[BC1-f] e3-replay result=PASS
[BC1-f] e1-crypto result=PASS
[BC1-f] d0-scale result=PASS
[BC1-f] gate-summary result=PASS allProofs=<n> allPass=<n>
```

**Artifact:**
`archive/proofs/bc1-f-regression-console-YYYY-MM-DD.log`

**Refusal conditions:**
```
[REFUSAL] reason=BC1F_REGRESSION_FAIL proof=<name> detail=<...>
```

**Allowed files:**
- Proof scripts only (no feature code changes)
- `archive/proofs/bc1-f-*` (artifacts)
- `archive/proofs/PROOF-INDEX.md` (update)
- `docs/process/SLICE-REGISTER.md` (update)

---

## File Touch Summary

| Sub-phase | New Files | Modified Files |
|-----------|-----------|----------------|
| BC1-a | `app/utils/bark-coordinates.js`, `scripts/bc1-a-coord-math-proof.mjs` | — |
| BC1-b | `scripts/bc1-b-branch-cylinder-proof.mjs` | `app/renderers/filament-renderer.js`, `relay-cesium-world.html` (if inline) |
| BC1-c | `scripts/bc1-c-filament-placement-proof.mjs` | `app/renderers/filament-renderer.js`, `core/models/relay-state.js` (if barkPosition field added) |
| BC1-d | `scripts/bc1-d-unwrap-proof.mjs` | `app/renderers/filament-renderer.js`, `app/utils/bark-coordinates.js` |
| BC1-e | `scripts/bc1-e-camera-parity-proof.mjs` | `relay-cesium-world.html`, `app/utils/bark-coordinates.js` |
| BC1-f | — | Proof index + slice register only |

**Total new files:** 6 (1 coordinate library + 5 proof scripts)
**Total modified files:** 4 core files (`filament-renderer.js`, `bark-coordinates.js`, `relay-cesium-world.html`, `relay-state.js`)

---

## Indexing Rule

After each sub-phase PASS:
1. Write artifact(s) to `archive/proofs/bc1-<phase>-*`
2. Add entry to `archive/proofs/PROOF-INDEX.md`
3. No "PASS" without artifact.

After BC1-f PASS (full slice complete):
1. Update `docs/process/SLICE-REGISTER.md` — add BARK-CYLINDER-1 row with COMMIT status
2. Update `docs/process/ACTIVE-SLICE.md` — set to IDLE or next slice
3. Update `HANDOFF.md` — add completion record

---

## Exit Criteria

BARK-CYLINDER-1 is COMMIT when:
- All six sub-phases (BC1-a through BC1-f) are individually PASS with artifacts
- The full regression suite (BC1-f) shows zero regressions
- Branch geometry renders as cylinder at BRANCH LOD
- Filaments are positioned on cylindrical bark surface
- Zoom-to-flat transition works (cylinder → flat grid → cylinder)
- Camera behaviors work on cylindrical branches
- Stable IDs unchanged
- Replay golden hashes unchanged (or justified divergence documented)
- Crypto chain integrity preserved

---

## What This Slice Does NOT Do

These are explicitly deferred to later slices:

| Deferred Feature | Deferred To |
|-----------------|-------------|
| Filament radial migration (lifecycle → inward) | TREE-RING-1 (slice 4) |
| Angular approach direction from counterparty data | TREE-RING-1 (slice 4) |
| Helical twist | HELIX-1 (slice 5) |
| Slab color/opacity/firmness revision | SLAB-REVISION-1 (slice 6) |
| Gravitational sinking along branch | GRAVITY-SINK-1 (slice 3) |
| Twig emergence | TWIG-1 (slice 7) |
| Wilt/collision physics | WILT-1 (slice 8) |
| Projection branches | PROJECTION-1 (slice 11) |

BARK-CYLINDER-1 provides the geometric foundation. Everything else builds on top of it.

---

*Spec locked. Implementation begins on ACTIVE-SLICE update.*
