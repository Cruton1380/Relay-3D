# CAM0.4.2-FILAMENT-RIDE-V1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** ATTENTION-CONFIDENCE-1 PASS, VIS-TREE-SCAFFOLD-1 PASS, HEIGHT-BAND-1 PASS, VIS-MEGASHEET-1 PASS, FILAMENT-LIFECYCLE-1 PASS, FILAMENT-DISCLOSURE-1 PASS
**Contract:** docs/architecture/RELAY-MASTER-BUILD-PLAN.md §CAM0.4; docs/architecture/RELAY-PHYSICS-CONTRACTS.md
**Baseline:** v0 implementation exists (enter/next/prev/exit, deterministic path, timebox snap). This spec extends v0 with epistemic integration.

---

## Goal

Extend filament ride from a camera-only movement mode into a **temporal navigation mechanic** that surfaces lifecycle state, disclosure tier, attention/confidence, and commit history at each timebox stop. Makes time physically navigable through the truth structure.

v0 moves the camera along timebox positions.
v1 makes each stop an epistemic readout — what happened here, who backed it, how confident, what lifecycle stage, what disclosure tier.

---

## Scope

### What Changes

1. **Ride HUD context panel** — at each timebox stop, HUD shows: timebox ID, lifecycle state, disclosure tier, confidence %, attention score, commit count, contributor count
2. **R key entry** — press R with a filament focused/selected to enter ride (no API-only entry)
3. **Arrow key navigation** — Left/Right arrow keys step prev/next during active ride (in addition to existing API)
4. **Scaffold-aware path** — in TREE_SCAFFOLD mode, ride path follows scaffold geometry (height-banded positions), not flat canopy positions
5. **Lifecycle state overlay** — during ride, current timebox highlighted with lifecycle-state color (OPEN=green, ACTIVE=blue, SETTLING=amber, CLOSED=grey, ARCHIVED=dim, REFUSAL=red)
6. **Disclosure gate** — if current stop's filament disclosure tier is PRIVATE and rider is not the owner, skip with `[REFUSAL] reason=RIDE_DISCLOSURE_BLOCKED`
7. **Boundary crossing log** — on each step, log what changed (timebox boundary, scope boundary if any, lifecycle transition if different from prior stop)

### What Does NOT Change

- Filament lifecycle/disclosure state machines (read-only)
- Attention/confidence computation (read-only)
- Height band computation (read-only)
- LAUNCH_CANOPY rendering
- FreeFly contract (ride is opt-in, Esc always exits)
- Existing v0 API surface (`relayEnterFilamentRide`, `relayFilamentRideNext`, `relayFilamentRidePrev`, `relayExitFilamentRide`, `relayGetFilamentRideState`)

---

## Allowed Files

- `relay-cesium-world.html` (R key handler, arrow key handler during ride, ride HUD integration, scaffold path builder, lifecycle overlay, disclosure gate, boundary crossing log)
- `app/renderers/filament-renderer.js` (lifecycle-state color lookup, timebox metadata access for ride)
- `app/ui/hud-manager.js` (ride context panel in Tier 1 during active ride)
- `scripts/cam042-filament-ride-v1-proof.mjs` (new)
- `docs/restoration/CAM042-FILAMENT-RIDE-V1-SPEC.md`
- `archive/proofs/*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`, `docs/process/SLICE-REGISTER.md`
- `HANDOFF.md`

### Forbidden

- No changes to filament lifecycle/disclosure state machines
- No changes to attention/confidence computation logic
- No changes to height band computation
- No changes to LAUNCH_CANOPY rendering
- No new data structures beyond ride state extensions
- No auto-enter (ride is always explicit: R key or API)

---

## Definitions

### Ride HUD Context

During active filament ride, HUD Tier 1 replaces the mode line with ride context:

```
Ride: <filamentId> | Step <n>/<total>
TB: <timeboxId> | LC: <lifecycleState> | DT: <disclosureTier>
Conf: <pct>% | Attn: <score> | Commits: <n> | Contributors: <n>
```

When ride exits, HUD reverts to standard mode display.

### Scaffold-Aware Path

When `window._relayRenderMode === 'TREE_SCAFFOLD'`, the ride path builder reads timebox positions from scaffold geometry (height-banded, radial branch layout) instead of flat canopy positions. Path order remains deterministic (sorted by commit index).

### Lifecycle State Colors

| State | Color | Alpha |
|-------|-------|-------|
| OPEN | `#22cc44` (green) | 0.6 |
| ACTIVE | `#3388ff` (blue) | 0.7 |
| SETTLING | `#ffaa22` (amber) | 0.7 |
| CLOSED | `#888888` (grey) | 0.5 |
| ARCHIVED | `#555555` (dim) | 0.3 |
| REFUSAL | `#ff3333` (red) | 0.8 |

Applied as a highlight box/ring around the current timebox slab during ride.

---

## Required Logs

```
[RIDE] enter filament=<id> steps=<n> mode=<canopy|scaffold> result=PASS
[RIDE] step from=<tbId> to=<tbId> index=<n>/<total> lifecycle=<state> disclosure=<tier> conf=<pct> attn=<val>
[RIDE] boundary timebox=<tbId> crossed=<timebox|scope|lifecycle> detail=<description>
[RIDE] exit filament=<id> restoreView=true selectionPreserved=<bool> lodPreserved=<bool>
[RIDE] hudContext filament=<id> step=<n> lifecycle=<state> disclosure=<tier> conf=<pct> attn=<val>
[REFUSAL] reason=RIDE_DISCLOSURE_BLOCKED filament=<id> timebox=<tbId> tier=PRIVATE
[RIDE-PROOF] gate-summary result=PASS stages=<n>/<n>
```

---

## Proof Script

`scripts/cam042-filament-ride-v1-proof.mjs`

### Stages

1. **Boot** — confirm world loaded, filament ride API available, v0 still functional
2. **R key entry** — simulate R key press with filament focused, confirm ride enters
3. **Arrow key navigation** — simulate Left/Right arrow keys, confirm steps execute
4. **HUD context** — verify ride HUD context panel shows lifecycle, disclosure, confidence, attention at each stop
5. **Scaffold-aware path** — toggle to TREE_SCAFFOLD (T key), enter ride, verify path follows scaffold positions (different from canopy positions)
6. **Lifecycle overlay** — verify current timebox highlighted with lifecycle-state color during ride
7. **Disclosure gate** — if any PRIVATE filament exists, verify ride skips with REFUSAL log
8. **Boundary crossing** — verify boundary log emitted on each step (at minimum: timebox boundary)
9. **Exit + restore** — Esc exits ride, camera/selection/LOD restored, HUD reverts to standard
10. **Determinism** — run ride twice on same filament, verify identical path hash
11. **Regression** — v0 API (`relayEnterFilamentRide`, `relayFilamentRideNext`, etc.) still works unchanged
12. **Gate** — `[RIDE-PROOF] gate-summary result=PASS stages=12/12`

---

## Acceptance Criteria

PASS only if:

- R key enters ride when filament is focused (no API-only entry)
- Arrow keys navigate during ride
- HUD shows epistemic context at every stop (lifecycle, disclosure, confidence, attention)
- Scaffold mode uses scaffold geometry for path
- Lifecycle overlay visible during ride
- Disclosure gate prevents riding into PRIVATE filaments (with REFUSAL)
- Boundary crossing logged at every step
- Exit restores camera, selection, LOD, and HUD
- Deterministic (same path hash on repeat)
- v0 API backward compatible
- No regressions in existing proofs

---

## Strategic Context

This slice connects five completed systems into one cognitive mechanic:

- **FILAMENT-LIFECYCLE-1**: lifecycle state visible at each stop
- **FILAMENT-DISCLOSURE-1**: disclosure tier gates and displays at each stop
- **ATTENTION-CONFIDENCE-1**: confidence/attention readout at each stop
- **HEIGHT-BAND-1**: scaffold geometry informs ride path
- **VOTE-COMMIT-PERSISTENCE-1**: commit count and contributor count at each stop

After this slice, temporal navigation is a first-class operation — not just camera movement, but epistemic traversal through truth structure. This is prerequisite for:

- Audit replay (ride a filament to inspect what happened)
- Governance review (ride to see lifecycle transitions)
- Disclosure audit (ride to verify what was revealed when)
- PresenceStream (calls inside time-anchored truth traversal, not just "video in a 3D room")
