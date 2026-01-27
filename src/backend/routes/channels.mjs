import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getEnvironmentState } from './devRoutes.mjs';
// ✅ DEPRECATED: state.mjs removed - use query hooks for vote counts
// import { getChannelVoteCounts, getCandidateVoteCount } from '../state/state.mjs';
import query from '../../.relay/query.mjs';
import GroupSignalProtocol from '../services/groupSignalProtocol.mjs';
// ✅ DEPRECATED: blockchain removed - use Git/Relay backend
// import blockchain from '../blockchain-service/index.mjs';
import unifiedBoundaryService from '../services/unifiedBoundaryService.mjs';
// import voteService from '../vote-service/index.mjs'; // REMOVED: Git-native backend
import countryIsoCodes from '../../../data/country-iso-codes.json' assert { type: 'json' };
import { bulkCoordinateService } from '../services/bulkCoordinateService.mjs';

const router = express.Router();

// Approved countries for channel and candidate creation
const APPROVED_COUNTRIES = [
  'US', 'CA', 'MX', // North America
  'DE', 'FR', 'GB', 'IT', 'ES', // Europe
  'CN', 'JP', 'IN', 'KR', 'SA', // Asia (added SA for Saudi Arabia)
  'NG', 'ZA', 'EG', // Africa
  'BR', 'AR', 'CO', // South America
  'AU', 'NZ' // Oceania
];

// Country validation helper
function validateCountryAllowed(countryCode) {
  // Allow empty string for global distribution
  if (countryCode === '' || countryCode === undefined || countryCode === null) {
    return true;
  }
  // Allow 'Global' for global distribution
  if (countryCode === 'Global') {
    return true;
  }
  
  // Map country names to country codes for validation
  const countryNameToCode = {
    'United States': 'US',
    'Canada': 'CA',
    'Mexico': 'MX',
    'Germany': 'DE',
    'France': 'FR',
    'United Kingdom': 'GB',
    'Italy': 'IT',
    'Spain': 'ES',
    'China': 'CN',
    'Japan': 'JP',
    'India': 'IN',
    'South Korea': 'KR',
    'Saudi Arabia': 'SA',
    'Nigeria': 'NG',
    'South Africa': 'ZA',
    'Egypt': 'EG',
    'Brazil': 'BR',
    'Argentina': 'AR',
    'Colombia': 'CO',
    'Australia': 'AU',
    'New Zealand': 'NZ'
  };
  
  // Check if it's a country code
  if (APPROVED_COUNTRIES.includes(countryCode)) {
    return true;
  }
  
  // Check if it's a country name that maps to an approved country code
  if (countryNameToCode[countryCode] && APPROVED_COUNTRIES.includes(countryNameToCode[countryCode])) {
    return true;
  }
  
  // For Global candidates, allow any country name (they're distributed globally)
  // This allows Global candidates to have any country name from the global distribution
  return true; // Allow all countries for global distribution
}

// Global regions with GPS coordinates for worldwide distribution
const GLOBAL_REGIONS = {
  'North America': [
    { name: 'United States', lat: 39.8283, lng: -98.5795, population: 331000000 },
    { name: 'Canada', lat: 56.1304, lng: -106.3468, population: 38000000 },
    { name: 'Mexico', lat: 23.6345, lng: -102.5528, population: 128000000 }
  ],
  'Europe': [
    { name: 'Germany', lat: 51.1657, lng: 10.4515, population: 83000000 },
    { name: 'France', lat: 46.2276, lng: 2.2137, population: 67000000 },
    { name: 'United Kingdom', lat: 55.3781, lng: -3.4360, population: 67000000 },
    { name: 'Italy', lat: 41.8719, lng: 12.5674, population: 60000000 },
    { name: 'Spain', lat: 40.4637, lng: -3.7492, population: 47000000 }
  ],
  'Asia': [
    { name: 'China', lat: 35.8617, lng: 104.1954, population: 1400000000 },
    { name: 'Japan', lat: 36.2048, lng: 138.2529, population: 125000000 },
    { name: 'India', lat: 20.5937, lng: 78.9629, population: 1380000000 },
    { name: 'South Korea', lat: 35.9078, lng: 127.7669, population: 52000000 }
  ],
  'Africa': [
    { name: 'Nigeria', lat: 9.0820, lng: 8.6753, population: 218000000 },
    { name: 'South Africa', lat: -30.5595, lng: 22.9375, population: 60000000 },
    { name: 'Egypt', lat: 26.8206, lng: 30.8025, population: 104000000 }
  ],
  'South America': [
    { name: 'Brazil', lat: -14.2350, lng: -51.9253, population: 215000000 },
    { name: 'Argentina', lat: -38.4161, lng: -63.6167, population: 45000000 },
    { name: 'Colombia', lat: 4.5709, lng: -74.2973, population: 51000000 }
  ],
  'Oceania': [
    { name: 'Australia', lat: -25.2744, lng: 133.7751, population: 26000000 },
    { name: 'New Zealand', lat: -40.9006, lng: 174.8860, population: 5000000 }
  ]
};

// Blockchain persistence will handle all channel storage
// Removed in-memory storage - using blockchain as single source of truth
let persistentCoordinateCache = new Map(); // Cache coordinates by channel ID for persistence

// Load channels from blockchain on startup
async function loadChannelsFromBlockchain() {
  try {
    console.log('🔗 [BLOCKCHAIN] Initializing blockchain...');
    await blockchain.initialize();
    
    console.log('🔗 [BLOCKCHAIN] Searching for channel_create transactions...');
    const channelTransactions = blockchain.findTransactionsByType('channel_create');
    
    console.log(`🔗 [BLOCKCHAIN] Found ${channelTransactions.length} channel_create transactions`);
    
    const channels = channelTransactions.map(transaction => {
      console.log(`🔗 [BLOCKCHAIN] Processing channel: ${transaction.data.channelName || transaction.data.name || 'Unknown'}`);
      
      // Load candidates for this channel from blockchain
      try {
        const candidateTransactions = blockchain.findTransactionsByType('candidate_create')
          .filter(candidateTx => candidateTx.data.channelId === transaction.data.channelId);
        
        console.log(`🔗 [BLOCKCHAIN] Found ${candidateTransactions.length} candidates for channel ${transaction.data.channelName || transaction.data.name}`);
        
        const candidates = candidateTransactions.map(candidateTx => ({
          ...candidateTx.data,
          id: candidateTx.data.candidateId, // Map candidateId back to id for frontend compatibility
          blockchainTransactionId: candidateTx.id,
          blockIndex: candidateTx.blockIndex,
          blockHash: candidateTx.blockHash
        }));
        
        console.log(`🔗 [BLOCKCHAIN] Sample candidate IDs after mapping:`, candidates.slice(0, 3).map(c => ({ id: c.id, candidateId: c.candidateId, name: c.name, votes: c.votes })));
        
        // CRITICAL FIX: Remove candidates from transaction.data before spreading to avoid duplication
        const { candidates: _, ...channelDataWithoutCandidates } = transaction.data;
        
        return {
          ...channelDataWithoutCandidates,
          id: transaction.data.channelId, // Map channelId back to id
          candidates: candidates, // Add candidates to channel from separate transactions
          blockchainTransactionId: transaction.id,
          blockIndex: transaction.blockIndex,
          blockHash: transaction.blockHash
        };
      } catch (candidateError) {
        console.error(`❌ [BLOCKCHAIN] Error loading candidates for channel ${transaction.data.channelName || transaction.data.name}:`, candidateError);
        // CRITICAL FIX: Remove candidates from transaction.data before spreading to avoid duplication
        const { candidates: _, ...channelDataWithoutCandidates } = transaction.data;
        return {
          ...channelDataWithoutCandidates,
          id: transaction.data.channelId, // Map channelId back to id
          candidates: [], // Return empty candidates array on error
          blockchainTransactionId: transaction.id,
          blockIndex: transaction.blockIndex,
          blockHash: transaction.blockHash
        };
      }
    });
    
    console.log(`🔗 [BLOCKCHAIN] Successfully loaded ${channels.length} channels from blockchain`);
    return channels;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN] Failed to load channels from blockchain:', error);
      console.error('❌ [BLOCKCHAIN] Error details:', error.stack);
      throw error; // Propagate error instead of returning empty array
    }
}

// Cache for loaded channels (refreshed on each request to ensure consistency)
let loadedChannels = [];

// Function to generate persistent coordinates for a channel
function getPersistentCoordinates(channelId, baseCountry) {
  if (!persistentCoordinateCache.has(channelId)) {
    // Generate coordinates once and cache them permanently
    const coordinates = {
      country: baseCountry,
      shuffleIndex: Math.floor(Math.random() * 100), // Fixed seed per channel
      candidateOffsets: Array.from({ length: 20 }, () => ({
        latOffset: (Math.random() - 0.5) * 6.0,
        lngOffset: (Math.random() - 0.5) * 6.0
      }))
    };
    persistentCoordinateCache.set(channelId, coordinates);
    console.log(`🔒 Cached persistent coordinates for channel: ${channelId}`);
  }
  return persistentCoordinateCache.get(channelId);
}

// Function to generate globally distributed channels with candidate locations
async function generateGlobalChannels() {
  const channels = [];
  
  let channelsToDistribute = [];
  
  try {
    // Load channels from blockchain (always fresh data)
    loadedChannels = await loadChannelsFromBlockchain();
    console.log(`🔍 [GLOBAL GEN] Starting with ${loadedChannels.length} channels from blockchain`);
    
    // If no channels exist in blockchain, return empty array (no default demo data)
    if (loadedChannels.length === 0) {
      console.log('🔍 [GLOBAL GEN] No channels found in blockchain, returning empty array');
    return [];
  }
  
    channelsToDistribute = [...loadedChannels];
  } catch (error) {
    console.error('❌ [GLOBAL GEN] Error loading channels from blockchain:', error);
    console.error('❌ [GLOBAL GEN] Stack trace:', error.stack);
    throw error; // Propagate error instead of returning empty array
  }
  
  // Debug: Check the structure of channels before distribution
  channelsToDistribute.forEach((channel, index) => {
    console.log(`🔍 [GLOBAL GEN] Channel ${index + 1} before distribution:`, {
      name: channel.name,
      candidates: channel.candidates?.length || 0,
      candidateNames: channel.candidates?.map(c => c.name).slice(0, 3)
    });
  });
  
  // Get all countries from all regions
  const allCountries = Object.values(GLOBAL_REGIONS).flat();
  
  // Create a stable distribution based on channel IDs (no random shuffling)
  const getCountryForChannel = (channel, index) => {
    const persistentData = getPersistentCoordinates(channel.id, null);
    const countryIndex = (persistentData.shuffleIndex + index) % allCountries.length;
    return allCountries[countryIndex];
  };
  
  // Distribute channels across global regions with persistent coordinates
  channelsToDistribute.forEach((channel, index) => {
    console.log(`🔍 [GLOBAL GEN] Processing channel ${index + 1}: "${channel.name}" with ${channel.candidates?.length || 0} candidates`);
    
    // Check if channel already has country-specific data (from frontend) or is a demo channel with global data
    if (channel.country && channel.candidates && channel.candidates.length > 0 && channel.candidates[0].country) {
      console.log(`🔍 [GLOBAL GEN] Channel "${channel.name}" already has country-specific data for ${channel.country}, preserving it`);
      channels.push(channel);
      return;
    }
    
    // Check if this is a demo channel with global data structure
    if (channel.isDemoChannel && channel.candidates && channel.candidates.length > 0 && channel.candidates[0].country === 'Global') {
      console.log(`🔍 [GLOBAL GEN] Demo channel "${channel.name}" has global data structure, preserving it`);
      channels.push(channel);
      return;
    }
    
    const country = getCountryForChannel(channel, index);
    const persistentData = getPersistentCoordinates(channel.id, country);
    
    // Safety check: ensure candidates array exists
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      console.warn(`⚠️ [GLOBAL GEN] Channel "${channel.name}" has no candidates array! Setting empty array.`);
      channel.candidates = [];
    }
    
    // Create candidates with persistent distributed locations in the region
    const candidates = channel.candidates.map((candidate, candidateIndex) => {
      // Use cached offsets for consistent positioning
      const offsetIndex = candidateIndex % persistentData.candidateOffsets.length;
      const { latOffset, lngOffset } = persistentData.candidateOffsets[offsetIndex];
      
      return {
        ...candidate,
        location: {
          lat: Math.max(-85, Math.min(85, country.lat + latOffset)), // Keep within valid lat range
          lng: ((country.lng + lngOffset + 180) % 360) - 180 // Keep within valid lng range
        },
        region: country.name,
        continent: Object.keys(GLOBAL_REGIONS).find(region => 
          GLOBAL_REGIONS[region].some(c => c.name === country.name)
        )
      };
    });
    
    console.log(`🌍 [GLOBAL GEN] Created ${candidates.length} global candidates for "${channel.name}"`);
    
    const globalChannel = {
      id: `global-${country.name.toLowerCase().replace(/\s+/g, '-')}-${channel.id}`,
      name: `${channel.name}`,
      description: `${channel.description} - ${country.name}`,
      category: channel.category || 'governance',
      type: 'global',
      country: country.name,
      region: Object.keys(GLOBAL_REGIONS).find(region => 
        GLOBAL_REGIONS[region].some(c => c.name === country.name)
      ),
      createdAt: channel.createdAt,
      location: {
        latitude: country.lat,
        longitude: country.lng
      },
      coordinates: [country.lng, country.lat], // Cesium format
      candidates: candidates, // Now includes distributed candidate locations
      metadata: {
        population: country.population,
        source: channel.isDemoChannel ? 'demo-generated' : 'user-generated',
        stackable: true,
        globalDistribution: true
      }
    };
    
    channels.push(globalChannel);
  });
  
  return channels;
}

// Blockchain persistence handles all channel storage

// Group Signal Protocol instance for vote channel encryption
let groupProtocol = null;

// Initialize Group Signal Protocol for vote channel encryption
async function initializeGroupEncryption() {
  if (!groupProtocol) {
    groupProtocol = new GroupSignalProtocol();
    await groupProtocol.initialize();
    console.log('🔐 Group Signal Protocol initialized for vote channel encryption');
  }
  return groupProtocol;
}

// Dynamic channel generation templates (used when system needs to create demo channels)
const CHANNEL_TEMPLATES = [
  {
    name: 'Tech Innovation Hub',
    description: 'A collaborative space for tech innovators and entrepreneurs',
    category: 'technology',
    candidates: [
      { name: 'Alex Chen', description: 'AI Research Lead' },
      { name: 'Maria Garcia', description: 'Startup Founder' },
      { name: 'James Wilson', description: 'Product Manager' }
    ]
  },
  {
    name: 'Community Wellness Center',
    description: 'Health and wellness focused community space',
    category: 'health',
    candidates: [
      { name: 'Sarah Johnson', description: 'Wellness Coach' },
      { name: 'David Lee', description: 'Nutritionist' },
      { name: 'Emily Brown', description: 'Fitness Trainer' }
    ]
  },
  {
    name: 'Creative Arts Studio',
    description: 'Space for artists and creative professionals',
    category: 'arts',
    candidates: [
      { name: 'Michael Davis', description: 'Visual Artist' },
      { name: 'Lisa Anderson', description: 'Digital Designer' },
      { name: 'Robert Taylor', description: 'Photographer' }
    ]
  },
  {
    name: 'Environmental Action Group',
    description: 'Community initiative for environmental sustainability',
    category: 'environment',
    candidates: [
      { name: 'Dr. Emma Watson', description: 'Climate Scientist' },
      { name: 'Carlos Rodriguez', description: 'Renewable Energy Expert' },
      { name: 'Zoe Kim', description: 'Conservation Biologist' }
    ]
  },
  {
    name: 'Education Reform Coalition',
    description: 'Improving education systems and accessibility',
    category: 'education',
    candidates: [
      { name: 'Prof. Ahmed Hassan', description: 'Education Policy Expert' },
      { name: 'Jennifer Liu', description: 'Teacher and Activist' },
      { name: 'Marcus Thompson', description: 'Student Representative' }
    ]
  }
];

// Function to generate global coordinates constrained to landmasses
function generateGlobalLandCoordinates() {
  // Get all countries from all regions
  const allCountries = Object.values(GLOBAL_REGIONS).flat();
  
  // Select a random country from all available countries
  const randomCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
  
  // Generate coordinates within that country's boundaries
  const lat = randomCountry.lat + (Math.random() - 0.5) * 2; // Add some variation
  const lng = randomCountry.lng + (Math.random() - 0.5) * 2; // Add some variation
  
  return {
    lat: Math.max(-85, Math.min(85, lat)), // Keep within valid lat range
    lng: ((lng + 180) % 360) - 180, // Keep within valid lng range
    countryName: randomCountry.name,
    region: Object.keys(GLOBAL_REGIONS).find(region => 
      GLOBAL_REGIONS[region].some(c => c.name === randomCountry.name)
    )
  };
}

// Function to create dynamic demo channels with full regional data
function createDemoChannels(count = 3) {
  const selectedTemplates = CHANNEL_TEMPLATES.slice(0, count);
  const demoChannels = selectedTemplates.map((template, index) => {
    const countries = Object.values(GLOBAL_REGIONS).flat();
    const baseCountry = countries[index % countries.length];
    
    // Create candidates with full regional data structure
    const candidates = template.candidates.map((candidate, candidateIndex) => {
      // Generate global coordinates constrained to landmasses using all country boundaries
      const globalCoordinates = generateGlobalLandCoordinates();
      const lat = globalCoordinates.lat;
      const lng = globalCoordinates.lng;
      
      // Generate realistic vote distribution
      const voteRanges = [
        { min: 800, max: 1200 }, // 1st place: 800-1200 votes
        { min: 500, max: 800 },  // 2nd place: 500-800 votes
        { min: 300, max: 500 },  // 3rd place: 300-500 votes
        { min: 150, max: 300 },  // 4th place: 150-300 votes
        { min: 50, max: 150 },   // 5th place: 50-150 votes
        { min: 10, max: 50 }     // 6th+ place: 10-50 votes
      ];
      
      const voteRange = voteRanges[candidateIndex] || voteRanges[voteRanges.length - 1];
      const votes = Math.floor(Math.random() * (voteRange.max - voteRange.min + 1)) + voteRange.min;
      
      return {
        id: `demo-candidate-${index}-${candidateIndex}`,
        name: candidate.name,
        votes: votes,
        description: candidate.description,
        channelName: template.name,
        channelType: template.category,
        subtype: template.category,
        location: {
          lat: lat,
          lng: lng
        },
        coordinates: [lng, lat], // Cesium format
        country: 'Global',
        countryName: globalCoordinates.countryName,
        countryCode: 'GL',
        region: globalCoordinates.region,
        continent: globalCoordinates.region,
        province: 'Global',
        state: 'Global',
        city: 'Global',
        type: template.category,
        scope: template.category,
        testVotes: votes,
        realVotes: 0,
        username: candidate.name.toLowerCase().replace(' ', '_') + Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString(),
        isTestData: true
      };
    });
    
    return {
      id: `demo-${Date.now()}-${index}`,
      name: template.name,
      description: template.description,
      category: template.category,
      subtype: template.category,
      type: template.category,
      candidates: candidates,
      candidateCount: candidates.length,
      createdAt: new Date().toISOString(),
      isActive: true,
      isPublic: true,
      color: '#4CAF50', // Default green color
      country: 'Global',
      countryName: 'Global',
      location: { 
        latitude: baseCountry.lat + (Math.random() - 0.5) * 2, 
        longitude: baseCountry.lng + (Math.random() - 0.5) * 2,
        height: 0.1,
        radius: 50000 // Global radius
      },
      coordinates: [baseCountry.lng + (Math.random() - 0.5) * 2, baseCountry.lat + (Math.random() - 0.5) * 2],
      voteCount: candidates.reduce((sum, c) => sum + c.votes, 0),
      memberCount: Math.floor(Math.random() * 500) + 100,
      activeUsers: Math.floor(Math.random() * 350) + 70,
      isDemoChannel: true,
      isPrivate: false, // Demo channels are public by default
      encryptionEnabled: false // No encryption for public demo channels
    };
  });
  
  return demoChannels;
}

// GET /global - Get globally distributed channels based on user-created channels
router.get('/global', async (req, res) => {
  try {
    const globalChannels = generateGlobalChannels();
    
    console.log('🌍 Generated global channels:', {
      userChannels: createdChannels.length,
      globalChannels: globalChannels.length,
      regions: [...new Set(globalChannels.map(ch => ch.region))],
      countries: [...new Set(globalChannels.map(ch => ch.country))]
    });
    
    res.json(globalChannels);
  } catch (error) {
    console.error('Error generating global channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate global channels',
      channels: []
    });
  }
});

// GET /canada - Legacy endpoint redirects to global
router.get('/canada', async (req, res) => {
  try {
    const globalChannels = generateGlobalChannels();
    console.log('🌍 Redirecting /canada to global channels');
    res.json(globalChannels);
  } catch (error) {
    console.error('Error in legacy Canada endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate channels',
      channels: []
    });
  }
});

// POST / - Create a new channel
router.post('/', async (req, res) => {
  try {
    const channel = req.body;
    
    // No country validation - all countries supported via GeoBoundaries API (351+ countries)
    // Country support determined by GeoBoundaries data availability, not hardcoded whitelist
    
    // ⚠️ CRITICAL FIX: Check if channel already has an ID (prevents duplication if endpoint called twice)
    if (!channel.id) {
      channel.id = `created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      channel.createdAt = new Date().toISOString();
      console.log('🆕 [CHANNEL POST] Creating NEW channel with ID:', channel.id);
    } else {
      console.log('⚠️ [CHANNEL POST] Channel already has ID (possible duplicate request):', channel.id);
      // Check if this channel already exists in blockchain
      await blockchain.initialize();
      const existingChannels = blockchain.findTransactionsByType('channel_create')
        .filter(tx => tx.data.channelId === channel.id);
      if (existingChannels.length > 0) {
        console.log('❌ [CHANNEL POST] Channel already exists in blockchain, rejecting duplicate');
        return res.status(409).json({
          success: false,
          error: 'Channel already exists',
          channelId: channel.id
        });
      }
    }
    
    // Set channel privacy mode (default to public for transparency)
    channel.isPrivate = req.body.isPrivate || false;
    channel.encryptionEnabled = channel.isPrivate; // Only encrypt private channels
    
    console.log('📥 [CHANNEL POST] Received channel data:', {
      name: channel.name,
      country: channel.country,
      candidates: channel.candidates?.length || 0,
      candidatesSample: channel.candidates?.slice(0, 2),
      candidateCountries: channel.candidates?.map(c => c.country).slice(0, 3)
    });
    
    // Add default candidates if not provided
    if (!channel.candidates || channel.candidates.length === 0) {
      console.log('⚠️ [CHANNEL POST] No candidates provided, adding defaults');
      channel.candidates = [
        { id: 'candidate-1', name: 'Option A', votes: 0 },
        { id: 'candidate-2', name: 'Option B', votes: 0 },
        { id: 'candidate-3', name: 'Option C', votes: 0 }
      ];
    } else {
      console.log('✅ [CHANNEL POST] Using provided candidates:', channel.candidates.length);
    }
    
    // Generate coordinates for candidates if country is provided
    if (channel.country && channel.candidates) {
      console.log(`🌍 [COORDINATE GEN] Generating coordinates for ${channel.candidates.length} candidates in ${channel.country}`);
      
      for (let i = 0; i < channel.candidates.length; i++) {
        const candidate = channel.candidates[i];
        
        // Only generate coordinates if not already provided
        if (!candidate.location || (!candidate.location.lat && !candidate.location.latitude && !candidate.location.lng && !candidate.location.longitude)) {
          console.log(`🔍 [COORDINATE GEN] No coordinates found for ${candidate.name}, generating new ones`);
          const coordData = await unifiedBoundaryService.generateCandidateCoordinates(channel.country);
          
          if (coordData) {
            // Add coordinate data to candidate - FLAT PROPERTIES (critical for clustering!)
            candidate.location = coordData.location;
            candidate.coordinates = coordData.coordinates;
            candidate.province = coordData.province || null;
            candidate.state = coordData.province || null; // Alias for province
            candidate.city = coordData.city || null;
            candidate.country = coordData.country;
            candidate.countryName = coordData.countryName;
            candidate.countryCode = coordData.countryCode || coordData.country;
            candidate.continent = coordData.continent;
            
            // LEGACY: Keep region_assignment for backward compatibility (but frontend uses flat properties)
            candidate.region_assignment = {
              hierarchy: {
                gps: { 
                  lat: coordData.location.lat, 
                  lng: coordData.location.lng 
                },
                city: coordData.city || 'Unknown City',
                state: coordData.province || coordData.countryName, // fallback to country if no province
                country: coordData.countryName || coordData.country,
                continent: coordData.continent || 'Unknown',
                globe: 'Earth'
              }
            };
            
            console.log(`✅ [UNIFIED BOUNDARY] Generated coordinates for ${candidate.name}: [${coordData.location.lat.toFixed(4)}, ${coordData.location.lng.toFixed(4)}] in ${coordData.province}`);
          } else {
            console.warn(`⚠️ [UNIFIED BOUNDARY] Failed to generate coordinates for ${candidate.name} in ${channel.country}`);
          }
        } else {
          console.log(`ℹ️ [UNIFIED BOUNDARY] Candidate ${candidate.name} already has coordinates: [${candidate.location.lat || candidate.location.latitude}, ${candidate.location.lng || candidate.location.longitude}], preserving them`);
        }
        
        // Ensure candidate has an ID
        if (!candidate.id) {
          candidate.id = `candidate-${i + 1}-${Date.now()}`;
        }
      }
    }
    
    // Save channel to blockchain for persistence using batched approach
    try {
      await blockchain.initialize();
      
      // Add channel transaction to queue (will be batched)
      await blockchain.addTransaction('channel_create', {
        channelId: channel.id,
        name: channel.name,
        type: channel.type,
        category: channel.category, // 🗺️ SAVE CATEGORY (e.g., 'gps_map')
        subtype: channel.subtype,   // 🗺️ SAVE SUBTYPE (e.g., 'boundary')
        description: channel.description,
        country: channel.country,
        countryName: channel.countryName,
        region: channel.region,
        location: channel.location,
        coordinates: channel.coordinates,
        isPrivate: channel.isPrivate || false,
        encryptionEnabled: channel.encryptionEnabled || false,
        createdAt: channel.createdAt,
        candidateCount: channel.candidates?.length || 0,
        totalVotes: channel.totalVotes || 0,
        isTestData: channel.isTestData || false
      }, crypto.randomUUID());
      
      // Add all candidate transactions to queue (will be batched together)
      if (channel.candidates && channel.candidates.length > 0) {
        for (const candidate of channel.candidates) {
          await blockchain.addTransaction('candidate_create', {
            candidateId: candidate.id,
            channelId: channel.id,
            name: candidate.name,
            description: candidate.description,
            location: candidate.location,
            coordinates: candidate.coordinates,
            country: candidate.country,
            countryName: candidate.countryName,
            region: candidate.region,
            continent: candidate.continent,
            province: candidate.province,
            city: candidate.city,
            votes: candidate.votes || 0,
            initialVotes: candidate.initialVotes, // 🎯 FIX: Persist initialVotes to blockchain
            createdAt: candidate.createdAt,
            isTestData: candidate.isTestData || false
          }, crypto.randomUUID());
        }
      }
      
      // Let transaction queue handle batching automatically (prevents duplicate blocks)
      const totalTransactions = 1 + (channel.candidates?.length || 0);
      console.log(`⛏️ [BLOCKCHAIN] Queued ${totalTransactions} transactions for automatic batching:`, channel.name);
      // NOTE: Removed manual blockchain.mine() to prevent race condition with automatic batching
      // The transaction queue will mine these transactions in the next batch (max 500ms delay)
      
      console.log('✅ [BLOCKCHAIN] Channel and candidates queued for blockchain:', channel.name);
    } catch (error) {
      console.error('❌ [BLOCKCHAIN] Failed to save channel to blockchain:', error);
      console.error('❌ [BLOCKCHAIN] Error details:', error.stack);
      // Continue with response even if blockchain save fails
    }
    
    // 🗳️ Initialize base vote counts for all candidates (GIT-NATIVE: Votes initialized via query hook)
    if (channel.candidates && channel.candidates.length > 0) {
      // try {
      //   voteService.initializeBatchCandidateVotes(channel.candidates, channel.id);
      //   console.log(`✅ [VOTE INIT] Registered ${channel.candidates.length} candidates with vote service for channel ${channel.id}`);
      // } catch (error) {
      //   console.error('❌ [VOTE INIT] Failed to initialize candidate votes:', error);
      // }
      console.log(`ℹ️ [VOTE INIT] Git-native backend: ${channel.candidates.length} candidates for channel ${channel.id} (votes via query hook)`);
    }
    
    // Initialize group encryption ONLY for private channels
    if (channel.isPrivate && channel.encryptionEnabled) {
      try {
        const groupEncryption = await initializeGroupEncryption();
        const creatorId = req.user?.id || 'system-creator';
        
        // Create group session for private vote channel encryption
        const groupSessionResult = await groupEncryption.createGroupSession(
          channel.id,
          creatorId,
          [] // Initial members - will be added as users join
        );
        
        if (groupSessionResult.success) {
          console.log('🔐 Group encryption session created for PRIVATE vote channel:', channel.name);
        } else {
          console.warn('⚠️ Failed to create group encryption session for private channel:', channel.name, '- Reason:', groupSessionResult.error);
        }
      } catch (error) {
        console.error('❌ Error initializing group encryption for private channel:', error.message);
      }
    } else {
      console.log('🌐 Public channel created (no encryption):', channel.name);
    }
    
    // Initialize mock vote data in the authoritative voting system (SYNCHRONOUS - must complete before response)
    try {
      console.log('🔄 Starting vote initialization for channel:', channel.name, 'with', channel.candidates?.length, 'candidates');
      const { addMockChannelDataToVoteSystem } = await import('../voting/votingEngine.mjs');
      const result = await addMockChannelDataToVoteSystem(channel);
      if (result.success) {
        console.log('✅ Initialized mock vote data for channel:', channel.name, '- Total votes:', result.totalVotes);
      } else {
        console.warn('⚠️ Failed to initialize mock vote data for channel:', channel.name, '- Reason:', result.reason);
      }
      
      // Only initialize global channels for large payloads (>50 candidates) to avoid performance issues
      if (channel.candidates && channel.candidates.length > 50) {
        console.log('🔄 Initializing global vote data for large channel:', channel.name);
        const allCountries = Object.values(GLOBAL_REGIONS).flat();
        // Process in batches to avoid blocking
        const batchSize = 10;
        for (let i = 0; i < allCountries.length; i += batchSize) {
          const batch = allCountries.slice(i, i + batchSize);
          for (const country of batch) {
            const globalChannelId = `global-${country.name.toLowerCase().replace(/\s+/g, '-')}-${channel.id}`;
            const globalChannelData = {
              ...channel,
              id: globalChannelId
            };
            
            const globalResult = await addMockChannelDataToVoteSystem(globalChannelData);
            if (globalResult.success) {
              console.log('✅ Initialized mock vote data for global channel:', globalChannelId);
            } else {
              console.warn('⚠️ Failed to initialize mock vote data for global channel:', globalChannelId);
            }
          }
          // Small delay between batches to prevent blocking
          if (i + batchSize < allCountries.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error initializing mock vote data:', error.message);
    }
    
    
    // Channel saved to blockchain - available immediately after mining
    console.log('✅ Created new channel:', channel.name, 'with ID:', channel.id, 'candidates:', channel.candidates?.length);
    console.log('🔗 Channel persisted to blockchain with', 1 + (channel.candidates?.length || 0), 'transactions');
    
    res.json({ 
      success: true, 
      channel,
      message: `Channel "${channel.name}" created successfully`
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /demo - Create demo channels for testing - DISABLED for production
// Demo channels are no longer automatically created to maintain blockchain integrity
// Use this endpoint only for major resets or testing
router.post('/demo', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    error: 'Demo channel creation is disabled. Use blockchain as single source of truth.',
    message: 'Channels should be created through the normal creation process and persisted to blockchain.'
  });
});

// DISABLED: Original demo route (kept for reference)
router.post('/demo-disabled', async (req, res) => {
  try {
    const { count = 3 } = req.body;
    const maxCount = Math.min(count, CHANNEL_TEMPLATES.length);
    
    const demoChannels = createDemoChannels(maxCount);
    // Removed: createdChannels.push(...demoChannels);
    
    // Initialize mock vote data for demo channels
    try {
      const { addMockChannelDataToVoteSystem } = await import('../voting/votingEngine.mjs');
      for (const channel of demoChannels) {
        const result = await addMockChannelDataToVoteSystem(channel);
        if (result.success) {
          console.log('✅ Initialized mock vote data for demo channel:', channel.name, '- Total votes:', result.totalVotes);
        } else {
          console.warn('⚠️ Failed to initialize mock vote data for demo channel:', channel.name, '- Reason:', result.reason);
        }
        
        // Also initialize mock vote data for all potential global channel IDs
        const allCountries = Object.values(GLOBAL_REGIONS).flat();
        for (const country of allCountries) {
          const globalChannelId = `global-${country.name.toLowerCase().replace(/\s+/g, '-')}-${channel.id}`;
          const globalChannelData = {
            ...channel,
            id: globalChannelId
          };
          
          const globalResult = await addMockChannelDataToVoteSystem(globalChannelData);
          if (globalResult.success) {
            console.log('✅ Initialized mock vote data for global demo channel:', globalChannelId, '- Total votes:', globalResult.totalVotes);
          } else {
            console.warn('⚠️ Failed to initialize mock vote data for global demo channel:', globalChannelId, '- Reason:', globalResult.reason);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error initializing mock vote data for demo channels:', error.message);
    }
    
    // Clear cached demo channels since we now have real ones
    cachedDemoChannels = null;
    channelsCleared = false; // Reset cleared flag when new channels are added
    
    console.log(`🎲 Created ${demoChannels.length} demo channels:`, 
      demoChannels.map(ch => ch.name).join(', '));
    
    res.json({
      success: true,
      created: demoChannels.length,
      channels: demoChannels,
      message: `Created ${demoChannels.length} demo channels`
    });
  } catch (error) {
    console.error('Error creating demo channels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /all - Clear all channels (dev only) - Same as DELETE /
router.delete('/all', async (req, res) => {
  try {
    console.log('🗑️ [CHANNELS] Starting complete channel and candidate clear operation via /all endpoint...');
    
    // Initialize blockchain
    await blockchain.initialize();
    
    // Get all current channels to count what we're clearing
    const currentChannels = await loadChannelsFromBlockchain();
    const totalCandidates = currentChannels.reduce((sum, channel) => sum + (channel.candidates?.length || 0), 0);
    
    console.log(`🗑️ [CHANNELS] Found ${currentChannels.length} channels with ${totalCandidates} candidates to clear`);
    
    // Record the clear operation in blockchain
    await blockchain.addTransaction('all_channels_cleared', {
      timestamp: Date.now(),
      clearedBy: 'system',
      reason: 'Manual clear operation via /all endpoint',
      channelsCleared: currentChannels.length,
      candidatesCleared: totalCandidates,
      channelIds: currentChannels.map(ch => ch.id)
    }, crypto.randomUUID());
    
    // Clear the blockchain data files to actually remove the data
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Clear the blockchain chain file (this removes all transactions including channel/candidate data)
      const chainFile = path.join(process.cwd(), 'data', 'blockchain', 'chain.jsonl');
      await fs.writeFile(chainFile, '', 'utf8');
      console.log('🗑️ [BLOCKCHAIN] Cleared blockchain chain file');
      
      // Clear the nonce file
      const nonceFile = path.join(process.cwd(), 'data', 'blockchain', 'nonces.jsonl');
      await fs.writeFile(nonceFile, '', 'utf8');
      console.log('🗑️ [BLOCKCHAIN] Cleared blockchain nonce file');
      
      // Reinitialize blockchain with empty state
      blockchain.chain = [];
      blockchain.pendingTransactions = [];
      blockchain.nonces = new Set();
      blockchain.isInitialized = false;
      
      console.log('🗑️ [BLOCKCHAIN] Reset blockchain to empty state');
      
    } catch (fileError) {
      console.error('❌ [BLOCKCHAIN] Error clearing blockchain files:', fileError);
      // Continue anyway - the transaction was recorded
    }
    
    console.log('🗑️ [CHANNELS] Successfully cleared all channels and candidates from blockchain');
    
    res.json({
      success: true,
      message: `Successfully cleared ${currentChannels.length} channels and ${totalCandidates} candidates from blockchain`,
      cleared: {
        channels: currentChannels.length,
        candidates: totalCandidates
      }
    });
  } catch (error) {
    console.error('❌ [CHANNELS] Error clearing channels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all channels from blockchain (single source of truth)
router.get('/', async (req, res) => {
  try {
    // Load all channels from blockchain
    let channels = await loadChannelsFromBlockchain();
    console.log('🔗 [CHANNELS] Serving from blockchain:', {
      channels: channels.length,
      sampleChannel: channels[0]?.name
    });
    
    // 🎯 FIX: Initialize votes in authoritativeVoteLedger for channels loaded from blockchain
    // This ensures old channels (created before backend restart) have their votes initialized
    console.log(`🔄 [CHANNELS] Initializing votes for ${channels.length} blockchain channels...`);
    const { addMockChannelDataToVoteSystem } = await import('../voting/votingEngine.mjs');
    for (const channel of channels) {
      if (channel.candidates && Array.isArray(channel.candidates) && channel.candidates.length > 0) {
        console.log(`🔄 [CHANNELS] Processing channel: ${channel.name} with ${channel.candidates.length} candidates`);
        try {
          const result = await addMockChannelDataToVoteSystem(channel);
          if (result.success) {
            console.log(`✅ [CHANNELS] Initialized ${result.totalVotes} votes for channel: ${channel.name}`);
          } else {
            console.warn(`⚠️ [CHANNELS] Failed to initialize votes for channel: ${channel.name} - Reason: ${result.reason}`);
          }
        } catch (error) {
          console.error(`❌ [CHANNELS] Error initializing votes for channel: ${channel.name}`, error);
        }
      }
    }
    console.log(`✅ [CHANNELS] Finished initializing votes for all channels`);
    
    // 🗳️ Populate vote counts from vote service for all candidates
    channels = channels.map(channel => {
      if (channel.candidates && Array.isArray(channel.candidates)) {
        const candidatesWithVotes = channel.candidates.map(candidate => {
          const candidateId = candidate.id || candidate.candidateId;
          // const baseVotes = voteService.baseVoteCounts.get(candidateId) || candidate.votes || 0; // REMOVED
          const baseVotes = candidate.votes || 0; // Git-native: votes from query hook
          return {
            ...candidate,
            votes: baseVotes
          };
        });
        
        return {
          ...channel,
          candidates: candidatesWithVotes,
          totalVotes: candidatesWithVotes.reduce((sum, c) => sum + (c.votes || 0), 0)
        };
      }
      return channel;
    });
    
    res.json({
      success: true,
      channels: channels,
      source: 'blockchain-direct'
    });
  } catch (error) {
    console.error('❌ [CHANNELS] Error in channels endpoint:', error);
    console.error('❌ [CHANNELS] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      channels: [] // Return empty array on error
    });
  }
});

// GET /stats - Get channel statistics
router.get('/stats', async (req, res) => {
  try {
    const globalChannels = await generateGlobalChannels();
    
    res.json({
      success: true,
      totalChannels: globalChannels.length,
      blockchainChannels: loadedChannels.length,
      globalChannels: globalChannels.length,
      uniqueCountries: [...new Set(globalChannels.map(ch => ch.country))].length,
      uniqueRegions: [...new Set(globalChannels.map(ch => ch.region))].length,
      blockchainStats: blockchain.getStats()
    });
  } catch (error) {
    console.error('Error getting channel stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      totalChannels: 0
    });
  }
});

// GET /:id - Get a specific channel by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const globalChannels = await generateGlobalChannels();
    const channel = globalChannels.find(ch => ch.id === id);
    
    if (!channel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Channel not found' 
      });
    }
    
    res.json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('❌ [CHANNELS] Error getting channel by ID:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /joined - Get joined channels for a user
router.post('/joined', async (req, res) => {
  try {
    // For now, return empty array since we don't have real user data
    // In production, this would query the database for user's joined channels
    res.json({
      success: true,
      channels: [],
      message: 'No joined channels found'
    });
  } catch (error) {
    console.error('Error getting joined channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get joined channels',
      channels: []
    });
  }
});

// POST /topic-rows - Get topic rows for channel discovery
router.post('/topic-rows', async (req, res) => {
  try {
    // For now, return empty topic rows
    // In production, this would return categorized channels by topic
    res.json({
      success: true,
      topicRows: [],
      message: 'No topic rows available'
    });
  } catch (error) {
    console.error('Error getting topic rows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get topic rows',
      topicRows: []
    });
  }
});

// DELETE / - Clear all created channels
router.delete('/', async (req, res) => {
  try {
    console.log('🗑️ [CHANNELS] Starting complete channel and candidate clear operation...');
    
    let currentChannels = [];
    let totalCandidates = 0;
    
    // Try to get current channels from blockchain, but don't fail if blockchain has issues
    try {
      await blockchain.initialize();
      currentChannels = await loadChannelsFromBlockchain();
      totalCandidates = currentChannels.reduce((sum, channel) => sum + (channel.candidates?.length || 0), 0);
      console.log(`🗑️ [CHANNELS] Found ${currentChannels.length} channels with ${totalCandidates} candidates to clear`);
      
      // Record the clear operation in blockchain
      await blockchain.addTransaction('all_channels_cleared', {
        timestamp: Date.now(),
        clearedBy: 'system',
        reason: 'Manual clear operation',
        channelsCleared: currentChannels.length,
        candidatesCleared: totalCandidates,
        channelIds: currentChannels.map(ch => ch.id)
      }, crypto.randomUUID());
    } catch (blockchainError) {
      console.error('⚠️  [BLOCKCHAIN] Error accessing blockchain, will clear memory store anyway:', blockchainError.message);
    }
    
    // Clear the blockchain data files to actually remove the data
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Clear the blockchain chain file (this removes all transactions including channel/candidate data)
      const chainFile = path.join(process.cwd(), 'data', 'blockchain', 'chain.jsonl');
      await fs.writeFile(chainFile, '', 'utf8');
      console.log('🗑️ [BLOCKCHAIN] Cleared blockchain chain file');
      
      // Clear the nonce file
      const nonceFile = path.join(process.cwd(), 'data', 'blockchain', 'nonces.jsonl');
      await fs.writeFile(nonceFile, '', 'utf8');
      console.log('🗑️ [BLOCKCHAIN] Cleared blockchain nonce file');
      
      // Reinitialize blockchain with empty state
      blockchain.chain = [];
      blockchain.pendingTransactions = [];
      blockchain.nonces = new Set();
      blockchain.isInitialized = false;
      
      console.log('🗑️ [BLOCKCHAIN] Reset blockchain to empty state');
      
    } catch (fileError) {
      console.error('❌ [BLOCKCHAIN] Error clearing blockchain files:', fileError);
      // Continue anyway - the transaction was recorded
    }
    
    console.log('🗑️ [CHANNELS] Successfully cleared all channels and candidates from blockchain');
    
    
    res.json({
      success: true,
      message: `Successfully cleared ${currentChannels.length} channels and ${totalCandidates} candidates from blockchain`,
      cleared: {
        channels: currentChannels.length,
        candidates: totalCandidates
      }
    });
  } catch (error) {
    console.error('❌ [CHANNELS] Error clearing channels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /:id - Delete a channel by ID (record in blockchain)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Record the deletion in blockchain
    await blockchain.initialize();
    await blockchain.addTransaction('channel_deleted', {
      channelId: id,
      timestamp: Date.now(),
      deletedBy: 'system',
      reason: 'Manual deletion'
    }, crypto.randomUUID());
    
    await blockchain.mine();
    
    console.log(`🗑️ [BLOCKCHAIN] Recorded channel deletion in blockchain: ${id}`);
    
    res.json({ 
      success: true, 
      message: `Channel ${id} deletion recorded in blockchain.` 
    });
  } catch (error) {
    console.error('❌ [CHANNELS] Error deleting channel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /generate-coordinates - Generate coordinates within country/province boundaries using GeoBoundaries data
router.post('/generate-coordinates', async (req, res) => {
  // Add timeout to prevent hanging requests
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
  });

  try {
    const coordinateGeneration = async () => {
      const { countryName, provinceName = null, count = 1 } = req.body;
      
      if (!countryName) {
        return res.status(400).json({
          success: false,
          error: 'Country name is required'
        });
      }
      
      const locationName = provinceName ? `${provinceName}, ${countryName}` : countryName;
      console.log(`🌍 [COORDINATES] Generating coordinates for ${locationName} using actual polygon boundaries`);
      
      // Import the boundary streaming service
      const BoundaryStreamingService = (await import('../services/BoundaryStreamingService.mjs')).default;
      const boundaryService = new BoundaryStreamingService();
    
    // Get ISO 3166-1 alpha-3 code from generated country map (351+ countries supported)
    // Generated from data/countries-10m.geojson - zero dependencies, 100% owned
    const countryCode = countryIsoCodes.codes[countryName];
    
    if (!countryCode) {
      console.warn(`⚠️ [COORDINATES] No ISO code found for country: ${countryName}`);
      return res.status(404).json({
        success: false,
        error: `Unknown country: ${countryName}. Check spelling or try a different name variation.`,
        hint: `Available countries include: ${Object.keys(countryIsoCodes.codes).filter(c => c.toLowerCase().startsWith(countryName.toLowerCase()[0])).slice(0, 5).join(', ')}`
      });
    }
    
    // Fetch GeoBoundaries data for the country or province
    console.log(`🌍 [COORDINATES] Fetching GeoBoundaries data for ${countryName} (${countryCode})`);
    const startTime = Date.now();
    let geoData;
    let boundaryLevel = 'admin0'; // Country level by default
    
    try {
      // If province specified, try to get province-level boundaries (admin1)
      if (provinceName) {
        console.log(`🗺️ [COORDINATES] Attempting to fetch province-level boundaries for ${provinceName}`);
        try {
          geoData = await boundaryService.fetchCountryBoundaries('admin1', countryCode);
          
          // Filter for the specific province
          if (geoData && geoData.features) {
            const provinceFeature = geoData.features.find(f => 
              f.properties && (
                f.properties.shapeName === provinceName ||
                f.properties.shapeGroup === provinceName ||
                f.properties.name === provinceName
              )
            );
            
            if (provinceFeature) {
              geoData = { type: 'FeatureCollection', features: [provinceFeature] };
              boundaryLevel = 'admin1';
              console.log(`✅ [COORDINATES] Found province boundary for ${provinceName}`);
            } else {
              console.warn(`⚠️ [COORDINATES] Province ${provinceName} not found, falling back to country boundary`);
              geoData = await boundaryService.fetchCountryBoundaries('admin0', countryCode);
            }
          }
        } catch (provinceError) {
          console.warn(`⚠️ [COORDINATES] Province fetch failed, using country boundary:`, provinceError.message);
          geoData = await boundaryService.fetchCountryBoundaries('admin0', countryCode);
        }
      } else {
        // No province specified, use country boundary
        geoData = await boundaryService.fetchCountryBoundaries('admin0', countryCode);
      }
      
      const fetchTime = Date.now() - startTime;
      console.log(`⚡ [COORDINATES] Boundary fetch completed in ${fetchTime}ms for ${locationName}`);
    } catch (fetchError) {
      const fetchTime = Date.now() - startTime;
      console.error(`❌ [COORDINATES] Failed to fetch boundary data after ${fetchTime}ms:`, fetchError.message);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch boundary data for ${locationName}: ${fetchError.message}`
      });
    }
    
    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No boundary data found for ${locationName}`
      });
    }
    
    // Use the first feature (should be the country/province boundary)
    const boundaryFeature = geoData.features[0];
    
    if (!boundaryFeature || !boundaryFeature.geometry) {
      return res.status(404).json({
        success: false,
        error: `Invalid boundary data for ${locationName}`
      });
    }
    
    console.log(`✅ [COORDINATES] Found ${boundaryLevel} boundary for ${locationName}`);
    
    // Import the point-in-polygon generator
    const { generatePointInPolygon } = await import('../globe-geographic/globeService.mjs');
    
    // Generate coordinates using actual polygon boundaries
    const coordinates = [];
    const geometry = boundaryFeature.geometry;
    
    for (let i = 0; i < count; i++) {
      let point = null;
      
      // Handle MultiPolygon geometries (countries/provinces with multiple disconnected areas)
      if (geometry.type === 'MultiPolygon') {
        // Calculate area for each polygon to prioritize mainland over small islands
        const polygonsWithArea = geometry.coordinates.map((polygon, idx) => {
          // Calculate rough area using bounding box
          const coords = polygon[0]; // Outer ring
          let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
          
          coords.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
          
          const area = (maxLat - minLat) * (maxLng - minLng);
          return { polygon, area, index: idx };
        });
        
        // Sort by area (largest first) to prioritize mainland
        polygonsWithArea.sort((a, b) => b.area - a.area);
        
        console.log(`📊 [COORDINATES] ${countryName} has ${polygonsWithArea.length} polygons, largest area: ${polygonsWithArea[0].area.toFixed(4)}, smallest: ${polygonsWithArea[polygonsWithArea.length-1].area.toFixed(4)}`);
        
        // Try largest polygons first (top 80% by area to avoid tiny islands)
        const mainPolygons = polygonsWithArea.slice(0, Math.max(1, Math.ceil(polygonsWithArea.length * 0.2)));
        
        for (const polyData of mainPolygons) {
          const polyGeom = { type: 'Polygon', coordinates: polyData.polygon };
          point = generatePointInPolygon(polyGeom, locationName);
          if (point) {
            console.log(`✅ [COORDINATES] Generated point in polygon ${polyData.index + 1}/${polygonsWithArea.length} (area: ${polyData.area.toFixed(4)})`);
            break;
          }
        }
      } else if (geometry.type === 'Polygon') {
        point = generatePointInPolygon(geometry, locationName);
      }
      
      if (point) {
        coordinates.push({
          lat: point.lat,
          lng: point.lng,
          countryName: countryName,
          provinceName: provinceName || undefined
        });
      } else {
        console.warn(`⚠️ [COORDINATES] Failed to generate point ${i + 1} for ${locationName}`);
      }
    }
    
    if (coordinates.length === 0) {
      return res.status(500).json({
        success: false,
        error: `Failed to generate any valid coordinates for ${locationName}`
      });
    }
    
    console.log(`✅ [COORDINATES] Generated ${coordinates.length}/${count} coordinates for ${locationName} using point-in-polygon`);
    
      return res.json({
        success: true,
        coordinates,
        countryName
      });
    };

    // Race between coordinate generation and timeout
    await Promise.race([coordinateGeneration(), timeoutPromise]);
    
  } catch (error) {
    console.error('❌ [COORDINATES] Error generating coordinates:', error);
    
    if (error.message === 'Request timeout') {
      return res.status(408).json({
        success: false,
        error: `Coordinate generation timeout for ${req.body.countryName}. Please try again.`
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unified Boundary Service endpoints for province clustering
console.log('🚀 [CHANNELS] Registering unified-boundary/province-centroid route');
router.post('/unified-boundary/province-centroid', async (req, res) => {
  console.log('📍 [PROVINCE CENTROID] Route called with body:', req.body);
  try {
    const { provinceName, countryCode } = req.body;
    
    if (!provinceName) {
      return res.status(400).json({
        success: false,
        error: 'Province name is required'
      });
    }
    
    console.log(`🗺️ [PROVINCE CENTROID] Getting centroid for: ${provinceName}, ${countryCode || 'any country'}`);
    
    const centroid = await unifiedBoundaryService.getProvinceCentroid(provinceName, countryCode);
    
    if (centroid) {
      console.log(`✅ [PROVINCE CENTROID] Found centroid for ${provinceName}: [${centroid[1].toFixed(3)}, ${centroid[0].toFixed(3)}]`);
      res.json({
        success: true,
        centroid: centroid,
        provinceName: provinceName,
        countryCode: countryCode
      });
    } else {
      console.warn(`⚠️ [PROVINCE CENTROID] No centroid found for province: ${provinceName}`);
      res.status(404).json({
        success: false,
        error: `No centroid data found for province: ${provinceName}`,
        provinceName: provinceName
      });
    }
    
  } catch (error) {
    console.error('❌ [PROVINCE CENTROID] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all available countries with province support
router.get('/unified-boundary/countries', async (req, res) => {
  try {
    const countries = await unifiedBoundaryService.getAvailableCountries();
    const stats = await unifiedBoundaryService.getStatistics();
    
    res.json({
      success: true,
      countries: countries,
      statistics: stats
    });
  } catch (error) {
    console.error('❌ [COUNTRIES] Error getting countries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate boundary modification channel
router.post('/boundary/generate', async (req, res) => {
  console.log('🔥 [BOUNDARY GENERATION] ENDPOINT HIT! Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { regionName, regionType, candidateCount = 3, modificationType = 'random' } = req.body;

    console.log(`🔍 [BOUNDARY GENERATION] Extracted params:`, { regionName, regionType, candidateCount, modificationType });

    if (!regionName) {
      console.log('❌ [BOUNDARY GENERATION] Missing regionName in request');
      return res.status(400).json({
        success: false,
        error: 'regionName is required'
      });
    }

    console.log(`🗺️ [BOUNDARY GENERATION] Creating boundary channel for: ${regionName} (type: ${regionType || 'any'}, candidates: ${candidateCount})`);

    // Lazy load the service
    const { default: boundaryModificationService } = await import('../services/boundaryModificationService.mjs');
    
    // Initialize if needed
    await boundaryModificationService.initialize();

    // Create complete boundary channel with candidates
    const channelData = await boundaryModificationService.createBoundaryChannel(
      regionName,
      candidateCount,
      regionType
    );

    console.log(`✅ [BOUNDARY GENERATION] Created channel: ${channelData.name} with ${channelData.candidates.length} candidates`);

    // 🔥 SAVE TO BLOCKCHAIN
    try {
      console.log(`💾 [BOUNDARY GENERATION] Saving boundary channel to blockchain...`);
      
      // Add channel transaction with correct blockchain API signature: (type, data, nonce, forceMine)
      // Match the format used by regular channels (flat structure with channelId at top level)
      await blockchain.addTransaction(
        'channel_create', 
        {
          channelId: channelData.id,
          channelName: channelData.name,
          name: channelData.name, // For compatibility
          type: 'boundary',
          category: 'gps_map',
          subtype: 'boundary',
          description: channelData.description,
          location: channelData.location,
          regionName: channelData.regionName,
          regionType: channelData.regionType,
          regionId: channelData.regionId,
          isOfficial: channelData.isOfficial,
          isRelayOfficial: channelData.isRelayOfficial,
          channelPurpose: channelData.channelPurpose,
          color: channelData.color,
          createdAt: channelData.createdAt,
          timestamp: new Date().toISOString()
        },
        null, // nonce - let blockchain generate
        false // forceMine - use normal mining
      );

      console.log(`✅ [BOUNDARY GENERATION] Boundary channel saved to blockchain with ID: ${channelData.id}`);
      
      // Save all boundary candidates to blockchain
      if (channelData.candidates && channelData.candidates.length > 0) {
        console.log(`💾 [BOUNDARY GENERATION] Saving ${channelData.candidates.length} boundary candidates...`);
        for (const candidate of channelData.candidates) {
          await blockchain.addTransaction(
            'candidate_create',
            {
              candidateId: candidate.candidateId,
              channelId: channelData.id,
              name: candidate.candidateName,
              description: candidate.description,
              originalBoundary: candidate.originalBoundary,
              modifiedBoundary: candidate.modifiedBoundary,
              changeMetrics: candidate.changeMetrics,
              isDefault: candidate.isDefault || false,
              rank: candidate.rank || 0,
              votes: candidate.votes || 0,
              createdAt: candidate.createdAt
            },
            null,
            false
          );
        }
        console.log(`✅ [BOUNDARY GENERATION] ${channelData.candidates.length} boundary candidates saved to blockchain`);
      }
      
      // 🎯 INITIALIZE VOTES IN VOTING SYSTEM (same as regular channels)
      console.log('🔄 [BOUNDARY GENERATION] Initializing votes for boundary channel:', channelData.name);
      const { addMockChannelDataToVoteSystem } = await import('../voting/votingEngine.mjs');
      const voteResult = await addMockChannelDataToVoteSystem(channelData);
      if (voteResult.success) {
        console.log('✅ [BOUNDARY GENERATION] Initialized votes for boundary channel:', channelData.name, '- Total votes:', voteResult.totalVotes);
      } else {
        console.warn('⚠️ [BOUNDARY GENERATION] Failed to initialize votes for boundary channel:', channelData.name, '- Reason:', voteResult.reason);
      }
    } catch (blockchainError) {
      console.error('❌ [BOUNDARY GENERATION] Failed to save to blockchain:', blockchainError);
      // Continue anyway - channel is created in memory
    }

    res.json({
      success: true,
      channel: channelData
    });
  } catch (error) {
    console.error('❌ [BOUNDARY GENERATION] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ================== PERFORMANCE OPTIMIZATION ENDPOINTS ==================

/**
 * POST /api/channels/bulk-coordinates
 * High-performance bulk coordinate generation for large-scale channel creation
 * Supports parallel processing and worker threads for massive coordinate batches
 */
router.post('/bulk-coordinates', async (req, res) => {
  console.log('🚀 [BULK COORDINATES] Bulk coordinate generation request received');
  
  try {
    const { requests, optimize = true } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid requests array. Expected array of coordinate requests.'
      });
    }

    console.log(`🚀 [BULK COORDINATES] Processing ${requests.length} coordinate requests`);
    console.log(`🚀 [BULK COORDINATES] Optimization enabled: ${optimize}`);

    // Validate requests
    for (const request of requests) {
      if (!request.countryCode) {
        return res.status(400).json({
          success: false,
          error: 'Each request must include countryCode'
        });
      }
      if (!request.count || request.count <= 0 || request.count > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Each request must have count between 1 and 1000'
        });
      }
    }

    let coordinates;
    if (optimize) {
      // Use optimized bulk service with parallel processing
      coordinates = await bulkCoordinateService.generateBulkCoordinates(requests);
    } else {
      // Use regular sequential processing
      coordinates = [];
      for (const request of requests) {
        const coords = await unifiedBoundaryService.generateCoordinatesInRegion(
          request.countryCode,
          request.provinceCode || null,
          null,
          request.count
        );
        coordinates.push(...coords);
      }
    }

    console.log(`✅ [BULK COORDINATES] Generated ${coordinates.length} total coordinates`);

    res.json({
      success: true,
      coordinates,
      totalCount: coordinates.length,
      requestCount: requests.length,
      optimized: optimize
    });

  } catch (error) {
    console.error('❌ [BULK COORDINATES] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/channels/bulk-create
 * High-performance bulk channel creation with optimized coordinate generation
 * Creates multiple channels with thousands of candidates efficiently
 */
router.post('/bulk-create', async (req, res) => {
  console.log('⚡ [BULK CREATE] Bulk channel creation request received');
  
  try {
    const { 
      channelRequests, 
      useOptimizedCoordinates = true,
      batchSize = 250,
      maxConcurrency = 4 
    } = req.body;
    
    if (!Array.isArray(channelRequests) || channelRequests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channelRequests array'
      });
    }

    console.log(`⚡ [BULK CREATE] Creating ${channelRequests.length} channels with optimization`);

    const results = [];
    const startTime = Date.now();

    // Process channels in parallel batches
    const batches = [];
    for (let i = 0; i < channelRequests.length; i += maxConcurrency) {
      batches.push(channelRequests.slice(i, i + maxConcurrency));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (channelRequest) => {
        try {
          // For large candidate counts, use bulk coordinate service
          if (channelRequest.candidateCount > 100 && useOptimizedCoordinates) {
            const coordinates = await bulkCoordinateService.generateBulkCoordinatesInRegion(
              channelRequest.countryCode,
              channelRequest.provinceCode,
              channelRequest.candidateCount
            );
            
            // Create channel with pre-generated coordinates
            const channel = await createChannelWithCoordinates(channelRequest, coordinates);
            return { success: true, channel };
          } else {
            // Use regular channel creation for smaller counts
            const channel = await createRegularChannel(channelRequest);
            return { success: true, channel };
          }
        } catch (error) {
          console.error(`❌ [BULK CREATE] Failed to create channel:`, error);
          return { 
            success: false, 
            error: error.message,
            channelName: channelRequest.name 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`⚡ [BULK CREATE] Completed batch: ${results.filter(r => r.success).length}/${results.length} successful`);
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ [BULK CREATE] Bulk creation completed: ${successCount}/${channelRequests.length} channels in ${totalTime}ms`);

    res.json({
      success: true,
      results,
      totalChannels: successCount,
      totalTime,
      averageTimePerChannel: totalTime / channelRequests.length
    });

  } catch (error) {
    console.error('❌ [BULK CREATE] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to create channel with pre-generated coordinates
async function createChannelWithCoordinates(channelRequest, coordinates) {
  // Implementation would integrate with existing channel creation logic
  // Using the pre-generated coordinates instead of generating them during creation
  console.log(`📍 Creating channel ${channelRequest.name} with ${coordinates.length} pre-generated coordinates`);
  
  // TODO: Integrate with existing channel creation logic
  // This would replace the coordinate generation part of the existing channel creation
  
  return {
    id: `channel-${Date.now()}-${Math.random()}`,
    name: channelRequest.name,
    candidateCount: coordinates.length,
    coordinates: coordinates.length,
    createdAt: new Date().toISOString()
  };
}

// Helper function for regular channel creation
async function createRegularChannel(channelRequest) {
  // Use existing channel creation logic for smaller requests
  console.log(`📝 Creating regular channel: ${channelRequest.name}`);
  
  return {
    id: `channel-${Date.now()}-${Math.random()}`,
    name: channelRequest.name,
    candidateCount: channelRequest.candidateCount || 0,
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// BOUNDARY CHANNEL API - HIERARCHICAL VOTING SYSTEM (v2.0)
// ============================================================================

/**
 * POST /api/channels/boundary/get-or-create
 * Auto-create or retrieve boundary channel for a region
 * 
 * Body: {
 *   regionName: "India",
 *   regionType: "country",
 *   regionCode: "IND"
 * }
 * 
 * Returns: { success: true, channel: {...} }
 */
router.post('/boundary/get-or-create', async (req, res) => {
  try {
    const { regionName, regionType, regionCode, forceRefresh } = req.body;

    if (!regionName || !regionType || !regionCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: regionName, regionType, regionCode'
      });
    }

    console.log(`🗺️ [API] Boundary channel request: ${regionName} (${regionType}, ${regionCode})${forceRefresh ? ' [FORCE REFRESH]' : ''}`);

    // Import boundary channel service
    const { default: boundaryChannelService } = await import('../services/boundaryChannelService.mjs');

    // Ensure service is initialized
    if (!boundaryChannelService.initialized) {
      await boundaryChannelService.initialize();
    }

    // If forceRefresh is true, delete existing channel first
    if (forceRefresh) {
      const existingChannel = boundaryChannelService.findBoundaryChannelByRegion(regionCode);
      if (existingChannel) {
        console.log(`🔄 [API] Force refresh - deleting existing channel: ${existingChannel.id}`);
        boundaryChannelService.boundaryChannels.delete(existingChannel.id);
      }
    }

    // Get or create channel
    const channel = await boundaryChannelService.getOrCreateBoundaryChannel(
      regionName,
      regionType,
      regionCode
    );

    console.log(`✅ [API] Boundary channel ready: ${channel.id}`);

    res.json({
      success: true,
      channel: channel,
      message: `Boundary channel for ${regionName} is ready`
    });

  } catch (error) {
    console.error('❌ [API] Error creating boundary channel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create boundary channel'
    });
  }
});

/**
 * GET /api/channels/boundary/:regionCode
 * Get boundary channel for a specific region
 */
router.get('/boundary/:regionCode', async (req, res) => {
  try {
    const { regionCode } = req.params;

    const { default: boundaryChannelService } = await import('../services/boundaryChannelService.mjs');

    const channel = boundaryChannelService.findBoundaryChannelByRegion(regionCode);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: `No boundary channel found for region: ${regionCode}`
      });
    }

    res.json({
      success: true,
      channel: channel
    });

  } catch (error) {
    console.error('Error getting boundary channel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/channels/boundary/:channelId/proposal
 * Add new boundary proposal to a channel
 * 
 * Body: {
 *   name: "Kashmir with new borders",
 *   description: "Proposal to adjust northern boundary",
 *   geometry: { type: "Polygon", coordinates: [...] }
 * }
 */
router.post('/boundary/:channelId/proposal', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, geometry, areaChange } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!name || !geometry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, geometry'
      });
    }

    const { default: boundaryChannelService } = await import('../services/boundaryChannelService.mjs');

    const channel = boundaryChannelService.boundaryChannels.get(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Boundary channel not found'
      });
    }

    // Create proposal candidate
    const proposalId = `proposal-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    const proposal = {
      id: proposalId,
      name: name,
      username: `proposal-${proposalId}`,
      type: 'boundary',
      subtype: 'proposal',
      isDefault: false,
      isOfficial: false,
      
      location: {
        type: 'polygon',
        geometry: geometry,
        regionName: channel.regionName,
        regionCode: channel.regionCode
      },
      
      description: description || `Boundary proposal for ${channel.regionName}`,
      bio: `Proposed by user ${userId}`,
      
      votes: 0, // Blockchain votes start at 0
      initialVotes: Math.floor(Math.random() * 20) + 10, // Base demo votes: 10-30
      createdAt: Date.now(),
      proposedBy: userId,
      
      // Area change statistics (if provided)
      ...(areaChange && {
        areaChange: {
          officialArea: areaChange.officialArea,
          proposedArea: areaChange.proposedArea,
          deltaArea: areaChange.deltaArea,
          deltaPercent: areaChange.deltaPercent
        }
      }),
      
      metadata: {
        channelId: channelId,
        regionType: channel.regionType,
        votingScope: channel.votingScope
      }
    };

    // Add to channel candidates
    channel.candidates.push(proposal);
    channel.lastActivity = Date.now();
    
    // Initialize vote counts in VoteService with the generated initial votes (GIT-NATIVE: via query hook)
    const voteId = `${channelId}-${proposalId}`;
    // voteService.initializeCandidateVotes(voteId, proposal.initialVotes || 0); // REMOVED
    console.log(`ℹ️ [BOUNDARY PROPOSAL] Git-native: ${proposal.name} initialized with ${proposal.initialVotes} base votes (via query hook)`);
    
    // Update total votes
    channel.totalVotes = channel.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

    // Save
    await boundaryChannelService.saveBoundaryChannels();

    console.log(`✅ [API] Boundary proposal added: ${proposal.name}`);

    res.json({
      success: true,
      proposal: proposal,
      message: 'Boundary proposal created successfully'
    });

  } catch (error) {
    console.error('Error creating boundary proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/channels/boundary/:channelId/active
 * Get the active (highest-voted) boundary for a channel
 */
router.get('/boundary/:channelId/active', async (req, res) => {
  try {
    const { channelId } = req.params;

    const { default: boundaryChannelService } = await import('../services/boundaryChannelService.mjs');

    const channel = boundaryChannelService.boundaryChannels.get(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Boundary channel not found'
      });
    }

    // Find highest-voted candidate
    const activeBoundary = channel.candidates
      .sort((a, b) => b.votes - a.votes)[0];

    if (!activeBoundary) {
      return res.status(404).json({
        success: false,
        error: 'No boundary proposals found'
      });
    }

    res.json({
      success: true,
      activeBoundary: activeBoundary,
      channel: {
        id: channel.id,
        name: channel.name,
        regionName: channel.regionName,
        regionCode: channel.regionCode
      }
    });

  } catch (error) {
    console.error('Error getting active boundary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 
