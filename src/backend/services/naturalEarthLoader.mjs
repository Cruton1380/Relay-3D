/**
 * Natural Earth Data Loader
 * 
 * Loads and parses Natural Earth GeoJSON data for boundary geometry.
 * Handles both Polygon and MultiPolygon geometries.
 * 
 * @module services/naturalEarthLoader
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NaturalEarthLoader {
  constructor() {
    this.countriesData = null;
    this.provincesData = null;
    this.isoCodeMap = null;
    this.initialized = false;
    this.dataPath = path.join(__dirname, '../../../data');
  }

  /**
   * Initialize the loader by reading Natural Earth data files
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('[NaturalEarthLoader] Loading Natural Earth data...');

      // Load countries GeoJSON
      const countriesPath = path.join(this.dataPath, 'countries-10m.geojson');
      const countriesJSON = await fs.readFile(countriesPath, 'utf-8');
      this.countriesData = JSON.parse(countriesJSON);

      // Load provinces GeoJSON (for province-level boundaries)
      // Try local file first, fallback to GitHub
      try {
        const provincesPath = path.join(this.dataPath, 'provinces-10m.geojson');
        const provincesJSON = await fs.readFile(provincesPath, 'utf-8');
        this.provincesData = JSON.parse(provincesJSON);
        console.log(`[NaturalEarthLoader] Loaded ${this.provincesData.features.length} provinces from local file`);
      } catch (provinceError) {
        console.log('[NaturalEarthLoader] Local provinces file not found, will fetch from GitHub on demand');
        this.provincesData = null; // Will be loaded on demand
      }

      // Load ISO code mappings
      const isoCodesPath = path.join(this.dataPath, 'country-iso-codes.json');
      const isoCodesJSON = await fs.readFile(isoCodesPath, 'utf-8');
      const isoCodesData = JSON.parse(isoCodesJSON);
      this.isoCodeMap = isoCodesData.codes;

      // Create reverse lookup: ISO code -> country name
      this.codeToName = {};
      for (const [name, code] of Object.entries(this.isoCodeMap)) {
        if (!this.codeToName[code]) {
          this.codeToName[code] = name;
        }
      }

      this.initialized = true;
      console.log(`[NaturalEarthLoader] ✅ Loaded ${this.countriesData.features.length} countries and ${this.provincesData.features.length} provinces`);
    } catch (error) {
      console.error('[NaturalEarthLoader] Failed to load Natural Earth data:', error);
      throw new Error('Failed to initialize Natural Earth loader');
    }
  }

  /**
   * Get boundary geometry for a region
   * 
   * @param {string} regionCode - ISO code (e.g., "IND", "USA") OR province code (e.g., "US-CA") OR province name (e.g., "California")
   * @param {string} regionType - Type of region ("country", "countries", "province", etc.)
   * @param {string} regionName - Optional: Full region name (used for provinces if regionCode is a code)
   * @returns {Object} GeoJSON geometry object with type and coordinates
   */
  async getBoundaryGeometry(regionCode, regionType = 'country', regionName = null) {
    await this.initialize();

    // Normalize region type (accept both singular and plural)
    const normalizedType = regionType.toLowerCase().replace(/ies$/, 'y').replace(/s$/, ''); // countries → country, provinces → province

    console.log(`[NaturalEarthLoader] Loading geometry for: "${regionCode}" (${normalizedType}) [name: ${regionName}]`);

    try {
      let feature = null;

      // Handle different region types
      if (normalizedType === 'country') {
        feature = this.findCountryByISOCode(regionCode);
      } else if (normalizedType === 'province') {
        // For provinces, use regionName if provided (more reliable), fallback to regionCode
        const searchTerm = regionName || regionCode;
        console.log(`[NaturalEarthLoader] Searching for province with term: "${searchTerm}"`);
        feature = await this.findProvinceByName(searchTerm); // Await for on-demand loading
      } else {
        console.warn(`[NaturalEarthLoader] Unsupported region type: ${normalizedType}`);
        return this.getPlaceholderGeometry();
      }
      
      if (!feature) {
        console.warn(`[NaturalEarthLoader] No ${normalizedType} found for code: ${regionCode}`);
        return this.getPlaceholderGeometry();
      }

      const geometry = feature.geometry;

      // ✅ KEEP FULL MULTIPOLYGON - Don't simplify!
      // Return the complete geometry with ALL parts
      if (geometry.type === 'MultiPolygon' || geometry.type === 'Polygon') {
        if (!geometry.coordinates || geometry.coordinates.length === 0) {
          console.warn(`[NaturalEarthLoader] Invalid geometry structure for ${regionCode}`);
          return this.getPlaceholderGeometry();
        }
        
        const partCount = geometry.type === 'MultiPolygon' ? geometry.coordinates.length : 1;
        console.log(`[NaturalEarthLoader] ✅ Loaded ${geometry.type} with ${partCount} part(s) for ${regionCode}`);
        
        return geometry; // Return FULL geometry
      }

      console.warn(`[NaturalEarthLoader] Unexpected geometry type: ${geometry.type}`);
      return this.getPlaceholderGeometry();

    } catch (error) {
      console.error(`[NaturalEarthLoader] Error loading geometry for ${regionCode}:`, error);
      return this.getPlaceholderGeometry();
    }
  }
  
  /**
   * Find province feature by name
   * 
   * @param {string} provinceName - Province name (e.g., "Orientale", "California", "Tibesti")
   * @returns {Object|null} GeoJSON feature or null
   */
  async findProvinceByName(provinceName) {
    // Load provinces data on demand if not loaded
    if (!this.provincesData) {
      console.log('[NaturalEarthLoader] Provinces data not loaded, fetching from GitHub...');
      try {
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson');
        this.provincesData = await response.json();
        console.log(`[NaturalEarthLoader] ✅ Fetched ${this.provincesData.features.length} provinces from GitHub`);
      } catch (error) {
        console.error('[NaturalEarthLoader] Failed to fetch provinces data:', error);
        return null;
      }
    }

    if (!this.provincesData || !this.provincesData.features) {
      console.warn('[NaturalEarthLoader] Provinces data not available');
      return null;
    }

    // Normalize province name for comparison (case-insensitive)
    const normalizedName = provinceName.toLowerCase().trim();
    
    console.log(`[NaturalEarthLoader] Searching for province: "${provinceName}" (normalized: "${normalizedName}")`);

    // Search for province by multiple property fields (cast wider net)
    const feature = this.provincesData.features.find(f => {
      const props = f.properties;
      
      // Check all common name fields in Natural Earth data
      const nameFields = [
        props.NAME,           // Primary name
        props.name,           // Lowercase name
        props.name_en,        // English name
        props.name_local,     // Local name
        props.name_alt,       // Alternative name
        props.woe_name,       // Where On Earth name
        props.gn_name,        // GeoNames name
        props.admin,          // Admin name
        props.name_long,      // Long form name
        props.formal_en       // Formal English name
      ];
      
      // Check if any field matches (case-insensitive)
      const match = nameFields.some(field => {
        if (!field) return false;
        const fieldValue = String(field).toLowerCase().trim();
        return fieldValue === normalizedName || 
               fieldValue.includes(normalizedName) ||
               normalizedName.includes(fieldValue);
      });
      
      if (match) {
        console.log(`[NaturalEarthLoader] 🔍 Match found in properties:`, {
          NAME: props.NAME,
          name_en: props.name_en,
          admin: props.admin,
          country: props.admin_0 || props.adm0_a3
        });
      }
      
      return match;
    });

    if (feature) {
      const partCount = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates.length : 1;
      const coordCount = feature.geometry.type === 'MultiPolygon' ? 
        feature.geometry.coordinates[0][0].length : 
        feature.geometry.coordinates[0].length;
      console.log(`[NaturalEarthLoader] ✅ Found province: ${feature.properties.NAME || feature.properties.name} (${feature.geometry.type} with ${partCount} parts, ${coordCount} coordinates)`);
    } else {
      console.warn(`[NaturalEarthLoader] ❌ Province not found: "${provinceName}"`);
      console.warn(`[NaturalEarthLoader] 💡 Tip: Check if province name matches Natural Earth data exactly`);
      
      // Log a few similar names to help debugging
      const similarNames = this.provincesData.features
        .filter(f => {
          const name = (f.properties.NAME || f.properties.name || '').toLowerCase();
          return name.includes(normalizedName.substring(0, 3)) || 
                 normalizedName.includes(name.substring(0, 3));
        })
        .slice(0, 5)
        .map(f => f.properties.NAME || f.properties.name);
      
      if (similarNames.length > 0) {
        console.warn(`[NaturalEarthLoader] 💡 Similar names found: ${similarNames.join(', ')}`);
      }
    }

    return feature;
  }

  /**
   * Find country feature by ISO 3166-1 alpha-3 code
   * 
   * @param {string} isoCode - ISO code (e.g., "IND", "USA")
   * @returns {Object|null} GeoJSON feature or null
   */
  findCountryByISOCode(isoCode) {
    if (!this.countriesData || !this.countriesData.features) {
      return null;
    }

    // Search for country by ISO_A3 property
    const feature = this.countriesData.features.find(f => {
      const props = f.properties;
      return props.ISO_A3 === isoCode || 
             props.ADM0_A3 === isoCode ||
             props.ISO_A3_EH === isoCode;
    });

    if (feature) {
      console.log(`[NaturalEarthLoader] Found country: ${feature.properties.ADMIN} (${isoCode})`);
    }

    return feature;
  }

  /**
   * Simplify MultiPolygon to Polygon by selecting largest polygon
   * 
   * @param {Object} multiPolygonGeometry - MultiPolygon geometry
   * @returns {Object} Polygon geometry
   */
  simplifyMultiPolygon(multiPolygonGeometry) {
    const polygons = multiPolygonGeometry.coordinates;
    
    if (!polygons || polygons.length === 0) {
      return this.getPlaceholderGeometry();
    }

    // Find the largest polygon by number of coordinates
    let largestPolygon = polygons[0];
    let maxCoords = this.countCoordinates(polygons[0]);

    for (let i = 1; i < polygons.length; i++) {
      const coordCount = this.countCoordinates(polygons[i]);
      if (coordCount > maxCoords) {
        maxCoords = coordCount;
        largestPolygon = polygons[i];
      }
    }

    console.log(`[NaturalEarthLoader] Simplified MultiPolygon to largest polygon (${maxCoords} coordinates)`);

    return {
      type: 'Polygon',
      coordinates: largestPolygon
    };
  }

  /**
   * Count coordinates in a polygon
   * 
   * @param {Array} polygon - Polygon coordinates array
   * @returns {number} Total coordinate count
   */
  countCoordinates(polygon) {
    if (!polygon || !polygon[0]) return 0;
    return polygon[0].length;
  }

  /**
   * Get placeholder geometry for fallback
   * 
   * @returns {Object} Default square geometry
   */
  getPlaceholderGeometry() {
    return {
      type: 'Polygon',
      coordinates: [[
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]]
    };
  }

  /**
   * Get region name from ISO code
   * 
   * @param {string} isoCode - ISO code
   * @returns {string} Region name or code if not found
   */
  getRegionName(isoCode) {
    if (!this.initialized) {
      return isoCode;
    }
    return this.codeToName[isoCode] || isoCode;
  }

  /**
   * Search for countries by name (fuzzy search)
   * 
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Array} Array of {name, code, feature} objects
   */
  async searchCountries(query, limit = 10) {
    await this.initialize();

    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const feature of this.countriesData.features) {
      const props = feature.properties;
      const name = props.ADMIN || props.NAME || '';
      const code = props.ISO_A3 || props.ADM0_A3 || '';

      if (name.toLowerCase().includes(lowerQuery)) {
        results.push({
          name,
          code,
          feature
        });

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Get all available country codes
   * 
   * @returns {Array} Array of ISO codes
   */
  async getAllCountryCodes() {
    await this.initialize();

    return this.countriesData.features
      .map(f => f.properties.ISO_A3 || f.properties.ADM0_A3)
      .filter(code => code && code !== '-99');
  }

  /**
   * Validate ISO code exists
   * 
   * @param {string} isoCode - ISO code to validate
   * @returns {boolean} True if valid
   */
  async isValidCountryCode(isoCode) {
    await this.initialize();
    const feature = this.findCountryByISOCode(isoCode);
    return feature !== null;
  }
}

// Create singleton instance
export const naturalEarthLoader = new NaturalEarthLoader();

// Named exports for testing
export { NaturalEarthLoader };
