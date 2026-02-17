# RESTORE-BASELINE-SUMMARY (SRR-1)

Date: 2026-02-13  
Status: BASELINE FROZEN (post `RESTORE-PARITY` PASS)

## Purpose

This document is the executive checkpoint for the restored canon-aligned baseline.  
It defines what is in scope, what is excluded, what is proven, and what remains deferred.

## Included in Baseline

- Spreadsheet semantic stack: `PQ-3` through `PQ-7`
  - band alignment, formula refs, deterministic DAG/cycle handling, replay parity, inspector provenance
- Deterministic replay rails for sheet commit semantics (`CELL_SET`, `CELL_CLEAR`, `CELL_FORMULA_SET`)
- Inspector v1 (read-only provenance for cell/timebox surfaces)
- Adaptive HUD (`HUD-1`) with policy parameters (`HUD-PARAMS-v0`) and visible `policyRef/paramsVersion`
- Commit-governed boundary editor (`BOUNDARY-A1`) with draft -> propose -> commit chain
- Canon-wired voting UI (`VOTE-A2`) with presentation/governance separation
- Globe restore slices (world-profile controlled): `GLOBE-RESTORE-0`, `1`, `2A`, `3`, `4`, `3A`
- UX stabilization (`USP-1`) and movement continuity stack (`CAM0.4.2` included)
- Social activation lock groups `LCK-1..LCK-4` proven
- Integrated capstone parity gate (`RESTORE-PARITY`) proven

## Explicitly Excluded

- Proximity lifecycle feature implementation (`F0.4.*`)
- MapLibre/Deck overlay parity restore (`GLOBE-RESTORE-2` deferred)
- New governance rule logic beyond already proven canonical primitives
- Filament time scrubbing expansion (beyond snapped movement proof scope)
- Encryption layer expansion (cell-level crypto runtime work)
- Any new feature slices not already proof-indexed under this baseline

## Proven (Evidence State)

- `RESTORE-PARITY` gate: PASS (`archive/proofs/restore-full-parity-console-2026-02-13.log`)
- Regression rails after parity: PASS
  - `OSV-1`
  - `headless-tier1-parity`
- Relevant restoration artifacts are indexed in:
  - `archive/proofs/PROOF-INDEX.md`

## Deferred Work (Not Started in Freeze)

- Proximity stack restore (hardware scanning, channel lifecycle, anti-spoof path)
- Deferred globe overlay parity track (`MapLibre/Deck`)
- Additional security hardening slices (crypto runtime surface)
- Post-freeze roadmap candidate programs (to be selected after review):
  - proximity stack
  - encryption layer
  - KPI anomaly engine
  - performance hardening
  - operator documentation / deployment posture

## Known Risk Surface

- Operational runtime stability under long-running mixed browser/proof workloads
- Upstream data quality risk (deterministic system can still faithfully process incorrect source data)
- Documentation drift risk if baseline docs are not kept synchronized with proof index
- Infrastructure-level threat surface remains outside current application-level proof gates

## Infrastructure Assumptions

- Local/dev execution with reachable app and globe-service endpoints
- Deterministic fixture-first behavior for world-profile restore slices
- Browser automation available for proof scripts that require runtime UI checks
- No hidden mutation paths outside canonical commit/lifecycle rails

## Operational Constraints

- Proof-first discipline remains mandatory for baseline claims
- Profile isolation remains mandatory (`proof` vs `world`)
- No silent fallback; refusal semantics must remain explicit
- Freeze mode active: bugfixes, docs sync, and stability work only

## Data Integrity Guarantees

- Append-only materialization model with explicit refusal on invalid transitions
- Deterministic formula dependency handling with cycle visibility (`INDETERMINATE` + reason)
- Boundary edits are hash-verified between propose and commit
- Voting UI paths are wired to canonical primitives (no private authority logic)

## Replay Guarantees

- Deterministic replay reconstructs sheet state from commit logs
- Replay parity line (`[R] replayHash=... matchesLive=true`) is proofed
- Headless/browser parity remains a required rail for baseline confidence

## Governance Guarantees

- Stage gates and scope isolation remain enforced
- Eligibility snapshots and quorum handling remain canonical for governance voting flows
- Presentation voting and governance voting remain explicitly separated
- Social lock prerequisites (`LCK-1..LCK-4`) are proven and indexed

## Freeze Rule

No new feature slices may start until this baseline is reviewed and the next program is explicitly approved.
