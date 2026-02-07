// src/backend/routes/userPreferences.mjs
/**
 * User Preferences API Routes
 * Handles user privacy settings and preferences
 */

import express from 'express';
import { 
  getUserPreferences,
  updateUserPreferences,
  getUserPrivacyLevel,
  setUserPrivacyLevel,
  getDefaultPrivacyLevel,
  getValidPrivacyLevels
} from '../services/userPreferencesService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const prefsLogger = logger.child({ module: 'user-preferences-api' });

/**
 * GET /api/user/preferences/:userId
 * Get all preferences for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const preferences = await getUserPreferences(userId);
    
    prefsLogger.debug('User preferences retrieved', { userId });
    
    res.json({
      success: true,
      privacyLevel: preferences.privacyLevel,
      preferences
    });
  } catch (error) {
    prefsLogger.error('Failed to get user preferences', {
      userId: req.params.userId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user preferences'
    });
  }
});

/**
 * PUT /api/user/preferences/:userId
 * Update user preferences
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Validate privacy level if provided
    if (updates.privacyLevel) {
      const validLevels = getValidPrivacyLevels();
      if (!validLevels.includes(updates.privacyLevel)) {
        return res.status(400).json({
          success: false,
          error: `Invalid privacy level. Must be one of: ${validLevels.join(', ')}`
        });
      }
    }
    
    await updateUserPreferences(userId, updates);
    
    prefsLogger.info('User preferences updated', { userId, updates });
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: await getUserPreferences(userId)
    });
  } catch (error) {
    prefsLogger.error('Failed to update user preferences', {
      userId: req.params.userId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/preferences/:userId/privacy
 * Get user's privacy level only
 */
router.get('/:userId/privacy', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const privacyLevel = await getUserPrivacyLevel(userId);
    
    res.json({
      success: true,
      privacyLevel
    });
  } catch (error) {
    prefsLogger.error('Failed to get privacy level', {
      userId: req.params.userId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve privacy level',
      privacyLevel: getDefaultPrivacyLevel()
    });
  }
});

/**
 * PUT /api/user/preferences/:userId/privacy
 * Update user's privacy level only
 */
router.put('/:userId/privacy', async (req, res) => {
  try {
    const { userId } = req.params;
    const { privacyLevel } = req.body;
    
    if (!privacyLevel) {
      return res.status(400).json({
        success: false,
        error: 'Privacy level is required'
      });
    }
    
    const validLevels = getValidPrivacyLevels();
    if (!validLevels.includes(privacyLevel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid privacy level. Must be one of: ${validLevels.join(', ')}`
      });
    }
    
    await setUserPrivacyLevel(userId, privacyLevel);
    
    prefsLogger.info('Privacy level updated', { userId, privacyLevel });
    
    res.json({
      success: true,
      message: 'Privacy level updated successfully',
      privacyLevel
    });
  } catch (error) {
    prefsLogger.error('Failed to update privacy level', {
      userId: req.params.userId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/preferences/defaults
 * Get default preferences and valid options
 */
router.get('/defaults', async (req, res) => {
  res.json({
    success: true,
    defaults: {
      privacyLevel: getDefaultPrivacyLevel()
    },
    validOptions: {
      privacyLevels: getValidPrivacyLevels()
    }
  });
});

export default router;
