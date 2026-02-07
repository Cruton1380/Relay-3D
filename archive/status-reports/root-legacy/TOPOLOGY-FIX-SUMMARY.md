# Topology Fix Summary - 2026-02-06

**User Request**: "All branches should be aligned parallel and tight along the outward X axis. The spreadsheets should be facing upwards so they are viewable from the top with many filaments going down to the one branch they extend from. Tighten the model according to our original understanding of the x y z axes."

---

## ✅ Changes Made

### 1. Branch Topology: Radial → Parallel ✅

**Before (WRONG)**:
```
Branches spreading in different directions:
- Operations: (32.0900, 34.7900) - Northeast
- Sales: (32.0800, 34.7750) - Southwest
Result: Radial spread (branches pointing everywhere)
```

**After (CORRECT)**:
```
Branches parallel along +X axis:
- Operations: (32.0853, 34.7868) - Along +X
- Sales: (32.0855, 34.7868) - Along +X, parallel
Result: Tight parallel extensions
```

**Key Changes**:
- All branches same longitude offset (+0.005° in +X)
- Minimal latitude spacing (0.0002° ≈ 22m in +Y)
- All branches at same altitude (2000m horizontal)

---

### 2. Sheet Orientation: Perpendicular → Horizontal ✅

**Before (WRONG)**:
```
Sheets at branch endpoints, perpendicular to branch direction
- Facing sideways/toward camera
- Hard to see cell grid from top
```

**After (CORRECT)**:
```
Sheets HORIZONTAL above branches:
- At 2300m (300m above branch at 2000m)
- Natural rectangle orientation (horizontal)
- Facing UPWARD (viewable from top)
- Cell grid visible when looking down
```

---

### 3. Filament Direction: Upward → Downward ✅

**Before (WRONG)**:
```
Filaments from branch UP to cells:
- createArcPositions(branchPos, cellPos)
- Direction: Upward from branch
```

**After (CORRECT)**:
```
Filaments from cells DOWN to branch:
- createDownwardFilament(cellPos, branchPos)
- Direction: Downward from sheet
- Mostly straight with slight curve
```

**New Method**: `createDownwardFilament(topPos, bottomPos, segments)`
- Linear interpolation for straight-down path
- 5% horizontal curve for visibility
- 4 segments (vs 8-16 for branches)

---

### 4. Timebox Granularity: Increased ✅

**Before (WRONG)**:
```
Trunk: 4 timeboxes (W1, W2, W3, W4)
Branches: 2 timeboxes each
Total: 8 timeboxes
```

**After (CORRECT)**:
```
Trunk: 6 timeboxes (T1-T6)
Branch Operations: 4 timeboxes (B1-T1 through B1-T4)
Branch Sales: 4 timeboxes (B2-T1 through B2-T4)
Total: 14 timeboxes
```

**Result**: More granular time segmentation per user request

---

## 📊 Topology Comparison

### Old Topology (Radial)
```
       Branch2 ↗
      /
Trunk ─ Branch1 →
      \
       Branch3 ↘
       
Sheets at branch endpoints (various directions)
Filaments upward
```

### New Topology (Parallel)
```
TOP VIEW:
[Sheet1]────────────
[Sheet2]────────────  (Above, horizontal)
    ││││││││││││        (Filaments down)
━━━Branch1━━━━━━━━━━  (Horizontal, +X)
━━━Branch2━━━━━━━━━━  (Parallel, +X)
    ║
  Trunk (Vertical)
    ║
  Ground

SIDE VIEW:
[Sheet]─────────┐
    │ (down)    │ 300m
  Branch════════┤ 2000m
    │           │
  Trunk         │
    ║           │
  Ground        │
```

---

## 📝 Files Modified

### 1. `relay-cesium-world.html` (Demo Tree Data)
**Changes**:
- Branch positions: Parallel along +X axis
- Branch altitudes: All at 2000m (horizontal)
- Sheet positions: Above branches (2300m vs 2000m)
- Sheet altitudes: Aligned (both at 2300m)
- Timebox granularity: 6 on trunk, 4 per branch

**Key Values**:
```javascript
branchSpacing = 0.0002;  // Tight Y spacing (~22m)
branchLength = 0.005;     // Fixed X extension (~550m)
sheetClearance = 300;     // Height above branch
```

### 2. `app/renderers/filament-renderer.js`
**New Methods**:
- `createDownwardFilament(topPos, bottomPos, segments)` - Downward connections

**Modified Methods**:
- `renderBranch()` - Now renders horizontal straight lines (not arcs)
- `renderSheetPlane()` - Sheets horizontal (stRotation: 0)
- `renderCellFilaments()` - Filaments go DOWN from cells to branch

**Key Changes**:
```javascript
// Branch: Horizontal at trunk top
const branchHeight = parent.alt;  // 2000m
const positions = [trunkTop, branchEnd];  // Straight line

// Sheet: Horizontal above branch
stRotation: 0  // Natural orientation

// Filaments: Downward
createDownwardFilament(cellPos, branchPos, 4)  // Cell → Branch
```

### 3. Documentation
**New**:
- `CANONICAL-TOPOLOGY-FIX.md` - Complete topology specification
- `TOPOLOGY-FIX-SUMMARY.md` (this file)

**Updated**:
- `README.md` - New topology description

---

## 🎯 Expected Visual Result

### After Hard Refresh

**Top View (Looking Down)**:
```
Should see:
- Trunk (center, vertical pillar)
- 2 horizontal lines extending RIGHT (branches, parallel)
- 2 rectangles above branches (sheets, horizontal)
- Many thin vertical lines (filaments) from sheets to branches
```

**Side View (From +Y)**:
```
Should see:
- Trunk (vertical line)
- Branch (horizontal line extending right)
- Sheet (horizontal rectangle above branch)
- Filaments (mostly vertical lines downward)
```

**Console Output**:
```
🌲 Rendering tree: 5 nodes, 4 edges
⏰ Rendering 6 timeboxes on trunk (was 4)
⏰ Rendering 4 timeboxes on branch.operations (was 2)
⏰ Rendering 4 timeboxes on branch.sales (was 2)
📄 Rendering sheet plane: sheet.packaging at [..., 2300]  (was 2500)
📄 Rendering sheet plane: sheet.materials at [..., 2300]  (was 2400)
✅ Cell filaments rendered: 78 (1:many connections, DOWNWARD)
✅ Turgor force animation started
```

---

## ✅ Verification Checklist

User should verify:

### Visual Alignment
- [ ] Branches extend parallel (both along +X axis)
- [ ] Branches are tight (close together in Y, not spreading)
- [ ] Branches are horizontal (straight lines, not arcs)
- [ ] Sheets are horizontal rectangles (facing up)
- [ ] Sheets are ABOVE branches (not at branch endpoints)
- [ ] Filaments go DOWN (from sheets to branches)

### Console Logs
- [ ] 6 timeboxes on trunk (not 4)
- [ ] 4 timeboxes per branch (not 2)
- [ ] Sheets at altitude 2300m (not 2500/2400)
- [ ] "Cell filaments: 78 (DOWNWARD)" message

### Topology Rules
- [ ] All branches at Z = 2000m
- [ ] All sheets at Z = 2300m (300m above branches)
- [ ] Branch spacing in Y ≈ 0.0002° (tight)
- [ ] Branch extension in X ≈ 0.005° (parallel)

---

## 🚀 Next Steps

1. **Verify topology** (hard refresh, check visual alignment)
2. **Test Excel import** (should follow same parallel topology)
3. **Phase 2.1** (primitives migration with correct topology)
4. **Phase 3** (timebox segmentation on parallel branches)

---

**Status**: Topology fixed to canonical model. Branches parallel along +X. Sheets horizontal above branches. Filaments downward. Tree tight and aligned. More granular timeboxes. Ready for user verification.
