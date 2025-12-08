/**
 * @fileoverview Service Registry - Dependency injection and service management
 * @module ServiceRegistry
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import { BaseService } from '../utils/BaseService.mjs';
import { logger } from '../utils/logging/logger.mjs';

/**
 * Service Registry - Manages service registration and dependency injection
 * @class ServiceRegistry
 * @extends BaseService
 */
class ServiceRegistry extends BaseService {
  /**
   * Creates an instance of ServiceRegistry
   * @param {Object} options - Configuration options
   */  constructor(options = {}) {
    super('ServiceRegistry', {
      logger: logger.child ? logger.child({ module: 'service-registry' }) : logger,
      ...options
    });
    
    /** @type {Map<string, Object>} Registered services */
    this.services = new Map();
    
    /** @type {Map<string, Array<string>>} Service dependencies */
    this.dependencies = new Map();
    
    /** @type {Set<string>} Initialized services */
    this.initialized = new Set();
    
    /** @type {boolean} Registry initialization status */
    this.isInitializing = false;
    
    this.logger.info('ServiceRegistry: Initialized');
  }

  /**
   * Initialize the service registry
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  async initialize() {
    try {
      this.logger.info('ServiceRegistry: Initializing...');
      
      // Registry is ready to accept service registrations
      this.logger.info('ServiceRegistry: Initialized successfully');
      this.updateMetrics('activity');
      
    } catch (error) {
      this.handleError(error, 'initialization');
    }
  }  /**
   * Register a service with its dependencies
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   * @param {Array} deps - Array of dependency names
   * @throws {Error} If service is already registered
   */
  register(name, service, deps = []) {
    this.updateMetrics('request');
    
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    this.services.set(name, service);
    this.dependencies.set(name, deps);
    
    this.logger.debug('ServiceRegistry: Service registered', { 
      service: name, 
      dependencies: deps 
    });
  }/**
   * Get a service by name
   * @param {string} name - Service name
   * @returns {Object} Service instance
   * @throws {Error} If service is not found
   */
  get(name) {
    this.updateMetrics('request');
    
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean} True if service is registered
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Initialize all services in dependency order
   */
  async initialize() {
    if (this.isInitializing) {
      throw new Error('Services are already being initialized');
    }

    this.isInitializing = true;
    
    try {
      const initOrder = this._calculateInitOrder();
      
      for (const serviceName of initOrder) {
        await this._initializeService(serviceName);
      }
      
      logger.info('All services initialized successfully', { 
        count: this.services.size 
      });
    } catch (error) {
      logger.error('Service initialization failed', { error: error.message });
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initialize a single service
   * @param {string} serviceName - Name of service to initialize
   */
  async _initializeService(serviceName) {
    if (this.initialized.has(serviceName)) {
      return;
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Initialize dependencies first
    const deps = this.dependencies.get(serviceName) || [];
    for (const dep of deps) {
      await this._initializeService(dep);
    }

    // Initialize the service if it has an initialize method
    if (typeof service.initialize === 'function') {
      try {
        await service.initialize();
        logger.debug('Service initialized', { service: serviceName });
      } catch (error) {
        logger.error('Service initialization failed', { 
          service: serviceName, 
          error: error.message 
        });
        throw error;
      }
    }

    this.initialized.add(serviceName);
  }

  /**
   * Calculate initialization order based on dependencies
   * @returns {Array} Array of service names in initialization order
   */
  _calculateInitOrder() {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (serviceName) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving ${serviceName}`);
      }
      
      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);
      
      const deps = this.dependencies.get(serviceName) || [];
      for (const dep of deps) {
        if (!this.services.has(dep)) {
          throw new Error(`Dependency ${dep} not found for service ${serviceName}`);
        }
        visit(dep);
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return order;
  }
  /**
   * Shutdown all services
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('ServiceRegistry: Shutting down all services...');
    
    try {
      const shutdownOrder = [...this.initialized].reverse();
      
      for (const serviceName of shutdownOrder) {
        const service = this.services.get(serviceName);
        if (service && typeof service.shutdown === 'function') {
          try {
            await service.shutdown();
            this.logger.debug('ServiceRegistry: Service shutdown', { service: serviceName });
          } catch (error) {
            this.logger.error('ServiceRegistry: Service shutdown failed', { 
              service: serviceName, 
              error: error.message
            });
          }
        }
        this.initialized.delete(serviceName);
      }
      
      this.logger.info('ServiceRegistry: Shutdown complete');
    } catch (error) {
      this.logger.error('ServiceRegistry: Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Perform health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const serviceCount = this.services.size;
      const initializedCount = this.initialized.size;
      const services = {};
      
      // Check each registered service
      for (const [name, service] of this.services.entries()) {
        services[name] = {
          registered: true,
          initialized: this.initialized.has(name),
          hasShutdown: typeof service.shutdown === 'function',
          hasHealthCheck: typeof service.healthCheck === 'function'
        };
      }
      
      return {
        status: 'healthy',
        serviceCount,
        initializedCount,
        isInitializing: this.isInitializing,
        services
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        serviceCount: this.services.size,
        initializedCount: this.initialized.size
      };
    }  }
}

/**
 /**
 * Create and export service instance
 */
const serviceRegistry = new ServiceRegistry();
export { ServiceRegistry };
export default serviceRegistry;
