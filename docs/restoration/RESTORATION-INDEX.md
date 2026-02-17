# Restoration Index — Active Capabilities and Lineage

Purpose: one active manual for what Relay already does, how to trigger it, how to prove it, and where it is owned.

Rule: if a capability is active, it must be listed here with proof lines and owner files.

---

## Documentation Lineage (Reconciliation)

### Active Canonical Planning Docs

- `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` (canonical full system coverage + execution order)
- `docs/restoration/RELAY-RESTORATION-PLAN.md`
- `docs/process/SLICE-WORKFLOW.md`
- `docs/process/PROOF-ARTIFACT-POLICY.md`

### Historical / Archived Planning Inputs Reconciled

- `archive/superseded-docs/RELAY-COMPLETE-BUILD-PLAN.md`
- `archive/status-reports/implementation-records/RELAY-AGENT-IMPLEMENTATION-PLAN.md`
- `archive/status-reports/implementation-records/CESIUM-MIGRATION-PLAN.md`
- `archive/status-reports/implementation-records/PHASE-2-VIEW-UNIFICATION-PLAN.md`
- `archive/status-reports/implementation-records/PHASE-2A-IMPLEMENTATION-PLAN.md`
- `archive/status-reports/implementation-records/IMPLEMENTATION-PLAN-PRESSURE-SYSTEM.md`
- `archive/status-reports/implementation-records/MIGRATION-PLAN-v1.1.0.md`

Status: reconciled into the active restoration-first canonical plan.

---

## Active Capability Manual

### 1) Launch Runtime Entry

- What: canonical launch runtime entry for restoration review
- Trigger: `http://localhost:3000/relay-cesium-world.html?profile=launch`
- Proof lines:
  - `[HUD] mode=...`
  - `[LOD] ...`
- Owners:
  - `relay-cesium-world.html`
  - `app/ui/hud-manager.js`

### 2) Enter/Exit Sheet

- What: deterministic sheet enter/exit path from company view
- Trigger: `E` (with eligible target) or `relayEnterSheet()/relayExitSheet()`
- Proof lines:
  - `[CAM] E-toggle action=ENTER ...`
  - `[CAM] E-toggle action=EXIT ...`
- Owners:
  - `relay-cesium-world.html`
  - `app/renderers/filament-renderer.js`

### 3) Sheet 2D Grid Dock

- What: docked 2D sheet lens with face-on camera behavior
- Trigger: enter sheet then dock action path
- Proof lines:
  - `[SHEET-2D] cellPx=... rowHeaderPx=... colHeaderPx=...`
- Owners:
  - `relay-cesium-world.html`

### 4) Boundaries Restore

- What: boundary restore with containsLL validations
- Trigger: world profile boundary rendering path
- Proof lines:
  - `[BOUNDARY] restore result=PASS ...`
- Owners:
  - `app/renderers/boundary-renderer.js`
  - `relay-cesium-world.html`

### 5) Multi-Country Anchor Dataset

- What: deterministic world dataset anchor load
- Trigger: world profile dataset path
- Proof lines:
  - `[GLOBE] datasetLoad anchors=...`
- Owners:
  - `app/cesium/fixtures/world-dataset-v0.json`
  - `relay-cesium-world.html`

### 6) Company Compression (VIS-2)

- What: company LOD collapsed rendering with explicit sheet expand
- Trigger: company scope + explicit enter sheet
- Proof lines:
  - `[VIS2] companyCollapsed result=PASS ...`
  - `[VIS2] enterSheet expanded=... tiles=...`
- Owners:
  - `app/renderers/filament-renderer.js`
  - `relay-cesium-world.html`

### 7) Focus Isolation (Soft/Hard)

- What: lens-style dim/hide isolation without topology mutation
- Trigger:
  - hover -> soft isolate
  - click/E-enter -> hard isolate
  - Esc -> restore
- Proof lines:
  - `[FOCUS] ...` or matching focus/isolation trace lines in slice proof
- Owners:
  - `app/renderers/filament-renderer.js`
  - `relay-cesium-world.html`

### 9) R0 Visibility Lock (Full Navigation Sequence)

- What: reproducible 6-stage demo through all navigation layers
- Trigger: `node scripts/r0-visibility-lock-proof.mjs` (requires `npm run dev:cesium`)
- Sequence: globe → building → company → sheet → edit → exit
- Proof lines:
  - `[R0] stage=globe anchorsVisible=6 result=PASS`
  - `[R0] stage=building trunkId=trunk.avgol basinFocus=PASS`
  - `[R0] stage=company ... vis2Collapsed=PASS`
  - `[R0] stage=sheet entered=true ... result=PASS`
  - `[R0] stage=edit entered=true cellPx=true ... hudSheetEdit=true result=PASS`
  - `[R0] stage=exit exitSheetLog=true ... result=PASS`
  - `[R0] gate-summary result=PASS stages=6/6`
- Screenshots: `archive/proofs/r0-visibility-lock-2026-02-14/r0-01-globe.png` through `r0-05-edit.png`
- Proof artifact: `archive/proofs/r0-visibility-lock-console-2026-02-14.log`
- Owners:
  - `scripts/r0-visibility-lock-proof.mjs`
  - `relay-cesium-world.html`
  - `app/renderers/filament-renderer.js`

### 11) V1 Dev Onboarding Flyby

- What: automated 6-section walkthrough proving all implemented navigation layers
- Trigger: `node scripts/v1-dev-onboarding-flyby.mjs` (requires `npm run dev:cesium`)
- Sections: globe → basin → company → sheet → edit → exit
- Proof lines:
  - `[ONBOARD] section=globe result=PASS`
  - `[ONBOARD] section=basin result=PASS`
  - `[ONBOARD] section=company result=PASS`
  - `[ONBOARD] section=sheetEntry result=PASS`
  - `[ONBOARD] section=editMode result=PASS`
  - `[ONBOARD] section=exitUnwind result=PASS`
  - `[ONBOARD] gate-summary result=PASS sections=6/6`
- Onboarding doc: `docs/onboarding/RELAY-V1-DEV-ONBOARDING.md`
- Screenshots: `archive/proofs/v1-dev-onboarding-2026-02-14/01-globe.png` through `06-freefly.png`
- Proof artifact: `archive/proofs/v1-dev-onboarding-console-2026-02-14.log`
- Owners:
  - `scripts/v1-dev-onboarding-flyby.mjs`
  - `docs/onboarding/RELAY-V1-DEV-ONBOARDING.md`

### 12) Tree Visibility Fix (Launch Mode)

- What: presentation-only geometry + camera + basemap changes to make the tree visible in launch mode
- Trigger: `RELAY_LAUNCH_MODE === true` — all changes gated behind this flag
- Scope: launch profile only. World/proof modes use canonical rendering unchanged.
- Changes:
  - `RELAY_LAUNCH_SCALE`: 0.04 → 0.25 (tree 500m tall, branches 200m long)
  - Camera: repositioned south of tree looking north (pitch -25°, heading 350°)
  - Basemap: brightness=0.45, contrast=0.8, saturation=0.3 (dimmed for contrast)
  - Width floors (uniform, visibility only — not importance encoding):
    trunk=60m, branches=44/32/20m, tiles=50m
  - Trunk primitive: **launch mode uses EllipseGeometry cylinder proxy for legibility; canonical CorridorGeometry topology unchanged in world/proof modes.**
  - LAUNCH_THEME: deeper saturated blues, fully opaque trunk/branches
- Geometry contract: `_toWorld()` affects render placement only. Gate checks use raw `enuToWorld()`. ENU math unchanged.
- Width floor rule: floors are uniform across all nodes — no variance by company magnitude.
- Node IDs and selection/focus logic bind to canonical nodes, not mesh type.
- Proof lines:
  - `[LAUNCH] visibilityMode enabled=PASS scale=0.25 trunkPrimitive=cylinder widthFloors=ON basemapDimming=ON`
  - `[GATE] launchVisibility semantics=UNCHANGED enuChecks=RAW`
  - `[LAUNCH] widthFloors trunk=60m branches=22/16/10 tiles=50m rule=uniform`
- Proof artifacts:
  - `archive/proofs/cam-freefly-contract-console-2026-02-14-r2.log` (FreeFly still PASS after fix)
  - `archive/proofs/v1-dev-onboarding-console-2026-02-14-r2.log` (onboarding still PASS after fix)
  - Screenshots: `archive/proofs/tree-visibility-fix-2026-02-14/` (9 screenshots)
- Owners:
  - `relay-cesium-world.html` (scale, camera, basemap dimming)
  - `app/renderers/filament-renderer.js` (cylinder proxy, width floors, LAUNCH_THEME)
  - `scripts/v1-dev-onboarding-flyby.mjs` (basin test condition relaxed)

### 14) R4 Presentation Architecture v2 (Launch Mode)

- What: luminous engineered structure — visual architecture redesign within presentation constraints
- Trigger: `http://localhost:3000/relay-cesium-world.html?profile=launch`
- Scope: launch mode only (`RELAY_LAUNCH_MODE === true`). World/proof modes unaffected.
- Changes:
  - **Trunk**: core+shell architecture — bright inner core (R=18, near-white blue, alpha 0.92) + translucent outer shell (R=34, alpha 0.12) + atmospheric glow ring (very faint, wide)
  - **Root glow pool**: large faint disc (R=80m, alpha 0.10) at trunk base — energy source illusion
  - **Branches**: rib mode — ribScale=0.5 (half-width corridors), translucent (alpha 0.55), emissive center line (bright white-blue, width 2.0)
  - **Tiles**: floating glass platforms — fillAlpha=0.06 (extremely translucent), bright border (alpha 1.0), support filaments at corners (thin vertical lines downward)
  - **Filament rain**: 5 vertical rain lines per tile, deterministic positions, ultra-faint (alpha 0.035), dropping 150m below tile
  - **Environment**: terrain faded to near-abstraction (brightness=0.28, saturation=0.05, gamma=1.6), stronger fog (density=0.00048)
- Contract: no topology, no physics, no gating, no selection/LOD/ID changes.
- Proof artifacts:
  - `archive/proofs/pres-architecture-2-console-2026-02-14.log`
  - Screenshots: `archive/proofs/pres-architecture-2-2026-02-14/01-company.png`, `02-silhouette.png`, `03-detail.png`
- Owners:
  - `app/cesium/viewer-init.js` (fog, atmosphere)
  - `relay-cesium-world.html` (basemap dimming)
  - `app/renderers/filament-renderer.js` (LAUNCH_THEME materials, core+shell, ribs, rain, root glow)
  - `scripts/pres-architecture-2-proof.mjs`

### 13) R4 Presentation Pipeline (Launch Mode)

- What: post-processing + material refinement for "glowing engineered tree" visual language
- Trigger: `http://localhost:3000/relay-cesium-world.html?profile=launch`
- Scope: launch mode only (`RELAY_LAUNCH_MODE === true`). World/proof modes unaffected.
- Changes:
  - Post-processing: FXAA, bloom (sigma=3.78, contrast=119, soft glow), custom color correction (vignette + cool tone), HDR
  - Fog: density=0.00038 for atmospheric depth separation
  - Glass-panel tiles: fillAlpha=0.10 (translucent), borderAlpha=1.0 (vivid bright), inner border (inset 3m, alpha 0.35)
  - Filament light threads: alpha=0.06 (bloom-catchable faint), width=1.5, selectedAlpha=0.65
  - Environment de-emphasis: brightness=0.35, saturation=0.12, gamma=1.4 (near-greyscale terrain)
  - Globe base color: #121a2a (dark navy floor)
  - Atmosphere: cool hue shift, desaturated, gentle brightness
- Contract: no topology, no physics, no gating, no selection/LOD behavior changes.
- Proof lines:
  - `[PRES] postFX enabled=PASS fxaa=ON bloom=ON colorCorrect=ON`
  - `[PRES] fog enabled=PASS density=0.00038`
  - `[PRES] tileMaterial applied=PASS mode=glass innerBorder=ON fillAlpha=0.10 borderAlpha=1.0`
  - `[PRES] filamentStyle applied=PASS mode=threads alpha=0.06 selectedAlpha=0.65 width=1.5`
  - `[PRES] environmentDeemphasis applied=PASS brightness=0.35 saturation=0.12 gamma=1.4`
- Proof artifacts:
  - `archive/proofs/pres-pipeline-console-2026-02-14.log`
  - Screenshots: `archive/proofs/pres-pipeline-2026-02-14/01-company.png`, `02-sheet.png`, `03-edit.png`
  - Onboarding re-verified: `archive/proofs/v1-dev-onboarding-console-2026-02-14.log` (6/6 PASS after R4)
- Owners:
  - `app/cesium/viewer-init.js` (postFX, bloom, fog, atmosphere, color correction)
  - `relay-cesium-world.html` (basemap dimming extension)
  - `app/renderers/filament-renderer.js` (LAUNCH_THEME materials, glass tiles, light threads)
  - `scripts/pres-pipeline-proof.mjs`

### 15) VIS-SHEET-PLATFORM-OVERVIEW-1 (Launch Mode)

- **Purpose**: Outward-facing spreadsheet platforms at company overview with grid + hierarchy cleanup
- **Scope**: Launch mode only (`RELAY_LAUNCH_MODE === true`)
- **Changes**:
  - Horizontal UP-facing platforms replace branch-aligned tiles at overview
  - Visible grid lines (5 cols, 3 rows + header) on platforms
  - Trunk thinned: coreR 18→10, shellR 34→16
  - Branches narrower: ribScale 0.5→0.3, alpha 0.55→0.30
  - Platforms bigger: halfTile 25→35 (70m x 70m)
  - Canonical truth plane metadata unchanged for docking/edit
  - On sheet enter: platform proxy hides, truth plane renders
- **Files touched**:
  - `app/renderers/filament-renderer.js` (LAUNCH_THEME, renderSheetTile, log block)
  - `scripts/vis-sheet-platform-proof.mjs` (new)
- **Proof lines**:
  - `[SHEET-PLATFORM] rendered count=20 mode=overview normal=UP`
  - `[PRES] sheetPlatform grid=PASS majorLines=8 mode=overview normal=UP horizontal=ON`
  - `[PRES] trunkStyle applied=PASS mode=core+shell coreR=10 shellR=16`
  - `[PRES] branchStyle applied=PASS ribMode=ON ribScale=0.3 emissive=ON alpha=0.30`
  - `[SHEET] enter usesTruthPlane=PASS normal=-T`
  - `[PRES-PROOF] silhouetteReadable=PASS`
- **Topology/physics/gating**: UNCHANGED
- **Note**: Launch platforms use horizontal normal proxy for legibility; canonical sheet orientation (-T) preserved for edit mode.
- **Proof artifact**: `archive/proofs/vis-sheet-platform-console-2026-02-14.log`
- **Owners**:
  - `app/renderers/filament-renderer.js`
  - `scripts/vis-sheet-platform-proof.mjs`

### 10) FreeFly Camera Contract (Launch Mode)

- What: permanent FPS FreeFly control — no auto-dock, no auto-enter, E-only acceptance
- Trigger: `http://localhost:3000/relay-cesium-world.html?profile=launch` (FreeFly is default on boot)
- Scope: launch profile only (`RELAY_LAUNCH_MODE`). World profile retains legacy proximity-dock.
- Proof lines:
  - `[INPUT] owner=CAMERA mode=FreeFly reason=default` (boot)
  - `[REFUSAL] reason=AUTO_ANCHOR_BLOCKED action=proximity-dock` (proximity near sheet)
  - `[CAM] E-accept action=ENTER_SHEET target=<id>` (explicit E press)
  - `[INPUT] owner=GRID mode=SheetEdit reason=explicitEnter` (sheet entry)
  - `[INPUT] owner=CAMERA mode=FreeFly reason=exit` (Escape exit)
- Renderer note: `filament-renderer.js` LAUNCH_THEME alpha adjusted (presentation-only):
  - filament alpha 0.12→0.06, trunk alpha 0.92→0.95, branch alpha 0.88→0.92, label alpha 0.45→0.30
- Proof artifact: `archive/proofs/cam-freefly-contract-console-2026-02-14.log`
- Screenshots: `archive/proofs/cam-freefly-contract-2026-02-14/01-boot.png`, `02-proximity.png`, `03-edit.png`
- Owners:
  - `relay-cesium-world.html` (input gating, basin guard, proximity guard)
  - `app/renderers/filament-renderer.js` (LAUNCH_THEME alpha only)
  - `core/utils/relay-log.js` (prefix allow-list: INPUT, MODE, FLIGHT)
  - `scripts/cam-freefly-contract-proof.mjs`

### 8) Slice Governance Gate

- What: pre-commit enforcement for active slice evidence bundle
- Trigger: `npm run gate:slice`
- Proof lines:
  - `[SLICE-GATE] PASS ...`
- Owners:
  - `scripts/slice-gate.mjs`
  - `docs/process/ACTIVE-SLICE.md`
  - `docs/process/SLICE-REGISTER.md`
  - `archive/proofs/PROOF-INDEX.md`

### 9) VIS-LANDSCAPE-PLATFORMS-1 (Landscape Excel Platforms)

- What: Changed platform aspect from square (70x70m) to landscape (120x70m) for Excel-like feel.
  Grid density increased from 5x3 to 12x6. Added header row separator and header column.
- LAUNCH_THEME change: `halfTile: 35` → `halfTileX: 60, halfTileY: 35`; `gridCols: 5→11`, `gridRows: 3→5`
- New properties: `gridHeaderColColor`, `gridHeaderColAlpha`, `gridHeaderColWidth`
- Proof: `archive/proofs/landscape-platform-console-2026-02-14.log`
- Files: `app/renderers/filament-renderer.js`

### 10) VIS-MOCK-TREE-HISTORY-1 (Expanded Demo Tree)

- What: Expanded demoTree from 1 branch to 3 department branches (Operations, Finance, Supply Chain).
  Added 5 new sheets (Material Issues, AP Aging, Cash Forecast, Inbound Requests, Supplier Scorecard).
  Each branch has 4-5 timeboxes matching VIS-4 commit shape.
- Tightening 2: Renamed `commits` → `timeboxes` in demoTree. Renderer accepts both `timeboxes || commits`.
  Comment added: "This is NOT raw commit log data — it is aggregated timebox state."
- Proof: `archive/proofs/mock-tree-console-2026-02-14.log`
- Files: `relay-cesium-world.html`, `app/renderers/filament-renderer.js`

### 11) CAM-VIEWASSIST-FACE-SHEET-1 (Face Sheet Without Entering)

- What: F key in launch mode flies camera to a readable position above the nearest platform.
  Camera contract: pitch=-55°, heading aligned to long axis, distance=diagonal*2.5 (~174m).
  Does NOT enter edit mode — scope stays company, no auto-enter triggered.
- Tightening 1: Platform proxy axes stored in `renderer._sheetProxyCache[sheetId]` (NOT on `sheet._*`).
  Nothing added under `sheet._*` unless it is canonical truth metadata.
- Proximity prompt: "F: Face Sheet | E: Enter Sheet" shown when camera within 50-800m of any platform.
- Proof: `archive/proofs/cam-viewassist-console-2026-02-14.log`
- Files: `app/renderers/filament-renderer.js`, `relay-cesium-world.html`

### 12) PROJ-SHEET-FACING-1 (Projection Lens Overlay)

- What: Optional per-user camera-facing projection lens overlay. Toggle: "Facing Sheets: OFF | ON (Projection)".
  When ON: renders a non-interactive ghost sheet that rotates to face camera for nearest/focused sheet.
  When OFF: standard horizontal platforms (truth only).
- Rules:
  - Projection is a lens overlay, NOT a world object, NOT billboarding
  - Applied to 1 focused/nearest sheet only — everything else stays stable
  - Non-interactive: no pick ID, pointer-events none conceptually
  - Hard blocked when owner=GRID (SheetEdit mode) — `[PROJ] sheetFacing blocked=PASS reason=editing`
  - Click targets always bind to truth surface
  - Entering edit always uses truth plane (canonical -T normal)
- Proof: `archive/proofs/proj-facing-console-2026-02-14.log`
- Files: `app/renderers/filament-renderer.js`, `app/ui/hud-manager.js`, `relay-cesium-world.html`

### 13) Basin Focus Lock (Company Overview on Double-Click)

- What: Double-click on a trunk entity at any LOD triggers `focusCompanyOverview()` — camera flies to company tree overview (pitch=-35, duration=1.2s). LOD locks to COMPANY, revealing full tree (trunk, all branches, platforms, filament rain). Esc returns to prior camera state + LOD.
- Scope: All profiles. Uses existing `travelCamera()` — no new camera functions.
- FPS Contract: Does NOT steal input. Does NOT enter sheet. Does NOT modify FreeFly controls. Camera remains FreeFly (WASD + mouse) during and after focus. Reversible via Esc.
- Architecture: Extends `enterFocusMode()` double-click handler — trunk nodes route to `focusCompanyOverview()`, non-trunk nodes route to standard Focus Lens.
- State: `isCompanyFocusMode`, `companyFocusTarget`, `preCompanyFocusCameraState`, `window._companyFocusState`
- Proof lines:
  - `[CAM] focusLock target=<company> scope=company result=PASS`
  - `[INPUT] owner=CAMERA mode=FreeFly reason=focusLock`
  - `[LOD] lock level=COMPANY reason=basinFocus`
  - `[CAM] basinFocus exit target=<company> restoreView=true`
- Proof artifact: `archive/proofs/basin-focus-console-2026-02-14.log`
- Screenshots: `archive/proofs/basin-focus-2026-02-14/01-pre-focus.png`, `02-company-focus.png`, `03-post-escape.png`
- Owners:
  - `relay-cesium-world.html` (focusCompanyOverview, exitCompanyFocus, double-click handler, Escape handler)
  - `scripts/basin-focus-proof.mjs`

### 14) GLOBE-VOTE-VISIBILITY-1 (Vote-Threshold Branch Filtering)

- **Purpose**: At globe LOD (PLANETARY/REGION), only branches with `voteStatus === 'PASSED'` render.
  At COMPANY LOD (after basin focus), ALL branches render regardless of voteStatus.
- **Scope**: Rendering filter in `filament-renderer.js`, demo data in `relay-cesium-world.html`.
- **Implementation**:
  - Added `voteStatus` field to branch nodes: `'PASSED' | 'PENDING' | 'REJECTED' | 'NONE'`
  - Vote filter applied between `branchesFiltered` and `branchesToRender` in `renderTree()`
  - Filter condition: `isLodAtOrAboveRegion(this.currentLOD)` — only at PLANETARY/REGION
  - At COMPANY LOD: all branches pass through (no filtering)
  - Sheets whose parent branch is hidden are also filtered (no orphan tiles)
  - Window property: `window._voteFilterState = { lod, visible, hidden, mode }`
- **Demo tree**:
  - `branch.operations`: voteStatus='PASSED' (visible at globe)
  - `branch.finance`: voteStatus='PENDING' (hidden at globe, visible at company)
  - `branch.supplychain`: voteStatus='PASSED' (visible at globe)
- **LOD scoping constraint**:
  - Vote filtering applies ONLY at LOD <= REGION (`isLodAtOrAboveRegion()`)
  - At LOD = COMPANY: ALL branches render (override=ALL)
- **Proof lines**:
  - `[VIS] voteFilter LOD=PLANETARY visible=2 hidden=1`
  - `[VIS] voteFilter LOD=COMPANY override=ALL`
- **Proof artifact**: `archive/proofs/globe-vote-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/globe-vote-2026-02-14/01-globe-filtered.png`, `02-company-all.png`
- **Owners**:
  - `app/renderers/filament-renderer.js` (vote filter logic)
  - `relay-cesium-world.html` (demo branch voteStatus)
  - `scripts/globe-vote-visibility-proof.mjs`

### 13) BASIN-FOCUS-LOCK-1 (Company Focus on Double-Click)

- **Purpose**: Double-click on a trunk node flies camera to COMPANY LOD with full tree reveal.
  Does NOT steal input, does NOT enter sheet, does NOT modify FreeFly. Reversible via Esc.
- **Scope**: Launch mode (double-click handler extended, not replaced).
- **Implementation**:
  - Extended double-click handler (line ~12690): trunk nodes route to `focusCompanyOverview()`, non-trunk nodes keep standard Focus Lens.
  - New `focusCompanyOverview(trunkNode)`: uses existing `travelCamera()` (no new flyTo). Saves `preCompanyFocusCameraState` for Esc restore.
  - LOD locked to COMPANY on focus. Prior LOD state restored on exit.
  - Esc handler (line ~7130): exits company focus after Focus Lens and Edit Sheet checks.
  - New `exitCompanyFocus()`: restores camera via `travelCamera()`, unlocks LOD, clears state.
  - Window state: `window._companyFocusState = { active, target, scope, inputOwner, mode }`
- **FPS Contract Compliance** (CAM-FREEFLY-CONTRACT-1):
  - `screenSpaceCameraController` inputs NOT disabled — WASD + mouse always work during focus.
  - No auto-enter sheet — scope stays COMPANY.
  - Input owner stays CAMERA, mode stays FreeFly.
  - Esc returns to pre-focus globe position.
- **Proof lines**:
  - `[CAM] focusLock target=<company> scope=company result=PASS`
  - `[INPUT] owner=CAMERA mode=FreeFly reason=focusLock`
  - `[LOD] lock level=COMPANY reason=basinFocus`
  - `[CAM] basinFocus exit target=<company> restoreView=true`
- **Proof artifact**: `archive/proofs/basin-focus-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/basin-focus-2026-02-14/01-pre-focus.png`, `02-company-focus.png`, `03-post-escape.png`
- **Owners**:
  - `relay-cesium-world.html` (double-click handler, focusCompanyOverview, exitCompanyFocus, Esc handler)
  - `scripts/basin-focus-proof.mjs`

---

### #15 — COMPANY-TREE-TEMPLATE-DENSITY-1

- **Purpose**: Expand demo tree from 3 departments/7 sheets to 6 departments/20+ sheets to create visible "tree crown" silhouette at company focus.
- **Scope**: Presentation-only (demo data + fan placement). No ENU changes, no new LOD logic, no new contracts, no auto-enter.
- **Implementation**:
  - `relay-cesium-world.html`: Added 3 new department branches (Quality, Maintenance, IT/Engineering) with timeboxes and voteStatus. Added 13 new sheets across all 6 departments (3-4 sheets each). Updated edges array.
  - `app/renderers/filament-renderer.js`: Added sibling fan-out logic in sheet tile and sheet primitive render loops. Each sheet within a multi-sheet branch is offset laterally along the B (binormal) axis with `layout.width * 1.15` gap. No overlap/collisions. Template density logs emitted.
  - `window._templateDensityState`: Exposed for proof verification: `{ deptCount, sheetCount, fanLayoutCount, applied }`.
- **Demo Tree Structure**:
  - Operations (3 sheets): Packaging, Material Issues, Production Summary
  - Finance (3 sheets): AP Aging, Cash Forecast, Budget Variance
  - Supply Chain (3 sheets): Inbound Requests, Supplier Scorecard, Inventory Levels
  - Quality (3 sheets): Audit Findings, NC Tracking, SPC Charts
  - Maintenance (3 sheets): Work Orders, Asset Registry, Spare Parts Inventory
  - IT/Engineering (4 sheets): System Uptime, Change Requests, Project Tracker, Security Dashboard
  - Total: 6 departments, 19 demo sheets + modules = 20+ platform tiles
- **Vote Filtering Compatibility**: New branches have mixed voteStatus (PASSED/PENDING) so GLOBE-VOTE-VISIBILITY-1 continues to demonstrate filtering.
- **Proof lines**:
  - `[TEMPLATE] deptCount=<n> sheetsTarget=<n> applied=PASS`
  - `[TEMPLATE] sheetPlacement applied=PASS sheets=<n> collisions=0`
  - `[TEMPLATE] fanLayout applied=PASS`
- **Proof artifact**: `archive/proofs/company-tree-density-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/company-tree-density-2026-02-14/01-company-20-sheets.png`
- **Owners**:
  - `relay-cesium-world.html` (demo tree data)
  - `app/renderers/filament-renderer.js` (fan-out placement logic, template density logs)
  - `scripts/company-tree-density-proof.mjs`

---

### #16 — VIS-RADIAL-CANOPY-1

- **Purpose**: Replace binormal fan layout with radial canopy: platforms in rings around trunk at 3 tiers, curved branch ribs to tier hubs, so company view reads as "tree silhouette" not "sheet stack next to a pole."
- **Scope**: Launch-only. No ENU contract changes. Grid LOD (major at overview) and label discipline (dept-only at overview).
- **Implementation**:
  - `RADIAL_CANOPY_LAYOUT`: 3 tiers (radii 220, 280, 340 m; heights 2000, 2150, 2300). Six demo departments mapped to tier + base angle (0°, 60°, 120°, 180°, 240°, 300°). Arc 60° per dept.
  - Branch ribs: when branch in canopy map, path from (0,0,topAlt) to hub (radius*cos(angle), radius*sin(angle), tierHeight) via 3-point Bezier curve.
  - Sheet placement: on ring at tier radius/height, angle = baseAngle + (sibIdx/sibCount)*arcDeg. Horizontal platform (ENU East/North/Up).
  - Grid LOD: at COMPANY overview (`_gridLODMajorOnly`) only header row + header column drawn.
  - Labels: at overview sheet labels hidden (show: false when _gridLODMajorOnly).
  - Company focus camera pitch changed from -35 to -55 in `focusCompanyOverview`.
- **Proof**: `scripts/canopy-layout-proof.mjs`; `window._canopyState`; silhouette condition tiersVisible=3 sheetsVisible>=12.
- **Owners**: `app/renderers/filament-renderer.js`, `relay-cesium-world.html`, `scripts/canopy-layout-proof.mjs`

---

### #17 — HUD-CONSOLIDATION-1 ✅ PASSED

- **Purpose**: In `?profile=launch`, exactly one HUD surface; Tier 1 (6 rows), Tier 2 collapsed by default (H or "diagnostics"); deterministic across boot, focus, sheet, edit. No duplicate state surfaces; forbidden panels hidden in launch.
- **Spec**: `archive/superseded-docs/HUD-CONSOLIDATION-1-SPEC.md`
- **Proof lines**:
  - `[HUD] consolidated rootCount=1 duplicates=0`
  - `[HUD] tier1 rows=6`
  - `[HUD] tier2 default=collapsed`
  - `[HUD] tier2 toggle=ON|OFF reason=hotkey|click`
  - `[HUD] mode=FreeFly|CompanyFocus|Sheet|SheetEdit`
  - `[HUD-PROOF] gate-summary result=PASS stages=6/6`
- **Proof artifact**: `archive/proofs/hud-consolidation-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/hud-consolidation-2026-02-14/01-boot.png`, `02-companyfocus.png`, `03-sheetedit.png`
- **Owners**:
  - `app/ui/hud-manager.js`
  - `relay-cesium-world.html`
  - `scripts/hud-consolidation-proof.mjs`

---

### #18 — NODE-RING-RENDER-1 ✅ PASSED

- **Purpose**: Semantic rings at COMPANY LOD for trunk + each department branch. Encoding per RELAY-NODE-RING-GRAMMAR: thickness=pressure, pulse=voteEnergy, color=stateQuality. Overlays only; no change to slabs/timeboxes/canopy/LOD/focus/FreeFly.
- **Spec**: `archive/superseded-docs/NODE-RING-RENDER-1-SPEC.md`
- **Contract**: `docs/architecture/RELAY-NODE-RING-GRAMMAR.md`
- **Proof lines**:
  - `[RING] applied=PASS nodes=<n> scope=company lod=COMPANY`
  - `[RING] mapping thickness=pressure pulse=voteEnergy color=stateQuality`
  - `[RING-PROOF] gate-summary result=PASS`
- **Proof artifact**: `archive/proofs/node-ring-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/node-ring-2026-02-14/01-company.png`, `02-branch.png`
- **Owners**:
  - `app/renderers/filament-renderer.js`
  - `scripts/node-ring-render-proof.mjs`

---

### #19 — BASIN-RING-1 (R3) ✅ PASSED

- **Status**: PASSED
- **Commit**: 04001b4
- **Date**: 2026-02-14
- **Purpose**: Shared-anchor basin rings: companies on a ring around site anchor; stable sort by id; N≤6 individual rings, N>6 cluster (count badge). Preserve FreeFly, focus lock, vote filtering, rings/slabs overlays.
- **Spec**: `archive/superseded-docs/BASIN-RING-1-SPEC.md`
- **Contract**: `docs/architecture/RELAY-NODE-RING-GRAMMAR.md` §5
- **Proof lines**:
  - `[VIS] basinRings anchor=<id> companies=<n> mode=<rings|cluster>`
  - `[BASIN-PROOF] gate-summary result=PASS`
- **Proof artifact**: `archive/proofs/basin-ring-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/basin-ring-2026-02-14/01-basin-ring.png`, `02-cluster.png`
- **Owners**:
  - `app/renderers/filament-renderer.js`
  - `relay-cesium-world.html` (demo trunks for N=6)
  - `scripts/basin-ring-proof.mjs`

### #20 — COMPANY-TEMPLATE-FLOW-1 (Phase 5) ✅ PASSED

- **Status**: PASSED
- **Date**: 2026-02-14
- **Purpose**: Demonstrate canonical data path: Event → Route → Fact → Match → Summary → KPI → Timebox → Tree Motion. P2P load on launch; one deterministic simulate event; [FLOW] logs; visual pulse (no topology change).
- **Spec**: `archive/superseded-docs/COMPANY-TEMPLATE-FLOW-1-SPEC.md`
- **Proof lines**:
  - `[FLOW] moduleLoaded=P2P result=PASS`
  - `[FLOW] dataPath route=... factSheet=... matchSheet=... summary=... kpi=...`
  - `[FLOW] timeboxUpdate branch=... timeboxId=... result=PASS`
  - `[FLOW] treeMotion=PASS nodesAffected=<n>`
  - `[FLOW-PROOF] gate-summary result=PASS`
- **Proof artifact**: `archive/proofs/company-template-flow-console-2026-02-14.log`
- **Screenshots**: `archive/proofs/company-template-flow-2026-02-14/01-before.png`, `02-after.png`
- **Owners**: relay-cesium-world.html, app/modules/module-loader.js, app/routes/*, app/renderers/filament-renderer.js, scripts/company-template-flow-proof.mjs

### #21 — VOTE-COMMIT-PERSISTENCE-1 (Phase 6) ✅ PASSED

- **Status**: PASSED
- **Date**: 2026-02-15
- **Purpose**: Make governance decisions persist and drive canon-visible state. lifecycle-runner drives COMMIT vs REFUSAL outcomes; vote outcomes persisted (demo localStorage `RELAY_VOTE_STORE_V0`); branch voteStatus transitions update globe visibility filtering; rejected branches show visible scar overlay; HUD shows vote summary.
- **Spec**: `archive/superseded-docs/VOTE-COMMIT-PERSISTENCE-1-SPEC.md`
- **Contract**: `docs/architecture/RELAY-FILAMENT-LIFECYCLE.md`
- **Proof lines**:
  - `[VOTE] restore backend=localStorage mode=demo loaded=<n> result=PASS`
  - `[VOTE] decision branch=<id> result=<PASSED|REJECTED|PENDING> lifecycle=<state> quorum=<pct>`
  - `[VOTE] persist backend=localStorage mode=demo stored=<n> result=PASS`
  - `[SCAR] applied branch=<id> reason=voteRejected result=PASS`
  - `[HUD] votes summary=PASS passed=<n> pending=<n> rejected=<n>`
  - `[VIS] voteFilter LOD=PLANETARY visible=<n> hidden=<n>`
  - `[VOTE-PROOF] gate-summary result=PASS stages=6/6`
- **Proof artifact**: `archive/proofs/vote-commit-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/vote-commit-2026-02-15/01-company.png`, `02-globe-filter.png`, `03-reload-restored.png`
- **Owners**:
  - `relay-cesium-world.html` (wiring, persistence, demo topics, button)
  - `app/renderers/filament-renderer.js` (vote rejection scar overlay)
  - `app/ui/hud-manager.js` (vote summary tier1 row)
  - `scripts/vote-commit-proof.mjs`

---

### #22 — FILAMENT-LIFECYCLE-1

- **Status**: (pending)
- **Date**: 2026-02-15
- **Purpose**: Hard lifecycle physics of filaments: object contract + global registry, dual state machines (work + lifecycle), inward movement mapping (lifecycle state → branch position), closure enforcement (governance + drifts + work state), trunk absorption via appendTimeboxEvent, turnover rate metric, band-snap alignment to _vis4SlabRegistry timebox slabs.
- **Spec**: `archive/superseded-docs/FILAMENT-LIFECYCLE-1-SPEC.md`
- **Contract**: `docs/architecture/RELAY-FILAMENT-LIFECYCLE.md`
- **Proof lines**:
  - `[FILAMENT] registry initialized=PASS total=<n>`
  - `[FILAMENT] lifecycleTransition id=<id> from=<old> to=<new> result=PASS`
  - `[FILAMENT] bandSnap id=<id> timeboxId=<tb> deltaM=<n> result=PASS`
  - `[FILAMENT] turnover id=<id> durationMs=<n> branch=<id> result=PASS`
  - `[REFUSAL] reason=FILAMENT_CLOSE_BLOCKED_<why> filament=<id>`
  - `[TIMEBOX] event type=FILAMENT_ARCHIVE id=<id> applied=PASS target=trunk.<id> timeboxId=<tbId>`
  - `[FILAMENT-PROOF] gate-summary result=PASS`
- **Proof artifact**: `archive/proofs/filament-lifecycle-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/filament-lifecycle-2026-02-15/01-markers-company.png`, `02-after-transitions.png`, `03-closure-refusal.png`, `04-band-snap.png`
- **Owners**:
  - `relay-cesium-world.html` (registry, demo filaments, state machines, closure, appendTimeboxEvent)
  - `app/renderers/filament-renderer.js` (renderFilamentMarkers, band snap)
  - `core/models/relay-state.js` (filaments Map property)
  - `scripts/filament-lifecycle-proof.mjs`

---

### #23 — FILAMENT-DISCLOSURE-1 ✅ PASSED

- **Purpose**: Visibility physics for filaments — tiers (PRIVATE/WITNESSED/PUBLIC_SUMMARY/FULL_PUBLIC), monotonic disclosure transitions, lifecycle auto-upgrade, governance gating, counter-disclosure (additive evidence), HUD glyph, marker overlay, persistence.
- **Status**: PASSED
- **Spec**: `archive/superseded-docs/FILAMENT-DISCLOSURE-1-SPEC.md`
- **Proof lines**:
  - `[DISCLOSURE] id=<id> from=<old> to=<new> reason=<reason> result=PASS`
  - `[DISCLOSURE] evidenceAppended id=<id> count=<n> result=PASS`
  - `[DISCLOSURE] persist backend=localStorage stored=<n> result=PASS`
  - `[DISCLOSURE] restore backend=localStorage loaded=<n> result=PASS`
  - `[DISCLOSURE] markersRendered count=<n> tiers={...}`
  - `[REFUSAL] reason=DISCLOSURE_DOWNGRADE_BLOCKED filament=<id> attempted=<tier>`
  - `[REFUSAL] reason=DISCLOSURE_REQUIRES_VOTE filament=<id> attempted=<tier>`
  - `[HUD] disclosureGlyph tier=<tier> result=PASS`
  - `[DISCLOSURE-PROOF] gate-summary result=PASS stages=8/8`
- **Proof artifact**: `archive/proofs/filament-disclosure-console-YYYY-MM-DD.log`
- **Screenshots**: `archive/proofs/filament-disclosure-YYYY-MM-DD/01-boot.png`, `02-after-disclosure.png`, `03-refusal.png`
- **Owners**:
  - `relay-cesium-world.html` (disclosure functions, demo transitions, persistence, HUD glyph wiring)
  - `app/renderers/filament-renderer.js` (marker visibility tier overlay)
  - `app/ui/hud-manager.js` (disclosure glyph in HUD)
  - `scripts/filament-disclosure-proof.mjs`

---

### ATTENTION-CONFIDENCE-1 — Compute Foundation ✅ PASSED (83c8702)

- **What**: `getBackingRefs()`, `computeConfidence()`, `computeAttention()`, fractal `aggregateAttention()` — read-only computation from existing filament/timebox/vote/disclosure stores. HUD Tier 2 shows `Conf: X% | Attn: Y%` for focused objects.
- **Trigger**: Automatic on focus change; HUD Tier 2 readout always visible when expanded (H key)
- **Proof lines**:
  - `[AC] getBackingRefs id=<id> refs=<n> result=PASS`
  - `[AC] computeConfidence id=<id> conf=<pct> backing=<n> result=PASS`
  - `[AC] computeAttention id=<id> attn=<val> votes=<n> activity=<n> result=PASS`
  - `[AC] aggregateAttention scope=<scope> children=<n> attn=<val> result=PASS`
  - `[HUD] tier2 conf=<pct> attn=<val> result=PASS`
  - `[AC-PROOF] gate-summary result=PASS stages=7/7`
- **Proof script**: `scripts/attention-confidence-proof.mjs` (7 stages)
- **Proof artifact**: `archive/proofs/attention-confidence-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/attention-confidence-2026-02-15/01-hud-readout.png`
- **Spec**: `archive/superseded-docs/ATTENTION-CONFIDENCE-1-SPEC.md`
- **Commit**: 83c8702
- **Contract compliance**: Read-only computation, no geometry changes, no new schema, HUD Tier 2 integration
- **Owners**:
  - `relay-cesium-world.html` (compute functions, fractal aggregation, HUD wiring)
  - `app/ui/hud-manager.js` (Tier 2 readout display)
  - `scripts/attention-confidence-proof.mjs`

### VIS-TREE-SCAFFOLD-1 — Canonical Tree Geometry ✅ PASSED (c7db24b)

- **What**: `TREE_SCAFFOLD` render mode — branches originate at trunk top, spread radially with upward arc, sheets attach at branch endpoints with canonical normal. Stub tiles (16×16m, low alpha) replace full platforms. Toggle via T key or Tier 2 button. LAUNCH_CANOPY remains unchanged.
- **Trigger**: T key toggle or Tier 2 HUD button
- **Proof lines**:
  - `[MODE] renderMode=TREE_SCAFFOLD`
  - `[VIS-SCAFFOLD] mode=TREE_SCAFFOLD result=PASS`
  - `[VIS-SCAFFOLD] placement trunkTopU=<m> branchOriginU=<m> sheetAttachU=<m>`
  - `[VIS-SCAFFOLD] sheetsAttachedToBranches count=<n>`
  - `[VIS-SCAFFOLD] ringBand ok=PASS altitude=<m> scope=<company|branch>`
  - `[VIS-SCAFFOLD-PROOF] gate-summary result=PASS stages=7/7`
- **Proof script**: `scripts/vis-tree-scaffold-proof.mjs` (7 stages)
- **Proof artifact**: `archive/proofs/vis-tree-scaffold-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/vis-tree-scaffold-2026-02-15/01-scaffold-mode.png`, `02-canopy-restored.png`
- **Spec**: `archive/superseded-docs/VIS-TREE-SCAFFOLD-1-SPEC.md`
- **Commit**: c7db24b
- **Contract compliance**: Additive mode, LAUNCH_CANOPY unchanged, canonical branch/sheet geometry, T key toggle
- **Owners**:
  - `app/renderers/filament-renderer.js` (scaffold geometry, mode toggle, stub tiles)
  - `relay-cesium-world.html` (T key handler, mode state, HUD wiring)
  - `scripts/vis-tree-scaffold-proof.mjs`

### HEIGHT-BAND-1 — Semantic Height ✅ PASSED (7cbfcab)

- **What**: Semantic height bands in TREE_SCAFFOLD mode — attention/confidence-driven vertical offsets for branches and sheets. Indeterminate guard prevents height assignment when confidence is below floor or backing refs are missing. Contributor logging tracks what backs each offset.
- **Trigger**: Active automatically in TREE_SCAFFOLD mode (T key). LAUNCH_CANOPY heights unchanged.
- **Proof lines**:
  - `[HEIGHT-BAND] applied=PASS mode=TREE_SCAFFOLD bands=6 maxOffset=120`
  - `[HEIGHT] branch=<id> offset=<m> band=<base> attn=<val> conf=<val>`
  - `[HEIGHT] indeterminate id=<id> conf=<val> missing=<n>`
  - `[HEIGHT-PROOF] gate-summary result=PASS stages=8/8`
- **Proof script**: `scripts/height-band-proof.mjs` (8 stages)
- **Proof artifact**: `archive/proofs/height-band-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/height-band-2026-02-15/01-height-bands.png`
- **Spec**: `archive/superseded-docs/HEIGHT-BAND-1-SPEC.md`
- **Commit**: 7cbfcab
- **Contract compliance**: Evidence-backed height, indeterminate guard, LAUNCH_CANOPY unchanged, contributor logging
- **Owners**:
  - `app/renderers/filament-renderer.js` (height offset application, band computation)
  - `relay-cesium-world.html` (height band wiring)
  - `scripts/height-band-proof.mjs`

### VIS-MEGASHEET-1 — Top-Down Projection Lens ✅ PASSED (bf050c7)

- **What**: MEGASHEET render mode — top-down projection lens with deterministic importance-biased radial layout. State-tinted tiles show sheet health at a glance. Toggle via M key. Camera repositions to top-down view on enter, restores on exit. LAUNCH_CANOPY and TREE_SCAFFOLD remain unchanged.
- **Trigger**: M key toggle
- **Proof lines**:
  - `[MODE] renderMode=MEGASHEET`
  - `[MEGA] layout=PASS sheets=<n> mode=radial`
  - `[MEGA] tileVisual sheet=<id> tint=<color> importance=<val>`
  - `[MEGA-PROOF] gate-summary result=PASS stages=6/6`
- **Proof script**: `scripts/vis-megasheet-proof.mjs` (6 stages)
- **Proof artifact**: `archive/proofs/vis-megasheet-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/vis-megasheet-2026-02-15/01-megasheet-mode.png`, `02-restored.png`
- **Spec**: `archive/superseded-docs/VIS-MEGASHEET-1-SPEC.md`
- **Commit**: bf050c7
- **Contract compliance**: Additive mode, LAUNCH_CANOPY/TREE_SCAFFOLD unchanged, deterministic layout, no new schema
- **Owners**:
  - `app/renderers/filament-renderer.js` (megasheet layout, tile tinting, mode toggle)
  - `relay-cesium-world.html` (M key handler, mode state, camera positioning)
  - `scripts/vis-megasheet-proof.mjs`

---

## Planned Capabilities (Not Yet Implemented)

### Video Presence — Module L.5 (PresenceStream)

Live video/audio/screen-share communication inside the 3D world. Specified in `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` Module L.5 (slice decomposition in L.5.8).

**PRESENCE-STREAM-1** (WebRTC Signaling + Ephemeral Streams)

- What: WebRTC peer connections via existing VIS-6c WebSocket transport
- Trigger: join effectiveScope → auto-room assignment
- Transport: VIS-6c WS (port 4031), event type `rtc-signal`
- Budget: max 8 participants per room
- Key logs: `[VIS8] join`, `[VIS8] signal`, `[VIS8] leave`, `[REFUSAL] reason=STREAM_ROOM_CAP_EXCEEDED`
- Status: **PLANNED** (VIS-MEGASHEET-1 is PASS; signaling slice ready for execution when architect chooses)
- Owners (planned): `app/presence/stream-manager.js`, `relay-cesium-world.html`

**PRESENCE-RENDER-1** (Video Textures + LOD)

- What: Live MediaStream as video textures on presence card billboard entities
- LOD: COMPANY=dot, SHEET=card (64×48), CELL=stage (256×192)
- Budget: max 8 cards, max 4 stages
- UOC: `presenceStream` type in ACTION_REGISTRY
- Key logs: `[VIS8] renderCard`, `[VIS8] lodSwitch`, `[VIS8] textureBind`
- Status: **PLANNED** (pending PRESENCE-STREAM-1 PASS)
- Owners (planned): `app/renderers/filament-renderer.js`, `app/presence/stream-manager.js`, `app/ux/relay-object-contract.js`

**PRESENCE-COMMIT-BOUNDARY-1** (Optional Canonical Call Summary)

- What: Optional commit of call summary artifact via W0-W2 material artifact chain
- Trigger: explicit "Commit Call Summary" action (all-party consent required)
- Key logs: `[VIS8] commitBoundary`, `[VIS8] artifactCommitted`, `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED`
- Status: **PLANNED** (pending PRESENCE-RENDER-1 PASS)
- Owners (planned): `app/presence/stream-manager.js`, `app/ux/relay-object-contract.js`

**Contract compliance**: All 15 frozen contracts verified. Critical constraints: Contract #15 (data minimization — default video OFF, Tier 2 consent required, no silent recording), Contract #8 (UOC — presenceStream type with standard actions), Contract #12 (explicit refusal for all failures).

---

## Open items (dedicated slice later)

### RESTORE-PARITY-TIMEOUT-1

- **Issue**: `scripts/restore-full-parity-proof.mjs` hits a pre-existing timeout (`page.waitForFunction` 120s exceeded). Proof runs profile-isolation, globe-stack, boundary-editor, voting-surface, hud-policy then blocks; not caused by VIS-2 or recent slices.
- **Status**: Left out of VIS-2 micro-batch #2; to be addressed in a dedicated slice (e.g. RESTORE-PARITY-TIMEOUT-1).
- **Script**: `scripts/restore-full-parity-proof.mjs`

---

### #21 — LAUNCH-FIX-1 (Clarity Micro-batch)
- **Status**: PASSED
- **Commit**: (pending)
- **Date**: 2026-02-15
- **Script**: `scripts/launch-fix-1-proof.mjs`
- **Artifact**: `archive/proofs/launch-fix-1-console-2026-02-15.log`
- **Summary**: Face-on camera docking on `relayEnterSheet`, minimal 2D grid overlay showing sheet data (read-only), proper grid hide on exit. Topology validation scoped to canonical expanded mode (canopy/launch presentation exempt). All regression proofs (VIS-2, HUD, Lifecycle, Disclosure) PASS.

### SCOPE-COHERENCE-1 — Scope Coherence Tightening
- **Status**: PASS (2026-02-15)
- **Spec**: N/A (tightening micro-batch)
- **Artifact**: `archive/proofs/vis2-company-compression-console-2026-02-15.log`
- **Summary**: Eliminated `expandedSheetsAllowed=false scope=sheet` contradiction. Unified effectiveScope used by VIS2/LOD/dock/overlay. Auto-dock disabled in sheet/edit mode. Consistent cleanup in `_relayClearSheetScopeState`. All 5 regression proofs PASS.

*(ATTENTION-CONFIDENCE-1, VIS-TREE-SCAFFOLD-1, HEIGHT-BAND-1, VIS-MEGASHEET-1 — full entries above in Active Capability Manual)*

### CAM0.4.2-FILAMENT-RIDE-V1 — Temporal Navigation

- **Status**: PASS (2026-02-15)
- **Purpose**: Extends filament ride from camera-only movement to temporal navigation with epistemic readout at each timebox stop
- **Trigger**: R key (with filament focused) — enter/exit ride. Left/Right arrow — navigate stops. Esc — exit ride.
- **Proof Script**: `scripts/cam042-filament-ride-v1-proof.mjs` (12 stages)
- **Proof Artifact**: `archive/proofs/filament-ride-v1-2026-02-15/cam042-filament-ride-v1-proof-console-2026-02-15.log`
- **Spec**: `archive/superseded-docs/CAM042-FILAMENT-RIDE-V1-SPEC.md`
- **Required Logs**: `[RIDE] enter`, `[RIDE] step`, `[RIDE] boundary`, `[RIDE] exit`, `[RIDE] hudContext`, `[RIDE] highlight`, `[REFUSAL] reason=RIDE_DISCLOSURE_BLOCKED`
- **Key Features**:
  - Epistemic readout at each stop: lifecycle state, disclosure tier, confidence %, attention score, commit count, contributor count
  - Scaffold-aware path detection (canopy vs scaffold mode)
  - Lifecycle-colored highlight overlay (RIDE_LIFECYCLE_COLORS in filament-renderer.js)
  - Disclosure gate — blocks cross-filament PRIVATE stops with REFUSAL log
  - Boundary crossing logs on each step
  - HUD Tier 1 ride context panel (during active ride)
  - v0 API backward compatible (relayEnterFilamentRide, relayFilamentRideNext, etc.)
  - Deterministic path hash on repeat rides
- **Contract Compliance**: Read-only access to lifecycle, disclosure, attention, confidence. No changes to state machines. FreeFly contract preserved (Esc always exits).
- **Files Changed**: `relay-cesium-world.html`, `app/renderers/filament-renderer.js`, `app/ui/hud-manager.js`

---

### PRESENCE-STREAM-1 — Ephemeral Presence Bus

- **Status**: PASS (2026-02-15)
- **Purpose**: Creates an ephemeral presence bus for live coordination: announces join/leave/heartbeat, binds presence to effectiveScope + focusId + optional filament ride stop, enforces budget caps, expires state by TTL. No video, no persistence, no commits.
- **Trigger**: Auto-enabled in launch mode. API: `window.relayPresenceEnable()`, `window.relayPresenceJoin()`, `window.relayPresenceBind()`, `window.relayPresenceLeave()`
- **Proof Script**: `scripts/presence-stream-1-proof.mjs` (7 stages)
- **Proof Artifact**: `archive/proofs/presence-stream-1-console-2026-02-15.log`
- **Required Logs**: `[PRESENCE] engine enabled=PASS`, `[PRESENCE] ws connect`, `[PRESENCE] room resolve`, `[PRESENCE] join`, `[PRESENCE] hb`, `[PRESENCE] ttl-expire`, `[PRESENCE] leave`, `[PRESENCE] bind`, `[PRESENCE] bind-change`, `[REFUSAL] reason=PRESENCE_ROOM_CAP_EXCEEDED`, `[REFUSAL] reason=PRESENCE_USER_ROOM_CAP_EXCEEDED`
- **Key Features**:
  - PresenceEngine class (app/presence/presence-engine.js) — rooms, join/leave/heartbeat, TTL sweep, budget enforcement, scope binding
  - Protocol constants (app/presence/presence-protocol.js) — message envelope, refusal reasons, deriveRoomId
  - Deterministic roomId from scopeId via FNV-1a hash
  - Scope binding: effectiveScope + focusId + optional ride stop (CAM0.4.2 integration)
  - Budget caps: MAX_ROOM_PARTICIPANTS=8, MAX_JOINED_ROOMS_PER_USER=2
  - TTL_MS=15000, HB_MS=3000
  - WebSocket transport (ws://127.0.0.1:4031/vis8), degrades to local-only
  - HUD Tier 2 presence line: members/cap | scope | focus
  - Event-driven bind hooks (scope/focus/ride) + 10s safety bind heartbeat
- **Contract Compliance**: Purely ephemeral (no persistence, no localStorage, no commits). Scope binding uses effectiveScope truth source. Budget caps with deterministic refusal. Non-interference with governance/disclosure/attention.
- **Files Changed**: `app/presence/presence-engine.js` (NEW), `app/presence/presence-protocol.js` (NEW), `relay-cesium-world.html`, `app/ui/hud-manager.js`

---

### PRESENCE-RENDER-1 — WebRTC Media + LOD Rendering

- **Status**: PASS (2026-02-15)
- **Purpose**: Adds WebRTC media semantics on top of PRESENCE-STREAM-1 with consent gates, deterministic decode/render budgets by LOD, billboard default rendering, and stage pin behavior.
- **Trigger**: API-driven (`window.relayPresenceToggleCam`, `window.relayPresenceToggleMic`, `window.relayPresencePinUser`, `window.relayPresenceRenderNow`)
- **Proof Script**: `scripts/presence-render-1-proof.mjs` (10 stages)
- **Proof Artifact**: `archive/proofs/presence-render-1-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/presence-render-1-2026-02-15/01-billboard-hud.png`, `archive/proofs/presence-render-1-2026-02-15/02-stage-hud.png`
- **Required Logs**: `[VIS8] renderEngine enabled=PASS`, `[VIS8] mediaPermissions`, `[VIS8] cam state`, `[VIS8] mic state`, `[VIS8] rtc join/offer/answer/ice/connected`, `[VIS8] renderCard`, `[VIS8] lodSwitch`, `[VIS8] budget decode`, `[VIS8] budget render`, `[REFUSAL] reason=VIS8_VIDEO_DECODE_BUDGET_EXCEEDED`, `[REFUSAL] reason=VIS8_VIDEO_RENDER_BUDGET_EXCEEDED`
- **Key Features**:
  - SFU-ready semantics with mesh v0 signaling behavior
  - Camera OFF by default, mic OFF by default; explicit opt-in required
  - Permission denial degrades to presence-only (non-fatal)
  - LOD budgets: COMPANY/BRANCH decode 2 render 4; SHEET decode 4 render 6; CELL/STAGE decode 4 render 4
  - Deterministic selection policy: pin > distance > userId
  - Billboard default rendering + stage panel when pinned
  - HUD Tier 2 media state: Cam/Mic + Decode/Render + Pinned
  - Regression compatibility: PRESENCE-STREAM-1 (7/7) and CAM0.4.2 (12/12)
- **Contract Compliance**: No persistence; no commit-boundary logic; no LAUNCH_CANOPY geometry changes; no CAM0.4.2 behavior changes.
- **Files Changed**: `app/presence/webrtc-adapter.js` (NEW), `app/presence/presence-renderer.js` (NEW), `app/presence/presence-engine.js`, `app/presence/presence-protocol.js`, `relay-cesium-world.html`, `app/ui/hud-manager.js`, `scripts/presence-render-1-proof.mjs`

---

### PRESENCE-COMMIT-BOUNDARY-1 — Call Summary Consent Boundary

- **Status**: PASS (2026-02-15)
- **Purpose**: Creates an optional canonical call boundary that is consent-gated (unanimous), writes hash-backed metadata only, stores as a timebox event via appendTimeboxEvent, uses the existing W0–W2 chain (PROPOSE → COMMIT), does not affect media transport/rendering, and does not introduce persistence beyond normal commit artifacts.
- **Trigger**: API-driven (`window.relayCallCommitRequest()`, `window.relayCallCommitVote()`, `window.relayCallCommitGetState()`)
- **Proof Script**: `scripts/presence-commit-boundary-1-proof.mjs` (9 stages)
- **Proof Artifact**: `archive/proofs/presence-commit-boundary-1-console-2026-02-15.log`
- **Screenshots**: `archive/proofs/presence-commit-boundary-1-2026-02-15/01-consent-proposal-hud.png`
- **Required Logs**: `[CALL] commitSummary requested`, `[CALL] consent request sent`, `[CALL] consent vote`, `[CALL] consent state=<COLLECTING|GRANTED|DENIED|EXPIRED>`, `[W0] artifact propose type=CALL_SUMMARY`, `[TIMEBOX] event type=CALL_SUMMARY`, `[CALL] summary hashes`, `[CALL] commit gate`, `[REFUSAL] reason=CALL_COMMIT_AUTHORITY_MISSING`, `[REFUSAL] reason=CALL_COMMIT_CONSENT_DENIED`
- **Key Features**:
  - Unanimous explicit consent state machine (IDLE → COLLECTING → GRANTED/DENIED/EXPIRED)
  - Consent prompt fires only on explicit "Commit Call Summary" action (never automatically)
  - 60s consent TTL window
  - Hash-backed metadata: summaryHash, participantsHash, bindingsHash, consentHash (SHA-256)
  - Optional one-line title (metadata, not transcript)
  - W0–W2 chain integration: enters at PROPOSE; COMMIT requires authorityRef
  - Timebox event with type=CALL_SUMMARY, hashes, scope, participantsCount, durationMs
  - Fractal ride binding: includes filamentId/timeboxId when ride is active
  - HUD Tier 2: consent state + pending count + last summary ID
  - getRoomSnapshot accessor on PresenceEngine for consent coordination
- **Contract Compliance**: Unanimous explicit consent only; no auto call-end commits; no raw media/transcripts/screenshots/keyframes; hash-backed metadata only; uses W0–W2 chain (PROPOSE first; COMMIT requires authority); timebox event emitted with hashes and scope refs. PRESENCE-STREAM-1 (7/7), PRESENCE-RENDER-1 (10/10), and CAM0.4.2 (12/12) regressions pass.
- **Files Changed**: `relay-cesium-world.html`, `app/presence/presence-engine.js`, `app/presence/presence-protocol.js`, `app/ui/hud-manager.js`, `scripts/presence-commit-boundary-1-proof.mjs`

---

### HEADLESS-0 — Headless Parity Gate (SHA-256)

- **Status**: PASS (2026-02-15)
- **Purpose**: Proves byte-identical data outputs between headless and 3D modes across 7 canonical components (facts, matches, summaries, KPIs, commits, packets, ledger) using SHA-256 golden hashes. Establishes foundation for CI/CD, replay, and ledger gates.
- **Trigger**: `?headless=true` URL param (FORCED) or runtime detection (`!viewer || !viewer.scene`, FALLBACK). APIs: `window.relayD0GateHeadless(count)`, `window.relayGetGoldenStateHashesSHA256(options)`, `window.relayExtractRuntimeFixtureForParity()`
- **Proof Script**: `scripts/headless-0-proof.mjs` (8 stages)
- **Proof Artifact**: `archive/proofs/headless-0-console-2026-02-15.log`
- **Required Logs**: `[HEADLESS] mode=FORCED reason=urlParam` (or `FALLBACK reason=noViewer`), `[HEADLESS] gate=D0.1..D0.5`, `[HEADLESS] gate=D0.3 result=NA reason=no-renderer`, `[HEADLESS] golden-compare ... sha256=<first16>`, `[HEADLESS] nonInterference presenceEnabled=true roomJoin=SKIPPED result=PASS`
- **Key Features**:
  - Dual detection: URL param force + runtime fallback
  - D0 gate adaptation: D0.1 ingestion, D0.2 recompute, D0.4 renderer-free data integrity (no DOM), D0.5 date functions; D0.3 = NA (pass=null, na=true)
  - SHA-256 golden hashes for HEADLESS-0 comparisons; internal FNV-1a unchanged
  - 7-component golden scope with NA fallback for inactive components
  - Fixture parity: Node.js vs browser SHA-256 match on canonical fixture
  - Stress parity: 10k D0 run + post-stress golden SHA-256 match
  - Non-interference: presence engine enable without room join does not affect golden hashes
  - `computeTier1GoldenHashesSHA256()` in tier1-parity.js (Node.js) + `relayGetGoldenStateHashesSHA256()` in browser
- **Contract Compliance**: SHA-256 for golden outputs; FNV-1a unchanged internally; D0.3 explicitly NA (not pass=true); D0.4 renderer-free; Stage 8 non-interference with roomJoin=SKIPPED; no new persistence; no changes to presence/ride/consent.
- **Files Changed**: `core/models/headless/tier1-parity.js`, `relay-cesium-world.html`, `scripts/headless-0-proof.mjs`
- **Regressions**: headless-tier1-parity (FNV-1a) MATCH, PRESENCE-COMMIT-BOUNDARY-1 9/9 PASS, PRESENCE-STREAM-1 7/7 PASS, PRESENCE-RENDER-1 10/10 PASS, CAM0.4.2 12/12 PASS

---

### E3-REPLAY-1 — Scoped Deterministic Replay (SHA-256)

- **Status**: PASS (2026-02-15)
- **Purpose**: Deterministically replays derived state from commit history at sheet and module granularity. Compares replay output against live state using SHA-256 golden hashes. Emits REPLAY_DIVERGENCE scar + refusal on mismatch. Foundation for audit trail, governance replay, and future ledger verification.
- **Trigger**: `window.relayReplaySheetSHA256(sheetId, opts)`, `window.relayReplayModuleSHA256(moduleId, opts)`. Options include `fromCommitIndex`, `toCommitIndex` (partial range), `baselineHashes` (divergence detection).
- **Proof Script**: `scripts/e3-replay-1-proof.mjs` (9 stages)
- **Proof Artifact**: `archive/proofs/e3-replay-1-console-2026-02-15.log`
- **Required Logs**: `[REPLAY] start scope=module moduleId=<id> from=<n> to=<n|latest>`, `[REPLAY] golden-compare facts=M matches=M ...`, `[REPLAY] timing ingest=...ms ...`, `[REPLAY] module moduleId=<id> result=MATCH|DIVERGENCE`, `[REPLAY] perf-gate count=<n> totalMs=<n> threshold=60000 result=PASS`, `[REPLAY] shadowWriteGuard relayStateMutations=0 result=PASS`, `[REFUSAL] reason=REPLAY_DIVERGENCE ...` (on divergence)
- **Key Features**:
  - Sheet-level replay from cell commits with SHA-256 comparison
  - Module-level replay: fact ingest → match rebuild → summary → KPI → packets → ledger → golden compare
  - Shadow workspace only (no mutation of relayState.tree)
  - BaselineHashes pattern for divergence detection (capture → mutate → compare)
  - Divergence scar: REPLAY_DIVERGENCE timebox event with unique ID (replay.<moduleId>.<from>-<to>.<sha16>.<sha16>)
  - Partial range: commitIndex-based filtering; unmapped sheet commits excluded with log
  - Performance gate: 10k rows < 60s with per-phase timing
  - Deterministic: two consecutive replays produce identical hashes
  - Non-interference: clean replay does not alter golden hashes
- **Tightenings Applied**: (1) unmapped exclusion rule, (2) shadow write guard, (3) mutation revert before non-interference, (4) unique scar event IDs
- **Contract Compliance**: SHA-256 for all comparisons; FNV-1a unchanged; no auto-HOLD; shadow workspace enforced; no new persistence; no rendering changes.
- **Files Changed**: `core/models/replay/replay-engine.js` (NEW), `relay-cesium-world.html`, `app/ui/hud-manager.js`, `scripts/e3-replay-1-proof.mjs` (NEW)
- **Regressions**: HEADLESS-0 8/8 PASS, CAM0.4.2 12/12 PASS, PRESENCE-STREAM-1 7/7 PASS

### E1-CRYPTO-1 — Cryptographic Integrity Layer (Implemented)
- **Status**: COMMIT/PASS
- **Purpose**: Hash chain over commits + sheet commits, Merkle tree over timebox events, inclusion proofs, tamper detection, replay pre-check
- **Trigger**: Auto-initialized at boot; verify via `relayVerifyChainIntegrity()`; inclusion proofs via `relayGetInclusionProof()`
- **Key Logs**: `[CRYPTO] chainStamp`, `[CRYPTO] verify`, `[CRYPTO] inclusionProof`, `[CRYPTO] replayPreCheck`
- **Proof Script**: `scripts/e1-crypto-1-proof.mjs` (9 stages)
- **Key Features**:
  - Global commit chain: SHA-256 `prevHash` linking from GENESIS
  - Per-sheet commit chains: `prevSheetHash` + `globalCommitIndex` anchor
  - Per-timebox Merkle tree + rolling Merkle root across timeboxes
  - Inclusion proofs: union type (commits → chain only; timebox events → merkle+rolling)
  - Tamper detection: `relayVerifyChainIntegrity()` read-only by default; `emitScar:true` opt-in
  - Replay pre-check: blocks replay on chain integrity failure (zero side effects)
  - Derived chain maps only: never mutates historical receipt objects
  - HUD Tier 2: Integrity status line
- **Locked Decisions**: hash chain scope(c), Merkle granularity(b), evidence upgrade(a), inclusion format(b), verify trigger(b)
- **Tightenings Applied**: (1) verify read-only, (2) union inclusion proof, (3) rolling root by timeboxId, (4) derived stamping, (5) replay pre-check refuses cleanly
- **Files Changed**: `core/models/crypto/hash-chain.js` (NEW), `core/models/crypto/merkle-tree.js` (NEW), `core/models/crypto/integrity-verifier.js` (NEW), `relay-cesium-world.html`, `app/ui/hud-manager.js`, `scripts/e1-crypto-1-proof.mjs` (NEW)
- **Regressions**: E3-REPLAY-1 9/9 PASS, HEADLESS-0 8/8 PASS, CAM0.4.2 12/12 PASS, PRESENCE-STREAM-1 7/7 PASS, PRESENCE-RENDER-1 10/10 PASS, PRESENCE-COMMIT-BOUNDARY-1 9/9 PASS

### VIS-GRAMMAR-POLISH-1 — Visual Grammar Overlap Resolution (Implemented)

- **Status**: COMMIT/PASS
- **Purpose**: Megasheet overlap resolution + scaffold legibility pass
- **Trigger**: Auto-applied when megasheet layout computes (M key)
- **Key Logs**: `[MEGA] layout overlaps=0`, `[VIS-GRAMMAR] scaffold spacing`, `[VIS-SCAFFOLD] mode=TREE_SCAFFOLD`
- **Proof Scripts**: `scripts/vis-tree-scaffold-proof.mjs` (7/7 PASS), `scripts/vis-megasheet-proof.mjs` (6/6 PASS), `scripts/vis-grammar-polish-1-proof.mjs` (6 stages)
- **Key Features**:
  - Megasheet inter-ring spacing increased (1.8x) to prevent initial tile overlap
  - Radial push-apart collision resolver (30 iterations, early-exit on convergence)
  - Achieves **overlaps=0** within 500m radius for 39 tiles (radiusM=305)
  - Scaffold/megasheet proofs pass (7/7, 6/6 green)
- **Locked Decisions**: minGapM=15, tileSize=20, maxRadiusM=500, ring-based placement, radial push resolution
- **Files Changed**: `relay-cesium-world.html` (megasheet layout), `scripts/vis-grammar-polish-1-proof.mjs` (NEW)
- **Regressions**: All prior proofs PASS (scaffold, megasheet, CAM0.4.2, presence, headless, replay, crypto)

### FILAMENT-LIFELINE-1 — Ambient End-to-End Lifelines (Implemented)

- **Status**: COMMIT/PASS
- **Purpose**: Add explicit ambient filament lifeline primitive (cell -> timebox slab(s) -> spine -> branch endpoint -> trunk absorption) for legible end-to-end flow.
- **Visibility Contract**: `TREE_SCAFFOLD` + `SHEET/CELL` only (budget-gated by `sheetsDetailed > 0` and `expandedSheetsAllowed=true`); never in `LAUNCH_CANOPY` collapsed company mode or `MEGASHEET`.
- **Key Logs**: `[FILAMENT-LIFELINE] eligible=true ...`, `[FILAMENT-LIFELINE] built count=<n> ...`, `[FILAMENT-LIFELINE-PROOF] gate-summary result=PASS stages=6/6`
- **Proof Script**: `scripts/filament-lifeline-1-proof.mjs` (6/6 PASS)
- **Artifacts**:
  - `archive/proofs/filament-lifeline-1-console-2026-02-16.log`
  - `archive/proofs/filament-lifeline-1-2026-02-16/01-scaffold-sheet.png`
  - `archive/proofs/filament-lifeline-1-2026-02-16/02-lifeline-closeup.png`
  - `archive/proofs/filament-lifeline-1-2026-02-16/03-lifeline-style.png`
- **Files Changed**: `app/renderers/filament-renderer.js`, `scripts/filament-lifeline-1-proof.mjs` (NEW), process/proof docs
- **Regressions**: VIS-TREE-SCAFFOLD 7/7 PASS, VIS-MEGASHEET 6/6 PASS

### VIS-LAUNCH-TREE-READABILITY-1 — Launch First-Glance Tree Readability (Implemented)

- **Status**: COMMIT/PASS
- **Purpose**: Improve `LAUNCH_CANOPY` first impression so company overview reads as tree silhouette (trunk-dominant, limb-simplified, leaf-like stubs) without touching scaffold/megasheet/lifeline contracts.
- **Key Logs**:
  - `[LAUNCH-FIX] visualHierarchy applied=PASS tilesAlpha=0.018 trunkCore=0.96 branchAlpha=0.18`
  - `[VIS-LAUNCH] ringContainment mode=collapsed action=suppressNonFocused result=PASS`
  - `[DOCK] assistBlocked policy=launch ... status="Dock assist blocked by launch policy"`
  - `[VIS-LAUNCH-PROOF] gate-summary result=PASS stages=3/3`
- **Proof Script**: `scripts/vis-launch-tree-readability-1-proof.mjs` (3/3 PASS)
- **Artifacts**:
  - `archive/proofs/vis-launch-tree-readability-1-console-2026-02-16.log`
  - `archive/proofs/vis-launch-tree-readability-1-2026-02-16/01-launch-company-before.png`
  - `archive/proofs/vis-launch-tree-readability-1-2026-02-16/02-launch-company-after.png`
  - `archive/proofs/vis-launch-tree-readability-1-2026-02-16/03-scaffold-unchanged.png`
- **Files Changed**: `app/renderers/filament-renderer.js`, `relay-cesium-world.html`, `scripts/vis-launch-tree-readability-1-proof.mjs`, process/proof docs
- **Regressions**: scaffold toggle remains intact (`TREE_SCAFFOLD` mode entry verified in proof stage 3)

### V93 Migration Bridge Bundle — Data + Seed + Aggregation Salvage (Implemented)

- **Status**: COMMIT/PASS (2026-02-17)
- **Purpose**: Integrate salvage path from v93 donor voting/globe mechanics into Relay-native world profile without importing legacy runtime architecture.
- **Slices**:
  - `V93-DATA-SALVAGE-1` — adapter/parity bridge (`scripts/v93-to-relay-state-adapter.mjs`, `scripts/v93-data-salvage-1-proof.mjs`)
  - `V93-TRUNK-SEED-BRIDGE-1` — vote-seed merge into canonical world trunk sync + boundary rejection path (`scripts/v93-trunk-seed-bridge-1-proof.mjs`)
  - `V93-VOTE-AGG-BRIDGE-1` — topic/candidate aggregates mapped into trunk metadata (`scripts/v93-vote-agg-bridge-1-proof.mjs`)
- **Proof Artifacts**:
  - `archive/proofs/v93-data-salvage-1-2026-02-17/proof.log`
  - `archive/proofs/v93-trunk-seed-bridge-1-2026-02-17/proof.log`
  - `archive/proofs/v93-vote-agg-bridge-1-2026-02-17/proof.log`
- **Key Logs**:
  - `[V93-SALVAGE] adapter ...`
  - `[V93-BRIDGE] seedValidation ...`
  - `[V93-BRIDGE] trunkSeedSync ...`
  - `[V93-AGG] topicAgg ...`
  - `[V93-AGG] trunkMetaApplied ...`
- **Files Changed**:
  - `relay-cesium-world.html`
  - `scripts/v93-to-relay-state-adapter.mjs`
  - `scripts/v93-data-salvage-1-proof.mjs`
  - `scripts/v93-trunk-seed-bridge-1-proof.mjs`
  - `scripts/v93-vote-agg-bridge-1-proof.mjs`
  - `docs/restoration/V93-DATA-SALVAGE-1-SPEC.md`
  - `docs/restoration/V93-TRUNK-SEED-BRIDGE-1-SPEC.md`
  - `docs/restoration/V93-VOTE-AGG-BRIDGE-1-SPEC.md`

---

## Cleanup Boundary

Active planning docs live under `docs/architecture/`, `docs/restoration/`, and `docs/process/`.  
Historical plans remain under `archive/` and are not canonical for execution ordering.
