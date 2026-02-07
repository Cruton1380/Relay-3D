# Phase 2A Implementation Plan: Cell-Level Filaments

**Priority:** CRITICAL (Blocks 7 of 9 remaining gaps)  
**Status:** Ready to implement  
**Target:** Transform one branch from "single tube" to "braided cable"

---

## The Core Problem

**Current State:**
```
Branch = [smooth tube connecting nodes]
```

**Canonical State:**
```
Branch = [
  Cell A1 filament (thin)
  Cell B1 filament (thin)
  Formula C1=A1+B1 (bundled from A1, B1)
  Formula D1=C1*2 (bundled from C1)
  ...all visible inside branch
]
```

**Why This Matters:**
Without this, users can't see **what causes what** or **what's shared**.

---

## Implementation Strategy

### Step 1: Choose One Branch for Prototype
**Target:** First sheet branch (simplest case)

**Why:** 
- Has clear cell structure
- Has formula dependencies
- Already has sheet rendering working

**Input Data:**
- Excel file with formulas (e.g., Northwind Tools sample)
- Existing `buildDependencyGraphFromCommits()` output

---

### Step 2: Extract Cell-Level Commit Graph

**New Function:** `extractCellFilaments(sheetData, formulaGraph)`

**Input:**
```javascript
{
  sheetData: [
    { cell: "A1", value: 100, formula: null, commitIndex: 1 },
    { cell: "B1", value: 200, formula: null, commitIndex: 2 },
    { cell: "C1", value: 300, formula: "=A1+B1", commitIndex: 3, deps: ["A1", "B1"] }
  ],
  formulaGraph: {
    nodes: ["A1", "B1", "C1"],
    edges: [
      { from: "A1", to: "C1" },
      { from: "B1", to: "C1" }
    ]
  }
}
```

**Output:**
```javascript
{
  filaments: [
    {
      id: "filament_A1",
      type: "INPUT",
      cells: ["A1"],
      thickness: 0.02,  // Thin (not reused)
      path: [startPos, endPos],
      color: 0x88CC77,  // Green (healthy input)
      dependents: ["C1"]
    },
    {
      id: "filament_A1_B1_to_C1",
      type: "BUNDLE",
      cells: ["A1", "B1"],
      thickness: 0.04,  // Thicker (bundle of 2)
      path: [convergencePos, C1Pos],
      color: 0xCCAA66,  // Amber (bundled)
      formula: "C1"
    }
  ],
  convergencePoints: [
    {
      id: "conv_C1",
      position: [x, y, z],
      inputFilaments: ["filament_A1", "filament_B1"],
      outputFilament: "filament_A1_B1_to_C1"
    }
  ]
}
```

**Code Skeleton:**
```javascript
function extractCellFilaments(sheetData, formulaGraph) {
    const filaments = [];
    const convergencePoints = [];
    
    // 1. Create input filaments (cells with no dependencies)
    sheetData.forEach(cell => {
        if (!cell.formula) {
            filaments.push({
                id: `filament_${cell.cell}`,
                type: "INPUT",
                cells: [cell.cell],
                thickness: 0.02,
                path: calculatePath(cell),
                color: 0x88CC77,
                dependents: findDependents(cell.cell, formulaGraph)
            });
        }
    });
    
    // 2. Create bundles where formulas converge inputs
    formulaGraph.edges.forEach(edge => {
        const bundle = createBundle(edge.from, edge.to);
        filaments.push(bundle);
    });
    
    // 3. Identify convergence points (where bundles merge)
    identifyConvergencePoints(filaments, convergencePoints);
    
    return { filaments, convergencePoints };
}
```

---

### Step 3: Render Internal Filaments

**New Function:** `renderInternalFilaments(branchNode, filamentData)`

**Visual Rules:**
1. **Input Filaments** (thin, straight)
   - Thickness: 0.01-0.02
   - Color: Green (healthy) / Amber (caution) / Brown (stale)
   - Start: Cell position in sheet
   - End: Branch spine

2. **Bundled Filaments** (thicker, converging)
   - Thickness: 0.02 × number of inputs
   - Color: Amber (multiple sources)
   - Start: Convergence point
   - End: Downstream cell or branch spine

3. **Convergence Points** (small spheres)
   - Geometry: `SphereGeometry(0.05)`
   - Color: Golden (active) / Gray (stale)
   - Position: Where multiple filaments merge

**Code Skeleton:**
```javascript
function renderInternalFilaments(branchNode, filamentData, scene) {
    const filamentGroup = new THREE.Group();
    
    // Render each filament as thin tube
    filamentData.filaments.forEach(fil => {
        const curve = new THREE.CatmullRomCurve3(fil.path);
        const tubeGeom = new THREE.TubeGeometry(
            curve,
            16,                // segments
            fil.thickness,     // radius (data-driven)
            8,                 // radial segments
            false
        );
        
        const tubeMat = new THREE.MeshStandardMaterial({
            color: fil.color,
            opacity: 0.6,
            transparent: true,
            roughness: 0.7,
            metalness: 0.0
        });
        
        const filament = new THREE.Mesh(tubeGeom, tubeMat);
        filament.userData = {
            type: 'internalFilament',
            cells: fil.cells,
            formula: fil.formula
        };
        
        filamentGroup.add(filament);
    });
    
    // Render convergence points
    filamentData.convergencePoints.forEach(conv => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 16, 12),
            new THREE.MeshStandardMaterial({
                color: 0xD4A574,  // Golden
                emissive: 0xD4A574,
                emissiveIntensity: 0.3
            })
        );
        sphere.position.set(...conv.position);
        sphere.userData = {
            type: 'convergence',
            inputs: conv.inputFilaments,
            output: conv.outputFilament
        };
        filamentGroup.add(sphere);
    });
    
    scene.add(filamentGroup);
    return filamentGroup;
}
```

---

### Step 4: Calculate Filament Paths

**Function:** `calculateFilamentPath(startCell, endCell, branchGeometry)`

**Rules:**
1. Start: Cell position in sheet (already have from sheet rendering)
2. End: Either convergence point OR branch spine
3. Path: Smooth curve that stays inside branch volume

**Path Types:**

#### Type A: Cell → Convergence Point
```javascript
// Straight line from cell to local convergence
const start = getCellPosition(startCell);
const end = convergencePoint.position;
return [start, end];
```

#### Type B: Convergence → Branch Spine
```javascript
// Curved path following branch interior
const start = convergencePoint.position;
const end = getBranchSpinePosition(branchNode);
const mid = interpolate(start, end, 0.5);
mid.x += (Math.random() - 0.5) * 0.2;  // Slight organic variation
return [start, mid, end];
```

#### Type C: Cell → Branch Spine (no convergence)
```javascript
// Direct path for cells with no downstream formulas
const start = getCellPosition(cell);
const end = getBranchSpinePosition(branchNode);
return [start, end];
```

---

### Step 5: Thickness Calculation (Data-Driven)

**Function:** `calculateFilamentThickness(filament, dependencyGraph)`

**Rules:**
```javascript
function calculateFilamentThickness(filament, graph) {
    const baseThickness = 0.01;
    
    // Count how many cells depend on this filament
    const dependentCount = countDependents(filament.cells, graph);
    
    // Count how many inputs contribute to this filament
    const inputCount = filament.cells.length;
    
    // Thickness grows with both inputs and dependents
    const thicknessFactor = 1 + (inputCount * 0.3) + (dependentCount * 0.5);
    
    return baseThickness * thicknessFactor;
}
```

**Result:**
- Input cell (no deps): 0.01
- Cell with 2 dependents: 0.02
- Bundle of 3 inputs: 0.03
- Bundle feeding 5 downstream: 0.05

**Visual Effect:** Most-shared dependencies are visibly thickest

---

### Step 6: Integration with Existing Branch Rendering

**Modify:** `renderTreeScaffold()` function

**Changes:**
```javascript
// After rendering branch tube geometry...
if (node.type === 'sheet' && node.sheetData) {
    // Existing: Render sheet surface
    renderSheetSurface(node, sheetGroup);
    
    // NEW: Render internal filaments
    const formulaGraph = state.sheets[node.sheetId]?.formulaGraph;
    if (formulaGraph) {
        const filamentData = extractCellFilaments(node.sheetData, formulaGraph);
        renderInternalFilaments(node, filamentData, scene);
    }
}
```

---

### Step 7: Visual Controls (Toggle Internal View)

**New Keyboard Binding:** `I` key = toggle internal filaments

**States:**
1. **External View** (default)
   - Branch shows as solid bark tube
   - Internal filaments hidden

2. **Cutaway View** (`I` pressed)
   - Branch becomes semi-transparent
   - Internal filaments fully visible
   - Convergence points highlighted

3. **X-Ray View** (`I` pressed twice)
   - Branch completely transparent
   - Only filaments visible
   - Like looking at wire frame

**Code:**
```javascript
let internalViewMode = 'EXTERNAL';  // 'EXTERNAL' | 'CUTAWAY' | 'XRAY'

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyI') {
        // Cycle through view modes
        if (internalViewMode === 'EXTERNAL') {
            internalViewMode = 'CUTAWAY';
            setBranchOpacity(0.3);
            setFilamentOpacity(1.0);
        } else if (internalViewMode === 'CUTAWAY') {
            internalViewMode = 'XRAY';
            setBranchOpacity(0.0);
            setFilamentOpacity(1.0);
        } else {
            internalViewMode = 'EXTERNAL';
            setBranchOpacity(1.0);
            setFilamentOpacity(0.0);
        }
        
        console.log(`[Relay] Internal view: ${internalViewMode}`);
        relayUI.log(`Internal view: ${internalViewMode}`, "info");
    }
});
```

---

## Testing Plan

### Test 1: Single Cell Path
**Input:** One cell (A1) with no formula
**Expected:** One thin green filament from A1 → branch spine

### Test 2: Simple Formula
**Input:** A1=100, B1=200, C1=A1+B1
**Expected:** 
- Two thin green filaments: A1 → convergence, B1 → convergence
- One convergence point (golden sphere)
- One thicker amber filament: convergence → C1 → branch spine

### Test 3: Chain of Formulas
**Input:** A1=100, B1=A1*2, C1=B1+50, D1=C1/2
**Expected:**
- Progressive bundling (each step thicker)
- Multiple convergence points
- Thickest filament at end (most downstream dependents)

### Test 4: Diamond Pattern
**Input:** 
```
A1=100
B1=A1*2
C1=A1+50
D1=B1+C1
```
**Expected:**
- A1 splits into two filaments (to B1 and C1)
- B1 and C1 converge into D1
- Diamond shape visible in internal view

---

## Success Criteria

### Visual:
- [ ] Can toggle internal filaments on/off
- [ ] Filaments are smooth curves (not jagged)
- [ ] Thickness visibly varies by dependency count
- [ ] Convergence points are obvious (golden spheres)
- [ ] Branch looks like "braided cable" in X-ray view

### Functional:
- [ ] Hover over filament → shows cell IDs in HUD
- [ ] Hover over convergence → shows formula
- [ ] Click filament → highlights all dependent cells
- [ ] Performance: 60fps with 100+ filaments

### Semantic:
- [ ] User says: "Now I can see what causes what"
- [ ] User can trace dependency chain visually
- [ ] Shared dependencies are obviously thicker
- [ ] Input cells vs formulas are clearly different

---

## Implementation Timeline

**Phase 2A.1:** Data extraction (1-2 hours)
- Implement `extractCellFilaments()`
- Test with sample Excel file
- Verify filament data structure

**Phase 2A.2:** Path calculation (1-2 hours)
- Implement `calculateFilamentPath()`
- Test different path types
- Verify smooth curves

**Phase 2A.3:** Rendering (2-3 hours)
- Implement `renderInternalFilaments()`
- Add materials and lighting
- Test visual appearance

**Phase 2A.4:** Integration (1 hour)
- Hook into `renderTreeScaffold()`
- Add view toggle controls
- Test with full system

**Phase 2A.5:** Polish (1-2 hours)
- Hover interactions
- Click handlers
- Performance optimization

**Total:** 6-10 hours for complete implementation

---

## Next Steps After 2A

### Phase 2B: Timebox Segmentation
- Make timeboxes cut through internal filaments
- Show which filaments entered in which timebox
- Add temporal depth visualization

### Phase 2C: Pressure on Filaments
- High-pressure filaments glow red/orange
- Swelling affects individual filaments (not just branch)
- Blocked filaments show refusal markers

### Phase 2D: Confidence on Filaments
- Low-confidence filaments are ghosted/dashed
- Missing input filaments show as broken/incomplete
- Confidence overlays on convergence points

---

## Risk Mitigation

### Risk 1: Performance with 1000+ Filaments
**Mitigation:** 
- Level-of-detail (LOD) rendering
- Only show filaments in camera frustum
- Merge distant filaments into single tubes

### Risk 2: Visual Clutter
**Mitigation:**
- Default to EXTERNAL view (filaments hidden)
- Cutaway only when user requests (`I` key)
- Filter by pressure/confidence threshold

### Risk 3: Path Calculation Complexity
**Mitigation:**
- Start with simple straight lines
- Add curves only after basic version works
- Use Three.js built-in curve helpers

---

## Completion Signature

**Phase:** 2A - Cell-Level Filaments  
**Priority:** CRITICAL  
**Estimated Time:** 6-10 hours  
**Blockers Removed:** 7 of 9 remaining gaps  
**Result:** Transform from diagram → instrument

**Ready to implement:** ✅ YES

---

**Once this works for one branch, the entire model will "click."**
