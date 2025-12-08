/**
 * @fileoverview Founder Mode Service
 * 
 * Manages founder mode configuration and security toggles for testing and bootstrapping
 * the Relay network when no users exist yet.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const founderLogger = logger.child({ module: 'founder-mode' });

export class FounderModeService extends EventEmitter {
  constructor() {
    super();
    // Use project root directory for config: from src/backend/services/ go up 3 levels to project root
    const projectRoot = path.resolve(__dirname, '../../../');
    this.configPath = path.join(projectRoot, 'config', 'founderMode.json');
    this.config = null;
    this.initialized = false;
    
    // Debug: log the resolved path
    console.log('Founder mode config path:', this.configPath);
  }

  /**
   * Initialize founder mode service
   */
  async initialize() {
    try {
      await this.loadConfig();
      this.initialized = true;
      
      if (this.config.enabled) {
        founderLogger.info('Founder mode is ENABLED', {
          founderId: this.config.founderId,
          securityToggles: Object.keys(this.config.securityToggles).reduce((acc, key) => {
            acc[key] = this.config.securityToggles[key].enabled;
            return acc;
          }, {})
        });
      }
      
      founderLogger.info('Founder mode service initialized');
    } catch (error) {
      founderLogger.error('Failed to initialize founder mode service', { error: error.message });
      throw error;
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default config if file doesn't exist
        this.config = this.getDefaultConfig();
        await this.saveConfig();
      } else {
        throw error;
      }
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    try {
      // Ensure the config directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      this.emit('configUpdated', this.config);
    } catch (error) {
      founderLogger.error('Failed to save founder mode config', { error: error.message });
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      enabled: false,
      founderId: null,
      createdAt: null,
      securityToggles: {
        proximityVerification: {
          enabled: true,
          description: "Require proximity to existing users for onboarding",
          canBypass: true
        },
        biometricScanning: {
          enabled: true,
          description: "Require facial biometric verification",
          canBypass: false
        },
        deviceBinding: {
          enabled: true,
          description: "Bind user account to specific device fingerprint",
          canBypass: true
        },
        trustProfile: {
          enabled: true,
          description: "Initialize user trust profile and verification",
          canBypass: false
        },
        dwellTimeVerification: {
          enabled: true,
          description: "Require minimum time near verification location",
          canBypass: true
        }
      },
      onboardingSettings: {
        skipProximityForFounder: true,
        allowEmptyNetworkBootstrap: true,
        minTrustLevel: "probationary",
        autoApproveFounderInvites: true,
        debugMode: true
      },
      testingFeatures: {
        mockBiometricData: false,
        simulateProximitySuccess: false,
        skipEncryption: false,
        verboseLogging: true
      }
    };
  }

  /**
   * Enable founder mode
   */
  async enableFounderMode(founderId) {
    try {
      this.config.enabled = true;
      this.config.founderId = founderId;
      this.config.createdAt = new Date().toISOString();
      
      await this.saveConfig();
      
      founderLogger.info('Founder mode ENABLED', { founderId });
      
      return {
        success: true,
        message: 'Founder mode enabled successfully',
        config: this.getPublicConfig()
      };
    } catch (error) {
      founderLogger.error('Failed to enable founder mode', { error: error.message, founderId });
      throw error;
    }
  }

  /**
   * Disable founder mode
   */
  async disableFounderMode() {
    try {
      this.config.enabled = false;
      this.config.founderId = null;
      
      await this.saveConfig();
      
      founderLogger.info('Founder mode DISABLED');
      
      return {
        success: true,
        message: 'Founder mode disabled successfully'
      };
    } catch (error) {
      founderLogger.error('Failed to disable founder mode', { error: error.message });
      throw error;
    }
  }

  /**
   * Toggle a security feature
   */
  async toggleSecurityFeature(featureName, enabled) {
    try {
      if (!this.config.securityToggles[featureName]) {
        throw createError('validation', `Unknown security feature: ${featureName}`);
      }

      const feature = this.config.securityToggles[featureName];
      
      if (!feature.canBypass && !enabled) {
        throw createError('validation', `Security feature '${featureName}' cannot be disabled`);
      }

      feature.enabled = enabled;
      await this.saveConfig();

      founderLogger.info(`Security feature toggled`, { featureName, enabled });

      return {
        success: true,
        feature: featureName,
        enabled,
        description: feature.description
      };
    } catch (error) {
      founderLogger.error('Failed to toggle security feature', { 
        error: error.message, 
        featureName, 
        enabled 
      });
      throw error;
    }
  }

  /**
   * Update testing features
   */
  async updateTestingFeatures(features) {
    try {
      Object.assign(this.config.testingFeatures, features);
      await this.saveConfig();

      founderLogger.info('Testing features updated', { features });

      return {
        success: true,
        testingFeatures: this.config.testingFeatures
      };
    } catch (error) {
      founderLogger.error('Failed to update testing features', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if a security feature is enabled
   */
  isSecurityFeatureEnabled(featureName) {
    return this.config?.securityToggles?.[featureName]?.enabled ?? true;
  }

  /**
   * Check if founder mode is enabled
   */
  isFounderModeEnabled() {
    return this.config?.enabled ?? false;
  }

  /**
   * Check if user is the founder
   */
  isFounder(userId) {
    return this.config?.enabled && this.config?.founderId === userId;
  }

  /**
   * Check if proximity can be bypassed for this user
   */
  canBypassProximity(userId) {
    if (!this.isFounderModeEnabled()) return false;
    
    // Founder can always bypass proximity if configured
    if (this.isFounder(userId) && this.config.onboardingSettings.skipProximityForFounder) {
      return true;
    }

    // Check if proximity verification is disabled globally
    return !this.isSecurityFeatureEnabled('proximityVerification');
  }

  /**
   * Check if biometric scanning can be bypassed
   */
  canBypassBiometric(userId) {
    if (!this.isFounderModeEnabled()) return false;
    
    // Biometric scanning usually cannot be bypassed for security
    const biometricToggle = this.config.securityToggles.biometricScanning;
    return biometricToggle.canBypass && !biometricToggle.enabled;
  }

  /**
   * Get mock biometric data for testing
   */
  getMockBiometricData(userId) {
    if (!this.config.testingFeatures.mockBiometricData) return null;

    return {
      hash: `mock_bio_${userId}_${Date.now()}`,
      template: {
        features: Array(128).fill(0).map(() => Math.random()),
        quality: 0.95,
        source: 'mock'
      },
      confidence: 0.99,
      timestamp: Date.now()
    };
  }

  /**
   * Get public configuration (safe for frontend)
   */
  getPublicConfig() {
    return {
      enabled: this.config.enabled,
      founderId: this.config.founderId,
      securityToggles: Object.keys(this.config.securityToggles).reduce((acc, key) => {
        const toggle = this.config.securityToggles[key];
        acc[key] = {
          enabled: toggle.enabled,
          description: toggle.description,
          canBypass: toggle.canBypass
        };
        return acc;
      }, {}),
      onboardingSettings: {
        skipProximityForFounder: this.config.onboardingSettings.skipProximityForFounder,
        allowEmptyNetworkBootstrap: this.config.onboardingSettings.allowEmptyNetworkBootstrap,
        debugMode: this.config.onboardingSettings.debugMode
      }
    };
  }

  /**
   * Get onboarding configuration for user
   */
  getOnboardingConfig(userId = null) {
    const config = {
      requireProximity: this.isSecurityFeatureEnabled('proximityVerification'),
      requireBiometric: this.isSecurityFeatureEnabled('biometricScanning'),
      requireDeviceBinding: this.isSecurityFeatureEnabled('deviceBinding'),
      requireTrustProfile: this.isSecurityFeatureEnabled('trustProfile'),
      requireDwellTime: this.isSecurityFeatureEnabled('dwellTimeVerification'),
      isFounderMode: this.isFounderModeEnabled(),
      debugMode: this.config.onboardingSettings.debugMode
    };

    // Apply founder-specific overrides
    if (userId && this.isFounder(userId)) {
      config.requireProximity = config.requireProximity && !this.config.onboardingSettings.skipProximityForFounder;
      config.autoApproveInvites = this.config.onboardingSettings.autoApproveFounderInvites;
    }

    return config;
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    try {
      this.config = this.getDefaultConfig();
      await this.saveConfig();

      founderLogger.info('Founder mode configuration reset to defaults');

      return {
        success: true,
        message: 'Configuration reset to defaults',
        config: this.getPublicConfig()
      };
    } catch (error) {
      founderLogger.error('Failed to reset founder mode config', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const founderModeService = new FounderModeService();
export default founderModeService; 
