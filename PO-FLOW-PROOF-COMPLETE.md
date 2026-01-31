# PO Flow Proof - Complete Test Guide

**Route:** `/proof/po-flow`  
**Status:** ✅ Ready for testing  
**Date:** 2026-01-27

---

## 🎯 **What This Proof Demonstrates:**

### **The Big Idea:**
**Procurement is not a document; it's a governed chain of irreversible state commits.**

This proof shows:
- ✅ Multi-filament orchestration (4 filaments working together)
- ✅ State gates (approval required, match required before payment)
- ✅ **Match is a filament, not a query** (auto-generated commits)
- ✅ Variance detection without queries (deterministic evaluation)
- ✅ Ledger pairs lock at same commitIndex (double-entry with physics)
- ✅ End-to-end causality visible in 3D

---

## 📋 **Test Scenario:**

### **The Story:**
You're buying industrial widgets and bolts. The scenario is:

1. **Create PO:**
   - Line A: Widget (ordered 10 @ $50)
   - Line B: Bolt (ordered 5 @ $2)

2. **Approve PO:** (GATE passed)

3. **Record Receipt:** (Warehouse receives goods)
   - Line A: **8 received** (partial! 2 missing)
   - Line B: 5 received (full)

4. **Capture Invoice:** (Vendor bills for full qty)
   - Line A: **10 invoiced** (full qty, but only 8 received!)
   - Line B: 5 invoiced

5. **Match Auto-Generated:**
   - System creates match filament
   - Detects variance: **invoiced 10, received 8, delta +2**
   - Match state = **EXCEPTION** (blocks payment)

6. **Approve Override:** (Human decision)
   - AP Manager approves: "Accept partial receipt, vendor confirmed backorder"
   - Match state changes to **PASS**
   - GATE opens for payment

7. **Post to Ledger:** (Locked pair created)
   - ledger.AP (CREDIT $510)
   - ledger.EXPENSE (DEBIT $510)
   - Both share same `postingEventId`

---

## 🧪 **Test Instructions:**

### **Step 0: Navigate to Proof**
```
http://localhost:5173/proof/po-flow
```

### **Step 1: Create PO**
1. Click **"1. Create PO (2 lines)"** button
2. **Expected:**
   - Status: "✅ PO created (2 lines: Widget x10, Bolt x5)"
   - 3D view: **Cyan cube** appears at top (PO filament)
   - Right panel: PO Lines shows 2 entries
   - Button turns green with ✅

### **Step 2: Approve PO**
1. Click **"2. Approve PO (GATE)"** button
2. **Expected:**
   - Status: "✅ PO approved (GATE passed)"
   - 3D view: **Second cyan cube** appears (approval commit)
   - PO filament now has 2 cubes

### **Step 3: Record Receipt (Partial)**
1. Click **"3. Record Receipt (Partial)"** button
2. **Expected:**
   - Status: "✅ Receipt recorded (Widget: 8 of 10 received - PARTIAL!)"
   - 3D view:
     - **Green cube** appears mid-left (receipt filament)
     - **Gray cube** appears bottom (match filament, first evaluation)
   - Right panel: Receipt Lines shows "Line A: Received 8", "Line B: Received 5"
   - Match Variance: Shows "No variances" (invoice not yet received)

### **Step 4: Capture Invoice**
1. Click **"4. Capture Invoice"** button
2. **Expected:**
   - Status: "⚠️ Invoice captured (Widget: 10 invoiced vs 8 received = EXCEPTION!)"
   - 3D view:
     - **Yellow cube** appears mid-right (invoice filament)
     - **Red cube** appears bottom (match filament turns RED)
     - **Dashed lines** appear connecting match to PO/Receipt/Invoice (dependency rays)
   - Right panel: 
     - Invoice Lines shows "Line A: Invoiced 10", "Line B: Invoiced 5"
     - **Match Variance shows RED warning:**
       ```
       ⚠️ Line A: QTY MISMATCH
       Ordered: 10 | Received: 8 | Invoiced: 10
       Delta: +2 (BLOCK)
       ```
   - Match status: **EXCEPTION**

### **Step 5: Override Exception**
1. Click **"5. Override Exception"** button (should be RED border)
2. **Expected:**
   - Status: "✅ Override approved (GATE opened for payment)"
   - 3D view:
     - **Second cube** appears on match filament
     - Match filament color changes from **RED → GREEN**
   - Right panel: Match Variance still shows delta, but match state is now PASS

### **Step 6: Post to Ledger**
1. Click **"6. Post to Ledger"** button
2. **Expected:**
   - Status: "✅ Ledger posted (locked pair: AP CREDIT + EXPENSE DEBIT)"
   - 3D view:
     - **Two white cubes** appear on the right side (AP and Expense)
     - **Golden torus ring** around them (lock indicator)
   - Right panel: 
     - Ledger Posting shows:
       ```
       🔒 Locked Pair
       AP (CR): $510
       Expense (DR): $510
       Event: posting-...
       ```
   - Bottom bar: "Ledger: 2"

---

## ✅ **Pass Criteria:**

### **A. Multi-Filament Orchestration** ✅
- [ ] PO creation → 1 cyan cube
- [ ] PO approval → 2 cyan cubes
- [ ] Receipt → Green cube appears, match auto-generated
- [ ] Invoice → Yellow cube appears, match re-evaluated
- [ ] 4 filaments visible in spatial layout

### **B. State Gates** ✅
- [ ] Cannot skip approval (Step 2 required)
- [ ] Match auto-generates when receipt/invoice added
- [ ] Cannot post to ledger until match = PASS
- [ ] Override required to change EXCEPTION → PASS

### **C. Match is Filament, Not Query** ✅
- [ ] Match filament appears as distinct object (bottom)
- [ ] Match has discrete commits (evaluation + override)
- [ ] Match references inputs in `refs.inputs`
- [ ] Dashed lines show input dependencies

### **D. Variance Without Queries** ✅
- [ ] Variance appears in right panel: "Line A: QTY MISMATCH"
- [ ] Delta calculated: +2 (invoiced 10 vs received 8)
- [ ] Severity: BLOCK
- [ ] Match state: EXCEPTION (red cube)

### **E. Ledger Pairs Lock** ✅
- [ ] Two white cubes appear (AP + Expense)
- [ ] Golden torus ring around pair (lock indicator)
- [ ] Both share same `postingEventId`
- [ ] Right panel shows both legs with same event ID

### **F. End-to-End Causality** ✅
- [ ] 3D view shows all filaments simultaneously
- [ ] Dependency connectors from match to inputs
- [ ] Temporal flow visible (commits increase left to right)
- [ ] Override changes match color RED → GREEN

---

## 🔒 **Invariants Proven:**

1. **Match is NOT a Query**
   - Match is a governed filament with its own commits
   - Each evaluation is a discrete MATCH_EVALUATED commit
   - Override is a separate MATCH_OVERRIDE_APPROVED commit
   - No "auto mutation" - each change is a visible event

2. **Accounting Pairs are Locked**
   - Both ledger filaments share `postingEventId`
   - Both exist at commitIndex 0 (atomic creation)
   - Sum(DEBIT) = Sum(CREDIT) enforced
   - Lock is geometric (torus ring), not transactional

3. **Lifecycle is Irreversible**
   - Cannot create receipt without PO
   - Cannot post ledger without match PASS
   - Amendments would use SCAR (not shown in minimal proof)
   - Each step appends, never mutates

4. **Evidence is Mandatory**
   - Every commit has `actor` (user or system)
   - Every commit has `ts` (timestamp)
   - Match commits have `refs.inputs` (snapshots)
   - Ledger commits reference match commit in evidence

---

## 🎨 **3D Layout (Spatial Separation + Convergence):**

```
                 [PO Contract] ━━━━━━━━ (Cyan, Top Y=+3)
                      ↓
         ┌────────────┴────────────┐
         ↓                         ↓
   [Goods Receipt]           [Invoice]
    (Green, Y=0, Z=-2)       (Yellow, Y=0, Z=+2)
         ↓                         ↓
         └────────────┬────────────┘
                      ↓
                  [Match]  ━━━━━━━━━━ (Red=EXCEPTION, Green=PASS, Y=-3)
                      ↓
               (if PASS)
                      ↓
             [Ledger Pair] ━━━━━━━━ (White, locked ring, X=+8)
```

**Key Spatial Rules:**
- **Convergence:** Multiple inputs (PO/Receipt/Invoice) feed ONE match
- **Dependency rays:** Dashed lines from match to input commits (ephemeral lens)
- **Color discipline:**
  - PO: Cyan (contract)
  - Receipt: Green (goods)
  - Invoice: Yellow (claim)
  - Match: Red (exception) or Green (pass)
  - Ledger: White (neutral, with golden lock)

---

## 🧠 **What Users Learn:**

### **"Oh... I can see why this didn't match."**

The 3D view makes causality obvious:
1. You see the PO (ordered 10)
2. You see the receipt (received 8)
3. You see the invoice (invoiced 10)
4. You see the match turn RED (exception)
5. You see the human override (new commit)
6. You see the locked ledger pair (payment authorized)

**This is institutional memory with physics.**

---

## 🚀 **Next Steps After This Proof:**

### **If PO Flow Works:**
You've proven:
- ✅ Multi-filament systems work
- ✅ Governance gates work
- ✅ Match-as-filament replaces ERP queries
- ✅ Ledger locking works

**Next proofs become obvious:**
1. **Co-Edit Lock** - Multi-user on same filament
2. **AI Propose → GATE** - AI generates commits on proposal branch
3. **Store Catalog** - Distribution as filament lens

### **If PO Flow Has Issues:**
Debug in this order:
1. Check console for commit structure
2. Verify match auto-generation triggers
3. Check dependency connector rendering
4. Verify ledger pair has same `postingEventId`

---

## 📁 **Files Created:**

1. ✅ `src/frontend/components/procurement/schemas/commitSchemas.js`
   - Universal commit envelope
   - PO/Receipt/Invoice/Match/Ledger commit builders
   - Helper functions for commit access

2. ✅ `src/frontend/components/procurement/utils/matchEngine.js`
   - Auto-match evaluation logic
   - Variance calculation (deterministic)
   - Match summary helpers
   - `canPostToLedger()` gate logic

3. ✅ `src/frontend/pages/POFlowProof.jsx`
   - Main proof component
   - 6-step wizard UI
   - 3D spatial layout (convergence model)
   - Variance report panel

4. ✅ `src/App.jsx`
   - Added `/proof/po-flow` route

5. ✅ `documentation/VISUALIZATION/PROCUREMENT-LIFECYCLE-SPEC.md`
   - Complete specification of 6 filament types
   - State gates and glyphs
   - Flow examples

---

## 🔍 **Debugging Console Logs:**

When you run through the proof, watch for these console logs:

### **Step 3 (Receipt):**
```
[MatchEngine] Auto-generated match commit: { op: 'MATCH_EVALUATED', payload: { state: 'PASS', variances: [] } }
```

### **Step 4 (Invoice):**
```
[MatchEngine] Auto-generated match commit: { op: 'MATCH_EVALUATED', payload: { state: 'EXCEPTION', variances: [{ kind: 'QTY_MISMATCH', delta: +2, severity: 'BLOCK' }] } }
```

### **Step 5 (Override):**
```
Match override approved: { outcome: 'OVERRIDE_PASS', approvedByRole: 'APManager' }
```

### **Step 6 (Ledger):**
```
Ledger pair created: { postingEventId: 'posting-...', AP: 'CREDIT', Expense: 'DEBIT' }
```

---

## 🎉 **Success Criteria:**

**This proof PASSES if:**
1. ✅ You can click through all 6 steps sequentially
2. ✅ 3D view shows spatial separation (PO top, Receipt/Invoice middle, Match bottom)
3. ✅ Match cube turns **RED** at step 4 (variance detected)
4. ✅ Variance report shows **"Line A: QTY MISMATCH, Delta: +2 (BLOCK)"**
5. ✅ Match cube turns **GREEN** at step 5 (override approved)
6. ✅ Ledger pair appears with **golden lock ring**
7. ✅ Dependency connectors (dashed lines) visible from match to inputs

**This proof FAILS if:**
- ❌ Match doesn't auto-generate when receipt/invoice added
- ❌ Variance not detected or calculated incorrectly
- ❌ Can post to ledger before override (GATE broken)
- ❌ Ledger pair doesn't show lock indicator
- ❌ 3D layout is confusing or overlapping

---

## 📸 **Expected Screenshots:**

### **After Step 4 (Exception State):**
- Left panel: Step 4 highlighted (green ✅)
- Center: 4 filaments visible (cyan, green, yellow, **RED** match)
- Right panel: **Red variance warning** for Line A
- Bottom bar: "Match: 2 (EXCEPTION)"

### **After Step 6 (Complete):**
- Left panel: All 6 steps green ✅
- Center: 4 main filaments + 2 ledger cubes with **golden lock ring**
- Right panel: "🔒 Locked Pair, AP (CR): $510, Expense (DR): $510"
- Bottom bar: "Match: 3 (PASS), Ledger: 2"

---

## 🔧 **Troubleshooting:**

### **Issue: Match doesn't auto-generate**
**Check:**
- Console for `[MatchEngine] Auto-generated match commit`
- `autoEvaluateMatch()` being called in setState callback
- Match filament has commits array

**Fix:**
- Verify `matchEngine.js` logic
- Check that PO/receipt/invoice filaments are passed correctly

### **Issue: Variance not showing**
**Check:**
- Receipt has `qtyReceived: 8` for line A
- Invoice has `qtyInvoiced: 10` for line A
- Match payload has `variances` array

**Fix:**
- Verify variance calculation in `createMatchEvaluatedCommit`
- Check delta = invoiced - received

### **Issue: Can post to ledger before override**
**Check:**
- Button should be `disabled` when `!matchSummary.canPost`
- `canPost` should be false when state = EXCEPTION

**Fix:**
- Verify `getMatchSummary()` checks for override commit
- Ensure override commit has later `commitIndex` than eval

### **Issue: Ledger pair doesn't show lock**
**Check:**
- Both ledger commits have same `postingEventId`
- Golden torus ring is rendering

**Fix:**
- Verify `postingEventId` is same in both commits
- Check torus geometry in POFlowProof.jsx

---

## 🎯 **What This Unlocks:**

### **Once This Proof Works:**

1. **ERP slice replacement:**
   - You can now build a real procurement tool
   - Forms are just endpoint lenses over filaments
   - Audit is replay, not query

2. **Multi-domain patterns:**
   - Same primitives work for:
     - Manufacturing (work orders, inspections, batches)
     - Projects (tasks, deliverables, milestones)
     - HR (hiring, onboarding, reviews)
   - All are just "governed lifecycle filaments"

3. **Governance as geometry:**
   - GATE glyphs become visible barriers
   - Variance is not "dirty data", it's first-class state
   - Disputes are branches, not comments

4. **AI integration is trivial:**
   - AI can propose commits on proposal branches
   - Human GATE required to merge
   - Same primitives as human edits

---

## 📝 **Locked Invariants:**

From this proof forward, these CANNOT change:

1. **Match = Filament** (never a query)
2. **Ledger = Locked Pairs** (same postingEventId + commitIndex)
3. **Variance = First-Class State** (not error, not exception)
4. **State Gates = GATE Glyphs** (approval before next step)
5. **Auto-Generation = System Actor** (deterministic, no human input)

---

## 🔥 **The One-Sentence Lock:**

> **"Procurement is not a document; it's a governed chain of irreversible state commits across PO, receipt, invoice, match, and locked ledger pairs—rendered as familiar interfaces at the edge and auditable causality at depth."**

---

**Test now:**
1. Navigate to `/proof/po-flow`
2. Click through all 6 steps
3. Watch the 3D view
4. Verify variance appears and gets overridden
5. Confirm ledger pair has lock ring

**Report back:**
- Screenshot after Step 4 (RED match with variance)
- Screenshot after Step 6 (complete with ledger pair)
- Any errors in console

---

**This is the proof that shows Relay can replace real ERP systems.** 🚀
