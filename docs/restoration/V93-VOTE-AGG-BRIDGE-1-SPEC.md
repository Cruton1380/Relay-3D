# V93-VOTE-AGG-BRIDGE-1 — SPEC

**Status:** PROPOSE  
**Date:** 2026-02-16  
**Prerequisite:** `V93-TRUNK-SEED-BRIDGE-1` operational in world profile  
**Contract:** `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (Tier 2 `V93-MIGRATION-BRIDGE-1`, coverage rows 31-33)

---

## Goal

Map v93 topic/candidate aggregation semantics into Relay-native trunk/branch metadata only.

---

## Required

- Compute per-channel and per-topic aggregates from bridge vote artifacts.
- Attach aggregation metadata to generated world trunks and matching branch metadata containers.
- Keep this layer presentation/inspection-only:
  - no geometry contract breaks
  - no topology rewrites
  - no replay/crypto path changes
- Expose read API for diagnostics (`relayGetV93VoteBridgeMeta`).

---

## Allowed Files

- `relay-cesium-world.html`
- `scripts/v93-vote-agg-bridge-1-proof.mjs`
- `archive/proofs/v93-vote-agg-bridge-1-*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/process/ACTIVE-SLICE.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

---

## Required Logs

```
[V93-AGG] topicAgg topics=<n> candidates=<n>
[V93-AGG] trunkMetaApplied trunks=<n> branches=<n>
```

---

## Proof

**Script:** `scripts/v93-vote-agg-bridge-1-proof.mjs`

Stages:

1. Aggregation map builds from adapter output.
2. Aggregation metadata is attached to generated trunks/branches.
3. Non-regression smoke: tree render + mode toggle remain PASS.

