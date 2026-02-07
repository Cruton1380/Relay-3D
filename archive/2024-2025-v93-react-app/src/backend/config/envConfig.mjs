/**
 * @fileoverview Environment Configuration Loader
 * Loads configuration from environment variables with fallbacks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.loaded = false;
  }

  /**
   * Load configuration from environment variables and config files
   */
  async load() {
    if (this.loaded) return this.config;

    // Load environment variables
    await this.loadEnvironmentVariables();
    
    // Load from config file as fallback
    await this.loadConfigFile();
    
    this.loaded = true;
    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  async loadEnvironmentVariables() {
    // Security Configuration
    this.config.security = {
      jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret('jwt'),
      jwtExpiry: process.env.JWT_EXPIRY || '1h',
      csrf: process.env.CSRF_SECRET || this.generateSecureSecret('csrf'),
      passwordDanceMoves: parseInt(process.env.PASSWORD_DANCE_MOVES) || 5,
      minBiometricScore: parseFloat(process.env.MIN_BIOMETRIC_SCORE) || 0.85,
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 900000,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000,
      requireTwoFactor: process.env.REQUIRE_TWO_FACTOR === 'true'
    };

    // Server Configuration
    this.config.server = {
      port: parseInt(process.env.SERVER_PORT) || 3000,
      host: process.env.SERVER_HOST || 'localhost',
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
      useTLS: process.env.USE_TLS === 'true',
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
      }
    };

    // Storage Configuration
    this.config.storage = {
      dataDir: process.env.DATA_DIR || './data',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800,
      encryptData: process.env.ENCRYPT_DATA === 'true'
    };

    // Network Configuration
    this.config.network = {
      p2pEnabled: process.env.P2P_ENABLED === 'true',
      bootstrapNodes: process.env.BOOTSTRAP_NODES ? process.env.BOOTSTRAP_NODES.split(',') : [],
      maxPeers: parseInt(process.env.MAX_PEERS) || 20,
      discoveryInterval: parseInt(process.env.DISCOVERY_INTERVAL) || 60000
    };

    // Voting Configuration
    this.config.voting = {
      minimumVotingAge: parseInt(process.env.MINIMUM_VOTING_AGE) || 18,
      voteCooldownPeriod: parseInt(process.env.VOTE_COOLDOWN_PERIOD) || 86400000,
      requireRegion: process.env.REQUIRE_REGION === 'true'
    };

    // Onboarding Configuration
    this.config.onboarding = {
      inviteRequired: process.env.INVITE_REQUIRED === 'true',
      biometricEnrollment: process.env.BIOMETRIC_ENROLLMENT === 'true',
      deviceAttestationRequired: process.env.DEVICE_ATTESTATION_REQUIRED === 'true'
    };

    // Invites Configuration
    this.config.invites = {
      invitesPerNewUser: parseInt(process.env.INVITES_PER_NEW_USER) || 3,
      founderIds: process.env.FOUNDER_IDS ? process.env.FOUNDER_IDS.split(',') : [],
      decayFactor: parseFloat(process.env.DECAY_FACTOR) || 1,
      minInvites: parseInt(process.env.MIN_INVITES) || 1,
      inviteExpiryDays: parseInt(process.env.INVITE_EXPIRY_DAYS) || 14
    };

    // Logging Configuration
    this.config.logging = {
      level: process.env.LOG_LEVEL || 'info',
      console: process.env.LOG_CONSOLE !== 'false',
      file: process.env.LOG_FILE === 'true',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      maxSize: process.env.LOG_MAX_SIZE || '10m'
    };

    // Environment
    this.config.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Load configuration from config file as fallback
   */
  async loadConfigFile() {
    try {
      const configPath = path.join(projectRoot, 'data/system/config.json');
      const configContent = await fs.readFile(configPath, 'utf8');
      const fileConfig = JSON.parse(configContent);
      
      // Merge file config as fallback (only if env vars not set)
      this.mergeConfigWithFallbacks(fileConfig);
    } catch (error) {
      // Config file doesn't exist or can't be read - that's okay
      console.warn('Could not load config file, using environment variables only');
    }
  }

  /**
   * Merge file configuration as fallbacks for missing environment variables
   */
  mergeConfigWithFallbacks(fileConfig) {
    // Only use file config values if environment variables are not set
    if (!process.env.JWT_SECRET && fileConfig.security?.jwtSecret) {
      this.config.security.jwtSecret = fileConfig.security.jwtSecret;
    }
    if (!process.env.CSRF_SECRET && fileConfig.security?.csrf) {
      this.config.security.csrf = fileConfig.security.csrf;
    }
    // Add more fallbacks as needed
  }

  /**
   * Generate a secure secret for development
   */
  generateSecureSecret(type) {
    const crypto = await import('crypto');
    const secret = crypto.randomBytes(32).toString('hex');
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Generated ${type} secret for development. Set ${type.toUpperCase()}_SECRET environment variable for production.`);
    }
    
    return secret;
  }

  /**
   * Get configuration value by path
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Get entire configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Validate required secrets in production
    if (this.config.environment === 'production') {
      if (this.config.security.jwtSecret.includes('development') || this.config.security.jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be set to a secure value in production');
      }
      if (this.config.security.csrf.includes('development') || this.config.security.csrf.length < 32) {
        errors.push('CSRF_SECRET must be set to a secure value in production');
      }
    }

    // Validate port
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('SERVER_PORT must be between 1 and 65535');
    }

    // Validate biometric score
    if (this.config.security.minBiometricScore < 0 || this.config.security.minBiometricScore > 1) {
      errors.push('MIN_BIOMETRIC_SCORE must be between 0 and 1');
    }

    return errors;
  }

  /**
   * Save configuration to file (for development)
   */
  async saveToFile() {
    if (this.config.environment === 'production') {
      throw new Error('Cannot save configuration to file in production');
    }

    const configPath = path.join(projectRoot, 'data/system/config.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }
}

// Export singleton instance
const envConfig = new EnvironmentConfig();
export default envConfig;
