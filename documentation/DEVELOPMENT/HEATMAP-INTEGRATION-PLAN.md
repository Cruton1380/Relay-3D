# 🌈 Heatmap Long Rectangle Integration Plan

## Current State Analysis

### ✅ What's Working (GPS Level)
- **File**: `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`
- **Function**: `renderIndividualCandidates()` (lines ~1330-1500)
- **Features**:
  - Heatmap colors (Blue → Green → Yellow → Orange → Red)
  - Long rectangles stretching from surface to vote height (1km-500km)
  - Vote-based exponential height scaling
  - Proper positioning (centered at half height)
  - Consistent cube sizing (80km base)

### ❌ What's Not Working (Province, Country, Continent, Global)
- **File**: `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`
- **Function**: `createClusterStack()` (lines ~810-1000)
- **Issues**:
  - Still using old dark blue cubes
  - Using `calculateVoteBasedHeight()` function (old system)
  - Positioning cubes at calculated height instead of surface-to-height
  - Not using heatmap color system
  - Not using consistent long rectangle approach

## Integration Strategy

### Phase 1: Replace createClusterStack() Function

**Target Function**: `createClusterStack()` in `GlobalChannelRenderer.jsx`

**Current Logic** (lines 810-1000):
```javascript
// OLD SYSTEM - Dark blue cubes at calculated heights
const voteBasedHeight = calculateVoteBasedHeight(candidateVotes, maxVotes, 100000, 500000);
const height = voteBasedHeight + (index * stackSpacing * 0.1);
const position = new window.Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height);

// Old cube creation with static colors
const cubeEntity = viewer.entities.add({
  box: {
    dimensions: new window.Cesium.Cartesian3(cubeSize, cubeSize, cubeHeight),
    material: hexToCesiumColor(clusterColor, 0.8), // Static color
    // ...
  }
});
```

**New Logic** (based on GPS system):
```javascript
// NEW SYSTEM - Heatmap colors, surface-to-height rectangles
const voteRatio = maxVotes > 0 ? (candidateVotes / maxVotes) : 0;
const exponentialRatio = Math.pow(voteRatio, 0.7);
const height = 1000 + (exponentialRatio * (500000 - 1000)); // 1km-500km

// Position from surface to height
const cubeCenterHeight = height / 2;
const position = window.Cesium.Cartesian3.fromDegrees(lng, lat, cubeCenterHeight);

// Heatmap color calculation
const heatmapColor = calculateHeatmapColor(candidateVotes, maxVotes, baseColor);

// Long rectangle creation
const cubeEntity = viewer.entities.add({
  box: {
    dimensions: new window.Cesium.Cartesian3(baseCubeSize, baseCubeSize, height),
    material: hexToCesiumColor(heatmapColor, 0.8), // Dynamic heatmap color
    // ...
  }
});
```

### Phase 2: Implement Regional Distribution

**Current**: All candidates stacked at exact centroid
**Target**: Distribute candidates within 500km range like GPS system

**Add Function**: `generateClusterCandidateLocations()` (similar to GPS system)
```javascript
const generateClusterCandidateLocations = useCallback((centerLat, centerLng, candidateCount, maxRadiusKm = 250) => {
  // Same logic as GPS system but for cluster-level distribution
  // Generate positions within 250km radius (500km diameter)
});
```

### Phase 3: Channel-Based Grouping

**Current**: Simple candidate stacking
**Target**: Group candidates by channel within each cluster (like hybrid system)

**Add Logic**:
```javascript
// Group candidates by their source channel
const channelGroups = new Map();
clusterGroup.candidates.forEach(candidate => {
  const channelId = candidate.sourceChannel?.id || candidate.channelId || 'unknown';
  // Group logic...
});
```

## Implementation Plan

### Step 1: Update createClusterStack() Function

**File**: `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`
**Lines**: ~810-1000

**Changes Needed**:

1. **Replace height calculation**:
   ```javascript
   // OLD
   const voteBasedHeight = calculateVoteBasedHeight(candidateVotes, maxVotes, 100000, 500000);
   
   // NEW
   const voteRatio = maxVotes > 0 ? (candidateVotes / maxVotes) : 0;
   const exponentialRatio = Math.pow(voteRatio, 0.7);
   const height = 1000 + (exponentialRatio * (500000 - 1000));
   ```

2. **Replace positioning logic**:
   ```javascript
   // OLD
   const height = voteBasedHeight + (index * stackSpacing * 0.1);
   const position = new window.Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height);
   
   // NEW
   const cubeCenterHeight = height / 2;
   const position = window.Cesium.Cartesian3.fromDegrees(location.lng, location.lat, cubeCenterHeight);
   ```

3. **Add heatmap color calculation**:
   ```javascript
   // NEW
   const heatmapColor = calculateHeatmapColor(candidateVotes, maxVotes, clusterColor);
   ```

4. **Update cube dimensions**:
   ```javascript
   // OLD
   dimensions: new window.Cesium.Cartesian3(cubeSize, cubeSize, cubeHeight),
   
   // NEW
   dimensions: new window.Cesium.Cartesian3(baseCubeSize, baseCubeSize, height),
   ```

5. **Update material**:
   ```javascript
   // OLD
   material: hexToCesiumColor(clusterColor, 0.8),
   
   // NEW
   material: hexToCesiumColor(heatmapColor, 0.8),
   ```

### Step 2: Add Regional Distribution

**Add Function** (after line ~810):
```javascript
// Generate candidate locations within 500km range for cluster distribution
const generateClusterCandidateLocations = useCallback((centerLat, centerLng, candidateCount, maxRadiusKm = 250) => {
  // Copy logic from generateRegionalCandidateLocations in hybrid system
});
```

**Update Loop** (in createClusterStack):
```javascript
// Generate distributed locations
const candidateLocations = generateClusterCandidateLocations(centerLat, centerLng, clusterGroup.candidates.length, 250);

clusterGroup.candidates.forEach((candidate, index) => {
  const location = candidateLocations[index];
  // Use location.lat, location.lng instead of centerLat, centerLng
});
```

### Step 3: Add Channel Grouping

**Add Logic** (in createClusterStack, before candidate loop):
```javascript
// Group candidates by their source channel for proper stacking
const channelGroups = new Map();
clusterGroup.candidates.forEach(candidate => {
  const channelId = candidate.sourceChannel?.id || candidate.channelId || 'unknown';
  if (!channelGroups.has(channelId)) {
    channelGroups.set(channelId, {
      channelId: channelId,
      channelName: candidate.sourceChannel?.name || 'Unknown Channel',
      candidates: []
    });
  }
  channelGroups.get(channelId).candidates.push(candidate);
});

// Process each channel group separately
channelGroups.forEach((channelGroup, channelId) => {
  // Render candidates for this channel...
});
```

### Step 4: Update Cube Sizing

**Current**: Dynamic sizing based on camera height
**Target**: Consistent sizing based on cluster level

**Replace**:
```javascript
// OLD
const cubeSize = calculateCubeSize(baseCubeSize, cameraHeight);

// NEW
let baseCubeSize;
switch (level) {
  case 'province': baseCubeSize = 30000; break; // 30km cubes
  case 'country': baseCubeSize = 50000; break;  // 50km cubes
  case 'continent': baseCubeSize = 80000; break; // 80km cubes
  case 'global': baseCubeSize = 120000; break;   // 120km cubes
  default: baseCubeSize = 40000; break;          // Default
}
```

## Files to Modify

### Primary File:
- `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`
  - **Function**: `createClusterStack()` (lines ~810-1000)
  - **Changes**: Complete rewrite to match GPS system logic

### Secondary Files (if needed):
- `src/frontend/components/workspace/components/Globe/SimpleChannelRenderer.jsx`
  - **Function**: `createRegionalStack()` (already updated with hybrid system)
  - **Status**: ✅ Already working correctly

## Expected Visual Result

After implementation, all clustering levels will show:

1. **🌈 Heatmap Colors**: Blue (low votes) → Red (high votes)
2. **📏 Long Rectangles**: Stretching from surface to vote height (1km-500km max)
3. **🌍 Regional Distribution**: Candidates spread within 500km range from cluster centroid
4. **🏢 Channel Grouping**: Candidates from same channel grouped together
5. **📊 Vote-Based Heights**: Exponential scaling for dramatic height differences
6. **🎯 Consistent Sizing**: Level-appropriate cube sizes (30km-120km base)

## Implementation Priority

1. **High Priority**: Update `createClusterStack()` function with heatmap colors and long rectangles
2. **Medium Priority**: Add regional distribution within 500km range
3. **Low Priority**: Add channel-based grouping (nice-to-have)

## Testing Strategy

1. **Test each clustering level individually**:
   - Province → Should show heatmap colors and long rectangles
   - Country → Should show heatmap colors and long rectangles  
   - Continent → Should show heatmap colors and long rectangles
   - Global → Should show heatmap colors and long rectangles

2. **Verify consistency with GPS level**:
   - Same color gradients
   - Same height ranges (1km-500km)
   - Same positioning logic (surface to height)

3. **Test performance**:
   - Ensure smooth transitions between levels
   - No memory leaks or entity conflicts

## Success Criteria

✅ **All clustering levels use identical visual style**
✅ **Heatmap colors working across all levels**  
✅ **Long rectangles from surface to vote height**
✅ **Consistent 500km max height range**
✅ **Smooth transitions between clustering levels**
✅ **Maintained hover functionality and vote counts**
✅ **Regional centroid positioning preserved**
