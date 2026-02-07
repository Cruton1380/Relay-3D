# Relay Project Handoff (Share Link Ready)

This handoff is for any agent joining via the GitHub link. It explains current state, cleanup priorities, and the path to final product.

## Current State (as of this handoff)
- Cesium-based 3D world renders trunk/branch/sheets/cells.
- Timebox lanes are rendered with a canonical “parallel slab” section.
- Stage model exists: cell → lane target/spine → branch → trunk.
- Camera persistence is implemented via localStorage.

Primary code touched:
- `app/renderers/filament-renderer.js`
- `relay-cesium-world.html`

## Canonical Constraints (must not regress)
1) **Opposite-side exit**  
   All cell lanes must begin along sheet normal pointing *opposite* the branch.

2) **Parallel slab for timeboxes**  
   Timeboxes must be stacked along a sheet-wide `timeDir`, identical for all cells.

3) **Bend only after slab**  
   Lanes may curve toward laneTarget/spine *after* the slab ends.

4) **Stage 2 single conduit**  
   Stage 2 must be a single spineCenter → branchEnd conduit per sheet.

## Known Issues / Visual Gaps
- Verify that Stage 1 uses the slab path for the visible filament (not only for cubes).
- Verify no residual “fan” convergence near the cell ends.
- Confirm branch connection visually reads as: branch → connector → cell filaments → cells.

## Cleanup Priorities (before final product)
1) **Repository hygiene**
   - There are many deleted docs/assets in git status. Decide whether to restore or formally remove.
   - Keep commits scoped to code changes unless doc cleanup is explicitly intended.

2) **Render consistency**
   - Ensure staged filaments and timebox lanes use the same canonical path grammar.
   - Add proof logs and lint gates (P3-A) for slab parallelism and single Stage 2 conduit.

3) **Camera + UX**
   - Confirm camera persistence survives refresh and does not get overridden by proof-mode camera locks.

4) **Docs alignment**
   - Update `PHASE-3-TIMEBOX-LANES-COMPLETE.md` to reflect final canonical rules.

## Final Product Path (short)
1) Lock canonical geometry rules (Phase 3).
2) Stabilize LOD and performance.
3) Integrate spreadsheet import and ensure deterministic rendering.
4) Ship hosted demo + reproducible proof snapshots.

## Canon Verification Pack
- `CANON-VERIFICATION.md` — paste-ready protocol + Phase 3 gate block + graphics/Excel directive

## How to run
- `npm run dev:cesium`
- Open: `http://localhost:8000/relay-cesium-world.html`

## Contact / Notes
- Primary UX goal: clear, legible, canonical geometry (no fan hubs, no hidden planes).
- If something looks off, check against constraints above before adjusting visuals.

