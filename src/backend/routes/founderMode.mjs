/**
 * @fileoverview Founder Mode API Routes
 * 
 * Routes for managing founder mode configuration and security toggles
 */

import express from 'express';
import { founderModeService } from '../services/founderModeService.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';

const router = express.Router();
const routeLogger = logger.child({ module: 'founder-mode-routes' });

/**
 * Get founder mode status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    const config = founderModeService.getPublicConfig();
    
    res.json({
      success: true,
      config,
      isEnabled: founderModeService.isFounderModeEnabled()
    });
  } catch (error) {
    routeLogger.error('Error getting founder mode status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get founder mode status',
      error: error.message
    });
  }
});

/**
 * Enable founder mode
 */
router.post('/enable', async (req, res) => {
  try {
    const { founderId } = req.body;
    
    if (!founderId) {
      return res.status(400).json({
        success: false,
        message: 'Founder ID is required'
      });
    }
    
    const result = await founderModeService.enableFounderMode(founderId);
    
    routeLogger.info('Founder mode enabled via API', { founderId });
    
    res.json(result);
  } catch (error) {
    routeLogger.error('Error enabling founder mode', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to enable founder mode',
      error: error.message
    });
  }
});

/**
 * Disable founder mode
 */
router.post('/disable', async (req, res) => {
  try {
    const result = await founderModeService.disableFounderMode();
    
    routeLogger.info('Founder mode disabled via API');
    
    res.json(result);
  } catch (error) {
    routeLogger.error('Error disabling founder mode', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to disable founder mode',
      error: error.message
    });
  }
});

/**
 * Toggle security feature
 */
router.post('/toggle/:featureName', async (req, res) => {
  try {
    const { featureName } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean value'
      });
    }
    
    const result = await founderModeService.toggleSecurityFeature(featureName, enabled);
    
    routeLogger.info('Security feature toggled via API', { featureName, enabled });
    
    res.json(result);
  } catch (error) {
    routeLogger.error('Error toggling security feature', { 
      error: error.message, 
      featureName: req.params.featureName 
    });
    
    const statusCode = error.type === 'validation' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

/**
 * Update testing features
 */
router.post('/testing', async (req, res) => {
  try {
    const { features } = req.body;
    
    if (!features || typeof features !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'features object is required'
      });
    }
    
    const result = await founderModeService.updateTestingFeatures(features);
    
    routeLogger.info('Testing features updated via API', { features });
    
    res.json(result);
  } catch (error) {
    routeLogger.error('Error updating testing features', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update testing features',
      error: error.message
    });
  }
});

/**
 * Get onboarding configuration for user
 */
router.get('/onboarding-config/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const config = founderModeService.getOnboardingConfig(userId);
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    routeLogger.error('Error getting onboarding config', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding configuration',
      error: error.message
    });
  }
});

/**
 * Reset configuration to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    const result = await founderModeService.resetToDefaults();
    
    routeLogger.info('Founder mode configuration reset to defaults via API');
    
    res.json(result);
  } catch (error) {
    routeLogger.error('Error resetting founder mode config', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to reset configuration',
      error: error.message
    });
  }
});

/**
 * Bootstrap founder account (first user setup)
 */
router.post('/bootstrap', async (req, res) => {
  try {
    const { userData, biometricData, skipProximity = true } = req.body;
    
    if (!userData || !userData.email) {
      return res.status(400).json({
        success: false,
        message: 'User data with email is required'
      });
    }
    
    // Check if this is truly the first user
    // TODO: Implement user count check
    
    // Enable founder mode for this user
    const founderId = `founder_${Date.now()}`;
    await founderModeService.enableFounderMode(founderId);
    
    // Create founder account with bypassed proximity verification
    const founderAccount = {
      id: founderId,
      ...userData,
      isFounder: true,
      trustLevel: 'founder',
      onboardedAt: new Date().toISOString(),
      proximityBypassed: skipProximity
    };
    
    // If biometric data provided, process it
    if (biometricData) {
      // TODO: Process biometric data
      founderAccount.biometricVerified = true;
    }
    
    routeLogger.info('Founder account bootstrapped', { founderId, email: userData.email });
    
    res.json({
      success: true,
      message: 'Founder account created successfully',
      founderId,
      account: founderAccount,
      founderModeEnabled: true
    });
  } catch (error) {
    routeLogger.error('Error bootstrapping founder account', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to bootstrap founder account',
      error: error.message
    });
  }
});

export default router; 
