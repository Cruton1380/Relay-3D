# Relay Restoration Plan (Execution Checklist) — 2026-02-14

This document operationalizes the restoration-first execution sequence. Both execution order and full system coverage live in `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (Section 8 for execution order, Section 1.5 for R0-R5 details).

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

### Completed (R0-R5 Restoration)

1. ~~`HUD-CONSOLIDATION-1`~~ — PASS
2. ~~`NODE-RING-RENDER-1`~~ — PASS
3. ~~`BASIN-RING-1`~~ — PASS

### Post-R5: Visual Grammar (Complete)

4. ~~`VIS-TREE-SCAFFOLD-1`~~ — PASS (c7db24b)
5. ~~`HEIGHT-BAND-1`~~ — PASS (7cbfcab)
6. ~~`VIS-MEGASHEET-1`~~ — PASS (bf050c7)

### Post-R5: Temporal Navigation (Architect Decision 2026-02-15)

7. `CAM0.4.2-FILAMENT-RIDE-V1` — epistemic temporal navigation integrating lifecycle, disclosure, attention/confidence, height bands into ride ← ACTIVE

### Post Temporal Navigation: Video Presence (Module L.5)

8. `PRESENCE-STREAM-1` — WebRTC signaling via VIS-6c, ephemeral peer connections, room per effectiveScope
9. `PRESENCE-RENDER-1` — Video textures on presence cards, LOD dot/card/stage, UOC integration
10. `PRESENCE-COMMIT-BOUNDARY-1` — Optional canonical call summary via W0-W2 material artifacts

Each slice ships with:

- code references
- runtime screenshot/video
- proof log artifact
- contract alignment

