/**
 * @fileoverview Behavioral baseline service for collecting and managing user behavioral patterns
 * This service handles the creation, storage, and analysis of behavioral baselines during onboarding
 */
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import crypto from 'crypto';

const behavioralLogger = logger.child({ module: 'behavioral-baseline' });

/**
 * Store for behavioral baselines (in production, this would be a proper database)
 */
class BehavioralBaselineStore {
  constructor() {
    this.baselines = new Map(); // userId -> baseline data
  }

  async storeBaseline(userId, baseline) {
    this.baselines.set(userId, {
      ...baseline,
      createdAt: new Date().toISOString(),
      version: '1.0'
    });
  }

  async getBaseline(userId) {
    return this.baselines.get(userId);
  }

  async updateBaseline(userId, updates) {
    const existing = this.baselines.get(userId);
    if (existing) {
      this.baselines.set(userId, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  }

  async deleteBaseline(userId) {
    return this.baselines.delete(userId);
  }
}

const baselineStore = new BehavioralBaselineStore();

/**
 * Collect behavioral baseline data during onboarding
 * @param {string} userId - User ID
 * @param {Object} gestureData - Data from Password Dance baseline collection
 * @returns {Promise<Object>} Baseline creation result
 */
export async function createBehavioralBaseline(userId, gestureData) {
  try {
    behavioralLogger.info('Creating behavioral baseline', { userId });

    // Analyze gesture data to create baseline patterns
    const baseline = {
      gesturePatterns: analyzeGesturePatterns(gestureData.gestures || []),
      typingRhythm: analyzeTypingRhythm(gestureData.typing || {}),
      interactionTiming: analyzeInteractionTiming(gestureData.interactions || []),
      devicePreferences: extractDevicePreferences(gestureData.device || {}),
      strengthScore: 0 // Will be calculated based on data quality
    };

    // Calculate baseline strength score
    baseline.strengthScore = calculateBaselineStrength(baseline);

    // Store the baseline securely (hashed patterns, not raw data)
    const hashedBaseline = hashBehavioralPatterns(baseline);
    await baselineStore.storeBaseline(userId, hashedBaseline);

    behavioralLogger.info('Behavioral baseline created successfully', { 
      userId, 
      strengthScore: baseline.strengthScore 
    });

    return {
      success: true,
      strengthScore: baseline.strengthScore,
      baselineCreated: true
    };
  } catch (error) {
    behavioralLogger.error('Error creating behavioral baseline', { 
      userId, 
      error: error.message 
    });
    throw createError('processing', 'Failed to create behavioral baseline', { cause: error });
  }
}

/**
 * Analyze gesture patterns from Password Dance data
 * @param {Array} gestures - Array of gesture data
 * @returns {Object} Analyzed gesture patterns
 */
function analyzeGesturePatterns(gestures) {
  const patterns = {
    averageResponseTime: 0,
    gestureAccuracy: 0,
    movementSpeed: 0,
    confidenceLevel: 0
  };

  if (gestures.length === 0) {
    return patterns;
  }

  // Calculate average response time
  const responseTimes = gestures.map(g => g.responseTime || 0);
  patterns.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Calculate gesture accuracy
  const accuracyScores = gestures.map(g => g.accuracy || 0);
  patterns.gestureAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;

  // Calculate movement speed (if available)
  const speeds = gestures.map(g => g.speed || 0).filter(s => s > 0);
  if (speeds.length > 0) {
    patterns.movementSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }

  // Calculate confidence level based on consistency
  patterns.confidenceLevel = calculateConsistencyScore(responseTimes);

  return patterns;
}

/**
 * Analyze typing rhythm patterns
 * @param {Object} typingData - Typing data from baseline collection
 * @returns {Object} Typing rhythm patterns
 */
function analyzeTypingRhythm(typingData) {
  const rhythm = {
    averageWPM: 0,
    keyInterval: 0,
    rhythmConsistency: 0,
    errorRate: 0
  };

  if (!typingData.keystrokes || typingData.keystrokes.length === 0) {
    return rhythm;
  }

  // Calculate WPM
  const totalTime = typingData.totalTime || 1;
  const characterCount = typingData.keystrokes.length;
  rhythm.averageWPM = (characterCount / 5) / (totalTime / 60000); // Convert ms to minutes

  // Calculate average key interval
  const intervals = [];
  for (let i = 1; i < typingData.keystrokes.length; i++) {
    intervals.push(typingData.keystrokes[i].timestamp - typingData.keystrokes[i-1].timestamp);
  }
  
  if (intervals.length > 0) {
    rhythm.keyInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    rhythm.rhythmConsistency = calculateConsistencyScore(intervals);
  }

  // Calculate error rate
  const errors = typingData.keystrokes.filter(k => k.isCorrection || k.isBackspace).length;
  rhythm.errorRate = errors / typingData.keystrokes.length;

  return rhythm;
}

/**
 * Analyze interaction timing patterns
 * @param {Array} interactions - Array of interaction data
 * @returns {Object} Interaction timing patterns
 */
function analyzeInteractionTiming(interactions) {
  const timing = {
    averageClickInterval: 0,
    scrollSpeed: 0,
    navigationPattern: '',
    interactionConsistency: 0
  };

  if (interactions.length === 0) {
    return timing;
  }

  // Calculate click intervals
  const clickIntervals = [];
  for (let i = 1; i < interactions.length; i++) {
    if (interactions[i].type === 'click' && interactions[i-1].type === 'click') {
      clickIntervals.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }
  }

  if (clickIntervals.length > 0) {
    timing.averageClickInterval = clickIntervals.reduce((a, b) => a + b, 0) / clickIntervals.length;
    timing.interactionConsistency = calculateConsistencyScore(clickIntervals);
  }

  // Analyze scroll events
  const scrollEvents = interactions.filter(i => i.type === 'scroll');
  if (scrollEvents.length > 0) {
    const scrollSpeeds = scrollEvents.map(s => Math.abs(s.deltaY || 0));
    timing.scrollSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
  }

  // Determine navigation pattern
  const navigationSequence = interactions
    .filter(i => i.type === 'navigation')
    .map(i => i.target)
    .join(' -> ');
  timing.navigationPattern = hashString(navigationSequence);

  return timing;
}

/**
 * Extract device preference patterns
 * @param {Object} deviceData - Device data from baseline collection
 * @returns {Object} Device preference patterns
 */
function extractDevicePreferences(deviceData) {
  return {
    screenResolution: deviceData.screenWidth && deviceData.screenHeight ? 
      `${deviceData.screenWidth}x${deviceData.screenHeight}` : '',
    browserFamily: deviceData.userAgent ? extractBrowserFamily(deviceData.userAgent) : '',
    timezone: deviceData.timezone || '',
    language: deviceData.language || '',
    deviceType: deviceData.deviceType || 'unknown',
    inputMethods: deviceData.inputMethods || []
  };
}

/**
 * Calculate consistency score for a series of timing values
 * @param {Array} values - Array of numeric values
 * @returns {number} Consistency score (0-1, higher is more consistent)
 */
function calculateConsistencyScore(values) {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower std dev = higher consistency)
  const coefficientOfVariation = standardDeviation / mean;
  return Math.max(0, 1 - coefficientOfVariation);
}

/**
 * Calculate overall baseline strength score
 * @param {Object} baseline - Complete baseline data
 * @returns {number} Strength score (0-100)
 */
function calculateBaselineStrength(baseline) {
  let score = 0;
  
  // Gesture quality (25 points)
  if (baseline.gesturePatterns.confidenceLevel > 0.7) score += 25;
  else if (baseline.gesturePatterns.confidenceLevel > 0.5) score += 15;
  else if (baseline.gesturePatterns.confidenceLevel > 0.3) score += 10;
  
  // Typing rhythm quality (25 points)
  if (baseline.typingRhythm.rhythmConsistency > 0.7) score += 25;
  else if (baseline.typingRhythm.rhythmConsistency > 0.5) score += 15;
  else if (baseline.typingRhythm.rhythmConsistency > 0.3) score += 10;
  
  // Interaction consistency (25 points)
  if (baseline.interactionTiming.interactionConsistency > 0.7) score += 25;
  else if (baseline.interactionTiming.interactionConsistency > 0.5) score += 15;
  else if (baseline.interactionTiming.interactionConsistency > 0.3) score += 10;
  
  // Device data completeness (25 points)
  let deviceScore = 0;
  if (baseline.devicePreferences.screenResolution) deviceScore += 5;
  if (baseline.devicePreferences.browserFamily) deviceScore += 5;
  if (baseline.devicePreferences.timezone) deviceScore += 5;
  if (baseline.devicePreferences.language) deviceScore += 5;
  if (baseline.devicePreferences.deviceType !== 'unknown') deviceScore += 5;
  score += deviceScore;
  
  return Math.min(100, score);
}

/**
 * Hash behavioral patterns for secure storage
 * @param {Object} baseline - Raw baseline data
 * @returns {Object} Hashed baseline data
 */
function hashBehavioralPatterns(baseline) {
  // Create hashed versions of sensitive data
  return {
    gesturePatterns: {
      // Store pattern characteristics, not raw values
      responseTimeCategory: categorizeResponseTime(baseline.gesturePatterns.averageResponseTime),
      accuracyLevel: categorizeAccuracy(baseline.gesturePatterns.gestureAccuracy),
      speedCategory: categorizeSpeed(baseline.gesturePatterns.movementSpeed),
      consistencyLevel: baseline.gesturePatterns.confidenceLevel
    },
    typingRhythm: {
      wpmCategory: categorizeWPM(baseline.typingRhythm.averageWPM),
      intervalCategory: categorizeInterval(baseline.typingRhythm.keyInterval),
      consistencyLevel: baseline.typingRhythm.rhythmConsistency,
      errorRateCategory: categorizeErrorRate(baseline.typingRhythm.errorRate)
    },
    interactionTiming: {
      clickSpeedCategory: categorizeInterval(baseline.interactionTiming.averageClickInterval),
      scrollSpeedCategory: categorizeSpeed(baseline.interactionTiming.scrollSpeed),
      navigationPatternHash: baseline.interactionTiming.navigationPattern,
      consistencyLevel: baseline.interactionTiming.interactionConsistency
    },
    devicePreferences: baseline.devicePreferences, // These are already non-sensitive
    strengthScore: baseline.strengthScore,
    createdAt: new Date().toISOString()
  };
}

/**
 * Helper functions for categorizing values
 */
function categorizeResponseTime(time) {
  if (time < 1000) return 'fast';
  if (time < 3000) return 'medium';
  return 'slow';
}

function categorizeAccuracy(accuracy) {
  if (accuracy > 0.9) return 'high';
  if (accuracy > 0.7) return 'medium';
  return 'low';
}

function categorizeSpeed(speed) {
  if (speed < 100) return 'slow';
  if (speed < 300) return 'medium';
  return 'fast';
}

function categorizeWPM(wpm) {
  if (wpm < 30) return 'slow';
  if (wpm < 60) return 'medium';
  if (wpm < 90) return 'fast';
  return 'very_fast';
}

function categorizeInterval(interval) {
  if (interval < 200) return 'fast';
  if (interval < 500) return 'medium';
  return 'slow';
}

function categorizeErrorRate(rate) {
  if (rate < 0.05) return 'low';
  if (rate < 0.15) return 'medium';
  return 'high';
}

/**
 * Utility functions
 */
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

function extractBrowserFamily(userAgent) {
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  return 'other';
}

/**
 * Get behavioral baseline for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User's behavioral baseline or null
 */
export async function getBehavioralBaseline(userId) {
  try {
    return await baselineStore.getBaseline(userId);
  } catch (error) {
    behavioralLogger.error('Error getting behavioral baseline', { 
      userId, 
      error: error.message 
    });
    return null;
  }
}

/**
 * Update behavioral baseline with new data
 * @param {string} userId - User ID
 * @param {Object} updates - Baseline updates
 * @returns {Promise<boolean>} Success status
 */
export async function updateBehavioralBaseline(userId, updates) {
  try {
    await baselineStore.updateBaseline(userId, updates);
    behavioralLogger.info('Behavioral baseline updated', { userId });
    return true;
  } catch (error) {
    behavioralLogger.error('Error updating behavioral baseline', { 
      userId, 
      error: error.message 
    });
    return false;
  }
}

/**
 * Delete behavioral baseline for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteBehavioralBaseline(userId) {
  try {
    const deleted = await baselineStore.deleteBaseline(userId);
    behavioralLogger.info('Behavioral baseline deleted', { userId, deleted });
    return deleted;
  } catch (error) {
    behavioralLogger.error('Error deleting behavioral baseline', { 
      userId, 
      error: error.message 
    });
    return false;
  }
}

export default {
  createBehavioralBaseline,
  getBehavioralBaseline,
  updateBehavioralBaseline,
  deleteBehavioralBaseline
};
