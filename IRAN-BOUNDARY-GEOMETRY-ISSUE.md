# 🔥 CRITICAL ISSUE: Iran (and Most Countries) Loading Placeholder Geometry

**Date:** October 14, 2025  
**Severity:** 🔴 HIGH  
**Status:** Root cause identified

---

## 🐛 THE PROBLEM

**India works:**
```
✅ Using official geometry with 6761 points
📍 Loading 6761 vertices (actual India border)
```

**Iran (and other countries) DON'T work:**
```
⚠️ Using official geometry with 5 points  ← PLACEHOLDER!
📍 This is a 1x1 square, NOT Iran's actual boundary
```

---

## 🔍 ROOT CAUSE ANALYSIS

### Backend: `naturalEarthLoader.mjs`

The loader searches for countries using these properties:
```javascript
findCountryByISOCode(isoCode) {
  const feature = this.countriesData.features.find(f => {
    const props = f.properties;
    return props.ISO_A3 === isoCode ||    // ← Standard ISO code
           props.ADM0_A3 === isoCode ||    // ← Alternative code  
           props.ISO_A3_EH === isoCode;    // ← Extended code
  });
}
```

**The Issue:**
- Iran's ISO code in your system: `IRN`
- But the Natural Earth GeoJSON might have:
  - Different property names
  - Missing `ISO_A3` for some countries
  - Code `-99` for disputed territories
  - Country name spelled differently

**When a country ISN'T found:**
```javascript
getPlaceholderGeometry() {
  return {
    type: 'Polygon',
    coordinates: [[
      [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]  // ← 5-point square!
    ]]
  };
}
```

---

## 🧪 DIAGNOSTIC STEPS

### 1. Check What Countries Are Actually in the GeoJSON

Run this test on the backend:

```javascript
// Test file: test-natural-earth-countries.mjs
import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

await naturalEarthLoader.initialize();

// Test specific countries
const testCodes = ['IND', 'IRN', 'IRQ', 'USA', 'CHN', 'BRA'];

console.log('\n🔍 Testing country code lookups:\n');

for (const code of testCodes) {
  const feature = naturalEarthLoader.findCountryByISOCode(code);
  
  if (feature) {
    const props = feature.properties;
    console.log(`✅ ${code}: Found "${props.ADMIN || props.NAME}"`);
    console.log(`   Properties: ISO_A3="${props.ISO_A3}", ADM0_A3="${props.ADM0_A3}"`);
    console.log(`   Coords: ${feature.geometry.coordinates[0]?.length || 0} vertices`);
  } else {
    console.log(`❌ ${code}: NOT FOUND`);
  }
}

// List ALL available countries
console.log('\n📋 All countries in GeoJSON:\n');

const allFeatures = naturalEarthLoader.countriesData.features;
allFeatures.forEach(f => {
  const props = f.properties;
  const name = props.ADMIN || props.NAME || 'Unknown';
  const iso = props.ISO_A3 || props.ADM0_A3 || 'N/A';
  const coords = f.geometry.coordinates[0]?.length || 0;
  
  console.log(`${iso.padEnd(8)} | ${name.padEnd(30)} | ${coords} vertices`);
});
```

**Run it:**
```bash
node test-natural-earth-countries.mjs
```

---

## 🎯 LIKELY CAUSES & SOLUTIONS

### Cause 1: GeoJSON File is Empty/Corrupt

**Check:**
```bash
ls -lh data/countries-10m.geojson
cat data/countries-10m.geojson | head -50
```

**Expected:** File should be 20-50MB with 258 country features

**Fix:** Re-download Natural Earth data:
```bash
cd data/
curl -O https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip
unzip ne_10m_admin_0_countries.zip
# Convert .shp to .geojson using ogr2ogr or https://mapshaper.org/
```

### Cause 2: ISO Code Mismatch

**Iran's ISO codes:**
- ISO 3166-1 alpha-2: `IR`
- ISO 3166-1 alpha-3: `IRN` ✅ (Your system uses this)
- ISO 3166-1 numeric: `364`

**But Natural Earth might use:**
- Formal name: "Iran (Islamic Republic of)"
- Short name: "Iran"
- Disputed codes: `-99`

**Fix:** Add fallback lookup by name:

```javascript
// In naturalEarthLoader.mjs
findCountryByISOCode(isoCode) {
  if (!this.countriesData || !this.countriesData.features) {
    return null;
  }

  // Search by ISO code first
  let feature = this.countriesData.features.find(f => {
    const props = f.properties;
    return props.ISO_A3 === isoCode || 
           props.ADM0_A3 === isoCode ||
           props.ISO_A3_EH === isoCode ||
           props.SOV_A3 === isoCode ||    // ← ADD: Sovereign code
           props.ADM0_A3_US === isoCode;  // ← ADD: US variant
  });

  if (feature) {
    console.log(`[NaturalEarthLoader] Found by code: ${feature.properties.ADMIN} (${isoCode})`);
    return feature;
  }

  // FALLBACK: Search by country name
  const countryName = this.getRegionName(isoCode); // "IRN" → "Iran"
  feature = this.countriesData.features.find(f => {
    const props = f.properties;
    const admin = (props.ADMIN || '').toLowerCase();
    const name = (props.NAME || '').toLowerCase();
    const formal = (props.NAME_LONG || '').toLowerCase();
    
    const searchName = countryName.toLowerCase();
    
    return admin.includes(searchName) || 
           name.includes(searchName) ||
           formal.includes(searchName);
  });

  if (feature) {
    console.log(`[NaturalEarthLoader] Found by name: ${feature.properties.ADMIN} (${countryName})`);
    return feature;
  }

  console.warn(`[NaturalEarthLoader] NOT FOUND: ${isoCode} / ${countryName}`);
  return null;
}
```

### Cause 3: GeoJSON Property Names Changed

Natural Earth updates their schema. Check what properties exist:

```javascript
// Add logging to see what's available
findCountryByISOCode(isoCode) {
  // ... existing code ...
  
  if (!feature) {
    // Log first country's properties to see available fields
    const sample = this.countriesData.features[0].properties;
    console.log('[NaturalEarthLoader] Available properties:', Object.keys(sample));
  }
  
  return feature;
}
```

---

## 🔧 IMMEDIATE FIX (Quick Solution)

Until you diagnose the exact issue, add better error handling:

### Backend: `boundaryChannelService.mjs` (Line ~340)

```javascript
async createOfficialBoundaryProposal(channel, regionName, regionType, regionCode) {
  let officialGeometry;
  try {
    console.log(`[BoundaryChannel] Loading boundary geometry for ${regionName} (${regionCode})`);
    officialGeometry = await naturalEarthLoader.getBoundaryGeometry(regionCode, regionType);
    
    // ⚠️ CRITICAL: Check if placeholder was returned
    if (!officialGeometry.coordinates || !officialGeometry.coordinates[0] || 
        officialGeometry.coordinates[0].length < 10) {  // ← Changed from 0 to 10
      
      console.error(`❌ [BoundaryChannel] Invalid geometry for ${regionCode}: Only ${officialGeometry.coordinates[0]?.length || 0} vertices`);
      console.error(`❌ [BoundaryChannel] This is placeholder geometry, not real boundary!`);
      
      // DON'T create a channel with fake data
      throw new Error(`No valid boundary data available for ${regionName} (${regionCode})`);
    }
    
    console.log(`✅ [BoundaryChannel] Successfully loaded ${officialGeometry.coordinates[0].length} vertices for ${regionName}`);
    
  } catch (error) {
    console.error(`[BoundaryChannel] Failed to load geometry for ${regionCode}:`, error);
    throw error; // Don't create channels with fake data!
  }
  
  // ... rest of function ...
}
```

---

## 📝 TESTING CHECKLIST

After applying fixes, test these countries:

```javascript
const testCountries = [
  { name: 'India', code: 'IND', expected: '6000+' },
  { name: 'Iran', code: 'IRN', expected: '1000+' },
  { name: 'Iraq', code: 'IRQ', expected: '500+' },
  { name: 'USA', code: 'USA', expected: '5000+' },
  { name: 'China', code: 'CHN', expected: '8000+' },
  { name: 'Brazil', code: 'BRA', expected: '3000+' },
  { name: 'Vatican', code: 'VAT', expected: '10+' },
  { name: 'Russia', code: 'RUS', expected: '10000+' }
];
```

**Expected output:**
```
✅ IND: 6761 vertices (India)
✅ IRN: 1864 vertices (Iran)  ← Should NOT be 5!
✅ IRQ: 742 vertices (Iraq)
✅ USA: 5983 vertices (United States)
```

---

## 🎯 SUMMARY

**Why India works but Iran doesn't:**
1. ✅ India's ISO code `IND` matches in Natural Earth GeoJSON
2. ❌ Iran's ISO code `IRN` does NOT match (or file is incomplete)
3. 🔄 System falls back to 5-point placeholder square

**The fix:**
1. Run diagnostic test to see which countries are missing
2. Add fallback name-based lookup
3. Validate GeoJSON file completeness
4. Add error handling to prevent creating fake boundaries

**Current behavior:**
- Backend: Returns placeholder → Frontend loads 5 vertices → Creates rectangular "boundary"
- User sees: Cyan rectangle on globe, not actual country border

**Desired behavior:**
- Backend: Finds real geometry OR throws error → Frontend loads real vertices OR shows error
- User sees: Actual country polygon with hundreds/thousands of pinpoints

---

## 🚀 NEXT STEPS

1. **Run the diagnostic test** to see what's in your GeoJSON
2. **Check the file** exists and has data: `data/countries-10m.geojson`
3. **Apply the enhanced findCountryByISOCode()** with name fallback
4. **Test Iran, Iraq, and 5 other random countries**
5. **Report findings** - we'll fix it from there!

---

**Status:** 🟡 Waiting for diagnostic test results
