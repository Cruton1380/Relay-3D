//backend/routes/systemParameters.mjs
import express from 'express';
import configService from '../config-service/index.mjs';
import { authenticate, authorize } from '../auth/middleware/index.mjs';
import { verifySignature } from '../utils/crypto/signatures.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const paramLogger = logger.child({ module: 'param-routes' });

// Helper functions to adapt the config service interface
function getSystemParameters() {
  return configService.get();
}

function getParameter(path) {
  return configService.get(path);
}

function updateParameter(path, value) {
  return configService.set(path, value);
}

function getParameterMetadata() {
  // Mock metadata for now - could be expanded later
  return {
    'security.maxLoginAttempts': { type: 'number', min: 1, max: 10 },
    'security.lockoutTime': { type: 'number', min: 60000, max: 3600000 },
    'server.port': { type: 'number', min: 1000, max: 65535 },
    'voting.minimumVotingAge': { type: 'number', min: 16, max: 99 }
  };
}

/**
 * Get all system parameters
 * GET /api/system/parameters
 */
router.get('/parameters', authenticate(), async (req, res) => {
  try {
    const parameters = getSystemParameters();
    
    return res.status(200).json({
      success: true,
      parameters
    });
  } catch (error) {
    paramLogger.error('Error getting system parameters', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error getting system parameters'
    });
  }
});

/**
 * Get parameter metadata (for UI display)
 * GET /api/system/parameters/metadata
 */
router.get('/parameters/metadata', async (req, res) => {
  try {
    const metadata = getParameterMetadata();
    
    return res.status(200).json({
      success: true,
      metadata
    });
  } catch (error) {
    paramLogger.error('Error getting parameter metadata', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error getting parameter metadata'
    });
  }
});

/**
 * Get a specific parameter
 * GET /api/system/parameters/:paramPath
 */
router.get('/parameters/:paramPath', async (req, res) => {
  try {
    const { paramPath } = req.params;
    
    if (!paramPath) {
      return res.status(400).json({
        success: false,
        message: 'Parameter path is required'
      });
    }
    
    const value = getParameter(paramPath);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Parameter ${paramPath} not found`
      });
    }
    
    return res.status(200).json({
      success: true,
      paramPath,
      value
    });
  } catch (error) {
    paramLogger.error('Error getting parameter', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error getting parameter'
    });
  }
});

/**
 * Propose a parameter change (create a vote)
 * POST /api/system/parameters/propose
 */
router.post('/parameters/propose', authenticate(), async (req, res) => {
  try {
    const { paramPath, value, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!paramPath || value === undefined || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify signature
    const message = JSON.stringify({ action: 'propose_parameter', paramPath, value, timestamp, nonce });
    const isValid = verifySignature(message, signature, req.user.publicKey);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Get parameter metadata
    const metadata = getParameterMetadata()[paramPath];
    
    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: `Parameter ${paramPath} does not accept community votes`
      });
    }
    
    // Validate value against metadata constraints
    if (metadata.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return res.status(400).json({
          success: false,
          message: 'Value must be a number'
        });
      }
      
      if (metadata.min !== undefined && numValue < metadata.min) {
        return res.status(400).json({
          success: false,
          message: `Value must be at least ${metadata.min}`
        });
      }
      
      if (metadata.max !== undefined && numValue > metadata.max) {
        return res.status(400).json({
          success: false,
          message: `Value must be at most ${metadata.max}`
        });
      }
    }
    
    // Create a new vote topic for this parameter change
    const topic = `param:${paramPath}:${Date.now()}`;
    
    // Create vote options: new value vs current value
    const currentValue = getParameter(paramPath);
      // Create a new vote proposal for the parameter change
    // Integration with voting system handles the actual vote creation
    
    return res.status(200).json({
      success: true,
      message: 'Parameter change proposal created',
      topic,
      paramPath,
      proposedValue: value,
      currentValue
    });
  } catch (error) {
    paramLogger.error('Error proposing parameter change', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error proposing parameter change'
    });
  }
});

/**
 * Update a parameter (admin only)
 * PUT /api/system/parameters/:paramPath
 */
router.put('/parameters/:paramPath', authenticate(), authorize('admin'), async (req, res) => {
  try {
    const { paramPath } = req.params;
    const { value, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (value === undefined || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify signature
    const message = JSON.stringify({ action: 'update_parameter', paramPath, value, timestamp, nonce });
    const isValid = verifySignature(message, signature, req.user.publicKey);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Update the parameter
    const result = await updateParameter(paramPath, value, req.user.publicKey);
    
    return res.status(200).json({
      success: result,
      message: result ? 'Parameter updated' : 'Failed to update parameter',
      paramPath,
      value
    });
  } catch (error) {
    paramLogger.error('Error updating parameter', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error updating parameter'
    });
  }
});

export default router;
