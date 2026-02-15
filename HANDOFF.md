# Relay Project Handoff

This handoff is for any agent joining via the GitHub link. It explains the current state and points to the canonical plan.

## Canonical Plan

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** is the canonical system plan (full coverage).
**[docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md](docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md)** is the execution overlay (R0-R5 restoration-first sequencing).

Companion restoration docs:

- `docs/restoration/RELAY-RESTORATION-PLAN.md`
- `docs/restoration/RESTORATION-INDEX.md`

## Current State (as of 2026-02-14)

### Completed (Proven, Locked)
- **Phase 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated, auto-transition, primitives migration
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament length = cell length, spine aggregation bands
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder), summary sheets (cross-sheet formulas), KPI branch mapping
- **C0**: Route engine (config-driven data flow, provenance, mock streams, dry-run preview)
- **D-Lens-0**: Focus frame (camera + dimming + breadcrumb + entity tracking + exit)
- **UX-1.1-1.3**: Universal Object Contract, Capability Buds, Inspector Context Switching
- **W0-W2 baseline**: Work mode surface and material artifact chain (`HOLD/PROPOSE/COMMIT`), object-bound artifact indexing, action-triggered proposals/commits, route delta summary with auto-HOLD policy trigger, and minimal resolve loop in inspector
- **AC0/LGR0/D1**: Balanced transfer core, ledger projection, and deterministic ledger gate are implemented, proven, and indexed
- **Globe restore slices**: `GLOBE-RESTORE-0..4` + `GLOBE-RESTORE-3A` are implemented, proven, and indexed (world-profile only with proof-profile lock)
- **UX/Navigation hardening**: `USP-1`, `CAM0.4.2` (filament ride), `PQ-3..PQ-7`, and `HUD-1` are implemented, proven, and indexed
- **Governance surface restores**: `BOUNDARY-A1` (commit-governed boundary editor) and `VOTE-A2` (voting UI reactivation) are implemented, proven, and indexed
- **Capstone closure**: `RESTORE-PARITY` integrated proof passes with `OSV-1` and `headless-tier1-parity` green

### D0 Scale and Stress (Current Policy-Proven State)
- Deterministic FPS sampling is locked (`FORCED_RAF`), with no hang path.
- `allPass` now follows explicit policy (`RELAY_D0_PASS_POLICY`, default `dev`).
- Strict truth remains explicit:
  - `RELAY_D0_FPS_MIN_STRICT = 30` (`D0.3-FPS`, `allPassStrict`)
  - `RELAY_D0_FPS_MIN_DEV = 20` (`D0.3-FPS-DEV`, `allPassDev`)
- POLICY proof line is mandatory in logs:
  - `[D0-GATE] POLICY devPass=<..> strictPass=<..> fps=<..> source=<..> devicePixelRatio=<..> resolutionScale=<..>`
- Practical rule: if `allPass` is true under `policy=dev` and viewport is responsive, continue feature work. Treat strict FPS as perf-hardening backlog (not a feature blocker).

### Current Restoration State
- R3 BASIN-RING-1 — PASS (shared-anchor rings + clustering, proof indexed)
- COMPANY-TEMPLATE-FLOW-1 (Phase 5) — PASS (canonical flow → timebox → tree motion, proof indexed)
- VOTE-COMMIT-PERSISTENCE-1 (Phase 6) — PASS (governance persistence, scar overlay, HUD votes, proof indexed)
- FILAMENT-LIFECYCLE-1 — PASS (object contract, dual state machines, inward movement, closure enforcement, turnover metric, band snap, proof indexed)

### Next Work (Restoration-First Execution)
1. Run restoration phases `R0 -> R5` from `docs/restoration/RELAY-RESTORATION-PLAN.md`.
2. Execute immediate slices in order: `HUD-CONSOLIDATION-1`, `NODE-RING-RENDER-1`, `BASIN-RING-1`.
3. Keep process edits minimal and only unblock build/visibility.

## Key Files
- `app/renderers/filament-renderer.js` -- core geometry + canonical constraints
- `relay-cesium-world.html` -- entry, camera, demo tree, controls
- `docs/architecture/RELAY-RENDER-CONTRACT.md` -- rendering invariants
- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` -- 15 frozen contracts

## How to Run
- `npm run dev:cesium`
- Open (canonical restoration path): `http://localhost:3000/relay-cesium-world.html?profile=launch`

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
