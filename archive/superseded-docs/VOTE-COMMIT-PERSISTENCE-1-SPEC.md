# VOTE-COMMIT-PERSISTENCE-1 (Phase 6) — Spec

## Goal

Make governance decisions persist and drive canon-visible state:

- lifecycle-runner drives COMMIT vs REFUSAL outcomes
- vote outcomes are persisted (demo backend: localStorage)
- branch voteStatus transitions update globe visibility filtering (Phase 2)
- failures create visible scars (not hidden)
- HUD shows vote summary at company focus and globe view

This is Phase 6 and must build on the existing spine proven in Phase 5.

---

## Scope

### Allowed files

- `core/models/governance/lifecycle-runner.js` (wire outcome → commit state)
- `app/ui/voting-ui-manager.js` (persist + restore vote outcomes; emit logs)
- `relay-cesium-world.html` (wiring: apply voteStatus to branch nodes; demo topics)
- `app/renderers/filament-renderer.js` (visual scar overlay only; no topology changes)
- `scripts/vote-commit-proof.mjs` (new)
- `archive/proofs/*` (artifacts)
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `docs/process/ACTIVE-SLICE.md`, `docs/process/SLICE-REGISTER.md`
- `HANDOFF.md` (one structural line only, optional)

### Forbidden

- No new voting engine / no parallel governance system
- No ENU math changes
- No LOD threshold changes
- No canopy layout changes
- No FreeFly/input changes
- No changes to the canonical data path of Phase 5 (route→fact→match→summary→kpi)
- No server/network persistence in this slice (demo persistence only)

---

## Definitions

### VoteStatus (branch-level)

Allowed values: **PASSED**, **PENDING**, **REJECTED**, **NONE**.

**Globe filter integration:**

- At LOD <= REGION, only branches with `voteStatus === 'PASSED'` are visible.
- At LOD = COMPANY, all branches render regardless of voteStatus.

(This must remain true and be re-proven.)

### Persistence backend (demo)

- **localStorage only**
- key namespace must be explicit, versioned: **RELAY_VOTE_STORE_V0**

---

## Required behaviors

### 1) Lifecycle outcome → branch voteStatus

When a vote window closes:

- PASS → voteStatus = PASSED
- FAIL/VETO/REFUSAL → voteStatus = REJECTED
- In-progress → voteStatus = PENDING

**Required log (always):**

`[VOTE] decision branch=<id> result=<PASSED|REJECTED|PENDING> lifecycle=<COMMIT|REFUSAL|VOTE_WINDOW> quorum=<pct>`

### 2) Persist vote outcomes (demo)

On any vote decision change: write to localStorage. On boot: restore state.

**Required logs:**

- `[VOTE] persist backend=localStorage mode=demo stored=<n> result=PASS`
- `[VOTE] restore backend=localStorage mode=demo loaded=<n> result=PASS`

### 3) Globe visibility changes

When a branch moves to PASSED/REJECTED: Phase 2 vote filter must reflect it on PLANETARY/REGION.

**Required log:**

`[VIS] voteFilter LOD=PLANETARY visible=<n> hidden=<n>`

(and an explicit proof stage validates the delta after vote decision)

### 4) Visible scar on REJECTED

A rejected branch must show a visible mark. Allowed implementations (overlay only): ring segment tint, small scar glyph near branch hub, slab tint bump (if consistent).

**Required log:**

`[SCAR] applied branch=<id> reason=voteRejected result=PASS`

### 5) HUD vote summary line

At COMPANY focus, Tier 1 shows: **Votes: &lt;passed&gt; PASSED / &lt;pending&gt; PENDING / &lt;rejected&gt; REJECTED**

**Required log:**

`[HUD] votes summary=PASS passed=<n> pending=<n> rejected=<n>`

---

## Proof requirements

Create: **scripts/vote-commit-proof.mjs**

### Proof stages (deterministic, headless)

1. **Boot launch** — assert `[VOTE] restore ... result=PASS`
2. **Focus company** (use existing focusCompanyOverview) — assert HUD vote summary log is present
3. **Simulate a governance decision deterministically (demo)** — choose one branch (e.g. branch.finance) and set to PASSED; choose another (e.g. branch.maintenance) and set to REJECTED. Use the same lifecycle-runner path you wired (no direct assignment unless it goes through the same decision handler). Assert logs: `[VOTE] decision ...`, `[VOTE] persist ...`, `[SCAR] applied ...` for rejected branch
4. **Return to PLANETARY/REGION view** — assert vote filtering reflects new status: `[VIS] voteFilter ...` visible/hidden changes as expected
5. **Reload page** — assert restore works: `[VOTE] restore loaded=<n> result=PASS`; statuses persist across reload
6. **Gate summary:** `[VOTE-PROOF] gate-summary result=PASS stages=6/6`

### Proof artifacts

- `archive/proofs/vote-commit-console-YYYY-MM-DD.log`
- `archive/proofs/vote-commit-YYYY-MM-DD/01-company.png`
- `archive/proofs/vote-commit-YYYY-MM-DD/02-globe-filter.png`
- `archive/proofs/vote-commit-YYYY-MM-DD/03-reload-restored.png`

Update: **PROOF-INDEX.md**, **RESTORATION-INDEX.md** (new entry, Phase 6).

---

## Acceptance criteria (PASS only if all true)

- lifecycle-runner drives status transitions (no bypass)
- vote outcomes persist to localStorage and restore on boot
- globe visibility filter responds to PASSED/REJECTED
- rejected branch shows a visible scar overlay
- HUD displays correct counts
- no regressions in FreeFly, focus lock, canopy, rings, basin rings, Phase 5 flow

---

## Slice registration requirements

**Before coding:**

- ACTIVE-SLICE.md created for VOTE-COMMIT-PERSISTENCE-1 (PROPOSE)
- SLICE-REGISTER.md row added
- PROOF-INDEX.md stub (Pending)

**After PASS:**

- update indexes + set COMMIT/PASS.
