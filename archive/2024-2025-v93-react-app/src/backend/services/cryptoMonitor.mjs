// Crypto Operations Monitoring Service
// Tracks performance, error rates, and security metrics for X25519 operations

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

class CryptoMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      keyGeneration: {
        count: 0,
        totalTime: 0,
        errors: 0,
        latencies: []
      },
      sharedSecretDerivation: {
        count: 0,
        totalTime: 0,
        errors: 0,
        latencies: []
      },
      memoryUsage: {
        baseline: process.memoryUsage(),
        samples: []
      },
      errorRate: {
        total: 0,
        cryptoErrors: 0,
        lastCalculated: Date.now()
      }
    };
    
    // Start periodic memory monitoring
    this.startMemoryMonitoring();
  }

  // Monitor key generation performance
  async measureKeyGeneration(keyGenFn) {
    const start = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await keyGenFn();
      const end = performance.now();
      const latency = end - start;
      
      this.metrics.keyGeneration.count++;
      this.metrics.keyGeneration.totalTime += latency;
      this.metrics.keyGeneration.latencies.push(latency);
      
      // Alert if latency exceeds 10ms threshold
      if (latency > 10) {
        this.emit('warning', {
          type: 'HIGH_KEY_GEN_LATENCY',
          latency,
          threshold: 10,
          timestamp: new Date().toISOString()
        });
      }
      
      // Track memory impact
      const endMemory = process.memoryUsage();
      this.trackMemoryUsage(startMemory, endMemory);
      
      return result;
    } catch (error) {
      this.metrics.keyGeneration.errors++;
      this.trackCryptoError('KEY_GENERATION', error);
      throw error;
    }
  }

  // Monitor shared secret derivation
  async measureSharedSecretDerivation(derivationFn) {
    const start = performance.now();
    
    try {
      const result = await derivationFn();
      const end = performance.now();
      const latency = end - start;
      
      this.metrics.sharedSecretDerivation.count++;
      this.metrics.sharedSecretDerivation.totalTime += latency;
      this.metrics.sharedSecretDerivation.latencies.push(latency);
      
      // Alert if derivation takes too long
      if (latency > 5) {
        this.emit('warning', {
          type: 'HIGH_DERIVATION_LATENCY', 
          latency,
          threshold: 5,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      this.metrics.sharedSecretDerivation.errors++;
      this.trackCryptoError('SHARED_SECRET_DERIVATION', error);
      throw error;
    }
  }

  // Track crypto-specific errors
  trackCryptoError(operation, error) {
    this.metrics.errorRate.total++;
    this.metrics.errorRate.cryptoErrors++;
    
    const errorRate = this.getCryptoErrorRate();
    
    // Alert if error rate exceeds 0.1%
    if (errorRate > 0.1) {
      this.emit('critical', {
        type: 'HIGH_CRYPTO_ERROR_RATE',
        rate: errorRate,
        threshold: 0.1,
        operation,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log structured error for analysis
    console.error('CRYPTO_ERROR', {
      operation,
      error: error.message,
      stack: error.stack,
      errorRate,
      timestamp: new Date().toISOString()
    });
  }

  // Monitor memory usage for crypto operations
  trackMemoryUsage(before, after) {
    const memoryDelta = {
      rss: after.rss - before.rss,
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external,
      timestamp: Date.now()
    };
    
    this.metrics.memoryUsage.samples.push(memoryDelta);
    
    // Keep only last 1000 samples
    if (this.metrics.memoryUsage.samples.length > 1000) {
      this.metrics.memoryUsage.samples.shift();
    }
    
    // Alert on significant memory increase
    if (memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
      this.emit('warning', {
        type: 'HIGH_MEMORY_USAGE',
        delta: memoryDelta,
        threshold: '10MB',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Start periodic memory monitoring
  startMemoryMonitoring() {
    setInterval(() => {
      const current = process.memoryUsage();
      const baseline = this.metrics.memoryUsage.baseline;
      
      const growth = {
        rss: ((current.rss - baseline.rss) / baseline.rss) * 100,
        heapUsed: ((current.heapUsed - baseline.heapUsed) / baseline.heapUsed) * 100,
        timestamp: Date.now()
      };
      
      // Alert on sustained memory growth (>50% from baseline)
      if (growth.heapUsed > 50) {
        this.emit('critical', {
          type: 'MEMORY_LEAK_SUSPECTED',
          growth,
          baseline,
          current,
          timestamp: new Date().toISOString()
        });
      }
    }, 60000); // Check every minute
  }

  // Calculate crypto error rate percentage
  getCryptoErrorRate() {
    if (this.metrics.errorRate.total === 0) return 0;
    return (this.metrics.errorRate.cryptoErrors / this.metrics.errorRate.total) * 100;
  }

  // Get performance statistics
  getPerformanceStats() {
    const keyGenLatencies = this.metrics.keyGeneration.latencies;
    const derivationLatencies = this.metrics.sharedSecretDerivation.latencies;
    
    return {
      keyGeneration: {
        count: this.metrics.keyGeneration.count,
        avgLatency: keyGenLatencies.length > 0 ? 
          keyGenLatencies.reduce((a, b) => a + b, 0) / keyGenLatencies.length : 0,
        p95Latency: this.calculatePercentile(keyGenLatencies, 95),
        errorRate: this.metrics.keyGeneration.errors / Math.max(this.metrics.keyGeneration.count, 1) * 100
      },
      sharedSecretDerivation: {
        count: this.metrics.sharedSecretDerivation.count,
        avgLatency: derivationLatencies.length > 0 ?
          derivationLatencies.reduce((a, b) => a + b, 0) / derivationLatencies.length : 0,
        p95Latency: this.calculatePercentile(derivationLatencies, 95),
        errorRate: this.metrics.sharedSecretDerivation.errors / Math.max(this.metrics.sharedSecretDerivation.count, 1) * 100
      },
      overallErrorRate: this.getCryptoErrorRate(),
      memoryGrowth: this.getMemoryGrowth()
    };
  }

  // Calculate percentile from latency array
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Get memory growth statistics
  getMemoryGrowth() {
    const current = process.memoryUsage();
    const baseline = this.metrics.memoryUsage.baseline;
    
    return {
      rssGrowthPercent: ((current.rss - baseline.rss) / baseline.rss) * 100,
      heapGrowthPercent: ((current.heapUsed - baseline.heapUsed) / baseline.heapUsed) * 100,
      samples: this.metrics.memoryUsage.samples.length
    };
  }

  // Export metrics for dashboard/monitoring
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      performance: this.getPerformanceStats(),
      crypto: {
        errorRate: this.getCryptoErrorRate(),
        totalOperations: this.metrics.keyGeneration.count + this.metrics.sharedSecretDerivation.count,
        totalErrors: this.metrics.keyGeneration.errors + this.metrics.sharedSecretDerivation.errors
      },
      memory: this.getMemoryGrowth(),
      uptime: process.uptime()
    };
  }

  // Reset metrics (for testing or periodic cleanup)
  reset() {
    this.metrics.keyGeneration = { count: 0, totalTime: 0, errors: 0, latencies: [] };
    this.metrics.sharedSecretDerivation = { count: 0, totalTime: 0, errors: 0, latencies: [] };
    this.metrics.errorRate = { total: 0, cryptoErrors: 0, lastCalculated: Date.now() };
    this.metrics.memoryUsage = { 
      baseline: process.memoryUsage(), 
      samples: [] 
    };
  }
}

// Singleton instance for global monitoring
export const cryptoMonitor = new CryptoMonitor();

// Configure alerts
cryptoMonitor.on('warning', (alert) => {
  console.warn('🟡 CRYPTO_WARNING', alert);
});

cryptoMonitor.on('critical', (alert) => {
  console.error('🔴 CRYPTO_CRITICAL', alert);
  // In production: send to alerting system (PagerDuty, Slack, etc.)
});

export default CryptoMonitor;
