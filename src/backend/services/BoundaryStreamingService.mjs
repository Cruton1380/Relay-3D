import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import provinceDataService from './provinceDataService.mjs';
import unifiedBoundaryService from './unifiedBoundaryService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ENHANCED BOUNDARY STREAMING SERVICE
 * 
 * NOW INTEGRATED WITH PROVINCE/COUNTRY LAYER DATA
 * 
 * Multi-resolution boundary system with zoom-based data switching:
 * - Zoom 0-2: Country boundaries (low-res, fast)
 * - Zoom 3-7: Province/State boundaries (high-res, smooth)
 * - Zoom 8-11: City points + detailed boundaries (high accuracy)
 * 
 * Features:
 * - Uses existing provinceDataService for Italy, Spain, France, etc.
 * - Proper point-in-polygon generation for all countries
 * - Province-level clustering support
 * - Preprocessed GeoJSON with proper CRS
 * - Performance optimization with caching
 * - Metadata endpoints for polygon resolution and vertex counts
 */

class BoundaryStreamingService {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.initialized = false;
    
    // Data sources configuration - using GeoBoundaries and NaturalEarth
    this.dataSources = {
      admin0: {
        '0-2': { source: 'NaturalEarth', resolution: '110m' },
        '3-7': { source: 'NaturalEarth', resolution: '50m' },
        '8-11': { source: 'NaturalEarth', resolution: '10m' }
      },
      admin1: {
        '0-2': { source: 'NaturalEarth', resolution: '50m' },
        '3-7': { source: 'NaturalEarth', resolution: '10m' },
        '8-11': { source: 'GeoBoundaries', resolution: 'high' }
      },
      admin2: {
        '0-2': { source: 'GeoBoundaries', resolution: 'medium' },
        '3-7': { source: 'GeoBoundaries', resolution: 'high' },
        '8-11': { source: 'GADM', resolution: 'highest' }
      }
    };
  }

  /**
   * Initialize with provinceDataService
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🌍 BoundaryStreamingService: Initializing with provinceDataService...');
    await provinceDataService.initialize();
    await unifiedBoundaryService.initialize();
    
    this.initialized = true;
    console.log('✅ BoundaryStreamingService: Ready with comprehensive province/country data');
  }

  /**
   * Get boundaries with intelligent zoom-based resolution switching
   * NOW USES provinceDataService for proper integration
   */
  async getBoundaries(type, country = null, bbox = null, zoomLevel = 0) {
    await this.initialize();
    
    // Determine appropriate data source based on zoom level
    const dataSource = this.getDataSourceForZoom(type, zoomLevel);
    const cacheKey = this.generateCacheKey(type, country, bbox, zoomLevel, dataSource);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Serving ${type} boundaries from cache for ${country || 'global'} (zoom: ${zoomLevel}, source: ${dataSource.source})`);
      return cached;
    }

    // Use legacy fallback method as primary (frontend fetches directly from Natural Earth)
    console.log(`🌍 Fetching ${type} boundaries using legacy method for ${country || 'global'} (zoom: ${zoomLevel})`);
    const boundaries = await this.fetchAndProcessBoundaries(type, country, zoomLevel, dataSource);
    
    // Cache the result
    this.saveToCache(cacheKey, boundaries, type, country);
    
    return boundaries;
  }

  /**
   * Determine appropriate data source based on zoom level and admin type
   */
  getDataSourceForZoom(adminLevel, zoomLevel) {
    const sources = this.dataSources[adminLevel];
    if (!sources) {
      console.warn(`⚠️ No data sources configured for ${adminLevel}`);
      return { source: 'GeoBoundaries', resolution: '10m' };
    }

    // Determine zoom range
    let zoomRange;
    if (zoomLevel <= 2) zoomRange = '0-2';
    else if (zoomLevel <= 7) zoomRange = '3-7';
    else zoomRange = '8-11';

    const dataSource = sources[zoomRange];
    if (!dataSource) {
      console.warn(`⚠️ No data source found for ${adminLevel} at zoom ${zoomLevel}, using fallback`);
      return { source: 'GeoBoundaries', resolution: '10m' };
    }

    console.log(`📊 Using ${dataSource.source} ${dataSource.resolution} for ${adminLevel} at zoom ${zoomLevel}`);
    return dataSource;
  }

  /**
   * Generate cache key for boundaries
   */
  generateCacheKey(type, country, bbox, zoomLevel, dataSource) {
    const parts = [
      type,
      country || 'global',
      zoomLevel,
      dataSource.source,
      dataSource.resolution
    ];
    
    if (bbox) {
      parts.push(bbox.join(','));
    }
    
    return parts.join('_');
  }

  /**
   * Get boundaries from cache
   */
  getFromCache(cacheKey) {
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      // Update cache usage
      cachedData.lastAccessed = Date.now();
      return cachedData.data;
    }
    return null;
  }

  /**
   * Save boundaries to cache
   */
  saveToCache(cacheKey, boundaries, type, country) {
    const cachedData = {
      data: boundaries,
      lastAccessed: Date.now(),
      size: JSON.stringify(boundaries).length, // Simple size estimation
      type: type,
      country: country,
      dataSource: boundaries.metadata?.dataSource || 'unknown',
      vertexCount: this.calculateTotalVertexCount(boundaries),
      featureCount: boundaries.features?.length || 0,
      zoomLevel: boundaries.metadata?.zoomLevel || 0
    };

    this.cache.set(cacheKey, cachedData);
    console.log(`💾 Cached ${type} boundaries for ${country || 'global'} (${cachedData.featureCount} features, ${cachedData.vertexCount} vertices)`);
  }

  /**
   * Calculate total vertex count for performance metrics
   */
  calculateTotalVertexCount(boundaries) {
    if (!boundaries.features) return 0;
    
    return boundaries.features.reduce((total, feature) => {
      if (feature.geometry && feature.geometry.coordinates) {
        if (feature.geometry.type === 'Polygon') {
          return total + feature.geometry.coordinates[0].length;
        } else if (feature.geometry.type === 'MultiPolygon') {
          return total + feature.geometry.coordinates.reduce((polyTotal, polygon) => {
            return polyTotal + polygon[0].length;
          }, 0);
        }
      }
      return total;
    }, 0);
  }

  /**
   * NEW METHOD: Fetch boundaries from provinceDataService
   * This is the key integration point for Italy, Spain, France and all other countries!
   */
  async fetchFromProvinceData(type, country, zoomLevel, dataSource) {
    try {
      console.log(`🗺️ Fetching ${type} from provinceDataService for ${country || 'all countries'}`);
      
      // Get all countries with province data
      const countries = await provinceDataService.getCountriesWithProvinces();
      
      if (type === 'admin0' || type === 'country') {
        // Return country boundaries
        return await this.buildCountryBoundaries(countries, country);
      } else if (type === 'admin1' || type === 'province' || type === 'state') {
        // Return province boundaries
        return await this.buildProvinceBoundaries(countries, country);
      } else {
        // Fallback to old method for admin2
        return await this.fetchAndProcessBoundaries(type, country, zoomLevel, dataSource);
      }
    } catch (error) {
      console.error(`❌ Error fetching from provinceDataService:`, error.message);
      // Fallback to old method
      return await this.fetchAndProcessBoundaries(type, country, zoomLevel, dataSource);
    }
  }

  /**
   * Build country boundaries from provinceDataService
   */
  async buildCountryBoundaries(countries, filterCountry = null) {
    const features = [];
    
    for (const countryInfo of countries) {
      // Filter if specific country requested
      if (filterCountry && countryInfo.code !== filterCountry && countryInfo.name !== filterCountry) {
        continue;
      }
      
      const countryData = await provinceDataService.getCountryData(countryInfo.code);
      if (!countryData || !countryData.bounds) continue;
      
      // Create GeoJSON feature from bounds
      const bounds = countryData.bounds;
      const feature = {
        type: 'Feature',
        properties: {
          name: countryData.name,
          code: countryInfo.code,
          continent: countryData.continent,
          type: 'admin0',
          admin_level: 0,
          hasProvinces: countryInfo.hasProvinces,
          provinceCount: countryInfo.provinceCount
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [bounds.west, bounds.south],
            [bounds.east, bounds.south],
            [bounds.east, bounds.north],
            [bounds.west, bounds.north],
            [bounds.west, bounds.south]
          ]]
        }
      };
      
      features.push(feature);
    }
    
    console.log(`✅ Built ${features.length} country boundaries from provinceDataService`);
    
    return {
      success: true,
      type: 'FeatureCollection',
      features: features,
      count: features.length,
      metadata: {
        dataSource: 'ProvinceDataService',
        resolution: 'country',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Build province boundaries from provinceDataService
   */
  async buildProvinceBoundaries(countries, filterCountry = null) {
    const features = [];
    
    for (const countryInfo of countries) {
      // Filter if specific country requested
      if (filterCountry && countryInfo.code !== filterCountry && countryInfo.name !== filterCountry) {
        continue;
      }
      
      // Only get provinces for countries that have them
      if (!countryInfo.hasProvinces || countryInfo.provinceCount === 0) {
        continue;
      }
      
      const countryData = await provinceDataService.getCountryData(countryInfo.code);
      if (!countryData || !countryData.provinces) continue;
      
      // Create GeoJSON features for each province
      for (const province of countryData.provinces) {
        if (!province.bounds) continue;
        
        const bounds = province.bounds;
        const feature = {
          type: 'Feature',
          properties: {
            name: province.name,
            country: countryData.name,
            countryCode: countryInfo.code,
            continent: countryData.continent,
            type: 'admin1',
            admin_level: 1,
            cities: province.cities || [],
            centroid: province.centroid || [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2]
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [bounds.west, bounds.south],
              [bounds.east, bounds.south],
              [bounds.east, bounds.north],
              [bounds.west, bounds.north],
              [bounds.west, bounds.south]
            ]]
          }
        };
        
        features.push(feature);
      }
    }
    
    console.log(`✅ Built ${features.length} province boundaries from provinceDataService`);
    
    return {
      success: true,
      type: 'FeatureCollection',
      features: features,
      count: features.length,
      metadata: {
        dataSource: 'ProvinceDataService',
        resolution: 'province',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Fetch and process boundaries based on data source
   * LEGACY FALLBACK METHOD - only used when provinceDataService doesn't have data
   */
  async fetchAndProcessBoundaries(type, country, zoomLevel, dataSource) {
    let geoData;
    
    try {
      // Fetch based on data source
      if (dataSource.source === 'NaturalEarth') {
        geoData = await this.fetchNaturalEarthData(dataSource.resolution, type);
      } else if (dataSource.source === 'GADM') {
        geoData = await this.fetchGADMData(type, country);
      } else {
        // Default to GeoBoundaries
        geoData = await this.fetchGeoBoundariesData(type, country);
      }

      if (!geoData || !geoData.features) {
        throw new Error('No valid GeoJSON data received');
      }

      // Process the boundaries
      const processedData = await this.processBoundaries(geoData, dataSource);
      
      console.log(`✅ Processed ${processedData.features.length} features for ${type} ${country || 'global'} (zoom ${zoomLevel})`);
      return processedData;
      
    } catch (error) {
      console.error(`❌ Error fetching/processing boundaries for ${type} ${country || 'global'}:`, error.message);
      
      // Fallback to GeoBoundaries if other sources fail
      if (dataSource.source !== 'GeoBoundaries') {
        console.log(`🔄 Falling back to GeoBoundaries for ${type} ${country || 'global'}`);
        try {
          geoData = await this.fetchGeoBoundariesData(type, country);
          if (geoData && geoData.features) {
            const processedData = await this.processBoundaries(geoData, { source: 'GeoBoundaries', resolution: '10m' });
            console.log(`✅ Fallback processed ${processedData.features.length} features`);
            return processedData;
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed:`, fallbackError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Fetch Natural Earth data
   */
  async fetchNaturalEarthData(scale, adminLevel) {
    try {
      console.log(`🌍 Attempting to fetch Natural Earth ${scale} data for ${adminLevel}`);
      console.warn(`⚠️ Natural Earth direct GeoJSON URLs are not available - falling back to GeoBoundaries`);
      
      // Natural Earth doesn't provide direct GeoJSON URLs
      // Use GeoBoundaries as the primary source instead
      // For global admin0 data, use GeoBoundaries global endpoint
      if (adminLevel === 'admin0') {
        return await this.fetchGlobalAdmin0();
      }
      
      // For other levels, we need a country code which we don't have here
      throw new Error(`Cannot fetch ${adminLevel} data without country code - use GeoBoundaries instead`);
      
    } catch (error) {
      console.error(`❌ Error fetching Natural Earth ${scale} ${adminLevel}:`, error.message);
      // Fallback to GeoBoundaries
      console.log(`🔄 Falling back to GeoBoundaries for ${adminLevel}`);
      return await this.fetchGlobalAdmin0();
    }
  }

  /**
   * Fetch GADM data (high resolution)
   */
  async fetchGADMData(type, country) {
    const adminLevel = type.replace('admin', '');
    
    // For now, fallback to GeoBoundaries as GADM requires authentication
    // In production, this would use GADM API or local GADM files
    console.log(`🌍 Fetching GADM data for ${country} admin${adminLevel} (falling back to GeoBoundaries)`);
    return await this.fetchGeoBoundariesData(type, country);
  }

  /**
   * Fetch GeoBoundaries data (existing implementation)
   */
  async fetchGeoBoundariesData(type, country) {
    if (country) {
      return await this.fetchCountryBoundaries(type, country);
    } else {
      return await this.fetchGlobalAdmin0();
    }
  }

  /**
   * Fetch boundaries for a specific country with memory optimization
   */
  async fetchCountryBoundaries(type, country) {
    const adminLevel = type.replace('admin', '');
    
    // Check cache first
    const cacheKey = `country-${type}-${country}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Serving ${type} for ${country} from cache`);
      return cached;
    }
    
    const url = `https://www.geoboundaries.org/api/current/gbOpen/${country}/ADM${adminLevel}/`;
    
    console.log(`📡 Fetching ${type} for ${country} from: ${url}`);
    
    try {
      // Add timeout to prevent hanging on slow responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} for ${country}: ${response.status}`);
      }
      
      const data = await response.json();
      const downloadUrl = data.gjDownloadURL;
      
      if (!downloadUrl) {
        throw new Error(`No download URL for ${country} ${type}`);
      }
      
      // Download the GeoJSON file with memory optimization and timeout
      const geoController = new AbortController();
      const geoTimeoutId = setTimeout(() => geoController.abort(), 15000); // 15 second timeout for download
      
      const geoResponse = await fetch(downloadUrl, { signal: geoController.signal });
      clearTimeout(geoTimeoutId);
      if (!geoResponse.ok) {
        throw new Error(`Failed to download GeoJSON for ${country} ${type}: ${geoResponse.status}`);
      }
      
      // Check content length to avoid memory issues
      const contentLength = geoResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) { // Increased to 200MB limit
        console.warn(`⚠️ Large file detected for ${country} ${type}: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB`);
        
        // For large files, try to use Natural Earth fallback
        if (parseInt(contentLength) > 300 * 1024 * 1024) { // Try fallback for files > 300MB
          console.log(`🔄 Trying Natural Earth fallback for large ${country} ${type} file`);
          return await this.fetchNaturalEarthFallback(type, country);
        }
      }
      
      const geoData = await geoResponse.json();
      console.log(`✅ Downloaded ${country} ${type} (${geoData.features?.length || 0} features)`);
      
      // Limit the number of features for very large datasets
      if (geoData.features && geoData.features.length > 1000) {
        console.log(`🔄 Limiting ${country} ${type} to 1000 features (was ${geoData.features.length})`);
        geoData.features = geoData.features.slice(0, 1000);
      }
      
      // Cache the result for future requests
      this.saveToCache(cacheKey, geoData, type, country);
      
      return geoData;
    } catch (error) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Timeout fetching ${country} ${type} - falling back to Natural Earth`);
      } else if (error.message.includes('Cannot create a string longer than')) {
        console.error(`❌ Memory error for ${country} ${type}: File too large`);
      } else {
        console.warn(`🔄 Error fetching ${country} ${type}: ${error.message}`);
      }
      
      // Try Natural Earth fallback for any error
      console.log(`🌍 Trying Natural Earth fallback for ${country} ${type}`);
      return await this.fetchNaturalEarthFallback(type, country);
    }
  }

  /**
   * Fetch Natural Earth fallback data for large or problematic datasets
   */
  async fetchNaturalEarthFallback(type, country) {
    try {
      console.log(`🌍 Fetching Natural Earth fallback for ${country} ${type}`);
      
      let url;
      if (type === 'admin0') {
        url = 'https://www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.geojson';
      } else if (type === 'admin1') {
        url = 'https://www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces.geojson';
      } else {
        throw new Error(`No Natural Earth fallback for ${type}`);
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Natural Earth fallback failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for the specific country if needed
      if (country && country !== 'global') {
        const countryFeatures = data.features.filter(feature => {
          const props = feature.properties;
          return props.ISO_A2 === country || props.ISO_A3 === country || 
                 props.ADMIN === country || props.NAME === country;
        });
        
        console.log(`✅ Natural Earth fallback: ${countryFeatures.length} features for ${country}`);
        return {
          type: 'FeatureCollection',
          features: countryFeatures,
          success: true,
          source: 'NaturalEarth'
        };
      }
      
      console.log(`✅ Natural Earth fallback: ${data.features.length} features`);
      return {
        ...data,
        success: true,
        source: 'NaturalEarth'
      };
    } catch (fallbackError) {
      console.error(`❌ Natural Earth fallback also failed:`, fallbackError.message);
      return {
        type: 'FeatureCollection',
        features: [],
        success: false,
        error: fallbackError.message
      };
    }
  }

  /**
   * Fetch global admin0 boundaries (countries) - Using GeoBoundaries
   */
  async fetchGlobalAdmin0() {
    try {
      console.log('🌍 Fetching global admin0 boundaries from GeoBoundaries');
      
      // Natural Earth doesn't provide direct GeoJSON URLs - use GeoBoundaries instead
      console.warn('⚠️ Fetching individual countries from GeoBoundaries (Natural Earth direct URLs not available)');
      
      // Fallback to individual country fetching
      const countries = [
        'USA', 'CAN', 'MEX', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
        'CHN', 'JPN', 'IND', 'AUS', 'IDN', 'NGA', 'ZAF', 'EGY',
        'KEN', 'ETH', 'BRA', 'ARG', 'COL', 'PER', 'CHL'
      ];
      
      const allFeatures = [];
      
      for (const country of countries) {
        try {
          const countryData = await this.fetchCountryBoundaries('admin0', country);
          if (countryData.features) {
            allFeatures.push(...countryData.features);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`⚠️ Failed to fetch ${country}:`, error.message);
        }
      }
      
      return {
        type: 'FeatureCollection',
        features: allFeatures,
        success: true,
        source: 'GeoBoundaries'
      };
    } catch (error) {
      console.error('❌ Error fetching global admin0:', error.message);
      return {
        type: 'FeatureCollection',
        features: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process and normalize boundary features with enhanced preprocessing and performance optimization
   */
  async processBoundaries(geoData, dataSource) {
    if (!geoData.features) return {
      success: false,
      error: 'No features found in GeoJSON data',
      type: 'FeatureCollection',
      features: [],
      count: 0
    };
    
    const processed = [];
    let processedCount = 0;
    const maxFeatures = 1000; // Increased from 500 to 1000 for maximum coverage
    
    for (let index = 0; index < Math.min(geoData.features.length, maxFeatures); index++) {
      const feature = geoData.features[index];
      
      try {
        if (!feature.geometry) {
          console.warn(`⚠️ Skipping feature ${index} due to missing geometry`);
          continue;
        }

        // FIXED: Much more permissive geometry complexity check - only skip if truly massive
        if (feature.geometry.coordinates && 
            JSON.stringify(feature.geometry.coordinates).length > 10000000) { // Increased to 10MB limit
          console.warn(`⚠️ Skipping feature ${index} due to extremely complex geometry`);
          continue;
        }

        // Normalize geometry - much more permissive
        let normalizedGeometry = this.normalizeGeometry(feature.geometry);
        if (!normalizedGeometry) {
          // If normalization fails, use original geometry
          console.warn(`⚠️ Normalization failed for feature ${index}, using original geometry`);
          normalizedGeometry = feature.geometry;
        }

        // Apply zoom-based simplification for performance - much more permissive
        let simplifiedGeometry = this.simplifyGeometryForLOD(normalizedGeometry, 0);
        if (!simplifiedGeometry) {
          // If simplification fails, use normalized geometry
          console.warn(`⚠️ Simplification failed for feature ${index}, using normalized geometry`);
          simplifiedGeometry = normalizedGeometry;
        }

        // Determine admin level from feature properties
        let adminLevel = 0; // Default to admin0
        if (feature.properties?.ADMIN_LEVEL) {
          adminLevel = parseInt(feature.properties.ADMIN_LEVEL);
        } else if (feature.properties?.admin_level) {
          adminLevel = parseInt(feature.properties.admin_level);
        } else if (feature.properties?.GID_1) {
          adminLevel = 1; // Has GID_1, so it's admin1
        } else if (feature.properties?.GID_2) {
          adminLevel = 2; // Has GID_2, so it's admin2
        }

        // Enhanced properties
        const properties = {
          ...feature.properties,
          type: `admin${adminLevel}`,
          admin_level: adminLevel,
          name: this.extractName(feature.properties),
          source: dataSource.source,
          resolution: dataSource.resolution,
          zoom_min: this.getZoomMinForLevel(adminLevel),
          zoom_max: this.getZoomMaxForLevel(adminLevel),
          vertex_count: this.calculateVertexCount(simplifiedGeometry),
          area: this.calculateArea(simplifiedGeometry),
          centroid: this.calculateCentroid(simplifiedGeometry),
          bbox: this.calculateBbox(simplifiedGeometry)
        };

        processed.push({
          type: 'Feature',
          geometry: simplifiedGeometry,
          properties: properties
        });

      } catch (error) {
        console.warn(`⚠️ Error processing feature ${index}:`, error.message);
      }
    }

    console.log(`✅ Processed ${processed.length} features`);
    return {
      success: true,
      type: 'FeatureCollection',
      features: processed,
      count: processed.length,
      metadata: {
        dataSource: dataSource.source,
        resolution: dataSource.resolution,
        zoomLevel: 0, // Simplified to a fixed level
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get minimum zoom level for admin level
   */
  getZoomMinForLevel(adminLevel) {
    const zoomRanges = {
      0: 0,  // Countries
      1: 3,  // States
      2: 6,  // Counties
      3: 8   // Cities
    };
    return zoomRanges[adminLevel] || 0;
  }

  /**
   * Get maximum zoom level for admin level
   */
  getZoomMaxForLevel(adminLevel) {
    const zoomRanges = {
      0: 7,  // Countries
      1: 7,  // States
      2: 11, // Counties
      3: 11  // Cities
    };
    return zoomRanges[adminLevel] || 11;
  }

  /**
   * Calculate vertex count for geometry
   */
  calculateVertexCount(geometry) {
    if (!geometry || !geometry.coordinates) return 0;
    
    if (geometry.type === 'Polygon') {
      return geometry.coordinates[0].length;
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.reduce((total, polygon) => {
        return total + polygon[0].length;
      }, 0);
    }
    return 0;
  }

  /**
   * Calculate area for geometry
   */
  calculateArea(geometry) {
    try {
      const feature = turf.feature(geometry);
      return turf.area(feature);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate centroid for geometry
   */
  calculateCentroid(geometry) {
    try {
      const feature = turf.feature(geometry);
      const centroid = turf.centroid(feature);
      return centroid.geometry.coordinates;
    } catch (error) {
      return [0, 0];
    }
  }

  /**
   * Calculate bounding box for geometry
   */
  calculateBbox(geometry) {
    try {
      const feature = turf.feature(geometry);
      return turf.bbox(feature);
    } catch (error) {
      return [0, 0, 0, 0];
    }
  }

  /**
   * Simplify geometry based on zoom level for performance
   */
  simplifyGeometryForLOD(geometry, zoomLevel) {
    try {
      if (!geometry || !geometry.coordinates) {
        console.warn('⚠️ Invalid geometry for simplification:', geometry);
        return geometry;
      }

      // FIXED: Re-enable simplification with safe error handling
      // Determine simplification tolerance based on zoom level
      let tolerance;
      if (zoomLevel <= 2) {
        tolerance = 0.1; // High simplification for global view
      } else if (zoomLevel <= 5) {
        tolerance = 0.05; // Medium simplification for regional view
      } else if (zoomLevel <= 8) {
        tolerance = 0.01; // Low simplification for local view
      } else {
        tolerance = 0.001; // Minimal simplification for detailed view
      }

      try {
        const feature = turf.feature(geometry);
        const simplified = turf.simplify(feature, { tolerance, highQuality: true });
        return simplified.geometry;
      } catch (simplifyError) {
        console.warn(`⚠️ Simplification failed, using original geometry:`, simplifyError.message);
        return geometry; // Return original if simplification fails
      }
    } catch (error) {
      console.warn(`⚠️ Error in simplifyGeometryForLOD:`, error.message);
      return geometry; // Return original if any error occurs
    }
  }

  /**
   * Validate geometry with very relaxed bounds - FIXED to allow more states
   */
  isValidGeometry(geometry) {
    try {
      if (!geometry || !geometry.coordinates) {
        return false;
      }

      // Handle Feature objects
      if (geometry.type === 'Feature') {
        return this.isValidGeometry(geometry.geometry);
      }

      // Basic type check
      if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) {
        return false;
      }

      // FIXED: Much more permissive coordinate validation
      const checkCoordinates = (coords) => {
        if (!Array.isArray(coords)) {
          return false;
        }
        
        for (const coord of coords) {
          if (Array.isArray(coord)) {
            if (!checkCoordinates(coord)) return false;
          } else {
            if (typeof coord !== 'number' || isNaN(coord)) {
              return false;
            }
            // FIXED: Much more relaxed bounds - allow any reasonable geographic coordinate
            if (coord < -1000000 || coord > 1000000) {
              return false;
            }
          }
        }
        return true;
      };

      return checkCoordinates(geometry.coordinates);
    } catch (error) {
      console.warn(`⚠️ Geometry validation error:`, error.message);
      // FIXED: Be much more permissive - return true to allow features through
      return true;
    }
  }

  /**
   * Normalize geometry to MultiPolygon format - FIXED to be more permissive
   */
  normalizeGeometry(geometry) {
    try {
      if (!geometry || !geometry.type) {
        console.warn('⚠️ Invalid geometry for normalization:', geometry);
        return null;
      }

      if (geometry.type === 'Polygon') {
        if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
          console.warn('⚠️ Invalid Polygon coordinates:', geometry.coordinates);
          return null;
        }
        
        // FIXED: More permissive point validation
        if (geometry.coordinates[0] && geometry.coordinates[0].length < 3) {
          console.warn('⚠️ Polygon has insufficient points, attempting to fix:', geometry.coordinates[0].length);
          // Try to fix by duplicating points if needed
          if (geometry.coordinates[0].length === 2) {
            geometry.coordinates[0].push(geometry.coordinates[0][0]); // Close the polygon
          }
        }
        
        return turf.multiPolygon([geometry.coordinates]);
      } else if (geometry.type === 'MultiPolygon') {
        if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
          console.warn('⚠️ Invalid MultiPolygon coordinates:', geometry.coordinates);
          return null;
        }
        
        // FIXED: More permissive polygon validation
        for (const polygon of geometry.coordinates) {
          if (!Array.isArray(polygon) || polygon.length === 0) {
            console.warn('⚠️ Invalid polygon in MultiPolygon, skipping:', polygon);
            continue; // Skip invalid polygons instead of failing
          }
          if (polygon[0] && polygon[0].length < 3) {
            console.warn('⚠️ Polygon in MultiPolygon has insufficient points, attempting to fix:', polygon[0].length);
            // Try to fix by duplicating points if needed
            if (polygon[0].length === 2) {
              polygon[0].push(polygon[0][0]); // Close the polygon
            }
          }
        }
        
        return geometry;
      } else if (geometry.type === 'Feature') {
        return this.normalizeGeometry(geometry.geometry);
      } else {
        console.warn(`⚠️ Unsupported geometry type: ${geometry.type}`);
        return null;
      }
    } catch (error) {
      console.warn(`⚠️ Error normalizing geometry:`, error.message);
      // FIXED: Return original geometry instead of null to be more permissive
      return geometry;
    }
  }

  /**
   * Extract name from GeoBoundaries properties
   */
  extractName(properties) {
    if (!properties) return 'Unknown';
    
    // Try different property names used by GeoBoundaries
    if (properties.shapeName) return properties.shapeName;
    if (properties.shapeName_ALT) return properties.shapeName_ALT;
    if (properties.NAME) return properties.NAME;
    if (properties.name) return properties.name;
    if (properties.ADMIN) return properties.ADMIN;
    if (properties.admin) return properties.admin;
    if (properties.country) return properties.country;
    if (properties.COUNTRY) return properties.COUNTRY;
    
    // Fallback to any property that looks like a name
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && value.length > 0 && value.length < 100) {
        if (key.toLowerCase().includes('name') || key.toLowerCase().includes('admin') || key.toLowerCase().includes('country')) {
          return value;
        }
      }
    }
    
    return 'Unknown';
  }

  /**
   * Get metadata about available boundaries
   */
  getMetadata() {
    return {
      dataSources: this.dataSources,
      cacheSize: this.cache.size,
      cacheDir: 'N/A (in-memory cache)', // No physical cache directory in this version
      maxCacheSize: this.maxCacheSize
    };
  }
}

export default BoundaryStreamingService;
