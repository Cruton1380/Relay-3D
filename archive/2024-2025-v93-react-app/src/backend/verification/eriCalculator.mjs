/**
 * ERI Calculator - Exposure Readiness Index
 * 
 * Calculates distance from canonical core using radial reconciliation model.
 * ERI is NOT a security score - it's a distance measurement.
 * 
 * 0   = Maximum divergence (far from core)
 * 100 = At canonical core (reconciled)
 */

import simpleGit from 'simple-git';
import logger from '../utils/logging/logger.mjs';
import rateOfChangePolicy from '../config/rateOfChangePolicy.mjs';

const eriLogger = logger.child({ module: 'eri-calculator' });

export class ERICalculator {
  constructor() {
    this.git = simpleGit(process.cwd());
  }

  /**
   * Calculate ERI for a vote based on its spatial context
   * 
   * ✅ ARCHITECTURE@C18: Now includes rate-of-change (velocity) component
   * 
   * Canonical formula:
   * ERI = f(distance from core, velocity of divergence, acceleration)
   * Weight: 40% distance, 40% velocity, 20% acceleration
   * 
   * @param {Object} context - Vote context
   * @param {string} context.branchId - Current branch
   * @param {string} context.coreId - Canonical core (usually 'main')
   * @param {string} context.topicId - Topic being voted on
   * @param {string} context.ringId - Ring scope
   * @param {Object} context.rateOfChange - Rate-of-change data from TransitioningReality
   * @returns {Promise<Object>} ERI result with breakdown
   */
  async calculateVoteERI(context) {
    const { 
      branchId = 'main', 
      coreId = 'main', 
      topicId, 
      ringId,
      rateOfChange = null 
    } = context;

    try {
      // If already at core with no volatility, ERI = 100
      if (branchId === coreId && (!rateOfChange || rateOfChange.volatility === 'STABLE')) {
        return {
          eri: 100,
          distance: 0,
          velocity: 0,
          acceleration: 0,
          urgency: 'NONE',
          breakdown: {
            distanceComponent: 100,
            velocityComponent: 100,
            accelerationComponent: 100
          }
        };
      }

      // ========== DISTANCE COMPONENT (40% weight) ==========
      // Calculate spatial divergence from canonical core
      const divergenceDepth = await this.getDivergenceDepth(branchId, coreId);
      const conflictCount = await this.getConflictCount(branchId, coreId);
      const timeElapsed = await this.getTimeSinceBranch(branchId, coreId);
      const attestationCount = await this.getAttestationCount(topicId);

      // Distance score: Start at 100, subtract divergence factors
      let distanceScore = 100;
      distanceScore -= Math.min(divergenceDepth * 2, 40);  // Commit depth penalty
      distanceScore -= Math.min(conflictCount * 5, 30);    // Conflict penalty
      const daysElapsed = timeElapsed / (24 * 60 * 60 * 1000);
      distanceScore -= Math.min(daysElapsed * 0.5, 20);    // Staleness penalty
      distanceScore += Math.min(attestationCount * 0.1, 10); // Attestation bonus
      distanceScore = Math.max(0, Math.min(100, distanceScore));

      // ========== VELOCITY COMPONENT (40% weight) ==========
      // ✅ ARCHITECTURE@C18: Rate of change from timebox physics
      let velocityScore = 100;
      let velocityPenalty = 0;
      
      if (rateOfChange) {
        // Penalty based on volatility level
        switch (rateOfChange.volatility) {
          case 'CRITICAL':
            velocityPenalty = 60; // Rapid change = high pressure
            break;
          case 'HIGH':
            velocityPenalty = 40; // Significant change
            break;
          case 'MODERATE':
            velocityPenalty = 20; // Some change
            break;
          case 'STABLE':
            velocityPenalty = 0;  // Stable = no penalty
            break;
        }
        
        // Additional penalty for high absolute rate
        const absoluteRate = Math.abs(rateOfChange.ratePerHour);
        if (absoluteRate > 100) {
          velocityPenalty += Math.min((absoluteRate - 100) * 0.1, 20);
        }
        
        velocityScore = Math.max(0, 100 - velocityPenalty);
      }

      // ========== ACCELERATION COMPONENT (20% weight) ==========
      // ✅ ARCHITECTURE@C18: Change in rate (second derivative)
      let accelerationScore = 100;
      let accelerationPenalty = 0;
      
      if (rateOfChange && rateOfChange.acceleration) {
        const absAcceleration = Math.abs(rateOfChange.acceleration);
        
        // Penalty for rapid acceleration/deceleration
        if (absAcceleration > 0.00001) {
          accelerationPenalty = Math.min(absAcceleration * 1000000, 50);
        }
        
        // Extra penalty if accelerating toward volatility
        if (rateOfChange.acceleration > 0 && rateOfChange.direction === 'INCREASING') {
          accelerationPenalty += 20; // Speeding up divergence = dangerous
        }
        
        accelerationScore = Math.max(0, 100 - accelerationPenalty);
      }

      // ========== WEIGHTED ERI CALCULATION ==========
      // ⚠️ POLICY: Weights are configurable (not physics constants)
      const weights = rateOfChangePolicy.getERIWeights();
      const eri = (
        distanceScore * weights.distance +
        velocityScore * weights.velocity +
        accelerationScore * weights.acceleration
      );

      // ========== URGENCY CLASSIFICATION ==========
      // Critical: branch far from core AND rapidly diverging
      // High: either far OR rapidly diverging
      // Medium: moderate distance or moderate velocity
      // Low: stable and near core
      let urgency = 'NONE';
      
      if (distanceScore < 50 || velocityScore < 50) {
        urgency = 'CRITICAL'; // Emergency reconciliation needed
      } else if (distanceScore < 70 || velocityScore < 70) {
        urgency = 'HIGH'; // Reconciliation needed soon
      } else if (distanceScore < 85 || velocityScore < 85) {
        urgency = 'MEDIUM'; // Monitor closely
      } else {
        urgency = 'LOW'; // Healthy state
      }

      return {
        eri: Math.round(eri),
        distance: divergenceDepth,
        velocity: rateOfChange ? rateOfChange.ratePerHour : 0,
        acceleration: rateOfChange ? rateOfChange.acceleration : 0,
        urgency,
        breakdown: {
          distanceComponent: Math.round(distanceScore),
          velocityComponent: Math.round(velocityScore),
          accelerationComponent: Math.round(accelerationScore),
          distanceWeight: weights.distance,
          velocityWeight: weights.velocity,
          accelerationWeight: weights.acceleration,
          policyVersion: rateOfChangePolicy.activeVersion
        },
        volatility: rateOfChange ? rateOfChange.volatility : 'STABLE',
        direction: rateOfChange ? rateOfChange.direction : 'STABLE'
      };

    } catch (error) {
      eriLogger.error('ERI calculation failed:', error);
      return {
        eri: 50,
        distance: 0,
        velocity: 0,
        acceleration: 0,
        urgency: 'UNKNOWN',
        breakdown: {
          distanceComponent: 50,
          velocityComponent: 50,
          accelerationComponent: 50
        },
        error: error.message
      };
    }
  }

  /**
   * Get divergence depth (commits since branch point)
   */
  async getDivergenceDepth(branchId, coreId) {
    try {
      const log = await this.git.log({ from: coreId, to: branchId });
      return log.total || 0;
    } catch (error) {
      eriLogger.warn('Could not calculate divergence depth:', error);
      return 0;
    }
  }

  /**
   * Get unresolved conflict count
   */
  async getConflictCount(branchId, coreId) {
    try {
      // Attempt merge preview to detect conflicts
      const status = await this.git.status();
      return status.conflicted?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get time since branch creation
   */
  async getTimeSinceBranch(branchId, coreId) {
    try {
      const log = await this.git.log({ from: coreId, to: branchId, maxCount: 1 });
      if (log.latest) {
        return Date.now() - new Date(log.latest.date).getTime();
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get attestation count (vote count for topic)
   */
  async getAttestationCount(topicId) {
    // Integration point with existing voting system
    // TODO: Query actual vote counts from .relay/query.mjs
    return 0; // Placeholder
  }

  /**
   * Calculate ERI for an entire ring (basin)
   */
  async calculateRingERI(ringId) {
    // Average ERI across all topics in the ring
    const topics = await this.getRingTopics(ringId);
    
    if (topics.length === 0) return 100;

    const eriScores = await Promise.all(
      topics.map(topic => this.calculateVoteERI({
        branchId: topic.branchId || 'main',
        coreId: 'main',
        topicId: topic.id,
        ringId
      }))
    );

    const avgERI = eriScores.reduce((sum, eri) => sum + eri, 0) / eriScores.length;
    return Math.round(avgERI);
  }

  /**
   * Get topics within a ring
   */
  async getRingTopics(ringId) {
    // Integration point with existing channel system
    // TODO: Query topics scoped to ring
    return []; // Placeholder
  }

  /**
   * Get ERI display state (for UI)
   */
  getERIDisplayState(eri) {
    if (eri >= 85) {
      return {
        state: 'VERIFIED',
        color: 'green',
        icon: '✅',
        message: 'Verified - at canonical core'
      };
    } else if (eri >= 70) {
      return {
        state: 'DEGRADED',
        color: 'yellow',
        icon: '⚠️',
        message: 'Degraded - moderate divergence from core'
      };
    } else {
      return {
        state: 'INDETERMINATE',
        color: 'gray',
        icon: '❓',
        message: 'Indeterminate - cannot verify state'
      };
    }
  }
}
