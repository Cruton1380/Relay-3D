/**
 * RELAY DEVELOPMENT CENTER API
 * Complete development and testing platform for Relay Network
 * REFACTORED - Using centralized boundary data
 */

import express from 'express';
import logger from '../utils/logging/logger.mjs';
import { blockchain, updateCandidateVoteCount, saveSessionVotes } from '../state/state.mjs';
import { addMockChannelDataToVoteSystem } from '../voting/votingEngine.mjs';
import crypto from 'crypto';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler.mjs';
import { getAllCountries, getCountryByCode, getProvinces } from '../../shared/boundaryData.js';

const router = express.Router();
const devCenterLogger = logger.child({ module: 'dev-center' });

// Use centralized boundary data
const COUNTRIES = getAllCountries();

// Mock data generators
const CANDIDATE_TEMPLATES = {
  political: [
    { name: 'Sarah Chen', title: 'Urban Planning Expert', expertise: 'Sustainable Development' },
    { name: 'Marcus Johnson', title: 'Policy Analyst', expertise: 'Economic Development' },
    { name: 'Elena Rodriguez', title: 'Environmental Scientist', expertise: 'Climate Action' },
    { name: 'David Kim', title: 'Community Organizer', expertise: 'Social Justice' },
    { name: 'Amira Hassan', title: 'Tech Innovation Lead', expertise: 'Digital Governance' }
  ],
  business: [
    { name: 'Alex Thompson', title: 'CEO', expertise: 'Strategic Leadership' },
    { name: 'Nina Patel', title: 'CTO', expertise: 'Technology Innovation' },
    { name: 'Roberto Silva', title: 'CMO', expertise: 'Brand Development' },
    { name: 'Grace Wang', title: 'CFO', expertise: 'Financial Strategy' },
    { name: 'James Anderson', title: 'COO', expertise: 'Operations Excellence' }
  ],
  community: [
    { name: 'Isabella Martinez', title: 'Community Leader', expertise: 'Neighborhood Development' },
    { name: 'Ahmed Al-Rashid', title: 'Volunteer Coordinator', expertise: 'Social Programs' },
    { name: 'Sophie Dubois', title: 'Local Activist', expertise: 'Environmental Protection' },
    { name: 'Raj Krishnan', title: 'Education Advocate', expertise: 'School Improvement' },
    { name: 'Maria Santos', title: 'Healthcare Organizer', expertise: 'Public Health' }
  ]
};

// Generic candidate names (same for all countries)
const GENERIC_CANDIDATE_NAMES = [
  'Alex Chen', 'Maria Garcia', 'James Wilson', 'Sarah Johnson',
  'David Lee', 'Emily Brown', 'Michael Davis', 'Lisa Anderson',
  'Robert Taylor', 'Jennifer Martinez', 'William Thompson', 'Amanda White',
  'Christopher Rodriguez', 'Jessica Lewis', 'Daniel Clark', 'Ashley Hall',
  'Matthew Young', 'Nicole King', 'Joshua Wright', 'Stephanie Green',
  'Ryan Miller', 'Sofia Patel', 'Kevin Johnson', 'Rachel Adams',
  'Brandon Lee', 'Michelle Kim', 'Tyler Wilson', 'Hannah Davis',
  'Andrew Chen', 'Isabella Rodriguez', 'Nathan Thompson', 'Olivia Martinez'
];

/**
 * Generate mock candidates using generic names and country boundaries
 */
function generateMockCandidates(channelType, candidateCount, country = '') {
  const templates = CANDIDATE_TEMPLATES[channelType] || CANDIDATE_TEMPLATES.community;
  const candidates = [];
  const usedNames = new Set();
  
  for (let i = 0; i < candidateCount; i++) {
    let candidateName;
    do {
      candidateName = GENERIC_CANDIDATE_NAMES[Math.floor(Math.random() * GENERIC_CANDIDATE_NAMES.length)];
    } while (usedNames.has(candidateName));
    usedNames.add(candidateName);
    
    const template = templates[i % templates.length];
    candidates.push({
      name: candidateName,
      title: template.title,
      expertise: template.expertise
    });
  }
  
  return candidates;
}

/**
 * Get country data by name or code
 */
// Ocean detection is no longer needed - we use precise province boundaries instead
// Province bounds are already land-based, so coordinates within province bounds are automatically on land

function getCountryData(country) {
  if (!country) return null;
  
  // Try to find by name first
  let countryData = COUNTRIES.find(c => c.name.toLowerCase() === country.toLowerCase());
  
  // If not found by name, try by code
  if (!countryData) {
    countryData = COUNTRIES.find(c => c.code.toLowerCase() === country.toLowerCase());
  }
  
  return countryData;
}

/**
 * Generate random coordinates within country boundaries, with province support
 */
// City coordinates for precise land-based placement
const CITY_COORDINATES = {
  'Spain': {
    'Galicia': {
      'Santiago de Compostela': { lat: 42.8805, lng: -8.5456 },
      'A Coruña': { lat: 43.3713, lng: -8.3960 },
      'Vigo': { lat: 42.2406, lng: -8.7207 }
    },
    'Asturias': {
      'Oviedo': { lat: 43.3619, lng: -5.8494 },
      'Gijón': { lat: 43.5453, lng: -5.6619 },
      'Avilés': { lat: 43.5547, lng: -5.9248 }
    },
    'Cantabria': {
      'Santander': { lat: 43.4623, lng: -3.8099 },
      'Torrelavega': { lat: 43.3500, lng: -4.0500 },
      'Castro Urdiales': { lat: 43.3833, lng: -3.2167 }
    },
    'Basque Country': {
      'Bilbao': { lat: 43.2627, lng: -2.9253 },
      'Vitoria-Gasteiz': { lat: 42.8467, lng: -2.6716 },
      'San Sebastián': { lat: 43.3183, lng: -1.9812 }
    },
    'Navarre': {
      'Pamplona': { lat: 42.8182, lng: -1.6442 },
      'Tudela': { lat: 42.0619, lng: -1.6044 },
      'Estella': { lat: 42.6706, lng: -2.0308 }
    },
    'La Rioja': {
      'Logroño': { lat: 42.4627, lng: -2.4449 },
      'Calahorra': { lat: 42.3031, lng: -1.9642 },
      'Arnedo': { lat: 42.2281, lng: -2.1008 }
    },
    'Aragon': {
      'Zaragoza': { lat: 41.6488, lng: -0.8891 },
      'Huesca': { lat: 42.1401, lng: -0.4087 },
      'Teruel': { lat: 40.3456, lng: -1.1065 }
    },
    'Catalonia': {
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Girona': { lat: 41.9794, lng: 2.8214 },
      'Lleida': { lat: 41.6176, lng: 0.6200 },
      'Tarragona': { lat: 41.1189, lng: 1.2445 }
    },
    'Castile and León': {
      'Valladolid': { lat: 41.6522, lng: -4.7245 },
      'León': { lat: 42.5987, lng: -5.5671 },
      'Burgos': { lat: 42.3409, lng: -3.6997 },
      'Salamanca': { lat: 40.9701, lng: -5.6635 }
    },
    'Madrid': {
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Alcalá de Henares': { lat: 40.4817, lng: -3.3641 },
      'Getafe': { lat: 40.3047, lng: -3.7310 }
    },
    'Castile-La Mancha': {
      'Toledo': { lat: 39.8628, lng: -4.0273 },
      'Albacete': { lat: 38.9942, lng: -1.8584 },
      'Ciudad Real': { lat: 38.9860, lng: -3.9290 }
    },
    'Extremadura': {
      'Mérida': { lat: 38.9160, lng: -6.3437 },
      'Badajoz': { lat: 38.8794, lng: -6.9707 },
      'Cáceres': { lat: 39.4753, lng: -6.3724 }
    },
    'Andalusia': {
      'Seville': { lat: 37.3891, lng: -5.9845 },
      'Málaga': { lat: 36.7213, lng: -4.4214 },
      'Córdoba': { lat: 37.8882, lng: -4.7794 },
      'Granada': { lat: 37.1773, lng: -3.5986 }
    },
    'Murcia': {
      'Murcia': { lat: 37.9922, lng: -1.1307 },
      'Cartagena': { lat: 37.6056, lng: -0.9864 },
      'Lorca': { lat: 37.6710, lng: -1.7017 }
    },
    'Valencia': {
      'Valencia': { lat: 39.4699, lng: -0.3763 },
      'Alicante': { lat: 38.3452, lng: -0.4810 },
      'Castellón': { lat: 39.9864, lng: -0.0513 }
    },
    'Balearic Islands': {
      'Palma': { lat: 39.5696, lng: 2.6502 },
      'Ibiza': { lat: 38.9067, lng: 1.4206 },
      'Menorca': { lat: 39.8885, lng: 4.2618 }
    },
    'Canary Islands': {
      'Las Palmas': { lat: 28.1248, lng: -15.4300 },
      'Santa Cruz de Tenerife': { lat: 28.4698, lng: -16.2549 }
    }
  }
};

function generateCoordinatesInCountry(countryData) {
  console.log(`🔍 [DEBUG] generateCoordinatesInCountry called for:`, {
    name: countryData?.name,
    hasBounds: !!countryData?.bounds,
    hasProvinces: !!countryData?.provinces,
    provinceCount: countryData?.provinces?.length || 0
  });
  
  if (!countryData || !countryData.bounds) {
    console.log(`❌ [DEBUG] No country data or bounds, using random coordinates`);
    // Default to global coordinates if no country data
    return {
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360
    };
  }
  
  // If country has provinces, randomly select one and use actual city coordinates
  if (countryData.provinces && countryData.provinces.length > 0) {
    const randomProvince = countryData.provinces[Math.floor(Math.random() * countryData.provinces.length)];
    console.log(`🔍 [DEBUG] Selected province:`, randomProvince.name);
    
    // Use actual city coordinates for precise land-based placement
    const countryCities = CITY_COORDINATES[countryData.name];
    console.log(`🔍 [DEBUG] Country cities available:`, !!countryCities);
    console.log(`🔍 [DEBUG] Province cities available:`, !!(countryCities && countryCities[randomProvince.name]));
    
    if (countryCities && countryCities[randomProvince.name]) {
      const provinceCities = countryCities[randomProvince.name];
      const cityNames = Object.keys(provinceCities);
      const randomCity = cityNames[Math.floor(Math.random() * cityNames.length)];
      const cityCoords = provinceCities[randomCity];
      
      // Add small random offset to avoid exact same coordinates
      const lat = cityCoords.lat + (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      const lng = cityCoords.lng + (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      
      console.log(`✅ [DEBUG] Using city coordinates:`, { lat, lng, province: randomProvince.name, city: randomCity });
      return { 
        lat, 
        lng, 
        province: randomProvince.name,
        city: randomCity
      };
    }
    
    // Fallback to province bounds if no city coordinates available
    console.log(`⚠️ [DEBUG] No city coordinates, using province bounds`);
    const bounds = randomProvince.bounds;
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    
    return { 
      lat, 
      lng, 
      province: randomProvince.name,
      city: randomProvince.cities[Math.floor(Math.random() * randomProvince.cities.length)]
    };
  }
  
  // Fallback to country-level bounds
  console.log(`⚠️ [DEBUG] No provinces, using country bounds`);
  const bounds = countryData.bounds;
  const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
  const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
  
  return { lat, lng };
}

/**
 * Generate candidate tags based on channel type
 */
function generateCandidateTags(channelType) {
  const tagMap = {
    political: ['policy', 'governance', 'public-service', 'leadership'],
    business: ['entrepreneurship', 'innovation', 'strategy', 'growth'],
    community: ['volunteer', 'local', 'social-impact', 'community']
  };
  
  return tagMap[channelType] || ['general', 'community', 'local'];
}

/**
 * Generate mock channel with candidates
 */
router.post('/channels/generate', asyncHandler(async (req, res) => {
  try {
    const { 
      channelType = 'community', 
      channelName, 
      channelCategory, // NEW: Allow setting channel category
      candidateCount = 5,
      customCandidates = [],
      country = '',
      distributedGeneration = false
    } = req.body;
    
    // Generate channel ID
    const channelId = channelName ? 
      channelName.toLowerCase().replace(/[^a-z0-9]/g, '-') :
      `generated-${channelType}-${Date.now()}`;
    
    // Generate or use custom candidates
    const candidates = customCandidates.length > 0 ? 
      customCandidates : 
      generateMockCandidates(channelType, candidateCount, country);
    
    // Generate vote counts for candidates
    const candidatesWithVotes = candidates.map((candidate, index) => {
      const votes = Math.floor(Math.random() * 1000) + 50; // Random initial votes
      return {
        id: `${channelId}-candidate-${index + 1}`,
        name: candidate.name,
        title: candidate.title,
        expertise: candidate.expertise,
        description: `${candidate.title} specializing in ${candidate.expertise}`,
        votes: votes,
        profileImage: `/api/dev-center/avatars/${candidate.name.toLowerCase().replace(' ', '-')}.jpg`,
        social: {
          twitter: `@${candidate.name.toLowerCase().replace(' ', '')}`,
          linkedin: `/in/${candidate.name.toLowerCase().replace(' ', '-')}`,
          website: `https://${candidate.name.toLowerCase().replace(' ', '-')}.com`
        },
        tags: generateCandidateTags(channelType),
        createdAt: new Date().toISOString(),
        isTestData: true
      };
    });
    
    // Calculate total votes from actual candidate votes
    const totalVotes = candidatesWithVotes.reduce((sum, candidate) => sum + candidate.votes, 0);
    
    // Get country data and generate coordinates
    let location = null;
    let coordinates = null;
    let region = null;
    let countryName = null;
    
    if (country) {
      const countryData = getCountryData(country);
      if (countryData) {
        countryName = countryData.name;
        region = countryData.continent;
        
        // Generate main channel coordinates within country
        const mainCoords = generateCoordinatesInCountry(countryData);
        location = {
          latitude: mainCoords.lat,
          longitude: mainCoords.lng
        };
        coordinates = [mainCoords.lng, mainCoords.lat]; // Cesium format
        
        // Add location data to candidates as well
        candidatesWithVotes.forEach((candidate, index) => {
          const candidateCoords = generateCoordinatesInCountry(countryData);
          candidate.location = {
            lat: candidateCoords.lat,
            lng: candidateCoords.lng
          };
          candidate.coordinates = [candidateCoords.lng, candidateCoords.lat]; // Cesium format
          candidate.region = countryName;
          candidate.continent = region;
          candidate.country = country;
          candidate.countryName = countryName;
          candidate.countryCode = country;
          
          // Add province and city data if available
          if (candidateCoords.province) {
            candidate.province = candidateCoords.province;
            candidate.state = candidateCoords.province; // Alternative name
          }
          if (candidateCoords.city) {
            candidate.city = candidateCoords.city;
          }
          
          // For distributed generation, add additional metadata
          if (distributedGeneration) {
            candidate.channelName = channelName;
            candidate.channelType = channelType;
            candidate.isDistributed = true;
          }
        });
      }
    }
    
    // Auto-generate category if not provided
    const categoryMap = {
      'political': 'Politics',
      'business': 'Business',
      'community': 'Community',
      'environment': 'Environment',
      'technology': 'Technology',
      'education': 'Education',
      'health': 'Healthcare',
      'global': 'Global' // Add global mapping
    };
    // Check channelCategory first, then subtype from body, then channelType
    const { subtype } = req.body;
    const finalCategory = channelCategory || categoryMap[subtype] || categoryMap[channelType] || 'General';
    
    // Create channel data
    const channelData = {
      id: channelId,
      name: channelName || `${channelType.charAt(0).toUpperCase() + channelType.slice(1)} Channel`,
      type: channelType,
      category: finalCategory, // NEW: Add category field
      description: `Generated test channel for ${channelType} voting`,
      candidates: candidatesWithVotes,
      totalVotes: totalVotes,
      createdAt: new Date().toISOString(),
      isTestData: true,
      testDataSource: 'relay_dev_center',
      // Add country-specific data
      country: country,
      countryName: countryName,
      location: location,
      coordinates: coordinates,
      region: region
    };
    
    // Save to mock database (file system for now)
    await saveTestChannel(channelData);
    
    // Record in blockchain for transparency
    await blockchain.initialize();
    
    // Create channel_create transaction
    await blockchain.addTransaction('channel_create', {
      channelId: channelData.id,
      channelName: channelData.name,
      name: channelData.name, // Add name field for compatibility
      description: channelData.description,
      type: channelData.type,
      category: finalCategory, // NEW: Add category to blockchain
      candidateCount: candidatesWithVotes.length,
      country: country,
      countryName: countryName,
      location: location,
      coordinates: coordinates,
      region: region,
      timestamp: Date.now(),
      createdAt: channelData.createdAt,
      isTestData: true,
      testDataSource: 'relay_dev_center'
    }, crypto.randomBytes(16).toString('hex'));
    
    // Create individual candidate_create transactions for each candidate
    for (const candidate of candidatesWithVotes) {
      await blockchain.addTransaction('candidate_create', {
        candidateId: candidate.id,
        channelId: channelData.id,
        name: candidate.name,
        title: candidate.title,
        expertise: candidate.expertise,
        description: candidate.description,
        votes: candidate.votes,
        profileImage: candidate.profileImage,
        social: candidate.social,
        tags: candidate.tags,
        location: candidate.location,
        coordinates: candidate.coordinates,
        region: candidate.region,
        continent: candidate.continent,
        country: candidate.country,
        countryName: candidate.countryName,
        countryCode: candidate.countryCode,
        province: candidate.province,
        state: candidate.state,
        city: candidate.city,
        createdAt: candidate.createdAt,
        isTestData: true
      }, crypto.randomBytes(16).toString('hex'));
    }
    
    devCenterLogger.info('Generated mock channel', { 
      channelId: channelData.id, 
      channelType,
      candidateCount: candidatesWithVotes.length,
      country: country,
      countryName: countryName
    });
    
    res.json({
      success: true,
      channel: channelData,
      message: distributedGeneration ? 
        `Generated ${candidatesWithVotes.length} distributed candidates for ${channelName}${country ? ` across ${countryName || country}` : ''}` :
        `Generated ${channelType} channel with ${candidatesWithVotes.length} candidates${country ? ` in ${countryName || country}` : ''}`,
      timestamp: new Date().toISOString(),
      distributedGeneration: distributedGeneration
    });
    
  } catch (error) {
    devCenterLogger.error('Channel generation error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock channel'
    });
  }
}));

/**
 * Get all test channels
 */
router.get('/channels', asyncHandler(async (req, res) => {
  try {
    const channels = await getActiveTestChannels();
    
    res.json({
      success: true,
      channels,
      count: channels.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    devCenterLogger.error('Get channels error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get test channels'
    });
  }
}));

/**
 * Delete all test channels
 */
router.delete('/channels', asyncHandler(async (req, res) => {
  try {
    const channels = await getActiveTestChannels();
    let deletedCount = 0;
    
    for (const channel of channels) {
      await deleteTestChannel(channel.id);
      deletedCount++;
    }
    
    res.json({
      success: true,
      deleted: deletedCount,
      message: `Cleared ${deletedCount} test channels`
    });
    
  } catch (error) {
    devCenterLogger.error('Clear channels error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear test channels'
    });
  }
}));

/**
 * Helper functions
 */
async function saveTestChannel(channelData) {
  const channelsDir = './data/dev-center/channels';
  await fs.mkdir(channelsDir, { recursive: true });
  
  const filePath = `${channelsDir}/${channelData.id}.json`;
  await fs.writeFile(filePath, JSON.stringify(channelData, null, 2));
  
  // Sync with vote system
  await syncChannelWithVoteSystem(channelData);
}

async function syncChannelWithVoteSystem(channelData) {
  try {
    devCenterLogger.info('🔄 Syncing mock channel with authoritative vote system', {
      channelId: channelData.id,
      candidateCount: channelData.candidates.length
    });
    
    // Use the new authoritative vote system function
    const syncResult = await addMockChannelDataToVoteSystem(channelData);
    
    devCenterLogger.info('✅ Mock channel data synchronized with authoritative vote system', {
      channelId: channelData.id,
      ...syncResult
    });
    
    // Also update legacy session state for backward compatibility
    for (const candidate of channelData.candidates) {
      if (candidate.votes && candidate.votes > 0) {
        updateCandidateVoteCount(channelData.id, candidate.id, candidate.votes);
      }
    }
    
    // Force save session votes to persist the legacy data
    await saveSessionVotes();
    
    devCenterLogger.info('💾 Legacy session state also updated for compatibility');
  } catch (error) {
    devCenterLogger.error('Failed to sync channel with vote system', { error: error.message });
  }
}

async function loadTestChannel(channelId) {
  try {
    const filePath = `./data/dev-center/channels/${channelId}.json`;
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function deleteTestChannel(channelId) {
  try {
    const filePath = `./data/dev-center/channels/${channelId}.json`;
    await fs.unlink(filePath);
  } catch (error) {
    // File doesn't exist, that's fine
  }
}

async function getActiveTestChannels() {
  try {
    const channelsDir = './data/dev-center/channels';
    await fs.mkdir(channelsDir, { recursive: true });
    
    const files = await fs.readdir(channelsDir);
    const channels = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const channelData = await loadTestChannel(file.replace('.json', ''));
        if (channelData) {
          channels.push(channelData);
        }
      }
    }
    
    return channels;
  } catch (error) {
    return [];
  }
}

// Export utility functions for use by other modules
export { getCountryData, generateCoordinatesInCountry };

export default router;
