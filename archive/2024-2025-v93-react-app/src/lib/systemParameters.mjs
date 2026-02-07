/**
 * System Parameters Configuration
 * Contains global system parameters for the Relay platform
 */

export const DEFAULT_SYSTEM_PARAMETERS = {
  // Token calculation parameters
  baseTokenReward: 10,
  qualityMultiplier: 1.2,
  consistencyBonus: 0.5,
  participationThreshold: 50,
  
  // Governance parameters
  minimumVotingTokens: 100,
  proposalThreshold: 1000,
  quorumPercentage: 0.51,
  votingPeriodDays: 7,
  
  // Economic parameters
  inflationRate: 0.02,
  burnRate: 0.01,
  stakingRewardRate: 0.05,
  
  // Security parameters
  maxProposalsPerUser: 5,
  cooldownPeriodHours: 24,
  
  // Privacy parameters
  anonymityThreshold: 100,
  privacyLevel: 'high',
  
  // Network parameters
  maxPeers: 50,
  proximityRadius: 1000, // meters
  connectionTimeout: 30000, // milliseconds
  
  // Performance parameters
  cacheTimeout: 300000, // 5 minutes
  batchSize: 100,
  rateLimitPerMinute: 60
};

/**
 * Get system parameters with optional overrides
 * @param {Object} overrides - Optional parameter overrides
 * @returns {Promise<Object>} System parameters object
 */
export async function getSystemParameters(overrides = {}) {
  try {
    // In a real implementation, this might load from database, config file, or environment
    const params = {
      ...DEFAULT_SYSTEM_PARAMETERS,
      ...overrides
    };
    
    // Validate critical parameters
    if (params.quorumPercentage < 0 || params.quorumPercentage > 1) {
      throw new Error('Quorum percentage must be between 0 and 1');
    }
    
    if (params.minimumVotingTokens < 0) {
      throw new Error('Minimum voting tokens must be non-negative');
    }
    
    return params;
  } catch (error) {
    console.error('Error loading system parameters:', error);
    return DEFAULT_SYSTEM_PARAMETERS;
  }
}

/**
 * Update system parameters (admin function)
 * @param {Object} newParams - New parameter values
 * @returns {Promise<boolean>} Success status
 */
export async function updateSystemParameters(newParams) {
  try {
    // In a real implementation, this would save to persistent storage
    // For now, just validate the parameters
    const updated = await getSystemParameters(newParams);
    console.log('System parameters updated:', updated);
    return true;
  } catch (error) {
    console.error('Error updating system parameters:', error);
    return false;
  }
}

/**
 * Get specific parameter value
 * @param {string} paramName - Parameter name
 * @param {*} defaultValue - Default value if parameter not found
 * @returns {Promise<*>} Parameter value
 */
export async function getParameter(paramName, defaultValue = null) {
  const params = await getSystemParameters();
  return params[paramName] ?? defaultValue;
}

export default {
  getSystemParameters,
  updateSystemParameters,
  getParameter,
  DEFAULT_SYSTEM_PARAMETERS
};
