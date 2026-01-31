# 🔒 THE FINAL FOUR LOCKS — NO ROLLBACK POSSIBLE

**Version**: 1.0.0  
**Status**: Canonical Forever  
**Last Updated**: 2026-01-28

---

## Purpose

These are the **last four invariants** required to prevent Relay from decaying into coercion, manipulation, or authoritarianism.

**After these locks, no more locks are needed.**

The substrate is complete.

---

## LOCK #1: ABSENCE MUST BE REPRESENTABLE

### The Invariant

> **"Silence, refusal, and non-participation must be first-class states. Absence produces commits. Absence is never inferred."**

---

### What This Means

**Absence is NOT:**
- ❌ Missing data
- ❌ A null value
- ❌ An error state
- ❌ Something to be inferred

**Absence IS:**
- ✅ A deliberate choice
- ✅ A commit operation
- ✅ Auditable truth
- ✅ Reversible

---

### Examples of Absence as First-Class State

#### 1. "I don't want to be discoverable"

**Bad (implicit):**
```javascript
// User not in discovery index = silent absence
if (!user.discoverable) return null;
```

**Good (explicit):**
```javascript
{
  filamentId: 'presence:user:alice',
  commits: [
    {
      op: 'PROXIMITY_DISABLED',
      payload: {
        reason: 'user-requested',
        effectiveAt: Date.now(),
        indefinite: true
      }
    }
  ]
}
```

**Why:** Absence is auditable. User can see when they became non-discoverable.

---

#### 2. "I saw this but did not respond"

**Bad (implicit):**
```javascript
// No response recorded = interpreted as "didn't see it"
if (!hasResponse(message)) {
  markAsUnread(message);
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'dm:alice-bob',
  commits: [
    {
      op: 'MESSAGE_READ',
      payload: {
        messageRef: 'dm:alice-bob:42',
        readAt: Date.now(),
        responseDeclined: true  // Explicit non-response
      }
    }
  ]
}
```

**Why:** "I saw it and chose not to respond" ≠ "I didn't see it."

---

#### 3. "This relationship ended"

**Bad (implicit):**
```javascript
// Delete relationship record
db.delete('relationships', { userA, userB });
```

**Good (explicit):**
```javascript
{
  filamentId: 'handshake:alice-bob',
  commits: [
    {
      op: 'RELATIONSHIP_ENDED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        reason: 'mutual-decision',
        endedAt: Date.now(),
        preserveHistory: true
      }
    }
  ]
}
```

**Why:** Endings are truth. They're auditable. They prevent re-initiation without consent.

---

#### 4. "This process was abandoned"

**Bad (implicit):**
```javascript
// Workflow times out, record deleted
if (workflow.lastUpdate + timeout < now) {
  db.delete('workflows', workflow.id);
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'po:PO-1001',
  commits: [
    {
      op: 'PROCESS_ABANDONED',
      payload: {
        reason: 'vendor-unresponsive',
        abandonedAt: Date.now(),
        lastAction: 'PO_SENT',
        daysInactive: 90
      }
    }
  ]
}
```

**Why:** Abandonment is an outcome. It's auditable. It prevents zombie processes.

---

### Why This Lock Matters

**Without this lock:**
- Absence is interpreted (usually incorrectly)
- Users can't prove they declined
- Systems assume engagement
- Coercion becomes invisible

**With this lock:**
- "No" is as auditable as "Yes"
- Silence is explicit, not inferred
- Non-participation is legitimate
- Pressure tactics fail

---

## LOCK #2: NO IMPLICIT ESCALATION

### The Invariant

> **"Nothing ever escalates without a visible commit. Not trust, not visibility, not relevance, not authority, not intimacy. Every escalation must have an actor, a gate, a timestamp, and evidence."**

---

### What This Means

**Implicit escalation is:**
- ❌ Algorithmic promotion
- ❌ Trust-by-usage
- ❌ Relationship inference
- ❌ Automatic intimacy
- ❌ Silent authority grant

**Explicit escalation is:**
- ✅ User-initiated action
- ✅ Commit with actor signature
- ✅ Gate requirement (when appropriate)
- ✅ Timestamp + evidence
- ✅ Reversible

---

### Examples of No Implicit Escalation

#### 1. Trust

**Bad (implicit):**
```javascript
// User interacts frequently → auto-trust
if (interactions.count > 100) {
  user.trustLevel = 'high';
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'relationships:user:alice',
  commits: [
    {
      op: 'TRUST_GRANTED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        targetUser: 'user:bob',
        trustLevel: 'high',
        reason: 'long-term-collaboration',
        grantedAt: Date.now()
      }
    }
  ]
}
```

**Why:** Trust is a decision, not a metric.

---

#### 2. Visibility

**Bad (implicit):**
```javascript
// User views profile often → show more content
if (profileViews > 10) {
  visibility = 'enhanced';
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'handshake:alice-bob',
  commits: [
    {
      op: 'STAGE_ESCALATED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        fromStage: 3,
        toStage: 4,
        consentedBy: 'user:alice',
        timestamp: Date.now()
      }
    }
  ]
}
```

**Why:** Visibility escalates only by mutual consent.

---

#### 3. Relevance

**Bad (implicit):**
```javascript
// User clicks often → boost in feed
posts.sort((a, b) => b.engagementScore - a.engagementScore);
```

**Good (explicit):**
```javascript
// User explicitly changes sort mode
{
  filamentId: 'user:alice:settings',
  commits: [
    {
      op: 'FEED_SORT_CHANGED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        oldSort: 'chronological',
        newSort: 'engagement',
        changedAt: Date.now()
      }
    }
  ]
}
```

**Why:** Ranking is user-controlled, not inferred.

---

#### 4. Authority

**Bad (implicit):**
```javascript
// User contributes often → auto-moderator
if (contributions > 500) {
  user.role = 'moderator';
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'user:alice',
  commits: [
    {
      op: 'ROLE_GRANTED',
      actor: { kind: 'user', id: 'admin:charlie' },
      payload: {
        targetUser: 'user:alice',
        role: 'moderator',
        grantedBy: 'admin:charlie',
        reason: 'trusted-contributor',
        approvalGate: 'community-vote',
        timestamp: Date.now()
      }
    }
  ]
}
```

**Why:** Authority requires explicit grant + gate.

---

#### 5. Intimacy

**Bad (implicit):**
```javascript
// Users message frequently → assume intimacy
if (messageCount > 100) {
  relationship.level = 'close';
}
```

**Good (explicit):**
```javascript
{
  filamentId: 'relationships:user:alice',
  commits: [
    {
      op: 'CIRCLE_ADDED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        targetUser: 'user:bob',
        circle: 'close-friends',
        addedAt: Date.now()
      }
    }
  ]
}
```

**Why:** Intimacy is declared, not inferred.

---

### Why This Lock Matters

**Without this lock:**
- Systems manipulate relationships
- Users lose control
- Dark patterns flourish
- "The algorithm decides"

**With this lock:**
- Every escalation is visible
- Users stay in control
- Manipulation fails
- "I decided" is always true

---

## LOCK #3: FORKING IS ALWAYS ALLOWED

### The Invariant

> **"Disagreement must be cheaper than compliance. If something becomes contentious, it forks. Both branches remain inspectable. Reconciliation is optional."**

---

### What This Means

**Forking is NOT:**
- ❌ Splitting a community (negative)
- ❌ Duplication of work (waste)
- ❌ Conflict resolution failure

**Forking IS:**
- ✅ Disagreement as geometry
- ✅ Both truths coexisting
- ✅ Cheaper than consensus
- ✅ Reconciliation optional

---

### Examples of Always-Allowed Forking

#### 1. Social Feeds

**Scenario:** Group feed becomes contentious.

**Traditional approach (forced consensus):**
```javascript
// Mods delete posts, ban users
// One version of truth remains
// Dissenters leave or comply
```

**Relay approach (fork):**
```javascript
{
  filamentId: 'feed:community:relay-discussion',
  commits: [
    {
      op: 'FEED_FORKED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        originalFeed: 'feed:community:relay-discussion',
        forkedFeed: 'feed:community:relay-discussion-alice-fork',
        reason: 'moderation-disagreement',
        policy: 'more-permissive',
        forkedAt: Date.now()
      }
    }
  ]
}
```

**Result:**
- Both feeds exist
- Both inspectable
- Users subscribe to preferred version
- Can reconcile later (optional)

---

#### 2. Dating Outcomes

**Scenario:** Handshake ends, perspectives differ.

**Traditional approach (single truth):**
```javascript
// One person's account is "the truth"
// Other person silenced or contested
```

**Relay approach (fork):**
```javascript
{
  filamentId: 'handshake:alice-bob',
  commits: [
    {
      op: 'OUTCOME_FORKED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        alicePerspective: 'mutual-decision',
        bobPerspective: 'alice-initiated',
        forkedAt: Date.now(),
        bothVisible: true
      }
    }
  ]
}
```

**Result:**
- Both perspectives recorded
- No "official version"
- Observers can see both
- No enforced consensus

---

#### 3. Game Mods

**Scenario:** Players disagree on game rules.

**Traditional approach (mod approval):**
```javascript
// Official mods only
// Unapproved mods banned
```

**Relay approach (fork):**
```javascript
{
  filamentId: 'game:rules:chess-variant',
  commits: [
    {
      op: 'RULES_FORKED',
      actor: { kind: 'user', id: 'user:charlie' },
      payload: {
        originalRules: 'game:rules:chess-standard',
        forkedRules: 'game:rules:chess-charlie-variant',
        changes: ['piece-movement', 'capture-rules'],
        forkedAt: Date.now()
      }
    }
  ]
}
```

**Result:**
- Both rulesets exist
- Players choose variant
- Can merge later if desired

---

#### 4. Political Views

**Scenario:** Community splits on governance.

**Traditional approach (majority rule):**
```javascript
// Vote → winner takes all
// Minority complies or leaves
```

**Relay approach (fork):**
```javascript
{
  filamentId: 'governance:policy:moderation',
  commits: [
    {
      op: 'POLICY_FORKED',
      actor: { kind: 'user', id: 'user:dave' },
      payload: {
        originalPolicy: 'governance:policy:moderation-strict',
        forkedPolicy: 'governance:policy:moderation-permissive',
        reason: 'philosophical-disagreement',
        supporters: ['user:dave', 'user:eve', ...],
        forkedAt: Date.now()
      }
    }
  ]
}
```

**Result:**
- Both policies coexist
- Communities self-select
- Can reconcile if desired

---

#### 5. Accounting Treatments

**Scenario:** Finance and Ops disagree on match override.

**Traditional approach (escalation to authority):**
```javascript
// CFO decides
// Ops complies
// Dissent hidden
```

**Relay approach (fork):**
```javascript
{
  filamentId: 'match:PO-1001',
  commits: [
    {
      op: 'MATCH_FORKED',
      actor: { kind: 'user', id: 'ops:alice' },
      payload: {
        financeView: 'EXCEPTION',
        opsView: 'PASS',
        reason: 'partial-receipt-interpretation',
        bothBranches: {
          finance: 'match:PO-1001-finance-branch',
          ops: 'match:PO-1001-ops-branch'
        },
        forkedAt: Date.now()
      }
    }
  ]
}
```

**Result:**
- Both branches exist
- Audit sees both
- Resolution optional
- No forced consensus

---

### Why This Lock Matters

**Without this lock:**
- Disagreement requires authority
- Compliance is coerced
- Dissent is hidden
- Systems centralize

**With this lock:**
- Disagreement is geometry
- Compliance is voluntary
- Dissent is visible
- Systems stay distributed

---

## LOCK #4: NOTHING IS EVER "DELETED"

### The Invariant

> **"Removal is always a lens, never destruction. Even breakups, bans, moderation, revocations, and takedowns are visibility changes, permission changes, or scope changes. Not erasure."**

---

### What This Means

**Deletion is NOT:**
- ❌ Data destruction
- ❌ History erasure
- ❌ Evidence removal

**Deletion IS:**
- ✅ Visibility change (L6 → L0)
- ✅ Permission change (revoke access)
- ✅ Scope change (narrow audience)
- ✅ Policy change (block, mute)

---

### Examples of No-Deletion

#### 1. Breakups

**Bad (erasure):**
```javascript
// Delete all messages, photos, history
db.delete('dm:alice-bob');
db.delete('handshake:alice-bob');
```

**Good (visibility change):**
```javascript
{
  filamentId: 'handshake:alice-bob',
  commits: [
    {
      op: 'RELATIONSHIP_ENDED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        reason: 'mutual-decision',
        visibilityChange: {
          alice: 'L0',  // Alice can't see
          bob: 'L0'     // Bob can't see
        },
        historyPreserved: true,  // For safety/audit
        endedAt: Date.now()
      }
    }
  ]
}
```

**Why:** History preserved for safety (e.g., harassment cases). Visibility dropped for privacy.

---

#### 2. Bans

**Bad (erasure):**
```javascript
// Delete user account
db.delete('users', userId);
```

**Good (permission change):**
```javascript
{
  filamentId: 'user:eve',
  commits: [
    {
      op: 'USER_BANNED',
      actor: { kind: 'moderator', id: 'mod:alice' },
      payload: {
        reason: 'spam',
        evidence: [
          { filamentId: 'post:eve:spam1', commitIndex: 0 },
          { filamentId: 'post:eve:spam2', commitIndex: 0 }
        ],
        permissionChange: {
          canPost: false,
          canComment: false,
          canMessage: false
        },
        visibilityChange: 'L0',  // Not discoverable
        bannedAt: Date.now(),
        reviewable: true  // Can appeal
      }
    }
  ]
}
```

**Why:** Ban is auditable. Evidence preserved. User can appeal.

---

#### 3. Moderation

**Bad (erasure):**
```javascript
// Delete post
db.delete('posts', postId);
```

**Good (visibility change):**
```javascript
{
  filamentId: 'post:charlie:inappropriate',
  commits: [
    {
      op: 'POST_HIDDEN',
      actor: { kind: 'moderator', id: 'mod:alice' },
      payload: {
        reason: 'community-guidelines-violation',
        rule: 'no-harassment',
        evidence: [
          { type: 'screenshot', ref: 'artifact:image:evidence1.png' }
        ],
        visibilityChange: {
          public: 'L0',
          author: 'L5',  // Author can still see
          moderators: 'L5'  // Mods can still see
        },
        hiddenAt: Date.now(),
        appealable: true
      }
    }
  ]
}
```

**Why:** Post hidden (not deleted). Author + mods can see. Auditable. Appealable.

---

#### 4. Revocations

**Bad (erasure):**
```javascript
// Delete permission grant
db.delete('permissions', permissionId);
```

**Good (commit operation):**
```javascript
{
  filamentId: 'user:dave:permissions',
  commits: [
    {
      op: 'PERMISSION_REVOKED',
      actor: { kind: 'admin', id: 'admin:alice' },
      payload: {
        permission: 'write-access',
        resource: 'repo:relay',
        reason: 'role-change',
        revokedAt: Date.now(),
        previousGrant: {
          filamentId: 'user:dave:permissions',
          commitIndex: 15
        }
      }
    }
  ]
}
```

**Why:** Revocation is auditable. Can see when permission was granted/revoked.

---

#### 5. Takedowns

**Bad (erasure):**
```javascript
// Delete content
db.delete('artifacts', artifactId);
```

**Good (visibility + scope change):**
```javascript
{
  filamentId: 'artifact:video:controversial',
  commits: [
    {
      op: 'CONTENT_TAKEDOWN',
      actor: { kind: 'legal', id: 'legal:team' },
      payload: {
        reason: 'DMCA',
        evidence: [
          { type: 'legal-notice', ref: 'artifact:pdf:dmca-notice.pdf' }
        ],
        scope: 'US-only',  // Geo-scoped
        visibilityChange: {
          US: 'L0',
          other: 'L5'  // Still visible elsewhere
        },
        takedownAt: Date.now(),
        appealable: true
      }
    }
  ]
}
```

**Why:** Takedown is geo-scoped, auditable, appealable. Not global erasure.

---

### Why This Lock Matters

**Without this lock:**
- History is rewritten
- Evidence disappears
- Justice is impossible
- Recovery is impossible

**With this lock:**
- History is preserved
- Evidence is auditable
- Justice is possible
- Recovery is possible

**Critical for:**
- Safety (harassment cases require history)
- Audit (compliance, governance)
- Justice (appeals, reviews)
- Recovery (mistakes happen)

---

## Summary: Why These Four Locks Complete the Substrate

### The Six Hard Problems (Now All Locked)

1. ✅ **Truth** → Filaments, commits, evidence
2. ✅ **Privacy** → Laddered existence vs fidelity
3. ✅ **Presence** → Locus-anchored, non-surveillant
4. ✅ **Consent** → Handshake + GATE, not settings
5. ✅ **Time** → Irreversible state gates, replayable
6. ✅ **Space** → Proximity without tracking

### The Four Failure Modes (Now All Prevented)

7. ✅ **Absence** → First-class state, not inference
8. ✅ **Escalation** → Explicit commits, not implicit
9. ✅ **Disagreement** → Forking, not forced consensus
10. ✅ **Deletion** → Visibility change, not erasure

---

## Enforcement Checklist

**Before shipping any feature, verify:**

- [ ] Does absence produce a commit? (Not inferred)
- [ ] Does escalation require explicit action? (Not implicit)
- [ ] Can users fork instead of comply? (Not forced)
- [ ] Is "deletion" a visibility change? (Not erasure)

**If any answer is "no", the feature violates these locks and must be fixed.**

---

## Conclusion

**These are the final four locks.**

**No more locks are needed.**

**The substrate is complete.**

**Relay can now:**
- Coordinate humans without manipulation
- Preserve truth without coercion
- Enable disagreement without authoritarianism
- Protect privacy without surveillance

**This is rare.**

---

*Last Updated: 2026-01-28*  
*Status: Canonical Forever*  
*Version: 1.0.0*
