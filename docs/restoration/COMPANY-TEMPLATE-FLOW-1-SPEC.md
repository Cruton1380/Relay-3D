# COMPANY-TEMPLATE-FLOW-1 — Acceptance Criteria & Spec (Phase 5)

**Goal**: Demonstrate the full canonical data path driving visible tree change:

External Event → Route → Fact Sheet → Match Sheet → Summary Sheet → KPI → Timebox → Tree Motion

Using only existing modules: route engine, module loader, fact sheet append, recompute chain, KPI binding, VIS-4 timebox update, canopy rendering. No new engine.

**Contract ref**: RELAY-MASTER-BUILD-PLAN.md Phase 5; canonical data path.

---

## A) Scope

### Allowed files

- `relay-cesium-world.html`
- `app/modules/module-loader.js`
- `app/routes/*` (wiring only, no engine rewrite)
- `app/renderers/filament-renderer.js` (visual pulse only)
- `scripts/company-template-flow-proof.mjs`
- `archive/proofs/*`
- Indexes and slice governance docs

### Forbidden

- No new data engine
- No modification to AC0 / LGR0 / D1 logic
- No new LOD thresholds
- No new voting engine
- No changes to canopy geometry
- No changes to FreeFly contract

---

## B) Functional requirements

### 1) Load P2P module automatically in launch

On boot (launch profile): load module configuration, initialize route definitions. Demo company must have fact sheets, match sheet, summary sheet, KPI binding.

**Log**: `[FLOW] moduleLoaded=P2P result=PASS`

### 2) Trigger demo data event

One deterministic “drop” simulation: either auto-run one sample through route engine, or launch-only “Simulate Event” button. When triggered: call existing route normalization, append to fact sheet, trigger recompute chain.

**Log**: `[FLOW] dataPath route=<id> factSheet=<id> matchSheet=<id> summary=<id> kpi=<id>`

### 3) Timebox update

After recompute: new timebox entry for affected branch; VIS-4 slabs update (existing logic).

**Log**: `[FLOW] timeboxUpdate branch=<id> timeboxId=<id> result=PASS`

### 4) Visible tree motion

On timebox change: slight ring thickness change or pulse animation; brief filament pulse along branch. No topology change.

**Log**: `[FLOW] treeMotion=PASS nodesAffected=<n>`

---

## C) Required logs (order)

1. `[FLOW] moduleLoaded=P2P result=PASS`
2. `[FLOW] dataPath route=... factSheet=... matchSheet=... summary=... kpi=...`
3. `[FLOW] timeboxUpdate branch=... timeboxId=... result=PASS`
4. `[FLOW] treeMotion=PASS nodesAffected=<n>`
5. `[FLOW-PROOF] gate-summary result=PASS`

---

## D) Proof requirements

- **Script**: `scripts/company-template-flow-proof.mjs`
- **Stages**: Boot launch; confirm module loaded; trigger simulated event; wait for dataPath, timeboxUpdate, treeMotion; screenshot after motion.
- **Artifacts**: `archive/proofs/company-template-flow-console-YYYY-MM-DD.log`, `archive/proofs/company-template-flow-YYYY-MM-DD/01-before.png`, `02-after.png`

---

## E) Acceptance criteria

PASS only if: all logs appear in correct order; timebox slab count increments; no LOD/focus regressions; FPS still works; HUD still correct.
