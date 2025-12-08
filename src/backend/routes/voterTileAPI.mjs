/**
 * Voter Tile API
 * High-performance tile-based voter visualization endpoint
 * Supports millions of voters with sub-second response times
 */

import express from 'express';
import { latLngToCell } from 'h3-js';
import spatialVoterIndex from '../services/spatialVoterIndex.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const tileLogger = logger.child({ module: 'voter-tile-api' });

/**
 * GET /api/voters/tile/:candidateId/:resolution/:h3Index
 * Get voter clusters within a specific H3 tile
 * 
 * Ultra-fast: Returns pre-computed clusters in <10ms
 */
router.get('/tile/:candidateId/:resolution/:h3Index', (req, res) => {
  try {
    const { candidateId, resolution, h3Index } = req.params;
    
    // Validate resolution
    const validResolutions = ['country', 'province', 'city', 'gps'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resolution. Must be one of: ${validResolutions.join(', ')}`
      });
    }

    const startTime = Date.now();
    
    // Get clusters from spatial index (O(1) lookup)
    const clusters = spatialVoterIndex.getClustersInTile(candidateId, h3Index, resolution);
    
    const duration = Date.now() - startTime;
    
    tileLogger.debug('Tile request served', {
      candidateId,
      resolution,
      h3Index,
      clusterCount: clusters.length,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      candidateId,
      resolution,
      h3Index,
      clusters,
      meta: {
        clusterCount: clusters.length,
        queryTime: `${duration}ms`
      }
    });
    
  } catch (error) {
    tileLogger.error('Tile request failed', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voters/bounds/:candidateId?minLat=&maxLat=&minLng=&maxLng=&resolution=gps
 * Get voter clusters within a bounding box (for camera frustum)
 */
router.get('/bounds/:candidateId', (req, res) => {
  try {
    const { candidateId } = req.params;
    const { minLat, maxLat, minLng, maxLng, resolution = 'gps' } = req.query;
    
    // Validate bounds
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Missing bounding box parameters: minLat, maxLat, minLng, maxLng'
      });
    }

    const bounds = {
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng)
    };

    const startTime = Date.now();
    
    // Get clusters within bounds
    const clusters = spatialVoterIndex.getClustersInBounds(
      candidateId,
      bounds.minLat,
      bounds.maxLat,
      bounds.minLng,
      bounds.maxLng,
      resolution
    );
    
    const duration = Date.now() - startTime;
    
    tileLogger.debug('Bounds request served', {
      candidateId,
      resolution,
      bounds,
      clusterCount: clusters.length,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      candidateId,
      resolution,
      bounds,
      clusters,
      meta: {
        clusterCount: clusters.length,
        queryTime: `${duration}ms`
      }
    });
    
  } catch (error) {
    tileLogger.error('Bounds request failed', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voters/clusters/:candidateId?resolution=gps&limit=10000
 * Get all voter clusters for a candidate (legacy endpoint, use bounds/tile instead)
 */
router.get('/clusters/:candidateId', (req, res) => {
  try {
    const { candidateId } = req.params;
    const { resolution = 'gps', limit = 10000 } = req.query;
    
    const startTime = Date.now();
    
    // Get all clusters (limited)
    const clusters = spatialVoterIndex.getClusters(
      candidateId,
      resolution,
      parseInt(limit)
    );
    
    const duration = Date.now() - startTime;
    
    tileLogger.debug('Clusters request served', {
      candidateId,
      resolution,
      clusterCount: clusters.length,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      candidateId,
      resolution,
      clusters,
      meta: {
        clusterCount: clusters.length,
        queryTime: `${duration}ms`,
        note: 'Consider using /bounds or /tile endpoints for better performance'
      }
    });
    
  } catch (error) {
    tileLogger.error('Clusters request failed', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voters/stats
 * Get statistics about the spatial index
 */
router.get('/stats', (req, res) => {
  try {
    const stats = spatialVoterIndex.getStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    tileLogger.error('Stats request failed', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

