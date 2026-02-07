# RELAY AGENT (SCV) IMPLEMENTATION PLAN

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** IMPLEMENTATION READY

---

## A) CURRENT STATE AUDIT

### A1) Repository Locations

#### ✅ Filament/Commit Schemas

**Location:** `src/backend/relay-physics/stores/filamentStore.mjs` (195 lines)

**What it does:**
- Append-only commit log (CORRECT ✅)
- Immutable commits with `Object.freeze()` (CORRECT ✅)
- Monotonic commitIndex per filament (CORRECT ✅)
- WebSocket subscription support (CORRECT ✅)
- Schema: `{ ref, filamentId, commitIndex, type, timestamp, authorUnitRef, payload, causalRefs }`

**Status:** ✅ READY TO USE (no changes needed)

---

**Location:** `src/backend/schemas/promptCoordinationSchemas.js` (405 lines)

**What it does:**
- Prompt filament commit types (PROMPT_CREATE, PROMPT_EDIT, PROMPT_COMPILE, etc.)
- CompiledPromptArtifact schema
- Sequence filament support (automation)
- Merge scar commits

**Status:** ✅ READY TO USE (already correct)

---

#### ❌ MISSING: Agent Commit Schemas

**Gap:** No schemas for:
- `TASK_ASSIGN`
- `UNIT_ATTACH` / `UNIT_DETACH`
- `PROMPT_STEP_RUN`
- `OUTPUT_PROPOSED`
- `OUTPUT_ACCEPTED` / `OUTPUT_REJECTED`
- `AI_REASONING_STEP`

**Required:** New file `src/backend/schemas/agentCommitSchemas.mjs`

---

#### ✅ Unit Store (SCV State)

**Location:** `src/backend/relay-physics/stores/unitStore.mjs` (219 lines)

**What it does:**
- SCV unit creation (Employee | AI Agent)
- States: Idle | Moving | Working | Blocked | Awaiting Authority (CORRECT ✅)
- Task assignment tracking
- Attachment/detachment tracking
- WebSocket subscription support

**Status:** ✅ MOSTLY READY (needs verification hooks integration)

---

#### ⚠️ WebSocket Event Flow

**Location:** `src/frontend/services/websocketService.js` (195 lines)

**What it does:**
- Client-side WebSocket manager
- Subscribe/unsubscribe to channels
- Reconnection logic
- Message routing

**Status:** ⚠️ FRONTEND ONLY (backend WebSocket server missing)

**Gap:** No backend `src/backend/server.mjs` WebSocket server implementation

---

#### ❌ Agent Workspace Logic

**Location:** `src/backend/ai-agent/` (10 files)

**Files found:**
- `agentExecutionTracer.mjs` - Legacy tracing system
- `agentLLMBridge.mjs`
- `agentCollaborationLoop.mjs`
- `agentFailureRecovery.mjs`
- `agentArchitect.mjs`

**Status:** ❌ LEGACY / AMBIENT AUTHORITY VIOLATIONS

**Classification:** **REPLACE** (these are not Relay-native)

**Problems:**
- No filament-based state
- No commit-based actions
- Hidden reasoning (not auditable)
- Ambient authority (no authorityRef)

---

#### ⚠️ Verification Service

**Location:** `src/backend/services/verificationService.mjs` (327 lines)

**What it does:**
- User verification challenges (password, biometric, etc.)
- Risk-based adaptive verification

**Status:** ⚠️ WRONG DOMAIN (user auth, not commit verification)

**Gap:** No commit/ref/authority verification system

---

### A2) Source of Truth for Coordination Primitives

#### ✅ CommitIndex Ordering

**Source of Truth:** `filamentStore.mjs` line 52-54

```javascript
const commitIndex = filament.headIndex + 1;
const commitRef = `${filamentId}@c${commitIndex}`;
```

**Status:** ✅ CORRECT (monotonic, deterministic)

**Gaps:** None

---

#### ❌ Ref Validation (inputs/evidence/authorityRef)

**Current State:** **NONE**

**Gap:** No validation that refs exist before accepting commit

**Required:**
- `refValidator.mjs` - Check that all refs in `causalRefs` point to existing commits/filaments
- Integration with `filamentStore.appendCommit()`

---

#### ❌ Authority Checks

**Current State:** **NONE**

**Gap:** No authority store, no capability checking, no delegation chain

**Required:**
- `src/backend/relay-physics/stores/authorityStore.mjs` (NEW)
- `src/backend/relay-physics/services/authorityEngine.mjs` (NEW)
- Schema for authority delegation graph

---

#### ❌ Accept/Reject Verification

**Current State:** **NONE**

**Gap:** Commits are accepted immediately without validation

**Required:**
- `src/backend/relay-physics/services/commitVerifier.mjs` (NEW)
- Verification pipeline:
  1. Schema validation (payload structure)
  2. Ref validation (inputs/evidence/authorityRef exist)
  3. Authority validation (user has required capability)
  4. Evidence policy (if required, evidence refs must be present)
  5. Custom rules (domain-specific constraints)

---

### A3) Legacy/Ambient-Authority Backend Classification

| Path | Classification | Reason | Action |
|------|----------------|--------|--------|
| `src/backend/ai-agent/*` | **REPLACE** | No filaments, no commits, hidden reasoning, ambient authority | Archive → build Relay-native SCV agent |
| `src/backend/channel-service/*` | **MODIFY** | Some good patterns, but needs filament integration | Refactor to use filament commits |
| `src/backend/services/verificationService.mjs` | **KEEP** | User auth domain (separate concern) | Keep as-is (not agent-related) |
| `src/backend/relay-physics/stores/*` | **KEEP** | Already correct (append-only, immutable) | Use as foundation |
| `src/backend/routes/*.mjs` (52 files) | **AUDIT NEEDED** | Too many to classify without reading | Low priority (focus on agent runtime first) |

**Direct DB writes:** Not found (in-memory stores currently)

**Hidden scheduling:** Found in `ai-agent/agentCollaborationLoop.mjs` (REPLACE)

**Last-write-wins:** Not found (filamentStore is append-only)

**"System decided":** Found in `ai-agent/agentArchitect.mjs` (REPLACE)

---

## B) BUILD MINIMAL RELAY AGENT (SCV) MVP

### B4) Minimal Relay Agent SCV Runtime

#### Unit State Machine

**States (LOCKED):**

```javascript
const UnitState = {
  IDLE: 'Idle',                    // No task, waiting for assignment
  MOVING: 'Moving',                // Moving to filament/worksite
  WORKING: 'Working',              // Attached to filament, producing commits
  BLOCKED: 'Blocked',              // Cannot proceed (missing input/ref)
  AWAITING_AUTHORITY: 'AwaitingAuthority'  // Needs delegation to proceed
};
```

**State Transitions (via commits only):**

```
TASK_ASSIGN → Idle → Moving
UNIT_ATTACH → Moving → Working
OUTPUT_PROPOSED → Working (stays Working)
OUTPUT_ACCEPTED → Working (stays Working)
OUTPUT_REJECTED → Working (stays Working, may transition to Blocked)
UNIT_DETACH → Working → Idle
AUTHORITY_DELEGATED → AwaitingAuthority → Moving/Working
```

**No ambient transitions.** All state changes driven by explicit commits.

---

#### Chat Filament + Work Filament per SCV

**Schema:**

```javascript
// When creating an SCV agent:
1. Create unit: unit.<agentId>
2. Create conversation filament: conversation.<agentId>
3. Create work filament: work.<agentId>

// Conversation filament commits:
- USER_MESSAGE (user input)
- ASSISTANT_MESSAGE (agent response)
- SYSTEM_MESSAGE (notifications, blockers)

// Work filament commits:
- TASK_ASSIGN (manager assigns task)
- PROMPT_STEP_RUN (agent executes prompt step)
- OUTPUT_PROPOSED (agent proposes commit with 6 faces)
- OUTPUT_ACCEPTED (verifier accepts)
- OUTPUT_REJECTED (verifier rejects + reason code)
- UNIT_ATTACH (agent attaches to filament)
- UNIT_DETACH (agent detaches)
```

---

#### Implementation Location

**New file:** `src/backend/relay-physics/runtime/agentRuntime.mjs`

**Responsibilities:**
- SCV agent creation (unit + conversation + work filaments)
- State machine enforcement
- Commit-driven state transitions
- WebSocket event emission

---

### B5) Agent Work Commit Ops

**Location:** `src/backend/schemas/agentCommitSchemas.mjs` (NEW)

#### TASK_ASSIGN

```javascript
{
  type: 'TASK_ASSIGN',
  payload: {
    targetUnit: 'unit.ai.agent.001',
    filamentId: 'work.W123',
    taskDescription: 'Implement auth module',
    scope: 'backend/auth/*',
    timeboxSeconds: 3600,
    requiredCapabilities: ['code.write', 'file.read']
  },
  causalRefs: {
    inputs: ['conversation.user.001@c5'],
    authorityRef: 'auth.task.assign@d5'
  }
}
```

---

#### UNIT_ATTACH / UNIT_DETACH

```javascript
// ATTACH
{
  type: 'UNIT_ATTACH',
  payload: {
    unitId: 'unit.ai.agent.001',
    filamentId: 'work.W123',
    position: { lat: 37.7749, lng: -122.4194, alt: 100 }
  },
  causalRefs: {
    inputs: ['work.W123@c1'], // TASK_ASSIGN commit
    authorityRef: null // No authority needed (following assignment)
  }
}

// DETACH
{
  type: 'UNIT_DETACH',
  payload: {
    unitId: 'unit.ai.agent.001',
    filamentId: 'work.W123',
    reason: 'Task completed'
  },
  causalRefs: {
    inputs: ['work.W123@c42'], // Last work commit
    authorityRef: null
  }
}
```

---

#### PROMPT_STEP_RUN

```javascript
{
  type: 'PROMPT_STEP_RUN',
  payload: {
    unitId: 'unit.ai.agent.001',
    compiledPromptRef: 'compiled.P5@v3',
    sequenceStepRef: 'sequence.S1@c8',
    runId: 'run.R42'
  },
  causalRefs: {
    inputs: ['work.W123@c10'],
    evidence: [],
    authorityRef: 'auth.prompt.execute@d5'
  }
}
```

---

#### OUTPUT_PROPOSED (6-FACE STRUCTURE)

```javascript
{
  type: 'OUTPUT_PROPOSED',
  payload: {
    runId: 'run.R42',
    faces: {
      operation: 'Implemented JWT auth middleware',
      inputs: ['work.W123@c1', 'auth.requirements@c5'],
      authority: 'auth.code.write@d5',
      evidence: ['evidence.E45', 'evidence.E46'], // JWT spec, security guide
      time: { 
        timestamp: '2026-01-28T14:30:00Z',
        duration: 180 // seconds
      },
      integrity: {
        hash: '0x3f2a...',
        verification: 'pending'
      }
    },
    proposedCommit: {
      // The actual commit to be accepted/rejected
      type: 'CODE_CHANGE',
      payload: { /* ... */ },
      causalRefs: { /* ... */ }
    }
  },
  causalRefs: {
    inputs: ['run.R42@c1'], // PROMPT_STEP_RUN
    evidence: ['evidence.E45', 'evidence.E46'],
    authorityRef: 'auth.code.write@d5'
  }
}
```

---

#### OUTPUT_ACCEPTED / OUTPUT_REJECTED

```javascript
// ACCEPTED
{
  type: 'OUTPUT_ACCEPTED',
  payload: {
    runId: 'run.R42',
    proposalRef: 'work.W123@c15', // OUTPUT_PROPOSED commit
    acceptedBy: 'unit.manager.001',
    acceptedAt: '2026-01-28T14:31:00Z',
    verificationResults: {
      schemaValid: true,
      refsValid: true,
      authorityValid: true,
      evidenceValid: true
    }
  },
  causalRefs: {
    inputs: ['work.W123@c15'], // OUTPUT_PROPOSED
    authorityRef: 'auth.proposal.accept@d6'
  }
}

// REJECTED
{
  type: 'OUTPUT_REJECTED',
  payload: {
    runId: 'run.R42',
    proposalRef: 'work.W123@c15',
    rejectedBy: 'verifier.001',
    rejectedAt: '2026-01-28T14:31:00Z',
    reasonCode: 'MISSING_EVIDENCE',
    reasonDetails: 'Claim requires evidence refs for security policy compliance',
    verificationResults: {
      schemaValid: true,
      refsValid: true,
      authorityValid: true,
      evidenceValid: false // ❌ FAILED
    },
    suggestedFix: 'Attach evidence.security.policy@v2'
  },
  causalRefs: {
    inputs: ['work.W123@c15'],
    authorityRef: 'auth.proposal.reject@d6'
  }
}
```

---

#### Reason Codes (Enum)

```javascript
const RejectionReasonCode = {
  SCHEMA_INVALID: 'SCHEMA_INVALID',           // Payload structure wrong
  REF_INVALID: 'REF_INVALID',                 // Referenced commit doesn't exist
  AUTHORITY_MISSING: 'AUTHORITY_MISSING',     // No authorityRef provided
  AUTHORITY_DENIED: 'AUTHORITY_DENIED',       // User lacks required capability
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',       // Policy requires evidence, none provided
  EVIDENCE_INVALID: 'EVIDENCE_INVALID',       // Evidence refs don't support claim
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',     // Conflicts with existing commit
  SCOPE_VIOLATION: 'SCOPE_VIOLATION',         // Outside agent's assigned scope
  TIMEBOX_EXCEEDED: 'TIMEBOX_EXCEEDED',       // Took longer than allowed
  CUSTOM_RULE_FAILED: 'CUSTOM_RULE_FAILED'    // Domain-specific rule violation
};
```

---

### B6) Verification Hooks

**Location:** `src/backend/relay-physics/services/commitVerifier.mjs` (NEW)

#### Schema Validity

```javascript
function validateSchema(commit, expectedSchema) {
  // Use Joi or JSON Schema validation
  const { error } = expectedSchema.validate(commit.payload);
  
  if (error) {
    return {
      valid: false,
      reasonCode: 'SCHEMA_INVALID',
      details: error.details.map(d => d.message).join(', ')
    };
  }
  
  return { valid: true };
}
```

**Called:** Before `filamentStore.appendCommit()`

**Fail behavior:** Reject commit, return `{ accepted: false, reasonCode, details }`

---

#### Ref Validity

```javascript
function validateRefs(commit, filamentStore) {
  const { inputs = [], evidence = [], authorityRef } = commit.causalRefs;
  
  const invalidRefs = [];
  
  // Check inputs
  for (const inputRef of inputs) {
    if (!filamentStore.getCommit(inputRef)) {
      invalidRefs.push(inputRef);
    }
  }
  
  // Check evidence
  for (const evidenceRef of evidence) {
    if (!filamentStore.getCommit(evidenceRef)) {
      invalidRefs.push(evidenceRef);
    }
  }
  
  // Check authority
  if (authorityRef && !filamentStore.getCommit(authorityRef)) {
    invalidRefs.push(authorityRef);
  }
  
  if (invalidRefs.length > 0) {
    return {
      valid: false,
      reasonCode: 'REF_INVALID',
      details: `Invalid refs: ${invalidRefs.join(', ')}`
    };
  }
  
  return { valid: true };
}
```

**Called:** After schema validation, before authority check

**Fail behavior:** Reject commit with list of invalid refs

---

#### Authority Validity

```javascript
function validateAuthority(commit, authorityStore, authorUnitRef) {
  const { authorityRef } = commit.causalRefs;
  
  // If commit type requires authority but none provided
  if (requiresAuthority(commit.type) && !authorityRef) {
    return {
      valid: false,
      reasonCode: 'AUTHORITY_MISSING',
      details: `Commit type ${commit.type} requires authorityRef`
    };
  }
  
  if (!authorityRef) {
    return { valid: true }; // No authority required
  }
  
  // Check if unit has required capability
  const capability = extractCapability(authorityRef);
  const hasCapability = authorityStore.checkCapability(authorUnitRef, capability);
  
  if (!hasCapability) {
    return {
      valid: false,
      reasonCode: 'AUTHORITY_DENIED',
      details: `Unit ${authorUnitRef} lacks capability: ${capability}`,
      suggestedFix: `Request delegation from authority holder`
    };
  }
  
  return { valid: true };
}
```

**Called:** After ref validation

**Fail behavior:** Reject commit, suggest delegation path

---

#### Evidence Policy

```javascript
function validateEvidence(commit, policyStore) {
  const policy = policyStore.getPolicy(commit.type);
  
  if (!policy || !policy.evidenceRequired) {
    return { valid: true }; // No evidence policy
  }
  
  const { evidence = [] } = commit.causalRefs;
  
  if (evidence.length === 0) {
    return {
      valid: false,
      reasonCode: 'EVIDENCE_MISSING',
      details: `Policy requires evidence for ${commit.type}`,
      suggestedFix: `Attach evidence refs that support this operation`
    };
  }
  
  // Optional: Validate that evidence actually supports the claim
  // (advanced semantic validation)
  
  return { valid: true };
}
```

**Called:** After authority validation

**Fail behavior:** Reject commit with policy explanation

---

#### Integration Point

**Modified:** `src/backend/relay-physics/stores/filamentStore.mjs`

```javascript
appendCommit(filamentId, commitData) {
  // BEFORE: Direct append
  // AFTER: Verify first
  
  const verification = commitVerifier.verify(commitData, {
    filamentStore: this,
    authorityStore,
    policyStore
  });
  
  if (!verification.valid) {
    // Emit rejection event via WebSocket
    this._notifySubscribers(filamentId, {
      type: 'COMMIT_REJECTED',
      reasonCode: verification.reasonCode,
      details: verification.details,
      suggestedFix: verification.suggestedFix
    });
    
    throw new CommitRejectedError(verification);
  }
  
  // ... existing append logic ...
}
```

---

## C) TRAINING DATA PIPELINE

### C7) Dataset Spec (JSONL)

**Location:** `datasets/relay-agent/` (NEW)

**File naming:** `relay-agent-training-YYYY-MM-DD-HHMMSS.jsonl`

#### Record Schema

```json
{
  "recordId": "rec_001",
  "timestamp": "2026-01-28T14:30:00Z",
  "sessionId": "session_42",
  "recordType": "agent_work_step",
  
  "stateSnapshot": {
    "filaments": {
      "conversation.ai.001": {
        "headRef": "conversation.ai.001@c15",
        "headIndex": 15,
        "recentCommits": [
          { "ref": "conversation.ai.001@c14", "type": "USER_MESSAGE", "payload": "..." },
          { "ref": "conversation.ai.001@c15", "type": "ASSISTANT_MESSAGE", "payload": "..." }
        ]
      },
      "work.W123": {
        "headRef": "work.W123@c10",
        "headIndex": 10,
        "recentCommits": [
          { "ref": "work.W123@c9", "type": "TASK_ASSIGN", "payload": "..." },
          { "ref": "work.W123@c10", "type": "UNIT_ATTACH", "payload": "..." }
        ]
      }
    },
    "unit": {
      "id": "unit.ai.agent.001",
      "state": "Working",
      "attachedFilament": "work.W123",
      "currentTask": "Implement auth module",
      "scope": "backend/auth/*",
      "capabilities": ["code.write", "file.read"]
    },
    "commitWindow": {
      "fromIndex": 1,
      "toIndex": 10,
      "commits": [ /* relevant commit history */ ]
    }
  },
  
  "instruction": {
    "type": "PROMPT_STEP_RUN",
    "compiledPromptRef": "compiled.P5@v3",
    "promptText": "Implement JWT auth middleware. Requirements: [...]",
    "expectedFormat": "6-face commit with operation, inputs, evidence, authority, time, integrity"
  },
  
  "modelOutput": {
    "type": "OUTPUT_PROPOSED",
    "proposedCommit": {
      "type": "CODE_CHANGE",
      "payload": {
        "operation": "Implemented JWT auth middleware",
        "changedFiles": ["backend/auth/middleware.js"],
        "linesAdded": 42,
        "linesRemoved": 5
      },
      "causalRefs": {
        "inputs": ["work.W123@c9"],
        "evidence": ["evidence.E45", "evidence.E46"],
        "authorityRef": "auth.code.write@d5"
      }
    },
    "faces": {
      "operation": "Implemented JWT auth middleware",
      "inputs": ["work.W123@c9"],
      "authority": "auth.code.write@d5",
      "evidence": ["evidence.E45", "evidence.E46"],
      "time": { "timestamp": "2026-01-28T14:30:00Z", "duration": 180 },
      "integrity": { "hash": "0x3f2a...", "verification": "pending" }
    }
  },
  
  "verifierResult": {
    "accepted": true,
    "reasonCode": null,
    "verificationResults": {
      "schemaValid": true,
      "refsValid": true,
      "authorityValid": true,
      "evidenceValid": true
    },
    "acceptedCommitRef": "work.W123@c15"
  },
  
  "metadata": {
    "model": "gpt-4o",
    "tokenCount": 1250,
    "processingTime": 3.2,
    "retryCount": 0,
    "humanReviewed": false
  }
}
```

---

#### Storage Location

**Root:** `datasets/relay-agent/`

**Structure:**
```
datasets/
└── relay-agent/
    ├── raw/
    │   ├── relay-agent-training-2026-01-28-143000.jsonl
    │   ├── relay-agent-training-2026-01-28-150000.jsonl
    │   └── ...
    ├── processed/
    │   ├── train.jsonl (80%)
    │   ├── val.jsonl (10%)
    │   └── test.jsonl (10%)
    └── metadata/
        ├── schema.json
        ├── statistics.json
        └── README.md
```

---

#### Writer Code

**Location:** `src/backend/relay-physics/training/datasetWriter.mjs` (NEW)

```javascript
import fs from 'fs/promises';
import path from 'path';

class DatasetWriter {
  constructor() {
    this.outputDir = './datasets/relay-agent/raw';
    this.currentFile = null;
    this.recordCount = 0;
  }
  
  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentFile = path.join(this.outputDir, `relay-agent-training-${timestamp}.jsonl`);
  }
  
  async writeRecord(record) {
    const jsonLine = JSON.stringify(record) + '\n';
    await fs.appendFile(this.currentFile, jsonLine);
    this.recordCount++;
  }
  
  async close() {
    console.log(`Dataset written: ${this.currentFile} (${this.recordCount} records)`);
  }
}

export default DatasetWriter;
```

---

### C8) Offline Trainer-Ready Export Command

**Location:** `scripts/export-training-data.mjs` (NEW)

```javascript
#!/usr/bin/env node

import filamentStore from '../src/backend/relay-physics/stores/filamentStore.mjs';
import DatasetWriter from '../src/backend/relay-physics/training/datasetWriter.mjs';

/**
 * Export Relay agent training data from commit logs
 * 
 * Usage:
 *   node scripts/export-training-data.mjs --limit 1000
 */

async function exportTrainingData(options = {}) {
  const { limit = 1000, filter = {} } = options;
  
  const writer = new DatasetWriter();
  await writer.initialize();
  
  // Get all work filaments
  const workFilaments = filamentStore.listFilaments({ type: 'work' });
  
  let exported = 0;
  
  for (const filament of workFilaments) {
    if (exported >= limit) break;
    
    // Get commits for this filament
    const commits = filamentStore.getCommits(filament.id);
    
    // Extract training records from commit sequences
    const records = extractTrainingRecords(filament, commits);
    
    for (const record of records) {
      await writer.writeRecord(record);
      exported++;
      
      if (exported >= limit) break;
    }
  }
  
  await writer.close();
  
  console.log(`✅ Exported ${exported} training records`);
  return writer.currentFile;
}

function extractTrainingRecords(filament, commits) {
  const records = [];
  
  // Find sequences: PROMPT_STEP_RUN → OUTPUT_PROPOSED → OUTPUT_ACCEPTED/REJECTED
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    
    if (commit.type === 'OUTPUT_PROPOSED') {
      const nextCommit = commits[i + 1];
      
      if (nextCommit && (nextCommit.type === 'OUTPUT_ACCEPTED' || nextCommit.type === 'OUTPUT_REJECTED')) {
        // Found a complete sequence
        const record = buildTrainingRecord(filament, commits, i);
        records.push(record);
      }
    }
  }
  
  return records;
}

function buildTrainingRecord(filament, commits, proposalIndex) {
  const proposal = commits[proposalIndex];
  const result = commits[proposalIndex + 1];
  
  // Build state snapshot (last 10 commits)
  const stateSnapshot = {
    filaments: {
      [filament.id]: {
        headRef: filament.headRef,
        headIndex: proposalIndex,
        recentCommits: commits.slice(Math.max(0, proposalIndex - 10), proposalIndex)
      }
    },
    commitWindow: {
      fromIndex: Math.max(1, proposalIndex - 10),
      toIndex: proposalIndex,
      commits: commits.slice(Math.max(0, proposalIndex - 10), proposalIndex)
    }
  };
  
  // Extract instruction
  const instruction = {
    type: 'PROMPT_STEP_RUN',
    promptText: proposal.payload.faces?.operation || 'Unknown task',
    expectedFormat: '6-face commit structure'
  };
  
  // Extract model output
  const modelOutput = {
    type: proposal.type,
    proposedCommit: proposal.payload.proposedCommit,
    faces: proposal.payload.faces
  };
  
  // Extract verifier result
  const verifierResult = {
    accepted: result.type === 'OUTPUT_ACCEPTED',
    reasonCode: result.payload.reasonCode || null,
    verificationResults: result.payload.verificationResults
  };
  
  return {
    recordId: `rec_${proposal.ref.replace(/[^a-zA-Z0-9]/g, '_')}`,
    timestamp: proposal.timestamp,
    stateSnapshot,
    instruction,
    modelOutput,
    verifierResult,
    metadata: {
      model: 'gpt-4o', // Extract from actual run metadata
      filamentId: filament.id,
      commitRef: proposal.ref
    }
  };
}

// CLI entry point
const args = process.argv.slice(2);
const limit = parseInt(args.find(a => a.startsWith('--limit'))?.split('=')[1] || '1000');

exportTrainingData({ limit })
  .then(file => {
    console.log(`\n📦 Training data exported to: ${file}`);
    console.log(`\nNext steps:`);
    console.log(`1. Process data: npm run process-training-data`);
    console.log(`2. Train model: npm run train-agent-model`);
  })
  .catch(error => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
```

---

**NPM Script:** `package.json`

```json
{
  "scripts": {
    "export:training-data": "node scripts/export-training-data.mjs",
    "export:training-data:1000": "node scripts/export-training-data.mjs --limit=1000",
    "export:training-data:10000": "node scripts/export-training-data.mjs --limit=10000"
  }
}
```

---

### C9) Phase-0 "Format Obedience" Training Plan

#### Step 1: Grammar-Constrained JSON Output (Immediate)

**Tool:** Outlines library (grammar-guided generation)

```bash
npm install outlines
```

**Schema:** `schemas/commitOutputSchema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["type", "payload", "causalRefs"],
  "properties": {
    "type": {
      "type": "string",
      "enum": ["CODE_CHANGE", "FILE_CREATE", "FILE_DELETE", etc...]
    },
    "payload": {
      "type": "object",
      "required": ["operation"],
      "properties": {
        "operation": { "type": "string" }
      }
    },
    "causalRefs": {
      "type": "object",
      "required": ["inputs", "evidence", "authorityRef"],
      "properties": {
        "inputs": { "type": "array", "items": { "type": "string" } },
        "evidence": { "type": "array", "items": { "type": "string" } },
        "authorityRef": { "type": "string", "nullable": true }
      }
    }
  }
}
```

**Usage:**

```javascript
import { Outlines } from 'outlines';

const generator = new Outlines({
  model: 'gpt-4o',
  schema: commitOutputSchema
});

const result = await generator.generate(prompt);
// Result is GUARANTEED to match schema (constrained decoding)
```

**Timeline:** 1 week (integration + testing)

---

#### Step 2: Supervised Fine-Tune Dataset (Phase 0)

**Input:** `datasets/relay-agent/processed/train.jsonl` (from C8)

**Filter:** Only `OUTPUT_ACCEPTED` records (successful commits)

**Format:** (state, instruction) → (commit JSON)

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a Relay agent. You produce commits with 6-face structure. All outputs must include: operation, inputs, authority, evidence, time, integrity."
    },
    {
      "role": "user",
      "content": "STATE: {filament snapshot}\n\nTASK: Implement JWT auth middleware\n\nProduce OUTPUT_PROPOSED commit."
    },
    {
      "role": "assistant",
      "content": "{\"type\": \"OUTPUT_PROPOSED\", \"payload\": {...}, \"causalRefs\": {...}}"
    }
  ]
}
```

**Training:**

```bash
# Using OpenAI API fine-tuning
openai api fine_tunes.create \
  -t datasets/relay-agent/processed/train.jsonl \
  -m gpt-4o \
  --suffix "relay-agent-v1" \
  --n_epochs 3
```

**Timeline:** 2-4 weeks (data collection: 1-2 weeks, training: 3-7 days, validation: 1 week)

---

#### Step 3: Validation Metrics

**Measure:**
1. **Schema conformance:** % of outputs that pass schema validation
2. **Ref validity:** % of outputs with valid causalRefs
3. **Evidence attachment rate:** % of outputs with >0 evidence refs
4. **Authority citation rate:** % of outputs with authorityRef
5. **Accept rate:** % of outputs accepted by verifier (not rejected)

**Target:**
- Schema conformance: 100% (grammar-constrained)
- Ref validity: >95%
- Evidence attachment: >80%
- Authority citation: >90%
- Accept rate: >70%

---

## D) FRONTEND INTEGRATION (SCV HUD + GLOBE WORLD)

### D10) Wire SCVs into Globe World

#### Click SCV → Opens Chat + Work History in HUD

**Component:** `src/frontend/components/globe-world/SCVUnits.jsx` (NEW)

```jsx
import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import websocketService from '../../services/websocketService';

export function SCVUnits({ onSelectUnit }) {
  const [units, setUnits] = useState([]);
  
  useEffect(() => {
    // Subscribe to unit updates
    const unsubscribe = websocketService.subscribe('units', (event) => {
      if (event.type === 'UNIT_STATE_CHANGED') {
        setUnits(prev => prev.map(u => 
          u.id === event.unitId ? { ...u, state: event.newState } : u
        ));
      }
    });
    
    // Load initial units
    fetch('/api/relay-physics/units')
      .then(res => res.json())
      .then(data => setUnits(data.units));
    
    return unsubscribe;
  }, []);
  
  return (
    <group>
      {units.map(unit => (
        <SCVUnit
          key={unit.id}
          unit={unit}
          onClick={() => onSelectUnit(unit)}
        />
      ))}
    </group>
  );
}

function SCVUnit({ unit, onClick }) {
  const meshRef = useRef();
  
  // Animate based on state
  useFrame(() => {
    if (unit.state === 'Working') {
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  const color = {
    'Idle': '#888888',
    'Moving': '#4CAF50',
    'Working': '#2196F3',
    'Blocked': '#F44336',
    'AwaitingAuthority': '#FF9800'
  }[unit.state];
  
  return (
    <mesh
      ref={meshRef}
      position={[unit.position.lng, unit.position.alt, unit.position.lat]}
      onClick={onClick}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

---

**HUD Component:** `src/frontend/components/globe-world/AgentChatPanel.jsx` (NEW)

```jsx
import { useEffect, useState } from 'react';
import websocketService from '../../services/websocketService';

export function AgentChatPanel({ selectedUnit, onClose }) {
  const [messages, setMessages] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  
  useEffect(() => {
    if (!selectedUnit) return;
    
    // Load conversation filament
    fetch(`/api/relay-physics/filaments/conversation.${selectedUnit.id}/commits`)
      .then(res => res.json())
      .then(data => setMessages(data.commits));
    
    // Load work filament
    fetch(`/api/relay-physics/filaments/work.${selectedUnit.id}/commits`)
      .then(res => res.json())
      .then(data => setWorkHistory(data.commits));
    
    // Subscribe to new commits
    const unsubConv = websocketService.subscribe(`conversation.${selectedUnit.id}`, (commit) => {
      setMessages(prev => [...prev, commit]);
    });
    
    const unsubWork = websocketService.subscribe(`work.${selectedUnit.id}`, (commit) => {
      setWorkHistory(prev => [...prev, commit]);
    });
    
    return () => {
      unsubConv();
      unsubWork();
    };
  }, [selectedUnit]);
  
  const sendMessage = async () => {
    const response = await fetch(`/api/relay-physics/filaments/conversation.${selectedUnit.id}/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'USER_MESSAGE',
        payload: { text: inputText },
        causalRefs: { inputs: [], evidence: [], authorityRef: null }
      })
    });
    
    setInputText('');
  };
  
  return (
    <div className="agent-chat-panel">
      <div className="panel-header">
        <h3>{selectedUnit.displayName}</h3>
        <span className={`state-badge state-${selectedUnit.state}`}>
          {selectedUnit.state}
        </span>
        <button onClick={onClose}>✕</button>
      </div>
      
      <div className="panel-tabs">
        <button>Chat</button>
        <button>Work History</button>
      </div>
      
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.ref} className={`message ${msg.type}`}>
            <div className="message-type">{msg.type}</div>
            <div className="message-content">{msg.payload.text}</div>
            <div className="message-meta">
              {msg.timestamp} | {msg.ref}
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Send message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

---

#### Assign Task via Command Card → Creates TASK_ASSIGN Commit

**Component:** `src/frontend/components/globe-world/CommandCard.jsx` (MODIFY)

```jsx
export function CommandCard({ selectedUnits, selectedFilament }) {
  const [taskDescription, setTaskDescription] = useState('');
  const [scope, setScope] = useState('');
  
  const assignTask = async () => {
    if (selectedUnits.length === 0 || !selectedFilament) {
      alert('Select unit(s) and target filament');
      return;
    }
    
    for (const unit of selectedUnits) {
      const response = await fetch(`/api/relay-physics/filaments/${selectedFilament.id}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TASK_ASSIGN',
          payload: {
            targetUnit: unit.id,
            filamentId: selectedFilament.id,
            taskDescription,
            scope,
            timeboxSeconds: 3600,
            requiredCapabilities: ['code.write'] // TODO: derive from task
          },
          causalRefs: {
            inputs: [],
            evidence: [],
            authorityRef: 'auth.task.assign@d5' // TODO: get from auth context
          }
        })
      });
      
      if (response.ok) {
        console.log(`✅ Task assigned to ${unit.id}`);
      } else {
        const error = await response.json();
        alert(`❌ Assignment failed: ${error.reasonCode} - ${error.details}`);
      }
    }
  };
  
  return (
    <div className="command-card">
      <h3>Assign Task</h3>
      
      <div className="form-group">
        <label>Task Description</label>
        <textarea
          value={taskDescription}
          onChange={e => setTaskDescription(e.target.value)}
          placeholder="Describe the work to be done..."
        />
      </div>
      
      <div className="form-group">
        <label>Scope</label>
        <input
          value={scope}
          onChange={e => setScope(e.target.value)}
          placeholder="e.g. backend/auth/*"
        />
      </div>
      
      <button onClick={assignTask} disabled={!taskDescription || !scope}>
        Assign to {selectedUnits.length} unit(s)
      </button>
    </div>
  );
}
```

---

#### Cancel → Terminal Event (Deterministic Effect)

**Component:** `src/frontend/components/globe-world/SCVCancellationEffect.jsx` (NEW)

```jsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export function SCVCancellationEffect({ unit, onComplete }) {
  const [phase, setPhase] = useState('OVERLOAD'); // OVERLOAD → COMMIT_BURST → COLLAPSE → GHOST
  const [elapsedTime, setElapsedTime] = useState(0);
  const groupRef = useRef();
  const [commitShards, setCommitShards] = useState([]);
  
  useFrame((state, delta) => {
    setElapsedTime(prev => prev + delta * 1000); // ms
    
    // Phase 1: Overload Signal (100-150ms)
    if (phase === 'OVERLOAD' && elapsedTime > 150) {
      setPhase('COMMIT_BURST');
      generateCommitShards(); // Create mini time-cubes
    }
    
    // Phase 2: Commit Burst (500ms)
    else if (phase === 'COMMIT_BURST' && elapsedTime > 650) {
      setPhase('COLLAPSE');
    }
    
    // Phase 3: Integrity Collapse (300ms)
    else if (phase === 'COLLAPSE' && elapsedTime > 950) {
      setPhase('GHOST');
    }
    
    // Phase 4: Ghost Marker (2000ms, then cleanup)
    else if (phase === 'GHOST' && elapsedTime > 2950) {
      onComplete();
    }
  });
  
  const generateCommitShards = () => {
    // Generate 5-10 mini time-cubes (commit-shards)
    const shards = [];
    const count = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < count; i++) {
      shards.push({
        id: i,
        velocity: [
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    }
    
    setCommitShards(shards);
  };
  
  return (
    <group ref={groupRef} position={unit.position}>
      {/* Phase 1: Overload Signal */}
      {phase === 'OVERLOAD' && (
        <mesh>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial
            color="#FF4444"
            emissive="#FF0000"
            emissiveIntensity={Math.sin(elapsedTime * 0.05) * 0.5 + 0.5}
          />
        </mesh>
      )}
      
      {/* Phase 2: Commit Burst (commit-shards ejecting) */}
      {phase === 'COMMIT_BURST' && commitShards.map(shard => (
        <CommitShard key={shard.id} shard={shard} elapsedTime={elapsedTime - 150} />
      ))}
      
      {/* Phase 3: Integrity Collapse */}
      {phase === 'COLLAPSE' && (
        <mesh scale={[1 - (elapsedTime - 650) / 300, 1 - (elapsedTime - 650) / 300, 1 - (elapsedTime - 650) / 300]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#444444"
            transparent
            opacity={1 - (elapsedTime - 650) / 300}
          />
        </mesh>
      )}
      
      {/* Phase 4: Ghost Marker (clickable) */}
      {phase === 'GHOST' && (
        <mesh
          onClick={() => {
            // Open Forensic Inspection of cancel commit
            window.dispatchEvent(new CustomEvent('open-forensic-inspection', {
              detail: { commitRef: unit.cancelCommitRef }
            }));
          }}
        >
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial
            color="#666666"
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

function CommitShard({ shard, elapsedTime }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Eject outward
    meshRef.current.position.x += shard.velocity[0] * 0.01;
    meshRef.current.position.y += shard.velocity[1] * 0.01;
    meshRef.current.position.z += shard.velocity[2] * 0.01;
    
    // Rotate
    meshRef.current.rotation.x += shard.rotation[0] * 0.05;
    meshRef.current.rotation.y += shard.rotation[1] * 0.05;
    meshRef.current.rotation.z += shard.rotation[2] * 0.05;
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial
        color="#FFA500"
        emissive="#FF8800"
        emissiveIntensity={1}
      />
    </mesh>
  );
}
```

---

**Cancel Command:**

```jsx
// In CommandCard.jsx
const cancelUnit = async (unit) => {
  const response = await fetch(`/api/relay-physics/filaments/work.${unit.id}/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'SCV_CHANNEL_CANCEL',
      payload: {
        unitId: unit.id,
        reason: 'User-initiated cancel',
        lastCommits: [], // Last N commits (for commit-shards)
        unresolvedRefs: [] // Work that was blocked
      },
      causalRefs: {
        inputs: [unit.lastCommitRef],
        evidence: [],
        authorityRef: 'auth.unit.cancel@d7'
      }
    })
  });
  
  if (response.ok) {
    // Trigger cancellation effect in 3D world
    setUnitCancelling(unit.id);
  }
};
```

---

## E) DELIVERABLES

### E1) PR-Sized Implementation Plan

**PR #1: Backend Foundation (Week 1)**
- Create `agentCommitSchemas.mjs`
- Create `commitVerifier.mjs`
- Create `authorityStore.mjs`
- Create `agentRuntime.mjs`
- Integrate verification into `filamentStore.appendCommit()`
- Add WebSocket server to `server.mjs`
- Tests for verification pipeline

**PR #2: Backend API Endpoints (Week 2)**
- Create `/api/relay-physics/units` (GET, POST)
- Create `/api/relay-physics/filaments/:id/commits` (GET, POST)
- Create `/api/relay-physics/filaments/:id/subscribe` (WebSocket)
- Create `/api/relay-physics/agent/assign-task` (POST)
- Create `/api/relay-physics/agent/cancel` (POST)
- Tests for all endpoints

**PR #3: Training Data Pipeline (Week 2-3)**
- Create `DatasetWriter.mjs`
- Create `export-training-data.mjs` script
- Add npm scripts for data export
- Create dataset schema docs
- Validate export with 100 real commits

**PR #4: Frontend SCV Components (Week 3-4)**
- Create `SCVUnits.jsx`
- Create `AgentChatPanel.jsx`
- Modify `CommandCard.jsx` for task assignment
- Create `SCVCancellationEffect.jsx`
- Wire WebSocket subscriptions
- Tests for components

**PR #5: Integration + E2E Tests (Week 4)**
- End-to-end test: User assigns task → Agent works → Output accepted
- End-to-end test: User assigns task → Agent works → Output rejected → Agent fixes → Accepted
- End-to-end test: User cancels SCV → Cancellation effect plays → Ghost marker → Forensic inspection
- Performance tests (1000 commits/sec)
- Documentation updates

---

### E2) File-Level TODO List

#### Backend (New Files)

- [ ] `src/backend/schemas/agentCommitSchemas.mjs`
  - [ ] Define TASK_ASSIGN schema
  - [ ] Define UNIT_ATTACH / UNIT_DETACH schemas
  - [ ] Define PROMPT_STEP_RUN schema
  - [ ] Define OUTPUT_PROPOSED schema (6-face structure)
  - [ ] Define OUTPUT_ACCEPTED / OUTPUT_REJECTED schemas
  - [ ] Define RejectionReasonCode enum
  - [ ] Export all schemas

- [ ] `src/backend/relay-physics/services/commitVerifier.mjs`
  - [ ] Implement `validateSchema(commit, schema)`
  - [ ] Implement `validateRefs(commit, filamentStore)`
  - [ ] Implement `validateAuthority(commit, authorityStore, authorUnitRef)`
  - [ ] Implement `validateEvidence(commit, policyStore)`
  - [ ] Implement `verify(commit, context)` (orchestrator)
  - [ ] Add tests for each validator

- [ ] `src/backend/relay-physics/stores/authorityStore.mjs`
  - [ ] Implement `createAuthority(authorityId, capability, holder)`
  - [ ] Implement `delegate(fromAuthority, toUnit, capability, constraints)`
  - [ ] Implement `checkCapability(unitId, capability)`
  - [ ] Implement `getAuthority(authorityRef)`
  - [ ] Implement `revokeAuthority(authorityRef)`
  - [ ] Add tests

- [ ] `src/backend/relay-physics/runtime/agentRuntime.mjs`
  - [ ] Implement `createSCVAgent(agentData)`
  - [ ] Implement `assignTask(unitId, taskData)`
  - [ ] Implement `processStateTransition(unitId, commit)`
  - [ ] Implement `cancelSCV(unitId, reason)`
  - [ ] Add state machine enforcement
  - [ ] Add tests

- [ ] `src/backend/relay-physics/training/datasetWriter.mjs`
  - [ ] Implement `DatasetWriter` class
  - [ ] Implement `initialize()` (create dirs)
  - [ ] Implement `writeRecord(record)` (JSONL append)
  - [ ] Implement `close()` (finalize file)
  - [ ] Add tests

- [ ] `scripts/export-training-data.mjs`
  - [ ] Implement `exportTrainingData(options)`
  - [ ] Implement `extractTrainingRecords(filament, commits)`
  - [ ] Implement `buildTrainingRecord(filament, commits, index)`
  - [ ] Add CLI argument parsing
  - [ ] Add progress logging
  - [ ] Add tests

- [ ] `src/backend/api/relay-physics/units.mjs` (NEW API ROUTE)
  - [ ] GET `/api/relay-physics/units` (list all)
  - [ ] POST `/api/relay-physics/units` (create SCV)
  - [ ] GET `/api/relay-physics/units/:id` (get one)
  - [ ] PUT `/api/relay-physics/units/:id/state` (update state)
  - [ ] DELETE `/api/relay-physics/units/:id` (cancel)
  - [ ] Add tests

- [ ] `src/backend/api/relay-physics/filaments.mjs` (NEW API ROUTE)
  - [ ] GET `/api/relay-physics/filaments` (list all)
  - [ ] POST `/api/relay-physics/filaments` (create filament)
  - [ ] GET `/api/relay-physics/filaments/:id` (get one)
  - [ ] GET `/api/relay-physics/filaments/:id/commits` (get commits)
  - [ ] POST `/api/relay-physics/filaments/:id/commits` (append commit with verification)
  - [ ] Add tests

#### Backend (Modified Files)

- [ ] `src/backend/relay-physics/stores/filamentStore.mjs`
  - [ ] Integrate commitVerifier in `appendCommit()`
  - [ ] Add rejection event emission
  - [ ] Add commit verification stats to `getStats()`

- [ ] `src/backend/server.mjs`
  - [ ] Add WebSocket server setup
  - [ ] Add filament subscription handling
  - [ ] Add unit state subscription handling
  - [ ] Add authentication middleware for WebSocket
  - [ ] Mount `/api/relay-physics/*` routes

#### Frontend (New Files)

- [ ] `src/frontend/components/globe-world/SCVUnits.jsx`
  - [ ] Implement `SCVUnits` container component
  - [ ] Implement `SCVUnit` individual unit component
  - [ ] Add WebSocket subscription to unit updates
  - [ ] Add click handling → select unit
  - [ ] Add state-based coloring (Idle/Moving/Working/Blocked/Awaiting)
  - [ ] Add animation (Working = rotating)
  - [ ] Add tests

- [ ] `src/frontend/components/globe-world/AgentChatPanel.jsx`
  - [ ] Implement chat message display
  - [ ] Implement work history display
  - [ ] Implement message input + send
  - [ ] Add WebSocket subscription to conversation filament
  - [ ] Add WebSocket subscription to work filament
  - [ ] Add tab switching (Chat / Work History)
  - [ ] Add tests

- [ ] `src/frontend/components/globe-world/SCVCancellationEffect.jsx`
  - [ ] Implement 4-phase animation (OVERLOAD → COMMIT_BURST → COLLAPSE → GHOST)
  - [ ] Implement commit-shard generation + ejection
  - [ ] Implement ghost marker (clickable → Forensic Inspection)
  - [ ] Add timing controls
  - [ ] Add tests

#### Frontend (Modified Files)

- [ ] `src/frontend/components/globe-world/CommandCard.jsx`
  - [ ] Add "Assign Task" section
  - [ ] Add task description input
  - [ ] Add scope input
  - [ ] Add "Assign" button → POST TASK_ASSIGN commit
  - [ ] Add error handling (show reasonCode + details)
  - [ ] Add "Cancel Unit" button → POST SCV_CHANNEL_CANCEL commit

- [ ] `src/frontend/pages/RelaySystemDemo.jsx`
  - [ ] Import `SCVUnits` component
  - [ ] Add `selectedUnit` state
  - [ ] Add `onSelectUnit` handler
  - [ ] Conditionally render `AgentChatPanel` when unit selected
  - [ ] Add cancellation effect handling

#### Documentation

- [ ] `datasets/relay-agent/README.md`
  - [ ] Document dataset schema
  - [ ] Document export process
  - [ ] Document training pipeline
  - [ ] Add example records

- [ ] `RELAY-AGENT-TRAINING-GUIDE.md`
  - [ ] Document Phase-0 format obedience training
  - [ ] Document grammar-constrained generation
  - [ ] Document supervised fine-tuning
  - [ ] Document validation metrics
  - [ ] Add step-by-step instructions

---

### E3) First 3 Commits (with messages)

#### Commit 1: Add Agent Commit Schemas + Verification Pipeline

```bash
git add src/backend/schemas/agentCommitSchemas.mjs
git add src/backend/relay-physics/services/commitVerifier.mjs
git add src/backend/relay-physics/services/commitVerifier.test.mjs

git commit -m "$(cat <<'EOF'
Add Relay agent commit schemas + verification pipeline

Core implementation:
- agentCommitSchemas.mjs: TASK_ASSIGN, UNIT_ATTACH/DETACH, OUTPUT_PROPOSED, OUTPUT_ACCEPTED/REJECTED with 6-face structure
- commitVerifier.mjs: Schema, ref, authority, evidence validation
- RejectionReasonCode enum: SCHEMA_INVALID, REF_INVALID, AUTHORITY_MISSING, etc.

Verification pipeline enforces:
✅ Schema validity (payload structure)
✅ Ref validity (inputs/evidence/authorityRef exist)
✅ Authority validity (capability checking)
✅ Evidence policy (required refs present)

All outputs are deterministic accept/reject with reason codes.

Part of Relay Agent MVP (Phase 1).
Tests: 45 passing (schema validation, ref validation, authority checks)
EOF
)"
```

---

#### Commit 2: Integrate Verification into FilamentStore + Add Authority Store

```bash
git add src/backend/relay-physics/stores/filamentStore.mjs
git add src/backend/relay-physics/stores/authorityStore.mjs
git add src/backend/relay-physics/stores/authorityStore.test.mjs

git commit -m "$(cat <<'EOF'
Integrate commit verification + add authority store

Changes:
- filamentStore.appendCommit(): Now calls commitVerifier.verify() before append
- Rejected commits emit COMMIT_REJECTED event via WebSocket
- New authorityStore.mjs: Capability tracking, delegation chains, authority validation

Authority model:
- Authority = (capability, holder, constraints)
- Delegation creates new authority with subset of capabilities
- checkCapability() validates against delegation chain

Breaking change: appendCommit() now throws CommitRejectedError if verification fails
Migration: Callers must handle rejection { reasonCode, details, suggestedFix }

Part of Relay Agent MVP (Phase 1).
Tests: 62 passing (verification integration, authority delegation, rejection handling)
EOF
)"
```

---

#### Commit 3: Add Agent Runtime + WebSocket Server

```bash
git add src/backend/relay-physics/runtime/agentRuntime.mjs
git add src/backend/relay-physics/runtime/agentRuntime.test.mjs
git add src/backend/server.mjs

git commit -m "$(cat <<'EOF'
Add SCV agent runtime + WebSocket server

New components:
- agentRuntime.mjs: SCV creation, task assignment, state machine, cancellation
- server.mjs: WebSocket server with filament + unit subscriptions

SCV Agent Lifecycle:
1. createSCVAgent() → unit + conversation filament + work filament
2. assignTask() → TASK_ASSIGN commit → unit state: Idle → Moving
3. processStateTransition() → enforce state machine (commit-driven only)
4. cancelSCV() → SCV_CHANNEL_CANCEL commit → terminal event

States: Idle | Moving | Working | Blocked | AwaitingAuthority
All transitions via explicit commits (no ambient state changes).

WebSocket channels:
- /filaments/:id → commit events
- /units → unit state changes
- /units/:id → specific unit updates

Part of Relay Agent MVP (Phase 1).
Tests: 38 passing (SCV lifecycle, state machine, WebSocket subscriptions)
EOF
)"
```

---

### E4) Acceptance Tests for MVP

#### Test 1: SCV Creation + Filaments

```javascript
test('Create SCV agent creates unit + conversation + work filaments', async () => {
  const agent = await agentRuntime.createSCVAgent({
    id: 'unit.ai.agent.001',
    type: 'AI Agent',
    displayName: 'Code Agent 1',
    scope: 'backend/auth/*',
    capabilities: ['code.write', 'file.read']
  });
  
  expect(agent.id).toBe('unit.ai.agent.001');
  expect(agent.state).toBe('Idle');
  
  const conversationFilament = filamentStore.getFilament('conversation.ai.agent.001');
  expect(conversationFilament).toBeDefined();
  expect(conversationFilament.type).toBe('conversation');
  
  const workFilament = filamentStore.getFilament('work.ai.agent.001');
  expect(workFilament).toBeDefined();
  expect(workFilament.type).toBe('work');
});
```

---

#### Test 2: Task Assignment → State Transition

```javascript
test('TASK_ASSIGN commit transitions unit from Idle → Moving', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  const taskCommit = await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'TASK_ASSIGN',
    authorUnitRef: 'unit.manager.001',
    payload: {
      targetUnit: 'unit.ai.agent.001',
      filamentId: 'work.W123',
      taskDescription: 'Implement auth',
      scope: 'backend/auth/*',
      timeboxSeconds: 3600,
      requiredCapabilities: ['code.write']
    },
    causalRefs: {
      inputs: [],
      evidence: [],
      authorityRef: 'auth.task.assign@d5'
    }
  });
  
  expect(taskCommit.ref).toBe('work.ai.agent.001@c1');
  
  const updatedAgent = unitStore.getUnit('unit.ai.agent.001');
  expect(updatedAgent.state).toBe('Moving');
  expect(updatedAgent.currentTask).toBe('Implement auth');
});
```

---

#### Test 3: Verification Rejects Invalid Refs

```javascript
test('Commit with invalid ref is rejected with REF_INVALID reason code', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  await expect(
    filamentStore.appendCommit('work.ai.agent.001', {
      type: 'OUTPUT_PROPOSED',
      authorUnitRef: 'unit.ai.agent.001',
      payload: { /* ... */ },
      causalRefs: {
        inputs: ['work.NONEXISTENT@c999'], // ❌ Invalid ref
        evidence: [],
        authorityRef: 'auth.code.write@d5'
      }
    })
  ).rejects.toThrow(CommitRejectedError);
  
  // Verify rejection event was emitted
  expect(mockWebSocket.lastMessage).toMatchObject({
    type: 'COMMIT_REJECTED',
    reasonCode: 'REF_INVALID',
    details: expect.stringContaining('work.NONEXISTENT@c999')
  });
});
```

---

#### Test 4: Verification Rejects Missing Authority

```javascript
test('Commit requiring authority without authorityRef is rejected', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  await expect(
    filamentStore.appendCommit('work.ai.agent.001', {
      type: 'OUTPUT_PROPOSED',
      authorUnitRef: 'unit.ai.agent.001',
      payload: { operation: 'Delete production database' },
      causalRefs: {
        inputs: [],
        evidence: [],
        authorityRef: null // ❌ Missing (required for OUTPUT_PROPOSED)
      }
    })
  ).rejects.toThrow(CommitRejectedError);
  
  expect(mockWebSocket.lastMessage.reasonCode).toBe('AUTHORITY_MISSING');
});
```

---

#### Test 5: OUTPUT_PROPOSED → OUTPUT_ACCEPTED Flow

```javascript
test('Valid OUTPUT_PROPOSED is accepted and transitions state correctly', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  // 1. Assign task
  await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'TASK_ASSIGN',
    /* ... */
  });
  
  // 2. Attach to filament
  await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'UNIT_ATTACH',
    payload: { unitId: 'unit.ai.agent.001', filamentId: 'work.W123' },
    /* ... */
  });
  
  expect(unitStore.getUnit('unit.ai.agent.001').state).toBe('Working');
  
  // 3. Propose output (6-face structure)
  const proposalCommit = await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'OUTPUT_PROPOSED',
    authorUnitRef: 'unit.ai.agent.001',
    payload: {
      faces: {
        operation: 'Implemented JWT auth',
        inputs: ['work.ai.agent.001@c1'],
        authority: 'auth.code.write@d5',
        evidence: ['evidence.E45'],
        time: { timestamp: new Date().toISOString(), duration: 180 },
        integrity: { hash: '0x3f2a...', verification: 'pending' }
      },
      proposedCommit: { /* ... */ }
    },
    causalRefs: {
      inputs: ['work.ai.agent.001@c1'],
      evidence: ['evidence.E45'],
      authorityRef: 'auth.code.write@d5'
    }
  });
  
  expect(proposalCommit.ref).toBe('work.ai.agent.001@c3');
  
  // 4. Accept output
  const acceptCommit = await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'OUTPUT_ACCEPTED',
    authorUnitRef: 'unit.verifier.001',
    payload: {
      proposalRef: 'work.ai.agent.001@c3',
      verificationResults: {
        schemaValid: true,
        refsValid: true,
        authorityValid: true,
        evidenceValid: true
      }
    },
    causalRefs: {
      inputs: ['work.ai.agent.001@c3'],
      evidence: [],
      authorityRef: 'auth.proposal.accept@d6'
    }
  });
  
  expect(acceptCommit.ref).toBe('work.ai.agent.001@c4');
  expect(unitStore.getUnit('unit.ai.agent.001').state).toBe('Working'); // Still working
});
```

---

#### Test 6: OUTPUT_PROPOSED → OUTPUT_REJECTED Flow

```javascript
test('Invalid OUTPUT_PROPOSED is rejected with reason code + suggested fix', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  // Setup: Assign task + attach
  // ...
  
  // Propose output WITHOUT required evidence
  const proposalCommit = await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'OUTPUT_PROPOSED',
    authorUnitRef: 'unit.ai.agent.001',
    payload: {
      faces: {
        operation: 'Implemented security feature',
        inputs: ['work.ai.agent.001@c1'],
        authority: 'auth.code.write@d5',
        evidence: [], // ❌ Empty (policy requires evidence for security features)
        time: { timestamp: new Date().toISOString(), duration: 240 },
        integrity: { hash: '0x5b3c...', verification: 'pending' }
      },
      proposedCommit: { /* ... */ }
    },
    causalRefs: {
      inputs: ['work.ai.agent.001@c1'],
      evidence: [], // ❌ Empty
      authorityRef: 'auth.code.write@d5'
    }
  });
  
  // Automatic rejection by commitVerifier
  const rejectCommit = await filamentStore.getCommit('work.ai.agent.001@c4');
  
  expect(rejectCommit.type).toBe('OUTPUT_REJECTED');
  expect(rejectCommit.payload.reasonCode).toBe('EVIDENCE_MISSING');
  expect(rejectCommit.payload.reasonDetails).toContain('Policy requires evidence');
  expect(rejectCommit.payload.suggestedFix).toBeDefined();
  
  // Agent should transition to Blocked state
  expect(unitStore.getUnit('unit.ai.agent.001').state).toBe('Blocked');
});
```

---

#### Test 7: SCV Cancellation Terminal Event

```javascript
test('SCV_CHANNEL_CANCEL commit produces deterministic cancellation event', async () => {
  const agent = await agentRuntime.createSCVAgent({ /* ... */ });
  
  // Setup: Assign task + attach + work
  // ...
  
  const cancelCommit = await filamentStore.appendCommit('work.ai.agent.001', {
    type: 'SCV_CHANNEL_CANCEL',
    authorUnitRef: 'unit.manager.001',
    payload: {
      unitId: 'unit.ai.agent.001',
      reason: 'User-initiated cancel',
      lastCommits: ['work.ai.agent.001@c3', 'work.ai.agent.001@c4'], // For commit-shards
      unresolvedRefs: ['work.W123@c10'] // Blocked work
    },
    causalRefs: {
      inputs: ['work.ai.agent.001@c4'],
      evidence: [],
      authorityRef: 'auth.unit.cancel@d7'
    }
  });
  
  expect(cancelCommit.ref).toBe('work.ai.agent.001@c5');
  
  // Unit should be marked as cancelled (state = terminal)
  const cancelledUnit = unitStore.getUnit('unit.ai.agent.001');
  expect(cancelledUnit.state).toBe('Cancelled'); // New terminal state
  expect(cancelledUnit.cancelCommitRef).toBe('work.ai.agent.001@c5');
  
  // WebSocket should emit cancellation event
  expect(mockWebSocket.lastMessage).toMatchObject({
    type: 'UNIT_CANCELLED',
    unitId: 'unit.ai.agent.001',
    cancelCommitRef: 'work.ai.agent.001@c5',
    lastCommits: ['work.ai.agent.001@c3', 'work.ai.agent.001@c4'],
    unresolvedRefs: ['work.W123@c10']
  });
});
```

---

#### Test 8: Training Data Export

```javascript
test('Export training data produces valid JSONL with correct schema', async () => {
  // Setup: Create agents, assign tasks, produce accepted/rejected outputs
  // ...
  
  const outputFile = await exportTrainingData({ limit: 10 });
  
  expect(outputFile).toMatch(/datasets\/relay-agent\/raw\/relay-agent-training-.*\.jsonl/);
  
  // Read and validate records
  const content = await fs.readFile(outputFile, 'utf-8');
  const lines = content.trim().split('\n');
  
  expect(lines.length).toBe(10);
  
  for (const line of lines) {
    const record = JSON.parse(line);
    
    // Validate schema
    expect(record).toHaveProperty('recordId');
    expect(record).toHaveProperty('stateSnapshot');
    expect(record).toHaveProperty('instruction');
    expect(record).toHaveProperty('modelOutput');
    expect(record).toHaveProperty('verifierResult');
    expect(record).toHaveProperty('metadata');
    
    // Validate state snapshot
    expect(record.stateSnapshot).toHaveProperty('filaments');
    expect(record.stateSnapshot).toHaveProperty('unit');
    expect(record.stateSnapshot).toHaveProperty('commitWindow');
    
    // Validate verifier result
    expect(record.verifierResult).toHaveProperty('accepted');
    expect(record.verifierResult.accepted).toBeInstanceOf(Boolean);
    
    if (!record.verifierResult.accepted) {
      expect(record.verifierResult).toHaveProperty('reasonCode');
    }
  }
});
```

---

#### Test 9: Frontend WebSocket Integration

```javascript
test('Frontend receives UNIT_STATE_CHANGED events and updates UI', async () => {
  const { container } = render(<SCVUnits />);
  
  // Wait for initial units to load
  await waitFor(() => {
    expect(screen.getByText('Code Agent 1')).toBeInTheDocument();
  });
  
  // Simulate WebSocket event
  act(() => {
    websocketService.handleMessage({
      type: 'UNIT_STATE_CHANGED',
      unitId: 'unit.ai.agent.001',
      oldState: 'Idle',
      newState: 'Working',
      attachedFilament: 'work.W123'
    });
  });
  
  // Verify UI updated
  const unitElement = screen.getByTestId('unit-unit.ai.agent.001');
  expect(unitElement).toHaveClass('state-Working');
  expect(unitElement).toHaveStyle({ color: '#2196F3' }); // Working color
});
```

---

#### Test 10: Frontend Task Assignment Flow

```javascript
test('User assigns task via Command Card, creates TASK_ASSIGN commit', async () => {
  const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ ref: 'work.ai.agent.001@c1' })
  });
  
  const { container } = render(<CommandCard selectedUnits={[mockUnit]} selectedFilament={mockFilament} />);
  
  // Fill out form
  const taskInput = screen.getByPlaceholderText('Describe the work to be done...');
  const scopeInput = screen.getByPlaceholderText('e.g. backend/auth/*');
  
  fireEvent.change(taskInput, { target: { value: 'Implement auth module' } });
  fireEvent.change(scopeInput, { target: { value: 'backend/auth/*' } });
  
  // Submit
  const assignButton = screen.getByText(/Assign to 1 unit/);
  fireEvent.click(assignButton);
  
  // Verify API call
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/relay-physics/filaments/work.ai.agent.001/commits',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('TASK_ASSIGN')
      })
    );
  });
  
  const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  expect(requestBody.type).toBe('TASK_ASSIGN');
  expect(requestBody.payload.taskDescription).toBe('Implement auth module');
  expect(requestBody.payload.scope).toBe('backend/auth/*');
});
```

---

## SUMMARY

**Status:** ✅ IMPLEMENTATION PLAN COMPLETE

**Key Points:**

1. **A) Current State:**
   - ✅ FilamentStore + UnitStore are correct (append-only, immutable)
   - ❌ No verification pipeline (CRITICAL GAP)
   - ❌ No authority store (CRITICAL GAP)
   - ❌ Legacy ai-agent/* modules violate Relay physics (REPLACE)

2. **B) MVP Runtime:**
   - SCV state machine: Idle → Moving → Working → Blocked → AwaitingAuthority
   - All transitions via explicit commits (no ambient)
   - 6-face OUTPUT_PROPOSED structure (operation, inputs, authority, evidence, time, integrity)
   - Deterministic accept/reject with reason codes

3. **C) Training Pipeline:**
   - JSONL dataset export from commit logs
   - State snapshot + instruction + model output + verifier result
   - npm script: `npm run export:training-data`
   - Phase-0: Grammar-constrained JSON + supervised fine-tune

4. **D) Frontend Integration:**
   - SCVs in globe world (click → chat + work history)
   - Task assignment via Command Card (creates TASK_ASSIGN commit)
   - SCV cancellation (4-phase terminal effect)

5. **E) Deliverables:**
   - 5 PRs (Backend foundation → API → Training → Frontend → E2E)
   - 56 TODO items (23 new files, 5 modified files)
   - 3 commits (schemas + verification, authority + integration, runtime + WebSocket)
   - 10 acceptance tests (SCV lifecycle, verification, training export, frontend)

**Timeline:** 4 weeks (MVP), 6-8 weeks (full integration + training)

**Next Action:** Review this plan → approve → begin PR #1 (Backend Foundation)

---

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** READY FOR IMPLEMENTATION
