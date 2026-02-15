# FILAMENT-DISCLOSURE-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** FILAMENT-LIFECYCLE-1 PASS (9b81032), Phase 6 VOTE-COMMIT-PERSISTENCE-1 PASS
**Contract:** docs/architecture/RELAY-FILAMENT-LIFECYCLE.md §6 Multi-User Cooperation

---

## Goal

Define and enforce visibility physics for filaments:

- Visibility tiers bound to lifecycle states
- Explicit, append-only disclosure transitions
- Evidence release gating
- Counter-disclosure mechanics (additive only, no retraction)
- HUD minimal glyph showing current visibility tier
- Timebox event integration for disclosure changes
- Governance gating (disclosure requires appropriate workState + voteStatus)

This is the social interface layer on top of the mechanical lifecycle proven in FILAMENT-LIFECYCLE-1.

Without this slice, filament lifecycle is raw power.
With this slice, filament lifecycle becomes governance.

---

## Scope

### Allowed Files

- `relay-cesium-world.html` (disclosure functions, demo transitions, HUD glyph wiring)
- `app/renderers/filament-renderer.js` (marker glyph overlay for visibility tier, visual only)
- `app/ui/hud-manager.js` (disclosure tier indicator in Tier 1 or Tier 2)
- `scripts/filament-disclosure-proof.mjs` (new)
- `docs/restoration/FILAMENT-DISCLOSURE-1-SPEC.md`
- `archive/proofs/*`
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`, `docs/process/SLICE-REGISTER.md`
- `HANDOFF.md` (one structural line)

### Forbidden

- No changes to filament lifecycle state machine transitions (OPEN→ACTIVE→SETTLING→CLOSED→ARCHIVED→REFUSAL)
- No changes to closure enforcement logic
- No changes to trunk absorption / appendTimeboxEvent
- No changes to turnover rate metric
- No changes to band-snap alignment
- No new LOD thresholds
- No canopy geometry changes
- No FreeFly/input changes
- No changes to Phase 5 canonical data path
- No changes to Phase 6 vote persistence logic
- No changes to ring/basin rendering
- No server/network persistence (demo only, same localStorage pattern as Phase 6)

---

## Definitions

### Visibility Tiers

| Tier | Meaning | Who Can See | Typical Use |
|------|---------|------------|-------------|
| `PRIVATE` | Default. Both parties only. | sourceEntity + targetEntity | Active work, negotiation |
| `WITNESSED` | Shared with selected guardians. | parties + explicit witness list | Dispute protection, accountability |
| `PUBLIC_SUMMARY` | Redacted public view. | Anyone | Success stories, reputation signals |
| `FULL_PUBLIC` | Complete record disclosed. | Anyone | Rare; legal, defense, public interest |

### Tier Ordering (Monotonic)

```
PRIVATE < WITNESSED < PUBLIC_SUMMARY < FULL_PUBLIC
```

**Critical rule:** Visibility can only increase. A filament that has been made `WITNESSED` cannot revert to `PRIVATE`. A filament disclosed as `PUBLIC_SUMMARY` cannot be reduced to `WITNESSED`.

This is append-only disclosure. No retraction.

### Lifecycle × Visibility Default Matrix

| Lifecycle State | Default Visibility | Max Allowed Without Vote | Requires Vote to Exceed |
|-----------------|-------------------|--------------------------|------------------------|
| OPEN | PRIVATE | PRIVATE | Yes (any increase) |
| ACTIVE | PRIVATE | WITNESSED | Yes (PUBLIC_SUMMARY+) |
| SETTLING | WITNESSED | WITNESSED | Yes (PUBLIC_SUMMARY+) |
| CLOSED | PUBLIC_SUMMARY | PUBLIC_SUMMARY | Yes (FULL_PUBLIC) |
| ARCHIVED | PUBLIC_SUMMARY | PUBLIC_SUMMARY | Yes (FULL_PUBLIC) |
| REFUSAL | WITNESSED | WITNESSED | Yes (PUBLIC_SUMMARY+) |

**Reading this table:**
- When a filament transitions to SETTLING, its default visibility auto-upgrades to WITNESSED (if currently PRIVATE).
- When CLOSED, default auto-upgrades to PUBLIC_SUMMARY.
- No auto-upgrade beyond the default — higher tiers require explicit action.
- Vote requirement means `branch.voteStatus === 'PASSED'` for the governing branch.

---

## Functional Requirements

### 1. Disclosure Transition Function

`transitionVisibility(filamentId, newTier, reason, evidencePointers?)`

Rules:
- **Monotonic only**: newTier must be strictly greater than current visibilityScope. If not, emit refusal.
- **Governance check**: if newTier exceeds the "Max Allowed Without Vote" for the current lifecycle state, `branch.voteStatus` must be `PASSED`. Otherwise emit refusal.
- **Append evidence**: if evidencePointers provided, append to `filament.evidencePointers[]` (never replace).
- **Record event**: update `filament.visibilityScope`, `filament.updatedAt`.
- **Timebox event**: call `appendTimeboxEvent(trunkNode, { type: 'DISCLOSURE_CHANGE', filamentId, from, to, reason })`.

Required logs:

```
[DISCLOSURE] id=<filamentId> from=<oldTier> to=<newTier> reason=<reason> result=PASS
```

On refusal (downgrade attempt):
```
[REFUSAL] reason=DISCLOSURE_DOWNGRADE_BLOCKED filament=<id> attempted=<tier>
```

On refusal (governance required):
```
[REFUSAL] reason=DISCLOSURE_REQUIRES_VOTE filament=<id> attempted=<tier> voteStatus=<status>
```

### 2. Auto-Upgrade on Lifecycle Transition

When `transitionLifecycleState()` fires (existing function in FILAMENT-LIFECYCLE-1):
- After the lifecycle transition succeeds, check the default visibility for the new state.
- If `filament.visibilityScope` is below the new default, auto-upgrade to the default.
- Log the auto-upgrade as a disclosure transition with `reason=lifecycle_default`.

```
[DISCLOSURE] id=<id> from=PRIVATE to=WITNESSED reason=lifecycle_default result=PASS
```

This ensures:
- SETTLING filaments are at least WITNESSED.
- CLOSED/ARCHIVED filaments are at least PUBLIC_SUMMARY.
- No explicit action needed for natural disclosure progression.

### 3. Counter-Disclosure (Additive Evidence Release)

When a filament's visibility is increased by one party, the other party may:
- Increase visibility further (same monotonic rule)
- Attach additional evidence (always additive)

This is implemented by calling `transitionVisibility()` with the higher tier and new evidence pointers.

There is no "counter-disclosure" as a separate function. It uses the same transition path. The key constraint is:
- Previous evidence cannot be removed (`evidencePointers` is append-only).
- The new tier must be >= current tier.

Required log when evidence is added:
```
[DISCLOSURE] evidenceAppended id=<id> count=<total> result=PASS
```

### 4. Persistence (Demo)

Same pattern as Phase 6 vote persistence:
- On any disclosure change, persist the full filament registry to localStorage.
- Key: `RELAY_FILAMENT_DISCLOSURE_STORE_V0`
- On boot, restore visibility scopes from stored state.

Required logs:
```
[DISCLOSURE] persist backend=localStorage stored=<n> result=PASS
[DISCLOSURE] restore backend=localStorage loaded=<n> result=PASS
```

### 5. HUD Visibility Indicator

In the HUD (Tier 1 or Tier 2), when a filament is selected or focused:
- Show a small visibility glyph next to the filament info.
- Glyph encoding:

| Tier | Glyph | Color |
|------|-------|-------|
| PRIVATE | Lock icon or `[P]` | Grey |
| WITNESSED | Eye icon or `[W]` | Amber |
| PUBLIC_SUMMARY | Summary icon or `[S]` | Cyan |
| FULL_PUBLIC | Globe icon or `[F]` | White |

- When no filament is focused, do not show the glyph.
- The glyph must not increase HUD Tier 1 row count beyond 6 (append to existing row or place in Tier 2).

Required log (once per update):
```
[HUD] disclosureGlyph tier=<PRIVATE|WITNESSED|PUBLIC_SUMMARY|FULL_PUBLIC> result=PASS
```

### 6. Marker Visual Overlay

In `filament-renderer.js`, the existing filament marker (from FILAMENT-LIFECYCLE-1) should show a subtle ring outline indicating visibility tier:

| Tier | Outline |
|------|---------|
| PRIVATE | No outline (solid fill only, as before) |
| WITNESSED | Thin amber ring |
| PUBLIC_SUMMARY | Thin cyan ring |
| FULL_PUBLIC | Thin white ring |

This is a visual overlay only. No topology change. No new entity — modify the existing `filament-marker-<id>` entity.

Required log (once per render):
```
[DISCLOSURE] markersRendered count=<n> tiers={PRIVATE:<n>,WITNESSED:<n>,PUBLIC_SUMMARY:<n>,FULL_PUBLIC:<n>}
```

### 7. Demo Disclosure Transitions

On boot (launch profile), after filament registry initialization:
- Auto-upgrade FIL-003 (SETTLING) to WITNESSED (lifecycle default).
- Auto-upgrade FIL-004 (CLOSED) to PUBLIC_SUMMARY (lifecycle default).
- Leave FIL-001 (OPEN) and FIL-002 (ACTIVE) at PRIVATE.
- FIL-005 (ARCHIVED) auto-upgrades to PUBLIC_SUMMARY.
- FIL-006 (REFUSAL) auto-upgrades to WITNESSED.

Provide a "Simulate Disclosure" button (launch-only, next to existing Simulate Event and Simulate Vote):
- On click: upgrade FIL-001 from PRIVATE to WITNESSED with reason `demo_manual` and one evidence pointer.
- This tests the manual disclosure path and the monotonic constraint.

---

## Proof Script

`scripts/filament-disclosure-proof.mjs`

### Stages

1. **Boot + Restore** — confirm `[DISCLOSURE] restore backend=localStorage loaded=<n> result=PASS`
2. **Auto-upgrade on lifecycle** — confirm `[DISCLOSURE] id=FIL-003 from=PRIVATE to=WITNESSED reason=lifecycle_default result=PASS` (and FIL-004, FIL-005, FIL-006 similarly)
3. **Manual disclosure** — trigger Simulate Disclosure button → confirm `[DISCLOSURE] id=FIL-001 from=PRIVATE to=WITNESSED reason=demo_manual result=PASS` and `[DISCLOSURE] evidenceAppended id=FIL-001 count=1 result=PASS`
4. **Downgrade refusal** — attempt `transitionVisibility('FIL-001', 'PRIVATE', 'test')` → confirm `[REFUSAL] reason=DISCLOSURE_DOWNGRADE_BLOCKED filament=FIL-001 attempted=PRIVATE`
5. **Governance gating** — attempt `transitionVisibility('FIL-001', 'FULL_PUBLIC', 'test')` without vote PASS → confirm `[REFUSAL] reason=DISCLOSURE_REQUIRES_VOTE filament=FIL-001 attempted=FULL_PUBLIC`
6. **Persistence** — confirm `[DISCLOSURE] persist backend=localStorage stored=<n> result=PASS`, reload page, confirm restore loads correct tiers
7. **Marker overlay** — confirm `[DISCLOSURE] markersRendered count=<n>` with correct tier distribution
8. **Gate** — `[DISCLOSURE-PROOF] gate-summary result=PASS stages=8/8`

### Artifacts

- `archive/proofs/filament-disclosure-console-YYYY-MM-DD.log`
- `archive/proofs/filament-disclosure-YYYY-MM-DD/01-boot.png` — markers with default tiers
- `archive/proofs/filament-disclosure-YYYY-MM-DD/02-after-disclosure.png` — markers after manual disclosure
- `archive/proofs/filament-disclosure-YYYY-MM-DD/03-refusal.png` — downgrade refusal in console

---

## Acceptance Criteria

PASS only if:

- All 8 proof stages pass
- Visibility transitions are monotonic (no downgrades succeed)
- Lifecycle auto-upgrade fires correctly for SETTLING/CLOSED/ARCHIVED/REFUSAL defaults
- Governance gating blocks PUBLIC_SUMMARY+ when branch.voteStatus is not PASSED
- Evidence pointers are append-only (never removed or replaced)
- Persistence survives page reload
- HUD glyph shows correct tier without exceeding 6 Tier 1 rows
- Marker overlays visually distinguish tiers
- Timebox events are generated for each disclosure change
- No lifecycle/closure/turnover/band-snap regressions
- No LOD/focus/FreeFly regressions
- FPS still works
- HUD still correct (consolidated, 6 rows, Tier 2 collapsed)
