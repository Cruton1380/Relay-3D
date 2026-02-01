/**
 * Consent Manager
 * 
 * Manages user consent for data collection, processing, and sharing.
 * Ensures all data operations have explicit user consent.
 * 
 * RELAY PRINCIPLE: Users control their data, system requests consent.
 */

import logger from '../utils/logging/logger.mjs';

const consentLogger = logger.child({ module: 'consent-manager' });

export class ConsentManager {
  constructor() {
    this.consentRecords = new Map();  // userId -> consents
    this.consentTypes = new Map();    // consentType -> config
    
    // Register default consent types
    this.registerConsentType('vote_history', {
      description: 'Store and display vote history',
      required: true,  // Required for voting system to function
      dataCollected: ['vote choice', 'timestamp', 'topic'],
      dataShared: ['anonymized vote totals'],
      retentionPeriod: 'indefinite'  // Append-only history
    });
    
    this.registerConsentType('location_tracking', {
      description: 'Track location for proximity-based features',
      required: false,
      dataCollected: ['GPS coordinates', 'region', 'city'],
      dataShared: ['region-level aggregates only'],
      retentionPeriod: '90 days'
    });
    
    this.registerConsentType('analytics', {
      description: 'Collect usage analytics for system improvement',
      required: false,
      dataCollected: ['page views', 'feature usage', 'session duration'],
      dataShared: ['aggregated statistics only'],
      retentionPeriod: '365 days'
    });
  }

  /**
   * Register a new consent type
   */
  registerConsentType(type, config) {
    this.consentTypes.set(type, {
      type,
      ...config,
      registeredAt: Date.now()
    });
    
    consentLogger.debug('Consent type registered', { type });
  }

  /**
   * Request consent from a user
   * 
   * @param {string} userId - User to request consent from
   * @param {string} consentType - Type of consent being requested
   * @param {string} requestedBy - System/service requesting consent
   * @returns {Promise<Object>} Consent request result
   */
  async requestConsent(userId, consentType, requestedBy) {
    try {
      const consentConfig = this.consentTypes.get(consentType);
      
      if (!consentConfig) {
        throw new Error(`Unknown consent type: ${consentType}`);
      }

      // Create consent request
      const request = {
        id: `consent_req_${Date.now()}_${userId}`,
        userId,
        consentType,
        requestedBy,
        consentConfig,
        requestedAt: Date.now(),
        status: 'pending'
      };

      consentLogger.info('Consent requested', {
        userId: userId.substring(0, 10),
        consentType,
        requestedBy
      });

      return {
        success: true,
        request
      };

    } catch (error) {
      consentLogger.error('Consent request error', {
        error: error.message,
        userId,
        consentType
      });

      throw error;
    }
  }

  /**
   * Grant consent
   * 
   * @param {string} userId - User granting consent
   * @param {string} consentType - Type of consent being granted
   * @param {Object} options - Consent options (duration, conditions, etc.)
   * @returns {Promise<Object>} Grant result
   */
  async grantConsent(userId, consentType, options = {}) {
    try {
      const consentConfig = this.consentTypes.get(consentType);
      
      if (!consentConfig) {
        throw new Error(`Unknown consent type: ${consentType}`);
      }

      // Create consent record
      const consent = {
        id: `consent_${Date.now()}_${userId}`,
        userId,
        consentType,
        granted: true,
        grantedAt: Date.now(),
        expiresAt: options.expiresAt || null,  // null = doesn't expire
        conditions: options.conditions || [],
        scope: options.scope || 'full',
        consentConfig,
        revoked: false
      };

      // Store consent
      if (!this.consentRecords.has(userId)) {
        this.consentRecords.set(userId, []);
      }
      this.consentRecords.get(userId).push(consent);

      consentLogger.info('Consent granted', {
        userId: userId.substring(0, 10),
        consentType,
        expiresAt: consent.expiresAt
      });

      return {
        success: true,
        consent
      };

    } catch (error) {
      consentLogger.error('Grant consent error', {
        error: error.message,
        userId,
        consentType
      });

      throw error;
    }
  }

  /**
   * Check if user has given consent
   * 
   * @param {string} userId - User to check
   * @param {string} consentType - Type of consent to check
   * @param {string} requestedBy - System/service requesting access
   * @returns {Promise<Object>} Consent check result
   */
  async checkConsent(userId, consentType, requestedBy) {
    try {
      const userConsents = this.consentRecords.get(userId) || [];
      
      // Find active consent for this type
      const activeConsent = userConsents.find(c => 
        c.consentType === consentType &&
        c.granted &&
        !c.revoked &&
        (c.expiresAt === null || c.expiresAt > Date.now())
      );

      const hasConsent = !!activeConsent;

      const result = {
        hasConsent,
        userId,
        consentType,
        requestedBy,
        checkedAt: Date.now(),
        consent: activeConsent || null
      };

      if (!hasConsent) {
        const consentConfig = this.consentTypes.get(consentType);
        result.required = consentConfig?.required || false;
        result.reason = 'No active consent found';
      }

      consentLogger.debug('Consent check', {
        userId: userId.substring(0, 10),
        consentType,
        hasConsent
      });

      return result;

    } catch (error) {
      consentLogger.error('Consent check error', {
        error: error.message,
        userId,
        consentType
      });

      return {
        hasConsent: false,
        reason: `Check error: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Revoke consent
   * 
   * @param {string} userId - User revoking consent
   * @param {string} consentType - Type of consent to revoke
   * @returns {Promise<Object>} Revocation result
   */
  async revokeConsent(userId, consentType) {
    try {
      const userConsents = this.consentRecords.get(userId) || [];
      
      let revokedCount = 0;
      for (const consent of userConsents) {
        if (consent.consentType === consentType && !consent.revoked) {
          consent.revoked = true;
          consent.revokedAt = Date.now();
          revokedCount++;
        }
      }

      consentLogger.info('Consent revoked', {
        userId: userId.substring(0, 10),
        consentType,
        revokedCount
      });

      return {
        success: true,
        revokedCount
      };

    } catch (error) {
      consentLogger.error('Revoke consent error', {
        error: error.message,
        userId,
        consentType
      });

      throw error;
    }
  }

  /**
   * Get all consents for a user
   */
  getUserConsents(userId) {
    return this.consentRecords.get(userId) || [];
  }

  /**
   * Get all registered consent types
   */
  getAllConsentTypes() {
    return Array.from(this.consentTypes.values());
  }

  /**
   * Auto-grant required consents for system functionality
   * (e.g., vote_history required for voting to work)
   */
  async autoGrantRequiredConsents(userId) {
    const requiredConsents = Array.from(this.consentTypes.values())
      .filter(c => c.required);

    const grants = [];
    for (const consentConfig of requiredConsents) {
      try {
        const grant = await this.grantConsent(userId, consentConfig.type, {
          scope: 'required',
          autoGranted: true
        });
        grants.push(grant);
      } catch (error) {
        consentLogger.warn('Failed to auto-grant required consent', {
          userId,
          consentType: consentConfig.type,
          error: error.message
        });
      }
    }

    return grants;
  }
}

export default new ConsentManager();
