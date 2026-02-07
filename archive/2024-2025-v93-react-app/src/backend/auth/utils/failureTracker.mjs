/**
 * @fileoverview Authentication Failure Tracker
 * Tracks and limits authentication failures to prevent brute force attacks
 */
import logger from '../../utils/logging/logger.mjs';

const failureLogger = logger.child({ module: 'auth-failure-tracker' });

// In-memory storage for authentication failures
// In production this would use Redis or another shared data store
const failureStore = new Map();

// Default configuration
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const DEFAULT_TRACKING_DURATION = 60 * 60 * 1000; // 1 hour

class FailureTracker {
  constructor() {
    this.maxAttempts = DEFAULT_MAX_ATTEMPTS;
    this.lockoutDuration = DEFAULT_LOCKOUT_DURATION;
    this.trackingDuration = DEFAULT_TRACKING_DURATION;
    
    // Clean up expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000); // Every 5 minutes
    
    failureLogger.info('Failure tracker initialized');
  }
  
  /**
   * Configure failure tracker settings
   * @param {Object} config Configuration options
   */
  configure(config = {}) {
    this.maxAttempts = config.maxAttempts || DEFAULT_MAX_ATTEMPTS;
    this.lockoutDuration = config.lockoutDuration || DEFAULT_LOCKOUT_DURATION;
    this.trackingDuration = config.trackingDuration || DEFAULT_TRACKING_DURATION;
    
    failureLogger.info('Failure tracker configured', {
      maxAttempts: this.maxAttempts,
      lockoutDuration: this.lockoutDuration / 1000,
      trackingDuration: this.trackingDuration / 1000
    });
  }
  
  /**
   * Get the key used for storing failure data
   * @param {string} identifier User identifier (e.g., username, public key)
   * @param {string} factorType Authentication factor type
   * @returns {string} Storage key
   */
  getKey(identifier, factorType) {
    return `${identifier}:${factorType}`;
  }
  
  /**
   * Track an authentication failure
   * @param {string} identifier User identifier
   * @param {string} factorType Authentication factor type
   * @returns {Object} Updated failure data
   */
  async trackFailure(identifier, factorType) {
    const key = this.getKey(identifier, factorType);
    const now = Date.now();
    
    let entry = failureStore.get(key);
    
    if (!entry) {
      // Create new entry for first failure
      entry = {
        count: 1,
        firstFailure: now,
        lastFailure: now,
        lockedUntil: null
      };
    } else {
      // Update existing entry
      entry.count += 1;
      entry.lastFailure = now;
    }
    
    // Check if account should be locked
    if (entry.count >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutDuration;
      
      failureLogger.warn('Account locked due to too many failures', {
        identifier,
        factorType,
        attempts: entry.count,
        lockedUntil: new Date(entry.lockedUntil).toISOString()
      });
    }
    
    // Store updated entry
    failureStore.set(key, entry);
    
    // Return a copy to avoid reference issues
    return { ...entry };
  }
  
  /**
   * Check if an account is rate limited
   * @param {string} identifier User identifier
   * @param {string} factorType Authentication factor type
   * @returns {boolean} Whether the account is rate limited
   */
  async isRateLimited(identifier, factorType) {
    const key = this.getKey(identifier, factorType);
    const entry = failureStore.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if lockout period has expired
    if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
      return true;
    }
    
    // If lockout has expired, clear the lock
    if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
      entry.lockedUntil = null;
      failureStore.set(key, entry);
    }
    
    return false;
  }
  
  /**
   * Get failure information for an account
   * @param {string} identifier User identifier
   * @param {string} factorType Authentication factor type
   * @returns {Object|null} Failure information
   */
  async getFailures(identifier, factorType) {
    const key = this.getKey(identifier, factorType);
    return failureStore.get(key) || null;
  }
  
  /**
   * Clear failure tracking for an account
   * @param {string} identifier User identifier
   * @param {string} factorType Authentication factor type
   * @returns {boolean} Whether the operation was successful
   */
  async clearFailures(identifier, factorType) {
    const key = this.getKey(identifier, factorType);
    
    if (failureStore.has(key)) {
      failureStore.delete(key);
      
      failureLogger.info('Cleared failure tracking', {
        identifier,
        factorType
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    const expiredCount = { locked: 0, tracking: 0 };
    
    for (const [key, entry] of failureStore.entries()) {
      // Remove entries with expired locks and no recent failures
      if (entry.lockedUntil && entry.lockedUntil <= now) {
        if (now - entry.lastFailure > this.trackingDuration) {
          failureStore.delete(key);
          expiredCount.locked++;
        }
      }
      // Remove old tracking entries
      else if (now - entry.lastFailure > this.trackingDuration) {
        failureStore.delete(key);
        expiredCount.tracking++;
      }
    }
    
    if (expiredCount.locked > 0 || expiredCount.tracking > 0) {
      failureLogger.debug('Cleaned up expired failure entries', {
        locked: expiredCount.locked,
        tracking: expiredCount.tracking
      });
    }
  }
  
  /**
   * Reset all failure tracking data (for testing purposes)
   */
  reset() {
    failureStore.clear();
    failureLogger.debug('Reset all failure tracking data');
  }
}

// Create singleton instance
const failureTracker = new FailureTracker();

export default failureTracker;
