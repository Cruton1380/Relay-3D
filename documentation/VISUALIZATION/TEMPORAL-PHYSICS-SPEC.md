# ⏱️ Temporal Physics — Time as Causal Ordering

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Time in Relay is causal ordering, not clock truth. Wall-clock is context; event order is authority."**

This is not negotiable. In Relay, **event time** (X-axis commit order) is the source of truth. **Clock time** (timestamps) is metadata that provides context but never overrides causality.

---

## Table of Contents

1. [The Problem with Clock Time](#the-problem-with-clock-time)
2. [Three Layers of Time](#three-layers-of-time)
3. [Event Time (X-Axis)](#event-time-x-axis)
4. [Clock Time (Timestamps)](#clock-time-timestamps)
5. [Playback Time (Navigation)](#playback-time-navigation)
6. [Late-Arriving Evidence](#late-arriving-evidence)
7. [Distributed Time](#distributed-time)
8. [Temporal Attacks](#temporal-attacks)
9. [Rendering Time](#rendering-time)
10. [Real-World Examples](#real-world-examples)
11. [FAQ](#faq)

---

## The Problem with Clock Time

### Traditional Systems Trust Clocks

**Assumptions:**
- System clocks are accurate
- Clocks are synchronized
- Timestamps define order
- "Earlier timestamp" = "happened first"

**Reality:**
- Clocks drift (NTP sync lag)
- Clocks can be tampered with (set backward/forward)
- Distributed systems have clock skew
- Timestamps can be forged

**Result:** **Time is untrustworthy.**

---

### Example: Clock-Based Ordering Fails

**Scenario:** Two commits on same filament.

**Clock timestamps:**
```
Commit A: 2026-01-28 10:00:05  (created second)
Commit B: 2026-01-28 10:00:03  (created first, but clock was ahead)
```

**If we trust timestamps:** Commit B → Commit A (wrong!)  
**Actual causal order:** Commit A → Commit B (A is parent of B)

**Relay's answer:** **Ignore timestamps for ordering. Use commit index (X-axis).**

---

## Three Layers of Time

Relay uses **three distinct, non-conflicting concepts of time:**

### 1. Event Time (X-Axis) — **Truth**
**Definition:** Monotonically increasing commit index within a filament.

**Properties:**
- Integer sequence (0, 1, 2, 3, ...)
- Immutable (cannot be reordered)
- Authoritative (defines causality)
- Deterministic (replay is exact)

**Use:** Audit, causality, replay

---

### 2. Clock Time (Timestamps) — **Context**
**Definition:** Wall-clock timestamp (unix ms) when commit was created.

**Properties:**
- Approximate (clocks drift)
- Contextual (provides human-readable "when")
- Non-authoritative (does not define order)
- Useful for correlation (cross-system events)

**Use:** Human readability, cross-system correlation

---

### 3. Playback Time (UI Navigation) — **Lens**
**Definition:** User-controlled time slider for navigating history.

**Properties:**
- Virtual (not real time)
- User-driven (play/pause/step/rewind)
- Lens-dependent (different users can be at different times)
- Non-destructive (does not mutate truth)

**Use:** History navigation, audit replay, "what if" scenarios

---

## Event Time (X-Axis)

### Definition

**Event Time** = The commit's position in the filament's history.

**Represented as:**
- `commitIndex` (integer, 0-based)
- X-axis position in 3D view

**Example:**
```javascript
const filament = {
  id: 'budget-2026',
  commits: [
    { commitIndex: 0, ... },  // Event 0
    { commitIndex: 1, ... },  // Event 1
    { commitIndex: 2, ... },  // Event 2
  ]
};
```

**X-axis visualization:**
```
|--[0]--[1]--[2]-->
```

---

### Properties

#### 1. **Monotonic**
Commit indices always increase:
```
0 → 1 → 2 → 3 → ...
```

Never:
```
0 → 2 → 1 ❌ (out of order)
```

---

#### 2. **Immutable**
Once assigned, a commit's index never changes.

**Cannot:**
- Reorder commits
- Insert commits between existing indices
- Delete commits (gaps in sequence)

**Can:**
- Fork (create branch with new sequence)
- Replay (reconstruct from genesis)

---

#### 3. **Deterministic**
Given the same sequence of commits, replay produces identical state.

**Example:**
```javascript
// Replay commits 0 → 5
const state = replayCommits(filament, 0, 5);

// Always produces same result
assert(state === replayCommits(filament, 0, 5));
```

---

#### 4. **Branch-Aware**
Each branch has its own commit sequence.

**Example:**
```
main:     [0]--[1]--[2]--[3]
                   ↓
branch-A:        [2']--[3']
```

Commit indices are **per-branch**, not global.

---

## Clock Time (Timestamps)

### Definition

**Clock Time** = Wall-clock timestamp (unix ms) when commit was created.

**Represented as:**
- `ts` field in commit envelope
- Displayed in UI as human-readable date/time

**Example:**
```javascript
{
  commitIndex: 42,
  ts: 1738024800000,  // 2026-01-28 10:00:00 UTC
  // ...
}
```

---

### Properties

#### 1. **Approximate**
Clocks drift, NTP sync lags, distributed systems have skew.

**Do NOT assume:**
- Timestamp defines order
- Timestamp is exact
- Timestamps across systems are synchronized

**Use timestamp for:**
- Human readability ("committed on Jan 28, 2026")
- Correlation with external systems (logs, alerts)
- Debugging (approximate timing)

---

#### 2. **Non-Authoritative**
Timestamps do **not** define causal order.

**Example:**
```javascript
// Commit order (authoritative)
commits = [
  { commitIndex: 0, ts: 1000 },
  { commitIndex: 1, ts: 999 }  // Clock went backward!
];

// Trust commitIndex, not ts
const order = commits.sort((a, b) => a.commitIndex - b.commitIndex);
```

---

#### 3. **Tamper-Resistant (But Not Proof)**
Timestamps are included in commit hash, so tampering breaks hash chain.

**But:**
- Attacker with server access can create commits with fake timestamps
- Defense: Cryptographic signatures + external audit logs

---

#### 4. **Useful for Gaps**
Timestamps reveal **how much clock time** elapsed between commits.

**Example:**
```javascript
commits = [
  { commitIndex: 0, ts: 1000 },
  { commitIndex: 1, ts: 1100 }  // 100ms gap
];

// Time-weighted view uses gaps to space commits
```

---

## Playback Time (Navigation)

### Definition

**Playback Time** = User-controlled virtual time for navigating history.

**UI Controls:**
- Play (auto-advance through commits)
- Pause (freeze at commit N)
- Step forward/backward (move +1/-1 commit)
- Rewind (jump to commit 0)
- Live tail (follow latest commit)
- Speed control (1x, 2x, 10x)

---

### Properties

#### 1. **Virtual**
Playback time is not real time.

**Example:**
- User can watch 1000 commits in 10 seconds (100x speed)
- User can pause and inspect a single commit for hours

---

#### 2. **Non-Destructive**
Navigating history does **not** mutate truth.

**User actions:**
- Rewind to commit 50 → Does not delete commits 51-100
- Pause at commit 75 → Does not freeze the system
- Play at 10x speed → Does not change commit timestamps

---

#### 3. **Lens-Dependent**
Different users can be at different playback times.

**Example:**
- Alice at commit 100 (present)
- Bob at commit 50 (auditing past)
- Carol at commit 75 (investigating issue)

**Each sees a different projection of truth** (same filament, different lens).

---

## Late-Arriving Evidence

### Problem

**Scenario:** Evidence for commit N arrives **after** commit N+1 already exists.

**Example:**
```
Commit 50: CODE_COMMIT (typecheck pending)
Commit 51: CODE_COMMIT (new commit)
  ↓ (later)
Evidence for commit 50 arrives: "typecheck FAILED"
```

**Traditional systems:**
- Rewrite history (dangerous)
- Ignore late evidence (loses truth)
- Panic (inconsistent state)

---

### Relay's Solution: **Append, Don't Rewrite**

**Late evidence is appended as a new commit**, referencing the original.

**Example:**
```javascript
// Original commit (no evidence yet)
{
  commitIndex: 50,
  ts: 1000,
  op: 'CODE_COMMIT',
  evidence: null  // Pending
}

// Late evidence arrives → new commit
{
  commitIndex: 52,
  ts: 2000,
  op: 'EVIDENCE_ATTACHED',
  refs: {
    inputs: [{ filamentId: 'code-module', commitIndex: 50 }]
  },
  payload: {
    evidenceType: 'typecheck',
    status: 'FAIL',
    errors: ['...']
  }
}
```

**Rendering:**
- Commit 50 initially shows "pending evidence"
- After commit 52, topology ray appears: 52 → 50
- Commit 50 now displays "typecheck FAILED (attached later)"

**Key invariant:**
> Late evidence does not rewrite history. It appends a new commit with topology reference.

---

## Distributed Time

### Problem

**Scenario:** Multiple nodes creating commits on the same filament.

**Challenge:** How to order commits across nodes with unsynchronized clocks?

**Traditional approaches:**
1. **Timestamp ordering** (fails due to clock skew)
2. **Vector clocks** (complex, not human-readable)
3. **Consensus** (expensive, slow)

---

### Relay's Solution: **Git-Style Merge**

**Commits are local until merged.**

**Example:**
```
Node A:  [0]--[1]--[2A]
                   ↓
Node B:  [0]--[1]--[2B]
                   ↓
Merge:   [0]--[1]--[2A]--[2B]--[3: MERGE(2A, 2B)]
```

**Rules:**
1. Commits created locally (fast, no coordination)
2. Merge required to combine branches (explicit, auditable)
3. Merge commit references both parents (topology)

**Result:** **Causal order is explicit** (not inferred from timestamps).

---

## Temporal Attacks

### Attack 1: Backdating Commits

**Attack:** Create commit with old timestamp to make it appear it happened earlier.

**Example:**
```javascript
// Attacker creates commit with fake timestamp
{
  commitIndex: 100,
  ts: 1000,  // Fake: claims to be from past
  op: 'ASSIGNMENT_CREATED',
  payload: { ... }
}
```

**Defense:**
1. **Commit index is authoritative** (timestamp is ignored for ordering)
2. **Server assigns timestamps** (client cannot spoof)
3. **Hash chain includes timestamp** (tampering breaks hash)

**Result:** Backdating is detectable.

---

### Attack 2: Replay Old Commits

**Attack:** Re-apply old commit to create false state.

**Example:**
```javascript
// Attacker replays old approval commit
const oldApproval = filament.commits[10];  // From 2025
appendCommit(filament, oldApproval);        // Replay in 2026!
```

**Defense:**
1. **Commits include nonce** (unique, unpredictable value)
2. **Server rejects duplicate nonces**
3. **Parent hash chain prevents insertion**

**Result:** Replay is rejected.

---

### Attack 3: Clock Manipulation

**Attack:** Set system clock backward to make commits appear older.

**Example:**
```javascript
// Attacker sets clock to 2020
Date.now() → 1577836800000  // Jan 1, 2020

// Create commit
{
  commitIndex: 100,
  ts: 1577836800000,  // Fake old timestamp
  // ...
}
```

**Defense:**
1. **Server assigns timestamps** (not client)
2. **Monotonicity check** (ts must be >= previous commit's ts)
3. **Commit index is authoritative** (timestamp is context only)

**Result:** Clock manipulation is detectable.

---

## Rendering Time

### Event-Normalized View

**Commits equally spaced along X-axis** (ignore clock gaps).

**Use:** Audit, causality, governance

**Visualization:**
```
|--[0]--[1]--[2]--[3]--[4]-->
   ↑    ↑    ↑    ↑    ↑
  Equal spacing (event-based)
```

---

### Time-Weighted View

**Commits spaced by clock time gaps** (show real elapsed time).

**Use:** Operational context, performance analysis

**Visualization:**
```
|--[0]--[1]-----[2][3]----------[4]-->
   ↑    ↑       ↑  ↑            ↑
  Short gap    Burst         Long gap
```

**Key:**
- Short gap = commits close in time
- Long gap = significant delay
- Burst = many commits in short window

---

### Hybrid View

**Event-normalized with time annotations.**

**Visualization:**
```
|--[0]--[1]--[2]--[3]--[4]-->
   1s   100ms  5s   2s
   ↑     ↑     ↑    ↑
  Gaps shown as labels
```

---

## Real-World Examples

### Example 1: Out-of-Order Clocks

**Scenario:** Two commits created on different servers with clock skew.

**Commits:**
```javascript
Server A: { commitIndex: 10, ts: 1000, ... }
Server B: { commitIndex: 11, ts: 999, ... }  // Clock behind
```

**Relay behavior:**
- Commit order: 10 → 11 (authoritative)
- Timeline: Shows commits in commit order (not timestamp order)
- Annotation: "Clock skew detected" (shown in UI)

**Result:** Causal order preserved despite clock skew.

---

### Example 2: Late Typecheck Results

**Scenario:** Code committed, typecheck runs asynchronously, results arrive late.

**Timeline:**
```
t=0:   Commit 50: CODE_COMMIT (typecheck pending)
t=1:   Commit 51: CODE_COMMIT (new commit)
t=5:   Typecheck completes (FAIL)
```

**Relay approach:**
```javascript
// t=5: Append evidence commit
{
  commitIndex: 52,
  ts: 5000,
  op: 'EVIDENCE_ATTACHED',
  refs: { inputs: [{ filamentId: 'code', commitIndex: 50 }] },
  payload: { evidenceType: 'typecheck', status: 'FAIL' }
}
```

**Rendering:**
- Commit 50: Shows "typecheck FAILED (attached at commit 52)"
- Topology ray: 52 → 50
- Timeline: Commit order preserved (50, 51, 52)

---

### Example 3: Distributed Merge

**Scenario:** Two developers commit to same filament simultaneously.

**Timeline:**
```
Alice: [0]--[1]--[2A: Feature A]
                 ↓
Bob:   [0]--[1]--[2B: Feature B]
```

**Merge:**
```javascript
// Merge commit references both parents
{
  commitIndex: 3,
  ts: 3000,
  op: 'MERGE',
  refs: {
    inputs: [
      { filamentId: 'code', commitIndex: 2, branch: 'alice' },
      { filamentId: 'code', commitIndex: 2, branch: 'bob' }
    ]
  }
}
```

**Result:** Causal order explicit (not inferred from timestamps).

---

## FAQ

### General

**Q: Why not just use timestamps for ordering?**  
A: Clocks are unreliable (drift, skew, tampering). Commit index is authoritative.

**Q: What if I need to know "when" something happened?**  
A: Use timestamps for context (human-readable "when"), but trust commit index for causality.

**Q: Can commits be created "out of order"?**  
A: No. Within a branch, commits are strictly monotonic. Across branches, explicit merge is required.

---

### Technical

**Q: How do you handle clock drift?**  
A: Server assigns timestamps (client cannot spoof). Monotonicity check (ts >= previous ts). But commit index is authoritative.

**Q: What if evidence arrives late?**  
A: Append new commit with topology reference. Never rewrite history.

**Q: Can I query by timestamp?**  
A: Yes, but understand it's approximate. Use for "commits around Jan 28" but trust commit index for exact order.

---

### Governance

**Q: Can someone backdate commits?**  
A: Server assigns timestamps. Client cannot spoof. Hash chain includes timestamp (tampering detectable).

**Q: What if I need to prove "this commit happened before that one"?**  
A: Use commit index (authoritative). Timestamp is supplementary context.

---

## Conclusion

Time in Relay is **causal ordering, not clock truth**.

**Three layers:**
1. **Event Time (X-axis)** → Truth (commit index)
2. **Clock Time (ts)** → Context (approximate "when")
3. **Playback Time (UI)** → Lens (navigation)

**Core principles:**
- ✅ Commit index is authoritative
- ✅ Timestamps provide context (not truth)
- ✅ Late evidence appends (never rewrites)
- ✅ Distributed commits merge explicitly
- ✅ Replay is deterministic

**The One-Sentence Lock:**

> **"In Relay, event order is physics—wall-clock is context, playback is lens, and late-arriving truth appends rather than rewrites, preserving causality across distributed time."**

---

**See Also:**
- [Failure as Filament Spec](FAILURE-AS-FILAMENT-SPEC.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Cybersecurity Model](CYBERSECURITY-MODEL-SPEC.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
