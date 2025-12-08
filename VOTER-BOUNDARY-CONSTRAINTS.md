# Voter Boundary Constraints

## Problem:
Currently, voters are generated at random GPS coordinates worldwide. For channels that represent specific geographic regions (provinces, countries), voters should only appear **within those boundaries**.

## Solution Architecture:

### **Option 1: Point-in-Polygon Validation** (Recommended for Now)
When generating mock voters, validate that their GPS coordinates fall within the candidate's geographic boundary.

**Pros:**
- Accurate
- Works with existing system
- Easy to implement

**Cons:**
- Slower voter generation
- Requires boundary polygon data

### **Option 2: Boundary-Aware H3 Index** (Best for Production)
Pre-compute H3 hexagons that fall within each boundary, then only generate voters in valid hexagons.

**Pros:**
- Ultra-fast voter generation
- Automatically constrains to boundaries
- Scales to millions

**Cons:**
- Requires pre-computation step
- More complex setup

---

## Implementation: Option 1 (Quick Fix)

### Step 1: Add Point-in-Polygon Check to Mock Voter Loader

```javascript
import { booleanPointInPolygon, point } from '@turf/turf';

// When generating voter location:
function generateVoterInBoundary(boundary) {
  if (!boundary || !boundary.geometry) {
    // No boundary - use random global coords
    return {
      lat: (Math.random() * 180) - 90,
      lng: (Math.random() * 360) - 180
    };
  }

  // Try up to 100 times to find point in boundary
  for (let attempt = 0; attempt < 100; attempt++) {
    // Get boundary bounding box
    const bbox = turf.bbox(boundary);
    const [minLng, minLat, maxLng, maxLat] = bbox;
    
    // Generate random point in bounding box
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    
    // Check if point is inside boundary
    const pt = point([lng, lat]);
    if (booleanPointInPolygon(pt, boundary)) {
      return { lat, lng };
    }
  }
  
  // Fallback: use boundary centroid
  const centroid = turf.centroid(boundary);
  return {
    lat: centroid.geometry.coordinates[1],
    lng: centroid.geometry.coordinates[0]
  };
}
```

### Step 2: For Global Channels (No Boundary)
If a channel has no associated boundary, voters should be:
- **Distributed globally** (current behavior)
- **OR** Concentrated in major population centers

---

## For Your Current "twat" Channel:

The "twat" channel has no geographic boundary, so voters are correctly distributed globally. This is fine for general channels.

### If You Want Geographic Constraint:
1. Associate the channel with a boundary (country/province)
2. The mock voter loader will then constrain voters to that boundary

---

## Next Steps:

1. **Now**: Test current system with 96% GPS voters (should work)
2. **Later**: Implement point-in-polygon for boundary-based channels
3. **Production**: Use H3-based boundary indexing for max performance

---

## Testing:

Refresh your browser now - you should see **386 voter towers** when hovering over candidates!

