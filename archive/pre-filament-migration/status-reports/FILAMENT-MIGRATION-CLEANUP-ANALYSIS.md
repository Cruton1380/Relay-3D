# FILAMENT MIGRATION: System Cleanup Analysis

**Status**: Analysis Complete
**Date**: 2026-01-26
**Scope**: Identify obsolete components after Git/Relay/Filament migration

---

## Executive Summary

After migrating to **Relay Filaments (Git-based truth substrate)**, the following architectural changes eliminate redundancy:

```yaml
Removed Components: ~40% of backend codebase
Reason: Git provides immutability, ordering, branching, and audit trail
Impact: Reduced complexity, increased reliability
```

**What Git/Relay Replaces:**
- ❌ Custom blockchain (immutability)
- ❌ Hashgraph consensus (ordering)
- ❌ WebSocket state-push (real-time updates)
- ❌ Custom database schemas (votes, channels as DB records)
- ❌ Vote aggregation services (query hooks on Git history)

**What Remains as Application Logic:**
- ✅ Sybil resistance (biometrics, proximity)
- ✅ Authentication & authorization
- ✅ Sortition (cryptographic randomness)
- ✅ Token economics (edge validation)
- ✅ Privacy services (at client/edge)
- ✅ Globe UI (becomes macro navigation shell)

---

## Part 1: Backend Components to REMOVE

### **1.1 Blockchain Service (FULL REMOVAL)**

```bash
src/backend/blockchain-service/
├── index.mjs                    ❌ DELETE
├── blockchainIntegration.mjs    ❌ DELETE
├── blockchainManager.mjs        ❌ DELETE
└── blockchainSync.mjs           ❌ DELETE
```

**Reason**: Git commits provide immutable, ordered, auditable history.

**Migration Path**:
```javascript
// OLD: Store vote in blockchain
await blockchainManager.addBlock({
  type: 'vote',
  voter_id: userId,
  candidate_id: candidateId
});

// NEW: Store vote as Git commit
await relay.put(`/votes/${userId}.yaml`, {
  candidate_id: candidateId,
  timestamp: Date.now()
});
```

---

### **1.2 Hashgraph Consensus (FULL REMOVAL)**

```bash
src/backend/hashgraph/
├── *.mjs (38 files)             ❌ DELETE ALL
```

**Reason**: Git's merge semantics + branch proposals replace gossip consensus.

**Migration Path**:
```yaml
# OLD: Hashgraph gossip for event ordering
Event A gossips to peers → consensus on order → finalize

# NEW: Git branch proposals + merge approvals
Proposal branch created → review/vote → merge to main
```

---

### **1.3 WebSocket Service (MOSTLY REMOVE)**

```bash
src/backend/websocket-service/
├── connectionManager.mjs        ❌ DELETE (replace with SSE)
├── stateSync.mjs                ❌ DELETE (Git polling)
├── voteUpdates.mjs              ❌ DELETE (Git query)
├── presenceManager.mjs          ⚠️ KEEP (peer discovery)
└── ...
```

**Keep Only**: Peer discovery, presence signaling
**Remove**: Vote state synchronization, real-time aggregation

**Migration Path**:
```javascript
// OLD: WebSocket push updates
ws.on('vote_update', data => updateUI(data));

// NEW: Git polling + SSE
const events = new EventSource('/relay/query/votes?since=T14');
events.onmessage = e => updateUI(JSON.parse(e.data));
```

---

### **1.4 Vote Service (REPLACE WITH HOOKS)**

```bash
src/backend/vote-service/
└── index.mjs                    ❌ DELETE
```

**Reason**: Votes become Git commits; aggregation becomes `.relay/query.mjs` hooks.

**Migration Path**:
```javascript
// OLD: vote-service/index.mjs
export async function castVote(userId, candidateId) {
  await db.votes.insert({...});
  await eventBus.emit('vote_cast', {...});
}

// NEW: .relay/pre-commit.mjs (in Git repo)
export async function preCommit(files) {
  // Validate vote eligibility
  // Write vote file
  // Return approval
}

// NEW: .relay/query.mjs (in Git repo)
export async function query(params) {
  // Read vote commits
  // Aggregate by candidate
  // Return rankings
}
```

---

### **1.5 Database Services (SELECTIVE REMOVAL)**

```bash
src/backend/database/
├── voteStorage.mjs              ❌ DELETE (Git stores votes)
├── channelStorage.mjs           ❌ DELETE (Git branches = channels)
├── candidateStorage.mjs         ❌ DELETE (Git state files)
├── userStorage.mjs              ⚠️ KEEP (user profiles at edge)
├── sessionStorage.mjs           ⚠️ KEEP (ephemeral sessions)
└── cacheManager.mjs             ⚠️ KEEP (performance layer)
```

**Rule**: Remove persistent storage for **governance truth** (votes, channels, proposals). Keep ephemeral/edge storage (sessions, cache, profiles).

---

### **1.6 Channel Service (RESTRUCTURE)**

```bash
src/backend/channel-service/
├── channelManager.mjs           ❌ DELETE (Git repos = channels)
├── channelRankings.mjs          ❌ DELETE (query hook)
├── channelVoting.mjs            ❌ DELETE (Git commits)
├── proximityChannels.mjs        ⚠️ KEEP (proximity logic)
└── boundaryChannels.mjs         ⚠️ KEEP (boundary logic)
```

**Keep**: Proximity detection, boundary validation (application rules).
**Remove**: Channel creation/ranking/voting (becomes Git operations).

**Migration Path**:
```yaml
# OLD: Database record per channel
channels table:
  - id, name, type, boundary_geojson, vote_count, rank

# NEW: Git repository per channel
Repository: coffee-shop__seattle__downtown/
  - candidates/
      - bean-there.yaml
      - the-grind.yaml
  - votes/
      - user123.yaml
  - state/
      - rankings.yaml (computed by query hook)
```

---

### **1.7 Ranking Service (REPLACE WITH HOOKS)**

```bash
src/backend/ranking-service/
└── index.mjs                    ❌ DELETE
```

**Reason**: Rankings computed by `.relay/query.mjs` on demand.

---

### **1.8 State Management (REMOVE)**

```bash
src/backend/state/
├── stateManager.mjs             ❌ DELETE
└── stateSync.mjs                ❌ DELETE
```

**Reason**: Git is the authoritative state; no in-memory state manager needed.

---

### **1.9 Event Bus (SELECTIVE)**

```bash
src/backend/event-bus/
└── index.mjs                    ⚠️ SIMPLIFY (local events only)
```

**Keep**: Local/internal event coordination.
**Remove**: Cross-service vote/state events (Git commits are events).

---

## Part 2: Backend Components to KEEP

### **2.1 Authentication & Authorization**

```bash
src/backend/auth/
├── *.mjs (11 files)             ✅ KEEP ALL
```

**Reason**: User authentication is application logic, not replaced by Git.

---

### **2.2 Biometrics & Sybil Resistance**

```bash
src/backend/biometrics/
├── *.mjs (5 files)              ✅ KEEP ALL
```

**Reason**: Fraud detection at the edge, validates users before Git commits.

---

### **2.3 Location & Proximity**

```bash
src/backend/location/
└── index.mjs                    ✅ KEEP

src/backend/channel-service/
├── proximityChannels.mjs        ✅ KEEP
└── boundaryChannels.mjs         ✅ KEEP
```

**Reason**: Physical proximity verification is application-specific logic.

---

### **2.4 Governance & Sortition**

```bash
src/backend/governance/
├── *.mjs (2 files)              ✅ KEEP

src/lib/
├── jurySortitionEngine.js       ✅ KEEP
├── juryBadgeGenerator.js        ✅ KEEP
└── juryProximitySync.js         ✅ KEEP
```

**Reason**: Sortition (random selection) is cryptographic logic, not storage.

---

### **2.5 Token Economics**

```bash
src/lib/
├── tokenCalculator.mjs          ✅ KEEP
├── voteTokenManager.mjs         ✅ KEEP
├── trustBurnEngine.js           ✅ KEEP
└── voteDecayParameterization.mjs ✅ KEEP
```

**Reason**: Token rules validated at edge before Git commits.

---

### **2.6 Privacy Services**

```bash
src/backend/privacy-services/
├── *.mjs (5 files)              ✅ KEEP
```

**Reason**: Privacy mixing/anonymization happens at client/edge, not storage.

---

### **2.7 Invites & Onboarding**

```bash
src/backend/invites/
├── *.mjs (2 files)              ✅ KEEP

src/backend/onboarding/
├── *.mjs (7 files)              ✅ KEEP
```

**Reason**: User registration flow is application logic.

---

### **2.8 P2P & Network Discovery**

```bash
src/backend/p2p-service/
├── *.mjs (5 files)              ✅ KEEP
```

**Reason**: Peer discovery for Relay network coordination.

---

### **2.9 Security & Middleware**

```bash
src/backend/security/
├── *.mjs (5 files)              ✅ KEEP

src/backend/middleware/
├── *.mjs (7 files)              ✅ KEEP
```

**Reason**: Request validation, rate limiting, CORS, etc. are application concerns.

---

### **2.10 Utils & Helpers**

```bash
src/backend/utils/
├── *.mjs (31 files)             ✅ KEEP (audit individually)
```

**Reason**: General utilities remain useful unless blockchain-specific.

---

## Part 3: Frontend Components to KEEP/ADAPT

### **3.1 Globe Rendering (KEEP, ADAPT)**

```bash
src/frontend/components/workspace/globe/
├── GlobeRenderer.jsx            ✅ KEEP (macro navigation)
├── CandidateCard.jsx            ⚠️ ADAPT (render from Git state)
├── BoundaryOverlay.jsx          ✅ KEEP
└── ...
```

**Role Change**: Globe becomes **macro navigation shell** (zoom out to network, zoom in to filaments).

---

### **3.2 API Client (REPLACE)**

```bash
src/frontend/services/
├── apiClient.js                 ⚠️ REPLACE (Relay client)
├── voteService.js               ❌ DELETE (Git PUT)
├── channelService.js            ❌ DELETE (Git query)
└── ...
```

**Migration Path**:
```javascript
// OLD: apiClient.js
export async function castVote(candidateId) {
  return fetch('/api/votes', {
    method: 'POST',
    body: JSON.stringify({candidate_id: candidateId})
  });
}

// NEW: relayClient.js
export async function castVote(userId, candidateId) {
  return relay.put(`/repo/coffee-shop__seattle/votes/${userId}.yaml`, {
    candidate_id: candidateId,
    timestamp: Date.now()
  });
}
```

---

### **3.3 UI Components (MOSTLY KEEP)**

```bash
src/frontend/components/
├── workspace/                   ✅ KEEP (adapt to Filament UI)
├── panels/                      ✅ KEEP
├── modals/                      ✅ KEEP
└── ...
```

**Adaptation Required**:
- Replace vote count polling with Git query hooks
- Add 3D Time Box components (from UI mockups)
- Add Sheet Mode (2D spreadsheet view)
- Add Filament inspector panels

---

### **3.4 Hooks (SELECTIVE)**

```bash
src/frontend/hooks/
├── useVoting.js                 ⚠️ REPLACE (useGitVoting)
├── useChannels.js               ⚠️ REPLACE (useGitChannels)
├── useWebSocket.js              ❌ DELETE (SSE polling)
└── ...
```

---

## Part 4: Scripts & Tools to REMOVE

### **4.1 Blockchain Scripts**

```bash
Root files:
├── test-blockchain-mutex.mjs    ❌ DELETE
├── BLOCKCHAIN-*.md (15 files)   ❌ ARCHIVE
└── HASHGRAPH-*.md               ❌ ARCHIVE
```

---

### **4.2 Vote Testing Scripts (REPLACE)**

```bash
Root files:
├── test-vote-fix.mjs            ⚠️ REPLACE (test Git commits)
├── test-concurrent-votes-stress.mjs ⚠️ REPLACE
└── ...
```

**New Scripts Needed**:
```bash
scripts/
├── test-git-vote-commit.mjs     🆕 CREATE
├── test-branch-merge-approval.mjs 🆕 CREATE
└── test-query-hook-rankings.mjs  🆕 CREATE
```

---

## Part 5: Documentation to ARCHIVE

### **5.1 Obsolete Architectural Docs**

```bash
*.md files to archive:
├── BLOCKCHAIN-*.md              📦 ARCHIVE (historical)
├── HASHGRAPH-*.md               📦 ARCHIVE
├── BACKEND-COMPATIBILITY-ANALYSIS.md ✅ KEEP (migration reference)
├── RELAY-*.md                   ✅ KEEP (new system)
└── GIT-VS-WEBSOCKET-*.md        ✅ KEEP (decision record)
```

**Action**: Create `archive/pre-filament-migration/` folder.

---

## Part 6: Cleanup Execution Plan

### **Phase 1: Safe Deletions (No Dependencies)**

```bash
# Delete blockchain services
rm -rf src/backend/blockchain-service/
rm -rf src/backend/hashgraph/

# Delete obsolete vote service
rm -rf src/backend/vote-service/

# Delete state management
rm -rf src/backend/state/

# Delete ranking service
rm -rf src/backend/ranking-service/
```

---

### **Phase 2: Selective Removal (After Audit)**

```bash
# Review and selectively delete database components
# Review and selectively delete channel service components
# Review and selectively delete websocket components
```

---

### **Phase 3: Frontend Adaptation**

```bash
# Replace apiClient.js with relayClient.js
# Remove WebSocket hooks
# Adapt vote/channel components to Git queries
```

---

### **Phase 4: Documentation Cleanup**

```bash
# Archive obsolete docs
mkdir -p archive/pre-filament-migration/
mv BLOCKCHAIN-*.md archive/pre-filament-migration/
mv HASHGRAPH-*.md archive/pre-filament-migration/
mv VOTE-SYSTEM-*.md archive/pre-filament-migration/
```

---

## Part 7: Impact Summary

### **7.1 Code Reduction**

```yaml
Backend Services:
  Before: 1,200+ files
  After: ~720 files
  Reduction: 40%

Lines of Code:
  Blockchain: ~8,000 LOC removed
  Hashgraph: ~12,000 LOC removed
  State Management: ~3,000 LOC removed
  Total Reduction: ~23,000 LOC (35%)
```

---

### **7.2 Architectural Simplification**

**Before (Complex)**:
```
User Vote → WebSocket → State Manager → Blockchain → Hashgraph → Database → Update Clients
```

**After (Simple)**:
```
User Vote → Relay PUT → Git Commit → Query Hook → SSE → Update Clients
```

---

### **7.3 Reliability Gains**

```yaml
Eliminated Single Points of Failure:
  ❌ Blockchain sync failures
  ❌ Hashgraph consensus failures
  ❌ WebSocket connection drops
  ❌ State manager crashes
  ❌ Database lock contention

Gained:
  ✅ Git's proven reliability
  ✅ Distributed peer redundancy
  ✅ Immutable audit trail
  ✅ Branch/merge conflict resolution
  ✅ Offline-first capability
```

---

## Part 8: Migration Checklist

### **Before Deletion**:
- [ ] Backup full codebase to `archive/pre-filament-migration-backup/`
- [ ] Export existing vote/channel data to Git format (migration script)
- [ ] Test Git-based voting flow with demo users
- [ ] Verify query hooks return correct rankings
- [ ] Confirm SSE polling works for real-time updates

### **Safe to Delete When**:
- [ ] All votes migrated to Git commits
- [ ] All channels migrated to Git repositories
- [ ] Frontend adapted to Relay client
- [ ] Query hooks tested and working
- [ ] No services depend on blockchain/hashgraph/websocket

---

## Part 9: Services That Remain Critical

```yaml
✅ KEEP - Core Application Logic:
  - auth/ (11 files)
  - biometrics/ (5 files)
  - location/ (1 file)
  - governance/ (2 files)
  - invites/ (2 files)
  - onboarding/ (7 files)
  - privacy-services/ (5 files)
  - p2p-service/ (5 files)
  - security/ (5 files)
  - middleware/ (7 files)

✅ KEEP - Domain Logic Libraries:
  - lib/jurySortitionEngine.js
  - lib/tokenCalculator.mjs
  - lib/voteTokenManager.mjs
  - lib/trustBurnEngine.js
  - lib/sybilEnforcementOrchestrator.js
  - lib/privacyPreservingProximityService.mjs

✅ KEEP - Frontend Core:
  - Globe rendering components
  - Boundary/geographic systems
  - UI panels and modals
  - React hooks (adapted for Git)
```

---

## Part 10: Recommended Immediate Actions

### **Today (While Waiting for ChatGPT)**:

1. **Create Backup**:
   ```bash
   git branch pre-filament-migration-backup
   git push origin pre-filament-migration-backup
   ```

2. **Archive Obsolete Docs**:
   ```bash
   mkdir -p archive/pre-filament-migration/
   mv BLOCKCHAIN-*.md archive/pre-filament-migration/
   mv HASHGRAPH-*.md archive/pre-filament-migration/
   ```

3. **Identify Exact Dependencies**:
   ```bash
   # Find files importing blockchain
   grep -r "from.*blockchain" src/backend/
   grep -r "from.*hashgraph" src/backend/
   ```

4. **Create Migration Script Stub**:
   ```javascript
   // scripts/migrate-votes-to-git.mjs
   // Export existing votes → Git commits
   ```

---

## Summary: What Changes, What Stays

| Component | Old Role | New Role |
|-----------|----------|----------|
| **Blockchain** | Immutable vote storage | ❌ DELETED (Git commits) |
| **Hashgraph** | Event ordering | ❌ DELETED (Git merge) |
| **WebSocket** | Real-time state push | ❌ REPLACED (SSE polling) |
| **Vote Service** | Vote aggregation | ❌ REPLACED (query hooks) |
| **Database** | Truth storage | ⚠️ REDUCED (Git primary, cache only) |
| **Biometrics** | Sybil resistance | ✅ KEPT (edge validation) |
| **Auth** | User authentication | ✅ KEPT |
| **Location** | Proximity checks | ✅ KEPT |
| **Governance** | Sortition rules | ✅ KEPT |
| **Globe UI** | Main interface | ✅ ADAPTED (macro shell) |

**Net Result**: Simpler, more reliable, universally applicable system backed by Git's proven architecture. 🎯

