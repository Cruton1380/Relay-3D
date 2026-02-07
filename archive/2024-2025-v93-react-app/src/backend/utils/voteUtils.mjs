/**
 * Vote Utilities for Backend
 * 
 * Provides vote calculation and validation functions.
 */

export class VoteUtils {
  
  /**
   * Get total vote count for a candidate
   */
  static getCandidateVoteCount(candidate) {
    if (!candidate) {
      return 0;
    }
    
    // Check various vote fields
    if (typeof candidate.votes === 'number') {
      return candidate.votes;
    }
    
    if (candidate.voteComponents) {
      return (candidate.voteComponents.testVotes || 0) + 
             (candidate.voteComponents.realVotes || 0) + 
             (candidate.voteComponents.bonusVotes || 0);
    }
    
    if (candidate.voteCount !== undefined) {
      return candidate.voteCount;
    }
    
    return 0;
  }
  
  /**
   * Validate vote data
   */
  static validateVoteData(voteData) {
    if (typeof voteData !== 'number') {
      throw new Error('Vote data must be a number');
    }
    
    if (voteData < 0) {
      throw new Error('Vote count cannot be negative');
    }
    
    return true;
  }
  
  /**
   * Aggregate votes from multiple candidates
   */
  static aggregateVotes(candidates) {
    if (!Array.isArray(candidates)) {
      return 0;
    }
    
    return candidates.reduce((total, candidate) => {
      return total + this.getCandidateVoteCount(candidate);
    }, 0);
  }
}

export class ChannelUtils {
  
  /**
   * Validate channel data structure
   */
  static validateChannel(channel) {
    if (!channel) {
      throw new Error('Channel is required');
    }
    
    if (!channel.id) {
      throw new Error('Channel ID is required');
    }
    
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      throw new Error('Channel must have candidates array');
    }
    
    return true;
  }
  
  /**
   * Get channel vote totals
   */
  static getChannelVoteTotals(channel) {
    this.validateChannel(channel);
    
    return {
      totalVotes: VoteUtils.aggregateVotes(channel.candidates),
      candidateCount: channel.candidates.length,
      averageVotes: channel.candidates.length > 0 ? 
        VoteUtils.aggregateVotes(channel.candidates) / channel.candidates.length : 0
    };
  }
}