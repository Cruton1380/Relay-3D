/**
 * Node.js Vector Tile Generator
 * Generates Mapbox Vector Tiles (.pbf) from GeoJSON files
 * Alternative to tippecanoe (works on Windows without WSL)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🗺️  Generating County Vector Tiles (Node.js)...\n');

const config = {
  sourceDir: path.join(projectRoot, 'public', 'data', 'boundaries', 'cities'),
  outputDir: path.join(projectRoot, 'public', 'tiles', 'county'),
  layerName: 'adm2',
  minZoom: 0,
  maxZoom: 12,
  tolerance: 3, // Simplification tolerance
  extent: 4096, // Tile extent
  buffer: 64, // Tile buffer
};

async function loadGeoJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

function createTileIndex(geojson) {
  return geojsonvt(geojson, {
    maxZoom: config.maxZoom,
    tolerance: config.tolerance,
    extent: config.extent,
    buffer: config.buffer,
    indexMaxZoom: config.maxZoom,
    indexMaxPoints: 100000,
    promoteId: 'GID_2', // Use county ID as feature ID
  });
}

async function saveTile(z, x, y, tileData) {
  const tileDir = path.join(config.outputDir, String(z), String(x));
  const tilePath = path.join(tileDir, `${y}.pbf`);

  try {
    await fs.ensureDir(tileDir);

    // Encode tile as Protocol Buffer
    const layers = {};
    layers[config.layerName] = tileData;
    const pbf = vtpbf.fromGeojsonVt(layers, { version: 2 });

    // Compress with gzip
    const compressed = zlib.gzipSync(Buffer.from(pbf));

    await fs.writeFile(tilePath, compressed);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save tile ${z}/${x}/${y}:`, error.message);
    return false;
  }
}

async function generateTilesForCountry(filePath, countryCode) {
  console.log(`📂 Processing: ${countryCode}...`);

  const geojson = await loadGeoJSON(filePath);
  if (!geojson) return 0;

  // Create tile index
  const tileIndex = createTileIndex(geojson);
  let tileCount = 0;

  // Generate tiles for all zoom levels
  for (let z = config.minZoom; z <= config.maxZoom; z++) {
    const tilesAtZoom = tileIndex.tileCoords.filter(tc => tc.z === z);
    
    for (const coord of tilesAtZoom) {
      const tile = tileIndex.getTile(coord.z, coord.x, coord.y);
      if (tile && tile.features && tile.features.length > 0) {
        const saved = await saveTile(coord.z, coord.x, coord.y, tile);
        if (saved) tileCount++;
      }
    }
  }

  console.log(`   ✅ Generated ${tileCount} tiles for ${countryCode}`);
  return tileCount;
}

async function mergeAllCountries() {
  console.log('🌍 Merging all countries into a single GeoJSON...\n');

  const files = await glob('*.geojson', { cwd: config.sourceDir });
  console.log(`📦 Found ${files.length} GeoJSON files\n`);

  let allFeatures = [];
  let processedFiles = 0;

  for (const file of files) {
    const filePath = path.join(config.sourceDir, file);
    const geojson = await loadGeoJSON(filePath);
    
    if (geojson && geojson.features) {
      allFeatures = allFeatures.concat(geojson.features);
      processedFiles++;
      
      if (processedFiles % 10 === 0) {
        console.log(`   Merged ${processedFiles}/${files.length} files... (${allFeatures.length} features)`);
      }
    }
  }

  console.log(`\n✅ Merged ${allFeatures.length} features from ${processedFiles} files\n`);

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
}

async function generateAllTiles() {
  console.log('🔧 Generating tiles from merged GeoJSON...\n');

  // Merge all countries
  const mergedGeoJSON = await mergeAllCountries();

  // Create tile index
  console.log('📊 Creating tile index...');
  const tileIndex = createTileIndex(mergedGeoJSON);
  console.log(`✅ Tile index created\n`);

  // Generate tiles for all zoom levels
  let totalTiles = 0;

  for (let z = config.minZoom; z <= config.maxZoom; z++) {
    console.log(`📦 Generating zoom level ${z}...`);
    let tilesAtZoom = 0;

    // Get all tile coordinates at this zoom
    const maxTile = Math.pow(2, z);
    
    for (let x = 0; x < maxTile; x++) {
      for (let y = 0; y < maxTile; y++) {
        const tile = tileIndex.getTile(z, x, y);
        
        if (tile && tile.features && tile.features.length > 0) {
          const saved = await saveTile(z, x, y, tile);
          if (saved) {
            tilesAtZoom++;
            totalTiles++;
          }
        }
      }
    }

    console.log(`   ✅ Zoom ${z}: ${tilesAtZoom} tiles\n`);
  }

  return totalTiles;
}

async function main() {
  try {
    console.log('⚙️  Configuration:');
    console.log(`   Source: ${config.sourceDir}`);
    console.log(`   Output: ${config.outputDir}`);
    console.log(`   Layer: ${config.layerName}`);
    console.log(`   Zoom: ${config.minZoom} to ${config.maxZoom}\n`);

    // Clear output directory
    console.log('🧹 Cleaning output directory...');
    await fs.remove(config.outputDir);
    await fs.ensureDir(config.outputDir);
    console.log('✅ Output directory ready\n');

    // Generate tiles
    const startTime = Date.now();
    const totalTiles = await generateAllTiles();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 SUCCESS!');
    console.log(`   Total tiles: ${totalTiles}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Output: ${config.outputDir}\n`);

    // Verify critical tiles exist
    console.log('🔍 Verifying tiles...');
    const tile000 = path.join(config.outputDir, '0', '0', '0.pbf');
    if (await fs.pathExists(tile000)) {
      console.log('✅ Zoom 0 tile exists\n');
    } else {
      console.log('❌ Zoom 0 tile missing!\n');
    }

    console.log('✅ Tiles ready for Mapbox GL JS!');
    console.log('\nNext steps:');
    console.log('  1. npm run dev:frontend (if not running)');
    console.log('  2. Open http://localhost:5175');
    console.log('  3. Click "county" button');
    console.log('  4. See ALL counties globally! 🌍\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

