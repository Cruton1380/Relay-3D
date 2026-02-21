# Relay Master Build Plan — 2026-02-17

**The complete specification for Relay — a living 3D world built on the real Earth, where everything humanity does becomes visible, accountable, and permanent.**

This document is written for two audiences at once. If you are a parent, a business professional, or someone who has never seen a line of code — read it straight through. Every section begins with what it means for you. If you are an engineer building the system — the full technical specification follows every introduction. Both audiences read the same document because Relay does not separate understanding from implementation.

---

## Table of Contents

**Part I — The Physical Model (What You See)**
- §0. What Relay Is
- §1. The Globe
- §2. The Trunk
- §3. The Branch — Cylindrical Coordinate Model
- §4. The Filament — Row-Level Atomic Event
- §5. Notes — The Unified Ephemeral Layer
- §6. Projection Branches — Visible Data Pipelines
- §7. The Social Layer
- §8. The User Tree — Personal Responsibility Mirror

**Part II — Physics & Governance (How It Moves)**
- §9. Confidence Physics — Automatic Evidence Ratio
- §10. Pressure Physics — Structural Integrity Forces
- §11. Parametric Governance — Votable System Constants
- §12. Filter Tolerances — Personal Visibility Slidebars
- §13. Stigmergic Coordination — Self-Assignment Through Visibility
- §14. Gravitational Time — The Universal Clock
- §15. Time Scrubbing — Replay as Navigation

**Part III — Intelligence & Presence (Who Is Watching)**
- §16. AI and SCV — Filament 3D Cognition
- §17. Presence System — The Attention Sensor Network
- §18. Flow Channels — Recorded Procedures
- §19. Governance
- §20. Cryptographic Architecture

**Part IV — Configuration & Rendering (How It Looks)**
- §21. Templates — Domain Configuration
- §22. Fractal Scaling
- §23. Weather and Wind — Emergent Atmospheric Analytics
- §24. Search in 3D
- §25. 2D/Headless Parity
- §26. Frozen Contracts
- §27. Current Build Status
- §28. Worked Example — One Invoice Through the Full Trace

**Part V — Physical World Integration (Where You Are)**
- §29. Proximity Channels
- §30. Verification Physics
- §31. Accounting Packets
- §32. Stable ID Construction Law
- §33. LOD Rendering Contract

**Part VI — Use Cases & Migration (What It Replaces)**
- §34. Use Case — Software Development on Relay
- §35. Use Case — Municipal Services
- §36. Use Case — Astronomy
- §37. Knowledge Migration Lifecycle — From 2D Internet to 3D Tree
- §38. Module Discovery Architecture

**Part VII — Game Layer & Arena (Where Play Meets Reality)**
- §39. AR Interaction & Personal Achievement Modules
- §40. The Game Layer — Quests, Monsters, and Genre Overlays
- §41. Multi-Resource Economy
- §42. Duels — Governance Theater & Public Combat Events
- §43. Spell Taxonomy — Element Detection & Physical Magic
- §44. Founder Key — Global Game Layer Activation Primitive
- §45. Frozen Contracts — Module Mechanics + Constitutional Hardening

**Part VIII — Justice, Voice & Engineering (How It Runs)**
- §46. Sortition-Based Case Resolution
- §47. Voice Input Pipeline — Whisper, Architect, Canon
- §48. Engineering Infrastructure — How the System Runs
- §49. Adversarial Edge-Case Model
- §50. Camera Controller

**Part IX — Business & Professional Tools (How Work Works)**
- §51. Key File References
- §52. Business Artifact Mapping — Slides Are Dead
- §53. Compartmentalized Accounting & Atomic Traceability
- §54. Business Process Catalog
- §55. Live Confidence Overlay & Public Proceedings
- §56. Language Trees & Multi-Language Learning
- §57. Adoption Tiers & Backwards Compatibility

**Part X — Education, Media & Rights (How Society Learns)**
- §58. Education — The Internal Adventure
- §59. Media & Content Circulation
- §60. Fractal Branching — Any Branch Can Host a Full Tree
- §61. Privacy Sovereignty & Civic Enforcement
- §62. Universal Accessibility — The Tree for Every Body
- §63. Child Safety & Parental Governance
- §64. Voice-Driven Development — Every User Is a Developer

**Part XI — Infrastructure & Storage (How Data Lives)**
- §65. Platform Compliance & Content Safety
- §66. Microsharding & Decentralized Storage Economy
- §67. Automated Business Continuity & Disaster Recovery
- §68. Arena Branches — Bounded Volatility & Crowd-Driven Randomness
- §69. Boundary Editing & Geographic Border Governance
- §70. V93 Retained Systems — Architectural Integration Index
- §71. Architectural Clarifications

**Part XII — Civilization Coverage (How Society Works)**
- §72. Layered Option Governance — Bottom-Up Ballot Creation (4-layer constitutional engine)
- §73. Universal Onboarding — Three Pillars
- §74. Traffic & Civic Response Module (RELAY-CIVIC-1)
- §75. Physical Weather Layer
- §76. Civilization Template Library (companion: [RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md](RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md))
- §77. Product Supply Chain Traceability — Mineral to Shelf
- §78. Filament Length Ontology — Structural Weight from Commit Topology
- §79. Quote Attribution & Open Annotation

---

## Glossary

These terms appear throughout the document. Each is explained in detail in its home section, but this quick reference helps if you encounter an unfamiliar word.

| Term | Plain-English Meaning |
|------|----------------------|
| **Filament** | A single recorded event — a transaction, a message, a photo, a vote. The smallest unit of data in Relay. Like a single row in a spreadsheet, but with built-in proof of who created it and when. (§4) |
| **Branch** | A group of related filaments organized around a topic — like a folder, but three-dimensional. A company's "Sales" branch holds all sales filaments. (§3) |
| **Trunk** | The central pillar of any tree. All branches grow from the trunk. For a company, the trunk is the company itself. For a person, the trunk is you. (§2) |
| **Tree** | A complete collection of branches and filaments belonging to one entity — a person, a company, a city. Everything you do in Relay lives on your tree. (§2) |
| **Basin** | The circular plot of ground on the globe where a tree is planted. Basins prevent trees from overlapping each other. (§1) |
| **Slab** | A cross-sectional ring on a branch representing one time period. Slabs stack over time like tree rings. Their color, thickness, and firmness tell you about the health of that period. (§3) |
| **Timebox** | A defined time period (a day, a week, a sprint) during which activity is recorded. When a timebox closes, its slab becomes permanent. (§14) |
| **Commit** | The act of permanently recording a filament. Once committed, it cannot be changed or deleted — only corrected by adding a new filament that references the old one. (§4) |
| **Confidence** | A measure of how well-supported a piece of data is. High confidence means strong evidence from multiple sources. Low confidence means something is missing or uncertain. Confidence is calculated automatically from evidence. (§9) |
| **Wilt** | When a branch or slab lacks verification or has unresolved issues, it visually droops — like a plant that hasn't been watered. Wilt is the system's way of saying "this needs attention." (§3, §30) |
| **LOD (Level of Detail)** | How much visual information is shown depending on how far away you are. Viewing Earth from space shows only trunks. Zooming into a city shows branches. Zooming into a branch shows individual filaments. (§33) |
| **SCV (Supply Chain Validator)** | An AI assistant that lives on every branch. It checks incoming data, flags problems, and helps users navigate their tree. Think of it as a smart assistant that reads every receipt and contract for you. (§16) |
| **Disclosure Tier** | A privacy level (0, 1, or 2) that controls who can see what. Tier 0 = completely private. Tier 1 = shapes visible but not content. Tier 2 = fully public. You choose the tier for every piece of data you create. (§8.5, §71.9) |
| **Proximity Channel** | A location-based connection zone. When you physically walk near a store or office that runs Relay, your device connects to their proximity channel — letting you interact with that location's branch. (§29) |
| **Weighted Median** | The voting method Relay uses for governance. All votes are collected, sorted by value, and the middle value (weighted by participation) becomes the result. No majority rule — the mathematical center wins. (§11) |
| **Merkle Chain** | A tamper-proof record where each entry is mathematically linked to the one before it. If anyone changes a past entry, the entire chain breaks visibly. This is how Relay guarantees that committed data cannot be secretly altered. (§20, §48) |
| **Microsharding** | Splitting encrypted data into many small pieces ("shards") and spreading them across different computers. No single machine holds enough to read the original. To reconstruct, you need a minimum number of shards plus the encryption key. (§66) |
| **Shamir's Secret Sharing** | A mathematical method for splitting a secret (like an encryption key) into N pieces, where any K pieces can reconstruct the original but K-1 pieces reveal nothing. Used for account recovery. (§71.6) |
| **Reed-Solomon Coding** | An error-correction method that adds extra data shards so the original can be reconstructed even if some shards are lost. The same technology used in CDs and QR codes. (§66) |
| **Achievement Token (AT)** | A resource earned by demonstrating real skill — validated by evidence, not just participation. Unlocks advanced capabilities like stronger votes and projection authority. (§41) |
| **Engagement Credit (EC)** | A resource earned by participating — commenting, voting, completing tasks, fighting virtual monsters. The basic currency of activity in Relay. (§41) |
| **Power** | A game-layer resource used for casting spells and abilities in arena matches. Spent during combat, regenerated over time. (§41) |
| **Presence Profile** | A filter over your tree that controls what others see about you in a given context. You might show your professional branches at a job interview and your gaming achievements at an arena. The same tree, different views. (§8.6) |
| **Sortition** | Random selection of qualified individuals (like jury duty) to make specific decisions. Prevents capture by special interests because you cannot predict or lobby the decision-makers in advance. (§46) |
| **Combat Loadout** | A per-match configuration in arena battles that emphasizes certain capabilities at the cost of others. Not permanent — chosen fresh for each match. (§68.19) |
| **Sentinel Node** | A high-reputation storage provider machine that holds emergency backup data shards. Not a person — a computer operated by a vetted provider. (§66.4) |
| **Guardian Contact** | A trusted human (friend, family member) who holds a piece of your encryption key for account recovery. Not a machine — a real person you designate. (§48.2.2, §71.6) |
| **Closure Commit** | The final record written when something stops being used — an account closing, a device failing, a service going offline. Nothing in Relay disappears silently; every ending is recorded. (§71.7) |
| **Fisheye Focus / Inverse-Scaling** | When you zoom into one branch, it expands while the rest of the tree shrinks proportionally — like a magnifying glass. The whole tree stays visible but the focused area gets more detail. (§71.20) |
| **Product Tree** | A tree representing a manufactured product (laptop, car, medicine) with branches for design, BOM, suppliers, manufacturing, distribution, retail, warranty, recall, and environmental impact. Every product on a shelf traces back to the minerals it was made from. (§77) |
| **BOM (Bill of Materials)** | A branch on a product tree listing every component that goes into a product version. Each component is a filament linking to a supplier tree and material lots. (§77.3) |
| **Mass Balance** | A conservation law enforced at every stage of production: input mass must equal output mass plus waste plus emissions. If the numbers don't add up, the branch wilts. (§52.5, §77.5) |
| **Recall Cascade** | When a defect is found in a material or component, a scar propagates upward through every linked product — from material lot to batch to retail unit to customer. The affected products glow on the map. (§77.7) |
| **Filament Length** | How long a filament extends along a branch, determined by its commit topology — not manually assigned. Short filaments are brief events (posts, approvals). Long filaments are sustained projects. Never-ending filaments define the branch structure itself. (§78) |
| **Structural Node** | A branch element that never closes — balance sheet accounts, file directories, organizational structures. It receives continuous commits and defines the branch shape, unlike finite filaments that eventually sink inward. (§78.4) |
| **Open Annotation** | The default state of filaments where anyone can vote on individual words, suggest changes, or start conversations. Annotations are themselves filaments that attach to the original. (§79) |
| **Deferred Attribution** | Crediting someone whose Relay ID you don't know yet. You write `@whoever` and later, when the real person finds it, they claim the attribution through the owner. The placeholder resolves to a real identity. (§79.4) |
| **Word-Level Vote** | A micro-filament that targets a specific character range in another filament — agree, disagree, clarify, cite, or flag. Adding a comment to the vote starts a new conversation branch. (§79.2) |

---

## 0. What Relay Is

> *"We shape our tools, and thereafter our tools shape us."* — Marshall McLuhan

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

> *"The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever."* — Konstantin Tsiolkovsky

The Cesium 3D globe is the root context. It slowly rotates — this rotation IS earth time, the gravitational constant driving all sinking.

### 1.1 What You See

Trunks rise from the globe surface. Each trunk marks an entity — a company, a neighborhood, a city, a country, a research project, a person. Hot spots glow where attention concentrates. Branches rise and fall as engagement flows. Streams of presence markers show where humanity is looking RIGHT NOW.

### 1.2 Trunk Prominence

A trunk's visibility on the globe is determined by the three globe metrics:

- **Height off surface** = engagement rate (vote count). More votes = taller trunk.
- **Glow intensity** = attention rate (presence focus count). More eyes = brighter.
- **Color temperature** = acceleration (heat). Fast change = hot red. Stable = cool blue.

A trunk with zero engagement is invisible at globe LOD (Level of Detail — how much you see at each zoom level; see Glossary) — it exists but doesn't command attention. A trunk with millions of votes and rapidly accelerating evidence is a blazing beacon visible from any zoom level.

### 1.3 Below the Surface — The Root System

The globe's crust is not empty. Below the surface lies the root archive — the compressed, Merkle-encrypted (tamper-proof chain-linked — see Glossary) permanent record of everything that has ever been reconciled. Deeper = older. Archaeologists and historians can zoom BELOW the surface to explore root strata, creating findings filaments on the present surface with evidence twigs reaching down into buried root layers.

**The roots are not dead storage. The roots are alive.**

A real tree's root system mirrors its canopy. The root network is as complex, as branching, and as active as the branches above ground. Relay's root system follows the same principle. The root system IS the archive layer — and it obeys the same tree physics:

**Root structure:**
- The trunk continues below the surface as the **taproot** — the central archive spine.
- Major branches above ground produce corresponding **root branches** below ground. The Finance branch above has a Finance root below. The HR branch above has an HR root below.
- Root branches subdivide fractally — just like the canopy. Deeper sub-roots hold older, more compressed data.
- Root depth = time depth. The deepest roots hold the oldest archived data (Level 2 cold storage). Shallow roots hold recently archived data (Level 0-1).
- Root growth is semi-proportional to canopy activity. A branch that absorbs massive filament volume produces a thick, deep root. A thin, inactive branch produces a thin, shallow root. The roots grow downward as things grow outward and sink into them — canopy activity feeds root mass, root depth reflects how much history has been absorbed.

**Root physics — identical equations, archive interpretation:**

| Branch Physics (above ground) | Root Physics (below ground) |
|-------------------------------|----------------------------|
| Lean = counterparty pressure direction | Lean = retrieval demand direction (which regions/users are querying this archive most) |
| Droop/wilt = confidence deficit | Wilt = integrity concern (verification checks failing, hash mismatches detected, compression errors) |
| Heat = rate of change (engagement delta) | Heat = retrieval surge (sudden spike in archive queries — someone is auditing) |
| Fog = low confidence | Fog = low retrievability (many Level 2 snapshots, cold storage latency high) |
| Thickness = activity volume | Thickness = archive mass (how much resolved work has been absorbed) |
| Twigs = unresolved old filaments | Twigs = orphaned references (evidence refs that point to pruned data, pending rehydration) |
| Bark = active working surface | Root surface = recent archive boundary (data transitioning from warm to cold) |
| Helix twist = time grain | Helix twist = archive epoch cadence (how often Merkle checkpoints are published) |

**What root movement tells you:**

A manager doesn't normally look at roots. But an auditor, a compliance officer, or a system administrator does. When they zoom below the surface:

- **Root branch leaning:** "The Finance archive is being queried heavily from the EU region" — retrieval pressure is directional.
- **Root branch wilting:** "The 2024 Compliance archive has integrity warnings" — hash verification found issues, or cold storage retrieval is failing.
- **Root branch heating:** "Someone is running a deep audit across the entire HR archive" — sudden retrieval surge.
- **Root fog:** "The 2021 procurement archive is in deep cold storage — retrieval latency is high" — the data is there but slow to access.
- **Thick taproot:** "This company has massive resolved history" — deep, healthy archive.
- **Thin taproot:** "This company is young or has very little completed work" — shallow archive.

**Root rendering (LOD rules):**

- At TREE LOD and above: roots are invisible (below the crust). Only the trunk and canopy are visible.
- At TRUNK LOD (zoomed to trunk base): the root junction is visible — you see where the trunk enters the ground. A subtle glow or root-line pattern shows archive health.
- At ROOT LOD (zoomed below surface): root branches render as underground mirror of canopy. Same cylinder geometry, same slab rings (but representing archive epochs instead of active timeboxes), same lean/wilt/heat physics. Color palette shifts to earth tones (amber, brown, dark gold) to distinguish from the living canopy above.
- At DEEP ROOT LOD: the deepest strata — Merkle checkpoint anchors visible as dense crystalline nodes. Individual filament detail is gone (Level 2 compression). Only aggregate summaries and proof chains are rendered.

**Cross-section of roots:**

Cutting a root branch perpendicular shows archive rings — just like cutting a canopy branch shows timebox rings. But root rings represent archive epochs (Merkle checkpoint spans) rather than active timeboxes. Each root ring shows:
- How many filaments were archived in that epoch
- Aggregate magnitude of archived work
- Compression level (Level 0 = full detail ring, Level 2 = thin crystallized ring)
- Any integrity issues (cracks = hash verification warnings)

**Root physics — what generates the values (no imagination, no animation):**

Root movement is driven ONLY by measurable archive operations. Nothing else:

| Root Variable | Source (deterministic) |
|--------------|----------------------|
| Lean | `leanVec_root = Σ (retrievalRequest_weight × θ_request_origin)` — direction of retrieval demand |
| Heat | `heat_root = d(retrievalVolume)/dt` — rate of change in archive queries |
| Fog | `fog_root = 1 − archive_integrity_ratio` where integrity = % hashes verified × % blocks retrievable × % checkpoint consistency |
| Storm | `storm_root = heat_root × fog_root` — high retrieval surge + integrity uncertainty |
| Lightning | Cross-tree retrieval cascade: sudden multi-branch audit spanning many trees. `cascade_root = retrievalMagnitude × uniqueTreesTouched`. Flash if > threshold. |
| Wilt | `wilt_root = 1 − (verifiedCheckpoints / totalCheckpoints)` — checkpoint verification deficit |
| Thickness | `mass_root = Σ magnitude of all absorbed filaments` — archive mass |

If the roots move without a measurable cause from this list, the system has a bug. No theatrical motion. No smoothing. No mystery signals.

**The critical boundary — roots are diagnostic, never operational:**

Root movement must NEVER:
- Affect canopy physics (branch lean, wilt, heat, confidence are computed from filaments, never from root state)
- Affect filament lifecycle (no root condition can transition a filament's state)
- Affect governance (no root metric feeds into votes, sortition, or parameter changes)
- Affect availability (root fog does not block canopy rendering; root wilt does not pause commits)

Roots are a diagnostic mirror. Not a control surface. An auditor reads the roots. The roots never reach up and change the branches. This separation is absolute.

**Heartwood — the terminal stillness state:**

A real tree has heartwood at its deepest center. Heartwood is dead cells that no longer transport water or nutrients. They just hold the tree up — pure structural mass. Relay needs the same concept.

A root filament reaches **heartwood** when ALL of the following conditions are met:

```
HeartWoodCondition {
  compressionLevel: 2,                    // already at terminal compression
  ageThreshold: > configurable (default 10 years absorbed),
  integrityRatio: 1.0,                    // all hashes verified, all proofs valid
  retrievalFrequency: < threshold,         // nobody is actively querying it
  pendingIntegrityWarnings: 0,            // no open issues
  merkleCheckpointSealed: true            // checkpoint containing this data has been
                                          // sealed into a higher-order checkpoint
}
```

Once in heartwood state:
- **No lean** — retrieval direction is irrelevant (nobody is querying)
- **No heat** — no retrieval rate changes
- **No fog** — integrity is proven
- **No wilt** — no integrity concerns
- **Just mass** — contributing to trunk/root thickness and nothing else
- Rendered as dense, still, crystallized structure at DEEP ROOT LOD
- Color: dark amber to black (the oldest, most stable matter in the system)

**Can heartwood re-expand?** Yes, but only under three conditions:

1. **Integrity anomaly detected**: A periodic deep-verification sweep finds a hash mismatch or checkpoint inconsistency. The affected data reactivates from heartwood to active root. If clean after re-verification → returns to heartwood. If integrity issue confirmed → stays active root with wilt, emits scar.
2. **Legal/audit demand**: An external legal process or governance action forces rehydration of specific heartwood data. The data temporarily becomes active root (hot retrieval, Level 0 decompression) for the duration of the audit. After audit completes → returns to heartwood.
3. **Cross-tree evidence cascade**: A new filament in the canopy references heartwood data as evidence. The heartwood data is temporarily rehydrated for verification. After verification → returns to heartwood.

In all three cases, re-expansion is temporary and the data returns to stillness. Heartwood is the natural resting state of fully verified, fully compressed, undisturbed archive. It is structural memory at rest.

**What prevents root churn from destroying compression gains:**

Without heartwood, "alive roots" would create a problem: constant retrieval-driven lean recalculation across billions of archived filaments would generate unbounded compute. Heartwood solves this:
- Only non-heartwood root data contributes to root physics (lean, heat, fog, wilt)
- Heartwood is excluded from all aggregate equations — it is structurally still
- The vast majority of archive (>90% after a few years) is heartwood — undisturbed, unqueried, verified
- Only the active root layer (recently archived + currently queried + integrity-flagged) participates in root physics
- This keeps root compute proportional to active archive operations, not total archive size

**The fractal closure:**

The root system completes the tree:
- Canopy (above ground) = active work, living physics, counterparty pressure, real-time events
- Trunk (at ground) = consolidation gate, cross-branch reconciliation, sequential Merkle chain
- Active roots (shallow underground) = recent archive, retrieval physics, audit access, integrity monitoring
- Heartwood (deep underground) = terminal stillness, structural mass, proven integrity, pure memory

All layers except heartwood use the same ten equations (§3.19). Heartwood is the point where the equations yield zero — all forces balance, all proofs are sealed, all queries are silent. It is not dead. It is still. The tree is alive from root tip to branch tip, and at its deepest center, it rests.

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

**Every celestial body IS a full Relay globe — not a dot on a zoom-out.**

The Moon is a Relay globe. Mars is a Relay globe. Every asteroid, every planet, every moon, every space station that has data being captured about it gets its own full Relay instance with identical physics. Satellites, rovers, orbital sensors, telescopes — these are the data sources that feed filaments into trees planted on those bodies, exactly like human activity feeds filaments into trees on Earth.

- The Moon has its own trees. Geological survey data from lunar orbiters = filaments on geology branches. Mission telemetry = filaments on operations branches. Each observation sinks inward with time. The Moon's tree rings encode lunar history the same way Earth's encode human activity.
- Mars has its own trees. Every rover observation is a filament. Atmospheric readings, soil analyses, radiation measurements — all filaments with the same six domains, the same lifecycle, the same physics.
- An asteroid has a tree if someone is collecting data about it. A telescope observation becomes a filament. A mining survey becomes a filament. The asteroid's tree grows as knowledge about it grows.
- A galaxy cluster has trees if civilizations within it are recording data. The physics scale identically (§3.19, §3.20).

History goes inward on every body. The cross-section of a Martian geology branch shows the same concentric rings as a Tel Aviv invoices branch — each ring is a timebox, thickness is activity density, cracks are scars, the core is compressed archive. The universal equations (§3.19) are truly universal — they don't just scale from file to company to country. They scale from microbe to planet to Laniakea. Every body with data has trees. Every tree has the same physics. Every physics produces the same emergent geometry.

---

## 2. The Trunk

> *"The creation of a thousand forests is in one acorn."* — Ralph Waldo Emerson

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

**Archive pipeline ordering:** Within the branch rings, each filament independently completes its lifecycle at its own pace — there is no queue, no FIFO, no LIFO. A fast-closing invoice migrates inward while a slow dispute still sits on the bark. The branch rings are completion-gated, not sequence-gated.

But the actual archiving into roots (the exit at r=0 through the trunk into the root cubes) IS sequentially ordered — like blocks in a blockchain. Each root cube receives a sequential `commitIndex` in the global chain. This gives the archive untamperability: from the moment a payment is completed and recorded to GL, its position in the Merkle-sealed root chain is permanent, cryptographically verifiable, and deterministic. The chain order means any two independent systems replaying the same commit log will produce identical root archives, regardless of what order the filaments completed their lifecycles within the rings.

This separation is critical: **lifecycle is parallel (each filament independent), archiving is serial (one chain, one sequence, one truth).** The branch rings are where work happens. The root chain is where truth is sealed.

### 2.3 No Standalone Deformation

The trunk does not wilt, bend, or deform on its own. Its visual state is purely emergent from branch health. Healthy branches = firm trunk. Wilted branches = the trunk reflects the aggregate degradation.

---

## 3. The Branch — Cylindrical Coordinate Model

> *"In nature, nothing exists alone."* — Rachel Carson

A branch is a category of work. Think of the "Invoices" pile in an accounting department, or the "Pothole Reports" stack at city hall, or the "Patient Records" shelf at a clinic. In Relay, each of these becomes a living 3D branch on the tree — a cylinder you can look at and immediately tell whether things are moving smoothly or piling up. New work appears on the outer surface. Completed work migrates inward. Old unfinished work sticks out like a twig. You see health at a glance, the way you can tell a real tree is healthy or dying without counting its leaves.

Here is how the geometry works. A branch represents a service type / activity category where every filament row shares the same basic schema. Branches are not departments — they are coherent units of analyzable work.

### 3.1 The Cylindrical Coordinates

Every point on or in the branch is defined by **(l, r, theta)**:

- **l** (length along branch) = **TIME**. l=0 at trunk junction. l=L_max at branch tip. Timeboxes are cross-sectional disks at regular l intervals.
- **r** (radial distance from center) = **LIFECYCLE MATURITY**. r=R_max is outer bark (OPEN/new). r=0 is center (ABSORBED, exiting to trunk). Filaments migrate inward as they mature.
- **theta** (angle around circumference) = **APPROACH DIRECTION**. Computed from the actual vector of approach — on the globe this defaults to compass bearing from tree to counterparty; on street view it is the literal physical direction measured by proximity detection.

### 3.2 The Bark IS the Content

The content does not sit at the end of the branch. **The content IS the bark — it wraps AROUND the branch surface.**

The bark rendering adapts to the content type defined by the template, but the cylindrical geometry is universal:

- Filaments stream along the l axis. Each filament is one atomic event (one row, one document, one file, one track).
- New events appear at the current timebox position on the outer bark surface.
- As long as a filament is OPEN, it continues to grow longer along l, existing in successive timeboxes.
- When a filament CLOSES, it stops growing on the bark and begins migrating inward (r decreases).
- Content wraps around the branch — exactly like real bark on a real tree.

**Per-content-type bark rendering at CELL LOD:**

| Content Type | l axis = | Bark at CELL LOD | Sinking Mode |
|---|---|---|---|
| Tabular (invoices, transactions) | Calendar time | Spreadsheet grid (rows × columns) | Earth-time |
| Documents (Word, contracts, briefs) | Content position (start → end) | Readable text scroll | Earth-time or milestone |
| Code (source files, config) | File position (line 1 → last line) | Syntax-highlighted source | Milestone (sprint/release) |
| Music / audio | Composition timeline (intro → outro) | Waveform or notation | Milestone (production phase) |
| Images / CAD / visual media | Version sequence | Visual viewport / gallery | Milestone (review cycle) |
| Projections (§6) | Pipeline stage (input → output) | Filter rules + summary | None (projections don't sink) |

At BRANCH LOD, every content type looks the same: a cylinder with timebox slabs, lifecycle ring zones, and helical twist. The content type only affects the CELL LOD rendering — what you see when the bark unrolls.

**The invariant:** Bark is not always a spreadsheet. Bark is always the native editor for the branch's content type.

### 3.2.1 Individual Filament Depth — The Radial Commit History

Each filament has depth. Looking at a single filament on the bark surface and going INWARD (radially toward the branch center), you see that filament's commit history layered like geological strata:

- **Outer bark surface** = the current state (the live value, the latest revision)
- **First inner layer** = the previous commit (the value before the last edit)
- **Deeper layers** = older commits, further back in time
- **Deepest layer** = the original state when the filament was first created

A filament that has been edited 50 times has more radial depth than one edited twice. The z-axis (radial) IS the version history of that specific filament.

**Per-content-type radial depth:**

| Content Type | Radial layers show | Example |
|---|---|---|
| Spreadsheet cell | Previous cell values | 10 → 15 → 15.5 → 16.2 (each commit = one layer) |
| Document section | Previous paragraph revisions | Draft 1 → Draft 2 → Reviewed → Final |
| Code function | Previous function versions | Like `git blame` depth per line |
| Music segment | Previous takes / mixes | Take 1 → Take 3 → Mix A → Master |
| Image / CAD | Previous asset versions | Sketch → Draft → Final render |

This means a branch cross-section (the pie-chart view) shows not just WHERE counterparties are (angular) and what lifecycle state filaments are in (ring zone), but also HOW MUCH HISTORY each filament carries (radial depth). A heavily-edited cell sits deeper in the rings than a cell that was entered once and never touched again.

### 3.3 Zoom-to-Flat LOD Transition

- **BRANCH LOD**: Full cylinder. Bark texture visible but individual rows not readable.
- **SHEET LOD**: Bark partially flattening. Column headers becoming visible. Some curvature remains.
- **CELL LOD**: Fully flat 2D spreadsheet grid. Users read, edit, and interact as in Excel. The cylindrical surface is conformally projected onto a plane.
- **Zooming out**: The flat grid re-wraps onto the cylindrical branch surface.

### 3.4 Branch Cross-Section — Triple Encoding (The Pie Chart)

Branches extend outward from the trunk, rising from the globe surface so that each branch is a cylinder that can be sliced perpendicular to its axis. That cross-section is a pie chart. It encodes THREE things simultaneously:

**Radial** (distance from center) = lifecycle maturity + commit history depth:
- Outer bark = OPEN/new filaments (just spawned, few commits)
- Middle rings = ACTIVE filaments (in progress, accumulating commit depth)
- Inner rings = CLOSED filaments (resolved, settling inward, full history)
- Core = ABSORBED (exiting to trunk through consolidation gate)
- A heavily-edited filament sits deeper than a lightly-edited one at the same lifecycle stage (§3.2.1)

**Angular** (compass direction) = approach direction of counterparty:
- A client from the east appears on the east side of the bark
- A vendor from the north appears on the north side
- Angular clustering reveals counterparty concentration: "most of our invoices come from the northwest" is immediately visible

**Color/opacity at each point** = magnitude and confidence:
- Warm (red) = high magnitude. Cool (blue) = low magnitude.
- Solid = high confidence (well-evidenced). Transparent = low confidence.

The cross-section is simultaneously a **tree ring diagram** (radial = lifecycle depth), a **pie chart** (angular = counterparty distribution), and a **heat map** (color = magnitude, opacity = confidence). Looking at it, you can tell in one glance: where your counterparties are, how mature your work is, how much money is flowing, and how well-evidenced it all is.

### 3.5 The Helical Twist — Time Grain

The branch has a subtle spiral grain along its length — like a barber pole or twisted rope.

- One full twist = one configurable time period (day, week, sprint, quarter)
- Filament rows follow the spiral as they grow along the bark
- A filament alive for 3 weeks spirals around 3 times
- Count the twists = count the time periods
- The twist is structural (the time grain), not a free-spinning animation

### 3.5.1 Angular Disambiguation — Six Distinct Rotations

The system uses angular/rotational concepts in six independent ways. They are NOT the same thing. Implementers must never conflate them:

| # | Concept | Symbol | What It Controls | Defined By | Changes Over Time? |
|---|---------|--------|-----------------|------------|-------------------|
| 1 | **Filament θ** | `θ`, `theta` | Where a filament sits on the bark surface (pie chart sector) | Counterparty approach direction (geographic bearing or template category bin) | No — fixed at filament creation |
| 2 | **Branch layoutAngle** | `layoutAngleRad` | Where a branch points from the trunk in 3D space | `hash(layoutKey)` — identity only (§3.18) | Never — deterministic from identity |
| 3 | **Helix twist** | twist period | Spiral grain along the l axis | Template time period (day/week/sprint) | No — structural constant per template |
| 4 | **Branch lean** | `θ_lean`, `leanDir` | Small tilt deformation of the branch body | Net counterparty θ pressure from Equation 3 (§3.19) | Yes — recomputed at each timebox close |
| 5 | **Globe rotation** | Earth rotation | Time itself — the universal clock | Real Earth rotation | Continuous — this IS time |
| 6 | **Camera reorientation** | (UI only) | View angle for cross-section mode (§3.13) | User interaction | On-demand — not physics |

**Critical rules:**
- **Filament θ ≠ Branch layoutAngle.** A filament's counterparty direction on the bark is independent of which direction the branch points from the trunk. They live in different coordinate frames.
- **Lean ≠ Layout.** Lean is a small deformation (capped 5-10°) applied AFTER layout. It never moves the branch out of its layout slot. Contract #114.
- **Helix twist ≠ Lean.** Helix is structural grain along the branch length. Lean is a directional tilt of the whole branch body. They are perpendicular effects.
- **Globe rotation ≠ any branch rotation.** Globe rotation is the time constant. Branch layout, lean, and helix are all local to the branch.

### 3.6 Timebox Slabs — The Vertebrae

Cross-sectional rings segment the branch into time periods. Each ring = one timebox.

**Core properties computed FROM the filaments within:**

- **Thickness** = commit density (more commits in period = thicker ring)
- **Color** = aggregate magnitude (warm palette for net positive, cool for net negative). Magnitude is encoded as color, not as directional extrusion.
- **Opacity** = confidence (automatic: evidence_present / evidence_required). No manager approval.
- **Firmness** = wilt factor (0.0 = fully firm, 1.0 = maximally wilted)
- **Filament length** along the L-axis emerges from commit topology — see §78 for the full filament length ontology including five emergent profile classes (micro, transaction, project, structural, continuous).

**Aggregate fields (computed at timebox close, cached for lean physics §3.15 and weather overlays §3.16):**

```
TimeboxAggregate {
  timeboxId: string,
  branchId: string,
  startAt: ISO-8601,
  endAt: ISO-8601,
  commitCount: number,
  filamentCountActive: number,
  filamentCountClosed: number,
  twigCount: number,
  orgConfidenceAvg: number,
  orgConfidenceMin: number,
  globalConfidenceAvg: number,

  // Lean vector (drives branch lean at timebox close, §3.15)
  leanVecX: number,
  leanVecY: number,
  leanWeightSum: number,
  leanTopContributors: Array<{ counterpartyRef, weight }>,
  leanTopFilaments: Array<{ filamentId, weight }>,

  // Weather (drives tile overlays at REGION/GLOBE LOD, §3.16)
  engagementDelta: number,
  engagementRate: number,
  heat: number,
  fogIndex: number,
  stormIndex: number
}
```

All fields are deterministic aggregates of underlying filament data. No scores. No ML. No tuning knobs. Every field is traceable to specific filaments and their commit logs. Lean fields drive branch movement physics. Weather fields roll up into TileAggregates for regional overlays. Wind is not a separate field — wind is the pattern of lean observed during time replay (§3.15).

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

### 3.12 Two Axes of "Old" — Why Twigs Exist

A filament has two independent notions of age:

1. **Time-old** (gravity / sinking along l): When the event happened. Gravity pulls everything downward along the branch toward the trunk junction. Older events are deeper. This is universal and unstoppable — the clock never stops.

2. **Maturity-old** (lifecycle / inward along r): How settled the event is. Evidence, matching, and fulfillment of template rules push filaments inward toward the core. A fast-closing invoice migrates inward quickly. A disputed one stays on the outer bark.

These two axes are **independent**. A filament can be:

- **Old in time + inward** (normal): An invoice from January, fully matched and paid. It has sunk deep and migrated to the core. Invisible — healthy completion.
- **Old in time + still on bark** (twig): An invoice from January, still unmatched. It has sunk deep (gravity doesn't care about disputes) but hasn't migrated inward (it hasn't closed). Everything around it at that timebox level has completed and moved to center. This filament alone protrudes at bark radius. It IS a twig.
- **New in time + already inward** (fast-close): A payment received today, immediately matched with three-way evidence. It just appeared at the tip but already has full confidence and begins migrating inward. Fast lifecycle, recent timestamp.
- **New in time + on bark** (normal): A new invoice just received. On the outer surface at the branch tip. Just spawned.

This two-axis independence is the core mechanism that makes the tree shape meaningful without any decoration or dashboard. The shape is emergent from the data. Twigs, wilting, trunk thickness, and branch health are all natural geometric consequences of where filaments sit in the (l, r) space.

### 3.13 Cross-Section Inspection Mode — Reading the Rings

The archive is not meant to be legible from the branch surface. On the branch surface you see current work, near-time slabs, twigs, wilt — live structure. The archive becomes legible when you rotate into cross-section mode. Exactly like cutting a real tree branch to count its rings.

A real tree cross-section (reference: the canonical tree photo showing concentric growth rings, radial cracks, bark layer, and compressed core) reveals five truths simultaneously:

- **Rings** = timebox slabs (each growth cycle)
- **Ring thickness** = activity density (thick ring = busy period)
- **Ring color variation** = magnitude and confidence
- **Radial cracks** = scars (stress events permanently visible)
- **Dense core** = compressed archive (old, reconciled, compacted)

Cross-section mode exposes this same view for any branch.

**I. Entering Cross-Section Mode**

Trigger: User must be at BRANCH LOD, focused on a single branch. Entry by double-click on branch cylinder, or dedicated inspect action.

Visual transition (UI camera action — not physics rotation):
1. Camera repositions perpendicular to branch axis. Branch cylinder reorients to face camera directly, centered on a selected slab region (default = most recent). This is a view change, not a data or physics operation.
2. Bark opacity fades to 0.25. Body cylinder fades. A cross-section cut plane animates into view.
3. Concentric rings appear: each ring = one timebox slab. Thickness varies by activity density. Color = magnitude. Opacity = confidence. Cracks = scars. Wilt deformation visible on affected rings.

State model: `viewMode = 'CROSS_SECTION'`, `activeBranch = branchId`, `sliceDepth = currentTimeboxIndex`. No data changes — only camera and rendering mode changes.

**II. Scrubbing Inward Through Rings**

A radial time scrubber allows exploring archive depth:

- **Scroll wheel**: inward = deeper in time (toward core), outward = toward recent slabs.
- **Click and drag**: a ring's outer edge to expand it temporarily.
- **Keyboard**: arrow keys step slab by slab. Shift+arrows jump 5 slabs.

Visual feedback: selected ring glows subtly. Non-selected rings dim. Filament cross-points appear on the selected slab. Ring thickness visually expands (temporary magnification for legibility).

**III. Expanding a Specific Slab**

User clicks a ring:

1. All other rings fade to 20% opacity. Selected ring expands radially for legibility. Ring thickness increases temporarily.
2. The ring flattens into a circular disc panel facing the camera. You now see all filaments that crossed that slab — their angular positions (theta = counterparty direction), lifecycle states at that timebox, magnitude encoding, and evidence ratio.

This is a "timebox snapshot." Optional lens filters: show only unresolved, show only scars, group by counterparty, sort by magnitude.

**IV. Jumping from Slab to Individual Filament**

User clicks one filament on the expanded slab disc:

1. That filament's theta sector lights up. A thin radial line extends along the branch axis — the filament's entire ribbon path from bark to root.
2. Camera repositions 90° back to longitudinal (branch axis) view. The selected filament ribbon is highlighted. All other ribbons dim.
3. Context overlay appears: identity block (left), timeline block (right), full commit history, evidence attachments, lifecycle transitions, scar references, and backing refs.

**V. Exiting Cross-Section Mode**

Press Esc, click branch body, or click "Return to Bark." Camera returns to default position. Cylinder regains opacity. Return to longitudinal flow view.

**Critical constraints:**
- Cross-section mode never modifies data.
- Slab expansion is render-only (temporary magnification).
- Scrubbing does not pause gravity. Time keeps sinking.
- Filament positions are always derived from commit timestamps.
- No separate archive copy exists. The rings ARE the data.

### 3.14 Organic Growth Rendering — Biology, Not Mechanics

A real tree's growth rings are not perfect circles. They are slightly uneven. Thickness fluctuates around the circumference. Grain is not perfectly radial. Relay's visual model must eventually reflect this.

**Slab organic variation (rendering refinement):**
- Ring thickness varies slightly by theta (circumferential non-uniformity). Where more filaments cluster (high counterparty concentration in one angular sector), the ring is slightly thicker on that side.
- Subtle Perlin noise applied to slab surfaces. Growth should feel biological, not mechanical.
- Deep archive rings visually compress toward the core. LOD determines representation: at TREE LOD deep archive = thin inner band. At BRANCH LOD = denser bands. At CROSS-SECTION LOD = full fidelity.
- The compression is visual only. Data exists in full fidelity at every depth.

**Bark ridge deformation on schema evolution:**
- When schema versions change (new columns added, new domain attributes introduced, template upgrades), the bark texture shifts subtly: micro ridges or directional changes in the bark shader appear at the timebox where the schema version bump occurred.
- The deep ridges of the bark show where structural changes happened. The flow direction remains visible in the grain (commit causality along the l axis), but the ridges mark where the branch's schema grew.
- This is not a data mutation — it is a rendering response to `schemaVersion` commits in the branch's history.

**Scar crack propagation (rendering refinement):**
- Scars (§4.5) should not only appear as red marks on the bark. In cross-section mode, scars appear as radial cracks — lines extending from the slab where the revert occurred outward toward the bark and slightly inward toward older rings.
- Cracks slightly warp adjacent slab surfaces (geometric deformation proportional to scar severity). A minor data correction creates a hairline crack. A major governance revert creates a visible fissure.
- Cracks do not erase rings. They do not delete data. They become part of the structure — permanently visible stress history, exactly like a crack in real wood.

**The grain = commit causality:**
- The vertical grain visible on the branch surface represents the l axis — the direction of growth. Even after archive compression, you can still see which direction work traveled because commit timestamps are immutable, slab order is immutable, and radial compression preserves sequence.
- The helical twist (§3.5) matches the spiral grain visible in real wood. Age twists. Time rotates. The grain IS the Merkle chain made visible.

### 3.15 Wind — The Inverse Metric of Branch Movement Over Time

Wind is not a separate overlay. Wind is not rendered as arrows or indicators. Wind is what you **observe** when you replay the tree's history and watch branches move.

A branch moves because the data inside it changed. If you replay a year of Invoices branch history, you see it lean toward the northwest for three months, then shift south in Q3, then settle back. That movement IS the wind. You are watching the wind happen. Wind is calculated inversely from the observed branch movement trajectory — it is a metric derived from replay, not a real-time decoration.

**Two types of wind (both observed through replay, never rendered as separate indicators):**

1. **Internal lean** (micro / within a branch): The lean vector from counterparty θ pressure on the branch's own filaments. One branch leans because its filaments cluster directionally. This is the primary wind described below — computed per branch at each timebox close.

2. **Structural drift** (macro / orbital): How a branch's effective presence within its layout slot changes over time due to growth, contraction, or mass change. A branch that resolves massive volume grows thicker (more trunk mass feed, larger rendered radius). A branch that withers contracts. This is visible during replay as the branch gaining or losing "orbital weight" — not because the layout slot (§3.18) changed, but because the branch's rendered thickness and visual prominence expanded or shrank within its fixed slot. At planetary and galactic scale, structural drift becomes how entire trees shift in heat/fog fields relative to their neighbors (see §3.20 Orbital Model).

**What causes branch movement (the three physics):**

| Component | Source | Direction | Update Frequency |
|-----------|--------|-----------|-----------------|
| **Lean** (horizontal) | Net counterparty θ pressure from filaments on bark | Toward weighted centroid of active filament approach angles | Per timebox close |
| **Droop** (vertical) | Wilt from slab firmness deficits (§3.7) | Downward | Per timebox close |
| **Twist** (surface rotation) | Helix period (§3.5) | Rotational along l axis | Continuous (slow) |

No other motion exists. No wiggle. No bounce. No decorative animation. If it moves, the data changed. If the data didn't change, the branch is still.

**Lean computation (per branch, per timebox close):**

The theta axis on the bark encodes counterparty approach direction (§3.4). At each timebox close, the net directional pressure from all active filaments produces a lean vector:

For each branch `b`, at timebox close:
1. For each filament `f` active in the closing timebox where `approachAngleRad` is not null:
   - Compute weight: `w = windWeight(f)`
   - Accumulate: `windVecX += cos(θ_f) × w`, `windVecY += sin(θ_f) × w`, `windWeightSum += w`
2. Lean direction: `leanDir_b = atan2(windVecY, windVecX)`
3. Lean strength: `leanStrength_b = clamp(|V_b| / scaleFactor, 0..1)`

**Deterministic wind weight function (frozen — no ML, no randomness, no hidden tuning):**

```
w = 1.0
w × lifecycleMultiplier:  SCHEDULED = 0.0 (inert), OPEN/ACTIVE/HOLD = 1.0, CLOSED/ABSORBED = 0.2
w × magnitudeMultiplier:  0.5 + 0.5 × clamp(|magnitude| / magScale, 0..1)
w × pressureMultiplier:   0.5 + 0.5 × (1 - orgConfidence)
w × twigMultiplier:       1.5 if filament is a twig (overdue), else 1.0
```

Open, high-magnitude, low-confidence, overdue filaments exert the most directional pressure.

**The four quadrants (what lean direction means):**

The quadrants a branch can lean toward are determined by the branch's template mapping:

- **Geographic mapping** (default): θ = true compass bearing from tree location to counterparty location. NE/SE/SW/NW = literal geographic directions. "Invoices branch leaned NW in Q1" = most pressure came from vendors in that direction during Q1.
- **Category mapping** (template-defined): θ bins map to counterparty categories (e.g., 0°=Suppliers, 90°=Customers, 180°=Regulators, 270°=Internal). "Branch leaned toward Suppliers in March" = supplier pressure dominated that month.

**Lean rendering (small deformation, not layout change):**

When computing branch path frames (`branch._branchFrames`), apply a small lateral offset curve:
- `leanOffset = maxLeanMeters × leanStrength` (maxLeanMeters is small — capped at 5-10° of tilt, never a dramatic repositioning)
- Offset is perpendicular to branch tangent, in ENU frame, toward `leanDir` projected into local ENU.
- Updates at timebox boundaries only, not per frame. No jitter.

**Critical distinction: lean is NOT layout.**

Branch layout direction (where the branch points in space from the trunk) is determined by `layoutKey` (§3.18). It never changes based on counterparty data. Lean is a small deformation applied *after* layout — a slight tilt within the branch's fixed position. Even a maximal lean does not move the branch out of its layout slot.

**Explainability (non-negotiable):**

Clicking a branch during replay (or clicking the branch in its current lean pose) opens a panel showing:
- Top counterparty contributors to the lean vector (top-K by weight)
- Top filament IDs driving the lean (top-K by individual contribution)
- The timebox window producing the current pose

Every lean direction is traceable to specific filaments and counterparties. If a manager sees the branch leaning, they can click once and know exactly why.

**Wind as a replay metric:**

When a user replays a time range (§15, TIME-SCRUB-1), they watch the branch lean shift timebox by timebox. The pattern of lean over time IS the wind. A branch that consistently leans one direction has a prevailing wind from that quadrant. A branch that swings back and forth is experiencing turbulent counterparty changes. A branch that doesn't lean at all has balanced or no directional pressure. No separate wind visualization is needed — the branch movement itself is the visualization.

### 3.16 Weather Overlays — Heat, Fog, Storm, Lightning (Branch Weather)

This section describes **branch weather** — social/operational truth fields computed from filament activity. Relay also has a separate **physical weather** layer (§75) that renders real meteorological data from sensors. The two layers stack visually but use different color palettes and data sources.

Branch weather is not a metaphor. It is a set of deterministic overlay computations derived from timebox aggregates with no hidden inputs. Weather is rendered at REGION and GLOBE LOD as tile-based overlays. It tells you the state of large areas at a glance.

**Four weather effects, all deterministic:**

**Heat (urgency / acceleration):**
- Computation: `heat = engagementRate_current - engagementRate_previous` (rate of change of engagement across adjacent timeboxes)
- Rendering: color temperature on region tiles. Hot = red/orange pulse. Cool = blue/grey. Neutral = no overlay.
- What it means: "Things are changing fast here." A hot region has accelerating engagement — new filaments, new commits, new votes. A cold region is stable or dormant.
- Log: `[HEAT] tile=<id> heat=<value> window=<start>-<end>`

**Fog (low trust / weak evidence):**
- Computation: `fogIndex = 1 - orgConfidenceAvg` (average organizational confidence across all branches in tile scope)
- Rendering: grey desaturated haze overlay on region tiles. Alpha = fogIndex. Dense fog = very low confidence.
- What it means: "We can't see clearly here." Fog means the data exists but the evidence backing it is weak. Invoices without PO matches. Compliance filings without attestations. The work is happening but nobody can prove it's correct.
- Log: `[FOG] tile=<id> fogIndex=<value> confidenceAvg=<value>`

**Storm (high acceleration + low confidence = dangerous):**
- Computation: `stormIndex = norm(heat) × norm(fogIndex)` — things changing fast AND evidence is weak.
- Rendering: flicker + turbulence overlay. `brightness = base + stormIndex × (0.5 + 0.5 × sin(t + phase))` where `phase = hash(timeboxId + tileId)` (deterministic, not random). Stacks above heat and fog.
- What it means: "Lots happening, nobody can prove any of it." This is the danger zone. A storm over a region means rapid activity with no evidence backing. A manager sees storm and should intervene immediately.
- Log: `[STORM] tile=<id> stormIndex=<value> heat=<value> fog=<value>`

**Lightning (cascade events — evidence spreading across trees):**
- Trigger: At timebox close, build graph edges from `evidenceRefs(type='filament')` created in this timebox. If `uniqueTreesTouched >= T1 AND edgeCount >= T2`, emit a LightningEvent.
- LightningEvent record: `{ eventId, startAt, windowSec, originFilamentId, edgeCount, uniqueTreesTouched, pathSample: [{ from, to }], scope: branch|tile|global }`
- Rendering: brief bright path flash along sampled evidence edges. At TREE/BRANCH LOD = short bright segments between filament positions. At GLOBE/REGION = single beam between involved trunks/tiles. Duration = 1.0s, keyed by `startAt`.
- What it means: "One piece of evidence just rippled across many trees." A lightning flash means a single filament's evidence (a payment confirmation, a test result, a regulatory filing) just connected to filaments in many other trees. That's either very good (broad reconciliation) or very important (systemic event).
- Log: `[LIGHTNING] eventId=<id> origin=<filamentId> edges=<n> trees=<n> scope=<scope>`

**Scope tile computation:**

At GLOBE/REGION LOD, per-branch weather aggregates are rolled up into geographic tiles (geohash or fixed lat/lon grid). Each tile per timebox window stores:

```
TileAggregate {
  tileId: string,
  windowId: string,
  heat: number,
  fogIndex: number,
  stormIndex: number
}
```

All computed as pure aggregates of branch timeboxes inside the tile. No derived scores. No ML. No tuning knobs. Wind/lean is not part of tile aggregates — wind is observed at BRANCH LOD through branch movement during replay (§3.15), not as a tile-level overlay.

### 3.17 Scale Discipline — What Happens at 10× and Beyond

One company tree with 5 branches and 50 filaments is readable. 500 branches with 50,000 filaments requires aggressive LOD discipline or the tree becomes noise. This section defines the collapse rules that preserve the "shape is the analysis" guarantee at scale.

**Problem A — Visual clutter at TREE/COMPANY LOD:**

At COMPANY LOD (camera far enough to see the whole tree):
- Individual filament dots/ribbons disappear. They merge into aggregate bark texture: slab discs remain, twig count becomes a single "stub density" indicator (number overlaid, not individual stubs), ribbon detail only appears at BRANCH LOD and closer.
- Branch shape, lean, droop, and overall silhouette are the primary signals. You can tell which branch is healthy, which is wilting, which is leaning — but you cannot see individual rows.

**Problem B — Too many moving things:**

Branch motion (lean + droop) updates only at timebox boundaries, not per commit. A timebox boundary is the natural heartbeat of the system (configurable: daily, weekly, sprint). Between boundaries, the tree is still. This prevents "everything is always jiggling" at scale.

At TREE LOD: branches show their lean and droop as a static pose that updates when the current timebox closes.
At BRANCH LOD: you see the lean, plus individual slab updates, plus ribbon detail.

**Problem C — Archive depth overwhelming the cross-section:**

A 10-year-old branch has hundreds of rings. Cross-section mode (§3.13) handles this through:
- LOD by depth (§33.4): deep rings visually compress. Only the last N rings (e.g., 12 months) render individually. Older rings merge into band groups.
- Scrubbing expands on demand: user scrolls inward to expand older bands into individual rings.
- The cross-section is always a lens, never a full dump.

**Problem D — Misreading causality:**

Users will assume branch motion means "someone is attacking us" when it might be normal seasonality. Guard against this with:
- Explainability on every lean (§3.15): click to see contributors. No unexplained movement.
- Baseline comparison: templates can define "expected lean" (seasonal norms). Deviation from baseline is revealed during replay — the branch leans further or in a different direction than the template baseline predicts.
- Weather overlays (heat, fog, storm, lightning) can be toggled off. Branch lean and droop cannot be toggled off — they are physics, not overlays. The truth layer (filaments, slabs, scars) is always visible underneath.

**The non-negotiable scale rules:**

1. **No artificial smoothing.** If the tree looks ugly because there are 47 twigs, the tree has 47 twigs. Do not hide twigs to make the tree pretty. The ugly tree IS the report.
2. **No management overrides.** Nobody can click "resolve" without fulfilling template rules. Nobody can remove a scar. Nobody can pause sinking. The tree never lies.
3. **No cosmetic reporting drift.** The tree IS the report. There is no "executive summary overlay" that replaces the tree shape with a simplified graphic. Executives look at the tree or they zoom out. The LOD system handles simplification — not a separate dashboard.
4. **LOD shed order:** When rendering budget is exceeded, shed in this order: (1) weather tile overlays (heat, fog, storm, lightning), (2) individual filament detail, (3) organic variation noise, (4) individual slab rings, (5) branch lean/droop deformation, (6) branch silhouettes. Branch silhouettes are never shed — you always see the branches. Lean and droop are physics and shed late (step 5), not early like tile overlays (step 1). Evidence structure is always last to go.

### 3.18 Branch Layout — Stable Direction from Identity, Not Data

Branch direction (where a branch points in space from the trunk) is NOT counterparty direction. Counterparty θ is for filaments on the bark — it drives lean (§3.15). Branch layout direction is the trunk-to-branch attachment slot. These two are independent. If they weren't, counterparty data would literally move your org chart layout, and legibility would collapse.

**The rule: branch direction comes from a stable `layoutKey`.**

Every branch has:

```
BranchLayout {
  branchId: string,
  layoutKey: string,
  layoutAngleRad: number,
  ringIndex: number,
  ringRadiusMeters: number,
  ringHeightOffsetMeters: number,
  collisionBumpCount: number
}
```

- `layoutKey` is a stable, deterministic string derived from the branch's identity — never from live data.
- `layoutAngleRad = hash(layoutKey) → θ ∈ [0, 2π)` — deterministic mapping from identity to angle.
- `ringIndex`, `ringRadiusMeters`, `ringHeightOffsetMeters` — position in the multi-layer shell (see below).
- `collisionBumpCount` — how many collision resolution steps were applied (for deterministic replay).

**layoutKey examples:**

| Tree Type | layoutKey Pattern | Example |
|-----------|------------------|---------|
| Company | `tree.<companyId>::branch.<servicePath>` | `tree.avgol::branch.finance.ap` |
| Directory / filesystem | `tree.<userId>::branch.fs::<rootPathHash>` | `tree.eitan::branch.fs::sha256(/Clients/Alrov)` |
| Software project | `tree.<projectId>::branch.<modulePath>` | `tree.relay::branch.features` |
| Personal | `tree.<userId>::branch.<categoryKey>` | `tree.eitan::branch.health` |
| Municipal | `tree.<municipalityId>::branch.<deptId>` | `tree.telaviv::branch.infrastructure.water` |

The key never changes when counterparties change, when filament volumes shift, or when weather conditions vary. It changes only if the branch is restructured (split, merge, rename) — which is a governance commit, not a data event.

**Multi-layer branch shells — solving fanning and overlap:**

Branches don't all attach at the exact same height and radius. They are assigned to concentric rings around the trunk:

- `ringIndex` (0..N): which shell layer this branch belongs to. Ring 0 = closest to trunk. Ring N = outermost.
- `ringRadiusMeters`: radial distance from trunk center for this ring.
- `ringHeightOffsetMeters`: height offset along the trunk for this ring (slight stagger).
- Phase shift per ring: branches in ring 1 are rotated by a small angular offset from ring 0 branches to prevent radial alignment.

Even if two branches hash to similar `layoutAngleRad` values, they are separated by ring radius and height offset. At 5 branches this doesn't matter. At 50 or 500, the multi-layer shell prevents visual collision without changing any branch's semantic meaning.

**Collision-aware routing (deterministic):**

When generating the branch curve from trunk to tip:
1. Sort all branches by `branchId` (deterministic ordering).
2. Propose each branch curve from trunk surface at `layoutAngleRad` in its assigned ring.
3. If the proposed curve intersects an already-placed branch corridor volume: apply deterministic escape — bump outward by `Δradius = k × collisionBumpCount` or raise by `Δheight = k2 × collisionBumpCount`, or add a single extra Bezier control point ("jump arc").
4. Increment `collisionBumpCount`. The bump is deterministic because the ordering is deterministic.

Replay of branch layout from the same set of `branchId` values always produces the same spatial arrangement. No randomness. No "best fit" optimization. Pure deterministic hash + collision resolution.

**LOD bundle merge (the real answer at 100+ branches):**

At TREE/COMPANY LOD with hundreds of branches, you should NOT see every branch as a full cylinder. Instead:

- Branches with the same template category (e.g., all `finance.*` branches) merge into a **category bundle** — a single thicker cylinder representing the group.
- The bundle shows aggregate health: combined twig density, aggregate lean, combined wilt.
- A count indicator shows how many branches are bundled.
- When you zoom in (BRANCH LOD), the bundle splits into individual branches in their correct layout slots.

This means overlap is not "prevented at full fidelity globally." It's not rendered until you're close enough. The LOD system handles density, not semantic repositioning.

**Directory tree direction (semantic bins):**

Directory branches don't have natural counterparty geography. They use semantic bins:

- Top-level bins are fixed angles: Documents (0°), Media (60°), Projects (120°), Archive (180°), System (240°), Other (300°).
- Inside each bin, children are placed by `hash(path)` within that bin's angular span (60° per bin in this example).
- Deeper nesting creates sub-branches using the same `layoutKey → hash → angle` rule within the parent branch's angular allocation.

This makes directory trees readable and stable without pretending they have real-world approach angles.

**The invariant (frozen contract #114):**

Branch direction is derived only from `layoutKey` hashing + ring assignment + collision resolution rules. It never depends on counterparties, votes, attention, wind, or any live metric. Lean (§3.15) is a small deformation within the fixed layout slot — it does not move the slot itself.

### 3.19 Universal Force Equations — Scale-Invariant Physics

**Prerequisite: The Inward Direction (local origin O)**

Every Relay globe, at every scale, defines a **local structural origin O**. Inward direction = the vector toward O. Archive compression, gravitational sinking, ring orientation, and lifecycle migration are all computed relative to this origin. Without a deterministic inward direction, the entire visual truth layer becomes undefined.

| Scale | Local Origin O | What "Inward" Means |
|-------|---------------|---------------------|
| Branch | Branch root (trunk attachment point) | Toward the center axis of the cylinder |
| Tree | Trunk core (center of trunk at ground level) | Toward the trunk's central axis |
| City / Region | City trunk cluster centroid | Toward the geographic center of the tree cluster |
| Planet (Earth, Mars, Moon) | Planetary center (geometric center of the body) | Toward the core of the planet |
| Asteroid (irregular body) | Barycenter (center of mass) | Toward the mass center — no stable north required, only a deterministic inward point |
| Star system | System barycenter (typically near the star) | Toward the gravitational center of the system |
| Galaxy | Galactic barycenter | Toward the mass center of the galaxy |
| Laniakea | Supercluster attractor (Great Attractor region) | Toward the gravitational convergence point |

The origin does not need astrophysical precision. It needs to be deterministic and stable. Two renderers computing "inward" for the same scope must agree on the direction. For non-spherical bodies (asteroids, galaxy clusters), the barycenter is sufficient — it provides a consistent inward vector even without a meaningful surface or stable rotation axis.

**Why this matters:** If inward is ever ambiguous, archive compression becomes undefined, ring orientation becomes undefined, lean becomes meaningless, and helix becomes arbitrary. Frozen contract #119 locks this.

---

Relay does not show motion. Relay shows force. Movement is the visualization of force imbalance. When forces balance, the branch is stable. When forces skew, it leans. When integrity drops, it droops. When activity spikes, heat rises. When evidence weakens, fog descends.

These equations work identically whether the filament is a file, an invoice, a citizen complaint, or a planetary mission. Only magnitude and aggregation level change. The math does not.

**Primitives — every filament F carries:**

```
θ  = approach angle (radians)
m  = magnitude (normalized)
c  = confidence ∈ [0, 1]
a  = age since spawn (seconds)
o  = overdue factor (1.0 if on time, >1.0 if past expected close)
s  = lifecycle state ∈ {SCHEDULED, OPEN, ACTIVE, HOLD, CLOSED, ABSORBED}
e(t) = engagement delta over time window
d  = direction vector = (cos θ, sin θ)
```

Everything else emerges from these. No hidden inputs. No scores. No ML.

**Equation 1 — Radial Position (Lifecycle Maturity)**

```
r(F) = f(s)
  SCHEDULED → 1.0  (outer bark / branch tip — visible but inert)
  OPEN      → 1.0  (outer bark)
  ACTIVE    → 0.75
  HOLD      → 0.6
  CLOSED    → 0.3
  ABSORBED  → 0.0  (core)
```

Invariant across all scales. A file being edited sits at bark. A reconciled $48M payment sits at core. A meeting scheduled for next Tuesday sits at the branch tip at bark radius. Same function.

**Equation 2 — Longitudinal Position (Gravity Sink)**

```
l(F, t) = L_max − (k_g × a)
```

Where `k_g` = gravitational constant (template-defined but deterministic per branch). If milestone mode: `l(F) = L_max − (k_m × milestoneIndex)`. No randomness. No smoothing.

**Equation 3 — Lean Vector (Directional Pressure)**

Per filament pressure weight:

```
w(F) = m × (1 − c) × o × stateWeight(s)

stateWeight:
  SCHEDULED = 0.0  (inert — no force contribution, contract #124)
  OPEN      = 1.0
  ACTIVE    = 0.8
  HOLD      = 0.6
  CLOSED    = 0.2
  ABSORBED  = 0.0
```

Net lean vector for branch B:

```
W_B = Σ w(Fᵢ) × d(Fᵢ)        (vector sum)
Ŵ_B = W_B / Σ w(Fᵢ)           (normalized direction)
θ_lean = atan2(W_B.y, W_B.x)  (lean angle)
|W_B|                           (lean magnitude)
```

This works identically whether Fᵢ = files, invoices, citizen complaints, or planetary missions.

**Equation 4 — Wilt (Integrity Deficit)**

For timebox T:

```
wilt(T) = clamp(
  α × (1 − confidence_avg)
  + β × (1 − coverage_ratio)
  + γ × (unresolvedCount / N),
  0, 1
)
```

Where `coverage_ratio = verifiedInputs / requiredInputs`. Droop for branch B = aggregate wilt across consecutive low-firmness slabs.

**Equation 5 — Heat (Rate of Change)**

```
engagementRate(B, t) = Δ(Σ e(Fᵢ)) / Δt
heat(B) = normalize(engagementRate)
```

Region heat: `heat_region = Σ heat(Bᵢ)` weighted by branch mass.

**Equation 6 — Fog (Uncertainty Field)**

```
fog(R) = 1 − (Σ c(Fᵢ) / N_total)
```

Fog tile opacity = `fog(R)`. Dense fog = very low average confidence across the scope.

**Equation 7 — Storm Index**

```
storm(R) = normalize(heat(R)) × normalize(fog(R))
```

No mystery. Just multiplication. High acceleration + low confidence = danger.

**Equation 8 — Lightning Cascade**

When filament F in branch A references filaments in branches B₁…Bₙ via evidence edges:

```
cascade(F) = m(F) × uniqueTreesTouched
```

Lightning triggers if `cascade > threshold`. Flash intensity = `cascade / regionMass`.

**Equation 9 — Trunk Mass (Archive Flow)**

```
trunkMass = Σ magnitude of ABSORBED filaments
trunkRadius ∝ log(trunkMass)
```

Thickness of the trunk directly encodes how much resolved, reconciled work has flowed through the system.

**Equation 10 — Scaling Law (Aggregation, Not New Math)**

The engine is scale-invariant. Replace filament → atomic event, branch → system grouping, region → parent grouping. The equations remain unchanged. Scaling happens by aggregation only:

```
W_parent = Σ W_child
heat_parent = Σ heat_child
fog_parent = Σ fog_child
trunkMass_parent = Σ trunkMass_child
```

No new math at larger scale. Only summation.

**Scale mapping — what changes is the template, not the physics:**

| Scale | Trunk | Branch | Filament | Movement Means |
|-------|-------|--------|----------|----------------|
| File system | Root folder | Folder | File | Edit frequency + unresolved drafts |
| Company | Organization | Department | Work item | Vendor pressure + unresolved obligations |
| City | Municipality | Service branch | Case | Citizen complaint vector + budget imbalance |
| Country | State | Agency | Policy action | Trade pressure + regulation backlog |
| Planet | Civilization | Sector | Global initiative | Resource extraction + climate stress |
| Galaxy | Collective cluster | Planetary system | Interstellar event | Mission flux + civilization energy output |
| Laniakea | Supercluster | Galaxy group | Galactic event | Aggregate force fields |

The geometry never changes. The template changes. The equations remain identical. A single overdue invoice and a collapsing planetary supply chain are governed by the same equation set.

### 3.20 Orbital Model — Branches as Bodies, Perturbations as Meaning

At TREE LOD and above, a tree's branches resemble an orbital system:

- **Trunk = central body (sun).** Everything orbits around it.
- **Tier 1 branches (Finance, Ops, HR, IT) = primary planets.** Fixed layout slots (§3.18), stable orbits.
- **Tier 2 sub-branches = moons.** Orbiting their parent branch.
- **Filaments = surface activity / weather.** What happens on each body.
- **Slabs = geological time layers.** Strata within each body.
- **Archive = compressed core mass.** The dense interior.

**The orbit itself does not carry meaning. Deviation from orbit carries meaning.** Just like in celestial mechanics — planets don't mean anything; perturbations do.

**What orbital deviations mean:**

| Observation | Meaning | Source Equation |
|-------------|---------|----------------|
| Stable circular orbit (no lean, no droop) | Department is structurally healthy and balanced | Equations 3, 4 balanced |
| Elliptical drift (lean) | Net counterparty pressure pulling toward a quadrant | Equation 3: |W_B| > 0 |
| Increasing orbital thickness | Growth — more resolved flow, thicker trunk feed | Equation 9: trunkMass increasing |
| Shrinking presence | Contraction or inactivity | Equation 9: low flow, Equation 5: low heat |
| Moons clustering tightly | Highly integrated sub-processes | Sub-branch layout slots close together |
| A moon drifting far | Detached workflow, silo forming | Sub-branch lean diverging from parent lean |
| Multiple bodies leaning same direction | Systemic pressure from one quadrant | Equation 3 agreement across branches |
| Body with thick fog | Department operating blind — evidence weak | Equation 6: high fog locally |
| Lightning flash between bodies | Evidence cascade — one fact rippled across departments | Equation 8: high cascade |

**Structural drift (the second wind):**

Over time, a branch's visual weight within its layout slot changes:
- A branch absorbing massive filament volume thickens. Its trunk feed grows. It commands more visual space.
- A branch with declining activity thins. Its visual presence shrinks.
- This is NOT layout repositioning (§3.18 is stable). This is mass change within a fixed orbit — like a planet gaining or losing atmosphere.

During replay, you see branches thicken and thin over time. That is structural drift. Combined with lean (directional shift) and droop (integrity loss), the full motion profile tells you everything about that department's history without reading a single number.

**From company solar system to Laniakea:**

The fractal scaling (§22) means:
- A company tree's trunk is a branch on a city tree.
- A city tree's trunk is a branch on a country tree.
- Each level up, the same orbital model applies — bodies (sub-trunks) orbit a parent trunk.
- At each level, the equations are identical but computed from aggregated child data (Equation 10).

What you see at Laniakea scale is the same physics that governs a single branch's filaments — just aggregated across billions of trees and rendered at extreme LOD compression.

### 3.21 Content-Type Temporal Mapping — What Is l? What Is Age? What Sinks?

For tabular branches (invoices, transactions), the mapping is natural: l = calendar time, age = seconds since creation, sinking = gravity along the l axis. Tabular events are born, live, close, and sink. Simple.

For non-tabular content, this breaks. The architect identified the critical constraint: **documents are not linear over time.** A paragraph edited yesterday should not appear "archived" just because it's at the beginning of the document. Code files have lines edited in random order. Music projects have sections revisited weeks later.

**The solution: every content type has two independent time axes.**

```
l_content  = position within the content (paragraph position, line number,
             timeline position, section order)
l_time     = calendar time since creation (same as tabular l)
```

These two axes are INDEPENDENT. They cannot be collapsed into one. The template defines which axis drives each behavior:

**Per-template temporal mapping (mandatory fields):**

```
ContentTimeMapping {
  templateId: string,
  contentType: "tabular"|"document"|"code"|"media"|"spatial"|"custom",

  // What does l mean on the bark surface?
  primaryAxis: "calendar-time"|"content-position"|"version-sequence",

  // What drives gravity sinking?
  sinkAxis: "calendar-time",  // ALWAYS calendar-time (universal constant)

  // What determines "age" for twig detection?
  ageSource: "last-edit-time"|"creation-time"|"last-commit-time",

  // What defines a timebox boundary?
  timeboxBoundary: "calendar-period"|"edit-session"|"milestone"|"version-tag",

  // What triggers inward migration (bark → core)?
  inwardTrigger: "lifecycle-close"|"section-stability"|"version-freeze"|
                 "milestone-approval"|"edit-quiescence",

  // What does a cross-section ring represent?
  ringMeaning: "time-period"|"edit-burst"|"version"|"session"
}
```

**Tabular branches (invoices, transactions, tickets):**

```
primaryAxis:     calendar-time
sinkAxis:        calendar-time
ageSource:       creation-time
timeboxBoundary: calendar-period (day/week/sprint)
inwardTrigger:   lifecycle-close (CLOSED → migrate inward)
ringMeaning:     time-period
```

This is the default. l = time. Sinking = time. Everything works as already described.

**Document branches (contracts, reports, policies, wiki pages):**

```
primaryAxis:     content-position (paragraph / section order)
sinkAxis:        calendar-time
ageSource:       last-edit-time (per section)
timeboxBoundary: edit-session (a burst of edits = one timebox)
inwardTrigger:   section-stability (no edits for N sessions → migrate inward)
ringMeaning:     edit-burst (each ring = one editing session)
```

The document is ONE filament. But it has internal structure:
- Each paragraph/section has its own `l_content` position (where it appears in the document).
- Each paragraph/section also has a `lastEditTime` (when it was last touched).
- On the bark surface at CELL LOD, the user sees the document in content order (l_content).
- Gravity still sinks the FILAMENT as a whole along calendar time. The document gets older, it sinks. But internally, sections that were recently edited remain at bark radius. Sections untouched for months migrate inward within the filament's own radial depth.
- Cross-section rings show edit sessions, not calendar periods. A ring = "that Thursday afternoon when you rewrote the intro." Thick ring = many edits. Thin ring = minor tweak.

**The two-axis rendering at CELL LOD:**

```
Vertical axis (l_content):  paragraph/section order (top = beginning, bottom = end)
Radial depth (r):           edit recency per section
                            - Recently edited section = outer bark (bright, editable)
                            - Untouched-for-months section = inner ring (dimmer, stable)
Color:                      confidence (well-evidenced sections vs. draft sections)
```

A reader looking at a document branch sees: the intro is settled (inner ring, high confidence), Chapter 3 was just rewritten (outer bark, medium confidence), and the appendix is untouched since creation (deep inner, but low confidence because it was never reviewed). The SHAPE of the document's cross-section tells you its editorial maturity without reading a word.

**Code branches (source files, repositories):**

```
primaryAxis:     content-position (file path + line number)
sinkAxis:        calendar-time
ageSource:       last-commit-time (per line range / hunk)
timeboxBoundary: version-tag (each release/tag = one timebox)
inwardTrigger:   version-freeze (tagged release → freeze inward)
ringMeaning:     version (each ring = one release)
```

Code behaves like documents but with version tags as natural timebox boundaries. A function edited in the latest sprint is at bark radius. A function untouched since v1.0 is deep in the rings. Cross-section shows release history. Git blame is already this model — Relay just makes it geometric.

**Media branches (audio, video, music, animation):**

```
primaryAxis:     composition-timeline (playback position)
sinkAxis:        calendar-time
ageSource:       last-edit-time (per track / region)
timeboxBoundary: milestone (mix session, mastering pass)
inwardTrigger:   milestone-approval (mix approved → migrate inward)
ringMeaning:     session (each ring = one production session)
```

A music track's bark shows the timeline. The intro is settled (inner ring). The bridge was just re-recorded (outer bark). The master is frozen (core). Cross-section shows production sessions — the first demo, the remix, the final master.

**Spatial branches (CAD, maps, 3D models, architectural plans):**

```
primaryAxis:     content-position (spatial region / layer / component)
sinkAxis:        calendar-time
ageSource:       last-edit-time (per component / layer)
timeboxBoundary: version-tag (each revision submission)
inwardTrigger:   version-freeze (approved revision → freeze inward)
ringMeaning:     version (each ring = one design revision)
```

**The universal invariant:**

Gravity always uses `calendar-time`. The filament as a whole sinks at the same rate as every other filament. Only the `primaryAxis` (what you see on the bark at CELL LOD) and the `inwardTrigger` (what causes sections to mature inward) change per content type. The physics are universal. The interpretation of l at close zoom is content-specific.

**What a twig means per content type:**

| Content Type | Twig = |
|-------------|--------|
| Tabular | Old unresolved event (overdue invoice, open ticket) |
| Document | Section that hasn't been edited or reviewed in a long time but is still at bark radius |
| Code | Function/file untouched since ancient version but never properly tested/reviewed |
| Media | Track region that was never approved or mixed but keeps getting skipped |
| Spatial | Component never finalized in any design revision |

Twigs are always the same physics — a filament (or section) that should have migrated inward but hasn't. What "should have" means depends on the template's `inwardTrigger`.

### 3.22 Content-Type Cross-Section Mapping

Cross-section inspection (§3.13) must render differently per content type, because what a ring means changes:

| Content Type | Ring = | Thickness = | Color = | Cross-section tells you |
|-------------|--------|-------------|---------|----------------------|
| Tabular | Calendar period | Commit count | Magnitude | "Q1 was busy and high-value" |
| Document | Edit session | Edit count per session | Section coverage | "The March rewrite was massive but only touched 3 sections" |
| Code | Version/release | Lines changed | Test coverage confidence | "v2.0 was a huge refactor, v2.1 was a hotfix" |
| Media | Production session | Regions touched | Approval status | "Session 4 re-did the bridge and chorus" |
| Spatial | Design revision | Components modified | Review status | "Rev C changed the foundation and HVAC" |

**Drill-down from ring to content:**

When the user expands a ring in cross-section mode (Phase III, §3.13):
- **Tabular:** Shows filament rows that were active in that period — the standard view.
- **Document:** Shows which paragraphs/sections were edited in that session — highlighted in the document's content-position layout.
- **Code:** Shows which files/functions were changed in that version — a blame-style diff view.
- **Media:** Shows which timeline regions were touched in that session — waveform/timeline with highlighted regions.
- **Spatial:** Shows which components were modified in that revision — 3D/2D view with highlighted parts.

The renderer adapts. The physics don't.

---

## 4. The Filament — Row-Level Atomic Event

> *"The universe is made of stories, not of atoms."* — Muriel Rukeyser

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

### 4.1.1 The Row Structure — Left Block and Right Block

Every filament row is divided into two blocks:

**Left Block — Identity Block (stable):**
- Object identity (filamentId, objectType, objectId)
- Counterparty reference
- Branch schema ID and template version
- Base metadata (spawnedAt, branchId, approachAngle)

The left block is the answer to "WHAT is this thing?" It is set at creation and does not change. If the identity itself changes, that is a migration commit to a different branch (§4.6), not a mutation of the left block.

**Right Block — Timeline Block (unbounded):**
- Commit history (append-only sequence of all changes)
- Evidence references (accumulating attestation chain)
- Revision deltas (what changed in each commit)
- Lifecycle state transitions (SCHEDULED → OPEN → ACTIVE → HOLD → CLOSED → ABSORBED)
- Magnitude updates (value changes over time)

The right block is the answer to "WHAT HAPPENED to this thing?" It grows without bound. Every edit, every match, every piece of evidence, every state transition appends to the right block. Nothing is overwritten. The right block IS the radial depth visible in §3.2.1 — each commit adds a layer going inward.

**Schema versioning vs branch splitting:**

- If the same kind of thing gains a new field (e.g., invoices now track "payment method"): **schema version bump** on the same branch. Existing filaments don't retroactively gain the field — only new filaments created after the version bump have it. The branch remains coherent because all filaments share the same base schema lineage.

- If the thing is actually a different kind of thing (e.g., what was called "invoices" splits into "domestic invoices" and "cross-border invoices" with fundamentally different schemas): **branch split + migration commit** (§4.6). The new branch gets its own schema. Provenance links from the original filaments to the migrated ones are permanent.

The rule: **columns changing = schema version bump. Category changing = branch migration.**

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
    "lifecycleState": "SCHEDULED|OPEN|ACTIVE|HOLD|CLOSED|ABSORBED",
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

**Scar geometry in cross-section (§3.13):** When viewed in cross-section mode, a scar appears as a radial crack — a line extending from the slab where the revert occurred outward toward the bark and slightly inward toward older rings. The crack does not erase rings or delete data. It becomes part of the structure — permanently visible stress history, exactly like a crack in real wood. A minor data correction creates a hairline crack. A major governance revert creates a visible fissure that slightly warps adjacent slab surfaces (geometric deformation proportional to scar severity). Multiple scars in the same angular sector create a fracture zone visible at BRANCH LOD.

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

### 4.7 Filament Identity and Composition Rules

**Canonical identity:** One row = one filament. The key is `filamentId` (unique), anchored to `objectType + objectId + branchId`. A filament is not a cell, a column, or a sheet. It is the full row. Cell-level history is a filtered view of the row's commit history.

**Business objects are compositions, not single filaments.** A purchase order line item that touches four sheets (RequisitionLines, POLines, GRLines, InvoiceLines) is four filaments — one per fact sheet row. The match row that joins them is a fifth filament. The summary cell aggregating the match is a sixth. These are linked by backing refs (join keys and formula references), not by shared identity.

**Filaments never split.** One cell = one filament = one history. If a cell edit fans out into downstream corrections (a fact change triggers match rebuild triggers summary recalculation), those are separate filaments reacting to the same event. The causal chain is preserved through timebox events and backing refs, not through filament forking.

**Filaments never merge.** If two filaments contribute to the same timebox commit, each has its own commit entry in the global chain. The timebox Merkle tree includes both. Traceability is preserved because each filament's commit has a unique `globalCommitIndex` and `prevSheetHash`. The inclusion proof traces any individual contribution within the timebox.

**The composition pattern is fractal:** a department is a set of sheets, a sheet is a set of rows, a row is a filament. No new schema required at any level. Business objects (invoices, requisitions, work orders) are sets of filaments linked by backing refs. Metrics (KPIs) are formulas reading filament values through the summary chain. The tree shape reflects the aggregate — the relationships are embodied in the structure, not drawn as separate connectors.

**Filament-to-truth-packet mapping:** Many-to-many via backing refs. A TransferPacket references the filament IDs (cells) that produced its values. A filament can contribute to multiple packets. The mapping is stable because both sides are keyed to concrete cell IDs with concrete commit indices in the global chain.

---

## 5. Notes — The Unified Ephemeral Layer

> *"The journey of a thousand miles begins with a single step."* — Lao Tzu

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

## 5b. Scheduling — The Branch Tip Is the Future

> *"The best way to predict the future is to invent it."* — Alan Kay

Everything described so far sinks with time. Gravity pulls the past downward along the l axis. But life doesn't only look backward. Companies schedule meetings. Cities plan events. People set alarms. The tree must show the future as naturally as it shows the past.

The answer is already in the geometry: the branch tip IS the future.

### 5b.1 How Scheduling Works on the Tree

The l axis runs from trunk junction (deep past) to branch tip (present/future). Current time sits at a specific position on l. Everything below it has already happened and is sinking. Everything above it hasn't happened yet.

A **scheduled event** is a filament that exists at a future l position on the bark. It sits above the current time marker, at the branch tip or beyond it. It is visible. It is waiting.

```
ScheduledFilament {
  filamentId: string,
  branchId: string,
  scheduledAt: ISO-8601,          // when it will happen
  scheduledEndAt: ISO-8601|null,  // when it will end (for duration events)
  lPosition: number,              // computed from scheduledAt → future l
  lifecycleState: SCHEDULED,      // special pre-OPEN state
  ...standard six domains...
}
```

**Lifecycle for scheduled events:**

```
SCHEDULED → OPEN → ACTIVE → HOLD → CLOSED → ABSORBED
```

`SCHEDULED` is the pre-birth state. The filament exists on the bark at a future l position, but it has not started yet. It has no commits, no evidence, no confidence. It is a commitment to do something at a future time.

**When the scheduled time arrives:**
- The filament transitions automatically from `SCHEDULED` to `OPEN`.
- It is now a real, active filament — just like any other.
- Evidence begins attaching (meeting notes, recordings, decisions, attendance).
- Confidence starts computing.
- Gravity begins pulling it downward as time passes.

**If the scheduled time passes and nothing happens:**
- The filament transitions to `OPEN` but receives no commits.
- It immediately begins sinking with gravity, still at bark radius (never closed, never migrated inward).
- It becomes a twig — a scheduled event that nobody showed up to. Visible. Accountable.
- The no-show is itself informative geometry.

### 5b.2 Meetings on the Tree

A meeting is a scheduled filament on the appropriate branch. The company's weekly finance sync is a filament on the `finance` branch scheduled for every Monday at 10:00.

**Before the meeting:** The filament sits at the branch tip, visible at BARK LOD. It shows: time, participants (counterparty refs), agenda items (as Note attachments). Looking at the branch tip = looking at your calendar. Multiple meetings scheduled this week = multiple filaments clustered at the tip, stacked by time.

**During the meeting:** The filament transitions to `OPEN`. If video presence is active (AR interaction modules), the meeting recording attaches as evidence. Voice transcription (§47) creates a real-time commit log. Each decision becomes a commit. Each action item spawns a child filament (new work item scheduled for a future date).

**After the meeting:** The filament `CLOSES` when the meeting ends. It migrates inward based on evidence quality — a well-documented meeting with clear decisions and follow-up actions has high confidence and migrates quickly. A vague meeting with no notes stays near the bark longer. The meeting sinks with gravity over the following days and weeks, joining the historical record.

**Recurring meetings:** Each occurrence is a separate filament, linked by a `recurringSeriesId`. The series itself is a template-level rule, not a filament. Each instance lives independently — one bad Monday sync doesn't affect next Monday's confidence.

### 5b.3 Venues and Events

A company hosting a conference, a city organizing a festival, a neighborhood planning a block party — these are all scheduled events on the appropriate tree.

**Event as a temporary branch:**

Large events (conferences, festivals, multi-day events) spawn a temporary event branch on the tree:
- The branch appears at the scheduled time, positioned by `layoutKey` (§3.18).
- Sub-events (talks, sessions, workshops) are filaments on this branch, each scheduled at their specific time.
- As the event progresses, sub-event filaments transition from `SCHEDULED` to `OPEN` to `CLOSED`.
- After the event ends, the branch's filaments migrate inward and archive normally.
- The event branch itself remains as permanent history — you can always cross-section it to see what happened at the conference.

**Venue as a persistent branch:**

A venue (office, meeting room, stadium, park) can be a persistent branch on a tree. Scheduled events at that venue are filaments on the venue branch. The venue's history shows: which events happened there, how well-attended they were (engagement), how productive (evidence quality), and how the venue was used over time (cross-section reveals patterns).

### 5b.4 The Tree as Alarm Clock

The branch tip is your calendar. Looking at the tip of any branch shows you what's coming:

**Visual scheduling cues:**
- Scheduled filaments render with a distinct appearance: translucent outline (not solid — they haven't happened yet), with a subtle pulse or glow as their scheduled time approaches.
- The closer to "now," the more solid they become. A meeting 5 minutes away is nearly opaque. A meeting next month is a faint outline.
- When a scheduled filament's time arrives, it "solidifies" — transitioning from translucent to full opacity as it becomes OPEN.

**Notification triggers:**
- When a scheduled filament crosses the time threshold (its `scheduledAt` intersects the current time), the system emits a notification.
- Notification behavior is template-defined: some events trigger 15 minutes before (meetings), some trigger a day before (deadlines), some trigger a week before (quarterly reviews).
- The notification is not a separate system. It is the filament arriving at the present moment on the l axis. The tree IS the alarm clock.

**What the manager sees Monday morning:**

They open Relay, fly to their company tree. At the tip of each branch, they see this week's scheduled events — translucent filaments waiting to happen. The Finance branch tip shows Monday's sync, Wednesday's board prep, and Friday's close. The HR branch tip shows Tuesday's interviews and Thursday's all-hands. The Invoices branch tip shows nothing scheduled — which itself is informative (no payment runs planned = potential gap).

They don't open a calendar app. They look at the tree tips.

### 5b.5 How Scheduling Interacts with Physics

**Scheduled filaments DO NOT sink.** They are anchored at their future l position until their time arrives. Gravity does not pull them — they haven't happened yet. Only after transitioning to `OPEN` do they become subject to gravity.

**Scheduled filaments DO NOT affect branch lean, wilt, heat, or weather.** They are commitments, not evidence. They carry no confidence (nothing has been proven). They carry no magnitude weight for wind computation. They are visible but physically inert until they activate.

**Scheduled filaments CAN be cancelled.** Cancellation creates a scar-like commit: the filament transitions to a `CANCELLED` state (not deleted — append-only). It fades from the tip but remains in the commit history. A pattern of cancelled meetings is visible in cross-section — it shows as a cluster of cancelled-state filaments at bark radius, never having migrated inward. That pattern tells you something about the organization.

**Scheduled filaments respect templates.** A template defines: which branch types support scheduling, what notification rules apply, what mandatory fields a scheduled event must carry (participants, agenda, duration, venue), and what evidence is expected when the event activates. A well-designed template makes scheduling structured, not freeform.

### 5b.6 Cross-Section View of Scheduled Events

In cross-section mode (§3.13), scheduled events appear at the outermost edge of the branch — beyond the current bark surface. They are the "growth buds" at the branch tip. The cross-section shows:

- **Inner rings** = past timeboxes (archived, compressed)
- **Current ring** = active timebox (live work)
- **Outer edge** = scheduled future events (translucent, not yet real)

This is biologically consistent: a real tree's growth buds are at the tips. Relay's scheduled events are at the branch tips. The tree grows toward its commitments.

---

## 6. Projection Branches — Visible Data Pipelines

> *"The eye sees only what the mind is prepared to comprehend."* — Robertson Davies

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

> *"Everyone you will ever meet knows something you don't."* — Bill Nye

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

**Vote anonymity is template-configurable.** Relay supports both transparent and anonymous voting, depending on what is being decided. The frozen boundary is:

> **Eligibility + uniqueness are always provable; vote choice secrecy is template-defined by vote class.**

Every vote commit is Merkle-sealed. The system always knows: this voter existed, was eligible, and voted exactly once. That is never anonymous. What can be anonymous is the *choice* — how you voted.

**Vote classes (minimum taxonomy):**

| Class | Choice Visibility | Examples | Rationale |
|-------|------------------|----------|-----------|
| **Private-by-default** | Encrypted choice payload; blinded aggregation | Ideology, preference, cultural questions, social opinion, belief | Protects principled dissent from social retaliation |
| **Public-by-default** | Fully visible responsibility record on voter's user tree | Spending public money, delegating authority, certifying evidence, governance parameter changes, sanctions, anything that creates obligations for others | Accountability for decisions that bind others |

- Templates define which vote class applies. The community can override the default visibility for specific vote types via parametric governance.
- A vote class cannot be forced from public to private if the vote creates obligations for others — that boundary is frozen.
- A vote class cannot be forced from private to public for pure opinion/belief votes — that boundary is also frozen.
- The existence of both modes is a frozen architectural feature. Neither mode can be removed.

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

> *"Knowing yourself is the beginning of all wisdom."* — Aristotle

**Prerequisites:** None for base (responsibility mirror, CV through shape, privacy tiers). Expands with: AR interaction modules → achievement records, capability state. Spell/combat modules → spell library, quest log, combat record.

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

In the truth and governance layers, there are no reputation scores, star ratings, or badges. Your tree's SHAPE is your reputation:

- Healthy tree: firm slabs, few twigs, high opacity, filaments closing regularly
- Unhealthy tree: many twigs, wilted slabs, low opacity, filaments stuck at bark

Nobody assigns reputation. The tree shows it through physics. (The arena layer has domain-scoped numeric metrics like ArenaRep for matchmaking — these are entertainment metrics, not governance reputation. See §68.10, §71.2.)

### 8.5 Privacy

Visibility follows tiered consent:

- **Tier 0** (default): Anonymous dot. Nobody sees your tree.
- **Tier 1**: Role badge. People see branch shapes but not individual filaments.
- **Tier 2**: Named identity with detail. Authorized parties see individual responsibility filaments.

Escalation requires YOUR explicit consent per context.

### 8.6 Contextual Presence Profiles — Choose Your Face

You are one person. You have one tree. But you do not broadcast the same face everywhere.

When you walk into a study hall, a dance party, a duel arena, a job interview, a courtroom, or a friend's living room, you present different aspects of yourself. In the physical world, this is natural — you dress differently, speak differently, emphasize different things about yourself. In Relay, the same principle applies to your tree.

**A contextual presence profile is a filter over your own tree that controls which branches, which tiers, and which summary information you broadcast to others in a given context.**

```
PresenceProfile {
  profileId:          string,
  userId:             string,
  profileName:        string (e.g., "Professional", "Gaming", "Social", "Academic"),
  context:            enum { MANUAL, AUTO_BY_BRANCH, AUTO_BY_PROXIMITY } | branchRef,
  visibleBranches:    branchRef[] (which of YOUR branches others can see),
  hiddenBranches:     branchRef[] (which branches are suppressed in this profile),
  disclosureTierOverride: {
    default:          number (0, 1, or 2 — applies to branches not explicitly listed),
    perBranch:        Map<branchRef, number> (per-branch disclosure override)
  },
  summaryFields: {
    showCertifications: boolean,
    showArenaRep:       boolean,
    showWorkHistory:    boolean,
    showEducation:      boolean,
    showSocialBranch:   boolean,
    showGameLayer:      boolean,
    customBio:          string | null (short text shown in presence marker)
  },
  activeConditions: {
    activateOnBranch:   branchRef[] | null (auto-switch when entering these branches),
    activateOnProximity: proximityZoneRef[] | null (auto-switch when in these physical zones),
    activateManually:   boolean (user explicitly selects this profile)
  }
}
```

**How it works:**

| Context | Profile | What Others See | What's Hidden |
|---------|---------|----------------|--------------|
| **Job interview** | Professional | Work branches, certifications (§58.12), accounting skills, project history | Gaming branch, social branch, arena record |
| **Dance party** | Social | Performance branch, arena social stats, crowd faction history, Visual Burst count | Work branches, financial branches, education details |
| **Duel arena** | Gaming | Arena branch, combat loadout, spell catalog, win/loss record, element affinity | Work history, personal branches, family tree |
| **Study hall** | Academic | Education branch (§58), learning path progress, demonstrated modules, teacher reviews | Arena branch, social branch, work branches |
| **Courthouse** | Legal | Relevant evidence branches, certifications, civic participation history | Everything else — minimum disclosure, maximum focus |
| **Default** | Minimal | Tier 0 — anonymous dot, no tree visible | Everything |

**The critical rules:**

1. **You control the filter, not the data.** Your tree does not change. Your filaments do not move. Your history is not rewritten. The profile only controls what OTHER USERS see when they look at your presence marker in a given context. It is a lens over your tree, not a modification of it.

2. **Public filaments on shared trees are always findable.** If you approved an invoice on a company tree, that filament exists on the company tree regardless of your presence profile. Someone browsing the company tree will see your name on that filament (at whatever disclosure tier you committed it). Your presence profile does not hide your public acts — it only controls what people see when they look at YOUR tree directly.

3. **Profile switching is a committed event.** When you change profiles, the switch is recorded as a filament on your personal attention branch. This prevents abuse: if someone claims they "weren't showing their gaming profile" during a professional meeting, the log shows which profile was active and when. Profile history is private (Tier 0 by default) but available for self-review.

4. **Auto-switching by context.** Profiles can activate automatically when you enter a specific branch context or proximity zone. Walking into a university proximity zone auto-switches to Academic. Entering an arena branch auto-switches to Gaming. You can override any auto-switch manually. Auto-switch preferences are stored on your user tree as preference filaments.

5. **Multiple profiles are unlimited.** You can create as many profiles as you want. A teacher might have: Professional (for school), Academic (for conferences), Social (for community events), Minimal (for anonymous browsing). A gamer might have: Gaming (for arenas), Streaming (for public performances with maximum disclosure), Incognito (Tier 0 for exploration).

6. **The tree shape is always honest.** Even in a minimal profile, the SHAPE of your tree (if visible at Tier 1+) is truthful. You cannot fake thick branches you do not have. You cannot hide scars that are publicly committed. You can choose not to show your gaming branch — but if someone navigates to a public arena you participated in, your participation filament is there. The profile controls the front door of your tree. The public record exists regardless.

**Contract #166 — Users control which branches and disclosure tiers are broadcast through contextual presence profiles. Profiles are filters over the tree, never modifications of it. Public filaments on shared trees remain findable regardless of the user's active profile. Profile switching is a committed event on the user's attention branch. Profiles can auto-activate by branch context or proximity zone. The tree shape at any visible disclosure tier is always truthful — profiles suppress visibility of specific branches but cannot fabricate branches that do not exist or hide scars on publicly committed filaments.**

---

## 9. Confidence Physics — Automatic Evidence Ratio

> *"Trust, but verify."* — Russian proverb, popularized by Ronald Reagan

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

> *"The price of greatness is responsibility."* — Winston Churchill

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

> *"Democracy is the worst form of government, except for all the others."* — Winston Churchill

Every setting in Relay — how long a note lasts before it fades, how many votes it takes to change a rule, how quickly old votes lose their weight — is decided by the community, not by an administrator. You vote on the number you think is right. Everyone else does too. The system takes the middle value. No single person controls any setting. If the community collectively decides that notes should last 30 minutes instead of 15, the system adjusts. If they change their minds next month, it adjusts again. This is how Relay governs itself — continuously, transparently, and without elections.

**Prerequisites:** None for base (operational parameters: TTL, thresholds, decay, cadence). Expands with: founder key activation → monster economy parameters (spawn rate, reward magnitude, difficulty curve) as global governed values.

Every operational parameter in Relay is a continuously votable, weighted, settling value. Nothing is hardcoded except the frozen contracts themselves. For decisions involving a list of options (candidacy, curriculum, template additions), a meta-voting layer (§72 Layered Option Governance) first determines what the options should be before the substantive vote occurs.

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
| Game layer global activation | Enable the game/combat/spell modules globally | #48, §42 |
| AR layer global activation | Enable the detection/AR modules globally | §42 |
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

> *"We don't see things as they are, we see them as we are."* — Anaïs Nin

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

> *"If you want to go fast, go alone. If you want to go far, go together."* — African proverb

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

> *"Time is what we want most, but what we use worst."* — William Penn

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

> *"Those who cannot remember the past are condemned to repeat it."* — George Santayana

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

> *"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes."* — Marcel Proust

**Prerequisites:** None for base (proposes commits, builds projections). Expands with: AR interaction modules → manages AR overlay, interprets gestures/light/objects, validates achievements, acts as personal trained assistant. Spell/combat modules → validates spells, generates monsters, serves as summoned combat agent in duels.

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

### 16.6 AI Code Contribution Governance — Frozen Contract #137

**Prerequisites:** None. Required from day one for all code-modifying AI commits.

When a human hires a contractor to write code, the manager doesn't read every line — they check the work: Did you write tests? Did you break anything? Is this mostly real logic or mostly boilerplate? That's how Relay governs AI. Every time an AI writes code, the system automatically generates a "work receipt" — like a nutrition label for the code — showing what percentage is real problem-solving, what percentage is error handling, what percentage is copy-paste, and whether the AI actually tested its own work. If the receipt looks unhealthy (too much padding, no tests, fake complexity), the code gets rejected before any human has to read it. If it looks healthy, the manager reviews the receipt first, then the code — saving hours of line-by-line inspection.

This receipt is called an **AICodeContributionPacket**. It is deterministic (same code always produces the same receipt), auditable (anyone can verify it), and anti-gaming (the system detects padding, fake tests, and hollow complexity). The packet attaches to the AI's filament commit like any other evidence attachment — visible in cross-section, subject to confidence scoring, and permanent.

#### §16.6.1 — LOC Definition (anti-padding)

Raw line count is gameable. Relay counts diff-based LOC only:

| Field | Definition |
|-------|-----------|
| `linesAdded` | Non-empty, non-whitespace lines added (after formatter) |
| `linesRemoved` | Non-empty, non-whitespace lines removed |
| `linesModified` | Lines changed in-place (edit distance > 0) |
| `netDelta` | `linesAdded - linesRemoved` (can be negative for refactors) |
| `filesCreated` | New files |
| `filesModified` | Existing files changed |
| `filesDeleted` | Files removed |
| `filesTouched` | `created + modified + deleted` |

**Exclusions** (tracked but not counted toward `locCounted`):

- Blank lines
- Brace-only lines (containing only `{`, `}`, `);`, or similar structural closers)
- Auto-generated headers / license blocks (detected by marker comment)
- Pure import/require statements (tracked separately as `importLines`)

**`locCounted`** = `linesAdded` after all exclusions and formatting normalization. This is the denominator for all percentage calculations.

Formatting normalization: if a project formatter is configured (Prettier, Black, clang-format), the diff is computed after formatting. This prevents inflation via whitespace/style changes.

#### §16.6.2 — Line Type Classification (language-aware, deterministic precedence)

Every counted line is assigned exactly one type. When a line matches multiple categories, the highest-precedence type wins.

**Precedence chain** (highest → lowest):

```
TEST > DEBUG > GUARD > LOGIC > RENDER > STATE > WIRING > DECLARATION > SCAFFOLD > COMMENT
```

| Type | Definition | JS/TS Examples |
|------|-----------|----------------|
| TEST | Assertions, test framework blocks, expect/assert calls | `console.assert()`, `describe()`, `it()`, `expect()` |
| DEBUG | Temporary logging, dev-only instrumentation, debugger statements | `console.log()`, `console.warn()` (non-assert), `debugger` |
| GUARD | Validation, early returns, null/NaN/undefined checks, try/catch wrappers | `if (!x) return;`, `Number.isFinite()`, `try {`, `catch (e) {` |
| LOGIC | Conditionals, loops, math, algorithms, transformations, business rules | `if (balance < threshold)`, `for (const x of items)`, arithmetic |
| RENDER | DOM writes, UI output, HUD updates, visual feedback, CSS-in-JS | `el.textContent = ...`, `classList.toggle()`, `setAttribute()` |
| STATE | Variable assignments, cache mutations, flag toggling | `currentMode = mode;`, `counter++` |
| WIRING | Event listeners, API calls, import/export, glue code, hook registration | `addEventListener()`, `export function`, `fetch()` |
| DECLARATION | Constants, config objects, enums, schema definitions, type annotations | `const X = 5;`, object literal definitions, TypeScript interfaces |
| SCAFFOLD | Function/class signatures, empty stubs, structural shells, module boilerplate | `function foo() {`, `class Bar {`, empty method bodies |
| COMMENT | Inline comments, JSDoc, documentation annotations | `// explanation`, `/** @param */` |

**Classification method**: AST-based parsing is required for supported languages. For JS/TS: use an ESTree-compatible parser (Acorn, Babel, or equivalent). Each AST node maps to a line type via deterministic rules:

- `TryStatement` opener → GUARD
- `CatchClause` opener → GUARD
- `IfStatement` with `ReturnStatement` and no else → GUARD (early return pattern)
- `IfStatement` with else or complex body → LOGIC
- `CallExpression` to `console.assert` → TEST
- `CallExpression` to `console.log/warn/error` (non-assert) → DEBUG
- `VariableDeclaration` at module scope → DECLARATION
- `VariableDeclaration` inside function body → STATE
- `FunctionDeclaration`/`ArrowFunctionExpression` signature line → SCAFFOLD
- `ExportNamedDeclaration` → WIRING (the export keyword line)

**For non-parseable files** (binary, config, markup without AST support): `lineProfile = null` and a confidence penalty of −0.15 applies. Unknown is never a free pass.

#### §16.6.3 — Semantic Profile (substance metrics)

Line classification alone is insufficient. An AI can write 200 lines that parse as LOGIC but add zero decision points. Semantic metrics measure structural substance:

| Field | Definition |
|-------|-----------|
| `cyclomaticComplexityDelta` | Net change in decision points (`if`, `else if`, `for`, `while`, `do`, `catch`, `case`, `? :`, `&&`, `\|\|`) |
| `functionCountDelta` | Net new/removed functions |
| `branchConditionDelta` | Net change in conditional branches |
| `exportsAdded` / `exportsRemoved` / `exportsModified` | Public API surface delta |
| `importsAdded` / `importsRemoved` | External dependency delta |
| `internalImportsAdded` | New cross-module references within project |
| `maxNestingDepth` | Deepest indentation level in new code |
| `avgFunctionLength` | Mean lines per new/modified function |
| `longestFunction` | Longest single function in contribution |
| `renamedSymbols` | Variable/function renames detected |
| `movedBlocks` | Code relocated between files (similarity-based detection) |
| `duplicateBlocksIntroduced` | Near-identical blocks added (copy-paste detection) |

**Cyclomatic complexity counting rules** (for JS/TS, AST-based): count each `IfStatement`, `ConditionalExpression` (ternary), `ForStatement`, `ForInStatement`, `ForOfStatement`, `WhileStatement`, `DoWhileStatement`, `CatchClause`, `SwitchCase` (each case), `LogicalExpression` where operator is `&&` or `||`. Base complexity per function is 1.

**Anti-gaming signal**: If `locCounted` is high but `cyclomaticComplexityDelta` is near zero, the contribution is structurally hollow — mostly declarations, scaffolding, or copy-paste. This results in a cold filament (low heat).

#### §16.6.4 — Quality Profile (safety and verification)

| Field | Definition |
|-------|-----------|
| `testLineShare` | `test LOC / locCounted` |
| `testAssertionCount` | Number of assert/expect calls in contribution |
| `testFileModified` | Did the AI touch any test file? |
| `lintErrorsIntroduced` | New lint violations in modified files |
| `lintErrorsFixed` | Pre-existing violations resolved |
| `lintClean` | Zero errors after contribution |
| `typecheckPass` | Static type checker passes (if applicable) |
| `guardDensity` | `guard lines / locCounted` |
| `tryCatchBlocks` | Error boundaries added |
| `nullChecks` | null/undefined/NaN guards |
| `unsafeCallsIntroduced` | `eval`, `innerHTML`, `dangerouslySetInnerHTML`, `exec`, destructive filesystem calls |
| `hardcodedSecrets` | String patterns matching key/token/password heuristics |
| `todoMarkersLeft` | `TODO`/`FIXME`/`HACK`/`XXX` in new code |

**Execution proof hooks** (prevents fake tests):

| Field | Values |
|-------|--------|
| `testRunStatus` | `PASS` / `FAIL` / `SKIPPED` / `UNAVAILABLE` |
| `lintRunStatus` | `PASS` / `FAIL` / `SKIPPED` / `UNAVAILABLE` |
| `typecheckRunStatus` | `PASS` / `FAIL` / `SKIPPED` / `UNAVAILABLE` |
| `proofArtifactRefs` | Array of content hashes (stdout hash, JUnit XML hash, lint report hash) |

If any `*RunStatus` is `UNAVAILABLE`, `confidenceScore` is capped at 0.55 unless `taskClassDeclared` is `SPIKE`.

**Confidence formula** (structure is frozen, targets are template-configurable):

```
confidenceScore = (0.40 × min(testLineShare / targetTestShare, 1.0))
                + (0.25 × min(guardDensity / targetGuardDensity, 1.0))
                + (0.20 × (lintClean ? 1.0 : 0.5))
                + (0.15 × (typecheckPass ? 1.0 : 0.0))
```

The weights `{test: 0.40, guard: 0.25, lint: 0.20, typecheck: 0.15}` and the arithmetic structure are frozen. Only the `target*` values are configurable per template (§21). No template may replace the formula itself.

#### §16.6.5 — Task Class Profiles (explicit declaration, no inference)

Every AI code contribution has a `taskClassDeclared` set by the human request (ticket, filament template, or explicit instruction). AI may propose `taskClassSuggested` but the declared class is authoritative for all gates.

**If `taskClassDeclared` is missing → REFUSAL (`TASK_CLASS_MISSING`).** The contribution stays in DRAFT. The AI cannot silently infer task class to bypass governance.

Healthy percentage bands per task class:

| Type | FEATURE | BUGFIX | REFACTOR | SPIKE |
|------|---------|--------|----------|-------|
| logic | 20–45% | 10–40% | 5–30% | 10–50% |
| guard | 8–20% | 15–35% | 5–15% | 0–15% |
| test | 5–30% | 10–40% | 10–35% | 0–10% |
| scaffold | 0–15% | 0–5% | 0–10% | 0–30% |
| debug | 0–5% | 0–3% | 0–2% | 0–20% |
| comment | 0–8% | 0–10% | 0–5% | 0–15% |
| minConfidence | 0.60 | 0.75 | 0.70 | 0.30 |
| netDeltaSign | positive | any | negative or zero | any |

Additional REFACTOR rule: `renamedSymbols + movedBlocks >= 1` (must actually restructure, not just rewrite).

Additional SPIKE rule: `autoExpireDays = 14`. Spike code auto-flags as twig if not promoted to FEATURE/BUGFIX within expiry. Templates may override this value.

Templates (§21) may define task-class-specific overrides for their domain. A manufacturing template might tighten BUGFIX guard minimums; a creative/media template might loosen SPIKE scaffold limits.

#### §16.6.6 — Lifecycle Integration

AI code contributions flow through the existing governance lifecycle (§19) with additional gates:

```
AI produces code
       │
       ▼
AICodeContributionPacket generated (automatic, deterministic)
       │
       ▼
┌─ DRAFT ──────────────────────────────────────────────────┐
│  lineProfile computed (AST-based)                        │
│  semanticProfile computed                                │
│  qualityProfile computed (with execution proof if avail) │
│  taskClassDeclared checked (REFUSAL if missing)          │
└──────────────────────────────────────────────────────────┘
       │
       ▼
Profile vs taskClassProfile band check
       │
  ┌────┴────┐
  │         │
PASS      FAIL → Scar with reason code:
  │               PROFILE_GAMING (bands violated)
  ▼               NO_TESTS (testLineShare below minimum)
PROPOSED          EXCESSIVE_SCAFFOLD (scaffold % above band)
  │               EXCESSIVE_DEBUG (debug % above band)
  ▼               LOW_CONFIDENCE (below minConfidence)
Human reviews     HOLLOW_COMPLEXITY (high LOC, near-zero complexity delta)
distribution      UNSAFE_CALLS (unsafeCallsIntroduced > 0)
first, then       DUPLICATE_BLOCKS (duplicateBlocksIntroduced > 0)
code              TASK_CLASS_MISSING (no declared class)
  │
  ▼
COMMIT gate:
  testLineShare >= task minimum
  lintClean = true
  confidenceScore >= minConfidence
  No UNAVAILABLE execution proofs (unless SPIKE)
  │
  ▼
ABSORBED (sinks inward with time)
```

Rejected contributions leave a scar with the reason code permanently visible in cross-section.

#### §16.6.7 — Visual Encoding on Tree

| Tree Property | Source | Rule |
|---------------|--------|------|
| Filament heat | `cyclomaticComplexityDelta / locCounted` | High semantic density = hot. High LOC with low complexity = cold. |
| Filament confidence | `qualityProfile.confidenceScore` | Composite of tests + guards + lint + typecheck (§16.6.4 formula). |
| Ring thickness | `locSpec.netDelta` per timebox | Net code change, not gross. Refactors that delete show thin rings. |
| Twig | `taskClass === SPIKE && age > autoExpireDays` | Unresolved spikes protrude as twigs. |
| Scar | Rejected contribution | Reason code preserved. Visible in cross-section forever. |
| Fog | `testLineShare < taskMinimum` | Untested code emits fog on the branch surface. |
| Wilt | `lineProfile.pct.debug > taskMax` | Excess debug artifacts signal structural decay. |
| Branch lean | Cumulative confidence deficit | Branch leans toward the AI counterparty if confidence stays low. |

**Contract #137 — Any code-modifying AI commit must include AICodeContributionPacket. COMMIT gate uses `taskClassDeclared` + `qualityProfile` minimums. The confidence formula structure is frozen; only targets are template-configurable. Task class must be explicitly declared by the human, never silently inferred by the AI.**

---

## 17. Presence System — The Attention Sensor Network

> *"Attention is the rarest and purest form of generosity."* — Simone Weil

**Prerequisites:** None for base (attention sensor network, presence markers, birds/flocks). Expands with: AR interaction modules → video presence within user sphere (§39), camera feed, shared AR view, arena presence.

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

> *"For the things we have to learn before we can do them, we learn by doing them."* — Aristotle

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

> *"The measure of a man is what he does with power."* — Plato

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

### 19.2 Commit Gates

Each phase has pass/fail criteria, proof artifacts, and refusal conditions. Quorum gate (30-75% depending on cadence), Approval gate (60-75%), Reconciliation gate (7-30 days), Sunset gate (90-day expiry).

**AI Code Gate (Contract #137):** For code-modifying AI commits, an additional gate applies between DRAFT and PROPOSED. The AICodeContributionPacket (§16.6) must pass task-class band checks and quality minimums before the contribution can be proposed for human review. See §16.6.6 for the full lifecycle flow.

### 19.3 Work Zones

Scope-based access: `zone.<entity>.<dept>.<project>`. Boundary commits define scope. Crossing boundaries requires explicit disclosure + consent.

---

## 20. Cryptographic Architecture

> *"Three may keep a secret, if two of them are dead."* — Benjamin Franklin

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

> *"Give me a lever long enough and a fulcrum on which to place it, and I shall move the world."* — Archimedes

**Prerequisites:** None for base (domain configuration, attribute bindings, color system). Expands with: spell/combat modules → genre overlay templates (§40.3) for gamification rendering (Sci-Fi, Fantasy, Horror, Military, Adventure). §76 (Civilization Template Library) defines the full set of seed templates covering every domain of civilization — person, family, property, healthcare, agriculture, infrastructure, commerce, estate, emergency, utilities, finance, culture, sports, and marriage/partnership.

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
- **AI task-class profile overrides**: Templates may tighten or loosen the task-class band thresholds and confidence targets defined in §16.6.5 for their domain. A manufacturing template might require higher guard density for BUGFIX; a creative template might permit higher scaffold for SPIKE. The confidence formula structure itself is frozen (contract #137) — only the target values are configurable.

### 21.2 Template Schema

```json
{
  "TreeTemplate": {
    "templateId": "template.<domain>.<variant>",
    "name": "string",
    "domain": "string",
    "sinkingMode": "earth-time|milestone|none",
    "twistPeriod": "day|week|sprint|quarter|custom",
    "barkRenderMode": "tabular|document|code|media|gallery|custom",
    "lAxisMapping": "calendar-time|content-position|version-sequence|composition-timeline",
    "cellLODRenderer": "spreadsheet|text-scroll|syntax-highlight|waveform|viewport",
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

### 21.2.1 Example Template — Manufacturing Operations

```json
{
  "TreeTemplate": {
    "templateId": "template.manufacturing.operations.v1",
    "name": "Manufacturing Operations (Mass Balance)",
    "domain": "manufacturing",
    "sinkingMode": "earth-time",
    "twistPeriod": "week",
    "barkRenderMode": "tabular",
    "lAxisMapping": "calendar-time",
    "cellLODRenderer": "spreadsheet",
    "branches": [
      {
        "id": "raw-materials",
        "name": "Raw Materials",
        "filamentSchema": {
          "columns": [
            { "name": "materialId", "domain": "identity", "type": "string" },
            { "name": "supplier", "domain": "counterparty", "type": "reference" },
            { "name": "receivedDate", "domain": "time", "type": "date" },
            { "name": "quantity", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "unit", "domain": "magnitude", "type": "string" },
            { "name": "batchCert", "domain": "evidence", "type": "attachment" },
            { "name": "scalReading", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "quantity",
          "counterpartyColumn": "supplier"
        },
        "evidenceRules": [
          { "description": "Scale reading at intake", "requiredCount": 1, "sourceType": "sensor" },
          { "description": "Supplier batch certificate", "requiredCount": 1, "sourceType": "document" }
        ],
        "expectedResolutionDays": 1,
        "sub": []
      },
      {
        "id": "production",
        "name": "Production Lines",
        "filamentSchema": {
          "columns": [
            { "name": "lineId", "domain": "identity", "type": "string" },
            { "name": "product", "domain": "identity", "type": "string" },
            { "name": "shiftDate", "domain": "time", "type": "date" },
            { "name": "quantity", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "unit", "domain": "magnitude", "type": "string" },
            { "name": "qcReport", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "quantity",
          "counterpartyColumn": null
        },
        "evidenceRules": [
          { "description": "Production run log", "requiredCount": 1, "sourceType": "system" },
          { "description": "QC lab report", "requiredCount": 1, "sourceType": "document" }
        ],
        "expectedResolutionDays": 1,
        "sub": [
          { "id": "line-cn-c1", "name": "CN Line C1" },
          { "id": "line-cn-c2", "name": "CN Line C2" },
          { "id": "line-dm-d1", "name": "DM Line D1" }
        ]
      },
      {
        "id": "waste",
        "name": "Waste Management",
        "filamentSchema": {
          "columns": [
            { "name": "wasteType", "domain": "identity", "type": "string" },
            { "name": "disposalVendor", "domain": "counterparty", "type": "reference" },
            { "name": "recordDate", "domain": "time", "type": "date" },
            { "name": "quantity", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "unit", "domain": "magnitude", "type": "string" },
            { "name": "wasteManifest", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "quantity",
          "counterpartyColumn": "disposalVendor"
        },
        "evidenceRules": [
          { "description": "Waste manifest", "requiredCount": 1, "sourceType": "document" },
          { "description": "Scale reading at disposal", "requiredCount": 1, "sourceType": "sensor" }
        ],
        "expectedResolutionDays": 7,
        "sub": []
      },
      {
        "id": "finished-goods",
        "name": "Finished Goods",
        "filamentSchema": {
          "columns": [
            { "name": "productId", "domain": "identity", "type": "string" },
            { "name": "customer", "domain": "counterparty", "type": "reference" },
            { "name": "shipDate", "domain": "time", "type": "date" },
            { "name": "quantity", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "unit", "domain": "magnitude", "type": "string" },
            { "name": "shippingDoc", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "quantity",
          "counterpartyColumn": "customer"
        },
        "evidenceRules": [
          { "description": "Shipping document / bill of lading", "requiredCount": 1, "sourceType": "document" },
          { "description": "Customer receipt confirmation", "requiredCount": 1, "sourceType": "external" }
        ],
        "expectedResolutionDays": 30,
        "sub": []
      }
    ],
    "consolidationGate": {
      "type": "financial-balance",
      "rules": {
        "conservationCheck": "inputSum == outputSum + wasteSum - recycledSum",
        "tolerancePct": 2.0,
        "magnitudeTypeField": "magnitudeType",
        "validTypes": ["input", "output", "waste", "recycled", "byproduct"],
        "unitField": "unit",
        "requiredUnit": "MT"
      }
    },
    "defaultAttributeBindings": {
      "slabColor": "conservationDeviation",
      "slabOpacity": "confidence",
      "slabThickness": "inputSum",
      "slabFirmness": "wiltFactor",
      "branchRadius": "normalizedThroughput",
      "twistRate": "activityPerPeriod",
      "filamentRadial": "lifecycleState",
      "filamentAngular": "approachDirection"
    }
  }
}
```

**Key differences from default template:**
- `magnitudeType` field in every filament schema — classifies each filament's magnitude as input, output, waste, recycled, or byproduct for conservation computation.
- `consolidationGate.type = "financial-balance"` — validates mass conservation at timebox close with configurable tolerance (2% maps to the 98-102% "green" range in §52.5).
- `slabColor` bound to `conservationDeviation` — rings color-shift based on mass balance deviation instead of raw magnitude.
- `branchRadius` bound to `normalizedThroughput` — branch thickness reflects total material flow, not KPI score.
- Evidence rules require sensor readings (scale) + documents (certificates, manifests) — matching real-world manufacturing audit requirements.

### 21.2.2 Example Template — Nonwovens Factory (Full Production Chain)

```json
{
  "TreeTemplate": {
    "templateId": "template.manufacturing.nonwovens.v1",
    "name": "Nonwovens Production (Full Chain)",
    "domain": "manufacturing",
    "sinkingMode": "earth-time",
    "twistPeriod": "week",
    "barkRenderMode": "tabular",
    "lAxisMapping": "calendar-time",
    "cellLODRenderer": "spreadsheet",
    "branches": [
      {
        "id": "procurement-raw",
        "name": "Raw Materials",
        "filamentSchema": {
          "columns": [
            { "name": "lotId", "domain": "identity", "type": "string" },
            { "name": "vendor", "domain": "counterparty", "type": "reference" },
            { "name": "materialClass", "domain": "extension", "type": "string" },
            { "name": "grade", "domain": "extension", "type": "string" },
            { "name": "receivedDate", "domain": "time", "type": "date" },
            { "name": "quantity", "domain": "magnitude", "type": "number" },
            { "name": "unit", "domain": "extension", "type": "string" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "compositionEvidence", "domain": "evidence", "type": "attachment" },
            { "name": "coaCertificate", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "quantity",
          "counterpartyColumn": "vendor"
        },
        "evidenceRules": [
          { "description": "Certificate of Analysis", "requiredCount": 1, "sourceType": "document" },
          { "description": "Scale weight ticket", "requiredCount": 1, "sourceType": "sensor" }
        ],
        "expectedResolutionDays": 3,
        "sub": [
          { "id": "procurement-pp", "name": "Polypropylene" },
          { "id": "procurement-surfactants", "name": "Surfactants" },
          { "id": "procurement-additives", "name": "Additives" },
          { "id": "procurement-packaging", "name": "Packaging Materials" }
        ]
      },
      {
        "id": "production-runs",
        "name": "Production Runs",
        "filamentSchema": {
          "columns": [
            { "name": "runId", "domain": "identity", "type": "string" },
            { "name": "machineLine", "domain": "extension", "type": "string" },
            { "name": "shift", "domain": "time", "type": "string" },
            { "name": "startTime", "domain": "time", "type": "date" },
            { "name": "endTime", "domain": "time", "type": "date" },
            { "name": "inputLots", "domain": "evidence", "type": "reference[]" },
            { "name": "outputMass", "domain": "magnitude", "type": "number" },
            { "name": "scrapMass", "domain": "magnitude", "type": "number" },
            { "name": "emissionsMass", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "bomVersion", "domain": "evidence", "type": "reference" },
            { "name": "processParams", "domain": "extension", "type": "object" }
          ],
          "magnitudeColumn": "outputMass",
          "counterpartyColumn": "machineLine"
        },
        "evidenceRules": [
          { "description": "Input lot references", "requiredCount": 1, "sourceType": "reference" },
          { "description": "Production log", "requiredCount": 1, "sourceType": "sensor" },
          { "description": "Mass balance calculation", "requiredCount": 1, "sourceType": "computed" }
        ],
        "expectedResolutionDays": 1
      },
      {
        "id": "inventory-wip",
        "name": "WIP (Master Rolls)",
        "filamentSchema": {
          "columns": [
            { "name": "rollId", "domain": "identity", "type": "string" },
            { "name": "sourceRun", "domain": "evidence", "type": "reference" },
            { "name": "mass", "domain": "magnitude", "type": "number" },
            { "name": "width", "domain": "extension", "type": "number" },
            { "name": "length", "domain": "extension", "type": "number" },
            { "name": "basisWeight", "domain": "extension", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "inheritedComposition", "domain": "extension", "type": "object" },
            { "name": "qcStatus", "domain": "lifecycle", "type": "string" }
          ],
          "magnitudeColumn": "mass",
          "counterpartyColumn": "sourceRun"
        },
        "evidenceRules": [
          { "description": "Source production run reference", "requiredCount": 1, "sourceType": "reference" }
        ],
        "expectedResolutionDays": 7
      },
      {
        "id": "inventory-fg",
        "name": "Finished Goods",
        "filamentSchema": {
          "columns": [
            { "name": "fgRollId", "domain": "identity", "type": "string" },
            { "name": "sourceWip", "domain": "evidence", "type": "reference" },
            { "name": "customer", "domain": "counterparty", "type": "reference" },
            { "name": "mass", "domain": "magnitude", "type": "number" },
            { "name": "width", "domain": "extension", "type": "number" },
            { "name": "length", "domain": "extension", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "inheritedComposition", "domain": "extension", "type": "object" },
            { "name": "shipmentId", "domain": "extension", "type": "string" },
            { "name": "retailLocation", "domain": "extension", "type": "reference" }
          ],
          "magnitudeColumn": "mass",
          "counterpartyColumn": "customer"
        },
        "evidenceRules": [
          { "description": "Slitting run reference", "requiredCount": 1, "sourceType": "reference" },
          { "description": "QC pass certificate", "requiredCount": 1, "sourceType": "document" },
          { "description": "Dimensional measurement", "requiredCount": 1, "sourceType": "sensor" }
        ],
        "expectedResolutionDays": 14
      },
      {
        "id": "quality-qc",
        "name": "Quality Control",
        "filamentSchema": {
          "columns": [
            { "name": "testId", "domain": "identity", "type": "string" },
            { "name": "sampleSource", "domain": "evidence", "type": "reference" },
            { "name": "tensileStrength", "domain": "extension", "type": "number" },
            { "name": "basisWeight", "domain": "extension", "type": "number" },
            { "name": "absorption", "domain": "extension", "type": "number" },
            { "name": "chemicalResidue", "domain": "extension", "type": "number" },
            { "name": "visualDefects", "domain": "extension", "type": "string" },
            { "name": "result", "domain": "lifecycle", "type": "string" },
            { "name": "labCert", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "basisWeight",
          "counterpartyColumn": "sampleSource"
        },
        "evidenceRules": [
          { "description": "Lab test report", "requiredCount": 1, "sourceType": "document" },
          { "description": "Test instrument calibration cert", "requiredCount": 1, "sourceType": "document" }
        ],
        "expectedResolutionDays": 2
      },
      {
        "id": "rework",
        "name": "Rework",
        "filamentSchema": {
          "columns": [
            { "name": "reworkId", "domain": "identity", "type": "string" },
            { "name": "sourceFg", "domain": "evidence", "type": "reference" },
            { "name": "defectType", "domain": "extension", "type": "string" },
            { "name": "reworkRun", "domain": "evidence", "type": "reference" },
            { "name": "outputMass", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" }
          ],
          "magnitudeColumn": "outputMass"
        },
        "expectedResolutionDays": 7
      },
      {
        "id": "waste",
        "name": "Waste & Emissions",
        "filamentSchema": {
          "columns": [
            { "name": "wasteId", "domain": "identity", "type": "string" },
            { "name": "sourceRun", "domain": "evidence", "type": "reference" },
            { "name": "wasteClass", "domain": "extension", "type": "string" },
            { "name": "mass", "domain": "magnitude", "type": "number" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" },
            { "name": "emissionType", "domain": "extension", "type": "string" },
            { "name": "disposalMethod", "domain": "extension", "type": "string" },
            { "name": "manifest", "domain": "evidence", "type": "attachment" }
          ],
          "magnitudeColumn": "mass"
        },
        "evidenceRules": [
          { "description": "Weighbridge ticket or meter reading", "requiredCount": 1, "sourceType": "sensor" },
          { "description": "Waste manifest", "requiredCount": 1, "sourceType": "document" }
        ],
        "expectedResolutionDays": 5
      },
      {
        "id": "maintenance",
        "name": "Maintenance",
        "filamentSchema": {
          "columns": [
            { "name": "maintId", "domain": "identity", "type": "string" },
            { "name": "machineLine", "domain": "counterparty", "type": "reference" },
            { "name": "maintType", "domain": "extension", "type": "string" },
            { "name": "sparePartId", "domain": "evidence", "type": "reference" },
            { "name": "cost", "domain": "magnitude", "type": "number" },
            { "name": "downtime", "domain": "extension", "type": "number" },
            { "name": "affectedRuns", "domain": "evidence", "type": "reference[]" },
            { "name": "plannedDate", "domain": "time", "type": "date" },
            { "name": "completedDate", "domain": "time", "type": "date" }
          ],
          "magnitudeColumn": "cost",
          "counterpartyColumn": "machineLine"
        },
        "evidenceRules": [
          { "description": "Work order", "requiredCount": 1, "sourceType": "document" },
          { "description": "Spare part receipt", "requiredCount": 1, "sourceType": "document" }
        ],
        "expectedResolutionDays": 14,
        "sub": [
          { "id": "maint-preventive", "name": "Preventive" },
          { "id": "maint-corrective", "name": "Corrective" },
          { "id": "maint-condition", "name": "Condition-Based" },
          { "id": "maint-spare-parts", "name": "Spare Parts Inventory" }
        ]
      },
      {
        "id": "rnd",
        "name": "R&D",
        "filamentSchema": {
          "columns": [
            { "name": "trialId", "domain": "identity", "type": "string" },
            { "name": "objective", "domain": "extension", "type": "string" },
            { "name": "bomVersion", "domain": "evidence", "type": "reference" },
            { "name": "trialRun", "domain": "evidence", "type": "reference" },
            { "name": "result", "domain": "lifecycle", "type": "string" },
            { "name": "specChange", "domain": "evidence", "type": "attachment" }
          ]
        },
        "expectedResolutionDays": 30
      },
      {
        "id": "environment",
        "name": "Environment & ESG",
        "sub": [
          { "id": "env-emissions-truth", "name": "Emissions Truth" },
          { "id": "env-policy-credits", "name": "Policy & Credits" },
          { "id": "env-interventions", "name": "Interventions" }
        ]
      },
      {
        "id": "treasury",
        "name": "Treasury",
        "filamentSchema": {
          "columns": [
            { "name": "txnId", "domain": "identity", "type": "string" },
            { "name": "counterparty", "domain": "counterparty", "type": "reference" },
            { "name": "amount", "domain": "magnitude", "type": "number" },
            { "name": "currency", "domain": "extension", "type": "string" },
            { "name": "magnitudeType", "domain": "extension", "type": "string" }
          ],
          "magnitudeColumn": "amount",
          "counterpartyColumn": "counterparty"
        },
        "expectedResolutionDays": 30
      }
    ],
    "consolidationGate": {
      "type": "financial-balance",
      "rules": {
        "conservationCheck": "inputSum == outputSum + wasteSum - recycledSum",
        "tolerancePct": 2.0,
        "magnitudeTypeField": "magnitudeType",
        "validTypes": ["input", "output", "waste", "recycled", "byproduct", "emission"],
        "unitField": "unit",
        "requiredUnit": "kg",
        "compositionConservation": true,
        "compositionTolerance": 3.0
      }
    },
    "esgReconciliation": {
      "truthBranch": "env-emissions-truth",
      "creditsBranch": "env-policy-credits",
      "interventionsBranch": "env-interventions",
      "baselineWindow": 6,
      "postWindow": 6,
      "stormThreshold": 0.3,
      "unit": "kgCO2e/ton_FG"
    },
    "recallCascade": {
      "enabled": true,
      "chain": ["procurement-raw", "production-runs", "inventory-wip", "inventory-fg"],
      "lightningThreshold": 100,
      "notifyDownstream": true
    },
    "defaultAttributeBindings": {
      "slabColor": "conservationDeviation",
      "slabOpacity": "confidence",
      "slabThickness": "inputSum",
      "slabFirmness": "wiltFactor",
      "branchRadius": "normalizedThroughput",
      "twistRate": "activityPerPeriod",
      "filamentRadial": "lifecycleState",
      "filamentAngular": "approachDirection"
    }
  }
}
```

**Key differences from §21.2.1 (generic manufacturing):**
- **11 primary branches** covering the full production chain from raw procurement through FG, quality, rework, waste, maintenance, R&D, ESG, and treasury.
- **Maintenance sub-branches** by type (preventive, corrective, condition-based, spare parts) with `affectedRuns` cross-references for recall correlation.
- **ESG three-branch structure** (§53.6) with reconciliation configuration for greenwashing detection.
- **Recall cascade** configuration with chain definition and lightning threshold.
- **Composition conservation** enabled in the consolidation gate — checks mass balance per chemical component, not just total mass.
- **R&D branch** with BOM version references and trial-to-production spec change tracking.
- **`inheritedComposition`** field on WIP and FG filaments — the mass-weighted composition profile inherited through the transformation chain (Contract #139).

### 21.2.3 Example Template — Municipal Government (Property & Permits)

Covers land registration, building permits, zoning compliance, utility billing, and public works. Designed to function at **Tier 0** (evidence hash of scanned deeds) through **Tier 3** (fully native digital registration). Branches: `property-registry`, `building-permits`, `zoning-compliance`, `utility-billing`, `public-works`, `council-resolutions`, `tax-assessments`. Consolidation gates enforce: permit-to-parcel linkage, zoning-to-permit validation, and tax assessment consistency. At Tier 0, the property branch contains only hashed deed scans — foggy but tamper-evident. At Tier 3, each parcel is a filament with full ownership history, encumbrances, and assessment trail visible in cross-section.

### 21.2.4 Example Template — Healthcare Facility (Patient & Compliance)

Hospital or clinic operations: patient encounters, prescriptions, lab results, insurance claims, regulatory compliance (HIPAA/GDPR), medical device maintenance, and staff credentialing. Branches: `patient-encounters`, `pharmacy`, `lab-diagnostics`, `insurance-claims`, `compliance-audits`, `device-maintenance`, `staff-credentials`, `research-trials`. Filament schema includes: `patientRef` (anonymized), `providerRef`, `diagnosisCodes[]`, `procedureCodes[]`, `evidenceRefs[]`. Consolidation gates enforce: claim-to-encounter matching, prescription-to-diagnosis linkage, and device-to-maintenance schedule compliance. Sensitive branches use branch-level encryption with access controlled by role-based sortition keys.

### 21.2.5 Example Template — Personal Life Management

For individual users managing their own files, finances, health, and goals — not a company. Branches: `finances` (bank accounts, receipts, subscriptions), `health` (appointments, medications, fitness), `documents` (personal files, contracts, warranties), `projects` (personal goals, hobbies), `calendar` (events, reminders), `contacts` (relationships, correspondence). This is the simplest tree — no counterparty reconciliation, no mass balance. Consolidation gates are optional (e.g., monthly budget check). Demonstrates that Relay scales down to one person managing their life, not just up to corporations.

### 21.2.6 Example Template — Construction Project

A single construction project from bid through closeout. Branches: `design` (drawings, specs, RFIs, submittals), `procurement` (material POs, subcontracts, deliveries), `schedule` (milestones, critical path, delays), `budget` (cost tracking, change orders, payments), `quality` (inspections, punch lists, NCRs), `safety` (incidents, training, compliance), `permits` (municipal, environmental, utility). Consolidation gates enforce: change-order-to-budget reconciliation, inspection-to-milestone linkage, and schedule-to-actual variance tracking. Drawing revisions are document-type filaments (`barkRenderMode: document`, `lAxisMapping: contentPosition`) where l represents the sheet set order and each revision is an inward commit.

### 21.2.7 Example Template — Venture / Investment Fund

Portfolio management for a fund. Branches: `deal-pipeline` (opportunities, due diligence, term sheets), `portfolio-companies` (one sub-branch per investment), `fund-accounting` (capital calls, distributions, NAV), `LP-relations` (reporting, K-1s, commitments), `compliance` (regulatory filings, AML/KYC), `board-seats` (meeting minutes, votes, resolutions). Filament lifecycle maps to deal stages: `OPEN` = active pipeline, `ACTIVE` = due diligence, `HOLD` = term sheet negotiation, `CLOSED` = invested or passed, `ABSORBED` = archived. Fund-level consolidation gates enforce: capital call vs. commitment balance, NAV reconciliation, and carried interest waterfall calculations.

### 21.2.8 Example Template — Education Institution (School / University)

Branches: `enrollment` (applications, admissions, registrations), `curriculum` (courses, syllabi, learning outcomes), `grades` (student performance, transcripts), `faculty` (hiring, evaluations, tenure), `research` (grants, publications, IP), `facilities` (maintenance, room scheduling), `finance` (tuition, financial aid, budgets), `compliance` (accreditation, Title IX, accessibility). Student filaments carry `enrollmentRef`, `programRef`, `courseRefs[]`. Grading uses consolidation gates that validate: grade-to-coursework evidence linkage, credit-to-requirement mapping, and degree-audit completion. Research branches use the composition inheritance model (§53) for grant allocation tracking across multi-PI projects.

### 21.2.9 Example Template — Media / Content Production

Film, music, podcast, or publishing production. Branches: `creative` (scripts, storyboards, drafts, compositions), `production` (schedules, shot lists, recording sessions, editing), `talent` (contracts, availability, deliverables), `distribution` (platform submissions, release schedules, royalties), `marketing` (campaigns, social media, press), `legal` (rights, licenses, clearances), `finance` (budget, revenue, residuals). Creative branches use `barkRenderMode: media` with `lAxisMapping: timelinePosition`. Each edit session is a commit; the cross-section shows production density over time. Royalty tracking uses the three-way match pattern from §21.2.1: contract → delivery → payment.

### 21.2.10 Example Template — Agricultural Operation (Farm / Ranch)

Branches: `fields` (one sub-branch per plot: planting, irrigation, fertilization, harvest), `livestock` (herds, health records, breeding, veterinary), `equipment` (maintenance, fuel, depreciation), `supply-chain` (seed/feed procurement, product sales, logistics), `compliance` (organic certification, water rights, environmental), `weather` (sensor data, forecasts — Tier 1 connector from weather service), `finance` (subsidies, crop insurance, operating costs). Mass balance (§53) tracks: seed input → yield output per field per season. Composition inheritance tracks: fertilizer chemical profile → soil composition → crop residue. Weather branch is typically Tier 1 (connector from NOAA or local sensors), demonstrating mixed-tier operation on a single tree.

### 21.2.11 Example Template — Legal Practice

Law firm or legal department. Branches: `matters` (one sub-branch per case/deal: events, filings, deadlines, correspondence), `clients` (engagement letters, billing, trust accounts), `court-filings` (complaints, motions, orders, judgments), `discovery` (document production, depositions, interrogatories), `billing` (time entries, invoices, collections, trust reconciliation), `compliance` (bar requirements, conflicts checks, CLE), `knowledge` (precedents, templates, research memos). Trust account reconciliation uses a strict consolidation gate enforcing: client deposits = disbursements + balance, with zero-tolerance deviation. Court deadlines are scheduled filaments (§51) that act as alarm clocks with escalating urgency rendering as timebox approaches.

### 21.2.12 Example Template — Supply Chain & Logistics Network

Multi-echelon supply chain across warehouses, carriers, and customs. Branches: `purchase-orders`, `inbound-logistics` (carrier bookings, tracking, customs clearance), `warehousing` (receipts, putaway, picking, cycle counts), `outbound-logistics` (shipments, last-mile delivery, POD), `inventory` (stock levels, reorder points, ABC classification), `customs-trade` (tariffs, duties, trade agreements, certificates of origin), `returns-reverse` (RMAs, refurbishment, disposal), `finance` (freight audit, duty payment, inventory valuation). Consolidation gates enforce: PO-to-receipt matching, shipment-to-POD reconciliation, and inventory-to-physical count variance. Customs branch demonstrates Tier 1 integration (connector from trade management system) coexisting with native warehouse operations (Tier 3). The adoption tier difference is visible: customs filaments carry slight fog while warehouse filaments are clear. See §77 for the full mineral-to-shelf product traceability module.

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

**Prerequisites:** None for base (auditory attribute bindings: volume, pitch, timbre, rhythm, spatial position). Expands with: AR interaction modules → AR-rendered sound effects in video presence. Spell/combat modules → arena atmosphere (thunder, music, audience energy), spell sound effects, combat audio.

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

> *"What is the pattern that connects the crab to the lobster, the orchid to the primrose, and all four of them to me?"* — Gregory Bateson

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

> *"Everybody talks about the weather, but nobody does anything about it."* — Mark Twain

Weather in Relay is not a mechanic. It is an emergent vocabulary for describing aggregate tree behavior at regional and global scale. All weather phenomena are computed projections over existing branch physics. None create new filaments or commits.

### 23.1 Wind

Wind is not a computed overlay. Wind is the observed pattern of branch lean over time (§3.15). When you replay a time range and watch branches tilt timebox by timebox, the aggregate motion you see IS the wind. There is no separate wind vector computation at the regional level — wind is what happens when many branches lean in correlated directions during the same period.

**Company-level wind:** All branches on a company tree leaning in the same angular direction during replay — counterparties from that quadrant are causing correlated effects (demand surge, confidence deficits, payment delays). The company is experiencing directional pressure.

**Regional wind:** Many trees in a geographic region experiencing correlated branch lean during replay. A new regulation, an economic shift, a seasonal demand pattern. At CITY LOD, all trees lean the same way.

**Global wind currents:** Macro-scale correlated branch lean visible at GLOBE LOD during replay. A commodity price shift causes all manufacturing trees to lean simultaneously. A pandemic causes healthcare trees to grow while hospitality trees wilt. These correlated patterns are global wind.

Wind is always derived from lean (Equation 3, §3.19), which is derived from filament θ weights (counterparty approach direction). It is never a separate input, never a decoration, and never computed independently of branch physics.

### 23.2 Weather Vocabulary

All computed from existing filament data:

| Phenomenon | Source Data | Visual |
|-----------|------------|--------|
| **Wind** | Observed pattern of branch lean over time (§3.15, §23.1) — not a separate computation | Trees leaning in correlated direction during replay |
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
| 14b | **CROSS-SECTION-1** | Implement cross-section inspection mode. Camera perpendicular rotation, concentric ring rendering, radial time scrubber, slab expansion to disc panel, filament drill-down from slab to ribbon. Read-only lens — no data mutation. LOD depth (§33.4). | SLAB-REVISION-1, TREE-RING-1, SCAR-1 | §3.13, §3.14, §33.4 |
| 14c | **ORGANIC-RENDER-1** | Implement organic growth variation: slab thickness by theta (circumferential non-uniformity), Perlin noise on ring surfaces, bark ridge deformation at schema version boundaries, scar crack radial propagation and adjacent surface warping. Rendering-only — no data changes. | CROSS-SECTION-1 | §3.14, §4.5 |
| 14d | **WIND-1** | Implement branch lean physics: per-branch lean vector computation from filament θ weights at timebox close, branch lean rendering (small lateral offset in branch path frames, capped 5-10°), explainability click panel (top counterparties + filaments). Branch layout system (§3.18): layoutKey hashing, ring assignment, collision-aware routing, LOD bundle merge. Wind observed through replay, not separate arrows. | SLAB-REVISION-1, TREE-RING-1 | §3.15, §3.18 |
| 14e | **WEATHER-1** | Implement weather overlays: TimeboxAggregate computation (heat, fog, storm, lightning), TileAggregate rollup for REGION/GLOBE LOD, heat color tiles, fog haze layer, storm flicker, lightning cascade flash primitives. All deterministic, all toggleable. | WIND-1, CONFIDENCE-1 | §3.16, §3.17 |
| 14f | **SCHEDULE-1** | Implement scheduling engine: `SCHEDULED` lifecycle state, future l-position anchoring (no gravity), translucent tip rendering with proximity-based solidification, automatic `SCHEDULED→OPEN` transition at time threshold, notification trigger system, recurring series support (`recurringSeriesId`), cancellation as scar-like commit, event branch spawning for multi-day events, venue branch persistence, cross-section tip buds. Template-driven notification timing and mandatory field rules. | FILAMENT-ROW-1, SLAB-REVISION-1 | §5b |

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

**Tier 6 — AR Interaction Modules**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 25 | **VIDEO-PRESENCE-1** | Implement user sphere video presence with camera feed integration. Bi-directional video within the globe context. User sphere positioning relative to tree location. | PROXIMITY-1, USER-TREE-1 | §39.1 |
| 26 | **AR-OVERLAY-1** | Implement SCV-managed AR graphics overlay on video feed. Pre-designed graphic asset library. Voice/gesture summoning of assets. Shared view rendering for participants. | VIDEO-PRESENCE-1 | §39.1 |
| 27 | **OBJECT-INTERFACE-1** | Implement physical object detection and mapping. Camera-based object recognition. User-trainable SCV object vocabulary. Sword-blade-to-tree mapping as reference implementation. | AR-OVERLAY-1 | §39.2 |
| 28 | **LIGHT-COMM-1** | Implement light-based communication detection. Reflected light angle detection. Light signature classification. SCV interpretation of light signals as commands. | OBJECT-INTERFACE-1 | §39.3 |
| 29 | **ACHIEVEMENT-1** | Implement personal achievement system. Pre-mapped achievement definitions. SCV validation against physics laws. Evidence recording on user tree. Progressive capability unlock per achievement. | LIGHT-COMM-1, USER-TREE-1, CONFIDENCE-1 | §39.4 |
| 30 | **MULTI-RESOURCE-1** | Implement multi-resource economy. Engagement credits (base), achievement tokens (advanced), active capacity (limit). Resource-gated functionality. Double-entry resource transfers. | ACHIEVEMENT-1, PARAM-GOVERNANCE-1 | §41 |

**Tier 7 — Game Layer Modules (Monster Economy Lever Requires Founder Key)**

| # | Slice | Description | Depends On | Key Sections |
|---|-------|-------------|------------|--------------|
| 31 | **FOUNDER-KEY-1** | Implement founder key primitive. Activation condition checks (parameter thresholds). Founder account validation. Irreversible global activation. Pre-activation inert state for founder-key-gated modules. | MULTI-RESOURCE-1, PARAM-GOVERNANCE-1 | §44 |
| 32 | **ELEMENT-DETECT-1** | Implement environmental element detection from camera feed. Fire, smoke, rain, light, snow, wind, earth classification. Element presence enables corresponding magic type. Geographic capability mapping. | FOUNDER-KEY-1, AR-OVERLAY-1 | §43 |
| 33 | **SPELL-ENGINE-1** | Implement spell system. Personal spell library as user tree filaments. Element + gesture + object → SCV action mapping. Spell validation, AR rendering, truth-layer commit resolution. Shared spell definitions. | ELEMENT-DETECT-1, LIGHT-COMM-1 | §43.2, §43.3 |
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
- **Cross-section inspection mode** (§3.13): No radial cross-section view, ring scrubbing, slab expansion, or filament drill-down. Requires CROSS-SECTION-1.
- **Organic growth variation** (§3.14): No slab thickness variation by theta, no Perlin noise, no bark ridge deformation, no scar crack propagation. Requires ORGANIC-RENDER-1.

These are the Tier 1-3 build slices. The proven foundation supports them.

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

> *"The most important thing in communication is hearing what isn't said."* — Peter Drucker

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

> *"Extraordinary claims require extraordinary evidence."* — Carl Sagan

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

> *"In God we trust. All others must bring data."* — W. Edwards Deming

### 31.1 TransferPacket (System Truth)

Append-only posting packet. Typed legs `{containerRef, amount, unit, reasonCode}`. Must net to zero per unit type.

Containers: Inventory, GRIR, AP, Cash/Bank, Variance, Budget/Commitment, policy-defined extensions.

### 31.2 ResponsibilityPacket (Human Truth)

Append-only mirrored packet on user tree. Records asserted/approved/executed responsibility linked to the same commitId + evidenceHash.

### 31.3 Commit-Hook Law

TransferPacket validation executes INSIDE commit materialization. Direct financial state mutation outside COMMIT is forbidden. Ledger/journal/trial-balance are deterministic projections over validated transfer packets — they are never origin-write surfaces.

### 31.4 Settlement Timebox Rule — spawnAt, Not settlementAt

External settlement (bank confirmation, payment processor callback) is asynchronous. A bank may settle 2 hours or 48 hours after Relay initiates the transfer. During that gap, gravity sinks filaments, timeboxes close, and cross-sections may be inspected.

**The rule:** A filament's timebox assignment is determined by `spawnAt` (the moment the filament was created in Relay) — never by external settlement time.

Why:
- If timebox assignment used `settlementAt`, a settlement arriving 48 hours later would retroactively place the filament in a timebox that has already closed. That breaks deterministic replay — a closed timebox's aggregates would change.
- Settlement confirmation is a **commit on the existing filament**, not a new filament or a timebox reassignment. When Chase confirms at T+48h, that confirmation attaches as an evidence commit to the filament that was spawned at T+0h. The filament stays in its original timebox.
- Slab confidence for the original timebox may improve (because evidence arrived), but the slab's commit count, magnitude, and filament membership do not change.

**Lifecycle during settlement gap:**

```
T+0h:  Filament spawns → timebox = current → lifecycleState = OPEN
       settlementStatus = PENDING_EXTERNAL
T+48h: Bank confirms → evidence commit attaches to filament
       settlementStatus = SETTLED
       orgConfidence increases (evidence present)
       Timebox does NOT change. l position does NOT change.
       The filament has been sinking for 48h already.
```

**If settlement fails:**

```
T+72h: Bank rejects → evidence commit attaches: "settlement rejected"
       settlementStatus = FAILED
       orgConfidence decreases
       A revert commit may be applied → scar (§4.5)
       Timebox still does NOT change.
```

This ensures deterministic replay: given the same commit log, any node produces identical timebox aggregates at any point in time. Settlement latency never distorts history.

### 31.5 External Hash Rot — Evidence Survives, Retrieval May Not

Relay hashes external evidence (bank confirmation PDFs, API responses, signed documents) at commit time. The hash is immutable and Merkle-anchored. The external source may not be.

**Over time, external references decay:**
- Bank document URLs expire.
- API endpoints change.
- PDF formats are rotated.
- Corporate portals are decommissioned.

**The invariant:** `hash ≠ retrievability`. The hash proves what the document said at the time it was committed. It does not guarantee the document can be fetched again.

**UX rules:**
- If `externalEvidenceRef` resolves: show document + hash verification (green check).
- If `externalEvidenceRef` fails to resolve: show "External evidence unavailable — hash preserved: `sha256:abc…`" with amber indicator. Never show as "data loss" or "missing evidence."
- Confidence is NOT reduced by hash rot. The hash proves the evidence existed. The evidence was verified at commit time. Subsequent URL expiry does not invalidate past verification.
- Templates can define `evidenceArchivePolicy`: `CACHE_LOCAL` (store a local copy at commit time — uses storage budget), `HASH_ONLY` (store only hash — zero storage, retrieval-dependent), or `CACHE_AND_HASH` (both). The default for financial branches should be `CACHE_AND_HASH`.

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

> *"The art of being wise is the art of knowing what to overlook."* — William James

### 33.1 LOD Ladder (Branch-Level)

| LOD Level | What Renders | Detail |
|-----------|-------------|--------|
| GALACTIC-STELLAR | Celestial body globes as points with aggregate heat/mass. | Every body with data IS a Relay globe (§1.3). Same physics at every body. |
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

Every user has a **sight radius** — a visibility bubble around their current focus point. Objects inside the bubble render at full detail appropriate to the LOD level. Objects outside the bubble are still visible — but rendered at progressively lower fidelity. This is the Relay equivalent of fog of war: you see what you are looking at in full detail, and everything else remains present as recognizable form, just not as crisp geometry.

**Atmospheric compression:** As branches extend beyond the user's current atmospheric zone, they do not vanish — they simplify. A distant branch still renders as a branch: its cylinder shape, color, height, and approximate thickness remain visible. What drops away is internal detail — individual filaments merge into aggregate textures, bark rows become smooth surfaces, projections collapse into color-tinted summary halos, twigs reduce to directional stubs. The further away, the fewer primitives used, but the silhouette and proportions always represent the real underlying structure. Think of a city skyline at dusk: you cannot read the signs or count the windows, but you can tell which buildings are tall, which glow, which are dark. That is how distant branches look — blurry, simplified, but truthful in form.

A branch with 10,000 active projections at its tip still reads as a dense, active cluster from a distance. Only when the user flies into it does the cluster expand into individual projections with full interactivity. At no point does geometry disappear — it only reduces in polygon count and texture resolution.

This creates a natural rendering budget that scales with attention, not with world complexity. A globe with 50 million trees and billions of filaments renders smoothly because distant objects use a fraction of the primitives that nearby objects use — but they are always there, always shaped correctly, always hinting at the activity they contain.

### 33.4 Archive Radial Compression — LOD by Depth

LOD applies not only to camera distance but also to radial depth within a branch. Deep archive rings compress visually — but data exists in full fidelity at every depth.

| LOD Level | Deep Archive Rendering |
|-----------|----------------------|
| TREE | Deep archive = thin inner band. Individual rings indistinguishable. Branch shape reflects total archive weight. |
| BRANCH | Archive rings visible as denser bands. Recent rings individually legible. Deep rings merge visually. |
| CROSS-SECTION (§3.13) | Full fidelity. Every slab ring individually rendered. Thickness, color, opacity, and scars visible per ring. User can scrub and expand. |
| CELL | Single filament's full commit history along the radial axis. Each commit layer distinguishable. |

Archive compression is visual only. The underlying slab data, filament positions, and commit histories exist at full resolution regardless of rendering fidelity. The cross-section inspection mode (§3.13) is the mechanism that unlocks full-depth legibility without violating the universal sinking rule.

**Invariant:** Archive legibility comes from cross-sectional slab rendering, ring contrast, LOD-based compression, interactive slicing, and time scrub depth control — never from freezing time or pinning filaments to the surface.

**Privacy integration — physics vs rendering separation:** Branch health, confidence, weight, and aggregate metrics are always computed from ALL authorized filaments within that branch's scope, regardless of who is viewing. A branch that contains 1,000 filaments weighs 1,000 filaments for everyone — the tree IS the data. However, *rendering* respects disclosure tiers: objects the viewer does not have permission to see are excluded from their personal render pass. The branch still shows its true aggregate shape (droop, heat, thickness, confidence opacity) because those are scope-truth properties computed server-side. But individual filaments, twigs, and projection details that fall outside the viewer's disclosure tier do not render on their device. The viewer cannot infer the specific content of private objects, but they can see that the branch is heavier or more active than what they personally have access to — because the aggregate is truthful. This preserves auditability: two users see the same branch shape and health, even if they see different internal details.

### 33.5 Laniakea LOD Scaling Rules — Deterministic, Not Theatrical

From file to Laniakea, Relay renders the same physics at every scale. What changes is aggregation level and rendering fidelity. These rules prevent the galaxy layer from becoming theatrical nonsense.

**Rule 1 — Deterministic aggregation only.**

At GALACTIC and LANIAKEA LOD, you never render individual filaments. You render:
- Trunk vectors (lean direction + magnitude for major bodies)
- Heat scalar (per region tile)
- Fog scalar (per region tile)
- Mass scalar (trunk thickness / presence weight)

Nothing else. No particle effects. No "space ambiance." No decorative nebulae. If it renders, it's computed from filament aggregates.

**Rule 2 — No physics above source.**

Weather overlays and aggregate metrics cannot: move filaments, alter lifecycle, affect confidence, modify governance. They are pure projection computed from underlying data. This holds at every scale — a galaxy-scale heat map has no more authority over truth than a branch-level one.

**Rule 3 — LOD collapse hierarchy (from highest to lowest fidelity).**

When density exceeds rendering threshold at any scale:

| Shed Order | What Disappears | What Remains |
|------------|-----------------|-------------|
| 1st | Individual filaments | Aggregate bark texture |
| 2nd | Slab disc rings | Aggregate ring bands |
| 3rd | Bark surface texture | Smooth cylinder |
| 4th | Weather tile overlays | Branch silhouettes |
| 5th | Branch lean/droop deformation | Static branch pose |
| 6th | Individual branches | Category bundles (§3.18 LOD merge) |
| 7th | Category bundles | Trunk marker only |
| 8th | Individual trunks | Regional heat/fog tiles |
| NEVER | Regional presence | Always visible as at least a point |

Truth collapses upward (toward aggregation), never sideways (toward falsification).

**Rule 4 — Motion updates at timebox boundaries only.**

No per-commit jitter at any scale. Motion recalculates only when a timebox closes or an engagement threshold is crossed. At galaxy scale, the timebox might be an epoch. At file scale, it might be a day. The update cadence scales with the scope — but the rule is the same: no continuous animation from data events.

**Rule 5 — Universal units (no scale-specific normalization).**

Every scale uses:
- Radians for θ (direction)
- Normalized magnitude (0..1 within scope)
- Normalized confidence (0..1, always)
- Normalized heat (0..1 within time window)
- Normalized fog (0..1, always)

Planetary scale does not require different math. The normalization denominator changes with scope. The equations (§3.19) remain identical.

**LOD thresholds by scale:**

| Scale | When Visible | What Renders |
|-------|-------------|-------------|
| CELL | Camera within single filament | Full commit history, cell editor, evidence panel |
| SHEET | Camera within branch surface | Flat grid, ribbons, individual rows |
| BARK | Camera near branch | Cylindrical bark, slab rings, twigs, lean |
| BRANCH | Camera at tree level | Branch cylinders, aggregate lean/droop, slab bands |
| TREE | Camera seeing whole tree | Trunk + branch silhouettes + bundles |
| COMPANY | Camera seeing tree cluster | Trunk markers + aggregate health |
| REGION | Camera seeing a country/state | Heat tiles + fog + trunk dots |
| PLANETARY | Camera seeing globe | Continental heat regions + major trunk clusters |
| ORBITAL | Camera between Earth and Moon | Nearby bodies visible as small globes. Space stations as tree markers. |
| LUNAR | Camera at Moon distance | Moon IS a full Relay globe (§1.3). Zoom in = Moon's own trees. Earth also visible. |
| STELLAR | Camera at solar system scale | Each planet/moon/asteroid = a globe point with aggregate heat/mass. Zoom into any = full globe. |
| GALACTIC | Camera at Milky Way scale | Star-system points with aggregate metrics. Each star system contains its own set of body-globes. |
| LANIAKEA | Camera at supercluster scale | Galaxy cluster heat fields + aggregate force vectors. Each galaxy contains star systems with body-globes. |

At every level, the same equations (§3.19) produce the rendered state. Only the aggregation depth and primitive budget differ. Every celestial body that has data IS a full Relay globe (§1.3) — not a dot, not a marker, not an abstraction. Zoom into any body at any scale and you find trees with branches, filaments, slabs, scars, archive rings. History goes inward on every body.

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

Every celestial body IS a Relay globe (§1.3). Mars is not a marker on Earth's zoom-out — Mars is its own full globe with its own trees, its own branches, its own filaments, its own archive rings, its own cross-sections. The same is true for the Moon, every asteroid, every planet, every moon of every planet, every space station.

**Mars example:**
- `geology` branch: every rover soil sample, seismic reading, mineral identification = filament. Template: `planetary.geology`. Sinking mode: mission-milestone.
- `atmosphere` branch: every atmospheric pressure reading, dust storm measurement, radiation level = filament. Template: `planetary.atmosphere`. Sinking mode: earth-time.
- `operations` branch: every mission telemetry event, communication window, power cycle = filament. Template: `planetary.operations`.
- The rover's presence marker moves across the Martian surface. Scientists on Earth zoom to Mars, read the bark, build projections. The Martian tree rings encode geological history the same way an accounting tree encodes financial history.

**Data sources for non-Earth bodies:**
- Satellites and orbital sensors → automatic filament generation from telemetry streams
- Rovers and surface probes → filaments from instrument readings
- Telescopes → filaments from observation events
- Human missions → filaments from crew activity (identical to Earth workplace filaments)
- AI/SCV analysis → projection branches on celestial body trees (same lavender, same rules)

At planetary LOD, you see each body as a globe. Zoom in and you see its trees. Zoom in further and you see branches, bark, filaments — identical physics to Earth. The universal equations (§3.19) are not metaphorically universal. They are literally the same computation running on every body that has data.

---

## 37. Knowledge Migration Lifecycle — From 2D Internet to 3D Tree

> *"First they ignore you, then they laugh at you, then they fight you, then you win."* — attributed to Mahatma Gandhi

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

## 38. Module Discovery Architecture — Frozen Contract #141

> *"The only way to do great work is to love what you do."* — Steve Jobs

Relay does not have three stages. It has modules — an open-ended, ever-growing set of capabilities that users discover, learn, and unlock individually. There is no Stage 1 user and no Stage 3 user. There is only a user who has demonstrated understanding of certain capabilities and has not yet discovered others. A CFO who masters three-way match reconciliation and a teenager who masters sword-based spell dueling have each learned something real. Neither is "ahead." They learned different modules.

The rigid "Stage 1 → 2 → 3" terminology that appeared in earlier drafts is superseded by this section. Where other sections reference "Stage Gate: 1→2→3," read that as "Prerequisites:" — a list of modules that must be understood before the next capability becomes available. The three conceptual layers (Truth, Interaction, Game) remain as useful vocabulary for describing what a module does, not as access gates that restrict when someone can do it.

### 38.1 How Modules Work

A **module** is any coherent capability within Relay. Filing a spreadsheet row is a module. Casting a fire spell is a module. Running a three-way match is a module. Summoning an SCV combat agent is a module. Each has:

- **Prerequisites**: Other modules whose physics the user must demonstrably understand. A spell requires understanding evidence commits, confidence physics, and SCV interaction. But if a user intuitively grasps all three on day one, the spell module is available on day one.
- **Demonstrated competence**: The system does not ask "have you reached Stage 3?" It asks "can your SCV confirm that your interaction matches the physics laws for this module?" If yes, the module is yours.
- **Evidence of understanding**: The user's SCV captures the demonstration. The interaction IS the evidence. It becomes a filament on the user tree with full proof chain. This is not a badge or a trophy — it is a commit.

There is no promotion ceremony. There is no notification that says "Congratulations, you've reached Stage 2." The user simply does something, the system recognizes it, and new capabilities become available. They may not even notice the transition.

### 38.2 The Three Conceptual Layers (Vocabulary, Not Gates)

Modules naturally cluster into three conceptual layers based on what they interact with. These are descriptions, not restrictions:

| Layer | Name | What it means | Examples |
|-------|------|---------------|---------|
| **Truth** | Data substrate | Modules that record, verify, and govern facts | Trees, filaments, bark, governance, projections, presence, accounting, templates, weather |
| **Interaction** | AR communication | Modules that use cameras, video, gestures, physical objects, and light as interfaces to the tree | Video AR overlay, SCV graphics, gesture/light/object detection, physical object mapping |
| **Game** | Gamified reality | Modules that render real-world challenges as quests, monsters, spells, and duels | Genre templates, spell mechanics, monster economy, combat, arena atmosphere |

A Game-layer module always resolves to Interaction-layer rendering which always resolves to Truth-layer filament commits. A spell cast in a duel is rendered as AR graphics, and the underlying SCV action produces a filament commit with evidence. Remove the Game layer and the Interaction layer still works. Remove the Interaction layer and the Truth layer still works. This is the enhancement principle — each layer enriches the ones beneath it, never replaces them.

But this is architectural dependency, not access control. If a user understands the prerequisite chain all the way from Truth through Interaction to Game, nothing stops them from operating at the Game layer immediately.

### 38.3 Module Prerequisite Map

Every section in this document defines one or more modules. Instead of assigning a "stage number," each has prerequisites — the modules whose physics must be demonstrably understood first.

| Section | Module | Prerequisites | Layer |
|---------|--------|--------------|-------|
| §0-§3 | Tree, Branch, Trunk | None — foundational | Truth |
| §4 | Filament lifecycle | Tree structure | Truth |
| §5 | Notes | Filament lifecycle | Truth |
| §6 | Projections | Filament lifecycle, confidence | Truth |
| §7 | Social Layer | Filament lifecycle, notes | Truth |
| §8 | User Tree | Filament lifecycle | Truth + Interaction + Game (expands) |
| §9 | Confidence Physics | Filament lifecycle | Truth |
| §10 | Pressure Physics | Confidence, slabs | Truth |
| §11 | Parametric Governance | Voting, confidence | Truth (expands to Game for monster economy lever) |
| §12 | Filter Tolerances | Tree rendering | Truth |
| §13 | Stigmergic Coordination | Twigs, user tree | Truth |
| §14 | Gravitational Time | Filament lifecycle | Truth |
| §15 | Time Scrubbing | Gravitational time | Truth |
| §16 | AI and SCV | Filament lifecycle, projections | Truth (expands: + AR overlay, + spell validation) |
| §17 | Presence System | Proximity, user tree | Truth (expands: + video sphere, + arena) |
| §18 | Flow Channels | Filament lifecycle | Truth |
| §19 | Governance | Confidence, voting | Truth |
| §20 | Cryptographic Architecture | Filament lifecycle | Truth |
| §21 | Templates | Tree, filament, governance | Truth (expands: + genre overlays) |
| §22 | Fractal Scaling | Tree, globe metrics | Truth |
| §23-§24 | Weather, Search | Tree, rendering | Truth |
| §25-§26 | 2D Parity, Frozen Contracts | Core | Truth |
| §28-§32 | Worked Examples, Accounting | Filament, confidence, governance | Truth |
| §33 | LOD Rendering | Tree, rendering | Truth |
| §34-§37 | Use Cases, Migration | Various truth modules | Truth |
| §39 | AR Interaction | Presence, SCV, user tree | Interaction |
| §40 | Genre Overlays & Quests | AR interaction, spell engine, templates | Game |
| §41 | Multi-Resource Economy | Achievements, governance | Interaction (expands: + monster economy) |
| §42 | Duels | Evidence debate: confidence, voting. Spell combat: spell engine, genre overlays | Interaction → Game |
| §43 | Spell Taxonomy | Element detection, light communication, SCV, AR overlay | Game |
| §44 | Founder Key | Global threshold detection | Special governance primitive |
| §47 | Voice Pipeline | SCV, user tree | Truth (expands: + gesture fusion, + incantations) |
| §48 | Engineering Infrastructure | Core | Truth |
| §50 | Camera Controller | Globe | Truth |
| §51-§57 | Scheduling through Adoption Tiers | Various truth modules | Truth |

### 38.4 How Discovery Works

**Personal discovery.** Every capability is pre-defined at system launch with its prerequisite chain. Users find them by doing things. Nobody tells you "now try reflecting light off a blade." You try it. Your SCV captures it. If the captured interaction matches the physics laws defined for that module, the module becomes available. The demonstration IS the evidence, recorded as a filament on your user tree.

**No promotion, no announcement.** The system does not celebrate unlocks. It does not show a progress bar toward "Stage 2." It simply makes new capabilities available when prerequisites are met. Some users will never discover certain modules. That is fine. A farmer managing crops has no need for spell mechanics, and spell mechanics have no need for crop management.

**Community discovery.** Some modules require not just individual understanding but community-wide adoption thresholds. Parametric governance detects sufficient participation. These thresholds are system parameters governed by the community itself.

**Founder key.** Certain global-impact modules (specifically: the monster economy lever, global combat parameters, spawn rate/reward/difficulty curves) require explicit activation by the founder account (Eitan Asulin). This is not a "Stage 3 gate." It is a safety mechanism for modules that fundamentally change the global economic model. The founder key is a single governance primitive — the system can be READY but will not activate these specific modules until the key is turned.

### 38.5 Open-Ended Growth

This is the critical difference from the old stage model. There is no Stage 4 to reach, because there are no stages. There are only modules. New modules get added forever through:

- **Community proposals**: Any user can propose a new module. It enters as a projection (light blue) on the governance tree. Community votes on adoption.
- **Council review**: Proposed modules that pass community vote are reviewed for physics consistency (does this module violate any frozen contract?).
- **Founder approval**: Modules that affect global economic parameters require founder sign-off. All others require only council + community consensus.
- **Git-style versioning**: Accepted modules merge into the system. They have version numbers, changelogs, and dependency declarations — just like code merges into a repository.

Monster worlds to explore on Jupiter get added when someone proposes them, the community wants them, and the council verifies they don't break existing physics. A new spell element gets added when someone demonstrates a real-world detection that the system doesn't recognize yet and proposes it. A new business template gets added when an industry contributes its domain knowledge.

The tree grows forever. The system never stops discovering what it can be.

### 38.6 Module Capability Expansion Table

Modules that expand across layers gain additional capabilities as prerequisites are met. This replaces the old "cross-stage mechanics" table:

| Module | Truth Layer | + Interaction Layer | + Game Layer |
|--------|-------------|--------------------|--------------------|
| **SCV** | Proposes commits, builds projections | + AR overlay, gesture/light/object interpretation, achievement validation | + spell validation, monster generation, summoned combat agents |
| **Presence** | Attention sensor, markers, birds/flocks | + video sphere, camera feed, shared AR view | + arena presence, audience energy, cross-planet video |
| **User Tree** | Responsibility mirror, CV shape | + achievement records, demonstrated capability state | + spell library, quest log, combat record |
| **Templates** | Domain config, attribute bindings | + AR asset catalogs per template | + genre overlay (Sci-Fi/Fantasy/Horror/Military/Adventure) |
| **Resources** | Magnitude (money) only | + engagement credits, achievement tokens, capacity limits | + monster economy lever (spawn/reward/difficulty) |
| **Duels** | N/A | Evidence debate (structured public argument, community voted) | + spell combat, genre overlay, summoned SCV agents, element-based magic |
| **Voice** | Voice commands (speak → Whisper → Architect → Canon → propose) | + voice fused with gesture/light/object signals | + spell incantations as multi-element activation sequences |
| **Governance** | Parametric voting, migration, thresholds | + achievement prerequisites, personal unlock governance | + monster economy parameters, founder key activation |
| **Sonification** | Audio attribute bindings (volume, pitch, timbre, rhythm, spatial) | + AR-rendered sound effects in video presence | + arena atmosphere, spell sound effects |
| **Detection** | Personal device camera only | + detection mesh (surveillance cameras, phones, city infrastructure) | + full distributed mesh as game arena sensor network |
| **Power** | N/A | N/A | Earned through physical element interaction, spent on spells, cannot buy governance |
| **Cards** | N/A | N/A | Physical trading cards as spell catalysts via perceptual hash registry |

**Contract #141 — Relay has no stages, only modules. Every capability is individually discoverable through demonstrated competence, not through tier membership. New modules are added forever through community proposal, council review, and git-style versioning. No module is "higher" than another — complexity of prerequisites does not imply hierarchy. The system grows indefinitely. Where earlier sections reference "Stage Gate: 1→2→3," read "Prerequisites:" instead.**

---

## 39. AR Interaction & Personal Achievement Modules

### 39.1 Video Presence with AR Overlay

Users communicate through video within their user sphere (the camera view). The AR interaction modules add AI-generated graphics to this video feed in real-time:

- **Pre-designed graphic assets**: Users design visual tools, diagrams, annotations, data displays in advance and catalog them in their personal SCV library
- **Voice/gesture summoning**: Users call assets by name or gesture — "show the Q3 revenue chart" or a hand movement mapped to a specific graphic
- **Real-time rendering**: The SCV agent overlays the graphic onto the user's video feed, positioned and scaled contextually
- **Shared view**: Other participants in the conversation see the same overlay

The user's personal SCV agent is a trained assistant that knows their visual vocabulary, their preferred graphic styles, and their library of pre-designed assets.

### 39.2 Physical Object Interfaces

The interaction layer extends beyond voice/gesture to physical objects:

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

All achievements are pre-mapped at system launch. Discovery is organic:

- Achievements span interaction capabilities (light reflection, gesture vocabulary, object mapping, graphic design quality, combat readiness)
- Each achievement requires the SCV to validate the user's action against the pre-defined physics law
- Evidence is the captured interaction itself — video, SCV confirmation log, physics match score
- The achievement is recorded as a filament on the user tree with full evidence chain
- Unlocked capabilities are progressive — each achievement enables access to the corresponding module mechanics

The system never tells users what achievements exist. Users discover them through exploration, experimentation, and community sharing. The achievement tree is a personal journey.

### 39.5 Detection Mesh — Distributed Camera Network

The detection mesh expands the single-camera model into a distributed network where every Relay-authorized camera contributes to the system:

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

## 40. The Game Layer — Quests, Monsters, and Genre Overlays

> *"Do not pray for an easy life; pray for the strength to endure a difficult one."* — Bruce Lee

### 40.1 The Motivation Problem

When the truth layer automates coordination and AR interaction gives humans magical interfaces to the tree, a structural question emerges: why work? If SCVs handle everything, if governance self-manages, if projections are AI-generated — what drives human participation?

Money remains as magnitude (the measurement channel for value), but as a motivator it breaks down when automation handles the labor. Discussion participation provides attention, but spectating automated systems is not purpose.

Humans need adventure. They need to reach for something they don't yet have. The game layer modules provide this through the gamification of reality.

### 40.2 Reality Becomes the Game

Game layer modules overlay genre templates on real-world challenges:

- A **monster on Mars** is a Martian engineering challenge (pressure seal failure, radiation shielding, resource extraction) rendered as a creature with health, weaknesses, and loot
- A **spell** cast to defeat it is an AR gesture/light command that instructs the SCV to execute a real truth-layer action (plasma welding, atmospheric processing, rover navigation)
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

Every level uses the same tree model. Same filaments. Same governance. Same truth layer. Proportionally larger monsters and proportionally larger loot.

### 40.5 Challenges Pre-Mapped

All challenges from microbe to galaxy are pre-defined at system launch:

- Every known planet and system in the Laniakea supercluster has challenge stubs
- Every underlying microbe and atom we need to uncover has a quest stub
- Society collectively establishes (via global parametric governance) what types of AI-generated monsters flow in at each scale
- New discoveries create new challenge stubs automatically as the tree grows

The challenge map is the scientific frontier of human knowledge rendered as a game world.

### 40.6 RPG Attribute Mapping — The User Tree IS the Character Sheet

The game layer does not create a separate RPG database. Your user tree — the same tree you've been building since your first tutorial — becomes your character sheet. Most RPG attributes emerge from existing tree state rather than being tracked independently:

| RPG Concept | Relay Equivalent | Source |
|---|---|---|
| Health | Tree Integrity (aggregate confidence/firmness across all branches) | Emerges from tree state |
| Mana | Power (earned through physical element interaction detected by cameras) | Game layer closed-loop resource |
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

**Health = Tree Integrity.** Your aggregate confidence across all branches. Losing duels, making false claims, neglecting filaments — these degrade your tree, dropping your health. At severe degradation, combat modules are restricted until you rebuild. Rebuilding means doing real work: evidence filaments, close commitments, restore your tree's firmness. Health regenerates through honest participation, not potions.

**Power = Mana.** Earned through physical element interaction (camera detection of light, fire, smoke, rain, snow, wind, earth). Spent on spells. Cannot be purchased, transferred, or converted to other resources. Power capacity (maximum pool) scales with user tree size and maturity. Regenerates during the community-voted sleep cycle (see §41.5).

**Class = Element Affinity.** Your physical geographic environment determines your natural magic type. Live near water → Water spells discovered first. Hot climate → Fire spells. Mountains → Earth spells. Snowy region → Ice spells. Windy area → Wind spells. Travel to discover other elements. Specialization deepens through practice, not menu selection.

**Equipment = Mapped Physical Objects.** Quality comes from training depth, not material value. A wooden stick mapped with 50 recognized gestures outperforms a real sword with 3 gestures. Practice makes equipment legendary.

**Resistances = Branch Strength.** A doctor's user tree has natural resistance to medical challenges. A programmer's tree resists software challenges. Generalists have moderate resistance to everything. This isn't allocated — it emerges from your actual tree.

### 40.7 The Core Game Loop

1. **Wake up.** Open Relay. SCV shows: local monsters, available quests, duel challenges, daily Power regeneration from sleep cycle.
2. **Choose your path.** Go to work (truth/interaction modules — real contributions, faster resource accumulation). Hunt monsters (game layer modules — fight challenges for resources). Train (practice spells, map objects, explore for treasure). Duel (challenge someone for resources and reputation).
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

**Earned public graphics are the exception.** Users who have unlocked game layer modules and perform correct physical trigger sequences (real-life movements + cards + voice incantations + element detection) get pre-programmed Relay Graphics rendered in the public world. These are the ONLY non-data visuals in the shared space. They are rare, impressive, and proof of skill.

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

**Layer 8 — "Camera Sees Things":** User accidentally triggers an AR detection (light reflection, gesture pattern). Sees unexpected response from the system. Begins experimenting. The interaction layer reveals itself.

**Layer 9 — "Magic Is Real":** User triggers a spell (card + element + voice). Graphics appear in the public world. Monsters become visible. Treasure chests appear. The game layer reveals itself.

No tutorial for the game layer. No onboarding walkthrough for discovery mechanics. No feature list. The fog lifts as you explore. Two users who started on the same day discover different things in different orders based on their behavior. Knowledge has value — sharing discoveries creates guides, hoarding creates advantage. The system rewards curiosity. (Note: this applies to game layer discovery. Platform onboarding — how to navigate the globe, commit filaments, and use governance — is covered by §73 Universal Onboarding. Both systems coexist.)

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

> *"It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change."* — Charles Darwin

**Prerequisites:** None for base (magnitude as single resource channel). Expands with: achievement modules → engagement credits + achievement tokens + active capacity. Founder key + combat modules → monster economy lever (spawn rate, reward magnitude, difficulty curve as governed parameters).

### 41.1 The Starcraft Model

The truth layer uses a single resource channel (magnitude/money). The interaction layer modules introduce a multi-resource economy with three distinct channels inspired by real-time strategy resource management:

| Relay Resource | Starcraft Analog | Earned From | Gates |
|----------------|------------------|-------------|-------|
| **Engagement credits** (base) | Minerals | Any participation: virtual monsters, comments, votes, commits, sticky notes | Sticky note quota, basic vote weight, basic posting capacity |
| **Achievement tokens** (advanced) | Vespene Gas | SCV-validated achievements in any context: real-world, arena, education, civic (§71.2) | Advanced vote power, commit authority, projection creation, spell catalog expansion |
| **Active capacity** (limit) | Supply cap | Investment of both base + advanced resources to expand | Max concurrent filaments, active SCVs, simultaneous spells, parallel quest slots |

### 41.2 Incentive Structure

You CAN survive on engagement credits alone by farming virtual monsters. You'll have basic functionality. But you will NEVER gain advanced capabilities (strong votes, projection authority, expanded spell catalog, larger capacity) without achievement tokens — and those come from SCV-validated achievements in any context: real-world contributions, arena victories, educational milestones, or civic service (§71.2).

This creates a permanent incentive gradient toward real contribution even when virtual participation is easier.

### 41.3 The Global Economic Lever

With game layer modules active, monster spawn rate and reward rate replace central banking mechanisms:

- **Monster spawn rate**: How many challenges flow in per unit time at each scale. Higher rate = more earning opportunities.
- **Reward magnitude**: How much value (engagement credits + achievement tokens) each monster yields. Higher magnitude = faster accumulation.
- **Difficulty curve**: How hard monsters are relative to player capability. Steeper = slower farming, shallower = faster farming.

These three parameters are set by global parametric governance (same weighted-median voting from the truth layer). Everyone votes. The parameters flex the economy the way interest rates and reserve requirements do today.

If too much wealth accumulates and engagement drops → increase difficulty, decrease rewards.
If too little activity and too many idle users → increase spawn rate, increase rewards.

Even users who do not perform physical-world labor must fight virtual monsters to earn. This ensures universal participation in the economic system while allowing the difficulty/reward balance to be democratically controlled.

### 41.4 Resource Flow Integration

All resources flow through truth layer filaments:

- Engagement credits are magnitude on activity filaments
- Achievement tokens are magnitude on achievement filaments (with SCV validation evidence)
- Capacity limits are derived from user tree state (total achievement + investment filaments)
- Resource transfers between users follow the existing double-entry TransferPacket model
- All resources are subject to the same frozen contracts (append-only, deterministic replay, Merkle roots)

No new data primitives. The multi-resource model is a categorization of existing magnitude channels.

### 41.5 Power — The Game Layer Resource

Power is the fourth resource, existing only within the game layer's closed loop:

| Property | Rule |
|---|---|
| **Earned from** | Physical element interaction detected by camera (light, fire, smoke, rain, snow, wind, earth) + correct gesture/movement sequences |
| **Spent on** | Casting spells (element spells + card spells), maintaining enchantments, summoning creatures |
| **Cannot** | Buy governance weight, purchase Achievement Tokens, transfer to other users, convert to Engagement Credits |
| **Capacity** | Maximum Power pool scales with user tree size and maturity (bigger tree = more mana) |
| **Regeneration** | Regenerates during the community-voted sleep cycle (see §41.6). Ambient regeneration from environmental element detection during waking hours. |

Power exists in a closed loop: earn through physical action → spend on spells → spells resolve to truth/interaction layer actions you already have permission to perform. Power never grants new permissions, new governance weight, or new economic advantage. It makes the same actions more dramatic and entertaining without making them more powerful.

### 41.6 Sleep Cycle Regeneration

Resource limits regenerate during a community-governed daily rest period:

- The sleep cycle **duration** is a global parameter set by weighted-median voting (e.g., 7 hours 12 minutes — voted by billions of interested users)
- The sleep cycle **timing** is regionalized by real solar position (see §14.4): sleep onset triggers when local solar altitude drops below the voted threshold (default: civil twilight at -6°), sleep end triggers at the corresponding dawn threshold. Equatorial users get a consistent window year-round. High-latitude users shift with seasons. Extreme-latitude users (above ±66.5°) fall back to a UTC-offset schedule.
- During the sleep cycle, resource limits (sticky note quota, Power pool, active capacity cooldowns) regenerate
- Users who do not rest (keep their device active continuously) hit resource ceilings and cannot regenerate
- This simultaneously: prevents bot spam (bots don't sleep), incentivizes healthy human behavior, creates a natural rate limit on all activity, and is transparently governed

The sleep duration parameter is adjustable like all global parameters. If the community votes it down to 6:45, the system adjusts. If evidence shows 8 hours is healthier and the community shifts, it shifts. The sleep onset/end solar thresholds are also votable global parameters — the community controls not just how long the rest is, but when it begins relative to sunset/sunrise.

### 41.7 Value Hierarchy Principle

**Truth layer responsibility always outweighs game layer power.** This is structural, not policy:

- A diligent auditor managing 5 companies with thousands of well-evidenced filaments has more governance weight, more economic resources, and more real influence than any game-focused wizard
- Achievement Tokens (earned from real work) gate advanced capabilities that Power (earned from gaming) cannot access
- Vote weight derives from Engagement Credits and Achievement Tokens, never from Power
- A powerful wizard in Relay is entertaining and respected. A responsible auditor holding thousands of human responsibility filaments is essential and trusted. Both are valued. Neither diminishes the other. But the tree economics ensure real contribution always yields more than virtual performance.

The game provides a comfortable living — people CAN survive by gaming well and fighting monsters through game layer modules. But truth layer work with verified evidence will always yield deeper governance weight and influence, because the evidence depth of real-world contribution naturally builds thicker, firmer branches than arena performance alone. Achievement Tokens can be earned in any context (amended contract #30, §71.2), but the validation standard (SCV-verified evidence of demonstrated skill) means real-world contributions produce richer evidence chains.

### 41.8 Anchor Allowance — The Physical-Digital Bridge

Digital presence must be justified by physical reality. A company does not receive a magic budget — its internal operating resources are earned through verified physical existence and employee participation.

**Anchor Allowance** is the EC pool an organization can use for internal operations (replenishment, filing, commits, branch maintenance). It is funded by three streams:

| Stream | Mechanism | Contribution |
|--------|-----------|-------------|
| **Employee participation** | Each employee earning EC through normal use (commits, votes, interactions) contributes a governed fraction to the org pool | Primary source — scales with real human activity |
| **Proximity channel uptime** | Being physically present with a verified proximity channel (§29) generates a base allowance per epoch | Secondary source — proves the org physically exists |
| **Public engagement** | External users interacting with the company's public content generate EC that flows to the org pool | Tertiary source — market validation |

**The key rule: no verified physical presence = no anchor allowance = no free internal operations.** An organization without a real, verified location can still exist on Relay, but every operation costs personal EC from its individual members — like a freelancer collective, not a corporation.

Anchor allowance is not unlimited. The base rate from proximity channel uptime is a global parameter (votable). Employee contribution fraction is a global parameter (votable). The allowance caps scale with verified employee count and physical site size (number of distinct proximity micro-zones), preventing a single phone hotspot from generating the same allowance as a 500-person office.

**Replenishment funding:** Branches with `replenishmentMode = AUTO` (§5 — balance sheets, directories, registries, master data) draw from the org's anchor allowance each timebox. If the allowance is depleted, replenishment pauses and those branches sink like everything else until more EC flows in. This creates a natural feedback loop: organizations that stop functioning (employees stop participating, proximity channel goes offline) see their branches sink and their surface view go stale.

### 41.9 Real-World Currency Boundary

Relay is not a currency, not a payment system, not a cryptocurrency. Real money (USD, EUR, ILS, etc.) continues to work exactly as it does today. When a company records an invoice on Relay, the `magnitude` field contains the real monetary value — Relay tracks the flow of real money as filaments, but it does not create or replace money.

**EC cannot be bought with external currency.** If EC could be purchased, wealthy actors would dominate governance — this violates the physics. Companies fund infrastructure (servers, hosting, bandwidth) with real money, but this buys compute, not EC. Real money pays for Relay the way it pays for electricity — it is an operating cost, not a governance input.

**Votes cannot be bought.** Vote weight is contextual: recency of participation, evidence contribution history, and active filament involvement on the branch (frozen contract #56). An account with no branch history carries near-zero vote weight regardless of how it was funded. Money can buy infrastructure time, marketing, employees — but not Relay governance weight.

**The one-line rule: money buys infrastructure; participation earns EC; EC enables operations; nothing buys votes.**

---

## 42. Duels — Governance Theater & Public Combat Events

> *"In the middle of difficulty lies opportunity."* — Albert Einstein

**Prerequisites:** Confidence, voting, evidence modules for base (evidence debate: two users present arguments with data visualizations, community votes on outcome, resources transfer). Expands with: spell engine + genre overlay modules → full duel with spell combat, summoned SCV agents, element-based magic, arena atmosphere with music/sound/audience energy.

### 42.1 Mechanic

A duel is a structured public engagement between two users over an issue:

1. **Challenge**: User A challenges User B on a specific issue (filament or branch). Both agree to terms: duration, resource stakes, topic scope.
2. **Arena**: Both users appear in their user spheres (video on camera). The event is classified as a public filament — visible to all, classified as an event.
3. **Performance**: Each user physically wields their interface objects (swords, etc.) and calls out spells. The "spells" are actually:
   - Evidence claims: summoning specific filaments and projections prepared in advance
   - Data analyses: calling out wind projections, correlation data, trend charts
   - Counterarguments: referencing the opponent's evidence chain weaknesses
4. **Audience**: Viewers watch, react. Music, sound, audience energy drive the arena atmosphere. The engagement rate of the event filament climbs.
5. **Resolution**: The audience determines the outcome through continuous voting and environmental metrics aggregated into the scoring calculation. Resources transfer from loser to winner based on the community's aggregate judgment. Audience influence is a toggleable attribute agreed upon in the challenge terms — when toggled ON, local crowd bias is part of the fight; when OFF, resolution is evidence-only. (See §71.3 for unified duel/arena resolution model.)
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

Game layer duels use an alternating turn structure that provides strategic depth:

1. **Preparation phase** — Both duelists set up: present land cards to establish element base, cast enchantments, declare equipment mappings. No attacks.
2. **Alternating turns** — Duelists alternate. On your turn you may: present one sorcery card OR summon one creature OR cast element spells (gestures/voice) OR present evidence/arguments. Your opponent may respond with instant cards before your action resolves.
3. **Combat** — Summoned creatures clash automatically (SCV-controlled). Creature power/toughness determines outcomes. Losing creatures dissolve.
4. **Evidence phase** — On your turn, present evidence (call out filament references, display projections, invoke data analyses). This is the intellectual substance underneath the spectacle.
5. **Resolution** — After agreed number of rounds (or concession), audience votes. The vote considers both combat spectacle AND evidence quality.

**The Stack:** When you cast a spell, your opponent can respond with an instant before it resolves. You can respond to their response. Spells chain until both pass, then resolve in reverse order (last spell first). This creates the strategic interplay where timing, card selection, and bluffing matter as much as raw Power.

**Card Advantage:** Discovering more spells (element + card) gives you more options. But having more options doesn't guarantee victory. A skilled duelist with five well-chosen spells and strong evidence defeats a wizard with a hundred spells and weak arguments. The evidence phase is where truth layer substance meets game layer spectacle.

### 42.5 Substance vs Spectacle — Two Paths to Victory

Duels are persuasion systems, not fighting games. The audience votes on who convinced them:

**The spectacle path (game layer strength):**
- Physical performance: sword work, acrobatics, element manipulation
- Card-based combat: creature summons, enchantments, combo sequences
- Visual drama: fire effects, lightning, environmental AR
- Entertainment value: keeping the audience engaged and impressed

**The substance path (truth layer strength):**
- Voice commands to a deeply trained SCV: "Show my tree," "Pull their confidence scores"
- Tree projections: displaying credentials, counterparty relationships, completion history
- Evidence-based arguments: referencing publicly verifiable tree data
- Reputation weight: tree shape communicates reliability without a word spoken

An auditor sitting on a barstool can defeat a combat-focused duelist by calmly displaying their massive, firm user tree and pointing out the opponent's unfinished filaments. The audience votes on trust, not theatrics. The auditor's "spells" are SCV voice commands and data projections — no physical movement required.

Conversely, in a gaming arena full of combat enthusiasts, spectacle might win over substance if the audience values entertainment. Context determines which path prevails. The system doesn't prescribe.

### 42.6 Proximity Channel Duels

Duels in physical proximity channels (bars, parks, offices) use the location's authorized cameras as the detection and corroboration system:

- The venue's surveillance cameras + all patrons' phones with Relay active = multi-angle detection mesh
- Both duelists' actions are captured from multiple angles with high corroboration confidence
- Spectators vote through the proximity channel — only physically present people vote
- Stakes can be purely social (loser leaves, winner gets bragging rights) with zero resource transfer
- The duel filament is permanent: challenge acceptance, turns, evidence presented, vote result, outcome — all append-only

---

## 43. Spell Taxonomy — Element Detection & Physical Magic

> *"Any sufficiently advanced technology is indistinguishable from magic."* — Arthur C. Clarke

**Prerequisites:** AR interaction, light-communication, and object-interface modules. Element detection, spell validation, spell library, and geographic magic become available once the user demonstrates competence with those prerequisite modules. The monster economy lever (global spawn/reward parameters) additionally requires the founder key.

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
2. **Activation**: User performs the gesture/light/object interaction (AR interaction modules)
3. **Validation**: SCV confirms the interaction matches a cataloged spell from the user's library
4. **Rendering**: AR interaction pipeline renders the spell effect on the user's video feed
5. **Execution**: SCV translates the spell into truth layer actions (filament queries, projection creation, evidence retrieval, commit proposals)
6. **Result**: The truth tree updates accordingly (via normal commit mechanics, never bypassing frozen contracts)

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

Treasure chests are pre-mapped locations in the Relay coordinate system where a visual marker appears (visible to users who have unlocked game layer modules). Opening a chest reveals a clue — a partial description of a spell trigger, a hint about which element is needed, a riddle about the right gesture. Chests provide knowledge, never Power or spells directly.

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

## 44. Founder Key — Global Game Layer Activation Primitive

### 44.1 The Key

Global game layer activation requires a special governance primitive that exists outside the parametric voting system:

- **Holder**: The founder account (Eitan Asulin) — singular, non-transferable
- **Condition A**: System parameters reach thresholds initially set by the founder at system launch. These thresholds are enhanced (made more precise, more demanding) by eligible players who have unlocked AR interaction modules over time through parametric governance, but the BASELINE thresholds are founder-set.
- **Condition B**: Explicit activation by the founder account. Even when Condition A is met, founder-key-gated game layer modules remain inactive until the founder acts.
- **Irreversibility**: Once activated, the game layer cannot be deactivated. The key turns once.

### 44.2 Why a Founder Key

Every other governance mechanism in Relay is community-driven (parametric voting, migration commits, threshold triggers). The game layer founder key is the single exception. It exists because the game layer represents a civilizational shift in how humans interact with reality. The collective readiness must be validated not just by metrics but by human judgment at the highest level of system responsibility.

### 44.3 Day-1 Setup — What the Founder Deploys

On day 1, the founder establishes the complete system foundation:

1. **Truth layer ruleset and template library** — published, transparent, governable from day 1
2. **Interaction/game layer physics engines** — deployed on every client, running silently. The detection engine (element recognition, card matching, gesture detection) operates from the first moment any camera turns on. Before module activation, accumulated detections have no visible effect — but the engine is learning.
3. **Encrypted spell registry** — the complete mapping of trigger combinations to spell effects, hashed and sealed. Deployed to every client as encrypted data. Cannot be read without physically presenting the matching input (card, gesture, element) to a camera.
4. **Relay Set Item registry** — the complete list of physical objects (cards, dice, POGS, etc.) with Relay meaning, perceptually hashed and encrypted alongside their effects
5. **Treasure chest coordinates** — all treasure locations and clue content, encrypted and distributed
6. **Game layer activation thresholds** — the community metrics that must be met before the founder key can turn (published as targets, not secrets)
7. **Initial global parameters** — sleep cycle duration, spam threshold, vote eligibility age, and all other system parameters with starting values (immediately governable by community voting)

**Founder constraints after day 1:**
- Cannot modify frozen contracts
- Cannot override governance votes
- Cannot grant themselves extra Power or resources
- Cannot secretly change spell rules (the registry is hashed and verifiable — any tampering breaks the hash chain)
- CAN append new spells, treasure chests, and Relay Set Items to the registry (append-only, never modify or remove existing entries)
- Cannot activate game layer before community thresholds are met

### 44.4 Pre-Activation State

Before game layer global activation:
- Game layer challenge stubs exist in the system but are inert (visible as future content, non-interactive)
- Monster generation AI is dormant
- Duel mechanics are restricted to evidence debate format (without genre overlay or spell combat)
- Multi-resource economy operates on engagement credits + achievement tokens only (no monster-economy lever)
- Genre templates exist as specifications but do not render
- Power accumulates silently from element detection but has no use
- Spell triggers produce no visible effect (the engine detects them but doesn't activate)
- Treasure chests are invisible

After activation: all game layer modules activate globally and simultaneously. Power becomes spendable. Spells become castable. Monsters spawn. Treasure chests appear. The game begins. The fog of war starts lifting for those who explore.

---

## 45. Frozen Contracts — Module Mechanics + Constitutional Hardening

The following contracts extend the frozen contract list (§26). Contracts 28-44: module layer mechanics. Contracts 45-53: structural additions. Contracts 54-67: constitutional hardening. Contracts 68-74: identity, dispute resolution, and growth model. Contracts 75-85: sociological resilience and sortition accountability. Contracts 86-89: Relay Council, module pipeline, escalation hierarchy, draft → commit universality.

28. **Layers are additive**: Each conceptual layer (Truth, Interaction, Game) enhances the layers below it. Removing a layer does not break the layers below. Game layer commands resolve to AR interaction rendering, which resolves to truth layer filament commits. No module may bypass a lower-layer prerequisite.
29. **Achievements are evidence-based**: Personal module achievements require SCV-validated proof recorded as filament evidence on the user tree. No achievement is granted by fiat, vote, or purchase.
30. **Skill yields more than participation**: Achievement tokens can be earned through SCV-validated achievements in any context — truth layer, arena, education, civic contribution. The validation requirement (demonstrated skill with evidence) is non-negotiable. Participation without demonstrated skill yields engagement credits. The gradient is: validated skill → AT, participation → EC, spell casting → Power. (Amended by §71.2.)
31. **Spells resolve to commits**: Every spell, regardless of visual effect or genre overlay, ultimately resolves to one or more truth layer filament operations (query, commit proposal, evidence reference). No spell bypasses frozen contracts 1-27.
32. **Duels are public filaments**: Duel events are classified as public filament events. Community votes on duel outcomes follow standard vote governance (eligibility gates, decay, threshold mechanics). Sword skill does not grant governance power — evidence quality does.
33. **Genre is a rendering template**: Genre overlays (Sci-Fi, Fantasy, Horror, etc.) are visual templates applied at the rendering layer. They never modify the underlying truth. A monster rendered as a dragon and a monster rendered as an alien are the same engineering challenge underneath.
34. **Founder key is singular**: Global game layer activation requires explicit action by the founder account. No parametric vote, governance proposal, or community threshold can activate the game layer without the founder key. Once activated, irreversible.
35. **Monster economy is governed**: Monster spawn rate, reward magnitude, and difficulty curve are global parameters set by parametric governance (weighted-median voting). No central authority sets these values. The community controls its own economic lever.
36. **Voice commands are proposals**: Voice-initiated actions follow identical governance to any other input modality. No voice command bypasses commit materiality, work zones, human approval, or any frozen contract. Voice transcripts are attached as evidence on the resulting commit.
37. **Architect parses, Canon proposes, Human decides**: The three-stage voice pipeline (Whisper → Architect → Canon) is non-collapsible. No shortcut from raw audio to committed filament. Architect only parses, Canon only proposes, and the human is the sole authority to approve.
38. **Power cannot buy governance**: Power (game layer resource) exists in a closed loop for spell casting only. It cannot be converted to Engagement Credits or Achievement Tokens, cannot increase vote weight, cannot modify filament confidence, and cannot override any governance decision. Power grants spectacle, never authority.
39. **Public world graphics are earned only**: The shared Relay globe has no custom graphics by default. The only non-data visuals in the public world are pre-programmed Relay Graphics triggered by physically performing correct trigger sequences (element + gesture + voice + optional card). No cosmetic purchases. No avatar customization. Graphics are proof of skill.
40. **Bystander privacy is absolute**: The detection mesh (Relay-authorized cameras) only processes entities with active Relay presence markers. Non-Relay users and people who have disabled their presence are never processed, tracked, or rendered. No exceptions.
41. **Card and spell registries are append-only**: The founder can add new spells, cards, treasure chests, and Relay Set Items after launch. Existing mappings are immutable — once a card is mapped to a spell effect, that mapping never changes. Tampering breaks the hash chain and is detectable.
42. **Truth layer responsibility outweighs game layer power**: Achievement Tokens (from real-world contribution) gate advanced capabilities that Power (from gaming) cannot access. No amount of game layer performance can surpass the governance weight, economic resources, or system influence earned through truth layer real-world work.
43. **Sleep regeneration is community-governed**: The daily rest cycle duration is a global parameter set by weighted-median voting. It simultaneously rate-limits activity, prevents bot abuse, and incentivizes healthy behavior. The parameter is adjustable by the community, never hardcoded.
44. **Organizational and global confidence are independent channels**: `orgConfidence` (evidence_present / evidence_required) drives slab opacity. `globalConfidence` (community vote alignment) drives globe ranking. Neither overrides the other. No code path may average, blend, or merge them. Separate storage, separate setters, separate arithmetic. Mandatory `DUAL-CONFIDENCE-SEPARATION-PROOF` verification artifact.
45. **Tier-gated attention at globe LOD**: Anonymous accounts (Tier 0) cannot contribute to attention metrics at GLOBE or REGION LOD. Attention from Tier 0 users is excluded from trunk prominence calculations. This prevents bot-farming of globe visibility. Tier 1+ identity (verified via SCV or proximity) is required for attention signals to propagate above COMPANY LOD. Enforcement: the attention aggregation function at GLOBE LOD filters input by identity tier before computation.
46. **Monster economy rate-of-change caps**: Global parameters governing monster spawn rate, reward magnitude, and difficulty curve are subject to per-epoch rate-of-change caps. No single governance vote cycle may change any of these parameters by more than 20% from the previous epoch's value. This prevents economic shock from sudden parameter manipulation. The cap itself is a frozen constant — not subject to parametric governance.
47. **Resource non-convertibility is explicit and total**: The three resource types (Engagement Credits, Achievement Tokens, Power) exist in strictly separated pools. No mechanism — governance vote, founder action, SCV operation, spell effect, duel outcome, or economic event — may convert one resource type to another. No exchange rate exists. No marketplace may be created. The separation is structural (different ledger types), not policy (a rule that could be voted away).
48. **Founder activation requires attestation commit**: Global game layer activation (the founder key) requires a signed attestation commit on the founder's user tree. This commit records: activation timestamp, the exact parameter state at activation (all global parameters + their weighted-median values), and a declaration of readiness. The commit is append-only and Merkle-sealed. It serves as permanent evidence of the activation decision, preventing post-hoc disputes about "when the game layer was turned on" or "what state the system was in."
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
61. **Prohibited trigger taxonomy and venue safety defaults**: A frozen registry of prohibited spell triggers exists. Categories: triggers requiring combustion or open flame in enclosed spaces, triggers requiring high-altitude physical positioning, triggers directed at or near minors (age-gated by identity tier), triggers in designated safety zones (hospitals, schools, airports). Venue templates include a `safetyProfile` field that defaults to `restricted` for educational, medical, and transportation venues. Venue operators may loosen restrictions only via explicit governance commit on their tree. Game layer modules are disabled by default in `restricted` venues.
62. **Presence anti-correlation and time-bucketing**: Presence updates transmitted beyond the local device are time-bucketed: at COMPANY LOD, updates are quantized to 5-second intervals. At REGION LOD, 30-second intervals. At GLOBE LOD, 5-minute intervals. Additionally, position precision degrades with LOD: COMPANY = 10m accuracy, REGION = 1km, GLOBE = 50km. Movement correlation attacks (inferring identity from motion patterns) are structurally mitigated by the combination of time-bucketing + precision degradation + statistical aggregation above COMPANY LOD.
63. **Blended confidence CI lint**: The `DUAL-CONFIDENCE-SEPARATION-PROOF` must run as a pre-commit gate. Any code path that introduces `computeConfidence()` calls (outside the deprecated trap), arithmetic expressions combining `orgConfidence` and `globalConfidence`, or shared setter functions for both channels must fail the proof and block the commit. This is enforced via pre-commit hook, not voluntary discipline.
64. **Git attachment hygiene**: Binary files larger than 500KB are blocked from Git commits by pre-commit hook. Evidence attachments (images, PDFs, video) are stored in content-addressed external storage (SHA-256 hash as key). Git stores only the content hash reference. Proof artifacts (screenshots, logs) are exempt up to 2MB per file. The hook is mandatory and cannot be bypassed without explicit `--no-verify` (which is logged as a governance event).
65. **Renderer over-instantiation refusal**: The filament-renderer enforces hard primitive budgets per LOD level (§33.2). When instantiation would exceed the budget, the renderer emits `[REFUSAL] reason=PRIMITIVE_BUDGET_EXCEEDED lod=<level> requested=<n> budget=<max>` and does NOT create the excess primitives. The world stays interactive. LOD budgets are frozen constants, not runtime-adjustable. This prevents the 100k-marker catastrophe.
66. **Camera operator liability model**: Any venue or organization connecting cameras to the Relay detection mesh must register as a **Data Processor** via a governance commit on their tree. The commit specifies: processing scope (which detection types are enabled), data retention period, geographic boundary of camera coverage, and the designated **Data Controller** (the legal entity responsible for compliance). Relay is the platform provider, never the controller. The operator model document is part of the legal posture requirement (contract #51). No camera connection is accepted without a registered processor commit.
67. **Founder activation jurisdiction checklist**: Game layer global activation (founder key) requires, in addition to the attestation commit (contract #48), a jurisdiction compliance checklist commit. This commit records: jurisdictions where Relay instances are active, per-jurisdiction compliance status (GDPR, CCPA, COPPA, local camera/privacy law), any jurisdictions where game layer modules are restricted or prohibited, and the legal posture document hash for each jurisdiction. Activation without the jurisdiction checklist emits `[REFUSAL] reason=JURISDICTION_CHECKLIST_MISSING` and blocks the key.
68. **Sortition juries are the sole dispute resolution mechanism**: No founder decree, admin action, or majority vote can override a jury verdict on dispute cases (Sybil enforcement, community disputes, quarantine appeals, governance deadlocks). The 4:3:3 sortition ratio (random:volunteer:historic), cryptographic selection, and bias detection are frozen. The sortition mechanism itself can be refined (jury size, eligibility thresholds) via parametric governance, but its existence and primacy over other resolution methods cannot be removed.
69. **Password Dance uses the spell detection pipeline**: The somatic authentication system (Password Dance) MUST use the same on-device camera detection pipeline (facial landmark extraction, motion vector analysis, audio feature extraction) that is used for spell trigger detection in the interaction/game layer modules. No separate biometric system may be introduced. This ensures: pipeline validation from day 1, per-user calibration data, and muscle memory training for downstream spell interaction. The Password Dance is required for STRICT authentication level only; PIN is sufficient for BASIC and ELEVATED.
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
80. **Truth layer visibility is structurally primary**: At every LOD, the rendering engine prioritizes evidence structure (filaments, timeboxes, lifecycle states, confidence indicators) before spectacle overlays (spell effects, duel animations, monster visuals, weather). Spectacle layers can be toggled off by the user; evidence layers cannot. The default view always shows evidence structure. Game layer visual effects are additive overlays on the truth layer, never replacements. If the rendering budget is exceeded, spectacle is shed first, evidence last.
81. **Founder succession — Guardian Steward model**: If the founder account is inactive for the succession trigger duration (initial value: 365 consecutive days, global parameter — votable), succession authority transfers to the founder's designated guardian account. The guardian is elevated to **Steward of Relay** — a role with the same activation authority and constraints as the founder (cannot modify frozen contracts, cannot override governance, can only activate the game layer when thresholds are met). The new Steward receives a full Relay Founder-level tutorial and initiation sequence covering: all frozen contracts, the activation checklist, the jurisdiction compliance process, the attestation commit procedure, and the philosophical responsibility of the key. The Steward role is singular (one person). If the Steward's account also becomes inactive for the same succession trigger duration, the same succession process repeats to THEIR designated guardian. If no guardian is designated or the guardian account is also inactive, the Relay Sortition Council (§46.8) assumes activation authority as the final fallback (unanimous 7/7 consent required). The founder retains full user-level participation rights but loses sole activation authority upon succession. The existence of succession is frozen; the inactivity duration is votable.
82. **Emergency reform mechanism**: If a governance parameter or state causes demonstrable harm (3+ refusal logs per epoch or measurable system degradation in proof artifacts), a compressed reform path activates: 2x normal supermajority threshold (80% instead of 60%) with 1/4 normal settlement window. This allows urgent correction of harmful states without making routine governance changes easy. The emergency threshold and compression ratio are frozen.
83. **One-sentence explanation invariant**: Every governance mechanic that affects a user (vote weight change, parameter movement, reverification requirement, jury selection, trust score change, authentication escalation, migration trigger, confidence update) MUST display a one-sentence plain-language explanation in the UI at the point of interaction. Not in documentation, not in a help page — in the interface, at the moment it matters. If a mechanic cannot be explained in one sentence, the UI must still provide a summary with a drill-down option. Opacity is the primary legitimacy risk at scale; this contract is the defense.
84. **Regions vote features on or off**: Each region or jurisdiction governs its own feature set through standard parametric voting (§11). If a region's population votes to disable AR overlays, spell detection, duels, or any interaction/game layer module, those modules are disabled in that region's trees. This is not a system fork — it is branch-level parametric governance. The core truth layer is always active everywhere. Regional feature votes are visible globally: everyone can see that "Japan disabled AR overlays" or "Tokyo is a hotspot for RTS-style duels." This transparency lets the global community see which regions embrace which modules, creating natural cultural identity within the unified system. Cross-region references use Merkle inclusion proofs (hash only, not content). No system-level fork is needed — the fractal model handles regional diversity natively.
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

102. **No hardcoded operational parameters**: Every numeric duration, threshold, ratio, interval, or limit in the system that affects user behavior or system operation is classified as either: (A) a global parameter with a founder-set initial value, immediately votable by the community; (B) a founder lever (module activation keys, registry additions); or (C) a physics constant frozen in contract. Category A values are listed in the Global Parameter Registry (§11.6). If a value is not in the registry, it must be classified before implementation. No operational parameter is permanently hardcoded.

103. **No compute without observation**: Projections only evaluate when inside a viewer's active sight bubble or when explicitly published by a branch scope. Unpublished, unviewed projections hold their last cached result and consume zero compute. Content-based memoization ensures projections on stable branches (no new commits) cost nothing regardless of viewer count. This is the core invariant that prevents projection graph explosion at planetary scale.

104. **Projection instance cap per branch**: Each branch has a maximum number of active projections (initial value: 500, global parameter — votable). When the cap is reached, new ephemeral projections are queued and oldest ephemeral projections are evicted. Promoted projections count toward the cap but are never evicted. This prevents any single branch from becoming a compute black hole.

105. **Vote anonymity is architecturally supported**: Eligibility + uniqueness are always provable; vote choice secrecy is template-defined by vote class. Private-by-default votes (ideology, preference, cultural, belief) use encrypted choice payloads with blinded aggregation. Public-by-default votes (spending, delegation, evidence certification, governance parameters, anything creating obligations for others) are fully visible responsibility records. A vote that creates obligations for others cannot be forced private. A pure opinion vote cannot be forced public. Both modes are frozen. Templates define which class applies; the community can override defaults via parametric governance.

106. **Sight radius and atmospheric compression**: Every user has a visibility bubble. Objects inside render at full LOD-appropriate detail. Objects outside simplify progressively (fewer primitives, aggregate textures) but remain visible in truthful form — nothing vanishes. Branch aggregate metrics (health, weight, confidence, shape) are computed from all authorized filaments within scope regardless of viewer (scope-truth, server-side). Rendering detail respects disclosure tiers per viewer — private filament details do not render, but the branch's truthful aggregate shape is always visible. Two users always see the same branch shape even if they see different internal details. The sight radius is the fundamental mechanism that makes a world of billions of objects renderable on a single device.

107. **Sleep cycle timing follows real solar position**: Sleep onset triggers when local solar altitude drops below the voted onset threshold (initial: -6° civil twilight). Sleep end triggers at the voted end threshold. High-latitude regions (above the voted extreme latitude threshold, initial: ±66.5°) fall back to UTC-offset schedules during polar day/night. Transition smoothing interpolates between solar and UTC schedules near the threshold. All sleep-timing thresholds are global parameters (votable). The sleep duration is global; the timing is solar-regional.

108. **Session state persists across close/open**: When a user closes Relay or loses connectivity, the system saves their complete working context (camera position, active tree/branch/filament, LOD state, render mode, inspector panels, filter settings, SCV conversation, Note drafts). On return, Relay restores this state exactly. If the referenced tree or branch has been migrated or is no longer accessible, the system falls back to globe view with an explanatory message. The default first-time boot is globe view. Session state is personal data stored at `disclosureTier = 0`. Filter settings are never leaked because they reveal what the user hides. This is a core UX guarantee, not an optional feature.

109. **Cross-section mode is read-only**: Entering cross-section inspection mode (§3.13) never modifies data. Slab expansion is a rendering-only magnification. Scrubbing through rings does not pause gravity — time keeps sinking during inspection. Filament positions are always derived from commit timestamps. No separate archive copy is created for the cross-section view. The rings ARE the data viewed from a different angle.

110. **Organic variation is rendering, never data**: Slab thickness variation by theta, Perlin noise on ring surfaces, bark ridge deformation at schema boundaries, and scar crack warping of adjacent surfaces (§3.14) are all rendering effects. They never modify the underlying slab data, filament coordinates, or commit records. Two renderers showing the same branch at the same time must agree on data positions even if they disagree on visual noise seed. The organic aesthetics serve legibility — they never compromise deterministic replay (frozen contract #15).

111. **Weather overlays never move truth**: Heat tiles, fog overlays, storm flicker, and lightning cascade flashes (§3.16) are deterministic overlay computations rendered from timebox aggregates. They never affect: vote weight, confidence values, permissions, execution priority, resource earning rates, governance authority, or any parameter that determines what a user CAN DO. Weather overlays are a lens. If weather ever influences a decision gate, the system becomes performative and gameable. Weather overlays can be toggled off by the user; the truth layer underneath (filaments, slabs, scars) cannot. Branch lean and droop are physics (not overlays) and cannot be toggled off.

112. **Branch motion is emergent, never animated**: A branch moves for exactly three reasons: lean (from net counterparty θ pressure at timebox close, §3.15), droop (from slab wilt = confidence deficit, §3.7), and twist (from helix period = time grain, §3.5). No other motion exists. No wiggle, bounce, sway, or decorative animation. If a branch moved, the data changed. If the data didn't change, the branch is still. Motion updates at timebox boundaries, not per frame. Wind is not rendered as arrows or indicators — wind is the pattern of branch lean observed during time replay (§3.15). This is the "if it moves it means something" guarantee.

113. **Branch lean is explainable to one click**: Every branch lean direction must be traceable to specific filaments and counterparties within one user interaction (click → contributor panel). No unexplained aggregates. No black-box scores. A manager who sees a branch leaning — whether live or during replay — can click once and know exactly which counterparties, which filaments, and which timebox produced that lean. This is the "the tree never lies" operational guarantee.

114. **Branch layout direction is from identity, never live data**: Branch direction (where a branch points in space from the trunk, §3.18) is derived only from `layoutKey` hashing + ring assignment + deterministic collision resolution rules. It never depends on counterparties, votes, attention, wind, or any live metric. The same set of `branchId` values always produces the same spatial arrangement under deterministic replay. Lean (§3.15) is a small deformation applied within the fixed layout slot — capped at 5-10° of tilt — and does not move the slot itself. Overlap is solved by multi-layer branch shells and LOD bundle merge (§3.18), never by changing branch semantic direction.

115. **Universal equations are scale-invariant**: The ten force equations (§3.19) — radial position, gravity sink, lean vector, wilt, heat, fog, storm, lightning, trunk mass, and scaling law — are identical at every scope from file to Laniakea. No scale-specific physics exist. A file-level filament and a planetary-level event use the same equations with the same units (radians, normalized magnitude, normalized confidence). What changes between scales is the template (what constitutes a filament, branch, trunk) and the aggregation depth (Equation 10). If a new equation is proposed that only works at one scale, it violates this contract and must be rejected.

116. **Scaling is aggregation, never new math**: Parent scope metrics are pure sums or weighted averages of child scope metrics (Equation 10, §3.19). `W_parent = Σ W_child`. `heat_parent = Σ heat_child`. No new variables, coefficients, or formulas are introduced at higher aggregation levels. A galaxy-scale heat map is computed from exactly the same fields as a branch-level heat value — just summed across more sources. If a rendering layer requires a variable that does not trace back to filament primitives (θ, m, c, a, o, s, e), it is not Relay physics and must be classified as a decorative overlay subject to the "shed first" rule (§3.17, §33.5).

117. **No physics above source**: Weather overlays, orbital metrics, aggregate force vectors, and all computed visualizations at any scale cannot: move filaments, alter lifecycle states, affect confidence values, modify governance decisions, change permissions, or influence any decision gate. They are read-only projections computed from underlying data. This holds identically at branch scale, tree scale, regional scale, planetary scale, and Laniakea scale. A galaxy-scale heat map has no more authority over truth than a single branch's fog index. Rendering is downstream of truth, never upstream.

118. **Every celestial body with data IS a full Relay globe**: The Moon, Mars, every asteroid, every planet, every moon of every planet, every space station — any body that has data being captured about it runs the full Relay physics (§3.19) with its own trees, branches, filaments, slabs, scars, and archive rings. Celestial bodies are not markers, dots, or abstractions on a zoom-out. They are complete Relay instances. Satellites, rovers, orbital sensors, telescopes, and human missions are data sources that feed filaments into trees planted on those bodies. History goes inward on every body — the cross-section of a Martian geology branch shows the same concentric timebox rings as an Earth accounting branch. Zooming into any body at any LOD reveals the same tree structure with the same physics. The universal equations are literally universal.

119. **Inward direction is defined by local structural origin O**: At every scale, inward direction is the vector toward the local structural origin O (§3.19). For branches, O = branch root. For trees, O = trunk core. For planets, O = planetary center. For irregular bodies (asteroids), O = barycenter. For galaxies, O = galactic barycenter. For Laniakea, O = supercluster attractor. The origin does not require astrophysical precision — it requires deterministic stability. Two renderers computing "inward" for the same scope must agree on the direction. Without a deterministic inward direction, archive compression becomes undefined, ring orientation becomes undefined, lean becomes meaningless, and helix becomes arbitrary. If inward is ever ambiguous at any scale, the system has a structural defect that must be resolved before that scale renders.

120. **Relay coordinates, never owns**: Relay occupies exactly two layers of the real-world stack: coordination and accountability (§49b.1). It does not issue currency, hold fiat reserves, distribute physical resources, replace settlement rails, or enforce legal authority. Physical infrastructure (banks, utilities, governments, supply chains) remains under the control of its existing operators. Relay is an additive accountability overlay — never a dependency. If Relay goes offline, water must still flow, hospitals must still function, banks must still clear. Relay makes the world measurable. It does not own it.

121. **Fiat custody is always external**: Relay never holds, custodies, or manages fiat currency reserves (§49b.5). Fiat integration flows through regulated financial institutions (banks, licensed payment processors, regulated stablecoin issuers). Filament magnitude carries unit + amount as data. Settlement occurs on external rails. Relay records the truth of the transaction (TransferPacket + ResponsibilityPacket). The settlement itself is performed by the banking system. Mixing fiat custody with Relay operations is a structural prohibition — it creates systemic collapse risk.

122. **Governance votes cannot manipulate physical supply**: Relay governance (parametric voting, sortition, council decisions) affects Relay parameters, templates, branch structure, and digital resource allocation only (§49b.6). No governance action — regardless of vote threshold, council approval, or founder key — can directly open water valves, redirect food shipments, alter power grid operations, or execute any physical action. Relay proposes. Humans and their existing institutions execute. The boundary between digital coordination and physical action is absolute and cannot be bridged by any Relay mechanism.

123. **Degradation is graceful, truth is last to go**: When external systems fail or internal resources are exhausted, Relay contracts through defined degradation modes (§49b.9): FULL → COMPUTE CONSTRAINED → SETTLEMENT OFFLINE → FEDERATION PARTITION → RENDER COLLAPSE → ARCHIVAL. Each mode specifies what continues, what sheds, what queues, and what freezes. The shed order is: spectacle first, compute second, settlement queuing third, federation scope fourth, rendering fifth, truth never. Committed filaments, slabs, scars, and the Merkle chain are preserved in every degradation mode. Sortition remains available in all modes except ARCHIVAL. Degradation degrades toward human deliberation, not toward system lockout.

124. **Scheduled filaments are inert proposals until their time arrives**: A `SCHEDULED` filament (§5b) exists at a future l position on the branch tip. It is visible but physically inert — it does not contribute to branch lean, wilt, heat, fog, wind computation, or any force equation until it transitions to `OPEN` when its scheduled time arrives. Scheduled events do not sink (gravity does not apply to the future). They are commitments, not evidence. Cancellation is a permanent scar-like commit (append-only), never deletion. A pattern of cancelled scheduled events is itself diagnostic geometry — visible in cross-section as bark-radius clusters that never migrated inward.

125. **The branch tip is the calendar**: Looking at the tip of any branch shows its scheduled future (§5b.4). Scheduled filaments render translucent, solidifying as their time approaches. Notifications are not a separate system — they are the scheduled filament arriving at the present moment on the l axis. The tree IS the alarm clock. Recurring events are separate filaments linked by `recurringSeriesId`; each instance lives independently.

126. **Timebox assignment uses spawnAt, never settlementAt**: A filament's timebox is determined by the moment it was created in Relay (§31.4). External settlement confirmation is a commit on the existing filament — it does not change the filament's timebox, l position, or slab membership. Settlement latency never distorts history. Deterministic replay depends on this invariant: given the same commit log, any node produces identical timebox aggregates regardless of when external confirmations arrive.

127. **Hash proves existence, not retrievability**: External evidence hashes are immutable and Merkle-anchored at commit time (§31.5). Subsequent URL expiry, API changes, or document format rotation do not invalidate the hash or reduce confidence. The hash proves what the document said when it was committed. UX must distinguish "evidence unavailable but hash preserved" from "data loss." Templates define `evidenceArchivePolicy` (CACHE_LOCAL, HASH_ONLY, CACHE_AND_HASH) to control local caching.

128. **Gravity always uses calendar-time**: Regardless of content type, the `sinkAxis` is always calendar-time (§3.21). The `primaryAxis` (what l means at CELL LOD) varies per template — content-position for documents, line number for code, timeline for media — but gravity sinking is universal. A paragraph, a function, and a music track all sink at the same rate. Only the interpretation of l at close zoom is content-specific. Twigs, wilt, lean, and all force equations operate on calendar-time.

129. **Compression never reduces verifiability**: Replay compression (§48.4.3) reduces storage and replay latency through five layers (terminal snapshots, timebox summaries, cross-timebox deltas, Merkle checkpoints, federation sharding). At every compression level, the Merkle proof is preserved. Every compressed filament retains its chain anchor. Every timebox retains its aggregate at full fidelity. Full commit logs are always recoverable from cold archive — compression affects latency, never truth.

130. **Archive compression IS tree physics**: The five compression layers (§48.4.3) are not a separate engineering system — they are the same inward-migration physics applied recursively to the storage layer. Hot = bark. Warm = mid-rings. Cold = core. Level escalation = gravity sinking. Timebox summaries = slab aggregates at full fidelity. Merkle checkpoints = commit chain anchors. Federation sharding = LOD. The archive system is a tree inside the tree. The system health filaments on the system tree (§48.4.2) close the recursion — the archive monitors itself using the same physics it archives. This fractal identity is structural, not metaphorical.

131. **Roots are alive**: The root system below the surface (§1.3) is not dead storage. It is the underground mirror of the canopy, governed by the same ten force equations (§3.19). Root branches correspond to canopy branches. Root lean = retrieval demand direction. Root wilt = integrity concern. Root heat = audit/retrieval surge. Root thickness = archive mass. Root depth = time depth. Cross-section of a root branch shows archive epoch rings. The tree is alive from root tip to branch tip — the archive is a living root system, not a graveyard.

132. **Roots are diagnostic, never operational**: Root physics (lean, wilt, heat, fog, storm, lightning) must NEVER affect canopy physics, filament lifecycle, governance decisions, or system availability (§1.3). Roots are a diagnostic mirror for auditors, compliance officers, and system administrators. An auditor reads the roots. The roots never reach up and change the branches. This separation is absolute. No root condition can transition a filament's state, modify a vote, or block a commit.

133. **Heartwood is terminal stillness**: Archived data that has reached compression Level 2, passed the age threshold, achieved integrity ratio 1.0, has negligible retrieval frequency, zero pending warnings, and sealed Merkle checkpoints enters heartwood state (§1.3). Heartwood contributes zero to all force equations — no lean, no heat, no fog, no wilt. It is pure structural mass. Heartwood can temporarily re-expand under three conditions only: integrity anomaly detected, legal/audit demand, or cross-tree evidence cascade. In all cases re-expansion is temporary and data returns to stillness. Heartwood prevents root compute from scaling with total archive size — only active root (recently archived + currently queried + integrity-flagged) participates in root physics.

134. **Camera is sovereign**: No auto-correction of orientation. Ever. Auto-leveling, auto-pitch, and ENU-frame chasing are permanently prohibited in FPS mode. The only corrections permitted are user-initiated (explicit key press) or panel-lock transitions (entering 2D interaction mode). See §50.1.

135. **Panel lock is the only flight suppression context**: Panel lock (entering a 2D interaction surface — spreadsheet cell, document editor, code panel, search bar) is the only context where WASD and flight keys are suppressed. No other system may consume flight input. See §50.4.

136. **Mass balance is conservation law, not dashboard logic**: Per-timebox material balance is computed from typed-magnitude filament sums (§52.5). Deviation from zero balance is rendered as slab color shift. Cumulative imbalance is structural lean. The computation is deterministic, replayable, and identical at every LOD. This is frozen contract #16 (conservation) applied to the manufacturing domain with explicit visual encoding rules.

137. **AI code commits require AICodeContributionPacket**: Any code-modifying AI commit must include a deterministic AICodeContributionPacket containing diff-based LOC metrics, AST-based line type classification, semantic complexity deltas, and quality/test/lint verification (§16.6). The COMMIT gate enforces `taskClassDeclared` (set by human, never inferred by AI) and `qualityProfile` minimums per task class. The confidence formula structure `(0.40×test + 0.25×guard + 0.20×lint + 0.15×typecheck)` is frozen; only target thresholds are template-configurable. Contributions failing band checks receive a scar with reason code. Spike code auto-expires as twig after 14 days if not promoted.

138. **Filaments are discrete growth fibers, not fluid flows**: All state changes are commit-driven events. No continuous simulation, no streaming state, no fluid dynamics (§53.1). Every filament transition is an atomic append-only commit that can be replayed deterministically. Relay mimics wood formation (layered, irreversible, accumulating), not tree biology (sap, xylem, phloem). The cambium layer (`r = 1.0`) is the only zone where new structure forms — everything outside is active work, everything inside is immutable history.

139. **Composition inheritance through transformation chains is mass-weighted**: When a transformation consumes input lots and produces outputs, the output's composition profile is computed as mass-weighted average of input compositions (§53.4). Uncertainty compounds: `output_uncertainty = √(Σ(input[i].uncertainty² × input[i].massFraction²))`. No transformation may reduce uncertainty below the worst input without new measurement evidence. This enables deterministic traceability from finished good back to vendor lot molecular composition, and from vendor lot forward to every product that consumed it (recall cascade).

140. **Relay functions at all four adoption tiers simultaneously**: No tier is prerequisite for any other (§57). Evidence hashes (Tier 0) are a permanent, first-class integration method — not a fallback. Tier 0 stores only a cryptographic hash and timestamp; Tier 1 mirrors structured data via connector; Tier 2 reconciles native and external filaments; Tier 3 is fully Relay-native. Features are never gated behind Tier 3. The visual difference between tiers is rendered through existing confidence/fog physics, not through badges, warnings, or degraded UI. The tree makes the case for adoption by being legible. Relay never pushes.

141. **Relay has no stages, only modules**: The system does not progress through numbered stages (§38). Every capability is an individually discoverable module with its own prerequisite chain. A user who demonstrates competence with the prerequisites unlocks the module — regardless of how "advanced" it appears. There is no Stage 1 user and no Stage 3 user. New modules are added forever through community proposal, council review, founder approval (for global economic parameters), and git-style versioning. The three conceptual layers (Truth, Interaction, Game) are vocabulary for describing what a module does, not access gates restricting when someone can use it. The system grows indefinitely.

142. **Education is an internal adventure, not an external institution**: Teaching is a ranked filament activity where teachers are compensated by student success rates, not view counts (§58). Skill paths are community-curated suggestions, never mandatory gates. The round-robin matching model (Genghis Khan pattern) applies to teaching, psychiatric care, dating, and all human-matching optimization uniformly. Curricula evolve through governance commits and are ranked by aggregate student outcomes. The tutorial is the only moment Relay actively teaches — after that, all learning is self-directed discovery. The user tree's learning branch IS the education record.

143. **Single-instance circulation for media objects**: A media object has exactly one encrypted master file identified by `contentHash` (§59.3). All playback sessions stream from this single source. `AccessLeasePacket` commits track every active lease. `maxConcurrentCopies` is a per-object governance parameter set by the rights holder. When the cap is reached, additional access requests queue. No per-viewer file duplication occurs. Relay does not impose this model on external content — it operates only on media published through Relay with explicit governance parameters.

144. **Radial position and engagement are orthogonal on media branches**: The radial axis is governed exclusively by lifecycle state, production stability, and commit depth (§59.2). The engagement axis is governed exclusively by viewer activity and derivative fork count. Engagement never moves a segment's radial position. Commits never change engagement weight. These two axes never cross-contaminate.

145. **Derivative forks must declare segment-level provenance**: A derivative media project that claims upstream linkage must map specific derivative segments to specific source segments with `overlapPct` and `overlapMethod` (§59.6). Credit share per view session is computed deterministically from these mappings using the `sourceWeight` table by fork type. If no segment-level mapping is provided, `share_to_source = 0`. The mapping is a committed evidence chain, auditable by any party.

146. **Frames never instantiate as Cesium primitives**: At MEDIA-FRAME LOD, individual frames render in a 2D inspection panel using the zoom-to-flat transition (§59.7, §3.3). Zero Cesium Entity or Primitive objects are created per frame. World-primitive budgets at each media LOD level are Category A global parameters.

147. **Student votes on teaching affect visibility and routing, never evidence truth**: Student votes on clarity, pacing, engagement, and practice quality affect teacher search rankings and routing recommendations (§58.9). They never override organizational confidence (evidence quality). A lesson with high popularity and low evidence stays foggy. A lesson with low popularity and high evidence stays firm. Both signals are independently visible. Votes are weighted by student outcome — a vote from a student who demonstrated the module carries more weight than one from a student who dropped out.

148. **Grading is a sortition process with fixed rubric filaments**: Auto-check handles objective parts; peer review juries (sortition-selected from students who demonstrated the module) handle subjective parts; teachers spot-check a random sample plus escalations (§58.10). Consensus determines the final grade; disagreement triggers escalation scars. Peer graders earn magnitude credit. The pipeline scales independently of class size.

149. **Any branch can host child trees with identical physics**: Child trees inherit the same ten force equations (§3.19), lifecycle states (§4.3), append-only invariant, cross-section encoding (§3.4), and LOD rendering rules (§33.5) as every other tree in the system (§60). The parent sees only aggregate metrics. Rendering never shows more than one recursion layer at full fidelity — portal entry is explicit. FractalSpawnEvent commits are the only mechanism for creating child trees; all spawns are auditable.

150. **Private data is absolutely uninspectable within Relay**: Filaments at `disclosureTier = 0` are cryptographically sealed (§61.1). No user, SCV, governance mechanism, duel proceeding, jury sortition case, or civic enforcement workflow can access, inspect, reference, or reveal private data. Relay provides no backdoor, no admin function, no discovery mechanism. External legal systems may subpoena the user directly — Relay itself never provides a pathway to bypass the cryptographic privacy boundary. Aggregate tree shape remains truthful (§33.4) but individual filament contents at Tier 0 are invisible to all external observers.

151. **Only publicly exposed data is admissible as evidence within Relay**: In duel proceedings, sortition jury cases, civic enforcement workflows, governance votes, and any other Relay process, only filaments committed at `disclosureTier >= 1` are admissible (§61.2, §61.6). Private data cannot be compelled, discovered, or referenced. Voluntary disclosure tier elevation is itself a permanent append-only commit.

152. **Civic enforcement is structured compensated work**: Civic observation filaments require evidence references to achieve non-zero confidence — accusations without evidence are structurally invisible (§61.3). Enforcement workers process observations as compensated tasks with minimum wage set by municipal governance as a Category A parameter (§61.4). Observer identity is always recorded — false accusations are traceable and create wilt. Proximity correlation uses only publicly broadcast signals; non-Relay users and disabled presence are never processed (consistent with contract #40).

---

## 46. Sortition-Based Case Resolution

> *"Injustice anywhere is a threat to justice everywhere."* — Martin Luther King Jr.

When a dispute arises that normal voting cannot resolve — a contested account, a challenged piece of evidence, an ownership conflict — Relay does not hand the decision to an administrator or a CEO. It randomly selects a jury of ordinary users, the way courts select jurors in the real world. But fairer: the selection is cryptographically random so nobody can stack the jury, the members are drawn from diverse pools by design, and the verdict is recorded permanently on the public record. If you disagree with the outcome, you can appeal to a second jury. If that fails, a final council hears the case. Three levels, all transparent, all recorded.

Relay uses randomized jury sortition — not majority vote and not founder decree — to resolve disputes, adjudicate Sybil enforcement cases, and mediate governance conflicts that cannot be settled by parametric voting alone.

### 46.1 When Sortition Applies

Sortition is triggered for:
- **Sybil enforcement**: When the system flags an account as a suspected duplicate or bot, and the account contests the flag, a jury decides.
- **Community disputes**: Channel ownership conflicts, contested migration commits, evidence authenticity challenges.
- **Governance deadlock**: When a branch-level vote is sustained at exactly the threshold boundary (inside the hysteresis band) for longer than 2x the settlement window, a jury breaks the deadlock.
- **Quarantine appeals**: When content is quarantined (frozen contract #53) and the author appeals, a jury reviews the quarantine decision.

Sortition is NOT used for: routine parameter voting (that's continuous weighted-median), routine content moderation (that's filter tolerance), or founder key activation (that's the founder's singular governance primitive).

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
- The Council cannot: modify frozen contracts, override parametric governance, activate the game layer (that's the founder/Steward key), grant themselves additional power, or create new council seats.

---

## 47. Voice Input Pipeline — Whisper, Architect, Canon

> *"The limits of my language mean the limits of my world."* — Ludwig Wittgenstein

**Prerequisites:** None for base (voice commands: speak → transcribe → propose). Expands with: AR interaction modules → voice + gesture/light/object fusion as multi-modal SCV input. Spell modules → spell incantations where the verbal component is one signal in a multi-element activation sequence.

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
  - **Stream mode**: Continuous real-time transcription for duels, meetings, discussions. The transcript becomes a filament on the event branch with each utterance as a commit. Suitable for video presence conversations and duel commentary.

### 47.3 Architect — Intent Parser

The Architect layer is the first SCV sub-component in the voice pipeline. It takes raw transcribed text and produces structured intent:

**Input**: Raw transcript + context (current user location in tree, active scope, permissions, presence state, and with AR interaction modules: simultaneous gesture/light/object signals)

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
- With AR interaction modules active, Architect fuses voice with simultaneous gesture/light/object signals to disambiguate. "Show me THIS" + pointing gesture = single unambiguous intent.
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
- During meetings (video presence), voice transcripts can be committed as meeting filaments with full participant attribution
- During field work (proximity channels, §29), voice notes become filaments with GPS + proximity + voice evidence
- Voice evidence follows the same disclosure tiers as all other evidence — Tier 0 (anonymous transcript), Tier 1 (attributed), Tier 2 (full audio + identity)

---

## 48. Engineering Infrastructure — How the System Runs

> *"Give me six hours to chop down a tree and I will spend the first four sharpening the axe."* — Abraham Lincoln

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
| **Centralized** | Simple consistency, easy to bootstrap, fast iteration | Single point of failure, scaling ceiling, trust dependency | MVP bootstrap |
| **Federated** | Regional sovereignty, horizontal scaling, partial failure tolerance | Complex coordination, eventual consistency challenges | Production deployment |
| **Decentralized** | No single point of failure, censorship resistant, aligns with Merkle/append-only model | Complex consensus, slow propagation, hard to bootstrap | Global deployment (AR/game modules active) |

**Recommended path:** Start centralized for bootstrap (MVP), evolve to federated as adoption grows (production), with decentralized as the global-scale target. The append-only commit model and Merkle chain are already designed for eventual decentralization — the data model does not need to change, only the transport and consensus layers.

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
  3. Both are captured via the device camera and microphone — the **same detection pipeline** used for spell activation, element recognition, and card detection in interaction/game layer modules
- The camera processes the video locally (on-device, raw frames never leave — frozen contract #49), extracts audio features (MFCC, spectral, temporal) and gesture features (68 facial landmarks, motion vectors, expression classification), combines them into a biometric vector (60% audio weight, 40% gesture weight), and matches against the enrolled pattern using ML-based similarity (85% threshold)
- This is deliberately performative — it cannot be done passively, cannot be done by someone who doesn't know both the phrase AND the physical gesture, and trains the same muscle memory the user will use for spell casting downstream
- Failed attempts (3 consecutive) escalate to LOCKOUT, requiring guardian recovery or proximity reverification

**Fallback when detection pipeline degrades:**
The Password Dance is the *primary* STRICT authentication path, but NOT the *only* path. If the on-device detection pipeline fails (ML model degradation, hardware incompatibility, adversarial attack on the model, accessibility needs), STRICT authentication falls back to: PIN + guardian attestation (2 guardians confirm identity via ELEVATED auth) OR PIN + proximity reverification at a registered Relay location. The fallback is always available. The Password Dance is preferred because it trains the spell pipeline, but it cannot be a single point of failure for identity security.

**Why the Password Dance uses the spell pipeline:**
The detection engine that recognizes hand signals, body movements, facial expressions, and vocal patterns for the Password Dance is architecturally identical to the engine that will later detect spell trigger sequences (card presentation + gesture + element + voice incantation). By requiring users to enroll and practice somatic authentication from day 1, the system:
- Trains users in the interaction paradigm before AR/game modules are discovered
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

**Video and media (spell recordings, documentation, SCV captures):**
- Raw video from detection mesh NEVER leaves the user's device (contract #49). Only classified signal metadata is transmitted.
- Spell trigger recordings: SCV captures locally, extracts gesture/voice/element metadata signals, transmits only the classified signals + content-addressed hash of the source clip. Source clip stays on user device or their personal storage allocation.
- Documentation video (evidence recordings, meeting captures, inspection footage): stored in content-addressed external storage. Relay filament carries only the SHA-256 hash reference. The video file itself lives in object storage.
- Deduplication applies: same video referenced by 100 filaments = stored once.

### 48.4.2 Storage Growth Model — Preserving History Indefinitely

History must be preserved indefinitely (frozen contract #1: append-only). This requires predictable storage growth metrics so capacity planning is deterministic, not reactive.

**Per-filament storage budget (estimated):**

| Component | Size | Notes |
|-----------|------|-------|
| Filament metadata (all 6 domains, lifecycle, coords) | ~2 KB | JSON/binary, indexed |
| Average commit history (10 commits per filament) | ~5 KB | Append-only commit log |
| Merkle chain entry | ~256 bytes | SHA-256 hash + parent + timestamp |
| Evidence hash references (avg 3 per filament) | ~768 bytes | SHA-256 hashes only, not file content |
| **Filament total (excluding attachments)** | **~8 KB** | |

**Attachment storage (content-addressed, deduplicated):**

| Content Type | Avg Size | Frequency | Notes |
|-------------|----------|-----------|-------|
| PDF / document evidence | 500 KB | ~1 per 5 filaments | Deduplicated by content hash |
| Image (photo evidence, screenshots) | 2 MB | ~1 per 10 filaments | Deduplicated |
| Video (inspection, meeting, documentation) | 50 MB | ~1 per 100 filaments | Most expensive; deduplicated |
| Spell trigger clip (game layer) | 10 MB | ~1 per spell event | On-device by default; opt-in upload |
| Audio (voice commands, call recordings) | 5 MB | ~1 per 50 filaments | Deduplicated |

**Growth rate projections (per 1,000 active users):**

| Metric | Daily | Monthly | Yearly |
|--------|-------|---------|--------|
| New filaments | ~5,000 | ~150,000 | ~1.8M |
| Filament metadata growth | ~40 MB | ~1.2 GB | ~14.4 GB |
| Attachment growth (deduplicated) | ~2 GB | ~60 GB | ~720 GB |
| Merkle chain growth | ~1.3 MB | ~39 MB | ~468 MB |
| **Total (per 1K users)** | **~2 GB/day** | **~61 GB/mo** | **~735 GB/yr** |

**At scale:**

| Scale | Users | Annual Storage Growth | 10-Year Archive |
|-------|-------|----------------------|-----------------|
| Single company | 100 | ~74 GB/yr | ~740 GB |
| Mid-size org | 10,000 | ~7.4 TB/yr | ~74 TB |
| City | 1,000,000 | ~735 TB/yr | ~7.4 PB |
| Nation | 100,000,000 | ~73.5 PB/yr | ~735 PB |
| Planetary (1B users) | 1,000,000,000 | ~735 PB/yr | ~7.4 EB |

**Compression and tiering strategy:**

- **Hot tier** (active filaments, <6 months): SSD-backed, fully indexed. ~5% of total data.
- **Warm tier** (recent archive, 6 months - 2 years): Object storage, metadata-indexed. ~15% of total data.
- **Cold tier** (deep archive, >2 years): Compressed object storage, content-addressed, hash-verified on read. ~80% of total data.
- **Compression ratio**: Filament metadata compresses ~4:1 (structured, repetitive). Attachments vary (PDFs ~2:1, images/video already compressed ~1.1:1). Merkle chain is incompressible (hashes are high-entropy).
- **Deduplication dividend**: In practice, attachment deduplication reduces storage 30-60% depending on how many filaments reference the same evidence documents.

**Monitoring metrics (must be tracked in production):**

```
StorageMetrics {
  dailyFilamentCount: number,
  dailyCommitCount: number,
  dailyAttachmentBytes: number,
  dailyMerkleGrowthBytes: number,
  totalHotTierBytes: number,
  totalWarmTierBytes: number,
  totalColdTierBytes: number,
  deduplicationRatio: number,
  projectedAnnualGrowth: number,
  projectedTimeToCapacity: duration
}
```

These metrics are published as a system health filament on the system tree. Operators can see storage growth as a branch on the system tree — it sinks, it has rings, it has slabs. If storage growth accelerates beyond projections, the branch leans. If capacity approaches limits, the branch wilts. The system monitors itself using its own physics.

### 48.4.3 Replay Compression Strategy — Exabyte-Scale Deterministic Replay

History is preserved indefinitely (append-only). But preserving is not the same as replaying. At exabyte scale, naive replay (re-reading every commit from genesis) is computationally impossible. The system needs layered compression that preserves deterministic verifiability while making replay practical.

**Layer 1 — Per-Filament Terminal Compression**

When a filament reaches `ABSORBED` state and enters root archive:

```
TerminalSnapshot {
  filamentId: string,
  finalState: { ...all six domains at close... },
  totalCommitCount: number,
  commitLogHash: sha256,      // hash of the full commit chain
  evidenceHashes: [sha256],   // hashes of all evidence attachments
  magnitudeAtClose: decimal,
  absorptionTimestamp: ISO-8601,
  compressionLevel: 0|1|2     // 0 = full log, 1 = delta-compressed, 2 = snapshot-only
}
```

- **Level 0 (hot):** Full commit log retained. Every commit readable. Used for recent filaments (< 90 days absorbed).
- **Level 1 (warm):** Commits delta-compressed. Only diffs between commits are stored, plus the terminal snapshot. Full state is reconstructable by applying deltas forward. Used for filaments 90 days to 2 years absorbed.
- **Level 2 (cold):** Only the terminal snapshot + Merkle proof of the commit chain. Individual commits are not stored inline — they exist in deep cold archive and can be retrieved on demand (with latency). Used for filaments > 2 years absorbed.

At all levels, the `commitLogHash` and `evidenceHashes` are preserved. Verification is always possible. Replay fidelity is always achievable — the question is only latency.

**Layer 2 — Per-Timebox Summary Compression**

Closed timeboxes already cache `TimeboxAggregate` (§3.6). At archive depth, the individual filament data within a timebox may be at compression level 1 or 2, but the aggregate is always retained at full fidelity:

```
TimeboxArchiveSummary {
  timeboxId: string,
  branchId: string,
  aggregateSnapshot: TimeboxAggregate,   // always full fidelity
  filamentCount: number,
  filamentIds: [string],                 // list preserved even when logs are compressed
  merkleRoot: sha256,                    // root of all filament hashes in this timebox
  compressionLevel: 0|1|2
}
```

This means cross-section inspection at TREE/BRANCH LOD can always render ring thickness, color, opacity, and firmness from the aggregate — without decompressing individual filaments. Only drill-down to individual filaments requires decompression.

**Layer 3 — Cross-Timebox Delta Encoding**

Adjacent timeboxes on the same branch often share most filaments (a filament that spans 3 timeboxes appears in all 3). Instead of storing full filament lists per timebox, store:

```
TimeboxDelta {
  fromTimeboxId: string,
  toTimeboxId: string,
  addedFilaments: [filamentId],
  removedFilaments: [filamentId],
  changedFilaments: [{ filamentId, deltaCommits: [commitHash] }]
}
```

Replay reconstructs timebox N from timebox N-1 + delta. Storage savings: ~60-80% for stable branches where most filaments persist across periods.

**Layer 4 — Merkle Anchor Compaction**

The Merkle chain grows linearly with commits. At exabyte scale, the chain itself becomes a storage concern. Compaction rules:

- Every `N` commits (configurable, default 1000), a **Merkle checkpoint** is published: the root hash of all commits in that span, plus a pointer to the previous checkpoint.
- Between checkpoints, individual commit hashes are stored.
- After cold archive threshold, individual commit hashes between checkpoints are pruned from hot storage. The checkpoint hash proves the chain. Individual hashes are recoverable from cold archive.
- Verification path: to verify any specific commit, retrieve its checkpoint span from cold storage, reconstruct the Merkle tree for that span, and verify inclusion.

```
MerkleCheckpoint {
  checkpointId: string,
  branchId: string,
  commitRange: { from: commitIndex, to: commitIndex },
  merkleRoot: sha256,
  previousCheckpointId: string|null,
  timestamp: ISO-8601
}
```

**Layer 5 — Regional Federation Sharding**

No single node holds all data. Federation topology determines which region stores which data:

- A node stores full-fidelity data for its region (all trees, all branches, all filaments at compression level 0).
- For adjacent regions: compression level 1 (deltas).
- For distant regions: compression level 2 (snapshots + Merkle proofs only).
- Cross-region replay requires fetching data from the originating region's nodes. Latency is acceptable because cross-region inspection is rare and non-real-time.

**Replay performance targets:**

| Operation | Target Latency | Data Source |
|-----------|---------------|-------------|
| Current timebox render | < 16ms (60fps) | Hot cache (level 0) |
| Cross-section last 12 months | < 500ms | Warm cache (level 0-1) |
| Cross-section last 10 years | < 5s | Warm + cold (level 1-2) |
| Full filament history drill-down | < 10s | Cold archive (level 2 decompression) |
| Cross-region replay | < 30s | Federation fetch + decompress |

**The invariant:** Compression reduces storage and replay latency. It never reduces verifiability. Every compressed filament retains its Merkle proof. Every timebox retains its aggregate. Every checkpoint retains its chain anchor. If you need the full commit log of a 10-year-old filament, you can get it — it just takes longer.

**The fractal insight: archive IS tree physics applied to itself.**

The five compression layers are not a separate engineering system bolted onto the tree. They ARE the same inward-migration physics, applied recursively to the storage layer:

| Tree Physics | Archive Equivalent |
|-------------|-------------------|
| Outer bark (OPEN, active, recent) | Level 0 — hot storage, full commit logs, instant access |
| Mid-rings (CLOSED, migrating inward) | Level 1 — warm storage, delta-compressed, reconstructable |
| Deep core (ABSORBED, compressed archive) | Level 2 — cold storage, terminal snapshots + Merkle proofs |
| Timebox slab aggregates | TimeboxArchiveSummary — always full fidelity, even when underlying filaments are compressed |
| Merkle chain (commit causality) | MerkleCheckpoint — periodic anchors with prunable detail between |
| LOD (you see less detail at distance) | Federation sharding — your region is full fidelity, distant regions are summaries |
| Gravity sinking (older = deeper) | Compression level escalation (older = more compressed, higher retrieval latency) |
| Trunk mass (resolved work compacts) | Cold archive mass (resolved filaments compact into terminal snapshots) |

The progression from Level 0 → Level 1 → Level 2 IS inward migration for data. A filament's commit log starts at "bark" (full detail, fast access), migrates to "mid-ring" (delta-compressed), and eventually reaches "core" (snapshot + proof). The archive system is a tree inside the tree.

The system health filaments on the system tree (§48.4.2) close the recursion: the archive watches itself using the same physics it archives. If compression falls behind, the storage branch wilts. If retrieval latency spikes, the storage branch heats. The tree monitors the process of becoming a tree.

This is not metaphor. This is structural identity. The compression strategy works because it obeys the same invariants as everything else: inward migration is irreversible, nothing deletes, detail is always recoverable from depth, and aggregates at each ring are always available at full fidelity. The fractal scaling from filament → branch → tree → planet → galaxy → Laniakea extends downward into the storage layer with identical geometry.

### 48.4.1 Boundary Data Source-of-Truth

**Current status: Repo-file sourced (temporary).**

Geospatial boundary data (`data/boundaries/*.geojson`) is loaded directly from repository fixture files by the BoundaryRenderer at runtime. This is a bootstrap convenience, not the permanent model.

**Transition rule:** When boundary-define commits are implemented (a commit type that declares a geographic boundary with content-hash), the BoundaryRenderer must:
1. Verify loaded GeoJSON against the content-hash from the defining commit.
2. If no boundary-define commit exists for a requested boundary, emit `[REFUSAL] reason=BOUNDARY_SOURCE_UNCOMMITTED` and fall back to fixture data with a `source=REPO_FILE` log annotation.
3. If a commit exists but the hash does not match the fixture file, refuse to render.

Until boundary commits exist, all boundary loads are annotated `source=REPO_FILE` in console logs.

### 48.5 Bootstrap Strategy

**Minimum viable deployment (MVP):**
1. Single company tree with one template (P2P or municipal services)
2. Centralized backend (single server region)
3. Cesium globe with one trunk visible
4. 10-50 users demonstrating: filament create → evidence → confidence → sinking → root archive
5. Full proof suite passing (all existing proofs + BARK-CYLINDER-1)

**Growth path:**
- MVP → pilot companies (5-10 trees, federated backend)
- Pilot → public beta (1000+ trees, regional federation)
- Beta → production (global federation, social layer active)
- Production → AR modules (unlocking per-user as achievements are discovered)
- AR modules mature → game layer readiness (founder key activation consideration)

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
- Preferences include: frequently used commands, custom spell definitions (game layer), graphic asset library (interaction layer), voice vocabulary adaptations.
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
- Camera access for AR interaction modules (gesture/light/object detection).
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

### 48.22 Session State Persistence — Save on Close, Restore on Open

Relay preserves the user's full working context across sessions. When a user closes the browser, navigates away, or loses connectivity, the system saves their current state. When they return, Relay restores them to exactly where they left off — same camera position, same open branch, same LOD, same inspectors, same conversation thread with their SCV.

**Analogy:** Cursor (the code editor) saves which folder you had open and what your last agent conversations said, so you resume exactly where you left off. Relay does the same for 3D tree navigation.

**What is saved (per-user, per-device):**

| State Category | Saved Fields | Storage |
|----------------|-------------|---------|
| Camera | lat, lon, altitude, heading, pitch, roll | Local |
| Active tree | treeId, focused branchId, selected filamentId | Local |
| LOD & render mode | current LOD level, force LOD override, render mode | Local |
| Inspector panels | open/closed state, panel positions, active tab | Local |
| Filter settings | all personal filter slidebar positions (§12) | Local + synced |
| Sim time offset | debug time advance offset (dev mode only) | Local |
| SCV context | last SCV conversation thread, pending proposals, draft queue | Synced |
| Note drafts | any unsaved Note text, target surface, attachments in progress | Local |
| Active projection | open projection branchIds, selected decision nodes | Local |
| Duel spectating | active duel eventId, spectator view position | Local |
| Sidebar layout | panel widths, collapsed/expanded sections | Local |

**Storage tiers:**
- **Local**: `localStorage` or `IndexedDB` on the client device. Survives page close and browser restart. Does not roam across devices. Key: `relay.session.v1.<userId>.<deviceId>`.
- **Synced**: Stored as a filament commit on the user tree (§8). Roams across all devices. The SCV conversation thread, filter preferences, and Note drafts marked as "synced" are preserved in the user's personal tree.

**Restore sequence on boot:**
1. Check for synced session state on user tree (requires auth).
2. Check for local session state in `localStorage`.
3. If both exist: use the more recent `lastSavedAt` timestamp.
4. If neither: boot to globe view (default).
5. If session state exists but the referenced tree/branch no longer exists (deleted or migrated): boot to globe view, display `[SESSION] Restored position unavailable — branch migrated. Starting at globe.`

**Save triggers:**
- `beforeunload` event (browser close/navigation).
- Periodic auto-save (interval: 30 seconds, local only — not every tick).
- Explicit save on SCV conversation commit.
- On network disconnect (save local snapshot immediately).

**Privacy:**
- Session state is personal data. The synced portion lives on the user tree at `disclosureTier = 0` (visible only to the user).
- Local session state is never transmitted to the server except through the explicit sync mechanism.
- Filter settings (§12) are especially sensitive — they reveal what the user hides — and are stored at the strictest tier.

**Frozen contract alignment:** Frozen contract #78 (below) establishes that session state restoration is a core UX guarantee, not an optional feature. The system must restore the user's working context after any interruption.

---

## 49. Adversarial Edge-Case Model

> *"If you know the enemy and know yourself, you need not fear the result of a hundred battles."* — Sun Tzu

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
- Achievement tokens require SCV-validated proof in any context (frozen contract #30, amended §71.2): Bots cannot earn advanced resources.
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
- Truth layer outweighs game layer (frozen contract #42): Real-world contribution always yields more system influence than gaming performance, regardless of economic conditions.
- **Residual risk:** Sustained manipulation over many epochs (each shifting 20%) could still move parameters significantly over months. Mitigated by community visibility — all parameter changes are governance commits visible to everyone, creating social pressure against manipulation.

### 49.5 Founder Key Compromise

**Scenario:** The founder account is compromised and an attacker activates the game layer prematurely, or the founder activates under duress.

**Containment:**
- Activation requires attestation commit (frozen contract #48): The commit records exact system state at activation. If parameters are not at safe thresholds, the activation is evidence of compromise.
- Once activated, irreversible (frozen contract #34): But game layer content is additive — it cannot break truth or interaction layer modules (frozen contract #28). Even premature activation does not destroy existing functionality.
- All game layer spell effects resolve to truth layer filament operations (frozen contract #31): The game layer has no independent power over the data layer.
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

**Scenario:** The game layer is emotionally engaging — duels are dramatic, monsters are exciting, spell casting is spectacular. Users spend 90% of their time in spectacle. Truth layer evidence work becomes invisible background labor. Cultural prestige shifts to duelists and spell casters. Real contributors (evidence commits, governance participation, filament resolution) become invisible to narrative. Even though governance weight remains correct, cultural gravity shifts away from truth work.

**Containment:**
- The tree IS the interface (structural defense): Game layer spectacle happens ON the tree. Duels create filaments. Monsters spawn from evidence gaps. Spell effects modify rendering. The spectacle is inseparable from the evidence structure — you cannot see the show without seeing the tree. Truth layer work is the skeleton that the game layer decorates.
- Truth layer visibility guarantee (frozen contract #80): At every LOD, the rendering prioritizes evidence structure (filaments, timeboxes, lifecycle states) before spectacle overlays (spell effects, duel animations, monster visuals). Spectacle can be toggled off; evidence cannot. The default view always shows evidence structure.
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
- Regions vote features on or off (frozen contract #84): this is standard parametric governance at the regional scope. No system fork, no special mechanism — just branch-level voting on which interaction/game layer modules are active in that region. The core truth layer is always active everywhere.
- Regional feature votes are globally visible: everyone can see which regions have which features enabled. This creates cultural identity — Japan might become known as a duel hotspot, a university campus might be known for deep evidence trees with no game layer. This diversity is a feature, not fragmentation.
- Legal posture document (frozen contract #51): every deployment jurisdiction requires an explicit compliance document. The document specifies which features are active and which are restricted, aligned with local law.
- Fractal model preserves unity: a Japan tree with AR disabled still participates in the global Merkle chain, still has filaments, still has governance, still has presence. The tree structure is universal. The feature configuration is local.
- Cross-jurisdiction references use Merkle inclusion proofs (hash only crosses border, not content).
- **Residual risk:** A region that votes to disable ALL interaction/game layer modules operates on the truth layer only. This is by design — the truth layer is the foundation, and it does not depend on the game or detection layers.

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

## 49b. Real-World Integration — Relay Coordinates, Never Owns

> *"The map is not the territory."* — Alfred Korzybski

Relay is a truth-coordination engine. It is not a mint. It is not a power grid. It is not a water purification plant. It is not a bank. If Relay ever tries to replace physical infrastructure directly, it collapses. Instead, it interfaces with existing systems.

### 49b.1 The Five-Layer Responsibility Model

| Layer | Responsibility | Who Owns It |
|-------|---------------|-------------|
| Physical resource | Production, distribution, storage of real goods (water, food, fuel, materials) | Real-world producers and distributors |
| Legal authority | Sovereignty, enforcement, taxation, courts, property law | State and regulatory bodies |
| Settlement | Moving money, clearing transactions, holding reserves | Banking networks (central banks, commercial banks, payment rails) |
| **Coordination** | **Organizing who does what, when, with what evidence** | **Relay** |
| **Accountability** | **Making actions visible, auditable, and permanent** | **Relay** |

Relay occupies exactly two layers. It measures and coordinates. It does not seize, own, mint, guarantee, ration, or replace anything in the first three layers.

### 49b.2 What Enables Physical Cash and Banking Today

Physical money requires four engines that Relay does not replace:

1. **Sovereign issuance**: Central banks control base money supply. Legal tender laws enforce acceptance. Relay has no authority to issue or enforce legal tender.
2. **Settlement rails**: Banks maintain ledgers. Clearinghouses (SWIFT, ACH, Visa, SEPA) settle between institutions. Relay does not process wire transfers or clear payments.
3. **Enforcement**: Courts enforce contracts. Governments enforce taxation and fraud law. Relay records evidence — it does not adjudicate outside its own governance scope.
4. **Physical backing**: Trust in state stability. Military and legal monopoly on force. Relay has no physical enforcement capability.

### 49b.3 Three Bridges to Physical Commerce

There are only three legitimate bridges between Relay's digital truth and physical goods:

**Bridge 1 — Existing Banking Rails (primary)**

Relay generates `TransferPacket` (system truth) and `ResponsibilityPacket` (human accountability). These integrate with bank APIs, payment processors, ERP systems, and treasury platforms. Relay becomes the coordination layer. Banks remain the settlement layer. This is clean, realistic, and deployable today.

**Bridge 2 — Tokenized Fiat Accounts (custodial partners)**

Relay can integrate with bank-backed digital wallets, regulated stablecoins, and licensed payment service providers. Critical rule: **Relay never becomes the custodian of fiat reserves.** Custody risk = collapse risk. The custodian is always a regulated financial institution, never Relay itself.

**Bridge 3 — Physical Resource Tracking (accountability overlay)**

For water, food, fuel, and other physical resources, Relay does not "lock" or control them. It tracks them:
- Filament: resource inventory state
- Filament: supply chain commitments
- Filament: transport and logistics events
- Filament: storage telemetry and sensor readings
- Filament: inspection and compliance reports

Physical goods remain physical. Relay becomes the coordination and accountability overlay. If a water utility publishes its data into Relay, anyone can see the state of the water supply. Relay does not control the valves.

### 49b.4 What Must Be Built (Modules)

**1. Payment Abstraction Layer (Module P)**

A module that supports multiple settlement rails without forcing one monetary regime:
- Bank API integration (open banking standards)
- Card processor connectors (Visa, Mastercard, regional processors)
- Stablecoin / digital currency rails (where legally permitted)
- Regional payment standards (SEPA, UPI, PIX, etc.)
- Currency-agnostic magnitude handling (filament magnitude carries unit + amount, settlement converts)

**2. Compliance Interface (Module C)**

- Jurisdiction mapping: which laws apply where
- Tax recording: filaments that represent taxable events carry jurisdiction metadata
- Legal audit hooks: export capability for regulatory examination
- Anti-fraud metadata: transaction pattern flagging (not blocking — flagging for human/SCV review)
- KYC/AML integration points: connect to existing identity verification services where required by jurisdiction

**3. Resource Registry Templates (Module R)**

Industry vertical templates (not core physics — these are template modules):
- Water utilities: supply, demand, quality metrics, infrastructure state
- Food logistics: supply chain, cold chain, inspection, distribution
- Energy grids: generation, consumption, storage, pricing
- Telecom: capacity, outages, coverage, service levels
- Healthcare supply: inventory, distribution, expiry tracking, cold chain

Each template maps the industry's events to filaments with the standard six domains. The physics are universal. The templates are industry-specific.

### 49b.5 Custody Isolation (Non-Negotiable)

The following resource types must remain structurally isolated — different ledger types, different storage, no conversion mechanism:

| Resource | Source | Isolation Rule |
|----------|--------|---------------|
| Engagement Credits | Digital participation | Never redeemable for fiat. No exchange rate exists. |
| Achievement Tokens | SCV-validated achievements in any context (§71.2) | Never redeemable for fiat. No exchange rate exists. |
| Power | Game layer (spell casting) | Closed loop. Never touches fiat. |
| Fiat currency | External banking rails | Held by regulated custodians, never by Relay. Magnitude in filaments only. |
| Physical resources | Real-world producers | Tracked by Relay, never held or distributed by Relay. |

If any of these pools are blended, converted, or allowed to leak into each other, systemic risk is created. This is why frozen contract #47 (resource non-convertibility) exists. This section extends that principle to fiat and physical resources.

### 49b.6 What Relay Must NOT Do (Prohibitions)

These are not suggestions. They are structural prohibitions:

1. **Relay must not create its own fiat-backed currency.** It is not a central bank.
2. **Relay must not guarantee physical redemption** of any digital resource for any physical good.
3. **Relay must not promise resource allocation** (water, food, energy) to any user.
4. **Relay must not replace national settlement rails.** It coordinates around them.
5. **Relay must not allow governance votes to directly manipulate physical supply.** Votes affect Relay parameters. They do not open water valves or redirect food shipments.
6. **Relay must not hold fiat reserves.** Custody is always delegated to regulated financial institutions.
7. **Relay must not become a dependency for critical infrastructure operation.** If Relay goes offline, water must still flow, hospitals must still function, banks must still clear. Relay is additive accountability, never a dependency.

### 49b.7 The Long-Term Model (Organic Evolution, Not Coercive Replacement)

Over decades, if enough commerce flows through Relay:
- Banks may integrate deeply (Relay becomes the evidence layer for transactions).
- Utilities may publish real-time state (Relay becomes the transparency layer for infrastructure).
- Governments may adopt Relay for policy transparency.
- Supply chains may use Relay end-to-end (from raw material to consumer).

But this is organic evolution. Not coercive replacement. Relay must work:
- In democracies and autocracies
- Under sanctions
- With offline fallback
- Without requiring any specific banking system, currency, or government structure

The true engine is: **interoperability without sovereignty conflict.**

### 49b.8 The Systemic Risk Acknowledgment

If Relay becomes the dominant coordination and transparency layer, it becomes systemic. Systemic systems must survive: nation-state hostility, sanctions, infrastructure sabotage, regulatory capture, and financial exclusion. The defenses are:
- Federated architecture (no single point of control, §48)
- Cryptographic integrity (Merkle chain, §48.1)
- Offline capability (local-first detection, contract #49)
- Jurisdiction-aware compliance (legal posture, contract #51)
- No physical dependency (Relay additive, never required)

Relay can coordinate the world. It cannot own it.

### 49b.9 Degradation Model — Graceful Contraction Toward Core Truth

Relay does not fail catastrophically. It contracts gracefully. Each degradation mode specifies what continues, what freezes, what sheds, and what refuses. The design principle: degrade toward human deliberation. Sortition remains available in every mode except ARCHIVAL. The truth layer is always the last thing standing.

**Mode A — FULL (normal operation)**

All physics active. Wind, weather, lean, engagement, projections, settlement hooks, full rendering. Everything works.

**Mode B — COMPUTE CONSTRAINED**

Trigger: Projection instance cap hit, rendering budget exceeded, federation lag.

| What Continues | What Sheds | What Freezes |
|---------------|-----------|-------------|
| Filament motion (sinking, lean) | Weather tile overlays | Projection recompute (cached results hold) |
| Slab updates | Organic variation noise | Lightning cascade detection |
| Commit recording | Individual filament rendering at high LOD | |
| Sortition | | |

Users still see branch structure and truth. Spectacle drops first, evidence last (§3.17 shed order). Log: `[DEGRADED] reason=COMPUTE_CONSTRAINED`

**Mode C — SETTLEMENT RAIL OFFLINE**

Trigger: Bank API down, stablecoin network halted, payment processor unreachable.

| What Continues | What Queues | What Flags |
|---------------|------------|-----------|
| All physics and rendering | TransferPackets (queued for settlement) | Settlement status = `PENDING_EXTERNAL` |
| All commit recording | Fiat-denominated ResponsibilityPackets | Affected filaments flagged `SETTLEMENT_PENDING` |
| Sortition (for disputes) | | |

Nothing disappears. Truth records accumulate. Settlement catches up when rails reconnect. Humans deliberate via sortition if disputes arise during the gap. Log: `[DEGRADED] reason=SETTLEMENT_OFFLINE rail=<name>`

**Mode D — FEDERATION PARTITION**

Trigger: Region isolated (network partition, infrastructure failure, geopolitical block).

| What Continues Locally | What Degrades | What Happens on Reconnect |
|----------------------|--------------|--------------------------|
| Local commit queue | Cross-region references show as `HASH_ONLY` | Deterministic merge |
| Local physics + rendering | Cross-region weather tiles empty | Divergence detection |
| Local sortition | Inter-region filament refs unresolvable | Scars if divergent commits conflict |

Upon reconnect: the system replays both partitions' commit logs deterministically. If commits conflict (same filament, different values), a scar is created and sortition resolves the dispute. Log: `[DEGRADED] reason=FEDERATION_PARTITION region=<id>`

**Mode E — RENDER COLLAPSE**

Trigger: Primitive budget catastrophically exceeded, GPU saturation, extreme device constraint.

| What Remains | What Disappears |
|-------------|----------------|
| Trunk silhouettes (always) | Weather overlays |
| Branch outlines (bundles only) | Individual filaments |
| Aggregate health indicators | Slab detail |
| Text-mode fallback | Lean/droop deformation |

This is the absolute minimum: you can still see which trees exist, which branches exist, and their aggregate health. Full detail restores when resources become available. Log: `[DEGRADED] reason=RENDER_COLLAPSE primitives=<count> budget=<max>`

**Mode F — ARCHIVAL (read-only)**

Trigger: Deliberate operator decision, or catastrophic loss of commit authority.

| What Works | What Doesn't |
|-----------|-------------|
| Full history browsing | New commits |
| Cross-section inspection | Filament creation |
| Replay | Governance votes |
| Export | Settlement |

The tree is frozen in time. You can inspect every ring, every scar, every filament that ever existed. But nothing new grows. This is the last-resort mode — Relay becomes a museum of its own history.

**The invariant:** In every degradation mode, the truth layer (committed filaments, slabs, scars, Merkle chain) is preserved. Truth is the last thing to go. Spectacle goes first, compute goes second, settlement queues third, federation partitions fourth, rendering collapses fifth. Truth survives everything except total data loss.

### 49b.10 The Philosophical Premise

Relay bets on one anthropological premise:

**If truth is rendered cleanly, humans will self-correct.**

Relay does not prevent corruption. It makes corruption geometrically obvious. Relay does not eliminate greed, ambition, fear, or tribal behavior. It removes structural invisibility. That is a fundamentally different design choice from systems that try to control human behavior through enforcement.

The safety valve is sortition (§46). Not algorithmic enforcement, not AI judgment, not founder decree — randomly selected juries of ordinary people, deliberating over visible evidence. Sortition must remain boring and procedural. The moment it becomes performative or politicized, it breaks.

This stance means: Relay over-engineers physics, geometry, and truth rendering. It under-engineers human behavioral control. That is intentional. The system trusts that if people can see the shape of their world clearly enough, they will act on what they see. That is the bet.

---

## 49c. Constitutional Hardening Checklist (GO/NO-GO)

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
| Cultural capture by spectacle (game layer dominance) | **PASS** | #80, #54, §49.11 | Evidence renders first, spectacle is additive overlay. Attention never = authority. |
| Complexity vs human understanding | **PASS** | #83, §49.12 | Physics metaphors (wilt, growth, gravity, heat, opacity). One-sentence explanation for direct-impact events. |
| Governance inertia under harmful majority | **PASS** | #82, §49.13 | Emergency reform: 80% supermajority + compressed settlement. Jury as circuit breaker. |
| Founder incapacitation / no succession | **PASS** | #81, §49.14 | Guardian becomes Steward with full tutorial. Chain to their guardian. Council as final fallback. |
| Regional feature diversity | **PASS** | #84, #51, §49.15 | Regions vote modules on/off via standard governance. Truth layer universal. Cultural identity emerges. |
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
| Parameter drift without community consent | **PASS** | #102 | Only founder levers (module activation keys) are non-votable. All else is transparent weighted-median. |

### I. Compute Scaling and Visibility

| Threat | Status | Contract(s) | Notes |
|--------|--------|-------------|-------|
| Projection graph explosion (50K users, 3 layers each) | **PASS** | #103, #104, §6.4 | No compute without observation. Instance cap per branch. Content memoization. Lazy eval. |
| Render collapse at planetary scale | **PASS** | #106, §33.3 | Sight radius + atmospheric compression. Objects outside bubble cost zero render. Privacy before geometry. |
| Dissent suppressed by visible vote identity | **PASS** | #105, §7.4 | Anonymous voting for social/ideological votes. Non-anonymous for accountability votes. Template-configurable. |

### Summary

**50/50 PASS.** All hardening items have explicit frozen contracts with enforcement mechanisms. The three most critical invariants are: **#54** (attention is a lens, never a lever), **#75** (early adopter power is intentional and self-diluting), and **#86** (Council elected by continuous confidence, not fixed terms). The latest engineering invariants are: **#103** (no compute without observation), **#104** (projection instance cap per branch), **#105** (vote anonymity), and **#106** (sight radius + atmospheric compression).

---

## 50. Camera Controller — Frozen Contract #134

### §50.1 — 6DOF Flight Model (LOCKED)

The camera is a core physics layer. It must behave deterministically with zero auto-corrections. No automatic leveling, no ENU roll-chasing, no hidden Cesium inertia. The user has full manual control over all six degrees of freedom.

**Contract #134 — Camera is sovereign. No auto-correction of orientation. Ever.**

Auto-leveling, auto-pitch, and ENU-frame chasing are permanently prohibited in FPS mode. The only corrections permitted are:
- User-initiated (explicit key press)
- Panel-lock transitions (entering 2D interaction mode)

### §50.2 — Default Keybinds (FPS Mode)

| Key | Action |
|-----|--------|
| W / S | Fly forward / backward |
| A / D | Strafe left / right |
| Q / E | Roll left / right (barrel roll) |
| Space / C | Ascend / descend |
| Shift | Boost (5×) |
| Scroll wheel | Adjust flight speed (0.25× – 20×) |
| Mouse (pointer lock) | Pitch + yaw |
| Right-drag (no lock) | Pitch + yaw fallback |
| Tab | Cycle ORBIT → FPS → RTS |
| Esc | Exit to ORBIT |
| F | Fly to nearest tree |
| H | Toggle geostationary lock |
| Ctrl+0-9 | Save camera favorite |
| Ctrl+Shift+0-9 | Recall camera favorite |
| `` ` `` | Position stack pop (go back) |

### §50.3 — Keybind Rebinding System

All keybinds are stored in a `keyBindings` map. Users may:
- Rebind any key to any action via settings UI
- Disable any individual binding (set to `null`)
- Reset to defaults
- Bindings persist across sessions via `localStorage`

The system must support alternative presets (e.g., left-handed, gamepad-style, accessibility). Presets are named binding maps loaded in full.

### §50.4 — Panel Lock Mode

When the user enters a 2D interaction surface (spreadsheet cell, document editor, code panel, search bar):
- Pointer lock releases
- Mouse returns to normal cursor
- WASD and all flight keys are suppressed (routed to the panel)
- Esc or a dedicated "return to flight" key exits panel mode
- Camera orientation is preserved exactly as left

**Contract #135 — Panel lock is the only context where flight keys are suppressed. No other system may consume flight input.**

### §50.5 — Underground Flight

FPS mode permits unlimited depth underground. The globe surface hides when altitude < 0 to prevent Cesium tile-system crashes. Scene background tints amber→red with depth. A depth label shows geological layer (TOPSOIL → BEDROCK → SHALLOW CRUST → UPPER CRUST → LOWER CRUST → UPPER MANTLE → DEEP MANTLE). NaN camera states trigger automatic restoration from last-known-good snapshot.

### §50.6 — Modes

| Mode | Ownership | Description |
|------|-----------|-------------|
| ORBIT | Cesium SSCC | Default globe interaction. Scroll zoom, drag rotate. |
| FPS | Manual 6DOF | Full flight. All Cesium inputs disabled. Pointer events blocked from SSCC. |
| RTS | Manual planar | Top-down pan. Edge scroll. Middle-click rotate. |
| BRANCH | Stub | Locked orbit around selected branch (future: CROSS-SECTION-1). |
| XSECT | Stub | Cross-section inspection (future: CROSS-SECTION-1). |

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

## 52. Business Artifact Mapping — Slides Are Dead

> *"Simplicity is the ultimate sophistication."* — Leonardo da Vinci

**Prerequisites:** None for base (template-driven branch geometry + conservation validation). Expands with: cross-section + projection modules → inspection views + dashboards.

Every corporate artifact — org charts, budget graphs, strategic bullet slides, meeting agendas, mass balance dashboards — maps to tree measurements that already exist in the physics engine. This section formalizes those mappings as canonical rules. No new physics. No new data structures. Just the correct interpretation of existing filament fields through domain-specific templates.

### §52.1 — Organizational Hierarchy = Branch Nesting Geometry

An org chart is a tree. Relay IS a tree. The mapping is structural identity:

| Org Chart Element | Tree Element |
|-------------------|--------------|
| Company | Trunk |
| C-suite function (Finance, Procurement, HR, etc.) | Primary branch |
| Regional sub-function (APAC, NAM/LAM, EMEA) | Sub-branch |
| Site-level role (Category Lead, Site Procurement) | Sub-sub-branch (leaf) |
| Person with direct reports | Branch-point |
| Person without reports | Leaf (filament source, not branch) |

**Rules:**

1. Branch **nesting depth** = reporting depth in the hierarchy. A three-level org has three levels of branch nesting.
2. Branch **thickness** reflects activity volume (sum of filament magnitude), NOT headcount. A department of 3 people doing $50M of work is thicker than a department of 200 doing $2M.
3. Branch `layoutAngle` comes from `hash(layoutKey)` per contract #114. It never shifts when people join/leave. Org restructuring is a branch migration event (§4.6) that creates scars.
4. Dotted-line relationships (matrix reporting) are cross-branch filament references — a filament on the Direct Procurement branch may reference a counterparty on the Indirect Procurement branch. The filament's `approachAngle` (θ) encodes that directional relationship.
5. The template's `branches[].sub[]` array (§21.2) defines the hierarchy. Recursive nesting to arbitrary depth is supported.

**What you see instead of an org chart slide:** Fly to the company trunk. Primary branches radiate outward. Thick branches = high activity. Wilting branches = low confidence. Leaning branches = counterparty pressure. The geometry IS the org chart — but it also shows health, workload, and risk simultaneously.

### §52.2 — Budget Allocation = Magnitude Mass per Branch

A budget bar chart shows: category × site × dollar amount. In Relay:

| Budget Slide Element | Tree Measurement |
|---------------------|------------------|
| Category (Packaging, Logistics, Energy, MRO, CAPEX) | Branch under the relevant parent |
| Site (Dimona, US, China, Russia, India) | Sub-branch per site |
| Dollar amount per category | `sum(magnitude)` of ACTIVE + CLOSED filaments on that branch |
| Bar length | Branch thickness (proportional to magnitude sum) |
| Year-over-year change | Ring thickness comparison in cross-section |

**Rules:**

1. Branch thickness = `Σ magnitude` across all filaments on the branch (including sub-branches via aggregation).
2. Ring thickness per timebox = spend during that specific period (monthly/quarterly slab). A busy Q4 produces a thick ring. A quiet Q1 produces a thin ring.
3. Lean = supplier concentration direction. If 80% of spend goes to one counterparty quadrant, the branch leans that way.
4. Heat = rate of spend change vs. prior period. Accelerating spend = hot. Stable = cool.
5. Fog = documentation completeness (average `evidenceRatio` across contributing filaments). Poor documentation = foggy branch.
6. Cross-section at year-end timebox shows all categories as concentric ring sectors — the budget pie rendered as tree rings.

**What you see instead of a budget slide:** Zoom out to the Procurement branch. US sub-branch is visibly thicker than India. CAPEX ring is thin this quarter but was thick last quarter (cross-section shows it). No narrative needed.

### §52.3 — Tactical/Strategic Items = Filament Lifecycle States

Bullet-point slides listing "tactical" and "strategic" initiatives map to filament states:

| Slide Element | Tree Measurement |
|--------------|------------------|
| Tactical item (near-term action) | OPEN or ACTIVE filament on bark surface |
| Strategic item (long-term initiative) | SCHEDULED filament at future l position (contract #124) OR projection branch (§6) |
| Bold/priority item | High-magnitude filament (thicker ribbon on bark, warmer color) |
| Strikethrough/deprioritized item | HOLD state filament (wilting visible) |
| Completed item | CLOSED filament (sunk inward from bark surface) |
| Item with risk | Low-confidence filament (transparent opacity) |

**Rules:**

1. Active work lives on the bark surface. You see it when you zoom to BARK LOD.
2. Strategic initiatives glow faintly ahead at the branch tip (SCHEDULED filaments are translucent, zero-weight per contract #124).
3. Projection branches (light blue, §6) hold "what-if" analyses — e.g., "What if we switch to in-house processing?"
4. Completed initiatives have sunk inward. Their impact is visible in ring thickness and magnitude.
5. No bullet slide is needed. The bark surface IS the tactical list. The branch tip IS the strategic roadmap.

### §52.4 — Meeting Cadence = Timebox Review Ritual

Meetings map to timebox inspection:

| Meeting Type | Tree Operation |
|-------------|----------------|
| Monthly (Regional) | Cross-section of regional branches at current-month timebox ring |
| Quarterly (Global) | Cross-section of all primary branches at quarterly timebox |
| Ad-hoc | SCHEDULED filament of type `event.meeting` at specific future l position |
| Agenda items | Twig list (stalled items) + heat map (acceleration) of the current ring |
| Progress review | Ring thickness + color comparison across last N timeboxes |
| Risk discussion | Wilt zones + fog overlay on the current slab |

**Rules:**

1. The meeting IS the cross-section inspection. You enter cross-section mode (XSECT camera mode), select the relevant timebox, and the ring tells you everything.
2. Monthly: inspect one month's ring on regional sub-branches. Thick + green = healthy. Thin + red = problem. Twigs protruding = overdue items to discuss.
3. Quarterly: inspect the quarter ring on all primary branches simultaneously. Compare ring thickness across branches to see resource distribution.
4. The agenda is NOT a separate document. The agenda is: (a) twigs on the current ring (items requiring attention), (b) scars since last meeting (reversals/corrections), (c) heat anomalies (accelerating/decelerating branches), (d) wilt zones (confidence deficits).
5. Ad-hoc meetings are SCHEDULED filaments (§5b) — they appear at the branch tip as future events and fire when their time arrives.

### §52.5 — Mass Balance = Conservation Law on Branch

Mass balance is the most physics-aligned business calculation. It is literally conservation of matter applied to a production branch.

**The formula:**

For each timebox slab on a plant/production-line branch:

```
inputSum    = Σ(magnitude) where magnitudeType == "input"
outputSum   = Σ(magnitude) where magnitudeType == "output"
wasteSum    = Σ(magnitude) where magnitudeType == "waste"
recycledSum = Σ(magnitude) where magnitudeType == "recycled"

balance     = inputSum - (outputSum + wasteSum - recycledSum)
balancePct  = outputSum / inputSum
```

This is frozen contract #16 (conservation: material state transfers must net to zero per unit type) applied to the manufacturing domain.

**Visual encoding:**

| Measurement | Tree Visual |
|-------------|-------------|
| Balance deviation (balance ≈ 0) | Ring color: green (98-102%) → amber (95-98%) → red (<95% or >105%) |
| Total throughput (inputSum) | Ring thickness |
| Evidence completeness | Ring opacity (confidence) |
| Cumulative imbalance (running total across all rings) | Branch lean — a branch that consistently loses material leans in the waste direction |
| Per-line breakdown | Sub-branch per production line, each with own rings |
| PPU (per production unit) metrics | Derived filament magnitude normalized by output count |

**Cross-section reveals the entire history at a glance:**

- 2021 ring: thin, green = low volume, good balance (97.73%)
- 2022 ring: medium, green = growing, still balanced (97.65%)
- 2023 ring: medium, green-amber = balance drifting (97.05%)
- 2024 ring: thick, amber = high volume, slight concern (96.64%)
- 2025 ring: partial, current state visible

**The heat-mapped cumulative balance table** (red-to-green gradient) maps directly to ring color intensity across the cross-section. Persistent red = chronic lean. The tree literally tilts toward the problem.

**Required filament fields for mass balance:**

Filaments on manufacturing branches carry an additional schema field beyond the six universal domains:

```
magnitudeType: "input" | "output" | "waste" | "recycled" | "byproduct"
```

This field determines which side of the conservation equation the filament's magnitude contributes to. The consolidation gate (§21.2) validates that `balance ≈ 0` within configured tolerance at timebox close.

**Contract #136 — Mass balance is conservation law, not dashboard logic.** Per-timebox material balance is computed from typed-magnitude filament sums. Deviation from zero balance is rendered as slab color shift. Cumulative imbalance is structural lean. The computation is deterministic, replayable, and identical at every LOD.

### §52.6 — Dashboard = Projection Branch View

Power BI dashboards, Excel pivot tables, and reporting views are projection branches:

| Dashboard Element | Tree Equivalent |
|-------------------|-----------------|
| Dashboard | Projection branch (light blue, §6) reading from truth filaments |
| Table/chart inside dashboard | CELL LOD renderer for that projection |
| Filters (Plant, Month, Year, Fabric Group) | Client-side view masks (contract #26, never mutate truth) |
| "Current Period" tab | Timebox scrubbing (TIME-SCRUB-1) |
| Calculated column (Mass Balance %) | Projection formula node (§6.1 decision node) |
| Export to PDF/Excel | Projection branch exportable in flat format |

**Rules:**

1. Dashboards do not replace truth. They are projections OF truth. Always light blue. Always terminal (contract #11).
2. The underlying data lives on truth branches (natural colors). The dashboard projection reads it, computes derived values, and presents them.
3. Filters are view-state only. Two users looking at the same projection with different filters see different slices but neither has altered the underlying filaments.
4. Any value shown in a dashboard can be traced to its source filament in one click (drill-down through projection → truth filament → commit history).

---

## 53. Compartmentalized Accounting & Atomic Traceability — Frozen Contracts #138-139

> *"You can't manage what you can't measure."* — Peter Drucker

**Prerequisites:** None for base (composition evidence type, conservation gates, lot-to-FG traceability chains). Expands with: AR interaction modules → product passport projections, grocery-store camera overlay, ESG three-branch reconciliation.

Pick up any product off a store shelf. That plastic bottle came from a factory. The factory bought resin pellets from a supplier. The supplier made those pellets from crude oil extracted from a specific well. Every step — extraction, refining, pelletizing, molding, filling, shipping — consumed inputs and produced outputs. If you add up all the inputs and subtract all the outputs at every step, the numbers should balance. If they don't, something leaked, was wasted, or was lied about.

Today, companies track this loosely. They estimate emissions, guess at waste, and report totals that nobody can verify. Relay changes that by requiring the same conservation math at every step — and making the uncertainty visible. If a factory can't prove where 3% of its raw material went, that 3% shows up as fog on the branch. If a company buys carbon credits but its factory emissions didn't actually change, storm clouds appear over the "green" claims. You don't need to read a sustainability report. You look at the tree and see whether it's clear or foggy.

"A place for everything, and everything in its place." Every physical flow — material, energy, waste, emission — has a deterministic location in the tree. Nothing is estimated without marking the estimate as uncertain. Nothing is hidden without the hiding being visible as fog. See §77 for how this extends to full mineral-to-shelf product traceability with version control, BOM branch physics, and recall cascading.

### §53.1 — Structural Isomorphism, Not Botanical Simulation

Relay mimics **wood formation**, not tree biology. The mapping is:

| Tree Physics | Relay Equivalent | What It Is NOT |
|---|---|---|
| Growth fiber laid down during cambium cycle | Filament (discrete commit) | Not sap (fluid flow) |
| Cambium layer (living growth boundary) | `r = 1.0` zone | Not a continuous membrane |
| Bark (outer surface) | OPEN/ACTIVE filaments | Not detachable |
| Wood rings (inner structure) | CLOSED/ABSORBED slabs | Not editable |
| Heartwood (dense core) | Terminal stillness (§1.3) | Not deletable |
| Grain direction | Commit causality chain | Not aesthetic |

**Contract #138 — Filaments are discrete growth fibers, not fluid flows. All state changes are commit-driven events. No continuous simulation, no streaming state, no fluid dynamics. Every filament transition is an atomic append-only commit that can be replayed deterministically.**

This prevents future proposals for "real-time streaming filaments" or "sap-flow animations" that would break determinism and replayability.

### §53.2 — Cambium Layer Formalization

The radial position `r` in cylindrical coordinates defines four structural zones:

| Zone | r range | State | Physics |
|------|---------|-------|---------|
| Bark surface | `r > 1.0` | OPEN, ACTIVE | Visible, mutable via commits, full force participation |
| Cambium | `r = 1.0` | Transition boundary | Where spawning, lifecycle transitions, and schema changes occur |
| Wood | `0 < r < 1.0` | CLOSED, ABSORBED | Compressing inward, immutable, read-only |
| Heartwood | `r → 0` | Terminal stillness | Zero force contribution, pure structural mass (Contract #133) |

The cambium is the only zone where new structure forms. Everything outside it is active work. Everything inside it is history. Schema version changes (new columns, new fields) manifest as bark ridge deformation at the cambium boundary — visible in cross-section as a subtle grain shift.

### §53.3 — Molecular Composition Evidence Model

"Atomic accounting" does not track individual atoms (~10²⁵ per laptop). It tracks **measured composition at the right physical unit** with explicit uncertainty.

Every MaterialLot filament may carry a `composition` evidence attachment:

```json
{
  "compositionEvidence": {
    "version": "1.0",
    "lotId": "LOT-PP-2026-02-ACME-8934",
    "materialClass": "polypropylene",
    "grade": "PP-H350",
    
    "chemicalComposition": {
      "polymerType": "isotactic-polypropylene",
      "polymerPct": 97.8,
      "additives": [
        { "name": "UV-stabilizer", "pct": 0.8, "cas": "52829-07-9" },
        { "name": "antioxidant", "pct": 0.3, "cas": "6683-19-8" },
        { "name": "slip-agent", "pct": 0.15, "cas": "112-84-5" }
      ],
      "impurities": [
        { "element": "Fe", "ppm": 12, "method": "ICP-OES" },
        { "element": "Cl", "ppm": 3, "method": "XRF" }
      ]
    },
    
    "physicalProperties": {
      "meltFlowIndex": { "value": 35, "unit": "g/10min", "method": "ASTM-D1238" },
      "density": { "value": 0.905, "unit": "g/cm3" },
      "molecularWeightAvg": { "value": 180000, "unit": "Da" }
    },
    
    "environmentalProfile": {
      "emissionsIntensity": { "value": 1.3, "unit": "kgCO2e/kg", "scope": "cradle-to-gate" },
      "waterUsage": { "value": 2.1, "unit": "L/kg" },
      "energyInput": { "value": 3.8, "unit": "kWh/kg" }
    },
    
    "evidenceRefs": [
      { "type": "COA", "hash": "sha256:abc...", "issuer": "ACME Lab" },
      { "type": "spectral-fingerprint", "hash": "sha256:def...", "method": "FTIR" },
      { "type": "emissions-declaration", "hash": "sha256:ghi...", "standard": "ISO-14067" }
    ],
    
    "measurementUncertainty": {
      "polymerPct": 0.5,
      "impurityPpm": 2,
      "emissionsIntensity": 0.15
    }
  }
}
```

**Rules:**

1. Composition evidence is optional per template but required for high-confidence manufacturing branches.
2. `measurementUncertainty` is mandatory when composition is provided. Omitting it is not "perfect measurement" — it means `uncertainty = unknown` which applies a confidence penalty.
3. Spectral fingerprint hashes enable batch verification without exposing proprietary formulations.
4. `environmentalProfile` fields are the basis for ESG truth branches (§53.6).

### §53.4 — Composition Inheritance Through Transformation Chains

When a TransformationRun filament consumes input lots and produces outputs, the output inherits a **mass-weighted composition profile**:

```
output.composition[component] = Σ(input[i].composition[component] × input[i].massFraction)
```

**Contract #139 — Composition inheritance through transformation chains is computed as mass-weighted average of input lot compositions. Uncertainty compounds: output uncertainty = √(Σ(input[i].uncertainty² × input[i].massFraction²)). No transformation may reduce uncertainty below the worst input without new measurement evidence.**

The full traceability chain for any finished good:

```
Vendor Lot (with composition evidence)
  → TransformationRun (mass balance enforced)
    → WIP (inherits weighted composition)
      → Slitting/Cutting Run
        → Finished Good (inherits composition + dimensional specs)
          → QC Test (validates properties against spec)
            → Shipment → Retail Location → Consumer scan
```

At any point in this chain, clicking a filament shows:
- Its inherited composition profile
- The specific vendor lots that contributed
- The confidence level (based on measurement evidence quality)
- The emissions footprint (accumulated through the chain)

### §53.5 — Multi-Vendor Lot Consolidation

Multiple vendors may supply the same material grade. Relay does **not merge lots**. It links them via a composed projection:

| Concept | Relay Mechanism |
|---------|----------------|
| Vendor lot A (5000 kg PP from ACME) | Truth filament on `procurement.raw` branch |
| Vendor lot B (3000 kg PP from BASF) | Truth filament on `procurement.raw` branch |
| Internal component "PP Grade X" | Projection filament (light blue) reading both lots |
| Weighted cost | Projection formula: `Σ(lot.cost × lot.mass) / Σ(lot.mass)` |
| Weighted emissions | Projection formula: `Σ(lot.emissionsIntensity × lot.mass) / Σ(lot.mass)` |
| QC compatibility check | Gate: all lots must pass spec range for grade X |

The projection is always read-only, always traceable to source lots, and always light blue. If one vendor lot has quality issues, the projection updates automatically and the internal component shows reduced confidence.

### §53.6 — ESG Three-Branch Model (Greenwashing Detection)

Environmental claims are structurally separated into three branches that must reconcile:

**Branch A — Physical Emissions Truth** (`environment.emissions.truth`)

| Filament Type | Evidence Required | Unit |
|---|---|---|
| Stack emission event | Sensor hash, meter reading | kg CO₂e, NOx, SOx, VOC |
| Electricity consumption | Utility invoice, smart meter | kWh → kg CO₂e via grid factor |
| Fuel combustion | Purchase record, flow meter | kg CO₂e |
| Water discharge | Effluent sensor, lab cert | m³, BOD/COD ppm |
| Waste generation | Weighbridge ticket, manifest | kg by waste class |

This branch is **ground truth**. It measures what actually happened.

**Branch B — Policy & Credit Claims** (`environment.policy.credits`)

| Filament Type | Evidence Required | Unit |
|---|---|---|
| Carbon credit purchase | Registry receipt, serial number | tCO₂e credit |
| Carbon tax payment | Tax filing, payment confirmation | $ |
| Certification achieved | Auditor report, certificate | Status (valid/expired) |
| Offset claim | Offset project documentation | tCO₂e claimed |
| Regulatory submission | Filing receipt, data snapshot | Compliance status |

This branch is the **paper layer**. It records what was claimed or purchased.

**Branch C — Physical Interventions** (`environment.interventions`)

| Filament Type | Evidence Required | Unit |
|---|---|---|
| Equipment installed | PO, installation docs, commissioning test | Description + cost |
| Process change | Engineering change order, before/after measurement | ΔEmissionsIntensity |
| Fuel/energy source switch | Contract change, meter switch | New source + grid factor |
| Supplier material change | New COA, spec comparison | Composition delta |
| Recycling loop enabled | Process flow change, mass balance proof | kg recycled/period |

This branch records **what was actually done** to change physical reality.

**Reconciliation Rule:**

At timebox close, the system checks:

1. If Branch B (credits) has activity but Branch A (truth) shows no measurable `ΔEmissionsIntensity` in the corresponding timeboxes → **reconciliation warning** fires.
2. Warning renders as: storm risk on the ESG sub-tree, fog on the credits branch.
3. This is advisory, not a hard refusal — credits may legitimately offset emissions elsewhere. But the visual signal makes "buying green without being green" geometrically obvious.

**Impact detection formula** (deterministic, per intervention):

```
For intervention I with baseline window T(-N) and post window T(+N):
  ΔIntensity = avg(emissionsPerTonOutput in T(+N)) - avg(emissionsPerTonOutput in T(-N))
  impact = ΔIntensity × confidence(measurementEvidence)
  
  If confidence < 0.5: impact is foggy (uncertain)
  If ΔIntensity ≈ 0 but credits purchased: storm risk
  If ΔIntensity < 0 and confidence > 0.7: verified improvement (branch firms up)
```

**Weather encoding for ESG:**

| Weather | ESG Meaning |
|---------|-------------|
| Heat | Emissions intensity changing rapidly (something happened) |
| Cold | Nothing changed (claims without physical impact) |
| Fog | Weak measurement evidence, too many estimates |
| Storm | High heat + high fog, OR large credit activity with no measurable improvement |
| Scar | Corrected regulatory filings, restated emissions data |
| Lightning | Active recall cascade or cross-site contamination event |

### §53.7 — Recall Cascade Mechanism

When a defect is discovered in any input (additive lot, machine part, raw material), Relay computes the full impact chain using the lightning equation (§3.16):

```
Defective Lot identified
  → All TransformationRuns that consumed it (backing refs)
    → All WIP produced by those runs
      → All FG cut from that WIP
        → All shipments containing that FG
          → All retail locations holding that FG
            → Consumer product passport updates
```

The cascade magnitude determines lightning intensity. If `cascadeMagnitude > stormThreshold`:
- All affected branches flash (lightning)
- Product passport projections update with recall status
- Affected FG filaments gain a scar with the defect reference

**Consumer-facing overlay** (grocery store camera scenario):
User scans product barcode → Relay resolves FG filament → projection branch loads:
- Composition breakdown (inherited from lot chain)
- Emissions footprint (accumulated)
- Quality confidence score
- Active recall status (if any)
- Scar history
- Maintenance events on production line during that run

If recall is active: red warning ring. If emissions are high relative to category average: amber heat glow. If measurement evidence is sparse: fog overlay. No marketing PDF — just geometry.

### §53.8 — True Mass Balance at Scientific Scale

Mass balance in §52.5 is the business-level conservation law. At scientific scale, it becomes:

**Per transformation step, per timebox:**

```
Σ(input.mass × input.composition[c]) = Σ(output.mass × output.composition[c])
                                       + Σ(waste.mass × waste.composition[c])
                                       + Σ(emission.mass × emission.composition[c])
                                       + Δinventory[c]
                                       ± measurement_uncertainty
```

This is enforced **per chemical component `c`**, not just total mass. If PP input is 97.8% polymer but FG output claims 99% polymer with no additive separation step, the conservation check fails.

**Visual encoding:**
- Ring color intensity = mass balance deviation (same as §52.5)
- Ring opacity = measurement confidence (weighted by composition evidence completeness)
- Fog = components with missing or estimated composition
- Thick rings = high throughput periods
- Thin rings = low activity or regulatory freeze (seasonal dormancy equivalent)

**Scaling rule** (same equations at every level):

| Scale | Input | Output | Conservation Check |
|-------|-------|--------|-------------------|
| Single machine | Raw material lots | WIP + scrap + emissions | Per-run mass balance |
| Factory | All machine inputs | All products + waste + emissions | Per-timebox site balance |
| Company | All factory inputs | All shipped products + total waste + total emissions | Per-quarter corporate balance |
| Region | All company inputs | Regional product output + regional emissions | Per-year regional balance |
| Planet | All extracted resources | All products + all emissions + all waste | Planetary mass balance |

`W_parent = Σ W_child` at every level. No new physics.

---

## 54. Business Process Catalog — How Standard Frameworks Map to the Tree

Every industry has standard processes — sales pipelines, project lifecycles, risk registers, maintenance schedules, HR onboarding, IT ticketing. In traditional software, each one gets its own dedicated application with its own database, its own reporting, and its own version of the truth.

In Relay, all of them use the same physics. A sales opportunity closing is the same event as an invoice being paid or a maintenance ticket being resolved: a filament migrating inward. A stalled project is the same as a stalled shipment: a twig protruding from the bark. A recalled product and a reverted financial entry both leave the same kind of mark: a scar.

This section maps common business processes to Relay's existing mechanics. No new physics is introduced. Every entry below uses the filament lifecycle (`OPEN → ACTIVE → HOLD → CLOSED → ABSORBED`), the six universal domains (identity, counterparty, time, magnitude, evidence, lifecycle), and the rendering physics (heat, fog, storm, lean, wilt, scars, twigs) that already exist.

### §54.1 — Opportunity Pipeline / Sales Funnel

The sales pipeline is a branch where each deal is a filament. Stage progression is lifecycle state.

| Sales Stage | Relay Lifecycle | What You See |
|-------------|----------------|-------------|
| Lead identified | `SCHEDULED` | Translucent filament at future time slot, zero physics weight |
| Qualified | `OPEN` | Filament spawns on bark surface, visible, begins accumulating commits |
| Proposal sent | `ACTIVE` | Commits attach (proposal document, pricing, evidence of engagement) |
| Negotiation | `ACTIVE` + high commit rate | Branch heats up (high activity rate), counterparty θ shows vendor direction |
| Won | `CLOSED` → migrates inward | Filament firms up, sinks into ring. Branch thickens. |
| Lost | `CLOSED` with loss marker | Filament still sinks (truth preserved) but magnitude marked as zero-revenue. Scar if terms were reverted. |
| Stalled | `HOLD` | Twig protrudes — visible overdue signal. Wilt if confidence drops. |

**What a sales manager sees**: A thick, warm branch means active pipeline. Lots of twigs means lots of stalled deals. A branch leaning heavily toward one counterparty means revenue concentration risk. Thin rings in a quarter mean low close rate. No slides needed.

**Template fields**: `dealValue` (magnitude), `customer` (counterparty), `probability` (confidence), `expectedCloseDate` (scheduled time slot), `lossReason` (scar annotation).

### §54.2 — Project Management Lifecycle

A project is a branch. Milestones are timeboxes. Tasks are filaments.

| PM Phase | Relay Mechanism | What You See |
|----------|----------------|-------------|
| Initiation | Branch created with template binding | New branch appears on trunk |
| Planning | `SCHEDULED` filaments placed at future time slots | Translucent filaments along the branch tip, showing planned scope |
| Execution | `SCHEDULED → OPEN → ACTIVE` as work begins | Filaments solidify, commits attach, branch thickens |
| Monitoring | Cross-section inspection at current timebox | Ring shows: thick = on track, thin = under-delivering, foggy = missing evidence |
| Change request | Schema version bump + scar | Bark ridge appears where scope changed. Scar if budget/timeline reverted. |
| Closure | All filaments `CLOSED` or `ABSORBED` | Branch stops growing. Clean rings = healthy project. Twigs = unresolved items. |
| Post-mortem | Cross-section of full branch | Every ring visible. Where were the scars? Where did it wilt? Where was it hot? |

**What a project manager sees**: Branch health is project health. Twigs are overdue tasks. Fog is missing status updates. Heat is rapid change (good or bad). The cross-section at any milestone shows whether the team delivered.

### §54.3 — Risk Register

Risk is not a separate system. Risk is what the tree already shows you — you just need to name it.

| Risk Concept | Relay Physics | What You See |
|---|---|---|
| Risk identified | Filament on a "risk" sub-branch with probability + impact as magnitude fields | Visible on bark |
| Probability | `confidence` field (inverted: high probability = high confidence the risk is real) | Opacity of the filament |
| Impact | `magnitude` field | Thickness / heat of the filament |
| Mitigation in progress | `ACTIVE` with commits showing mitigation actions | Evidence accumulating |
| Risk realized | Filament transitions to incident, scar if damage occurred | Scar on the ring, possible storm |
| Risk expired | `CLOSED` without realization | Sinks normally, thin ring |
| Concentration risk | Multiple risk filaments from same counterparty direction | Branch lean toward that θ angle |

**Risk matrix** becomes visual: high-probability, high-impact risks are hot, bright, thick filaments near the bark. Low risks are thin, cool, fading inward. You don't read a spreadsheet — you see which branches are under pressure.

### §54.4 — Supplier Scorecard / Vendor Rating

Vendor quality is not a separate KPI dashboard. It emerges from the tree.

| Vendor Metric | Relay Source | How It Shows |
|---|---|---|
| On-time delivery % | Ratio of vendor filaments closing before `expectedResolutionDays` | Branch firmness (on-time = firm, late = wilting) |
| Quality defect rate | QC `FAILED` filaments linked to vendor lots | Twigs + scars on vendor-linked sub-branch |
| Price competitiveness | Magnitude (cost) relative to other vendors for same material grade | Ring thickness comparison across vendor sub-branches |
| Documentation completeness | Evidence attachment count vs template requirements | Fog (missing evidence = foggy vendor branch) |
| Responsiveness | Time between `OPEN` and first commit | Heat (fast = hot, slow = cold) |
| Overall score | Composite: firmness × (1 - twig rate) × (1 - fog) × heat | Derived projection — not a magic number, fully traceable |

**What a procurement manager sees**: Good vendors have firm, clear, warm branches. Bad vendors have foggy, twig-covered, wilting branches. You don't need a scorecard — the shape tells you.

### §54.5 — Engineering Change Orders (ECO)

A design change is a schema version bump on a branch. It is treated the same way a constitutional amendment is treated in governance (§19): it is append-only, evidence-required, and permanently visible.

| ECO Stage | Relay Mechanism |
|-----------|----------------|
| Change requested | `DRAFT` filament on R&D or engineering branch with proposed spec delta |
| Impact assessment | Commits attach: affected BOMs, affected FG, cost estimate, timeline |
| Approval | `DRAFT → PROPOSED → COMMITTED` via governance gate (§19.1) |
| Implementation | Schema version bump on affected branches. Bark ridge forms at the transition point. |
| Verification | QC filaments on new-spec production runs must pass before old-spec sunset |
| Audit trail | The schema change, the approval chain, and the before/after specs are all permanent filaments |

Schema changes never overwrite history. Old-spec filaments remain in their rings. New-spec filaments form on the new bark surface. The transition is visible in cross-section as a grain shift — the same way a real tree shows where growth conditions changed.

### §54.6 — Incident / Ticket Management

Every ticket is a filament. Every ticket system is a branch.

| Ticket Stage | Relay Lifecycle | Visual Signal |
|---|---|---|
| Created | `OPEN` | New filament on bark |
| Assigned | First commit (assignee attached) | Evidence begins accumulating |
| In progress | `ACTIVE` | Commits flowing |
| Escalated | Priority magnitude increased | Filament gets hotter, branch heats up |
| Resolved | `CLOSED` | Migrates inward |
| Reopened | New commit on closed filament (creates scar) | Scar visible — reopening is a correction event |
| SLA breach | `HOLD` past expected resolution | Twig protrudes. Wilt increases. |

**What an operations manager sees**: A branch covered in twigs means too many open tickets. A branch with lots of scars means tickets keep getting reopened (quality issue). A hot branch means high activity. A foggy branch means tickets are being closed without evidence (rubber-stamping).

### §54.7 — Contract Lifecycle Management

A contract is a filament. Its lifecycle maps directly.

| Contract Stage | Relay State | Notes |
|---|---|---|
| Draft | `DRAFT` | Not yet proposed, internal only |
| Negotiation | `OPEN` with commits (redlines, counter-offers, legal review) | Each version is a commit |
| Execution / Active | `ACTIVE` | Signed. Obligations are linked filaments (deliverables, payments, milestones) |
| Amendment | New commit on active filament + scar if terms changed materially | Scar = visible contract modification |
| Renewal | `SCHEDULED` filament at renewal date linked to current contract | Translucent future filament appears |
| Expiration | `CLOSED` at contract end date | Natural lifecycle completion |
| Termination | `CLOSED` early with termination reason commit | Scar if breach-related |
| Dispute | Sortition trigger (§46) | Jury selected, verdict recorded permanently |

### §54.8 — CAPEX / OPEX Tracking

Capital expenditures and operating expenditures are simply two branch categories under the treasury/finance branch:

| Type | Branch | Sinking Behavior | Ring Meaning |
|---|---|---|---|
| CAPEX | `finance.capex` | Milestone-driven (asset lifecycle) | Each ring = depreciation period. Thick ring = major investment. |
| OPEX | `finance.opex` | Earth-time (calendar) | Each ring = operating period. Thickness = spend volume. |

CAPEX filaments have long lifecycles (asset purchase → installation → commissioning → depreciation → disposal). OPEX filaments have short lifecycles (monthly bills, recurring services). The cross-section shows: thick CAPEX rings in investment years, steady OPEX rings in operating years. Lean shows which vendors dominate spend.

### §54.9 — Inventory Management

Inventory is a branch where filaments represent stock states, not transactions.

| Inventory Concept | Relay Mechanism |
|---|---|
| Current stock level | Latest `InventoryState` filament per SKU (magnitude = quantity) |
| Reorder point | `SCHEDULED` filament at future time slot when stock is projected to hit minimum |
| Safety stock | Template-defined threshold. When latest magnitude < safety stock → twig emerges |
| Min/Max | Template evidence rules. Below min → wilt. Above max → heat (overstocking pressure) |
| Stock-out | Magnitude reaches zero. Branch goes cold. Storm if downstream production affected. |
| Cycle count | QC-type filament comparing physical count to system count. Deviation → scar. |

### §54.10 — KPI Dashboards (OEE, Yield, Throughput, Cycle Time)

Manufacturing KPIs are projection branches that read truth branches:

| KPI | Source Branches | Projection Formula |
|---|---|---|
| **OEE** (Overall Equipment Effectiveness) | `production.runs` + `maintenance` | `availability × performance × quality` where availability = (run time - downtime) / scheduled time |
| **Yield** | `production.runs` + `quality.qc` | `(good output / total output) × 100` |
| **Throughput** | `production.runs` | `total output mass / time period` — directly visible as ring thickness |
| **Cycle time** | `production.runs` | `avg(endTime - startTime)` per filament — visible as filament spacing |
| **Scrap rate** | `waste` + `production.runs` | `waste mass / input mass` — visible as waste branch thickness relative to production |
| **MTBF / MTTR** | `maintenance` | Mean time between failures / mean time to repair — visible as maintenance branch spacing and firmness |

These are never standalone dashboards. They are projection branches (light blue) that compute values from truth branches. Any number shown can be traced to the source filaments in one click.

### §54.11 — HR / Talent Pipeline

People processes are branches. Each employee, candidate, or position is a filament.

| HR Process | Relay Mapping |
|---|---|
| Open position | `SCHEDULED` filament on recruiting branch |
| Candidate sourced | `OPEN` filament with candidate identity |
| Interview stages | Commits on the filament (screening, technical, cultural, offer) |
| Hired | `CLOSED` → new employee filament created on org branch |
| Rejected | `CLOSED` with rejection reason (truth preserved, not deleted) |
| Onboarding | Filament on onboarding branch with milestone commits |
| Performance review | Timebox cross-section on employee's activity branch — same as any other inspection |
| Offboarding | Employee filament `CLOSED` with exit documentation |

### §54.12 — IT Asset Management

Every device, license, and service is a filament on the IT branch.

| Asset Lifecycle | Relay State |
|---|---|
| Procurement | `OPEN` (PO created) |
| Deployment | `ACTIVE` (assigned to user/location, commits: config, network enrollment) |
| Maintenance | Linked maintenance filaments (patches, repairs, upgrades) |
| Refresh/Replacement | `SCHEDULED` filament at refresh date; old asset → `CLOSED` |
| Decommission | `CLOSED` → evidence of data wipe, disposal certification |
| License expiry | `SCHEDULED` filament at expiry date. Twig if no renewal action before expiry. |

---

## 55. Live Confidence Overlay & Public Proceedings

**Prerequisites:** Confidence, presence, and AR interaction modules for base (live confidence aggregation, journalism accountability, educational grading panels, broadcast overlays). Expands with: duel modules → threshold duels with resource transfer.

Imagine watching a court trial, a news broadcast, or a company presentation — and instead of just listening, you can see whether the audience believes what's being said. Not as a poll after the fact, but as a live ring of light around the speaker that firms up when they cite real evidence and goes foggy when they make unsupported claims. That ring is not opinion. It is the same confidence physics that govern every filament in Relay — just computed in real time from audience input instead of from documents.

Every module below — courts, journalism, Shark Tank, public speaking, duels — uses the same core mechanic: a person speaks, their claims become filaments, and an audience votes confidence on those filaments live.

### §55.1 — Core Mechanic: Live Confidence Aggregation

The live confidence overlay combines two existing systems:

1. **Filament confidence** (§9, CONFIDENCE-1) — dual model: `orgConfidence` (institutional judges) + `globalConfidence` (public audience)
2. **Presence system** (§17) — attention markers showing who is watching

When a speaker is live:

| Step | What Happens |
|------|-------------|
| Speaker makes a claim | SCV segments the speech into a timestamped claim-filament in real time |
| Claim references evidence | If the referenced filament exists in Relay, the claim auto-starts at higher confidence (green glow). If not, it starts neutral (fog). |
| Audience votes | Each watcher slides confidence 0–100% on the current claim. Weighted by viewer's own reputation (branch firmness). |
| Aggregation renders | The speaker sees a live ring: warm + clear = audience believes. Cold + foggy = audience doubts. |
| Contradiction detected | If the current claim contradicts a previous filament by the same speaker → lightning flash + scar on their branch |
| Permanent record | When the event ends, the timebox closes. Every claim, every vote, every evidence link becomes a permanent ring. |

**What the speaker sees in real time**: A confidence ring around their avatar. It shifts as they talk. When they show evidence and it checks out, the ring firms up. When they make unsupported claims, fog rolls in. They can adjust their delivery based on what the tree tells them.

**Anti-manipulation rules**:
- Confidence votes are weighted by voter reputation (branch firmness), not one-person-one-vote. A well-established expert's confidence vote weighs more than a new anonymous account's.
- Sybil protection (§46) prevents vote flooding.
- The speaker cannot see individual voter identities — only the aggregate.
- Historical accuracy updates: claims start neutral. As evidence is found or linked over hours/days after the event, confidence updates retroactively on the recording.

### §55.2 — Public Proceedings (Courts, Government, Town Halls)

A court case is a branch. Each hearing is a timebox. Each claim by each side is a filament.

| Element | Relay Mapping |
|---------|--------------|
| Courthouse / government address | Location-anchored tree on the globe |
| Case / hearing | Branch on that tree |
| Prosecution claim | Filament on prosecution sub-branch with evidence refs linking to supporting filaments |
| Defense claim | Filament on defense sub-branch with counter-evidence |
| Witness testimony | Filament with video evidence attachment, timestamped to claims |
| Judge's ruling | Governance commit — binding authority filament |
| Jury deliberation | Sortition committee (§46) confidence votes, sealed until verdict |
| Appeal | New branch spawned from ruling filament. Appellate court = higher-authority tree. |
| Supreme/Constitutional review | Escalation to council tier (§46.2). Verdict is final governance commit. |
| Public record | Everything filmed = video evidence attachment. Append-only. Permanent. Replayable. |

All proceedings are filmed and segmented into claim-filaments. The public can watch the replay and see the confidence overlay — which claims were well-evidenced, which were disputed, where the scars are.

### §55.3 — Journalism Accountability

A journalist is a counterparty. Every published claim is a filament on their professional branch.

| Journalism Concept | Relay Mapping |
|---|---|
| Published article / segment | Filament with content hash, source refs, publication timestamp |
| Cited sources | Evidence links to source filaments. Relay-native sources = high base confidence. External-only = lower. |
| Unverified claim | No evidence links → fog by default. Audience sees "unsupported" visually. |
| Retraction / correction | Scar on the original filament. Permanent. Visible in cross-section forever. |
| Pattern of false claims | Branch wilts (cumulative low confidence). Fog builds. Twigs accumulate. |
| Journalist reputation | Not a score — the shape of their branch. Firm, clear, warm = trustworthy. Foggy, scarred, twig-covered = unreliable. |

The community doesn't need to "fact-check." The tree does it. If the backing filament exists, the claim is backed. If it doesn't, the claim is foggy. Live confidence votes add human judgment on top.

### §55.4 — Educational Speaking & Performance Grading

A speaking event is a branch. The speaker creates claim-filaments in real time. A grading panel — sortition-selected (random, fair) or hired (judges, mentors) — watches and scores.

**Live variable sliders**: Each judge has N configurable axes they adjust in real time. The event template pre-defines the axes or judges define their own.

| Example Axis | Range | What It Measures |
|---|---|---|
| Content depth | 0–100% | Substantive vs superficial |
| Evidence quality | 0–100% | Claims backed by filaments? |
| Delivery / clarity | 0–100% | Can the audience follow? |
| Novelty | 0–100% | New information or repetition? |
| Relevance | 0–100% | Addresses the stated topic? |
| Financial clarity | 0–100% | (Shark Tank) Numbers make sense? |
| Market viability | 0–100% | (Shark Tank) Is there a real market? |
| Artistic merit | 0–100% | (Performance) Creative quality? |

Each judge produces time-stamped confidence commits on each axis. The speaker sees aggregated rings — one color per judge — shifting in real time. The audience also has aggregate sliders, weighted lower than judges but visible.

The ring that forms when the presentation ends IS the permanent record. In cross-section you can see: where the speaker was strong (thick, warm segments), where they lost the room (thin, cool), and where a judge spiked a specific axis.

**Shark Tank scenario**: Five judges. Presenter pitches. When they show weak financials, the "financial clarity" rings collapse. When they demo a working prototype, "market viability" firms up. The aggregated shape at timebox close determines the outcome.

### §55.5 — Threshold Duels and Formal Debates

A duel (§40.6) or formal court case becomes a structured sortition where two parties present evidence and confidence thresholds determine the outcome.

**Structure:**

```
DUEL / FORMAL DEBATE
├── Party A branch (challenger / prosecution)
│   ├── Claim filaments (with evidence refs)
│   └── Rebuttal filaments
├── Party B branch (respondent / defense)
│   ├── Claim filaments (with evidence refs)
│   └── Rebuttal filaments
├── Jury branch (sortition-selected)
│   ├── Per-juror confidence votes per claim
│   └── Per-juror overall verdict
└── Verdict filament (governance commit)
```

**Rules (set before the duel begins):**

| Rule | Definition |
|------|-----------|
| Win condition | One party's aggregate confidence drops below threshold (e.g., 30%) |
| Duration | Fixed timeboxes (rounds, sessions, or calendar duration) |
| Jury size | Sortition pool (7 for minor disputes, 21 for major, 101 for landmark) |
| Evidence rules | What filament types are admissible. Template-defined. |
| Appeal threshold | If verdict margin < X%, automatic escalation to larger jury |
| Resource stakes | What transfers on loss (engagement credits, vote power, commit rights) |

**What happens live:**

1. Party A presents claim C1 with evidence
2. Jury votes confidence on C1
3. Party B rebuts with counter-evidence
4. Jury updates confidence (may rise or fall)
5. Alternating rounds continue until duration expires or threshold crossed

**What everyone sees**: Two branches growing in real time. One firms up (clear, warm, thick). The other wilts (foggy, thin, twig-covered). When one branch crosses the loss threshold — the verdict commits automatically.

The entire proceeding is permanent and replayable. Every claim, every evidence ref, every confidence vote preserved in the rings.

### §55.6 — News & Live Broadcast Overlays

Any live broadcast (news, press conference, debate, State of the Union) can be a Relay event:

| Broadcast Element | Relay Overlay |
|---|---|
| Speaker's statement | SCV segments into claim-filaments in real time |
| Evidence cited | Auto-linked if filaments exist in Relay. Green glow = verified. Fog = unverifiable. |
| Audience confidence | Aggregated from all watchers. Ring around speaker's avatar. |
| Historical accuracy | Speaker's past claims branch shown as an inset — firm or foggy? |
| Contradiction | Current claim vs previous filament by same speaker → lightning flash |
| Fact-check lag | Claims start neutral. Confidence updates retroactively as evidence surfaces. |

The broadcast becomes a permanent, inspectable branch. Years later you can cut the cross-section and see which claims held up and which scarred.

---

## 56. Language Trees & Multi-Language Learning

> *"A different language is a different vision of life."* — Federico Fellini

**Prerequisites:** None for base (word filaments, lifecycle states, semantic domain branches, translation links, curriculum projections). Expands with: AR interaction modules → parallel bark multi-language view, pronunciation SCV assistance, live translation overlays, endangered language monitoring.

Every dictionary you've ever used is a frozen snapshot — a book that was accurate the day it was printed and wrong the day after. Languages don't work that way. Words are born, change meaning, spread across borders, go out of fashion, and sometimes die. A dictionary can't show you that. A tree can.

In Relay, every language is a tree on the globe, rooted where that language was born. English grows from London. Mandarin from Beijing. Hebrew from Jerusalem. Arabic from the Arabian Peninsula. Each language tree has the same physics as a company tree — because a language is structurally the same thing: a living system that grows outward, accumulates history inward, and never deletes.

Every word is a filament.

### §56.1 — Word as Filament

A word is not a static entry. It is a living unit with a birth, evolving meanings, and eventual decline. That is exactly what a filament does.

| Word Property | Filament Domain | Example |
|---|---|---|
| The word itself | Identity | `run`, `casa`, `שלום` |
| Phonetic form (IPA) | Extension | `/rʌn/`, `/ˈka.sa/`, `/ʃaˈlom/` |
| Language community | Counterparty | English speakers (θ = geographic distribution of usage) |
| First known usage | Time (spawn) | ~800 CE for "run" from Old English "rinnan" |
| Usage frequency | Magnitude | 4,500 occurrences per million words in modern corpus |
| Dictionary entries, citations | Evidence | OED entry hash, corpus frequency snapshots, earliest manuscript ref |
| Official / Slang / Retired | Lifecycle | See §56.2 |

### §56.2 — Word Lifecycle States

| State | What It Means | Where on the Branch |
|---|---|---|
| `SCHEDULED` | Proposed neologism not yet in common use | Translucent, at branch tip. Zero physics weight. |
| `OPEN` | New word gaining traction (coined, trending) | Outer bark surface. Hot (rapid adoption). |
| `ACTIVE` — Slang | Widely used but not in official dictionaries | Bark surface, high magnitude, high heat, but stays outside — no institutional evidence (dictionary entry) committed yet. |
| `ACTIVE` — Official | In the dictionary. Taught in schools. Standard. | Firmed up, migrating inward. Each year's usage = one ring. |
| `HOLD` — Archaic | Still understood but rarely used. "Henceforth," "betwixt." | Deep rings, thin, cooling. Readable in cross-section but not on active bark. |
| `CLOSED` — Retired | No longer understood by native speakers. Dead vocabulary. | Deepest rings, approaching heartwood. Preserved forever, invisible at bark LOD. |
| `ABSORBED` | Word adopted into another language. English "café" from French. | Sinks into receiving language's tree with cross-tree provenance link back to source. |

**Slang resolution**: When a dictionary officially adds a slang word (e.g., "selfie" entering the OED in 2013), the filament receives a governance commit — the institutional evidence that triggers inward migration from bark to the official wood layer. The bark ridge at that transition point shows where the language's structure formally changed — exactly like an engineering change order (§54.5).

### §56.3 — Branch Structure: Semantic Domains

A language tree branches by **meaning**, not alphabetically. Alphabetical order is a rendering artifact.

```
Language Tree: English
├── Body & Health        (hand, heart, blood, fever, heal...)
├── Nature & Environment (tree, river, mountain, storm...)
├── Technology & Tools   (computer, wheel, hammer, code...)
├── Emotion & Mind       (love, fear, think, dream, believe...)
├── Society & Relations  (king, friend, law, market, vote...)
├── Movement & Action    (run, fly, build, break, carry...)
├── Quantity & Measure   (one, many, heavy, long, fast...)
├── Time & Sequence      (now, yesterday, soon, always, never...)
├── Space & Position     (here, above, inside, between, far...)
└── Function Words       (the, is, and, but, if, to, with...)
```

Within each branch, **word families form sub-branches**. The root word is the sub-branch origin. Derivatives grow from it:

```
Movement & Action
└── "run" (root, Old English "rinnan", ~800 CE)
    ├── "runner"  (agent noun, 1300s)
    ├── "running" (gerund, 1300s)
    ├── "runaway" (compound, 1500s)
    ├── "runway"  (compound, 1800s — aviation meaning 1923)
    ├── "rerun"   (prefix derivative, 1950s — television context)
    └── "run" sense 47 (computing: "run the program", 1960s)
```

When a word gains a new meaning, it is a **schema version bump** on the existing filament — a bark ridge. The old meaning still exists in the inner rings. The new meaning appears on the current bark surface. You can scrub inward through the cross-section and watch the meaning evolve.

### §56.4 — Translation: The Cross-Language Axis

Translation is a **cross-tree evidence link** — the same mechanic used for cross-branch filament references everywhere in Relay.

The English "house" and Spanish "casa" are filaments on two different language trees, connected by translation links:

```
F-WORD-EN-house  ←→  F-WORD-ES-casa
                 ←→  F-WORD-FR-maison
                 ←→  F-WORD-DE-Haus
                 ←→  F-WORD-HE-bayit (בית)
                 ←→  F-WORD-AR-bayt (بيت)
                 ←→  F-WORD-ZH-fángzi (房子)
```

Each translation link carries:

| Property | What It Captures |
|---|---|
| Equivalence type | Exact, approximate, contextual, false friend |
| Semantic overlap % | "casa" covers 95% of "house" meanings. "Heim" covers 60% (closer to "home"). |
| Direction notes | "house" → "casa" is direct. "casa" → "house" loses warmth connotation. |
| Evidence | Bilingual dictionary hash, corpus parallel alignment, translator attestation |

**Geometric representation**: When you focus on a word, its translation links form a **perpendicular ring** around the filament — like Saturn's ring. Each position on the ring is a different language's translation. The angular position corresponds to the target language's geographic position on the globe. Spanish to the southwest, French to the southeast, German to the northeast, Chinese to the east. Geographic direction becomes semantic direction. You roll along the translation ring to see all equivalents simultaneously.

### §56.5 — Multi-Language Parallel View

When you enable multiple languages, the bark surface shows **parallel filament rows** — your native language and all enabled targets side by side, sorted by magnitude (frequency).

At BARK LOD:

```
Body & Health Branch — Parallel View (EN + ES + FR + DE)

  EN: hand     ES: mano      FR: main     DE: Hand
  EN: heart    ES: corazón   FR: cœur     DE: Herz
  EN: blood    ES: sangre    FR: sang     DE: Blut
  EN: fever    ES: fiebre    FR: fièvre   DE: Fieber

  [thickness = frequency — learn thick words first]
```

**Why "you learn by looking" works:**

1. **Spatial association** — "mano" is always next to "hand" in the same row position
2. **Frequency ordering** — common words dominate your view, rare words are thin
3. **Semantic grouping** — related words share a branch, not scattered alphabetically
4. **Confidence feedback** — your personal learning progress is visible as warmth. Unlearned = translucent. Mastered = solid and warm.
5. **Cross-pattern recognition** — seeing "fiebre / fièvre / Fieber" clustered instantly reveals the Latin root without being told

**Color encoding**: Each enabled language gets a distinct hue. Your personal confidence on each translation link grows as you learn — the filament warms and firms. This is the same confidence physics used everywhere in Relay, applied to your personal knowledge state.

### §56.6 — Teaching Curriculum as Projection

A curriculum is a **projection branch** that reads the language tree and selects what to teach. It is not a manually curated list. It is an automatically maintained view that updates when the language changes.

| Curriculum Element | Source | Selection Rule |
|---|---|---|
| Year 1 vocabulary | Top 500 words by magnitude | Frequency > threshold per semantic domain |
| Year 2 vocabulary | Next 1,500 words | Frequency band |
| Grammar structures | Function Words branch + morphology patterns | Structural pattern detection |
| New additions this year | Words that transitioned `OPEN → ACTIVE-Official` in past 12 months | Lifecycle change within date range |
| Automatic removals | Words that transitioned to `HOLD-Archaic` | Auto-excluded from active curriculum |
| Cultural context | Evidence attachments on word filaments | Evidence type = "context-example" or "cultural-warning" |

**Automatic curriculum updates**: When a dictionary board commits a word to official status, the projection auto-includes it in next year's plan. When a word goes archaic, it auto-excludes. The tree's lifecycle physics drive the curriculum.

**Teacher / ministry overrides** (themselves filament commits — visible, auditable, reversible):
- Pin specific words (force-include regardless of frequency)
- Block specific words (force-exclude regardless of status)
- Adjust frequency threshold per grade level
- Add supplementary evidence (teaching notes, pronunciation guides)

### §56.7 — Etymology as Cross-Section

Cut any word in cross-section and see its complete history:

```
Cross-section of "nice" (English)

Outer ring (2020s): "pleasant, agreeable" — very high magnitude
Ring (1900s):       "pleasant" — stabilized
Ring (1700s):       "precise, careful" — meaning shift
Ring (1500s):       "foolish, silly" — earlier meaning
Ring (1300s):       "foolish, stupid" — from Old French "nice"
Core:               Latin "nescius" = "ignorant" — etymological root
```

Every meaning change is a schema version bump. Every ring preserves the meaning active during that period. Scars appear where meaning was contested, where a word was censored, or where a false etymology was corrected.

### §56.8 — Dead Languages and Language Evolution

Dead languages (Latin, Ancient Greek, Sanskrit, Old English) are trees that stopped growing — their canopy is entirely historical bark, no new filaments. But their roots are the deepest in the system because they feed the etymology of living languages.

Tracing "democracy" backward:
Modern English "democracy" → French "démocratie" → Latin "dēmocratia" → Greek "δημοκρατία"

That chain is a cross-tree provenance link from a living filament to a dead language's deep ring. The Greek tree hasn't grown in two millennia, but its inner rings are still read by modern language projections.

**Language family patterns** are visible at TREE LOD as cluster patterns on the globe: Romance languages cluster in southern Europe, Germanic in northern, Slavic in eastern. Zooming out, language families are tree clusters — the same way company trees cluster by industry.

**Endangered language detection**: A language tree with declining magnitude (fewer speakers), increasing archaic transitions (words dying faster than new ones born), and thinning rings (declining activity per timebox) = a wilting branch. Visible alarm. The tree physics that show a failing company branch show a dying language the same way.

### §56.9 — Capabilities Summary

| Capability | Mechanism |
|---|---|
| Learn 3 languages simultaneously | Enable parallel bark view — see word families across all three |
| Track slang adoption in real time | Watch outer bark — what's hot, gaining magnitude, not yet officiated |
| Predict curriculum changes | Projection shows words approaching official threshold |
| Detect dialect drift | Compare ring thickness between American English and British English sub-branches |
| Preserve endangered languages | Declining magnitude + increasing archaic transitions = wilting branch alarm |
| Measure translation quality | Translation links with low semantic overlap = fog. High overlap = clear. |
| Study historical linguistics | Cross-section + etymology chains show language evolution without a textbook |
| Trace loanwords across civilizations | Cross-tree provenance links from living words back to dead language roots |

No new physics. Filament lifecycle, cross-tree links, projection branches, magnitude sorting, confidence overlays, and cross-section inspection — applied to language.

---

## 57. Adoption Tiers & Backwards Compatibility — Frozen Contract #140

> *"Meet people where they are, not where you want them to be."* — attributed to various community organizers

**Prerequisites:** None. Required from day one — Relay must function at all four adoption tiers from launch.

Relay does not require the world to adopt it. It does not replace existing systems. It wraps them, mirrors them, and shows the difference. A government property registry that has worked on paper since 1847 does not need to change. Relay simply hashes their documents and shows a foggy branch where full confidence would otherwise be. The fog is not a penalty — it is honesty. The users who see clear branches next to foggy ones will draw their own conclusions. Relay never pushes new interfaces. They speak for themselves.

### §57.1 — The Four Tiers

Every external system Relay touches exists at one of four integration depths. These tiers coexist permanently on the same globe. Different departments, cities, and countries will sit at different tiers simultaneously.

| Tier | Name | Who is master? | What Relay stores | Confidence level |
|------|------|---------------|-------------------|-----------------|
| 0 | Evidence Hash Only | External system | Document hash + timestamp only | Low (fog). Existence verified, contents opaque. |
| 1 | Connector Read | External system | Structured filaments mirrored from API/feed | Medium. Internal consistency verifiable. Authority is external. |
| 2 | Dual Write | Both | Native filaments + external-sourced filaments, reconciled | Mixed. Native = clear. External = slightly foggy. |
| 3 | Relay Native | Relay | All work happens in the tree | High. Full confidence, full cross-section, full replay. |

### §57.2 — Tier 0: Evidence Hash Only

The lightest possible integration. No API, no connector, no training. Someone uploads a document (PDF, scan, photo). Relay computes a cryptographic hash and stores it as a filament with:

- `identity`: document description
- `time`: upload timestamp
- `evidence`: `{ type: "hash-only", hash: "sha256:...", originalSystem: "Municipal Registry Office" }`
- `lifecycle`: `OPEN` (the hash exists; the content is opaque)

What the tree shows: The filament exists and is positioned on the correct branch. But it is foggy — Relay cannot independently verify what the document says, only that it existed at that time and has not been altered since.

If years later the same document is re-uploaded and the hash matches: confidence holds. If the hash differs: scar + possible storm (document tampering detected).

### §57.3 — Tier 1: Connector Read

Relay connects to the external system's API or data export. Filaments are auto-created with structured fields:

- Property transfer: `{ buyer, seller, parcel, price, date, registryRef }`
- Patient visit: `{ patientId, provider, diagnoses, procedures, date, ehrRef }`
- Invoice: `{ vendor, amount, lineItems, date, erpRef }`

The external system remains the master. Relay is a read-only mirror. If the external system updates a record, Relay receives a new commit on the filament. If the external system goes down, the filament shows `PENDING_EXTERNAL` and the branch develops fog (external dependency unresolvable).

Confidence is higher than Tier 0 because Relay can verify internal consistency (do the numbers add up? do cross-references resolve? is the timeline coherent?). But the authority pointer still leads outside Relay.

### §57.4 — Tier 2: Dual Write

Users begin creating some work natively in Relay while continuing to use the legacy system for other work. Both streams produce filaments in the same tree.

- Native filaments: full evidence, full confidence, clear rendering
- External filaments: connector-sourced, medium confidence, slightly foggier

Relay reconciles both streams at timebox close. If a native filament and an external filament refer to the same real-world event (e.g., an invoice entered in both SAP and Relay), the consolidation gate checks that they match. Discrepancy → scar.

This is where adoption accelerates naturally. Users see that the native-Relay parts of their tree are clearer, faster, and more legible than the connector-mirrored parts. They start doing more work natively — not because anyone told them to, but because the tree shows them the difference.

### §57.5 — Tier 3: Relay Native

The external system is retired or reduced to a thin persistence/backup layer. All work originates in Relay. The tree has full confidence everywhere.

This tier is never required. Many systems may permanently remain at Tier 0 or 1. A rural land registry that processes 20 transfers per year has no operational reason to go beyond Tier 1. That is perfectly fine. The tree still works.

### §57.6 — Mixed-Tier Rendering

On a single tree, different branches may operate at different tiers:

```
Company Tree: Acme Corp
├── Finance (Tier 3 — fully native)           → Clear, warm, firm
├── Procurement (Tier 2 — dual write with SAP) → Mostly clear, some fog
├── HR (Tier 1 — connector from Workday)       → Medium clarity, external refs
├── Legal (Tier 0 — scanned contracts only)    → Foggy, hash-only evidence
└── Property (Tier 0 — municipal registry)     → Foggy, hash-only evidence
```

The visual contrast is immediate. Management sees exactly which parts of the organization are operating with full truth and which parts are relying on external claims. No dashboard needed. No adoption metric. The tree shape IS the adoption metric.

### §57.7 — Upgrade Paths

Moving from one tier to the next is always voluntary and reversible:

| Transition | What happens |
|------------|-------------|
| Tier 0 → 1 | Connect API. Existing hashes remain. New filaments get structured fields. Historical hashes can be back-filled if the external system provides records. |
| Tier 1 → 2 | Users start entering some work directly in Relay. External connector continues. Reconciliation gate detects duplicates. |
| Tier 2 → 3 | External system decommissioned or demoted to backup. All new work in Relay. Historical external filaments remain with their original confidence level. |
| Any → 0 | Connector removed. Existing filaments preserved permanently. New filaments from that system stop. Branch goes dormant (no new growth, all history preserved). |

Downgrading never deletes data. A Tier 3 branch that reverts to Tier 0 keeps all its rings — it just stops growing.

**Contract #140 — Relay functions at all four adoption tiers simultaneously. No tier is prerequisite for any other. No feature is gated behind Tier 3. Evidence hashes (Tier 0) are a permanent, first-class integration method. The visual difference between tiers is rendered through existing confidence/fog physics — not through badges, warnings, or degraded UI. The tree makes the case for adoption by being legible. Relay never pushes.**

---

## 58. Education — The Internal Adventure — Frozen Contract #142

> *"Education is not the filling of a pail, but the lighting of a fire."* — W.B. Yeats

Learning in Relay is not a course catalog. It is a personal adventure documented on your user tree. Every skill you acquire — from filing a spreadsheet row to casting a fire spell — is a module you discovered, demonstrated, and earned. The system never tells you what to learn next. It shows you what you can do, and the things you cannot yet do remain invisible until you are ready to find them. Education is the act of growing your tree outward by adding new capability branches.

When a new user opens Relay for the first time, they choose a starting path. Not a "role" — a direction. A banker learns different first skills than a game developer, who learns different first skills than a farmer. But they all use the same tree, the same physics, the same modules. The difference is which modules they encounter first and which prerequisite chains they traverse naturally.

### 58.1 The Official Demo/Tutorial

Every Relay account begins with a guided tutorial — the only time the system actively teaches. After this, learning is self-directed discovery.

**Path selection at first launch:**

| Path | Who it's for | First skills taught | Initial tree shape |
|------|-------------|--------------------|--------------------|
| **Personal** | Individual managing files, health, calendar | Filament creation, basic commits, personal branches, calendar scheduling | Thin personal tree, 5-6 branches |
| **Business / Finance** | CFO, accountant, procurement | Three-way match, accounting packets, mass balance, reconciliation gates | Finance-heavy tree, invoice/PO/GR branches |
| **Coder / Maker** | Developer, engineer, designer | Code filaments, version commits, AI code governance, project branching | Code-centric tree, repo-like branches |
| **Manager / Executive** | Team lead, department head, CEO | Cross-section inspection, branch health reading, scheduling, projection branches | Overview tree, department branches |
| **Creator / Artist** | Musician, filmmaker, writer | Media filaments, timeline-based bark, production branches, collaboration | Media tree, creative workflow branches |
| **Student** | Learner in any subject | Note-taking, evidence linking, study branches, curriculum following | Learning tree, subject branches |
| **Gamer** | Someone drawn to the game layer | Presence, achievement discovery, basic SCV interaction, detection | Adventure-ready tree, achievement branches |

Each path teaches the same underlying physics through different examples. The banker learns filament lifecycle by processing a sample invoice. The coder learns it by committing a code change. The gamer learns it by capturing a camera event. Same module, different door.

The tutorial is a short guided sequence (10-15 minutes) that results in a real tree with real data — not a sandbox. When the tutorial ends, the user's tree is already alive and growing. Everything they did during the tutorial is permanent.

### 58.2 Skill Paths as Module Prerequisite Chains

After the tutorial, all learning is discovery. But the system maintains **skill paths** — ordered sequences of modules that the community has voted as effective learning progressions. These are not gates. They are suggestions.

A skill path is a projection branch on the user's tree:

- Light blue (human-curated) or lavender (SCV-suggested)
- Each node in the path is a module with prerequisites
- The user's current position in the path is visible (which modules they've demonstrated, which remain)
- The user can skip ahead at any time — if they demonstrate a module's prerequisites, they don't need to follow the suggested order

Skill paths are community-created and community-voted. Anyone can propose a new path. The community votes on effectiveness. The best paths rise to the top of search results. Bad paths wilt.

### 58.3 Teaching as a Ranked Filament Activity

Teachers in Relay are not appointed. They are discovered through the same physics that governs everything else:

**How teaching works:**

1. A user creates an **explanation filament** — a recorded lesson, tutorial, walkthrough, or demonstration attached to a specific module or skill path
2. The explanation becomes a filament on the teacher's user tree (their teaching branch)
3. Students who follow the explanation and successfully demonstrate the module create a **learning filament** that references the teacher's explanation as evidence
4. The teacher's explanation filament accumulates confidence from successful student outcomes
5. Teachers whose explanations produce the most successful demonstrations rise in search rankings

**The Genghis Khan round-robin model:**

This follows the same pattern as psychiatric care, dating, and any other human-matching optimization:

- **Round-robin matching**: Students are matched with available teachers for short sessions. After each session, both parties rate the interaction.
- **Convergence**: Over time, the matching algorithm converges — the best teacher-student pairings surface naturally. A teacher who explains accounting brilliantly but struggles with code will attract accounting students and lose coding students.
- **No monopoly**: No single teacher dominates a topic. The round-robin ensures fresh perspectives and prevents stagnation. If a teacher's branch starts wilting (students stop succeeding), they drop in rankings.
- **Compensation**: Teachers earn magnitude (real value) proportional to student success rates, not just view counts. A teacher with 10 students who all demonstrate the skill earns more than a teacher with 1,000 viewers who never try.

**Search optimization:**

When any user searches for help on a topic:

1. Relay returns the highest-confidence explanation filaments for that module
2. Ranked by: student success rate, recency, teaching style match (SCV recommends based on the learner's prior demonstrated learning patterns)
3. The top result is the branch with the most successful student outcomes — the tallest, firmest teaching branch visible in any Relay search query
4. This optimizes the audience's time: the first thing they see is the most effective explanation available

### 58.4 Education as Internal Adventure

Every learning journey is a personal quest:

- Your user tree's **learning branch** shows every module you've discovered and demonstrated
- Cross-section of the learning branch shows your education history — early skills near the core, recent skills on the outer bark
- Twigs represent modules you started but haven't yet demonstrated competence in
- Scars represent failed attempts (which are permanent and valuable — they show you tried)
- The thickness of your learning branch reflects the volume of skills you've actively engaged with

There is no external degree, no paper diploma, no institution-issued certificate. There is only the tree — the tree IS the credential. An employer looking at your user tree sees: "This person has 47 demonstrated modules across finance, code, and project management. Their accounting branch is thick and firm. Their coding branch has two scars and a twig." That IS the resume. Credentials are the proven record of commits, all held with high confidence at the time of commitment by people who themselves held high confidence. Profile reveal percentages allow employers to request a specific proportion of tree visibility (e.g., "60% tree reveal required") without accessing individual filament content. (See §71.10 for full credential and profile reveal mechanics.)

### 58.5 Community-Curated Curricula

What professions and roles deserve curricula, and what those curricula contain, is governed through §72 layered option governance — the community meta-votes on what should be offered before voting on the content itself. The §73 tutorial master list surfaces these curricula to new users.

Lesson plans are not designed by institutions. They are proposed by anyone and validated by the community:

1. **Proposal**: A user (teacher, institution, or SCV) proposes a curriculum — an ordered set of skill paths covering a domain (e.g., "Financial Accounting Fundamentals," "Full-Stack Development," "Agricultural Operations Management")
2. **Projection branch**: The curriculum appears as a projection branch visible to anyone searching for that domain
3. **Community voting**: Users who have demonstrated the domain's modules vote on curriculum quality. This ensures only competent reviewers judge lesson plans.
4. **Student outcomes**: Curricula are ranked by aggregate student success — the percentage of students who follow the curriculum and successfully demonstrate all its modules
5. **Teacher assignment**: The curriculum references the highest-ranked teachers per module, automatically updated as teacher rankings change
6. **Version evolution**: Curricula evolve through governance commits — modules get added, removed, or reordered. Each version is preserved. Students following an older version can see what changed and why.

The best curricula for any topic float to the top because they produce the most competent graduates. The system self-optimizes.

### 58.6 How This Connects to Module Discovery (§38)

The education system IS the module discovery system. They are the same thing seen from two angles:

- **Module discovery** (§38) says: "demonstrate competence and the module becomes available"
- **Education** (§58) says: "here's how you get competent — through community-ranked teachers, curated skill paths, and round-robin matching"

The tutorial teaches the first few modules explicitly. After that, the user's growth is their own. Some users will discover modules through work (the banker who learns reconciliation gates by doing their job). Some will discover modules through play (the gamer who stumbles into presence detection). Some will follow structured curricula. Some will apprentice with a specific teacher. All paths are valid. All paths produce the same demonstrated competence filaments on the user tree.

There is no graduation. There is only growth. The tree never stops learning.

**Contract #142 — Education is an internal adventure on the user tree, not an external institution. Teaching is a ranked filament activity where teachers are compensated by student success rates, not view counts. Skill paths are community-curated suggestions, never mandatory gates. The round-robin matching model applies to teaching, psychiatric care, dating, and all human-matching optimization uniformly. Curricula evolve through governance commits and are ranked by aggregate student outcomes. The tutorial is the only moment Relay actively teaches — after that, all learning is self-directed discovery.**

### 58.7 Course Template Model — A Course Is a Tree

A course is not a flat list of lessons. A course is a **branch that hosts a sub-tree** (§60). The course branch on a school's education tree contains its own trunk, its own branches, its own filaments — full recursive depth.

**Structure:**

```
School Tree
└── education branch
    └── Biology 01 (course sub-tree)
        ├── curriculum branch (canonical truth)
        │   ├── Unit 1 — Cell Structure
        │   │   ├── Lesson 1.1 (filament)
        │   │   ├── Lesson 1.2 (filament)
        │   │   └── Assessment 1 (filament)
        │   ├── Unit 2 — Genetics
        │   └── ...
        ├── delivery branch (teacher method projections)
        ├── grading branch (assessment results)
        ├── discussion branch (student interactions)
        └── resources branch (textbooks, media, lab data)
```

**Course template schema:**

```
CourseTemplate {
  courseId:              string,
  syllabusFilaments:     FilamentRef[] (canonical curriculum — the truth anchor),
  assessmentBlueprint:   AssessmentRef[] (required evaluations),
  evidenceRules: {
    minSourcesPerLesson:   number (default: 2),
    requiredSourceTypes:   enum[] { TEXTBOOK, PEER_REVIEWED, DATASET, PRIMARY_SOURCE },
    assessmentAlignment:   boolean (each lesson must link to at least one assessment)
  },
  allowedMethodVariations: string[] (what teachers may customize),
  prerequisiteModules:     ModuleRef[] (what students must demonstrate before enrolling)
}
```

The **curriculum branch is the truth anchor.** It defines what must be taught — the canonical syllabus filaments with their evidence requirements. Teachers do not modify the curriculum branch. They create delivery branches (§58.8) that are projections bound to it.

The curriculum branch itself evolves through governance commits (§58.5). New units can be proposed by teachers, reviewed by peers who have demonstrated the domain, and merged after community approval. Each revision is preserved. Students on an older curriculum version see what changed and why.

### 58.8 Teacher Method Marketplace

Teachers compete by publishing **delivery branches** — their unique method of teaching the canonical curriculum. A delivery branch is a projection branch (light blue) bound to the curriculum truth branch.

**What a delivery branch contains:**

```
TeacherDeliveryBranch {
  teacherUserId:       string,
  courseRef:            courseId,
  curriculumVersion:   commitId (which curriculum snapshot this delivery targets),
  methodMetadata: {
    pace:              enum { SLOW, MODERATE, FAST, SELF_PACED },
    style:             enum { VISUAL, PROOF_HEAVY, EXAMPLE_DRIVEN, SOCRATIC, LAB_FOCUSED },
    depth:             enum { INTRODUCTORY, STANDARD, ADVANCED },
    language:          string,
    estimatedHours:    number
  },
  lessonFilaments:     LessonFilamentRef[] (teacher's explanation for each syllabus item),
  assessmentMethods:   AssessmentMethodRef[] (how this teacher evaluates — within blueprint bounds)
}
```

**Each lesson filament on the delivery branch is a media filament (§59)** — a recorded explanation, tutorial, walkthrough, or live session. It carries:

- Claims made (concept list mapping to syllabus items)
- Evidence links (textbook references, peer-reviewed sources, datasets)
- Student outcome data (how many students who followed this explanation successfully demonstrated the module)
- Revision history (scars if the teacher corrected an error)

**The marketplace mechanism:**

Students searching for "Biology 01" see all available delivery branches for that course. They can filter and compare:

| Filter | What It Measures |
|--------|-----------------|
| Best outcomes | Highest percentage of students who demonstrated the module after this teacher's delivery |
| Best clarity | Highest student clarity votes (§58.9) |
| Best evidence | Highest orgConfidence on lesson filaments (evidence completeness) |
| Best fit | SCV recommendation based on the student's prior demonstrated learning patterns |
| Pace / style / depth | Method metadata match |

**Switching teachers is a routing operation, not a curriculum rewrite.** The canonical curriculum stays fixed. The student simply changes their `preferredTeacherRef` to point to a different delivery branch. All prior learning under the old teacher is preserved. Progress through the syllabus is unchanged — only the method of delivery changes.

### 58.9 Student Voting — Clarity vs Truth Separation

Students vote on teachers. But votes on **teaching quality** are structurally separated from **evidence truth**.

**Two independent confidence channels (consistent with §7.4–7.7):**

**A. Organizational Confidence (orgConfidence) — non-votable by students:**

This is the evidence quality of the lesson itself. Computed from:

- Does the lesson reference required source types? (textbook, peer-reviewed, dataset)
- Does the lesson align with the syllabus assessment blueprint?
- Has the lesson been peer-reviewed by other teachers who demonstrated the domain?
- Does the lesson's claim set match the canonical curriculum filament it targets?

If a teacher teaches "conspiracy biology" with no evidence links, their lesson filaments have low orgConfidence. The branch gets fog and wilt. Lessons drop below default visibility thresholds. No amount of student popularity votes can override this.

**B. Teaching Effectiveness Score (community-votable):**

Students vote on specific, measurable dimensions of each lesson filament:

```
StudentVotePacket {
  studentUserId:     string,
  lessonFilamentRef: filamentId,
  teacherRef:        userId,
  votes: {
    clarity:         number (1-5, "Was the explanation clear?"),
    pacing:          number (1-5, "Was the pace appropriate?"),
    engagement:      number (1-5, "Did the method hold your attention?"),
    practiceQuality: number (1-5, "Were the exercises useful?")
  },
  outcomeEvidence:   commitId | null (link to the student's demonstration filament, if they passed)
}
```

Votes are weighted by outcome: a vote from a student who successfully demonstrated the module carries more weight than a vote from a student who dropped out. This prevents "fun but wrong" from dominating rankings — a charismatic teacher whose students consistently fail to demonstrate competence will rank below a dry teacher whose students consistently succeed.

**The invariant (frozen):** Student votes affect teacher **visibility and routing** (which teacher appears first in search results, which teacher gets recommended). Student votes **never override orgConfidence** (evidence quality). A lesson with high popularity and low evidence stays foggy. A lesson with low popularity and high evidence stays firm. Both signals are visible. Neither can suppress the other.

### 58.10 Sortition Grading — Removing the 1:Many Bottleneck

A single teacher grading papers for hundreds of students does not scale. It creates bottlenecks, inconsistency, burnout, and standards drift. Relay replaces this with a **sortition grading pipeline** — the same jury mechanism used throughout the system (§46, contract #85).

**The grading pipeline:**

```
Assignment submitted (filament)
        │
        ▼
[Auto-check layer] ← Objective parts: MCQ, structured responses, code tests
        │                 Deterministic. No human needed.
        │
        ▼
[Sortition peer review] ← Subjective parts: essays, proofs, creative work
        │                    Random student jury (3-5 peers per submission)
        │                    Each juror grades independently using rubric filament
        │                    Consensus = grade confirmed
        │                    Disagreement = escalation
        │
        ▼
[Teacher spot-check] ← Teacher reviews a random sample (e.g., 10%)
        │                 Plus all escalated disagreements
        │                 Teacher grade overrides jury only with evidence commit
        │
        ▼
[Final grade committed] ← Filament on student's learning branch
                           Evidence: rubric scores, jury identities, teacher review (if any)
```

**Rubrics are policy filaments** — fixed, version-controlled, attached to the assessment blueprint. Jurors grade against the rubric, not against personal opinion. The rubric is the truth anchor for grading, the same way the syllabus is the truth anchor for teaching.

**Peer review jury mechanics (consistent with §46):**

- Jury selection is by sortition — random selection from students who have already demonstrated the module being assessed (they must be competent to grade it)
- Jurors grade independently. They see the submission but not each other's grades until all are committed.
- Consensus: if grades cluster within a tolerance band, the median is the final grade
- Disagreement: if grades diverge beyond tolerance, the submission is flagged as a **scar candidate** and escalated to the teacher or a higher-tier jury (students who demonstrated a higher-level module in the same domain)
- Jurors are graded on their grading (§46, contract #85): after the final grade is determined, each juror's grade is compared to the consensus. Consistently outlier graders see their grading weight reduced over time.

**Why this scales:**

- Auto-checks handle 60-80% of grading volume (objective questions)
- Sortition distributes the remaining 20-40% across the student body
- Teacher only reviews ~10% (random sample) plus escalations
- A course with 10,000 students requires the same teacher effort as a course with 100 — the sortition layer absorbs the scale
- Standards remain consistent because the rubric is fixed and jury consensus converges

**Compensation:** Peer graders earn a small magnitude credit for each grading session (teaching others is a form of demonstrated competence). This makes grading a valued activity, not unpaid labor.

### 58.11 Teacher Score, Routing, and Quality Decay

**Teacher score computation:**

```
TeacherScore(course, teacher) = weighted combination of:
  0.35 × studentOutcomeRate     (% of students who demonstrated the module)
  0.25 × evidenceIntegrity      (avg orgConfidence across lesson filaments)
  0.20 × clarityScore           (avg student clarity votes, weighted by outcome)
  0.10 × consistencyScore       (alignment with canonical curriculum filaments)
  0.10 × appealRate_inverse     (1 - proportion of grading appeals/scars)
```

All weights are Category A global parameters (§11.6). Initial values as shown; community governs from day one.

**Routing:**

A student sets `preferredTeacherRef` for each course. Relay routes them to that teacher's delivery branch. If no preference is set, Relay recommends based on SCV analysis of the student's demonstrated learning patterns (§58.3).

**Quality decay:**

If a teacher's score drops below a threshold (Category A global parameter, default: 0.40):

1. The delivery branch begins wilting (slab wilt increases per §3.7)
2. Students on that delivery branch receive a suggestion (advisory only, per §58.6): "Alternative delivery branches with higher student outcomes are available"
3. No automatic re-routing. The student decides. Suggestions never auto-switch (contract #142).

If a teacher's orgConfidence drops below the course template's minimum evidence threshold:

1. The delivery branch gains fog (low opacity per §3.4)
2. The branch drops below default search visibility
3. Students already enrolled are notified: "This teacher's evidence quality no longer meets course requirements"
4. New students cannot be routed to the branch until evidence is restored

**Contract #147 — Student votes on teaching effectiveness affect visibility and routing, never evidence-based organizational confidence. A lesson with high popularity and low evidence stays foggy. A lesson with low popularity and high evidence stays firm. Both signals are independently visible. Neither can suppress the other. Grading is a sortition process: peer review juries grade against fixed rubric filaments, with auto-check handling objective parts and teacher spot-checking a random sample plus escalations. The sortition grading pipeline scales independently of class size. Teaching quality decays visibly through wilt and fog when standards drop, but suggestions never auto-switch students.**

### 58.12 Certification & Credentialing — Relay as Third-Party Verification

Relay does not issue degrees. Relay does not have a registrar. Relay has something stronger: a **verifiable, immutable record of demonstrated competence** graded by community-certified teachers against community-voted curricula, anchored to the user's tree and inspectable by anyone the user permits. The requirement lists for each profession are governed through §72 layered option governance — what should be required is a community meta-vote, not a top-down mandate.

**The certification model:**

In the physical world, becoming a CPA in Arizona requires completing specific coursework, passing specific exams, and being verified by an accredited institution. In Relay, the same structure exists — but the institution is replaced by the tree and the community.

**Step 1 — Regional requirement lists:**

Any professional community (municipal, state, industry, guild) can publish a **certification requirement branch** on their organizational tree. This branch contains:

```
CertificationRequirementSet {
  certificationId:       string (e.g., "cert.arizona.cpa.2026"),
  issuingTreeRef:        treeId (the organizational tree publishing the requirement),
  region:                string | null (geographic scope, if applicable),
  requiredModules:       ModuleRef[] (ordered list of modules the candidate must demonstrate),
  requiredCourses:       CourseRef[] (specific courses or course categories),
  assessmentGates:       AssessmentRef[] (exams, practicals, portfolios required),
  minimumTeacherScore:   number (minimum teacher score for grading to count),
  minimumGradingConfidence: number (minimum sortition grading confidence per course),
  governancePolicy:      GovernanceRef (how the requirement set evolves)
}
```

The requirement list is itself a governed branch. Changes follow the same governance model as all Relay content: proposals are committed, the qualified community votes, and the winning revision becomes the active requirement. If the Arizona accounting community decides that a new ethics module is required for CPA certification, that module is proposed, voted upon by users who have already demonstrated accounting expertise, and merged into the requirement set through a governance commit.

**Step 2 — Curriculum independence:**

Each required course within the certification is a separate sub-tree (§58.7). Courses can be replaced, improved, or forked without disrupting the certification structure:

- If a better "Auditing 301" course appears (higher student outcome rate, better teacher score), it can be proposed as a replacement within the requirement set
- Students who already completed the older "Auditing 301" under a qualified teacher are not affected — their demonstration filament references the specific course version they completed
- The certification checks module completion, not course identity — if two different courses teach the same module and the student demonstrated competence in that module, the requirement is satisfied regardless of which course they took

**Step 3 — Teacher certification for grading:**

Not every teacher can grade for a professional certification. The certifying community sets a `minimumTeacherScore` threshold. Only teachers whose `TeacherScore` (§58.11) for the relevant domain meets or exceeds this threshold at the time of grading may issue grades that count toward certification.

```
CertificationGradeCommit {
  studentUserId:         string,
  certificationRef:      certificationId,
  courseRef:              courseId,
  moduleRef:             moduleId,
  teacherUserId:         string,
  teacherScoreAtGrading: number (snapshot of teacher's score at grading time),
  gradingMethod:         enum { SORTITION_PIPELINE, DIRECT_ASSESSMENT, PRACTICAL_EXAM },
  gradingConfidence:     number (from sortition pipeline or direct assessment),
  gradingTimestamp:       ISO-8601,
  evidenceChain:         EvidenceRef[] (rubric scores, jury identities, assessment artifacts)
}
```

**Step 4 — The snapshot principle (critical invariant):**

When a teacher grades a student for certification, the `teacherScoreAtGrading` is snapshotted and committed as permanent evidence. If the teacher later degrades — their score drops, their branch wilts, they lose community confidence — **this does not retroactively affect the student's certification.** The grade was valid at the time it was issued. The evidence chain is immutable. The student's demonstrated competence is a committed fact on their tree.

This mirrors how physical professional certifications work: if your accounting professor later loses their credentials, your CPA license is not revoked — because you passed the exam under qualified supervision at the time.

The reverse is also enforced: if a teacher is discovered to have fraudulently inflated grades, the evidence chain shows this through scars on the teacher's branch and potential sortition jury review (§46) of individual grade commits. Fraud is detectable because every grade has a full evidence trail.

**Step 5 — Certification completion:**

When a student has demonstrated all required modules, completed all required courses with qualifying grades, and passed all assessment gates — their tree displays the certification:

```
CertificationCommit {
  certificationRef:      certificationId,
  studentUserId:         string,
  completionTimestamp:    ISO-8601,
  requirementVersion:    commitId (which version of the requirement set was active),
  gradeCommitRefs:       CertificationGradeCommit[] (all grades that satisfy requirements),
  status:                ACTIVE | EXPIRED | SUSPENDED
}
```

The certification appears as a **firm, high-confidence filament** on the student's professional branch. It carries the full evidence chain: every course, every grade, every teacher, every rubric score. Anyone the student permits to inspect their tree (employer, client, regulatory body) can verify every component.

**Step 6 — How knowledge, position, and responsibility grow together:**

The certification model closes the loop between education (§58), module discovery (§38), and work zone governance (§19.3):

| Layer | What It Represents | How It Grows |
|-------|-------------------|--------------|
| **Knowledge** | Demonstrated modules on the learning branch | Completing courses, passing assessments, sortition grading |
| **Position** | Certifications that unlock professional scope | Fulfilling community-voted requirement sets |
| **Responsibility** | Work zone permissions derived from certification | Certified users gain access to governed branches (e.g., a certified CPA can operate on a firm's accounting tree) |

A user who demonstrates accounting competence (knowledge) can earn CPA certification (position), which grants them work zone permissions on accounting branches (responsibility). These three layers reference each other but grow independently. A user can have knowledge without certification (self-taught). A user can have certification without responsibility (certified but not yet employed). A user can have responsibility without certification (legacy integration per §57). The tree shows all three — and makes the gaps visible.

**Contract #153 — Relay functions as a third-party verification platform through community-governed certification requirement sets.** Regional or professional communities publish requirement branches specifying modules, courses, assessment gates, and minimum teacher qualifications. Teachers must meet a minimum score threshold at the time of grading for their grades to count toward certification. The `teacherScoreAtGrading` is snapshotted and committed as immutable evidence — subsequent teacher degradation does not retroactively affect student certifications. Course replacement within requirement sets does not invalidate prior completions. Certification commits carry the full evidence chain (every course, grade, teacher, rubric score, jury identity). Knowledge (demonstrated modules), position (certifications), and responsibility (work zone permissions) reference each other and grow together on the user tree.

---

## 59. Media & Content Circulation — Frozen Contracts #143–146

> *"Art is not what you see, but what you make others see."* — Edgar Degas

**Prerequisites:** §3.2 (content-type bark rendering), §3.2.1 (individual filament depth), §3.4 (cross-section triple encoding), §3.21–3.22 (content-type temporal mapping), §21.2.9 (media production template), §31 (accounting packets), §33.5 (LOD thresholds), §57 (adoption tiers), §11.6 (global parameter registry).

This section formalizes how video, audio, and all temporal media work in Relay. It covers: the internal structure of a media project as a branch, the physics of watching (viewer traversal), single-instance circulation (how a purchased copy is shared without duplication), the creative license system, derivative fork economics, and media-specific LOD rendering.

The governing principle: **a media object in Relay behaves like a physical object.** It can be lent, viewed, checked out, and returned — but never silently duplicated beyond a controlled cap set by the rights holder. Watching is not "pressing play." It is traversing a branch along the L-axis. Your position is real, spatial, and visible. Your engagement becomes wood.

### 59.1 Media Object as a Governed Branch

A film, album, podcast, or any temporal media work is not a single filament. It is a **project branch** on a media tree.

**Structural decomposition:**

```
Media Branch (project level)
└── F-PROJECT (the work as a whole)
    ├── F-SCENE-1 (scene / track / chapter)
    │   ├── F-SEG-1.1 (segment, Δt = 1s or 2s, template param)
    │   │   ├── F-FRAME-CLUSTER-1 (atomic rendering unit)
    │   │   ├── F-FRAME-CLUSTER-2
    │   │   └── ...
    │   └── F-SEG-1.2
    ├── F-SCENE-2
    └── ...
```

Each segment is a filament with its own:

- **Identity** — `F-MEDIASEG-<projectId>-<segIndex>` where `segIndex = floor(timeSec / Δt)`
- **Commit history** — radial depth per §3.2.1. A segment edited 50 times has 50 inward layers. A segment recorded once and never touched has one layer.
- **Lifecycle state** — SCHEDULED (pre-production), OPEN (in editing), ACTIVE (in review), HOLD (on hold), CLOSED (approved/released), ABSORBED (archived master)
- **Engagement weight** — accumulated from viewer dwell, replay, pause, and derivative fork activity
- **Evidence** — production QA gates, approval commits, master certification

This is identical to how spreadsheet cells work on a financial branch. Each segment is a cell. Each cell has its own tracked filament history going inward. The branch is the project. The bark surface is the current state. The rings are production epochs.

**The media object itself** (the actual file — video, audio, image sequence) is stored as a single content-addressed blob:

```
MediaObject {
  objectId:              string,
  contentHash:           SHA-256 of encrypted master file,
  ownerTreeRef:          treeId of the rights holder,
  branchRef:             branchId of the media project branch,
  licenseType:           enum (see §59.5),
  maxConcurrentCopies:   number (Global Parameter, Category A),
  totalCopiesSold:       number (append-only counter),
  circulationMode:       enum { PRIVATE_ONLY, LIMITED_STREAM, OPEN_STREAM, THEATRICAL_ONLY },
  derivativePolicy:      enum (see §59.5),
  royaltyModel:          RoyaltyModelRef,
  encryptionKeyRef:      keyId,
  segmentCount:          number,
  segmentDuration:       seconds (Δt),
  totalDuration:         seconds,
  contentType:           enum { VIDEO, AUDIO, MIXED, IMAGE_SEQUENCE }
}
```

### 59.2 Dual-Axis Equation Set — History Inward, Engagement Outward

Two forces act on every media segment. They are **orthogonal and independent**. This is the same dual-axis model that governs all Relay branches, applied specifically to media content.

**Axis 1 — Radial Position (r): History + Lifecycle + Stability**

Radial position is governed by edit activity, lifecycle state, and production stability. Engagement does not move `r`.

**Stability function** (per segment filament F at time t):

```
editCountWindow(F, t, W) = number of MEDIA_EDIT commits in window W (default 30 days)
approvalPresent(F)       = 1 if APPROVAL evidence commit exists, else 0
qualityConfidence(F)     = orgConfidence for this segment (production QA evidence completeness)

stability(F, t) = clamp(
    0.5 * approvalPresent(F)
  + 0.3 * qualityConfidence(F)
  + 0.2 * (1 - min(editCountWindow(F, t, W) / editCap, 1)),
  0, 1
)
```

Where `editCap` is a template parameter (default: 20 edits per window).

**Lifecycle-to-base-radius mapping** (consistent with §4.3):

| State | r_base |
|-------|--------|
| SCHEDULED | 1.0 |
| OPEN | 1.0 |
| ACTIVE | 0.75 |
| HOLD | 0.6 |
| CLOSED | 0.3 |
| ABSORBED | 0.0 |

**Radial position equation:**

```
r(F, t) = r_base(state(F)) × (1 - k_stab × stability(F, t))
```

Where `k_stab ∈ [0,1]` is a template constant (default: 0.5). Stable, approved segments migrate inward within their lifecycle zone faster. Unstable segments remain nearer the bark even if older.

**Invariant: `r(F, t)` never increases due to engagement. Only commits can change it.**

**Axis 2 — Magnitude / Engagement (m): Heat and Thickness**

Engagement is a field over the L-axis (the content timeline). For each segment filament F:

```
E(F, t) = w1 × uniqueViewers
         + w2 × watchTimeSec
         + w3 × replays
         + w4 × pauseCount
         - w5 × skipCount
```

All terms computed per timebox and rolled into TimeboxAggregate for the media branch. Default weights: `w1=1.0, w2=0.1, w3=2.0, w4=0.5, w5=0.3` (all Category A global parameters).

**Engagement affects only these rendering outputs:**

- **Thickness / glow intensity** at the segment's L position
- **Heat color overlay** at the segment's L position (per §3.16)
- **Presence markers** (viewer dots) anchored at L during active playback sessions

**Engagement does not affect:** lifecycle state, radial position, archival compression, or timebox membership.

**The invariant (frozen):**

```
Radial axis (r) = history + lifecycle + commits → inward only
Magnitude axis (m) = engagement + attention → thickness and heat only
These axes are orthogonal. They never cross-contaminate.
```

History always goes inward. Engagement makes sections thicken and glow — not float.

### 59.3 Single-Instance Circulation — The Governed Copy

A digital media object in Relay behaves like a physical object. It can be purchased, lent to friends, watched together, and returned — but it cannot be silently duplicated beyond the rights holder's copy cap.

**This system only operates on media where the rights holder has opted in by publishing through Relay with explicit governance parameters.** Relay does not impose this model on external content. It does not override external IP law. It provides a superior voluntary alternative.

**Two layers:**

**A. Storage Layer**

Only one encrypted master copy exists in content-addressed storage. All viewers stream from the same `contentHash`. No per-viewer duplication occurs. Storage incentives naturally reward shared viewing over redundant copies.

**B. Access Token Layer**

Each playback session requires an `AccessLeasePacket`:

```
AccessLeasePacket {
  objectId:            string,
  leaseHolderUserId:   string,
  leaseStart:          ISO-8601,
  leaseEnd:            ISO-8601,
  maxConcurrentViewers: number (for shared viewing / "couch mode"),
  transmissionMode:    enum { PRIVATE_VIEW, SHARED_STREAM },
  commitId:            string (this packet IS a filament commit),
  sourceLeaseId:       string | null (if borrowed from another user's copy)
}
```

The lease packet is a committed, auditable filament on the media object's access branch. It is counted against `maxConcurrentCopies`.

**Circulation rules:**

| Scenario | Lease Behavior |
|----------|---------------|
| Owner watches alone | 1 lease consumed. `transmissionMode = PRIVATE_VIEW` |
| Owner invites 3 friends (same location) | 1 lease consumed. `maxConcurrentViewers = 4`. Same proximity channel. |
| Owner shares with remote friend | 2 leases consumed (1 owner + 1 remote). `transmissionMode = SHARED_STREAM` for remote viewer. |
| Remote friend shares further | Blocked if `totalLeases >= maxConcurrentCopies`. Queued if cap reached. |
| Lease expires | Lease filament migrates inward. Slot freed. |

**Global copy cap:**

`maxConcurrentCopies` is a governance parameter set by the rights holder on the MediaObject. The rights holder can adjust it at any time (raise to sell more, lower to create scarcity). This is a Category A parameter (§11.6) — the rights holder sets the initial value; community governance does not override it (this is a per-object owner parameter, not a global community parameter).

**Economic incentive:**

- Each active copy consumes storage budget and circulation budget
- Fewer copies = lower storage cost = leaner media branch
- Shared viewing (couch mode) is cheaper than individual copies
- The tree visually shows thick trunk for owned copies, thin trunk for efficient shared circulation
- The system naturally rewards lending over hoarding

### 59.4 Viewer Presence — Watching Is Traversal

When someone watches a video in Relay, they do not "press play." They **traverse the branch along the L-axis.**

**L-axis = playback timeline:**

```
l_content(s) = segIndex / (N_segments - 1)    normalized 0..1 along the branch
l(F)         = L_max × l_content(segOf(F))     mapped to actual branch length
```

The base of the branch (trunk side) is the opening. The tip is the end. When playback starts, the viewer is placed at `l = 0` and moves outward as the content progresses.

**Each viewer generates a session filament:**

```
ViewSessionFilament {
  sessionId:           string,
  userId:              string,
  objectId:            string,
  currentLPosition:    number (0..1, updated in real time),
  playbackSpeed:       number (0.5x to 3.0x),
  pauseState:          boolean,
  startTime:           ISO-8601,
  endTime:             ISO-8601 | null (null while active),
  segmentDwellMap:     Map<segIndex, { watchSec, replays, pauses, skips }>
}
```

**Visibility (privacy tiers):**

| Privacy Setting | What Others See |
|----------------|----------------|
| PRIVATE | Nothing. Session filament exists but is invisible to all others. |
| FRIENDS_VISIBLE | A small glowing marker at the viewer's L position, visible only to connections. |
| PUBLIC_VISIBLE | Marker visible to anyone inspecting the media branch. |

**Social watching (co-location):**

If a viewer's presence is visible, other users can:

- See where they are on the timeline (which scene they're watching)
- Jump to their L position to synchronize playback
- Join their playback session (if the viewer permits — creates a shared session with synced L)

Watch parties are not a special feature. They are co-location on the same branch at the same L coordinate. The infrastructure is the same as any shared branch inspection.

**Heat distribution along timeline:**

Engagement is not global — it is **spatial along L.** If many viewers cluster at `L = 0.75` repeatedly, that segment thickens and heats. Without analytics dashboards, the branch itself shows:

- Which scenes are rewatched (thick, hot segments)
- Which scenes are skipped (thin, cool segments)
- Which scenes cause abandonment (viewer markers disappearing)
- Where commentary forks cluster (derivative branches sprouting at specific L coordinates)

### 59.5 Relay Creative License System

Every media filament carries explicit license metadata. Relay does not assume ownership, override external IP law, or force openness. It provides a transparent, deterministic license framework that rights holders opt into.

**License types:**

| License | Derivatives | Commercial Use | Attribution | Description |
|---------|------------|---------------|------------|-------------|
| `RELAY-OPEN` | Unlimited | Yes | Required | Fully remixable. Derivatives auto-link to source. |
| `RELAY-NONCOMM` | Unlimited | No | Required | Remix allowed, no commercial exploitation. |
| `RELAY-ORIGIN` | Must link original | Yes | Required | Derivative must reference source segments. Revenue split applies. |
| `RELAY-CIRCULATION` | None within Relay | N/A | N/A | View-only. No derivatives permitted. Standard commercial circulation. |
| `LEGACY-COPYRIGHT` | None without external license | Per external terms | Per external terms | Relay stores provenance and hash. All rights governed externally. |

**Derivative policy per object:**

```
DerivativePolicy {
  licenseType:           enum (above),
  derivativesAllowed:    boolean,
  commercialUseAllowed:  boolean,
  attributionRequired:   boolean (always true for RELAY-* licenses),
  maxDerivativeDepth:    number | null (null = unlimited),
  royaltySplitModel:     RoyaltyModelRef | null
}
```

**What Relay enforces:**

- If someone creates a derivative without the required license, the derivative filament exists but is marked `UNLICENSED_DERIVATIVE`
- Unlicensed derivatives are not deleted (append-only)
- They are not eligible for monetization modules
- They may be filtered from public LOD at the viewer's discretion
- Their lineage is permanently visible

Relay does not censor. Relay does not police. Relay labels. The market decides.

### 59.6 Derivative Fork Economics — Segment-Level Provenance

Derivatives are not linked vaguely. They must declare **segment-level provenance** — which specific segments of the source they incorporate.

**Fork types:**

```
forkType ∈ { REMIX, FAN_EDIT, TRANSLATION, DUB, CUTDOWN,
              PARODY, SEQUEL, SPINOFF, SCORE_REPLACEMENT, COMMENTARY }
```

**Per-segment upstream reference (mandatory for RELAY-ORIGIN and RELAY-OPEN derivatives):**

```
UpstreamRef {
  sourceProjectId:   string,
  sourceSegIndex:    number,
  overlapPct:        number (0..1),
  overlapMethod:     enum { HASH_EXACT, PERCEPTUAL_HASH, MANUAL_DECLARED },
  evidenceCommitId:  string
}
```

**Credit share per view session:**

When a viewer watches derivative project P1, the system computes how much of that viewing is attributable to upstream sources:

```
For each watched segment seg_i with watch time wt_i:
    u_i = Σ over upstreamRefs(seg_i) [ overlapPct × sourceWeight(forkType) ]

share_to_source = ( Σ (wt_i × u_i) ) / ( Σ wt_i )
Bounded to [0, 1].
```

**Source weight table (Category A global parameters, initial values):**

| Fork Type | sourceWeight |
|-----------|-------------|
| TRANSLATION / DUB | 0.80 |
| FAN_EDIT | 0.50 |
| REMIX | 0.40 |
| CUTDOWN | 0.60 |
| COMMENTARY | 0.20 |
| PARODY | 0.15 |
| SEQUEL / SPINOFF | 0.10 |
| SCORE_REPLACEMENT | 0.30 |

**Economic flow:**

Each view session emits a `TransferPacket` (§31.1) + `ResponsibilityPacket` (§31.2):

- Viewer's engagement credit wallet debits
- Derivative creator wallet credits `(1 - share_to_source)` of the session value
- Source creator wallet(s) credit `share_to_source`, split proportionally across upstream segment owners by their `overlapPct` density

This is not copyright enforcement. It is native attribution revenue splitting based on explicit, auditable segment mapping. The mapping is evidence. The evidence is committed. The split is deterministic.

**Anti-gaming constraint:** A derivative cannot claim upstream linkage without evidence. `ForkEdge` requires: upstream segment refs + `overlapMethod` + hash proofs or attestations. If mapping is absent or vague (no segments linked), `share_to_source = 0`. No free-riding on upstream attribution.

### 59.7 Media LOD Thresholds

Media branches use four sub-levels within the existing LOD framework (§33.5). These prevent primitive explosion while allowing full granularity on inspection.

| Media LOD | Altitude Threshold | What Renders | Max Primitives |
|-----------|-------------------|-------------|---------------|
| MEDIA-TREE | > 50 km | Branch as normal cylinder. Overall project heat band. Twig/wilt/scar indicators. No segment detail. | 1 branch primitive + 1 heat band |
| MEDIA-BRANCH | 5 km – 50 km | Scene bands (30–120s chunks). Hot strips along L. Viewer presence as single dot per active session. | ≤ 500 scene strips |
| MEDIA-SEGMENT | 200 m – 5 km | Segments at Δt resolution (1s or 2s). Segment ribbons, scars (edits), confidence/fog. Viewer presence marker moving along L. | ≤ 2,000 visible segments (within sight radius window) |
| MEDIA-FRAME | < 200 m (or explicit "Inspect Frames" action) | Frames in a narrow window around focus. Rendered as flat texture panel / canvas layer — NOT as Cesium primitives. | 0 Cesium primitives for frames |

**Sight radius window for segments:**

At MEDIA-SEGMENT LOD, only segments within a sliding window around the viewer's focus are rendered:

```
windowSeconds = 120 (±60 seconds from focus point)
maxRenderedSegments = windowSeconds / Δt
```

With `Δt = 1s` → 120 visible segments. With `Δt = 2s` → 60. Everything outside the window collapses into scene-level heat strips.

**Frame rendering rule (frozen):** Frames never instantiate as Cesium primitives. Ever. They are a UI / texture-atlas problem, not a world-primitive problem. At MEDIA-FRAME LOD, the branch bark unrolls into a 2D inspection panel (consistent with §3.3 zoom-to-flat transition) and frames render as a canvas texture strip within that panel.

### 59.8 Audio, Music, and Temporal Content

Audio follows identical physics. The content type determines only the bark rendering at CELL LOD (per §3.2 table: `Music / audio → Waveform or notation → Milestone sinking`).

**Audio-specific mappings:**

| Concept | Audio Equivalent |
|---------|-----------------|
| Scene | Track / movement / act |
| Segment | Verse, chorus, bridge, outro (or fixed Δt windows) |
| Frame cluster | Beat / measure (inspection-only, never Cesium primitives) |
| Hot segment | High-replay section (chorus that gets replayed → thickens and heats) |
| Derivative fork at L | Remix branching off at a specific timestamp (e.g., "remix of the bridge at 2:34") |
| Cross-section ring | Production session / mix version / remaster epoch |

**Music composition workflow:**

A producer working on an album has a media branch where:

- Each track is a scene-level filament
- Each segment records takes, mixes, and overdubs as commit depth (radial layers)
- Approval commits (producer sign-off, mastering certification) drive stability and inward migration
- The cross-section shows production density: thick rings = intense recording periods, thin rings = quiet periods
- Scars = rejected takes or recalled mixes

Listener engagement after release follows the same dual-axis model: engagement thickens and heats segments but does not move their radial position. The producer's original recording session (the "sticky note posted in Hollywood") sinks inward over time as heartwood. Engagement illuminates history — it does not rewrite it.

### 59.9 Engagement Geography — Wind, Heat, Lightning on Media

Media branches respond to the same force equations (§3.19) as all other branches. Engagement creates directional pressure.

**Wind (lean):**

If viewers of a film cluster geographically — e.g., a movie becomes popular in South America — the branch leans toward that region. This is computed from the angular distribution of viewer session origins mapped to counterparty θ (§3.15). The lean is small (capped per contract #114), observable during replay, and explainable to one click: "This branch leans southwest because 68% of its viewers are in Brazil and Argentina."

**Heat:**

Segment-level heat (`dE/dt` over timebox windows) renders as heat color overlay along the branch. A newly released film with explosive viewership shows a uniformly hot branch. Over time, heat concentrates at rewatched segments while skipped segments cool.

**Lightning cascades (§3.16):**

If a clip goes viral — sudden engagement spike at a specific L position — lightning appears. The trigger: that segment spawns derivative clips, reaction videos branch off, commentary forks appear, cross-language translations spike. The lightning radiates from that L coordinate across multiple trees. This is visible propagation of cultural impact, not decoration.

**Fog:**

Fog on media branches represents **production evidence deficit**, not unpopularity. A segment with no QA approval, no mastering certification, and no production evidence is foggy regardless of how many people watched it. High engagement does not reduce fog. Only evidence commits reduce fog. This preserves the separation: fog = confidence, heat = engagement.

### 59.10 Storage Discipline and Archival Compression

**Single-master principle:**

The encrypted master file is stored once. `contentHash` is the canonical reference. Viewers stream from this single source. No per-viewer copies are created. Session filaments (ViewSessionFilament) are lightweight commit records, not content duplicates.

**Archival compression:**

Media follows the same five-layer replay compression strategy (§48.4.3):

1. Per-segment engagement aggregates compress to timebox summaries
2. Old session filaments migrate inward and compress (warm → cold → heartwood)
3. The master file itself undergoes codec-level archival compression after a configurable age threshold
4. Merkle checkpoints seal engagement history at epoch boundaries
5. Regional federation sharding distributes storage geographically by viewer concentration

**Economic incentive structure:**

- Each copy stored against `maxConcurrentCopies` consumes measurable storage budget
- The media branch visually shows storage efficiency: thick branch = many redundant copies, thin branch = lean shared circulation
- Rights holders who set lower copy caps reduce their storage footprint and increase scarcity value
- Rights holders who raise copy caps increase accessibility and earn from broader circulation
- The balance between copies sold and copies demanded is a visible market signal on the branch: if `maxConcurrentCopies` is consistently saturated (all leases active), the owner sees a hot, fully-utilized branch and knows demand exceeds supply

### 59.11 Cross-Section of a Media Branch

Cut the media branch perpendicular to its axis. The cross-section (§3.4) reveals:

**Radial rings = production epochs:**

- Outermost ring = current release version (CLOSED, post-release)
- Middle rings = production sessions (ACTIVE → CLOSED during production)
- Inner rings = early drafts, pre-production concepts (ABSORBED)
- Core = original concept / first commit (heartwood)

**Angular sectors = viewer/contributor geography:**

- Viewer origins map to counterparty θ
- A film watched mostly from Europe shows dense angular sectors in the European bearing range
- Production contributors (actors, crew, editors) appear as separate angular signatures during production phases

**Color/opacity = engagement magnitude and production confidence:**

- Hot (red) segments = high engagement
- Cool (blue) segments = low engagement
- Solid = high production confidence (well-evidenced, QA-approved)
- Transparent = low confidence (unverified, missing approvals)

A remaster is a schema ridge — a discontinuity in ring structure where a new production epoch begins on top of old rings. A censorship event is a scar. A director's cut is a fork. All are permanent, readable in cross-section.

### 59.12 How This Connects to Existing Modules

**§3.2 content-type table:** This section formalizes what "Music / audio" and "Images / CAD / visual media" mean at every LOD level, not just CELL LOD bark rendering.

**§21.2.9 Media Production template:** The existing template (`creative`, `production`, `talent`, `distribution`, `marketing`, `legal`, `finance` branches) now has a formal circulation and viewing model. The `barkRenderMode: media` with `lAxisMapping: timelinePosition` specified in §21.2.9 maps directly to §59.2's longitudinal position equation.

**§31 Accounting Packets:** View sessions emit the same TransferPacket + ResponsibilityPacket as financial transactions. The royalty split in §59.6 uses the same zero-sum posting rules. The derivative credit share is a deterministic posting — not a separate payment system.

**§57 Adoption Tiers:** Media objects at Tier 0 = hash of external content (foggy but tamper-evident). Tier 1 = mirrored metadata from external distribution platform. Tier 2 = dual tracking in Relay and external platform. Tier 3 = fully Relay-native with circulation, leasing, and derivative economics. All tiers coexist on the same media branch.

**§58 Education:** Educational content (lectures, tutorials, demonstrations) IS media governed by §59. Teacher explanation filaments (§58.3) are media filaments with the same dual-axis physics, the same viewer presence model, and the same engagement-to-magnitude mapping. The difference is only in the template (education template vs. entertainment template) — not in the underlying physics.

**§38 Module Discovery:** The media circulation system is itself a module. Users discover it by demonstrating competence with filament lifecycle, branch governance, and accounting packets. There is no "media tier" or "entertainment stage."

**Contract #143 — Single-instance circulation is the only media distribution model in Relay.** A media object has exactly one encrypted master file identified by `contentHash`. All playback sessions stream from this single source. `AccessLeasePacket` commits track every active lease. `maxConcurrentCopies` is a per-object governance parameter set by the rights holder. When the cap is reached, additional access requests queue. No per-viewer file duplication occurs. Lease expiry frees slots. The system incentivizes shared viewing (fewer leases consumed) over individual copies. Relay does not impose this model on external content — it operates only on media published through Relay with explicit governance parameters.

**Contract #144 — Radial position and engagement are orthogonal on media branches.** The radial axis (`r`) is governed exclusively by lifecycle state, production stability, and commit depth. The engagement axis (`m`) is governed exclusively by viewer activity (dwell time, replays, pauses, skips) and derivative fork count. Engagement never moves a segment's radial position. Commits never change engagement weight. `r` controls where a segment sits in the cross-section rings. `m` controls thickness, heat, and glow. These two axes never cross-contaminate. This is the same invariant as all other Relay branches, explicitly frozen for media to prevent any future system where popularity overrides history.

**Contract #145 — Derivative forks must declare segment-level provenance.** A derivative media project that claims upstream linkage must map specific derivative segments to specific source segments with `overlapPct` and `overlapMethod` (hash exact, perceptual hash, or manual declaration with evidence). Credit share per view session is computed deterministically from these mappings using the `sourceWeight` table by fork type. If no segment-level mapping is provided, `share_to_source = 0` — no upstream credit flows. The mapping is a committed evidence chain, auditable by any party. This prevents both free-riding (claiming credit without evidence) and ghost attribution (vague links without substance).

**Contract #146 — Frames never instantiate as Cesium primitives.** At MEDIA-FRAME LOD (< 200m altitude or explicit inspect action), individual frames render in a 2D inspection panel (flat canvas / texture atlas) using the §3.3 zoom-to-flat transition. Zero Cesium Entity or Primitive objects are created per frame. The world-primitive budget at MEDIA-SEGMENT LOD is capped at 2,000 visible segments within the sight radius window. Scene-level LOD (MEDIA-BRANCH) is capped at 500 strips. MEDIA-TREE uses 2 primitives total (branch + heat band). These caps are Category A global parameters.

---

## 60. Fractal Branching — Any Branch Can Host a Full Tree — Frozen Contracts #148–149

> *"In every walk with nature, one receives far more than he seeks."* — John Muir

**Prerequisites:** §22 (fractal scaling), §3.18 (branch layout), §33.5 (LOD thresholds), §3.19 (universal force equations).

§22 established that a trunk at one level is a branch at the next level up (neighborhood → city → country). That describes fractal scaling **between** trees. This section formalizes the complementary rule: fractal branching **within** a tree. Any branch can host child branches and child trees, recursively, to arbitrary depth. A department branch can contain a course tree. A course branch can contain a unit tree. A unit branch can contain a lab tree. The recursion is unlimited. The physics are identical at every layer.

### 60.1 The Fractal Branching Invariant

**A branch is not a leaf.** A branch is a scope container that can contain:

- **Filaments** — work items, lessons, transactions, media segments
- **Timeboxes** — slab aggregates for the branch's time periods
- **Projections** — analysis branches (light blue)
- **Child branches** — sub-categories within the same scope
- **Child trees** — full sub-worlds with their own trunks, branches, filaments, and physics

A "department branch" can contain a "course tree." A "course branch" can contain a "unit tree." A "product branch" can contain a "factory tree." A "lesson branch" can contain a "quiz tree." There is no maximum depth. The recursion terminates only when there is no further sub-structure to represent.

**Schema:**

```
BranchContents {
  branchId:        string,
  nodeKind:        enum { TRUNK, BRANCH, TREE_PORTAL },
  filaments:       FilamentRef[],
  timeboxes:       TimeboxRef[],
  projections:     ProjectionRef[],
  childBranches:   BranchRef[],
  childTrees:      TreePortalRef[]
}

TreePortalRef {
  portalId:        string,
  parentBranchId:  string,
  childTreeId:     string,
  childTemplate:   TemplateRef,
  spawnEvent:      FractalSpawnEventRef,
  aggregateCache:  TimeboxAggregate (parent sees only this)
}
```

**NodeKind:**

| Kind | Meaning |
|------|---------|
| `TRUNK` | The central spine of a tree. Feeds into the parent scope (a branch on a higher-level tree, or the globe surface). |
| `BRANCH` | A standard branch extending from a trunk or parent branch. Contains filaments, timeboxes, and optionally child branches/trees. |
| `TREE_PORTAL` | A branch that hosts a full child tree. At the parent's LOD, it renders as a branch with aggregate metrics. On entry (zoom/focus), it expands into a complete tree with its own trunk, branches, and full physics. |

### 60.2 Fractal Spawn Events

Sub-trees are not created implicitly. They are spawned by explicit, auditable events:

```
FractalSpawnEvent {
  eventId:         string,
  parentBranchId:  string,
  childTreeId:     string,
  spawnType:       enum { BRANCH_SPLIT, SUBTREE_SPAWN, TEMPLATE_INSTANTIATION },
  trigger:         enum { VOLUME_THRESHOLD, COMPLEXITY_THRESHOLD, GOVERNANCE_DECISION, MANUAL },
  triggerEvidence:  commitId,
  timestamp:       ISO-8601,
  childTemplate:   TemplateRef,
  inheritedParams: ParamOverride[] (which parent parameters the child inherits)
}
```

**Spawn types:**

| Type | When Used | Example |
|------|-----------|---------|
| `BRANCH_SPLIT` | A category becomes too broad and splits into sub-branches within the same parent | `finance` splits into `finance.ap`, `finance.ar`, `finance.treasury` |
| `SUBTREE_SPAWN` | A branch needs its own internal world with independent structure | Inside `factory.operations`, spawn a `Machine-12` tree with its own maintenance, quality, and output branches |
| `TEMPLATE_INSTANTIATION` | A new scope is created from a template | Inside `education.biology01`, instantiate a `Unit 3: Cellular Respiration Lab` tree from the lab template |

**Triggers:**

- `VOLUME_THRESHOLD` — the branch exceeds a configurable filament count (Category A parameter, default: 500). The system suggests splitting. A governance commit approves or rejects.
- `COMPLEXITY_THRESHOLD` — the branch's sub-category diversity exceeds a threshold. SCV may recommend splitting.
- `GOVERNANCE_DECISION` — a human or governance vote explicitly creates the sub-tree.
- `MANUAL` — a user with branch authority creates the sub-tree directly.

All spawns are commits. All spawns are auditable. The spawn event is a permanent filament on the parent branch, marking when and why the sub-tree was created.

### 60.3 Physics Inheritance

Child trees inherit the parent's physics engine (§3.19) without modification. The ten force equations are identical at every recursion layer:

- **Radial position** — lifecycle maturity within the child tree's own coordinate frame
- **Gravity sink** — calendar time drives sinking in the child tree exactly as in the parent
- **Lean vector** — computed from the child tree's own filament θ distribution
- **Wilt** — computed from the child tree's own integrity metrics
- **Heat, fog, storm, lightning** — all computed locally within the child tree
- **Trunk mass** — the child tree's trunk mass feeds upward as the `aggregateCache` on the `TreePortalRef`

**What the parent sees:**

The parent branch does not see the child tree's internal structure. It sees only the `TimeboxAggregate` from the child tree's trunk — a single set of aggregate metrics (commit count, magnitude, confidence, heat, fog, wilt) that represent the child tree's health. This is identical to how a city tree sees a company tree: aggregate only, drill-down on focus.

**What changes inside the child:**

The child tree has its own:

- Template (may differ from parent — a lab tree inside a course tree uses a lab template)
- Branch layout (computed from the child's own `layoutKey` hashes)
- Timebox cadence (may differ — the parent course uses semester timeboxes, the child lab uses weekly timeboxes)
- Governance scope (may have its own voting population — students enrolled in that lab)

**What does NOT change:**

- The ten force equations (§3.19) — identical
- The lifecycle states (§4.3) — identical
- The append-only invariant — identical
- The cross-section encoding (§3.4) — identical
- The LOD rendering rules (§33.5) — identical

### 60.4 LOD Gating for Portals — One Layer at Full Fidelity

The critical rendering rule: **never render more than one recursion layer at full fidelity simultaneously.**

When the camera is at the parent tree's LOD:

- The `TREE_PORTAL` branch renders as a normal branch with aggregate metrics (thickness = child tree's total magnitude, color = child tree's average heat, opacity = child tree's average confidence, lean = child tree's aggregate lean)
- No internal structure of the child tree is visible
- A portal indicator (subtle visual marker) shows that this branch contains a sub-world

When the user enters the portal (zoom into the TREE_PORTAL branch past a threshold):

- The parent tree fades to context (reduced opacity, simplified rendering)
- The child tree expands to full fidelity — its own trunk, branches, filaments become visible
- The child tree's own LOD rules (§33.5) now govern what renders within it
- Navigation within the child tree works identically to any other tree

When the user exits the portal (zoom out past the threshold, or press backtick for position stack):

- The child tree collapses back to aggregate
- The parent tree returns to full fidelity

**Entry threshold:** The portal entry distance is the same as BRANCH LOD (5–50 km equivalent in the child tree's local coordinate frame). This is a Category A global parameter.

**Breadcrumb trail:** When inside a child tree, the HUD shows the full path: `Company > HR > Training > Biology 01 > Unit 3 > Lab`. Each segment is clickable to exit to that level. This uses the existing position stack mechanism (camera controller §50).

### 60.5 The Fan-Out Pattern in Time

The fractal branching rule explains a temporal pattern visible in replay:

1. **Growth phase** — a branch accumulates filaments, thickens, heats
2. **Specialization phase** — volume or complexity triggers splits. New child branches or sub-trees spawn. The parent branch fans out into multiple specialized scopes.
3. **Maturation phase** — each child scope grows independently. Some thrive (thick, firm). Some wilt (thin, foggy). Some get absorbed (collapse back into the parent as the specialization proved unnecessary).
4. **Consolidation phase** — old child scopes sink inward. The rings record the organizational structure that existed at each epoch. New child scopes spawn at the bark. The cycle repeats.

Over many years, the cross-section of a branch shows this pattern: concentric rings where each ring contains the ghost of child scopes that existed during that epoch. Some scopes are continuous threads running through many rings (stable departments). Some appear in a few rings and disappear (temporary projects). Some start small and grow to dominate (successful initiatives).

This is **organizational evolution made visible as wood grain.** You do not need an org chart history document. You look at the cross-section.

### 60.6 Examples

**Company tree:**

```
Relay Corp Tree
├── Finance (branch)
│   ├── AP (child branch)
│   ├── AR (child branch)
│   └── Treasury (child branch)
├── HR (branch)
│   └── Training (TREE_PORTAL → Training sub-tree)
│       ├── Biology 01 (TREE_PORTAL → Course sub-tree)
│       │   ├── curriculum branch
│       │   ├── delivery branches (teacher methods)
│       │   ├── Unit 3 (TREE_PORTAL → Lab sub-tree)
│       │   │   ├── data branch
│       │   │   ├── analysis branch
│       │   │   ├── grading branch
│       │   │   └── equipment branch
│       │   └── ...
│       ├── Accounting 101 (TREE_PORTAL → Course sub-tree)
│       └── ...
├── Operations (branch)
│   └── Machine-12 (TREE_PORTAL → Machine sub-tree)
│       ├── maintenance branch
│       ├── quality branch
│       ├── output branch
│       └── sensor-data branch
└── ...
```

At Company LOD: you see Finance, HR, Operations as branches. Training is a normal-looking branch on HR.

At HR LOD: you see Training as a branch. Its thickness and health reflect the aggregate of all courses inside it.

Enter Training portal: you see course sub-trees as branches. Biology 01 is thick and firm. Accounting 101 is thinner.

Enter Biology 01 portal: you see curriculum, delivery, units as branches on the course tree.

Enter Unit 3 portal: you see data, analysis, grading, equipment branches on the lab tree.

Same physics at every layer. Same rendering rules. Same equations. Only the template and governance scope change.

### 60.7 Relationship to §22 (Fractal Scaling)

§22 describes fractal scaling **between independent trees**: neighborhood → city → country. Each tree exists independently on the globe. A trunk at one level is a branch on the next level up.

§60 describes fractal branching **within a single tree**: any branch can host child trees internally. The child tree exists inside the parent branch, not as an independent globe-level entity.

Both rules use identical physics. The difference is scope:

| Rule | Scope | Navigation |
|------|-------|-----------|
| §22 Fractal Scaling | Between trees on the globe | Zoom out to see city tree, zoom in to see company tree |
| §60 Fractal Branching | Within a single tree | Enter a branch portal to see the sub-tree inside it |

They compose: a city tree (§22) contains company trees as branches. A company tree (§60) contains department sub-trees as portals within branches. A department sub-tree contains course sub-trees. The recursion is seamless.

**Contract #148 — Grading is a sortition process with fixed rubric filaments, auto-check for objective parts, peer review juries for subjective parts, and teacher spot-check for random samples plus escalations (§58.10). Jurors are selected by sortition from students who have demonstrated the module being assessed. Consensus determines the final grade; disagreement triggers escalation. Peer graders earn magnitude credit. The sortition grading pipeline scales independently of class size — a course with 10,000 students requires the same teacher effort as a course with 100.**

**Contract #149 — Any branch can contain child branches and child trees (§60). Child trees inherit identical physics and force equations (§3.19). The parent sees only aggregate metrics from the child tree's trunk. Rendering never shows more than one recursion layer at full fidelity simultaneously — portal entry is explicit (zoom/focus), portal exit collapses the child tree back to aggregate. FractalSpawnEvent commits are the only mechanism for creating child trees; all spawns are auditable. The ten force equations, lifecycle states, append-only invariant, cross-section encoding, and LOD rendering rules are identical at every recursion depth.**

---

## 61. Privacy Sovereignty & Civic Enforcement — Frozen Contracts #150–152

> *"Those who would give up essential liberty, to purchase a little temporary safety, deserve neither liberty nor safety."* — Benjamin Franklin

**Prerequisites:** §8.5 (disclosure tiers), §29 (proximity channels), §46 (sortition case resolution), §10 (pressure physics), §42 (duels), frozen contracts #40 (bystander privacy), #49 (detection mesh local-first), #52 (presence quantization), #62 (presence anti-correlation).

This section formalizes two related principles. First: the absolute boundary between private and public data in Relay — what is private is uninspectable, what is public is fully inspectable, and nothing else exists. Second: how civic enforcement works when society itself is the enforcement mechanism — citizens document violations, the system routes investigations, and enforcement workers are compensated by society through governed parameters.

### 61.1 The Privacy Boundary — Absolute and Binary

A user's tree has exactly two states of visibility for any filament, branch, or sub-tree:

**Private** — exists only on the user's tree at `disclosureTier = 0`. No other user, no SCV, no governance mechanism, no legal process within Relay can inspect it. The filament is cryptographically sealed. It contributes to the user's aggregate tree shape (the branch still has thickness from the filament's magnitude, because the aggregate is truthful per §33.4), but the filament's contents, identity, counterparty, and evidence are invisible to all external observers. Private data cannot be subpoenaed through Relay. It cannot be discovered through duel proceedings. It cannot be revealed by jury sortition. It does not exist to anyone except the user.

**Public** — exists at `disclosureTier >= 1` on the user's tree, or on any public tree (company, municipal, institutional). Fully inspectable by anyone with appropriate access per the disclosure tier rules (§8.5). Can be referenced as evidence in duel proceedings, jury cases, governance votes, and civic enforcement workflows. Public data is append-only, Merkle-sealed, and permanent. Once published, it cannot be un-published — only its disclosure tier can be raised (more visible), never lowered below the level at which it was first committed, except through cryptographic erasure (§65.1) when legally mandated under GDPR Art. 17, COPPA, or court order. Erasure destroys the CEK, rendering content permanently unreadable while preserving the Merkle hash as a tombstone.

**There is no middle state.** There is no "semi-private" or "discoverable under court order within Relay." Relay does not have a backdoor. Relay does not have an admin panel that reveals private data. The cryptographic seal is the privacy boundary, and it is absolute.

**What this means practically:**

- Your personal files, notes, drafts, and private branches are yours. They exist on your tree. Nobody can see them.
- The moment you commit something to a public branch — a company tree, a municipal tree, a published media branch — it becomes part of the shared record. It is inspectable.
- Most professional activity will be public by design: invoices, contracts, municipal filings, corporate reports, governance votes. These are public acts on public trees.
- Most personal activity can remain private by choice: personal finances, health data, private notes, draft documents. The user controls disclosure tier.

**External legal systems operate outside Relay.** A court in any jurisdiction can subpoena a user's personal devices, compel testimony, or seize hardware. Relay cannot prevent that — Relay is software, not a sovereign state. But Relay itself will never provide a mechanism to bypass the cryptographic privacy boundary. There is no API call, no admin function, no governance vote that reveals `disclosureTier = 0` data to any third party. If a court needs data, it subpoenas the user, not Relay.

### 61.2 The Public Exposure Principle — Evidence Admissibility

If you expose something publicly — by committing it to a public tree, by performing an action in a proximity channel, by broadcasting your presence, or by being filmed in a public space — that exposure is permanent evidence.

**The rule:** Only what you have publicly exposed can be used against you within Relay. Private data is inadmissible. Public data is fully admissible.

This applies to:

| Context | What Constitutes Public Exposure |
|---------|--------------------------------|
| **Duel proceedings** | Only publicly committed filaments and their evidence chains. Private tree data is inadmissible. |
| **Jury sortition cases** | Only public filaments, public governance commits, and public evidence. Jurors cannot request private data discovery. |
| **Civic enforcement** | Only evidence captured in public spaces (camera footage, proximity detection, broadcast signals). Private device data is inadmissible. |
| **Governance votes** | Only public participation history. Private branch activity does not affect vote weight or eligibility. |
| **Employment/reputation** | Only the public portion of the user tree. Employers see what the user's disclosure tier permits — nothing more. |

**The deterrent effect is structural, not punitive.** In a world where Relay proximity channels, public cameras connected to the detection mesh, and civic observers exist pervasively, most violations of social norms and laws in public spaces will be captured. Not because Relay surveils — but because the public environment is instrumented by its participants. The rational response is not to hide violations better, but to stop committing them. The privacy boundary protects your inner life. It does not protect public misconduct.

### 61.3 Civic Enforcement — Society as the Enforcement Layer

Relay does not have police. Relay does not have enforcement officers. Relay does not adjudicate crimes. External legal systems handle criminal law, courts, and incarceration.

What Relay provides is a **civic observation and routing substrate** — the infrastructure for citizens to document public violations, link evidence, tag responsible parties, and route enforcement tasks to designated civic workers.

**The workflow:**

```
1. OBSERVATION — A citizen witnesses a violation in a public space
   (e.g., driver runs a red light while on their phone at a crosswalk)

2. EVIDENCE CAPTURE — The citizen films the event using their device
   Camera footage → processed on-device (contract #49)
   → classified signal metadata: vehicle type, license plate OCR,
     timestamp, GPS coordinates, violation type

3. EVIDENCE CORRELATION — Relay correlates available public signals:
   - License plate OCR from camera footage
   - Proximity broadcast from the violator's device
     (phone WiFi, car WiFi hotspot — if broadcasting publicly)
   - Proximity channel detection (BLE/WiFi multi-signal, §29)
   - Timestamp alignment between camera footage and proximity data

4. TAGGING — The citizen creates an EVIDENCE FILAMENT on a public
   civic branch (e.g., the municipal traffic enforcement branch):
   CivicObservationFilament {
     observerUserId:     string,
     observationTime:    ISO-8601,
     location:           GPS coordinates,
     violationType:      enum (from civic violation taxonomy),
     evidenceRefs: [
       { type: VIDEO_CLIP, hash: SHA-256, captureDevice: observerDeviceId },
       { type: LICENSE_PLATE_OCR, value: "XX-123-YY", confidence: 0.94 },
       { type: PROXIMITY_CORRELATION, matchedPresenceId: string | null }
     ],
     taggedUserId:       string | null (linked only if proximity
                         correlation confirms identity publicly),
     status:             OPEN
   }

5. ROUTING — The filament appears on the civic enforcement branch.
   Designated enforcement workers (traffic control, code enforcement,
   etc.) monitor this branch as part of their work scope.

6. INVESTIGATION — An enforcement worker picks up the filament:
   - Reviews evidence (video, OCR, proximity data)
   - Confirms or disputes the violation
   - Adds investigation evidence (additional footage, witness
     statements, official records cross-reference)
   - Updates filament status: OPEN → ACTIVE → CLOSED (confirmed)
     or OPEN → ACTIVE → HOLD (disputed, escalated to sortition jury)

7. RESOLUTION — If confirmed, the filament becomes a permanent
   record on the civic branch. The tagged user's public tree
   (if identified) shows the violation as a filament. Enforcement
   consequences follow external legal systems — Relay records
   the evidence, it does not sentence.
```

**Critical constraints:**

- **Tagging requires evidence, not accusation.** A `CivicObservationFilament` with no evidence refs (no video, no OCR, no proximity correlation) has `orgConfidence = 0`. It is foggy. It sinks. It is functionally invisible. You cannot tag someone without evidence.
- **Proximity correlation is not surveillance.** Relay only correlates publicly broadcast signals. If your phone's WiFi or your car's hotspot is broadcasting its identifier publicly (as all devices do by default), that broadcast is a public signal. If you disable broadcasting, no correlation is possible from Relay's side. Contract #40 (bystander privacy) applies: non-Relay users and disabled presence are never processed.
- **The observer is also on record.** The `observerUserId` is part of the filament. False accusations are traceable. A pattern of unsubstantiated civic observation filaments (high volume, low confirmation rate) creates wilt on the observer's civic participation branch. The system self-corrects against frivolous tagging.

### 61.4 Enforcement Workers — Paid by Society

Civic enforcement in Relay is not volunteer vigilantism. It is **structured work compensated through governed economic parameters.**

**The model:**

- A municipal tree (or any organizational tree with a civic scope) has an **enforcement branch**
- The enforcement branch contains task filaments routed from civic observation filaments (§61.3)
- Designated enforcement workers monitor and process these task filaments as their job
- Compensation follows the same TransferPacket + ResponsibilityPacket model (§31) as any other Relay work

**Task types and routing:**

| Task Type | Who Handles It | Source |
|-----------|---------------|--------|
| Traffic violations | Traffic enforcement workers | Citizen observation filaments on traffic branch |
| Building code violations | Code enforcement workers | Citizen observation filaments on zoning branch |
| Environmental violations | Environmental enforcement workers | Sensor data + citizen observation filaments |
| Noise complaints | Community mediation workers | Proximity channel complaints |
| Public safety concerns | Safety enforcement workers | Citizen observation + SCV hazard detection |

**Compensation parameters:**

Each enforcement task type has a **minimum wage parameter** — a Category A global parameter (§11.6) governed by the municipal community. This sets the floor compensation for processing one enforcement task filament to completion.

```
EnforcementTaskParams {
  taskType:              enum (traffic, code, environmental, safety, ...),
  minimumWagePerTask:    number (Engagement Credits, Category A),
  maxTasksPerWorker:     number (per timebox, prevents burnout/gaming),
  requiredEvidence:      EvidenceRuleSet (what the worker must provide to close),
  escalationThreshold:   number (disputed tasks escalate to sortition jury)
}
```

Workers earn by completing tasks — reviewing evidence, confirming or disputing violations, adding investigation evidence, and closing filaments. The compensation is proportional to the quality and thoroughness of their investigation (measured by evidence completeness and subsequent appeal rate). A worker who rubber-stamps every observation without investigation will accumulate low-confidence closures, which wilt their enforcement branch and reduce their task routing priority.

**Who qualifies as an enforcement worker:**

Any user who demonstrates competence with the relevant civic module (§38 module discovery). Traffic enforcement requires demonstrated understanding of traffic law and evidence evaluation. Building code enforcement requires demonstrated understanding of zoning regulations. The education system (§58) provides the skill paths; the sortition grading pipeline (§58.10) validates competence. There is no centralized hiring — the system discovers qualified workers the same way it discovers qualified teachers.

### 61.5 The Deterrent Geometry

In a world with pervasive Relay presence, the geometry of deterrence changes:

**Before Relay:** Violations succeed when unobserved. Enforcement requires dedicated officers who cannot be everywhere. The ratio of violations to observations is high. Enforcement is expensive and inconsistent.

**With Relay:** Every citizen is a potential observer. Every phone is a potential camera. Every proximity channel is a potential evidence source. The ratio of violations to observations approaches zero in instrumented public spaces. Enforcement workers process documented evidence instead of patrolling for undocumented events. The cost per enforcement action drops because evidence arrives pre-correlated.

**The tree shows this geometrically:**

- A municipal traffic enforcement branch with many OPEN observation filaments and few CLOSED ones = overwhelmed enforcement (thick bark, many twigs)
- A branch with observation filaments that close quickly = effective enforcement (firm, healthy branch)
- A branch that thins over time = declining violations (the deterrent is working — fewer observations needed because fewer violations occur)

The deterrent effect is visible in the branch shape. Society can see whether enforcement is working by looking at the tree. No report needed. No statistics department. The tree IS the report.

### 61.6 Privacy in Duels and Legal Proceedings

Duels (§42) and sortition jury cases (§46) follow the exposure principle:

**In a duel:**

- Both participants may present evidence from public trees and public filaments
- Neither participant can compel the other to reveal private data
- SCV may analyze publicly available evidence chains but cannot access private branches
- The audience votes on publicly presented evidence only
- If one party claims evidence exists but refuses to reveal it, the branch they point to is private (invisible to the audience), and the audience draws their own conclusions from what IS visible

**In a sortition jury case:**

- The jury sees only publicly committed evidence
- No discovery mechanism exists within Relay to force private data disclosure
- If a party to the case wishes to reveal private data as evidence, they explicitly change its disclosure tier (a governance commit on their own tree, permanent and append-only)
- The act of disclosure is itself a committed event — visible, timestamped, irreversible

**The structural consequence:** In Relay, the strongest legal position is one supported by publicly committed, high-confidence evidence. A party with thick, firm, well-evidenced public branches is stronger than a party who kept everything private and has nothing to show. The system rewards transparency for those who want influence, and protects privacy for those who want solitude. Both are valid. The tree reflects the choice.

### 61.7 How This Connects to Existing Architecture

**§8.5 (Disclosure Tiers):** §61.1 elevates the existing three-tier disclosure model from a feature to a first principle. The binary private/public boundary is the absolute foundation. The tiers within the public range (Tier 1 role badge, Tier 2 named identity) are gradations of visibility detail — Tier 1 shows shapes, Tier 2 shows content. At whatever tier data is committed, it is fully inspectable to the extent of that tier. (See §71.9 for canonical tier definition and privacy granularity: per filament, per branch, per tree.)

**§29 (Proximity Channels):** §61.3 uses proximity detection as one evidence correlation signal among several. The BLE/WiFi multi-signal confirmation from §29.2 feeds into the civic observation evidence chain. Approach angle (§29.3) provides directional evidence. Anti-spoof (§29.4) prevents fabricated proximity data.

**§46 (Sortition Case Resolution):** §61.6 defines evidence admissibility rules for sortition cases — public only, no forced discovery. This is consistent with contract #68 (sortition as sole dispute resolution) and adds the privacy constraint.

**§42 (Duels):** §61.6 applies the same admissibility rule to duels. Contract #32 (duels are public filaments) already establishes that duel events are public. §61.6 extends this: the evidence presented in duels must also be public.

**Contract #40 (Bystander Privacy):** §61.3 is fully compatible. Non-Relay users are never processed. Civic observation only correlates publicly broadcast signals from Relay-present devices.

**Contract #49 (Detection Mesh Local-First):** §61.3 camera processing runs on-device. Raw video never leaves hardware. Only classified metadata (license plate OCR, vehicle type, timestamp) is transmitted. The civic observation filament contains metadata references, not raw footage.

**§11.6 (Global Parameter Registry):** Enforcement task minimum wages (§61.4) are Category A global parameters. Each municipality governs its own enforcement compensation rates.

**Contract #150 — Private data is absolutely uninspectable within Relay.** Filaments at `disclosureTier = 0` are cryptographically sealed. No user, SCV, governance mechanism, duel proceeding, jury sortition case, or civic enforcement workflow can access, inspect, reference, or reveal private data. Relay provides no backdoor, no admin function, no discovery mechanism for private data. External legal systems may subpoena the user directly — Relay itself will never provide a pathway to bypass the cryptographic privacy boundary. The aggregate tree shape remains truthful (branch thickness from private filaments is computed per §33.4), but individual filament contents at Tier 0 are invisible to all external observers.

**Contract #151 — Only publicly exposed data is admissible as evidence within Relay.** In duel proceedings, sortition jury cases, civic enforcement workflows, governance votes, and any other Relay process that evaluates evidence, only filaments committed at `disclosureTier >= 1` are admissible. Private data cannot be compelled, discovered, or referenced. A party may voluntarily raise their disclosure tier to present evidence — this act is itself a permanent, append-only commit. The system rewards transparency for those who seek influence and protects privacy for those who choose solitude. Both positions are structurally valid.

**Contract #152 — Civic enforcement is structured work compensated through governed parameters.** Civic observation filaments (§61.3) require evidence references to achieve non-zero confidence — accusations without evidence are structurally invisible. Enforcement workers process observation filaments as compensated tasks with minimum wage set by municipal community governance (Category A parameter). Observer identity is always recorded on civic observation filaments — false accusations are traceable and create wilt on the observer's participation branch. Proximity correlation uses only publicly broadcast signals; non-Relay users and disabled presence are never processed (consistent with contract #40).

---

## 62. Universal Accessibility — The Tree for Every Body — Frozen Contract #154

> *"The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect."* — Tim Berners-Lee

**Prerequisites:** §33.5 (LOD rendering), §25 (2D/headless parity), §47 (voice input pipeline), §16 (SCV).

Relay is a 3D spatial system. A 3D spatial system that excludes blind, deaf, motor-impaired, or color-blind users is a broken tree. Accessibility is not a bolt-on compliance layer — it is a structural invariant. Every interaction in Relay must have a non-visual, non-auditory, and non-motor-intensive alternative path. The tree is the same for everyone. The rendering adapts to the body.

### 62.1 Accessibility Layers

Relay provides four parallel interaction layers. Every feature must function through at least two of them:

| Layer | Who It Serves | How It Works |
|-------|--------------|--------------|
| **Visual** (default) | Sighted users | 3D globe, branches, bark, filaments, cross-sections — the full spatial rendering |
| **Auditory** | Blind / low-vision users | Sonification of tree structure, spatial audio positioning, screen reader integration |
| **Tactile** | Motor-impaired / deafblind users | Keyboard navigation, switch access, braille display output, haptic device integration |
| **Simplified Visual** | Color-blind / cognitive accessibility | High-contrast modes, pattern-based encoding (replacing color), reduced-motion rendering |

### 62.2 Screen Reader & Semantic Tree

The 3D tree has a parallel **semantic tree** — a structured accessibility DOM that mirrors the spatial layout:

```
SemanticTreeNode {
  nodeId:           string (matches spatial node),
  label:            string (human-readable: "Company trunk, 47 branches, 12,000 filaments"),
  role:             enum { TREE, BRANCH, BARK_SURFACE, FILAMENT, CROSS_SECTION, TIMEBOX },
  depth:            number (nesting level from trunk),
  childCount:       number,
  stateDescription: string ("branch is healthy, leaning 12° toward supplier sector,
                             3 twigs, no scars, moderate heat"),
  confidence:       number (orgConfidence + globalConfidence summary),
  navigationHints:  string[] ("press Enter to zoom into branch", "press Tab to next sibling")
}
```

Screen readers traverse this semantic tree the same way they traverse HTML. The spatial position, health state, lean direction, and physics of every node are expressed as descriptive text. A blind user navigating a company tree hears: "Finance branch. Thick. Firm. Leaning slightly toward European suppliers. Two scars — one from Q2, one from last month. Three active twigs. Press Enter to inspect cross-section."

### 62.3 Sonification — Hearing the Tree

For users who opt into auditory mode, the tree produces sound:

| Tree Property | Sound Mapping |
|---------------|--------------|
| Branch thickness | Volume (thick = louder, thin = quieter) |
| Branch health | Tone (firm = clear tone, wilting = dampened/muffled) |
| Heat | Tempo (high heat = rapid pulse, cold = slow pulse) |
| Fog | Static/noise overlay (more fog = more static) |
| Storm | Low rumble, increasing intensity |
| Lightning | Sharp click/crack |
| Lean direction | Stereo panning (lean left = sound shifts left) |
| Depth in tree | Pitch (deeper = lower pitch, surface = higher pitch) |
| Filament lifecycle | Musical note sequence (OPEN = ascending, ABSORBED = descending, HOLD = sustained drone) |

**Spatial audio** places sounds at their 3D position relative to the user's navigation point. Moving through a tree is an auditory experience: healthy branches ring clearly, wilting branches muffle, storms rumble in the distance, and scars produce brief dissonant tones when passed.

Sonification parameters are Category A global parameters (§11.6). The community governs the sound design — which pitches, which timbres, which mappings — through the same voting model as all other system constants.

### 62.4 Motor-Impaired Access

All interactions that require mouse movement, click precision, or rapid input have keyboard and switch-access alternatives:

- **Full keyboard navigation**: Tab/Shift-Tab moves between branches and filaments. Arrow keys navigate within a branch (up/down = L-axis, left/right = θ rotation). Enter = zoom in. Backspace = zoom out. All camera controller keybinds (§50) have keyboard alternatives.
- **Switch scanning**: A single-switch or dual-switch scanning interface that cycles through navigation options at a configurable pace. The user activates when the desired option is highlighted.
- **Dwell control**: For users who can move a pointer but cannot click — hovering on an element for a configurable duration (default: 1.5s) triggers activation.
- **Voice control**: The full voice pipeline (§47) is the primary input for users who cannot use keyboard or mouse. Every interaction in Relay is voice-accessible through the Whisper → Architect → Canon pipeline.

### 62.5 Color-Blind and Reduced-Vision Modes

Relay's visual encoding relies heavily on color (heat = red/orange, fog = blue-gray, confidence = green/amber, wilt = brown, scar = red, projection = light blue/lavender). For color-blind users:

- **Pattern overlay mode**: Instead of color alone, each state adds a distinct pattern (heat = diagonal stripes, fog = dots, wilt = wavy lines, scar = crosshatch, projection = dashed outline). Patterns are perceivable regardless of color vision.
- **High-contrast mode**: Black background, white branches, with state encoded by brightness and pattern. No color information required.
- **Adjustable color palette**: Users can remap any color assignment. Protanopia, deuteranopia, and tritanopia presets are provided. Custom palettes are stored on the user tree as preference filaments.
- **Text label mode**: Every visual state can optionally display a text label instead of relying on visual encoding alone. "FIRM" / "WILTING" / "HOT" / "FOGGY" labels appear next to branches when enabled.
- **Reduced motion**: All animations (globe rotation, branch sway, sinking, helix twist) can be paused or reduced to stepped transitions. Motion-sensitive users see the same data as static snapshots with explicit state labels.

### 62.6 Accessibility as Template Configuration

Templates (§21) include an `accessibilityProfile` field:

```
AccessibilityProfile {
  requiredLayers:     enum[] { VISUAL, AUDITORY, TACTILE, SIMPLIFIED_VISUAL } (minimum: 2),
  sonificationMap:    SonificationConfig (overrides for domain-specific sound mappings),
  keyboardShortcuts:  KeybindMap (domain-specific keyboard shortcuts),
  screenReaderLabels: LabelOverrideMap (domain-specific terminology for semantic tree nodes),
  minimumContrastRatio: number (default: 4.5:1, WCAG AA),
  reducedMotionDefault: boolean (default: false, true for medical/accessibility templates)
}
```

A medical template might require auditory + visual layers and use medical terminology in screen reader labels. A gaming template might use spatial audio mappings tuned for combat feedback. The template system (§21) governs domain-specific accessibility the same way it governs domain-specific evidence rules.

### 62.7 Compliance Standards

Relay targets:

- **WCAG 2.2 AA** as the minimum for all public-facing interfaces (2D fallback, web client, headless mode per §25)
- **WCAG 2.2 AAA** for text alternatives, audio descriptions, and keyboard navigation
- **Section 508** compliance for government/institutional deployments
- **EN 301 549** for European accessibility requirements
- **Sonification follows ISO 7731** (auditory danger signals) for storm/lightning alerts

Accessibility compliance is tested through automated audits (Lighthouse, axe-core) run as part of the CI pipeline (§48.8). Accessibility regressions are treated as severity-1 bugs — they block deployment.

**Contract #154 — Every interaction in Relay must function through at least two of four accessibility layers (visual, auditory, tactile, simplified visual). The 3D tree has a parallel semantic tree for screen reader traversal. Sonification maps tree physics to sound. Motor-impaired access provides keyboard, switch, dwell, and voice alternatives for all interactions. Color-blind modes use pattern overlays and remappable palettes. Accessibility profiles are template-configurable. WCAG 2.2 AA is the minimum compliance target. Accessibility regressions block deployment.**

---

## 63. Child Safety & Parental Governance — Frozen Contract #155

> *"It is easier to build strong children than to repair broken men."* — Frederick Douglass

**Prerequisites:** §8.5 (disclosure tiers), §11.6 (global parameter registry), §38 (module discovery), §58 (education), §61 (privacy sovereignty).

Relay is designed for all ages. A system designed for all ages that does not structurally protect children is a system that will be shut down by regulators and abandoned by parents. Child safety is not a feature — it is a constitutional constraint.

### 63.1 Age Verification & Account Types

Relay has three account classes determined at registration:

| Account Class | Age | Governance |
|---------------|-----|------------|
| **Minor (Child)** | Under 13 | Requires parental consent. Parent/guardian account linked. Parent controls all privacy, interaction, and content settings. |
| **Minor (Teen)** | 13–17 | Parental consent at account creation. Graduated autonomy — parent retains override on privacy and interaction settings but teen manages their own tree. |
| **Adult** | 18+ | Full autonomy. No parental governance link required. |

Age verification uses external identity services (§49b real-world integration). Relay does not collect or store date of birth on-chain. The verification service returns an age bracket (`CHILD`, `TEEN`, `ADULT`) and Relay records only the bracket. The user's actual birthdate is never stored in Relay's systems.

### 63.2 Parental Governance Model

A parent/guardian account has a **governance branch** linked to the child's account:

```
ParentalGovernanceLink {
  parentUserId:     string,
  childUserId:      string,
  accountClass:     CHILD | TEEN,
  permissions: {
    interactionScope:     enum { NONE, FRIENDS_ONLY, COMMUNITY, OPEN },
    contentVisibility:    enum { RESTRICTED, MODERATE, FULL },
    proximityChannels:    boolean (can the child participate in proximity channels?),
    duelParticipation:    boolean (can the child enter duels?),
    voiceChat:            boolean (can the child use voice presence?),
    mediaAccess:          enum { NONE, EDUCATIONAL_ONLY, COMMUNITY_RATED, FULL },
    purchaseLimit:        number (max engagement credits per timebox),
    moduleDiscovery:      enum { GUIDED_ONLY, RESTRICTED, FULL },
    privacyFloor:         number (minimum disclosure tier — parent can prevent child
                                  from making data public below this tier)
  },
  auditLog:              boolean (parent can see activity summary — never filament contents),
  escalationContact:     string (who receives safety alerts)
}
```

**Parental visibility is structural, not content-level.** A parent can see: which branches the child visited, how much time was spent, interaction volume, safety flag count. A parent **cannot** see: filament contents, private notes, message text, voice transcripts. This preserves the child's developing privacy while giving the parent structural oversight. The parent sees the tree shape — not the words on the leaves.

### 63.3 Grooming Prevention

Relay's proximity and presence systems (§17, §29) create structural anti-grooming defenses:

- **Interaction pattern detection**: SCV monitors interaction patterns between adult and minor accounts. Asymmetric engagement (adult initiating repeated private contact with a minor) triggers automated safety flags on the child's governance branch.
- **No private channels between adults and unrelated minors**: Direct message branches between an adult account and a CHILD account require parental approval. TEEN accounts can receive direct messages from adults but the parent is notified of new adult contacts.
- **Session duration alerts**: Extended interaction sessions between an adult and a minor outside of designated educational or community contexts trigger escalation to the parental governance contact.
- **Community moderation**: Safety observation filaments (similar to civic enforcement, §61.3) can be raised by any community member who observes concerning interaction patterns. These route to child safety enforcement workers (§61.4 model).
- **Evidence chain**: All safety flags, pattern detections, and escalations are committed as filaments with full evidence chains. False flags are detectable and traceable (observer identity is always recorded).

### 63.4 Content Gating for Minors

Content on Relay carries **content classification metadata** (set by the publisher, verified by community):

```
ContentClassification {
  ageRating:          enum { ALL_AGES, TEEN_13, ADULT_18 },
  contentFlags:       enum[] { VIOLENCE, LANGUAGE, SEXUAL, GAMBLING, SUBSTANCE,
                               HORROR, COMMERCIAL },
  communityOverride:  boolean (community vote can reclassify if publisher misclassifies),
  verificationStatus: enum { SELF_DECLARED, COMMUNITY_VERIFIED, SCV_CLASSIFIED }
}
```

Minor accounts only see content matching their account class and parental permission settings. Content that has not been classified defaults to `ADULT_18` visibility — unclassified content is invisible to minors until classification is completed.

### 63.5 Legal Compliance Framework

| Regulation | Requirement | Relay Implementation |
|-----------|-------------|---------------------|
| **COPPA** (US, children under 13) | Verifiable parental consent, data minimization, deletion rights | Age bracket verification, parental governance link, no PII storage on-chain, cryptographic erasure (§65.1) |
| **KOSA** (US, minors under 17) | Duty of care, opt-out of algorithmic recommendations, parental tools | SCV recommendations are advisory only (never auto-switch, §58), parental governance branch, activity summary without content access |
| **EU DSA** (minors) | No profiling of minors for advertising, no dark patterns | Relay has no advertising system. No profiling. No dark patterns. Minor accounts have no engagement optimization applied. |
| **UK Age Appropriate Design Code** | Default high privacy for children, data minimization, geolocation restrictions | Minor accounts default to maximum privacy. No geolocation tracking beyond what the user explicitly shares via presence (§17). |

### 63.6 Graduated Autonomy

As a TEEN account holder approaches 18, parental governance controls progressively relax (configurable by the parent):

- **Age 13**: Parent controls all interaction and content settings
- **Age 14-15**: Parent retains override but teen manages their own tree structure, branch creation, and learning paths
- **Age 16-17**: Parent retains safety alerts and purchase limits; teen controls interaction scope and content visibility
- **Age 18**: Parental governance link is severed automatically. The teen's tree continues with all accumulated history, modules, certifications, and demonstrated competence. Nothing is lost.

The graduated timeline is configurable by the parent — a parent may grant full autonomy earlier or maintain tighter controls longer. The default timeline above is a Category A global parameter.

**Contract #155 — Minor accounts (CHILD under 13, TEEN 13-17) require age bracket verification and parental governance links. Parents see tree shape and activity structure but never filament contents. No private channels between adults and unrelated CHILD accounts without parental approval. Grooming prevention uses SCV pattern detection, session duration alerts, and community safety observation filaments. Content classification defaults to ADULT_18 for unclassified material — minors see only age-appropriate classified content. COPPA, KOSA, EU DSA, and UK Age Appropriate Design Code requirements are structurally satisfied. Graduated autonomy transfers control to the teen progressively, completing at age 18 with full tree continuity.**

---

## 64. Voice-Driven Development — Every User Is a Developer — Frozen Contract #156

> *"Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that it is stupid."* — attributed to Albert Einstein

**Prerequisites:** §16 (SCV), §47 (voice input pipeline), §19 (governance), §38 (module discovery), §58 (education).

There is no developer class in Relay. There is no separate SDK, no API portal, no third-party developer program. Every user, at every level of technical ability, is a developer within the scope of their responsibility. A banker who says "make this column sort by date" is developing. A gamer who says "change my spell animation to blue fire" is developing. A city manager who says "add a recycling tracking field to the waste management template" is developing. The voice is the IDE. The SCV is the compiler. The tree is the codebase.

### 64.1 The Voice-to-Ticket-to-Filament Pipeline

When a user speaks a change request, the following pipeline executes:

```
USER VOICE COMMAND
  "I want to add a due date field to my invoice template"
        |
        v
[Whisper] -> raw transcript (§47.2)
        |
        v
[Architect] -> structured intent (§47.3)
  IntentPacket {
    action: "template.modify",
    target: "template.invoice.personal",
    modification: { addField: "dueDate", type: "date", position: "after.amount" },
    scope: "user.personal" (within user's own tree — no governance required)
  }
        |
        v
[Canon] -> proposed tree operations (§47.4)
  ChangeTicket {
    ticketId:           "ticket.<uuid>",
    initiator:          userId,
    intentRef:          intentId,
    voiceTranscript:    "I want to add a due date field to my invoice template",
    scope:              PERSONAL | TEAM | ORGANIZATION | GLOBAL,
    proposedChanges: [
      { type: TEMPLATE_FIELD_ADD, target: templateRef, field: fieldSpec },
    ],
    status:             DRAFT,
    governanceRequired: boolean (true if scope > PERSONAL),
    estimatedComplexity: enum { TRIVIAL, MODERATE, COMPLEX, ARCHITECTURAL }
  }
        |
        v
[VISUAL PREVIEW] — Canon renders the proposed change as a lavender projection
  The user sees their invoice template with the new "due date" field
  appearing in the preview position. The change is visible but not committed.
        |
        v
[USER APPROVAL] — "Yes, do that" / "No, move it to the left" / "Cancel"
        |
        v
[COMMIT] — The change becomes a committed filament on the user's tree
  with full evidence chain: voice transcript, intent packet, change spec
```

### 64.2 Scope and Governance

The scope of a voice-driven change determines the governance path:

| Scope | Example | Governance |
|-------|---------|-----------|
| **Personal** | "Add a due date to MY invoice template" | No governance. User commits directly to their own tree. Instant. |
| **Team** | "Add a due date to our TEAM invoice template" | Team governance. The change is proposed to the team branch. Team members vote or delegate. (§19.1) |
| **Organization** | "Add a recycling field to the COMPANY waste template" | Organizational governance. Change proposal routes through the org's governance workflow. |
| **Global** | "The invoice template should require a currency field" | Community governance. Change becomes a proposal on the template's global branch. Community votes. (§19, §38) |

The user never needs to know which governance path applies. They speak. Architect parses scope from context ("my" = personal, "our" = team, "the company's" = org). Canon routes to the correct governance pipeline. If the scope is ambiguous, the SCV asks: "Did you mean for your personal template or for the team?"

### 64.3 Working with Architect and Canon — Iterative Development

For changes beyond TRIVIAL complexity, the user enters an **iterative development session** — a back-and-forth dialogue with the SCV where each refinement produces a new preview:

```
User:    "I want to redesign our department's project tracking."
SCV:     [Architect parses: COMPLEX scope=TEAM target=project_tracking]
         [Canon generates preview: current tree shape vs. proposed restructure]

         "Here's what I understand. You want to restructure the project
          tracking branch. I see three sub-branches: active, completed, archived.
          Currently they're flat. Would you like them as nested sub-trees
          with status-based routing?"

User:    "Yes, but add a fourth branch for blocked items."

SCV:     [Canon updates preview: four sub-branches now visible in lavender]
         "Added. Blocked items branch — should blocked filaments automatically
          route here when status changes to HOLD, or should it be manual?"

User:    "Automatic. And add a notification when something's been blocked
          for more than a week."

SCV:     [Canon updates: routing rule + scheduled notification trigger visible]
         "Done. Here's the complete change. Four branches, automatic HOLD routing,
          7-day block notification. This affects 23 existing project filaments
          that would be reclassified. Want me to show the migration preview?"

User:    "Show me."
SCV:     [Canon renders migration: each affected filament shown moving to its
          new branch position, with before/after comparison]

User:    "Looks good. Submit it."
SCV:     [Change ticket submitted to team governance with full evidence chain:
          voice transcripts of entire session, all intermediate previews,
          migration analysis, affected filament list]
```

The entire development session is a committed evidence chain on the user's tree. Every voice command, every SCV response, every preview iteration is preserved. Anyone reviewing the change proposal can replay the entire design conversation.

### 64.4 Filament-Level Modification

For users who want deeper control, the SCV supports **filament-level development** — modifying individual fields, evidence chains, routing rules, and template logic through voice or direct manipulation:

- **Field-level edits**: "Change the amount on invoice #4521 from 500 to 550" — Canon proposes a filament amendment with evidence (voice command + original value + new value + reason)
- **Rule creation**: "Whenever a filament on this branch exceeds $10,000, flag it for review" — Canon creates a policy filament (§19.1) with the threshold rule
- **Template modification**: "Add a dropdown field called 'priority' with values high, medium, low to this branch template" — Canon modifies the template schema and shows the preview
- **Batch operations**: "Move all filaments older than 6 months from the active branch to the archive branch" — Canon previews the batch migration with affected filament count
- **Projection creation**: "Show me a projection of revenue for Q3 based on current growth" — Canon builds a projection branch (§6) using historical data

Every modification follows the same pipeline: voice -> Architect -> Canon -> preview -> human approval -> commit. No modification bypasses human approval. No modification is invisible. The tree records everything.

### 64.5 No Developer Class

This is the critical point: **there is no boundary between "users" and "developers" in Relay.**

A grandmother who says "make the text bigger on my health branch" is using the same pipeline as an engineer who says "refactor the accounting template's evidence chain validation to include SHA-256 hash verification." The difference is complexity and scope — not access level.

Module discovery (§38) governs what a user can modify: you must demonstrate competence before modifying a complex template. But the voice pipeline is always available. A user who hasn't demonstrated template engineering competence can still request changes — the SCV will explain what's possible within their current skill level and suggest learning paths (§58) for capabilities they haven't unlocked yet.

The education system (§58) is the growth path. Certification (§58.12) unlocks professional-scope modifications. But the development tool — the voice — is universal from day one.

### 64.6 How This Connects to Existing Architecture

**§16 (SCV):** The voice-driven development session is an extended SCV interaction. The SCV's Architect parses, Canon plans, and the human approves. Contract #12 (SCVs do not execute) holds absolutely — every change requires human approval.

**§47 (Voice Pipeline):** §64 extends the voice pipeline from single commands to iterative design sessions. The pipeline is the same (Whisper -> Architect -> Canon -> Human), but the interaction may span multiple exchanges before a commit is produced.

**§19 (Governance):** All scope-based routing follows existing governance. Personal changes are instant. Team/org/global changes follow the governance pipeline. Voice-driven development does not bypass any governance constraint.

**§38 (Module Discovery):** The user's demonstrated modules determine what they can modify. Voice commands that target capabilities beyond the user's demonstrated competence are flagged by Canon as OUT_OF_SCOPE with a learning suggestion.

**§16.6 (AI Code Governance):** If the voice-driven change involves code (template logic, routing rules, validation functions), the AICodeContributionPacket (§16.6) is generated for the Canon-produced code. The same quality gates apply.

**Contract #156 — Every user is a developer within the scope of their demonstrated competence. Voice commands initiate change tickets through the Whisper -> Architect -> Canon -> Human pipeline. Change scope (personal, team, organization, global) determines governance routing — the user never needs to know which path applies. Iterative development sessions allow multi-exchange design conversations between user and SCV, with each iteration producing a visible preview. The entire development session is committed as an evidence chain. Filament-level modification is available for all field types, rules, templates, batch operations, and projections. There is no developer class, no SDK, no API portal — the voice is the IDE, the SCV is the compiler, the tree is the codebase. Module discovery (§38) governs modification scope. AI code governance (§16.6) applies to all code-generating changes.**

---

## 65. Platform Compliance & Content Safety — Frozen Contract #157

> *"With great power comes great responsibility."* — Uncle Ben, Spider-Man (originally Voltaire)

**Prerequisites:** §20 (cryptographic architecture), §48.4.3 (replay compression), §61 (privacy sovereignty), §63 (child safety).

Relay operates within the legal reality of multiple jurisdictions simultaneously. This section addresses the three hardest compliance challenges for a platform with an append-only Merkle chain architecture: the right to erasure (GDPR Article 17), mandatory content removal (EU DSA, CSAM laws), and intermediary liability (Section 230, EU DSA).

### 65.1 Cryptographic Erasure — GDPR Right to Erasure

Relay's append-only Merkle chain (§20) means data is never physically deleted. Every commit is permanent. This appears to conflict with GDPR Article 17 ("right to be forgotten"). The resolution is **cryptographic erasure** — making data permanently unreadable without physically removing the Merkle chain entry.

**The mechanism:**

```
CryptographicErasureEvent {
  targetFilamentId:    string,
  requesterId:         userId (the data subject, or authorized legal representative),
  legalBasis:          enum { GDPR_ART17, COPPA_DELETION, COURT_ORDER, USER_REQUEST },
  erasureMethod:       CONTENT_KEY_DESTRUCTION,
  merkleEntryStatus:   TOMBSTONE (hash preserved, content permanently unreadable),
  evidenceChain: {
    requestTimestamp:   ISO-8601,
    verificationMethod: enum { IDENTITY_VERIFIED, LEGAL_ORDER_VERIFIED },
    processingTime:     ISO-8601 (must be < 30 days per GDPR)
  }
}
```

**How it works:**

1. Every filament's content is encrypted with a unique **content encryption key (CEK)** at creation time
2. The CEK is stored separately from the filament content (Key Management System, §71.6)
3. When cryptographic erasure is invoked, the CEK is permanently destroyed
4. The Merkle chain entry remains (hash preserved for chain integrity) but the content is now permanently unreadable — it is a **tombstone**
5. The tombstone is visible in cross-section as a special state: a gray, inert mark showing that something existed here but has been erased. The tree shape accounts for the tombstone's mass (it occupied space) but the content is gone.

**What cannot be erased:**

- Aggregate metrics that do not contain personal data (branch thickness, timebox summaries)
- Hashes of the erased content (the Merkle chain needs them for integrity)
- The fact that an erasure occurred (the tombstone itself is a committed event)
- Data that other users independently committed (if Alice and Bob both committed the same fact, erasing Alice's filament does not erase Bob's — they are independent commits)

**Processing requirements:**

- Erasure requests must be processed within 30 days (GDPR) or 48 hours (COPPA for children's data)
- The system maintains an erasure audit log (itself append-only) recording every erasure event, its legal basis, and processing timestamp
- Multi-jurisdiction conflicts (e.g., a legal hold preventing erasure in one jurisdiction while another requires it) are resolved through the sortition case resolution system (§46) with legal counsel evidence

### 65.2 Mandatory Content Removal — CSAM, Terrorism, Illegal Content

Certain categories of content are illegal to host, transmit, or display under virtually all jurisdictions:

- **CSAM (Child Sexual Abuse Material)**: Mandatory detection and removal under US law (18 USC §2258A), EU DSA, UK Online Safety Act
- **Terrorism content**: EU Terrorism Content Regulation requires removal within 1 hour of notification
- **Court-ordered removal**: Specific content identified by court order for removal

**Relay's approach:**

1. **On-device classification**: Content uploaded to Relay is classified on-device before reaching the network (consistent with contract #49 — detection mesh local-first). Known CSAM hashes (PhotoDNA, NCMEC database) are checked locally. Content matching known hashes is blocked from upload with mandatory reporting to NCMEC.

2. **Network-level scanning**: Content that reaches the network is scanned against hash databases and ML classifiers as a second layer. Matched content triggers immediate cryptographic erasure (§65.1) plus mandatory reporting to the relevant authority.

3. **Community flagging**: Any user can raise a content safety observation filament (similar to civic enforcement, §61.3) flagging content as potentially illegal. Flagged content enters a review queue processed by designated content safety workers (§61.4 model). Confirmed illegal content is cryptographically erased.

4. **Terrorism content**: Content flagged as terrorism-related enters an expedited pipeline with a 1-hour processing target. Relay maintains a designated point of contact for each jurisdiction's competent authority (EU DSA Article 12).

5. **Mandatory reporting**: All CSAM detections are reported to NCMEC (US), IWF (UK), or the relevant national authority. Reporting is automated and cannot be disabled.

### 65.3 Intermediary Liability

Relay's position under intermediary liability frameworks:

| Framework | Relay's Status | Implications |
|-----------|---------------|--------------|
| **US Section 230** | Interactive computer service; good faith moderation | Protected from liability for user-generated content; must act on CSAM reporting obligations |
| **EU DSA** | Very Large Online Platform (if >45M EU users) | Transparency reports, designated compliance officer, systemic risk assessment, crisis response protocols |
| **UK Online Safety Act** | Category 1 service (if large scale) | Safety duties for illegal content and content harmful to children |

Relay's structural advantages for compliance:

- **Append-only audit trail**: Every piece of content has a verifiable creation timestamp, author attribution, and evidence chain. Takedown compliance is provable.
- **Cryptographic erasure**: Content removal is permanent and verifiable while preserving Merkle chain integrity.
- **Automated detection**: On-device + network-level scanning provides dual-layer protection before content reaches other users.
- **Community enforcement**: The civic enforcement model (§61) provides a scalable human review layer for content that automated systems cannot classify.

### 65.4 Transparency & Reporting

Relay publishes, as a governed branch on the platform tree:

- **Transparency report** (quarterly): content removal volumes, erasure requests processed, legal orders received, CSAM reports filed, false positive rates
- **Systemic risk assessment** (annual, EU DSA Article 34): identified risks to fundamental rights, public safety, and democratic processes, with mitigation measures
- **Algorithmic transparency**: Relay has no recommendation algorithm to disclose — search results are ranked by tree physics (confidence, lifecycle, engagement). The ranking formula is public and deterministic (§24).

All transparency data is a public branch on the platform tree. Anyone can inspect it. The tree IS the transparency report.

**Contract #157 — Cryptographic erasure is the mechanism for GDPR right to erasure, COPPA deletion, and court-ordered removal. Content encryption keys are destroyed; Merkle chain entries become tombstones (hash preserved, content permanently unreadable). Processing completes within 30 days (GDPR) or 48 hours (COPPA). CSAM detection uses dual-layer scanning (on-device hash matching + network ML classifier) with mandatory automated reporting to NCMEC/IWF. Terrorism content enters a 1-hour expedited pipeline. All removals are append-only auditable events. Transparency reports are published as public branches on the platform tree.**

---

## 66. Microsharding & Decentralized Storage Economy — Frozen Contracts #158–159

> *"Knowledge is of two kinds. We know a subject ourselves, or we know where we can find information upon it."* — Samuel Johnson

**Prerequisites:** §20 (cryptographic architecture), §48 (engineering infrastructure), §31 (accounting packets), §11.6 (global parameter registry), §61 (privacy sovereignty).

Relay does not store all data on central servers. Relay distributes data across the network using **microsharding** — splitting encrypted data into small redundant fragments spread across multiple nodes. Users can sell their spare storage capacity and earn from it. The storage economy is decentralized, governed by community pricing, and structurally aligned with Relay's physics: every shard is a traceable, accountable unit.

### 66.1 Microsharding Architecture

Every piece of data in Relay — filament content, media files, evidence attachments, template definitions — can be microsharded for distributed storage:

**The sharding pipeline:**

```
Original Data (e.g., a video file, a document, an evidence attachment)
        |
        v
[Client-Side Encryption]
  AES-256-GCM encryption (military-grade encryption standard) with HKDF key derivation
  The content encryption key (CEK — the secret key that locks/unlocks your data) is managed by the Key Management System (§71.6)
  Raw data NEVER leaves the device unencrypted (consistent with §61, contract #150)
        |
        v
[Reed-Solomon Erasure Coding]
  Encrypted data is split into N data shards + M parity shards
  Default: 4 data shards + 2 parity shards (tolerates loss of any 2 shards)
  Shard size: 4KB (configurable per template)
        |
        v
[Shamir's Secret Sharing for CEK]
  The content encryption key itself is split into K-of-N threshold shares
  Reconstructing the key requires K shares (e.g., 3-of-5)
  Key shares are distributed to different nodes than data shards
        |
        v
[Distributed Placement]
  Shards are placed across multiple nodes using three strategies:
  - Proximity-based (40%): shards near the user for fast retrieval
  - Regional-based (30%): shards in the user's geographic region for redundancy
  - Hash-based (30%): deterministic placement by content hash for deduplication
        |
        v
[Shard Metadata Committed as Filament]
  ShardManifest {
    contentHash:        SHA-256 of original encrypted data,
    shardCount:         number (data + parity),
    threshold:          number (minimum shards for reconstruction),
    shardLocations:     ShardLocationRef[] (node IDs, NOT content),
    keyShareLocations:  KeyShareRef[] (separate from data shards),
    replicationFactor:  number (copies per shard, default: 3),
    placementStrategy:  { proximity: 0.4, regional: 0.3, hash: 0.3 }
  }
```

### 66.2 The Storage Marketplace

Any Relay user can become a **storage provider** — selling spare disk space to the network. Any user can be a **storage consumer** — purchasing distributed storage for their data.

**Provider registration:**

```
StorageProviderProfile {
  providerId:        userId,
  availableCapacity: number (GB),
  pricing:           number (engagement credits per GB per timebox),
  uptimeHistory:     number (rolling 30-day uptime percentage),
  reputationScore:   number (computed from proof-of-storage challenges),
  geographicRegion:  string (for placement strategy matching),
  hardwareClass:     enum { CONSUMER, PROSUMER, DATACENTER },
  maxShardsPerItem:  number (maximum shards stored per unique content item)
}
```

**Three storage tiers (community-governed pricing):**

| Tier | Data Shards | Parity Shards | Key Threshold | Price Multiplier | Use Case |
|------|-------------|---------------|---------------|-----------------|----------|
| **Basic** | 3 | 1 | 2-of-3 | 1.0x | Personal files, non-critical data |
| **Secure** | 5 | 2 | 3-of-5 | 1.6x | Business documents, financial records |
| **Vault** | 8 | 3 | 5-of-8 | 2.5x | Legal evidence, medical records, archival |

Tier pricing multipliers are Category A global parameters (§11.6). The community governs storage pricing through the same democratic model as all other system constants.

### 66.3 Proof of Storage — Trust Verification

Storage providers must prove they actually hold the shards they claim to hold. Relay uses a **challenge-response proof-of-storage protocol:**

```
ProofOfStorageChallenge {
  challengeId:       string,
  targetShardId:     string,
  challengeType:     enum { RANDOM_BYTE_RANGE, MERKLE_SUBTREE, FULL_HASH },
  challengeData:     bytes (random seed for the challenge),
  responseDeadline:  ISO-8601 (default: 30 seconds),
  challengeInterval: number (default: every 5 minutes for hot shards,
                              every 1 hour for warm, every 24 hours for cold)
}
```

- Providers that consistently pass challenges maintain or improve their reputation score
- Failed challenges trigger automatic shard re-replication to healthy nodes
- Providers with uptime below 95% are flagged; below 85% triggers automatic shard migration away
- A pattern of failed challenges creates wilt on the provider's storage branch — visible to anyone evaluating storage providers

### 66.4 Sentinel Vault Storage

For vault-tier data, Relay supports **sentinel nodes** — high-reputation storage providers who hold emergency backup shards. (Note: "sentinel nodes" are storage machines. "Guardian contacts" (§48.2.2, §71.6) are trusted humans who hold Shamir key shares for account recovery. These are different systems.)

- Sentinel selection requires: reputation score > 0.8, uptime > 95%, latency < 200ms, geographic distribution (no two sentinels in the same data center)
- Minimum 3 sentinels per vault item with 2x replication
- Sentinels earn a premium compensation rate (Category A parameter)
- Sentinel failure triggers immediate replacement from the sentinel pool with zero-downtime failover

### 66.5 Storage Economy — Users Earn by Hosting

**The economic model:**

1. **Storage providers earn engagement credits** for hosting shards. Payment is per-timebox (consistent with §31 accounting packets). TransferPackets flow from the content owner's tree to the provider's tree for each timebox the shard is stored and verified.

2. **Pricing is governed democratically**. Storage pricing proposals follow the same governance model as all other Category A parameters. The community proposes price tiers; the highest-ranked proposal becomes active pricing. Constraints: max 50% price change per proposal, 24-hour cooldown between proposals, 7-day proposal lifetime.

3. **Relay fallback**: When P2P storage availability drops below a governed threshold (default: 70%), Relay infrastructure absorbs the overflow. Relay-hosted shards cost 1.5x the P2P rate (Category A parameter). This ensures data availability while incentivizing P2P participation.

4. **Passive income**: A user with spare disk space can register as a provider, configure their capacity and pricing, and earn credits while their device participates in the storage network. No technical knowledge required — the provider onboarding is a module (§38) taught in the tutorial (§58.1).

5. **Data gravity incentive**: The system structurally incentivizes efficient storage. Because every shard costs credits, users and organizations are motivated to archive, compress, and manage data lifecycle (§14, §1.3 heartwood). The storage economy makes data obesity expensive and data discipline profitable.

### 66.6 Hybrid P2P + Relay Infrastructure

The storage network is not purely P2P. It is a hybrid:

- **P2P layer**: User devices contribute storage capacity. Shards are distributed across the network. Most data lives here.
- **Relay infrastructure layer**: Relay-operated nodes serve as fallback when P2P capacity is insufficient, when data requires guaranteed SLA (medical, legal, government), or when a user's device is offline.
- **Transition**: As the P2P network grows, the Relay infrastructure layer shrinks. The system is designed to be increasingly decentralized over time. The ratio is a visible metric on the platform tree.

### 66.7 Offline-First & Low-Bandwidth Architecture

Microsharding enables a robust offline-first model. Users in low-bandwidth or intermittent-connectivity environments can operate Relay with full functionality for their local working set (network-dependent features degrade proportionally to bandwidth — see table below):

**Local shard cache:**

Every user device maintains a local shard cache containing the shards needed for their active working set. The cache operates independently of network connectivity:

```
LocalShardCache {
  cacheCapacity:       number (GB, configurable by user),
  priorityPolicy:      enum { RECENCY, FREQUENCY, MANUAL },
  offlineCommitQueue:  CommitRef[] (commits made while offline, synced when connected),
  syncStrategy:        enum { IMMEDIATE, BATCHED, SCHEDULED },
  conflictResolution:  enum { LATEST_DISPLAY, MERGE, MANUAL_REVIEW }
}
```

- **Offline commits**: Users can create, modify, and commit filaments while offline. Commits enter the `offlineCommitQueue` with local timestamps. Offline commits have local-device-only durability until sync — if the device is destroyed before connectivity is restored, those commits are lost.
- **Background sync**: When connectivity is restored, the queue syncs in chronological order. Merkle chain integrity is verified during sync. Both commits are ALWAYS preserved (append-only, Contract #1). The configured strategy determines display preference: `LATEST_DISPLAY` shows the most recent as default view, `MERGE` presents both inline, `MANUAL_REVIEW` flags for human decision. No commit is ever overwritten or discarded. (See §71.4.)
- **Progressive shard retrieval**: When navigating a tree that is not fully cached, the system retrieves shards progressively — starting with aggregate data (branch thickness, timebox summaries) and fetching detail on demand. Low-bandwidth users see the tree shape first, then content loads as shards arrive.
- **Compression**: All shard transfers use the compression pipeline (§48.4.3). Delta sync transfers only changed shards, not entire files.

**Low-bandwidth operation modes:**

| Mode | Bandwidth | What Works | What Degrades |
|------|-----------|-----------|---------------|
| **Full** | > 10 Mbps | Everything | Nothing |
| **Standard** | 1-10 Mbps | All features, media streams at reduced quality | Video presence delayed, large media downloads queued |
| **Low** | 100 Kbps - 1 Mbps | All text, commits, governance, voice (compressed) | Media cached not streamed, 3D rendering simplified |
| **Minimal** | < 100 Kbps | Text commits, offline queue sync, essential governance | No media, no 3D, 2D headless mode (§25) only |
| **Offline** | 0 | Local cache, offline commits, queued sync | No network features until connectivity restored |

### 66.8 How This Connects to Existing Architecture

**§20 (Cryptographic Architecture):** Microsharding extends the cryptographic layer. Client-side encryption uses the same Key Management System (§71.6). Merkle chain integrity is preserved — shard manifests are committed as filaments with full evidence chains.

**§48.4.3 (Replay Compression):** Sharded data participates in the same compression lifecycle. Hot shards (frequently accessed) have more replicas and faster proof-of-storage intervals. Cold shards (archived) compress to fewer replicas with longer intervals. Heartwood data (§1.3) may reduce to minimum viable shard count.

**§31 (Accounting Packets):** Storage payments use TransferPackets. Every credit flow from consumer to provider is a committed, traceable accounting event. The storage economy is fully auditable through the same accounting infrastructure as all other Relay transactions.

**§61 (Privacy Sovereignty):** Client-side encryption ensures storage providers never see content. They hold encrypted shards. Even if a provider is compromised, the data is unreadable without the CEK (which is itself Shamir-shared across different nodes). Contract #150 (private data uninspectable) holds at the storage layer.

**§59 (Media Circulation):** Large media files (video, audio) are the primary consumers of distributed storage. Single-instance circulation (contract #143) means fewer copies need storage. The storage economy and the media economy are structurally aligned: fewer copies = less storage cost = incentive for efficient circulation.

**§65 (Cryptographic Erasure):** When a filament is cryptographically erased (§65.1), the CEK is destroyed. The encrypted shards across the network become permanently unreadable tombstone fragments. No individual shard provider needs to take action — the data is already encrypted, and without the key it is noise.

**Contract #158 — All user data is client-side encrypted (AES-256-GCM) before leaving the device. Encrypted data is split into microshards using Reed-Solomon erasure coding and distributed across multiple nodes. Content encryption keys are split using Shamir's Secret Sharing with K-of-N threshold reconstruction. Key shares are stored on different nodes than data shards. Shard manifests are committed as filaments with full evidence chains. Storage providers never see unencrypted content. Proof-of-storage challenges verify shard integrity at configurable intervals. Failed challenges trigger automatic re-replication. Provider reputation is computed from challenge pass rates and uptime history.**

**Contract #159 — The storage marketplace is a decentralized economy where users sell spare capacity and purchase distributed storage. Three tiers (basic, secure, vault) with community-governed pricing (Category A parameters). Relay infrastructure provides fallback when P2P availability drops below threshold. Storage payments use TransferPackets — fully auditable through existing accounting infrastructure. The offline-first architecture enables full functionality without network connectivity through local shard caches, offline commit queues, and progressive shard retrieval. Low-bandwidth operation degrades gracefully across five modes from full to offline.**

---

## 67. Automated Business Continuity & Disaster Recovery — Frozen Contract #160

> *"By failing to prepare, you are preparing to fail."* — Benjamin Franklin

**Prerequisites:** §19 (governance), §11.6 (global parameter registry), §48 (engineering infrastructure), §66 (microsharding), §52 (business artifact mapping), §13 (stigmergic coordination).

Business Continuity Planning (BCP) and Disaster Recovery Planning (DRP) are not documents that sit in a binder. In Relay, they are **automated actions that trigger when the tree itself shows distress.** A company's tree visibly deteriorates under failure conditions — branches wilt, heat spikes, fog accumulates, storms form. BCP/DRP in Relay means configuring automated responses that fire when these tree signals cross thresholds. The tree does not just show the disaster. The tree responds to it.

### 67.1 Flag-Based Trigger Model

Companies configure **continuity triggers** — threshold conditions on their organizational tree that, when met, automatically initiate predefined response actions:

```
ContinuityTrigger {
  triggerId:          string,
  name:               string (e.g., "Supply Chain Disruption Response"),
  monitoredBranch:    branchRef (which branch to watch),
  conditions: [
    {
      metric:         enum { WILT_PERCENTAGE, HEAT_INDEX, FOG_DENSITY,
                             STORM_INTENSITY, SCAR_COUNT, TWIG_COUNT,
                             CONFIDENCE_FLOOR, FILAMENT_VELOCITY,
                             OFFLINE_NODE_COUNT, SHARD_AVAILABILITY },
      operator:       enum { GT, LT, GTE, LTE, EQ, DELTA_GT, DELTA_LT },
      threshold:      number,
      timeWindow:     duration (evaluate over this period),
      consecutiveTimeboxes: number (must persist for N timeboxes to trigger)
    }
  ],
  conditionLogic:     enum { ALL, ANY, WEIGHTED_SCORE },
  weightedThreshold:  number | null (for WEIGHTED_SCORE: trigger when combined score exceeds),
  severity:           enum { ADVISORY, WARNING, CRITICAL, EMERGENCY },
  cooldownPeriod:     duration (minimum time between re-triggers),
  responseActions:    ResponseAction[] (what happens when triggered)
}
```

**The key insight:** These triggers use the same tree physics that already exist. Wilt, heat, fog, storm, scars, twigs — these are not abstract metrics. They are the visible state of the branch. A supply chain branch that is wilting heavily, accumulating scars, and showing high fog is a supply chain in distress. The trigger simply formalizes: "when distress reaches this level, do these things automatically."

### 67.2 Automated Response Actions

When a trigger fires, it initiates one or more **response actions** — predefined operations that execute through existing Relay mechanisms:

```
ResponseAction {
  actionId:           string,
  type:               enum {
    NOTIFY,                    -- Send alerts to designated contacts
    ESCALATE,                  -- Route to governance for emergency review
    ACTIVATE_BACKUP_BRANCH,    -- Bring standby branch online
    REROUTE_FILAMENTS,         -- Redirect incoming filaments to backup branch
    FREEZE_BRANCH,             -- Prevent new commits (read-only until resolved)
    SNAPSHOT_STATE,            -- Create emergency checkpoint of current state
    INCREASE_REPLICATION,      -- Boost shard replication factor for critical data
    ACTIVATE_GUARDIAN_VAULTS,  -- Promote critical shards to vault-tier storage
    PUBLISH_STATUS,            -- Commit status filament to public/stakeholder branch
    TRIGGER_CHILD_PLANS        -- Cascade to sub-tree continuity plans
  },
  parameters:         object (type-specific configuration),
  executionOrder:     number (sequential execution within the response),
  requiresApproval:   boolean (if true, action queues for human approval before executing),
  approvalDelegate:   userId | roleRef (who can approve)
}
```

**Examples of configured BCP/DRP plans:**

| Scenario | Trigger Conditions | Automated Response |
|----------|-------------------|-------------------|
| **Supplier failure** | Supply chain branch: wilt > 40%, scars > 3 in 7 days, fog > 60% | NOTIFY procurement team, ACTIVATE_BACKUP_BRANCH (alternate supplier branch), REROUTE_FILAMENTS from failed supplier to backup, PUBLISH_STATUS to stakeholder branch |
| **Data center outage** | Infrastructure branch: offline_node_count > 30%, shard_availability < 85% | INCREASE_REPLICATION to 5x, ACTIVATE_GUARDIAN_VAULTS for all vault-tier data, SNAPSHOT_STATE for recovery point, NOTIFY IT operations |
| **Financial irregularity** | Accounting branch: scar_count delta > 5 in 24h, confidence_floor < 0.3 | FREEZE_BRANCH (prevent further commits), ESCALATE to finance governance, SNAPSHOT_STATE for audit, NOTIFY compliance officer |
| **Production line halt** | Manufacturing branch: filament_velocity drops to 0 for > 2 timeboxes, heat drops to 0 | NOTIFY plant manager, ACTIVATE_BACKUP_BRANCH (secondary production line), PUBLISH_STATUS to customer-facing branch, TRIGGER_CHILD_PLANS for dependent processes |
| **Pandemic / remote work** | Office presence branch: proximity channel activity drops > 80% within 7 days | ACTIVATE_BACKUP_BRANCH (remote operations branch), REROUTE_FILAMENTS from office workflows to remote workflows, PUBLISH_STATUS company-wide |

### 67.3 Cascading Plans — Sub-Tree Continuity

Large organizations have interconnected continuity requirements. A supply chain failure cascades to production, which cascades to delivery, which cascades to customer service. The `TRIGGER_CHILD_PLANS` action enables **cascading continuity responses**:

```
CascadePlan {
  parentTriggerId:   string,
  childTriggers:     ContinuityTrigger[] (sub-tree plans activated by parent),
  cascadeDelay:      duration (wait before cascading — allows parent resolution first),
  cascadeCondition:  enum { ALWAYS, IF_UNRESOLVED, IF_ESCALATED }
}
```

The cascade follows the tree structure. A trigger on the supply chain branch can cascade to production sub-branches, which can cascade to delivery sub-branches. Each level has its own configured response. The tree shape shows the cascade in real time: wilt propagating down branches, backup branches activating (visible as new green growth), rerouted filaments changing direction.

### 67.4 Recovery and Stand-Down

When the triggering condition resolves (the metrics return below threshold), the system enters **recovery mode**:

1. **Automated stand-down**: If configured, backup branches deactivate and filament routing returns to primary. This is reversible — the backup remains warm (not deleted) for a configurable retention period.
2. **Recovery verification**: The SCV analyzes the recovery and generates a **post-incident report** — a projection branch showing: timeline of the incident, trigger conditions met, actions taken, duration, data integrity verification, and lessons learned.
3. **Post-incident review**: The report is routed to the governance body for review. Improvements to the continuity plan are proposed as governance commits.

### 67.5 Relay Platform Disaster Recovery

Beyond organizational BCP/DRP, Relay itself has platform-level disaster recovery built on the microsharding architecture (§66):

**Recovery Point Objective (RPO):** Zero data loss for network-committed data (see §71.19). Once a filament is committed and synced to the distributed network, it exists on multiple nodes. No single point of failure can destroy committed data. Offline commits that have not yet synced have local-device-only durability.

**Recovery Time Objective (RTO):**

| Component | RTO Target | Mechanism |
|-----------|-----------|-----------|
| User data access | < 30 seconds | Shard re-routing to healthy nodes, local cache fallback |
| Governance operations | < 5 minutes | Governance state replicated across federation nodes |
| Full platform restore | < 1 hour | Merkle chain replay from distributed checkpoints |
| Media streaming | < 2 minutes | CDN fallback + shard re-routing |

**Automated failover:**

- Node failure: Proof-of-storage challenges detect within 5 minutes. Automatic shard re-replication begins immediately.
- Regional outage: Geographic distribution (§66.1 placement strategy) ensures shards survive regional failures. Cross-region shard retrieval activates automatically.
- Merkle chain corruption: Checkpoint compaction (§48.4.3 layer 4) provides recovery points. Chain replay from the last valid checkpoint restores integrity.

### 67.6 How This Connects to Existing Architecture

**§3.19 (Universal Physics):** BCP/DRP triggers use the same ten force equations that govern all tree physics. Wilt, heat, fog, storm — these are computed values, not separate monitoring metrics. The trigger system reads what the tree already knows.

**§13 (Stigmergic Coordination):** Backup branch activation and filament rerouting follow the same stigmergic principles — the tree shape changes, and workers see the change and respond. The automated response modifies the tree; humans respond to the modified tree.

**§19 (Governance):** Response actions that require approval follow existing governance. Emergency actions can be configured to require human approval or to execute immediately with post-hoc review. The governance commit records which actions fired and why.

**§52 (Business Artifact Mapping):** The continuity triggers map to existing business artifact measurements. A supply chain branch's wilt percentage IS the supply chain health metric. No separate monitoring system is needed — the dashboard IS the tree.

**§66 (Microsharding):** Platform-level DR uses the distributed shard architecture. Data survives because it is distributed. Recovery is shard re-routing, not backup restoration.

**Contract #160 — Business Continuity and Disaster Recovery in Relay are automated actions triggered by tree physics thresholds. Companies configure continuity triggers on their branches using existing metrics (wilt, heat, fog, storm, scars, twigs, confidence, filament velocity, shard availability). When thresholds are met, predefined response actions execute automatically: notifications, branch activation, filament rerouting, branch freezing, state snapshots, replication increases, sentinel vault activation, status publishing, and cascading to sub-tree plans. Recovery is automated with post-incident reporting. Platform-level DR achieves zero RPO through distributed microsharding and sub-hour RTO through Merkle chain checkpoint replay. The tree does not just show the disaster — the tree responds to it.**

---

## 68. Arena Branches — Bounded Volatility & Crowd-Driven Randomness — Frozen Contracts #161–162

> *"Well yeah, and I'm sad, but at the same time I'm really happy that something could make me feel that sad. It's like, it makes me feel alive, you know? It makes me feel human. And the only way I could feel this sad now is if I felt somethin' really good before. So I have to take the sad with the happy."* — Butters Stotch, South Park

**Prerequisites:** §40 (game layer), §41 (multi-resource economy), §42 (duels), §43 (spell taxonomy), §46 (sortition), §16 (SCV), §47 (voice pipeline), §58.12 (certification).

In StarCraft, the most compelling experience was never the strategy alone. It was the social tension produced by information asymmetry, hidden knowledge, alliance ambiguity, and the sudden revelation that reality was not what other players thought it was. That energy — the meta-game of playing the players, not just the game — is what Arena Branches capture inside Relay's physics. But the critical difference is this: in StarCraft, that tension came from secretly breaking rules. In Relay, it comes from mastering them so deeply that your opponents cannot keep up. And the crowd makes every match unrepeatable.

### 68.1 What an Arena Branch Is

An Arena Branch is a **scoped branch with temporary parameter overrides** applied only inside that branch namespace. It is a self-contained tournament environment that sits on top of the truth layer without ever modifying it.

```
ArenaBranch {
  arenaId:            string,
  parentBranchRef:    branchRef (the tree hosting this arena),
  startBlock:         commitId,
  endBlock:           commitId | null (null = still active),
  rulesetHash:        SHA-256 (immutable once match starts),
  coeffSetId:         string (volatility configuration),
  resourceBudget:     ArenaResourceBudget,
  volatilityTier:     enum { CALM, STANDARD, CHAOTIC, EXTREME },
  sortitionConfig:    SortitionConfig (jury mechanics if applicable),
  crowdTerrainConfig: CrowdTerrainConfig (what the crowd can vote on),
  matchType:          enum { DUEL, COURT_CASE, TRAINING, FREE_ARENA, TOURNAMENT },
  scope:              enum { LOCAL, REGIONAL, GLOBAL, PLANETARY }
}
```

When an arena ends:

- All results are archived as permanent filaments on the parent branch
- No physics leak outward — arena coefficient overrides die at `endBlock`
- Only reputation filaments and achievement tokens persist on participants' user trees
- Arena Points (the internal currency) expire

### 68.2 ArenaContributionPacket Schema

One atomic record of what a player did inside an arena timebox. No hidden inputs. Everything needed to replay and verify the outcome must be inside the commit graph or referenced by hash.

```
ArenaContributionPacket {
  packetId:           "arenaPkt.<uuid>",
  arenaId:            string,
  matchId:            string,
  roundIndex:         number,
  turnIndex:          number,

  actor: {
    userId:           string,
    teamId:           string | null,
    role:             enum { PLAYER, JUDGE_SCV, SPECTATOR, CROWD_VOTER }
  },

  action: {
    type:             enum {
      PLAY_CARD, CAST_INSTANT, OPEN_PROJECTION, CHALLENGE_NODE,
      SUBMIT_EVIDENCE, COUNTER_EVIDENCE, PASS_PRIORITY, CONCEDE,
      CROWD_TERRAIN_VOTE, CROWD_ATTRIBUTE_VOTE
    },
    targetRef:        string | null (filament, projection, or node reference),
    payloadHash:      SHA-256 (content-addressed payload),
    inputs: {
      declaredAt:     ISO-8601,
      priorityWindowId: string,
      requiresApproval: boolean
    }
  },

  costs: {
    powerSpent:              number,
    engagementCreditsSpent:  number,
    arenaPointsStaked:       number
  },

  evidence: {
    evidenceRefs:     string[] (filament, attachment, or external references),
    challengeRefs:    string[],
    disclosureTier:   number
  },

  ruleContext: {
    rulesetId:              string (immutable per match),
    coeffSetId:             string (immutable per match window),
    projectionConstraintsId: string,
    activeCrowdTerrainHash: SHA-256 (current crowd-voted terrain snapshot)
  },

  computed: {
    confidenceDelta:  number,
    stabilityDelta:   number,
    fogDelta:         number,
    heatDelta:        number
  },

  integrity: {
    prevPacketHash:   SHA-256 | null,
    packetHash:       SHA-256,
    signature:        string (actor's key),
    protocolVersion:  string
  }
}
```

**Invariants:**

- `payloadHash` points to content-addressed payload (card text, projection spec, proof bundle)
- `rulesetId` and `coeffSetId` are immutable once a match starts
- `computed.*` is derived and must be reproducible from `action` + `evidence` + coefficients
- `activeCrowdTerrainHash` captures the crowd terrain state at the moment of the action

### 68.3 Stack Resolution Protocol — MTG-Style LIFO for Logic Combat

The stack resolves arguments and evidence the same way Magic: The Gathering resolves spells — last-in, first-out. But instead of creature damage, the stack resolves confidence, stability, fog, and heat deltas.

**State machine:**

```
A) DECLARE
   Active player submits ArenaContributionPacket with type =
   PLAY_CARD | CAST_INSTANT | OPEN_PROJECTION | SUBMIT_EVIDENCE | CHALLENGE_NODE
   Engine validates: costs covered, action permitted by constraints, evidence refs resolvable
   If valid: push StackItem (with packetHash) onto stack

B) PRIORITY PASS LOOP
   Priority rotates: P1 -> P2 -> ... -> PN -> back to P1
   Each priority holder must commit exactly one:
     PASS_PRIORITY (yield)
     OR a new action that pushes a new stack item (respond)

C) RESOLVE
   When all players pass consecutively with no new stack additions,
   resolve the top item. Emit ResolutionEvent:

   ResolutionEvent {
     matchId:              string,
     resolvedPacketHash:   SHA-256,
     result:               enum { PASS, REFUSED, COUNTERED, PARTIAL },
     reasonCode:           enum { OK, INSUFFICIENT_EVIDENCE, OUT_OF_SCOPE,
                                  BUDGET_EXCEEDED, CONSTRAINT_VIOLATION },
     deltas: {
       confidenceDelta:    number,
       stabilityDelta:     number,
       heatDelta:          number,
       fogDelta:           number
     },
     timestamp:            ISO-8601
   }

D) DETERMINISM RULES
   No time-based randomness. Time only selects the timebox/window.
   Timing mechanics use committed timestamps and resolve in commit order
   with deterministic tie-break (packetHash lexicographic).
```

**The stack creates the StarCraft tension legally.** When your opponent plays an evidence card, you have a priority window to counter. They can counter your counter. Each layer of response builds pressure. The crowd watches the stack grow. When it resolves, the cascade of confidence/stability deltas produces dramatic swings — all deterministic, all replayable, all traceable.

### 68.4 Volatility Coefficient Structure

Volatility is a ruleset overlay that modifies costs, reveal rules, projection complexity, confidence impacts, and timebox cadence — but never the underlying equations.

```
ArenaCoeffSet {
  coeffSetId:         string,
  volatilityTier:     enum { CALM, STANDARD, CHAOTIC, EXTREME },

  time: {
    priorityWindowMs:      number (default: 8000),
    turnTimeboxSeconds:    number (default: 60),
    matchMaxMinutes:       number (default: 25)
  },

  economy: {
    powerCostMult:         number (default: 1.0),
    arenaStakeMult:        number (default: 1.0),
    lossPenaltyMult:       number (default: 1.0),
    winRewardMult:         number (default: 1.0)
  },

  visibility: {
    handRevealRule:        enum { FULL, PARTIAL, HIDDEN },
    stackRevealRule:       enum { FULL, PARTIAL },
    projectionRevealRule:  enum { FULL, MASKED_NODES, HASH_ONLY_NODES }
  },

  constraints: {
    maxStackDepth:         number (default: 20),
    maxProjectionDepth:    number (default: 3),
    projectionBudgetMs:    number (default: 50),
    maxEvidenceRefsPerAction: number (default: 12)
  },

  scoring: {
    confidenceWeight:      number (default: 0.50),
    stabilityWeight:       number (default: 0.25),
    evidenceWeight:        number (default: 0.25),
    fogPenaltyWeight:      number (default: 0.30)
  }
}
```

**Hard rules:**

- `coeffSetId` is fixed for a match once it starts
- Volatility cannot change mid-match (but crowd terrain CAN — see §68.5)
- Volatility affects arena scoring only, never core governance
- Same equation, different coefficient, scoped to branch

### 68.5 Crowd-Driven Terrain Voting — The Human Random Engine

This is the mechanism that makes every arena match genuinely unrepeatable. No AI can predict it. No preparation fully accounts for it. The crowd IS the random number generator — but a meaningful one driven by human attention, curiosity, and desire.

**The principle:** Before and during a match, the crowd votes on which attributes to emphasize. These votes shift the scoring weights, constraint parameters, and visibility rules within governed bounds. The participants must adapt in real time to terrain they did not choose and could not predict.

**How it works:**

```
CrowdTerrainConfig {
  votingPhases: [
    {
      phase:          PRE_MATCH,
      duration:       number (seconds, default: 120),
      votableMetrics: MetricRef[] (which attributes the crowd can adjust),
      voteType:       enum { RANKED_CHOICE, WEIGHTED_SLIDER, BINARY_TOGGLE },
      resolution:     MEDIAN (crowd median becomes the active value)
    },
    {
      phase:          MID_MATCH,
      duration:       CONTINUOUS,
      votableMetrics: MetricRef[] (subset — fewer adjustable mid-match),
      voteType:       WEIGHTED_SLIDER,
      resolution:     ROLLING_MEDIAN (recalculated every N seconds),
      updateInterval: number (seconds, default: 30),
      maxShiftPerUpdate: number (% — how much a metric can change per interval)
    }
  ],
  minimumCrowdSize:   number (default: 20 — below this, terrain defaults are used),
  crowdEligibility:   enum { ANY_VIEWER, TIER_1_PLUS, DOMAIN_QUALIFIED }
}
```

**Pre-match terrain voting (the "map selection"):**

Before the match begins, the crowd sees a dashboard of adjustable attributes. They vote on what kind of match they want to see. This is the equivalent of random map selection in StarCraft — except it is driven by human collective preference, not a random seed.

The crowd votes. The median of all votes becomes the active terrain. Neither participant knows the exact result until the match starts. They see the terrain revealed and must adapt instantly.

**Mid-match attention voting (the "weather shift"):**

During the match, the crowd can continue to shift a subset of metrics. This is slower (capped shift per interval) and affects fewer dimensions. But it means the terrain is alive — the crowd's attention IS the weather. If the crowd gets bored with evidence and wants more spectacle, the spectacle weight rises. If the crowd wants deeper analysis, the evidence threshold tightens.

Participants feel this shift. A skilled player reads the crowd and pivots strategy. A rigid player gets caught in terrain they cannot navigate.

**Why no machine can predict this:**

1. **Irreducible human complexity**: Each crowd member's vote is influenced by their mood, attention span, what happened in the last 30 seconds, their personal aesthetic preferences, their domain knowledge, and their social dynamics with other crowd members. No model captures this.

2. **Crowd composition is random**: Who watches any given match is itself unpredictable. A match at 2am attracts a different crowd than a match at noon. A match about accounting attracts domain experts. A match about monster combat attracts gamers. The crowd composition changes the terrain.

3. **Non-stationary preferences**: The crowd's preferences shift during the match in response to what they just saw. A stunning evidence reveal makes the crowd want more evidence. A spectacular spell makes the crowd want more spectacle. The terrain co-evolves with the match.

4. **Emergent meta-gaming**: Crowds develop preferences. "This arena favors evidence-heavy builds." Word spreads. Competitors prepare for evidence-heavy terrain. But the next crowd is different. The meta never stabilizes because the randomness source (human attention) never stabilizes.

5. **Scale amplifies unpredictability**: With 20 crowd members, some statistical patterns emerge. With 20,000, the law of large numbers smooths individual noise but crowd-level dynamics (waves of excitement, collective boredom, reaction to surprise) create higher-order unpredictability that no simple statistical model captures.

### 68.6 Votable Metrics — Duels & Arena Combat

The following attributes can be placed in the crowd terrain vote for arena duels. Template designers choose which subset is votable per arena type. The full taxonomy:

**A. Scoring Weights (how victory is measured):**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `evidenceQualityWeight` | How much evidence quality matters to the final score | 0.0–0.8 | 0.35 |
| `argumentClarityWeight` | How much argument structure and clarity matter | 0.0–0.5 | 0.20 |
| `spectacleWeight` | How much physical performance and visual drama matter | 0.0–0.5 | 0.15 |
| `counterplayWeight` | How much successful countering of opponent's moves matters | 0.0–0.4 | 0.15 |
| `consistencyWeight` | How much consistency across rounds matters vs single brilliant plays | 0.0–0.3 | 0.15 |

**B. Tempo & Time Pressure:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `priorityWindowMs` | Time allowed to respond before priority passes | 2000–30000 | 8000 |
| `turnTimeboxSeconds` | Maximum time per turn | 15–300 | 60 |
| `matchMaxMinutes` | Total match duration | 5–120 | 25 |
| `stackResolutionPace` | Speed of stack resolution animation/reveal | INSTANT / STANDARD / DRAMATIC | STANDARD |

**C. Complexity & Depth:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `maxStackDepth` | How many responses can chain before forced resolution | 3–50 | 20 |
| `maxProjectionDepth` | How complex projections can be | 1–10 | 3 |
| `maxEvidenceRefsPerAction` | How many evidence references per single move | 1–50 | 12 |
| `crossBranchRefAllowed` | Can players reference data from outside the arena scope? | boolean | true |
| `historicalDepth` | How far back in time evidence can be drawn from | 7d–UNLIMITED | UNLIMITED |

**D. Visibility & Information:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `handRevealRule` | How much of each player's prepared moves are visible | FULL / PARTIAL / HIDDEN | HIDDEN |
| `stackRevealRule` | Can the crowd see pending stack items before resolution? | FULL / PARTIAL | FULL |
| `projectionRevealRule` | How much of projection internals are visible | FULL / MASKED / HASH_ONLY | FULL |
| `opponentTreeVisibility` | Can players inspect each other's user trees during the match? | FULL / SUMMARY_ONLY / NONE | SUMMARY_ONLY |
| `crowdSeesBothHands` | Does the crowd see what both players hold? (players don't see each other's) | boolean | true |

**E. Volatility & Risk:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `confidenceDeltaMult` | How much each action swings confidence | 0.5–3.0 | 1.0 |
| `fogAccumulationRate` | How quickly fog builds from weak evidence | 0.5–3.0 | 1.0 |
| `heatSensitivity` | How quickly heat builds from rapid exchanges | 0.5–3.0 | 1.0 |
| `stormThreshold` | How much accumulated fog+heat before storm triggers | 0.3–1.0 | 0.7 |
| `scarPermanence` | Do arena scars persist on user tree or expire with arena? | PERMANENT / ARENA_ONLY | ARENA_ONLY |

**F. Combat & Spectacle (game layer duels):**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `spellComplexityFloor` | Minimum spell component count allowed | 1–5 | 1 |
| `elementRestrictions` | Which element types are allowed | ALL / SUBSET / SINGLE | ALL |
| `creatureSummonLimit` | Maximum active summons per player | 0–10 | 3 |
| `physicalPerformanceWeight` | How much physical gesture precision matters | 0.0–0.5 | 0.15 |
| `powerRegenerationRate` | How fast Power (mana) regenerates during match | 0.5–2.0 | 1.0 |

### 68.7 Votable Metrics — Court Cases & Sortition Proceedings

When a sortition case (§46) or formal legal proceeding enters an arena branch, the crowd (qualified spectators — not the jury) votes on procedural parameters. The jury decides the verdict. The crowd shapes the terrain on which the case is argued.

**A. Evidence Standards:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `evidenceStandard` | The burden of proof threshold | PREPONDERANCE (>50%) / CLEAR_AND_CONVINCING (>75%) / BEYOND_REASONABLE_DOUBT (>90%) | CLEAR_AND_CONVINCING |
| `evidenceTypeWeighting` | Relative weight of evidence categories | Slider per type | Equal |
| `requiredSourceTypes` | Minimum source diversity required | 1–5 distinct types | 2 |
| `hearsayAdmissibility` | Can second-hand evidence be presented? | ALLOWED / DISCOUNTED / EXCLUDED | DISCOUNTED |

**Evidence type breakdown for weighting:**

| Evidence Type | Description |
|--------------|-------------|
| `DOCUMENTARY` | Committed filaments, contracts, records, financial data |
| `TESTIMONIAL` | Voice transcripts, presence recordings, witness statements |
| `EXPERT` | Analysis by users with certified domain competence (§58.12) |
| `PHYSICAL` | Camera footage, proximity data, device signals, sensor data |
| `STATISTICAL` | Aggregate patterns, cross-section analysis, trend projections |
| `PRECEDENT` | Prior sortition verdicts, archived arena outcomes, governance commits |

**B. Temporal & Scope:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `temporalScope` | How far back evidence may reach | 30d–UNLIMITED | UNLIMITED |
| `branchScope` | How many branches evidence can be drawn from | SINGLE / RELATED / ANY_PUBLIC | RELATED |
| `counterpartyDiscovery` | Can parties compel public data from third-party branches? | YES / ONLY_NAMED / NO | ONLY_NAMED |
| `precedentWeight` | How much prior similar case outcomes influence scoring | 0.0–0.5 | 0.20 |

**C. Procedural Parameters:**

Note: `deliberationTimeHours`, `verdictThreshold`, `jurySize`, and `blindJury` are governance-level sortition parameters (§46) set through §11 weighted-median governance. They are NOT crowd-votable — they have governance-enforced floors that crowd terrain voting cannot breach. Only presentation parameters (`argumentRounds`, `crossExaminationIntensity`) are adjustable by crowd. (See §71.5.)

| Metric | What It Controls | Range | Default | Crowd-Votable? |
|--------|-----------------|-------|---------|----------------|
| `argumentRounds` | Number of alternating argument rounds | 1–10 | 3 | YES |
| `crossExaminationIntensity` | How many follow-up questions per round | 0–10 | 3 | YES |
| `deliberationTimeHours` | How long the jury has to deliberate | 1–168 | 72 | NO — §46 governance |
| `verdictThreshold` | Simple majority vs supermajority required | SIMPLE (>50%) / SUPER (>66%) / UNANIMOUS | SIMPLE | NO — §46 governance |
| `jurySize` | Number of jurors for this case | 5–15 | 9 | NO — §46 governance |
| `blindJury` | Can jurors see participant identities? | FULL_IDENTITY / ROLE_BADGE_ONLY / ANONYMOUS | ROLE_BADGE_ONLY | NO — §46 governance |

**D. Consequence Parameters:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `scarScope` | Does the verdict scar persist on user tree? | PERMANENT / TIME_LIMITED / ARENA_ONLY | PERMANENT |
| `precedentCreation` | Does this verdict create a referenceable precedent filament? | YES / NO | YES |
| `compensationRange` | Range of engagement credits that can transfer | 0–governed_max | governed_max |
| `confidenceImpact` | How much the verdict affects participants' branch confidence | 0.0–1.0 | 0.5 |
| `publicRecordDetail` | How much of the proceeding is archived publicly | FULL_TRANSCRIPT / SUMMARY / VERDICT_ONLY | FULL_TRANSCRIPT |

**E. Credibility & Witness:**

| Metric | What It Controls | Range | Default |
|--------|-----------------|-------|---------|
| `witnessCredibilityMethod` | How witness reliability is assessed | TREE_CONFIDENCE / DOMAIN_CERTIFICATION / CROWD_VOTE | TREE_CONFIDENCE |
| `expertRequirements` | Minimum certification level (§58.12) for expert witness status | NONE / MODULE_DEMONSTRATED / CERTIFIED | MODULE_DEMONSTRATED |
| `characterEvidenceAdmissibility` | Can parties present evidence about opponent's general character? | ALLOWED / LIMITED / EXCLUDED | LIMITED |
| `mitigatingCircumstanceWeight` | How much mitigating factors reduce consequence | 0.0–0.5 | 0.20 |
| `aggravatingCircumstanceWeight` | How much aggravating factors increase consequence | 0.0–0.5 | 0.20 |

### 68.8 Why This Creates True Randomness

The arena terrain is not generated by `Math.random()`. It is generated by human collective attention — which is computationally irreducible.

**The randomness chain:**

```
WHO shows up to watch (unpredictable)
        |
        v
WHAT mood they're in (unpredictable)
        |
        v
HOW they vote on terrain metrics (unpredictable composite)
        |
        v
MEDIAN of thousands of independent human preferences
        |
        v
TERRAIN emerges — unique to this match, this crowd, this moment
        |
        v
PARTICIPANTS must adapt to terrain they could not predict
        |
        v
MID-MATCH crowd shifts terrain in response to what they see
        |
        v
PARTICIPANTS must re-adapt to shifting conditions
        |
        v
OUTCOME is a function of: skill × adaptation × crowd terrain
```

**No two matches are ever the same** because:

1. The crowd composition is different
2. The pre-match terrain vote is different
3. The mid-match attention shifts are different
4. The participants' responses to terrain create new crowd reactions
5. The crowd's reactions shift the terrain further

This is a **feedback loop between human performers and human audience** that no simulation can replicate. It is the same phenomenon that makes live theater different from recorded theater, live sports different from replays, and live music different from albums. The crowd is not passive. The crowd is part of the system.

**What this means for skill:**

- **Adaptability** is rewarded over rote optimization. A player who prepared a perfect evidence-heavy strategy fails if the crowd votes for fast tempo and spectacle weight. The best players read the terrain and pivot.
- **Crowd reading** becomes a skill. Experienced arena players develop intuition for what crowds want. They adjust their presentation style, evidence selection, and timing based on crowd energy — the same way a trial lawyer reads the jury.
- **Preparation breadth** matters more than preparation depth. You cannot predict which metrics will be emphasized, so you must be competent across all of them. Specialists are vulnerable to unfavorable terrain. Generalists thrive.

### 68.9 Camera-Skill Metric Taxonomy — Edge of Tomorrow Training

Arena includes camera-based physical skill training — reaction drills, focus tracking, gesture precision, and pattern recognition. This is not violence simulation. It is motor control and attention training, measured and recorded as filaments on the user tree.

**Signal classes:**

| Category | Metric | Measurement |
|----------|--------|-------------|
| **Reaction** | `reactionLatencyMs` | Time from prompt to correct response |
| **Reaction** | `reactionConsistency` | Standard deviation over N trials |
| **Precision** | `gesturePathError` | Distance between expected vs observed motion path |
| **Precision** | `holdStability` | Micro-jitter during required hold (lower = better) |
| **Rhythm** | `tempoAdherence` | Match accuracy against beat windows |
| **Rhythm** | `windowHitRate` | % of prompts hit inside allowed timing window |
| **Attention** | `gazeStability` | Focus consistency (optional eye tracking, or pointer proxy) |
| **Attention** | `taskSwitchCostMs` | Delay when prompt type changes |
| **Endurance** | `fatigueSlope` | Performance degradation rate over session |
| **Endurance** | `sessionCompletionRate` | % of drills completed per session |

**ArenaSkillPacket schema:**

```
ArenaSkillPacket {
  skillPktId:     string,
  userId:         string,
  arenaId:        string,
  sessionId:      string,
  timeboxId:      string,

  raw: {
    trials:                  number,
    reactionLatencyMs_p50:   number,
    reactionLatencyMs_p95:   number,
    gesturePathErrorAvg:     number,
    holdStabilityScore:      number (0..1),
    windowHitRate:           number (0..1),
    fatigueSlope:            number (negative = degradation)
  },

  derived: {
    skillScore:              number (0..1, deterministic from raw + ruleset thresholds),
    confidence:              number (0..1)
  },

  evidence: {
    signalHashes:            SHA-256[] (local signal data hashes),
    onDeviceOnly:            boolean (true — raw signal never leaves device)
  },

  integrity: {
    packetHash:              SHA-256,
    signature:               string (user key)
  }
}
```

**Deterministic skill score:**

```
skillScore = wR × R + wP × P + wT × T + wA × A + wE × E
```

Where each component is a `0..1` clamp from explicit `min/max` ranges published in the arena ruleset. All weights are Category A global parameters (§11.6).

**The training loop:**

Each repetition is a filament. Each session is a slab. Each improvement is a radial migration inward (competence solidifies). This creates the "Edge of Tomorrow" loop: wake up, train, see your tree change, see your scores improve, see your reactions sharpen. The tree IS the progress bar. Cross-section shows your training history — early attempts near the bark, mastery near the core.

### 68.10 Arena-to-Reputation Conversion Math

Arena results must matter enough to be motivating but never enough to corrupt governance. Arena yields **ArenaRep** — domain-specific reputation that unlocks arena variants, advanced training, matchmaking tier increases, and limited teaching visibility in education trees. ArenaRep cannot convert to vote weight, orgConfidence, permissions, fiat, or Power.

**Core quantities per match:**

| Symbol | Meaning | Range |
|--------|---------|-------|
| W | Win (1) or loss (0) | binary |
| S | Stability score (aggregate from resolved stack) | 0..1 |
| C | Confidence score (from evidence quality) | 0..1 |
| A | Attention factor (eligible viewer count, normalized) | 0..1 |
| V | Volatility tier multiplier (from coeffSet) | 1.0–2.5 |
| P | Participation integrity (no refusals, no spam, no unsafe calls) | 0..1 |

**ArenaRepGain formula:**

```
ArenaRepGain = Base × V × P × (0.45×W + 0.25×S + 0.20×C + 0.10×A)
```

**Loss still yields learning credit:**

```
If W = 0:
  ArenaRepGain *= 0.40
```

Losing is not zero. Losing produces a thinner, cooler filament — but a filament nonetheless. The tree records participation. Scars from losses are visible in cross-section. They show effort, not failure.

**Anti-farm caps (deterministic):**

```
Daily cap per arena:
  capDaily = k × sqrt(uniqueOpponentsToday + 1)

Repeated opponent decay:
  oppDecay = 1 / (1 + repeatsWithSameOpponentToday)
  ArenaRepGain *= oppDecay
```

You cannot farm reputation by fighting the same person repeatedly. You must face new opponents. The cap scales with opponent diversity, not volume.

**Where it lives on the tree:**

ArenaRepGain is a filament on the user tree under `branch.arena.<arenaId>`. Cross-section shows:

- Thick rings = many matches
- Fog = low evidence quality
- Scars = rejected actions / rule violations
- Heat = high stability/confidence changes
- Lean = directional strength (toward certain domains)

### 68.11 Singleplayer & Multiplayer

**Singleplayer training:**

The opponent is historical precedent, stored high-skill replay, simulation branches, or AI-driven logic models. The goal: improve reasoning, argument structure, timing, reaction speed. No real stakes. Pure skill development. The training arena is always available, always free, always private.

Training sessions produce ArenaSkillPackets but not ArenaContributionPackets — training does not earn reputation. Only live matches against real opponents earn ArenaRep.

**Multiplayer modes:**

| Mode | Players | Format | Crowd Terrain? |
|------|---------|--------|---------------|
| **1v1 Duel** | 2 | Alternating turns, full stack, evidence + spectacle | Yes |
| **Team Duel** | 2v2 to 5v5 | Shared priority queue, team stack coordination | Yes |
| **Free Arena** | 3+ | Free-for-all, alliance allowed (visible!), betrayal legal | Yes |
| **Tournament** | 8–256 | Bracket elimination, escalating volatility per round | Yes, resets each round |
| **Court Case** | 2 parties + jury | Formal proceeding, crowd sets terrain, jury decides verdict | Yes (crowd ≠ jury) |

**Free Arena — the StarCraft social tension:**

In free arenas, alliances are **visible commitments** — you commit an alliance filament that is inspectable. But alliances can be broken. Breaking an alliance produces a scar on your arena branch. The crowd sees alliances form and break. Other players see them. The social tension of "who is actually allied with whom" is real — but transparent. You can betray, but your betrayal is on the record. The crowd reacts. The terrain shifts.

This captures the StarCraft energy: social paranoia, hidden motives, alliance ambiguity. But in Relay, the betrayal is visible after the fact. It becomes part of your arena reputation. Serial betrayers earn fog and wilt on their arena branches. Reliable allies earn firm, confident branches. The tree shows your social strategy across all arenas.

### 68.12 The Engagement Feedback Loop

Why this never ends:

1. **Short feedback loops**: Each match is 5-25 minutes. You see results immediately.
2. **Visible progress**: Your arena branch grows. Cross-section shows improvement. Rings thicken. Fog clears.
3. **Escalating challenge**: Matchmaking uses ArenaRep for pairing. As you improve, opponents improve. The plateau is always just ahead.
4. **Crowd variability**: No two matches feel the same because no two crowds vote the same terrain.
5. **Social stakes**: Your reputation is public. Your wins are visible. Your losses are visible. Your arena branch IS your competitive identity.
6. **Discovery depth**: Advanced strategies emerge over time — projection tricks, evidence chain manipulation, timing exploits, crowd-reading skills. There is always more to learn.
7. **Training integration**: Camera-based skill drills feed into duel performance. Physical improvement translates to arena advantage. The body and the mind both grow.
8. **Free entry, reward only**: No cost to enter. No pay-to-win. All rewards are earned. The economy is purely meritocratic within the arena scope.

**The progression curve:**

| Tier | What Opens | How You Get There |
|------|-----------|------------------|
| **Novice** | Training arenas, low-volatility 1v1s | Complete tutorial |
| **Apprentice** | Standard volatility, team duels, basic tournaments | 20+ matches, ArenaRep > threshold |
| **Journeyman** | High volatility, free arenas, court case participation as advocate | 100+ matches, demonstrated evidence quality |
| **Champion** | Extreme volatility, planetary-scale tournaments, court case expert witness | 500+ matches, high ArenaRep, certified domain competence (§58.12) |
| **Architect** | Arena design (propose new arena types, new terrain metrics, new rulesets) | Champion tier + community approval via module discovery (§38) |

### 68.13 What Arena Must Never Grant

This is the constitutional boundary. Arena is entertainment, training, and reputation — never governance leverage.

| Arena CAN grant | Arena CANNOT grant |
|----------------|-------------------|
| Arena Points (branch-scoped, expire) | Governance vote weight |
| ArenaRep (domain-specific reputation) | OrgConfidence override |
| Achievement Tokens | Access to private data |
| Skill filaments | External settlement privileges |
| Teaching visibility (lens only) | Physical resource influence |
| Matchmaking tier advancement | Global vote leverage |
| Narrative influence (temporary attention) | Fiat currency |
| Precedent filaments (for court arenas) | Permission scope expansion |

If any of these boundaries is violated, the arena corrupts the system. ArenaRep is a lens — it shows what you can do. It is never a lever — it cannot change what others must do.

### 68.14 How This Connects to Existing Architecture

**§40 (Game Layer):** Arena is the competitive expression of the game layer. Quests are PvE. Arena is PvP. Both use the same tree physics, the same resource economy, the same discovery model. Arena adds the crowd-driven terrain mechanic and the formal stack resolution protocol.

**§41 (Multi-Resource Economy):** Arena introduces Arena Points as a scoped, expiring resource. All other resources (Engagement Credits, Achievement Tokens, Power, Active Capacity) interact with arena through existing rules. No new resource conversions are created.

**§42 (Duels):** Arena formalizes duels with the ArenaContributionPacket, stack protocol, and crowd terrain system. Existing duel mechanics (§42.1-42.6) remain valid. Arena adds the structured resolution layer and the crowd-driven parameter adjustment.

**§43 (Spell Taxonomy):** Spells work identically inside arenas. Element detection, gesture validation, and card mechanics are unchanged. Arena only adjusts which elements are allowed (crowd terrain metric `elementRestrictions`) and the Power regeneration rate.

**§46 (Sortition):** Court case arenas use sortition for jury selection (unchanged). The crowd is not the jury — the crowd sets the terrain, the jury decides the verdict. Crowd terrain voting is a separate mechanism from jury deliberation. Jurors are not influenced by crowd terrain — they see the evidence and arguments, not the crowd's metric votes.

**§58 (Education):** Arena is a training ground. Skill development in arenas feeds into the education system (§58) through demonstrated competence. A user who develops strong evidence presentation skills in arena can leverage those as teaching material. Camera-skill training (§68.9) is a form of education that produces learning filaments.

**§58.12 (Certification):** Champion-tier arena participation and certified domain competence are connected. A certified accountant who demonstrates arena competence in financial dispute resolution earns both professional and competitive reputation — the tree shows both.

**§61 (Privacy):** Arena is public by definition. All arena actions are committed at `disclosureTier >= 1`. There is no private arena. The crowd sees everything. The participants accept visibility as a condition of entry. Contract #150 (private data uninspectable) applies to data outside the arena — participants cannot be compelled to reveal private branch data during arena proceedings.

### 68.15 Community-Governed Monster Difficulty — PvE Crowd Scaling

As users explore distant gaming world branches (§40.4 fractal quest scaling), the community inhabiting that branch governs the challenge environment. Veterans who have conquered the local monsters do not simply leave — they make the world harder for everyone, including themselves.

**Branch-level difficulty governance:**

Each game layer branch (a quest zone, a planet, a dungeon) has **local difficulty parameters** that are Category A global parameters scoped to that branch:

```
BranchDifficultyParams {
  branchRef:                 branchRef,
  monsterHealthMult:         number (0.5–5.0, default: 1.0),
  monsterBehaviorComplexity: enum { SIMPLE, STANDARD, TACTICAL, ADAPTIVE },
  monsterSpawnRate:          number (0.5–3.0, default: 1.0),
  monsterRewardMult:         number (0.5–3.0, default: 1.0),
  environmentalHazardRate:   number (0.0–2.0, default: 0.5),
  resourceScarcity:          number (0.5–2.0, default: 1.0),
  bossFrequency:             number (0.5–3.0, default: 1.0),
  cooperativeBonus:          number (1.0–2.0, default: 1.2),
  globalFloor:               DifficultyFloor (minimum values — prevents trivializing),
  globalCeiling:             DifficultyCeiling (maximum values — prevents impossibility)
}
```

**Who votes:** Only users who have active presence on the branch (have fought at least one monster, have a filament in the zone). Tourists and spectators do not vote on difficulty — only inhabitants. This prevents distant communities from griefing a zone they have never visited.

**The scaling dynamic:**

1. New zone opens with default difficulty
2. Early explorers arrive, fight monsters, earn rewards
3. As explorers level up, they vote difficulty higher — harder monsters, better rewards
4. The zone's reputation spreads — "Mars Sector 7 is running ADAPTIVE monsters at 3.0x health"
5. Ambitious players travel there for the challenge
6. The community self-selects: casual players leave for easier zones, elite players concentrate
7. The zone's cross-section shows the difficulty history — easy core, hardening bark

**Monster behavior voting:**

Beyond difficulty numbers, communities vote on monster **behavior modes** within governed limits:

| Behavior Mode | What Changes | Global Limit |
|---------------|-------------|-------------|
| **SIMPLE** | Monsters follow basic patterns, predictable | Always available |
| **STANDARD** | Monsters adapt to player count and composition | Always available |
| **TACTICAL** | Monsters coordinate, flank, retreat, set traps | Requires 60% community vote |
| **ADAPTIVE** | Monsters learn from player strategies across sessions | Requires 75% community vote, Champion-tier zone |

The global floor prevents a community from voting difficulty to zero (trivializing the content). The global ceiling prevents a community from making a zone literally impossible (griefing newcomers). Within those bounds, the community shapes their world.

### 68.16 Resource Marketplace — Skill-Based Barter Economy

Arena branches and game layer zones include a **resource marketplace** — a barter system where players trade resources, loot, crafting materials, and arena consumables. The marketplace rewards knowledge and negotiation skill.

**The barter model (Secret of Mana/Evermore inspired):**

Resources in Relay's game layer are not priced in a single currency. They have **contextual value** that shifts based on branch conditions:

```
MarketplaceItem {
  itemId:               string,
  itemType:             enum { RESOURCE, LOOT, CRAFTING_MATERIAL, SPELL_COMPONENT,
                               ARENA_CONSUMABLE, TRAINING_TOKEN },
  baseValue:            number (in Engagement Credits),
  contextModifiers: {
    branchScarcity:     number (how rare this item is on this branch — computed from supply),
    branchDemand:       number (how many active requests exist — computed from demand filaments),
    seasonalModifier:   number (time-based value shift — some resources are worth more at dawn),
    skillPremium:       number (crafted items from high-skill players carry a premium)
  },
  effectiveValue:       number (baseValue × product of contextModifiers)
}
```

**Skill-based trading advantages:**

Players who understand the marketplace physics gain advantages — not through exploitation, but through knowledge:

- **Arbitrage awareness**: A resource that is scarce on Mars Sector 7 (high `branchScarcity`) might be abundant on Earth Sector 3. A player who knows both markets can trade profitably by transporting resources between zones. The transport takes time (the player must physically travel through the tree), creating a natural friction that prevents instant exploitation.
- **Timing skill**: Some resources peak in value during specific timeboxes (seasonal modifier). A player who understands the timing cycle buys low and sells high — visible, legal, and rewarded.
- **Crafting premium**: Items crafted by high-skill players (thick, firm arena branch, many demonstrated modules) carry a `skillPremium`. A sword forged by a Champion-tier crafter is objectively the same item, but the crafter's reputation makes it more desirable — the market prices reputation because the buyer trusts the source.
- **Negotiation filaments**: Direct trades between players are committed as trade filaments with full evidence chains. A player with a history of fair trades (high trade confidence) gets better offers. A player with scars from bad trades (disputes, failed deliveries) gets worse offers. The marketplace self-regulates through reputation physics.

**Resource quotas with flexible balancing:**

Organizations and guilds can set **resource targets** — quotas that must be met collectively but can be balanced differently among members:

```
ResourceQuota {
  quotaId:              string,
  scope:                branchRef (the guild/team/zone branch),
  targetResources: [
    { resourceType: string, targetAmount: number, timeboxWindow: number }
  ],
  balancingRule:        enum { EQUAL_SPLIT, PROPORTIONAL_TO_SKILL,
                               SELF_ASSIGNED, AUCTION },
  completionReward:     RewardSpec (what the group earns for meeting quota),
  overachievementBonus: number (multiplier for exceeding target)
}
```

The key: the quota defines WHAT must be collected, but not WHO collects each part. A guild with a quota of 1000 minerals and 500 crystals can let specialists focus on what they are best at. The miner focuses on minerals; the crystal hunter focuses on crystals. Or they can auction assignments to the highest bidder. Or they can self-assign. The balancing mechanism is itself a votable parameter within the guild.

### 68.17 Crowd Faction System — Pick a Side, Change Your Mind

The crowd is not passive spectators voting on abstract terrain metrics. Crowd members **register their faction** — which side they support. This registration is visible, changeable, and directly influences the match through collective energy.

**Faction registration:**

```
CrowdFactionCommit {
  userId:               string,
  matchId:              string,
  factionRef:           enum { SIDE_A, SIDE_B, NEUTRAL, UNDECIDED },
  commitTimestamp:       ISO-8601,
  switchCount:          number (how many times this user has changed faction in this match),
  switchPenalty:         number (diminishing influence weight with each switch)
}
```

**Rules:**

- Crowd members can register for either side, remain neutral, or start undecided
- Faction choice is **visible** — both participants see the crowd split in real time
- Crowd members can **change sides** at any time during the match — but each switch reduces their influence weight (switchPenalty = `1 / (1 + switchCount)`). A fan who switches 5 times has almost no influence. A fan who commits early and stays has maximum influence.
- Switching faction is itself a committed event — your loyalty pattern is on the record

**How factions influence the match:**

Crowd faction energy flows into the match through **collective resonance** — the aggregate energy of a faction amplifies specific attributes for their supported side:

| Crowd Metric | Effect on Supported Side | Scaling |
|-------------|------------------------|---------|
| **Faction size** (raw count of supporters) | Confidence boost on next action | `sqrt(factionSize) / sqrt(totalCrowd)` |
| **Faction loyalty** (avg commitment duration) | Stability bonus during stack resolution | `avgLoyaltyDuration / matchDuration` |
| **Faction engagement** (how actively the faction is participating — voting, reacting) | Heat amplification on successful plays | `engagementRate × factionWeight` |
| **Faction expertise** (avg domain qualification of faction members) | Evidence weight bonus when presenting to jury/audience | `avgDomainScore / maxDomainScore` |

**Critical constraint:** Faction influence is a **modifier**, not a determinant. The maximum faction bonus on any metric is capped (Category A global parameter, default: +15%). A player with zero skill cannot win through crowd support alone. A player with high skill benefits from crowd support but does not depend on it. The crowd amplifies performance — it does not replace it.

**The social dynamics:**

- Before a high-profile match, faction registration creates anticipation. "Team A has 60% of the crowd." The underdog effect kicks in — some crowd members switch to Side B for the narrative.
- During the match, a dramatic reversal causes faction shifts. Crowd members who switched to the winning side early get credit. Those who switched late get penalized. Loyal supporters who stayed through the low point get maximum influence.
- After the match, your faction history is a filament on your arena branch. Serial front-runners (always switching to the winner mid-match) develop a reputation. Loyal supporters develop a different reputation. The tree shows who you backed and when.

**Multiplayer and group events:**

Faction registration extends beyond 1v1 to any group event:

| Event Type | Factions | How Crowd Helps |
|-----------|----------|----------------|
| **Team duel** | Team A vs Team B | Faction energy pools across all team members |
| **Tournament** | Support any competitor | Faction energy follows your chosen competitor through brackets |
| **Free arena** | Support any player or alliance | Faction shifts as alliances form and break |
| **Dance party / performance** | Support any performer | Faction energy = applause → attention → micro-rewards (§68.18) |
| **Court case** | Prosecution vs Defense | Crowd faction visible but jury is NOT influenced by crowd (§46 sortition independence preserved) |

### 68.18 Attention-Based Micro-Rewards — The Micro-Reward Feedback System

Not all arena events are combat or court proceedings. Relay hosts **social performance events** — dance parties, comedy shows, live music, spoken word, talent showcases, cooking demonstrations, fitness challenges — any activity where a user performs for an audience. These events use the same arena branch infrastructure with a different reward mechanic: **attention converts to micro-rewards.**

**The attention-to-reward pipeline:**

```
USER PERFORMS (dance, joke, song, demonstration, trick)
        |
        v
CROWD REACTS — real-time reaction filaments:
  CrowdReactionPacket {
    reactorUserId:    string,
    performerUserId:  string,
    reactionType:     enum { APPLAUSE, LAUGH, CHEER, SURPRISE,
                             ENCORE, STANDING_OVATION, EMOJI_BURST },
    intensity:        number (0..1, from camera-detected reaction or manual input),
    timestamp:        ISO-8601
  }
        |
        v
ATTENTION SCORE computed per timebox:
  AttentionScore = Σ (reactionIntensity × reactorWeight)
  where reactorWeight = f(reactorPresenceDuration, reactorFactionLoyalty)
        |
        v
MICRO-REWARD issued to performer:
  MicroRewardPacket {
    performerUserId:  string,
    eventRef:         arenaId,
    rewardType:       enum { ENGAGEMENT_CREDITS, ARENA_POINTS,
                             VISUAL_BURST, CROWD_EFFECT, POWER_TRICKLE },
    amount:           number (small — designed for volume, not magnitude),
    triggerCondition: string (what the performer did that earned this)
  }
```

**Reward types and their feedback mechanisms:**

| Reward | What Happens | Why It Engages |
|--------|-------------|-------------------|
| **Engagement Credits** (small) | Tiny EC deposit per sustained attention threshold | Real value, accumulates over time |
| **Arena Points** | Branch-scoped points for event-specific leaderboards | Competition within the event |
| **Visual Burst** | Emoji graphics, particle effects, glow around performer's sphere — visible to all | Immediate social feedback, public recognition |
| **Crowd Effect** | Performer's side of the arena changes atmosphere (colors, sounds, energy) based on crowd reaction | Environmental feedback — the space responds to you |
| **Power Trickle** | Small Power regeneration from sustained audience attention | Enables spell casting fueled by audience energy |

**Visual Bursts — the emoji reward:**

When a performer hits an attention threshold (e.g., 70% of the crowd reacts with LAUGH within 3 seconds of a joke), a **Visual Burst** fires:

- Emoji graphics pop up around the performer's user sphere — laughing faces, fire emojis, hearts, stars
- The burst is visible to everyone in the arena branch
- The burst is brief (2-5 seconds), non-blocking, and purely cosmetic
- Different reaction types produce different visual signatures (APPLAUSE = clapping hands cascade, LAUGH = laughing emojis, STANDING_OVATION = golden glow + confetti)
- Visual Bursts are the Relay equivalent of a laugh track, an applause sign, a standing ovation — but driven by real crowd reaction, not programmed

**The small reward principle:**

Micro-rewards are deliberately small. A single Visual Burst earns nothing material. A single EC deposit is fractional. But over a 30-minute performance with sustained crowd engagement, the accumulation is meaningful:

- A street performer who keeps a crowd entertained for an hour earns more EC than someone farming low-level monsters
- A comedian who consistently gets LAUGH reactions builds a thick, warm performance branch on their tree
- A dancer who generates STANDING_OVATION regularly develops a highly visible arena presence

The engagement comes from the **frequency and visibility** of rewards, not their individual magnitude. Every reaction from the crowd produces a micro-feedback. Every threshold crossed produces a visible burst. The performer sees the crowd's energy in real time and adjusts their performance. The crowd sees their reactions reflected in the arena environment and participates more enthusiastically.

**Social performance categories:**

| Category | What's Measured | Crowd Reaction Types |
|----------|----------------|---------------------|
| **Dance** | Rhythm, movement quality, creativity, crowd sync | CHEER, ENCORE, STANDING_OVATION |
| **Comedy** | Timing, crowd laughter rate, surprise factor | LAUGH, SURPRISE, APPLAUSE |
| **Music** | Performance quality, crowd energy, tempo adherence | CHEER, ENCORE, STANDING_OVATION |
| **Spoken Word** | Clarity, emotional impact, argument quality | APPLAUSE, SURPRISE, STANDING_OVATION |
| **Fitness / Sports** | Physical performance metrics, crowd excitement | CHEER, SURPRISE, STANDING_OVATION |
| **Cooking / Craft** | Technique, creativity, audience engagement | APPLAUSE, SURPRISE, CHEER |
| **Teaching / Demo** | Clarity, audience comprehension, question quality | APPLAUSE, SURPRISE, CHEER |

All categories use the same reward pipeline. The template system (§21) configures which reaction types are available and what thresholds trigger Visual Bursts.

### 68.19 Terrain Rules — Contestant Agreement, Presets & Combat Loadouts

Not all arena terrain is crowd-driven random. The Architect conversation identified three terrain modes:

**Mode 1: Agreed Terrain (contestants negotiate)**

Before the match, both contestants (or all parties) negotiate and agree on terrain parameters. This is the equivalent of chess players agreeing on time controls, or martial artists agreeing on weight class rules.

```
AgreedTerrainConfig {
  negotiationType:     enum { FULL_AGREEMENT, PARTIAL_AGREEMENT_CROWD_FILLS },
  agreedMetrics:       MetricOverride[] (specific values both parties accepted),
  disputeResolution:   enum { CROWD_DECIDES, DEFAULT_VALUES, COIN_FLIP_HASH },
  lockTimestamp:       ISO-8601 (terrain locks when both commit agreement)
}
```

- Both contestants propose terrain values. Where they agree, the value is locked.
- Where they disagree, the resolution mechanism activates: crowd decides the disputed metrics (default), system defaults apply, or a deterministic hash-based coin flip resolves the dispute.
- `PARTIAL_AGREEMENT_CROWD_FILLS` is the hybrid: contestants lock the metrics they care about, the crowd votes on the rest. This creates strategic pre-match negotiation — what you fight to lock reveals what you are preparing for.

**Mode 2: Crowd Random (§68.5 — the human random engine)**

The crowd votes on all terrain metrics. This is the default for public arenas, tournaments, and any event designed for spectacle.

**Mode 3: Preset Terrain (template-based)**

Arena designers create **terrain presets** — named configurations that package a complete set of terrain values for a specific experience. Players select a preset instead of negotiating or crowd-voting.

**Terrain presets (inspired by the best of all games):**

| Preset Name | Inspired By | Key Settings |
|------------|-------------|-------------|
| **Blitz** | Speed chess, FPS deathmatches | 5-second priority windows, 3-minute matches, EXTREME volatility, HIDDEN hands |
| **Grand Strategy** | Civilization, 4X strategy | 5-minute turns, 60-minute matches, CALM volatility, FULL visibility, deep projection depth |
| **Evidence Trial** | Court drama, Phoenix Wright | High evidence weight, strict source requirements, 3 argument rounds, blind jury |
| **Spectacle Arena** | Gladiator, wrestling, martial arts | High spectacle weight, element restrictions lifted, creature summons encouraged, crowd faction bonus +25% |
| **Debate Hall** | Formal debate, Oxford Union | Equal time, structured rounds, no spells, evidence-only, clarity scoring dominant |
| **Survival** | Battle royale, roguelike | Free arena, shrinking resource pool, increasing difficulty per round, last player standing |
| **Puzzle Chamber** | Puzzle games, escape rooms | Cooperative, time-limited, logic-heavy, no combat, projection-based problem solving |
| **Gauntlet** | Endless runners, Lifeforce, Gradius | Single-player, escalating difficulty, no pause, endurance-based scoring |
| **Trading Floor** | Resource management, Catan, Secret of Mana marketplace | Barter-focused, resource quotas, negotiation scoring, no combat |
| **Performance Stage** | Dance Dance Revolution, Guitar Hero, talent shows | Attention-based scoring, crowd reaction dominant, Visual Bursts amplified |

Presets are community-created through module discovery (§38). Anyone can propose a new preset. The community votes on it. Popular presets rise in search. Bad presets wilt.

**Combat loadouts (Final Fantasy / RPG inspired):**

Within arena matches, players can select a **combat loadout** — a configuration that emphasizes certain capabilities at the cost of others. Loadouts are not permanent. They are per-match selections. (Note: "class" in §40.6 refers to permanent element affinity from geography. "Loadout" is the per-match tactical selection.)

```
CombatLoadout {
  loadoutId:            string,
  loadoutName:          string,
  description:          string,
  modifiers: {
    evidenceCapacity:   number (multiplier on max evidence refs per action),
    projectionDepth:    number (multiplier on max projection depth),
    stackResponseTime:  number (multiplier on priority window duration),
    spellPowerMult:     number (multiplier on Power cost/effectiveness),
    stabilityMult:      number (multiplier on stability score),
    crowdInfluenceMult: number (multiplier on how much crowd faction helps you)
  },
  restrictions:         string[] (what this loadout cannot do)
}
```

**Standard classes:**

| Class | Strengths | Weaknesses | Playstyle |
|-------|-----------|-----------|-----------|
| **Advocate** | 2x evidence capacity, 1.5x projection depth | 0.5x spell power, no creature summons | Evidence-heavy, methodical, wins through proof |
| **Battlemage** | 2x spell power, 1.5x creature summons | 0.5x evidence capacity, reduced projection depth | Spectacle-heavy, aggressive, wins through combat drama |
| **Strategist** | 2x projection depth, 1.5x stability | 0.5x stack response time (slower reactions) | Long-game player, wins through complex projections and patience |
| **Duelist** | 2x stack response time (faster), 1.5x counter bonus | 0.5x projection depth, reduced evidence capacity | Reactive player, wins through timing and counterplay |
| **Diplomat** | 2x crowd influence, 1.5x negotiation bonuses | 0.5x spell power, 0.5x combat bonuses | Crowd-reader, wins by leveraging faction support and social dynamics |
| **Wildcard** | 1.0x everything (no bonus, no penalty) | None | Balanced, unpredictable, adapts to any terrain |

Loadouts are selected before the match and visible to the opponent. Knowing your opponent's loadout informs your strategy — but the crowd terrain adds unpredictability. An Advocate in a crowd-voted spectacle-heavy terrain is at a disadvantage. A Battlemage in an evidence-heavy terrain struggles. The interaction between loadout choice and terrain creates deep strategic complexity.

**Loadout discovery follows module discovery (§38).** The six standard loadouts are available from Novice tier. Advanced loadouts (community-designed through Arena Architect tier) unlock through demonstrated competence and community approval.

**Contract #161** and **Contract #162** apply to all sub-sections above. Additionally:

**Contract #163 — Crowd faction registration is visible, changeable, and directly influences match dynamics through collective resonance. Faction influence is capped (Category A parameter, default: +15% maximum bonus) and functions as a modifier, never a determinant. Switching factions reduces influence weight proportionally to switch count. Faction history is a permanent filament on the user's arena branch. Attention-based micro-rewards (Visual Bursts, small EC deposits, crowd effects, Power trickle) are deliberately small per instance and accumulate through sustained performance. Monster difficulty on game layer branches is governed by branch inhabitants through local difficulty parameters within global floor and ceiling bounds. Resource marketplaces use contextual barter pricing with skill-based trading advantages. Arena terrain can be contestant-agreed, crowd-random, or preset-based. Combat loadouts are per-match selections that emphasize different capabilities at the cost of others.**

**Contract #161 — Arena Branches are scoped environments with temporary parameter overrides that never modify core physics equations, custody, or canonical filaments outside the arena scope. The crowd votes on terrain metrics (scoring weights, tempo, complexity, visibility, volatility, evidence standards, procedural parameters) before and during matches. Pre-match terrain is determined by crowd median vote and revealed at match start. Mid-match terrain shifts are rate-limited and continuous. No machine can predict crowd terrain because it is generated by the irreducible collective preferences of the live audience. Stack resolution follows LIFO priority protocol: declare, priority pass, resolve. All arena actions are committed as ArenaContributionPackets with full deterministic replay capability. ArenaCoeffSets are immutable per match window. Arena Points expire when the arena ends. Arena scars, reputation filaments, and achievement tokens persist on the user tree.**

**Contract #162 — Arena reputation (ArenaRep) cannot convert to governance vote weight, organizational confidence, permissions, fiat currency, Power, or any resource that influences the truth or governance layers. ArenaRepGain is computed deterministically from win/loss, stability, confidence, attention, and participation integrity, multiplied by volatility tier and capped daily by opponent diversity. Losing produces reduced but non-zero reputation gain. Anti-farming caps prevent reputation inflation through repeated opponents. Camera-skill training produces ArenaSkillPackets with deterministic scoring from published thresholds. Singleplayer training does not earn reputation — only live matches against real opponents count. Free arenas allow visible alliance formation and betrayal — all social dynamics are on the record and become part of the participant's arena reputation. Arena is entertainment, training, and reputation. It is a lens, never a lever.**

---

## 69. Boundary Editing & Geographic Border Governance — Frozen Contract #164

> *"Good fences make good neighbors."* — Robert Frost

**Prerequisites:** §1 (the globe), §11.6 (global parameter registry), §19 (governance), §29 (proximity channels), §46 (sortition), §33.5 (LOD rendering).

The 375 GeoJSON files in `data/boundaries/` are not static decorations. Geographic boundaries in Relay are **governed objects** — proposable, editable, votable, and committable through the same governance physics that governs everything else. Country borders, state lines, city limits, district boundaries, and custom zones are all mutable through democratic process. The globe's political geography evolves as the world evolves.

### 69.1 Why Boundaries Are Governed

Physical territory shapes governance. Who votes on what is partially determined by where they are (§29 proximity channels, §11.6 geographic scoping). If the boundary of a city changes — a district is annexed, a new municipality is incorporated, a disputed border shifts — the voting population for that scope changes. Boundary changes are governance changes. They must follow governance rules.

### 69.2 Boundary Data Model

Every boundary in Relay is a GeoJSON polygon (or MultiPolygon) with governance metadata:

```
RelayBoundary {
  boundaryId:          string,
  regionType:          enum { COUNTRY, PROVINCE, CITY, DISTRICT, CUSTOM_ZONE },
  name:                string,
  parentBoundaryId:    string | null (hierarchical nesting),
  geometry:            GeoJSON (Polygon | MultiPolygon, with holes supported),
  geometryHash:        SHA-256 (deterministic canonical hash of geometry),
  resolution:          enum { LOW_110m, MEDIUM_50m, HIGH_10m },
  status:              enum { ACTIVE, PROPOSED, HISTORICAL, DISPUTED },
  governanceRef:       branchRef (the governance branch managing this boundary),
  lastCommitId:        commitId,
  lastModified:        ISO-8601
}
```

Boundaries nest hierarchically: cities inside provinces, provinces inside countries, countries inside continents. Every point on the globe belongs to exactly one boundary at each level. Overlap is a governance error that triggers sortition resolution (§46).

### 69.3 The Boundary Edit Pipeline

Modifying a boundary follows a strict state machine — the same DRAFT → PROPOSE → COMMIT pattern used throughout Relay, with additional gates specific to geographic changes:

```
IDLE
  |
  v
DRAFTING — User draws or modifies boundary geometry on the globe
  |        Visual: dashed yellow outline (proposed) vs solid green (current)
  |        Operations: add vertex, remove vertex, drag vertex, undo
  |        Validation: minimum 3 vertices, ring closure, coordinate range,
  |                    NaN guard, geometry hash computed
  |
  v
HOLD — Draft is saved but not yet public
  |     The proposer reviews, refines, prepares evidence
  |
  v
PROPOSED — Draft is published to the boundary governance branch
  |         Visual: proposed boundary appears as dashed yellow overlay
  |         for all users in the affected region
  |         Diff preview: red = territory added, blue = territory removed
  |
  v
VOTING — Hierarchical vote (see §69.4)
  |
  v
COMMITTED — Boundary change takes effect
  |          Geometry hash re-verified (REFUSAL if mismatch)
  |          Custody signature required
  |          Evidence references required
  |          Old boundary becomes HISTORICAL (preserved, never deleted)
  |
  (or)
  v
REVERTED — Proposal rejected, boundary unchanged
           Revert is itself a committed event with evidence
```

**Draft geometry editing:**

Users edit boundaries directly on the 3D Cesium globe through two interfaces:

- **Globe editor**: Click to add draggable pinpoint vertices on the 3D globe. Right-click to delete vertices. Drag to reshape. Selection tools: Single (click), Box (rectangular selection), Lasso (freeform selection), View (inspect without edit).
- **Map editor**: Alternative 2D flat-map interface for users who prefer traditional cartographic editing.

Both editors produce the same GeoJSON output. The geometry hash is computed through deterministic JSON canonicalization (sorted keys, normalized coordinates) so the same vertices always produce the same hash regardless of which editor was used.

### 69.4 Hierarchical Voting — One Level Up

Boundary changes are voted on by the **next level up** in the geographic hierarchy. This prevents self-serving boundary manipulation:

| Boundary Level | Who Votes | Rationale |
|----------------|----------|-----------|
| **District** boundaries | City residents | The city governs its internal districts |
| **City** boundaries | Province residents | The province governs its cities |
| **Province** boundaries | Country residents | The country governs its provinces |
| **Country** boundaries | Region/continent residents | The region governs its countries |
| **Continent/Region** boundaries | All world users | The world governs its regions |
| **Custom zones** | Parent boundary residents | The containing boundary governs custom zones within it |

Each boundary level has one unified **boundary channel** where competing proposals are ranked by vote count. The highest-voted proposal becomes the active boundary when it crosses the approval threshold (Category A parameter, default: 60% of eligible voters who participated).

**Voting display:**

The boundary channel panel shows all active proposals sorted by vote count, with breakdowns:

- Local votes (from residents of the affected boundary)
- External votes (from residents of the parent boundary but outside the affected area)
- Vote trajectory (trending up, stable, declining)
- Visual diff preview: territory gained (red overlay) vs territory lost (blue overlay)

### 69.5 Boundary Modification Types

The system supports both manual editing and algorithmic modifications:

| Modification Type | Description | Use Case |
|------------------|-------------|----------|
| **Manual draw** | User draws new boundary from scratch | New district creation, custom zone |
| **Vertex edit** | User moves, adds, or removes individual vertices | Fine-tuning existing boundary |
| **Expand** | Algorithmic expansion by configurable percentage | Annexation, growth |
| **Contract** | Algorithmic contraction by configurable percentage | Territory cession |
| **Shift** | Algorithmic translation in a compass direction | Border adjustment |
| **Segment adjust** | Modify a specific segment of the boundary while preserving the rest | Localized border dispute resolution |
| **Split** | Divide one boundary into two or more | Municipal incorporation, state division |
| **Merge** | Combine two or more boundaries into one | Consolidation, unification |

All modification types produce a complete proposed GeoJSON geometry with a deterministic hash. The voting process is identical regardless of how the geometry was produced.

### 69.6 Multi-Resolution Streaming

Boundary rendering adapts to zoom level through a streaming service:

| Zoom Level | Resolution | Detail | Use Case |
|-----------|-----------|--------|----------|
| 0–2 (globe view) | 110m | Continent outlines, major country shapes | Global overview |
| 3–7 (region view) | 50m | Country and province boundaries with moderate detail | Regional navigation |
| 8–11 (local view) | 10m | City boundaries, district lines, precise vertex positions | Local governance, boundary editing |

Higher resolutions are loaded on demand as the user zooms in. Pre-chunked boundary tiles enable fast delivery without loading the entire world's geometry at once.

### 69.7 Boundary Containment & Scope Enforcement

Every boundary provides a `containsLL(lat, lon)` function — point-in-polygon query that determines which boundary a given coordinate falls within. This function is used throughout Relay for:

- **Vote scoping**: Determining which users are eligible to vote on which governance parameters (§11.6)
- **Proximity channel assignment**: Linking proximity channels to geographic jurisdictions (§29)
- **Civic enforcement routing**: Routing civic observation filaments to the correct municipal branch (§61.3)
- **Certification region**: Determining which regional certification requirements apply (§58.12)
- **Content classification**: Applying region-specific content rules (§63.4)

Scope enforcement prevents unauthorized boundary changes: if a user's demonstrated scope does not include the affected boundary, the change is refused with `[REFUSAL] reason=SCOPE_VIOLATION`.

### 69.8 Disputed Boundaries

When two or more proposals for the same boundary are active simultaneously and neither reaches the approval threshold, or when the proposals directly conflict (overlapping territory claims), the boundary enters `DISPUTED` status:

- Both proposed boundaries are rendered (dashed yellow and dashed orange)
- The active boundary remains the pre-existing ACTIVE geometry until the dispute is resolved
- Dispute resolution follows sortition (§46) — a jury is drawn from the next level up
- The jury reviews evidence: historical boundaries, population data, infrastructure maps, community testimony
- The verdict becomes a committed boundary change with full evidence chain
- The losing proposal becomes a HISTORICAL record with a scar

### 69.9 How This Connects to Existing Architecture

**§1 (The Globe):** Boundaries are the political layer on the globe. They partition the surface into governed zones. Every trunk that rises from the globe exists within a boundary hierarchy.

**§11.6 (Global Parameter Registry):** Many parameters are scoped to boundaries. A municipal parameter (e.g., enforcement task minimum wage, §61.4) applies within the city boundary. Changing the boundary changes the parameter scope.

**§19 (Governance):** Boundary changes ARE governance commits. They follow the same DRAFT → PROPOSE → COMMIT lifecycle with evidence requirements and custody signatures.

**§29 (Proximity Channels):** Proximity channels are anchored to physical locations. Boundary containment determines which proximity channels fall within which governance scope.

**§46 (Sortition):** Disputed boundaries escalate to sortition resolution. The jury pool is drawn from the next-level-up boundary, consistent with the hierarchical voting model.

**§20 (Cryptographic Architecture):** Geometry hashes provide Merkle-anchored integrity for boundary data. The same vertices always produce the same hash. Any tampering between PROPOSED and COMMITTED states is detected and refused.

**Contract #164 — Geographic boundaries are governed objects that follow the DRAFT → HOLD → PROPOSE → VOTE → COMMIT state machine. Boundary changes are voted on by residents of the next level up in the geographic hierarchy (district changes by city, city by province, province by country, country by region, region by world). Boundary geometry is deterministically hashed; hash mismatch between proposal and commit triggers refusal. All boundary modifications (manual draw, vertex edit, expand, contract, shift, segment adjust, split, merge) produce complete GeoJSON with verifiable hashes. Multi-resolution streaming (110m/50m/10m) adapts to zoom level. Disputed boundaries remain at the pre-existing active geometry until sortition resolution. Old boundaries become HISTORICAL records, never deleted. Boundary containment determines vote scoping, proximity channel jurisdiction, civic enforcement routing, and certification region applicability.**

---

## 70. V93 Retained Systems — Architectural Integration Index — Frozen Contract #165

> *"What is past is prologue."* — William Shakespeare, The Tempest

The V93 codebase (preserved under tag `RELAY-PRE-CLEAN-ARCHIVE-V93`) contained dozens of implemented subsystems. This section ensures every significant v93 system is architecturally accounted for — either as a dedicated section, as a component of an existing section, or as an engineering implementation detail under §48. Nothing is lost. Everything is mapped.

### 70.1 Democratic Messaging & Channels

Relay's communication is not a separate chat app bolted onto the tree. Messaging IS filament creation on shared branches. Every message is a filament. Every conversation is a branch. Every channel is a sub-tree.

**What v93 implemented:** A WhatsApp-like messaging engine with emoji reactions, threading, file sharing, read receipts, forwarding, and democratic moderation (percentile-based filtering where the community's vote distribution determines message visibility).

**Where it lives in the Master Plan:**

- Messages are filaments on proximity channel branches (§29) or organizational branches (§19)
- Threading = branch nesting (§3)
- Reactions = lightweight vote filaments (§7)
- Read receipts = presence markers (§17)
- File sharing = evidence attachments on filaments (§9)
- Democratic moderation = filter tolerances (§12) applied to message branches — the community's vote distribution determines which messages are visible at default filter settings. Messages with low confidence sink. Messages with high confidence rise. No centralized moderator.
- Forwarding = filament reference (evidence twig pointing to the source message filament on another branch)

No separate messaging section is needed because messaging is a direct application of existing tree physics. The v93 implementation details (WebSocket transport, message bubble rendering, typing indicators) are engineering infrastructure (§48).

### 70.2 Notification Pipeline

**What v93 implemented:** Smart notifications with per-user preferences, keyword subscriptions, mention detection, unread tracking, and real-time WebSocket delivery.

**Where it lives:** Notifications in Relay are not a separate system. A notification is a **scheduled filament** (§5b) on the user's personal attention branch that fires when a relevant event occurs on a watched branch. Keyword subscriptions are filter configurations (§12). Mention detection is a specific filament reference pattern. Real-time delivery is engineering infrastructure (§48, WebSocket layer).

### 70.3 Wallet, Payments & Commission

**What v93 implemented:** Unified wallet handling storage payments, channel funding, contract-based job payments, tax documentation, donations, and global commission collection/distribution with founder account transparency.

**Where it lives:**

- Wallets are the economic branch of the user tree (§8), containing TransferPacket filaments (§31)
- Payments follow the double-entry TransferPacket model (§31) — every credit has a debit
- Donations are TransferPackets with `transferType = DONATION` — same accounting, different classification
- Global commission is a Category A parameter (§11.6) — a governed percentage applied to certain transaction types, collected into the platform's operational tree
- Tax documentation is generated from the TransferPacket evidence chain — the Merkle-anchored audit trail IS the tax record
- Founder account transparency is a specific disclosure tier (§8.5) applied to the founder's economic branch

### 70.4 Sybil Enforcement Orchestrator

**What v93 implemented:** End-to-end pipeline: detect anomaly → select jury → conduct review → render verdict → apply trust burn to inviter chain → manage account status → handle appeals.

**Where it lives:** §49 (Adversarial Edge-Case Model) covers the detection and classification. §46 (Sortition) covers jury selection and verdict. The orchestrator is the coordination layer that routes between them. The **trust burn to inviter chain** is architecturally significant and is captured here:

```
TrustBurnCascade {
  violatorUserId:    string,
  violationType:     enum { SYBIL, BOT, FRAUD },
  verdictRef:        commitId (sortition verdict),
  burnChain: [
    { userId: string, relationship: DIRECT_INVITER, burnAmount: number },
    { userId: string, relationship: INVITER_OF_INVITER, burnAmount: number (decaying) },
    ...
  ],
  burnDecayRate:     number (each hop reduces burn by this factor, default: 0.5),
  appealWindow:      duration (default: 14 days)
}
```

When a Sybil account is confirmed, trust burns cascade up the invite chain with decaying severity. The person who directly invited the Sybil account takes the largest trust hit. Their inviter takes half. And so on. This creates a structural incentive to invite only real humans — your reputation is at stake.

### 70.5 Biometric Password Dance

**What v93 implemented:** Multi-modal biometric authentication combining voice + facial gestures ("password dance") with ML-based matching, template storage, and adaptive reverification.

**Where it lives:** §30 (Verification Physics) covers the principle. The concrete mechanism is:

- The user's **password dance** is a unique sequence of facial expressions, head movements, and spoken words that serves as their biometric key
- The dance is captured by the device camera and processed locally (contract #49 — detection mesh local-first)
- ML models (voice recognition + face gesture recognition) compare the live dance against the stored template
- Reverification is triggered by risk assessment: low-risk actions need no re-dance, high-risk actions (large transfers, governance votes, boundary proposals) require fresh verification
- The template is stored encrypted on the user's device and Shamir-shared (§66.1) for recovery — never on central servers

### 70.6 Vote Token Economy & Decay

**What v93 implemented:** Two-phase token system (new users earn tokens through engagement, trusted users get unlimited), multiple decay algorithms, and vote reconciliation across geographic levels.

**Where it lives:** §11 (Parametric Governance) covers the voting mechanism. §41 (Multi-Resource Economy) covers the resource channels. The token economy is a specific implementation of Engagement Credits (§41.1) with these additional mechanics:

- **New user phase**: Fresh accounts receive a limited initial token pool (governed parameter). Tokens are earned through participation (commits, votes, evidence contributions). This prevents Sybil accounts from immediately flooding governance with votes.
- **Trusted user phase**: After demonstrating sustained legitimate participation (trust tier threshold, §46.3), users transition to unlimited voting within their eligible scope. The limit disappears because the user has proven they are real.
- **Vote decay**: Votes cast on governance parameters decay over time (consistent with §14 gravitational time). Recent votes carry more weight than old votes. Decay rate is a Category A parameter. Multiple algorithms are available: linear, exponential, step, custom — selected per parameter type.
- **Geographic reconciliation**: Votes on geographically scoped parameters are reconciled hierarchically using the boundary containment system (§69.7). A vote cast in a city aggregates to province, which aggregates to country, which aggregates to region.

### 70.7 Onboarding, Invite Tree & Temporal Mixing

**What v93 implemented:** Full onboarding flow (invite validation → biometric uniqueness → behavioral baseline → user creation), decaying invite tree, group onboarding, proximity onboarding, and temporal mixing for privacy.

**Where it lives:** §57 (Adoption Tiers) covers integration depth. §58 (Education) covers the tutorial. The onboarding-specific mechanics:

- **Invite tree**: Every user was invited by someone (except the founder). The invite relationship is a committed filament. Invite chains create a tree-within-the-tree — the social trust graph. Trust burns (§70.4) cascade along this graph.
- **Behavioral baseline**: During onboarding, the system collects a behavioral baseline (typing cadence, interaction patterns, device fingerprint) used for continuous verification and anomaly detection. This is stored locally (privacy-first) and used only for self-verification.
- **Temporal mixing**: Invite creation times are batched and shuffled (Fisher-Yates) with timestamp obfuscation to prevent network analysis from correlating who invited whom based on timing patterns. This protects the invite graph from external surveillance.
- **Proximity onboarding**: A new user can be onboarded by physically meeting an existing user (proximity channel verification, §29). This provides the strongest identity assurance — the inviter physically saw the invitee.

### 70.8 Regional Elections & Multi-Sig Treasury

**What v93 implemented:** Democratic elections for 5 regional positions (Governor, Technical Lead, Financial Steward, Community Liaison, Security Officer), multi-signature treasury with 3-of-5 approval threshold.

**Where it lives:** §46.8 (Relay Sortition Council) covers the top-level elected governance. Regional elections extend this model downward:

- Each boundary region (§69) can elect governance officers through continuous confidence voting (same mechanism as the Council, §46.8)
- Regional officers manage the regional treasury — a multi-signature account requiring M-of-N approval for spending (default: 3-of-5)
- Treasury spending proposals are governance commits with evidence requirements
- Weekly transparency reports are published as filaments on the regional governance branch
- The regional governance model is a fractal application of the Council model (§60 fractal branching) — the same governance physics at a smaller scale

### 70.9 P2P Networking & DHT

**What v93 implemented:** Complete P2P networking stack with peer discovery, distributed hash table, connection management, and protocol handling.

**Where it lives:** §48 (Engineering Infrastructure) and §66 (Microsharding). The P2P layer is the transport mechanism for the distributed storage economy:

- **Peer discovery**: Nodes find each other through a combination of bootstrap nodes, DHT announcements, and proximity channel detection (§29)
- **Distributed Hash Table**: Content-addressed storage lookup. Shard manifests (§66.1) reference DHT keys for shard location resolution.
- **Connection management**: Persistent connections to nearby peers (proximity-weighted), ephemeral connections to distant peers (on-demand for shard retrieval)
- **Protocol**: Relay's P2P protocol handles shard transfer, proof-of-storage challenges (§66.3), presence broadcasts (§17), and governance commit propagation

### 70.10 Signal Protocol & End-to-End Encryption

**What v93 implemented:** Full Double Ratchet protocol with forward secrecy, X25519 key exchange, ChaCha20-Poly1305 encryption, and group message encryption.

**Where it lives:** §20 (Cryptographic Architecture). The Signal Protocol is the specific E2E encryption mechanism for private communication:

- All private messages (filaments at `disclosureTier = 0`) are encrypted using the Double Ratchet protocol
- Forward secrecy ensures that compromising a current key does not decrypt past messages
- Group encryption extends the protocol for multi-party branches with shared ratchet states
- Key exchange uses X25519 (Curve25519 Diffie-Hellman) — the same curve used by Signal, WhatsApp, and Matrix
- This is consistent with Contract #150 (private data absolutely uninspectable) — the encryption mechanism that enforces the constitutional boundary

### 70.11 Additional Retained Systems

| V93 System | Master Plan Location | Notes |
|-----------|---------------------|-------|
| Anonymous vote relay (Fisher-Yates shuffle, timestamp obfuscation) | §20 (Crypto), §11 (Governance) | Vote anonymity mechanism — votes are shuffled and batched before recording |
| Censorship resistance (tunneling, proxy chains, domain fronting) | §48 (Engineering) | Network-level mechanisms for operation in censored jurisdictions |
| Risk assessment engine (4-tier scoring) | §30 (Verification), §49 (Adversarial) | Continuous risk scoring triggers appropriate verification levels |
| Guardian recovery (Shamir key share reconstruction with approval timeout) | §48.2.2 (Guardian Contacts), §71.6 (KMS) | Account recovery through trusted human guardians holding Shamir key shares |
| Spatial voter index (H3 hexagonal grid) | §69.7 (Boundary Containment) | Efficient spatial indexing for millions of voters using H3 hexagonal hierarchy |
| Hardware scanning service (Bluetooth/WiFi detection) | §29 (Proximity Channels) | The physical device layer that feeds proximity detection |
| Dictionary/semantic system | §56 (Language Trees) | Word-level semantic linking and multi-language support |
| Developer proposal/bounty system | §46.8 (Council module approval) | Module proposals with bounties follow the sandbox → proposal → vote → council pipeline |
| Content voting/newsfeed | §7 (Social Layer), §12 (Filters) | Content ranking through tree physics replaces algorithmic newsfeeds |
| Trust level tiering (Probationary → Trusted → Verified → Anchor) | §46.3 (Eligibility), §8 (User Tree) | Four trust tiers with accrual mechanics and reverification intervals |
| Bot detection (behavioral scoring) | §49 (Adversarial) | Automated detection feeding into Sybil enforcement pipeline |
| Blockchain sync | §20 (Crypto), §48 (Engineering) | Merkle chain synchronization across distributed nodes |
| Storage pricing governance | §66.5 (Storage Economy) | Community-governed pricing captured in microsharding section |
| Phantom visibility / anonymous mode | §8.5 (Disclosure Tiers) | Tier 0 operation — fully private, no public presence |
| Founder mode / reports | §44 (Founder Key) | Founder-specific transparency and activation mechanics |
| No-dialogue state change rule | §19 (Governance) | Governance constraint requiring prior discussion before state changes |
| Device recovery / management | §70.5 (Biometric), §48.2.2 (Guardian Contacts), §66.4 (Sentinel Vault) | Device loss recovery through biometric re-verification, Shamir key reconstruction via human guardians, and data shard re-replication via sentinel nodes |
| File import / coordination | §37 (Knowledge Migration) | Multi-format file import (Excel, text, binary) converting to filaments |

**Contract #165 — All significant V93 subsystems are architecturally accounted for in the Master Plan. Democratic messaging is filament creation on shared branches with democratic moderation through filter tolerances. Notifications are scheduled filaments on the user's attention branch. Wallets are the economic branch of the user tree using TransferPackets. Sybil enforcement cascades trust burns up the invite chain with decaying severity. Biometric password dance is a multi-modal local-first authentication mechanism using ML voice + facial gesture matching. Vote tokens follow a two-phase model (limited for new users, unlimited for trusted users) with temporal decay and geographic reconciliation. Onboarding uses invite trees with temporal mixing for privacy. Regional elections extend the Council model fractally with multi-signature treasury governance. P2P networking provides the transport layer for distributed storage and presence. Signal Protocol (Double Ratchet with X25519) enforces the cryptographic privacy boundary for private filaments.**

---

## 71. Architectural Clarifications — Frozen Contracts #167–175

> *"God is in the details."* — Ludwig Mies van der Rohe

**Prerequisites:** All prior sections. Each subsection is a binding architectural decision that governs how cross-cutting concerns interact across the system.

### 71.1 Privacy Operates on Available Data Only

§61.1 is absolute. There is no SCV exception for Tier 0 data. The system operates only on what is available at the current disclosure tier.

Child safety mechanisms (§63.3) work with whatever metadata exists at Tier 1+ — interaction frequency on shared branches, public presence patterns, proximity channel events. If an adult-to-minor interaction happens entirely at Tier 0, the system is structurally blind to it. This is by design.

The mitigation is structural, not surveillance:
- All shared branches (community spaces, classrooms, group activities) operate at Tier 1+ by default — so interaction patterns on shared spaces are visible
- Minor accounts under CHILD bracket cannot receive direct private channels from adults (§63.3 already mandates this)
- TEEN accounts can receive DMs, but DM channels between an adult and a teen are visible as branch existence at Tier 1 (the branch exists and its shape is visible; the content inside is Tier 0)
- Pattern detection operates on branch existence and shape metadata, not content

The privacy boundary stands. The child safety system works within it.

### 71.2 All Resources Flow Everywhere

Achievement Tokens, Engagement Credits, and Power can all be earned in any context — truth layer, game layer, arena, education, civic participation. The separation between resource types is about WHAT they unlock, not WHERE they are earned.

- **AT** (Achievement Tokens) = proof of demonstrated skill, regardless of where demonstrated. An arena competitor who demonstrates mastery earns AT. A student who passes certification earns AT. A civic volunteer who completes community work earns AT.
- **EC** (Engagement Credits) = proof of participation and contribution
- **Power** = game layer casting resource

Achievement tokens can be earned through SCV-validated achievements in any context — truth layer real-world actions, arena performance, education certification, civic contribution. The validation requirement (SCV-verified evidence) remains non-negotiable. Virtual-only engagement without demonstrated skill or validated evidence yields only engagement credits. The gradient is: skill-validated effort → AT, participation → EC, game casting → Power.

All resources can be traded within Relay's economy. The "no resource conversion" rule (Contract #47) applies specifically to resource TYPE conversion (EC→AT, AT→Power, etc.) — you cannot convert one resource type into another. Trading game layer items, objects, and marketplace goods (§68.16) denominated in EC is permitted. The marketplace trades items, not resource types.

### 71.3 Audience Resolution — Unified Duel & Arena Model

Duels (§42) and arena matches (§68) are the same system, not two systems. The audience IS the resolution mechanism.

In duels and court cases, rules are determined and agreed upon up front. The audience then influences the outcome through votes and environmental metrics. The stack resolution protocol (§68.3) computes deterministic scoring from evidence quality, spectacle, and crowd metrics — the crowd metrics ARE the audience vote, flowing continuously into the resolution calculation.

**How it works:**
- Contestants agree on rules before the match: duration, stakes, topic scope, terrain mode (agreed/crowd-random/preset), and whether audience influence is toggled ON or OFF
- When audience influence is ON: the crowd's aggregate voting on terrain metrics directly weights the scoring calculation. If you are in an area where people don't like you, you will probably lose based on the crowd vote alone regardless of your performance
- When audience influence is OFF: scoring is computed from evidence quality, stability, and heat only — no crowd component
- **This is fair.** A local area is governed by the locals. They have priority in their area. You are a tourist. If you want a neutral fight — go to a Global Arena where crowd composition is diverse and no faction has home advantage

**The audience toggle is the key rule attribute.** It must be explicitly set when defining match terms. Duels with the toggle ON are social accountability mechanisms — being disrespectful in real life has consequences. You can be challenged. You will lose resources or public opinion. You will be shamed. This incentivizes manners in the videotaped real world.

§42 describes the audience model in narrative terms. §68 formalizes the scoring calculation. The "audience votes on who convinced them" IS the crowd terrain metrics feeding into the `ArenaContributionPacket` scoring weights. §42 is the user-facing explanation; §68 is the implementation specification.

**Pre-activation vs post-activation:** Before game layer activation (§44), duels use the evidence-debate format only (no spells, no creatures, no element casting). After activation, the full arena system engages. All duels occur within arena branches.

### 71.4 Latest-Write Display Within Append-Only

Both commits are always preserved (append-only is absolute). The `LATEST_DISPLAY` conflict resolution mode is a display policy, not a data policy.

When two offline users commit to the same filament and sync later:
1. Both commits are accepted into the Merkle chain (append-only, Contract #1 holds)
2. Both carry their local timestamps and are hash-linked to their predecessors
3. The `conflictResolution` strategy determines **which commit is displayed as the default view**: `LATEST_DISPLAY` shows the most recent timestamp as the primary view, `MERGE` presents both inline, `MANUAL_REVIEW` flags for human decision
4. The non-displayed commit is always accessible through the filament's full commit history

No data is ever overwritten or discarded. `LATEST_DISPLAY` clarifies that it is a rendering preference, not a data operation.

### 71.5 Audience Impact as a Toggled Rule Attribute

In all arenas, duels, and court cases, the degree of audience influence on the outcome is a toggleable attribute that must be explicitly agreed upon when defining the rules.

**For duels:** Audience influence is either ON or OFF. When ON, crowd terrain metrics feed into scoring. When OFF, resolution is evidence-only.

**For court cases:** Jury operating parameters (size, deliberation time, verdict threshold, blind jury mode) are NOT crowd-votable. They are governance-level sortition parameters (§46) set by §11 weighted-median governance. The crowd can influence ATMOSPHERE (tempo, complexity, presentation style) but NOT procedural justice parameters. Jury size, verdict threshold, deliberation time, and evidence standards remain §46 governance defaults.

**Governance floor rule:** Governance-level parameters (§11) cannot be overridden by crowd voting. Minimum deliberation time, minimum jury size, and evidence standards all have governance-enforced floors that crowd terrain voting cannot breach. Crowd voting adjusts the experience within bounds; it never overrides the constitutional framework.

### 71.6 Key Management System

The Key Management System (KMS) is the subsystem responsible for creating, storing, distributing, rotating, and destroying content encryption keys (CEKs) and their Shamir shares (a method of splitting a secret key into multiple pieces so that a minimum number of pieces are needed to reconstruct the original).

```
KeyManagementSystem {
  scope:                  enum { USER_LOCAL, BRANCH_SHARED, TREE_GLOBAL },
  cekGeneration:          AES-256-GCM (per-filament or per-shard-group),
  cekStorage:             LOCAL_KEYCHAIN (never transmitted unencrypted),
  shamirSplitting: {
    threshold:            number (K-of-N reconstruction minimum),
    totalShares:          number (N total shares distributed),
    shareDistribution:    enum { GUARDIAN_CONTACTS, SENTINEL_NODES, HYBRID }
  },
  keyRotation: {
    trigger:              enum { TIME_INTERVAL, SECURITY_EVENT, MANUAL },
    rotationInterval:     number (days, configurable per tree policy),
    forwardSecrecy:       boolean (true — old keys cannot decrypt new content)
  },
  keyDestruction: {
    trigger:              enum { USER_REQUEST, LEGAL_ORDER, COPPA_ERASURE, GDPR_ART17 },
    mechanism:            CEK destruction → all encrypted shards become tombstones,
    auditTrail:           CryptographicErasureEvent committed to Merkle chain (§65.1)
  },
  recoveryPath: {
    shamirReconstruction: K-of-N guardian/contact shares → reconstruct CEK,
    biometricFallback:    Password Dance (§70.5) → re-derive device-local keys,
    timeoutPolicy:        Guardian shares must respond within configurable window (default: 72h)
  }
}
```

**Guardian vs sentinel disambiguation:**
- **Guardian contacts** (§48.2.2): Trusted HUMANS who hold Shamir key shares for account recovery
- **Sentinel nodes** (formerly "guardian nodes" in §66.4): High-reputation STORAGE PROVIDER machines that hold emergency backup data shards

These are different systems. Guardian contacts hold KEY shares. Sentinel nodes hold DATA shards.

### 71.7 Final Commit for Closures and Broken Items

When anything in Relay stops being used — an account closes, a device fails, a storage provider goes offline, a shard manifest becomes stale — the final action is a **closure commit** on the chain the item belongs to.

**Closure commit mechanics:**
- A closure commit is a standard filament commit with `lifecycleState: CLOSED` and a `closureReason` field
- For stale `ShardManifest`: when shards are re-replicated to new nodes, a new `ShardManifestUpdate` commit is appended referencing the original manifest's hash and recording the new shard locations. The original manifest remains (append-only), the update commit carries the current routing
- For account closures: a `AccountClosureCommit` is appended to the user tree root, marking the tree as closed. All associated CEKs follow the key destruction path (§71.6). Merkle chain entries become tombstones — hash preserved, content unreadable
- For device loss: a `DeviceLossCommit` triggers guardian recovery (Shamir reconstruction) and shard re-replication for any shards that were unique to that device
- For storage provider failure: a `ProviderFailureCommit` triggers automatic re-replication (§66.3) and a manifest update commit

**The principle:** Nothing disappears silently. Every ending is a commit.

### 71.8 Entity Privacy, Materiality & Tree Anchors

On the globe LOD (level of detail — how much visual information is shown at different zoom levels), the world has privacy-appropriate materiality objects. Companies classified as certain types have standardized tree anchor types so viewers can quickly identify what they are:

**Anchor classification:**
- Banks, financial institutions → financial anchor type
- Supermarkets, retailers → commercial anchor type
- Hospitals, clinics → medical anchor type
- Schools, universities → educational anchor type
- Government offices → civic anchor type
- Residential → personal anchor type

Anchor types are assigned through template selection when creating the tree. The anchor type determines the tree's visual silhouette on the globe — recognizable category shape without revealing internal details.

**Inside vs outside:**
- **Owners and employees** (users with branch-level access) see inside their own tree — branches, filaments, twigs, internal health metrics. This is the operational view.
- **Clients and customers** (external users) see only the outside anchor tree — the public-facing exposed filaments that the company has chosen to publish. Like a personal presence profile (§8.6), companies control what the world sees.
- **Discovery of unfinished work** (twigs, open filaments, internal issues) happens at the ownership level only. External users do not see internal twigs.

**Tree anchor appearance on the globe scale** is determined by average attention rates — how much interest the entity attracts. Higher attention = more prominent rendering at globe LOD.

**Exposure rules:**
- Exposed filaments from other people (counterparties, employees) on a company tree only show their shapes if those people have agreed to be visible on that branch. Otherwise, counterparty identity is anonymous.
- Nothing exposes without justification and need
- What you expose on your public-facing tree is exactly like your personal presence profile — you choose what to show, at what tier, for what context

### 71.9 Privacy Granularity — Per Filament, Per Branch, Per Tree

Privacy disclosure operates at three granularity levels:

| Level | What It Controls | Who Sets It |
|-------|-----------------|-------------|
| **Per filament** | Individual filament disclosure tier (0, 1, or 2) | The user who committed the filament, at commit time |
| **Per branch** | Default disclosure tier for all filaments on a branch | Branch owner/template policy |
| **Per tree** | Default disclosure tier for the entire tree | Tree owner |

**Inheritance:** Filament tier overrides branch tier. Branch tier overrides tree tier. The most specific setting wins.

**Direction rule:** Disclosure can only be RAISED (made more visible) from the default, never LOWERED below the level at which data was committed. A PresenceProfile (§8.6) can SUPPRESS visibility (hide branches from your broadcast), but it cannot EXPOSE data beyond its committed tier. Profiles are one-way filters: they reduce what others see, they never increase it.

**Canonical tier definitions:**
- **Tier 0:** Private. Invisible to all external observers. Contributes to aggregate tree shape but content/identity/counterparty hidden.
- **Tier 1:** Semi-public. Branch shapes visible, individual filaments visible as shapes without content detail. Role badge identity.
- **Tier 2:** Fully public. Named identity, individual filament content inspectable by authorized parties.

§17.2 describes the consent mechanism for tier transitions. §48.2 describes registration requirements per tier. Tier 1 IS a gradation of visibility — viewers at Tier 1 see shapes but not content. "Fully inspectable" means: at whatever tier data is committed, it is inspectable to the FULL extent of that tier. Tier 1 data is fully inspectable at the Tier 1 level (shapes, metadata). Tier 2 data is fully inspectable at the Tier 2 level (content, identity).

### 71.10 Credentials Are Your Commit Record

Credentials are simply your proven record of commits, all held with high confidence at the time committed by people who themselves held high confidence at the time. Relay's certification model is not a "certificate" in the traditional sense — it is a confidence-verified commit chain on your tree that proves demonstrated competence.

There is no external degree, no paper diploma, no institution-issued certificate. There is only the tree. The tree IS the credential. An employer looking at your user tree sees demonstrated modules, grading commits from high-confidence teachers at the time of grading, and the structural shape of your learning branch. That is the resume.

**Profile reveal for employment:**

Settings within Relay enable you to view your own full tree or any of your presence profiles. You control what you show, when, and where.

An employer might require you to reveal your tree at a specific disclosure level. Even without seeing individual filament content, an employer can observe:
- The structural difference between your full tree and a filtered profile. If you flip between modes, they see that only 3-6% of the tree differs between baseline and Profile 1.
- An employer could request a threshold: "Show me 85% of your tree." A job description could state: "60% tree reveal required."
- The percentage represents how much of your tree's branch structure and shapes are visible — not filament content. It gives employers enough to assess breadth, depth, and consistency without exposing private details.
- It is up to you to classify your life properly and organize your profiles to impress. Infinite organization levels — how you arrange your branches, what you emphasize, what you suppress — all visible through tree shape, all under your control.

### 71.11 Storage Is Natural + Marketplace Is Additional Service

Data moves naturally in Relay using the best available method. The storage architecture has two layers:

1. **Natural layer (core Relay):** Data flows through the Merkle chain (§48) with federation handling chain metadata/ordering and microsharding (§66) handling encrypted content payloads. This is Relay's native data movement.

2. **Marketplace layer (additional service):** People with many storage devices can sell their storage space to others at cheaper rates than commercial data centers. This is the §66.5 storage economy — an optional marketplace running on top of the natural storage layer. Users who want more redundancy or cheaper storage can participate. Users who don't care can rely on the natural layer.

**Federation vs microsharding boundary:** The Merkle chain (a tamper-proof linked list of data hashes — ordering, hashes, sequence numbers) is maintained by federation nodes (§48.4.3 Layer 5). Encrypted content payloads are microsharded (split into small encrypted pieces spread across many machines) across P2P nodes and marketplace providers (§66.1). The chain tells you WHAT exists and in what order. The shards contain the actual data.

### 71.12 Arena Votes Are Continuous Sliders

Arena crowd votes are NOT one-time tokens. They are continuous slider bars of attributes.

Each user in the proximity channel + viewing area has a personal panel with attribute sliders. A user lowers cloud coverage, another raises wind intensity, another shifts scoring weight toward evidence. Each slider position is aggregated with everyone else's in real-time using the median calculation (§68.5). The aggregate then manifests as the arena's terrain state.

Example: The crowd collectively shifts weather conditions. A water wizard gets assistance because the crowd likes water magic. A fire mage gets hindered because the crowd shifted rain coverage up. It flows based on what is happening.

Arena crowd voting does NOT consume vote tokens (§70.6). Vote tokens apply only to §11 parametric governance voting. Arena sliders are free, continuous, real-time interaction. They are closer to a dimmer switch than a ballot.

### 71.13 Voting Is Always Live

There are no elections in Relay unless a duration has been explicitly set. Even when duration is set, voting is a LIVE process. You can change or modify your vote whenever you want. The weighted-median settlement (where all votes are ranked and the middle value becomes the result) is continuous — it recalculates as votes change, enter, or decay.

**Boundary voting (§69.4):** Boundary proposals are live. The 60% threshold is continuously computed. A proposal that was at 55% approval yesterday might be at 62% today as more people vote. There is no "election day." The threshold is crossed when it is crossed. Proposals that never reach threshold eventually decay.

**Duration locks:** Once durations and other match parameters are locked up front (having survived the buffer time and solidified into committed rules), you cannot change them unless you perform the same buffer process to change the original parameter. If the crowd votes to shorten a duration mid-process, whoever is working within that time is influenced to work faster or cut the job short — because that is what is being voted on. If the crowd sees the solution before the participants, they don't wait.

### 71.14 External Systems Coexistence

Trading objects that have powers, attributes, and game-layer properties is real and can happen, but it is all denominated in the same resource economy. Cash (fiat currency) remains external to Relay. Other things remain external entities, even if processed through Relay (payment gateways, bank transfers, etc.).

There will be separated Relay systems running independently — like hidden branches of government or classified corporate operations in the real world that still benefit from the system's organizational structure. This is fine and does not contradict Relay. Relay enables the existing 2D world to live as-is, with better tree organization for business practices. Over time, society will determine how much of that should change.

"No mechanism may convert one resource TYPE to another" (Contract #47) stands. EC cannot become AT. AT cannot become Power. But trading game-layer items (weapons, spells, marketplace goods) denominated in EC is trading items, not converting resource types. The marketplace (§68.16) trades objects, not resources.

### 71.15 Decay Rules Are Context-Dependent

Authorization tokens, initial invite trust, governance votes, and other time-sensitive values decay (lose strength) over time. The decay model varies by context:

| Context | Decay Model | Rationale |
|---------|-------------|-----------|
| **Governance parameter votes (§11)** | Exponential, 30-day half-life | Ensures active participation; old votes naturally lose weight |
| **Invite trust cascade (§70.3)** | Exponential with distance | Trust degrades down the invite chain |
| **Certification teacher score (§58.11)** | Linear quality decay without fresh evidence | Teachers must continuously prove competence |
| **Arena matches** | No decay — matches last the duration | A match is a bounded event; its outcome is permanent |
| **Arena crowd slider positions** | Session-only — reset when match ends | Crowd influence is ephemeral |
| **Branch boundary proposals (§69)** | Slow decay if threshold not reached | Prevents zombie proposals from lingering indefinitely |
| **Filament confidence** | No decay — evidence-based, permanent unless contradicted | Confidence comes from evidence, not time |

Votes lose weight over time. The default decay model for governance parameter votes is exponential with a 30-day half-life (after 30 days, a vote has half its original weight). Other contexts may use different decay models (linear, step, bounded) as specified per context.

### 71.16 Arena Metrics Are Fixed Before Battle

All arena metrics — scoring weights, terrain mode, audience influence toggle, duration, stakes, scar permanence, combat loadout restrictions — are fixed before the battle begins. The pre-match configuration phase (§68.5) produces a committed `ArenaCoeffSet` that is immutable for the duration of the match.

Mid-match crowd sliders (§71.12) adjust atmospheric parameters (weather, visibility, tempo) within the bounds set by the pre-match configuration. They cannot change the structural match rules (scoring formula, duration, stakes).

**Scar permanence:** Default is ARENA_ONLY (scars exist within the arena branch and don't persist on user trees). If pre-match rules explicitly set `scarPermanence: PERMANENT`, then scars persist on the user tree. This must be agreed to by all contestants before the match begins.

### 71.17 Terminology Reference

| Old Term | New Term | Reason |
|----------|----------|--------|
| `ArenaClass` (§68.19) | `CombatLoadout` | "Class" already means element affinity (§40.6). Loadout is per-match, class is permanent. |
| Guardian nodes (§66.4) | Sentinel Nodes | "Guardian" already means trusted human contacts (§48.2.2). Sentinel = storage provider nodes. |
| `LAST_WRITE_WINS` (§66.7) | `LATEST_DISPLAY` | Append-only means nothing "wins" — both preserved. This is a display preference. |
| `proximityZoneRef` (§8.6) | Defined as: `{ zoneType: enum { PROXIMITY_CHANNEL, GEOFENCE, BRANCH_CONTEXT }, zoneId: string }` | Was undefined. Now references §29 proximity channels or geographic boundaries (§69). |
| `branchRef` (used 11+ times) | Defined as: `string` — the branch's stable `layoutKey` (§3.18 identity hash) | Was never formally typed. |
| "attention branch" (§8.6) | The user tree's implicit system branch that logs profile switches, notification events, and attention metrics | Was missing from §8.1's branch list. It is not a manually created branch — it is a system-generated branch on every user tree, like the economic branch. |
| "preference filaments" (§8.6) | Standard filaments with `filamentType: PREFERENCE` — lifecycle is COMMITTED immediately, never OPEN/ACTIVE. Subject to same physics. | Was undefined sub-type. |
| `Base` in ArenaRepGain (§68.10) | Defined as: a global parameter (Category A, default: 10.0) — the base reputation points available per match before multipliers | Was unimplementable without this. |
| `TRAINING_TOKEN` (§68.16) | A marketplace item that grants access to one training session in a specific arena discipline | Was undefined. |
| `minimum viable shard count` (§66.8) | The minimum number of data shards required to reconstruct the original content via Reed-Solomon. For a 5+2 tier: 5 data shards minimum. | Was undefined. |
| Voter eligibility tier → weight (§11.4) | Weight = `1.0` for all eligible voters. Eligibility gates (§7.4, §11.5) determine WHO can vote. Once eligible, all votes carry equal weight. Differential influence comes from decay (recent votes matter more) and branch participation depth (§56), not from an opaque tier-to-weight mapping. | Was a black box. |

### 71.18 Engagement Feedback Design Principles

The engagement feedback system is legitimate game design — skill → mastery → challenge → reward — not a dark pattern. The distinction:
- No pay-to-win (resources come from participation, not purchase)
- No artificial scarcity (no limited-time-only items, no FOMO mechanics)
- No gambling (no loot boxes, no random reward magnitudes)
- No hidden manipulation (all scoring weights are visible, all terrain is transparent)

The mechanism — frequent, small, visible rewards for sustained performance — is transparent and opt-in, not exploitative. §68.12 ("The Engagement Feedback Loop") and §68.18 ("The Micro-Reward Feedback System") detail the implementation.

### 71.19 Zero RPO Qualification & Offline Durability
- **Zero RPO** applies to network-committed data only. Once a filament is committed and synced to the distributed network, it exists on multiple nodes and has zero risk of loss.
- **Offline commits** have local-device-only durability until sync. If the device is destroyed before connectivity is restored, those commits are lost. This is inherent to any offline-first system and is disclosed to users.
- **"Full functionality" offline** is amended to: "Full functionality for the local working set." The bandwidth degradation table (§66.7) accurately describes what degrades at each level. "Full" applies to the cached working set, not to network-dependent features.

### 71.20 LOD Inverse-Scaling — Fisheye Focus Within Basin

When drilling into a branch or filament, the focused element expands in place while the rest of the tree proportionally compresses. The entire tree remains visible within the same basin boundary, never overlapping adjacent trees or basins.

**Mechanics:**
- At TREE LOD: the full tree renders normally — trunk, major branches as silhouettes, timebox cross-sections as ring bands
- As the user drills into a specific branch: that branch expands (higher polygon count, more internal detail, individual filaments become visible), while sibling branches and the trunk proportionally compress toward the tree's central axis
- At BRANCH LOD on the focused branch: the focused branch occupies the majority of the tree's basin area. Other branches are visible as compressed summary forms — still shaped correctly, still showing their aggregate health, but using minimal primitives
- At BARK/SHEET/CELL LOD: the focused filament or cell takes primary visual space. The rest of the branch compresses. The rest of the tree compresses further. But the tree silhouette is always visible as context

**Inverse-scaling rule:**
```
focusScale = baseLODScale × (1 + drillDepth × expansionFactor)
contextScale = baseLODScale × (1 / (1 + drillDepth × compressionFactor))
basinConstraint: focusScale + contextScale ≤ basinRadius (always)
```

**Why this works:**
- You always see where you are relative to the whole tree
- You never lose spatial context when drilling deep
- Adjacent trees and basins are never affected — the inverse scaling is entirely internal to the focused tree's basin
- It mirrors natural vision: when you focus on a leaf, the tree is still in your peripheral vision, just blurry

This is additive to the existing LOD system (§33). It does not replace distance-based LOD — it augments it with attention-based LOD within a single tree's basin.

---

**Contract #167 — Privacy operates only on available data. No SCV, governance mechanism, or system process can inspect Tier 0 data under any circumstance, including child safety. Child safety mechanisms work within the disclosure tier framework using metadata available at Tier 1+ on shared branches. §61.1 is absolute and has no exceptions.**

**Contract #168 — All resource types (Achievement Tokens, Engagement Credits, Power) can be earned in any context — truth layer, game layer, arena, education, civic participation. The validation requirement (SCV-verified evidence for AT) remains. Resource TYPE conversion (EC→AT, AT→Power) remains prohibited. Item trading denominated in EC is permitted. Cash and external financial systems remain external entities.**

**Contract #169 — Audience resolution in duels, arenas, and court cases operates through continuous crowd slider aggregation feeding into deterministic scoring calculations. Audience influence is a toggleable rule attribute agreed upon before each match. Local areas are governed by locals — home advantage is fair. Global arenas provide neutral ground. Arena metrics (scoring weights, terrain, duration, stakes, audience toggle) are fixed before battle and immutable for the match duration. Mid-match crowd sliders adjust atmospheric parameters within pre-match bounds only.**

**Contract #170 — Append-only is absolute. Both commits are always preserved. `LATEST_DISPLAY` is a rendering preference that shows the most recent commit as the default view. No commit is ever overwritten, discarded, or hidden. Every ending (account closure, device loss, provider failure, manifest staleness) produces a closure commit on the relevant chain.**

**Contract #171 — Jury operating parameters (size, deliberation time, verdict threshold, evidence standard) are governance-level sortition parameters (§46) set through §11 weighted-median governance. Crowd terrain voting in arena court cases is restricted to presentation and atmospheric parameters only. Governance floors cannot be breached by crowd voting.**

**Contract #172 — Key Management System: CEKs are generated per-filament or per-shard-group using AES-256-GCM, stored in user-local keychains, split via Shamir's Secret Sharing with K-of-N threshold reconstruction. Key shares are distributed to guardian contacts (humans) or sentinel nodes (storage providers) depending on recovery policy. Key rotation, destruction (for cryptographic erasure), and recovery (via Shamir reconstruction or biometric fallback) follow the KMS specification.**

**Contract #173 — Entity trees on the globe have standardized anchor types for materiality classification. Owners and employees see inside the tree; external users see only the public-facing anchor with exposed filaments chosen by the entity. Counterparty filament shapes are visible only with the counterparty's consent. Tree anchor prominence at globe LOD is determined by average attention rates. Nothing exposes without justification and need.**

**Contract #174 — Privacy disclosure operates at three granularity levels: per filament, per branch, per tree. The most specific setting overrides broader defaults. Disclosure can only be raised (made more visible), never lowered below the committed level. Presence profiles (§8.6) suppress visibility but cannot expose beyond committed tier. Credentials are the proven record of commits with high confidence at the time of commitment. Profile reveal percentages enable employers to request a specific proportion of tree visibility without accessing individual filament content.**

**Contract #175 — LOD inverse-scaling: when drilling into a branch or filament, the focused element expands while the rest of the tree proportionally compresses. The entire tree remains within its basin boundary. Adjacent trees and basins are never affected. The tree silhouette is always visible as context regardless of drill depth. This augments distance-based LOD (§33) with attention-based LOD within a single tree's rendering basin.**

---

## 72. Layered Option Governance — Bottom-Up Ballot Creation — Frozen Contract #176

> *"The ballot is stronger than the bullet."* — Abraham Lincoln

**Prerequisites:** §11 (parametric governance), §26 (frozen contracts).

Before anyone can vote on a decision, the community first votes on what the options should be. This is the meta-voting layer — the principle that options are never handed down from above, they are built from below.

### 72.1 Why This Exists

In traditional systems, someone at the top decides what appears on a ballot. In Relay, the ballot itself is a community product. What should a region's educational curriculum include? What professions belong on the tutorial master list? Which candidates should be eligible to lead a governance scope? These questions cannot be answered by one person or one committee. The community decides what the choices are before the community decides which choice wins.

### 72.2 Two-Stage Voting

Every governance decision with a list of options follows two stages:

**Stage 1 — Meta-Vote (Option Approval):** Anyone can propose an option. The community votes on whether that option should appear on the ballot. Proposals that fail the meta-vote never reach the substantive vote. This uses the same §11 weighted-median infrastructure — the meta-vote is just a governance parameter with a binary outcome (approved / not approved) and a configurable threshold.

**Stage 2 — Substantive Vote (Decision):** Once the option list is settled, the community votes on which option wins. Standard §11 weighted-median mechanics apply.

### 72.3 Escalating Scrutiny

The scope of impact determines the scrutiny required at the meta-level:

| Impact Scope | Meta-Vote Quorum | Buffer Period | Example |
|-------------|-----------------|---------------|---------|
| Local branch | Branch participants | 24h | Adding a menu item to a restaurant's order flow |
| Organization | Org-scope voters | 72h | Adding a department to a company template |
| Regional | Regional-scope voters | 7 days | Adding a subject to a regional school curriculum |
| Global | Global-scope voters | 30 days | Adding a profession to the universal tutorial master list |

Higher impact = more voters required = longer buffer before the option list solidifies. This prevents capture by small groups on high-impact decisions.

### 72.4 Recursive but Bounded

The meta-vote rules are themselves votable parameters. The threshold required to approve an option onto a ballot? Votable. The buffer period? Votable. The quorum requirement? Votable.

**Recursion floor:** Frozen contracts (§26) cannot be voted away. The recursion stops at the constitutional level. You can vote to change the rules for changing the rules — but you cannot vote to remove the requirement that rules exist.

### 72.5 Bottom-Up Enforcement

Nothing appears on a voting list without passing the meta-vote. A controversial curriculum topic cannot simply be placed on the list — it must survive community approval to even become an option. This applies to:

- Political candidacy within governance scopes
- Educational curriculum contents (§58)
- Tutorial master list categories (§73)
- Arena preset configurations (§68)
- Certification requirements (§58.12)
- Template library additions (§76)
- Any governance decision involving a list of options

### 72.6 The Initial Seed List

For any new domain, Relay creates an initial seed list. Like candidates running for office, the initial options are proposed by the domain creator and immediately subject to meta-vote. The community can add, remove, or reorder options from the moment the list exists. Nothing is permanent without continued community support.

### 72.7 The 4-Layer Model — Minimum Viable Recursion

The two-stage model (§72.2) is the simplified explanation. The full constitutional engine has four layers — enough to prevent both "random crowd hijacks curriculum" and "teachers lock the syllabus forever":

| Layer | What You Vote On | Output |
|-------|-----------------|--------|
| **Layer 0 — Item Vote** | The actual decision: parameter value, teacher ranking, policy choice, arena rule, curriculum item | Governance commit (settled value) |
| **Layer 1 — Ballot Eligibility Vote** | "Should this item be allowed on the ballot at all?" | `ALLOW` / `DENY` / `DEFER` |
| **Layer 2 — Eligibility Rule Vote** | The rules that define who can participate in Layer 1 and Layer 0 | `EligibilityRuleSet` (who qualifies, what quorum, what threshold) |
| **Layer 3 — Audit & Escalation Vote** | Audit triggers, dispute thresholds, and when sortition (§46) is invoked as circuit breaker | Escalation to sortition or rule amendment |

**Layer 0** is the familiar §11 parametric vote. **Layer 1** gates what reaches Layer 0. **Layer 2** governs who gates. **Layer 3** is the circuit breaker — if Layer 1 or 2 deadlocks, sortition decides.

### 72.8 Core Objects

Three schemas implement the 4-layer model:

**1) BallotItem** — A proposed option waiting for eligibility determination:

```
BallotItem {
  ballotItemId:     string ("ballot.<scope>.<slug>"),
  scopeRef:         enum { TREE, BRANCH, TEMPLATE, REGION, GLOBAL },
  itemType:         enum { PARAM, CURRICULUM, TEACHER, ARENA_RULE, POLICY,
                           TEMPLATE_ADDITION, CERTIFICATION_REQ },
  proposedBy:       userRef | scvRef,
  createdAt:        timestamp,
  payloadHash:      string (sha256 of the proposed content),
  status:           enum { PENDING, ELIGIBLE, DENIED, EXPIRED },
  denialReason:     string | null
}
```

**2) MetaVotePacket** — A vote at Layer 1, 2, or 3:

```
MetaVotePacket {
  metaVoteId:       string ("metavote.<uuid>"),
  layer:            number (1, 2, or 3),
  ballotItemId:     ballotItemRef,
  voterId:          userRef,
  choice:           enum { ALLOW, DENY, DEFER },
  weight:           number (0.0..1.0, from §11 decay model),
  eligibilityProof: {
    ruleId:         eligRuleRef (→ EligibilityRuleSet),
    proofRefs:      filamentRef[] (filaments proving qualification)
  },
  timestamp:        timestamp
}
```

**3) EligibilityRuleSet** — Layer 2 output defining who can participate:

```
EligibilityRuleSet {
  eligRuleId:       string ("eligRule.<scope>.<version>"),
  scopeRef:         branchRef | templateRef | regionRef | "global",
  appliesTo:        enum[] { L0_ITEM_VOTE, L1_BALLOT_VOTE },
  requirements: {
    minTier:                number (minimum disclosure tier, default: 1),
    minAgeDays:             number (account age, default: 30),
    minDomainCommits:       number (commits in the relevant domain, default: 10),
    minEvidenceCommits:     number (evidence-backed commits, default: 3),
    recencyHalfLifeDays:    number (participation recency weighting, default: 90),
    conflictOfInterestRules: string[] (e.g., "sameInviteCluster", "directCounterparty")
  },
  ratification: {
    quorum:                 number (0.0..1.0, fraction of eligible voters, default: 0.30),
    approval:               number (0.0..1.0, approval threshold, default: 0.65),
    settlementWindowHours:  number (how long threshold must hold, default: 24)
  }
}
```

### 72.9 Deterministic Settlement Rules

Layer 1 settlement uses the same mechanics as §11 governance with three additions:

1. **Settlement window + hysteresis:** A ballot item becomes ELIGIBLE only when Layer 1 approval holds above the threshold for the full settlement duration. Brief spikes above threshold do not count — the approval must be sustained, preventing flash-mob manipulation.

2. **Hard gate on Layer 0:** Layer 0 votes are ignored if the ballot item's status is not ELIGIBLE. The system enforces this structurally — you cannot cast a vote on an item that has not passed the eligibility gate. Attempting to do so produces a REFUSAL, not a silent drop.

3. **Sortition circuit breaker (Layer 3):** If Layer 1 or Layer 2 is deadlocked (neither approval nor denial reaches threshold within a configurable timeout), Layer 3 triggers sortition (§46). A randomly selected jury of qualified participants makes the decision. This prevents permanent gridlock while maintaining democratic legitimacy.

### 72.10 Visual Encoding on the Tree

Ballot eligibility renders as a ring band on the governance branch:

| Band Color | Meaning |
|-----------|---------|
| **Green band** | Eligible — item has passed Layer 1 and is available for Layer 0 voting |
| **Amber band** | Pending — settlement window is running, threshold has been reached but not yet sustained |
| **Red crack** | Denied — scar-like visual indicating the community rejected this option |
| **Pulsing amber** | Deadlocked — Layer 3 sortition is being assembled |

Meta-vote activity generates heat (rate of governance activity) on the governance branch, but governance heat cannot change truth-layer branch physics. Any "who decided we can decide" action is clickable to a one-sentence explanation (Contract #83 — one-click audit trail).

**Contract #176 — Before any substantive vote with a list of options, the community votes on what the options should be (meta-vote) through a 4-layer constitutional engine: Layer 0 (item vote), Layer 1 (ballot eligibility), Layer 2 (eligibility rules), Layer 3 (audit/escalation via sortition). Core objects: BallotItem, MetaVotePacket, EligibilityRuleSet. Settlement requires sustained threshold approval with hysteresis. Layer 0 votes are hard-gated behind Layer 1 eligibility. Deadlocked layers trigger sortition circuit breaker. Meta-vote rules are themselves votable parameters. Recursion floor = frozen contracts. Escalating scrutiny requires wider participation for wider-impact decisions. Nothing appears on a ballot without community meta-approval. The initial seed list for any new domain is immediately subject to community governance. Visual encoding: green (eligible), amber (pending), red crack (denied), pulsing amber (deadlocked/sortition).**

---

## 73. Universal Onboarding — Three Pillars — Frozen Contract #177

> *"Tell me and I forget. Teach me and I remember. Involve me and I learn."* — Benjamin Franklin

**Prerequisites:** §1 (the globe), §8 (user tree), §37 (knowledge migration), §58 (education), §72 (layered option governance).

A new user opens Relay for the first time. What do they see? What can they do? Relay's onboarding rests on three pillars that together ensure any human — regardless of technical skill, profession, or background — can immediately find value.

### 73.1 Pillar One — The Live Globe

You start on the real Earth. Not a tutorial sandbox. Not a guided walkthrough. The actual live globe at whatever its current state is — trees growing, trunks glowing, branches swaying with activity. You can fly anywhere, zoom into any public tree, watch governance votes in real-time, observe weather patterns, and see the shape of civilization.

This is discovery through exploration. The globe IS the tutorial. A user who flies to their city and sees a wilting municipal tree learns more about Relay in ten seconds than any instruction manual could teach. The visceral experience of seeing reality rendered as geometry is the onboarding.

### 73.2 Pillar Two — Drag-to-Tree File Mapping

Drag any file from your computer into Relay. An Excel spreadsheet. A PDF contract. A photo album. A code repository. The §37 Knowledge Migration system reads the file, identifies its structure, and maps it onto your personal user tree.

Your spreadsheet IS a branch. Your rows ARE filaments. Your columns become filament domains (identity, magnitude, counterparty, evidence, time). The migration is immediate and visual — you see your data take shape as a living tree. Every file you own can become part of your Relay identity.

This solves the cold-start problem. Users don't start with an empty tree. They start with their existing life, migrated into 3D.

### 73.3 Pillar Three — Tutorial Master List

A comprehensive, community-governed list of tutorial classes for every trade, profession, and life role known to civilization:

**How the list is built (§72 layered option governance):**
- **Stage 1 meta-vote:** What professions and roles should be on the master list? The community proposes and votes on categories: doctor, lawyer, accountant, mother, student, teacher, farmer, engineer, nurse, plumber, electrician, chef, artist, musician, athlete, soldier, police officer, firefighter, social worker, therapist, architect, pilot, mechanic, librarian, and hundreds more.
- **Stage 2 vote:** How should the list be displayed? Priority ordering, alphabetical, regional relevance, popularity — all global parameters decided by the community.

**Each tutorial class** is a §58.5 community-curated curriculum with §58.12 certification paths. The classes are not static documents — they are living branches with active teachers, evolving content, and continuous quality governance.

**The list is never finished.** As new professions emerge and old ones evolve, the community updates the master list through ongoing meta-votes. A new user searching "how do I become a welder?" finds a living, community-verified curriculum pathway — not a dead PDF.

### 73.4 Coexistence with Game Layer Discovery

§40.6 states: "No tutorial. No onboarding." That applies to the game layer — the fog of war lifts as you explore, monsters appear as you venture outward, spells reveal themselves through experimentation. Game layer discovery is earned through play.

The Universal Onboarding system teaches the PLATFORM — how trees work, how to navigate the globe, how to commit filaments, how to use governance. These are complementary, not contradictory. You learn the world by walking it. You learn the game by playing it.

**Contract #177 — Every new user receives three onboarding pillars: (1) the live globe for exploratory discovery, (2) drag-to-tree file mapping for immediate personal value, and (3) a community-governed tutorial master list for structured learning of any profession or life role. The tutorial master list is governed by §72 layered option governance — what professions appear and how they are prioritized is a community meta-vote. Platform onboarding and game layer discovery coexist as complementary systems.**

---

## 74. Traffic & Civic Response Module (RELAY-CIVIC-1) — Frozen Contracts #178–179

> *"The only thing necessary for the triumph of evil is for good men to do nothing."* — Edmund Burke

**Prerequisites:** §1 (the globe), §9 (confidence), §10 (pressure), §23 (weather/wind), §29 (proximity channels), §33 (LOD rendering), §46 (sortition), §48 (engineering infrastructure), §66 (microsharding), §67 (BCP/DRP).

Public services are branches obeying the same universal equations. A fire truck is a filament. A traffic light is a node computing pressure. An emergency call is a commit. Relay coordinates and makes visible — it does not operate physical infrastructure. This module describes how civic response maps onto the existing physics.

### 74.1 Emergency Call as Filament — CivicAlertPacket

When someone calls for help, that call becomes a filament on the civic alert branch for their region:

```
CivicAlertPacket {
  alertType:              enum { MEDICAL, FIRE, ACCIDENT, TRAFFIC_OBSTRUCTION,
                                 ACTIVE_SHOOTER, NATURAL_DISASTER, ANIMAL_RESCUE,
                                 UTILITY_FAILURE, HAZMAT, OTHER },
  geolocation:            { lat, lon, precision },
  severityEstimate:       enum { LOW, MEDIUM, HIGH, CRITICAL },
  reporterConfidence:     number (from user tree health — a well-maintained tree with history carries more weight),
  timeboxSpawn:           timestamp,
  requiredResponseClass:  enum { NON_CRITICAL, STANDARD, URGENT, LIFE_THREATENING },
  estimatedResourceUnits: number,
  evidenceRefs:           filamentRef[] (camera footage, sensor data, photos)
}
```

The alert spawns a filament on `branch.civic.<region>.alerts`. That filament exerts wind pressure (directional lean toward the incident location), generates heat (engagement spike from responders and bystanders), has fog if evidence is weak, and has magnitude based on severity. If unresolved, it becomes a twig — a visible reminder that something needs attention.

### 74.2 Civic Access Credit (CAC) — Abuse-Resistant Public Service Signaling

Emergency services must not be free to spam, but must never be inaccessible to someone in genuine danger.

- Every user has a monthly **Civic Access Allocation** (regenerates per timebox, weighted by reputation and region)
- Triggering an alert stakes CAC — you put some of your allocation behind the call
- **Validated alert:** CAC returned plus a small bonus for responsible civic participation
- **False or trivial alert:** CAC reduced, reputation penalty, potential civic scar on your tree
- **Repeated abuse:** Temporary suspension from non-life-threatening alert categories
- **Life-threatening alerts can NEVER be blocked by CAC balance** — the system nudges rational usage without preventing genuine emergency access
- **Hospital overuse discipline:** Choosing emergency dispatch for a trivial case costs higher CAC. If the case is later marked non-critical by responders, additional confidence penalty. The system nudges toward self-care guidance or clinic appointments for non-emergencies.

### 74.3 Dispatch Physics — Deterministic and Explainable

Each response unit is a filament with real-time properties:

```
ResponseUnit {
  unitId:           string (e.g., "FIRETRUCK-12", "AMBULANCE-4"),
  currentPosition:  { lat, lon },
  readinessState:   enum { AVAILABLE, EN_ROUTE, ON_SCENE, RETURNING, OFFLINE },
  specialization:   string[] (e.g., ["hazmat", "cardiac"]),
  fuelLevel:        number (0..1),
  fatigueScore:     number (hours since last rest),
  etaEstimation:    number (seconds to any given point, computed from traffic data)
}
```

**Dispatch selection minimizes:**

```
dispatchCost = (responseTime x severityWeight) + (currentUnitLoad x fatigueWeight) + (trafficFriction x routeRisk)
```

No hidden randomness. Fully explainable. Tap any dispatch decision on the civic branch and see exactly why that unit was selected, what alternatives existed, and what each would have cost.

### 74.4 Traffic Flow — Deterministic Pressure, Not Timer-Based

Traditional traffic systems use fixed timers and loop sensors. Relay traffic uses live filament data:

- Each **vehicle** with a Relay-connected device is a filament (destination vector, urgency class, occupancy weight, vehicle type)
- Each **route segment** is a branch segment with aggregate flow magnitude
- Each **intersection** is a node computing aggregate directional pressure using the same lean equation from §10
- **Signal timing** adjusts deterministically: `greenTime_direction = baseTime + (flowMagnitude_direction x scalingCoefficient)`
- **Emergency vehicles** inject directional storm (maximum pressure) that overrides lane priority — traffic clears because the physics demand it, not because a timer says so

### 74.5 Cascading Emergency — Priority Recalculation

When multiple simultaneous events occur (a cat in a tree, a house fire, an active shooter, an earthquake, a solar flare), the system computes:

```
priorityScore = severity x lifeRisk x proximity x capacityFactor
```

Events are sorted deterministically. Higher severity overrides lower. Units can be recalled mid-route if a higher-priority event demands them. All reassignments are visible filaments — you can trace why an ambulance was diverted. The cat rescue alert stays OPEN as a twig — it does not vanish, it just sinks into lower priority and will be addressed when capacity allows.

### 74.6 Degraded Civic Mode

During fire, flood, earthquake, or solar flare:

- Non-critical alerts auto-throttled (reduced visibility, not deleted)
- Emergency-only dispatch — all available units route to highest-severity events
- CAC cost temporarily reduced (don't punish people for calling during a disaster)
- Traffic lanes dynamically reallocated — evacuation routes get maximum pressure priority
- Public live map shows safe corridors, shelter locations, and hazard zones
- If communications drop (solar flare, infrastructure failure): local shards continue operating independently, events queue locally, federation reconnects when possible (§67 BCP/DRP)
- **Triage principle:** Spectacle sheds first. Dispatch remains. Truth never stops.

All mode transitions (NORMAL → DEGRADED → EMERGENCY → RECOVERY) are committed events on the civic branch. The system's crisis response is auditable after the fact.

### 74.7 Resource Registry Integration

Water systems, power grids, telecom networks, road networks — each is a branch with filament-tracked infrastructure:

| Resource Type | Branch Structure | Key Metrics |
|--------------|-----------------|-------------|
| Water | Reservoir → treatment → distribution | capacity, flow rate, contamination events |
| Power | Generation → transmission → distribution | load, outage events, renewable percentage |
| Telecom | Backbone → local exchange → last mile | bandwidth, latency, outage duration |
| Roads | Highway → arterial → local → intersection | traffic volume, accident density, repair backlog |

Each event on these branches modifies magnitude, heat, fog, and lean. The public sees real-time civic health at a glance — a wilting water branch means service issues. A glowing power branch means reliable delivery.

### 74.8 History and Accountability

Every alert, every dispatch, every response time, every outcome — all sink inward with time. A cross-section of the civic branch shows: which months had emergency spikes, which years had fires, which policy changes improved response time, which leadership periods increased fog (uncertainty). No more hiding systemic failure. The tree remembers.

**Contract #178 — Civic alerts are filaments obeying universal equations (heat, fog, lean, magnitude, confidence). Dispatch selection is deterministic and fully explainable — tap any decision and trace it to its inputs. Traffic control uses live pressure aggregation from vehicle filaments, not fixed timers. CivicAccessCredit discourages abuse through staking and reputation consequences without ever blocking genuine life-threatening access. No emergency is suppressed without a recorded commit.**

**Contract #179 — In degraded civic mode, non-critical alerts throttle, dispatch remains operational, local shards run independently during communications loss, and all mode transitions are committed events. Resource infrastructure (water, power, telecom, roads) is branch-tracked with the same physics as all other Relay branches. Relay survives fires, floods, earthquakes, and communication blackouts through federated append-only architecture (§67).**

---

## 75. Physical Weather Layer — Frozen Contract #180

> *"Sunshine is delicious, rain is refreshing, wind braces us up, snow is exhilarating; there is really no such thing as bad weather, only different kinds of good weather."* — John Ruskin

**Prerequisites:** §3.16 (branch weather), §9 (confidence), §23 (weather and wind), §33 (LOD rendering), §68 (arena branches).

Relay has two weather systems that stack but never confuse:

1. **Branch Weather** (existing, §3.16 and §23) — social and operational truth fields computed from filament activity. Heat means high engagement. Fog means uncertainty. Storm means heat multiplied by fog. Lightning means cascading failures. This is metaphorical weather that tells you about the health of data.

2. **Physical Weather** (this section) — actual meteorology. Real rain. Real wind. Real temperature. Measured by sensors, rendered in 3D, deterministic from source data. This is the weather you feel when you step outside.

Both layers render simultaneously. They use different color palettes so you always know which is which.

### 75.1 Data Source

Physical weather data comes from Relay-registered sensors — buoys, weather stations, anemometers (wind speed meters), rain gauges, lightning detectors, barometers (air pressure meters) — plus optionally public weather sources (radar, satellite imagery, forecast models) as external evidence feeds, clearly labeled as external.

Every sensor is a tree or branch with its own identity, calibration commits, uptime history, and data stream filaments. Sensors with low confidence (infrequent calibration, spotty uptime) contribute less to the weather computation — the same confidence physics (§9) that governs all other data in Relay.

### 75.2 PhysicalWeatherTileAggregate Schema

The globe is divided into grid cells. Each cell aggregates sensor readings for a time window:

```
PhysicalWeatherTileAggregate {
  tileId:               string,
  windowStart:          timestamp,
  windowEnd:            timestamp,
  precipRate:           number (mm/hr — millimeters of rain per hour),
  precipType:           enum { RAIN, SNOW, HAIL, MIXED },
  windU:                number (m/s — east-west wind component),
  windV:                number (m/s — north-south wind component),
  tempC:                number (temperature in Celsius),
  pressureHpa:          number (atmospheric pressure in hectopascals),
  humidityPct:          number (relative humidity as percentage),
  visibilityM:          number (visibility distance in meters),
  lightningStrikeRate:  number (strikes per minute in the cell),
  sourceCoverage:       number (0..1 — what fraction of the cell has sensor data),
  sourceList:           sensorRef[] (which sensors contributed),
  interpolationMethod:  string (mathematical method used to fill gaps between sensors),
  damageField:          number (aggregated incident reports + verified footage),
  damageConfidence:     number (how well-evidenced the damage assessment is)
}
```

### 75.3 LOD Rendering — Radar to Clouds

Physical weather renders differently at each zoom level:

- **GLOBE / REGION LOD:** Radar-style precipitation overlay — familiar green, yellow, red blobs showing rainfall intensity. Coarse wind streamlines show prevailing wind direction. Pressure contours show high and low pressure systems. Lightning density renders as a heatmap. This is the "weather map" everyone recognizes from television.

- **CITY / TREE LOD:** Precipitation becomes 3D volume columns — you can see rain shafts falling from cloud base to ground. Cloud layers become visible as translucent volumes. Wind becomes layered vectors showing speed and direction at different altitudes. Lightning is localized to specific areas.

- **BRANCH / BARK LOD:** Weather becomes local and tangible. Wind creates visual distortion (a wall of pressure you can see). Rain renders as individual streak density. Fog thickness comes from humidity readings. Lightning flashes where strike probability is highest. Users can fly through a hurricane and experience it in three dimensions.

All rendering is deterministic. Same sensor data = same storm visualization. Tap any weather voxel (3D pixel) and see exactly which sensor readings drove it, at what time, with what interpolation.

### 75.4 Two-Layer Visual Distinction

Both weather systems render simultaneously with clearly different visual languages:

- **Physical weather:** Familiar meteorology palette — radar greens, yellows, reds for precipitation. Cloud greys for overcast. Blue for clear sky.
- **Branch weather:** Existing Relay truth-lens palette — fog (semi-transparent uncertainty clouds), storm (dark red heat-times-fog), lightning (bright cascade flashes).
- **UI legend:** Always visible, always showing which layer is active: PHYSICAL vs RELAY. Users can toggle each layer independently.

### 75.5 Forecasts as Projections

Physical observations from sensors are truth filaments — measured, timestamped, evidence-backed.

Forecasts are projection branches (§6) — light-blue, clearly labeled PROJECTION, showing the model and data source that produced them. Forecasts render as a faint ghost layer ahead in time, visually distinct from current conditions. You can see the predicted storm approaching as a translucent volume while the current sky is clear.

Forecasts are never presented as truth. They are always labeled with their source model and confidence level.

### 75.6 Bridge to Game Layer

The same physical weather data serves multiple purposes across Relay's activation stages:

- **Stage 1–2 (pre-game layer):** Physical weather is a real-world risk lens. Storms are visible hazards. Users can see approaching weather systems and plan accordingly.
- **Stage 3 (game layer active):** Those same storm volumes become the elemental arena substrate. A duel fought inside a real hurricane uses the same weather rendering. The world's weather becomes the world's spell palette — a thunderstorm empowers lightning-element users. A blizzard favors ice specialists. The weather is not random — it is real, measured, and deterministic.

**Contract #180 — Physical weather is a deterministic 3D rendering of measured meteorological fields from Relay-registered sensors. Every rendered pixel traces to source sensor readings, time window, and interpolation method. Physical weather and branch weather are separate layers with distinct visual palettes and independent data sources. Weather graphics are a lens, never a lever — they render risk, they do not enforce behavior. Forecasts render as projections (light-blue), never as truth. Physical weather data bridges into the game layer as elemental arena substrate at Stage 3 activation.**

---

## 76. Civilization Template Library — Frozen Contracts #181–182

> *"Civilization is not inherited; it has to be learned and earned by each generation anew."* — Will Durant

**Prerequisites:** §21 (templates), §38 (module discovery), §72 (layered option governance).

**Companion document:** [RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md](RELAY-CIVILIZATION-TEMPLATE-LIBRARY.md) contains the full specification — 13 civilization pillars with index cards, cross-pillar standards (canonical object IDs, universal truth packets, cross-tree linking protocol), and deep-dive specifications for HEALTH-1 and PROPERTY-1. Machine-readable JSON stubs live in `config/templates/`.

Every domain of human civilization can be represented as a tree using the same physics. No new equations are needed. What is needed is a library of standard templates — branch archetypes that cover the domains people actually live in. A farmer needs an agriculture template. A hospital administrator needs a healthcare template. A family needs a family governance template. This section defines the seed library.

### 76.1 The Fourteen Seed Domains

Each template below uses the six universal filament domains (identity, counterparty, time, magnitude, evidence, lifecycle) and the ten universal equations. What varies is the branch structure, the magnitude type, the evidence rules, and the governance policies.

| Domain | Template Archetype | Key Branch Structure | Magnitude Type |
|--------|-------------------|---------------------|---------------|
| **Person** | User tree (§8) | Roles, learning, health, economic, social, arena | Mixed (time, money, reputation) |
| **Family** | Shared governance tree | Joint finances, property, children, inheritance chain, shared decisions | Money, time, responsibility |
| **Property** | Asset registry tree | Ownership history, mortgage, zoning, tax assessment, environmental compliance | Money (property value, tax) |
| **Healthcare** | Facility + patient trees | Triage queue, equipment, staffing, procedures, insurance claims, outbreak events | Patient count, cost, outcome rate |
| **Agriculture** | Farm tree | Soil health, crop cycles, water inputs, fertilizer bill of materials, harvest outputs, mass balance | Weight (kg harvested), cost |
| **Infrastructure** | Road/bridge/utility segment | Maintenance history, stress load, accident density, weather exposure, repair backlog | Cost, usage volume |
| **Commerce** | Marketplace tree | Product listings, consumer retail, peer-to-peer exchange, fulfillment branches | Transaction value |
| **Estate / Death** | Frozen user tree | Closure commit, heir designation, memorial mode, digital will, branch transfer to heirs | Asset value |
| **Emergency** | Civic service tree (§74) | Alert queue, unit dispatch, response tracking, outcome recording | Severity, response time |
| **Utilities** | Grid / network tree | Water, power, telecom — each filament-tracked with capacity, load, outage history | Capacity units (kWh, liters, Mbps) |
| **Finance** | Financial instrument branches | Mortgages, loans, bonds, derivatives — all as linked debit/credit filament pairs | Money (principal, interest) |
| **Culture** | Institution tree | Museums, theatres, religious institutions, community centers, festivals | Attendance, funding |
| **Sports** | League / team tree | Organized sports, seasons, matches, rankings derived from tree shape | Score, ranking points |
| **Marriage / Partnership** | Shared governance commit | Bilateral consent, shared branches, joint financial visibility, dissolution via sortition (§46) | Combined household metrics |

### 76.2 How Templates Work

Each template specifies:

- **Branch structure:** The default hierarchy of branches that makes sense for the domain. A healthcare template starts with triage, staffing, equipment, procedures, and compliance branches. A user can customize — but the template gives a working starting point.
- **Magnitude type:** What gets measured. Money for commerce. Weight for agriculture. Patient count for healthcare. This maps to the filament's magnitude domain.
- **Evidence rules:** What constitutes proof in this domain. A property transfer needs deed documentation. A medical procedure needs clinical notes. An agricultural harvest needs scale readings.
- **Governance policies:** Who can commit, who can view, what the default disclosure tiers are. A family tree might default to Tier 0 (private). A municipal services tree defaults to Tier 2 (fully public).
- **Integration points:** How this template connects to other templates. A property template links to the finance template (mortgage). A healthcare template links to the insurance template (claims). A person template links to everything.

### 76.3 Estate and Death — The Final Commit

When a user dies, their tree does not disappear. It freezes:

- A **closure commit** (§71.7) is appended to the tree root, marking it as frozen
- An **heir designation** branch (if configured) transfers access to designated heirs through sortition-verified process (§46)
- **Memorial mode** renders the tree as a permanent monument — still navigable, still searchable, but no new filaments can be committed
- A **digital will** (a governance commit) specifies which branches transfer to which heirs, which branches are sealed permanently, and which branches are published to a wider audience posthumously
- The tree's Merkle chain remains intact. The person's contributions to civilization are permanent.

### 76.4 Family Governance

A family tree is a shared governance tree where:

- Both partners have equal commit authority on shared branches (joint finances, property, children's education)
- Children have age-appropriate access tiers (§63 child safety)
- Inheritance chains are pre-configured — if a parent's tree freezes, designated branches automatically transfer
- Dissolution (divorce, separation) follows sortition-based case resolution (§46) with pre-agreed terms where possible
- Extended family can be granted read-only or limited-commit access to specific branches

### 76.5 Template Library Governance

The template library itself is governed by §72 layered option governance:

- **What templates exist** is a community meta-vote. Anyone can propose a new domain template. The community votes on whether it should be part of the standard library.
- **What a template contains** (branch structure, evidence rules) is governed within that domain's community. Healthcare professionals govern the healthcare template. Farmers govern the agriculture template.
- **Templates can be extended** through §38 module discovery. A regional community might create a variant healthcare template for their local regulatory environment.
- **No template is permanent** except through continued community support. If a template is abandoned (no users, no governance activity), it wilts naturally — visible as a dead branch on the template library tree.

**Contract #181 — Every domain of civilization is representable as a tree template using the same universal equations. No new physics is required. Templates define branch structure, magnitude types, evidence rules, governance policies, and integration points with other templates. The template library is governed by §72 layered option governance — what templates exist, what they contain, and how they evolve are all community decisions.**

**Contract #182 — Person, family, property, healthcare, agriculture, infrastructure, commerce, estate/death, emergency, utilities, finance, culture, sports, and marriage/partnership are the fourteen seed template domains. Each can be extended through module discovery (§38). The community governs what templates exist and how they evolve. No template is permanent except through continued community support. Estate/death templates preserve user trees as frozen monuments with sortition-verified heir transfer.**

---

## 77. Product Supply Chain Traceability — Mineral to Shelf — Frozen Contracts #183–184

> *"The care of the Earth is our most ancient and most worthy, and after all our most pleasing responsibility."* — Wendell Berry

**Prerequisites:** §4 (filaments), §21 (templates), §30 (verification physics), §31 (accounting packets), §52.5 (mass balance), §53 (atomic traceability), §60 (fractal branching), §76 (civilization template library).

Every retail product sitting on a shelf is a tree. Not a SKU. Not a barcode. A tree — with design branches, supplier branches, batch branches, and a lineage that stretches all the way back to the mineral particles extracted from the earth. Relay makes that lineage visible, traceable, and auditable using the same physics that governs every other branch. No new equations. Just recursive application.

### 77.1 A Product Is a Tree

A manufactured product (a laptop, a medicine bottle, a car, a bag of baby wipes) is represented as a **Product Tree**:

```
Product Tree: Laptop Model X-2026
├── design (versions, specs, approvals)
├── bom (bill of materials — component list per version)
├── suppliers (counterparty trees for each component source)
├── manufacturing (production batches, machine IDs, operator responsibility)
├── distribution (logistics chain from factory to warehouse to retail)
├── retail (shelf placement, sale events, customer linkage)
├── warranty (service events, returns, replacements)
├── recall (defect tracking, propagation, remediation)
└── environmental (carbon intensity, water usage, waste, recycling content)
```

Each branch contains filaments. Each filament has identity, counterparty, time, magnitude, evidence, and lifecycle — the same six universal domains.

### 77.2 Version Control at Product Level

Every change to a product creates a new version filament on the design branch:

- `Laptop X-2026 v1.0` — initial release
- `Laptop X-2026 v1.1` — new battery supplier
- `Laptop X-2026 v1.2` — firmware update
- `Laptop X-2026 v2.0` — new motherboard architecture

Each version filament has evidence (design files, engineering approvals, regulatory certifications) and a lifecycle state. Superseded versions sink inward. In cross-section, each ring represents a release cycle. Thickness shows scope of change. Scars mark recalled versions. Lean indicates supplier or regulatory pressure.

### 77.3 Bill of Materials as Branch Physics

Each product version has a BOM branch. Each component in the BOM is a filament that links to its supplier tree:

```
Product Tree
└── BOM Branch (version-specific)
    ├── F-COMPONENT: Aluminum chassis → Supplier Tree A
    ├── F-COMPONENT: Lithium battery  → Supplier Tree B → Material Lot → Mine Tree
    ├── F-COMPONENT: OLED panel       → Supplier Tree C
    ├── F-COMPONENT: WiFi chip        → Supplier Tree D
    └── F-COMPONENT: Polypropylene casing → Supplier Tree E → Refinery → Extraction Site
```

This is recursive fractal branching (§60). The product tree links to supplier trees, which link to material trees, which link to extraction trees. No new physics — just cross-tree references at each level.

### 77.4 Batch-Level Traceability

Every manufactured batch becomes a filament:

```
ManufacturingBatch {
  batchId:              string ("batch.<productId>.<plantId>.<date>.<seq>"),
  productVersionRef:    filamentRef (→ design branch version),
  componentLotRefs:     filamentRef[] (→ specific material lots used),
  machineId:            string (production line identifier),
  operatorResponsibility: responsibilityPacketRef,
  productionStart:      timestamp,
  productionEnd:        timestamp,
  qualityInspection:    evidenceRef (inspection report hash),
  unitCount:            number (units produced in this batch),
  massBalanceCheck:     { inputKg, outputKg, wasteKg, variance },
  environmentalMetrics: { energyKwh, waterLiters, co2Kg }
}
```

Each individual retail unit (serial number) links to its batch filament. When you scan a product with a Relay-connected device, you trace:

**Retail Unit → Batch → Component Lots → Material Lots → Refinery → Extraction Site**

Every link is a cross-tree filament reference. Every link is clickable.

### 77.5 Mineral-Level Mapping

At the deepest level, material lots link to extraction events:

```
MaterialExtractionEvent {
  extractionId:       string,
  mineTreeRef:        treeRef (the mine is a tree with its own history),
  mineralType:        string (lithium, aluminum ore, crude oil, etc.),
  extractionDate:     timestamp,
  oreGrade:           number,
  massExtractedKg:    number,
  energyConsumedKwh:  number,
  carbonIntensityKg:  number,
  transportEmissions: number,
  evidenceRefs:       filamentRef[] (assay reports, GPS coordinates, operator attestation)
}
```

Relay does not track individual atoms. It tracks **mass-conserved batches** at each stage. The conservation law is enforced by consolidation gates:

```
inputMass = outputMass + wasteMass + emissions
```

This is the same mass balance rule from §52.5 applied recursively at every stage of the supply chain.

### 77.6 The Retail Shelf Experience

A shopper stands in a store, opens Relay, and points their camera at a product. Relay resolves:

1. **Retail SKU filament** — product identity, price, batch reference
2. **Batch filament** — when and where this batch was made
3. **Component filaments** — what went into it, from which suppliers
4. **Material lot filaments** — raw material provenance
5. **Extraction filaments** — where on Earth the minerals came from

An overlay shows at a glance:
- Carbon intensity color band (green = low, red = high)
- Water usage indicator
- Recycled content percentage
- Supplier confidence score (are supply chain links well-evidenced?)
- Labor compliance confidence
- Active recall risk (heat indicator if any upstream lot has a scar)

Tap "show full provenance" and the cross-section opens: rings from extraction through refining, polymerization, manufacturing, packaging, distribution, and retail — each clickable.

### 77.7 Recall Propagation as Lightning Cascade

When a defect is found — say, an impurity in a lithium batch causing battery overheating — the affected material lot filament receives a **scar**. That scar propagates upward through the linked filament chain using Relay's existing lightning cascade mechanics (§3.16):

```
Defective lithium lot (scar)
  → Every battery batch using that lot (lightning flash)
    → Every product batch containing those batteries (lightning flash)
      → Every retail unit from those batches (recall alert)
        → Every customer who purchased those units (notification filament)
```

This is not a database query. It is geometric propagation along linked filaments. The affected products literally glow with heat on the globe. No email chains. No spreadsheet tracking. The recall is visible as geometry.

### 77.8 Environmental Correlation

Because every material filament carries mass, emissions, energy usage, and waste data, Relay can compute **true embedded carbon per retail unit** — not estimated, but summed across all upstream filaments.

A shopper comparing Product A vs Product B sees:
- Product A: thick, firm supply chain branch (well-documented, low fog) with moderate carbon band
- Product B: thin, foggy supply chain branch (gaps in documentation) with high carbon band

The tree shape tells the story before any number is read.

### 77.9 Consolidation Gate — Supply Chain

A product batch cannot be marked ABSORBED (sealed for that epoch) unless:

1. All component lot references are resolved and linked
2. Mass balance closes at every stage (input = output + waste, within tolerance)
3. Quality inspection evidence is attached
4. Supplier certifications are current (not expired, not revoked)
5. No active recall scars on any upstream material lot

Incomplete batches wilt. The branch shape reveals supply chain health at a glance.

**Contract #183 — Every manufactured product is a tree with version-controlled design, BOM, batch, distribution, retail, warranty, recall, and environmental branches. Components link to supplier trees. Material lots link to extraction sites. Mass balance is enforced at every stage via conservation consolidation gates. Recall propagation follows lightning cascade mechanics along linked filament chains. Individual retail units trace to their batch, component lots, material lots, and extraction events through cross-tree filament references. No link in the chain is hidden or unauditable.**

**Contract #184 — The retail shelf experience renders product provenance as a navigable cross-section from extraction to shelf. Environmental metrics (carbon intensity, water usage, recycled content) are computed by summing upstream filament data, not estimated. Supply chain fog indicates documentation gaps. Supply chain heat indicates active issues or recalls. Shoppers see truth, not marketing claims. Every rendered metric traces to source filaments in one click.**

---

## 78. Filament Length Ontology — Structural Weight from Commit Topology — Frozen Contract #185

> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."* — Will Durant, summarizing Aristotle

**Prerequisites:** §3 (branch model), §4 (filaments), §14 (gravitational time), §21 (templates).

Different things in life have different structural weights. A social media post is a brief moment. A purchase order spans weeks. A book takes months. A balance sheet account never ends. In Relay, filament length is not manually assigned — it emerges from commit topology. The geometry of a filament tells you what kind of thing it is, without reading a label.

### 78.1 The Principle

Filament length along the L-axis (longitudinal position on the branch) represents the **span of active structural relevance across commits**. It is not "how long it took" in calendar time alone. It is a function of:

```
l_extent = f(commitCount, lifecycleSpan, structuralWeight)
```

Where:
- `commitCount` = number of commits on this filament
- `lifecycleSpan` = duration between first commit and lifecycle closure (or ongoing if never closed)
- `structuralWeight` = evidence density, contributor count, and cross-tree reference count

This means filament length emerges from reality, not from declaration.

### 78.2 Five Filament Profile Classes

Different domains naturally produce different filament geometries. These are not hardcoded categories — they are emergent patterns that the system recognizes:

| Profile | Examples | Typical Commits | Lifecycle | Visual Geometry |
|---------|----------|----------------|-----------|-----------------|
| **Micro** | A post, a comment, a single approval, a minor edit | 1–3 | Rapid OPEN → CLOSED | Small ribbon, thin cross-section, quickly sinks inward. Like a twig or leaf. |
| **Transaction** | Purchase order, invoice, goods receipt, payment, change order | 5–20 | Multi-stage evidence accumulation with defined completion | Medium-length ribbon, visible slab interaction, leaves permanent ring thickness. Like a seasonal growth segment. |
| **Project** | Book writing, software module, film production, machine installation, CAPEX project | Dozens to thousands | Multiple timeboxes, multiple contributors, version evolution | Long L-span, strong radial migration over time, thick slab accumulation. Like a large branch segment. |
| **Structural** | Balance sheet accounts, ledger accounts, directory trees, organizational branches, language trees, patient health history | Continuous stream | No terminal lifecycle, always active at surface | Underlying branch structure — these define the trunk and branches themselves. Like the vascular system. |
| **Continuous** | A live data directory, a sensor feed, an ongoing monitoring branch | Steady commit flow | Never closes, grows with time | Solid branch appearance because it is growing live commits continuously. It does not jump to stay alive — it is simply growing as one with time. |

### 78.3 How Length Emerges — No Manual Assignment

Filament length is never declared. It is computed from commit topology:

```
l_span = commitDensity × timeboxSpan × activityFactor
```

Where:
- `commitDensity` = commits per timebox for this filament
- `timeboxSpan` = number of timeboxes this filament spans
- `activityFactor` = normalized contributor count × evidence attachment count

Small activity → short filament. Long sustained activity → long filament. Permanent structural activity → continuous filament that defines branch shape.

### 78.4 Structural Nodes vs Finite Filaments

An important distinction:

- **Finite filaments** have lifecycle states (OPEN → ACTIVE → CLOSED → ABSORBED). They are discrete events with beginnings and endings. Posts, transactions, projects — all finite.
- **Structural nodes** are commit aggregators that never close. Balance sheet accounts, directory trees, organizational branches — these receive continuous commits and produce continuous branch thickening. They look like solid tree trunks because they are.

The visual difference: finite filaments are ribbons on the bark surface that eventually sink inward. Structural nodes ARE the bark surface — they define the branch geometry itself.

### 78.5 Cross-Domain Comparison

The same physics produces visually distinct geometry for different domains:

| Object | Filament Behavior | Visual Effect |
|--------|-------------------|---------------|
| Tweet | 1 commit, instant close | Tiny ribbon, fast inward migration |
| Purchase order | 5–10 commits, weeks to close | Medium ribbon across multiple slabs |
| Laptop product version | Multi-month project, many contributors | Long ribbon spanning many timeboxes |
| Annual budget cycle | Repeating timebox pattern, yearly close | Ringed branch with annual thickness bands |
| Balance sheet account | Continuous aggregator, never closes | Thick trunk segment, always at surface |
| File directory | Continuous commit flow | Stable branch, solid appearance |
| Language tree | Multi-century cultural flow | Massive trunk, deep historical rings |

Everything obeys the same equations. Only commit structure differs.

### 78.6 Anti-Gaming — Length Inflation Detection

If someone tries to inflate filament length by adding meaningless commits:

The system detects:
- Low semantic complexity delta between commits (each commit adds little new information)
- High scaffold percentage (most commits are structural, not substantive)
- Low confidence accumulation (no real evidence attached)
- Excessive commit frequency without corresponding evidence growth

This produces:
- **Fog** (low confidence from evidence deficit)
- **Twig growth** (unresolved open items)
- **Lean instability** (pressure from quality metrics)
- **Scar markers** (if community flags the pattern)

Length inflation without substance becomes visually obvious — a long, foggy, wilting filament is worse than a short, firm one. The system rewards substance, not volume.

### 78.7 Template Configuration

Templates (§21) can configure filament profile expectations:

```
FilamentProfileConfig {
  expectedCommitRange:   { min: number, max: number },
  expectedLifecycleDays: { min: number, max: number },
  structuralNode:        boolean (true for accounts, directories, ongoing branches),
  autoClassification:    boolean (true = system infers profile from commit topology)
}
```

A healthcare template expects clinical encounter filaments to be Transaction-profile (5–15 commits over days). A manufacturing template expects production batch filaments to be Project-profile (dozens of commits over weeks). If actual commit topology deviates significantly from the expected profile, the confidence calculation adjusts — unusually short batches or unusually long posts trigger fog.

**Contract #185 — Filament length along the L-axis emerges from commit topology (commit count, lifecycle span, structural weight), not from manual declaration. Five emergent profile classes (micro, transaction, project, structural, continuous) describe the natural geometry of different event types. Structural nodes (balance sheet accounts, directories, ongoing branches) are commit aggregators that never close and define branch geometry. Finite filaments have discrete lifecycles and migrate inward over time. Length inflation without substantive evidence produces fog, wilt, and scar markers. The system rewards substance over volume.**

---

## 79. Quote Attribution & Open Annotation — Frozen Contract #186

> *"If I have seen further, it is by standing on the shoulders of giants."* — Isaac Newton

**Prerequisites:** §4 (filaments), §5 (notes), §7 (social layer), §8 (user tree), §8.6 (presence profiles), §11 (parametric governance), §20 (cryptographic architecture), §32 (stable IDs).

Everything in Relay is a filament. A quote is a filament. An annotation is a filament. A vote on a single word in someone else's post is a filament. This section formalizes how open annotation, attribution, and deferred identity linking work — enabling anyone to credit anyone, annotate anything, and claim their contributions retroactively.

### 79.1 Posts Are Open by Default

When a user commits a filament (a post, a comment, a claim, a report), the filament exists on its branch with all standard physics. But the user controls an **annotation permission** setting:

```
AnnotationPermission {
  filamentRef:       filamentRef,
  allowAnnotations:  boolean (default: true),
  allowWordVotes:    boolean (default: true),
  allowSuggestions:  boolean (default: true),
  lockEditing:       boolean (default: false — only the owner can toggle this)
}
```

By default, posts are open. Anyone can annotate, vote on individual words, or suggest changes. The owner can lock editing at any time — this freezes the filament content but does not prevent new annotation filaments from attaching to it.

### 79.2 Word-Level Voting

Any user can vote on any word, sentence, or passage within any open filament. The vote is itself a filament — a micro-filament (§78.2) with 1–3 commits:

```
WordVoteFilament {
  voteId:         string,
  targetFilament: filamentRef,
  targetRange:    { startOffset: number, endOffset: number },
  voteType:       "agree" | "disagree" | "clarify" | "cite" | "flag",
  weight:         number (voter's engagement weight),
  comment:        string (optional — if present, this vote becomes a conversation starter),
  commitId:       string
}
```

When someone votes on a word, they are placing a note on that filament. If they add a comment, they have started a new conversation — a new filament branching from that point. The conversation grows its own branch, linked to the exact character range that spawned it. This is how marginalia, footnotes, and peer review emerge naturally from filament physics.

### 79.3 Suggestions and Version Growth

When another user suggests a change to the original filament, the suggestion is a linked filament:

```
SuggestionFilament {
  suggestionId:     string,
  targetFilament:   filamentRef,
  targetRange:      { startOffset: number, endOffset: number },
  suggestedText:    string,
  rationale:        string,
  suggestorId:      userId,
  status:           "PROPOSED" | "ACCEPTED" | "REJECTED",
  commitId:         string
}
```

If the original author accepts the suggestion, they add a new commit to their filament — the filament grows longer (§78), showing the version changed in response to external input. The suggestion filament's status updates to ACCEPTED and links to the new commit. The original author's filament now has a visible history: the original text, the suggestion, and the revised text — all auditable, all in sequence.

Rejected suggestions remain as filaments — visible as conversation history, never deleted.

### 79.4 Attribution to Unknown Users — Deferred Identity Linking

A critical feature: you can attribute a quote, idea, or contribution to someone whose Relay identity you do not know. The mechanism:

1. **Placeholder attribution**: The author includes `@whoever` or a descriptive tag (`@the-barista-who-said-this`, `@my-grandmother`) in their filament. This creates an `UnresolvedAttribution` record:

```
UnresolvedAttribution {
  attributionId:    string,
  sourceFilament:   filamentRef,
  placeholderTag:   string ("@the-barista-who-said-this"),
  createdBy:        userId,
  resolvedTo:       userId | null,
  resolvedAt:       timestamp | null,
  resolutionProof:  filamentRef | null (link to the confirmation exchange)
}
```

2. **Discovery**: The real person eventually discovers the attribution — through search, through a friend, through browsing the branch where it lives.

3. **Claim process**: The real person contacts the filament owner through standard Relay channels (notes, proximity, shared branch). The owner verifies identity through conversation.

4. **Resolution**: The owner grants access. The `@whoever` placeholder resolves to the real user's ID. The attribution filament updates with a new commit linking the placeholder to the confirmed user tree. All past references to `@whoever` in this context now point to the real user.

5. **Immutability**: The original placeholder commit remains in history. The resolution commit is appended. The full provenance chain — from anonymous attribution to confirmed identity — is auditable.

### 79.5 Owner Control — Lock and Grant

The filament owner maintains sovereign control:

- **Lock editing**: The owner can lock their filament at any time. After locking, the content is frozen — only annotation filaments can attach, no inline changes.
- **Grant attribution access**: The owner explicitly grants linking rights to the claimed user. No one can self-attribute without the owner's consent.
- **Revoke**: If an attribution was granted in error, the owner can scar the resolution (append a correction commit). The scar is visible — revocations are never silent.

### 79.6 How Quotes Work in the Tree

A quote attributed to another person is a filament with:
- The quoted text as content
- An `attribution` field pointing to either a resolved userId or an `UnresolvedAttribution`
- The quoter's own userId as the filament author (they are not claiming to BE the person — they are recording that the person said it)
- Evidence references if available (recording, document, witness)

Over time, the most cited quotes from a user accumulate as inbound annotation filaments on public branches. A user's tree shows, through natural geometry, how many other trees reference their words. Thick inbound connections = widely cited. Thin connections = niche. The tree shape IS the citation index.

### 79.7 Tribute Through Geometry

When this document quotes Butters Stotch, Benjamin Franklin, Rachel Carson, or Bruce Lee, it is doing exactly what Relay formalizes: attributing an idea to its source, making the link visible, and letting anyone follow the chain. In Relay, every quote from every user — famous or anonymous — lives as a filament with a provenance chain. The barista who says something profound at 6 AM deserves the same attribution physics as Einstein. The tree does not care about fame. It cares about links.

**Contract #186 — Every filament supports open annotation by default. Word-level voting creates micro-filaments linked to character ranges. Suggestions are linked filaments that, when accepted, cause the original to grow with a new commit. Attribution to unknown users is handled through placeholder tags (`@whoever`) with a deferred resolution protocol: the real user claims the attribution, the owner confirms, and the placeholder resolves to a verified userId. The original placeholder commit remains in history; resolution is appended. Owners control annotation permissions and attribution grants. Quote provenance chains are auditable. The tree shape is the citation index.**

---

*End of Relay Master Build Plan. The tree IS the data. Time sinks everything. Truth persists. Reality becomes the game.*
