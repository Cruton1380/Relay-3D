# County Loading Architecture - Correct Approach

## ❌ What We Tried (Wrong Approach)

**Merging 163 GeoJSON files into one giant file:**
- Creates multi-GB files
- Unusable for browsers/mobile
- Memory exhaustion
- No spatial indexing
- Zero compression
- Entire file must load into memory

**This approach is fundamentally flawed and not scalable.**

---

## ✅ The Real Problem

**"How do I load 163 county files efficiently?"**

The issue isn't the number of files - it's **how** we're loading them.

---

## ✅ Solution Path A: Vector Tiles (MVT) - **RECOMMENDED**

**This is the industry-standard solution for county-level detail.**

### Why Vector Tiles?
- ✅ Binary compressed (KB–MB instead of GB)
- ✅ Spatially indexed
- ✅ Load only what's visible
- ✅ Fast decoding
- ✅ Used by Google Maps, Mapbox, Cesium, Earth
- ✅ Scales to millions of features

### Implementation:
1. **Convert GeoJSON to MVT tiles using tippecanoe:**
   ```bash
   tippecanoe -z14 -Z0 -o counties.mbtiles \
     --layer=counties \
     --drop-densest-as-needed \
     --extend-zooms-if-still-dropping \
     public/data/boundaries/cities/*.geojson
   ```

2. **Serve tiles via tile server** (e.g., `mbtiles-server` or custom endpoint)

3. **Load tiles in Cesium based on viewport:**
   - Only fetch tiles for visible zoom level
   - Only fetch tiles for visible region
   - Automatic caching

### Result:
- Total dataset: < 200MB instead of several GB
- Loaded on demand
- No memory issues
- Smooth performance

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
   # Convert each GeoJSON file to NDJSON
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

**Keep files separate but load smarter:**

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

---

## 🎯 Current Status

**What we have now:**
- ✅ `Promise.allSettled` fix (prevents one failure from stopping batch)
- ✅ Individual file loading (works, but loads all 163 files)
- ✅ Parallel batch loading (5 countries at once)

**What we need:**
- Implement one of the three solutions above
- **Recommendation: Vector Tiles (Solution A)**

---

## 📋 Next Steps

1. **Short-term:** Keep current individual file loading with `Promise.allSettled` fix
2. **Medium-term:** Implement viewport-based loading (Solution C) - easiest to add
3. **Long-term:** Migrate to Vector Tiles (Solution A) - best performance

---

## 🚫 What NOT to Do

- ❌ Don't merge GeoJSON files into one giant file
- ❌ Don't load all 163 files upfront
- ❌ Don't try to optimize GeoJSON at multi-GB scale

**The architecture must change, not the file format.**

