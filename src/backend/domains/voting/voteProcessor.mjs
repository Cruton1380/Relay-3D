/**
 * @fileoverview Processes votes and broadcasts updates via WebSocket
 */
import voteValidator from './voteValidator.mjs';
import voteVerifier from './voteVerifier.mjs';
import logger from '../utils/logging/logger.mjs';
import eventBus from '../eventBus-service/index.mjs';
import userActivityTracker from '../users/userActivityTracker.mjs';

class VoteProcessor {
  constructor() {
    this.activeVotes = new Map();
  }

  async processVote(voteData, userId) {
    try {
      // Validate vote data
      const validationResult = voteValidator.validateVote(voteData);
      if (!validationResult.isValid) {
        logger.warn(`Invalid vote data from user ${userId}:`, validationResult.errors);
        return { success: false, errors: validationResult.errors };
      }

      // Verify vote eligibility
      const verificationResult = await voteVerifier.verifyVoteEligibility(userId, voteData.voteId);
      if (!verificationResult.isEligible) {
        logger.warn(`User ${userId} not eligible for vote ${voteData.voteId}:`, verificationResult.reason);
        return { success: false, errors: [verificationResult.reason] };
      }

      // Get user activity level
      const activityLevel = await userActivityTracker.getUserActivityLevel(userId);

      // Create enhanced vote with activity data
      const enhancedVote = {
        ...voteData,
        metadata: {
          ...(voteData.metadata || {}),
          activity: {
            isActive: activityLevel?.isActive || false,
            percentile: activityLevel?.percentile || 0,
            timestamp: Date.now()
          }
        }
      };

      // Process the vote (store in database, update counts, etc.)
      // ... existing vote processing code ...

      // Emit event for WebSocket broadcast
      eventBus.emit('vote.submitted', {
        voteId: voteData.voteId,
        userId: userId,
        totalVotes: this.getVoteCounts(voteData.voteId)
      });

      logger.info(`Vote processed successfully for user ${userId} on vote ${voteData.voteId}`);
      return { success: true, vote: enhancedVote };
    } catch (error) {
      logger.error(`Error processing vote for user ${userId}:`, error);
      return { success: false, errors: ['Internal server error'] };
    }
  }

  getVoteCounts(voteId) {
    // Return current vote counts for the specified vote
    // ... existing code to get vote counts ...
    return { total: 0 }; // Replace with actual implementation
  }

  // New method to filter votes by activity level
  filterVotesByActivity(votes, minPercentile = 0) {
    if (minPercentile <= 0) return votes; // No filtering

    return votes.filter(vote => {
      const percentile = vote.metadata?.activity?.percentile || 0;
      return percentile >= minPercentile;
    });
  }
}

export default new VoteProcessor();
