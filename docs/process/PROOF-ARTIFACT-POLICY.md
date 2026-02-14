# Relay Proof Artifact Policy v0

**Status:** GOVERNANCE POLICY (docs/process)  
**Effective:** 2026-02-14  
**Scope:** How proof artifacts are named, classified, indexed, and reviewed.

---

## 1) Canonical Naming Pattern

Authoritative proof logs must use:

`archive/proofs/<RAIL>-<SLICE>-<YYYY-MM-DD>.log`

Example:

- `archive/proofs/LAUNCH-LAUNCH-FIX-1-2026-02-14.log`

Notes:

- `RAIL` is a short domain family (`A`, `B`, `C`, `D`, `VIS`, `UX`, `LAUNCH`, `LCK`, etc.).
- `SLICE` is the exact micro-batch/slice name.
- Date is UTC calendar date in `YYYY-MM-DD`.

---

## 2) One-Proof-Per-Slice Rule

- Each slice claiming PASS must have one authoritative proof artifact.
- If additional runs exist, only one is marked authoritative in `archive/proofs/PROOF-INDEX.md`.
- Re-runs after fixes create new proof files (do not overwrite older artifacts).

---

## 3) Authoritative vs Temporary Artifacts

### Authoritative (committed)

- Path: `archive/proofs/`
- Indexed in: `archive/proofs/PROOF-INDEX.md`
- Used for formal PASS claims and remote review.

### Temporary / Local (not committed)

- Path convention: `archive/proofs/_local/`
- Purpose: ad-hoc local debugging and experimentation.
- Not acceptable as canonical evidence for PASS.

---

## 4) Immutability Rule

- Proof logs are append-only governance evidence.
- Do not edit authoritative logs in place.
- Corrections or reruns must produce new proof artifacts with new timestamps/dates.
- Any change to interpretation must be reflected by a new `PROOF-INDEX` entry, not log mutation.

---

## 5) When to Update `archive/proofs/PROOF-INDEX.md`

Update the index when:

1. A new slice is marked PASS.
2. An authoritative artifact is superseded by a newer authoritative run.
3. Governance docs introduce or change proof requirements.

Minimum index content:

- Slice name
- Date
- Scope
- Authoritative artifact path(s)
- Required log lines
- Verification command

---

## 6) Review Wording Guidance

Use strict wording:

- `PASS` -> code + runtime + proof + contract all verified.
- `UNVERIFIED` -> missing evidence or access blocked.
- `FAIL` -> verified contract violation.

Special case wording:

- If proof exists locally but is not yet committed/published:
  - `Status: Local PASS, Remote UNPUBLISHED`

---

## 7) Optional Future Rail Directories (Not Applied Yet)

Suggested future organization (docs-only recommendation):

- `archive/proofs/A/`
- `archive/proofs/B/`
- `archive/proofs/C/`
- `archive/proofs/D/`
- `archive/proofs/VIS/`
- `archive/proofs/UX/`
- `archive/proofs/LAUNCH/`
- `archive/proofs/GOV/`

This policy does not move existing files.

