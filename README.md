# Relay: Backwards-Compatible Coordination OS

**Version**: 2.1 (Restoration-First Canon)
**Updated**: 2026-02-14

Relay is a backwards-compatible coordination OS for all 2D systems. Immutable facts flow through config-driven routes into visible sheets, reconcile through deterministic matchers, aggregate through inspectable formulas, and drive measurable tree motion through bound timebox metrics. 3D is a lens over the same append-only state -- not a requirement. Every capability has a 2D equivalent, a headless mode, and a stable canonical ID.

---

## Current System State

### Completed and Proven (with gate artifacts)

- **Phases 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated, auto-transition, primitives migration
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament geometry, spine aggregation bands
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder, QTY_EXCEPTION proof), summary sheets (cross-sheet formulas, AP_Aging/MatchRate/Spend), KPI branch mapping (config-driven, recomputation chain, 3D visual response)
- **C0**: Route engine -- config-driven data flow, provenance, mock streams, dry-run preview
- **D-Lens-0**: Focus frame -- camera + dimming + breadcrumb + entity tracking + exit
- **UX-1.1**: Universal Object Contract (`toRelayObject()` adapter)
- **UX-1.2**: Capability Buds (Space key context actions)
- **UX-1.3**: Inspector Context Switching

### D0 Scale and Stress (Partially Passing)

- D0.1 Ingestion: **PASS** (10k rows, 442ms, 14.9MB)
- D0.2 Recompute (data): **PASS in latest observed run** (~1085ms, limit 2,000ms)
- D0.3 Redraw: **PASS** (relayEntities=24, relayPrimitives=15)
- D0.4 Viewport: **PASS** (0 DOM explosion)
- D0.5 Date Funcs: **PASS** (all 8 functions + aging buckets)

> Re-run `await relayD0Gate(10000)` to produce fresh proof artifacts for current HEAD.

### The Only Allowed Data Path

```
External Event -> Route (normalize + append) -> Fact Sheet (append-only)
  -> Match Sheet (deterministic rebuild) -> Summary Sheet (formula recalc)
  -> KPI Binding (cell -> metric) -> Branch Timebox (metric -> geometry)
  -> Tree Motion (visible, auditable)
```

---

## Master Build Plan

The definitive end-to-end build plan is:

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** (full system coverage)
**[docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md](docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md)** (execution overlay)

Restoration execution docs:

- `docs/restoration/RELAY-RESTORATION-PLAN.md`
- `docs/restoration/RESTORATION-INDEX.md`

It covers:
- 12 system modules (A-L): Canon, Verification Physics, Crypto, Data Structures, Visualization, Globe, Company Tree, HUD, Governance, Code IDE, Optional, Presence/Agents
- 5 implementation tiers from ERP-ready core through advanced visualization physics
- 15 frozen contracts that govern all phases
- Full LOD scale ladder (LANIAKEA through CELL)
- 2D backward compatibility contract with headless golden outputs
- Stable ID construction law for all object types
- current coverage matrix mapping every critical aspect to its spec, phase, and gate

---

## 15 Frozen Contracts

1. Fact sheets are append-only
2. Match sheets are derived, visible, rebuildable
3. Summary sheets are formula-only
4. KPI bindings read cells, not code
5. Tree motion only comes from timebox metrics
6. Routes only append rows, never compute
7. No menus (Capability Buds only)
8. One interaction grammar (Universal Object Contract)
9. No hidden formulas (dependency inspector for every KPI cell)
10. LOD responds to measured pain only
11. Undo after canon is always a revert (visible scar, not erasure)
12. Refusal is explicit (no silent fallback)
13. Learning produces recommendations, not policy mutations
14. Pressure is not authority (influences perception, never auto-executes)
15. Minimum required data, shortest retention, strictest scope

Source: [docs/architecture/RELAY-PHYSICS-CONTRACTS.md](docs/architecture/RELAY-PHYSICS-CONTRACTS.md)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev:cesium

# Open canonical restoration path
# http://localhost:3000/relay-cesium-world.html?profile=launch
```

Review policy: `docs/process/ARCHITECT-REVIEW-CHECKLIST.md`
Slice workflow: `docs/process/SLICE-WORKFLOW.md`

### What You Will See

1. Demo tree at Tel Aviv (Avgol company with branches, sheets, cells)
2. Map imagery (OpenStreetMap tiles)
3. Spreadsheet lens (2D inspector docked to 3D geometry)
4. HUD with LOD level, entity counts, and controls

### Run the D0 Gate

Open the browser console and run:

```javascript
await relayD0Gate(10000)
```

This ingests 10k rows, measures recomputation latency, checks entity counts, measures FPS, and verifies date functions. Reports PASS/REFUSAL for each sub-gate.

---

## Project Structure

```
relay-cesium-world.html    Single production entrypoint

app/                       Cesium-specific rendering
  cesium/                  Viewer initialization
  renderers/               Filament, boundary, tree renderers
  ui/                      HUD, info panels
  excel-importer.js        Excel parsing

core/                      Renderer-agnostic logic (NO Cesium imports)
  models/                  State models, commit types
  services/                LOD Governor, boundaries

config/                    Module and route definitions
  modules/                 p2p-module.json (fact/match/summary/KPI schemas)
  routes/                  p2p-routes.json (field mappings, normalization)
  forbidden-language.json  Lint config for safe terminology

docs/                      Canonical documentation
  architecture/            Master plan, physics contracts, render contract, specs
  governance/              Pressure model, cadence, stage gates, work zones, forbidden language
  business/                Operating model, executive summary
  implementation/          Phase records, testing guide
  tutorials/               Quick start, dev setup

archive/                   Historical progress (read-only)
  proofs/                  Gate proof artifacts (PROOF-INDEX.md)
  superseded-docs/         Archived plans superseded by master plan

scripts/                   Build tools, dev server, lint
tests/                     Test suites
```

---

## Documentation

**Start here**: [docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md) (canonical full system spec)
**Execution order**: [docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md](docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md) (R0-R5 restoration-first overlay)

**Architecture**:
- [RELAY-PHYSICS-CONTRACTS.md](docs/architecture/RELAY-PHYSICS-CONTRACTS.md) -- 15 frozen contracts
- [RELAY-RENDER-CONTRACT.md](docs/architecture/RELAY-RENDER-CONTRACT.md) -- Sheet/filament rendering invariants
- [RELAY-CESIUM-ARCHITECTURE.md](docs/architecture/RELAY-CESIUM-ARCHITECTURE.md) -- Cesium 3D implementation
- [RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md](docs/architecture/RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md) -- Crypto + geometric spec
- [STIGMERGIC-COORDINATION.md](docs/architecture/STIGMERGIC-COORDINATION.md) -- Coordination model

**Governance**:
- [FORBIDDEN-LANGUAGE.md](docs/governance/FORBIDDEN-LANGUAGE.md) -- Safe terminology (enforced in CI)
- [PRESSURE-MODEL.md](docs/governance/PRESSURE-MODEL.md) -- How urgency accumulates
- [GOVERNANCE-CADENCE.md](docs/governance/GOVERNANCE-CADENCE.md) -- Decision rhythm
- [STAGE-GATES.md](docs/governance/STAGE-GATES.md) -- Gate types and enforcement

**Proofs**: [archive/proofs/PROOF-INDEX.md](archive/proofs/PROOF-INDEX.md) -- All gate proof artifacts

---

## Technology Stack

- **Cesium.js** -- 3D globe rendering (terrain, imagery, ENU coordinates)
- **XLSX.js** -- Excel file parsing
- **ES6 Modules** -- Modular architecture
- **Node.js** -- Development server
- **Vitest** -- Testing framework

---

## Contributing

1. Read [RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md) -- System spec (full coverage)
2. Read [ROOT-CONTRACT.md](ROOT-CONTRACT.md) -- Workspace rules
3. Run `npm run dev:cesium` and verify the demo tree renders
4. Run `await relayD0Gate(10000)` in console before committing

---

*Relay: continuous verification that makes everyone a coherence operator.*
