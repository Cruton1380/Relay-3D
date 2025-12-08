/**
 * Optimized Channels API Endpoint
 * 
 * Provides optimized channel data to the frontend with perfect clustering.
 */

import express from 'express';
import { optimizedChannelDataProvider } from '../services/optimizedChannelDataProvider.mjs';

const router = express.Router();

/**
 * GET /api/optimized-channels
 * Get optimized channels with perfect clustering
 */
router.get('/', async (req, res) => {
  try {
    const { count = 5, validate = true } = req.query;
    const channelCount = Math.min(parseInt(count) || 5, 20); // Max 20 channels
    
    console.log(`🏭 Generating ${channelCount} optimized channels for frontend...`);
    
    // Generate optimized channels
    const channels = await optimizedChannelDataProvider.generateOptimizedChannels(channelCount);
    
    // Validate if requested
    if (validate) {
      for (const channel of channels) {
        optimizedChannelDataProvider.validateChannelForFrontend(channel);
      }
    }
    
    // Get clustering summaries
    const clusteringSummaries = channels.map(channel => ({
      channelId: channel.id,
      channelName: channel.name,
      clustering: optimizedChannelDataProvider.getClusteringSummary(channel)
    }));
    
    const response = {
      success: true,
      channels: channels,
      metadata: {
        totalChannels: channels.length,
        totalCandidates: channels.reduce((sum, ch) => sum + ch.candidateCount, 0),
        totalVotes: channels.reduce((sum, ch) => sum + ch.totalVotes, 0),
        generatedAt: new Date().toISOString(),
        clusteringOptimized: true,
        voteReconciliation: 'PERFECT'
      },
      clusteringSummaries: clusteringSummaries
    };
    
    console.log(`✅ Served ${channels.length} optimized channels to frontend`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating optimized channels:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/optimized-channels/:id/clustering
 * Get detailed clustering information for a specific channel
 */
router.get('/:id/clustering', async (req, res) => {
  try {
    const { id } = req.params;
    const { level = 'all' } = req.query;
    
    // For demo purposes, generate a single channel with the requested ID
    const channels = await optimizedChannelDataProvider.generateOptimizedChannels(1);
    const channel = { ...channels[0], id: id };
    
    const clusteringSummary = optimizedChannelDataProvider.getClusteringSummary(channel);
    
    let responseData;
    
    if (level === 'all') {
      responseData = clusteringSummary;
    } else {
      responseData = clusteringSummary[level] || null;
      if (!responseData) {
        return res.status(400).json({
          success: false,
          error: `Invalid clustering level: ${level}. Valid levels: gps, city, province, country, region, global`
        });
      }
    }
    
    res.json({
      success: true,
      channelId: id,
      level: level,
      clustering: responseData
    });
    
  } catch (error) {
    console.error(`❌ Error getting clustering for channel ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/optimized-channels/demo
 * Get demo data that matches the clustering demonstration
 */
router.get('/demo', async (req, res) => {
  try {
    console.log('🎯 Generating clustering demo data...');
    
    // Create the same demo data from our clustering demonstration
    const demoCandidates = [
      {
        id: 'demo_candidate_1',
        name: 'Alex Johnson',
        city: 'Los Angeles',
        province: 'California',
        state: 'California',
        country: 'United States',
        countryCode: 'US',
        continent: 'North America',
        region: 'Americas',
        location: { lat: 34.0522, lng: -118.2437 },
        votes: 1250,
        clusterKeys: {
          gps: '34.052200_-118.243700',
          city: 'Los Angeles',
          province: 'California',
          country: 'United States',
          region: 'Americas',
          global: 'GLOBAL'
        },
        voteComponents: { testVotes: 0, realVotes: 1250, bonusVotes: 0 },
        generationMetadata: { hierarchyComplete: true, noUnknowns: true }
      },
      {
        id: 'demo_candidate_2',
        name: 'Sarah Chen',
        city: 'San Francisco',
        province: 'California',
        state: 'California',
        country: 'United States',
        countryCode: 'US',
        continent: 'North America',
        region: 'Americas',
        location: { lat: 37.7749, lng: -122.4194 },
        votes: 980,
        clusterKeys: {
          gps: '37.774900_-122.419400',
          city: 'San Francisco',
          province: 'California',
          country: 'United States',
          region: 'Americas',
          global: 'GLOBAL'
        },
        voteComponents: { testVotes: 0, realVotes: 980, bonusVotes: 0 },
        generationMetadata: { hierarchyComplete: true, noUnknowns: true }
      },
      {
        id: 'demo_candidate_3',
        name: 'Maria Rodriguez',
        city: 'Munich',
        province: 'Bavaria',
        state: 'Bavaria',
        country: 'Germany',
        countryCode: 'DE',
        continent: 'Europe',
        region: 'Europe',
        location: { lat: 48.1351, lng: 11.5820 },
        votes: 750,
        clusterKeys: {
          gps: '48.135100_11.582000',
          city: 'Munich',
          province: 'Bavaria',
          country: 'Germany',
          region: 'Europe',
          global: 'GLOBAL'
        },
        voteComponents: { testVotes: 0, realVotes: 750, bonusVotes: 0 },
        generationMetadata: { hierarchyComplete: true, noUnknowns: true }
      },
      {
        id: 'demo_candidate_4',
        name: 'Li Wei',
        city: 'Beijing',
        province: 'Beijing',
        state: 'Beijing',
        country: 'China',
        countryCode: 'CN',
        continent: 'Asia',
        region: 'Asia',
        location: { lat: 39.9042, lng: 116.4074 },
        votes: 1890,
        clusterKeys: {
          gps: '39.904200_116.407400',
          city: 'Beijing',
          province: 'Beijing',
          country: 'China',
          region: 'Asia',
          global: 'GLOBAL'
        },
        voteComponents: { testVotes: 0, realVotes: 1890, bonusVotes: 0 },
        generationMetadata: { hierarchyComplete: true, noUnknowns: true }
      },
      {
        id: 'demo_candidate_5',
        name: 'Carlos Silva',
        city: 'São Paulo',
        province: 'São Paulo',
        state: 'São Paulo',
        country: 'Brazil',
        countryCode: 'BR',
        continent: 'South America',
        region: 'Americas',
        location: { lat: -23.5505, lng: -46.6333 },
        votes: 1120,
        clusterKeys: {
          gps: '-23.550500_-46.633300',
          city: 'São Paulo',
          province: 'São Paulo',
          country: 'Brazil',
          region: 'Americas',
          global: 'GLOBAL'
        },
        voteComponents: { testVotes: 0, realVotes: 1120, bonusVotes: 0 },
        generationMetadata: { hierarchyComplete: true, noUnknowns: true }
      }
    ];

    const demoChannel = {
      id: 'demo_channel_optimized_clustering',
      name: 'Global Democracy Clustering Demo',
      type: 'optimized-demo',
      description: 'Demonstrates perfect clustering across all 6 levels with vote reconciliation',
      
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        address: 'Los Angeles, California, United States'
      },
      
      primary_region: 'Global',
      countryCode: 'GLOBAL',
      
      candidates: demoCandidates,
      totalVotes: demoCandidates.reduce((sum, c) => sum + c.votes, 0),
      candidateCount: demoCandidates.length,
      
      reconciliation: {
        reconciliationId: 'demo_reconciliation_perfect',
        totalVotes: demoCandidates.reduce((sum, c) => sum + c.votes, 0),
        reconciliationTime: 0,
        integrity: 'PERFECT'
      },
      
      productionMetadata: {
        generatedAt: new Date().toISOString(),
        provider: 'OptimizedChannelDataProvider',
        clusteringOptimized: true,
        frontendReady: true,
        isDemoData: true
      }
    };

    // Validate demo channel
    optimizedChannelDataProvider.validateChannelForFrontend(demoChannel);
    
    // Get clustering summary
    const clusteringSummary = optimizedChannelDataProvider.getClusteringSummary(demoChannel);
    
    const response = {
      success: true,
      channel: demoChannel,
      clustering: clusteringSummary,
      demoInfo: {
        description: 'This demo shows perfect clustering with vote conservation',
        clusteringLevels: ['gps', 'city', 'province', 'country', 'region', 'global'],
        totalVotes: demoChannel.totalVotes,
        voteConservation: 'PERFECT - same vote count across all levels',
        noUnknowns: 'All candidates have complete geographical hierarchy'
      }
    };
    
    console.log('✅ Demo data generated successfully');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/optimized-channels/stats
 * Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Generate a small set for stats
    const sampleChannels = await optimizedChannelDataProvider.generateOptimizedChannels(3);
    
    const stats = {
      success: true,
      systemStatus: 'OPERATIONAL',
      features: {
        perfectClustering: true,
        voteReconciliation: true,
        noUnknownValues: true,
        frontendReady: true,
        clusteringLevels: 6
      },
      sampleData: {
        channels: sampleChannels.length,
        totalCandidates: sampleChannels.reduce((sum, ch) => sum + ch.candidateCount, 0),
        totalVotes: sampleChannels.reduce((sum, ch) => sum + ch.totalVotes, 0),
        averageCandidatesPerChannel: sampleChannels.reduce((sum, ch) => sum + ch.candidateCount, 0) / sampleChannels.length,
        regionsRepresented: [...new Set(sampleChannels.flatMap(ch => ch.candidates.map(c => c.region)))].length
      },
      clusteringLevels: {
        gps: 'Individual GPS positioning',
        city: 'City-level clustering', 
        province: 'Province/State-level clustering',
        country: 'Country-level clustering',
        region: 'UN Region-level clustering (5 regions)',
        global: 'Global-level clustering'
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;