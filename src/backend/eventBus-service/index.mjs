/**
 * @fileoverview EventBus Service - Centralized event management
 * @module EventBusService
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import { EventEmitter } from 'events';
import { BaseService } from '../utils/BaseService.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * EventBus Service - Manages application-wide event communication
 * @class EventBusService
 * @extends BaseService
 */
class EventBusService extends BaseService {
  /**
   * Creates an instance of EventBusService
   * @param {Object} options - Configuration options
   */  constructor(options = {}) {
    super('EventBusService', {
      logger: logger.child ? logger.child({ module: 'eventbus-service' }) : logger,
      ...options
    });
      /** @type {EventEmitter} Internal event emitter */
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Set high limit for listeners
    
    /** @type {Map<string, Array>} Event listener registry */
    this.listenerRegistry = new Map();
    
    /** @type {Map<string, number>} Event emission counters */
    this.eventCounters = new Map();
    
    this.logger.info('EventBusService: Initialized');
  }

  /**
   * Initialize the EventBus service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.logger.info('EventBusService: Initializing...');
      
      // Setup default event handlers for service monitoring
      this.registerSystemEventHandlers();
      
      this.logger.info('EventBusService: Initialized successfully');
      this.updateMetrics('activity');
      
    } catch (error) {
      this.handleError(error, 'initialization');
      throw error;
    }
  }

  /**
   * Start the EventBus service
   * @returns {Promise<void>}
   */
  async start() {
    try {
      if (this.isRunning) {
        this.logger.warn('EventBusService: Service is already running');
        return;
      }
      
      this.isRunning = true;
      this.startTime = Date.now();
      
      this.logger.info('EventBusService: Service started successfully');
      this.updateMetrics('service_starts');
      
    } catch (error) {
      this.handleError(error, 'starting service');
      throw error;
    }
  }

  /**
   * Stop the EventBus service gracefully
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      if (!this.isRunning) {
        this.logger.warn('EventBusService: Service is not running');
        return;
      }
      
      this.logger.info('EventBusService: Stopping service...');
      this.isRunning = false;
      
      // Remove all listeners
      this.emitter.removeAllListeners();
      this.listenerRegistry.clear();
      this.eventCounters.clear();
      
      this.logger.info('EventBusService: Service stopped successfully');
      this.updateMetrics('service_stops');
      
    } catch (error) {
      this.handleError(error, 'stopping service');
      throw error;
    }
  }

  /**
   * Register system event handlers for monitoring
   * @private
   */
  registerSystemEventHandlers() {
    // Monitor service events
    this.on('service.start', (data) => {
      this.logger.info(`EventBusService: Service started: ${data.serviceName}`);
    });
    
    this.on('service.stop', (data) => {
      this.logger.info(`EventBusService: Service stopped: ${data.serviceName}`);
    });
    
    this.on('service.error', (data) => {
      this.logger.error(`EventBusService: Service error in ${data.serviceName}:`, data.error);
    });
  }  /**
   * Emit an event with logging and error handling
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   * @returns {boolean} Whether the event had listeners
   */
  emit(eventName, data) {
    this.logger.debug(`EventBusService: Event emitted: ${eventName}`);
    this.updateMetrics('events_emitted');
    
    // Update event counter
    this.eventCounters.set(eventName, (this.eventCounters.get(eventName) || 0) + 1);
    
    // The emitter.emit method is already overridden to handle errors
    // Just call it directly - errors will be handled by the override
    return this.emitter.emit(eventName, data);
  }  /**
   * Register an event listener
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Event listener function
   * @returns {EventBusService} This instance for chaining
   */  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    // Wrap listener to handle errors gracefully
    const wrappedListener = (...args) => {
      try {
        return listener(...args);
      } catch (error) {
        // Handle listener errors gracefully
        if (eventName !== 'error') {
          try {
            // Emit error event for the error handler
            this.emitter.emit('error', error, eventName);
          } catch (e) {
            // Ignore errors from error handlers to prevent infinite loops
          }
        }
        // Don't re-throw the error - let other listeners continue
      }
    };
    
    this.emitter.on(eventName, wrappedListener);
    this.logger.debug(`EventBusService: Registered listener for event: ${eventName}`);
    
    return this;
  }  /**
   * Register a one-time event listener
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Event listener function
   * @returns {EventBusService} This instance for chaining
   */  once(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    // Wrap listener to handle errors gracefully
    const wrappedListener = (...args) => {
      try {
        return listener(...args);
      } catch (error) {
        // Handle listener errors gracefully
        if (eventName !== 'error') {
          try {
            // Emit error event for the error handler
            this.emitter.emit('error', error, eventName);
          } catch (e) {
            // Ignore errors from error handlers to prevent infinite loops
          }
        }
        // Don't re-throw the error - let other listeners continue
      }
    };
    
    this.emitter.once(eventName, wrappedListener);
    this.logger.debug(`EventBusService: Registered one-time listener for event: ${eventName}`);
    
    return this;
  }

  /**
   * Remove event listener(s)
   * @param {string} eventName - Name of the event
   * @param {Function} [listener] - Specific listener to remove (optional)
   * @returns {EventBusService} This instance for chaining
   */
  off(eventName, listener) {
    if (listener) {
      this.emitter.off(eventName, listener);
      this.logger.debug(`EventBusService: Removed specific listener for event: ${eventName}`);
    } else {
      this.emitter.removeAllListeners(eventName);
      this.logger.debug(`EventBusService: Removed all listeners for event: ${eventName}`);
    }
    
    return this;
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param {string} [eventName] - Event name (optional, removes all if not specified)
   * @returns {EventBusService} This instance for chaining
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.emitter.removeAllListeners(eventName);
      this.logger.debug(`EventBusService: Removed all listeners for event: ${eventName}`);
    } else {
      this.emitter.removeAllListeners();
      this.eventCounters.clear();
      this.logger.debug('EventBusService: Removed all listeners for all events');
    }
    
    return this;
  }

  /**
   * Get a list of all registered event names
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return this.emitter.eventNames();
  }

  /**
   * Get listener count for a specific event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  getListenerCount(eventName) {
    return this.emitter.listenerCount(eventName);
  }

  /**
   * Get event emission statistics
   * @returns {Object} Event statistics
   */
  getEventStats() {
    return Object.fromEntries(this.eventCounters);
  }

  /**
   * Get comprehensive health status of the EventBus service
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    try {
      const eventNames = this.getEventNames();
      const totalListeners = eventNames.reduce((sum, name) => sum + this.getListenerCount(name), 0);
      
      return {
        service: this.serviceName,
        status: this.isRunning ? 'healthy' : 'unhealthy',
        isRunning: this.isRunning,
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        events: {
          registeredEventTypes: eventNames.length,
          totalListeners: totalListeners,
          eventNames: eventNames
        },
        statistics: this.getEventStats(),
        lastCheck: Date.now(),
        metrics: this.metrics
      };
    } catch (error) {
      this.handleError(error, 'getting health status');
      return {
        service: this.serviceName,
        status: 'unhealthy',
        error: error.message,
        lastCheck: Date.now()
      };
    }
  }

  /**
   * Get the current max listeners setting
   * @returns {number} Maximum number of listeners
   */
  getMaxListeners() {
    return this.emitter.getMaxListeners();
  }

  /**
   * Set the maximum number of listeners
   * @param {number} n - Maximum number of listeners
   * @returns {EventBusService} This instance for chaining
   */
  setMaxListeners(n) {
    this.emitter.setMaxListeners(n);
    this.logger.debug(`EventBusService: Set max listeners to: ${n}`);
    return this;
  }

  /**
   * Get all event names that have listeners (alias for getEventNames)
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return this.getEventNames();
  }

  /**
   * Get listener count for a specific event (alias for compatibility)
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    return this.getListenerCount(eventName);
  }
}

// Export singleton instance
export const eventBus = new EventBusService();
export default eventBus;
