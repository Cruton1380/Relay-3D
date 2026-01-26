# County Loading - Correct Architectural Solutions

## ❌ What We Tried (Wrong Approach)

**Merging 163 GeoJSON files into one giant file:**
- ❌ Creates multi-GB files (unusable)
- ❌ Memory exhaustion (needed --max-old-space-size=8192)
- ❌ No spatial indexing
- ❌ Zero compression
- ❌ Entire file must load into memory
- ❌ Unusable for browsers/mobile/Tauri
- ❌ Breaks version control/CDN caching
- ❌ Makes the problem worse, not better

**This approach is fundamentally flawed and not scalable.**

---

## ✅ The Real Problem

**"How do I load 163 county files efficiently?"**

The issue isn't the number of files - it's **how** we're loading them.

---

## ✅ Solution Path A: Vector Tiles (MVT) - **RECOMMENDED**

**This is the industry-standard solution used by Google Maps, Mapbox, Cesium, and Earth.**

### Why Vector Tiles?
- ✅ Binary compressed (KB–MB instead of GB)
- ✅ Spatially indexed
- ✅ Load only what's visible (viewport-based)
- ✅ Fast decoding
- ✅ Scales to millions of features
- ✅ Total dataset: < 200MB instead of several GB

### Implementation Steps:
1. **Install tippecanoe** (industry standard tool)
2. **Convert GeoJSON to MVT tiles:**
   ```bash
   tippecanoe -z14 -Z0 -o counties.mbtiles \
     --layer=counties \
     --drop-densest-as-needed \
     --extend-zooms-if-still-dropping \
     public/data/boundaries/cities/*.geojson
   ```
3. **Serve tiles via tile server** (mbtiles-server or custom endpoint)
4. **Load tiles in Cesium based on viewport** (only fetch visible tiles)

### Result:
- Loaded on demand
- No memory issues
- Smooth performance
- Scales infinitely

---

## ✅ Solution Path B: Streaming GeoJSON (NDJSON)

**If you must stay with GeoJSON format:**

### Use Newline-Delimited GeoJSON (NDJSON):
- One feature per line
- Stream parse on client
- No giant array wrapper
- Works with fetch streaming

### Implementation:
1. **Convert to NDJSON:**
   ```bash
   for file in *.geojson; do
     jq -c '.features[]' "$file" > "${file%.geojson}.ndjson"
   done
   ```

2. **Stream parse on client:**
   ```javascript
   const response = await fetch('/data/counties.ndjson');
   const reader = response.body.getReader();
   const decoder = new TextDecoder();
   
   while (true) {
     const { done, value } = await reader.read();
     if (done) break;
     
     const lines = decoder.decode(value).split('\n');
     for (const line of lines) {
       if (line.trim()) {
         const feature = JSON.parse(line);
         // Process feature immediately
       }
     }
   }
   ```

### Result:
- Avoids "full JSON parse" memory explosion
- Processes features incrementally
- Better than merged GeoJSON

---

## ✅ Solution Path C: Viewport-Based Loading

**Keep files separate but load smarter (easiest to implement now):**

### Implementation:
1. **Create spatial index (R-tree) of county bounding boxes**
2. **Only load counties that intersect visible viewport**
3. **Load in chunks based on zoom level**

### Example:
```javascript
// Only load counties visible in current viewport
const viewport = viewer.camera.computeViewRectangle();
const visibleCountries = spatialIndex.query(viewport);

// Load only visible countries
for (const countryCode of visibleCountries) {
  await loadCountry(countryCode);
}
```

### Result:
- Responsive system
- Only loads what's needed
- No upfront loading of all 163 files
- Can be implemented quickly

---

## 🎯 Current Status

**What we have now:**
- ✅ `Promise.allSettled` fix (prevents one failure from stopping batch)
- ✅ Individual file loading (works, but loads all 163 files upfront)
- ✅ Parallel batch loading (5 countries at once)

**What we need:**
- Implement one of the three solutions above
- **Recommendation: Vector Tiles (Solution A) for long-term**
- **Recommendation: Viewport-based loading (Solution C) for short-term**

---

## 📋 Next Steps (Ordered Plan)

1. **✅ Step 1: Stop trying to merge GeoJSON files**
   - Removed merge script
   - Removed consolidated file loading code
   - Keep individual file approach for now

2. **Step 2: Decide on solution path**
   - **Short-term:** Implement viewport-based loading (Solution C)
   - **Long-term:** Migrate to Vector Tiles (Solution A)

3. **Step 3: Implement viewport-based fetching**
   - Only load counties visible in current viewport
   - Use bounding-box spatial index
   - Load on camera move/zoom

4. **Step 4: Future migration to Vector Tiles**
   - Convert GeoJSON to MVT tiles
   - Set up tile server
   - Integrate with Cesium tile loading

---

## 🚫 What NOT to Do

- ❌ Don't merge GeoJSON files into one giant file
- ❌ Don't load all 163 files upfront
- ❌ Don't try to optimize GeoJSON at multi-GB scale
- ❌ Don't use consolidated file approach

**The architecture must change, not the file format.**

---

## 📚 Resources

- **tippecanoe:** https://github.com/felt/tippecanoe
- **Mapbox Vector Tiles:** https://docs.mapbox.com/vector-tiles/specification/
- **Cesium 3D Tiles:** https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html
- **NDJSON:** https://github.com/maxogden/ndjson

