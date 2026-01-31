# 📊 Accounting as Governed Lifecycle — Canonical Model

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Executive Summary

In Relay, **accounting is not a sink**—it is a **governed lifecycle** with its own filaments, state gates, policy checks, and dispute paths.

**Core Principle:**
> Ledger postings do not "point to" a mutable general ledger. Instead, they are **authored truth objects** (filaments) that declare what was posted, which classifications applied, which policies allowed it, and which approvals gated it.

**Key Innovations:**
- **Dimension filaments**: Org structure as living history (cost centers, departments, legal entities change over time)
- **Assignment filaments**: Policy relationships as auditable state (which cost centers belong to which departments, which accounts are allowed)
- **Posting bundle filaments**: Financial truth as locked atomic commits (debit/credit pairs + classification + provenance)
- **Roll-up is a lens**: GL, subsidiary, department totals are projections over posting bundles, not mutable stores
- **Hierarchy is policy, not storage**: The chart of accounts defines valid lenses and permitted classifications

**Why It Matters:**
Enables **audit without reconstruction**, **policy changes without migration**, and **dispute resolution without rollback**.

---

## Table of Contents

1. [Core Definitions](#core-definitions)
2. [Non-Negotiable Invariants](#non-negotiable-invariants)
3. [Three Filament Families](#three-filament-families)
4. [Posting Authorization Flow](#posting-authorization-flow)
5. [Commit Schemas](#commit-schemas)
6. [Roll-Up as Lens](#roll-up-as-lens)
7. [Real-World Examples](#real-world-examples)
8. [Integration with Procurement](#integration-with-procurement)

---

## Core Definitions

### What Is a Posting?

**Posting** = An immutable financial event that declares:
- What was posted (amounts, accounts, legs)
- Which classification was applied (cost center, dept, legal entity)
- Which policies allowed it (assignment + approval state at that timestamp)
- Which source documents justified it (PO, receipt, invoice, match)

**NOT:**
- ❌ A row inserted into a mutable ledger table
- ❌ A "transaction" that updates balances
- ❌ A denormalized summary

**IS:**
- ✅ An authored truth object (filament)
- ✅ A locked bundle of atomic legs (debit/credit pairs)
- ✅ A governed commit with provenance + evidence

---

### What Is the Hierarchy?

**Hierarchy** = The structure of dimensions (legal entities, departments, cost centers, accounts) **as it exists over time**.

**NOT:**
- ❌ A static lookup table
- ❌ A place to "store balances"
- ❌ A configuration file

**IS:**
- ✅ A set of dimension filaments (org structure as history)
- ✅ A set of assignment filaments (relationships + policies over time)
- ✅ A lens governance system (defines valid projections)

**Key insight:** When you query "what's the total for Dept D-10?", you're not reading a stored total. You're projecting posting bundles through a lens that filters by `dept=D-10`.

---

### One Workflow Lens, Many Authoritative Filaments

**Rule:**
> The UI can feel like one unified workflow, but underneath are **many distinct truth objects** with their own actors, evidence, timing, and dispute paths.

**Example: PO-to-Posting Workflow**

**User sees:** One unified "Create PO → Pay" flow

**Reality underneath:**
- `po.<id>` filament (procurement authority)
- `receipt.<id>` filament (warehouse authority)
- `invoice.<id>` filament (AP authority)
- `match.<poId>` filament (reconciliation authority)
- `classification.<postingId>` filament (accounting classification authority)
- `posting.<postingEventId>` filament (financial event authority)

Each has its own commits, gates, approvals, and dispute branches.

**The "one" is the lens, not the truth.**

---

## Non-Negotiable Invariants

These rules cannot be violated:

### **I1 — Posting is Atomic (Locked Bundle)**

A posting bundle consists of:
- 2+ legs (debit/credit pairs)
- Same `postingEventId`
- Same `commitIndex` (created simultaneously)

**Rule:** Either all legs exist at a commitIndex, or none do.

**Why:** "Out of balance" cannot exist without a visible break (geometry enforces physics).

---

### **I2 — Hierarchy is Living Policy, Not Static Storage**

Dimension filaments (cost centers, departments, accounts) **change over time**:
- Renamed
- Split
- Merged (SCAR)
- Deactivated
- Policy updated

**Rule:** You cannot "look up" a cost center. You must replay its filament to the relevant timestamp.

**Why:** Org structure is authored reality, not reference data.

---

### **I3 — Assignment is Auditable State**

Relationships between dimensions (e.g., "Cost center CC-77 belongs to Dept D-10") are **not implicit**.

They are **assignment filaments** with:
- Effective dates
- Policy rules
- Approval gates
- Dispute branches

**Rule:** If a posting uses a classification, it must reference the exact assignment commit that justified it.

**Why:** Audits answer "why was this allowed?" by replaying assignment state.

---

### **I4 — Roll-Up is a Lens, Not a Store**

General ledger totals, subsidiary ledger totals, department totals, cost center totals are **projections** over posting bundles.

**Rule:** You never "write" to the GL. You author posting bundles, and the GL is a query result (lens).

**Why:** Totals are derived truth, not primary truth.

---

### **I5 — Posting References Provenance (No Orphan Events)**

Every posting bundle must reference:
- Source commits (PO, receipt, invoice, match)
- Classification commit (dimension references)
- Policy commits (assignment state at posting time)

**Rule:** No posting is "self-authorizing." All financial truth has provenance.

**Why:** Audit is replay, not reconstruction.

---

## Three Filament Families

### Family 1: Dimension Filaments (Org Structure)

**Purpose:** Represent the structure of the organization and chart of accounts **as it changes over time**.

**Examples:**
- `org.legalEntity.<id>` — Legal entity lifecycle
- `org.department.<id>` — Department lifecycle
- `org.costCenter.<id>` — Cost center lifecycle
- `coa.account.<id>` — GL account lifecycle
- `vendor.<id>` — Vendor master lifecycle
- `material.<id>` — Material master lifecycle

**Canonical Operations:**
- `DIM_CREATED` — New dimension created
- `DIM_RENAMED` — Name/description changed
- `DIM_SPLIT` — One dimension splits into two
- `DIM_MERGED` (SCAR) — Two dimensions merge (with explicit trace)
- `DIM_DEACTIVATED` — Dimension no longer active
- `DIM_POLICY_CHANGED` — Rules/constraints updated

**Why filaments, not static tables:**
- Dimensions change over time (renamed, split, merged)
- Historical postings must reference the dimension state at that timestamp
- Disputes over classification require replaying dimension history

---

### Family 2: Assignment Filaments (Relationships)

**Purpose:** Represent **policy relationships** between dimensions over time.

**This is the missing physics in ERP.**

**Examples:**
- `assign.costCenterToDept.<ccId>` — "CC-77 belongs to Dept D-10 from Jan–Jun"
- `assign.accountPolicy.<accountId>` — "Account 6100 is allowed for Dept D-10"
- `assign.approvalMatrix.<orgId>` — "User Alice can approve postings for LE-1"

**Canonical Operations:**
- `ASSIGN_CREATED` — Relationship established
- `ASSIGN_UPDATED` — Effective dates changed
- `ASSIGN_UNASSIGNED` — Relationship terminated
- `ASSIGN_OVERRIDE` (GATE) — Policy exception approved

**Why filaments, not config files:**
- Assignments have effective dates (temporal validity)
- Assignments can be disputed (exception path)
- Audits must prove "why was this allowed?" by replaying assignment state

**Key insight:** When a posting is blocked by policy, the dispute is on the **assignment filament**, not the posting itself.

---

### Family 3: Posting Bundle Filaments (Financial Truth)

**Purpose:** Represent **immutable financial events** as atomic, governed commits.

**Examples:**
- `posting.<postingEventId>` — The bundle authority filament

**Structure:**
```typescript
{
  filamentId: 'posting.POST-123',
  commits: [
    {
      op: 'POSTING_CREATED',
      payload: {
        postingEventId: 'posting-event-001',
        legs: [
          { account: 'AP', direction: 'CREDIT', amount: 510, currency: 'USD' },
          { account: 'EXPENSE', direction: 'DEBIT', amount: 510, currency: 'USD' }
        ],
        classification: {
          costCenter: 'CC-77',
          department: 'D-10',
          legalEntity: 'LE-1'
        }
      },
      refs: {
        inputs: [
          { filamentId: 'match.PO-1001', commitIndex: 2 },  // match override
          { filamentId: 'classification.POST-123', commitIndex: 0 },  // classification
          { filamentId: 'assign.costCenterToDept.CC-77', commitIndex: 5 },  // assignment authority
        ]
      }
    }
  ]
}
```

**Canonical Operations:**
- `POSTING_CREATED` — Atomic bundle creation
- `POSTING_REVERSED` (GATE) — Reversal (new bundle, references original)
- `POSTING_DISPUTED` (SPLIT) — Dispute branch (Finance vs Audit)
- `POSTING_CORRECTED` (SCAR) — Correction entry (with explicit trace)

**Why filaments:**
- Postings can be disputed (fork branch)
- Postings can be reversed (new commit, not deletion)
- Postings can be corrected (SCAR, preserves history)
- Posting provenance must be inspectable (replay dependencies)

---

## Posting Authorization Flow

This is the governed process that **replaces "dump to ledger."**

### Step 1: Resolve Classification

**Goal:** Declare which dimensions apply to this posting.

**Action:** Create `classification.<postingId>` commit:
```typescript
{
  filamentId: 'classification.POST-123',
  commitIndex: 0,
  op: 'CLASSIFICATION_DECLARED',
  payload: {
    postingId: 'POST-123',
    costCenter: 'CC-77',
    department: 'D-10',
    legalEntity: 'LE-1',
    account: '6100'
  },
  refs: {
    inputs: [
      { filamentId: 'org.costCenter.CC-77', commitIndex: 10 },  // dimension state
      { filamentId: 'org.department.D-10', commitIndex: 5 },
      { filamentId: 'org.legalEntity.LE-1', commitIndex: 2 },
      { filamentId: 'coa.account.6100', commitIndex: 8 }
    ]
  }
}
```

**Key:** Classification is its own commit, not just metadata on the posting.

---

### Step 2: Validate Policy (GATE)

**Goal:** Check if the classification is allowed by current assignment policy.

**Action:** Query assignment filaments:
- Is CC-77 assigned to Dept D-10 at this timestamp?
- Is account 6100 allowed for Dept D-10?
- Does user have approval authority for LE-1?

**Outcome A (Policy Pass):**
- GATE opens
- Proceed to Step 3

**Outcome B (Policy Fail):**
- GATE blocks
- Create `classification.<postingId>` commit with `op: CLASSIFICATION_POLICY_EXCEPTION`
- Presence shows "3 Finance viewers inspecting exception"
- Override requires L6 + lock + approval
- If approved: SCAR commit, GATE opens

**Key:** Policy validation is explicit, not silent. Exceptions are visible and require governance.

---

### Step 3: Create Posting Bundle (Atomic)

**Goal:** Lock the debit/credit legs together as an immutable event.

**Action:** Create `posting.<postingEventId>` commit:
```typescript
{
  filamentId: 'posting.POST-123',
  commitIndex: 0,
  op: 'POSTING_CREATED',
  payload: {
    postingEventId: 'posting-event-001',
    legs: [
      { account: 'AP', direction: 'CREDIT', amount: 510, currency: 'USD' },
      { account: 'EXPENSE', direction: 'DEBIT', amount: 510, currency: 'USD' }
    ],
    classification: { /* refs to classification commit */ }
  },
  refs: {
    inputs: [
      { filamentId: 'match.PO-1001', commitIndex: 2 },  // provenance
      { filamentId: 'classification.POST-123', commitIndex: 0 }  // classification
    ]
  }
}
```

**Atomicity guarantee:** Either all legs exist at `commitIndex: 0`, or none do.

---

## Commit Schemas

### Dimension Filament: `org.costCenter.<id>`

**Operations:**

**DIM_CREATED**
```typescript
{
  op: 'DIM_CREATED',
  payload: {
    costCenterId: 'CC-77',
    name: 'IT Operations',
    description: 'Technology infrastructure and support',
    status: 'ACTIVE'
  }
}
```

**DIM_RENAMED**
```typescript
{
  op: 'DIM_RENAMED',
  payload: {
    costCenterId: 'CC-77',
    oldName: 'IT Operations',
    newName: 'Digital Infrastructure'
  }
}
```

**DIM_DEACTIVATED**
```typescript
{
  op: 'DIM_DEACTIVATED',
  payload: {
    costCenterId: 'CC-77',
    reason: 'Merged into CC-80',
    effectiveDate: '2026-07-01'
  }
}
```

---

### Assignment Filament: `assign.costCenterToDept.<ccId>`

**Operations:**

**ASSIGN_CREATED**
```typescript
{
  op: 'ASSIGN_CREATED',
  payload: {
    costCenterId: 'CC-77',
    departmentId: 'D-10',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31'
  },
  refs: {
    inputs: [
      { filamentId: 'org.costCenter.CC-77', commitIndex: 10 },
      { filamentId: 'org.department.D-10', commitIndex: 5 }
    ]
  }
}
```

**ASSIGN_OVERRIDE (GATE)**
```typescript
{
  op: 'ASSIGN_OVERRIDE',
  payload: {
    assignmentId: 'assign-001',
    overrideReason: 'Temporary project reassignment',
    approvedBy: 'Controller',
    exceptionPeriod: { from: '2026-02-01', to: '2026-02-28' }
  }
}
```

---

### Classification Filament: `classification.<postingId>`

**Operations:**

**CLASSIFICATION_DECLARED**
```typescript
{
  op: 'CLASSIFICATION_DECLARED',
  payload: {
    postingId: 'POST-123',
    costCenter: 'CC-77',
    department: 'D-10',
    legalEntity: 'LE-1',
    account: '6100'
  },
  refs: {
    inputs: [
      { filamentId: 'org.costCenter.CC-77', commitIndex: 10 },
      { filamentId: 'org.department.D-10', commitIndex: 5 },
      { filamentId: 'org.legalEntity.LE-1', commitIndex: 2 }
    ]
  }
}
```

**CLASSIFICATION_POLICY_EXCEPTION**
```typescript
{
  op: 'CLASSIFICATION_POLICY_EXCEPTION',
  payload: {
    postingId: 'POST-123',
    policyViolation: 'CC-77 not assigned to D-10 for this period',
    overrideReason: 'Emergency infrastructure spend',
    approvedBy: 'Controller'
  }
}
```

---

### Posting Bundle Filament: `posting.<postingEventId>`

**Operations:**

**POSTING_CREATED**
```typescript
{
  op: 'POSTING_CREATED',
  payload: {
    postingEventId: 'posting-event-001',
    legs: [
      { account: 'AP', direction: 'CREDIT', amount: 510, currency: 'USD' },
      { account: 'EXPENSE', direction: 'DEBIT', amount: 510, currency: 'USD' }
    ],
    classification: {
      costCenter: 'CC-77',
      department: 'D-10',
      legalEntity: 'LE-1'
    },
    postingDate: '2026-01-27',
    description: 'PO-1001 payment'
  },
  refs: {
    inputs: [
      { filamentId: 'match.PO-1001', commitIndex: 2 },
      { filamentId: 'classification.POST-123', commitIndex: 0 }
    ]
  }
}
```

**POSTING_REVERSED (GATE)**
```typescript
{
  op: 'POSTING_REVERSED',
  payload: {
    originalPostingEventId: 'posting-event-001',
    reversalReason: 'Payment cancelled',
    reversalLegs: [
      { account: 'AP', direction: 'DEBIT', amount: 510, currency: 'USD' },
      { account: 'EXPENSE', direction: 'CREDIT', amount: 510, currency: 'USD' }
    ],
    approvedBy: 'Controller'
  },
  refs: {
    inputs: [
      { filamentId: 'posting.POST-123', commitIndex: 0 }  // original posting
    ]
  }
}
```

---

## Roll-Up as Lens

### Core Principle

**Rule:** GL, subsidiary, department, cost center totals are **projections** over posting bundles, not mutable stores.

**Query:** "What's the total for Dept D-10 in January 2026?"

**Answer:**
```typescript
const postings = getPostingBundles({
  timeRange: { from: '2026-01-01', to: '2026-01-31' },
  classification: { department: 'D-10' }
});

const total = postings
  .flatMap(p => p.payload.legs)
  .filter(leg => leg.account === 'EXPENSE' && leg.direction === 'DEBIT')
  .reduce((sum, leg) => sum + leg.amount, 0);
```

**Key:** You're not reading a stored "Dept D-10 total." You're replaying posting bundles through a lens.

---

### Hierarchy Levels as Lenses

| Lens Level | Filter | Example |
|------------|--------|---------|
| General Ledger | All postings, by account | "Total debits to account 6100" |
| Subsidiary Ledger | By vendor/customer/material | "Total AP for Vendor V-22" |
| Department | By dept classification | "Total expenses for Dept D-10" |
| Cost Center | By cost center classification | "Total for CC-77" |
| Legal Entity | By entity classification | "Total for LE-1 (UK subsidiary)" |

**All are lenses. None are stores.**

---

## Real-World Examples

### Example 1: Cost Center Reassignment (Mid-Year)

**Scenario:** IT Operations (CC-77) is reassigned from Dept D-10 (Finance) to Dept D-15 (Technology) on July 1.

**Filament:** `assign.costCenterToDept.CC-77`

**Commits:**
```typescript
// Jan 1 - Jun 30
{ op: 'ASSIGN_CREATED', payload: { costCenterId: 'CC-77', departmentId: 'D-10', effectiveTo: '2026-06-30' } }

// July 1 - Dec 31
{ op: 'ASSIGN_UPDATED', payload: { costCenterId: 'CC-77', departmentId: 'D-15', effectiveFrom: '2026-07-01' } }
```

**Query:** "What were Dept D-10's expenses in Q1 vs Q3?"

**Answer:**
- Q1 postings (Jan-Mar): Include CC-77 (assigned to D-10)
- Q3 postings (Jul-Sep): Exclude CC-77 (assigned to D-15)

**No migration. No data update. Just replay.**

---

### Example 2: Policy Exception (Emergency Spend)

**Scenario:** An emergency server purchase needs to be posted to CC-77, but CC-77 is currently inactive (deactivated last month).

**Filaments:**
- `org.costCenter.CC-77` (status: DEACTIVATED)
- `classification.POST-456` (policy exception)

**Flow:**
1. User attempts to classify posting as CC-77
2. GATE blocks: "CC-77 is inactive"
3. User requests override (GATE)
4. Controller approves: `CLASSIFICATION_POLICY_EXCEPTION` commit
5. GATE opens, posting proceeds
6. Audit trail: Override commit explicitly references why it was allowed

**Key:** The exception is visible geometry, not a silent hack.

---

### Example 3: Department Merge (Two Become One)

**Scenario:** Dept D-10 (Finance) and Dept D-11 (Accounting) merge into Dept D-20 (Finance & Accounting) on April 1.

**Filaments:**
- `org.department.D-10` → `DIM_MERGED` (SCAR)
- `org.department.D-11` → `DIM_MERGED` (SCAR)
- `org.department.D-20` → `DIM_CREATED`

**Commits:**
```typescript
// Dept D-10
{ op: 'DIM_MERGED', payload: { departmentId: 'D-10', mergedInto: 'D-20', effectiveDate: '2026-04-01' } }

// Dept D-11
{ op: 'DIM_MERGED', payload: { departmentId: 'D-11', mergedInto: 'D-20', effectiveDate: '2026-04-01' } }

// Dept D-20
{ op: 'DIM_CREATED', payload: { departmentId: 'D-20', name: 'Finance & Accounting', status: 'ACTIVE' } }
```

**Query:** "What were D-10's expenses for the full year?"

**Answer:**
- Jan-Mar: Sum postings classified as D-10
- Apr-Dec: Sum postings classified as D-20 (with SCAR trace to D-10)

**Audit:** Merge is visible in 3D (SCAR glyph on D-10 filament).

---

## Integration with Procurement

### How Posting Connects to PO Flow

**PO Flow (Steps 1-4):**
1. Create PO
2. Approve PO (GATE)
3. Record Receipt
4. Capture Invoice

**Match Flow (Step 5):**
5. Match evaluates → EXCEPTION → Override (GATE)

**Posting Flow (Steps 6-8):**
6. Resolve Classification (dimension + assignment)
7. Validate Policy (GATE)
8. Create Posting Bundle (atomic)

**Provenance chain:**
```
posting.POST-123 
  → classification.POST-123 
    → assign.costCenterToDept.CC-77
    → org.costCenter.CC-77
  → match.PO-1001 (override commit)
    → invoice.I-9001
    → receipt.R-5001
    → po.PO-1001
```

**All inspectable. All auditable. All replayable.**

---

## Conclusion

The **Accounting as Governed Lifecycle Model** ensures that:
- ✅ **Posting is atomic** (locked bundles)
- ✅ **Hierarchy is living policy** (dimension + assignment filaments)
- ✅ **Roll-up is a lens** (no mutable stores)
- ✅ **Provenance is explicit** (no orphan events)
- ✅ **Disputes are branches** (not silent hacks)

By treating accounting as **authored lifecycle** (not "dump to ledger"), Relay enables **audit without reconstruction**, **policy changes without migration**, and **dispute resolution without rollback**.

---

**One-Sentence Lock:**

> Posting is not a sink—it is an authored truth object (filament) that declares what was posted, which classifications applied, which policies allowed it, and which source documents justified it, with roll-up totals as lenses over immutable bundles.

---

**See Also:**
- [Procurement Lifecycle Spec](PROCUREMENT-LIFECYCLE-SPEC.md)
- [Insight Confidence & Coverage Spec](INSIGHT-CONFIDENCE-COVERAGE-SPEC.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
