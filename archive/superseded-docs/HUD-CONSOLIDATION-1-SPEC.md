# HUD-CONSOLIDATION-1 — Acceptance Criteria & Spec

**Goal**: In `?profile=launch`, there is exactly one HUD surface that explains state clearly without covering the tree, and it behaves deterministically across boots, focus, sheet view, and edit.

---

## A) What must be visible

### Tier 1 (always visible, max 6 lines)

- **Profile**: launch (and optional build stamp)
- **Mode**: FreeFly | CompanyFocus | Sheet | SheetEdit
- **Focus path**: e.g. trunk.avgol / branch.operations / sheet.packaging
- **LOD**: PLANETARY | REGION | COMPANY | SHEET | CELL (+ lock indicator if locked)
- **Data**: selected sheet + import status (or "demo")
- **World/Votes**: imagery mode + boundaries status + vote summary (PASSED/PENDING/REJECTED counts)

**Hard rule**: no empty lines; unknown fields show `UNKNOWN` explicitly.

### Tier 2 (collapsed by default)

- Shows only when:
  - user clicks "diagnostics" **OR** presses **H**
- Tier 2 includes:
  - VIS gate summaries (VIS2/VIS3/VIS4)
  - budgets (LOD-BUDGET)
  - proof tags / last proof run id (if available)
  - toggles (Facing Sheets projection toggle, and any launch-only view toggles)

---

## B) What must NOT be visible in launch

In launch mode, these must be **hidden**:

- artifact inspector panel
- p2p entry panel
- branch steward panel
- vote lane / vote panel (unless explicitly opened via Tier 2)
- work mode surface
- log console overlay
- any "info panel" duplicates

**Rule**: dev panels allowed only if `RELAY_DEBUG_MODE === true`, never by default.

---

## C) Behavior requirements

### C1. FPS contract preserved

- HUD must not capture pointer/mouse events except its own buttons.
- No change to WASD/mouse look.
- No scroll wheel capture unless in edit grid mode.

### C2. Focus compatibility

- When company focus is active:
  - Tier 1 **Mode** shows `CompanyFocus`
  - **Focus path** shows trunk id
  - Vote filter status displayed (e.g. "Globe filter ON/OFF")

### C3. Sheet / edit compatibility

- When sheet is entered:
  - **Mode** updates to Sheet (or SheetEdit when in edit)
  - **Focus path** updates to the sheet id
  - Projection overlay toggle (Facing Sheets) is shown in Tier 2 only
  - In edit mode, Tier 2 remains collapsed unless user opens it

### C4. No duplication

- There must be **one authoritative HUD**.
- No duplicate text surfaces showing the same info in different places.

---

## D) Required logs (proofable)

- **On boot in launch**:
  - `[HUD] consolidated tier1=6 tier2=collapsed duplicates=0`

- **On toggling Tier 2**:
  - `[HUD] tier2 toggle=ON reason=hotkey|click`
  - `[HUD] tier2 toggle=OFF reason=hotkey|click`

- **On mode transitions**:
  - `[HUD] mode=FreeFly`
  - `[HUD] mode=CompanyFocus`
  - `[HUD] mode=Sheet`
  - `[HUD] mode=SheetEdit`

---

## E) Proof requirements (must be automated)

- **Create**: `scripts/hud-consolidation-proof.mjs`

**Stages**:

1. Boot `?profile=launch` → assert only one HUD node exists and tier1 line count == 6
2. Assert hidden panels are `display:none` in launch mode
3. Press H → Tier 2 opens; press H again → closes
4. Trigger company focus (double click trunk) → Mode shows CompanyFocus; HUD log emitted
5. Press E to enter sheet, then E to edit → Mode shows SheetEdit; Tier 2 still collapsed

**Artifacts**:

- `archive/proofs/hud-consolidation-console-YYYY-MM-DD.log`
- Screenshots:
  - `01-boot.png`
  - `02-companyfocus.png`
  - `03-sheetedit.png`

**Index updates**:

- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md` (new entry)

---

## Final Acceptance Gate (proof assertions)

Clarification layer: strict assertions and logs the proof must satisfy. No scope change.

### A. Structural requirements

**A1. Single authoritative HUD root**

- Exactly one top-level HUD container in launch mode.
- **Proof assert**: `document.querySelectorAll('#hud').length === 1`
- No secondary "info panel" remnants; no duplicate overlays.
- **Required log**: `[HUD] consolidated rootCount=1 duplicates=0`

**A2. Tier 1 line count is strict**

- Tier 1 must contain exactly 6 logical rows (not 5, not 7).
- **Proof assert**: `document.querySelectorAll('#hud .tier1-row').length === 6`
- **Required log**: `[HUD] tier1 rows=6`

**A3. Tier 2 default state**

- On boot in launch: Tier 2 must exist in DOM, must be collapsed, must not affect layout height.
- **Proof assert**: `tier2Element.offsetHeight === 0 || tier2Element.classList.contains('collapsed')`
- **Required log**: `[HUD] tier2 default=collapsed`

### B. Behavioral requirements

**B1. FPS contract preservation**

- Proof must simulate: mouse move, WASD keypress.
- **Assert**: `[INPUT] owner=CAMERA mode=FreeFly`
- No changes to `screenSpaceCameraController` flags or movement behavior. If this breaks, slice **FAIL** immediately.

**B2. Focus transition compatibility**

- Sequence in proof: Boot → double-click trunk (CompanyFocus) → Press E (Sheet) → Press E again (SheetEdit).
- At each transition: Tier 1 Mode updates correctly; no duplicate HUD; Tier 2 remains collapsed unless explicitly toggled.
- **Required logs**: `[HUD] mode=FreeFly` | `[HUD] mode=CompanyFocus` | `[HUD] mode=Sheet` | `[HUD] mode=SheetEdit`

**B3. Toggle discipline**

- Press H twice: Tier 2 expands, then collapses. No layout shift that covers canopy trunk.
- **Log**: `[HUD] tier2 toggle=ON` | `[HUD] tier2 toggle=OFF`

### C. Visual constraint (critical)

- **Proof**: compute bounding rectangles; HUD bounding box must not overlap trunk center X coordinate by more than 20% screen width.
- In Playwright: capture canopy screenshot; assert trunk screen position is not under HUD rectangle.
- **Minimal geometry check log**: `[HUD] canopyObstruction=PASS overlapRatio=<0.2`

### D. Proof artifacts required

- `archive/proofs/hud-consolidation-console-YYYY-MM-DD.log`
- `archive/proofs/hud-consolidation-YYYY-MM-DD/01-boot.png`
- `archive/proofs/hud-consolidation-YYYY-MM-DD/02-companyfocus.png`
- `archive/proofs/hud-consolidation-YYYY-MM-DD/03-sheetedit.png`
- **Gate summary**: `[HUD-PROOF] gate-summary result=PASS stages=...`

### Do not modify (reiterated)

- ❌ No change to `enterEditSheetMode`
- ❌ No change to `focusCompanyOverview`
- ❌ No change to projection overlay
- ❌ No change to FreeFly contract
- ❌ No change to canopy layout  
**HUD only.**

---

## F) Visual placement constraints

- HUD must **not cover the canopy silhouette** in the default company camera frame.
- **Recommended anchor**: top-left or top-right with max width ~320px and background translucency.
- Help overlay may exist but must not overlap HUD; dismissible.

---

## Allowed files list (implementation scope)

Files that **may** be modified to implement HUD-CONSOLIDATION-1:

- `app/ui/hud-manager.js` — authoritative HUD logic, Tier 1/2, mode/focus path/LOD/data/votes, logs
- `relay-cesium-world.html` — wiring of HUD container, launch profile, H hotkey, visibility of HUD vs other panels
- Any existing HUD/overlay CSS or DOM entry points referenced by `hud-manager.js` or the HTML entry

No changes to: filament renderer, ENU, physics, or canopy layout for this slice.

---

## Forbidden list (launch mode)

**Must NOT be visible in launch** (unless `RELAY_DEBUG_MODE === true`):

| Panel / surface        | Requirement in launch     |
|------------------------|---------------------------|
| artifact inspector     | hidden                    |
| p2p entry panel        | hidden                    |
| branch steward panel    | hidden                    |
| vote lane / vote panel  | hidden (unless via Tier 2)|
| work mode surface      | hidden                    |
| log console overlay    | hidden                    |
| info panel duplicates  | none                      |

**Must NOT happen**:

- Second HUD or duplicate state surfaces showing same Tier 1 info
- HUD capturing pointer/WASD/scroll except on its own buttons (or scroll in edit grid only)
- HUD covering canopy silhouette in default company frame

---

*Spec for HUD-CONSOLIDATION-1 slice. Proof script and index updates required before gate PASS.*
