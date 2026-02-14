# LAUNCH-READABILITY-CONTRACT

**Status:** CLOSED  
**Date:** 2026-02-14  
**Scope:** `?profile=launch` only — presentation + affordances, no topology/staging/gate changes  

---

## 1. Items

| ID | Item | Description |
|----|------|-------------|
| A  | UI Gating | Hide dev panels (`artifacts`, `ux3`, `p2p`, `topicLane`, `vote`, `workMode`, `logConsole`, `infoPanel`) via `body.launch-mode` CSS class |
| B  | Two-Tier HUD | Tier 1 (6 lines, always visible): Profile, Mode, Focus, LOD, Data, World. Tier 2 (collapsible, default closed): diagnostics |
| C  | Help Overlay | "What am I looking at?" overlay (top-right, dismissible, session-remembered). Explains trunk/branch/tile/slab + key controls |
| D  | Camera Frame | Deterministic startup camera: frames primary trunk, skips localStorage restore in launch mode |
| E  | Visual Hierarchy | Reduce cyan dominance: tile alpha 0.35, trunk alpha 0.95, branch alpha 0.95 |
| F  | Enter Sheet Button | "Enter Selected Sheet" button (bottom-right). Uses unified `resolveSheetForEnter()` |

---

## 2. Proof Logs (must appear exactly once per refresh in launch mode)

```
[LAUNCH-FIX] uiGating launch=true hiddenPanels=artifacts,ux3,p2p,topicLane,vote,workMode,logConsole applied=PASS
[LAUNCH-FIX] hud tier1=ON tier2=OFF default=collapsed
[LAUNCH-FIX] helpOverlay shown=<true|false> dismissed=<true|false> source=<first|session>
[LAUNCH-FIX] cameraFrame target=<trunkId> result=PASS distM=<N> heading=30 pitch=-35 applied=PASS
[LAUNCH-FIX] visualHierarchy applied=PASS tilesAlpha=0.35 trunkAlpha=0.95
[LAUNCH-FIX] enterSheetBtn shown=true action=<selected|nearest|fallback> sheet=<id>
```

### E-toggle logs (on user action)

```
[CAM] E-toggle action=ENTER sheet=<id> durationMs=0 method=setView result=PASS
[CAM] E-toggle action=EXIT result=PASS
[CAM] Face-on: instant snap (duration=0 method=setView)
```

---

## 3. Unified Sheet Entry

Single source of truth for both **E key** and **"Enter Sheet" button**:

- `window._launchResolveSheetForEnter()` — Priority: selected > nearest-to-camera > first-available
- `window._launchEnterSheetInstant(resolved)` — Enters with `duration: 0` (setView, never flyTo)

E key also toggles: pressing E while in sheet mode calls `exitEditSheetMode()`.

---

## 4. CSS Visibility Rules

### Hidden in launch mode (`body.launch-mode`)

| Element | Reason |
|---------|--------|
| `#artifactInspectorPanel` | Dev panel |
| `#p2pEntryPanel` | Dev panel |
| `#branchStewardPanel` | Dev panel |
| `#voteLanePanel` | Dev panel |
| `#votePanel` | Dev panel |
| `#workModeSurface` | Dev status bar |
| `#logConsole` | On-screen log (DevTools still works) |
| `#infoPanel` | Dev info panel |

### Must remain visible

| Element | Reason |
|---------|--------|
| `#hud` | Adaptive HUD (Tier 1 + 2) |
| `#cesiumContainer` | 3D scene |
| `#sheetOverlay` | Sheet cell edit bar |
| `#spreadsheetOverlay` | 2D grid (controlled by `edit-sheet-mode` body class) |
| `#launchHelpOverlay` | Help overlay (launch-only) |
| `#launchEnterSheetBtn` | Enter sheet button (launch-only) |
| `#matchInspector` | Default hidden, shown on demand |
| `#capabilityBuds` | Default hidden, shown on demand |
| `#focusLensVignette` | Controlled by `focus-lens-active` body class |
| `#focusBreadcrumb` | Controlled by `focus-lens-active` body class |

---

## 5. Keyboard Guards

All shortcut keys (E, H, L, I, F, Space, 1-5) are suppressed when focus is inside:
- `<input>`
- `<textarea>`
- `contentEditable` elements

This prevents key stealing during text entry.

---

## 6. HUD Tier 1 Fields (always consistent, no silent blanks)

| Field | Fallback |
|-------|----------|
| Profile | `launch` (always) |
| Mode | `FreeFly` / `SheetEdit` / `BranchWalk` / `FilamentRide` / `Focus` |
| Focus | `Global / (none) / (none)` when unset |
| LOD | `UNKNOWN` when unset |
| Data | `OK` when unset |
| World | Imagery selector + Boundaries ON/OFF badge |

---

## 7. Reset View

"Reset view" link in HUD Tier 1 footer calls `window._launchResetCameraFrame()`:
- Exits edit-sheet mode if active
- Frames primary trunk at deterministic position
- Same camera parameters as startup frame (D)

---

## 8. Launch Presentation Theme (cinematic rendering)

Addendum: presentation layer that transforms "debug-readable" geometry into "product cinematic" without changing what is rendered, only how it looks.

### Post-processing (`app/cesium/viewer-init.js`, launch-only)

| Stage | Setting |
|-------|---------|
| FXAA | `enabled = true` |
| Bloom | `contrast=110, brightness=-0.15, delta=0.9, sigma=2.5` |
| Fog | `density=0.00035, screenSpaceErrorFactor=4.0` |
| Atmosphere | `hueShift=-0.02, saturationShift=-0.15, brightnessShift=0.08` |
| HDR | `highDynamicRange = true` |
| Globe base | `#1a2033` (dark, lets geometry pop) |

### Theme tokens (`LAUNCH_THEME` in `filament-renderer.js`)

| Element | Color | Alpha | Notes |
|---------|-------|-------|-------|
| Trunk | `#4a7fb5` | 0.92 | + glow shell `#6ab0e8` at 0.25 |
| Branch base/mid/tip | `#3a6d9e` / `#4a80b0` / `#5a93c2` | 0.88 | gradient taper |
| Tile fill | `#3a7fc8` | 0.08 | near-transparent glass |
| Tile border | `#7ec8f8` | 0.65 | bright clean edge |
| Tile label | `#a0c8e8` | 0.45 | subtle, not shouty |
| Root | `#4a7fb5` | 0.35 | faint ground anchor |
| Tether | `#6ab0e8` | 0.3 | thin light line |
| Filaments | `#7ec8f8` | 0.12 | faint light threads |
| Spine | `#7ec8f8` | 0.18 | slightly brighter thread |
| Junction | `#7ec8f8` | 0.7 | 6px dot |
| Proxy | `#2a3a55` | 0.25 | dark subtle footprint |

Proof log: `[LAUNCH-THEME] postProcess fxaa=ON bloom=ON fog=0.00035 atmosphere=tuned hdr=ON`
Proof log: `[LAUNCH-THEME] tokens loaded trunk=#4a7fb5 tile=glass filament=lightThread`

---

## 9. Files Modified

| File | Changes |
|------|---------|
| `relay-cesium-world.html` | CSS rules, HTML elements, JS init, E key handler, camera frame, keyboard guards |
| `app/ui/hud-manager.js` | Two-tier render path, Tier 1 consistency, Reset view button |
| `app/renderers/filament-renderer.js` | `LAUNCH_THEME` tokens, `_launchVisuals` flag, glass tiles, glow shell, themed filaments |
| `app/cesium/viewer-init.js` | FXAA, bloom, fog, atmosphere, HDR, globe base color (launch-only) |

---

## 10. Non-Negotiables

- Do NOT change topology, staging, or gates
- Do NOT change proof behavior or VIS gate logic
- All changes gated behind `window.RELAY_LAUNCH_MODE === true`
- Non-launch profiles (`?profile=world`, `?profile=proof`) are completely unaffected
