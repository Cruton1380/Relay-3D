# County Boundaries Disappearing - Root Cause & Fix

## Problem Summary
Counties were loading successfully but then **disappearing immediately** or **fading away**. The system was also extremely slow, taking minutes to render.

## Root Causes Identified

### 1. **Cesium Outline Disabling (CRITICAL)**
**Location:** `CountyBoundaryManager.js` line 96

**Problem:**
```javascript
await this.dataSource.load(geoJson, {
  stroke: window.Cesium.Color.YELLOW,
  strokeWidth: 3,
  fill: window.Cesium.Color.YELLOW.withAlpha(0.3),
  clampToGround: true  // ← THIS CAUSED OUTLINES TO BE DISABLED!
});
```

**Cesium Warning in Console:**
```
Entity geometry outlines are unsupported on terrain. 
Outlines will be disabled. To enable outlines, disable geometry 
terrain clamping by explicitly setting height to 0.
```

**Explanation:**
- When `clampToGround: true` is set, Cesium automatically disables all outlines
- Counties were loading but were **invisible** without outlines (only had 30% alpha fill)
- This made them appear to "disappear" after loading

**Fix:**
```javascript
await this.dataSource.load(geoJson, {
  stroke: window.Cesium.Color.YELLOW,
  strokeWidth: 3,
  fill: window.Cesium.Color.YELLOW.withAlpha(0.3),
  clampToGround: false  // CRITICAL: false to enable outlines
});

// CRITICAL FIX: Configure entities for proper visibility with outlines
// After loading, set height=0 and classificationType to drape on terrain WITH outlines
const entities = this.dataSource.entities.values;
for (let i = 0; i < entities.length; i++) {
  const entity = entities[i];
  if (entity.polygon) {
    entity.polygon.height = 0;  // Ground level
    entity.polygon.classificationType = window.Cesium.ClassificationType.TERRAIN;  // Drape on terrain
    entity.polygon.outline = true;  // Ensure outlines are enabled
    entity.polygon.outlineColor = window.Cesium.Color.YELLOW;
    entity.polygon.outlineWidth = 3;
  }
}
```

### 2. **Browser Freezing Due to Synchronous GeoJSON Parsing**
**Problem:**
- `GeoJsonDataSource.load()` is **synchronous** and blocks the browser's main thread
- Large countries like Brazil (5570 counties) took **40 seconds** to parse
- This caused the browser to freeze and rendering to be delayed/interrupted

**Evidence from Console:**
```
✅ [SYSTEM2] USA: Loaded 3233 counties in 1217ms
✅ [SYSTEM2] CHN: Loaded 2391 counties in 2392ms
✅ [SYSTEM2] IND: Loaded 735 counties in 12611ms   (12 seconds!)
✅ [SYSTEM2] BRA: Loaded 5570 counties in 40150ms  (40 seconds!)
```

**Fix:**
```javascript
// Variable delay based on county count to prevent browser freezing
const delay = count > 3000 ? 100 : (count > 1000 ? 50 : 10);
await new Promise(resolve => setTimeout(resolve, delay));

// Force viewer update to render immediately after each country
if (this.viewer.scene) {
  this.viewer.scene.requestRender();
}
```

### 3. **Potential Entity Removal (Detection Added)**
**Problem:**
- Unknown code might be deleting county boundaries after they load
- No monitoring system to detect when entities disappear

**Fix:**
```javascript
startPersistenceCheck() {
  let lastEntityCount = this.dataSource.entities.values.length;
  let lastShowState = this.dataSource.show;

  this.persistenceCheckInterval = setInterval(() => {
    const currentEntityCount = this.dataSource.entities.values.length;
    const currentShowState = this.dataSource.show;

    // Detect entity removal
    if (currentEntityCount < lastEntityCount) {
      console.error(`🚨 [SYSTEM2] ENTITIES REMOVED! Was ${lastEntityCount}, now ${currentEntityCount}`);
      console.error(`🚨 [SYSTEM2] Something is deleting county boundaries!`);
    }

    // Detect visibility change
    if (currentShowState !== lastShowState) {
      console.warn(`⚠️ [SYSTEM2] Visibility changed: ${lastShowState} -> ${currentShowState}`);
    }

    lastEntityCount = currentEntityCount;
    lastShowState = currentShowState;
  }, 2000); // Check every 2 seconds
}
```

## Files Modified

### `src/frontend/components/main/globe/managers/CountyBoundaryManager.js`
1. **Line 96:** Changed `clampToGround: true` to `false`
2. **Lines 92-107:** Added post-load entity configuration for proper outline rendering
3. **Lines 102-120:** Enhanced logging with entity counts and dataSource state
4. **Lines 176-202:** Optimized loading delays based on county count
5. **Lines 215-267:** Added entity persistence monitoring system

## Expected Behavior After Fix

### Immediate Results:
1. ✅ **County outlines are now visible** (yellow lines, 3px width)
2. ✅ **Counties render progressively** as each country loads
3. ✅ **Browser remains responsive** during loading (variable delays)
4. ✅ **Automatic detection** if entities are being removed

### Loading Performance:
- Small countries (<1000 counties): ~1-5 seconds each
- Medium countries (1000-3000): ~5-15 seconds each
- Large countries (>3000): ~15-45 seconds each
- Total for all 163 countries: ~5-10 minutes (but progressive, so USA appears in ~1 second)

### Debug Monitoring:
- Real-time entity count logging
- Persistence check every 2 seconds
- Alerts if entities disappear
- Alerts if visibility changes unexpectedly

## Testing Instructions

1. **Start the system** (frontend + backend)
2. **Click the "County" button**
3. **Observe:**
   - USA should appear within 1-2 seconds
   - More countries appear progressively
   - No "fading away" or disappearing
4. **Check console for:**
   - `✅ [SYSTEM2] USA: Loaded 3233 counties...`
   - `👁️ [SYSTEM2] Entity persistence monitoring started`
   - **NO** `🚨 ENTITIES REMOVED!` errors
   - **NO** Cesium warnings about outlines

## Fallback Plan

If counties still disappear:
1. Check console for `🚨 [SYSTEM2] ENTITIES REMOVED!` alerts
2. This will identify **what code** is deleting the boundaries
3. Can then add protection or fix the culprit code

## Technical Notes

### Why DataSource is Better Than Individual Entities:
- DataSource entities are **isolated** from `viewer.entities`
- Calls to `viewer.entities.removeAll()` should NOT affect DataSource entities
- However, visibility can still be affected by other code

### Why `clampToGround: false` + Manual Configuration:
- Cesium's `clampToGround: true` is a convenience option, but it **disables outlines**
- By using `clampToGround: false` and manually setting `height: 0` + `classificationType: TERRAIN`, we get:
  - ✅ Terrain draping (follows globe curvature)
  - ✅ Outlines enabled and visible
  - ✅ Full control over rendering parameters

### Why Variable Delays:
- Small delays (10ms) for small countries: minimal impact, browser can handle
- Medium delays (50ms) for medium countries: prevents stuttering
- Large delays (100ms) for large countries: prevents full browser freeze

## Next Steps

1. **Test the fix** with the user
2. **Monitor console** for entity removal alerts
3. **If counties still disappear:** Use the alerts to identify the culprit code
4. **If counties are too slow:** Consider simplifying GeoJSON or using custom primitives

---

**Status:** ✅ Fix Applied - Ready for Testing
**Date:** November 23, 2025
**System:** SYSTEM2 County Boundary Module


