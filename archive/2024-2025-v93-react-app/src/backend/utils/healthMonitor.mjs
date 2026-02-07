/**
 * Health Monitoring System
 * Continuously monitors system health and prevents issues before they occur
 */

import logger from '../utils/logging/logger.mjs';
import { existsSync } from 'fs';
import { PATHS } from '../config/paths.mjs';

const healthLogger = logger.child({ module: 'health-monitor' });

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.healthStatus = {
      overall: 'healthy',
      services: {},
      lastCheck: null,
      uptime: Date.now()
    };
    
    this.checkInterval = 60000; // 1 minute
    this.criticalThreshold = 3; // 3 consecutive failures = critical
    this.timer = null;
  }

  /**
   * Add a health check
   */
  addCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      function: checkFunction,
      critical: options.critical || false,
      interval: options.interval || this.checkInterval,
      failures: 0,
      lastCheck: null,
      lastResult: null
    });
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.runHealthChecks();
    }, this.checkInterval);

    // Add default health checks
    this.addDefaultChecks();

    healthLogger.info('Health monitoring started', {
      checkInterval: this.checkInterval,
      totalChecks: this.checks.size
    });
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      healthLogger.info('Health monitoring stopped');
    }
  }

  /**
   * Add default health checks
   */
  addDefaultChecks() {
    // File system health
    this.addCheck('filesystem', async () => {
      const criticalFiles = [
        PATHS.LOGGING + '/logger.mjs',
        PATHS.BLOCKCHAIN + '/blockchain.mjs',
        PATHS.BACKEND_ROOT + '/state/state.mjs'
      ];

      for (const file of criticalFiles) {
        if (!existsSync(file)) {
          throw new Error(`Critical file missing: ${file}`);
        }
      }
    }, { critical: true });

    // Memory health
    this.addCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > 1000) { // 1GB threshold
        throw new Error(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
      }
    });

    // Vote system health
    this.addCheck('vote-system', async () => {
      try {
        const { getTopicVoteTotals } = await import(PATHS.VOTING + '/votingEngine.mjs');
        const testTotals = getTopicVoteTotals('health-check-topic');
        
        if (typeof testTotals.totalVotes !== 'number') {
          throw new Error('Vote system not returning proper data structure');
        }
      } catch (error) {
        throw new Error(`Vote system health check failed: ${error.message}`);
      }
    }, { critical: true });

    // Blockchain health
    this.addCheck('blockchain', async () => {
      try {
        const { blockchain } = await import(PATHS.BLOCKCHAIN + '/blockchain.mjs');
        await blockchain.initialize();
        
        if (!blockchain.chain || !Array.isArray(blockchain.chain)) {
          throw new Error('Blockchain not properly initialized');
        }
      } catch (error) {
        throw new Error(`Blockchain health check failed: ${error.message}`);
      }
    }, { critical: true });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {};
    let overallHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        await check.function();
        
        // Reset failure count on success
        check.failures = 0;
        check.lastResult = 'healthy';
        results[name] = 'healthy';
        
        healthLogger.debug(`Health check passed: ${name}`);
      } catch (error) {
        check.failures++;
        check.lastResult = error.message;
        results[name] = 'unhealthy';
        
        healthLogger.warn(`Health check failed: ${name}`, {
          error: error.message,
          failures: check.failures
        });

        // Mark as critical if too many failures
        if (check.failures >= this.criticalThreshold && check.critical) {
          overallHealthy = false;
          healthLogger.error(`Critical health check failure: ${name}`, {
            failures: check.failures,
            threshold: this.criticalThreshold
          });
        }
      }

      check.lastCheck = Date.now();
    }

    // Update overall health status
    this.healthStatus.overall = overallHealthy ? 'healthy' : 'critical';
    this.healthStatus.services = results;
    this.healthStatus.lastCheck = Date.now();

    // Log overall status
    if (!overallHealthy) {
      healthLogger.error('System health degraded', {
        status: this.healthStatus.overall,
        services: results
      });
    } else {
      healthLogger.debug('System health check completed', {
        status: this.healthStatus.overall
      });
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      ...this.healthStatus,
      uptime: Date.now() - this.healthStatus.uptime,
      checks: Array.from(this.checks.entries()).map(([name, check]) => ({
        name,
        status: check.lastResult,
        failures: check.failures,
        lastCheck: check.lastCheck,
        critical: check.critical
      }))
    };
  }

  /**
   * Force immediate health check
   */
  async forceHealthCheck() {
    healthLogger.info('Forcing immediate health check');
    await this.runHealthChecks();
    return this.getHealthStatus();
  }
}

export default HealthMonitor;
