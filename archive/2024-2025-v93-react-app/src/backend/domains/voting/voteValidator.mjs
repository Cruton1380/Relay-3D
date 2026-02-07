//backend/voting/voteValidator.mjs
/**
 * Vote validator for region-specific rules
 * Ensures votes comply with local community parameters
 */

import logger from '../../utils/logging/logger.mjs';
import { getUserRegion } from '../../location/userLocation.mjs';
import configService from '../../config-service/index.mjs';
import { getTopicRegion } from './topicRegionUtils.mjs';

// Create validator logger
const validatorLogger = logger.child({ module: 'vote-validator' });

/**
 * Validate if a vote satisfies the region-specific requirements
 * @param {string} userId - User's public key/ID
 * @param {string} topic - Topic of the vote
 * @param {string} regionId - Region ID where the vote is being cast
 * @returns {Promise<Object>} Validation result
 */
export async function validateVoteByRegion(userId, topic, regionId) {
  try {
    // Check if user's region matches the provided region
    const userRegion = getUserRegion(userId);
    
    if (userRegion !== regionId) {
      validatorLogger.warn(`User ${userId.substring(0, 8)}... attempted to vote in region ${regionId} but is located in ${userRegion}`);
      return {
        valid: false,
        reason: 'You can only vote in your current region'
      };
    }
    
    // If topic already exists, check if it's in the user's region
    const existingTopicRegion = getTopicRegion(topic);
    
    if (existingTopicRegion && existingTopicRegion !== 'global' && existingTopicRegion !== userRegion) {
      validatorLogger.warn(`User in ${userRegion} attempted to vote on topic in ${existingTopicRegion}`);
      return {
        valid: false,
        reason: `This topic belongs to region ${existingTopicRegion}`
      };
    }
    
    // Get region parameters
    const regionParams = config.system.regionParameters[regionId] || config.system.defaultRegionParameters;
    
    if (!regionParams) {
      validatorLogger.error(`Region parameters not found for ${regionId}`);
      return {
        valid: false,
        reason: 'Invalid region or region parameters not available'
      };
    }
    
    // Additional validation based on region parameters
    // For example, checking if the current time allows voting based on region-specific schedules
    
    validatorLogger.info(`Vote validated for region ${regionId}`, {
      user: userId.substring(0, 8),
      topic,
      voteDuration: regionParams.voteDuration
    });
    
    return {
      valid: true,
      regionParams: {
        voteDurationDays: Math.round(regionParams.voteDuration / (24 * 60 * 60 * 1000)),
        minParticipation: regionParams.minParticipation,
        reliabilityThreshold: regionParams.reliabilityThreshold || 0.6
      }
    };
  } catch (error) {
    validatorLogger.error('Error validating vote by region', { error: error.message });
    return {
      valid: false,
      reason: 'Error validating vote'
    };
  }
}

/**
 * Check if a vote result can be finalized based on region parameters
 * @param {string} topic - Topic ID
 * @param {Object} voteStatus - Current vote status
 * @returns {Promise<Object>} Finalization status
 */
export async function canFinalizeVote(topic, voteStatus) {
  try {
    const topicRegion = getTopicRegion(topic);
    if (!topicRegion) {
      return { 
        canFinalize: false, 
        reason: 'Topic region not found' 
      };
    }
    
    const regionParams = config.system.regionParameters[topicRegion] || config.system.defaultRegionParameters;
    if (!regionParams) {
      return { 
        canFinalize: false, 
        reason: 'Region parameters not found' 
      };
    }
    
    // Check if minimum participation requirement is met
    if (voteStatus.reliabilityStats.participants < regionParams.minParticipation) {
      return {
        canFinalize: false,
        reason: `Minimum participation not met (${voteStatus.reliabilityStats.participants}/${regionParams.minParticipation})`
      };
    }
    
    // Check if vote has been stable for required time
    // (Assuming voteStatus includes stability information from votingEngine.mjs)
    if (voteStatus.isStable && voteStatus.stabilityInfo) {
      const stabilityDuration = Date.now() - voteStatus.stabilityInfo.startTimestamp;
      const requiredStabilityDuration = regionParams.stabilityPeriod || (24 * 60 * 60 * 1000); // Default: 24 hours
      
      if (stabilityDuration >= requiredStabilityDuration) {
        return {
          canFinalize: true,
          reason: 'Vote stable for required duration'
        };
      } else {
        return {
          canFinalize: false,
          reason: `Vote must remain stable for ${Math.ceil((requiredStabilityDuration - stabilityDuration) / (60 * 60 * 1000))} more hours`
        };
      }
    }
    
    return {
      canFinalize: false,
      reason: 'Vote result not yet stable'
    };
  } catch (error) {
    validatorLogger.error('Error checking vote finalization', { error: error.message });
    return {
      canFinalize: false,
      reason: 'Error checking finalization status'
    };
  }
}

export default {
  validateVoteByRegion,
  canFinalizeVote
};
