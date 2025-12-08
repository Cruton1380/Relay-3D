import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * BOUNDARY TILE SERVICE
 * 
 * Preprocesses geographic boundaries into tile-like chunks for fast loading
 * Similar to how map tile servers work - pre-generated, cached, fast delivery
 */
class BoundaryTileService {
  constructor() {
    this.tileCache = new Map();
    this.tileDir = path.join(__dirname, '../data/boundary-tiles');
    this.ensureTileDirectory();
    
    // Tile configuration
    this.tileConfig = {
      zoomLevels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      tileSize: 256, // Standard tile size
      maxFeaturesPerTile: 100, // Limit features per tile for performance
      cacheTimeout: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  /**
   * Ensure tile directory exists
   */
  ensureTileDirectory() {
    if (!fs.existsSync(this.tileDir)) {
      fs.mkdirSync(this.tileDir, { recursive: true });
      console.log(`📁 Created boundary tile directory: ${this.tileDir}`);
    }
  }

  /**
   * Get boundary tile for specific zoom/x/y coordinates
   */
  async getBoundaryTile(type, zoom, x, y, country = null) {
    const tileKey = this.generateTileKey(type, zoom, x, y, country);
    
    // Check memory cache first
    const cached = this.tileCache.get(tileKey);
    if (cached && Date.now() - cached.timestamp < this.tileConfig.cacheTimeout) {
      return cached.data;
    }

    // Check disk cache
    const tilePath = this.getTilePath(type, zoom, x, y, country);
    if (fs.existsSync(tilePath)) {
      try {
        const tileData = JSON.parse(fs.readFileSync(tilePath, 'utf8'));
        this.tileCache.set(tileKey, { data: tileData, timestamp: Date.now() });
        return tileData;
      } catch (error) {
        console.warn(`⚠️ Error reading tile cache: ${error.message}`);
      }
    }

    // Generate tile on-demand
    const tileData = await this.generateBoundaryTile(type, zoom, x, y, country);
    
    // Cache to disk
    this.saveTileToDisk(tilePath, tileData);
    
    // Cache to memory
    this.tileCache.set(tileKey, { data: tileData, timestamp: Date.now() });
    
    return tileData;
  }

  /**
   * Generate tile key for caching
   */
  generateTileKey(type, zoom, x, y, country) {
    return `${type}_${zoom}_${x}_${y}_${country || 'global'}`;
  }

  /**
   * Get tile file path
   */
  getTilePath(type, zoom, x, y, country) {
    const countryDir = country || 'global';
    const tileDir = path.join(this.tileDir, type, countryDir, zoom.toString());
    
    if (!fs.existsSync(tileDir)) {
      fs.mkdirSync(tileDir, { recursive: true });
    }
    
    return path.join(tileDir, `${x}_${y}.json`);
  }

  /**
   * Save tile to disk
   */
  saveTileToDisk(tilePath, tileData) {
    try {
      fs.writeFileSync(tilePath, JSON.stringify(tileData, null, 2));
      console.log(`💾 Saved boundary tile: ${tilePath}`);
    } catch (error) {
      console.warn(`⚠️ Error saving tile: ${error.message}`);
    }
  }

  /**
   * Generate boundary tile for specific coordinates
   */
  async generateBoundaryTile(type, zoom, x, y, country) {
    console.log(`🔧 Generating boundary tile: ${type} z${zoom} ${x},${y} for ${country || 'global'}`);
    
    // Get tile bounds
    const bounds = this.tileToBounds(zoom, x, y);
    
    // Fetch boundary data for this tile area
    const boundaryData = await this.fetchBoundariesForTile(type, bounds, country);
    
    // Clip and simplify for this tile
    const tileFeatures = this.processFeaturesForTile(boundaryData, bounds, zoom);
    
    return {
      type: 'FeatureCollection',
      features: tileFeatures,
      tile: { zoom, x, y },
      bounds: bounds,
      metadata: {
        type: type,
        country: country,
        featureCount: tileFeatures.length,
        generated: new Date().toISOString()
      }
    };
  }

  /**
   * Convert tile coordinates to geographic bounds
   */
  tileToBounds(zoom, x, y) {
    const n = Math.pow(2, zoom);
    const west = (x / n) * 360 - 180;
    const east = ((x + 1) / n) * 360 - 180;
    const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    
    return [west, south, east, north];
  }

  /**
   * Fetch boundaries for specific tile area
   */
  async fetchBoundariesForTile(type, bounds, country) {
    try {
      // Use working Natural Earth URLs from GitHub
      let url;
      if (type === 'admin0') {
        url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
      } else if (type === 'admin1') {
        url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
      } else {
        throw new Error(`No data source for ${type}`);
      }

      console.log(`📡 Fetching ${type} from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.features?.length || 0} features for ${type}`);
      
      // Filter by country if specified
      if (country && country !== 'global') {
        data.features = data.features.filter(feature => {
          const props = feature.properties;
          return props.ISO_A2 === country || props.ISO_A3 === country || 
                 props.ADMIN === country || props.NAME === country ||
                 props.SOVEREIGNT === country || props.ADMIN_0 === country;
        });
        console.log(`🔍 Filtered to ${data.features.length} features for ${country}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error fetching boundaries for tile: ${error.message}`);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Process features for specific tile
   */
  processFeaturesForTile(boundaryData, bounds, zoom) {
    if (!boundaryData.features) return [];

    const [west, south, east, north] = bounds;
    const tileBbox = [west, south, east, north];
    
    const tileFeatures = [];
    let featureCount = 0;

    for (const feature of boundaryData.features) {
      if (featureCount >= this.tileConfig.maxFeaturesPerTile) break;

      try {
        // Check if feature intersects with tile bounds
        if (this.featureIntersectsBounds(feature, tileBbox)) {
          // Clip feature to tile bounds
          const clippedFeature = this.clipFeatureToBounds(feature, tileBbox);
          
          if (clippedFeature) {
            // Simplify based on zoom level
            const simplifiedFeature = this.simplifyFeatureForZoom(clippedFeature, zoom);
            
            if (simplifiedFeature) {
              tileFeatures.push(simplifiedFeature);
              featureCount++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing feature for tile: ${error.message}`);
      }
    }

    return tileFeatures;
  }

  /**
   * Check if feature intersects with bounds
   */
  featureIntersectsBounds(feature, bounds) {
    try {
      const [west, south, east, north] = bounds;
      const featureBbox = turf.bbox(feature);
      const [fWest, fSouth, fEast, fNorth] = featureBbox;
      
      return !(fEast < west || fWest > east || fNorth < south || fSouth > north);
    } catch (error) {
      return false;
    }
  }

  /**
   * Clip feature to tile bounds
   */
  clipFeatureToBounds(feature, bounds) {
    try {
      const [west, south, east, north] = bounds;
      const bboxPolygon = turf.bboxPolygon([west, south, east, north]);
      const clipped = turf.intersect(feature, bboxPolygon);
      
      return clipped || feature; // Return original if no intersection
    } catch (error) {
      return feature; // Return original if clipping fails
    }
  }

  /**
   * Simplify feature based on zoom level
   */
  simplifyFeatureForZoom(feature, zoom) {
    try {
      let tolerance;
      if (zoom <= 2) {
        tolerance = 0.1; // High simplification for global view
      } else if (zoom <= 5) {
        tolerance = 0.05; // Medium simplification for regional view
      } else if (zoom <= 8) {
        tolerance = 0.01; // Low simplification for local view
      } else {
        tolerance = 0.001; // Minimal simplification for detailed view
      }

      const simplified = turf.simplify(feature, { tolerance, highQuality: true });
      return simplified;
    } catch (error) {
      return feature; // Return original if simplification fails
    }
  }

  /**
   * Pre-generate all tiles for a country/type combination
   */
  async pregenerateTiles(type, country = null) {
    console.log(`🚀 Pre-generating tiles for ${type} ${country || 'global'}`);
    
    const startTime = Date.now();
    let totalTiles = 0;
    let generatedTiles = 0;

    for (const zoom of this.tileConfig.zoomLevels) {
      const tilesInZoom = Math.pow(2, zoom) * Math.pow(2, zoom);
      totalTiles += tilesInZoom;
      
      console.log(`📊 Zoom ${zoom}: ${tilesInZoom} tiles`);
      
      for (let x = 0; x < Math.pow(2, zoom); x++) {
        for (let y = 0; y < Math.pow(2, zoom); y++) {
          try {
            await this.getBoundaryTile(type, zoom, x, y, country);
            generatedTiles++;
            
            if (generatedTiles % 100 === 0) {
              console.log(`✅ Generated ${generatedTiles}/${totalTiles} tiles`);
            }
          } catch (error) {
            console.warn(`⚠️ Error generating tile ${zoom}/${x}/${y}: ${error.message}`);
          }
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`🎉 Pre-generation complete: ${generatedTiles} tiles in ${duration}s`);
  }

  /**
   * Get tile statistics
   */
  getTileStats() {
    const stats = {
      memoryCacheSize: this.tileCache.size,
      diskCacheSize: this.getDiskCacheSize(),
      tileConfig: this.tileConfig
    };
    
    return stats;
  }

  /**
   * Get disk cache size
   */
  getDiskCacheSize() {
    try {
      const files = this.getAllTileFiles();
      return files.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get all tile files
   */
  getAllTileFiles() {
    const files = [];
    
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    };
    
    walkDir(this.tileDir);
    return files;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.tileCache.clear();
    console.log('🧹 Memory cache cleared');
  }

  /**
   * Clear disk cache
   */
  clearDiskCache() {
    try {
      fs.rmSync(this.tileDir, { recursive: true, force: true });
      this.ensureTileDirectory();
      console.log('🧹 Disk cache cleared');
    } catch (error) {
      console.warn(`⚠️ Error clearing disk cache: ${error.message}`);
    }
  }
}

export default BoundaryTileService;
