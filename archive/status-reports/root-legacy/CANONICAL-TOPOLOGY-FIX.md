# Canonical Tree Topology - FIXED

**Date**: 2026-02-06  
**Issue**: Tree topology was radial (branches spreading in all directions)  
**Fix**: Parallel branches along +X axis with horizontal sheets above

---

## ✅ Canonical Topology (Correct)

```
TOP VIEW (looking down):
                    
     [Sheet]       [Sheet]       (Horizontal planes, facing UP)
        |             |           (Filaments going DOWN)
        |             |
    ━━━Branch━━━  ━━━Branch━━━   (Parallel, along +X axis)
        |             |
    ━━━━━┻━━━━━━━━━━━┻━━━━━     (Trunk top)
          Trunk
            ║
            ║
          Ground

SIDE VIEW (from +Y direction):
           [Sheet]───────────────┐
             │ (filaments down)  │ 300m clearance
           Branch════════════════┤ 2000m (horizontal)
             │                   │
           Trunk                 │
             ║                   │
           Ground                │
```

---

## 🎯 Key Topology Rules

### 1. Trunk: Vertical (Z axis)
```javascript
Position: (trunkLon, trunkLat, 0 → 2000m)
Direction: Straight up (+Z)
```

### 2. Branches: Horizontal, Parallel (+X axis)
```javascript
Start: (trunkLon, trunkLat, 2000m)  // At trunk top
End: (trunkLon + length, trunkLat + offset, 2000m)  // Along +X, tight Y spacing

ALL branches:
- Same Z height (2000m)
- Same +X direction (parallel)
- Tight Y spacing (0.0002° ≈ 22m)
- No radial spread
```

### 3. Sheets: Horizontal Above Branches
```javascript
Position: (branchEndLon, branchEndLat, 2300m)  // 300m above branch
Orientation: HORIZONTAL (rectangle natural orientation)
Facing: UPWARD (viewable from top)

Sheet is ABOVE its parent branch, not at branch endpoint altitude
```

### 4. Filaments: Downward (Cells to Branch)
```javascript
Start: Cell position (on sheet at 2300m)
End: Branch position (below at 2000m)
Direction: Mostly straight DOWN with slight curve

Filaments drape DOWN like cables
```

---

## 📊 Demo Tree Configuration

### Trunk
```javascript
{
    lat: 32.0853,
    lon: 34.7818,
    height: 0,      // Ground
    alt: 2000       // Top
}
```

### Branch 1 (Operations)
```javascript
{
    lat: 32.0853,                  // SAME as trunk (no Y offset)
    lon: 34.7818 + 0.005,         // +X direction (0.005° ≈ 550m)
    alt: 2000,                     // SAME height as trunk top
    parent: "trunk.avgol"
}
```

### Branch 2 (Sales)
```javascript
{
    lat: 32.0853 + 0.0002,         // +Y offset (tight, 22m)
    lon: 34.7818 + 0.005,          // +X direction (parallel to Branch 1)
    alt: 2000,                     // SAME height (aligned)
    parent: "trunk.avgol"
}
```

### Sheet 1 (Packaging)
```javascript
{
    lat: 32.0853,                  // ABOVE Branch 1 (same lat)
    lon: 34.7818 + 0.005,          // ABOVE Branch 1 (same lon)
    alt: 2300,                     // 300m ABOVE branch
    parent: "branch.operations"
}
```

### Sheet 2 (Materials)
```javascript
{
    lat: 32.0853 + 0.0002,         // ABOVE Branch 2
    lon: 34.7818 + 0.005,          // ABOVE Branch 2 (parallel)
    alt: 2300,                     // 300m ABOVE branch (aligned)
    parent: "branch.sales"
}
```

---

## 🔧 Rendering Changes

### Branch Rendering: Horizontal Lines
**Before (WRONG)**:
```javascript
// Curved arc from trunk to geographic position
createArcPositions(trunkTop, branchEnd, 16)
```

**After (CORRECT)**:
```javascript
// Straight horizontal line at trunk height
[trunkTopPos, branchEndPos]  // Both at same Z (2000m)
```

### Sheet Rendering: Horizontal Rectangles
**Before (WRONG)**:
```javascript
// Perpendicular to branch direction (facing camera)
```

**After (CORRECT)**:
```javascript
// Natural rectangle orientation (horizontal, facing UP)
stRotation: 0
```

### Filament Rendering: Downward Connections
**Before (WRONG)**:
```javascript
// From branch UP to cells
createArcPositions(branchPos, cellPos, 8)
```

**After (CORRECT)**:
```javascript
// From cells DOWN to branch
createDownwardFilament(cellPos, branchPos, 4)
// Mostly straight down with slight curve
```

---

## 📈 Timebox Granularity

### Before (WRONG): 2-4 timeboxes per segment
```javascript
trunk.commits: [4 timeboxes]
branch.commits: [2 timeboxes]
```

### After (CORRECT): 4-6 timeboxes per segment
```javascript
trunk.commits: [6 timeboxes: T1, T2, T3, T4, T5, T6]
branch.commits: [4 timeboxes: B1-T1, B1-T2, B1-T3, B1-T4]
```

**Result**: More granular time segmentation

---

## 🎯 Expected Visual Result

### Top View (Looking Down)
```
User should see:
- Trunk (center, vertical pillar)
- 2 branches extending RIGHT (+X) in parallel
- 2 sheets hovering ABOVE branches (horizontal rectangles)
- Many thin lines (filaments) going DOWN from sheets to branches
```

### Side View (From +Y)
```
User should see:
- Trunk (vertical)
- Branch (horizontal line extending right)
- Sheet (horizontal rectangle above branch)
- Filaments (vertical/diagonal lines downward)
```

### Key Visual Tests
- ✅ Branches are parallel (not spreading radially)
- ✅ Branches are horizontal (not curved upward)
- ✅ Sheets are horizontal (flat rectangles, not tilted)
- ✅ Filaments go down (from sheets to branches)
- ✅ Tree is "tight" (branches close together in Y)

---

## 📐 Coordinate System Alignment

```
X axis (Longitude): OUTWARD direction (east)
  - Branches extend along +X
  - All branches parallel to X axis
  
Y axis (Latitude): TIGHT SPACING (north)
  - Branches offset slightly in Y (0.0002° spacing)
  - Minimal spread
  
Z axis (Altitude): VERTICAL (up)
  - Trunk extends along +Z (0 → 2000m)
  - Branches horizontal (constant Z = 2000m)
  - Sheets above branches (Z = 2300m)
  - Filaments down (2300m → 2000m)
```

---

## 🔍 Console Output Changes

### Expected Logs
```
🌲 Rendering tree: 5 nodes, 4 edges

[Trunk: vertical, 0-2000m]
⏰ Rendering 6 timeboxes on trunk trunk.avgol  ← More granular
✅ Timeboxes rendered: 6

[Branch 1: horizontal along +X]
⏰ Rendering 4 timeboxes on branch branch.operations
✅ Timeboxes rendered: 4

[Branch 2: horizontal along +X, parallel]
⏰ Rendering 4 timeboxes on branch branch.sales
✅ Timeboxes rendered: 4

[Sheet 1: horizontal above branch 1]
📄 Rendering sheet plane: sheet.packaging at [34.7868, 32.0853, 2300]
📊 Rendering cell grid: 8 rows × 6 cols
✅ Cell grid complete: 48 cells

[Sheet 2: horizontal above branch 2, aligned]
📄 Rendering sheet plane: sheet.materials at [34.7868, 32.0855, 2300]
📊 Rendering cell grid: 6 rows × 5 cols
✅ Cell grid complete: 30 cells

[Filaments: downward from cells to branch]
✅ Cell filaments rendered: 78 (1:many connections, DOWNWARD)
```

---

## ✅ Verification Checklist

After hard refresh, verify:

### Topology
- [ ] Trunk vertical (0 → 2000m)
- [ ] Branches horizontal at 2000m (not curved)
- [ ] Branches parallel (both along +X axis)
- [ ] Branches tight (close together in Y)
- [ ] Sheets at 2300m (ABOVE branches, not at branch endpoint)
- [ ] Sheets horizontal (rectangles facing up)

### Filaments
- [ ] Filaments go DOWN (from sheet 2300m to branch 2000m)
- [ ] 78 filaments total (48 + 30)
- [ ] Each cell has its own downward connection

### Timeboxes
- [ ] 6 timeboxes on trunk (more granular)
- [ ] 4 timeboxes per branch (more granular)
- [ ] Total 14 timeboxes (was 8)

### Console
- [ ] Shows 6 trunk timeboxes
- [ ] Shows 4 timeboxes per branch
- [ ] Shows sheets at altitude 2300m
- [ ] Shows "78 filaments (DOWNWARD)"

---

## 🚀 Next Steps

1. **Hard refresh** to see new topology
2. **Verify visual alignment** (branches parallel, sheets horizontal)
3. **Check console logs** (more timeboxes, correct altitudes)
4. **Test Excel import** (should follow same topology)
5. **Phase 2.1** (primitives migration with correct topology)

---

**Status**: Canonical topology implemented. Branches parallel along +X. Sheets horizontal above branches. Filaments downward. Tree tight and aligned.
