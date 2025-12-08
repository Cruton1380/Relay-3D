import eventBus from '../eventBus-service/index.mjs';
import logger from '../utils/logging/logger.mjs';
import websocketService from '../websocket-service/index.mjs';
import fs from 'fs/promises';
import path from 'path';

const voteLogger = logger.child({ module: 'vote-service' });
const TEST_MODE = process.env.TEST_MODE === 'true';

async function preinitializeBaseVoteCounts(voteServiceInstance) {
  try {
    // Use demos/demo-voting-data.json instead of test-channels.json
    const channelsPath = path.join(process.cwd(), 'data', 'demos', 'demo-voting-data.json');
    const channelsData = await fs.readFile(channelsPath, 'utf-8');
    const { channels } = JSON.parse(channelsData);
    for (const channel of channels) {
      for (const candidate of channel.candidates) {
        const candidateId = `${channel.id}-${candidate.id}`;
        voteServiceInstance.ensureBaseVoteCount(candidateId);
      }
    }
    console.log('Pre-initialized base vote counts for all candidates.');
  } catch (error) {
    console.error('Failed to pre-initialize base vote counts:', error);
  }
}

async function preinitializeBaseVoteCountsFromDemoFile(voteServiceInstance) {
  // Load demo data regardless of TEST_MODE for proper vote initialization
  await voteServiceInstance.loadDemoVoteCounts();
}

export class VoteService {
  constructor(events) {
    this.events = events;
    this.voteCache = new Map(); // In-memory cache for user votes
    this.userVotes = new Map(); // Map of userId -> Map of channelId -> candidateId
    this.demoDataLoaded = false; // Flag to prevent multiple loads
    this.baseVoteCounts = new Map(); // Map of candidateId -> base count
    preinitializeBaseVoteCounts(this);
    preinitializeBaseVoteCountsFromDemoFile(this);
  }

  // Helper to extract channelId from vote id (assumes format: <channelId>-candidate-<n>)
  extractChannelId(voteId) {
    // Find the last occurrence of '-candidate-' and take everything before it
    const idx = voteId.lastIndexOf('-candidate-');
    if (idx === -1) throw new Error('Invalid vote id format');
    return voteId.substring(0, idx);
  }

  // Helper to initialize base vote count for a candidate
  async ensureBaseVoteCount(id) {
    if (!this.baseVoteCounts.has(id)) {
      // Try to load from demo data first
      await this.loadDemoVoteCounts();
      
      // If still not found, use fallback
      if (!this.baseVoteCounts.has(id)) {
        const fallbackCount = this.getFallbackVoteCount(id);
        this.baseVoteCounts.set(id, fallbackCount);
      }
    }
  }
  
  // Load vote counts from demo data
  async loadDemoVoteCounts() {
    if (this.demoDataLoaded) return; // Only load once
    
    try {
      const demoPath = path.join(process.cwd(), 'data', 'demos', 'demo-voting-data.json');
      const demoData = await fs.readFile(demoPath, 'utf-8');
      const { channels } = JSON.parse(demoData);
      
      for (const channel of channels) {
        for (const candidate of channel.candidates) {
          const candidateId = `${channel.id}-${candidate.id}`;
          this.baseVoteCounts.set(candidateId, candidate.votes);
        }
      }
      
      this.demoDataLoaded = true;
      console.log('🗳️ Loaded base vote counts from demo data:', this.baseVoteCounts.size, 'candidates');
    } catch (error) {
      console.error('Failed to load demo vote counts:', error);
    }
  }
  
  // Get fallback vote count that matches the GlobalChannelRenderer fallback system
  getFallbackVoteCount(candidateId) {
    // Extract candidate info from ID to match GlobalChannelRenderer fallback logic
    if (candidateId.includes('candidate-1759217730559-0-')) return 6000;
    if (candidateId.includes('candidate-1759217730559-1-')) return 1867;
    if (candidateId.includes('candidate-1759217730559-2-')) return 1270;
    if (candidateId.includes('candidate-1759217730559-3-')) return 863;
    
    // Default fallback for unknown candidates
    return Math.floor(Math.random() * 1500) + 500;
  }

  async submitVote(id, value, user) {
    try {
      await this.ensureBaseVoteCount(id);
      voteLogger.debug('Processing vote submission', { id, value, userId: user.id });

      const channelId = this.extractChannelId(id);
      if (!channelId) throw new Error('Invalid vote id format');

      // Track user votes per channel
      if (!this.userVotes.has(user.id)) {
        this.userVotes.set(user.id, new Map());
      }
      const userChannelVotes = this.userVotes.get(user.id);
      const prevCandidateId = userChannelVotes.get(channelId);

      // If user already voted for this candidate, do nothing
      if (prevCandidateId === id) {
        const currentTotal = (this.baseVoteCounts.get(id) || 0) + (this.voteCache.get(id) || 0);
        voteLogger.info('⚠️ [VOTE] User already voted for this candidate, no increment', { 
          id, 
          userId: user.id,
          baseVotes: this.baseVoteCounts.get(id) || 0,
          cacheVotes: this.voteCache.get(id) || 0,
          totalVotes: currentTotal
        });
        return {
          success: true,
          votes: currentTotal,
          revoked: null,
          updatedCounts: { [id]: currentTotal }
        };
      }

      let revoked = null;
      // If user already voted for a different candidate in this channel, revoke previous vote
      if (prevCandidateId && prevCandidateId !== id) {
        await this.ensureBaseVoteCount(prevCandidateId);
        const prevCacheCount = this.voteCache.get(prevCandidateId) || 0;
        const newPrevCount = Math.max(0, prevCacheCount - 1);
        this.voteCache.set(prevCandidateId, newPrevCount);
        // Return the full key for frontend lookup (frontend should use it directly, not add channel prefix)
        revoked = prevCandidateId;
        voteLogger.info('🔄 [VOTE] Revoked previous vote', { 
          prevCandidateId, 
          userId: user.id,
          prevCacheWas: prevCacheCount,
          prevCacheNow: newPrevCount
        });
      }

      // Only increment if switching to a new candidate
      if (!prevCandidateId || prevCandidateId !== id) {
        const currentVotes = this.voteCache.get(id) || 0;
        const newVotes = currentVotes + 1;
        this.voteCache.set(id, newVotes);
        userChannelVotes.set(channelId, id);
        voteLogger.info('✅ [VOTE] Registered new vote', { 
          id, 
          userId: user.id, 
          cacheVotes: newVotes,
          baseVotes: this.baseVoteCounts.get(id) || 0,
          totalVotes: (this.baseVoteCounts.get(id) || 0) + newVotes
        });
      }

      // Return updated counts for both candidates
      const updatedCounts = { [id]: (this.baseVoteCounts.get(id) || 0) + (this.voteCache.get(id) || 0) };
      if (revoked) {
        updatedCounts[revoked] = (this.baseVoteCounts.get(revoked) || 0) + (this.voteCache.get(revoked) || 0);
      }

      const baseVotes = this.baseVoteCounts.get(id) || 0;
      const blockchainVotes = this.voteCache.get(id) || 0;
      const totalVotes = baseVotes + blockchainVotes;
      
      return {
        success: true,
        votes: totalVotes,  // Total votes (for backward compatibility)
        blockchainVotes: blockchainVotes,  // NEW: Just the blockchain increment
        baseVotes: baseVotes,  // NEW: Base votes for reference
        revoked,
        updatedCounts
      };
    } catch (error) {
      voteLogger.error('Vote submission failed', { error: error.message });
      throw error;
    }
  }
  
  async getVotes(filters = {}) {
    try {
      // Return cached votes for now
      const votes = {};
      for (const [id, base] of this.baseVoteCounts.entries()) {
        votes[id] = base + (this.voteCache.get(id) || 0);
      }
      return votes;
    } catch (error) {
      logger.error('Error in vote service getVotes', { filters, error });
      throw error;
    }
  }

  // Get total unique voters in a channel
  getChannelUniqueVoters(channelId) {
    let uniqueVoters = 0;
    for (const [userId, userChannelVotes] of this.userVotes) {
      if (userChannelVotes.has(channelId)) {
        uniqueVoters++;
      }
    }
    return uniqueVoters;
  }

  // Clear all vote data (for testing/reset purposes)
  async clearVotes() {
    try {
      this.voteCache.clear();
      this.userVotes.clear();
      this.baseVoteCounts.clear();
      voteLogger.info('Vote cache and user votes cleared');
      return { success: true, message: 'Vote cache cleared' };
    } catch (error) {
      voteLogger.error('Error clearing votes', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize base vote counts for newly created candidates
   * This ensures candidates have their initial vote counts registered in the system
   * @param {string} candidateId - The unique ID of the candidate
   * @param {number} initialVotes - The initial vote count (default: 0)
   */
  initializeCandidateVotes(candidateId, initialVotes = 0) {
    if (!this.baseVoteCounts.has(candidateId)) {
      this.baseVoteCounts.set(candidateId, initialVotes);
      console.log(`🗳️ [VOTE INIT] Initialized base votes for ${candidateId}: ${initialVotes} votes`);
    } else {
      console.log(`ℹ️ [VOTE INIT] Candidate ${candidateId} already has base votes: ${this.baseVoteCounts.get(candidateId)}`);
    }
  }

  /**
   * Batch initialize base vote counts for multiple candidates
   * @param {Array<{id: string, votes: number}>} candidates - Array of candidate objects
   * @param {string} channelId - Optional channel ID to create proper vote IDs
   */
  initializeBatchCandidateVotes(candidates, channelId = null) {
    let initialized = 0;
    for (const candidate of candidates) {
      const candidateId = candidate.id || candidate.candidateId;
      
      // Create proper vote ID (channelId-candidateId format if channelId provided)
      const voteId = channelId ? `${channelId}-${candidateId}` : candidateId;
      
      // Check multiple possible vote properties (votes, initialVotes, blockchainVotes)
      const initialVotes = candidate.votes || candidate.initialVotes || candidate.blockchainVotes || 0;
      
      if (!this.baseVoteCounts.has(voteId)) {
        this.baseVoteCounts.set(voteId, initialVotes);
        initialized++;
        if (initialVotes > 0) {
          console.log(`  🗳️ [VOTE INIT] ${voteId}: ${initialVotes} votes`);
        }
      }
    }
    console.log(`🗳️ [VOTE BATCH INIT] Initialized ${initialized}/${candidates.length} new candidates with base votes`);
    return initialized;
  }
}

// Create instance with DI
export const voteService = new VoteService(eventBus);

export default voteService;
