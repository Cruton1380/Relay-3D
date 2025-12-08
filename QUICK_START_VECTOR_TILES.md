# Quick Start: Vector Tiles for Counties

## ✅ Implementation Complete

All code files have been created. Here's what to do next:

## Step 1: Install Dependencies

```bash
npm install "@deck.gl/core@^9.0.0" "@deck.gl/layers@^9.0.0" "@deck.gl/geo-layers@^9.0.0" "@deck.gl/cesium@^9.0.0"
```

## Step 2: Generate Vector Tiles

**Prerequisites:**
- Install tippecanoe (see `scripts/generate-county-tiles.md`)
- Install mb-util: `pip install mb-util`

**Generate tiles:**
```bash
# Generate MBTiles from all county GeoJSON files
tippecanoe -o counties.mbtiles \
  --layer=adm2 \
  --read-parallel \
  --generate-ids \
  --no-feature-limit \
  --no-tile-size-limit \
  --maximum-zoom=12 \
  public/data/boundaries/cities/*.geojson

# Export to folder structure
mb-util counties.mbtiles public/tiles/county --image_format=pbf
```

## Step 3: Integrate with InteractiveGlobe

Update `src/frontend/components/main/globe/InteractiveGlobe.jsx`:

1. **Import the new hook and integration:**
```javascript
import { createDeckGlOverlay } from './integrations/DeckGlCesiumIntegration';
import { useCountyVectorTiles } from './useCountyVectorTiles';
```

2. **Add deck overlay ref:**
```javascript
const deckOverlayRef = useRef(null);
```

3. **Initialize deck overlay after viewer is created:**
```javascript
useEffect(() => {
  if (viewerRef.current && cesiumContainerRef.current) {
    deckOverlayRef.current = createDeckGlOverlay(
      viewerRef.current,
      cesiumContainerRef.current
    );
  }
}, [viewerRef.current]);
```

4. **Replace useCountySystemV2 with useCountyVectorTiles:**
```javascript
// OLD:
// const { loadCounties } = useCountySystemV2();

// NEW:
const {
  initializeCountySystem,
  showCounties,
  hideCounties,
  isVisible
} = useCountyVectorTiles(viewerRef, deckOverlayRef);
```

5. **Initialize and show counties:**
```javascript
// Initialize when ready
useEffect(() => {
  if (viewerRef.current && deckOverlayRef.current) {
    initializeCountySystem(viewerRef.current, deckOverlayRef.current, {
      urlTemplate: '/tiles/county/{z}/{x}/{y}.pbf',
      onClick: handleCountyClick,
      onHover: handleCountyHover
    });
  }
}, [viewerRef.current, deckOverlayRef.current]);

// Show/hide based on cluster level
useEffect(() => {
  if (clusterLevel === 'county') {
    showCounties();
  } else {
    hideCounties();
  }
}, [clusterLevel, showCounties, hideCounties]);
```

6. **Bridge events to RegionHoverSystem:**
```javascript
const handleCountyClick = ({ properties, featureId }) => {
  if (regionManagerRef.current?.hoverSystem) {
    regionManagerRef.current.hoverSystem.handleRegionClick({
      type: 'county',
      properties,
      featureId
    });
  }
};

const handleCountyHover = ({ properties, featureId }) => {
  if (regionManagerRef.current?.hoverSystem) {
    regionManagerRef.current.hoverSystem.handleRegionHover({
      type: 'county',
      properties,
      featureId
    });
  }
};
```

## Files Created

✅ `src/frontend/components/main/globe/layers/CountyVectorTileLayer.js`
✅ `src/frontend/components/main/globe/managers/CountyVectorTileManager.js`
✅ `src/frontend/components/main/globe/integrations/DeckGlCesiumIntegration.js`
✅ `src/frontend/components/main/globe/useCountyVectorTiles.js`
✅ `scripts/generate-county-tiles.md` (tile generation guide)
✅ `VECTOR_TILES_IMPLEMENTATION.md` (full documentation)

## Testing

1. **Generate tiles** (Step 2 above)
2. **Start dev server:** `npm run dev:frontend`
3. **Select "County" cluster level**
4. **Verify:**
   - Counties render on globe
   - Only visible counties load (viewport-based)
   - Click events work
   - Hover events work
   - Performance is smooth (60 FPS)
   - Memory usage is low

## Troubleshooting

**Tiles not loading:**
- Check `public/tiles/county/` folder exists
- Verify tiles are at correct path
- Check browser network tab for 404s
- Ensure CORS headers if using external hosting

**Counties not visible:**
- Verify `deckOverlayRef.current` exists
- Check layer is added to deck overlay
- Verify camera sync is working
- Check console for errors

**Click/hover not working:**
- Verify `pickable: true` on layer
- Check event handlers are connected
- Verify feature properties exist

## Next Steps

1. Generate tiles
2. Test integration
3. Deploy to staging
4. Monitor performance
5. Roll out to production

See `VECTOR_TILES_IMPLEMENTATION.md` for full details.

