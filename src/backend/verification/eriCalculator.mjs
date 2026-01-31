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

const eriLogger = logger.child({ module: 'eri-calculator' });

export class ERICalculator {
  constructor() {
    this.git = simpleGit(process.cwd());
  }

  /**
   * Calculate ERI for a vote based on its spatial context
   * 
   * @param {Object} context - Vote context
   * @param {string} context.branchId - Current branch
   * @param {string} context.coreId - Canonical core (usually 'main')
   * @param {string} context.topicId - Topic being voted on
   * @param {string} context.ringId - Ring scope
   * @returns {Promise<number>} ERI score (0-100)
   */
  async calculateVoteERI(context) {
    const { branchId = 'main', coreId = 'main', topicId, ringId } = context;

    try {
      // If already at core, ERI = 100
      if (branchId === coreId) {
        return 100;
      }

      // Calculate divergence components
      const divergenceDepth = await this.getDivergenceDepth(branchId, coreId);
      const conflictCount = await this.getConflictCount(branchId, coreId);
      const timeElapsed = await this.getTimeSinceBranch(branchId, coreId);
      const attestationCount = await this.getAttestationCount(topicId);

      // ERI formula: Start at 100, subtract divergence factors
      let eri = 100;

      // Divergence depth penalty (each commit = -2 points, max -40)
      eri -= Math.min(divergenceDepth * 2, 40);

      // Conflict penalty (each conflict = -5 points, max -30)
      eri -= Math.min(conflictCount * 5, 30);

      // Time penalty (stale branches lose confidence)
      const daysElapsed = timeElapsed / (24 * 60 * 60 * 1000);
      eri -= Math.min(daysElapsed * 0.5, 20); // -0.5 per day, max -20

      // Attestation bonus (more votes = higher confidence)
      eri += Math.min(attestationCount * 0.1, 10); // +0.1 per vote, max +10

      // Clamp to 0-100 range
      return Math.max(0, Math.min(100, eri));

    } catch (error) {
      eriLogger.error('ERI calculation failed:', error);
      return 50; // Default to middle if calculation fails
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
