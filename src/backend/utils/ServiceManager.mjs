/**
 * @fileoverview Service Manager - Unified service lifecycle management
 * @module ServiceManager
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import { BaseService, ServiceEvents, ServiceStatus } from './BaseService.mjs';
import { eventBus } from './eventBus.mjs';

/**
 * Service Manager
 * Coordinates service lifecycle and dependency management across the application
 * @class ServiceManager
 * @extends BaseService
 */
export class ServiceManager extends BaseService {
  /**
   * Creates an instance of ServiceManager
   * @param {Object} options - Configuration options
   * @param {Object} [options.logger] - Logger instance
   * @param {number} [options.startupTimeout=30000] - Service startup timeout in ms
   * @param {number} [options.shutdownTimeout=10000] - Service shutdown timeout in ms
   */
  constructor(options = {}) {
    super('ServiceManager', options);
    
    /** @type {Map<string, Object>} Registered services */
    this.services = new Map();
    
    /** @type {Map<string, Array<string>>} Service dependency graph */
    this.dependencyGraph = new Map();
    
    /** @type {Array<string>} Service initialization order */
    this.initializationOrder = [];
    
    /** @type {number} Startup timeout in milliseconds */
    this.startupTimeout = options.startupTimeout || 30000;
    
    /** @type {number} Shutdown timeout in milliseconds */
    this.shutdownTimeout = options.shutdownTimeout || 10000;
    
    /** @type {boolean} Whether shutdown is in progress */
    this.isShuttingDown = false;
  }

  /**
   * Initialize the Service Manager
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.log('ServiceManager: Initializing service management system');
    
    // Setup graceful shutdown handlers
    this.setupShutdownHandlers();
    
    this.logger.log('ServiceManager: Initialized successfully');
  }

  /**
   * Register a service with the manager
   * @param {string} name - Service name
   * @param {BaseService|Object} service - Service instance or factory
   * @param {Array<string>} [dependencies=[]] - Service dependencies
   * @throws {Error} If service registration fails
   */
  register(name, service, dependencies = []) {
    try {
      if (this.services.has(name)) {
        throw new Error(`Service '${name}' is already registered`);
      }

      // Validate service interface
      if (service && typeof service.start === 'function' && typeof service.stop === 'function') {
        // Service follows the interface
      } else if (service instanceof BaseService) {
        // Service extends BaseService
      } else {
        throw new Error(`Service '${name}' must implement start() and stop() methods or extend BaseService`);
      }

      this.services.set(name, {
        instance: service,
        dependencies: dependencies || [],
        status: ServiceStatus.STOPPED,
        startTime: null,
        error: null
      });

      this.dependencyGraph.set(name, dependencies);
      
      this.logger.log(`ServiceManager: Registered service '${name}' with dependencies: [${dependencies.join(', ')}]`);
      
      // Recalculate initialization order
      this.calculateInitializationOrder();
      
    } catch (error) {
      this.handleError(error, `registering service '${name}'`);
    }
  }

  /**
   * Unregister a service
   * @param {string} name - Service name
   * @returns {Promise<void>}
   */
  async unregister(name) {
    try {
      if (!this.services.has(name)) {
        this.logger.warn(`ServiceManager: Service '${name}' is not registered`);
        return;
      }

      const serviceInfo = this.services.get(name);
      
      // Stop the service if it's running
      if (serviceInfo.status === ServiceStatus.RUNNING) {
        await this.stopService(name);
      }

      this.services.delete(name);
      this.dependencyGraph.delete(name);
      
      // Recalculate initialization order
      this.calculateInitializationOrder();
      
      this.logger.log(`ServiceManager: Unregistered service '${name}'`);
      
    } catch (error) {
      this.handleError(error, `unregistering service '${name}'`);
    }
  }

  /**
   * Start all services in dependency order
   * @returns {Promise<void>}
   * @throws {Error} If service startup fails
   */
  async startAllServices() {
    try {
      this.logger.log('ServiceManager: Starting all services...');
      
      const startPromises = this.initializationOrder.map(async (serviceName) => {
        try {
          await this.startService(serviceName);
        } catch (error) {
          this.logger.error(`ServiceManager: Failed to start service '${serviceName}':`, error);
          throw error;
        }
      });

      await Promise.all(startPromises);
      
      this.logger.log('ServiceManager: All services started successfully');
      eventBus.emit(ServiceEvents.STARTED, { manager: true });
      
    } catch (error) {
      this.handleError(error, 'starting all services');
    }
  }

  /**
   * Start a specific service and its dependencies
   * @param {string} name - Service name
   * @returns {Promise<void>}
   * @throws {Error} If service startup fails
   */
  async startService(name) {
    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      throw new Error(`Service '${name}' is not registered`);
    }

    if (serviceInfo.status === ServiceStatus.RUNNING) {
      this.logger.warn(`ServiceManager: Service '${name}' is already running`);
      return;
    }

    try {
      this.logger.log(`ServiceManager: Starting service '${name}'...`);
      serviceInfo.status = ServiceStatus.INITIALIZING;
      eventBus.emit(ServiceEvents.STARTING, { service: name });

      // Start dependencies first
      for (const dependency of serviceInfo.dependencies) {
        await this.startService(dependency);
      }

      // Start the service with timeout
      await this.withTimeout(
        serviceInfo.instance.start(),
        this.startupTimeout,
        `Service '${name}' startup timeout`
      );

      serviceInfo.status = ServiceStatus.RUNNING;
      serviceInfo.startTime = new Date();
      serviceInfo.error = null;

      this.logger.log(`ServiceManager: Service '${name}' started successfully`);
      eventBus.emit(ServiceEvents.STARTED, { service: name });

    } catch (error) {
      serviceInfo.status = ServiceStatus.ERROR;
      serviceInfo.error = error;
      this.handleError(error, `starting service '${name}'`);
    }
  }

  /**
   * Stop all services in reverse dependency order
   * @returns {Promise<void>}
   */
  async stopAllServices() {
    try {
      this.logger.log('ServiceManager: Stopping all services...');
      this.isShuttingDown = true;
      
      // Stop in reverse order
      const stopOrder = [...this.initializationOrder].reverse();
      
      for (const serviceName of stopOrder) {
        try {
          await this.stopService(serviceName);
        } catch (error) {
          this.logger.error(`ServiceManager: Error stopping service '${serviceName}':`, error);
          // Continue stopping other services
        }
      }
      
      this.logger.log('ServiceManager: All services stopped');
      eventBus.emit(ServiceEvents.STOPPED, { manager: true });
      
    } catch (error) {
      this.logger.error('ServiceManager: Error during shutdown:', error);
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Stop a specific service
   * @param {string} name - Service name
   * @returns {Promise<void>}
   */
  async stopService(name) {
    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      this.logger.warn(`ServiceManager: Service '${name}' is not registered`);
      return;
    }

    if (serviceInfo.status !== ServiceStatus.RUNNING) {
      this.logger.warn(`ServiceManager: Service '${name}' is not running`);
      return;
    }

    try {
      this.logger.log(`ServiceManager: Stopping service '${name}'...`);
      serviceInfo.status = ServiceStatus.STOPPING;
      eventBus.emit(ServiceEvents.STOPPING, { service: name });

      // Stop the service with timeout
      await this.withTimeout(
        serviceInfo.instance.stop(),
        this.shutdownTimeout,
        `Service '${name}' shutdown timeout`
      );

      serviceInfo.status = ServiceStatus.STOPPED;
      serviceInfo.startTime = null;

      this.logger.log(`ServiceManager: Service '${name}' stopped successfully`);
      eventBus.emit(ServiceEvents.STOPPED, { service: name });

    } catch (error) {
      serviceInfo.status = ServiceStatus.ERROR;
      serviceInfo.error = error;
      this.logger.error(`ServiceManager: Error stopping service '${name}':`, error);
    }
  }

  /**
   * Get health status of all services
   * @returns {Promise<Object>} Health status report
   */
  async getHealthStatus() {
    const healthReport = {
      manager: {
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
        totalServices: this.services.size
      },
      services: {}
    };

    for (const [name, serviceInfo] of this.services.entries()) {
      try {
        if (typeof serviceInfo.instance.getHealth === 'function') {
          healthReport.services[name] = await serviceInfo.instance.getHealth();
        } else {
          healthReport.services[name] = {
            status: serviceInfo.status === ServiceStatus.RUNNING ? 'running' : 'stopped',
            startTime: serviceInfo.startTime,
            error: serviceInfo.error?.message
          };
        }
      } catch (error) {
        healthReport.services[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return healthReport;
  }

  /**
   * Calculate service initialization order based on dependencies
   * @private
   * @throws {Error} If circular dependencies are detected
   */
  calculateInitializationOrder() {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (serviceName) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving service '${serviceName}'`);
      }
      
      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);
      
      const dependencies = this.dependencyGraph.get(serviceName) || [];
      for (const dependency of dependencies) {
        if (!this.services.has(dependency)) {
          throw new Error(`Service '${serviceName}' depends on unregistered service '${dependency}'`);
        }
        visit(dependency);
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      if (!visited.has(serviceName)) {
        visit(serviceName);
      }
    }

    this.initializationOrder = order;
    this.logger.log(`ServiceManager: Calculated initialization order: [${order.join(', ')}]`);
  }

  /**
   * Setup graceful shutdown handlers
   * @private
   */
  setupShutdownHandlers() {
    const gracefulShutdown = async (signal) => {
      this.logger.log(`ServiceManager: Received ${signal}, initiating graceful shutdown...`);
      
      try {
        await this.stopAllServices();
        process.exit(0);
      } catch (error) {
        this.logger.error('ServiceManager: Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('ServiceManager: Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('ServiceManager: Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Execute a promise with timeout
   * @private
   * @param {Promise} promise - Promise to execute
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} timeoutMessage - Error message for timeout
   * @returns {Promise} Promise that resolves or rejects with timeout
   */
  async withTimeout(promise, timeout, timeoutMessage) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeout);
      })
    ]);
  }
}

// Create singleton instance
const serviceManager = new ServiceManager();

export default serviceManager;
