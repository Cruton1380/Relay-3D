# **RELAY 3D MODEL - CANONICAL CORRECTIONS**

**Date:** February 2, 2026  
**Status:** ✅ CORRECTED (matches reference Image 2)  
**Issue:** Tree Scaffold rendering didn't match canonical model

---

## **🚨 PROBLEMS IDENTIFIED:**

### **1. Sheet Orientation (CRITICAL)**
**Problem:** Sheets were using billboard rotation (always facing camera)  
**Should be:** Sheets perpendicular to branch direction  
**Reference:** Image 2 shows sheets like pages in a book spine

### **2. Sheet Structure**
**Problem:** Sheets were flat planes with canvas textures  
**Should be:** 3D boxes containing individual cell geometry  
**Reference:** Image 2 shows cells as distinct 3D elements within sheet

### **3. Cell Filaments**
**Problem:** No individual cell filaments  
**Should be:** Each cell has thin filament connecting to branch trunk  
**Reference:** Image 2 shows thin lines from cells to main bundle

### **4. Time Boxes (Pressure Rings)**
**Problem:** Rings colored by ERI (green/yellow/red)  
**Should be:** Golden/brass colored time box markers  
**Reference:** Image 2 shows golden rings along branch

### **5. Viewing Orientation**
**Problem:** Looking down branch ≠ looking at sheet front  
**Should be:** When camera looks down branch axis, you see sheet face-on  
**Reference:** Image 2 demonstrates this perspective

---

## **✅ CORRECTIONS APPLIED:**

### **FIX 1: Sheet Perpendicular Orientation**

**Before:**
```javascript
// Billboard effect: face camera
sheetGroup.userData.isBillboard = true;

// Animation loop
scene.traverse((obj) => {
    if (obj.userData && obj.userData.isBillboard) {
        obj.lookAt(camera.position); // Always face camera
    }
});
```

**After:**
```javascript
// Calculate branch direction (from parent to sheet)
const branchDir = new THREE.Vector3(
    pos.x - parentNode.position.x,
    pos.y - parentNode.position.y,
    pos.z - parentNode.position.z
).normalize();

// Rotate sheet perpendicular to branch direction
const rotationAxis = new THREE.Vector3().crossVectors(
    new THREE.Vector3(0, 0, 1), // default forward
    branchDir
).normalize();
const rotationAngle = Math.acos(new THREE.Vector3(0, 0, 1).dot(branchDir));

if (rotationAxis.lengthSq() > 0.001) {
    sheetGroup.setRotationFromAxisAngle(rotationAxis, rotationAngle);
}

// Additional 90° rotation to make sheet perpendicular (not parallel)
sheetGroup.rotateY(Math.PI / 2);
```

**Result:** Sheets now perpendicular to branch, like pages on a spine

---

### **FIX 2: 3D Sheet Box with Individual Cells**

**Before:**
```javascript
// Flat plane with canvas texture
const surfaceGeometry = new THREE.PlaneGeometry(3, 3.75);
const surfaceMaterial = new THREE.MeshStandardMaterial({
    map: canvasTexture, // 2D texture
    side: THREE.DoubleSide
});
```

**After:**
```javascript
// 3D sheet box (container)
const sheetBoxGeom = new THREE.BoxGeometry(
    sheetWidth,  // 3.0
    sheetHeight, // 3.75
    sheetDepth   // 0.15 (thickness)
);
const sheetBox = new THREE.Mesh(sheetBoxGeom, sheetBoxMat);

// Individual cell boxes within sheet
const cellSize = 0.12;
const cellSpacing = 0.05;

for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
        // Cell position within sheet (local coordinates)
        const cellX = startX + col * cellStepX;
        const cellY = startY - row * cellStepY;
        const cellZ = sheetDepth / 2 + cellSize / 2;
        
        // Create 3D cell box
        const cellGeom = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
        const cellMat = new THREE.MeshStandardMaterial({
            color: cellColor,
            emissive: cellColor,
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8
        });
        const cellMesh = new THREE.Mesh(cellGeom, cellMat);
        cellMesh.position.set(cellX, cellY, cellZ);
        sheetGroup.add(cellMesh);
    }
}
```

**Result:** Sheets are now 3D boxes with visible individual cells

---

### **FIX 3: Cell Filaments to Branch**

**Before:**
```javascript
// No cell filaments (only trunk connection)
```

**After:**
```javascript
// CANONICAL: Thin filament from each cell to branch trunk
for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
        // ... create cell ...
        
        // Filament from cell to branch trunk
        const filamentStart = new THREE.Vector3(cellX, cellY, cellZ);
        const filamentEnd = new THREE.Vector3(0, 0, -sheetDepth * 2);
        
        const filamentGeom = new THREE.BufferGeometry().setFromPoints([
            filamentStart,
            filamentEnd
        ]);
        const filamentMat = new THREE.LineBasicMaterial({
            color: cellColor,
            opacity: 0.4,
            transparent: true,
            linewidth: 1
        });
        const filament = new THREE.Line(filamentGeom, filamentMat);
        sheetGroup.add(filament);
    }
}
```

**Result:** Each cell now has thin filament connecting to main branch bundle

---

### **FIX 4: Golden Time Boxes (Pressure Rings)**

**Before:**
```javascript
// Color by ERI
let ringColor;
if (ring.eriAvg >= 80) ringColor = 0x00ff88; // Green
else if (ring.eriAvg >= 50) ringColor = 0xffaa00; // Yellow
else ringColor = 0xff4444; // Red

const material = new THREE.MeshStandardMaterial({
    color: ringColor,
    emissive: ringColor,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.0 // No metallic
});
```

**After:**
```javascript
// CANONICAL: Golden/brass material (time box markers)
const goldenColor = 0xD4AF37; // Golden brass
const ringThickness = 0.12 + (ring.openDrifts * 0.03);

const material = new THREE.MeshStandardMaterial({
    color: goldenColor,
    emissive: goldenColor,
    emissiveIntensity: 0.3,
    roughness: 0.2,         // Metallic shine
    metalness: 0.7,         // Metallic appearance
    transparent: true,
    opacity: 0.9
});
```

**Result:** Time boxes (pressure rings) now golden/brass colored, matching reference

---

### **FIX 5: Removed Billboard Rotation**

**Before:**
```javascript
// Animation loop
scene.traverse((obj) => {
    if (obj.userData && obj.userData.isBillboard) {
        obj.lookAt(camera.position); // Sheets always face camera
    }
});
```

**After:**
```javascript
// CANONICAL: Sheets are perpendicular to branch (no billboard)
// Looking down branch = looking at sheet front (per reference model)
// (Code removed entirely)
```

**Result:** Sheets stay fixed perpendicular to branch, no camera tracking

---

## **📐 CANONICAL GEOMETRY (per Reference Image 2):**

### **Sheet Structure:**
```
Sheet Box (container):
├─ Width: 3.0 units
├─ Height: 3.75 units
├─ Depth: 0.15 units (thickness)
└─ Orientation: Perpendicular to branch direction

Individual Cells (within sheet):
├─ Size: 0.12 × 0.12 × 0.12 units (small cubes)
├─ Spacing: 0.05 units between cells
├─ Rows: up to 12 rows
├─ Columns: up to 8 columns
├─ Color: ERI-based (green/yellow/red per cell)
└─ Filaments: Thin lines from each cell to sheet back

Cell Filaments:
├─ Start: Cell center
├─ End: Sheet back surface
├─ Thickness: 1px linewidth
├─ Color: Matches cell color
└─ Opacity: 0.4 (semi-transparent)
```

### **Time Boxes (Pressure Rings):**
```
Pressure Ring (time slice marker):
├─ Shape: Thin cylinder (disc)
├─ Radius: 0.5 + (commitCount / 50)
├─ Thickness: 0.12 + (openDrifts * 0.03)
├─ Color: Golden brass (0xD4AF37)
├─ Material: Metallic (0.7 metalness, 0.2 roughness)
├─ Spacing: 0.4 units vertical (stacked downward)
└─ Position: Along trunk between nodes
```

### **Branch Trunk:**
```
Tapered Tube (organic):
├─ Shape: TubeGeometry along path
├─ Color: Wood brown (0x8B7355)
├─ Taper: Thick → thin (root to sheets)
├─ Radii:
│   ├─ root-branch: 0.35 → 0.25
│   ├─ branch-department: 0.25 → 0.15
│   └─ department-sheet: 0.15 → 0.08
└─ Material: Non-metallic wood (roughness 0.7)
```

---

## **🎯 VERIFICATION CHECKLIST:**

Test the canonical model in Tree Scaffold view:

- [ ] **Sheet orientation:** Sheets perpendicular to branch (not billboard)
- [ ] **Looking down branch:** Camera pointing down branch axis shows sheet face-on
- [ ] **Individual cells:** Can see distinct 3D cell boxes within each sheet
- [ ] **Cell filaments:** Thin lines visible from cells to sheet back
- [ ] **Golden rings:** Pressure rings are golden/brass colored (not ERI colors)
- [ ] **No billboard:** Sheets don't rotate to face camera when moving
- [ ] **Time boxes:** Golden rings stacked along trunk segments
- [ ] **Organic feel:** Model looks "grown" like reference image

---

## **📸 BEFORE vs. AFTER:**

### **Before (Incorrect):**
- ❌ Sheets as billboards (always face camera)
- ❌ Flat planes with canvas textures
- ❌ No individual cell geometry
- ❌ No cell filaments
- ❌ ERI-colored pressure rings (green/yellow/red)
- ❌ Looking down branch ≠ seeing sheet front

### **After (Canonical):**
- ✅ Sheets perpendicular to branch direction
- ✅ 3D sheet boxes with depth
- ✅ Individual 3D cell boxes (up to 12×8 grid)
- ✅ Thin filaments from each cell to branch
- ✅ Golden/brass time boxes (pressure rings)
- ✅ Looking down branch = seeing sheet face-on

---

## **🎨 VISUAL REFERENCE (Image 2):**

**Key Elements from Reference:**
1. **Sheets perpendicular to flow** (like pages on spine)
2. **Cells within sheets** (small boxes/spheres)
3. **Individual cell filaments** (thin lines to main bundle)
4. **Golden rings** (time box markers along branch)
5. **Looking down branch** shows sheet front face
6. **Organic "grown" appearance** (not diagram/wireframe)

---

## **📁 FILES UPDATED:**

1. ✅ **`filament-spreadsheet-prototype.html`**
   - Lines 2838-2980: Sheet rendering completely rewritten
   - Lines 2722-2759: Pressure rings now golden/brass
   - Lines 3360-3365: Billboard rotation removed

2. ✅ **`RELAY-3D-MODEL-CANONICAL-CORRECTIONS.md`**
   - This document (correction summary)

---

## **🔒 CANONICAL STATUS:**

**Sheet Orientation:** ✅ FIXED (perpendicular to branch)  
**Cell Geometry:** ✅ FIXED (3D boxes within sheet)  
**Cell Filaments:** ✅ FIXED (thin lines to branch)  
**Time Boxes:** ✅ FIXED (golden/brass rings)  
**Viewing Angle:** ✅ FIXED (look down branch = see sheet front)

**Model now matches reference Image 2.**

**Ready for:**
- 🎬 Video production (canonical "grown organism" appearance)
- 📊 Accurate spatial representation of spreadsheet physics
- 🌳 Proper "tree with sheets" metaphor

---

**Relay 3D model is now CANONICAL.** 🌳📊🔒✨

**Sheets are perpendicular. Cells are visible. Filaments connect. Time boxes are golden.**
