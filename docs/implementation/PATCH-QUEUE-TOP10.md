# Patch Queue (Top 10, Dependency-Ordered)

This queue is derived directly from the Module Completion Matrix and follows the sequencing:
close contradictions -> strengthen proofs -> add next semantic layer -> verification physics -> enforcement tooling.

## 1) Proof Artifact Completion Sweep
- Priority: 1
- Depends on: None
- Status: Planned
- Why: Matrix credibility + future automation
- Acceptance logs:
  - PROOF-INDEX has no dangling references (or each tagged `MISSING:`)
- Files touched (expected):
  - `archive/proofs/PROOF-INDEX.md`
  - `docs/implementation/MODULE-COMPLETION-MATRIX.md` (evidence tags)

## 2) SheetsRendered vs Expected (Import Proof Gate)
- Priority: 2
- Depends on: 1
- Status: Planned
- Why: Prevents silent partial imports
- Acceptance logs:
  - `[S1] SheetsRendered=… Expected=…`
- Files touched (expected):
  - `relay-cesium-world.html`
  - `app/excel-importer.js`
  - `app/ui/hud-manager.js`

## 3) Branch Timebox Band Alignment (Macro ↔ Micro coherence)
- Priority: 3
- Depends on: 2
- Status: Planned
- Why: Timeboxes are “material slices”; macro alignment still weak
- Acceptance logs:
  - `[T] bandAlign ok=… maxDeltaM=…`
- Files touched (expected):
  - `app/renderers/filament-renderer.js`
  - `docs/implementation/PHASE-3-TIMEBOX-LANES-COMPLETE.md`

## 4) Formula Reference Extraction (No Recalc Yet)
- Priority: 4
- Depends on: 3
- Status: Planned
- Why: Unlocks DAG without engine complexity
- Acceptance logs:
  - `[F] refsExtracted cell=… refs=… ranges=…`
- Files touched (expected):
  - `relay-cesium-world.html`
  - `core/models/commitTypes/workZoneCommits.js`
  - `docs/ui/SPREADSHEET-LENS-ACCEPTANCE.md`

## 5) Dependency Graph v1 (DAG + cycle detection)
- Priority: 5
- Depends on: 4
- Status: Planned
- Why: `formulaEdgesRendered=0` becomes meaningful
- Acceptance logs:
  - `[F] dag nodes=… edges=… cycles=…`
- Files touched (expected):
  - `app/renderers/relationship-renderer.js`
  - `app/renderers/filament-renderer.js`
  - `relay-cesium-world.html`

## 6) Deterministic Replay (Snapshot/replay proof)
- Priority: 6
- Depends on: 4
- Status: Planned
- Why: Commits must reconstruct sheet exactly
- Acceptance logs:
  - `[R] replayHash=… matchesLive=true`
- Files touched (expected):
  - `core/models/relay-state.js`
  - `core/models/commitTypes/workZoneCommits.js`
  - `relay-cesium-world.html`

## 7) Inspector v1 (Timebox/Cell/Filament provenance panel)
- Priority: 7
- Depends on: 6
- Status: Planned
- Why: Audit-grade provenance for usable spreadsheet
- Acceptance logs:
  - `[I] inspect cell=… commits=… lastCommitId=…`
- Files touched (expected):
  - `app/ui/hud-manager.js`
  - `relay-cesium-world.html`
  - `core/models/commitTypes/workZoneCommits.js`

## 8) Work Zone minimal panel (DRAFT/HOLD/PROPOSE/COMMIT)
- Priority: 8
- Depends on: 7
- Status: Planned
- Why: Surface workflow boundary
- Acceptance logs:
  - `[Z] mode=PROPOSE`
- Files touched (expected):
  - `core/models/commitTypes/workZoneCommits.js`
  - `relay-cesium-world.html`
  - `app/ui/hud-manager.js`

## 9) Forbidden Language Lint (repo-level guard)
- Priority: 9
- Depends on: 1
- Status: Planned
- Why: Prevents regression against safe language requirement
- Acceptance logs:
  - `npm run relay-lint:defense` fails on violations
- Files touched (expected):
  - `scripts/forbidden-language-lint.mjs`
  - `package.json`
  - `.github/workflows/*` (optional)

## 10) Pressure Model v1 (Read-only state + HUD display)
- Priority: 10
- Depends on: 8
- Status: Planned
- Why: Verification physics begins after semantics + workflow exist
- Acceptance logs:
  - `[P] state=… pressure=… reason=…`
- Files touched (expected):
  - `core/models/commitTypes/workZoneCommits.js`
  - `app/ui/hud-manager.js`
  - `relay-cesium-world.html`
