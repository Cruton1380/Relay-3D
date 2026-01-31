# 🧱 LAYER ZERO — THE REAL FOUNDATION OF RELAY

**Version**: 1.0.0  
**Status**: Canonical Foundation (Below Filaments)  
**Last Updated**: 2026-01-28

---

## Critical Correction

**A filament is NOT the foundation of Relay.**

**A filament is already a derived object.**

**The foundation is: irreversible state transitions under constraint.**

**Filaments are just one way those transitions are rendered.**

---

## The One-Sentence Lock

> **"Relay is not a system of filaments—it is a system of irreversible state transitions, and filaments are merely the traces we choose to preserve and render."**

---

## Why This Matters

**Without this correction, Relay collapses into:**

- "Git, but prettier"
- "Spreadsheets, but auditable"
- "Graphs, but interactive"

**All of which are failures.**

**With this correction, Relay is:**

- "A system for authoring reality forward under constraint"

**Everything else emerges from that.**

---

## Table of Contents

1. [The Four Primitive Truths](#the-four-primitive-truths)
2. [What Filaments Actually Are](#what-filaments-actually-are)
3. [The Three Filament Classes](#the-three-filament-classes)
4. [Why "One Filament" Is Always Wrong](#why-one-filament-is-always-wrong)
5. [Accounting Hierarchy Fix](#accounting-hierarchy-fix)
6. [Multi-Filament Reality](#multi-filament-reality)
7. [What This Changes](#what-this-changes)
8. [Foundation Checklist](#foundation-checklist)

---

## The Four Primitive Truths

**Before filaments, commits, timeboxes, graphs, or views, Relay has only four primitive truths:**

---

### 1. State Exists

**Definition:** Something is in a particular condition.

**Properties:**
- No meaning yet
- No structure yet
- Just: this state now exists

**Example:**
```
State: "A purchase order with ID PO-1001 exists"
```

**NOT:**
- ❌ A document
- ❌ A file
- ❌ A database row
- ❌ A workflow instance

**IS:**
- ✅ A condition that is currently true

---

### 2. Transitions Are Irreversible

**Definition:** A state can only move forward by an explicit action under explicit constraints, leaving evidence.

**Properties:**
- No mutation
- No recomputation
- No silent overwrite
- This is physics, not versioning

**Example:**
```
State A: PO-1001 is created
    ↓ (irreversible transition)
State B: PO-1001 is approved
    ↓ (irreversible transition)
State C: PO-1001 is sent
```

**Cannot:**
- ❌ Revert to State A (only forward)
- ❌ Mutate State B (only append State C)
- ❌ Recompute State C (only record it once)

**Can:**
- ✅ Create new state (State D: PO-1001 is cancelled)
- ✅ Fork state (State C': PO-1001-fork is sent)

---

### 3. Constraints Are First-Class

**Definition:** A transition may require permission, quorum, proximity, matching, balance, time.

**Properties:**
- Constraints are not checks
- They are gates that define whether reality may advance

**Example:**
```
Transition: PO-1001 approved → sent

Constraints:
  - Permission: User has "send-po" authority
  - Quorum: 2 of 3 approvers signed
  - Balance: Budget has available funds
  - Time: Within fiscal year

If ALL constraints pass → transition exists
If ANY constraint fails → transition does not exist (not "rejected", just doesn't exist)
```

**Constraints are stateful:**
- They have their own lifecycle
- They evolve over time
- They reference other states

**Example:**
```
Constraint: "User Alice has send-po authority"

This is a state that:
  - Was created (authority granted)
  - May be revoked (authority removed)
  - Has evidence (who granted, when, why)
```

---

### 4. Evidence Is Mandatory

**Definition:** Every transition must leave who, when, why, under what authority, with what inputs.

**Properties:**
- If it didn't leave evidence, it didn't happen
- Evidence is append-only
- Evidence is immutable

**Example:**
```
Transition: PO-1001 approved

Evidence:
  - Who: User Alice (user:alice)
  - When: 2026-01-28T10:00:00Z
  - Why: "Budget approved"
  - Authority: Approval policy (policy:po-approval)
  - Inputs: PO-1001 (state B), Budget-2026 (state X)
  - Signature: 0x1234...
```

**Without evidence:**
- ❌ Cannot audit
- ❌ Cannot replay
- ❌ Cannot prove
- ❌ Cannot dispute

**With evidence:**
- ✅ Full audit trail
- ✅ Deterministic replay
- ✅ Cryptographic proof
- ✅ Disputable (fork if disagreement)

---

## What Filaments Actually Are

### Correct Definition

**A filament is: a persistent identity traced through successive irreversible state transitions.**

**That's it.**

---

### What Filaments Are NOT

- ❌ A document
- ❌ A file
- ❌ A row
- ❌ A process
- ❌ A workflow
- ❌ A tree
- ❌ A graph
- ❌ A timeline

---

### What Filaments ARE

**A filament exists only because multiple transitions share an identity anchor.**

**Example:**
```
Identity: PO-1001

Transitions:
  State 0: PO_CREATED
  State 1: LINE_ADDED
  State 2: PO_APPROVED
  State 3: PO_SENT

Filament: po:PO-1001
  = The trace of transitions 0→1→2→3 with identity "PO-1001"
```

**Key insight:** The filament is the **trace**, not the **thing**.

The thing is the state.

The filament is how we render the history of state transitions.

---

## The Three Filament Classes

**There are three fundamental classes of filaments (not types, classes):**

---

### 1. Identity Filaments

**Purpose:** "What thing persists?"

**Definition:** Tracks the lifecycle of a named entity.

**Examples:**
- `po:PO-1001` (a purchase order)
- `user:alice` (a user)
- `invoice:INV-778` (an invoice)
- `posting:123` (a ledger posting)
- `character:wizard-x` (a game character)

**Properties:**
- Has a unique, stable identity
- Has a lifecycle (created → evolved → closed)
- References other filaments (inputs, evidence, constraints)

---

### 2. Constraint Filaments

**Purpose:** "What rules must be satisfied?"

**Definition:** Encodes allowed transitions (gates).

**Examples:**
- `policy:po-approval` (requires 2 of 3 approvers)
- `policy:double-entry` (debits = credits)
- `policy:match-3-way` (PO + receipt + invoice must align)
- `policy:privacy-tier` (L6 required for edit)
- `policy:consent-handshake` (mutual agreement required)

**Properties:**
- Does NOT store data
- Stores allowed transitions
- Has its own lifecycle (created → updated → deprecated)

**Example:**
```
Constraint Filament: policy:po-approval

State 0: POLICY_CREATED
  requiredApprovers: 2
  approverSet: ['user:alice', 'user:bob', 'user:charlie']

State 1: POLICY_UPDATED
  requiredApprovers: 3  (stricter)
  
State 2: POLICY_DEPRECATED
  reason: "Replaced by policy:po-approval-v2"
```

**Usage:**
```
Transition: PO-1001 approved

Constraint check:
  1. Read constraint:policy:po-approval (current state)
  2. Check: Have 2 of 3 approvers signed?
  3. If YES → transition exists
  4. If NO → transition does not exist
```

---

### 3. Evidence Filaments

**Purpose:** "What proves the transition happened?"

**Definition:** Append-only proof streams.

**Examples:**
- `evidence:signature:0x1234` (cryptographic signature)
- `evidence:iot-receipt:sensor-42` (IoT sensor reading)
- `evidence:ocr:invoice-778` (OCR extraction from PDF)
- `evidence:ai-proposal:gen-123` (AI-generated recommendation)
- `evidence:human-override:user-alice` (Manual exception)

**Properties:**
- Append-only (never modified)
- Immutable (cryptographically sealed)
- Referenced by transitions (not embedded)

**Example:**
```
Evidence Filament: evidence:signature:0x1234

State 0: SIGNATURE_CREATED
  signer: 'user:alice'
  signedData: hash('PO-1001-approved')
  signature: '0x1234...'
  timestamp: 2026-01-28T10:00:00Z

State 1: SIGNATURE_VERIFIED
  verifiedBy: 'system:crypto-service'
  verifiedAt: 2026-01-28T10:00:01Z
  valid: true
```

---

## Why "One Filament" Is Always Wrong

### The Question

**"It seems like there are layers of filaments—shouldn't there be just one?"**

---

### The Answer

**There is NEVER just one filament.**

**A single visible filament is always an illusion created by a lens.**

**Reality is many filaments, tightly constrained, sometimes locked together.**

---

### Example: "A PO Flow"

**What you see (lens):**
- One coherent purchase order workflow

**What actually exists (reality):**

**At least 6 filaments:**
1. `po:PO-1001` (identity: the purchase order)
2. `delivery:shipment-42` (identity: the shipment)
3. `receipt:GR-5001` (identity: the goods receipt)
4. `invoice:INV-778` (identity: the vendor invoice)
5. `match:PO-1001` (constraint: 3-way match validity)
6. `posting:123` + `posting:124` (identity: ledger pair, locked)

**Plus evidence filaments:**
- `evidence:signature:alice-approved-po`
- `evidence:iot-receipt:warehouse-scan`
- `evidence:ocr:invoice-pdf`

**Plus constraint filaments:**
- `policy:po-approval`
- `policy:match-3-way`
- `policy:double-entry`

**Total: ~12 filaments minimum**

**The fact that you see one coherent thing means the lens is working, not that reality is singular.**

---

### Why This Matters

**Single-filament thinking leads to:**
- "Git, but prettier" (version control of documents)
- "Spreadsheets, but auditable" (better Excel)

**Multi-filament thinking leads to:**
- "Authoring reality forward under constraint" (the real foundation)

---

## Accounting Hierarchy Fix

### The Question

**"General → subsidiary → department → cost center—how do these become filaments?"**

---

### The Wrong Answer

**"They are hierarchy filaments that form a tree."**

**Why wrong:** Hierarchy is a query concept. Relay forbids that.

---

### The Correct Answer

**They are allocation and attribution filaments.**

**A ledger posting does not point "up" in a tree.**

**It references allocation filaments that declare:**
- Purpose
- Scope
- Ownership
- Responsibility

---

### Example: Ledger Posting with Allocations

```typescript
// Identity filament: ledger posting
{
  filamentId: 'posting:98127',
  state: {
    account: 'AP',
    amount: 50000,
    currency: 'USD',
    direction: 'CREDIT'
  },
  refs: {
    allocations: [
      { filamentId: 'allocation:company:ACME', commitIndex: 15 },
      { filamentId: 'allocation:department:R&D', commitIndex: 8 },
      { filamentId: 'allocation:costCenter:CC-441', commitIndex: 3 }
    ]
  }
}
```

---

### Allocation Filaments Have Their Own Lifecycles

**Example: Department Allocation Filament**

```typescript
{
  filamentId: 'allocation:department:R&D',
  commits: [
    {
      commitIndex: 0,
      op: 'DEPARTMENT_CREATED',
      payload: { name: 'Research & Development', code: 'R&D' }
    },
    {
      commitIndex: 5,
      op: 'DEPARTMENT_RENAMED',
      payload: { oldName: 'R&D', newName: 'Innovation Lab' }
    },
    {
      commitIndex: 8,
      op: 'DEPARTMENT_REORGANIZED',
      payload: { newParent: 'allocation:division:Engineering' }
    }
  ]
}
```

**Key:** Reorganization is a state transition, not a tree mutation.

---

### How Balances Emerge

**Balances are NOT stored.**

**Balances are rendered by lenses:**

```javascript
// Lens: Department balance
function getDepartmentBalance(deptId, asOfDate) {
  // 1. Find all postings referencing this department
  const postings = findPostings({
    refs: { allocations: deptId },
    ts: { lte: asOfDate }
  });
  
  // 2. Sum amounts
  const balance = postings.reduce((sum, p) => {
    return p.direction === 'DEBIT' ? sum + p.amount : sum - p.amount;
  }, 0);
  
  return balance;
}
```

**No tree. No rollups. Only references and views.**

---

## Multi-Filament Reality

### A "Simple" Operation Is Never Simple

**Example: User posts to social feed**

**What you see:**
- One post

**What actually exists:**

**Identity filaments (3):**
1. `post:alice:2026-01-28` (the post content)
2. `user:alice` (the author)
3. `feed:alice` (the feed stream)

**Constraint filaments (2):**
4. `policy:post-allowed` (can Alice post? rate limits?)
5. `policy:visibility` (who can see this post?)

**Evidence filaments (1):**
6. `evidence:signature:alice-posted` (proof of authorship)

**Total: 6 filaments for "one post"**

---

### A "Complex" Operation Reveals the Pattern

**Example: Match PO + Receipt + Invoice**

**Identity filaments (4):**
1. `po:PO-1001`
2. `receipt:GR-5001`
3. `invoice:INV-778`
4. `match:PO-1001`

**Constraint filaments (3):**
5. `policy:match-3-way` (what makes a valid match?)
6. `policy:variance-threshold` (how much mismatch is allowed?)
7. `policy:override-authority` (who can approve exceptions?)

**Evidence filaments (5):**
8. `evidence:warehouse-scan` (physical receipt)
9. `evidence:ocr:invoice` (digital invoice extraction)
10. `evidence:signature:ops-received` (Ops confirmed receipt)
11. `evidence:signature:finance-matched` (Finance confirmed match)
12. `evidence:ai-proposal:match-exception` (AI suggested override)

**Total: 12 filaments for "one match"**

**This is not complexity. This is reality.**

---

## What This Changes

### Before This Correction

**Mental model:**
- Filaments are the foundation
- A PO is a filament
- A user is a filament
- A post is a filament

**Result:**
- Single-filament thinking
- "Git for everything"
- Lenses are just views
- Constraints are checks in code

---

### After This Correction

**Mental model:**
- Irreversible state transitions are the foundation
- Filaments are traces of transitions
- A PO is 6+ filaments
- Reality is always multi-filament
- Lenses hide complexity (deliberately)

**Result:**
- Multi-filament thinking
- "Authoring reality forward"
- Lenses are essential (not optional)
- Constraints are first-class filaments

---

## Foundation Checklist

**Before building any feature, verify:**

### Layer 0 Questions

- [ ] **What state exists?** (Not "what filament", but "what condition is true")
- [ ] **What transition advances state?** (Not "what commit", but "what irreversible action")
- [ ] **What constraints gate the transition?** (Not "what validation", but "what must be true")
- [ ] **What evidence proves the transition?** (Not "what log", but "what is immutable proof")

### Filament Questions

- [ ] **What identity filaments exist?** (Things with persistent identity)
- [ ] **What constraint filaments exist?** (Rules that gate transitions)
- [ ] **What evidence filaments exist?** (Proofs that transitions happened)
- [ ] **How many filaments are there really?** (Usually 3-12, never 1)

### Lens Questions

- [ ] **What does the lens hide?** (Which filaments are collapsed)
- [ ] **What does the lens emphasize?** (Which filaments are visible)
- [ ] **What does the lens refuse to render?** (Which filaments are policy-gated)
- [ ] **Is there a default view?** (No—every lens is explicit)

---

## The Real Foundation (Locked)

**Layer 0:**
1. State exists
2. Transitions are irreversible
3. Constraints are first-class
4. Evidence is mandatory

**Layer 1 (derived):**
- Identity filaments (traces of things)
- Constraint filaments (traces of rules)
- Evidence filaments (traces of proofs)

**Layer 2 (derived):**
- Lenses (hide, emphasize, refuse)
- Views (render multi-filament reality as coherent)

**Layer 3 (derived):**
- UI, proofs, domains

---

## Conclusion

**The foundation of Relay is NOT filaments.**

**The foundation is: irreversible state transitions under constraint.**

**Filaments are just one way those transitions are rendered.**

**If we keep this true, everything else stays correct.**

**If we forget it, Relay collapses into a very beautiful spreadsheet.**

---

**The One-Sentence Lock (Repeat):**

> **"Relay is not a system of filaments—it is a system of irreversible state transitions, and filaments are merely the traces we choose to preserve and render."**

---

*Last Updated: 2026-01-28*  
*Status: Canonical Foundation (Layer Zero)*  
*Version: 1.0.0*
