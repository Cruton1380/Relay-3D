/**
 * @fileoverview Risk assessment engine for calculating anomaly scores and triggering appropriate verification levels
 * This service analyzes current behavior against user baselines to determine verification requirements
 */
import logger from '../utils/logging/logger.mjs';
import { getBehavioralBaseline } from './behavioralBaselineService.mjs';
import { createError } from '../utils/common/errors.mjs';

const riskLogger = logger.child({ module: 'risk-assessment' });

/**
 * Risk thresholds for different verification levels
 */
export const RISK_THRESHOLDS = {
  LOW_RISK: 0.3,      // No additional verification needed
  MEDIUM_RISK: 0.6,   // Light verification required
  HIGH_RISK: 0.8,     // Strong verification required
  CRITICAL_RISK: 1.0  // Account protection mode
};

/**
 * Verification levels based on risk scores
 */
export const VERIFICATION_LEVELS = {
  NONE: 'none',
  LIGHT: 'light',
  MEDIUM: 'medium', 
  STRONG: 'strong',
  CRITICAL: 'critical'
};

/**
 * Calculate comprehensive risk score for current user behavior
 * @param {string} userId - User ID
 * @param {Object} currentBehavior - Current session behavior data
 * @returns {Promise<Object>} Risk assessment result
 */
export async function calculateRiskScore(userId, currentBehavior) {
  try {
    riskLogger.debug('Calculating risk score', { userId });

    // Get user's behavioral baseline
    const baseline = await getBehavioralBaseline(userId);
    if (!baseline) {
      // New user or no baseline - moderate risk
      return {
        riskScore: 0.4,
        level: VERIFICATION_LEVELS.MEDIUM,
        factors: ['no_baseline'],
        message: 'No behavioral baseline found'
      };
    }

    // Calculate individual risk factors
    const timeRisk = calculateTimeBasedRisk(currentBehavior.loginTime, baseline);
    const deviceRisk = calculateDeviceRisk(currentBehavior.device, baseline);
    const behaviorRisk = calculateBehavioralRisk(currentBehavior.patterns, baseline);
    const actionRisk = calculateActionRisk(currentBehavior.action, currentBehavior.context);
    const locationRisk = calculateLocationRisk(currentBehavior.location, baseline);

    // Weighted risk calculation
    const weights = {
      time: 0.15,      // 15% - Time patterns
      device: 0.35,    // 35% - Device consistency (highest weight)
      behavior: 0.25,  // 25% - Behavioral patterns
      action: 0.15,    // 15% - Action context
      location: 0.10   // 10% - Location patterns
    };

    const riskScore = (
      timeRisk * weights.time +
      deviceRisk * weights.device +
      behaviorRisk * weights.behavior +
      actionRisk * weights.action +
      locationRisk * weights.location
    );

    // Determine verification level
    const level = determineVerificationLevel(riskScore);
    
    // Collect risk factors for transparency
    const factors = collectRiskFactors({
      timeRisk,
      deviceRisk, 
      behaviorRisk,
      actionRisk,
      locationRisk
    });

    const result = {
      riskScore: Math.min(1.0, riskScore), // Cap at 1.0
      level,
      factors,
      message: generateRiskMessage(level, factors),
      timestamp: new Date().toISOString()
    };

    riskLogger.info('Risk score calculated', { 
      userId, 
      riskScore: result.riskScore, 
      level: result.level,
      factorCount: factors.length
    });

    return result;
  } catch (error) {
    riskLogger.error('Error calculating risk score', { 
      userId, 
      error: error.message 
    });
    
    // Default to medium risk on error
    return {
      riskScore: 0.5,
      level: VERIFICATION_LEVELS.MEDIUM,
      factors: ['calculation_error'],
      message: 'Risk calculation error - defaulting to medium security'
    };
  }
}

/**
 * Calculate time-based risk factors
 * @param {number} currentTime - Current login time (timestamp)
 * @param {Object} baseline - User's behavioral baseline
 * @returns {number} Risk score (0-1)
 */
function calculateTimeBasedRisk(currentTime, baseline) {
  if (!currentTime || !baseline.typicalTimes) {
    return 0.2; // Slight risk for missing data
  }

  const currentHour = new Date(currentTime).getHours();
  const typicalHours = baseline.typicalTimes || [];
  
  // Check if current hour is within typical usage patterns
  const isTypicalTime = typicalHours.some(hour => 
    Math.abs(currentHour - hour) <= 2 // Within 2 hours of typical time
  );

  if (isTypicalTime) {
    return 0.0; // No risk
  }

  // Calculate how far outside typical times
  const minDistance = Math.min(...typicalHours.map(hour => 
    Math.min(Math.abs(currentHour - hour), 24 - Math.abs(currentHour - hour))
  ));

  // Risk increases with distance from typical times
  return Math.min(0.8, minDistance / 12); // Max 0.8 risk for time
}

/**
 * Calculate device-based risk factors
 * @param {Object} currentDevice - Current device information
 * @param {Object} baseline - User's behavioral baseline
 * @returns {number} Risk score (0-1)
 */
function calculateDeviceRisk(currentDevice, baseline) {
  if (!currentDevice || !baseline.devicePreferences) {
    return 0.4; // Medium risk for missing device data
  }

  let risk = 0;
  const devicePrefs = baseline.devicePreferences;

  // Check screen resolution
  if (currentDevice.screenResolution !== devicePrefs.screenResolution) {
    risk += 0.3; // Different screen = potential new device
  }

  // Check browser family
  if (currentDevice.browserFamily !== devicePrefs.browserFamily) {
    risk += 0.4; // Different browser = higher risk
  }

  // Check timezone
  if (currentDevice.timezone !== devicePrefs.timezone) {
    risk += 0.2; // Different timezone = travel or location change
  }

  // Check language
  if (currentDevice.language !== devicePrefs.language) {
    risk += 0.1; // Different language = possible compromise
  }

  return Math.min(1.0, risk);
}

/**
 * Calculate behavioral pattern risk factors
 * @param {Object} currentPatterns - Current behavioral patterns
 * @param {Object} baseline - User's behavioral baseline
 * @returns {number} Risk score (0-1)
 */
function calculateBehavioralRisk(currentPatterns, baseline) {
  if (!currentPatterns || !baseline.gesturePatterns || !baseline.typingRhythm) {
    return 0.3; // Medium risk for missing behavioral data
  }

  let risk = 0;
  
  // Check typing speed deviation
  if (currentPatterns.typingSpeed && baseline.typingRhythm.wpmCategory) {
    const speedDeviation = calculateSpeedDeviation(
      currentPatterns.typingSpeed, 
      baseline.typingRhythm.wpmCategory
    );
    risk += speedDeviation * 0.4; // Up to 0.4 risk for typing speed
  }

  // Check interaction timing
  if (currentPatterns.clickInterval && baseline.interactionTiming.clickSpeedCategory) {
    const timingDeviation = calculateTimingDeviation(
      currentPatterns.clickInterval,
      baseline.interactionTiming.clickSpeedCategory
    );
    risk += timingDeviation * 0.3; // Up to 0.3 risk for timing
  }

  // Check navigation patterns
  if (currentPatterns.navigationSequence && baseline.interactionTiming.navigationPatternHash) {
    const navDeviation = calculateNavigationDeviation(
      currentPatterns.navigationSequence,
      baseline.interactionTiming.navigationPatternHash
    );
    risk += navDeviation * 0.3; // Up to 0.3 risk for navigation
  }

  return Math.min(1.0, risk);
}

/**
 * Calculate action-based risk factors
 * @param {string} action - Current action being performed
 * @param {Object} context - Action context
 * @returns {number} Risk score (0-1)
 */
function calculateActionRisk(action, context) {
  const actionRiskLevels = {
    'login': 0.0,
    'browse': 0.0,
    'profile_view': 0.05,
    'settings_change': 0.1,
    'vote': 0.15,
    'proposal_create': 0.2,
    'large_transaction': 0.25,
    'admin_action': 0.3
  };

  const baseRisk = actionRiskLevels[action] || 0.1;
  
  // Increase risk for unusual context
  let contextRisk = 0;
  if (context?.firstTimeAction) contextRisk += 0.1;
  if (context?.highValue) contextRisk += 0.15;
  if (context?.adminPrivileges) contextRisk += 0.2;

  return Math.min(1.0, baseRisk + contextRisk);
}

/**
 * Calculate location-based risk factors
 * @param {Object} currentLocation - Current location info (timezone, etc.)
 * @param {Object} baseline - User's behavioral baseline
 * @returns {number} Risk score (0-1)
 */
function calculateLocationRisk(currentLocation, baseline) {
  if (!currentLocation || !baseline.devicePreferences) {
    return 0.1; // Low risk for missing location data
  }

  let risk = 0;

  // Check timezone changes
  if (currentLocation.timezone !== baseline.devicePreferences.timezone) {
    // Different timezone could indicate travel or VPN
    risk += 0.3;
  }

  // Check if IP range is dramatically different (country-level)
  if (currentLocation.country && baseline.location?.country) {
    if (currentLocation.country !== baseline.location.country) {
      risk += 0.4; // Different country = higher risk
    }
  }

  return Math.min(1.0, risk);
}

/**
 * Helper functions for calculating deviations
 */
function calculateSpeedDeviation(currentWPM, baselineCategory) {
  const categoryRanges = {
    'slow': [0, 30],
    'medium': [30, 60], 
    'fast': [60, 90],
    'very_fast': [90, 200]
  };

  const range = categoryRanges[baselineCategory] || [30, 60];
  const [min, max] = range;

  if (currentWPM >= min && currentWPM <= max) {
    return 0; // Within expected range
  }

  // Calculate how far outside the range
  const distance = currentWPM < min ? min - currentWPM : currentWPM - max;
  return Math.min(1.0, distance / 30); // Normalize to 0-1
}

function calculateTimingDeviation(currentInterval, baselineCategory) {
  const categoryRanges = {
    'fast': [0, 200],
    'medium': [200, 500],
    'slow': [500, 2000]
  };

  const range = categoryRanges[baselineCategory] || [200, 500];
  const [min, max] = range;

  if (currentInterval >= min && currentInterval <= max) {
    return 0;
  }

  const distance = currentInterval < min ? min - currentInterval : currentInterval - max;
  return Math.min(1.0, distance / 300);
}

function calculateNavigationDeviation(currentNav, baselineHash) {
  // Simple hash comparison - in production, this would be more sophisticated
  const currentHash = hashNavigationSequence(currentNav);
  return currentHash === baselineHash ? 0 : 0.5;
}

/**
 * Determine verification level based on risk score
 * @param {number} riskScore - Risk score (0-1)
 * @returns {string} Verification level
 */
function determineVerificationLevel(riskScore) {
  if (riskScore < RISK_THRESHOLDS.LOW_RISK) {
    return VERIFICATION_LEVELS.NONE;
  } else if (riskScore < RISK_THRESHOLDS.MEDIUM_RISK) {
    return VERIFICATION_LEVELS.LIGHT;
  } else if (riskScore < RISK_THRESHOLDS.HIGH_RISK) {
    return VERIFICATION_LEVELS.MEDIUM;
  } else {
    return VERIFICATION_LEVELS.STRONG;
  }
}

/**
 * Collect specific risk factors for transparency
 * @param {Object} risks - Individual risk scores
 * @returns {Array} Array of risk factor descriptions
 */
function collectRiskFactors(risks) {
  const factors = [];

  if (risks.timeRisk > 0.3) factors.push('unusual_time');
  if (risks.deviceRisk > 0.3) factors.push('device_change');
  if (risks.behaviorRisk > 0.3) factors.push('behavioral_change');
  if (risks.actionRisk > 0.2) factors.push('high_value_action');
  if (risks.locationRisk > 0.2) factors.push('location_change');

  return factors;
}

/**
 * Generate user-friendly risk message
 * @param {string} level - Verification level
 * @param {Array} factors - Risk factors
 * @returns {string} User-friendly message
 */
function generateRiskMessage(level, factors) {
  const messages = {
    [VERIFICATION_LEVELS.NONE]: 'Normal activity detected',
    [VERIFICATION_LEVELS.LIGHT]: 'Minor security check needed',
    [VERIFICATION_LEVELS.MEDIUM]: 'Unusual activity detected - verification required',
    [VERIFICATION_LEVELS.STRONG]: 'Multiple security concerns - enhanced verification needed'
  };

  let message = messages[level] || 'Security verification required';

  // Add specific factor explanations
  if (factors.includes('device_change')) {
    message += ' (new device detected)';
  } else if (factors.includes('unusual_time')) {
    message += ' (unusual login time)';
  } else if (factors.includes('behavioral_change')) {
    message += ' (different usage patterns)';
  }

  return message;
}

/**
 * Utility function to hash navigation sequences
 * @param {string} sequence - Navigation sequence
 * @returns {string} Hash of sequence
 */
function hashNavigationSequence(sequence) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sequence || '').digest('hex').substring(0, 16);
}

/**
 * Check if verification is required for current behavior
 * @param {string} userId - User ID
 * @param {Object} currentBehavior - Current behavior data
 * @returns {Promise<Object>} Verification requirement result
 */
export async function checkVerificationRequired(userId, currentBehavior) {
  try {
    const riskAssessment = await calculateRiskScore(userId, currentBehavior);
    
    const verificationRequired = riskAssessment.level !== VERIFICATION_LEVELS.NONE;
    
    return {
      required: verificationRequired,
      level: riskAssessment.level,
      riskScore: riskAssessment.riskScore,
      message: riskAssessment.message,
      factors: riskAssessment.factors,
      timestamp: riskAssessment.timestamp
    };
  } catch (error) {
    riskLogger.error('Error checking verification requirement', { 
      userId, 
      error: error.message 
    });
    
    // Default to requiring light verification on error
    return {
      required: true,
      level: VERIFICATION_LEVELS.LIGHT,
      riskScore: 0.4,
      message: 'Security check required due to system error',
      factors: ['system_error']
    };
  }
}

export default {
  calculateRiskScore,
  checkVerificationRequired,
  RISK_THRESHOLDS,
  VERIFICATION_LEVELS
};
