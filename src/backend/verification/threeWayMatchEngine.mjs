/**
 * Three-Way Match Engine
 * 
 * Verifies Intent/Reality/Projection consistency.
 * Core mechanism for 3D cognitive verification.
 */

import logger from '../utils/logging/logger.mjs';

const matchLogger = logger.child({ module: 'three-way-match' });

export class ThreeWayMatchEngine {
  /**
   * Verify three-way match for a vote
   * 
   * @param {Object} components - Intent, Reality, Projection
   * @param {Object} components.intent - What user intended
   * @param {Object} components.reality - What actually happened  
   * @param {Object} components.projection - What effect it will have
   * @returns {Promise<Object>} Match result with confidence score
   */
  async verify(components) {
    const { intent, reality, projection } = components;

    try {
      // Calculate confidence for each dimension
      const intentConfidence = this.verifyIntent(intent);
      const realityConfidence = this.verifyReality(reality);
      const projectionConfidence = this.verifyProjection(projection);

      // Check for mismatches
      const mismatches = this.detectMismatches(intent, reality, projection);

      // Overall confidence is minimum of three (weakest link)
      const overallConfidence = Math.min(
        intentConfidence,
        realityConfidence,
        projectionConfidence
      );

      // Determine if match is valid
      const isValid = overallConfidence >= 0.70 && mismatches.length === 0;

      const result = {
        valid: isValid,
        confidence: overallConfidence,
        dimensions: {
          intent: intentConfidence,
          reality: realityConfidence,
          projection: projectionConfidence
        },
        mismatches,
        timestamp: Date.now()
      };

      if (!isValid) {
        matchLogger.warn('Three-way match failed', result);
      }

      return result;

    } catch (error) {
      matchLogger.error('Three-way match verification failed:', error);
      return {
        valid: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Verify intent dimension
   */
  verifyIntent(intent) {
    let confidence = 1.0;

    // Check if intent is well-formed
    if (!intent.action || !intent.target) {
      confidence *= 0.5;
    }

    // Check if intent is explicit
    if (!intent.expectedOutcome) {
      confidence *= 0.9;
    }

    return confidence;
  }

  /**
   * Verify reality dimension
   */
  verifyReality(reality) {
    let confidence = 1.0;

    // Check if reality observation is complete
    if (!reality.timestamp) {
      confidence *= 0.8;
    }

    // Check if action actually happened
    if (!reality.voteCast) {
      confidence = 0; // Critical failure
    }

    // Check encryption status
    if (!reality.encryptionApplied) {
      confidence *= 0.95; // Slight penalty
    }

    return confidence;
  }

  /**
   * Verify projection dimension
   */
  verifyProjection(projection) {
    let confidence = 1.0;

    // Check if projection is available
    if (projection.confidenceLevel === undefined) {
      confidence *= 0.8;
    }

    // Use projection's own confidence if available
    if (projection.confidenceLevel !== undefined) {
      confidence *= projection.confidenceLevel;
    }

    return confidence;
  }

  /**
   * Detect mismatches between dimensions
   */
  detectMismatches(intent, reality, projection) {
    const mismatches = [];

    // Intent vs Reality mismatch
    if (intent.action === 'vote' && !reality.voteCast) {
      mismatches.push({
        type: 'intent_reality_mismatch',
        description: 'Intended to vote but vote was not cast',
        severity: 'critical'
      });
    }

    // Reality vs Projection mismatch
    if (reality.voteCast && !projection.rankingWillChange) {
      mismatches.push({
        type: 'reality_projection_mismatch',
        description: 'Vote cast but will not affect ranking',
        severity: 'warning'
      });
    }

    // Intent vs Projection mismatch
    if (intent.expectedOutcome === 'ranking_update' && !projection.rankingWillChange) {
      mismatches.push({
        type: 'intent_projection_mismatch',
        description: 'Expected ranking update but projection shows no change',
        severity: 'warning'
      });
    }

    return mismatches;
  }

  /**
   * Get mismatch severity level
   */
  getMismatchSeverity(mismatches) {
    if (mismatches.some(m => m.severity === 'critical')) {
      return 'critical';
    } else if (mismatches.some(m => m.severity === 'warning')) {
      return 'warning';
    } else {
      return 'none';
    }
  }
}
