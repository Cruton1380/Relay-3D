# Relay Slice Workflow v0

**Status:** PROCESS LOCK  
**Scope:** Canon/Architect/AI collaboration interface for all coding work.

---

## Objective

Make slice-based evidence review the mandatory interface for development.

A slice is PASS only when all 4 evidences are present:

1. Code path confirmation
2. Runtime behavior confirmation
3. Proof artifact confirmation (from disk, tracked in `archive/proofs/`)
4. Contract alignment confirmation

Missing evidence => `UNVERIFIED` (not `FAIL`).

---

## Slice Lifecycle

`DRAFT -> IMPLEMENT -> PROOF -> REVIEW -> ACCEPT -> (optional) REVERT`

- **DRAFT**: WIP mode; no canonical PASS claim.
- **IMPLEMENT**: constrained file edits only.
- **PROOF**: run proof script and produce artifact.
- **REVIEW**: classify `PASS / UNVERIFIED / FAIL` using checklist.
- **ACCEPT**: merge/commit with evidence bundle.
- **REVERT**: explicit rollback commit; no history erasure.

---

## Required Commands (per slice)

```bash
git rev-parse HEAD
git status --short
npm run gate:slice
```

If `npm run gate:slice` fails, the slice is not commit-ready.

---

## Required Artifacts

- Active slice header: `docs/process/ACTIVE-SLICE.md`
- Slice register row: `docs/process/SLICE-REGISTER.md`
- Proof artifact: `archive/proofs/<RAIL>-<SLICE>-<YYYY-MM-DD>.log`
- Proof index entry: `archive/proofs/PROOF-INDEX.md`

---

## Output Template (Mandatory)

```text
Slice: <Name>
Baseline: <HEAD>
Classification: PASS / UNVERIFIED / FAIL

Evidence Summary:
- Code: PASS / FAIL / UNVERIFIED
- Runtime: PASS / FAIL / UNVERIFIED
- Proof: PASS / FAIL / UNVERIFIED
- Contract: PASS / FAIL / UNVERIFIED

Micro-Batch: <Name>
Scope: <Single scoped change>
```

---

## Enforcement

- Repo-wide casual reviews are disallowed.
- Scope creep outside declared files is disallowed.
- Commit flow must pass `npm run gate:slice` unless explicit `DRAFT` bypass is set.

### DRAFT bypass

Allowed only when one of the following is true:

- Environment variable: `RELAY_SLICE_MODE=DRAFT`
- `docs/process/ACTIVE-SLICE.md` contains `Status: DRAFT`

In DRAFT mode, commits are non-canonical and must not claim PASS.

---

## Common Gate Failures and Fixes

### 1) Baseline mismatch

Symptom:

- `[SLICE-GATE] FAIL baseline mismatch active=<...> current=<...>`

Fix:

1. Run `git rev-parse HEAD`
2. Update `BaselineHead` in `docs/process/ACTIVE-SLICE.md`
3. Re-run `npm run gate:slice`

### 2) Proof artifact missing

Symptom:

- `[SLICE-GATE] FAIL proof artifact missing archive/proofs/...`

Fix:

1. Generate the proof log for the slice
2. Ensure path matches `archive/proofs/<RAIL>-<SLICE>-<YYYY-MM-DD>.log`
3. Re-run gate

### 3) Proof artifact not indexed

Symptom:

- `[SLICE-GATE] FAIL proof artifact not indexed ...`

Fix:

1. Add the exact proof path to `archive/proofs/PROOF-INDEX.md`
2. Keep path string identical
3. Re-run gate

### 4) Slice missing in register

Symptom:

- `[SLICE-GATE] FAIL slice missing in register "<slice>"`

Fix:

1. Add/update row in `docs/process/SLICE-REGISTER.md`
2. Ensure `Slice ID` matches `ACTIVE-SLICE` exactly
3. Re-run gate

### 5) DRAFT bypass expectations

If work is intentionally non-canonical:

- set `RELAY_SLICE_MODE=DRAFT` **or**
- set `Status: DRAFT` in `docs/process/ACTIVE-SLICE.md`

Then gate bypass is expected and PASS claims are not allowed.

