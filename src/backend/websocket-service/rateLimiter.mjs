/**
 * @fileoverview Rate limiting service for WebSocket messages
 */
import logger from '../utils/logging/logger.mjs';

class RateLimiter {
  constructor() {
    // Initialize rate limit tracking
    this.clientRates = new Map();
    this.cleanupInterval = null;
    
    // Default rate limit configuration
    this.defaultLimits = {
      // Messages per window period
      general: { limit: 100, window: 60000 }, // 100 messages per minute general limit
      auth: { limit: 5, window: 60000 },      // 5 auth attempts per minute
      presence: { limit: 20, window: 60000 }, // 20 presence updates per minute
      vote: { limit: 30, window: 60000 },     // 30 vote-related messages per minute
    };
    
    // Track custom limits by message type
    this.typeLimits = new Map([
      ['auth', this.defaultLimits.auth],
      ['presence', this.defaultLimits.presence],
      ['vote', this.defaultLimits.vote]
    ]);
  }

  initialize() {
    // Set up periodic cleanup of stale tracking data
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // Cleanup every 5 minutes
    logger.info('WebSocket rate limiter initialized');
    return this;
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    logger.info('WebSocket rate limiter shut down');
  }

  /**
   * Check if a message from a client exceeds rate limits
   * @param {Object} client - WebSocket client object
   * @param {Object} message - Message being sent
   * @returns {Object} Result with allowed flag and reset time
   */
  checkLimit(client, message) {
    const clientId = client?.id || 'unknown';
    const messageType = message?.type || 'unknown';
    
    // Get client tracking data or initialize if new
    if (!this.clientRates.has(clientId)) {
      this.clientRates.set(clientId, {
        general: {
          count: 0,
          resetAt: Date.now() + this.defaultLimits.general.window
        },
        byType: new Map()
      });
    }
    
    const clientData = this.clientRates.get(clientId);
    const now = Date.now();
    
    // Check general rate limit
    if (now > clientData.general.resetAt) {
      // Reset counter if window has passed
      clientData.general.count = 0;
      clientData.general.resetAt = now + this.defaultLimits.general.window;
    }
    
    clientData.general.count++;
    
    // Check if general limit exceeded
    if (clientData.general.count > this.defaultLimits.general.limit) {
      return {
        allowed: false,
        resetAt: clientData.general.resetAt,
        type: 'general',
        message: 'Rate limit exceeded for all messages'
      };
    }
    
    // Check type-specific rate limit if applicable
    if (this.typeLimits.has(messageType)) {
      // Initialize type tracking if needed
      if (!clientData.byType.has(messageType)) {
        clientData.byType.set(messageType, {
          count: 0,
          resetAt: now + this.typeLimits.get(messageType).window
        });
      }
      
      const typeData = clientData.byType.get(messageType);
      
      // Reset if window has passed
      if (now > typeData.resetAt) {
        typeData.count = 0;
        typeData.resetAt = now + this.typeLimits.get(messageType).window;
      }
      
      typeData.count++;
      
      // Check if type-specific limit exceeded
      if (typeData.count > this.typeLimits.get(messageType).limit) {
        return {
          allowed: false,
          resetAt: typeData.resetAt,
          type: messageType,
          message: `Rate limit exceeded for ${messageType} messages`
        };
      }
    }
    
    // All checks passed
    return { allowed: true };
  }

  /**
   * Update rate limit configuration
   * @param {string} type - Message type to configure
   * @param {Object} config - Rate limit configuration
   */
  setTypeLimit(type, config) {
    if (config && typeof config.limit === 'number' && typeof config.window === 'number') {
      this.typeLimits.set(type, {
        limit: config.limit,
        window: config.window
      });
      logger.info(`Updated rate limit for ${type}: ${config.limit} messages per ${config.window}ms`);
    }
  }

  /**
   * Remove stale client tracking data
   */
  cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [clientId, clientData] of this.clientRates.entries()) {
      // Check if all windows have expired
      if (clientData.general.resetAt < now) {
        let allExpired = true;
        
        // Check if any type-specific windows are still active
        for (const [, typeData] of clientData.byType.entries()) {
          if (typeData.resetAt >= now) {
            allExpired = false;
            break;
          }
        }
        
        // Remove client tracking if all windows expired
        if (allExpired) {
          this.clientRates.delete(clientId);
          removedCount++;
        }
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Cleaned up rate limit tracking for ${removedCount} clients`);
    }
  }
}

export default new RateLimiter();
