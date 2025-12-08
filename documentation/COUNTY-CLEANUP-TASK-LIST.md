# County System - Cleanup & Diagnostic Task List

**Date:** November 21, 2025  
**Status:** 52 files deleted, ready for systematic diagnosis

---

## ✅ **COMPLETED**

- [x] Deleted 43 redundant county documentation files
- [x] Deleted 2 conflicting code files (UnifiedBoundaryManager.js, OptimizedGlobeManager.js)
- [x] Deleted 6 archival documentation files
- [x] Created comprehensive system scan (COUNTY-SYSTEM-COMPLETE-SCAN.md)

**Total Deleted:** 52 files

---

## 🔧 **IMMEDIATE TASKS (Critical Fixes)**

### Task 1: Fix Broken Import
**Priority:** 🔴 CRITICAL  
**File:** `src/frontend/components/workspace/panels/PerformanceTestPanel.jsx`  
**Issue:** References deleted `OptimizedGlobeManager.js`  
**Line:** 17-18

**Options:**
- A) Delete PerformanceTestPanel.jsx entirely (if not used)
- B) Comment out OptimizedGlobeManager code (lines 14-24, 30-95)
- C) Rewrite to use AdministrativeHierarchy instead

**Recommendation:** Option A (delete if not essential) or B (comment out for now)

---

### Task 2: Verify No Other Broken Imports
**Priority:** 🔴 CRITICAL  
**Action:** Search entire codebase for imports of deleted files

**Search for:**
```bash
- UnifiedBoundaryManager
- OptimizedGlobeManager
```

**Status:** Found 2 files (checked above, only comments/broken imports)

---

### Task 3: Audit Backend Boundary Service
**Priority:** 🟡 HIGH  
**File:** `src/backend/services/boundaryService.mjs`  
**Issue:** May have duplicate county loading logic

**Actions:**
1. Read the file
2. Check if it has ADM2/county methods
3. Verify it's not conflicting with frontend AdministrativeHierarchy.js
4. Document what it does

---

### Task 4: Check Shared Boundary Adapter
**Priority:** 🟡 HIGH  
**File:** `src/shared/boundaryDataAdapter.js`  
**Issue:** Unknown role in county loading

**Actions:**
1. Read the file
2. Check if AdministrativeHierarchy.js imports it
3. Verify it's not causing conflicts
4. Document its purpose

---

## 🔍 **DIAGNOSTIC TASKS (Find Root Cause)**

### Task 5: Test Entity Addition
**Priority:** 🔴 CRITICAL  
**Goal:** Verify entities are actually being added to Cesium viewer

**Test in Browser Console:**
```javascript
// After clicking County button, wait 30 seconds, then run:
console.log('Total entities:', window.viewer.entities.values.length);
console.log('County entities:', window.viewer.entities.values.filter(e => e.id && e.id.startsWith('county-')).length);
console.log('Province entities:', window.viewer.entities.values.filter(e => e.id && e.id.startsWith('province-')).length);

// List first 10 county entities:
window.viewer.entities.values
  .filter(e => e.id && e.id.startsWith('county-'))
  .slice(0, 10)
  .forEach(e => console.log('County:', e.id, 'Show:', e.show, 'Polygon:', e.polygon ? 'YES' : 'NO'));
```

**Expected:** Should show ~1135 county entities (from console logs)  
**If 0:** Entities are not being added (rendering failed)  
**If >0 but invisible:** Visibility/styling issue

---

### Task 6: Test Single Entity Visibility
**Priority:** 🔴 CRITICAL  
**Goal:** Create ONE highly visible test county

**Create Test File:** `src/frontend/components/test/SingleCountyTest.jsx`

**Minimal Test:**
```javascript
// Add ONE county with EXTREME visibility
const testEntity = viewer.entities.add({
  id: 'test-county-USA-001',
  name: 'TEST COUNTY',
  polygon: {
    hierarchy: window.Cesium.Cartesian3.fromDegreesArray([
      -100, 40,  // Southwest corner
      -99, 40,   // Southeast corner
      -99, 41,   // Northeast corner
      -100, 41,  // Northwest corner
      -100, 40   // Close polygon
    ]),
    material: window.Cesium.Color.RED.withAlpha(1.0),  // BRIGHT RED, FULL OPACITY
    outline: true,
    outlineColor: window.Cesium.Color.YELLOW,
    outlineWidth: 10,
    height: 100000,  // 100km above ground - IMPOSSIBLE TO MISS
    extrudedHeight: 150000  // 50km thick
  }
});

console.log('Test county added:', testEntity.id);
```

**If this is visible:** Rendering works, issue is with bulk loading  
**If this is NOT visible:** Fundamental Cesium rendering problem

---

### Task 7: Check Camera Position
**Priority:** 🟡 HIGH  
**Goal:** Verify camera can see the counties

**Test in Browser Console:**
```javascript
// Check camera position
const camera = window.viewer.camera;
console.log('Camera position:', camera.positionCartographic);
console.log('Camera height (meters):', camera.positionCartographic.height);

// If height < 1000000 (1000km), camera may be too close
// Counties at height: 0 may be obscured by terrain

// Fly to good viewing position
window.viewer.camera.flyTo({
  destination: window.Cesium.Cartesian3.fromDegrees(-98.5, 39.5, 1500000),  // Over USA, 1500km up
  duration: 2
});
```

---

### Task 8: Check Terrain Classification
**Priority:** 🟡 HIGH  
**File:** `AdministrativeHierarchy.js` line ~710  
**Issue:** `classificationType.TERRAIN` may hide polygons

**Current Code:**
```javascript
classificationType: window.Cesium.ClassificationType.TERRAIN
```

**Test:** Change to:
```javascript
classificationType: window.Cesium.ClassificationType.NONE
```

**If visible after change:** Terrain classification is the problem

---

## ⚡ **PERFORMANCE TASKS (Optimize)**

### Task 9: Disable GeoBoundaries API
**Priority:** 🟡 HIGH  
**File:** `AdministrativeHierarchy.js` line ~528  
**Issue:** 41 minute timeout (163 countries × 15 seconds)

**Action:** Skip API, go straight to local files

**Change fetchCountyDataOnly():**
```javascript
// SKIP THIS ENTIRELY:
// const response = await fetch(apiUrl, { signal: abortController.signal });

// GO STRAIGHT TO LOCAL FILES:
const localFilePath = `/data/boundaries/cities/${countryCode}-ADM2.geojson`;
const response = await fetch(localFilePath);
```

**Benefit:** Instant loading (no 15 second timeouts)

---

### Task 10: Load Only USA First
**Priority:** 🟡 HIGH  
**File:** `InteractiveGlobe.jsx` line ~733  
**Issue:** Loading 163 countries at once overwhelms system

**Test:** Modify to load ONLY USA:

**Change:**
```javascript
// BEFORE:
const totalCounties = await adminHierarchy.loadCounties({
  simplified: true,
  visible: true,
  outlineWidth: 1,
  outlineColor: window.Cesium.Color.YELLOW,
  useCache: true
});

// AFTER (TEST):
const totalCounties = await adminHierarchy.loadCounties({
  simplified: true,
  visible: true,
  outlineWidth: 1,
  outlineColor: window.Cesium.Color.YELLOW,
  useCache: true,
  testMode: true,  // NEW FLAG
  testCountries: ['USA']  // ONLY USA
});
```

**In AdministrativeHierarchy.js loadCounties():**
```javascript
// At line ~340, modify country list:
if (options.testMode && options.testCountries) {
  const allCountries = this.getAllCountriesWithADM2();
  const testCountries = allCountries.filter(c => 
    options.testCountries.includes(c.code)
  );
  console.log(`🧪 TEST MODE: Loading only ${options.testCountries.join(', ')}`);
  // Use testCountries instead of allCountries
}
```

**If USA works:** Scale up to more countries  
**If USA doesn't work:** Problem is not scale-related

---

### Task 11: Increase Visibility
**Priority:** 🟢 MEDIUM  
**File:** `AdministrativeHierarchy.js` line ~710  
**Issue:** Yellow with 0.15 alpha is nearly invisible

**Test More Visible Settings:**
```javascript
polygon: {
  hierarchy: coordinates,
  material: window.Cesium.Color.RED.withAlpha(0.5),  // RED, 50% opacity
  outline: true,
  outlineColor: window.Cesium.Color.WHITE,  // WHITE outline
  outlineWidth: 3,  // 3px outline
  height: 0,
  classificationType: window.Cesium.ClassificationType.TERRAIN,
  shadows: window.Cesium.ShadowMode.DISABLED
}
```

---

## 📊 **VERIFICATION TASKS (Confirm Fixes)**

### Task 12: Monitor Console Logs
**Priority:** 🟢 MEDIUM  
**Action:** Watch for key log messages

**Expected Success Logs:**
```
✅ LKA: Loaded via proxy (25 counties)
✅ LKA: 25 counties (1/163)
🎨 Rendering LKA...
📊 LKA: renderCountyEntities complete - 25 success, 0 errors
🔍 LKA: Verification - 25 county entities in viewer, 25 in tracking map
✅ LKA: Rendered 25 counties
```

**Red Flags:**
```
❌ ERROR rendering counties for {CODE}
⚠️ {CODE}: Invalid coordinates for {NAME}
⏱️ {CODE}: Timeout after 15000ms
```

---

### Task 13: Check Entity Persistence
**Priority:** 🟢 MEDIUM  
**Action:** Verify entities don't get cleared

**Test Sequence:**
1. Click County button
2. Wait for counties to load (watch console)
3. Check entity count: `window.viewer.entities.values.filter(e => e.id.startsWith('county-')).length`
4. Click GPS button (change cluster level)
5. Check entity count again
6. **Expected:** County count should remain the same (protected from clearing)

**If count drops to 0:** GlobalChannelRenderer is still clearing entities

---

## 🎯 **PRIORITY ORDER**

**DO FIRST:**
1. Task 1: Fix PerformanceTestPanel.jsx (delete or comment out)
2. Task 5: Test entity addition (verify entities exist)
3. Task 6: Test single county visibility (minimal test)

**DO SECOND:**
4. Task 7: Check camera position
5. Task 9: Disable GeoBoundaries API (skip timeouts)
6. Task 10: Load only USA (simplify test)

**DO THIRD:**
7. Task 3: Audit backend boundary service
8. Task 8: Check terrain classification
9. Task 11: Increase visibility

**DO LAST:**
10. Task 13: Verify entity persistence
11. Task 12: Monitor console logs
12. Task 2, 4: Audit remaining files

---

## 📝 **EXPECTED OUTCOMES**

### If Task 6 (Single County) Works:
→ **Problem is:** Bulk loading, entity management, or visibility at scale  
→ **Next:** Focus on Tasks 9, 10 (simplify loading)

### If Task 6 (Single County) Fails:
→ **Problem is:** Fundamental Cesium rendering issue  
→ **Next:** Focus on Tasks 7, 8 (camera, terrain classification)

### If Entities Exist But Invisible (Task 5 shows >0):
→ **Problem is:** Visibility settings (color, alpha, height, classification)  
→ **Next:** Focus on Task 11 (increase visibility)

### If No Entities Exist (Task 5 shows 0):
→ **Problem is:** Rendering failed silently, entity clearing, or data loading  
→ **Next:** Focus on Task 13 (entity persistence), Task 3 (backend audit)

---

**STATUS:** Ready for systematic diagnosis  
**NEXT STEP:** Execute Task 1 (fix broken import), then Task 5 & 6 (diagnostic tests)

