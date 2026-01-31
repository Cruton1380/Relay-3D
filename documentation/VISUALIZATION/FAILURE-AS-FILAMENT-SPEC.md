# ⚠️ Failure as First-Class Filament — Canonical Model

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Errors, crashes, inconsistencies, and contradictions are filaments, not logs. If it happened, it exists."**

This is not a feature. This is **physics**. In Relay, failure is not hidden in logs, silenced by try-catch, or swept into error tables. **Failure is authoritative truth.**

---

## Table of Contents

1. [The Problem with Logs](#the-problem-with-logs)
2. [Failure as Filament](#failure-as-filament)
3. [Types of Failure Filaments](#types-of-failure-filaments)
4. [Failure Commit Schema](#failure-commit-schema)
5. [Rendering Failures](#rendering-failures)
6. [Recovery as Geometry](#recovery-as-geometry)
7. [Audit & Forensics](#audit--forensics)
8. [Real-World Examples](#real-world-examples)
9. [Anti-Patterns](#anti-patterns)
10. [FAQ](#faq)

---

## The Problem with Logs

### Traditional Error Handling

**Errors are second-class citizens:**
- Logged to files (can be deleted)
- Caught and swallowed (silent failures)
- Stored in separate "error tables" (disconnected from truth)
- Blamed on "user error" or "network issues" (no accountability)

**Result:**
- Failures are invisible
- Root causes are lost
- Patterns are undetectable
- Accountability is impossible

**Example (Traditional):**
```javascript
try {
  const result = importExcel('budget.xlsx');
  database.save(result);
} catch (error) {
  console.error('Import failed:', error);  // ❌ Lost to logs
  return { success: false, error: error.message };
}
```

**Problems:**
- Error is logged, then forgotten
- No filament created
- No audit trail
- No way to query "How many imports failed last month?"

---

## Failure as Filament

### Core Principle

**Every failure is a truth event.**

If:
- Import fails → failure filament created
- Gate rejects → rejection filament created
- Process crashes → crash filament created
- Security violation detected → violation filament created

**Why:**
- Failures are patterns (detectable via geometry)
- Failures are accountability (actor attribution)
- Failures are evidence (for audits, investigations)
- Failures compound (cascading failures = topology)

---

### Failure Filament Properties

**Like all filaments:**
- Immutable (cannot be deleted)
- Auditable (full commit history)
- Topology-aware (references cause)
- Privacy-gated (L0-L6 visibility)
- Evidence-backed (stack traces, logs attached)

**Unique to failure filaments:**
- **Glyph**: `DENT` (disruption, anomaly)
- **Color**: Red (by convention)
- **Magnitude**: Severity (Y-axis)
- **Recovery**: `SCAR` glyph when resolved

---

## Types of Failure Filaments

### 1. Import Failure

**Scenario:** Excel file cannot be parsed.

**Filament:**
```javascript
{
  filamentId: 'failure:import:excel:budget-2026.xlsx',
  commits: [
    {
      commitIndex: 0,
      ts: Date.now(),
      actor: { kind: 'system', id: 'import-service' },
      op: 'IMPORT_FAILED',
      payload: {
        sourceFile: 'budget.xlsx',
        sourceType: 'excel',
        errorType: 'PARSE_ERROR',
        errorMessage: 'Invalid cell reference: Sheet1!#REF!',
        attemptedAdapter: 'ExcelImportAdapter@1.0.0'
      },
      evidence: {
        stackTrace: '...',
        fileSize: 2457600,
        fileChecksum: 'sha256:abc123...',
        attemptTimestamp: 1738024800000
      }
    }
  ]
}
```

**Rendering:**
- Red DENT glyph at time of failure
- Hover: Shows error message
- Topology: No refs.inputs (import is entry point)

---

### 2. Gate Rejection

**Scenario:** Budget increase requires approval, none provided.

**Filament:**
```javascript
{
  filamentId: 'failure:gate:budget-2026:commit-42',
  commits: [
    {
      commitIndex: 0,
      ts: Date.now(),
      actor: { kind: 'user', id: 'user:bob' },
      op: 'GATE_REJECTED',
      payload: {
        targetFilament: 'budget-2026',
        targetCommit: 42,
        operation: 'INCREASE_BUDGET',
        requiredGate: 'APPROVAL',
        requiredSignatures: 2,
        providedSignatures: 0,
        reason: 'No approvers signed'
      },
      refs: {
        inputs: [
          { filamentId: 'budget-2026', commitIndex: 42 }
        ]
      }
    }
  ]
}
```

**Rendering:**
- Red DENT at merge point
- Topology ray: Points back to attempted commit
- Timeline: Shows when rejection occurred

---

### 3. Process Crash

**Scenario:** Backend service crashes during commit.

**Filament:**
```javascript
{
  filamentId: 'failure:crash:commit-service:2026-01-28T00:30:00Z',
  commits: [
    {
      commitIndex: 0,
      ts: Date.now(),
      actor: { kind: 'system', id: 'commit-service-pod-7' },
      op: 'PROCESS_CRASHED',
      payload: {
        serviceName: 'commit-service',
        podId: 'pod-7',
        exitCode: 1,
        signal: 'SIGKILL',
        errorType: 'OUT_OF_MEMORY',
        lastOperation: 'appendCommit',
        lastFilament: 'budget-2026'
      },
      evidence: {
        stackTrace: '...',
        memoryUsage: 4096000000,
        cpuUsage: 0.98,
        openFileDescriptors: 1024,
        lastLogLines: ['...']
      }
    }
  ]
}
```

**Rendering:**
- Red DENT with "crash" label
- Topology: Points to last filament being processed
- Timeline: Shows crash moment in context

---

### 4. Security Violation

**Scenario:** User attempts unauthorized access.

**Filament:**
```javascript
{
  filamentId: 'failure:security:unauthorized-access:user-alice',
  commits: [
    {
      commitIndex: 0,
      ts: Date.now(),
      actor: { kind: 'user', id: 'user:alice' },
      op: 'ACCESS_DENIED',
      payload: {
        targetFilament: 'payroll-2026',
        requestedTier: 'L6',
        allowedTier: 'L0',
        attemptedOperation: 'READ',
        reason: 'Insufficient permission'
      },
      refs: {
        inputs: [
          { filamentId: 'payroll-2026', commitIndex: 'latest' }
        ]
      },
      evidence: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'session-abc123',
        timestamp: 1738024800000
      }
    }
  ]
}
```

**Rendering:**
- Red DENT at attempted access time
- Privacy: Visible only to security team (L5+)
- Topology: Points to target filament

---

### 5. Consistency Violation

**Scenario:** Accounting ledger out of balance.

**Filament:**
```javascript
{
  filamentId: 'failure:consistency:ledger-2026-Q1',
  commits: [
    {
      commitIndex: 0,
      ts: Date.now(),
      actor: { kind: 'system', id: 'integrity-checker' },
      op: 'CONSISTENCY_VIOLATION',
      payload: {
        violationType: 'LEDGER_IMBALANCE',
        expectedBalance: 0,
        actualBalance: 1000.50,
        affectedPostings: [
          { filamentId: 'posting.POST-123', commitIndex: 5 },
          { filamentId: 'posting.POST-124', commitIndex: 3 }
        ]
      },
      refs: {
        inputs: [
          { filamentId: 'posting.POST-123', commitIndex: 5 },
          { filamentId: 'posting.POST-124', commitIndex: 3 }
        ]
      }
    }
  ]
}
```

**Rendering:**
- Red DENT with "consistency violation" label
- Topology: Rays to all affected postings
- Timeline: Shows when violation was detected

---

## Failure Commit Schema

### Standard Envelope

All failure commits use the base envelope:
```typescript
interface FailureCommit {
  filamentId: string;          // failure:<type>:<id>
  commitIndex: number;
  ts: number;                  // When failure occurred
  actor: Actor;                // Who/what caused failure
  op: FailureOperation;        // Type of failure
  payload: FailurePayload;     // Failure-specific data
  refs?: {
    inputs?: Array<CommitRef>; // Causal references (what failed)
  };
  evidence?: FailureEvidence;  // Stack traces, logs, etc.
}

type FailureOperation = 
  | 'IMPORT_FAILED'
  | 'GATE_REJECTED'
  | 'PROCESS_CRASHED'
  | 'ACCESS_DENIED'
  | 'CONSISTENCY_VIOLATION'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'VALIDATION_FAILED'
  | 'CONFLICT_DETECTED';
```

---

### Evidence Schema

```typescript
interface FailureEvidence {
  stackTrace?: string;         // Full stack trace
  errorCode?: string;          // Machine-readable code
  errorMessage?: string;       // Human-readable message
  context?: object;            // Additional context
  attemptCount?: number;       // Retry attempts
  lastSuccessTimestamp?: number; // When it last worked
  affectedUsers?: string[];    // Who was impacted
  recoveryAction?: string;     // Suggested fix
}
```

---

## Rendering Failures

### Visual Encoding

**Glyph:** `DENT` (disruption)
```
    ╱╲
   ╱  ╲
  ╱ !! ╲
 ╱______╲
```

**Color:** Red (#ff0000)

**Size:** Proportional to severity (Y-axis magnitude)

**Opacity:** Fades with age (unless unresolved)

---

### Severity Levels

**Critical (Y = 10):**
- Process crash
- Data corruption
- Security breach
- System-wide failure

**High (Y = 7):**
- Gate rejection (financial)
- Access violation
- Consistency violation

**Medium (Y = 4):**
- Import failure
- Validation error
- Timeout

**Low (Y = 1):**
- Network hiccup
- Retry succeeded
- Warning (not fatal)

---

### Timeline View

Failures appear as **red DENT glyphs** along the timeline:
```
Timeline:
  |----[STAMP]----[GATE]----[DENT]----[SCAR]---->
                           ↑
                      Failure here
```

**Hover:** Shows error message + evidence  
**Click:** Opens failure detail panel  
**Topology:** Shows dependency rays to cause

---

## Recovery as Geometry

### SCAR Glyph (Recovery)

When a failure is resolved, a **SCAR commit** is appended:
```javascript
{
  commitIndex: 1,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:ops-team' },
  op: 'FAILURE_RESOLVED',
  payload: {
    resolutionType: 'MANUAL_FIX',
    resolutionNote: 'Re-imported file after fixing cell reference',
    resolutionCommit: { filamentId: 'budget-2026', commitIndex: 50 }
  }
}
```

**Rendering:**
- SCAR glyph appears after DENT
- Color shifts: Red → Yellow (resolved but visible)
- Topology: Points to resolution commit

**Key invariant:**
> Failures are never deleted. They are resolved (SCAR) but remain visible in history.

---

## Audit & Forensics

### Query Failures

**Traditional:**
```sql
SELECT * FROM error_logs WHERE timestamp > '2026-01-01';
```
- Assumes logs weren't deleted
- No causality
- No topology

**Relay:**
```javascript
// Query failure filaments
const failures = queryFilaments({
  filamentIdPattern: 'failure:*',
  timeRange: { start: '2026-01-01', end: '2026-02-01' }
});

// Group by type
const byType = groupBy(failures, f => f.commits[0].op);

// Find cascading failures (topology)
const cascading = failures.filter(f => 
  f.commits[0].refs?.inputs?.some(ref => 
    ref.filamentId.startsWith('failure:')
  )
);
```

**Benefits:**
- Failures are first-class truth
- Topology reveals cascades
- Privacy Ladder governs access

---

### Failure Patterns

**Detect patterns via geometry:**

**Pattern 1: Repeated Import Failures**
```javascript
// Find files that fail repeatedly
const repeatedFailures = failures
  .filter(f => f.filamentId.startsWith('failure:import'))
  .filter(f => f.commits.length > 3); // 3+ attempts

// → "budget.xlsx has failed import 5 times"
```

**Pattern 2: Cascading Failures**
```javascript
// Find failures caused by other failures
const cascades = failures
  .filter(f => f.commits[0].refs?.inputs?.some(ref =>
    ref.filamentId.startsWith('failure:')
  ));

// → "Process crash caused 15 downstream timeouts"
```

**Pattern 3: Security Violations**
```javascript
// Find users with repeated access denials
const suspiciousUsers = failures
  .filter(f => f.commits[0].op === 'ACCESS_DENIED')
  .reduce((acc, f) => {
    const userId = f.commits[0].actor.id;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {});

// → "user:alice attempted unauthorized access 12 times"
```

---

## Real-World Examples

### Example 1: Excel Import Failure (Recoverable)

**Scenario:** User uploads malformed Excel file.

**Filament created:**
```javascript
failure:import:excel:budget-2026.xlsx
  ↳ IMPORT_FAILED (corrupted cell reference)
```

**User fixes file, re-uploads:**
```javascript
budget-2026 (success)
  ↳ imports successfully
  
failure:import:excel:budget-2026.xlsx
  ↳ FAILURE_RESOLVED (SCAR: points to successful import)
```

**Result:** Failure visible in audit, but resolved.

---

### Example 2: Gate Rejection (Governance)

**Scenario:** Budget increase attempted without approval.

**Filament created:**
```javascript
failure:gate:budget-2026:commit-42
  ↳ GATE_REJECTED (no signatures)
```

**Manager approves, retry succeeds:**
```javascript
budget-2026
  ↳ GATE (approval commit)
  ↳ INCREASE_BUDGET (succeeds)
  
failure:gate:budget-2026:commit-42
  ↳ FAILURE_RESOLVED (SCAR: points to approved commit)
```

---

### Example 3: Process Crash (Unrecoverable)

**Scenario:** Backend crashes during commit.

**Filament created:**
```javascript
failure:crash:commit-service:2026-01-28T00:30:00Z
  ↳ PROCESS_CRASHED (out of memory)
```

**Ops team investigates, scales service:**
```javascript
failure:crash:commit-service:2026-01-28T00:30:00Z
  ↳ PROCESS_CRASHED
  ↳ INVESTIGATION_COMPLETE (SCAR: root cause identified, service scaled)
```

**Result:** Crash visible forever (audit trail), but marked as investigated.

---

## Anti-Patterns

### ❌ Swallowing Errors

**Bad:**
```javascript
try {
  importExcel('file.xlsx');
} catch (error) {
  console.error('Failed:', error);  // ❌ Lost
  return { success: false };
}
```

**Good:**
```javascript
try {
  importExcel('file.xlsx');
} catch (error) {
  // Create failure filament
  const failureFilament = createFilament(`failure:import:excel:file.xlsx`);
  appendCommit(failureFilament, {
    op: 'IMPORT_FAILED',
    payload: {
      errorType: error.name,
      errorMessage: error.message
    },
    evidence: {
      stackTrace: error.stack
    }
  });
  
  throw error; // ✅ Also propagate
}
```

---

### ❌ Deleting Failures

**Bad:**
```javascript
// Delete old errors
DELETE FROM error_logs WHERE timestamp < '2025-01-01';
```

**Good:**
```javascript
// Failures are immutable (cannot be deleted)
// If privacy requires, redact payload but preserve filament:
appendCommit(failureFilament, {
  op: 'FAILURE_REDACTED',
  payload: {
    redactionReason: 'Privacy policy',
    redactedFields: ['userEmail', 'ipAddress']
  }
});
```

---

### ❌ Silent Retries

**Bad:**
```javascript
async function importWithRetry(file) {
  for (let i = 0; i < 3; i++) {
    try {
      return await import(file);
    } catch (error) {
      // ❌ Silent retry, no trace
      if (i === 2) throw error;
    }
  }
}
```

**Good:**
```javascript
async function importWithRetry(file) {
  const failureFilament = createFilament(`failure:import:${file}`);
  
  for (let i = 0; i < 3; i++) {
    try {
      const result = await import(file);
      
      // Success after failures → SCAR
      if (i > 0) {
        appendCommit(failureFilament, {
          op: 'FAILURE_RESOLVED',
          payload: { attemptCount: i + 1, resolution: 'RETRY_SUCCEEDED' }
        });
      }
      
      return result;
    } catch (error) {
      // Record each attempt
      appendCommit(failureFilament, {
        op: 'IMPORT_FAILED',
        payload: { attemptNumber: i + 1, errorMessage: error.message }
      });
      
      if (i === 2) throw error;
    }
  }
}
```

---

## FAQ

### General

**Q: Won't this create too many failure filaments?**  
A: Yes, if you treat every error as a filament. Use judgment:
- Transient network hiccups → log only (not filament)
- Repeated pattern → filament
- User-visible failure → filament
- System-level failure → always filament

**Q: Can failures be deleted?**  
A: No. Failures are immutable truth. If privacy requires, **redact** (remove sensitive payload) but preserve the filament itself.

**Q: What if a failure is embarrassing?**  
A: Failures are governed by Privacy Ladder (L0-L6). Sensitive failures can be L0 (invisible) or L2 (structure only) to public, but L5 (visible) to ops/security teams.

---

### Technical

**Q: How do I create a failure filament?**  
A: Use the same `createFilament` + `appendCommit` pattern. Filament ID convention: `failure:<type>:<id>`.

**Q: Do failure filaments support branches?**  
A: Yes. If multiple recovery strategies are attempted, they can fork.

**Q: Can I query failures?**  
A: Yes. Failures are first-class filaments, queryable like any other.

---

### Governance

**Q: Who can see failure filaments?**  
A: Governed by Privacy Ladder + permissions. Typically:
- Ops/Security: L5+ (full visibility)
- Domain owners: L4+ (blurred system)
- Public: L0 (invisible)

**Q: Can users dispute failures?**  
A: Yes. Append a commit to the failure filament with `op: 'FAILURE_DISPUTED'`, create a competing branch if needed.

---

## Conclusion

Failure is not a bug. Failure is **reality**.

By treating failures as first-class filaments:
- ✅ Failures are auditable (full history)
- ✅ Failures are patterns (detectable via geometry)
- ✅ Failures are accountable (actor attribution)
- ✅ Failures compound (cascading failures = topology)
- ✅ Failures are recoverable (SCAR commits)

**The One-Sentence Lock:**

> **"In Relay, nothing is deleted, nothing is silent, and nothing is forgotten—failure is authoritative truth, rendered as geometry, governed by policy, and resolved with scars."**

---

**See Also:**
- [Temporal Physics Spec](TEMPORAL-PHYSICS-SPEC.md)
- [Cybersecurity Model](CYBERSECURITY-MODEL-SPEC.md)
- [Universal Import Spec](UNIVERSAL-IMPORT-SPEC.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
