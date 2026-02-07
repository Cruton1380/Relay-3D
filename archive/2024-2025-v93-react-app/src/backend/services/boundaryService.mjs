// ============================================================================
// boundaryService.mjs - Backend Boundary Data Service
// ============================================================================
// Serves administrative boundary data (countries, provinces, cities)
// Loads from local files with fallback to GeoBoundaries API
// Provides point-in-polygon generation and bounding box extraction
// ============================================================================

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOUNDARIES_DIR = path.join(__dirname, '..', '..', '..', 'data', 'boundaries');
const CUSTOM_BOUNDARIES_DIR = path.join(__dirname, '..', '..', '..', 'data', 'custom-boundaries');
const ALL_COUNTRIES_FILE = path.join(__dirname, '..', '..', '..', 'data', 'all-countries.json');
const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen';

class BoundaryService {
  constructor() {
    this.cache = new Map();
    this.index = null;
    this.allCountries = null; // Static list of all country names/codes
    this.provinceNames = new Map(); // Cached province names per country
  }

  getCityName(boundary, cityCode) {
    const feature = boundary.features.find(f => 
      f.properties.shapeISO === cityCode || 
      f.properties.iso === cityCode ||
      f.properties.code === cityCode
    );
    return feature?.properties.shapeName || feature?.properties.name || cityCode;
  }

  /**
   * Get continent for a country code
   * Simple mapping based on ISO country codes
   */
  getContinent(countryCode) {
    // Continent mapping (simplified - could be loaded from data file)
    const continents = {
      // Africa
      'DZA': 'Africa', 'AGO': 'Africa', 'BEN': 'Africa', 'BWA': 'Africa', 'BFA': 'Africa',
      'BDI': 'Africa', 'CMR': 'Africa', 'CPV': 'Africa', 'CAF': 'Africa', 'TCD': 'Africa',
      'COM': 'Africa', 'COG': 'Africa', 'COD': 'Africa', 'CIV': 'Africa', 'DJI': 'Africa',
      'EGY': 'Africa', 'GNQ': 'Africa', 'ERI': 'Africa', 'ETH': 'Africa', 'GAB': 'Africa',
      'GMB': 'Africa', 'GHA': 'Africa', 'GIN': 'Africa', 'GNB': 'Africa', 'KEN': 'Africa',
      'LSO': 'Africa', 'LBR': 'Africa', 'LBY': 'Africa', 'MDG': 'Africa', 'MWI': 'Africa',
      'MLI': 'Africa', 'MRT': 'Africa', 'MUS': 'Africa', 'MAR': 'Africa', 'MOZ': 'Africa',
      'NAM': 'Africa', 'NER': 'Africa', 'NGA': 'Africa', 'RWA': 'Africa', 'STP': 'Africa',
      'SEN': 'Africa', 'SYC': 'Africa', 'SLE': 'Africa', 'SOM': 'Africa', 'ZAF': 'Africa',
      'SSD': 'Africa', 'SDN': 'Africa', 'SWZ': 'Africa', 'TZA': 'Africa', 'TGO': 'Africa',
      'TUN': 'Africa', 'UGA': 'Africa', 'ZMB': 'Africa', 'ZWE': 'Africa',
      
      // Asia
      'AFG': 'Asia', 'ARM': 'Asia', 'AZE': 'Asia', 'BHR': 'Asia', 'BGD': 'Asia',
      'BTN': 'Asia', 'BRN': 'Asia', 'KHM': 'Asia', 'CHN': 'Asia', 'CYP': 'Asia',
      'GEO': 'Asia', 'IND': 'Asia', 'IDN': 'Asia', 'IRN': 'Asia', 'IRQ': 'Asia',
      'ISR': 'Asia', 'JPN': 'Asia', 'JOR': 'Asia', 'KAZ': 'Asia', 'KWT': 'Asia',
      'KGZ': 'Asia', 'LAO': 'Asia', 'LBN': 'Asia', 'MYS': 'Asia', 'MDV': 'Asia',
      'MNG': 'Asia', 'MMR': 'Asia', 'NPL': 'Asia', 'PRK': 'Asia', 'OMN': 'Asia',
      'PAK': 'Asia', 'PSE': 'Asia', 'PHL': 'Asia', 'QAT': 'Asia', 'SAU': 'Asia',
      'SGP': 'Asia', 'KOR': 'Asia', 'LKA': 'Asia', 'SYR': 'Asia', 'TWN': 'Asia',
      'TJK': 'Asia', 'THA': 'Asia', 'TLS': 'Asia', 'TUR': 'Asia', 'TKM': 'Asia',
      'ARE': 'Asia', 'UZB': 'Asia', 'VNM': 'Asia', 'YEM': 'Asia',
      
      // Europe
      'ALB': 'Europe', 'AND': 'Europe', 'AUT': 'Europe', 'BLR': 'Europe', 'BEL': 'Europe',
      'BIH': 'Europe', 'BGR': 'Europe', 'HRV': 'Europe', 'CZE': 'Europe', 'DNK': 'Europe',
      'EST': 'Europe', 'FIN': 'Europe', 'FRA': 'Europe', 'DEU': 'Europe', 'GRC': 'Europe',
      'HUN': 'Europe', 'ISL': 'Europe', 'IRL': 'Europe', 'ITA': 'Europe', 'LVA': 'Europe',
      'LIE': 'Europe', 'LTU': 'Europe', 'LUX': 'Europe', 'MKD': 'Europe', 'MLT': 'Europe',
      'MDA': 'Europe', 'MCO': 'Europe', 'MNE': 'Europe', 'NLD': 'Europe', 'NOR': 'Europe',
      'POL': 'Europe', 'PRT': 'Europe', 'ROU': 'Europe', 'RUS': 'Europe', 'SMR': 'Europe',
      'SRB': 'Europe', 'SVK': 'Europe', 'SVN': 'Europe', 'ESP': 'Europe', 'SWE': 'Europe',
      'CHE': 'Europe', 'UKR': 'Europe', 'GBR': 'Europe', 'VAT': 'Europe',
      
      // North America
      'ATG': 'North America', 'BHS': 'North America', 'BRB': 'North America', 'BLZ': 'North America',
      'CAN': 'North America', 'CRI': 'North America', 'CUB': 'North America', 'DMA': 'North America',
      'DOM': 'North America', 'SLV': 'North America', 'GRD': 'North America', 'GTM': 'North America',
      'HTI': 'North America', 'HND': 'North America', 'JAM': 'North America', 'MEX': 'North America',
      'NIC': 'North America', 'PAN': 'North America', 'KNA': 'North America', 'LCA': 'North America',
      'VCT': 'North America', 'TTO': 'North America', 'USA': 'North America',
      
      // South America
      'ARG': 'South America', 'BOL': 'South America', 'BRA': 'South America', 'CHL': 'South America',
      'COL': 'South America', 'ECU': 'South America', 'GUY': 'South America', 'PRY': 'South America',
      'PER': 'South America', 'SUR': 'South America', 'URY': 'South America', 'VEN': 'South America',
      
      // Oceania
      'AUS': 'Oceania', 'FJI': 'Oceania', 'KIR': 'Oceania', 'MHL': 'Oceania',
      'FSM': 'Oceania', 'NRU': 'Oceania', 'NZL': 'Oceania', 'PLW': 'Oceania',
      'PNG': 'Oceania', 'WSM': 'Oceania', 'SLB': 'Oceania', 'TON': 'Oceania',
      'TUV': 'Oceania', 'VUT': 'Oceania'
    };

    return continents[countryCode] || 'Unknown';
  }

  // ========================================================================
  // Initialization
  // ========================================================================

  async initialize() {
    console.log('🗺️  Initializing Boundary Service...');
    
    // Create directories if they don't exist
    await this.ensureDirectories();
    
    // Load static country list
    await this.loadCountryCodes();
    
    // Load index of downloaded boundaries
    await this.loadIndex();
    
    console.log(`✅ Boundary Service ready - ${this.allCountries.length} countries available`);
  }

  async ensureDirectories() {
    const dirs = [
      BOUNDARIES_DIR,
      path.join(BOUNDARIES_DIR, 'countries'),
      path.join(BOUNDARIES_DIR, 'provinces'),
      path.join(BOUNDARIES_DIR, 'cities'),
      CUSTOM_BOUNDARIES_DIR
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async loadIndex() {
    try {
      const indexPath = path.join(BOUNDARIES_DIR, 'index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      this.index = JSON.parse(indexData);
      console.log(`📋 Loaded boundary data index: ${this.index.countries.length} countries downloaded`);
    } catch (error) {
      console.log('📋 No boundary index found - will download on demand');
      this.index = { countries: [], provinces: {}, cities: {} };
    }
  }

  async loadCountryCodes() {
    try {
      const codesData = await fs.readFile(ALL_COUNTRIES_FILE, 'utf-8');
      this.allCountries = JSON.parse(codesData);
      console.log(`📋 Loaded ${this.allCountries.length} country names from ISO codes`);
    } catch (error) {
      console.error('❌ Failed to load country codes:', error.message);
      this.allCountries = [];
    }
  }

  // ========================================================================
  // List Methods (For Dropdowns) - Returns ONLY names, no boundary data
  // ========================================================================

  async listCountries() {
    // Return ALL country names from static ISO codes list
    // No boundary data needed for dropdown
    return this.allCountries.map(c => ({
      code: c.code,
      name: c.name
      // No bounds - will be fetched on-demand when country is selected
    }));
  }

  async listProvinces(countryCode) {
    const cacheKey = `provinces-names-${countryCode}`;
    
    // Check cache first
    if (this.provinceNames.has(cacheKey)) {
      return this.provinceNames.get(cacheKey);
    }

    console.log(`📡 Fetching province names for ${countryCode} from GeoBoundaries API...`);

    try {
      // Fetch province metadata from GeoBoundaries API (lightweight, just names)
      const url = `${GEOBOUNDARIES_API}/${countryCode}/ADM1/`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️  No provinces available for ${countryCode}`);
        return [];
      }

      const data = await response.json();
      
      // Download the GeoJSON to extract province names
      const geoJsonUrl = data.gjDownloadURL;
      const geoJsonResponse = await fetch(geoJsonUrl);
      const geoJson = await geoJsonResponse.json();

      // Extract province names from features
      const provinces = geoJson.features.map((feature, index) => ({
        code: feature.properties.shapeID || `${countryCode}-${index}`,
        name: feature.properties.shapeName || `Province ${index + 1}`
      }));

      // Sort alphabetically
      provinces.sort((a, b) => a.name.localeCompare(b.name));

      // Cache the names
      this.provinceNames.set(cacheKey, provinces);
      
      console.log(`✅ Loaded ${provinces.length} province names for ${countryCode}`);
      return provinces;

    } catch (error) {
      console.error(`❌ Failed to fetch provinces for ${countryCode}:`, error.message);
      return [];
    }
  }

  async listCities(countryCode, provinceCode = null) {
    const cacheKey = `cities-list-${countryCode}-${provinceCode || 'all'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let cities = this.index.cities[countryCode] || [];
    
    // Filter by province if specified
    if (provinceCode) {
      cities = cities.filter(c => c.provinceCode === provinceCode);
    }
    
    // Sort alphabetically
    cities.sort((a, b) => a.name.localeCompare(b.name));

    this.cache.set(cacheKey, cities);
    return cities;
  }

  // ========================================================================
  // Get Boundary GeoJSON
  // ========================================================================

  async getBoundary(countryCode, adminLevel = 'ADM0', regionCode = null) {
    const cacheKey = `boundary-${countryCode}-${adminLevel}-${regionCode || 'all'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Try local file first
    const localBoundary = await this.loadLocalBoundary(countryCode, adminLevel);
    
    if (localBoundary) {
      // Filter by region if specified
      let result = localBoundary;
      
      if (regionCode) {
        result = {
          type: 'FeatureCollection',
          features: localBoundary.features.filter(f => 
            f.properties.shapeISO === regionCode || 
            f.properties.iso === regionCode ||
            f.properties.code === regionCode
          )
        };
      }

      // Merge with custom boundaries
      const customBoundary = await this.loadCustomBoundary(countryCode, adminLevel);
      if (customBoundary) {
        result.features = [...result.features, ...customBoundary.features];
      }

      this.cache.set(cacheKey, result);
      return result;
    }

    // Fallback to API
    const apiBoundary = await this.fetchFromAPI(countryCode, adminLevel);
    
    if (apiBoundary) {
      // Save for next time
      await this.saveLocalBoundary(countryCode, adminLevel, apiBoundary);
      this.cache.set(cacheKey, apiBoundary);
      return apiBoundary;
    }

    return null;
  }

  async loadLocalBoundary(countryCode, adminLevel) {
    const levelName = {
      'ADM0': 'countries',
      'ADM1': 'provinces',
      'ADM2': 'cities'
    }[adminLevel];

    const filename = `${countryCode}-${adminLevel}.geojson`;
    const filepath = path.join(BOUNDARIES_DIR, levelName, filename);

    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async loadCustomBoundary(countryCode, adminLevel) {
    const filename = `${countryCode}-${adminLevel}-custom.geojson`;
    const filepath = path.join(CUSTOM_BOUNDARIES_DIR, filename);

    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async saveLocalBoundary(countryCode, adminLevel, geojson) {
    const levelName = {
      'ADM0': 'countries',
      'ADM1': 'provinces',
      'ADM2': 'cities'
    }[adminLevel];

    const filename = `${countryCode}-${adminLevel}.geojson`;
    const filepath = path.join(BOUNDARIES_DIR, levelName, filename);

    await fs.writeFile(filepath, JSON.stringify(geojson, null, 2));
  }

  async fetchFromAPI(countryCode, adminLevel) {
    try {
      console.log(`📡 Fetching ${countryCode} ${adminLevel} from GeoBoundaries API...`);
      
      const metadataUrl = `${GEOBOUNDARIES_API}/${countryCode}/${adminLevel}/`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        return null;
      }

      const metadata = await metadataResponse.json();
      const geojsonUrl = metadata.gjDownloadURL || metadata.simplifiedGeometryGeoJSON;
      
      if (!geojsonUrl) {
        return null;
      }

      const geojsonResponse = await fetch(geojsonUrl);
      return await geojsonResponse.json();
    } catch (error) {
      console.error(`❌ Failed to fetch ${countryCode} ${adminLevel}:`, error.message);
      return null;
    }
  }

  // ========================================================================
  // Point-in-Polygon Detection (Reverse Geocoding)
  // ========================================================================

  /**
   * Detect which province and city a coordinate falls into
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {string} countryCode - Country code (for scoping the search)
   * @returns {Promise<Object>} - { province, provinceCode, city, cityCode }
   */
  async detectAdministrativeLevels(lat, lng, countryCode, cachedProvinceBoundary = null, cachedCityBoundary = null) {
    const point = turf.point([lng, lat]);
    const result = {
      province: null,
      provinceCode: null,
      city: null,
      cityCode: null
    };

    try {
      // First, detect province (ADM1) - use cached boundary if available
      const provinceBoundary = cachedProvinceBoundary || await this.getBoundary(countryCode, 'ADM1');
      if (provinceBoundary && provinceBoundary.features) {
        for (const feature of provinceBoundary.features) {
          let polygon;
          
          // Handle different geometry types
          if (feature.geometry.type === 'Polygon') {
            polygon = turf.polygon(feature.geometry.coordinates);
          } else if (feature.geometry.type === 'MultiPolygon') {
            polygon = turf.multiPolygon(feature.geometry.coordinates);
          } else {
            continue;
          }

          // Check if point is inside this province
          if (turf.booleanPointInPolygon(point, polygon)) {
            result.province = feature.properties.shapeName || feature.properties.name;
            result.provinceCode = feature.properties.shapeISO || feature.properties.iso || feature.properties.code;
            console.log(`✅ Detected province: ${result.province} (${result.provinceCode})`);
            break;
          }
        }
      }

      // Then, detect city (ADM2) - only if we found a province, use cached boundary if available
      if (result.provinceCode) {
        const cityBoundary = cachedCityBoundary || await this.getBoundary(countryCode, 'ADM2');
        if (cityBoundary && cityBoundary.features) {
          for (const feature of cityBoundary.features) {
            let polygon;
            
            // Handle different geometry types
            if (feature.geometry.type === 'Polygon') {
              polygon = turf.polygon(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
              polygon = turf.multiPolygon(feature.geometry.coordinates);
            } else {
              continue;
            }

            // Check if point is inside this city
            if (turf.booleanPointInPolygon(point, polygon)) {
              result.city = feature.properties.shapeName || feature.properties.name;
              result.cityCode = feature.properties.shapeISO || feature.properties.iso || feature.properties.code;
              console.log(`✅ Detected city: ${result.city} (${result.cityCode})`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error detecting administrative levels for [${lat}, ${lng}]:`, error.message);
    }

    return result;
  }

  // ========================================================================
  // Point-in-Polygon Generation with Full Administrative Hierarchy
  // ========================================================================

  async generateCoordinatesInRegion(countryCode, provinceCode = null, cityCode = null, count = 1) {
    // Determine which boundary to use for GENERATION
    let adminLevel = 'ADM0';
    let regionCode = null;

    if (cityCode) {
      adminLevel = 'ADM2';
      regionCode = cityCode;
    } else if (provinceCode) {
      adminLevel = 'ADM1';
      regionCode = provinceCode;
    }

    // Get boundary for generation
    const boundary = await this.getBoundary(countryCode, adminLevel, regionCode);
    
    if (!boundary || !boundary.features || boundary.features.length === 0) {
      throw new Error(`No boundary found for ${countryCode} ${regionCode || ''}`);
    }

    // Generate points within the boundary
    const coordinates = [];
    const feature = boundary.features[0];
    const countryName = feature.properties.shapeName || countryCode;

    console.log(`🎯 Generating ${count} coordinates in ${countryName}${provinceCode ? ` (${provinceCode})` : ''}...`);

    // 🚀 OPTIMIZATION: Pre-load boundaries once instead of loading for each coordinate
    let provinceBoundaryCache = null;
    let cityBoundaryCache = null;
    
    if (!provinceCode) {
      console.log(`📥 Pre-loading province boundaries for reverse geocoding...`);
      provinceBoundaryCache = await this.getBoundary(countryCode, 'ADM1').catch(() => null);
    }
    
    if (!cityCode && !provinceCode) {
      console.log(`📥 Pre-loading city boundaries for reverse geocoding...`);
      cityBoundaryCache = await this.getBoundary(countryCode, 'ADM2').catch(() => null);
    }

    for (let i = 0; i < count; i++) {
      const point = this.generatePointInPolygon(feature);
      const lat = point.geometry.coordinates[1];
      const lng = point.geometry.coordinates[0];

      // Base coordinate data
      const coord = {
        lat: lat,
        lng: lng,
        country: countryName,
        countryCode: countryCode,
        countryName: countryName,
        adminLevel: adminLevel === 'ADM0' ? 0 : adminLevel === 'ADM1' ? 1 : 2
      };

      // If user specified province/city, use those
      if (provinceCode) {
        coord.province = this.getProvinceName(boundary, provinceCode);
        coord.provinceCode = provinceCode;
        coord.provinceName = coord.province;
      }
      if (cityCode) {
        coord.city = this.getCityName(boundary, cityCode);
        coord.cityCode = cityCode;
        coord.cityName = coord.city;
      }

      // 🎯 KEY ENHANCEMENT: If NO province specified, detect it via point-in-polygon!
      if (!provinceCode || !cityCode) {
        if (i === 0) console.log(`🔍 Detecting administrative levels using cached boundaries...`);
        const detected = await this.detectAdministrativeLevels(lat, lng, countryCode, provinceBoundaryCache, cityBoundaryCache);
        
        // Fill in missing data from detection
        if (!provinceCode && detected.province) {
          coord.province = detected.province;
          coord.provinceCode = detected.provinceCode;
          coord.provinceName = detected.province;
          coord.state = detected.province; // Alternative naming
          console.log(`  ✅ Auto-detected province: ${detected.province}`);
        }
        
        if (!cityCode && detected.city) {
          coord.city = detected.city;
          coord.cityCode = detected.cityCode;
          coord.cityName = detected.city;
          console.log(`  ✅ Auto-detected city: ${detected.city}`);
        }
      }

      // Add fallbacks for missing data
      if (!coord.province) {
        coord.province = countryName;
        coord.provinceName = countryName;
        coord.state = countryName;
      }
      if (!coord.city) {
        coord.city = coord.province || 'Multiple Cities';
        coord.cityName = coord.city;
      }

      // Add continent (simple mapping - could be more sophisticated)
      coord.continent = this.getContinent(countryCode);
      coord.region = coord.continent;

      coordinates.push(coord);
      console.log(`  📍 Coordinate ${i + 1}: [${lat.toFixed(4)}, ${lng.toFixed(4)}] - ${coord.city}, ${coord.province}, ${countryName}`);
    }

    console.log(`✅ Generated ${coordinates.length} coordinates with full administrative hierarchy`);
    return coordinates;
  }

  generatePointInPolygon(feature) {
    try {
      const bbox = turf.bbox(feature);
      let polygon;
      
      // Handle different geometry types
      if (feature.geometry.type === 'Polygon') {
        polygon = turf.polygon(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygon, use the largest polygon
        const polygons = feature.geometry.coordinates.map(coords => turf.polygon(coords));
        polygon = polygons.reduce((largest, current) => {
          const largestArea = turf.area(largest);
          const currentArea = turf.area(current);
          return currentArea > largestArea ? current : largest;
        });
      } else {
        throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
      }
      
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        // Generate random point in bounding box
        const randomLng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
        const randomLat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
        const point = turf.point([randomLng, randomLat]);

        // Check if point is inside polygon
        if (turf.booleanPointInPolygon(point, polygon)) {
          return point;
        }

        attempts++;
      }

      // Fallback: return centroid
      return turf.centroid(polygon);
    } catch (error) {
      console.error('Error generating point in polygon:', error);
      // Ultimate fallback: return center of bounding box
      const bbox = turf.bbox(feature);
      return turf.point([
        (bbox[0] + bbox[2]) / 2,
        (bbox[1] + bbox[3]) / 2
      ]);
    }
  }

  getProvinceName(boundary, provinceCode) {
    const feature = boundary.features.find(f => 
      f.properties.shapeISO === provinceCode || 
      f.properties.iso === provinceCode ||
      f.properties.code === provinceCode
    );
    return feature?.properties.shapeName || feature?.properties.name || provinceCode;
  }

  getCityName(boundary, cityCode) {
    const feature = boundary.features.find(f => 
      f.properties.shapeISO === cityCode || 
      f.properties.iso === cityCode ||
      f.properties.code === cityCode
    );
    return feature?.properties.shapeName || feature?.properties.name || cityCode;
  }

  // ========================================================================
  // Bounding Box Extraction
  // ========================================================================

  async getBounds(countryCode, provinceCode = null, cityCode = null) {
    let adminLevel = 'ADM0';
    let regionCode = null;

    if (cityCode) {
      adminLevel = 'ADM2';
      regionCode = cityCode;
    } else if (provinceCode) {
      adminLevel = 'ADM1';
      regionCode = provinceCode;
    }

    const boundary = await this.getBoundary(countryCode, adminLevel, regionCode);
    
    if (!boundary) {
      return null;
    }

    const bbox = turf.bbox(boundary);
    
    return {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    };
  }

  // ========================================================================
  // Clear Cache
  // ========================================================================

  clearCache() {
    this.cache.clear();
    console.log('🗑️  Boundary cache cleared');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const boundaryService = new BoundaryService();
