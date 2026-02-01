# PHASE 2: REALITY LEG MIGRATION

**Status**: 🚧 **IN PROGRESS**  
**Goal**: Migrate from mutable Map to append-only EventLog  
**Priority**: **CRITICAL** (Production gate)

---

## 🎯 OBJECTIVE

Transform `ObservedReality` (mutable snapshot) → `VerifiedReality` (append-only replay)

**Current state**:
```javascript
authoritativeVoteLedger.set(userId, voteData)  // ❌ Mutable Map
```

**Target state**:
```javascript
await voteEventLog.append(event)  // ✅ Append-only
const currentVote = await voteEventLog.query({ userId, topicId })
```

---

## 📋 MIGRATION CHECKLIST

### Step 1: Create VoteEventLog Instance
- [x] EventLog class exists (`src/backend/verification/eventLog.mjs`)
- [ ] Create `voteEventLog` instance in votingEngine.mjs
- [ ] Initialize on module load

### Step 2: Dual-Write Pattern (Safety)
- [ ] Write to BOTH Map and EventLog during transition
- [ ] Verify consistency between Map and EventLog
- [ ] Monitor for divergence

### Step 3: Replace Write Operations
- [ ] Replace `authoritativeVoteLedger.set()` with `voteEventLog.append()`
- [ ] Update `processVote()` function
- [ ] Update vote switching logic
- [ ] Update idempotent vote handling

### Step 4: Replace Read Operations
- [ ] Replace `authoritativeVoteLedger.get()` with `voteEventLog.query()`
- [ ] Update `getUserVote()` function
- [ ] Update `getUsersWithVotesForTopic()` function
- [ ] Update `getUsersWithVotesForCandidate()` function

### Step 5: Derive Totals from Events
- [ ] Create read-model builder for vote totals
- [ ] Replay events to compute current state
- [ ] Remove direct Map manipulation
- [ ] Verify totals match

### Step 6: Update Reality Leg
- [ ] Change `immutable: false` → `immutable: true`
- [ ] Change `authoritative: false` → `authoritative: true`
- [ ] Change `replayable: false` → `replayable: true`
- [ ] Rename `ObservedReality` → `VerifiedReality`

### Step 7: Testing
- [ ] Unit tests for event append
- [ ] Unit tests for event replay
- [ ] Integration test for vote flow
- [ ] Test vote switching with events
- [ ] Test consistency verification
- [ ] Load test with EventLog

### Step 8: Deprecate Old Storage
- [ ] Remove Map-based storage
- [ ] Clean up legacy code
- [ ] Update documentation

---

## 🚀 IMPLEMENTATION PLAN

### Phase 2A: Dual-Write (Week 1)
**Estimate**: 4 hours

1. Create VoteEventLog instance
2. Write to BOTH Map and EventLog
3. Add consistency checks
4. Monitor for issues

**Safety**: Zero risk (both systems running)

---

### Phase 2B: Read Migration (Week 1)
**Estimate**: 4 hours

1. Update all read paths to query EventLog
2. Keep Map as fallback
3. Verify query results match
4. Performance testing

**Safety**: Low risk (fallback to Map if EventLog fails)

---

### Phase 2C: Remove Map (Week 2)
**Estimate**: 2 hours

1. Remove Map writes
2. Remove Map reads
3. EventLog becomes authoritative
4. Update reality leg metadata

**Safety**: Medium risk (no fallback)

---

### Phase 2D: Testing & Validation (Week 2)
**Estimate**: 12 hours

1. Unit tests (event append, replay, query)
2. Integration tests (full vote flow)
3. Consistency tests (totals derived correctly)
4. Performance tests (latency, throughput)
5. Failure mode tests (recovery, replay)

---

## 📊 SUCCESS CRITERIA

### Reality Leg Metrics (After Phase 2):

| Metric | Phase 1 | Phase 2 Target |
|--------|---------|----------------|
| Immutable | ❌ false | ✅ true |
| Authoritative | ❌ false | ✅ true |
| Replayable | ❌ false | ✅ true |
| Confidence | 0.7 | 0.95+ |
| Production Ready | ❌ NO | ✅ YES |

### Functional Requirements:

- ✅ All votes appended to EventLog
- ✅ Current state derived from replay
- ✅ No direct Map mutation
- ✅ Audit trail complete
- ✅ Recovery from events possible
- ✅ Performance acceptable (<100ms overhead)

---

## 🎬 STARTING NOW

Beginning implementation...
