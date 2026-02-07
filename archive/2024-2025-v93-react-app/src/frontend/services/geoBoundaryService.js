// ============================================================================
// geoBoundaryService.js - Frontend Boundary Data Service
// ============================================================================
// Unified service for loading administrative boundary data
// Used by Channel Generator, Globe visualization, and Clustering
// ============================================================================

const API_BASE = 'http://localhost:3002/api/boundaries';

class GeoBoundaryService {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  // ==========================================================================
  // List Methods (For Dropdowns)
  // ==========================================================================

  /**
   * Get list of all available countries
   * @returns {Promise<Array>} Array of {code, name, bounds}
   */
  async listCountries() {
    const cacheKey = 'countries-list';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const promise = fetch(`${API_BASE}/countries`)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  /**
   * Get list of provinces for a country
   * @param {string} countryCode - ISO3 country code (e.g., 'ITA')
   * @returns {Promise<Array>} Array of {name, code, bounds}
   */
  async listProvinces(countryCode) {
    const cacheKey = `provinces-${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const promise = fetch(`${API_BASE}/provinces/${countryCode}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  /**
   * Get list of cities for a country (optionally filtered by province)
   * @param {string} countryCode - ISO3 country code
   * @param {string} [provinceCode] - Optional province code
   * @returns {Promise<Array>} Array of {name, code, bounds}
   */
  async listCities(countryCode, provinceCode = null) {
    const cacheKey = `cities-${countryCode}-${provinceCode || 'all'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const url = provinceCode 
      ? `${API_BASE}/cities/${countryCode}/${provinceCode}`
      : `${API_BASE}/cities/${countryCode}`;

    const promise = fetch(url)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  // ==========================================================================
  // GeoJSON Methods (For Visualization)
  // ==========================================================================

  /**
   * Get GeoJSON boundary for a country
   * @param {string} countryCode - ISO3 country code
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async getCountryBoundary(countryCode) {
    const cacheKey = `boundary-country-${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const promise = fetch(`${API_BASE}/geojson/country/${countryCode}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  /**
   * Get GeoJSON boundaries for all provinces in a country
   * @param {string} countryCode - ISO3 country code
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async getProvinceBoundaries(countryCode) {
    const cacheKey = `boundary-provinces-${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const promise = fetch(`${API_BASE}/geojson/provinces/${countryCode}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  /**
   * Get GeoJSON boundaries for all cities in a country
   * @param {string} countryCode - ISO3 country code
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async getCityBoundaries(countryCode) {
    const cacheKey = `boundary-cities-${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    const promise = fetch(`${API_BASE}/geojson/cities/${countryCode}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      });

    this.loading.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  // ==========================================================================
  // Coordinate Generation (For Channel Generator)
  // ==========================================================================

  /**
   * Generate random coordinates within a region using point-in-polygon
   * @param {Object} params
   * @param {string} params.countryCode - ISO3 country code (required)
   * @param {string} [params.provinceCode] - Province code (optional)
   * @param {string} [params.cityCode] - City code (optional)
   * @param {number} [params.count] - Number of coordinates to generate (default: 1)
   * @returns {Promise<Array>} Array of coordinate objects with metadata
   */
  async generateCoordinates({ countryCode, provinceCode, cityCode, count = 1 }) {
    const response = await fetch(`${API_BASE}/generate-coordinates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        countryCode,
        provinceCode,
        cityCode,
        count
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Get bounding box for a region
   * @param {string} countryCode - ISO3 country code
   * @param {string} [provinceCode] - Province code (optional)
   * @param {string} [cityCode] - City code (optional)
   * @returns {Promise<Object>} Bounds object {north, south, east, west}
   */
  async getBounds(countryCode, provinceCode = null, cityCode = null) {
    let url = `${API_BASE}/bounds/${countryCode}`;
    
    if (provinceCode) {
      url += `/${provinceCode}`;
    }
    
    if (cityCode) {
      url += `/${cityCode}`;
    }

    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear local cache
   */
  clearCache() {
    this.cache.clear();
    this.loading.clear();
    console.log('🗑️ GeoBoundaryService cache cleared');
  }

  /**
   * Clear server-side cache
   */
  async clearServerCache() {
    const response = await fetch(`${API_BASE}/cache`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    this.clearCache();
    return result;
  }

  /**
   * Get service status
   */
  async getStatus() {
    const response = await fetch(`${API_BASE}/status`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Convert country name to ISO3 code
   * @param {string} countryName - Country name
   * @returns {Promise<string|null>} ISO3 code or null if not found
   */
  async countryNameToCode(countryName) {
    const countries = await this.listCountries();
    const country = countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country?.code || null;
  }

  /**
   * Convert ISO3 code to country name
   * @param {string} countryCode - ISO3 code
   * @returns {Promise<string|null>} Country name or null if not found
   */
  async countryCodeToName(countryCode) {
    const countries = await this.listCountries();
    const country = countries.find(c => 
      c.code.toUpperCase() === countryCode.toUpperCase()
    );
    return country?.name || null;
  }
}

// Export singleton instance
export const geoBoundaryService = new GeoBoundaryService();
export default geoBoundaryService;
