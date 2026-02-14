# RELAY ARCHITECT REVIEW CHECKLIST v1.1

## Review Policy (Mandatory)

- Review from local clone only.
- If this checklist file is modified, a corresponding proof artifact must be committed under `archive/proofs/`.
- Lock baseline before review:
  - `git rev-parse HEAD`
  - `git status --short`
- A slice is PASS only if all 4 evidences exist:
  1. Code path confirmed
  2. Runtime behavior confirmed
  3. Proof artifact confirmed from disk
  4. Contract alignment confirmed
- If tooling/access blocks verification, classify as `UNVERIFIED` with reason `ACCESS_BLOCKED`.
- Repo-wide casual reviews are not allowed. Only slice-based reviews are allowed.
- Output must include exactly one recommended micro-batch (single scoped change).

---

## SECTION 1 - Baseline Lock

| Item | Value |
|---|---|
| git rev-parse HEAD | |
| git status --short | |
| Reviewer | |
| Date | |

---

## SECTION 2 - Slice Definition

| Field | Value |
|---|---|
| Slice Name | |
| Goal (explicit invariant) | |
| Scope Type (Code Review / Contract Compliance / Proof Audit / Bug Triage) | |
| Files Under Review (3-5 max) | |
| Relevant Contract(s) | |
| Proof Artifact File (exact path) | |
| Runtime Evidence (screenshot/video path) | |

---

## SECTION 3 - Evidence Verification

### 3.1 Code Path Verification

| Question | Result |
|---|---|
| Correct file modified? | PASS / FAIL / UNVERIFIED |
| No canonical drift (ENU, gates, IDs)? | PASS / FAIL / UNVERIFIED |
| Launch-only changes properly gated? | PASS / FAIL / UNVERIFIED |
| No unintended side effects? | PASS / FAIL / UNVERIFIED |

Notes:

### 3.2 Runtime Behavior Verification

| Question | Result |
|---|---|
| Behavior matches expected UX flow? | PASS / FAIL / UNVERIFIED |
| No visual regressions? | PASS / FAIL / UNVERIFIED |
| No console errors/warnings? | PASS / FAIL / UNVERIFIED |
| State transitions correct? | PASS / FAIL / UNVERIFIED |

Notes:

### 3.3 Proof Artifact Verification (From Disk Only)

| Check | Result |
|---|---|
| Artifact exists in `archive/proofs/` | PASS / FAIL |
| Required log lines present | PASS / FAIL |
| No REFUSAL unless expected | PASS / FAIL |
| Log semantics match contract | PASS / FAIL |

Rule:
- If artifact is missing locally while slice claims PASS, classify as `UNVERIFIED (evidence missing)` and request the artifact.
- If artifact is inaccessible due to tooling/path/retrieval, classify as `UNVERIFIED (ACCESS_BLOCKED)`.

Notes:

### 3.4 Contract Alignment

| Check | Result |
|---|---|
| Matches `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` | PASS / FAIL / UNVERIFIED |
| Matches `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` | PASS / FAIL / UNVERIFIED |
| No violation of frozen invariants | PASS / FAIL / UNVERIFIED |
| No hidden container/orbit metaphors introduced | PASS / FAIL / UNVERIFIED |

Notes:

---

## SECTION 4 - Final Classification (Slice Level)

| Classification | Mark |
|---|---|
| PASS | |
| UNVERIFIED | |
| FAIL | |

Rules:
- If any of the 4 evidence categories is missing, classify as `UNVERIFIED`.
- `FAIL` is only for verified contract violations.
- Never infer `FAIL` from retrieval issues.

---

## SECTION 5 - Risk Assessment

| Risk Type | Present? | Notes |
|---|---|---|
| Regression Risk | Yes / No | |
| Proof Drift Risk | Yes / No | |
| Contract Drift Risk | Yes / No | |
| Performance Risk | Yes / No | |

---

## SECTION 6 - Single Micro-Batch Recommendation

Constraint:
- Only one scoped recommendation allowed.

| Field | Value |
|---|---|
| Micro-batch Name | |
| Exact Files Affected | |
| Scope (max 1 invariant) | |
| Why Highest Priority | |
| Required Proof Artifact | |

---

## REVIEW OUTPUT FORMAT (Mandatory)

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

No prose beyond this block unless explicitly requested.

---

## Enforcement Clause

- If reviewer attempts repo-wide commentary, reject review output.
- If reviewer infers failure from missing GitHub raw file or truncated retrieval, classify as `UNVERIFIED (ACCESS_BLOCKED)`.
- If reviewer cannot verify artifact locally, classify as `UNVERIFIED (evidence missing)` and request file.

