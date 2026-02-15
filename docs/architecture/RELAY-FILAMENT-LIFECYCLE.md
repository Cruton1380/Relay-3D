# RELAY Filament Lifecycle Model

**Status:** CONTRACT  
**Effective:** 2026-02-15  
**Scope:** Defines the operational lifecycle that makes trunk→branch→sheet coherent over timeboxes.  
**Prerequisite:** Phase 5 spine (rendering → navigation → governance filtering → ingestion → recompute → visual history) proven.

---

## 1) What a Filament Is

A filament is one relationship (order, request, PO, incident, ticket, case, engagement, delivery) that has:

- **Start anchor**: where it is initiated (usually a branch endpoint or sheet row/cell)
- **Path inward**: department → trunk ledger
- **State machine**: open → settling → closed
- **Timebox history**: events chunked into time windows
- **Outcome**: COMMIT to ledger, or REFUSAL/closed-without-commit

**Key rule:** every "open thing" must be represented by a filament, and every filament must have a closure path.

---

## 2) Two State Machines (Do Not Mix)

### A) Work State (Commit Materiality)

Governance of change:

- **DRAFT**: private, undo silently
- **HOLD**: paused, not progressing
- **PROPOSE**: visible proposal, awaiting consent/vote
- **COMMIT**: canonical, append-only history
- **REVERT**: visible corrective commit

### B) Filament Lifecycle State (Business Reality)

The relationship itself:

- **OPEN**: created, not yet accepted/confirmed
- **ACTIVE**: work is underway, obligations exist
- **SETTLING**: nearing reconciliation (invoice/payment/verification stage)
- **CLOSED**: resolved (success or not)
- **ARCHIVED**: absorbed into trunk history view
- **REFUSAL**: explicitly rejected or failed to meet criteria

These are distinct. A filament can be ACTIVE while its edits are in DRAFT/PROPOSE, and it becomes canon through COMMIT at boundaries.

---

## 3) The Core Invariant: Every Filament Has a Trunk Path

```
Sheet Cell/Row (detail)
→ Sheet Platform (overview proxy)
→ Department Branch (owner)
→ Trunk Ledger Spine (reconciliation)
→ Trunk History (archived slabs)
```

That is the mechanical spine that makes the graphics coherent.

---

## 4) Timeboxes: The Bridge Between "Now" and "History"

Timeboxes are the unit of continuity. A filament always has:

- **Current timebox**: active work window
- **Past timeboxes**: history slabs

**Rule:** no infinite streaming. Every 1–7 days (configurable), close a timebox with a commit boundary:

- Summarize what changed
- Update metrics (pressure / vote energy / state quality)
- Decide next actions

This is how millions of filaments become scalable: render current timebox summaries at high LOD and expand by focus.

---

## 5) Operational Work Lifecycle

### Step 0 — Select Scope

Choose a node to work inside:

- Globe → basin (site) → company → department → sheet
- Or: personal inbox of open filaments across companies (relationship view)

HUD shows: Profile, Mode, Focus Path, LOD, Data Status, World/Votes.

### Step 1 — Create a Filament (OPEN)

Created from a material boundary action (customer request, PO initiated, invoice dispute, incident reported, delivery scheduled).

Create event must record:

- `filamentId` (stable)
- `parties` (who can see it)
- `ownerBranch` (department)
- `referencedSheetRow` (detail pointer)
- `initialState`: OPEN
- `initialTimeboxId`

Visually: new thread at the outer edge (sheet platform / branch tip). Clearly "not yet reconciled" — hasn't moved inward.

### Step 2 — Work Inside the Filament (ACTIVE)

All work is appended as events: status updates, attachments, messages, decisions, line-item edits on sheets.

Inside a timebox you can: update spreadsheet cells, run route recompute, attach evidence, propose changes.

- In DRAFT: experiment
- At boundary: PROPOSE or COMMIT

### Step 3 — Timebox Boundary Commit (Material Snapshot)

At end of timebox (or when crossing a threshold), create a commit snapshot:

- What changed (diff summary)
- Which sheets/rows were touched
- Updated filament state (still ACTIVE? moved to SETTLING?)
- Updated metrics: pressure, vote energy, state quality, ERI

Visually: filament gains a new slab segment; thickness and color update; history becomes visible and structured.

### Step 4 — Move Inward as It Settles (SETTLING)

A filament "moves inward" when it reaches reconciliation criteria (goods delivered, invoice issued, acceptance confirmed, verification completed).

Mechanically: anchor point shifts from sheet-edge → branch-lane → trunk-spine. By state transition, not animation.

- Open work stays out on canopy platforms
- Settling work shifts toward branch spine
- Trunk shows "nearly reconciled"

### Step 5 — Reconcile Into Trunk Ledger (CLOSED → ARCHIVED)

When the relationship is resolved:

- Create a CLOSE commit
- Write ledger entry (canonical record)
- Mark outcome: CLOSED (success) or REFUSAL
- Archive

Visually: active filament disappears from open canopy; final segment becomes part of trunk history (thickening / archive slab). Filter by time to see history without clutter.

### Step 6 — Non-Completion Path (REFUSAL)

If something ends without completion:

- Does not vanish
- Closed with explicit REFUSAL outcome
- Archived with a scar indicator (visible, not hidden)

Preserves deterrence and prevents silent disappearance.

---

## 6) Multi-User Cooperation

- Users make proposals (PROPOSE) on filaments they can see
- Nothing becomes canonical until consent/vote thresholds are met (COMMIT)
- Conflicting claims remain visible as parallel proposals until resolved

Applies to: company/site ownership, relationship filaments, data corrections, routing changes.

---

## 7) LOD Scaling

### Planetary / Region

Show only: trunks, vote-qualified branches, aggregate ring metrics (pressure/vote/state).
Do not show: individual filaments, sheet grids.

### Company

Show: 5–8 branches, 20+ platforms (canopy), only top-level filament summaries (counts, density, recent activity).

### Sheet

Show: selected sheet truth plane, timebox slabs for that branch, filaments connected to that sheet (relevant subset only).

### Cell

Show: cell-level history markers only for selected timebox or selected filament. Never "all cell commits everywhere" at once.

This is the just-in-time detail model.

---

## 8) Implementation Roadmap

To make this real, the next module is **FILAMENT-LIFECYCLE-1**:

- Define filament object contract (id, parties, ownerBranch, state, timeboxes, references)
- Define OPEN→ACTIVE→SETTLING→CLOSED/REFUSAL transitions
- Define "inward movement" mapping (edge→branch→trunk)
- Enforce closure requirements (every filament must close)
- Render state-dependent placement consistently

---

## 9) Compatibility

This model does not replace:

- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` (15 frozen contracts)
- `docs/architecture/RELAY-RENDER-CONTRACT.md` (rendering invariants)
- `docs/architecture/RELAY-NODE-RING-GRAMMAR.md` (ring semantics)
- Phase 5 canonical data path (route→fact→match→summary→kpi→timebox→motion)

It extends and organizes them under a single coherent lifecycle.
