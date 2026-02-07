/**
 * DynamicProvinceLoader - Load province data from Natural Earth dynamically
 * 
 * This service fetches comprehensive province data from the same Natural Earth
 * source that the frontend uses, ensuring backend and frontend are in sync.
 * 
 * Features:
 * - Downloads from Natural Earth GitHub repository (same as frontend)
 * - Caches data locally to avoid repeated network calls
 * - Parses GeoJSON and extracts province boundaries and centroids
 * - Builds fast lookup index for all countries
 * - Automatically refreshes stale cache
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NATURAL_EARTH_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const CACHE_FILE = path.join(__dirname, '..', '..', 'data', 'natural-earth-province-cache.json');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ISO3 to ISO2 mapping
const ISO3_TO_ISO2 = {
  'USA': 'US', 'CAN': 'CA', 'MEX': 'MX', 'DEU': 'DE', 'FRA': 'FR',
  'GBR': 'GB', 'ITA': 'IT', 'ESP': 'ES', 'CHN': 'CN', 'JPN': 'JP',
  'IND': 'IN', 'KOR': 'KR', 'SAU': 'SA', 'NGA': 'NG', 'ZAF': 'ZA',
  'EGY': 'EG', 'BRA': 'BR', 'ARG': 'AR', 'COL': 'CO', 'AUS': 'AU', 'NZL': 'NZ'
};

const COUNTRY_NAMES = {
  'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'DE': 'Germany',
  'FR': 'France', 'GB': 'United Kingdom', 'IT': 'Italy', 'ES': 'Spain',
  'CN': 'China', 'JP': 'Japan', 'IN': 'India', 'KR': 'South Korea',
  'SA': 'Saudi Arabia', 'NG': 'Nigeria', 'ZA': 'South Africa', 'EG': 'Egypt',
  'BR': 'Brazil', 'AR': 'Argentina', 'CO': 'Colombia', 'AU': 'Australia',
  'NZ': 'New Zealand'
};

const CONTINENTS = {
  'US': 'North America', 'CA': 'North America', 'MX': 'North America',
  'DE': 'Europe', 'FR': 'Europe', 'GB': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
  'CN': 'Asia', 'JP': 'Asia', 'IN': 'Asia', 'KR': 'Asia', 'SA': 'Asia',
  'NG': 'Africa', 'ZA': 'Africa', 'EG': 'Africa',
  'BR': 'South America', 'AR': 'South America', 'CO': 'South America',
  'AU': 'Oceania', 'NZ': 'Oceania'
};

class DynamicProvinceLoader {
  constructor() {
    this.countryData = new Map();
    this.provinceIndex = new Map();
    this.initialized = false;
  }

  /**
   * Calculate centroid from polygon coordinates
   */
  calculateCentroid(coordinates) {
    let allCoords = [];
    
    if (coordinates[0] && coordinates[0][0] && Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon
      coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          allCoords.push(...ring);
        });
      });
    } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
      // Polygon
      coordinates.forEach(ring => {
        allCoords.push(...ring);
      });
    }
    
    if (allCoords.length === 0) return [0, 0];
    
    const sum = allCoords.reduce((acc, coord) => {
      return [acc[0] + coord[0], acc[1] + coord[1]];
    }, [0, 0]);
    
    return [
      parseFloat((sum[0] / allCoords.length).toFixed(4)),
      parseFloat((sum[1] / allCoords.length).toFixed(4))
    ];
  }

  /**
   * Calculate bounding box from polygon coordinates
   */
  calculateBounds(coordinates) {
    let allCoords = [];
    
    if (coordinates[0] && coordinates[0][0] && Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon
      coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          allCoords.push(...ring);
        });
      });
    } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
      // Polygon
      coordinates.forEach(ring => {
        allCoords.push(...ring);
      });
    }
    
    if (allCoords.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }
    
    const lngs = allCoords.map(c => c[0]);
    const lats = allCoords.map(c => c[1]);
    
    return {
      north: parseFloat(Math.max(...lats).toFixed(4)),
      south: parseFloat(Math.min(...lats).toFixed(4)),
      east: parseFloat(Math.max(...lngs).toFixed(4)),
      west: parseFloat(Math.min(...lngs).toFixed(4))
    };
  }

  /**
   * Check if cache is valid
   */
  async isCacheValid() {
    try {
      const stats = await fs.stat(CACHE_FILE);
      const age = Date.now() - stats.mtimeMs;
      return age < CACHE_MAX_AGE_MS;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load data from cache
   */
  async loadFromCache() {
    try {
      console.log('🗺️ [DYNAMIC LOADER] Loading from cache...');
      const data = await fs.readFile(CACHE_FILE, 'utf8');
      const cached = JSON.parse(data);
      
      // Rebuild Maps from cached object
      for (const [code, countryInfo] of Object.entries(cached.countries)) {
        this.countryData.set(code, countryInfo);
        
        // Index provinces
        if (countryInfo.provinces) {
          countryInfo.provinces.forEach(province => {
            this.provinceIndex.set(province.name, {
              ...province,
              countryCode: code,
              countryName: countryInfo.name
            });
          });
        }
      }
      
      console.log(`✅ [DYNAMIC LOADER] Loaded from cache: ${this.countryData.size} countries, ${this.provinceIndex.size} provinces`);
      return true;
    } catch (error) {
      console.warn(`⚠️ [DYNAMIC LOADER] Cache load failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Download and parse Natural Earth data
   */
  async loadFromNaturalEarth() {
    console.log('📥 [DYNAMIC LOADER] Downloading from Natural Earth...');
    
    try {
      // Add 5 second timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(NATURAL_EARTH_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const geoData = await response.json();
      console.log(`✅ [DYNAMIC LOADER] Downloaded ${geoData.features.length} features`);
      
      // Group by country
      const countryProvinces = new Map();
      
      for (const feature of geoData.features) {
        const iso3 = feature.properties.iso_a2 || feature.properties.adm0_a3;
        const iso2 = ISO3_TO_ISO2[iso3] || iso3;
        
        // Skip countries not in our approved list
        if (!COUNTRY_NAMES[iso2]) continue;
        
        if (!countryProvinces.has(iso2)) {
          countryProvinces.set(iso2, []);
        }
        
        const provinceName = feature.properties.name || feature.properties.gn_name || 'Unknown';
        const centroid = this.calculateCentroid(feature.geometry.coordinates);
        const bounds = this.calculateBounds(feature.geometry.coordinates);
        
        countryProvinces.get(iso2).push({
          name: provinceName,
          bounds: bounds,
          centroid: centroid
        });
      }
      
      // Build country data structure
      for (const [code, provinces] of countryProvinces.entries()) {
        const countryBounds = {
          north: Math.max(...provinces.map(p => p.bounds.north)),
          south: Math.min(...provinces.map(p => p.bounds.south)),
          east: Math.max(...provinces.map(p => p.bounds.east)),
          west: Math.min(...provinces.map(p => p.bounds.west))
        };
        
        const countryInfo = {
          name: COUNTRY_NAMES[code],
          continent: CONTINENTS[code],
          bounds: countryBounds,
          provinces: provinces.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        };
        
        this.countryData.set(code, countryInfo);
        
        // Index provinces
        provinces.forEach(province => {
          this.provinceIndex.set(province.name, {
            ...province,
            countryCode: code,
            countryName: countryInfo.name
          });
        });
      }
      
      console.log(`✅ [DYNAMIC LOADER] Parsed: ${this.countryData.size} countries, ${this.provinceIndex.size} provinces`);
      
      // Save to cache
      await this.saveToCache();
      
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏱️ [DYNAMIC LOADER] Natural Earth download timed out after 5 seconds - using hardcoded data only`);
      } else {
        console.error(`❌ [DYNAMIC LOADER] Natural Earth download failed: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Save data to cache
   */
  async saveToCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        countries: Object.fromEntries(this.countryData)
      };
      
      await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`💾 [DYNAMIC LOADER] Saved to cache: ${CACHE_FILE}`);
    } catch (error) {
      console.warn(`⚠️ [DYNAMIC LOADER] Cache save failed: ${error.message}`);
    }
  }

  /**
   * Initialize the loader
   */
  async initialize() {
    if (this.initialized) return true;
    
    console.log('🌍 [DYNAMIC LOADER] Initializing...');
    
    // Try cache first
    const cacheValid = await this.isCacheValid();
    if (cacheValid) {
      const loaded = await this.loadFromCache();
      if (loaded) {
        this.initialized = true;
        return true;
      }
    }
    
    // Fall back to network
    const loaded = await this.loadFromNaturalEarth();
    this.initialized = loaded;
    
    return loaded;
  }

  /**
   * Get country data by code
   */
  getCountryData(countryCode) {
    return this.countryData.get(countryCode) || null;
  }

  /**
   * Get all available countries
   */
  getAllCountries() {
    const countries = [];
    for (const [code, data] of this.countryData.entries()) {
      countries.push({
        code,
        name: data.name,
        continent: data.continent,
        provinceCount: data.provinces?.length || 0
      });
    }
    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    let totalProvinces = 0;
    for (const countryInfo of this.countryData.values()) {
      totalProvinces += countryInfo.provinces?.length || 0;
    }
    
    return {
      totalCountries: this.countryData.size,
      totalProvinces,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
const dynamicProvinceLoader = new DynamicProvinceLoader();
export default dynamicProvinceLoader;
