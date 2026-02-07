/**
 * @fileoverview Configuration Service - Manages system configuration and settings
 * @module ConfigService
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { BaseService } from '../utils/BaseService.mjs';

// Default config values
const DEFAULT_CONFIG = {
  security: {
    jwtSecret: process.env.JWT_SECRET || 'relay-development-secret',
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    csrf: process.env.CSRF_SECRET || 'relay-csrf-secret-development',
    passwordDanceMoves: 5,
    minBiometricScore: 0.85,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireTwoFactor: process.env.NODE_ENV === 'production'
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    useTLS: process.env.USE_TLS === 'true' || false,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    encryptData: process.env.ENCRYPT_DATA === 'true' || false
  },
  network: {
    p2pEnabled: process.env.P2P_ENABLED === 'true' || false,
    bootstrapNodes: process.env.BOOTSTRAP_NODES ? process.env.BOOTSTRAP_NODES.split(',') : [],
    maxPeers: parseInt(process.env.MAX_PEERS, 10) || 20,
    discoveryInterval: parseInt(process.env.DISCOVERY_INTERVAL, 10) || 60000 // 1 minute
  },
  voting: {
    minimumVotingAge: parseInt(process.env.MIN_VOTING_AGE, 10) || 18,
    voteCooldownPeriod: parseInt(process.env.VOTE_COOLDOWN, 10) || 86400000, // 24 hours
    requireRegion: process.env.REQUIRE_REGION === 'true' || true  },
  onboarding: {
    inviteRequired: process.env.INVITE_REQUIRED === 'true' || true,
    biometricEnrollment: process.env.BIOMETRIC_ENROLLMENT === 'true' || true,
    deviceAttestationRequired: process.env.DEVICE_ATTESTATION === 'true' || false
  },  invites: {
    invitesPerNewUser: parseInt(process.env.INVITES_PER_NEW_USER, 10) || 3, // Used when decay reaches minimum (1 invite)
    founderIds: process.env.FOUNDER_IDS ? process.env.FOUNDER_IDS.split(',') : [],
    decayFactor: parseFloat(process.env.INVITE_DECAY_FACTOR) || 1.0, // Linear decay: 1 = subtract 1 per generation
    minInvites: parseInt(process.env.MIN_INVITES_PER_USER, 10) || 1,
    inviteExpiryDays: parseInt(process.env.INVITE_EXPIRY_DAYS, 10) || 14
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.LOG_CONSOLE === 'true' || true,
    file: process.env.LOG_FILE === 'true' || false,
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m'
  }
};

// Logger for config service
const configLogger = logger.child({ module: 'config-service' });

/**
 * Configuration Service - Manages application configuration with standardized lifecycle
 * @class ConfigService
 * @extends BaseService
 */
class ConfigService extends BaseService {
  /**
   * Creates an instance of ConfigService
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super('ConfigService', {
      logger: logger.child({ module: 'config-service' }),
      ...options
    });
    
    /** @type {Object} Current configuration data */
    this.config = { ...DEFAULT_CONFIG };
    
    /** @type {string} Path to configuration file */
    this.configFile = path.join(
      process.env.DATA_DIR || './data',
      'system/config.json'
    );
    
    /** @type {boolean} Whether configuration has been loaded */
    this.loaded = false;
    
    /** @type {Set<Function>} Configuration change listeners */
    this.changeListeners = new Set();
    
    this.logger.info('ConfigService: Initialized');
  }

  /**
   * Initialize the configuration service
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  async initialize() {
    try {
      this.logger.info('ConfigService: Initializing...');
      
      // Load configuration from file
      await this.load();
      
      // Validate critical configuration
      this.validateConfig();
      
      this.logger.info('ConfigService: Initialized successfully');
      this.updateMetrics('activity');
      
    } catch (error) {
      this.handleError(error, 'initialization');
    }
  }
  /**
   * Load configuration from file
   * @returns {Promise<Object>} Loaded configuration
   * @throws {Error} If loading fails
   */
  async load() {
    if (this.loaded) {
      return this.config;
    }
    
    try {
      this.logger.info('ConfigService: Loading configuration...');
      this.updateMetrics('request');
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.configFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Try to read config file
      try {
        const fileData = await fs.readFile(this.configFile, 'utf8');
        const fileConfig = JSON.parse(fileData);
        
        // Deep merge with defaults
        this.config = this.deepMerge(DEFAULT_CONFIG, fileConfig);
        
        this.logger.info('ConfigService: Configuration loaded from file');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.logger.error('ConfigService: Error reading configuration file', { error: error.message });
          throw error;
        } else {
          // File doesn't exist, save default config
          await this.save();
          this.logger.info('ConfigService: Created default configuration file');
        }
      }
      
      this.loaded = true;
      this.notifyConfigChange('loaded', this.config);
      
      return this.config;
    } catch (error) {
      this.updateMetrics('error');
      this.handleError(error, 'loading configuration');
    }
  }
  /**
   * Save configuration to file
   * @returns {Promise<boolean>} True if saved successfully
   * @throws {Error} If saving fails
   */
  async save() {
    try {
      this.logger.info('ConfigService: Saving configuration...');
      this.updateMetrics('request');
      
      const dataDir = path.dirname(this.configFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2), 'utf8');
      this.logger.info('ConfigService: Configuration saved to file');
      
      this.notifyConfigChange('saved', this.config);
      return true;
    } catch (error) {
      this.updateMetrics('error');
      this.handleError(error, 'saving configuration');
    }
  }

  /**
   * Get a configuration value by path
   * @param {string} path - Dot-notation path to configuration value
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Configuration value or default
   */
  get(path, defaultValue) {
    if (!this.loaded) {
      // Load synchronously for initial gets
      if (typeof this.config !== 'object') {
        this.config = { ...DEFAULT_CONFIG };
      }
    }
    
    if (!path) {
      return this.config;
    }
    
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Set a configuration value by path
   * @param {string} path - Dot-notation path to configuration value
   * @param {*} value - Value to set
   * @returns {boolean} True if successful
   */
  set(path, value) {
    if (!path) {
      return false;
    }
    
    const parts = path.split('.');
    let current = this.config;
    
    // Navigate to the parent of the property we want to set
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (current[part] === undefined) {
        current[part] = {};
      }
      
      if (typeof current[part] !== 'object') {
        return false; // Can't set a property on a non-object
      }
      
      current = current[part];
    }
    
    // Set the value
    current[parts[parts.length - 1]] = value;
    
    return true;
  }

  /**
   * Update multiple configuration values
   * @param {Object} updates - Object with dot-notation paths as keys
   * @returns {boolean} True if successful
   */
  update(updates) {
    if (!updates || typeof updates !== 'object') {
      return false;
    }
    
    let success = true;
    
    for (const [path, value] of Object.entries(updates)) {
      if (!this.set(path, value)) {
        success = false;
      }
    }
    
    return success;
  }

  /**
   * Reset configuration to defaults
   * @returns {Object} Default configuration
   */
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    return this.config;
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }    
    return output;
  }

  /**
   * Validate critical configuration values
   * @private
   * @throws {Error} If validation fails
   */
  validateConfig() {
    const required = [
      'security.jwtSecret',
      'server.port',
      'storage.dataDir'
    ];

    for (const path of required) {
      const value = this.get(path);
      if (value === undefined || value === null || value === '') {
        throw new Error(`Required configuration missing: ${path}`);
      }
    }

    // Validate JWT secret in production
    if (process.env.NODE_ENV === 'production' && this.get('security.jwtSecret') === 'relay-development-secret') {
      throw new Error('Production environment requires a secure JWT secret');
    }

    this.logger.info('ConfigService: Configuration validation passed');
  }

  /**
   * Add configuration change listener
   * @param {Function} listener - Change listener function
   * @returns {Function} Removal function
   */
  addChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Notify configuration change listeners
   * @private
   * @param {string} type - Change type ('loaded', 'saved', 'updated')
   * @param {Object} config - Configuration data
   */
  notifyConfigChange(type, config) {
    this.changeListeners.forEach(listener => {
      try {
        listener(type, config);
      } catch (error) {
        this.logger.error('ConfigService: Error in change listener:', error);
      }
    });
  }

  /**
   * Get configuration schema information
   * @returns {Object} Configuration schema
   */
  getSchema() {
    return {
      security: {
        jwtSecret: { type: 'string', required: true, sensitive: true },
        jwtExpiry: { type: 'string', default: '1h' },
        passwordDanceMoves: { type: 'number', min: 3, max: 10 },
        minBiometricScore: { type: 'number', min: 0, max: 1 },
        maxLoginAttempts: { type: 'number', min: 1 },
        lockoutTime: { type: 'number', min: 60000 },
        sessionTimeout: { type: 'number', min: 300000 },
        requireTwoFactor: { type: 'boolean' }
      },
      server: {
        port: { type: 'number', min: 1, max: 65535, required: true },
        host: { type: 'string', default: 'localhost' },
        corsOrigins: { type: 'array', items: 'string' },
        useTLS: { type: 'boolean', default: false }
      },
      storage: {
        dataDir: { type: 'string', required: true },
        maxFileSize: { type: 'number', min: 1024 },
        encryptData: { type: 'boolean', default: false }
      }
    };
  }

  /**
   * Perform health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Check if config file is accessible
      await fs.access(this.configFile);
      
      // Check if critical config values are present
      this.validateConfig();
      
      return {
        status: 'healthy',
        loaded: this.loaded,
        configFile: this.configFile,
        lastModified: (await fs.stat(this.configFile)).mtime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        loaded: this.loaded
      };
    }
  }

  /**
   * Shutdown cleanup
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('ConfigService: Shutting down...');
    
    try {
      // Save any pending changes
      if (this.loaded) {
        await this.save();
      }
      
      // Clear listeners
      this.changeListeners.clear();
      
      this.logger.info('ConfigService: Shutdown complete');
    } catch (error) {
      this.logger.error('ConfigService: Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get region-specific parameters
   * @param {string} regionId - Region identifier
   * @returns {Promise<Object>} Region parameters
   */
  async getRegionParameters(regionId) {
    if (!regionId) {
      throw new Error('Region ID is required');
    }

    const config = await this.getConfig();
      // Return default region parameters if specific region not found
    const defaultParams = {
      votingDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds (community-voted fallback)
      quorumThreshold: 0.1, // 10% participation required (community-voted fallback)
      maxVotesPerUser: 1, // community-voted fallback
      allowVoteChange: true, // community-voted fallback
      voteTypes: ['yes', 'no', 'abstain'], // community-voted fallback
      regionBoundaryUpdate: true, // community-voted fallback
      consensusThreshold: 0.67, // 67% agreement for boundary changes (community-voted fallback)
      activityThreshold: 0.1, // Minimum activity level for participation (community-voted fallback)
      privacyLevel: 'standard' // standard, high, maximum (community-voted fallback)
    };

    // Check if there are region-specific overrides
    const regionSpecific = config.regions?.[regionId];
    
    return {
      ...defaultParams,
      ...regionSpecific,
      regionId
    };
  }
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} True if value is an object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Create singleton instance
const configService = new ConfigService();

// Export both class and instance (standard pattern)
export { ConfigService };
export default configService;

// Export the getRegionParameters function directly for convenience
export const getRegionParameters = (regionId) => configService.getRegionParameters(regionId);
