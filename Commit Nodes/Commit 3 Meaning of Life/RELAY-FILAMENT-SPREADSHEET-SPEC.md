# 📊 RELAY FILAMENT SPREADSHEET SPECIFICATION

**Status**: STAGE 2 SPEC (LOCKED FOR POST-STAGE-1 IMPLEMENTATION)  
**Date**: 2026-02-04  
**Version**: 1.0  
**Purpose**: Transform spreadsheets from flat tables into 3D filament commit chains with three-way match verification

---

## 🎯 PURPOSE

**The Problem:**

Traditional spreadsheets are:
- ❌ **Flat** (no history, no causality)
- ❌ **Fragile** (formulas break silently)
- ❌ **Opaque** (no audit trail for changes)
- ❌ **Unverifiable** (can't prove data integrity)
- ❌ **Single-threaded** (no scenario planning/forking)

**The Relay Solution:**

Transform spreadsheets into **filament commit chains** where:
- ✅ Every edit is a commit (full history)
- ✅ Every formula is a projection (three-way match)
- ✅ Every cell has ERI (data quality score)
- ✅ Authority expires (no permanent cell ownership)
- ✅ Forks enable scenario planning (budget v1 vs v2)

---

## 🔬 CORE CONCEPT: SPREADSHEET AS COMMIT CHAIN

### **Traditional Spreadsheet (2D)**

```
     A           B          C          D
1  Vendor     Price      Qty      Total
2  Acme Co    $100       10       $1,000
3  XYZ Inc    $200       5        $1,000
4  TOTAL                          =SUM(D2:D3)
```

**Problems:**
- No record of who changed B2 from $90 to $100
- No proof that Qty=10 was authorized
- If formula breaks, no alert
- Can't see "what if Acme was $120?"

---

### **Relay Filament Spreadsheet (3D)**

```
Commit 1 (2026-01-15):
  Intent: "Add Acme vendor quote"
  Reality: {vendor: "Acme Co", price: "$100", qty: 10}
  Projection: "Total = $1,000, within budget"
  Authority: procurement@acme.com, expires: 2026-02-15
  ERI: 85 (verified quote attached)

Commit 2 (2026-01-20):
  Intent: "Add XYZ vendor quote"
  Reality: {vendor: "XYZ Inc", price: "$200", qty: 5}
  Projection: "Total = $2,000, within budget"
  Authority: procurement@acme.com, expires: 2026-02-15
  ERI: 90 (verified quote + PO)

Commit 3 (2026-01-25):
  Intent: "Calculate grand total"
  Reality: Formula =SUM(D2:D3), Result: $2,000
  Projection: "Budget utilization: 40% of $5,000"
  Authority: finance@acme.com, expires: 2026-03-01
  ERI: 95 (formula verified, inputs verified)
```

**Benefits:**
- ✅ Full audit trail (who changed what, when, why)
- ✅ Evidence attached (quote PDFs, PO numbers)
- ✅ Formula verification (three-way match)
- ✅ Authority tracking (who can edit, expires when)
- ✅ Data quality scoring (ERI per cell)

---

## 📐 ARCHITECTURE

### **1. Filament Object Model**

**Each spreadsheet = Filament**  
**Each row operation = Commit**  
**Each cell change = Diff within commit**

```yaml
filament:
  id: "budget-2026-q1"
  type: "spreadsheet"
  schema:
    columns:
      - {name: "Vendor", type: "string", authority: "procurement"}
      - {name: "Price", type: "currency", authority: "procurement"}
      - {name: "Qty", type: "integer", authority: "procurement"}
      - {name: "Total", type: "currency", authority: "finance", readonly: true}
  commits:
    - commit_1
    - commit_2
    - commit_3
```

---

### **2. Commit Structure**

**Each commit contains:**

```yaml
commit:
  id: "commit_abc123"
  timestamp: "2026-01-15T14:30:00Z"
  author: "procurement@acme.com"
  authorityRef:
    role: "procurement"
    expires_at: "2026-02-15T00:00:00Z"
  
  intent:
    description: "Add Acme vendor quote"
    source: "Email from vendor 2026-01-14"
    evidence:
      - type: "pdf"
        hash: "sha256:abc123..."
        url: "s3://evidence/acme-quote.pdf"
  
  reality:
    operation: "row_insert"
    row_index: 2
    cells:
      A2: {value: "Acme Co", type: "string"}
      B2: {value: 100.00, type: "currency"}
      C2: {value: 10, type: "integer"}
      D2: {value: 1000.00, type: "currency", formula: "=B2*C2"}
  
  projection:
    impacts:
      - cell: "D4"
        old_value: 0
        new_value: 1000.00
        description: "Grand total updated"
      - cell: "budget_utilization"
        old_value: "0%"
        new_value: "20%"
        description: "Budget utilization increased"
    
    triggers:
      - type: "approval_workflow"
        condition: "total > $5000"
        status: "not_triggered"
  
  eri:
    score: 85
    confidence: 0.90
    display_state: "verified"
    breakdown:
      visibility: 100  # Public data
      configuration: 80  # Schema validated
      patch_status: 90  # Up to date
      authority: 85  # Valid authority, near expiry
      recovery: 80  # Evidence attached
```

---

### **3. Cell Model**

**Each cell has:**

```yaml
cell:
  id: "budget-2026-q1:B2"
  value: 100.00
  type: "currency"
  formula: null  # or "=B2*C2" for calculated cells
  
  authority:
    role: "procurement"
    user: "procurement@acme.com"
    expires_at: "2026-02-15T00:00:00Z"
  
  eri:
    score: 85
    confidence: 0.90
    display_state: "verified"
  
  history:
    - {commit: "commit_abc123", value: 100.00, timestamp: "2026-01-15T14:30:00Z"}
    - {commit: "commit_def456", value: 90.00, timestamp: "2026-01-10T10:00:00Z"}
  
  evidence:
    - {type: "pdf", hash: "sha256:abc123...", description: "Vendor quote"}
  
  dependencies:
    affects: ["D2", "D4"]  # Cells that depend on this cell
    depends_on: []  # Cells this cell depends on
```

---

### **4. Formula as Projection**

**Every formula = Projection (future state)**

```yaml
formula:
  cell: "D2"
  expression: "=B2*C2"
  
  intent:
    description: "Calculate line total (price × quantity)"
  
  reality:
    inputs:
      B2: {value: 100.00, eri: 85}
      C2: {value: 10, eri: 90}
    output:
      D2: {value: 1000.00, calculated_at: "2026-01-15T14:30:01Z"}
  
  projection:
    confidence: 0.88  # min(0.90, 0.90) from inputs
    expected_range: [900, 1100]  # ±10% tolerance
    impacts:
      - {cell: "D4", description: "Affects grand total"}
  
  verification:
    three_way_match:
      intent: "price × qty"
      reality: "100 × 10 = 1000"
      projection: "Total increases by $1000"
      match: true
      confidence: 0.88
```

**Mismatch Detection:**

If `B2*C2 ≠ D2`:
- Create **drift object**
- Alert user
- Show repair options:
  1. Recalculate formula
  2. Override formula (requires authority + justification)
  3. Investigate data source

---

## 🔄 OPERATIONS

### **1. Row Insert (Create)**

**User Action**: Add new row

**Relay Process**:
1. Check authority (user has `procurement` role)
2. Create commit with intent, reality, projection
3. Calculate ERI for new cells
4. Propagate formulas (update dependents)
5. Three-way match verification
6. If match → commit to filament
7. If mismatch → create drift, show refusal

**Example Commit**:
```yaml
operation: "row_insert"
row_index: 3
cells:
  A3: "New Vendor"
  B3: 150.00
  C3: 8
  D3: "=B3*C3"  # Projection: 1200.00
```

---

### **2. Cell Update (Modify)**

**User Action**: Change cell value

**Relay Process**:
1. Check authority (user can edit this cell, not expired)
2. Record old value → new value diff
3. Create commit
4. Recalculate dependent formulas
5. Three-way match:
   - Intent: "Update price to $120"
   - Reality: B2 changes from $100 to $120
   - Projection: D2 becomes $1200, D4 becomes $2200
6. If projection matches reality → commit
7. If mismatch → drift object

---

### **3. Formula Application (Calculate)**

**User Action**: Add/modify formula

**Relay Process**:
1. Parse formula (detect dependencies)
2. Check authority (user can create calculated fields)
3. Evaluate formula with current inputs
4. Three-way match:
   - Intent: "Sum all totals"
   - Reality: =SUM(D2:D3) evaluates to $2000
   - Projection: "Budget shows $2000"
5. Track formula confidence (min of input ERIs)
6. Commit formula + result

**Formula Verification**:
```yaml
formula_commit:
  cell: "D4"
  formula: "=SUM(D2:D3)"
  inputs:
    D2: {value: 1000, eri: 85, confidence: 0.90}
    D3: {value: 1000, eri: 90, confidence: 0.92}
  output:
    D4: {value: 2000, confidence: 0.90}  # min(0.90, 0.92)
  
  three_way_match:
    intent: "Calculate grand total"
    reality: "SUM(1000, 1000) = 2000"
    projection: "Budget utilization = 40%"
    match: true
```

---

### **4. Row Delete (Remove)**

**User Action**: Delete row

**Relay Process**:
1. Check authority (user can delete rows)
2. Create commit with `operation: "row_delete"`
3. Mark row as deleted (soft delete, preserve history)
4. Recalculate formulas that referenced deleted cells
5. Three-way match:
   - Intent: "Remove vendor (discontinued)"
   - Reality: Row 2 marked deleted
   - Projection: "Total decreases by $1000"
6. Commit deletion

**Note**: Row is not physically removed, just marked `deleted: true` in filament history.

---

## 🎨 UI/UX DESIGN

### **1. Spreadsheet View (Surface)**

**Looks like a normal spreadsheet, but with Relay indicators:**

```
     A           B          C          D          ERI
1  Vendor     Price      Qty      Total
2  Acme Co    $100 ✓     10 ✓     $1,000 ✓      85 🟢
3  XYZ Inc    $200 ✓     5 ✓      $1,000 ✓      90 🟢
4  TOTAL                          $2,000 ✓      95 🟢
```

**Cell Indicators**:
- ✓ (green check) = Verified (ERI ≥ 70%, confidence high)
- ⚠️ (yellow warning) = Degraded (ERI 30-70%, or confidence medium)
- ❓ (red question) = Indeterminate (ERI < 30%, or confidence low)

**Click on cell** → Shows:
- Last modified: "2026-01-15 by procurement@acme.com"
- Authority: "procurement (expires 2026-02-15)"
- Evidence: "Vendor quote.pdf" (clickable)
- History: "3 changes" (clickable to see filament)

---

### **2. Filament View (Time Depth)**

**Click "View Filament" button** → 3D visualization:

```
     PRESENT (Surface)
     ================
     [Current spreadsheet state]
     
         ↓
         
     PAST (Below Surface)
     ====================
     Commit 3 (2026-01-25): Added total formula
     Commit 2 (2026-01-20): Added XYZ Inc
     Commit 1 (2026-01-15): Added Acme Co
     Commit 0 (2026-01-10): Created spreadsheet
```

**Each commit is clickable** → Shows:
- Diff (what changed)
- Intent, Reality, Projection
- Three-way match result
- ERI score at that commit

---

### **3. Formula Inspector**

**Click on formula cell** → Shows:

```
Cell: D2
Formula: =B2*C2

Inputs:
  B2: $100 (ERI: 85, verified ✓)
  C2: 10 (ERI: 90, verified ✓)

Output:
  D2: $1,000 (confidence: 0.90)

Three-Way Match:
  Intent: "Calculate line total"
  Reality: "100 × 10 = 1000"
  Projection: "Affects D4 (grand total)"
  Status: ✓ VERIFIED

Dependent Cells:
  D4 (Grand Total)
  Budget Utilization %
```

---

### **4. Scenario Planning (Forks)**

**"What if?" Analysis:**

User clicks **"Fork Spreadsheet"** → Creates parallel branch:

```
Budget (Canon)
├── Commit 1: Acme $100
├── Commit 2: XYZ $200
└── Commit 3: Total $2000

Budget-Optimistic (Fork)
├── Commit 1: Acme $100
├── Commit 2: XYZ $200
├── Commit 3: Total $2000
└── Commit 4: New vendor $500 (scenario only)

Budget-Conservative (Fork)
├── Commit 1: Acme $100
├── Commit 2: XYZ $200
├── Commit 3: Total $2000
└── Commit 4: Remove XYZ (scenario only)
```

**Vote to select canon** (which scenario becomes reality)

---

## 🔐 AUTHORITY & SECURITY

### **1. Cell-Level Authority**

**Each column has an authority role:**

```yaml
schema:
  columns:
    - name: "Vendor"
      authority: "procurement"  # Only procurement can edit
    - name: "Price"
      authority: "procurement"
    - name: "Qty"
      authority: "procurement"
    - name: "Total"
      authority: "finance"  # Only finance can edit (or readonly)
      readonly: true  # Calculated, no one can edit directly
```

**Authority Expiry:**
- All authority refs have `expires_at` timestamp
- Expired authority → refusal on edit
- Renewal requires new authorityRef commit

---

### **2. Row-Level Authority**

**Some rows may be locked to specific users:**

```yaml
row:
  index: 2
  authority:
    user: "user@acme.com"
    role: "procurement"
    expires_at: "2026-02-15T00:00:00Z"
    scope: "this_row_only"
```

---

### **3. Sheet-Level Authority**

**Entire spreadsheet can be locked:**

```yaml
spreadsheet:
  id: "budget-2026-q1"
  authority:
    role: "finance"  # Only finance can modify schema/structure
    expires_at: "2026-12-31T00:00:00Z"
  
  permissions:
    procurement: ["edit_rows", "view"]
    finance: ["edit_all", "view", "fork"]
    executive: ["view_only"]
```

---

## 📏 ERI FOR SPREADSHEETS

### **Cell ERI Components**

**V - Visibility**: Is this data public/private?  
**C - Configuration**: Is schema validated?  
**P - Patch Status**: Is data up to date?  
**A - Authority**: Is edit authority valid?  
**R - Recovery**: Is evidence attached?  

**Example:**

```yaml
cell_eri:
  V: 100  # Public procurement data
  C: 90   # Schema validated, correct type
  P: 85   # Data from yesterday (slightly stale)
  A: 80   # Authority expires in 10 days
  R: 95   # Evidence attached (vendor quote PDF)
  
  overall_eri: 90  # Weighted average
  confidence: 0.92
  display_state: "verified"
```

---

### **Formula ERI (Inherited)**

**Formula ERI = min(input ERIs) × formula_confidence**

```yaml
formula_eri:
  inputs:
    B2: 85
    C2: 90
  
  min_input_eri: 85
  formula_confidence: 0.95  # Formula is well-tested
  
  output_eri: 80.75  # 85 × 0.95
```

---

## 🔧 INTEGRATION WITH RELAY

### **1. Backend API Endpoints**

```javascript
// Create spreadsheet filament
POST /api/filaments/spreadsheet
{
  name: "budget-2026-q1",
  schema: {...},
  authority: {...}
}

// Insert row (creates commit)
POST /api/filaments/spreadsheet/:id/rows
{
  intent: "Add vendor quote",
  cells: {A2: "Acme", B2: 100, C2: 10},
  evidence: [{...}]
}

// Update cell (creates commit)
PATCH /api/filaments/spreadsheet/:id/cells/:cellId
{
  intent: "Fix price",
  old_value: 100,
  new_value: 120,
  evidence: [{...}]
}

// Get render packet (for 3D viz)
GET /api/filaments/spreadsheet/:id/render-packet
→ Returns render packet matching RELAY-RENDER-PACKET.schema.json

// Fork spreadsheet (scenario planning)
POST /api/filaments/spreadsheet/:id/fork
{
  fork_name: "budget-optimistic",
  description: "What if we add new vendor?"
}
```

---

### **2. Frontend Components**

**New React Components:**

```jsx
// Filament spreadsheet grid
<FilamentSpreadsheet 
  filamentId="budget-2026-q1"
  renderPacket={packet}
  onCellEdit={handleEdit}
  onFormulaApply={handleFormula}
  mode="SIMULATION" // or "LIVE"
/>

// Cell inspector (shows ERI, authority, history)
<CellInspector 
  cell={selectedCell}
  onViewFilament={showFilamentView}
/>

// Formula inspector (shows three-way match)
<FormulaInspector 
  formula={selectedFormula}
  onVerify={runThreeWayMatch}
/>

// Filament view (3D commit history)
<FilamentTimeline 
  commits={commitHistory}
  onSelectCommit={highlightChanges}
/>
```

---

### **3. Schema Validation**

**Spreadsheet schema must conform to:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["string", "number", "currency", "date", "boolean"]},
          "authority": {"type": "string"},
          "readonly": {"type": "boolean"}
        },
        "required": ["name", "type"]
      }
    }
  }
}
```

---

## 🎯 USE CASES

### **Use Case 1: Procurement Budget Tracking**

**Problem**: Excel budget with no audit trail, formulas break, no evidence

**Relay Solution**:
1. Create filament spreadsheet with procurement schema
2. Each vendor quote = commit with evidence (PDF attached)
3. Budget formulas = projections (auto-verify)
4. Authority expires (procurement role rotates)
5. Fork for scenarios ("what if we cut 10%?")

**Benefits**:
- Full audit trail (who added what vendor, when)
- Evidence anchored (quotes, POs attached to commits)
- Formula verification (alerts if budget math breaks)
- Scenario planning (fork for different budget allocations)

---

### **Use Case 2: Financial Reporting**

**Problem**: Monthly reports in Excel, manual reconciliation, errors creep in

**Relay Solution**:
1. Financial data imported as filament commits
2. Formulas (balance sheet calculations) = projections
3. Three-way match: Intent (accounting rules) ↔ Reality (actual numbers) ↔ Projection (forecasts)
4. ERI tracks data quality (missing inputs = low ERI)
5. Fork for audits (audit branch vs. working branch)

**Benefits**:
- Automated reconciliation (three-way match)
- Data quality scoring (ERI per line item)
- Audit trail (every change tracked)
- Safe audits (fork, audit in parallel, merge when reconciled)

---

### **Use Case 3: SAP Data Import**

**Problem**: SAP exports to Excel, manual data entry, no sync

**Relay Solution**:
1. SAP export becomes evidence object (CSV attached)
2. Import creates filament commits (one per row)
3. Formulas verify SAP data (detect mismatches)
4. ERI tracks data freshness (stale SAP data = degraded ERI)
5. Round-trip: Relay → SAP (export filament back to SAP)

**Benefits**:
- Evidence anchoring (SAP export attached)
- Automated verification (formulas check SAP data)
- Drift detection (if Relay diverges from SAP)
- Bidirectional sync (Relay ↔ SAP)

---

### **Use Case 4: Team Collaboration**

**Problem**: Multiple people editing same spreadsheet, conflicts, overwrites

**Relay Solution**:
1. Each user gets authority for their cells
2. Authority expires (forces rotation)
3. Forks for parallel work (person A fork, person B fork)
4. Merge when ready (explicit reconciliation)
5. Round robin enforced (no permanent cell ownership)

**Benefits**:
- No overwrite conflicts (authority per cell)
- Parallel work (forks)
- Explicit reconciliation (merge commits)
- Human flow control (rotation, load limits)

---

## 🚧 IMPLEMENTATION PHASES

### **Phase 1: Core Filament Spreadsheet** (Week 1-2)

**Tasks:**
1. Create spreadsheet filament object model
2. Implement row insert/update/delete operations
3. Implement cell-level commits
4. Basic ERI calculation for cells
5. Schema validation

**Deliverables:**
- Backend API for spreadsheet operations
- Database schema for filament spreadsheets
- Basic tests

---

### **Phase 2: Formula Engine** (Week 3-4)

**Tasks:**
1. Parse formulas (detect dependencies)
2. Evaluate formulas (calculate results)
3. Three-way match for formulas
4. Formula confidence scoring
5. Drift detection for formula mismatches

**Deliverables:**
- Formula parser + evaluator
- Three-way match engine integration
- Formula verification tests

---

### **Phase 3: Frontend Spreadsheet UI** (Week 5-6)

**Tasks:**
1. Build spreadsheet grid component
2. Cell editing with authority checks
3. ERI indicators per cell
4. Formula inspector
5. Cell inspector (history, evidence)

**Deliverables:**
- React components for spreadsheet
- Cell/formula inspectors
- Integration with render packets

---

### **Phase 4: Filament Visualization** (Week 7)

**Tasks:**
1. 3D filament timeline view
2. Commit history visualization
3. Diff viewer (before/after)
4. Scenario planning (fork UI)

**Deliverables:**
- 3D filament view for spreadsheets
- Fork/merge UI

---

### **Phase 5: SAP Integration** (Week 8)

**Tasks:**
1. CSV/Excel import
2. SAP data mapping
3. Evidence anchoring (attach exports)
4. Bidirectional sync (Relay ↔ SAP)

**Deliverables:**
- Import/export functionality
- SAP integration module

---

## ✅ SUCCESS CRITERIA

**Filament Spreadsheet is complete when:**

**Backend:**
- ✅ Spreadsheet filament object model implemented
- ✅ Row/cell operations create commits
- ✅ Formula engine evaluates + verifies formulas
- ✅ Three-way match for cells and formulas
- ✅ ERI calculated per cell
- ✅ Authority enforced (cell/row/sheet level)
- ✅ API endpoints for all operations

**Frontend:**
- ✅ Spreadsheet grid renders from render packet
- ✅ Cell editing gated by authority
- ✅ ERI indicators displayed per cell
- ✅ Formula inspector shows three-way match
- ✅ Cell inspector shows history + evidence
- ✅ Filament timeline view (3D commit history)

**Integration:**
- ✅ Works with existing Relay backend
- ✅ Render packets conform to schema
- ✅ SIMULATION mode blocks edits
- ✅ LIVE mode gates edits through constraints
- ✅ Human flow control enforced (authority rotation)

**Use Cases:**
- ✅ Can import SAP data as filament
- ✅ Can track procurement budget
- ✅ Can verify financial reports
- ✅ Can fork for scenario planning

---

## 🔗 DEPENDENCIES

**Requires from Stage 1:**
- ✅ Three-way match engine
- ✅ ERI calculator (with gradients)
- ✅ Render packet schema
- ✅ Backend API (filament routes)
- ✅ Authority decay system
- ✅ Constraint gates
- ✅ Human flow control

**New Dependencies:**
- Formula parser library (e.g., `formula.js`, `handsontable/formula-parser`)
- Spreadsheet UI library (e.g., `react-datasheet`, `handsontable`, or custom)
- CSV/Excel parser (e.g., `papaparse`, `xlsx`)

---

## 📝 IMPLEMENTATION NOTES

### **1. Formula Evaluation Strategy**

**Option A: Server-Side Evaluation** (Recommended)
- All formulas evaluated on backend
- Frontend receives results only
- Prevents formula tampering
- Consistent with render packet architecture

**Option B: Client-Side Evaluation**
- Formulas evaluated in browser
- Faster response
- Risk of formula manipulation

**Recommendation**: **Server-side** (matches Stage 1 architecture)

---

### **2. Large Spreadsheets**

**For spreadsheets with 10,000+ rows:**
- Implement pagination (load rows on demand)
- Lazy formula evaluation (calculate visible cells only)
- Incremental commits (batch row inserts)
- Background ERI calculation

---

### **3. Formula Conflicts**

**If two users edit formulas in same cell:**
- Create fork (two branches)
- Vote to select canon
- Or: Authority prevents conflict (only one user can edit formula cell)

---

## 🎯 NEXT STEPS

### **For Canon (After Stage 1 Complete):**

1. **Read this spec** (understand filament spreadsheet model)
2. **Create implementation branch**: `stage2-filament-spreadsheet`
3. **Phase 1**: Implement core filament spreadsheet (Week 1-2)
4. **Phase 2**: Implement formula engine (Week 3-4)
5. **Phase 3**: Build frontend UI (Week 5-6)
6. **Phase 4**: Add 3D filament visualization (Week 7)
7. **Phase 5**: SAP integration (Week 8)
8. **Demo**: Working filament spreadsheet with procurement use case

**Timeline**: 8 weeks (post-Stage-1)

---

## 📚 RELATED DOCUMENTS

**Stage 1 Specs (Prerequisites):**
- `CANON-RELAY-CORE-IMPLEMENTATION.md` → Three-way match, authority
- `RELAY-CONTROL-SYSTEMS-PROOF.md` → ERI gradients
- `RELAY-RENDER-PACKET-SCHEMA.md` → Packet format
- `RELAY-BACKEND-PSEUDOCODE.md` → Computation loop
- `RELAY-HUMAN-FLOW-CONTROL-V2.md` → Authority rotation

**Use Case Specs:**
- `RELAY-PROCUREMENT-BIDDING-SPEC.md` → Procurement workflows
- `BUSINESS-BEST-PRACTICES-ADOPTION.md` → Generic business pattern

---

## 🔒 FINAL NOTES

**This specification is LOCKED for Stage 2.**

**Philosophy:**
- Spreadsheets are not flat tables—they are commit chains
- Formulas are not magic—they are projections subject to three-way match
- Cells are not ownerless—they have authority that expires
- Changes are not silent—every edit is a commit
- Scenarios are not hypothetical—they are forks

**Relay transforms spreadsheets from fragile, opaque tools into verifiable, auditable coordination systems.**

---

**END OF SPEC**

**Status**: ✅ LOCKED (Stage 2 Implementation Ready)  
**Timeline**: 8 weeks (post-Stage-1)  
**Success**: Filament spreadsheet working with procurement use case  
**Next**: Canon completes Stage 1, then implements this spec

**Spreadsheets are now 3D filaments. Let's build.** 📊🌳✨
