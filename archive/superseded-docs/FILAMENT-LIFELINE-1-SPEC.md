# FILAMENT-LIFELINE-1 Slice Contract

**Slice ID:** FILAMENT-LIFELINE-1  
**Status:** DRAFT  
**Created:** 2026-02-16  
**Baseline:** bd2018c (post-VIS-GRAMMAR-POLISH-1)

---

## Goal

Add an ambient, always-visible (when LOD allows) filament "lifeline" geometry that renders each filament as a single continuous polyline:

**Cell origin → timebox slab centers (in order) → spine → branch endpoint → trunk absorption**

This is **not**:
- Filament rain (presentation aesthetic)
- Markers only (lifecycle-positioned dots)
- Ride overlay only (CAM0.4.2 navigation)

It is a **distinct render primitive** that makes end-to-end filaments legible as continuous vertical paths through the system.

---

## Non-Negotiable Constraints

1. **No canopy behavior changes** — LAUNCH_CANOPY presentation mode remains unchanged
2. **No lifecycle/disclosure/vote/crypto/replay/presence logic changes** — data model untouched
3. **No new schema or persistence** — uses existing `relayState.filaments` and renderer state
4. **No hub shortcuts** — lifeline must follow canonical staged path (cell → timeboxes → spine → branch → trunk)
5. **Budget-gated** — lifelines render only when LOD allows (SHEET/CELL; `sheetsDetailed > 0`)
6. **Deterministic** — same state produces identical lifeline vertices and logs

---

## Allowed Files

### Modify
- `app/renderers/filament-renderer.js` — add path builder + polyline primitives + cleanup
- `relay-cesium-world.html` — wire toggles/flags only if needed; no new state machines
- `scripts/filament-lifeline-1-proof.mjs` (NEW)
- `archive/proofs/filament-lifeline-1-*` (console log, screenshots)
- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/FILAMENT-LIFELINE-1-SPEC.md` (this contract)
- `docs/process/ACTIVE-SLICE.md`
- `docs/process/SLICE-REGISTER.md`
- `docs/restoration/RESTORATION-INDEX.md`
- `HANDOFF.md`

### Forbidden
- Any modification under `core/models/crypto/*`
- Any modification to E3 replay engine
- Any changes to Presence stack (PRESENCE-STREAM-1, PRESENCE-RENDER-1, PRESENCE-COMMIT-BOUNDARY-1)
- Any changes to LAUNCH_CANOPY render layout
- Any topology contract changes (cell → lane → spine → branch)

---

## Visibility Contract (Mode/LOD)

### When Lifelines Render

- **RenderMode:** `TREE_SCAFFOLD` only
- **LOD:** `SHEET` and `CELL` only
- **Condition:** `sheetsDetailed > 0` AND `expandedSheetsAllowed === true`

### Never Render Lifelines In

- `LAUNCH_CANOPY + COMPANY` (collapsed overview)
- `MEGASHEET` mode (tiles only)
- Any view where `suppressSheetDetail === true`

This matches the system's LOD compression philosophy: full geometry detail only when zoomed into sheet scope.

---

## Geometry Contract (v0)

### Path Vertices Per Filament (Ordered)

1. **Cell origin** — Deterministic cell anchor position (sheet plane cell origin or sheet anchor cell)
2. **Timebox stops** — Centers pulled from `_vis4SlabRegistry` in timebox order (T0, T1, T2, ...)
3. **Spine point** — Per-sheet spine anchor (existing spine position in renderer)
4. **Branch endpoint** — Existing branch endpoint (where sheets attach in scaffold mode)
5. **Trunk absorption** — Trunk timebox band attach point (existing trunk band / `appendTimeboxEvent` target position)

### Color (Lifecycle State)

Reuse existing lifecycle color mapping:

- **OPEN:** `#00BCD4` (cyan)
- **ACTIVE:** `#4CAF50` (green)
- **SETTLING:** `#FF9800` (amber)
- **CLOSED:** `#9E9E9E` (grey)
- **REFUSAL:** `#F44336` (red)

### Thickness (Attention-Driven)

```javascript
base = 0.5m
max = 2.0m
width = base + (max - base) * attention
```

If `attention` missing or `NaN`, default to `base`.

### Primitive Type

Use **Cesium PolylineCollection** with individual polylines per filament.

**Not** polyline volume (defer to v1 if tube effect needed).

---

## Data Sources

All existing, no new storage:

1. `relayState.filaments` — filament registry (id, sheetId, branchId, lifecycleState, disclosure, timeboxes)
2. `window._vis4SlabRegistry` — timebox slab positions (height-band layout)
3. Existing sheet/cell anchor positions (renderer state)
4. Existing branch endpoints and trunk absorption points (renderer state)

---

## Required Logs

### Eligibility (Each Render Pass)

```
[FILAMENT-LIFELINE] eligible=true mode=TREE_SCAFFOLD lod=<SHEET|CELL> sheetsDetailed=<n>
```

### Build Summary

```
[FILAMENT-LIFELINE] built count=<n> skipped=<n> reason=<budget|missingSlab|missingAnchor>
```

### Per-Filament (Debug/Proof Mode Only)

```
[FILAMENT-LIFELINE] filament=FIL-001 vertices=<n> timeboxes=<n> width=<m> color=<state> result=PASS
```

### Gate Summary (Proof Script)

```
[FILAMENT-LIFELINE-PROOF] gate-summary result=PASS stages=6/6
```

### Refusals (Explicit, No Silent Fallback)

```
[REFUSAL] reason=LIFELINE_MISSING_ANCHOR filament=<id> missing=<cell|spine|branch|trunk>
[REFUSAL] reason=LIFELINE_MISSING_SLAB filament=<id> timeboxId=<id>
```

---

## Proof Script

**File:** `scripts/filament-lifeline-1-proof.mjs`

**Stages:** 6

### Stage 1: Boot + Mode Set

- Navigate to `?profile=launch`
- Force `TREE_SCAFFOLD` mode (T key)
- Force `SHEET` or `CELL` LOD (enter a sheet with E key)
- **Pass criteria:** `[MODE] renderMode=TREE_SCAFFOLD` logged

### Stage 2: Budget Eligibility

- Assert `sheetsDetailed > 0`
- Assert `expandedSheetsAllowed === true`
- Assert eligibility log exists: `[FILAMENT-LIFELINE] eligible=true`
- **Pass criteria:** Budget conditions met, eligibility logged

### Stage 3: Lifeline Render

- Assert `[FILAMENT-LIFELINE] built count=<n>` where `n > 0`
- Assert per-filament built logs exist (at least 3 filaments)
- **Pass criteria:** Lifeline primitives rendered

### Stage 4: Geometry Sanity

- For one filament: verify vertices include:
  - Cell origin
  - At least 1 timebox position
  - Trunk position
- **Pass criteria:** Path completeness validated

### Stage 5: Lifecycle Styling

- For at least two filaments with different lifecycle states:
  - Verify different colors logged
  - Verify different widths logged (if attention differs)
- **Pass criteria:** Lifecycle styling applied correctly

### Stage 6: Regression Sweep

Re-run all prior proofs:
- `vis-tree-scaffold-proof.mjs` (7/7 PASS)
- `vis-megasheet-proof.mjs` (6/6 PASS)
- `cam042-filament-ride-v1-proof.mjs` (12/12 PASS)
- `presence-stream-1-proof.mjs` (7/7 PASS)
- `presence-render-1-proof.mjs` (10/10 PASS)
- `presence-commit-boundary-1-proof.mjs` (9/9 PASS)
- `headless-0-proof.mjs` (8/8 PASS)
- `e3-replay-1-proof.mjs` (9/9 PASS)
- `e1-crypto-1-proof.mjs` (9/9 PASS)

**Pass criteria:** All regressions remain PASS

---

## Artifacts

### Console Log
```
archive/proofs/filament-lifeline-1-console-YYYY-MM-DD.log
```

### Screenshots
1. **Scaffold + CELL view** showing visible lifelines (full tree with filament paths)
2. **Close-up** of one filament showing timebox stops + trunk connection
3. **Lifecycle comparison** (two filaments with different colors/widths)

---

## HUD / Controls (Optional, v0)

**No new HUD panels required.**

**Optional toggle** (only if performance impact warrants):

- **L key:** Lifeline visibility on/off (default ON when eligible)

If implemented, must log:
```
[VIS] lifelineToggle enabled=<true|false>
```

---

## Acceptance Criteria

**PASS if and only if:**

1. Lifelines render **only** in `TREE_SCAFFOLD + SHEET/CELL`
2. Lifeline count matches active filaments (minus explicit logged skips)
3. No visual overlaps/chaos introduced
4. All regressions remain **PASS**
5. Proof stages **6/6 PASS** with complete artifacts
6. Required logs present in console output

---

## Implementation Guidance

### Path Builder (Suggested Function)

```javascript
// In app/renderers/filament-renderer.js
buildFilamentLifelinePath(filament, sheet, branch, trunk) {
    const vertices = [];
    
    // 1. Cell origin (sheet anchor or first cell position)
    const cellOrigin = this.getCellOrigin(sheet, filament);
    if (!cellOrigin) {
        console.log(`[REFUSAL] reason=LIFELINE_MISSING_ANCHOR filament=${filament.id} missing=cell`);
        return null;
    }
    vertices.push(cellOrigin);
    
    // 2. Timebox stops (from _vis4SlabRegistry)
    const timeboxes = filament.timeboxes || [];
    for (const tbId of timeboxes) {
        const slabCenter = this.getTimeboxSlabCenter(tbId);
        if (!slabCenter) {
            console.log(`[REFUSAL] reason=LIFELINE_MISSING_SLAB filament=${filament.id} timeboxId=${tbId}`);
            continue; // Skip missing slabs, log refusal
        }
        vertices.push(slabCenter);
    }
    
    // 3. Spine point
    const spinePoint = this.getSheetSpinePoint(sheet);
    if (!spinePoint) {
        console.log(`[REFUSAL] reason=LIFELINE_MISSING_ANCHOR filament=${filament.id} missing=spine`);
        return null;
    }
    vertices.push(spinePoint);
    
    // 4. Branch endpoint
    const branchEnd = this.getBranchEndpoint(branch);
    if (!branchEnd) {
        console.log(`[REFUSAL] reason=LIFELINE_MISSING_ANCHOR filament=${filament.id} missing=branch`);
        return null;
    }
    vertices.push(branchEnd);
    
    // 5. Trunk absorption
    const trunkPoint = this.getTrunkAbsorptionPoint(trunk, filament);
    if (!trunkPoint) {
        console.log(`[REFUSAL] reason=LIFELINE_MISSING_ANCHOR filament=${filament.id} missing=trunk`);
        return null;
    }
    vertices.push(trunkPoint);
    
    return vertices;
}
```

### Render Integration (Suggested Location)

In `renderTree()` method, after sheet detail check:

```javascript
// After VIS-2 sheet detail logic
if (this._scaffoldMode && sheetsDetailed > 0 && expandedSheetsAllowed) {
    console.log(`[FILAMENT-LIFELINE] eligible=true mode=TREE_SCAFFOLD lod=${lodLevel} sheetsDetailed=${sheetsDetailed}`);
    this.renderFilamentLifelines(sheetsToRender);
}
```

---

## Next Steps (Governance Updates Required)

When slice completes:

1. **ACTIVE-SLICE.md** → Update to `FILAMENT-LIFELINE-1` (PROPOSE → COMMIT)
2. **SLICE-REGISTER.md** → Add new row with proof log path and result
3. **RESTORATION-INDEX.md** → Add FILAMENT-LIFELINE-1 as "Implemented"
4. **PROOF-INDEX.md** → Add proof entry with artifacts
5. **HANDOFF.md** → Update "Recent Completion" section

---

## Answer to Canon's Question

**Yes — draft it now.**

This is the correct next slice. It adds the missing primitive that will make "end-to-end filament" visible without requiring ride mode.

**Note for future:** After FILAMENT-LIFELINE-1 passes, we can optionally add a new proof stage to the flyby (v1-dev-onboarding-flyby.mjs) that explicitly switches to TREE_SCAFFOLD + CELL and shows lifelines — but only after this slice is green.

---

## Blocked By

None — VIS-GRAMMAR-POLISH-1 is complete (COMMIT/PASS).

## Blocks

DEMO-FLYBY-POLISH-1 (queued, camera choreography) — does not require FILAMENT-LIFELINE-1, can proceed in parallel if desired.

---

**End of Contract**
