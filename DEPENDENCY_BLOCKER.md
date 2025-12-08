# ❌ Dependency Conflict Blocking Vector Tiles

## The Problem

`deck.gl@9.0.0` and `@luma.gl` have incompatible versions that prevent the build:

```
ERROR: No matching export in "@luma.gl/shadertools" for import "gouraudLighting"
ERROR: No matching export in "@luma.gl/core" for import "getTypedArrayFromDataType"
```

## What I Tried

1. ✅ **npm overrides** in `package.json` - Still failed
2. ✅ **Explicit version installation** - Still failed  
3. ✅ **--legacy-peer-deps** - Still failed

## Current Workaround

**Reverted to entity-based county system:**
- `USE_VECTOR_TILES_FOR_COUNTIES = false`
- ~10,000 counties visible (USA, China, India, Brazil, etc.)
- Cesium entity limit still applies

## Options Going Forward

### Option 1: Different Vector Tile Library
Use a different library that doesn't have luma.gl conflicts:
- **Mapbox GL JS** (well-maintained, stable)
- **Leaflet with vector tiles plugin**
- **OpenLayers**

### Option 2: Alternative Deck.gl Approach
- Try `deck.gl@8.x` (older stable version)
- Use pre-built bundle instead of npm packages
- Load deck.gl from CDN

### Option 3: Custom WebGL Renderer
Build a lightweight vector tile renderer using raw WebGL:
- Only need to render lines (county outlines)
- Simpler than full deck.gl
- No complex dependencies

### Option 4: Accept Entity Limits
Keep the entity-based system and:
- Show ~10-15 countries worth of counties (~10k entities)
- Load counties on-demand (only for visible region)
- Use viewport culling

## Recommendation

**Option 1 (Mapbox GL JS)** is the most practical:
- ✅ Battle-tested for large-scale vector tiles
- ✅ No complex dependencies
- ✅ Easy Cesium integration
- ✅ Widely used in production

**Implementation would be:**
1. Add Mapbox GL JS to project
2. Create overlay canvas synced with Cesium
3. Load county vector tiles through Mapbox
4. Keep vote towers in Cesium

## Current Status

✅ **System is working** with entity-based counties  
❌ **Vector tiles blocked** by dependency conflicts  
⏳ **Decision needed** on which path forward

The entity system works fine for now. We can revisit vector tiles when:
1. deck.gl/luma.gl resolve their version conflicts
2. We decide on an alternative library
3. User needs ALL counties visible simultaneously

