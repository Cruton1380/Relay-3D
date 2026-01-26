# MapLibre 2D vs 3D Draping - Technical Limitation

## ✅ What's Working

1. **Counties are loading** - All 158 countries loading successfully
2. **Per-country sources** - Each country has its own source/layer (avoids 46k+ feature limit)
3. **Parallel batch loading** - Loading 10 countries at a time (much faster than sequential)
4. **Camera sync** - MapLibre camera syncs with Cesium globe camera
5. **Visible rendering** - Yellow county fills are visible on the globe

## ⚠️ Technical Limitation: 2D Overlay vs 3D Draping

**MapLibre GL JS is a 2D map library.** It renders as a flat canvas overlay, not as a 3D-draped texture on the globe surface.

### Why Counties Appear 2D

- MapLibre renders to a **2D HTML5 canvas**
- This canvas is positioned as an **overlay** on top of Cesium
- The camera syncs, so the 2D overlay follows the 3D globe rotation
- But the counties themselves remain **flat/2D**, not draped on the globe surface

### What "3D Draping" Would Require

To get true 3D draping (counties following the globe's curvature), we would need:

1. **Cesium Entities** (what we tried originally)
   - ✅ True 3D draping
   - ❌ Hits Cesium's ~50k entity limit
   - ❌ Only USA/China loaded before limit

2. **Vector Tiles with deck.gl** (what we tried next)
   - ✅ True 3D draping
   - ✅ Handles millions of features
   - ❌ Unresolvable `deck.gl`/`luma.gl` dependency conflicts

3. **MapLibre GL JS** (current solution)
   - ✅ No dependency conflicts
   - ✅ Handles all counties
   - ✅ Fast rendering
   - ❌ **2D overlay only** (not 3D draped)

## 🚀 Optimizations Applied

### 1. Parallel Batch Loading
**Before:** Sequential (one country at a time)
```javascript
for (const code of countryCodes) {
  await fetch(...); // Wait for each
}
```

**After:** Parallel batches (10 countries at once)
```javascript
for (let i = 0; i < countryCodes.length; i += 10) {
  const batch = countryCodes.slice(i, i + 10);
  await Promise.allSettled(batch.map(...)); // Load 10 in parallel
}
```

**Result:** ~10x faster loading (158 countries in ~16 batches vs 158 sequential requests)

### 2. Per-Country Sources
**Before:** One giant source with 46,999 features
- MapLibre silently dropped the layer

**After:** 158 separate sources (one per country)
- Each source has manageable size (~37-5,570 features)
- MapLibre renders each source independently

## 📊 Current Status

- ✅ **Loading:** All 158 countries loading in parallel batches
- ✅ **Rendering:** Counties visible as yellow fills
- ✅ **Performance:** Fast rendering, no entity limits
- ⚠️ **Appearance:** 2D overlay (not 3D draped)

## 🎯 Options Moving Forward

### Option A: Accept 2D Overlay (Current)
- Counties are visible and functional
- Camera syncs with globe
- Fast and reliable
- **Limitation:** Appears flat, not draped

### Option B: Return to Cesium Entities
- True 3D draping
- **Problem:** Only ~2 countries load before hitting entity limit

### Option C: Resolve deck.gl Dependencies
- True 3D draping with vector tiles
- **Problem:** Complex dependency conflicts with `luma.gl`

### Option D: Hybrid Approach
- Use MapLibre for global outlines (2D overlay)
- Spawn Cesium entities dynamically for counties near mouse (3D draped)
- **Complexity:** High, requires careful coordination

## 💡 Recommendation

**For now, keep the 2D overlay approach:**
- It works reliably
- All counties load
- Fast performance
- Camera syncs with globe

**The counties are functional and visible** - they just appear as a 2D overlay rather than 3D draped. This is a visual limitation, not a functional one.

If true 3D draping is critical, we would need to resolve the `deck.gl` dependency conflicts or implement the hybrid approach.

