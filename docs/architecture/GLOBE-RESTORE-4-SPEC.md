# GLOBE-RESTORE-4: Branch/Site Geospatial Assignment + Canonical In-World Scope Inspector (v0)

Status: SPEC LOCKED (docs-only, implementation not started)
Date: 2026-02-13

## Objective

Make the ERP tree physically belong to places:

- Assign branches and sites to geographic scopes (country/region/site) inside the world model.
- Provide a canonical in-world Scope Inspector that shows, for the currently selected scope:
  - which branches are in-scope
  - which are out-of-scope
  - which proposals/commits are allowed vs refused (scope violation surfaced explicitly)

## Strict Scope (Only This)

- Geospatial assignment model (v0):
  - A branch can have:
    - `homeSiteId` (site anchor)
    - optional `regionId` / `countryId` derived or explicitly bound
  - A site can have:
    - `lat`/`lon` point + optional radius
    - binds to `regionId` + `countryId`
  - Assignment must be commit-governed (`PROPOSE`/`COMMIT`) using existing W0/W1/W2 rails.
- Scope Inspector (world-only visual):
  - Reads:
    - Restore-3 fixture scope selection
    - assignment bindings
    - governance scope rules already in canon
  - Shows in-scope/out-of-scope lists and refusal reasons (no silent filtering).
- Deterministic fixture rule:
  - Restore-4 must use only deterministic local fixtures in proof.
  - No external geocoding.
  - No network lookups.
  - No live map datasets.

## Explicit Non-Scope

- No new voting UI.
- No boundary editor.
- No social UI.
- No MapLibre/Deck overlays.
- No ingest/packet/ledger/governance logic changes (visual + binding only).
- No external geography fetch.

## Hard Invariants

- `RELAY_PROFILE=proof` unchanged.
- `RELAY_PROFILE=world` enables Restore-4 visuals only.
- OSV-1 must PASS unchanged.
- Headless Tier-1 parity must PASS unchanged.
- No golden hash drift; if drift occurs emit and halt:
  - `[REFUSAL] reason=RESTORE_SCOPE_VIOLATION`

## Required Logs (Normative)

- `[GLOBE] assignment branch=<branchId> site=<siteId> region=<regionId> country=<countryId> mode=<proposed|committed>`
- `[GLOBE] scope-inspector selectedScope=<...> inScopeBranches=<n> outOfScopeBranches=<n>`
- `[REFUSAL] reason=GOV_SCOPE_VIOLATION proposalScope=<...> selectedScope=<...>`

## Proof Contract (Spec Only)

Define `scripts/globe-restore-4-proof.mjs` requirements (no implementation in this slice):

1. Start `dev:cesium` + `dev:globe-services`.
2. Open `?profile=world`.
3. Load deterministic Restore-3 fixture.
4. Apply deterministic assignments (at least 2 branches -> 2 sites).
5. Assert scope inspector lists are correct.
6. Trigger one intentional cross-scope refusal and assert required refusal log.
7. Capture screenshot + console artifact.
8. Re-run OSV-1 and headless parity unchanged.

Artifacts required:

- `archive/proofs/globe-restore-4-proof-console-<date>.log`
- `archive/proofs/globe-restore-4-proof-<date>.png`

## Documentation Rules for This Slice

- Create and lock this spec doc first (done in this step).
- Update:
  - `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (mark Restore-4 as spec-locked/in-progress)
  - `docs/architecture/LIVE-TEST-READINESS.md` (add Restore-4 expected behavior, world-only)
- Do not update `archive/proofs/PROOF-INDEX.md` until Restore-4 proof passes later.

## Stop Condition

After this spec lands, stop. No runtime code changes until spec is explicitly accepted.
