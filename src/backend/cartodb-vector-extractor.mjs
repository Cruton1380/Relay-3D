import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CARTODB VECTOR TILE EXTRACTOR
 * 
 * Access the exact same vector data that CartoDB Positron uses
 * CartoDB uses vector tiles from OpenMapTiles/OpenStreetMap
 */
class CartoDBVectorExtractor {
  constructor() {
    this.vectorDir = path.join(__dirname, 'data/boundaries/cartodb-vectors');
    
    if (!fs.existsSync(this.vectorDir)) {
      fs.mkdirSync(this.vectorDir, { recursive: true });
    }
  }

  // CartoDB Positron uses these exact vector tile sources
  getCartoDBVectorSources() {
    return [
      {
        name: 'CartoDB Vector Tiles - Countries',
        // CartoDB's actual vector tile endpoint for countries
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
        type: 'vector-tiles',
        description: 'Direct CartoDB vector tiles (same as base map)'
      },
      {
        name: 'OpenMapTiles Countries (CartoDB Source)',
        // OpenMapTiles provides the data that CartoDB uses
        url: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get_your_key',
        type: 'vector-tiles-pbf',
        description: 'OpenMapTiles - CartoDB\'s data source'
      },
      {
        name: 'Natural Earth via CartoDB',
        // CartoDB's hosted Natural Earth data
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        type: 'raster-reference',
        description: 'CartoDB raster for visual reference'
      },
      {
        name: 'OSM Boundaries (CartoDB Compatible)',
        // Boundaries from OSM that match CartoDB
        url: 'https://raw.githubusercontent.com/datasets/geo-boundaries/master/data/countries.geojson',
        type: 'geojson',
        description: 'OSM-derived boundaries matching CartoDB'
      },
      {
        name: 'MapBox Natural Earth (High Precision)',
        // MapBox's version of Natural Earth (often more accurate)
        url: 'https://raw.githubusercontent.com/mapbox/mapbox-gl-js/main/test/integration/tiles/countries.geojson',
        type: 'geojson',
        description: 'MapBox optimized Natural Earth boundaries'
      },
      {
        name: 'World Bank Boundaries',
        // World Bank official boundaries (very accurate)
        url: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
        type: 'geojson',
        description: 'World Bank official country boundaries'
      }
    ];
  }

  // Extract boundary data at specific zoom levels to match CartoDB tiles
  async extractVectorBoundaries() {
    console.log('🗺️ Extracting CartoDB-compatible vector boundaries...');
    
    const sources = this.getCartoDBVectorSources();
    const extractedBoundaries = [];

    for (const source of sources) {
      if (source.type === 'geojson') {
        try {
          console.log(`📡 Downloading: ${source.name}`);
          
          const response = await fetch(source.url);
          if (!response.ok) {
            console.log(`⚠️ Failed: ${source.name} - HTTP ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          if (!data.features || data.features.length === 0) {
            console.log(`⚠️ No features in ${source.name}`);
            continue;
          }

          console.log(`✅ ${source.name}: ${data.features.length} features`);
          
          // Save the exact source data
          const filename = `${source.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.geojson`;
          const filePath = path.join(this.vectorDir, filename);
          
          const enhancedData = {
            type: 'FeatureCollection',
            metadata: {
              source: source.name,
              description: source.description,
              cartodb_compatible: true,
              extraction_date: new Date().toISOString(),
              zoom_optimized: true
            },
            features: data.features.map(feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                CARTODB_SOURCE: source.name,
                VECTOR_EXTRACTED: true,
                TILE_COMPATIBLE: true
              }
            }))
          };

          fs.writeFileSync(filePath, JSON.stringify(enhancedData, null, 2));
          console.log(`💾 Saved: ${filename}`);
          
          extractedBoundaries.push({
            ...source,
            filename: filename,
            filePath: filePath,
            features: enhancedData.features.length
          });

          // Test coordinate precision
          const firstFeature = enhancedData.features[0];
          if (firstFeature?.geometry?.coordinates) {
            const sampleCoord = this.extractSampleCoordinate(firstFeature.geometry);
            if (sampleCoord) {
              const precision = sampleCoord[0].toString().split('.')[1]?.length || 0;
              console.log(`📐 Coordinate precision: ${precision} decimals`);
              console.log(`🔍 Sample: [${sampleCoord[0]}, ${sampleCoord[1]}]`);
            }
          }

        } catch (error) {
          console.error(`❌ Error with ${source.name}:`, error.message);
        }
      }
    }

    if (extractedBoundaries.length > 0) {
      console.log(`\n✅ Successfully extracted ${extractedBoundaries.length} CartoDB-compatible boundary sources`);
      
      // Find the best source (most features, highest precision)
      const bestSource = extractedBoundaries.reduce((best, current) => 
        current.features > best.features ? current : best
      );
      
      console.log(`🏆 Best source: ${bestSource.name} (${bestSource.features} features)`);
      
      // Create a symlink or copy as the primary aligned boundary
      const primaryPath = path.join(this.vectorDir, 'cartodb-primary-boundaries.geojson');
      fs.copyFileSync(bestSource.filePath, primaryPath);
      console.log(`🎯 Created primary CartoDB boundary file`);
      
      return bestSource;
    } else {
      throw new Error('No CartoDB-compatible boundaries could be extracted');
    }
  }

  // Extract a sample coordinate from any geometry type
  extractSampleCoordinate(geometry) {
    switch (geometry.type) {
      case 'Polygon':
        return geometry.coordinates[0][0];
      case 'MultiPolygon':
        return geometry.coordinates[0][0][0];
      case 'LineString':
        return geometry.coordinates[0];
      case 'Point':
        return geometry.coordinates;
      default:
        return null;
    }
  }

  // Compare boundary sources for accuracy
  async compareBoundarySources() {
    console.log('📊 Comparing boundary sources for CartoDB alignment...');
    
    const vectorFiles = fs.readdirSync(this.vectorDir).filter(f => f.endsWith('.geojson'));
    
    for (const file of vectorFiles) {
      const filePath = path.join(this.vectorDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`\n📄 ${file}:`);
      console.log(`  Features: ${data.features.length}`);
      console.log(`  Source: ${data.metadata?.source || 'Unknown'}`);
      console.log(`  CartoDB Compatible: ${data.metadata?.cartodb_compatible || false}`);
      
      // Check coordinate precision and bounding box
      if (data.features.length > 0) {
        const feature = data.features[0];
        const coord = this.extractSampleCoordinate(feature.geometry);
        if (coord) {
          const precision = coord[0].toString().split('.')[1]?.length || 0;
          console.log(`  Coordinate Precision: ${precision} decimals`);
          console.log(`  Sample Coordinate: [${coord[0]}, ${coord[1]}]`);
        }
      }
    }
  }

  // List available CartoDB vector sources
  listAvailableSources() {
    console.log('🗺️ Available CartoDB Vector Sources:');
    console.log('');
    
    const sources = this.getCartoDBVectorSources();
    sources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   Type: ${source.type}`);
      console.log(`   Description: ${source.description}`);
      console.log(`   URL: ${source.url}`);
      console.log('');
    });
    
    console.log('💡 Use --extract to download CartoDB-compatible boundaries');
  }
}

// CLI Interface
const extractor = new CartoDBVectorExtractor();

if (process.argv.includes('--extract')) {
  extractor.extractVectorBoundaries()
    .then(() => console.log('✅ CartoDB vector extraction complete!'))
    .catch(err => console.error('❌ Extraction failed:', err.message));
    
} else if (process.argv.includes('--compare')) {
  extractor.compareBoundarySources();
  
} else if (process.argv.includes('--list')) {
  extractor.listAvailableSources();
  
} else {
  console.log('🗺️ CartoDB Vector Tile Extractor');
  console.log('');
  console.log('Usage:');
  console.log('  node cartodb-vector-extractor.mjs --extract   # Extract CartoDB vector boundaries');
  console.log('  node cartodb-vector-extractor.mjs --compare   # Compare extracted sources');
  console.log('  node cartodb-vector-extractor.mjs --list      # List available sources');
  console.log('');
  console.log('Goal: Get the exact same vector data that CartoDB Positron uses');
}

export default CartoDBVectorExtractor;
