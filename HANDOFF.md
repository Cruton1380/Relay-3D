# Relay — Handoff

## Current State

**Clean foundation.** The repository was stripped to essentials on 2026-02-19. All prior code, proof scripts, and archives are preserved in git history under tag `RELAY-PRE-CLEAN-ARCHIVE-V93`.

## What Exists Now

- **Master Plan**: `docs/architecture/RELAY-MASTER-BUILD-PLAN.md` — 182 frozen contracts, ~12,500 lines, 76 top-level sections (§0–§76, plus §5b, §49b, §49c). The complete system specification covering truth, interaction, game layer, accessibility, safety, development, compliance, storage, continuity, governance, onboarding, civic response, weather, and civilization template modules. Now includes Table of Contents and Glossary for non-technical readers. Key recent additions: §76 (Civilization Template Library — 14 seed domain templates: Person, Family, Property, Healthcare, Agriculture, Infrastructure, Commerce, Estate/Death, Emergency, Utilities, Finance, Culture, Sports, Marriage/Partnership; contracts #181-182). §75 (Physical Weather Layer — deterministic 3D meteorological rendering from Relay-registered sensors, separate from branch weather, with LOD-based radar-to-cloud visualization, two-layer visual distinction, forecasts as projections, game layer bridge; contract #180). §74 (Traffic & Civic Response Module — CivicAlertPacket schema, CivicAccessCredit abuse-resistant staking, deterministic dispatch physics, live traffic flow via pressure aggregation, cascading emergency priority, degraded civic mode for disasters, resource registry integration; contracts #178-179). §73 (Universal Onboarding — three pillars: live globe exploration, drag-to-tree file mapping, community-governed tutorial master list; contract #177). §72 (Layered Option Governance — two-stage meta-voting where community votes on what options should exist before voting on which option wins; escalating scrutiny by impact scope; recursive but bounded by frozen contracts; contract #176). §71 (Architectural Clarifications — cleaned from audit language, 20 binding decisions on cross-cutting concerns; contracts #167-175). §8.6 (Contextual Presence Profiles; contract #166). §68 (Arena Branches — bounded volatility sandbox with crowd-driven terrain voting, ArenaContributionPacket schema, MTG-style LIFO stack resolution protocol, ArenaCoeffSet volatility structure, crowd terrain voting as irreducible human randomness engine with pre-match and mid-match phases, 30+ votable metrics for duels and 25+ for court cases covering scoring weights/tempo/complexity/visibility/evidence standards/procedural parameters/consequence parameters/credibility, camera-skill training metrics with Edge of Tomorrow loop, ArenaRep conversion math with anti-farm caps, singleplayer/multiplayer/free arena/tournament/court case modes, progression tiers from Novice to Architect, constitutional boundary separating arena from governance; contracts #161-163). §69 (Boundary Editing & Geographic Border Governance — DRAFT/HOLD/PROPOSE/VOTE/COMMIT state machine, hierarchical voting one level up, manual + algorithmic geometry modification, multi-resolution streaming 110m/50m/10m, disputed boundary sortition, boundary containment for vote scoping; contract #164). §70 (V93 Retained Systems Integration Index — maps all 30+ v93 subsystems to Master Plan locations: democratic messaging as filament physics, trust burn cascade on invite chains, biometric password dance, vote token two-phase economy with decay, onboarding with temporal mixing, regional elections with multi-sig treasury, P2P/DHT networking, Signal Protocol Double Ratchet; contract #165). §68.15-68.19 (Arena expansions — community-governed monster difficulty voting with global floor/ceiling bounds, skill-based barter marketplace with contextual pricing and resource quotas, crowd faction registration with visible loyalty tracking and capped collective influence, attention-based micro-rewards with Visual Bursts and dopamine-loop small EC deposits for social performers, terrain mode selection (agreed/crowd-random/preset) with 10 preset templates inspired by best-of-all-games, 6 combat classes with per-match loadout tradeoffs; contract #163). §58.12 (Certification & Credentialing — Relay as third-party verification platform, community-governed requirement sets, teacher score snapshot at grading, knowledge/position/responsibility growth; contract #153). §62 (Universal Accessibility — four interaction layers, semantic tree, sonification, motor-impaired access, color-blind modes, WCAG 2.2 AA; contract #154). §63 (Child Safety & Parental Governance — age bracket verification, grooming prevention, content gating, COPPA/KOSA/DSA/AADC compliance, graduated autonomy; contract #155). §64 (Voice-Driven Development — every user is a developer, voice-to-ticket pipeline, iterative SCV design sessions, no developer class; contract #156). §65 (Platform Compliance — cryptographic erasure for GDPR, CSAM detection, terrorism pipeline, intermediary liability; contract #157). §66 (Microsharding & Storage Economy — AES-256-GCM + Reed-Solomon + Shamir, proof-of-storage, guardian vaults, marketplace, offline-first; contracts #158-159). §67 (Automated BCP/DRP — tree physics triggers, automated response actions, cascading plans, zero RPO; contract #160). Prior: §61 (Privacy Sovereignty & Civic Enforcement — absolute private/public boundary, evidence admissibility rule, crowdsourced civic observation with CivicObservationFilament schema, enforcement workers as compensated structured work with governed minimum wage, deterrent geometry, privacy rules for duels and sortition cases; contracts #150-152). §60 (Fractal Branching — any branch can host child trees with identical physics, NodeKind/TreePortal schema, FractalSpawnEvent, LOD portal gating, fan-out temporal pattern, relationship to §22 fractal scaling; contract #149). §58.7-58.11 (Education scaling — course template model, teacher method marketplace, student voting with clarity-vs-truth separation, sortition grading pipeline, teacher score and quality decay routing; contracts #147-148). §59 (Media & Content Circulation — single-instance governed copy model, dual-axis equation set for media, viewer presence as branch traversal, Relay Creative License System, derivative fork economics with segment-level provenance, media-specific LOD thresholds, audio/music model, engagement geography; contracts #143-146). §58 (Education — internal adventure, skill path tutorials by role, round-robin teaching optimization, community-curated curricula ranked by student outcomes, contract #142). §38 rewrite (Module Discovery Architecture — replaces rigid "Stage 1/2/3" with open-ended module system; all "Stage Gate:" labels throughout document updated to "Prerequisites:"; contract #141). §57 (Adoption Tiers & Backwards Compatibility — four-tier integration depth; contract #140). §21.2.3-21.2.12 (Ten new template examples). §56 (Language Trees). §55 (Live Confidence Overlay). §54 (Business Process Catalog). §53 (Compartmentalized Accounting). §21.2.2 (Nonwovens Factory). §16.6 (AI Code Governance). Contracts #134-152. Also: §52, §50, §3.5.1, §3.21-3.22, §31.4-31.5, §48.4.3, contracts #115-133, §5b, §48.4.2, §49b, §3.19-3.20, §33.5.
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

The architecture is structurally complete, mechanically audited, and civilization-ready. 182 frozen contracts, ~12,500 lines, 76 top-level sections (§0–§76, plus §5b, §49b, §49c). Includes Table of Contents, Glossary, and plain-English jargon definitions for non-technical readers. Four structural states (canopy, trunk, active roots, heartwood).

**Civilization Coverage (§72-§76, contracts #176-182)**: Layered option governance (meta-voting before substantive voting, escalating scrutiny, recursion floor at frozen contracts). Universal onboarding (live globe, drag-to-tree file mapping, community-governed tutorial master list). Traffic and civic response (CivicAlertPacket, CivicAccessCredit, deterministic dispatch, live traffic flow, degraded civic mode for disasters). Physical weather (3D meteorological rendering from sensors, separate from branch weather, LOD radar-to-cloud, game layer bridge). Civilization template library (14 seed domains: Person, Family, Property, Healthcare, Agriculture, Infrastructure, Commerce, Estate/Death, Emergency, Utilities, Finance, Culture, Sports, Marriage/Partnership).

**Architectural Clarifications (§71, contracts #167-175)**: 20 binding cross-cutting decisions. Privacy operates only on available data. All resources flow everywhere. Unified audience resolution. LATEST_DISPLAY. Jury parameters governance-protected. KMS defined. Closure commits. Entity tree anchors. Per-filament/branch/tree privacy. Credentials as commit record. Arena votes as continuous sliders. Voting always live. LOD inverse-scaling.

**Arena Branches (§68, contracts #161-163)**: Bounded volatility sandbox with crowd-driven terrain voting. ArenaContributionPacket, MTG-style stack resolution, 55+ votable metrics, five match modes. **Certification (§58.12, contract #153)**: Community-governed third-party verification. **Accessibility (§62, contract #154)**: Four interaction layers, WCAG 2.2 AA. **Child Safety (§63, contract #155)**: Age brackets, grooming prevention, COPPA/KOSA/DSA/AADC. **Voice Development (§64, contract #156)**: Every user is a developer. **Compliance (§65, contract #157)**: Cryptographic erasure, CSAM, terrorism pipeline. **Storage (§66, contracts #158-159)**: Microsharding, Shamir, marketplace. **BCP/DRP (§67, contract #160)**: Automated continuity. **Presence Profiles (§8.6, contract #166)**: Contextual identity broadcast. Prior: §61 (#150-152), §60 (#149), §58.7-58.11 (#147-148), §59 (#143-146), §58 (#142), §38 (#141), §57 (#140), §52-§56, §50 (#115-139). The next frontier is implementation and performance stress testing.

## Cesium

CesiumJS 1.113 loaded from CDN. No npm package needed. Ion token required for terrain/imagery.
