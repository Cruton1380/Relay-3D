/**
 * Vote utilities with optimistic updates and reconciliation
 */

import { DEBUG_CONFIG } from '../constants.js';

// Local vote cache for optimistic updates
const voteCache = new Map();
const pendingVotes = new Map();

export const voteUtils = {
  
  /**
   * Cast a vote with optimistic UI update
   */
  async castVote(candidateId, voteType = 'up') {
    // Optimistic update - immediately update UI
    const currentVotes = voteCache.get(candidateId) || 0;
    const optimisticVotes = currentVotes + (voteType === 'up' ? 1 : -1);
    voteCache.set(candidateId, optimisticVotes);
    
    // Track pending vote
    pendingVotes.set(candidateId, { type: voteType, timestamp: Date.now() });
    
    if (DEBUG_CONFIG.VOTES) {
      console.log(`🗳️ Optimistic vote cast: ${candidateId} = ${optimisticVotes}`);
    }
    
    // Trigger UI update event
    window.dispatchEvent(new CustomEvent('voteUpdate', { 
      detail: { candidateId, votes: optimisticVotes, isOptimistic: true }
    }));
    
    try {
      // Send to backend
      const response = await fetch(`http://localhost:3002/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, voteType })
      });
      
      if (!response.ok) {
        throw new Error(`Vote failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Reconcile with backend response
      this.reconcileVote(candidateId, result.voteCount);
      
      return result;
    } catch (error) {
      console.error('❌ Vote submission failed:', error);
      
      // Rollback optimistic update
      voteCache.set(candidateId, currentVotes);
      pendingVotes.delete(candidateId);
      
      // Trigger rollback UI update
      window.dispatchEvent(new CustomEvent('voteUpdate', { 
        detail: { candidateId, votes: currentVotes, isOptimistic: false, error: true }
      }));
      
      throw error;
    }
  },
  
  /**
   * Reconcile local vote cache with backend data
   */
  reconcileVote(candidateId, backendVoteCount) {
    const localVotes = voteCache.get(candidateId) || 0;
    const pending = pendingVotes.get(candidateId);
    
    // If we have a pending vote that's recent, trust our local cache
    if (pending && (Date.now() - pending.timestamp) < 5000) {
      if (DEBUG_CONFIG.VOTES) {
        console.log(`🔄 Vote reconciliation (pending): ${candidateId} local=${localVotes}, backend=${backendVoteCount}`);
      }
      return;
    }
    
    // Update cache with backend data
    voteCache.set(candidateId, backendVoteCount);
    pendingVotes.delete(candidateId);
    
    if (DEBUG_CONFIG.VOTES && localVotes !== backendVoteCount) {
      console.log(`🔄 Vote reconciliation: ${candidateId} ${localVotes} → ${backendVoteCount}`);
    }
    
    // Trigger UI update if different
    if (localVotes !== backendVoteCount) {
      window.dispatchEvent(new CustomEvent('voteUpdate', { 
        detail: { candidateId, votes: backendVoteCount, isOptimistic: false }
      }));
    }
  },
  
  /**
   * Get current vote count (optimistic or cached)
   */
  getVoteCount(candidateId) {
    return voteCache.get(candidateId) || 0;
  },
  
  /**
   * Batch reconcile multiple votes
   */
  reconcileVotes(voteData) {
    Object.entries(voteData).forEach(([candidateId, voteCount]) => {
      this.reconcileVote(candidateId, voteCount);
    });
  },
  
  /**
   * Clear all cached votes
   */
  clearCache() {
    voteCache.clear();
    pendingVotes.clear();
    if (DEBUG_CONFIG.VOTES) {
      console.log('🧹 Vote cache cleared');
    }
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedVotes: voteCache.size,
      pendingVotes: pendingVotes.size,
      totalVotes: Array.from(voteCache.values()).reduce((sum, votes) => sum + votes, 0)
    };
  }
};

// Auto-cleanup old pending votes
setInterval(() => {
  const now = Date.now();
  for (const [candidateId, pending] of pendingVotes.entries()) {
    if (now - pending.timestamp > 10000) { // 10 second timeout
      pendingVotes.delete(candidateId);
      if (DEBUG_CONFIG.VOTES) {
        console.log(`🧹 Cleaned up stale pending vote: ${candidateId}`);
      }
    }
  }
}, 5000); // Check every 5 seconds
