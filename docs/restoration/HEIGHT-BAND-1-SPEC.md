# HEIGHT-BAND-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** ATTENTION-CONFIDENCE-1 PASS, VIS-TREE-SCAFFOLD-1 PASS
**Contract:** docs/architecture/RELAY-PHYSICS-CONTRACTS.md

---

## Goal

Add semantic height (scope bands + offsets) driven by attention/confidence from Slice 1. Applies only in TREE_SCAFFOLD mode, not LAUNCH_CANOPY. Evidence-backed height only — missing backing refs produce no lift.

---

## Scope Bands (meters above trunk anchor)

| Scope | Band Base | Band Top |
|-------|-----------|----------|
| CELL | +300 | +300 |
| SHEET | +300 | +600 |
| BRANCH/DEPT | +2000 | +2000 |
| COMPANY | +2400 | +2400 |
| REGION | +3000 | +3000 |
| GLOBAL | +3600 | +3600 |

---

## Height Offset Within Band

```
bandMaxOffset = 120m
offset = bandMaxOffset * (0.7 * attention + 0.3 * confidence) + statePenalty
```

State penalties:
- REJECTED: -20m
- PASSED: 0m
- INDETERMINATE: uses opacity only, no height lift

---

## Indeterminate Guard (Mandatory)

If `missingRefs > 0` OR `conf < 0.3`:
- Cap offset to ~0
- Log: `[HEIGHT] indeterminate id=<id> conf=<val> missing=<n>`

---

## Elevation Invariant

Branch offset changes only if at least one filament with:
- `disclosure >= WITNESSED`
- `lifecycleState >= ACTIVE`

PRIVATE filaments never contribute to height lift.

---

## Contributor Requirement

Every elevation log must list filament IDs:

```
[PRESSURE] branch=<id> aggregate=<val> contributors=[<filamentIds>] threshold=<val> result=<PASS|INDETERMINATE>
[HEIGHT] branch=<id> offset=<m> band=<base>
```

---

## Required Logs

```
[HEIGHT-BAND] applied=PASS mode=TREE_SCAFFOLD bands=6 maxOffset=120
[HEIGHT] branch=<id> offset=<m> band=<base> attn=<val> conf=<val>
[HEIGHT] indeterminate id=<id> conf=<val> missing=<n>
[PRESSURE] branch=<id> aggregate=<val> contributors=[...] threshold=<val> result=<PASS|INDETERMINATE>
[HEIGHT-PROOF] gate-summary result=PASS
```

---

## Proof Script

`scripts/height-band-proof.mjs`

### Stages

1. **Boot** — confirm AC functions available
2. **Toggle to TREE_SCAFFOLD** — enter scaffold mode
3. **Height bands applied** — verify `[HEIGHT-BAND] applied=PASS`
4. **Branch offset** — verify branch heights differ by attention/confidence
5. **Indeterminate guard** — verify low-confidence branches have zero offset
6. **Contributor log** — verify `[PRESSURE]` log with filament IDs
7. **Toggle back** — verify LAUNCH_CANOPY heights unchanged
8. **Gate** — `[HEIGHT-PROOF] gate-summary result=PASS stages=8/8`

---

## Acceptance Criteria

PASS only if:
- Height offsets are evidence-backed
- Indeterminate guard fires for low-confidence objects
- LAUNCH_CANOPY heights unchanged
- All regression proofs pass
