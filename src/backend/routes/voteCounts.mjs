import express from 'express';
import query from '../../.relay/query.mjs';
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
    const repo_id = req.query.repo_id || `channel_${channelId}`;
    const branch_id = req.query.branch_id || "main";
    const scope_type = req.query.scope_type || "branch";
    
    // AUTHORITATIVE READ: query hook only
    const result = await query({
      endpoint: '/voting_rankings',
      params: { repo_id, branch_id, scope_type, channel_id: channelId },
      repo: repo_id,
      branch: branch_id
    });
    
    res.json({
      success: true,
      channelId,
      voteCounts: result.candidates || [],
      metrics: result.metrics || {},
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
    const repo_id = req.query.repo_id || `channel_${channelId}`;
    const branch_id = req.query.branch_id || "main";
    const scope_type = req.query.scope_type || "branch";
    
    // AUTHORITATIVE READ: query hook only (no fallbacks)
    const result = await query({
      endpoint: '/voting_rankings',
      params: { repo_id, branch_id, scope_type, channel_id: channelId, candidate_id: candidateId },
      repo: repo_id,
      branch: branch_id
    });
    
    // Find candidate in results
    const candidate = result.candidates?.find(c => c.candidate_id === candidateId);
    const voteCount = candidate?.votes_total || 0;
    
    voteLogger.info('📊 [VOTE COUNT] Fetched from query hook (Git-native)', { 
      channelId,
      candidateId,
      voteCount,
      scope_step: result.scope_step
    });
    
    res.json({
      success: true,
      channelId,
      candidateId,
      voteCount,
      candidate,
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

// Update vote count for a candidate (DISABLED - use vote casting endpoint instead)
// Filament Law: vote_total is DERIVED, not writable
router.post('/candidate/:channelId/:candidateId', async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Direct vote count updates are not allowed. vote_total is a derived field.',
    message: 'Use the vote casting endpoint to submit votes. Vote totals are computed by replaying commit envelopes.',
    alternative_endpoint: '/api/vote/cast'
  });
});

// Get user votes for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const repo_id = req.query.repo_id;
    const branch_id = req.query.branch_id || "main";
    const scope_type = req.query.scope_type || "branch";
    
    // AUTHORITATIVE READ: query envelopes filtered by actor
    const result = await query({
      endpoint: '/envelopes',
      params: { 
        repo_id, 
        branch_id, 
        scope_type,
        domain_id: "voting.channel",
        actor_id: userId
      },
      repo: repo_id,
      branch: branch_id
    });
    
    res.json({
      success: true,
      userId,
      votes: result.envelopes || [],
      count: result.count || 0,
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
    const repo_id = req.query.repo_id || `channel_${channelId}`;
    const branch_id = req.query.branch_id || "main";
    const scope_type = req.query.scope_type || "branch";
    
    // AUTHORITATIVE READ: query hook with unique voters metric
    const result = await query({
      endpoint: '/voting_rankings',
      params: { 
        repo_id, 
        branch_id, 
        scope_type,
        channel_id: channelId,
        include_unique_voters: true
      },
      repo: repo_id,
      branch: branch_id
    });
    
    res.json({
      success: true,
      channelId,
      totalUniqueVoters: result.metrics?.unique_voters || 0,
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
