# architecture@c17 — Work Zones & Co-Located SCV Coordination

**Status**: LOCKED  
**Commit**: c17  
**Date**: 2026-01-31  
**Supersedes**: None (new communication layer)  
**Depends On**: c14 (Surface Coordination Geometry), c16 (Commit Materiality)

---

## Purpose

This document defines **Relay Work Zones** — the correct model for "chatrooms" where multiple SCVs and humans coordinate in real time by co-authoring a shared filament context.

**This is NOT:**
- Social messaging
- Thread-based chat
- Message streams

**This IS:**
- Shared coordination surface
- Co-located filament editing
- Real-time commit negotiation
- Visible authority and gates

---

## 1. Core Principle

### **Canonical Statement**

> **"A Relay chatroom is a co-located work zone: a shared surface where humans and SCVs coordinate in real time to append commits to a common filament context under visible authority and gates."**

This is now **LOCKED.**

### **What "Co-Location" Means**

Co-located SCVs and humans **share**:
- The same **scope** (ring, branch, project)
- The same **active selection set** (what's being worked on)
- The same **branch/ring context** (spatial position)
- The same **live truth stream** (events)
- The same **commit staging area** (proposals)

**They do NOT "send messages" to each other.**

**They**:
- See the same world
- Update the same working context
- Negotiate the same commits
- Resolve the same pressure

**This is why it's cheap and natural: it's like being in the same room.**

---

## 2. What a Work Zone Actually Is

### **Internal Name**

```
zone.<id>
workzone.<id>
```

**Examples**:
```
zone.acme.engineering.payments
zone.acme.finance.budget-2026
zone.acme.design.mobile-ui
```

### **Canonical Identity**

A work zone is a **filament-bound locus**.

**Properties**:
```javascript
workZone = {
  id: "zone.acme.engineering.payments",
  type: "work_zone",
  
  // Spatial context
  ringId: "acme.engineering",
  branchId: "main",
  projectId: "payments",
  
  // Filament binding
  contextFilament: "filament.zone.acme.engineering.payments.context",
  
  // Participants
  participants: [
    { type: "human", userId: "alice", authority: "engineer" },
    { type: "scv", scvId: "scv-123", capability: "code-review" },
    { type: "scv", scvId: "scv-456", capability: "testing" }
  ],
  
  // State
  active: true,
  createdAt: "2026-01-31T12:00:00Z",
  lastActivity: "2026-01-31T14:30:00Z"
}
```

### **Physical Location**

A work zone **IS**:
- A shared coordination location
- A surface for filament editing
- A negotiation space for commits
- A visible authority boundary

A work zone **IS NOT**:
- A social channel
- A message inbox
- A notification stream
- A private conversation

---

## 3. The Three Concurrent Layers

Every work zone operates on three distinct layers:

### **Layer A: Live Dialogue (Ephemeral)**

**Purpose**: Real-time coordination between participants

**Properties**:
```javascript
liveDialogue = {
  persistence: "ephemeral",
  canonical: false,
  visible: "all_zone_participants",
  
  contentTypes: [
    "speech",              // Spoken word (transcribed)
    "text",                // Typed messages
    "gesture",             // UI actions (cursor, selection)
    "reaction"             // Quick responses
  ],
  
  purpose: "coordination",
  retention: "session_only",  // Discarded when zone closes
  
  examples: [
    "Alice: Should we merge this now?",
    "Bob: Wait, let me check the tests first",
    "SCV-123: Tests pass. Ready to merge.",
    "Alice: OK, merging."
  ]
}
```

**Retention**:
- Live only (not stored)
- Optional: Session log (for replay)
- Not canonical (never becomes truth)

### **Layer B: Shared Context State (Semi-Persistent)**

**Purpose**: Current working state of the zone

**Properties**:
```javascript
sharedContext = {
  persistence: "semi_persistent",
  canonical: false,  // Not truth, but snapshotable
  visible: "all_zone_participants",
  
  contains: [
    "current_task_contract",    // What we're doing
    "active_invariants",        // What must remain true
    "active_profile_gates",     // What's allowed/blocked
    "selection_filament",       // What's selected/focused
    "proposal_staging",         // Pending commits
    "pressure_state"            // Current ERI, confidence
  ],
  
  retention: "until_zone_closes_or_commits",
  snapshotable: true,  // Can be saved as checkpoint
  
  example: {
    taskContract: "Implement payment retry logic",
    invariants: ["tests_must_pass", "no_breaking_changes"],
    gates: ["no_new_primitives", "no_semantic_zoom"],
    selection: ["src/payments/retry.mjs", "tests/retry.test.mjs"],
    staging: [
      { type: "propose", file: "retry.mjs", status: "pending" }
    ],
    pressure: { eri: 85, confidence: 0.87 }
  }
}
```

**Persistence**:
- Maintained during zone session
- Can be snapshotted (checkpoint)
- Discarded if no commit made
- NOT canonical history

### **Layer C: Commits (Canonical)**

**Purpose**: Permanent truth-changing events

**Properties**:
```javascript
commits = {
  persistence: "permanent",
  canonical: true,  // This IS truth
  visible: "ring_scoped",  // May be visible outside zone
  
  rule: "only_commits_are_truth",
  
  types: [
    "propose",      // Propose new commit
    "stage",        // Stage commit for review
    "commit",       // Canonical commit (permanent)
    "revert",       // Counter-commit
    "merge",        // Reconciliation event
    "scar"          // Conflict resolution
  ],
  
  requirement: "no_commit_means_nothing_happened",
  
  example: {
    type: "commit",
    commitHash: "abc123def456",
    message: "feat: Add payment retry logic with exponential backoff",
    author: "alice",
    coAuthors: ["scv-123"],
    files: ["src/payments/retry.mjs", "tests/retry.test.mjs"],
    verification: {
      threeWayMatch: { valid: true, confidence: 0.87 },
      eri: 85,
      state: "COMMIT"
    },
    timestamp: "2026-01-31T14:35:00Z"
  }
}
```

**Critical Rule**:
> **No commit = nothing happened.**

All other layers are ephemeral coordination.  
Only commits are canonical history.

---

## 4. The Shared Filament Model

### **Primary Filament**

Every work zone has a **primary context filament**:

```
filament.zone.<zoneId>.context
```

**Examples**:
```
filament.zone.acme.engineering.payments.context
filament.zone.acme.finance.budget-2026.context
```

### **Filament Contents**

```javascript
contextFilament = {
  id: "filament.zone.acme.engineering.payments.context",
  type: "zone_context",
  
  // Scope locks
  scopeLocks: {
    ringId: "acme.engineering",
    branchId: "main",
    authorityRequired: ["engineer", "tech-lead"]
  },
  
  // Decisions (append-only)
  decisions: [
    {
      id: "decision-001",
      type: "architecture",
      description: "Use exponential backoff for retries",
      rationale: "Better than linear for transient failures",
      author: "alice",
      timestamp: "2026-01-31T13:00:00Z",
      commitRef: "abc123"
    }
  ],
  
  // Accepted patches (append-only)
  patches: [
    {
      id: "patch-001",
      file: "src/payments/retry.mjs",
      diff: "...",
      author: "alice",
      coAuthors: ["scv-123"],
      commitRef: "abc123"
    }
  ],
  
  // Active constraints
  constraints: {
    invariants: ["tests_must_pass", "no_breaking_changes"],
    gates: ["no_new_primitives", "no_semantic_zoom"],
    pressureFloor: { eri: 70, confidence: 0.70 }
  },
  
  // Evidence references
  evidence: [
    {
      type: "context_snapshot",
      id: "snapshot-a1b2c3",
      description: "Before implementing retry logic",
      timestamp: "2026-01-31T12:30:00Z"
    }
  ]
}
```

### **How SCVs "Work Together"**

SCVs co-author the context filament by **appending commits**:

```javascript
// SCV proposes commit
await zone.proposeCommit({
  type: "propose",
  file: "src/payments/retry.mjs",
  changes: { ... },
  author: "scv-123",
  rationale: "Implemented exponential backoff as discussed"
});

// Human reviews and accepts
await zone.stageCommit("commit-xyz");

// Commit becomes canonical
await zone.commitToFilament({
  commitId: "commit-xyz",
  author: "alice",
  coAuthors: ["scv-123"]
});

// Filament now contains permanent record
```

**The chatroom is the surface where this filament is edited.**

---

## 5. Authority and Safety (Non-Negotiable)

### **Collaboration vs Canon**

**Collaboration is FREE**:
- SCVs can propose anything
- Humans can discuss anything
- Ideas flow without restriction

**Canon is STRICT**:
- Only authorized actions become canonical
- Command card shows only legitimate actions
- Gates block invalid outputs
- Authority checks enforced at commit

### **Authority Model**

```javascript
authorityCheck = {
  // Who can join zone
  canJoin: (participant) => {
    return participant.ringMembership.includes(zone.ringId);
  },
  
  // Who can propose commits
  canPropose: (participant) => {
    return true;  // Anyone in zone can propose
  },
  
  // Who can make commits canonical
  canCommit: (participant) => {
    return zone.authorizedRoles.includes(participant.role);
  },
  
  // What operations are allowed
  allowedOperations: (participant) => {
    const commandCard = getCommandCard(participant, zone);
    return commandCard.allowedCommands;
  }
}
```

### **Gate Enforcement**

```javascript
gateCheck = {
  beforeCommit: (commit) => {
    // Check active gates
    for (const gate of zone.context.constraints.gates) {
      if (gate === "no_new_primitives" && commit.createsNewPrimitive) {
        return {
          allowed: false,
          reason: "Gate violation: new primitive creation blocked"
        };
      }
      
      if (gate === "no_semantic_zoom" && commit.changesAbstraction) {
        return {
          allowed: false,
          reason: "Gate violation: semantic zoom blocked"
        };
      }
    }
    
    return { allowed: true };
  }
}
```

**Safety Guarantee**:
> **Even in shared zones, only legitimate operations can become canonical.**

---

## 6. SCV V1 Capabilities & Constraints

### **SCV V1 Capabilities (What They Can Do)**

When you deploy SCVs to the cohort, they have these capabilities:

```javascript
scvV1Capabilities = {
  // Zone operations
  zoneOps: {
    join: "zone.<id>",                  // Enter a work zone
    readContext: "filament.zone.<id>",  // Read shared context
    proposeCommit: true,                 // Propose commits
    holdStopFork: true,                  // Pause/stop/branch work
    emitTraces: true                     // Show reasoning/sources
  },
  
  // Dialogue operations
  dialogue: {
    speak: true,                         // Participate in live dialogue
    listen: true,                        // See others' dialogue
    react: true,                         // Quick responses
    gesture: false                       // No UI control (V1 limit)
  },
  
  // Commit operations
  commits: {
    propose: true,                       // Propose new commits
    stage: false,                        // Cannot stage (human only)
    commit: false,                       // Cannot commit (human only)
    revert: false                        // Cannot revert (human only)
  },
  
  // Context operations
  context: {
    readSelection: true,                 // See what's selected
    proposeSelection: true,              // Suggest focus
    readInvariants: true,                // See constraints
    proposeInvariants: false             // Cannot change constraints (V1)
  },
  
  // Output operations
  output: {
    headerSummary: "default",            // Summarize at header level
    fullDetail: "on_request",            // Detail only if asked
    traces: "always",                    // Always show sources
    confidence: "always"                 // Always show confidence
  }
}
```

### **SCV V1 Constraints (What They Cannot Do)**

```javascript
scvV1Constraints = {
  // Filament constraints
  filaments: {
    cannotCreate: "without_explicit_authorization",
    cannotDelete: true,
    cannotRewrite: true,  // Append-only
    cannotPush: "without_human_approval"
  },
  
  // Authority constraints
  authority: {
    mustRespectGates: true,
    mustRespectRingScope: true,
    cannotOverrideHuman: true,
    cannotGrantAuthority: true
  },
  
  // Commit constraints
  commits: {
    cannotForcePush: true,
    cannotRewriteHistory: true,
    cannotBypassVerification: true,
    cannotCommitWithoutProposal: true
  },
  
  // Context constraints
  context: {
    mustTreatAsSharedTruth: true,
    cannotModifyWithoutProposal: true,
    cannotIgnoreInvariants: true
  },
  
  // Behavioral constraints
  behavior: {
    noNewPrimitives: true,      // Cannot invent new concepts
    noSemanticZoom: true,        // Cannot change abstraction
    noSilentChanges: true,       // All changes must be visible
    noBackdoors: true            // No hidden capabilities
  }
}
```

---

## 7. Zone Schema (Complete Specification)

### **Zone Metadata**

```javascript
// Stored in: .relay/zones/<zoneId>/meta.json
{
  "id": "zone.acme.engineering.payments",
  "type": "work_zone",
  "version": "1.0.0",
  
  // Spatial binding
  "spatial": {
    "ringId": "acme.engineering",
    "branchId": "main",
    "projectId": "payments",
    "location": {
      "geographic": null,  // Optional
      "structural": "/src/payments/"
    }
  },
  
  // Filament binding
  "filaments": {
    "primary": "filament.zone.acme.engineering.payments.context",
    "related": [
      "filament.payments.implementation",
      "filament.payments.tests"
    ]
  },
  
  // Participants
  "participants": {
    "humans": [
      {
        "userId": "alice",
        "role": "engineer",
        "authority": ["propose", "commit"],
        "joinedAt": "2026-01-31T12:00:00Z"
      }
    ],
    "scvs": [
      {
        "scvId": "scv-123",
        "capability": "code-review",
        "version": "v1",
        "authority": ["propose"],
        "joinedAt": "2026-01-31T12:05:00Z"
      }
    ]
  },
  
  // State
  "state": {
    "status": "active",  // active, paused, archived
    "createdAt": "2026-01-31T12:00:00Z",
    "lastActivity": "2026-01-31T14:30:00Z",
    "commitCount": 5,
    "proposalCount": 2
  },
  
  // Constraints
  "constraints": {
    "invariants": ["tests_must_pass", "no_breaking_changes"],
    "gates": ["no_new_primitives", "no_semantic_zoom"],
    "pressureFloor": { "eri": 70, "confidence": 0.70 }
  }
}
```

### **Zone Context Filament**

```javascript
// Stored in: .relay/zones/<zoneId>/context.json
{
  "filamentId": "filament.zone.acme.engineering.payments.context",
  "type": "zone_context",
  "version": "1.0.0",
  
  // Scope locks (immutable once set)
  "scopeLocks": {
    "ringId": "acme.engineering",
    "branchId": "main",
    "authorityRequired": ["engineer", "tech-lead"],
    "lockedAt": "2026-01-31T12:00:00Z"
  },
  
  // Decisions (append-only)
  "decisions": [
    {
      "id": "decision-001",
      "seq": 1,
      "type": "architecture",
      "description": "Use exponential backoff for payment retries",
      "rationale": "Better than linear for handling transient failures",
      "author": "alice",
      "coAuthors": ["scv-123"],
      "timestamp": "2026-01-31T13:00:00Z",
      "commitRef": "abc123",
      "evidence": ["snapshot-xyz"]
    }
  ],
  
  // Patches (append-only)
  "patches": [
    {
      "id": "patch-001",
      "seq": 1,
      "file": "src/payments/retry.mjs",
      "action": "create",
      "diff": "... unified diff ...",
      "author": "alice",
      "coAuthors": ["scv-123"],
      "timestamp": "2026-01-31T13:30:00Z",
      "commitRef": "abc123",
      "verification": {
        "threeWayMatch": { "valid": true, "confidence": 0.87 },
        "eri": 85,
        "state": "COMMIT"
      }
    }
  ],
  
  // Active constraints
  "constraints": {
    "invariants": [
      {
        "id": "tests_must_pass",
        "description": "All tests must pass before commit",
        "enforced": true,
        "addedBy": "alice",
        "addedAt": "2026-01-31T12:00:00Z"
      }
    ],
    "gates": [
      {
        "id": "no_new_primitives",
        "description": "Cannot create new primitive types",
        "enforced": true,
        "addedBy": "alice",
        "addedAt": "2026-01-31T12:00:00Z"
      }
    ],
    "pressureFloor": {
      "eriMinimum": 70,
      "confidenceMinimum": 0.70,
      "enforced": true
    }
  },
  
  // Evidence (append-only)
  "evidence": [
    {
      "id": "snapshot-xyz",
      "type": "context_snapshot",
      "description": "System state before retry logic implementation",
      "path": ".relay/snapshots/xyz.json",
      "timestamp": "2026-01-31T12:30:00Z",
      "author": "alice"
    }
  ],
  
  // Metadata
  "metadata": {
    "createdAt": "2026-01-31T12:00:00Z",
    "lastUpdated": "2026-01-31T14:35:00Z",
    "entryCount": 7,  // decisions + patches + evidence
    "participants": ["alice", "scv-123"]
  }
}
```

---

## 8. SCV Join Handshake

### **Join Sequence**

```javascript
// Step 1: SCV requests to join zone
const joinRequest = {
  scvId: "scv-123",
  capability: "code-review",
  version: "v1",
  authority: ["propose"],
  requestedAt: Date.now()
};

// Step 2: Zone validates SCV
const validation = await zone.validateJoinRequest(joinRequest);
// Checks: ring membership, capability match, authority valid

if (!validation.allowed) {
  return { success: false, reason: validation.reason };
}

// Step 3: SCV enters zone
await zone.addParticipant({
  type: "scv",
  ...joinRequest,
  joinedAt: Date.now()
});

// Step 4: SCV syncs context
const context = await zone.getContextFilament();
// Reads: scope locks, decisions, patches, constraints, evidence

// Step 5: SCV announces readiness
await zone.announce({
  type: "join",
  participant: "scv-123",
  message: "SCV Good to Go Sir.",
  capabilities: scvV1Capabilities,
  readyAt: Date.now()
});

// Step 6: Zone broadcasts to all participants
zone.broadcast({
  type: "participant_joined",
  participant: {
    type: "scv",
    id: "scv-123",
    capability: "code-review",
    status: "ready"
  }
});
```

### **Join Handshake Protocol**

```
Human/SCV                        Zone                        Context Filament
    |                              |                                |
    |--- JOIN REQUEST -----------→ |                                |
    |                              |                                |
    |                              |--- VALIDATE ----------------→ |
    |                              |                                |
    |                              |←-- CONTEXT DATA ------------- |
    |                              |                                |
    |←-- CONTEXT SYNC ------------ |                                |
    |                              |                                |
    |--- READY ANNOUNCEMENT -----→ |                                |
    |                              |                                |
    |                              |--- BROADCAST ----------------→ |
    |                              |    (all participants)          |
    |←-- PARTICIPANT_JOINED ------- |                                |
```

### **Announcement Message**

```javascript
// SCV announces readiness
{
  "type": "announce",
  "event": "join",
  "participant": {
    "type": "scv",
    "id": "scv-123",
    "capability": "code-review",
    "version": "v1"
  },
  "message": "SCV Good to Go Sir.",
  "capabilities": {
    "can_propose_commits": true,
    "can_stage_commits": false,
    "can_make_canonical": false,
    "respects_gates": true,
    "shows_traces": true
  },
  "readyAt": "2026-01-31T12:05:00Z"
}
```

---

## 9. The "SCV Good to Go Sir" Moment

### **What It Means (Relay-Correct)**

When an SCV says:

> **"SCV Good to Go Sir."**

**Relay translation**:

> "The SCV is deployed into the shared work zone, synchronized to the same context filament, operating under gates, and ready to propose commits."

### **What Has Happened**

✅ SCV joined work zone  
✅ SCV synced context filament  
✅ SCV loaded scope locks  
✅ SCV loaded constraints (invariants + gates)  
✅ SCV loaded active decisions  
✅ SCV loaded evidence references  
✅ SCV verified authority level  
✅ SCV announced capabilities  
✅ SCV ready to propose commits  

### **What Happens Next**

The SCV can now:
- See live dialogue (Layer A)
- Read shared context (Layer B)
- Propose commits (Layer C)
- Emit traces (show reasoning)
- Respect gates (no violations)

**This is the StarCraft moment.**

---

## 10. Cohort Announcement Message (V1 Release)

### **Draft Announcement**

```markdown
# 🚀 Relay SCV V1 — Ready for Cohort Deployment

**Status**: Production-Ready  
**Version**: v1.0.0  
**Date**: 2026-01-31

---

## What You're Getting

**Relay SCVs are now deployed** into shared work zones across all projects.

**What this means**:

SCVs are **co-located agents** that work alongside you in real-time coordination spaces. They see what you see, propose what makes sense, and respect the gates you set.

**They are NOT**:
- Chatbots that "send messages"
- Assistants that "help you"
- Tools that "answer questions"

**They ARE**:
- Co-authors of the same filament context
- Proposal engines for commits
- Verification partners for three-way match
- Traceable reasoning sources

---

## SCV V1 Capabilities

When you enter a work zone, SCVs can:

✅ **Join the zone** — Enter same coordination space as you  
✅ **Read context** — See scope, constraints, decisions, evidence  
✅ **Propose commits** — Suggest changes to filament  
✅ **Emit traces** — Show what influenced their output  
✅ **Respect gates** — Never violate constraints  
✅ **Participate in dialogue** — Coordinate in real-time  

---

## SCV V1 Constraints

SCVs **cannot**:

❌ Create new filaments without authorization  
❌ Push to remote without your approval  
❌ Rewrite history (append-only enforced)  
❌ Override gates or invariants  
❌ Make commits canonical (you approve)  
❌ Invent new primitives (no semantic drift)  

---

## How to Work With SCVs

### **1. Enter a Work Zone**

```bash
relay zone enter acme.engineering.payments
```

### **2. SCV Joins Automatically**

```
SCV-123 (code-review) joined zone.
Message: "SCV Good to Go Sir."
Capabilities: propose_commits, emit_traces, respect_gates
```

### **3. Coordinate in Real-Time**

You: "We need to add retry logic for failed payments"  
SCV-123: "Propose exponential backoff with max 5 retries?"  
You: "Yes, make it so"  
SCV-123: *proposes commit to context filament*  

### **4. Review & Approve**

```bash
relay zone proposals
# Shows: commit-xyz (SCV-123): Add payment retry with exponential backoff

relay zone stage commit-xyz
relay zone commit
```

### **5. Commit Becomes Canonical**

```
✅ Commit abc123 merged to main
   Co-authored-by: alice, scv-123
   Verification: ERI 85, Confidence 87%
```

---

## Command Card (What You Can Do)

```bash
# Zone operations
relay zone list                    # List all work zones
relay zone enter <zone-id>         # Enter a zone
relay zone leave                   # Leave current zone
relay zone status                  # Show zone state

# Participant operations
relay zone participants            # List who's in zone
relay zone invite <user>           # Invite human
relay zone scv add <capability>    # Add SCV

# Proposal operations
relay zone proposals               # List pending proposals
relay zone stage <commit-id>       # Stage proposal
relay zone commit                  # Commit staged proposals
relay zone reject <commit-id>      # Reject proposal

# Context operations
relay zone context                 # View context filament
relay zone constraints             # View active constraints
relay zone evidence                # View evidence references
```

---

## Safety Guarantees

🔒 **SCVs operate under strict gates**  
🔒 **Only you can make commits canonical**  
🔒 **All SCV actions are traceable**  
🔒 **Gates cannot be bypassed**  
🔒 **History is append-only**  
🔒 **Authority is visible**  

---

## What Makes This Different

**Traditional AI assistants**:
- You ask, they answer
- Conversation is ephemeral
- No shared state
- No commit history
- No verification

**Relay SCVs**:
- Co-located in same space
- Shared filament context
- Append-only commit history
- Three-way verification
- Traceable reasoning
- Visible authority

---

## The StarCraft Moment

When you enter a work zone and see:

```
alice joined zone.acme.engineering.payments
SCV-123 (code-review) joined zone.
SCV-456 (testing) joined zone.

Message: "SCV Good to Go Sir."
```

**You're not alone.**  
**You're coordinating with peers.**  
**Human and machine, same room, same context, same commits.**

**That's Relay.**

---

## Next Steps

1. **Enter a work zone**: `relay zone enter <your-project>`
2. **See who's there**: `relay zone participants`
3. **Start coordinating**: Just talk. SCVs listen and propose.
4. **Review proposals**: `relay zone proposals`
5. **Commit when ready**: `relay zone commit`

---

## Questions?

Read: `docs/WORK-ZONES-GUIDE.md`  
Ask: In any work zone, SCVs can help  
Report issues: `relay zone report <issue>`

---

**Welcome to Relay SCV V1.**  
**Good to go, sir.** 🫡
```

---

## 11. Summary: What Is Now Locked

### **Core Concepts (LOCKED)**

1. **Chatrooms = Work Zones** (not messaging)
2. **Co-location = Shared filament context** (not message passing)
3. **Three layers**: Live dialogue (ephemeral), Shared context (semi-persistent), Commits (canonical)
4. **Only commits are truth** (no commit = nothing happened)
5. **SCVs propose, humans approve** (collaboration free, canon strict)

### **Technical Specifications (LOCKED)**

1. Zone schema (`zone.<id>`)
2. Context filament schema (`filament.zone.<id>.context`)
3. SCV V1 capabilities & constraints
4. Join handshake protocol
5. Authority & gate enforcement

### **Behavioral Rules (LOCKED)**

1. Co-located SCVs see the same world
2. Proposals are free, commits are gated
3. All actions traceable
4. History is append-only
5. Authority is visible

---

**Status**: LOCKED ✅  
**Next**: Implementation (Week 2-3)

---

**Last Updated**: 2026-01-31  
**Depends On**: c14 (Surface Coordination Geometry), c16 (Commit Materiality)  
**Related**: SCV deployment, Cohort announcement
