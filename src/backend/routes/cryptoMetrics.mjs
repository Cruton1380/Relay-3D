// Crypto Metrics Dashboard API
// Provides real-time crypto performance and security metrics

import express from 'express';
import { cryptoMonitor } from '../services/cryptoMonitor.mjs';

const router = express.Router();

// Real-time crypto metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = cryptoMonitor.exportMetrics();
    
    res.json({
      status: 'ok',
      timestamp: metrics.timestamp,
      metrics: {
        performance: {
          keyGeneration: {
            ...metrics.performance.keyGeneration,
            status: metrics.performance.keyGeneration.p95Latency < 10 ? 'healthy' : 'warning'
          },
          sharedSecretDerivation: {
            ...metrics.performance.sharedSecretDerivation,
            status: metrics.performance.sharedSecretDerivation.p95Latency < 5 ? 'healthy' : 'warning'
          }
        },
        security: {
          errorRate: {
            current: metrics.performance.overallErrorRate,
            threshold: 0.1,
            status: metrics.performance.overallErrorRate < 0.1 ? 'healthy' : 'critical'
          },
          memoryStability: {
            heapGrowth: metrics.performance.memoryGrowth.heapGrowthPercent,
            threshold: 50,
            status: metrics.performance.memoryGrowth.heapGrowthPercent < 50 ? 'healthy' : 'warning'
          }
        },
        uptime: metrics.uptime
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve crypto metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint specifically for crypto operations
router.get('/health', (req, res) => {
  try {
    const stats = cryptoMonitor.getPerformanceStats();
    
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        keyGenerationLatency: {
          value: stats.keyGeneration.p95Latency,
          threshold: 10,
          status: stats.keyGeneration.p95Latency < 10 ? 'pass' : 'fail'
        },
        derivationLatency: {
          value: stats.sharedSecretDerivation.p95Latency,
          threshold: 5,
          status: stats.sharedSecretDerivation.p95Latency < 5 ? 'pass' : 'fail'
        },
        errorRate: {
          value: stats.overallErrorRate,
          threshold: 0.1,
          status: stats.overallErrorRate < 0.1 ? 'pass' : 'fail'
        },
        memoryGrowth: {
          value: stats.memoryGrowth.heapGrowthPercent,
          threshold: 50,
          status: stats.memoryGrowth.heapGrowthPercent < 50 ? 'pass' : 'fail'
        }
      }
    };
    
    // Set overall status based on individual checks
    const failedChecks = Object.values(health.checks).filter(check => check.status === 'fail');
    if (failedChecks.length > 0) {
      health.status = 'unhealthy';
      res.status(503);
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Alert status endpoint
router.get('/alerts', (req, res) => {
  try {
    const stats = cryptoMonitor.getPerformanceStats();
    const alerts = [];
    
    // Check for active alerts
    if (stats.keyGeneration.p95Latency > 10) {
      alerts.push({
        type: 'HIGH_KEY_GENERATION_LATENCY',
        severity: 'warning',
        message: `Key generation P95 latency is ${stats.keyGeneration.p95Latency.toFixed(2)}ms (threshold: 10ms)`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (stats.overallErrorRate > 0.1) {
      alerts.push({
        type: 'HIGH_CRYPTO_ERROR_RATE',
        severity: 'critical',
        message: `Crypto error rate is ${stats.overallErrorRate.toFixed(3)}% (threshold: 0.1%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (stats.memoryGrowth.heapGrowthPercent > 50) {
      alerts.push({
        type: 'HIGH_MEMORY_GROWTH',
        severity: 'warning',
        message: `Memory growth is ${stats.memoryGrowth.heapGrowthPercent.toFixed(1)}% (threshold: 50%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'ok',
      alertCount: alerts.length,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve alerts',
      timestamp: new Date().toISOString()
    });
  }
});

// Reset metrics endpoint (for testing/maintenance)
router.post('/reset', (req, res) => {
  try {
    cryptoMonitor.reset();
    res.json({
      status: 'ok',
      message: 'Crypto monitoring metrics reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to reset metrics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
