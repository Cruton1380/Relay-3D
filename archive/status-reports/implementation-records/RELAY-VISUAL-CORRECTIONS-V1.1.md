# 🔧 RELAY VISUAL CORRECTIONS V1.1

## **FROM DEBUG GEOMETRY → LIVING STRUCTURE**

---

## **🔴 CURRENT STATE ANALYSIS:**

The prototype in the screenshot shows **correct semantics** but **incorrect visual language**:

### **What's Right:**
- ✅ Tree hierarchy (root → branch → dept → sheets)
- ✅ Pressure rings stacked along trunk
- ✅ Green NOW spheres at sheet endpoints
- ✅ ERI color coding (green/yellow boxes)
- ✅ No rotation (rings are static)

### **What's Wrong:**
- ❌ **Grid dominates** (giant floor grid, not tree)
- ❌ **Rings float beside trunk** (not embedded)
- ❌ **Wire-like edges** (no taper, no biomechanics)
- ❌ **Generic box endpoints** (don't look like spreadsheets)
- ❌ **NOW pointer placement** (conceptually at wrong level)

---

## **🔧 REQUIRED CORRECTIONS:**

### **1. GRID FADE (Stage, Not Diagram)**

#### **Problem:**
```
Giant grid = 100% opacity
Result: Looks like 3D modeling software debug view
```

#### **Fix:**
```javascript
// Grid should be nearly invisible (stage/reference only)
const gridHelper = new THREE.GridHelper(40, 40, 0x00ff88, 0x1a1f2e);
gridHelper.material.opacity = 0.08;  // NEW: Nearly invisible
gridHelper.material.transparent = true;
gridHelper.position.y = -5;

// Optional: Brighten grid near selection (future enhancement)
// Use distance-based fade to show "where you are" without dominating
```

---

### **2. EMBEDDED RINGS (Inside Trunk, Not Floating)**

#### **Problem:**
```
Rings rendered as free-floating toruses
Trunk edges rendered as thin lines
Result: Rings look like separate objects, not cross-sections
```

#### **Fix - Two-Step Approach:**

**Step A: Render Trunk as Tapered Tube**
```javascript
// Replace line edges with tube geometry
function renderTrunkTube(startPos, endPos, startRadius, endRadius) {
    const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startPos.x, startPos.y, startPos.z),
        new THREE.Vector3(endPos.x, endPos.y, endPos.z)
    ]);
    
    // Create tapered tube
    const segments = 16;
    const radialSegments = 8;
    const geometry = new THREE.TubeGeometry(
        path,
        segments,
        startRadius,  // Radius varies along path
        radialSegments,
        false
    );
    
    // Wood-like PBR material
    const material = new THREE.MeshStandardMaterial({
        color: 0x8B7355,      // Wood brown
        roughness: 0.7,
        metalness: 0.0
    });
    
    const tube = new THREE.Mesh(geometry, material);
    tube.castShadow = true;
    tube.receiveShadow = true;
    return tube;
}

// Hierarchical thickness
// Root → Branch:   radius 0.35 → 0.25
// Branch → Dept:   radius 0.25 → 0.15
// Dept → Sheet:    radius 0.15 → 0.08
```

**Step B: Rings Embedded in Trunk**
```javascript
// Rings should be flat discs (not toruses) at trunk surface
function renderEmbeddedRing(position, radius, color, thickness) {
    // Use thin cylinder (disc) instead of torus
    const geometry = new THREE.CylinderGeometry(
        radius,       // top radius
        radius,       // bottom radius
        thickness,    // height (very thin)
        32,           // radial segments
        1             // height segments
    );
    
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.0,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const disc = new THREE.Mesh(geometry, material);
    disc.position.copy(position);
    disc.rotation.x = Math.PI / 2; // Horizontal
    
    return disc;
}

// Rings should be slightly inset into trunk (Z-fighting creates "embedded" look)
```

---

### **3. BIOMECHANICAL TAPER (Hierarchical Thickness)**

#### **Problem:**
```
All edges = same thickness line
Result: Flat wiring diagram, not organic structure
```

#### **Fix - Radius by Depth:**
```javascript
const TRUNK_RADII = {
    root_to_branch: { start: 0.35, end: 0.25 },
    branch_to_dept: { start: 0.25, end: 0.15 },
    dept_to_sheet:  { start: 0.15, end: 0.08 }
};

function getTrunkRadius(parentType, childType) {
    if (parentType === 'root' && childType === 'branch') {
        return TRUNK_RADII.root_to_branch;
    } else if (parentType === 'branch' && childType === 'department') {
        return TRUNK_RADII.branch_to_dept;
    } else if (parentType === 'department' && childType === 'sheet') {
        return TRUNK_RADII.dept_to_sheet;
    }
    return { start: 0.2, end: 0.1 }; // default
}
```

#### **Curvature (Optional Enhancement):**
```javascript
// Add gentle curve to branches (not straight lines)
const midPoint = new THREE.Vector3(
    (startPos.x + endPos.x) / 2 + (Math.random() - 0.5) * 0.5,
    (startPos.y + endPos.y) / 2,
    (startPos.z + endPos.z) / 2 + (Math.random() - 0.5) * 0.5
);

const path = new THREE.QuadraticBezierCurve3(
    startPos,
    midPoint,  // Gentle curve
    endPos
);
```

---

### **4. SHEET CARD GLYPHS (Recognizable Spreadsheets)**

#### **Problem:**
```
Generic 3D boxes
Result: No immediate "this is an Excel file" recognition
```

#### **Fix - Sheet Card Geometry:**
```javascript
function createSheetCardGlyph(eriColor) {
    const group = new THREE.Group();
    
    // Main card (flat rounded rectangle)
    const cardGeometry = new THREE.PlaneGeometry(0.8, 1.0);
    const cardMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    group.add(card);
    
    // Folded corner (small triangle)
    const cornerGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0.3, 0.4, 0.01,   // top right
        0.3, 0.3, 0.01,   // middle
        0.4, 0.4, 0.01    // corner
    ]);
    cornerGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    const corner = new THREE.Mesh(cornerGeom, cornerMat);
    group.add(corner);
    
    // Spreadsheet grid texture (subtle)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    card.material.map = texture;
    card.material.needsUpdate = true;
    
    // ERI color border
    const borderGeom = new THREE.EdgesGeometry(cardGeometry);
    const borderMat = new THREE.LineBasicMaterial({ color: eriColor, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeom, borderMat);
    group.add(border);
    
    // "A1" marking (tiny label)
    // ... (add sprite with "A1" text)
    
    return group;
}
```

#### **Hanging at Branch Tips (Petiole/Stem):**
```javascript
// Thin stem connecting sheet to branch
const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    roughness: 0.7,
    metalness: 0.0
});
const stem = new THREE.Mesh(stemGeometry, stemMaterial);
stem.position.set(sheetPos.x, sheetPos.y + 0.25, sheetPos.z);
stem.castShadow = true;
```

---

### **5. NOW POINTER RELOCATION (Per-Sheet, Not Root)**

#### **Problem:**
```
Big green sphere at root
Result: Implies "company has one now" (conceptually wrong)
```

#### **Fix:**
```javascript
// Root = governance anchor (NO NOW pointer)
if (node.type === 'root') {
    // No NOW pointer here
    // Root represents company identity + governance core
}

// NOW pointer ONLY at sheet endpoints
if (node.type === 'sheet') {
    const nowGeom = new THREE.SphereGeometry(0.15, 32, 32);  // Smaller, cleaner
    const nowMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 1.0,  // Bright beacon
        roughness: 0.05,          // Very glossy
        metalness: 0.0
    });
    const nowPointer = new THREE.Mesh(nowGeom, nowMat);
    nowPointer.position.set(pos.x, pos.y + 0.4, pos.z);  // Just above sheet card
    nowPointer.userData = { type: 'nowPointer', bloomTarget: true };
    scene.add(nowPointer);
}
```

---

## **🎯 BEFORE/AFTER COMPARISON:**

| Element | Before (Debug) | After (Living) |
|---------|----------------|----------------|
| **Grid** | 100% opacity, dominant | 8% opacity, stage reference |
| **Trunk** | Thin wire lines | Tapered wood tubes (0.35 → 0.08) |
| **Rings** | Floating toruses | Embedded discs inside trunk |
| **Endpoints** | Generic boxes | Sheet card glyphs (folded corner, grid) |
| **NOW Pointer** | At root (wrong!) | At each sheet endpoint (correct!) |
| **Biomechanics** | Flat wiring | Hierarchical taper + gentle curves |

---

## **✅ IMPLEMENTATION ORDER:**

1. ✅ **Grid Fade** (1 line change)
2. ✅ **Tapered Trunk Tubes** (replace line edges)
3. ✅ **Embedded Ring Discs** (replace floating toruses)
4. ✅ **Sheet Card Glyphs** (replace boxes)
5. ✅ **NOW Pointer Relocation** (remove from root, add to sheets)

---

## **🔒 CANONICAL LOCK:**

**"The tree is the subject, not the grid. Rings are embedded, not orbiting. Sheets are recognizable. NOW is local to endpoints."**

This correction transforms Relay from **debug geometry** into a **living, legible structure**.
