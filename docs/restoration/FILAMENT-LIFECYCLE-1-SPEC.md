# FILAMENT-LIFECYCLE-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** Phase 6 VOTE-COMMIT-PERSISTENCE-1 PASS, VIS-2 baseline PASS
**Contract:** docs/architecture/RELAY-FILAMENT-LIFECYCLE.md

---

## Goal

Implement the hard lifecycle physics of filaments:

- Object contract + global registry
- Dual state machines (work + lifecycle)
- Inward movement mapping (lifecycle state → branch fraction → visual position)
- Closure enforcement (governance + drifts + work state)
- Trunk absorption via appendTimeboxEvent
- Turnover rate metric (fact-level: durationMs = closedAt - openedAt)
- Band-snap alignment to timebox slabs via _vis4SlabRegistry

This is Option B: hard physics + inward movement + closure enforcement.
Disclosure/visibility tiers are deferred to FILAMENT-DISCLOSURE-1.

---

## Scope

### Allowed Files

- relay-cesium-world.html
- app/renderers/filament-renderer.js
- core/models/relay-state.js (add `filaments` property only)
- scripts/filament-lifecycle-proof.mjs
- docs/restoration/FILAMENT-LIFECYCLE-1-SPEC.md
- archive/proofs/*
- docs/process/ACTIVE-SLICE.md, docs/process/SLICE-REGISTER.md
- archive/proofs/PROOF-INDEX.md
- docs/restoration/RESTORATION-INDEX.md
- HANDOFF.md (one structural line)

### Forbidden

- No new LOD thresholds
- No canopy geometry changes
- No FreeFly/input changes
- No spreadsheet/cell commit entanglement (cellId stays optional/null)
- No disclosure/visibility tier implementation
- No new band height computation system (use _vis4SlabRegistry only)
- No changes to Phase 5 canonical data path
- No changes to Phase 6 vote persistence logic

---

## Definitions

### Filament Object Contract

```
filamentId          string    stable unique ID
sourceEntityId      string    initiating party
targetEntityId      string    receiving party
branchId            string    owning department branch
sheetId             string?   optional sheet reference
cellId              null      NOT used this slice
workState           enum      DRAFT|HOLD|PROPOSE|ACTIVE|COMMIT|REVERT
lifecycleState      enum      OPEN|ACTIVE|SETTLING|CLOSED|ARCHIVED|REFUSAL
openedAt            number    epoch ms
updatedAt           number    epoch ms
closedAt            number?   set on CLOSED
settledAt           number?   set on SETTLING
archivedAt          number?   set on ARCHIVED
magnitude           number    financial weight
evidencePointers    array     future use
visibilityScope     string    PRIVATE (future use)
timeboxId           string    associated timebox
turnoverMs          number?   computed on CLOSED: closedAt - openedAt
```

### Storage

- Global registry: `relayState.filaments` (Map keyed by filamentId)
- Branch nodes: `branch.filamentIds[]` (reference array only)
- Log: `[FILAMENT] registry initialized=PASS total=<n>`

### Work State Machine

```
DRAFT → PROPOSE → ACTIVE → COMMIT
any → HOLD
any → REVERT
```

### Lifecycle State Machine

```
OPEN → ACTIVE → SETTLING → CLOSED → ARCHIVED
OPEN → REFUSAL
ACTIVE → REFUSAL
SETTLING → REFUSAL
```

### Lifecycle-to-Position Mapping

```
OPEN        fraction=0.9    branch outer edge     cyan
ACTIVE      fraction=0.6    branch mid            green
SETTLING    fraction=0.35   lower branch          amber
CLOSED      fraction=0.1    branch base           grey
ARCHIVED    N/A             trunk (invisible)      —
REFUSAL     fraction=0.1    branch base + scar    red
```

---

## Functional Requirements

### 1. Registry + Demo Filaments

On boot (launch profile):
- Initialize `relayState.filaments` Map
- Create 6 demo filaments spanning all lifecycle states across branch.finance and branch.maintenance
- Populate `branch.filamentIds[]` on each branch
- Log: `[FILAMENT] registry initialized=PASS total=6`

### 2. State Transitions

`transitionWorkState(filamentId, newState)`:
- Validate transition legality
- Update updatedAt
- Log: `[FILAMENT] workTransition id=<id> from=<old> to=<new> result=PASS`

`transitionLifecycleState(filamentId, newState)`:
- Validate transition legality
- On SETTLING: set settledAt
- On CLOSED: set closedAt, compute turnoverMs = closedAt - openedAt
- On ARCHIVED: call appendTimeboxEvent(trunkNode, ...), set archivedAt
- On REFUSAL: scar overlay (reuse Phase 6 pattern)
- Log: `[FILAMENT] lifecycleTransition id=<id> from=<old> to=<new> result=PASS`

### 3. Turnover Rate (Fact-Level Metric)

On CLOSED:
```
[FILAMENT] turnover id=<id> durationMs=<turnoverMs> branch=<branchId> result=PASS
```

On ARCHIVED (branch aggregate):
```
[FILAMENT] branchTurnover branch=<branchId> avgMs=<avg> closedCount=<n> result=PASS
```

### 4. Closure Enforcement

A filament can only transition to CLOSED if ALL of:
1. workState === 'COMMIT'
2. branch.voteStatus !== 'REJECTED'
3. timebox openDrifts === 0

If any condition fails:
```
[REFUSAL] reason=FILAMENT_CLOSE_BLOCKED_<WORK_STATE|GOVERNANCE|DRIFTS> filament=<id>
```

### 5. Trunk Absorption

`appendTimeboxEvent(trunkNode, event)` — always targets trunk node only:
- Validates trunkNode.type === 'trunk'
- Appends event to latest timebox
- Increments commitCount
- Log: `[TIMEBOX] event type=FILAMENT_ARCHIVE id=<filamentId> applied=PASS target=trunk.<id> timeboxId=<tbId>`

### 6. Marker Rendering

`renderFilamentMarkers(branches)` in filament-renderer.js:
- Called at COMPANY LOD alongside renderBasinRings and renderVoteRejectionScars
- For each non-ARCHIVED filament on each branch:
  - Compute raw position from lifecycle fraction along _branchPositionsWorld
  - Snap to nearest slab center from _vis4SlabRegistry (band snap)
  - Render small filled ellipse (radius ~4m) color-coded by lifecycle state
  - Entity ID: `filament-marker-<filamentId>`
- Band snap log: `[FILAMENT] bandSnap id=<id> timeboxId=<tb> deltaM=<distance> result=PASS`
- Band snap source log (once): `[FILAMENT] bandSnap source=vis4Registry`

---

## Proof Script

`scripts/filament-lifecycle-proof.mjs`

### Stages

1. **Boot** — confirm `[FILAMENT] registry initialized=PASS total=6`
2. **Focus company** — fly to COMPANY LOD, confirm markers visible
3. **State transitions** — trigger demo transitions, confirm `[FILAMENT] lifecycleTransition` and `[FILAMENT] workTransition` logs
4. **Band alignment** — assert `[FILAMENT] bandSnap` logs with deltaM < 5
5. **Closure enforcement** — attempt invalid close, confirm `[REFUSAL]` log
6. **Trunk absorption** — trigger ARCHIVED transition, confirm `[TIMEBOX] event type=FILAMENT_ARCHIVE` log
7. **Turnover rate** — confirm `[FILAMENT] turnover` log with durationMs > 0
8. **Gate** — `[FILAMENT-PROOF] gate-summary result=PASS`

### Artifacts

- `archive/proofs/filament-lifecycle-console-YYYY-MM-DD.log`
- `archive/proofs/filament-lifecycle-YYYY-MM-DD/01-markers-company.png`
- `archive/proofs/filament-lifecycle-YYYY-MM-DD/02-after-transitions.png`
- `archive/proofs/filament-lifecycle-YYYY-MM-DD/03-closure-refusal.png`
- `archive/proofs/filament-lifecycle-YYYY-MM-DD/04-band-snap.png`

---

## Acceptance Criteria

PASS only if:
- All 8 proof stages pass
- All required logs appear in correct order
- Band snap deltaM < 5m for all markers
- Closure enforcement blocks correctly and emits [REFUSAL]
- Turnover metric computed and logged with durationMs > 0
- Trunk absorption uses appendTimeboxEvent (not direct mutation)
- No LOD/focus/FreeFly regressions
- FPS still works
- HUD still correct
