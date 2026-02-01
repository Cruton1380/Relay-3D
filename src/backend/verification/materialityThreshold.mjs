/**
 * Materiality Threshold Module
 * 
 * ✅ ARCHITECTURE@C18: Rate-of-Change Based Commit Triggering
 * 
 * Determines when state changes are "material" enough to require a commit.
 * Uses rate-of-change physics to prevent:
 * - Commit spam during stability
 * - Silent drift during volatility
 * 
 * CANONICAL RULE:
 * If Δstate < threshold → stay in DRAFT
 * If Δstate ≥ threshold → PROPOSE / COMMIT
 * 
 * Materiality is NOT "importance"
 * Materiality IS "change magnitude over time"
 */

import logger from '../utils/logging/logger.mjs';
import rateOfChangePolicy from '../config/rateOfChangePolicy.mjs';

const materialityLogger = logger.child({ module: 'materiality-threshold' });

export class MaterialityThreshold {
  constructor(config = {}) {
    // ⚠️ POLICY: Thresholds are now loaded from versioned policy (not hardcoded)
    const policy = rateOfChangePolicy.getActivePolicy();
    
    // Rate-of-change thresholds from policy
    const policyThresholds = policy.materialityThresholds;
    this.thresholds = {
      DRAFT: config.draftThreshold || policyThresholds.draft,
      PROPOSE: config.proposeThreshold || policyThresholds.propose,
      COMMIT: config.commitThreshold || policyThresholds.commit,
      URGENT: config.urgentThreshold || policyThresholds.urgent
    };

    // Volatility-based multipliers from policy
    this.volatilityMultipliers = policy.volatilityMultipliers;

    materialityLogger.info('✅ Materiality Threshold initialized (policy-based)', {
      thresholds: this.thresholds,
      volatilityMultipliers: this.volatilityMultipliers,
      policyVersion: policy.version
    });
  }

  /**
   * Check if a state change crosses the materiality threshold
   * 
   * @param {Object} currentState - Current state snapshot
   * @param {Object} previousState - Previous state snapshot (if exists)
   * @param {number} timeInterval - Time between states (milliseconds)
   * @param {Object} rateOfChange - Rate-of-change data from TransitioningReality
   * @returns {Object} Materiality decision
   */
  checkMateriality(currentState, previousState, timeInterval, rateOfChange) {
    // If no previous state, this is a new entity → always material
    if (!previousState) {
      return {
        action: 'COMMIT',
        reason: 'New entity creation is always material',
        isMaterial: true,
        rate: 0,
        threshold: this.thresholds.DRAFT,
        confidence: 1.0
      };
    }

    // Calculate rate of change if not provided
    if (!rateOfChange || !rateOfChange.rate) {
      const deltaState = this.calculateDelta(currentState, previousState);
      const rate = deltaState / Math.max(1, timeInterval);
      const ratePerHour = rate * 3600000; // Convert to per-hour
      
      rateOfChange = {
        rate,
        ratePerHour,
        deltaState,
        volatility: 'STABLE',
        direction: deltaState > 0 ? 'INCREASING' : deltaState < 0 ? 'DECREASING' : 'STABLE'
      };
    }

    // Apply volatility multiplier to thresholds
    const volatility = rateOfChange.volatility || 'STABLE';
    const multiplier = this.volatilityMultipliers[volatility] || 1.0;

    const adjustedThresholds = {
      DRAFT: this.thresholds.DRAFT * multiplier,
      PROPOSE: this.thresholds.PROPOSE * multiplier,
      COMMIT: this.thresholds.COMMIT * multiplier,
      URGENT: this.thresholds.URGENT * multiplier
    };

    // Convert rate to percentage change per hour
    const ratePerHour = Math.abs(rateOfChange.ratePerHour || 0);
    const percentChangePerHour = ratePerHour; // Assuming rate is already in percentage units

    // Determine action based on thresholds
    let action = 'STAY_DRAFT';
    let reason = 'Below materiality threshold';
    let isMaterial = false;
    let appliedThreshold = adjustedThresholds.DRAFT;

    if (percentChangePerHour >= adjustedThresholds.URGENT) {
      action = 'URGENT_COMMIT';
      reason = `Critical rate of change detected: ${percentChangePerHour.toFixed(2)}/hr (threshold: ${adjustedThresholds.URGENT})`;
      isMaterial = true;
      appliedThreshold = adjustedThresholds.URGENT;
    } else if (percentChangePerHour >= adjustedThresholds.COMMIT) {
      action = 'COMMIT';
      reason = `Material change detected: ${percentChangePerHour.toFixed(2)}/hr (threshold: ${adjustedThresholds.COMMIT})`;
      isMaterial = true;
      appliedThreshold = adjustedThresholds.COMMIT;
    } else if (percentChangePerHour >= adjustedThresholds.PROPOSE) {
      action = 'PROPOSE';
      reason = `Moderate change detected, review needed: ${percentChangePerHour.toFixed(2)}/hr (threshold: ${adjustedThresholds.PROPOSE})`;
      isMaterial = true;
      appliedThreshold = adjustedThresholds.PROPOSE;
    } else if (percentChangePerHour >= adjustedThresholds.DRAFT) {
      action = 'STAY_DRAFT';
      reason = `Minor change detected, staying in DRAFT: ${percentChangePerHour.toFixed(2)}/hr (threshold: ${adjustedThresholds.DRAFT})`;
      isMaterial = false;
      appliedThreshold = adjustedThresholds.DRAFT;
    } else {
      action = 'STAY_DRAFT';
      reason = `Negligible change: ${percentChangePerHour.toFixed(2)}/hr (threshold: ${adjustedThresholds.DRAFT})`;
      isMaterial = false;
      appliedThreshold = adjustedThresholds.DRAFT;
    }

    // Calculate confidence in this decision
    const confidence = this.calculateDecisionConfidence(
      percentChangePerHour,
      appliedThreshold,
      volatility
    );

    materialityLogger.debug('Materiality check', {
      action,
      reason,
      isMaterial,
      rate: percentChangePerHour,
      threshold: appliedThreshold,
      volatility,
      multiplier,
      confidence
    });

    return {
      action,
      reason,
      isMaterial,
      rate: percentChangePerHour,
      threshold: appliedThreshold,
      volatility,
      multiplier,
      confidence,
      rateOfChange
    };
  }

  /**
   * Calculate numeric delta between two states
   * 
   * @param {Object} currentState - Current state
   * @param {Object} previousState - Previous state
   * @returns {number} Magnitude of change
   */
  calculateDelta(currentState, previousState) {
    // If states are primitives, direct comparison
    if (typeof currentState === 'number' && typeof previousState === 'number') {
      return Math.abs(currentState - previousState);
    }

    // If states are objects, calculate aggregate delta
    if (typeof currentState === 'object' && typeof previousState === 'object') {
      let totalDelta = 0;
      const keys = new Set([
        ...Object.keys(currentState),
        ...Object.keys(previousState)
      ]);

      for (const key of keys) {
        const curr = currentState[key] || 0;
        const prev = previousState[key] || 0;
        
        if (typeof curr === 'number' && typeof prev === 'number') {
          totalDelta += Math.abs(curr - prev);
        }
      }

      return totalDelta;
    }

    // Fallback: treat as string comparison
    return currentState === previousState ? 0 : 1;
  }

  /**
   * Calculate confidence in materiality decision
   * 
   * Higher confidence when:
   * - Rate is far from threshold (clear decision)
   * - Volatility is stable (predictable)
   * 
   * Lower confidence when:
   * - Rate is near threshold (ambiguous)
   * - Volatility is high (unpredictable)
   * 
   * @param {number} rate - Current rate of change
   * @param {number} threshold - Applied threshold
   * @param {string} volatility - Volatility level
   * @returns {number} Confidence (0-1)
   */
  calculateDecisionConfidence(rate, threshold, volatility) {
    // Distance from threshold (normalized)
    const distance = Math.abs(rate - threshold) / threshold;
    const proximityFactor = Math.min(distance, 1.0); // Closer to threshold = lower confidence

    // Volatility factor
    const volatilityFactors = {
      STABLE: 1.0,
      MODERATE: 0.8,
      HIGH: 0.6,
      CRITICAL: 0.4
    };
    const volatilityFactor = volatilityFactors[volatility] || 0.5;

    // Combined confidence
    const confidence = (proximityFactor * 0.6) + (volatilityFactor * 0.4);

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Update thresholds dynamically (for tuning)
   * 
   * ⚠️ GOVERNANCE: Consider using rateOfChangePolicy.proposePolicy() instead
   * for tracked, versioned policy changes
   * 
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    materialityLogger.warn('⚠️ Materiality thresholds updated directly (consider policy versioning)', {
      thresholds: this.thresholds
    });
  }

  /**
   * Get current threshold configuration
   * 
   * @returns {Object} Current thresholds and policy version
   */
  getThresholds() {
    return { 
      ...this.thresholds,
      policyVersion: rateOfChangePolicy.activeVersion
    };
  }

  /**
   * Get commit cadence recommendation from policy
   * 
   * @param {string} volatility - Current volatility level
   * @returns {Object} Cadence recommendation
   */
  getCommitCadence(volatility) {
    const policy = rateOfChangePolicy.getActivePolicy();
    return policy.commitCadence[volatility] || policy.commitCadence.STABLE;
  }
}

export default new MaterialityThreshold();
