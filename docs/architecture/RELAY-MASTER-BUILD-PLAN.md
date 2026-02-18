# Relay Master Build Plan — 2026-02-17

**Status: CANONICAL — This is the definitive system specification for Relay.**
**Supersedes: [RELAY-MASTER-BUILD-PLAN-PRE-BARK-MODEL.md](../../archive/superseded-docs/RELAY-MASTER-BUILD-PLAN-PRE-BARK-MODEL.md) (retained for build history)**
**Model: Cylindrical Bark Geometry with Gravitational Time**

---

## 0. What Relay Is

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

Every filament on every branch in every tree at every scale carries these six domains. They are the minimum contract for the tree physics to function:

1. **IDENTITY** — what is this thing? (filamentId, objectType, branchRef)
2. **COUNTERPARTY** — who/what is on the other side? Drives angular position on bark. Measured by actual approach vector, not home location.
3. **TIME** — when? (created, expected resolution, actual close). Drives gravitational sinking and twig detection.
4. **MAGNITUDE** — how much? (dollars, severity, count, score). Drives timebox slab color.
5. **EVIDENCE** — what proves this is real? (references to other filaments, attachments, signatures). Drives timebox slab opacity via automatic confidence physics.
6. **LIFECYCLE** — where in its journey? (OPEN, ACTIVE, HOLD, CLOSED, ABSORBED). Drives radial position from bark to center.

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

A branch represents a service type / activity category where every filament row shares the same basic schema. Branches are not departments — they are coherent units of analyzable work.

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

A filament IS a row. Not a cell. The entire row represents one atomic event.

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

A Note is the unified concept combining DraftNodes and sticky notes. It is pre-filament potential — ephemeral, postable on any surface, time-limited.

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

### 5.3 Lifecycle

1. Someone posts a Note on any surface in the 3D world. It appears at the bark at the poster's approach angle.
2. The Note has a TTL (default: 15 minutes for social, 7 days for work, configurable per context).
3. If nobody responds before TTL expires: the Note fades. Gone from current view.
4. If someone responds: the Note **converts to a filament**. Two parties are now involved. The conversation begins. The filament is permanent.
5. If the author manually formalizes: the Note converts to a filament on the target branch with pre-filled content.

### 5.4 Rendering

- Small, translucent marker at the surface. Distinct from filament geometry (teardrop or sphere).
- Alpha: 0.4 (clearly secondary to canonical objects)
- LOD: visible at CELL/BARK, suppressed at BRANCH and above. Count badge if 5+ Notes cluster on same surface.
- Notes that are close to expiry fade progressively (alpha decreasing toward 0).

---

## 6. Projection Branches — Visible Data Pipelines

Projection branches are light blue analytical offshoots from truth branches. They are visible ETL (Extract-Transform-Load) pipelines.

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

**Votes are NOT anonymous at global level.** Every vote is a commit on the voter's personal user tree (§8). The vote is visible as a responsibility record. This is the anti-manipulation foundation — your voting pattern IS part of your tree's shape.

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

---

## 10. Pressure Physics — Structural Integrity Forces

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

---

## 14. Gravitational Time — The Universal Clock

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

---

## 17. Presence System — The Attention Sensor Network

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

Relay is not a single-phase system. It is a three-stage progressive unlock architecture where each stage enhances the stages below it. The data model, filament mechanics, governance, and tree physics are identical across all three stages — what changes is the abstraction layer through which humans interact with the tree.

### 38.1 The Three Stages

| Stage | Name | Layer | Unlock Type | Core Mechanic |
|-------|------|-------|-------------|---------------|
| **Stage 1** | Truth Layer | Data substrate | Community adoption | Tree, filaments, bark, governance, projections, presence, globe, weather |
| **Stage 2** | Interaction Layer | AR communication + personal achievement | Individual discovery | Video AR overlay, SCV graphics, gesture/light/object interfaces, personal stage gate achievements |
| **Stage 3** | Game Layer | Gamified reality + monster economy | Founder key + global threshold | Genre templates over reality, duels, spells, monsters, multi-resource economy, new economic lever |

### 38.2 Stage Enhancement Principle

Every stage is an enhancement to the stages below, never a replacement. Stage 3 commands execute through Stage 2 AR interfaces, which resolve to Stage 1 filament commits. A "spell" cast in Stage 3 is rendered by Stage 2's AR pipeline, and the underlying SCV action produces a Stage 1 filament commit with evidence. Remove any stage, and the stages below still function independently.

### 38.3 Unlock Mechanics

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

---

## 41. Multi-Resource Economy

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

---

## 42. Duels — Governance Theater & Public Combat Events

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

---

## 43. Spell Taxonomy — Element Detection & Physical Magic

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

### 44.3 Pre-Activation State

Before Stage 3 activation:
- Stage 3 challenge stubs exist in the system but are inert (visible as future content, non-interactive)
- Monster generation AI is dormant
- Duel mechanics are restricted to Stage 2 style (evidence debate without genre overlay or spell combat)
- Multi-resource economy operates on engagement credits + achievement tokens only (no monster-economy lever)
- Genre templates exist as specifications but do not render

After activation: all Stage 3 mechanics activate globally and simultaneously. The game begins.

---

## 45. Frozen Contracts — Stage Gate Additions

The following contracts extend the frozen contract list (§26) for Stage Gates 2 and 3:

28. **Stages are additive**: Each stage enhances the stages below it. Removing a stage does not break the stages below. Stage 3 commands resolve to Stage 2 AR interactions, which resolve to Stage 1 filament commits. No stage may bypass a lower stage.
29. **Achievements are evidence-based**: Personal stage gate achievements require SCV-validated proof recorded as filament evidence on the user tree. No achievement is granted by fiat, vote, or purchase.
30. **Real yields more than virtual**: Achievement tokens (advanced resource) can ONLY be earned through real-world SCV-validated achievements. Virtual-only engagement yields only engagement credits (base resource). This incentive gradient is non-negotiable.
31. **Spells resolve to commits**: Every spell, regardless of visual effect or genre overlay, ultimately resolves to one or more Stage 1 filament operations (query, commit proposal, evidence reference). No spell bypasses frozen contracts 1-27.
32. **Duels are public filaments**: Duel events are classified as public filament events. Community votes on duel outcomes follow standard vote governance (eligibility gates, decay, threshold mechanics). Sword skill does not grant governance power — evidence quality does.
33. **Genre is a rendering template**: Genre overlays (Sci-Fi, Fantasy, Horror, etc.) are visual templates applied at the rendering layer. They never modify the underlying truth. A monster rendered as a dragon and a monster rendered as an alien are the same engineering challenge underneath.
34. **Founder key is singular**: Stage Gate 3 global activation requires explicit action by the founder account. No parametric vote, governance proposal, or community threshold can activate Stage 3 without the founder key. Once activated, irreversible.
35. **Monster economy is governed**: Monster spawn rate, reward magnitude, and difficulty curve are global parameters set by parametric governance (weighted-median voting). No central authority sets these values. The community controls its own economic lever.

---

## 46. Key File References

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
