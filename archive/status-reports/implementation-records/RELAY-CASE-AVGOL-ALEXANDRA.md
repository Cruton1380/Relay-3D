# Relay Case Study: Avgol - Alexandra Demina
## Multi-Site Procurement Coordination Crisis

**Date**: February 2, 2026  
**Company**: Avgol (Nonwoven Fabric Manufacturing)  
**Contact**: Alexandra Demina (Indirect Procurement)  
**Sites**: Maxwell (primary), Russia, China, India  
**Mission**: First 3D Business Demonstration

---

## Executive Summary

Avgol faces a **coordination crisis** across 5 global manufacturing sites due to:
- Fragmented data (BOMs, payment terms, bids) scattered across site-specific network folders
- Team instability (6-month gap without purchasing manager at Maxwell)
- Single-buyer bottleneck unable to process minimum orders
- Warehouse accumulation growing "like a snowball"
- Indirect procurement historically treated as "little part" of total spend
- Different management approaches per site (language barriers: English/Russian/Chinese/Hindi)

**Critical Problem**: No single source of truth for parts, vendors, BOMs, or customer relationships across sites.

---

## Current State Analysis

### 1. Organizational Fragility

**What Alexandra Said:**
> "Our team keeps changing. We had several critical transitions last year within the indirect procurement. For 6 months, we didn't have a purchasing manager in Maxwell... we were staying with just one buyer who couldn't even process a minimum thing, right, to just process the orders."

**Relay Diagnosis**:
- **Authority gaps**: No clear custody when manager absent
- **Hidden dependencies**: Single buyer = single point of failure
- **Silent failure**: Orders not processing, no explicit refusal/visibility
- **Pressure without measurement**: "Growing as a snowball" = untracked drift

### 2. Data Fragmentation

**What Was Discussed:**
> Eitan: "The BOM, the payment terms, and the bidding... are they all separated in different sites and different folders?"  
> Alexandra: "Yes, site would."

**Current State**:
```
Network Structure (BROKEN):
├─ Maxwell/
│  ├─ BOMs/
│  ├─ PaymentTerms/
│  └─ Bids/
├─ Russia/
│  ├─ BOMs/ (Russian language)
│  ├─ PaymentTerms/
│  └─ Bids/
├─ China/
│  ├─ BOMs/ (Chinese language)
│  └─ ... (different structure)
└─ India/
   └─ ... (different structure)
```

**Problems**:
- No canonical BOM registry
- Unknown % of BOMs actually active
- Duplicate vendor entries across sites
- No cross-site visibility for customers served by multiple plants
- Payment terms per site, not per vendor globally

### 3. Procurement Prioritization Crisis

**What Alexandra Said:**
> "When we look at the total procurement spend, obviously indirect procurement is a little part from the total spend. So now we say it's a high focus, it's a different category and it's a different way to manage."

**Translation**:
- **Was treated as**: Low priority, ad-hoc management
- **Now recognized as**: Critical coordination layer
- **Current approach**: "1 by 1 by spend, by vendor, by criticality"

**Relay Diagnosis**:
- No pressure state visibility (which vendors/parts are critical?)
- No confidence scoring (which BOMs are reliable?)
- No ERI (Economic Reality Index) for vendor performance across sites

---

## Relay Solution Architecture

### Phase 1: Evidence Anchors (Replace File Chaos)

**Current**: Files scattered across site folders  
**Relay**: Append-only evidence anchors with provenance

#### 1.1 Vendor Evidence Anchor
```json
{
  "evidenceType": "VENDOR_REGISTRATION",
  "vendorId": "VEN-00123",
  "vendorName": "Acme Industrial Supplies",
  "registeredBy": {
    "site": "Maxwell",
    "user": "alexandra.demina@avgol.com",
    "timestamp": "2026-02-01T14:23:00Z"
  },
  "attributes": {
    "legalEntity": "Acme Industrial Ltd",
    "taxId": "IL-123456789",
    "primaryCategory": "electrical_components",
    "certifications": ["ISO9001", "ISO14001"]
  },
  "sites": ["Maxwell", "Russia"],
  "status": "ACTIVE",
  "commitHash": "sha256:abc123..."
}
```

**Key Properties**:
- ✅ Single vendor record, multiple site relationships
- ✅ Append-only (historical changes visible)
- ✅ Site-specific payment terms as separate anchors (linked by vendorId)
- ✅ Each site can propose changes, Maxwell (or custodian) approves

#### 1.2 BOM Evidence Anchor
```json
{
  "evidenceType": "BOM_REGISTRATION",
  "bomId": "BOM-NW-5000-REV3",
  "productFamily": "Nonwoven-5000-Series",
  "site": "Maxwell",
  "status": "ACTIVE",
  "components": [
    {
      "partNumber": "PART-EL-0045",
      "description": "Motor 3-phase 5kW",
      "vendor": "VEN-00123",
      "quantity": 1,
      "unitCost": {"amount": 850, "currency": "USD"},
      "leadTimeDays": 14
    },
    {
      "partNumber": "PART-MC-0122",
      "description": "Control board PCB-v2",
      "vendor": "VEN-00067",
      "quantity": 2,
      "unitCost": {"amount": 120, "currency": "USD"},
      "leadTimeDays": 21
    }
  ],
  "lastUsedDate": "2026-01-28",
  "productionCount": 145,
  "confidence": 0.92,
  "authoredBy": "purchasing.maxwell@avgol.com",
  "approvedBy": "eng.maxwell@avgol.com",
  "commitHash": "sha256:def456..."
}
```

**Key Properties**:
- ✅ Each BOM has usage evidence (lastUsedDate, productionCount)
- ✅ Confidence score based on recent usage + vendor reliability
- ✅ Dual approval (purchasing + engineering)
- ✅ Inactive BOMs remain in history but marked (no silent deletion)

#### 1.3 Payment Terms Evidence Anchor
```json
{
  "evidenceType": "PAYMENT_TERMS",
  "vendor": "VEN-00123",
  "site": "Maxwell",
  "terms": {
    "currency": "USD",
    "paymentDays": 30,
    "discountEarly": {"days": 10, "percent": 2},
    "preferredMethod": "bank_transfer"
  },
  "effectiveFrom": "2025-06-01",
  "effectiveUntil": null,
  "negotiatedBy": "alexandra.demina@avgol.com",
  "approvedBy": "finance.maxwell@avgol.com",
  "commitHash": "sha256:ghi789..."
}
```

**Why Separate from Vendor**:
- Payment terms change more frequently than vendor registration
- Different sites may have different terms with same vendor
- Finance must approve payment terms (different authority than procurement)

### Phase 2: Pressure States (Replace "Snowball" with Measurement)

**Current**: Problems accumulate invisibly until crisis  
**Relay**: Continuous pressure measurement with explicit thresholds

#### 2.1 Warehouse Pressure State
```json
{
  "stateType": "WAREHOUSE_PRESSURE",
  "site": "Maxwell",
  "timestamp": "2026-02-02T08:00:00Z",
  "metrics": {
    "unfulfilled_orders": {
      "count": 47,
      "pressure": 0.73,
      "threshold": 0.80,
      "state": "DEGRADED"
    },
    "parts_awaiting_receipt": {
      "count": 23,
      "aging_days_avg": 12,
      "pressure": 0.45,
      "state": "NORMAL"
    },
    "critical_stockouts": {
      "count": 3,
      "partNumbers": ["PART-EL-0045", "PART-MC-0089", "PART-HY-0234"],
      "pressure": 0.92,
      "state": "REFUSAL"
    }
  },
  "overall_state": "DEGRADED",
  "recommended_action": "PAUSE_NEW_ORDERS_UNTIL_CRITICAL_STOCKOUTS_RESOLVED",
  "commitHash": "sha256:jkl012..."
}
```

**Visible to**:
- Alexandra (purchasing manager)
- Warehouse manager
- Finance (for capacity planning)
- **NOT visible by default**: Vendors, customers

#### 2.2 Vendor Performance ERI (Economic Reality Index)
```json
{
  "stateType": "VENDOR_ERI",
  "vendor": "VEN-00123",
  "period": "2025-Q4",
  "sites": {
    "Maxwell": {
      "orderCount": 18,
      "onTimeDelivery": 0.83,
      "qualityScore": 0.91,
      "priceCompetitiveness": 0.78,
      "eri": 0.84,
      "confidence": 0.88
    },
    "Russia": {
      "orderCount": 5,
      "onTimeDelivery": 0.60,
      "qualityScore": 0.85,
      "priceCompetitiveness": 0.82,
      "eri": 0.76,
      "confidence": 0.65
    }
  },
  "globalERI": 0.82,
  "confidence": 0.81,
  "missingInputs": ["China_delivery_data", "India_quality_scores"],
  "state": "NORMAL",
  "commitHash": "sha256:mno345..."
}
```

**Why This Matters**:
- Shows vendor performance **across sites** (not just locally)
- Low confidence when data missing (honest about blind spots)
- Alexandra can see: "This vendor works great at Maxwell, poorly in Russia - why?"

### Phase 3: Cross-Site Coordination (Replace Fragmentation)

**Current**: Each site operates independently  
**Relay**: Explicit coordination with provenance

#### 3.1 Customer Relationship Anchor (Cross-Site)
```json
{
  "evidenceType": "CUSTOMER_RELATIONSHIP",
  "customerId": "CUST-00456",
  "customerName": "MegaCorp Manufacturing",
  "servingS

ites": ["Maxwell", "Russia", "China"],
  "contracts": [
    {
      "contractId": "CNT-2025-0089",
      "site": "Maxwell",
      "productFamily": "Nonwoven-5000-Series",
      "annualVolume": 50000,
      "currency": "USD",
      "status": "ACTIVE"
    },
    {
      "contractId": "CNT-2025-0134",
      "site": "Russia",
      "productFamily": "Nonwoven-3000-Series",
      "annualVolume": 30000,
      "currency": "EUR",
      "status": "ACTIVE"
    }
  ],
  "globalAccountManager": "sales.global@avgol.com",
  "commitHash": "sha256:pqr678..."
}
```

**Prevents**:
- Maxwell and Russia quoting different prices to same customer
- Duplicate bids for same contract
- Customer playing sites against each other

#### 3.2 Cross-Site BOM Reconciliation
```json
{
  "evidenceType": "BOM_RECONCILIATION",
  "productFamily": "Nonwoven-5000-Series",
  "sites": {
    "Maxwell": "BOM-NW-5000-REV3",
    "Russia": "BOM-NW-5000-RU-REV2",
    "China": "BOM-NW-5000-CN-REV1"
  },
  "differences": [
    {
      "component": "Motor",
      "Maxwell": {"partNumber": "PART-EL-0045", "vendor": "VEN-00123"},
      "Russia": {"partNumber": "PART-EL-0045-RU", "vendor": "VEN-00201"},
      "reason": "Local sourcing requirement"
    }
  ],
  "reconciliationState": "APPROVED",
  "approvedBy": "eng.global@avgol.com",
  "approvalDate": "2025-11-15",
  "commitHash": "sha256:stu901..."
}
```

**Why This Matters**:
- Sites can use different parts (local sourcing) **with explicit approval**
- Engineering sees all variants globally
- No silent divergence

---

## 3D Visualization Mission Plan

### Scene 1: The Problem (Current State)
**Camera**: Bird's eye view of 5 sites (Maxwell, Russia, China, India, + HQ)

**Visual Elements**:
1. **Site nodes** (spheres, color-coded by region)
2. **File chaos**: Spaghetti of thin lines representing scattered BOM/payment/bid files
   - Red lines = duplicate vendor entries
   - Orange lines = conflicting payment terms
   - Yellow lines = inactive BOMs still referenced
3. **Pressure rings** around Maxwell (warehouse) pulsing red
4. **Single buyer node** at Maxwell with RED "BOTTLENECK" indicator
5. **Missing authority node** (purchasing manager gap) shown as hollow sphere

**Narration**:
> "This is Avgol today. Five sites. Scattered data. One buyer trying to hold it together. Watch what happens when they try to process an order..."

**Demo Action**: Click "Process Order" button
- Order request appears at Maxwell
- Bounces between sites looking for BOM
- Finds 3 different versions
- Warehouse pressure ring turns red
- System state: **INDETERMINATE**

---

### Scene 2: Relay Transform (Phase 1 - Evidence Anchors)
**Camera**: Zoom into "Relay Core" node at center

**Visual Elements**:
1. **Canon Vault** (golden central sphere) appears
2. **Evidence anchors materialize**:
   - Vendor anchor (blue cube)
   - BOM anchor (green prism)
   - Payment terms anchor (purple cylinder)
3. **Filaments connect** sites to anchors (not to each other)
4. **Single source of truth** replaces file chaos

**Narration**:
> "Relay creates a single source of truth. Every vendor, every BOM, every payment term becomes an evidence anchor. Sites connect to Canon, not to each other."

**Demo Action**: Click vendor "Acme Industrial"
- All sites using this vendor light up
- Payment terms per site displayed
- Historical changes visible (append-only timeline)

---

### Scene 3: Pressure Visibility (Phase 2 - Coordination)
**Camera**: Focus on Maxwell warehouse

**Visual Elements**:
1. **Pressure rings** now show metrics:
   - Green: Normal (< 0.6 pressure)
   - Yellow: Degraded (0.6 - 0.8)
   - Red: Refusal (> 0.8)
2. **Warehouse pressure state** floats above site:
   ```
   Unfulfilled Orders: 47 (DEGRADED)
   Critical Stockouts: 3 (REFUSAL)
   ```
3. **ERI scores** appear as color-coded halos around vendors:
   - Acme Industrial: 0.84 (green)
   - XYZ Supplies: 0.62 (yellow - low Russia performance)
   - ABC Components: 0.45 (red - quality issues)

**Narration**:
> "Pressure becomes visible. Alexandra doesn't discover problems when they're critical. She sees them accumulate in real-time. And when warehouse hits refusal state..."

**Demo Action**: Warehouse pressure exceeds 0.8 threshold
- New order requests **refused explicitly**
- Refusal message: "Warehouse at capacity. Resolve 3 critical stockouts first."
- System suggests: "Contact VEN-00201 for expedited delivery of PART-EL-0045"

---

### Scene 4: Cross-Site Coordination (Phase 3 - Reality)
**Camera**: Pull back to show all 5 sites

**Visual Elements**:
1. **Customer node** (MegaCorp) appears above sites
2. **Contract filaments** connect customer to Maxwell, Russia, China (serving sites)
3. **BOM reconciliation view**:
   - Base BOM at center
   - Variants branch out with explicit approval stamps
   - Differences highlighted (different motors, local sourcing)

**Narration**:
> "When MegaCorp requests a quote, all serving sites see it. No duplicate bids. No conflicting prices. And when BOMs differ across sites, those differences are explicit and approved."

**Demo Action**: Customer requests quote
- Quote request appears at Canon
- Maxwell, Russia, China light up (serving sites)
- Each calculates quote based on local BOM + shared vendor data
- Global account manager sees all quotes before customer
- System flags: "Russia quote 15% higher due to local motor sourcing"

---

### Scene 5: The "Tomorrow" Promise (Autonomy)
**Camera**: Rotate to show system running without Alexandra

**Visual Elements**:
1. **Authority delegation** visible:
   - Alexandra's authority scope (approve vendors up to $50k)
   - Finance authority (approve payment terms)
   - Engineering authority (approve BOM changes)
2. **Pressure-driven workflow**:
   - Warehouse approaches 0.8 pressure
   - System automatically:
     - Notifies Alexandra
     - Suggests expedited orders for critical parts
     - Refuses non-critical new orders
3. **Mirror nodes** appear (Russia, China can run read-only if Canon Core offline)

**Narration**:
> "Alexandra asked: 'Maybe tomorrow we'll figure out there is something that can help us globally.' Tomorrow is here. When Alexandra is unavailable, the system doesn't break. It degrades explicitly. Sites can continue read-only. Critical decisions queue for her return. And most importantly..."

**Demo Action**: Simulate "purchasing manager absent for 6 months"
- Alexandra's node goes hollow (authority suspended)
- System state: **DEGRADED**
- Critical decisions queue in "proposals" folder
- Non-critical operations continue with existing BOMs/vendors
- **NO SILENT FAILURE**

---

## Implementation Roadmap

### Month 1: Evidence Anchors (Maxwell Only)
**Goal**: Replace file chaos for Maxwell site

**Deliverables**:
1. Vendor registry (all Maxwell vendors as evidence anchors)
2. Active BOM catalog (used in last 6 months)
3. Payment terms per vendor
4. Audit trail of changes

**Success Criteria**:
- ✅ No duplicate vendor entries
- ✅ 100% of active BOMs in Canon
- ✅ Payment terms approved by finance
- ✅ Historical file data preserved (not deleted)

### Month 2: Pressure Measurement
**Goal**: Make warehouse pressure visible

**Deliverables**:
1. Warehouse pressure dashboard
2. Critical stockout alerts
3. Vendor ERI scoring (Maxwell only)
4. Pressure thresholds + refusal rules

**Success Criteria**:
- ✅ Warehouse pressure updated hourly
- ✅ Alexandra receives alerts before critical state
- ✅ System refuses orders when capacity exceeded

### Month 3: Cross-Site Expansion (Russia)
**Goal**: Connect second site to Canon

**Deliverables**:
1. Russia vendor registry (merged with Maxwell)
2. Russia BOM catalog
3. Cross-site vendor performance comparison
4. Shared customer relationship tracking

**Success Criteria**:
- ✅ Duplicate vendors identified and reconciled
- ✅ Maxwell-Russia vendor performance visible side-by-side
- ✅ Shared customers flagged (no duplicate bids)

### Months 4-6: China, India, Full Coordination
**Goal**: Global coordination operational

**Deliverables**:
1. All 5 sites connected to Canon Core
2. Global vendor ERI across all sites
3. Cross-site BOM reconciliation
4. Multi-language support (English/Russian/Chinese/Hindi)

**Success Criteria**:
- ✅ Single vendor record, multiple site relationships
- ✅ BOM variants explicitly approved
- ✅ Customer quotes coordinated globally
- ✅ Alexandra can answer: "Which vendors work best across all sites?"

---

## Key Metrics to Track

### Before Relay (Baseline)
- **Unknown** % of BOMs active
- **Unknown** duplicate vendor entries
- **6-month** gap without purchasing manager = silent failure
- **47** unfulfilled orders (growing)
- **3** critical stockouts (discovered reactively)

### After Relay (Target - Month 6)
- **100%** BOM active status known
- **0** duplicate vendor entries
- **<24 hours** to detect purchasing manager gap = explicit degraded state
- **<20** unfulfilled orders (maintained via pressure threshold)
- **0** critical stockouts (prevented via ERI + early alerts)

---

## Risk Mitigation

### Risk 1: "Too complex for buyers to use"
**Mitigation**:
- Start with Maxwell only (familiar team)
- Alexandra as primary custodian (she already coordinates)
- UI shows current process + Relay enhancement (side-by-side)
- Buyers enter data once (no duplicate data entry)

### Risk 2: "Different languages across sites"
**Mitigation**:
- Evidence anchors language-neutral (IDs + structured data)
- UI translations per site (Russian/Chinese/Hindi)
- Part numbers/vendor names remain in original language
- Reconciliation shows translations side-by-side

### Risk 3: "Canon Core single point of failure"
**Mitigation**:
- Canon Core runs on Maxwell server (existing infrastructure)
- NAS backup (Synology DS923+) with hourly snapshots
- Russia/China/India run mirror nodes (read-only)
- If Canon Core offline: sites continue with cached data (DEGRADED state)

---

## Final Note: The "Snowball" Becomes a Measurement

Alexandra's most powerful metaphor:
> "We were staying just one buyer who couldn't even process a minimum thing... parts in the warehouse... all kind of things which were growing as a snowball."

**Relay's Answer**:
The snowball becomes **pressure**. And pressure becomes **explicit**. And explicit becomes **governable**.

When the next crisis comes (and it will), Relay won't stop it. But it will:
1. **Measure it** (pressure state)
2. **Explain it** (missing authority, capacity exceeded, vendor delayed)
3. **Refuse honestly** (no silent failure)
4. **Suggest repair** (expedite order, delegate authority, activate backup vendor)

That's the promise. That's tomorrow.

---

## Appendix: Transcript References

**Key Quotes**:
1. Team instability: "Our team keeps changing... 6 months without purchasing manager"
2. Bottleneck: "Just one buyer who couldn't even process a minimum thing"
3. Problem accumulation: "Growing as a snowball"
4. Prioritization shift: "Indirect procurement is a little part... now we say it's a high focus"
5. Current approach: "1 by 1 by spend, by vendor, by criticality"
6. Data fragmentation: "BOM, payment terms, bidding... separated in different sites and different folders"
7. Hope for solution: "Maybe tomorrow we'll figure out there is something that can help us globally"

**Meeting Context**:
- Prior audit provided insights (helped prioritize)
- American diversity mentioned (unclear context - possibly vendor diversity requirement?)
- Maxwell identified as largest site by scope/scale/spend
- Russia/China/India have language/management differences

---

**Status**: Ready for 3D Business Mission  
**Next Action**: Schedule live demo with Alexandra + Vered  
**Demo Duration**: 35-45 minutes (matches original meeting length)  
**Required**: Synology DS923+ setup + 3D prototype with Avgol data loaded
