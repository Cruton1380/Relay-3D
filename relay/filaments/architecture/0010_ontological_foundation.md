# architecture@c10: Ontological Foundation - Users as Filament Trees

**Commit Index:** 10  
**Date:** 2026-01-28  
**Status:** LOCKED  
**Dependencies:** c0-c9 (all prior architecture commits)

---

## PROBLEM STATEMENT

Prior architecture commits (c0-c9) defined:
- ✅ Filaments as append-only logs
- ✅ Buildings as spatial anchors
- ✅ Economic primitives (money, votes, commitments, delegation)
- ✅ HUD (personal) vs Globe (shared)

**What was missing:**
1. **Users are treated as accounts** (not as history itself)
2. **Identity is treated as fixed** (not as evolving)
3. **Buildings are treated as objects** (not as mutable spatial units)
4. **Five human layers undefined:** attention, failure, identity evolution, exit, thermodynamics

**Core insight:** The system has designed **how coordination works**, but not **how it feels to live inside it for years**.

---

## SOLUTION: USERS ARE FILAMENT TREES

### Paradigm Shift

**Old mental model (WRONG):**
- Users are accounts with IDs
- Identity is a profile attribute
- Buildings are objects with properties
- History is metadata attached to entities

**New mental model (CORRECT):**
- **Users ARE filament trees** (not accounts with history, but history itself)
- **Identity IS a filament** (committed to by self and others, evolves over time)
- **Buildings are space tiles** (persistent spatial anchors that accumulate structures/functions/history)
- **Buildings are units** (tradable, governable, like any other unit)
- **Proximity channels live everywhere** (inside buildings, between units, across tiles)

---

## THE FIVE CORE CLARIFICATIONS

### 1. Users Are Filament Trees (Not Accounts)

**Definition:**
> A user is not an account. A user is a growing filament tree representing all the places they have influenced and been influenced by.

**Properties:**
- Every action is double-sided (cause ↔ effect)
- Every node references others via `causalRefs`
- Nothing is deleted, only extended
- Balance is structural (not enforced by policy)

**What this means:**
```
user.alice = {
  work.task_123: [committed, fulfilled],
  vote.proposal_456: [cast, decayed],
  delegation.to_bob: [created, spent],
  building.store_001: [registered, modified],
  identity.self: [claimed, attested, evolved]
}
```

Alice is not a row in a database. She is the **intersection of all filaments where she appears**.

**Implications:**
- No "account deletion" (tree persists)
- No "reset state" (tree only grows)
- No "hidden history" (tree is inspectable)
- Exit = stopping new commits (tree remains)

**What this solves:**
- ✅ Exit mechanics (tree persists even when active identity stops)
- ✅ Identity drift (tree branches, evolves, forks)
- ✅ Attention scope (naturally collapses to your tree)
- ✅ Ownership (derived from participation, not declaration)

---

### 2. Identity Is a Filament (Not a Fixed Root)

**Definition:**
> Identity is not a fixed attribute. It is a filament that can be committed to, modified, attested to, or challenged over time.

**Commit types:**

#### Self-Commitments
```json
{
  "op_type": "IDENTITY_SELF_CLAIMED",
  "payload": {
    "user_ref": "user.alice.001",
    "claim": "Alice Johnson, Software Engineer",
    "proof_refs": ["email.alice@example.com", "github.alice"]
  }
}
```

#### External Attestations
```json
{
  "op_type": "IDENTITY_ATTESTED",
  "payload": {
    "user_ref": "user.alice.001",
    "attestor_ref": "user.bob.002",
    "claim": "Verified collaborator on project X",
    "strength": 0.8
  }
}
```

#### Community Actions
```json
{
  "op_type": "IDENTITY_FLAGGED",
  "payload": {
    "user_ref": "user.alice.001",
    "reason": "DISPUTED_AUTHORITY",
    "evidence_refs": ["commit.xyz@c42"]
  }
}
```

#### Evolution Events
```json
{
  "op_type": "IDENTITY_EVOLVED",
  "payload": {
    "user_ref": "user.alice.001",
    "from_role": "engineer",
    "to_role": "manager",
    "authority_changes": [...]
  }
}
```

**Properties:**
- Inspectable (full history visible)
- Time-bound (attestations decay)
- Context-scoped (identity differs by domain)
- Not a mask, not a number - **a history**

**What this solves:**
- ✅ Identity drift (identity can evolve via commits)
- ✅ Trust (trust is accumulated history, not a score)
- ✅ Authority (derived from identity filament + delegation)
- ✅ Graceful role changes (manager → engineer, active → inactive)

---

### 3. Buildings Are Space Tiles (Not Objects)

**Definition:**
> A building is not an object with properties. It is a persistent space tile in 3D that accumulates structures, functions, and history over time.

**Properties:**
- The **tile** is the spatial anchor (lat/lng or 3D coordinates)
- The **building** is the current configuration on that tile
- **Modifications are filament events** (not overwrites)
- **Ownership is commitments, not absolutes** (control over time, not title)

**Examples:**

#### Warehouse → Factory (Evolution)
```json
{
  "op_type": "BUILDING_EVOLVED",
  "payload": {
    "tile_ref": "tile.34.0522_-118.2437",
    "from_type": "logistics",
    "to_type": "vendor",
    "reason": "Repurposed for direct sales"
  }
}
```

#### Shop → Civic Hub (Repurposing)
```json
{
  "op_type": "BUILDING_REPURPOSED",
  "payload": {
    "tile_ref": "tile.40.7637_-73.9722",
    "from_type": "vendor",
    "to_type": "civic",
    "community_vote_ref": "vote.civic_proposal_789"
  }
}
```

#### Venue Splits (Tile Division)
```json
{
  "op_type": "TILE_SUBDIVIDED",
  "payload": {
    "original_tile": "tile.37.7749_-122.4194",
    "new_tiles": ["tile.37.7749_-122.4194.A", "tile.37.7749_-122.4194.B"],
    "reason": "Multi-tenant partnership space"
  }
}
```

**Key insight:** Nothing is replaced. Everything is layered.

**What this solves:**
- ✅ Ownership (becomes traceable control over time, not title)
- ✅ Evolution (buildings can change purpose without "deletion")
- ✅ Memory (spatial history is preserved)
- ✅ Flexibility (tiles can split, merge, evolve)

---

### 4. Buildings Are Units (Tradable, Governable)

**Definition:**
> Since buildings have identity, state, capabilities, history, and constraints, they are units. Therefore, they can be traded, leased, delegated, co-owned, and governed.

**Properties:**
- Buildings have identity (building IDs)
- Buildings have state (catalog, status, modifications)
- Buildings have capabilities (production, verification, logistics)
- Buildings have history (event log)
- Buildings have constraints (capacity, authority)

**Operations:**

#### Transfer (Sale)
```json
{
  "op_type": "BUILDING_TRANSFERRED",
  "payload": {
    "building_ref": "building.store_001",
    "from_owner": "user.alice.001",
    "to_owner": "user.bob.002",
    "payment_ref": "currency.transfer_xyz",
    "escrow_ref": "escrow.abc"
  }
}
```

#### Lease (Temporary Control)
```json
{
  "op_type": "BUILDING_LEASED",
  "payload": {
    "building_ref": "building.warehouse_002",
    "lessor": "user.alice.001",
    "lessee": "user.charlie.003",
    "duration_seconds": 2592000,
    "terms": {...}
  }
}
```

#### Co-ownership (Shared Control)
```json
{
  "op_type": "BUILDING_CO_OWNED",
  "payload": {
    "building_ref": "building.hq_001",
    "owners": [
      {"user_ref": "user.alice.001", "share": 0.6},
      {"user_ref": "user.bob.002", "share": 0.4}
    ],
    "governance_rules": {...}
  }
}
```

**Key difference from real estate:**
- Rules of transfer are **explicit** (recorded in filaments)
- Effects are **visible** (all changes logged)
- Authority is **scoped and revocable** (delegation chains)
- **History, not title, is authority**

**What this solves:**
- ✅ Markets (become filament interactions, not hidden contracts)
- ✅ Ownership (no hidden transfers, full transparency)
- ✅ Governance (no permanent control, explicit delegation)
- ✅ Flexibility (lease, co-own, delegate without legal complexity)

---

### 5. Proximity Channels Live Everywhere

**Definition:**
> Proximity channels are not a feature. They are a property of space + presence. They exist inside buildings, across tiles, between units, and between users.

**Where they exist:**
- **Inside buildings** (e.g., "Apple Store NYC lobby channel")
- **Across tiles** (e.g., "Times Square proximity network")
- **Between units** (e.g., "Drone-to-drone handoff channel")
- **Between users** (e.g., "Two users in same building")

**Properties:**
- **Coordination happens where you are** (not in abstract feeds)
- **Trust is local before global** (built through actual presence)
- **Influence radiates through interaction surfaces** (spatial gravity)
- **Locality without silos** (channels interconnect)

**Examples:**

#### Building Channel
```json
{
  "channel_id": "proximity.building.apple_store_nyc",
  "channel_type": "building_interior",
  "members": ["user.alice.001", "user.bob.002"],
  "auto_join": true,
  "visibility": "public"
}
```

#### Tile Proximity Network
```json
{
  "channel_id": "proximity.tile.times_square",
  "channel_type": "geographic_zone",
  "radius_meters": 100,
  "members_count": 1423,
  "visibility": "public"
}
```

#### Unit-to-Unit Handoff
```json
{
  "channel_id": "proximity.shipment_handoff_xyz",
  "channel_type": "transient",
  "participants": ["shipment.drone_001", "building.warehouse_002"],
  "duration_seconds": 60
}
```

**What this solves:**
- ✅ Attention (scope is spatial, not global feed)
- ✅ Discovery (proximity drives interaction)
- ✅ Trust (built through actual co-presence)
- ✅ Coordination (happens where it matters)

---

## THE FIVE MISSING LAYERS

These are layers the system needs to feel human-scale, not just mechanically correct.

### Missing Layer 1: Attention Economics

**Problem:** Relay has truth, constraints, and action surfaces - but not attention management.

**What's missing:**
- Alert prioritization filaments
- Escalation rules
- "You don't need to see this yet" logic
- Automatic batching/summarization (grounded in filaments, not vibes)

**Why it matters:**
Without this, coordination becomes anxiety, not clarity. Power shifts to whoever can stare at the HUD longest.

**StarCraft solved this:**
- Some alerts pull focus (base under attack)
- Others wait (upgrade complete)
- The game decides what interrupts you
- You can't do everything at once

**Relay needs:**
```json
{
  "op_type": "ATTENTION_PRIORITIZED",
  "payload": {
    "alert_ref": "task.urgent_delivery_123",
    "priority": "interrupt",
    "scope": "user.alice.001",
    "reason": "Commitment breach in 10 minutes"
  }
}
```

**Implementation path:** PR #10 (after spatial layer proven)

---

### Missing Layer 2: Failure as First-Class State

**Problem:** Relay records failure, but hasn't embraced: **failure is the default mode of exploration**.

**What's missing:**
- Failure budgets
- Visible risk tolerance
- "This area is experimental" zones on globe
- Cheap, reversible, scarred (not erased) failures

**Why it matters:**
Institutions pretend failure is exceptional. Most software hides it. Most governance punishes it.

**StarCraft solved this:**
- Units die constantly
- Builds fail
- Expansions get wiped
- Mistakes are normal, not catastrophic

**Relay needs:**
```json
{
  "op_type": "FAILURE_BUDGETED",
  "payload": {
    "building_ref": "building.experimental_lab_001",
    "failure_budget": 10,
    "failures_used": 3,
    "risk_zone": "experimental",
    "visible_scar": true
  }
}
```

**Implementation path:** PR #9 (after task/shipment stores)

---

### Missing Layer 3: Identity Evolution Primitives

**Problem:** Relay treats identity as stable enough for delegation, but people change faster than governance expects.

**What's missing:**
- Identity evolution primitives
- "This is no longer the same actor" signals
- Graceful authority decay when entity's role changes
- Identity forking/merging/decay

**Why it matters:**
Otherwise, history becomes a trap instead of a guide.

**StarCraft solved this:**
- Units morph (Zerg larva → mutalisk)
- Buildings upgrade (Command Center → Orbital Command)
- Tech evolves (researching upgrades changes capabilities)

**Relay needs:**
```json
{
  "op_type": "IDENTITY_EVOLVED",
  "payload": {
    "user_ref": "user.alice.001",
    "from_role": "engineer",
    "to_role": "manager",
    "authority_decay_schedule": [...],
    "delegation_adjustments": [...]
  }
}
```

**Implementation path:** PR #9 (identity filaments)

---

### Missing Layer 4: Exit Mechanics

**Problem:** Relay emphasizes participation, delegation, commitment - but not the right to disengage without punishment.

**What's missing:**
- Exit filaments
- Controlled wind-downs
- Commitment off-ramps
- "This authority is being intentionally relinquished"

**Why it matters:**
Long-term legitimacy depends on graceful exit. Most systems make leaving costly or impossible.

**StarCraft solved this:**
- You can leave a game
- Resign (intentional exit)
- Abandon a base (controlled wind-down)
- Stop playing (no punishment)

**Relay needs:**
```json
{
  "op_type": "EXIT_INITIATED",
  "payload": {
    "user_ref": "user.alice.001",
    "exit_type": "wind_down",
    "commitments_to_fulfill": ["task.xyz", "delegation.abc"],
    "authority_relinquishment": [...],
    "timeline_days": 30
  }
}
```

**Implementation path:** PR #11 (after delegation primitives proven)

---

### Missing Layer 5: Human Thermodynamics

**Problem:** Relay has designed **how coordination works**, but not **how it feels to live inside it for years**.

**What's missing:**
- Cognitive load patterns
- Social fatigue mitigation
- Meaning emergence without narrative control
- Gentle attention shaping

**Why it matters:**
The risk isn't technical. The risk is cognitive overload and social fatigue if the system doesn't shape attention, failure, and exit gently.

**StarCraft solved this:**
- The HUD teaches by showing (not by explaining)
- Constraints create meaning (not stories)
- Feedback is immediate (not delayed)
- You learn by doing (not by reading)

**Relay needs:**
- HUD that teaches by constraints
- Meaning from visible tradeoffs
- Feedback loops that feel like physics
- No centralized narrative control

**Implementation path:** Emergent from PR #7-12 (continuous refinement)

---

## THE SACRED INVARIANT

### No Filament May Ever Collapse Into a Single Scalar

**This is the line. Never cross it.**

**NO:**
- ❌ Global reputation number
- ❌ Universal currency (single fungible token)
- ❌ Single "trust score"
- ❌ Permanent authority weights
- ❌ Aggregated "net worth"
- ❌ Unified "social credit"

**YES:**
- ✅ Trees, not totals
- ✅ Trajectories, not balances
- ✅ Histories, not scores
- ✅ Context-scoped authority
- ✅ Time-bounded influence
- ✅ Multiple orthogonal gauges (never collapsed)

**Why this matters:**

If you collapse filaments into scalars, you get:
- Power law concentration (richest get richer)
- Gaming via optimization (maximize the number)
- Abstraction to "money-like" universal solvent
- Loss of context (why does this person have authority?)
- Loss of time dimension (history becomes irrelevant)

**As long as you keep this invariant, the system remains truthful.**

If you violate it, you recreate:
- Plutocracy (money = power)
- Credit scores (one number defines you)
- Social credit (surveillance state)
- Gamification hell (optimize the metric)

**Example of violation (DO NOT DO THIS):**
```json
// WRONG - DO NOT IMPLEMENT
{
  "user_ref": "user.alice.001",
  "reputation_score": 8573,  // ❌ SINGLE SCALAR
  "authority_level": 42       // ❌ COLLAPSED AUTHORITY
}
```

**Example of correct implementation:**
```json
// CORRECT - KEEP TREES
{
  "user_ref": "user.alice.001",
  "filament_tree": {
    "work.tasks": [
      {"commit_ref": "work.W123@c5", "state": "fulfilled"},
      {"commit_ref": "work.W124@c3", "state": "active"}
    ],
    "votes.proposals": [
      {"commit_ref": "vote.P456@c2", "decay_remaining": 0.73}
    ],
    "delegation.received": [
      {"from": "user.bob.002", "influence": 0.45, "scope": "engineering"}
    ]
  }
}
```

**Keep the tree. Never collapse it.**

---

## THE CLEAN ARTICULATION

> **"Relay is a world where identity, space, and action are all filaments: users are trees of influence, buildings are mutable spatial units, and the globe is a living map of accumulated coordination."**

---

## IMPLEMENTATION IMPACT

### Immediate Changes Needed

**None.** Current implementation (PR #1-6) is compatible with this ontology.

Buildings are already:
- ✅ Entities with IDs
- ✅ Event-sourced
- ✅ Spatial (geo_anchor)

Units are already:
- ✅ State machines
- ✅ Tracked in store

**What this unlocks:**
- Buildings can now be traded (add transfer events)
- Identity can now evolve (add identity filaments)
- Users can be viewed as trees (query across filaments)

---

### Medium-Term Additions (PR #9-12)

**New Filament Types:**

1. **`FilamentType::Identity`** (PR #9)
   - `IDENTITY_SELF_CLAIMED`
   - `IDENTITY_ATTESTED`
   - `IDENTITY_FLAGGED`
   - `IDENTITY_EVOLVED`

2. **`FilamentType::Attention`** (PR #10)
   - `ATTENTION_PRIORITIZED`
   - `ATTENTION_BATCHED`
   - `ATTENTION_ESCALATED`
   - `ATTENTION_DISMISSED`

3. **`FilamentType::Exit`** (PR #11)
   - `EXIT_INITIATED`
   - `EXIT_WIND_DOWN`
   - `EXIT_AUTHORITY_RELINQUISHED`
   - `EXIT_COMPLETED`

4. **`FilamentType::Proximity`** (PR #12)
   - `PROXIMITY_CHANNEL_CREATED`
   - `PROXIMITY_MEMBER_JOINED`
   - `PROXIMITY_MEMBER_LEFT`
   - `PROXIMITY_INTERACTION`

**New Stores:**

1. **IdentityStore** - Tracks identity filaments per user
2. **AttentionRouter** - Routes alerts based on priority/scope
3. **ProximityManager** - Manages spatial channels

**User Store Changes:**

- Users NOT stored in `UnitStore` (units are workers, not users)
- Users ARE derived from identity filaments
- User's "state" is a projection of their filament tree
- Query: "Give me all filaments where user.alice appears"

---

### Long-Term Architecture (Post-MVP)

**User as Query:**
```rust
fn get_user_tree(user_ref: &str) -> UserTree {
    // Aggregate all filaments where user appears
    let identity_filaments = identity_store.query(user_ref);
    let work_filaments = filament_store.query_by_author(user_ref);
    let vote_filaments = vote_store.query_by_voter(user_ref);
    let delegation_filaments = delegation_store.query_by_delegate(user_ref);
    
    UserTree {
        identity: identity_filaments,
        work: work_filaments,
        votes: vote_filaments,
        delegations: delegation_filaments,
        buildings_owned: building_store.query_by_owner(user_ref),
    }
}
```

**Building as Unit:**
```rust
fn transfer_building(
    building_ref: &BuildingId,
    from_owner: &UserId,
    to_owner: &UserId,
    payment: &CurrencyTransfer,
) -> Result<(), Error> {
    // Check authority
    if !authority_store.can_transfer(from_owner, building_ref) {
        return Err(Error::InsufficientAuthority);
    }
    
    // Create transfer event
    let event = RelayEvent::BuildingTransferred {
        building_ref: building_ref.clone(),
        from_owner: from_owner.clone(),
        to_owner: to_owner.clone(),
        payment_ref: payment.ref_id(),
    };
    
    // Log and emit
    event_log.append(event)?;
    event_bus.emit(event);
    
    Ok(())
}
```

---

## LOCKED INVARIANTS (NEW IN C10)

### Ontological Invariants (6 new)

1. **Users are filament trees, not accounts** - A user is the intersection of all filaments where they appear
2. **Identity is a filament, not a fixed root** - Identity evolves via commits from self and others
3. **Buildings are space tiles, not objects** - Tiles accumulate structures/functions/history over time
4. **Buildings are units** - They can be traded, leased, delegated, governed
5. **Proximity channels are spatial properties** - They exist wherever space + presence intersect
6. **No filament may collapse into a scalar** - Trees not totals, trajectories not balances (SACRED)

### Missing Layer Invariants (5 new)

7. **Attention is a scarce resource** - Must be governed like money/authority
8. **Failure is first-class state** - Default mode of exploration, not exceptional
9. **Identity evolution is primitive** - People change; system must accommodate gracefully
10. **Exit is a right** - Disengagement without punishment
11. **Human thermodynamics matter** - System must feel livable long-term

**Total locked invariants:** 65 (54 from c0-c9, 11 from c10)

---

## DEPENDENCIES

**Depends on:**
- c0: Filament Foundation (append-only logs)
- c1: Commit Causality (causal refs)
- c2: SCV Units (worker representation)
- c3: Authority Chains (delegation)
- c5: RenderSpec v1 (deterministic rendering)
- c6: Economic Primitives (money, votes, commitments)
- c7: Coordination Gauges (5 orthogonal resources)
- c8: Delegated Decaying Influence (time-bounded authority)
- c9: Personal HUD + Physical Globe (space-time distinction)

**Unlocks:**
- PR #9: Identity Filaments (self-claimed, attested, evolved)
- PR #10: Attention Layer (alert routing, prioritization)
- PR #11: Exit Mechanics (wind-down, relinquishment)
- PR #12: Proximity Channels (spatial coordination)

---

## TESTING STRATEGY

### Conceptual Tests (No Code Yet)

**Test 1: User as Tree**
- Query all filaments where user.alice appears
- Verify tree includes work, votes, delegations, buildings
- Verify no "account" object exists

**Test 2: Identity Evolution**
- User claims identity (self-commitment)
- Others attest (external commitment)
- Role changes (evolution event)
- Verify identity filament reflects all changes

**Test 3: Building as Unit**
- Register building
- Transfer to new owner
- Verify transfer event in log
- Verify new owner has authority

**Test 4: Proximity Channel**
- User enters building
- Verify proximity channel auto-join
- User leaves building
- Verify proximity channel auto-leave

**Test 5: Sacred Invariant**
- Attempt to compute "global reputation score"
- Verify system rejects (no API exists)
- Verify only tree queries allowed

---

## OPEN QUESTIONS

### Question 1: User Identity Implementation Priority

**When implement identity filaments?**
- A. After PR #8 (before frontend)
- B. After frontend Phase 5 (proven backend/frontend)
- C. Parallel with PR #7-8

**Recommendation:** B - prove spatial layer first, then add identity evolution.

---

### Question 2: Failure Budgets in Tasks

**Should PR #7 (Task Store) include:**
- A. Basic failure recording (task failed event)
- B. Failure budgets (max failures per building/user)
- C. Risk zones (experimental areas on globe)

**Recommendation:** A for PR #7, B+C for PR #9+.

---

### Question 3: Buildings as Tradable Units

**When implement building transfers?**
- A. PR #6 (now - basic transfer events)
- B. After currency filaments (PR #2 - money exists)
- C. After delegation primitives (PR #5 - authority clear)

**Recommendation:** C - need authority + money to trade meaningfully.

---

### Question 4: Proximity Channels Scope

**Should proximity channels be:**
- A. Always-on (automatic based on distance)
- B. Opt-in (user must join)
- C. Building-dependent (vendor allows, civic doesn't)
- D. Authority-gated (need delegation to enter)

**Recommendation:** Combination - default opt-in for public buildings, authority-gated for partnership/civic.

---

## FORWARD COMPATIBILITY

**This architecture commit:**
- ✅ Does NOT break existing code (PR #1-6)
- ✅ Guides future implementation (PR #7-12)
- ✅ Establishes sacred invariant (no scalar collapse)
- ✅ Names the 5 missing layers
- ✅ Defines user-as-tree ontology

**No immediate code changes required.**

**Implementation can proceed with PR #7 (Task Store) using current building/unit model.**

**Identity/attention/exit layers can be added incrementally after spatial layer proven.**

---

## BOTTOM LINE

**What changed:**
- Users are filament trees (not accounts)
- Identity is a filament (not fixed)
- Buildings are space tiles (not objects)
- Buildings are units (tradable)
- Proximity channels are spatial properties (not features)

**What stayed the same:**
- Filaments are still append-only
- Commits still have causal refs
- RenderSpec still deterministic
- HUD still personal, Globe still shared

**The sacred invariant:**
- No filament may ever collapse into a single scalar

**The breakthrough:**
> You've designed how coordination works. Now you're defining how it feels to live inside it.

**Status:** LOCKED - This is the ontological foundation.

---

**END OF ARCHITECTURE@C10**
