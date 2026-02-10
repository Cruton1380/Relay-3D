# Relay Project Handoff

This handoff is for any agent joining via the GitHub link. It explains the current state and points to the canonical plan.

## Canonical Plan

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** is the single source of truth for the entire Relay system: 12 modules (A-L), 5 implementation tiers, 15 frozen contracts, and a 17-item coverage matrix.

## Current State (as of 2026-02-10)

### Completed (Proven, Locked)
- **Phase 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated, auto-transition, primitives migration
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament length = cell length, spine aggregation bands
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder), summary sheets (cross-sheet formulas), KPI branch mapping
- **C0**: Route engine (config-driven data flow, provenance, mock streams, dry-run preview)
- **D-Lens-0**: Focus frame (camera + dimming + breadcrumb + entity tracking + exit)
- **UX-1.1-1.3**: Universal Object Contract, Capability Buds, Inspector Context Switching

### Partially Passing (D0 Scale and Stress)
- D0.1 Ingestion: PASS (10k rows, 442ms)
- D0.2 Recompute: REFUSAL (3,167ms, limit 2,000ms) -- needs optimization
- D0.3 Redraw: PASS
- D0.4 Viewport: PASS
- D0.5 Date Funcs: PASS

### Next Work (per master plan section 4, Tier 1)
1. **D0 P1-A**: Add per-step timing breakdown inside `recomputeModuleChain`
2. **D0 P1-B**: Dependency-gated match rebuild (dirty-set optimization)
3. **D0 P1-C**: Fix degenerate lane geometry (DUP_POINTS=499)
4. Rerun `await relayD0Gate(10000)` to verify all 5 sub-gates PASS

## Key Files
- `app/renderers/filament-renderer.js` -- core geometry + canonical constraints
- `relay-cesium-world.html` -- entry, camera, demo tree, controls
- `docs/architecture/RELAY-RENDER-CONTRACT.md` -- rendering invariants
- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` -- 15 frozen contracts

## How to Run
- `npm run dev:cesium`
- Open: `http://localhost:8000/relay-cesium-world.html`

## Canonical Geometry Constraints (must not regress)
1. **Opposite-side exit**: All cell lanes begin along sheet normal pointing opposite the branch.
2. **Parallel slab for timeboxes**: Timeboxes stacked along sheet-wide `timeDir`, identical for all cells.
3. **Bend only after slab**: Lanes may curve toward laneTarget/spine only after slab ends.
4. **Stage 2 single conduit**: Stage 2 is exactly one spineCenter -> branchEnd conduit per sheet.

## Document Structure
- `docs/architecture/` -- Architecture specs (master plan, render contract, physics contracts, crypto, stigmergy)
- `docs/governance/` -- Governance specs (forbidden language, pressure model, cadence, stage gates, work zones)
- `docs/business/` -- Business docs (for leaders, operating model)
- `docs/implementation/` -- Phase implementation records
- `docs/tutorials/` -- Quick start, dev setup, visual verification
- `archive/` -- Historical documents (read-only)
- `archive/superseded-docs/` -- Documents fully absorbed by the master plan
