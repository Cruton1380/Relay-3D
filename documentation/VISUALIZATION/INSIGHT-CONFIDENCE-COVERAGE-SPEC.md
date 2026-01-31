# 🔍 Insight Confidence & Coverage — Canonical Model

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Executive Summary

In Relay, **insight filaments** (derived truth like KPIs, match results, reports) carry epistemic properties that express **how complete their inputs were** (coverage) and **how trustworthy their assertions are** (confidence).

**Core Principle:**
> Confidence and coverage are properties of the **insight filament itself**, never of the source filaments. Reality stays untouched. Interpretation carries its own epistemic weight.

**Key Innovations:**
- **Coverage as Thickness**: Structural completeness maps to filament body thickness
- **Confidence as Surface Integrity**: Assertion quality maps to surface treatment (solid vs dashed)
- **No Implicit Defaults**: Both must be explicitly declared; no hidden denominators
- **Independent Dimensions**: High coverage + low confidence is meaningful (and vice versa)
- **Geometric Encoding**: Both visible without requiring labels or dashboards

**Why It Matters:**
Enables **audit without queries**, **KPI ranking without hiding uncertainty**, and **governance decisions aware of epistemic risk**.

---

## Table of Contents

1. [Core Definitions](#core-definitions)
2. [Non-Negotiable Invariants](#non-negotiable-invariants)
3. [Coverage Model](#coverage-model)
4. [Confidence Model](#confidence-model)
5. [Geometric Encoding Rules](#geometric-encoding-rules)
6. [Mathematical Formulas](#mathematical-formulas)
7. [Real-World Examples](#real-world-examples)
8. [Rendering Guidelines](#rendering-guidelines)
9. [Integration with Other Systems](#integration-with-other-systems)

---

## Core Definitions

### What Is Coverage?

**Coverage** = How complete is the input set?

**Question it answers:** "What fraction of the relevant reality did this insight actually see?"

**Examples:**
- 100% of receipts for Q1 2026
- 62% of invoices matched (38% pending)
- Only Dept A + B included (Dept C excluded)
- Time window truncated (Jan-Feb only, not full quarter)

**NOT:**
- ❌ Quality of the claim
- ❌ Trustworthiness of assertions
- ❌ Whether the insight is "good" or "bad"

**IS:**
- ✅ Structural completeness
- ✅ Scope declaration
- ✅ Observable reality fraction

---

### What Is Confidence?

**Confidence** = How trustworthy is the assertion given what was read?

**Question it answers:** "How much should I trust this conclusion?"

**Examples:**
- Clean reconciliation, no variance → high confidence
- Manual overrides present → medium confidence
- AI-assisted heuristic → lower confidence
- Human approval + multi-party sign-off → high confidence

**NOT:**
- ❌ How much reality was read (that's coverage)
- ❌ Whether you agree with the conclusion
- ❌ Political weight

**IS:**
- ✅ Assertion quality
- ✅ Evidence strength
- ✅ Epistemic reliability

---

### The Independence Rule

**Coverage and confidence are orthogonal.**

| Coverage | Confidence | Meaning |
|----------|-----------|---------|
| High | High | "We saw everything, and it's solid" |
| High | Low | "We saw everything, but it's messy/uncertain" |
| Low | High | "Strong claim, but only partial scope" |
| Low | Low | "Incomplete data, uncertain conclusion" |

**Example:**
- A budget KPI that reads 100% of transactions (high coverage) but includes many manual adjustments (medium confidence).
- A regulatory report that reads only 20% sample (low coverage) but every read item was triple-verified (high confidence).

---

## Non-Negotiable Invariants

These rules cannot be violated:

### **I1 — Coverage and Confidence Are Properties of the Insight, Not the Source**

Source filaments (PO, receipts, invoices) are **truth** — they have no coverage or confidence.

Only **derived filaments** (insights, KPIs, match results, reports) carry epistemic properties.

**Why:** Source filaments are reality. Insights are interpretations.

---

### **I2 — No Implicit Coverage**

If coverage is not explicitly declared, it must be `null` or clearly scoped.

**Forbidden:** Hidden denominators like "we read 8 receipts" without declaring "out of how many?"

**Required:** Either:
- Declare total scope: `coverage = 8/10 = 0.8`
- Or declare bounded scope: `coverageScope = "time:2026-Q2"` + `coverage = 1.0` within scope

---

### **I3 — No Confidence Inheritance**

Confidence **never propagates backward** to source filaments.

A low-confidence insight does not make the underlying receipts "low confidence."

**Why:** Source truth is independent of how it's interpreted.

---

### **I4 — No Silent Confidence Upgrades**

Confidence can only **increase via new commits** (e.g., approval, verification, reconciliation).

Confidence **cannot increase automatically** (no silent "well, time passed so it's probably fine").

**Allowed:** Confidence decay (new contradictory evidence lowers confidence).

---

### **I5 — Confidence and Coverage Are Visible in Geometry**

Both must be **visually encoded** in the filament's 3D geometry, not hidden in metadata fields.

**Why:** Audit is visual. "Thick solid filament" vs "thin dashed filament" conveys epistemic state instantly.

---

## Coverage Model

### Definition

```typescript
coverage: number | null;  // 0.0 - 1.0, or null if undefined
coverageScope?: string;   // Optional scope declaration
```

### Computation

Coverage is **derived only from declared READ operators** in the insight filament's commit history.

```typescript
coverage = observedSourceUnits / totalRelevantSourceUnits
```

**Example 1: Receipt-based KPI**
```typescript
const readCommit = {
  op: 'INSIGHT_READ_DECLARED',
  payload: {
    sourceFilaments: ['receipt.R-5001', 'receipt.R-5002', ...],
    totalExpected: 10,
    observedCount: 8,
    excludedReason: 'pending-verification'
  }
};
coverage = 8 / 10 = 0.8;
```

**Example 2: Time-windowed KPI**
```typescript
const readCommit = {
  op: 'INSIGHT_READ_DECLARED',
  payload: {
    coverageScope: 'time:2026-Q2',
    totalInScope: 120,
    observedCount: 120,
  }
};
coverage = 120 / 120 = 1.0;
coverageScope = 'time:2026-Q2';
```

---

### Coverage Scope Declaration

When coverage = 1.0, it means "100% **within the declared scope**."

**Explicit scope options:**
- `time:2026-Q2` — Only Q2 2026 data
- `dept:A,B` — Only Departments A and B
- `status:closed` — Only closed transactions
- `sample:random-20pct` — Declared 20% random sample

**Rule:** If scope is bounded, it must be explicit. No hidden filters.

---

## Confidence Model

### Definition

```typescript
confidence: number | null;  // 0.0 - 1.0, or null if undefined
```

### Computation

Confidence is **derived from assertion quality**, not from math alone.

**Minimum inputs:**
- Variance level (clean vs messy data)
- Override count (manual interventions)
- Automation level (AI vs human)
- Approval level (who signed off)

**Simple starting formula** (deterministic, auditable):

```typescript
confidence = 
  baseConfidence
  - variancePenalty
  - overridePenalty
  - automationPenalty
  + humanApprovalBonus
```

**Bounded:** `confidence ∈ [0.0, 1.0]`

---

### Confidence Calculation Example (Procurement Match Insight)

```typescript
const matchInsight = {
  filamentId: 'insight.match.PO-1001',
  commits: [
    {
      op: 'INSIGHT_EVALUATED',
      payload: {
        basis: {
          poSnapshot: {...},
          receiptSnapshot: {...},
          invoiceSnapshot: {...}
        },
        variances: [
          { lineId: 'A', delta: 2, severity: 'WARN' }
        ],
        overrideCount: 1,
        automationLevel: 'system',
        approvalLevel: 'APManager'
      }
    }
  ]
};

// Confidence calculation
const base = 1.0;
const variancePenalty = 0.1 * (variances.length);  // 1 variance = -0.1
const overridePenalty = 0.15 * (overrideCount);    // 1 override = -0.15
const automationPenalty = 0.0; // system-generated is neutral
const approvalBonus = 0.1; // APManager approval = +0.1

confidence = base - 0.1 - 0.15 - 0.0 + 0.1 = 0.85;
```

**Result:** This match insight has **85% confidence** — high, but not perfect (due to variance + override).

---

### Confidence Decay (Living Claims)

Confidence can **decrease** when new evidence arrives:

```typescript
// Original evaluation: confidence = 0.9
const commit1 = {
  op: 'INSIGHT_EVALUATED',
  confidence: 0.9
};

// New contradictory receipt arrives
const commit2 = {
  op: 'INSIGHT_CONTRADICTED',
  payload: {
    newEvidence: 'receipt.R-5010 shows different qty',
    confidenceDelta: -0.2
  },
  confidence: 0.7  // Decayed from 0.9 to 0.7
};
```

**Rule:** Confidence decay must be explicit (commit-based), never silent.

---

## Geometric Encoding Rules

### Coverage → Thickness Modulation

**Rule:** Coverage affects the **filament body thickness** (global, smooth).

| Coverage | Thickness Multiplier | Visual Effect |
|----------|---------------------|---------------|
| 1.0 | 1.0 | Normal thickness |
| 0.8 | 0.8 | Slightly thinner |
| 0.5 | 0.5 | Noticeably thinner |
| 0.2 | 0.3 | Hairline filament |
| null | 1.0 | Default (undefined) |

**Implementation:**
```typescript
const filamentRadius = baseRadius * (coverage ?? 1.0);
```

**Why this works:**
- Thin filament = "barely touched reality"
- Thick filament = "comprehensive view"
- Intuitive even without labels

---

### Confidence → Surface Integrity Modulation

**Rule:** Confidence affects the **surface treatment** (can vary segment-by-segment).

| Confidence | Surface Treatment | Visual Effect |
|-----------|------------------|---------------|
| 0.9 - 1.0 | Solid, smooth | High trust |
| 0.7 - 0.9 | Micro-fissures, grain | Medium trust |
| 0.5 - 0.7 | Dashed/segmented shell | Low trust |
| 0.0 - 0.5 | Pulsing instability | Very uncertain |
| null | Solid (default) | Undefined |

**Implementation:**
```typescript
if (confidence >= 0.9) {
  material = solidMaterial;
} else if (confidence >= 0.7) {
  material = grainedMaterial; // subtle texture
} else if (confidence >= 0.5) {
  material = dashedMaterial; // visible gaps
} else {
  material = pulsingMaterial; // animated uncertainty
}
```

**Why this works:**
- Solid surface = "trust this"
- Broken surface = "treat with caution"
- Survives zoom changes (always visible)

---

## Mathematical Formulas

### Coverage Formula

```
coverage = observedUnits / totalRelevantUnits

where:
  observedUnits = count of source commits/records actually read
  totalRelevantUnits = total expected count within declared scope

constraints:
  coverage ∈ [0.0, 1.0]
  if scope is bounded: coverage relative to scope, not global total
  if scope is undefined: coverage = null
```

---

### Confidence Formula (Basic)

```
confidence = base - Σ(penalties) + Σ(bonuses)

base = 1.0

penalties:
  variancePenalty = k_var × (variance count)
  overridePenalty = k_override × (override count)
  automationPenalty = k_auto × (if AI-generated: 1, else: 0)

bonuses:
  humanApprovalBonus = k_approval × (approval tier level)

constraints:
  confidence ∈ [0.0, 1.0]
  all k values are tunable constants (e.g., k_var = 0.1)
```

**Advanced:** Replace linear formula with domain-specific scoring (e.g., regulatory compliance has different weights).

---

## Real-World Examples

### Example 1: High Coverage, High Confidence

**Scenario:** Q1 Budget KPI, all transactions reconciled cleanly.

```typescript
const budgetKPI = {
  filamentId: 'insight.budget.2026-Q1',
  coverage: 1.0,  // 100% of Q1 transactions
  coverageScope: 'time:2026-Q1',
  confidence: 0.95, // Clean reconciliation, no overrides
};
```

**Visual:** Thick, solid filament — "This is comprehensive and trustworthy."

---

### Example 2: High Coverage, Low Confidence

**Scenario:** Audit report covering all departments, but many manual corrections.

```typescript
const auditReport = {
  filamentId: 'insight.audit.annual-2025',
  coverage: 1.0,  // All departments
  coverageScope: 'dept:A,B,C,D',
  confidence: 0.6, // Many variances + overrides
};
```

**Visual:** Thick but dashed filament — "We saw everything, but it's messy."

---

### Example 3: Low Coverage, High Confidence

**Scenario:** Regulatory sample (20% random), but every item triple-verified.

```typescript
const regSample = {
  filamentId: 'insight.regulatory.sample-Q2',
  coverage: 0.2,  // Only 20% sample
  coverageScope: 'sample:random-20pct',
  confidence: 0.95, // Every item verified by 3 auditors
};
```

**Visual:** Thin but solid filament — "Strong claim, but partial scope."

---

### Example 4: Low Coverage, Low Confidence

**Scenario:** Early draft AI-generated sales forecast (incomplete data, unverified).

```typescript
const salesForecast = {
  filamentId: 'insight.sales-forecast.draft',
  coverage: 0.4,  // Only 40% of historical data available
  coverageScope: 'time:2026-H1-partial',
  confidence: 0.5, // AI-generated, not yet reviewed
};
```

**Visual:** Thin, dashed filament — "Preliminary, treat with caution."

---

## Rendering Guidelines

### At Different Zoom Levels

**Far (Globe View):**
- Thickness difference is visible (thin vs thick filament)
- Surface treatment simplified (solid vs broken)
- No labels

**Medium (Workflow View):**
- Full thickness + surface treatment visible
- Hover label shows numeric values:
  ```
  Coverage: 80% (8/10 receipts)
  Confidence: 0.85 (1 variance, 1 override)
  ```

**Near (Inspection View):**
- Click into insight filament reveals:
  - READ operator (what was included/excluded)
  - ASSERT operator (why confidence is X)
  - Variance/override details

---

### No Dashboards Needed

With geometric encoding:
- **Thin filament** = incomplete data (instantly visible)
- **Broken surface** = uncertain claim (instantly visible)
- **Thick + solid** = comprehensive + trustworthy (instantly visible)

No need for separate "confidence score widget" or "coverage dashboard."

**The geometry is the dashboard.**

---

## Integration with Other Systems

### With KPIs-as-Filaments

KPI filaments are **insight filaments**, so they naturally carry coverage + confidence.

```typescript
const revenueKPI = {
  filamentId: 'insight.kpi.revenue.2026-Q1',
  coverage: 0.95,  // 95% of transactions recorded
  confidence: 0.9, // Clean books, one minor adjustment
};
```

---

### With Match-as-Filament (Procurement)

Match filaments are **insight filaments** (they assert reconciliation truth).

```typescript
const matchFilament = {
  filamentId: 'match.PO-1001',
  // This is a governance filament, not pure insight
  // But confidence still applies:
  confidence: 0.85,  // 1 override approved
  // Coverage less relevant (it always reads PO + receipt + invoice)
};
```

---

### With AI-Generated Insights

AI outputs are **low initial confidence** by design:

```typescript
const aiInsight = {
  filamentId: 'insight.ai-recommendation.budget-cut',
  coverage: 1.0,  // AI read all data
  confidence: 0.6, // AI-generated, not yet human-approved
};

// After human approval:
const approvalCommit = {
  op: 'INSIGHT_APPROVED',
  actor: { kind: 'user', id: 'dept-head' },
  confidenceDelta: +0.2,
};
// New confidence = 0.8
```

---

## Conclusion

The **Insight Confidence & Coverage Model** ensures that:
- ✅ **Coverage is structural** (how much was read)
- ✅ **Confidence is epistemic** (how much to trust)
- ✅ **Both are visible in geometry** (no hidden metadata)
- ✅ **Both are auditable** (commit-based, never silent)
- ✅ **Insights are living claims** (confidence can decay)

By encoding both properties geometrically (thickness + surface integrity), Relay enables **audit without queries** and **KPI ranking without hiding uncertainty**.

---

**One-Sentence Lock:**

> An insight filament declares what it read (coverage) and how strongly it claims meaning (confidence), and both are visible in its geometry without mutating the underlying truth.

---

**See Also:**
- [KPIs as Filaments](KPIS-AS-FILAMENTS.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Procurement Lifecycle Spec](PROCUREMENT-LIFECYCLE-SPEC.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
