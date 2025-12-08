# Vector Tiles Implementation for Counties

## Overview

This document describes the implementation of vector tiles (MVT) for county boundaries, replacing the Cesium entity-based approach that was causing entity overload issues.

## Problem Solved

**Before:** 56,000+ Cesium entities causing silent rendering failures after ~50k entities  
**After:** Vector tiles loaded on-demand, GPU-accelerated, scales to millions of features

## Architecture

### Components Created

1. **CountyVectorTileLayer.js** - Deck.gl MVTLayer wrapper
   - Location: `src/frontend/components/main/globe/layers/CountyVectorTileLayer.js`
   - Purpose: Creates configured MVTLayer for county boundaries
   - Features: Click/hover handlers, styling, coordinate system handling

2. **CountyVectorTileManager.js** - Manager for vector tile layer
   - Location: `src/frontend/components/main/globe/managers/CountyVectorTileManager.js`
   - Purpose: Manages layer visibility, lifecycle, event handling
   - Features: Show/hide, toggle, event bridging

3. **DeckGlCesiumIntegration.js** - Integration helper
   - Location: `src/frontend/components/main/globe/integrations/DeckGlCesiumIntegration.js`
   - Purpose: Syncs deck.gl with Cesium camera
   - Features: Camera synchronization, canvas overlay

4. **useCountyVectorTiles.js** - React hook
   - Location: `src/frontend/components/main/globe/useCountyVectorTiles.js`
   - Purpose: React interface for vector tile system
   - Features: State management, lifecycle handling

## Integration Steps

### 1. Install Dependencies

```bash
npm install @deck.gl/core @deck.gl/layers @deck.gl/geo-layers @deck.gl/cesium
```

### 2. Generate Vector Tiles

See `scripts/generate-county-tiles.md` for detailed instructions.

Quick command:
```bash
tippecanoe -o counties.mbtiles \
  --layer=adm2 \
  --read-parallel \
  --generate-ids \
  --no-feature-limit \
  --no-tile-size-limit \
  --maximum-zoom=12 \
  public/data/boundaries/cities/*.geojson

mb-util counties.mbtiles public/tiles/county --image_format=pbf
```

### 3. Integrate with InteractiveGlobe

Update `InteractiveGlobe.jsx`:

```javascript
import { createDeckGlOverlay } from './integrations/DeckGlCesiumIntegration';
import { useCountyVectorTiles } from './useCountyVectorTiles';

// In component:
const deckOverlayRef = useRef(null);

// After viewer is created:
useEffect(() => {
  if (viewerRef.current && cesiumContainerRef.current) {
    deckOverlayRef.current = createDeckGlOverlay(
      viewerRef.current,
      cesiumContainerRef.current
    );
  }
}, [viewerRef.current]);

// Use vector tiles hook:
const {
  initializeCountySystem,
  showCounties,
  hideCounties,
  isVisible
} = useCountyVectorTiles(viewerRef, deckOverlayRef);

// Initialize when ready:
useEffect(() => {
  if (viewerRef.current && deckOverlayRef.current) {
    initializeCountySystem(viewerRef.current, deckOverlayRef.current, {
      urlTemplate: '/tiles/county/{z}/{x}/{y}.pbf',
      onClick: handleCountyClick,
      onHover: handleCountyHover
    });
  }
}, [viewerRef.current, deckOverlayRef.current]);

// Show/hide based on cluster level:
useEffect(() => {
  if (clusterLevel === 'county') {
    showCounties();
  } else {
    hideCounties();
  }
}, [clusterLevel]);
```

### 4. Bridge Events to RegionHoverSystem

```javascript
const handleCountyClick = ({ properties, featureId }) => {
  // Bridge to existing RegionHoverSystem
  if (regionManagerRef.current?.hoverSystem) {
    regionManagerRef.current.hoverSystem.handleRegionClick({
      type: 'county',
      properties,
      featureId
    });
  }
};

const handleCountyHover = ({ properties, featureId }) => {
  // Bridge to existing RegionHoverSystem
  if (regionManagerRef.current?.hoverSystem) {
    regionManagerRef.current.hoverSystem.handleRegionHover({
      type: 'county',
      properties,
      featureId
    });
  }
};
```

## Configuration

### URL Template

Update the tile URL template based on your hosting:

**Development (local):**
```javascript
urlTemplate: '/tiles/county/{z}/{x}/{y}.pbf'
```

**Production (S3 + CloudFront):**
```javascript
urlTemplate: 'https://cdn.example.com/tiles/county/{z}/{x}/{y}.pbf'
```

**Production (tileserver-gl):**
```javascript
urlTemplate: 'https://tiles.example.com/counties/{z}/{x}/{y}.pbf'
```

### Styling

Customize colors in `CountyVectorTileLayer.js`:

```javascript
getFillColor: [255, 255, 0, 30], // Yellow fill, 30% opacity
getLineColor: [255, 255, 0],     // Yellow outline
lineWidth: 3                      // 3px line width
```

## Migration from Entity-Based System

### Disable Old System

In `useCountySystemV2.js` or `InteractiveGlobe.jsx`:

```javascript
// Comment out or remove:
// const { loadCounties } = useCountySystemV2();

// Replace with:
const { showCounties, hideCounties } = useCountyVectorTiles(viewerRef, deckOverlayRef);
```

### Keep Entity System as Fallback (Optional)

You can keep both systems and switch based on a feature flag:

```javascript
const USE_VECTOR_TILES = true; // Feature flag

if (USE_VECTOR_TILES) {
  // Use vector tiles
  const { showCounties } = useCountyVectorTiles(viewerRef, deckOverlayRef);
} else {
  // Use entities (old system)
  const { loadCounties } = useCountySystemV2();
}
```

## Testing Checklist

- [ ] Tiles generate successfully
- [ ] Tiles are accessible via URL template
- [ ] Counties render on globe
- [ ] Counties load only in viewport
- [ ] Click events work
- [ ] Hover events work
- [ ] Tooltips show county names
- [ ] Performance is acceptable (60 FPS)
- [ ] Memory usage is low
- [ ] No CORS errors
- [ ] Works at all zoom levels

## Performance Expectations

**Before (Entities):**
- 56,000+ entities
- ~50k entity limit before silent failures
- 10+ minutes to load all
- High memory usage
- Browser freezes

**After (Vector Tiles):**
- Only visible tiles loaded
- No entity limits
- Instant loading (viewport-based)
- Low memory usage
- Smooth 60 FPS

## Troubleshooting

### Tiles not loading
- Check URL template is correct
- Verify tiles exist at path
- Check browser network tab for 404s
- Verify CORS headers on server

### Counties not visible
- Check `deckOverlayRef.current` exists
- Verify layer is added to deck overlay
- Check layer `visible` property
- Verify camera sync is working

### Click/hover not working
- Verify `pickable: true` on layer
- Check event handlers are connected
- Verify feature properties exist
- Check console for errors

### Performance issues
- Reduce `maximum-zoom` in tile generation
- Simplify geometries at low zooms
- Use CDN for tile delivery
- Monitor tile sizes (keep < 500 KB)

## Next Steps

1. Generate tiles using `scripts/generate-county-tiles.md`
2. Integrate with `InteractiveGlobe.jsx`
3. Test thoroughly
4. Deploy to staging
5. Monitor performance
6. Roll out to production

## Future Enhancements

- Convert provinces to vector tiles (if needed)
- Add tile caching
- Implement progressive loading
- Add tile compression
- Support multiple tile sources

