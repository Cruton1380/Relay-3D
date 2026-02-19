# Relay Sheet + Filament Render Contract (v1)

**Version**: 1.0.0  
**Date**: 2026-02-06  
**Status**: CANONICAL - Do not violate

> **Authority scope**: This document defines rendering invariants only. Execution order is governed exclusively by §27 of `docs/architecture/RELAY-MASTER-BUILD-PLAN.md`. Any "implementation order" language in this file is contract-scoped sequencing for implementing these specific invariants, not a build plan.

---

## 🔒 Canonical Invariants (Non-Negotiable)

### Invariant A — Sheets are surfaces, not observers

**Rule**: A sheet must never orient itself to the camera.

**Orientation is determined only by its parent branch.**

❌ **FORBIDDEN**:
- `lookAt(camera)`
- Billboard behavior
- World-axis alignment (e.g., always horizontal)

✅ **REQUIRED**:
- Sheet normal = **−T** where **T** is branch tangent at attachment point
- Sheet axes derived from branch frame **{T, N, B}**

---

### Invariant B — Cells are the only legal filament origins

**Rule**: A filament may originate only at a cell tip anchor.

❌ **FORBIDDEN**:
- Filament endpoint = sheet object
- Filament endpoint = branch object
- Filament endpoint = spine object (top only; bottom of Stage 1 is spine)

✅ **REQUIRED**:
- Every filament top anchor = `cellTipAnchor` (explicit geometry point)
- Each cell creates exactly **one** `cellTipAnchor`

---

### Invariant C — Bundling happens along length, not at a point

**Rule**: Many filaments visually converge by tapering and proximity, not by snapping to a shared hub node.

❌ **FORBIDDEN**:
- Multiple filaments sharing same endpoint (within ε = 1cm)
- Zero-distance convergence (fan collapses to single point)
- Shared geometry node where N filaments meet

✅ **REQUIRED**:
- Bundling via gradual taper (width decreases)
- Bundling via reduced spacing (filaments get closer)
- Bundling via parallel curves (shared direction)

**Lint check**: No two filament endpoints closer than **ε = 0.01m** (1cm)

---

## 📐 Sheet Placement & Orientation

### 1. Sheet Attachment

**Sheet center** is attached to a branch at a specific parameter/index along the branch curve.

```javascript
sheet._attachIndex = branchFrames.length - 1;  // At branch endpoint (can vary)
sheet._parentFrame = branchFrames[sheet._attachIndex];
```

**Sheet position** = branch point + clearance along branch tangent:

```javascript
const sheetENU = {
    east: branchPointENU.east + (clearance * frame.T.east),
    north: branchPointENU.north + (clearance * frame.T.north),
    up: branchPointENU.up + (clearance * frame.T.up)
};
```

---

### 2. Sheet Orientation (Non-Negotiable)

**Sheet normal** = **−T** where **T** is branch tangent at attachment point.

**Sheet axes**:
- **Sheet X-axis** = **N** (branch "up" / normal)
- **Sheet Y-axis** = **B** (branch "right" / binormal)
- **Sheet Z-axis** (normal) = **−T** (facing back down branch)

**Visual result**: When you look down a branch (along +T), you see the sheet **face-on**, not edge-on.

**Coordinate frame**:
```
      +N (up)
       │
       │
       └─── +B (right)
      /
     / −T (normal, toward camera looking down branch)
```

**Implementation**:
```javascript
// In ENU space (meters)
const sheetXAxis = frame.N;  // { east, north, up }
const sheetYAxis = frame.B;  // { east, north, up }
const sheetNormal = negateVec(frame.T);  // −T

// Convert to world space for Cesium
const sheetXWorld = enuVecToWorldDir(enuFrame, sheetXAxis);
const sheetYWorld = enuVecToWorldDir(enuFrame, sheetYAxis);
const sheetNormalWorld = enuVecToWorldDir(enuFrame, sheetNormal);
```

**Lint check**: `|dot(sheetNormal, branchTangent)| < cos(5°)` → FAIL (not parallel)

**Explanation**: Sheet normal = −T means sheet **plane** is perpendicular to branch. For validation, we check that sheet normal is **parallel** (or anti-parallel) to branch tangent (angle ~0° or ~180°).

---

## 🔲 Cell Structure

### Cells are explicit geometry

**Not textures, not implicit.**

Each cell is a small cube or point positioned in **sheet local frame** (X=N, Y=B).

**Cell positioning**:
```javascript
// For cell at (row, col) in sheet grid
const localX = (row / (rows - 1) - 0.5) * gridHeight;  // Along N (sheet X)
const localY = (col / (cols - 1) - 0.5) * gridWidth;   // Along B (sheet Y)

// Convert to world
const cellPos = sheetCenter 
    + (sheetXWorld * localX) 
    + (sheetYWorld * localY);
```

**Each cell has ONE tip anchor**:
```javascript
const cellTipAnchor = {
    cellId: `${sheet.id}.cell.${row}.${col}`,
    position: cellPos,
    sheetNormal: sheetNormalWorld  // For filament direction
};
```

**Lint check**: Every cell must create exactly one anchor. No cell may be missing an anchor.

---

## 🧬 Filament Topology

### Two-stage filament topology (mandatory)

**Stage 1**: Cell → Sheet Spine
- **One filament per cell**
- Short (typically 10-50m depending on scale)
- Parallel-ish (small divergence allowed)
- Thin (1-2m width)
- **No merging at a point**

**Visual**: "Combed fibers" dropping from cells

**Stage 2**: Sheet Spine → Branch Bundle
- **Exactly one filament per sheet**
- Thicker (5-10m width)
- Connects spine midpoint to branch attachment region
- Can have slight taper

**Total topology**:
```
Cell₁ ──┐
Cell₂ ──┤
Cell₃ ──┤─→ SheetSpine ───→ BranchBundle ───→ Branch
  ...   │
Cellₙ ──┘
```

**Forbidden**:
```
Cell₁ ──┐
Cell₂ ──┤──→ HubPoint ───→ Branch  ❌ (hub regression)
  ...   │
Cellₙ ──┘
```

---

### Bundling without hubs (critical)

**No node where N filaments meet. Ever.**

Bundling is achieved by:
1. **Gradual tapering** (width decreases along curve)
2. **Reduced spacing** (filaments get closer but remain distinct)
3. **Parallel curves** (shared direction, not shared endpoint)
4. **Visual convergence** (appears bundled from distance, separable when close)

**Never by**:
- Shared endpoint (ε-distance check)
- Shared geometry node
- Zero-distance convergence

**Lint check**: 
- Rule C: No two filaments share endpoint within ε = 0.01m
- Rule D: Cell tips must not cluster (maxDist > 0.2m for >4 cells)

---

## ⏱️ Timeboxes

### Timeboxes are material slices of history

**Not decorations. Not orbits.**

**Rules**:
1. Timeboxes live **on filaments**, not floating near branches
2. Timeboxes align to **branch timebox planes** (shared altitude bands)
3. Multiple filaments show rings at the **same height band**

**Implementation**:
```javascript
// For each branch timebox altitude Yb
// Find parameter t on filament curve where |point.up - Yb| is minimal
// Place micro-timebox ring at that point

for (const timeboxAlt of branchTimeboxAltitudes) {
    for (const filament of filaments) {
        const t = findClosestParam(filament.curve, timeboxAlt);
        const ringPos = filament.curve.getPoint(t);
        renderTimeboxRing(ringPos, filament.width, timeboxColor);
    }
}
```

**Visual result**: When you pause at Timebox T7, you see **many small rings** across filaments, all at the same "historical altitude".

**This makes formulas readable as history, not wires.**

---

## 🧪 Topology Lint (Must Pass)

### Rule A: Sheet normal ⟂ branch tangent (±5°)

```javascript
const dot = Math.abs(Cesium.Cartesian3.dot(sheetNormal, branchTangent));
const angleDeg = Math.acos(dot) * (180 / Math.PI);

if (Math.abs(angleDeg - 90) > 5) {
    throw new Error(`Sheet ${sheet.id}: not ⟂ branch (${angleDeg}°)`);
}
```

---

### Rule B: No sheet endpoints

```javascript
for (const filament of filaments) {
    if (!filament.topAnchorId.includes('.cell.')) {
        throw new Error(`Filament ${filament.id}: topAnchorId not a cell`);
    }
    if (filament.topAnchorId.includes('sheet.') && !filament.topAnchorId.includes('.cell.')) {
        throw new Error(`Filament ${filament.id}: sheet used as endpoint`);
    }
}
```

---

### Rule C: No shared endpoints within ε

```javascript
const eps = 0.01;  // 1cm
const seen = [];

for (const filament of filaments) {
    for (const existing of seen) {
        const dist = Cesium.Cartesian3.distance(filament.topPosition, existing);
        if (dist < eps) {
            throw new Error(`Hub regression: shared endpoint near ${filament.id}`);
        }
    }
    seen.push(filament.topPosition);
}
```

---

### Rule D: No clustering collapse near sheet

```javascript
// For each sheet with >4 cells
const tops = filaments.filter(f => f.sheetId === sheet.id).map(f => f.topPosition);

const centroid = computeCentroid(tops);
let maxDist = 0;
for (const p of tops) {
    maxDist = Math.max(maxDist, Cesium.Cartesian3.distance(p, centroid));
}

if (maxDist < 0.2) {  // 20cm radius threshold
    throw new Error(`Sheet ${sheet.id}: cell tips clustered (maxDist=${maxDist}m)`);
}
```

---

## 🔧 Branch Frame Computation (Robust for Curves)

### Frame = {T, N, B} at every point along branch

**NOT** "T = +East always" — that only works for straight branches aligned to ENU East.

**Canonical approach**: Compute frame using **parallel transport** to avoid twist.

### Tangent (T)

Use **central difference** for stability:

```javascript
function tangentAt(points, i) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(points.length - 1, i + 1);
    const dx = points[i1].east - points[i0].east;
    const dy = points[i1].north - points[i0].north;
    const dz = points[i1].up - points[i0].up;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    return { east: dx/len, north: dy/len, up: dz/len };
}
```

### Normal (N) & Binormal (B)

Use **parallel transport** to keep frame from twisting:

```javascript
function computeBranchFrames(points) {
    const frames = [];
    const enuUp = { east: 0, north: 0, up: 1 };
    
    // Initialize frame at start
    let Tprev = tangentAt(points, 0);
    let Nprev = normalize(projectOntoPlane(enuUp, Tprev));
    let Bprev = normalize(cross(Tprev, Nprev));
    
    frames.push({ T: Tprev, N: Nprev, B: Bprev });
    
    // Transport along curve
    for (let i = 1; i < points.length; i++) {
        const T = tangentAt(points, i);
        
        // Parallel transport: project previous N onto plane ⟂ T
        let N = normalize(projectOntoPlane(Nprev, T));
        
        // Fallback if degenerate (Nprev ~ T)
        const nLen = Math.sqrt(N.east**2 + N.north**2 + N.up**2);
        if (nLen < 1e-4) {
            N = normalize(projectOntoPlane(enuUp, T));
        }
        
        const B = normalize(cross(T, N));
        
        frames.push({ T, N, B });
        
        Tprev = T;
        Nprev = N;
        Bprev = B;
    }
    
    return frames;
}
```

**Helper functions**:
```javascript
function projectOntoPlane(v, n) {
    // v - n*(v·n)
    const dot = v.east*n.east + v.north*n.north + v.up*n.up;
    return {
        east: v.east - n.east * dot,
        north: v.north - n.north * dot,
        up: v.up - n.up * dot
    };
}

function normalize(v) {
    const len = Math.sqrt(v.east**2 + v.north**2 + v.up**2) || 1;
    return { east: v.east/len, north: v.north/len, up: v.up/len };
}

function cross(a, b) {
    return {
        east: a.north * b.up - a.up * b.north,
        north: a.up * b.east - a.east * b.up,
        up: a.east * b.north - a.north * b.east
    };
}
```

---

## 🚀 Implementation Order (Do This First)

### Step 1: Store `_branchFrames` as array

In `renderBranchPrimitive()`:
```javascript
// Sample branch curve in ENU (50-200 points)
const points = sampleBranchCurve(branchStartENU, branchEndENU, numSamples);

// Compute frames at each point
const frames = computeBranchFrames(points);

// Store on branch
branch._branchFrames = frames;
branch._branchPoints = points;
```

---

### Step 2: Attach sheet at specific frame index

```javascript
// Sheet attaches at branch endpoint (or specific parameter)
sheet._attachIndex = frames.length - 1;  // Last frame = endpoint
sheet._parentFrame = frames[sheet._attachIndex];
```

---

### Step 3: Use frame to orient sheet + place cells

```javascript
renderSheetPrimitive(sheet) {
    const frame = sheet._parentFrame;  // { T, N, B }
    
    // Sheet normal = -T
    const sheetXAxis = enuVecToWorldDir(enuFrame, frame.N);
    const sheetYAxis = enuVecToWorldDir(enuFrame, frame.B);
    const sheetNormal = enuVecToWorldDir(enuFrame, negateVec(frame.T));
    
    // Create sheet corners using N × B axes (NOT East × North)
    // ...
    
    // Position cells in sheet frame
    renderCellGrid(sheet, sheetXAxis, sheetYAxis);
}
```

---

### Step 4: Run lint immediately after render

```javascript
renderTree(tree) {
    // ... render all trunks, branches, sheets, cells, filaments ...
    
    // VALIDATE TOPOLOGY
    this.validateTopology(tree);
    
    // If validation passes, log success
    RelayLog.info('[TOPOLOGY] ✅ All canonical invariants satisfied');
}
```

**On every LOD rebuild**, re-run validation.

---

## 📋 What Correctness Looks Like

### Standing at trunk, looking down a branch

You should see:
- ✅ A spreadsheet **face-on** (not edge-on, not billboarded)
- ✅ Cells clearly arranged in a grid
- ✅ Thin filaments dropping from **each cell**
- ✅ Filaments gently converging into a thicker bundle (no hub point)
- ✅ Timebox rings slicing across **many filaments** at once

### If instead you see:

- ❌ A sheet that "follows your head" → **Invariant A violated**
- ❌ A glowing slab with no cells → **Cells not geometry**
- ❌ A single hose per sheet → **Invariant B violated** (sheet as endpoint)
- ❌ Filaments snapping to a point → **Invariant C violated** (hub regression)

→ **It's still wrong. Do not proceed.**

---

## 🔒 Regression Guards (Strongly Recommended)

Add a **topology lint** that hard-fails on these:

1. Any filament endpoint whose parent is a **Sheet** (not Cell)
2. Any sheet with `lookAt(camera)` in its update loop
3. Any two filaments sharing the same endpoint position (ε < 0.01m)
4. Any sheet whose normal is not **⟂** to branch tangent (±5°)
5. Any sheet where cell tips cluster (maxDist < 0.2m for >4 cells)

**This prevents the model from silently degrading again.**

---

## 📐 Visual Verification Checklist

After implementing this contract:

**Camera Test 1: Look down branch from trunk**
- [ ] Sheet appears **face-on** (not edge-on)
- [ ] Can see cell grid clearly
- [ ] Filaments drop from cells (not from sheet center)

**Camera Test 2: Orbit around sheet**
- [ ] Sheet **does not** rotate to face camera
- [ ] Sheet remains perpendicular to branch
- [ ] Cell positions remain fixed in sheet frame

**Camera Test 3: Zoom in on filament bundle**
- [ ] Can see individual filaments near cells
- [ ] Filaments gradually converge (no snap to point)
- [ ] No shared endpoint visible

**Camera Test 4: Pause at timebox T7**
- [ ] Many small rings visible across filaments
- [ ] All rings at same altitude band
- [ ] Rings are on filaments, not floating

---

## 🎯 Bottom Line

**You're not nitpicking — you're enforcing the difference between a diagram and a world.**

This contract ensures:
- **Sheets are perpendicular to branches** (not horizontal, not billboarded)
- **Cells are explicit geometry** (not textures)
- **Filaments are cell → bundle → branch** (not sheet → branch)
- **Timeboxes are shared historical slices** (not decorations)

**If it violates this contract, it's wrong.**

---

**Version**: 1.0.0  
**Status**: CANONICAL  
**Last Updated**: 2026-02-06

**Hand this to any graphics engineer and say: "If it violates this, it's wrong."**
