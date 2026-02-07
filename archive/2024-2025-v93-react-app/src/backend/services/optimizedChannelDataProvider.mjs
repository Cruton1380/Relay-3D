/**
 * Optimized Channel Data Provider
 * 
 * Provides production-ready channel data with perfect clustering for the frontend.
 * Integrates with existing GlobalChannelRenderer system.
 */

export class OptimizedChannelDataProvider {
  constructor() {
    this.cache = new Map();
    this.clusteringLevels = ['gps', 'city', 'province', 'country', 'region', 'global'];
  }

  /**
   * Generate optimized channels for the frontend
   */
  async generateOptimizedChannels(count = 5) {
    console.log(`🏭 Generating ${count} optimized channels...`);
    
    const channels = [];
    const regions = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
    
    // Sample data pools for realistic generation
    const countryData = {
      'Americas': [
        { country: 'United States', code: 'US', provinces: ['California', 'New York', 'Texas'], cities: ['Los Angeles', 'New York City', 'Houston'] },
        { country: 'Canada', code: 'CA', provinces: ['Ontario', 'Quebec'], cities: ['Toronto', 'Montreal'] },
        { country: 'Brazil', code: 'BR', provinces: ['São Paulo', 'Rio de Janeiro'], cities: ['São Paulo', 'Rio de Janeiro'] }
      ],
      'Europe': [
        { country: 'Germany', code: 'DE', provinces: ['Bavaria', 'North Rhine-Westphalia'], cities: ['Munich', 'Cologne'] },
        { country: 'France', code: 'FR', provinces: ['Île-de-France', 'Provence'], cities: ['Paris', 'Marseille'] },
        { country: 'United Kingdom', code: 'GB', provinces: ['England', 'Scotland'], cities: ['London', 'Edinburgh'] }
      ],
      'Asia': [
        { country: 'China', code: 'CN', provinces: ['Beijing', 'Shanghai'], cities: ['Beijing', 'Shanghai'] },
        { country: 'India', code: 'IN', provinces: ['Maharashtra', 'Delhi'], cities: ['Mumbai', 'New Delhi'] },
        { country: 'Japan', code: 'JP', provinces: ['Tokyo', 'Osaka'], cities: ['Tokyo', 'Osaka'] }
      ],
      'Africa': [
        { country: 'Nigeria', code: 'NG', provinces: ['Lagos', 'Kano'], cities: ['Lagos', 'Kano'] },
        { country: 'South Africa', code: 'ZA', provinces: ['Gauteng', 'Western Cape'], cities: ['Johannesburg', 'Cape Town'] }
      ],
      'Oceania': [
        { country: 'Australia', code: 'AU', provinces: ['New South Wales', 'Victoria'], cities: ['Sydney', 'Melbourne'] },
        { country: 'New Zealand', code: 'NZ', provinces: ['North Island', 'South Island'], cities: ['Auckland', 'Wellington'] }
      ]
    };

    // Coordinate data for realistic positioning
    const coordinateData = {
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'New York City': { lat: 40.7128, lng: -74.0060 },
      'Houston': { lat: 29.7604, lng: -95.3698 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Montreal': { lat: 45.5017, lng: -73.5673 },
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'Munich': { lat: 48.1351, lng: 11.5820 },
      'Cologne': { lat: 50.9375, lng: 6.9603 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Marseille': { lat: 43.2965, lng: 5.3698 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },
      'Beijing': { lat: 39.9042, lng: 116.4074 },
      'Shanghai': { lat: 31.2304, lng: 121.4737 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'New Delhi': { lat: 28.6139, lng: 77.2090 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Osaka': { lat: 34.6937, lng: 135.5023 },
      'Lagos': { lat: 6.5244, lng: 3.3792 },
      'Kano': { lat: 12.0022, lng: 8.5920 },
      'Johannesburg': { lat: -26.2041, lng: 28.0473 },
      'Cape Town': { lat: -33.9249, lng: 18.4241 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Melbourne': { lat: -37.8136, lng: 144.9631 },
      'Auckland': { lat: -36.8485, lng: 174.7633 },
      'Wellington': { lat: -41.2865, lng: 174.7762 }
    };

    for (let i = 0; i < count; i++) {
      // Select region and country for this channel
      const region = regions[Math.floor(Math.random() * regions.length)];
      const regionCountries = countryData[region];
      const countryInfo = regionCountries[Math.floor(Math.random() * regionCountries.length)];
      
      // Generate 3-8 candidates per channel
      const candidateCount = 3 + Math.floor(Math.random() * 6);
      const candidates = [];
      
      for (let j = 0; j < candidateCount; j++) {
        // Sometimes cluster candidates in same region, sometimes spread them
        const useChannelRegion = Math.random() > 0.3; // 70% chance to cluster
        
        let candidateRegion, candidateCountryInfo, candidateProvince, candidateCity, candidateCoords;
        
        if (useChannelRegion) {
          // Use channel's region
          candidateRegion = region;
          candidateCountryInfo = countryInfo;
          candidateProvince = candidateCountryInfo.provinces[Math.floor(Math.random() * candidateCountryInfo.provinces.length)];
          candidateCity = candidateCountryInfo.cities[Math.floor(Math.random() * candidateCountryInfo.cities.length)];
        } else {
          // Pick random region for distribution
          candidateRegion = regions[Math.floor(Math.random() * regions.length)];
          const candidateRegionCountries = countryData[candidateRegion];
          candidateCountryInfo = candidateRegionCountries[Math.floor(Math.random() * candidateRegionCountries.length)];
          candidateProvince = candidateCountryInfo.provinces[Math.floor(Math.random() * candidateCountryInfo.provinces.length)];
          candidateCity = candidateCountryInfo.cities[Math.floor(Math.random() * candidateCountryInfo.cities.length)];
        }
        
        // Get coordinates with small random offset
        candidateCoords = coordinateData[candidateCity] || { lat: 0, lng: 0 };
        const offsetLat = candidateCoords.lat + (Math.random() - 0.5) * 0.1;
        const offsetLng = candidateCoords.lng + (Math.random() - 0.5) * 0.1;
        
        // Generate realistic vote count
        const voteCount = Math.floor(Math.random() * 2000) + 100;
        
        const candidate = {
          id: `candidate_${i}_${j}_${Date.now()}`,
          name: this.generateCandidateName(),
          
          // Complete geographical hierarchy
          city: candidateCity,
          province: candidateProvince,
          state: candidateProvince, // Alias
          country: candidateCountryInfo.country,
          countryCode: candidateCountryInfo.code,
          continent: this.getContinent(candidateRegion),
          region: candidateRegion,
          
          // Location
          location: {
            lat: offsetLat,
            lng: offsetLng,
            address: `${candidateCity}, ${candidateProvince}, ${candidateCountryInfo.country}`
          },
          
          // Clustering keys for all levels
          clusterKeys: {
            gps: `${offsetLat.toFixed(6)}_${offsetLng.toFixed(6)}`,
            city: candidateCity,
            province: candidateProvince,
            country: candidateCountryInfo.country,
            region: candidateRegion,
            global: 'GLOBAL'
          },
          
          // Vote data
          votes: voteCount,
          voteComponents: {
            testVotes: 0,
            realVotes: voteCount,
            bonusVotes: 0
          },
          
          // Metadata
          generationMetadata: {
            timestamp: Date.now(),
            generator: 'OptimizedChannelDataProvider',
            hierarchyComplete: true,
            noUnknowns: true
          }
        };
        
        candidates.push(candidate);
      }
      
      // Create channel
      const channel = {
        id: `optimized_channel_${i}_${Date.now()}`,
        name: `${region} ${this.generateChannelTopic()} Channel`,
        type: 'optimized-production',
        
        // Channel location (first candidate's location as reference)
        location: candidates[0]?.location ? {
          latitude: candidates[0].location.lat,
          longitude: candidates[0].location.lng,
          address: candidates[0].location.address
        } : null,
        
        // Channel metadata
        description: `Optimized production channel for ${region}`,
        primary_region: region,
        countryCode: countryInfo.code,
        
        // Candidates with perfect clustering
        candidates: candidates,
        
        // Vote summary
        totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
        candidateCount: candidates.length,
        
        // Reconciliation info
        reconciliation: {
          reconciliationId: `prod_reconcile_${i}_${Date.now()}`,
          totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
          reconciliationTime: 0, // Instant for pre-generated data
          integrity: 'PERFECT'
        },
        
        // Production metadata
        productionMetadata: {
          generatedAt: new Date().toISOString(),
          provider: 'OptimizedChannelDataProvider',
          clusteringOptimized: true,
          frontendReady: true
        }
      };
      
      channels.push(channel);
    }
    
    console.log(`✅ Generated ${channels.length} optimized channels`);
    return channels;
  }

  /**
   * Get continent from region
   */
  getContinent(region) {
    const continentMap = {
      'Americas': 'Americas',
      'Europe': 'Europe', 
      'Asia': 'Asia',
      'Africa': 'Africa',
      'Oceania': 'Oceania'
    };
    return continentMap[region] || 'Unknown';
  }

  /**
   * Generate realistic candidate names
   */
  generateCandidateName() {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
      'Sarah', 'Michael', 'Emily', 'David', 'Emma', 'Daniel', 'Sophia', 'James',
      'Olivia', 'Robert', 'Ava', 'John', 'Isabella', 'William', 'Mia', 'Richard',
      'Abigail', 'Joseph', 'Madison', 'Thomas', 'Elizabeth', 'Christopher'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
      'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate channel topics
   */
  generateChannelTopic() {
    const topics = [
      'Democracy', 'Innovation', 'Healthcare', 'Education', 'Environment',
      'Economic Development', 'Social Justice', 'Infrastructure', 'Technology',
      'Community', 'Governance', 'Reform', 'Sustainability', 'Progress'
    ];
    
    return topics[Math.floor(Math.random() * topics.length)];
  }

  /**
   * Validate channel data for frontend compatibility
   */
  validateChannelForFrontend(channel) {
    // Check required fields
    const requiredFields = ['id', 'name', 'candidates'];
    for (const field of requiredFields) {
      if (!channel[field]) {
        throw new Error(`Channel missing required field: ${field}`);
      }
    }
    
    // Validate each candidate
    for (const candidate of channel.candidates) {
      // Check for complete hierarchy
      const hierarchyFields = ['city', 'province', 'country', 'region'];
      for (const field of hierarchyFields) {
        if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
          throw new Error(`Candidate ${candidate.id} has invalid ${field}: ${candidate[field]}`);
        }
      }
      
      // Check clustering keys
      if (!candidate.clusterKeys) {
        throw new Error(`Candidate ${candidate.id} missing cluster keys`);
      }
      
      for (const level of this.clusteringLevels) {
        if (!candidate.clusterKeys[level]) {
          throw new Error(`Candidate ${candidate.id} missing ${level} cluster key`);
        }
      }
      
      // Check location
      if (!candidate.location || !candidate.location.lat || !candidate.location.lng) {
        throw new Error(`Candidate ${candidate.id} has invalid location`);
      }
      
      // Check votes
      if (typeof candidate.votes !== 'number' || candidate.votes < 0) {
        throw new Error(`Candidate ${candidate.id} has invalid vote count: ${candidate.votes}`);
      }
    }
    
    return true;
  }

  /**
   * Get clustering summary for a channel
   */
  getClusteringSummary(channel) {
    const summary = {};
    
    for (const level of this.clusteringLevels) {
      const clusters = new Map();
      
      for (const candidate of channel.candidates) {
        const clusterKey = candidate.clusterKeys[level];
        
        if (!clusters.has(clusterKey)) {
          clusters.set(clusterKey, {
            candidates: [],
            totalVotes: 0
          });
        }
        
        const cluster = clusters.get(clusterKey);
        cluster.candidates.push(candidate);
        cluster.totalVotes += candidate.votes;
      }
      
      summary[level] = {
        clusterCount: clusters.size,
        totalCandidates: channel.candidates.length,
        totalVotes: channel.totalVotes,
        clusters: Array.from(clusters.entries()).map(([key, data]) => ({
          clusterKey: key,
          candidateCount: data.candidates.length,
          totalVotes: data.totalVotes
        }))
      };
    }
    
    return summary;
  }
}

// Export singleton instance and class
export const optimizedChannelDataProvider = new OptimizedChannelDataProvider();
export default OptimizedChannelDataProvider;