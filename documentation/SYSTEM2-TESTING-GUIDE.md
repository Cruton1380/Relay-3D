# 🧪 SYSTEM2 Testing Guide

**Date:** 2025-11-23  
**Status:** SYSTEM2 created, ready for testing  
**Goal:** Test SYSTEM2 independently, verify counties render correctly

---

## 📦 **SYSTEM2 FILES CREATED**

### **Core Files:**
```
✅ src/frontend/components/main/globe/managers/CountyBoundaryManager.js (300 lines)
   - Uses Cesium GeoJsonDataSource
   - Isolated from other entity systems
   - Built-in show/hide functionality

✅ src/frontend/components/main/globe/CountyLoadingIndicator.jsx
   - Visual loading progress
   - Shows: countries loaded, counties count, progress bar

✅ src/frontend/components/main/globe/useCountySystemV2.js
   - React hook for SYSTEM2 integration
   - Simple API: initializeCountySystem(), loadCounties(), showCounties(), hideCounties()
```

### **SYSTEM1 Files (Untouched):**
```
⚠️ src/frontend/components/main/globe/managers/AdministrativeHierarchy.js
   - NOT modified
   - Still in use until SYSTEM2 proven working

⚠️ src/frontend/components/main/globe/InteractiveGlobe.jsx
   - NOT modified yet
   - Will add SYSTEM2 integration next
```

---

## 🧪 **HOW TO TEST SYSTEM2**

### **Option 1: Quick Browser Console Test**

1. **Open browser console**
2. **Check if viewer exists:**
   ```javascript
   window.globalViewer || window.viewer
   ```

3. **Create SYSTEM2 manager directly:**
   ```javascript
   // Import the class (in console, we'll use window reference)
   const viewer = window.globalViewer || window.viewer;
   
   // Create manager
   const { CountyBoundaryManager } = await import('/src/frontend/components/main/globe/managers/CountyBoundaryManager.js');
   const countyManager = new CountyBoundaryManager(viewer);
   
   // Load USA counties
   await countyManager.loadCountry('USA');
   
   // Show them
   countyManager.show();
   
   // Check status
   console.log(countyManager.getStatus());
   ```

4. **Expected Result:**
   - Console: "✅ [SYSTEM2] USA: Loaded 3233 counties"
   - Globe: Yellow semi-transparent county boundaries visible across USA

---

### **Option 2: Integration into InteractiveGlobe.jsx**

**Add to `InteractiveGlobe.jsx`:**

```javascript
// At top of file (imports)
import { useCountySystemV2 } from './useCountySystemV2';
import CountyLoadingIndicator from './CountyLoadingIndicator';

// Inside component
const {
  initializeCountySystem,
  loadCounties,
  showCounties,
  hideCounties,
  loadingProgress
} = useCountySystemV2();

// Initialize SYSTEM2 when viewer is ready
useEffect(() => {
  if (globalViewerInstance.current) {
    const initialized = initializeCountySystem(globalViewerInstance.current);
    if (initialized) {
      console.log('✅ [SYSTEM2] Initialized in InteractiveGlobe');
    }
  }
}, [globalViewerInstance.current]);

// Load counties when cluster level is 'county'
useEffect(() => {
  if (clusterLevel === 'county') {
    console.log('🌍 [SYSTEM2] County level selected - loading counties...');
    loadCounties();
  } else {
    hideCounties();
  }
}, [clusterLevel]);

// Add loading indicator to JSX
return (
  <div>
    {/* Existing JSX */}
    
    {/* SYSTEM2 Loading Indicator */}
    <CountyLoadingIndicator progress={loadingProgress} />
  </div>
);
```

---

## ✅ **SUCCESS CRITERIA**

### **Test 1: USA Counties Load**
```
1. Click "County" button
2. Console shows: "✅ [SYSTEM2] USA: Loaded 3233 counties"
3. Globe shows: Yellow boundaries across USA within 5 seconds
4. Loading indicator visible with progress
```

**Pass:** ✅ Counties visible  
**Fail:** ❌ Counties not visible → Debug material settings

---

### **Test 2: Progressive Loading**
```
1. Click "County" button
2. Loading indicator shows progress
3. USA visible first (2-5 seconds)
4. China visible next (5-10 seconds)
5. Progress updates: "25/163 countries (15,000 counties)"
6. All counties load within 2 minutes
```

**Pass:** ✅ Progressive loading works  
**Fail:** ❌ All load at once → Debug await/async

---

### **Test 3: Visibility Control**
```
1. Counties loaded and visible
2. Click "GPS" button
3. Counties hidden
4. Click "County" button again
5. Counties reappear immediately (no reload)
```

**Pass:** ✅ Show/hide works  
**Fail:** ❌ Counties reload → Check show() logic

---

### **Test 4: No Race Conditions**
```
1. Counties loaded and visible
2. Change topic (triggers vote tower render in SYSTEM1)
3. Counties remain visible
4. Vote towers render properly
5. No entity conflicts
```

**Pass:** ✅ No interference  
**Fail:** ❌ Counties disappear → DataSource isolation broken

---

### **Test 5: Performance**
```
1. Load all 163 countries
2. Check browser Task Manager
3. FPS should be 60
4. Memory < 2GB
5. No freezing/lag
```

**Pass:** ✅ Performance acceptable  
**Fail:** ❌ Lag/freeze → Reduce batch size or add delays

---

## 🐛 **DEBUGGING**

### **Issue: Counties load but not visible**

**Check 1: DataSource visibility**
```javascript
// In browser console
const dataSources = viewer.dataSources._dataSources;
const countyDS = dataSources.find(ds => ds.name === 'county-boundaries-system2');
console.log('DataSource exists:', !!countyDS);
console.log('DataSource show:', countyDS?.show);
console.log('Entity count:', countyDS?.entities.values.length);
```

**Expected:**
- DataSource exists: true
- DataSource show: true
- Entity count: 3233+ (for USA)

**If show is false:** Call `countyManager.show()`

---

### **Issue: GeoJSON not loading**

**Check 2: File access**
```javascript
// Test if file is accessible
const response = await fetch('/data/boundaries/cities/USA_ADM2.geojson');
console.log('Status:', response.status);
console.log('OK:', response.ok);

const data = await response.json();
console.log('Features:', data.features?.length);
```

**Expected:**
- Status: 200
- OK: true
- Features: 3233

**If 404:** Check file location in `/public/data/boundaries/cities/`

---

### **Issue: Entities exist but invisible**

**Check 3: Material settings**
```javascript
// Check entity material
const entity = countyDS.entities.values[0];
console.log('Entity ID:', entity.id);
console.log('Entity show:', entity.show);
console.log('Polygon:', entity.polygon);
console.log('Material:', entity.polygon?.material?.getValue());
console.log('Outline:', entity.polygon?.outline?.getValue());
```

**Expected:**
- Entity show: true
- Material: Yellow with alpha 0.3
- Outline: true (yellow, width 3)

**If wrong:** Check GeoJsonDataSource.load() options in CountyBoundaryManager.js

---

### **Issue: Performance problems**

**Check 4: Entity count**
```javascript
// Check total entities
console.log('Total entities:', viewer.entities.values.length);
console.log('DataSource entities:', countyDS.entities.values.length);

// Check if other systems added entities
viewer.entities.values.forEach(e => {
  console.log('Entity ID:', e.id);
});
```

**Expected:**
- DataSource entities: 3233 (for USA only)
- Other entities: Vote towers from GlobalChannelRenderer

**If too many:** SYSTEM1 and SYSTEM2 both loading (conflict)

---

## 📊 **COMPARISON TEST**

### **Run Both Systems and Compare:**

**SYSTEM1 (Current/Broken):**
```
1. Refresh page
2. Click "County" button
3. Observe console
4. Check if counties visible
5. Note: Likely not visible
```

**SYSTEM2 (New):**
```
1. Refresh page
2. Run SYSTEM2 test (Option 1 or 2)
3. Observe console
4. Check if counties visible
5. Note: Should be visible
```

**Comparison:**
| Aspect | SYSTEM1 | SYSTEM2 |
|--------|---------|---------|
| Loading | ✅ Loads | ✅ Loads |
| Rendering | ❌ Renders but invisible | ✅ Renders and visible |
| Visibility Control | ❌ Broken | ✅ Works |
| Race Conditions | ❌ Deleted by GlobalChannelRenderer | ✅ Isolated |
| Code Complexity | ❌ 4,500 lines | ✅ 300 lines |
| Maintainability | ❌ Low | ✅ High |

---

## 🔍 **DIAGNOSTIC COMMANDS**

### **Check SYSTEM2 Status:**
```javascript
// Get status
const status = countyManager.getStatus();
console.log('SYSTEM2 Status:', {
  isLoading: status.isLoading,
  loadedCountries: status.loadedCountries,
  totalCounties: status.totalCounties,
  isVisible: status.isVisible,
  entityCount: status.entityCount
});

// Get loaded countries
const countries = countyManager.getLoadedCountries();
console.log('Loaded countries:', countries);

// Check DataSource
console.log('DataSource show:', countyManager.dataSource.show);
console.log('DataSource entities:', countyManager.dataSource.entities.values.length);
```

---

### **Force Show Counties:**
```javascript
// If counties loaded but not visible, force show
countyManager.show();

// Check if it worked
console.log('Visible?', countyManager.isVisible());
```

---

### **Reload Single Country:**
```javascript
// Clear and reload USA
countyManager.clear();
await countyManager.loadCountry('USA');
countyManager.show();
```

---

## 🎯 **NEXT STEPS**

### **If SYSTEM2 Works:**
1. ✅ Document success
2. ✅ Integrate fully into InteractiveGlobe.jsx
3. ✅ Test with all cluster levels (GPS, County, Province, Country)
4. ✅ Verify no conflicts with vote towers
5. ✅ Get user approval
6. ✅ Delete SYSTEM1 files
7. ✅ Clean up documentation

### **If SYSTEM2 Doesn't Work:**
1. ❌ Debug using steps above
2. ❌ Check console errors
3. ❌ Verify GeoJSON files exist
4. ❌ Test with single country first (USA)
5. ❌ Compare with SYSTEM1 behavior
6. ❌ Document issues found
7. ❌ Fix and retest

---

## 📝 **TESTING CHECKLIST**

- [ ] Browser console test (Option 1) - USA counties
- [ ] Full integration test (Option 2)
- [ ] Test 1: USA Counties Load ✅
- [ ] Test 2: Progressive Loading ✅
- [ ] Test 3: Visibility Control ✅
- [ ] Test 4: No Race Conditions ✅
- [ ] Test 5: Performance ✅
- [ ] Debug any failures
- [ ] Compare SYSTEM1 vs SYSTEM2
- [ ] Document results
- [ ] Get user approval to delete SYSTEM1

---

## 🚀 **READY TO TEST**

**Status:** ✅ SYSTEM2 files created  
**SYSTEM1:** ⚠️ Untouched (safe fallback)  
**Next Action:** Test SYSTEM2 independently

**Choose test method:**
- Quick test: Option 1 (browser console)
- Full test: Option 2 (integrate into InteractiveGlobe)

**Let's make counties render! 🎉**

