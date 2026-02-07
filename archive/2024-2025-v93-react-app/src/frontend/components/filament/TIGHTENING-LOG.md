# FILAMENT SCENE TIGHTENING LOG

**Purpose**: Document surgical fixes to keep scenes canonical and presence-ready.

---

## FilamentDemoScene.jsx - Tightened to "Truth Atom" Demo

### **Changes Applied:**

1. ✅ **Grid hidden by default**
   - Added `showDebugGrid = false` param to `AxisRenderer`
   - Grid only renders when `showDebugGrid={true}`
   - Default: no grid (forensic view only)

2. ✅ **Evidence pointers added**
   - Added `evidence: { type, pointer }` to all DEMO_FILAMENT timeBoxes
   - Examples: `'invoice_raw.csv'`, `'parse_commit#a1f3'`, `'filter_commit#b2e4'`
   - -Z face now shows real pointer instead of `#${timeBox.id}`

3. ✅ **Cursor starts at 0**
   - Changed: `useState(0)` instead of `useState(DEMO_FILAMENT.timeBoxes.length - 1)`
   - Playback proof: start at beginning, reveal commits progressively

4. ✅ **Time-weighted gap capped**
   - Added `MAX_EXTRA_GAP = 60` to prevent explosion during long idle periods
   - Cap: `Math.min(MAX_EXTRA_GAP, Math.max(0, (timeDelta / 100) - DELTA_X))`
   - Visual gap clamped; real delta still stored (can show on hover later)

5. ✅ **Evidence face shows real pointer**
   - Changed: `{timeBox.faces.evidence?.pointer || `#${timeBox.id}`}`
   - Consistent with WorkflowProofScene

---

## WorkflowProofScene.jsx - Tightened to "Cell = Projection" Proof

### **Changes Applied:**

1. ✅ **Canvas always rendered**
   - Removed: `{selectedCell && <Canvas ... />}`
   - Now: `<Canvas>` always present
   - Before click: Camera far `[60, 30, 80]`, filament dimmed, controls disabled
   - After click: Camera snaps to `[30, 15, 40]`, filament full opacity, controls enabled
   - **Prevents re-mounting R3F scene** (critical for future presence state)

2. ✅ **Camera snap fast and deterministic**
   - Changed: `progress.current += 0.15` (was `0.05`)
   - Fast snap emphasizes "viewer motion only, not truth animation"
   - No easing that feels like state change

3. ✅ **Evidence face already correct**
   - Already shows: `timeBox.faces.evidence?.pointer`
   - No changes needed

---

## Presence Insertion Readiness

### **Hook Points Prepared:**

Both scenes now support presence layer injection:

**FilamentDemoScene.jsx** (line ~675, after FilamentRenderer):
```jsx
{/* Future: Presence Layer */}
{/* <PresenceLayer presenceStates={presenceStates} anchorMap={anchorMap} /> */}
```

**WorkflowProofScene.jsx** (line ~678, after FilamentRenderer):
```jsx
{/* Future: Presence Layer */}
{/* <PresenceLayer presenceStates={presenceStates} anchorMap={anchorMap} selectedCell={selectedCell} /> */}
```

### **AnchorMap Exposure:**

Both scenes compute `eventIndexToX` internally in FilamentRenderer.

**Next step for presence**: Expose `anchorMap` as return value or compute once in parent, then pass to both FilamentRenderer and PresenceLayer.

---

## What NOT to Touch (Locked)

- ❌ Filament truth geometry (pipe, timeboxes, glyphs)
- ❌ Event order semantics (X-axis)
- ❌ Cursor reveal logic
- ❌ Face inspection (already correct)

---

## Next Implementation (When "Build Presence" Signal Given)

1. Create `PresenceState.ts` interface
2. Create `PresenceLayer.jsx` component (Tier 1 only: "N viewers here")
3. Mock heartbeat service (in-memory, TTL)
4. Render small beads on filament spine near cursor
5. Progressive disclosure: Tier 2 (roles) → Tier 3 (identity)

---

**Status**: Scenes tightened. Presence hooks ready. Waiting for "build presence now" signal.
