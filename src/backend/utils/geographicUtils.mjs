/**
 * Geographic Utilities - Continent Detection and Country Mapping
 * 
 * Provides continent detection for all approved countries
 * Ensures every candidate has complete geographic data for clustering
 */

/**
 * Map country codes to continents
 */
export const COUNTRY_TO_CONTINENT = {
  // North America
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  
  // South America  
  'BR': 'South America',
  'AR': 'South America',
  'CO': 'South America',
  'PE': 'South America',
  'CL': 'South America',
  'VE': 'South America',
  'EC': 'South America',
  'BO': 'South America',
  'PY': 'South America',
  'UY': 'South America',
  
  // Europe
  'GB': 'Europe',
  'FR': 'Europe',
  'DE': 'Europe',
  'IT': 'Europe',
  'ES': 'Europe',
  'PL': 'Europe',
  'RO': 'Europe',
  'NL': 'Europe',
  'BE': 'Europe',
  'CZ': 'Europe',
  'PT': 'Europe',
  'GR': 'Europe',
  'HU': 'Europe',
  'SE': 'Europe',
  'AT': 'Europe',
  'CH': 'Europe',
  'BG': 'Europe',
  'DK': 'Europe',
  'FI': 'Europe',
  'SK': 'Europe',
  'NO': 'Europe',
  'IE': 'Europe',
  'HR': 'Europe',
  'BA': 'Europe',
  'LT': 'Europe',
  'SI': 'Europe',
  'LV': 'Europe',
  'EE': 'Europe',
  'MK': 'Europe',
  'AL': 'Europe',
  'RS': 'Europe',
  'ME': 'Europe',
  'XK': 'Europe',
  'IS': 'Europe',
  'LU': 'Europe',
  'MT': 'Europe',
  'AD': 'Europe',
  'MC': 'Europe',
  'SM': 'Europe',
  'VA': 'Europe',
  'LI': 'Europe',
  
  // Asia
  'CN': 'Asia',
  'JP': 'Asia',
  'IN': 'Asia',
  'KR': 'Asia',
  'SA': 'Asia',
  'ID': 'Asia',
  'TR': 'Asia',
  'IR': 'Asia',
  'TH': 'Asia',
  'PK': 'Asia',
  'BD': 'Asia',
  'VN': 'Asia',
  'PH': 'Asia',
  'MY': 'Asia',
  'AF': 'Asia',
  'IQ': 'Asia',
  'UZ': 'Asia',
  'YE': 'Asia',
  'NP': 'Asia',
  'KH': 'Asia',
  'LA': 'Asia',
  'JO': 'Asia',
  'AE': 'Asia',
  'TJ': 'Asia',
  'IL': 'Asia',
  'LB': 'Asia',
  'KG': 'Asia',
  'TM': 'Asia',
  'SG': 'Asia',
  'OM': 'Asia',
  'KW': 'Asia',
  'GE': 'Asia',
  'AM': 'Asia',
  'QA': 'Asia',
  'BH': 'Asia',
  'TL': 'Asia',
  'BT': 'Asia',
  'MN': 'Asia',
  'MV': 'Asia',
  'BN': 'Asia',
  
  // Africa
  'NG': 'Africa',
  'ZA': 'Africa',
  'EG': 'Africa',
  'ET': 'Africa',
  'KE': 'Africa',
  'DZ': 'Africa',
  'TZ': 'Africa',
  'UG': 'Africa',
  'GH': 'Africa',
  'MA': 'Africa',
  'AO': 'Africa',
  'SD': 'Africa',
  'MZ': 'Africa',
  'MG': 'Africa',
  'CM': 'Africa',
  'CI': 'Africa',
  'NE': 'Africa',
  'BF': 'Africa',
  'ML': 'Africa',
  'MW': 'Africa',
  'ZM': 'Africa',
  'SN': 'Africa',
  'SO': 'Africa',
  'TD': 'Africa',
  'ZW': 'Africa',
  'GN': 'Africa',
  'RW': 'Africa',
  'BJ': 'Africa',
  'TN': 'Africa',
  'BI': 'Africa',
  'SS': 'Africa',
  'TG': 'Africa',
  'SL': 'Africa',
  'LY': 'Africa',
  'LR': 'Africa',
  'MR': 'Africa',
  'CF': 'Africa',
  'ER': 'Africa',
  'GM': 'Africa',
  'BW': 'Africa',
  'GA': 'Africa',
  'GW': 'Africa',
  'MU': 'Africa',
  'SZ': 'Africa',
  'DJ': 'Africa',
  'KM': 'Africa',
  'GQ': 'Africa',
  'CV': 'Africa',
  'ST': 'Africa',
  'SC': 'Africa',
  
  // Oceania
  'AU': 'Oceania',
  'NZ': 'Oceania',
  'PG': 'Oceania',
  'FJ': 'Oceania',
  'SB': 'Oceania',
  'NC': 'Oceania',
  'PF': 'Oceania',
  'VU': 'Oceania',
  'WS': 'Oceania',
  'GU': 'Oceania',
  'KI': 'Oceania',
  'FM': 'Oceania',
  'TO': 'Oceania',
  'PW': 'Oceania',
  'MH': 'Oceania',
  'NR': 'Oceania',
  'TV': 'Oceania'
};

/**
 * Get continent for a country code
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {string} Continent name
 */
export function getContinent(countryCode) {
  if (!countryCode) {
    return 'Unknown';
  }
  
  // Normalize to uppercase
  const normalizedCode = countryCode.toUpperCase();
  
  return COUNTRY_TO_CONTINENT[normalizedCode] || 'Unknown';
}

/**
 * Detect continent from coordinates (fallback method)
 * @param {Object} location - Location object with lat/lng or latitude/longitude
 * @returns {string} Continent name
 */
export function detectContinentFromCoordinates(location) {
  if (!location) {
    return 'Unknown';
  }
  
  const lat = location.lat || location.latitude || 0;
  const lng = location.lng || location.longitude || 0;
  
  // Simple continent detection based on coordinate ranges
  // These are approximate and will have edge cases
  
  // Africa
  if (lng >= -20 && lng <= 55 && lat >= -35 && lat <= 38) {
    return 'Africa';
  }
  
  // Europe
  if (lng >= -25 && lng <= 45 && lat >= 35 && lat <= 72) {
    return 'Europe';
  }
  
  // Asia
  if (lng >= 25 && lng <= 180 && lat >= -10 && lat <= 80) {
    return 'Asia';
  }
  
  // North America
  if (lng >= -170 && lng <= -50 && lat >= 15 && lat <= 72) {
    return 'North America';
  }
  
  // South America
  if (lng >= -82 && lng <= -34 && lat >= -56 && lat <= 13) {
    return 'South America';
  }
  
  // Oceania
  if ((lng >= 110 && lng <= 180) && (lat >= -50 && lat <= -10)) {
    return 'Oceania';
  }
  if ((lng >= -180 && lng <= -130) && (lat >= -50 && lat <= 20)) {
    return 'Oceania';
  }
  
  return 'Unknown';
}

/**
 * Validate and enrich candidate geographic data
 * @param {Object} candidate - Candidate object
 * @param {string} countryCode - Country code
 * @returns {Object} Enriched candidate with guaranteed geographic fields
 */
export function enrichCandidateGeography(candidate, countryCode) {
  const enriched = { ...candidate };
  
  // Ensure country code
  if (!enriched.countryCode && countryCode) {
    enriched.countryCode = countryCode;
  }
  
  // Detect continent from country code
  if (!enriched.continent && enriched.countryCode) {
    enriched.continent = getContinent(enriched.countryCode);
  }
  
  // Fallback: detect continent from coordinates
  if (enriched.continent === 'Unknown' && enriched.location) {
    enriched.continent = detectContinentFromCoordinates(enriched.location);
  }
  
  // Ensure country name is set
  if (!enriched.country && enriched.countryCode) {
    enriched.country = enriched.countryCode; // Will be replaced with full name in backend
  }
  
  return enriched;
}

/**
 * Get basic country data for countries without province data
 * @param {string} countryCode - Country code
 * @returns {Object|null} Basic country data
 */
export function getBasicCountryData(countryCode) {
  const continent = getContinent(countryCode);
  
  if (continent === 'Unknown') {
    return null;
  }
  
  // Return basic structure matching provinceDataService format
  return {
    code: countryCode,
    name: countryCode, // Will be replaced with full name
    continent: continent,
    hasProvinces: false,
    provinceCount: 0,
    bounds: null // Will be calculated
  };
}

export default {
  COUNTRY_TO_CONTINENT,
  getContinent,
  detectContinentFromCoordinates,
  enrichCandidateGeography,
  getBasicCountryData
};
