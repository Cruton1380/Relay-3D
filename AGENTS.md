# Agent Instructions (Relay)

This repository is used to implement the Relay Cesium 3D world and canonical filament geometry.

## Quick Start
- Run `npm run dev:cesium`
- Open `http://localhost:8000/relay-cesium-world.html`

## Key Files
- `app/renderers/filament-renderer.js` — core geometry + canonical constraints
- `relay-cesium-world.html` — entry, camera, demo tree, controls
- `docs/` and `PHASE-3-TIMEBOX-LANES-COMPLETE.md` — canonical docs

## Canonical Geometry Rules (Do Not Break)
- Initial lane segment must exit opposite the branch (sheet normal).
- Timebox slab must be parallel for all cells (shared `timeDir`).
- Only after slab may lanes bend toward laneTarget/spine.
- Stage 2 is always a single spineCenter → branchEnd conduit.

## What To Do First
1) Read `HANDOFF.md`
2) Verify current visuals against constraints above
3) Add proof logs + lint gates for P3-A

