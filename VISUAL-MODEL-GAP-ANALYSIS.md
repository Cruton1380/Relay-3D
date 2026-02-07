# Visual Model Gap Analysis

**Date**: 2026-02-06  
**Issue**: Current Cesium implementation missing core visual model from Three.js prototype  
**User Feedback**: "I do not see timeboxes, spreadsheets, or any other markers"

---

## 🎯 The Problem

### What User Expected (from Three.js prototype)
A rich data visualization showing:
- **Spreadsheet planes** with visible cell grids
- **Timebox rings** showing commit history along trunks
- **Cell-level detail** with individual cells visible
- **Hierarchical filament bundling** (cells → rows → spine → branch)
- **Metadata visualization** (ERI colors, commit counts, scars, drifts)

### What Current Cesium Shows
Minimal geometry:
- Simple trunk lines (vertical polylines)
- Simple branch lines (arcs to coordinates)
- Simple filament lines (straight connections)
- **NO spreadsheet planes**
- **NO timebox rings**
- **NO cell grids**
- **NO visible data**

---

## 📊 Visual Model from Three.js Prototype

### 1. Spreadsheet/Sheet Visualization

**Components**:
```
Sheet Structure:
┌─────────────────────────────────┐
│  Sheet Box (translucent box)    │ ← Outer shell
│  ┌──┬──┬──┬──┬──┐              │
│  │A1│B1│C1│D1│E1│              │ ← Cell grid (visible cells)
│  ├──┼──┼──┼──┼──┤              │
│  │A2│B2│C2│D2│E2│              │
│  ├──┼──┼──┼──┼──┤              │
│  │A3│B3│C3│D3│E3│              │
│  └──┴──┴──┴──┴──┘              │
│    ↓  ↓  ↓  ↓  ↓                │
│    └──┴──┴──┴──┘                │ ← Row bundles
│         ↓                        │
│      Spine (collector)           │ ← Sheet spine
└──────────────────────────────────┘
         ↓
    To Branch (parent)
```

**From Three.js code** (`filament-spreadsheet-prototype.html`):

1. **Sheet Box** (BoxGeometry):
   - Width: `branchSize * 2.8`
   - Height: `branchSize * 2.2`
   - Depth: `branchSize * 0.3`
   - Material: Translucent, ERI-colored, emissive
   - Opacity: 0.20
   - Double-sided

2. **Cell Grid** (individual BoxGeometry per cell):
   - Up to 20 rows × 16 columns
   - Cell size: `branchSize * 0.08` (~0.088)
   - Positioned within sheet box
   - Color-coded by cell state/ERI
   - Each cell has a reference ID (e.g., "A1", "B2")

3. **Filament Hierarchy**:
   - **Stage 1**: Cell → Row Bundle (thin, short)
   - **Stage 2**: Row Bundle → Sheet Spine (medium thickness)
   - **Stage 3**: Sheet Spine → Parent Branch (thick conduit)

4. **Sheet Orientation**:
   - Rotated perpendicular to flow direction
   - Flow = from sheet toward parent (root)
   - Sheet normal ∥ flow direction

### 2. Timebox/Pressure Ring Visualization

**Structure**:
```
Trunk with Timeboxes:

    ╔═════════════════╗ ← Trunk top
    ║                 ║
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Timebox (e.g., 2026-02-W1)
    ║                 ║     - Color: cyan/blue/dim
    ║                 ║     - Thickness: based on commit count
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Timebox (e.g., 2026-02-W2)
    ║                 ║     - Shows scars (red tint if refusals)
    ║                 ║     - Shows drifts (orange if open drifts)
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Timebox (e.g., 2026-02-W3)
    ║                 ║
    ╚═════════════════╝ ← Trunk base (ground)
```

**From Three.js code**:

1. **Timebox Generation** (`generateTimeboxesFromCommits`):
   - Data-driven: Generated from actual commits
   - Bucketed by time period (default: 5 buckets per segment)
   - Each timebox has:
     - `timeboxId` (e.g., "2026-02-W1")
     - `commitCount` (45, 38, 52, etc.)
     - `openDrifts` (0, 1, 2, 3, etc.)
     - `eriAvg` (82, 88, 76, etc.)
     - `scarCount` (refusals)

2. **Timebox Geometry** (TorusGeometry):
   - Radius: 75% of trunk radius (embedded within trunk)
   - Thickness: Base 0.12 + (commitCount/100 * 0.08)
   - Positioned along trunk at intervals
   - Material: Emissive, color-coded

3. **Timebox Color Coding**:
   - **Bright cyan** (0x00FFEE): High confidence (75%+)
   - **Medium blue** (0x0088FF): Medium confidence (50-75%)
   - **Dim blue** (0x5566CC): Low confidence (<50%)
   - **Red tint**: If scars present (refusals)
   - **Orange tint**: If open drifts

### 3. Current Cesium Implementation

**What we have now** (`app/renderers/filament-renderer.js`):

```javascript
renderTrunk(trunk) {
    // Just a simple vertical line
    const basePos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
    const topPos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, height);
    this.viewer.entities.add({
        polyline: { positions: [basePos, topPos], width: 8 }
    });
}

renderSheet(sheet) {
    // NO sheet visualization - just a small point
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    this.viewer.entities.add({
        point: { pixelSize: 8, color: Cesium.Color.YELLOW }
    });
}

renderFilament(edge) {
    // Simple straight line between nodes
    const start = Cesium.Cartesian3.fromDegrees(...);
    const end = Cesium.Cartesian3.fromDegrees(...);
    this.viewer.entities.add({
        polyline: { positions: [start, end], width: 2 }
    });
}

// NO timebox rendering at all
// NO cell grid rendering
// NO metadata visualization
```

---

## 🔧 What Needs to Be Implemented

### Priority 1: Spreadsheet Planes (CRITICAL for Phase 3)

**Goal**: Visible sheet planes with cell grids

**Cesium Implementation**:
```javascript
renderSheet(sheet) {
    // 1. Create sheet plane using Cesium.PlaneGeometry or Cesium.RectangleGeometry
    // 2. Orient perpendicular to branch direction (ENU frame)
    // 3. Add cell grid markers (points or small boxes)
    // 4. Create hierarchical filament bundles:
    //    - Cell → Row Bundle
    //    - Row Bundle → Sheet Spine
    //    - Sheet Spine → Branch
}
```

**Required for**:
- Phase 3: Timebox Segmentation (needs cell-level anchors)
- Excel import visualization (cells must be visible)
- User understanding ("where is my data?")

### Priority 2: Timebox Rings (REQUIRED for Phase 3)

**Goal**: Visible timebox markers along trunks showing commit history

**Cesium Implementation**:
```javascript
renderTimeboxes(trunk, commits) {
    // 1. Generate timeboxes from commit data
    // 2. Create ring/disc geometry along trunk
    // 3. Color-code by confidence/state
    // 4. Size by commit count
    // 5. Show metadata (on hover or always)
}
```

**Required for**:
- Phase 3: Timebox Segmentation (core requirement)
- Commit history visualization
- Governance verification (scars, drifts visible)

### Priority 3: Cell-Level Detail

**Goal**: Individual cells visible within sheets

**Cesium Implementation**:
```javascript
renderCellGrid(sheet, data) {
    // 1. Create cell positions within sheet bounds
    // 2. Render cell markers (points or small boxes)
    // 3. Store cell anchors globally (for filament endpoints)
    // 4. Color-code by cell state/ERI
}
```

**Required for**:
- Cell-level commits (Phase 3)
- Click-to-select cells
- Fine-grained visualization

### Priority 4: Hierarchical Filament Bundling

**Goal**: Show data flow hierarchy (cells → rows → spine → branch)

**Cesium Implementation**:
```javascript
renderHierarchicalFilaments(sheet) {
    // 1. Cell → Row Bundle (thin lines)
    // 2. Row Bundle → Spine (medium lines)
    // 3. Spine → Branch (thick line)
    // 4. LOD-based visibility (show detail at close range)
}
```

**Required for**:
- Visual clarity at scale
- Understanding data aggregation
- LOD transitions

---

## 📋 Implementation Plan

### Step 1: Add Sheet Plane Rendering ✅ URGENT

**File**: `app/renderers/filament-renderer.js`

**Add method**:
```javascript
renderSheetPlane(sheet) {
    // Create local ENU frame at sheet position
    const sheetPos = Cesium.Cartesian3.fromDegrees(sheet.lon, sheet.lat, sheet.alt);
    const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(sheetPos);
    
    // Sheet dimensions (proportional to branch size)
    const branchSize = 1.1; // TODO: Get from parent branch
    const sheetWidth = branchSize * 2.8;
    const sheetHeight = branchSize * 2.2;
    const sheetDepth = branchSize * 0.3;
    
    // Create sheet plane geometry
    const sheetPlane = new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(
            sheet.lon - 0.01, sheet.lat - 0.01,
            sheet.lon + 0.01, sheet.lat + 0.01
        ),
        height: sheet.alt,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    });
    
    // Create geometry instance with ERI-based color
    const eriColor = getERIColor(sheet.eri); // TODO: Implement
    const geometryInstance = new Cesium.GeometryInstance({
        geometry: sheetPlane,
        modelMatrix: enuFrame,
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                eriColor.withAlpha(0.2) // Translucent
            )
        },
        id: sheet.id
    });
    
    // Add to scene as primitive
    const primitive = new Cesium.Primitive({
        geometryInstances: geometryInstance,
        appearance: new Cesium.PerInstanceColorAppearance({
            translucent: true,
            closed: false
        })
    });
    
    this.viewer.scene.primitives.add(primitive);
    this.primitives.push(primitive);
    
    // Add sheet frame (edges)
    this.renderSheetFrame(sheet, enuFrame);
    
    // Add cell grid
    this.renderCellGrid(sheet, enuFrame);
}
```

### Step 2: Add Cell Grid Rendering

**Add method**:
```javascript
renderCellGrid(sheet, enuFrame) {
    // Get data dimensions
    const rows = Math.min(sheet.rows || 8, 20);
    const cols = Math.min(sheet.cols || 6, 16);
    
    // Cell size and spacing
    const branchSize = 1.1;
    const cellSize = branchSize * 0.08;
    const sheetWidth = branchSize * 2.8;
    const sheetHeight = branchSize * 2.2;
    
    // Calculate cell positions
    const cellStepX = sheetWidth / (cols + 1);
    const cellStepY = sheetHeight / (rows + 1);
    const startX = -sheetWidth / 2 + cellStepX;
    const startY = sheetHeight / 2 - cellStepY;
    
    // Store cell anchors for filament endpoints
    if (!window.cellAnchors) window.cellAnchors = {};
    window.cellAnchors[sheet.id] = {};
    
    // Render each cell
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cellX = startX + col * cellStepX;
            const cellY = startY - row * cellStepY;
            const cellZ = 0; // On sheet plane
            
            // Cell reference (e.g., "A1", "B2")
            const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
            
            // Cell position in world space
            const localPos = new Cesium.Cartesian3(cellX, cellY, cellZ);
            const worldPos = Cesium.Matrix4.multiplyByPoint(enuFrame, localPos, new Cesium.Cartesian3());
            
            // Render cell marker (point)
            const cellEntity = this.viewer.entities.add({
                position: worldPos,
                point: {
                    pixelSize: 3,
                    color: getCellColor(sheet, row, col), // TODO: Implement
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                properties: {
                    type: 'cell',
                    sheetId: sheet.id,
                    cellRef: cellRef,
                    row: row,
                    col: col
                }
            });
            
            // Store cell anchor
            window.cellAnchors[sheet.id][cellRef] = cellEntity;
        }
    }
}
```

### Step 3: Add Timebox Ring Rendering

**Add method**:
```javascript
renderTimeboxes(trunk, commits) {
    // Generate timeboxes from commits
    const timeboxes = this.generateTimeboxesFromCommits(commits);
    
    if (timeboxes.length === 0) {
        console.log('[FilamentRenderer] No timeboxes generated (no commits)');
        return;
    }
    
    // Trunk dimensions
    const trunkRadius = 0.5; // TODO: Make dynamic
    const trunkHeight = trunk.height || 2000;
    
    // Render each timebox as a ring/disc along trunk
    timeboxes.forEach((timebox, index) => {
        // Position along trunk (evenly spaced)
        const t = (index + 1) / (timeboxes.length + 1);
        const timeboxHeight = trunk.alt + (trunkHeight * t);
        
        // Timebox radius (embedded within trunk)
        const timeboxRadius = trunkRadius * 0.75;
        
        // Timebox thickness (based on commit count)
        const baseThickness = 0.12;
        const thickness = baseThickness + (timebox.commitCount / 100) * 0.08;
        
        // Color based on confidence
        const color = this.getTimeboxColor(timebox);
        
        // Create timebox geometry (disc or cylinder)
        const timeboxPos = Cesium.Cartesian3.fromDegrees(
            trunk.lon, trunk.lat, timeboxHeight
        );
        
        // Create cylinder for timebox (approximates torus)
        const cylinderGeometry = new Cesium.CylinderGeometry({
            length: thickness,
            topRadius: timeboxRadius,
            bottomRadius: timeboxRadius,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });
        
        // ENU frame at timebox position
        const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(timeboxPos);
        
        // Rotate to be horizontal (perpendicular to trunk)
        const rotationMatrix = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(90));
        const rotatedFrame = Cesium.Matrix4.multiplyByMatrix3(
            enuFrame, rotationMatrix, new Cesium.Matrix4()
        );
        
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: cylinderGeometry,
            modelMatrix: rotatedFrame,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            },
            id: `timebox-${trunk.id}-${timebox.timeboxId}`
        });
        
        const primitive = new Cesium.Primitive({
            geometryInstances: geometryInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: true,
                closed: true
            })
        });
        
        this.viewer.scene.primitives.add(primitive);
        this.primitives.push(primitive);
    });
}

generateTimeboxesFromCommits(commits) {
    // Port logic from Three.js prototype
    if (!commits || commits.length === 0) return [];
    
    // Sort commits by timestamp
    const sortedCommits = commits.sort((a, b) => a.timestamp - b.timestamp);
    
    // Bucket commits into timeboxes (e.g., weekly)
    const bucketsPerSegment = 5;
    const commitsPerBox = Math.ceil(sortedCommits.length / bucketsPerSegment);
    
    const timeboxes = [];
    for (let i = 0; i < sortedCommits.length; i += commitsPerBox) {
        const boxCommits = sortedCommits.slice(i, i + commitsPerBox);
        
        timeboxes.push({
            timeboxId: `T${i}-${i + commitsPerBox}`,
            commitCount: boxCommits.length,
            openDrifts: boxCommits.filter(c => c.drift).length,
            eriAvg: boxCommits.reduce((sum, c) => sum + (c.eri || 80), 0) / boxCommits.length,
            scarCount: boxCommits.filter(c => c.refusal).length,
            startTime: boxCommits[0].timestamp,
            endTime: boxCommits[boxCommits.length - 1].timestamp
        });
    }
    
    return timeboxes;
}

getTimeboxColor(timebox) {
    const confidence = timebox.eriAvg;
    let baseColor;
    
    if (confidence >= 75) {
        baseColor = Cesium.Color.fromCssColorString('#00FFEE'); // Bright cyan
    } else if (confidence >= 50) {
        baseColor = Cesium.Color.fromCssColorString('#0088FF'); // Medium blue
    } else {
        baseColor = Cesium.Color.fromCssColorString('#5566CC'); // Dim blue
    }
    
    // Add red tint if scars present
    if (timebox.scarCount > 0) {
        baseColor = Cesium.Color.lerp(
            baseColor,
            Cesium.Color.RED,
            timebox.scarCount / 10,
            new Cesium.Color()
        );
    }
    
    // Add orange tint if drifts present
    if (timebox.openDrifts > 0) {
        baseColor = Cesium.Color.lerp(
            baseColor,
            Cesium.Color.ORANGE,
            timebox.openDrifts / 10,
            new Cesium.Color()
        );
    }
    
    return baseColor.withAlpha(0.6); // Semi-transparent
}
```

### Step 4: Update renderTree() to Use New Methods

**Modify**:
```javascript
renderTree() {
    this.clear();
    
    const { nodes, edges } = relayState.tree;
    
    nodes.forEach(node => {
        if (node.type === 'trunk') {
            this.renderTrunk(node);
            // NEW: Render timeboxes if commit data available
            if (node.commits && node.commits.length > 0) {
                this.renderTimeboxes(node, node.commits);
            }
        } else if (node.type === 'branch') {
            this.renderBranch(node);
        } else if (node.type === 'sheet') {
            // NEW: Render full sheet plane with cell grid
            this.renderSheetPlane(node);
        }
    });
    
    // Render filaments (edges)
    edges.forEach(edge => {
        this.renderFilament(edge);
    });
}
```

---

## 🎯 Expected Visual Result

### After Implementation:

**What user should see**:
1. **Trunk**: Vertical pillar with visible timebox rings embedded
   - Each ring shows a time period (week/month)
   - Color indicates state (cyan = good, blue = ok, dim = issues)
   - Thickness indicates activity level

2. **Branches**: Arcs connecting trunk to sheets
   - Proper curvature (not straight through Earth)

3. **Sheets**: Visible rectangular planes at branch endpoints
   - Translucent box showing sheet bounds
   - Grid of cells visible within (up to 20×16)
   - Each cell is a point or small box
   - Color-coded by cell state

4. **Filaments**: Hierarchical connections
   - Cells → Row bundles (thin)
   - Row bundles → Sheet spine (medium)
   - Sheet spine → Branch (thick)
   - Not all visible at once (LOD-based)

5. **On Excel Import**:
   - Spreadsheet data maps to cell grid
   - Timeboxes populate from commit metadata
   - User can see "where is my data" immediately

---

## 🚨 Current Blocker

**Phase 2.1** (primitives migration) is useful but **NOT** the critical path.

**Critical path**: Implement spreadsheet planes + timeboxes **NOW** because:
- Phase 3 (Timebox Segmentation) **requires** these visual elements
- Excel import is meaningless without visible sheets
- User cannot verify data without visual model

**Recommendation**: 
1. Implement sheet planes + cell grids (Priority 1)
2. Implement timebox rings (Priority 2)
3. Test with demo tree + Excel import
4. THEN do Phase 2.1 (primitives migration) as optimization

---

## 📋 Next Actions

### Immediate (This Session):
1. Implement `renderSheetPlane()` in FilamentRenderer
2. Implement `renderCellGrid()` in FilamentRenderer
3. Implement `renderTimeboxes()` in FilamentRenderer
4. Update demo tree to include commit data
5. Test visual output

### After Visual Model Working:
6. Implement hierarchical filament bundling
7. Add LOD visibility controls
8. Phase 2.1: Primitives migration (optimization)
9. Phase 3: Timebox segmentation (now possible with visual model)

---

**Status**: Visual model gap identified. Implementation plan ready. Awaiting user approval to proceed with sheet planes + timeboxes.
