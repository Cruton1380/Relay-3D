/**
 * @fileoverview Health check API endpoints
 */
import express from 'express';
// import websocketService from '../websocket-service/index.mjs'; // REMOVED: Polling replaces WebSocket
import logger from '../utils/logging/logger.mjs';

const router = express.Router();

/**
 * GET /api/health/status
 * Returns overall system health status
 */
export const getHealth = (req, res) => {
  try {
    // System-wide health check
    const health = {
      status: 'ok',
      timestamp: Date.now(),
      services: {
        api: {
          status: 'healthy'
        },
        websocket: getWebSocketHealth(),
        database: {
          status: 'healthy'
          // Could add more database-specific metrics here
        }
      },
      uptime: process.uptime()
    };
    
    // If any service is not healthy, the overall status is degraded
    if (Object.values(health.services).some(service => service.status !== 'healthy')) {
      health.status = 'degraded';
    }
    
    res.status(200).json(health);
  } catch (error) {
    logger.error('Error in health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health status',
      timestamp: Date.now()
    });
  }
};

/**
 * GET /api/health/readiness
 * Returns system readiness status
 */
export const getReadiness = (req, res) => {
  try {
    const readiness = {
      status: 'ready',
      timestamp: Date.now(),
      checks: {
        database: true,
        // websocket: websocketService.wss && websocketService.wss.readyState === 1  // REMOVED
        queryHooks: true  // Git-native backend uses query hooks instead
      }
    };
    
    // If any check fails, the system is not ready
    if (Object.values(readiness.checks).some(check => !check)) {
      readiness.status = 'not ready';
    }
    
    res.status(200).json(readiness);
  } catch (error) {
    logger.error('Error in readiness check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve readiness status',
      timestamp: Date.now()
    });
  }
};

// Router setup
router.get('/status', getHealth);
router.get('/readiness', getReadiness);

/**
 * GET /api/health/websocket
 * Returns detailed WebSocket health status
 */
router.get('/websocket', (req, res) => {
  try {
    const health = getWebSocketHealth(true);
    res.json(health);
  } catch (error) {
    logger.error('Error in WebSocket health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve WebSocket health status',
      timestamp: Date.now()
    });
  }
});

/**
 * Get WebSocket health status (STUB - WebSocket removed for Git-native backend)
 * @param {boolean} detailed - Whether to include detailed metrics
 * @returns {Object} Health status object
 */
function getWebSocketHealth(detailed = false) {
  // WebSocket service removed - polling replaces WebSocket for Git-native backend
  const wsHealth = {
    status: 'not_available',
    message: 'WebSocket removed - using query hook polling',
    connections: 0,
    timestamp: Date.now()
  };
  
  return wsHealth;
}

export default router;
