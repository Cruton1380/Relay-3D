/**
 * @fileoverview Proximity-Based Voting Restrictions Service
 * Enforces voting restrictions based on user proximity to channels
 */

class ProximityVotingService {
  constructor(channelService, proximityEncounterManager) {
    this.channelService = channelService;
    this.proximityEncounterManager = proximityEncounterManager;
    this.votingRestrictions = new Map(); // channelId -> restrictions
    this.userProximityStatus = new Map(); // userId -> proximity status
  }

  /**
   * Check if user can vote in a proximity channel
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @param {string} channelType - Channel type (proximity, global, regional)
   * @returns {Object} Voting permission result
   */
  async canUserVote(userId, channelId, channelType) {
    // Allow voting in non-proximity channels
    if (channelType !== 'proximity') {
      return {
        canVote: true,
        reason: 'Non-proximity channel allows remote voting',
        accessType: 'global'
      };
    }

    // Check proximity status for proximity channels
    const proximityAccess = await this.checkProximityAccess(userId, channelId);
    
    if (proximityAccess.isCurrentlyPresent) {
      return {
        canVote: true,
        reason: 'User is currently in proximity to the channel',
        accessType: 'proximity_active'
      };
    }

    // Check if user has historical access but is not currently present
    if (proximityAccess.hasHistoricalAccess) {
      return {
        canVote: false,
        reason: 'Proximity channel requires current presence for voting',
        accessType: 'proximity_readonly',
        canView: true
      };
    }

    return {
      canVote: false,
      reason: 'No access to proximity channel',
      accessType: 'none',
      canView: false
    };
  }

  /**
   * Check user's proximity access to a channel
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @returns {Object} Proximity access status
   */
  async checkProximityAccess(userId, channelId) {
    try {
      const access = this.proximityEncounterManager.canAccessChannel(userId, channelId);
      
      return {
        isCurrentlyPresent: access.accessType === 'active',
        hasHistoricalAccess: access.accessType === 'readonly' || access.accessType === 'active',
        accessType: access.accessType,
        canAccess: access.canAccess
      };
    } catch (error) {
      console.error('Failed to check proximity access:', error);
      return {
        isCurrentlyPresent: false,
        hasHistoricalAccess: false,
        accessType: 'none',
        canAccess: false
      };
    }
  }

  /**
   * Validate voting action before processing
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @param {string} contentId - Content ID
   * @param {string} voteType - Vote type
   * @returns {Object} Validation result
   */
  async validateVotingAction(userId, channelId, contentId, voteType) {
    try {
      // Get channel information
      const channel = await this.channelService.getChannel(channelId);
      if (!channel) {
        return {
          isValid: false,
          error: 'Channel not found',
          code: 'CHANNEL_NOT_FOUND'
        };
      }

      // Check voting permissions
      const votingPermission = await this.canUserVote(userId, channelId, channel.type);
      
      if (!votingPermission.canVote) {
        return {
          isValid: false,
          error: votingPermission.reason,
          code: 'VOTING_NOT_ALLOWED',
          accessType: votingPermission.accessType,
          canView: votingPermission.canView || false
        };
      }

      return {
        isValid: true,
        accessType: votingPermission.accessType,
        reason: votingPermission.reason
      };

    } catch (error) {
      console.error('Failed to validate voting action:', error);
      return {
        isValid: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Get user's voting capabilities across different channel types
   * @param {string} userId - User ID
   * @returns {Object} User voting capabilities
   */
  async getUserVotingCapabilities(userId) {
    try {
      const capabilities = {
        globalChannels: { canVote: true, canView: true },
        regionalChannels: { canVote: true, canView: true },
        proximityChannels: {
          active: [],
          readonly: [],
          noAccess: []
        }
      };

      // Get user's proximity status
      const userHistory = this.proximityEncounterManager.getUserEncounterHistory(userId);
      
      // Categorize proximity channels
      for (const encounter of userHistory.active) {
        capabilities.proximityChannels.active.push({
          channelId: encounter.channelId,
          channelName: encounter.channelName,
          canVote: true,
          canView: true,
          accessType: 'proximity_active'
        });
      }

      // Get historical channels (read-only access)
      const historicalChannels = this.proximityEncounterManager.getHistoricalChannels(userId);
      for (const channelId of historicalChannels) {
        capabilities.proximityChannels.readonly.push({
          channelId,
          canVote: false,
          canView: true,
          accessType: 'proximity_readonly'
        });
      }

      return capabilities;

    } catch (error) {
      console.error('Failed to get user voting capabilities:', error);
      return null;
    }
  }

  /**
   * Create voting permission middleware for API endpoints
   * @returns {Function} Express middleware function
   */
  createVotingMiddleware() {
    return async (req, res, next) => {
      try {
        const { userId } = req.user || req.body;
        const { channelId, contentId } = req.params;
        const { voteType } = req.body;

        if (!userId || !channelId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required parameters',
            code: 'MISSING_PARAMETERS'
          });
        }

        const validation = await this.validateVotingAction(userId, channelId, contentId, voteType);
        
        if (!validation.isValid) {
          return res.status(403).json({
            success: false,
            error: validation.error,
            code: validation.code,
            accessType: validation.accessType,
            canView: validation.canView
          });
        }

        // Add validation result to request for use in route handler
        req.votingValidation = validation;
        next();

      } catch (error) {
        console.error('Voting middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          code: 'MIDDLEWARE_ERROR'
        });
      }
    };
  }

  /**
   * Get voting restrictions summary for UI display
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @returns {Object} Voting restrictions summary
   */
  async getVotingRestrictionsSummary(userId, channelId) {
    try {
      const channel = await this.channelService.getChannel(channelId);
      const proximityAccess = await this.checkProximityAccess(userId, channelId);
      const votingPermission = await this.canUserVote(userId, channelId, channel?.type);

      return {
        channelType: channel?.type,
        canVote: votingPermission.canVote,
        canView: votingPermission.canView,
        accessType: votingPermission.accessType,
        reason: votingPermission.reason,
        proximityStatus: {
          isCurrentlyPresent: proximityAccess.isCurrentlyPresent,
          hasHistoricalAccess: proximityAccess.hasHistoricalAccess
        },
        restrictions: {
          requiresProximity: channel?.type === 'proximity',
          allowsRemoteViewing: true,
          allowsRemoteVoting: channel?.type !== 'proximity'
        }
      };

    } catch (error) {
      console.error('Failed to get voting restrictions summary:', error);
      return null;
    }
  }
}

export default ProximityVotingService;
