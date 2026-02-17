# County Vector Tile Generation Guide

This guide explains how to generate vector tiles (MVT) from the 163 county GeoJSON files.

## Prerequisites

### 1. Install tippecanoe

**Windows (using WSL or Docker):**
```bash
# Option A: Use Docker (recommended for Windows)
docker pull maptiler/tippecanoe

# Option B: Use WSL and install via apt
wsl
sudo apt-get update
sudo apt-get install -y tippecanoe
```

**macOS:**
```bash
brew install tippecanoe
```

**Linux:**
```bash
sudo apt-get install -y tippecanoe
```

### 2. Install mb-util (for exporting MBTiles to folder structure)

**macOS/Linux:**
```bash
pip install mb-util
```

**Windows:**
```bash
pip install mb-util
```

## Step 1: Generate MBTiles

Navigate to your project root and run:

```bash
# Combine all 163 GeoJSON files into vector tiles (MBTiles)
tippecanoe \
  -o counties.mbtiles \
  --layer=adm2 \
  --read-parallel \
  --generate-ids \
  --no-feature-limit \
  --no-tile-size-limit \
  --coalesce-smallest-as-needed \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --minimum-zoom=0 \
  --maximum-zoom=12 \
  public/data/boundaries/cities/*.geojson
```

**What this does:**
- `-o counties.mbtiles`: Output file name
- `--layer=adm2`: Layer name in tiles
- `--read-parallel`: Read files in parallel (faster)
- `--generate-ids`: Generate integer IDs for each feature
- `--no-feature-limit`: Don't limit features per tile
- `--no-tile-size-limit`: Don't limit tile size
- `--coalesce-smallest-as-needed`: Merge small features when needed
- `--drop-densest-as-needed`: Drop dense features at low zooms
- `--extend-zooms-if-still-dropping`: Extend zoom range if dropping features
- `--minimum-zoom=0`: Start at zoom level 0
- `--maximum-zoom=12`: End at zoom level 12 (adjust if needed)

**Expected output:**
- `counties.mbtiles` file (typically 50-200 MB)

## Step 2: Export MBTiles to Folder Structure

Convert the MBTiles file to a folder of individual .pbf tiles:

```bash
# Export to folder structure: {z}/{x}/{y}.pbf
mb-util counties.mbtiles public/tiles/county --image_format=pbf
```

**What this does:**
- Exports MBTiles to `public/tiles/county/` folder
- Creates folder structure: `{z}/{x}/{y}.pbf`
- Each tile is a small .pbf file (typically 1-50 KB)

**Expected output:**
```
public/tiles/county/
├── 0/
│   ├── 0/
│   │   └── 0.pbf
│   └── 1/
│       └── 0.pbf
├── 1/
│   ├── 0/
│   │   ├── 0.pbf
│   │   └── 1.pbf
│   └── ...
└── ...
```

## Step 3: Verify Tiles

### Option A: Test with tileserver-gl (Docker)

```bash
# Run tileserver-gl to preview tiles
docker run --rm -it -p 8080:80 \
  -v $(pwd)/counties.mbtiles:/data/counties.mbtiles \
  klokantech/tileserver-gl

# Open http://localhost:8080 in browser
```

### Option B: Test with local server

If tiles are in `public/tiles/county/`, Vite will serve them automatically at:
- `http://localhost:5175/tiles/county/{z}/{x}/{y}.pbf`

## Step 4: Production Hosting

### Option A: S3 + CloudFront (Recommended)

1. Upload `public/tiles/county/` to S3 bucket
2. Set bucket as public or use CloudFront
3. Enable CORS on bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
4. Create CloudFront distribution
5. Update URL template in code:
   ```javascript
   urlTemplate: 'https://cdn.example.com/tiles/county/{z}/{x}/{y}.pbf'
   ```

### Option B: Serve MBTiles directly (tileserver-gl)

1. Deploy tileserver-gl to your server
2. Serve `counties.mbtiles` file
3. Update URL template:
   ```javascript
   urlTemplate: 'https://tiles.example.com/counties/{z}/{x}/{y}.pbf'
   ```

## Troubleshooting

### Issue: Tippecanoe fails with "out of memory"
**Solution:** Process files in batches or increase system memory

### Issue: Tiles are too large (>500 KB)
**Solution:** Increase `--drop-densest-as-needed` or reduce `--maximum-zoom`

### Issue: Features missing at low zoom
**Solution:** Adjust `--coalesce-smallest-as-needed` or `--drop-densest-as-needed`

### Issue: CORS errors when loading tiles
**Solution:** Ensure CORS headers are set on tile server

## Performance Tips

1. **Tile size:** Keep individual tiles under 500 KB
2. **Zoom levels:** Use 0-12 for most use cases (adjust if needed)
3. **Simplification:** Let tippecanoe simplify at low zooms automatically
4. **CDN:** Use CloudFront or similar CDN for fast global delivery

## Next Steps

After generating tiles:
1. Update `CountyVectorTileManager` URL template if using custom hosting
2. Test tile loading in development
3. Verify click/hover events work
4. Monitor performance and memory usage

