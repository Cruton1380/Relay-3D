# ✅ architecture@c10: ONTOLOGICAL FOUNDATION - LOCKED

**Date:** 2026-01-28  
**Status:** LOCKED  
**Reference:** `relay/filaments/architecture/0010_ontological_foundation.md`

---

## 🎯 WHAT WE JUST LOCKED

**The ontological breakthrough:** Users, identity, and buildings are all filaments - not static objects.

**Core insight:** The system has designed **how coordination works**. Now we're defining **how it feels to live inside it for years**.

---

## 🌳 THE FIVE CORE CLARIFICATIONS

### 1. Users Are Filament Trees (Not Accounts)
> A user is not an account. A user is a growing filament tree representing all the places they have influenced and been influenced by.

**Properties:**
- Every action is double-sided (cause ↔ effect)
- Every node references others
- Nothing deleted, only extended
- Balance is structural

**What this solves:**
- ✅ Exit (tree persists when active identity stops)
- ✅ Identity drift (tree branches, evolves)
- ✅ Attention scope (collapses to your tree)

---

### 2. Identity Is a Filament (Not a Fixed Root)
> Identity is not a fixed attribute. It is a filament that can be committed to, modified, attested to, or challenged over time.

**Commit types:**
- Self-commitments (I say who I am)
- External attestations (others vouch)
- Community actions (flags, endorsements)
- Evolution events (role changes)

**What this solves:**
- ✅ Identity drift (identity evolves via commits)
- ✅ Trust (history, not score)
- ✅ Authority (derived from identity + delegation)

---

### 3. Buildings Are Space Tiles (Not Objects)
> A building is not an object. It is a persistent space tile that accumulates structures, functions, and history over time.

**Properties:**
- Tile is the spatial anchor
- Building is current configuration
- Modifications are filament events
- Ownership is commitments, not absolutes

**Examples:**
- Warehouse → Factory (evolution)
- Shop → Civic hub (repurposing)
- Venue splits (tile division)

**What this solves:**
- ✅ Ownership (traceable control over time)
- ✅ Evolution (buildings change without deletion)
- ✅ Memory (spatial history preserved)

---

### 4. Buildings Are Units (Tradable, Governable)
> Since buildings have identity, state, capabilities, history, and constraints, they are units. They can be traded, leased, delegated, co-owned, and governed.

**Operations:**
- Transfer (sale)
- Lease (temporary control)
- Co-ownership (shared control)

**Key difference from real estate:**
- Rules explicit (in filaments)
- Effects visible (all logged)
- Authority scoped/revocable (delegation)
- History, not title, is authority

**What this solves:**
- ✅ Markets (filament interactions)
- ✅ Ownership (transparent transfers)
- ✅ Governance (no permanent control)

---

### 5. Proximity Channels Live Everywhere
> Proximity channels are not a feature. They are a property of space + presence.

**Where they exist:**
- Inside buildings
- Across tiles
- Between units
- Between users

**What this solves:**
- ✅ Attention (scope is spatial)
- ✅ Discovery (proximity drives interaction)
- ✅ Trust (built through presence)

---

## 🚨 THE FIVE MISSING LAYERS

These are the human-scale layers needed for long-term livability:

### 1. Attention Economics
**Gap:** Relay has truth, constraints, actions - but not attention management.

**Needed:**
- Alert prioritization filaments
- Escalation rules
- Automatic batching/summarization

**Why:** Without this, coordination becomes anxiety.

---

### 2. Failure as First-Class State
**Gap:** Relay records failure, but hasn't embraced it as default exploration mode.

**Needed:**
- Failure budgets
- Visible risk tolerance
- Experimental zones

**Why:** Institutions hide failure. StarCraft normalizes it.

---

### 3. Identity Evolution Primitives
**Gap:** Identity treated as stable, but people change faster than governance.

**Needed:**
- Evolution primitives
- "No longer same actor" signals
- Graceful authority decay

**Why:** Otherwise history becomes trap, not guide.

---

### 4. Exit Mechanics
**Gap:** Emphasizes participation, not right to disengage.

**Needed:**
- Exit filaments
- Wind-downs
- Commitment off-ramps

**Why:** Long-term legitimacy requires graceful exit.

---

### 5. Human Thermodynamics
**Gap:** Designed how it works, not how it feels.

**Needed:**
- Cognitive load patterns
- Social fatigue mitigation
- Meaning from constraints

**Why:** Risk is cognitive overload, not technical failure.

---

## 🔒 THE SACRED INVARIANT

### No Filament May Ever Collapse Into a Single Scalar

**This is the line. Never cross it.**

**NO:**
- ❌ Global reputation number
- ❌ Universal currency
- ❌ Single "trust score"
- ❌ Permanent authority weights

**YES:**
- ✅ Trees, not totals
- ✅ Trajectories, not balances
- ✅ Histories, not scores

**Why:** If you collapse, you get power law concentration, gaming, plutocracy.

**Keep the tree. Never collapse it.**

---

## 📐 THE CLEAN ARTICULATION

> **"Relay is a world where identity, space, and action are all filaments: users are trees of influence, buildings are mutable spatial units, and the globe is a living map of accumulated coordination."**

---

## 🚀 IMPLEMENTATION IMPACT

### Immediate (PR #6-8)
**Good news:** Current implementation is compatible. No breaking changes.

**Buildings (PR #6):**
- ✅ Already entities with IDs
- ✅ Already event-sourced
- ⚠️ Will add: transfer/lease events (later)

**Tasks (PR #7):**
- ✅ Already linked to buildings
- ⚠️ Will add: attention priority field
- ⚠️ Will add: failure budget tracking

**Shipments (PR #8):**
- ✅ Already have routes
- ⚠️ Will add: proximity channel activation

---

### Medium-Term (PR #9-12)

**New Filament Types:**
1. `FilamentType::Identity` (PR #9)
2. `FilamentType::Attention` (PR #10)
3. `FilamentType::Exit` (PR #11)
4. `FilamentType::Proximity` (PR #12)

**New Stores:**
- IdentityStore
- AttentionRouter
- ProximityManager

**User Store Changes:**
- Users NOT in UnitStore
- Users derived from identity filaments
- User state = projection of tree

---

## 🔢 LOCKED INVARIANTS (NEW IN C10)

### Ontological (6 new)
1. Users are filament trees, not accounts
2. Identity is a filament, not a fixed root
3. Buildings are space tiles, not objects
4. Buildings are units (tradable)
5. Proximity channels are spatial properties
6. No filament may collapse into scalar **(SACRED)**

### Missing Layers (5 new)
7. Attention is a scarce resource
8. Failure is first-class state
9. Identity evolution is primitive
10. Exit is a right
11. Human thermodynamics matter

**Total locked invariants:** 65 (54 from c0-c9, 11 from c10)

---

## ❓ OPEN QUESTIONS (For User)

### Q1: User Identity Implementation Priority
When implement identity filaments?
- A. After PR #8
- B. After frontend Phase 5
- C. Parallel with PR #7-8

**Recommendation:** B

### Q2: Failure Budgets in Tasks
Should PR #7 include?
- A. Basic failure recording
- B. Failure budgets
- C. Risk zones

**Recommendation:** A for PR #7, B+C later

### Q3: Buildings as Tradable
When implement building transfers?
- A. PR #6 (now)
- B. After currency (PR #2)
- C. After delegation (PR #5)

**Recommendation:** C

### Q4: Proximity Channels Scope
Should they be?
- A. Always-on
- B. Opt-in
- C. Building-dependent
- D. Authority-gated

**Recommendation:** Combination

---

## 🎯 NEXT STEPS

**Immediate:**
1. ✅ architecture@c10 locked (this document)
2. ⏩ Proceed to PR #7: Task Store

**PR #7 will implement:**
- Task lifecycle (queued → packing → dispatched → in_transit → delivered)
- Link tasks to buildings
- Build queue visualization (shopping as production)

**Estimate:** 4-6 hours

---

## 📄 KEY FILES

**Architecture commit:**
- `relay/filaments/architecture/0010_ontological_foundation.md`

**Index files:**
- `relay/filaments/architecture.jsonl`
- `relay/filaments/architecture/README.md`

**Summary (this file):**
- `ARCHITECTURE-C10-LOCKED.md`

---

## 💬 THE BREAKTHROUGH QUOTE

> **"You've designed how coordination works. Now you're defining how it feels to live inside it for years."**

---

**Status:** ✅ LOCKED  
**Next:** PR #7 - Task Store  
**Blockers:** None

---

**This is the ontological foundation. Everything else builds on this.**

---

**END OF C10 LOCK**
