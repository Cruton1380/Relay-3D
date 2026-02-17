# V93-DATA-SALVAGE-1 — SPEC

**Status:** PROPOSE  
**Date:** 2026-02-16  
**Prerequisite:** Governance canon coherent (`ACTIVE-SLICE` truthful), world profile operational  
**Contract:** `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (Tier 2 `V93-MIGRATION-BRIDGE-1`, Section 12.10 bridge rule)

---

## Goal

Convert v93 voting/globe donor data into Relay-native bridge artifacts without importing legacy runtime.

---

## Required

- Implement a Node adapter that ingests v93-compatible voting source data and emits:
  - Relay-native vote objects
  - Vote-seed candidates for trunk anchoring
  - Topic/candidate aggregation summaries
  - Parity report (counts, distribution, location coverage)
- Preserve stable IDs and lat/lon fidelity.
- Emit deterministic output ordering for replay-friendly diffs.

---

## Allowed Files

- `scripts/v93-to-relay-state-adapter.mjs`
- `scripts/v93-data-salvage-1-proof.mjs`
- `data/demos/demo-voting-data.json`
- `archive/proofs/v93-data-salvage-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/process/ACTIVE-SLICE.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

---

## Forbidden

- No import of legacy React/Cesium runtime managers into active runtime
- No topology mutation in this slice
- No changes to frozen geometry/physics contracts

---

## Required Logs

```
[V93-SALVAGE] adapter source=<path> channels=<n> votes=<n> seeds=<n>
[V93-SALVAGE] parity counts=PASS distribution=PASS locationCoverage=PASS
```

---

## Proof

**Script:** `scripts/v93-data-salvage-1-proof.mjs`

Stages:

1. Adapter runs and writes output JSON artifacts.
2. Total vote count parity passes.
3. Candidate/topic distribution parity passes.
4. Location coverage threshold and malformed-record diagnostics are emitted.

