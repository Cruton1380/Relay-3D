# IMMEDIATE CLEANUP ACTIONS
**Priority**: Execute while waiting for ChatGPT
**Goal**: Identify deletion-safe vs. refactor-required files

---

## DEPENDENCY SCAN RESULTS

### **Files Importing Blockchain (26 files)**
```
src/backend/app.mjs
src/backend/routes/devCenter.mjs
src/backend/routes/vote.mjs
src/backend/server.mjs
src/backend/voting/votingEngine.mjs
src/backend/routes/channels.mjs
src/backend/routes/blockchain.mjs
src/backend/services/globalCommissionService.mjs
src/backend/services/microshardingManager.mjs
src/backend/services/regionalElectionService.mjs
src/backend/services/regionalMultiSigService.mjs
src/backend/state/state.mjs
src/backend/utils/healthMonitor.mjs
src/backend/utils/startupValidator.mjs
src/backend/routes/index.mjs
src/backend/onboarding/groupOnboardingService.mjs
... (26 total)
```

### **Files Importing Hashgraph (8 files)**
```
src/backend/server.mjs
... (mostly self-contained in hashgraph/)
```

### **Files Importing WebSocket (17 files)**
```
src/backend/app.mjs
src/backend/vote-service/index.mjs
src/backend/server.mjs
src/backend/voting/votingEngine.mjs
src/backend/websocket-service/*.mjs
src/backend/channel-service/index.mjs
... (17 total)
```

---

## PHASE 1: SAFE DELETIONS (No External Dependencies)

### **Delete Immediately**:

```bash
# 1. Blockchain service (self-contained)
rm -rf src/backend/blockchain-service/

# 2. Hashgraph (self-contained)
rm -rf src/backend/hashgraph/

# 3. Vote service (replaced by Git)
rm -rf src/backend/vote-service/

# 4. Ranking service (replaced by query hooks)
rm -rf src/backend/ranking-service/

# 5. State management (no longer needed)
rm -rf src/backend/state/

# 6. WebSocket service (replaced by SSE)
rm -rf src/backend/websocket-service/
```

**Total**: ~60+ files, ~25,000 LOC removed

---

## PHASE 2: FILES REQUIRING REFACTORING

### **2.1 Server Entry Points**

#### `src/backend/server.mjs`
**Current imports**:
```javascript
import blockchainService from './blockchain-service/index.mjs';
import hashgraphService from './hashgraph/hashgraphService.mjs';
import websocketService from './websocket-service/index.mjs';
```

**Action**: Remove imports, replace with:
```javascript
import relayClient from './relay-client/index.mjs';  // NEW
```

---

#### `src/backend/app.mjs`
**Current imports**:
```javascript
import blockchainManager from './blockchain-service/index.mjs';
import websocketService from './websocket-service/index.mjs';
```

**Action**: Remove imports, add Relay middleware.

---

### **2.2 Routes to Refactor**

#### `src/backend/routes/vote.mjs`
**Current**:
```javascript
import blockchainService from '../blockchain-service/index.mjs';

router.post('/cast', async (req, res) => {
  await blockchainService.addBlock({
    type: 'vote',
    ...req.body
  });
});
```

**Replace with**:
```javascript
import relayClient from '../relay-client/index.mjs';

router.post('/cast', async (req, res) => {
  const {userId, candidateId} = req.body;
  await relayClient.put(
    `/repos/${req.channelId}/votes/${userId}.yaml`,
    {candidate_id: candidateId, timestamp: Date.now()}
  );
});
```

---

#### `src/backend/routes/channels.mjs`
**Current**:
```javascript
import blockchainService from '../blockchain-service/index.mjs';
import websocketService from '../websocket-service/index.mjs';
```

**Replace with**:
```javascript
import relayClient from '../relay-client/index.mjs';
```

---

#### `src/backend/routes/blockchain.mjs`
**Action**: ❌ DELETE ENTIRE FILE (no longer needed)

---

### **2.3 Voting Engine**

#### `src/backend/voting/votingEngine.mjs`
**Current**:
```javascript
import blockchainService from '../blockchain-service/index.mjs';
import websocketService from '../websocket-service/index.mjs';
```

**Action**: Heavy refactoring required. Core logic:
- Vote validation → Keep (move to `.relay/pre-commit.mjs`)
- Vote storage → Replace with Git PUT
- Vote aggregation → Replace with query hooks
- Real-time updates → Replace with SSE

---

### **2.4 Services**

#### `src/backend/services/globalCommissionService.mjs`
**Uses**: blockchain for governance decisions

**Action**: Refactor to use Git branches for governance proposals.

---

#### `src/backend/services/regionalElectionService.mjs`
**Uses**: blockchain for election results

**Action**: Refactor to use Git commits for ballots.

---

### **2.5 Utils**

#### `src/backend/utils/healthMonitor.mjs`
**Current**: Monitors blockchain sync status

**Action**: Replace with Relay peer health checks.

---

#### `src/backend/utils/startupValidator.mjs`
**Current**: Validates blockchain integrity

**Action**: Replace with Git repo validation.

---

## PHASE 3: CREATE NEW COMPONENTS

### **3.1 Relay Client**
```bash
src/backend/relay-client/
├── index.mjs                    # Main Relay client
├── peerManager.mjs              # Manage Relay peers
├── commitBuilder.mjs            # Build Git commits
├── queryClient.mjs              # Call query hooks
└── sseStream.mjs                # Server-sent events
```

---

### **3.2 Domain Hooks (Git Repository)**
```bash
.relay/
├── pre-commit.mjs               # Validate votes/edits
├── query.mjs                    # Aggregate rankings
└── get.mjs                      # Render projections
```

---

### **3.3 Migration Scripts**
```bash
scripts/
├── migrate-votes-to-git.mjs     # Export votes → commits
├── migrate-channels-to-repos.mjs # Export channels → repos
└── verify-migration.mjs         # Validate migration
```

---

## EXECUTION ORDER

### **Step 1: Backup** ⚠️ CRITICAL
```bash
git branch pre-cleanup-backup
git add .
git commit -m "Backup before Filament migration cleanup"
git push origin pre-cleanup-backup
```

---

### **Step 2: Delete Safe Components**
```bash
# Execute PHASE 1 deletions
rm -rf src/backend/blockchain-service/
rm -rf src/backend/hashgraph/
rm -rf src/backend/vote-service/
rm -rf src/backend/ranking-service/
rm -rf src/backend/state/
rm -rf src/backend/websocket-service/

git add .
git commit -m "Remove blockchain, hashgraph, websocket services"
```

---

### **Step 3: Stub Replacements**
```bash
# Create relay-client stub
mkdir -p src/backend/relay-client
touch src/backend/relay-client/index.mjs

# Add placeholder
echo "export default { put: () => {}, query: () => {} };" > src/backend/relay-client/index.mjs
```

---

### **Step 4: Fix Import Errors**
```bash
# Run linter to find broken imports
npm run lint

# Replace all broken imports with relay-client stub
# (Allows server to start while refactoring)
```

---

### **Step 5: Archive Docs**
```bash
mkdir -p archive/pre-filament-migration/

mv BLOCKCHAIN-*.md archive/pre-filament-migration/
mv HASHGRAPH-*.md archive/pre-filament-migration/
mv VOTE-SYSTEM-*.md archive/pre-filament-migration/
mv WEBSOCKET-*.md archive/pre-filament-migration/

git add archive/
git commit -m "Archive obsolete documentation"
```

---

## ESTIMATED IMPACT

```yaml
Deletions:
  Files: ~80 files
  Lines of Code: ~25,000 LOC
  Directories: 6 major services

Refactoring Required:
  Files: ~30 files
  Estimated Hours: 8-12 hours
  Complexity: Medium (mostly find-replace imports)

New Components:
  Files: ~10 files
  Lines of Code: ~2,000 LOC
  Complexity: Medium (Relay client wrapper)
```

---

## RISK MITIGATION

### **Before Starting**:
- ✅ Full Git backup
- ✅ Dependency scan complete
- ✅ Replacement architecture defined

### **During Cleanup**:
- ✅ Delete in phases (test after each)
- ✅ Stub replacements immediately
- ✅ Keep server startable (even if broken)

### **After Cleanup**:
- ✅ Run full test suite
- ✅ Verify no broken imports
- ✅ Commit incrementally

---

## READY TO EXECUTE?

**Checklist**:
- [ ] Git backup created
- [ ] Reviewed FILAMENT-MIGRATION-CLEANUP-ANALYSIS.md
- [ ] Relay client architecture understood
- [ ] Migration scripts planned
- [ ] Time allocated (8-12 hours)

**Execute when**: ChatGPT confirms frontend approach, OR proceed with backend-only cleanup now.

---

## QUICK WIN: Archive Docs Now

**Safe to do immediately** (no code impact):

```bash
mkdir -p archive/pre-filament-migration/

# Archive blockchain docs
mv BLOCKCHAIN-CLEANUP-AUDIT.md archive/pre-filament-migration/
mv BLOCKCHAIN-CONSOLIDATION-*.md archive/pre-filament-migration/
mv STEP-0-BLOCKCHAIN-*.md archive/pre-filament-migration/

# Archive hashgraph docs
mv HASHGRAPH-*.md archive/pre-filament-migration/

# Archive obsolete vote system docs
mv VOTE-SYSTEM-COMPLETE-FIX.md archive/pre-filament-migration/
mv BACKEND-VOTE-COUNT-FIX-FINAL.md archive/pre-filament-migration/
mv DOUBLE-COUNTING-FIX-COMPLETE.md archive/pre-filament-migration/

git add archive/
git commit -m "Archive pre-Filament migration documentation"
```

**Result**: Cleaner root directory, preserved history. ✅

