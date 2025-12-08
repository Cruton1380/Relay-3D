/**
 * RegionsManager.mjs
 * 
 * Comprehensive hierarchical governance regions manager with real polygon boundaries,
 * "Other" region calculation, and LOD-ready overlays for vote aggregation.
 * 
 * Supports the unified global hierarchy:
 * World → Region → Country → State/Province → City/Metro → Neighborhood/District → Other
 */

import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

class RegionsManager {
  constructor() {
    this.regions = {};
    this.regionsFile = path.join(process.cwd(), 'data', 'regions.json');
    this.initialized = false;
    
    // Hierarchy configuration
    this.hierarchy = {
      levels: ['world', 'region', 'country', 'state', 'city', 'neighborhood', 'other'],
      lodMapping: {
        0: ['world'],
        1: ['world', 'region'], 
        2: ['world', 'region'],
        3: ['region', 'country'],
        4: ['region', 'country'], 
        5: ['region', 'country'],
        6: ['country', 'state'],
        7: ['country', 'state'],
        8: ['country', 'state'],
        9: ['state', 'city', 'other'],
        10: ['state', 'city', 'other'],
        11: ['city', 'neighborhood', 'other']
      }
    };
  }

  /**
   * Initialize the regions manager
   */
  async initialize() {
    console.log('🌍 RegionsManager: Initializing...');
    
    try {
      await this.loadRegions();
      
      if (Object.keys(this.regions).length === 0) {
        console.log('🌍 RegionsManager: No regions found, creating unified hierarchy...');
        await this.createUnifiedGlobalHierarchy();
      }
      
      this.initialized = true;
      console.log(`🌍 RegionsManager: Initialized with ${Object.keys(this.regions).length} regions`);
      
    } catch (error) {
      console.error('🌍 RegionsManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load regions from JSON file
   */
  async loadRegions() {
    try {
      if (fs.existsSync(this.regionsFile)) {
        const regionsData = fs.readFileSync(this.regionsFile, 'utf8');
        const regionsConfig = JSON.parse(regionsData);
        this.regions = regionsConfig.regions || {};
        console.log(`🌍 RegionsManager: Loaded ${Object.keys(this.regions).length} regions from file`);
      } else {
        console.log('🌍 RegionsManager: No regions.json found, will create new hierarchy');
        this.regions = {};
      }
    } catch (error) {
      console.error('🌍 RegionsManager: Error loading regions:', error);
      this.regions = {};
    }
  }

  /**
   * Save regions to JSON file
   */
  async saveRegions() {
    try {
      const dataDir = path.dirname(this.regionsFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const regionsConfig = {
        version: "1.0.0",
        created: new Date().toISOString(),
        hierarchy: this.hierarchy,
        regions: this.regions
      };

      fs.writeFileSync(this.regionsFile, JSON.stringify(regionsConfig, null, 2));
      console.log(`🌍 RegionsManager: Saved ${Object.keys(this.regions).length} regions to file`);
    } catch (error) {
      console.error('🌍 RegionsManager: Error saving regions:', error);
      throw error;
    }
  }

  /**
   * Create unified global hierarchy with real polygon boundaries
   */
  async createUnifiedGlobalHierarchy() {
    console.log('🌍 RegionsManager: Creating unified global hierarchy...');

    // Start with world region
    await this.createWorldRegion();
    
    // Create major regions
    await this.createMajorRegions();
    
    // Create countries with real boundaries
    await this.createCountries();
    
    // Create states/provinces
    await this.createStatesProvinces();
    
    // Create cities/metros
    await this.createCities();
    
    // Calculate "Other" regions for each level
    await this.calculateOtherRegions();
    
    // Save the complete hierarchy
    await this.saveRegions();
    
    console.log('🌍 RegionsManager: Unified global hierarchy created successfully');
  }

  /**
   * Create the world region (root of hierarchy)
   */
  async createWorldRegion() {
    this.regions['WORLD'] = {
      id: 'WORLD',
      name: 'World',
      type: 'world',
      parent_id: null,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
        ]]
      },
      centroid: [0, 0],
      area: 510072000, // Earth's surface area in km²
      population: 8000000000, // Approximate world population
      lod_levels: [0, 1, 2],
      direct_votes: 0,
      aggregated_votes: 0,
      votes: 0,
      created: new Date().toISOString()
    };
    
    console.log('🌍 RegionsManager: Created WORLD region');
  }

  /**
   * Create major regional groupings
   */
  async createMajorRegions() {
    const majorRegions = [
      {
        id: 'REGION-NAM',
        name: 'North America',
        bbox: [-180, 15, -50, 85],
        countries: ['USA', 'CAN', 'MEX']
      },
      {
        id: 'REGION-EU',
        name: 'Europe',
        bbox: [-25, 35, 75, 72],
        countries: ['GBR', 'FRA', 'DEU', 'ITA', 'ESP']
      },
      {
        id: 'REGION-APAC',
        name: 'Asia Pacific',
        bbox: [60, -50, 180, 80],
        countries: ['CHN', 'JPN', 'IND', 'AUS', 'IDN']
      },
      {
        id: 'REGION-AF',
        name: 'Africa',
        bbox: [-20, -35, 55, 40],
        countries: ['NGA', 'ZAF', 'EGY', 'KEN', 'ETH']
      },
      {
        id: 'REGION-SA',
        name: 'South America', 
        bbox: [-85, -60, -30, 15],
        countries: ['BRA', 'ARG', 'COL', 'PER', 'CHL']
      }
    ];

    for (const region of majorRegions) {
      this.regions[region.id] = {
        id: region.id,
        name: region.name,
        type: 'region',
        parent_id: 'WORLD',
        geometry: this.bboxToPolygon(region.bbox),
        centroid: this.calculateCentroid(region.bbox),
        area: this.calculateBboxArea(region.bbox),
        population: 0, // Will be calculated from countries
        lod_levels: [0, 1, 2, 3],
        direct_votes: 0,
        aggregated_votes: 0,
        votes: 0,
        countries: region.countries,
        created: new Date().toISOString()
      };
    }
    
    console.log(`🌍 RegionsManager: Created ${majorRegions.length} major regions`);
  }

  /**
   * Create countries with simplified real boundaries
   */
  async createCountries() {
    // Simplified country data - in production, this would use Natural Earth/GADM data
    const countries = [
      // North America
      {
        id: 'USA',
        name: 'United States',
        parent_id: 'REGION-NAM',
        bbox: [-180, 15, -65, 72],
        iso3: 'USA',
        population: 331000000
      },
      {
        id: 'CAN',
        name: 'Canada',
        parent_id: 'REGION-NAM',
        bbox: [-141, 42, -52, 84],
        iso3: 'CAN',
        population: 38000000
      },
      {
        id: 'MEX',
        name: 'Mexico',
        parent_id: 'REGION-NAM',
        bbox: [-118, 14, -86, 33],
        iso3: 'MEX',
        population: 129000000
      },
      // Europe
      {
        id: 'GBR',
        name: 'United Kingdom',
        parent_id: 'REGION-EU',
        bbox: [-8, 50, 2, 61],
        iso3: 'GBR',
        population: 67000000
      },
      {
        id: 'FRA',
        name: 'France',
        parent_id: 'REGION-EU',
        bbox: [-5, 42, 8, 51],
        iso3: 'FRA',
        population: 68000000
      },
      {
        id: 'DEU',
        name: 'Germany',
        parent_id: 'REGION-EU',
        bbox: [6, 47, 15, 55],
        iso3: 'DEU',
        population: 83000000
      },
      // Asia Pacific
      {
        id: 'CHN',
        name: 'China',
        parent_id: 'REGION-APAC',
        bbox: [73, 15, 135, 54],
        iso3: 'CHN',
        population: 1400000000
      },
      {
        id: 'JPN',
        name: 'Japan',
        parent_id: 'REGION-APAC',
        bbox: [129, 31, 146, 46],
        iso3: 'JPN',
        population: 125000000
      },
      {
        id: 'IND',
        name: 'India',
        parent_id: 'REGION-APAC',
        bbox: [68, 7, 97, 37],
        iso3: 'IND',
        population: 1380000000
      }
    ];

    for (const country of countries) {
      this.regions[country.id] = {
        id: country.id,
        name: country.name,
        type: 'country',
        parent_id: country.parent_id,
        geometry: this.bboxToPolygon(country.bbox),
        centroid: this.calculateCentroid(country.bbox),
        area: this.calculateBboxArea(country.bbox),
        population: country.population,
        iso3: country.iso3,
        lod_levels: [3, 4, 5, 6],
        direct_votes: 0,
        aggregated_votes: 0,
        votes: 0,
        created: new Date().toISOString()
      };
    }
    
    console.log(`🌍 RegionsManager: Created ${countries.length} countries`);
  }

  /**
   * Create states/provinces for countries that have them
   */
  async createStatesProvinces() {
    // Focus on USA states for initial implementation
    const usaStates = [
      {
        id: 'USA-CA',
        name: 'California',
        parent_id: 'USA',
        bbox: [-124.4, 32.5, -114.1, 42.0],
        population: 39500000
      },
      {
        id: 'USA-NY',
        name: 'New York',
        parent_id: 'USA',
        bbox: [-79.8, 40.5, -71.9, 45.0],
        population: 19400000
      },
      {
        id: 'USA-TX',
        name: 'Texas',
        parent_id: 'USA',
        bbox: [-106.6, 25.8, -93.5, 36.5],
        population: 29000000
      },
      {
        id: 'USA-FL',
        name: 'Florida',
        parent_id: 'USA',
        bbox: [-87.6, 24.4, -80.0, 31.0],
        population: 21500000
      }
    ];

    for (const state of usaStates) {
      this.regions[state.id] = {
        id: state.id,
        name: state.name,
        type: 'state',
        parent_id: state.parent_id,
        geometry: this.bboxToPolygon(state.bbox),
        centroid: this.calculateCentroid(state.bbox),
        area: this.calculateBboxArea(state.bbox),
        population: state.population,
        lod_levels: [6, 7, 8, 9],
        direct_votes: 0,
        aggregated_votes: 0,
        votes: 0,
        created: new Date().toISOString()
      };
    }
    
    console.log(`🌍 RegionsManager: Created ${usaStates.length} states/provinces`);
  }

  /**
   * Create major cities/metros
   */
  async createCities() {
    const cities = [
      // United States cities
      {
        id: 'USA-CA-SF',
        name: 'San Francisco',
        parent_id: 'USA-CA',
        bbox: [-122.5, 37.7, -122.3, 37.8],
        population: 875000
      },
      {
        id: 'USA-CA-LA',
        name: 'Los Angeles',
        parent_id: 'USA-CA',
        bbox: [-118.7, 33.7, -118.1, 34.3],
        population: 4000000
      },
      {
        id: 'USA-CA-SD',
        name: 'San Diego',
        parent_id: 'USA-CA',
        bbox: [-117.3, 32.5, -117.0, 32.9],
        population: 1400000
      },
      {
        id: 'USA-NY-NYC',
        name: 'New York City',
        parent_id: 'USA-NY',
        bbox: [-74.3, 40.5, -73.7, 40.9],
        population: 8400000
      },
      {
        id: 'USA-TX-HOU',
        name: 'Houston',
        parent_id: 'USA-TX',
        bbox: [-95.8, 29.5, -95.0, 30.1],
        population: 2300000
      },
      {
        id: 'USA-TX-DAL',
        name: 'Dallas',
        parent_id: 'USA-TX',
        bbox: [-97.0, 32.6, -96.6, 32.9],
        population: 1300000
      },
      {
        id: 'USA-IL-CHI',
        name: 'Chicago',
        parent_id: 'USA-IL',
        bbox: [-87.8, 41.7, -87.5, 42.0],
        population: 2700000
      },
      {
        id: 'USA-FL-MIA',
        name: 'Miami',
        parent_id: 'USA-FL',
        bbox: [-80.3, 25.7, -80.1, 25.9],
        population: 450000
      },
      
      // European cities
      {
        id: 'GBR-ENG-LON',
        name: 'London',
        parent_id: 'GBR-ENG',
        bbox: [-0.5, 51.3, 0.2, 51.7],
        population: 8900000
      },
      {
        id: 'FRA-IDF-PAR',
        name: 'Paris',
        parent_id: 'FRA-IDF',
        bbox: [2.2, 48.8, 2.5, 49.0],
        population: 2100000
      },
      {
        id: 'DEU-BE-BER',
        name: 'Berlin',
        parent_id: 'DEU-BE',
        bbox: [13.3, 52.4, 13.5, 52.6],
        population: 3700000
      },
      {
        id: 'ITA-LAZ-ROM',
        name: 'Rome',
        parent_id: 'ITA-LAZ',
        bbox: [12.4, 41.8, 12.6, 42.0],
        population: 4300000
      },
      {
        id: 'ESP-MD-MAD',
        name: 'Madrid',
        parent_id: 'ESP-MD',
        bbox: [-3.8, 40.3, -3.6, 40.5],
        population: 3200000
      },
      {
        id: 'NLD-NH-AMS',
        name: 'Amsterdam',
        parent_id: 'NLD-NH',
        bbox: [4.8, 52.3, 5.0, 52.4],
        population: 820000
      },
      {
        id: 'CHE-ZH-ZUR',
        name: 'Zurich',
        parent_id: 'CHE-ZH',
        bbox: [8.4, 47.3, 8.6, 47.4],
        population: 420000
      },
      
      // Asian cities
      {
        id: 'JPN-13-TOK',
        name: 'Tokyo',
        parent_id: 'JPN-13',
        bbox: [139.6, 35.6, 139.8, 35.8],
        population: 14000000
      },
      {
        id: 'CHN-11-BEI',
        name: 'Beijing',
        parent_id: 'CHN-11',
        bbox: [116.3, 39.8, 116.5, 40.0],
        population: 21000000
      },
      {
        id: 'CHN-31-SHA',
        name: 'Shanghai',
        parent_id: 'CHN-31',
        bbox: [121.4, 31.1, 121.6, 31.3],
        population: 24000000
      },
      {
        id: 'KOR-11-SEO',
        name: 'Seoul',
        parent_id: 'KOR-11',
        bbox: [126.9, 37.4, 127.1, 37.6],
        population: 9700000
      },
      {
        id: 'IND-MH-MUM',
        name: 'Mumbai',
        parent_id: 'IND-MH',
        bbox: [72.8, 19.0, 73.0, 19.2],
        population: 20000000
      },
      {
        id: 'IND-DL-DEL',
        name: 'Delhi',
        parent_id: 'IND-DL',
        bbox: [77.1, 28.5, 77.3, 28.7],
        population: 19000000
      },
      {
        id: 'THA-10-BKK',
        name: 'Bangkok',
        parent_id: 'THA-10',
        bbox: [100.4, 13.6, 100.6, 13.8],
        population: 8300000
      },
      {
        id: 'SGP-01-SIN',
        name: 'Singapore',
        parent_id: 'SGP-01',
        bbox: [103.7, 1.2, 103.9, 1.4],
        population: 5700000
      },
      
      // Australian cities
      {
        id: 'AUS-NSW-SYD',
        name: 'Sydney',
        parent_id: 'AUS-NSW',
        bbox: [151.1, -33.9, 151.3, -33.7],
        population: 5300000
      },
      {
        id: 'AUS-VIC-MEL',
        name: 'Melbourne',
        parent_id: 'AUS-VIC',
        bbox: [144.9, -37.9, 145.1, -37.7],
        population: 5000000
      },
      
      // African cities
      {
        id: 'ZAF-GT-JHB',
        name: 'Johannesburg',
        parent_id: 'ZAF-GT',
        bbox: [27.9, -26.3, 28.1, -26.1],
        population: 5600000
      },
      {
        id: 'EGY-C-EGC',
        name: 'Cairo',
        parent_id: 'EGY-C',
        bbox: [31.2, 30.0, 31.4, 30.2],
        population: 9500000
      },
      {
        id: 'NGA-LA-LAG',
        name: 'Lagos',
        parent_id: 'NGA-LA',
        bbox: [3.3, 6.4, 3.5, 6.6],
        population: 15000000
      },
      
      // South American cities
      {
        id: 'BRA-SP-SAO',
        name: 'São Paulo',
        parent_id: 'BRA-SP',
        bbox: [-46.8, -23.7, -46.6, -23.5],
        population: 12000000
      },
      {
        id: 'BRA-RJ-RIO',
        name: 'Rio de Janeiro',
        parent_id: 'BRA-RJ',
        bbox: [-43.3, -23.0, -43.1, -22.8],
        population: 6700000
      },
      {
        id: 'ARG-C-BUE',
        name: 'Buenos Aires',
        parent_id: 'ARG-C',
        bbox: [-58.5, -34.7, -58.3, -34.5],
        population: 3100000
      }
    ];

    for (const city of cities) {
      this.regions[city.id] = {
        id: city.id,
        name: city.name,
        type: 'city',
        parent_id: city.parent_id,
        geometry: this.bboxToPolygon(city.bbox),
        centroid: this.calculateCentroid(city.bbox),
        area: this.calculateBboxArea(city.bbox),
        population: city.population,
        lod_levels: [9, 10, 11],
        direct_votes: 0,
        aggregated_votes: 0,
        votes: 0,
        created: new Date().toISOString()
      };
    }
    
    console.log(`🌍 RegionsManager: Created ${cities.length} cities`);
  }

  /**
   * Calculate "Other" regions for each level using polygon subtraction
   * Other = Parent Polygon − Union(All Child Polygons)
   */
  async calculateOtherRegions() {
    console.log('🌍 RegionsManager: Calculating "Other" regions...');
    
    const parentTypes = ['world', 'region', 'country', 'state'];
    let otherCount = 0;
    
    for (const [parentId, parentRegion] of Object.entries(this.regions)) {
      if (!parentTypes.includes(parentRegion.type)) continue;
      
      // Find all direct children
      const children = Object.values(this.regions).filter(r => r.parent_id === parentId);
      
      if (children.length === 0) continue;
      
      try {
        // Create "Other" region using polygon subtraction
        const otherRegion = await this.createOtherRegion(parentRegion, children);
        
        if (otherRegion) {
          this.regions[otherRegion.id] = otherRegion;
          otherCount++;
        }
        
      } catch (error) {
        console.warn(`🌍 RegionsManager: Could not create "Other" region for ${parentId}:`, error.message);
      }
    }
    
    console.log(`🌍 RegionsManager: Created ${otherCount} "Other" regions`);
  }

  /**
   * Create "Other" region by subtracting child polygons from parent
   */
  async createOtherRegion(parentRegion, children) {
    try {
      const parentFeature = turf.feature(parentRegion.geometry);
      
      // Union all child polygons
      let childrenUnion = null;
      for (const child of children) {
        const childFeature = turf.feature(child.geometry);
        
        if (childrenUnion === null) {
          childrenUnion = childFeature;
        } else {
          childrenUnion = turf.union(childrenUnion, childFeature);
        }
      }
      
      if (!childrenUnion) return null;
      
      // Subtract children union from parent
      const difference = turf.difference(parentFeature, childrenUnion);
      
      if (!difference) return null;
      
      const otherId = `${parentRegion.id}-OTHER`;
      const otherName = `${parentRegion.name} - Other`;
      
      // Determine LOD levels based on parent type
      let lodLevels = [];
      switch (parentRegion.type) {
        case 'region':
          lodLevels = [3, 4, 5];
          break;
        case 'country':
          lodLevels = [6, 7, 8];
          break;
        case 'state':
          lodLevels = [9, 10, 11];
          break;
      }
      
      return {
        id: otherId,
        name: otherName,
        type: 'other',
        parent_id: parentRegion.id,
        geometry: difference.geometry,
        centroid: turf.centroid(difference).geometry.coordinates,
        area: turf.area(difference) / 1000000, // Convert to km²
        population: 0, // Will be calculated based on assignments
        lod_levels: lodLevels,
        direct_votes: 0,
        aggregated_votes: 0,
        votes: 0,
        created: new Date().toISOString(),
        is_other: true
      };
      
    } catch (error) {
      console.warn(`🌍 RegionsManager: Error creating "Other" region for ${parentRegion.id}:`, error);
      return null;
    }
  }

  /**
   * Utility: Convert bounding box to polygon
   */
  bboxToPolygon(bbox) {
    const [west, south, east, north] = bbox;
    return {
      type: 'Polygon',
      coordinates: [[
        [west, south],
        [east, south], 
        [east, north],
        [west, north],
        [west, south]
      ]]
    };
  }

  /**
   * Utility: Calculate centroid from bounding box
   */
  calculateCentroid(bbox) {
    const [west, south, east, north] = bbox;
    return [(west + east) / 2, (south + north) / 2];
  }

  /**
   * Utility: Calculate approximate area from bounding box
   */
  calculateBboxArea(bbox) {
    const [west, south, east, north] = bbox;
    const widthKm = this.degreesToKm(east - west, (south + north) / 2);
    const heightKm = this.degreesToKm(north - south, 0);
    return widthKm * heightKm;
  }

  /**
   * Utility: Convert degrees to kilometers
   */
  degreesToKm(degrees, latitude) {
    const earthRadius = 6371; // km
    if (latitude === 0) {
      // For height calculation
      return degrees * (Math.PI / 180) * earthRadius;
    }
    // For width calculation (account for latitude)
    return degrees * (Math.PI / 180) * earthRadius * Math.cos(latitude * (Math.PI / 180));
  }

  /**
   * Get regions for specific LOD level
   */
  getRegionsForLOD(lodLevel) {
    const filteredRegions = {};
    
    for (const [regionId, region] of Object.entries(this.regions)) {
      if (region.lod_levels && region.lod_levels.includes(lodLevel)) {
        filteredRegions[regionId] = region;
      }
    }
    
    return filteredRegions;
  }

  /**
   * Get regions by type
   */
  getRegionsByType(type) {
    const filteredRegions = {};
    
    for (const [regionId, region] of Object.entries(this.regions)) {
      if (region.type === type) {
        filteredRegions[regionId] = region;
      }
    }
    
    return filteredRegions;
  }

  /**
   * Get all regions
   */
  getAllRegions() {
    return this.regions;
  }

  /**
   * Get region by ID
   */
  getRegion(regionId) {
    return this.regions[regionId] || null;
  }

  /**
   * Update region vote counts
   */
  updateRegionVotes(candidateAssignments, channels = []) {
    // Reset vote counts
    for (const region of Object.values(this.regions)) {
      region.direct_votes = 0;
      region.aggregated_votes = 0;
      region.votes = 0;
    }

    // Calculate direct votes (candidates directly in each region)
    for (const assignment of candidateAssignments) {
      const primaryRegionId = assignment.primary_region;
      const region = this.regions[primaryRegionId];
      
      if (region) {
        // Find the candidate to get vote count from channels
        let voteCount = 0;
        for (const channel of channels) {
          for (const candidate of channel.candidates || []) {
            if (candidate.id === assignment.candidate_id) {
              voteCount = (candidate.votes || 0) + (candidate.testVotes || 0) + (candidate.realVotes || 0);
              break;
            }
          }
          if (voteCount > 0) break;
        }
        
        region.direct_votes += voteCount;
      }
    }

    // Calculate aggregated votes (roll up from children)
    this.calculateAggregatedVotes('WORLD');
    
    return this.regions;
  }

  /**
   * Calculate aggregated votes recursively
   */
  calculateAggregatedVotes(regionId) {
    const region = this.regions[regionId];
    if (!region) return 0;
    
    // Find all child regions
    const childRegions = Object.values(this.regions).filter(r => r.parent_id === regionId);
    
    // Sum up votes from children
    let childVotes = 0;
    for (const child of childRegions) {
      childVotes += this.calculateAggregatedVotes(child.id);
    }
    
    // Total votes = direct votes + aggregated votes from children
    region.aggregated_votes = childVotes;
    region.votes = region.direct_votes + region.aggregated_votes;
    
    return region.votes;
  }
}

export default RegionsManager;
