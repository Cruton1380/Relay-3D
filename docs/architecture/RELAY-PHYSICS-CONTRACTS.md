# Relay Physics Layer — Frozen Contracts

**Status: FROZEN — No future feature may violate these contracts.**
**Effective: 2026-02-09 (post Phase C0)**

---

## Core Invariant

> Relay is not a data system. It is a data-flow system.
> Facts are inert; movement comes from how facts are routed, reconciled, summarized, and bound to time.

---

## The Six Frozen Contracts

### 1. Fact Sheets Are Append-Only

Fact sheets store baseline events/transactions. Rows are never mutated or deleted.

- New facts arrive via routes or manual entry
- Each row carries provenance (sourceSystem, sourceId, ingestedAt)
- Fact sheets are the only place where raw data lives
- **Violation example:** updating an existing invoice line instead of appending a correction

### 2. Match Sheets Are Derived, Visible, and Rebuildable

Match sheets are computed by `buildMatches()` — a pure, deterministic function.

- Match sheets join facts using explicit, stable keys
- Join metadata (EXACT/INFERRED, confidence) is carried through the model
- Match sheets are visible spreadsheets, not hidden logic
- Any match can be rebuilt from scratch from the current fact data
- **Violation example:** a match result stored only in memory with no visible sheet

### 3. Summary Sheets Are Formula-Only

Summary sheets compute metrics using spreadsheet formulas with cross-sheet references.

- No JavaScript aggregation code in summary sheets
- Every summary cell is a formula that references fact/match sheet cells
- Summary sheets are editable and inspectable like any other sheet
- Editing a source fact must visibly change the summary (traceable recomputation)
- **Violation example:** a "KPI engine" that computes match rate in JS and writes it to a cell

### 4. KPI Bindings Read Cells, Not Code

KPI bindings are config entries in the module JSON that map summary cells to branch timebox metrics.

- A binding declares: metricId, sourceCell (sheetId!cellRef), transform, unit
- The binding reads a cell value — it does not compute anything
- If the source cell changes, the metric changes. If it doesn't, the metric doesn't.
- **Violation example:** a KPI that counts exceptions by iterating match sheet rows in JS

### 5. Tree Motion Only Comes From Timebox Metrics

Branch color, thickness, pressure, and timebox bands are driven exclusively by KPI metric values.

- `branch.eri` is set from a bound metric (e.g., matchRate)
- Timebox color is derived from metric thresholds
- No geometry change is allowed without a traceable metric source
- The allowed path: facts → summary cell → timebox metric → geometry
- **Violation example:** branch color changing based on "number of edits" without a summary cell

### 6. Routes Only Append Rows, Never Compute

Routes are pure field mappings: external record → normalized fact row.

- A route normalizes field names, coerces types, and enforces provenance
- A route appends exactly one row to exactly one fact sheet
- A route never triggers matching, aggregation, or KPI updates directly
- The recomputation chain (`recomputeModuleChain`) is triggered after ingestion
- **Violation example:** a route that computes a three-way match while ingesting

---

## The Only Allowed Data Path

```
External Event
    ↓
Route (normalize + append)
    ↓
Fact Sheet (append-only row)
    ↓
Match Sheet (deterministic rebuild)
    ↓
Summary Sheet (formula recalculation)
    ↓
KPI Binding (cell → metric)
    ↓
Branch Timebox (metric → geometry)
    ↓
Tree Motion (visible, auditable)
```

Every step is inspectable. Every step is reversible. Nothing is hidden.

---

## Blackbox Rejection Policy

Relay explicitly rejects opaque computation:

- **No LINEST, FORECAST, or regression functions** unless decomposed into visible intermediate cells
- **No hidden aggregation engines** — if a value exists, its formula must be readable
- **No "magic KPI" logic** — every metric must trace to a source cell
- If advanced math is needed: decompose it into visible intermediate sheets where each step produces inspectable cells

This is one of Relay's strongest differentiators vs Excel/ERP dashboards.

---

## Plug-and-Play Capability

To add a new business process module:

1. Create `config/modules/<module>-module.json` — fact sheets + match sheets + summary sheets + KPI bindings
2. Create `config/routes/<module>-routes.json` — external field → column mappings
3. Call `loadRoutes()` + `loadModule()` — no new engine code required

Modules are configurations, not code. The engine is frozen.

---

## Phase History

| Phase | What It Proved | Date |
|-------|---------------|------|
| A0–A0.4 | Pixel-perfect 3D↔2D, cell geometry = timebox geometry | 2026-02-08 |
| B1 | Baseline fact sheets (explicit, append-only) | 2026-02-08 |
| B2 | Match sheets (explicit reconciliation) | 2026-02-08 |
| B3 | Summary sheets (formula-only aggregation) | 2026-02-09 |
| B3.5 | Transparency gate (dependency inspector) | 2026-02-09 |
| B4 | KPI → branch mapping (provable recomputation chain) | 2026-02-09 |
| C0 | Route engine (config-driven data flow) | 2026-02-09 |

---

## Next: Phase D0 — Scale & Stress

No new logic. Prove the system works at volume:

- Ingest 100k+ routed rows
- Verify virtualization holds
- Verify recomputeModuleChain latency
- Verify tree redraw stability
- Verify inspector usability at scale

### Future (after D0):
- **D1:** Inter-branch aggregation bands (read-only, inspectable) — branch → trunk → holding
- **D2:** File import adapters (Excel/CSV → route)
- **D3:** API connectors (external system → route)
