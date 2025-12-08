/**
 * Voter Storage API
 * 
 * High-performance API for voter queries using storage abstraction layer.
 * Replaces linear scans with spatial indexing.
 * 
 * Endpoints:
 * - GET /api/voters/bbox - Get voters in bounding box
 * - GET /api/voters/:userId - Get single voter
 * - GET /api/voters/stats - Get storage statistics
 * - POST /api/voters - Insert voter
 * - POST /api/voters/bulk - Bulk insert voters
 * - DELETE /api/voters/:userId - Delete voter
 */

import express from 'express';
import { getStorage } from '../storage/index.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const apiLogger = logger.child({ module: 'voter-storage-api' });

/**
 * GET /api/voters/stats
 * Get storage statistics
 * NOTE: Must be defined BEFORE /:userId to avoid route conflicts
 */
router.get('/stats', async (req, res) => {
  try {
    const storage = await getStorage();
    const stats = await storage.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    apiLogger.error('Get stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voters/bbox
 * Get voters within bounding box
 * 
 * Query params:
 * - candidateId: Filter by candidate
 * - minLat, maxLat, minLng, maxLng: Bounding box (required)
 * - limit: Max results (default: 1000, max: 10000)
 * - offset: Pagination offset (default: 0)
 * - privacyLevel: Filter by privacy level
 */
router.get('/bbox', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      candidateId,
      minLat,
      maxLat,
      minLng,
      maxLng,
      limit = 1000,
      offset = 0,
      privacyLevel
    } = req.query;

    // Validate bbox
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Missing bbox parameters: minLat, maxLat, minLng, maxLng required'
      });
    }

    const bbox = {
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng)
    };

    // Validate bbox values
    if (bbox.minLat < -90 || bbox.maxLat > 90 || bbox.minLng < -180 || bbox.maxLng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bbox values: lat must be -90 to 90, lng must be -180 to 180'
      });
    }

    if (bbox.minLat >= bbox.maxLat || bbox.minLng >= bbox.maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bbox: min values must be less than max values'
      });
    }

    // Limit validation
    const parsedLimit = Math.min(parseInt(limit, 10), 10000);
    const parsedOffset = Math.max(parseInt(offset, 10), 0);

    // Query storage
    const storage = await getStorage();
    const voters = await storage.getVotersByBBox({
      candidateId,
      bbox,
      limit: parsedLimit,
      offset: parsedOffset,
      privacyLevel
    });

    // Get total count (for pagination)
    const totalCount = await storage.count({
      candidateId,
      bbox,
      privacyLevel
    });

    const queryTime = Date.now() - startTime;

    apiLogger.info('Bbox query completed', {
      candidateId,
      bbox,
      returned: voters.length,
      total: totalCount,
      queryTime: `${queryTime}ms`
    });

    res.json({
      success: true,
      count: voters.length,
      total: totalCount,
      offset: parsedOffset,
      limit: parsedLimit,
      hasMore: parsedOffset + voters.length < totalCount,
      voters: voters.map(v => ({
        userId: v.userId,
        candidateId: v.candidateId,
        privacyLevel: v.privacyLevel,
        location: v.location
      })),
      queryTime: `${queryTime}ms`
    });
  } catch (error) {
    apiLogger.error('Bbox query failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voters/:userId
 * Get single voter by ID
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const storage = await getStorage();
    const voter = await storage.getVoterById(userId);

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
    }

    res.json({
      success: true,
      voter: {
        userId: voter.userId,
        candidateId: voter.candidateId,
        channelId: voter.channelId,
        privacyLevel: voter.privacyLevel,
        location: voter.location,
        createdAt: voter.createdAt
      }
    });
  } catch (error) {
    apiLogger.error('Get voter failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/voters
 * Insert single voter
 */
router.post('/', async (req, res) => {
  try {
    const voter = req.body;

    // Validate required fields
    if (!voter.userId || !voter.candidateId || !voter.channelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, candidateId, channelId'
      });
    }

    if (!voter.location || typeof voter.location.lat !== 'number' || typeof voter.location.lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid location: {lat, lng} required'
      });
    }

    const storage = await getStorage();
    await storage.insertVoter(voter);

    apiLogger.info('Voter inserted', { userId: voter.userId, candidateId: voter.candidateId });

    res.json({
      success: true,
      userId: voter.userId
    });
  } catch (error) {
    apiLogger.error('Insert voter failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voters/bulk
 * Bulk insert voters
 */
router.post('/bulk', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { voters } = req.body;

    if (!Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: voters array required'
      });
    }

    const storage = await getStorage();
    const inserted = await storage.insertVoters(voters);

    const insertTime = Date.now() - startTime;
    const rate = Math.round(inserted / (insertTime / 1000));

    apiLogger.info('Bulk insert completed', {
      inserted,
      total: voters.length,
      insertTime: `${insertTime}ms`,
      rate: `${rate}/s`
    });

    res.json({
      success: true,
      inserted,
      total: voters.length,
      insertTime: `${insertTime}ms`,
      rate: `${rate}/s`
    });
  } catch (error) {
    apiLogger.error('Bulk insert failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/voters/:userId
 * Delete voter
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const storage = await getStorage();
    const deleted = await storage.deleteVoter(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
    }

    apiLogger.info('Voter deleted', { userId });

    res.json({
      success: true,
      userId
    });
  } catch (error) {
    apiLogger.error('Delete voter failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

