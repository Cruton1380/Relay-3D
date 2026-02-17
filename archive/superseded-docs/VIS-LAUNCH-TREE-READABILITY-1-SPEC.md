# VIS-LAUNCH-TREE-READABILITY-1 Spec

## Slice ID
`VIS-LAUNCH-TREE-READABILITY-1`

## Goal
Make `LAUNCH_CANOPY` read like a tree in first glance (trunk -> limbs -> leaves) without changing topology, physics, or canonical scaffold/megasheet contracts.

## Non-Negotiable Constraints
- No changes to `TREE_SCAFFOLD` placement/attachment logic.
- No changes to `MEGASHEET` layout/transition logic.
- No changes to `FILAMENT-LIFELINE-1` visibility/geometry.
- No changes to crypto/replay/presence logic.
- No topology or metric changes.
- Presentation-only tuning in launch/company collapsed lens.

## Allowed Files
- `app/renderers/filament-renderer.js`
- `relay-cesium-world.html` (launch profile behavior/log hygiene only)
- `scripts/vis-launch-tree-readability-1-proof.mjs` (new)
- `archive/proofs/vis-launch-tree-readability-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

## Required Changes
1. Trunk dominance up in launch/company overview.
2. Branch silhouette simplification in launch/company collapsed.
3. Company-collapsed tile de-emphasis (no interior grid; lower alpha; smaller footprint).
4. Ring containment (no noisy non-focused ring presentation in collapsed launch overview).
5. Filament rain de-noise (lower density/noise by default).
6. Perception log cleanup: replace repeated refusal-vibe spam with a status-oriented, rate-limited launch log.

## Required Logs
- `[LAUNCH-FIX] visualHierarchy applied=PASS ...`
- `[VIS-LAUNCH] ringContainment mode=collapsed action=suppressNonFocused result=PASS`
- `[DOCK] assistBlocked policy=launch ... status="Dock assist blocked by launch policy"`
- `[VIS-LAUNCH-PROOF] gate-summary result=PASS stages=3/3`

## Proof Contract
Script: `scripts/vis-launch-tree-readability-1-proof.mjs`

Stages:
1. Launch/company capture (before reference frame).
2. Launch/company readability capture (after tuning) + log checks.
3. Toggle `T` to scaffold and capture unchanged scaffold behavior.

Artifacts:
- `archive/proofs/vis-launch-tree-readability-1-console-YYYY-MM-DD.log`
- `archive/proofs/vis-launch-tree-readability-1-YYYY-MM-DD/01-launch-company-before.png`
- `archive/proofs/vis-launch-tree-readability-1-YYYY-MM-DD/02-launch-company-after.png`
- `archive/proofs/vis-launch-tree-readability-1-YYYY-MM-DD/03-scaffold-unchanged.png`

## Acceptance
PASS iff:
- Launch/company first-glance dominance is trunk-first and tile/rain noise is reduced.
- Company-collapsed tiles no longer present spreadsheet interior grid.
- Scaffold toggle still works and remains unchanged in behavior.
- Proof stages pass with artifacts committed and indexed.
