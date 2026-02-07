# 📁 Relay Desktop Agent: File Organization

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Specification (Phase 0 ready for implementation)

---

## Definition

**Desktop Relay Agent** is a local-only file organization feature that observes filesystem chaos, recommends better structure, and executes approved reorganization operations in timeboxed, reversible batches.

**Rule**: This is a **user-owned agent running locally**. Never remote control, never silent operation.

---

## Core Invariants (Non-Negotiable)

### Invariant A — Local-Only Execution

**Rule**: The executor may only run on the machine where it is installed.

**Locked**:
- ❌ No remote execution across machines, ever
- ❌ No "send commands to other machines"
- ✅ Each machine has its own agent
- ✅ Plans can be shared, execution cannot

### Invariant B — Explicit Approval Gate

**Rule**: Every mutation requires explicit approval.

**Locked**:
- ❌ No background operations
- ❌ No silent runs
- ❌ No "trust me" auto-execution
- ✅ Single op OR timebox batch approval required
- ✅ "Approve timebox" is the only way to execute
- ✅ Every execution initiated from visible approval action

### Invariant C — Scope-Limited Folders

**Rule**: The user must explicitly select allowed folders.

**Locked**:
- ❌ No "scan entire drive"
- ❌ No scope expansion without permission
- ✅ User selects folders explicitly
- ✅ Executor refuses operations outside scope
- ✅ Scope changes logged as `FS_SCOPE_SET` commits

### Invariant D — No Admin by Default

**Rule**: Run as normal user permissions.

**Locked**:
- ❌ No elevation without explicit user request
- ❌ No "silent admin" operations
- ✅ Respect OS permissions
- ✅ If move requires admin: refuse + explain
- ✅ User can elevate manually (not automatic)

### Invariant E — Fail-Soft + Reversible

**Rule**: Every operation must have a planned revert.

**Locked**:
- ❌ No partial failures that hide continuation
- ❌ No "best effort" silent recovery
- ✅ Partial failures → explicit refusal/blocked state
- ✅ Every operation logged with revert plan
- ✅ Undo always available for completed timeboxes

### Invariant F — No Auto-Learning

**Rule**: Learning may only output `POLICY_RECOMMENDATION` style suggestions.

**Locked**:
- ❌ Never automatically restructure files
- ❌ No "I organized it for you while you were away"
- ✅ Learning produces recommendations
- ✅ User must promote recommendations to policies
- ✅ Policies require approval before each execution

---

## Architecture (Modules + Boundaries)

### Module 1: Desktop Adapter (Observer) — Read-Only

**Location**: `core/services/file-observer.js`

**Does**:
- Watch approved folders (using `fs.watch()` or `chokidar`)
- Record events: `create`, `move`, `rename`, `delete`
- Write commits: `FS_OBSERVED_EVENT`
- Calculate pressure scores (chaos metrics)

**Cannot**:
- Execute any operations
- Propose changes
- Touch filesystem (read-only except for commit log)

**Example**:
```javascript
export class FileObserver {
    constructor(approvedFolders) {
        this.approvedFolders = approvedFolders;  // From FS_SCOPE_SET
        this.eventLog = [];
    }
    
    observeFileSystem() {
        for (const folder of this.approvedFolders) {
            fs.watch(folder, { recursive: true }, (eventType, filename) => {
                this.recordEvent({
                    type: 'FS_OBSERVED_EVENT',
                    eventType,
                    path: filename,
                    timestamp: Date.now(),
                    scope: folder
                });
            });
        }
    }
    
    calculatePressure(folderPath) {
        // Analyze chaos:
        // - File count
        // - Depth (nested levels)
        // - Naming inconsistency
        // - Orphaned files
        
        return {
            pressure: 0.75,  // 0.0 to 1.0
            issues: ['143 files in root', 'Inconsistent naming'],
            scope: folderPath
        };
    }
}
```

---

### Module 2: Planner (Recommendation) — No Execution

**Location**: `core/services/file-planner.js`

**Does**:
- Scan folder structure (metadata only: paths, sizes, types)
- Compute pressure for "mess zones"
- Generate plan: timeboxed move operations
- Produce `FS_PLAN_PROPOSED` commits

**Cannot**:
- Call executor
- Touch filesystem
- Auto-approve plans

**Hard Separation**: Planner cannot call Executor. Only user gate can.

**Example**:
```javascript
export class FilePlanner {
    analyzeChaos(folderPath) {
        const files = this.scanFolder(folderPath);
        
        return {
            totalFiles: files.length,
            deeplyNested: files.filter(f => f.depth > 5).length,
            orphaned: files.filter(f => !this.hasCategory(f)).length,
            pressure: this.calculatePressure(files),
            recommendations: this.generateRecommendations(files)
        };
    }
    
    generateReorganizationPlan(analysis) {
        // Create timeboxed plan
        const plan = {
            id: `plan-${Date.now()}`,
            timeboxes: [],
            reversible: true,
            scope: analysis.folderPath
        };
        
        // Group operations into batches of 10-20
        const batches = this.batchOperations(analysis.recommendations, 20);
        
        for (const batch of batches) {
            plan.timeboxes.push({
                id: `timebox-${plan.timeboxes.length}`,
                operations: batch,
                pressure: this.estimatePressureReduction(batch),
                reversible: true
            });
        }
        
        return plan;
    }
}
```

---

### Module 3: Execution Gate (UI + Consent) — No Filesystem Operations

**Location**: `app/ui/file-execution-gate.js`

**Does**:
- Display plan + impact
- Require explicit approval
- Produce `FS_PLAN_APPROVED` commit
- Pass approved plan to executor

**Cannot**:
- Perform filesystem operations directly
- Auto-approve
- Skip preview

**Example**:
```javascript
export class FileExecutionGate {
    async showPreview(plan) {
        // Render in Relay UI:
        // - Tree view (before/after)
        // - Operation list
        // - Pressure reduction estimate
        // - Revert plan preview
        
        const approval = await this.promptUser({
            title: `Approve ${plan.timeboxes.length} timeboxes?`,
            operations: plan.timeboxes.flatMap(tb => tb.operations),
            pressureReduction: this.estimateImpact(plan),
            reversible: true,
            options: ['Approve All', 'Approve One Timebox', 'Cancel']
        });
        
        if (approval.approved) {
            // Log approval commit
            this.logCommit({
                type: 'FS_PLAN_APPROVED',
                planId: plan.id,
                timeboxIds: approval.timeboxIds,
                timestamp: Date.now(),
                user: this.getCurrentUser()
            });
            
            return approval;
        }
        
        return { approved: false };
    }
}
```

---

### Module 4: Executor (Local OS Actions) — Operations Only

**Location**: `app/file-executor.js`

**Does**:
- Execute approved operations only
- Log results as `FS_OP_EXECUTED` or `FS_OP_REFUSED`
- Emit refusal commits on failure
- Use native filesystem APIs (not shell commands by default)

**Cannot**:
- Run without approval commit
- Operate outside scope
- Run remote commands
- Continue silently on failure

**Implementation**:
```javascript
export class FileExecutor {
    async executeTimebox(timebox, approvalCommit) {
        // Verify approval exists
        if (!approvalCommit || approvalCommit.type !== 'FS_PLAN_APPROVED') {
            throw new Error('No approval commit - execution refused');
        }
        
        // Verify scope
        for (const op of timebox.operations) {
            if (!this.isInScope(op.from) || !this.isInScope(op.to)) {
                this.logRefusal({
                    type: 'FS_OP_REFUSED',
                    operation: op,
                    reason: 'Outside approved scope',
                    timeboxId: timebox.id
                });
                return { status: 'REFUSED', reason: 'scope violation' };
            }
        }
        
        const results = [];
        
        for (const op of timebox.operations) {
            try {
                // Use native filesystem API (NOT shell commands)
                await fs.promises.rename(op.from, op.to);
                
                // Log success
                this.logCommit({
                    type: 'FS_OP_EXECUTED',
                    operation: op,
                    timestamp: Date.now(),
                    timeboxId: timebox.id,
                    revertPlan: {
                        type: 'FS_OP_EXECUTED',
                        operation: { from: op.to, to: op.from }  // Reverse
                    }
                });
                
                results.push({ operation: op, status: 'SUCCESS' });
                
            } catch (error) {
                // Log refusal (not silent failure)
                this.logCommit({
                    type: 'FS_OP_REFUSED',
                    operation: op,
                    reason: error.message,
                    timestamp: Date.now(),
                    timeboxId: timebox.id
                });
                
                results.push({ operation: op, status: 'REFUSED', reason: error.message });
                
                // Fail-soft: stop execution, don't continue silently
                break;
            }
        }
        
        return { status: 'COMPLETED', results };
    }
}
```

---

### Module 5: Reverter (Undo) — Requires Approval

**Location**: `core/services/file-reverter.js`

**Does**:
- Replay reverse operations for a timebox
- Require approval (same gate as execution)
- Log reversions as `FS_TIMEBOX_REVERTED`

**Cannot**:
- Revert without approval
- Revert operations outside original scope

**Example**:
```javascript
export class FileReverter {
    async revertTimebox(timeboxId, approvalCommit) {
        // Get all executed operations for this timebox
        const commits = this.getCommitsForTimebox(timeboxId);
        const executedOps = commits.filter(c => c.type === 'FS_OP_EXECUTED');
        
        // Generate reverse plan
        const reversePlan = {
            id: `revert-${timeboxId}`,
            operations: executedOps.map(commit => ({
                type: 'REVERT_FILE_MOVE',
                from: commit.operation.to,    // Swap
                to: commit.operation.from,
                originalCommit: commit.id
            }))
        };
        
        // Require approval (same gate)
        const approval = await this.executionGate.showPreview(reversePlan);
        
        if (approval.approved) {
            // Execute reverse operations
            const results = await this.executor.executeTimebox(reversePlan, approval);
            
            // Log reversion
            this.logCommit({
                type: 'FS_TIMEBOX_REVERTED',
                timeboxId,
                reversePlanId: reversePlan.id,
                timestamp: Date.now()
            });
            
            return results;
        }
        
        return { status: 'CANCELLED' };
    }
}
```

---

## Commit Types (New Types Required)

**Location**: `core/models/commitTypes/`

### 1. FS_SCOPE_SET

**Purpose**: User defines allowed folders

**Schema**:
```javascript
{
    type: 'FS_SCOPE_SET',
    approvedFolders: ['C:/Users/Alice/Downloads', 'C:/Users/Alice/Documents'],
    timestamp: 1675804800000,
    user: 'alice@example.com'
}
```

### 2. FS_OBSERVED_EVENT

**Purpose**: Read-only event tracking

**Schema**:
```javascript
{
    type: 'FS_OBSERVED_EVENT',
    eventType: 'create' | 'move' | 'rename' | 'delete',
    path: 'C:/Users/Alice/Downloads/file.pdf',
    timestamp: 1675804800000,
    scope: 'C:/Users/Alice/Downloads'
}
```

### 3. FS_PLAN_PROPOSED

**Purpose**: Planner generates reorganization plan

**Schema**:
```javascript
{
    type: 'FS_PLAN_PROPOSED',
    planId: 'plan-1675804800000',
    timeboxes: [/* ... */],
    pressureReduction: 0.6,  // Estimated
    reversible: true,
    timestamp: 1675804800000
}
```

### 4. FS_PLAN_APPROVED

**Purpose**: User consents to execution

**Schema**:
```javascript
{
    type: 'FS_PLAN_APPROVED',
    planId: 'plan-1675804800000',
    timeboxIds: ['timebox-1', 'timebox-2'],
    timestamp: 1675804800000,
    user: 'alice@example.com'
}
```

### 5. FS_OP_EXECUTED

**Purpose**: Operation completed successfully

**Schema**:
```javascript
{
    type: 'FS_OP_EXECUTED',
    operation: {
        type: 'MOVE',
        from: 'C:/Users/Alice/Downloads/file.pdf',
        to: 'C:/Users/Alice/Projects/2026/file.pdf'
    },
    timestamp: 1675804800000,
    timeboxId: 'timebox-1',
    revertPlan: {/* reverse operation */}
}
```

### 6. FS_OP_REFUSED

**Purpose**: Operation failed or refused (explicit, not silent)

**Schema**:
```javascript
{
    type: 'FS_OP_REFUSED',
    operation: {/* ... */},
    reason: 'Permission denied' | 'Outside scope' | 'File not found',
    timestamp: 1675804800000,
    timeboxId: 'timebox-1'
}
```

### 7. FS_TIMEBOX_REVERTED

**Purpose**: Undo batch executed

**Schema**:
```javascript
{
    type: 'FS_TIMEBOX_REVERTED',
    timeboxId: 'timebox-1',
    reversePlanId: 'revert-timebox-1',
    timestamp: 1675804800000
}
```

---

## Privacy Rules (Explicit)

### Default Behavior

**Local-only storage**:
- All commit logs stored locally
- No cloud sync by default
- No telemetry

**Minimal metadata**:
- Only filenames/paths (if user allows)
- No file content hashing unless user opts in
- No file previews/thumbnails unless user opts in

### Pseudonymization Mode

**When exporting plans** (e.g., to share with team):
- Replace real paths with placeholders: `{user.downloads}/file1.pdf`
- Replace usernames: `alice` → `user-A`
- Replace folder names: `MySecretProject` → `project-X`

### Cloud Opt-In (Explicit)

**If user wants cloud sync**:
- Require explicit opt-in
- Encrypted storage
- User controls retention
- Can delete all data

---

## Implementation Guidance

### Preferred Execution Primitives

**Use native filesystem APIs**:
- ✅ Node.js `fs.promises.rename()`
- ✅ Node.js `fs.promises.mkdir()`
- ✅ Node.js `fs.promises.unlink()`

**Use shell commands ONLY when**:
- User explicitly approves a displayed script
- Script output is captured into log
- Still local-only

**Example (native API preferred)**:
```javascript
// ✅ CORRECT (native)
await fs.promises.rename(oldPath, newPath);

// ⚠️ USE SPARINGLY (shell)
const script = `mv "${oldPath}" "${newPath}"`;
const approval = await showScript(script);
if (approval) {
    const result = await exec(script);
    logCommit({ type: 'FS_OP_EXECUTED', script, result });
}
```

---

## Stage Gate Plan (Locked, Sequential)

### Phase 0: Observer Only ✅ READY FOR IMPLEMENTATION

**Goal**: Read-only watch + pressure visualization

**Deliverables**:
- `FileObserver` class (read-only)
- `FS_SCOPE_SET` commit type
- `FS_OBSERVED_EVENT` commit type
- Pressure calculation for folders
- Visualize folder pressure in Relay tree

**Gate Criteria**:
- ✅ No mutations
- ✅ No exec module loaded
- ✅ Pressure scores calculated correctly
- ✅ Observer runs without crashes
- ✅ Scope enforcement works (ignores folders outside scope)

**Pass/Fail Test**:
```javascript
it('should observe only within scope', () => {
    const observer = new FileObserver(['C:/Users/Alice/Downloads']);
    observer.observeFileSystem();
    
    // Create file inside scope
    fs.writeFileSync('C:/Users/Alice/Downloads/test.txt', 'test');
    expect(observer.eventLog.length).toBeGreaterThan(0);
    
    // Create file outside scope
    fs.writeFileSync('C:/Users/Bob/Downloads/test.txt', 'test');
    expect(observer.eventLog.length).toBe(1);  // Still only 1 event
});
```

---

### Phase 1: Dry-Run Planner ⏹ NOT STARTED

**Goal**: Generate plan + preview (no execution)

**Deliverables**:
- `FilePlanner` class
- `FS_PLAN_PROPOSED` commit type
- Preview UI in Relay

**Gate Criteria**:
- ✅ Plan is valid (all paths in scope)
- ✅ Plan is reversible (every op has revert)
- ✅ Plan is scoped (no out-of-scope operations)
- ✅ Preview shows impact
- ❌ Still no execution

**Blocked By**: Phase 0

---

### Phase 2: Gated Execution ⏹ NOT STARTED

**Goal**: Execute timebox batches with approval

**Deliverables**:
- `FileExecutionGate` class
- `FileExecutor` class
- `FileReverter` class
- `FS_PLAN_APPROVED`, `FS_OP_EXECUTED`, `FS_OP_REFUSED`, `FS_TIMEBOX_REVERTED` commit types

**Gate Criteria**:
- ✅ Every operation produces `FS_OP_EXECUTED` or `FS_OP_REFUSED`
- ✅ Approval required before execution
- ✅ Undo works for completed timeboxes
- ✅ Partial failures produce explicit refusals (not silent continuation)
- ✅ Audit log complete

**Blocked By**: Phase 1

---

### Phase 3: Learning (Recommendations Only) ⏹ NOT STARTED

**Goal**: Learn templates from accepted reorganizations

**Deliverables**:
- Learning engine (pattern recognition)
- Template generator
- Recommendation UI

**Gate Criteria**:
- ✅ Recommendations never auto-apply
- ✅ User promotion required
- ✅ Templates stored as policies (not execution rules)
- ❌ No auto-learning execution

**Blocked By**: Phase 2

---

## Hard Prohibitions (Locked)

❌ **No remote execution** (only local agent)  
❌ **No silent operations** (every action logged + visible)  
❌ **No scope expansion** (user selects folders explicitly)  
❌ **No admin bypass** (respect OS permissions)  
❌ **No auto-learning execution** (learning informs recommendations, never auto-acts)  
❌ **No background operations** (no "while you were away" reorganizations)  
❌ **No hidden continuation** (partial failures → explicit refusal)  

---

## Testing Strategy

### Unit Tests

```javascript
describe('FileObserver', () => {
    it('should observe only within scope', () => { /* ... */ });
    it('should calculate pressure correctly', () => { /* ... */ });
    it('should refuse operations outside scope', () => { /* ... */ });
});

describe('FilePlanner', () => {
    it('should generate valid plans', () => { /* ... */ });
    it('should ensure all operations are reversible', () => { /* ... */ });
});

describe('FileExecutor', () => {
    it('should require approval', () => { /* ... */ });
    it('should refuse operations without approval', () => { /* ... */ });
    it('should log every operation', () => { /* ... */ });
    it('should stop on first failure (fail-soft)', () => { /* ... */ });
});

describe('FileReverter', () => {
    it('should generate correct reverse plans', () => { /* ... */ });
    it('should require approval for revert', () => { /* ... */ });
});
```

### Integration Tests

- End-to-end: Observe → Plan → Approve → Execute → Verify → Revert
- Scope enforcement: Operations outside scope are refused
- Audit trail: Every commit logged with full metadata

---

## Summary

**Desktop Relay Agent: File Organization** is a canonically sound feature IF:
- It respects all 6 core invariants
- Module boundaries are enforced (Planner cannot call Executor)
- Privacy is local-first
- Execution is gated, logged, and reversible

**This feature extends Relay's coordination substrate to local filesystem organization.**

**Next**: Implement Phase 0 (Observer only) after this spec passes review.

---

*See also*:
- [Relay Architecture](../architecture/RELAY-CESIUM-ARCHITECTURE.md) - Core principles
- [Governance Cadence](../governance/GOVERNANCE-CADENCE.md) - How approval gates work
- [Stage Gates](../governance/STAGE-GATES.md) - Gate enforcement
