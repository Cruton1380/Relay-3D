/**
 * UnifiedBoundaryService - Single authoritative boundary management service
 * 
 * Now powered by comprehensive Natural Earth-style province data
 * Supports proper province-level clustering for all major countries
 * 
 * Key Features:
 * - Province-aware coordinate generation for 10+ countries
 * - Proper clustering centroids for all administrative levels
 * - Consistent province metadata for channel generation
 * - Scalable data structure ready for worldwide expansion
 * - Automatic continent detection for ALL countries
 * - Graceful fallback for countries without province data
 */

import provinceDataService from './provinceDataService.mjs';
import { getCountryData, generateCoordinatesInCountry } from '../routes/devCenter.mjs';
import { getContinent, enrichCandidateGeography } from '../utils/geographicUtils.mjs';

class UnifiedBoundaryService {
  constructor() {
    this.initialized = false;
    this.provinceService = provinceDataService;
    
    console.log('🌍 UnifiedBoundaryService: Initialized with comprehensive province data');
  }

  /**
   * Initialize the service with Natural Earth data
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🌍 UnifiedBoundaryService: Loading Natural Earth-style province data...');
    await this.provinceService.initialize();
    
    const stats = await this.provinceService.getStatistics();
    console.log(`🌍 UnifiedBoundaryService: Ready - ${stats.totalCountries} countries, ${stats.totalProvinces} provinces`);
    
    this.initialized = true;
  }

  /**
   * Generate coordinates for a candidate within a country
   * @param {string} countryCode - Country code (e.g., 'IT', 'ES', 'FR', 'US', 'CN', etc.)
   * @returns {Object} Coordinate data with province information AND continent
   */
  async generateCandidateCoordinates(countryCode) {
    await this.initialize();
    
    // **ALWAYS** detect continent first
    const continent = getContinent(countryCode);
    
    // Try Natural Earth data first (preferred for province-level accuracy)
    const countryData = await this.provinceService.getCountryData(countryCode);
    if (countryData && countryData.provinces && countryData.provinces.length > 0) {
      // Select random province and generate coordinates within it
      const provinces = countryData.provinces;
      const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
      
      console.log(`🗺️ [PROVINCE GEN] Generating coordinates in ${randomProvince.name}, ${countryData.name} (${continent})`);
      const coordData = await this.provinceService.generateProvinceCoordinates(countryCode, randomProvince.name);
      
      if (coordData) {
        console.log(`✅ [PROVINCE GEN] Generated ${countryCode} coordinates: [${coordData.location.lat.toFixed(4)}, ${coordData.location.lng.toFixed(4)}] in ${coordData.province}`);
        // **ENSURE** continent is always included
        return {
          ...coordData,
          continent: continent,
          countryCode: countryCode
        };
      }
    }
    
    // Fallback to legacy system for countries without Natural Earth data
    console.log(`⚠️ [FALLBACK] Using legacy coordinate generation for ${countryCode} (${continent})`);
    const legacyCountryData = getCountryData(countryCode);
    if (!legacyCountryData) {
      console.warn(`🌍 UnifiedBoundaryService: No data found for country: ${countryCode}`);
      return null;
    }

    const coordData = generateCoordinatesInCountry(legacyCountryData);
    
    // **ENRICH** with continent and ensure no province is set (country-level only)
    return {
      location: {
        lat: coordData.lat,
        lng: coordData.lng
      },
      coordinates: [coordData.lng, coordData.lat], // Cesium format
      province: coordData.province || null, // null if no province data (enables country-level clustering)
      city: coordData.city || null,
      country: countryCode,
      countryName: legacyCountryData.name,
      countryCode: countryCode, // Ensure countryCode is always present
      continent: continent // Use detected continent, not legacy data (which may be missing)
    };
  }

  /**
   * Get country data by code or name
   * @param {string} country - Country code or name
   * @returns {Object} Country data with provinces
   */
  async getCountryData(country) {
    await this.initialize();
    return getCountryData(country);
  }

  /**
   * Get all available countries (now includes comprehensive Natural Earth data)
   * @returns {Array} List of available countries with province support
   */
  async getAvailableCountries() {
    await this.initialize();
    
    // Get comprehensive data from Natural Earth service
    const countriesWithProvinces = await this.provinceService.getCountriesWithProvinces();
    
    return countriesWithProvinces.map(country => ({
      code: country.code,
      name: country.name,
      continent: country.continent,
      hasProvinces: country.hasProvinces,
      provinceCount: country.provinceCount
    }));
  }

  /**
   * Get provinces for a country
   * @param {string} countryCode - Country code
   * @returns {Array} List of provinces
   */
  async getProvincesForCountry(countryCode) {
    await this.initialize();
    
    const countryData = getCountryData(countryCode);
    if (!countryData || !countryData.provinces) {
      return [];
    }
    
    return countryData.provinces.map(province => ({
      name: province.name,
      bounds: province.bounds,
      cities: province.cities
    }));
  }

  /**
   * Validate coordinates are within country bounds
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} countryCode - Country code
   * @returns {boolean} True if coordinates are within bounds
   */
  async validateCoordinates(lat, lng, countryCode) {
    await this.initialize();
    
    const countryData = getCountryData(countryCode);
    if (!countryData || !countryData.bounds) {
      return false;
    }
    
    const bounds = countryData.bounds;
    return lat >= bounds.south && lat <= bounds.north && 
           lng >= bounds.west && lng <= bounds.east;
  }

  /**
   * Get clustering data for a region
   * @param {string} countryCode - Country code
   * @param {string} provinceName - Province name (optional)
   * @returns {Object} Clustering metadata
   */
  async getClusteringData(countryCode, provinceName = null) {
    await this.initialize();
    
    const countryData = getCountryData(countryCode);
    if (!countryData) {
      return null;
    }
    
    if (provinceName && countryData.provinces) {
      const province = countryData.provinces.find(p => p.name === provinceName);
      if (province) {
        return {
          level: 'province',
          name: province.name,
          bounds: province.bounds,
          country: countryData.name,
          continent: countryData.continent
        };
      }
    }
    
    return {
      level: 'country',
      name: countryData.name,
      bounds: countryData.bounds,
      continent: countryData.continent,
      hasProvinces: !!(countryData.provinces && countryData.provinces.length > 0)
    };
  }

  /**
   * Get governance regions for a country
   * @param {string} countryCode - Country code
   * @returns {Array} Governance regions
   */
  async getGovernanceRegions(countryCode) {
    await this.initialize();
    
    const countryData = getCountryData(countryCode);
    if (!countryData) {
      return [];
    }
    
    // Return provinces as governance regions if available
    if (countryData.provinces) {
      return countryData.provinces.map(province => ({
        id: `${countryCode}-${province.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: province.name,
        type: 'province',
        bounds: province.bounds,
        country: countryCode,
        countryName: countryData.name
      }));
    }
    
    // Fallback to country-level governance
    return [{
      id: countryCode,
      name: countryData.name,
      type: 'country',
      bounds: countryData.bounds,
      country: countryCode,
      countryName: countryData.name
    }];
  }

  /**
   * Get province centroid for clustering
   * @param {string} provinceName - Province name
   * @param {string} countryCode - Country code (optional)
   * @returns {Array} [longitude, latitude] centroid coordinates
   */
  async getProvinceCentroid(provinceName, countryCode = null) {
    await this.initialize();
    
    const centroid = await this.provinceService.getProvinceCentroid(provinceName, countryCode);
    if (centroid) {
      return centroid; // Already in [lng, lat] format
    }
    
    // Fallback: try legacy data
    if (countryCode) {
      const countryData = getCountryData(countryCode);
      if (countryData && countryData.provinces) {
        const province = countryData.provinces.find(p => p.name === provinceName);
        if (province && province.bounds) {
          // Calculate center of bounds
          const centerLng = (province.bounds.west + province.bounds.east) / 2;
          const centerLat = (province.bounds.south + province.bounds.north) / 2;
          return [centerLng, centerLat];
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a country has province-level data
   * @param {string} countryCode - Country code
   * @returns {boolean} True if country has province data
   */
  async hasProvinceData(countryCode) {
    await this.initialize();
    
    const countryData = await this.provinceService.getCountryData(countryCode);
    return countryData && countryData.provinces && countryData.provinces.length > 0;
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  async getStatistics() {
    await this.initialize();
    
    const stats = await this.provinceService.getStatistics();
    
    return {
      ...stats,
      dataSource: 'Natural Earth + Legacy',
      clusterable: 'Province-level clustering supported'
    };
  }
}

// Export singleton instance
const unifiedBoundaryService = new UnifiedBoundaryService();
export default unifiedBoundaryService;

