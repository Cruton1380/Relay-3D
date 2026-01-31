# 🌐 User as World Fractal — The Relay User Sphere Model

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## **One-Sentence Lock**

> **A user is a portable lens that re-projects the global tree into a personal sphere of references, and proximity only controls discovery—never truth.**

---

---

## Executive Summary

In Relay, **a person is a world**. Each user's profile is not a static identity card or social media page—it is a **living, inspectable projection** of all the filaments they've touched, arranged in a personal sphere that reflects their unique interactions with the global truth substrate.

**Key Principle:**
> A user sphere is not storage. It is a **lens** that re-projects the globe's filaments into a personal, auditable "world-fractal" shaped by what the user has touched.

**Core Innovations:**
- **Sphere as Lens**: User profiles project existing filaments, don't duplicate them
- **Auditable Inclusion**: Filaments appear only when user has provable interaction
- **Truth vs Arrangement**: Branching can fork underlying filaments OR just reorganize view
- **Fly-to Navigation**: Camera movement + permission reveals public projections
- **Two Realities**: Cognitive presence (what they act on) vs Physical presence (proximity)

**Why It Matters:**
This model ensures that user identity is **reconstructible, portable, and privacy-preserving** while maintaining **single-source truth** and preventing **social graph manipulation**.

---

## Table of Contents

1. [The One-Sentence Model](#the-one-sentence-model)
2. [Core Concepts](#core-concepts)
3. [User Sphere Architecture](#user-sphere-architecture)
4. [Filament Inclusion Rules](#filament-inclusion-rules)
5. [Branching Model](#branching-model)
6. [Navigation and Permissions](#navigation-and-permissions)
7. [Two-Reality View](#two-reality-view)
8. [Privacy and Safety Rails](#privacy-and-safety-rails)
9. [Technical Implementation](#technical-implementation)
10. [Real-World Scenarios](#real-world-scenarios)
11. [Integration with Other Systems](#integration-with-other-systems)
12. [Frequently Asked Questions](#frequently-asked-questions)

---

## The One-Sentence Model

> **A user is a fractal projection of the entire globe, showing only the filaments they've interacted with, arranged by their personal lens—provable, portable, and permission-gated.**

Everything below obeys this sentence.

---

## Core Concepts

### What Is a User Sphere?

**NOT**:
- ❌ A separate database of user-specific content
- ❌ A social media profile with posts and photos
- ❌ A container that stores duplicates of filaments
- ❌ A node in a social graph

**IS**:
- ✅ A **projection lens** over existing global filaments
- ✅ A **filter** showing "filaments this user touched"
- ✅ An **arrangement view** of how the user organizes their world
- ✅ A **navigation portal** others can inspect (with permission)

### The Fractal Property

Just as a hologram contains the whole image in every fragment, **a user sphere contains the essence of the entire Relay world**, but filtered and arranged through that person's interactions.

**Analogy:**
> Think of the globe as a vast library. Your user sphere is not a separate collection of photocopied books—it's a **card catalog** that points to exactly which books you've read, annotated, or authored, with your personal organization system visible.

---

## User Sphere Architecture

### Three Layers

```
┌─────────────────────────────────────────────────┐
│         USER SPHERE (Projection)                │
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │   Personal Arrangement Lens           │    │
│  │   (Groupings, Pins, Bookmarks)        │    │
│  └───────────────────────────────────────┘    │
│                    ↓                            │
│  ┌───────────────────────────────────────┐    │
│  │   Filament References                 │    │
│  │   (Pointers to Global Filaments)      │    │
│  └───────────────────────────────────────┘    │
│                    ↓                            │
│  ┌───────────────────────────────────────┐    │
│  │   Interaction Evidence                │    │
│  │   (Commits, Presence, Votes, etc.)    │    │
│  └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                     ↓
        ┌────────────────────────┐
        │   GLOBAL SUBSTRATE     │
        │   (Actual Filaments)   │
        └────────────────────────┘
```

### Data Model

**Minimal User Sphere Structure:**
```typescript
interface UserSphere {
  userId: string;                    // Cryptographic identity
  policies: VisibilityPolicies;      // What others can see
  proximityAttestations?: string[];  // Verified physical presence
  
  // Projection configuration (this is what makes it a "lens")
  projection: {
    filamentRefs: FilamentReference[];  // Pointers to global filaments
    groupings: GroupConfig[];           // Personal organization
    pins: PinnedLocus[];                // Bookmarked commits
    tags: TagMapping[];                 // Personal taxonomy
    branches: BranchConfig[];           // Arrangement forks
  };
  
  // Versionable (can be a filament if governance needed)
  projectionVersion?: number;
}

interface FilamentReference {
  filamentId: string;
  inclusionReason: InclusionType;  // Why this filament appears
  firstInteraction: CommitId;       // When user first touched it
  visibility: 'public' | 'group' | 'private';
}

type InclusionType = 
  | 'authored'           // User created commits
  | 'voted'              // User voted on branch/proposal
  | 'edited'             // User edited endpoint state
  | 'inspected'          // User had presence at commit
  | 'moderated'          // User took moderation action
  | 'funded'             // User funded proposal
  | 'jury'               // User was jury member
  | 'lens-referenced';   // User created lens that includes it
```

**Critical Rule:**
> If a filament appears in a user sphere, there MUST be evidence in the global substrate linking that user to that filament. No fabricated associations.

---

## Filament Inclusion Rules

### Inclusion Criteria (Hard)

A filament appears in a user's sphere **if and only if** at least one of these is true:

#### 1. **Authored Commit**
User created one or more commits on the filament.

**Evidence**: Commit envelope with `actorId === userId`

**Example:**
```javascript
// User authored this commit → Filament appears in their sphere
const commit = {
  envelope: {
    actor: 'user:alice',
    commit_class: 'CELL_EDIT',
    // ...
  }
};
```

#### 2. **Voted on Commit/Branch**
User cast a vote (adoption vote on a branch or commit).

**Evidence**: Vote commit with user's signature

**Example:** Alice votes to adopt a community proposal → that proposal's filament appears in her sphere

#### 3. **Inspected (Presence)**
User had presence at a commit locus (if "save visited loci" is enabled).

**Evidence**: Presence heartbeat logged for `(filamentId, commitIndex, lensContext)`

**Example:** Bob inspects a specific commit during audit → optionally saved to sphere

#### 4. **Moderated / Flagged**
User took a moderation action (flag, jury duty, etc.).

**Evidence**: Moderation commit/event

#### 5. **Funded Proposal**
User contributed funds tied to a filament/proposal.

**Evidence**: Funding transaction linked to filamentId

#### 6. **Lens Configuration**
User created a lens arrangement that references the filament.

**Evidence**: Lens config commit

**Example:** User creates a "Q1 Budget" lens that groups 5 financial filaments → all 5 appear

---

### Inclusion Proof Requirement

**Every filament reference must be auditable:**
```typescript
function verifyFilamentInclusion(
  userId: string,
  filamentId: string,
  sphere: UserSphere
): boolean {
  const ref = sphere.projection.filamentRefs.find(r => r.filamentId === filamentId);
  if (!ref) return false;
  
  // Must have evidence in global substrate
  const evidence = queryGlobalSubstrate({
    filamentId,
    actorId: userId,
    inclusionType: ref.inclusionReason
  });
  
  return evidence.length > 0;  // ✅ Provable
}
```

**Anti-Pattern (Forbidden):**
```typescript
// ❌ WRONG: User manually adds filament to sphere without interaction
sphere.projection.filamentRefs.push({
  filamentId: 'some-filament',
  inclusionReason: 'just-interested',  // ❌ Not auditable!
  // ...
});
```

---

## Branching Model

### Truth Branches vs Lens Branches

When a user "branches" in their sphere, it means one of two things:

#### **A) Truth Fork (Underlying Filament)**
User forks the **actual filament** at a commitIndex.

**What Happens:**
- A new branch is created in the global substrate
- The fork is a competing version (proposal)
- The filament now has multiple timelines
- This is **governance**, not just arrangement

**Permission:** Gated by filament policy (can anyone fork? or requires approval?)

**Example:**
```javascript
// Alice disagrees with commit 42, creates competing timeline
forkFilament({
  filamentId: 'budget-2026',
  forkFromCommit: 42,
  newBranchName: 'alice-alternative',
  actorId: 'user:alice'
});

// Now "budget-2026" has two branches:
// - main (original)
// - alice-alternative (Alice's proposal)
```

#### **B) Arrangement Fork (Lens Configuration)**
User forks their **profile lens configuration** (layout, grouping, pinning, bookmarks).

**What Happens:**
- No underlying filament is affected
- User creates a "saved view" or "workspace configuration"
- This is **personal organization**, not truth

**Permission:** Always allowed (it's their sphere)

**Example:**
```javascript
// Alice creates two arrangement views:
// 1. "Work View" - shows org filaments in priority order
// 2. "Home View" - shows neighborhood/personal filaments

user.sphere.projection.branches = [
  {
    branchName: 'work-view',
    groupings: [/* work-related groupings */],
    pins: [/* work bookmarks */]
  },
  {
    branchName: 'home-view',
    groupings: [/* personal groupings */],
    pins: [/* personal bookmarks */]
  }
];
```

### When to Use Which

| Scenario | Type | Visibility |
|----------|------|------------|
| Propose alternative budget | Truth Fork | Public (if policy allows) |
| Contest a vote outcome | Truth Fork | Public (governance) |
| Save two workspace layouts | Lens Fork | Private (personal) |
| Organize projects differently | Lens Fork | Private or shareable |

**Critical Distinction:**
> Truth forks are **commits** (immutable, governed, auditable). Lens forks are **configuration** (mutable, personal, shareable).

---

## Navigation and Permissions

### "Fly-to" User Sphere

**How It Works:**

1. **User Profile is Discoverable:**
   - Public profiles: Visible in search/directory
   - Private profiles: Only visible to permitted viewers

2. **"Fly-to" Action:**
   - Click on user's profile/avatar
   - Camera navigates to their sphere projection
   - What you see depends on **their public projection policy**

3. **What You See:**
   - **Public Filaments**: Filaments they've marked as public
   - **Public Groupings**: How they organize their public work
   - **Clickable Filaments**: Each filament is a portal to its full history

**Example Flow:**
```
You → Click "Alice's Profile"
  ↓
Camera flies to Alice's Sphere (3D space)
  ↓
See: 12 filaments Alice has worked on (marked public)
  ↓
Click on "Budget 2026" filament
  ↓
Snap to that filament's workflow view (full history)
  ↓
You can inspect commits Alice made (if public)
```

### Permission Layers

```typescript
interface VisibilityPolicies {
  sphereVisibility: 'public' | 'contacts' | 'private';
  
  filamentVisibility: {
    default: 'public' | 'group' | 'private';
    overrides: Map<FilamentId, VisibilityMode>;
  };
  
  arrangementVisibility: 'public' | 'private';  // Can others see your groupings?
  
  presenceVisibility: 'public' | 'group' | 'private';  // Can others see you're here?
}
```

**Examples:**

**Public Profile (Community Leader):**
```typescript
alice.policies = {
  sphereVisibility: 'public',            // Anyone can fly-to
  filamentVisibility: {
    default: 'public',                   // Show most work
    overrides: {
      'personal-journal': 'private'      // Except this
    }
  },
  arrangementVisibility: 'public',       // Show how I organize
  presenceVisibility: 'group'            // Show presence to team
};
```

**Private Profile (Privacy-Focused User):**
```typescript
bob.policies = {
  sphereVisibility: 'contacts',          // Only friends can fly-to
  filamentVisibility: {
    default: 'private',                  // Hide most work
    overrides: {
      'open-source-project': 'public'    // Except this
    }
  },
  arrangementVisibility: 'private',      // Don't show organization
  presenceVisibility: 'private'          // Hide presence
};
```

### Safety Rails

**No Bypass:**
- "Fly-to" never bypasses permission
- If a filament is private, it's **not rendered** in public projection
- You can't "discover" private work by inspecting someone's sphere

**No Social Graph Mining:**
- No "see who Alice works with" feature
- Shared filaments only visible if both users made them public
- Relationships emerge from public co-presence, not exposure

---

## Two-Reality View

### Cognitive Reality (What They Act On)

**This is the User Sphere projection.**

Shows:
- What filaments the user has interacted with
- What they've authored, voted on, inspected
- Their arrangement and organization

**Answers:** "What does this person care about? What are they working on?"

### Physical Reality (Proximity)

**This is shown via Proximity Channels.**

Shows:
- Where the user is physically present (if broadcasting)
- What proximity channels they're eligible for
- What local filaments they can interact with

**Answers:** "Where is this person right now? Can we coordinate in person?"

### How They Interact

```
┌─────────────────────────────────────────────┐
│        GLOBE VIEW (Global Substrate)        │
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │ Alice Sphere │      │   Bob Sphere │   │
│  │  (Cognitive) │      │  (Cognitive) │   │
│  │              │      │              │   │
│  │ • Budget     │      │ • Transport  │   │
│  │ • Education  │      │ • Parks      │   │
│  └──────────────┘      └──────────────┘   │
│         ↓                      ↓            │
│  ┌─────────────────────────────────────┐  │
│  │   Proximity Layer (Physical)        │  │
│  │                                     │  │
│  │   📍 Alice & Bob: Coffee Shop       │  │
│  │      (Both broadcasting proximity)  │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Example:**
- **Cognitive**: Alice is working on "Budget 2026" filament (visible in her sphere)
- **Physical**: Alice is at Downtown Coffee Shop (visible in proximity layer)
- **Coordination**: Bob sees Alice is nearby AND working on budget → can propose in-person meeting

---

## Privacy and Safety Rails

### Core Protections

#### 1. **No Social Graph**
Relay does **not** create a "friend graph" or "follower network."

**Why:** Social graphs are surveillance infrastructure.

**Instead:** Relationships emerge from:
- Shared filaments (both users made public)
- Co-presence at proximity channels
- Explicit mutual visibility settings

#### 2. **No Private Artifact Bypass**
If a filament is marked private, it is **invisible** in all projections.

**You CANNOT:**
- See it by flying to someone's sphere
- Discover it through presence indicators
- Infer it from arrangement patterns

#### 3. **No Duplicate Truth**
User spheres never store filament data—only references.

**Why:** Prevents fragmentation, ensures single-source truth.

**Benefit:** If a filament is updated, the update is reflected in all spheres that reference it.

#### 4. **Auditable Inclusion**
Every filament in a sphere has provable evidence in the global substrate.

**Why:** Prevents fake associations, maintains integrity.

**Enforcement:** Inclusion proof required for rendering.

#### 5. **Policy-Driven Visibility**
What others see is **determined by the sphere owner**, not the viewer.

**Why:** User controls their own projection.

**Mechanism:** Visibility policies enforced at rendering time.

---

## Technical Implementation

### Sphere Rendering Engine

```typescript
class UserSphereRenderer {
  constructor(userId: string, viewerContext: ViewerContext) {
    this.userId = userId;
    this.viewer = viewerContext;
  }
  
  async renderSphere(): Promise<SphereProjection> {
    // 1. Load user's projection config
    const sphere = await fetchUserSphere(this.userId);
    
    // 2. Filter by viewer permissions
    const visibleFilaments = this.filterByPermissions(
      sphere.projection.filamentRefs,
      this.viewer
    );
    
    // 3. Fetch referenced filaments from global substrate
    const filaments = await fetchFilaments(
      visibleFilaments.map(ref => ref.filamentId)
    );
    
    // 4. Render in user's arrangement
    return {
      filaments,
      groupings: sphere.projection.groupings,
      layout: sphere.projection.layout
    };
  }
  
  filterByPermissions(
    refs: FilamentReference[],
    viewer: ViewerContext
  ): FilamentReference[] {
    return refs.filter(ref => {
      // Enforce visibility policy
      if (ref.visibility === 'public') return true;
      if (ref.visibility === 'private') return viewer.userId === this.userId;
      if (ref.visibility === 'group') return this.isInGroup(viewer, ref);
      return false;
    });
  }
}
```

### Storage Model

**User Sphere (Lightweight):**
```json
{
  "userId": "user:alice",
  "projectionVersion": 3,
  "projection": {
    "filamentRefs": [
      {
        "filamentId": "budget-2026",
        "inclusionReason": "authored",
        "firstInteraction": "commit:abc123",
        "visibility": "public"
      },
      {
        "filamentId": "education-proposal",
        "inclusionReason": "voted",
        "firstInteraction": "commit:def456",
        "visibility": "public"
      }
    ],
    "groupings": [
      {
        "name": "Work Projects",
        "filamentIds": ["budget-2026"]
      }
    ],
    "pins": [
      {
        "filamentId": "budget-2026",
        "commitIndex": 42,
        "note": "Key decision point"
      }
    ]
  },
  "policies": {
    "sphereVisibility": "public",
    "filamentVisibility": { "default": "public" },
    "arrangementVisibility": "public"
  }
}
```

**Actual Filaments (In Global Substrate):**
```
// These are NOT duplicated in user spheres!
repos/budget-2026/.git/...
repos/education-proposal/.git/...
```

---

## Real-World Scenarios

### Scenario 1: New Team Member Onboarding

**Context:** Carol joins a team and needs to understand what everyone is working on.

**Process:**
1. Carol flies to each team member's public sphere
2. She sees filaments they've made public (work projects)
3. She clicks on a filament to see its full history
4. She discovers who authored what commits, understands context
5. She adds relevant filaments to her own sphere (by interacting)

**Benefit:** Onboarding is **self-service** and **comprehensive** without requiring documentation or meetings.

---

### Scenario 2: Audit Trail for Compliance

**Context:** External auditor needs to verify who made specific budget decisions.

**Process:**
1. Auditor inspects "Budget 2026" filament (workflow view)
2. Each commit shows `actorId` (who made the change)
3. Auditor flies to that user's sphere (if public or if granted access)
4. Verifies that user's sphere shows the filament (provable interaction)
5. Checks presence records (was user physically present at required meeting?)

**Benefit:** Audit trail is **reconstructible** and **verifiable** without centralized logging.

---

### Scenario 3: Privacy-Focused User

**Context:** David contributes to open-source but wants personal projects private.

**Setup:**
```typescript
david.policies = {
  sphereVisibility: 'public',           // Findable
  filamentVisibility: {
    default: 'private',                 // Hide most
    overrides: {
      'open-source-relay': 'public'     // Show contributions
    }
  },
  arrangementVisibility: 'private'      // Don't show organization
};
```

**Result:**
- Public: Can see David's open-source work
- Private: Cannot see personal journal, side projects
- David maintains privacy while contributing publicly

---

## Integration with Other Systems

### With Presence Model
User spheres integrate with presence to show "where users are inspecting":

```typescript
// Presence can appear in user spheres
const aliceSphere = renderSphere('user:alice');

// Show: "Alice is currently inspecting Budget 2026, commit 42"
const alicePresence = getPresence({
  userId: 'user:alice',
  lensContext: 'sphere:alice'
});
```

### With Filament System
User spheres are **lenses** over filaments:

```typescript
// Clicking a filament in a sphere → snaps to workflow view
onFilamentClick(filamentId) {
  camera.flyTo({
    mode: 'workflow',
    filamentId,
    commitIndex: 'latest'
  });
}
```

### With Proximity Channels
Physical presence + user spheres enable coordination:

```typescript
// Find users nearby who are working on related filaments
const nearbyUsers = queryProximityChannel('coffee-shop-downtown');
const relatedUsers = nearbyUsers.filter(user => {
  const sphere = getUserSphere(user.userId);
  return sphere.projection.filamentRefs.some(ref =>
    ref.filamentId === 'budget-2026'
  );
});

// → "Alice and Bob are both here and both working on Budget 2026"
```

---

## Frequently Asked Questions

### General

**Q: Is my user sphere stored on my device or on servers?**  
A: User sphere **configuration** (the lens) can be stored locally, on Relay infrastructure, or replicated. The **actual filaments** live in the global substrate (Git repos). Your sphere is just a lightweight projection config.

**Q: Can I have multiple "views" or "personas"?**  
A: Yes, via **arrangement branches**. You can create "Work View" and "Home View" that show different groupings/arrangements, but they all reference the same global filaments.

**Q: What happens if I delete my account?**  
A: Your **sphere projection** is deleted. Your **commits to global filaments** remain (they're part of public truth). Your identity can be cryptographically proven to be yours if you need to reclaim it.

### Privacy

**Q: Can someone see what filaments I'm working on without permission?**  
A: Only if you've marked them as public. Private filaments are **invisible** in your public projection.

**Q: Can others see my presence on their filaments?**  
A: Only if your presence visibility policy allows it AND the filament policy allows it. Both must permit.

**Q: Can I work on filaments without them appearing in my sphere?**  
A: No. If you interact, there's evidence. But you can mark them **private** so they don't appear in your public projection.

### Technical

**Q: How do you prevent sphere bloat (too many filaments)?**  
A: Filament references are lightweight pointers (~100 bytes each). Even 10,000 filaments = ~1MB. Actual filament data lives in global substrate, not duplicated per user.

**Q: Can I export my sphere?**  
A: Yes. Your sphere config is portable (JSON). You can back it up, migrate it, or replicate it across Relay instances.

**Q: What if two users' spheres show conflicting versions of a filament?**  
A: They're seeing different **branches** of the same filament. The filament has diverged (SPLIT glyph). This is governance in action—both versions are valid proposals until one is adopted.

### Governance

**Q: Can I fork someone else's sphere?**  
A: You can fork their **arrangement** (lens config) if they've made it public. You **cannot** fork their interaction history (that's their unique identity).

**Q: Who controls visibility policies?**  
A: The sphere owner. **You control what others see in your projection.** This is not voted on—it's personal sovereignty.

**Q: Can organizations force employees to make their spheres public?**  
A: Organizations can require public spheres as an employment policy, but **Relay enforces the user's policy**, not the org's. If the user sets private, it stays private. Enforcement is social/contractual, not technical.

---

## Conclusion

The **User as World Fractal** model ensures that:
- ✅ **Identity is reconstructible** (from interactions, not centralized profiles)
- ✅ **Privacy is enforceable** (projection policy at the user layer)
- ✅ **Truth is singular** (no duplicate filaments, just references)
- ✅ **Relationships emerge** (from shared work, not social graphs)
- ✅ **Portability is native** (sphere config is lightweight and exportable)

By treating users as **lenses** rather than **containers**, Relay enables rich, inspectable identity without sacrificing truth integrity or user sovereignty.

---

**See Also:**
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Presence + Permission Model](PRESENCE-PERMISSION-MODEL.md)
- [Canonical Filament Model](../../src/frontend/components/filament/CANONICAL-MODEL.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
