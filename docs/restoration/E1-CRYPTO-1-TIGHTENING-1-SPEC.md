# E1-CRYPTO-1-TIGHTENING-1 (CRYPTO-VERIFY-GATE-1) — SPEC

**Status:** PROPOSE  
**Date:** 2026-02-16  
**Prerequisite:** E1-CRYPTO-1 COMMIT/PASS, E3-REPLAY-1 PASS, HEADLESS-0 PASS  
**Contract:** RELAY-MASTER-BUILD-PLAN.md Module L (E1); E1-CRYPTO-1; this spec adds enforcement gates only.  
**Baseline:** Integrity exists (`relayVerifyChainIntegrity`, `relayCryptoReplayPreCheck`). This slice makes verification non-optional at defined boundaries.

---

## Goal

Enforce integrity at boundaries (gates) using existing `relayVerifyChainIntegrity({ emitScar: false })`.  
No new crypto features. No changes to crypto internals.

---

## Scope

### Required

- **Pre-commit/CI gate:** Runs verify-integrity and **passes only when `overall === 'VALID'`**.
- **Strict decision:** `BROKEN`, `UNCHECKED`, and `ERROR` are all failures.

### Replay

- **Keep existing pre-check** — No change if already present (replay already calls `relayCryptoReplayPreCheck()` before running).

### Optional

- **Verify before export/headless golden compare** — Call verify before exporting proof artifacts or headless golden compare; if not `VALID`, emit refusal logs; do not write scars.
- **Verify before PASS timebox events** — Before appending timebox events that claim PASS, optionally call verify; if broken, emit refusal log; do not write scars.

---

## Allowed Files

- `scripts/verify-integrity.mjs`
- `package.json`
- `.husky/pre-commit`
- `scripts/e1-crypto-1-tightening-1-proof.mjs`
- `docs/restoration/E1-CRYPTO-1-TIGHTENING-1-SPEC.md`
- `archive/proofs/e1-crypto-1-tightening-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/process/ACTIVE-SLICE.md`
- `HANDOFF.md`
- `docs/restoration/RESTORATION-INDEX.md`

---

## Forbidden

- No changes under `core/models/crypto/*`
- No new crypto primitives, no new hashing logic, no signatures/encryption
- No changes to presence / ride / visuals / replay logic (except calling verify-integrity where explicitly allowed)

---

## Required Logs

```
[CRYPTO-GATE] verify:integrity overall=<VALID|BROKEN> durationMs=<n>
[CRYPTO-GATE] pre-commit result=<PASS|REFUSED> overall=<...>
```

---

## Refusals

```
[REFUSAL] reason=CRYPTO_GATE_VERIFY_FAILED overall=BROKEN component=<...>
[REFUSAL] reason=CRYPTO_GATE_PRE_COMMIT_REFUSED
```

---

## Proof Script

**File:** `scripts/e1-crypto-1-tightening-1-proof.mjs`

### 8 Stages

1. **verify script exists + executable** — `scripts/verify-integrity.mjs` exists and is runnable.
2. **verify passes on clean state** — On clean repo (valid chain), `npm run verify:integrity` exits 0; log contains `overall=VALID`.
3. **simulate broken integrity** — Tamper in-memory in browser session (e.g. corrupt derived chain); verify returns BROKEN.
4. **verify-integrity exits non-zero on BROKEN** — When overall is BROKEN, script exits non-zero; log contains refusal.
5. **package.json has npm run verify:integrity** — `package.json` has `"verify:integrity": "node scripts/verify-integrity.mjs"`.
6. **.husky/pre-commit calls npm run verify:integrity** — Pre-commit hook invokes `npm run verify:integrity`.
7. **pre-commit refusal path proven** — BROKEN state triggers pre-commit refusal (commit blocked).
8. **regressions** — E1-CRYPTO-1 (9/9), E3-REPLAY-1 (9/9), HEADLESS-0 (8/8) still PASS.

---

## Completion Checklist

- [ ] verify-integrity script exists
- [ ] npm script added (`verify:integrity`)
- [ ] husky hook invokes it
- [ ] proof passes + proof log stored under `archive/proofs/e1-crypto-1-tightening-1-*`
- [ ] PROOF-INDEX updated
- [ ] ACTIVE-SLICE updated (slice name, status, ProofArtifacts path, AllowedFiles)
- [ ] SLICE-REGISTER row updated to COMMIT/PASS once done
- [ ] HANDOFF updated

---

## What the New Agent Should Do First

1. **Set ACTIVE-SLICE** to this slice (`E1-CRYPTO-1-TIGHTENING-1`) with allowed-files list and BaselineHead.
2. **Implement** `scripts/verify-integrity.mjs` (load Relay in headless Chromium, call `relayVerifyChainIntegrity({ emitScar: false })`; exit 0 if VALID, 1 if BROKEN or error).
3. **Wire** `package.json` (`npm run verify:integrity`) and `.husky/pre-commit` (call `npm run verify:integrity`).
4. **Run** `node scripts/e1-crypto-1-tightening-1-proof.mjs` until all 8 stages PASS.
5. **Save** proof log under `archive/proofs/e1-crypto-1-tightening-1-*`.
6. **Update** PROOF-INDEX, SLICE-REGISTER, RESTORATION-INDEX, HANDOFF.
7. **Commit + push** with evidence bundle.

**Rule:** No new slice starts without ACTIVE-SLICE updated and allowed-files list defined. Every slice ends with proof log + PROOF-INDEX + SLICE-REGISTER + HANDOFF update.
