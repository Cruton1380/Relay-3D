/**
 * Security Configuration for Relay Network
 * Handles production vs development security policies
 */

import logger from '../utils/logging/logger.mjs';

const securityLogger = logger.child({ module: 'security-config' });

class SecurityConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
    this.isDevelopment = this.environment === 'development';
    
    // Security policies
    this.policies = {
      // Encryption fallback behavior
      allowUnencryptedFallback: this.isDevelopment,
      
      // Logging verbosity
      logEncryptionEvents: true,
      logSecurityViolations: true,
      logKeyOperations: this.isDevelopment, // Never log keys in production
      
      // Retry policies
      maxEncryptionRetries: this.isProduction ? 3 : 1,
      encryptionRetryDelay: this.isProduction ? 1000 : 100,
      
      // Security boundaries
      requireGroupMembership: true,
      enforceEpochValidation: true,
      validateSenderKeys: true,
      
      // Audit requirements
      auditAllVoteOperations: this.isProduction,
      auditGroupMembershipChanges: true,
      auditEncryptionFailures: true
    };
    
    securityLogger.info('Security configuration initialized', {
      environment: this.environment,
      isProduction: this.isProduction,
      allowUnencryptedFallback: this.policies.allowUnencryptedFallback
    });
  }

  /**
   * Check if unencrypted fallback is allowed
   * @returns {boolean}
   */
  allowUnencryptedFallback() {
    return this.policies.allowUnencryptedFallback;
  }

  /**
   * Get encryption retry configuration
   * @returns {Object}
   */
  getEncryptionRetryConfig() {
    return {
      maxRetries: this.policies.maxEncryptionRetries,
      delay: this.policies.encryptionRetryDelay
    };
  }

  /**
   * Check if security event should be logged
   * @param {string} eventType - Type of security event
   * @returns {boolean}
   */
  shouldLogSecurityEvent(eventType) {
    switch (eventType) {
      case 'encryption_success':
      case 'encryption_failure':
      case 'group_session_created':
      case 'member_added':
      case 'member_removed':
      case 'epoch_incremented':
        return this.policies.logEncryptionEvents;
      
      case 'security_violation':
      case 'unauthorized_access':
      case 'invalid_operation':
        return this.policies.logSecurityViolations;
      
      case 'key_operation':
      case 'key_generation':
        return this.policies.logKeyOperations;
      
      default:
        return false;
    }
  }

  /**
   * Check if operation should be audited
   * @param {string} operationType - Type of operation
   * @returns {boolean}
   */
  shouldAuditOperation(operationType) {
    switch (operationType) {
      case 'vote_submission':
      case 'vote_update':
        return this.policies.auditAllVoteOperations;
      
      case 'group_membership_change':
        return this.policies.auditGroupMembershipChanges;
      
      case 'encryption_failure':
        return this.policies.auditEncryptionFailures;
      
      default:
        return false;
    }
  }

  /**
   * Get security policy for specific operation
   * @param {string} policyName - Name of the policy
   * @returns {boolean}
   */
  getPolicy(policyName) {
    return this.policies[policyName] || false;
  }

  /**
   * Log security event with appropriate level
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @param {string} level - Log level (info, warn, error)
   */
  logSecurityEvent(eventType, data, level = 'info') {
    if (!this.shouldLogSecurityEvent(eventType)) {
      return;
    }

    const logData = {
      eventType,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Redact sensitive information in production
    if (this.isProduction) {
      this.redactSensitiveData(logData);
    }

    securityLogger[level](`Security event: ${eventType}`, logData);
  }

  /**
   * Redact sensitive information from log data
   * @param {Object} data - Data to redact
   */
  redactSensitiveData(data) {
    const sensitiveFields = ['key', 'secret', 'token', 'password', 'privateKey', 'ciphertext'];
    
    for (const field of sensitiveFields) {
      if (data[field]) {
        data[field] = '[REDACTED]';
      }
    }
    
    // Recursively redact nested objects
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        this.redactSensitiveData(value);
      }
    }
  }

  /**
   * Create audit entry for security operation
   * @param {string} operation - Operation performed
   * @param {string} userId - User performing operation
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Audit entry
   */
  createAuditEntry(operation, userId, metadata = {}) {
    return {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      metadata: this.isProduction ? this.redactSensitiveData({ ...metadata }) : metadata
    };
  }
}

// Export singleton instance
export default new SecurityConfig();
