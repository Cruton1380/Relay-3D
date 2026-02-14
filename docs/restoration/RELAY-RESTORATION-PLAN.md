# Relay Restoration Plan (Execution Checklist) — 2026-02-14

This document operationalizes the restoration-first execution sequence. Execution order is defined in `docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md`; full system coverage lives in `docs/architecture/RELAY-MASTER-BUILD-PLAN.md`.

Scope: visibility, readability, and refinement of already-built capabilities.  
Constraint: no new physics, no contract drift.

---

## Phase R0 — Baseline Visibility Lock

Goal: anyone can boot and replay the core sequence clearly.

Runtime path:

- `http://localhost:3000/relay-cesium-world.html?profile=launch`

Demo sequence (30-60s):

1. globe with multiple anchors
2. focus building/site basin
3. enter company
4. enter sheet
5. enter edit + 2D grid
6. exit back up

Evidence:

- log proving launch sequence enter/exit works
- screenshots: globe, building, company, sheet, edit

---

## Phase R1 — HUD Consolidation

Goal: one launch HUD that explains state.

Tier 1 (always visible, 6 lines max):

- profile
- mode (`FreeFly/Company/Sheet/Edit`)
- focus path
- LOD
- data status (import + selected sheet)
- world status (imagery + boundaries + buildings)

Tier 2 (collapsed diagnostics):

- VIS summaries
- budgets
- gate summaries
- last proof tags

Rules:

- no launch duplicate log console
- no overlapping info panels
- dev panels only in dev mode

Evidence:

- launch readability proof extended with no-duplicate-HUD assertion

---

## Phase R2 — Node Ring Grammar Rendering

Goal: make semantic contract visible in graphics.

Render mapping:

- ring thickness = pressure
- ripple rate = vote energy
- color = state quality

LOD requirements:

- planetary/regional: regional summaries + basin rings
- building/company/sheet: node-level ring grammar continuity

Evidence:

- node ring proof at required LOD tiers with acceptance logs

---

## Phase R3 — Basin Rings at Shared Anchors

Goal: solve multi-company shared-anchor rendering without spheres.

Rules:

- shared anchor is basin center
- deterministic ring placement
- high cardinality uses visible cluster nodes
- isolation is lens-only:
  - hover -> soft dim others
  - click/E -> hard isolate
  - Esc -> restore

Evidence:

- stress proof for `N=6`, `N=30`, `N=200` with budgets

---

## Phase R4 — Presentation Pipeline Upgrade

Goal: improve visual readability with no topology change.

Allowed (launch/world only):

- FXAA
- subtle bloom
- color correction
- fog/haze
- glass tile styling
- faint filament light threads

Evidence:

- launch-theme proof with enabled-stage checks and no warnings

---

## Phase R5 — Restoration Index

Goal: keep a reliable operating manual for what exists.

Canonical index:

- `docs/restoration/RESTORATION-INDEX.md`

Each entry must include:

- capability description
- trigger path (keys/UI/API)
- proving logs
- owner files

---

## Immediate Slice Order

1. `HUD-CONSOLIDATION-1`
2. `NODE-RING-RENDER-1`
3. `BASIN-RING-1`

Each slice ships with:

- code references
- runtime screenshot/video
- proof log artifact
- contract alignment

