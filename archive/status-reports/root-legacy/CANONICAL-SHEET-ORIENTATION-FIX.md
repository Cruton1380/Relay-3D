# Canonical Sheet Orientation Fix - Implementation Status

**Date**: 2026-02-06  
**Status**: IN PROGRESS  
**Phase**: 2.4 - Canonical Topology Enforcement

---

## 🔴 Rule Violation Identified

**INVARIANT A VIOLATION: "Sheets are surfaces, not observers"**

**Current implementation** (`filament-renderer.js` line 497-553):
- Sheet is **horizontal** (East × North plane)
- Sheet normal = ENU Up
- **World-axis aligned**, not branch-aligned

**Canonical requirement**:
- Branch tangent T = +East direction (for straight branches)
- Sheet normal = **-T** (facing back down branch toward trunk)
- Sheet should span **North × Up plane** (vertical, perpendicular to branch)
- When you look down a branch, you should see the sheet **face-on**, not **edge-on**

---

## ✅ Completed

### 1. Created Canonical Render Contract

**File**: `RELAY-RENDER-CONTRACT.md`
- One-page specification for graphics engineers
- Defines all 4 canonical invariants (A/B/C/D)
- Provides frame computation math
- Includes topology lint requirements
- Establishes visual verification checklist

### 2. Updated ENU Coordinates Module

**File**: `app/utils/enu-coordinates.js`

**Added frame computation functions**:
```javascript
// Vector operations
export function tangentAt(points, i)
export function projectOntoPlane(v, n)
export function normalizeVec(v)
export function cross(a, b)
export function negateVec(v)

// Frame computation
export function computeBranchFrames(points)  // Returns {T, N, B}[] using parallel transport
export function sampleLineSegment(start, end, numSamples)
export function enuVecToWorldDir(enuFrame, vENU)
```

**Updated CANONICAL_LAYOUT**:
- Changed `sheet.clearanceAboveBranch` → `sheet.clearanceAlongBranch` (300m along branch tangent)
- Added `cell.width` and `cell.height` for grid positioning
- Clarified sheet dimensions: width (along N), height (along B)

### 3. Updated Filament Renderer Imports

**File**: `app/renderers/filament-renderer.js`

**Added imports**:
```javascript
import {
    // ... existing ...
    tangentAt,
    projectOntoPlane,
    normalizeVec,
    cross,
    negateVec,
    computeBranchFrames,
    sampleLineSegment,
    enuVecToWorldDir
} from '../utils/enu-coordinates.js';
```

### 4. Updated Branch Rendering to Compute Frames

**File**: `app/renderers/filament-renderer.js` → `renderBranchPrimitive()`

**Changes**:
1. **Sample branch curve in ENU** (before converting to world)
2. **Compute {T, N, B} frames** using `computeBranchFrames(branchPointsENU)`
3. **Convert to world positions** after frame computation
4. **Store frames on branch**:
   ```javascript
   branch._branchFrames = branchFrames;  // {T, N, B}[] at each point
   branch._branchPointsENU = branchPointsENU;  // ENU curve points
   branch._branchPositionsWorld = positions;  // World positions
   ```

---

## 🚧 In Progress

### 5. Update Sheet Rendering (NEXT)

**File**: `app/renderers/filament-renderer.js` → `renderSheetPrimitive()`

**Required changes**:

```javascript
renderSheetPrimitive(sheet, branchIndex) {
    try {
        const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
        if (!parent || !parent._enuFrame || !parent._branchFrames) {
            throw new Error('Parent branch not found or missing frames');
        }
        
        const enuFrame = parent._enuFrame;
        const layout = CANONICAL_LAYOUT.sheet;
        
        // Sheet attaches at branch endpoint (last frame)
        const attachIndex = parent._branchFrames.length - 1;
        const frame = parent._branchFrames[attachIndex];  // {T, N, B}
        const branchEndENU = parent._branchPointsENU[attachIndex];
        
        // Sheet position: branch endpoint + clearance along tangent
        const clearance = layout.clearanceAlongBranch;  // 300m
        const sheetENU = {
            east: branchEndENU.east + (clearance * frame.T.east),
            north: branchEndENU.north + (clearance * frame.T.north),
            up: branchEndENU.up + (clearance * frame.T.up)
        };
        
        const sheetCenter = enuToWorld(enuFrame, sheetENU.east, sheetENU.north, sheetENU.up);
        
        // Sheet axes (CRITICAL FIX):
        // Sheet X-axis = N (branch normal, "up")
        // Sheet Y-axis = B (branch binormal, "right")
        // Sheet normal = -T (facing back down branch)
        
        const sheetXAxis = enuVecToWorldDir(enuFrame, frame.N);
        const sheetYAxis = enuVecToWorldDir(enuFrame, frame.B);
        const sheetNormal = enuVecToWorldDir(enuFrame, negateVec(frame.T));
        
        // Create four corners using N × B (NOT East × North)
        const halfWidth = layout.width / 2;
        const halfHeight = layout.height / 2;
        
        const corners = [
            // Bottom-left: -N, -B
            Cesium.Cartesian3.add(
                sheetCenter,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeight, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidth, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            ),
            // ... other three corners ...
        ];
        
        // ... render outline + primitive ...
        
        // Store sheet frame for cell positioning
        sheet._attachIndex = attachIndex;
        sheet._parentFrame = frame;
        sheet._center = sheetCenter;
        sheet._xAxis = sheetXAxis;  // N
        sheet._yAxis = sheetYAxis;  // B
        sheet._normal = sheetNormal;  // -T
        
    } catch (error) {
        RelayLog.error(`[FilamentRenderer] ❌ Failed to render sheet ${sheet.id}:`, error);
    }
}
```

---

### 6. Update Cell Positioning (NEXT)

**File**: `app/renderers/filament-renderer.js` → `renderCellGridENU()`

**Required changes**:

```javascript
renderCellGridENU(sheet, enuFrame, sheetENU, sheetXAxis, sheetYAxis) {
    const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
    const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
    const cellWidth = CANONICAL_LAYOUT.cell.width;
    const cellHeight = CANONICAL_LAYOUT.cell.height;
    
    const gridWidth = cols * cellWidth;
    const gridHeight = rows * cellHeight;
    
    const cellAnchors = [];
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Cell position in sheet-local coordinates
            const localX = (row / (rows - 1) - 0.5) * gridHeight;  // Along N (up)
            const localY = (col / (cols - 1) - 0.5) * gridWidth;   // Along B (right)
            
            // Convert to world using sheet axes (NOT ENU East×North)
            const cellPos = Cesium.Cartesian3.add(
                sheet._center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(sheetXAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, localY, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            );
            
            // Render cell point (entity)
            const entity = this.viewer.entities.add({
                position: cellPos,
                point: {
                    pixelSize: CANONICAL_LAYOUT.cell.pointSize,
                    color: Cesium.Color.CYAN.withAlpha(0.8),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                label: {
                    text: `${String.fromCharCode(65 + row)}${col + 1}`,
                    font: '12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -CANONICAL_LAYOUT.cell.labelOffset),
                    scale: CANONICAL_LAYOUT.cell.labelScale,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0,
                        CANONICAL_LAYOUT.cell.maxLabelDistance
                    )
                }
            });
            
            this.entities.push(entity);
            this.entityCount.cellPoints++;
            
            // Store cell anchor for filaments
            cellAnchors.push({
                cellId: `${sheet.id}.cell.${row}.${col}`,
                position: cellPos,
                sheetNormal: sheet._normal  // For filament direction
            });
        }
    }
    
    // Store cell anchors on sheet
    sheet._cellAnchors = cellAnchors;
    
    RelayLog.info(`[FilamentRenderer] 📊 Cell grid rendered: ${rows} rows × ${cols} cols`);
}
```

---

### 7. Add Topology Validation (NEXT)

**File**: `app/renderers/filament-renderer.js` → `validateTopology()`

**Add new method**:

```javascript
/**
 * Validate canonical topology (hard fail on violation)
 * Enforces Invariants A, B, C, D from RELAY-RENDER-CONTRACT.md
 */
validateTopology(tree) {
    const violations = [];
    
    const sheets = tree.nodes.filter(n => n.type === 'sheet');
    const branches = new Map(tree.nodes.filter(n => n.type === 'branch').map(b => [b.id, b]));
    
    // === Rule A: Sheet normal ⟂ branch tangent (±5°) ===
    for (const sheet of sheets) {
        const parent = branches.get(sheet.parent);
        if (!parent?._branchFrames || !sheet._normal || sheet._attachIndex === undefined) continue;
        
        const frame = parent._branchFrames[sheet._attachIndex];
        if (!frame?.T) continue;
        
        const tangentWorld = enuVecToWorldDir(parent._enuFrame, frame.T);
        const dot = Math.abs(Cesium.Cartesian3.dot(tangentWorld, sheet._normal));
        const angleDeg = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
        
        if (Math.abs(angleDeg - 90) > 5) {
            violations.push(`Sheet ${sheet.id}: normal not ⟂ branch tangent (angle=${angleDeg.toFixed(1)}°)`);
        }
    }
    
    // === Rule B: Filament endpoints must be cells, not sheets ===
    // (To be implemented when filament tracking is added)
    
    // === Rule C: No shared endpoints (hub regression) ===
    // (To be implemented when filament tracking is added)
    
    // === Rule D: Prevent "fan collapses to point" near sheet ===
    for (const sheet of sheets) {
        if (!sheet._cellAnchors || sheet._cellAnchors.length < 4) continue;
        
        const cellPositions = sheet._cellAnchors.map(c => c.position);
        
        // Compute centroid
        const centroid = new Cesium.Cartesian3(0, 0, 0);
        for (const p of cellPositions) {
            Cesium.Cartesian3.add(centroid, p, centroid);
        }
        Cesium.Cartesian3.multiplyByScalar(centroid, 1 / cellPositions.length, centroid);
        
        // Compute max distance from centroid
        let maxDist = 0;
        for (const p of cellPositions) {
            maxDist = Math.max(maxDist, Cesium.Cartesian3.distance(p, centroid));
        }
        
        // If all cell tips collapse into tiny radius, you've reintroduced a hub
        if (maxDist < 0.2) {  // 20cm threshold
            violations.push(`Sheet ${sheet.id}: cell tips clustered (maxDist=${maxDist.toFixed(3)}m)`);
        }
    }
    
    if (violations.length > 0) {
        RelayLog.error('[TOPOLOGY VIOLATION]', violations);
        throw new Error(`Canonical topology violated: ${violations[0]}`);
    }
    
    RelayLog.info('[TOPOLOGY] ✅ All canonical invariants satisfied');
}
```

**Call in `renderTree()`**:
```javascript
renderTree(tree) {
    // ... existing render logic ...
    
    // VALIDATE TOPOLOGY
    try {
        this.validateTopology(tree);
    } catch (error) {
        RelayLog.error('[TOPOLOGY] ❌ Validation failed:', error);
        // Continue rendering (fail-soft) but log violation
    }
}
```

---

## 🎯 Implementation Order

**DO THIS FIRST** (Step 5): Update `renderSheetPrimitive()` to orient sheets perpendicular to branch tangent  
**THEN** (Step 6): Update `renderCellGridENU()` to position cells in sheet frame  
**FINALLY** (Step 7): Add `validateTopology()` and call in `renderTree()`

---

## 📋 Verification Checklist

After implementing Steps 5-7, verify:

### Camera Test 1: Look down branch from trunk
- [ ] Sheet appears **face-on** (not edge-on)
- [ ] Can see cell grid clearly
- [ ] Filaments drop from cells (not from sheet center)

### Camera Test 2: Orbit around sheet
- [ ] Sheet **does not** rotate to face camera
- [ ] Sheet remains perpendicular to branch
- [ ] Cell positions remain fixed in sheet frame

### Camera Test 3: Console log check
- [ ] No topology violations logged
- [ ] Sheet normal angle = ~90° to branch tangent
- [ ] Cell tip max distance > 0.2m (no clustering)

### Camera Test 4: Hard refresh + press "1" key
- [ ] Top-down view shows sheets face-on
- [ ] Branches visible extending horizontally
- [ ] Cells clearly visible in grid pattern

---

## 🔒 What "Correct" Looks Like

**Standing at trunk, looking down a branch**:
- ✅ See spreadsheet **face-on** (like reading a document)
- ✅ Cells arranged in clear grid
- ✅ Filaments dropping from each cell
- ✅ No "glowing slab" or edge-only view

**If you see**:
- ❌ Sheet edge-only → Invariant A violated (still horizontal)
- ❌ Sheet rotates with camera → Invariant A violated (billboarded)
- ❌ Cells missing or implicit → Cells not geometry
- ❌ Single hose per sheet → Invariant B violated

---

## 📚 Documentation

**Created**:
- `RELAY-RENDER-CONTRACT.md` - One-page canonical specification
- `CANONICAL-SHEET-ORIENTATION-FIX.md` - This implementation guide

**Updated**:
- `app/utils/enu-coordinates.js` - Added frame computation functions
- `app/renderers/filament-renderer.js` - Partial (branch frames computed)

**Next to update**:
- `app/renderers/filament-renderer.js` - Complete sheet orientation fix (Steps 5-7)

---

**Status**: Ready for Steps 5-7 implementation  
**Blocker**: None  
**Next Action**: Implement `renderSheetPrimitive()` sheet orientation fix

---

**This fix enforces the difference between a diagram and a world.**
