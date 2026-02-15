# Relay Restoration-First Execution Overlay (R1) — 2026-02-15

**Role: EXECUTION OVERLAY — sequencing only, not a replacement for system coverage.**  
**Canonical system coverage lives in: [RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md)**  
**This file defines current execution order (R0–R5) and immediate slice queue.**

---

## 0) Scope of This File

This file controls **what to build next and in what order**.  
It does not define modules, tiers, contracts, coverage, or system invariants — those remain in `RELAY-MASTER-BUILD-PLAN.md`.

Execution order can change.  
System coverage cannot shrink.

Frozen contracts remain unchanged:

- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md`
- `docs/architecture/RELAY-RENDER-CONTRACT.md`
- `docs/architecture/RELAY-NODE-RING-GRAMMAR.md`
- `docs/process/SLICE-WORKFLOW.md`
- `docs/process/PROOF-ARTIFACT-POLICY.md`

---

## 1) Reconciled Current Truth (2026-02-15)

- Core world boot/topology/primitives are operational.
- Process rails are active (`slice-gate`, proof indexing, checklist workflow).
- Restore/visibility slices are already proven and indexed:
  - `GLOBE-RESTORE-0..4`, `GLOBE-RESTORE-3A`
  - `USP-1`, `HUD-1`
  - `BOUNDARY-A1`, `VOTE-A2`
  - `RESTORE-PARITY`
  - `VIS-2`, `VIS-3.x`, `VIS-4x`, `VIS-6x`, `VIS-7x` families
- Recent PASS slices (2026-02-15):
  - `FILAMENT-LIFECYCLE-1`, `FILAMENT-DISCLOSURE-1`, `LAUNCH-FIX-1`
  - `SCOPE-COHERENCE-1`, `ATTENTION-CONFIDENCE-1` (83c8702)
  - `VIS-TREE-SCAFFOLD-1` (c7db24b), `HEIGHT-BAND-1` (7cbfcab), `VIS-MEGASHEET-1` (bf050c7)
- Visual grammar stack: **COMPLETE** (all 4 modules COMMIT/PASS)

Canonical restoration runtime path:

- `npm run dev:cesium`
- `http://localhost:3000/relay-cesium-world.html?profile=launch`

---

## 2) Restoration-First Sequence (R0-R5)

These phases run before net-new expansion and do not add physics.

### R0 — Baseline Visibility Lock

Goal: replayable 30-60 second sequence:

1. globe (multi-anchor)
2. building/site basin focus
3. enter company
4. enter sheet
5. enter edit + 2D grid
6. exit back up

Evidence:

- launch sequence proof log
- screenshots: globe, building, company, sheet, edit

### R1 — HUD Consolidation

Goal: one launch HUD.

- Tier 1 (always visible, max 6 lines): profile, mode, focus path, LOD, data status, world status
- Tier 2 (collapsed): VIS summaries, budgets, gate summaries, last proof tags

Rules:

- no duplicate launch consoles/panels
- dev panels dev-only

Evidence:

- launch readability proof includes no-duplicate-HUD assertion

### R2 — Node Ring Grammar Visibility

Goal: visible semantic rendering.

- thickness = pressure
- ripple rate = vote energy
- color = state quality

Evidence:

- proof at required LOD tiers with acceptance logs

### R3 — Basin Rings at Shared Anchors

Goal: deterministic 1:many shared-anchor rendering without spheres.

- deterministic ring placement
- visible high-N clustering
- focus isolation is lens-only (`hover/click/E/Esc`)

Evidence:

- stress proof for `N=6`, `N=30`, `N=200` with budget logs

### R4 — Presentation Pipeline Upgrade

Goal: readability improvement without topology changes.

Allowed (launch/world only): FXAA, subtle bloom, color correction, fog/haze, glass tiles, faint filament lighting.

Evidence:

- launch theme proof with post-process enable checks and no warnings

### R5 — Restoration Index / Manual

Goal: preserve and expose what is already built.

Canonical manual:

- `docs/restoration/RESTORATION-INDEX.md`

Each entry includes: purpose, trigger, proving logs, owner files.

---

## 3) Immediate Slice Queue

Process is sufficiently locked; process edits are now unblock-only.

### Completed (R0-R5 + Restoration Slices)

1. ~~`HUD-CONSOLIDATION-1`~~ — PASS
2. ~~`NODE-RING-RENDER-1`~~ — PASS
3. ~~`BASIN-RING-1`~~ — PASS
4. ~~`COMPANY-TEMPLATE-FLOW-1`~~ — PASS
5. ~~`VOTE-COMMIT-PERSISTENCE-1`~~ — PASS
6. ~~`FILAMENT-LIFECYCLE-1`~~ — PASS
7. ~~`FILAMENT-DISCLOSURE-1`~~ — PASS
8. ~~`LAUNCH-FIX-1`~~ — PASS
9. ~~`SCOPE-COHERENCE-1`~~ — PASS
10. ~~`ATTENTION-CONFIDENCE-1`~~ — PASS (83c8702)
11. ~~`VIS-TREE-SCAFFOLD-1`~~ — PASS (c7db24b)
12. ~~`HEIGHT-BAND-1`~~ — PASS (7cbfcab)

### Completed: Visual Grammar

13. ~~`VIS-MEGASHEET-1`~~ — PASS (bf050c7) — top-down projection lens (deterministic layout, importance-biased radial, tile state mapping)

### Active: Temporal Navigation (Architect Decision 2026-02-15)

14. `CAM0.4.2-FILAMENT-RIDE-V1` — epistemic temporal navigation (lifecycle + disclosure + attention/confidence + height bands integrated into filament ride)

### Queued: Video Presence (After Temporal Navigation)

15. `PRESENCE-STREAM-1` — WebRTC signaling + ephemeral peer connections via VIS-6c transport
16. `PRESENCE-RENDER-1` — Video textures + LOD-governed presence cards + UOC integration
17. `PRESENCE-COMMIT-BOUNDARY-1` — Optional canonical call summary via W0-W2 material artifact chain

**Rationale:** Temporal navigation deepens the core epistemic differentiator (truth traversal). PresenceStream adds collaboration comfort but does not strengthen coordination geometry. PresenceStream becomes much more powerful after filament ride because calls can occur inside time-anchored truth traversal.

Each slice ships:

- code references
- runtime screenshot/video
- proof artifact + index entry
- contract alignment

---

## 4) Module and Tier Continuity

The A-L architecture remains valid. This plan changes sequence, not model truth:

- R0-R5 overlays execution order
- tier expansion resumes after R0-R5 evidence is green
- deferred tracks stay deferred unless explicitly unlocked

---

## 5) Active vs Archived Documentation Hygiene

Active canonical docs:

- `docs/architecture/`
- `docs/restoration/`
- `docs/process/`
- `docs/00-START-HERE.md`, `HANDOFF.md`, `README.md`

Historical docs:

- `archive/superseded-docs/`
- `archive/status-reports/`
- `archive/commit-history/`

Rules:

- no planning canon in repo root
- planning docs are either active under `docs/` or historical under `archive/superseded-docs/`

---

## 6) Video Presence Slice Specifications (L.5)

Three independently provable slices implementing Module L.5 (PresenceStream) from the master build plan.

### PRESENCE-STREAM-1 (Signaling + Ephemeral Streams)

Goal: WebRTC peer connections via existing VIS-6c WebSocket transport.

- Signaling relay on VIS-6c WS (port 4031), event type `rtc-signal`
- Room ID = `effectiveScope` hash (auto-join when scope matches)
- Max 8 participants per room. Excess → `[REFUSAL] reason=STREAM_ROOM_CAP_EXCEEDED`
- STUN/TURN config via environment
- Stream data never stored, never logged beyond connection events

Required logs:

```
[VIS8] streamEngine enabled maxParticipants=8
[VIS8] join user=<id> room=<roomId> scope=<scope> result=PASS
[VIS8] signal type=<offer|answer|ice> from=<id> to=<id> result=PASS
[VIS8] leave user=<id> room=<roomId> reason=<manual|ttl|error>
[REFUSAL] reason=STREAM_ROOM_CAP_EXCEEDED room=<roomId> active=8
[VIS8-PROOF] gate-summary result=PASS stages=6/6
```

Allowed files: `app/presence/stream-manager.js` (new), `relay-cesium-world.html`, `server.js`, `scripts/presence-stream-proof.mjs` (new), `docs/vis/VIS-8-PRESENCE-STREAM.md` (new)

### PRESENCE-RENDER-1 (Video Textures + LOD)

Goal: Render live MediaStream as video textures on presence card objects.

Prerequisite: PRESENCE-STREAM-1 PASS, VIS-TREE-SCAFFOLD-1 PASS

- `<video>` element per stream → `Cesium.Material` image
- Billboard entity per participant (camera-facing)
- LOD: COMPANY=dot, SHEET=card (64×48), CELL=stage (256×192)
- Budget: max 8 cards, max 4 stages
- `presenceStream` type in ACTION_REGISTRY with UOC actions

Required logs:

```
[VIS8] renderCard user=<id> lod=<dot|card|stage> scope=<scope> result=PASS
[VIS8] lodSwitch user=<id> from=<lod> to=<lod> trigger=<cameraHeight|scopeChange>
[VIS8] textureBind user=<id> streamId=<id> resolution=<WxH> result=PASS
[VIS8] budgetCheck cards=<n> stages=<n> capped=<true|false>
[REFUSAL] reason=VIS8_CARD_BUDGET_EXCEEDED scope=<scope>
[VIS8-RENDER-PROOF] gate-summary result=PASS stages=8/8
```

Allowed files: `app/renderers/filament-renderer.js`, `app/presence/stream-manager.js`, `app/ux/relay-object-contract.js`, `relay-cesium-world.html`, `scripts/presence-render-proof.mjs` (new)

### PRESENCE-COMMIT-BOUNDARY-1 (Optional Canonical Summary)

Goal: When participants choose, create a canonical call summary artifact using W0-W2 material artifact chain.

Prerequisite: PRESENCE-RENDER-1 PASS, W0-W2 PASS (already done)

- Commit requires all-party consent (visible prompt)
- No raw media in canon — only hashes/references
- Follows DRAFT → PROPOSE → COMMIT lifecycle
- Consent denial → `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED`

Required logs:

```
[VIS8] commitBoundary room=<roomId> participants=<n> consent=<all|partial|denied>
[VIS8] artifactCreated type=callSummary scope=<scope> mode=DRAFT
[VIS8] artifactCommitted type=callSummary commitId=<id> result=PASS
[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED room=<roomId> deniedBy=<userId>
[VIS8-COMMIT-PROOF] gate-summary result=PASS
```

Allowed files: `app/presence/stream-manager.js`, `relay-cesium-world.html`, `app/ux/relay-object-contract.js`, `scripts/presence-commit-proof.mjs` (new)

---

## 7) Acceptance Gates for This Revision

This revision is complete when:

1. R0 proof + screenshot set are indexed.
2. R1 proof confirms one launch HUD surface.
3. `docs/restoration/RESTORATION-INDEX.md` is populated and maintained.
4. Start-here/handoff/readme all point to restoration-first execution.

---

## 8) Explicit Non-Goals

- no physics contract drift
- no hidden compute layers
- no sphere/container metaphors that hide information
- no pressure/agent auto-execution
- no bypass of slice/proof governance
- no 3D photoreal avatars — real video frames are the photorealism (L.5)
- no silent recording — all capture requires visible all-party consent
- no environment photorealism — tree stays legible, not cinematic

---

## 9) Execution Hand-off

Build in this order:

1. ~~R0 visibility lock~~ ✅
2. ~~R1 HUD consolidation~~ ✅
3. ~~R2/R3 semantic + shared-anchor clarity~~ ✅
4. ~~R4 presentation refinement~~ ✅
5. ~~R5 restoration indexing~~ ✅
6. ~~Visual grammar (VIS-TREE-SCAFFOLD-1 ✅, HEIGHT-BAND-1 ✅, VIS-MEGASHEET-1 ✅)~~ ✅
7. **Temporal navigation (CAM0.4.2-FILAMENT-RIDE-V1)** ← ACTIVE
8. Video presence (PRESENCE-STREAM-1, PRESENCE-RENDER-1, PRESENCE-COMMIT-BOUNDARY-1)

Then continue broader tier expansion with the same proof discipline.
