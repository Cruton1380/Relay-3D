# Relay — Handoff

## Current State

**Clean foundation.** The repository was stripped to essentials on 2026-02-19. All prior code, proof scripts, and archives are preserved in git history under tag `RELAY-PRE-CLEAN-ARCHIVE-V93`.

## What Exists Now

- **Master Plan**: `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` — 136 frozen contracts, ~6,800 lines. The complete system specification from Stage 0 through Stage 3. Key recent additions: §52 (Business Artifact Mapping — org hierarchy, budget, tactical/strategic, meetings, mass balance, dashboards), §21.2.1 (Manufacturing Operations template with magnitudeType + conservation gate), contracts #134-136 (#134: camera is sovereign, #135: panel lock only flight suppression, #136: mass balance is conservation law). Also: §50 (Camera Controller), §3.5.1 (Angular Disambiguation), §3.21-3.22 (Content-Type Temporal/Cross-Section Mapping), §31.4-31.5 (Settlement Timebox Rule, External Hash Rot), §48.4.3 (Replay Compression), contracts #126-133, §5b (Scheduling), contracts #124-125, §48.4.2 (Storage Growth Model), §49b (Real-World Integration + Degradation), contracts #120-123, §3.19-3.20 (universal equations + orbital model), §33.5 (Laniakea LOD), contracts #115-119.
- **Globe boundary data**: `data/boundaries/` — 375 GeoJSON files (countries, provinces, cities) for rendering real Earth boundaries.
- **Dev server**: `scripts/dev-server.mjs` — Minimal static HTTP server on port 3000.
- **Entry point**: `index.html` — The Relay globe with first tree.

### Implemented Build Slices

| Slice | Status | Files |
|-------|--------|-------|
| **Globe (Stage 0)** | DONE | `app/globe.js`, `index.html` |
| **BARK-CYLINDER-1** | DONE | `app/tree.js`, `app/renderers/cylinder-renderer.js` |
| **FILAMENT-ROW-1** | DONE | `app/models/filament.js`, `app/renderers/filament-renderer.js` |
| **GRAVITY-SINK-1** | DONE | `app/models/filament.js` (sinking modes), `app/renderers/filament-renderer.js` (CallbackProperty) |
| **TREE-RING-1** | DONE | `app/renderers/cylinder-renderer.js` (radial lifecycle zone shader) |
| **HELIX-1** | DONE | `app/models/filament.js` (helix periods), `app/renderers/cylinder-renderer.js` (spiral grain shader) |
| **SLAB-REVISION-1** | DONE | `app/models/timebox.js`, `app/renderers/slab-renderer.js` |
| **TWIG-1** | DONE | `app/models/filament.js` (twigness), `app/renderers/filament-renderer.js` (twig spikes) |
| **WILT-1** | DONE | `app/models/timebox.js` (droop zones), `app/renderers/slab-renderer.js` (droop arcs) |
| **CONFIDENCE-1** | DONE | `app/models/filament.js` (dual confidence: orgConfidence + globalConfidence) |
| **SCAR-1** | DONE | `app/models/filament.js` (createScar), `app/renderers/filament-renderer.js` (red marks) |

### Key Implementation Files

- `app/globe.js` — Cesium viewer, boundaries, always-spinning globe, geostationary support, camera controller init
- `app/tree.js` — Tree creation, branch layout, filament wiring, LOD gating
- `app/models/filament.js` — Filament data model (six universal domains, lifecycle, stable IDs)
- `app/renderers/cylinder-renderer.js` — Trunk/branch cylinders, bark shells, flat panels, LOD
- `app/renderers/filament-renderer.js` — Batched Primitive ribbon renderer (dots at TREE LOD, bark ribbons at BRANCH LOD)
- `app/models/timebox.js` — Timebox slab aggregation (thickness, magnitude, confidence, wilt)
- `app/renderers/slab-renderer.js` — Timebox disc rendering at branch cross-sections
- `app/controls/camera-controller.js` — Unified camera controller (ORBIT/FPS/RTS modes, buoyancy, basin resistance, geostationary, favorites, position stack, HUD)

### Filament Ribbon Renderer (FILAMENT-RIBBON-1)

The filament renderer uses batched `Cesium.Primitive` (one per branch, NOT individual entities) for ribbons. Each filament is a quad strip on the cylindrical bark surface with `(lHead, lTail, theta, r)` extent computed from the filament model. Dots use `Cesium.Entity` points with `CallbackProperty` for live sinking. Twigs use short Entity polylines (few per branch). Ribbons rebuild on `relayAdvanceDays(n)`. Debug controls: `relayForceLOD("BRANCH")` to force ribbon view, `relayAdvanceDays(7)` to advance sim time.

## What Was Removed

Everything that accumulated during V93 development: 27 app modules, 20 core models, 123 proof scripts, 2,039 archive files, legacy React/Three.js/deck.gl dependencies, 18,000-line monolith HTML. All recoverable via `git checkout RELAY-PRE-CLEAN-ARCHIVE-V93 -- <path>`.

## Build Order (Tier 1 — Core Geometry)

| # | Slice | Status | Next Depends On |
|---|-------|--------|-----------------|
| 1 | BARK-CYLINDER-1 | DONE | — |
| 2 | FILAMENT-ROW-1 | DONE | BARK-CYLINDER-1 |
| 3 | GRAVITY-SINK-1 | DONE | FILAMENT-ROW-1 |
| 4 | TREE-RING-1 | DONE | BARK-CYLINDER-1 |
| 5 | HELIX-1 | DONE | BARK-CYLINDER-1 |
| 6 | SLAB-REVISION-1 | DONE | TREE-RING-1 |

**Tier 1 — Core Geometry: COMPLETE.**

## Build Order (Tier 2 — Emergent Physics)

| # | Slice | Status | Depends On |
|---|-------|--------|------------|
| 7 | TWIG-1 | DONE | GRAVITY-SINK-1, TREE-RING-1 |
| 8 | WILT-1 | DONE | SLAB-REVISION-1 |
| 9 | CONFIDENCE-1 | DONE | SLAB-REVISION-1, FILAMENT-ROW-1 |
| 10 | SCAR-1 | DONE | FILAMENT-ROW-1 |

**Tier 2 — Emergent Physics: COMPLETE.**

## Build Order (Tier 3 — Analysis and Projection)

| # | Slice | Status | Depends On |
|---|-------|--------|------------|
| 11 | PROJECTION-1 | **NEXT** | BARK-CYLINDER-1, FILAMENT-ROW-1 |
| 12 | ATTRIBUTE-BIND-1 | pending | SLAB-REVISION-1, HELIX-1 |
| 13 | TIME-SCRUB-1 | pending | GRAVITY-SINK-1 |
| 14 | CONSOLIDATION-1 | pending | GRAVITY-SINK-1, CONFIDENCE-1 |
| 14b | CROSS-SECTION-1 | pending | SLAB-REVISION-1, TREE-RING-1, SCAR-1 |
| 14c | ORGANIC-RENDER-1 | pending | CROSS-SECTION-1 |
| 14d | WIND-1 | pending | SLAB-REVISION-1, TREE-RING-1 |
| 14e | WEATHER-1 | pending | WIND-1, CONFIDENCE-1 |
| 14f | SCHEDULE-1 | pending | FILAMENT-ROW-1, SLAB-REVISION-1 |
| 14g | CAMERA-CTRL-1 | DONE | Globe (Stage 0) |

**Next action**: Implement PROJECTION-1 — projection branches (light blue), input funnel, decision nodes, alignment zone, Excel terminus (§6).

### Unified Camera Controller (CAMERA-CTRL-1) — LOCKED

Replaced `fly-controls.js` + `wasd-fly.js` with single `app/controls/camera-controller.js`. Frozen contracts #134-135 (§50).

- **6DOF FPS flight** (space sim style): WASD fly/strafe, Q/E roll, Space/C ascend/descend, Shift boost, mouse pitch/yaw, scroll speed. No auto-leveling, no auto-correction. Camera is sovereign.
- **Three modes**: ORBIT (Cesium default), FPS (full manual 6DOF), RTS (top-down edge-scroll). Tab cycles.
- **Underground flight**: FPS has no altitude floor. Globe hides below surface. Scene tints amber→red with depth. Geological layer label (TOPSOIL → DEEP MANTLE). NaN recovery via last-good camera snapshot.
- **Geostationary toggle**: H key. Globe rotation ORBIT-only. Geostationary auto-enabled on FPS enter.
- **Basin boundary resistance**: Seven altitude bands (SPACE → CELL). Speed dampening + vignette on crossing.
- **Favorites**: Ctrl+0-9 save, Ctrl+Shift+0-9 recall. Position stack via backquote.
- **HUD**: Bottom-center frosted glass panel (mode badge + altitude/basin + search bar). Keybind hints below. Suggestion toasts above. Underground overlay with depth label.
- **Pointer event isolation**: All pointer events blocked from Cesium in FPS/RTS. setPointerCapture errors eliminated.
- **Keybind rebinding** (planned): All binds stored in a map, user-configurable, with presets. Panel lock mode for 2D interactions (§50.4).
- **Reserved keys**: R, T, 1-9 (no Ctrl) for future interactions.
- Old files `fly-controls.js` and `wasd-fly.js` deleted.

### Scheduling Engine (§5b)

The branch tip IS the calendar. Scheduled events are filaments at future l positions — translucent, physically inert (zero weight in all force equations), anchored at their future time slot. When scheduled time arrives, `SCHEDULED→OPEN` transition fires automatically, the filament solidifies, and gravity/physics engage. Notifications are not a separate system — they are the filament arriving at the present. Meetings, venues, recurring events, and large multi-day events all use this same mechanic. Cancellation is append-only (scar-like commit). Frozen contracts #124-125.

### Business Artifact Mapping (§52) — Frozen Contract #136

Org charts, budget slides, tactical bullet lists, meeting agendas, and mass balance dashboards all map to existing tree measurements. No new physics required. Added §52 to master plan with six canonical mappings:

- **Org hierarchy** = branch nesting geometry. Branch depth = reporting depth. Thickness = activity volume, not headcount.
- **Budget allocation** = magnitude mass per branch. Branch thickness = `Σ magnitude`. Ring thickness = periodic spend. Lean = supplier concentration.
- **Tactical/strategic items** = filament lifecycle states. OPEN/ACTIVE = tactical. SCHEDULED/projection = strategic. HOLD = deprioritized (wilting).
- **Meeting cadence** = timebox cross-section inspection. Monthly = one-month ring on regional branches. Quarterly = quarter ring on all primaries. Agenda = twig list + heat map.
- **Mass balance** = conservation law on branch (contract #136). `inputSum - (outputSum + wasteSum - recycledSum) ≈ 0`. Deviation → ring color shift. Cumulative imbalance → branch lean. Per-timebox, deterministic, replayable.
- **Dashboards** = projection branches (light blue). Filters are client-side view masks. Values trace to source filaments in one click.

Manufacturing operations template (`template.manufacturing.operations.v1`) added to §21.2.1 with `magnitudeType` field (input/output/waste/recycled/byproduct), conservation consolidation gate (2% tolerance), sensor + document evidence rules.

### Canonical Reference: The Tree Photo

The real tree cross-section photo (bark + concentric rings + radial crack + compressed core) is the mechanical blueprint for Relay's rendering model. Every ring = a timebox slab. Every crack = a scar. The bark = the active surface. The dense core = compressed archive. The grain = commit causality. §3.13 and §3.14 formalize this mapping.

### Wind & Weather Physics

Branches move for exactly three reasons: lean (counterparty pressure direction, §3.15), droop (slab wilt, §3.7), and twist (helix period, §3.5). No other motion exists. Wind is not a separate overlay — it is the pattern of branch lean observed during time replay. Weather overlays (heat tiles, fog haze, storm flicker, lightning cascades, §3.16) are deterministic computations from TimeboxAggregate fields cached at timebox close. All lean is explainable to one click. The 10x scale discipline rules (§3.17) define LOD shed order and prevent visual noise at scale.

### Branch Layout (§3.18)

Branch direction (where it points from the trunk) comes from stable `layoutKey` hashing — never from live data, counterparties, or wind. Multi-layer ring shells prevent overlap. Collision-aware deterministic routing handles dense trees. LOD bundle merge collapses 100+ branches into category bundles at TREE LOD. Directory trees use semantic bins (Documents/Media/Projects/Archive/System/Other). Frozen contract #114: layout from identity only.

### Universal Physics Engine (§3.19, §3.20, §33.5)

Ten scale-invariant force equations govern everything from file to Laniakea: radial position (lifecycle), gravity sink (time), lean vector (directional pressure), wilt (integrity deficit), heat (rate of change), fog (uncertainty), storm (danger), lightning (cascade), trunk mass (archive), and scaling law (aggregation). The orbital model (§3.20) maps branches as orbital bodies where perturbations (lean, droop, thickness change) carry meaning. Laniakea LOD (§33.5) defines 11 rendering levels from CELL to LANIAKEA — same equations, different aggregation depth. Frozen contracts #115-117: equations are universal, scaling is aggregation only, no physics above source.

### Angular Disambiguation (§3.5.1)

Six distinct rotational/angular concepts exist and must never be conflated: (1) filament θ (counterparty on bark), (2) branch layoutAngle (identity hash), (3) helix twist (time grain), (4) branch lean (directional pressure), (5) globe rotation (time itself), (6) camera reorientation (UI only). §23.1 wind definition was corrected to align with §3.15 (wind = observed lean during replay, not a computed vector). Equations 1 and 3 updated with SCHEDULED state (r=1.0 bark, stateWeight=0.0 inert).

### Content-Type Temporal Mapping (§3.21, §3.22)

Non-tabular content (documents, code, media, spatial/CAD) requires two independent time axes: `l_content` (position within the content) and `l_time` (calendar time). Gravity always uses calendar-time (universal constant). Only the `primaryAxis` (what l means at CELL LOD) and `inwardTrigger` vary per template. Cross-section rings mean different things per content type: time periods for tabular, edit sessions for documents, versions for code, production sessions for media. Drill-down from ring to content adapts per type. Contract #128: gravity always uses calendar-time.

### Settlement & Evidence Integrity (§31.4, §31.5)

Timebox assignment is always by `spawnAt`, never external `settlementAt`. Settlement confirmation is a commit on the existing filament — it does not change timebox membership. External evidence hashes are Merkle-anchored and immutable; URL expiry does not reduce confidence. Templates define `evidenceArchivePolicy` (CACHE_LOCAL, HASH_ONLY, CACHE_AND_HASH). Contracts #126-127.

### Replay Compression (§48.4.3)

Five-layer strategy for exabyte-scale deterministic replay: (1) per-filament terminal compression (hot/warm/cold levels), (2) per-timebox summary compression (aggregates always full fidelity), (3) cross-timebox delta encoding (~60-80% savings), (4) Merkle checkpoint compaction (every N commits), (5) regional federation sharding. Compression is tree physics applied to itself (Contract #130). Compression never reduces verifiability — every level retains Merkle proofs. Target: current timebox <16ms, 10-year cross-section <5s, full filament drill-down <10s. Contract #129.

### Root System & Heartwood (§1.3)

The root system is the underground mirror of the canopy — alive, governed by the same ten equations, with root lean (retrieval direction), root heat (audit surge), root fog (integrity deficit), root wilt (checkpoint failures). Root growth is semi-proportional to canopy activity. Roots are DIAGNOSTIC ONLY — they never affect canopy physics, lifecycle, governance, or availability (Contract #132). Heartwood is the terminal stillness state: data at compression Level 2, age > threshold, integrity 1.0, negligible retrieval, all checkpoints sealed. Heartwood contributes zero to all equations — just structural mass. Re-expansion only under integrity anomaly, legal demand, or evidence cascade (Contract #133). Heartwood prevents root compute from scaling with total archive size.

### Architecture Status: CLOSED

The architecture is structurally complete. 136 frozen contracts. Four structural states (canopy, trunk, active roots, heartwood). Business artifact mapping formalized (§52). Manufacturing operations template defined (§21.2.1). No remaining conceptual leaks. The system is now computationally fragile, not philosophically fragile. Do not add more theory. The next frontier is implementation and performance stress testing.

## Cesium

CesiumJS 1.113 loaded from CDN. No npm package needed. Ion token required for terrain/imagery.
