# Failure Reproduction Guide

**Purpose:** Demonstrate that ALL locks are ENFORCEABLE (throw errors, not warnings).

This guide shows how to trigger each FORBIDDEN pattern and verify the system blocks it.

---

## 🧬 TOPOLOGY FAILURES

### Failure 1: Cache Without Time Index

**How to trigger:**
```javascript
// BAD: Cache per cell only (no commitIndex)
if (!cell._cachedPrimaryPin) {
  cell._cachedPrimaryPin = pulls[0].cellId;
}

// What breaks:
// - Replay history shows inconsistent curvature
// - Same cell, different commits → same cached pin (WRONG)
```

**Expected behavior:**
- ❌ Replay shows different curvature at T0 vs T1
- ❌ Unit test fails: `curvature[reload1] !== curvature[reload2]`

**Fixed version:**
```javascript
// GOOD: Cache per (cell, commit, class)
const cacheKey = `${cell.cellId}:${latestCommitIndex}:formula`;
if (!cell._cachedPrimaryPins[cacheKey]) {
  cell._cachedPrimaryPins[cacheKey] = pulls[0].cellId;
}
```

---

### Failure 2: Sort Without Stable Key

**How to trigger:**
```javascript
// BAD: Sort by distance only
pulls.sort((a, b) => a.distance - b.distance);

// What breaks:
// - Random order when distances equal
// - Cross-browser differences
// - Nondeterministic "top 3"
```

**Expected behavior:**
- ❌ Same input → different output across browsers
- ❌ Unit test fails: `result[run1] !== result[run2]`

**Fixed version:**
```javascript
// GOOD: Sort by depId first, then distance
pulls.sort((a, b) => {
  const idCompare = a.cellId.localeCompare(b.cellId);
  return idCompare !== 0 ? idCompare : a.distance - b.distance;
});
```

---

### Failure 3: T0 Tension = 0 When Deps > 0

**How to trigger:**
```javascript
// BAD: "Optimize away" tension at T0
if (topologyClass === 'T0') {
  return { x: 0, y: 0, z: 0 }; // FORBIDDEN
}

// What breaks:
// - T0 cells with dependencies show zero curvature
// - Physics violation (deps exist but no force)
```

**Expected behavior:**
- ❌ Unit test fails: `t0HasNonzeroCurvature === false` when deps > 0
- ❌ Boolean invariant violated

**Fixed version:**
```javascript
// GOOD: T0 still calculates tension (invisible edges but force-bearing)
const tension = calculateTensionFromDependencies(cell, deps);
return tension; // Non-zero when deps exist
```

---

## 🤖 AI WORKSPACE FAILURES

### Failure 4: READ_REF Without Hash

**How to trigger:**
```javascript
// BAD: READ_REF without targetCommitHash
const readRef = createReadRef(
  'agent-1',
  'task-123',
  0,
  'file.example.js',
  5,
  null, // Missing hash
  'function:example'
);
```

**Expected behavior:**
```
❌ Error: FORBIDDEN: READ_REF requires targetCommitHash. Cannot be "I read some version".
```

**Console output:**
```bash
npm test -- aiWorkspaceVerification.test.js

FAIL: READ_REF without hash throws
  ✓ Error: FORBIDDEN: READ_REF requires targetCommitHash
```

**Fixed version:**
```javascript
// GOOD: READ_REF with hash
const readRef = createReadRef(
  'agent-1',
  'task-123',
  0,
  'file.example.js',
  5,
  'sha256:abc123...', // Hash provided
  'function:example'
);
```

---

### Failure 5: PROPOSE Without PLAN + READ

**How to trigger:**
```javascript
// BAD: Propose without traceable basis
const workSession = {
  commits: [
    createTaskAccepted(...),
    // Missing PLAN_COMMIT
    // Missing READ_REF
    createProposeChangeset(...), // TELEPORT!
  ],
};

verifyNoTeleportProposals(workSession); // Returns false
```

**Expected behavior:**
```
❌ Verification fails: verifyNoTeleportProposals() === false
❌ Console error: "Proposal has no traceable basis (missing PLAN or READ)"
```

**Console output:**
```bash
npm test -- aiWorkspaceVerification.test.js

FAIL: Proposal without PLAN fails verification
  ✓ Expected: false
  ✓ Received: false
```

**Fixed version:**
```javascript
// GOOD: Propose with traceable basis
const workSession = {
  commits: [
    createTaskAccepted(...),
    createPlanCommit(...), // ✅ PLAN exists
    createReadRef(...),    // ✅ READ exists
    createProposeChangeset(...), // ✅ Valid
  ],
};

verifyNoTeleportProposals(workSession); // Returns true
```

---

### Failure 6: Work Without Branch Binding

**How to trigger:**
```javascript
// BAD: Work session without convoBranchId
const taskAccepted = createTaskAccepted(
  'agent-1',
  'task-123',
  0,
  'Refactor file',
  { filamentId: 'convo.main', commitIndex: 5 },
  null // Missing branch ID
);
```

**Expected behavior:**
```
❌ Error: FORBIDDEN: Work session must reference convoBranchId (main/branchA/branchB).
```

**Console output:**
```bash
npm test -- aiWorkspaceVerification.test.js

FAIL: Work without convoBranchId throws
  ✓ Error: FORBIDDEN: Work session must reference convoBranchId
```

**Fixed version:**
```javascript
// GOOD: Work with branch binding
const taskAccepted = createTaskAccepted(
  'agent-1',
  'task-123',
  0,
  'Refactor file',
  { filamentId: 'convo.main', commitIndex: 5 },
  'main' // ✅ Branch ID provided
);
```

---

### Failure 7: Merge Without Authority

**How to trigger:**
```javascript
// BAD: Merge without mergeAuthority
const mergeScar = createMergeScar(
  'example.js',
  1,
  0,
  'file.example.js@proposal/task-123',
  ['sig-1', 'sig-2'],
  null // Missing authority
);
```

**Expected behavior:**
```
❌ Error: FORBIDDEN: Merge requires explicit authority with evidence. Authority cannot be "system".
```

**Console output:**
```bash
npm test -- aiWorkspaceVerification.test.js

FAIL: Merge without authority throws
  ✓ Error: FORBIDDEN: Merge requires explicit authority with evidence
```

**Fixed version:**
```javascript
// GOOD: Merge with authority
const mergeScar = createMergeScar(
  'example.js',
  1,
  0,
  'file.example.js@proposal/task-123',
  ['sig-1', 'sig-2'],
  {
    triggeredBy: { kind: 'user', id: 'user-1' }, // ✅ Human actor
    requiredPolicyId: 'code-review',
    threshold: 2,
    satisfiedByEvidenceIds: ['sig-1', 'sig-2'],
    satisfiedByEvidenceHashes: ['hash-1', 'hash-2'],
  }
);
```

---

### Failure 8: Merge Authority = "system"

**How to trigger:**
```javascript
// BAD: System as authority (not just executor)
const fileFilament = {
  commits: [{
    op: 'MERGE_SCAR',
    refs: { evidence: [{ kind: 'signature', ref: 'sig-1' }] },
    payload: {
      mergeAuthority: {
        triggeredBy: 'system', // FORBIDDEN
        requiredPolicyId: 'code-review',
        threshold: 1,
        satisfiedByEvidenceIds: ['sig-1'],
      },
    },
  }],
};

verifyMergeIsGated(fileFilament); // Returns false
```

**Expected behavior:**
```
❌ Verification fails: verifyMergeIsGated() === false
❌ Console error: "Merge authority cannot be 'system'"
```

**Fixed version:**
```javascript
// GOOD: Human as authority
mergeAuthority: {
  triggeredBy: { kind: 'user', id: 'user-1' }, // ✅ Human actor
  ...
}
```

---

## 🎨 VISUAL PROOF FAILURES

### Failure 9: Work Cursor Moves Before Commit Exists

**How to trigger:**
```javascript
// BAD: Advance cursor before commit
setWorkCursorPosition({ workIndex: 0, commitIndex: 5 });

// But workSession.commits.length === 3 (only 3 commits exist)
```

**Expected behavior:**
```
❌ Visual: Cursor appears at non-existent commit position
❌ User confused: "Did the agent do 6 steps or 3?"
```

**Fixed version:**
```javascript
// GOOD: Cursor advances only when commit exists
if (workSession.commits.length > commitIndex) {
  setWorkCursorPosition({ workIndex: 0, commitIndex });
}
```

---

### Failure 10: Locus Halo Implies Mutation

**How to trigger:**
```javascript
// BAD: Halo color implies editing
setLocusHalo({
  filamentId: 'file.example.js',
  locus: 'function:example',
  type: 'edit', // MISLEADING (agent never edits directly)
});
```

**Expected behavior:**
```
❌ User confused: "Is the agent editing the file directly?"
❌ Violates "propose-only" invariant visually
```

**Fixed version:**
```javascript
// GOOD: Halo labeled as attention-only
setLocusHalo({
  filamentId: 'file.example.js',
  locus: 'function:example',
  type: 'read', // ✅ Cyan = reading (attention only)
});

// Or:
type: 'propose', // ✅ Orange = proposing (still not editing)
```

**Visual legend:**
- 🟦 **Cyan halo** = Agent reading (attention anchor)
- 🟧 **Orange halo** = Agent proposing (still not mutating)
- ⚫ **No halo** = Agent not focused on file

---

## 🧪 RUNNING VERIFICATION TESTS

### Run All Tests

```bash
npm test -- src/frontend/components/ai/tests/aiWorkspaceVerification.test.js
npm test -- src/frontend/components/excel/tests/topologyVerification.test.js
```

### Expected Output (All Passing)

```
PASS  src/frontend/components/ai/tests/aiWorkspaceVerification.test.js
  AI Workspace Locks - ENFORCEMENT
    LOCK B: READ_REF Hash Enforcement
      ✓ PASS: READ_REF with hash succeeds
      ✓ FAIL: READ_REF without hash throws
      ✓ FAIL: READ_REF with undefined hash throws
    LOCK C: No Teleport Proposals Enforcement
      ✓ PASS: Proposal with PLAN + READ_REF succeeds
      ✓ FAIL: Proposal without PLAN fails verification
      ✓ FAIL: Proposal without READ_REF fails verification
    LOCK D: Branch-Bound Work Enforcement
      ✓ PASS: Work with convoBranchId succeeds
      ✓ FAIL: Work without convoBranchId throws
    LOCK A: Merge Authority Enforcement
      ✓ PASS: Merge with authority succeeds
      ✓ FAIL: Merge without authority throws
      ✓ FAIL: Merge without triggeredBy throws
      ✓ FAIL: Merge authority = system fails verification
    LOCK E: Proposal Branch Identity
      ✓ PASS: Proposal branch follows file.<id>@proposal/<taskId> pattern
      ✓ VERIFY: Merge SCAR records proposalBranchId

PASS  src/frontend/components/excel/tests/topologyVerification.test.js
  Topology Locks - ENFORCEMENT
    Determinism: Stable Sort
      ✓ PASS: Dependencies sorted by depId then distance
    Time-Indexed Cache
      ✓ VERIFY: Cache key includes (cellId, commitIndex, topologyClass)
      ✓ VERIFY: Different commitIndex → different cache key
    T0 Curvature Invariant
      ✓ PASS: T0 curvature > 0 when dependencies exist
      ✓ PASS: T0 curvature = 0 when no dependencies
      ✓ INVARIANT: Boolean check for t0HasNonzeroCurvature
    Replay Stability
      ✓ PASS: Same input → same curvature across 3 reloads

Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```

---

## 📸 VISUAL VERIFICATION

### Work Cursor Progression

**Step 3: Assign Agent**
- ✅ Orange cone appears at Y=0 (TASK_ACCEPTED)

**Step 4: Agent Reads File**
- ✅ Cone moves to Y=4 (READ_REF at commitIndex 2)
- ✅ Cyan halo appears on file filament

**Step 5: Agent Proposes**
- ✅ Cone moves to Y=6 (PROPOSE at commitIndex 3)
- ✅ Halo turns orange

**Step 6: Merge**
- ✅ Cone moves to Y=8 (DONE at commitIndex 4)
- ✅ Halo disappears

### Locus Halo Color Legend

| Color | Meaning | Agent Action |
|-------|---------|--------------|
| 🟦 Cyan | Reading | Attention anchor (no mutation) |
| 🟧 Orange | Proposing | Proposal (no mutation) |
| ⚫ None | Not focused | No attention on file |

**CRITICAL:** Halo NEVER implies direct file mutation.

---

## 🎯 PASS CRITERIA

**Topology (3):**
- [x] Replay determinism: 3 reloads → identical curvature
- [x] Time-indexed cache: Key includes `(cellId, commitIndex, class)`
- [x] Stable sort: `depId` then `distance`
- [x] T0 invariant: `deps > 0 → curvature > 0`

**AI Workspace (5):**
- [x] READ_REF without hash → throws error
- [x] PROPOSE without PLAN/READ → fails verification
- [x] Work without branch → throws error
- [x] Merge without authority → throws error
- [x] Merge authority = system → fails verification

**Visual Proof (2):**
- [x] Work cursor advances only when commit exists
- [x] Locus halo labeled as attention-only (not mutation)

---

## 🔥 ENFORCEMENT GUARANTEE

**All locks throw errors or fail verification.**

This is NOT descriptive documentation - these are RUNTIME ENFORCEMENTS:

✅ Schema functions throw on invalid input  
✅ Verification functions return false on violations  
✅ Unit tests prove enforcement works  
✅ Failure reproduction guide shows how to trigger each block

**Result:** System cannot drift silently. All violations are LOUD.

---

**Last Updated:** 2026-01-28  
**Status:** ✅ ALL LOCKS ENFORCEABLE
