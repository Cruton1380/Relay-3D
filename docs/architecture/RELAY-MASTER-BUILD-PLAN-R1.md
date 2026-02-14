# Relay Restoration-First Execution Overlay (R1) — 2026-02-14

**Role: EXECUTION OVERLAY — sequencing only, not a replacement for system coverage.**  
**Canonical system coverage lives in: [RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md)**  
**This file defines current execution order (R0–R5) and immediate slice queue.**

---

## 0) Scope of This File

This file controls **what to build next and in what order**.  
It does not define modules, tiers, contracts, coverage, or system invariants — those remain in `RELAY-MASTER-BUILD-PLAN.md`.

Execution order can change.  
System coverage cannot shrink.

Frozen contracts remain unchanged:

- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md`
- `docs/architecture/RELAY-RENDER-CONTRACT.md`
- `docs/architecture/RELAY-NODE-RING-GRAMMAR.md`
- `docs/process/SLICE-WORKFLOW.md`
- `docs/process/PROOF-ARTIFACT-POLICY.md`

---

## 1) Reconciled Current Truth (2026-02-14)

- Core world boot/topology/primitives are operational.
- Process rails are active (`slice-gate`, proof indexing, checklist workflow).
- Restore/visibility slices are already proven and indexed:
  - `GLOBE-RESTORE-0..4`, `GLOBE-RESTORE-3A`
  - `USP-1`, `HUD-1`
  - `BOUNDARY-A1`, `VOTE-A2`
  - `RESTORE-PARITY`
  - `VIS-2`, `VIS-3.x`, `VIS-4x`, `VIS-6x`, `VIS-7x` families

Canonical restoration runtime path:

- `npm run dev:cesium`
- `http://localhost:3000/relay-cesium-world.html?profile=launch`

---

## 2) Restoration-First Sequence (R0-R5)

These phases run before net-new expansion and do not add physics.

### R0 — Baseline Visibility Lock

Goal: replayable 30-60 second sequence:

1. globe (multi-anchor)
2. building/site basin focus
3. enter company
4. enter sheet
5. enter edit + 2D grid
6. exit back up

Evidence:

- launch sequence proof log
- screenshots: globe, building, company, sheet, edit

### R1 — HUD Consolidation

Goal: one launch HUD.

- Tier 1 (always visible, max 6 lines): profile, mode, focus path, LOD, data status, world status
- Tier 2 (collapsed): VIS summaries, budgets, gate summaries, last proof tags

Rules:

- no duplicate launch consoles/panels
- dev panels dev-only

Evidence:

- launch readability proof includes no-duplicate-HUD assertion

### R2 — Node Ring Grammar Visibility

Goal: visible semantic rendering.

- thickness = pressure
- ripple rate = vote energy
- color = state quality

Evidence:

- proof at required LOD tiers with acceptance logs

### R3 — Basin Rings at Shared Anchors

Goal: deterministic 1:many shared-anchor rendering without spheres.

- deterministic ring placement
- visible high-N clustering
- focus isolation is lens-only (`hover/click/E/Esc`)

Evidence:

- stress proof for `N=6`, `N=30`, `N=200` with budget logs

### R4 — Presentation Pipeline Upgrade

Goal: readability improvement without topology changes.

Allowed (launch/world only): FXAA, subtle bloom, color correction, fog/haze, glass tiles, faint filament lighting.

Evidence:

- launch theme proof with post-process enable checks and no warnings

### R5 — Restoration Index / Manual

Goal: preserve and expose what is already built.

Canonical manual:

- `docs/restoration/RESTORATION-INDEX.md`

Each entry includes: purpose, trigger, proving logs, owner files.

---

## 3) Immediate Slice Queue

Process is sufficiently locked; process edits are now unblock-only.

Execute next slices in order:

1. `HUD-CONSOLIDATION-1`
2. `NODE-RING-RENDER-1`
3. `BASIN-RING-1`

Each slice ships:

- code references
- runtime screenshot/video
- proof artifact + index entry
- contract alignment

---

## 4) Module and Tier Continuity

The A-L architecture remains valid. This plan changes sequence, not model truth:

- R0-R5 overlays execution order
- tier expansion resumes after R0-R5 evidence is green
- deferred tracks stay deferred unless explicitly unlocked

---

## 5) Active vs Archived Documentation Hygiene

Active canonical docs:

- `docs/architecture/`
- `docs/restoration/`
- `docs/process/`
- `docs/00-START-HERE.md`, `HANDOFF.md`, `README.md`

Historical docs:

- `archive/superseded-docs/`
- `archive/status-reports/`
- `archive/commit-history/`

Rules:

- no planning canon in repo root
- planning docs are either active under `docs/` or historical under `archive/superseded-docs/`

---

## 6) Acceptance Gates for This Revision

This revision is complete when:

1. R0 proof + screenshot set are indexed.
2. R1 proof confirms one launch HUD surface.
3. `docs/restoration/RESTORATION-INDEX.md` is populated and maintained.
4. Start-here/handoff/readme all point to restoration-first execution.

---

## 7) Explicit Non-Goals

- no physics contract drift
- no hidden compute layers
- no sphere/container metaphors that hide information
- no pressure/agent auto-execution
- no bypass of slice/proof governance

---

## 8) Execution Hand-off

Build in this order:

1. R0 visibility lock
2. R1 HUD consolidation
3. R2/R3 semantic + shared-anchor clarity
4. R4 presentation refinement
5. R5 restoration indexing

Then continue broader tier expansion with the same proof discipline.
