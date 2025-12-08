# PowerShell script to generate county vector tiles
# This script automates the tippecanoe + mb-util process

Write-Host "🗺️ Generating County Vector Tiles..." -ForegroundColor Cyan
Write-Host ""

# Check if tippecanoe is installed
Write-Host "Checking for tippecanoe..." -ForegroundColor Yellow
$tippecanoePath = Get-Command tippecanoe -ErrorAction SilentlyContinue
if (-not $tippecanoePath) {
    Write-Host "❌ tippecanoe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install tippecanoe first:" -ForegroundColor Yellow
    Write-Host "  Option 1 (WSL): sudo apt-get install tippecanoe" -ForegroundColor White
    Write-Host "  Option 2 (Build from source): See GENERATE_VECTOR_TILES.md" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "✅ tippecanoe found" -ForegroundColor Green

# Check if mb-util is installed
Write-Host "Checking for mb-util..." -ForegroundColor Yellow
$mbutilPath = Get-Command mb-util -ErrorAction SilentlyContinue
if (-not $mbutilPath) {
    Write-Host "❌ mb-util not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install mb-util first:" -ForegroundColor Yellow
    Write-Host "  pip install mbutil" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "✅ mb-util found" -ForegroundColor Green
Write-Host ""

# Create output directory
$tilesDir = "public\tiles"
if (-not (Test-Path $tilesDir)) {
    New-Item -ItemType Directory -Path $tilesDir -Force | Out-Null
    Write-Host "✅ Created directory: $tilesDir" -ForegroundColor Green
}

# Step 1: Generate MBTiles
Write-Host "📦 Step 1: Generating MBTiles from 163 GeoJSON files..." -ForegroundColor Cyan
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

$sourceFiles = "public\data\boundaries\cities\*.geojson"
$mbtiles = "public\tiles\counties.mbtiles"

tippecanoe `
  -o $mbtiles `
  --layer=adm2 `
  --read-parallel `
  --generate-ids `
  --no-feature-limit `
  --no-tile-size-limit `
  --maximum-zoom=12 `
  --minimum-zoom=0 `
  --drop-densest-as-needed `
  --extend-zooms-if-still-dropping `
  --force `
  $sourceFiles

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ tippecanoe failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ MBTiles generated: $mbtiles" -ForegroundColor Green

# Get file size
$mbtilesSize = (Get-Item $mbtiles).Length / 1MB
Write-Host "   Size: $([math]::Round($mbtilesSize, 2)) MB" -ForegroundColor White
Write-Host ""

# Step 2: Extract to folder
Write-Host "📂 Step 2: Extracting tiles to folder..." -ForegroundColor Cyan
Write-Host ""

$tilesFolder = "public\tiles\county"
if (Test-Path $tilesFolder) {
    Write-Host "   Removing old tiles..." -ForegroundColor Yellow
    Remove-Item -Path $tilesFolder -Recurse -Force
}

mb-util $mbtiles $tilesFolder --image_format=pbf

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ mb-util failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tiles extracted to: $tilesFolder" -ForegroundColor Green

# Count tiles
$tileCount = (Get-ChildItem -Path $tilesFolder -Recurse -Filter "*.pbf").Count
Write-Host "   Total .pbf files: $tileCount" -ForegroundColor White
Write-Host ""

# Verify critical tiles exist
Write-Host "🔍 Verifying tiles..." -ForegroundColor Cyan
$tile000 = "$tilesFolder\0\0\0.pbf"
if (Test-Path $tile000) {
    Write-Host "✅ Zoom 0 tile exists" -ForegroundColor Green
} else {
    Write-Host "❌ Zoom 0 tile missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 SUCCESS! Vector tiles generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm run dev:frontend" -ForegroundColor White
Write-Host "  2. Open http://localhost:5175" -ForegroundColor White
Write-Host "  3. Click 'county' button" -ForegroundColor White
Write-Host "  4. You should see ALL counties globally!" -ForegroundColor White
Write-Host ""

