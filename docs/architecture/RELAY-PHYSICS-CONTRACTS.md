# Relay Physics Layer -- Frozen Contracts

**Status: FROZEN -- No future feature may violate these contracts.**
**Effective: 2026-02-09 (post Phase C0)**
**Updated: 2026-02-10 (expanded from 6 to 15 contracts to match master plan)**

Source: [RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md) section 2.

---

## Core Invariant

> Relay is not a data system. It is a data-flow system.
> Facts are inert; movement comes from how facts are routed, reconciled, summarized, and bound to time.

---

## The 15 Frozen Contracts

### Data Flow Contracts (1-6)

**1. Fact sheets are append-only** -- routes only append rows; never compute.

Fact sheets store baseline events/transactions. Rows are never mutated or deleted.

- New facts arrive via routes or manual entry
- Each row carries provenance (sourceSystem, sourceId, ingestedAt)
- Fact sheets are the only place where raw data lives
- **Violation example:** updating an existing invoice line instead of appending a correction

**2. Match sheets are derived, visible, rebuildable** -- pure deterministic function of facts.

Match sheets are computed by `buildMatches()` -- a pure, deterministic function.

- Match sheets join facts using explicit, stable keys
- Join metadata (EXACT/INFERRED, confidence) is carried through the model
- Match sheets are visible spreadsheets, not hidden logic
- Any match can be rebuilt from scratch from the current fact data
- **Violation example:** a match result stored only in memory with no visible sheet

**3. Summary sheets are formula-only** -- no JS aggregation, every cell is a formula.

Summary sheets compute metrics using spreadsheet formulas with cross-sheet references.

- No JavaScript aggregation code in summary sheets
- Every summary cell is a formula that references fact/match sheet cells
- Editing a source fact must visibly change the summary (traceable recomputation)
- **Violation example:** a "KPI engine" that computes match rate in JS and writes it to a cell

**4. KPI bindings read cells, not code** -- config entries map summary cells to metrics.

KPI bindings are config entries in the module JSON that map summary cells to branch timebox metrics.

- A binding declares: metricId, sourceCell (sheetId!cellRef), transform, unit
- The binding reads a cell value -- it does not compute anything
- **Violation example:** a KPI that counts exceptions by iterating match sheet rows in JS

**5. Tree motion only comes from timebox metrics** -- no geometry change without traceable metric.

Branch color, thickness, pressure, and timebox bands are driven exclusively by KPI metric values.

- `branch.eri` is set from a bound metric (e.g., matchRate)
- The allowed path: facts -> summary cell -> timebox metric -> geometry
- **Violation example:** branch color changing based on "number of edits" without a summary cell

**6. Routes only append rows, never compute** -- normalize + append; recompute chain fires after.

Routes are pure field mappings: external record -> normalized fact row.

- A route normalizes field names, coerces types, and enforces provenance
- A route appends exactly one row to exactly one fact sheet
- A route never triggers matching, aggregation, or KPI updates directly
- The recomputation chain (`recomputeModuleChain`) is triggered after ingestion
- **Violation example:** a route that computes a three-way match while ingesting

### Interaction Contracts (7-10)

**7. No menus** -- Capability Buds only.

Actions are discovered via Capability Buds on selected objects (Space key), not panels, ribbons, or option menus.

**8. One interaction grammar** -- Universal Object Contract for every type.

Every object type exposes the same interface contract via `toRelayObject()`. There is no object-specific UI that doesn't follow this contract.

**9. No hidden formulas** -- dependency inspector for every KPI cell.

Any KPI-relevant cell must be inspectable via the dependency inspector and filament visualization. If a value exists, its formula must be readable.

**10. LOD responds to measured pain only** -- never speculative.

LOD budgets and leaf clustering are applied only when scale testing proves they are needed (measured overdraw, FPS drop, or visual unreadability). No speculative optimization.

### Governance Contracts (11-15)

**11. Undo after canon is always a revert** -- visible scar, not erasure.

After a change is committed, it can only be "undone" by creating a new REVERT commit that cancels the effects. The original commit remains in history. This preserves full audit trail.

**12. Refusal is explicit** -- no silent fallback, no best-guess.

When the system cannot complete an operation (missing data, authority violation, stage lock, confidence below floor), it produces an explicit REFUSAL with a reason code. It never silently falls back to a default or makes a best-guess substitution.

**13. Learning produces recommendations, not policy mutations** -- authorityRef + versioned commit required.

The system's learning mechanisms (threshold tuning, weight adjustment, pattern detection) produce recommendation commits only. Applying any change to thresholds, weights, or policies requires an explicit authorityRef and a versioned policy commit.

**14. Pressure is not authority** -- pressure influences perception, never auto-executes.

Pressure (wilt, urgency signals, vote accumulation) is an environmental signal that informs users. It never triggers automatic execution, HOLD/PROPOSE/COMMIT transitions, or access changes. Users observe and respond; the system does not auto-act.

**15. Minimum required data, shortest retention, strictest scope** -- data minimization invariant.

Every data collection, storage, and sharing operation follows the data minimization principle: collect only what is needed, retain only as long as necessary, and scope access as narrowly as possible. Presence data defaults to Tier 0 (anonymous). Proximity channel membership is opt-in only.

---

## The Only Allowed Data Path

```
External Event
    |
Route (normalize + append)
    |
Fact Sheet (append-only row)
    |
Match Sheet (deterministic rebuild)
    |
Summary Sheet (formula recalculation)
    |
KPI Binding (cell -> metric)
    |
Branch Timebox (metric -> geometry)
    |
Tree Motion (visible, auditable)
```

Every step is inspectable. Every step is reversible. Nothing is hidden.

---

## Blackbox Rejection Policy

Relay explicitly rejects opaque computation:

- **No LINEST, FORECAST, or regression functions** unless decomposed into visible intermediate cells
- **No hidden aggregation engines** -- if a value exists, its formula must be readable
- **No "magic KPI" logic** -- every metric must trace to a source cell
- If advanced math is needed: decompose it into visible intermediate sheets where each step produces inspectable cells

---

## Plug-and-Play Capability

To add a new business process module:

1. Create `config/modules/<module>-module.json` -- fact sheets + match sheets + summary sheets + KPI bindings
2. Create `config/routes/<module>-routes.json` -- external field -> column mappings
3. Call `loadRoutes()` + `loadModule()` -- no new engine code required

Modules are configurations, not code. The engine is frozen.

---

## Phase History

| Phase | What It Proved | Date |
|-------|---------------|------|
| A0-A0.4 | Pixel-perfect 3D-2D, cell geometry = timebox geometry | 2026-02-08 |
| B1 | Baseline fact sheets (explicit, append-only) | 2026-02-08 |
| B2 | Match sheets (explicit reconciliation) | 2026-02-08 |
| B3 | Summary sheets (formula-only aggregation) | 2026-02-09 |
| B3.5 | Transparency gate (dependency inspector) | 2026-02-09 |
| B4 | KPI -> branch mapping (provable recomputation chain) | 2026-02-09 |
| C0 | Route engine (config-driven data flow) | 2026-02-09 |
| D-Lens-0 | Focus frame (camera + dimming + breadcrumb) | 2026-02-09 |
| UX-1 | Universal Object Contract + Capability Buds + Inspector | 2026-02-09 |
