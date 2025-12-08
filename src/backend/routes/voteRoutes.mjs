import express from 'express';
import cors from 'cors';
import voteService from '../vote-service/index.mjs';
import { authenticate } from '../middleware/auth.mjs';
import logger from '../utils/logging/logger.mjs';

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

// Clear all votes (for testing purposes)
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const result = await voteService.clearVotes();
    res.json(result);
  } catch (error) {
    logger.error('Failed to clear votes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear votes'
    });
  }
});

// Submit a vote
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, value } = req.body;
    
    if (!id || typeof value === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id and value'
      });
    }

    const result = await voteService.submitVote(id, value, req.user);
    res.json({
      success: true,
      id,
      votes: result.votes,
      revoked: result.revoked,
      updatedCounts: result.updatedCounts,
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
