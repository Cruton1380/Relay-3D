# 🗺️ County Boundaries & Clustering System - File Map

**Date:** 2025-11-23  
**Purpose:** Complete reference of all files involved in county boundaries and vote clustering

---

## 🏛️ **COUNTY BOUNDARY SYSTEM**

### **1. Core County Files**

#### **`AdministrativeHierarchy.js`** ⭐ MAIN FILE
**Path:** `src/frontend/components/main/globe/managers/AdministrativeHierarchy.js`

**Purpose:** Loads and renders all administrative boundaries (countries, provinces, counties)

**Key Functions:**
- `loadCounties()` - Fetches and renders all 163 countries with county data
- `fetchCountyDataOnly()` - Fetches GeoJSON from local files or backend proxy
- `renderCountyEntities()` - Adds county polygons to Cesium viewer
- `protectAdministrativeBoundaries()` - Prevents counties from being deleted

**Lines:**
- **Line 300:** `loadCounties()` function starts
- **Line 502:** `MAX_COUNTRY_TIMEOUT = 300000` (5 minute timeout)
- **Line 519:** Local file fetch with 5min timeout
- **Line 393-430:** Progressive batch rendering loop
- **Line 1000-1100:** `renderCountyEntities()` - creates Cesium polygon entities

**Rendering Style:**
```javascript
{
  material: Cesium.Color.YELLOW.withAlpha(0.15),
  outline: true,
  outlineColor: Cesium.Color.YELLOW,
  outlineWidth: 2,
  height: 0,
  classificationType: Cesium.ClassificationType.TERRAIN
}
```

---

#### **`InteractiveGlobe.jsx`** ⭐ TRIGGER FILE
**Path:** `src/frontend/components/main/globe/InteractiveGlobe.jsx`

**Purpose:** Main globe component that initiates county loading when user clicks "County" button

**Key Logic:**
- **Lines 723-763:** County level selection
  ```javascript
  if (clusterLevel === 'county') {
    const totalCounties = await adminHierarchy.loadCounties({
      simplified: true,
      visible: true,
      outlineWidth: 2,
      outlineColor: window.Cesium.Color.YELLOW
    });
  }
  ```

**Flow:**
1. User clicks "County" button → `ClusteringControlPanel.jsx` updates `clusterLevel`
2. `useEffect` detects `clusterLevel === 'county'`
3. Calls `adminHierarchy.loadCounties()`
4. Waits for completion
5. Logs `✅ COUNTY LOAD COMPLETE`

---

#### **`RegionManager.js`**
**Path:** `src/frontend/components/main/globe/managers/RegionManager.js`

**Purpose:** Manages visibility and persistence of all boundary layers

**Key Functions:**
- `setActiveClusterLevel()` - Shows/hides layers based on cluster level
- `ensureEntityPersistence()` - Prevents entities from disappearing
- Hover/tooltip system for boundaries

**Lines:**
- **Line 405:** `setActiveClusterLevel(level)`
- **Line 417:** Updates layer visibility
- **Line 3217:** `ensureEntityPersistence()` - checks county entities exist

---

### **2. Backend Files**

#### **`geoboundariesProxyAPI.mjs`**
**Path:** `src/backend/api/geoboundariesProxyAPI.mjs`

**Purpose:** Backend proxy to fetch GeoJSON from GeoBoundaries API (bypasses CORS)

**Key Settings:**
- **Line 126:** GeoJSON download timeout: 120 seconds
- **Line 61:** Metadata timeout: 10 seconds

**Not needed if all files are downloaded locally!**

---

### **3. Data Files**

#### **Downloaded GeoJSON Files**
**Path:** `public/data/boundaries/cities/`

**Format:** `{COUNTRY_CODE}-ADM2.geojson`

**Examples:**
- `USA-ADM2.geojson` (21 MB, 3,233 counties)
- `CHN-ADM2.geojson` (15 MB, 2,391 counties)
- `RUS-ADM2.geojson` (334 MB, 2,327 counties)
- `IDN-ADM2.geojson` (358 MB, 519 counties)

**Total:** 163 countries, ~2.5 GB

---

## 🎯 **VOTE CLUSTERING SYSTEM**

### **1. Core Clustering Files**

#### **`GlobalChannelRenderer.jsx`** ⭐ MAIN FILE
**Path:** `src/frontend/components/workspace/globe/GlobalChannelRenderer.jsx`

**Purpose:** Renders vote towers (GPS, County, Province, Country levels)

**Key Functions:**
- `groupCandidatesByClusterLevel()` - Groups votes by location
- `createClusterStack()` - Creates vote towers
- `renderCountyLevelClusters()` - Renders county-level vote towers

**Lines:**
- **Line 1500-2000:** County level clustering logic
- **Line 2500-3000:** Creates long rectangle towers for county clusters
- **Line 3200-3300:** Handles cluster level changes

**Rendering:**
```javascript
// County level: Long rectangle towers
{
  position: countyCenter,
  box: {
    dimensions: new Cesium.Cartesian3(width, width, height),
    material: Cesium.Color.fromCssColorString(color),
    outline: true,
    outlineColor: Cesium.Color.WHITE
  }
}
```

---

#### **`ClusteringControlPanel.jsx`**
**Path:** `src/frontend/components/workspace/panels/ClusteringControlPanel.jsx`

**Purpose:** UI buttons for cluster level (GPS, City, County, Province, Country, Region, Global)

**Lines:**
- **Line 75:** Button click handler
  ```javascript
  const handleClusterLevelChange = (level) => {
    console.log(`🔗 Cluster level button clicked: ${level}`);
    setClusterLevel(level);
  };
  ```

---

#### **`getCandidateVotes.js`**
**Path:** `src/frontend/components/workspace/globe/utils/getCandidateVotes.js`

**Purpose:** Calculates total votes for each candidate (base + blockchain)

**Used by:** `GlobalChannelRenderer.jsx` to determine tower heights

---

### **2. Clustering Helpers**

#### **`coordinateUtils.js`**
**Path:** `src/frontend/components/workspace/globe/utils/coordinateUtils.js`

**Purpose:** Geographic calculations (centroids, distances, clustering)

**Functions:**
- `calculateCentroid()` - Average lat/lng for grouped candidates
- `degreesToRadians()` - For distance calculations

---

## ⚠️ **POTENTIAL RACE CONDITIONS**

### **Race Condition #1: County Load vs Vote Tower Render**

**What Happens:**
1. User clicks "County" button
2. `InteractiveGlobe.jsx` calls `loadCounties()` (starts async)
3. `GlobalChannelRenderer.jsx` detects cluster level change
4. Tries to render vote towers BEFORE counties load

**Where:**
- `InteractiveGlobe.jsx` line 730: `loadCounties()` starts (async)
- `GlobalChannelRenderer.jsx` line 3200: Cluster effect triggers immediately

**Solution:**
- `loadCounties()` sets `isLoadingCounties = true` flag
- `GlobalChannelRenderer.jsx` checks flag before rendering
- Both systems respect each other's entities

---

### **Race Condition #2: Entity Removal During County Load**

**What Happens:**
1. Counties are loading/rendering
2. User switches cluster level → `GlobalChannelRenderer.jsx` clears entities
3. Counties get deleted mid-load

**Where:**
- `GlobalChannelRenderer.jsx` line 3300: Cluster effect calls entity removal
- `AdministrativeHierarchy.js` line 400: Mid-render

**Solution:**
- Entity IDs with prefix protection:
  ```javascript
  // County entities: 'county-USA-123'
  // Vote towers: 'candidate-xyz'
  
  // Only remove vote towers, protect counties:
  if (!entity.id.startsWith('county-')) {
    viewer.entities.remove(entity);
  }
  ```

---

## 🔄 **SYSTEM FLOW**

### **When User Clicks "County" Button:**

```
1. ClusteringControlPanel.jsx
   ↓ setClusterLevel('county')
   
2. InteractiveGlobe.jsx (useEffect)
   ↓ Detects clusterLevel === 'county'
   ↓ Calls adminHierarchy.loadCounties()
   
3. AdministrativeHierarchy.js
   ↓ Fetches 163 countries in batches
   ↓ Renders each as it finishes (progressive)
   ↓ Returns total count
   
4. InteractiveGlobe.jsx
   ↓ Logs "COUNTY LOAD COMPLETE"
   
5. PARALLEL: GlobalChannelRenderer.jsx
   ↓ Detects clusterLevel === 'county'
   ↓ Groups votes by county
   ↓ Renders vote towers at county centers
   ↓ Respects county boundary entities (doesn't delete)
```

**Timeline:**
```
[0s]   🔗 Cluster level button clicked: county
[0s]   🚀 STARTING COUNTY LOAD FOR ALL 163 COUNTRIES
[0s]   🌍 CLUSTER EFFECT triggered (GlobalChannelRenderer)
[2s]   ✅ USA: Rendered 3233 counties
[3s]   ✅ CHN: Rendered 2391 counties
[5s]   🌍 County level clusters rendered (vote towers)
[10s]  ✅ More counties rendered...
[5min] ✅ All counties complete
```

---

## 📋 **COMPLETE FILE LIST**

### **County Boundaries (5 files):**
1. ✅ `AdministrativeHierarchy.js` - Main loader/renderer
2. ✅ `InteractiveGlobe.jsx` - Trigger
3. ✅ `RegionManager.js` - Persistence
4. ✅ `geoboundariesProxyAPI.mjs` - Backend proxy (optional)
5. ✅ `public/data/boundaries/cities/*.geojson` - Data files

### **Vote Clustering (6 files):**
1. ✅ `GlobalChannelRenderer.jsx` - Main renderer
2. ✅ `ClusteringControlPanel.jsx` - UI buttons
3. ✅ `getCandidateVotes.js` - Vote calculation
4. ✅ `coordinateUtils.js` - Geographic math
5. ✅ `groupCandidatesByClusterLevel.js` - Clustering logic
6. ✅ `boundaryRenderingService.js` - Boundary helpers

### **Shared (2 files):**
1. ✅ `RelayMainApp.jsx` - Global state
2. ✅ `GlobeInitializer.js` - Cesium setup

---

## 🐛 **RECENT BUG FIX**

### **Problem:**
- Counties loading but not rendering
- IDN (358MB) timing out, blocking entire batch
- `Promise.all()` waiting for all countries

### **Solution:**
- Increased timeout: 120s → 300s (5 minutes)
- Progressive rendering: render each country as it finishes
- Don't wait for slow countries to render fast ones

### **Changed Lines:**
- `AdministrativeHierarchy.js:502` - Timeout increased
- `AdministrativeHierarchy.js:519` - Fetch timeout increased
- `AdministrativeHierarchy.js:393-430` - Progressive loop

---

## ✅ **NO DUPLICATE LOGIC FOUND**

**Confirmed:**
- ✅ Only ONE file loads counties: `AdministrativeHierarchy.js`
- ✅ Only ONE file renders vote towers: `GlobalChannelRenderer.jsx`
- ✅ Entity ID prefixes prevent conflicts
- ✅ Loading flag prevents race conditions

**Status:** CLEAN - no competing systems!

