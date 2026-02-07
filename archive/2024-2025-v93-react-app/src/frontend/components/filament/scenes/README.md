# Filament Demo Scene - Testing Instructions

## What This Proves

This scene validates the **canonical filament language**:

- ✅ Horizontal filament along X (event order)
- ✅ Time Boxes at discrete commits (wireframe cubes)
- ✅ All 8 glyphs with simple silhouettes
- ✅ Far/near label modes (zoom to see labels)
- ✅ Playback motor (transport controls, always visible)
- ✅ **Event-normalized vs time-weighted spacing** (critical!)
- ✅ Gap segments for time (NOT stretched boxes)

---

## How to Test

### 1. Start the app
```bash
npm run dev:frontend
```

### 2. Navigate to the demo
Open: http://localhost:5175/filament-demo

### 3. Controls

**Playback Motor (bottom bar)**:
- **Play/Pause**: Start/stop animation
- **Step**: Advance one commit
- **Tempo**: 0.25×, 0.5×, 1×, 2×, 4× speed
- **Spacing Toggle**: Switch between "Event" (equal) and "Time" (gaps visible)

**Camera**:
- **Orbit**: Left click + drag
- **Zoom**: Scroll wheel
- **Pan**: Right click + drag

### 4. What to Look For

#### **Event-Normalized Mode** (default)
- All Time Boxes evenly spaced
- Pure causality
- No time gaps visible

#### **Time-Weighted Mode** (click "Event" button to switch to "Time")
- **Gap segments appear** between Time Boxes
- Large gap between index 2 and 3 (represents 6-second inactivity)
- **Time Boxes DO NOT STRETCH** - they stay same size
- Gaps are dashed lines with subtle ambient effects

#### **Zoom Behavior**
- Far: Only silhouettes visible
- Near: Labels appear (zoom in to see)
- Threshold: ~60 world units

#### **Glyphs** (colored geometry above filament)
- STAMP (white torus)
- KINK (blue cone)
- GATE (red cylinder)
- TWIST/UNTWIST (purple knot)

---

## What This Validates

### ✅ Correct Implementation

1. **Time-weighted spacing = GAP SEGMENTS**
   - NOT stretched boxes
   - Δx event window stays canonical
   - Silence is visible as gaps

2. **Carry node rule**
   - No new geometry without commits
   - Gaps represent "no commit occurred here"

3. **Playback motor = Transport**
   - Not a timeline scrubber
   - Play/pause/step/tempo
   - Always accessible

4. **Far/Near modes**
   - Labels fade in based on camera distance
   - Glyph silhouettes always visible

---

## Known Limitations (MVP)

- Glyphs are simple placeholder geometry (not final designs)
- No actual commit playback (static demo data)
- No Time Box face inspection (hover shows nothing yet)
- No split/merge rendering yet
- No theme system active

---

## Next Steps After This Validates

Once this proves the language:
1. Map frontier to globe branches (vertical mode)
2. Add remaining glyph detail
3. Connect to real vote data
4. Add camera transitions (pivot to workflow)
5. Build spreadsheet view

---

**This is the vertical slice that proves the system works.**
