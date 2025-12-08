/**
 * BOUNDARY DATA ADAPTER
 * Bridges the old BOUNDARY_DATA format with the new geoBoundaryService
 * Provides backward compatibility while using the unified API
 */

import { geoBoundaryService } from '../frontend/services/geoBoundaryService.js';

// Cache for adapted data
let countriesCache = null;
let provincesCacheMap = new Map();

/**
 * Get all countries in the old format
 * @returns {Promise<Array>} Countries with bounds
 */
export async function getAllCountries() {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const countries = await geoBoundaryService.listCountries();
    
    // Adapt to old format
    countriesCache = countries.map(c => ({
      name: c.name,
      code: c.code,
      bounds: c.bounds,
      continent: determineContinent(c.code) // Helper function below
    }));

    return countriesCache;
  } catch (error) {
    console.error('Failed to load countries from geoBoundaryService:', error);
    // Fallback to hardcoded data if service fails
    return getHardcodedCountries();
  }
}

/**
 * Get country by code
 * @param {string} code - ISO3 country code
 * @returns {Promise<Object|null>}
 */
export async function getCountryByCode(code) {
  const countries = await getAllCountries();
  return countries.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
}

/**
 * Get provinces for a country
 * @param {string} countryCode - ISO3 country code
 * @returns {Promise<Array>}
 */
export async function getProvinces(countryCode) {
  const cacheKey = countryCode.toUpperCase();
  
  if (provincesCacheMap.has(cacheKey)) {
    return provincesCacheMap.get(cacheKey);
  }

  try {
    const provinces = await geoBoundaryService.listProvinces(countryCode);
    
    // Adapt to old format
    const adapted = provinces.map(p => ({
      name: p.name,
      code: p.code,
      bounds: p.bounds,
      cities: [] // Cities will be loaded on-demand
    }));

    provincesCacheMap.set(cacheKey, adapted);
    return adapted;
  } catch (error) {
    console.error(`Failed to load provinces for ${countryCode}:`, error);
    return [];
  }
}

/**
 * Get cities for a province
 * @param {string} countryCode - ISO3 country code
 * @param {string} provinceCode - Province code
 * @returns {Promise<Array>}
 */
export async function getCities(countryCode, provinceCode) {
  try {
    const cities = await geoBoundaryService.listCities(countryCode, provinceCode);
    
    // Adapt to old format
    return cities.map(c => ({
      name: c.name,
      code: c.code,
      bounds: c.bounds
    }));
  } catch (error) {
    console.error(`Failed to load cities for ${countryCode}/${provinceCode}:`, error);
    return [];
  }
}

/**
 * Generate coordinates within a region
 * @param {Object} params
 * @returns {Promise<Array>}
 */
export async function generateCoordinates({ countryCode, provinceCode, cityCode, count = 1 }) {
  try {
    return await geoBoundaryService.generateCoordinates({
      countryCode,
      provinceCode,
      cityCode,
      count
    });
  } catch (error) {
    console.error('Failed to generate coordinates:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine continent from country code
 * @param {string} code - ISO3 country code
 * @returns {string} Continent name
 */
function determineContinent(code) {
  const continentMap = {
    // North America
    'USA': 'North America', 'CAN': 'North America', 'MEX': 'North America',
    // South America
    'BRA': 'South America', 'ARG': 'South America', 'CHL': 'South America',
    'COL': 'South America', 'PER': 'South America', 'VEN': 'South America',
    // Europe
    'GBR': 'Europe', 'FRA': 'Europe', 'DEU': 'Europe', 'ITA': 'Europe',
    'ESP': 'Europe', 'POL': 'Europe', 'ROU': 'Europe', 'NLD': 'Europe',
    'BEL': 'Europe', 'GRC': 'Europe', 'CZE': 'Europe', 'PRT': 'Europe',
    'SWE': 'Europe', 'HUN': 'Europe', 'AUT': 'Europe', 'BGR': 'Europe',
    'DNK': 'Europe', 'FIN': 'Europe', 'SVK': 'Europe', 'NOR': 'Europe',
    'IRL': 'Europe', 'HRV': 'Europe', 'BIH': 'Europe', 'SRB': 'Europe',
    'CHE': 'Europe', 'UKR': 'Europe', 'BLR': 'Europe',
    // Asia
    'CHN': 'Asia', 'IND': 'Asia', 'JPN': 'Asia', 'IDN': 'Asia',
    'PAK': 'Asia', 'BGD': 'Asia', 'RUS': 'Asia', 'THA': 'Asia',
    'VNM': 'Asia', 'PHL': 'Asia', 'TUR': 'Asia', 'IRN': 'Asia',
    'IRQ': 'Asia', 'SAU': 'Asia', 'YEM': 'Asia', 'SYR': 'Asia',
    'KOR': 'Asia', 'PRK': 'Asia', 'MYS': 'Asia', 'NPL': 'Asia',
    'AFG': 'Asia', 'UZB': 'Asia', 'KAZ': 'Asia', 'SGP': 'Asia',
    // Africa
    'NGA': 'Africa', 'ETH': 'Africa', 'EGY': 'Africa', 'COD': 'Africa',
    'ZAF': 'Africa', 'TZA': 'Africa', 'KEN': 'Africa', 'UGA': 'Africa',
    'DZA': 'Africa', 'SDN': 'Africa', 'MAR': 'Africa', 'AGO': 'Africa',
    'GHA': 'Africa', 'MOZ': 'Africa', 'CMR': 'Africa', 'CIV': 'Africa',
    // Oceania
    'AUS': 'Oceania', 'NZL': 'Oceania', 'PNG': 'Oceania', 'FJI': 'Oceania'
  };

  return continentMap[code.toUpperCase()] || 'Unknown';
}

/**
 * Fallback hardcoded countries (minimal set)
 * Used only if geoBoundaryService fails
 */
function getHardcodedCountries() {
  return [
    { name: 'United States', code: 'USA', bounds: { north: 49.3, south: 24.7, east: -66.9, west: -124.7 }, continent: 'North America' },
    { name: 'Canada', code: 'CAN', bounds: { north: 83.6, south: 41.6, east: -52.6, west: -141.0 }, continent: 'North America' },
    { name: 'Mexico', code: 'MEX', bounds: { north: 32.7, south: 14.5, east: -86.8, west: -118.4 }, continent: 'North America' },
    { name: 'Brazil', code: 'BRA', bounds: { north: 5.2, south: -33.7, east: -32.0, west: -73.9 }, continent: 'South America' },
    { name: 'Argentina', code: 'ARG', bounds: { north: -21.8, south: -55.1, east: -53.6, west: -73.4 }, continent: 'South America' },
    { name: 'United Kingdom', code: 'GBR', bounds: { north: 60.9, south: 49.9, east: 1.9, west: -7.6 }, continent: 'Europe' },
    { name: 'France', code: 'FRA', bounds: { north: 51.1, south: 41.3, east: 9.6, west: -5.6 }, continent: 'Europe' },
    { name: 'Germany', code: 'DEU', bounds: { north: 55.0, south: 47.2, east: 15.0, west: 5.8 }, continent: 'Europe' },
    { name: 'Italy', code: 'ITA', bounds: { north: 46.5, south: 37.5, east: 18.0, west: 7.5 }, continent: 'Europe' },
    { name: 'Spain', code: 'ESP', bounds: { north: 43.7, south: 36.0, east: 4.3, west: -9.3 }, continent: 'Europe' },
    { name: 'China', code: 'CHN', bounds: { north: 53.5, south: 18.1, east: 134.7, west: 73.5 }, continent: 'Asia' },
    { name: 'India', code: 'IND', bounds: { north: 35.5, south: 6.7, east: 97.4, west: 68.1 }, continent: 'Asia' },
    { name: 'Japan', code: 'JPN', bounds: { north: 45.5, south: 24.2, east: 145.8, west: 122.9 }, continent: 'Asia' },
    { name: 'Turkey', code: 'TUR', bounds: { north: 42.1, south: 35.8, east: 44.8, west: 25.6 }, continent: 'Asia' },
    { name: 'Australia', code: 'AUS', bounds: { north: -10.0, south: -43.6, east: 153.6, west: 113.3 }, continent: 'Oceania' },
    { name: 'South Africa', code: 'ZAF', bounds: { north: -22.1, south: -34.8, east: 32.9, west: 16.4 }, continent: 'Africa' },
    { name: 'Egypt', code: 'EGY', bounds: { north: 31.7, south: 22.0, east: 36.9, west: 24.7 }, continent: 'Africa' },
    { name: 'Nigeria', code: 'NGA', bounds: { north: 13.9, south: 4.2, east: 14.7, west: 2.6 }, continent: 'Africa' }
  ];
}

/**
 * Clear all caches
 */
export function clearCache() {
  countriesCache = null;
  provincesCacheMap.clear();
  geoBoundaryService.clearCache();
}
