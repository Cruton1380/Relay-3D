# Deletion Phase Complete — Obsolete Infrastructure Removed

**Status**: ✅ All 3 phases complete, 57 files deleted (28,515 lines)  
**Safety**: ✅ Backup branch `pre-deletion-backup` created  
**Next**: Fix 43 broken imports across 16 files

---

## Summary of Deletions

### Phase 1: Blockchain/Hashgraph Truth Store
**Commit**: `014240c` — "chore: remove blockchain/hashgraph truth-store (replaced by git/envelopes)"

**Deleted**:
- `src/backend/blockchain-service/` (4 files)
  - `blockchainUserService.mjs`
  - `index.mjs`
  - `transactionQueue.mjs`
  - `voteTransaction.mjs`
- `src/backend/hashgraph/` (38 files)
  - Complete hashgraph consensus implementation
  - Federation, IPNS, libp2p integrations
  - Sybil replay detection
  - Fork detection system
  - Network transport layer
  - Production readiness tests

**Impact**: 42 files, 24,179 deletions

---

### Phase 2: Realtime Vote Aggregation Services
**Commit**: `97d3a37` — "chore: remove realtime vote aggregation services (truth now git+query hook)"

**Deleted**:
- `src/backend/vote-service/` (1 file)
  - In-memory vote cache and aggregation
- `src/backend/websocket-service/` (12 files)
  - `voteAdapter.mjs` — WebSocket vote push
  - `rankingAdapter.mjs` — Realtime ranking updates
  - `presenceAdapter.mjs`, `notificationAdapter.mjs`, etc.

**Impact**: 13 files, 3,730 deletions

---

### Phase 3: Centralized State Manager
**Commit**: `80331f5` — "chore: remove centralized state manager (truth now git commits)"

**Deleted**:
- `src/backend/state/` (2 files)
  - `state.mjs` — In-memory `voteCounts` and `userVotes` maps
  - `blockchain.mjs.bak`

**Impact**: 2 files, 606 deletions

---

## What Was Preserved (Correct Decisions)

✅ **Storage directory** — Kept (voter authentication / Sybil resistance, not vote storage)  
✅ **Biometrics** — Kept (identity verification layer, not truth layer)  
✅ **Channel service** — Kept (channel management, will be adapted to Git/Relay)  
✅ **Archive directory** — Kept (pre-filament documentation for reference)

---

## Broken Imports — Comprehensive Inventory

### 1. Blockchain Service Imports (11 references in 10 files)

| File | Import Statement | Replacement Strategy |
|------|------------------|---------------------|
| `src/backend/app.mjs` | `import blockchainService from './blockchain-service/index.mjs'` | Remove or repoint to Relay client |
| `src/backend/app.mjs` | `import blockchainUserService from './blockchain-service/blockchainUserService.mjs'` | Remove (user auth is separate) |
| `src/backend/server.mjs` | `import blockchain from './blockchain-service/index.mjs'` | Remove |
| `src/backend/voting/votingEngine.mjs` | `import { VoteTransaction } from '../blockchain-service/voteTransaction.mjs'` | Replace with `relay-client.put()` + envelope |
| `src/backend/routes/channels.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | Remove or use query hook |
| `src/backend/routes/blockchain.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | **DELETE ENTIRE FILE** (obsolete route) |
| `src/backend/services/globalCommissionService.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | Repoint to Git/Relay |
| `src/backend/services/microshardingManager.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | Repoint to Git/Relay |
| `src/backend/services/regionalElectionService.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | Repoint to Git/Relay |
| `src/backend/services/regionalMultiSigService.mjs` | `import blockchain from '../blockchain-service/index.mjs'` | Repoint to Git/Relay |
| `src/backend/onboarding/groupOnboardingService.mjs` | `import blockchainUserService from '../blockchain-service/blockchainUserService.mjs'` | Remove (separate concern) |

---

### 2. Hashgraph Imports (1 reference in 1 file)

| File | Import Statement | Replacement Strategy |
|------|------------------|---------------------|
| `src/backend/server.mjs` | `import { BlockchainAnchoringSystem } from './hashgraph/blockchainAnchoringSystem.mjs'` | Remove (obsolete) |

---

### 3. WebSocket Service Imports (10 references in 4 files)

| File | Import Statement | Replacement Strategy |
|------|------------------|---------------------|
| `src/backend/app.mjs` | `import websocketService from './websocket-service/index.mjs'` | Remove or replace with SSE/polling |
| `src/backend/server.mjs` | `import websocketService from './websocket-service/index.mjs'` | Remove |
| `src/backend/server.mjs` | `import presenceAdapter from './websocket-service/presenceAdapter.mjs'` | Remove (6 adapter imports) |
| `src/backend/voting/votingEngine.mjs` | `import websocketService from '../websocket-service/index.mjs'` | Remove vote push logic |
| `src/backend/api/healthApi.mjs` | `import websocketService from '../websocket-service/index.mjs'` | Remove health check dependency |

---

### 4. Vote Service Imports (7 references in 6 files)

| File | Import Statement | Replacement Strategy |
|------|------------------|---------------------|
| `src/backend/routes/vote.mjs` | `import voteService from '../vote-service/index.mjs'` | Replace with `.relay/query.mjs` calls |
| `src/backend/voting/votingEngine.mjs` | `const voteService = await import('../vote-service/index.mjs')` (2×) | Replace with Relay client PUT |
| `src/backend/routes/channels.mjs` | `import voteService from '../vote-service/index.mjs'` | Replace with query hook |
| `src/backend/routes/voteCounts.mjs` | `import { voteService } from '../vote-service/index.mjs'` | Replace with query hook |
| `src/backend/services/boundaryChannelService.mjs` | `import voteService from '../vote-service/index.mjs'` | Replace with query hook |
| `src/backend/routes/voteRoutes.mjs` | `import voteService from '../vote-service/index.mjs'` | Replace with query hook |

---

### 5. State Manager Imports (15 references in 8 files)

| File | Import Statement | Functions Used | Replacement Strategy |
|------|------------------|----------------|---------------------|
| `src/backend/routes/devCenter.mjs` | `import { blockchain, updateCandidateVoteCount, saveSessionVotes } from '../state/state.mjs'` | Vote count updates | Query hook + Relay PUT |
| `src/backend/routes/vote.mjs` | Multiple imports from `state.mjs` | `updateCandidateVoteCount`, `getCandidateVoteCount`, `blockchain`, `saveBlockchain` | Query hook for reads, Relay PUT for writes |
| `src/backend/voting/votingEngine.mjs` | Multiple imports from `state.mjs` | Vote counts, blockchain access | Query hook + Relay client |
| `src/backend/voting/voteVerifier.mjs` | `import { isNonceUsed, markNonceUsed } from '../state/state.mjs'` | Nonce tracking | Move to Git state or separate service |
| `src/backend/routes/channels.mjs` | `import { getChannelVoteCounts, getCandidateVoteCount } from '../state/state.mjs'` | Read vote counts | Query hook |
| `src/backend/routes/voteCounts.mjs` | Multiple imports from `state.mjs` | Vote count CRUD | Query hook |
| `src/backend/globe-geographic/globeService.mjs` | `const { getChannels } = await import('../state/state.mjs')` (2×) | Channel listing | Query hook |
| `src/backend/server-enhanced.mjs` | `const { blockchain } = await import('./state/state.mjs')` | Blockchain access | Remove |

---

## Replacement Patterns (By Use Case)

### Use Case 1: Write Vote (commit transaction)
**Before**:
```javascript
import { VoteTransaction } from '../blockchain-service/voteTransaction.mjs';
const tx = new VoteTransaction(userId, candidateId, value);
await blockchain.addTransaction(tx);
```

**After**:
```javascript
import relayClient from '../relay-client/index.mjs';
import { buildCellEditEnvelope } from '../relay-client/envelope-builder.mjs';

const envelope = buildCellEditEnvelope({
  domain_id: 'voting.channel',
  repo_id: 'coffee-shop__seattle',
  branch_id: 'bean-there__main',
  row_key: candidateId,
  col_id: 'votes_total',
  before: oldValue,
  after: newValue,
  actor: { actor_id: userId, actor_kind: 'human' }
});

await relayClient.put(`/repo/${repoId}`, {
  '.relay/envelope.json': JSON.stringify(envelope),
  'state/candidates/${candidateId}.yaml': newCandidateState
});
```

---

### Use Case 2: Read Vote Counts (query derived state)
**Before**:
```javascript
import { getCandidateVoteCount } from '../state/state.mjs';
const count = getCandidateVoteCount(candidateId);
```

**After**:
```javascript
import relayClient from '../relay-client/index.mjs';

const result = await relayClient.query(`/repo/${repoId}`, {
  query: 'rankings',
  branch: branchId,
  step: 'latest'
});

const count = result.candidates.find(c => c.id === candidateId).votes_total;
```

---

### Use Case 3: WebSocket Vote Push (realtime updates)
**Before**:
```javascript
import websocketService from '../websocket-service/index.mjs';
websocketService.broadcast('vote', { candidateId, newCount });
```

**After** (v1 — polling):
```javascript
// Client polls .relay/query endpoint every N seconds
// OR: Relay server implements SSE/WebSocket for commit stream
```

---

## Critical Implementation Tasks (Priority Order)

### 1. Implement `.relay/query.mjs` Hook (BLOCKING)
**Purpose**: Replace all `getCandidateVoteCount()`, `getChannelVoteCounts()` calls

**Endpoints required**:
- `/rankings?scope=repo|branch&step=S`
- `/candidate_history?candidate_id=...`
- `/metrics?candidate_id=...`

**Implementation**: Read all commit envelopes, aggregate `cells_touched` for vote columns, return derived counts.

---

### 2. Replace `votingEngine.mjs` Write Logic
**Purpose**: Replace `VoteTransaction` with Relay client PUT

**Steps**:
1. Identify all `blockchain.addTransaction()` calls
2. Replace with `relayClient.put()` + `buildCellEditEnvelope()`
3. Ensure step counter increments correctly

---

### 3. Update All Route Handlers
**Files**:
- `routes/vote.mjs`
- `routes/channels.mjs`
- `routes/voteCounts.mjs`
- `routes/voteRoutes.mjs`

**Pattern**: Replace state imports with query hook calls.

---

### 4. Remove Obsolete Routes
**Delete entirely**:
- `routes/blockchain.mjs` — No longer relevant

---

### 5. Nonce Tracking Migration
**Current**: `state.mjs` tracks `seenNonces` in memory  
**Solution**: Move to `.relay/state/nonces.json` (Git-backed) OR separate Redis/DB service

---

## Step Counter Implementation ✅ COMPLETE

**Status**: Already implemented with branch-safe scoping

**Key files**:
- `.relay/pre-commit.mjs` — `getNextStep()` and `incrementStepCounter()`
- `.relay/state/step-counters.json` — Persistent storage

**Scope keying**:
```javascript
const scopeKey = `${scope.scope_type}:${scope.repo_id}:${scope.branch_id}:${scope.bundle_id ?? 'null'}`;
```

**Enforcement**: Pre-commit hook validates `scope_step === expectedNextStep`

---

## Next Immediate Actions

1. **Implement `.relay/query.mjs`** — Start with simple vote count aggregation
2. **Fix one vertical slice** — Pick `routes/voteCounts.mjs`, make it query-hook-based, test end-to-end
3. **Ripple out** — Fix remaining route files one by one
4. **Test with Prompt domain** — Prove the vertical slice works before tackling voting complexity

---

## Performance Notes

**Deleted**: 28,515 lines of blockchain/hashgraph/state management  
**Remaining work**: ~43 import fixes across 16 files  
**Estimated refactor time**: 2-4 hours (with query hook implemented first)

---

## Rollback Strategy (If Needed)

```bash
# If something breaks badly:
git checkout pre-deletion-backup

# If only specific phase needs rollback:
git revert 80331f5  # Revert Phase 3
git revert 97d3a37  # Revert Phase 2
git revert 014240c  # Revert Phase 1
```

---

## Commit History (Audit Trail)

```
45db1d1 feat: implement branch-safe step counter with scope-keyed monotonicity enforcement
014240c chore: remove blockchain/hashgraph truth-store (replaced by git/envelopes)
97d3a37 chore: remove realtime vote aggregation services (truth now git+query hook)
80331f5 chore: remove centralized state manager (truth now git commits)
```

**Branches**:
- `master` — Current (post-deletion)
- `pre-deletion-backup` — Safety checkpoint
- `pre-filament-migration-backup` — Earlier checkpoint

---

**Status**: System is now provably Git-native. Every broken import is a forcing function to replace aggregate-push with Git-commit + query-hook.

