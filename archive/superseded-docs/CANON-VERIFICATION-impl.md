# Canon Verification + Phase 3 Gates

This file is the Canon-grade verification protocol and Phase 3 gate block to prevent divergence. Paste-ready sections are included verbatim.

---

## 1) Prompt to Canon (repo review + finish Phase 3 without divergence)

Copy/paste:

CANON — RELAY-3D REPO VERIFICATION (NO PUSH, NO PAPER PASS)

Repo: https://github.com/Cruton1380/Relay-3D

Hard constraints

No remote changes unless explicitly told “push now.”

Do not claim COMPLETE without: (1) gate definition, (2) proof artifacts, (3) refusal conditions.

Use “divergence” language (avoid “drift”).

Objective

Verify implementation against the canonical constraints below, one-by-one, with code evidence and runtime proof.

Canonical constraints to verify (must not regress)

Opposite-side exit
Stage-1 lanes must begin along sheet normal pointing opposite the branch.
Refusal if initial tangent at cell points toward branch tangent.

Parallel slab for timeboxes
Timecubes must be stacked along a sheet-wide timeDir identical for all cells.
Refusal if slab segment directions differ by >2° between cells.

Bend only after slab
No lane may bend toward laneTarget/spine until slab end.
Refusal if any lane has curvature before slabEnd.

Stage 2 single conduit
Stage-2 must be exactly one conduit: spineCenter → branchEnd per sheet.
Refusal if more than 1 Stage-2 conduit exists for a sheet.

Files to inspect first

app/renderers/filament-renderer.js

relay-cesium-world.html

app/utils/enu-coordinates.js

core/services/lod-governor.js

Required output format
Layer 0 — Results (short)

PASS/INDETERMINATE/REFUSAL for each constraint (1–4)

If not PASS: exact reason code and the next minimal patch

Layer 1 — Evidence (required)

For each constraint:

Show the exact code lines that enforce it

Add one runtime proof log line emitted by the renderer:

[P3-A] exitDotToBranch=...

[P3-A] slabAngleDeltaMax=...

[P3-A] stage2ConduitsPerSheet=...

Provide proof artifacts:

Screenshot “LookDownBranch” (3)

Screenshot “SideProfile” (2)

Console excerpt showing the three [P3-A] lines

Stop condition

If any constraint is REFUSAL, stop and do not proceed to Phase 4.

Begin now.

---

## 2) Phase 3 Gate block (P3-A)

Paste into PHASE-3-TIMEBOX-LANES-COMPLETE.md (or a new PHASE-3-GATE-P3A.md):

Gate P3-A — Timebox Lane Grammar (PASS/REFUSAL)

PASS requires all:

Opposite-side exit

For first segment p0→p1 at every cell:
dot(normalize(p1−p0), branchTangent) <= 0

Parallel slab

Slab direction for any two cells differs by ≤ 2°

Timecubes lie on slab direction only

Bend only after slab

Any curvature or target steering occurs only after slabEnd

Stage-2 single conduit

Per sheet: stage2Conduits == 1

Conduit path is spineCenter → branchEnd

REFUSAL if any fail, with one of:

REFUSAL.P3A_EXIT_TOWARD_BRANCH

REFUSAL.P3A_SLAB_NOT_PARALLEL

REFUSAL.P3A_BEND_BEFORE_SLAB_END

REFUSAL.P3A_STAGE2_MULTIPLE_CONDUITS

Proof artifacts required for PASS:

Screenshot: LookDownBranch (3)

Screenshot: SideProfile (2)

Console log containing:

[P3-A] exitDotToBranch=...

[P3-A] slabAngleDeltaMaxDeg=...

[P3-A] stage2ConduitsPerSheet=...

---

## 3) Message to Canon: Improve graphics + finalize full Excel mapping

Context lock (repo reality)

Entry point is relay-cesium-world.html at repo root.

Cesium-specific code is in app/ (renderers + excel-importer) and renderer-agnostic logic is in core/ (models/services/utils).

Dev flow is npm run dev:cesium → http://localhost:8000.

A) Graphics: make Cesium look like the prior “living” tree (no debug scaffolding)

Goal: trunk/branches/spines must read as body, not thin lines.

Primary limbs must be volumetric

Replace thin polylines for trunk/branches/spine-conduit with CorridorGeometry or PolylineVolumeGeometry.

Keep polylines only for debug overlays / guides.

Curvature + taper

Branch centerlines must be curved (sample 50–100 points).

Taper thickness in 3 segments (thick→mid→thin) so it reads organic.

Gate: “no perfectly straight limb” at COMPANY/SHEET LOD.

Sheets must be readable pages

Two-layer sheet: translucent fill + brighter frame outline.

Ensure the sheet polygon is not clamped like terrain (if using polygons, enforce perPositionHeight).

Camera presets are part of graphics

Maintain presets 1/2/3 and add one “Inspect Cell Lane” preset when a cell is clicked.

Don’t let LOD thrash during verification: keep the LOD lock.

B) Spreadsheet: ingest full Excel including formulas + conditional formatting

Goal: entire .xlsx becomes a deterministic SheetGraph, then render it with filaments + lenses.

1) Build a canonical, renderer-agnostic SheetGraph

Create/extend in core/models/:

SheetGraph {
  workbookId
  sheets: SheetNode[]
}
SheetNode {
  sheetId, name,
  dims: {rows, cols}
  cells: Map<CellId, CellRecord>
  formulas: Map<CellId, FormulaAst|FormulaText>
  deps: { edges: Array<{from: CellId, to: CellId}> } // DAG
  conditionalFormatting: CFRule[]
}
CellRecord {
  id, refA1, type, value, displayValue,
  style: CellStyle,            // fills/fonts/borders
  cfApplied: CellStylePatch[], // projection results
}

Lock: CellId is always canonical (like sheet.packaging.cell.0.0) and A1 is only a display alias.

2) Parse formulas → build dependency DAG (deterministic)

In app/excel-importer.js (or a helper module under core/ if possible):

Extract formula text from each cell (cell.f in XLSX)

Parse references:

A1 refs: A1, B2:C9

Cross-sheet refs: Sheet2!A1

External refs: mark as DEGRADED (do not invent)

Build edges:

refCell → formulaCell

Run:

topo sort → recompute order

cycle detection → REFUSAL.CYCLE_DETECTED (and render scar)

3) Conditional formatting (CF) is projection, not truth

Extract CF rules (XLSX stores these in sheet-level structures). Model them as:

CFRule { range, type, priority, stopIfTrue, formula?, params }

Apply CF as a projection pass:

output cfApplied style patches

track confidence:

if CF references external or missing values → INDETERMINATE

Render rule: CF only changes lens appearance (cell color/outline/icon), never identity.

4) Render modes (lenses), not one overloaded view

Add toggles in HUD:

Value lens (cells colored by type/value)

Formula lens (show dependency filaments)

CF lens (show conditional formatting overlays)

History lens (timebox lanes/cubes)

Each lens must be switchable without rebuilding the world graph.

C) Gates: don’t let this drift into “paper pass”

Use the repo’s existing gate culture (gates/tests/proofs are already part of the workflow).

Add two new gates:

Gate F1 — Formula graph correctness

PASS: topo sort succeeds, dependency counts logged, cycles produce REFUSAL object

Proof: console excerpt + screenshot with formula lens showing dependencies

Gate CF1 — Conditional formatting projection

PASS: CF rules extracted, applied patches visible, indeterminate cases labeled

Proof: screenshot of CF lens + console summary of CF rule count/types

Quick note about branches

Your repo has two branches (Canon and master). The master branch clearly contains the full implementation folders and the Cesium entrypoint.

Canon should keep fixes scoped and only claim PASS when proof artifacts exist.

