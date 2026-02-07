/**
 * @fileoverview Smart verification trigger system that determines when additional verification is needed
 * Integrates with risk assessment engine to provide adaptive security
 */
import logger from '../utils/logging/logger.mjs';
import { checkVerificationRequired, VERIFICATION_LEVELS } from './riskAssessmentEngine.mjs';
import { generatePasswordDanceChallenge } from '../auth/utils/passwordDanceMFA.mjs';
import { createError } from '../utils/common/errors.mjs';

const triggerLogger = logger.child({ module: 'verification-triggers' });

/**
 * Session tracking for rate limiting verification requests
 */
class VerificationTracker {
  constructor() {
    this.userSessions = new Map(); // userId -> session data
    this.verificationHistory = new Map(); // userId -> verification history
  }

  /**
   * Track verification request to prevent excessive re-verification
   */
  trackVerification(userId, level, success) {
    const now = Date.now();
    const history = this.verificationHistory.get(userId) || [];
    
    history.push({
      timestamp: now,
      level,
      success,
      id: `${userId}-${now}`
    });

    // Keep only last 24 hours of history
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp > dayAgo);
    
    this.verificationHistory.set(userId, recentHistory);
  }

  /**
   * Check if user has been verified recently for this level
   */
  hasRecentVerification(userId, level) {
    const history = this.verificationHistory.get(userId) || [];
    const now = Date.now();
    
    // Time limits for different verification levels
    const timeLimits = {
      [VERIFICATION_LEVELS.LIGHT]: 60 * 60 * 1000,    // 1 hour
      [VERIFICATION_LEVELS.MEDIUM]: 4 * 60 * 60 * 1000, // 4 hours
      [VERIFICATION_LEVELS.STRONG]: 24 * 60 * 60 * 1000  // 24 hours
    };

    const timeLimit = timeLimits[level] || timeLimits[VERIFICATION_LEVELS.LIGHT];
    
    return history.some(h => 
      h.level === level && 
      h.success && 
      (now - h.timestamp) < timeLimit
    );
  }

  /**
   * Get recent failed verification attempts
   */
  getRecentFailures(userId) {
    const history = this.verificationHistory.get(userId) || [];
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    return history.filter(h => 
      !h.success && 
      (now - h.timestamp) < hourAgo
    ).length;
  }
}

const verificationTracker = new VerificationTracker();

/**
 * Check if verification is required for the current user action
 * @param {string} userId - User ID
 * @param {Object} actionContext - Context of the current action
 * @returns {Promise<Object>} Verification requirement result
 */
export async function checkVerificationTrigger(userId, actionContext) {
  try {
    triggerLogger.debug('Checking verification trigger', { userId, action: actionContext.action });

    // Build current behavior profile from action context
    const currentBehavior = buildBehaviorProfile(actionContext);

    // Get risk assessment
    const riskAssessment = await checkVerificationRequired(userId, currentBehavior);
    
    // Check if user has been verified recently for this level
    if (riskAssessment.required) {
      const hasRecentVerification = verificationTracker.hasRecentVerification(
        userId, 
        riskAssessment.level
      );
      
      if (hasRecentVerification) {
        triggerLogger.debug('Recent verification found, skipping trigger', { 
          userId, 
          level: riskAssessment.level 
        });
        
        return {
          required: false,
          reason: 'recently_verified',
          level: riskAssessment.level,
          message: 'Recently verified for this security level'
        };
      }
    }

    // Check for too many recent failures
    const recentFailures = verificationTracker.getRecentFailures(userId);
    if (recentFailures >= 3) {
      triggerLogger.warn('Too many recent verification failures', { userId, failures: recentFailures });
      
      return {
        required: true,
        level: VERIFICATION_LEVELS.STRONG,
        riskScore: 1.0,
        message: 'Multiple recent verification failures - enhanced security required',
        factors: ['repeated_failures'],
        rateLimited: true
      };
    }

    // Return the risk assessment result
    const result = {
      required: riskAssessment.required,
      level: riskAssessment.level,
      riskScore: riskAssessment.riskScore,
      message: riskAssessment.message,
      factors: riskAssessment.factors,
      timestamp: riskAssessment.timestamp
    };

    triggerLogger.info('Verification trigger checked', { 
      userId, 
      required: result.required, 
      level: result.level,
      riskScore: result.riskScore
    });

    return result;
  } catch (error) {
    triggerLogger.error('Error checking verification trigger', { 
      userId, 
      error: error.message 
    });
    
    // Default to light verification on error
    return {
      required: true,
      level: VERIFICATION_LEVELS.LIGHT,
      riskScore: 0.4,
      message: 'Verification required due to system error',
      factors: ['system_error']
    };
  }
}

/**
 * Generate appropriate verification challenge based on trigger result
 * @param {string} userId - User ID
 * @param {Object} triggerResult - Result from checkVerificationTrigger
 * @returns {Promise<Object>} Verification challenge
 */
export async function generateVerificationChallenge(userId, triggerResult) {
  try {
    if (!triggerResult.required) {
      return { required: false, message: 'No verification needed' };
    }

    triggerLogger.info('Generating verification challenge', { 
      userId, 
      level: triggerResult.level 
    });

    // Generate challenge based on verification level
    const challenge = await createLeveledChallenge(userId, triggerResult.level, triggerResult.factors);
    
    // Add user-friendly context
    challenge.context = {
      riskScore: triggerResult.riskScore,
      message: triggerResult.message,
      factors: triggerResult.factors,
      level: triggerResult.level,
      estimatedTime: getEstimatedTime(triggerResult.level),
      userOptions: getUserOptions(triggerResult.level)
    };

    triggerLogger.debug('Verification challenge generated', { 
      userId, 
      challengeType: challenge.type,
      factorCount: challenge.requiredFactors?.length || 0
    });

    return challenge;
  } catch (error) {
    triggerLogger.error('Error generating verification challenge', { 
      userId, 
      error: error.message 
    });
    throw createError('processing', 'Failed to generate verification challenge', { cause: error });
  }
}

/**
 * Process verification response and update tracking
 * @param {string} userId - User ID
 * @param {Object} challenge - Original challenge
 * @param {Object} response - User's verification response
 * @returns {Promise<Object>} Verification result
 */
export async function processVerificationResponse(userId, challenge, response) {
  try {
    triggerLogger.debug('Processing verification response', { userId, challengeId: challenge.id });

    // Use existing Password Dance verification
    const { verifyPasswordDanceResponse } = await import('../auth/utils/passwordDanceMFA.mjs');
    const verificationResult = await verifyPasswordDanceResponse(challenge, response);

    // Track the verification attempt
    verificationTracker.trackVerification(
      userId, 
      challenge.context?.level || VERIFICATION_LEVELS.LIGHT,
      verificationResult.verified
    );

    // Add additional context to result
    const result = {
      ...verificationResult,
      level: challenge.context?.level,
      timestamp: new Date().toISOString(),
      userId
    };

    triggerLogger.info('Verification response processed', { 
      userId, 
      verified: result.verified, 
      level: result.level 
    });

    return result;
  } catch (error) {
    triggerLogger.error('Error processing verification response', { 
      userId, 
      error: error.message 
    });
    
    // Track as failed verification
    verificationTracker.trackVerification(
      userId, 
      challenge.context?.level || VERIFICATION_LEVELS.LIGHT,
      false
    );

    throw createError('processing', 'Failed to process verification response', { cause: error });
  }
}

/**
 * Build behavior profile from action context
 * @param {Object} actionContext - Context of current action
 * @returns {Object} Behavior profile for risk assessment
 */
function buildBehaviorProfile(actionContext) {
  return {
    loginTime: actionContext.timestamp || Date.now(),
    device: {
      screenResolution: actionContext.device?.screenResolution,
      browserFamily: actionContext.device?.browserFamily,
      timezone: actionContext.device?.timezone,
      language: actionContext.device?.language
    },
    patterns: {
      typingSpeed: actionContext.patterns?.typingSpeed,
      clickInterval: actionContext.patterns?.clickInterval,
      navigationSequence: actionContext.patterns?.navigationSequence
    },
    action: actionContext.action,
    context: {
      firstTimeAction: actionContext.firstTimeAction,
      highValue: actionContext.highValue,
      adminPrivileges: actionContext.adminPrivileges
    },
    location: {
      timezone: actionContext.device?.timezone,
      country: actionContext.location?.country
    }
  };
}

/**
 * Create verification challenge appropriate for the risk level
 * @param {string} userId - User ID
 * @param {string} level - Verification level
 * @param {Array} factors - Risk factors that triggered verification
 * @returns {Promise<Object>} Tailored verification challenge
 */
async function createLeveledChallenge(userId, level, factors) {
  const baseChallenge = await generatePasswordDanceChallenge(userId);
  
  // Customize challenge based on level
  switch (level) {
    case VERIFICATION_LEVELS.LIGHT:
      return createLightChallenge(baseChallenge, factors);
      
    case VERIFICATION_LEVELS.MEDIUM:
      return createMediumChallenge(baseChallenge, factors);
      
    case VERIFICATION_LEVELS.STRONG:
      return createStrongChallenge(baseChallenge, factors);
      
    default:
      return baseChallenge;
  }
}

/**
 * Create light verification challenge (single factor)
 */
function createLightChallenge(baseChallenge, factors) {
  // For light verification, offer user choice of single factor
  const options = [];
  
  if (baseChallenge.challenges?.biometric) {
    options.push({
      type: 'biometric',
      method: 'smile',
      description: 'Smile at the camera',
      estimatedTime: '30 seconds'
    });
  }
  
  options.push({
    type: 'password',
    method: 'password',
    description: 'Enter your password',
    estimatedTime: '15 seconds'
  });

  return {
    ...baseChallenge,
    type: 'light_verification',
    options,
    userChoice: true,
    requiredCount: 1,
    instructions: 'Please choose one verification method:'
  };
}

/**
 * Create medium verification challenge (multiple factors)
 */
function createMediumChallenge(baseChallenge, factors) {
  const requiredFactors = ['device'];
  
  // Add biometric if available
  if (baseChallenge.challenges?.biometric) {
    requiredFactors.push('biometric');
  } else {
    requiredFactors.push('password');
  }

  return {
    ...baseChallenge,
    type: 'medium_verification',
    requiredFactors,
    instructions: 'Please complete all verification steps:'
  };
}

/**
 * Create strong verification challenge (full Password Dance)
 */
function createStrongChallenge(baseChallenge, factors) {
  return {
    ...baseChallenge,
    type: 'strong_verification',
    requiredFactors: baseChallenge.requiredFactors || ['biometric', 'device', 'activity'],
    instructions: 'Enhanced security verification required. Please complete all challenges:'
  };
}

/**
 * Get estimated time for verification level
 */
function getEstimatedTime(level) {
  const times = {
    [VERIFICATION_LEVELS.LIGHT]: '30 seconds',
    [VERIFICATION_LEVELS.MEDIUM]: '2 minutes',
    [VERIFICATION_LEVELS.STRONG]: '5 minutes'
  };
  return times[level] || '1 minute';
}

/**
 * Get user options description for verification level
 */
function getUserOptions(level) {
  const options = {
    [VERIFICATION_LEVELS.LIGHT]: 'Choose any one verification method',
    [VERIFICATION_LEVELS.MEDIUM]: 'Complete password/biometric + device verification',
    [VERIFICATION_LEVELS.STRONG]: 'Complete full security verification sequence'
  };
  return options[level] || 'Complete required verification';
}

export default {
  checkVerificationTrigger,
  generateVerificationChallenge,
  processVerificationResponse
};
