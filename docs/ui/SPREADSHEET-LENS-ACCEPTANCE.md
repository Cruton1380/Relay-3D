# Spreadsheet Lens Acceptance (Patch #4A)

This checklist defines the acceptance checks and log gates for range selection and copy/paste behavior.

## A) Range selection correctness

Manual checks
- Drag from A1 to B3 -> overlay shows A1:B3 and size 3x2.
- Reverse drag (B3 to A1) -> still resolves to A1:B3.
- Single click selects 1 cell -> overlay shows A1.
- Drag outside grid bounds clamps to last visible cell (no crash).

Log gate
- [UI] rangeSelect sheet=S0 range=A1:B3 rows=3 cols=2 cells=6

## B) Copy correctness (TSV export)

Manual checks
- Select A1:B3, Ctrl+C -> clipboard contains 3 lines, 2 columns, tab-separated.
- Empty cells export as empty fields (preserve shape).
- Copy of single cell exports a single value, no extra trailing newline (optional but nice).

Log gate
- [UI] copy sheet=S0 range=A1:B3 tsvBytes=... rows=3 cols=2

## C) Paste correctness (TSV import + alignment)

Manual checks
- Paste a 3x2 block into A1:B3 -> fills exactly.
- Paste a 3x2 block into B2:C4 -> offset applies correctly.
- Paste bigger than selection:
  - If selection is 1 cell: paste expands as needed within grid limits (or clamps; choose one rule).
- Paste includes blank lines / trailing newline -> does not shift data unexpectedly.

Log gate
- [UI] paste sheet=S0 anchor=A1 srcRows=3 srcCols=2 destRange=A1:B3
- [UI] pasteNormalize trimmed=4 cleared=2 formulas=1 literals=7

## D) Batch commit invariants

Manual checks
- A paste that changes multiple cells produces one batch commit event.
- If nothing changes (pasting identical values), it produces no commit (or a no-op log only).
- Mixed content routes correctly:
  - =... -> CELL_FORMULA_SET
  - empty/whitespace-only -> CELL_CLEAR
  - other -> CELL_SET

Log gates
- [UI] commitRange sheet=S0 range=A1:B3 changed=5 unchanged=1 ops={SET:3, FORMULA:1, CLEAR:1} commitId=...
- [UI] commitRangeNoop sheet=S0 range=A1:B3 changed=0 unchanged=6 ops={SET:0, FORMULA:0, CLEAR:0}
- Optional debug-only detail when enabled:
  - [UI:ops] A1 SET "123"; A2 CLEAR; B3 FORMULA "=SUM(A1:A2)"

## E) Reflect correctness (3D + overlay)

Manual checks
- After paste, overlay updates immediately (range still selected).
- 3D labels for affected cells update.
- No camera movement while pasting/editing.

Log gate
- [UI] reflectRange sheet=S0 range=A1:B3 labelsUpdated=5 filamentsUpdated=5

## Stability guards

Clipboard read failures
- [UI] pasteBlocked reason=ClipboardPermission

Max paste size budget
- Refuse paste over 5,000 cells:
- [UI] pasteRefused cells=12000 cap=5000
