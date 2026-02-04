# 🚀 RELAY FILAMENT SPREADSHEET - QUICK START

**For**: Users who want to understand filament spreadsheets in 5 minutes  
**Status**: Stage 2 Feature (Post-Stage-1)  
**Date**: 2026-02-04

---

## 🎯 THE CORE IDEA

**Traditional Spreadsheet:**
```
     A           B          C
1  Vendor     Price      Qty
2  Acme Co    $100       10
3  XYZ Inc    $200       5
```
- No history (who changed what?)
- No verification (is this correct?)
- Formulas break silently
- No audit trail

**Relay Filament Spreadsheet:**
```
Commit 1: Added Acme Co
  Intent: "Add vendor quote"
  Reality: {vendor: "Acme", price: $100, qty: 10}
  Projection: "Total will be $1000"
  Evidence: vendor-quote.pdf attached
  ERI: 85 (verified)

Commit 2: Added XYZ Inc
  Intent: "Add second vendor"
  Reality: {vendor: "XYZ", price: $200, qty: 5}
  Projection: "Total will be $2000"
  Evidence: purchase-order.pdf attached
  ERI: 90 (verified)
```

**Benefits:**
- ✅ Full audit trail (every change tracked)
- ✅ Evidence attached (PDFs, quotes, POs)
- ✅ Formula verification (three-way match)
- ✅ Data quality scoring (ERI per cell)
- ✅ Scenario planning (fork for "what if?")

---

## 📊 HOW IT WORKS

### **1. Every Edit = Commit**

When you change a cell:
```yaml
Old: B2 = $100
New: B2 = $120

Creates Commit:
  Intent: "Update vendor price"
  Reality: "$100 → $120"
  Projection: "Total increases to $1200"
  Authority: procurement@acme.com
  Evidence: updated-quote.pdf
```

---

### **2. Every Formula = Projection**

When you add a formula:
```yaml
Formula: =B2*C2 in cell D2

Creates Commit:
  Intent: "Calculate line total"
  Reality: "100 × 10 = 1000"
  Projection: "Grand total increases by $1000"
  Confidence: 0.90 (from input cells)
```

If formula result mismatches → **DRIFT** alert.

---

### **3. Every Cell Has ERI**

**ERI = Data Quality Score**

```
Cell B2: $100
  ERI: 85
  Confidence: 0.90
  Display: ✓ Verified
  
  Breakdown:
    Visibility: 100 (public)
    Configuration: 90 (schema valid)
    Patch: 85 (data from yesterday)
    Authority: 80 (expires in 10 days)
    Recovery: 95 (evidence attached)
```

**Indicators:**
- ✓ (green) = Verified (ERI ≥ 70%)
- ⚠️ (yellow) = Degraded (ERI 30-70%)
- ❓ (red) = Indeterminate (ERI < 30%)

---

### **4. Authority Expires**

**No permanent cell ownership:**

```yaml
Cell B2:
  Authority: procurement@acme.com
  Expires: 2026-02-15
  
After expiry:
  User cannot edit → refusal
  Must request new authority
```

**Human Flow Control:**
- Roles rotate (round robin)
- Authority decays
- No silent ownership accumulation

---

### **5. Fork for Scenarios**

**"What if?" analysis:**

```
Budget (Canon)
├── Vendor A: $100
├── Vendor B: $200
└── Total: $300

Budget-Optimistic (Fork)
├── Vendor A: $100
├── Vendor B: $200
├── Vendor C: $500  ← What if we add this?
└── Total: $800

Budget-Conservative (Fork)
├── Vendor A: $100
└── Total: $100  ← What if we cut Vendor B?
```

**Vote** to select which scenario becomes canon.

---

## 🔧 USE CASES

### **Procurement Budget**
- Track vendor quotes as commits
- Attach PDFs as evidence
- Verify budget formulas
- Fork for "what if we cut 10%?"

### **Financial Reports**
- Import SAP data as commits
- Three-way match accounting rules
- ERI tracks data quality
- Audit in parallel (fork)

### **Team Collaboration**
- Each user gets authority for their cells
- Authority expires (forces rotation)
- Forks for parallel work
- Merge when reconciled

---

## 📐 ARCHITECTURE SUMMARY

**Filament Spreadsheet = Commit Chain**

```
Each Row Operation = Commit
Each Cell Change = Diff
Each Formula = Projection
Each Cell = ERI Score + Authority + Evidence
```

**Three-Way Match:**
```
Intent (why?) ↔ Reality (what?) ↔ Projection (impact?)
```

**Authority Model:**
```
Cell → Authority → User + Role + Expiry
```

**ERI Model:**
```
Cell → ERI → V, C, P, A, R → Score + Confidence
```

---

## 🎯 TIMELINE

**Stage 2 Feature** (After Stage 1 Complete)

**8-week implementation:**
- Week 1-2: Core filament spreadsheet
- Week 3-4: Formula engine
- Week 5-6: Frontend UI
- Week 7: 3D filament visualization
- Week 8: SAP integration

---

## 📚 NEXT STEPS

**To Learn More:**
1. Read full spec: `RELAY-FILAMENT-SPREADSHEET-SPEC.md`
2. Understand three-way match: `CANON-RELAY-CORE-IMPLEMENTATION.md`
3. Understand ERI: `RELAY-CONTROL-SYSTEMS-PROOF.md`
4. Understand authority: `RELAY-HUMAN-FLOW-CONTROL-V2.md`

**To Implement:**
1. Complete Stage 1 first
2. Create `stage2-filament-spreadsheet` branch
3. Follow 8-week implementation plan in full spec
4. Demo with procurement use case

---

## 💡 KEY INSIGHT

**Spreadsheets are not flat tables.**

**Spreadsheets are 3D commit chains with:**
- ✅ History (filament commits)
- ✅ Verification (three-way match)
- ✅ Quality (ERI scores)
- ✅ Authority (expires, rotates)
- ✅ Evidence (PDFs, quotes attached)
- ✅ Scenarios (forks for planning)

**Relay transforms spreadsheets from fragile tools into verifiable coordination systems.** 📊🌳✨

---

**Status**: Stage 2 Ready  
**Full Spec**: `RELAY-FILAMENT-SPREADSHEET-SPEC.md`  
**Timeline**: 8 weeks post-Stage-1  
**Next**: Complete Stage 1, then implement
