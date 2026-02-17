# 🗺️ Generate County Vector Tiles - STEP-BY-STEP GUIDE

## ✅ What This Does
Converts 163 separate county GeoJSON files into a single vector tile set (.pbf tiles) that:
- Shows ALL 50k+ counties globally
- Loads on-demand (only visible tiles)
- No memory issues
- No Cesium entity limits
- Fast and production-ready

---

## 📦 Required Tools

### 1. Install tippecanoe (Vector Tile Generator)
**Mac:**
```bash
brew install tippecanoe
```

**Windows (WSL/Ubuntu):**
```bash
sudo apt-get install -y git build-essential libsqlite3-dev zlib1g-dev
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
sudo make install
```

### 2. Install mb-util (MBTiles Extractor)
```bash
pip install mbutil
# or
pip3 install mbutil
```

---

## 🔧 Step 1: Generate Vector Tiles

Navigate to your project root and run:

```bash
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"

tippecanoe \
  -o public/tiles/counties.mbtiles \
  --layer=adm2 \
  --read-parallel \
  --generate-ids \
  --no-feature-limit \
  --no-tile-size-limit \
  --maximum-zoom=12 \
  --minimum-zoom=0 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --name="County Boundaries" \
  --attribution="Your Attribution" \
  public/data/boundaries/cities/*.geojson
```

**What this does:**
- Reads all 163 county GeoJSON files
- Generates a single `.mbtiles` file (SQLite database of tiles)
- Layer name: `adm2` (match your source layer config)
- Zoom levels: 0-12 (global to local)
- Auto-simplifies geometry at lower zooms

**Expected output:**
```
163 files read
Processing 50,000+ features...
Zoom 0: 1 tile
Zoom 1: 4 tiles
...
Zoom 12: 16,384 tiles
counties.mbtiles created (200-300 MB)
```

---

## 🔧 Step 2: Extract Tiles to Folder

Mapbox GL JS needs individual `.pbf` files, not `.mbtiles`:

```bash
mb-util public/tiles/counties.mbtiles public/tiles/county --image_format=pbf
```

**What this does:**
- Extracts `.mbtiles` → folder structure
- Creates: `public/tiles/county/{z}/{x}/{y}.pbf`

**Expected output:**
```
public/tiles/county/
  0/
    0/
      0.pbf
  1/
    0/
      0.pbf
      1.pbf
    1/
      0.pbf
      1.pbf
  ...
  12/
    (thousands of .pbf files)
```

---

## 🔧 Step 3: Verify Tiles Exist

```bash
ls public/tiles/county/0/0/0.pbf
ls public/tiles/county/1/0/0.pbf
ls public/tiles/county/12/ | wc -l
```

You should see:
- ✅ `0.pbf` exists at zoom 0
- ✅ Multiple tiles at zoom 1+
- ✅ Thousands of tiles at zoom 12

---

## 🚀 Step 4: Start Frontend

The Mapbox system is ALREADY INTEGRATED in the code. Just start the frontend:

```bash
npm run dev:frontend
```

**What will happen:**
1. InteractiveGlobe.jsx loads with `USE_MAPBOX_VECTOR_TILES = true`
2. MapboxCesiumOverlay creates a Mapbox GL JS canvas on Cesium
3. MapboxCountyManager loads tiles from `/tiles/county/{z}/{x}/{y}.pbf`
4. Click "county" button → ALL counties appear instantly

---

## 🧪 Step 5: Test in Browser

1. Open http://localhost:5175
2. Click the **"county"** button
3. You should see:
   - ✅ Console: `🗺️ [Mapbox] ALL county boundaries shown globally`
   - ✅ Yellow outlines for ALL counties worldwide
   - ✅ Tiles load as you zoom/pan
   - ✅ No "Cesium entity limit" warnings

---

## 🔍 Troubleshooting

### ❌ "Failed to fetch tile"
- Check that `/tiles/county/0/0/0.pbf` exists
- Verify Vite is serving `/public/` as static files

### ❌ "Layer source 'county-tiles' not found"
- Tiles might not have been generated
- Re-run tippecanoe → mb-util

### ❌ No counties visible
- Open DevTools → Network → Filter by "pbf"
- If you see `404` errors, tiles weren't extracted correctly
- If you see `200` but no display, check console for Mapbox errors

### ❌ tippecanoe not found
- Install it (see above)
- Verify: `tippecanoe --version`

---

## 📊 Expected File Sizes

- **counties.mbtiles:** 200-300 MB (SQLite database)
- **public/tiles/county/ folder:** 200-300 MB (extracted .pbf files)
- **Individual .pbf tiles:** 1 KB - 500 KB each

---

## ✅ Summary

**Before (entity-based):**
- ❌ Only USA + China load
- ❌ 50k+ entities crash Cesium
- ❌ 10+ minutes to load
- ❌ Memory issues

**After (Mapbox vector tiles):**
- ✅ ALL counties load
- ✅ GPU-accelerated rendering
- ✅ Loads instantly (on-demand)
- ✅ Production-ready

---

## 🎯 Next Steps

After generating tiles:
1. Verify ALL counties display
2. Test zoom in/out (tiles load dynamically)
3. Test click/hover (if needed, extend with query features)
4. Deploy tiles to CDN (optional, for production)

---

**Ready to generate tiles? Run the commands above!** 🚀

