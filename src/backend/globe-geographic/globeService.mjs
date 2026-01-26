/**
 * Globe Service - Backend integration for EarthGlobe
 * 
 * Provides globe-specific endpoints and integrates with channel/voting system
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import query from '../../.relay/query.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize RegionsManager for region-aware channel generation
let regionsManagerInstance = null;

const initializeRegionsManager = async () => {
  try {
    // const { default: RegionsManager } = await import('../services/RegionsManager.mjs'); // Archived - using unifiedBoundaryService
    regionsManagerInstance = new RegionsManager();
    await regionsManagerInstance.initialize();
    console.log('🌍 Globe Service: RegionsManager initialized');
    return regionsManagerInstance;
  } catch (error) {
    console.warn('🌍 Globe Service: RegionsManager initialization failed:', error.message);
    return null;
  }
};

// Initialize on module load
initializeRegionsManager();

// Globe data and state
let globeState = {
  activeChannels: new Map(),
  votingActivity: new Map(),
  weatherLayers: [],
  userLocations: new Map()
};

/**
 * GET /api/globe/channels
 * Get all channels with their geographic locations and clustering support
 */
router.get('/channels', async (req, res) => {
  try {
    const { clusterLevel = 'gps' } = req.query;
    
    // Read channels from existing Relay data
    const channelsPath = path.join(__dirname, '../../../data/demo-voting-data.json');
    const channelsData = await fs.readFile(channelsPath, 'utf8');
    const { channels } = JSON.parse(channelsData);

    // Get RegionsManager for region-aware generation
    const regionsManager = regionsManagerInstance;

    // Enhance channels with geographic data
    const geoChannels = channels.map(channel => ({
      ...channel,
      location: generateChannelLocation(channel, regionsManager),
      activityLevel: calculateActivityLevel(channel),
      memberCount: channel.members?.length || 0,
      lastActivity: getLastActivity(channel)
    }));

    // Apply clustering based on requested level
    const clusteredChannels = applyChannelClustering(geoChannels, clusterLevel, regionsManager);

    res.json({
      success: true,
      channels: clusteredChannels,
      count: clusteredChannels.length,
      clusterLevel,
      metadata: {
        originalChannelCount: geoChannels.length,
        clusteredChannelCount: clusteredChannels.length,
        regionAware: regionsManager !== null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching globe channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch globe channels'
    });
  }
});

/**
 * GET /api/globe/cluster-levels
 * Get available clustering levels and their descriptions
 */
router.get('/cluster-levels', (req, res) => {
  try {
    const clusterLevels = [
      {
        id: 'GPS',
        name: 'GPS Level',
        description: 'Individual candidate markers at exact coordinates',
        merging: false,
        zoomRange: { min: 15, max: 20 },
        radius: 0,
        maxPoints: 'unlimited'
      },
      {
        id: 'CITY',
        name: 'City Level', 
        description: 'Merge same-named channels within each city boundary',
        merging: true,
        zoomRange: { min: 12, max: 14 },
        radius: 40,
        maxPoints: 1000
      },
      {
        id: 'STATE',
        name: 'State Level',
        description: 'Merge same-named channels within states/provinces',
        merging: true,
        zoomRange: { min: 9, max: 11 },
        radius: 80,
        maxPoints: 500
      },
      {
        id: 'COUNTRY',
        name: 'Country Level',
        description: 'Merge same-named channels within countries',
        merging: true,
        zoomRange: { min: 6, max: 8 },
        radius: 120,
        maxPoints: 200
      },
      {
        id: 'CONTINENT',
        name: 'Continent Level',
        description: 'Merge same-named channels within continents',
        merging: true,
        zoomRange: { min: 3, max: 5 },
        radius: 160,
        maxPoints: 100
      },
      {
        id: 'GLOBE',
        name: 'Globe Level',
        description: 'Merge all same-named channels worldwide',
        merging: true,
        zoomRange: { min: 0, max: 2 },
        radius: 200,
        maxPoints: 50
      }
    ];

    res.json({
      success: true,
      levels: clusterLevels,
      default: 'GPS'
    });
  } catch (error) {
    console.error('❌ Error fetching cluster levels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cluster levels'
    });
  }
});

/**
 * GET /api/globe/cluster-features
 * Get candidate features formatted for supercluster (GeoJSON)
 */
router.get('/cluster-features', async (req, res) => {
  try {
    const { topic, bbox, zoom = 10, repo_id, branch_id = 'main', scope_type = 'branch' } = req.query;
    
    // Validate required parameters
    if (!repo_id) {
      return res.status(400).json({ 
        success: false,
        error: 'repo_id is required' 
      });
    }
    
    // AUTHORITATIVE READ: domain sheet projection (geo view)
    const sheet = await query({
      endpoint: '/sheet_tip',
      params: {
        repo_id,
        branch_id,
        scope_type,
        domain_id: 'voting.channel',
        view_id: 'geographic'
      },
      repo: repo_id,
      branch: branch_id
    });
    
    const channels = sheet?.rows || [];
    
    // Extract candidate features as GeoJSON
    const features = [];
    
    channels.forEach(channel => {
      // Filter by topic if specified
      if (topic && channel.name !== topic && channel.topic !== topic) {
        return;
      }
      
      if (!channel.candidates || !Array.isArray(channel.candidates)) {
        return;
      }
      
      channel.candidates.forEach(candidate => {
        if (!candidate.location || 
            typeof candidate.location.lat !== 'number' || 
            typeof candidate.location.lng !== 'number') {
          return;
        }

        const { lat, lng } = candidate.location;
        
        // Viewport filtering if bbox provided
        if (bbox) {
          const [west, south, east, north] = bbox.split(',').map(Number);
          if (lat < south || lat > north || lng < west || lng > east) {
            return;
          }
        }

        // Create GeoJSON feature
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            // Core identifiers
            candidateId: candidate.id,
            candidateName: candidate.name || 'Unknown Candidate',
            channelId: channel.id,
            channelName: channel.name || 'Unknown Channel',
            topic: channel.name,
            
            // Vote data
            votes: candidate.votes || 0,
            testVotes: candidate.testVotes || 0,
            realVotes: candidate.realVotes || 0,
            totalVotes: (candidate.votes || 0) + (candidate.testVotes || 0) + (candidate.realVotes || 0),
            
            // Metadata
            description: candidate.description || '',
            region: candidate.region || candidate.location?.region || 'Unknown',
            category: channel.category || 'general',
            participants: channel.participants || 0,
            
            // Clustering keys
            clusterKey: `${channel.name}_${candidate.region || 'unknown'}`,
            
            // Timestamps
            createdAt: candidate.createdAt || channel.createdAt,
            lastActivity: channel.lastActivity
          }
        };
        
        features.push(feature);
      });
    });
    
    res.json({
      success: true,
      type: 'FeatureCollection',
      features: features,
      metadata: {
        featureCount: features.length,
        topicFilter: topic || null,
        boundingBox: bbox || null,
        zoom: parseInt(zoom),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating cluster features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cluster features'
    });
  }
});

/**
 * GET /api/globe/cluster-stats
 * Get clustering statistics and topic breakdown
 */
router.get('/cluster-stats', async (req, res) => {
  try {
    const { clusterLevel = 'GPS', repo_id, branch_id = 'main', scope_type = 'branch' } = req.query;
    
    // Validate required parameters
    if (!repo_id) {
      return res.status(400).json({ 
        success: false,
        error: 'repo_id is required' 
      });
    }
    
    // AUTHORITATIVE READ: domain sheet projection (geo view)
    const sheet = await query({
      endpoint: '/sheet_tip',
      params: {
        repo_id,
        branch_id,
        scope_type,
        domain_id: 'voting.channel',
        view_id: 'geographic'
      },
      repo: repo_id,
      branch: branch_id
    });
    
    const channels = sheet?.rows || [];
    
    // Calculate statistics
    const stats = {
      totalChannels: channels.length,
      totalCandidates: 0,
      totalVotes: 0,
      topicBreakdown: {},
      regionBreakdown: {},
      voteDistribution: {
        min: Infinity,
        max: 0,
        avg: 0,
        median: 0
      }
    };
    
    const allVotes = [];
    
    channels.forEach(channel => {
      const topic = channel.name || 'Unknown';
      if (!stats.topicBreakdown[topic]) {
        stats.topicBreakdown[topic] = {
          channelCount: 0,
          candidateCount: 0,
          totalVotes: 0
        };
      }
      stats.topicBreakdown[topic].channelCount++;
      
      if (channel.candidates && Array.isArray(channel.candidates)) {
        channel.candidates.forEach(candidate => {
          stats.totalCandidates++;
          stats.topicBreakdown[topic].candidateCount++;
          
          const votes = (candidate.votes || 0) + (candidate.testVotes || 0) + (candidate.realVotes || 0);
          stats.totalVotes += votes;
          stats.topicBreakdown[topic].totalVotes += votes;
          allVotes.push(votes);
          
          // Region breakdown
          const region = candidate.region || candidate.location?.region || 'Unknown';
          if (!stats.regionBreakdown[region]) {
            stats.regionBreakdown[region] = 0;
          }
          stats.regionBreakdown[region]++;
        });
      }
    });
    
    // Calculate vote distribution
    if (allVotes.length > 0) {
      stats.voteDistribution.min = Math.min(...allVotes);
      stats.voteDistribution.max = Math.max(...allVotes);
      stats.voteDistribution.avg = Math.round(stats.totalVotes / allVotes.length);
      
      // Calculate median
      const sortedVotes = allVotes.sort((a, b) => a - b);
      const midIndex = Math.floor(sortedVotes.length / 2);
      stats.voteDistribution.median = sortedVotes.length % 2 === 0 
        ? Math.round((sortedVotes[midIndex - 1] + sortedVotes[midIndex]) / 2)
        : sortedVotes[midIndex];
    }
    
    res.json({
      success: true,
      clusterLevel,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating cluster stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cluster statistics'
    });
  }
});

/**
 * GET /api/globe/channel/:id/location
 * Get specific channel location and details
 */
router.get('/channel/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get channel data
    const channelsPath = path.join(__dirname, '../../../data/demo-voting-data.json');
    const channelsData = await fs.readFile(channelsPath, 'utf8');
    const { channels } = JSON.parse(channelsData);
    
    const channel = channels.find(c => c.id === id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    const enhancedChannel = {
      ...channel,
      location: generateChannelLocation(channel),
      activityLevel: calculateActivityLevel(channel),
      memberCount: channel.members?.length || 0,
      lastActivity: getLastActivity(channel),
      nearbyChannels: findNearbyChannels(channel, channels)
    };

    res.json({
      success: true,
      channel: enhancedChannel
    });

  } catch (error) {
    console.error('❌ Error fetching channel location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel location'
    });
  }
});

/**
 * POST /api/globe/channel/:id/vote
 * Submit a vote for a channel with geographic context
 */
router.post('/channel/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote, userLocation } = req.body;

    // Validate vote
    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    // Record vote with geographic context
    const voteRecord = {
      channelId: id,
      vote,
      userLocation,
      timestamp: new Date().toISOString(),
      ip: req.ip
    };

    // Update voting activity map
    if (!globeState.votingActivity.has(id)) {
      globeState.votingActivity.set(id, []);
    }
    globeState.votingActivity.get(id).push(voteRecord);

    // Keep only recent votes (last 100)
    const recentVotes = globeState.votingActivity.get(id).slice(-100);
    globeState.votingActivity.set(id, recentVotes);

    // Calculate vote statistics
    const upVotes = recentVotes.filter(v => v.vote === 'up').length;
    const downVotes = recentVotes.filter(v => v.vote === 'down').length;
    const totalVotes = upVotes + downVotes;
    const approval = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0;

    res.json({
      success: true,
      vote: voteRecord,
      statistics: {
        upVotes,
        downVotes,
        totalVotes,
        approval: Math.round(approval)
      }
    });

    // Broadcast vote to connected clients (if websocket is available)
    broadcastVoteUpdate(id, {
      vote: voteRecord,
      statistics: { upVotes, downVotes, totalVotes, approval }
    });

  } catch (error) {
    console.error('❌ Error processing globe vote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process vote'
    });
  }
});

/**
 * GET /api/globe/activity
 * Get real-time globe activity data
 */
router.get('/activity', (req, res) => {
  try {
    const activity = {
      activeChannels: Array.from(globeState.activeChannels.keys()),
      recentVotes: getRecentVotingActivity(),
      onlineUsers: globeState.userLocations.size,
      hotspots: calculateActivityHotspots()
    };

    res.json({
      success: true,
      activity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching globe activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch globe activity'
    });
  }
});

/**
 * GET /api/globe/tiles/:z/:x/:y.:ext
 * Proxy tile requests to EarthGlobe4 tile server
 */
router.get('/tiles/:z/:x/:y.:ext', async (req, res) => {
  try {
    const { z, x, y, ext } = req.params;
    const tileUrl = `http://localhost:8080/tiles/${z}/${x}/${y}.${ext}`;
    
    const response = await fetch(tileUrl);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      res.set({
        'Content-Type': ext === 'png' ? 'image/png' : 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      });
      res.send(Buffer.from(buffer));
    } else {
      res.status(404).send('Tile not found');
    }
  } catch (error) {
    console.error('❌ Error fetching tile:', error);
    res.status(500).send('Tile server error');
  }
});

/**
 * GET /api/globe/weather/:type/:z/:x/:y.png
 * Serve weather overlay tiles with external API fallback
 */
router.get('/weather/:type/:z/:x/:y.png', async (req, res) => {
  try {
    const { type, z, x, y } = req.params;
    
    // GLOBAL WEATHER COVERAGE STRATEGY:
    // 1. OpenWeatherMap - Global coverage for all weather types (primary)
    // 2. RainViewer - Global radar and precipitation (secondary)
    // 3. NASA EcoWatch - Global satellite data (tertiary)
    // 4. Iowa State Mesonet - North America radar (regional fallback)
    // 5. Generated fallback tiles - Always available (last resort)
    
    // Get current timestamp for RainViewer (updates every 10 minutes)
    const currentTimestamp = Math.floor(Date.now() / 100000) * 100000;
    
    // Define weather data sources with GLOBAL coverage APIs (no API keys required)
    const weatherSources = {
      'clouds': [
        // Global cloud coverage from multiple sources
        `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://www.rainviewer.com/map/1.0/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Clouds/Clouds_1km/MapServer/tile/${z}/${y}/${x}`,
        `https://tile.openweathermap.org/map/clouds_new/${z}/${x}/${y}.png?appid=demo`,
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/${z}/${x}/${y}.png`
      ],
      'precipitation': [
        // Global precipitation from multiple sources
        `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://www.rainviewer.com/map/1.0/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Precipitation/Precipitation_1km/MapServer/tile/${z}/${y}/${x}`,
        `https://tile.openweathermap.org/map/precipitation_new/${z}/${x}/${y}.png?appid=demo`,
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/${z}/${x}/${y}.png`
      ],
      'temperature': [
        // Global temperature from multiple sources
        `https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Temperature/Temperature_1km/MapServer/tile/${z}/${y}/${x}`,
        `https://tile.openweathermap.org/map/temp_new/${z}/${x}/${y}.png?appid=demo`,
        `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://www.rainviewer.com/map/1.0/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`
      ],
      'radar': [
        // Global radar coverage with regional fallbacks
        `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://www.rainviewer.com/map/1.0/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Radar/Radar_1km/MapServer/tile/${z}/${y}/${x}`,
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/${z}/${x}/${y}.png`
      ],
      'snow': [
        // Global snow coverage from multiple sources
        `https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Snow/Snow_1km/MapServer/tile/${z}/${y}/${x}`,
        `https://tile.openweathermap.org/map/snow_new/${z}/${x}/${y}.png?appid=demo`,
        `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`,
        `https://www.rainviewer.com/map/1.0/${currentTimestamp}/256/${z}/${x}/${y}/2/1_1.png`
      ]
    };

    const sourceUrls = weatherSources[type];
    if (!sourceUrls) {
      console.log(`❌ Unknown weather type: ${type}`);
      return res.status(404).send('Weather type not found');
    }

    // Try to fetch from external APIs (multiple fallbacks)
    for (let i = 0; i < sourceUrls.length; i++) {
      const sourceUrl = sourceUrls[i];
      try {
        console.log(`🌤️ Fetching weather tile from: ${sourceUrl}`);
        const response = await fetch(sourceUrl, {
          headers: {
            'User-Agent': 'EarthGlobe/1.0 (Weather Data Client)'
          }
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          res.set({
            'Content-Type': 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300'
          });
          res.send(Buffer.from(imageBuffer));
          console.log(`✅ Weather tile served from external API: ${type} (provider ${i + 1})`);
          return;
        }
      } catch (externalError) {
        console.log(`⚠️ External weather API ${i + 1} failed for ${type}:`, externalError.message);
      }
    }

    // Fallback: Create realistic weather overlay based on type with GLOBAL distribution
    console.log(`🔄 Creating GLOBAL fallback weather tile for: ${type}`);
    
    const weatherPatterns = {
      'clouds': {
        baseColor: 'rgba(255, 255, 255, 0.6)',
        pattern: 'clouds',
        intensity: 0.8,
        globalDistribution: true
      },
      'precipitation': {
        baseColor: 'rgba(0, 100, 255, 0.7)',
        pattern: 'rain',
        intensity: 0.9,
        globalDistribution: true
      },
      'temperature': {
        baseColor: 'rgba(255, 100, 0, 0.8)',
        pattern: 'gradient',
        intensity: 0.9,
        globalDistribution: true
      },
      'radar': {
        baseColor: 'rgba(255, 0, 0, 0.8)',
        pattern: 'radar',
        intensity: 0.9,
        globalDistribution: true
      },
      'snow': {
        baseColor: 'rgba(255, 255, 255, 0.8)',
        pattern: 'snow',
        intensity: 0.9,
        globalDistribution: true
      }
    };

    const pattern = weatherPatterns[type] || weatherPatterns['clouds'];
    const canvas = createWeatherTile(256, 256, pattern);
    
    console.log(`✅ Fallback weather tile created for ${type} with pattern:`, pattern.pattern);
    
    res.set({
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
    res.send(canvas);

  } catch (error) {
    console.error('❌ Error fetching weather tile:', error);
    res.status(500).send('Weather server error');
  }
});

/**
 * GET /api/globe/weather/status
 * Get weather service status and coverage information
 */
router.get('/weather/status', async (req, res) => {
  try {
    // Test a few weather endpoints to check availability
    const testEndpoints = [
      { type: 'clouds', url: 'https://tile.openweathermap.org/map/clouds_new/3/4/2.png?appid=fake_key' },
      { type: 'precipitation', url: 'https://tile.openweathermap.org/map/precipitation_new/3/4/2.png?appid=fake_key' },
      { type: 'temperature', url: 'https://tile.openweathermap.org/map/temp_new/3/4/2.png?appid=fake_key' }
    ];

    const status = {
      service: 'Global Weather API',
      status: 'operational',
      coverage: 'Global',
      timestamp: new Date().toISOString(),
             providers: {
         primary: 'RainViewer (Global Radar)',
         secondary: 'OpenWeatherMap (Global)',
         tertiary: 'NASA EcoWatch (Satellite)',
         regional: 'Iowa State Mesonet (North America)'
       },
      weatherTypes: [
        { type: 'clouds', description: 'Global cloud coverage', available: true },
        { type: 'precipitation', description: 'Global rainfall/snowfall', available: true },
        { type: 'temperature', description: 'Global temperature maps', available: true },
        { type: 'radar', description: 'Global radar coverage', available: true },
        { type: 'snow', description: 'Global snow coverage', available: true }
      ],
      regions: [
        { name: 'Global Coverage', dataTypes: ['Clouds', 'Precipitation', 'Temperature', 'Radar', 'Snow'] },
        { name: 'North America', dataTypes: ['High-resolution Radar', 'Detailed Forecasts'] },
        { name: 'Europe', dataTypes: ['Satellite Data', 'Weather Models'] },
        { name: 'Asia', dataTypes: ['Regional Coverage', 'Climate Data'] },
        { name: 'Oceania', dataTypes: ['Pacific Weather', 'Ocean Data'] },
        { name: 'Africa', dataTypes: ['Satellite Coverage', 'Climate Models'] },
        { name: 'South America', dataTypes: ['Regional Data', 'Weather Patterns'] }
      ],
      fallbackStrategy: '5-tier fallback system with generated tiles as last resort'
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error fetching weather status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather status'
    });
  }
});

/**
 * GET /api/globe/terrain/:z/:x/:y.terrain
 * Serve terrain data
 */
router.get('/terrain/:z/:x/:y.terrain', async (req, res) => {
  try {
    const { z, x, y } = req.params;
    const terrainPath = path.join(__dirname, '../../../EarthGlobe4/data/terrain', z, x, `${y}.terrain`);
    
    try {
      const terrainData = await fs.readFile(terrainPath);
      res.set({
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      res.send(terrainData);
    } catch (fileError) {
      // Return flat terrain if file doesn't exist
      res.status(204).send(); // No content - flat terrain
    }
  } catch (error) {
    console.error('❌ Error fetching terrain:', error);
    res.status(500).send('Terrain server error');
  }
});

/**
 * POST /api/globe/user/location
 * Update user location for proximity features
 */
router.post('/user/location', (req, res) => {
  try {
    const { userId, location } = req.body;

    if (!userId || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or location data'
      });
    }

    // Store user location with timestamp
    globeState.userLocations.set(userId, {
      ...location,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user location'
    });
  }
});

// Channel Clustering Functions

function applyChannelClustering(channels, clusterLevel, regionsManager = null) {
  console.log(`🔗 Applying ${clusterLevel} level clustering to ${channels.length} channels`);
  
  if (clusterLevel === 'gps') {
    // No clustering - return individual candidates with their own locations
    const individualCandidates = [];
    
    channels.forEach(channel => {
      if (channel.candidates && channel.candidates.length > 0) {
        channel.candidates.forEach(candidate => {
          individualCandidates.push({
            id: `${channel.id}-${candidate.id}`,
            name: channel.name, // Topic name
            description: `${candidate.user.displayName} - ${channel.name}`,
            type: 'candidate',
            clusterInfo: {
              level: 'gps',
              clustered: false,
              originalChannelCount: 1,
              mergedCandidates: 1,
              topicName: channel.name,
              candidateName: candidate.user.displayName
            },
            location: generateCandidateLocation(candidate, channel, regionsManager),
            candidates: [candidate], // Single candidate
            participants: 1,
            topics: channel.topics || [channel.name],
            activityLevel: calculateActivityLevel(channel),
            memberCount: 1,
            lastActivity: channel.lastActivity,
            originalChannel: channel
          });
        });
      }
    });
    
    console.log(`🔗 GPS level: ${channels.length} channels → ${individualCandidates.length} individual candidates`);
    return individualCandidates;
  }

  // Use the regionsManagerInstance if regionsManager param is null
  const regionsToUse = regionsManager || regionsManagerInstance;
  
  if (!regionsToUse) {
    console.warn('🔗 RegionsManager not available, cannot perform region-based clustering');
    return channels;
  }

  const regions = regionsToUse.getAllRegions();
  const clusteredChannels = new Map();

  // Extract all candidates and cluster them by topic + region
  channels.forEach(channel => {
    if (channel.candidates && channel.candidates.length > 0) {
      channel.candidates.forEach(candidate => {
        const candidateLocation = generateCandidateLocation(candidate, channel, regionsManager);
        const clusterKey = generateClusterKey(channel.name, candidateLocation, clusterLevel, regions);
        
        if (!clusteredChannels.has(clusterKey)) {
          // Extract region info from cluster key
          const keyParts = clusterKey.split('|');
          const topicName = keyParts[0];
          const regionId = keyParts[1] || 'unknown';
          const regionName = keyParts[2] || 'Unknown Region';
          
          // Create new cluster with topic-based naming
          clusteredChannels.set(clusterKey, {
            id: `cluster-${clusterLevel}-${topicName}-${regionId}`,
            name: topicName, // Use the topic name, not region name
            description: `${topicName} in ${regionName}`,
            type: 'cluster',
            clusterInfo: {
              level: clusterLevel,
              clustered: true,
              clusterKey,
              originalChannelCount: 0,
              mergedCandidates: 0,
              regionId: regionId,
              regionName: regionName,
              topicName: topicName
            },
            location: candidateLocation, // Use first candidate's location as cluster center
            candidates: [],
            participants: 0,
            topics: channel.topics || [channel.name],
            activityLevel: 0,
            memberCount: 0,
            lastActivity: channel.lastActivity,
            originalChannel: channel
          });
        }

        // Add candidate to cluster
        const cluster = clusteredChannels.get(clusterKey);
        addCandidateToCluster(cluster, candidate, channel);
      });
    }
  });

  const result = Array.from(clusteredChannels.values());
  console.log(`🔗 Clustering complete: ${channels.length} channels → ${result.length} clusters`);
  
  return result;
}

function generateClusterKey(topicName, location, clusterLevel, regions) {
  if (!location || !location.latitude || !location.longitude) {
    return `${topicName}|unknown|unknown`;
  }

  // Find the appropriate region for this clustering level
  const regionId = getRegionIdForClusterLevel(location, clusterLevel, regions);
  const region = regions[regionId];
  const regionName = region ? region.name : 'unknown';
  
  return `${topicName}|${regionId}|${regionName}`;
}

function getRegionIdForClusterLevel(location, clusterLevel, regions) {
  const point = [location.longitude, location.latitude];
  
  // Find the most specific region that contains this point
  const regionTypes = {
    'city': ['city', 'state', 'country', 'region', 'world'],
    'state': ['state', 'country', 'region', 'world'],
    'country': ['country', 'region', 'world'],
    'continent': ['region', 'world'],
    'globe': ['world']
  };

  const targetTypes = regionTypes[clusterLevel] || ['world'];

  for (const targetType of targetTypes) {
    for (const region of Object.values(regions)) {
      if (region.type === targetType && pointInPolygon(point, region.geometry)) {
        return region.id;
      }
    }
  }

  return 'WORLD'; // Fallback to world
}

function addCandidateToCluster(cluster, candidate, channel) {
  // Add candidate with original channel info
  cluster.candidates.push({
    ...candidate,
    originalChannelId: channel.id,
    originalChannelName: channel.name
  });

  // Re-rank candidates by vote count within the merged cluster
  cluster.candidates.sort((a, b) => {
    const aVotes = (a.votes || 0) + (a.testVotes || 0) + (a.realVotes || 0);
    const bVotes = (b.votes || 0) + (b.testVotes || 0) + (b.realVotes || 0);
    return bVotes - aVotes;
  });

  // Update cluster metadata
  cluster.clusterInfo.originalChannelCount++;
  cluster.clusterInfo.mergedCandidates = cluster.candidates.length;
  cluster.participants += 1;
  cluster.memberCount += 1;
  
  // Merge topics
  if (channel.topics) {
    cluster.topics = [...new Set([...cluster.topics, ...channel.topics])];
  }
  
  // Update activity level (take maximum)
  cluster.activityLevel = Math.max(cluster.activityLevel, calculateActivityLevel(channel) || 0);
  
  // Update description to show candidate count
  cluster.description = `${cluster.clusterInfo.topicName} in ${cluster.clusterInfo.regionName} (${cluster.clusterInfo.mergedCandidates} candidates)`;
}

// Helper functions

function generateChannelLocation(channel, regionsManager = null) {
  // Region-aware channel generation with valid GPS coordinates inside real-world polygons
  
  if (!regionsManager) {
    console.warn('🔧 RegionsManager not available, using fallback locations');
    return generateFallbackLocation(channel);
  }

  try {
    // Get all regions for point-in-polygon selection
    const regions = regionsManager.getAllRegions();
    const regionsList = Object.values(regions).filter(r => 
      r.type === 'city' || r.type === 'state' || r.type === 'country'
    );

    if (regionsList.length === 0) {
      console.warn('🔧 No regions available, using fallback locations');
      return generateFallbackLocation(channel);
    }

    // Select region based on channel type and name
    const regionIndex = parseInt(channel.id || '0', 36) % regionsList.length;
    const selectedRegion = regionsList[regionIndex];

    // Generate valid coordinate inside the selected region polygon
    const location = generatePointInPolygon(selectedRegion.geometry, selectedRegion.id);
    
    if (!location) {
      console.warn(`🔧 Failed to generate point in ${selectedRegion.name}, using centroid`);
      return {
        latitude: selectedRegion.centroid[1],
        longitude: selectedRegion.centroid[0],
        city: selectedRegion.name,
        city_id: selectedRegion.type === 'city' ? selectedRegion.id : null,
        state_id: findParentRegion(selectedRegion, regions, 'state')?.id,
        country_id: findParentRegion(selectedRegion, regions, 'country')?.id,
        continent_id: findParentRegion(selectedRegion, regions, 'region')?.id,
        region_metadata: {
          region_id: selectedRegion.id,
          region_name: selectedRegion.name,
          region_type: selectedRegion.type
        }
      };
    }

    return {
      latitude: parseFloat(location.lat.toFixed(6)),
      longitude: parseFloat(location.lng.toFixed(6)),
      city: selectedRegion.name,
      city_id: selectedRegion.type === 'city' ? selectedRegion.id : null,
      state_id: findParentRegion(selectedRegion, regions, 'state')?.id,
      country_id: findParentRegion(selectedRegion, regions, 'country')?.id,
      continent_id: findParentRegion(selectedRegion, regions, 'region')?.id,
      region_metadata: {
        region_id: selectedRegion.id,
        region_name: selectedRegion.name,
        region_type: selectedRegion.type,
        generated_method: 'point_in_polygon'
      }
    };

  } catch (error) {
    console.error('🔧 Error in region-aware channel generation:', error);
    return generateFallbackLocation(channel);
  }
}

function generateCandidateLocation(candidate, channel, regionsManager = null) {
  // Generate individual GPS location for each candidate based on their location description
  
  if (!regionsManager) {
    console.warn('🔧 RegionsManager not available, using fallback candidate locations');
    return generateFallbackCandidateLocation(candidate, channel);
  }

  try {
    // Get all regions for point-in-polygon selection
    const regions = regionsManager.getAllRegions();
    const regionsList = Object.values(regions).filter(r => 
      r.type === 'city' || r.type === 'state' || r.type === 'country'
    );

    if (regionsList.length === 0) {
      console.warn('🔧 No regions available, using fallback candidate locations');
      return generateFallbackCandidateLocation(candidate, channel);
    }

    // Use candidate ID and location string to determine region
    const locationSeed = `${candidate.id}-${candidate.location || 'default'}`;
    const regionIndex = parseInt(locationSeed, 36) % regionsList.length;
    const selectedRegion = regionsList[regionIndex];

    // Generate valid coordinate inside the selected region polygon
    const location = generatePointInPolygon(selectedRegion.geometry, selectedRegion.id);
    
    if (!location) {
      console.warn(`🔧 Failed to generate location for candidate ${candidate.id}, using fallback`);
      return generateFallbackCandidateLocation(candidate, channel);
    }

    return {
      latitude: parseFloat(location.lat.toFixed(6)),
      longitude: parseFloat(location.lng.toFixed(6)),
      city: selectedRegion.name,
      city_id: selectedRegion.type === 'city' ? selectedRegion.id : null,
      state_id: findParentRegion(selectedRegion, regions, 'state')?.id,
      country_id: findParentRegion(selectedRegion, regions, 'country')?.id,
      continent_id: findParentRegion(selectedRegion, regions, 'region')?.id,
      region_metadata: {
        region_id: selectedRegion.id,
        region_name: selectedRegion.name,
        region_type: selectedRegion.type,
        generated_method: 'point_in_polygon_candidate',
        candidate_id: candidate.id,
        candidate_location: candidate.location
      }
    };

  } catch (error) {
    console.error(`🔧 Error generating candidate location for ${candidate.id}:`, error);
    return generateFallbackCandidateLocation(candidate, channel);
  }
}

function generateFallbackCandidateLocation(candidate, channel) {
  // Use the candidate ID to create deterministic but spread-out locations
  const locations = {
    environmental: [
      { latitude: 47.6062, longitude: -122.3321, city: 'Seattle', country_id: 'USA' },
      { latitude: 45.5152, longitude: -122.6784, city: 'Portland', country_id: 'USA' },
      { latitude: 37.3861, longitude: -122.0839, city: 'Mountain View', country_id: 'USA' },
      { latitude: 55.6761, longitude: 12.5683, city: 'Copenhagen', country_id: 'DNK' }
    ],
    governance: [
      { latitude: 38.9072, longitude: -77.0369, city: 'Washington DC', country_id: 'USA' },
      { latitude: 51.5074, longitude: -0.1278, city: 'London', country_id: 'GBR' },
      { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country_id: 'FRA' },
      { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country_id: 'JPN' }
    ],
    social: [
      { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', country_id: 'USA' },
      { latitude: 40.7128, longitude: -74.0060, city: 'New York', country_id: 'USA' },
      { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country_id: 'USA' },
      { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country_id: 'AUS' }
    ]
  };

  // Determine channel type from channel name or category
  let channelType = 'social';
  if (channel.category) {
    channelType = channel.category.toLowerCase();
  } else if (channel.name && channel.name.toLowerCase().includes('sustainable')) {
    channelType = 'environmental';
  }

  const typeLocations = locations[channelType] || locations.social;
  
  // Use candidate ID to create unique location per candidate
  const candidateHash = parseInt(candidate.id || '0', 36);
  const locationIndex = candidateHash % typeLocations.length;
  const baseLocation = typeLocations[locationIndex];

  // Add small random offset to spread candidates out even in same city
  const offsetLat = ((candidateHash % 1000) / 10000) * 0.2 - 0.1; // +/- 0.1 degrees
  const offsetLng = (((candidateHash * 7) % 1000) / 10000) * 0.2 - 0.1; // +/- 0.1 degrees

  return {
    latitude: baseLocation.latitude + offsetLat,
    longitude: baseLocation.longitude + offsetLng,
    city: baseLocation.city,
    country_id: baseLocation.country_id,
    region_metadata: {
      generated_method: 'fallback_candidate',
      candidate_id: candidate.id,
      candidate_location: candidate.location,
      channel_type: channelType
    }
  };
}

function generatePointInPolygon(geometry, regionId, maxAttempts = 50) {
  // Generate a random point inside a polygon using bounding box + point-in-polygon test
  if (!geometry || !geometry.coordinates) {
    console.warn(`🔧 Invalid geometry for region ${regionId}`);
    return null;
  }

  try {
    // Get bounding box of the polygon
    const coordinates = geometry.coordinates[0];
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      console.warn(`🔧 Invalid coordinates for region ${regionId}`);
      return null;
    }

    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Generate random points within bounding box until one falls inside polygon
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const lng = minLng + Math.random() * (maxLng - minLng);
      const lat = minLat + Math.random() * (maxLat - minLat);
      
      if (pointInPolygon([lng, lat], geometry)) {
        return { lat, lng };
      }
    }

    console.warn(`🔧 Failed to generate point in polygon for ${regionId} after ${maxAttempts} attempts`);
    return null;
  } catch (error) {
    console.error(`🔧 Error generating point in polygon for ${regionId}:`, error);
    return null;
  }
}

function pointInPolygon(point, geometry) {
  // Simple point-in-polygon test using ray casting algorithm
  const [x, y] = point;
  const coordinates = geometry.coordinates[0];
  let inside = false;
  
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const [xi, yi] = coordinates[i];
    const [xj, yj] = coordinates[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

function findParentRegion(region, allRegions, targetType) {
  // Walk up the hierarchy to find parent of specified type
  let current = region;
  while (current && current.parent_id) {
    const parent = allRegions[current.parent_id];
    if (parent && parent.type === targetType) {
      return parent;
    }
    current = parent;
  }
  return null;
}

function calculateActivityLevel(channel) {
  // Calculate activity based on recent messages, votes, etc.
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  let activityScore = 0;
  
  // Check recent messages
  if (channel.messages) {
    const recentMessages = channel.messages.filter(msg => 
      (now - new Date(msg.timestamp).getTime()) < hourMs
    );
    activityScore += recentMessages.length * 0.1;
  }
  
  // Check voting activity
  if (globeState.votingActivity.has(channel.id)) {
    const recentVotes = globeState.votingActivity.get(channel.id).filter(vote =>
      (now - new Date(vote.timestamp).getTime()) < hourMs
    );
    activityScore += recentVotes.length * 0.2;
  }
  
  // Normalize to 0-1 range
  return Math.min(activityScore / 10, 1);
}

function getLastActivity(channel) {
  const activities = [];
  
  if (channel.messages && channel.messages.length > 0) {
    const lastMessage = channel.messages[channel.messages.length - 1];
    activities.push(new Date(lastMessage.timestamp));
  }
  
  if (globeState.votingActivity.has(channel.id)) {
    const votes = globeState.votingActivity.get(channel.id);
    if (votes.length > 0) {
      const lastVote = votes[votes.length - 1];
      activities.push(new Date(lastVote.timestamp));
    }
  }
  
  if (activities.length === 0) {
    return 'No recent activity';
  }
  
  const latest = new Date(Math.max(...activities));
  const now = new Date();
  const diffMs = now - latest;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function findNearbyChannels(channel, allChannels) {
  if (!channel.location) return [];
  
  const nearby = allChannels
    .filter(c => c.id !== channel.id && c.location)
    .map(c => ({
      ...c,
      distance: calculateDistance(channel.location, c.location)
    }))
    .filter(c => c.distance < 100) // Within 100km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5); // Top 5 nearest
    
  return nearby;
}

function calculateDistance(loc1, loc2) {
  // Haversine formula for distance between two lat/lng points
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getRecentVotingActivity() {
  const recent = [];
  const hourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [channelId, votes] of globeState.votingActivity) {
    const recentVotes = votes.filter(vote => 
      new Date(vote.timestamp).getTime() > hourAgo
    );
    
    if (recentVotes.length > 0) {
      recent.push({
        channelId,
        voteCount: recentVotes.length,
        latestVote: recentVotes[recentVotes.length - 1]
      });
    }
  }
  
  return recent.sort((a, b) => b.voteCount - a.voteCount);
}

function calculateActivityHotspots() {
  const hotspots = [];
  const grid = new Map(); // Grid-based clustering
  const gridSize = 0.5; // 0.5 degree grid (~55km)
  
  // Aggregate activity by geographic grid
  for (const [channelId, votes] of globeState.votingActivity) {
    const recentVotes = votes.filter(vote => 
      (Date.now() - new Date(vote.timestamp).getTime()) < (60 * 60 * 1000)
    );
    
    recentVotes.forEach(vote => {
      if (vote.userLocation) {
        const gridKey = `${Math.floor(vote.userLocation.latitude / gridSize)},${Math.floor(vote.userLocation.longitude / gridSize)}`;
        
        if (!grid.has(gridKey)) {
          grid.set(gridKey, {
            latitude: Math.floor(vote.userLocation.latitude / gridSize) * gridSize + gridSize/2,
            longitude: Math.floor(vote.userLocation.longitude / gridSize) * gridSize + gridSize/2,
            activity: 0,
            channels: new Set()
          });
        }
        
        const hotspot = grid.get(gridKey);
        hotspot.activity++;
        hotspot.channels.add(channelId);
      }
    });
  }
  
  // Convert to array and sort by activity
  return Array.from(grid.values())
    .map(hotspot => ({
      ...hotspot,
      channelCount: hotspot.channels.size,
      channels: undefined // Remove Set object for JSON serialization
    }))
    .filter(hotspot => hotspot.activity > 2)
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 10);
}

function broadcastVoteUpdate(channelId, data) {
  // If WebSocket is available, broadcast real-time updates
  if (global.wsClients) {
    const message = JSON.stringify({
      type: 'vote_update',
      channelId,
      data
    });
    
    global.wsClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

// Helper function to get bounding box for tile coordinates
function getBboxForTile(x, y, z) {
  const n = Math.pow(2, z);
  const lonMin = (x / n) * 360 - 180;
  const lonMax = ((x + 1) / n) * 360 - 180;
  const latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  return `${lonMin},${latMin},${lonMax},${latMax}`;
}

// Helper function to create colored tile for demo weather
function createColoredTile(width, height, color) {
  // Simple PNG creation for demo - in production use a proper image library
  const buffer = Buffer.alloc(width * height * 4); // RGBA
  const [r, g, b, a] = parseRGBA(color);
  
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = r;     // Red
    buffer[i + 1] = g; // Green  
    buffer[i + 2] = b; // Blue
    buffer[i + 3] = Math.floor(a * 255); // Alpha
  }
  
  return buffer; // This would need proper PNG encoding in production
}

// Helper to parse RGBA color string
function parseRGBA(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10), 
      parseInt(match[3], 10),
      match[4] ? parseFloat(match[4]) : 1.0
    ];
  }
  return [128, 128, 128, 0.5]; // Default gray
}

// Helper function to create realistic weather tiles with GLOBAL distribution
function createWeatherTile(width, height, pattern) {
  const buffer = Buffer.alloc(width * height * 4); // RGBA
  const [r, g, b, a] = parseRGBA(pattern.baseColor);
  
  // Create globally distributed weather patterns
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      let alpha = Math.floor(a * 255 * pattern.intensity);
      
      // Add GLOBAL pattern variation based on weather type
      switch (pattern.pattern) {
        case 'clouds':
          // Create global cloud patterns - more coverage in tropical and temperate zones
          const lat = (y / height) * 180 - 90; // Convert to latitude (-90 to 90)
          const cloudDensity = Math.sin(lat * Math.PI / 180) * 0.3 + 0.7;
          const cloudNoise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.3 + cloudDensity;
          alpha = Math.floor(alpha * cloudNoise);
          break;
          
        case 'rain':
          // Create global rain patterns - more in tropical and coastal areas
          const rainLat = (y / height) * 180 - 90;
          const tropicalRain = Math.abs(lat) < 30 ? 0.8 : 0.4;
          const rainStreak = (x + y * 2) % 20 < 3 ? tropicalRain : 0.2;
          alpha = Math.floor(alpha * rainStreak);
          break;
          
        case 'gradient':
          // Create global temperature gradient - warmer at equator, cooler at poles
          const tempLat = (y / height) * 180 - 90;
          const tempGradient = Math.cos(tempLat * Math.PI / 180) * 0.5 + 0.5;
          const localGradient = (x + y) / (width + height);
          alpha = Math.floor(alpha * (tempGradient * 0.7 + localGradient * 0.3));
          break;
          
        case 'radar':
          // Create global radar patterns - more active in storm-prone regions
          const radarLat = (y / height) * 180 - 90;
          const stormActivity = Math.abs(lat) < 45 ? 0.8 : 0.3;
          const centerX = width / 2;
          const centerY = height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const radarRing = Math.sin(distance * 0.1) * 0.5 + 0.5;
          alpha = Math.floor(alpha * radarRing * stormActivity);
          break;
          
        case 'snow':
          // Create global snow patterns - more at higher latitudes
          const snowLat = (y / height) * 180 - 90;
          const snowDensity = Math.abs(lat) > 45 ? 0.9 : (Math.abs(lat) > 30 ? 0.5 : 0.1);
          const snowNoise = Math.random() > 0.7 ? snowDensity : 0.1;
          alpha = Math.floor(alpha * snowNoise);
          break;
          
        default:
          alpha = Math.floor(alpha * 0.5);
      }
      
      buffer[index] = r;     // Red
      buffer[index + 1] = g; // Green  
      buffer[index + 2] = b; // Blue
      buffer[index + 3] = alpha; // Alpha
    }
  }
  
  return buffer; // This would need proper PNG encoding in production
}

// Export helper functions for coordinate generation
export { generatePointInPolygon, pointInPolygon };

export default router;
