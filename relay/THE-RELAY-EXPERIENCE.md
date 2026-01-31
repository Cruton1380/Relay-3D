# The Relay Experience - North Star Vision

**Date:** 2026-01-28  
**Status:** LOCKED - This is the target experience  
**Reference:** All architecture commits build toward this

---

## THE CORE REALIZATION

> **"This isn't 'social media + e-commerce + governance.' It's a playable coordination reality."**

StarCraft didn't just inspire the UI. It inspired the truth model.

---

## THE COMPLETE FLOW (14 MOMENTS)

### 1. Accessing Relay (Entering the World)

**You don't "open an app."**

You enter a world that already knows who you are by history, not by a profile page.

**Authentication:**
- Biometric / key / device trust (details abstracted)
- System doesn't ask "Who are you?"
- System asks: **"Which filament tree is resuming?"**

**Within a second, the world loads.**

---

### 2. First Sight: Personal HUD Comes Alive

Before you touch the globe, your **personal HUD animates in**, StarCraft-style.

**Top-right: Resource Gauges**

You instantly see your current operating capacity:

```
🟦 Delegated Influence: 62% (slowly decaying, gently pulsing)
🟨 Commitment Capacity: 3 / 8 active
🟩 Escrowed Resources: $1.2K locked, $300 free
🟪 Time Pressure: 1 active vote ending in 2h 11m
🟥 Disputes / Scars: 0 urgent
```

**This answers one question immediately:**
> "What can I do right now?"

No scrolling. No digging.

---

### 3. Your Agents and Tasks (My Units, My Work)

**Left side: Unit / Agent Roster**

You see your controlled agents—some human, some automated:

```
🧍‍♂️ Alex (Human) – Working on partnership negotiation (Berlin)
🤖 SCV-Procure-01 – Monitoring supply availability
🤖 SCV-Logistics-02 – Tracking inbound shipment (ETA 18m)
```

**Each agent is clickable. Selecting one highlights:**
- Where they are on the globe
- What filaments they're attached to
- What authority they're currently spending

**Bottom center: Build / Task Queue**

Your production bar shows what's in progress:

```
📦 Phone order — queued (0%)
🤝 Partnership draft review — in progress (65%)
🗳️ Local zoning vote — passive (awaiting quorum)
```

**Nothing here is abstract.**

Every task corresponds to a filament with:
- A location
- A time window
- An authority cost

---

### 4. The Globe: Exploring the Shared Physical World

Now your attention moves to the **3D globe**.

**You pan and zoom. It's smooth, tactile, physical.**

**What you see:**
- Buildings rise from tiles
- Filaments arc between them (thin, luminous threads showing activity)
- Small moving units (drones, agents) traverse routes

**You zoom into your city block.**

---

### 5. Seeing People, Not Feeds (Human Peers)

**You notice:**
- A few human peers nearby (visible as avatars / presence indicators)
- Subtle proximity halos where local channels are active

**You click one peer.**

A small side panel opens showing:
- Their current role here
- Shared filaments (projects, votes, commitments)
- A lightweight communication channel (voice/text)

**Conversation isn't global broadcast—it's situated.**

You're not "chatting online."
You're talking **at this place, about this thing.**

---

### 6. Exploring Branches on the Tree (History Made Legible)

**You click a glowing filament near a building.**

The view shifts—not away from the world, but **into its history**.

**You see:**
- A branch timeline of commitments
- Forks where decisions diverged
- Scars where actions failed or were rejected
- Identities attached to each node

**You can scrub time.**
**You can open any node for forensic detail.**

**This answers:**
> "Why does this place work the way it does?"

No wiki. No trust leap. **Just history.**

---

### 7. Spotting the iStore on the Corner Block

Back on the globe, you notice a familiar building:

```
🏪 iStore – Downtown
```

It's a **vendor building anchored to a tile**.

You don't search for "iPhone."
**You click the building.**

---

### 8. Shopping = Production (Not Checkout)

**Selected Building Panel opens (bottom-left)**

**You see:**
- Building identity + reputation filament
- Current capacity
- Active proximity channel ("In-store / Near-store")

**Inside the panel is a catalog grid, like a Barracks unit list:**

```
📱 iPhone 15 Pro
🎧 AirPods Pro
💻 MacBook Air
```

**Each item shows:**
- Production / availability time
- Escrow required
- Delivery modes

**You select iPhone 15 Pro.**

---

### 9. Ordering 10 Minutes in Advance via Proximity Channel

**You choose:**
- Delivery to: my current tile
- Timing: ~10 minutes
- Mode: Drone express

**You confirm.**

**No forms. No payment screen drama.**

**Behind the scenes:**
- A task filament is created
- Escrow locks automatically
- The store's proximity channel accepts the order
- Authority and legitimacy checks pass instantly

---

### 10. The Build Queue Updates

**Bottom center, your build queue animates:**

```
📦 iPhone 15 Pro
Queued → Packing
Progress bar starts filling.
ETA: ~9:45
```

---

### 11. Watching Logistics Happen (This is the Magic)

**On the globe:**

1. **A drone unit spawns at the iStore building**
2. **A glowing polyline route appears**
3. **The drone lifts off and starts moving toward you**

**This is not a tracking number.**
**It's a unit you can see.**

**You can:**
- Click it
- Inspect its filament
- See custody, escrow state, and ETA
- Message logistics if needed

**Logistics becomes visceral.**

---

### 12. While You Wait: Life Continues

**While the drone is en route:**

- Your agent finishes a task (progress bar completes)
- A vote you delegated influence to ticks closer to resolution
- A peer nearby sends you a quick message

**Nothing blocks you.**
**Everything is concurrent, legible, and scoped.**

---

### 13. Delivery and Completion

**The drone arrives at your tile.**

1. It descends
2. The task completes
3. Escrow releases
4. The filament closes cleanly

**Your HUD updates:**
- Commitment capacity frees up
- Escrow balance changes
- A small "delivery complete" pulse appears

**No dopamine fireworks.**
**Just closure.**

---

### 14. What You Feel at the End

**You never once felt:**
- Lost
- Abstracted away from reality
- Unsure who was doing what
- Unsure why something happened

**You weren't:**
- Browsing feeds
- Filling forms
- Trusting invisible systems

**You were operating in a world where:**
- History is visible
- Authority is borrowed
- Logistics is physical
- Coordination is legible
- Shopping is production
- Identity is a living tree

---

## THE QUIET REALIZATION

This isn't "social media + e-commerce + governance."

**It's a playable coordination reality.**

StarCraft didn't just inspire the UI.
**It inspired the truth model.**

---

## TECHNICAL MAPPING (Experience → Architecture)

### Moment 1: "Which filament tree is resuming?"

**Technical requirement:**
- User authentication queries identity filament
- Identity filament contains attestations, history, authority
- No "profile" - just query: "Get all filaments where user.alice appears"

**Architecture reference:** `architecture@c10` (Users as filament trees)

**Implementation:** PR #9 (Identity Filaments)

---

### Moment 2: Personal HUD with Resource Gauges

**Technical requirement:**
- 5 real-time gauges (influence, commitment, escrow, time, disputes)
- Each gauge derived from filament state
- Gauges update via SSE (Server-Sent Events)

**Architecture reference:** `architecture@c7` (Coordination Gauges), `architecture@c8` (DDI)

**Implementation:**
- PR #2: Currency filaments (escrow gauge)
- PR #3: Vote filaments (legitimacy gauge)
- PR #4: Commitment filaments (commitment capacity gauge)
- PR #5: Delegation filaments (influence gauge)
- Frontend Phase 4: React gauge components

---

### Moment 3: Unit/Agent Roster + Build Queue

**Technical requirement:**
- Unit Store tracks SCV agents (human + automated)
- Task Store tracks build queue
- Each task links to building (production source)
- Each task shows progress (time-based or step-based)

**Architecture reference:** `architecture@c2` (SCV Units), `architecture@c9` (Build Queue)

**Implementation:**
- PR #1: Unit Store ✅
- PR #7: Task Store (in progress)
- Frontend Phase 4: UnitRoster + BuildQueueBar components

---

### Moment 4: 3D Globe with Buildings/Filaments/Drones

**Technical requirement:**
- Globe renderer (Three.js sphere with lat/lng mapping)
- Building nodes from RenderSpec
- Filament polylines from RenderSpec
- Shipment (drone) nodes from RenderSpec
- Animation intents for movement

**Architecture reference:** `architecture@c5` (RenderSpec v1), `architecture@c9` (Globe)

**Implementation:**
- PR #6: Building Store ✅
- PR #7: Task Store (in progress)
- PR #8: Shipment Store
- Frontend Phase 5: Globe renderer (Three.js)

---

### Moment 5: Peer Presence + Proximity Channels

**Technical requirement:**
- Proximity channels auto-join based on spatial location
- Peer presence indicators (avatars on globe)
- Lightweight communication (scoped to place/topic)

**Architecture reference:** `architecture@c10` (Proximity Channels)

**Implementation:**
- PR #12: Proximity Channel Manager
- Frontend Phase 6: Peer presence rendering

---

### Moment 6: Filament History Exploration

**Technical requirement:**
- Click filament → show commit timeline
- Scrub time → view historical state
- Forensic inspection → show causal refs, authority chains
- Branch visualization → show decision forks

**Architecture reference:** `architecture@c1` (Commit Causality), `architecture@c5` (RenderSpec)

**Implementation:**
- PR #1.3: Single commit fetch ✅
- PR #5: Render filament scene ✅
- Frontend Phase 7: Filament timeline UI

---

### Moment 7-10: Shopping Experience

**Building selection → Catalog display → Task creation → Build queue update**

**Technical requirement:**
- Building click → open SelectedBuildingPanel
- Catalog grid from building.props.catalog
- Task creation endpoint
- Build queue visualization
- Progress animation (0% → 100%)

**Architecture reference:** `architecture@c9` (Shopping as Production)

**Implementation:**
- PR #6: Building Store (catalog in props) ✅
- PR #7: Task Store (queued → packing states)
- Frontend Phase 4: SelectedBuildingPanel + BuildQueueBar

---

### Moment 11: Drone Spawning + Route Animation

**Technical requirement:**
- Task reaches "dispatched" → create shipment
- Shipment spawns at building location
- Route polyline from building to destination
- Position interpolation over time
- Animation intents for smooth movement

**Architecture reference:** `architecture@c9` (Shipments as Drones)

**Implementation:**
- PR #8: Shipment Store
- Frontend Phase 5: Drone renderer (Three.js)
- Frontend Phase 5: Route animation

---

### Moment 12: Concurrent Updates via SSE

**Technical requirement:**
- SSE stream delivers events in real-time
- HUD components subscribe to relevant events
- Multiple updates happen simultaneously (non-blocking)
- UI updates are incremental, not full refreshes

**Architecture reference:** `architecture@c1` (Event Bus)

**Implementation:**
- PR #1.2: SSE with replay ✅
- Frontend Phase 4: SSE client + event subscriptions

---

### Moment 13: Delivery Completion

**Technical requirement:**
- Shipment arrives → task completes
- Escrow releases (currency transfer)
- Commitment capacity frees up
- HUD gauges update
- Clean filament closure (no dangling state)

**Architecture reference:** `architecture@c6` (Escrow), `architecture@c7` (Gauges)

**Implementation:**
- PR #8: Shipment arrival event
- PR #2: Currency release
- PR #4: Commitment closure
- Frontend Phase 4: Gauge updates

---

### Moment 14: The Feeling

**Technical requirement:**
- No hidden state (everything inspectable)
- No magic (all changes logged as events)
- No uncertainty (deterministic replay proves correctness)
- No abstraction leakage (filaments don't become scalars)

**Architecture reference:** `architecture@c0-c10` (All invariants)

**Implementation:** All PRs maintain these properties

---

## MILESTONE MAP (What's Needed When)

### ✅ Already Built (PR #1-6)

**Completed:**
- Deterministic replay (PR #1.1)
- SSE with replay (PR #1.2)
- Single commit fetch (PR #1.3)
- RenderSpec v1 schema (PR #5)
- Building Store with catalog (PR #6)

**Experience coverage:**
- Moment 6: Filament history (partial - forensic inspection)
- Moment 7: Building selection (backend ready)

---

### 🚧 In Progress (PR #7)

**Current work:**
- Task Store (build queue)
- Task lifecycle (queued → packing → dispatched → in_transit → delivered)
- Task nodes in RenderSpec

**Experience coverage:**
- Moment 3: Build queue (partial - backend only)
- Moment 8-10: Shopping experience (backend ready)

---

### ⏭️ Next Up (PR #8)

**Upcoming:**
- Shipment Store (drones)
- Position interpolation (route animation)
- Shipment nodes in RenderSpec

**Experience coverage:**
- Moment 11: Drone spawning + route animation (backend ready)
- Moment 13: Delivery completion (backend ready)

---

### 🔮 Future PRs (PR #9-12)

**PR #9: Identity Filaments**
- Moment 1: "Which filament tree is resuming?"
- Self-commitments, attestations, evolution

**PR #10: Attention Layer**
- Moment 2: Resource gauges (alert prioritization)
- Moment 12: Smart concurrent updates

**PR #11: Exit Mechanics**
- Graceful disengagement
- Authority relinquishment

**PR #12: Proximity Channels**
- Moment 5: Peer presence
- Moment 9: Proximity-based ordering

---

### 🎨 Frontend Phases

**Phase 1: Basic UI Shell** (not started)
- React app structure
- Routing

**Phase 2: SSE Integration** (not started)
- Event stream connection
- Real-time updates

**Phase 3: HUD Components** (not started)
- ResourceGaugesRow
- BuildQueueBar
- UnitRoster

**Phase 4: Building Interaction** (not started)
- SelectedBuildingPanel
- Catalog grid
- Task creation

**Phase 5: 3D Globe** (not started)
- Three.js globe
- Building rendering
- Drone rendering
- Route animation

**Phase 6: Advanced Features** (not started)
- Filament timeline UI
- Peer presence
- Proximity channels

---

## THE GAP BETWEEN NOW AND THE VISION

### What We Have (January 2026)

**Backend (Layer 2):**
- ✅ Append-only filaments
- ✅ Deterministic replay
- ✅ Event sourcing
- ✅ Building Store
- ✅ Unit Store
- ✅ RenderSpec v1 output
- 🚧 Task Store (in progress)

**Frontend (Layer 3):**
- ❌ Nothing yet

**Gap:** ~200 hours of implementation
- Backend (PR #7-12): ~60 hours
- Frontend (Phases 1-6): ~140 hours

---

### What's Needed for Minimal Viable Experience

**To achieve Moments 1-13 (the core shopping flow):**

**Backend:**
- ✅ Building Store (PR #6)
- 🚧 Task Store (PR #7) - 4-6 hours
- ⏭️ Shipment Store (PR #8) - 6-8 hours
- ⏭️ Currency filaments (PR #2) - 6-8 hours
- ⏭️ Commitment filaments (PR #4) - 6-8 hours

**Total backend:** ~30 hours remaining

**Frontend:**
- Phase 1-2: Shell + SSE - 20 hours
- Phase 3: HUD components - 30 hours
- Phase 4: Building panels - 20 hours
- Phase 5: 3D globe - 40 hours

**Total frontend:** ~110 hours

**Total to minimal viable experience:** ~140 hours (~3.5 weeks full-time)

---

## FAILURE CASES (As You Suggested)

### Scenario 1: Store Out of Stock

**What happens:**
1. User clicks iPhone in catalog
2. Task created (queued)
3. Task progresses to "packing"
4. `TASK_FAILED` event: "VENDOR_OUT_OF_STOCK"
5. Task bar shows red "Failed" indicator
6. Escrow returns to user
7. Commitment capacity frees up
8. HUD shows notification: "iPhone unavailable - escrow returned"

**User can:**
- Retry later
- Choose alternative product
- Inspect failure in filament history

**Scar recorded:** Vendor's reliability filament gets a scar (visible to others)

---

### Scenario 2: Drone Rerouted

**What happens:**
1. Drone en route
2. Weather event / obstruction detected
3. `SHIPMENT_REROUTED` event
4. Route polyline updates (new path)
5. ETA recalculates
6. HUD updates: "Delivery rerouted - new ETA 15m"

**User can:**
- See new route on globe
- Inspect reroute reason
- Contact logistics if concerned

**No failure:** This is normal adaptation, not a scar

---

### Scenario 3: Vote Overturns Authority

**What happens:**
1. User has delegated influence to Alice
2. Alice uses influence to approve vendor
3. Community votes to revoke Alice's authority
4. `DELEGATION_REVOKED` event
5. Alice's pending actions frozen
6. HUD shows: "Authority challenge - action paused"

**User can:**
- Inspect vote filament
- See why authority challenged
- Decide to re-delegate or withdraw

**History preserved:** All events logged, inspectable

---

## BOTTOM LINE

This experience document is **the north star**.

Every PR, every architectural decision, every invariant exists to serve this experience.

**The question is never:** "Is this technically possible?"

**The question is always:** "Does this bring us closer to Moment 1-14?"

---

## NEXT STEPS (Your Choice)

### Option A: Continue Implementation (PR #7)
**Action:** Implement Task Store (4-6 hours)  
**Result:** Moments 8-10 backend complete

### Option B: Prototype End-to-End Flow
**Action:** Mock Moments 7-13 with fake data  
**Result:** Visual proof of experience

### Option C: Design Failure Cases Fully
**Action:** Spec out all failure flows  
**Result:** Complete failure/scar architecture

### Option D: Map Frontend Architecture
**Action:** Design React component structure  
**Result:** Frontend implementation roadmap

---

**This is the vision. This is what we're building.**

**Status:** LOCKED - This is the target

---

**END OF VISION DOCUMENT**
