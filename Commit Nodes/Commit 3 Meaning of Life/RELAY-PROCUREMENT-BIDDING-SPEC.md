# 🏗️ RELAY PROCUREMENT & BIDDING METHODOLOGY

**Date**: 2026-02-02  
**Status**: IMPLEMENTATION SPEC  
**Domain**: Stage 1 (3D Coordination Adoption)  
**Purpose**: Apply Relay's three-way match to procurement/bidding workflows

---

## 🎯 THE PROBLEM (THREE-WAY MATCH FAILURE)

### **Current State (2D Fragmentation)**

**Intent** (Policy):
- "Get 2-3 competitive quotes"
- "Annual review for high-spend categories"
- "Local thresholds: $5k Maxwell, $50k annual review"

**Projection** (What people claim):
- "We followed the SOP"
- "Quotes were collected"
- "Best vendor was selected"

**Reality** (What actually exists):
- ❌ Quotes scattered across email, SharePoint, local drives
- ❌ No link between quotes and SAP PO/PR
- ❌ Cannot verify procurement compliance
- ❌ Audits fail because evidence is missing
- ❌ "SAP doesn't store quotes well" (symptom, not root cause)

**Three-Way Match Status**: **DIVERGENT** 🔴

---

## ✅ THE SOLUTION (RELAY COORDINATION PHYSICS)

### **Core Principle**

**SAP = Transaction System of Record**  
**Evidence Pack = Quote Reality Anchor**  
**Relay = Coordination Layer (Three-Way Match Enforcement)**

### **The Quote Evidence Pack (QEP)**

A **QEP** is a **filament object** that anchors procurement reality:

```yaml
QEP Object Schema:
  qep_id: unique identifier
  site: [India, Russia, China, Israel, US, Maxwell]
  category: procurement category
  subcategory: detailed classification
  spend_band: [<5k, 5k-50k, >50k annual]
  
  vendor_quotes:
    - vendor_id
    - quote_amount
    - quote_date
    - quote_document_hash (Merkle proof)
    - quote_storage_path (SharePoint/link)
  
  award_decision:
    - selected_vendor
    - rationale (why chosen)
    - approver_authority_ref
    - approval_timestamp
  
  links:
    - sap_pr_number
    - sap_po_number
    - contract_id (CMS)
    - sharepoint_folder
  
  attestation:
    - created_by
    - created_at
    - reviewed_by
    - reviewed_at
    - merkle_root (all quotes + decision)
```

---

## 🔒 THREE-WAY MATCH FOR PROCUREMENT

### **Intent Layer (Policy)**

**Per-Site Category Policy Table**:

```
Site | Category | Threshold | Required Method | Review Cadence | Owner Role
-----|----------|-----------|-----------------|----------------|------------
Maxwell | All | $5k | 3 competitive quotes | Per transaction | Site Manager
India | MRO | $50k annual | Annual competitive bid | Yearly | Procurement
Russia | Tooling | $50k annual | Volume bundling + bid | Yearly | Procurement
China | Components | $100k annual | Strategic sourcing | Yearly | Category Manager
Israel | Services | $25k annual | RFP process | Yearly | Finance
US | All categories | $50k annual | Competitive bid cycle | Yearly | Procurement
```

**This table defines INTENT** (what should happen).

---

### **Projection Layer (Claims)**

**When procurement claims**: "We followed procedure and selected best vendor"

**This creates a projection commit**:
```yaml
projection_commit:
  claim: "Vendor selected via competitive process"
  qep_id: QEP-2026-0123
  sap_po: 4500012345
  approver: john.doe@company.com
  timestamp: 2026-02-02T10:30:00Z
```

---

### **Reality Layer (Evidence)**

**Reality is anchored by**:
- ✅ QEP exists and is complete
- ✅ Minimum quote count met (per policy table)
- ✅ Quotes are Merkle-hashed (tamper-proof)
- ✅ Award rationale documented
- ✅ Approver has authority (authorityRef valid)
- ✅ SAP PO links to QEP

**Reality verification**:
```yaml
reality_check:
  qep_exists: true
  quote_count: 3 (policy requires 3)
  quotes_hashed: true
  approver_authority: valid (expires 2026-12-31)
  sap_link: confirmed (PO 4500012345)
  
  status: VERIFIED ✅
```

---

## 🚫 REFUSAL MECHANICS

### **When Three-Way Match Fails**

**Scenario 1: No QEP Link in SAP**

```
User attempts: Close PO 4500012345
System checks: QEP_ID field in SAP
Result: EMPTY

Refusal:
  "Cannot close PO 4500012345
   Reason: No QEP link (procurement evidence missing)
   Required: Create QEP and link via PO header field
   Authority: Per Site Procurement Policy Table"
```

**Scenario 2: Quote Count Below Threshold**

```
User attempts: Approve vendor selection
System checks: QEP-2026-0124
Result: Only 1 quote provided (policy requires 3)

Refusal:
  "Cannot approve vendor selection
   Reason: Δ(Quote Count) = -2 (1 actual, 3 required)
   Category: MRO
   Site: India
   Policy: 3 competitive quotes required
   Next step: Obtain 2 additional quotes or request policy exception"
```

**Scenario 3: Approver Authority Expired**

```
User attempts: Award contract to Vendor X
System checks: Approver authorityRef
Result: Authority expired 2026-01-15

Refusal:
  "Cannot authorize award
   Reason: Authority expired (16 days ago)
   Approver: jane.smith@company.com
   Required: Renew authority or escalate to valid authority"
```

---

## 📊 ACCUMULATION RULE (CRITICAL)

### **The Problem**

Small purchases ($3k each) to same vendor accumulate to $60k/year → **should have triggered annual competitive bid**.

**This is where most systems fail.**

### **The Solution**

**Relay tracks accumulation as a filament**:

```yaml
vendor_accumulation_filament:
  vendor_id: VENDOR-12345
  site: Maxwell
  category: MRO
  fiscal_year: 2026
  
  commits:
    - po: 4500001, amount: $3,200, date: 2026-01-15
    - po: 4500045, amount: $2,800, date: 2026-02-03
    - po: 4500089, amount: $3,500, date: 2026-03-10
    # ... continues
  
  running_total: $62,400
  threshold: $50,000 annual (per policy table)
  
  status: THRESHOLD EXCEEDED
  action_required: Annual competitive bid cycle
  pressure: 18 (divergence accumulating)
```

**When threshold exceeded**:

```
Next PO attempt to VENDOR-12345 triggers:

Warning:
  "Vendor accumulation: $62,400 YTD
   Threshold: $50,000 annual
   Status: Competitive bid cycle required
   
   Options:
   1. Initiate annual bid cycle (create QEP)
   2. Request policy exception (requires CFO authority)
   3. Use alternative vendor (requires new QEP)"
```

---

## 🏗️ SYSTEM ARCHITECTURE

### **Layer 1: SAP (Transaction System)**

**SAP Stores**:
- PR/PO numbers
- Vendor master data
- Spend transactions
- **QEP_ID pointer field** (mandatory)

**SAP Does NOT Store**:
- Quote documents (too large, wrong format)
- Detailed bidding rationale
- Complete audit trail

---

### **Layer 2: SharePoint (Evidence Storage)**

**SharePoint Stores**:
- Quote documents (PDFs, emails, spreadsheets)
- Vendor proposals
- Award rationale documents
- Meeting notes
- Correspondence

**Organized by**:
```
/Procurement/
  /QEP-2026-0001/
    quotes/
      vendor-a-quote.pdf
      vendor-b-quote.pdf
      vendor-c-quote.pdf
    decision/
      award-rationale.docx
      approval-email.msg
    metadata.json (QEP object)
```

---

### **Layer 3: Relay (Coordination Layer)**

**Relay Provides**:
- Three-way match enforcement
- Policy table (intent definition)
- QEP object model
- Accumulation tracking
- Refusal mechanics
- Pressure/divergence calculation
- Audit trail (filament history)

**Relay Does NOT**:
- Replace SAP
- Store quote documents
- Execute transactions

**Relay = Coordination substrate**

---

## 🔧 IMPLEMENTATION STEPS

### **Phase 1: QEP Schema & Storage**

**Build**:
1. QEP object schema (YAML/JSON)
2. SharePoint folder convention
3. QEP creation workflow (form/intake)
4. Merkle hash generation for quotes

**Deliverable**: QEP can be created and stored

---

### **Phase 2: SAP Integration (Pointer Field)**

**Build**:
1. Add custom field to SAP PO header: `ZZ_QEP_ID`
2. Add custom field to SAP PR header: `ZZ_QEP_ID`
3. Make fields **mandatory** for PO closure
4. Display SharePoint link in SAP transaction view

**Deliverable**: SAP POs always link to QEPs

---

### **Phase 3: Policy Table Implementation**

**Build**:
1. Per-site category policy table (Excel/DB)
2. Policy lookup API
3. Policy version control (table is versioned filament)
4. Policy change workflow (requires authority)

**Deliverable**: Intent is clearly defined per site/category

---

### **Phase 4: Refusal Mechanics**

**Build**:
1. Pre-check validation (before PO approval)
2. Refusal message generation
3. Missing evidence detection
4. Next-step guidance

**Deliverable**: System refuses when three-way match fails

---

### **Phase 5: Accumulation Tracking**

**Build**:
1. Vendor spend aggregation (per site/category/year)
2. Threshold monitoring
3. Warning triggers
4. Required action workflow

**Deliverable**: Accumulation violations are caught

---

### **Phase 6: Dashboard & Audit**

**Build**:
1. Global procurement dashboard (top-level view)
2. Drill-down to site/category/QEP
3. Divergence heatmap (where Δ(PR) is high)
4. Audit export (filament replay)

**Deliverable**: Visibility and auditability

---

## 📋 POLICY TABLE EXAMPLE (DETAILED)

### **Maxwell Site**

```yaml
site: Maxwell
local_threshold: $5,000
owner: Site Manager

categories:
  - category: MRO
    method: 3 competitive quotes (per transaction)
    review: Per transaction
    exceptions: Emergency repairs (post-approval audit)
  
  - category: Tooling
    method: 3 competitive quotes
    review: Per transaction
    exceptions: Proprietary tools (single source justification required)
  
  - category: Services
    method: 3 competitive quotes
    review: Per transaction
    exceptions: Specialized services (CEO authority required)
```

### **India Site**

```yaml
site: India
local_threshold: $10,000
annual_threshold: $50,000
owner: Procurement Manager

categories:
  - category: MRO
    method: Annual competitive bid (if >$50k/year)
    review: Yearly
    accumulation_tracking: true
  
  - category: Components
    method: Strategic sourcing + volume bundling
    review: Quarterly
    accumulation_tracking: true
  
  - category: IT Hardware
    method: Central IT approval + 3 quotes
    review: Per transaction
    exceptions: Emergency replacements
```

### **Global (All Sites)**

```yaml
global_rules:
  - Single source purchases >$25k require:
      - Written justification
      - CFO approval
      - Annual re-verification
  
  - Emergency purchases:
      - Allowed without pre-quotes
      - Require post-approval QEP within 48 hours
      - Site manager authority sufficient up to $10k
      - CFO authority required >$10k
  
  - Policy exceptions:
      - Require written request
      - Require authority one level above normal
      - Logged as exception filament
      - Annual exception review
```

---

## 🚨 THREE FAILURE CASES & FIXES

### **Case A: SAP Can Store Quotes, But People Don't Use It**

**Symptom**: Quote attachment field exists but is empty

**Root Cause**: No enforcement

**Fix**:
- Make QEP_ID field **mandatory** for PO closure
- Add workflow gate: "No QEP → No close"
- Training: Show how to create QEP and link

**Result**: Compliance through refusal, not nagging

---

### **Case B: SAP Can't Store Quote Artifacts Properly**

**Symptom**: Quotes too large, wrong format, poor UX

**Root Cause**: SAP not designed for document management

**Fix**:
- SAP stores **pointer only** (QEP_ID + SharePoint link)
- SharePoint stores **artifacts** (PDFs, docs, emails)
- Relay coordinates **relationship**

**Result**: Right tool for each job

---

### **Case C: Quotes Live in Email/Desktop Chaos**

**Symptom**: "I have it somewhere, I'll send it later"

**Root Cause**: No intake pipeline

**Fix**:
- Create **Quote Intake Workflow**:
  1. Email to procurement-quotes@company.com
  2. Auto-creates draft QEP
  3. Assigns QEP_ID
  4. Files to SharePoint
  5. Sends confirmation with QEP_ID
- **No QEP → No valid quote**

**Result**: Evidence becomes first-class object

---

## 🎯 SUCCESS METRICS

### **What Good Looks Like**

**100% QEP Linkage**:
- Every PO >$5k links to valid QEP
- Zero "quotes missing" in audits

**Accumulation Tracking**:
- All vendors >$50k/year have annual bid cycle QEP
- Zero surprise high-spend vendors

**Refusal Rate**:
- 5-10% of PO attempts refused initially (normal)
- 95%+ resolution within 24 hours
- Zero refusal overrides (if refused, fix it properly)

**Audit Time**:
- Reduce from days → minutes
- Click QEP_ID → see complete evidence pack
- Filament replay shows full history

---

## 🔒 RELAY PRINCIPLES DEMONSTRATED

This procurement spec demonstrates **all** core Relay principles:

### **1. Three-Way Match**
- Intent (policy table)
- Projection (procurement claims)
- Reality (QEP evidence)

### **2. Evidence Anchoring**
- Quotes are Merkle-hashed
- QEP is tamper-evident
- Filament provides audit trail

### **3. Authority Tracking**
- Approver authorityRef required
- Authority expires (must renew)
- Escalation path clear

### **4. Refusal as First-Class**
- No QEP → refusal (not warning)
- Refusal explains why + next step
- Refusal is auditable event

### **5. Pressure/Divergence**
- Accumulation creates pressure
- Missing quotes create divergence
- Dashboard shows Δ(PR) heatmap

### **6. No Hidden Authority**
- Policy table is visible
- Exceptions require authority
- All changes are commits

### **7. Fork Preservation**
- Policy changes are versioned
- Old policy remains visible
- Can replay under old rules

---

## 📦 DELIVERABLES FOR CANON

**Canon must implement**:

1. **QEP Object Model** (schema + methods)
2. **SAP Pointer Field** (ZZ_QEP_ID mandatory)
3. **Policy Table** (per-site thresholds + methods)
4. **Refusal Logic** (pre-check validation)
5. **Accumulation Tracker** (vendor spend aggregation)
6. **Dashboard** (global → site → category → QEP)

**Timeline**:
- Phase 1-3: Core infrastructure (4-6 weeks)
- Phase 4-5: Enforcement + tracking (3-4 weeks)
- Phase 6: Dashboard + audit (2-3 weeks)

**Total**: ~10-13 weeks to full implementation

---

## 🌟 THE BIG PICTURE

**This isn't just "fixing SAP quote storage."**

**This is**:
- Applying Relay's coordination physics to real business process
- Proving three-way match works in production
- Demonstrating refusal mechanics
- Showing how 2D systems (SAP) + evidence stores (SharePoint) + coordination layer (Relay) = coherent reality

**If this works for procurement, it works for**:
- Change management
- Quality control
- Project approvals
- Contract management
- Compliance tracking
- Any workflow with intent/projection/reality gap

**This is Stage 1 in action.** 🔒
