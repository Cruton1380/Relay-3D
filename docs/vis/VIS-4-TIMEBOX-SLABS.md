# VIS-4: Timebox Slabs

**Status:** VIS-4a CLOSED. VIS-4c CLOSED. VIS-4d CLOSED.

---

## VIS-4a — Timebox Slabs (History Pucks)

### 1. Goal

Make timeboxes visible as "history slabs" that read as time segmentation at COMPANY and SHEET, carry meaning (commit ranges + quality signals), and are deterministic, budget-capped, and reversible.

### 2. Scope Rules

| LOD | Behavior |
|---|---|
| COMPANY (collapsed) | Trunk + department branch slab stacks. Uses `node.commits[]` data. |
| SHEET (selected sheet expanded) | Selected sheet slab stack only (from parent branch commits). Sits behind the sheet plane along `timeDir`. |
| CELL | No new slab geometry (existing cell-level timebox segments unchanged). |

### 3. Data Contract (read-only)

Uses existing `node.commits[]` array on trunk/branch nodes:

```
{ timeboxId, commitCount, openDrifts, eriAvg, scarCount }
```

For sheets: uses the parent branch's `commits[]` (sheets do not have their own commits array).

No new data models. No mutation.

### 4. Visual Contract

A slab is a thin rectangular puck (BoxGeometry):

| Property | Value |
|---|---|
| Thickness (T) | 2m (constant) |
| Trunk slab | 40m x 40m |
| Branch slab | 28m x 28m |
| Sheet slab | 18m x 18m |
| Spacing | 4m gap between slabs along time axis |
| Placement | Centered on node position, stacked along time axis |

Color encoding (deterministic):
- Base: neutral gray (`#607d8b`, alpha 0.35)
- Scar overlay: red tint proportional to `scarCount` (up to `#f44336` at 3+ scars)
- Confidence: brightness proportional to `eriAvg` (0-100 scale)

No gradients. No animation in VIS-4a.

### 5. Rendering Rules

- Slabs render only when parent object is rendered (respects VIS-2/3 gating)
- Slabs must not change LOD decisions
- Slabs must not depend on buildings/terrain

### 6. Budget Caps (hard)

- `maxSlabsPerObject = 12`
- `maxTotalSlabsFrame = 120`
- Truncation: **most recent** (latest-first) — keeps the most recent N slabs

If exceeded, emit:
```
[VIS4] slabBudget capped=true requested=<n> rendered=<m> reason=MAX_TOTAL_SLABS
```

### 7. Logging Contract

Emit once per signature change:

```
[VIS4] slabsRendered scope=<company|sheet> objects=<n> slabs=<n> capped=<true|false>
[VIS4] companySlabs result=PASS deptBranches=<n> trunkSlabs=<n>
[VIS4] sheetSlabs result=PASS sheet=<id> slabs=<n>
[VIS4] gate-summary result=PASS
```

### 8. Proof Script

`scripts/vis4-timebox-slabs-proof.mjs`:
1. Boot world, fly to COMPANY
2. Confirm company slabs appear
3. Enter `P2P.ThreeWayMatch`
4. Confirm sheet slabs appear
5. Exit sheet, confirm back to company slabs

Artifact: `archive/proofs/vis4-timebox-slabs-console-<date>.log`

### 9. Non-Goals

- No rewriting timebox generation
- No per-cell cube history changes
- No governance/ledger semantics
- No user presence, no flow changes

---

## VIS-4c — Slab Labels + Hover Inspect

### 1. Scope

Adds labels and hover/click-to-pin inspection to VIS-4a slabs. No changes to truncation, timebox generation, or per-cell behavior.

### 2. Visual Contract

**Slab labels (always-on):** Small label above each slab: `T=<id> C=<commitCount> S=<scars> E=<eri>`

**Hover inspect:** Mouse over slab → highlight slab (brighter) + HUD shows expanded details.

**Click-to-pin:** Click slab toggles pinned inspect; moving away doesn't clear HUD while pinned.

### 3. IDs

Format: `vis4-slab-<scope>-<ownerId>-<timeboxId>` where scope is `company` or `sheet`.

### 4. Logging

```
[VIS4c] labelsRendered count=<n> scope=<company|sheet>
[VIS4c] hover slab=<id> timebox=<timeboxId> owner=<ownerId>
[VIS4c] hoverClear
[VIS4c] pin slab=<id> pinned=<true|false>
[VIS4c] gate-summary result=PASS
```

### 5. Budget

Labels: max 150 per frame. Hover: max 2 additional primitives.

### 6. Proof Script

`scripts/vis4c-timebox-slab-inspect-proof.mjs`

### 7. Non-Goals

No new slab geometry, no timebox generation changes, no per-cell history.

---

## VIS-4d — Timebox Slab Focus (Camera + Context Lock)

### 1. Scope

Adds focus navigation to existing slabs. No timebox/commit/ERI/scar/geometry changes. Only: camera focus, contextual fade, HUD enrichment.

### 2. User Actions

**A) Click slab (unpinned):** Focus camera on slab owner (trunk or branch). Smooth fly-to. Non-owner slabs fade (opacity reduced). Log: `[VIS4D] focusOwner result=PASS owner=<id> scope=<scope>`

**B) Click slab again (while focused):** Zoom closer to slab stack center, align to time axis. Log: `[VIS4D] focusSlabStack result=PASS owner=<id> timeboxId=<id>`

**C) Escape:** Restore previous camera view, clear fade, clear highlight. Log: `[VIS4D] focusClear result=PASS`

### 3. Rendering Rules

Focused: non-owner slabs fade (opacity reduced). Owner slabs full brightness. Labels remain. No slab regeneration, no count changes, no truncation changes.

### 4. Camera Rules

Use existing camera flyTo. Preserve LOD. No expandedSheetsAllowed changes. No implicit sheet enter/exit.

### 5. Budget

No new slab primitives. Max +2 temporary highlight primitives. Fade is in-place color change (no new geometry).

### 6. Logging

```
[VIS4D] focusOwner result=PASS owner=<id> scope=<scope>
[VIS4D] focusSlabStack result=PASS owner=<id> timeboxId=<id>
[VIS4D] focusClear result=PASS
[VIS4D] gate-summary result=PASS
```

### 7. Proof Script

`scripts/vis4d-slab-focus-proof.mjs`

### 8. Non-Goals

No sheet-level commit grouping, no cross-timebox diffing, no animation, no mutation, no KPI coupling.
