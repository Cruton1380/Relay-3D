/**
 * Microsharding API Routes
 * Handles distributed vote storage, shard management, and cross-shard synchronization
 */
import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.mjs';
import logger from '../utils/logging/logger.mjs';

// Import microsharding manager
import microshardingManager from '../services/microshardingManager.mjs';

const router = express.Router();
const shardLogger = logger.child({ module: 'microsharding-api' });

// ========================================
// SHARD MANAGEMENT
// ========================================

/**
 * Get all shards status
 */
router.get('/shards', async (req, res) => {
    try {
        const shards = microshardingManager.getAllShards();
        res.json({ success: true, shards });
    } catch (error) {
        shardLogger.error('Error getting shards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get specific shard information
 */
router.get('/shards/:shardId', async (req, res) => {
    try {
        const { shardId } = req.params;
        const shard = microshardingManager.getShard(shardId);
        
        if (!shard) {
            return res.status(404).json({ success: false, error: 'Shard not found' });
        }

        res.json({ success: true, shard });
    } catch (error) {
        shardLogger.error('Error getting shard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get shard data
 */
router.get('/shards/:shardId/data', async (req, res) => {
    try {
        const { shardId } = req.params;
        const { limit, offset } = req.query;
        
        const data = microshardingManager.getShardData(shardId);
        
        if (!data) {
            return res.status(404).json({ success: false, error: 'Shard data not found' });
        }

        // Paginate if needed
        let result = data;
        if (limit) {
            const start = parseInt(offset) || 0;
            const end = start + (parseInt(limit) || 50);
            result = Array.isArray(data) ? data.slice(start, end) : data;
        }

        res.json({ success: true, data: result });
    } catch (error) {
        shardLogger.error('Error getting shard data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// DATA STORAGE & RETRIEVAL
// ========================================

/**
 * Store data in appropriate shard
 */
router.post('/store', authMiddleware, async (req, res) => {
    try {
        const { data, dataType } = req.body;
        
        if (!data || !dataType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Data and dataType are required' 
            });
        }

        const result = await microshardingManager.storeData(data, dataType);
        res.json({ success: true, result });
    } catch (error) {
        shardLogger.error('Error storing data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Retrieve data by ID
 */
router.get('/data/:dataId', async (req, res) => {
    try {
        const { dataId } = req.params;
        const data = await microshardingManager.retrieveData(dataId);
        
        if (!data) {
            return res.status(404).json({ success: false, error: 'Data not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        shardLogger.error('Error retrieving data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Query data across shards
 */
router.post('/query', async (req, res) => {
    try {
        const { query, filters } = req.body;
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                error: 'Query is required' 
            });
        }

        const results = await microshardingManager.queryAcrossShards(query, filters);
        res.json({ success: true, results });
    } catch (error) {
        shardLogger.error('Error querying data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// SYNCHRONIZATION
// ========================================

/**
 * Trigger manual shard synchronization
 */
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        // In production, add admin role check here
        await microshardingManager.syncShards();
        res.json({ success: true, message: 'Synchronization triggered' });
    } catch (error) {
        shardLogger.error('Error triggering sync:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get synchronization status
 */
router.get('/sync/status', async (req, res) => {
    try {
        const status = microshardingManager.getSyncStatus();
        res.json({ success: true, status });
    } catch (error) {
        shardLogger.error('Error getting sync status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// METRICS & MONITORING
// ========================================

/**
 * Get sharding metrics
 */
router.get('/metrics', async (req, res) => {
    try {
        const metrics = microshardingManager.getMetrics();
        res.json({ success: true, metrics });
    } catch (error) {
        shardLogger.error('Error getting metrics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get shard health status
 */
router.get('/health', async (req, res) => {
    try {
        const health = microshardingManager.getShardHealth();
        res.json({ success: true, health });
    } catch (error) {
        shardLogger.error('Error getting shard health:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get data distribution statistics
 */
router.get('/distribution', async (req, res) => {
    try {
        const distribution = microshardingManager.getDataDistribution();
        res.json({ success: true, distribution });
    } catch (error) {
        shardLogger.error('Error getting distribution:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ADMIN OPERATIONS
// ========================================

/**
 * Rebalance shards (admin only)
 */
router.post('/rebalance', authMiddleware, async (req, res) => {
    try {
        // In production, add admin role check here
        const result = await microshardingManager.rebalanceShards();
        res.json({ success: true, result });
    } catch (error) {
        shardLogger.error('Error rebalancing shards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Create new shard (admin only)
 */
router.post('/shards/create', authMiddleware, async (req, res) => {
    try {
        const { geohashPrefix, capacity } = req.body;
        
        if (!geohashPrefix) {
            return res.status(400).json({ 
                success: false, 
                error: 'Geohash prefix is required' 
            });
        }

        const result = await microshardingManager.createShard(geohashPrefix, capacity);
        res.json({ success: true, shard: result });
    } catch (error) {
        shardLogger.error('Error creating shard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
