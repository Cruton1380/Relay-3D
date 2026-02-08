# Module Completion Matrix

Status legend:
- PASS: gate definition + proof artifact(s) + refusal conditions present.
- DEGRADED: partial implementation with known gaps.
- INDETERMINATE: planned or documented without implementation evidence.
- REFUSAL: known physics or canon violation.
Proof Status: Evidence entries marked `MISSING:` indicate absent artifacts.

| Module | Status | Evidence | Missing | Risk |
| --- | --- | --- | --- | --- |
| Canon + Truth Model | DEGRADED | `ROOT-CONTRACT.md`, `docs/architecture/RELAY-RENDER-CONTRACT.md`, enforced in `app/renderers/filament-renderer.js` | CI lint gates + automated enforcement | Canon drift if future changes skip checks |
| Verification Physics (Pressure) | INDETERMINATE | `docs/governance/PRESSURE-MODEL.md` | Pressure state machine, deformation rendering, alerts | No resilience feedback loop |
| Cryptographic Architecture | INDETERMINATE | `docs/architecture/RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md`, `docs/architecture/RELAY-ENCRYPTION-PERMISSION-SPEC.md` | Merkle/signature/key code | Premature crypto may lock unstable semantics |
| Data Structures + Storage | DEGRADED | `core/models/relay-state.js`, commit types in `core/models/commitTypes`, spreadsheet commits in `relay-cesium-world.html` | Deterministic replay, snapshots, outbox pattern | History divergence, non-replayable sessions |
| Visualization World (3D + LOD) | DEGRADED | ENU + LOD in `app/cesium/viewer-init.js`, filaments + timeboxes in `app/renderers/filament-renderer.js` | Basin/scar/orbit lint gates, global enforcement | Visual regressions without gate coverage |
| Globe / Geospatial Layer | DEGRADED | `app/renderers/boundary-renderer.js`, viewer init in `app/cesium/viewer-init.js` | Boundary containment tests + proof artifacts | Geospatial correctness unverified |
| Company Tree / Spreadsheet Filament | DEGRADED | Filaments + timeboxes in `app/renderers/filament-renderer.js`, lens + range ops in `relay-cesium-world.html`, acceptance in `docs/ui/SPREADSHEET-LENS-ACCEPTANCE.md` | Formula dependency DAG, branch-level band alignment | Broken dependency semantics, alignment drift |
| HUD + Interaction | DEGRADED | `app/ui/hud-manager.js`, HUD controls in `relay-cesium-world.html` | Inspectors (timebox/filament/provenance), HOLD/RECONCILE flows | Limited diagnostics, manual-only verification |
| Governance + Human Workflows | INDETERMINATE | `docs/governance/*`, `docs/business/*` | Workflow code, enforcement points | Process rules remain aspirational |
| Dev Experience + Proofing | DEGRADED | Proof logs in `relay-cesium-world.html`, `docs/implementation/*`; MISSING: archive/proofs/phase0-console-2026-02-06.log, archive/proofs/phase1-import-2026-02-06.log, archive/proofs/phase2-proof-console.log, archive/proofs/phase2.1-single-branch-console.log | Forbidden language lint gate in CI, proof index completeness | Proofs become non-reproducible |
| Optional Modules | INDETERMINATE | None | All | No risk until activated |

## Patch Execution Queue (Derived)

This queue is normative: patches are executed strictly in dependency order. No later patch may be marked PASSED while any dependency remains Planned or In-Progress.

| Patch | Name | Priority | Depends On | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| PQ-1 | Proof Artifact Sweep | 1 | — | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §1 |
| PQ-2 | SheetsRendered Gate | 2 | PQ-1 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §2 |
| PQ-3 | Timebox Band Alignment | 3 | PQ-2 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §3 |
| PQ-4 | Formula Reference Extraction | 4 | PQ-3 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §4 |
| PQ-5 | Dependency Graph v1 | 5 | PQ-4 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §5 |
| PQ-6 | Deterministic Replay | 6 | PQ-4 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §6 |
| PQ-7 | Inspector v1 | 7 | PQ-6 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §7 |
| PQ-8 | Work Zone minimal panel | 8 | PQ-7 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §8 |
| PQ-9 | Forbidden Language Lint | 9 | PQ-1 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §9 |
| PQ-10 | Pressure Model v1 | 10 | PQ-8 | Planned | `docs/implementation/PATCH-QUEUE-TOP10.md` §10 |
