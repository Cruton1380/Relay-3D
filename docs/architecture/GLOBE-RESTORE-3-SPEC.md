# GLOBE-RESTORE-3: Region/Boundary Scope Integration (Canonical)

Status: IMPLEMENTED + PROOFED (v0 PASS)
Date: 2026-02-12

## Objective

Integrate globe navigation, geographic boundaries, governance scope isolation, and ERP tree visibility into one canonical world-mode surface. This slice is integration-first and must not restore legacy UI patterns blindly.

## Scope (Strict)

- Render region/country/site coherence through the existing LOD ladder.
- Bind governance scope isolation to visible geographic overlays.
- On region/country selection, expose:
  - branches in scope
  - governance artifacts in scope
  - explicit out-of-scope refusal visibility
- Preserve Capability Bud interaction model (no dashboard expansion).

## Explicit Non-Scope

- No boundary editor UI restore.
- No new voting/social UI restore.
- No MapLibre/Deck overlay stack.
- No ingest, packet, ledger, or governance logic mutation.

## Hard Invariants

- `RELAY_PROFILE=proof` behavior remains unchanged.
- `RELAY_PROFILE=world` enables Restore-3 visuals only.
- OSV-1 and headless Tier-1 parity remain passing and unchanged.
- No golden hash drift.
- Any scope drift must halt with:
  - `[REFUSAL] reason=RESTORE_SCOPE_VIOLATION`
- Deterministic geography fixture: GLOBE-RESTORE-3 must ship with a tiny static GeoJSON fixture (2 countries, 3 regions, 2 sites) used only for world-mode proof. No live/network geography fetch.
- No external geography APIs.
- No dynamic dataset pulls.
- No environment-dependent map layers.

## Required Proofs

- Add `scripts/globe-restore-3-proof.mjs`.
- Verify world-mode overlay behavior against deterministic fixture.
- Verify proof-mode lock/refusal behavior.
- Capture artifacts:
  - `archive/proofs/globe-restore-3-proof-console-<date>.log`
  - `archive/proofs/globe-restore-3-proof-<date>.png`
- Re-run regressions:
  - `node scripts/osv1-full-system-proof.mjs`
  - `node scripts/headless-tier1-parity.mjs`

## Required Log Lines

- `[GLOBE] scope-overlay level=<...> region=<...> country=<...>`
- `[GOV] scope-visualization result=PASS ...`
- `[REFUSAL] reason=GOV_SCOPE_VIOLATION ...` (negative-path assertion)
- `[GLOBE-RESTORE-3] gate-summary result=PASS`

## Completion and Indexing Rule

Do not mark this slice as passed until:

1. Restore-3 proof passes with required logs and artifacts.
2. OSV-1 passes unchanged.
3. Headless parity passes unchanged.
4. `archive/proofs/PROOF-INDEX.md` is updated with Restore-3 PASS entry.
5. `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` status moves from in-progress to completed and locked.
