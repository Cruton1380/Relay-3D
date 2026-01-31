# 👁️ Presence + Permission Model — Multi-Party Inspectability

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Executive Summary

In Relay, **presence** makes "who is inspecting / working where" visible in a way that is **truthful, non-abusive, and auditable**. This document defines how multi-party inspectability works while preventing surveillance, respecting privacy, and maintaining accountability.

**Core Principle:**
> Presence is a **lens** (like user spheres), not truth. It shows who is currently "at" a locus in truth-space, subject to explicit permission policies that prevent abuse while enabling coordination.

**Key Innovations:**
- **Anchored Presence**: Always attached to filaments, TimeBoxes, or branch frontiers (never floating)
- **Tiered Visibility**: Counts → Roles → Identities (progressive disclosure)
- **Policy-Driven**: Org/team policies control visibility, not individual hacks
- **Ephemeral**: Not committed to Git (in-memory, short TTL)
- **Branch-Aware**: Presence tracks which branch lineage you're inspecting
- **No Surveillance**: Movement not logged by default, policy changes are audited

**Why It Matters:**
Enables **coordination without surveillance**, **accountability without creepiness**, and **transparency without doxxing**.

---

## Table of Contents

1. [Core Definitions](#core-definitions)
2. [Non-Negotiable Invariants](#non-negotiable-invariants)
3. [Visibility Modes](#visibility-modes)
4. [Permission Tiers](#permission-tiers)
5. [Presence Data Model](#presence-data-model)
6. [Branch-Aware Presence](#branch-aware-presence)
7. [Rendering Rules](#rendering-rules)
8. [Manager Visibility (Strict Rules)](#manager-visibility-strict-rules)
9. [Auditing Without Surveillance](#auditing-without-surveillance)
10. [Technical Implementation](#technical-implementation)
11. [Real-World Scenarios](#real-world-scenarios)
12. [Integration with Other Systems](#integration-with-other-systems)
13. [Frequently Asked Questions](#frequently-asked-questions)

---

## Core Definitions

### What Is Presence?

**Presence** = A live, permission-scoped indicator that an actor is currently "at" a locus in truth-space.

**NOT:**
- ❌ A surveillance tracker
- ❌ A social status ("Alice is online")
- ❌ A movement log
- ❌ A chat indicator

**IS:**
- ✅ A coordination signal ("2 people inspecting this commit")
- ✅ A collaboration enabler ("Alice is here too, we can work together")
- ✅ A work-locus indicator ("3 Finance team members reviewing budget")
- ✅ An ephemeral, permission-gated lens

### What Is a Locus?

**Locus** = Where presence attaches. Four types:

#### 1. **BranchFrontier** (Globe/Projection View)
The current "tip" of a branch, rendered as a vertical branch on the globe.

**Example:** "5 viewers on Budget 2026 branch"

#### 2. **Filament** (Identity Through Time)
The entire filament (horizontal in workflow view).

**Example:** "Alice inspecting Budget 2026 filament (general)"

#### 3. **TimeBox** (Specific Commit)
A single commit in the filament history.

**Example:** "Bob inspecting Budget 2026, commit 42"

#### 4. **Workspace** (Org/Dept/Workflow Container)
A higher-level grouping (department, project, region).

**Example:** "12 viewers in Finance Department workspace"

**Critical Rule:**
> **Presence is never floating. It is always anchored.**

---

## Non-Negotiable Invariants

These rules cannot be violated without breaking the model's integrity:

### **I1 — Presence is a Lens, Not Authority**
Presence **must never** affect:
- Truth (Git commits)
- History (filament timeline)
- Votes (democratic outcomes)
- Commit state (envelope data)

**Why:** Presence is observer metadata, not reality.

---

### **I2 — Presence Does Not Log Movement by Default**
- ❌ No minute-by-minute tracking
- ❌ No playback trails stored as truth
- ✅ Allowed: Ephemeral local trails (client-only) for navigation
- ✅ Forbidden: Persistent movement history unless explicitly enabled by policy **and** disclosed to users

**Why:** Movement logging is surveillance infrastructure.

---

### **I3 — Presence Visibility is Governed**
Visibility is **not** a personal hack. It is a **policy/permission rule** with explicit modes.

**Who Sets Policy:**
- Filament owner (for their filaments)
- Org admins (for org workspaces)
- Team leads (for team spaces)
- User (for personal sphere)

**Enforcement:** Policy stored as commits (auditable, versioned).

---

### **I4 — "Hidden ≠ Gone" Applies to Presence**
Users may be visible as:
- **Counts**: "N viewers here" (Tier 1)
- **Roles**: "2 Finance, 1 Audit" (Tier 2)
- **Identities**: "Alice, Bob" (Tier 3)

But **never more than the viewer is permitted to see.**

**Example:** Manager can see "3 Finance viewers" but not individual names unless policy allows.

---

### **I5 — No Doxxing Surfaces**
Relay **never exposes**:
- Raw network identifiers (IP addresses)
- Exact physical location (GPS coordinates)
- Personally identifying work patterns (unless explicitly permitted)

**Why:** Privacy is a safety requirement, not an option.

---

## Visibility Modes

These modes are **selectable within policy bounds** (org/team/filament policies determine available modes).

### **Invisible**
**What Others See:** Nothing attributable to you  
**Aggregation:** You may contribute anonymously to "N viewers here" if aggregation is enabled  
**Use Case:** Private inspection, personal research  

**Example:**
```typescript
user.presencePolicy = {
  mode: 'invisible',
  allowAggregation: true  // Still counted, but not identified
};
```

---

### **Group-Visible**
**What Others See:**
- Group members: Your identity/role
- Non-members: "N viewers here" (aggregated count)

**Use Case:** Team collaboration, project workspaces  

**Example:** Finance team members can see each other's presence on budget filaments, but others see only "3 Finance viewers."

---

### **Manager-Visible**
**What Others See:**
- Managers: Current work locus only (not movement history)
- Peers: "N viewers here" (aggregated)

**Strict Rules:**
- Managers see **locus only**, not navigation path
- No dwell-time metrics
- Must be **transparent** (employees know manager can see)
- Must be **logged** (policy change creates audit trail)

**Use Case:** Work coordination in orgs with hierarchical oversight  

**Example:** Department head sees "Alice at Budget Review, Bob at Audit Report" but not how they got there or how long they've been there.

---

### **Org-Visible**
**What Others See:** Anyone in org can see your presence  
**Use Case:** Public-facing roles (moderators, support, elected officials)  

**Rare:** Generally discouraged except for roles where presence disclosure is the point.

---

### **Public**
**What Others See:** Anyone, anywhere can see your presence  
**Use Case:** Public channels, open governance, community moderators  

**Very Rare:** Reserved for channels where identity disclosure is intentional.

---

### **Visibility Defaults by Filament Type (Policy-Scoped)**

Presence mechanism is **identical** for all filaments, but **default visibility** varies by filament type:

| Filament Type | Default Visibility | Rationale |
|---------------|-------------------|-----------|
| **Operational/KPI** | Counts (Tier 1) | Coordination helpful, identity not needed |
| **Infrastructure** | Hidden/Restricted | Prevents surveillance of SRE/admin work |
| **Governance** | Restricted → Group | Identity reveal requires explicit policy |
| **Personal** | Invisible | User controls visibility |

**Policy decides what renders; presence data may exist everywhere.**

---

## Permission Tiers

Presence rendering resolves into **4 progressive tiers**. Policy determines which tier you see.

### **Tier 0: None**
**You See:** Nothing  
**When:** You lack permission to see presence on this locus  

---

### **Tier 1: Count Only**
**You See:** "N viewers here"  
**Details:** No identities, no roles, no timestamps  
**When:** Default for most spaces, public channels  

**Example Rendering:**
```
┌─────────────────────────────────┐
│ Budget 2026 Filament            │
│                                 │
│ 🟢 3 viewers inspecting         │
└─────────────────────────────────┘
```

---

### **Tier 2: Role/Team Tokens**
**You See:** "2 Finance, 1 Audit"  
**Details:** Anonymous role markers, no names  
**When:** Group-visible or manager-visible mode  

**Example Rendering:**
```
┌─────────────────────────────────┐
│ Budget 2026 Filament            │
│                                 │
│ 🔵 Finance (2)                  │
│ 🟡 Audit (1)                    │
└─────────────────────────────────┘
```

---

### **Tier 3: Identified Markers**
**You See:** Names/avatars/public keys  
**Details:** Full identity (if permitted)  
**When:** Team workspace, mutual permission, or public mode  

**Example Rendering:**
```
┌─────────────────────────────────┐
│ Budget 2026 Filament            │
│                                 │
│ 👤 Alice (Finance)              │
│ 👤 Bob (Audit)                  │
│ 👤 Carol (Operations)           │
└─────────────────────────────────┘
```

**Still Anchored:** Even at Tier 3, no movement history is shown. You see "Alice is here" not "Alice moved from X to Y."

---

**Default:** **Tier 1 in most spaces.**

---

## Presence Data Model

Presence is an **ephemeral session channel**, not written to the Git truth ledger.

### **Minimal Presence State**

```typescript
interface PresenceLocus {
  filamentId: string;
  commitIndex?: number | 'latest';  // Specific commit or frontier
  lensContext: string;  // 'globe' | 'workflow' | 'sheet' | 'sphere:userId'
}

interface PresenceState {
  locus: PresenceLocus;
  count: number;        // How many viewers at this locus
  updatedAt: number;    // Last update timestamp
  ttlMs: number;        // Time-to-live (e.g., 8-12 seconds)
}

interface ViewerSession {
  sessionId: string;
  actorId: string | 'hidden';  // hidden if tier < 3
  visibilityMode: 'invisible' | 'group' | 'manager' | 'org' | 'public';
  locus: PresenceLocus;
  lastHeartbeat: number;
  capabilities?: string[];  // ['view', 'edit', 'moderate']
}
```

### **Storage:**
- **In-memory** (e.g., Redis, in-process Map)
- **Short TTL** (8-12 seconds typical)
- **Optional regional relay nodes** for federation
- **NOT committed** to Git truth chain

### **Heartbeat Mechanism:**
```typescript
// Client sends heartbeat every 3-5 seconds
presenceService.heartbeat({
  locus: {
    filamentId: 'budget-2026',
    commitIndex: 42,
    lensContext: 'workflow'
  },
  viewerSession: {
    sessionId: mySessionId,
    actorId: user.hidden ? 'hidden' : user.id,
    visibilityMode: user.presencePolicy.mode
  }
});

// Server updates presence map
// If no heartbeat for 8-12s → session expires
```

---

## Branch-Aware Presence

### The Problem

Forking is **ontological**. If a filament has 2 branches:
- `main` (original)
- `alice-proposal` (fork)

Presence must distinguish "who is inspecting which branch?"

### The Solution

**Rule:**
- Same `filamentId` + `commitIndex` → implies an ancestry path
- Presence aggregation is performed **per-branch lineage** (ancestry-aware grouping)

**Tier 1 Rendering:**
- **Workflow/Filament view:** Show separate presence per branch
- **Globe view:** Tier 1 keeps separate counts per branch; combined display is Tier 2+ (lens aggregation)

**Example:**
```
Budget 2026 Filament (2 branches):

Branch: main
├─ Commit 40: 🟢 2 viewers
├─ Commit 41: 🟢 1 viewer
└─ Commit 42: 🟢 3 viewers

Branch: alice-proposal (forked from commit 40)
├─ Commit 40: 🟢 1 viewer  (Alice inspecting fork point)
├─ Commit 43: 🟢 1 viewer  (Alice's new commit)
└─ Commit 44: 🟢 2 viewers (Alice + Bob on proposal)
```

**Query:**
```typescript
const presenceMain = getPresence({
  filamentId: 'budget-2026',
  commitIndex: 42,
  branch: 'main'
});  // → { count: 3 }

const presenceProposal = getPresence({
  filamentId: 'budget-2026',
  commitIndex: 44,
  branch: 'alice-proposal'
});  // → { count: 2 }
```

---

## Rendering Rules

### **A) Globe / Branch Frontier View**

**Tier 1 (Default):**
- Small **pulse intensity** indicates activity
- Brighter pulse = more viewers
- No individual markers

**Tier 2:**
- Tiny **role-colored markers** on branch surface
- Clustered by role (Finance = blue, Audit = yellow)

**Tier 3:**
- **Labeled markers** visible only at near distance
- Fade in as camera approaches

**Markers cling to branch surface** (not floating in air).

**Example:**
```
      🌍 Globe View
      
   Budget Branch (vertical)
   ↑
   │ 🔵🔵  (2 Finance, Tier 2)
   │ 🟡    (1 Audit, Tier 2)
   │
   │ Pulse: ████░░░░ (Tier 1 activity indicator)
   │
   └─ (lat, lon)
```

---

### **B) Workflow / Filament View**

**Presence anchors to:**
- Filament spine segment (general)
- Specific TimeBox (precise)

**Rendering:**
- Small **"locator bead"** on the filament
- Optional label in near mode

**Multiple viewers:**
- Stack as a **ring of beads** around filament circumference
- Or stack vertically with slight offset

**Example:**
```
Filament (horizontal, X-axis = time):

TimeBox 40    TimeBox 41    TimeBox 42
   □             □             □  🟢🟢🟢 (3 viewers, Tier 1)
   │─────────────│─────────────│
   ├─────────────┼─────────────┤
  🟢 (1 viewer)               (Filament spine)
```

---

### **C) Spreadsheet Projection View**

**Presence appears at:**
- The **column/region** being inspected (Tier 1/2)
- The **selected cell** only if Tier 3 permitted

**Example:**
```
Spreadsheet (cells = +X faces of TimeBoxes):

     A        B         C
1   1000     2000      3000
2   1500     2500      3500  ← 🟢 2 viewers (Tier 1)
3   2000     3000      4000
```

---

## Manager Visibility (Strict Rules)

### **What Managers Can See**

✅ **Allowed:**
- Current work locus (which filament/commit/workspace)
- Aggregated time in workspace (coarse: "active today")
- Role/capability (viewer, editor, moderator)

❌ **Forbidden:**
- Navigation path (how they got there)
- Dwell time per commit (how long at each step)
- Inspection sequence (order of commits viewed)
- Real-time movement stream

### **Transparency Requirements**

If **manager-visible** mode is enabled:
1. **Explicit Disclosure**: Employees must know manager can see presence
2. **Policy Logging**: Manager visibility setting is a committed policy change
3. **Audit Trail**: All policy changes logged (who enabled, when, why)
4. **Bounded Scope**: Manager visibility applies only to work filaments (not personal)

### **Example Policy:**

```typescript
const workspacePolicy = {
  name: 'Finance Department',
  presenceVisibility: {
    mode: 'manager-visible',
    managers: ['user:dept-head'],
    boundedTo: ['filament:budget-*', 'filament:audit-*'],
    excludes: ['filament:personal-*'],
    disclosureRequired: true,
    loggingEnabled: true
  }
};
```

**Result:**
- Department head sees "Alice at Budget Review" (locus only)
- Alice knows this is visible (disclosure)
- Policy change is auditable (committed)
- Personal filaments are excluded (privacy boundary)

---

## Auditing Without Surveillance

### **What IS Logged (Policy Commits)**

✅ **Auditable:**
- Changes to presence policy (committed as governance)
- Who is allowed to see whom (permission rules)
- Whether manager visibility exists (transparency)
- Whether aggregation is enabled (opt-in/opt-out)
- Retention rules for presence summaries (if any)

**Example Audit Log:**
```
Commit: abc123
Type: POLICY_CHANGE
Change: Enabled manager-visible presence for Finance dept
Actor: dept-head-alice
Timestamp: 2026-01-27T10:00:00Z
Disclosure: Sent to all Finance team members
```

---

### **What is NOT Logged by Default**

❌ **Not Logged:**
- Per-user movement (navigation paths)
- Per-user dwell time (how long at each commit)
- Exact navigation sequences (order of inspection)
- Real-time presence stream (unless explicitly enabled + disclosed)

---

### **Optional (Only If Org Explicitly Enables)**

🔒 **Coarse Presence Snapshots:**
- Long intervals (e.g., every 30-60 minutes)
- Aggregated by team, not by person
- Explicitly disclosed to employees
- Committed as policy before enabled

**Example Snapshot:**
```json
{
  "timestamp": "2026-01-27T14:00:00Z",
  "workspace": "Finance Department",
  "summary": {
    "active_members": 12,
    "focus_areas": {
      "budget-review": 5,
      "audit-compliance": 4,
      "planning": 3
    }
  }
}
```

**NOT Included:** Individual names, exact timestamps per person, navigation paths.

---

## Technical Implementation

### **Tier 1 Implementation (Currently Deployed)**

**Components:**
1. **PresenceService** (`src/frontend/components/filament/services/presenceService.ts`)
   - In-memory presence tracking
   - TTL-based cleanup (8-12s)
   - Heartbeat mechanism
   - Count aggregation

2. **PresenceLayer** (`src/frontend/components/filament/components/PresenceLayer.jsx`)
   - Renders Tier 1 presence (counts only)
   - Tiny green beads on filament spine
   - Count labels at near distance or on hover

3. **Type Definitions** (`src/frontend/components/filament/types/PresenceState.ts`)
   - `PresenceLocus`, `PresenceState`, `ViewerSession`
   - Helper functions: `locusKey()`, `parseLocusKey()`

**Usage Example:**
```typescript
// In FilamentDemoScene.jsx
import { presenceService } from './services/presenceService';
import PresenceLayer from './components/PresenceLayer';

// Simulate viewers
useEffect(() => {
  presenceService.heartbeat({
    filamentId: 'demo-filament',
    commitIndex: 2,
    lensContext: 'workflow'
  }, 'viewer-session-1');
  
  presenceService.heartbeat({
    filamentId: 'demo-filament',
    commitIndex: 2,
    lensContext: 'workflow'
  }, 'viewer-session-2');
}, []);

// Compute loci in view
const lociInView = filament.timeBoxes
  .filter(tb => tb.eventIndex <= cursorIndex)
  .map(tb => ({
    filamentId: filament.id,
    commitIndex: tb.eventIndex,
    lensContext: 'workflow'
  }));

// Compute anchor map (eventIndex → xPosition)
const anchorMap = new Map(
  filament.timeBoxes.map(tb => [tb.eventIndex, tb.xPosition])
);

// Render presence layer
<PresenceLayer 
  lociInView={lociInView}
  anchorMap={anchorMap}
/>
```

---

## Real-World Scenarios

### Scenario 1: Team Collaboration (Group-Visible)

**Context:** Finance team reviewing Q1 budget proposal.

**Setup:**
```typescript
team.presencePolicy = {
  mode: 'group-visible',
  group: 'finance-team'
};
```

**What Team Sees:**
- Alice, Bob, Carol (all Finance) can see each other's presence
- Tier 3: Names + current commit being inspected
- Real-time: "Alice just moved to commit 42"

**What Others See:**
- "3 Finance viewers" (Tier 1 count)

**Benefit:** Team can coordinate ("Alice is reviewing the same section, let's sync")

---

### Scenario 2: Manager Oversight (Manager-Visible)

**Context:** Department head monitoring work locus, not surveillance.

**Setup:**
```typescript
dept.presencePolicy = {
  mode: 'manager-visible',
  managers: ['dept-head-david'],
  boundedTo: ['workspace:finance-dept'],
  disclosureEnabled: true  // Employees know
};
```

**What Manager Sees:**
- "Alice at Budget Review (active 2 hours today)"
- "Bob at Audit Compliance (active 4 hours today)"
- **No navigation path, no per-commit dwell time**

**What Employees See:**
- Notification: "Your presence in Finance workspace is visible to dept-head-david"

**Benefit:** Manager knows team is working, can offer help. Not surveillance.

---

### Scenario 3: Public Governance (Public Mode)

**Context:** City council voting session, public transparency.

**Setup:**
```typescript
channel.presencePolicy = {
  mode: 'public',
  boundedTo: ['channel:city-council-votes']
};
```

**What Everyone Sees:**
- Tier 3: "Council Member Alice inspecting Prop 15"
- Public can see which proposals council members are reviewing
- Transparency by design

**Benefit:** Public accountability, citizens know council is engaged.

---

### Scenario 4: Privacy-Focused User (Invisible)

**Context:** Researcher wants to inspect without being tracked.

**Setup:**
```typescript
user.presencePolicy = {
  mode: 'invisible',
  allowAggregation: false  // Don't even contribute to counts
};
```

**What Others See:** Nothing (not even counted)

**Benefit:** User can research, audit, or inspect without social pressure or surveillance.

---

## Integration with Other Systems

### With User Sphere Model

User spheres can show "where I've been inspecting":

```typescript
// Optionally save presence loci to user sphere
if (user.preferences.saveInspectionHistory) {
  user.sphere.projection.pins.push({
    filamentId: 'budget-2026',
    commitIndex: 42,
    note: 'Key decision point',
    timestamp: Date.now()
  });
}
```

**But:** Presence itself is ephemeral (not saved by default).

---

### With Filament System

Presence anchors to filament geometry:

```typescript
// In workflow view, presence beads attach to filament spine
const presenceBead = {
  position: anchorMap.get(commitIndex),  // X position on filament
  count: presenceState.count
};
```

---

### With Proximity Channels

Combine cognitive + physical presence:

```typescript
// Find users who are:
// 1. Physically nearby (proximity channel)
// 2. Working on related filament (presence)

const nearbyUsers = getProximityUsers('coffee-shop-downtown');
const relatedUsers = nearbyUsers.filter(user => {
  const presence = getPresence({ actorId: user.id });
  return presence?.locus.filamentId === 'budget-2026';
});

// → "Alice and Bob are both here AND both working on budget"
```

---

## Frequently Asked Questions

### General

**Q: Can my manager see everything I'm doing?**  
A: Only if "manager-visible" mode is explicitly enabled, disclosed to you, and bounded to work filaments. Even then, managers see **locus only** (where you are), not **navigation** (how you got there) or **dwell time** (how long you've been there).

**Q: Can I work privately without anyone knowing?**  
A: Yes. Set your presence policy to "invisible." You won't appear in any presence indicators.

**Q: What if I forget to disable presence?**  
A: Presence is **ephemeral** (8-12s TTL). If you stop sending heartbeats, your presence disappears automatically.

**Q: Can someone see my presence history?**  
A: No. Presence is not logged by default. Only **current locus** is visible (if permitted). Movement history is not stored.

### Privacy

**Q: Does Relay track where I go?**  
A: Relay does not log navigation by default. Presence is ephemeral (disappears after 8-12s of inactivity). If coarse presence snapshots are enabled (org policy), you're notified explicitly.

**Q: Can I see who's watching me?**  
A: Only if their presence policy allows it. If they're in "invisible" mode, you won't see them.

**Q: Can presence be used to identify me?**  
A: Only if you're in Tier 3 (identified markers) mode AND the viewer has permission. At Tier 1/2, you're aggregated ("N viewers" or "2 Finance").

### Technical

**Q: Where is presence data stored?**  
A: In-memory (e.g., Redis or in-process Map). Not committed to Git. Ephemeral, short TTL.

**Q: What happens if presence service crashes?**  
A: Presence data is lost (it's ephemeral). Users re-send heartbeats and presence rebuilds naturally.

**Q: Can I disable presence entirely?**  
A: Yes. Set `mode: 'invisible'` and `allowAggregation: false`. You won't appear anywhere.

**Q: How does presence work across multiple Relay instances?**  
A: Presence can be federated via regional relay nodes (optional). Each instance tracks local presence; cross-instance presence is aggregated at query time.

### Governance

**Q: Who controls presence policies?**  
A: Depends on locus:
- **Filament owner** (for their filaments)
- **Org admin** (for org workspaces)
- **Team lead** (for team spaces)
- **User** (for personal sphere)

**Q: Can presence policies be voted on?**  
A: Yes, if the org/team uses Relay's governance system. Presence policy changes can be proposals, just like any other governance decision.

**Q: What if I disagree with my org's presence policy?**  
A: You can set your personal policy to "invisible" to opt out. However, if the org requires visible presence as an employment condition, that's a social/contractual issue, not a technical one. Relay enforces **your policy**, not the org's demand.

---

## Conclusion

The **Presence + Permission Model** ensures that:
- ✅ **Coordination without surveillance** (ephemeral, locus-only)
- ✅ **Accountability without creepiness** (policy-driven, auditable)
- ✅ **Transparency without doxxing** (tiered visibility, progressive disclosure)
- ✅ **Work-locus awareness** (manager-visible when appropriate)
- ✅ **Privacy by default** (invisible mode always available)

By treating presence as a **lens** (like user spheres), Relay enables rich, multi-party inspectability without compromising individual privacy or enabling surveillance.

---

**See Also:**
- [User Sphere Model](USER-SPHERE-MODEL.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Canonical Filament Model](../../src/frontend/components/filament/CANONICAL-MODEL.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
