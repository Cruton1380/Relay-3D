// backend/utils/BaseService.mjs
// Base service class providing common service functionality

import EventEmitter from 'events';
import logger from './logging/logger.mjs';

// Service status constants
export const ServiceStatus = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error'
};

// Service events
export const ServiceEvents = {
  STARTING: 'starting',
  STARTED: 'started',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error',
  STATUS_CHANGE: 'statusChange'
};

/**
 * Base Service Class
 * Provides common functionality for all services
 */
export class BaseService extends EventEmitter {
  constructor(name = 'UnnamedService') {
    super();
    
    this.name = name;
    this.serviceName = name;  // Set serviceName for health status compatibility
    this.status = ServiceStatus.STOPPED;
    this.logger = logger.child({ service: name });
    this.startedAt = null;
    this.stoppedAt = null;
    this.config = {};
    this.dependencies = [];
    this.errorCount = 0;
    this.lastError = null;
    
    // Metrics tracking
    this.metrics = {
      requests: 0,
      errors: 0,
      activity: 0,
      service_starts: 0,
      service_stops: 0,
      events_emitted: 0,
      connections: 0,
      messages_received: 0,
      messages_sent: 0,
      authentications: 0,
      disconnections: 0,
      broadcasts_sent: 0,
      averageOperationTime: 0,
      lastUpdateTime: Date.now()
    };
  }

  /**
   * Get current service status
   * @returns {string} Current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if service is running
   * @returns {boolean} True if running
   */
  isRunning() {
    return this.status === ServiceStatus.RUNNING;
  }

  /**
   * Check if service is stopped
   * @returns {boolean} True if stopped
   */
  isStopped() {
    return this.status === ServiceStatus.STOPPED;
  }

  /**
   * Set service status
   * @param {string} status - New status
   * @param {string} [reason] - Reason for status change
   */
  setStatus(status, reason = null) {
    const oldStatus = this.status;
    this.status = status;
    
    this.logger.debug(`Status changed from ${oldStatus} to ${status}`, {
      reason,
      timestamp: new Date().toISOString()
    });
    
    this.emit(ServiceEvents.STATUS_CHANGE, {
      from: oldStatus,
      to: status,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start the service
   * @returns {Promise<void>}
   */
  async start() {
    if (this.status === ServiceStatus.RUNNING) {
      this.logger.warn('Service is already running');
      return;
    }

    if (this.status === ServiceStatus.STARTING) {
      this.logger.warn('Service is already starting');
      return;
    }

    try {
      this.setStatus(ServiceStatus.STARTING, 'Start requested');
      this.emit(ServiceEvents.STARTING);
      
      this.logger.info('Starting service');
      
      // Call the implementation-specific start logic
      await this.onStart();
      
      this.startedAt = new Date();
      this.stoppedAt = null;
      this.setStatus(ServiceStatus.RUNNING, 'Start completed');
      this.emit(ServiceEvents.STARTED);
      
      this.logger.info('Service started successfully');
    } catch (error) {
      this.errorCount++;
      this.lastError = error;
      this.setStatus(ServiceStatus.ERROR, error.message);
      this.emit(ServiceEvents.ERROR, error);
      
      this.logger.error('Failed to start service', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Stop the service
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.status === ServiceStatus.STOPPED) {
      this.logger.warn('Service is already stopped');
      return;
    }

    if (this.status === ServiceStatus.STOPPING) {
      this.logger.warn('Service is already stopping');
      return;
    }

    try {
      this.setStatus(ServiceStatus.STOPPING, 'Stop requested');
      this.emit(ServiceEvents.STOPPING);
      
      this.logger.info('Stopping service');
      
      // Call the implementation-specific stop logic
      await this.onStop();
      
      this.stoppedAt = new Date();
      this.setStatus(ServiceStatus.STOPPED, 'Stop completed');
      this.emit(ServiceEvents.STOPPED);
      
      this.logger.info('Service stopped successfully');
    } catch (error) {
      this.errorCount++;
      this.lastError = error;
      this.setStatus(ServiceStatus.ERROR, error.message);
      this.emit(ServiceEvents.ERROR, error);
      
      this.logger.error('Failed to stop service', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Restart the service
   * @returns {Promise<void>}
   */
  async restart() {
    this.logger.info('Restarting service');
    
    if (this.isRunning()) {
      await this.stop();
    }
    
    await this.start();
  }

  /**
   * Get service health information
   * @returns {Object} Health information
   */
  getHealth() {
    const uptime = this.startedAt ? Date.now() - this.startedAt.getTime() : 0;
    
    return {
      name: this.name,
      status: this.status,
      uptime,
      startedAt: this.startedAt?.toISOString(),
      stoppedAt: this.stoppedAt?.toISOString(),
      errorCount: this.errorCount,
      lastError: this.lastError?.message,
      memoryUsage: process.memoryUsage(),
      isHealthy: this.status === ServiceStatus.RUNNING && this.errorCount === 0
    };
  }

  /**
   * Set service configuration
   * @param {Object} config - Configuration object
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    this.logger.debug('Configuration updated', { config: this.config });
  }

  /**
   * Add service dependency
   * @param {BaseService} dependency - Service dependency
   */
  addDependency(dependency) {
    if (dependency instanceof BaseService) {
      this.dependencies.push(dependency);
      this.logger.debug(`Added dependency: ${dependency.name}`);
    } else {
      throw new Error('Dependency must be an instance of BaseService');
    }
  }

  /**
   * Wait for dependencies to be ready
   * @returns {Promise<void>}
   */
  async waitForDependencies() {
    this.logger.debug(`Waiting for ${this.dependencies.length} dependencies`);
    
    const promises = this.dependencies.map(dep => {
      if (dep.isRunning()) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Dependency ${dep.name} did not start within timeout`));
        }, 30000); // 30 second timeout
        
        const onStarted = () => {
          clearTimeout(timeout);
          dep.off(ServiceEvents.STARTED, onStarted);
          dep.off(ServiceEvents.ERROR, onError);
          resolve();
        };
        
        const onError = (error) => {
          clearTimeout(timeout);
          dep.off(ServiceEvents.STARTED, onStarted);
          dep.off(ServiceEvents.ERROR, onError);
          reject(error);
        };
        
        dep.on(ServiceEvents.STARTED, onStarted);
        dep.on(ServiceEvents.ERROR, onError);
      });
    });
    
    await Promise.all(promises);
    this.logger.debug('All dependencies are ready');
  }

  /**
   * Implementation-specific start logic
   * Override this method in subclasses
   * @returns {Promise<void>}
   */
  async onStart() {
    // Default implementation - override in subclasses
    this.logger.debug('Default onStart implementation - no action taken');
  }

  /**
   * Implementation-specific stop logic
   * Override this method in subclasses
   * @returns {Promise<void>}
   */
  async onStop() {
    // Default implementation - override in subclasses
    this.logger.debug('Default onStop implementation - no action taken');
  }

  /**
   * Handle graceful shutdown
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    this.logger.info('Initiating graceful shutdown');
    
    try {
      await this.stop();
    } catch (error) {
      this.logger.error('Error during graceful shutdown', { error: error.message });
    }
  }

  /**
   * Update service metrics
   * @param {string} metricName - Name of the metric to update
   * @param {number} [value=1] - Value to add to the metric
   */
  updateMetrics(metricName, value = 1) {
    try {
      if (this.metrics.hasOwnProperty(metricName)) {
        this.metrics[metricName] += value;
      } else {
        this.metrics[metricName] = value;
      }
      this.metrics.lastUpdateTime = Date.now();
      
      this.logger.debug(`Metric updated: ${metricName} = ${this.metrics[metricName]}`);
    } catch (error) {
      this.logger.warn(`Failed to update metric ${metricName}:`, error.message);
    }
  }

  /**
   * Get service metrics
   * @returns {Object} Current service metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }  /**
   * Reset service metrics
   */
  resetMetrics() {
    Object.keys(this.metrics).forEach(key => {
      if (typeof this.metrics[key] === 'number' && key !== 'lastUpdateTime') {
        this.metrics[key] = 0;
      }
    });
    this.metrics.lastUpdateTime = Date.now();
    this.logger.debug('Service metrics reset');
  }

  /**
   * Handle service errors consistently
   * @param {Error} error - The error that occurred
   * @param {string} [context] - Additional context about where the error occurred
   */
  handleError(error, context = '') {
    this.errorCount++;
    this.lastError = error;
    
    const logMessage = context ? `${context}: ${error.message}` : error.message;
    this.logger.error(logMessage, {
      error: error.message,
      stack: error.stack,
      context
    });
    
    this.updateMetrics('errors');
    this.emit(ServiceEvents.ERROR, error);
    
    // Re-throw the error so calling code can handle it appropriately
    throw error;
  }
}

export default BaseService;
