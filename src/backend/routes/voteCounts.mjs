import express from 'express';
import { getChannelVoteCounts, getCandidateVoteCount, updateCandidateVoteCount, getAllDemoUserVotes } from '../state/state.mjs';
import { voteService } from '../vote-service/index.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const voteLogger = logger.child({ module: 'vote-counts' });

// Get vote counts for all channels
router.get('/', async (req, res) => {
  try {
    // This would typically get all vote counts from state
    // For now, return a success response
    res.json({
      success: true,
      message: 'Vote counts endpoint active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error getting vote counts', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get vote counts'
    });
  }
});

// Get vote counts for a specific channel
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const voteCounts = getChannelVoteCounts(channelId);
    
    res.json({
      success: true,
      channelId,
      voteCounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error getting channel vote counts', { 
      channelId: req.params.channelId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get channel vote counts'
    });
  }
});

// Get vote count for a specific candidate
router.get('/candidate/:channelId/:candidateId', async (req, res) => {
  try {
    const { channelId, candidateId } = req.params;
    
    let voteCount = 0;
    
    try {
      // Use the authoritative vote API (same source as voting engine)
      const authoritativeVoteAPI = (await import('../services/authoritativeVoteAPI.mjs')).default;
      const topicVotes = await authoritativeVoteAPI.getTopicVoteTotals(channelId);
      
      // Get the vote count for this specific candidate
      voteCount = topicVotes.candidates[candidateId] || 0;
      
      voteLogger.info('📊 [VOTE COUNT] Fetched from authoritative ledger', { 
        channelId,
        candidateId,
        voteCount,
        totalTopicVotes: topicVotes.totalVotes
      });
    } catch (authError) {
      // Fallback to state-based count if authoritative API fails
      voteLogger.warn('Authoritative API unavailable, falling back to state', { 
        channelId,
        candidateId,
        error: authError.message 
      });
      voteCount = getCandidateVoteCount(channelId, candidateId);
    }
    
    res.json({
      success: true,
      channelId,
      candidateId,
      voteCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error getting candidate vote count', { 
      channelId: req.params.channelId,
      candidateId: req.params.candidateId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get candidate vote count'
    });
  }
});

// Update vote count for a candidate (for testing/demo purposes)
router.post('/candidate/:channelId/:candidateId', async (req, res) => {
  try {
    const { channelId, candidateId } = req.params;
    const { voteCount } = req.body;
    
    if (typeof voteCount !== 'number' || voteCount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Vote count must be a non-negative number'
      });
    }
    
    updateCandidateVoteCount(channelId, candidateId, voteCount);
    
    voteLogger.info('Updated candidate vote count', { channelId, candidateId, voteCount });
    
    res.json({
      success: true,
      channelId,
      candidateId,
      newVoteCount: voteCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error updating candidate vote count', { 
      channelId: req.params.channelId,
      candidateId: req.params.candidateId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate vote count'
    });
  }
});

// Get user votes for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userVotes = getAllDemoUserVotes(userId);
    
    res.json({
      success: true,
      userId,
      votes: userVotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error getting user votes', { 
      userId: req.params.userId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get user votes'
    });
  }
});

// Get total unique voters for a channel
router.get('/channel/:channelId/total-voters', async (req, res) => {
  try {
    const { channelId } = req.params;
    const uniqueVoters = voteService.getChannelUniqueVoters(channelId);
    
    res.json({
      success: true,
      channelId,
      totalUniqueVoters: uniqueVoters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    voteLogger.error('Error getting channel unique voters', { 
      channelId: req.params.channelId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get channel unique voters'
    });
  }
});

export default router;
