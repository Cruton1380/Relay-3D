/**
 * @fileoverview Hotspot API routes for community-rooted verification
 */
import { Router } from 'express';
import { proximityHotspotVerifier } from '../services/proximityHotspotVerifier.mjs';
import logger from '../utils/logging/logger.mjs';

const router = Router();

/**
 * Get nearby hotspots
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const userLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    const radiusKm = parseFloat(radius) || 10;
    const hotspots = await proximityHotspotVerifier.getNearbyHotspots(userLocation, radiusKm);
    
    res.json({
      success: true,
      data: {
        hotspots,
        userLocation,
        searchRadius: radiusKm
      }
    });
  } catch (error) {
    logger.error('Error getting nearby hotspots', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Register a new hotspot
 */
router.post('/register', async (req, res) => {
  try {
    const { hotspotId, config } = req.body;
    
    if (!hotspotId || !config) {
      return res.status(400).json({
        success: false,
        message: 'Hotspot ID and configuration are required'
      });
    }

    const result = await proximityHotspotVerifier.registerHotspot(hotspotId, config);
    
    res.json(result);
  } catch (error) {
    logger.error('Error registering hotspot', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Initiate hotspot check-in
 */
router.post('/initiate-checkin', async (req, res) => {
  try {
    const { hotspotId, proximityData } = req.body;
    const userId = req.user?.id || 'demo_user'; // In real app, get from auth middleware
    
    if (!hotspotId || !proximityData) {
      return res.status(400).json({
        success: false,
        message: 'Hotspot ID and proximity data are required'
      });
    }

    const result = await proximityHotspotVerifier.initiateCheckin(userId, hotspotId, proximityData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error initiating hotspot check-in', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Complete biometric verification for check-in
 */
router.post('/complete-biometric', async (req, res) => {
  try {
    const { sessionId, biometricData } = req.body;
    
    if (!sessionId || !biometricData) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and biometric data are required'
      });
    }

    const result = await proximityHotspotVerifier.completeBiometricVerification(sessionId, biometricData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error completing biometric verification', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get hotspot statistics
 */
router.get('/stats/:hotspotId', async (req, res) => {
  try {
    const { hotspotId } = req.params;
    
    const stats = await proximityHotspotVerifier.getHotspotStats(hotspotId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Hotspot not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting hotspot stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
