# Relay Master Build Plan — 2026-02-17

**The complete specification for Relay — a living 3D world built on the real Earth, where everything humanity does becomes visible, accountable, and permanent.**

This document is written for two audiences at once. If you are a parent, a business professional, or someone who has never seen a line of code — read it straight through. Every section begins with what it means for you. If you are an engineer building the system — the full technical specification follows every introduction. Both audiences read the same document because Relay does not separate understanding from implementation.

**Status: CANONICAL — This is the definitive system specification for Relay.**
**Supersedes: [RELAY-MASTER-BUILD-PLAN-PRE-BARK-MODEL.md](../../archive/superseded-docs/RELAY-MASTER-BUILD-PLAN-PRE-BARK-MODEL.md) (retained for build history)**
**Model: Cylindrical Bark Geometry with Gravitational Time**

---

## 0. What Relay Is

Imagine your neighborhood has a tree growing out of the Earth. Every pothole report, every noise complaint, every block party invitation becomes a thread on that tree. The threads that people respond to grow outward — alive, visible, demanding attention. The threads nobody cares about sink quietly into the ground, archived forever but out of the way. You look at the tree and you can tell — without reading a single report — whether your neighborhood is thriving or neglected. The shape tells you. A company has a tree too. So does a school, a city, a country, a research lab, a band. Every tree works the same way.

That is Relay.

Relay is the universal structure of organized knowledge. It maps any domain — procurement, governance, astronomy, music production, neighborhood services, personal files, software development — onto one canonical 3D tree structure with identical rendering, auditing, accountability, and physics guarantees.

Relay is not a visualization of data. The tree IS the data. Every visual property — thickness, firmness, rotation, color, opacity, glow — is an emergent result of filament truths at the lowest level. Nothing is decorated. Nothing is cosmetic. The shape of the tree IS the model.

**The One Sentence:**

> Relay is a living 3D world where every meaningful event becomes a filament on a tree, every tree sinks with time toward permanent truth, and the shape of every branch tells you — without reading a single number — whether things are healthy, stuck, or dying.

### 0.1 The Two Forces

Two forces govern all motion in Relay:

1. **GRAVITY** (Earth time) — pulls everything DOWNWARD toward the roots. Universal. Constant. The globe slowly rotates; this rotation IS time. Everything sinks. Transactions, conversations, observations, complaints — all sink toward reconciliation, completion, and permanent archive. This force is unstoppable. It is the clock.

2. **GROWTH** (engagement) — pushes things OUTWARD. When people engage — respond, vote, attach evidence, discuss — the filament grows. Growth counters gravity. A filament growing faster than it sinks is alive and visible. A filament that stops growing sinks into the archive. The balance between gravity and growth determines the shape of every tree on the globe.

### 0.2 The Three Globe Metrics

At global scale, three metrics determine what the world sees:

- **Engagement Rate** (vote count, positive + negative) — how many people took a deliberate stance. This is what raises topics off the globe surface.
- **Attention Rate** (presence focus count) — how many people are looking at this right now. The most important metric — raw eyeballs.
- **Acceleration** (heat = d(engagement)/dt) — how fast things are changing. This is what makes something HOT. Not size, not age — the rate of change. A military crisis with evidence pouring in at 10,000 commits/hour blazes red.

### 0.3 The Six Universal Domains

Every event in Relay — whether it is an invoice, a pothole report, a scientific observation, or a conversation — carries six pieces of context. These six questions are what make the tree physics work:

1. **IDENTITY** — What is this thing? An invoice, a bug report, a vote, a complaint.
2. **COUNTERPARTY** — Who else is involved? The vendor, the neighbor, the other party. Their direction determines where the event appears on the branch surface.
3. **TIME** — When did it happen? When is it due? When was it resolved? Time drives sinking — older events are deeper.
4. **MAGNITUDE** — How much? Dollars, severity, count, score. Magnitude drives color — warm for large amounts, cool for small.
5. **EVIDENCE** — What proves this is real? Documents, photos, signatures, references to other events. Evidence drives opacity — well-evidenced events look solid; unsupported claims look transparent.
6. **LIFECYCLE** — Where is it in its journey? Just opened, actively being worked, on hold, closed, fully absorbed into the permanent record. Lifecycle drives position — new events sit on the outer surface, completed events migrate inward toward the core.

### 0.4 Truth vs Projection

Everything in Relay is either TRUTH or PROJECTION:

- **Truth** (natural color): Branches and filaments that represent real events. Append-only, commit-signed, verifiable. Cannot be deleted. Reverts create visible scars.
- **Projection** (light blue): Analytical branches derived from truth. Read-only computation. No new filaments. Visible ETL pipelines with decision nodes, alignment zones, and summary termini. Promotable to permanent fixtures via governance.

---

## 1. The Globe

The Cesium 3D globe is the root context. It slowly rotates — this rotation IS earth time, the gravitational constant driving all sinking.

### 1.1 What You See

Trunks rise from the globe surface. Each trunk marks an entity — a company, a neighborhood, a city, a country, a research project, a person. Hot spots glow where attention concentrates. Branches rise and fall as engagement flows. Streams of presence markers show where humanity is looking RIGHT NOW.

### 1.2 Trunk Prominence

A trunk's visibility on the globe is determined by the three globe metrics:

- **Height off surface** = engagement rate (vote count). More votes = taller trunk.
- **Glow intensity** = attention rate (presence focus count). More eyes = brighter.
- **Color temperature** = acceleration (heat). Fast change = hot red. Stable = cool blue.

A trunk with zero engagement is invisible at globe LOD — it exists but doesn't command attention. A trunk with millions of votes and rapidly accelerating evidence is a blazing beacon visible from any zoom level.

### 1.3 Below the Surface

The globe's crust is not empty. Below the surface lies the root archive — the compressed, Merkle-encrypted permanent record of everything that has ever been reconciled. Deeper = older. Archaeologists and historians can zoom BELOW the surface to explore root strata, creating findings filaments on the present surface with evidence twigs reaching down into buried root layers.

### 1.4 Above the Surface

The LOD ladder extends beyond Earth:

```
CELL         individual filament row
BARK         spreadsheet on branch surface
BRANCH       branch cylinder
TREE         single tree (company/neighborhood/project)
CITY         city-level aggregation
COUNTRY      country-level aggregation
GLOBE        Earth surface (all trunks)
ORBITAL      satellites, space stations
LUNAR        the Moon
PLANETARY    solar system (planets as trunks)
STELLAR      nearby star systems
GALACTIC     Milky Way structure
LANIAKEA     supercluster scale
```

Each celestial body can have its own tree. Mars has geology, atmosphere, and mission branches. Each observation is a filament. The same six domains, the same physics, the same mechanics.

---

## 2. The Trunk

The trunk is the vertical spine rising from the globe surface (or from a parent branch at higher fractal levels).

### 2.1 Heartwood

The trunk's thickness is emergent from the total mass of absorbed filaments across all branches. No independent mechanic. More absorbed (completed, reconciled) filaments = thicker trunk. The trunk IS the accumulated record of all resolved activity.

### 2.2 Consolidation Gate

The trunk is where multiple branches converge as content sinks toward roots. It serves as a reconciliation checkpoint:

- Filaments from all branches meet at the trunk junction
- For financial trees: cross-branch double-entry balance is verified (TransferPacket: every debit has a matching credit)
- Only fully balanced, reconciled content passes through to roots
- Unreconciled content is held at the trunk level — visible as trunk-level outliers
- The gate rules are template-defined (financial balance for companies, completeness checks for municipalities, peer review for science)

### 2.3 No Standalone Deformation

The trunk does not wilt, bend, or deform on its own. Its visual state is purely emergent from branch health. Healthy branches = firm trunk. Wilted branches = the trunk reflects the aggregate degradation.

---

## 3. The Branch — Cylindrical Coordinate Model

A branch is a category of work. Think of the "Invoices" pile in an accounting department, or the "Pothole Reports" stack at city hall, or the "Patient Records" shelf at a clinic. In Relay, each of these becomes a living 3D branch on the tree — a cylinder you can look at and immediately tell whether things are moving smoothly or piling up. New work appears on the outer surface. Completed work migrates inward. Old unfinished work sticks out like a twig. You see health at a glance, the way you can tell a real tree is healthy or dying without counting its leaves.

Here is how the geometry works. A branch represents a service type / activity category where every filament row shares the same basic schema. Branches are not departments — they are coherent units of analyzable work.

### 3.1 The Cylindrical Coordinates

Every point on or in the branch is defined by **(l, r, theta)**:

- **l** (length along branch) = **TIME**. l=0 at trunk junction. l=L_max at branch tip. Timeboxes are cross-sectional disks at regular l intervals.
- **r** (radial distance from center) = **LIFECYCLE MATURITY**. r=R_max is outer bark (OPEN/new). r=0 is center (ABSORBED, exiting to trunk). Filaments migrate inward as they mature.
- **theta** (angle around circumference) = **APPROACH DIRECTION**. Computed from the actual vector of approach — on the globe this defaults to compass bearing from tree to counterparty; on street view it is the literal physical direction measured by proximity detection.

### 3.2 The Bark IS the Spreadsheet

The spreadsheet does not sit at the end of the branch. **The spreadsheet IS the bark — it wraps AROUND the branch surface.**

- Rows (filaments) stream along the l axis (time). Each row is one atomic event.
- Columns are filament properties (the six universal domains + template-specific extensions).
- New events appear at the current timebox position on the outer bark surface.
- As long as a filament is OPEN, it continues to grow longer day by day, existing in successive timeboxes.
- When a filament CLOSES, it stops growing on the bark and begins migrating inward (r decreases).
- Rows of sheets are layers of bark wrapped around the branch — exactly like a real tree.

### 3.3 Zoom-to-Flat LOD Transition

- **BRANCH LOD**: Full cylinder. Bark texture visible but individual rows not readable.
- **SHEET LOD**: Bark partially flattening. Column headers becoming visible. Some curvature remains.
- **CELL LOD**: Fully flat 2D spreadsheet grid. Users read, edit, and interact as in Excel. The cylindrical surface is conformally projected onto a plane.
- **Zooming out**: The flat grid re-wraps onto the cylindrical branch surface.

### 3.4 Branch Cross-Section — Dual Encoding

A cross-section cut perpendicular to the branch encodes TWO things simultaneously:

**Radial** (distance from center) = lifecycle maturity:
- Outer bark = OPEN/new filaments (just spawned)
- Middle rings = ACTIVE filaments (in progress, being matched/verified)
- Inner rings = CLOSED filaments (resolved, settling inward)
- Core = ABSORBED (exiting to trunk)

**Angular** (compass direction) = approach direction of counterparty:
- A client from the east appears on the east side of the bark
- A vendor from the north appears on the north side
- The cross-section is simultaneously a **tree ring diagram**, a **pie chart** of geographic/directional distribution, and a **heat map** of magnitude/confidence

### 3.5 The Helical Twist — Time Grain

The branch has a subtle spiral grain along its length — like a barber pole or twisted rope.

- One full twist = one configurable time period (day, week, sprint, quarter)
- Filament rows follow the spiral as they grow along the bark
- A filament alive for 3 weeks spirals around 3 times
- Count the twists = count the time periods
- The twist is structural (the time grain), not a free-spinning animation

### 3.6 Timebox Slabs — The Vertebrae

Cross-sectional rings segment the branch into time periods. Each ring = one timebox.

Properties computed FROM the filaments within:

- **Thickness** = commit density (more commits in period = thicker ring)
- **Color** = aggregate magnitude (warm palette for net positive, cool for net negative). Magnitude is encoded as color, not as directional extrusion.
- **Opacity** = confidence (automatic: evidence_present / evidence_required). No manager approval.
- **Firmness** = wilt factor (0.0 = fully firm, 1.0 = maximally wilted)

### 3.7 Wilting — Emergent Branch Deformation

Wilt is a timebox slab property, not a branch-level variable:

- Healthy slab (wilt < 0.3): firm, crisp edges, full opacity. Ring holds its shape.
- Degraded slab (0.3-0.7): edges soften, opacity drops. Ring starts to sag.
- Wilted slab (> 0.7): walls collapse, transparent. Ring droops visibly.

**Branch drooping is EMERGENT.** When multiple adjacent timebox slabs wilt, the branch segment between them loses structural support and droops — like a spine with crushed vertebrae. No independent branch droop variable exists. The branch droops BECAUSE its timebox vertebrae lost integrity.

Wilt inputs (computed from filament data, never heuristic):
- Unresolved obligations within the timebox
- Confidence decay (missing inputs, incomplete coverage)
- Time since last verification event

Wilt recovery: immediate on next render cycle after verification events arrive.

### 3.8 Collision Physics — Material Resistance

Timebox slab walls have physical material properties:

- Firm slabs resist camera penetration — feels solid, boundary pushes back
- Wilted slabs offer less resistance — camera slides through, area feels uncertain
- Adjacent firm slabs maintain branch rigidity
- UX-as-physics: healthy data feels solid; uncertain data feels soft

### 3.9 The Branch Tip — Tiny Insight Endpoint

The branch tip is NOT a large spreadsheet. It is a small endpoint — like a bud on a real tree — showing only the final summary overview: categories and results over time. The insight. The bark (raw data) is distributed along the branch LENGTH. The tip is the productive output.

### 3.10 Twigs — Emergent Outlier Geometry

A twig is the natural geometric consequence of a filament that sinks downward (gravity is universal) but doesn't migrate inward (it hasn't closed).

Everything else at that old timebox level has completed and moved to the center. This one filament is still at bark-level radius. So it's the only thing protruding from the branch surface at that depth. It literally looks like a twig.

The longer it stays unresolved, the lower it sinks (gravity keeps working), and the more it sticks out — because at each lower timebox, more of its contemporaries have completed. The twig "grows" not because it's getting worse, but because everything else is getting better.

No special twig detection code is needed. The cylindrical coordinate system produces this naturally: any filament at (low_l, R_max, theta) when everything else at that l is near (low_l, ~0, theta) will geometrically protrude.

### 3.11 The Downward Slope

The branch has a natural downward slope:

- The tip (newest time) is highest — fresh activity at the surface
- The trunk junction (oldest time) is lowest — old content sinking toward roots
- Filaments within the branch also drift downward as they migrate inward

The combined effect: old, completed content is at the lowest point (trunk base / root junction). New bark arrivals are at the highest point (branch tip). The branch is a slope from present (high, tip) to past (low, trunk).

---

## 4. The Filament — Row-Level Atomic Event

A filament is one event. One invoice. One pothole report. One conversation. One bug fix. One vote. It is the smallest unit of truth in Relay — a single thing that happened, with all its context attached. When your company receives an invoice from a vendor, that invoice becomes a filament. When a neighbor reports a noise complaint, that complaint becomes a filament. The filament carries everything about that event — who, what, when, how much, what proves it — and it lives on the branch surface until it is resolved, at which point it migrates inward and eventually becomes part of the permanent record.

In technical terms: a filament IS a row. Not a cell. The entire row represents one atomic event.

### 4.1 Definition

One event. One filament. One row. One trace from bark to root.

A filament is NOT a cell, a column, a sheet, a branch, or a KPI. It is the indivisible quantum of activity in Relay.

Columns are PROPERTIES of the filament:
- The "Amount" column = magnitude (drives slab color)
- The "Date" columns = temporal properties (commits along the timeline)
- The "Status" column = lifecycle state (drives radial position)
- The "Vendor" column = counterparty (drives angular bark position)
- The "Evidence" columns = attestation links (drives slab opacity)

Cell-level history is a FILTERED VIEW of the filament's row-level commit history. Both coexist because cell history is a subset of row history.

### 4.2 Schema

```json
{
  "Filament": {
    "filamentId": "F-<objectType>-<objectId>",
    "originRowRef": "row.<moduleId>.<sheetId>.R<row>",
    "objectId": "string",
    "objectType": "string",
    "templateId": "template.<domain>.<variant>",
    "branchId": "branch.<treeId>.<servicePath>",
    "counterpartyRef": "string (entity ID or geographic anchor)",
    "approachAngle": "number (radians, 0=north, pi/2=east)",
    "magnitudeColumn": "string (column name that carries the magnitude value)",
    "magnitude": "string-decimal|null",
    "unit": "string|null",
    "evidenceRefs": ["filamentId|attachmentId|externalRef"],
    "lifecycleState": "OPEN|ACTIVE|HOLD|CLOSED|ABSORBED",
    "workState": "DRAFT|PROPOSED|COMMITTED|REVERTED",
    "barkPosition": {
      "l": "number (position along branch length / time axis)",
      "r": "number (radial distance from center, R_max=bark)",
      "theta": "number (angular position, radians)"
    },
    "spawnedAt": "ISO-8601",
    "expectedCloseBy": "ISO-8601|null",
    "closedAt": "ISO-8601|null",
    "absorbedAt": "ISO-8601|null",
    "commitHistory": ["commitId"],
    "disclosureTier": 0
  }
}
```

### 4.3 Lifecycle Journey

1. **ARRIVE**: Event arrives from outside world. Routed to branch as new bark row.
2. **SPAWN**: Filament appears at outer bark (r=R_max) at current timebox (l=l_current), angular position = counterparty approach direction (theta=approach_angle).
3. **GROW**: While OPEN, filament extends along l axis. It exists in successive timeboxes, growing longer on the bark day by day.
4. **MATURE**: Commits happen (matches, evidence, payments). Filament begins migrating inward (r decreases). Transitions: OPEN -> ACTIVE -> HOLD -> CLOSED.
5. **CLOSE**: All obligations met. Filament stops growing on bark. Settles to inner rings (r approaches 0).
6. **ABSORB**: Filament reaches center (r=0). Enters trunk consolidation gate.
7. **ARCHIVE**: Passes through trunk reconciliation. Compressed into root cube. Merkle-sealed.

### 4.4 Inward Movement Rule

Filaments always move inward: bark -> rings -> core -> trunk -> root. They never move outward. Outward "projection" (a cell value appearing in a summary) is a read-only reference, not movement.

### 4.5 Scars — Reverts Are Permanent

You cannot delete in Relay. A revert is a NEW commit that creates a **scar** — a visible mark on the bark showing that something was reversed.

The original filament still exists. The scar filament exists on top of it. Both are truth. The scar says: "This was reversed on [date], by [person], for [reason], with [evidence]." The bark carries a permanent mark — like a scar on real bark. Scars have their own confidence (was the reversal well-evidenced?) and sink with time like everything else.

### 4.6 Migration Commits — Governance Recategorization

A filament can be moved between branches through a **migration commit**. This is the ONLY mechanism for recategorization. Direct `branchId` mutation is forbidden (violates append-only, stable IDs, and replay determinism).

**When a migration executes:**

1. A new commit is appended to the **original filament** on the source branch:
   - `lifecycleState: MIGRATED`
   - `migrationRef: branch.<newBranchId>`
   - `reason: governance.vote` (or `governance.manual` for organizational moves)
   - `migrationCommitId: commit.<hash>`

2. A **linked successor filament** spawns on the target branch:
   - Same `objectId`
   - Same `evidenceRefs` (full chain preserved)
   - New field: `migrationFrom: filament.<originalId>`
   - New field: `migrationCommitId: commit.<hash>` (links to source)
   - Lifecycle continues from the state it was in before migration

**What the user sees:**
- Source branch: original filament with a migration scar — "This was recategorized to [branch] on [date], by [governance vote / authority]."
- Target branch: successor filament with provenance — "This originated on [source branch], migrated via [commitId]."
- Nothing disappears. Both are truth.

**Replay determinism preserved:** The migration commit is append-only. Replaying the commit log reproduces the migration at the exact same point in history.

**Chained migrations:** If the community later reverses the migration, that is another migration commit in the opposite direction. The chain is fully auditable. There is no limit on chain length, but each link requires its own governance threshold.

---

## 5. Notes — The Unified Ephemeral Layer

A Note is how everything starts. You walk past a broken streetlight, pull out your phone, and post a thought — a photo, a complaint, a question. That is a Note. It is temporary. If nobody responds, it fades away on its own, sinking into the archive like a leaf falling to the ground. But if someone responds — if one other person in the world chooses to engage with what you said — that Note becomes a filament. Permanent. Part of the record. Every global movement, every policy change, every viral discussion in Relay began as one person's sticky note that someone else chose to answer.

In technical terms: a Note is the unified concept combining DraftNodes and sticky notes. It is pre-filament potential — ephemeral, postable on any surface, time-limited.

### 5.1 Definition

A Note is NOT a filament. It has no lifecycle, no magnitude, no branch effect, no commit chain, no governance weight. It is a cognitive scratch — a thought before it becomes structured.

### 5.2 Schema

```json
{
  "Note": {
    "noteId": "note.<uuid>",
    "surfaceRef": "any tree/branch/bark/trunk surface in the 3D world",
    "position": { "l": 0, "r": 0, "theta": 0 },
    "content": "free text, sketch, voice-to-text, link",
    "tags": ["string"],
    "createdBy": "user.<id>",
    "createdAt": "ISO-8601",
    "ttl": "number (seconds, default varies by context)",
    "state": "EPHEMERAL|CONVERTED",
    "convertedTo": "filamentId|null",
    "responseCount": 0
  }
}
```

### 5.3 Lifecycle — State Machine

The Note lifecycle is a boundary-crossing state machine. The transition from `EPHEMERAL` to `FILAMENT(OPEN)` is the ignition event for all coordination in Relay:

```
NOTE(EPHEMERAL) → [TTL expires, no response] → NOTE(SUNK)
NOTE(EPHEMERAL) → [first external response] → NOTE(RESPONDED) → FILAMENT(OPEN)
NOTE(EPHEMERAL) → [author formalizes] → FILAMENT(OPEN)
```

1. Someone posts a Note on any surface in the 3D world. State = `EPHEMERAL`. It appears at the bark at the poster's approach angle.
2. The Note has a TTL — a configurable gravity sink rate. TTL governance follows the standard three-tier parametric model: global default (e.g., 15 minutes) → template override (e.g., 60 minutes for hospital safety) → branch-level override.
3. If nobody responds before TTL expires: the Note **sinks off the surface**. State = `SUNK`. It is gone from current view but **NOT deleted** — it sinks to root strata as append-only history. TTL is surface residency duration, never deletion. Nothing disappears in Relay. (Frozen contract #1.)
4. If someone responds: the Note crosses a **material boundary**. State = `RESPONDED` → immediately converts to `FILAMENT(OPEN)`. Two parties are now involved. The filament is permanent. This is the **FilamentBirth trigger** — the moment ephemeral speech becomes coordination history. The trigger is external (another human's commit), never automatic.
5. If the author manually formalizes: the Note converts directly to `FILAMENT(OPEN)` on the target branch with pre-filled content.

**The FilamentBirth trigger is the zero-to-tree growth engine.** Every viral global discussion, every civilizational movement, every governance event in Relay begins as a single anonymous sticky note that one other person chose to respond to. Viral emergence is not an algorithm — it is the net force outcome of `engagement force > gravity sink rate`. No boost mechanic, no shadow amplification, no hidden ranking weight, no paid promotion path.

**Spam mitigation (without hidden suppression):**
- TTL gravity: unengaged notes sink naturally
- Attention threshold: filament birth requires an external human response, not self-promotion
- Local rate limiting: device-level posting caps (not identity-level, preserving Tier 0 anonymity)
- Global parameter: notes-per-minute threshold is a community-voted spam filter (§12 Filter Tolerances)

### 5.4 Rendering

- Small, translucent marker at the surface. Distinct from filament geometry (teardrop or sphere).
- Alpha: 0.4 (clearly secondary to canonical objects)
- LOD: visible at CELL/BARK, suppressed at BRANCH and above. Count badge if 5+ Notes cluster on same surface.
- Notes that are close to expiry fade progressively (alpha decreasing toward 0).

---

## 6. Projection Branches — Visible Data Pipelines

Sometimes you need to ask a question about the data, not add to it. "How much did we spend on Berlin vendors this quarter?" "Which potholes have been open longer than 30 days?" A projection branch is that question made visible — a light blue branch that pulls data from the real branches, filters it, and shows you the answer at its tip. It never changes the truth. It just helps you see it differently. Anyone can see exactly how a projection was built — which filters were applied, which data was included, which was excluded. Nothing is hidden.

In technical terms: projection branches are light blue analytical offshoots from truth branches. They are visible ETL (Extract-Transform-Load) pipelines.

### 6.1 Anatomy

A projection branch is a funnel with distinct zones:

**Input End** (wide): Many filament rows pulled from the truth branch bark.

**Decision Nodes**: Visible glowing points where filter/transform rules are applied. Each is inspectable:
- "IF currency != USD -> convert"
- "exclude internal vendors"
- "filter severity >= 3"

**Alignment Zone**: Where surviving filaments converge, group, and consolidate by category.

**Excel Terminus**: A small summary table at the tip. The insight. Not a big spreadsheet — a focused answer (e.g., Vendor | Total Spend | Invoice Count | Avg Invoice).

**Outlier Twigs**: Filaments filtered out by decision nodes. They don't disappear — they stick out as visible protrusions from the projection branch. Nothing is hidden.

### 6.2 Properties

- **Color**: Light blue. Always. Even when promoted to permanent.
- **Content**: No new filaments. No new rows. Pure read-only computation.
- **Source**: Derived exclusively from truth branch bark data.
- **No trunk/root flow**: Projection branches are terminal. Their content does not sink to trunk or roots. They are not balancing factors. But they CAN be replayed back in time — never lost, just no need to archive.

### 6.3 Promotability

A projection branch starts ephemeral. If the team agrees it matters:

1. Author clicks "Promote" -> PROPOSE commit created
2. Team reviews decision nodes, evidence quality, output relevance
3. COMMIT approved -> projection branch becomes permanent fixture
4. Still light blue (always marked as projection)
5. Auto-recomputes when new bark data arrives on the parent truth branch
6. Changing a decision node rule on a promoted branch requires a governance commit

### 6.4 Projection Compute Guards

Projections are the only part of Relay that performs live recomputation on potentially unbounded data. Without guards, analysis layers can explode the engine:

**Maximum recursion depth (initial value: 3 levels, global parameter — votable).** A projection can reference a truth branch (level 1). A projection can reference another projection (level 2). A projection can reference a projection that references a projection (level 3). Beyond that: `[REFUSAL] reason=PROJECTION_RECURSION_DEPTH_EXCEEDED depth=<n> max=<current_param>`.

**Cycle detection:** The projection dependency graph is checked before evaluation. If projection A references B which references A (direct or transitive), the cycle is detected and refused: `[REFUSAL] reason=PROJECTION_CYCLE_DETECTED graph=<ids>`. Cyclic projections cannot be created.

**Evaluation time budget (initial value: 50ms per projection per recompute, global parameter — votable).** If a single projection's evaluation exceeds the budget, it is interrupted and the last valid result is cached with a staleness flag. `[DEGRADED] reason=PROJECTION_TIME_BUDGET_EXCEEDED projection=<id> elapsed=<ms> budget=<current_param>`.

**Recompute cadence: per timebox boundary, not per commit.** Projections recompute when the timebox they observe closes, not on every individual commit arrival. This throttles recompute to the natural heartbeat of the system. Projections on very active branches do not trigger recompute on every filament insertion.

**LOD-based suppression:**
- GLOBE LOD: all projections suppressed (only trunks visible)
- REGION LOD: top-3 promoted projections per branch visible (summary only)
- TREE LOD: all promoted projections visible, ephemeral projections hidden
- BRANCH LOD: full projection detail, all projections visible
- CELL LOD: full detail including outlier twigs

**Primitive budget integration:** Projection rendering counts against the same LOD primitive budget as everything else (frozen contract #65). If projections would exceed the budget, projection primitives are shed before evidence primitives (frozen contract #80).

**No compute without observation:** Projections only evaluate when they are inside a viewer's active sight bubble (see §33.3) or when they are explicitly "published" outputs that a branch scope has committed to maintain. Unpublished projections that no user is currently viewing do not recompute — they hold their last cached result. This is the core invariant that prevents compute explosion at scale: even if 50,000 users each build 3-layer projections on the same branch, only the projections currently being viewed by someone trigger recompute. The rest sleep.

**Projection instance cap per branch (initial value: 500 active projections per branch, global parameter — votable).** If a branch exceeds the projection cap, new projections are queued. Oldest ephemeral projections are evicted first. Promoted projections count toward the cap but are never evicted — if all 500 slots are promoted, no new ephemeral projections can be created until one is deprecated. This prevents a single hot branch from becoming a compute black hole.

**Content-based memoization:** Projections cache their results keyed by the hash of their input data (the set of filament commit hashes in their source scope). If the input data has not changed since the last evaluation, the cached result is returned without recomputation. This means projections on stable branches — where no new commits arrived — cost zero compute regardless of how many viewers are looking.

---

## 7. The Social Layer

The social layer uses identical mechanics to the operational layer. Commentary, news, opinions, discussions, and global conversations are all filaments.

### 7.1 How It Works

1. Someone posts a **Note** on any surface in the world (a company bark, a globe location, a branch, a topic)
2. Most Notes fade (15 min TTL, no engagement)
3. When someone responds -> Note converts to **filament**. Conversation begins.
4. Each response is a **commit** on the filament. The filament grows by l (time).
5. A response WITH evidence = a commit that branches out as an **evidence twig** pointing to source data
6. When 2+ parties engage on a specific commit -> a **sub-filament** spawns at that interaction point
7. The filament sinks with gravity. But if growth rate exceeds sink rate -> it extends outward and becomes visible at higher LOD levels

### 7.2 Confidence Propagation

To get a good confidence score on your post, you must REFERENCE other filaments that have good confidence scores:

- Post referencing actual transaction filaments with high confidence -> inherits high confidence -> persists
- Post referencing nothing -> low confidence -> low opacity -> fades from default views
- Post referencing low-confidence sources -> low confidence chain -> noise

This is how Relay resists manipulation without censorship: you can post anything, but visibility is proportional to evidence quality. Nobody decides what's true. The confidence physics determine what's visible.

### 7.3 Voting

Voting is distinct from commenting. A vote is a deliberate stance (yes/no/option selection) on a conversation or decision point. Votes:

- Contribute to the **engagement rate** metric (what raises topics off the globe surface)
- Are NOT growth (they don't make the filament longer)
- Are judgment, not content
- Have their own evidence requirements (voter eligibility, proximity verification)
- Are recorded on both the topic and the voter's personal tree

### 7.4 Vote Eligibility Gates

Not everyone can vote on everything. Unrestricted voting collapses under manipulation.

**Minimum eligibility for any global vote:**
- Filament must be public (`disclosureTier` permits external viewing)
- Voter must be **Tier 1 minimum** (verified identity). Tier 0 anonymous accounts cannot vote.
- Voter must have **presence history** (not a freshly created account — minimum age threshold)
- Voter must have **engagement history** on the related branch OR topic (prior participation demonstrates context)

**Optional additional eligibility filters (template-configurable):**
- **Proximity**: For local issues (potholes, neighborhood disputes), physical proximity may be required
- **Stake-based weighting**: For governance decisions, stake in the outcome may weight votes
- **Prior participation threshold**: Minimum number of commits/interactions in the domain before vote eligibility

**Vote anonymity is template-configurable.** Relay supports both transparent and anonymous voting, depending on what is being decided:

- **Anonymous by default** (social, ideological, belief-oriented votes): The vote commit exists on the voter's user tree and is Merkle-sealed, but the *choice payload* is encrypted. The system knows you voted (uniqueness + eligibility enforced), but not how. Aggregates are computed from blinded inputs. This protects principled dissent from social retaliation.
- **Non-anonymous by default** (high-accountability votes: spending public money, delegating authority, certifying evidence, governance parameter changes): The vote is fully visible as a responsibility record on your user tree. Your voting pattern IS part of your tree's shape. This is the anti-manipulation foundation for decisions that require accountability.
- Templates define which vote classes use which mode. The community can override the default anonymity setting for specific vote types via parametric governance — but the existence of both modes is a frozen architectural feature.

### 7.5 Global Vote-Ranked Confidence

At global scale, confidence is determined by **community vote consensus on evidence**, not by template-defined evidence rules.

**How it works:**

Evidence filaments referenced by posts/conversations have a **global alignment score** computed from votes:
- If more people vote that Evidence X is valid/trustworthy than Evidence Y, filaments referencing X get a higher global confidence score
- This is a **ranking score**, not an absolute measure — it positions evidence relative to other evidence
- The formula: `globalAlignment = votes_supporting / (votes_supporting + votes_opposing)` weighted by voter eligibility tier

**What this drives:**
- **Global ranking / prominence**: Higher-aligned evidence → filaments referencing it rank higher in global views
- **Visibility at GLOBE LOD**: Well-aligned filaments are more visible when zoomed out
- **Community-curated order**: The global tree self-organizes by collective judgment

**What this does NOT do:**
- Does NOT affect organizational slab opacity (that remains `evidence_present / evidence_required`)
- Does NOT override template evidence rules
- Does NOT allow vote-based deletion or suppression of any filament
- Does NOT weight votes by wealth, status, or follower count (only by eligibility tier and engagement history)

### 7.6 Vote Decay

Votes are time-sensitive. They decay.

- **Decay model**: Votes lose weight over time (exponential decay with configurable half-life)
- **Default half-life**: 30 days (configurable per context — elections may have no decay during voting window)
- **Effect**: A filament with 10,000 votes from 6 months ago ranks lower than one with 500 fresh votes. Relevance is temporal.
- **Executed actions are permanent**: If a vote-driven migration commit was executed when votes were above threshold, the migration stands even if votes later decay below threshold. The commit is append-only. The decay affects future ranking, not past actions.

### 7.7 Vote-Driven Recategorization

At global scale, the community can vote to move a filament from one branch to another.

**Execution conditions (ALL must be true):**

```
votes_total >= minimumParticipation
AND
votes_for_target / votes_total >= supermajorityThreshold (default: 60%)
```

**Before threshold is met:**
- Filament may show a "Recategorization Pending" indicator
- Optional display of the leading target branch
- Geometry does NOT move. The filament stays on its current branch. No drift, no lean, no partial migration.

**When threshold is met:**
- A migration commit executes (§4.6): original filament gets MIGRATED state, successor spawns on target branch
- The migration is permanent and append-only
- If the community later decides the move was wrong: another migration commit in the opposite direction. Chain is fully auditable.

**Why no continuous drift:**
Geometry must remain deterministic. A filament that "leans toward" a new branch based on live vote delta would break replay consistency. Votes accumulate. When threshold is met, migration executes as a single atomic commit. Between votes, nothing moves.

**Hysteresis buffer:**
At the exact moment a migration approaches threshold, millions of simultaneous votes can oscillate the ratio above and below the trigger point. This tug-of-war must not produce flickering geometry.

- **Hysteresis band**: Migration does not execute at exactly 60%. It executes at threshold + buffer (default: 60% + 5% = **65%**). Once executed, a counter-migration vote cycle cannot even begin until the ratio drops below threshold - buffer (**55%**). This dead zone prevents oscillation.
- **Settlement window**: The ratio must be sustained **continuously** above the hysteresis threshold for a minimum duration (default: **1 hour**). Momentary spikes do not trigger execution. If the ratio dips below the hysteresis threshold at any point during the window, the clock resets to zero.
- **Rendering during pending period**: A progress bar shows settlement window completion. The live vote counter is visible but decorative — the actual trigger is (sustained ratio >= hysteresis threshold for >= settlement duration). Geometry stays frozen. No flicker.
- **Post-execution lock**: After a migration commit fires, a cooldown period (default: 24 hours) blocks new recategorization votes on the same filament. This prevents immediate counter-attacks from creating thrash.

### 7.8 Buried Resurrection

A Note that sank after 2 days with minimal engagement — buried, low on the branch. Someone discovers it and responds:

From that buried position, the filament sprouts NEW GROWTH upward toward current time. The original post stays at its sunken position (that's where it happened). But the conversation extending from it reaches back up to the present — a visible link between past and present. This is how old evidence resurfaces.

---

## 8. The User Tree — Personal Responsibility Mirror

**Stage Gate:** 1→2→3. Stage 1: responsibility mirror, CV through shape, privacy tiers. Stage 2: achievement records, capability unlock state. Stage 3: spell library, quest log, combat record.

Every person on Relay has their own tree. It uses identical mechanics to every other tree.

### 8.1 Structure

Your tree's branches are the **roles you play**:

- "Procurement Approver at Avgol" branch
- "Code Reviewer at ProjectX" branch
- "Resident at Maple Street" branch
- "Voter" branch
- "Social" branch

Your bark carries YOUR filaments — your individual actions in each role. Responsibility records: "I did this, at this time, with this evidence, under this authority."

### 8.2 The Mirror Commit

Every material action creates entries on TWO trees simultaneously:

**System tree** (TransferPacket): What happened to the system state.
**User tree** (ResponsibilityPacket): What the human is responsible for.

Both carry the **same commitId**. The company tree says "Invoice approved." Your tree says "I approved it." These are cryptographically linked — you cannot have one without the other.

### 8.3 Your Tree's Physics

- **Bark**: Your activity history wrapping each role branch
- **Sinking**: Earth time pulls old activity downward
- **Twigs**: Things pending YOUR action that you haven't completed (overdue reviews, unanswered approvals)
- **Confidence**: Evidence quality of your responsibility records (proper authority, verified signatures)
- **Timebox slabs**: How active and complete you were in each period
- **Roots**: Your personal archived record, Merkle-encrypted

### 8.4 Reputation Through Shape

There are no reputation scores, star ratings, or badges. Your tree's SHAPE is your reputation:

- Healthy tree: firm slabs, few twigs, high opacity, filaments closing regularly
- Unhealthy tree: many twigs, wilted slabs, low opacity, filaments stuck at bark

Nobody assigns reputation. The tree shows it through physics.

### 8.5 Privacy

Visibility follows tiered consent:

- **Tier 0** (default): Anonymous dot. Nobody sees your tree.
- **Tier 1**: Role badge. People see branch shapes but not individual filaments.
- **Tier 2**: Named identity with detail. Authorized parties see individual responsibility filaments.

Escalation requires YOUR explicit consent per context.

---

## 9. Confidence Physics — Automatic Evidence Ratio

How do you know if something is real? In Relay, you do not trust anyone's word for it. The system counts evidence automatically. An invoice that has a matching purchase order and a delivery receipt has high confidence — it looks solid and opaque on the branch. A claim posted with no supporting documents has low confidence — it looks transparent, almost ghostly. Nobody decides this. No manager approves it. The evidence either exists or it does not, and the branch shows you which.

Confidence (timebox slab opacity) is automatic. No manager approval. No human judgment.

### 9.1 How It Works

Each template defines **evidence requirements** — rules about what must be attached for a filament to be considered complete:

```
Rule: "PO requires 3 competitive bids"
  completeness = bid_count / 3

Rule: "Invoice requires matching PO + GR"
  completeness = (has_PO + has_GR) / 2

Rule: "Pothole report requires photo + GPS"
  completeness = (has_photo + has_GPS) / 2
```

The tree computes: `confidence = evidence_present / evidence_required`. A PO with 1 bid out of 3 required shows at 0.33 opacity — visually faded, no human involved.

### 9.2 Cross-Company Evidence

A PO filament can reference BID filaments from OTHER companies on Relay. The tree automatically knows: "I see 3 bid filaments from 3 vendors -> completeness = 1.0 -> full opacity." Evidence crosses tree boundaries through explicit disclosure + consent.

### 9.3 Evidence Rules as Policy

Evidence rules are policy commits — versioned, inspectable, governed. Changing a rule (from 3 bids to 2) requires a governance commit, visible in the audit trail.

### 9.4 The Dual Confidence Model

Two confidence regimes operate simultaneously. They are **orthogonal layers** — they coexist, never override each other, and are rendered separately.

**Organizational Confidence (slab opacity):**
- Computed via `evidence_present / evidence_required`
- Template-defined, mechanical, automatic
- Drives timebox slab opacity
- Cannot be voted down by the community
- Operates within a single tree's governance boundary

**Global Vote-Ranked Confidence (ranking score):**
- Computed via community vote alignment on evidence references (§7.5)
- Drives global ranking, prominence, and visibility at GLOBE LOD
- Influenced by vote decay (§7.6)
- Cannot override template evidence rules
- Operates across tree boundaries at global scale

**When they conflict:**

A company filament has organizational confidence = 1.0 (internally complete, all evidence met). The global community rates the underlying evidence as questionable (low vote consensus, globalAlignment = 0.3).

Rendering:
- **Slab opacity = 1.0** (internal completeness is preserved — the company met its own rules)
- **Global ranking score = low** (community does not trust the evidence)
- **Optional "Global Alignment Badge"** showing vote ratio visible at GLOBE LOD

Neither wins. Both render. This preserves:
- **Local sovereignty**: A company's internal evidence rules are not subject to mob override
- **Global discourse**: The community's assessment of evidence quality is visible and influential on ranking
- **No tyranny of majority**: Votes affect visibility, not truth
- **No managerial override**: Internal confidence is automatic, not approvable

### 9.5 Vote Cannot Override Template Rules

A critical boundary: community votes can NEVER directly modify a template's evidence requirements.

Example: Template says "PO requires 3 competitive bids." Community votes: "2 bids is acceptable."

This vote **cannot**:
- Change the template rule for that specific filament
- Override the organizational confidence calculation
- Force the slab opacity to reflect the community's preference

This vote **can**:
- Lower the filament's global ranking score (community thinks the rule is too strict/too lax)
- Trigger a **governance proposal** to modify the template evidence rule (which then follows normal governance: PROPOSE -> VOTE_WINDOW -> COMMIT with appropriate authority)

Template sovereignty is preserved. The community influences discourse, not operational rules.

### 9.6 Implementation Constraints — Dual Confidence Separation

The two confidence channels are **independent primitives** that must never collapse (frozen contract #44):

**Storage:** Separate fields. Every filament carries both `orgConfidence` and `globalConfidence` as independent properties. Never stored as a single "confidence" value. Never derived from a shared intermediate.

**APIs:** Separate setters, separate getters. No function signature accepts or returns a blended score. `setOrgConfidence()` and `setGlobalConfidence()` are distinct code paths with no shared mutation logic.

**Arithmetic:** No code path may reference both values in the same arithmetic expression. No averaging, no weighting, no blending, no "combined score." They are rendered side by side, never merged.

**Serialization:** The pair structure is preserved in wire format, storage format, and API response format. Both values are always present. Missing value = null, not zero.

**Mandatory verification artifact:** `DUAL-CONFIDENCE-SEPARATION-PROOF` must assert:
1. No code path references both channels in the same arithmetic expression
2. No function returns a blended score
3. No setter mutates both channels
4. Serialization preserves pair structure
5. Rendering uses orgConfidence exclusively for slab opacity and globalConfidence exclusively for globe ranking

Without this proof passing, the dual confidence contract is aspirational. With it, the contract is enforceable.

**Implementation status (2026-02-18):**
- `computeOrgConfidence()` — IMPLEMENTED. Derives from timebox, evidenceRefs, disclosure tier, minus missing-ref penalty. Normalized to 0..1.
- `computeGlobalConfidence()` — IMPLEMENTED. Derives from voteStatus only (binary: PASSED=1.0, else 0.0). Expandable to vote alignment ratio later.
- `computeConfidence()` — DEPRECATED TRAP. Emits `[REFUSAL] reason=BLENDED_CONFIDENCE_CALLED`, falls back to orgConfidence.
- Renderer height band uses `computeOrgConfidence` only.
- HUD displays both channels separately: `OrgConf: X% | GlobConf: Y%`.
- Globe ranking uses `computeGlobalConfidence` only.
- Proof: `scripts/dual-confidence-separation-proof.mjs` (8 stages).

---

## 10. Pressure Physics — Structural Integrity Forces

Pressure is the feeling that something is wrong even when the numbers look fine. A branch where half the invoices are fully evidenced and the other half have zero documentation creates visible stress — the branch looks uneven, like a spine with some vertebrae solid and others crumbling. You can see that something needs attention without reading a single number. Pressure is not about how much money is involved. It is about how trustworthy the picture is.

Pressure is NOT magnitude. They are orthogonal signals on the same branch:

- **Magnitude** (slab color, warm/cool palette) = the content signal. How much money, what severity, what count. It says "what happened."
- **Pressure** (slab firmness gradient) = the integrity signal. How trustworthy, how complete, how contested. It says "how reliable is what happened."

### 10.1 How Pressure Manifests

Pressure is visible as **localized wilt inconsistency** between adjacent timebox slabs. It is not a separate particle system, force field, or animation layer. It IS the emergent result of heterogeneous slab firmness along the branch spine.

A branch where all slabs have similar firmness (all firm or all soft) looks structurally uniform. A branch where firm slabs alternate with wilted slabs shows structural stress — kinks, sags, localized soft spots between rigid segments. This is pressure made visible.

### 10.2 How a Fake Post Creates Pressure

1. **You post a Note with no evidence.** Someone responds — it converts to a filament. But it has zero evidence references. Confidence = `0 / evidence_required = 0.0`. The slab containing your filament is nearly transparent (low opacity) and soft (high wilt). Most users' filter tolerances hide it entirely.

2. **Someone flags it.** They create a counter-commit that REFERENCES actual data showing your claim is false. The flagging filament has HIGH confidence (it references real evidence). It points AT your filament. Your filament now has active opposition with evidence and zero support.

3. **Negative pressure gradient forms.** The timebox slab containing your filament is soft (your zero-confidence filament drags it down). Adjacent slabs may be firm (other filaments in the branch are healthy). This contrast — soft between firm — is a visible structural inconsistency. The branch develops a localized weakness at your timebox.

4. **Your user tree absorbs the damage.** Every action creates a mirror commit on your user tree (§8.2). Your personal tree now shows: a filament you created with zero supporting evidence and active opposition. That filament is a twig on your personal tree — it cannot close (no resolution), cannot migrate inward (no evidence), and sinks with gravity while staying at bark radius. Your tree's shape degrades visibly.

5. **The pressure trace is auditable.** Anyone inspecting the soft slab can trace it: which filaments contribute to the weakness, who created them, what evidence exists for and against. Pressure is never mysterious — it is always traceable to specific filaments with specific confidence deficits.

### 10.3 Forces Around Branches

Forces around branches are not a separate system from wilt physics. They ARE wilt physics at the branch scale:

- **Uniform firmness** (all slabs healthy): Branch is straight, rigid, visually strong.
- **Uniform softness** (all slabs wilted): Branch droops uniformly — the whole thing is degraded.
- **Heterogeneous firmness** (firm-soft-firm pattern): Branch develops visible stress at transitions. The soft section sags between rigid neighbors. This is where structural pressure concentrates.
- **Progressive degradation** (firmness decreasing along branch): Branch curves downward progressively — newer sections may be firm while older sections wilt as obligations age.

The visual result: you can see WHERE on a branch the problems are, just by looking at the shape. No numbers needed. The geometry IS the diagnostic.

---

## 11. Parametric Governance — Votable System Constants

Every setting in Relay — how long a note lasts before it fades, how many votes it takes to change a rule, how quickly old votes lose their weight — is decided by the community, not by an administrator. You vote on the number you think is right. Everyone else does too. The system takes the middle value. No single person controls any setting. If the community collectively decides that notes should last 30 minutes instead of 15, the system adjusts. If they change their minds next month, it adjusts again. This is how Relay governs itself — continuously, transparently, and without elections.

**Stage Gate:** 1→3. Stage 1: all operational parameters (TTL, thresholds, decay, cadence). Stage 3: adds monster economy parameters (spawn rate, reward magnitude, difficulty curve) as global governed values.

Every operational parameter in Relay is a continuously votable, weighted, settling value. Nothing is hardcoded except the frozen contracts themselves.

### 11.1 How It Works

Any eligible participant can cast a parameter vote: "I think NOTE_TTL_SOCIAL should be 30 minutes." The system collects all active votes and computes the **weighted median** — not the average (averages are vulnerable to outlier manipulation). The median resists extremes:

```
Parameter: NOTE_TTL_SOCIAL
Active votes: [10, 12, 15, 15, 15, 20, 25, 30, 30]
Weights (by voter tier): [1, 1, 2, 2, 2, 1, 1, 2, 1]
Weighted median: 17 minutes
Result: NOTE_TTL_SOCIAL = 17 minutes
```

The result is not rounded to neat numbers. If the community settles on 17 minutes, it's 17 minutes.

### 11.2 Three Scope Levels

**Global parameters** — affect the entire Relay system:
- Note TTL (social, work, proximity contexts)
- Spam threshold (notes/minute)
- Minimum vote eligibility age
- Supermajority threshold for migrations
- Vote decay half-life
- Hysteresis band width
- Settlement window duration

**Branch-level parameters** — affect a specific branch:
- Evidence requirements (count and type per filament category)
- Expected resolution cadence
- Helical twist period
- Confidence thresholds for visibility

**Template-level parameters** — affect all trees using a template:
- Default attribute bindings
- Sinking mode and rate
- Consolidation gate rules
- Branch type definitions

### 11.3 Continuous Settlement

Parameter voting is NOT election-based. There is no voting period, no deadline, no winner declaration. The weighted median recalculates continuously as:
- New votes arrive (parameter shifts toward new consensus)
- Old votes decay (stale opinions lose weight, same exponential decay as §7.6)
- Voters change their mind (new vote replaces old vote from same voter)

Parameters drift toward community consensus over time. A sudden influx of votes can shift a parameter quickly. Gradual erosion of old votes shifts it slowly.

### 11.4 Parameter Vote Schema

```json
{
  "ParameterVote": {
    "voteId": "paramvote.<uuid>",
    "parameterId": "param.<scope>.<name>",
    "scope": "global|branch.<id>|template.<id>",
    "voterId": "user.<id>",
    "proposedValue": "number|string|boolean",
    "weight": "number (derived from voter eligibility tier)",
    "timestamp": "ISO-8601",
    "decayHalfLife": "number (seconds, inherited from global parameter)"
  }
}
```

### 11.5 What Cannot Be Voted On

Frozen contracts (§21) are immune to parametric governance. They are non-negotiable by design. Voting to change "append-only" or "filament = row" is structurally forbidden — the system does not expose these as votable parameters. They are architectural invariants, not operational constants.

### 11.6 Global Parameter Registry

Every numeric or duration value in the Master Plan falls into exactly one of three categories:

**Category A — Global Parameter (community-voted via weighted-median):**
These are operational tuning knobs. The founder sets initial values at launch; from day 1, the community governs them.

| Parameter | Initial Value | Scope | Contract Ref |
|-----------|--------------|-------|-------------|
| Sleep cycle duration | 7h 12m | Global | #43 |
| Sleep onset solar altitude threshold | -6° (civil twilight) | Global | #43, §14.4 |
| Sleep end solar altitude threshold | -6° (civil twilight) | Global | #43, §14.4 |
| Extreme latitude fallback threshold | ±66.5° | Global | §14.4 |
| Note TTL (social context) | 15 minutes | Global | §5 |
| Note TTL (work context) | 60 minutes | Template | §5 |
| Spam threshold (notes/minute) | TBD at launch | Global | §12 |
| Vote decay half-life | 30 days | Global | §7.6 |
| Migration hysteresis band | ±5% | Global | §7.7 |
| Migration settlement window | 1 hour | Global | §7.7 |
| Migration post-execution cooldown | 24 hours | Global | §7.7 |
| Fresh account governance cooldown duration | 14 days | Global | #55 |
| Fresh account governance commit threshold | 10 commits | Global | #55 |
| Context-weighted vote recency half-life | 90 days | Branch | #56 |
| Monster economy rate-of-change cap | 20% per epoch | Global | #46 |
| Beginner zone duration threshold | 30 days | Global | #60 |
| Beginner zone difficulty ceiling ratio | 50% | Global | #60 |
| Presence time-bucket: COMPANY LOD | 5 seconds | Global | #62 |
| Presence time-bucket: REGION LOD | 30 seconds | Global | #62 |
| Presence time-bucket: GLOBE LOD | 5 minutes | Global | #62 |
| Presence precision: COMPANY LOD | 10m | Global | #62 |
| Presence precision: REGION LOD | 1km | Global | #62 |
| Presence precision: GLOBE LOD | 50km | Global | #62 |
| Reverification interval: Probationary | 7 days | Global | #72 |
| Reverification interval: Trusted | 90 days | Global | #72 |
| Reverification interval: Verified | 180 days | Global | #72 |
| Reverification interval: Anchor | 365 days | Global | #72 |
| Trust tier promotion: Probationary → Trusted | 30 days + 10 commits | Global | §48.2.4 |
| Trust tier promotion: Trusted → Verified | 180 days + 50 commits + jury service | Global | §48.2.4 |
| Trust tier promotion: Anchor requirement | 365 days + 100 commits + 3 juries + nomination | Global | §48.2.4 |
| Inactivity demotion threshold | 180 days | Global | §48.2.4 |
| Jury historic pool consecutive term limit | 2 terms | Global | #77 |
| Jury historic pool cooldown after limit | 6 months | Global | #77 |
| Jury deliberation window | 72 hours | Global | §46.5 |
| Sortition minimum activity requirement | 30 days | Global | §46.2 |
| Sortition minimum trust threshold | 70 | Global | §46.2 |
| Guardian minimum activity requirement | 30 days | Global | §48.2.2 |
| Guardian recovery approval window | 24 hours | Global | §48.2.2 |
| Guardian recovery cooldown after failure | 48 hours | Global | §48.2.2 |
| Guardian recovery max attempts per 30 days | 2 | Global | §48.2.2 |
| Invite expiry | 14 days | Global | §48.2.3 |
| Invite refill rate | TBD by community vote | Global | §48.2.3 |
| Founder inactivity succession trigger | 365 days | Global | #81 |
| Key rotation period | 90 days | Global | §48.13 |
| Merkle digest publication interval | 24 hours | Global | #93 |
| Healthcare break-glass justification window | 72 hours | Global | #96 |
| Council decision immunity buffer | 14 days | Global | #98 |
| Emergency reform supermajority threshold | 80% Anchor-tier | Global | §49.13 |
| Projection evaluation time budget | 50ms | Global | #91 |
| Projection max recursion depth | 3 | Global | #90 |
| Projection instance cap per branch | 500 | Global | #104 |
| Camera recognition confidence threshold | TBD at launch | Global | §40 |
| Governance quorum gate range | 30-75% by cadence | Template | §19.2 |
| Governance approval gate range | 60-75% | Template | §19.2 |
| Governance reconciliation gate | 7-30 days | Template | §19.2 |
| Governance sunset gate | 90 days | Template | §19.2 |
| Invite-chain centrality visibility threshold | 25% of active users | Global | #99 |

**Category B — Founder Lever (only the founder/steward controls):**
These are structural activation switches, not tuning knobs. They are binary or milestone-gated.

| Lever | Description | Contract Ref |
|-------|-------------|-------------|
| Stage 3 activation | Enable the game/combat/spell layer globally | #48, §42 |
| Stage 2 activation | Enable the detection/AR layer globally | §42 |
| Civilization stage transitions | The moment the founder declares the world has moved to the next stage | §42 |
| Initial global parameter values | The starting values for all Category A parameters at launch (immediately votable after) | §42.4 |
| Spell/card registry additions | New spells, cards, treasure chests, Relay Set Items (existing mappings immutable) | #41 |

**Category C — Physics Constant (frozen, never votable, never changeable):**
These are architectural invariants embedded in frozen contracts.

| Constant | Value | Contract Ref |
|----------|-------|-------------|
| Filament = row | Always | #1 |
| Append-only commit chain | Always | #3 |
| Dual confidence separation | Always | #44 |
| Earth rotation rate | Real sidereal rate | §14.1 |
| Solar/lunar ephemeris | JPL/SOFA 2026-2126 | §14.4 |
| Merkle hash function | SHA-256 | §48.16 |
| Monster economy rate-of-change cap ceiling | 20% (the cap itself is frozen) | #46 |
| Sleep regeneration is community-governed | The existence of the mechanism | #43 |
| Beginner ramp exists | The existence of a ramp | #60 |
| Reverification is periodic | The existence of periodic checks | #72 |

**Governance rule:** Every value in Category A has a founder-set initial value at launch but is immediately governable by the community from day 1. No Category A value is permanently hardcoded. If a new numeric value appears in the plan and does not appear in this registry, it must be classified before implementation.

---

## 12. Filter Tolerances — Personal Visibility Slidebars

Each user has a set of personal filter slidebars that control what they see in the 3D world. Filters are CLIENT-SIDE view state — they are not commits, not truth, and not visible to anyone else.

### 12.1 Available Filters

- **Spam threshold**: Hide users posting more than X notes/minute (default: global consensus value via §11)
- **Confidence floor**: Only show filaments with confidence above X (default: 0.1)
- **Engagement minimum**: Only show filaments with at least X votes/commits (default: 0)
- **Tier filter**: Only show content from users at Tier X+ (default: Tier 0, meaning show everything)
- **Decay cutoff**: Hide filaments with vote weight decayed below X% of original (default: 5%)
- **Age cutoff**: Hide Notes older than X minutes (default: matches NOTE_TTL parameter)
- **Magnitude floor**: Only show filaments with magnitude above X (default: 0)

### 12.2 Two Layers

**Global defaults** are set by parametric governance (§11). The weighted median of everyone's votes on "what should the default spam threshold be?" produces the global default. These defaults ARE the community's immune system:
- Spam detection: the community converges on "more than 5 notes/minute = spam" and that becomes the default for everyone
- Fraud flagging: accounts failing proximity verification thresholds are filtered by default
- Bot filtering: accounts with no engagement history below the global age threshold are hidden by default

**Personal overrides** let any user slide their own thresholds tighter or looser:
- Want to see everything including spam? Slide spam threshold to infinity.
- Want maximum filtering? Slide confidence floor to 0.9 — only high-evidence content visible.
- Want to study bot behavior? Slide tier filter to Tier 0 and spam threshold to infinity.

### 12.3 Filters Are Not Truth

Filters never mutate state. They are a rendering-time visibility mask applied on the client. The underlying data is unchanged. A filament hidden by your spam filter still exists, still sinks, still has its confidence computed, still contributes to branch physics. You just don't see it.

This means: two users looking at the same branch may see different things depending on their filter settings. But the BRANCH SHAPE is computed from ALL filaments (including filtered ones). You see the branch's true shape even if some of the filaments contributing to it are hidden from your view.

### 12.4 Fraud Routing

When global filter defaults flag an account (e.g., posting rate exceeds spam threshold, identity verification failed, proximity check inconsistent), the system can route flagged accounts to:
- **Proximity channel reverification**: Must physically visit a trusted hotspot and re-verify identity
- **Reduced visibility**: Flagged account's content is hidden behind default filter for all users until reverification
- **No deletion**: The flagged content still exists. It is just below the default visibility threshold. Anyone who lowers their filter can still see it. Transparency is preserved.

---

## 13. Stigmergic Coordination — Self-Assignment Through Visibility

Relay's filament-links-filament, confidence-promotes-confidence model creates a natural stigmergic environment where tasks do not need assignment — they need only visibility.

### 13.1 Twigs Are Tasks

A twig (§3.10) is a filament that hasn't closed while everything around it has. It protrudes from the branch surface. It is visually obvious. It IS the task board — no separate task management system needed.

Anyone who can see a twig can pick it up:
1. Inspect the twig (what is this unresolved filament about?)
2. Create a commit on the filament with evidence of your work (a resolution, an investigation, a partial fix)
3. Your user tree records the responsibility via mirror commit (§8.2)
4. The twig begins resolving — the filament starts migrating inward if the evidence meets requirements

No assignment authority is needed. No manager delegates. The work is visible. Capable people self-select.

### 13.2 The User Tree IS the CV

Your personal user tree's shape is your professional reputation:

- **Firm slabs** = you consistently deliver complete, evidenced work in each time period
- **Few twigs** = you finish what you start — low unresolved obligation count
- **Diverse branches** = you contribute across multiple roles and domains
- **High confidence** = your work is well-evidenced, properly attested
- **Healthy inward migration** = filaments you touch move from bark to center (open to closed)
- **Thick trunk** = large volume of absorbed, reconciled work flowing to your roots

An employer inspects your tree. They don't read a resume — they see:
- Is this tree firm? (reliable)
- Are there twigs? (overcommitted or negligent)
- Is the bark active? (currently engaged)
- Do evidence twigs reach to reputable sources? (quality connections)
- How deep are the roots? (track record length)

The tree doesn't lie. Every commit is append-only and Merkle-sealed.

### 13.3 The Incentive Loop

The stigmergic model creates a self-reinforcing cycle:

1. **Visible problems** (twigs) attract capable people
2. **Resolving a twig** creates a high-confidence commit on the resolver's user tree
3. **A firm user tree** makes the person more visible and trusted in the community
4. **More trust** means access to higher-impact work (larger twigs, more sensitive branches)
5. **Higher-impact resolutions** make the tree even firmer
6. Loop continues

This works without:
- Central assignment
- Performance reviews
- Star ratings
- Gamification points
- Any authority deciding who does what

The physics of the tree IS the incentive system.

### 13.4 TwigVisibilityIndex — Formal Computation

The TwigVisibilityIndex is a **derived reading**, not a force. It does not create pressure, create ranking, or create commits. It is pure introspection over existing state (contract #24: pressure is emergent, never independent).

**Computation:**

```
TwigVisibilityIndex = f(
    unresolvedDuration,   // time since expected resolution, from template parameter
    evidenceGap,          // 1.0 - orgConfidence (how much evidence is missing)
    localAttention,       // count of presence markers focused near this twig
    scopePermission       // binary gate: does the viewer have disclosure access?
)
```

**Scope gate is non-negotiable.** The order of operations must be:

```
IF hasScopePermission(viewer, branch, disclosureTier):
    THEN computeIndex(twig)
ELSE:
    twig is INVISIBLE — index is never computed
```

Even the computation must not leak existence. A private twig on a restricted branch produces zero signal to unauthorized viewers. No index computation occurs. No attention signal. No metadata about "something hidden here." The twig does not exist for that viewer at any level of abstraction.

**What the index drives:**
- Rendering salience: higher-index twigs are visually larger, more opaque, more attention-grabbing
- Navigation suggestion: SCV may recommend high-index twigs to capable users as potential work
- Aggregation: branch-level twig index aggregate feeds into branch health metrics at higher LOD

**What the index does NOT drive:**
- No commit creation
- No pressure generation (pressure comes from slab firmness gradients, not from the index)
- No ranking in any governance or economic system
- No notification generation (notifications are a separate, consent-based system)

---

## 14. Gravitational Time — The Universal Clock

Time in Relay is the actual rotation of the Earth. The globe turns. Everything sinks. Yesterday's work is lower than today's. Last month's conversations are deeper still. The oldest records are buried beneath the surface like geological strata. You do not need to organize anything into folders or sort by date — time does it for you, constantly, silently, for everyone equally. A conversation from five years ago is deep underground. This morning's meeting is at the surface. You navigate time by looking up or down.

### 14.1 Earth Time

The globe slowly rotates. This rotation IS time. All trees, all branches, all filaments sink at the same rate. This is the universal constant — not configurable, not per-branch, not per-company. It is Earth time for everyone.

### 14.2 Sinking as Template Setting

While earth time is universal, whether a particular tree RESPONDS to it is template-configurable:

- **Operational template** (P2P, municipal services): Sinking = earth time. Transactions must close.
- **Creative template** (video production, music): Sinking = none or milestone-driven.
- **Static template** (file mapping, personal archive): Sinking = none. Just structure.
- **Research template** (astronomy, archaeology): Sinking = earth time for observation freshness.

### 14.3 Branch Time vs Earth Time

- **Earth time** = gravitational sinking. Universal. The globe clock.
- **Branch time** = the helical twist, department cadence, team rhythm. Configurable per template. This is the operational clock for teams to coordinate within.

Both exist simultaneously. Earth time is the environment. Branch time is the schedule.

### 14.4 Astronomical Alignment — Real Earth, Real Sun, Real Moon

Relay is synchronized to the actual Earth, not an abstraction. The Cesium globe renders real-time Earth rotation, real solar position, and real lunar cycles. This alignment must be precise for at least the next 100 years (2026–2126) and is computed from established astronomical ephemeris data, not from approximate models.

**Earth rotation:**
- The globe rotates at real sidereal rate. UTC midnight, noon, dawn, and dusk are computed from actual Earth orientation, not simplified offsets.
- Time zones are derived from real geographic longitude, not from political time zone boundaries (political zones are a governance overlay at the region level, not a physics input).
- The globe's orientation is computed using the IAU Earth rotation model (UT1 + precession + nutation). For the 100-year window, IERS Earth Orientation Parameters provide sub-second accuracy.

**Solar position (critical for sleep cycle regionalization):**
- The Sun's apparent position is computed using the VSOP87 planetary theory (or equivalent JPL DE ephemeris), giving precise solar longitude and declination for any moment in the 100-year window.
- Solar altitude at any geographic coordinate is derived from: observer latitude, observer longitude, solar declination, and hour angle. This determines local sunrise, sunset, solar noon, and twilight times to within ~1 minute accuracy.
- **Daylight duration varies by latitude and season.** At the equator, day and night are roughly equal year-round (~12h each). At 60°N (Helsinki), summer daylight reaches ~19h and winter daylight drops to ~6h. At the Arctic/Antarctic circles, polar day and polar night create 24h extremes. Relay must model this correctly because sleep cycle timing is tied to it.

**Moon cycles:**
- Lunar phase is computed from actual Sun-Earth-Moon geometry (not a 29.5-day approximation). The synodic month varies between 29.27 and 29.83 days.
- Lunar position (right ascension + declination) is computed from ELP/MPP02 or JPL DE ephemeris.
- Moon phase is available as a system variable for templates that use it (tidal cycles, agricultural calendars, cultural/religious observances, game mechanics tied to lunar events).
- Eclipses, supermoons, and other notable lunar events are pre-computed for the 100-year window and available as system events.

**Sleep cycle regionalization:**
- The global sleep cycle duration (e.g., 7h 12m) is a single global parameter voted by the community (frozen contract #43).
- But the **timing** of the sleep cycle is regionalized by solar position: sleep onset is triggered when local solar altitude drops below a configurable threshold (default: civil twilight, solar altitude = -6°). Sleep end is triggered at the corresponding dawn threshold.
- This means: equatorial users have a roughly consistent sleep window year-round. High-latitude users have a sleep window that shifts with the seasons — shorter summer sleep windows (more daylight = later onset), longer winter sleep windows (less daylight = earlier onset).
- The solar altitude threshold for sleep onset and sleep end are separate global parameters (votable). The community can vote to shift the trigger earlier or later relative to actual sunset/sunrise.
- **Extreme latitudes:** During polar day (24h sunlight) or polar night (24h darkness), the sleep cycle falls back to a fixed UTC-offset schedule for that region, computed from the region's nominal longitude. The fallback threshold (latitude at which solar-based timing becomes unreliable) is a global parameter (default: ±66.5°, the Arctic/Antarctic circle).
- **Transition smoothing:** As a region approaches polar conditions, the sleep onset/end times are interpolated between solar-computed and UTC-fixed schedules to prevent abrupt jumps at the threshold latitude.

**Periodic reporting alignment:**
- All periodic system events (Merkle digest publication, reverification windows, key rotation schedules, invite refill cadence, governance epoch boundaries) are aligned to UTC midnight boundaries, not to local time or solar time.
- The 24-hour Merkle digest publication (frozen contract #93) uses UTC day boundaries.
- Reverification windows (frozen contract #72) use calendar days from the user's last verification event, counted in UTC.
- Governance epoch boundaries (for rate-of-change caps, parameter settlement) are aligned to UTC midnight, ensuring all regions experience the same epoch transitions simultaneously.
- **Moon-aligned events (optional template feature):** Templates can optionally align reporting cycles to lunar phases (e.g., agricultural templates that use planting/harvest moon cycles, cultural templates that observe lunar calendars). The system provides `currentLunarPhase`, `nextNewMoon`, `nextFullMoon`, and `lunarDay` as built-in variables for template formula engines.

**Ephemeris data source:**
- The system ships with pre-computed ephemeris tables covering 2026–2126 (100 years) at 1-minute resolution for solar position and 10-minute resolution for lunar position. Total data size: ~50 MB compressed.
- Tables are generated from JPL Horizons or equivalent open-source astronomical computation libraries (e.g., SOFA, Skyfield, DE440).
- The ephemeris tables are versioned and Merkle-sealed. Updates (if needed due to improved astronomical models) are governance-approved template-level commits.

### 14.5 TimeDepthIndex — Navigation Replaces Search

Every artifact in Relay has a `timeDepthIndex` — a derived property computed from its commit position and timebox depth. This is the formal statement of the principle: **time replaces folders/tags/search as the primary organizing axis.**

```
timeDepthIndex = {
    commitPosition,      // sequence number within branch commit log
    timeboxDepth,        // which timebox stratum (0 = surface, N = deep root)
    compressionLevel,    // LOD tier for rendering (full → summarized → hash-only)
    retrievalPath        // filament ride coordinates from surface to this artifact
}
```

**Navigation principle:** "Find" in Relay resolves to "navigate-to-depth," not "keyword hunt." Search exists as a lens — it returns depth coordinates and filament ride paths, not detached result objects. Every search result is anchored to a specific point in the time-space of the tree. You don't get a list of results. You get a set of locations you can fly to.

**The retrievalPath** is the canonical way to reach any artifact: a filament ride (§15) from the current surface position, down through timebox strata, to the target depth. This is the cognitive recovery path — the same path a human follows when thinking "how did we get here?" The path itself contains context: every timebox stratum it passes through shows the state of the world at that time.

**Root compression guarantees:**
- Compression is **lossless** — full fidelity reconstructible on demand from the Merkle archive
- Compression is **Merkle-verifiable** — every compressed stratum's hash chain is intact
- Compression is a **rendering optimization**, not data reduction — the data is always there, the LOD determines how much detail is shown at each depth
- Historians navigating to depth 500 (ancient strata) trigger decompression of that stratum for full-fidelity inspection

**The civilizational claim:** All human knowledge — from last week's invoice to ancient religious texts to geological history — should be organized by WHEN, navigable by DEPTH, and verifiable by cryptographic roots. Two cultures that disagree on categories agree on when things happened. Time is the neutral substrate.

---

## 15. Time Scrubbing — Replay as Navigation

### 15.1 Mechanic

Choose any time window (year, month, week, day, hour, 5 minutes) and the tree renders only filaments active during that period:

- **Full year**: Full tree. Long filaments stretch across branches.
- **Last week**: Only recent activity. Older regions dimmed.
- **Last 5 minutes**: Just fresh bark arrivals. Sparse tree.

Drag the slider back and forth. Watch the tree grow, thicken, wilt, recover over time.

### 15.2 Built on Replay Engine

Every commit is recorded. Any point in time can be rebuilt deterministically. The E3 replay engine verifies that replayed state matches live state exactly (byte-identical golden outputs). If replay diverges from live state: that's a finding, not a bug to hide.

---

## 16. AI and SCV — Filament 3D Cognition

**Stage Gate:** 1→2→3. Stage 1: proposes commits, builds projections (lavender). Stage 2: manages AR overlay, interprets gestures/light/objects, validates achievements, acts as personal trained assistant. Stage 3: validates spells, generates monsters, serves as summoned combat agent in duels.

### 16.1 What an SCV Is

An SCV (Semi-autonomous Coherence Vehicle) is a visible AI agent in the 3D world. It appears as a marker with a label: `SCV: Code Coherence`, `SCV: Procurement`, `SCV: Compliance`. You can see where it is, what it's looking at, what it's doing. It is never hidden.

### 16.2 How AI Thinks in Filaments

The AI reads TREES, not databases. It navigates the same 3D structure as humans — globe, trunk, branch, bark, cell — but at machine speed across ALL branches simultaneously.

When the AI analyzes a problem:

1. **Navigate**: SCV moves to the relevant location. Its marker appears. You watch it arrive.
2. **Trace**: SCV follows evidence twigs across filaments, reads timebox histories, checks confidence scores, detects patterns in cross-sections.
3. **Build projection**: SCV constructs a light blue projection branch showing its reasoning — decision nodes, evidence references, correlation analysis. This IS its thought process, visible and inspectable.
4. **Propose**: SCV generates a proposed commit (a draft filament on the bark). You can see the exact change, the evidence twigs, and the confidence score.
5. **You decide**: Approve or reject. The AI cannot commit without human authority.

### 16.3 3D Cognition

The AI uses spatial relationships as cognitive inputs:

- A cluster of twigs on one section means something different than scattered twigs
- A slab firm on one angular half and wilted on the other = geographically concentrated problem
- Evidence twig distance = how cross-cutting an issue is (close = local, spanning branches = systemic)
- The tree's SHAPE is information the AI reads the same way a human reads a chart

### 16.4 SCV Rules (Frozen)

- SCVs do NOT execute changes. They produce: inspections, findings, proposed commits, recommended flows, evidence bundles.
- SCVs are subject to all frozen contracts: confidence floor, pressure budget, data minimization.
- SCV posts are always marked as AI-generated (visible badge). Confidence depends on evidence quality, same as everyone else.

### 16.5 Named SCV Sub-Components

Every SCV contains two named processing stages that handle user input transformation:

- **Architect** — Intent parser. Takes raw input (voice transcript, gesture signal, light pattern, object detection) and produces a structured IntentPacket describing the action, targets, filters, and parameters. Architect ONLY parses — it never executes, never creates commits, never modifies state. When input is ambiguous, Architect produces ranked candidate intents for the user to disambiguate. Full specification: §47.3.

- **Canon** — Execution planner. Takes a validated IntentPacket from Architect and produces proposed tree operations (queries, projections, commit drafts, navigation commands). Canon ONLY proposes — it never commits. Every Canon output is rendered as a visible lavender projection showing exactly what will happen if approved. Full specification: §47.4.

The pipeline is non-collapsible (frozen contract #37): Input → Architect → Canon → Human approval. No shortcut from raw input to committed filament. These sub-components are internal to every SCV instance and are not separately visible to the user — the SCV marker represents the unified agent. See §48.11 for AI architecture details.

---

## 17. Presence System — The Attention Sensor Network

**Stage Gate:** 1→2. Stage 1: attention sensor network with presence markers and birds/flocks. Stage 2: extends to video presence within user sphere (§39), camera feed, shared AR view, arena presence.

### 17.1 Presence Markers

Every user in Relay has a presence marker: location + gaze direction + current focus target. The attention rate metric is computed by counting presence markers focused on a given location. Presence markers are the SENSOR NETWORK for the attention economy.

### 17.2 Presence Tiers

- **Tier 0** (default): Anonymous dot. No identity revealed.
- **Tier 1**: Identifiable role badge. Explicit consent per session.
- **Tier 2**: Named identity. Explicit consent + policy approval.

### 17.3 Birds and Flocks

Users appear as "birds" — visible entities moving through the 3D world. Schools of birds gathering around a hot topic IS the visual representation of attention. You can see where the flock is.

Trails: optional ephemeral path traces (where I walked, what I inspected). Auto-expire per policy.

---

## 18. Flow Channels — Recorded Procedures

### 18.1 Definition

A Flow Channel is a recorded camera path through the tree with semantic steps. A recipe for navigating a workflow:

1. Navigate to the P2P branch
2. Open the match sheet (bark flattens)
3. Filter for exceptions
4. For each exception: inspect evidence twigs
5. Close the flow

### 18.2 Use Cases

- **Training**: New employees play back recorded flows. Camera guides them through the exact path with annotations.
- **Proximity**: A factory floor procedure recorded at a physical location. Available when workers enter the proximity zone.
- **Audit**: A standard audit procedure recorded as a flow. Auditors follow the same path, ensuring consistency.
- **Governance**: A flow can be voted on and promoted as the official procedure for a role.

### 18.3 Flows as Filaments

A flow IS a filament on a training/procedures branch. It has evidence twigs pointing to the objects it visits. It can be versioned, governance-approved, and replayed.

---

## 19. Governance

### 19.1 Commit Materiality

Work state machine for all material changes:

```
DRAFT -> PROPOSED -> COMMITTED -> REVERTED (visible scar)
```

Material boundary triggers force escalation from DRAFT to HOLD:
- Time threshold (end of session/timebox/reconciliation window)
- Risk threshold (affects payroll, payment, KPI-bound cells)
- Visibility threshold (published to team, shared to channel)
- Dependency threshold (affects downstream sheets/routes/summaries)
- Governance threshold (changes policy, permission, authority)

### 19.2 Stage Gates

Each phase has pass/fail criteria, proof artifacts, and refusal conditions. Quorum gate (30-75% depending on cadence), Approval gate (60-75%), Reconciliation gate (7-30 days), Sunset gate (90-day expiry).

### 19.3 Work Zones

Scope-based access: `zone.<entity>.<dept>.<project>`. Boundary commits define scope. Crossing boundaries requires explicit disclosure + consent.

---

## 20. Cryptographic Architecture

Every action in Relay is sealed with a digital fingerprint. Once something is recorded, it cannot be secretly changed — any tampering visibly breaks the chain, the way cutting a link in a necklace makes the break obvious. Your private data is encrypted so that only the people you authorize can see it. And when you need to prove something without revealing everything — like proving you paid a bill without showing your bank balance — you can share just the proof, not the contents. This is how Relay ensures that truth stays true and privacy stays private.

### 20.1 Core Principles

- Leaf-level encryption; above leaf = hashes + signatures + Merkle roots
- Envelope encryption (one ciphertext + per-recipient wraps)
- Selective disclosure via Merkle inclusion proofs
- The core validates integrity/authorization, NOT plaintext content
- Revocation via explicit commits + key rotation

### 20.2 Root Archive

Roots are Merkle-encrypted permanent archive. Every root cube carries:
- `absorptionHash` (content integrity)
- `merkleAnchor.chainHash` (chain integrity)
- `merkleAnchor.timeboxMerkleRoot` (timebox integrity)
- `merkleAnchor.inclusionProofPath` (verifiable inclusion)

The root's purpose is definitive: full Merkle encryption confirmation of all reconciled content. The permanent, immutable, cryptographically sealed record.

### 20.3 Root Cube Schema

```json
{
  "RootCube": {
    "cubeId": "root.<filamentId>",
    "filamentId": "string",
    "commitIndex": 0,
    "totalMagnitude": "string-decimal",
    "unit": "string",
    "branchPath": "branch.<treeId>.<servicePath>",
    "tags": {},
    "timeboxId": "timebox.<branchId>.<start>-<end>",
    "closedAt": "ISO-8601",
    "absorptionHash": "sha256:...",
    "originRowRef": "row.<moduleId>.<sheetId>.R<row>",
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

Roots are shorter than branches because they do NOT express real time/duration. They show commit after commit — like blocks in a blockchain. Time is compressed; only the sequential record remains.

---

## 21. Templates — Domain Configuration

**Stage Gate:** 1→3. Stage 1: domain configuration, attribute bindings (visual + auditory), color system. Stage 3: adds genre overlay templates (§40.3) for gamification rendering (Sci-Fi, Fantasy, Horror, Military, Adventure).

### 21.1 What a Template Defines

A template is the only thing that changes between a procurement tree and a pothole tree:

- **Branch types**: What service categories exist (P2P, Infrastructure, Geology)
- **Filament schemas**: What columns each row type has (beyond the six universal domains)
- **Evidence rules**: What evidence is required for completeness per filament type
- **Expected resolution cadence**: How long filaments should take to close
- **Sinking behavior**: Earth time (operational), none (static), milestone-driven (creative)
- **KPI bindings**: What metrics drive visual attributes (default, overridable by users)
- **Helical twist period**: Day, week, sprint, quarter
- **Consolidation gate rules**: Financial balance, completeness check, peer review

### 21.2 Template Schema

```json
{
  "TreeTemplate": {
    "templateId": "template.<domain>.<variant>",
    "name": "string",
    "domain": "string",
    "sinkingMode": "earth-time|milestone|none",
    "twistPeriod": "day|week|sprint|quarter|custom",
    "branches": [
      {
        "id": "string",
        "name": "string",
        "filamentSchema": {
          "columns": [
            { "name": "string", "domain": "identity|counterparty|time|magnitude|evidence|lifecycle|extension", "type": "string|number|date|reference|attachment" }
          ],
          "magnitudeColumn": "string",
          "counterpartyColumn": "string"
        },
        "evidenceRules": [
          { "description": "string", "requiredCount": 0, "sourceType": "string" }
        ],
        "expectedResolutionDays": 0,
        "sub": ["recursive branch"]
      }
    ],
    "consolidationGate": {
      "type": "financial-balance|completeness|peer-review|custom",
      "rules": {}
    },
    "defaultAttributeBindings": {
      "slabColor": "magnitude",
      "slabOpacity": "confidence",
      "slabThickness": "commitDensity",
      "slabFirmness": "wiltFactor",
      "branchRadius": "normalizedKPISum",
      "twistRate": "activityPerPeriod",
      "filamentRadial": "lifecycleState",
      "filamentAngular": "approachDirection"
    }
  }
}
```

### 21.3 Configurable Attribute Bindings

All visual attributes are dynamically linkable to metrics — like After Effects expression linking:

- **Per-template defaults**: The P2P template defines default bindings.
- **User overrides**: Any user can re-bind any attribute to any metric.

Bindable visual attributes:
- Trunk height/prominence (default: attention score)
- Branch radius (default: normalized KPI sum)
- Helical twist rate (default: activity/time)
- Slab thickness (default: commit density)
- Slab color (default: magnitude, warm=positive, cool=negative)
- Slab opacity (default: confidence, automatic evidence ratio)
- Slab firmness (default: wilt factor)
- Filament radial position (default: lifecycle state)
- Filament angular position (default: approach direction)
- Filament bark length (default: time alive)
- Root cube density (default: absorption rate)
- Projection branch color: FIXED light blue (non-configurable)

Bindable auditory attributes (sonification):
- Volume (default: attention rate — loud = many eyes, quiet = ignored)
- Pitch (default: acceleration — rising pitch = heating up, falling = cooling)
- Timbre (default: confidence — clear tone = high confidence, distorted = low/uncertain)
- Rhythm (default: branch cadence / helical twist period — faster rhythm = tighter cadence)
- Spatial audio position (default: 3D world location of source — sound comes FROM the event)

Sonification examples:
- Thunder: a lightning event (§23.2) — sudden high-impact filament cascading across many trees
- Rising strings: a discussion going viral (engagement rate climbing)
- Low rumble: a storm building (regional acceleration increasing)
- Settling chord: a region reaching consensus (confidence stabilizing at high values)
- Silence: a dead zone (no engagement, no attention, no activity)

Sound is an output channel, not a mechanic. The tree physics are identical with or without sound. Sonification is an accessibility and immersion binding — deaf users see the same information visually. All auditory bindings follow the same per-template-default + user-override pattern as visual bindings.

**Stage Gate:** 1→2→3. Stage 1: basic auditory attribute bindings (volume, pitch, timbre, rhythm, spatial position). Stage 2: AR-rendered sound effects in video presence. Stage 3: arena atmosphere (thunder, music, audience energy), spell sound effects, combat audio.

### 21.4 Unified Color System

All colors in Relay serve a diagnostic purpose. Nothing is cosmetic. The palette is organized into non-overlapping channels so that any visual element communicates its nature at a glance.

**Source Identity (what created this):**

| Element | Color | Rationale |
|---------|-------|-----------|
| Truth branches/filaments | Natural earth tones (bark brown, heartwood, leaf green) | Organic material — this is real, it grew from events |
| Human projection branches | Light blue | Cool analytical tone — derived from truth, not truth itself |
| SCV/AI projection branches | Lavender / light violet | Clearly "projection" (cool tone) but distinguishable from human blue at a glance — you always know if a human or AI built this analysis |
| Notes (pre-filament) | Translucent white/cream, alpha 0.4 | Ephemeral, not yet committed to any identity |

**Magnitude (what is the value direction):**

| Condition | Color | Channel |
|-----------|-------|---------|
| Net positive magnitude | Warm palette (gold -> amber -> orange) | Slab fill color |
| Net negative magnitude | Cool palette (teal -> slate blue -> indigo) | Slab fill color |
| Neutral / zero magnitude | Desaturated grey | Slab fill color |

**Integrity (how trustworthy):**

| Condition | Visual | Channel |
|-----------|--------|---------|
| High confidence (evidence complete) | Full opacity | Slab opacity (0.0-1.0) |
| Low confidence (evidence missing) | Transparent / faded | Slab opacity |
| Scar (revert) | Burnt amber / rust overlay | Permanent bark mark |
| Migration scar | Same burnt amber + directional indicator | Links to successor filament |

**Activity and Attention (what is happening now):**

| Condition | Color | Where |
|-----------|-------|-------|
| High acceleration (hot) | Hot red -> orange | Globe trunk glow, weather heat |
| Moderate activity | Warm yellow | Globe trunk glow |
| Low/stable activity | Cool blue | Globe trunk glow |
| Zero activity | No glow | Globe trunk |
| Attention concentration | Bright white glow intensity | Trunk/branch glow proportional to presence count |

**Weather overlay (regional/global projections):**

| Phenomenon | Visual |
|-----------|--------|
| Fog (low confidence region) | Desaturated grey translucent overlay |
| Storm (high acceleration region) | Rapid color temperature shifts, flickering glow |
| Lightning (cascade event) | Bright white flash along evidence twig paths |
| Clear skies (healthy region) | No overlay — natural colors visible |
| Pressure front (stable meets unstable) | Visible gradient boundary between regions |

**Status indicators (non-color, overlaid):**

| Indicator | Visual |
|-----------|--------|
| Recategorization pending | Pulsing outline (not fill) around filament |
| Settlement window active | Progress bar overlay |
| Twig (emergent outlier) | No special color — same as filament, the geometry IS the indicator |

**Frozen color rules:**
- Human projections are ALWAYS light blue. SCV projections are ALWAYS lavender. These are non-configurable (frozen contract extension). You must always know at a glance whether a human or AI built a projection.
- Truth is ALWAYS natural/organic palette. Never blue, never violet.
- Magnitude color channel (warm/cool) and integrity channel (opacity) are independent — a slab can be warm and transparent (positive value but low confidence) or cool and opaque (negative value but well-evidenced).

---

## 22. Fractal Scaling

### 22.1 The Fractal Rule

A trunk at one level is a branch at the next level up. The geometry is identical at every scale. Only the template changes.

- Neighborhood trunk -> becomes a branch on the city tree
- City trunk -> becomes a branch on the state tree
- State trunk -> becomes a branch on the country tree
- Company trunk -> becomes a branch on the industry tree

### 22.2 Cross-Level Interaction

A pothole (neighborhood filament) needs city funding to resolve. This is a cross-trunk reference:
- The neighborhood filament links to a city-level resource allocation filament
- Boundary crossing requires disclosure + consent
- The pothole's completeness depends on the city funding filament's status
- The twig is visible at both neighborhood AND city level

### 22.3 Attention Flows Upward

Many unresolved potholes -> residents vote/complain -> attention rises -> neighborhood trunk becomes more prominent -> visible at city level -> drives action. Same mechanism at every scale.

---

## 23. Weather and Wind — Emergent Atmospheric Analytics

Weather in Relay is not a mechanic. It is an emergent vocabulary for describing aggregate tree behavior at regional and global scale. All weather phenomena are computed projections over existing branch physics. None create new filaments or commits.

### 23.1 Wind

Wind is the aggregate directional tendency of branch movements across many trees in a region over a time window.

Computation: for each tree in the region, measure the (l, r, theta) drift of all branches over the window. Sum the directional vectors. The resultant is the wind vector.

**Company-level wind:** All branches on a company tree leaning in the same angular direction — counterparties from that quadrant are causing correlated effects (demand surge, confidence deficits, payment delays). The company is experiencing directional pressure.

**Regional wind:** Many trees in a geographic region experiencing correlated branch movements. A new regulation, an economic shift, a seasonal demand pattern. At CITY LOD, all trees lean the same way.

**Global wind currents:** Macro-scale correlated branch movements visible at GLOBE LOD. A commodity price shift causes all manufacturing trees to lean simultaneously. A pandemic causes healthcare trees to grow while hospitality trees wilt. These correlated patterns are global wind.

### 23.2 Weather Vocabulary

All computed from existing filament data:

| Phenomenon | Source Data | Visual |
|-----------|------------|--------|
| **Wind** | Aggregate branch movement direction | Trees leaning in correlated direction |
| **Heat** | Acceleration (§0.2) at regional scale | Warm/hot color temperature on globe surface |
| **Storms** | Simultaneous high-acceleration across many trees | Rapid flickering activity, many trunks rising at once |
| **Lightning** | Single high-impact filament causing cascade across many trees | Sudden bright evidence twigs spanning many trees simultaneously |
| **Fog** | Regional low-confidence zone (many low-opacity slabs) | Translucent, indistinct region — data exists but poorly evidenced |
| **Clear skies** | Stable, high-confidence region (all trees firm, high opacity) | Crisp, visible, navigable region |
| **Pressure systems** | §10 pressure physics at regional scale | High-pressure = firm region, low-pressure = widespread confidence deficits |
| **Weather fronts** | Boundaries where stable regions meet unstable ones | Visible edge between firm/clear and wilted/foggy zones |

### 23.3 Weather Forecast

SCV AI agents (§16) act as meteorologists:

1. Read current tree states across a region
2. Identify trends: wind direction shifting, pressure dropping, heat building
3. Compute rate of change and project forward
4. Generate a **light blue projection branch** showing the forecast: "Storm likely in Tel Aviv tech sector within 2 weeks based on accelerating confidence deficits across 15 companies"
5. The forecast projection has inspectable decision nodes — anyone can see what data the AI is reading and challenge its reasoning

Forecasts are projections. They are never truth. They carry their own confidence score based on the quality of the underlying evidence patterns.

### 23.4 Weather Is Fractal

The same weather vocabulary applies at every scale:
- Company weather: internal branch patterns
- Neighborhood weather: local service tree patterns
- City weather: aggregated neighborhood patterns
- Country weather: aggregated city patterns
- Global weather: planetary-scale patterns

A company experiencing an internal storm (rapid activity on all branches) is like a single cloud. Many companies storming simultaneously is a regional weather system. The vocabulary scales with the LOD.

---

## 24. Search in 3D

### 24.1 Two Modes

**Visual navigation**: Zoom, pan, follow branches, read bark. Spatial cognition for exploration and pattern recognition.

**Text search**: Type a query. Results appear as HIGHLIGHTED FILAMENTS on the tree — you see WHERE in the 3D structure each result lives. Which branch, which timebox, what lifecycle state, what neighbors. Search carries spatial context.

### 24.2 Search as Diagnosis

A search for "all overdue invoices over $50K" highlights twigs across all branches. If they cluster on one branch: systemic problem. If scattered: isolated issues. The 3D context IS the analysis.

---

## 25. 2D/Headless Parity

### 25.1 Object Equivalence

Every 3D object has a 2D equivalent with a stable canonical ID (same in both views). The zoom-to-flat transition at CELL LOD IS the 2D view — it's not a separate interface, it's the same interface at a different LOD.

### 25.2 Headless Mode

The system runs without 3D rendering, producing identical data outputs. Route ingest, match rebuild, summary formulas, KPI bindings, commits — all produce byte-identical results in headless and 3D modes.

### 25.3 Import/Export

Any Relay state is exportable to flat files (CSV/JSON) and re-importable through routes. Organizations unwilling to adopt 3D can use Relay as a data-flow coordination engine.

---

## 26. Frozen Contracts

These rules are non-negotiable. They cannot be overridden by templates, governance, or user preference.

1. **Append-only**: Facts are never modified. Only new commits.
2. **Visible scars**: Reverts create new commits, not deletions.
3. **Double-entry**: Every material commit carries balanced TransferPacket + ResponsibilityPacket.
4. **Filament = row**: One atomic event = one row = one filament. Not a cell, not a sheet.
5. **Six domains required**: Every filament carries identity, counterparty, time, magnitude, evidence, lifecycle.
6. **Bark = spreadsheet**: The sheet wraps the branch. It is not a separate object.
7. **Gravity = earth time**: Universal sinking. Not configurable per branch (only per template's sinking mode).
8. **Twigs are emergent**: No special twig detection. The geometry produces them naturally.
9. **Confidence is automatic**: evidence_present / evidence_required. No human override of the ratio.
10. **Human projections are light blue**: Always. Even when promoted. Never confused with truth. SCV/AI projections are lavender (see contract #27).
11. **Projection branches are terminal**: They do not flow to trunk or roots. They are not balancing factors.
12. **SCVs do not execute**: They propose. Humans decide.
13. **Presence defaults to Tier 0**: Anonymous until explicit consent escalates.
14. **Nothing orbits**: Everything flows from bark inward to root. No objects circling other objects.
15. **Deterministic replay**: Same inputs always produce same outputs.
16. **Conservation**: Material state transfers must net to zero per unit type.
17. **Notes expire**: Unengaged Notes fade per TTL. No permanent clutter.
18. **Merkle roots cross-anchor**: System tree and user tree root archives are cross-verifiable.
19. **Dual confidence sovereignty**: Organizational confidence (template-driven opacity) and global confidence (vote-ranked score) never override each other. Both render independently.
20. **Votes cannot override templates**: Community votes affect global ranking and can trigger governance proposals, but cannot directly modify a template's evidence rules or organizational confidence calculations.
21. **Recategorization is migration**: Moving a filament between branches requires a migration commit (§4.6). Direct `branchId` mutation is forbidden. Original filament remains as historical truth.
22. **Vote eligibility gate**: Tier 0 anonymous accounts cannot vote. Minimum Tier 1 identity + engagement history required.
23. **Vote decay, action permanence**: Votes decay over time. But executed migration commits and governance actions are permanent append-only records regardless of subsequent vote decay.
24. **Pressure is emergent**: Pressure (structural integrity forces) is computed from confidence deficits across timebox slabs. It is never an independent variable, never manually assigned, never decorated. The wilt physics produce it.
25. **Parameters are voted medians**: Operational parameters are weighted medians of community votes, never hardcoded constants. Exception: frozen contracts themselves are not votable.
26. **Filters are client-side**: Filter tolerances are view-state rendering masks. They never mutate truth, never create commits, never affect what other users see. Branch physics are computed from ALL filaments regardless of any user's filter settings.
27. **SCV projections are lavender**: AI-generated projection branches are always lavender/light violet — distinguishable from human projection branches (light blue) at a glance. You must always know whether a human or AI built a projection. Non-configurable.

---

## 27. Current Build Status

### 27.1 Proven Phases — Planar Era Baseline (All PASS with Proof Artifacts)

The following phases were completed and proven under the **planar rendering model** before this architectural revision. They represent the functional baseline: commit semantics, data pipelines, state management, replay, crypto, and presence all work. The geometry model changes (bark-as-cylinder, filament-as-row) will be applied as an evolution of the existing primitive pipeline.

**Important:** These proofs were verified against planar geometry. BARK-CYLINDER-1 sub-phase BC1-f (regression gate) must re-validate all rendering-dependent proofs against the new cylindrical model. Non-rendering proofs (replay, crypto, headless, presence logic) are expected to pass unchanged. Rendering-dependent proofs (scaffold, megasheet, lifeline, camera ride, flyby) may require updated visual baselines.

**Data + Logic (geometry-independent, expected to pass unchanged):**
- A0-A0.4: Engine gates, formula engine, timebox filament length, spine aggregation
- B1-B4: P2P fact sheets, match sheets, summary sheets, KPI branch mapping
- C0: Route engine (config-driven data flow, provenance, mock streams)
- W0-W2: Material work-mode chain, PROPOSE/COMMIT
- D0: Scale and stress (deterministic FPS, policy split)
- D1: Inter-branch aggregation (branch -> trunk bands)
- HEADLESS-0: Headless parity (byte-identical data, no rendering)
- E3-REPLAY-1: Deterministic replay (golden hashes over data, not geometry)
- E1-CRYPTO-1: Merkle chain integrity (operates on commits, not positions)
- AC0-CONTAINER-1: Accounting container (data layer)
- PRESENCE-STREAM-1: Presence bus (logic layer)
- PRESENCE-COMMIT-BOUNDARY-1: Call summary boundary (logic layer)
- V93-DATA-SALVAGE-1, V93-TRUNK-SEED-BRIDGE-1, V93-VOTE-AGG-BRIDGE-1: Migration bridge (data layer)

**Rendering + Visual (must be re-validated after BARK-CYLINDER-1):**
- Phase 0-2.1: Cesium world boot, topology, views, boundaries, primitives migration
- D-Lens-0: Focus frame (camera + dimming + breadcrumb)
- UX-1.1-1.3: Universal Object Contract, Capability Buds, Inspector Context
- Globe Restores: GLOBE-RESTORE-0 through 4, 3A, USP-1, HUD-1, BOUNDARY-A1, VOTE-A2, RESTORE-PARITY
- VIS-TREE-SCAFFOLD-1, HEIGHT-BAND-1, VIS-MEGASHEET-1: Visual grammar
- CAM0.4.2-FILAMENT-RIDE-V1: Camera ride (planar path -> must adapt to cylindrical path)
- PRESENCE-RENDER-1: Presence rendering (billboard placement relative to surface)
- DEMO-FLYBY-POLISH-1: Flyby choreography (camera path relative to branch geometry)
- VIS-LIFELINE-AMBIENT-1: Lifeline rendering (path through branch geometry)
- HUD-CONSOLIDATION-1, NODE-RING-RENDER-1, BASIN-RING-1: Visual elements
- COMPANY-TEMPLATE-FLOW-1, VOTE-COMMIT-PERSISTENCE-1: UI/visual components
- FILAMENT-LIFECYCLE-1, FILAMENT-DISCLOSURE-1: Filament rendering aspects
- LAUNCH-FIX-1, SCOPE-COHERENCE-1, ATTENTION-CONFIDENCE-1: Visual gates

### 27.2 Build Order (New Architecture Implementation)

The following sequence implements the bark-cylinder model on top of the proven foundation. Each slice follows the established process: SPEC -> IMPLEMENT -> PROOF -> COMMIT -> INDEX.

**Tier 1 — Core Geometry (Buildable in Sequence)**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 1 | **BARK-CYLINDER-1** | Refactor branch rendering from flat sheet planes to cylindrical bark geometry. Filament rows wrap the branch surface. Basic zoom-to-flat at CELL LOD. | Proven foundation | §3.1-3.3, §32 |
| 2 | **FILAMENT-ROW-1** | Revise filament identity from cell-level to row-level. `originCellRef` -> `originRowRef`. Magnitude from designated column. Six universal domains enforced. | BARK-CYLINDER-1 | §4, §0.3, §31 |
| 3 | **GRAVITY-SINK-1** | Implement gravitational sinking along branch length. Earth time drives downward motion. Template-configurable sinking mode (earth-time, milestone, none). | FILAMENT-ROW-1 | §14, §3.11 |
| 4 | **TREE-RING-1** | Implement cross-section dual encoding. Radial = lifecycle state (bark to center). Angular = approach direction (counterparty vector). | BARK-CYLINDER-1 | §3.4 |
| 5 | **HELIX-1** | Implement helical twist along branch length. Configurable period per template (day/week/sprint/quarter). Filaments follow the spiral grain. | BARK-CYLINDER-1 | §3.5 |
| 6 | **SLAB-REVISION-1** | Revise timebox slabs: magnitude as color (warm/cool palette, not wall extrusion), confidence as automatic evidence ratio (opacity), firmness as wilt input. | TREE-RING-1 | §3.6 |

**Tier 2 — Emergent Physics**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 7 | **TWIG-1** | Implement twig emergence from unclosed filaments at old timeboxes. Emergent from (l, r, theta) coordinates — no special detection code. | GRAVITY-SINK-1, TREE-RING-1 | §3.10 |
| 8 | **WILT-1** | Implement wilt model with emergent branch deformation. Adjacent wilted slabs = branch droops. Collision physics: firm slabs resist camera, wilted slabs yield. Camera damping through uncertain regions. Pressure physics (§10) emerges from heterogeneous slab firmness. | SLAB-REVISION-1 | §3.7, §3.8, §10, §29.4 |
| 9 | **CONFIDENCE-1** | Implement automatic confidence physics. Template-defined evidence rules. `evidence_present / evidence_required`. Cross-company evidence references. Policy commits for rule changes. | SLAB-REVISION-1, FILAMENT-ROW-1 | §9 |
| 10 | **SCAR-1** | Implement visible scar rendering for reverts. Scars are new commits with permanent bark marks. Scar confidence tracked independently. | FILAMENT-ROW-1 | §4.5 |

**Tier 3 — Analysis and Projection**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 11 | **PROJECTION-1** | Implement projection branches (light blue). Input funnel, decision nodes (inspectable), alignment zone, Excel terminus, outlier twigs. Promotion via governance. No trunk/root flow. Replayable. | BARK-CYLINDER-1, FILAMENT-ROW-1 | §6 |
| 12 | **ATTRIBUTE-BIND-1** | Implement configurable attribute binding system. Per-template defaults + user overrides. All visual attributes dynamically linkable to any metric (After Effects style). | SLAB-REVISION-1, HELIX-1 | §21.3 |
| 13 | **TIME-SCRUB-1** | Implement time window selector and temporal rendering filter. Choose any window (year to 5 minutes), tree renders only active filaments. Built on E3 replay engine. | GRAVITY-SINK-1 | §15 |
| 14 | **CONSOLIDATION-1** | Implement trunk consolidation gate. Cross-branch reconciliation per template rules (financial balance, completeness, peer review). Unreconciled content held at trunk. | GRAVITY-SINK-1, CONFIDENCE-1 | §2.2, §30 |

**Tier 4 — Social and Identity**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 15 | **NOTE-1** | Implement unified Note system (DraftNode + sticky note). TTL, postable on any surface, conversion to filament on multi-party engagement, ephemeral rendering. | BARK-CYLINDER-1 | §5 |
| 16 | **SOCIAL-1** | Implement social mechanics. Note -> filament conversion. Conversation growth (each response = commit, filament extends by l). Evidence propagation. Voting as deliberate stance distinct from commenting. Buried resurrection. | NOTE-1, CONFIDENCE-1 | §7 |
| 17 | **USER-TREE-1** | Implement user tree with responsibility mirror. Same tree mechanics. CommitId linking TransferPacket + ResponsibilityPacket. Privacy tiers (Tier 0/1/2). Reputation through shape, not scores. Stigmergic self-assignment (§13). | FILAMENT-ROW-1, CONFIDENCE-1 | §8, §13, §30.2 |
| 18 | **GLOBE-METRICS-1** | Implement three globe metrics (engagement rate, attention rate, acceleration/heat). Trunk prominence rendering (height=votes, glow=attention, color=heat). | SOCIAL-1, USER-TREE-1 | §0.2, §1.2 |

**Tier 5 — Navigation and Spatial**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 19 | **SEARCH-3D-1** | Implement 3D spatial search with highlighted results on tree. Results show WHERE in structure (branch, timebox, lifecycle). Pattern detection from clustering. | BARK-CYLINDER-1, FILAMENT-ROW-1 | §23 |
| 20 | **FLOW-1** | Implement Flow Channels as recorded camera paths with semantic steps. Flows are filaments on training/procedures branch. Governed, versioned, replayable. | BARK-CYLINDER-1 | §18 |
| 21 | **PROXIMITY-1** | Implement proximity channels. BLE/Wi-Fi detection, approach angle measurement, anti-spoof layered constraints. Act-only-when-present rule. | NOTE-1, FILAMENT-ROW-1 | §28 |
| 22 | **FRACTAL-1** | Implement fractal scaling. Trunk-at-one-level = branch-at-next. Cross-trunk references with disclosure + consent. Attention flows upward through fractal hierarchy. | GLOBE-METRICS-1, CONSOLIDATION-1 | §22 |
| 23 | **VOTE-GOVERNANCE-1** | Implement global vote-ranked confidence, vote eligibility gates (Tier 1+, engagement history), vote decay (exponential, configurable half-life), vote-driven migration commits (supermajority + hysteresis), dual confidence rendering (organizational opacity + global ranking score). | SOCIAL-1, USER-TREE-1, GLOBE-METRICS-1 | §7.4-7.7, §9.4-9.5, §4.6 |
| 24 | **PARAM-GOVERNANCE-1** | Implement parametric governance (continuous weighted-median voting on system parameters at global/branch/template scope). Filter tolerance slidebars (personal overrides on global defaults). Fraud routing to proximity reverification. | VOTE-GOVERNANCE-1, PROXIMITY-1 | §11, §12 |

**Tier 6 — Stage Gate 2 (AR Interaction Layer)**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 25 | **VIDEO-PRESENCE-1** | Implement user sphere video presence with camera feed integration. Bi-directional video within the globe context. User sphere positioning relative to tree location. | PROXIMITY-1, USER-TREE-1 | §39.1 |
| 26 | **AR-OVERLAY-1** | Implement SCV-managed AR graphics overlay on video feed. Pre-designed graphic asset library. Voice/gesture summoning of assets. Shared view rendering for participants. | VIDEO-PRESENCE-1 | §39.1 |
| 27 | **OBJECT-INTERFACE-1** | Implement physical object detection and mapping. Camera-based object recognition. User-trainable SCV object vocabulary. Sword-blade-to-tree mapping as reference implementation. | AR-OVERLAY-1 | §39.2 |
| 28 | **LIGHT-COMM-1** | Implement light-based communication detection. Reflected light angle detection. Light signature classification. SCV interpretation of light signals as commands. | OBJECT-INTERFACE-1 | §39.3 |
| 29 | **ACHIEVEMENT-1** | Implement personal achievement system. Pre-mapped achievement definitions. SCV validation against physics laws. Evidence recording on user tree. Progressive capability unlock per achievement. | LIGHT-COMM-1, USER-TREE-1, CONFIDENCE-1 | §39.4 |
| 30 | **MULTI-RESOURCE-1** | Implement multi-resource economy. Engagement credits (base), achievement tokens (advanced), active capacity (limit). Resource-gated functionality. Double-entry resource transfers. | ACHIEVEMENT-1, PARAM-GOVERNANCE-1 | §41 |

**Tier 7 — Stage Gate 3 (Game Layer) — Requires Founder Key Activation**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 31 | **FOUNDER-KEY-1** | Implement founder key primitive. Activation condition checks (parameter thresholds). Founder account validation. Irreversible global activation. Pre-activation inert state for all Stage 3 content. | MULTI-RESOURCE-1, PARAM-GOVERNANCE-1 | §44 |
| 32 | **ELEMENT-DETECT-1** | Implement environmental element detection from camera feed. Fire, smoke, rain, light, snow, wind, earth classification. Element presence enables corresponding magic type. Geographic capability mapping. | FOUNDER-KEY-1, AR-OVERLAY-1 | §43 |
| 33 | **SPELL-ENGINE-1** | Implement spell system. Personal spell library as user tree filaments. Element + gesture + object → SCV action mapping. Spell validation, AR rendering, Stage 1 commit resolution. Shared spell definitions. | ELEMENT-DETECT-1, LIGHT-COMM-1 | §43.2, §43.3 |
| 34 | **GENRE-TEMPLATE-1** | Implement genre overlay templates. Sci-Fi, Fantasy, Horror, Military, Adventure rendering layers. Monster/quest visualization over real-world challenges. Community genre selection per project. | SPELL-ENGINE-1, ATTRIBUTE-BIND-1 | §40.3 |
| 35 | **MONSTER-ECONOMY-1** | Implement monster generation AI. Challenge stubs at all scales (microbe to galaxy). AI-generated monsters from global parameters. Spawn rate, reward magnitude, difficulty curve as governed parameters. Virtual and real-mapped monster distinction. | GENRE-TEMPLATE-1, PARAM-GOVERNANCE-1 | §40.4, §40.5, §41.3 |
| 36 | **DUEL-1** | Implement duel mechanics. Challenge protocol, arena setup, real-time spell combat, audience engagement, community vote resolution, resource transfer, event filament recording. | SPELL-ENGINE-1, VOTE-GOVERNANCE-1, MULTI-RESOURCE-1 | §42 |

**Tier 8 — Voice and Infrastructure**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 37 | **VOICE-PIPELINE-1** | Implement Whisper STT integration (local, configurable model size), Architect intent parser (voice → structured command), Canon execution planner (intent → tree operation proposals). Command mode + stream mode. Permission enforcement. Transcript-as-evidence. | AR-OVERLAY-1, USER-TREE-1 | §47 |
| 38 | **INFRA-BOOTSTRAP-1** | Implement centralized backend MVP: commit persistence, WebSocket propagation, REST API surface, identity Tier 0/1, storage hot/warm tiers, basic auth. Minimum viable deployment for single-company tree. | BARK-CYLINDER-1 | §48.1-48.5 |
| 39 | **INFRA-SCALE-1** | Implement federation layer: regional commit routing, cross-region Merkle verification, server-side globe LOD aggregation, offline commit queue + reconnect reconciliation, load testing framework. | INFRA-BOOTSTRAP-1, FRACTAL-1 | §48.3, §48.8, §48.9, §48.16 |

### 27.3 Implemented Branch Behavior (Complete as of 2026-02-18)

The following is the exhaustive record of every branch behavior the system currently covers. No aspirational items. Every entry corresponds to running code with proof coverage.

---

#### 27.3.1 Geometry & Layout

**Three rendering modes:**

| Mode | Activation | Geometry |
|------|-----------|----------|
| **LAUNCH_CANOPY** | Default launch profile (`_launchVisuals=true`, `_scaffoldMode=false`) | Radial canopy with 3 concentric tiers. Branches curve from trunk top to tier hub positions via 3-point Bezier (start, mid-lifted, hub). |
| **TREE_SCAFFOLD** | T key toggle (`_relayRenderMode='TREE_SCAFFOLD'`) | Branches originate at trunk top, spread radially outward + upward. 400m rise. Height offset from attention/confidence (0-120m). Arc lift `sin(t*π)*80` in middle. |
| **Legacy parallel ribs** | Fallback when neither mode active | Parallel ribs along +East axis with north offset separation between branches. |

**Cylindrical corridor geometry (all modes):**
- Three tapered segments per branch:
  - Segment A (0-35%): thick at base (`radiusThick * 2`)
  - Segment B (35-75%): medium (`radiusMedium * 2`)
  - Segment C (75-100%): thin at tip (`radiusThin * 2`)
- Rounded corners (`CornerType.ROUNDED`)
- Branch frames computed at each sample point: `{T, N, B}` orthonormal basis stored in `branch._branchFrames`
- World positions stored in `branch._branchPositionsWorld`, ENU in `branch._branchPointsENU`
- World endpoint stored in `branch._worldEndpoint` (last position)

**Branch positioning per mode:**
- Scaffold: radial angle = `branchIndex * (2π / branchCount)`, length from `CANONICAL_LAYOUT.branch.length` (default 300m)
- Canopy: Bezier curve to tier hub position
- Legacy: sequential parallel offset along north axis

---

#### 27.3.2 Dual Confidence Physics (Contract #44)

**`computeOrgConfidence(objectId)`** — evidence-based, 0..1:
- +0.2 if timebox exists for this object
- +0.3 if evidenceRefs exist
- +0.2 if any filament disclosure >= WITNESSED
- -0.1 per missing ref
- Normalized by theoretical max (0.7) to produce 0..1 range
- Log: `[CONF] id=<branch> orgConf=<val> globalConf=<val> breakdown=tb:<n>,ev:<n>,disc:<n>,vote:<n>`

**`computeGlobalConfidence(objectId)`** — vote-based, 0..1:
- 1.0 if `node.voteStatus === 'PASSED'`
- 1.0 if filament's owning branch has `voteStatus === 'PASSED'`
- 0.0 otherwise
- No intermediate values (binary for now; expandable to vote alignment ratio)

**`computeConfidence(objectId)`** — DEPRECATED TRAP:
- Emits `[REFUSAL] reason=BLENDED_CONFIDENCE_CALLED`
- Falls back to `computeOrgConfidence` for safety
- Must never be called by active code

**Aggregation:**
- `aggregateOrgConfidence(scopeNodeId)` — fractal rollup: trunk → avg of branches → avg of sheets
- `aggregateGlobalConfidence(scopeNodeId)` — same fractal rollup, independent channel
- `aggregateConfidence()` — DEPRECATED TRAP, emits `[REFUSAL] reason=BLENDED_AGGREGATE_CALLED`

---

#### 27.3.3 Attention Physics

**`computeAttention(objectId)`** — multi-signal weighted product, 0..1:
- Collects all filaments where `fil.branchId === objectId`
- Lifecycle weight: `OPEN:0.6, ACTIVE:0.8, SETTLING:0.5, CLOSED:0.3, ARCHIVED:0.1, REFUSAL:0.9`
- Disclosure weight: `PRIVATE:0.2, WITNESSED:0.5, PUBLIC_SUMMARY:0.7, FULL_PUBLIC:1.0`
- Vote weight: `NONE:0.2, PENDING:0.4, PASSED:0.6, REJECTED:0.9`
- Product of max signals, normalized to 0..1
- Log: `[ATTN] id=<branch> attn=<val> lifecycle=<maxLC> disclosure=<maxDT> vote=<maxVS>`

**`aggregateAttention(scopeNodeId)`** — fractal rollup:
- Trunk level: weighted max of branch attention values (weight by filament count)
- Branch level: weighted average of sheet attention values (weight by filament count)

---

#### 27.3.4 Height Bands (Scaffold Mode Only)

Six bands define semantic elevation thresholds:

| Band | Height (m) |
|------|-----------|
| CELL | 300 |
| SHEET_MIN | 300 |
| SHEET_MAX | 600 |
| BRANCH | 2000 |
| COMPANY | 2400 |
| REGION | 3000 |

**Height offset computation:**
- Only active when `_relayRenderMode === 'TREE_SCAFFOLD'`
- Max offset: 120m
- Formula: `maxOffset * (0.7 * attention + 0.3 * orgConfidence) + statePenalty`
- State penalty: -20m if `voteStatus === 'REJECTED'`
- Clamped to `[0, maxOffset]`

**Indeterminate guard:**
- Height offset = 0 if `orgConf < 0.3` OR `missingRefs.length > 0`
- Result: `INDETERMINATE` (no lift)
- Log: `[HEIGHT] indeterminate id=<branch> orgConf=<val> missing=<n>`

**Elevation invariant:**
- Requires at least one filament with disclosure >= WITNESSED AND lifecycle >= ACTIVE
- If no qualifying filament exists: offset = 0, result = INDETERMINATE
- Logs: `[PRESSURE] branch=<id> aggregate=<val> contributors=[<fids>] threshold=0.3 result=<val>`
- Logs: `[HEIGHT] branch=<id> offset=<n> band=BRANCH attn=<val> orgConf=<val>`

---

#### 27.3.5 LOD & Visibility

| LOD Level | Branch Visibility Rule | Sheet Detail |
|-----------|----------------------|--------------|
| **GLOBE / REGION** | Only branches with `voteStatus === 'PASSED'` rendered. Vote filter active. | Suppressed |
| **COMPANY** | All branches visible regardless of voteStatus. Vote filter overridden. | Suppressed (`suppressSheetDetail=true`) |
| **SHEET** | All branches visible. Selected sheet expanded. | Expanded for selected sheet only |
| **CELL** | All branches visible. Fully flat 2D grid for focused cell. | Fully expanded |

**Vote filter logging:**
- `[VIS] voteFilter LOD=<lod> visible=<n> hidden=<n>` (globe/region)
- `[VIS] voteFilter LOD=<lod> override=ALL` (company)

**Sheet detail suppression:**
- `expandedSheetsAllowed` = false when `scope === 'company'` or LOD >= COMPANY
- `expandedSheetsAllowed` = true when `scope === 'sheet'` or `scope === 'cell'`
- Log: `[VIS2] expandedSheetsAllowed=<bool> scope=<scope>`
- Log: `[VIS2] suppressSheetDetail=<bool> expandedSheetsAllowed=<bool> selectedSheet=<id|none> lod=<lod>`

**Company collapsed rendering:**
- Department spines rendered (thick yellow highlight on trunk-direct branches)
- Sheet tiles rendered as small 2D proxies (not full detail)
- Log: `[VIS2] companyCollapsed result=PASS sheetsRendered=0 lod=COMPANY scope=company expandedSheetsAllowed=false`
- Log: `[VIS2] deptSpinesRendered count=<n>`

---

#### 27.3.6 Voting & Governance

**Vote statuses:** `PASSED`, `PENDING`, `REJECTED`, `NONE`

**Decision application (`applyGovernanceDecisionToBranch`):**
- Maps governance topic state → branch voteStatus:
  - PASS/COMMIT → `PASSED`
  - FAIL/VETO/REFUSAL → `REJECTED`
  - All other → `PENDING`
- Persists to localStorage (`RELAY_VOTE_STORE_KEY`)
- Emits scar log for REJECTED: `[SCAR] applied branch=<id> reason=voteRejected result=PASS`
- Log: `[VOTE] decision branch=<id> result=<outcome>`

**Vote simulation (`relaySimulateGovernanceDecision`):**
- Creates governance topic for branch
- Casts votes deterministically (3 votes, quorum-based)
- Closes topic and applies decision
- Used for demo/proof scenarios

**Vote persistence:**
- Branch voteStatus stored in localStorage on every change
- Restored on boot from localStorage
- Log: `[VOTE] restore <id>=<status>` per branch

**Vote summary:**
- `updateHudVoteSummary()` counts PASSED/PENDING/REJECTED across all branches
- Log: `[HUD] votes summary=PASS passed=<n> pending=<n> rejected=<n>`

---

#### 27.3.7 Camera & Navigation

**Basin focus:**
- Double-click trunk enters company focus mode
- Camera locks to branch bounding sphere
- Log: `[CAM] basinFocus settled target=<trunk> distM=<n> pitch=<n>`
- `DEFAULT_BASIN_RADIUS_BY_TYPE.branch = 6000`

**Branch walk API:**
- `relayEnterBranchWalk(branchId)` — start branch navigation
- `relayBranchWalkNext()` / `relayBranchWalkPrev()` — step through branches
- `relayExitBranchWalk()` — exit branch navigation
- `relayGetBranchWalkState()` — read current state
- Log: `[MOVE] branch-step from=<id> to=<id>`
- Log: `[MOVE] mode=branch target=<branchId>`

**Department entry:**
- `relayEnterDepartment(branchId)` — enter branch focus (alias for focus mode)
- `relayEnterFocus({ type: 'branch', id })` — routes to `enterFocusMode()`

**Focus breadcrumb:**
- `focusCrumbBranch` updated with branch name/id on focus change
- Parent chain resolution: `findParentChain()` finds `parentBranch` and `parentTrunk`

**Keyboard:**
- `E` — enter nearest sheet (child of focused branch)
- `Esc` — exit sheet/branch context, return to FreeFly
- `T` — toggle scaffold/canopy mode
- `L` — toggle LOD lock

---

#### 27.3.8 HUD & Display

**Metrics readout (Tier 2 HUD):**
- Displays `OrgConf: X% | GlobConf: Y% | Attn: Z%` for focused branch
- Requires focus target to be active
- Dual confidence shown separately, never blended

**Filament ride HUD:**
- Displays `OrgConf: X% | GlobConf: Y% | Attn: Z% | Commits: N | Contributors: N`
- Per-stop epistemic state along filament path

**Vote summary bar:**
- Shows `PASS: N | PENDING: N | REJECTED: N` across all branches

---

#### 27.3.9 Department Spines

**Rendering (`renderDepartmentSpineEmphasis`):**
- Thick highlight (10px width) along trunk-direct branches
- Color: yellow (`#ffeb3b`) with alpha 0.5
- Only rendered when `suppressSheetDetail === true` (company collapsed view)
- Counted in `primitiveCount.deptSpines`
- Log: `[VIS2] deptSpinesRendered count=<n>`

---

#### 27.3.10 Alpha & Opacity

| Property | Default | Theme Override | Notes |
|----------|---------|----------------|-------|
| Branch corridor alpha | 0.18 | `bt.branch.alpha` | Readability-tuned for launch |
| Emissive alpha | 0.28 | `bt.branch.emissiveAlpha` | Reduced interior detail competition |
| Rib scale | 0.18 | — | Width floors for structural look (launch only) |
| Flow pulse | +0.25 | — | Additive when `branch._flowPulseUntil` active |

---

#### 27.3.11 Filament Attachment

**Sheet attachment at branch endpoint:**
- Attachment index = last frame in `parent._branchFrames`
- Attachment position = `parent._branchPointsENU[attachIndex]`
- Sheet normal = `-T` (anti-parallel to branch tangent at endpoint)
- Canonical rule: sheet face always points AWAY from branch growth direction

**Per rendering mode:**
- Scaffold: sheet at branch endpoint, normal from frame
- Canopy: sheet placed via `computeCanopyPlacement()` with tier-based positioning
- Legacy: sheet at branch endpoint with computed normal

**Junction markers:**
- Small cyan markers at trunk→branch attachment points
- Position: first ENU sample on branch curve (`branch._branchPointsENU[0]`)
- Only rendered in launch mode (`RELAY_LAUNCH_MODE`)

---

#### 27.3.12 Backing Refs & Data Model

**`getBackingRefs(objectId)`** for branches returns:
- `filamentIds`: all filaments where `fil.branchId === objectId`
- `timeboxIds`: collected from branch node's `timeboxes` array
- `evidenceRefs`: evidence pointers from all backing filaments
- `missingRefs`: references that cannot be resolved

**Branch node properties (demo tree):**

| Property | Example | Purpose |
|----------|---------|---------|
| `id` | `branch.finance` | Stable ID (§32) |
| `type` | `'branch'` | Node type discriminator |
| `name` | `Finance & Accounting` | Display label |
| `parent` | `'trunk.avgol'` | Parent trunk reference |
| `lat`, `lon`, `alt` | 32.08, 34.78, 100 | Globe position |
| `voteStatus` | `'PASSED'` / `'PENDING'` / `'REJECTED'` | Governance state |
| `timeboxes` | Array of `{timeboxId, commitCount, openDrifts, eriAvg, scarCount}` | Time segmentation |
| `eri` | 0.88 | Evidence Readiness Index |
| `metadata.kpiBindings` | `[{metric, target, formula, branch}]` | KPI configuration |
| `metadata.kpiMetrics` | `[{label, value, unit, target, status}]` | Computed KPI values |
| `metadata.kpiLabel` | `'Financial KPIs'` | Display group label |

**Demo tree branches (6):**

| Branch | Vote Status | Timeboxes | Domain |
|--------|------------|-----------|--------|
| `branch.operations` | PASSED | 5 | Operations |
| `branch.finance` | PENDING | 4 | Finance |
| `branch.supplychain` | PASSED | 5 | Supply Chain |
| `branch.quality` | PASSED | 4 | Quality |
| `branch.maintenance` | REJECTED | 3 | Maintenance |
| `branch.it` | PENDING | 4 | IT |

---

#### 27.3.13 Proof Coverage Matrix

| Behavior Domain | Proof Script | Stages |
|----------------|-------------|--------|
| Dual confidence split | `dual-confidence-separation-proof.mjs` | 8/8 PASS |
| Attention + confidence + HUD | `attention-confidence-proof.mjs` | 8/8 PASS |
| Height bands (scaffold) | `height-band-proof.mjs` | 8/8 PASS |
| Company collapsed + LOD | `vis2-company-compression-proof.mjs` | PASS |
| LOD transitions (globe→sheet→cell) | `r0-visibility-lock-proof.mjs` | 6/6 PASS |
| Scaffold toggle + rendering | `vis-tree-scaffold-1-proof.mjs` | PASS |
| Camera FreeFly + branch proximity | `cam-freefly-contract-proof.mjs` | 3/4 (Stage C: Known Refusal) |
| Full system integration | `osv1-full-system-proof.mjs` | PASS |
| Headless data parity | `headless-tier1-parity.mjs` | PASS |

---

#### 27.3.14 What Branches Do NOT Yet Do

The following §3 design behaviors are specified but not yet implemented — they require BARK-CYLINDER-1 and subsequent slices:

- **Cylindrical bark wrapping** (§3.2): Filament rows currently render as flat sheets at branch endpoints, not wrapped around the branch surface.
- **Zoom-to-flat LOD transition** (§3.3): No conformal projection from cylinder to flat grid. Currently a hard cut from 3D to 2D.
- **Cross-section dual encoding** (§3.4): No radial lifecycle encoding or angular approach direction encoding. Requires TREE-RING-1.
- **Helical twist** (§3.5): No spiral grain along branch length. Requires HELIX-1.
- **Timebox slab as vertebrae** (§3.6): Slabs rendered as boxes, not as cross-sectional rings with color=magnitude, opacity=confidence, firmness=wilt. Requires SLAB-REVISION-1.
- **Wilt and drooping** (§3.7): No branch deformation from slab degradation. Requires WILT-1.
- **Collision physics** (§3.8): No material resistance on slab walls. Requires WILT-1.
- **Branch tip insight** (§3.9): No bud-like endpoint showing summary output.
- **Twig emergence** (§3.10): No emergent twigs from unclosed filaments at old timeboxes. Requires TWIG-1.
- **Gravitational sinking** (§3.11): No downward slope along branch length. Requires GRAVITY-SINK-1.

These are the Tier 1-2 build slices (BC1 through WILT-1). The proven foundation supports them.

---

## 28. Worked Example — One Invoice Through the Full Trace (New Model)

An invoice arrives: $48,000, Vendor ACME (located in Berlin), Dept Operations, January 2026.

1. **ARRIVE**: Route normalizes JSON. Appends row 7 to `P2P.InvoiceLines` on the P2P branch bark.
2. **SPAWN**: Filament `F-INV-007` appears at outer bark (r=R_max), current timebox (l=January 2026), angular position theta=compass bearing from company (Tel Aviv) to ACME (Berlin) = ~330 degrees (northwest).
3. **GROW**: The filament exists on the bark surface. Each day it grows longer along l. Its timebox slab records: thickness +1 commit, color warm ($48K), opacity 0.5 (has invoice doc but no PO match yet = 1/2 evidence).
4. **MATCH**: Match engine joins PO-3001 + GR-5001 + INV-007 via `poLineId`. Evidence twig connects to PO filament. Another evidence twig connects to GR filament. Confidence jumps to 1.0 (3/3 evidence items). Slab opacity goes full.
5. **MIGRATE**: Filament begins moving inward (r decreases from R_max toward center). In cross-section, it shifts from outer bark to middle ring. Status: ACTIVE -> CLOSED.
6. **SUMMARY**: Summary formula computes match rate = 87.5%. KPI binding reads this value. Branch radius adjusts.
7. **ABSORB**: Filament reaches center (r=0). Enters trunk consolidation gate.
8. **CONSOLIDATE**: TransferPacket verified: `-$48,000 AP` + `+$48,000 GRIRClearing` = balanced. ResponsibilityPacket on approver's user tree: "I approved INV-007, commitId=commit.a7b3c9."
9. **ARCHIVE**: Root cube written: `{cubeId: root.F-INV-007, totalMagnitude: 48000, unit: $, absorptionHash: sha256:..., merkleAnchor: {...}}`. Merkle-sealed. Permanent.

Meanwhile, the filament's twig-free journey meant the branch stayed clean at that timebox. If step 4 had never happened (no PO match), the filament would have stayed at bark level, sinking with gravity, becoming a visible twig by Q2 — the only thing still protruding at that depth.

---

## 29. Proximity Channels

### 29.1 Definition

A proximity channel is a physical-location-anchored communication zone. When you walk near a store, a factory floor, or a community space that hosts a Relay proximity channel, your device detects it via BLE/Wi-Fi.

### 29.2 How They Work

- Detection: multi-signal confirmation (BLE + Wi-Fi together, time-in-range, challenge-response)
- In range: you can post Notes, vote, participate in flows, access local training
- Out of range: read-only. Past actions preserved. Cannot create new content until physically back.
- "Act only when present; review always."

### 29.3 Approach Angle Measurement

Proximity channels measure the DIRECTION from which users approach. This feeds the counterparty angular position on the bark cross-section:

- A customer approaching from the east side of the street appears on the east side of the bark
- Exposure mapping: the store sees which directions customers come from
- Privacy: users who don't want to reveal direction can approach from any angle

### 29.4 Anti-Spoof

Layered constraints, not magic:
- Multi-signal confirmation (BLE + Wi-Fi)
- Time-in-range (consistent detection, not momentary)
- Challenge-response for beacon owners
- Community flagging + reverification at trusted hotspots
- Spoof attempts surface as INDETERMINATE or REFUSAL, not silent allow

---

## 30. Verification Physics

### 30.1 Three-Way Match

Intent (PO) vs Reality (GR) vs Projection (Invoice). The match engine joins these deterministically via shared keys (`poLineId`). Mismatches surface as exceptions on the match sheet — visible, never hidden.

### 30.2 Pressure Loop

Six-step continuous cycle: Attest -> Compare -> Score -> Stage -> Verify -> Checkpoint. This loop runs per timebox per branch. The outputs feed timebox slab properties (confidence, wilt).

### 30.3 Five Invariants

1. **Pressure Budget** (humane): The system limits the number of verification actions required per person per timebox.
2. **Confidence Floor** (honest): Never display certainty without coverage. ERI shows score + confidence + missing inputs.
3. **Repair Effectiveness** (learning): Track whether verification actions actually improve health.
4. **Data Minimization** (private): Minimum required data, shortest retention, strictest scope.
5. **Policy Governance** (governed): All verification rules are policy commits, versioned and inspectable.

### 30.4 Wilt Formula

```
wilt_factor = f(age_since_verification, unresolved_count, confidence_floor, coverage_ratio)
```

wilt_factor is 0.0 to 1.0. Inputs must be sourced from explicit logged quantities:
- `unresolved_count` from obligations ledger
- `coverage_ratio` from feed arrival records
- `confidence_floor` from ERI
- `age_since_verification` from last VERIFY_CHECKPOINT commit timestamp

Verification event types that reduce wilt: `VERIFY_CHECKPOINT`, `RECONCILE_RESOLVE`, `FOLLOWUP_CLOSE`. Any other commit type does not reduce wilt.

---

## 31. Accounting Packets

### 31.1 TransferPacket (System Truth)

Append-only posting packet. Typed legs `{containerRef, amount, unit, reasonCode}`. Must net to zero per unit type.

Containers: Inventory, GRIR, AP, Cash/Bank, Variance, Budget/Commitment, policy-defined extensions.

### 31.2 ResponsibilityPacket (Human Truth)

Append-only mirrored packet on user tree. Records asserted/approved/executed responsibility linked to the same commitId + evidenceHash.

### 31.3 Commit-Hook Law

TransferPacket validation executes INSIDE commit materialization. Direct financial state mutation outside COMMIT is forbidden. Ledger/journal/trial-balance are deterministic projections over validated transfer packets — they are never origin-write surfaces.

---

## 32. Stable ID Construction Law

Canonical IDs are deterministic, intrinsic, and view-independent:

- **Rows**: `row.<moduleId>.<sheetId>.R<row>` (replaces cell-level IDs as primary anchor)
- **Cells**: `cell.<moduleId>.<sheetId>.R<row>.C<col>` (for property-level access within a filament)
- **Sheets**: `sheet.<moduleId>.<sheetId>`
- **Branches**: `branch.<treeId>.<servicePath>`
- **Trees**: `tree.<entityId>`
- **Filaments**: `F-<objectType>-<objectId>`
- **Notes**: `note.<uuid>`
- **Commits**: `commit.<sha256-hash>`
- **Timeboxes**: `timebox.<branchId>.<startCommitIndex>-<endCommitIndex>`
- **Root cubes**: `root.<filamentId>`
- **Flows**: `flow.<scope>.<slug>`
- **Proximity channels**: `prox.<fingerprint-hash>`

Construction rules (non-negotiable):
- IDs derived from (objectType, moduleId, deterministic key) — never from view state, camera, LOD, or render order
- Never derived from timestamps alone
- Never regenerated per session
- Same ID in 3D, 2D inspector, headless API, and CSV export

---

## 33. LOD Rendering Contract

### 33.1 LOD Ladder (Branch-Level)

| LOD Level | What Renders | Detail |
|-----------|-------------|--------|
| GALACTIC-STELLAR | Nothing. Globe not visible. | Relay inactive at celestial LOD unless a celestial tree exists |
| PLANETARY | Globe with heat glow regions | Hot trunks = bright spots on globe surface |
| GLOBE | Trunk pins + prominence beacons | Height, glow, heat per trunk. Branches suppressed. |
| CITY/COUNTRY | Clustered trunk summaries | Aggregate attention for geographic regions |
| TREE | Full tree. Trunk + branch cylinders | Bark texture visible but rows not readable. Slab colors visible. |
| BRANCH | Single branch cylinder. Bark pattern | Individual row hinting. Timebox boundaries visible. Twigs visible. |
| BARK | Partially flattening bark | Column headers appear. Some curvature. Rows becoming legible. |
| SHEET | Nearly flat. Traditional spreadsheet feel | Full 2D grid. Cell editing. Conformal projection from cylinder. |
| CELL | Individual cell focus. Commit history panel | Single field, full history, evidence twigs, all commits. |

### 33.2 Primitive Budget

Each LOD level has a rendering budget. At lower detail (zoomed out), geometric primitives merge and simplify. At higher detail (zoomed in), full mesh + texture + interactivity is available. The budget system prevents runaway rendering at globe scale.

### 33.3 Sight Radius and Atmospheric Compression

Every user has a **sight radius** — a visibility bubble around their current focus point. Objects inside the bubble render at full detail appropriate to the LOD level. Objects outside the bubble fade progressively and stop consuming render budget entirely beyond a threshold distance. This is the Relay equivalent of fog of war: you see what you are looking at, and the rest of the world exists but does not demand your attention or your device's compute.

**Atmospheric compression:** As branches extend beyond the user's current atmospheric zone (conceptually: the zone of focus around the viewer), branch tips scale down asymptotically toward zero. This is not clipping — it is geometric convergence, the way distant mountains appear small. A branch with 10,000 active projections at its tip still exists, but from a distance it collapses to a single summary point. Only when the user flies into that branch tip does it expand to full detail.

This creates a natural rendering budget that scales with attention, not with world complexity. A globe with 50 million trees and billions of filaments renders smoothly because the user is only ever looking at one small region in detail — everything else is compressed by atmospheric distance.

**Privacy integration:** The sight radius respects disclosure tiers. Objects the user does not have permission to see are not merely hidden — they do not enter the sight bubble computation at all. The viewer cannot infer the existence of private objects from rendering gaps or load patterns. Privacy is enforced before geometry, not after.

---

## 34. Use Case — Software Development on Relay

This demonstrates how a developer uses Relay to code a new application, and how SCV AI assists.

### 34.1 Setup

Create a tree with template `software.dev`. Branches:
- `features` — each feature is a filament. PRs, code reviews, test results are evidence twigs.
- `bugs` — each bug report is a filament. Fixes, reproductions, deployments are evidence.
- `infrastructure` — server configs, CI/CD runs, deployment events.
- `docs` — documentation pages as filaments with version commits.

### 34.2 Developer Workflow

1. Developer opens Relay, zooms to project tree.
2. Posts a **Note** on the features branch bark: "Need auth middleware for API routes."
3. Another team member responds -> Note converts to filament `F-FEAT-042`.
4. Developer creates a branch in git. The git hook registers a commit on the filament's bark: `commit.a7f3 -> evidence: git-branch-ref`.
5. PR submitted -> new commit on filament, evidence twig links to PR URL.
6. Code review completed (2 approvals) -> filament confidence rises (evidence_present: 3/3 = code + tests + review).
7. Merged to main -> filament status: ACTIVE -> CLOSED. Begins inward migration.
8. Deployed to production -> final evidence. Filament reaches center. Absorbed.

### 34.3 SCV Code Coherence

The SCV `Code Coherence` agent navigates the features branch:

1. Detects a cluster of twigs on the `bugs` branch at last week's timebox -> something introduced regressions.
2. Builds a projection branch linking bug filaments to the feature filaments merged that week.
3. The projection shows: 3 bugs correlate with feature `F-FEAT-039` (all evidence twigs trace back to same PR).
4. SCV proposes: "Recommend rollback of F-FEAT-039 pending investigation. Evidence: 3/3 bugs share merge commit ancestry."
5. Developer reviews projection, approves revert -> scar appears on bark at F-FEAT-039. Bug filaments reference the scar as resolution evidence.

### 34.4 Time Scrub for Sprint Review

At sprint end, team selects time window = last 2 weeks:
- Branch shows only filaments active during sprint
- Completed features: moved inward (thin bark, healthy center)
- Carry-over bugs: still at bark level, now slightly lower (gravity sank them) -> visible as young twigs
- Sprint velocity = count of filaments that crossed from OPEN to CLOSED in the period

---

## 35. Use Case — Municipal Services

### 35.1 Setup

A city creates a tree with template `municipal.services`. Branches:
- `pothole-repair` — each pothole report is a filament. Photo + GPS = evidence.
- `waste-collection` — each collection route run is a filament.
- `building-permits` — each permit application is a filament.
- `public-safety` — incident reports as filaments.

### 35.2 Citizen Workflow

1. Citizen walks near a pothole. Proximity channel detected.
2. Posts a **Note** with photo + GPS. Approach angle recorded.
3. City maintenance team responds -> Note converts to filament on `pothole-repair` branch.
4. Crew dispatched -> commit on filament with evidence: crew assignment, ETA.
5. Repair completed -> photo evidence of completed work. Filament confidence = 1.0 (photo + GPS + crew report = 3/3).
6. Citizen confirms -> filament CLOSED. Migrates inward.

### 35.3 Fractal Escalation

Many unresolved potholes on the same branch:
- Twigs accumulate at bark level in old timeboxes
- Residents vote on the issue -> engagement rate rises
- Neighborhood trunk becomes more prominent at city level
- City tree shows the neighborhood as a hot branch
- State level shows the city as a hot branch
- Same mechanics, same physics, different template

---

## 36. Use Case — Astronomy

### 36.1 Setup

A research institute creates a tree with template `science.astronomy`. Branches:
- `observations` — each telescope observation is a filament. Raw data + calibration = evidence.
- `hypotheses` — each published hypothesis is a filament. Citations = evidence twigs.
- `peer-review` — review submissions as filaments. Reviewer comments = commits.

### 36.2 Below the Globe Surface

An archaeo-astronomer studies ancient observations:
1. Zooms BELOW the globe surface at the observatory's location
2. Root strata from 1800s visible — compressed, Merkle-sealed
3. Creates a finding filament on the present surface
4. Evidence twig reaches DOWN into the buried root layer, referencing the historical observation
5. The finding filament is truth on the present surface, with provenance extending through geological time

### 36.3 Beyond Earth

Mars has a tree. Every rover observation is a filament on the `geology` branch. Orbital readings on the `atmosphere` branch. Mission telemetry on the `operations` branch. Same six domains, same physics. The rover's presence marker moves across the Martian surface. Scientists on Earth zoom to Mars, read the bark, build projections.

---

## 37. Knowledge Migration Lifecycle — From 2D Internet to 3D Tree

This section describes how existing human knowledge — news, politics, religion, science, history — naturally transitions from 2D internet platforms into Relay's 3D tree model. This is not a feature to build. It is the civilizational adoption lifecycle that emerges from the existing mechanics.

### 37.1 Phase 1 — Import

Users take existing 2D content and post it as filaments:

- News articles become filaments with screenshot/link evidence attachments
- Social media posts become filaments with cross-platform references
- Wikipedia entries become filaments with citation evidence twigs
- Historical texts become filaments with archival references
- Religious texts become filaments with scholarly attestation

Each import is a truth filament on a topical branch. It carries the six universal domains. It is permanent and append-only from the moment of creation.

### 37.2 Phase 2 — Sink

Imported content sinks with gravitational time like everything else:

- Yesterday's news moves down the branch
- Last month's news is in older timeboxes
- Last year's content is deep on the branch
- Content from decades/centuries ago sinks through the trunk into the root archive below the globe surface

The sinking is automatic. No curation needed. Time does the organizing.

### 37.3 Phase 3 — Reference

People begin creating projection branches that reference the sunken historical filaments:

- **Political analysis** = a light blue projection branch with evidence twigs reaching into buried policy, law, and election filaments. Decision nodes encode the analyst's interpretive framework.
- **Religious scholarship** = a light blue projection branch with evidence twigs reaching deep into ancient root strata. Different denominations are different projection branches over the same source filaments, with different decision nodes.
- **Scientific review** = a light blue projection branch aggregating observation filaments from multiple research trees, with methodology decision nodes.
- **Journalism** = a light blue projection branch connecting current events to historical context, with editorial decision nodes visible.

The truth filaments don't care which projection reads them. A historical event from 1000 CE can be referenced simultaneously by a Christian projection, an Islamic projection, a secular historical projection, and a political science projection. Each projection has its own decision nodes. The truth underneath is shared.

### 37.4 Phase 4 — Native Creation

Instead of posting on Twitter and then importing to Relay, people begin posting Notes directly:

- A journalist posts a Note on the relevant globe location. Someone responds. It becomes a filament. The story is born natively in the tree.
- A politician posts a policy Note on the governance branch. Discussion begins. Evidence is attached. The policy debate lives on the tree from inception.
- A scientist posts an observation Note. Peer review happens as commits. The finding is a native filament with full evidence chain.

The 2D platform becomes unnecessary for new content. Import continues for historical backfill.

### 37.5 Phase 5 — Complete

All new content is native. All old content is archived in roots. The transition is complete:

- **Politics** is not a separate system — it is a set of projection branches on governance truth, with competing interpretive frameworks visible as different decision node configurations.
- **Religion** is not a separate institution — it is a set of projection branches on historical and cultural truth, with theological frameworks as visible decision nodes.
- **Science** is not a separate publication system — it is a set of projection branches on observational truth, with methodology as visible decision nodes.
- **News** is not a separate industry — it is the real-time bark arriving on truth branches worldwide, with editorial projection branches competing to contextualize it.

The 2D internet becomes the legacy data source — referenced by root-level evidence twigs, the way we reference archaeological artifacts today. Future generations will dig through the roots and find the internet era as a stratum of compressed historical record.

---

## 38. Relay Global Stage Gates

Everything you have read so far — trees, branches, filaments, notes, voting, confidence, time — is Stage 1. It is the truth layer. It works completely on its own, and for most people most of the time, it is all they need. But Relay does not stop there. It unfolds in three stages, each building on the last. Stage 2 adds a camera-powered interaction layer — your phone becomes a window into the tree world around you, recognizing objects, gestures, and light. Stage 3 adds a game layer — the real-world challenges that Stage 1 tracks and Stage 2 lets you interact with become quests, and solving them earns you real rewards. Each stage enhances the ones below it. Remove any stage, and the stages below still work independently.

Relay is not a single-phase system. It is a three-stage progressive unlock architecture where each stage enhances the stages below it. The data model, filament mechanics, governance, and tree physics are identical across all three stages — what changes is the abstraction layer through which humans interact with the tree.

### 38.1 The Three Stages

| Stage | Name | Layer | Unlock Type | Core Mechanic |
|-------|------|-------|-------------|---------------|
| **Stage 1** | Truth Layer | Data substrate | Community adoption | Tree, filaments, bark, governance, projections, presence, globe, weather |
| **Stage 2** | Interaction Layer | AR communication + personal achievement | Individual discovery | Video AR overlay, SCV graphics, gesture/light/object interfaces, personal stage gate achievements |
| **Stage 3** | Game Layer | Gamified reality + monster economy | Founder key + global threshold | Genre templates over reality, duels, spells, monsters, multi-resource economy, new economic lever |

### 38.2 Stage Enhancement Principle

Every stage is an enhancement to the stages below, never a replacement. Stage 3 commands execute through Stage 2 AR interfaces, which resolve to Stage 1 filament commits. A "spell" cast in Stage 3 is rendered by Stage 2's AR pipeline, and the underlying SCV action produces a Stage 1 filament commit with evidence. Remove any stage, and the stages below still function independently.

### 38.3 Stage Gate Classification — Every Section Mapped

The following table assigns every section to its stage gate. Sections marked **1→2→3** have mechanics that expand across stages — the base mechanic is Stage 1, with enhancements in later stages as noted.

**Stage 1 — Truth Layer (§0-§37):**

| Section | Content | Stage | Notes |
|---------|---------|-------|-------|
| §0 | What Relay Is | **1** | Core philosophy, forces, metrics, domains, truth vs projection |
| §1 | The Globe | **1** | Globe view, LOD ladder through Laniakea |
| §2 | The Trunk | **1** | Heartwood, consolidation gate |
| §3 | The Branch | **1** | Cylindrical coordinates, bark, slabs, wilting, collision, twigs |
| §4 | The Filament | **1** | Row-level events, lifecycle, scars, migration commits |
| §5 | Notes | **1** | Ephemeral pre-filament layer, TTL, conversion |
| §6 | Projection Branches | **1** | Light blue (human) and lavender (SCV) analytics |
| §7 | Social Layer | **1** | Notes→filaments, confidence propagation, voting, recategorization |
| §8 | User Tree | **1→2→3** | Stage 1: responsibility mirror + CV. Stage 2: achievement records. Stage 3: spell library + quest log |
| §9 | Confidence Physics | **1** | Automatic evidence ratio, dual confidence model |
| §10 | Pressure Physics | **1** | Emergent structural integrity forces |
| §11 | Parametric Governance | **1→3** | Stage 1: operational parameters. Stage 3: adds monster economy lever (spawn rate, reward, difficulty) |
| §12 | Filter Tolerances | **1** | Client-side view-state rendering masks |
| §13 | Stigmergic Coordination | **1** | Twigs as tasks, self-assignment, user tree as CV |
| §14 | Gravitational Time | **1** | Universal clock, sinking, branch time |
| §15 | Time Scrubbing | **1** | Replay-based temporal navigation |
| §16 | AI and SCV | **1→2→3** | Stage 1: proposes commits, builds projections. Stage 2: manages AR overlay, interprets gestures/light/objects, validates achievements. Stage 3: validates spells, generates monsters, acts as summoned combat agents |
| §17 | Presence System | **1→2** | Stage 1: attention sensor network, presence markers, birds/flocks. Stage 2: extends to video presence within user sphere (§39) |
| §18 | Flow Channels | **1** | Recorded procedures, training paths |
| §19 | Governance | **1** | Commit materiality, stage gates, work zones |
| §20 | Cryptographic Architecture | **1** | Merkle roots, envelope encryption, selective disclosure |
| §21 | Templates | **1→3** | Stage 1: domain configuration, attribute bindings, sonification, color system. Stage 3: adds genre overlay templates (§40.3) |
| §22 | Fractal Scaling | **1** | Same model at every scale, attention flows upward |
| §23 | Weather and Wind | **1** | Emergent atmospheric analytics, projections |
| §24 | Search in 3D | **1** | Visual navigation + text search with spatial context |
| §25 | 2D/Headless Parity | **1** | Object equivalence, headless mode, import/export |
| §26 | Frozen Contracts 1-27 | **1** | Non-negotiable invariants for the truth layer |
| §27 | Build Status | **1→2→3** | Tiers 1-5 = Stage 1, Tier 6 = Stage 2, Tier 7 = Stage 3 |
| §28 | Worked Example | **1** | Invoice lifecycle through full trace |
| §29 | Proximity Channels | **1** | BLE/Wi-Fi detection, approach angle, anti-spoof |
| §30 | Verification Physics | **1** | Three-way match, pressure loop, wilt formula |
| §31 | Accounting Packets | **1** | TransferPacket, ResponsibilityPacket, commit-hook |
| §32 | Stable ID Construction | **1** | Stable IDs across views |
| §33 | LOD Rendering Contract | **1** | LOD ladder, primitive budget |
| §34 | Use Case — Software Dev | **1** | SCV code coherence, time scrub for sprint review |
| §35 | Use Case — Municipal | **1** | Citizen workflow, fractal escalation |
| §36 | Use Case — Astronomy | **1** | Below surface, beyond Earth |
| §37 | Knowledge Migration | **1** | 2D internet to 3D tree lifecycle (5 phases) |
| §47 | Voice Input Pipeline | **1→2→3** | Stage 1: voice commands. Stage 2: voice + gesture/light fusion. Stage 3: spell incantations |
| §48 | Engineering Infrastructure | **1** | Backend, identity, sync, storage, bootstrap, sustainability, legal, performance, offline, enterprise, AI, protocol, keys, versioning, mobile, testing |

**Stage 2 — AR Interaction Layer (§39, parts of §41):**

| Section | Content | Stage | Notes |
|---------|---------|-------|-------|
| §39 | Stage Gate 2 | **2** | Video AR overlay, physical object interfaces, light communication, personal achievements |
| §41.1-41.2 | Multi-Resource (base + advanced) | **2** | Engagement credits + achievement tokens introduced. Capacity limits introduced. Stage 1 has magnitude only. |
| §42 (basic) | Duels (evidence debate) | **2** | Basic evidence debate format without genre overlay or spell combat. Pre-Stage 3 duel mode. |

**Stage 3 — Game Layer (§40, §42 full, §43, §44, parts of §41):**

| Section | Content | Stage | Notes |
|---------|---------|-------|-------|
| §40 | Stage Gate 3 | **3** | Genre templates, quest scaling, challenge map |
| §41.3 | Global Economic Lever | **3** | Monster spawn rate, reward magnitude, difficulty curve. Replaces central banking. |
| §42 (full) | Duels (spell combat) | **3** | Full duel with genre overlay, spell combat, summoned SCVs, arena atmosphere |
| §43 | Spell Taxonomy | **3** | Element detection, spell mechanics, spell library, geographic magic |
| §44 | Founder Key | **3** | Singular activation primitive |
| §45 | Frozen Contracts 28-89 | **2→3** | Stage gates + hardening + identity + council + module pipeline |

**Cross-stage mechanics (expand through stages):**

| Mechanic | Stage 1 | Stage 2 | Stage 3 |
|----------|---------|---------|---------|
| **SCV** | Proposes commits, builds projections (lavender) | + AR overlay, gesture/light/object interpretation, achievement validation | + spell validation, monster generation, summoned combat agents ("pokemon") |
| **Presence** | Attention sensor, markers, birds/flocks | + video sphere, camera feed, shared AR view | + arena presence, audience energy, cross-planet video |
| **User Tree** | Responsibility mirror, CV shape | + achievement records, capability unlock state | + spell library, quest log, combat record |
| **Templates** | Domain config, attribute bindings | + AR asset catalogs per template | + genre overlay (Sci-Fi/Fantasy/Horror/Military/Adventure) |
| **Resources** | Magnitude (money) only | + engagement credits, achievement tokens, capacity limits | + monster economy lever (spawn/reward/difficulty as governed parameters) |
| **Duels** | N/A | Evidence debate (structured public argument, community voted) | + spell combat, genre overlay, summoned SCV agents, element-based magic |
| **Voice** | Basic voice commands (speak → Whisper → Architect → Canon → propose) | + voice fused with gesture/light/object signals for multi-modal SCV input | + spell incantations as multi-element activation sequences |
| **Governance** | Parametric voting, migration, thresholds | + achievement gate thresholds, personal unlock governance | + monster economy parameters, founder key, global Stage 3 readiness |
| **Sonification** | Audio attribute bindings (volume, pitch, timbre, rhythm, spatial) | + AR-rendered sound effects in video presence | + arena atmosphere (thunder, music, audience energy), spell sound effects |
| **Detection** | Personal device camera only | + detection mesh (surveillance cameras, other users' phones, city infrastructure) | + full distributed mesh as game arena sensor network |
| **Power** | N/A | N/A | Stage 3 resource earned through physical element interaction, spent on spells, cannot buy governance |
| **Cards** | N/A | N/A | Physical trading cards (MTG, Pokemon) as spell catalysts via perceptual hash registry |

### 38.4 Unlock Mechanics

**Stage 1 — Community Adoption:** Features activate as global adoption thresholds are met. Parametric governance detects sufficient participation. No special key required.

**Stage 2 — Personal Discovery:** Every achievement is pre-mapped at system launch. Users discover them organically. When a user demonstrates a Stage 2 capability (e.g., reflecting light from a physical object, having their SCV confirm it matches the physics laws), the achievement is recorded on their user tree as a filament with evidence (the SCV-captured interaction IS the evidence). That user unlocks the corresponding Stage 2 functionality. Other users do not gain access until they independently demonstrate the same capability.

**Stage 3 — Founder Key:** Stage 3 can only be globally activated when: (a) system parameters reach founder-set thresholds enhanced by Stage 2 players, AND (b) explicit activation by the founder account (Eitan Asulin). The system can be READY for Stage 3 but will not activate until the founder turns the key. This is a special governance primitive outside parametric voting — it is a single key held by a single account.

---

## 39. Stage Gate 2 — AR Interaction & Personal Achievement Layer

### 39.1 Video Presence with AR Overlay

Users communicate through video within their user sphere (the camera view). Stage 2 adds AI-generated graphics to this video feed in real-time:

- **Pre-designed graphic assets**: Users design visual tools, diagrams, annotations, data displays in advance and catalog them in their personal SCV library
- **Voice/gesture summoning**: Users call assets by name or gesture — "show the Q3 revenue chart" or a hand movement mapped to a specific graphic
- **Real-time rendering**: The SCV agent overlays the graphic onto the user's video feed, positioned and scaled contextually
- **Shared view**: Other participants in the conversation see the same overlay

The user's personal SCV agent is a trained assistant that knows their visual vocabulary, their preferred graphic styles, and their library of pre-designed assets.

### 39.2 Physical Object Interfaces

Stage 2 extends beyond voice/gesture to physical objects:

- A **sword blade** mapped to the user's filament tree — reflecting light from the 30% mark produces different data than the 80% mark or the tip
- Any physical object can become an interface if the user trains their SCV to recognize it
- The camera detects object position, angle, reflected light, and maps these to data actions
- Objects become controllers for navigating, querying, and commanding the tree

### 39.3 Light-Based Communication

Camera detection of reflected light becomes a new input modality:

- Light reflected toward the camera at different angles encodes different signals
- Different objects (mirrors, blades, glass, water) produce different light signatures
- The SCV interprets these signals as commands within the trained vocabulary
- This creates a new language for human-AI communication that works through optics rather than speech or text

### 39.4 Personal Achievement System

All Stage 2 achievements are pre-mapped at system launch. Discovery is organic:

- Achievements span interaction capabilities (light reflection, gesture vocabulary, object mapping, graphic design quality, combat readiness)
- Each achievement requires the SCV to validate the user's action against the pre-defined physics law
- Evidence is the captured interaction itself — video, SCV confirmation log, physics match score
- The achievement is recorded as a filament on the user tree with full evidence chain
- Unlocked capabilities are progressive — each achievement enables access to corresponding Stage 2 mechanics

The system never tells users what achievements exist. Users discover them through exploration, experimentation, and community sharing. The achievement tree is a personal journey.

### 39.5 Detection Mesh — Distributed Camera Network

Stage 2 expands the single-camera model into a distributed detection mesh where every Relay-authorized camera contributes to the system:

**Camera types in the mesh:**
- **Personal device camera** (phone, laptop, AR glasses) — the baseline sensor, always available
- **Surveillance cameras** whose owner has granted Relay access (library, store, office, public square)
- **Other users' phone cameras** in Relay presence mode (contributes to mesh if user consents)
- **City infrastructure cameras** that municipal authorities have Relay-authorized
- **Venue cameras** at Relay-aware businesses (bars, arenas, schools, hospitals)

**Multi-source corroboration:** When multiple cameras capture the same action from different angles, detection confidence increases. A spell cast in Times Square with 200 cameras has near-perfect confidence. A card held up in a library captured by 5 cameras from different angles is far harder to fake than a single phone camera.

**Social accountability:** The same detection mesh that sees spell cards and light reflections detects everything else. Authorized cameras at schools detect fights. Hospital cameras detect patient distress. City cameras detect infrastructure failures. The detection creates filaments. The filaments show evidence gaps. The evidence gaps create pressure. The pressure makes inaction visible. Resolution requires evidence commits showing the issue was addressed.

**Zone authorization rules:** Each Relay-authorized zone sets its own detection parameters:
- A hospital might enable presence detection only (who is where), disable spell detection
- A gaming arena might enable full detection with maximum sensitivity
- A school might enable safety detection, disable recreational features
- A library quiet zone might disable audio detection, keep visual only

These are branch-level governance parameters for the zone, voted on by the zone's stakeholders.

**Consent model:**
- Camera owners authorize their cameras by connecting to Relay's mesh (administrative decision, revocable at any time)
- Users consent to being detected by having Relay presence active (disable presence = invisible to mesh)
- Non-Relay users and people with disabled presence are NEVER processed (frozen contract #40)
- The mesh sees physical reality but only processes consenting Relay entities

This detection mesh is what turns physical spaces into Relay-active zones where actions have digital consequences. Every authorized space becomes a potential game zone, social accountability zone, or governance arena — not because someone installed special equipment, but because existing cameras are now Relay sensors.

---

## 40. Stage Gate 3 — The Game Layer

### 40.1 The Motivation Problem

When Stage 1 automates truth coordination and Stage 2 gives humans magical interaction with the tree, a structural question emerges: why work? If SCVs handle everything, if governance self-manages, if projections are AI-generated — what drives human participation?

Money remains as magnitude (the measurement channel for value), but as a motivator it breaks down when automation handles the labor. Discussion participation provides attention, but spectating automated systems is not purpose.

Humans need adventure. They need to reach for something they don't yet have. Stage 3 provides this through the gamification of reality.

### 40.2 Reality Becomes the Game

Stage 3 overlays genre templates on real-world challenges:

- A **monster on Mars** is a Martian engineering challenge (pressure seal failure, radiation shielding, resource extraction) rendered as a creature with health, weaknesses, and loot
- A **spell** cast to defeat it is a Stage 2 gesture/light command that instructs the SCV to execute a real Stage 1 action (plasma welding, atmospheric processing, rover navigation)
- The **loot** is real economic value — magnitude flowing through the tree as the challenge is solved
- The **achievement** is recorded on the user tree as a proven contribution

The "battle cruiser" being built is a real spacecraft development project. But the experience of building it is a guild quest. Each subassembly is a dungeon. Each integration test is a boss fight. The experience cannot be delegated to an SCV — the human must physically be present, physically cast the spell, physically face the challenge.

### 40.3 Genre Templates

Genre is a template-level choice for how the gamification layer renders the underlying truth:

| Genre | Applied To | Aesthetic |
|-------|-----------|-----------|
| **Sci-Fi** | Space colonization, advanced engineering, deep tech | Starships, energy weapons, cyberspace |
| **Fantasy** | Conservation, agriculture, ecosystem management | Dragons, enchanted forests, elemental magic |
| **Horror** | Deep ocean exploration, hazardous environments, unknown threats | Abyssal creatures, fog, uncertainty |
| **Military** | Disaster response, infrastructure defense, large-scale coordination | Tactical operations, formations, chain of command |
| **Adventure** | Exploration, discovery, frontier expansion | Quests, maps, treasures, uncharted territory |

The TRUTH underneath is identical across all genres — filaments, evidence, commits, magnitude. The human experience of interacting with it is chosen by the community running the project.

### 40.4 Fractal Quest Scaling

The same monster/quest mechanics scale fractally:

- **Neighborhood quest**: Fix the pothole (local monster, small loot, quick fight)
- **City raid**: Build the transit system (boss battle, guild effort, multi-session)
- **National campaign**: Decarbonize the grid (epic questline, faction-scale)
- **Planetary war**: Colonize Mars (generational campaign, civilization-level rewards)
- **Galactic frontier**: Interstellar probes (open-ended, exploration-class)

Every level uses the same tree model. Same filaments. Same governance. Same Stage 1 truth. Proportionally larger monsters and proportionally larger loot.

### 40.5 Challenges Pre-Mapped

All challenges from microbe to galaxy are pre-defined at system launch:

- Every known planet and system in the Laniakea supercluster has challenge stubs
- Every underlying microbe and atom we need to uncover has a quest stub
- Society collectively establishes (via global parametric governance) what types of AI-generated monsters flow in at each scale
- New discoveries create new challenge stubs automatically as the tree grows

The challenge map is the scientific frontier of human knowledge rendered as a game world.

### 40.6 RPG Attribute Mapping — The User Tree IS the Character Sheet

Stage 3 does not create a separate RPG database. Your user tree — the same tree you've been building since Stage 1 — becomes your character sheet. Most RPG attributes emerge from existing tree state rather than being tracked independently:

| RPG Concept | Relay Equivalent | Source |
|---|---|---|
| Health | Tree Integrity (aggregate confidence/firmness across all branches) | Emerges from tree state |
| Mana | Power (earned through physical element interaction detected by cameras) | Stage 3 closed-loop resource |
| Level | Achievement milestones on user tree (Initiate, Journeyman, Knight, Champion, Architect, Artificer) | Emerges from tree state |
| Class | Element affinity (geography-driven — your environment determines your natural magic type) | Emerges from physical location |
| Skills | Discovered spells in personal spell book (element spells + card spells) | Discovery through experimentation |
| Equipment | Physical objects mapped to SCV through camera training | Training through practice |
| Inventory | Active Capacity (supply cap from multi-resource economy) | Achievement Token investment |
| Gold | Engagement Credits (base resource from any participation) | Participation |
| XP | Achievement Tokens (advanced resource from real-world validated proofs) | Real-world contribution |
| Resistances | Branch strength in specific domains (your expertise makes related challenges easier) | Emerges from tree state |
| Loot | Monster/quest rewards (Engagement Credits + Power + clues) | Governed parameters |
| Difficulty | Fractal quest scale (local → municipal → national → planetary → galactic) | Challenge location |

**Health = Tree Integrity.** Your aggregate confidence across all branches. Losing duels, making false claims, neglecting filaments — these degrade your tree, dropping your health. At severe degradation, Stage 3 combat is restricted until you rebuild. Rebuilding means doing real work: evidence filaments, close commitments, restore your tree's firmness. Health regenerates through honest participation, not potions.

**Power = Mana.** Earned through physical element interaction (camera detection of light, fire, smoke, rain, snow, wind, earth). Spent on spells. Cannot be purchased, transferred, or converted to other resources. Power capacity (maximum pool) scales with user tree size and maturity. Regenerates during the community-voted sleep cycle (see §41.5).

**Class = Element Affinity.** Your physical geographic environment determines your natural magic type. Live near water → Water spells discovered first. Hot climate → Fire spells. Mountains → Earth spells. Snowy region → Ice spells. Windy area → Wind spells. Travel to discover other elements. Specialization deepens through practice, not menu selection.

**Equipment = Mapped Physical Objects.** Quality comes from training depth, not material value. A wooden stick mapped with 50 recognized gestures outperforms a real sword with 3 gestures. Practice makes equipment legendary.

**Resistances = Branch Strength.** A doctor's user tree has natural resistance to medical challenges. A programmer's tree resists software challenges. Generalists have moderate resistance to everything. This isn't allocated — it emerges from your actual tree.

### 40.7 The Core Game Loop

1. **Wake up.** Open Relay. SCV shows: local monsters, available quests, duel challenges, daily Power regeneration from sleep cycle.
2. **Choose your path.** Go to work (Stage 1/2 — real contributions, faster resource accumulation). Hunt monsters (Stage 3 — fight challenges for resources). Train (practice spells, map objects, explore for treasure). Duel (challenge someone for resources and reputation).
3. **Fight or work.** Monster combat: physically perform spell triggers while SCV translates actions into tree operations addressing the underlying problem. Monster health drops as evidence accumulates. Confidence reaching threshold = monster defeated. Loot appears.
4. **Grow.** User tree records everything. Spell book expands. Power capacity increases. Branches diversify. Achievement milestones unlock.
5. **Sleep.** Power regenerates during community-voted rest period. Tree sinks with gravitational time. New monsters spawn where old problems remain unsolved.

### 40.8 Environmental Boosts (No Potions)

Relay does NOT have stockpilable consumable items. Environmental conditions provide temporary boosts:

- Standing in rain while casting Water spells = Power cost reduced
- Being near fire while casting Fire spells = spell effect amplified
- High altitude = Wind spells boosted
- Underground/cave = Earth spells boosted
- Snow environment = Ice spells boosted

These are natural, location-based, and cannot be hoarded. You must physically be there. This drives real-world movement and exploration.

### 40.9 What Relay Does NOT Adopt From Traditional RPGs

- **No random loot generation.** Rewards are deterministic from challenge difficulty and governed parameters. No gambling mechanics. No artificial scarcity.
- **No pay-to-win / microtransactions.** Achievement Tokens only from real-world proof. Power only from physical action. Nothing can be purchased for advantage.
- **No permadeath or permanent loss.** Your tree never resets to zero. It can wilt severely, but every filament is permanent. You can always rebuild.
- **No class restrictions.** Anyone can discover any spell given the right environment and effort. Geography creates tendencies, not locks.
- **No NPC quest givers.** All quests are system-generated (from tree state analysis) or user-created (community challenges). The SCV helps you, it doesn't tell you what to do.

### 40.10 Public World Graphics Scarcity

**The public Relay world is visually clean by default.** No avatars, no custom skins, no floating graphics, no particle effects. Just trees, branches, filaments, data, and user spheres showing real video of real people.

Users have private AI image/video sandbox tools for creative work. They can create and share media freely. But in the public Relay world itself — the shared globe everyone navigates — no custom graphics appear around any user sphere by default.

**Earned public graphics are the exception.** Stage 3 users who perform correct physical trigger sequences (real-life movements + cards + voice incantations + element detection) get pre-programmed Relay Graphics rendered in the public world. These are the ONLY non-data visuals in the shared space. They are rare, impressive, and proof of skill.

When the audience sees fire erupting from a user sphere, that person physically performed the actions required. The scarcity of public graphics IS what makes them meaningful. A spell cast in public is a demonstrated mastery, not a cosmetic purchase.

### 40.11 Progressive Discovery — Fog of War

Nothing in Relay is explained. Everything is discovered. Every feature exists from day 1, running silently, but is invisible until the user encounters it naturally. The system reveals itself in layers:

**Layer 1 — "3D Tree Tool":** User plants a tree. Adds branches. Types data. Thinks Relay is a 3D visualization tool for organizing information.

**Layer 2 — "It's Alive":** User connects live data. Filaments appear. Things sink. Bark textures change. The live ETL nature reveals itself through use.

**Layer 3 — "Other People":** User notices presence markers. Sees other trunks. Realizes it's a shared world. The multiplayer nature reveals itself.

**Layer 4 — "The Globe Is Full":** User zooms out. Sees thousands of trunks. Cities, companies, institutions. Realizes Relay is global.

**Layer 5 — "Underground":** User scrolls below the surface. Discovers roots. Realizes everything ever committed is permanently archived. The historical depth reveals itself.

**Layer 6 — "I Can Affect Things":** User posts a sticky note. Votes on a parameter. Sees their actions change the world's trees. The governance nature reveals itself.

**Layer 7 — "My Tree IS Me":** User discovers their personal user tree. Sees their entire contribution history as a living structure. The reputation/identity layer reveals itself.

**Layer 8 — "Camera Sees Things":** User accidentally triggers a Stage 2 detection (light reflection, gesture pattern). Sees unexpected response from the system. Begins experimenting. The AR interaction layer reveals itself.

**Layer 9 — "Magic Is Real":** User triggers a spell (card + element + voice). Graphics appear in the public world. Monsters become visible. Treasure chests appear. The game layer reveals itself.

No tutorial. No onboarding. No feature list. The fog lifts as you explore. Two users who started on the same day discover different things in different orders based on their behavior. Knowledge has value — sharing discoveries creates guides, hoarding creates advantage. The system rewards curiosity.

### 40.12 Genre Emergence

Because of fog of war discovery, Relay is simultaneously every game genre depending on what the user is doing:

- **RTS**: Managing company branches, deploying SCVs across multiple fronts
- **RPG**: Building user tree, discovering spells, leveling through achievements
- **FPS**: In a duel, reacting in real time, playing instants from hand
- **MMORPG**: Zoomed out on the globe, millions of users, monsters spawning, world events
- **Puzzle**: Figuring out what light patterns mean, what cards do, what gesture triggers a spell
- **Simulation**: Running a company through Relay ETL, watching the tree respond to real data
- **Horror**: Exploring deep underground root strata, finding ancient unresolved events
- **Strategy**: Preparing evidence and card decks for upcoming duels

You don't choose a genre. You're always in multiple simultaneously. The genre emerges from your current activity and discovery state.

---

## 41. Multi-Resource Economy

**Stage Gate:** 1→2→3. Stage 1: magnitude (money) as single resource channel. Stage 2: introduces engagement credits + achievement tokens + active capacity. Stage 3: adds monster economy lever (spawn rate, reward magnitude, difficulty curve as governed parameters).

### 41.1 The Starcraft Model

Stage 1 uses a single resource channel (magnitude/money). Stage 2 introduces a multi-resource economy with three distinct channels inspired by real-time strategy resource management:

| Relay Resource | Starcraft Analog | Earned From | Gates |
|----------------|------------------|-------------|-------|
| **Engagement credits** (base) | Minerals | Any participation: virtual monsters, comments, votes, commits, sticky notes | Sticky note quota, basic vote weight, basic posting capacity |
| **Achievement tokens** (advanced) | Vespene Gas | ONLY real-world SCV-validated achievements (Stage 2 physics law proofs) | Advanced vote power, commit authority, projection creation, spell catalog expansion |
| **Active capacity** (limit) | Supply cap | Investment of both base + advanced resources to expand | Max concurrent filaments, active SCVs, simultaneous spells, parallel quest slots |

### 41.2 Incentive Structure

You CAN survive on engagement credits alone by farming virtual monsters. You'll have basic functionality. But you will NEVER gain advanced capabilities (strong votes, projection authority, expanded spell catalog, larger capacity) without achievement tokens — and those only come from solving real-world problems that your SCV validates against physics laws.

This creates a permanent incentive gradient toward real contribution even when virtual participation is easier.

### 41.3 The Global Economic Lever

In Stage 3, monster spawn rate and reward rate replace central banking mechanisms:

- **Monster spawn rate**: How many challenges flow in per unit time at each scale. Higher rate = more earning opportunities.
- **Reward magnitude**: How much value (engagement credits + achievement tokens) each monster yields. Higher magnitude = faster accumulation.
- **Difficulty curve**: How hard monsters are relative to player capability. Steeper = slower farming, shallower = faster farming.

These three parameters are set by global parametric governance (same weighted-median voting from Stage 1). Everyone votes. The parameters flex the economy the way interest rates and reserve requirements do today.

If too much wealth accumulates and engagement drops → increase difficulty, decrease rewards.
If too little activity and too many idle users → increase spawn rate, increase rewards.

Even users who do not perform physical-world labor must fight virtual monsters to earn. This ensures universal participation in the economic system while allowing the difficulty/reward balance to be democratically controlled.

### 41.4 Resource Flow Integration

All resources flow through Stage 1 filaments:

- Engagement credits are magnitude on activity filaments
- Achievement tokens are magnitude on achievement filaments (with SCV validation evidence)
- Capacity limits are derived from user tree state (total achievement + investment filaments)
- Resource transfers between users follow the existing double-entry TransferPacket model
- All resources are subject to the same frozen contracts (append-only, deterministic replay, Merkle roots)

No new data primitives. The multi-resource model is a categorization of existing magnitude channels.

### 41.5 Power — The Stage 3 Resource

Power is the fourth resource, existing only within Stage 3's closed loop:

| Property | Rule |
|---|---|
| **Earned from** | Physical element interaction detected by camera (light, fire, smoke, rain, snow, wind, earth) + correct gesture/movement sequences |
| **Spent on** | Casting spells (element spells + card spells), maintaining enchantments, summoning creatures |
| **Cannot** | Buy governance weight, purchase Achievement Tokens, transfer to other users, convert to Engagement Credits |
| **Capacity** | Maximum Power pool scales with user tree size and maturity (bigger tree = more mana) |
| **Regeneration** | Regenerates during the community-voted sleep cycle (see §41.6). Ambient regeneration from environmental element detection during waking hours. |

Power exists in a closed loop: earn through physical action → spend on spells → spells resolve to Stage 1/2 actions you already have permission to perform. Power never grants new permissions, new governance weight, or new economic advantage. It makes the same actions more dramatic and entertaining without making them more powerful.

### 41.6 Sleep Cycle Regeneration

Resource limits regenerate during a community-governed daily rest period:

- The sleep cycle **duration** is a global parameter set by weighted-median voting (e.g., 7 hours 12 minutes — voted by billions of interested users)
- The sleep cycle **timing** is regionalized by real solar position (see §14.4): sleep onset triggers when local solar altitude drops below the voted threshold (default: civil twilight at -6°), sleep end triggers at the corresponding dawn threshold. Equatorial users get a consistent window year-round. High-latitude users shift with seasons. Extreme-latitude users (above ±66.5°) fall back to a UTC-offset schedule.
- During the sleep cycle, resource limits (sticky note quota, Power pool, active capacity cooldowns) regenerate
- Users who do not rest (keep their device active continuously) hit resource ceilings and cannot regenerate
- This simultaneously: prevents bot spam (bots don't sleep), incentivizes healthy human behavior, creates a natural rate limit on all activity, and is transparently governed

The sleep duration parameter is adjustable like all global parameters. If the community votes it down to 6:45, the system adjusts. If evidence shows 8 hours is healthier and the community shifts, it shifts. The sleep onset/end solar thresholds are also votable global parameters — the community controls not just how long the rest is, but when it begins relative to sunset/sunrise.

### 41.7 Value Hierarchy Principle

**Stage 1 responsibility always outweighs Stage 3 gaming power.** This is structural, not policy:

- A diligent auditor managing 5 companies with thousands of well-evidenced filaments has more governance weight, more economic resources, and more real influence than any Stage 3 wizard
- Achievement Tokens (earned from real work) gate advanced capabilities that Power (earned from gaming) cannot access
- Vote weight derives from Engagement Credits and Achievement Tokens, never from Power
- A powerful wizard in Relay is entertaining and respected. A responsible auditor holding thousands of human responsibility filaments is essential and trusted. Both are valued. Neither diminishes the other. But the tree economics ensure real contribution always yields more than virtual performance.

The game provides a comfortable living — people CAN survive by gaming well and fighting monsters in Stage 3. But they will NEVER surpass the influence of someone doing real-world Stage 1 work, because Achievement Tokens cannot be earned through virtual combat (frozen contract #30).

---

## 42. Duels — Governance Theater & Public Combat Events

**Stage Gate:** 2→3. Stage 2: basic evidence debate format — two users present arguments with data visualizations, community votes on outcome, resources transfer. No genre overlay, no spell combat. Stage 3: full duel with spell combat, genre overlay, summoned SCV agents, element-based magic, arena atmosphere with music/sound/audience energy.

### 42.1 Mechanic

A duel is a structured public engagement between two users over an issue:

1. **Challenge**: User A challenges User B on a specific issue (filament or branch). Both agree to terms: duration, resource stakes, topic scope.
2. **Arena**: Both users appear in their user spheres (video on camera). The event is classified as a public filament — visible to all, classified as an event.
3. **Performance**: Each user physically wields their interface objects (swords, etc.) and calls out spells. The "spells" are actually:
   - Evidence claims: summoning specific filaments and projections prepared in advance
   - Data analyses: calling out wind projections, correlation data, trend charts
   - Counterarguments: referencing the opponent's evidence chain weaknesses
4. **Audience**: Viewers watch, react. Music, sound, audience energy drive the arena atmosphere. The engagement rate of the event filament climbs.
5. **Resolution**: The community votes on the outcome. The duel filament carries the vote tally. Resources transfer from loser to winner based on the community decision.
6. **Closing**: The event filament closes after the pre-set duration (adjustable by audience demand). The outcome becomes an append-only record — a historical truth filament.

### 42.2 Governance Weight

Duels have direct governance consequences:

- The community vote on a duel outcome IS a governance vote
- It can trigger migration commits (if the duel was about recategorization)
- It can establish action branches (if the duel was about a proposed initiative)
- It can transfer resources (engagement credits + achievement tokens per the stakes)
- It produces evidence filaments that future duels and projections can reference

The sword does not grant political power. The sword draws an audience. The EVIDENCE wielded through spells is what the community evaluates. Physical skill with a blade is a presentation medium, not a governance mechanism.

### 42.3 Arena Location

Duels happen anywhere on the planet or anywhere in the Laniakea Relay galaxy:

- Two users in the same room, physically facing each other
- Two users across the globe, connected via video presence
- Two users at a Mars outpost, dueling over resource allocation
- The arena is wherever the participants are — the globe renders the event at their location

### 42.4 Turn Structure (MTG-Inspired)

Stage 3 duels use an alternating turn structure that provides strategic depth:

1. **Preparation phase** — Both duelists set up: present land cards to establish element base, cast enchantments, declare equipment mappings. No attacks.
2. **Alternating turns** — Duelists alternate. On your turn you may: present one sorcery card OR summon one creature OR cast element spells (gestures/voice) OR present evidence/arguments. Your opponent may respond with instant cards before your action resolves.
3. **Combat** — Summoned creatures clash automatically (SCV-controlled). Creature power/toughness determines outcomes. Losing creatures dissolve.
4. **Evidence phase** — On your turn, present evidence (call out filament references, display projections, invoke data analyses). This is the intellectual substance underneath the spectacle.
5. **Resolution** — After agreed number of rounds (or concession), audience votes. The vote considers both combat spectacle AND evidence quality.

**The Stack:** When you cast a spell, your opponent can respond with an instant before it resolves. You can respond to their response. Spells chain until both pass, then resolve in reverse order (last spell first). This creates the strategic interplay where timing, card selection, and bluffing matter as much as raw Power.

**Card Advantage:** Discovering more spells (element + card) gives you more options. But having more options doesn't guarantee victory. A skilled duelist with five well-chosen spells and strong evidence defeats a wizard with a hundred spells and weak arguments. The evidence phase is where Stage 1 truth meets Stage 3 spectacle.

### 42.5 Substance vs Spectacle — Two Paths to Victory

Duels are persuasion systems, not fighting games. The audience votes on who convinced them:

**The spectacle path (Stage 3 strength):**
- Physical performance: sword work, acrobatics, element manipulation
- Card-based combat: creature summons, enchantments, combo sequences
- Visual drama: fire effects, lightning, environmental AR
- Entertainment value: keeping the audience engaged and impressed

**The substance path (Stage 1 strength):**
- Voice commands to a deeply trained SCV: "Show my tree," "Pull their confidence scores"
- Tree projections: displaying credentials, counterparty relationships, completion history
- Evidence-based arguments: referencing publicly verifiable tree data
- Reputation weight: tree shape communicates reliability without a word spoken

A Stage 1 auditor sitting on a barstool can defeat a Stage 3 ninja by calmly displaying their massive, firm user tree and pointing out the ninja's unfinished filaments. The audience votes on trust, not theatrics. The auditor's "spells" are SCV voice commands and data projections — no physical movement required.

Conversely, in a gaming arena full of Stage 3 enthusiasts, spectacle might win over substance if the audience values entertainment. Context determines which path prevails. The system doesn't prescribe.

### 42.6 Proximity Channel Duels

Duels in physical proximity channels (bars, parks, offices) use the location's authorized cameras as the detection and corroboration system:

- The venue's surveillance cameras + all patrons' phones with Relay active = multi-angle detection mesh
- Both duelists' actions are captured from multiple angles with high corroboration confidence
- Spectators vote through the proximity channel — only physically present people vote
- Stakes can be purely social (loser leaves, winner gets bragging rights) with zero resource transfer
- The duel filament is permanent: challenge acceptance, turns, evidence presented, vote result, outcome — all append-only

---

## 43. Spell Taxonomy — Element Detection & Physical Magic

**Stage Gate:** 3. Requires Stage 2 light-communication and object-interface capabilities as prerequisites. Element detection, spell validation, spell library, and geographic magic are all Stage 3 mechanics that activate only after the founder key.

### 43.1 Environmental Element Detection

The camera detects real physical elements in the user's environment. Each detected element enables a corresponding magic type:

| Real Element | Magic Type | SCV Capability Enabled |
|-------------|------------|----------------------|
| **Fire** (flame, torch, candle) | Fire magic | Thermal/energy analysis, heat-map projections, acceleration displays |
| **Smoke** (vapor, steam, fog) | Smoke magic | Obscuration, privacy operations, uncertainty visualization |
| **Rain** (water, spray, drops) | Rain magic | Flow analysis, liquid asset tracking, cascade projections |
| **Light** (reflection, beam, glow) | Light magic | Data illumination, evidence highlighting, truth revelation spells |
| **Snow** (ice, frost, cold) | Snow magic | Cold-proof engineering, preservation operations, archive queries |
| **Wind** (cloth movement, hair, flags) | Wind magic | Trend analysis, directional projections, branch movement commands |
| **Earth** (soil, stone, sand) | Earth magic | Foundation operations, root queries, geological history navigation |

### 43.2 Spell Mechanics

A spell is a cataloged interaction sequence:

1. **Detection**: Camera identifies the real element in the user's environment
2. **Activation**: User performs the gesture/light/object interaction (Stage 2 mechanics)
3. **Validation**: SCV confirms the interaction matches a cataloged spell from the user's library
4. **Rendering**: Stage 2 AR pipeline renders the spell effect on the user's video feed
5. **Execution**: SCV translates the spell into Stage 1 actions (filament queries, projection creation, evidence retrieval, commit proposals)
6. **Result**: The Stage 1 truth tree updates accordingly (via normal commit mechanics, never bypassing frozen contracts)

### 43.3 Spell Library

Users create and expand their personal spell library:

- Each spell is a filament on the user tree (the spell definition IS a filament)
- The definition includes: trigger element, gesture sequence, SCV command mapping, AR visual effect
- Users can share spell definitions as public filaments — others can learn and adopt them
- Advanced spells require achievement tokens to unlock
- The combinatorial space is infinite — any element + gesture + object can potentially map to any SCV action

### 43.4 Physical Location Matters

Geographic environment affects available magic:

- Standing in snow enables snow-type spells at full power
- Near a campfire enables fire-type spells
- In rain enables water/rain-type spells
- This creates geographic gameplay — different locations on the planet offer different magical capabilities
- Expeditions to extreme environments (volcanoes, glaciers, deep ocean) unlock rare element combinations

### 43.5 Spell Discovery Mechanics

Spells are secret by default. A hidden registry established by the founder on day 1 maps trigger combinations (element + gesture + voice + optional card) to spell effects. The registry is deployed encrypted on every client.

**Discovery process:**
1. User accidentally or intentionally performs a trigger sequence
2. Camera + SCV detect the combination and check against the hashed registry
3. If a match is found at sufficient confidence threshold: the spell activates for the first time
4. Visual revelation: spell name, icon, description appear — the user sees what they've unlocked
5. The spell is permanently added to the user's spell book (a filament on their user tree)
6. From now on, the user can intentionally cast this spell whenever they have sufficient Power

Before discovery, the spell is invisible. The user doesn't know it exists. The sheer number of spells makes it impossible for any one person or group to discover everything. Only by sharing knowledge and documenting the system together can civilizations pass this knowledge down. This knowledge exists OUTSIDE the Relay system — Relay does not auto-document spell knowledge. A user could build a Relay tree of known spells, but that's their personal knowledge, not system-provided.

**Personal Canon training:** Each user's SCV Canon layer is uniquely theirs, trained by their interaction style. How you command your Canon will differ from how others command theirs. Your version is shaped by your practice, your vocabulary, your gesture habits. This uniqueness is part of what makes each user's combat style distinctive.

### 43.6 Treasure Chests and Clues

Treasure chests are pre-mapped locations in the Relay coordinate system where a visual marker appears (Stage 3 users only). Opening a chest reveals a clue — a partial description of a spell trigger, a hint about which element is needed, a riddle about the right gesture. Chests provide knowledge, never Power or spells directly.

- Chests are hidden throughout the universe: specific geographic coordinates, specific branch locations, specific root archive depths
- Some chests require physical presence at the location (GPS-verified)
- Some chests are hidden in deep root strata (historical archaeology reveals game content)
- Clues can be shared between users (knowledge trading is a social mechanic)
- New chests can be placed by the founder (append-only — never removed)

### 43.7 Physical Card Integration — Magic Cards as Spell Catalysts

A curated subset of real-world trading cards (Magic: The Gathering, Pokemon, and other physical card games) are secretly mapped to Relay spell effects in the day-1 registry:

**Recognition system:**
- Each card's visual identity is stored as a **perceptual hash** (tolerates camera angle, lighting, wear — not a cryptographic hash)
- The spell effect definition is encrypted alongside the hash
- Camera recognition must meet a confidence threshold (global parameter) to activate
- You need the actual physical card, held clearly, properly lit. Blurry photos and printouts fail recognition.
- The real-world market value of a card has ZERO correlation with its Relay power. A $50,000 Black Lotus might summon a small fairy. A common 10-cent card might unlock a devastating spell. The mapping is arbitrary, secret, and frozen at launch.

**Card types map to spell categories (MTG-inspired):**

| MTG Card Type | Relay Spell Category | Effect |
|---|---|---|
| **Creatures** | Summon spells | Summon an SCV-controlled combat entity. Power/toughness from registry. Summoning delay (3-5s hold). One creature per card at a time. |
| **Instants** | Reactive spells | Interrupt opponent's action during duels. Fast activation (shorter hold, lower Power cost). Can only respond to another action. Stack: last-in-first-out resolution. |
| **Sorceries** | Strategic spells | Major effects on your turn only. Higher Power cost, bigger impact. Branch scanning, large projections, extended affinity boosts. |
| **Enchantments** | Persistent effects | Lasting buff on branch/filament/self. Costs ongoing Power to maintain (drains while active). Limited by capacity. |
| **Artifacts** | Equipment enhancers | Modify physical mapped objects. Boost detection sensitivity, gesture recognition, element range. Persist until replaced. |
| **Lands** | Element amplifiers | Amplify element affinity. Forest=Earth, Island=Water, Mountain=Fire, Plains=Light, Swamp=Smoke. Multiple lands stack (up to cap). Enable multi-element combos. |

**Type advantages (Pokemon-inspired):** Fire > Earth/Nature, Water > Fire, Wind/Lightning > Water, Earth > Wind, Ice > Water, Light > Smoke, Smoke > Light. This rock-paper-scissors layer rewards diverse element knowledge and strategic card selection for duels.

### 43.8 Relay Set Items

Beyond trading cards, the founder defines a broader set of physical objects with Relay meaning:

- Specific trading card sets (Magic, Pokemon, etc.)
- Physical game pieces (dice types, POGS, chess pieces)
- Other recognized objects with predefined Relay effects

These **Relay Set Items** are the founder-constrained objects that provide meaning to build a rule-based system. The constraints — which objects have meaning, what effects they produce — are what enable a system with rules that can be played. Without constraints, there's no game.

### 43.9 User-Created Content

Any user who has discovered multiple spells can create:

- **Custom quests**: Define a sequence of challenges, hide them in the world, set rewards from their own Power reserves, publish as a public filament on a quest branch
- **Custom spell compositions**: Combine discovered spells into sequences (lower magnitude than founder-set Relay spells but still functional)
- **Custom treasure hunts**: Hide clues at locations, define the discovery path, reward finders
- **Custom training programs**: Design practice sequences that teach specific spell techniques

User-created content follows the same constraints as founder content: it can only compose existing mechanics, never create new physics. Relay Set Items and founder spells are always higher magnitude than user-created equivalents. User creativity extends the game infinitely without breaking the rules.

---

## 44. Founder Key — Stage Gate 3 Activation Primitive

### 44.1 The Key

Stage Gate 3 global activation requires a special governance primitive that exists outside the parametric voting system:

- **Holder**: The founder account (Eitan Asulin) — singular, non-transferable
- **Condition A**: System parameters reach thresholds initially set by the founder at system launch. These thresholds are enhanced (made more precise, more demanding) by eligible Stage 2 players over time through parametric governance, but the BASELINE thresholds are founder-set.
- **Condition B**: Explicit activation by the founder account. Even when Condition A is met, Stage 3 remains inactive until the founder acts.
- **Irreversibility**: Once activated, Stage 3 cannot be deactivated. The key turns once.

### 44.2 Why a Founder Key

Every other governance mechanism in Relay is community-driven (parametric voting, migration commits, threshold triggers). The Stage 3 founder key is the single exception. It exists because Stage 3 represents a civilizational shift in how humans interact with reality. The collective readiness must be validated not just by metrics but by human judgment at the highest level of system responsibility.

### 44.3 Day-1 Setup — What the Founder Deploys

On day 1, the founder establishes the complete system foundation:

1. **Stage 1 ruleset and template library** — published, transparent, governable from day 1
2. **Stage 2/3 physics engines** — deployed on every client, running silently. The detection engine (element recognition, card matching, gesture detection) operates from the first moment any camera turns on. Before Stage 2/3 activation, accumulated detections have no visible effect — but the engine is learning.
3. **Encrypted spell registry** — the complete mapping of trigger combinations to spell effects, hashed and sealed. Deployed to every client as encrypted data. Cannot be read without physically presenting the matching input (card, gesture, element) to a camera.
4. **Relay Set Item registry** — the complete list of physical objects (cards, dice, POGS, etc.) with Relay meaning, perceptually hashed and encrypted alongside their effects
5. **Treasure chest coordinates** — all treasure locations and clue content, encrypted and distributed
6. **Stage Gate 3 activation thresholds** — the community metrics that must be met before the founder key can turn (published as targets, not secrets)
7. **Initial global parameters** — sleep cycle duration, spam threshold, vote eligibility age, and all other system parameters with starting values (immediately governable by community voting)

**Founder constraints after day 1:**
- Cannot modify frozen contracts
- Cannot override governance votes
- Cannot grant themselves extra Power or resources
- Cannot secretly change spell rules (the registry is hashed and verifiable — any tampering breaks the hash chain)
- CAN append new spells, treasure chests, and Relay Set Items to the registry (append-only, never modify or remove existing entries)
- Cannot activate Stage 3 before community thresholds are met

### 44.4 Pre-Activation State

Before Stage 3 activation:
- Stage 3 challenge stubs exist in the system but are inert (visible as future content, non-interactive)
- Monster generation AI is dormant
- Duel mechanics are restricted to Stage 2 style (evidence debate without genre overlay or spell combat)
- Multi-resource economy operates on engagement credits + achievement tokens only (no monster-economy lever)
- Genre templates exist as specifications but do not render
- Power accumulates silently from element detection but has no use
- Spell triggers produce no visible effect (the engine detects them but doesn't activate)
- Treasure chests are invisible

After activation: all Stage 3 mechanics activate globally and simultaneously. Power becomes spendable. Spells become castable. Monsters spawn. Treasure chests appear. The game begins. The fog of war starts lifting for those who explore.

---

## 45. Frozen Contracts — Stage Gate Additions + Constitutional Hardening

The following contracts extend the frozen contract list (§26). Contracts 28-44: Stage Gate mechanics. Contracts 45-53: structural additions. Contracts 54-67: constitutional hardening. Contracts 68-74: identity, dispute resolution, and growth model. Contracts 75-85: sociological resilience and sortition accountability. Contracts 86-89: Relay Council, module pipeline, escalation hierarchy, draft → commit universality.

28. **Stages are additive**: Each stage enhances the stages below it. Removing a stage does not break the stages below. Stage 3 commands resolve to Stage 2 AR interactions, which resolve to Stage 1 filament commits. No stage may bypass a lower stage.
29. **Achievements are evidence-based**: Personal stage gate achievements require SCV-validated proof recorded as filament evidence on the user tree. No achievement is granted by fiat, vote, or purchase.
30. **Real yields more than virtual**: Achievement tokens (advanced resource) can ONLY be earned through real-world SCV-validated achievements. Virtual-only engagement yields only engagement credits (base resource). This incentive gradient is non-negotiable.
31. **Spells resolve to commits**: Every spell, regardless of visual effect or genre overlay, ultimately resolves to one or more Stage 1 filament operations (query, commit proposal, evidence reference). No spell bypasses frozen contracts 1-27.
32. **Duels are public filaments**: Duel events are classified as public filament events. Community votes on duel outcomes follow standard vote governance (eligibility gates, decay, threshold mechanics). Sword skill does not grant governance power — evidence quality does.
33. **Genre is a rendering template**: Genre overlays (Sci-Fi, Fantasy, Horror, etc.) are visual templates applied at the rendering layer. They never modify the underlying truth. A monster rendered as a dragon and a monster rendered as an alien are the same engineering challenge underneath.
34. **Founder key is singular**: Stage Gate 3 global activation requires explicit action by the founder account. No parametric vote, governance proposal, or community threshold can activate Stage 3 without the founder key. Once activated, irreversible.
35. **Monster economy is governed**: Monster spawn rate, reward magnitude, and difficulty curve are global parameters set by parametric governance (weighted-median voting). No central authority sets these values. The community controls its own economic lever.
36. **Voice commands are proposals**: Voice-initiated actions follow identical governance to any other input modality. No voice command bypasses commit materiality, work zones, human approval, or any frozen contract. Voice transcripts are attached as evidence on the resulting commit.
37. **Architect parses, Canon proposes, Human decides**: The three-stage voice pipeline (Whisper → Architect → Canon) is non-collapsible. No shortcut from raw audio to committed filament. Architect only parses, Canon only proposes, and the human is the sole authority to approve.
38. **Power cannot buy governance**: Power (Stage 3 resource) exists in a closed loop for spell casting only. It cannot be converted to Engagement Credits or Achievement Tokens, cannot increase vote weight, cannot modify filament confidence, and cannot override any governance decision. Power grants spectacle, never authority.
39. **Public world graphics are earned only**: The shared Relay globe has no custom graphics by default. The only non-data visuals in the public world are pre-programmed Relay Graphics triggered by physically performing correct trigger sequences (element + gesture + voice + optional card). No cosmetic purchases. No avatar customization. Graphics are proof of skill.
40. **Bystander privacy is absolute**: The detection mesh (Relay-authorized cameras) only processes entities with active Relay presence markers. Non-Relay users and people who have disabled their presence are never processed, tracked, or rendered. No exceptions.
41. **Card and spell registries are append-only**: The founder can add new spells, cards, treasure chests, and Relay Set Items after launch. Existing mappings are immutable — once a card is mapped to a spell effect, that mapping never changes. Tampering breaks the hash chain and is detectable.
42. **Stage 1 responsibility outweighs Stage 3 power**: Achievement Tokens (from real-world contribution) gate advanced capabilities that Power (from gaming) cannot access. No amount of Stage 3 gaming performance can surpass the governance weight, economic resources, or system influence earned through Stage 1 real-world work.
43. **Sleep regeneration is community-governed**: The daily rest cycle duration is a global parameter set by weighted-median voting. It simultaneously rate-limits activity, prevents bot abuse, and incentivizes healthy behavior. The parameter is adjustable by the community, never hardcoded.
44. **Organizational and global confidence are independent channels**: `orgConfidence` (evidence_present / evidence_required) drives slab opacity. `globalConfidence` (community vote alignment) drives globe ranking. Neither overrides the other. No code path may average, blend, or merge them. Separate storage, separate setters, separate arithmetic. Mandatory `DUAL-CONFIDENCE-SEPARATION-PROOF` verification artifact.
45. **Tier-gated attention at globe LOD**: Anonymous accounts (Tier 0) cannot contribute to attention metrics at GLOBE or REGION LOD. Attention from Tier 0 users is excluded from trunk prominence calculations. This prevents bot-farming of globe visibility. Tier 1+ identity (verified via SCV or proximity) is required for attention signals to propagate above COMPANY LOD. Enforcement: the attention aggregation function at GLOBE LOD filters input by identity tier before computation.
46. **Monster economy rate-of-change caps**: Global parameters governing monster spawn rate, reward magnitude, and difficulty curve are subject to per-epoch rate-of-change caps. No single governance vote cycle may change any of these parameters by more than 20% from the previous epoch's value. This prevents economic shock from sudden parameter manipulation. The cap itself is a frozen constant — not subject to parametric governance.
47. **Resource non-convertibility is explicit and total**: The three resource types (Engagement Credits, Achievement Tokens, Power) exist in strictly separated pools. No mechanism — governance vote, founder action, SCV operation, spell effect, duel outcome, or economic event — may convert one resource type to another. No exchange rate exists. No marketplace may be created. The separation is structural (different ledger types), not policy (a rule that could be voted away).
48. **Founder activation requires attestation commit**: Stage Gate 3 activation (the founder key) requires a signed attestation commit on the founder's user tree. This commit records: activation timestamp, the exact parameter state at activation (all global parameters + their weighted-median values), and a declaration of readiness. The commit is append-only and Merkle-sealed. It serves as permanent evidence of the activation decision, preventing post-hoc disputes about "when the game layer was turned on" or "what state the system was in."
49. **Detection mesh is local-first**: All camera-based element detection (fire, smoke, rain, light, etc.) and object recognition runs on-device. Raw video frames never leave the user's hardware. Only classified signal metadata (element type, confidence score, timestamp) is transmitted. The SCV validates these metadata signals, not raw imagery. No central server stores or processes video. No network partition or server outage can disable local detection. This is a privacy constraint, a latency constraint, and a resilience constraint simultaneously.
50. **Minor safety prohibition**: Relay shall not process, render, or respond to trigger sequences performed by users who have not passed age verification (Tier 1+ identity). Spell trigger sequences involving fire, combustion, or extreme physical interaction require explicit safety attestation (a signed acknowledgment on the user tree) before the SCV will recognize them. No spell effect may instruct, encourage, or require physical actions that pose inherent danger to the user, bystanders, or property. Violations emit `[REFUSAL] reason=SAFETY_GATE` and halt the spell pipeline.
51. **Legal posture document required before public launch**: No Relay instance may accept external users without a published legal posture document covering: data residency jurisdiction, GDPR/CCPA compliance mechanism (cryptographic erasure per §48.7), content liability framework, identity tier data retention policy, append-only vs. right-to-erasure reconciliation, and camera detection privacy policy. This document must be referenced by a governance commit at the root of the tree. Its absence is a deployment blocker.
52. **Presence quantization at high LOD**: At GLOBE and REGION LOD, individual presence markers are not rendered. Presence is aggregated into heatmap tiles (density per geographic cell). The quantization threshold is: above COMPANY LOD, presence becomes statistical. Below COMPANY LOD, presence is individual. This prevents globe-level user surveillance and reduces rendering load. The quantization boundary is a frozen constant per LOD level, not a user-configurable filter.
53. **Quarantine branch mechanism**: When governance triggers content removal (prohibited content, safety violation, legal order), the affected filaments are migrated to a quarantine branch. The quarantine branch is: append-only (filaments moved in, never deleted), invisible at all LODs except explicit governance audit view, excluded from confidence and attention aggregation, excluded from trunk consolidation, and cryptographically sealed (content encrypted, only governance auditors with explicit key can read). This preserves the append-only Merkle chain while making prohibited content invisible and inaccessible to normal users.
54. **Attention is a lens, never a lever**: Attention metrics (presence focus count, gaze concentration, engagement rate) affect ONLY visibility, rendering prominence, and LOD priority. Attention NEVER affects: vote weight, confidence values, permissions, execution priority, resource earning rate, governance authority, or any parameter that determines what a user CAN DO. If attention ever influences a decision gate, the system becomes performative and gameable. This is the single most critical separation in Relay. Violation = constitutional failure.
55. **Fresh account governance cooldown**: A newly verified Tier 1 account has zero governance weight for a minimum of 14 days AND 10 domain-relevant commits. Governance weight accumulates proportionally to: time since identity verification, number of evidence-contributing commits (not just presence), and branch-specific participation depth. This prevents Sybil attacks via many cheap freshly-verified identities. The cooldown duration and commit threshold are global parameters (votable), but the existence of a cooldown is frozen.
56. **Context-weighted vote eligibility**: Votes on branch-level governance (evidence rules, template changes, parameter adjustments) are weighted by: recency of participation on that branch (exponential decay, half-life = 90 days default), evidence contribution history on that branch (commits that added/verified evidence, not just presence), and active filament involvement (open filaments where the voter is a named party). A verified but inactive account on a specific branch cannot swing that branch's governance. This prevents off-platform vote renting — purchased votes from accounts with no branch history carry near-zero weight.
57. **Acceleration requires diverse participation**: The acceleration metric (heat = d(engagement)/dt) at GLOBE and REGION LOD is computed from eligible events only. Eligibility requires: Tier 1+ identity, distinct user IDs (not repeated events from the same user), per-scope rate limits (max N events per user per hour per branch), and engagement spam decay (repeated identical engagement types from the same source decay exponentially). A "hot" topic at globe scale requires diverse participants, not one coordinated cluster.
58. **FilamentBirth cluster suppression**: When FilamentBirth events (Note → Filament conversion) originate from the same device cluster (same IP subnet, same BLE proximity group, or same Wi-Fi SSID) at rates exceeding the branch-level spam threshold, subsequent births from that cluster are auto-classified as low-visibility (not deleted — append-only preserved, but excluded from attention aggregation and rendered at minimum prominence). The spam threshold is: max 3 FilamentBirths per cluster per hour per branch (default, votable). Exceeding it emits `[REFUSAL] reason=CLUSTER_SPAM_THRESHOLD`.
59. **Monster economy issuance budget**: Total engagement credit issuance from monster rewards is bounded per epoch. The issuance budget = `previous_epoch_issuance * (1 + rate_cap)` where `rate_cap` is the 20% frozen maximum from contract #46. If monster spawns would exceed the epoch budget, spawn rate is automatically throttled (DEGRADED mode). Throttle is visible: `[DEGRADED] reason=ISSUANCE_BUDGET_EXCEEDED`. Budget overrun is structurally impossible; issuance is metered, not open-ended.
60. **Difficulty floor and beginner ramp**: Monster difficulty adjustments cannot steepen faster than a frozen maximum delta per epoch. Additionally, a "beginner zone" exists: users with fewer than 30 days of engagement history face a difficulty ceiling that is 50% of the global difficulty parameter. This prevents difficulty starvation (too hard → new users can't participate → adoption stalls). The beginner threshold (30 days) and ceiling ratio (50%) are global parameters (votable), but the existence of a beginner ramp is frozen.
61. **Prohibited trigger taxonomy and venue safety defaults**: A frozen registry of prohibited spell triggers exists. Categories: triggers requiring combustion or open flame in enclosed spaces, triggers requiring high-altitude physical positioning, triggers directed at or near minors (age-gated by identity tier), triggers in designated safety zones (hospitals, schools, airports). Venue templates include a `safetyProfile` field that defaults to `restricted` for educational, medical, and transportation venues. Venue operators may loosen restrictions only via explicit governance commit on their tree. Stage 3 features are disabled by default in `restricted` venues.
62. **Presence anti-correlation and time-bucketing**: Presence updates transmitted beyond the local device are time-bucketed: at COMPANY LOD, updates are quantized to 5-second intervals. At REGION LOD, 30-second intervals. At GLOBE LOD, 5-minute intervals. Additionally, position precision degrades with LOD: COMPANY = 10m accuracy, REGION = 1km, GLOBE = 50km. Movement correlation attacks (inferring identity from motion patterns) are structurally mitigated by the combination of time-bucketing + precision degradation + statistical aggregation above COMPANY LOD.
63. **Blended confidence CI lint**: The `DUAL-CONFIDENCE-SEPARATION-PROOF` must run as a pre-commit gate. Any code path that introduces `computeConfidence()` calls (outside the deprecated trap), arithmetic expressions combining `orgConfidence` and `globalConfidence`, or shared setter functions for both channels must fail the proof and block the commit. This is enforced via pre-commit hook, not voluntary discipline.
64. **Git attachment hygiene**: Binary files larger than 500KB are blocked from Git commits by pre-commit hook. Evidence attachments (images, PDFs, video) are stored in content-addressed external storage (SHA-256 hash as key). Git stores only the content hash reference. Proof artifacts (screenshots, logs) are exempt up to 2MB per file. The hook is mandatory and cannot be bypassed without explicit `--no-verify` (which is logged as a governance event).
65. **Renderer over-instantiation refusal**: The filament-renderer enforces hard primitive budgets per LOD level (§33.2). When instantiation would exceed the budget, the renderer emits `[REFUSAL] reason=PRIMITIVE_BUDGET_EXCEEDED lod=<level> requested=<n> budget=<max>` and does NOT create the excess primitives. The world stays interactive. LOD budgets are frozen constants, not runtime-adjustable. This prevents the 100k-marker catastrophe.
66. **Camera operator liability model**: Any venue or organization connecting cameras to the Relay detection mesh must register as a **Data Processor** via a governance commit on their tree. The commit specifies: processing scope (which detection types are enabled), data retention period, geographic boundary of camera coverage, and the designated **Data Controller** (the legal entity responsible for compliance). Relay is the platform provider, never the controller. The operator model document is part of the legal posture requirement (contract #51). No camera connection is accepted without a registered processor commit.
67. **Founder activation jurisdiction checklist**: Stage Gate 3 activation (founder key) requires, in addition to the attestation commit (contract #48), a jurisdiction compliance checklist commit. This commit records: jurisdictions where Relay instances are active, per-jurisdiction compliance status (GDPR, CCPA, COPPA, local camera/privacy law), any jurisdictions where Stage 3 features are restricted or prohibited, and the legal posture document hash for each jurisdiction. Activation without the jurisdiction checklist emits `[REFUSAL] reason=JURISDICTION_CHECKLIST_MISSING` and blocks the key.
68. **Sortition juries are the sole dispute resolution mechanism**: No founder decree, admin action, or majority vote can override a jury verdict on dispute cases (Sybil enforcement, community disputes, quarantine appeals, governance deadlocks). The 4:3:3 sortition ratio (random:volunteer:historic), cryptographic selection, and bias detection are frozen. The sortition mechanism itself can be refined (jury size, eligibility thresholds) via parametric governance, but its existence and primacy over other resolution methods cannot be removed.
69. **Password Dance uses the spell detection pipeline**: The somatic authentication system (Password Dance) MUST use the same on-device camera detection pipeline (facial landmark extraction, motion vector analysis, audio feature extraction) that is used for spell trigger detection in Stage 2/3. No separate biometric system may be introduced. This ensures: pipeline validation from day 1, per-user calibration data, and muscle memory training for downstream spell interaction. The Password Dance is required for STRICT authentication level only; PIN is sufficient for BASIC and ELEVATED.
70. **Guardian recovery is social, never centralized**: Account recovery MUST require M-of-N guardian approval. No admin, founder, or system process can unilaterally restore account access. Guardian approval requires ELEVATED authentication. The recovery event is an append-only governance commit. Maximum 2 recovery attempts per 30 days. Founder account recovery adds a 7-day public waiting period.
71. **Invitation decay is structural, refill is community-governed**: New accounts are created only via invitation from existing users. Initial invite count decays linearly (parent_count - 1) per generation. Once a user's initial allocation is depleted, they are reduced to 1, and new invites are granted at the **global invite refill rate** — a community-voted parameter (e.g., 1/week, 1/month, or 0 to pause growth). Open registration is structurally impossible — there is no registration endpoint without a valid invite code. The invite tree is append-only and traceable to the founder. At steady state, all users operate under the same refill rate regardless of generation depth.
72. **Reverification is periodic and tier-gated**: Identity verification is not one-time. Every user is subject to periodic reverification at intervals determined by their trust tier (Probationary: 7 days, Trusted: 90 days, Verified: 180 days, Anchor: 365 days). Failed reverification triggers tier demotion. The existence of periodic reverification and the tier structure are frozen; the specific intervals are global parameters (votable).
73. **Dual-user simultaneous verification for Sybil cases**: When two accounts are suspected of being the same person, the system can require both to verify at different physical locations within a synchronized time window. This mechanism is frozen and available to jury sortition cases and automated Sybil enforcement. It cannot be disabled by governance vote.
74. **Authentication escalation is action-driven, not user-chosen**: The authentication level required for an action is determined by the action's risk category, not by user preference. Users cannot opt out of STRICT authentication for critical identity changes. The smart verification trigger evaluates behavioral context and escalates automatically. This prevents social engineering attacks where users are tricked into performing critical actions at a lower authentication level.
75. **Early adopter influence is intentional and self-diluting**: Early adopters (low generation depth) naturally accumulate higher trust, deeper engagement history, and broader guardian networks because they have been present longer. This is intentional — early adopters ensure the system is built correctly during the critical formation period. Their influence **dilutes naturally** as more users participate: trust score has a ceiling of 100 (a 1-year user with perfect reliability equals a 5-year user), vote weight is context-weighted by branch-specific recency (not account age), jury pools expand with population (reducing any individual's selection probability), and the 4:3:3 ratio ensures 40% random selection. Generation depth itself carries no direct governance advantage — it is metadata for Sybil tracing. The pattern is: early power for system stewardship → natural dilution through mass participation.
76. **Trust score is behavioral, not ideological**: Trust score measures reliability: reverification compliance rate, jury service completion rate, evidence contribution consistency, absence of scars. Trust score NEVER measures: opinion alignment, narrative compliance, voting pattern, controversy avoidance, or ideological conformity. A user who consistently dissents but reliably completes reverification, serves on juries, and contributes evidence has the same trust trajectory as a user who aligns with majority positions. Dissent cannot reduce trust.
77. **Jury historic pool rotation cap**: No user may serve in the historic jury pool for more than the consecutive term limit (initial value: 2 terms, global parameter — votable). After reaching the limit, a mandatory cooldown (initial value: 6 months, global parameter — votable) before re-eligibility for the historic pool. The user remains eligible for the random and volunteer pools during the cooldown. This prevents permanent jury incumbency by early adopters. The existence of rotation is frozen; the specific limits are votable.
78. **Password Dance has a fallback path**: If the on-device detection pipeline fails (ML degradation, hardware incompatibility, adversarial attack, accessibility needs), STRICT authentication falls back to: PIN + 2-guardian attestation, OR PIN + proximity reverification at a registered Relay location. The Password Dance is the preferred primary path but NEVER a single point of failure for identity security. The fallback is always available.
79. **Guardian network diversity requirement**: At least 1 of every user's designated guardians must be from a different generation-depth quartile than the user. This prevents closed-loop guardian clusters where early adopters guard only each other. The system enforces this at guardian designation time. If the requirement cannot be met (e.g., very early in launch when few generation-depth quartiles exist), the constraint relaxes to "at least 1 guardian outside the user's immediate invite chain."
80. **Stage 1 visibility is structurally primary**: At every LOD, the rendering engine prioritizes evidence structure (filaments, timeboxes, lifecycle states, confidence indicators) before spectacle overlays (spell effects, duel animations, monster visuals, weather). Spectacle layers can be toggled off by the user; evidence layers cannot. The default view always shows evidence structure. Stage 3 visual effects are additive overlays on the truth layer, never replacements. If the rendering budget is exceeded, spectacle is shed first, evidence last.
81. **Founder succession — Guardian Steward model**: If the founder account is inactive for the succession trigger duration (initial value: 365 consecutive days, global parameter — votable), succession authority transfers to the founder's designated guardian account. The guardian is elevated to **Steward of Relay** — a role with the same activation authority and constraints as the founder (cannot modify frozen contracts, cannot override governance, can only activate Stage 3 when thresholds are met). The new Steward receives a full Relay Founder-level tutorial and initiation sequence covering: all frozen contracts, the activation checklist, the jurisdiction compliance process, the attestation commit procedure, and the philosophical responsibility of the key. The Steward role is singular (one person). If the Steward's account also becomes inactive for the same succession trigger duration, the same succession process repeats to THEIR designated guardian. If no guardian is designated or the guardian account is also inactive, the Relay Sortition Council (§46.8) assumes activation authority as the final fallback (unanimous 7/7 consent required). The founder retains full user-level participation rights but loses sole activation authority upon succession. The existence of succession is frozen; the inactivity duration is votable.
82. **Emergency reform mechanism**: If a governance parameter or state causes demonstrable harm (3+ refusal logs per epoch or measurable system degradation in proof artifacts), a compressed reform path activates: 2x normal supermajority threshold (80% instead of 60%) with 1/4 normal settlement window. This allows urgent correction of harmful states without making routine governance changes easy. The emergency threshold and compression ratio are frozen.
83. **One-sentence explanation invariant**: Every governance mechanic that affects a user (vote weight change, parameter movement, reverification requirement, jury selection, trust score change, authentication escalation, migration trigger, confidence update) MUST display a one-sentence plain-language explanation in the UI at the point of interaction. Not in documentation, not in a help page — in the interface, at the moment it matters. If a mechanic cannot be explained in one sentence, the UI must still provide a summary with a drill-down option. Opacity is the primary legitimacy risk at scale; this contract is the defense.
84. **Regions vote features on or off**: Each region or jurisdiction governs its own feature set through standard parametric voting (§11). If a region's population votes to disable AR overlays, spell detection, duels, or any Stage 2/3 feature, those features are disabled in that region's trees. This is not a system fork — it is branch-level parametric governance. The core truth layer (Stage 1) is always active everywhere. Regional feature votes are visible globally: everyone can see that "Japan disabled AR overlays" or "Tokyo is a hotspot for RTS-style duels." This transparency lets the global community see which regions embrace which features, creating natural cultural identity within the unified system. Cross-region references use Merkle inclusion proofs (hash only, not content). No system-level fork is needed — the fractal model handles regional diversity natively.
85. **Sortition live peer grading with consensus outlier de-weighting**: After every jury verdict, jurors grade each other (1-100%). Grades are visible as they arrive (not sealed), mutable as drafts, permanent once committed. When a juror's received grades converge to a consensus drastically lower than what they gave others (the 0% attacker), their outgoing grade weight is reduced proportionally — their grades are recorded but their impact on others' trust is diminished. Coalition abuse is structurally impossible because sortition is randomized: you cannot pre-arrange jury composition, so systematic factional grading cannot form across juries. If a region's jurors consistently receive low grades across many randomized juries, the signal is real, not bias.
86. **Relay Sortition Council is elected by continuous confidence, not fixed terms**: Council seats are held by the person with the highest sustained confidence (vote count × recency × voter trust). Confidence drops below threshold = automatic replacement by next in succession chain. No fixed terms, no election cycles, no vacancy periods. Constant competitive pressure keeps council members accountable. Council members must maintain Anchor trust tier, no active scars, and all prerequisites continuously.
87. **Module approval requires sandbox → community vote → council review**: No code enters the live Relay system without passing through: SANDBOX (simulation mode, no real commits) → PROPOSAL (formal submission with artifacts) → COMMUNITY VOTE (quorum + 60% approval) → COUNCIL REVIEW (5/7 supermajority with constitutional compatibility check) → CANONICAL COMMIT (Merkle-sealed, permanent). The Council cannot bypass any step. The community cannot bypass council review for system-level changes.
88. **Three-level dispute escalation**: Standard jury (9, simple majority) → Appeal jury (13, zero overlap, supermajority) → Relay Sortition Council (7, supermajority 5/7, final). The Council is the final appellate authority. No further appeals after council verdict. Council members with conflicts must recuse; their seat is temporarily filled by the next in succession.
89. **Draft → commit is universal for temporary data**: Notes, sticky notes, grades, proposals, and all user-generated drafts are mutable until explicitly committed. Nothing is permanent until the user says so. Once committed, data is append-only and Merkle-sealed. This edit buffer applies uniformly across the system — authentication grades, sortition grades, proposal text, Note content. The same model everywhere.

90. **Projection recursion depth cap = 3**: A projection may reference a truth branch (depth 1), another projection (depth 2), or a projection-of-projection (depth 3). Beyond depth 3, the system refuses: `[REFUSAL] reason=PROJECTION_RECURSION_DEPTH_EXCEEDED`. Cyclic projection dependencies are detected and refused before evaluation. This prevents exponential recompute from nested analysis layers.

91. **Projection evaluation time budget**: Each projection recomputation must complete within the evaluation budget (initial value: 50ms, global parameter — votable). If exceeded, the system caches the last valid result with a staleness flag and logs degradation. Projections do not recompute per-commit; they recompute per-timebox-boundary. This throttles analysis to the natural system heartbeat.

92. **Federation protocol version contract**: Two Relay-compatible systems must share the same MAJOR protocol version. Every commit carries a `protocolVersion` field (semantic versioning). Cross-system verification uses Merkle inclusion proofs. A system that cannot deterministically replay another's commit log is NOT Relay-compatible regardless of branding.

93. **Cross-region Merkle anchor publication**: At every digest interval (initial value: 24 hours, global parameter — votable), each region publishes a digest commit containing its Merkle root, total commit count, and timestamp. These digests are broadcast globally and to a public anchor. Missing digests are flagged. Divergent digests trigger reconciliation. No region can quietly omit or delay commits without detection.

94. **External evidence freeze on ingest**: When external data (PDFs, emails, 2D system exports) enters Relay, the system computes SHA-256, stores the hash as an `externalEvidenceRef`, and archives the original in content-addressed storage. Deleted external files do not break the evidence chain. The freeze commit is append-only and includes ingesting user, timestamp, and original filename.

95. **Education maturity transition**: Education templates include automatic maturity migration. When a student reaches the jurisdiction's adulthood threshold, juvenile filaments are re-scoped to `disclosureTier = 0` and moved to a sealed private archive branch. Filaments are NOT deleted (append-only preserved), but they become invisible to public queries, trust computation, and sortition checks. Childhood mistakes do not become permanent public scars.

96. **Healthcare emergency break-glass commit**: Authorized medical personnel can access restricted evidence on patient trees in life-threatening emergencies. The break-glass commit is permanent (audit trail), auto-scarred on the accessor's tree, and must be justified within the justification window (initial value: 72 hours, global parameter — votable) via governance commit. Unjustified break-glass triggers trust reduction and potential sortition case.

97. **Evidence quality provides trust floor for principled dissenters**: A user whose evidence contributions are frequently referenced, cited in verdicts, or promoted to permanent fixtures maintains a minimum trust score proportional to their evidence impact. Social grading alone cannot push a high-evidence-quality contributor below jury eligibility or council candidacy thresholds. Objective contribution survives subjective popularity.

98. **Council decision immunity buffer**: When a council member participates in an official decision, an immunity window begins (initial value: 14 days, global parameter — votable) during which trust score changes do not affect their seat eligibility. After the window, normal continuous confidence resumes. Emergency reform (supermajority threshold is also a global parameter, initial: 80% Anchor-tier) overrides immunity. This prevents permanent campaigning and drift toward safe consensus.

99. **Invite-chain centrality is measured, not corrected**: The system tracks subtree size, branching factor, geographic distribution, and guardian overlap per invite chain. Metrics are publicly visible. Disproportionately large subtrees are flagged with a visibility marker. No restriction, no penalty — measurement only. Boundary reconfiguration is the user-facing pressure valve.

100. **Sovereignty-first measurement philosophy**: Relay makes clustering, pressure gradients, boundary shifts, trust drift, and divergence visible. It does not enforce diversity quotas, artificially balance ideological representation, or override local majority decisions with global consensus. People physically in a place have majority say. Exit (boundary reconfiguration) must always be easier than overthrow. Measurement cannot be falsified — that is the only true invariant.

101. **Astronomical alignment to real Earth**: Relay's globe is synchronized to actual Earth rotation, real solar position, and real lunar cycles using established ephemeris data (JPL DE440 / SOFA / Skyfield) pre-computed for 2026–2126 at 1-minute solar and 10-minute lunar resolution. Sleep cycle timing is regionalized by true solar altitude (not political time zones). Daylight duration variation by latitude and season is modeled. The ephemeris tables are Merkle-sealed, versioned, and governance-approved for updates. All periodic system events (digests, reverification, epochs) align to UTC boundaries.

102. **No hardcoded operational parameters**: Every numeric duration, threshold, ratio, interval, or limit in the system that affects user behavior or system operation is classified as either: (A) a global parameter with a founder-set initial value, immediately votable by the community; (B) a founder lever (stage gates, registry additions); or (C) a physics constant frozen in contract. Category A values are listed in the Global Parameter Registry (§11.6). If a value is not in the registry, it must be classified before implementation. No operational parameter is permanently hardcoded.

103. **No compute without observation**: Projections only evaluate when inside a viewer's active sight bubble or when explicitly published by a branch scope. Unpublished, unviewed projections hold their last cached result and consume zero compute. Content-based memoization ensures projections on stable branches (no new commits) cost nothing regardless of viewer count. This is the core invariant that prevents projection graph explosion at planetary scale.

104. **Projection instance cap per branch**: Each branch has a maximum number of active projections (initial value: 500, global parameter — votable). When the cap is reached, new ephemeral projections are queued and oldest ephemeral projections are evicted. Promoted projections count toward the cap but are never evicted. This prevents any single branch from becoming a compute black hole.

105. **Vote anonymity is architecturally supported**: The system supports both anonymous and non-anonymous voting modes. Anonymous votes (social, ideological, belief-oriented) are Merkle-sealed with encrypted choice payloads — the system enforces uniqueness and eligibility without knowing the choice. Non-anonymous votes (spending, delegation, evidence certification, governance parameters) are fully visible responsibility records. Templates define which mode applies to each vote class. Both modes are frozen architectural features.

106. **Sight radius and atmospheric compression**: Every user has a visibility bubble. Objects inside render at full LOD-appropriate detail. Objects outside fade and stop consuming render budget. Branch tips beyond the atmospheric zone scale down asymptotically toward zero (geometric convergence, not clipping). Privacy is enforced before geometry — objects the user cannot see do not enter the sight bubble computation. The sight radius is the fundamental mechanism that makes a world of billions of objects renderable on a single device.

107. **Sleep cycle timing follows real solar position**: Sleep onset triggers when local solar altitude drops below the voted onset threshold (initial: -6° civil twilight). Sleep end triggers at the voted end threshold. High-latitude regions (above the voted extreme latitude threshold, initial: ±66.5°) fall back to UTC-offset schedules during polar day/night. Transition smoothing interpolates between solar and UTC schedules near the threshold. All sleep-timing thresholds are global parameters (votable). The sleep duration is global; the timing is solar-regional.

---

## 46. Sortition-Based Case Resolution

When a dispute arises that normal voting cannot resolve — a contested account, a challenged piece of evidence, an ownership conflict — Relay does not hand the decision to an administrator or a CEO. It randomly selects a jury of ordinary users, the way courts select jurors in the real world. But fairer: the selection is cryptographically random so nobody can stack the jury, the members are drawn from diverse pools by design, and the verdict is recorded permanently on the public record. If you disagree with the outcome, you can appeal to a second jury. If that fails, a final council hears the case. Three levels, all transparent, all recorded.

Relay uses randomized jury sortition — not majority vote and not founder decree — to resolve disputes, adjudicate Sybil enforcement cases, and mediate governance conflicts that cannot be settled by parametric voting alone.

### 46.1 When Sortition Applies

Sortition is triggered for:
- **Sybil enforcement**: When the system flags an account as a suspected duplicate or bot, and the account contests the flag, a jury decides.
- **Community disputes**: Channel ownership conflicts, contested migration commits, evidence authenticity challenges.
- **Governance deadlock**: When a branch-level vote is sustained at exactly the threshold boundary (inside the hysteresis band) for longer than 2x the settlement window, a jury breaks the deadlock.
- **Quarantine appeals**: When content is quarantined (frozen contract #53) and the author appeals, a jury reviews the quarantine decision.

Sortition is NOT used for: routine parameter voting (that's continuous weighted-median), routine content moderation (that's filter tolerance), or Stage Gate activation (that's the founder key).

### 46.2 Jury Composition

Juries are composed using a **4:3:3 sortition ratio**:

| Pool | Ratio | Selection Method | Purpose |
|------|-------|-----------------|---------|
| **Random** | 4/10 | Cryptographically random from eligible population | Prevents capture by any faction |
| **Volunteer** | 3/10 | Self-nominated from eligible population, randomly selected if oversubscribed | Ensures motivated participants |
| **Historic** | 3/10 | Users with prior jury service and high completion rate | Provides institutional knowledge |

**Jury size**: 5-15 members (default 9). Size scales with case severity.

### 46.3 Eligibility

To serve on a jury, a user must meet ALL of:
- **Tier 1+ identity** (verified, not anonymous)
- **Minimum 30 days of activity** (prevents freshly created shill accounts)
- **Trust score >= 70** (computed from engagement history, evidence contribution, and absence of scars)
- **No conflict of interest**: not a party to the case, not on the same branch as the disputed content (for community disputes), not in the same device cluster as either party
- **Geographic relevance**: for proximity-based disputes, jurors must be within the same geohash proximity level (2 levels)
- **Sortition cap**: maximum 4 jury selections per month per user (prevents jury fatigue and concentrated influence)

### 46.4 Trust Mixing

To prevent elite capture of juries:
- Maximum 50% of jurors may come from the top trust tier (trust score >= 90%)
- The remainder must include members from the standard trust band (70-89%)
- This ensures juries reflect community breadth, not just the most active power users

### 46.5 Selection Process

1. **Case filed** → system builds eligible juror pools (random, volunteer, historic)
2. **Pool validation** → verify sufficient members in each pool; if a pool is too small, overflow redistributes to the random pool
3. **Cryptographic selection** → `crypto.randomBytes` generates provably fair random indices. Selection is verifiable by any party after the fact.
4. **Bias detection** → automated bias scoring checks for: demographic clustering, geographic clustering, trust score skew, prior interaction patterns between jurors and parties
5. **Jury seated** → jurors are notified; deliberation window opens (default: 72 hours)
6. **Deliberation** → encrypted communication channel. All messages auto-deleted after case resolution.
7. **Verdict** → simple majority for standard cases; supermajority (2/3) for quarantine appeals and governance deadlocks
8. **Blockchain audit** → jury selection, deliberation metadata (not content), and verdict are logged as an immutable governance commit on the system tree. Selection algorithm version, bias score, and trust distribution are recorded for auditability.

### 46.6 Live Peer Grading (Draft → Commit Model)

After a verdict is delivered, all jurors grade each other's participation. Grading follows the same **draft → commit** model as all temporary data in Relay (Notes, sticky notes, grades — nothing is permanent until explicitly committed):

**How grading works:**
- Each juror assigns a participation grade (1-100%) to every other juror
- Grades are **revealed to other parties as they arrive** — not sealed. When juror A grades juror B, juror B can see it immediately.
- Grades are **drafts** until the juror explicitly commits them. While in draft state, grades can be changed freely. Two jurors who reacted poorly to each other during deliberation can talk it through afterward and revise their grades.
- Jurors can continue communicating with each other during the grading window. The grading window is a continuation of the social space, not a locked ballot.
- When a juror commits their grades, they become **permanent** — append-only, Merkle-sealed, part of the jury audit commit. No further changes.
- The grading window has a deadline. Any grades not committed by the deadline are auto-committed at their current draft values.

**Why this works (game theory):**
- Even if most jurors collude and give everyone 100% to "be safe," there will always be 1-2 jurors who use the system honestly and grade others at 95%, 80%, etc.
- Jurors who consistently give 100% to everyone without differentiation create a pattern: their scores never move anyone else's trust, but their OWN trust stagnates because they never receive differentiated scores from the honest graders.
- Jurors who DO use the system honestly — giving accurate 80% or 95% grades — build a grading reputation. Their grades carry more signal over time.
- The incentive structure is: if you don't grade honestly, your own trust score drops relative to those who do, because honest graders are marking YOU down while you're not marking anyone.
- Over time, honest participation becomes the dominant strategy because non-participation is visible and costly.

**Consensus outlier de-weighting (the 0% attacker problem):**

If one juror grades everyone at 0% while the group grades that juror at 80-95%, the live visibility creates a natural many:1 correction — the group sees the hostile grades, revises their drafts for that juror downward, and the attacker is severely punished while everyone else is unaffected. But the attacker's 0% grades still carry outgoing weight against the group. This creates a minority abuse vector: one person tanking everyone's scores.

The fix: **when a juror's received grades converge to a consensus that is drastically lower than what they gave others, their outgoing grade weight is reduced proportionally.** If 7 jurors grade you at 0-10% and you graded them all at 0%, your outgoing grades are de-weighted because the group consensus says you are the outlier, not them. Your voice in this specific grading event is justly diminished — not silenced (your grades are still recorded), but their impact on others' trust scores is reduced.

**Why coalition abuse is structurally impossible here:**

The critical defense is that sortition juries are **randomized**. You cannot pre-arrange being on the same jury as your allies. Every jury is a fresh random draw from the eligible population. This means:
- You cannot form a voting bloc across juries — every jury has different members
- You cannot systematically grade a region or faction poorly — you don't choose who you serve with
- If a region's jurors consistently receive low grades across many randomized juries, the signal is real: those individuals are underperforming, not being targeted
- Regional or factional bias would require controlling the random selection itself, which is cryptographically secured

The combination of randomized assignment + live grade visibility + consensus outlier de-weighting + draft → commit flexibility makes the grading system robust against both lone attackers and coalition abuse.

**Trust score impact:**
- Committed grades affect the recipient's trust score (reliability metric)
- Consistently low grades from multiple peers reduce trust
- Consistently high grades from credible graders (those with a track record of differentiated grading) increase trust
- Consensus outlier grades are de-weighted (recorded but reduced impact)
- Grading data is permanent in the jury audit commit

### 46.7 Post-Verdict

- Verdict is a governance commit — append-only, Merkle-sealed, permanent
- Losing party may appeal once. Appeal triggers a new jury with increased size (+4 members) and zero overlap with the original jury
- After appeal verdict at the jury level, the case may be escalated to the Relay Sortition Council (§46.8) as the final appellate authority.
- Jurors who complete service receive a small engagement credit reward (from system issuance, not from parties). Jurors who fail to participate within the deliberation window are replaced and receive a scar on their user tree.

### 46.8 The Relay Sortition Council

The Relay Sortition Council is Relay's elected governing body — the appellate authority, module approval board, and constitutional stewardship body. Council members are the elected leaders of the Relay world, but their positions are earned through continuous confidence, not fixed terms.

**Composition:**
- The Council has **7 seats**. Each seat represents a functional domain (e.g., truth layer integrity, economic balance, identity/privacy, detection mesh, governance mechanics, community health, technical architecture).
- Council members are **elected by continuous vote** — not periodic elections with fixed terms. Every Tier 1+ user can vote for council candidates at any time. Vote weight follows the same context-weighted eligibility rules as all governance (frozen contract #56): branch-specific recency, evidence contribution history, engagement depth.
- The person with the highest sustained confidence for a domain seat holds that seat. Confidence is computed from vote count, vote recency (decay applies), and trust score of voters.

**Succession chains:**
- Each council seat has a **ranked succession list** determined by votes: #1 is the current holder, #2 has the next-highest confidence, #3 after that, etc.
- If a council member is removed (via reprimand, inactivity, or confidence drop below threshold), the next person in their succession chain automatically assumes the seat. No election delay, no vacancy period.
- A single person could theoretically be #2 in the succession chain for multiple seats — making them the most likely replacement for any removed council member. This creates **constant competitive pressure** that keeps council members accountable.
- Council members must meet all prerequisites continuously: Anchor trust tier, no active scars, reverification current, jury service history, evidence contribution above threshold. Falling below ANY prerequisite triggers automatic removal and succession.

**What the Council does:**

**1. Module approval (sandbox → production pipeline):**
- Any community member can develop a module (new feature, integration, extension) and deploy it in the **Relay Sandbox** — a SIMULATION-mode environment where all code runs but no commits affect the live system.
- The development lifecycle is: **SANDBOX → PROPOSAL → COMMUNITY VOTE → COUNCIL REVIEW → CANONICAL COMMIT**
  1. **Sandbox**: Developer builds and tests in simulation mode. The sandbox blocks all real commits — it is read-only physics preview with no side effects.
  2. **Proposal**: Developer submits a formal proposal with: description, sandbox proof artifacts (test results, edge cases, exploit attempts), artifact hash (content-addressed, verifiable), and optionally a bounty request.
  3. **Community vote**: The proposal enters a vote window (governed by `GOVERNANCE-CADENCE` rules). Quorum + 60% approval advances it. Community members can test the sandbox version and vote based on direct experience.
  4. **Council review**: The Council performs a full technical and constitutional review. They verify: the module does not violate frozen contracts, does not introduce new attack vectors, passes all existing proof suites, and is compatible with the current system architecture. Each council member reviews independently and votes. Supermajority (5/7) required for approval.
  5. **Canonical commit**: If approved, the module is committed to the live system as a governance commit, Merkle-sealed, with the council's approval signatures. The commit is permanent and append-only.

**2. Appellate authority (escalation hierarchy):**
- Disputes that exhaust the standard jury process (verdict + one appeal) can be escalated to the Council as the **final appellate body**. This mirrors the appellate/superior court structure:
  - **Level 1**: Standard jury sortition (9 jurors, simple majority)
  - **Level 2**: Appeal jury (13 jurors, zero overlap, supermajority)
  - **Level 3**: Relay Sortition Council (7 members, supermajority 5/7)
- The Council's verdict on an escalated case is final. No further appeals.
- Council members who have a conflict of interest with a case must recuse. Their seat is temporarily filled by the next in their succession chain for that case only.

**3. Constitutional stewardship:**
- The Council monitors system health: proof suite pass rates, refusal log frequency, economic metrics (issuance budget, difficulty curves), identity metrics (reverification compliance, Sybil detection rates).
- The Council can flag constitutional concerns — situations where the system's behavior drifts from the intent of frozen contracts. Flags trigger community discussion, not unilateral action. The Council cannot modify frozen contracts.
- The Council reviews and approves the legal posture document (frozen contract #51) for each new jurisdiction before production deployment.

**Accountability:**
- Council members are subject to **live peer grading** by the other 6 members (same draft → commit model as jury grading).
- Any council member whose confidence score drops below the threshold for their seat is automatically replaced by the next in succession.
- Bad decisions by the Council are permanently visible as governance commits. The community can see every approval, every rejection, and every vote.
- The Council cannot: modify frozen contracts, override parametric governance, activate Stage 3 (that's the founder/Steward key), grant themselves additional power, or create new council seats.

---

## 47. Voice Input Pipeline — Whisper, Architect, Canon

**Stage Gate:** 1→2→3. Stage 1: basic voice commands (speak → transcribe → propose). Stage 2: voice + gesture/light/object fusion as multi-modal SCV input. Stage 3: spell incantations where the verbal component is one signal in a multi-element activation sequence.

### 47.1 Overview

Every interaction in Relay — from creating a projection to filing an invoice to casting a spell — can be initiated by voice. The voice input pipeline has three named stages that mirror the SCV processing architecture:

```
VOICE → [Whisper] → raw transcript → [Architect] → structured intent → [Canon] → commit proposal → [Human] → approved commit
```

No stage can be skipped. Raw audio never becomes a committed filament without passing through all three processing stages and human approval.

### 47.2 Whisper — Speech to Text

Relay uses [OpenAI Whisper](https://github.com/openai/whisper) (MIT license) for speech recognition:

- **Local-first**: Runs on the user's device. No audio data leaves the device unless the user explicitly consents (Tier 0 privacy preserved).
- **Multilingual**: Supports 99 languages with automatic language detection. A user speaking Japanese is automatically transcribed in Japanese — the language itself becomes metadata on the interaction.
- **Model size is template-configurable**: Templates define which Whisper model to use based on the use case:

| Model | Parameters | VRAM | Use Case |
|-------|-----------|------|----------|
| `tiny` | 39M | ~1 GB | Fast on-device commands, low-power devices, real-time feedback |
| `base` | 74M | ~1 GB | Standard voice commands with moderate accuracy |
| `small` | 244M | ~2 GB | High-accuracy commands, multi-language environments |
| `turbo` | 809M | ~6 GB | Production-grade accuracy with good speed. Default for most templates. |
| `large` | 1.5B | ~10 GB | Maximum fidelity, archival-grade transcription, legal/medical contexts |

- **Two operating modes**:
  - **Command mode**: User speaks, pause detected, Whisper processes the complete utterance as a single unit. Suitable for discrete commands ("create a projection of Q3 revenue").
  - **Stream mode**: Continuous real-time transcription for duels, meetings, discussions. The transcript becomes a filament on the event branch with each utterance as a commit. Suitable for Stage 2 video presence conversations and Stage 3 duel commentary.

### 47.3 Architect — Intent Parser

The Architect layer is the first SCV sub-component in the voice pipeline. It takes raw transcribed text and produces structured intent:

**Input**: Raw transcript + context (current user location in tree, active scope, permissions, presence state, and in Stage 2+: simultaneous gesture/light/object signals)

**Output**: Structured intent object:

```json
{
  "IntentPacket": {
    "intentId": "intent.<uuid>",
    "source": "voice|gesture|light|object|multi-modal",
    "transcript": "show me all overdue invoices over 50K from Berlin",
    "language": "en",
    "confidence": 0.94,
    "parsed": {
      "action": "projection.create",
      "target": "branch.p2p.invoices",
      "filters": [
        { "field": "lifecycle", "op": "in", "value": ["OPEN", "ACTIVE"] },
        { "field": "magnitude", "op": "gt", "value": 50000 },
        { "field": "counterparty.approachAngle", "op": "region", "value": "Berlin" }
      ],
      "timeFilter": { "overdue": true }
    },
    "contextSnapshot": {
      "userScope": "zone.company.ops.p2p",
      "currentLOD": "BRANCH",
      "focusTarget": "branch.avgol.p2p.invoices"
    }
  }
}
```

**Architect rules:**
- Architect ONLY parses. It never executes, never creates commits, never modifies state.
- If the transcript is ambiguous, Architect produces multiple candidate intents ranked by confidence. The SCV presents options to the user.
- In Stage 2+, Architect fuses voice with simultaneous gesture/light/object signals to disambiguate. "Show me THIS" + pointing gesture = single unambiguous intent.
- Architect respects work zone boundaries: if the parsed intent targets a scope the user has no permission for, the intent is flagged as OUT_OF_SCOPE before reaching Canon.

### 47.4 Canon — Execution Planner

Canon is the second SCV sub-component. It takes structured intent and produces tree operations:

**Input**: Validated IntentPacket from Architect

**Output**: One or more proposed tree operations:
- Filament queries (search, filter, aggregate)
- Projection branch specifications (decision nodes, filters, terminus definition)
- Commit drafts (new filament, evidence attachment, vote cast)
- Navigation commands (camera move, LOD change, time scrub)

**Canon rules:**
- Canon produces PROPOSALS, never commits. Frozen contract #12 holds absolutely: SCVs do not execute.
- Every Canon output is rendered as a visible lavender projection showing exactly what will happen if approved.
- Canon respects all frozen contracts — no proposed operation may violate append-only, conservation, deterministic replay, or any other invariant.
- Canon attaches the original voice transcript as evidence on the proposed commit. Provenance is preserved: "This commit was voice-initiated. Transcript: [attached]. Intent confidence: 0.94."

### 47.5 Permission Model

Voice commands follow identical governance to any other input modality:

- Subject to work zone permissions (§19.3)
- Subject to commit materiality rules (§19.1): voice-commanded changes follow DRAFT → PROPOSED → COMMITTED
- Subject to vote eligibility gates (§7.4) for vote-related commands
- Subject to template evidence rules (§9.1) for commit-related commands
- Voice transcripts become evidence attachments on commits, creating full audit trail
- A voice command that would require governance approval (e.g., "migrate this filament to the HR branch") triggers normal governance workflow, not immediate execution

### 47.6 Voice as Evidence

Voice recordings and transcripts are first-class evidence in Relay:

- During duels (§42), both participants' voice streams are transcribed and become part of the event filament's evidence chain
- During meetings (Stage 2 video presence), voice transcripts can be committed as meeting filaments with full participant attribution
- During field work (proximity channels, §29), voice notes become filaments with GPS + proximity + voice evidence
- Voice evidence follows the same disclosure tiers as all other evidence — Tier 0 (anonymous transcript), Tier 1 (attributed), Tier 2 (full audio + identity)

---

## 48. Engineering Infrastructure — How the System Runs

*This section is for the engineers who will build Relay. It describes the servers, databases, authentication systems, and protocols that make everything above this point actually work. If you are reading this document to understand what Relay is and how it affects you as a user, you have already learned everything you need — you may skip ahead to Section 49, which describes how the system handles people who try to cheat.*

This section defines the engineering layers between the product specification (§0-§47) and a running system. These are implementation requirements, not product features. They are invisible to users but essential for the system to function.

### 48.1 Backend Architecture

**Requirements:**
- Must support millions of concurrent users across the globe
- Must propagate filament commits in near-real-time to all affected clients
- Must persist the Merkle chain permanently and verifiably
- Must support the fractal scaling model (neighborhood → city → country → globe)
- Must preserve deterministic replay across all nodes

**Architecture decision (to be finalized before BARK-CYLINDER-1):**
The backend topology must be chosen from one of three models, each with trade-offs:

| Model | Pros | Cons | Best For |
|-------|------|------|----------|
| **Centralized** | Simple consistency, easy to bootstrap, fast iteration | Single point of failure, scaling ceiling, trust dependency | MVP / Stage 1 bootstrap |
| **Federated** | Regional sovereignty, horizontal scaling, partial failure tolerance | Complex coordination, eventual consistency challenges | Stage 1 production deployment |
| **Decentralized** | No single point of failure, censorship resistant, aligns with Merkle/append-only model | Complex consensus, slow propagation, hard to bootstrap | Stage 2+ global deployment |

**Recommended path:** Start centralized for bootstrap (Stage 1 MVP), evolve to federated as adoption grows (Stage 1 production), with decentralized as the Stage 2+ target. The append-only commit model and Merkle chain are already designed for eventual decentralization — the data model does not need to change, only the transport and consensus layers.

### 48.2 Identity and Authentication

**Tier 0 (Anonymous):**
- No registration required. Ephemeral session. Can view, navigate, post Notes.
- Device fingerprint for rate limiting only (not stored as identity).

**Tier 1 (Verified):**
- Registration with email/phone verification OR decentralized identifier (DID).
- Can vote, create filaments, participate in governance.
- Identity verification method is template-configurable: email for casual, government ID for financial, biometric for high-security.

**Tier 2 (Named):**
- Full identity disclosure with organizational attestation.
- Required for material commits on enterprise trees, financial transactions, authority delegation.
- Linked to user tree with full responsibility mirror.

**Implementation path:** OAuth 2.0 + OIDC for centralized bootstrap. DID/Verifiable Credentials for decentralized future. Both paths produce the same Tier 0/1/2 levels — the verification method changes, not the trust model.

### 48.2.1 Authentication Tiers — PIN vs Password Dance

Relay uses a tiered authentication model where the required verification intensity scales with the criticality of the action:

**BASIC (PIN swipe):**
- Sufficient for: reading, navigation, posting Notes, voting, creating filaments, standard engagement
- Method: device PIN, biometric unlock (fingerprint/FaceID), or session token
- This covers 95%+ of all user interactions. The system should never interrupt flow for routine actions.

**ELEVATED (PIN + device attestation):**
- Required for: changing notification settings, modifying personal filter tolerances, delegating authority on user tree, editing template parameters (if authorized)
- Method: PIN/biometric + device attestation (prove you're on a registered device)
- Triggered by the smart verification system when behavioral anomalies are detected OR when the action is in the elevated-risk category

**STRICT (Password Dance — full somatic authentication):**
- Required for: identity changes (email, phone, DID swap), guardian modifications, key rotation, founder key activation, account deletion request, transferring authority over high-value branches, contesting a Sybil enforcement flag
- Method: **Password Dance** — the user performs a pre-enrolled sequence combining:
  1. **Spoken phrase**: the user recites their chosen passphrase aloud
  2. **Facial/body gesture**: simultaneously performs their enrolled gesture (nod, smile, wink, eyebrow raise, head turn, hand signal, or custom movement sequence)
  3. Both are captured via the device camera and microphone — the **same detection pipeline** used for spell activation, element recognition, and card detection in Stage 2/3
- The camera processes the video locally (on-device, raw frames never leave — frozen contract #49), extracts audio features (MFCC, spectral, temporal) and gesture features (68 facial landmarks, motion vectors, expression classification), combines them into a biometric vector (60% audio weight, 40% gesture weight), and matches against the enrolled pattern using ML-based similarity (85% threshold)
- This is deliberately performative — it cannot be done passively, cannot be done by someone who doesn't know both the phrase AND the physical gesture, and trains the same muscle memory the user will use for spell casting downstream
- Failed attempts (3 consecutive) escalate to LOCKOUT, requiring guardian recovery or proximity reverification

**Fallback when detection pipeline degrades:**
The Password Dance is the *primary* STRICT authentication path, but NOT the *only* path. If the on-device detection pipeline fails (ML model degradation, hardware incompatibility, adversarial attack on the model, accessibility needs), STRICT authentication falls back to: PIN + guardian attestation (2 guardians confirm identity via ELEVATED auth) OR PIN + proximity reverification at a registered Relay location. The fallback is always available. The Password Dance is preferred because it trains the spell pipeline, but it cannot be a single point of failure for identity security.

**Why the Password Dance uses the spell pipeline:**
The detection engine that recognizes hand signals, body movements, facial expressions, and vocal patterns for the Password Dance is architecturally identical to the engine that will later detect spell trigger sequences (card presentation + gesture + element + voice incantation). By requiring users to enroll and practice somatic authentication from day 1, the system:
- Trains users in the interaction paradigm before Stage 2/3 unlocks
- Validates that the detection pipeline works on their specific device and body
- Creates a baseline behavioral profile that improves detection accuracy over time
- Ensures the ML models have per-user calibration data before spell activation matters

### 48.2.2 Guardian Recovery

If a user loses access to their account (device lost, key compromised, Password Dance forgotten), the recovery path is social — not centralized password reset.

**Guardian designation:**
- Every Tier 1+ user is prompted to designate 3-5 trusted guardians from their contact network
- Guardians must be Tier 1+ verified accounts with at least 30 days of activity
- Guardian list is encrypted and stored on the user's tree (only the user and the guardians can see it)
- Annual verification: the system prompts users once per year to confirm their guardian list is current. Unconfirmed guardians are flagged but not removed.

**Recovery process:**
1. User (or claimant) initiates recovery request via any device
2. System sends recovery challenge to all designated guardians
3. **M-of-N threshold**: 2 out of 3 guardians (or 3 out of 5) must approve the recovery within 24 hours
4. Each guardian approval requires ELEVATED authentication (PIN + device attestation) — a guardian cannot approve recovery with just a tap
5. If threshold is met, a new key pair is generated and the account is re-bound to the claimant's device
6. The recovery event is logged as an append-only governance commit on the user's tree (permanent audit trail)
7. If threshold is NOT met within 24 hours, the recovery request expires. A new request can be filed after a 48-hour cooldown.

**Anti-abuse:**
- A guardian who approves a fraudulent recovery receives a scar on their tree (visible to future jury sortition eligibility checks)
- Maximum 2 recovery attempts per account per 30 days
- If all guardians are compromised or unavailable, the fallback is proximity reverification at a registered Relay location (§12.4)

**Founder account recovery:** The founder account (§44) has a special recovery path: M-of-N guardians + proximity reverification at a registered location + a 7-day waiting period with public notification on the system tree. This extended process prevents silent founder key theft.

### 48.2.3 Invitation Decay Tree

Relay grows through invitation, not open registration. Every new user enters via an invite from an existing user, and the number of invites decays with each generation. **The invite tree is a launch mechanism only — generational depth carries zero governance weight, zero trust advantage, and zero structural power.**

**Mechanics:**
- The founder starts with N invites (e.g., 50)
- Each invitee receives `parent_invite_count - 1` invites
- Example chain: Founder (50) → User A (49) → User B (48) → User C (47) → ... → User 49 (1)
- **Floor**: when a parent's invite count reaches 1, new invitees receive the global minimum parameter (default: 3, votable) instead of 0
- Every invite records its **generation depth** (founder = generation 0, direct invitee = generation 1, etc.)
- Invites expire after 14 days (configurable global parameter)
- Used invites are permanently consumed; unused invites can be reclaimed on expiry

**Steady-state convergence:**
The decay is a launch-phase mechanism. Once a user's initial invite allocation is fully used or expired, they are reduced to **1 remaining invite slot**. From that point forward, the **global invite refill parameter** governs how often they receive a new invite to give: once per week? Once per month? Unlimited? This rate is determined by global parametric governance vote (§11) — the entire community decides the growth rate of Relay.

At steady state, every user — regardless of when they joined or their generation depth — operates under the same refill rate. The initial burst (50 → 49 → 48...) provides launch momentum; the global refill rate provides controlled steady-state growth.

**Growth phases:**
- **Launch phase** (early): Initial invite allocations provide exponential burst. Founder seeds initial community. Early adopters have more invites to distribute.
- **Depletion phase**: Users exhaust their initial invite count and are reduced to 1. All users converge to the same state.
- **Steady state**: The global invite refill parameter governs growth for ALL users equally. If set to 1/week, every user can invite 1 new person per week. If set to 1/month, growth is slower. If the community votes to pause invites entirely (refill = 0), growth stops. The rate is always votable, always visible, always the same for everyone.

**Why decay and not open registration:**
- **Sybil resistance**: creating accounts costs social capital (someone spent an invite on you). Mass account creation requires burning through a chain of real invites, and at steady state, each user gets one new invite per refill cycle.
- **Accountability chain**: every account traces back to a founder through the invite tree. If an account is flagged for abuse, the system can trace the invitation path.
- **Launch momentum**: early adopters seed the community via initial allocation burst, then the system converges to uniform refill rate.
- **Community-governed growth rate**: the refill rate (how often each user gets a new invite) is a global parameter voted by the entire community. The community directly controls how fast Relay grows. This is not a technical rate limiter — it is a governance decision about growth.

**What invite depth does NOT do:**
- Does NOT increase governance weight
- Does NOT increase vote power
- Does NOT increase trust score
- Does NOT increase jury eligibility
- Does NOT grant guardian priority
- Does NOT affect confidence calculations
- Does NOT create structural hierarchy

**Invite tree analytics:**
The system tracks per-generation invite usage, average decay factor, tree depth, and branching factor. These metrics are visible on the system tree as governance data, allowing the community to monitor growth health and detect when the system has reached steady state.

### 48.2.4 Scheduled Reverification by Trust Tier

Identity verification is not one-time. The system applies periodic reverification based on the user's current trust tier:

| Trust Tier | Reverification Type | Frequency | Method |
|-----------|-------------------|-----------|--------|
| **Probationary** (new, flagged, or post-recovery) | Hotspot required | Every 7 days | Physical visit to registered Relay location + multi-signal confirmation (BLE + Wi-Fi + time-in-range) |
| **Trusted** (established, no flags) | Light periodic | Every 90 days | Biometric ping (smile at camera) OR device attestation |
| **Verified** (long-standing, evidence contributor) | Standard periodic | Every 180 days | Biometric ping + device attestation + optional gesture |
| **Anchor** (high trust, prior jury service, community validator) | Enhanced periodic | Every 365 days | Biometric ping + device attestation + community validation (another Anchor attests in proximity) |

**Tier transitions:**
- New accounts start at **Probationary** for 30 days minimum
- Promotion to **Trusted** requires: 30 days + 10 evidence commits + no scars + passed reverification
- Promotion to **Verified** requires: 180 days + 50 evidence commits + jury service completion
- Promotion to **Anchor** requires: 365 days + 100 evidence commits + 3+ jury completions + community nomination

**Demotion triggers:**
- Failed reverification → demoted one tier + cooldown before re-attempt
- Sybil flag → immediate demotion to Probationary
- Scar accumulation (3+ scars) → demoted to Probationary with extended review
- Inactivity > 180 days → demoted one tier (re-promotion available on return)

**Dual-user simultaneous verification:**
When two accounts are suspected of being controlled by the same person (Sybil case), the system can require both accounts to verify simultaneously at different locations from their respective proximity histories. Both users receive a challenge with a synchronized time window. Success on both sides (verified at geographically separated locations at the same time) is strong evidence of distinct control.

### 48.3 Real-Time Synchronization

**Commit propagation:**
- Event sourcing: all state changes are commits. Clients reconstruct state from the commit log.
- WebSocket fanout for real-time updates (centralized/federated). Gossip protocol for decentralized.
- Commit ordering: monotonic sequence number per branch. Global ordering via Lamport timestamps + branch-level sequence. Ties broken by commit hash.

**Conflict resolution:**
- Two users commit to the same filament simultaneously: both commits are accepted (append-only). The second commit references the first's hash. No data lost, no overwrites.
- Merge semantics: filaments are append-only logs, not mutable state. "Conflict" means "two things happened at the same time," which is truth, not error.

**Consistency model:**
- Branch-level strong consistency (all commits on a branch are totally ordered).
- Cross-branch eventual consistency (commits on different branches propagate independently).
- Global ordering is eventually consistent with guaranteed convergence via Merkle chain verification.

### 48.4 Storage Architecture

**Hot storage (active filaments):**
- Relational or document database for active tree state (filaments with lifecycle != ABSORBED).
- Indexed by branchId, timeboxId, lifecycleState, counterparty, magnitude for fast queries.
- Replicated across regions for read performance.

**Warm storage (recent archives):**
- Object storage (S3-compatible) for recently absorbed filaments and root cubes.
- Queryable via metadata index. Full content retrievable on demand.

**Cold storage (Merkle root archive):**
- Append-only, content-addressed storage for the permanent Merkle chain.
- IPFS or similar content-addressed network for decentralized verification.
- Minimum 3 geographic replicas. Hash verification on every read.

**Attachments (evidence files):**
- Object storage with content-addressing (SHA-256 hash as key).
- Deduplication via content hash. Same file attached to 1000 filaments = stored once.
- Tiered access control per disclosure tier.

### 48.4.1 Boundary Data Source-of-Truth

**Current status: Repo-file sourced (temporary).**

Geospatial boundary data (`data/boundaries/*.geojson`) is loaded directly from repository fixture files by the BoundaryRenderer at runtime. This is a bootstrap convenience, not the permanent model.

**Transition rule:** When boundary-define commits are implemented (a commit type that declares a geographic boundary with content-hash), the BoundaryRenderer must:
1. Verify loaded GeoJSON against the content-hash from the defining commit.
2. If no boundary-define commit exists for a requested boundary, emit `[REFUSAL] reason=BOUNDARY_SOURCE_UNCOMMITTED` and fall back to fixture data with a `source=REPO_FILE` log annotation.
3. If a commit exists but the hash does not match the fixture file, refuse to render.

Until boundary commits exist, all boundary loads are annotated `source=REPO_FILE` in console logs.

### 48.5 Bootstrap Strategy

**Minimum viable deployment (Stage 1 MVP):**
1. Single company tree with one template (P2P or municipal services)
2. Centralized backend (single server region)
3. Cesium globe with one trunk visible
4. 10-50 users demonstrating: filament create → evidence → confidence → sinking → root archive
5. Full proof suite passing (all existing proofs + BARK-CYLINDER-1)

**Growth path:**
- MVP → pilot companies (5-10 trees, federated backend)
- Pilot → public beta (1000+ trees, regional federation)
- Beta → production (global federation, social layer active)
- Production → Stage 2 (AR features unlocking per-user as achievements are discovered)
- Stage 2 mature → Stage 3 readiness (founder key activation consideration)

**Cold start for social layer:**
- Import existing 2D content (§37 Knowledge Migration Phase 1) to populate trees with historical data
- Notes system provides zero-barrier entry (post a Note, no registration required at Tier 0)
- First company trees provide the "anchor" content that social discussion attaches to

### 48.6 Economic Sustainability

**Revenue model (to be finalized):**
The system must sustain itself without compromising frozen contracts. Candidate models:

- **Freemium**: Tier 0 viewing free. Tier 1+ features (voting, filament creation) require subscription. Enterprise templates premium.
- **Transaction fee**: Small fee on magnitude-bearing commits (financial transactions). Zero fee on social/discussion.
- **Storage tier**: Free up to X GB of evidence attachments. Premium for high-volume enterprise.
- **SCV compute**: Basic SCV operations free. Advanced projections, large-model Whisper, GPU-intensive AR = premium compute.

**Constraint:** No revenue model may create pay-to-win dynamics. Achievement tokens must remain earned through real-world proof, never purchasable. Vote power must never correlate with payment tier. Frozen contracts are not gated behind payment.

### 48.7 Legal and Regulatory Compliance

**GDPR vs Append-Only:**
- The append-only contract (frozen contract #1) conflicts with GDPR Article 17 (right to erasure).
- Resolution: **cryptographic erasure**. The filament remains in the Merkle chain (structural integrity preserved), but the encryption key for the personal data payload is destroyed. The commit exists but its content is unreadable. The hash chain remains valid because the ciphertext (now undecryptable) still hashes correctly.
- This preserves: append-only integrity, Merkle chain validity, deterministic replay (the commit exists, its effect is null).

**Data sovereignty:**
- Federated backend enables regional data residency. Filaments created in the EU stay in EU nodes.
- Cross-region references use Merkle inclusion proofs (hash only crosses border, not content).

**Content liability:**
- Relay is an infrastructure platform, not a publisher. Content is user-generated.
- The confidence physics and filter system provide community-driven content quality without editorial control.
- Illegal content: template operators can define prohibited content rules. Violation triggers governance removal (migration to quarantine branch, not deletion — append-only preserved).

### 48.8 Performance at Scale

**Globe LOD rendering:**
- Server-side pre-aggregation: trunk metrics (engagement, attention, heat) computed server-side and streamed as tile metadata.
- Spatial indexing: R-tree or similar for fast "what trunks are visible in this viewport" queries.
- Progressive loading: coarsest LOD first (globe with hotspots), detail loads as user zooms.

**Branch LOD rendering:**
- Client-side: only the focused tree + immediate neighbors are fully rendered.
- Frustum culling: branches outside the camera frustum are not rendered.
- Primitive budget (§33.2): hard cap on simultaneous primitives per LOD level.

**Target performance:**
- 60 FPS at all LOD levels on mid-range hardware (existing D0 policy framework applies)
- < 200ms commit propagation latency (client to first peer)
- < 2s tree state reconstruction from commit log for any 1000-filament branch

### 48.9 Offline and Resilience

**Local-first data:**
- Active tree state cached locally. Users can navigate and read offline.
- Commits created offline are queued with local timestamps.
- On reconnect: queued commits are submitted. Server assigns authoritative sequence numbers. If no conflict (append-only model makes this the common case), commits are accepted in order.

**Network partition:**
- Clients continue operating with cached state.
- Presence markers go stale (TTL expires, presence disappears from other clients' views).
- Commits created during partition are reconciled on reconnect via the append-only merge model.

**Server failure:**
- Federated model: other regions continue operating. Affected region's data is read-only from replicas until primary recovers.
- Merkle chain enables verification of recovered state against known-good root hashes.

### 48.10 Enterprise Integration

**API surface:**
- REST API for CRUD operations on filaments, branches, templates, and commits
- WebSocket API for real-time commit stream subscription
- Webhook API for push notifications on branch events (new filament, confidence change, twig detection)
- Bulk import API for initial data migration (CSV/JSON → filaments)

**Connectors (future):**
- SAP: purchase order / invoice / goods receipt → P2P filaments
- Salesforce: opportunity / contact / case → CRM filaments
- Jira/GitHub: issue / PR / commit → software development filaments
- QuickBooks/Xero: transaction → accounting filaments

**Route engine (existing §C0):**
The route engine already provides config-driven data flow with provenance. Enterprise connectors are route configurations that map external system events to Relay filament schemas.

### 48.11 SCV AI Architecture

**Model selection:**
- Architect (intent parsing): Fine-tuned language model (GPT-class) for command parsing. Must understand tree-domain vocabulary (filament, branch, timebox, projection, confidence).
- Canon (execution planning): Structured output model that produces valid tree operations from parsed intent. Must respect all frozen contracts in output generation.
- Projection builder: Model capable of reading tree state (3D spatial data) and constructing analytical projections with decision nodes.

**Personal SCV memory:**
- Each user's SCV maintains a learned preference model stored as filaments on the user tree (§8).
- Preferences include: frequently used commands, custom spell definitions (Stage 3), graphic asset library (Stage 2), voice vocabulary adaptations.
- Memory is portable (it's just filaments) and subject to the same privacy tiers as all user tree data.

**Context window:**
- SCV context includes: current tree state (focused branch + neighbors), user's active scope, user's permission set, recent commit history, user's preference filaments.
- For spatial reasoning (§16.3): the SCV receives the 3D coordinate state of the focused branch and uses it as structured input, not rendered pixels.

### 48.12 Wire Protocol

**Commit format:**
- JSON for human-readable contexts (development, debugging, API responses)
- Protocol Buffers for wire efficiency (client-server, server-server communication)
- Every commit carries: commitId, parentHash, branchId, filamentId, timestamp, payload, signature

**Maximum sizes:**
- Commit payload: 1 MB (text, structured data, metadata)
- Evidence attachment reference: unlimited references, but each attachment stored separately in object storage
- Single attachment: 100 MB (configurable per template)

**Attachment handling:**
- Attachments are stored by content hash in object storage
- Commits reference attachments by hash, not by embedding content
- Retrieval is on-demand, not bundled with commit propagation

### 48.13 Key Management

**Key hierarchy:**
- Root key: per-user master key (never leaves secure enclave / HSM if available)
- Branch keys: derived per-branch for envelope encryption
- Session keys: ephemeral, per-connection for transport encryption

**Lifecycle:**
- **Rotation**: Automatic key rotation per the key rotation period (initial value: 90 days, global parameter — votable). Old keys retained for decryption of historical content. New content encrypted with new key.
- **Recovery**: Key recovery via threshold secret sharing (Shamir's scheme). User designates N trusted parties, M of N required to recover. Recovery event is a commit on the user tree (auditable).
- **Revocation**: Key revocation is a commit. Revoked key's content is re-encrypted with new key (lazy re-encryption on access). Revocation propagates via normal commit channel.
- **Delegation**: Authority delegation via sub-key issuance. Delegate receives a derived key that grants specific scope access. Revocable by the delegator.

### 48.14 Versioning and Upgrades

**Replay-safe upgrades:**
- Every computation function (confidence, wilt, KPI binding) is versioned.
- Commits carry the version of the computation that produced them.
- Replay engine loads the correct version of each function for each commit in the log.
- New versions can change future computation without invalidating historical replay.

**Schema evolution:**
- Filament schema extensions are append-only (new fields added, old fields never removed).
- Templates define minimum schema version. Older filaments are forward-compatible (missing new fields = null).
- Breaking changes require migration commits at the template level (governance-approved).

### 48.15 Mobile and Cross-Platform

**Progressive Web App (PWA):**
- Primary mobile interface. Cesium runs in mobile browser with reduced LOD budget.
- Offline capability via service worker + local commit queue.
- Push notifications for branch events, twig alerts, vote requests.

**Native considerations (future):**
- iOS/Android native for proximity channel detection (BLE/Wi-Fi requires native APIs).
- Camera access for Stage 2 (gesture/light/object detection).
- Whisper runs on-device via Core ML (iOS) / TFLite (Android) for voice commands.

**Reduced LOD for mobile:**
- Mobile skips LANIAKEA/GALACTIC/STELLAR LOD levels (globe is the highest level).
- Branch rendering uses lower primitive budget.
- Bark-to-flat transition is default (no cylindrical rendering on mobile — always flat spreadsheet view at CELL LOD).

### 48.16 Federation Protocol Contract

For Relay-compatible systems (forks, federated nodes, "Belay" competitors) to remain interoperable, a minimum protocol contract must hold:

**Mandatory for Relay-compatible status:**
- Commit schema: append-only, content-addressed (SHA-256), same six-domain field structure (§4)
- Merkle chain: deterministic tree construction, identical hash function, verifiable inclusion proofs
- Confidence model: dual channels (org + global), never blended, same computation signatures
- Filament schema: filament = row, lifecycle state machine, disclosure tiers
- Replay determinism: given the same commit log, any conforming node produces identical state

**Protocol versioning:**
- Every commit carries a `protocolVersion` field (semantic versioning: MAJOR.MINOR.PATCH)
- MAJOR version change = breaking schema change (requires migration commit, governance-approved)
- MINOR version change = new optional fields (backward-compatible, old nodes ignore new fields)
- PATCH version change = computation refinement (same inputs, potentially improved outputs)
- Two systems are Relay-compatible if they share the same MAJOR version

**Cross-system verification:**
- Any Relay-compatible node can verify any other node's Merkle chain by replaying the commit log
- Cross-system references use Merkle inclusion proofs (hash only, not content)
- A system that cannot replay another system's commits is NOT Relay-compatible, regardless of what it calls itself

### 48.17 Cross-Region Merkle Anchor Publication

To prevent silent regional divergence (where federated regions selectively delay or omit commits), the system publishes **global digest commits** at fixed intervals:

- At every digest interval (initial value: 24 hours, global parameter — votable), each region publishes a digest commit containing: the Merkle root of all commits in that period, total commit count, region identifier, and a timestamp
- These digest commits are broadcast to ALL regions and to a public anchor (e.g., a public bulletin board, a public blockchain, or a government timestamp service)
- Any region that fails to publish a digest within the window is flagged: `[WARNING] reason=REGION_DIGEST_MISSING region=<id>`
- Cross-region verification: any user can compare digest roots between regions to detect divergence
- If two regions' digests diverge for the same time period, both are flagged for reconciliation. The commits are still valid per-region, but the global state is marked as partitioned.

### 48.18 External Evidence Freeze

When external data (PDFs, emails, images, video, 2D system exports) is ingested into Relay, the system creates a **freeze commit** that cryptographically anchors the external content:

- On ingest: the system computes SHA-256 of the raw file, stores the hash as an `externalEvidenceRef` field on the filament, and archives the original file in content-addressed storage
- The freeze commit records: original filename, file hash, ingest timestamp, ingesting user ID, and the content-addressed storage location
- If the external file is later deleted from its original source, the Relay evidence chain remains intact — the hash proves the content existed and the archived copy is retrievable
- This prevents: a deleted PDF breaking evidence integrity, a modified email invalidating a commit chain, or an external system's data loss cascading into Relay's truth layer
- Evidence that cannot be hashed (live streams, real-time feeds) is frozen at snapshot intervals with timestamp + hash pairs

### 48.19 Education Template — Maturation Scoping

Education trees must account for the fact that append-only permanence can be socially harmful for minors:

- Education templates include a **maturity transition** mechanism: when a student reaches adulthood (age threshold configurable per jurisdiction, default 18), their juvenile filaments are migrated to a **private root archive** on their user tree
- The migration is: the filaments are NOT deleted (append-only preserved), but they are re-scoped to `disclosureTier = 0` (visible only to the user) and moved to a sealed archive branch
- The sealed archive is: encrypted, accessible only to the user, excluded from all public queries, excluded from trust score computation, and excluded from jury sortition eligibility checks
- Childhood academic mistakes, behavioral incidents, and disciplinary records do not become permanent public scars
- The migration is automatic at the age threshold, governance-approved per template, and logged as a lifecycle commit

### 48.20 Healthcare — Emergency Override Commit

Healthcare trees require a mechanism for emergency access that respects append-only integrity:

- An **emergency break-glass commit** type exists: authorized medical personnel can access restricted evidence on a patient's tree in life-threatening situations without the patient's explicit real-time consent
- The break-glass commit records: who accessed, what was accessed, when, the medical justification, and the emergency authorization level
- The break-glass commit is: append-only (permanent audit trail), auto-scarred (visible on the accessor's user tree as a break-glass event), and subject to post-incident review
- Post-incident review: within the justification window (initial value: 72 hours, global parameter — votable), the break-glass event must be justified via a governance commit on the healthcare tree. Unjustified break-glass events trigger trust score reduction and potential sortition case
- The existence of the break-glass mechanism does not weaken normal consent requirements — it is an explicitly logged exception, not a silent bypass

### 48.21 Testing at Scale

**Load testing:**
- Simulate 10K concurrent users on a single tree (commit rate, query latency, presence marker updates).
- Simulate 1M concurrent users across 10K trees (cross-tree propagation, globe LOD aggregation).
- Target: < 500ms P95 commit propagation, < 100ms P95 query latency, 60 FPS render at all LOD.

**Chaos engineering:**
- Network partition simulation (split-brain, delayed reconnect, commit queue overflow).
- Server failure simulation (primary down, replica promotion, Merkle chain verification on recovery).
- Clock skew simulation (Lamport timestamp convergence under extreme skew).

**Proof discipline:**
- Every build slice continues to follow SPEC → IMPLEMENT → PROOF → COMMIT → INDEX.
- Scale proofs added as a new proof category: SCALE-PROOF-<name> with specific load profile and pass criteria.
- Existing proof suite runs as regression gate for every commit (CI/CD integration).

---

## 49. Adversarial Edge-Case Model

What happens when people try to cheat? What if someone creates thousands of fake accounts to manipulate votes? What if a group tries to game the attention system? What if a powerful minority pressures dissenters into silence? This section examines every way someone might try to game, manipulate, or break Relay — and explains how the system responds. The answer is almost never "we block it." The answer is usually "the physics make it visible, and the community handles it." Relay does not pretend bad actors do not exist. It makes their actions measurable.

This section explicitly documents how the system behaves under adversarial, extreme, or degenerate conditions. Each scenario maps to the frozen contracts and structural mechanisms that contain it.

### 49.1 High-Frequency Vote Attack

**Scenario:** An attacker creates many Tier 1 accounts and votes rapidly to manipulate global parameters or branch governance outcomes within a single vote window.

**Containment:**
- Vote eligibility gates (frozen contract #22): Minimum Tier 1 identity + engagement history required. No zero-history accounts can vote.
- Vote decay (frozen contract #23): Votes decay exponentially. Rapid vote spam has diminishing returns as earlier votes decay before the window closes.
- Migration hysteresis (§7.7): Vote-driven migration commits require supermajority AND stability over multiple consecutive epochs. A single burst cannot trigger migration.
- Parametric rate-of-change caps (frozen contract #46): No single epoch can shift a global parameter by more than 20%.
- Fresh account governance cooldown (frozen contract #55): 14 days + 10 domain commits minimum.
- Context-weighted vote eligibility (frozen contract #56): branch-specific recency + evidence contribution history.
- Invitation decay tree (frozen contract #71): accounts are invite-only with linear decay. Mass account creation burns social capital.
- Periodic reverification (frozen contract #72): Sybil accounts must sustain reverification at Probationary frequency (every 7 days).
- **Residual risk:** A patient attacker who builds engagement history over months and then votes in coordinated burst. Mitigated by vote decay half-life, the supermajority+hysteresis requirement, and context-weighted vote eligibility (inactive accounts carry near-zero branch weight) — sustained manipulation is expensive and visible in the vote history filaments. If suspected, dual-user simultaneous verification (frozen contract #73) can be triggered via jury sortition (frozen contract #68).

### 49.2 Bot / Tier 0 Infiltration

**Scenario:** Bots flood the system with Tier 0 anonymous presence, attention signals, or content to distort globe visibility or manipulate attention-driven rendering.

**Containment:**
- Tier-gated attention at globe LOD (frozen contract #45): Tier 0 attention excluded from trunk prominence above COMPANY LOD.
- Presence quantization (frozen contract #52): At GLOBE/REGION LOD, presence is statistical — individual bot markers don't render.
- Vote eligibility (frozen contract #22): Tier 0 cannot vote.
- Achievement tokens require SCV-validated real-world proof (frozen contract #30): Bots cannot earn advanced resources.
- Sleep cycle rate-limiting (frozen contract #43): Enforced rest period caps sustained bot activity.
- Acceleration diversity requirement (frozen contract #57): Globe-level heat requires diverse Tier 1+ participants.
- FilamentBirth cluster suppression (frozen contract #58): Same-cluster birth spam auto-classified as low-visibility.
- Attention is a lens, never a lever (frozen contract #54): Even if bots inflate attention, attention grants zero governance power.
- **Residual risk:** Bots can still spam content at COMPANY LOD within individual trees. Mitigated by template operator's prohibited content rules + quarantine branch mechanism (frozen contract #53) + device-level rate limiting.

### 49.3 Time Skew / Time Zone Exploitation

**Scenario:** Users in different time zones exploit the sleep regeneration cycle, gravitational sinking, or timebox boundaries to gain unfair advantage. Or: clock manipulation to generate commits with false timestamps.

**Containment:**
- Gravitational time (§14): Earth rotation IS the clock. Time is not user-configurable. Sinking is tied to the globe rotation, not local clocks.
- Commit timestamps are server-attested in federated mode (§48.3): Client-submitted timestamps are validated against server time. Out-of-range timestamps are rejected.
- Sleep cycle is global (frozen contract #43): Same rest period for all users. Time zone offset means different local times, but the same duration constraint.
- Timebox boundaries are Merkle-sealed: Retroactive manipulation of timebox start/end times breaks the hash chain and is detectable.
- **Residual risk:** In fully offline mode, timestamps are self-attested. Reconciliation on reconnect may reveal anomalies (divergence detection, §E3 replay). Scars are applied to suspect commits.

### 49.4 Economic Shock

**Scenario:** A sudden governance vote dramatically alters monster economy parameters (spawn rate, reward, difficulty) causing hyperinflation of engagement credits or sudden scarcity.

**Containment:**
- Rate-of-change caps (frozen contract #46): Max 20% parameter change per epoch. Shock is structurally impossible in a single cycle.
- Resource non-convertibility (frozen contract #47): Even if engagement credits inflate, they cannot be converted to achievement tokens or power. The damage is contained to one resource pool.
- Power closed loop (frozen contract #38): Gaming resource never affects governance. Economic shock in the game layer has zero governance impact.
- Stage 1 outweighs Stage 3 (frozen contract #42): Real-world contribution always yields more system influence than gaming performance, regardless of economic conditions.
- **Residual risk:** Sustained manipulation over many epochs (each shifting 20%) could still move parameters significantly over months. Mitigated by community visibility — all parameter changes are governance commits visible to everyone, creating social pressure against manipulation.

### 49.5 Founder Key Compromise

**Scenario:** The founder account is compromised and an attacker activates Stage Gate 3 prematurely, or the founder activates under duress.

**Containment:**
- Activation requires attestation commit (frozen contract #48): The commit records exact system state at activation. If parameters are not at safe thresholds, the activation is evidence of compromise.
- Once activated, irreversible (frozen contract #34): But Stage 3 content is additive — it cannot break Stages 1-2 (frozen contract #28). Even premature activation does not destroy existing functionality.
- All Stage 3 spell effects resolve to Stage 1 filament operations (frozen contract #31): The game layer has no independent power over the data layer.
- **Residual risk:** Premature activation exposes users to game-layer complexity before the community is ready. Mitigated by the fact that game-layer features require individual achievement progression to unlock — activation doesn't grant instant power to anyone.

### 49.6 Regional Partition / Network Split

**Scenario:** A major network partition isolates regions. Commits continue in each partition independently. On reconnection, the system must reconcile divergent state without data loss.

**Containment:**
- Branch-level strong consistency, cross-branch eventual consistency (§48.3): Each branch maintains total ordering. Cross-branch divergence is expected and resolved on reconnect.
- Append-only + Merkle chain (frozen contracts #1, #2): Divergent commits are detected by hash comparison. No silent overwrite is possible.
- Offline commit queue (§48.9): Commits created during partition are queued and replayed on reconnect.
- Divergence scars (§E3 replay): When two partitions created conflicting commits, both are preserved and a scar records the divergence.
- **Residual risk:** Governance votes cast in separate partitions may reach different conclusions. Resolution: the partition with the earliest Merkle-sealed quorum commit wins. The other partition's votes are preserved as historical record but do not override.

### 49.7 Partial Data Corruption Under Dual Confidence

**Scenario:** A storage or transmission error corrupts either `orgConfidence` or `globalConfidence` for a set of filaments, while the other channel remains intact.

**Containment:**
- Dual confidence separation (frozen contract #44): The channels are independent. Corruption of one does not affect computation of the other. Rendering continues with the intact channel; the corrupted channel shows as null/indeterminate.
- Merkle chain integrity (E1-CRYPTO): Corruption is detectable via hash verification. Corrupted commits fail verification and are flagged.
- Replay engine (E3): The correct confidence values can be recomputed from the commit log (deterministic replay). If the underlying commits are intact, confidence is recoverable.
- **Residual risk:** If both the live value AND the commit log are corrupted (Byzantine failure), the system cannot self-heal. This is a storage-layer disaster, not a confidence-layer design flaw. Mitigated by minimum 3 geographic replicas (§48.4).

### 49.8 Power Regeneration Under Time Zone Offsets

**Scenario:** Users attempt to exploit the community-governed sleep cycle by rapid time zone changes or VPN-based location shifting to regenerate power faster.

**Containment:**
- Sleep cycle is global, not local (frozen contract #43): The rest period is a global parameter. Changing your location does not change the cycle.
- Power regeneration is tied to user tree identity, not location: The same user ID cannot regenerate twice per cycle regardless of apparent location.
- Detection mesh is local-first (frozen contract #49): Element detection requires physical camera presence. You cannot farm power from a VPN.
- **Residual risk:** If the global sleep cycle parameter is set too short by governance, everyone regenerates faster. Mitigated by rate-of-change caps (frozen contract #46) preventing sudden cycle shortening.

### 49.9 Fractal Scaling of Vote Eligibility at Planetary LOD

**Scenario:** At PLANETARY or GALACTIC LOD, the voter pool is enormous. Weighted-median computation becomes computationally expensive, and small groups may be structurally outvoted regardless of local merit.

**Containment:**
- Fractal scaling (§22): Each LOD level has its own governance scope. A city-level vote does not include planetary-level voters. Governance is local to the tree/scope being governed.
- Vote eligibility is scope-bound: You can only vote on trees where you have engagement history. Planetary LOD governance requires planetary-level engagement, which is structurally rare.
- Parametric governance at each scope (§11): Parameters at branch scope are voted by branch participants. Parameters at global scope are voted by global participants. No cross-scope vote bleeding.
- **Residual risk:** At truly global scale, the weighted-median computation is O(n) per parameter per epoch. Mitigated by server-side pre-aggregation (§48.8) and sampling-based approximation for very large voter pools.

### 49.10 Early-Adopter Influence and Natural Dilution (Sociological)

**Scenario:** Over years, early adopters accumulate high trust scores, deep engagement history, and dense guardian networks. They dominate the historic jury pool and carry disproportionate influence in governance.

**Design intent:** This is intentional. Early adopters SHOULD have outsized influence during the formation period — they ensure the system is built correctly when it is most vulnerable. The design goal is not to prevent early-adopter power, but to ensure it **fades naturally** as the user base grows.

**Natural dilution mechanisms:**
- Trust score ceiling of 100: a 5-year user and a 1-year user with identical reliability records have the same trust score. Duration alone does not compound beyond the ceiling.
- Context-weighted vote eligibility (frozen contract #56): vote weight on a branch depends on recency of participation on THAT branch, not account age. A 5-year user who hasn't engaged with a branch recently carries less weight than a 6-month user who has been active.
- Jury pool expansion: as the user population grows, any individual's probability of selection shrinks proportionally. Early adopters become a smaller fraction of the eligible pool.
- 4:3:3 jury ratio: 40% of every jury is randomly selected from the general eligible population — no faction can dominate through history alone.
- Jury historic pool rotation (frozen contract #77): max 2 consecutive terms, then 6-month cooldown.
- Guardian network diversity (frozen contract #79): prevents closed-loop early-adopter guardian clusters.
- **Residual risk:** Cultural prestige of early adopters is not structurally preventable. The system ensures their structural privilege dilutes naturally with growth, but informal social capital remains. This is a feature of all human communities, not a system flaw.

### 49.11 Cultural Capture by Spectacle (Sociological)

**Scenario:** Stage 3 (Game Layer) is emotionally engaging — duels are dramatic, monsters are exciting, spell casting is spectacular. Users spend 90% of their time in spectacle. Stage 1 evidence work becomes invisible background labor. Cultural prestige shifts to duelists and spell casters. Real contributors (evidence commits, governance participation, filament resolution) become invisible to narrative. Even though governance weight remains correct, cultural gravity shifts away from truth work.

**Containment:**
- The tree IS the interface (structural defense): Stage 3 spectacle happens ON the tree. Duels create filaments. Monsters spawn from evidence gaps. Spell effects modify rendering. The spectacle is inseparable from the evidence structure — you cannot see the show without seeing the tree. Stage 1 work is the skeleton that Stage 3 decorates.
- Stage 1 visibility guarantee (frozen contract #80): At every LOD, the rendering prioritizes evidence structure (filaments, timeboxes, lifecycle states) before spectacle overlays (spell effects, duel animations, monster visuals). Spectacle can be toggled off; evidence cannot. The default view always shows evidence structure.
- Contribution visibility in user tree (§8): Every user's tree shows their evidence commits, governance participation, and filament resolutions alongside their duel record and achievement tokens. The tree does not separate "fun" from "work" — it shows everything the user has done, in chronological and structural context.
- Attention is a lens, never a lever (frozen contract #54): Even if spectacle dominates cultural attention, attention never converts to governance power. Duelist fame does not increase vote weight.
- **Residual risk:** Cultural valorization of spectacle over substance is a human tendency that no system can fully prevent. The best defense is making evidence work visually compelling — the tree aesthetic should make truth work feel like building, not bureaucracy.

### 49.12 Complexity and Human Understanding (Sociological)

**Scenario:** The system has 84+ frozen contracts, multi-layered identity, dual confidence, juries, decay, reverification, weighted medians, hysteresis, and more.

**Why this is NOT the failure mode it appears to be:**

Humans already navigate infinite complexity with no structure, every day. Tax codes, social hierarchies, cultural norms, legal systems, weather, traffic, relationships — none of these come with a constitution, and humans manage. Relay is LESS complex than the unstructured chaos of daily human coordination, and it comes with something the real world does not: **physics metaphors that map directly to intuition**.

- **Wilt = neglect**: a branch that isn't getting evidence literally wilts. No one needs to understand "confidence deficit thresholds" — they see a wilting branch and understand something is being ignored.
- **Growth = engagement**: active branches grow visibly. Attention makes things bigger. This is how the real world works.
- **Gravity = time**: things sink as they age. Old information settles to the bottom. New information is at the top. This is gravitational intuition.
- **Heat = urgency**: hot topics glow. Everyone understands heat.
- **Opacity = evidence quality**: transparent = well-evidenced. Opaque = uncertain. This is literally how glass works.

The tree does not require users to understand the constitution. It requires them to look at it. The mechanics are complex. The experience is spatial and intuitive.

**Containment (for edge cases where explanation IS needed):**
- One-sentence explanation invariant (frozen contract #83): when a mechanic directly affects a user (vote weight change, parameter movement, jury selection), a one-sentence explanation appears in the UI at the point of interaction.
- Governance transparency logs: every parameter change, jury selection, and migration commit is visible as a filament on the governance branch.
- **Residual risk:** Some users will distrust any system they didn't build. The defense is not simplification — it is verifiability. Every action has an audit trail. Every decision has a commit. The math is complex but the evidence is always visible.

### 49.13 Governance Inertia Under Harmful Majority (Structural)

**Scenario:** The combined stabilization mechanisms (rate-of-change caps, hysteresis, settlement windows, cooldowns, vote decay, context weighting) create so much inertia that reform becomes effectively impossible. A harmful majority forms (e.g., a faction that suppresses evidence), and the minority cannot correct course quickly enough because every mechanism slows change.

**Containment:**
- Emergency reform mechanism (frozen contract #82): if a parameter or governance state is demonstrably harmful (defined as: triggering 3+ refusal logs per epoch, or causing measurable system degradation visible in proof artifacts), a compressed reform path is available. The compressed path uses 2x the normal supermajority threshold (e.g., 80% instead of 60%) but with 1/4 the normal settlement window. This allows urgent correction without making routine changes easy.
- Frozen contracts cannot be changed by governance (§26): The most critical invariants (append-only, dual confidence, filament = row, etc.) are immune to governance inertia because they are immune to governance entirely. The harmful majority cannot vote away the truth layer.
- Jury sortition as circuit breaker (§46): If parametric governance is deadlocked, a jury can break the deadlock. Juries are not subject to hysteresis or settlement windows — they deliberate and decide within 72 hours.
- **Residual risk:** If the harmful majority also dominates jury pools (see §49.10), the circuit breaker fails. Mitigated by jury rotation caps and random selection (40% of every jury is random). The attacker would need to control the entire eligible population, not just a faction.

### 49.14 Founder Key — Incapacitation and Succession

**Scenario:** The founder is incapacitated, refuses activation despite community readiness, activates prematurely under pressure, or loses cultural legitimacy.

**Containment:**
- Guardian Steward model (frozen contract #81): If the founder account is inactive for 365 consecutive days, the founder's designated guardian is elevated to **Steward of Relay**. The Steward receives a full Founder-level tutorial and initiation covering all frozen contracts, activation procedures, and philosophical responsibility. The Steward has identical activation authority and constraints as the founder. If the Steward also becomes inactive, succession chains to THEIR guardian. Final fallback: 7-member Succession Council via jury sortition (unanimous 7/7).
- If the founder actively refuses activation despite community thresholds being met for 2+ consecutive years, the community can petition for succession. The petition requires 80% supermajority of global-scope Anchor-tier voters sustained for 1 full settlement window. If the petition succeeds, the guardian is elevated to Steward and the founder key becomes dormant.
- Premature activation pressure: the jurisdiction checklist (frozen contract #67) and attestation commit (frozen contract #48) create structural friction that prevents impulsive activation. The founder cannot activate by tapping a button — the process requires documented compliance across all active jurisdictions.
- **Residual risk:** The 365-day inactivity threshold is long. A founder who is nominally active (posting one commit per year) but culturally absent can block activation indefinitely. The petition mechanism is the safety valve, but it requires 80% Anchor supermajority, which is a high bar. This is intentional — removing the founder should be extremely difficult.

### 49.15 Regional Feature Diversity (Operational)

**Scenario:** Different regions want different features: EU requires explicit consent logging, Japan bans AR overlays in public, a university campus disables duels, a gaming arena enables everything.

**Containment:**
- Regions vote features on or off (frozen contract #84): this is standard parametric governance at the regional scope. No system fork, no special mechanism — just branch-level voting on which Stage 2/3 features are active in that region. The core truth layer (Stage 1) is always active everywhere.
- Regional feature votes are globally visible: everyone can see which regions have which features enabled. This creates cultural identity — Japan might become known as a duel hotspot, a university campus might be known for deep evidence trees with no game layer. This diversity is a feature, not fragmentation.
- Legal posture document (frozen contract #51): every deployment jurisdiction requires an explicit compliance document. The document specifies which features are active and which are restricted, aligned with local law.
- Fractal model preserves unity: a Japan tree with AR disabled still participates in the global Merkle chain, still has filaments, still has governance, still has presence. The tree structure is universal. The feature configuration is local.
- Cross-jurisdiction references use Merkle inclusion proofs (hash only crosses border, not content).
- **Residual risk:** A region that votes to disable ALL Stage 2/3 features degrades to Stage 1 only. This is by design — the truth layer is the foundation, and it does not depend on the game or detection layers.

### 49.16 Sovereignty-First Measurement Philosophy

**Foundational axiom:** People physically living in a place should have majority say in that place. Relay does not attempt to create a borderless ideological democracy. It creates **scoped sovereignty** with **measurable divergence**.

**What Relay does:**
- Makes cultural clustering visible — not correctable
- Makes pressure gradients between regions measurable
- Makes boundary shifts traceable
- Makes invite-tree topology inspectable
- Makes grading distributions auditable
- Makes trust drift detectable

**What Relay does NOT do:**
- Enforce global cultural diversity quotas
- Artificially balance ideological representation
- Override local majority decisions with global consensus
- Flatten cultural differences between regions
- Privilege distant spectators over local residents

**Boundary reconfiguration as pressure valve:** Users who disagree with local majority can redefine their governance boundaries — shift from one neighborhood branch to another, create a new zone, physically relocate their anchor point. Exit is always easier than overthrow. This is the structural guarantee that local majority rule remains voluntary, not entrapping.

**Closed loops are permitted:** If a region closes itself off, stops referencing external evidence, self-grades positively — that is allowed. Relay does not prevent divergence. Relay makes divergence visible. Other regions see opacity differences, reference gaps, isolation patterns. Any child in a closed region can look outward and see what exists elsewhere. Transparency is the mechanism, not enforcement.

**Measurement cannot be falsified — that is the only true invariant.** If measurement is trustworthy, human self-alignment becomes organic. All social dynamics — clustering, pressure, conformity, dissent — are expressions of physical reality. Relay reveals them. It does not reshape them.

### 49.17 Principled Dissent Protection (Social Grading Drift)

**Scenario:** Slow, socially acceptable conformity pressure. A principled dissenter is not attacked overtly but is consistently graded 5–10% lower across many juries, kept above threshold but prevented from reaching Anchor tier — blocking them from historic jury pool, council eligibility, and high-impact roles. No single dramatic abuse. Just mild, sustained social pressure compressing trust scores.

**The pipeline:** Grading feeds trust → trust feeds eligibility → eligibility feeds governance → governance feeds power. If social conformity is the dominant signal in grading, this pipeline amplifies it.

**Containment — Evidence quality as trust floor:**
- A user's **evidence contribution quality** provides a hard floor on their trust score that social grading alone cannot push them below. Specifically: if a user's evidence commits are frequently referenced by other branches, cited in sortition verdicts, or promoted to canonical fixtures, their trust score has a minimum proportional to their evidence impact.
- This means: a dissenter who contributes high-quality evidence cannot be socially graded below the trust threshold for jury eligibility or council candidacy, regardless of how many juries grade them slightly lower for personality friction.
- The floor is computed from: evidence reference count (how often their commits are cited), evidence promotion rate (how often their evidence is promoted to permanent fixtures), and evidence cross-branch impact (how many branches outside their home reference their work).
- Evidence quality is objective and append-only. Social grading is subjective and variable. The floor ensures the objective signal always survives the subjective one.

**Why this is not paternalistic:** Relay does not prevent communities from grading dissenters lower — that is legitimate social signal. It prevents the grading pipeline from silencing contributors whose evidence quality demonstrates value regardless of social popularity. The system distinguishes between "unpopular person" and "person whose work is provably useful."

### 49.18 Council Continuous Confidence — Decision Immunity Buffer

**Scenario:** Continuous confidence election means council members must maintain high visible confidence at all times. This incentivizes avoiding controversial but necessary decisions, choosing popular over correct rulings, and optimizing for trust score rather than truth. Continuous election becomes permanent campaigning.

**Containment — 14-day decision immunity window:**
- When a council member participates in an official council decision (module approval, dispute escalation, emergency reform vote), a 14-day immunity window begins for that decision.
- During the immunity window: trust score changes, confidence recalculations, and grading events **do not affect that council member's seat eligibility**. Their seat is locked for the duration.
- After the immunity window: normal continuous confidence resumes. If the controversial decision eroded their trust score, they may lose their seat — but they had the full immunity period for the community to see the results of the decision before reacting.
- The immunity is per-decision, not per-member: a council member who makes three controversial decisions in a week gets three overlapping immunity windows. They are not permanently immune.
- The immunity duration is a global parameter (initial value: 14 days, votable). The community can shorten or lengthen this buffer based on experience.
- **Edge case:** If the community initiates an emergency reform (§49.13, supermajority threshold is a global parameter, initial: 80% Anchor-tier), the immunity window is overridden. Emergency reform can always remove a council member regardless of pending immunity.

**Why this matters:** Without the buffer, council drifts toward safe consensus. With the buffer, council members can make unpopular-but-correct decisions knowing they won't be immediately ejected before the community can assess the outcome.

### 49.19 Invite-Chain Centrality Monitoring

**Scenario:** Invite depth carries zero governance weight (frozen contract #75). But socially, early clusters build cohesion, guardian networks form along invite chains, jury volunteers emerge from friend networks, council candidates are visible through early networks. Network topology influences cultural formation even without direct weight.

**Containment — Measurement, not correction:**
- The system tracks invite-chain centrality metrics: subtree size per root node, branching factor by generation, geographic distribution per subtree, guardian overlap within subtrees.
- These metrics are publicly visible as part of the system's self-measurement layer. Any user can inspect invite topology.
- If one subtree becomes disproportionately large (e.g., >25% of all active users trace to a single generation-1 node), the system publishes a visibility marker — not a restriction, not a penalty, just a measurement.
- Why measurement-only: cultural clustering along invite chains is not inherently harmful. It reflects the reality of how social networks form. Relay's philosophy is to make network topology visible, not to engineer it. Boundary reconfiguration (§49.16) is the user-facing pressure valve.

---

## 50. Constitutional Hardening Checklist (GO/NO-GO)

Complete only when every item is PASS or explicitly DEGRADED with a containment plan. Assessed 2026-02-19.

### A. Governance and Legitimacy

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Sybil resistance (cheap identity flood) | **PASS** | #22, #55 | Tier 1+ gate + 14-day/10-commit cooldown + engagement history |
| Off-platform vote renting / bribery | **PASS** | #56 | Context-weighted votes: branch-specific recency + evidence contribution history. Inactive = near-zero weight. |
| Majority pressure vs local sovereignty | **PASS** | #44 | Dual confidence proven and enforced. orgConfidence immune to votes. |
| Parameter whiplash | **PASS** | #46, §7.7 | 20% rate-of-change cap + settlement window + hysteresis band |
| Founder key liability | **PASS** | #48, #67, #51 | Attestation commit + jurisdiction checklist + legal posture requirement |

### B. Attention Economy and Visibility Capture

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Attention farming (Tier 0 bots) | **PASS** | #45, #54 | Globe-LOD excludes Tier 0. Attention is a lens, never a lever. |
| Acceleration gaming (micro-spike coordination) | **PASS** | #57 | Diverse participation required. Per-scope rate limits. Spam decay. |
| StickyNote brigade (manufactured births) | **PASS** | #58, §5 | Device rate limit + cluster suppression + branch spam threshold |
| Spectacle → soft power conversion | **PASS** | #54, #38 | Attention never affects governance, permissions, or execution priority |

### C. Economics That Can Break the System

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Monster economy inflation | **PASS** | #59, #46 | Per-epoch issuance budget + rate-of-change caps. Throttle visible. |
| Monster economy starvation | **PASS** | #60 | Difficulty floor + beginner ramp (50% ceiling for < 30 days). |
| Convertibility drift (treated as money) | **PASS** | #47 | Structural non-convertibility. No exchange rate. No marketplace. Explicit. |
| Power buying influence indirectly | **PASS** | #54, #38 | Attention (from spectacle) never grants governance weight |

### D. Privacy, Sensing, and Real-World Risk

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Bystander capture in camera frames | **PASS** | #49, #40 | Local-first. Raw frames never leave device. Bystander privacy absolute. |
| Minor safety / dangerous triggers | **PASS** | #50, #61 | Age gate + prohibited trigger taxonomy + venue safety defaults |
| Presence deanonymization | **PASS** | #52, #62 | Time-bucketed updates + precision degradation + statistical aggregation |
| Camera operator liability | **PASS** | #66, #51 | Explicit controller/processor model. Processor commit required. |

### E. System Integrity and Operational Stability

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Proof discipline erosion | **PASS** | §27 process | Every slice: SPEC → IMPLEMENT → PROOF → COMMIT → INDEX |
| Single-scalar confidence relapse | **PASS** | #44, #63 | Deprecated trap + CI lint + pre-commit gate |
| Git attachment bloat | **PASS** | #64 | 500KB hook + content-addressed external storage + proof exemption |
| Renderer scale collapse | **PASS** | #65, §33.2 | Hard LOD budgets + over-instantiation refusal |
| Legal controller/processor ambiguity | **PASS** | #66 | Operator model + processor commit + legal posture document |

### F. Identity, Growth, and Dispute Resolution

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Dispute resolution capture (founder/mob decides) | **PASS** | #68, §46 | Sortition juries with 4:3:3 ratio, crypto selection, bias detection |
| Critical auth bypass (social engineering) | **PASS** | #69, #74, §48.2.1 | Password Dance (somatic + vocal) for STRICT; action-driven escalation, not user-chosen |
| Account loss = permanent loss | **PASS** | #70, §48.2.2 | Guardian recovery (M-of-N social recovery). Founder has extended 7-day path. |
| Open registration Sybil flood | **PASS** | #71, §48.2.3 | Invitation decay tree. No open registration endpoint. Every account traceable to founder. |
| Identity rot (verify once, abuse forever) | **PASS** | #72, §48.2.4 | Periodic reverification by trust tier: 7d/90d/180d/365d. Failed = demotion. |
| Same-person multi-account (Sybil) | **PASS** | #73 | Dual-user simultaneous verification at geographically separated locations |
| User opts out of strong auth for critical actions | **PASS** | #74 | Authentication escalation is action-driven, not user-chosen. Cannot downgrade. |

### G. Sociological Resilience

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Early-adopter power concentration | **PASS** | #75, #76, #77, #79, §49.10 | Intentional during formation, self-diluting with growth. Trust ceiling, jury rotation, guardian diversity. |
| Cultural capture by spectacle (Stage 3 dominance) | **PASS** | #80, #54, §49.11 | Evidence renders first, spectacle is additive overlay. Attention never = authority. |
| Complexity vs human understanding | **PASS** | #83, §49.12 | Physics metaphors (wilt, growth, gravity, heat, opacity). One-sentence explanation for direct-impact events. |
| Governance inertia under harmful majority | **PASS** | #82, §49.13 | Emergency reform: 80% supermajority + compressed settlement. Jury as circuit breaker. |
| Founder incapacitation / no succession | **PASS** | #81, §49.14 | Guardian becomes Steward with full tutorial. Chain to their guardian. Council as final fallback. |
| Regional feature diversity | **PASS** | #84, #51, §49.15 | Regions vote features on/off via standard governance. Stage 1 universal. Cultural identity emerges. |
| Password Dance single point of failure | **PASS** | #78, §48.2.1 | Fallback: PIN + 2-guardian attestation OR proximity reverification. Always available. |
| Trust threshold excluding dissidents | **PASS** | #76 | Trust measures reliability (completion, compliance), never ideology. Dissent cannot reduce trust. |
| Invite growth at scale | **PASS** | #71, §48.2.3 | Initial decay → depletion → global refill rate (community-voted: 1/week, 1/month, etc). Uniform for all. |
| Sortition accountability | **PASS** | #85, §46.6 | Live peer grading (draft → commit). Game theory: honest graders build reputation, non-graders stagnate. |
| Council capture / fixed-term entrenchment | **PASS** | #86, §46.8 | Continuous confidence election. No fixed terms. Drop below threshold = automatic succession. |
| Unvetted code entering live system | **PASS** | #87, §46.8 | Sandbox → community vote → council review (5/7) → canonical commit. No bypass. |
| Dispute resolution dead end | **PASS** | #88, §46.7-46.8 | Three-level escalation: jury → appeal jury → Council (final). |
| Temporary data treated as permanent | **PASS** | #89 | Draft → commit universal. Notes, grades, proposals all mutable until committed. |

### H. Astronomical Alignment and Parameter Governance

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Sleep cycle ignores latitude/season (unfair regen) | **PASS** | #101, #103, §14.4 | Solar-position-based timing. Equator stable. High-lat shifts with season. Polar fallback to UTC. |
| Hardcoded parameters resist community will | **PASS** | #102, §11.6 | Global Parameter Registry. Every operational value votable. Founder sets initial; community governs from day 1. |
| Periodic events misaligned across regions | **PASS** | #93, #101, §14.4 | All periodic events (digests, epochs, reverification) aligned to UTC. Solar only affects sleep timing. |
| Moon cycles ignored for agricultural/cultural templates | **PASS** | #101, §14.4 | Lunar phase, next new/full moon, lunar day available as template variables. Pre-computed 2026–2126. |
| Parameter drift without community consent | **PASS** | #102 | Only founder levers (stage gates) are non-votable. All else is transparent weighted-median. |

### I. Compute Scaling and Visibility

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Projection graph explosion (50K users, 3 layers each) | **PASS** | #103, #104, §6.4 | No compute without observation. Instance cap per branch. Content memoization. Lazy eval. |
| Render collapse at planetary scale | **PASS** | #106, §33.3 | Sight radius + atmospheric compression. Objects outside bubble cost zero render. Privacy before geometry. |
| Dissent suppressed by visible vote identity | **PASS** | #105, §7.4 | Anonymous voting for social/ideological votes. Non-anonymous for accountability votes. Template-configurable. |

### Summary

**50/50 PASS.** All hardening items have explicit frozen contracts with enforcement mechanisms. The three most critical invariants are: **#54** (attention is a lens, never a lever), **#75** (early adopter power is intentional and self-diluting), and **#86** (Council elected by continuous confidence, not fixed terms). The latest engineering invariants are: **#103** (no compute without observation), **#104** (projection instance cap per branch), **#105** (vote anonymity), and **#106** (sight radius + atmospheric compression).

---

## 51. Key File References

- `app/renderers/filament-renderer.js` — core geometry + rendering pipeline (to be evolved for bark-cylinder model)
- `relay-cesium-world.html` — entry point, camera, demo tree, controls
- `app/utils/enu-coordinates.js` — ENU frame computation, branch-aligned layout
- `core/models/relay-state.js` — canonical state store
- `app/cesium/restore3-scope-manager.js` — geographic governance boundaries
- `app/cesium/restore4-assignment-manager.js` — branch-to-site assignments
- `app/presence/presence-engine.js` — presence system
- `core/models/crypto/*` — Merkle chain, envelope encryption, disclosure
- `config/p2p-module.json` — P2P template configuration
- `config/mfg-module.json` — manufacturing template configuration
- `scripts/v93-to-relay-state-adapter.mjs` — V93 legacy data bridge

---

*End of Relay Master Build Plan. The tree IS the data. Time sinks everything. Truth persists. Reality becomes the game.*
