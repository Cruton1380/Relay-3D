# Relay — Handoff

## Current State

**Clean foundation.** The repository was stripped to essentials on 2026-02-19. All prior code, proof scripts, and archives are preserved in git history under tag `RELAY-PRE-CLEAN-ARCHIVE-V93`.

## What Exists Now

- **Master Plan**: `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` — 107 frozen contracts, 51 sections, 4,400+ lines. The complete system specification from Stage 0 through Stage 3.
- **Globe boundary data**: `data/boundaries/` — 375 GeoJSON files (countries, provinces, cities) for rendering real Earth boundaries.
- **Dev server**: `scripts/dev-server.mjs` — Minimal static HTTP server on port 3000.
- **Entry point**: `index.html` — The Relay globe (to be built).

## What Was Removed

Everything that accumulated during V93 development: 27 app modules, 20 core models, 123 proof scripts, 2,039 archive files, legacy React/Three.js/deck.gl dependencies, 18,000-line monolith HTML. All recoverable via `git checkout RELAY-PRE-CLEAN-ARCHIVE-V93 -- <path>`.

## Build Order

We build visually, step by step, following the Master Plan:

1. **Globe** — Rotating Earth with real boundaries, dark theme, Cesium from CDN
2. **Single tree** — One trunk on the globe, cylindrical bark geometry
3. **Branches** — Category branches extending from trunk
4. **Filaments** — Event lifelines on branches
5. **Slabs** — Timebox materialization
6. **Confidence opacity** — Dual confidence rendering
7. **Notes** — StickyNote lifecycle (TTL → filament birth)
8. **User tree** — Personal tree mirroring participation
9. **Globe metrics** — Attention heat, trunk prominence

Each step gets a proof script before the next begins.

## Cesium

CesiumJS 1.113 loaded from CDN. No npm package needed. Ion token required for terrain/imagery.
