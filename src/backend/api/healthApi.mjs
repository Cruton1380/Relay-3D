/**
 * @fileoverview Health check API endpoints
 */
import express from 'express';
import websocketService from '../websocket-service/index.mjs';
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
        websocket: websocketService.wss && websocketService.wss.readyState === 1
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
 * Get WebSocket health status
 * @param {boolean} detailed - Whether to include detailed metrics
 * @returns {Object} Health status object
 */
function getWebSocketHealth(detailed = false) {
  // Basic health check
  const wsHealth = {
    status: 'healthy',
    connections: websocketService.clients.size,
    timestamp: Date.now()
  };
  
  // Check WebSocket server status
  if (!websocketService.wss || websocketService.wss.readyState !== 1) {
    wsHealth.status = 'unhealthy';
    wsHealth.message = 'WebSocket server is not running';
  }
  
  // Add detailed metrics if requested and available
  if (detailed && websocketService.adapters.has('metrics')) {
    const metricsAdapter = websocketService.adapters.get('metrics');
    if (typeof metricsAdapter.getMetricsReport === 'function') {
      wsHealth.metrics = metricsAdapter.getMetricsReport();
    }
  }
  
  return wsHealth;
}

export default router;
