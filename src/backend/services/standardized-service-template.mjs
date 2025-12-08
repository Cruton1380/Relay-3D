/**
 * Standardized Service Template for Relay Backend Services
 * Use this template for consistent service structure across the system
 */

import logger from '../utils/logging/logger.mjs';
import { EventEmitter } from 'events';

/**
 * Base Service Class - Extended by all Relay services
 * Provides common functionality: logging, events, initialization, error handling
 */
export class BaseService extends EventEmitter {
    constructor(serviceName) {
        super();
        this.serviceName = serviceName;
        this.logger = logger.child({ module: serviceName });
        this.initialized = false;
        this.startTime = Date.now();
        
        // Service state tracking
        this.state = {
            status: 'initializing',
            errors: [],
            lastActivity: Date.now(),
            operationCount: 0
        };
    }

    /**
     * Initialize the service - Override in child classes
     */
    async initialize() {
        try {
            this.logger.info(`Initializing ${this.serviceName} service`);
            
            // Child class initialization logic goes here
            await this._initializeService();
            
            this.initialized = true;
            this.state.status = 'ready';
            this.logger.info(`${this.serviceName} service initialized successfully`);
            this.emit('service.initialized', { serviceName: this.serviceName });
            
            return { success: true };
        } catch (error) {
            this.state.status = 'error';
            this.state.errors.push({
                timestamp: Date.now(),
                error: error.message,
                stack: error.stack
            });
            this.logger.error(`Failed to initialize ${this.serviceName} service`, { error: error.message });
            this.emit('service.error', { serviceName: this.serviceName, error });
            throw error;
        }
    }

    /**
     * Override this method in child classes for specific initialization
     */
    async _initializeService() {
        // Child class implements this
    }

    /**
     * Check if service is ready for operations
     */
    isReady() {
        return this.initialized && this.state.status === 'ready';
    }

    /**
     * Get service health status
     */
    getHealth() {
        return {
            serviceName: this.serviceName,
            status: this.state.status,
            initialized: this.initialized,
            uptime: Date.now() - this.startTime,
            operationCount: this.state.operationCount,
            lastActivity: this.state.lastActivity,
            errorCount: this.state.errors.length,
            recentErrors: this.state.errors.slice(-5)
        };
    }

    /**
     * Increment operation counter and update activity
     */
    _trackOperation() {
        this.state.operationCount++;
        this.state.lastActivity = Date.now();
    }

    /**
     * Handle service errors consistently
     */
    _handleError(operation, error) {
        this.state.errors.push({
            timestamp: Date.now(),
            operation,
            error: error.message,
            stack: error.stack
        });
        
        this.logger.error(`${this.serviceName} operation failed`, {
            operation,
            error: error.message
        });
        
        this.emit('service.operation.error', {
            serviceName: this.serviceName,
            operation,
            error
        });
    }

    /**
     * Shutdown the service gracefully
     */
    async shutdown() {
        try {
            this.logger.info(`Shutting down ${this.serviceName} service`);
            
            // Child class cleanup logic
            await this._shutdownService();
            
            this.state.status = 'shutdown';
            this.initialized = false;
            this.emit('service.shutdown', { serviceName: this.serviceName });
            
            return { success: true };
        } catch (error) {
            this.logger.error(`Error shutting down ${this.serviceName} service`, { error: error.message });
            throw error;
        }
    }

    /**
     * Override this method in child classes for specific cleanup
     */
    async _shutdownService() {
        // Child class implements this
    }
}

/**
 * Service Factory - Creates and manages service instances
 */
export class ServiceFactory {
    constructor() {
        this.services = new Map();
        this.logger = logger.child({ module: 'service-factory' });
    }

    /**
     * Register a service instance
     */
    register(serviceName, serviceInstance) {
        if (!(serviceInstance instanceof BaseService)) {
            throw new Error(`Service ${serviceName} must extend BaseService`);
        }
        
        this.services.set(serviceName, serviceInstance);
        this.logger.info(`Service registered: ${serviceName}`);
    }

    /**
     * Get a service instance
     */
    get(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        return service;
    }

    /**
     * Initialize all registered services
     */
    async initializeAll() {
        const results = [];
        
        for (const [name, service] of this.services) {
            try {
                await service.initialize();
                results.push({ service: name, success: true });
            } catch (error) {
                results.push({ service: name, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Get health status of all services
     */
    getSystemHealth() {
        const health = {
            timestamp: Date.now(),
            services: [],
            summary: {
                total: this.services.size,
                ready: 0,
                errors: 0,
                initializing: 0
            }
        };

        for (const [name, service] of this.services) {
            const serviceHealth = service.getHealth();
            health.services.push(serviceHealth);
            
            // Update summary
            if (serviceHealth.status === 'ready') health.summary.ready++;
            else if (serviceHealth.status === 'error') health.summary.errors++;
            else if (serviceHealth.status === 'initializing') health.summary.initializing++;
        }

        return health;
    }

    /**
     * Shutdown all services gracefully
     */
    async shutdownAll() {
        const results = [];
        
        for (const [name, service] of this.services) {
            try {
                await service.shutdown();
                results.push({ service: name, success: true });
            } catch (error) {
                results.push({ service: name, success: false, error: error.message });
            }
        }
        
        return results;
    }
}

// Global service factory instance
export const serviceFactory = new ServiceFactory();

export default { BaseService, ServiceFactory, serviceFactory };
