/**
 * Optimized Candidate Generator
 * 
 * Generates candidates with complete geographical hierarchy to prevent "unknown" issues.
 * Ensures perfect clustering reconciliation across all levels.
 */

import { CountryDataService, GlobeGeographicService } from '../globe-geographic/countryDataService.mjs';

class OptimizedCandidateGenerator {
  constructor() {
    this.countryDataService = new CountryDataService();
    this.globeService = new GlobeGeographicService();
    
    // Cache for geographical data
    this.geoCache = new Map();
    
    // Hierarchy mappings to prevent "unknown" assignments
    this.hierarchyMappings = {
      countries: new Map(),
      provinces: new Map(), 
      cities: new Map(),
      continents: new Map(),
      regions: new Map()
    };
    
    this.initialized = false;
  }

  /**
   * Initialize geographical mappings
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🌍 Initializing OptimizedCandidateGenerator...');
    
    try {
      // Load all geographical hierarchy data
      await this.loadHierarchyMappings();
      this.initialized = true;
      console.log('✅ OptimizedCandidateGenerator initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OptimizedCandidateGenerator:', error);
      throw error;
    }
  }

  /**
   * Load complete geographical hierarchy mappings
   */
  async loadHierarchyMappings() {
    console.log('📊 Loading geographical hierarchy mappings...');
    
    // Load countries with their regions/continents
    const countriesData = await this.countryDataService.getAllCountriesWithProvinces();
    
    for (const country of countriesData) {
      // Map country to continent/region
      this.hierarchyMappings.countries.set(country.code, {
        name: country.name,
        continent: country.continent || this.inferContinentFromCountry(country.code),
        region: country.region || this.inferRegionFromCountry(country.code),
        provinces: country.provinces || []
      });
      
      // Map provinces to countries
      if (country.provinces) {
        for (const province of country.provinces) {
          this.hierarchyMappings.provinces.set(province.name, {
            country: country.name,
            countryCode: country.code,
            continent: country.continent,
            region: country.region,
            cities: province.cities || []
          });
          
          // Map cities to provinces
          if (province.cities) {
            for (const city of province.cities) {
              this.hierarchyMappings.cities.set(city, {
                province: province.name,
                country: country.name,
                countryCode: country.code,
                continent: country.continent,
                region: country.region
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ Loaded mappings: ${this.hierarchyMappings.countries.size} countries, ${this.hierarchyMappings.provinces.size} provinces, ${this.hierarchyMappings.cities.size} cities`);
  }

  /**
   * Generate optimized candidate with complete hierarchy
   */
  async generateCandidate(candidateConfig = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      region = null,
      country = null,
      province = null,
      city = null,
      candidateName = null,
      votes = null
    } = candidateConfig;

    // Generate complete hierarchy
    const hierarchy = await this.generateCompleteHierarchy(region, country, province, city);
    
    // Generate candidate location
    const location = await this.generateCandidateLocation(hierarchy);
    
    // Generate candidate data
    const candidate = {
      id: this.generateCandidateId(),
      name: candidateName || this.generateCandidateName(hierarchy),
      
      // Complete geographical hierarchy (NO unknowns)
      location: location,
      
      // Administrative hierarchy
      city: hierarchy.city,
      province: hierarchy.province,
      state: hierarchy.province, // Alias for compatibility
      country: hierarchy.country,
      countryCode: hierarchy.countryCode,
      continent: hierarchy.continent,
      region: hierarchy.region,
      
      // Clustering keys for each level
      clusterKeys: {
        gps: `${location.lat.toFixed(6)}_${location.lng.toFixed(6)}`,
        city: hierarchy.city || hierarchy.province,
        province: hierarchy.province,
        country: hierarchy.country,
        region: hierarchy.region,
        global: 'GLOBAL'
      },
      
      // Vote data with reconciliation info
      votes: votes !== null ? votes : this.generateVoteCount(),
      voteComponents: {
        testVotes: 0,
        realVotes: votes !== null ? votes : this.generateVoteCount(),
        bonusVotes: 0
      },
      
      // Metadata for reconciliation
      generationMetadata: {
        timestamp: Date.now(),
        generator: 'OptimizedCandidateGenerator',
        hierarchyComplete: true,
        noUnknowns: true
      }
    };

    // Validate no "unknown" values
    this.validateCandidate(candidate);
    
    return candidate;
  }

  /**
   * Generate complete geographical hierarchy
   */
  async generateCompleteHierarchy(targetRegion, targetCountry, targetProvince, targetCity) {
    let hierarchy = {};

    // Start from most specific and build up
    if (targetCity && this.hierarchyMappings.cities.has(targetCity)) {
      // City specified - use its hierarchy
      const cityData = this.hierarchyMappings.cities.get(targetCity);
      hierarchy = {
        city: targetCity,
        province: cityData.province,
        country: cityData.country,
        countryCode: cityData.countryCode,
        continent: cityData.continent,
        region: cityData.region
      };
    } else if (targetProvince && this.hierarchyMappings.provinces.has(targetProvince)) {
      // Province specified - use its hierarchy, pick random city
      const provinceData = this.hierarchyMappings.provinces.get(targetProvince);
      hierarchy = {
        city: provinceData.cities?.length > 0 ? 
          provinceData.cities[Math.floor(Math.random() * provinceData.cities.length)] : 
          targetProvince, // Fallback to province name as city
        province: targetProvince,
        country: provinceData.country,
        countryCode: provinceData.countryCode,
        continent: provinceData.continent,
        region: provinceData.region
      };
    } else if (targetCountry) {
      // Country specified - pick random province and city
      const countryData = this.getCountryData(targetCountry);
      const randomProvince = this.getRandomProvince(countryData);
      const randomCity = this.getRandomCity(randomProvince);
      
      hierarchy = {
        city: randomCity,
        province: randomProvince?.name || countryData.name,
        country: countryData.name,
        countryCode: countryData.code,
        continent: countryData.continent,
        region: countryData.region
      };
    } else {
      // No specifics - completely random but complete hierarchy
      const randomCountry = this.getRandomCountry();
      const randomProvince = this.getRandomProvince(randomCountry);
      const randomCity = this.getRandomCity(randomProvince);
      
      hierarchy = {
        city: randomCity,
        province: randomProvince?.name || randomCountry.name,
        country: randomCountry.name,
        countryCode: randomCountry.code,
        continent: randomCountry.continent,
        region: randomCountry.region
      };
    }

    return hierarchy;
  }

  /**
   * Generate precise location for candidate
   */
  async generateCandidateLocation(hierarchy) {
    // Try to get precise coordinates for the city/province
    const cacheKey = `${hierarchy.country}_${hierarchy.province}_${hierarchy.city}`;
    
    if (this.geoCache.has(cacheKey)) {
      return this.geoCache.get(cacheKey);
    }

    let location = { lat: 0, lng: 0 };

    try {
      // Try city centroid first
      if (hierarchy.city && hierarchy.city !== hierarchy.province) {
        const cityData = await this.globeService.getCityCentroid(hierarchy.city, hierarchy.countryCode);
        if (cityData) {
          location = { lat: cityData[1], lng: cityData[0] };
        }
      }
      
      // Fallback to province centroid
      if (location.lat === 0 && location.lng === 0) {
        const provinceData = await this.globeService.getProvinceCentroid(hierarchy.province, hierarchy.countryCode);
        if (provinceData) {
          location = { lat: provinceData[1], lng: provinceData[0] };
        }
      }
      
      // Final fallback to country centroid
      if (location.lat === 0 && location.lng === 0) {
        const countryData = await this.globeService.getCountryCentroid(hierarchy.country);
        if (countryData) {
          location = { lat: countryData[1], lng: countryData[0] };
        }
      }
      
      // Add small random offset to prevent exact overlaps
      location.lat += (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      location.lng += (Math.random() - 0.5) * 0.1;
      
    } catch (error) {
      console.warn(`⚠️ Could not get precise location for ${hierarchy.city}, ${hierarchy.province}, using fallback`);
      // Use country-based fallback coordinates
      location = this.getFallbackLocation(hierarchy.countryCode);
    }

    // Cache the result
    this.geoCache.set(cacheKey, location);
    return location;
  }

  /**
   * Helper methods for random selection
   */
  getRandomCountry() {
    const countries = Array.from(this.hierarchyMappings.countries.values());
    return countries[Math.floor(Math.random() * countries.length)];
  }

  getCountryData(countryName) {
    for (const [code, data] of this.hierarchyMappings.countries) {
      if (data.name === countryName || code === countryName) {
        return { ...data, code };
      }
    }
    // Fallback to prevent unknowns
    return this.getRandomCountry();
  }

  getRandomProvince(countryData) {
    if (!countryData?.provinces || countryData.provinces.length === 0) {
      return { name: countryData.name, cities: [countryData.name] };
    }
    return countryData.provinces[Math.floor(Math.random() * countryData.provinces.length)];
  }

  getRandomCity(provinceData) {
    if (!provinceData?.cities || provinceData.cities.length === 0) {
      return provinceData?.name || 'Main City';
    }
    return provinceData.cities[Math.floor(Math.random() * provinceData.cities.length)];
  }

  /**
   * Infer continent from country code
   */
  inferContinentFromCountry(countryCode) {
    const continentMap = {
      // North America
      'US': 'North America', 'CA': 'North America', 'MX': 'North America',
      // Europe
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
      // Asia
      'CN': 'Asia', 'IN': 'Asia', 'JP': 'Asia', 'KR': 'Asia', 'ID': 'Asia',
      // Africa
      'NG': 'Africa', 'ZA': 'Africa', 'EG': 'Africa', 'KE': 'Africa',
      // South America
      'BR': 'South America', 'AR': 'South America', 'CO': 'South America',
      // Oceania
      'AU': 'Oceania', 'NZ': 'Oceania'
    };
    
    return continentMap[countryCode] || 'Asia'; // Default to Asia (largest)
  }

  /**
   * Infer UN region from country code
   */
  inferRegionFromCountry(countryCode) {
    const regionMap = {
      // Americas
      'US': 'Americas', 'CA': 'Americas', 'MX': 'Americas', 'BR': 'Americas', 'AR': 'Americas',
      // Europe
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
      // Asia
      'CN': 'Asia', 'IN': 'Asia', 'JP': 'Asia', 'KR': 'Asia', 'ID': 'Asia',
      // Africa
      'NG': 'Africa', 'ZA': 'Africa', 'EG': 'Africa', 'KE': 'Africa',
      // Oceania
      'AU': 'Oceania', 'NZ': 'Oceania'
    };
    
    return regionMap[countryCode] || 'Asia'; // Default to Asia (largest UN region)
  }

  /**
   * Generate fallback coordinates
   */
  getFallbackLocation(countryCode) {
    const fallbackCoords = {
      'US': { lat: 39.8283, lng: -98.5795 },
      'CA': { lat: 56.1304, lng: -106.3468 },
      'GB': { lat: 55.3781, lng: -3.4360 },
      'DE': { lat: 51.1657, lng: 10.4515 },
      'FR': { lat: 46.2276, lng: 2.2137 },
      'CN': { lat: 35.8617, lng: 104.1954 },
      'IN': { lat: 20.5937, lng: 78.9629 },
      'BR': { lat: -14.2350, lng: -51.9253 },
      'AU': { lat: -25.2744, lng: 133.7751 }
    };
    
    return fallbackCoords[countryCode] || { lat: 0, lng: 0 };
  }

  /**
   * Generate unique candidate ID
   */
  generateCandidateId() {
    return `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate realistic candidate name
   */
  generateCandidateName(hierarchy) {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate realistic vote count
   */
  generateVoteCount() {
    // Exponential distribution for realistic vote patterns
    const base = Math.random();
    return Math.floor(Math.pow(base, 2) * 10000); // 0 to 10,000 votes, heavily weighted toward lower numbers
  }

  /**
   * Validate candidate has no "unknown" values
   */
  validateCandidate(candidate) {
    const requiredFields = ['city', 'province', 'country', 'countryCode', 'continent', 'region'];
    const issues = [];

    for (const field of requiredFields) {
      if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
        issues.push(`${field}: ${candidate[field]}`);
      }
    }

    if (issues.length > 0) {
      throw new Error(`Candidate validation failed - Unknown values found: ${issues.join(', ')}`);
    }

    // Validate location
    if (!candidate.location || candidate.location.lat === 0 || candidate.location.lng === 0) {
      throw new Error('Candidate validation failed - Invalid location coordinates');
    }
  }

  /**
   * Batch generate candidates for a channel
   */
  async generateCandidatesForChannel(channelConfig) {
    const {
      candidateCount = 5,
      region = null,
      country = null,
      province = null,
      distribution = 'random' // 'random', 'clustered', 'distributed'
    } = channelConfig;

    console.log(`🏭 Generating ${candidateCount} candidates for channel (distribution: ${distribution})`);

    const candidates = [];
    
    for (let i = 0; i < candidateCount; i++) {
      let candidateConfig = {};
      
      if (distribution === 'clustered') {
        // Keep candidates in same region/country/province
        candidateConfig = { region, country, province };
      } else if (distribution === 'distributed') {
        // Spread candidates across different areas
        candidateConfig = { region: i % 2 === 0 ? region : null };
      }
      // 'random' uses empty config
      
      const candidate = await this.generateCandidate(candidateConfig);
      candidates.push(candidate);
    }

    // Sort by votes for consistent ordering
    candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    console.log(`✅ Generated ${candidates.length} candidates with complete hierarchy`);
    return candidates;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      hierarchyMappings: {
        countries: this.hierarchyMappings.countries.size,
        provinces: this.hierarchyMappings.provinces.size,
        cities: this.hierarchyMappings.cities.size
      },
      geoCache: this.geoCache.size,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const optimizedCandidateGenerator = new OptimizedCandidateGenerator();
export { OptimizedCandidateGenerator };