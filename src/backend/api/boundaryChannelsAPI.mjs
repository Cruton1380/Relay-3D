/**
 * @fileoverview Boundary Channels API
 * 
 * RESTful API for managing boundary channels and proposals.
 * Integrates with existing candidate voting system.
 */

import express from 'express';
import boundaryChannelService from '../services/boundaryChannelService.mjs';
import regionalGovernanceService from '../services/regionalGovernanceService.mjs';

const router = express.Router();

/**
 * GET /api/boundary-channels/categories
 * Get all boundary channel categories
 * NOTE: This must come BEFORE the /:channelId route to avoid matching "categories" as a channel ID
 */
router.get('/categories', async (req, res) => {
  try {
    const allChannels = Array.from(boundaryChannelService.boundaryChannels.values());
    
    const categories = [...new Set(allChannels.map(c => c.category))];
    
    const categoriesWithCounts = categories.map(cat => ({
      name: cat,
      channelCount: allChannels.filter(c => c.category === cat).length
    }));

    res.json({
      success: true,
      categories: categoriesWithCounts
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundary-channels/region/:regionId/active-boundary
 * Get the active (winning) boundary for a region
 * NOTE: This must come BEFORE the /:channelId route
 */
router.get('/region/:regionId/active-boundary', async (req, res) => {
  try {
    const { regionId } = req.params;

    const activeBoundary = await boundaryChannelService.getActiveRegionBoundary(regionId);

    res.json({
      success: true,
      regionId,
      boundary: activeBoundary
    });

  } catch (error) {
    console.error('Error getting active boundary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundary-channels
 * List all boundary channels, optionally filtered by region
 */
router.get('/', async (req, res) => {
  try {
    const { regionId, category } = req.query;

    if (regionId) {
      // Get channels for specific region
      const channels = boundaryChannelService.getBoundaryChannelsForRegion(regionId);
      return res.json({
        success: true,
        channels,
        count: channels.length
      });
    }

    // Get all boundary channels
    const allChannels = Array.from(boundaryChannelService.boundaryChannels.values());

    // Filter by category if specified
    const filtered = category
      ? allChannels.filter(c => c.category === category)
      : allChannels;

    // Group by category for easier frontend rendering
    const grouped = filtered.reduce((acc, channel) => {
      const cat = channel.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(channel);
      return acc;
    }, {});

    res.json({
      success: true,
      channels: filtered,
      grouped,
      categories: Object.keys(grouped),
      count: filtered.length
    });

  } catch (error) {
    console.error('Error listing boundary channels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundary-channels/:channelId
 * Get a specific boundary channel with all candidates
 */
router.get('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = boundaryChannelService.getBoundaryChannel(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Boundary channel not found'
      });
    }

    // Sort candidates by votes (highest first)
    const sortedCandidates = [...channel.candidates]
      .sort((a, b) => b.votes - a.votes);

    res.json({
      success: true,
      channel: {
        ...channel,
        candidates: sortedCandidates
      }
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
 * POST /api/boundary-channels/:channelId/proposals
 * Add a boundary proposal as a candidate to a channel
 */
router.post('/:channelId/proposals', async (req, res) => {
  try {
    const { channelId } = req.params;
    const proposalData = req.body;

    // Validate required fields
    if (!proposalData.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!proposalData.proposedBoundary) {
      return res.status(400).json({
        success: false,
        error: 'Proposed boundary (GeoJSON) is required'
      });
    }

    // Validate GeoJSON format
    if (!proposalData.proposedBoundary.type || !proposalData.proposedBoundary.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GeoJSON format'
      });
    }

    // Add proposal as candidate to channel
    const candidate = await boundaryChannelService.addBoundaryProposal(
      channelId,
      proposalData
    );

    res.json({
      success: true,
      candidate,
      channelId
    });

  } catch (error) {
    console.error('Error adding boundary proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/boundary-channels/:channelId/vote
 * Vote on a boundary candidate
 */
router.post('/:channelId/vote', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { candidateId, userId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }

    // Record vote
    const result = await boundaryChannelService.voteOnBoundaryProposal(
      channelId,
      candidateId,
      userId || 'demo-user-1'
    );

    res.json(result);

  } catch (error) {
    console.error('Error voting on boundary proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
