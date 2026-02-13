# Relay Master Build Plan (Full System) — 2026-02-11

**Status: CANONICAL — This is the definitive end-to-end build plan for Relay.**
**Supersedes: [RELAY-COMPLETE-BUILD-PLAN.md](RELAY-COMPLETE-BUILD-PLAN.md) (retained for history)**
**Updated: 2026-02-11 (scope lock: Relay is ERP replacement system-of-record; 3D cognition + balanced transfer accounting; user-tree/system-tree mirrored postings; W0/W1/W2 artifact pipeline integrated; AC0 + LGR0 + D1 Ledger Gate implemented/proven/indexed)**


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

**In Progress (Unproven)**

- `GLOBE-RESTORE-4` (spec locked, implementation not started): branch/site geospatial assignment + canonical in-world Scope Inspector. See `docs/architecture/GLOBE-RESTORE-4-SPEC.md`.

**Explicitly Not Included Yet**

- Boundary editor UI restore
- Voting/social activation UI restore
- MapLibre/Deck overlay restore (`GLOBE-RESTORE-2` deferred)

**Launch Mode Rule (Live Review)**

- **Proof mode (default)**: `http://localhost:3000/relay-cesium-world.html`
- **World mode (required for globe restore features)**: `http://localhost:3000/relay-cesium-world.html?profile=world`
- If world features are not visible while not using world mode, treat as launch/config issue, not feature regression.

---

## 2. Frozen Contracts (Never Violated)

These are enforced assumptions used by every phase. Source: [RELAY-PHYSICS-CONTRACTS.md](docs/architecture/RELAY-PHYSICS-CONTRACTS.md)

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

### Blackbox Rejection Policy

No LINEST, FORECAST, regression, or opaque functions. Advanced math must decompose into visible intermediate sheets where every step is inspectable.

### The Only Allowed Data Path

```
External Event -> Route (normalize + append) -> Fact Sheet (append-only)
  -> Match Sheet (deterministic rebuild) -> Summary Sheet (formula recalc)
  -> KPI Binding (cell -> metric) -> Branch Timebox (metric -> geometry)
  -> Tree Motion (visible, auditable)
```

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

---

## 4. Forward Build Sequence (All Phases)

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

### TIER 3: Work Alone + Work Together (Collective Intelligence Layer)

This tier implements the "ants" / stigmergy / collective intelligence model — simple agents leaving signals that let the group solve tasks better than any one agent.

#### Phase F0: Flow Channels (F0.1-F0.2) ✅ PASSED (v0 pre-social)

Let people work individually, then share "how to do the job" as reusable, votable trails.

Activation guard: Social/Entertainment-facing flow/channel features are blocked until Section 12 (Social Activation Lockdown Addendum) reports PASS on all lock groups.

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

**CAM0.4: Movement Modes** (Branch Walk ✅ PASSED v0 slice; Filament Ride pending)

All modes from Module L are available as camera behaviors:

- **Free flight**: world navigation, world-up locked
- **Basin orbit assist**: soft lock around a tree/company (optional, never traps)
- **Filament ride**: move along a filament / time axis; timeboxes as snap points; scrub within timebox for history
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

## 5. Safety and Governance Rails (Enforced Continuously)

### 5.1 Language Discipline

- Forbidden-language lint enforced in CI ([config/forbidden-language.json](config/forbidden-language.json), [scripts/forbidden-language-lint.mjs](scripts/forbidden-language-lint.mjs))
- No adversarial terms: attack->audit, exploit->exposure precondition, breach->exposure condition, hack->verify
- Source: [FORBIDDEN-LANGUAGE.md](docs/governance/FORBIDDEN-LANGUAGE.md)

### 5.2 Data Minimization + Purpose Limitation

- "Pressure is continuous verification, not continuous surveillance"
- Retention + scope limits on all data
- Exports support pseudonymization + role-filtering
- Default proximity logging OFF; mutual consent for identity reveal

### 5.3 Learning Cannot Auto-Change Policy

- Learning writes recommendation commits only
- Applying any threshold/weight change requires authorityRef + policy version bump
- Selection required where applicable

### 5.4 Public vs Private Exposure Policy

- Public: aggregated KPIs, commitments, verified outcomes, service levels
- Private: personal data, contracts, supplier pricing, internal exception detail
- System allows selective disclosure even though "people will review anyway"

### 5.5 SCV / Agent Safety Rails

- SCVs never auto-execute; they produce findings, proposals, and recommendations only
- Every SCV action is visible in the world (marker + focus target + status)
- SCV proposed commits require human approval via authorityRef before materializing
- SCVs are subject to all 5 invariants (pressure budget, confidence floor, repair effectiveness, data minimization, policy governance)
- SCVs cannot escalate their own authority; scope is set by the audit request
- SCV findings are traceable: every row in a findings sheet links to the evidence that produced it

### 5.6 Presence Privacy Rails

- Default presence tier is 0 (anonymous dot); escalation requires mutual consent
- Presence trails are ephemeral by default; retention governed by data minimization policy
- Proximity channel membership is opt-in only; no auto-enrollment
- Sharing flows inherits channel scope; cannot leak to broader scope
- Presence data is never used for performance evaluation (policy-locked)

### 5.7 Proof Artifact Policy (No Proof, No Progression)

Every gate PASS requires three artifacts:

- **Console log block**: the `[GATE]`, `[D0-GATE]`, `[FLOW]`, etc. log lines that prove the gate ran and what it measured
- **Screenshot or recorded clip**: where visual verification is relevant (3D rendering, UI state, inspector content), a screenshot or short recording is required as proof
- **Doc line update**: the build plan document or phase document must be updated with a reference to the gate run (date, result, artifact location)

Storage: artifacts are stored in `archive/proofs/` and indexed in `archive/proofs/PROOF-INDEX.md`.

Rule: if a gate is claimed as PASSED but no artifact exists, the gate is NOT passed — it is INDETERMINATE until proof is provided. Social proof ("trust me, it works"), partial passes ("mostly done"), and future promises ("we'll fix it in Phase 3") are all forbidden.

### 5.8 Language Guard as Phase Gate

Forbidden-language lint is not just a CI check — it is a **phase gate**:

- **Pre-commit hook**: blocks commit if forbidden tokens appear in docs, UI text, code comments, or user-facing strings. Source: [config/forbidden-language.json](config/forbidden-language.json)
- **CI gate**: blocks PR merge if lint fails. Source: [scripts/forbidden-language-lint.mjs](scripts/forbidden-language-lint.mjs)
- **REFUSAL on violation**: if forbidden language is detected in any file that would be committed, the system produces `[REFUSAL] reason=FORBIDDEN_LANGUAGE token=<...> file=<...>` and blocks the commit. This is a hard refusal, not a warning.
- **Scope**: applies to all `.md`, `.js`, `.html`, `.json`, and `.txt` files in the repo. Does not apply to binary files or third-party dependencies.
- **Safe terminology replacements**: attack->audit, exploit->exposure precondition, breach->exposure condition, hack->verify, penetration test->integrity check, infiltrate->verify, war-game->verification scenario, attacker->coherence operator

This ensures the entire codebase and documentation consistently use non-adversarial, audit-oriented language.

---

## 6. 2D Compatibility and Migration Contract

Relay is the canonical system of record, but migration and interoperability remain first-class. This contract guarantees that every capability has a 2D equivalent, the system can run headless, and organizations can transition incrementally without losing determinism or auditability.

### 6.1 Object Equivalence

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

### 6.2 Action Equivalence

Every action performable in 3D is also performable in 2D:

- Ingest (route a record)
- Reconcile (trigger match rebuild)
- Summarize (formula recalculation)
- Propose (create draft commit)
- Commit (materialize change)
- Revert (create reversal commit)
- Audit request (create scoped task for SCV)
- Flow record / playback (step list without camera)

### 6.3 Headless Mode Gate

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

### 6.4 Import/Export Round-Trip

Any Relay state must be exportable to flat files (CSV/JSON) and re-importable through routes:

- Fact sheets -> CSV with provenance columns
- Match sheets -> CSV with match metadata
- Summary sheets -> CSV with formula text column
- Commit log -> JSON array
- Flow channels -> JSON step list

This guarantees that organizations unwilling to adopt 3D can still use Relay as a data-flow coordination engine.

---

## 7. Execution Order (How Canon Should Proceed)

```
CURRENT: A0-C0 COMPLETE, D-Lens-0/D-Lens-1 DONE, UX-1 DONE, D0 POLICY-LOCKED, W0/W1/W2 BASELINE LIVE
  |
  |--- TIER 1: ERP-Replacement Core
  |     |
  |     +-- D0: Keep truth+unblock policy locked (non-blocking strict FPS work only)
  |     |
  |     +-- W0/W1/W2: Artifact chain + action materiality + delta-triggered HOLD (maintain and harden)
  |     |
  |     +-- AC0: COMMIT-embedded TransferPacket validator + ResponsibilityPacket mirror
  |     |
  |     +-- LGR0: Ledger projection v0 (derived journal + trial balance fold from packets)
  |     |
  |     +-- D1-LEDGER-GATE: 1000 synthetic postings, balanced + deterministic + artifact-linked
  |     |
  |     +-- SG0: Stage Gates (ISG for learning, GSG for mechanics)
  |     |
  |     +-- HEADLESS-0: Headless parity + migration gate
  |
  |--- TIER 2: Transactional Universality + Presence
  |     |
  |     +-- P2P-CORE: PR->PO->GR->INV->PAY canonical object chain with posting gates
  |     +-- INV-CORE: inventory moves + valuation baseline
  |     +-- PAY-CORE: payment run + bank reconciliation baseline
  |     +-- TAX0: minimal tax/compliance fields + export rails
  |     +-- L0: Presence primitives (markers, tiers, trails)
  |     +-- L1: SCV presence (visible AI agents + capability lists)
  |     +-- C1: Manufacturing module (pure config, zero code)
  |     +-- D2: File Import Adapters (Excel/CSV -> route)
  |     +-- D1: Inter-Branch Aggregation (branch -> trunk bands)
  |     +-- D3: API/Webhook Connectors
  |     +-- UX-3: Branch Steward (visible configuration)
  |
  |--- TIER 3: Work Alone + Together
  |     |
  |     +-- L2: Audit Requests (Manager -> SCV scoped audit flow)
  |     +-- F0: Flow Channels (record / play / vote / proximity)
  |     +-- CAM0: Camera Physics (animated travel, basins, presets, movement modes)
  |     +-- D-Lens-1: Focus Sphere (extended lens with sphere boundary) ✅ PASSED (v0 slice)
  |
  |--- TIER 4: Trust, Governance, and Financial Hardening
  |     |
  |     +-- E1: Cryptographic Integrity
  |     +-- E2: Governance Workflows
  |     +-- E3: Deterministic Replay
  |     +-- E4: Multi-Company / Regional Topology (full LOD ladder active)
  |     +-- E5: Collaborative Lenses / Immersive
  |
  |--- TIER 5: Advanced Viz (when measured need)
        |
        +-- TB1-v1: Thick Timeboxes (density, confidence, snap/scrub)
        +-- TB1-v2: Physical flourish (collision, wilt, ERI deformation)
        +-- UX-2.2: Leaf Clustering (if branches unreadable)
        +-- VIS1: Visual Shape Language (volumetric, taper, proximity reveals)
```

---

## 8. What Is NOT in This Plan (Explicitly Rejected)

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
- No standalone accounting origin module that accepts direct debit/credit writes
- No direct journal-entry API that bypasses COMMIT TransferPacket validation
- No ledger-as-source-of-truth pattern; ledger is projection only

---

## 9. Acceptance: How We Know Each Tier Is Done

**Tier 1 Done:** D0 policy-proof logs stable + W0/W1/W2 artifact pipeline operational + AC0 transfer packets validated + LGR0 journal/trial-balance working + `D1-LEDGER-GATE` passes deterministic balanced postings + SG0 enforced + headless parity gate passes

**Tier 2 Done:** Canonical P2P chain (`PR->PO->GR->INV->PAY`) runs in Relay with posting gates + inventory/payment/tax baselines active + presence markers visible for users + SCVs + MFG module loads via config only + import/API routes and branch steward operational

**Tier 3 Done:** Audit request -> SCV findings -> approval flow works + Flow recorded -> played -> voted -> promoted as default + camera travels with animation + all 5 movement modes functional + focus sphere isolates any object with context

**Tier 4 Done:** Commits carry Merkle hashes + replay reproduces state + governance workflows operational + financial close/period locks/reversals auditable + multi-company routing live + full LOD ladder navigable from LANIAKEA to CELL

**Tier 5 Done:** Timeboxes thick with density/confidence (v1) + optional ERI-driven walls (v2) + clustering activates on dense branches + volumetric limbs and taper rendering

---

## 10. Coverage Matrix (Nothing Forgotten)

This matrix maps every critical system aspect to where it is specified in the plan, which module/phase owns it, whether it has an acceptance gate, and its current implementation status.

**1. 2D Backward Compatibility**

- Specified in: Section 6 (Object Equivalence, Action Equivalence, Headless Gate, Round-Trip)
- Module: All (cross-cutting)
- Phase: HEADLESS-0 (Tier 1)
- Gate: Yes — headless D0 produces identical outputs
- Implemented: No

**2. Identity and Privacy (Presence Tiering)**

- Specified in: Module L.1, Section 5.6
- Module: L (Presence)
- Phase: L0 (Tier 2)
- Gate: Yes — leaving proximity preserves read-only; no identity leak
- Implemented: No

**3. Proximity Channels (BLE/Wi-Fi Full Lifecycle)**

- Specified in: F0.4 (6-stage lifecycle: discovery, join, active, owner assertion, leaving, anti-spoof)
- Module: L (Presence) + F (Flow Channels)
- Phase: F0 (Tier 3)
- Gate: Yes — act only when in range; spoof = indeterminate/refusal
- Implemented: No

**4. Flow Channels as Procedures (Semantic Steps)**

- Specified in: F0.1 (Path, Steps, Intent, Evidence, Outcome, Scope)
- Module: F (Flow Channels)
- Phase: F0 (Tier 3)
- Gate: Yes — another user reproduces same analysis outcome
- Implemented: No

**5. Travel Continuity (No Teleport)**

- Specified in: CAM0.1, CAM0.4
- Module: H (HUD/Interaction) + E (Visualization)
- Phase: CAM0 (Tier 3)
- Gate: Yes — focus + exit returns to exact prior context
- Implemented: No

**6. SCV Agents (Visible, Scoped, Non-Executing)**

- Specified in: Module L.2, Section 5.5
- Module: L (Presence)
- Phase: L1 (Tier 2)
- Gate: Yes — every SCV output links to provenance; action without authority = refusal
- Implemented: No

**7. Audit Requests (Manager -> SCV Delegation)**

- Specified in: Module L.3
- Module: L (Presence) + I (Governance)
- Phase: L2 (Tier 3)
- Gate: Yes — requests logged; proposals require authorityRef
- Implemented: No

**8. Commit Materiality Thresholds**

- Specified in: Module A (Material Boundary Triggers)
- Module: A (Canon/Truth)
- Phase: W0 (Tier 1)
- Gate: Yes — edits crossing thresholds force HOLD/PROPOSE
- Implemented: No

**9. Timebox Wilt Model**

- Specified in: TB1-v2 (inputs, 3 output channels, what it doesn't do, repair)
- Module: D (Data Structures) + E (Visualization)
- Phase: TB1 (Tier 5)
- Gate: Yes — closing open items reverses wilt in next timebox
- Implemented: No

**10. Proof Artifact Policy**

- Specified in: Section 5.7
- Module: J (Code/Dev) + I (Governance)
- Phase: All phases (cross-cutting)
- Gate: Yes — no proof = no progression (INDETERMINATE until proven)
- Implemented: Partial (proof index exists, not enforced as gate)

**11. Forbidden Language Lint as Phase Gate**

- Specified in: Section 5.8
- Module: J (Code/Dev)
- Phase: All phases (pre-commit + CI)
- Gate: Yes — REFUSAL on violation, blocks commit
- Implemented: Partial (lint exists, not enforced as hard gate)

**12. Deterministic Replay**

- Specified in: Phase E3 (rebuild, verify, mismatch = scar)
- Module: D (Data Structures) + C (Crypto)
- Phase: E3 (Tier 4)
- Gate: Yes — replayed state matches live state; divergence = refusal commit
- Implemented: No

**13. Import/Export Round-Trip**

- Specified in: Section 6.4
- Module: All (cross-cutting)
- Phase: D2 (Tier 2) + HEADLESS-0 (Tier 1)
- Gate: Yes — export to CSV, reimport through routes, derived sheets consistent
- Implemented: No

**14. Cell-Level Permission (Envelope Encryption)**

- Specified in: Module C (Cell-Level Permission Model)
- Module: C (Crypto)
- Phase: E1 (Tier 4)
- Gate: Yes — encrypted cell verifiable without decryption; selective disclosure works
- Implemented: No

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
- Implemented: Partial (some rules enforced, not all formalized)

**17. Human Process Modules (HR, Policy, Communication)**

- Specified in: Module I (Human Process Modules)
- Module: I (Governance)
- Phase: E2 (Tier 4)
- Gate: Yes — HR policies as versioned filaments; recurrence as governed policy
- Implemented: No

**18. ERP Replacement Scope Lock**

- Specified in: Section 0 and Section 4 (Tier 1/2 scope and sequence)
- Module: A + D + I (cross-cutting)
- Phase: AC0/LGR0 onward
- Gate: Yes — Relay posting paths are canonical; external ERP connectors are bridge-only
- Implemented: Partial (scope lock documented; technical milestones pending)

**19. Balanced Transfer + Mirrored Responsibility**

- Specified in: Module D (TransferPacket + ResponsibilityPacket) and Tier 1 AC0
- Module: D + G + I
- Phase: AC0 (Tier 1)
- Gate: Yes — every material COMMIT must validate balanced transfer legs and user mirror linkage; any missing mirror or unresolved container is refusal
- Implemented: No

**20. 3-Way Match Posting Gate**

- Specified in: Tier 1 AC0.4 and Tier 2 P2P-CORE
- Module: B + I
- Phase: AC0/LGR0 (Tier 1) then P2P-CORE (Tier 2)
- Gate: Yes — match PASS enables posting; mismatch forces HOLD/PROPOSE path with explicit variance/correction container
- Implemented: Partial (artifact path exists, posting gate integration pending)

**21. Ledger Determinism (D1 Ledger Gate)**

- Specified in: Tier 1 LGR0.3
- Module: D + I + J
- Phase: LGR0 (Tier 1)
- Gate: Yes — 1,000 synthetic packets balanced, deterministic projected trial balance, full provenance links, and zero direct journal-origin writes
- Implemented: No

**22. Social Activation Lockdown (Precondition Gate)**

- Specified in: Section 12 (Social Activation Lockdown Addendum)
- Module: F + I + L (cross-cutting with governance/proximity/social surfaces)
- Phase: LCK-1..LCK-4 before social activation
- Gate: Yes — social activation flag remains blocked until all lock groups PASS with indexed proof artifacts
- Implemented: No

---

## 11. Implementation-Ready Schemas (AC0/LGR0 + P2P v0)

This section is normative for implementation. If code and this section disagree, this section wins until explicitly revised by commit.

### 11.1 Canonical Enums and Value Types

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

### 11.2 Core UOC References

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

### 11.3 TransferPacket (System Reality, COMMIT-Embedded)

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

### 11.4 ResponsibilityPacket (Human Reality Mirror)

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

### 11.5 Commit Hook Contract

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

### 11.6 Ledger Projection Schemas (Derived, Never Origin)

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

### 11.7 P2P Canonical Objects (Relay-Native)

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

### 11.8 P2P Posting Rules v0 (Happy Path)

1. GR commit (`GR-7001`) creates `TP-GR-7001`:
   - Quantity legs: `+100 KG Inventory@SITE_A`, `-100 KG GRIR@SITE_A:qty`
   - Optional value legs: `+10000 USD Inventory@SITE_A:value`, `-10000 USD GRIR@SITE_A:value`
2. INV match PASS (`INV-3001`) creates `TP-INV-3001`:
   - Currency legs: `+10000 USD GRIR@SITE_A:value`, `-10000 USD AP@COMPANY`
3. PAY commit (`PAY-8001`) creates `TP-PAY-8001`:
   - Currency legs: `+10000 USD AP@COMPANY`, `-10000 USD CashBank@COMPANY`

Each packet requires mirrored ResponsibilityPacket(s) on actor tree.

### 11.9 3-Way Match Gate and Mismatch Resolution (No Disappearance Law)

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

### 11.10 Relay-Native Inputs and Bridge Inputs

Accepted input paths for P2P v0:

1. Relay-native human entry forms (PR/PO/GR/INV/PAY).
2. Device events (barcode/RFID/scale/IoT) mapped through routes.
3. Bridge imports (CSV/JSON/API) during coexistence/migration.

All paths normalize to routed events and produce the same deterministic object/commit/packet pipeline.

---

## 12. Social Activation Lockdown Addendum (Hard Preconditions)

This addendum is binding. Social/Entertainment scope cannot be activated until all lock groups below are PASS with proof artifacts.

### 12.1 Activation Flag Policy

- `RELAY_SOCIAL_ACTIVATION_ENABLED` default: `false`.
- `RELAY_SOCIAL_ACTIVATION_ENABLED=true` is allowed only when lock groups `LCK-1..LCK-4` are all PASS.
- Any attempt to activate social modules before full lock PASS must refuse:
  - `[REFUSAL] reason=SOCIAL_LOCKDOWN_ACTIVE missing=<lockIds>`

### 12.2 Lock Groups (Pass/Fail)

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

### 12.3 Social/Entertainment Activation Scope (Post-Lock Only)

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

### 12.4 Recommended Lock Execution Sequence

1. Boundary restore + proof (`LCK-1`)
2. Voting canon doc unification (`LCK-2`)
3. Governance executable state machine spec (`LCK-3`)
4. Proof index completeness sweep (`LCK-4`)
5. Then and only then set `RELAY_SOCIAL_ACTIVATION_ENABLED=true`

