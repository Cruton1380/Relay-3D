# County Boundary Visibility Debug Steps

## 🐛 Current Status

**Symptoms:**
- ✅ Counties loading successfully (7,000+ entities)
- ✅ 0 errors in rendering
- ❌ Boundaries not visible on globe

**Console Evidence:**
```
✅ Rendered 272 counties (0 errors) - El Salvador
✅ Rendered 31 counties (0 errors) - Belize
✅ Rendered 3233 counties (0 errors) - USA
✅ Rendered 83 counties (0 errors) - Costa Rica
... total 7,000+ counties across all countries
```

**Problem:** Entities exist but aren't visible!

---

## 🔍 Debug Steps

### Step 1: Check if Entities Exist

Open browser console and run:
```javascript
const adminHierarchy = window.earthGlobeControls?.regionManager?.adminHierarchy;
console.log(`Total county entities: ${adminHierarchy.entities.county.size}`);
```

**Expected:** Should show 7,000+ entities

### Step 2: Check Entity Visibility

```javascript
// Check first 10 counties
const counties = Array.from(adminHierarchy.entities.county.values()).slice(0, 10);
counties.forEach(entity => {
  console.log(`Entity ${entity.id}:`, {
    show: entity.show,
    hasPolygon: !!entity.polygon,
    outlineWidth: entity.polygon?.outlineWidth?.getValue(),
    outlineColor: entity.polygon?.outlineColor?.getValue(),
    height: entity.polygon?.height?.getValue()
  });
});
```

**Expected:**
- `show: true`
- `outlineWidth: 2`
- `outlineColor: Color {red: 0, green: 0, blue: 0, alpha: 1}`
- `height: 0`

### Step 3: Force Make One County Visible

```javascript
// Test with first county
const testCounty = Array.from(adminHierarchy.entities.county.values())[0];
testCounty.show = true;
testCounty.polygon.outlineWidth = 5; // Super thick
testCounty.polygon.outlineColor = window.Cesium.Color.RED; // Bright red
testCounty.polygon.height = 0;
testCounty.polygon.outline = true;

console.log('Test county styled - should see red outline');
```

**If you see it:** Outline width was too thin  
**If you don't see it:** There's a deeper rendering issue

### Step 4: Check Camera Position

```javascript
const viewer = window.earthGlobeControls?.regionManager?.viewer;
const cameraPos = viewer.camera.positionCartographic;
console.log(`Camera height: ${cameraPos.height} meters`);
```

**If height > 5,000,000 meters:** Zoom in closer to see county outlines

### Step 5: Check if Counties Are Being Hidden

```javascript
// Re-show all counties
adminHierarchy.entities.county.forEach(entity => {
  entity.show = true;
  if (entity.polygon) {
    entity.polygon.outlineWidth = 3;
    entity.polygon.outlineColor = window.Cesium.Color.RED;
  }
});

console.log('All counties forced visible with red outlines');
```

---

## 🔧 Possible Fixes

### Fix 1: Increase Outline Width (Applied)

Changed default from 1 to 2 pixels.

### Fix 2: Force Refresh After Loading

Add this after counties load:
```javascript
viewer.scene.requestRender();
```

### Fix 3: Check Z-Index/Render Order

Counties might be rendering behind vote cubes.

### Fix 4: Disable Depth Testing

```javascript
entity.polygon.depthTestEnabled = false;
```

---

## 🚀 Quick Fix to Try

Run this in browser console NOW:
```javascript
const adminHierarchy = window.earthGlobeControls?.regionManager?.adminHierarchy;
console.log(`Counties loaded: ${adminHierarchy.entities.county.size}`);

// Make ALL counties visible with thick red outlines
let count = 0;
adminHierarchy.entities.county.forEach(entity => {
  entity.show = true;
  if (entity.polygon) {
    entity.polygon.outline = true;
    entity.polygon.outlineColor = window.Cesium.Color.RED;
    entity.polygon.outlineWidth = 3;
    entity.polygon.height = 0;
    count++;
  }
});

console.log(`Forced ${count} counties visible with red outlines`);

// Force render
window.earthGlobeControls.regionManager.viewer.scene.requestRender();
```

**If you see red outlines:** The issue is outline width or color  
**If you still don't see anything:** There's a deeper Cesium rendering issue

---

Let me know what happens!

