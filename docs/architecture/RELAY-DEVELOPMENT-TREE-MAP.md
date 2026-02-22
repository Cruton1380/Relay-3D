# Relay Development Tree Map

> *"You can't see it until you've seen it."* — Eitan Asulin

This document defines three views of the same system:

1. **2D View** — What Relay looks like as files in Cursor right now
2. **3D View** — What Relay looks like as a tree with branches and filaments inside Relay itself
3. **Direct Mapping** — The exact correspondence between every 2D file and its 3D filament address

When Relay goes live, this mapping executes. Every file in this repository becomes a filament. Every folder becomes a branch. Every git commit becomes a ring. The development history sinks into the roots and becomes the heartwood of Tree Zero (`tree.org.relay-hq`). See §80 (Genesis Record) for the full initiation sequence.

---

## 1. The 2D System — What Cursor Sees

```
Relay/
│
├── index.html                          ← Entry point. The first page.
├── package.json                        ← Dependency manifest
├── AGENTS.md                           ← AI agent instructions
├── HANDOFF.md                          ← Session continuity document
├── README.md                           ← Project overview
├── LICENSE                             ← Legal terms
├── .env                                ← Environment secrets (never committed to tree)
├── .gitignore                          ← Git exclusion rules
├── .gitattributes                      ← Git file handling rules
│
├── app/                                ← APPLICATION CODE (the living bark)
│   ├── globe.js                        ← Cesium viewer, boundary rendering, init
│   ├── tree.js                         ← Tree creation, branch layout, filament wiring
│   │
│   ├── models/                         ← DATA SHAPES (filament DNA)
│   │   ├── filament.js                 ← Filament schema, lifecycle, ID generation
│   │   └── timebox.js                  ← Timebox slab aggregation
│   │
│   ├── renderers/                      ← VISUAL OUTPUT (what you see)
│   │   ├── cylinder-renderer.js        ← Trunk/branch cylinders, bark, LOD
│   │   ├── filament-renderer.js        ← Ribbons, dots, twigs
│   │   └── slab-renderer.js            ← Timebox disc rendering
│   │
│   ├── controls/                       ← USER INPUT (how you move)
│   │   └── camera-controller.js        ← ORBIT/FPS/RTS, basin resistance, HUD
│   │
│   ├── core/                           ← ENGINE LAYER (Tier 3 — pending)
│   │   └── README.md                   ← Event bus, ID generator, commit log, state
│   │
│   ├── physics/                        ← FORCE EQUATIONS (Tier 3 — pending)
│   │   └── README.md                   ← 10 universal equations, lean, wilt, heat, fog
│   │
│   ├── templates/                      ← TEMPLATE RUNTIME (Tier 3 — pending)
│   │   └── README.md                   ← Loader, validator, schema runtime
│   │
│   ├── store/                          ← PERSISTENCE (Tier 3 — pending)
│   │   └── README.md                   ← IndexedDB, Merkle chain, commit log
│   │
│   ├── packets/                        ← ACCOUNTING PACKETS (Tier 3 — pending)
│   │   └── README.md                   ← Transfer, responsibility, evidence packets
│   │
│   ├── governance/                     ← VOTING & PARAMETERS (Tier 3 — pending)
│   │   └── README.md                   ← Weighted median, sortition, meta-voting
│   │
│   └── ui/                             ← INTERFACE COMPONENTS (Tier 3 — pending)
│       └── README.md                   ← HUD, panels, dialogs, overlays
│
├── config/                             ← CONFIGURATION
│   └── templates/                      ← Domain templates (TreeTemplate JSON)
│       ├── template.health.v1.json     ← Healthcare tree template
│       └── template.property.v1.json   ← Property tree template
│
├── data/                               ← STATIC DATA
│   └── boundaries/                     ← 375 GeoJSON files (countries, provinces, cities)
│
├── docs/                               ← DOCUMENTATION
│   ├── architecture/                   ← System specification
│   │   ├── RELAY-MASTER-BUILD-PLAN.md  ← THE PLAN (~21,000+ lines, 336 contracts)
│   │   ├── RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md  ← Companion: 13 civilization pillars
│   │   └── RELAY-DEVELOPMENT-TREE-MAP.md           ← THIS FILE
│   │
│   └── blueprints/                     ← ASCII art diagrams
│       ├── 00-INDEX.md                 ← Blueprint index
│       ├── 01-globe-and-trees.txt      ← World view
│       ├── 02-tree-anatomy.txt         ← Single tree deep-dive
│       ├── 03-branch-cross-section.txt ← Ring view
│       ├── 04-filament-lifecycle.txt   ← Birth to archive
│       ├── 05-pressure-and-forces.txt  ← The four forces
│       ├── 06-confidence-and-evidence.txt  ← Firm vs foggy
│       ├── 07-governance-stack.txt     ← Voting and sortition
│       └── 08-genesis-tree-zero.txt    ← Birth of Relay
│
├── scripts/                            ← BUILD TOOLS
│   ├── dev-server.mjs                  ← Local dev server (port 3000)
│   └── merge-boundaries.mjs           ← GeoJSON boundary processor
│
└── tests/                              ← VALIDATION
    ├── README.md                       ← Test overview
    └── stress-test.js                  ← Performance stress test
```

**Current state:** Tier 1 (Core Geometry) and Tier 2 (Emergent Physics) complete. Tier 3 directories exist as placeholders with README files. ~3,500 lines of working code rendering a 3D tree on a CesiumJS globe.

---

## 2. The 3D System — What Relay Sees

When the genesis commit fires (§80.2), this same codebase becomes `tree.org.relay-hq` — Tree Zero. Here is what that tree looks like:

```
tree.org.relay-hq
│
├── TRUNK (the Relay organization itself)
│   Height = total commit count across all branches
│   Thickness = total filament mass
│   Lean = development pressure direction
│
├── branch: dev.architecture ─────────── THE PLAN
│   │   Filaments:
│   │   ├── F-MASTER-PLAN (structural, never closes)
│   │   │   └── Each version of RELAY-MASTER-BUILD-PLAN.md = a commit
│   │   │       Inner rings = early drafts (v1, v2...)
│   │   │       Outer bark = current ~21,000+-line version
│   │   │       Scars = sections that were rewritten or corrected
│   │   │       Twigs = TODOs and unresolved references
│   │   │       Confidence = high (heavily reviewed, multi-agent audited)
│   │   │
│   │   ├── F-CIV-TEMPLATE-LIB (structural)
│   │   │   └── RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md commits
│   │   │
│   │   ├── F-DEV-TREE-MAP (structural)
│   │   │   └── THIS FILE's commits
│   │   │
│   │   └── F-BLUEPRINT-* (finite, one per diagram)
│   │       └── Each ASCII art blueprint = a filament
│   │
│   Cross-section of this branch:
│   ├── Inner ring: earliest architecture drafts (heartwood)
│   ├── Middle rings: major revision epochs (v93 era, clean era)
│   └── Outer bark: current living specification
│
├── branch: dev.codebase ─────────────── THE CODE
│   │   Sub-branches (one per directory):
│   │
│   ├── sub-branch: dev.codebase.models
│   │   ├── F-filament.js (structural — defines core data shape)
│   │   └── F-timebox.js (structural — defines aggregation)
│   │
│   ├── sub-branch: dev.codebase.renderers
│   │   ├── F-cylinder-renderer.js (structural)
│   │   ├── F-filament-renderer.js (structural)
│   │   └── F-slab-renderer.js (structural)
│   │
│   ├── sub-branch: dev.codebase.controls
│   │   └── F-camera-controller.js (structural)
│   │
│   ├── sub-branch: dev.codebase.core (empty — placeholder READMEs only)
│   ├── sub-branch: dev.codebase.physics (empty)
│   ├── sub-branch: dev.codebase.templates (empty)
│   ├── sub-branch: dev.codebase.store (empty)
│   ├── sub-branch: dev.codebase.packets (empty)
│   ├── sub-branch: dev.codebase.governance (empty)
│   ├── sub-branch: dev.codebase.ui (empty)
│   │
│   ├── F-globe.js (structural — entry orchestrator)
│   ├── F-tree.js (structural — tree factory)
│   └── F-index.html (structural — the first page)
│   │
│   Each git commit on any file = a filament commit.
│   Git blame history = the commit chain on that filament.
│   Branch thickness = total lines of code (living).
│   Branch lean = which sub-branch has the most recent activity.
│   Wilt = code with failing tests or missing coverage.
│   Fog = code that lacks documentation or evidence.
│
├── branch: dev.conversations ────────── THE DISCUSSIONS
│   │   Every Cursor agent chat session = one filament
│   │   Evidence attachment = full transcript
│   │   Key decisions extracted → linked filaments on dev.decisions
│   │   Conversation count = filament count on this branch
│   │   Thickness = total discussion volume
│   │   Inner rings = earliest v93 conversations (deep roots)
│   │
│   ├── F-session-<uuid> (finite — each conversation)
│   │   ├── Evidence: transcript text
│   │   ├── Evidence: any images/screenshots shared
│   │   └── Links: → F-decision-* on dev.decisions
│   │
│   Cross-section tells you: when was development most active?
│   Thick rings = intense design periods. Thin rings = quiet periods.
│
├── branch: dev.decisions ────────────── THE CHOICES
│   │   Each major architectural decision = one filament
│   │   Links back to the conversation(s) where it was made
│   │   Links forward to the code that implements it
│   │
│   ├── F-decision-append-only (structural — foundational invariant)
│   ├── F-decision-filament-equals-row (structural)
│   ├── F-decision-three-layer-ontology (structural)
│   ├── F-decision-camera-sovereignty (structural)
│   └── ... (one per frozen contract, linking to its source conversation)
│
├── branch: dev.media ────────────────── THE RECORDINGS
│   │   Videos, audio, screen recordings, extracted transcripts
│   │   Each media file = one filament with media as evidence
│   │   Frame-level detail per §59.4 (media L-axis cells)
│   │
│   └── F-media-<hash> (finite — each recording)
│
├── branch: dev.config ───────────────── THE TEMPLATES
│   │   Template JSON files = filaments with schema as body
│   │   Template versions = commits on the filament
│   │
│   ├── F-template-health-v1 (structural — evolves with versions)
│   └── F-template-property-v1 (structural)
│
├── branch: dev.tests ────────────────── THE VALIDATION
│   │   Stress test and proof scripts = filaments
│   │   Test results = evidence on those filaments
│   │   Pass/fail = confidence level
│   │
│   └── F-stress-test.js (finite — each test run is a commit)
│
├── branch: dev.boundaries ───────────── THE GEOGRAPHY
│   │   375 GeoJSON files = filaments (one per boundary)
│   │   Structural — boundaries persist and evolve (§69)
│   │
│   └── F-boundary-<country/region> × 375 (structural)
│
└── branch: gov.parameters ───────────── THE INITIAL STATE
    │   All Category A parameters at their founder-set initial values
    │   Each parameter = one filament
    │   Community votes create new commits on these filaments
    │
    ├── F-param-transaction-commission (structural, initial: 0%)
    ├── F-param-regional-tax (structural, initial: 0%)
    ├── F-param-session-tax (structural, initial: 0%)
    ├── F-param-sleep-cycle-duration (structural, initial: 7h 12m)
    ├── F-param-note-ttl-social (structural, initial: 15 min)
    └── ... (one per Category A parameter in §11.6)
```

**What you see when you look at Tree Zero:**

- The trunk is thick — lots of history, lots of commits.
- `dev.architecture` is the thickest branch — the plan dominates the project.
- `dev.codebase` has many sub-branches, most still thin (Tier 3 placeholders).
- `dev.conversations` has deep rings — years of design discussion sunk into roots.
- `dev.decisions` is firm and well-linked — every decision traces to evidence.
- `gov.parameters` starts clean — all zeros, waiting for community votes.
- The tree leans slightly toward `dev.architecture` — that's where the most mass is.
- Fog is minimal — the plan is heavily documented and cross-referenced.
- Scars exist — sections that were rewritten, bugs that were fixed, imports that broke.

---

## 3. The Direct Mapping — File to Filament

Every file in the repository has an exact address in Tree Zero.

| 2D Path (Cursor) | 3D Address (Relay) | Filament Kind | Branch |
|---|---|---|---|
| `RELAY-MASTER-BUILD-PLAN.md` | `F-dev.architecture.master-plan` | Structural | `dev.architecture` |
| `RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md` | `F-dev.architecture.civ-template-lib` | Structural | `dev.architecture` |
| `RELAY-DEVELOPMENT-TREE-MAP.md` | `F-dev.architecture.dev-tree-map` | Structural | `dev.architecture` |
| `HANDOFF.md` | `F-dev.architecture.handoff` | Structural | `dev.architecture` |
| `index.html` | `F-dev.codebase.index-html` | Structural | `dev.codebase` |
| `app/globe.js` | `F-dev.codebase.globe` | Structural | `dev.codebase` |
| `app/tree.js` | `F-dev.codebase.tree` | Structural | `dev.codebase` |
| `app/models/filament.js` | `F-dev.codebase.models.filament` | Structural | `dev.codebase.models` |
| `app/models/timebox.js` | `F-dev.codebase.models.timebox` | Structural | `dev.codebase.models` |
| `app/renderers/cylinder-renderer.js` | `F-dev.codebase.renderers.cylinder` | Structural | `dev.codebase.renderers` |
| `app/renderers/filament-renderer.js` | `F-dev.codebase.renderers.filament` | Structural | `dev.codebase.renderers` |
| `app/renderers/slab-renderer.js` | `F-dev.codebase.renderers.slab` | Structural | `dev.codebase.renderers` |
| `app/controls/camera-controller.js` | `F-dev.codebase.controls.camera` | Structural | `dev.codebase.controls` |
| `config/templates/template.health.v1.json` | `F-dev.config.template-health-v1` | Structural | `dev.config` |
| `config/templates/template.property.v1.json` | `F-dev.config.template-property-v1` | Structural | `dev.config` |
| `scripts/dev-server.mjs` | `F-dev.codebase.scripts.dev-server` | Structural | `dev.codebase.scripts` |
| `scripts/merge-boundaries.mjs` | `F-dev.codebase.scripts.merge-boundaries` | Structural | `dev.codebase.scripts` |
| `tests/stress-test.js` | `F-dev.tests.stress-test` | Structural | `dev.tests` |
| `docs/blueprints/01-globe-and-trees.txt` | `F-dev.architecture.bp-globe-trees` | Finite | `dev.architecture` |
| `docs/blueprints/02-tree-anatomy.txt` | `F-dev.architecture.bp-tree-anatomy` | Finite | `dev.architecture` |
| `docs/blueprints/03-branch-cross-section.txt` | `F-dev.architecture.bp-cross-section` | Finite | `dev.architecture` |
| `docs/blueprints/04-filament-lifecycle.txt` | `F-dev.architecture.bp-lifecycle` | Finite | `dev.architecture` |
| `docs/blueprints/05-pressure-and-forces.txt` | `F-dev.architecture.bp-pressure` | Finite | `dev.architecture` |
| `docs/blueprints/06-confidence-and-evidence.txt` | `F-dev.architecture.bp-confidence` | Finite | `dev.architecture` |
| `docs/blueprints/07-governance-stack.txt` | `F-dev.architecture.bp-governance` | Finite | `dev.architecture` |
| `docs/blueprints/08-genesis-tree-zero.txt` | `F-dev.architecture.bp-genesis` | Finite | `dev.architecture` |
| `data/boundaries/*.geojson` (×375) | `F-dev.boundaries.<name>` | Structural | `dev.boundaries` |
| Each git commit | Filament commit on the file's filament | — | Same as file |
| Each git tag | Timebox epoch seal / slab boundary | — | All branches |
| Each Cursor conversation | `F-dev.conversations.session-<uuid>` | Finite | `dev.conversations` |
| `.env` | **NOT COMMITTED** — secrets never enter the tree | — | — |

---

## 4. The Evolution Pipeline — One Filament Lineage

The user's insight: object recognition, pet translation, and spell detection are the same pipeline evolving. This is visible on Tree Zero as a single lineage:

```
dev.codebase.controls.camera
    │
    ├── v1: Camera reads frames (basic input)
    │
    ├── v2: Object recognition — camera identifies fire, smoke, rain, objects (§39)
    │       Each recognized object class = a filament commit on dev.codebase
    │       Evidence = training data + classification accuracy
    │
    ├── v3: Personal interaction — camera identifies people, gestures, speech (§39, §47)
    │       Same pipeline, new object classes
    │       Evidence = interaction recordings + validation accuracy
    │
    ├── v4: Pet behavior translation — camera identifies animal behavioral patterns (§17.4)
    │       Same pipeline, trained on animal-specific data
    │       Evidence = documented behavior → voice mapping accuracy
    │
    ├── v5: Environmental detection — camera reads weather, terrain, material properties (§43)
    │       Same pipeline, expanded to physical world phenomena
    │
    └── v6: Spell detection — camera reads gestures + objects + environment as spell triggers (§43)
            Same pipeline at full capability
            Fire detection (v2) + gesture detection (v3) + environmental awareness (v5)
            = "user is holding a candle and drawing a circle" = spell trigger

    ALL OF THIS IS ONE FILAMENT GROWING OVER TIME.
    Inner rings = basic camera. Outer bark = spell detection.
    Cross-section shows the full evolution in rings.
```

---

## 5. What Relay Looks Like Building Itself

When a developer opens this project in Cursor and writes code, here is what happens in 3D:

1. **Developer opens `filament.js`** — their presence marker (§17.3) appears on branch `dev.codebase.models`, hovering near the `F-filament.js` filament. Other developers on the same branch see them.

2. **Developer edits a function** — the edit is a draft (LeafPacket, §82). It sits on the bark surface as a bud. Not yet committed.

3. **Developer runs `git commit`** — the leaf promotes to a filament commit. The commit hash becomes evidence. The filament grows outward (new bark). The branch thickens.

4. **Developer runs `git push`** — the commit propagates. Other trees that reference this code see the update via cross-tree links. If a test fails downstream, a scar appears.

5. **Developer opens a conversation in Cursor** — a new filament appears on `dev.conversations`. The transcript accumulates as evidence. Key decisions extracted by the SCV appear as linked filaments on `dev.decisions`.

6. **Time passes** — old commits sink inward. The earliest code becomes inner rings. Recent code is outer bark. The branch's cross-section shows development intensity over time: thick rings during heavy development, thin rings during quiet periods.

7. **The project is released** — Tree Zero is sealed with the genesis Merkle root. All development history is now permanent, auditable, and explorable by anyone the founder grants access to.

---

## 6. File Structure Requirements for Genesis

For the genesis commit (§80.2) to execute cleanly, the following must exist:

| Requirement | Current State | Status |
|---|---|---|
| Master Plan (`docs/architecture/RELAY-MASTER-BUILD-PLAN.md`) | 336 contracts, ~21,000+ lines, 111 sections (§0–§111 plus §5b, §49b, §49c, §74b) | READY |
| Civilization Template Library (`docs/architecture/RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md`) | 13 pillars, HEALTH-1, PROPERTY-1 deep-dives | READY |
| Development Tree Map (`docs/architecture/RELAY-DEVELOPMENT-TREE-MAP.md`) | This file | READY |
| Template JSON stubs (`config/templates/*.json`) | health.v1, property.v1 | READY |
| Core rendering code (`app/`) | globe, tree, models, renderers, controls | READY |
| Boundary data (`data/boundaries/`) | 375 GeoJSON files | READY |
| Tier 3 directory structure (`app/core/`, `app/physics/`, etc.) | Placeholder READMEs | READY (empty) |
| Blueprints (`docs/blueprints/`) | 8 ASCII art diagrams + index | READY |
| Tests (`tests/`) | stress-test.js | READY |
| HANDOFF.md | Current session state | READY |
| Git history | Full commit log from v93 through present | READY |
| Conversation archive | Agent transcripts in project directory | READY |
| Video/audio archive | Not yet in repository | PENDING — import at genesis |
| Persistence layer (`app/store/`) | Placeholder only | PENDING — Tier 3 |
| Event bus (`app/core/`) | Placeholder only | PENDING — Tier 3 |
| Template runtime (`app/templates/`) | Placeholder only | PENDING — Tier 3 |

**Genesis can execute with current state.** The pending Tier 3 components are development work that will continue as filaments on the living tree. The architecture, templates, boundaries, rendering code, and full git history are all present and ready for import.

---

*The 2D files you see in Cursor are the flat projection of a 3D tree. The folders are branches. The files are filaments. The git log is the ring history. The development conversations are the roots. When Relay goes live, this projection unfolds into the real thing. The map becomes the territory.*
