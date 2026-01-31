# Filament System Implementation Priority

**Based on**: CANONICAL-MODEL.md (2026-01-27)

---

## Implementation Order (Correct Sequence)

### **Phase 1: Foundation ✅ COMPLETE**

- [x] Type system (Filament, TimeBox, Event, Theme, ViewMode)
- [x] Layout engine (deterministic positioning)
- [x] Stacking rules enforcement
- [x] Spacing calculator

---

### **Phase 2: Globe/Branch Mode (PRIORITY 1)**

**Why first**: This is what users see initially. Voting UI needs this.

#### **2A: Vertical Branch Renderer** (2-3 hours)
```
src/frontend/components/filament/renderers/
└── BranchRenderer.jsx
```

**Requirements**:
- Render single vertical cylinder at (lat, lon, Z)
- Height driven by `currentMagnitude` (from latest Time Box)
- Animated: interpolate Y position on commit boundaries
- Material: translucent, glowing at tip
- No glyphs, no Time Boxes (history collapsed)

#### **2B: Globe Integration** (2 hours)
```
src/frontend/components/filament/globe/
├── GlobeFilamentLayer.jsx
└── BranchCollection.jsx
```

**Requirements**:
- Render multiple branches on globe surface
- Map filament.zContext → (lat, lon)
- Subscribe to vote commits
- Animate height changes (rise/fall)
- Pulse/glow on activity

#### **2C: Playback Motor (Globe Mode)** (1-2 hours)
```
src/frontend/components/filament/playback/
├── PlaybackMotor.jsx
└── CommitCursor.ts
```

**Requirements**:
- Play/Pause/Step controls
- Advance commitIndex discretely
- Trigger branch height updates
- Live tail mode (follow frontier)

---

### **Phase 3: Workflow Mode (PRIORITY 2)**

**Why second**: Needed for audit/inspection features.

#### **3A: Horizontal Filament Renderer** (2-3 hours)
```
src/frontend/components/filament/renderers/
├── FilamentRenderer.jsx
├── FilamentPipe.jsx
└── TimeBoxRenderer.jsx
```

**Requirements**:
- Render horizontal pipe along X axis
- Hollow tube (TubeGeometry)
- Time Boxes as cubes at event indices
- Translucent material with microtexture

#### **3B: Glyph Renderers** (3-4 hours for first 3)
```
src/frontend/components/filament/glyphs/
├── Stamp.jsx
├── Kink.jsx
├── Dent.jsx
└── GlyphLabel.jsx
```

**Requirements**:
- Far mode: silhouette only
- Near mode: 2D billboard labels
- Camera-distance threshold switching
- Lane positioning (body vs modifier)

#### **3C: Workflow Scene** (2 hours)
```
src/frontend/components/filament/scenes/
├── WorkflowScene.jsx
├── AxisRenderer.jsx
└── GroundPlane.jsx
```

**Requirements**:
- React Three Fiber Canvas
- X/Y/Z axes with labels
- Grid plane
- Camera controls (orbit)
- Lighting setup

---

### **Phase 4: View Mode Transitions (PRIORITY 3)**

**Why third**: Connects globe and workflow views.

#### **4A: Camera Controller** (2-3 hours)
```
src/frontend/components/filament/camera/
├── CameraController.jsx
├── transitions.ts
└── zoomLevels.ts
```

**Requirements**:
- Smooth camera animations between view modes
- Globe→Region: zoom in
- Region→Workflow: rotate (THE PIVOT)
- Workflow→Spreadsheet: rotate perpendicular

#### **4B: Filament Mode Switcher** (1 hour)
```
src/frontend/components/filament/renderers/
└── AdaptiveFilamentRenderer.jsx
```

**Requirements**:
- Render branch (vertical) in globe/region mode
- Render horizontal filament in workflow mode
- Smooth morph between modes during transition

---

### **Phase 5: Spreadsheet View (PRIORITY 4)**

**Why fourth**: Excel-like interface for data entry.

#### **5A: Spreadsheet Grid** (2-3 hours)
```
src/frontend/components/filament/spreadsheet/
├── SpreadsheetView.jsx
├── CellRenderer.jsx
└── FilamentGhost.jsx
```

**Requirements**:
- Grid of cells (values from +X face of latest Time Box)
- Ghosted filaments behind grid
- Click cell → rotate into workflow mode
- Highlight filament on hover

---

### **Phase 6: Lens System (PRIORITY 5)**

**Why fifth**: Makes Y-axis meaning switchable.

#### **6A: Lens Engine** (1-2 hours)
```
src/frontend/components/filament/lens/
├── LensSystem.tsx
├── lensPresets.ts
└── LensSelector.jsx
```

**Requirements**:
- Define lens presets (Vote, Momentum, Confidence, Impact)
- Remap Y values based on active lens
- Update branch heights when lens changes
- UI selector (vote-button integration)

---

### **Phase 7: Remaining Glyphs (PRIORITY 6)**

**Why sixth**: Complete glyph alphabet.

#### **7A: Encryption Glyphs** (1 hour)
- Twist.jsx
- Untwist.jsx

#### **7B: Filter/Branch Glyphs** (1 hour)
- Gate.jsx
- Split.jsx

#### **7C: Merge Glyph** (1 hour)
- Scar.jsx

---

### **Phase 8: Theme System (PRIORITY 7)**

**Why seventh**: Polish and accessibility.

#### **8A: Theme Engine** (1 hour)
```
src/frontend/components/filament/themes/
├── themeEngine.ts
├── ThemeProvider.jsx
└── themeGovernance.jsx
```

**Requirements**:
- Apply theme to all renderers
- Theme switcher UI
- Vote-button integration for theme proposals

---

### **Phase 9: Time Views (PRIORITY 8)**

**Why eighth**: Advanced inspection features.

#### **9A: Time-Weighted Layout** (1-2 hours)
```
src/frontend/components/filament/layout/
└── timeWeightedLayout.ts
```

**Requirements**:
- Compute spacing based on clock-time gaps
- Show inactivity as visible gaps
- Toggle between event-normalized and time-weighted

---

### **Phase 10: Integration (PRIORITY 9)**

**Why last**: Connect to existing Relay app.

#### **10A: Route Integration** (1 hour)
- Add `/filament-demo` route
- Add navigation from existing UI

#### **10B: Vote API Integration** (2 hours)
- Connect to existing vote endpoints
- Map vote data → filament/TimeBox format
- Real-time updates

#### **10C: Globe Layer Integration** (2-3 hours)
- Add filament branches to existing Cesium globe
- Coordinate with existing channel towers
- Z-fighting prevention

---

## Current Status

### ✅ Complete
- Phase 1: Foundation (types, layout engine, spacing)

### 🔄 In Progress
- None

### ⏳ Next Up
- **Phase 2A: Vertical Branch Renderer** ← START HERE

---

## Estimated Total Time to MVP

| Phase | Hours |
|-------|-------|
| 2: Globe/Branch Mode | 5-7 |
| 3: Workflow Mode | 7-9 |
| 4: View Transitions | 3-4 |
| 5: Spreadsheet | 2-3 |
| 6: Lens System | 1-2 |
| 7: Remaining Glyphs | 3 |
| 8: Theme System | 1 |
| 9: Time Views | 1-2 |
| 10: Integration | 5-6 |
| **Total** | **28-37 hours** |

**MVP Target**: Phases 2-4 (Globe + Workflow + Transitions) = ~15-20 hours

---

## Decision Points

### **Start with Globe or Workflow?**

**Recommendation: Globe first (Phase 2)**

**Reasons**:
1. This is what users see initially
2. Your voting UI needs this immediately
3. Simpler geometry (vertical cylinders)
4. Can demo vote-driven motion quickly
5. Workflow mode is complex (needs all glyphs)

**Alternative**: If you want to validate full filament logic first, start with Phase 3 (Workflow), then do Phase 2.

---

## Next Action

**Build Phase 2A: Vertical Branch Renderer**

Would you like me to:
- **Option A**: Build the vertical branch renderer now
- **Option B**: Build a simple demo scene showing both modes side-by-side
- **Option C**: Build the playback motor first (so we can test animation)
