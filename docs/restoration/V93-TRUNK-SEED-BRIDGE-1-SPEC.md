# V93-TRUNK-SEED-BRIDGE-1 — SPEC

**Status:** PROPOSE  
**Date:** 2026-02-16  
**Prerequisite:** `V93-DATA-SALVAGE-1` artifacts generated  
**Contract:** `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (Tier 2 `V93-MIGRATION-BRIDGE-1`)

---

## Goal

Inject vote-derived trunk seeds through canonical world trunk sync with boundary validation and deterministic IDs.

---

## Required

- Extend world anchor sync path to merge dataset anchors with vote-derived seeds.
- Validate vote-derived seeds through boundary containment when available (`containsLL`).
- Reject malformed or out-of-boundary seeds with refusal logs.
- Keep deterministic trunk IDs (`trunk.world.<normalized-seed-id>`).
- Keep stale cleanup behavior for previously generated world-anchor trunks.

---

## Allowed Files

- `relay-cesium-world.html`
- `scripts/v93-trunk-seed-bridge-1-proof.mjs`
- `archive/proofs/v93-trunk-seed-bridge-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/process/ACTIVE-SLICE.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

---

## Required Logs

```
[V93-BRIDGE] seedValidation pass=<n> refused=<n>
[REFUSAL] reason=V93_SEED_BOUNDARY_REJECTED seed=<id> country=<code>
[V93-BRIDGE] trunkSeedSync generated=<n> source=vote-bridge
```

---

## Proof

**Script:** `scripts/v93-trunk-seed-bridge-1-proof.mjs`

Stages:

1. World profile loads and vote-bridge seeds are produced.
2. Boundary validation rejects invalid seeds and accepts valid seeds.
3. Generated trunks include deterministic `trunk.world.*` IDs and render pass completes.

