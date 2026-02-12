# Relay Project Handoff

This handoff is for any agent joining via the GitHub link. It explains the current state and points to the canonical plan.

## Canonical Plan

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** is the single source of truth for the entire Relay system: 12 modules (A-L), 5 implementation tiers, 15 frozen contracts, and a 21-item coverage matrix.

## Current State (as of 2026-02-11)

### Completed (Proven, Locked)
- **Phase 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated, auto-transition, primitives migration
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament length = cell length, spine aggregation bands
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder), summary sheets (cross-sheet formulas), KPI branch mapping
- **C0**: Route engine (config-driven data flow, provenance, mock streams, dry-run preview)
- **D-Lens-0**: Focus frame (camera + dimming + breadcrumb + entity tracking + exit)
- **UX-1.1-1.3**: Universal Object Contract, Capability Buds, Inspector Context Switching
- **W0-W2 baseline**: Work mode surface and material artifact chain (`HOLD/PROPOSE/COMMIT`), object-bound artifact indexing, action-triggered proposals/commits, route delta summary with auto-HOLD policy trigger, and minimal resolve loop in inspector

### D0 Scale and Stress (Current Policy-Proven State)
- Deterministic FPS sampling is locked (`FORCED_RAF`), with no hang path.
- `allPass` now follows explicit policy (`RELAY_D0_PASS_POLICY`, default `dev`).
- Strict truth remains explicit:
  - `RELAY_D0_FPS_MIN_STRICT = 30` (`D0.3-FPS`, `allPassStrict`)
  - `RELAY_D0_FPS_MIN_DEV = 20` (`D0.3-FPS-DEV`, `allPassDev`)
- POLICY proof line is mandatory in logs:
  - `[D0-GATE] POLICY devPass=<..> strictPass=<..> fps=<..> source=<..> devicePixelRatio=<..> resolutionScale=<..>`
- Practical rule: if `allPass` is true under `policy=dev` and viewport is responsive, continue feature work. Treat strict FPS as perf-hardening backlog (not a feature blocker).

### Next Work (per master plan section 4, Tier 1)
1. **AC0.1-AC0.4**: Implement balanced `TransferPacket` and mirrored `ResponsibilityPacket` with hard validation (`sum legs = 0` per unit), and enforce 3-way match as a posting gate.
2. **LGR0.1-LGR0.3**: Implement Ledger v0 (COA seed, journal validator, append-only posting store, deterministic trial balance) and add `D1-LEDGER-GATE`.
3. **P2P Posting Vertical Slice**: Wire canonical posting paths (`GR: Dr Inventory / Cr GRIR`, `Invoice: Dr GRIR / Cr AP`, `Payment: Dr AP / Cr CashBank`) with artifact provenance links.
4. **D0 Artifact Hygiene**: Store latest gate proof artifacts in `archive/proofs/` and index.
5. **Strict FPS Backlog (non-blocking)**: Run strict-only perf experiments behind explicit flags; do not change default feature-work policy.

## Key Files
- `app/renderers/filament-renderer.js` -- core geometry + canonical constraints
- `relay-cesium-world.html` -- entry, camera, demo tree, controls
- `docs/architecture/RELAY-RENDER-CONTRACT.md` -- rendering invariants
- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` -- 15 frozen contracts

## How to Run
- `npm run dev:cesium`
- Open: `http://localhost:3000/relay-cesium-world.html`

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
