# Agent Instructions (Relay)

This repository implements Relay, a backwards-compatible coordination OS built on a Cesium 3D world with canonical filament geometry.

## Quick Start
- Run `npm run dev:cesium`
- Open `http://localhost:3000/relay-cesium-world.html?profile=launch`

## Canonical Source of Truth
- **[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** — The definitive end-to-end build plan (12 modules A-L, 5 tiers, 15 frozen contracts, full coverage matrix). Read this first.
- **[docs/architecture/README.md](docs/architecture/README.md)** — Index of all architecture documents.
- **[HANDOFF.md](HANDOFF.md)** — Current state summary and entry point for new agents.

## Key Files
- `app/renderers/filament-renderer.js` — core geometry + canonical constraints
- `relay-cesium-world.html` — entry, camera, demo tree, controls
- `docs/architecture/RELAY-RENDER-CONTRACT.md` — rendering invariants (sheet orientation, filament origins, timebox grammar)
- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` — 15 frozen contracts

## Canonical Geometry Rules (Do Not Break)
- Initial lane segment must exit opposite the branch (sheet normal).
- Timebox slab must be parallel for all cells (shared `timeDir`).
- Only after slab may lanes bend toward laneTarget/spine.
- Stage 2 is always a single spineCenter -> branchEnd conduit.

## What To Do First
1) Read `HANDOFF.md` for current state
2) Read `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` for the full system plan (includes execution order in Section 8)
