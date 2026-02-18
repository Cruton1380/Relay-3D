# Agent Instructions (Relay)

This repository implements Relay, the universal structure of organized knowledge — a Cesium 3D world where bark-wrapped cylindrical branches carry filament rows that sink with gravitational time toward Merkle-encrypted root archives.

## Quick Start
- Run `npm run dev:cesium`
- Open `http://localhost:3000/relay-cesium-world.html?profile=launch`

## Canonical Source of Truth
- **[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** — The definitive system specification. Cylindrical Bark Geometry model with 35 frozen contracts, 46 sections (every section mapped to its stage gate in §38.3), 36-slice build order across 7 tiers (5 Stage 1 + 1 Stage 2 + 1 Stage 3), dual confidence model, pressure physics, parametric governance, filter tolerances, stigmergic coordination, weather/wind analytics, sonification, knowledge migration lifecycle, 3-stage progressive unlock architecture (Truth Layer, AR Interaction Layer, Game Layer), multi-resource economy, duels, spell taxonomy, founder key, 4 worked use cases. Read this first.
- **[HANDOFF.md](HANDOFF.md)** — Current state summary and entry point for new agents.

## Key Files
- `app/renderers/filament-renderer.js` — core geometry + rendering pipeline
- `relay-cesium-world.html` — entry, camera, demo tree, controls
- `app/utils/enu-coordinates.js` — ENU frame computation, branch-aligned layout
- `core/models/relay-state.js` — canonical state store
- `app/presence/presence-engine.js` — presence system

## Core Model (Do Not Break)
- The bark IS the spreadsheet — it wraps the branch cylinder. Rows = filaments along time axis.
- A filament IS a row. Not a cell. Columns are properties of the filament.
- Gravity (earth time) sinks everything downward. Growth (engagement) counters gravity.
- Twigs are emergent geometry — unclosed filaments at old timeboxes protrude naturally.
- Human projection branches are ALWAYS light blue. SCV/AI projections are ALWAYS lavender. Truth is ALWAYS natural/organic color.
- Magnitude = warm (positive) / cool (negative). Integrity = opacity. These channels are independent.
- Confidence = evidence_present / evidence_required. Automatic. No human override.
- Scars are permanent. Reverts create new commits, never deletions.
- Pressure is emergent from slab firmness gradients, never an independent force.
- Parameters are voted weighted medians, never hardcoded (except frozen contracts).
- Filters are client-side view state, never truth mutations.
- Stages are additive: Stage 3 → Stage 2 AR → Stage 1 filament commits. No stage bypasses a lower stage.
- Real yields more than virtual: achievement tokens only from SCV-validated real-world proofs.
- Spells resolve to commits. Genre is a rendering template. Duels are public filaments.
- Stage Gate 3 requires the founder key (Eitan Asulin). Singular, irreversible.

## What To Do First
1) Read `HANDOFF.md` for current state
2) Read `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` for the full system specification (includes build order in Section 27)
