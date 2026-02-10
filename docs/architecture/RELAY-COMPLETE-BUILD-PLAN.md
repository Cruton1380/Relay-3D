# Relay — Complete Build Plan (Master Roadmap)

**Generated: 2026-02-09**
**Updated: 2026-02-09 (UX-2.1 LOD Budget implemented as D0.3 remediation — early guards + stride sampling)**
**Status: UX-1 DONE, D0 IMPLEMENTED, UX-2.1 LOD Budget IMPLEMENTED (D0.3 remediation). Next: reload browser and rerun `await relayD0Gate(10000)` to verify all gates pass.**

---

## System State: What Exists Today

Relay has crossed from prototype to general coordination engine. The analytical spine is complete: facts flow through explicit routes into visible sheets, reconcile through match sheets, aggregate through formula-only summaries, bind to branch timeboxes through config, and drive tree motion through measurable geometry.

The Focus Lens (D-Lens-0) is implemented — any object can be isolated via F key or double-click, with camera fly-to, scene dimming, parent context preservation, and clean exit.

### Completed Phases (Proven, Locked)

| Phase | What It Proved | Status |
|-------|---------------|--------|
| A0 | Engine gates — docking, editing, virtualized viewport, scrollbars | PASS |
| A0.1 | Pixel-perfect 3D↔2D grid alignment (dx/dy ≤ 2px) | PASS |
| A0.2 | Formula engine — evaluate, propagate, recalc dependents, timebox increment | PASS |
| A0.3 | Timebox filament length = cell length (segment geometry) | PASS |
| A0.3b | Timebox anchor invariant — first segment starts at cell back face | PASS |
| A0.4 | Spine aggregation bands — cell edits reflected as spine band thickness | PASS |
| B1 | P2P baseline fact sheets — 6 schemas, module loader, sample data | PASS |
| B1-ext | Extended formula engine — IF, VLOOKUP, SUMIF, COUNTIF, INDEX, MATCH | PASS |
| B2 | Match sheets — deterministic builder, QTY_EXCEPTION proof, inspector drill-through | PASS |
| B3 | Summary sheets — cross-sheet formula engine, 3 summary sheets (AP_Aging, MatchRate, Spend) | PASS |
| B3.5 | Transparency gate — dependency inspector for any formula cell | PASS |
| B4 | KPI branch mapping — config-driven bindings, recomputation chain, 3D visual response | PASS |
| C0 | Route engine — config-driven data flow, provenance, mock streams, dry-run preview | PASS |
| **D-Lens-0** | **Focus frame — camera + dimming + breadcrumb + entity tracking + triggers** | **PASS** |

### Frozen Contracts (documented in `RELAY-PHYSICS-CONTRACTS.md`)

1. Fact sheets are append-only
2. Match sheets are derived, visible, rebuildable
3. Summary sheets are formula-only
4. KPI bindings read cells, not code
5. Tree motion only comes from timebox metrics
6. Routes only append rows, never compute

### New UX Contracts (adopted post-C0)

7. **No menus** — capabilities reveal on arrival via Capability Buds, not panels or ribbons
8. **One interaction grammar** — every object type exposes the same interface contract
9. **No hidden formulas** — any KPI-relevant cell must be inspectable via dependency inspector + filaments
10. **LOD prevents mess** — dense branches cluster automatically; expand only on focus

---

## Gaps in Completed Phases (Must Fix Before Scale)

| Gap | Description | Priority | When |
|-----|------------|----------|------|
| G1 | No date functions — AP_Aging uses DPO approximation instead of real aging buckets | Medium | D0.5 |
| G2 | Copy/paste range selection incomplete (basic copy works, paste from clipboard not robust) | Low | D1+ |
| G3 | Geographic boundaries disabled (Cesium render crash) | Low | After D0 |
| G4 | 18+ missing proof artifact files from pre-A0 era | Low | Doc pass |
| G5 | Legacy Phase 3-8 docs superseded by A0-C0 architecture | Low | Doc pass |
| G6 | 15+ TODO markers in migration scripts (vote-counting era, obsolete) | Low | Cleanup |
| G7 | Module Completion Matrix outdated — shows DEGRADED for things that now PASS | Medium | Doc pass |

---

## The Forward Build Plan

### ═══ PHASE R0: Rendering Repair Pass (immediate, before UX-1) ═══

**Goal:** Fix visual regressions observed in current state. The system must be testable before building new features.

**Evidence:** Screenshots taken 2026-02-09 show 5 issues that degrade usability and block validation.

#### R0.1: FPS Recovery (CRITICAL)

- **Symptom:** FPS shows 0–3 in HUD at company zoom with 28 nodes
- **Likely cause:** Too many entities/primitives rendered at all LOD levels; LOD governor reporting null
- **Fix:** Diagnose entity count, verify LOD governor is active, reduce rendering at COMPANY zoom
- **PASS:** FPS >30 at company zoom with current node count
- **REFUSAL:** FPS remains <15

#### R0.2: LOD Governor Null Fix

- **Symptom:** HUD shows "LOD: null" instead of COMPANY/SHEET/CELL
- **Fix:** Ensure LOD governor initializes and reports level on startup
- **PASS:** HUD shows correct LOD level that changes with camera distance
- **REFUSAL:** LOD remains null

#### R0.3: Timebox Rendering Consistency

- **Symptom:** Some cells show timebox slabs, others show nothing
- **Diagnose:** Verify contract — is `timeboxCount > 0` correct for only edited/recomputed cells? If so, this is correct behavior. If timeboxes are missing for cells that should have them, fix the lane renderer.
- **PASS:** Every cell with `timeboxCount > 0` renders visible slabs; cells with `timeboxCount === 0` render nothing
- **REFUSAL:** Cells with history show no timeboxes, or cells without history show phantom timeboxes

#### R0.4: Filament/Timebox Visual Separation

- **Symptom:** Stage-1 filament lines and timebox slab geometry overlap in the same visual space
- **Fix:** Offset filament routing so it doesn't intersect timebox lane geometry, or reduce filament opacity when timeboxes are present
- **PASS:** Filaments and timeboxes are visually distinguishable at SHEET zoom
- **REFUSAL:** Can't tell which geometry is filament vs timebox

#### R0.5: Cell Boundary / 3D Grid Proportions

- **Symptom:** 3D sheet outlines appear to extend beyond cell grid bounds; 3D cells look more elongated than 2D counterparts
- **Fix:** Verify sheet outline geometry matches actual `rows * cellSpacingY` and `cols * cellSpacingX`; verify 3D cell aspect matches 2D cell aspect
- **PASS:** 3D grid boundary exactly contains all cells, proportions match 2D
- **REFUSAL:** 3D outline overshoots or undershoots cell range

### ═══ PHASE UX-1: Universal Object Contract + Inspector Context (next after R0) ═══

**Goal:** Replace menus with progressive, context-sensitive action discovery. Any selected object shows its allowed actions locally — no hidden screens, no ribbons.

**Why now:** This is the interaction grammar that makes everything else usable. Without it, every new feature needs a new menu. With it, new features are just new action types on existing objects.

**Implementation order inside UX-1:** UX-1.1 (adapter) → UX-1.3 (inspector context) → UX-1.2 (buds UI). Inspector context must work before buds have anything useful to dispatch to.

#### UX-1.1: Universal Object Contract (Adapter Layer)

A single function `toRelayObject(target)` that returns a standard interface for any selected/focused object. This is an **adapter**, not a migration — core data structures are not changed, renamed, or rewritten.

```javascript
// Adapter function — does NOT modify core data structures
function toRelayObject(target) → {
    id: string,                  // EXISTING canonical ID only — no invented IDs
    type: 'cell' | 'sheet' | 'match' | 'route' | 'branch' | 'trunk' | 'module',
    label: string,              // human-readable name
    scope: string,              // which branch/module owns this
    facts: Reference[],         // links to source fact sheets (resolved on demand)
    dependencies: Reference[],  // formula/filament connections (resolved on demand)
    historyCount: number,       // timebox count (not full history dump)
    provenance: { sourceSystem, sourceId, ingestedAt } | null,
    actions: Action[]           // context-sensitive capabilities (typed, per object type)
}
```

Implementation constraints (non-negotiable):
- **One function** (and helpers if necessary), no refactors
- **No new IDs** — must return canonical IDs that already exist (sheet IDs, cell IDs, route IDs, match IDs, branch IDs). Mismatches between inspector, focus, and routing are fatal.
- **No renaming** core structures
- **No new rendering**
- **No new data mutations**
- Must work for every focusable/pickable object type we currently have

Accepted inputs:
- Picked Cesium entity/primitive (with `_relayNodeId`)
- Tree node object (`node`)
- Sheet cell reference (`{ sheetId, cellRef }` or `{ sheetId, cellId }`)
- Match row (`{ matchId }`)
- Route record (`{ routeId }`)
- Branch/trunk node (`{ branchId }`)

Proof:
```
[UX-1.1-PROOF] type=match id=3WM-005 scope=branch.p2p actions=InspectSources,SetTolerance,...
```

- **PASS:** `toRelayObject(anyTarget)` returns a valid contract for every focusable object type in console
- **REFUSAL:** Requires changing ids, renaming fields, migrating data, or inventing new IDs

#### UX-1.3: Inspector Context Switching (D-Lens-1) — BEFORE UX-1.2

The inspector panel already exists for cells, matches, and dependencies. Extend it to adapt based on focused/selected object type. This must work before Capability Buds can dispatch actions.

| Focused Object | Inspector Shows |
|---------------|----------------|
| Cell | Dependency list + timebox history + formula text |
| Match row | Source fact rows + variance + status |
| Sheet | Column schema + row count + provenance summary + route bindings |
| Module | All sheets + route list + KPI bindings + recomputation chain |
| Branch | KPI metrics timeline + summary cell sources + child sheets |
| Route | Field mapping table + recent ingestions + provenance |

Inspector title always shows: `"Inspecting: {object.type} {object.id}"`
Inspector reads from `toRelayObject()` output — this is UX-1.1's first consumer.

- **PASS:** Every object type shows appropriate inspector content when focused
- **REFUSAL:** Inspector shows wrong content for object type, or shows nothing

#### UX-1.2: Capability Buds (Action Discovery) — DONE

When any object is selected, pressing **Space** (or clicking a small bud icon near the selection) reveals 3–7 context-specific actions. Each action is typed and logged.

**Actions by object type:**

| Object Type | Available Actions |
|------------|------------------|
| **Cell** | Edit, View dependencies, View history, Create validation rule, Lock scope |
| **Match row** | Inspect sources, Set tolerance, Mark exception resolved, View variance |
| **Sheet** | Add column, Add validation, Add summary binding, Focus view, Show schema |
| **Route** | Preview mapping, Ingest test record, Show provenance, Edit field map |
| **Branch** | Show KPIs, Show timeboxes, Show pressure sources, Focus view |
| **Module** | Show all sheets, Show routes, Show KPI bindings, Show recomputation chain |

Implementation:
- A floating action panel near the selected object (not a modal, not a menu bar)
- Actions dispatch to existing functions (inspector, focus, edit, etc.)
- Actions read from `toRelayObject().actions` — consistent with the contract
- Every action is logged: `[BUD] action=viewDependencies target=P2P.InvoiceLines!C14`
- Actions are defined per object type in config, not hard-coded per feature

- **PASS:** Select any object → press Space → see relevant actions → execute one → log appears
- **REFUSAL:** Actions require navigating to a different screen, or actions are not type-appropriate

### ═══ PHASE UX-2: LOD Budget + Leaf Clustering (REACTIVE — triggered by D0 results) ═══

**Goal:** Prevent visual clutter as data grows. Dense branches auto-cluster; expand only on focus.

**When:** UX-2 is NOT a prerequisite for scale testing. It is remediation applied only if D0 exposes measured overdraw or clutter. Do not build speculatively.

#### UX-2.1: LOD Budget Rules — IMPLEMENTED (D0.3 REFUSAL triggered this)

Enforce per-LOD-level rendering budgets via hard early guards in `filament-renderer.js`:

- **`LOD_BUDGET.MAX_CELL_MARKERS_PER_SHEET = 2000`** — deterministic stride sampling with priority cell inclusion
- **`LOD_BUDGET.MAX_CELL_FILAMENTS_PER_SHEET = 2000`** — early guard caps timebox lane iteration
- **`LOD_BUDGET.MAX_TIMEBOX_SEGMENTS_PER_SHEET = 5000`** — segment budget with hard break
- **EARLY GUARD**: Pre-budgets `cellData` array BEFORE filter/forEach/entity creation to prevent 100k+ allocation storms
- **Placeholder grid budget**: Stride-sampled for sheets with `rows × cols > budget`
- **Priority inclusion**: Selected cell + dependency neighborhood always rendered regardless of stride
- **Proof logs**: `[LOD-BUDGET] sheet=X EARLY-GUARD: N → M cells (stride=S)`

Budgets per LOD level:

| LOD Level | What's Visible | What's Hidden |
|-----------|---------------|---------------|
| COMPANY | Trunk + branches + sheet cluster proxies (one icon per sheet) | Individual cells, timeboxes, filaments |
| SHEET | Sheet surface + cell anchors + spine bands | Individual cell timeboxes, deep filaments |
| CELL | Full timebox slabs + dependency filaments + formula edges | Other sheets' details |

Budget enforcement:
- Max entities per LOD level (hard cap, configurable)
- Entities beyond budget are culled by distance from camera
- LOD transitions happen smoothly (no pop-in)

**Trigger:** Only implement if D0.3 (tree redraw stability) shows >10k entities or <30fps.

#### UX-2.2: Leaf Clustering (enable if branches become unreadable)

When a branch has more than N leaves (configurable, default 8), group overflow leaves into cluster nodes:

- Cluster node shows: count, aggregate health indicator (worst ERI of children)
- Cluster expands on Focus (F key or double-click)
- Expanded cluster shows individual sheets in a local ring/fan layout
- Collapsing exits focus and restores cluster proxy

**Trigger:** Only implement if C1 (second module) or D0 makes a branch visually unreadable at COMPANY zoom. Do not build until the problem is measured.

### ═══ PHASE D0: Scale & Stress ═══

**Goal:** Prove the system works at volume without breaking virtualization, recomputation, or rendering.

**Why now:** C0 proved correctness. D0 proves it doesn't collapse under load. Must pass before ERP finalization.

#### D0.1: Bulk Route Ingestion — IMPLEMENTED

- `window.relayStressTest(count, routeId)` generates and ingests `count` mock records
- `ingestBatch` optimized: defers `ensureCellIndex` until after all rows appended (avoids O(n²))
- Reports timing, memory estimate, entity/primitive counts
- **PASS:** 10k rows ingested, sheet opens, scrolls, cells editable
- **REFUSAL:** Browser hangs, tab crashes, or virtualization breaks

#### D0.2: Recomputation Chain Latency — IMPLEMENTED

- `recomputeModuleChain` has `performance.now()` timing (logged as `[D0-PERF]`)
- Summary formula ranges auto-expand via `buildSummaryData` rebuild with current row counts
- Target: full chain <2 seconds for 10k fact rows
- **PASS:** Chain completes, summary values correct, branch updates
- **REFUSAL:** Chain takes >5s or produces wrong values

#### D0.3: Tree Redraw Stability — IMPLEMENTED + UX-2.1 REMEDIATION

- Entity/primitive counting built into stress test and D0 gate
- `window.relayFPSMonitor(durationMs)` measures FPS over configurable window
- **D0.3 REFUSAL (first run):** Renderer crashed on 100k+ cell sheets (InvoiceLines, ThreeWayMatch). InvoiceToGLMatch rendered 100k markers bypassing budget.
- **UX-2.1 Remediation applied:** Hard early guards pre-budget cellData arrays before any heavy processing. Placeholder grid path also budget-capped.
- D0 gate includes 3-second FPS measurement after ingestion
- **PASS:** Tree renders, >30 FPS, entities <10k, primitives <200
- **REFUSAL:** Render loop chokes or entities grow unbounded
- **If REFUSAL → trigger UX-2.1** (LOD Budget) as remediation

#### D0.4: Virtualized Viewport at Scale — IMPLEMENTED

- Viewport renders `(visible + 2×VIEWPORT_BUFFER)` cells only (~525 DOM elements)
- `resolveRange` optimized for large cross-sheet refs (single range dep for >100 cells)
- Scrollbars, wheel, drag, jump-to-cell all functional
- **PASS:** Smooth scrolling, correct cell values, no DOM explosion
- **REFUSAL:** All 10k rows rendered as DOM elements

#### D0.5: Date Functions + Aging Buckets — IMPLEMENTED

- Formula functions: `TODAY`, `NOW`, `DATEVALUE`, `DATEDIF`, `DAYS`, `YEAR`, `MONTH`, `DAY`
- AP_Aging updated with real aging buckets: Current (0-30d), 31-60d, 61-90d, 90d+
- `ageDays` column added to InvoiceToPaymentMatch (derived in match builder)
- DPO formula uses `Avg Age × Outstanding / Total Invoiced`
- KPI binding updated to reference DPO formula cell (B13)
- **PASS:** AP_Aging shows aging buckets based on actual due dates
- **REFUSAL:** Aging still uses the approximation formula

#### D0 Gate: `window.relayD0Gate(count)` — IMPLEMENTED

- Comprehensive async gate function that runs the full D0 test suite
- Ingests `count` records, measures recompute latency, checks entity counts, measures FPS
- Verifies date functions exist and aging buckets are present
- Reports PASS/REFUSAL for each sub-gate with detailed metrics
- **Run:** Open console at `http://localhost:8000` and call `await relayD0Gate(10000)`

### ═══ PHASE C1: Fractal Module Replication ═══

**Goal:** Prove "modules are configurations, not code" by adding a second module.

- Create `config/modules/mfg-module.json` (Manufacturing):
  - Fact sheets: WorkOrderOps, MaterialIssues, ScrapEvents, QualityChecks
  - Match sheets: WO_InputOutputMatch, MaterialConsumptionMatch
  - Summary sheets: ThroughputSummary, YieldSummary, WIPSummary
  - KPI bindings: throughput, yield, scrapRate
- Create `config/routes/mfg-routes.json`
- Load with `loadModule()` + `loadRoutes()` — zero new engine code
- Verify Capability Buds work on MFG objects identically to P2P
- Verify LOD clustering handles the additional branch
- **PASS:** MFG module loads, sheets editable, routes work, tree shows mfg branch with KPIs, buds work
- **REFUSAL:** Any new renderer/engine code required, or buds don't adapt

### ═══ PHASE D1: Inter-Branch Aggregation ═══

**Goal:** Branch → Trunk → Holding company aggregation bands.

- Trunk timebox bands aggregate from all branch KPI metrics
- Aggregation is read-only, inspectable (not computed in hidden code)
- Trunk ERI derived from branch ERI weighted average
- Inspector can trace: trunk metric → branch metric → summary cell → facts
- Capability Buds on trunk node show aggregation sources
- **PASS:** Edit an invoice → branch KPI changes → trunk band thickens → inspector traces it
- **REFUSAL:** Trunk changes without a traceable branch source

### ═══ PHASE D2: File Import Adapters ═══

**Goal:** Import an Excel or CSV file and route its rows through the route engine.

- Excel importer already exists (`app/excel-importer.js`) — extend to:
  - Accept a target routeId
  - Map spreadsheet columns to route source fields (via config or auto-detect)
  - Ingest each row through `ingestRecord`
  - Show import stamp with provenance (filename, row count, route used)
- CSV parser (simple, no library)
- Import preview: show mapped/dropped columns before committing (reuses `previewRoute`)
- The import adapter is a new file type that plugs into the Universal Object Contract
- **PASS:** Drop an Excel file → rows appear in fact sheet → chain fires → tree moves
- **REFUSAL:** Imported rows bypass the route engine

### ═══ PHASE UX-3: Branch Steward (Visible Configuration) ═══

**Goal:** Business owners can define schemas, route mappings, and validation rules without hidden screens.

- **Schema editor as a sheet:** Module column schemas are visible/editable spreadsheets, not JSON files
- **Route mapping preview:** Already built via `previewRoute` — surface it as a Capability Bud action on routes
- **Validation rules as visible objects:** Each validation rule is a row in a validation sheet with: column, rule type, threshold, action
- **All configuration changes produce commits** — schema edits create timeboxes like any other edit

- **PASS:** Business user can add a column to a fact sheet by editing the schema sheet, preview a route mapping, and add a validation rule — all without touching JSON or code
- **REFUSAL:** Any configuration requires editing a file outside the 3D/2D interface

### ═══ PHASE D3: API / Webhook Connectors ═══

**Goal:** Accept HTTP POST events and route them to fact sheets.

- Minimal HTTP endpoint (or WebSocket) that accepts JSON events
- Each event specifies `routeId` + payload
- Server-side: calls `ingestRecord` → `recomputeModuleChain`
- Authentication: API key per source system
- Rate limiting + batch coalescing
- Route/connection status visible as an object with its own inspector
- **PASS:** POST an invoice JSON → row appears → chain fires
- **REFUSAL:** API bypasses route normalization or provenance

### ═══ LONG-TERM: Infrastructure & Trust ═══

#### E1: Cryptographic Integrity Layer

- Merkle tree over commit history
- Each timebox carries a hash of its contents
- Signature verification for routed events
- Tamper detection on fact sheets
- **Depends on:** D0, D1 passing

#### E2: Governance Workflows

- HOLD / RECONCILE / APPROVE flows
- Work zone enforcement (who can edit what)
- Stage gates with human approval
- **Depends on:** E1 (trust layer), UX-3 (visible config)

#### E3: Deterministic Replay

- Replay all routed events from t=0 to reproduce current state
- Verify: replayed state matches live state exactly
- Enables auditing, debugging, migration
- **Depends on:** E1 (integrity), D0 (scale)

#### E4: Multi-Company / Regional Topology

- Basin/region aggregation
- Cross-company data routing (with jurisdictional boundaries)
- Global core (central authority aggregation)
- **Depends on:** D1 (trunk aggregation), E2 (governance)

#### E5: Lens Sphere v2 (Advanced)

- VR/AR support
- Collaborative focus (multiple users in same focus sphere)
- Historical replay within focus sphere (scrub timebox timeline)
- **Depends on:** D-Lens (basic), E3 (replay)

---

## Build Sequence (Recommended Order)

```
CURRENT STATE: A0-C0 COMPLETE, D-Lens-0 DONE, PHYSICS FROZEN
ERP spine complete. Next: usability + scale proof before trust/governance.
         │
    ┌────┤  REPAIR (fix visual regressions blocking testing)
    │    ├─── R0.2: LOD governor null fix (FIRST — root cause of FPS)
    │    ├─── R0.1: FPS recovery (>30fps at company zoom)
    │    ├─── R0.3: Timebox rendering consistency
    │    ├─── R0.4: Filament/timebox visual separation
    │    └─── R0.5: Cell boundary / 3D grid proportions
    │
    ├────┤  USABILITY (interaction grammar)
    │    ├─── UX-1.1: Universal Object Contract (toRelayObject adapter — no new IDs)
    │    ├─── UX-1.3: Inspector context switching (D-Lens-1) — BEFORE buds
    │    └─── UX-1.2: Capability Buds (Space key → context actions) — AFTER inspector
    │
    ├────┤  SCALE PROOF (truth test)
    │    ├─── D0.1: Bulk route ingestion (10k rows)
    │    ├─── D0.4: Virtualized viewport at scale
    │    ├─── D0.2: Recompute chain latency
    │    ├─── D0.3: Tree redraw stability
    │    └─── D0.5: Date functions (Gap G1)
    │
    ├────┤  REACTIVE — only if D0 exposes measured problems
    │    ├─── UX-2.1: LOD Budget (if D0.3 shows >10k entities or <30fps)
    │    └─── UX-2.2: Leaf clustering (if branches become unreadable)
    │
    ├────┤  FRACTAL REPLICATION
    │    └─── C1: Manufacturing module (zero new engine code)
    │
    ├────┤  EXPANSION
    │    ├─── D1: Inter-branch aggregation (branch → trunk)
    │    ├─── D2: File import adapters (Excel/CSV → route)
    │    ├─── UX-3: Branch Steward (schema/validation as visible sheets)
    │    └─── D3: API / webhook connectors
    │
    ├────┤  CLEANUP
    │    └─── [Documentation pass: fix Gaps G2-G7]
    │
    └────┤  TRUST & GOVERNANCE (Phase E — not "ERP finalization")
         ├─── E1: Cryptographic integrity layer
         ├─── E2: Governance workflows
         ├─── E3: Deterministic replay
         ├─── E4: Multi-company topology
         └─── E5: Lens Sphere v2
```

---

## Enforced Rules (All Phases)

1. **No menus** — actions are discovered via Capability Buds on selected objects
2. **One grammar** — every object exposes the same interface contract (Universal Object adapter)
3. **No hidden formulas** — dependency inspector is the gate for any KPI-relevant cell
4. **LOD responds to measured pain** — budgets + clustering applied only when scale testing proves they're needed, not speculatively
5. **Six frozen contracts** — fact append-only, match derived, summary formula-only, KPI reads cells, tree from metrics, routes only append
6. **ERP spine is complete; what follows is usability, scale, then trust** — no premature "finalization" that triggers governance/security scope creep

---

## What Is NOT In This Plan (Explicitly Rejected)

- No menus, ribbons, or option panels
- No opaque math functions (LINEST, FORECAST, regression)
- No hidden aggregation engines
- No "smart" routing that computes during ingestion
- No branch-to-branch data sharing outside explicit routes
- No real-time collaboration (deferred to E5)
- No VR/AR (deferred to E5)
- No weather overlays (legacy, removed from scope)
- No vote counting system (legacy, removed from scope)
- No object-specific UI that doesn't follow the Universal Object Contract

---

## One-Sentence Summary

Relay is a data-flow coordination engine where immutable facts flow through config-driven routes into visible sheets, reconcile through deterministic matchers, aggregate through inspectable formulas, and drive measurable tree motion through bound timebox metrics — and every object is discoverable by clicking, inspectable without menus, and legible at any scale.
