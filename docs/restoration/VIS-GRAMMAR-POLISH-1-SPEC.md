# VIS-GRAMMAR-POLISH-1 — SPEC

**Status:** PROPOSE  
**Date:** 2026-02-16  
**Prerequisite:** VIS-TREE-SCAFFOLD-1 COMMIT/PASS, VIS-MEGASHEET-1 COMMIT/PASS, CAM0.4.2 COMMIT/PASS  
**Contract:** `docs/architecture/RELAY-RENDER-CONTRACT.md`; `docs/architecture/RELAY-PHYSICS-CONTRACTS.md`  
**Baseline:** Compute/protocol stacks are stable and proven. This slice tightens visual grammar only.

---

## Goal

Make the tree visually conform to canonical spacing logic in `TREE_SCAFFOLD` and make `MEGASHEET` read as a single unified plane, without touching crypto/replay/presence/lifecycle logic.

---

## Scope

### Required Changes

1. **TREE_SCAFFOLD spacing contract**
   - Branch origin anchored at trunk top.
   - Branch angular spacing deterministic by department index: `angle = 2π * deptIndex / deptCount`.
   - Branch radius bands fixed from trunk axis (no drift).
   - Sheet attachment at branch endpoints, oriented by branch tangent.
   - Overlap resolver in scaffold mode: enforce `minSheetGapM` using AABB checks and rail-axis shifts until clear.
   - Rings/glyphs render in height bands only; never on ground/map plane in scaffold mode.

2. **MEGASHEET one-plane lens contract**
   - Render a single visible megasheet plane at COMPANY-band altitude (subtle border).
   - Tiles are cell-blocks on this plane (not standalone floating sheets).
   - Keep bounded-radius + min-gap behavior; add consistent tile edge style and opacity rules.
   - Preserve transition continuity: tile click enters sheet; exit returns to same megasheet pose.

3. **Visual differentiation contract**
   - Stub tile (company overview): tiny, dim, no grid (`16x16m`).
   - Expanded sheet: full grid + headers.
   - Megasheet tile: block-in-plane visual language (not independent sheet language).

### Explicit Non-Goals

- No changes to `LAUNCH_CANOPY` behavior.
- No changes to lifecycle, disclosure, voting, presence, replay, or crypto stacks.
- No changes to core topology rules (cell -> lane -> spine -> branch).

---

## Allowed Files

- `app/renderers/filament-renderer.js`
- `relay-cesium-world.html` (mode toggles / pose continuity only if needed)
- `app/ui/hud-manager.js` (status line only)
- `scripts/vis-grammar-polish-1-proof.mjs`
- `docs/restoration/VIS-GRAMMAR-POLISH-1-SPEC.md`
- `archive/proofs/vis-grammar-polish-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/process/ACTIVE-SLICE.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

### Forbidden

- No edits under `core/models/crypto/*`
- No replay/crypto/presence module changes
- No new feature rails (SFU/screenshare/transcripts/ERP posting)
- No geometry contract mutations outside visual placement/readability rules above

---

## Required Logs

```text
[VIS-GRAMMAR] scaffold spacing depts=<n> minGapM=<n> overlapsResolved=<n>
[VIS-GRAMMAR] sheetAttach endpoint=PASS count=<n>
[VIS-GRAMMAR] megasheetPlane enabled=PASS altitude=<m>
[VIS-GRAMMAR-PROOF] gate-summary result=PASS stages=6/6
```

---

## Proof Script

**File:** `scripts/vis-grammar-polish-1-proof.mjs`

### Stages (6)

1. **Scaffold top view** — branches evenly spaced; sheets attached at endpoints; no scattered drift.
2. **Scaffold side view** — branches above trunk-top band; no ground-plane rings/glyphs.
3. **Megasheet plane** — one visible plane; tiles sit on that plane.
4. **Continuity** — megasheet -> sheet -> back; megasheet pose preserved.
5. **Overlap solver** — log confirms spacing solver executed with resolved overlap count.
6. **Regressions** — PASS: VIS2, Scaffold, MegaSheet, CAM0.4.2, presence, headless, replay, crypto.

---

## Completion Checklist

- [ ] `VIS-GRAMMAR-POLISH-1` spec in place
- [ ] ACTIVE-SLICE set to `VIS-GRAMMAR-POLISH-1` with allowed-files list
- [ ] Proof script implemented and PASS (6/6)
- [ ] Proof log and screenshots stored under `archive/proofs/vis-grammar-polish-1-*`
- [ ] `archive/proofs/PROOF-INDEX.md` updated
- [ ] `docs/process/SLICE-REGISTER.md` row updated to COMMIT/PASS
- [ ] `docs/restoration/RESTORATION-INDEX.md` marked implemented
- [ ] `HANDOFF.md` updated with final result and next step

---

## What to Do First

1. Immediate visual check: press `T` for `TREE_SCAFFOLD`, press `M` for `MEGASHEET`.
2. If scaffold still appears scattered, implement overlap/spacing resolver in this slice.
3. Keep all changes within allowed files and produce proof artifacts only after stage gates pass.
