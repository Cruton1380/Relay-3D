# ATTENTION-CONFIDENCE-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** SCOPE-COHERENCE-1 PASS, FILAMENT-DISCLOSURE-1 PASS, Phase 6 PASS
**Contract:** docs/architecture/RELAY-FILAMENT-LIFECYCLE.md; docs/architecture/RELAY-PHYSICS-CONTRACTS.md

---

## Goal

Wire three read-only computation functions that derive attention and confidence from existing filament/timebox/vote/disclosure data. Add minimal HUD output and view-only filters. No geometry changes. No new schema.

This is the compute foundation for HEIGHT-BAND-1 and VIS-MEGASHEET-1.

---

## Scope

### Allowed Files

- `relay-cesium-world.html` (getBackingRefs, computeConfidence, computeAttention, aggregation, filters)
- `app/ui/hud-manager.js` (Tier 2 readout lines for confidence + attention)
- `scripts/attention-confidence-proof.mjs` (new)
- `docs/restoration/ATTENTION-CONFIDENCE-1-SPEC.md`
- `archive/proofs/*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`, `docs/process/SLICE-REGISTER.md`
- `HANDOFF.md` (one structural line)

### Forbidden

- No geometry / rendering changes
- No new entity types or storage formats
- No changes to filament lifecycle state machines
- No changes to closure enforcement or trunk absorption
- No changes to disclosure transitions
- No changes to Phase 5 canonical data path
- No changes to Phase 6 vote persistence logic
- No LOD threshold changes
- No canopy/FreeFly/input changes

---

## Definitions

### getBackingRefs(objectId)

Returns `{ filamentIds[], timeboxIds[], evidenceRefs[], missingRefs[] }` by walking:
- Filament registry (`relayState.filaments`)
- Branch/trunk timebox data (`node.timeboxes`)
- Disclosure store (filament `evidencePointers`)
- Vote store (branch `voteStatus`)

For a **branch**: filamentIds from `branch.filamentIds`, timeboxIds from `branch.timeboxes[].id`, evidenceRefs aggregated from all filaments on that branch.
For a **trunk**: all filaments across all branches, all branch timeboxes, trunk timeboxes.
For a **sheet**: filaments whose `sheetId` matches.
For a **filament**: its own timebox, its own evidencePointers.

`missingRefs` = filaments that have zero evidencePointers AND zero timeboxes.

### computeConfidence(objectId) -> 0..1

Derived solely from existing refs:
- +0.2 if at least one timebox exists for this object
- +0.3 if total evidenceRefs count > 0
- +0.2 if any filament's disclosure >= WITNESSED
- +0.3 if voteStatus === PASSED (for branches/trunks)
- Cap at 1.0
- Penalty: -0.1 per missingRef, floor at 0.0

### computeAttention(objectId) -> 0..1

Product of weights from existing state, normalized to 0..1:

Lifecycle weights:
- OPEN: 0.3, ACTIVE: 0.6, SETTLING: 0.8, REFUSAL: 0.9, CLOSED: 0.2, ARCHIVED: 0.1

Disclosure weights:
- PRIVATE: 0.2, WITNESSED: 0.5, PUBLIC_SUMMARY: 0.8, FULL_PUBLIC: 1.0

Vote state weights:
- NONE: 0.2, PENDING: 0.4, PASSED: 0.6, REJECTED: 0.9

For objects with multiple filaments, use max lifecycle weight and max disclosure weight.

### Fractal Aggregation

`aggregateAttention(scopeNode)`:
- cell -> sheet: average weighted by timeboxCount
- sheet -> branch: average weighted by filament count
- branch -> company: weighted max (highest-attention branch)
- company -> region -> global: weighted max

`aggregateConfidence(scopeNode)`:
- Same aggregation pattern, using average instead of max at all levels

---

## Functional Requirements

### 1. Implementation

Functions exposed as:
- `window.getBackingRefs(objectId)`
- `window.computeConfidence(objectId)`
- `window.computeAttention(objectId)`
- `window.aggregateAttention(scopeNodeId)`
- `window.aggregateConfidence(scopeNodeId)`

All computation is read-only. No state mutation.

### 2. HUD Wiring

In `app/ui/hud-manager.js`, add to Tier 2 content:
- Line: `Conf: <value>% | Attn: <value>%` for focused/selected object
- Only shown when an object is focused
- Does NOT increase Tier 1 row count

### 3. View Filters

Add to Tier 2 (collapsed by default):
- Confidence filter: minimum threshold (default 0, view-only — does NOT change state)
- Attention filter: toggle to dim low-attention nodes

Filters only affect the `data` object passed to renderer — they do not modify underlying filament/vote/disclosure stores.

### 4. Required Logs

```
[BACKING] id=<objectId> filaments=<n> timeboxes=<n> evidence=<n> missing=<n>
[CONF] id=<objectId> conf=<0..1> breakdown=tb:<0|1>,ev:<0|1>,disc:<0|1>,vote:<0|1>
[ATTN] id=<objectId> attn=<0..1> lifecycle=<state> disclosure=<tier> vote=<status>
[AC] aggregateAttention scope=<company|branch> result=<0..1> children=<n>
[AC] aggregateConfidence scope=<company|branch> result=<0..1> children=<n>
```

---

## Proof Script

`scripts/attention-confidence-proof.mjs`

### Stages

1. **Boot** — confirm filament registry + disclosure store + vote store loaded
2. **getBackingRefs** — call for branch.finance, assert filamentIds.length >= 3, timeboxIds.length > 0
3. **computeConfidence** — call for branch.finance (has timeboxes + vote PASSED), assert conf > 0.5
4. **computeAttention** — call for FIL-006 (REFUSAL + PRIVATE), assert high lifecycle weight
5. **aggregateAttention** — call for trunk.avgol, assert result between 0 and 1
6. **Filters** — toggle confidence filter, confirm low-confidence objects dimmed (UI state only)
7. **Gate** — `[AC-PROOF] gate-summary result=PASS stages=7/7`

### Artifacts

- `archive/proofs/attention-confidence-console-2026-02-15.log`
- `archive/proofs/attention-confidence-2026-02-15/01-hud-readout.png`

---

## Acceptance Criteria

PASS only if:
- All 7 proof stages pass
- All required logs appear
- Functions return correct values for known demo data
- HUD shows confidence + attention in Tier 2
- No geometry/rendering changes
- No regressions in existing proofs (VIS2, HUD, lifecycle, disclosure, launch-fix)
