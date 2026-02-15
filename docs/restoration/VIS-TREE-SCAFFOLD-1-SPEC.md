# VIS-TREE-SCAFFOLD-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** ATTENTION-CONFIDENCE-1 PASS, SCOPE-COHERENCE-1 PASS
**Contract:** docs/architecture/RELAY-RENDER-CONTRACT.md; docs/architecture/RELAY-PHYSICS-CONTRACTS.md

---

## Goal

Add a canonical TREE_SCAFFOLD render mode that shows branches growing upward from trunk top, with sheets attached at branch endpoints, matching the reference tree structure. Additive only — LAUNCH_CANOPY must remain unchanged. Toggle via T key or Tier 2 button.

---

## Scope

### Allowed Files

- `app/renderers/filament-renderer.js` (renderMode logic, scaffold geometry)
- `relay-cesium-world.html` (T key toggle, mode state, HUD wiring)
- `app/ui/hud-manager.js` (Tier 2 mode readout)
- `scripts/vis-tree-scaffold-proof.mjs` (new)
- `docs/restoration/VIS-TREE-SCAFFOLD-1-SPEC.md`
- `archive/proofs/*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`, `docs/process/SLICE-REGISTER.md`
- `HANDOFF.md`

### Forbidden

- No changes to LAUNCH_CANOPY placement or rendering
- No changes to filament lifecycle/disclosure state machines
- No changes to FreeFly contract
- No changes to attention/confidence computation

---

## Definitions

### renderMode

A global state variable: `window._relayRenderMode`

Values:
- `LAUNCH_CANOPY` (default — existing behavior, unchanged)
- `TREE_SCAFFOLD` (new — canonical tree)

### TREE_SCAFFOLD Geometry

In this mode only:
- **Trunk**: stays as existing vertical pillar (unchanged)
- **Branches**: originate at trunk worldTop, spread outward in radial pattern at elevation ~2000m
- **Sheets**: attach at branch endpoints, enforce canonical normal = -T (anti-parallel to branch tangent)
- **Rings/glyphs**: placed at trunk/branch altitude bands (same ring grammar, different altitude)
- **Timeboxes**: remain per `_vis4SlabRegistry` but aligned to scaffold placement
- **Tile differentiation**: COMPANY tiles become stubs (16x16m, no grid, low alpha, hover label only)

---

## Required Logs

```
[MODE] renderMode=TREE_SCAFFOLD
[VIS-SCAFFOLD] mode=TREE_SCAFFOLD result=PASS
[VIS-SCAFFOLD] placement trunkTopU=<m> branchOriginU=<m> sheetAttachU=<m>
[VIS-SCAFFOLD] sheetsAttachedToBranches count=<n>
[VIS-SCAFFOLD] ringBand ok=PASS altitude=<m> scope=<company|branch>
[VIS-SCAFFOLD-PROOF] gate-summary result=PASS
```

---

## Proof Script

`scripts/vis-tree-scaffold-proof.mjs`

### Stages

1. **Boot in LAUNCH_CANOPY** — confirm default mode
2. **Toggle to TREE_SCAFFOLD** — press T, verify mode log
3. **Branch placement** — verify branches originate at trunk top altitude
4. **Sheet attachment** — verify sheets at branch endpoints with correct normals
5. **Ring placement** — verify rings at altitude bands
6. **Toggle back** — press T, verify return to LAUNCH_CANOPY, no visual regressions
7. **Gate** — `[VIS-SCAFFOLD-PROOF] gate-summary result=PASS stages=7/7`

---

## Acceptance Criteria

PASS only if:
- Toggle works both directions
- LAUNCH_CANOPY proofs and visuals remain unchanged
- Scaffold geometry follows spec
- No regressions in existing proofs
