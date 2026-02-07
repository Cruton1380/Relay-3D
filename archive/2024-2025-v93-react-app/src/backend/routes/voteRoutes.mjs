import express from 'express';
import cors from 'cors';
// import voteService from '../vote-service/index.mjs'; // REMOVED: Git-native backend
import { authenticate } from '../middleware/auth.mjs';
import logger from '../utils/logging/logger.mjs';
import query from '../../../.relay/query.mjs';
import { relayClient } from '../relay-client/index.mjs';
import EnvelopeBuilder from '../relay-client/envelope-builder.mjs';

const router = express.Router();

// Enable CORS for vote routes
router.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// Test endpoint for vote service connectivity
router.get('/test', authenticate, (req, res) => {
  res.json({ status: 'connected' });
});

// Clear all votes (for testing purposes) - NOT IMPLEMENTED for Git-native backend
router.delete('/clear', authenticate, async (req, res) => {
  // Git-native backend: votes are immutable commits, cannot be "cleared"
  // To reset, you would need to create a new branch or repository
  res.status(501).json({
    success: false,
    error: 'Clear votes not implemented - Git-native backend uses immutable commits'
  });
});

// Submit a vote
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, value, repo_id, branch_id = 'main', scope_type = 'branch' } = req.body;
    
    if (!id || typeof value === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id and value'
      });
    }

    // TODO: Implement vote submission via EnvelopeBuilder + relayClient
    // This endpoint needs channel_id and candidate_id to properly commit
    // For now, return success to unblock server startup
    logger.warn('Vote submission endpoint needs full Git-native implementation');
    
    res.json({
      success: true,
      id,
      message: 'Vote route needs Git-native implementation - use /api/vote endpoint instead',
      isCurrentUser: true
    });
  } catch (error) {
    logger.error('Failed to submit vote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote'
    });
  }
});

export default router; 
