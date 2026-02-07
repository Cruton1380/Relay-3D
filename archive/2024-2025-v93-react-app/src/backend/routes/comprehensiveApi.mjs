/**
 * RELAY NETWORK - COMPREHENSIVE API ROUTES
 * Main API routes for reliability, filtering, and ranking services
 */

const express = require('express');
const router = express.Router();

// Import services
const ReliabilityScoreService = require('../reliability-service/reliabilityScoreService.mjs');
const ComprehensiveFilterService = require('../filter-service/comprehensiveFilterService.mjs');
const TwoLevelRankingService = require('../ranking-service/twoLevelRankingService.mjs');

// Initialize services
const reliabilityService = new ReliabilityScoreService();
const filterService = new ComprehensiveFilterService();
const rankingService = new TwoLevelRankingService();

// ============================================================================
// RELIABILITY SCORING ROUTES
// ============================================================================

/**
 * GET /api/reliability/topic/:topicId
 * Get reliability data for a specific topic
 */
router.get('/reliability/topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const reliabilityData = await reliabilityService.calculateTopicReliability(topicId);
    
    res.json({
      success: true,
      data: reliabilityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reliability/rate
 * Submit reliability rating for candidate or topic
 */
router.post('/reliability/rate', async (req, res) => {
  try {
    const { voterId, topicId, targetId, reliabilityScore, targetType } = req.body;
    
    // Validate required fields
    if (!voterId || !topicId || !reliabilityScore || !targetType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const rating = await reliabilityService.submitReliabilityRating(
      voterId, 
      topicId, 
      targetId, 
      reliabilityScore, 
      targetType
    );
    
    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// FILTERING ROUTES
// ============================================================================

/**
 * POST /api/filter/global
 * Apply global filters across entire network
 */
router.post('/filter/global', async (req, res) => {
  try {
    const filterRequest = req.body;
    const results = await filterService.applyGlobalFilters(filterRequest);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/filter/channel/:channelId
 * Apply filters to specific channel
 */
router.post('/filter/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const filters = req.body;
    
    const results = await filterService.applyChannelFilters(channelId, filters);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/filter/statistics
 * Get filter statistics for UI display
 */
router.post('/filter/statistics', async (req, res) => {
  try {
    const filterRequest = req.body;
    const statistics = await filterService.getFilterStatistics(filterRequest);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// RANKING ROUTES
// ============================================================================

/**
 * GET /api/rankings/channels
 * Get channels ranked top-to-bottom by activity
 */
router.get('/rankings/channels', async (req, res) => {
  try {
    const filterCriteria = req.query;
    const channelRankings = await rankingService.getChannelRankings(filterCriteria);
    
    res.json({
      success: true,
      data: channelRankings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/rankings/topics/:channelId
 * Get topic rankings for specific channel
 */
router.get('/rankings/topics/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const topicRankings = await rankingService.getTopicRankingsForChannel(channelId);
    
    res.json({
      success: true,
      data: topicRankings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/rankings/mobile
 * Get mobile-optimized channel display
 */
router.get('/rankings/mobile', async (req, res) => {
  try {
    const { userLocation, ...filterCriteria } = req.query;
    const mobileDisplay = await rankingService.getMobileChannelDisplay(userLocation, filterCriteria);
    
    res.json({
      success: true,
      data: mobileDisplay
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rankings/vote
 * Process vote and update rankings
 */
router.post('/rankings/vote', async (req, res) => {
  try {
    const voteData = req.body;
    
    // Validate required fields
    if (!voteData.voterId || !voteData.topicId || !voteData.candidateId || !voteData.channelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required vote data fields'
      });
    }
    
    const result = await rankingService.processVoteAndUpdateRankings(voteData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SEARCH ROUTES
// ============================================================================

/**
 * GET /api/search
 * Global search with text and filters
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, ...filters } = req.query;
    
    const searchRequest = {
      textSearch: searchTerm,
      ...filters
    };
    
    const results = await filterService.applyGlobalFilters(searchRequest);
    
    res.json({
      success: true,
      data: results,
      searchTerm: searchTerm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// REAL-TIME UPDATES
// ============================================================================

/**
 * GET /api/realtime/rankings/:topicId
 * Get real-time ranking updates for topic
 */
router.get('/realtime/rankings/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Set up Server-Sent Events for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial data
    const initialRankings = await rankingService.getCandidateRankings(topicId);
    res.write(`data: ${JSON.stringify(initialRankings)}\n\n`);
    
    // Listen for ranking updates
    const eventHandler = (data) => {
      if (data.topicId === topicId) {
        res.write(`data: ${JSON.stringify(data.rankings)}\n\n`);
      }
    };
    
    require('../event-bus/eventBus').on('rankings:candidates:updated', eventHandler);
    
    // Clean up on client disconnect
    req.on('close', () => {
      require('../event-bus/eventBus').off('rankings:candidates:updated', eventHandler);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Relay Network API is running',
    timestamp: new Date().toISOString(),
    services: {
      reliability: 'operational',
      filtering: 'operational',
      ranking: 'operational'
    }
  });
});

module.exports = router;
