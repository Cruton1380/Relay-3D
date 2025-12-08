// backend/routes/blockchain.mjs
import express from 'express';
import blockchain from '../blockchain-service/index.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const routeLogger = logger.child({ module: 'blockchain-routes' });

/**
 * Get blockchain debug information
 * GET /api/blockchain/debug
 */
router.get('/debug', async (req, res) => {
  try {
    const debugInfo = blockchain.getDebugInfo();
    routeLogger.info('Blockchain debug info requested', { 
      chainLength: debugInfo.chainLength,
      queuedTransactions: debugInfo.queuedTransactions
    });
    
    res.json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    routeLogger.error('Error getting blockchain debug info:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Get blockchain status
 * GET /api/blockchain/status
 */
router.get('/status', async (req, res) => {
  try {
    const stats = blockchain.getStats();
    return res.json({
      success: true,
      status: {
        blockCount: stats.blocks,
        pendingTransactions: stats.pendingTransactions,
        queuedTransactions: stats.queuedTransactions,
        latestBlock: {
          index: stats.blocks - 1,
          timestamp: stats.lastBlockTimestamp,
          hash: stats.lastBlockHash ? stats.lastBlockHash.substring(0, 10) + '...' : null
        },
        batchingConfig: stats.batchingConfig,
        healthy: true
      }
    });
  } catch (error) {
    routeLogger.error('Error retrieving blockchain status', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve blockchain status',
      error: error.message
    });
  }
});

/**
 * Force flush pending transactions
 * POST /api/blockchain/force-flush
 */
router.post('/force-flush', async (req, res) => {
  try {
    const result = await blockchain.forceFlush();
    routeLogger.info('Force flush requested via API');
    res.json({
      success: true,
      result
    });
  } catch (error) {
    routeLogger.error('Error during force flush:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
