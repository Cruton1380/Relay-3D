# VIS-3: Flow Lens

**Status:** VIS-3.1a in progress.  
**Principle:** No new engine logic — only render what already exists (routes + matches + exceptions).

---

## VIS-3.1a — Flow Lens (COMPANY Overlay)

### 1. Scope

VIS-3.1a adds a read-only flow signal at COMPANY LOD when VIS-2 compression is active.

It must:
- Operate only when `normalizedLod === 'COMPANY'` and `expandedSheetsAllowed === false`
- Use existing data only: `tree.edges`, existing match-sheet exception state (`status !== 'MATCH'`)
- Not modify: ledger, topology, governance, routing logic, ENU math

This is a presentation overlay only.

### 2. Visual Contract (COMPANY LOD)

When at COMPANY and collapsed:

**Already present (from VIS-2):** trunk, department spines (yellow emphasis), 20 sheet tiles, timeboxes, no sheet planes, no cell lanes.

**What VIS-3.1a adds:**

For each trunk-direct department branch, render one **traffic bar** element attached to that department spine:

| Property | Value |
|---|---|
| Position | Branch midpoint, slight +U offset (8m) above branch to avoid z-fighting |
| Orientation | Parallel to branch direction (tangent) |
| Length | Proportional to `edgesCount` (clamped to 20–400m range) |
| Height | Constant (4m) |
| Color | Green (`#4caf50`, alpha 0.7) |

**Exception indicator:** If `exceptionsCount > 0`, render a second red segment (`#f44336`, alpha 0.8) overlaid from the bar start. Length proportional to exceptions vs total edges. Must not exceed total bar length.

No per-sheet detail. No per-cell detail. No individual route polylines.

### 3. Data Contract

**Global totals** (existing): `computeFlowOverlayCounts(tree)` → `{ edges, exceptions }`

**Per-department distribution** (new): `computeFlowOverlayByDept(tree, deptBranches)` → `Map<branchId, { edges, exceptions }>`

Distribution rule:
- `edgesPerDept` = count of tree edges whose source or target is a descendant of that department branch
- `exceptionsPerDept` = count of match cells under descendant sheets of that branch where `status !== 'MATCH'`

No new data models introduced.

### 4. Logging Contract (Required)

When collapsed at COMPANY, emit once per render signature change:

```
[VIS3] flowOverlay result=PASS edges=<n> exceptions=<n> scope=<scope> lod=COMPANY
```

After rendering traffic bars:

```
[VIS3] trafficBarsRendered count=<deptCount>
```

Final summary:

```
[VIS3] gate-summary result=PASS
```

**Non-spam rule:** Log only when `(edges, exceptions, deptCount)` tuple changes OR LOD transitions into COMPANY collapsed state.

### 5. Suppression Rules

Flow overlay MUST NOT render when:
- `expandedSheetsAllowed === true`
- LOD is SHEET or CELL
- LOD is REGION/PLANETARY/LANIAKEA
- tree is null
- no trunk exists

If suppressed: remain silent (no PASS, no REFUSAL).

### 6. Budget Constraint

At COMPANY collapsed: `totalPrims <= VIS2 baseline + (deptCount * 2)`

Example: VIS-2 baseline ≈ 46 primitives, dept count = 3, traffic bars (≤ 2 per dept) = ≤ 6. Total expected ≤ ~52 primitives.

### 7. Proof Script Contract

Script: `scripts/vis3-flow-overlay-proof.mjs`

Must:
1. Start server if needed
2. Open `/relay-cesium-world.html?profile=world`
3. Fly to COMPANY collapsed state
4. Wait for: `[VIS2] sheetTilesRendered`, `[VIS3] flowOverlay result=PASS`, `[VIS3] trafficBarsRendered`, `[VIS3] gate-summary result=PASS`
5. Write artifact: `archive/proofs/vis3-flow-overlay-console-<date>.log`
6. Exit `PASS` or `REFUSAL`

### 8. Explicit Non-Goals (Locked Out)

VIS-3.1a does NOT include:
- Sheet row highlighting (VIS-3.2)
- Flow polylines between sheets
- Timebox slab rendering (VIS-4)
- KPI heatmaps (VIS-5)
- Presence overlays
- Governance state visuals

---

## VIS-3.2 — Flow Lens (SHEET Overlay)

### 1. Scope

Applies only when a single sheet is explicitly entered (`scope === 'sheet'` or `scope === 'cell'`) and `selectedSheetId` exists. World/Company collapsed behavior must not change (VIS-2 + VIS-3.1a invariants remain).

### 2. Visual Contract

When `expandedSheetsAllowed === true` and `selectedSheetId` is set:

**A. Row-level exception highlight (required)**

For the selected sheet only, identify exception rows and render a thin horizontal polyline across the sheet width at each exception row position:
- Color: `#ff5722` (deep orange), alpha 0.6
- Width: 4px
- Stable, deterministic: same row → same visual ID (`vis3.2-exRow-<sheetId>-r<row>`)

**B. Route-level highlight (required)**

Render thin connector polylines from each source fact sheet to the selected sheet:
- Derived from `metadata.sourceSheets` on match/summary sheets
- Color: `#00bcd4` (cyan), alpha 0.5
- Width: 3px
- Stable IDs: `vis3.2-route-<fromId>-<toId>`

### 3. What must NOT render

No new global markers, no extra sheets expanded, no changes to COMPANY tiles/spines/bars. No per-cell lane explosion. No data mutation.

### 4. Data Contract

**Exception rows:** For match sheets (`metadata.isMatchSheet`), identify rows where `matchStatus !== 'MATCH'` (same logic as VIS-3.1a `computeFlowOverlayCounts`). For non-match sheets, exception rows = 0 (still PASS if route highlights render).

**Route highlight edges:** Derived from `selectedSheet.metadata.sourceSheets`. For each source sheet ID, find the sheet node in the tree and connect its center to the selected sheet center. Stable IDs: `vis3.2-route-<fromId>-<toId>`.

### 5. Logging Contract

Emit once per signature change:

```
[VIS3.2] sheetOverlay begin sheet=<id> scope=<sheet|cell>
[VIS3.2] exceptionRows result=PASS sheet=<id> count=<n>
[VIS3.2] routeHighlights result=PASS sheet=<id> edges=<n>
[VIS3.2] budget exceptionOverlays=<n> routeHighlights=<n> capped=<true|false>
[VIS3.2] gate-summary result=PASS
```

If no sheet is selected: `[VIS3.2] gate-summary result=REFUSAL reason=NO_SELECTED_SHEET`

### 6. Budget Rule

- `exceptionOverlays <= min(exceptionRows, 200)`
- `routeHighlights <= 50`

### 7. Proof Script

`scripts/vis3-sheet-overlay-proof.mjs`

Steps: enter `P2P.ThreeWayMatch`, wait for VIS-3.2 PASS lines, verify regressions.

Artifact: `archive/proofs/vis3-sheet-overlay-console-<date>.log`

### 8. Non-Goals

No full flow graph, no user presence, no slab/timebox materialization, no KPI heatmaps, no new UI panels.

---

## VIS-3.3 — Click-to-Focus (SHEET Interactivity)

### 1. Scope

SHEET scope only (entered). No world/company behavior changes. VIS-3.2 overlays remain exactly as-is; VIS-3.3 adds click interaction on top.

### 2. User Actions

**A. Click exception row overlay:**
- Focuses that row (adds a brighter/thicker highlight on the selected row only)
- HUD shows: sheet ID, row index, matchStatus, and key IDs for that row (e.g., matchId, poLineId)
- Log: `[VIS3.3] clickRow result=PASS sheet=<id> row=<n> status=<matchStatus>`

**B. Click route connector:**
- Focuses that connector (adds a brighter/thicker highlight on the selected connector only)
- Exposes "jump to source" action
- Log: `[VIS3.3] clickConnector result=PASS from=<sheet> to=<sheet>`

**C. Jump to source (after clicking connector):**
- Calls `relayEnterSheet(sourceSheetId)` and triggers render
- Log: `[VIS3.3] jumpToSource result=PASS sheet=<sourceSheet>`

### 3. Rendering Rules

- VIS-3.2 exception overlays and route connectors unchanged
- Focus adds at most 2 new primitives total (1 row highlight + 1 connector highlight)
- Focus highlight: `#ffeb3b` (bright yellow), alpha 0.9, width 8 (row) / 6 (connector)

### 4. Logging Contract

```
[VIS3.3] clickRow result=PASS sheet=<id> row=<n> status=<matchStatus>
[VIS3.3] clickConnector result=PASS from=<sheet> to=<sheet>
[VIS3.3] jumpToSource result=PASS sheet=<sourceSheet>
[VIS3.3] gate-summary result=PASS
```

### 5. Budget

Max 2 new primitives from focus highlights. No increase in overlay counts.

### 6. Proof Script

`scripts/vis3-click-to-focus-proof.mjs` (Playwright):
1. Enter P2P.ThreeWayMatch
2. Click first exception overlay (programmatic) → assert clickRow log
3. Click one connector (programmatic) → assert clickConnector log
4. Trigger jump → assert jumpToSource log and sheet changes
5. Assert no console errors
6. Emit `[VIS3.3] gate-summary result=PASS`

Artifact: `archive/proofs/vis3-click-to-focus-console-<date>.log`

### 7. Non-Goals

No new data models, no cell editing, no governance. Click is read-only inspection only.

---

## VIS-4 (later)

Timebox slabs / history pucks — only after VIS-3 is stable.

## Out of scope for VIS-3

- Flow bundling
- New engine or route logic
- Slabs (VIS-4)
