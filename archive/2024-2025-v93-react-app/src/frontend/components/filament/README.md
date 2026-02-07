# Relay Filament System

**Truth-preserving computation visualization** inspired by music notation and git graphs.

---

## Core Concepts

### 1. **Filament = Persistent Identity Through Time**
- NOT "data lines", NOT "cells", NOT "UI"
- A **biography** of one record/entity moving through operations
- Always discrete, never continuous

### 2. **Time Box = Atomic Belief State**
- 6-faced cube with fixed semantic meaning:
  - **+X face**: Output/Current belief
  - **-X face**: Inputs/Dependencies
  - **+Y face**: Semantic meaning
  - **-Y face**: Magnitude/Confidence
  - **+Z face**: Identity & Lineage
  - **-Z face**: Root evidence pointer

### 3. **Event = Discrete Operation (Glyph)**
- 8 canonical glyphs (like music notation):
  - **STAMP**: Operation marker
  - **KINK**: Transform
  - **DENT**: Magnitude impact
  - **TWIST**: Encryption
  - **UNTWIST**: Decryption
  - **GATE**: Filter
  - **SPLIT**: Branch
  - **SCAR**: Merge/reconcile

### 4. **Axes (Invariant)**
- **X axis**: Event order (NOT clock time)
- **Y axis**: Magnitude/displacement
- **Z axis**: Co-presence eligibility (minimal, mostly hidden)

### 5. **Time Model**
- **Event-time**: Discrete commits (structural truth)
- **Clock-time**: Metadata/spacing (ambient medium)
- **Playback-time**: Pause/play navigation (viewer control)

### 6. **Theme System**
- Governable via vote buttons
- Can change: materials, colors, labels
- Cannot change: topology, axes, event types, stacking rules

---

## Module Structure

```
filament/
├── types/              # Type definitions
│   ├── Filament.ts     # Filament schema
│   ├── TimeBox.ts      # Time Box schema
│   ├── Event.ts        # Event/glyph schema
│   ├── Theme.ts        # Theme system
│   └── index.ts
├── layout/             # Layout engine
│   ├── layoutEngine.ts        # Deterministic positioning
│   └── spacingCalculator.ts  # Filament spacing
├── glyphs/             # Glyph renderers (TODO)
├── renderers/          # Core renderers (TODO)
├── camera/             # Camera transitions (TODO)
├── playback/           # Playback motor (TODO)
├── lens/               # Lens system (TODO)
└── themes/             # Theme management (TODO)
```

---

## Key Invariants

### Stacking Rules (Music Engraving)
1. **One Δx slot** = max 1 body glyph + any number of modifier glyphs
2. **Uniform Δx footprint** (unless explicitly span-events)
3. **Y-offset lanes**:
   - Lane 0: Body glyph (on filament)
   - Lane +1: Modifiers above
   - Lane -1: Numeric annotations below

### Validation
- Layout engine **throws** on stacking rule violations
- All positions are deterministic (given events → unique layout)
- Spacing is typography only (never semantic)

### Camera Transitions (Single Continuous Space)
1. **Globe** → Z spatial, X hidden
2. **Region/Industry** → Z unfolds, X depth cue
3. **Workflow** → X horizontal (work visible)
4. **Spreadsheet** → Perpendicular to +X (values flat)
5. **Chart/KPI** → Derived filaments

---

## Implementation Status

### ✅ Complete
- [x] Type definitions (Filament, TimeBox, Event, Theme)
- [x] Layout engine (deterministic positioning)
- [x] Spacing calculator (typography)
- [x] Stacking rule enforcement
- [x] Theme presets (Forensic Mono, High Contrast)

### ⏳ TODO (Next Steps)
1. **Glyph renderers** (8 glyphs × 2 modes: far silhouette + near label)
2. **Filament renderer** (hollow pipe + Time Boxes)
3. **Axes renderer** (X/Y/Z with labels + grid)
4. **Main scene** (React Three Fiber canvas)
5. **Playback motor** (pause/play commit cursor)
6. **Lens system** (Y-axis remapping)
7. **Theme switcher** (vote button integration)
8. **Camera controller** (transitions globe→workflow→sheet)

---

## Usage Example (Conceptual)

```tsx
import { Filament, Event } from './types';
import { computeLayout } from './layout/layoutEngine';

// Define a filament (e.g., invoice total)
const filament: Filament = {
  id: 'invoice-001',
  name: 'Invoice Total',
  baselineMagnitude: 1250,
  magnitudeUnit: 'USD',
  zContext: { boundaryId: 'acme-corp' },
  timeBoxes: [...], // Time Boxes at each commit
  events: [
    { id: 'e1', type: 'STAMP', eventIndex: 0, label: 'Load' },
    { id: 'e2', type: 'KINK', eventIndex: 1, label: 'Parse' },
    { id: 'e3', type: 'GATE', eventIndex: 2, label: 'Filter nulls' },
    { id: 'e4', type: 'KINK', eventIndex: 3, label: 'USD→EUR' },
    { id: 'e5', type: 'TWIST', eventIndex: 4, label: 'Encrypt' },
    { id: 'e6', type: 'UNTWIST', eventIndex: 5, label: 'Decrypt' },
    { id: 'e7', type: 'SPLIT', eventIndex: 6, label: 'Derive KPI' },
  ],
};

// Compute layout
const layout = computeLayout(filament.events);

// Render (TODO: actual React Three Fiber components)
<FilamentScene>
  <FilamentRenderer filament={filament} layout={layout} />
</FilamentScene>
```

---

## Design Philosophy

> **"If you remove the UI, remove the colors, remove the labels, and remove the camera — the geometry alone must still allow an auditor to reconstruct what happened."**

Everything in the filament system follows from this invariant.

---

## References

- Music notation: Staff lines = filament rails, notes = Time Boxes
- Git graphs: Commits = Time Boxes, branches = SPLIT, merges = SCAR
- Relay Time Box Face Specification (canonical draft)
- ChatGPT conversation context (filament grammar, glyph alphabet)

---

**Next**: Implement glyph renderers + basic scene to reach "final render" milestone.
