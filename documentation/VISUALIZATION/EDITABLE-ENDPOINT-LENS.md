# 📊 Editable Endpoint Lens — Spreadsheet as Filament Projection

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Core Principle

> **Spreadsheet cells are projections of filament +X faces. Editing a cell appends a commit. Formulas are first-class commits.**

In Relay, a spreadsheet is **not** the source of truth. It's a **lens**—an editable projection of the latest state of underlying filaments. When you edit a cell, you're not mutating a database—you're **creating a new commit**.

---

## Key Insights

### **1. Cell = +X Face of Latest TimeBox**

**Traditional Spreadsheet:**
```
Cell A1 = 1000 (stored in spreadsheet file)
```
**Problem:** The value is the truth. No history, no causality, no audit trail.

**Relay Spreadsheet:**
```
Cell A1 = 1000
  ↓ (Projects)
Filament "Budget Item A":
  TimeBox 42: { +X output: 1000 }
```
**Benefit:** Cell shows current value, but **filament is truth**. Full history preserved.

---

### **2. Editing = Append Commit (Optimistic)**

**User Action:**
```
Click cell A1 → Type "1500" → Press Enter
```

**What Happens:**
```typescript
// 1. Create new commit on filament
const commit = {
  envelope: {
    commit_class: 'CELL_EDIT',
    actor: 'user:alice',
    // ...
  },
  timeBox: {
    faces: {
      output: 1500,    // +X new value
      input: 1000,     // -X old value
      identity: 'user:alice',
      // ...
    }
  }
};

// 2. Optimistically update cell (instant)
cell.value = 1500;

// 3. Commit to Git (background)
await relayClient.putCommit(commit);

// 4. If commit fails → revert cell
// If commit succeeds → cell stays updated
```

**Benefit:** Feels instant (like Excel), but every edit is a commit (auditable).

---

### **3. Formulas Are First-Class Commits**

**Traditional Spreadsheet:**
```
Cell B1 = SUM(A1:A10)  (formula stored in cell)
```
**Problem:** Formula is metadata, not truth. Hard to audit "when did this formula change?"

**Relay Spreadsheet:**
```
Cell B1 = 5000
  ↓ (Projects)
Filament "Budget Total":
  TimeBox 50: {
    glyph: KINK (transform),
    +X output: 5000,
    -X input: [filament:budget-item-a, filament:budget-item-b, ...],
    +Y semantic: "SUM(budget items)",
    -Z evidence: "formula:sum-operator"
  }
```

**What This Shows:**
- **Current value**: 5000
- **How it was calculated**: SUM of input filaments
- **Who/what calculated it**: formula operator
- **When formula changed**: History of TimeBoxes shows formula evolution

**Benefit:** Formulas are **auditable commits**. You can see "when did SUM become AVERAGE?" in history.

---

### **4. Zoom-Out Reveals Audit Trail**

**In Spreadsheet View:**
```
Cell shows: 5000 (just the value)
```

**Zoom Out to Workflow View:**
```
Filament "Budget Total" (horizontal):

TimeBox 48   TimeBox 49   TimeBox 50
  4800         4900         5000
   □────────────□────────────□
 KINK(SUM)   KINK(SUM)   KINK(SUM)
```

**What This Shows:**
- How 5000 was computed (series of KINK transforms)
- When values changed (TimeBox 48 → 49 → 50)
- Who changed them (inspect +Z identity face)

**Benefit:** **Truth without hiding it.** Spreadsheet is convenient, workflow is proof.

---

## How It Works

### Spreadsheet as Projection

**Conceptual Model:**
```
┌─────────────────────────────────────┐
│      Spreadsheet View (Lens)        │
│                                     │
│     A         B         C           │
│  ┌─────┬─────┬─────┐              │
│1 │1000 │2000 │3000 │ ← Projects   │
│  └─────┴─────┴─────┘   +X faces   │
│2 │1500 │2500 │3500 │              │
│  └─────┴─────┴─────┘              │
└─────────────────────────────────────┘
           ↓ (Backed by)
┌─────────────────────────────────────┐
│   Filaments (Truth Substrate)       │
│                                     │
│ Filament A: [...TimeBox 42: {1000}]│
│ Filament B: [...TimeBox 38: {2000}]│
│ Filament C: [...TimeBox 41: {3000}]│
└─────────────────────────────────────┘
```

**Key:**
- **Spreadsheet** = projection lens (2D view of filament tips)
- **Filaments** = truth substrate (full history)
- **Editing cell** = append commit to underlying filament

---

### Domain Schema (Columns)

**Example: Budget Spreadsheet**

```typescript
const budgetDomain = {
  domainId: 'budget.items',
  columns: [
    {
      id: 'item_name',
      type: 'string',
      editable: true,
      semantic: 'Budget line item name'
    },
    {
      id: 'amount',
      type: 'number',
      editable: true,
      semantic: 'Dollar amount'
    },
    {
      id: 'category',
      type: 'enum',
      editable: true,
      options: ['Operations', 'Payroll', 'Marketing']
    },
    {
      id: 'total',
      type: 'number',
      editable: false,  // Derived!
      formula: 'SUM(amount)',
      semantic: 'Total budget'
    }
  ]
};
```

**Editable vs Derived:**
- **Editable**: User can click and edit (creates CELL_EDIT commit)
- **Derived**: Calculated from other columns (creates OPERATOR_RUN commit)

---

### Editing Flow

**1. User Clicks Cell**
```typescript
onCellClick(rowId, colId) {
  // Enter edit mode
  cell.editMode = true;
  cell.value = getLatestValue(rowId, colId);
}
```

**2. User Types Value**
```typescript
onCellChange(newValue) {
  // Update cell optimistically
  cell.value = newValue;
}
```

**3. User Presses Enter**
```typescript
async onCellSubmit(rowId, colId, oldValue, newValue) {
  // Create commit
  const envelope = envelopeBuilder.buildCellEdit({
    rowKey: rowId,
    colId: colId,
    before: oldValue,
    after: newValue,
    actorId: currentUser.id
  });
  
  try {
    await relayClient.putCommit({
      filamentId: rowId,
      envelope,
      files: { [`state/${rowId}.yaml`]: newValue }
    });
    
    // Success! Cell stays updated
    cell.editMode = false;
    
  } catch (error) {
    // Commit failed, revert
    cell.value = oldValue;
    showError('Edit failed. Please try again.');
  }
}
```

---

### Formula Handling

**User Enters Formula:**
```
Cell B1: =SUM(A1:A10)
```

**What Happens:**
```typescript
// 1. Parse formula
const formula = parseFormula('=SUM(A1:A10)');
// → { operator: 'SUM', inputs: ['A1', 'A2', ..., 'A10'] }

// 2. Resolve inputs to filaments
const inputFilaments = formula.inputs.map(cell => getCellFilament(cell));
// → [filament:budget-item-1, filament:budget-item-2, ...]

// 3. Create FORMULA_EDIT commit
const envelope = envelopeBuilder.buildFormulaEdit({
  rowKey: 'budget-total',
  colId: 'amount',
  formulaText: '=SUM(A1:A10)',
  operator: 'SUM',
  inputs: inputFilaments,
  actorId: currentUser.id
});

// 4. Commit formula definition
await relayClient.putCommit({ filamentId: 'budget-total', envelope });

// 5. Run operator to calculate value
const result = await runOperator('SUM', inputFilaments);
// → result = 5000

// 6. Create OPERATOR_RUN commit with result
const resultEnvelope = envelopeBuilder.buildOperatorRun({
  rowKey: 'budget-total',
  colId: 'amount',
  operator: 'SUM',
  inputs: inputFilaments,
  output: result,
  actorId: 'operator:sum'
});

await relayClient.putCommit({ filamentId: 'budget-total', envelope: resultEnvelope });

// 7. Update cell with result
cell.value = result;
```

**Result:**
- Cell shows: `5000` (calculated value)
- Filament has 2 commits:
  - **FORMULA_EDIT**: "Formula changed to SUM(A1:A10)"
  - **OPERATOR_RUN**: "SUM calculated = 5000"

---

## Face Semantics for Formulas

**FORMULA_EDIT TimeBox:**
```typescript
{
  glyph: 'KINK',  // Transform
  faces: {
    output: null,  // No value yet (definition only)
    input: {
      dependencies: [
        { filamentId: 'budget-item-1', commitIndex: 'latest' },
        { filamentId: 'budget-item-2', commitIndex: 'latest' },
        // ...
      ]
    },
    semantic: 'SUM(budget items)',  // +Y: Human-readable formula
    magnitude: 0,                    // -Y: Not applicable
    identity: 'user:alice',          // +Z: Who defined formula
    evidence: {                      // -Z: Formula source
      type: 'formula',
      text: '=SUM(A1:A10)',
      operator: 'SUM'
    }
  }
}
```

**OPERATOR_RUN TimeBox:**
```typescript
{
  glyph: 'KINK',  // Transform (calculation)
  faces: {
    output: 5000,   // +X: Calculated result
    input: {        // -X: Inputs used
      dependencies: [/* same as above */]
    },
    semantic: 'SUM result',
    magnitude: 5000,
    identity: 'operator:sum',  // +Z: Calculation engine
    evidence: {                // -Z: Calculation proof
      type: 'calculation',
      operator: 'SUM',
      algorithmHash: 'sha256:abc123...'
    }
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Budget Tracking

**Context:** Finance team manages budget in spreadsheet.

**Process:**
1. Open "Budget 2026" spreadsheet (lens)
2. Cells show latest values (project +X faces)
3. Edit cell A1 from $1000 to $1500
4. System creates commit on "Budget Item A" filament
5. Cell updates instantly (optimistic)
6. Commit lands in Git (background)
7. Auditors can inspect commit history (workflow view)

**Benefit:** Familiar spreadsheet UX, full audit trail underneath.

---

### Scenario 2: Formula Evolution

**Context:** Team debates whether total should be SUM or WEIGHTED_AVERAGE.

**Process:**
1. Current formula: `=SUM(A1:A10)` (committed)
2. Alice proposes: `=WEIGHTED_AVERAGE(A1:A10, weights)`
3. Alice creates **branch** (alice-proposal)
4. Alice changes formula on her branch (FORMULA_EDIT commit)
5. Community reviews proposal (compares main vs branch)
6. If approved: **merge** (SCAR glyph)
7. Formula history preserved:
   ```
   Main:
   ├─ Commit 10: SUM formula
   ├─ Commit 20: (SPLIT) → alice-proposal
   ├─ Commit 30: (SCAR) ← Merged WEIGHTED_AVERAGE
   └─ Commit 31: Now using WEIGHTED_AVERAGE
   ```

**Benefit:** Formula changes are **governed** (not silently changed by one person).

---

### Scenario 3: Error Tracing

**Context:** Auditor finds incorrect value in cell B5.

**Process:**
1. Click cell B5 → see value: $-1500 (negative, suspicious)
2. Click "Zoom to Workflow" → see filament history
3. Workflow view shows:
   ```
   TimeBox 40: $1200 (correct)
   TimeBox 41: $1300 (correct)
   TimeBox 42: $-1500 (ERROR: DENT glyph)
   ```
4. Inspect TimeBox 42:
   - +X output: -1500
   - -X input: 1300
   - +Z actor: operator:currency-convert
   - -Z evidence: rate:-0.92 (ERROR: negative rate!)
5. Auditor traces back: "Currency conversion used wrong rate."

**Benefit:** Error is **traceable** without special logging—just inspect commits.

---

## Integration with Filament System

### Spreadsheet → Workflow Pivot

**User Action:**
```
Click cell A1 in spreadsheet → "View Filament"
```

**Result:**
```
Camera rotates from spreadsheet (perpendicular) to workflow (horizontal)
  ↓
Now see Filament A in full workflow view:
TimeBox 1 → TimeBox 2 → ... → TimeBox 42 (current value)
```

**Benefit:** Seamless transition from "work surface" to "audit view."

---

### Ghosted Filaments

**In Spreadsheet View:**
- Cells show values (foreground)
- Faint horizontal filaments visible behind cells (background)
- On hover: filament lights up, showing it's connected

**Effect:**
- Reminds user: "This is a projection, not the truth."
- Makes filaments discoverable (click to zoom to workflow)

---

## Implementation

### Data Model

```typescript
interface SpreadsheetProjection {
  domainId: string;  // e.g., 'budget.items'
  filamentRefs: {
    rowId: string;       // Maps to filamentId
    columns: {
      colId: string;
      value: any;        // Latest +X face
      editable: boolean;
      formula?: string;
    }[];
  }[];
}

function projectFilamentToCell(filamentId: string, colId: string): any {
  // Get latest TimeBox
  const filament = getFilament(filamentId);
  const latestTimeBox = filament.timeBoxes[filament.timeBoxes.length - 1];
  
  // Project +X face
  return latestTimeBox.faces.output[colId];
}

function commitCellEdit(
  rowId: string,
  colId: string,
  oldValue: any,
  newValue: any,
  actorId: string
) {
  const envelope = envelopeBuilder.buildCellEdit({
    rowKey: rowId,
    colId,
    before: oldValue,
    after: newValue,
    actorId
  });
  
  return relayClient.putCommit({
    filamentId: rowId,
    envelope,
    files: { [`.relay/envelope.json`]: envelope, [`state/${rowId}.yaml`]: { [colId]: newValue } }
  });
}
```

---

### UI Component

```typescript
function SpreadsheetView({ domainId }: { domainId: string }) {
  const projection = useSpreadsheetProjection(domainId);
  
  return (
    <table>
      {projection.filamentRefs.map(row => (
        <tr key={row.rowId}>
          {row.columns.map(col => (
            <EditableCell
              key={col.colId}
              value={col.value}
              editable={col.editable}
              onEdit={(newValue) => commitCellEdit(row.rowId, col.colId, col.value, newValue, currentUser.id)}
            />
          ))}
        </tr>
      ))}
    </table>
  );
}
```

---

## Frequently Asked Questions

### General

**Q: Is the spreadsheet stored separately?**  
A: **No.** The spreadsheet is a **projection** (derived view) of filaments. There's no "spreadsheet file."

**Q: What if I edit offline?**  
A: Edits queue locally. When online, commits sync to Git. If conflicts (someone else edited same cell), Git merge resolves.

**Q: Can I use Excel formulas?**  
A: **Yes** (common subset). Relay translates to operators (SUM, AVERAGE, IF, etc.). Complex formulas may require custom operators.

---

### Technical

**Q: What if a formula references a deleted row?**  
A: **Commit rejected** (pre-commit hook validates dependencies). You must update formula first.

**Q: How do you handle circular references?**  
A: **Pre-commit hook detects cycles** and rejects commit. (Same as Excel's circular reference error.)

**Q: Can I import existing Excel files?**  
A: **Yes.** Import creates filaments from rows and commits from cell values. Formulas become FORMULA_EDIT commits.

---

### Governance

**Q: Who can edit which cells?**  
A: **Policy-driven** (committed governance). Example:
```typescript
{
  filamentId: 'budget-item-payroll',
  editPolicy: {
    allowedActors: ['user:cfo', 'role:finance-team'],
    requiresApproval: false
  }
}
```

**Q: Can I lock cells?**  
A: **Yes.** Set `editable: false` in column schema. Only operators (formulas) can update.

**Q: What if someone changes a formula maliciously?**  
A: **FORMULA_EDIT commits are auditable.** Anyone can inspect history and challenge the change. If governance requires, formula changes can require approval (branch → vote → merge).

---

## Conclusion

**Editable Endpoint Lens** ensures:
- ✅ **Familiar UX**: Feels like Excel/Google Sheets
- ✅ **Auditable edits**: Every change is a commit (inspectable)
- ✅ **Formula governance**: Formula changes are versioned and votable
- ✅ **Error tracing**: Zoom to workflow to see causality
- ✅ **No data loss**: Full history preserved (undo = inspect previous commit)

By treating spreadsheets as **projections** (not truth), Relay makes collaborative data work **transparent and trustworthy**.

---

**See Also:**
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [KPIs as Filaments](KPIS-AS-FILAMENTS.md) (KPI dashboard = spreadsheet projection)
- [Topology as Lens](TOPOLOGY-AS-LENS.md) (Formulas create dependencies)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
