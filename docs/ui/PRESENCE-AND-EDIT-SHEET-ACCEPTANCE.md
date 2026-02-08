# Presence + Edit Sheet Acceptance

## Acceptance: Presence Markers

### Gate PM-1: Presence markers render + correct counts

Steps
- Import a workbook with known populated cell count (e.g., 110)
- Set HUD: Show presence markers = ON
- Set Presence mode = nonEmpty

Expected logs
- [HUD] showPresenceMarkers enabled=true
- [HUD] presenceMarkerMode=nonEmpty
- [TB] presenceMarkers rendered=110 selected=0 recent=0 formula=0

Refusal
- rendered=0 when nonEmpty cells exist -> REFUSAL.PRESENCE_MARKERS_MISSING

### Gate PM-2: Selected mode works (single selection)

Steps
- Presence mode = selected+recent
- Click a single cell (A1)

Expected logs
- [UI] select sheet=… cell=A1 cellId=…
- [TB] presenceMarkers rendered>=1 selected=1 recent>=0 formula>=0

Refusal
- selected=0 after selecting a cell -> REFUSAL.PRESENCE_SELECTED_NOT_TRACKED

### Gate PM-3: Recent mode works (range edit / paste)

Steps
- Presence mode = selected+recent
- Paste a 3x2 range and commit

Expected logs
- [UI] commitRange sheet=… range=… changed=… commitId=…
- [TB] presenceMarkers … recent>=6

Refusal
- recent=0 after a range commit -> REFUSAL.PRESENCE_RECENT_NOT_TRACKED

### Gate PM-4: formulasOnly mode

Steps
- Enter a formula in a cell (e.g., =A1+1) and commit
- Presence mode = formulasOnly

Expected logs
- [UI] commit … type=CELL_FORMULA_SET …
- [TB] presenceMarkers … formula>=1
- rendered=formula (or rendered>=formula if you include selected)

Refusal
- formula=0 after a formula commit -> REFUSAL.PRESENCE_FORMULA_NOT_DETECTED

## Acceptance: Edit Sheet Mode

### Gate ES-1: enter/exit logs + input gating

Steps
- Click Edit Sheet
- Try moving camera with WASD (should not move)
- Press Esc to exit

Expected logs
- [MODE] enter EDIT_SHEET
- (optional) [INPUT] freeFly disabled reason=EDIT_SHEET
- [MODE] exit EDIT_SHEET

Refusal
- Camera moves while in edit mode -> REFUSAL.EDIT_SHEET_INPUT_NOT_LOCKED
- Missing enter/exit logs -> REFUSAL.EDIT_SHEET_LOGS_MISSING

### Gate ES-2: LOD lock to SHEET

Steps
- Enter edit sheet mode

Expected
- LOD shown/locked to SHEET
- Presence markers + grid readability visible

Refusal
- LOD remains COMPANY/REGION while in edit mode -> REFUSAL.EDIT_SHEET_LOD_NOT_LOCKED

### Gate ES-3: 2D editing still works in edit mode

Steps
- Enter edit mode
- Select a cell
- Edit value and press Enter

Expected logs
- [UI] editStart …
- [UI] commit …
- [UI] reflect …

Refusal
- commit doesn’t occur on Enter -> REFUSAL.EDIT_SHEET_COMMIT_BLOCKED

## Proof artifacts to capture

Add to archive/proofs/:
- presence-markers-pass.log (PM-1 and PM-2 logs)
- presence-markers-recent.log (PM-3)
- presence-markers-formulas.log (PM-4)
- edit-sheet-pass.log (ES-1/2/3)

Reference them in PROOF-INDEX.md.
