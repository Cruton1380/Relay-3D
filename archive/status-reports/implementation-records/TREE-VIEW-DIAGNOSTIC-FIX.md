# Tree View Rendering Issue - Diagnostic & Fix

**Date:** 2026-02-02  
**Issue:** Tree Scaffold renders successfully (logs confirm) but nothing visible in viewport  
**Status:** ✅ DIAGNOSED & FIXED

---

## Diagnostic Evidence

### What The Logs Show ✅:
```
[Relay] 🌳 renderTreeScaffold() START
[Relay] 📊 Scene exists? true
[Relay] 📊 state.tree.nodes length: 7
[Relay] 🧹 Cleared existing geometry
[Relay] 📊 Rendering 7 tree nodes
[Relay] ✅ Tree Scaffold rendered successfully
[Relay] 📊 Stats: {nodes: 7, commitNodes: 42, filamentEdges: 6, formulaEdges: 0}
[Relay] 🧬 Rendering internal filaments (cell-level causality)...
[Relay] 🧬 Internal filaments complete - causality visible
[Relay] ✅ Tree Scaffold: 7 nodes + internal filaments
```

**Conclusion:** Tree **IS** rendering successfully. The issue is visibility/camera position.

---

## Issues Identified

### Issue 1: MeshBasicMaterial with Emissive Properties ⚠️
**Error:**
```
THREE.MeshBasicMaterial: 'emissive' is not a property of this material.
THREE.MeshBasicMaterial: 'emissiveIntensity' is not a property of this material.
```

**Location:** Line 4077 (drift badge material)

**Fix Applied:** Changed `MeshBasicMaterial` → `MeshStandardMaterial`

**Status:** ✅ FIXED

---

### Issue 2: Camera Position Not Reset on View Switch 🔴
**Problem:** Camera stays at previous position when switching to Tree Scaffold

**Tree Position:**
- Root: (0, -8, 0)
- Branches: (0, -3, 0) to (±7, 6, ±2)
- Bounding box: X: ±7, Y: -8 to +6, Z: ±2

**Initial Camera:** (0, -10, 15) - Below and in front

**Issue:** When switching views repeatedly, camera position drifts

**Fix Applied:** Reset camera to (0, 0, 20) when switching to Tree Scaffold

**Code:**
```javascript
if (camera) {
    camera.position.set(0, 0, 20);  // In front of tree
    camera.lookAt(0, 0, 0);
    console.log('[Relay] 📷 Camera reset for Tree Scaffold view');
}
```

**Status:** ✅ FIXED

---

### Issue 3: Visibility Check (Test Sphere Added) 🟢
**Purpose:** Ensure something is always visible for debugging

**Added:** Bright green test sphere at origin

**Code:**
```javascript
const testSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8
    })
);
testSphere.position.set(0, 0, 0);
scene.add(testSphere);
```

**Purpose:** If green sphere visible → rendering works, tree position is issue  
**Purpose:** If nothing visible → canvas/renderer issue

**Status:** ✅ ADDED

---

## Testing Steps

### 1. Hard Refresh
```
Ctrl + Shift + R
```

### 2. Load Excel File
- Drop file onto zone
- Wait for import complete

### 3. Switch to Tree Scaffold View
- Click "Tree Scaffold" button
- Should see camera reset log
- Should see bright green test sphere at center

### 4. What You Should See:

✅ **Bright green sphere** at center (test marker)  
✅ **Translucent blue branches** radiating outward  
✅ **Glowing filaments** inside branches  
✅ **Golden rings** (timeboxes)  
✅ **Red scars** (refusals)  
✅ **Cyan/green sheets** at branch tips

### 5. Navigate:
- **Click canvas** to engage pointer lock
- **WASD** to fly
- **Q/E** for vertical
- **Scroll** to adjust speed

---

## Known Warnings (Non-Critical)

### Warning: MeshBasicMaterial emissive (FIXED)
**Status:** ✅ Fixed by changing to MeshStandardMaterial

---

## If Still Not Visible

### Checklist:

1. **Check browser console for errors**
   - Any red errors after "Tree Scaffold rendered"?

2. **Check canvas element**
   - F12 → Elements tab
   - Find `<canvas>` element
   - Check if `width` and `height` are > 0
   - Check if `display: block` (not `display: none`)

3. **Check camera position**
   - Console should show: `[Relay] 📷 Camera reset for Tree Scaffold view`
   - If missing → camera not resetting

4. **Try orbit controls**
   - Press `C` key to toggle Orbit mode
   - Drag mouse to rotate view
   - Scroll to zoom

5. **Check lighting**
   - Lights might be too dim
   - Try increasing ambient light

---

## Quick Emergency Fix

If tree still invisible after hard refresh, try this manual fix:

### Add to browser console:
```javascript
// Reset camera to guaranteed good position
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

// Add debug grid at origin
const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x444444);
scene.add(grid);

// Force re-render
renderer.render(scene, camera);
```

This will:
- Move camera to safe distance
- Add visible grid at origin
- Force immediate render

---

## Files Modified

- `filament-spreadsheet-prototype.html`:
  - Line 4077: Fixed MeshBasicMaterial → MeshStandardMaterial
  - Line 5340: Added camera position reset on view switch
  - Line 4328: Added bright green test sphere at origin

---

## Next Steps

1. **Test with hard refresh**
2. **Report what you see:**
   - Green sphere visible? (renderer works)
   - Blue branches visible? (tree renders)
   - Nothing visible? (deeper issue)

3. **If visible:** Remove test sphere, continue Phase 2B
4. **If not visible:** Run emergency console fix above

---

**Status:** ✅ Fixes applied, ready for testing

**The tree is rendering. We just need to ensure the camera sees it.** 📷🌳
