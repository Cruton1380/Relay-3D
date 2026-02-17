# VIS-2: COMPANY View Compression

**Status:** CLOSED ✅ (after live visual verification)  
**Acceptance (no runtime):** `[VIS2] specWritten result=PASS`

---

## Visual verification checklist (human)

Close VIS-2 only after a real live visual check (~5 min):

1. Open world view and confirm:
   - COMPANY LOD shows **trunk + dept spines + 20 tiles**
   - **No “block of blocks”** (no full sheet planes)
2. Run in console: `relayEnterSheet('P2P.RequisitionLines')` → **only that sheet expands**
3. Run: `relayExitSheet()` → **collapses back to tiles**

**Required artifact log lines** (capture in proof log):
- `[VIS2] companyCollapsed result=PASS sheetsRendered=0`
- `[VIS2] sheetTilesRendered count=20`
- `[VIS2] enterSheet expanded=1 tiles=19`
- `[VIS2] exitSheet collapsed=PASS expanded=0 tiles=20`
- `[VIS2] gate-summary result=PASS`

Indexed in: `archive/proofs/PROOF-INDEX.md` → ## VIS-2: Company Compression ✅ PASSED

---

## Verification steps (LOD ↔ VIS bridge)

Run in this order. Each step has clear PASS evidence and FAIL modes.

### Step 1 — Confirm world profile

**Open exactly:** `http://localhost:3000/relay-cesium-world.html?profile=world`

**PASS (any one):**
- COMPANY log shows `reason=collapsedByPolicy` (not `distance`)
- You see a world-profile boot line you recognize (e.g. worldTrunks sync)

**FAIL:** If you still see `reason=distance`, you're not in `profile=world` or the profile flag isn't being read from the URL.

---

### Step 2 — COMPANY: requested vs effective

Zoom until you trigger COMPANY.

**PASS — exact pattern:**
```
[LOD] apply level=COMPANY requestedSheetsDetailed=1 effectiveSheetsDetailed=0 … reason=collapsedByPolicy …
```
Then immediately after, render confirms:
- `[VIS2] expandedSheetsAllowed=false scope=world`
- `[VIS2] deptSpinesRendered count=3`
- `[VIS2] sheetTilesRendered count=20`
- `SheetsRendered=0`

**FAIL:** If `effectiveSheetsDetailed` is still 1 while tiles are rendered, the logging fix isn't live.

---

### Step 3 — Auto-enter sheet when SHEET/CELL requested

Zoom closer until the app tries to go SHEET (or use SHEET hotkey).

**PASS — expected sequence:**
- Resolver-driven entry when no sheet is selected (you may see):  
  `[VIS] sheetSelect resolved sheet=<id> reason=<default|firstAvailable|...>`
- Then scope becomes `sheet`.
- Next render shows:
  - `[VIS2] expandedSheetsAllowed=true scope=sheet`
  - `[VIS2] enterSheet expanded=1 tiles=19` (or equivalent)
- Budget jumps, but only for **one** sheet (not 20).

**FAIL modes:**
- You get: `[VIS] sheetOnlyRender blocked selected=none requested=SHEET fallback=COMPANY …`  
  → `relayEnterSheet()` isn't on `window`, or resolver didn't return `ok`, or no sheets in state.
- You get SHEET but `expandedSheetsAllowed=false` stays  
  → Scope didn't change to `sheet`; setLOD didn't call `relayEnterSheet()` or state didn't persist.

---

### Step 4 — Manual override test

In console run:
1. `relayExitSheet()`
2. `relayEnterSheet('P2P.RequisitionLines')`
3. Switch to SHEET (key or `setLOD('SHEET')` or zoom)

**PASS:**
- Scope becomes `sheet` with that id
- Only that sheet expands; others remain tiles

Then:
4. `relayExitSheet()`

**PASS:** Returns to tiles + dept spines (no lingering expanded sheet).

---

**What this unlocks:** Once Steps 1–4 pass, VIS-2 is closed in the real sense: COMPANY = compressed surface (spines + tiles + timeboxes); SHEET/CELL = one-sheet expansion, deterministic. Then VIS-3.1 (flow overlay) can proceed without the “everything at once” blob.

---

## 1. Problem

At COMPANY LOD the renderer currently draws **all** sheet planes, full cell grids, and per-cell lanes (e.g. 20 sheets, 911 lane polylines). That is correct geometry but **no hierarchy compression**: it looks like a “block of blocks” and does not express department/spine hierarchy or flow.

---

## 2. Contract: What COMPANY View Must Mean

### 2.1 COMPANY shows

- Trunk.
- Department spines (branch conduits).
- **Compact sheet tiles** only (one small tile per sheet: e.g. rectangle or billboard at sheet-cluster position, with sheetId or short name).
- No full sheet planes, no cell grids, no per-cell lanes.

### 2.2 COMPANY does NOT show

- Sheet planes (full quad geometry).
- Cell grids.
- Per-cell lane polylines.

### 2.3 SHEET view shows

- Full sheet plane + cells **only after explicit enter** (user enters a specific sheet).
- Exactly one sheet expanded when scope is `sheet` and a sheet is selected; all others remain compact tiles.

### 2.4 Scope rule

- **Expanded sheets** (plane + cells + lanes) are allowed only when entry scope is `sheet` or `cell` (explicit sheet/cell enter).
- At COMPANY (scope `world` or `company`), only trunk + spines + compact tiles are shown.

---

## 3. Acceptance (documented)

- `[VIS2] specWritten result=PASS` — this document exists and defines the above.

---

## 4. Implementation steps (reference)

Execution is in micro-batches:

1. **Step 1:** Add `shouldRenderExpandedSheets(state)`; log `[VIS2] expandedSheetsAllowed=true|false scope=<...>`.
2. **Step 2:** When `expandedSheetsAllowed === false`, skip sheet plane + cell grid; log `[VIS2] companyCollapsed result=PASS sheetsRendered=0`; budget totalPrims &lt; ~80 at COMPANY.
3. **Step 3:** Replace sheets with compact sheet tiles (20 tiles); log `[VIS2] sheetTilesRendered count=20`; budget totalPrims &lt; ~150.
4. **Step 4:** Department spine emphasis; log `[VIS2] deptSpinesRendered count=<expected>`.
5. **Step 5:** Enter sheet expands exactly one sheet; log `[VIS2] enterSheet expanded=1 tiles=19`.
6. **Step 6:** Exit sheet collapses back; log `[VIS2] exitSheet collapsed=PASS expanded=0 tiles=20`.

No changes to: ENU math, topology rules, vote/governance, ledger/replay, gate semantics.

---

## 5. LOCK

**VIS-2 is CLOSED as of 2026-02-13.**  
Authoritative evidence: `archive/proofs/vis2-company-compression-console-2026-02-13.log` contains `[VIS2] gate-summary result=PASS`.  
Further changes to VIS-2 behavior require a `VIS-2b` patch with its own proof artifact and PROOF-INDEX entry. Do not reopen this spec.
