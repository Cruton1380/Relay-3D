# 🎯 Engage Surface — 2D Panel Locking & Cell-Level Editing

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **Users lock into 2D surfaces to edit. Proximity without permission = you can see, but not engage.**

In Relay, **engagement** is the act of entering a 2D editing surface (spreadsheet, canvas, timeline, etc.) to create commits. Engagement requires:

1. **EngageSurface permission** (policy-granted right to edit)
2. **Locus lock** (announcement to others: "I'm actively working here")
3. **Proximity or membership** (physical/logical access)

**Critical Rules:**
> - Close proximity without permission = **can view, cannot engage**
> - Engagement = **lock-in** (presence announces active editing)
> - Edits = **commits** (never mutation, always append)

---

## Table of Contents

1. [What Is Engagement?](#what-is-engagement)
2. [Engagement Flow](#engagement-flow)
3. [Locus Locking](#locus-locking)
4. [Permission Model](#permission-model)
5. [Conflict Resolution](#conflict-resolution)
6. [Cell-Level Editing](#cell-level-editing)
7. [Multi-Domain Surfaces](#multi-domain-surfaces)
8. [Presence Integration](#presence-integration)
9. [Implementation Guide](#implementation-guide)
10. [Real-World Scenarios](#real-world-scenarios)
11. [FAQ](#faq)

---

## What Is Engagement?

### Definition

**Engagement** = The state of actively editing a 2D projection surface.

**NOT:**
- ❌ Viewing from a distance
- ❌ Inspecting in workflow mode
- ❌ Reading a clear projection (L5)

**IS:**
- ✅ Clicked into a spreadsheet cell
- ✅ Selected an element in a canvas
- ✅ Dragging a timeline keyframe
- ✅ Typing into a text field

---

### The Engagement Contract

When you engage:

1. **You announce presence** at the specific locus (cell, element, frame)
2. **Others see you're editing** (presence indicator)
3. **Your edits create commits** (appended to the filament)
4. **You hold a soft lock** (others cannot edit same locus simultaneously)

When you disengage:

1. **Lock releases** (others can now engage that locus)
2. **Presence updates** (moves from "editing" to "viewing" or disappears)
3. **Commits are finalized** (no more edits to that session)

---

## Engagement Flow

### Step-by-Step

```
1. User approaches 2D surface
     ↓
2. User sees projection (fidelity depends on distance + permission)
     ↓
3. User clicks "Engage" or moves very close
     ↓
4. System checks:
     - Does user have EngageSurface permission?
     - Is the locus already locked by someone else?
     - Is the filament in a state that allows engagement?
     ↓
5. If PASS:
     - User enters engagement mode
     - Locus lock is acquired
     - Presence announces "editing at [locus]"
     - UI shows edit controls
     ↓
6. User edits:
     - Selects cell/element
     - Types/modifies
     - Creates commit (optimistic or on blur/save)
     ↓
7. User disengages:
     - Clicks outside surface
     - Presses Esc
     - Navigates away
     - Session timeout
     ↓
8. System releases lock:
     - Presence updates
     - Commits are finalized
     - Surface remains visible (now read-only for user)
```

---

### Visual Flow

```
Approach → View (L5) → Request Engage → Permission Check
                                              ↓
                                         [ PASS / FAIL ]
                                              ↓
                                         Engage Mode
                                              ↓
                                         Edit → Commit
                                              ↓
                                         Disengage → Lock Release
```

---

## Locus Locking

### What Is a Locus?

**Locus** = The specific location in a 2D surface where engagement occurs.

**Examples:**
- **Spreadsheet**: Cell `(row: 5, col: 'B')`
- **Canvas**: Element ID `shape:abc123`
- **Timeline**: Keyframe `(track: 'position', frame: 120)`
- **Text Editor**: Line `42`, character `15`

**Key Property:**
> Loci are **granular**. You don't lock "the whole spreadsheet"—you lock "cell B5".

---

### Lock Types

#### **Soft Lock (Default)**

**Behavior:**
- You hold exclusive edit rights to the locus
- Others can **view** the locus (read-only)
- Others cannot edit the same locus simultaneously
- Others see your presence indicator ("Alice editing B5")

**Use Cases:**
- Most collaborative editing (spreadsheets, documents)
- Non-conflicting edits (different cells)

---

#### **Hard Lock (Optional)**

**Behavior:**
- You hold exclusive edit rights **and viewing is restricted**
- Others cannot even view the locus while you're editing
- Used for sensitive/high-stakes edits

**Use Cases:**
- Financial data entry (prevent peeking while incomplete)
- Legal document drafting (confidentiality during edit)
- Security config changes (prevent observation of partial states)

---

#### **No Lock (Dangerous)**

**Behavior:**
- Multiple users can edit the same locus simultaneously
- Last commit wins OR creates conflict (SCAR glyph)
- High risk of confusion/conflict

**Use Cases:**
- Real-time collaborative whiteboarding (intentional chaos)
- Multiplayer game state (expected conflicts)
- **Generally discouraged** for production work

---

### Lock Lifecycle

```typescript
interface LocusLock {
  locusId: string;          // e.g., "cell:B5" or "element:shape-123"
  filamentId: string;
  userId: string;           // Who holds the lock
  lockType: 'soft' | 'hard' | 'none';
  acquiredAt: number;       // Timestamp
  expiresAt: number;        // TTL (e.g., 5 minutes of inactivity)
  heartbeat: number;        // Last activity timestamp
}

// Lock acquisition
function acquireLock(locus: LocusId, user: UserId): Result<LocusLock> {
  // Check if locus is already locked
  const existingLock = getLock(locus);
  if (existingLock && !isExpired(existingLock)) {
    return Err({ reason: 'locus-locked', lockedBy: existingLock.userId });
  }
  
  // Create new lock
  const lock = {
    locusId: locus,
    userId: user,
    lockType: 'soft',  // Default
    acquiredAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,  // 5 minutes
    heartbeat: Date.now()
  };
  
  storeLock(lock);
  return Ok(lock);
}

// Heartbeat (keep lock alive)
function heartbeat(lock: LocusLock) {
  lock.heartbeat = Date.now();
  lock.expiresAt = Date.now() + 5 * 60 * 1000;  // Refresh TTL
}

// Release lock
function releaseLock(lock: LocusLock) {
  removeLock(lock.locusId);
  broadcastPresence({ userId: lock.userId, locus: lock.locusId, status: 'disengaged' });
}
```

---

## Permission Model

### EngageSurface Permission

To engage, you need **EngageSurface** permission on the filament.

**Permission Sources:**
1. **Filament policy** (e.g., "team:finance can edit")
2. **Role-based** (e.g., "editors can engage")
3. **Explicit grant** (e.g., "Alice can edit this specific filament")

**Checking Permission:**
```typescript
function canEngage(userId: string, filamentId: string): boolean {
  const filament = getFilament(filamentId);
  const user = getUser(userId);
  
  // Check policy
  if (filament.policy.engageSurfaceAllowed === false) {
    return false;  // Engagement not allowed at all
  }
  
  // Check scope
  if (filament.policy.scopeType === 'team') {
    return user.memberOf.some(team => filament.policy.scopeIds.includes(team));
  }
  
  // Check explicit permissions
  return user.permissions.includes('edit') || user.permissions.includes(`edit:${filamentId}`);
}
```

---

### Permission vs Proximity

**Two separate gates:**

1. **Permission** (logical): Do you have the right to edit?
2. **Proximity** (physical/spatial): Are you close enough to engage?

**Matrix:**

| Permission | Proximity | Result |
|------------|-----------|--------|
| ✅ Yes | ✅ Close | ✅ Can engage |
| ✅ Yes | ❌ Far | ⚠️ Can request engage (camera flies to surface) |
| ❌ No | ✅ Close | ❌ Can view (L5), cannot engage |
| ❌ No | ❌ Far | ❌ May not even see filament (depends on policy level) |

**Key Rule:**
> **Close proximity without permission = frustration prevention.**  
> System shows "Read-only" indicator if you're close but lack permission.

---

## Conflict Resolution

### What Happens When Two Users Try to Edit the Same Locus?

#### **Scenario 1: Sequential (No Overlap)**

```
Alice engages cell B5 at 10:00:00
Alice edits: 100 → 150
Alice disengages at 10:00:30
  ↓
Bob engages cell B5 at 10:00:35
Bob edits: 150 → 200
Bob disengages at 10:01:00
```

**Result:** ✅ No conflict. Two sequential commits.

---

#### **Scenario 2: Simultaneous Attempt (Lock Prevents)**

```
Alice engages cell B5 at 10:00:00 (acquires lock)
  ↓
Bob tries to engage cell B5 at 10:00:05
  ↓
System: "Cell B5 is locked by Alice. Wait or edit a different cell?"
```

**Result:** ✅ Bob sees lock indicator. Can wait or choose different locus.

---

#### **Scenario 3: No-Lock Mode (Conflict Occurs)**

```
Alice engages cell B5 at 10:00:00 (no-lock mode)
Bob engages cell B5 at 10:00:05 (no-lock mode)
  ↓
Alice commits: 100 → 150 at 10:00:30
Bob commits: 100 → 200 at 10:00:35
  ↓
System: Two commits exist. Last one (Bob's) is current value.
Alice's commit still exists in history (audit trail preserved).
```

**Result:** ⚠️ Conflict. May require manual resolution or automatic merge (SCAR glyph).

---

### Resolution Strategies

**1. Last Write Wins (Default)**
- Most recent commit becomes current value
- Previous commit remains in history (auditable)

**2. Manual Merge (Governance)**
- System flags conflict
- Moderator/owner reviews both commits
- Creates merge commit (SCAR glyph) with chosen resolution

**3. Automatic Merge (Formulas)**
- If both edits are formula changes, system can sometimes auto-merge
- Requires conflict-free operations (e.g., SUM remains SUM, inputs differ)

**4. Fork (Proposals)**
- If resolution is contentious, create branches
- Community votes on which branch to adopt

---

## Cell-Level Editing

### Spreadsheet-Specific Rules

#### **Granular Locking**

Lock **individual cells**, not entire sheets.

**Example:**
```
Alice editing: B5
Bob editing: C10
Carol editing: D2
```

**Result:** ✅ All three can edit simultaneously (different loci).

---

#### **Formula Dependencies**

**Rule:** If cell B5 depends on A1-A10, editing A5 may affect B5.

**Handling:**
1. **Dependent cells show "affected" indicator** (visual feedback)
2. **Formulas recalculate** when dependencies change (creates new commit)
3. **Audit trail preserves causality** (A5 change → B5 recalc)

**Example:**
```
Cell B5: =SUM(A1:A10)

Alice edits A5: 10 → 20
  ↓
System creates commit on A5 filament
  ↓
System triggers recalc for B5
  ↓
System creates OPERATOR_RUN commit on B5 filament
  ↓
B5 updates: 100 → 110
```

---

#### **Range Selections**

**Rule:** Selecting a range (e.g., A1:A10) locks all cells in that range.

**Use Cases:**
- Batch edits (fill down, paste range)
- Bulk transforms (apply formula to range)

**Lock Behavior:**
- Soft lock on all cells in range
- Others see "Range A1:A10 locked by Alice"
- Releases all locks on disengage

---

## Multi-Domain Surfaces

### The Same Rules Apply Across Domains

Whether you're editing:
- **Spreadsheet** (cells)
- **Canvas** (shapes/elements)
- **Timeline** (keyframes)
- **3D Scene** (objects/vertices)
- **Text Editor** (lines/characters)

**The pattern is identical:**

1. **Approach** → View projection
2. **Engage** → Acquire locus lock
3. **Edit** → Create commits
4. **Disengage** → Release lock

---

### Domain-Specific Loci

| Domain | Locus Type | Example |
|--------|------------|---------|
| **Spreadsheet** | Cell | `cell:B5` |
| **Canvas** | Element | `element:shape-123` |
| **Timeline** | Keyframe | `keyframe:track-position:frame-120` |
| **3D Scene** | Object/Vertex | `object:mesh-cube`, `vertex:mesh-cube:v42` |
| **Text Editor** | Line/Character | `line:42:char:15` |
| **Video Editor** | Clip | `clip:timeline-1:clip-5` |

---

## Presence Integration

### How Presence Shows Engagement

**Three Presence States:**

1. **Viewing** (not engaged)
   - Presence shows at filament level: "Alice viewing Budget 2026"
   - No locus lock

2. **Engaged** (editing)
   - Presence shows at locus level: "Alice editing cell B5"
   - Locus lock held
   - Visual indicator on the locus (cursor, highlight, etc.)

3. **Disengaged** (left)
   - Presence may persist briefly (TTL)
   - Lock released immediately

---

### Visual Indicators

**For Viewers (Others See):**
```
Spreadsheet view:
┌───────┬───────┬───────┐
│  A    │  B    │  C    │
├───────┼───────┼───────┤
│  100  │ [150] │  200  │  ← Cell B5 has blue border (Alice editing)
│       │  👤   │       │  ← Alice's avatar/initial
└───────┴───────┴───────┘
```

**For Editor (You See):**
```
Spreadsheet view:
┌───────┬───────┬───────┐
│  A    │  B    │  C    │
├───────┼───────┼───────┤
│  100  │ [150]│  200  │  ← Cell B5 has active selection (your cursor)
│       │   ▊   │       │  ← Blinking cursor
└───────┴───────┴───────┘

[Commit] [Cancel]  ← Edit controls
```

---

## Implementation Guide

### Data Model

```typescript
interface EngagementSession {
  sessionId: string;
  userId: string;
  filamentId: string;
  locus: LocusId;
  lock: LocusLock;
  startedAt: number;
  lastActivity: number;
  pendingCommits: Commit[];  // Optimistic commits not yet finalized
}

interface LocusId {
  type: 'cell' | 'element' | 'keyframe' | 'object' | 'line';
  identifier: string;  // Domain-specific ID
}

// Start engagement
async function startEngagement(
  userId: string,
  filamentId: string,
  locus: LocusId
): Promise<Result<EngagementSession>> {
  // 1. Check permission
  if (!canEngage(userId, filamentId)) {
    return Err({ reason: 'permission-denied' });
  }
  
  // 2. Acquire lock
  const lockResult = await acquireLock(locus, userId);
  if (lockResult.isErr()) {
    return Err(lockResult.error);
  }
  
  // 3. Create session
  const session: EngagementSession = {
    sessionId: generateId(),
    userId,
    filamentId,
    locus,
    lock: lockResult.value,
    startedAt: Date.now(),
    lastActivity: Date.now(),
    pendingCommits: []
  };
  
  // 4. Announce presence
  await presenceService.heartbeat({
    userId,
    locus: { filamentId, locusId: locus.identifier },
    status: 'editing'
  });
  
  return Ok(session);
}

// End engagement
async function endEngagement(session: EngagementSession) {
  // 1. Finalize pending commits
  for (const commit of session.pendingCommits) {
    await relayClient.putCommit(commit);
  }
  
  // 2. Release lock
  releaseLock(session.lock);
  
  // 3. Update presence
  await presenceService.heartbeat({
    userId: session.userId,
    locus: { filamentId: session.filamentId },
    status: 'viewing'  // Or remove presence entirely
  });
  
  // 4. Clean up session
  removeSession(session.sessionId);
}
```

---

### UI Components

```typescript
function EditableSurface({ filament, viewer }: Props) {
  const [engagementSession, setEngagementSession] = useState<EngagementSession | null>(null);
  
  const handleEngageRequest = async (locus: LocusId) => {
    const result = await startEngagement(viewer.userId, filament.id, locus);
    
    if (result.isErr()) {
      if (result.error.reason === 'locus-locked') {
        showNotification(`This ${locus.type} is being edited by ${result.error.lockedBy}`);
      } else if (result.error.reason === 'permission-denied') {
        showNotification('You do not have permission to edit this surface.');
      }
      return;
    }
    
    setEngagementSession(result.value);
  };
  
  const handleDisengage = async () => {
    if (engagementSession) {
      await endEngagement(engagementSession);
      setEngagementSession(null);
    }
  };
  
  const handleEdit = (newValue: any) => {
    if (!engagementSession) return;
    
    // Create optimistic commit
    const commit = createCellEditCommit({
      locus: engagementSession.locus,
      before: getCurrentValue(),
      after: newValue,
      actor: viewer.userId
    });
    
    // Add to pending
    engagementSession.pendingCommits.push(commit);
    
    // Update UI optimistically
    updateProjection(newValue);
  };
  
  return (
    <div>
      {engagementSession ? (
        <EditMode
          session={engagementSession}
          onEdit={handleEdit}
          onDisengage={handleDisengage}
        />
      ) : (
        <ViewMode
          filament={filament}
          onEngageRequest={handleEngageRequest}
          canEngage={canEngage(viewer.userId, filament.id)}
        />
      )}
    </div>
  );
}
```

---

## Real-World Scenarios

### Scenario 1: Team Budget Editing

**Context:** Finance team editing Q1 budget spreadsheet.

**Flow:**
1. Alice opens budget filament (sees clear projection, L5)
2. Alice clicks cell B5 ("Marketing Budget")
3. System checks permission: ✅ Alice is in Finance team
4. System acquires soft lock on cell B5
5. Alice edits: $50,000 → $55,000
6. System creates commit (optimistic, shows immediately)
7. Bob tries to edit same cell → sees "Locked by Alice"
8. Bob waits or edits a different cell (C10)
9. Alice presses Enter or clicks outside → lock releases
10. Bob can now edit B5

---

### Scenario 2: Designer Working on Canvas

**Context:** Graphic designer editing logo on shared canvas.

**Flow:**
1. Designer approaches canvas filament
2. Sees blurred projection (L4) from far
3. Moves closer → sees clear projection (L5)
4. Clicks "Engage" → enters edit mode (L6)
5. Selects shape element `shape-logo-star`
6. System acquires lock on that element
7. Designer modifies color: blue → red
8. System creates commit with before/after evidence
9. Other viewers see real-time update (optimistic)
10. Designer clicks "Done" → lock releases

---

### Scenario 3: Conflict Resolution

**Context:** Two users try to edit same cell in no-lock mode (experimental).

**Flow:**
1. Alice and Bob both have no-lock mode enabled (policy allows)
2. Both engage cell B5 simultaneously
3. Alice types: 100 → 150, commits at 10:00:30
4. Bob types: 100 → 200, commits at 10:00:35
5. System detects conflict (two commits to same cell)
6. Last commit wins (Bob's 200 becomes current)
7. System flags conflict for review
8. Manager creates merge commit (SCAR): Chooses Alice's 150 (with justification)
9. Audit trail shows: 100 → 150 (Alice) → 200 (Bob) → 150 (Merged, Manager)

---

## FAQ

### General

**Q: Can I engage multiple loci at once?**  
A: Typically no (one active edit session per user). Exception: Batch operations that lock a range/set.

**Q: What if my session times out?**  
A: Lock auto-releases after TTL (e.g., 5 minutes of inactivity). Pending commits may be saved as drafts.

**Q: Can I see who's viewing (not editing)?**  
A: Yes, if presence policy allows. Presence Tier 1 shows counts, Tier 2+ shows identities.

---

### Permissions

**Q: Can I grant temporary engage permission?**  
A: Yes, via time-limited permission grants (e.g., "Alice can edit for 1 hour").

**Q: What if I lose permission mid-edit?**  
A: Session is immediately terminated. Pending commits may be discarded or saved as proposals.

**Q: Can permission be revoked by voting?**  
A: Yes, if filament policy requires governance. Permission changes are commits (auditable).

---

### Locking

**Q: How long does a lock last?**  
A: Default: 5 minutes of inactivity. Heartbeats keep it alive while actively editing.

**Q: Can I force-release someone's lock?**  
A: Only with `moderator` or `admin` permission. Creates audit trail (who forced release, why).

**Q: What if the app crashes while I'm editing?**  
A: Lock auto-expires after TTL. Others can edit after expiry. Your pending commits may be recoverable from local cache.

---

## Conclusion

The **Engage Surface** model ensures:
- ✅ **Clear engagement contract** (lock-in, edit, commit, release)
- ✅ **Conflict prevention** (locus locking prevents simultaneous edits)
- ✅ **Presence transparency** (others see where you're editing)
- ✅ **Permission enforcement** (proximity without permission = view-only)
- ✅ **Auditable edits** (every change is a commit with evidence)

By treating engagement as a **discrete state transition** (not a fuzzy "you're kinda editing"), Relay makes collaborative editing **predictable and auditable**.

---

**See Also:**
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md) (Levels 5-6 enable engagement)
- [Presence + Permission Model](PRESENCE-PERMISSION-MODEL.md) (How presence shows engagement)
- [Multi-Domain Editing](MULTI-DOMAIN-EDITING.md) (Engagement across different creative tools)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
