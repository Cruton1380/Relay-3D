/**
 * Development Routes
 * Routes for testing and development purposes only
 * These routes should be disabled in production
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { clearSessionVotes, initializeState, voteCounts } from '../state/state.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create router
const router = express.Router();

// Helper to check if development mode is enabled
const isDevelopmentMode = () => {
  return process.env.NODE_ENV !== 'production';
};

// Middleware to ensure development mode
const ensureDevelopmentMode = (req, res, next) => {
  if (isDevelopmentMode()) {
    return next();
  }
  return res.status(403).json({ 
    error: 'Development routes are disabled in production mode'
  });
};

// Apply development mode middleware to all routes
router.use(ensureDevelopmentMode);

/**
 * GET /api/dev/status
 * Check development mode status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    mode: process.env.NODE_ENV || 'development',
    features: {
      testVoting: true,
      mockData: true,
      clearVotes: true
    }
  });
});

/**
 * POST /api/dev/reload-test-data
 * Reload test data from files
 */
router.post('/reload-test-data', async (req, res) => {
  try {
    // Path to test data directory
    const dataDir = path.join(__dirname, '../../..', 'data');
    
    // Load demo voting data
    const demoVotingData = JSON.parse(
      await fs.readFile(path.join(dataDir, 'demo-voting-data.json'), 'utf8')
    );
    
    // TODO: Load the data into the appropriate stores or memory caches
    
    // Return success
    res.json({
      success: true,
      message: 'Test data reloaded successfully',
      dataFiles: ['demo-voting-data.json']
    });
  } catch (error) {
    console.error('Error reloading test data:', error);
    res.status(500).json({
      error: 'Failed to reload test data',
      message: error.message
    });
  }
});

/**
 * POST /api/dev/clear-votes/:channelId?
 * Clear all test votes for a channel or all channels
 */
router.post('/clear-votes/:channelId?', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    if (channelId) {
      // Clear votes for specific channel
      if (voteCounts[channelId]) {
        delete voteCounts[channelId];
      }
    } else {
      // Clear all votes and session data
      Object.keys(voteCounts).forEach(key => delete voteCounts[key]);
      await clearSessionVotes();
    }
    
    // Reinitialize state to load fresh demo data
    await initializeState();
    
    res.json({
      success: true,
      message: channelId 
        ? `Test votes cleared for channel: ${channelId}` 
        : 'All test votes cleared and reloaded from demo data'
    });
  } catch (error) {
    console.error('Error clearing test votes:', error);
    res.status(500).json({
      error: 'Failed to clear test votes',
      message: error.message
    });
  }
});

/**
 * POST /api/dev/generate-votes/:channelId?
 * Generate random test votes for a channel or all channels
 */
router.post('/generate-votes/:channelId?', (req, res) => {
  try {
    const { channelId } = req.params;
    const { count = 50, distribution = 'random' } = req.body;
    
    // TODO: Generate votes in the appropriate store
    
    res.json({
      success: true,
      message: channelId 
        ? `${count} test votes generated for channel: ${channelId}` 
        : `${count} test votes generated across all channels`,
      distribution
    });
  } catch (error) {
    console.error('Error generating test votes:', error);
    res.status(500).json({
      error: 'Failed to generate test votes',
      message: error.message
    });
  }
});

// Environment state tracking
let environmentState = {
  testMode: false,
  testData: false,
  testVoting: false,
  deterministicVotes: false,
  uiElements: false
};

/**
 * POST /api/dev/set-environment
 * Set the environment state for the backend
 */
router.post('/set-environment', async (req, res) => {
  try {
    const { environment } = req.body;
    
    if (!environment || typeof environment !== 'object') {
      return res.status(400).json({ error: 'Invalid environment state' });
    }
    
    // Update environment state
    environmentState = { ...environmentState, ...environment };
    
    // Update TEST_MODE environment variable to affect state initialization
    process.env.TEST_MODE = environmentState.testMode ? 'true' : 'false';
    
    console.log('Backend environment state updated:', environmentState);
    
    res.json({
      success: true,
      message: 'Environment state updated successfully',
      environment: environmentState
    });
  } catch (error) {
    console.error('Error setting environment state:', error);
    res.status(500).json({
      error: 'Failed to set environment state',
      details: error.message
    });
  }
});



/**
 * GET /api/dev/environment
 * Get the current environment state
 */
router.get('/environment', (req, res) => {
  res.json({
    success: true,
    environment: environmentState,
    testMode: process.env.TEST_MODE === 'true'
  });
});

/**
 * GET /api/dev/test-data
 * Get test data for frontend
 */
router.get('/test-data', async (req, res) => {
  try {
    const demoDataPath = path.join(process.cwd(), 'data', 'demo-voting-data.json');
    
    try {
      const demoData = await fs.readFile(demoDataPath, 'utf8');
      const parsedData = JSON.parse(demoData);
      
      res.json({
        success: true,
        channels: parsedData.channels || [],
        source: 'demo-voting-data.json'
      });
    } catch (error) {
      console.error('Error loading demo voting data:', error);
      res.json({
        success: true,
        channels: [],
        source: 'empty-fallback'
      });
    }
  } catch (error) {
    console.error('Error in test-data endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load test data',
      channels: []
    });
  }
});

// Export environment state getter for other modules
export const getEnvironmentState = () => environmentState;

export default router;
