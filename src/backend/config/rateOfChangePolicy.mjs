/**
 * Rate-of-Change Policy Configuration
 * 
 * ⚠️ GOVERNANCE: These are POLICY choices, not physics constants
 * 
 * PHYSICS (locked):
 * - Position/velocity/acceleration exist as timebox derivatives
 * - Velocity-aware reality is recorded
 * - Materiality can be triggered by rate
 * 
 * POLICY (versioned, tunable):
 * - ERI formula weights
 * - Materiality rate thresholds
 * - Volatility classification boundaries
 * 
 * Policy changes require:
 * - Version increment
 * - Governance approval
 * - Migration path for existing data
 */

import logger from '../utils/logging/logger.mjs';

const policyLogger = logger.child({ module: 'rate-of-change-policy' });

/**
 * Rate-of-Change Policy Registry
 * 
 * Manages versioned policy configurations for rate-based calculations
 */
export class RateOfChangePolicy {
  constructor() {
    // Current active policy version
    this.activeVersion = 'v1.0.0';
    
    // Policy version registry
    this.policyVersions = new Map();
    
    // Register default policies
    this.registerPolicy('v1.0.0', this.getDefaultPolicyV1());
    
    policyLogger.info('✅ Rate-of-Change Policy initialized', {
      activeVersion: this.activeVersion,
      availableVersions: Array.from(this.policyVersions.keys())
    });
  }

  /**
   * Default Policy v1.0.0
   * 
   * Initial policy configuration (subject to governance changes)
   */
  getDefaultPolicyV1() {
    return {
      version: 'v1.0.0',
      effectiveDate: '2026-01-31',
      approvedBy: 'CANON',
      description: 'Initial rate-of-change policy (tunable parameters)',
      
      // ========== ERI FORMULA WEIGHTS ==========
      // ⚠️ POLICY: These weights are tunable, not physics constants
      eriWeights: {
        distance: 0.40,      // 40% weight for spatial distance from core
        velocity: 0.40,      // 40% weight for rate of divergence
        acceleration: 0.20,  // 20% weight for change in rate
        
        // Rationale: Equal emphasis on position and velocity,
        // with acceleration as early warning indicator
        rationale: 'Balanced approach: position and velocity equally important, acceleration for early detection'
      },

      // ========== MATERIALITY RATE THRESHOLDS ==========
      // ⚠️ POLICY: These percentages are tunable, not physics constants
      materialityThresholds: {
        draft: 0.01,       // < 1% change per hour → stay in DRAFT
        propose: 0.05,     // 1-5% change per hour → PROPOSE
        commit: 0.10,      // 5-10% change per hour → COMMIT
        urgent: 0.20,      // > 20% change per hour → URGENT_COMMIT
        
        // Rationale: Conservative thresholds for stable operations,
        // escalating urgency for rapid change
        rationale: 'Conservative defaults suitable for most coordination contexts'
      },

      // ========== VOLATILITY CLASSIFICATION ==========
      // ⚠️ POLICY: These boundaries are tunable, not physics constants
      volatilityBoundaries: {
        low: 0.00001,      // < 36 votes/hour (baseline)
        moderate: 0.00005, // < 180 votes/hour (increased activity)
        high: 0.0001,      // < 360 votes/hour (rapid change)
        // Above high = CRITICAL
        
        rationale: 'Boundaries calibrated for voting systems, may need adjustment for other domains'
      },

      // ========== VOLATILITY MULTIPLIERS ==========
      // ⚠️ POLICY: How volatility adjusts thresholds (tunable)
      volatilityMultipliers: {
        STABLE: 1.0,       // Normal thresholds
        MODERATE: 0.8,     // 20% lower threshold (commit sooner)
        HIGH: 0.6,         // 40% lower threshold (commit much sooner)
        CRITICAL: 0.4,     // 60% lower threshold (commit almost immediately)
        
        rationale: 'Adaptive thresholds: higher volatility → lower materiality bar → faster commits'
      },

      // ========== COMMIT CADENCE RECOMMENDATIONS ==========
      // ⚠️ POLICY: Suggested time intervals (tunable)
      commitCadence: {
        STABLE: {
          maxDraftTime: 3600000,      // 1 hour
          checkInterval: 600000,      // 10 minutes
          description: 'Low pressure - infrequent commits acceptable'
        },
        MODERATE: {
          maxDraftTime: 1800000,      // 30 minutes
          checkInterval: 300000,      // 5 minutes
          description: 'Moderate pressure - commit regularly'
        },
        HIGH: {
          maxDraftTime: 600000,       // 10 minutes
          checkInterval: 120000,      // 2 minutes
          description: 'High pressure - commit frequently'
        },
        CRITICAL: {
          maxDraftTime: 300000,       // 5 minutes
          checkInterval: 60000,       // 1 minute
          description: 'Critical pressure - commit almost immediately'
        }
      }
    };
  }

  /**
   * Register a policy version
   * 
   * @param {string} version - Semantic version (e.g., 'v1.0.0')
   * @param {Object} policy - Policy configuration
   */
  registerPolicy(version, policy) {
    this.policyVersions.set(version, policy);
    policyLogger.info('✅ Policy version registered', {
      version,
      effectiveDate: policy.effectiveDate,
      approvedBy: policy.approvedBy
    });
  }

  /**
   * Set active policy version
   * 
   * @param {string} version - Version to activate
   */
  setActiveVersion(version) {
    if (!this.policyVersions.has(version)) {
      throw new Error(`Policy version ${version} not found`);
    }
    
    const oldVersion = this.activeVersion;
    this.activeVersion = version;
    
    policyLogger.info('✅ Active policy version changed', {
      from: oldVersion,
      to: version
    });
  }

  /**
   * Get active policy
   * 
   * @returns {Object} Current active policy configuration
   */
  getActivePolicy() {
    return this.policyVersions.get(this.activeVersion);
  }

  /**
   * Get specific policy version
   * 
   * @param {string} version - Version to retrieve
   * @returns {Object} Policy configuration
   */
  getPolicy(version) {
    return this.policyVersions.get(version);
  }

  /**
   * Get all available policy versions
   * 
   * @returns {Array<string>} List of version identifiers
   */
  getAvailableVersions() {
    return Array.from(this.policyVersions.keys());
  }

  /**
   * Get ERI weights from active policy
   * 
   * @returns {Object} ERI formula weights
   */
  getERIWeights() {
    return this.getActivePolicy().eriWeights;
  }

  /**
   * Get materiality thresholds from active policy
   * 
   * @returns {Object} Materiality rate thresholds
   */
  getMaterialityThresholds() {
    return this.getActivePolicy().materialityThresholds;
  }

  /**
   * Get volatility boundaries from active policy
   * 
   * @returns {Object} Volatility classification boundaries
   */
  getVolatilityBoundaries() {
    return this.getActivePolicy().volatilityBoundaries;
  }

  /**
   * Get volatility multipliers from active policy
   * 
   * @returns {Object} Volatility threshold multipliers
   */
  getVolatilityMultipliers() {
    return this.getActivePolicy().volatilityMultipliers;
  }

  /**
   * Get commit cadence recommendations from active policy
   * 
   * @returns {Object} Cadence recommendations by volatility level
   */
  getCommitCadence() {
    return this.getActivePolicy().commitCadence;
  }

  /**
   * Propose new policy version
   * 
   * @param {string} version - New version identifier
   * @param {Object} policy - New policy configuration
   * @param {string} proposedBy - Who proposed this change
   * @returns {Object} Proposal details
   */
  proposePolicy(version, policy, proposedBy) {
    // Validate policy structure
    const requiredKeys = [
      'version', 'effectiveDate', 'approvedBy', 'description',
      'eriWeights', 'materialityThresholds', 'volatilityBoundaries',
      'volatilityMultipliers', 'commitCadence'
    ];

    for (const key of requiredKeys) {
      if (!policy[key]) {
        throw new Error(`Policy proposal missing required key: ${key}`);
      }
    }

    // Mark as proposed (not yet approved)
    policy.status = 'PROPOSED';
    policy.proposedBy = proposedBy;
    policy.proposedDate = new Date().toISOString();

    policyLogger.info('📋 New policy version proposed', {
      version,
      proposedBy,
      changes: this.comparePolicies(this.getActivePolicy(), policy)
    });

    return {
      version,
      policy,
      status: 'PROPOSED',
      requiresApproval: true
    };
  }

  /**
   * Compare two policy versions
   * 
   * @param {Object} oldPolicy - Previous policy
   * @param {Object} newPolicy - New policy
   * @returns {Object} Differences
   */
  comparePolicies(oldPolicy, newPolicy) {
    const changes = {
      eriWeights: {},
      materialityThresholds: {},
      volatilityBoundaries: {},
      volatilityMultipliers: {}
    };

    // Compare ERI weights
    for (const key in newPolicy.eriWeights) {
      if (oldPolicy.eriWeights[key] !== newPolicy.eriWeights[key]) {
        changes.eriWeights[key] = {
          old: oldPolicy.eriWeights[key],
          new: newPolicy.eriWeights[key]
        };
      }
    }

    // Compare materiality thresholds
    for (const key in newPolicy.materialityThresholds) {
      if (oldPolicy.materialityThresholds[key] !== newPolicy.materialityThresholds[key]) {
        changes.materialityThresholds[key] = {
          old: oldPolicy.materialityThresholds[key],
          new: newPolicy.materialityThresholds[key]
        };
      }
    }

    // Compare volatility boundaries
    for (const key in newPolicy.volatilityBoundaries) {
      if (oldPolicy.volatilityBoundaries[key] !== newPolicy.volatilityBoundaries[key]) {
        changes.volatilityBoundaries[key] = {
          old: oldPolicy.volatilityBoundaries[key],
          new: newPolicy.volatilityBoundaries[key]
        };
      }
    }

    // Compare volatility multipliers
    for (const key in newPolicy.volatilityMultipliers) {
      if (oldPolicy.volatilityMultipliers[key] !== newPolicy.volatilityMultipliers[key]) {
        changes.volatilityMultipliers[key] = {
          old: oldPolicy.volatilityMultipliers[key],
          new: newPolicy.volatilityMultipliers[key]
        };
      }
    }

    return changes;
  }
}

// Singleton instance
export default new RateOfChangePolicy();
