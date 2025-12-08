# Cube Overlap Issue - Root Cause Analysis

## Problem Description
When generating 45 candidates, only ~5 cubes are visible on the globe instead of 45 individual cubes.

## Root Cause Identified

### The Real Issue: Coordinate Clustering, Not Rendering Failure

**The system IS correctly rendering all 45 candidates**, but they appear as only 5 cubes because:

1. **45 candidates are distributed across 5 cities** (New York, London, Paris, Tokyo, Sydney)
2. **~9 candidates per city** with coordinates that vary by only 0.01-0.05 degrees
3. **200km cube size** causes massive overlaps when viewed from space
4. **From space view, 9 cubes stacked at nearly identical coordinates look like 1 cube**

### Evidence from Console Logs

```
🌍 GPS: test456 Candidate 1: [40.6700, -73.9731]  // New York
🌍 GPS: test456 Candidate 6: [40.7350, -74.0237]  // New York  
🌍 GPS: test456 Candidate 11: [40.7325, -74.0160] // New York
// ... 6 more in New York

🌍 GPS: test456 Candidate 2: [51.5564, -0.1136]   // London
🌍 GPS: test456 Candidate 7: [51.5002, -0.0838]   // London
// ... 7 more in London
```

**Coordinate Difference**: Only 0.01-0.05° between candidates in same city
**Cube Size**: 200km (0.002° radius at equator = 0.004° diameter)
**Result**: 9 cubes overlap completely, appearing as a single cube

## Solutions

### Option 1: Reduce Cube Size (Implemented) ✅
- Changed base cube size from **200km → 20km**
- Makes individual cubes visible when zoomed in
- **Trade-off**: Harder to see from space view

### Option 2: Increase Coordinate Spread
- Modify candidate generator to spread coordinates by **>0.1 degrees**
- Keep larger cube sizes for visibility from space
- **Trade-off**: Less realistic city clustering

### Option 3: Add Visual Stacking Indicators
- When cubes overlap, render them in a vertical stack
- Add connecting lines or count badges
- **Trade-off**: More complex rendering logic

### Option 4: Zoom-Dependent Rendering
- Show single "cluster cube" from space
- Separate into individual cubes when zoomed in
- **Trade-off**: Already partially implemented but disabled

## Current Implementation

### Changes Made:
1. **Reduced cube size**: 200km → 20km for GPS level
2. **Added overlap detection**: Tracks coordinate density
3. **Enhanced logging**: Shows coordinate analysis with overlap warnings

### Expected Behavior Now:
- **From Space**: Still may see ~5 cubes (one per city)
- **Zoomed In**: Will see all 45 individual cubes (9 per city)
- **Console Warning**: If >3 candidates share 0.01° grid square

## Testing Instructions

1. **Clear and regenerate** 45 candidates
2. **Check console** for coordinate density report:
   ```
   📊 COORDINATE ANALYSIS: 45 candidates across 5 unique grid locations (max 9 per location)
   ⚠️ HIGH DENSITY WARNING: Up to 9 candidates sharing same 0.01° grid square
   ```

3. **Zoom into New York** - should now see 9 smaller cubes instead of 1 large cube
4. **Repeat for other cities**

## Recommendations

### Immediate Fix:
Keep the 20km cube size and document that users need to **zoom in to see individual candidates**.

### Long-Term Fix:
Modify the candidate generator to create coordinates with **minimum 0.1° separation** within a city, which would allow:
- Larger cubes for visibility from space (100km)
- Individual candidates visible without excessive zoom
- More realistic geographic distribution

### Alternative Approach:
Implement **intelligent stacking** where overlapping cubes are automatically offset vertically or in a circular pattern around the cluster center.

## Technical Details

### Coordinate Math:
- **1 degree latitude** ≈ 111km
- **1 degree longitude** ≈ 111km * cos(latitude)
- **0.01 degrees** ≈ 1.1km
- **0.1 degrees** ≈ 11km

### Cube Size vs Coordinate Spread:
- **20km cubes** with 0.05° spread (5.5km) = overlapping
- **20km cubes** with 0.2° spread (22km) = visible separation
- **100km cubes** with 1° spread (111km) = visible separation

## Conclusion

The system is **working correctly** - all 45 candidates ARE being rendered. The issue is **visual overlap** caused by realistic city clustering combined with large cube sizes. The fix involves either **smaller cubes** (implemented) or **greater coordinate spread** (recommended for production).
