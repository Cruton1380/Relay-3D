# 📊 KPIs as Filaments — First-Class States of Reality

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Core Principle

> **KPIs are first-class states of reality, not derived insights.**

In Relay, a Key Performance Indicator (KPI) is **not** a dashboard metric or analytics number. It is a **filament**—a persistent identity with a commit history, semantic faces, and inspectable causality.

---

## Key Insights

### **KPIs Are States, Not Insights**

**Traditional View (Wrong):**
- KPI = derived calculation from underlying data
- "Revenue = sum of all transactions"
- Dashboard shows current number

**Relay View (Correct):**
- KPI = first-class filament with its own commit history
- "Revenue" is an entity that **changes via commits**
- Dashboard shows **+X face of latest TimeBox**

---

### **KPI Changes Are Commits**

**Not:**
- ❌ "The system calculated revenue increased to $500k"
- ❌ "Analytics shows 23% growth"

**Is:**
- ✅ "Revenue filament received commit: $500k (actor: CFO, evidence: Q1 report)"
- ✅ "Growth KPI received commit: +23% (operator: quarterly_calc, evidence: revenue delta)"

---

### **KPI Values Are +X Faces**

**TimeBox Structure:**

```
KPI Filament: "Monthly Revenue"

TimeBox 42:
├─ +X (Output): $500,000
├─ -X (Input): $480,000 (previous month)
├─ +Y (Meaning): "Monthly Recurring Revenue (MRR)"
├─ -Y (Magnitude): +$20,000 growth
├─ +Z (Actor): user:cfo-alice
└─ -Z (Evidence): report:q1-2026-finance.pdf
```

**What This Shows:**
- Current value: $500k
- Previous value: $480k
- Growth: +$20k
- Who declared it: CFO Alice
- What proves it: Q1 finance report

---

### **Credibility Is -Z Evidence**

**The -Z face** (evidence) is what makes KPIs trustworthy:

**Examples:**
- `report:q1-finance.pdf` (document reference)
- `audit:external-2026` (third-party audit)
- `sig:abc123...` (cryptographic signature)
- `operator:automated-calc` (algorithmic derivation)

**Key Rule:**
> **Every KPI commit must have evidence.** No naked assertions.

---

## KPI Voting Changes Definitions, Not Numbers

### The Distinction

**Two Types of Changes:**

#### **1. Value Updates (Not Voted On)**
- New commit with new value
- Actor: Authorized updater (CFO, data pipeline, operator)
- Evidence: Report, calculation, data source

**Example:**
```typescript
// CFO updates revenue KPI (authorized)
{
  timeBox: {
    faces: {
      output: 500000,  // New value
      input: 480000,   // Old value
      identity: 'user:cfo-alice',
      evidence: 'report:q1-2026'
    }
  }
}
```

#### **2. Definition Changes (Voted On)**
- Change what the KPI **means** or **how it's calculated**
- Requires community/org approval
- This is governance, not data entry

**Example:**
```typescript
// Proposal: Change "Revenue" KPI definition
{
  proposalBranch: 'redefine-revenue-kpi',
  changes: {
    semantic: 'Annual Recurring Revenue (ARR)' // Was: Monthly (MRR)
    calculation: 'sum(subscriptions) * 12',    // Was: sum(monthly_transactions)
    evidence_required: 'external-audit'        // Was: internal-report
  },
  // Community votes on this proposal (branch)
  // If adopted → merged into main (SCAR glyph)
}
```

---

### Why This Matters

**Traditional KPI systems:**
- Anyone can change definitions silently
- No history of "what this metric meant over time"
- Comparisons become meaningless ("revenue" meant different things in Q1 vs Q2)

**Relay KPI system:**
- **Value updates**: Fast, authorized, evidenced
- **Definition changes**: Slow, voted, transparent
- **Historical integrity**: You can audit "what did 'revenue' mean in January?" (inspect TimeBox semantics)

---

## Real-World Scenarios

### Scenario 1: Quarterly Revenue Report

**Context:** CFO publishes Q1 revenue.

**Process:**
1. CFO creates commit on "Revenue" filament
2. Commit includes:
   - +X output: $500,000
   - -X input: $480,000 (Q4 value)
   - +Y semantic: "Monthly Recurring Revenue (MRR)"
   - -Z evidence: link to audited Q1 report
3. Community can inspect TimeBox → see evidence → verify

**Benefit:** Transparent, auditable, no "trust the CFO" required.

---

### Scenario 2: Changing KPI Definition

**Context:** Company wants to shift from MRR to ARR.

**Process:**
1. Someone proposes: "Change Revenue KPI to Annual Recurring Revenue"
2. Proposal creates a **branch** (competing definition)
3. Community/board **votes** on proposal
4. If approved → branch **merged** (SCAR glyph)
5. All future commits use new definition

**Benefit:** Historical definitions preserved. You can see "when did we switch from MRR to ARR?" in commit history.

---

### Scenario 3: Automated KPI Updates

**Context:** Data pipeline calculates daily active users (DAU).

**Process:**
1. Operator (automated script) runs daily
2. Creates commit on "DAU" filament
3. Commit includes:
   - +X output: 12,500 users
   - -X input: 12,300 users (yesterday)
   - +Z actor: `operator:daily-analytics`
   - -Z evidence: `calculation:user-login-count`
4. Auditors can inspect calculation logic (stored as evidence)

**Benefit:** Automated, but auditable. No "black box" analytics.

---

## Integration with Filament System

### KPI Filaments Are Just Filaments

**All filament rules apply:**
- ✅ TimeBoxes with 6 semantic faces
- ✅ Glyphs (STAMP = declare, KINK = calculate, DENT = anomaly)
- ✅ Playback motor (navigate history)
- ✅ Views (Globe, Workflow, Spreadsheet)

**Special Properties:**
- **+Y face** often contains KPI definition
- **-Z face** contains evidence (critical for trust)
- **Y-axis** in globe view = KPI magnitude (current value)

---

### Rendering KPIs

#### **Globe View:**
```
KPI Branch: "Revenue"
↑ (height = $500k)
│
│ 
│ Latest: $500k
│ Growth: +$20k
│
└─ (CFO Dashboard)
```

#### **Workflow View:**
```
Revenue Filament (horizontal):

TimeBox 1   TimeBox 2   TimeBox 3
$480k       $490k       $500k
  □───────────□───────────□
 Q4 '25     Jan '26     Feb '26
```

#### **Spreadsheet View:**
```
KPI Dashboard (cells = latest +X faces):

KPI               Value     Growth    Evidence
Revenue           $500k     +$20k     ✓ Audited
User Count        12.5k     +200      ✓ Analytics
Churn Rate        2.3%      -0.1%     ✓ Calculated
Net Promoter      +45       +3        ⚠ Survey
```

---

## Implementation

### Data Model

```typescript
interface KPIFilament extends Filament {
  type: 'kpi';
  kpiDefinition: {
    name: string;              // "Monthly Recurring Revenue"
    unit: string;              // "USD"
    calculationMethod: string; // How it's derived
    updateFrequency: string;   // "monthly", "daily", "realtime"
    evidenceRequired: boolean; // Must have -Z evidence?
  };
}

interface KPITimeBox extends TimeBox {
  faces: {
    output: number;           // +X: Current value
    input: number;            // -X: Previous value
    semantic: string;         // +Y: KPI definition
    magnitude: number;        // -Y: Delta (change)
    identity: string;         // +Z: Who/what updated
    evidence: EvidencePointer;// -Z: Proof
  };
}

type EvidencePointer = 
  | { type: 'document', uri: string }
  | { type: 'audit', auditorId: string, reportId: string }
  | { type: 'calculation', operatorId: string, algorithmHash: string }
  | { type: 'signature', publicKey: string, signature: string };
```

---

### Authorization Model

**Who Can Update KPI Values?**
- Policy-driven (committed governance)
- Examples:
  - `kpi:revenue` → only CFO or finance team
  - `kpi:dau` → only analytics operator
  - `kpi:nps` → only customer success team

**Who Can Change KPI Definitions?**
- **Always requires community/org vote** (proposal → branch → vote → merge)

**Example Policy:**
```typescript
const kpiPolicy = {
  filamentId: 'kpi:revenue',
  valueUpdates: {
    authorizedActors: ['user:cfo', 'user:finance-director'],
    evidenceRequired: true,
    evidenceTypes: ['document', 'audit']
  },
  definitionChanges: {
    requiresVote: true,
    approvalThreshold: 0.66,  // 66% approval
    stakeholders: ['board', 'finance-dept']
  }
};
```

---

## Frequently Asked Questions

### General

**Q: Are all KPIs filaments?**  
A: In Relay, **yes**. If it's important enough to track, it's a filament. If it's just a throw-away calculation, it doesn't need to be a KPI.

**Q: Can I have derived KPIs?**  
A: Yes. A derived KPI is a filament whose commits are created by an **operator** (algorithm). Evidence points to the calculation logic.

**Q: What if a KPI is calculated every second?**  
A: Every calculation creates a commit. If that's too many, use **sampling** (commit every minute/hour) or **aggregation** (time-weighted average).

---

### Technical

**Q: How do I query current KPI values?**  
A: Use query hooks:
```typescript
const result = await query('/sheet_tip', { filamentId: 'kpi:revenue' });
// result.output = 500000 (latest +X face)
```

**Q: How do I see KPI history?**  
A: Navigate filament in workflow view, or use playback motor to step through commits.

**Q: Can KPIs have branches?**  
A: Yes! Example: Two teams propose different "Customer Satisfaction" metrics. Both exist as branches until one is adopted (merged).

---

### Governance

**Q: Who decides what's a KPI?**  
A: The organization/community. Creating a KPI filament can be governed (require proposal → vote → approval).

**Q: Can I delete a KPI?**  
A: **No** (Git immutability). You can **archive** it (ROW_ARCHIVE commit class), which marks it inactive but preserves history.

**Q: What if someone manipulates KPI values?**  
A: **Evidence requirement** prevents this. Every commit needs -Z evidence. Auditors can inspect evidence and challenge invalid commits.

---

## Conclusion

**KPIs as Filaments** ensures:
- ✅ **Transparency**: Every value change is a commit (visible, auditable)
- ✅ **Trust**: Evidence requirement (-Z face) proves validity
- ✅ **Historical Integrity**: Definitions are versioned (you can see "what did this KPI mean in January?")
- ✅ **Governance**: Definition changes require community approval (no silent metric manipulation)
- ✅ **Auditability**: Navigate KPI history like code commits (`git log` for KPIs)

By treating KPIs as **first-class states** (not derived insights), Relay makes organizational truth **inspectable and trustworthy**.

---

**See Also:**
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Editable Endpoint Lens](EDITABLE-ENDPOINT-LENS.md) (Spreadsheet as KPI Dashboard)
- [Git-Native Truth Model](../TECHNICAL/GIT-NATIVE-TRUTH-MODEL.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
