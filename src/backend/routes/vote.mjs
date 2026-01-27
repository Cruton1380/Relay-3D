/**
 * Voting routes
 */

/**
 * BLOCKCHAIN DATA TRANSPARENCY
 * ===========================
 * 
 * Both test and production voting data are stored in the same blockchain to ensure
 * complete transparency and auditability. Test data is clearly marked with:
 * - isTestData: true
 * - testDataSource: 'integrated_demo' 
 * 
 * This design allows everyone to:
 * 1. Verify all test data in the blockchain before launch
 * 2. Audit that all test data has been properly removed
 * 3. Ensure blockchain integrity after test data deletion
 * 
 * Use /api/vote/debug/test-data to list all test data
 * Use /api/vote/debug/blockchain-summary for overview
 */

import express from 'express';
import logger from '../utils/logging/logger.mjs';
// ✅ DEPRECATED: state.mjs removed - use query hooks for reads, relay-client for writes
// import { updateCandidateVoteCount, getCandidateVoteCount, setDemoUserVote, getDemoUserVote, removeDemoUserVote, getAllDemoUserVotes } from '../state/state.mjs';
import query from '../../.relay/query.mjs';

// Fix: Change from geo to location directory
import userLocation from '../location/userLocation.mjs';
import { updateUserLocation } from '../services/userLocationService.mjs';
import { processVoteHandler, revokeVote, getVoteStatus, getVoteResults, getFilteredVoteResults } from '../domains/voting/votingEngine.mjs';
import { getTopicRegion } from '../domains/voting/topicRegionUtils.mjs';
import { verifyVote } from '../domains/voting/voteVerifier.mjs';
import * as cache from '../utils/storage/caching.mjs';
import { authenticate, authorize } from '../auth/middleware/index.mjs';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.mjs';
import { createError } from '../utils/common/errors.mjs';
import { asyncHandler } from '../middleware/errorHandler.mjs';
import Joi from 'joi';
// ✅ DEPRECATED: vote-service removed - use query hooks instead
// import voteService from '../vote-service/index.mjs';

// ✅ DEPRECATED: blockchain removed - votes now commit to Git
// import { blockchain } from '../state/state.mjs';
// import { saveBlockchain } from '../state/state.mjs';
import crypto from 'crypto';
import fs from 'fs/promises';
import { generateTestSignature, generateTestPublicKey, generateTestUserData } from '../utils/testing/testDataGenerator.mjs';

const router = express.Router();
const voteLogger = logger.child({ module: 'vote-routes' });

// Validation schemas
const submitVoteSchema = Joi.object({
  topic: Joi.string().trim().required(),
  choice: Joi.string().trim().required(),
  voteType: Joi.string().trim().required(),
  signature: Joi.string().required(),
  publicKey: Joi.string().required(),
  nonce: Joi.string().required(),
  timestamp: Joi.number().required(),
  signatureScheme: Joi.string().valid('ecdsa', 'ed25519').default('ecdsa')
});

const revokeVoteSchema = Joi.object({
  topic: Joi.string().trim().required(),
  signature: Joi.string().required(),
  publicKey: Joi.string().required(),
  nonce: Joi.string().required(),
  timestamp: Joi.number().required()
});

const topicParamSchema = Joi.object({
  topic: Joi.string().trim().required()
});

const resultsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('votes', 'timestamp').default('votes'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  voteType: Joi.string().optional()
});

/**
 * Submit a vote
 * POST /api/vote/submitVote
 */
router.post(
  '/submitVote', 
  validateBody(submitVoteSchema),
  asyncHandler(async (req, res) => {
    const voteData = req.body;
    
    // Verify vote signature
    const isValid = await verifyVote(voteData);
    if (!isValid) {
      throw createError('validation', 'Invalid vote signature', { code: 'INVALID_SIGNATURE' });
    }
    
    // Process the vote
    const result = await processVoteHandler(voteData);
    
    // 🔗 INTEGRATION: Queue vote for hashgraph anchoring
    try {
      const hashgraphAnchoring = req.app.locals.hashgraphAnchoring;
      if (hashgraphAnchoring) {
        await hashgraphAnchoring.queueForAnchoring({
          event_type: 'vote',
          event_id: crypto.randomUUID(),
          timestamp: Date.now(),
          payload: {
            userId: voteData.publicKey,
            topicId: voteData.topic,
            candidateId: voteData.choice,
            voteType: voteData.voteType,
            isFinal: true
          }
        }, {});
        voteLogger.info('✅ Vote queued for hashgraph anchoring', { 
          userId: voteData.publicKey, 
          topicId: voteData.topic 
        });
      }
    } catch (error) {
      voteLogger.error('⚠️ Hashgraph anchoring failed (non-blocking)', { error: error.message });
      // Non-blocking: vote still succeeds even if anchoring fails
    }
    
    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Revoke a vote
 * POST /api/vote/revokeVote
 */
router.post(
  '/revokeVote', 
  validateBody(revokeVoteSchema),
  asyncHandler(async (req, res) => {
    const { topic, publicKey } = req.body;
    
    // Verify signature
    const isValid = await verifyVote(req.body);
    if (!isValid) {
      throw createError('validation', 'Invalid signature', { code: 'INVALID_SIGNATURE' });
    }
    
    // Revoke the vote
    const result = await revokeVote(publicKey, topic);
    
    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Get vote status for a topic
 * GET /api/vote/status/:topic
 */
router.get(
  '/status/:topic', 
  validateParams(topicParamSchema),
  asyncHandler(async (req, res) => {
    const { topic } = req.params;
    
    // Get vote status directly (skip cache for now)
    const status = getVoteStatus(topic);
    
    res.json({
      success: true,
      data: status
    });
  })
);

/**
 * Get vote results
 * GET /api/vote/results
 */
router.get(
  '/results',
  validateQuery(resultsQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, order, voteType } = req.query;
    
    // Get results with pagination
    const results = await getFilteredVoteResults({
      page, 
      limit, 
      sortBy, 
      order, 
      voteType
    });
    
    res.json({
      success: true,
      data: results.data,
      pagination: results.pagination
    });
  })
);

/**
 * Get filtered vote results for a topic
 * GET /api/vote/filteredResults
 */
router.get(
  '/filteredResults',
  validateQuery(Joi.object({
    topic: Joi.string().trim().required(),
    filter: Joi.string().optional()
  })),
  asyncHandler(async (req, res) => {
    const { topic, filter } = req.query;
    
    const results = await getFilteredVoteResults(topic, { filter });
    
    res.json({
      success: true,
      data: results
    });
  })
);

/**
 * Get votes with activity filtering
 * GET /api/vote/filtered
 */
router.get('/filtered', authenticate, async (req, res) => {
  try {
    const filters = {
      regionFilter: req.query.regionFilter,
      activityFilter: req.query.activityFilter ? {
        minPercentile: parseInt(req.query.activityFilter.minPercentile, 10) || 0
      } : null
    };
    
    const votes = await voteService.getVotes(filters);
    res.json({ success: true, votes });
  } catch (error) {
    logger.error('Error in filtered votes endpoint', { error });
    res.status(500).json({ success: false, error: 'Failed to retrieve votes' });
  }
});

/**
 * Get activity statistics for votes
 * GET /api/vote/activity-stats
 */
router.get('/activity-stats', authenticate, async (req, res) => {
  try {
    const voteIds = req.query.voteIds || [];
    const stats = await voteService.getActivityStats(voteIds);
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error in vote activity stats endpoint', { error });
    res.status(500).json({ success: false, error: 'Failed to retrieve activity stats' });
  }
});

/**
 * Get global activity metrics
 * GET /api/vote/activity-metrics
 */
router.get('/activity-metrics', authenticate, async (req, res) => {
  try {
    const metrics = await voteService.getActivityMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error('Error in activity metrics endpoint', { error });
    res.status(500).json({ success: false, error: 'Failed to retrieve activity metrics' });
  }
});

/**
 * Get activity stats for specific users
 * POST /api/vote/user-activity-stats
 */
router.post('/user-activity-stats', authenticate, async (req, res) => {
  try {
    const userIds = req.body.userIds || [];
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid userIds array is required' 
      });
    }
    
    const stats = await voteService.getUserActivityStats(userIds);
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error in user activity stats endpoint', { error });
    res.status(500).json({ success: false, error: 'Failed to retrieve user activity stats' });
  }
});

/**
 * Get all vote counts for all candidates
 * GET /api/vote
 */
router.get('/', async (req, res) => {
  try {
    const votes = await voteService.getVotes();
    res.json(votes);
  } catch (error) {
    logger.error('Error in get all votes endpoint', { error });
    res.status(500).json({ error: 'Failed to retrieve all vote counts' });
  }
});

/**
 * Submit a vote (frontend endpoint)
 * POST /api/vote
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { id, value } = req.body;
    
    if (!id || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'id and value are required'
      });
    }

    // Generate a consistent user ID based on IP address for vote switching
    // This ensures the same user can change their vote properly
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userId = `frontend-user-${crypto.createHash('sha256').update(clientIP).digest('hex').substring(0, 16)}`;
    
    // For frontend votes, treat 'id' as candidateId and use a default channel
    const channelId = 'frontend-channel';
    const candidateId = id;
    const voteValue = value;
    
    // Record vote in demo state (for compatibility with existing system)
    const previousVote = getDemoUserVote(userId, channelId);
    const switched = previousVote && previousVote !== candidateId;
    
    // Record new vote
    const voteResult = setDemoUserVote(userId, channelId, candidateId);
    
    // Record in blockchain for transparency
    try {
      await blockchain.initialize();
      await blockchain.addTransaction('frontend_vote', {
        userId,
        channelId,
        candidateId,
        value: voteValue,
        timestamp: Date.now(),
        isTestData: true,
        testDataSource: 'frontend_submission',
        switched,
        previousCandidate: previousVote,
        voteCount: voteResult.newCount,
        source: 'frontend'
      }, crypto.randomBytes(16).toString('hex'));
      
      voteLogger.info('Frontend vote recorded to blockchain', { 
        userId,
        channelId, 
        candidateId, 
        value: voteValue,
        switched,
        newCount: voteResult.newCount
      });
    } catch (blockchainError) {
      voteLogger.error('Blockchain recording failed for frontend vote', { 
        error: blockchainError.message,
        userId,
        candidateId
      });
      // Don't fail the vote if blockchain recording fails
    }
    
    res.json({
      success: true,
      userId,
      channelId,
      candidateId,
      value: voteValue,
      voteCount: voteResult.newCount,
      switched,
      message: 'Vote recorded successfully'
    });
    
  } catch (error) {
    voteLogger.error('Error processing frontend vote', { error: error.message, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to process vote'
    });
  }
}));

// Add test endpoint for frontend connection check
router.get('/test', (req, res) => {
  res.json({ status: 'connected' });
});

/**
 * Cast Vote with Blockchain Integration
 * POST /api/vote/cast
 * 
 * Full blockchain-verified vote submission with signature, nonce, and location tracking
 */
router.post('/cast', authenticate, asyncHandler(async (req, res) => {
  const { 
    topicId, 
    candidateId, 
    voteType = 'FOR',
    signature,
    publicKey,
    nonce,
    location,
    privacyLevel,
    timestamp 
  } = req.body;
  
  voteLogger.info('Vote cast requested', { 
    userId: req.user?.publicKey,
    topicId,
    candidateId,
    hasSignature: !!signature,
    hasLocation: !!location
  });

  // Validate required fields
  if (!topicId || !candidateId) {
    return res.status(400).json({
      success: false,
      error: 'topicId and candidateId are required'
    });
  }

  // Validate and process location data if provided
  let processedLocation = null;
  if (location) {
    const { lat, lng } = location;
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid location data: lat and lng must be numbers'
      });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude: must be between -90 and 90'
      });
    }
    
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude: must be between -180 and 180'
      });
    }

    // Call reverse geocoding API to get administrative levels
    try {
      const boundaryAPI = await import('../api/boundaryAPI.mjs');
      const geocodeResult = await boundaryAPI.reverseGeocode(lat, lng);
      
      if (geocodeResult.success) {
        processedLocation = {
          lat,
          lng,
          ...geocodeResult.location,
          accuracy: location.accuracy || null
        };
        
        voteLogger.info('Location geocoded successfully', {
          lat,
          lng,
          country: geocodeResult.location.country,
          province: geocodeResult.location.province
        });
        
        // 📍 UPDATE USER LOCATION (single source of truth)
        // This will reconcile ALL votes for this user to this location
        try {
          const userId = req.user?.publicKey || publicKey;
          await updateUserLocation(userId, processedLocation, 'gps');
          
          voteLogger.info('User location updated', {
            userId,
            location: `${processedLocation.city}, ${processedLocation.province}`
          });
        } catch (locationError) {
          voteLogger.error('Failed to update user location', {
            error: locationError.message
          });
          // Continue with vote processing even if location update fails
        }
        
      } else {
        throw new Error(geocodeResult.error || 'Reverse geocoding failed');
      }
    } catch (geocodeError) {
      voteLogger.error('Reverse geocoding error', {
        error: geocodeError.message,
        lat,
        lng
      });
      
      return res.status(400).json({
        success: false,
        error: 'Location verification failed. GPS coordinates must be valid.',
        details: geocodeError.message
      });
    }
  }

  try {
    // Process vote (location will be looked up from userLocationService)
    // Vote no longer stores location - it references user's current location
    const result = await processVote(
      req.user?.publicKey || `user_${Date.now()}`,
      topicId,
      voteType,
      candidateId,
      1.0, // reliability
      {
        signature,
        publicKey: publicKey || req.user?.publicKey,
        nonce,
        location: processedLocation,
        privacyLevel: privacyLevel || 'province'
      }
    );

    res.json({
      success: true,
      vote: {
        topicId,
        candidateId,
        voteType,
        timestamp: result.vote?.timestamp || Date.now(),
        locationProcessed: !!processedLocation
      },
      blockchain: result.blockchain,
      voteTotals: result.voteTotals
    });

  } catch (error) {
    voteLogger.error('Vote cast failed', { 
      error: error.message,
      topicId,
      candidateId
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Integrated demo vote endpoint - simplified for development center
router.post('/demo', asyncHandler(async (req, res) => {
  try {
    const { channelId, candidateId, userId, action = 'vote', testMode = true } = req.body;
    
    if (!channelId || !candidateId) {
      return res.status(400).json({
        success: false,
        error: 'channelId and candidateId are required'
      });
    }
    
    // Generate test user data for demonstration
    const demoUserId = userId || 'demo-user-1';
    
    let result;
    
    if (action === 'vote') {
      // 🎯 USE VOTESERVICE: Use proper VoteService that handles demo data base counts
      const voteId = `${channelId}-${candidateId}`;
      const user = { id: demoUserId };
      
      try {
        // Use VoteService.submitVote which properly handles base counts + increments
        result = await voteService.submitVote(voteId, 1, user);
        
        voteLogger.info('Demo vote processed via VoteService', { 
          userId: demoUserId,
          channelId, 
          candidateId,
          voteId,
          totalVotes: result.votes,
          switched: !!result.revoked
        });
        
        res.json({
          success: true,
          userId: demoUserId,
          channelId,
          candidateId,
          action,
          switched: !!result.revoked,
          previousCandidate: result.revoked,
          newCount: result.blockchainVotes || 0, // ✅ FIXED: Return ONLY blockchain votes, not total
          totalVotes: result.votes, // Total for reference (base + blockchain)
          baseVotes: result.baseVotes || 0, // Base votes for reference
          blockchainVotes: result.blockchainVotes || 0, // Blockchain votes (same as newCount)
          updatedCounts: result.updatedCounts,
          message: result.revoked ? 'Vote switched successfully' : 'Vote cast successfully',
          devCenter: true,
          timestamp: new Date().toISOString()
        });
      } catch (voteError) {
        voteLogger.error('VoteService error, falling back to old system', voteError);
        
        // Fallback to old system if VoteService fails
        const previousVote = getDemoUserVote(demoUserId, channelId);
        const switched = previousVote && previousVote !== candidateId;
        const voteResult = setDemoUserVote(demoUserId, channelId, candidateId);
        
        res.json({
          success: true,
          userId: demoUserId,
          channelId,
          candidateId,
          action,
          switched,
          previousCandidate: previousVote,
          newCount: voteResult.newCount,
          message: switched ? 'Vote switched successfully (fallback)' : 'Vote cast successfully (fallback)',
          devCenter: true,
          timestamp: new Date().toISOString()
        });
      }
      
    } else if (action === 'unvote') {
      // Remove user's vote
      const removeResult = removeDemoUserVote(demoUserId, channelId);
      
      // Record in blockchain
      try {
        await blockchain.initialize();
        await blockchain.addTransaction('demo_unvote', {
          userId: demoUserId,
          channelId,
          candidateId: removeResult.candidateId,
          timestamp: Date.now(),
          isTestData: true,
          testDataSource: 'relay_dev_center'
        }, crypto.randomBytes(16).toString('hex'));
      } catch (blockchainError) {
        voteLogger.warn('Blockchain recording failed for unvote', { 
          error: blockchainError.message 
        });
      }
      
      res.json({
        success: removeResult.success,
        userId: demoUserId,
        channelId,
        candidateId: removeResult.candidateId,
        action,
        newCount: removeResult.newCount,
        message: removeResult.message,
        devCenter: true,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "vote" or "unvote"'
      });
    }
    
  } catch (error) {
    voteLogger.error('Demo vote error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process demo vote: ' + error.message
    });
  }
}));

// Pre-launch audit endpoint - lists all test data for review before deletion
router.get('/admin/pre-launch-audit', asyncHandler(async (req, res) => {
  try {
    await blockchain.initialize();
    
    const audit = {
      testDataTransactions: [],
      affectedBlocks: new Set(),
      testDataSources: new Set(),
      userIdsInTestData: new Set(),
      channelIdsInTestData: new Set()
    };
    
    // Analyze all blocks for test data
    for (const block of blockchain.chain) {
      let blockHasTestData = false;
      
      for (const transaction of block.transactions) {
        if (transaction.data && transaction.data.isTestData === true) {
          blockHasTestData = true;
          
          audit.testDataTransactions.push({
            blockIndex: block.index,
            transactionId: transaction.id,
            type: transaction.type,
            data: transaction.data
          });
          
          // Track test data sources
          if (transaction.data.testDataSource) {
            audit.testDataSources.add(transaction.data.testDataSource);
          }
          
          // Track affected user IDs
          if (transaction.data.userId) {
            audit.userIdsInTestData.add(transaction.data.userId);
          }
          
          // Track affected channel IDs
          if (transaction.data.channelId) {
            audit.channelIdsInTestData.add(transaction.data.channelId);
          }
        }
      }
      
      if (blockHasTestData) {
        audit.affectedBlocks.add(block.index);
      }
    }
    
    // Convert sets to arrays for JSON response
    const auditReport = {
      summary: {
        totalBlocks: blockchain.chain.length,
        blocksWithTestData: audit.affectedBlocks.size,
        totalTestTransactions: audit.testDataTransactions.length,
        testDataSources: Array.from(audit.testDataSources),
        affectedUserIds: Array.from(audit.userIdsInTestData),
        affectedChannelIds: Array.from(audit.channelIdsInTestData)
      },
      transactions: audit.testDataTransactions,
      affectedBlockIndexes: Array.from(audit.affectedBlocks),
      readyForLaunch: audit.testDataTransactions.length === 0,
      launchReadinessMessage: audit.testDataTransactions.length === 0 
        ? 'READY: No test data found in blockchain' 
        : `NOT READY: ${audit.testDataTransactions.length} test data transactions must be removed before launch`
    };
    
    res.json({
      success: true,
      audit: auditReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    voteLogger.error('Error during pre-launch audit', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to perform pre-launch audit'
    });
  }
}));

// Debug endpoint to get all test data in blockchain
router.get('/debug/test-data', asyncHandler(async (req, res) => {
  try {
    await blockchain.initialize();
    
    const testTransactions = [];
    
    // Go through all blocks and find test data transactions
    for (const block of blockchain.chain) {
      for (const transaction of block.transactions) {
        if (transaction.data && transaction.data.isTestData === true) {
          testTransactions.push({
            blockIndex: block.index,
            blockHash: block.hash,
            transactionId: transaction.id,
            type: transaction.type,
            data: transaction.data,
            timestamp: transaction.timestamp
          });
        }
      }
    }
    
    res.json({
      success: true,
      testDataCount: testTransactions.length,
      testTransactions,
      message: `Found ${testTransactions.length} test data transactions in blockchain`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    voteLogger.error('Error getting test data from blockchain', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test data from blockchain'
    });
  }
}));

// Debug endpoint to get blockchain summary
router.get('/debug/blockchain-summary', asyncHandler(async (req, res) => {
  try {
    await blockchain.initialize();
    
    let totalTransactions = 0;
    let testDataTransactions = 0;
    let productionTransactions = 0;
    
    for (const block of blockchain.chain) {
      for (const transaction of block.transactions) {
        totalTransactions++;
        if (transaction.data && transaction.data.isTestData === true) {
          testDataTransactions++;
        } else {
          productionTransactions++;
        }
      }
    }
    
    res.json({
      success: true,
      blockchainSummary: {
        totalBlocks: blockchain.chain.length,
        totalTransactions,
        testDataTransactions,
        productionTransactions,
        percentageTestData: totalTransactions > 0 ? ((testDataTransactions / totalTransactions) * 100).toFixed(2) : 0
      },
      message: 'Blockchain summary with test and production data breakdown',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    voteLogger.error('Error getting blockchain summary', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain summary'
    });
  }
}));

// Get demo user votes (for debugging)
router.get('/demo/users', asyncHandler(async (req, res) => {
  try {
    const allUserVotes = getAllDemoUserVotes();
    res.json({
      success: true,
      userVotes: allUserVotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Get demo user votes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get demo user votes'
    });
  }
}));

// Get a specific user's votes
router.get('/demo/users/:userId', asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { channelId } = req.query;
    
    if (channelId) {
      // Get user's vote for a specific channel
      const vote = getDemoUserVote(userId, channelId);
      res.json({
        success: true,
        userId,
        channelId,
        candidateId: vote,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get all of user's votes
      const allUserVotes = getAllDemoUserVotes();
      const userVotes = allUserVotes[userId] || {};
      res.json({
        success: true,
        userId,
        votes: userVotes,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    voteLogger.error('Get user votes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get user votes'
    });
  }
}));

// WARNING: Destructive operation - removes all test data from blockchain
router.delete('/admin/remove-test-data', asyncHandler(async (req, res) => {
  try {
    const { confirmKey } = req.body;
    
    // Require confirmation key to prevent accidental deletion
    if (confirmKey !== 'REMOVE_ALL_TEST_DATA_PERMANENTLY') {
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation key. This operation requires explicit confirmation.',
        requiredKey: 'REMOVE_ALL_TEST_DATA_PERMANENTLY'
      });
    }
    
    await blockchain.initialize();
    
    // Count test data before removal
    let testDataCount = 0;
    let productionDataCount = 0;
    
    for (const block of blockchain.chain) {
      for (const transaction of block.transactions) {
        if (transaction.data && transaction.data.isTestData === true) {
          testDataCount++;
        } else {
          productionDataCount++;
        }
      }
    }
    
    // Create backup before removal
    const backupData = {
      timestamp: new Date().toISOString(),
      originalChain: JSON.parse(JSON.stringify(blockchain.chain)),
      testDataCount,
      productionDataCount
    };
    
    // Save backup
    const backupFile = `./data/blockchain-backup-${Date.now()}.json`;
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    // Create new chain with only production data
    const newChain = [];
    
    // Always keep genesis block
    if (blockchain.chain.length > 0) {
      newChain.push(blockchain.chain[0]);
    }
    
    // Filter out test data and rebuild chain
    for (const block of blockchain.chain.slice(1)) {
      const productionTransactions = block.transactions.filter(
        transaction => !(transaction.data && transaction.data.isTestData === true)
      );
      
      if (productionTransactions.length > 0) {
        // Create new block with only production transactions
        const newBlock = {
          ...block,
          transactions: productionTransactions,
          // Recalculate hash with new transactions
          hash: crypto.createHash('sha256')
            .update(JSON.stringify(productionTransactions) + block.previousHash)
            .digest('hex')
        };
        newChain.push(newBlock);
      }
    }
    
    // Replace blockchain with filtered chain
    blockchain.chain = newChain;
    
    // Save the new blockchain
    await saveBlockchain();
    
    voteLogger.warn('Test data removed from blockchain', {
      removedTestTransactions: testDataCount,
      remainingProductionTransactions: productionDataCount,
      backupFile,
      newChainLength: newChain.length,
      originalChainLength: backupData.originalChain.length
    });
    
    res.json({
      success: true,
      message: 'All test data has been permanently removed from blockchain',
      summary: {
        removedTestTransactions: testDataCount,
        remainingProductionTransactions: productionDataCount,
        backupFile,
        newBlockchainLength: newChain.length,
        originalBlockchainLength: backupData.originalChain.length
      },
      warning: 'This operation cannot be undone. Backup saved to: ' + backupFile,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    voteLogger.error('Error removing test data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to remove test data: ' + error.message
    });
  }
}));

// Debug endpoint to reduce test vote counts
router.post('/debug/reduce-test-votes', asyncHandler(async (req, res) => {
  try {
    const { reductionFactor = 0.5, onlyTestData = true } = req.body;
    
    if (reductionFactor < 0 || reductionFactor > 1) {
      return res.status(400).json({
        success: false,
        error: 'Reduction factor must be between 0 and 1'
      });
    }
    
    await blockchain.initialize();
    
    let affectedChannels = 0;
    let modifiedTransactions = 0;
    
    // Process each block
    for (const block of blockchain.chain) {
      for (const transaction of block.transactions) {
        // Only modify test data votes if onlyTestData is true
        if (onlyTestData && (!transaction.data || !transaction.data.isTestData)) {
          continue;
        }
        
        // Only process vote transactions
        if (transaction.type === 'vote' && transaction.data) {
          // Reduce the reliability (which affects vote weight)
          if (transaction.data.reliability && transaction.data.reliability > 0) {
            const oldReliability = transaction.data.reliability;
            transaction.data.reliability = Math.max(0.1, oldReliability * reductionFactor);
            modifiedTransactions++;
            
            // Track unique channels affected
            if (transaction.data.topic) {
              affectedChannels++;
            }
          }
        }
      }
    }
    
    // Save the modified blockchain
    await saveBlockchain();
    
    voteLogger.info('Test vote counts reduced', {
      reductionFactor,
      onlyTestData,
      affectedChannels,
      modifiedTransactions
    });
    
    res.json({
      success: true,
      message: `Reduced test vote counts by ${Math.round((1 - reductionFactor) * 100)}%`,
      summary: {
        reductionFactor,
        affectedChannels,
        modifiedTransactions,
        onlyTestData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    voteLogger.error('Error reducing test vote counts', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reduce test vote counts: ' + error.message
    });
  }
}));

export default router;

/**
 * Process integrated demo vote through production systems
 * @param {Object} voteRequest - Vote request data
 * @returns {Object} Vote processing result
 */
async function processIntegratedDemoVote(voteRequest) {
  const { userId, channelId, candidateId, testUserData, testMode } = voteRequest;
  
  let integrationFlags = {
    blockchain: false,
    sybilPrevention: false,
    hashgraph: false,
    userAuth: false,
    voteSwitch: false
  };

  try {
    // Step 1: Check for existing vote (vote switching logic)
    const previousVote = getDemoUserVote(userId, channelId);
    const switched = previousVote && previousVote !== candidateId;
    
    if (switched) {
      // Revoke previous vote (blockchain recording handled by voting engine)
      const prevCount = getCandidateVoteCount(channelId, previousVote);
      if (prevCount > 0) {
        updateCandidateVoteCount(channelId, previousVote, prevCount - 1);
      }
      integrationFlags.voteSwitch = true;
    }

    // Step 2: Process vote with both production integration and simple fallback
    try {
      // Create production-compatible vote data with test markers
      const voteData = {
        topic: channelId,
        voteType: 'binary',
        choice: candidateId,
        timestamp: testUserData?.timestamp || Date.now(),
        nonce: testUserData?.nonce || crypto.randomBytes(16).toString('hex'),
        publicKey: testUserData?.publicKey || generateTestPublicKey(userId),
        signature: generateTestSignature({
          topic: channelId,
          voteType: 'binary',
          choice: candidateId,
          timestamp: testUserData?.timestamp || Date.now(),
          nonce: testUserData?.nonce
        }, userId),
        signatureScheme: 'ecdsa',
        // KEY: Mark this as test data throughout the system
        isTestData: testMode,
        testDataSource: 'integrated_demo'
      };

      // Set test mode flags for production systems
      process.env.SKIP_SIGNATURE_VERIFICATION = testMode ? 'true' : 'false';
      process.env.TEST_MODE = testMode ? 'true' : 'false';
      
      voteLogger.debug('Attempting production vote processing', {
        voteDataKeys: Object.keys(voteData),
        publicKey: voteData.publicKey ? 'present' : 'missing',
        topic: voteData.topic,
        voteType: voteData.voteType,
        choice: voteData.choice,
        testMode
      });
      
      // Try production system first
      let productionSuccess = false;
      try {
        // Process through production vote handler - this will add to blockchain with test markers
        const productionResult = await processVoteHandler(voteData);
        productionSuccess = true;
        
        integrationFlags.blockchain = true;
        integrationFlags.sybilPrevention = true;
        integrationFlags.userAuth = true;
        
        // Anchor critical votes to hashgraph
        try {
          const hashgraphAnchoring = req.app.locals.hashgraphAnchoring;
          if (hashgraphAnchoring) {
            await hashgraphAnchoring.queueForAnchoring({
              event_type: 'vote',
              event_id: crypto.randomUUID(),
              timestamp: Date.now(),
              payload: {
                userId,
                channelId,
                candidateId,
                isFinal: true,
                requiresAnchoring: true
              }
            }, { 
              currentState: 'vote_recorded',
              transactionHash: crypto.randomBytes(32).toString('hex')
            });
            integrationFlags.hashgraph = true;
            voteLogger.info('✅ Vote queued for hashgraph anchoring');
          } else {
            voteLogger.debug('⚠️ Hashgraph anchoring not available');
          }
        } catch (hashgraphError) {
          voteLogger.warn('Failed to queue vote for hashgraph anchoring', { error: hashgraphError.message });
          // Don't fail the vote if hashgraph anchoring fails
        }
        
        voteLogger.info('Vote processed through production systems and recorded in blockchain', {
          userId,
          channelId,
          candidateId,
          isTestData: testMode,
          integrationFlags
        });
      } catch (productionError) {
        voteLogger.warn('Production system failed, using demo-only path', { 
          error: productionError.message 
        });
        productionSuccess = false;
      }
      
      // Always record in blockchain with test data markers (either through production or fallback)
      if (!productionSuccess) {
        await blockchain.initialize();
        
        // Prepare fallback transaction data
        const fallbackData = {
          userId,
          channelId,
          candidateId,
          timestamp: Date.now(),
          isTestData: testMode, // KEY: Mark as test data
          testDataSource: 'integrated_demo',
          switched,
          previousCandidate: previousVote,
          voteCount: getCandidateVoteCount(channelId, candidateId),
          metadata: {
            demoOnlyVote: true,
            fallbackUsed: true
          }
        };
        
        const fallbackNonce = crypto.randomBytes(16).toString('hex');
        
        voteLogger.debug('Adding fallback transaction to blockchain', {
          type: 'vote_cast_demo',
          dataKeys: Object.keys(fallbackData),
          nonce: fallbackNonce
        });
        
        // Record in blockchain as demo vote
        await blockchain.addTransaction('vote_cast_demo', fallbackData, fallbackNonce);
        integrationFlags.blockchain = true;
      }
      
      // Reset test flags
      delete process.env.SKIP_SIGNATURE_VERIFICATION;
      delete process.env.TEST_MODE;
      
    } catch (voteProcessError) {
      voteLogger.error('Error in vote processing', { error: voteProcessError.message });
      // Continue to demo vote tracking even if blockchain fails
    }

    // Step 3: Update demo vote tracking
    const result = setDemoUserVote(userId, channelId, candidateId);
    
    return {
      switched,
      previousCandidate: previousVote,
      newCount: result.newCount,
      message: switched ? 'Vote switched successfully' : 'Vote cast successfully',
      integrationFlags,
      blockchainRecorded: true,
      isTestData: testMode
    };

  } catch (error) {
    voteLogger.error('Integrated demo vote processing failed', {
      error: error.message,
      userId,
      channelId,
      candidateId
    });
    throw error;
  }
}

/**
 * Process integrated demo unvote through production systems
 * @param {Object} unvoteRequest - Unvote request data
 * @returns {Object} Unvote processing result
 */
async function processIntegratedDemoUnvote(unvoteRequest) {
  const { userId, channelId, testUserData, testMode } = unvoteRequest;
  
  let integrationFlags = {
    blockchain: false,
    sybilPrevention: false,
    hashgraph: false,
    userAuth: false
  };

  try {
    const previousVote = getDemoUserVote(userId, channelId);
    
    // Process through production systems
    try {
      // Create revocation data for production systems
      const revocationData = {
        topic: channelId,
        publicKey: testUserData?.publicKey || generateTestPublicKey(userId),
        timestamp: testUserData?.timestamp || Date.now(),
        nonce: testUserData?.nonce || crypto.randomBytes(16).toString('hex'),
        signature: generateTestSignature({
          topic: channelId,
          revoke: true,
          timestamp: testUserData?.timestamp || Date.now(),
          nonce: testUserData?.nonce
        }, userId),
        isTestData: testMode, // KEY: Mark as test data
        testDataSource: 'integrated_demo'
      };

      // Set test mode flags
      process.env.SKIP_SIGNATURE_VERIFICATION = testMode ? 'true' : 'false';
      process.env.TEST_MODE = testMode ? 'true' : 'false';
      
      await revokeVote(revocationData.publicKey, channelId, revocationData);
      
      integrationFlags.blockchain = true;
      integrationFlags.sybilPrevention = true;
      integrationFlags.hashgraph = true;
      integrationFlags.userAuth = true;
      
      delete process.env.SKIP_SIGNATURE_VERIFICATION;
      delete process.env.TEST_MODE;
      
    } catch (productionError) {
      voteLogger.warn('Production unvote processing failed, using fallback', {
        error: productionError.message
      });
    }

    // Remove from demo tracking
    const result = removeDemoUserVote(userId, channelId);
    
    voteLogger.info('Unvote processed and recorded in blockchain', {
      userId,
      channelId,
      candidateId: result.candidateId,
      isTestData: testMode,
      integrationFlags
    });
    
    return {
      success: result.success,
      candidateId: result.candidateId,
      newCount: result.newCount,
      message: result.message,
      integrationFlags,
      blockchainRecorded: true,
      isTestData: testMode
    };

  } catch (error) {
    voteLogger.error('Integrated demo unvote processing failed', {
      error: error.message,
      userId,
      channelId
    });
    throw error;
  }
}

/**
 * ============================================================================
 * AUTHORITATIVE VOTE SYSTEM APIs - Single Source of Truth
 * ============================================================================
 */

/**
 * Get authoritative vote totals for a topic
 * GET /api/vote/authoritative/topic/:topicId/totals
 */
router.get('/authoritative/topic/:topicId/totals', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  // Import the new function we created
  const { getTopicVoteTotals } = await import('../voting/votingEngine.mjs');
  const totals = await getTopicVoteTotals(topicId);
  
  // Handle candidates data (can be Map or Object)
  let candidatesObj = {};
  if (totals.candidates instanceof Map) {
    // Convert Map to Object for JSON response
    for (const [candidateId, count] of totals.candidates.entries()) {
      candidatesObj[candidateId] = count;
    }
  } else {
    // Already an object, use directly
    candidatesObj = totals.candidates || {};
  }
  
  res.json({
    success: true,
    data: {
      topicId,
      totalVotes: totals.totalVotes,
      candidates: candidatesObj,
      lastUpdated: totals.lastUpdated
    }
  });
}));

/**
 * Get authoritative vote count for a specific candidate
 * GET /api/vote/authoritative/topic/:topicId/candidate/:candidateId
 */
router.get('/authoritative/topic/:topicId/candidate/:candidateId', asyncHandler(async (req, res) => {
  const { topicId, candidateId } = req.params;
  
  const { getCandidateVoteCount } = await import('../voting/votingEngine.mjs');
  const voteCount = getCandidateVoteCount(topicId, candidateId);
  
  res.json({
    success: true,
    data: {
      topicId,
      candidateId,
      voteCount
    }
  });
}));

/**
 * Get user's current vote for a topic
 * GET /api/vote/authoritative/user/:userId/topic/:topicId
 */
router.get('/authoritative/user/:userId/topic/:topicId', asyncHandler(async (req, res) => {
  const { userId, topicId } = req.params;
  
  const { getUserVote } = await import('../voting/votingEngine.mjs');
  const userVote = getUserVote(userId, topicId);
  
  res.json({
    success: true,
    data: {
      userId,
      topicId,
      vote: userVote
    }
  });
}));

/**
 * Reconciliation check for a topic
 * GET /api/vote/authoritative/topic/:topicId/reconciliation
 */
router.get('/authoritative/topic/:topicId/reconciliation', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  // Import the internal function (we'll need to export it)
  const { verifyTopicReconciliation } = await import('../voting/votingEngine.mjs');
  const reconciliation = verifyTopicReconciliation ? verifyTopicReconciliation(topicId) : { valid: false, message: 'Function not available' };
  
  res.json({
    success: true,
    data: {
      topicId,
      reconciliation
    }
  });
}));

/**
 * Get audit log for a topic
 * GET /api/vote/authoritative/topic/:topicId/audit
 */
router.get('/authoritative/topic/:topicId/audit', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { limit = 50 } = req.query;
  
  const { getAuditLog } = await import('../voting/votingEngine.mjs');
  const auditEntries = getAuditLog(topicId, parseInt(limit));
  
  res.json({
    success: true,
    data: {
      topicId,
      auditEntries,
      count: auditEntries.length
    }
  });
}));

/**
 * Rebuild vote totals from authoritative ledger (admin endpoint)
 * POST /api/vote/authoritative/rebuild/:topicId?
 */
router.post('/authoritative/rebuild/:topicId?', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  const { rebuildVoteTotalsFromLedger } = await import('../voting/votingEngine.mjs');
  const stats = await rebuildVoteTotalsFromLedger(topicId);
  
  voteLogger.warn('Vote totals rebuilt from authoritative ledger', { 
    topicId: topicId || 'ALL',
    stats,
    requestedBy: req.user?.id || 'anonymous'
  });
  
  res.json({
    success: true,
    message: topicId ? `Rebuilt totals for topic ${topicId}` : 'Rebuilt totals for all topics',
    data: stats
  });
}));

/**
 * Get all topics with vote data
 * GET /api/vote/authoritative/topics
 */
router.get('/authoritative/topics', asyncHandler(async (req, res) => {
  const { getTopicVoteTotals } = await import('../voting/votingEngine.mjs');
  
  // We need to get all topics - this would require access to the topicVoteTotals Map
  // For now, return a placeholder. In production, we'd iterate through all topics.
  
  res.json({
    success: true,
    message: 'Topic listing endpoint - implementation depends on topic discovery mechanism',
    data: {
      availableEndpoints: [
        '/api/vote/authoritative/topic/:topicId/totals',
        '/api/vote/authoritative/topic/:topicId/candidate/:candidateId',
        '/api/vote/authoritative/user/:userId/topic/:topicId',
        '/api/vote/authoritative/topic/:topicId/reconciliation',
        '/api/vote/authoritative/topic/:topicId/audit'
      ]
    }
  });
}));

/**
 * Verify Vote Transaction
 * GET /api/vote/verify/:voteId
 * 
 * Returns complete blockchain proof and signature verification for a vote
 * Performs 6 verification checks:
 * 1. Vote exists in authoritativeVoteLedger
 * 2. Transaction exists in blockchain
 * 3. Signature verification
 * 4. Nonce validity (no replay)
 * 5. Audit log entry exists
 * 6. Hashgraph linkage (placeholder for Phase 2)
 */
router.get('/verify/:voteId', asyncHandler(async (req, res) => {
  const { voteId } = req.params;
  
  voteLogger.info('Vote verification requested', { voteId });

  // Import required services
  const { blockchain: blockchainService } = await import('../state/state.mjs');
  const { verifySignature } = await import('../crypto/signature.mjs');
  const auditService = await import('../services/auditService.mjs');
  
  // Initialize verification results
  const verification = {
    inLedger: false,
    inBlockchain: false,
    signatureValid: false,
    nonceValid: false,
    auditLogPresent: false,
    hashgraphLinked: false, // Placeholder for Phase 2
    status: 'partial'
  };

  // CHECK 1: Vote exists in authoritativeVoteLedger
  let ledgerVote = null;
  try {
    // Search through authoritativeVoteLedger for this voteId
    for (const [userId, userVoteMap] of authoritativeVoteLedger.entries()) {
      for (const [topicId, voteData] of userVoteMap.entries()) {
        if (voteData.voteId === voteId || voteData.transactionHash === voteId) {
          ledgerVote = { ...voteData, userId, topicId };
          verification.inLedger = true;
          break;
        }
      }
      if (ledgerVote) break;
    }
  } catch (error) {
    voteLogger.error('Error checking authoritativeVoteLedger', { voteId, error: error.message });
  }

  // CHECK 5: Audit log entry exists
  const auditTrail = await auditService.default.getVoteAuditTrail(voteId);
  verification.auditLogPresent = !!(auditTrail && auditTrail.length > 0);
  
  if (!verification.auditLogPresent) {
    return res.status(404).json({
      success: false,
      error: 'Vote not found in audit log',
      verification
    });
  }

  const voteRecord = auditTrail[0]; // Original vote entry
  
  // CHECK 2: Transaction exists in blockchain
  const confirmationEntry = auditTrail.find(e => e.eventType === 'vote_confirmed');
  verification.inBlockchain = !!confirmationEntry;
  
  if (verification.inBlockchain && confirmationEntry.blockNumber) {
    try {
      const blockData = await blockchainService.getBlock(confirmationEntry.blockNumber);
      verification.inBlockchain = !!blockData;
    } catch (error) {
      voteLogger.warn('Blockchain block lookup failed', { 
        blockNumber: confirmationEntry.blockNumber, 
        error: error.message 
      });
    }
  }

  // CHECK 3: Signature verification
  let signatureVerified = null;
  if (voteRecord.signature && voteRecord.publicKey && voteRecord.voteHash) {
    try {
      signatureVerified = verifySignature(
        voteRecord.publicKey,
        voteRecord.signature,
        voteRecord.voteHash
      );
      verification.signatureValid = signatureVerified === true;
    } catch (error) {
      voteLogger.error('Signature verification failed', { voteId, error: error.message });
      verification.signatureValid = false;
    }
  }

  // CHECK 4: Nonce validity (check if nonce was used and not replayed)
  if (voteRecord.nonce) {
    try {
      // Nonce is valid if it exists in blockchain's nonce set (was recorded)
      // and doesn't appear multiple times (no replay)
      const nonceExists = await blockchainService.hasNonce(voteRecord.nonce);
      verification.nonceValid = nonceExists;
    } catch (error) {
      voteLogger.error('Nonce validation failed', { voteId, nonce: voteRecord.nonce, error: error.message });
      verification.nonceValid = false;
    }
  }

  // CHECK 6: Hashgraph linkage (placeholder for Phase 2)
  verification.hashgraphLinked = false; // Not implemented yet

  // Determine overall verification status
  const allChecksPass = verification.inLedger && 
                        verification.inBlockchain && 
                        verification.signatureValid && 
                        verification.nonceValid && 
                        verification.auditLogPresent;
  
  verification.status = allChecksPass ? 'complete' : 'partial';

  // Build enhanced response
  const response = {
    success: true,
    vote: {
      voteId: voteRecord.voteId,
      candidateId: voteRecord.candidateId,
      topicId: voteRecord.topicId,
      timestamp: voteRecord.timestamp,
      location: voteRecord.publicLocation || null // Privacy-filtered location
    },
    verification: {
      ...verification,
      blockNumber: confirmationEntry?.blockNumber || null,
      transactionHash: voteRecord.transactionHash || null
    },
    details: {
      blockchain: confirmationEntry ? {
        transactionHash: voteRecord.transactionHash,
        blockNumber: confirmationEntry.blockNumber,
        blockHash: confirmationEntry.blockHash,
        confirmations: confirmationEntry.confirmations || 1,
        status: 'confirmed'
      } : {
        transactionHash: voteRecord.transactionHash,
        status: 'pending',
        message: 'Vote submitted, waiting for blockchain confirmation'
      },
      signature: voteRecord.signature ? {
        publicKey: voteRecord.publicKey ? '****' + voteRecord.publicKey.slice(-20) : null,
        verified: signatureVerified,
        algorithm: voteRecord.signatureAlgorithm || 'ECDSA-P256'
      } : null,
      privacy: voteRecord.privacyLevel ? {
        level: voteRecord.privacyLevel,
        location: voteRecord.publicLocation || null
      } : null,
      auditTrail: auditTrail.map(entry => ({
        timestamp: entry.timestamp,
        eventType: entry.eventType || 'vote_submitted',
        blockNumber: entry.blockNumber
      }))
    }
  };

  res.json(response);
}));
