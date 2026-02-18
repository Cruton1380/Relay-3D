# Relay Master Build Plan (Full System) — 2026-02-16

## Execution Overlay (Restoration-First)

Execution order, completed build history, and queued slices are in Section 8 of this document.

---

**Status: CANONICAL — This is the definitive end-to-end build plan for Relay.**
**Supersedes: [RELAY-MASTER-BUILD-PLAN-PRE-UNIVERSAL.md](../../archive/superseded-docs/RELAY-MASTER-BUILD-PLAN-PRE-UNIVERSAL.md) (retained for history)**
**Updated: 2026-02-16 (Universal Tree Model integrated: filament identity, depth extrusion, pivot lens, normalized KPI, template registry, root compression)**


## 0. Canonical Goal (End-State)

Relay is a full ERP-replacement coordination and transaction OS. It is not a long-term wrapper around legacy ERP stacks. Relay is the canonical system of record for operational flows and financial state: procurement, receiving, invoicing, payments, inventory, and governance. Legacy systems may be bridged during transition, but the canonical truth, balancing, and audit provenance live in Relay.

Relay uses 3D cognition as operational truth mechanics, not a cosmetic view. Users have personal trees, the organization has system trees, and every material transaction is a conserved state transfer that is mirrored on both sides (system reality + human responsibility reality). Confidence is disclosed, refusals are explicit, and all material changes require authority-bound commits. Nothing is hidden.

**The One Sentence:**

> "Relay is continuous verification that makes everyone a coherence operator through consensual, non-destructive audits — where immutable facts flow through config-driven routes into visible sheets, reconcile through deterministic matchers, aggregate through inspectable formulas, and drive measurable tree motion through bound timebox metrics."

### 0.1 Scope Lock (Non-Negotiable)

- Relay replaces ERP layers end-to-end over phased rollout; external ERP/bank systems are transition bridges only.
- 3-way match is a posting gate, not just a report.
- Double-entry is a hard invariant for all material commits.
- Every posting must include both:
  - **System posting legs** (organizational state deltas)
  - **Mirrored responsibility legs** (user accountability deltas)
- A discrepancy can never disappear; it must move to an explicit container (variance, accrual, adjustment, reversal, etc.) via a balanced commit.

### 0.2 The Universal Tree Principle

> One event, one filament, one trace from cell to root. The tree shape IS the model. No connectors. No UI spaghetti. Pure structural causality.

The tree is not a visualization of data — it is the compressed, living representation of all filaments flowing through it. Branch radius, thickness, and deformation are driven by aggregated KPI metrics that trace back to individual cell values. Magnitude is visible as depth behind the 2D sheet grid, never as grid distortion. Categories are discovered by humans through Excel-like pivot exploration, never pre-declared. Only meaningful discoveries are promoted to KPI bindings through governance.

The complete structural trace for any atomic event:

```
Cell (2D grid, fixed size)
  → Depth Wall (behind sheet, log-scaled magnitude)
    → Pivot Lens (ephemeral sandbox grouping)
      → Match Sheet (deterministic rebuild)
        → Summary Sheet (formula recalc)
          → KPI Binding (normalized driver)
            → Branch Radius (aggregate delta)
              → Trunk Absorption (closed filaments thicken trunk)
                → Root Compression (commit-time cube)
```

---

## 1. Current System Truth (What Is Already Real)

### 1.1 Completed Phases (Proven, Locked)

- **Phase 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated (LCK-1/G3 PASS with hole-suite proof), auto-transition, primitives migration (all PASSED with proof artifacts)
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament length = cell length, spine aggregation bands (all PASS)
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder, QTY_EXCEPTION proof), summary sheets (cross-sheet formulas, AP_Aging/MatchRate/Spend), KPI branch mapping (config-driven, recomputation chain, 3D visual response) (all PASS)
- **C0**: Route engine — config-driven data flow, provenance, mock streams, dry-run preview (PASS)
- **D-Lens-0**: Focus frame — camera + dimming + breadcrumb + entity tracking + exit (PASS)
- **UX-1.1**: Universal Object Contract — `toRelayObject()` adapter (PASS)
- **UX-1.2**: Capability Buds — Space key context actions (PASS)
- **UX-1.3**: Inspector Context Switching (PASS)
- **W0-W2 baseline**: Material work-mode chain, object-bound artifacts, action-driven PROPOSE/COMMIT, and route-delta auto-HOLD baseline (PASS)

### 1.2 D0 Scale & Stress (Policy-Locked for Build Progress)

- Deterministic FPS sampling path is locked (`FORCED_RAF`) and non-hanging.
- Policy split is canonical:
  - strict truth metric (`D0.3-FPS`, `>=30`) is always logged
  - dev pass metric (`D0.3-FPS-DEV`, `>=20`) can drive `allPass` during feature work
- Mandatory policy proof line remains part of acceptance evidence.
- Strict performance optimization remains backlog and does not block correctness delivery.

### 1.3 Known Gaps in Completed Phases

- G1: Date functions (FIXED in D0.5)
- G2: Copy/paste range selection incomplete
- G3: Geographic boundaries RESTORED and PASS (runtime boundary restore + containsLL hole-suite proof captured and indexed under LCK-1)
- G4: 18+ missing proof artifacts from pre-A0 era
- G5: Legacy Phase 3-8 docs superseded by A0-C0
- G6: 15+ obsolete TODO markers
- G7: Module Completion Matrix outdated

### 1.4 Globe Restore Status (Controlled Slices)

**Completed and Locked**

- `GLOBE-RESTORE-0` ✅ PASSED/indexed: imagery registry + satellite toggle, world-only.
- `GLOBE-RESTORE-1` ✅ PASSED/indexed: weather + topography + separate globe services server (`:4020`), world-only and proof-isolated.
- `GLOBE-RESTORE-2A` ✅ PASSED/indexed: region/country hierarchy + clustering ladder (`gps/city/state/country/region/globe`) with branch/trunk Capability Bud actions (`cycleClusterLevel`, `focusNextRegion`, `loadGlobalCore`) and world globe APIs/hotkeys (`Alt+L`, `Alt+R`), world-only and proof-isolated.
- `GLOBE-RESTORE-3` ✅ PASSED/indexed: canonical region/boundary scope integration with deterministic geography fixture (`2 countries`, `3 regions`, `2 sites`), world-only scope overlays, governance scope visualization, and explicit cross-scope refusal rail (`GOV_SCOPE_VIOLATION`), proof-isolated.
- `GLOBE-RESTORE-4` ✅ PASSED/indexed: branch/site geospatial assignment + canonical in-world Scope Inspector (`PROPOSE`/`COMMIT` governed assignments, deterministic local assignment fixture, explicit scope-inspector logs, cross-scope refusal rail), world-only and proof-isolated.
- `GLOBE-RESTORE-3A` ✅ PASSED/indexed: static world dataset expansion with deterministic multi-country anchors (`world-dataset-v0.json`), world-only and proof-isolated.
- `USP-1` ✅ PASSED/indexed: UX Stabilization Pass v1 (imagery toggle, read-only boundary visibility, debug-log suppression mode, operator HUD grouping, multi-country anchor smoke) with OSV/headless parity unchanged.
- `HUD-1` ✅ PASSED/indexed: adaptive HUD with policy-driven params (`HUD-PARAMS-v0`), visible `policyRef/paramsVersion`, and inspector on-demand.
- `BOUNDARY-A1` ✅ PASSED/indexed: commit-governed boundary editor (`draft -> propose -> commit`) with geometry-hash verification and explicit invalid-geometry refusal rails.
- `VOTE-A2` ✅ PASSED/indexed: voting UI reactivation wired to canonical governance primitives with strict presentation/governance separation, eligibility freeze, and stage-lock refusal rails.
- `RESTORE-PARITY` ✅ PASSED/indexed: integrated restore capstone proof across profile isolation, globe stack, boundary editor, voting surface, HUD policy visibility, movement continuity, and regression rails.

**In Progress (Unproven)**

- None.

**Explicitly Not Included Yet**

- Social activation feature expansion beyond A2 voting surface
- Proximity lifecycle implementation (`F0.4`)
- MapLibre/Deck overlay restore (`GLOBE-RESTORE-2` deferred)

**Launch Mode Rule (Live Review)**

- **Proof mode (default)**: `http://localhost:3000/relay-cesium-world.html`
- **World mode (required for globe restore features)**: `http://localhost:3000/relay-cesium-world.html?profile=world`
- If world features are not visible while not using world mode, treat as launch/config issue, not feature regression.

### 1.5 Restoration Sequence (R0-R5 — All COMPLETE)

These restoration phases ran before net-new expansion and did not add physics. All are PASS with indexed proof artifacts.

- **R0 — Baseline Visibility Lock**: Replayable 30-60 second sequence (globe → building → company → sheet → edit → exit). Evidence: launch sequence proof log + screenshots at each stage.
- **R1 — HUD Consolidation**: One launch HUD. Tier 1 (always visible, max 6 lines): profile, mode, focus path, LOD, data status, world status. Tier 2 (collapsed): VIS summaries, budgets, gate summaries, last proof tags. No duplicate launch consoles/panels; dev panels dev-only.
- **R2 — Node Ring Grammar Visibility**: Visible semantic rendering (thickness = pressure, ripple rate = vote energy, color = state quality). Proof at required LOD tiers with acceptance logs.
- **R3 — Basin Rings at Shared Anchors**: Deterministic 1:many shared-anchor rendering without spheres. Stress proof for N=6, N=30, N=200 with budget logs.
- **R4 — Presentation Pipeline Upgrade**: Readability improvement without topology changes. Allowed (launch/world only): FXAA, subtle bloom, color correction, fog/haze, glass tiles, faint filament lighting.
- **R5 — Restoration Index / Manual**: Canonical manual at `docs/restoration/RESTORATION-INDEX.md`. Each entry includes: purpose, trigger, proving logs, owner files.

### 1.6 Completed Slice Queue (Post-Restoration)

All slices below are COMMIT/PASS with indexed proof artifacts:

1. `HUD-CONSOLIDATION-1` — PASS
2. `NODE-RING-RENDER-1` — PASS
3. `BASIN-RING-1` — PASS
4. `COMPANY-TEMPLATE-FLOW-1` — PASS
5. `VOTE-COMMIT-PERSISTENCE-1` — PASS
6. `FILAMENT-LIFECYCLE-1` — PASS
7. `FILAMENT-DISCLOSURE-1` — PASS
8. `LAUNCH-FIX-1` — PASS
9. `SCOPE-COHERENCE-1` — PASS
10. `ATTENTION-CONFIDENCE-1` — PASS (83c8702)
11. `VIS-TREE-SCAFFOLD-1` — PASS (c7db24b)
12. `HEIGHT-BAND-1` — PASS (7cbfcab)
13. `VIS-MEGASHEET-1` — PASS (bf050c7)
14. `CAM0.4.2-FILAMENT-RIDE-V1` — PASS
15. `PRESENCE-STREAM-1` — PASS
16. `PRESENCE-RENDER-1` — PASS
17. `PRESENCE-COMMIT-BOUNDARY-1` — PASS
18. `HEADLESS-0` — PASS
19. `E3-REPLAY-1` — PASS
20. `E1-CRYPTO-1` — PASS
21. `VIS-GRAMMAR-POLISH-1` — PASS
22. `FILAMENT-LIFELINE-1` — PASS
23. `VIS-LAUNCH-TREE-READABILITY-1` — PASS

Each slice shipped: code references, runtime screenshot/video, proof artifact + index entry, contract alignment.

### 1.7 Next Queued Slices

24. `DEMO-FLYBY-POLISH-1` — QUEUED (demo flyby choreography polish)
25. `PRE-FILAMENT-SPACE-1` — QUEUED (DraftNode cognitive scratch layer)
26. `FILAMENT-UNIT-2` — QUEUED (filament identity + depth extrusion + branch radius)
27. `PIVOT-LENS-1` — QUEUED (sandbox pivot engine)
28. `TEMPLATE-REGISTRY-1` — QUEUED (tree template system)
29. `ROOT-COMPRESSION-1` — QUEUED (commit-time archive)

---

## 2. Frozen Contracts (Never Violated)

These are enforced assumptions used by every phase. Source: [RELAY-PHYSICS-CONTRACTS.md](RELAY-PHYSICS-CONTRACTS.md)

1. **Fact sheets are append-only** — routes only append rows; never compute
2. **Match sheets are derived, visible, rebuildable** — pure deterministic function of facts. Deterministic means: stable sort order (match key lexicographic), stable tie-breaking rule (earliest provenance timestamp wins), and stable match ID generation (`match.<matchSheetId>.<deterministic-key>`). Same facts in any row order must produce byte-identical match sheets.
3. **Summary sheets are formula-only** — no JS aggregation, every cell is a formula. Determinism extends to all derived outputs: summary sheets and KPI bindings must produce canonical ordering (cell evaluation in topological dependency order) and canonical formatting (quantized numbers per the replay comparison rule in E3) so that replay and headless parity cannot diverge due to presentation, iteration order, or float formatting differences.
4. **KPI bindings read cells, not code** — config entries map summary cells to metrics

**Determinism extends to all derived outputs:** Match sheets, summary sheets, and KPI bindings must all produce canonical ordering and canonical formatting (quantized numbers, stable cell string formatting, stable key ordering) so that replay and headless parity cannot diverge due to presentation differences or iteration order. The match sheet determinism rules (stable sort, stable tie-break, stable IDs, byte-identical output) apply equally to summary evaluation order and KPI binding output.
5. **Tree motion only comes from timebox metrics** — no geometry change without traceable metric
6. **Routes only append rows, never compute** — normalize + append; recompute chain fires after
7. **No menus** — Capability Buds only
8. **One interaction grammar** — Universal Object Contract for every type
9. **No hidden formulas** — dependency inspector for every KPI cell
10. **LOD responds to measured pain only** — never speculative
11. **Undo after canon is always a revert** — visible scar, not erasure (source: commit materiality spec)
12. **Refusal is explicit** — no silent fallback, no best-guess
13. **Learning produces recommendations, not policy mutations** — authorityRef + versioned commit required
14. **Pressure is not authority** — pressure influences perception, never auto-executes
15. **Minimum required data, shortest retention, strictest scope** — data minimization invariant

### Universal Tree Contracts (16-19)

16. **Filament = atomic event** — 1 filament = 1 atomic economic/informational event, anchored at one origin cell, projecting into derived cells (match, summary, KPI). A filament is never a document, never a branch, never a KPI. The origin cell is the anchor; `refs[]` tracks derived cell projections. Every filament has: one sheet origin, one branch aggregation path, one trunk absorption point, one root compression representation.
17. **2D grid is sacred** — the sheet face never distorts. Cell size is always uniform. Magnitude lives behind the sheet as per-cell depth extrusion (`cellDepth = logScale(magnitude)`). Heatmap color is secondary. No cell width changes, no row height changes, no geometry distortion based on value.
18. **Pivot is a lens, not a data type** — pivoting never edits facts. A pivot lens is ephemeral and can be discarded. Categories are discovered by humans freely (any column, any grouping), never pre-declared by templates or modules. Binding a pivot as a KPI requires governance proposal (W1 PROPOSE → W2 COMMIT). Sandbox pivot = local graphics only; bound pivot = branch motion.
19. **Branch shrink safety** — a branch cannot shrink or vanish while ACTIVE filaments, HOLD filaments, or commits within the last N timeboxes exist. This prevents invisible unresolved work. Branch shrink/vanish is only permitted when the branch is explicitly empty and dormant.
20. **DraftNodes are pre-filament** — they exist only in W0, carry no magnitude, produce no depth extrusion, drive no branch motion, and auto-expire. Converting a DraftNode into a filament requires explicit formalization through the fact sheet append path. DraftNodes never enter the canonical data path, never appear in replay or headless mode, and never influence any metric or governance artifact.

### Blackbox Rejection Policy

No LINEST, FORECAST, regression, or opaque functions. Advanced math must decompose into visible intermediate sheets where every step is inspectable.

### The Only Allowed Data Path

```
External Event -> Route (normalize + append) -> Fact Sheet (append-only, spawns filament)
  -> Depth Wall (behind sheet, per-cell log-scaled extrusion)
  -> Pivot Lens (ephemeral sandbox view, user-driven grouping)
  -> Match Sheet (deterministic rebuild) -> Summary Sheet (formula recalc)
  -> KPI Binding (normalized driver: value × weight × confidence × direction)
  -> Branch Radius (aggregate delta from all bound KPIs)
  -> Trunk Absorption (closed filaments thicken trunk)
  -> Root Compression (commit-time cube with SHA-256 hash)
```

Every step is inspectable. Every step is reversible. Nothing is hidden.

**Worked Example: One Invoice Through the Full Trace**

An invoice arrives: $48,000, Vendor ACME, Dept Operations, January 2026.

1. **Route** normalizes JSON → appends row 7 to `P2P.InvoiceLines` (append-only).
2. **Filament** `F-INV-007` spawns (origin: `P2P.InvoiceLines.R7.C8`, amount: 48000, unit: $, state: OPEN).
3. **Depth wall**: `scale(48000) = log10(48001) / log10(maxAbsInView + 1)` → depth proportional to magnitude. A $5K cell is shallow; this $48K cell is medium-deep; a $500K cell would be much deeper.
4. **Pivot lens** (sandbox): User pivots InvoiceLines by Dept + Month → Ops/Jan cell shows `SUM($48K + other Ops invoices)`. Grid stays clean; depth wall behind the pivot cell updates.
5. **Match engine** joins PO-3001, GR-5001, INV-007 via `poLineId` → `P2P.ThreeWayMatch` row with `matchStatus=MATCH`.
6. **Summary formula**: `=COUNTIF(P2P.ThreeWayMatch!N2:N50,"MATCH") / COUNTA(P2P.ThreeWayMatch!N2:N50)` → 87.5%.
7. **KPI binding**: `matchRate` reads 87.5% from `P2P.MatchRateSummary!B8`.
8. **Normalization**: `normalizedValue = (87.5 - 50) / 50` → +0.75 (clamped to [-1, +1]).
9. **Branch delta**: `+0.75 × 0.8 weight × 0.95 confidence × +1 direction = +0.57`.
10. **On CLOSED**: filament archives into trunk; trunk thickens by normalized contribution; root compression cube stores `{commitIndex, filamentId, totalValue: 48000, dept: "Ops", hash: sha256(...)}`.

---

## 3. The 12 System Modules (A-L)

This is the full Relay system outline. Every forward phase maps to one or more of these modules. Source: [RELAY-FULL-SYSTEM-OUTLINE.md](docs/RELAY-FULL-SYSTEM-OUTLINE.md)

### Module A: Canon and Truth Model

- Canonical statement + safe language
- Git as OS; append-only commits as coordination events
- Commit materiality: DRAFT -> HOLD -> PROPOSE -> COMMIT -> REVERT
- Work zones: `zone.<company>.<dept>.<project>`
- Dialogue layers: ephemeral (24h) vs context (semi-persistent) vs commits (canonical)
- Revert = visible scar (new commit cancelling effects)

**Material Boundary Triggers (when transitions are forced)**

Edits that cross any of the following thresholds must force HOLD or PROPOSE — they cannot remain silent drafts:

- **Time threshold** — end of session, end of timebox cadence, or end of reconciliation window
- **Risk threshold** — edit affects payroll, payment, vendor terms, or any cell bound to a KPI
- **Visibility threshold** — edit is published to team, shared to a proximity channel, or exported
- **Dependency threshold** — edit affects downstream sheets, routes, summaries, or match sheets (the recompute chain crosses a module boundary)
- **Governance threshold** — edit changes policy, permission, stage gate definition, or authority delegation

The system detects threshold crossings by inspecting the edit's dependency graph (which sheets/KPIs/routes are affected) and the edit's scope (who can see it). If any threshold is crossed, the edit is automatically escalated from DRAFT to HOLD with a log:

`[MATERIAL] threshold=<risk|time|visibility|dependency|governance> target=<id> escalated=DRAFT->HOLD`

Example: `[MATERIAL] threshold=risk target=cell.P2P.InvoiceLines.R100.C7 escalated=DRAFT->HOLD reason="KPI-bound cell edited"`

The user must then explicitly PROPOSE or COMMIT with a boundary reason (`time`, `risk`, `dependency`, `visibility`, `governance`). Silent progression past a material boundary is a frozen-contract violation.

### Module B: Verification Physics

- Three-way match engine: Intent vs Reality vs Projection
- Pressure loop (6-step, continuous): Attest -> Compare -> Score -> Stage -> Verify -> Checkpoint
- 5 invariants: Pressure Budget (humane), Confidence Floor (honest), Repair Effectiveness (learning), Data Minimization (private), Policy Governance (governed)
- Resilience states: NORMAL -> DEGRADED -> INDETERMINATE -> REFUSAL
- ERI: score + confidence + missing inputs; never show certainty without coverage
- **Conservation gate for material commits:** if a commit changes system state, it must carry a validated balanced transfer packet (currency and/or quantity) or refuse with explicit reason.

### Module C: Cryptographic Architecture

- Leaf-level encryption; above leaf = hashes + signatures + Merkle roots
- Envelope encryption (one ciphertext + per-recipient wraps)
- Revocation via explicit commits + key rotation
- Selective disclosure via peer-to-peer plaintext + Merkle inclusion proof
- Core validates integrity/authorization, NOT plaintext content

**Cell-Level Permission Model (operational detail)**

Every cell is an independently encryptable leaf:

- **Encryption**: cell content encrypted with a symmetric content key; content key wrapped per-recipient using their public key (envelope encryption pattern B)
- **Metadata remains verifiable**: cell hash, signature, Merkle inclusion proof, author ID, timestamp, authority_ref — all remain in plaintext above the leaf. Anyone can verify the cell exists, is unaltered, and was authored with authority, without decrypting its content.
- **Selective disclosure**: to share a cell with a new recipient, wrap the content key for their public key and publish the wrap as a new commit. The recipient can then decrypt and verify via Merkle inclusion proof.
- **Revocation**: stop issuing new wraps + rotate the content key (explicit commit, append-only). You cannot "unshare" what was already decrypted — revocation prevents future access, not retroactive access. Revocation is itself a visible commit with reason.
- **Granularity**: encryption can be per-cell, per-row, per-sheet, or per-module depending on policy. The system supports mixed granularity within a single module.
- **Core rule**: the core validates integrity and authorization of commitments (hash chains, signatures, authority_ref). It never sees or requires plaintext content. Matching, summarizing, and KPI binding operate on decrypted content only in the user's local context.

### Module D: Data Structures and Storage

- Filaments as primary identity/time structure; files are projections
- Timeboxes as material slices (thick, with collision + flexible walls reflecting ERI + wilt over time)
- Deterministic snapshots with replay proof metadata
- Outbox pattern for downstream side effects
- Policies as filaments (commit-addressed, versioned)
- **TransferPacket (system truth object):** append-only posting packet containing typed legs `{containerRef, amount, unit, reasonCode}`; must net to zero per unit type.
- **ResponsibilityPacket (human truth object):** append-only mirrored packet on user tree recording asserted/approved/executed responsibility linked to the same commit/evidence.
- **Posting containers:** explicit UOC containers for Inventory, GRIR, AP, Cash/Bank, Variance, Budget/Commitment, and policy-defined extensions.
- **Commit-hook law:** TransferPacket validation is executed inside COMMIT materialization; direct financial state mutation outside COMMIT is forbidden.
- **Projection law:** ledger/journal/trial-balance are deterministic projections over validated transfer packets; they are never origin-write surfaces.

### Module E: Visualization World (3D Cognition)

- Spatial epistemology: Down=history, Surface=present, Outward=projection
- Core=reconciliation, Rings=basins, Filaments=append-only flow, Scars=reconciliation evidence
- Nothing orbits; everything flows
- One scene graph; lenses toggle visibility only

**Canonical LOD Scale Ladder (complete)**

Each tier is a lens over the same append-only state; it changes what is rendered and actionable, not what is true. Same direction semantics at every tier (Down=history, Surface=present, Outward=projection; nothing orbits; flows only).

Cosmographic scaffolding (global navigation — spatial partitions, not new truths):

- LANIAKEA — global index of all basins
- GALACTIC — major multi-org basins (continents of coordination)
- SECTOR — regional macro basins (Europe / North America / APAC)
- SOLAR_SYSTEM — country / jurisdiction basin cluster
- PLANETARY — Earth as canonical geospatial surface

Earth scales (geospatial truth reference):

- CONTINENT
- COUNTRY
- REGION (state / province)
- METRO (city area)
- SITE (plant / campus / port)
- FACILITY (buildings + yards)

Organizational scales (coordination basins):

- COMPANY
- DIVISION
- DEPARTMENT
- PROJECT / WORK_ZONE

Data scales (backward compatibility with 2D systems):

- MODULE (P2P, MFG, HR, etc.)
- FILE (Excel / CSV / API stream)
- SHEET / VIEW
- ROW
- CELL

LOD transition acceptance gate: `[LOD] <tierA> -> <tierB>` transitions must preserve:

Example: `[LOD] COMPANY -> SHEET breadcrumb="Earth > Avgol > Operations" selection=sheet.P2P.InvoiceLines preserved=true`

- Breadcrumb continuity (no "where am I?")
- Selection continuity (focused object remains focusable)
- Action continuity (capabilities consistent, only scoped)

### Module F: Globe / Geospatial (Cesium-first)

- ENU coordinate system (east/north/up per lat/lon)
- Tree anchored to real lat/lon; anchor marker independent of buildings
- Boundaries defined by commits; containsLL; local-up extrusion
- Core-routed global relationships (A -> Earth core -> B) as proof primitive
- Proof artifacts: each gate requires screenshot + console log + spec copy

**Anchor Resolution and Ownership (canonical)**

Anchors are not all equal. Relay treats location claims by resolution and authority class:

- **Country / city / building anchors are contextual only** (discovery/orientation lenses)
- **Floor / suite anchors are grouping aids** (optional, non-authoritative)
- **Proximity channel + device/hotspot anchors are authoritative** (ownership-capable)

Hard rules:

- **Building anchors are non-exclusive, non-owning, non-authoritative**
- **Buildings can represent anchor context but can never anchor truth or grant ownership**
- **Ownership requires physically verifiable presence + authority signatures + repeatable checks**
- **If anchor type is unknown, apply strict fail-safe: contextual only (no ownership rights)**

Reasoning:

- Buildings are coarse, multi-tenant, authority-ambiguous, and time-variant
- Proximity/device anchors are precise, naturally sharded, and auditable over time

This preserves the core invariant: truth anchors are ENU/lat-lon + signed commitments, never map assets.

### Module G: Company Tree / Spreadsheet Filament System

- Topology: Core -> Trunk -> Branches -> Sheets -> Cells (no hubs)
- Sheet orientation: normal = -T (branch tangent), axes = N x B
- Cells are explicit geometry; each has tip anchor
- Two-stage filaments: Cell->Spine (one per cell), Spine->Branch (one per sheet)
- Formula dependency graph + topological order; cycles = refusal/scar
- Material time-lanes: cell has time-lane + timecubes; parallel identity preservation
- **Dual-tree accounting projection:** each material COMMIT updates both organization state trees and actor responsibility trees, linked by shared `commitId`, `evidenceHash`, `objectId`, and `proposalId`.

### Module H: HUD and Interaction

- HUD as lens and command card, not dashboard authority
- Controls: HOLD / RECONCILE / FORK / MERGE
- World-up flight, pointer lock, safe HOLD behavior
- Inspectors: Timebox, Filament, Provenance
- Training embedded: object-local training units; STOP/HOLD/FORK for learning

**Interaction Micro-Invariants (prevent chaos)**

These are small but critical UX safety rules enforced at all times:

- **No accidental pointer lock toggles** — free-fly mode activates on explicit keyboard action only, never on mouse click on the canvas
- **Edit mode captures all keyboard input** — when a cell is being edited, camera controls are disabled; Enter commits, Esc cancels; no camera movement while typing
- **No ambient permissions** — every action originates from Capability Buds (Space key) or the Inspector panel, never from hidden hotkeys or implicit gestures; if a user didn't explicitly request an action, it doesn't happen
- **Deterministic rerender** — the same state always produces the same visual; view changes (LOD, focus, filter) rerender the tree deterministically; no random layout shifts
- **Inspector never blank, never wrong type** — Inspector always shows context for the currently selected/focused object; if nothing is selected, Inspector shows the current scope summary (branch/module); it never shows stale data from a previous selection

### Module I: Governance and Human Workflows

- Governance cadence: decision rhythm, reconciliation windows, sunset rules
- Stage gates: each phase has pass/fail, proof artifacts, refusal conditions
- Stigmergic coordination: traces in environment, not messaging

**Human Process Modules (HR, Policy, Communication)**

- **HR policies as versioned filaments**: every HR policy (onboarding, performance review, compliance check, training requirement) is a commit-addressed filament with explicit version history. Policies never silently change — each update is a new commit with before/after and authority_ref. Old versions are preserved, inspectable, and replayable.
- **Recurrence schedules as governed policy**: recurring events (annual reviews, quarterly compliance, monthly reconciliation) are governed recurrence policies, not hidden cron jobs. Each recurrence produces a timebox with expected deliverables. Missing deliverables create pressure (wilt), not automatic escalation.
- **Email/thread discipline as workflow artifacts**: one topic per thread; summaries required at decision points; no "silence-as-approval" (explicit acknowledgment required). Thread rules are themselves policy filaments — visible, versioned, enforceable.
- **Decision cadence**: decision rhythm (weekly/monthly/quarterly/event-triggered) governs when governance gates are checked. Sunset rules: proposals > 90 days without quorum expire; policies > 1 year without review are flagged; relationships > 6 months without activity are archived. All sunsets are logged commits, not silent deletions.
- **Onboarding as flow**: new user onboarding is delivered as a Flow Channel (F0) — a recorded procedure that the new user runs, with semantic steps, expected outcomes, and completion markers. This replaces "read these docs" with "do this guided tour."

### Module J: Code IDE and Developer Experience

- Core renderer-agnostic vs app (Cesium) adapters
- Topology lint, ENU correctness, LOD stability, one-graph enforcement
- Commit types: visual (BOUNDARY_DEFINE, TREE_ANCHOR_SET) + work (TASK_, POLICY_, REFUSAL_)
- CI: forbidden-language lint, gate tests before phase progression

### Module K: Optional/Future Modules

- File organization: local-only observer -> planner (dry run) -> approval -> execute
- Integrations: optional migration/bridge connectors (ERP/AP/Bank/tax) via outbox + attestations; never source-of-truth over Relay core
- Desktop OS overlay (map all documents like treespace) — deferred until core ERP proven

### Module L: Presence & Agents (Humans + SCVs + Trails)

This module is required before Flow Channels and Proximity Channels can operate. It defines how humans and AI agents appear, move, and interact in the 3D world without violating consent, privacy, or authority rules.

**L.1 Presence Primitives (no new truth layer) ✅ PASSED (v0)**

- **PresenceMarker**: user/agent location + gaze direction + current focus target (object id)
- **PresenceTrail**: optional ephemeral path trace (where I walked / what I inspected); auto-expires per policy
- **PresenceTier** (consent-gated visibility):
  - Tier 0: anonymous dot (default for all users; no identity revealed)
  - Tier 1: identifiable role badge (with explicit consent per session)
  - Tier 2: named identity (explicit consent + policy approval)
- Tier defaults to 0; escalation requires mutual consent
- Presence data follows data minimization invariant: minimum required, shortest retention, strictest scope

**L.2 SCV Presence (AI agents as visible operators, not hidden automation) ✅ PASSED (v0)**

SCVs appear in the world as first-class visible entities:

- Marker + label: `SCV: Coherence`, `SCV: Procurement`, `SCV: Compliance`
- Current focus target (what it is inspecting) — always visible
- Status: NORMAL / DEGRADED / INDETERMINATE / REFUSAL
- Capability list: "what it can do" (inspectable via Universal Object Contract)

**Hard rule: SCVs do not execute changes.** They produce:

- Inspections (read-only findings)
- Findings (rows in a findings sheet, traceable)
- Proposed commits (require human consent / authorityRef to materialize)
- Recommended flows (draft flow channels for human review)
- Evidence bundles (for audit requests)

SCVs are subject to all frozen contracts: pressure budget, confidence floor, data minimization, policy governance.

**L.3 Audit Requests (Manager -> SCV interaction flow) ✅ PASSED (v0)**

Managers do not "command AI." Managers issue **scoped audit requests**:

- **Request creation**: Manager clicks object -> Capability Bud -> "Request Audit"
- **Request contents**:
  - Target objects (module / branch / sheet / cell)
  - Desired output (finding, proposed commit, flow draft, evidence bundle)
  - Constraints (timebox scope, privacy boundary, allowed actions)
  - authorityRef (if the SCV is allowed to create proposals)
- **Request lifecycle**:
  1. Request created in Work Zone as a visible task artifact
  2. SCV accepts task (visible marker moves to target)
  3. SCV produces findings / flow draft / proposed commit
  4. Manager (or authorized party) approves or rejects
  5. If approved: proposed commit materializes via normal commit path
- **Stage gates apply**: if request targets future-stage mechanics, SCV returns `[REFUSAL] reason=STAGE_LOCKED`

Logs:

- `[AUDIT] request-created target=<id> scope=<zone> constraints=...`
- `[AUDIT] scv-assigned scvId=<id> requestId=<id>`
- `[AUDIT] findings-produced count=<n> trace=<...>`
- `[AUDIT] proposal-created commitId=<id> requiresApproval=true`
- `[AUDIT] approved|rejected by=<userId> requestId=<id>`

Example: `[AUDIT] request-created target=sheet.P2P.ThreeWayMatch scope=zone.avgol.ops constraints="timebox=2026-Q1,actions=findings-only"`
Example: `[AUDIT] scv-assigned scvId=scv.coherence requestId=audit.7f3a`
Example: `[AUDIT] findings-produced count=3 trace=match.3WM.INV1001-PO2001-GR3001,match.3WM.INV1044-PO2044-GR3044,match.3WM.INV1099-PO2099-GR3099`
Example: `[AUDIT] approved by=eitan requestId=audit.7f3a commitId=commit.b4c5d6`

Example: `[AUDIT] request-created target=module.P2P scope=zone.avgol.ops constraints=timebox:2026-Q1,actions:read-only`
Example: `[AUDIT] scv-assigned scvId=scv.coherence requestId=audit.007`
Example: `[AUDIT] findings-produced count=3 trace=sheet.P2P.InvoiceLines:R14,R22,R89`
Example: `[AUDIT] approved by=eitan requestId=audit.007 commitId=commit.b2c3d4`

**L.4 Movement Modes (for both human POV and SCV POV)**

- **Free flight**: world navigation (existing)
- **Basin orbit assist**: soft lock, optional, never traps (existing CAM0.2)
- **Filament ride**: move along a filament / time axis with scrubbing; timeboxes as snap points
- **Branch walk**: move along responsibility axis, snapping to sheets / timeboxes at each node
- **Flow playback**: guided movement using recorded keyframes + semantic steps

Timeboxes as movement anchors:

- Jump to start/end of a timebox (animated, never teleport)
- Scrub within timebox (history browsing)
- Collision/resistance is UX assist only; must never trap

Movement acceptance gate: running a flow or riding a filament must always show:

- Where you started
- Where you are now
- What boundary you crossed (timebox / scope / stage)

Acceptance logs:

- `[PRESENCE] user=<id> focus=<objectId> tier=<0|1|2>`
- `[PRESENCE] scv=<id> task=<auditId> status=<...>`
- `[SCV] proposedCommit=<id> requires=<authorityRef|approval|stageGate>`
- `[MOVE] mode=<free|basin|filament|branch|flow> target=<id>`

Example: `[PRESENCE] user=eitan focus=sheet.P2P.InvoiceLines tier=1`
Example: `[PRESENCE] scv=scv.coherence task=audit.7f3a status=NORMAL`
Example: `[SCV] proposedCommit=commit.e8f9a0 requires=authorityRef:policy.governance.v2`

Example: `[PRESENCE] user=eitan focus=sheet.P2P.InvoiceLines tier=2`
Example: `[PRESENCE] scv=scv.coherence task=audit.007 status=findings-complete`
Example: `[SCV] proposedCommit=commit.c3d4e5 requires=authorityRef:policy.governance.v2,approval:manager`
Example: `[MOVE] mode=branch target=branch.avgol.ops action=snap-to-sheet selection=sheet.P2P.InvoiceLines`

**L.5 PresenceStream (Live Video/Audio/Screen Share — Ephemeral)**

Live media communication layer for real-time coordination calls inside the 3D world. Video is "photorealistic" because it is real camera frames rendered as textures — not 3D avatar geometry.

**L.5.1 Architecture — Three Layers**

- **Ephemeral presence (live)**: WebRTC audio/video/screen-share streams. Not append-only, not canonical truth. Exists only during a session/timebox. Can be dropped without breaking replay. Follows VIS-7a pattern: TTL-based, auto-cleanup.
- **Render surface (derived)**: Video textures on presence card objects. LOD-governed. Frame-by-frame rendering, no storage.
- **Commit boundary (optional canonical)**: If participants choose, a call summary artifact enters the tree via existing W0-W2 material artifact chain. Contains only metadata + evidence hashes — never raw media.

**L.5.2 Signaling & Transport**

- WebRTC signaling (offer/answer/ICE) reuses existing VIS-6c WebSocket transport (`ws://127.0.0.1:4031/vis7`) with new event type `type: "rtc-signal"`
- No second WebSocket connection — proven infrastructure reused
- STUN/TURN config injected via environment (no hardcoded servers)
- Room ID = hash of `effectiveScope` (auto-join when scope matches)
- Event schema: `{ type:"rtc-signal", subtype:"offer|answer|ice|join|leave", userId, roomId, scope, targetUserId, payload }`

**L.5.3 Presence Card Objects (Video Textures)**

Each participant renders as a "presence card" — a billboard/entity with live `<video>` element as texture.

LOD behavior (integrated into existing LOD governor):

| LOD Level | Rendering | Budget |
|-----------|-----------|--------|
| LANIAKEA–REGION | Suppressed (same as VIS-7a) | 0 primitives |
| COMPANY | Dot + name initials (reuse VIS-7a markers) | Same as VIS-7a budget |
| SHEET | Video card (billboard, 64×48 texture) | Max 8 cards |
| CELL | Call stage panel (256×192 or overlay) | Max 4 stages |

Object contract: `presenceStream` type in `relay-object-contract.js` ACTION_REGISTRY. Actions: focusUser, muteToggle, pinStream, expandStage. Exposed via `toRelayObject()` per Contract #8.

**L.5.4 Scope Binding**

- Calls bind to `effectiveScope` (from SCOPE-COHERENCE-1), not to a separate "room" concept
- Scope change = stream visibility recalculated (existing scope coherence guard applies)
- Cross-scope calls require boundary disclosure (when E4 multi-company topology is live)
- Until Work Zones (Module A) are implemented at runtime, scope binding uses `effectiveScope` directly

**L.5.5 Commit Boundary (Optional Call Summary)**

When participants choose to create a record, the system writes a material artifact via existing W0-W2 chain:

```json
{
  "type": "callSummary",
  "roomId": "<roomId>",
  "scope": "<effectiveScope>",
  "participants": ["user1", "user2"],
  "startTs": "<ISO>",
  "endTs": "<ISO>",
  "scopeBindings": ["sheet.P2P.InvoiceLines", "branch.ops"],
  "evidenceRefs": {
    "recordingHash": "<sha256>",
    "transcriptHash": "<sha256>",
    "keyframeHashes": ["<sha256>"]
  },
  "consent": { "allParticipantsAgreed": true, "consentTs": "<ISO>" }
}
```

Rules:
- Commit requires **all participants to consent** (visible consent prompt, not implicit)
- No raw media stored in canon — only hashes/references
- Follows DRAFT → PROPOSE → COMMIT lifecycle (standard W0-W2)
- Consent denial → `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED`

**L.5.6 Privacy & Data Minimization (Contract #15 Compliance)**

- Default video = Tier 0 (off). Audio/video escalation follows existing PresenceTier consent model.
- Streams are ephemeral — no recording without explicit all-party consent visible to everyone
- No silent capture, no hidden recording
- Retention = session only unless committed via L.5.5 boundary
- Presence stream data follows data minimization invariant: minimum required, shortest retention, strictest scope
- Video never used for performance evaluation (policy-locked, same as L.1)

**L.5.7 What L.5 Explicitly Excludes**

- No 3D photoreal avatars (real video is the photorealism)
- No environment photorealism (tree stays legible, not cinematic)
- No always-on recording (violates Contract #15)
- No chat system (separate primitive — text presence, not video presence)
- No multi-company calls until E4 multi-company topology is live
- No proximity-triggered calls until F0.4 proximity channels are live

Acceptance logs:

- `[VIS8] streamEngine enabled maxParticipants=8`
- `[VIS8] join user=<id> room=<roomId> scope=<scope> result=PASS`
- `[VIS8] signal type=<offer|answer|ice> from=<id> to=<id> result=PASS`
- `[VIS8] leave user=<id> room=<roomId> reason=<manual|ttl|error>`
- `[VIS8] renderCard user=<id> lod=<dot|card|stage> scope=<scope> result=PASS`
- `[VIS8] lodSwitch user=<id> from=<lod> to=<lod> trigger=<cameraHeight|scopeChange>`
- `[VIS8] commitBoundary room=<roomId> participants=<n> consent=<all|denied>`
- `[REFUSAL] reason=STREAM_ROOM_CAP_EXCEEDED room=<roomId> active=8`
- `[REFUSAL] reason=VIS8_CARD_BUDGET_EXCEEDED scope=<scope>`
- `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED room=<roomId> deniedBy=<userId>`

**L.5.8 Slice Decomposition (Three Independently Provable Slices)**

L.5 ships as three slices, each with its own proof gate:

- **PRESENCE-STREAM-1** (Signaling + Ephemeral Streams):
  Signaling relay on VIS-6c WS (port 4031), event type `rtc-signal`. Room ID = `effectiveScope` hash. Max 8 participants; excess → `[REFUSAL] reason=STREAM_ROOM_CAP_EXCEEDED`. STUN/TURN config via environment. Stream data never stored.
  Allowed files: `app/presence/stream-manager.js`, `relay-cesium-world.html`, `server.js`, `scripts/presence-stream-proof.mjs`, `docs/vis/VIS-8-PRESENCE-STREAM.md`.
  Proof gate: `[VIS8-PROOF] gate-summary result=PASS stages=6/6`

- **PRESENCE-RENDER-1** (Video Textures + LOD):
  Prerequisite: PRESENCE-STREAM-1 PASS + VIS-TREE-SCAFFOLD-1 PASS.
  `<video>` element per stream → `Cesium.Material` image. Billboard entity per participant (camera-facing). LOD: COMPANY=dot, SHEET=card (64×48), CELL=stage (256×192). Budget: max 8 cards, max 4 stages. `presenceStream` type in ACTION_REGISTRY with UOC actions.
  Allowed files: `app/renderers/filament-renderer.js`, `app/presence/stream-manager.js`, `app/ux/relay-object-contract.js`, `relay-cesium-world.html`, `scripts/presence-render-proof.mjs`.
  Proof gate: `[VIS8-RENDER-PROOF] gate-summary result=PASS stages=8/8`

- **PRESENCE-COMMIT-BOUNDARY-1** (Optional Canonical Summary):
  Prerequisite: PRESENCE-RENDER-1 PASS + W0-W2 PASS.
  Commit requires all-party consent (visible prompt). No raw media in canon. DRAFT → PROPOSE → COMMIT lifecycle. Consent denial → `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED`.
  Allowed files: `app/presence/stream-manager.js`, `relay-cesium-world.html`, `app/ux/relay-object-contract.js`, `scripts/presence-commit-proof.mjs`.
  Proof gate: `[VIS8-COMMIT-PROOF] gate-summary result=PASS`

---

## 4. Universal Tree Model (The Structural Epistemology)

This section defines the seven architectural primitives that make Relay domain-agnostic. Together they ensure that any topic — procurement, manufacturing, music production, personal life management, or a five-country corporation — can be mapped to one canonical tree structure with the same rendering, auditing, and governance guarantees.

These primitives are not optional add-ons. They are the structural backbone that connects raw facts to visible tree motion. The chain begins before structured data exists — at the cognitive edge where humans jot fragments before they become formal objects.

### 4.1 Pre-Filament Space (DraftNode — The Cognitive Epidermis)

The data path assumes structured events. But human cognition does not start structured. It starts with fragments: an incoming RFQ before it becomes a PR. A note scribbled in the margin before it becomes a formal invoice line. A half-formed category idea before it becomes a pivot grouping.

If capturing that early thought requires opening a sheet, naming a column, defining a schema, or saving a file, the flow breaks. Relay is supposed to remove fragility, not enforce it at the earliest cognitive stage.

DraftNodes are the pre-filament layer — "sap droplets" forming at the outer bark of the tree before entering the vascular system.

**Definition:** A DraftNode is a spatially anchored, ephemeral cognitive fragment that exists outside the canonical data path. It is pre-filament potential.

A DraftNode is NOT:
- A filament (no atomic event identity)
- A fact row (no sheet, no column, no schema)
- A cell (no grid position)
- A commit (no governance chain)
- A KPI input (no magnitude, no branch effect)

A DraftNode IS:

```json
{
  "DraftNode": {
    "draftId": "draft.<uuid>",
    "surfaceRef": "branch.avgol.ops|sheet.P2P.InvoiceLines|trunk.avgol",
    "position": { "x": 0, "y": 0, "z": 0 },
    "content": "free text, sketch reference, or voice-to-text transcript",
    "tags": ["vendor-issue", "check-with-finance", "Q2-concern"],
    "createdBy": "user.<id>",
    "createdAt": "ISO-8601",
    "state": "DRAFT_ONLY",
    "convertible": true,
    "ttl": 604800,
    "linkedDraftIds": ["draft.<uuid>"],
    "convertedTo": null
  }
}
```

**The 6 DraftNode Rules (Non-Negotiable):**

1. **W0-only**: DraftNodes exist only in the DRAFT work state. They never enter HOLD, PROPOSE, or COMMIT. They are invisible to governance.
2. **No KPI effect**: DraftNodes carry no magnitude. They produce zero branch motion. They are structurally inert.
3. **No depth extrusion**: DraftNodes have no numeric value. No wall appears behind the sheet for a DraftNode.
4. **No branch motion**: DraftNodes do not participate in the `branchRadiusDelta` formula. They are outside the KPI path.
5. **No commit chain**: DraftNodes are not hashed, not Merkle-anchored, not replayed. They are ephemeral by design.
6. **Auto-expires**: DraftNodes have a TTL (default 7 days). If untouched (no edit, no tag change, no link), they fade and are garbage-collected. No scar, no log, no trace. They simply evaporate.

**Convert-to-Filament Path:**

When a DraftNode is ready to become structured:

1. User selects the DraftNode → Capability Bud → "Formalize"
2. System opens the target fact sheet with content pre-filled from the DraftNode text
3. User completes the required schema fields (column mapping)
4. Normal fact sheet append occurs → filament spawns per Section 4.2
5. DraftNode's `convertedTo` field is set to the new `filamentId`
6. DraftNode is marked as converted and fades from view (not deleted — just visually suppressed)

The conversion is explicit. It never happens automatically. The system never guesses which sheet or schema a DraftNode belongs to.

Log: `[DRAFT] convert draftId=<id> target=<filamentId> sheet=<sheetRef>`
Example: `[DRAFT] convert draftId=draft.a7b3 target=F-INV-3002 sheet=sheet.P2P.InvoiceLines`

**Spatial Rendering:**

DraftNodes render as small, translucent markers at the outer edge of their attached surface:
- On a branch: positioned at maximum orbital distance, like dew drops on bark
- On a sheet edge: positioned just outside the grid boundary
- On the trunk: positioned at the trunk surface, near the top

Visual properties:
- Shape: small sphere or teardrop (distinct from filament geometry)
- Color: neutral gray with subtle pulse (alive but not urgent)
- Alpha: 0.4 (clearly secondary to canonical objects)
- Size: 3-5 pixels at default zoom

**LOD Behavior:**
- **CELL LOD**: Individual DraftNodes visible with content preview on hover
- **SHEET LOD**: DraftNodes visible as small dots along sheet edge
- **BRANCH LOD**: Suppressed (only a count badge if > 0 DraftNodes exist)
- **COMPANY LOD**: Fully suppressed
- **GLOBE LOD**: Fully suppressed

**Clustering:** When 5+ DraftNodes accumulate on the same surface, they collapse into a "thought cloud" indicator — a single translucent cluster with a count badge. Clicking the cluster expands to show individual nodes.

**DraftNode Tags and Pivot Interaction:**

DraftNodes can carry free-form tags (strings). These tags are not schema columns — they are unstructured labels the user assigns freely. The pivot lens (Section 4.4) can optionally include DraftNode tags as a grouping dimension for exploratory category discovery. This creates a bridge between unstructured margin notes and structured pivot analysis — without requiring the notes to be formalized first.

**What DraftNodes Do NOT Do:**
- Do NOT enter the canonical data path (no route, no fact sheet, no match, no summary)
- Do NOT influence any KPI, branch radius, trunk thickness, or root compression
- Do NOT persist beyond their TTL unless actively maintained
- Do NOT create governance obligations (no HOLD, no PROPOSE, no approval needed)
- Do NOT appear in replay, headless mode, or deterministic verification
- Do NOT count as "work" for filament turnover metrics

Logs:
- `[DRAFT] create draftId=<id> surface=<surfaceRef> user=<userId>`
- `[DRAFT] tag draftId=<id> tags=[<tags>]`
- `[DRAFT] link draftId=<id> linkedTo=<draftId>`
- `[DRAFT] convert draftId=<id> target=<filamentId> sheet=<sheetRef>`
- `[DRAFT] expire draftId=<id> reason=TTL_EXCEEDED age=<days>`
- `[DRAFT] cluster surface=<surfaceRef> count=<n>`

Example: `[DRAFT] create draftId=draft.a7b3 surface=branch.avgol.ops user=eitan`
Example: `[DRAFT] tag draftId=draft.a7b3 tags=[vendor-issue, check-with-finance]`
Example: `[DRAFT] expire draftId=draft.c4d5 reason=TTL_EXCEEDED age=8d`

### 4.2 Filament Identity Contract (Locked)

**Definition:** A filament represents one atomic economic/informational event, materialized at one origin cell, traceable through one commit path. It is the indivisible quantum of work in Relay.

A filament is NOT:
- A whole sheet
- A whole document
- A branch
- A KPI
- A connector or arc between objects

A filament IS:

```json
{
  "Filament": {
    "filamentId": "F-<objectType>-<objectId>",
    "originCellRef": "cell.<moduleId>.<sheetId>.R<row>.C<col>",
    "objectId": "INV-3001|PO-5001|CAD-REV3|TICKET-8821",
    "objectType": "P2P_INV|P2P_PO|P2P_GR|CAD_REVISION|SUPPORT_TICKET",
    "amount": "48000.00",
    "unit": "$|%|qty|score|time",
    "templateId": "template.p2p-company|template.music-production",
    "branchId": "branch.avgol.ops",
    "refs": [
      "cell.P2P.ThreeWayMatch.R12.C3",
      "cell.P2P.MatchRateSummary.B8"
    ],
    "lifecycleState": "OPEN|ACTIVE|HOLD|CLOSED|ABSORBED",
    "workState": "DRAFT|PROPOSED|COMMITTED|REVERTED",
    "disclosureTier": 0,
    "commitIndexRange": { "start": 412, "end": null },
    "magnitude": "48000.00"
  }
}
```

**Invariant Rules:**

1. 1 filament = 1 atomic event. A PO line is one filament. An invoice line is a separate filament. They are NOT the same filament — they are linked by match keys (`poLineId`), not by identity.
2. Every fact sheet cell that records an atomic event spawns exactly one filament.
3. One filament is anchored at exactly one origin cell (the `originCellRef`). But it can project into multiple derived cells (`refs[]`) across match sheets, summary sheets, and KPI bindings.
4. Every material commit absorbs exactly 1 filament (or a bounded set of filaments in a batch commit).
5. Every filament has: one sheet origin → one branch aggregation path → one trunk absorption point → one root compression representation.
6. Filament magnitude is always the absolute numeric value from the origin cell (if numeric). Non-numeric events have `magnitude: null` and do not contribute to depth extrusion.

**Filament Dual State Machines:**

Work state machine (external, human-facing):
```
DRAFT → PROPOSED → COMMITTED → REVERTED (visible scar)
```

Lifecycle state machine (internal, system-facing):
```
OPEN → ACTIVE → HOLD → CLOSED → ABSORBED
```

- OPEN: filament spawned, fact row appended, no match attempted yet.
- ACTIVE: filament is participating in active match/summary computations.
- HOLD: filament is paused (governance hold, mismatch under resolution).
- CLOSED: filament lifecycle is complete (match resolved, payment settled, obligation met).
- ABSORBED: filament has been absorbed into trunk (commit-time compression). Filament metadata persists in root cube.

**Inward Movement Rule:** Filaments always move inward: cell → timebox slab → spine → branch → trunk → root. They never move outward. Outward "projection" in the data path (cell value appearing in a summary) is a read-only reference, not a movement of the filament itself.

**Closure Enforcement:** A filament cannot transition from ACTIVE to CLOSED without satisfying all KPI bindings it participates in. If any bound summary cell still depends on the filament's origin cell and the computed value would change upon removal, the filament remains ACTIVE.

**Turnover Metric:** `filamentTurnover = closedFilaments / totalFilaments` per timebox per branch. This is a health metric: healthy branches turn over filaments steadily. Stagnant branches accumulate HOLD states and wilt.

Logs:
- `[FILAMENT] spawn id=<filamentId> origin=<cellRef> magnitude=<value>`
- `[FILAMENT] transition id=<filamentId> from=<state> to=<state>`
- `[FILAMENT] absorb id=<filamentId> trunkCommitIndex=<n>`

Example: `[FILAMENT] spawn id=F-INV-3001 origin=cell.P2P.InvoiceLines.R7.C8 magnitude=48000.00`
Example: `[FILAMENT] transition id=F-INV-3001 from=OPEN to=ACTIVE trigger=match.3WM.INV3001-PO5001-GR7001`
Example: `[FILAMENT] absorb id=F-INV-3001 trunkCommitIndex=847 rootCubeHash=sha256:a7b3...`

### 4.3 Depth Extrusion Contract (Magnitude Behind the Sheet)

The 2D sheet face is sacred and fixed. Magnitude lives behind the sheet as per-cell vertical extrusion volumes.

**Visual Model:**

```
Front view (looking at sheet face):
┌──────┬──────┬──────┐
│  $5K │ $48K │$500K │   ← clean 2D grid, uniform cell sizes
├──────┼──────┼──────┤
│  $1K │ $12K │ $95K │
└──────┴──────┴──────┘

Side view (looking at sheet edge):
|2D GRID|
         ██████████████  ← $500K: deep wall
         ████████        ← $48K: medium wall
         ██              ← $5K: shallow wall
         █               ← $1K: very shallow
         ███████         ← $12K: medium-shallow
         ██████████      ← $95K: fairly deep

Further back: timebox slabs stacked by time period
```

**Scale Algorithm:**

```
cellDepth = log10(1 + |magnitude|) / log10(1 + maxAbsInView)
```

Where `maxAbsInView` is the maximum absolute magnitude of any visible cell in the current view. This ensures:
- Zero-magnitude cells have zero depth (no wall).
- Small values produce shallow walls.
- Large values produce deeper walls.
- The scale is relative to the current view, maintaining visual contrast.

**Negative Value Rule:** Negative magnitudes extrude in the opposite direction (two-sided wall). A cell with `magnitude = -15000` produces a wall on the opposite side of the sheet from positive values. This naturally separates debits from credits, losses from gains, without any UI convention.

**Heatmap Color (Secondary Channel):**

Cell depth extrusion surfaces are colored by heatmap proportional to normalized magnitude:
- Low magnitude (< 25th percentile): cool blue-green
- Medium magnitude (25th-75th percentile): warm yellow-orange
- High magnitude (> 75th percentile): hot red
- Negative magnitudes: distinct cool palette (purple-blue range) to visually separate sign

**LOD Collapse Rules:**

The depth extrusion rendering scales with LOD to maintain performance:

- **CELL LOD**: Individual per-cell depth extrusion. Full detail. Each cell has its own wall.
- **SHEET LOD**: Grouped extrusion. Cells aggregate into column or row bands. Depth reflects the sum or average of the group.
- **DEPARTMENT/BRANCH LOD**: Aggregate slab thickness per timebox. Individual cells not visible; branch radius communicates magnitude.
- **COMPANY LOD**: Branch radius only. Depth walls suppressed. KPI aggregate drives the visual.
- **GLOBE LOD**: Trunk radius only. All detail collapsed.

**Rendering Primitives:**

Each depth extrusion is a `BoxGeometry` positioned behind the sheet face:
- Position: `cellCenter + sheetNormal * (cellDepth / 2)` (behind the sheet)
- Dimensions: `cellWidth × cellHeight × cellDepth`
- Material: semi-transparent with heatmap color, alpha scales with LOD

**Timebox Alignment:**

Depth extrusions from cells in the same timebox period visually align into a "slab band" when viewed from the side. This creates the appearance of a stacked wall where each layer represents one timebox period, and the per-cell depth within that layer shows relative magnitude.

**Future Multi-Channel Depth (Reserved):**

The current depth extrusion model is numeric-magnitude-only (currency, quantity). However, the architecture must eventually support additional depth channels for non-numeric dimensions: confidence, risk, urgency, quality, probability, and narrative weight. When implemented, each channel would produce an independent extrusion layer behind the sheet, visually stacked or color-coded to distinguish dimensions. The schema reserves a `depthChannels` field for this purpose. No implementation is required now — this note ensures the architecture does not preclude multi-channel depth when the need is measured.

Logs:
- `[DEPTH] render sheet=<sheetId> cells=<count> maxDepth=<value> lod=<tier>`
- `[DEPTH] collapse lod=<tier> from=<cellCount> to=<groupCount>`

### 4.4 Pivot Lens Contract (Sandbox Discovery)

The pivot lens is the bridge between raw facts and meaningful categories. It is an ephemeral, Excel-like view that lets users group, measure, and explore data freely. It is NOT a data type, NOT a schema, NOT a module configuration.

**Core Principle:** Categories are discovered by humans, not pre-declared by the system. A user can pivot on any column, any grouping, at any time, without governance overhead. The system responds graphically to every pivot action.

**Pivot Mechanics:**

Given a fact sheet:
```
| InvoiceId | Vendor | Amount  | Dept    | Month | CostCenter |
|-----------|--------|---------|---------|-------|------------|
| INV-001   | ACME   | 5000    | Ops     | Jan   | CC-100     |
| INV-002   | ACME   | 48000   | Ops     | Jan   | CC-100     |
| INV-003   | Beta   | 12000   | Finance | Jan   | CC-200     |
| INV-004   | Beta   | 95000   | Finance | Feb   | CC-200     |
| INV-005   | ACME   | 1000    | Ops     | Feb   | CC-100     |
```

**Pivot by Dept:**
```
| Dept    | TotalAmount |
|---------|-------------|
| Ops     | 54000       |
| Finance | 107000      |
```
→ Depth walls behind this pivot view: Finance cell deeper (107K) than Ops cell (54K).
→ If the user binds `DeptTotalAmount` as a KPI, branch radius for Finance branch grows larger.

**Pivot by Vendor × Month:**
```
| Vendor | Jan   | Feb   |
|--------|-------|-------|
| ACME   | 53000 | 1000  |
| Beta   | 12000 | 95000 |
```
→ Each cell in this pivot has its own depth extrusion behind the view.
→ `ACME/Jan = 53K` (deep); `ACME/Feb = 1K` (shallow); `Beta/Feb = 95K` (deepest).

**Two Modes of Pivot:**

1. **Sandbox Pivot (ephemeral, local-only):**
   - User drags any column to row/column/value well (Excel-style).
   - System recomputes pivot view instantly.
   - Depth extrusion behind the pivot view updates.
   - Branch motion is NOT affected. This is purely visual exploration.
   - No governance. No commits. No audit trail beyond session log.
   - Discarding the pivot lens leaves no trace in the canonical tree.

2. **Bound Pivot (governed, affects tree motion):**
   - User discovers a meaningful grouping in sandbox mode.
   - User invokes Capability Bud → "Bind as KPI" → creates a PROPOSE commit.
   - The pivot formula becomes a summary sheet cell (formula-only, per Contract #3).
   - The summary cell is then wired to a KPI binding (per existing Module B KPI path).
   - Once committed, the pivot-derived KPI influences branch radius.
   - Governance trail is explicit: `[KPI] bind source=pivotLens.Dept.TotalAmount target=kpi.ops.invoiceVolume proposalId=PROPOSAL-47`

**Graphical Response to Pivot:**

When the user changes the pivot configuration, the system MUST:
1. Recompute the pivot view within 100ms (same frame if possible).
2. Update depth extrusion walls behind the pivot view within the next render frame.
3. If heatmap is active, recompute heatmap colors for the new values.
4. If aggregate branch view is visible, show a "preview" ghost of what the branch radius WOULD be if this pivot were bound. The ghost is visually distinct (dashed outline, low alpha) and disappears when the lens is closed.

**DraftNode Tag Integration:**

Sandbox pivot can optionally include DraftNode free-form tags (from Section 4.1) as a grouping column. This enables category discovery from unstructured margin notes — a user who tagged several DraftNodes with "vendor-issue" can pivot fact rows by that tag to see if a meaningful pattern emerges. DraftNode tags appear as an optional dimension in the pivot well alongside fact sheet columns. They carry no magnitude and produce no depth extrusion even when used as pivot dimensions. This bridges the gap between the cognitive scratch layer and structured analysis without requiring formalization first.

**What Pivot Does NOT Do:**
- Does NOT edit facts (append-only invariant preserved).
- Does NOT create new sheets (summary sheets require governance).
- Does NOT auto-bind KPIs (binding requires PROPOSE → COMMIT).
- Does NOT pre-declare categories (the full combinatorial space of possible groupings is available).
- Does NOT persist after session unless explicitly bound.
- Does NOT treat DraftNode tags as canonical data (tags are ephemeral grouping hints only).

Logs:
- `[PIVOT] open sheet=<sheetId> user=<userId>`
- `[PIVOT] configure rows=<cols> cols=<cols> values=<aggregation>`
- `[PIVOT] preview-kpi metric=<name> normalizedValue=<value> ghostRadius=<delta>`
- `[PIVOT] bind metric=<name> proposalId=<proposalId>`
- `[PIVOT] close sheet=<sheetId> duration=<seconds> bound=<count>`

Example: `[PIVOT] open sheet=sheet.P2P.InvoiceLines user=eitan`
Example: `[PIVOT] configure rows=[Dept] cols=[Month] values=[SUM(Amount)]`
Example: `[PIVOT] preview-kpi metric=DeptMonthlySpend normalizedValue=+0.62 ghostRadius=+0.31`
Example: `[PIVOT] bind metric=DeptMonthlySpend proposalId=PROPOSAL-47 target=kpi.ops.invoiceVolume`

### 4.5 Normalized KPI Interface (Mix Anything Safely)

Any metric from any domain can influence branch motion — but only through normalization. Without normalization, mixing art project confidence with three-way match percentage produces meaningless branch motion.

**KPI Driver Contract:**

```json
{
  "KPIDriver": {
    "kpiId": "kpi.<branch>.<metricName>",
    "sourceSummaryCellRef": "cell.<moduleId>.<sheetId>.R<row>.C<col>",
    "normalizedValue": -1.0,
    "weight": 0.0,
    "direction": 1,
    "confidence": 0.0,
    "unitType": "ratio|currency|count|score|time"
  }
}
```

Field rules:
- `normalizedValue`: always in range `[-1.0, +1.0]`. Normalization algorithm depends on `unitType`:
  - `ratio` (e.g., match rate %): `(value - baseline) / baseline`, clamped to [-1, +1]
  - `currency` (e.g., total spend $): `(value - baseline) / max(baseline, 1)`, clamped to [-1, +1]
  - `count` (e.g., open items): `(value - target) / max(target, 1)`, clamped to [-1, +1]
  - `score` (e.g., confidence): already normalized by definition
  - `time` (e.g., days past due): `(value - target) / max(target, 1)`, clamped to [-1, +1]
- `weight`: `[0.0, 1.0]`. How much this KPI matters relative to others on the same branch. Weights are user-configured through governance commits.
- `direction`: `+1` (higher is better, e.g., match rate) or `-1` (lower is better, e.g., days past due). Determines whether a positive normalizedValue expands or shrinks the branch.
- `confidence`: `[0.0, 1.0]`. Data quality signal. If only 40% of expected feeds have arrived, confidence = 0.4. Low confidence dampens the KPI's effect.

**Branch Motion Formula:**

```
branchRadiusDelta = Σ (normalizedValue_i × weight_i × confidence_i × direction_i)
```

This is computed per render cycle, per branch, over all active KPI bindings for that branch.

**Mixing Example (Cross-Domain):**

A branch has three KPI bindings:

| KPI | Raw Value | Normalized | Weight | Confidence | Direction | Contribution |
|-----|-----------|------------|--------|------------|-----------|-------------|
| 3WM match rate | 87.5% | +0.75 | 0.8 | 0.95 | +1 | +0.57 |
| Audit risk score | 0.6 | -0.60 | 0.6 | 0.90 | -1 | +0.324 |
| Art project morale | 7/10 | +0.20 | 0.2 | 0.50 | +1 | +0.02 |

`branchRadiusDelta = +0.57 + 0.324 + 0.02 = +0.914` → branch expands significantly.

The art project morale metric is weighted low (0.2) with low confidence (0.5), so it contributes only +0.02 — present but nearly invisible. The business KPIs dominate because they have higher weight and confidence. This is how the model is flexible across every domain and industry.

**15 Core Metric Templates (Pre-Built, Extensible):**

These are not mandatory — they are convenience templates for common business metrics:

1. Three-way match rate (ratio, +1)
2. AP aging (DPO) (time, -1)
3. Vendor on-time delivery (ratio, +1)
4. Price variance % (ratio, -1)
5. Budget consumption rate (ratio, -1)
6. Inventory turnover (count, +1)
7. GR-to-invoice cycle time (time, -1)
8. Open exceptions count (count, -1)
9. Coverage ratio (ratio, +1)
10. Reconciliation freshness (time, -1)
11. Filament turnover rate (ratio, +1)
12. Commit throughput (count, +1)
13. Verification cadence adherence (ratio, +1)
14. Cross-match dependency depth (count, -1)
15. Governance proposal velocity (time, -1)

Users can create new metrics by binding any summary cell to a new KPI through governance. The 15 templates above are starting points, not limits.

**Constraint: Branch shrink safety (Contract #19):**

Before a branch radius can decrease (branch shrink), the system checks:
- No ACTIVE filaments on the branch
- No HOLD filaments on the branch
- No commits within the last N timeboxes (configurable, default = 2)

If any condition fails, the branch cannot shrink past its safety floor. This prevents invisible unresolved work.

Logs:
- `[KPI] compute branch=<branchId> drivers=<count> delta=<value>`
- `[KPI] normalize kpiId=<id> raw=<value> baseline=<value> normalized=<value>`
- `[KPI] bind source=<cellRef> target=<kpiId> weight=<w> direction=<d>`
- `[KPI] shrink-blocked branch=<branchId> reason=<ACTIVE_FILAMENTS|HOLD_FILAMENTS|RECENT_COMMITS>`

### 4.6 Template Registry (Pre-Designed Tree Topologies)

Templates define the shape of a tree — its branch topology, empty sheet slots, and suggested KPI flavor packs. Templates do NOT define categories, do NOT bind KPIs automatically, and do NOT constrain pivot exploration.

**Template Schema:**

```json
{
  "TreeTemplate": {
    "templateId": "template.<domain>.<variant>",
    "name": "P2P Company (Standard)",
    "domain": "procurement|manufacturing|music|engineering|personal|governance|it-ops|custom",
    "topology": {
      "trunk": "company",
      "branches": [
        {
          "id": "ops",
          "name": "Operations",
          "sheets": [
            { "slot": "fact", "suggestedName": "RequisitionLines", "schema": "optional" },
            { "slot": "fact", "suggestedName": "POLines", "schema": "optional" },
            { "slot": "fact", "suggestedName": "GRLines", "schema": "optional" },
            { "slot": "fact", "suggestedName": "InvoiceLines", "schema": "optional" },
            { "slot": "match", "suggestedName": "ThreeWayMatch" },
            { "slot": "summary", "suggestedName": "MatchRateSummary" }
          ],
          "sub": [
            { "id": "packaging", "name": "Packaging" },
            { "id": "warehouse", "name": "Warehouse" }
          ]
        },
        {
          "id": "finance",
          "name": "Finance",
          "sheets": [
            { "slot": "fact", "suggestedName": "PaymentLines" },
            { "slot": "summary", "suggestedName": "AP_Aging" }
          ]
        }
      ]
    },
    "suggestedKPIFlavors": [
      { "metricTemplate": "3wm-match-rate", "targetBranch": "ops" },
      { "metricTemplate": "ap-aging-dpo", "targetBranch": "finance" }
    ]
  }
}
```

**8 Pre-Designed Topologies:**

1. **P2P Company (Standard)**: PR→PO→GR→INV→PAY chain. Branches: Ops, Finance, Quality. Suggested KPIs: match rate, DPO, price variance.
2. **Manufacturing**: WorkOrders, MaterialIssues, ScrapEvents, QualityChecks. Branches: Production, Quality, Maintenance. Suggested KPIs: yield, scrap rate, OEE.
3. **Engineering/CAD**: Revisions, Reviews, Approvals, TestResults. Branches: Design, Test, Release. Suggested KPIs: revision velocity, approval cycle time.
4. **Music Production**: Tracks, Sessions, Mixes, Masters, Releases. Branches: Composition, Recording, Mix, Master. Suggested KPIs: track completion, mix iteration count.
5. **IT Operations**: Tickets, Deployments, Incidents, Changes. Branches: Support, Engineering, Infrastructure. Suggested KPIs: MTTR, deployment frequency, incident rate.
6. **Personal Task Management**: Tasks, Goals, Habits, Notes. Branches: Work, Personal, Health, Learning. Suggested KPIs: completion rate, streak length.
7. **Five-Country Global Corporation**: Multi-trunk topology with country sub-trunks. Each country has its own P2P/MFG branches with jurisdiction boundaries (E4). Suggested KPIs: regional aggregates, cross-border reconciliation.
8. **Custom (Empty Canvas)**: Trunk + one empty branch. User builds topology interactively. No suggested KPIs.

**Template Selection (Classification Stub — TRL-1):**

Templates can be selected manually (user picks from registry) or suggested by a classification layer:

| Input | Suggested Template |
|-------|-------------------|
| .dwg CAD file | Engineering/CAD |
| Signed PO JSON | P2P Company |
| WAV audio file | Music Production |
| JIRA ticket JSON | IT Operations |
| Excel with PR/PO columns | P2P Company |
| Generic CSV | Custom (Empty Canvas) |

Classification is advisory. Users always have final selection authority. The classification layer is a stub in Tier 2.5 and will be expanded in Tier 4 when metadata signature matching becomes available.

**Topology Emergence from Pivot:**

Templates are starting points, not final shapes. As users discover meaningful groupings through pivot exploration and bind them as KPIs, the tree's effective topology evolves. A branch that accumulates many bound KPIs may sprout sub-branches. A branch with no bound KPIs may remain a thin stub. Over time, the working topology may diverge significantly from the original template — and that is correct behavior.

**Lock as Template (Capability Bud):** When a user has shaped a working tree topology through pivot-bound KPIs, sheet additions, and branch adjustments, they can invoke Capability Bud → "Lock as Template" to snapshot the current topology as a reusable template in the registry. This follows PROPOSE → COMMIT governance. The new template captures current branch structure, sheet slots, and KPI flavor suggestions — but not the data or the pivot state. This allows organic topology discovery to feed back into the template ecosystem.

Log: `[TEMPLATE] lock-from-topology user=<userId> source=<branchPath> newTemplateId=<templateId> proposalId=<proposalId>`

**What Templates Do NOT Do:**
- Do NOT pre-declare pivot categories (Contract #18).
- Do NOT auto-bind KPIs (suggested flavors require governance PROPOSE → COMMIT).
- Do NOT constrain what sheets can be added later (users can add sheets to any branch).
- Do NOT restrict which KPI metrics can be applied to which branches (mixing is allowed, per Section 4.5).
- Do NOT freeze topology permanently (users can always reshape through pivot-bound KPIs).

Logs:
- `[TEMPLATE] select templateId=<id> user=<userId>`
- `[TEMPLATE] classify input=<metadata> suggestion=<templateId> confidence=<score>`
- `[TEMPLATE] override suggestion=<templateId> selected=<templateId> user=<userId>`

### 4.7 Root Compression (Commit-Time Cube)

When a filament transitions to ABSORBED (lifecycle complete + trunk absorption), it is compressed into a root cube — a compact, hash-verified archive representation stored below the trunk.

**Root Cube Schema:**

```json
{
  "RootCube": {
    "cubeId": "root.<filamentId>",
    "filamentId": "F-INV-3001",
    "commitIndex": 847,
    "totalMagnitude": "48000.00",
    "unit": "USD",
    "branchPath": "branch.avgol.ops",
    "deptTag": "Ops",
    "vendorTag": "ACME",
    "timeboxId": "timebox.branch.avgol.ops.840-860",
    "closedAt": "2026-01-31T23:59:59Z",
    "absorptionHash": "sha256:a7b3c4d5...",
    "originCellRef": "cell.P2P.InvoiceLines.R7.C8",
    "derivedRefs": [
      "cell.P2P.ThreeWayMatch.R12.C3",
      "cell.P2P.MatchRateSummary.B8"
    ],
    "transferPacketId": "TP-INV-3001|null",
    "responsibilityPacketId": "RP-INV-3001|null",
    "ledgerProjectionHash": "sha256:e4f5a6...|null",
    "merkleAnchor": {
      "chainHash": "sha256:...",
      "timeboxMerkleRoot": "sha256:...",
      "inclusionProofPath": ["sha256:...", "sha256:..."]
    }
  }
}
```

**Accounting Chain Integration:** Root cubes are not visually isolated artifacts. The `transferPacketId` links to the balanced posting that the filament's commit produced. The `responsibilityPacketId` links to the mirrored human accountability record. The `ledgerProjectionHash` is the SHA-256 of the projected journal entry derived from the transfer packet. The `merkleAnchor` ties the root cube to the cryptographic integrity chain (E1-CRYPTO-1). Together these fields ensure that any root cube can be traced from visual representation → financial posting → human responsibility → ledger projection → Merkle proof, forming a complete audit chain from geometry to accounting.

**Rendering:** Root cubes are rendered as small geometric cubes arranged below the trunk in commit-index order. At COMPANY LOD, they collapse into a density band. At TRUNK LOD, individual cubes become visible. Color encodes domain (P2P = blue, MFG = green, etc.).

**Query:** Root cubes are queryable: "show me all absorbed filaments for Dept=Ops, Jan 2026, magnitude > 10000." The result set can be expanded back into full filament detail for audit.

**Immutability:** Root cubes are append-only. Once written, they cannot be modified. A correction creates a new reversal filament + new root cube (visible scar, per Contract #11).

Logs:
- `[ROOT] compress filamentId=<id> commitIndex=<n> magnitude=<value> hash=<sha256>`
- `[ROOT] query scope=<branchPath> filter=<expression> results=<count>`

---

## 5. Forward Build Sequence (All Phases)

### TIER 1: ERP-Replacement Core (Truth + Materiality + Balancing)

#### Phase D0: Scale and Stress (policy-locked)

- Deterministic FPS sampling (`FORCED_RAF`) is locked and non-hanging.
- Policy lock: strict truth (`>=30`) is always logged; dev pass (`>=20`) may unblock local build work.
- Mandatory policy proof log is part of gate evidence.
- Scope guard: do not spend feature cycles on FPS unless correctness or stability regresses.

#### Phase W0/W1/W2: Governance and Action Materiality (implemented baseline)

- W0: DRAFT/HOLD/PROPOSE/COMMIT material chain with in-memory artifacts and legal transitions.
- W1: UOC actions route through `relayInvokeAction`, generating PROPOSE and optional COMMIT.
- W2: route-ingest delta detector + policy auto-HOLD + inspector resolve loop (`Propose Fix`, explicit `Commit`).
- Outcome: live data motion now creates governance artifacts with object binding, provenance, and lookup.

#### Phase AC0: Balanced Transfer Core ✅ PASSED (v0)

Implement conservation as commit physics, not as a standalone accounting module.

**AC0.1: Canonical TransferPacket schema**

- `transferPacketId`, `unitTypes`, `legs[]`, `sourceObjectId`, `proposalId`, `commitId`, `periodId`.
- Leg shape: `{ containerRef, amount, unit, reasonCode, authorityRef? }`.
- Rule: sum of amounts must net to zero per unit type.
- All `containerRef` must resolve through UOC; implicit container creation is forbidden.
- TransferPacket validation runs only at COMMIT boundary for material state changes.
- Refusal log on violation: `[REFUSAL] reason=UNBALANCED_TRANSFER_PACKET ...`.

**AC0.2: Mirrored ResponsibilityPacket schema**

- On every material COMMIT that carries a transfer packet, create a mirrored responsibility packet on actor tree.
- Responsibility legs capture: asserted/approved/executed roles, evidence hash, authority source, and target object scope.
- Shared linkage keys with system packet: `commitId`, `proposalId`, `objectId`, `evidenceHash`.
- Required role tag: `actionRole` in `{asserted, approved, executed}`.
- Refusal log on violation: `[REFUSAL] reason=RESPONSIBILITY_MIRROR_MISSING ...`.

**AC0.3: Posting containers v0**

- Seed minimal containers: `Inventory`, `GRIR`, `AP`, `CashBank`, `PriceVariance`, `QtyVariance`, `BudgetCommitment`.
- Containers are UOC-resolvable objects and inspectable in 3D/2D.

**AC0.4: 3-way match as posting gate**

- PASS path allows invoice posting packet.
- FAIL path forces HOLD and requires PROPOSE path that resolves via correction, policy/tolerance change, or explicit variance packet.
- Hard rule: no mismatch may "disappear"; it must be moved to a named container by a balanced commit.

#### Phase LGR0: Ledger v0 ✅ PASSED (v0)

Ledger is a deterministic projection, never an origin module.

**LGR0.1: Core ledger primitives**

- Chart of accounts + dimensions (entity/site/cost-center/project).
- Journal projection validator (`sum(debit)=sum(credit)` + dimension checks + period lock checks).
- Append-only packet store + deterministic journal/trial-balance fold.
- Direct journal entry writes are forbidden; all ledger output derives from TransferPackets.

**LGR0.2: P2P posting vertical slice**

- GR post: `Dr Inventory / Cr GRIR`
- Invoice post: `Dr GRIR / Cr AP`
- Payment post: `Dr AP / Cr CashBank`
- Exception resolution post: explicit variance/adjustment containers only.

**LGR0.3: D1 Ledger Gate ✅ PASSED (v0)**

- Post 1,000 deterministic synthetic transactions.
- Verify: all packets balanced, mirrored responsibility packets present, projected journal entries balanced, trial balance deterministic/repeatable, and every posting linked to governance artifacts.
- Required logs include: `[LEDGER] post ...`, `[LEDGER] trial-balance ...`, `[GATE] D1 ...`.

**AC0/LGR0 Workflow Contract: 3-way match balancing in Relay**

1. **Intent object enters** (`PO`): object and authority context created; optional commitment containers updated by policy.
2. **Reality object enters** (`GR`): COMMIT emits balanced system packet (`Dr Inventory / Cr GRIR`) and mirrored responsibility packet on receiving actor tree.
3. **Claim object enters** (`Invoice`): match engine evaluates PO/GR/Invoice gate.
4. **Gate decision**:
   - PASS: allow invoice posting packet (`Dr GRIR / Cr AP`) with mirrored responsibility packet.
   - FAIL: force HOLD with evidence; only PROPOSE paths that resolve discrepancy via correction, tolerance policy with authority, or explicit variance packet can advance.
5. **Settlement object enters** (`Payment`): COMMIT emits balanced packet (`Dr AP / Cr CashBank`) and mirrored responsibility packet on payment actor tree.
6. **Conservation proof** (always): every packet balanced per unit; every posting linked to object + proposal + commit; no silent status flips.

**AC0/LGR0 Guardrails (do not violate)**

- Do not implement AC0/LGR0 as a traditional accounting sub-app.
- Do not allow ledger or journal entries to bypass TransferPacket validation.
- Do not treat trial balance as an authority source; it is a computed projection of packet truth.

#### Phase SG0: Stage Gates (Individual vs Global)

Two orthogonal gate systems that ensure people can learn privately but the system only unlocks mechanics globally.

**SG0.1: Individual Stage Gates (ISG)**

- Unlocks: training packs, simulations, read-only previews, private hypotheses
- Does NOT unlock: authoritative actions or policy mutation
- Log: `[STAGE] isg user=<id> stage=<n>`
- Example: `[STAGE] isg user=eitan stage=2 unlocked=training-pack:proximity-channels`

**SG0.2: Global Stage Gates (GSG)**

- New mechanics become actionable only after: explicit proposal, authorityRef, selection decision (vote/delegation), versioned stage commit
- Attempting future-stage action yields: `[REFUSAL] reason=STAGE_LOCKED requiredStage=<n>`
- Log: `[STAGE] gsg stage=<n> commit=<id> authorityRef=<...>`
- Example: `[STAGE] gsg stage=3 commit=commit.a1b2c3 authorityRef=policy.governance.v2 mechanism=vote quorum=<from-cadence-table>`

**Gate:** ISG lets users preview without authority; GSG blocks mechanics until formally unlocked

---

### TIER 2: Prove Universality (Relay-Native Expansion + Migration Bridges)

#### Phase C1: Fractal Module Replication

Prove "modules are configurations, not code" by adding Manufacturing as pure JSON config.

- Create `config/modules/mfg-module.json` (WorkOrderOps, MaterialIssues, ScrapEvents, QualityChecks; match sheets; summaries; KPI bindings)
- Create `config/routes/mfg-routes.json`
- Load with `loadModule()` + `loadRoutes()` — zero new engine code
- **Gate:** Module loads, sheets editable, routes work, tree shows MFG branch, buds adapt

#### Phase D1: Inter-Branch Aggregation

Branch -> Trunk -> Holding company aggregation bands.

- Trunk timebox bands aggregate from all branch KPI metrics
- Aggregation is read-only, inspectable (not hidden code)
- Inspector traces: trunk metric -> branch metric -> summary cell -> facts
- **Gate:** Edit invoice -> branch KPI changes -> trunk band thickens -> inspector traces it

#### Phase D2: File Import Adapters

Excel/CSV through route engine (backwards compatibility with 2D systems).

- Extend existing Excel importer to accept target routeId
- Map columns to route source fields via config or auto-detect
- Import preview before committing (reuses `previewRoute`)
- **Gate:** Drop Excel file -> rows in fact sheet -> chain fires -> tree moves

#### Phase D3: API / Webhook Connectors

HTTP POST events routed to fact sheets.

- Minimal HTTP endpoint accepting JSON with `routeId + payload`
- Server-side calls `ingestRecord -> recomputeModuleChain`
- Auth: API key per source system; rate limiting + batch coalescing
- **Gate:** POST invoice JSON -> row appears -> chain fires

#### Phase V93-MIGRATION-BRIDGE-1: Voting/Geo Salvage Bridge

Salvage proven v93 globe voting mechanics as Relay-native bridge inputs (data + aggregation semantics only).

- Build adapter from v93 backup/demo artifacts into Relay-native vote objects (`relayState.votes[]`) and vote-seed candidates (trunk anchor proposals)
- Preserve geospatial fidelity (lat/lon + jurisdiction metadata) and vote metrics (`totalVotes`, candidate distribution, reliability)
- Validate vote seeds against boundary containment before trunk injection; reject malformed/out-of-boundary seeds with explicit refusal logs
- Inject valid vote-derived trunk anchors through canonical world sync path (no parallel scene graph, no legacy runtime import)
- Compute Relay-native topic/candidate aggregates and map to trunk/branch metadata only (presentation/inspection layer, no topology mutation)
- **Gate:** v93 parity proof passes (counts + distribution + location coverage), vote-derived trunks render deterministically, and existing scaffold/megasheet/lifeline/CAM0.4.2 proofs remain green

#### Phase UX-3: Branch Steward (Visible Configuration) ✅ PASSED (v0)

Business owners configure without touching JSON.

- Schema editor as a sheet (module column schemas as visible spreadsheets)
- Route mapping preview via Capability Buds
- Validation rules as visible objects (rows in a validation sheet)
- All config changes produce commits
- **Gate:** Business user adds column, previews route, adds validation — all inside Relay

#### Phase D1: Inter-Branch Aggregation (branch -> trunk bands) ✅ PASSED (v0)

Read-only projection from branch KPI metrics to trunk-level aggregate bands.

- Aggregation policy is config-driven (`RELAY_TRUNK_AGG_POLICY_V0`) and deterministic
- Runtime exposes `relayGetTrunkMetrics()` + contributor traces (branch -> summary cell -> fact sheets)
- Roll-up recomputes on branch KPI update, with stable hash verification
- **Gate:** branch KPI change updates trunk metrics; trace chain and determinism proof both PASS

---

### TIER 2.5: Universal Tree Model (Domain-Agnostic Structure)

This tier implements the architectural primitives defined in Section 4. It sits between Tier 2 (Transactional Universality) and Tier 3 (Collective Intelligence) because the tree model must be structurally sound before collaborative features can operate on it.

#### Phase PRE-FILAMENT-SPACE-1: Cognitive Scratch Layer

Implement the DraftNode system (Section 4.1) so users can jot thoughts anywhere in 3D space before formalizing them into structured data.

**PRE-FILAMENT-SPACE-1.1: DraftNode CRUD**

- Implement `DraftNode` schema per Section 4.1.
- Create/read/update/delete via Capability Bud on any surface (branch, sheet edge, trunk).
- Free-text content + free-form tags.
- W0-only state enforcement (no HOLD/PROPOSE/COMMIT).
- TTL auto-expiry (default 7 days).
- **Gate:** Create DraftNode on branch surface → visible as translucent marker → edit content → add tags → wait 7 days → auto-expires with log.

**PRE-FILAMENT-SPACE-1.2: Spatial Rendering + LOD**

- Translucent sphere/teardrop markers at maximum orbital distance.
- LOD: visible at CELL/SHEET, suppressed at BRANCH and above.
- Clustering: 5+ DraftNodes on same surface → thought cloud indicator with count badge.
- **Gate:** Create 8 DraftNodes on one branch → cluster appears → zoom out to COMPANY → cluster suppressed → zoom back → cluster reappears.

**PRE-FILAMENT-SPACE-1.3: Convert-to-Filament**

- Capability Bud → "Formalize" → opens target fact sheet with pre-filled content.
- User completes schema fields → normal append → filament spawns.
- DraftNode's `convertedTo` field set; node fades from view.
- **Gate:** Create DraftNode with "ACME invoice $48K" → Formalize → InvoiceLines row appended → filament F-INV-3002 spawns → DraftNode marked converted.

#### Phase FILAMENT-UNIT-2: Structural Coherence

Lock the filament identity contract and implement per-cell depth extrusion behind the sheet.

**FILAMENT-UNIT-2.1: Filament Identity Lock**

- Implement `Filament` schema per Section 4.2.
- Every fact sheet row spawn emits `[FILAMENT] spawn` log.
- Dual state machines (work + lifecycle) enforced at commit boundary.
- Filament closure enforcement: cannot CLOSE if bound KPI computations still depend on active value.
- **Gate:** Insert 100 P2P records → 100 filaments spawned → lifecycle transitions logged → no orphaned filaments (every row has exactly one filament).

**FILAMENT-UNIT-2.2: Depth Extrusion Renderer**

- Implement per-cell `BoxGeometry` extrusion behind the sheet face.
- Scale algorithm: `log10(1 + |magnitude|) / log10(1 + maxAbsInView)`.
- Negative magnitudes extrude opposite direction (two-sided wall).
- Heatmap color applied to extrusion surface.
- LOD collapse: CELL → SHEET → BRANCH → COMPANY per Section 4.3.
- **Gate:** View sheet from side → walls visible behind grid → $500K cell deeper than $5K cell → grid face unchanged → LOD transitions collapse smoothly.

**FILAMENT-UNIT-2.3: Branch Radius from KPI Aggregation**

- Implement `branchRadiusDelta = Σ(normalizedValue × weight × confidence × direction)` per Section 4.5.
- Branch radius visually responds to KPI binding changes.
- Branch shrink safety (Contract #19) enforced.
- **Gate:** Change summary cell value → KPI recomputes → branch radius changes → inspector traces delta back to cell.

#### Phase PIVOT-LENS-1: Sandbox Pivot Engine

**PIVOT-LENS-1.1: Pivot UI**

- Excel-style pivot table interface: drag columns to row/column/value wells.
- Aggregation functions: SUM, COUNT, AVG, MIN, MAX.
- Pivot recomputes within 100ms.
- Depth extrusion updates behind pivot view.
- **Gate:** Pivot InvoiceLines by Dept → aggregated amounts shown → depth walls behind pivot cells update → close pivot → no trace in canonical state.

**PIVOT-LENS-1.2: Ghost Preview**

- When pivot produces a meaningful aggregate, user can preview "what if this were a KPI."
- Ghost branch radius shown (dashed, low alpha).
- Ghost disappears when pivot lens closes.
- **Gate:** Pivot by Vendor → preview KPI → ghost radius visible → close → ghost gone.

**PIVOT-LENS-1.3: Bind as KPI**

- Capability Bud → "Bind as KPI" → creates PROPOSE commit.
- Pivot formula materializes as a summary sheet cell.
- Summary cell wires to KPI binding per existing Module B path.
- **Gate:** Bind DeptMonthlySpend → PROPOSE → COMMIT → branch radius now responds to dept spend changes.

#### Phase TEMPLATE-REGISTRY-1: Tree Template System

- Implement template registry per Section 4.6.
- Load 8 pre-designed topologies.
- Template selection UI (manual, from registry list).
- Classification stub: file type → suggested template (advisory only).
- **Gate:** Select P2P template → tree topology loads → sheets are empty but correctly structured → user can add rows → chain fires.

#### Phase ROOT-COMPRESSION-1: Commit-Time Archive

- Implement root cube schema per Section 4.7.
- On filament ABSORBED transition, write root cube.
- Root cubes rendered below trunk.
- Root cubes queryable by filter (branch, timebox, magnitude range).
- **Gate:** Close 10 filaments → 10 root cubes appear below trunk → query by dept returns correct subset → cubes are immutable.

---

### TIER 3: Work Alone + Work Together (Collective Intelligence Layer)

This tier implements the "ants" / stigmergy / collective intelligence model — simple agents leaving signals that let the group solve tasks better than any one agent.

#### Phase F0: Flow Channels (F0.1-F0.2) ✅ PASSED (v0 pre-social)

Let people work individually, then share "how to do the job" as reusable, votable trails.

Activation guard: Social/Entertainment-facing flow/channel features are blocked until Section 13 (Social Activation Lockdown Addendum) reports PASS on all lock groups.

**F0.1: Flow Record ✅ PASSED (v0)**

A flow is a first-class object (not just camera keyframes). It stores:

- **Path**: camera keyframes (position + orientation + LOD tier at each point)
- **Steps**: semantic action steps (inspect / filter / jump / propose / commit-draft)
- **Intent**: what job this flow solves (free-text + tags: role, module, cadence)
- **Evidence**: what objects it references (sheet IDs, cell refs, match IDs)
- **Outcome**: resolved / follow-up / indeterminate
- **Scope**: where it is valid (module + jurisdiction + role + stage)

Recording:

- Start object (cell/sheet/match/route/branch/module)
- Camera waypoints (keyframes, not continuous video)
- Each action step is typed and logged with its target
- Log: `[FLOW] record-start target=<id> type=<type>`
- Log: `[FLOW] record-step kind=<inspect|jump|filter|propose> ref=<id>`
- Log: `[FLOW] record-end flowId=<id> steps=<n> scope=<zone>`
- Example: `[FLOW] record-start target=sheet.P2P.InvoiceLines type=review`
- Example: `[FLOW] record-step kind=inspect ref=match.3WM.INV1001-PO2001-GR3001`
- Example: `[FLOW] record-end flowId=flow.P2P.ap-aging-review@v1 steps=7 scope=zone.avgol.ops`

**F0.2: Flow Playback ✅ PASSED (v0)**

- "Run the flow" replays camera + steps at human pace (no teleport)
- Breadcrumb showing: where you were -> where you are -> what's next
- Log: `[FLOW] play flowId=<id> mode=<guided|free>`
- Log: `[FLOW] complete flowId=<id>`
- Example: `[FLOW] play flowId=flow.P2P.ap-aging-review@v3 mode=guided user=eitan`
- Example: `[FLOW] complete flowId=flow.P2P.ap-aging-review@v3 user=eitan steps=7 duration=42s`

**F0.3: Flow Voting + Promotion**

- Flows ranked by usefulness / clarity / reliability
- Best flows become "recommended defaults" for roles/modules
- Log: `[FLOW] vote flowId=<id> value=...`
- Log: `[FLOW] promoted flowId=<id> tier=<recommended|standard>`
- Example: `[FLOW] vote flowId=flow.P2P.ap-aging-review@v3 value=+1 user=eitan`
- Example: `[FLOW] promoted flowId=flow.P2P.ap-aging-review@v3 tier=recommended votes=12 scope=zone.avgol.ops`

**F0.3.1: Flow Versioning + Deprecation (lifecycle governance)**

Flows accumulate over time. Without explicit versioning, teams inherit "procedures that used to work." Rules:

- **Flows are versioned**: canonical ID is `flow.<scope>.<slug>@v<N>` (e.g., `flow.P2P.ap-aging-review@v3`). Each edit creates a new version; old versions are preserved and replayable.
- **Promotion applies to a specific version**: promoting `flow.P2P.ap-aging-review@v3` does not promote v1 or v2. If v3 is promoted and v4 is created, v3 remains promoted until explicitly replaced.
- **Staleness detection**: a flow is marked **stale** if any of its referenced inputs have changed since the flow was recorded. At record time, the flow stores an `inputFingerprint` — a SHA-256 hash of the concatenated schema versions, route config hashes, and match rule hashes for every object the flow references. On playback, the system recomputes the fingerprint from current configs. If it differs, the flow is stale. This makes staleness detection deterministic and replay-friendly. Stale flows show an "outdated" banner during playback.
- **Stale flows remain runnable**: they are not deleted or hidden (append-only invariant). But stale flows **cannot be promoted** and **cannot be voted on** until re-recorded or explicitly re-validated against current schemas.
- **Deprecation**: a flow owner or steward can explicitly deprecate a flow version. Deprecated flows show a "deprecated" banner, cannot be promoted, and are excluded from recommendation rankings. They remain accessible for historical review.

Log: `[FLOW] version flowId=<id>@v<N> parent=<id>@v<N-1>`
Log: `[FLOW] stale flowId=<id>@v<N> reason=<schema-changed|route-changed|match-rule-changed> trigger=<configCommitId>`
Log: `[FLOW] deprecated flowId=<id>@v<N> by=<userId> reason=<...>`

Example: `[FLOW] version flowId=flow.P2P.ap-aging-review@v3 parent=flow.P2P.ap-aging-review@v2`
Example: `[FLOW] stale flowId=flow.P2P.ap-aging-review@v2 reason=schema-changed trigger=commit.d4e5f6`
Example: `[FLOW] deprecated flowId=flow.P2P.ap-aging-review@v1 by=eitan reason="superseded by v3 with updated match rules"`

**F0.4: Proximity Channels as Flow Communities**

A proximity channel is a temporary coordination zone bound to physical presence. It is NOT a chat room, NOT a persistent group. It exists because participants are physically near a signal source, and it degrades gracefully (read-only) when they leave.

**F0.4.0: Coarse vs Precise Anchor Law (authority boundary)**

- Coarse anchors (city/building/floor) can answer: "show activity in this container"
- Coarse anchors cannot answer: "who owns this data"
- Precise anchors (proximity channel/device hotspot) carry ownership authority when policy conditions are met
- Multiple tenants in one building map to separate proximity basins; none overwrite each other
- Cross-basin relationships must be explicit routes/commits; no implicit merge by shared building

Gate implication: if many actors claim the same building, system remains collision-safe because ownership is evaluated at proximity/device resolution, not building resolution.

**Acceptance Gate (multi-tenant building collision proof)**

Run this explicit proof scenario:

- One building context anchor (`building.tel-aviv.hq`) is visible in the world
- Ten distinct teams/users in that building create/join ten distinct proximity channels
- Each team performs local write actions in its own channel scope
- No team can overwrite another team's ownership scope without explicit cross-boundary route/consent

PASS criteria:

- System resolves **10 independent proximity basins** under one building context (no silent merge)
- Ownership checks bind to proximity/device evidence, not building claim labels
- Any unauthorized cross-basin write attempt emits refusal (`[REFUSAL] reason=BOUNDARY_VIOLATION` or equivalent stage/policy refusal)
- Replay of the run preserves all ten scopes and their commit histories without collisions

Suggested proof logs:

- `[PROX] join channel=<id> user=<id> ...`
- `[BOUNDARY] crossing from=<scopeA> to=<scopeB> ...` (explicit only)
- `[REFUSAL] reason=BOUNDARY_VIOLATION ...` (for unauthorized write attempts)
- `[REPLAY] scope=branch|module ... result=MATCH`

**F0.4.1: Channel Discovery (how a channel appears)**

Your device detects BLE beacons and/or Wi-Fi fingerprints (SSID/BSSID). The system maps `{fingerprint} -> proximityChannelId`. Two discovery models:

- **Signal-owned channel** (best for permanent sites: factories, offices, ports, warehouses): A location "owns" a proximity channel by proving control of a beacon source (BLE beacon or specific Wi-Fi AP). Ownership proven via challenge-response (power-cycle, nonce broadcast). Ownership commit: `[PROX] owner-asserted channelId=<id> signal=<fingerprint> method=<challenge-response>`
- **Ad-hoc channel** (best for spontaneous groups: field work, meetings, conferences): Nearby users create a temporary channel tied to their local cluster. It exists for the duration of presence, then becomes read-only history for those who were there. Creation commit: `[PROX] ad-hoc-created channelId=<id> members=<n>`

**F0.4.2: Join Condition (not instant, not automatic)**

You don't join on first signal. The system requires:

- **Multi-signal confirmation**: BLE + Wi-Fi together is stronger than either alone. Single-signal is accepted but marked lower confidence.
- **Time-in-range**: consistently detected for X seconds (configurable per channel; default 30s). Prevents drive-by joins.
- **Explicit opt-in**: the user confirms join. Never auto-enrolled. Log: `[PROX] join channel=<id> user=<id> tier=<0|1|2> signals=<ble+wifi|ble|wifi> dwell=<seconds>`
Example: `[PROX] join channel=prox.factory-floor-7 user=eitan tier=1 signals=ble+wifi dwell=45`

**Proximity Confidence Label (honest about physics noise)**

Channel membership carries a confidence flag derived from signal quality at join time and continuously updated:

- **CONFIRMED**: BLE + Wi-Fi both detected + dwell threshold met. Full action set available.
- **LIKELY**: one signal type detected + dwell threshold met. Reading, voting, and flow playback allowed. High-impact actions (owner assertion, steward tasks, reverification attestations) blocked until CONFIRMED.
- **INDETERMINATE**: signal unstable, conflicting, or dwell threshold not yet met. Read-only access only. No write actions permitted.

Confidence can change during a session: if Wi-Fi drops while BLE remains, confidence degrades from CONFIRMED to LIKELY. If all signals drop, the member transitions to "leaving" (F0.4.4). Confidence is always visible to the user and logged.

**Re-evaluation cadence:** Confidence is re-evaluated every 10 seconds and immediately on any signal change event (new signal detected, signal lost, signal strength change exceeding threshold). **Signal loss grace period:** when a signal drops, the system waits 15 seconds (configurable per channel) before downgrading confidence, to absorb momentary signal interruptions (e.g., walking past a wall). If the signal returns within the grace period, no downgrade occurs and no log is emitted. If the grace period expires without signal recovery, confidence downgrades and a log is emitted.

Log: `[PROX] confidence channel=<id> user=<id> level=<CONFIRMED|LIKELY|INDETERMINATE> signals=<...>`
Log: `[PROX] grace-expired channel=<id> user=<id> lostSignal=<ble|wifi> after=<seconds>s`

Example: `[PROX] confidence channel=prox.factory-floor-7 user=eitan level=CONFIRMED signals=ble+wifi dwell=45s`
Example: `[PROX] grace-expired channel=prox.factory-floor-7 user=eitan lostSignal=wifi after=15s downgrade=CONFIRMED->LIKELY`

**F0.4.3: Active Presence (what you can do while in range)**

While physically present (signals confirm continued proximity):

- Read channel content (flows, findings, votes)
- Vote locally ("what's true here?")
- Publish flows (recorded procedures) — inherits channel scope
- Participate in onboarding/training delivered as flows
- Perform local stewardship tasks (who maintains this signal/channel)
- Serve as a reverification hotspot (flagged users reverify here via multi-signal confirmation)

**F0.4.4: Leaving = Read-Only (the critical rule)**

When you leave signal range:

- The channel becomes **read-only** for you
- Your past actions remain in the permanent record (append-only)
- You **cannot** create new votes, flows, or comments until physically back in range
- You **can** always review what happened (full history visible)
- "Act only when present; review always."

Log: `[PROX] leave channel=<id> user=<id> lastAction=<commitId>`

Example: `[PROX] leave channel=prox.factory-floor-7 user=eitan lastAction=commit.f7a8b9 mode=read-only`

**F0.4.5: Anti-Spoof (honest, not magic)**

The system does NOT claim "BLE proves you're there." It uses layered constraints:

- Multi-signal confirmation (BLE + Wi-Fi together)
- Time-in-range (consistent detection, not momentary)
- Challenge-response for owners (prove control of beacon source)
- Community flagging + reverification (suspicious behavior triggers "reverify at hotspot" — a trusted physical location where multi-signal + time-in-range are rechecked)
- Spoof attempts surface as **INDETERMINATE or REFUSAL**, not silent allow

Log: `[PROX] spoof-detected channel=<id> user=<id> action=REVERIFY_REQUIRED`
Example: `[PROX] spoof-detected channel=prox.factory-floor-7 user=visitor3 action=REVERIFY_REQUIRED reason=signal-mismatch hotspot=prox.factory-entrance`

**F0.4.6: What proximity channels are used for (not "just chat")**

- Local voting ("what's true here?")
- Publishing flows (job procedures as navigation trails)
- Onboarding and training in physical context
- Local stewardship tasks (maintaining the channel/signal)
- Trusted hotspot reverification (flagged users must reverify)

**Consent + visibility rules (non-negotiable):**

- Proximity channel membership is **opt-in** (never auto-enrolled)
- Presence tier defaults to **Tier 0 (anonymous dot)** within any channel
- Sharing flows in a proximity channel inherits the **channel's scope** (cannot leak to broader scope)
- Publishing a flow requires the publisher to have authority within the channel's scope
- Channel membership list is visible only to members (not globally)

Log: `[PROX] publish-flow flowId=<id> channel=<id> scope=<zone>`
Example: `[PROX] publish-flow flowId=flow.P2P.ap-aging-review@v3 channel=prox.factory-floor-7 scope=zone.avgol.ops`

**Example flows (ERP):** "3-way match exceptions review", "AP aging weekly review", "Vendor term verification", "GR vs invoice mismatch diagnosis"

**Gate:** Act only when in range; review always; spoof attempts surface as indeterminate/refusal, not silent allow. Record a flow -> another user plays it -> votes -> promoted flow becomes default for role.

#### Phase CAM0: Camera Physics + Navigation (CAM0.1 + CAM0.3 ✅ PASSED v0 slice)

Enforce cognitive continuity: travel takes time, basins have influence, presets per level.

**CAM0.1: Animated Travel** (no instant teleport) ✅ PASSED (v0)

- Short distance: fast glide (still animated)
- Long distance: transit mode showing what you pass through (context fades in/out)
- Always show breadcrumb: origin -> destination -> reason

**CAM0.2: Basin Influence** ✅ PASSED (v0 minimal)

- Entering a tree's basin offers optional "soft lock" (easier orbit, steadier camera)
- User can always exit; soft lock = UX assist, not trap
- Flowpaths and company basins can lock camera for focus

**CAM0.3: Camera Presets per LOD Level** ✅ PASSED (v0 minimal)

- Presets defined for each tier in the full LOD ladder, not just 3 levels
- Core presets (immediate): COMPANY (overhead), SHEET (look-down-branch), CELL (close orbit + history lane)
- Extended presets: SITE (facility overview), REGION (country map), PLANETARY (globe spin)
- Press number keys for presets; presets are also flow-recordable steps

**CAM0.4: Movement Modes** (Branch Walk ✅ PASSED v0 slice; Filament Ride ✅ PASSED v0 slice)

All modes from Module L are available as camera behaviors:

- **Free flight**: world navigation, world-up locked
- **Basin orbit assist**: soft lock around a tree/company (optional, never traps)
- **Filament ride**: move along a filament / time axis; timeboxes as deterministic snap points (CAM0.4.2 v0)
- **Branch walk**: move along responsibility axis; snap to branch/sheet/match nodes (✅ v0)
- **Flow playback**: guided movement using recorded keyframes + semantic steps (from F0)

Timebox snap rules:

- Jump to start/end of timebox (animated, never teleport)
- Scrub within timebox = history browsing
- Collision/resistance = UX assist only, never traps

Movement always shows: where you started, where you are, what boundary you crossed (timebox / scope / stage).

Log: `[MOVE] mode=<free|basin|filament|branch|flow> target=<id>`

Example: `[MOVE] mode=filament target=timebox.branch.avgol.ops.3-7 action=scrub startCommit=3 endCommit=7`

**Gate:** Travel animated; basin soft-lock functional; presets switch cleanly at each LOD; filament ride and branch walk snap correctly to timeboxes

#### Phase D-Lens-1: Focus Sphere (Lens, Not Truth Layer) ✅ PASSED (v0 slice)

Inspect any object in isolation without losing context. Already partially implemented (D-Lens-0 PASS). This extends it.

**D-Lens-1.1: Deep Focus Frame**

- Temporary local ENU frame centered on focused object
- Earth, map, background remain (dimmed/desaturated)
- Parent branch stays visible; upstream/downstream relationships rendered (thinned, faded)
- Direction semantics preserved: down=history, surface=now, outward=speculation

**D-Lens-1.2: Sphere Boundary**

- Soft spatial boundary for layout + LOD (not a container)
- Radius = f(content extent), not count; no infinite expansion
- Objects laid out within sphere using existing tree rules

**D-Lens-1.3: Inspector Integration**

- Inspector becomes context-aware (already exists from UX-1.3); extend for focus mode
- Title: "Focused: P2P.InvoiceLines!C14"
- Focus breadcrumb: Earth -> Company -> Dept -> File

**D-Lens-1.4: Exit Guarantee**

- Camera animates back to previous global view
- Same LOD, same selection state
- No recomputation triggered by focus alone
- Log: `[LENS] focus-enter target=<id> frame=<id>`
- Log: `[LENS] focus-exit restoreView=true`

**Gate:** Focus any object -> local frame rendered -> relationships visible -> exit returns to exact prior state ✅

---

### TIER 4: Trust and Governance Hardening (Coordination OS)

#### Phase E1: Cryptographic Integrity Layer

- Merkle tree over commit history
- Each timebox carries hash of contents
- Signature verification for routed events
- Tamper detection on fact sheets
- **Depends on:** D0, D1

#### Phase E2: Governance Workflows

- HOLD / RECONCILE / APPROVE flows (extending W0)
- Work zone enforcement (who can edit what)
- Stage gates with human approval
- Quorum gate (30-75% depending on cadence), Approval gate (60-75%), Reconciliation gate (7-30 days), Sunset gate (90-day expiry)
- **Depends on:** E1, UX-3

#### Phase E3: Deterministic Replay

Replay is the ultimate audit tool: "prove this state is legitimate."

- **Rebuild everything from facts + commits**: starting from t=0, replay every routed event, every match rebuild, every formula recalculation, every KPI binding update, in causal order (commitIndex sequence)
- **Verify output matches live state exactly**: replayed fact sheets, match sheets, summary sheets, KPI metrics must produce byte-identical derived state to the live system. Any mismatch is itself a finding.
- **Mismatch = scar/refusal**: if replayed state diverges from live state, the system creates a `REPLAY_DIVERGENCE` refusal commit with evidence pointers (expected vs actual, at which commitIndex, in which sheet/cell). This is append-only — the divergence is recorded, not hidden.
- **Partial replay**: replay can target a specific module, branch, or time range (not always full t=0). Partial replays carry a scope marker and cannot be used to claim global consistency.
- **Replay as migration tool**: when moving data between systems or upgrading the engine, replay from t=0 on the new system and verify parity. If parity holds, the migration is proven correct.
- **Replay performance gate**: replay of 10k-row P2P module must complete in under 60 seconds (no interactive rendering required; headless mode).

**Canonical Replay Comparison Rule (prevents false divergence scars)**

Replay equality is checked on canonical serialized state, not raw JS object memory or float formatting. The canonicalization rules:

- **Key ordering**: all object keys sorted lexicographically before hashing (JSON.stringify with sorted keys)
- **Number formatting**: monetary/rate values quantized to fixed decimal precision (6 decimal places for rates, 2 for currency) before comparison — no floating-point epsilon comparison
- **Timestamps**: compared as integer milliseconds (UTC epoch), never as formatted strings
- **String normalization**: trimmed, NFC-normalized Unicode
- **Null handling**: `null`, `undefined`, and missing keys are canonicalized to a single sentinel (`__RELAY_NULL__`) before hashing

These canonicalization rules apply to **all** derived outputs — fact sheets, match sheets, summary sheets, KPI metric values, commit log entries, and audit findings — not only to matches. Any system component that produces a derived value (formula result, aggregation, binding read) must serialize through the same canonical pipeline before comparison or hashing.

For numeric sheets (money, rates): strict decimal quantization is the default. Tolerance-based comparison is forbidden unless explicitly declared in the sheet schema with a logged justification (`[REPLAY] tolerance-rule sheet=<id> field=<col> epsilon=<value> reason=<...>`). Tolerance rules are themselves versioned policy — they require a commit to create or change.

Log: `[REPLAY] scope=<full|module|branch> from=<commitIndex> to=<commitIndex> result=<MATCH|DIVERGENCE>`
Log: `[REPLAY] divergence at=<commitIndex> sheet=<id> cell=<ref> expected=<hash> actual=<hash>`
Example: `[REPLAY] scope=module from=0 to=847 result=MATCH module=P2P duration=1240ms`
Example: `[REPLAY] divergence at=412 sheet=sheet.P2P.ThreeWayMatch cell=R44.C3 expected=sha256:ab3f…7d01 actual=sha256:c9e2…1f88`

- **Depends on:** E1, D0

#### Phase E4: Multi-Company / Regional Topology

- Full LOD ladder activated: LANIAKEA through CELL with all intermediate tiers
- Basin/region aggregation across orgs (GALACTIC, SECTOR, SOLAR_SYSTEM tiers become live)
- Global core (central authority aggregation)
- Users as "birds" — all users visible via Module L Presence; schools/flocks for shared proximity channels
- LOD transition gate enforced at every tier boundary: breadcrumb + selection + action continuity

**Jurisdiction + Boundary Enforcement (who can see what, how data crosses boundaries)**

- **Boundary commits define scope**: a jurisdiction boundary is a commit (`BOUNDARY_DEFINE`) that declares which company/region/department owns which data scope. Boundaries are visible objects in the 3D world (extrusions at COUNTRY/REGION LOD tiers), inspectable via Universal Object Contract.
- **Crossing boundaries requires explicit disclosure policy + consent**: no data flows across a jurisdiction boundary without (a) an explicit routing commit that declares the crossing, (b) a disclosure policy that both parties have accepted, and (c) consent from the data owner. Unauthorized cross-boundary access produces `[REFUSAL] reason=BOUNDARY_VIOLATION`.
- **Aggregates can be public while details remain private**: a company can expose aggregated KPIs (match rate, DPO, throughput) at the COMPANY tier while keeping individual fact rows encrypted at the CELL tier. Selective disclosure (Module C) enables this — Merkle proofs verify the aggregate is legitimate without revealing the underlying cells.
- **Jurisdiction tiers in the LOD ladder**: COUNTRY and REGION tiers enforce jurisdiction. When navigating across a COUNTRY boundary, the system checks disclosure policies and shows only what the viewer is authorized to see. Unauthorized areas render as "boundary present, access restricted" markers (not invisible — existence is always discoverable, content is gated).
- **Cross-company routing**: data routes between companies require a `ROUTE_CROSS_BOUNDARY` commit with: source company, destination company, field mapping, disclosure policy reference, and consent proof from both parties. The route is visible and inspectable like any other route.

Log: `[BOUNDARY] crossing from=<companyA> to=<companyB> route=<routeId> disclosure=<policyId>`
Log: `[BOUNDARY] refusal from=<companyA> to=<companyB> reason=<no-disclosure|no-consent|scope-exceeded>`
Example: `[BOUNDARY] crossing from=avgol to=vendor.apex route=route.PO-to-GR disclosure=policy.avgol-apex-interco-v2`
Example: `[BOUNDARY] refusal from=avgol to=vendor.apex reason=no-consent route=route.InternalAudit scope=zone.avgol.finance`

- **Depends on:** D1, E2, L0

#### Phase E5: Collaborative Lenses / Immersive

- VR/AR support
- Collaborative focus (multiple users in same focus sphere)
- Historical replay within focus sphere (scrub timebox timeline)
- Desktop OS layer (file mapping like treespace) — if clutter problem measured
- **Depends on:** D-Lens-1, E3

---

### TIER 5: Advanced Visualization Physics (Build When Measured Need Arises)

#### Phase TB1: Thick Timeboxes with Physical Behavior

**TB1-v1 (required — minimal material timeboxes):**

- Thickness = commit density / history volume (more commits = thicker slab)
- Color / opacity = confidence / completeness (from ERI)
- Label = what changed + evidence link (inspectable)
- Snap + scrub: timeboxes are movement anchors (jump-to, scrub-within)
- Gate: every timebox shows commit count, confidence, and supports snap navigation

**TB1-v2: Wilt Model (the mechanical spec for timebox degradation)**

Wilt is a measurable degradation signal driven by specific inputs, producing specific visual and interaction changes. It is the turgor pressure model applied to timeboxes: a healthy timebox is firm like a well-watered cell wall; a neglected timebox sags like a dehydrated plant.

**Wilt inputs (what causes it):**

- **Unresolved obligations**: things marked "needs follow-up" not closed; holds never reconciled; open exceptions in match sheets not addressed; pending proposals past their expected resolution date
- **Confidence decay**: missing inputs (indeterminate zones); incomplete coverage (only 40% of expected feeds arrived); conflicting evidence not reconciled
- **Time since last verification**: the system hasn't been "checked" for too long relative to its cadence (e.g., weekly reconciliation hasn't happened in 3 weeks)

Formula: `wilt_factor = f(age_since_verification, unresolved_count, confidence_floor, coverage_ratio)`

`wilt_factor` is a 0.0 to 1.0 scalar: 0.0 = fully firm, 1.0 = maximally wilted.

**Wilt must be sourced (non-negotiable):** Every wilt input must be computed from explicitly logged, countable quantities — `unresolved_count` from the obligations ledger, `coverage_ratio` from feed arrival records, `confidence_floor` from ERI, `age_since_verification` from the last `VERIFY_CHECKPOINT` commit timestamp. No heuristic estimates, no "feels wilted," no manual wilt overrides. If the input counts are wrong, fix the counts — do not adjust wilt directly.

**Wilt outputs (3 consistent visual/interaction channels):**

- **Timebox wall firmness**: healthy (wilt < 0.3) = firm boundary, crisp edges, full opacity; degraded (0.3-0.7) = softer boundary, edges sag/fade, reduced opacity; wilted (> 0.7) = visibly collapsed boundary, transparent walls, "uncertain feel"
- **Branch turgor drops**: branch looks less "supported" as wilt increases — slight droop, loss of geometric stiffness (subtle deformation, proportional to wilt_factor). At wilt > 0.8, the branch visually "droops" like a wilting plant stem.
- **Camera resistance changes**: approaching heavily wilted area (wilt > 0.5) increases camera damping, reduces snap assist; UI label shows "indeterminate / needs verification"; the area feels uncertain to navigate, encouraging the user to investigate or verify

**What wilt does NOT do (critical — frozen rule):**

- Does NOT change facts (append-only invariant preserved)
- Does NOT auto-correct (no silent fixes)
- Does NOT auto-escalate (no automatic HOLD/PROPOSE/COMMIT)
- Does NOT punish users (no access restriction, no alerts-as-punishment)
- Does NOT hide anything (wilted areas remain fully navigable and inspectable)
- It is a **signal**, not an enforcement action. It informs, never executes.

**How wilt repairs (recovery events):**

Wilt reverses when the system receives a verification event:

- A follow-up is closed with evidence (commit)
- A reconciliation resolves exceptions in match sheets
- Missing feeds arrive and coverage rises
- A timebox checkpoint happens ("verified as of [commitId]")

Then: timebox wall becomes firm again, confidence rises, branch regains stiffness. Recovery is immediate on the next render cycle after the verification commit.

**Verification event definition:** A verification event is not informal — it is a specific commit type with required fields. The allowed verification commit types are: `VERIFY_CHECKPOINT` (periodic timebox verification, requires: `timeboxId`, `verifierId`, `coverageRatio`, `unresolvedCount`), `RECONCILE_RESOLVE` (match exception resolved, requires: `matchId`, `resolutionEvidence`, `resolvedBy`), `FOLLOWUP_CLOSE` (open obligation closed, requires: `obligationId`, `closedBy`, `evidenceCommitId`). Any commit type not in this list does not count as a verification event and does not reduce wilt.

Log: `[WILT] timebox=<id> factor=<0.0-1.0> cause=<unresolved|confidence|staleness>`
Log: `[WILT] recovered timebox=<id> factor=<new> event=<commitId>`
Example: `[WILT] timebox=tb.P2P.2026-Q1 factor=0.62 cause=unresolved unresolvedCount=14 confidenceFloor=0.71 daysSinceVerify=18`
Example: `[WILT] recovered timebox=tb.P2P.2026-Q1 factor=0.23 event=commit.a1b2c3 type=VERIFY_CHECKPOINT verifier=eitan`

**TB1-v2 optional flourishes (build only after v1 wilt model is proven):**

- Soft collision / resistance: timebox boundaries resist camera penetration (material walls as UX assist)
- Flexible walls reflecting ERI in real-time: healthy = firm, degraded = soft/sagging, critical = transparent/collapsed
- Movement as pressure changes (geometry deforms with metric shifts — subtle, never disorienting)
- Particle effects for active pressure flow (optional visual polish)

#### Phase UX-2: LOD Budget + Leaf Clustering (Reactive)

- **UX-2.1**: Per-LOD-level entity budgets (already implemented as D0.3 remediation)
- **UX-2.2**: Leaf clustering when branches get dense (only if measured)

#### Phase VIS1: Visual Shape Language (Polish)

- Volumetric limbs (PolylineVolumeGeometry)
- Living branch curvature (5-point control curves)
- Taper thickness (thick at trunk, thin at tips)
- Proximity-based lens reveals (replace view buttons with distance-based fade)
- Sheet as "page" (translucent fill + bright frame)

---

## 6. Safety and Governance Rails (Enforced Continuously)

### 6.1 Language Discipline

- Forbidden-language lint enforced in CI ([config/forbidden-language.json](config/forbidden-language.json), [scripts/forbidden-language-lint.mjs](scripts/forbidden-language-lint.mjs))
- No adversarial terms: attack->audit, exploit->exposure precondition, breach->exposure condition, hack->verify
- Source: [FORBIDDEN-LANGUAGE.md](docs/governance/FORBIDDEN-LANGUAGE.md)

### 6.2 Data Minimization + Purpose Limitation

- "Pressure is continuous verification, not continuous surveillance"
- Retention + scope limits on all data
- Exports support pseudonymization + role-filtering
- Default proximity logging OFF; mutual consent for identity reveal

### 6.3 Learning Cannot Auto-Change Policy

- Learning writes recommendation commits only
- Applying any threshold/weight change requires authorityRef + policy version bump
- Selection required where applicable

### 6.4 Public vs Private Exposure Policy

- Public: aggregated KPIs, commitments, verified outcomes, service levels
- Private: personal data, contracts, supplier pricing, internal exception detail
- System allows selective disclosure even though "people will review anyway"

### 6.5 SCV / Agent Safety Rails

- SCVs never auto-execute; they produce findings, proposals, and recommendations only
- Every SCV action is visible in the world (marker + focus target + status)
- SCV proposed commits require human approval via authorityRef before materializing
- SCVs are subject to all 5 invariants (pressure budget, confidence floor, repair effectiveness, data minimization, policy governance)
- SCVs cannot escalate their own authority; scope is set by the audit request
- SCV findings are traceable: every row in a findings sheet links to the evidence that produced it

### 6.6 Presence Privacy Rails

- Default presence tier is 0 (anonymous dot); escalation requires mutual consent
- Presence trails are ephemeral by default; retention governed by data minimization policy
- Proximity channel membership is opt-in only; no auto-enrollment
- Sharing flows inherits channel scope; cannot leak to broader scope
- Presence data is never used for performance evaluation (policy-locked)
- **Video/audio streams (L.5)**: default is OFF (Tier 0). Audio requires Tier 1 consent. Video requires Tier 2 consent.
- **No silent recording**: all recording inside Relay requires visible, explicit all-party consent. System never records without participant awareness.
- **Ephemeral by default**: live media streams have no persistence beyond the active session. Only commit boundary summaries (L.5.5) enter canonical history, and only with all-party consent.
- **Humans can always record externally** — Relay does not pretend to prevent external capture. Relay's responsibility is: never capture silently itself.

### 6.7 Proof Artifact Policy (No Proof, No Progression)

Every gate PASS requires three artifacts:

- **Console log block**: the `[GATE]`, `[D0-GATE]`, `[FLOW]`, etc. log lines that prove the gate ran and what it measured
- **Screenshot or recorded clip**: where visual verification is relevant (3D rendering, UI state, inspector content), a screenshot or short recording is required as proof
- **Doc line update**: the build plan document or phase document must be updated with a reference to the gate run (date, result, artifact location)

Storage: artifacts are stored in `archive/proofs/` and indexed in `archive/proofs/PROOF-INDEX.md`.

Rule: if a gate is claimed as PASSED but no artifact exists, the gate is NOT passed — it is INDETERMINATE until proof is provided. Social proof ("trust me, it works"), partial passes ("mostly done"), and future promises ("we'll fix it in Phase 3") are all forbidden.

### 6.8 Language Guard as Phase Gate

Forbidden-language lint is not just a CI check — it is a **phase gate**:

- **Pre-commit hook**: blocks commit if forbidden tokens appear in docs, UI text, code comments, or user-facing strings. Source: [config/forbidden-language.json](config/forbidden-language.json)
- **CI gate**: blocks PR merge if lint fails. Source: [scripts/forbidden-language-lint.mjs](scripts/forbidden-language-lint.mjs)
- **REFUSAL on violation**: if forbidden language is detected in any file that would be committed, the system produces `[REFUSAL] reason=FORBIDDEN_LANGUAGE token=<...> file=<...>` and blocks the commit. This is a hard refusal, not a warning.
- **Scope**: applies to all `.md`, `.js`, `.html`, `.json`, and `.txt` files in the repo. Does not apply to binary files or third-party dependencies.
- **Safe terminology replacements**: attack->audit, exploit->exposure precondition, breach->exposure condition, hack->verify, penetration test->integrity check, infiltrate->verify, war-game->verification scenario, attacker->coherence operator

This ensures the entire codebase and documentation consistently use non-adversarial, audit-oriented language.

### 6.9 Documentation Hygiene

Active canonical docs:

- `docs/architecture/` — system architecture and contracts
- `docs/restoration/` — restoration index and proofs
- `docs/process/` — slice workflow, proof artifact policy
- `docs/00-START-HERE.md`, `HANDOFF.md`, `README.md`

Historical docs:

- `archive/superseded-docs/` — superseded planning documents
- `archive/status-reports/` — archived status reports
- `archive/commit-history/` — commit history records

Rules:

- No planning canon in repo root
- Planning docs are either active under `docs/` or historical under `archive/superseded-docs/`
- Execution order changes do not require a separate overlay file — this plan is the single source

---

## 7. 2D Compatibility and Migration Contract

Relay is the canonical system of record, but migration and interoperability remain first-class. This contract guarantees that every capability has a 2D equivalent, the system can run headless, and organizations can transition incrementally without losing determinism or auditability.

### 7.1 Object Equivalence

Every 3D object has a 2D equivalent with a **stable canonical ID** that is the same in both views:

- 3D object -> row in an inspector sheet (flat table) with the same `object.id` used in 3D picking, inspector, and API
- 3D relationships -> joinable references (foreign keys: `sourceId`, `targetId`, `relationshipType`) that can be filtered, exported, and diffed in any 2D tool
- 3D history (timeboxes) -> timebox table (columns: `timeboxId`, `startCommitIndex`, `endCommitIndex`, `commitCount`, `confidence`, `wiltFactor`) + commit list (flat log with `commitId`, `author`, `timestamp`, `operation`, `targetId`)
- 3D presence markers -> user/agent status rows (columns: `userId/scvId`, `focusTarget`, `tier`, `status`, `lastSeen`)
- 3D flow channels -> step-by-step procedure documents (ordered list: `stepIndex`, `kind`, `targetId`, `description`, `outcome`)
- 3D proximity channels -> channel membership table + action log (columns: `channelId`, `userId`, `joinedAt`, `leftAt`, `actionsCount`)

**Stable ID Construction Law (definitive rule)**

Canonical IDs are deterministic, intrinsic, and view-independent. The construction rule:

- **Cells**: `cell.<moduleId>.<sheetId>.R<row>.C<col>` — e.g., `cell.P2P.InvoiceLines.R5.C3`
- **Sheets**: `sheet.<moduleId>.<sheetId>` — e.g., `sheet.P2P.InvoiceLines`
- **Match rows**: `match.<matchSheetId>.<deterministic-key>` — e.g., `match.3WM.INV1001-PO2001-GR3001`
- **Routes**: `route.<moduleId>.<routeId>` — e.g., `route.P2P.p2p.invoice`
- **Branches**: `branch.<companyId>.<deptPath>` — e.g., `branch.avgol.ops.packaging`
- **Modules**: `module.<moduleId>` — e.g., `module.P2P`
- **Flows**: `flow.<scope>.<slug>` — e.g., `flow.P2P.ap-aging-review-v2`
- **Proximity channels**: `prox.<fingerprint-hash>` or `prox.adhoc.<creator>.<timestamp>`
- **Commits**: `commit.<sha256-hash>`
- **Timeboxes**: `timebox.<branchId>.<startCommitIndex>-<endCommitIndex>`

Construction rules (non-negotiable):

- IDs are derived from **(objectType, moduleId, deterministic key)** — never from view state, camera position, LOD level, or rendering order
- IDs are **never derived from timestamps alone** (timestamps are advisory, not identity)
- IDs are **never regenerated per session** — the same object always has the same ID across restarts, exports, imports, and replays
- IDs are **never generated per-view** — 3D picking, 2D inspector, headless API, and CSV export all use the identical ID
- The ID is intrinsic to the object and computable from its definition without any external state

### 7.2 Action Equivalence

Every action performable in 3D is also performable in 2D:

- Ingest (route a record)
- Reconcile (trigger match rebuild)
- Summarize (formula recalculation)
- Propose (create draft commit)
- Commit (materialize change)
- Revert (create reversal commit)
- Audit request (create scoped task for SCV)
- Flow record / playback (step list without camera)

### 7.3 Headless Mode Gate

The system must support a "headless mode" that runs without Cesium / 3D rendering, producing identical data outputs:

- Route ingest -> fact sheet rows (same)
- Match rebuild -> match sheet rows (same)
- Summary formulas -> computed values (same)
- KPI bindings -> metric values (same)
- Commit / revert -> commit log entries (same)
- Audit request -> findings sheet rows (same)

**Golden outputs for comparison (exact parity targets):**

The headless run and the 3D run must produce byte-identical results on these specific outputs:

- **Fact sheets**: row count + SHA-256 hash of all row content (sorted by provenance key)
- **Match sheets**: row count + SHA-256 hash of all match rows (sorted by match key) + exception count
- **Summary sheets**: computed cell values (as strings, 6 decimal places) + SHA-256 hash of the full value grid
- **KPI metrics**: metric ID + value + unit for each binding (sorted by metricId)
- **Commit log**: commit count + SHA-256 hash of all commit entries (in commitIndex order)

Comparison method: after both runs complete, compare the 5 golden output hashes. If all match: PASS. If any differ: REFUSAL with the specific output that diverged.

**Acceptance gate:** Run `relayD0Gate(10000)` in headless mode (no Cesium viewer) and verify D0.1, D0.2, D0.4, D0.5 produce identical golden outputs to 3D mode. D0.3 (redraw) is N/A in headless.

Log: `[HEADLESS] gate=D0.1 result=PASS|REFUSAL`
Log: `[HEADLESS] golden-compare facts=MATCH|DIVERGE matches=MATCH|DIVERGE summaries=MATCH|DIVERGE kpis=MATCH|DIVERGE commits=MATCH|DIVERGE`
Example: `[HEADLESS] gate=D0.1 result=PASS rows=10000 duration=340ms`
Example: `[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH commits=MATCH sha256=e4f5a6…b7c8`

### 7.4 Import/Export Round-Trip

Any Relay state must be exportable to flat files (CSV/JSON) and re-importable through routes:

- Fact sheets -> CSV with provenance columns
- Match sheets -> CSV with match metadata
- Summary sheets -> CSV with formula text column
- Commit log -> JSON array
- Flow channels -> JSON step list

This guarantees that organizations unwilling to adopt 3D can still use Relay as a data-flow coordination engine.

---

## 8. Execution Order (How Canon Should Proceed)

**Execution principles:**

- Execution order can change. System coverage cannot shrink.
- Process is sufficiently locked; process edits are now unblock-only.
- Each slice ships: code references, runtime screenshot/video, proof artifact + index entry, contract alignment.
- The A-L module architecture remains valid. Execution ordering overlays sequence, not model truth.

### 8.1 Completed Build History

Build in this order (all below are PASS with indexed proof artifacts):

1. R0 visibility lock ✅
2. R1 HUD consolidation ✅
3. R2/R3 semantic + shared-anchor clarity ✅
4. R4 presentation refinement ✅
5. R5 restoration indexing ✅
6. Visual grammar (VIS-TREE-SCAFFOLD-1 ✅, HEIGHT-BAND-1 ✅, VIS-MEGASHEET-1 ✅) ✅
7. Temporal navigation (CAM0.4.2-FILAMENT-RIDE-V1) ✅
8. Video presence (PRESENCE-STREAM-1, PRESENCE-RENDER-1, PRESENCE-COMMIT-BOUNDARY-1) ✅
9. Headless parity (HEADLESS-0) ✅
10. Deterministic replay (E3-REPLAY-1) ✅
11. Cryptographic integrity (E1-CRYPTO-1) ✅
12. Visual polish (VIS-GRAMMAR-POLISH-1, FILAMENT-LIFELINE-1, VIS-LAUNCH-TREE-READABILITY-1) ✅

See Section 1.6 for the full completed slice queue with commit hashes.

### 8.2 Current Queue

13. **V93-DATA-SALVAGE-1** ✅ PASS (2026-02-17) — PROOF-INDEX: `V93-DATA-SALVAGE-1`
14. **V93-TRUNK-SEED-BRIDGE-1** ✅ PASS (2026-02-17) — PROOF-INDEX: `V93-TRUNK-SEED-BRIDGE-1`
15. **V93-VOTE-AGG-BRIDGE-1** ✅ PASS (2026-02-17) — PROOF-INDEX: `V93-VOTE-AGG-BRIDGE-1`
16. **DEMO-FLYBY-POLISH-1** — demo flyby choreography polish ← NEXT
17. **V93-VOTE-LENS-1 (optional)** — launch/scaffold vote-intensity lens as presentation-only overlay

### 8.3 Queued: Universal Tree Model (Tier 2.5 — After Demo Flyby)

18. `PRE-FILAMENT-SPACE-1` — DraftNode cognitive scratch layer (create/render/convert-to-filament)
19. `FILAMENT-UNIT-2.1` — Filament Identity Lock (schema + spawn + lifecycle transitions)
20. `FILAMENT-UNIT-2.2` — Depth Extrusion Renderer (per-cell BoxGeometry behind sheet, log-scale, heatmap, LOD collapse)
21. `FILAMENT-UNIT-2.3` — Branch Radius from KPI Aggregation (normalized delta formula, shrink safety)
22. `PIVOT-LENS-1.1` — Pivot UI (sandbox drag-and-drop, instant depth updates)
23. `PIVOT-LENS-1.2` — Ghost Preview (KPI preview without governance)
24. `PIVOT-LENS-1.3` — Bind as KPI (governance PROPOSE → COMMIT path)
25. `TEMPLATE-REGISTRY-1` — Tree Templates (8 topologies + classification stub)
26. `ROOT-COMPRESSION-1` — Commit-Time Archive (root cubes below trunk, queryable)

**Rationale:** Universal Tree primitives must be structurally sound before collaborative features (Tier 3) can operate on them. Filament identity and depth extrusion are foundational; pivot lens and template registry enable domain-agnostic use.

### 8.4 Tier Roadmap (Status as of 2026-02-17)

Status key: ✅ v0 = contract proven (model-layer or runtime), ✅ prod = production-integrated, ⬜ = not started.

```
  |--- TIER 1: ERP-Replacement Core
  |     |
  |     +-- D0: Keep truth+unblock policy locked ✅ prod (policy-locked, FORCED_RAF)
  |     +-- W0/W1/W2: Artifact chain + action materiality + delta-triggered HOLD ✅ prod (runtime-integrated)
  |     +-- AC0: TransferPacket validator + ResponsibilityPacket mirror ✅ v0 (model-layer, 2026-02-11)
  |     +-- LGR0: Ledger projection v0 ✅ v0 (model-layer, 2026-02-11)
  |     +-- D1-LEDGER-GATE: 1000 synthetic postings ✅ v0 (model-layer, 2026-02-11)
  |     +-- SG0: Stage Gates (ISG + GSG) ✅ v0 (model-layer, 2026-02-11)
  |
  |--- TIER 2: Transactional Universality + Presence
  |     |
  |     +-- P2P-CORE: PR->PO->GR->INV->PAY chain ✅ v0 (model-layer, 2026-02-11)
  |     +-- INV-CORE: inventory moves + valuation ✅ v0 (model-layer, 2026-02-11)
  |     +-- PAY-CORE: payment run + bank reconciliation ✅ v0 (model-layer, 2026-02-11)
  |     +-- TAX0: tax/compliance fields + export ✅ v0 (model-layer, 2026-02-11)
  |     +-- L0: Presence primitives ✅ v0 (model-layer, 2026-02-11)
  |     +-- L1: SCV presence ✅ v0 (model-layer, 2026-02-11)
  |     +-- C1: Manufacturing module (config-only) ✅ v0 (model-layer, 2026-02-11)
  |     +-- D2: File Import Adapters ✅ v0 (model-layer, 2026-02-11)
  |     +-- D1: Inter-Branch Aggregation ✅ v0 (model-layer, 2026-02-11)
  |     +-- D3: API/Webhook Connectors ✅ v0 (model-layer, 2026-02-11)
  |     +-- UX-3: Branch Steward ✅ v0 (model-layer, 2026-02-11)
  |     +-- V93-MIGRATION-BRIDGE-1: Voting/Geo Salvage ✅ v0 (runtime-integrated, 2026-02-17)
  |
  |--- TIER 2.5: Universal Tree Model (see Section 8.3 for slice-level queue) ⬜ NOT STARTED
  |     |
  |     +-- PRE-FILAMENT-SPACE-1 → FILAMENT-UNIT-2 → DEPTH-EXTRUSION → PIVOT-LENS → TEMPLATE-REGISTRY → ROOT-COMPRESSION
  |
  |--- TIER 3: Work Alone + Together
  |     |
  |     +-- L2: Audit Requests ✅ v0 (model-layer, 2026-02-11)
  |     +-- L5: PresenceStream ✅ v0 (runtime-integrated, 2026-02-15)
  |     +-- F0: Flow Channels — F0.1-F0.2 ✅ v0 (model-layer) | F0.3-F0.4 ⬜
  |     +-- CAM0: Camera Physics — all modes ✅ v0 (CAM0.4.2 runtime-integrated, others model-layer)
  |     +-- D-Lens-1: Focus Sphere ✅ v0 (model-layer, 2026-02-11)
  |
  |--- TIER 4: Trust, Governance, and Financial Hardening
  |     |
  |     +-- E1: Cryptographic Integrity ✅ v0 (runtime-integrated, 2026-02-15)
  |     +-- E2: Governance Workflows ⬜
  |     +-- E3: Deterministic Replay ✅ v0 (runtime-integrated, 2026-02-15)
  |     +-- E4: Multi-Company / Regional Topology ⬜
  |     +-- E5: Collaborative Lenses / Immersive ⬜
  |
  |--- TIER 5: Advanced Viz (when measured need) ⬜
        |
        +-- TB1-v1: Thick Timeboxes ⬜
        +-- TB1-v2: Physical flourish ⬜
        +-- UX-2.2: Leaf Clustering ⬜
        +-- VIS1: Visual Shape Language ⬜
```

**What "v0" means for the next build phase:** Tier 2.5 (Universal Tree Model) is the first tier with NO v0 baseline. Everything here is net-new implementation. Tiers 1-2 and parts of 3-4 have v0 baselines that need hardening, not rebuilding.

---

## 9. What Is NOT in This Plan (Explicitly Rejected)

- No menus, ribbons, or option panels
- No opaque math (LINEST, FORECAST, regression)
- No hidden aggregation engines
- No "smart" routing that computes during ingestion
- No branch-to-branch data sharing outside explicit routes
- No auto-execution by AI or pressure — SCVs produce findings + proposals, never execute
- No "managers command AI" — managers issue scoped audit requests; SCVs respond with evidence
- No desktop OS overlay until core ERP proven (parked)
- No "file becomes a new planet" — Focus Sphere is a lens, not truth layer
- No infinite sphere expansion by count (use LOD + paging + clustering)
- No hidden SCV activity — every SCV action is visible, logged, and inspectable
- No auto-enrollment in proximity channels — opt-in only
- No presence tracking above Tier 0 without explicit consent
- No 3D photoreal avatars — real video frames are the photorealism (L.5)
- No environment photorealism — tree geometry stays legible, not cinematic
- No silent video/audio recording — all recording requires visible all-party consent (L.5, Contract #15)
- No standalone accounting origin module that accepts direct debit/credit writes
- No direct journal-entry API that bypasses COMMIT TransferPacket validation
- No ledger-as-source-of-truth pattern; ledger is projection only
- No volumetric strand weaving for individual filaments — at scale this collapses; use depth extrusion + LOD aggregation instead
- No cross-filament arc connectors or dependency lines — the tree shape IS the model; arcs add visual noise without structural information
- No cell width/height changes based on magnitude — the 2D grid is sacred (Contract #17)
- No pre-declared pivot categories in templates — categories are discovered by humans (Contract #18)
- No automatic KPI binding from pivot exploration — binding requires governance (PROPOSE → COMMIT)
- No branch shrink/vanish while ACTIVE or HOLD filaments exist (Contract #19)

---

## 10. Acceptance: How We Know Each Tier Is Done

**Tier 1 Done:** D0 policy-proof logs stable + W0/W1/W2 artifact pipeline operational + AC0 transfer packets validated + LGR0 journal/trial-balance working + `D1-LEDGER-GATE` passes deterministic balanced postings + SG0 enforced + headless parity gate passes

**Tier 2 Done:** Canonical P2P chain (`PR->PO->GR->INV->PAY`) runs in Relay with posting gates + inventory/payment/tax baselines active + presence markers visible for users + SCVs + MFG module loads via config only + import/API routes and branch steward operational

**Tier 2.5 Done:** Filament identity schema locked and every fact row spawns exactly one filament with lifecycle logging + per-cell depth extrusion renders behind sheet with log-scale walls visible from side view + branch radius driven by normalized KPI formula + pivot lens opens on any fact/match sheet with drag-and-drop grouping producing instant depth updates + ghost KPI preview works without governance + bind-as-KPI path produces governed summary cell + 8 tree templates load from registry with correct topology + classification stub suggests template from file metadata + root compression cubes appear below trunk for closed filaments and are queryable

**Tier 3 Done:** Audit request -> SCV findings -> approval flow works + Flow recorded -> played -> voted -> promoted as default + camera travels with animation + all 5 movement modes functional + focus sphere isolates any object with context + live video/audio calls operational via WebRTC with ephemeral streams, LOD-governed video texture cards, and optional commit boundary summaries

**Tier 4 Done:** Commits carry Merkle hashes + replay reproduces state + governance workflows operational + financial close/period locks/reversals auditable + multi-company routing live + full LOD ladder navigable from LANIAKEA to CELL

**Tier 5 Done:** Timeboxes thick with density/confidence (v1) + optional ERI-driven walls (v2) + clustering activates on dense branches + volumetric limbs and taper rendering

---

## 11. Coverage Matrix (Nothing Forgotten)

This matrix maps every critical system aspect to where it is specified in the plan, which module/phase owns it, whether it has an acceptance gate, and its current implementation status.

### 11.0 Implementation Status Model (Locked)

Every coverage matrix entry uses a three-tier status model. No "PASS" claim is valid without a PROOF-INDEX anchor.

**Status tiers:**

- **No** — No implementation exists. Work starts from the specification in this plan.
- **v0 PASS** — Contractual baseline proven. A proof script exists, ran successfully, produced indexed artifacts in `archive/proofs/`, and is referenced in `archive/proofs/PROOF-INDEX.md`. The architectural contract is satisfied on synthetic data paths. This is NOT production-complete. When the tier arrives, the work is "harden from v0 to production" — not "build from scratch."
- **Production PASS (commit: `<hash>`)** — Full integration proven under runtime stress. Exercised through the Cesium runtime with live data paths, regression suites green, and commit hash anchored.

**Runtime integration qualifier:**

Each v0 entry also declares its integration level:

- **Runtime-integrated** — Proof ran via Playwright against the live Cesium runtime (`relay-cesium-world.html`). Behavior exercised in the actual rendering/interaction environment.
- **Model-layer only** — Proof ran via Node.js against `core/models/` implementations. Contract logic proven but not yet exercised through the full Cesium runtime pipeline.

**Hard rule:** If a coverage matrix entry claims any status above "No", it MUST include a `PROOF-INDEX` entry name and artifact path. If the proof cannot be located, the status reverts to `UNVERIFIED` until re-proven. "Trust me, it works" is not a status.

**1. 2D Backward Compatibility**

- Specified in: Section 7 (Object Equivalence, Action Equivalence, Headless Gate, Round-Trip)
- Module: All (cross-cutting)
- Phase: HEADLESS-0 (Tier 1)
- Gate: Yes — headless D0 produces identical outputs
- Implemented: v0 PASS — PROOF-INDEX: `HEADLESS-0` (`headless-0-console-2026-02-15.log`), runtime-integrated (Playwright, SHA-256 golden hash comparison)

**2. Identity and Privacy (Presence Tiering)**

- Specified in: Module L.1, Section 6.6
- Module: L (Presence)
- Phase: L0 (Tier 2)
- Gate: Yes — leaving proximity preserves read-only; no identity leak
- Implemented: v0 PASS — PROOF-INDEX: `L0` (`l0-presence-primitives-proof-console-2026-02-11.log`), model-layer only

**3. Proximity Channels (BLE/Wi-Fi Full Lifecycle)**

- Specified in: F0.4 (6-stage lifecycle: discovery, join, active, owner assertion, leaving, anti-spoof)
- Module: L (Presence) + F (Flow Channels)
- Phase: F0 (Tier 3)
- Gate: Yes — act only when in range; spoof = indeterminate/refusal
- Implemented: No (F0.1-F0.2 are v0, but F0.4 proximity lifecycle is not started)

**4. Flow Channels as Procedures (Semantic Steps)**

- Specified in: F0.1 (Path, Steps, Intent, Evidence, Outcome, Scope)
- Module: F (Flow Channels)
- Phase: F0 (Tier 3)
- Gate: Yes — another user reproduces same analysis outcome
- Implemented: v0 PASS — F0.1-F0.2 only. PROOF-INDEX: `F0.1–F0.2` (`f0-flow-proof-console-2026-02-11.log`), model-layer only. F0.3 (voting/promotion) and F0.4 (proximity) not started.

**5. Travel Continuity (No Teleport)**

- Specified in: CAM0.1, CAM0.4
- Module: H (HUD/Interaction) + E (Visualization)
- Phase: CAM0 (Tier 3)
- Gate: Yes — focus + exit returns to exact prior context
- Implemented: v0 PASS — PROOF-INDEX: `CAM0.1+0.3` (`cam0-travel-presets-proof-console-2026-02-11.log`), `CAM0.2` (`cam0-basin-influence-proof-console-2026-02-11.log`), `CAM0.4` (`cam0-branch-walk-proof-console-2026-02-11.log`), `CAM0.4.2` (`cam042-filament-ride-v1-proof.mjs`, runtime-integrated 12/12 stages). Model-layer for v0 modes; runtime-integrated for CAM0.4.2.

**6. SCV Agents (Visible, Scoped, Non-Executing)**

- Specified in: Module L.2, Section 6.5
- Module: L (Presence)
- Phase: L1 (Tier 2)
- Gate: Yes — every SCV output links to provenance; action without authority = refusal
- Implemented: v0 PASS — PROOF-INDEX: `L1` (`l1-scv-presence-proof-console-2026-02-11.log`), model-layer only

**7. Audit Requests (Manager -> SCV Delegation)**

- Specified in: Module L.3
- Module: L (Presence) + I (Governance)
- Phase: L2 (Tier 3)
- Gate: Yes — requests logged; proposals require authorityRef
- Implemented: v0 PASS — PROOF-INDEX: `L2` (`l2-audit-requests-proof-console-2026-02-11.log`), model-layer only

**8. Commit Materiality Thresholds**

- Specified in: Module A (Material Boundary Triggers)
- Module: A (Canon/Truth)
- Phase: W0 (Tier 1)
- Gate: Yes — edits crossing thresholds force HOLD/PROPOSE
- Implemented: v0 PASS — W0-W2 baseline proven and runtime-integrated (see Section 1.1). Threshold detection is contract-specified but auto-HOLD enforcement is partial (route delta triggers present, full dependency-graph threshold detection pending).

**9. Timebox Wilt Model**

- Specified in: TB1-v2 (inputs, 3 output channels, what it doesn't do, repair)
- Module: D (Data Structures) + E (Visualization)
- Phase: TB1 (Tier 5)
- Gate: Yes — closing open items reverses wilt in next timebox
- Implemented: No

**10. Proof Artifact Policy**

- Specified in: Section 6.7
- Module: J (Code/Dev) + I (Governance)
- Phase: All phases (cross-cutting)
- Gate: Yes — no proof = no progression (INDETERMINATE until proven)
- Implemented: Partial (proof index exists and is actively used; not yet enforced as automated CI gate)

**11. Forbidden Language Lint as Phase Gate**

- Specified in: Section 6.8
- Module: J (Code/Dev)
- Phase: All phases (pre-commit + CI)
- Gate: Yes — REFUSAL on violation, blocks commit
- Implemented: Partial (lint script exists at `scripts/forbidden-language-lint.mjs`; not yet enforced as hard pre-commit hook)

**12. Deterministic Replay**

- Specified in: Phase E3 (rebuild, verify, mismatch = scar)
- Module: D (Data Structures) + C (Crypto)
- Phase: E3 (Tier 4)
- Gate: Yes — replayed state matches live state; divergence = refusal commit
- Implemented: v0 PASS — PROOF-INDEX: `E3-REPLAY-1` (`e3-replay-1-console-2026-02-15.log`), runtime-integrated (9/9 stages, Playwright browser proof, shadow workspace + divergence scar + partial range + golden hash). Regressions: HEADLESS-0 8/8, CAM0.4.2 12/12, PRESENCE-STREAM-1 7/7.

**13. Import/Export Round-Trip**

- Specified in: Section 7.4
- Module: All (cross-cutting)
- Phase: D2 (Tier 2) + HEADLESS-0 (Tier 1)
- Gate: Yes — export to CSV, reimport through routes, derived sheets consistent
- Implemented: v0 PASS — PROOF-INDEX: `D2` (`d2-import-proof-console-2026-02-11.log`), model-layer only. Import adapters proven; full round-trip (export → reimport → consistency check) not yet proven end-to-end.

**14. Cell-Level Permission (Envelope Encryption)**

- Specified in: Module C (Cell-Level Permission Model)
- Module: C (Crypto)
- Phase: E1 (Tier 4)
- Gate: Yes — encrypted cell verifiable without decryption; selective disclosure works
- Implemented: No (E1-CRYPTO-1 covers hash chain + Merkle integrity but not cell-level envelope encryption)

**15. Multi-Company Jurisdiction + Boundaries**

- Specified in: Phase E4 (Jurisdiction + Boundary Enforcement)
- Module: F (Globe) + I (Governance)
- Phase: E4 (Tier 4)
- Gate: Yes — cross-boundary without disclosure = REFUSAL
- Implemented: No

**16. Interaction Micro-Invariants**

- Specified in: Module H (Interaction Micro-Invariants)
- Module: H (HUD/Interaction)
- Phase: R0 / UX-1 (Tier 1, ongoing)
- Gate: Yes — no accidental pointer lock; edit mode captures input; deterministic rerender
- Implemented: Partial (pointer lock, edit capture, and deterministic rerender are enforced in runtime; not all micro-invariants formalized as proof gates)

**17. Human Process Modules (HR, Policy, Communication)**

- Specified in: Module I (Human Process Modules)
- Module: I (Governance)
- Phase: E2 (Tier 4)
- Gate: Yes — HR policies as versioned filaments; recurrence as governed policy
- Implemented: No

**18. ERP Replacement Scope Lock**

- Specified in: Section 0 and Section 5 (Tier 1/2 scope and sequence)
- Module: A + D + I (cross-cutting)
- Phase: AC0/LGR0 onward
- Gate: Yes — Relay posting paths are canonical; external ERP connectors are bridge-only
- Implemented: v0 PASS — Scope lock is documented and enforced. AC0/LGR0/P2P-CORE v0 baselines prove canonical posting paths exist (`ac0-proof-console-2026-02-11.log`, `p2p-core-proof-console-2026-02-11.log`). Model-layer only; full runtime integration pending.

**19. Balanced Transfer + Mirrored Responsibility**

- Specified in: Module D (TransferPacket + ResponsibilityPacket) and Tier 1 AC0
- Module: D + G + I
- Phase: AC0 (Tier 1)
- Gate: Yes — every material COMMIT must validate balanced transfer legs and user mirror linkage; any missing mirror or unresolved container is refusal
- Implemented: v0 PASS — PROOF-INDEX: `AC0` (`ac0-proof-console-2026-02-11.log`), model-layer only. 9 test cases: balanced pass, unbalanced refusal, missing container refusal, mismatch gate, variance path. Impl: `core/models/ledger/ledger-v0.js`.

**20. 3-Way Match Posting Gate**

- Specified in: Tier 1 AC0.4 and Tier 2 P2P-CORE
- Module: B + I
- Phase: AC0/LGR0 (Tier 1) then P2P-CORE (Tier 2)
- Gate: Yes — match PASS enables posting; mismatch forces HOLD/PROPOSE path with explicit variance/correction container
- Implemented: v0 PASS — PROOF-INDEX: `P2P-CORE` (`p2p-core-proof-console-2026-02-11.log`), model-layer only. Happy path (PR→PO→GR→INV→PAY) + mismatch scenario (refusal → variance path) proven. Impl: `core/models/p2p/p2p-core-v0.js`.

**21. Ledger Determinism (D1 Ledger Gate)**

- Specified in: Tier 1 LGR0.3
- Module: D + I + J
- Phase: LGR0 (Tier 1)
- Gate: Yes — 1,000 synthetic packets balanced, deterministic projected trial balance, full provenance links, and zero direct journal-origin writes
- Implemented: v0 PASS — PROOF-INDEX: `D1 Ledger Gate` (`d1-ledger-gate-console-2026-02-11.log`), model-layer only. 1,000 packets generated, balanced, deterministic trial balance verified. Impl: `core/models/ledger/ledger-v0.js` + `core/models/ledger/coa-seed-v0.js`.

**22. Social Activation Lockdown (Precondition Gate)**

- Specified in: Section 13 (Social Activation Lockdown Addendum)
- Module: F + I + L (cross-cutting with governance/proximity/social surfaces)
- Phase: LCK-1..LCK-4 before social activation
- Gate: Yes — social activation flag remains blocked until all lock groups PASS with indexed proof artifacts
- Implemented: v0 PASS — PROOF-INDEX: `LCK-1` (`lck1-boundary-console-2026-02-11.log`, runtime-integrated), `LCK-2` (`lck2-vote-canon-console-2026-02-11.log`, model-layer), `LCK-3` (`lck3-governance-console-2026-02-11.log`, model-layer), `LCK-4` (`lck4-proof-index-console-2026-02-11.log`, model-layer). All four lock groups have indexed proof artifacts.

**23. Live Video/Audio Presence (PresenceStream)**

- Specified in: Module L.5 (PresenceStream)
- Module: L (Presence)
- Phase: L5 (Tier 3)
- Gate: Yes — streams are ephemeral, video textures LOD-governed, commit boundary requires all-party consent, no silent recording
- Slices: PRESENCE-STREAM-1 (signaling), PRESENCE-RENDER-1 (video textures + LOD), PRESENCE-COMMIT-BOUNDARY-1 (optional canonical summary)
- Dependencies: VIS-6c (WebSocket transport), VIS-7a (marker infrastructure), SCOPE-COHERENCE-1 (unified scope), W0-W2 (material artifact chain)
- Implemented: v0 PASS — PROOF-INDEX: `PRESENCE-STREAM-1` (7/7 stages, `presence-stream-1-console-2026-02-15.log`), `PRESENCE-RENDER-1` (10/10 stages, `presence-render-1-console-2026-02-15.log`), `PRESENCE-COMMIT-BOUNDARY-1` (9/9 stages, `presence-commit-boundary-1-console-2026-02-15.log`). All runtime-integrated via Playwright. Regressions green (CAM0.4.2 12/12).

**24. Filament Identity (Atomic Event Contract)**

- Specified in: Section 4.2 (Filament Identity Contract), Contract #16
- Module: D (Data Structures) + G (Company Tree)
- Phase: FILAMENT-UNIT-2.1 (Tier 2.5)
- Gate: Yes — 100 P2P records → 100 filaments → lifecycle transitions logged → no orphans
- Implemented: No

**25. Depth Extrusion (Magnitude Behind Sheet)**

- Specified in: Section 4.3 (Depth Extrusion Contract), Contract #17
- Module: E (Visualization) + G (Company Tree)
- Phase: FILAMENT-UNIT-2.2 (Tier 2.5)
- Gate: Yes — side view shows depth walls → $500K deeper than $5K → grid face unchanged → LOD collapses
- Implemented: No

**26. Pivot Lens (Sandbox Discovery)**

- Specified in: Section 4.4 (Pivot Lens Contract), Contract #18
- Module: B (Verification Physics) + E (Visualization)
- Phase: PIVOT-LENS-1 (Tier 2.5)
- Gate: Yes — pivot any column → depth updates → ghost KPI preview → bind requires governance
- Implemented: No

**27. Normalized KPI Interface (Cross-Domain Mixing)**

- Specified in: Section 4.5 (Normalized KPI Interface)
- Module: B (Verification Physics) + G (Company Tree)
- Phase: FILAMENT-UNIT-2.3 (Tier 2.5)
- Gate: Yes — branch radius driven by formula → cross-domain KPIs mix correctly → shrink safety enforced
- Implemented: No

**28. Template Registry (Pre-Designed Topologies)**

- Specified in: Section 4.6 (Template Registry)
- Module: G (Company Tree)
- Phase: TEMPLATE-REGISTRY-1 (Tier 2.5)
- Gate: Yes — 8 templates load → topology correct → classification stub suggests from metadata
- Implemented: No

**29. Root Compression (Commit-Time Archive)**

- Specified in: Section 4.7 (Root Compression)
- Module: D (Data Structures) + E (Visualization)
- Phase: ROOT-COMPRESSION-1 (Tier 2.5)
- Gate: Yes — closed filaments → root cubes below trunk → queryable → immutable → accounting chain linked
- Implemented: No

**30. Pre-Filament Space (DraftNode Cognitive Buffer)**

- Specified in: Section 4.1 (Pre-Filament Space), Contract #20
- Module: H (HUD/Interaction) + E (Visualization)
- Phase: PRE-FILAMENT-SPACE-1 (Tier 2.5)
- Gate: Yes — DraftNodes created on any surface → W0-only → auto-expire → convert-to-filament produces fact row → no KPI effect → no branch motion
- Implemented: No

**31. v93 Vote/Geo Data Salvage Parity**

- Specified in: Tier 2 Phase V93-MIGRATION-BRIDGE-1, Section 7.2/7.4, Section 12.10
- Module: F (Globe/Geospatial) + D (Data Structures) + I (Governance)
- Phase: V93-DATA-SALVAGE-1
- Gate: Yes — imported Relay vote objects match v93 totals/distribution/location coverage thresholds with refusal logs for malformed records
- Implemented: v0 PASS — PROOF-INDEX: `V93-DATA-SALVAGE-1` (`v93-data-salvage-1-2026-02-17/proof.log`), model-layer (Node.js adapter + parity report). Impl: `scripts/v93-to-relay-state-adapter.mjs`.

**32. Vote-Derived Trunk Seed Bridge**

- Specified in: Tier 2 Phase V93-MIGRATION-BRIDGE-1, Module F
- Module: F (Globe/Geospatial) + E (Visualization)
- Phase: V93-TRUNK-SEED-BRIDGE-1
- Gate: Yes — boundary-validated vote seeds produce deterministic world trunk anchors via canonical sync path
- Implemented: v0 PASS — PROOF-INDEX: `V93-TRUNK-SEED-BRIDGE-1` (`v93-trunk-seed-bridge-1-2026-02-17/proof.log`), runtime-integrated (Playwright, world profile, boundary validation + synthetic bad-seed rejection).

**33. Relay-Native Vote Aggregation Bridge**

- Specified in: Tier 2 Phase V93-MIGRATION-BRIDGE-1, Module B/G
- Module: B (Verification Physics) + G (Company Tree) + H (HUD/Interaction)
- Phase: V93-VOTE-AGG-BRIDGE-1
- Gate: Yes — topic/candidate aggregation visible in trunk/branch metadata without violating topology/physics contracts
- Implemented: v0 PASS — PROOF-INDEX: `V93-VOTE-AGG-BRIDGE-1` (`v93-vote-agg-bridge-1-2026-02-17/proof.log`), runtime-integrated (Playwright, world profile, aggregation metadata mapping, physics decoupled with `bridgePlaceholder:true`, `bridgePhysicsWeight:0`).

---

## 12. Implementation-Ready Schemas (AC0/LGR0 + P2P v0 + Universal Tree)

This section is normative for implementation. If code and this section disagree, this section wins until explicitly revised by commit.

### 12.1 Canonical Enums and Value Types

```json
{
  "UnitType": ["currency", "quantity"],
  "ActionRole": ["asserted", "approved", "executed"],
  "P2PObjectType": ["PR", "PO", "GR", "INV", "PAY", "MATCH"],
  "MatchStatus": ["MATCH", "PRICE_EXCEPTION", "QTY_EXCEPTION", "UNMATCHED"],
  "EntrySource": ["relay-form", "device-event", "import-csv", "import-json", "api-bridge"]
}
```

Numeric amounts MUST be stored as decimal strings (`"10000.00"`, `"100.000"`) to avoid floating-point drift in deterministic replay.

### 12.2 Core UOC References

```json
{
  "UocRef": {
    "type": "string",
    "id": "string"
  },
  "ContainerRef": {
    "type": "container",
    "id": "container.<scope>.<name>"
  },
  "ObjectRef": {
    "type": "PR|PO|GR|INV|PAY|MATCH|sheet|cell|module|branch|other",
    "id": "string"
  }
}
```

All `containerRef` values MUST resolve through UOC at COMMIT time. Implicit container creation is forbidden.

### 12.3 TransferPacket (System Reality, COMMIT-Embedded)

```json
{
  "TransferPacket": {
    "transferPacketId": "TP-<stable-id>",
    "commitId": "commit.<sha256>",
    "proposalId": "PROPOSAL-<id>",
    "objectId": "INV-3001|GR-7001|PAY-8001|...",
    "sourceObjectRef": { "type": "INV|GR|PAY|...", "id": "string" },
    "periodId": "2026-02",
    "unitTypes": ["currency", "quantity"],
    "legs": [
      {
        "legId": "TP-...-L1",
        "containerRef": { "type": "container", "id": "container.siteA.Inventory" },
        "amount": "10000.00",
        "unit": { "type": "currency", "code": "USD", "scale": 2 },
        "reasonCode": "P2P_GR_VALUE",
        "authorityRef": "policy.p2p.posting.v1"
      }
    ],
    "evidenceHash": "fnv1a|sha256",
    "createdAt": "ISO-8601",
    "createdBy": "user.<id>"
  }
}
```

Hard invariants (refusal on any violation):

1. For each unit bucket (`currency:USD`, `quantity:KG`, etc.), `sum(legs.amount) = 0`.
2. At least 2 legs per unit bucket.
3. Every leg has resolvable `containerRef`.
4. No COMMIT with material financial/inventory effect may execute without a valid TransferPacket.
5. No silent balancing or auto-generated compensating leg.

Refusal log:

`[REFUSAL] reason=UNBALANCED_TRANSFER_PACKET commitId=<...> transferPacketId=<...> unit=<...> delta=<...>`

### 12.4 ResponsibilityPacket (Human Reality Mirror)

```json
{
  "ResponsibilityPacket": {
    "responsibilityPacketId": "RP-<stable-id>",
    "commitId": "commit.<sha256>",
    "proposalId": "PROPOSAL-<id>",
    "objectId": "INV-3001|GR-7001|PAY-8001|...",
    "actorRef": { "type": "user", "id": "user.ap1" },
    "actionRole": "asserted|approved|executed",
    "authorityRef": "policy.p2p.approval.v2",
    "linkedTransferPacketId": "TP-<stable-id>",
    "evidenceHash": "fnv1a|sha256",
    "createdAt": "ISO-8601"
  }
}
```

Mirror invariants:

- Every COMMIT carrying a TransferPacket MUST produce at least one ResponsibilityPacket.
- If policy requires approval, an `approved` role packet is mandatory before COMMIT.
- `linkedTransferPacketId` MUST exist and belong to the same `commitId`.

Refusal log:

`[REFUSAL] reason=RESPONSIBILITY_MIRROR_MISSING commitId=<...> transferPacketId=<...>`

### 12.5 Commit Hook Contract

```json
{
  "CommitMaterializationRequest": {
    "mode": "COMMIT",
    "objectId": "string",
    "proposalId": "string",
    "evidenceHash": "string",
    "materialEffects": {
      "financial": true,
      "inventory": true
    },
    "transferPacket": "TransferPacket",
    "responsibilityPackets": ["ResponsibilityPacket"]
  }
}
```

Rules:

- If `materialEffects.financial=true` or `materialEffects.inventory=true`, `transferPacket` is required.
- COMMIT path validates TransferPacket first, then ResponsibilityPacket mirror, then persists commit.
- Ledger projection runs after commit success.

### 12.6 Ledger Projection Schemas (Derived, Never Origin)

```json
{
  "ProjectedJournalEntry": {
    "journalEntryId": "JE-<transferPacketId>",
    "transferPacketId": "TP-<id>",
    "commitId": "commit.<sha256>",
    "periodId": "2026-02",
    "lines": [
      {
        "lineId": "JE-...-1",
        "accountRef": "coa.<account-code>",
        "dimensionSet": {
          "entity": "AVGOL",
          "site": "SITE_A",
          "costCenter": "OPS",
          "project": "P2P"
        },
        "debit": "10000.00",
        "credit": "0.00",
        "currency": "USD"
      }
    ],
    "projectionHash": "sha256",
    "derivedAt": "ISO-8601"
  },
  "TrialBalanceRow": {
    "accountRef": "coa.<account-code>",
    "periodId": "2026-02",
    "debitTotal": "string-decimal",
    "creditTotal": "string-decimal",
    "net": "string-decimal"
  }
}
```

Projection invariants:

- `ProjectedJournalEntry` is deterministic from TransferPacket + mapping policy.
- Direct journal write API is forbidden.
- Trial balance is deterministic fold over projected journal entries.

### 12.7 P2P Canonical Objects (Relay-Native)

```json
{
  "PR": {
    "id": "PR-9001",
    "itemId": "item.RESIN_7",
    "qty": "100.000",
    "qtyUnit": "KG",
    "siteId": "SITE_A",
    "costCenter": "OPS",
    "requesterUserId": "user.buyer1",
    "neededBy": "YYYY-MM-DD"
  },
  "PO": {
    "id": "PO-5001",
    "prId": "PR-9001",
    "vendorId": "vendor.APEX",
    "itemId": "item.RESIN_7",
    "qty": "100.000",
    "qtyUnit": "KG",
    "unitPrice": "100.00",
    "currency": "USD",
    "siteId": "SITE_A"
  },
  "GR": {
    "id": "GR-7001",
    "poId": "PO-5001",
    "qtyReceived": "100.000",
    "qtyUnit": "KG",
    "siteId": "SITE_A",
    "receiverUserId": "user.receiver1",
    "receivedAt": "ISO-8601"
  },
  "INV": {
    "id": "INV-3001",
    "poId": "PO-5001",
    "qtyBilled": "100.000",
    "qtyUnit": "KG",
    "unitPrice": "100.00",
    "amount": "10000.00",
    "currency": "USD",
    "apUserId": "user.ap1",
    "invoiceDate": "YYYY-MM-DD"
  },
  "PAY": {
    "id": "PAY-8001",
    "invoiceId": "INV-3001",
    "amount": "10000.00",
    "currency": "USD",
    "treasuryUserId": "user.treasury1",
    "paidAt": "ISO-8601",
    "bankAccountRef": "bank.<id>"
  }
}
```

### 12.8 P2P Posting Rules v0 (Happy Path)

1. GR commit (`GR-7001`) creates `TP-GR-7001`:
   - Quantity legs: `+100 KG Inventory@SITE_A`, `-100 KG GRIR@SITE_A:qty`
   - Optional value legs: `+10000 USD Inventory@SITE_A:value`, `-10000 USD GRIR@SITE_A:value`
2. INV match PASS (`INV-3001`) creates `TP-INV-3001`:
   - Currency legs: `+10000 USD GRIR@SITE_A:value`, `-10000 USD AP@COMPANY`
3. PAY commit (`PAY-8001`) creates `TP-PAY-8001`:
   - Currency legs: `+10000 USD AP@COMPANY`, `-10000 USD CashBank@COMPANY`

Each packet requires mirrored ResponsibilityPacket(s) on actor tree.

### 12.9 3-Way Match Gate and Mismatch Resolution (No Disappearance Law)

If PO/GR/INV mismatch (e.g., invoice at `102.00` vs PO `100.00`), invoice posting to AP is blocked until PROPOSE/COMMIT resolution:

- **Option A:** Correct upstream fact (invoice/receipt correction), then re-run gate.
- **Option B:** Authorized tolerance/policy change (scoped, committed).
- **Option C:** Explicit variance packet.

Variance packet example (`TP-INV-3001-VAR`):

- `+10000 USD GRIR@SITE_A:value`
- `-10200 USD AP@COMPANY`
- `+200 USD PriceVariance@SITE_A`

Validation: `10000 + 200 - 10200 = 0` (balanced).  
Result: mismatch is moved into named container; it never disappears.

### 12.10 Relay-Native Inputs and Bridge Inputs

Accepted input paths for P2P v0:

1. Relay-native human entry forms (PR/PO/GR/INV/PAY).
2. Device events (barcode/RFID/scale/IoT) mapped through routes.
3. Bridge imports (CSV/JSON/API) during coexistence/migration.

All paths normalize to routed events and produce the same deterministic object/commit/packet pipeline.

v93 migration bridge rule (globe voting salvage):

- Legacy v93 vote/location artifacts are allowed only as bridge inputs.
- They must be normalized into Relay-native vote objects and optional trunk-seed candidates.
- No legacy runtime components (React/Cesium managers, legacy state stores) are imported into active runtime.
- Any vote-derived trunk seed must pass boundary validation and deterministic ID generation before canonical sync.

Adoption invariants (locked):

- **Boundaries** are scope containers, jurisdiction validators, eligibility gates, and disclosure rails.
- Boundaries are **not** physics modifiers, geometry drivers, or aggregation engines.
- Boundaries gate who can see and who can commit; they do not move trunks or branches.
- v93 vote data is adopted only as historical informational aggregates, contextual metadata, and migration seed inputs.
- Imported v93 vote outcomes are not governance authority inside Relay and are not direct geometry drivers.
- Authority remains Relay-native: `PROPOSE -> VOTE_WINDOW -> COMMIT` (W0-W2 governance path).
- Durable structure must remain traceable: `Filament -> Depth -> Pivot -> KPI -> Branch -> Trunk`.
- Vote volume, boundary clustering, social energy, or anchor density cannot directly thicken trunks or alter branch radius.
- Vote-derived trunk seeds instantiated by bridge are bootstrap anchors only and are transitional until routed through canonical pipeline, KPI binding, replay, and verification.
- **Canonical rule:** Boundaries gate scope, voting gates authority, towers emerge only from normalized KPI aggregation of filaments.

### 12.11 Universal Tree Schemas (Tier 2.5)

**DraftNode Schema (ephemeral, W0-only):**

```json
{
  "DraftNode": {
    "draftId": "draft.<uuid>",
    "surfaceRef": "branch.<companyId>.<deptPath>|sheet.<moduleId>.<sheetId>|trunk.<companyId>",
    "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
    "content": "string (free text, sketch reference, or voice-to-text)",
    "tags": ["string"],
    "createdBy": "user.<id>",
    "createdAt": "ISO-8601",
    "lastTouchedAt": "ISO-8601",
    "state": "DRAFT_ONLY",
    "convertible": true,
    "ttl": 604800,
    "linkedDraftIds": ["draft.<uuid>"],
    "convertedTo": "F-<objectType>-<objectId>|null"
  }
}
```

DraftNode invariants: W0-only, no magnitude, no KPI effect, no commit chain, auto-expires per TTL. Not included in replay, headless, or deterministic verification.

**Filament Schema (normative):**

```json
{
  "Filament": {
    "filamentId": "F-<objectType>-<objectId>",
    "originCellRef": "cell.<moduleId>.<sheetId>.R<row>.C<col>",
    "objectId": "string",
    "objectType": "string",
    "amount": "string-decimal|null",
    "unit": "string|null",
    "templateId": "template.<domain>.<variant>",
    "branchId": "branch.<companyId>.<deptPath>",
    "refs": ["cell.<moduleId>.<sheetId>.R<row>.C<col>"],
    "lifecycleState": "OPEN|ACTIVE|HOLD|CLOSED|ABSORBED",
    "workState": "DRAFT|PROPOSED|COMMITTED|REVERTED",
    "disclosureTier": 0,
    "commitIndexRange": { "start": 0, "end": null },
    "magnitude": "string-decimal|null",
    "spawnedAt": "ISO-8601",
    "closedAt": "ISO-8601|null",
    "absorbedAt": "ISO-8601|null"
  }
}
```

**KPIDriver Schema (normative):**

```json
{
  "KPIDriver": {
    "kpiId": "kpi.<branchId>.<metricName>",
    "sourceSummaryCellRef": "cell.<moduleId>.<sheetId>.R<row>.C<col>",
    "normalizedValue": "number [-1.0, +1.0]",
    "weight": "number [0.0, 1.0]",
    "direction": "+1|-1",
    "confidence": "number [0.0, 1.0]",
    "unitType": "ratio|currency|count|score|time",
    "baseline": "string-decimal",
    "lastComputedAt": "ISO-8601"
  }
}
```

**TreeTemplate Schema (normative):**

```json
{
  "TreeTemplate": {
    "templateId": "template.<domain>.<variant>",
    "name": "string",
    "domain": "procurement|manufacturing|music|engineering|personal|governance|it-ops|custom",
    "topology": {
      "trunk": "string",
      "branches": [
        {
          "id": "string",
          "name": "string",
          "sheets": [
            { "slot": "fact|match|summary", "suggestedName": "string", "schema": "optional" }
          ],
          "sub": ["recursive branch"]
        }
      ]
    },
    "suggestedKPIFlavors": [
      { "metricTemplate": "string", "targetBranch": "string" }
    ]
  }
}
```

**RootCube Schema (normative):**

```json
{
  "RootCube": {
    "cubeId": "root.<filamentId>",
    "filamentId": "string",
    "commitIndex": 0,
    "totalMagnitude": "string-decimal",
    "unit": "string",
    "branchPath": "branch.<companyId>.<deptPath>",
    "tags": { "dept": "string", "vendor": "string" },
    "timeboxId": "timebox.<branchId>.<start>-<end>",
    "closedAt": "ISO-8601",
    "absorptionHash": "sha256:...",
    "originCellRef": "cell.<moduleId>.<sheetId>.R<row>.C<col>",
    "derivedRefs": ["cell.<moduleId>.<sheetId>.R<row>.C<col>"],
    "transferPacketId": "TP-<id>|null",
    "responsibilityPacketId": "RP-<id>|null",
    "ledgerProjectionHash": "sha256:...|null",
    "merkleAnchor": {
      "chainHash": "sha256:...",
      "timeboxMerkleRoot": "sha256:...",
      "inclusionProofPath": ["sha256:..."]
    }
  }
}
```

RootCube accounting chain: `transferPacketId` links to balanced posting, `responsibilityPacketId` links to human accountability mirror, `ledgerProjectionHash` is SHA-256 of projected journal entry, `merkleAnchor` ties to E1-CRYPTO-1 integrity chain.

**PivotLensState Schema (ephemeral, not persisted in canon):**

```json
{
  "PivotLensState": {
    "lensId": "pivot.<userId>.<sessionTs>",
    "sourceSheetRef": "sheet.<moduleId>.<sheetId>",
    "rowFields": ["string"],
    "colFields": ["string"],
    "valueAggregation": "SUM|COUNT|AVG|MIN|MAX",
    "valueField": "string",
    "resultGrid": "computed at runtime",
    "ghostKPIs": [
      {
        "metricName": "string",
        "normalizedValue": "number",
        "ghostRadiusDelta": "number"
      }
    ]
  }
}
```

**DepthExtrusion Rendering Parameters (normative):**

```json
{
  "DepthExtrusionParams": {
    "scaleFunction": "log10(1 + |magnitude|) / log10(1 + maxAbsInView)",
    "maxDepthMeters": 50.0,
    "minDepthThreshold": 0.01,
    "negativeDirection": "opposite-side",
    "heatmapLow": "rgb(44, 123, 182)",
    "heatmapMid": "rgb(255, 191, 0)",
    "heatmapHigh": "rgb(215, 25, 28)",
    "heatmapNegative": "rgb(118, 42, 131)",
    "alphaAtCellLOD": 0.7,
    "alphaAtSheetLOD": 0.5,
    "alphaAtBranchLOD": 0.3,
    "suppressAtCompanyLOD": true,
    "depthChannels": ["magnitude"]
  }
}
```

`depthChannels` is reserved for future multi-channel depth (confidence, risk, urgency, probability). Currently only `"magnitude"` is implemented. Additional channels will produce independent extrusion layers when the need is measured.

---

## 13. Social Activation Lockdown Addendum (Hard Preconditions)

This addendum is binding. Social/Entertainment scope cannot be activated until all lock groups below are PASS with proof artifacts.

### 13.1 Activation Flag Policy

- `RELAY_SOCIAL_ACTIVATION_ENABLED` default: `false`.
- `RELAY_SOCIAL_ACTIVATION_ENABLED=true` is allowed only when lock groups `LCK-1..LCK-4` are all PASS.
- Any attempt to activate social modules before full lock PASS must refuse:
  - `[REFUSAL] reason=SOCIAL_LOCKDOWN_ACTIVE missing=<lockIds>`

### 13.2 Lock Groups (Pass/Fail)

#### LCK-1 Boundary System Restore and Proof (G3 Closure)

PASS criteria:

1. Boundary rendering is active in Cesium runtime (no permanent disable flag path).
2. `containsLL` correctness is proven for:
   - polygon
   - multipolygon
   - holes/interior rings
   - edge/on-border handling policy
3. No boundary-triggered viewer crash in acceptance run.
4. Plan/matrix G3 status updated from DEGRADED only after proof index references are present.
5. Boundary-safe governance constraint is explicit:
   - while boundary status is DEGRADED, governance voting is restricted to global-safe scopes only (no boundary-scoped authority votes).

Required logs:

- `[BOUNDARY] restore result=PASS renderer=<...> containsLL=<...>`
- `[BOUNDARY] containsll suite=PASS polygons=<n> multipolygons=<n> holes=<n>`
- `[GATE] G3 status=PASS evidence=<proofId>`
- `[BOUNDARY] voting-scope mode=<GLOBAL_SAFE_ONLY|BOUNDARY_ENABLED> reason=<boundary-status>`

#### LCK-2 Voting Canon Unification

PASS criteria:

1. One canonical quorum model only (cadence-based table) across all docs and examples.
2. Eligible voter set definition is explicit and deterministic per scope (`zone`, `boundary`, `role`).
3. Eligibility snapshot is frozen at proposal-open time and used for all quorum calculations; snapshot must include deterministic `voterCount` and `snapshotHash`.
4. Flow/content voting semantics are documented as non-authoritative ranking only.
5. Governance voting semantics are documented as authority-bearing only.
6. Pressure isolation is explicit and testable:
   - pressure has zero effect on vote weight
   - pressure has zero effect on quorum thresholds
   - pressure has zero effect on vote window duration/open-close behavior
7. Strict boundary governance is explicit:
   - global voting cannot influence company- or boundary-scoped governance authority decisions
   - cross-boundary authority influence requires explicit route/consent/governance commits, never passive vote bleed-through

Required logs:

- `[VOTE-CANON] quorum-model=CADENCE_TABLE status=PASS`
- `[VOTE-CANON] eligibility-snapshot scope=<...> voters=<n> frozenAt=<ts>`
- `[VOTE-CANON] separation flowVoting=ranking-only governanceVoting=authority`
- `[VOTE-CANON] pressure-isolation voteWeight=UNCHANGED quorum=UNCHANGED window=UNCHANGED`
- `[VOTE-CANON] strict-boundary-governance globalInfluenceOnCompanyAuthority=DISABLED`

#### LCK-3 Governance Executable Spec (Vote/Delegation/Veto)

PASS criteria:

1. Executable state machine is codified:
   - `DRAFT -> HOLD -> PROPOSE -> VOTE_WINDOW -> PASS|FAIL|VETO -> COMMIT|REFUSAL`
2. Delegation precedence is deterministic:
   - direct vote overrides delegation
   - delegation applies only if no direct vote exists
3. Veto semantics are explicit:
   - authorized veto roles by scope
   - veto always creates HOLD + reconciliation object (never silent block)
4. All transitions emit deterministic logs and refusal reasons.
5. Stage interaction is explicit:
   - governance vote may recommend stage unlock
   - stage unlock occurs only on explicit COMMIT carrying authorityRef (vote result alone is insufficient)
6. Scope isolation is explicit:
   - governance vote outcomes are applied only within their proposal scope boundary
   - global-scope governance votes cannot authorize company-scope commits

Required logs:

- `[GOV] state-transition from=<...> to=<...> proposalId=<...>`
- `[GOV] quorum-eval proposalId=<...> eligible=<n> participated=<n> threshold=<...> result=<PASS|FAIL>`
- `[GOV] delegation-resolve proposalId=<...> directVotes=<n> delegatedVotes=<n>`
- `[GOV] veto proposalId=<...> by=<role|user> action=HOLD_RECONCILE`
- `[GOV] stage-unlock proposalId=<...> voteResult=<...> commitRequired=true commitId=<...>`
- `[GOV] scope-isolation proposalId=<...> proposalScope=<...> commitScope=<...> result=<PASS|REFUSAL>`

#### LCK-4 Proof Index Completeness

PASS criteria:

1. `archive/proofs/PROOF-INDEX.md` contains referenced artifacts for boundary, presence, and vote prerequisites.
2. Every lock group PASS above has:
   - console proof block
   - screenshot/recording where applicable
   - indexed artifact references
3. No placeholder `MISSING` markers for prerequisite proofs.

Required logs:

- `[PROOF] audit lockGroup=<id> result=PASS artifacts=<count>`
- `[PROOF] index-sync result=PASS missing=0`

### 13.3 Social/Entertainment Activation Scope (Post-Lock Only)

Only after `LCK-1..LCK-4` all PASS:

- Enable Channel Explorer, social channels, content feeds, entertainment surfaces.
- Enable flow ranking/promotion features that are social-facing.
- Keep vote-type separation enforced:
  - content vote -> ranking only, no state authority
  - governance vote -> commit authority, stage-gated
  - governance authority is strict-boundary scoped; global votes do not affect company authority

Any runtime violation after activation must auto-revert activation flag and emit:

- `[REFUSAL] reason=SOCIAL_LOCK_REGRESSION lockGroup=<id> activation=DISABLED`
- `[REFUSAL] reason=GOV_SCOPE_VIOLATION proposalScope=<...> attemptedCommitScope=<...>`

### 13.4 Recommended Lock Execution Sequence

1. Boundary restore + proof (`LCK-1`)
2. Voting canon doc unification (`LCK-2`)
3. Governance executable state machine spec (`LCK-3`)
4. Proof index completeness sweep (`LCK-4`)
5. Then and only then set `RELAY_SOCIAL_ACTIVATION_ENABLED=true`

