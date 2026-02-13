# RESTORE-GAP-MATRIX

## Purpose
This matrix prevents blind legacy reactivation by mapping v93-era capabilities to canon-compatible restore actions:
- `KEEP`: can remain with minimal adaptation
- `ADAPT`: reusable but requires canon wiring
- `REWRITE`: legacy semantics conflict with canon and must be rebuilt

All restored capabilities must satisfy:
- proof-first discipline
- profile isolation (`proof` vs `world`)
- deterministic replay compatibility
- explicit refusal semantics
- scope enforcement
- stage gates
- no silent state mutation

## Canon Anchors
- Governance primitives: `core/models/governance/vote-canon-spec.js`, `core/models/governance/lifecycle-runner.js`
- Stage gates: `core/models/stage/stage-gates.js`
- Scope guard: `app/cesium/restore3-scope-manager.js`
- Work mode artifacts: `relay-cesium-world.html` (`PROPOSE`/`COMMIT`)
- Proof index: `archive/proofs/PROOF-INDEX.md`

## Capability Matrix

| Capability | Location | Current Status | Decision | Acceptance Contract |
|---|---|---|---|---|
| Voting engine (backend semantics) | `archive/2024-2025-v93-react-app/src/backend/domains/voting/*` | Archived, inactive in current runtime | ADAPT | Must use cadence-table quorum + frozen eligibility snapshots + stage/scope checks + refusal logs. No percentile eligibility. |
| Voting UI | `archive/2024-2025-v93-react-app/src/frontend/components/voting/*` | Archived React UI, inactive | REWRITE | Rebuild UI against canonical runtime APIs and lifecycle runner; split presentation voting vs governance voting; no direct legacy endpoints. |
| Boundary editor | `archive/2024-2025-v93-react-app/src/frontend/components/main/globe/editors/*` | Archived React editor, inactive | REWRITE | Rebuild in current Cesium runtime with draft->propose->commit chain, geometry hash checks, scope assertion, explicit invalid-geometry refusal. |
| Globe overlays (MapLibre/Deck parity) | Deferred restore slices (docs), world managers in `app/cesium/*` | Partially restored; full stack deferred | ADAPT | World-profile-only restore with deterministic fixtures; proof profile must return `PROFILE_LOCKED_PROOF`; no impact on proof rails. |
| Satellite/weather | `app/cesium/imagery-registry.js`, `app/cesium/weather-manager.js`, `app/cesium/topography-manager.js` | Active and proof-indexed | KEEP | Preserve existing world-only profile lock and deterministic service fixture behavior. |
| Channel/marker clustering | `app/cesium/world-globe-manager.js` + archived marker/channel surfaces | Partial active (cluster ladder), channel markers not restored | ADAPT | Restore read-only marker overlays from deterministic datasets first; no governance mutation path in marker layer. |
| Region ladder | `app/cesium/world-globe-manager.js` + restore fixtures | Active baseline via restore slices | KEEP | Extend datasets with static fixtures only; preserve refusal/scope/profile behavior and existing logs. |

## Restore Contracts Per Domain

### Voting Domain
- Must emit canonical lifecycle and refusal logs (`[VOTE] ...`, `[REFUSAL] ...`).
- Must enforce:
  - `freezeEligibilitySnapshot()`
  - `getQuorumThreshold()` from cadence table
  - `canExecute()` stage checks
  - `applyScopeIsolation()` / `assertCommitScope()`
- Forbidden:
  - direct legacy vote commits bypassing work-mode artifacts
  - auto-unlock semantics outside canonical chain

### Boundary Domain
- All edits must be commit-governed:
  - draft geometry (non-mutating)
  - proposal artifact references `geometryHash`
  - commit verifies hash + scope
- Mandatory refusal rails:
  - invalid geometry
  - hash mismatch
  - scope violation

### Globe Domain
- Full parity only under `RELAY_PROFILE=world`.
- `RELAY_PROFILE=proof` must refuse world-only APIs with `PROFILE_LOCKED_PROOF`.
- Datasets must default to deterministic local fixtures (no live remote fetch by default).

## Phase Gate for Legacy Reactivation
Legacy capability can only move from archived/inactive to active when:
1. A canonical proof script exists
2. Artifact is created and indexed in `archive/proofs/PROOF-INDEX.md`
3. `OSV-1` passes
4. headless parity passes
5. lints are clean on changed files

## Immediate Next Execution Order
1. HUD-1 + params (completed and proof-indexed)
2. Globe parity slices (world profile only)
3. Boundary editor rewrite (commit-governed)
4. Voting UI reactivation on canonical primitives
5. Integrated restore parity proof
