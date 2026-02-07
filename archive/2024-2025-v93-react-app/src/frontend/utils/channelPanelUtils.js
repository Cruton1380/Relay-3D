/**
 * @fileoverview Shared utilities for channel panel components
 * Provides common functionality for vote handling, candidate rendering, and data processing
 * across all channel types (global, boundary, proximity, etc.)
 * 
 * @version 1.0
 * @date October 17, 2025
 */

export const DEMO_USER_ID = 'demo-user-1';

/**
 * Fetch vote counts for a specific candidate
 * @param {string} channelId - The channel ID
 * @param {string} candidateId - The candidate ID
 * @returns {Promise<number>} Vote count
 */
export const fetchVoteCount = async (channelId, candidateId) => {
  try {
    const response = await fetch(`http://localhost:3002/api/vote-counts/candidate/${channelId}/${candidateId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.voteCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching vote count:', error);
    return 0;
  }
};

/**
 * Load all channels with their vote counts
 * @returns {Promise<{channels: Array, voteCounts: Object, userVotes: Object}>}
 */
export const loadAllChannelsAndVotes = async () => {
  try {
    const response = await fetch(`http://localhost:3002/api/channels`);
    const data = await response.json();
    
    if (!data.success || !data.channels) {
      return { channels: [], voteCounts: {}, userVotes: {} };
    }
    
    const channels = data.channels;
    const voteCounts = {};
    const userVotes = {};
    
    // Initialize vote counts from candidate data (no API calls needed!)
    // The /api/channels response already includes initialVotes for each candidate
    channels.forEach(channel => {
      (channel.candidates || []).forEach(candidate => {
        const voteKey = `${channel.id}-${candidate.id}`;
        // Use initialVotes, voteCount, or votes from the candidate data
        voteCounts[voteKey] = candidate.initialVotes || candidate.voteCount || candidate.votes || 0;
      });
    });
    
    return { channels, voteCounts, userVotes };
  } catch (error) {
    console.error('Failed to load channels/candidates:', error);
    return { channels: [], voteCounts: {}, userVotes: {} };
  }
};

/**
 * Submit a vote for a candidate
 * @param {string} channelId - The channel ID
 * @param {string} candidateId - The candidate ID
 * @param {string} userId - The user ID (defaults to demo user)
 * @returns {Promise<Object>} Vote result
 */
export const submitVote = async (channelId, candidateId, userId = DEMO_USER_ID) => {
  const voteData = {
    channelId,
    candidateId,
    userId,
    action: 'vote'
  };
  
  const response = await fetch('http://localhost:3002/api/vote/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voteData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vote submission failed: ${response.status} ${errorText}`);
  }
  
  return await response.json();
};

/**
 * Handle vote submission with state updates
 * @param {string} channelId - The channel ID
 * @param {string} candidateId - The candidate ID
 * @param {Object} currentUserVotes - Current user votes state
 * @param {Object} currentVoteCounts - Current vote counts state
 * @param {Function} setUserVotes - State setter for user votes
 * @param {Function} setVoteCounts - State setter for vote counts
 * @param {Function} onSuccess - Optional success callback
 * @param {Function} onError - Optional error callback
 * @returns {Promise<boolean>} Success status
 */
export const handleVoteSubmission = async (
  channelId,
  candidateId,
  currentUserVotes,
  currentVoteCounts,
  setUserVotes,
  setVoteCounts,
  onSuccess,
  onError
) => {
  const voteKey = `${channelId}-${candidateId}`;
  
  // Check if already voted for this candidate
  if (currentUserVotes[channelId] === candidateId) {
    return false;
  }
  
  try {
    // Optimistically update UI
    const previousCandidate = currentUserVotes[channelId];
    setUserVotes(prev => ({ ...prev, [channelId]: candidateId }));
    
    // Submit vote
    const result = await submitVote(channelId, candidateId);
    
    if (result.success) {
      // Always fetch fresh count for the voted candidate to ensure accuracy
      const freshCount = await fetchVoteCount(channelId, candidateId);
      console.log('🔄 Fresh vote count fetched:', { 
        channelId, 
        candidateId, 
        freshCount, 
        resultCount: result.newCount,
        voteKey 
      });
      
      // Update vote counts with fresh data from server
      const newCount = freshCount !== undefined && freshCount !== 0 ? freshCount : (result.newCount || 0);
      console.log('📊 Setting vote count:', { voteKey, newCount, freshCount, resultNewCount: result.newCount });
      
      setVoteCounts(prev => ({ 
        ...prev, 
        [voteKey]: newCount
      }));
      
      // If vote was switched, update previous candidate's count
      if (result.switched && result.previousCandidate) {
        const prevKey = `${channelId}-${result.previousCandidate}`;
        const prevCount = await fetchVoteCount(channelId, result.previousCandidate);
        console.log('🔄 Previous candidate count updated:', { prevKey, prevCount });
        setVoteCounts(prev => ({ ...prev, [prevKey]: prevCount }));
      }
      
      // Trigger success callback
      onSuccess?.(channelId, candidateId, result);
      
      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('voteSubmitted', {
        detail: { channelId, candidateId, result }
      }));
      
      return true;
    }
    
    throw new Error(result.error || 'Vote failed');
  } catch (error) {
    console.error('Vote submission error:', error);
    
    // Revert optimistic update
    setUserVotes(prev => {
      const copy = { ...prev };
      if (copy[channelId] === candidateId) {
        delete copy[channelId];
      }
      return copy;
    });
    
    // Trigger error callback
    onError?.(error);
    
    return false;
  }
};

/**
 * Get vote counts with different formats (unified interface)
 * Handles both simple number format and structured {local, foreign} format
 * @param {Object} candidate - Candidate object
 * @returns {Object} Vote counts {local, foreign, total}
 */
export const getVoteCounts = (candidate) => {
  if (typeof candidate.votes === 'number') {
    return { local: candidate.votes, foreign: 0, total: candidate.votes };
  } else if (candidate.votes && typeof candidate.votes === 'object') {
    const local = candidate.votes.local || 0;
    const foreign = candidate.votes.foreign || 0;
    return { local, foreign, total: local + foreign };
  }
  return { local: 0, foreign: 0, total: 0 };
};

/**
 * Calculate vote percentages
 * @param {Object} candidate - Candidate object
 * @returns {Object} Vote percentages {local, foreign}
 */
export const getVotePercentages = (candidate) => {
  const counts = getVoteCounts(candidate);
  
  if (counts.total === 0) {
    return { local: 0, foreign: 0 };
  }
  
  return {
    local: Math.round((counts.local / counts.total) * 100),
    foreign: Math.round((counts.foreign / counts.total) * 100)
  };
};

/**
 * Calculate candidate's vote percentage in channel
 * @param {Object} candidate - Candidate object
 * @param {Array} allCandidates - All candidates in channel
 * @param {Object} voteCounts - Vote counts object
 * @param {string} channelId - Channel ID
 * @returns {number} Percentage (0-100)
 */
export const calculateVotePercentage = (candidate, allCandidates, voteCounts, channelId) => {
  const totalVotes = allCandidates.reduce((sum, c) => {
    const voteKey = `${channelId}-${c.id}`;
    return sum + (Number(voteCounts[voteKey]) || Number(c.voteCount) || Number(c.initialVotes) || Number(c.votes) || 0);
  }, 0);
  
  if (totalVotes === 0) return 0;
  
  const voteKey = `${channelId}-${candidate.id}`;
  const candidateVotes = Number(voteCounts[voteKey]) || Number(candidate.voteCount) || Number(candidate.initialVotes) || Number(candidate.votes) || 0;
  
  return ((candidateVotes / totalVotes) * 100).toFixed(1);
};

/**
 * Format large numbers with locale
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  return Number(num || 0).toLocaleString();
};

/**
 * Get candidate type icon
 * @param {Object} candidate - Candidate object
 * @param {Object} channel - Channel object
 * @returns {string} Icon emoji
 */
export const getCandidateTypeIcon = (candidate, channel) => {
  // Check candidate properties first
  if (candidate.type === 'proximity' || candidate.scope === 'proximity') return '📍';
  if (candidate.type === 'regional' || candidate.scope === 'regional') return '🏛️';
  if (candidate.type === 'global' || candidate.scope === 'global') return '🌍';
  if (candidate.type === 'boundary' || candidate.scope === 'boundary') return '🗺️';
  
  // Fallback to channel properties
  if (channel?.type === 'proximity' || channel?.category === 'proximity') return '📍';
  if (channel?.type === 'regional' || channel?.category === 'regional') return '🏛️';
  if (channel?.type === 'global' || channel?.category === 'global') return '🌍';
  if (channel?.type === 'boundary' || channel?.category === 'boundary') return '🗺️';
  
  return '📍'; // Default
};

/**
 * Sort candidates by vote count (descending)
 * @param {Array} candidates - Candidate array
 * @param {Object} voteCounts - Vote counts object
 * @param {string} channelId - Channel ID
 * @returns {Array} Sorted candidates
 */
export const sortCandidatesByVotes = (candidates, voteCounts, channelId) => {
  return [...candidates].sort((a, b) => {
    const aVoteKey = `${channelId}-${a.id}`;
    const bVoteKey = `${channelId}-${b.id}`;
    const aVotes = Number(voteCounts[aVoteKey]) || Number(a.voteCount) || Number(a.initialVotes) || Number(a.votes) || 0;
    const bVotes = Number(voteCounts[bVoteKey]) || Number(b.voteCount) || Number(b.initialVotes) || Number(b.votes) || 0;
    return bVotes - aVotes;
  });
};

/**
 * Calculate dynamic card width based on container and candidate count
 * @param {number} containerWidth - Container width in pixels
 * @param {number} candidateCount - Number of candidates
 * @returns {number} Card width in pixels
 */
export const calculateCardWidth = (containerWidth, candidateCount) => {
  if (candidateCount === 0) return 240;
  if (candidateCount === 1) return Math.min(500, containerWidth - 32);
  if (candidateCount === 2) return Math.min(380, (containerWidth - 48) / 2);
  if (candidateCount === 3) return Math.min(300, (containerWidth - 64) / 3);
  
  return Math.max(240, Math.min(280, (containerWidth - 64) / Math.min(candidateCount, 4)));
};

export default {
  fetchVoteCount,
  loadAllChannelsAndVotes,
  submitVote,
  handleVoteSubmission,
  getVoteCounts,
  getVotePercentages,
  calculateVotePercentage,
  formatNumber,
  getCandidateTypeIcon,
  sortCandidatesByVotes,
  calculateCardWidth,
  DEMO_USER_ID
};
