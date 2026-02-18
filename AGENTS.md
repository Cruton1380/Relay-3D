# Agent Instructions (Relay)

This repository implements Relay, the universal structure of organized knowledge — a Cesium 3D world where bark-wrapped cylindrical branches carry filament rows that sink with gravitational time toward Merkle-encrypted root archives.

## Quick Start
- Run `npm run dev:cesium`
- Open `http://localhost:3000/relay-cesium-world.html?profile=launch`

## Canonical Source of Truth
- **[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** — The definitive system specification. Cylindrical Bark Geometry model with 44 frozen contracts, 49 sections (every section mapped to its stage gate in §38.3), 39-slice build order across 8 tiers, 3-stage progressive unlock architecture (Truth Layer, AR Interaction Layer, Game Layer), multi-resource economy (engagement credits + achievement tokens + active capacity + Power), duels with MTG battle mechanics, spell taxonomy with card integration and discovery mechanics, detection mesh, founder key with day-1 encrypted spell registry, fog of war progressive discovery, RPG attribute mapping, voice input pipeline (Whisper → Architect → Canon), engineering infrastructure (16 gaps), 4 worked use cases. Read this first.
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
- Voice commands are proposals — same governance as any other input. No voice command bypasses commit materiality or work zones.
- Architect parses, Canon proposes, Human decides. The three-stage voice pipeline is non-collapsible.
- Power cannot buy governance. Public world graphics are earned only. Stage 1 responsibility outweighs Stage 3 power.
- Bystander privacy is absolute — detection mesh never processes non-Relay entities.
- Card and spell registries are append-only. Sleep regeneration is community-governed.

## What To Do First
1) Read `HANDOFF.md` for current state
2) Read `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` for the full system specification (includes build order in Section 27)
