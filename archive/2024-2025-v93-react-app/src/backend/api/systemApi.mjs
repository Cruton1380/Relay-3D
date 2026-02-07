import { Router } from 'express';
import { requireAuth } from '../auth/middleware/index.mjs';

const router = Router();

/**
 * System Statistics API
 * Provides comprehensive system metrics for the dashboard
 */

// In-memory cache for system stats (could be replaced with Redis in production)
let statsCache = {
  data: null,
  lastUpdated: null,
  ttl: 30000 // 30 seconds
};

/**
 * Collect system statistics from various services
 */
async function collectSystemStats() {
  try {    const stats = {
      totalVotes: await getTotalVotes(),
      activeUsers: await getActiveUsers(),
      networkHealth: await getNetworkHealth(),
      shardingEfficiency: await getShardingEfficiency(),
      systemUptime: getSystemUptime(),
      memoryUsage: getMemoryUsage(),
      cpuUsage: getCpuUsage(),
      networkConnections: await getNetworkConnections(),
      serviceStatus: await getServiceStatus(),
      recentActivity: await getRecentActivity(),
      regionalActivity: await getRegionalActivity(),
      candidateMomentum: await getCandidateMomentum(),
      sybilResistanceMetrics: await getSybilResistanceMetrics(),
      timestamp: new Date().toISOString()
    };

    return stats;
  } catch (error) {
    console.error('Error collecting system stats:', error);
    // Return default stats if collection fails
    return {
      totalVotes: 0,
      activeUsers: 0,
      networkHealth: 100,
      shardingEfficiency: 95,
      systemUptime: "0d 0h 0m",
      memoryUsage: 0,
      cpuUsage: 0,
      networkConnections: 0,
      serviceStatus: {},
      recentActivity: [],
      timestamp: new Date().toISOString(),
      error: 'Failed to collect some metrics'
    };
  }
}

/**
 * Get total votes from vote service
 */
async function getTotalVotes() {
  try {
    // This would integrate with the vote service
    // For now, return a mock value
    return Math.floor(Math.random() * 10000) + 5000;
  } catch (error) {
    console.error('Error getting total votes:', error);
    return 0;
  }
}

/**
 * Get active users from presence service
 */
async function getActiveUsers() {
  try {
    // This would integrate with the presence service
    // For now, return a mock value based on some logic
    return Math.floor(Math.random() * 500) + 100;
  } catch (error) {
    console.error('Error getting active users:', error);
    return 0;
  }
}

/**
 * Get network health from p2p service
 */
async function getNetworkHealth() {
  try {
    // This would check p2p service health
    // Calculate based on connection success rate, node availability, etc.
    const baseHealth = 95;
    const variance = Math.random() * 10 - 5; // ±5%
    return Math.max(0, Math.min(100, Math.round(baseHealth + variance)));
  } catch (error) {
    console.error('Error getting network health:', error);
    return 100;
  }
}

/**
 * Get sharding efficiency from microsharding service
 */
async function getShardingEfficiency() {
  try {
    // This would calculate efficiency from microsharding service
    // Based on shard distribution, redundancy, and access patterns
    const baseEfficiency = 92;
    const variance = Math.random() * 6 - 3; // ±3%
    return Math.max(0, Math.min(100, Math.round(baseEfficiency + variance)));
  } catch (error) {
    console.error('Error getting sharding efficiency:', error);
    return 95;
  }
}

/**
 * Get system uptime
 */
function getSystemUptime() {
  try {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  } catch (error) {
    console.error('Error getting system uptime:', error);
    return "0d 0h 0m";
  }
}

/**
 * Get memory usage percentage
 */
function getMemoryUsage() {
  try {
    const used = process.memoryUsage();
    const total = used.heapTotal;
    const percentage = (used.heapUsed / total) * 100;
    return Math.round(percentage * 10) / 10;
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return 0;
  }
}

/**
 * Get CPU usage (mock implementation)
 */
function getCpuUsage() {
  try {
    // In a real implementation, this would use system monitoring
    // For now, return a mock value
    return Math.round((Math.random() * 30 + 10) * 10) / 10;
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return 0;
  }
}

/**
 * Get network connections from websocket service
 */
async function getNetworkConnections() {
  try {
    // This would query the websocket service for active connections
    // For now, return a mock value
    return Math.floor(Math.random() * 2000) + 500;
  } catch (error) {
    console.error('Error getting network connections:', error);
    return 0;
  }
}

/**
 * Get service status from service registry
 */
async function getServiceStatus() {
  try {
    // This would query the service registry for health status
    const services = [
      'eventBus-service',
      'config-service',
      'activityAnalysis-service',
      'websocket-service',
      'vote-service',
      'presence-service',
      'microsharding-service',
      'p2p-service',
      'blockchain-service',
      'serviceRegistry-service'
    ];

    const status = {};
    services.forEach(service => {
      // Mock healthy status for all services
      status[service] = {
        status: 'healthy',
        uptime: getSystemUptime(),
        lastCheck: new Date().toISOString()
      };
    });

    return status;
  } catch (error) {
    console.error('Error getting service status:', error);
    return {};
  }
}

/**
 * Get recent activity from activity analysis service
 */
async function getRecentActivity() {
  try {
    // This would query recent activity from the activity analysis service
    const activities = [
      { type: 'vote', count: Math.floor(Math.random() * 50), timestamp: new Date(Date.now() - 300000).toISOString() },
      { type: 'user_join', count: Math.floor(Math.random() * 10), timestamp: new Date(Date.now() - 600000).toISOString() },
      { type: 'data_shard', count: Math.floor(Math.random() * 100), timestamp: new Date(Date.now() - 900000).toISOString() }
    ];
    return activities;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * Get regional voting activity data
 */
async function getRegionalActivity() {
  try {
    // Mock data for regional activity - would connect to actual regional service
    return {
      regions: [
        { id: 'us-west', name: 'US West', voterDensity: 0.75, activityLevel: 0.85, participationRate: 0.65, reliabilityScore: 0.92 },
        { id: 'us-east', name: 'US East', voterDensity: 0.82, activityLevel: 0.78, participationRate: 0.71, reliabilityScore: 0.89 },
        { id: 'eu-central', name: 'EU Central', voterDensity: 0.68, activityLevel: 0.91, participationRate: 0.58, reliabilityScore: 0.94 },
        { id: 'asia-pac', name: 'Asia Pacific', voterDensity: 0.59, activityLevel: 0.73, participationRate: 0.42, reliabilityScore: 0.87 }
      ],
      totalRegions: 12,
      activeRegions: 8,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting regional activity:', error);
    return { regions: [], totalRegions: 0, activeRegions: 0 };
  }
}

/**
 * Get candidate momentum data
 */
async function getCandidateMomentum() {
  try {
    // Mock data for candidate momentum - would connect to actual voting service
    return {
      candidates: [
        { id: 'candidate-1', name: 'Alice Johnson', momentum: 0.85, velocity: 0.12, prediction: 0.78, trend: 'rising' },
        { id: 'candidate-2', name: 'Bob Smith', momentum: 0.72, velocity: -0.05, prediction: 0.68, trend: 'stable' },
        { id: 'candidate-3', name: 'Carol Davis', momentum: 0.91, velocity: 0.18, prediction: 0.82, trend: 'rising' },
        { id: 'candidate-4', name: 'David Wilson', momentum: 0.54, velocity: -0.15, prediction: 0.45, trend: 'falling' }
      ],
      trending: ['candidate-3', 'candidate-1'],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting candidate momentum:', error);
    return { candidates: [], trending: [] };
  }
}

/**
 * Get sybil resistance metrics
 */
async function getSybilResistanceMetrics() {
  try {
    return {
      biometricVerification: {
        totalUsers: 15420,
        verifiedUsers: 14856,
        verificationRate: 96.3,
        failedAttempts: 89
      },
      activityAnalysis: {
        totalAnalyzed: 14856,
        humanLikeActivity: 14623,
        flaggedAccounts: 233,
        confidenceScore: 98.4
      },
      deviceFingerprinting: {
        uniqueDevices: 13892,
        duplicateDevices: 528,
        suspiciousDevices: 45
      },
      networkAnalysis: {
        legitimateConnections: 98.7,
        botNetworkDetected: 12,
        proxyConnections: 156
      },
      overallScore: 97.8,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting sybil resistance metrics:', error);
    return { overallScore: 95, lastUpdated: new Date().toISOString() };
  }
}

/**
 * GET /api/system/stats
 * Returns comprehensive system statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (statsCache.data && statsCache.lastUpdated && (now - statsCache.lastUpdated) < statsCache.ttl) {
      return res.json(statsCache.data);
    }

    // Collect fresh stats
    const stats = await collectSystemStats();
    
    // Update cache
    statsCache.data = stats;
    statsCache.lastUpdated = now;

    res.json(stats);
  } catch (error) {
    console.error('System stats API error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/system/health
 * Returns basic system health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: getSystemUptime(),
      memory: getMemoryUsage(),
      timestamp: new Date().toISOString(),
      services: await getServiceStatus()
    };

    res.json(health);
  } catch (error) {
    console.error('System health API error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system/metrics
 * Returns detailed performance metrics
 */
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const metrics = {
      performance: {
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
        uptime: process.uptime()
      },
      network: {
        connections: await getNetworkConnections(),
        health: await getNetworkHealth()
      },
      storage: {
        shardingEfficiency: await getShardingEfficiency()
      },
      activity: {
        totalVotes: await getTotalVotes(),
        activeUsers: await getActiveUsers(),
        recentActivity: await getRecentActivity()
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    console.error('System metrics API error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system metrics',
      message: error.message
    });
  }
});

export default router;
