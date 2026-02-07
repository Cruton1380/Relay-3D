//backend/api/globalParametersApi.mjs
/**
 * Global Parameters API
 * Handles endpoints for managing system-wide parameters
 */

import logger from '../utils/logging/logger.mjs';
import configService from '../config-service/index.mjs';
import { createError } from '../utils/common/errors.mjs';

// Default global parameter manager implementation
const defaultGlobalParameterManager = {
  getAllParameters() {
    return configService.get(); // Get entire config object
  },
  getParameter(key) {
    return configService.get(key);
  },
  setParameter(key, value) {
    return configService.set(key, value);
  },
  validateParameter(key, value) {
    // Basic validation - can be enhanced
    if (key && value !== undefined && value !== null) {
      return true;
    }
    return false;
  },
  voteOnParameter(userId, paramName, value, reliability) {
    // Mock implementation
    return {
      success: true,
      paramName,
      value,
      votes: 1,
      required: 3
    };
  },
  getVotingStatus(paramName) {
    // Mock implementation
    return {
      paramName,
      votes: 0,
      required: 3,
      proposals: []
    };
  }
};

// Use global manager if available (for testing), otherwise use default
function getGlobalParameterManager() {
  return global.globalParameterManager || defaultGlobalParameterManager;
}

// Create global parameters logger
const globalParamLogger = logger.child({ module: 'global-parameters-api' });

/**
 * Get all global parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllGlobalParameters(req, res) {
  try {
    const parameters = getGlobalParameterManager().getAllParameters();
    
    return res.json({
      success: true,
      parameters
    });
  } catch (error) {
    globalParamLogger.error('Error fetching global parameters', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch global parameters'
    });
  }
}

/**
 * Get a specific global parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getGlobalParameter(req, res) {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Parameter name is required'
      });
    }
    
    const value = getGlobalParameterManager().getParameter(key);
    
    if (value === undefined || value === null) {
      return res.status(404).json({
        success: false,
        error: `Parameter ${key} not found`
      });
    }
    
    return res.json({
      success: true,
      key,
      value
    });
  } catch (error) {
    globalParamLogger.error('Error fetching global parameter', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch global parameter'
    });
  }
}

/**
 * Vote on a global parameter change
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function voteOnGlobalParameter(req, res) {
  try {
    const { userId, reliability } = req.user;
    const { paramName, value } = req.body;
    
    if (!paramName || value === undefined) {
      throw createError('validation', 'Parameter name and value are required');
    }
    
    // Process the vote
    const result = await getGlobalParameterManager().voteOnParameter(
      userId,
      paramName,
      value,
      reliability || 1.0
    );
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    globalParamLogger.error('Error voting on global parameter', { error: error.message });
    
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process vote on global parameter'
    });
  }
}

/**
 * Get voting status for a global parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getGlobalParameterVotingStatus(req, res) {
  try {
    const { paramName } = req.params;
    
    if (!paramName) {
      throw createError('validation', 'Parameter name is required');
    }
    
    const status = getGlobalParameterManager().getVotingStatus(paramName);
    
    return res.json({
      success: true,
      ...status
    });
  } catch (error) {
    globalParamLogger.error('Error fetching global parameter voting status', { error: error.message });
    
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch global parameter voting status'
    });
  }
}

/**
 * Update a global parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateGlobalParameter(req, res) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Parameter name is required'
      });
    }
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Parameter value is required'
      });
    }

    // Validate the parameter
    try {
      const isValid = getGlobalParameterManager().validateParameter(key, value);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed'
        });
      }
    } catch (validationError) {
      // If validation throws an error, re-throw it to be caught by outer catch
      throw validationError;
    }
    
    // Set the parameter
    getGlobalParameterManager().setParameter(key, value);
    
    globalParamLogger.info(`Updated global parameter ${key}`, { value });
    
    return res.json({
      success: true,
      key,
      value
    });
  } catch (error) {
    globalParamLogger.error('Error updating global parameter', { error: error.message });
    
    if (error.message === 'Parameter not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update global parameter'
    });
  }
}
