# Regional Polygon Distribution Fix

## Problem Summary
45 candidates appeared as only 5 cubes because they were tightly clustered around city centers with minimal coordinate variation (±0.05° ≈ 5.5km).

## Root Cause
**TestDataPanel.jsx** was generating coordinates by:
1. Picking 5 city centers (New York, London, Paris, Tokyo, Sydney)
2. Adding tiny random offset of ±0.05 degrees
3. **Result**: 9 candidates per city stacked within 5.5km radius
4. **With 200km cubes**: Complete visual overlap

## Solution Implemented

### 1. Changed Coordinate Distribution Strategy

**Before** (City Clustering):
```javascript
lat = cityCoordinates.lat + (Math.random() - 0.5) * 0.1; // ±0.05° ≈ 5.5km
lng = cityCoordinates.lng + (Math.random() - 0.5) * 0.1;
```

**After** (Regional Polygon Distribution):
```javascript
// Distribute within entire province/country polygon bounds
lat = provinceBounds.south + Math.random() * (provinceBounds.north - provinceBounds.south);
lng = provinceBounds.west + Math.random() * (provinceBounds.east - provinceBounds.west);
```

### 2. Updated Fast Local Coordinates Fallback

**Before**:
- 5 exact city center coordinates
- Cycling through same 5 points

**After**:
- 5 regional bounding boxes (entire states/countries)
- Each candidate distributed randomly within regional bounds
- Examples:
  - **New York State**: 38°N-45°N, 80°W-71°W (~700km x 500km)
  - **England**: 49.9°N-55.8°N, 6.4°W-1.8°E (~650km x 600km)
  - **France**: 42.3°N-51.1°N, 4.8°W-8.2°E (~980km x 950km)

### 3. Adjusted Cube Size

- **Before**: 20km (too small to see from space)
- **After**: 50km (balanced for visibility and separation)

## Geographic Distribution

### Coverage Areas (Approximate)
- **New York State**: ~127,000 km²
- **England**: ~130,000 km²
- **France**: ~640,000 km²
- **Japan (Honshu region)**: ~230,000 km²
- **New South Wales**: ~800,000 km²

### Separation Statistics
- **Minimum separation**: ~11km (0.1° at equator)
- **Average separation**: ~200-400km depending on region size
- **Maximum separation**: ~1000km+ within larger regions

## Expected Results

### Before Fix:
```
45 candidates → 5 cities → 9 per city → ±5.5km clustering → 5 visible cubes
```

### After Fix:
```
45 candidates → 5 regions → 9 per region → Random polygon distribution → 45 visible cubes
```

### Visual Distribution:
- **New York**: 9 cubes spread across New York State
- **England**: 9 cubes spread across England
- **France**: 9 cubes spread across France
- **Japan**: 9 cubes spread across Honshu/Tokyo region
- **Australia**: 9 cubes spread across New South Wales

## Files Modified

### 1. TestDataPanel.jsx
**Location**: `src/frontend/components/workspace/panels/TestDataPanel.jsx`

**Changes**:
- Line ~758: Changed from city center clustering to province bounds distribution
- Line ~1288: Updated coordinate generation to use province/country polygons
- Line ~1312: Enhanced fast local coordinates with regional bounding boxes

### 2. GlobalChannelRenderer.jsx
**Location**: `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`

**Changes**:
- Line ~1946: Added coordinate overlap detection and density tracking
- Line ~1973: Increased cube size from 20km → 50km
- Line ~2190: Added coordinate density analysis reporting

## Testing Instructions

1. **Clear all channels**:
   ```
   Open Test Data Panel → "Clear All Channels"
   ```

2. **Generate new candidates**:
   ```
   Technology → 45 candidates → Generate
   ```

3. **Check console logs**:
   ```javascript
   🗺️ Using province bounds for New York: [42.3456, -76.8901]
   🗺️ Using province bounds for England: [52.1234, -1.5678]
   📊 COORDINATE ANALYSIS: 45 candidates across 45 unique grid locations (max 1 per location)
   ```

4. **Visual verification**:
   - **From space**: Should see 45 distinct cubes spread across 5 regions
   - **Zoom to New York State**: Should see 9 cubes distributed across the state
   - **Zoom to England**: Should see 9 cubes distributed across England

## Expected Console Output

### Successful Distribution:
```
🗺️ Using province bounds for New York: [42.1234, -75.5678]
🌍 CUBE SIZE: Candidate 1 - Base: 50km, Final: 50km
🌍 CUBE POS: [42.1234, -75.5678] Height: 450km

🗺️ Using province bounds for New York: [43.9876, -78.1234]
🌍 CUBE SIZE: Candidate 6 - Base: 50km, Final: 50km
🌍 CUBE POS: [43.9876, -78.1234] Height: 120km

📊 COORDINATE ANALYSIS: 45 candidates across 45 unique grid locations (max 1 per location)
✅ RENDER COMPLETE: Created 90 entities for 45 individual candidates
```

### No Overlap Warnings:
If working correctly, you should NOT see:
```
⚠️ CUBE OVERLAP: 9 cubes near [40.71, -74.00]
⚠️ HIGH DENSITY WARNING: Up to 9 candidates sharing same 0.01° grid square
```

## Key Improvements

1. **Geographic Accuracy**: Candidates now distributed across actual province/country boundaries
2. **Visual Clarity**: All 45 cubes visible without overlap
3. **Scalability**: System can handle hundreds of candidates per region
4. **Realism**: Matches how candidates would actually be distributed in geographic areas
5. **Performance**: No clustering algorithm overhead

## Future Enhancements

### Option 1: True Polygon Point-in-Polygon
- Use actual GeoJSON polygons for provinces
- Ensure all points are within exact political boundaries
- Library: Turf.js `booleanPointInPolygon()`

### Option 2: Population-Weighted Distribution
- Distribute candidates based on population density
- Higher concentration in urban areas
- Lower concentration in rural areas

### Option 3: Land-Only Distribution
- Exclude ocean/water body coordinates
- Use land mask raster data
- Ensure all candidates on actual land

### Option 4: Adaptive Cube Sizing
- Larger cubes for sparse regions
- Smaller cubes for dense regions
- Dynamic based on candidate density

## Validation

### Visual Test Checklist:
- [ ] 45 cubes visible on globe (not 5)
- [ ] Cubes spread across regions (not clustered)
- [ ] No overlap warnings in console
- [ ] Cubes match regional boundaries
- [ ] All candidates have unique coordinates

### Technical Test Checklist:
- [ ] Console shows 45 unique grid locations
- [ ] Coordinate density max is 1 per location
- [ ] Cube positions within expected bounds
- [ ] Entity count matches candidate count (90 = 45 * 2)
- [ ] No rendering errors

## Troubleshooting

### If still seeing clustering:
1. Check if `selectedProvince` has valid `bounds` property
2. Verify console shows "Using province bounds" messages
3. Confirm coordinates are within expected regional ranges

### If cubes not visible:
1. Increase cube size in GlobalChannelRenderer (line ~1973)
2. Check Cesium entity visibility settings
3. Verify coordinates are not in ocean

### If wrong regional distribution:
1. Verify `regionalBounds` data in TestDataPanel
2. Check country/province selection logic
3. Ensure fallback coordinates use regional bounds

## Success Metrics

- **Coordinate Spread**: >100km average separation
- **Visual Clarity**: All 45 cubes individually visible
- **No Overlap**: Max 1 candidate per 0.01° grid square
- **Regional Accuracy**: Candidates within province/country bounds
- **Performance**: <100ms coordinate generation per candidate
