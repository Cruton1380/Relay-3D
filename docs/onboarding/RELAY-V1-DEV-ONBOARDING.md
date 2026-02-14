# Relay V1 — Dev Onboarding Flyby

**Version**: V1 (2026-02-14)  
**Profile**: `?profile=launch`  
**Control**: FreeFly FPS (mouse look + WASD + scroll zoom) — always active  
**Rule**: No auto-anchoring. No auto-docking. Every action is explicit.

---

## How to Start

```bash
npm run dev:cesium
# Then open:
http://localhost:3000/relay-cesium-world.html?profile=launch
```

Or run the automated flyby:

```bash
node scripts/v1-dev-onboarding-flyby.mjs
```

---

## Section 1 — Globe Context (Planetary LOD)

### Purpose

Prove multi-anchor world boot + FreeFly camera control.

### What You See

- The Cesium globe renders with satellite/OSM imagery.
- Multiple regional anchors appear as labeled markers (Tel Aviv, New York, London, Tokyo, Sydney, Dubai).
- The help overlay appears on first load ("Relay — Company View" with key bindings).
- HUD Tier 1 is visible in the top-left: profile, mode, LOD, summary.

### Controls

| Key/Action | Effect |
|-----------|--------|
| Mouse move | Look around (with pointer lock via backtick) |
| W / A / S / D | Move forward / left / backward / right |
| Q / Space | Move down / up |
| Scroll wheel | Adjust movement speed |
| Shift | Move faster |
| Ctrl | Move slower |
| Backtick (`) | Toggle pointer lock for mouse-look |

### Logs That Prove It

```
[INPUT] owner=CAMERA mode=FreeFly reason=default
[GLOBE] datasetLoad anchors=6
[PROFILE] RELAY_PROFILE=world (launch mode)
[LAUNCH-FIX] cameraFrame target=trunk.avgol result=PASS
```

### Files Powering It

- `relay-cesium-world.html` — boot, camera, input binding
- `app/cesium/viewer-init.js` — Cesium viewer configuration
- `app/cesium/fixtures/world-dataset-v0.json` — anchor dataset

---

## Section 2 — Basin Focus (Building Level)

### Purpose

Demonstrate proximity awareness without auto-locking. The system knows you're near a trunk — but does nothing until you press E.

### What You See

- As you fly toward the trunk (Tel Aviv), geometry becomes visible: trunk pillar, branch corridors, sheet tile outlines.
- The camera is NOT stolen. You remain in FreeFly.
- A `[REFUSAL]` log appears confirming auto-dock was blocked.

### Flow

1. Use WASD to fly toward the trunk marker (or let the launch frame position you nearby).
2. Approach within 550m of a sheet — observe that you are NOT docked.
3. The console logs `[REFUSAL] reason=AUTO_ANCHOR_BLOCKED`.
4. The "Enter Selected Sheet" button is visible at bottom-right.

### Controls

| Key/Action | Effect |
|-----------|--------|
| WASD | Continue flying freely near the structure |
| E | Accept entry (not pressed yet in this section) |

### Logs That Prove It

```
[CAM] basin-proximity target=trunk.avgol type=trunk ... assist=BLOCKED_LAUNCH
[REFUSAL] reason=AUTO_ANCHOR_BLOCKED action=proximity-dock target=<sheetId>
[DOCK] dist=<n> align=<n> preview=false edit=false
```

### Files Powering It

- `relay-cesium-world.html` — basin influence loop (line ~1824), proximity guard (line ~13417)
- `app/renderers/filament-renderer.js` — trunk/branch/tile rendering

---

## Section 3 — Company Overview (VIS-2 Collapsed)

### Purpose

Show the tree structure clearly: one trunk, three branches (departments), sheet tiles as subdued glass panels. This is the "company at a glance" view.

### What You See

- **Trunk**: vertical steel-blue pillar (alpha 0.95) with subtle glow shell.
- **Branches**: three department corridors extending from trunk (alpha 0.92).
- **Sheet tiles**: glass panels with thin bright borders, subdued fill (alpha 0.08).
- **Filaments**: barely visible light threads (alpha 0.06) — intentionally faint at company level.
- **Labels**: sheet names as subdued text (alpha 0.30).
- **No spaghetti**: the readability pass keeps trunk/branches prominent, filaments/labels quiet.

### Flow

1. The launch camera frame positions you at ~250-6000m from the trunk (depending on scale).
2. Observe the tree: trunk → branches → tiles layout.
3. Hover over branches to see Focus Lens dim others (if available).

### Logs That Prove It

```
[VIS2] companyCollapsed result=PASS
[LAUNCH-FIX] visualHierarchy applied=PASS tilesAlpha=0.35 trunkAlpha=0.95
[LAUNCH-THEME] tokens loaded trunk=#4a7fb5 tile=glass filament=lightThread
```

### Files Powering It

- `app/renderers/filament-renderer.js` — LAUNCH_THEME tokens, renderTree(), VIS-2 compression
- `relay-cesium-world.html` — LOD governor, VIS-2 gating

---

## Section 4 — Sheet Entry (Expanded)

### Purpose

Demonstrate explicit scope change via E key. One sheet expands; the rest remain as tiles.

### What You See

- After pressing E, the selected sheet expands to show full cell grid in 3D.
- Other sheets remain as compact tiles.
- The camera orbits to face the sheet.
- LOD locks to SHEET level.

### Flow

1. Press **E** to enter the nearest/selected sheet.
2. Observe: one sheet expands, rest stay as tiles.
3. The HUD updates to show current sheet context.

### Controls

| Key/Action | Effect |
|-----------|--------|
| E | Enter selected sheet (explicit accept) |
| Esc | Exit back to company view |

### Logs That Prove It

```
[CAM] E-accept action=ENTER_SHEET target=<sheetId> ... result=PASS
[INPUT] owner=GRID mode=SheetEdit reason=explicitEnter
[MODE] enter EDIT_SHEET — docking from any angle
[VIS] enter sheet=<sheetId> scope=sheet-only
[LOD] apply level=SHEET
```

### Files Powering It

- `relay-cesium-world.html` — E-key handler, `enterEditSheetMode()`, `_launchEnterSheetInstant()`
- `app/renderers/filament-renderer.js` — sheet expansion, VIS-2 enter/exit

---

## Section 5 — Edit Mode (2D Dock)

### Purpose

Prove 3D-to-2D integration. The spreadsheet grid docks face-on. Cell values are readable. This is where data entry happens.

### What You See

- The 3D Cesium canvas fades to transparent.
- A 2D spreadsheet overlay appears (HTML grid).
- Cells are sized at `cellPx=64x20` with row/column headers.
- The formula bar appears at the top.
- Mouse and keyboard now control the grid, not the camera.

### Flow

1. After sheet entry (Section 4), the camera docks face-on automatically.
2. The spreadsheet grid renders.
3. Click cells to select. Type to edit. Enter to commit.

### Controls

| Key/Action | Effect |
|-----------|--------|
| Click cell | Select cell |
| Type | Edit cell value |
| Enter | Commit cell edit |
| Tab | Move to next cell |
| Esc | Cancel edit / exit edit mode |
| Arrow keys | Navigate cells |

### Logs That Prove It

```
[INPUT] owner=GRID mode=SheetEdit reason=explicitEnter
[SHEET-2D] cellPx=64x20 rowHeaderPx=40 colHeaderPx=64
[HUD] mode=SheetEdit
```

### Files Powering It

- `relay-cesium-world.html` — spreadsheet overlay, cell editor, grid renderer (`renderHtmlGrid`)
- `app/renderers/filament-renderer.js` — `setCompanyTopDownView()` for face-on camera

---

## Section 6 — Exit Unwind

### Purpose

Prove full scope unwind. From edit mode all the way back to FreeFly globe navigation.

### What You See

- The spreadsheet overlay disappears.
- The 3D Cesium canvas returns to full opacity.
- Camera snaps back to pre-dock position.
- All camera controls are restored (WASD + mouse).
- HUD returns to FreeFly mode.

### Flow

1. Press **Esc** to exit edit mode.
2. Camera restores to pre-dock position.
3. You are back in FreeFly mode with full 3D control.
4. Press Esc again if in Focus mode to fully exit.

### Controls

| Key/Action | Effect |
|-----------|--------|
| Esc | Exit current mode (edit → sheet → company → FreeFly) |

### Logs That Prove It

```
[MODE] exit EDIT_SHEET
[INPUT] owner=CAMERA mode=FreeFly reason=exit
[MODE-RESTORE] overlayPointer=none ssc.enableInputs=true freeFlyBound=true
[FLIGHT] WASD controls active
```

### Files Powering It

- `relay-cesium-world.html` — `exitEditSheetMode()`, Escape handler, mode restore

---

## Quick Reference Card

| Action | Key | When Available |
|--------|-----|---------------|
| Free look | Mouse (with pointer lock) | Always in FreeFly |
| Move | WASD | Always in FreeFly |
| Up / Down | Space / Q | Always in FreeFly |
| Speed | Scroll wheel | Always in FreeFly |
| Fast/Slow | Shift / Ctrl | Always in FreeFly |
| Pointer lock toggle | Backtick (`) | Always in FreeFly |
| Enter sheet | E | Near a sheet, in FreeFly |
| Exit mode | Esc | In any locked mode |
| Toggle HUD Tier 2 | H | Always |
| Toggle log console | L | Always (hidden in launch by CSS) |

---

## Automated Verification

```bash
node scripts/v1-dev-onboarding-flyby.mjs
```

This script runs through all 6 sections, captures screenshots, and emits:

```
[ONBOARD] section=globe result=PASS
[ONBOARD] section=basin result=PASS
[ONBOARD] section=company result=PASS
[ONBOARD] section=sheetEntry result=PASS
[ONBOARD] section=editMode result=PASS
[ONBOARD] section=exitUnwind result=PASS
[ONBOARD] gate-summary result=PASS sections=6/6
```

Artifacts saved to: `archive/proofs/v1-dev-onboarding-YYYY-MM-DD/`

---

## What This Does NOT Cover (Future Slices)

- Node Ring rendering (NODE-RING-RENDER-1)
- Basin clustering / infinity sphere (BASIN-RING-1)
- Presentation pipeline: bloom, fog, FXAA (R4-PRESENTATION-PIPELINE-1)
- HUD consolidation (HUD-CONSOLIDATION-1)
- Multi-company navigation
- Voting / governance UI
- Real-time presence markers

This onboarding covers what is **implemented and proven today**.
