# Relay Project Handoff

This handoff is for any agent joining via the GitHub link. It explains the current state and points to the canonical plan.

## Canonical Plan

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** is the canonical system plan (full coverage).
**[docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md](docs/architecture/RELAY-MASTER-BUILD-PLAN-R1.md)** is the execution overlay (R0-R5 restoration-first sequencing).

Companion restoration docs:

- `docs/restoration/RELAY-RESTORATION-PLAN.md`
- `docs/restoration/RESTORATION-INDEX.md`

## Current State (as of 2026-02-15)

### Completed (Proven, Locked)
- **Phase 0-2.1**: Cesium world boot, topology, views unified, boundaries integrated, auto-transition, primitives migration
- **A0-A0.4**: Engine gates, pixel-perfect 3D-to-2D alignment, formula engine, timebox filament length = cell length, spine aggregation bands
- **B1-B4**: P2P baseline fact sheets (6 schemas), match sheets (deterministic builder), summary sheets (cross-sheet formulas), KPI branch mapping
- **C0**: Route engine (config-driven data flow, provenance, mock streams, dry-run preview)
- **D-Lens-0**: Focus frame (camera + dimming + breadcrumb + entity tracking + exit)
- **UX-1.1-1.3**: Universal Object Contract, Capability Buds, Inspector Context Switching
- **W0-W2 baseline**: Work mode surface and material artifact chain (`HOLD/PROPOSE/COMMIT`), object-bound artifact indexing, action-triggered proposals/commits, route delta summary with auto-HOLD policy trigger, and minimal resolve loop in inspector
- **AC0/LGR0/D1**: Balanced transfer core, ledger projection, and deterministic ledger gate are implemented, proven, and indexed
- **Globe restore slices**: `GLOBE-RESTORE-0..4` + `GLOBE-RESTORE-3A` are implemented, proven, and indexed (world-profile only with proof-profile lock)
- **UX/Navigation hardening**: `USP-1`, `CAM0.4.2` (filament ride), `PQ-3..PQ-7`, and `HUD-1` are implemented, proven, and indexed
- **Governance surface restores**: `BOUNDARY-A1` (commit-governed boundary editor) and `VOTE-A2` (voting UI reactivation) are implemented, proven, and indexed
- **Capstone closure**: `RESTORE-PARITY` integrated proof passes with `OSV-1` and `headless-tier1-parity` green

### D0 Scale and Stress (Current Policy-Proven State)
- Deterministic FPS sampling is locked (`FORCED_RAF`), with no hang path.
- `allPass` now follows explicit policy (`RELAY_D0_PASS_POLICY`, default `dev`).
- Strict truth remains explicit:
  - `RELAY_D0_FPS_MIN_STRICT = 30` (`D0.3-FPS`, `allPassStrict`)
  - `RELAY_D0_FPS_MIN_DEV = 20` (`D0.3-FPS-DEV`, `allPassDev`)
- POLICY proof line is mandatory in logs:
  - `[D0-GATE] POLICY devPass=<..> strictPass=<..> fps=<..> source=<..> devicePixelRatio=<..> resolutionScale=<..>`
- Practical rule: if `allPass` is true under `policy=dev` and viewport is responsive, continue feature work. Treat strict FPS as perf-hardening backlog (not a feature blocker).

### Current Restoration State
- R3 BASIN-RING-1 — PASS (shared-anchor rings + clustering, proof indexed)
- COMPANY-TEMPLATE-FLOW-1 (Phase 5) — PASS (canonical flow → timebox → tree motion, proof indexed)
- VOTE-COMMIT-PERSISTENCE-1 (Phase 6) — PASS (governance persistence, scar overlay, HUD votes, proof indexed)
- FILAMENT-LIFECYCLE-1 — PASS (object contract, dual state machines, inward movement, closure enforcement, turnover metric, band snap, proof indexed)
- FILAMENT-DISCLOSURE-1 — PASS (visibility tiers, monotonic disclosure, lifecycle auto-upgrade, governance gating, append-only evidence, persistence, proof indexed)
- LAUNCH-FIX-1 — PASS (face-on docking on sheet enter, minimal 2D grid overlay, topology validation scoping, proof indexed)
- SCOPE-COHERENCE-1 — PASS (unified effectiveScope, eliminated scope contradiction, auto-dock guard, consistent cleanup)
- ATTENTION-CONFIDENCE-1 — PASS (getBackingRefs, computeConfidence, computeAttention, fractal aggregation, HUD Tier 2 readout, proof indexed)
- VIS-TREE-SCAFFOLD-1 — PASS (TREE_SCAFFOLD render mode, T key toggle, radial branches from trunk top, sheets at endpoints, stub tiles, proof indexed)
- HEIGHT-BAND-1 — PASS (semantic height bands in scaffold mode, attention/confidence-driven offsets, indeterminate guard, contributor logging, proof indexed)
- VIS-MEGASHEET-1 — PASS (top-down projection lens, M key enter, deterministic importance-biased layout, state-tinted tiles, proof indexed)
- CAM0.4.2-FILAMENT-RIDE-V1 — PASS (temporal navigation with epistemic readout, R key entry, arrow nav, scaffold-aware, lifecycle overlay, disclosure gate, HUD context, 12-stage proof indexed)
- PRESENCE-STREAM-1 — PASS (ephemeral presence bus, join/leave/heartbeat, TTL expiry, scope binding + ride integration, budget caps with refusals, HUD Tier 2 line, 7-stage proof indexed)
- PRESENCE-RENDER-1 — PASS (mesh v0 / SFU-ready semantics, consent-gated cam/mic, billboard default + stage pin, deterministic decode/render budgets with refusals, 10-stage proof indexed)
- PRESENCE-COMMIT-BOUNDARY-1 — PASS (unanimous explicit consent, hash-backed metadata, W0–W2 chain integration, timebox event with hashes/scope, authority gate, 9-stage proof indexed)

### Next Work

#### Visual Grammar (Complete — all 4 COMMIT/PASS)
- **ATTENTION-CONFIDENCE-1** — PASS (83c8702) — getBackingRefs, computeConfidence, computeAttention, fractal aggregation, HUD Tier 2 readout
- **VIS-TREE-SCAFFOLD-1** — PASS (c7db24b) — TREE_SCAFFOLD render mode, T key toggle, branches from trunk top, sheets at endpoints
- **HEIGHT-BAND-1** — PASS (7cbfcab) — semantic height in scaffold mode, attention/confidence-driven offsets, indeterminate guard
- **VIS-MEGASHEET-1** — PASS (bf050c7) — MEGASHEET top-down projection lens, M key toggle, deterministic importance-biased layout, state-tinted tiles

#### Temporal Navigation (Complete)
- **CAM0.4.2-FILAMENT-RIDE-V1** — PASS — R key entry, Left/Right arrow navigation, epistemic readout at each timebox stop (lifecycle, disclosure, confidence, attention, commits, contributors), scaffold-aware path detection, lifecycle-colored highlight overlay, disclosure gate (REFUSAL for cross-filament PRIVATE), boundary crossing logs, HUD ride context panel, 12-stage proof (scripts/cam042-filament-ride-v1-proof.mjs)

#### Presence Bus (Complete)
- **PRESENCE-STREAM-1** — PASS — Ephemeral presence bus: PresenceEngine (app/presence/presence-engine.js), protocol constants (app/presence/presence-protocol.js), WS transport (ws://127.0.0.1:4031/vis8), deterministic roomId from scopeId, join/leave/heartbeat with TTL (15s), scope binding (effectiveScope + focusId + optional ride stop), budget caps (8 per room, 2 rooms per user) with REFUSAL logs, HUD Tier 2 presence line, 7-stage proof (scripts/presence-stream-1-proof.mjs)

#### Presence Render (Complete)
- **PRESENCE-RENDER-1** — PASS — WebRTC render layer with SFU-ready semantics (mesh v0), `rtc-signal` messaging, camera OFF by default (explicit opt-in), mic OFF by default (explicit unmute), permission-denied degrade to presence-only, deterministic LOD budgets (decode/render) with explicit refusals, billboard presence cards + stage pin overlay, event-driven bind hooks (scope/focus/ride) + 10s safety heartbeat, 10-stage proof (scripts/presence-render-1-proof.mjs), and regressions green (PRESENCE-STREAM-1 7/7, CAM0.4.2 12/12)

#### Call Summary Boundary (Complete)
- **PRESENCE-COMMIT-BOUNDARY-1** — PASS — Optional canonical call summary via W0-W2 artifact chain: unanimous explicit consent state machine (IDLE → COLLECTING → GRANTED/DENIED/EXPIRED), 60s consent TTL, consent fires only on explicit user action, hash-backed metadata only (summaryHash, participantsHash, bindingsHash, consentHash via SHA-256), optional one-line title, enters W0-W2 chain at PROPOSE (COMMIT requires authorityRef), timebox event with type=CALL_SUMMARY + hashes + scope + ride bindings, HUD Tier 2 consent status, 9-stage proof (scripts/presence-commit-boundary-1-proof.mjs), regressions green (PRESENCE-STREAM-1 7/7, PRESENCE-RENDER-1 10/10, CAM0.4.2 12/12)

#### Headless Parity Gate (Complete)
- **HEADLESS-0** — PASS — Headless parity gate proving byte-identical data outputs between headless and 3D modes. Dual detection: `?headless=true` URL param (FORCED) or runtime `!viewer || !viewer.scene` (FALLBACK). SHA-256 golden hashes for 7 canonical components (facts, matches, summaries, KPIs, commits, packets, ledger) with NA fallback for inactive. `relayD0GateHeadless(count)` adapts D0.1/D0.2/D0.4/D0.5 with D0.3 = NA (pass=null, na=true, not pass=true). D0.4 is renderer-free (no DOM — data integrity check on sheetsExpected/factRows). Non-interference stage: presence engine enabled without room join, golden hashes unchanged. Existing FNV-1a path unchanged (`headless-tier1-parity.mjs` still MATCH). 8-stage proof (scripts/headless-0-proof.mjs), regressions green (all prior slices PASS).

#### Deterministic Replay (Complete)
- **E3-REPLAY-1** — PASS — Scoped deterministic replay engine proving derived state consistency via SHA-256 golden hashes. Sheet-level replay from cell commits + module-level orchestration (fact ingest → match rebuild → summary → KPI → packets → ledger → golden compare). Shadow workspace only (no relayState mutation, enforced with write guard). BaselineHashes pattern for divergence detection (capture baseline → mutate → replay → compare → revert). REPLAY_DIVERGENCE scar appended as timebox event with unique ID (replay.<moduleId>.<from>-<to>.<sha16>.<sha16>). Partial range: commitIndex-based filtering with unmapped exclusion (no proportional approximation). Performance gate: 10k rows < 60s with per-phase timing. HUD Tier 2 replay status. 9-stage proof (scripts/e3-replay-1-proof.mjs), 4 tightenings applied: (1) unmapped exclusion, (2) shadow write guard, (3) mutation revert, (4) unique scar IDs. Regressions green (HEADLESS-0 8/8, CAM0.4.2 12/12, PRESENCE-STREAM-1 7/7).

#### Cryptographic Integrity (Complete)
- **E1-CRYPTO-1** — PASS — Cryptographic integrity layer: SHA-256 hash chain over global commits + per-sheet commit chains + per-timebox Merkle trees + rolling Merkle root across timeboxes. Inclusion proofs for any artifact (union format: commits → chain anchor only; timebox events → Merkle path + rolling root anchor). Tamper detection via `relayVerifyChainIntegrity()` (read-only by default, `emitScar:true` opt-in for CHAIN_INTEGRITY_VIOLATION scar). Replay pre-check: `relayCryptoReplayPreCheck()` blocks replay on chain break with zero side effects. Derived chain maps only (never mutates historical receipt objects). Evidence hash upgrade: SHA-256 for new commits, FNV-1a grandfathered. HUD Tier 2 integrity status. 9-stage proof (scripts/e1-crypto-1-proof.mjs), 5 tightenings applied: (1) verify read-only, (2) union inclusion proof, (3) rolling root by timeboxId, (4) derived stamping, (5) replay pre-check refuses cleanly. Regressions green (E3-REPLAY-1 9/9, HEADLESS-0 8/8, CAM0.4.2 12/12, PRESENCE-STREAM-1 7/7, PRESENCE-RENDER-1 10/10, PRESENCE-COMMIT-BOUNDARY-1 9/9).

See `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` Module L for full specification.

**Canonical status: Attention/Confidence + Tree Scaffold + Height Bands + MegaSheet + CAM0.4.2-FILAMENT-RIDE-V1 + PRESENCE-STREAM-1 + PRESENCE-RENDER-1 + PRESENCE-COMMIT-BOUNDARY-1 + HEADLESS-0 + E3-REPLAY-1 + E1-CRYPTO-1 + VIS-GRAMMAR-POLISH-1 + FILAMENT-LIFELINE-1 + VIS-LAUNCH-TREE-READABILITY-1 are COMMIT/PASS and indexed.**

### Recent Completion: FILAMENT-LIFELINE-1 (2026-02-16)

**Result:** PASS — Ambient lifelines now render end-to-end in `TREE_SCAFFOLD + SHEET/CELL` with deterministic path order and lifecycle styling.

**Key fix:** New dedicated lifeline primitive added in renderer:
- path = cell origin -> slab centers -> spine -> branch endpoint -> trunk absorption
- lifecycle color mapping + attention-driven width (0.5-2.0)
- strict visibility gate (not in LAUNCH_CANOPY collapsed, not in MEGASHEET)

**Spec:** [docs/restoration/FILAMENT-LIFELINE-1-SPEC.md](docs/restoration/FILAMENT-LIFELINE-1-SPEC.md)  
**Proof log:** `archive/proofs/filament-lifeline-1-console-2026-02-16.log`  
**Status:** COMMIT in SLICE-REGISTER and ACTIVE-SLICE.

---

### Recent Completion: VIS-LAUNCH-TREE-READABILITY-1 (2026-02-16)

**Result:** PASS — launch/company first-glance readability improved without changing scaffold/megasheet/lifeline contracts.

**Key fixes (launch-only):**
- trunk dominance increased (core/shell/glow contrast)
- branch silhouette simplified (lower rib/emissive emphasis)
- company-collapsed tiles de-emphasized (lower alpha, smaller footprint, no interior grid)
- non-focused rings suppressed in collapsed company launch lens
- filament rain de-noised (density 2)
- auto-dock refusal-vibe log converted to rate-limited status line

**Spec:** `docs/restoration/VIS-LAUNCH-TREE-READABILITY-1-SPEC.md`  
**Proof log:** `archive/proofs/vis-launch-tree-readability-1-console-2026-02-16.log`  
**Artifacts:** `archive/proofs/vis-launch-tree-readability-1-2026-02-16/*`

---

### Next Slice: DEMO-FLYBY-POLISH-1 (Queued)

**Goal:** Polish demo flyby choreography (smooth camera glides, dwell times, no teleport jumps) for cold-start intro experience.

**Blocked until:** VIS-GRAMMAR-POLISH-1 complete ✅ (scaffold + megasheet gates green)

**Spec:** `docs/restoration/DEMO-FLYBY-POLISH-1-SPEC.md` (to be drafted when slice starts)

**Deliverables:** Non-teleport camera travel (distance-based easing), deterministic dwell times per stage (globe→basin→company→sheet→edit), choreography proof, no geometry changes.

**Rule reminder:** No new slice starts unless ACTIVE-SLICE is updated and the allowed-files list is defined. Every slice ends with proof log + PROOF-INDEX + SLICE-REGISTER + HANDOFF update.

## Key Files
- `app/renderers/filament-renderer.js` -- core geometry + canonical constraints
- `relay-cesium-world.html` -- entry, camera, demo tree, controls
- `docs/architecture/RELAY-RENDER-CONTRACT.md` -- rendering invariants
- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md` -- 15 frozen contracts

## How to Run
- `npm run dev:cesium`
- Open (canonical restoration path): `http://localhost:3000/relay-cesium-world.html?profile=launch`

## Canonical Geometry Constraints (must not regress)
1. **Opposite-side exit**: All cell lanes begin along sheet normal pointing opposite the branch.
2. **Parallel slab for timeboxes**: Timeboxes stacked along sheet-wide `timeDir`, identical for all cells.
3. **Bend only after slab**: Lanes may curve toward laneTarget/spine only after slab ends.
4. **Stage 2 single conduit**: Stage 2 is exactly one spineCenter -> branchEnd conduit per sheet.

## Document Structure
- `docs/architecture/` -- Architecture specs (master plan, render contract, physics contracts, crypto, stigmergy)
- `docs/governance/` -- Governance specs (forbidden language, pressure model, cadence, stage gates, work zones)
- `docs/business/` -- Business docs (for leaders, operating model)
- `docs/implementation/` -- Phase implementation records
- `docs/tutorials/` -- Quick start, dev setup, visual verification
- `archive/` -- Historical documents (read-only)
- `archive/superseded-docs/` -- Documents fully absorbed by the master plan
