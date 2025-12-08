/**
 * Rate limiting middleware to prevent abuse
 */

import logger from '../utils/logging/logger.mjs';
import configService from '../config-service/index.mjs';
import { createError } from '../utils/common/errors.mjs';

// Create rate limiter logger
const limiterLogger = logger.child({ module: 'rate-limiter' });

// Default options
const DEFAULT_OPTIONS = {
  max: configService.get('security.rateLimit.max', 100),
  windowMs: configService.get('security.rateLimit.windowMs', 15 * 60 * 1000),
  message: { error: 'Too many requests, please try again later.' }
};

// Store for limiters
const limiters = new Map();

/**
 * Simple in-memory rate limiter implementation
 */
class SimpleRateLimiter {
  constructor(options) {
    this.max = options.max || 100;
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.store = new Map();
    this.message = options.message || { error: 'Too many requests' };
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  async consume(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create entry for this key
    let entry = this.store.get(key);
    if (!entry) {
      entry = { requests: [], firstRequest: now };
      this.store.set(key, entry);
    }
    
    // Remove requests outside the current window
    entry.requests = entry.requests.filter(time => time > windowStart);
    
    // Check if we're over the limit
    if (entry.requests.length >= this.max) {
      const oldestRequest = entry.requests[0];
      const msBeforeNext = (oldestRequest + this.windowMs) - now;
      
      // Throw an error that mimics rate-limiter-flexible behavior
      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = Math.max(msBeforeNext, 1000); // At least 1 second
      throw error;
    }
    
    // Add this request to the history
    entry.requests.push(now);
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      const windowStart = now - this.windowMs;
      entry.requests = entry.requests.filter(time => time > windowStart);
      
      // Remove entries with no recent requests
      if (entry.requests.length === 0 && (now - entry.firstRequest) > this.windowMs * 2) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create a rate limiter with the given options
 * @param {Object} options - Rate limiter options
 * @returns {SimpleRateLimiter} Rate limiter instance
 */
function createLimiter(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const key = `${config.keyPrefix || 'default'}:${config.max}:${config.windowMs}`;
  
  if (!limiters.has(key)) {
    limiters.set(key, new SimpleRateLimiter(config));
  }
  
  return limiters.get(key);
}

/**
 * Rate limiting middleware factory
 * @param {Object} options - Rate limiter options
 * @param {Function} keyGenerator - Function to generate key from request
 * @returns {Function} Express middleware
 */
export function rateLimit(options = {}, keyGenerator = defaultKeyGenerator) {
  const limiter = createLimiter(options);
  
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const key = keyGenerator(req);
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error instanceof Error) {
        // This is an unexpected error, not a rate limit rejection
        limiterLogger.error('Rate limiter error:', { error: error.message });
        return next(createError(500, 'Rate limiting error'));
      } else {
        // This is a rate limit rejection (rejectionError from rate-limiter-flexible)
        const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(retryAfter));
        limiterLogger.warn('Rate limit exceeded:', { 
          ip: req.ip,
          path: req.path,
          retryAfter
        });
        
        // Pass the error to the next middleware, don't handle it here
        return next(createError(429, 'Too many requests', {
          retryAfter
        }));
      }
    }
  };
}

/**
 * Default key generator using IP address
 * @param {Object} req - Express request
 * @returns {string} Key for rate limiter
 */
function defaultKeyGenerator(req) {
  return req.ip;
}

/**
 * Rate limit middleware specifically for user-based rate limiting
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
export function userRateLimit(options = {}) {
  return rateLimit({
    keyPrefix: 'rl:user',
    ...options
  }, (req) => {
    return req.user?.id || req.ip;
  });
}

/**
 * Rate limit middleware specifically for endpoint-based rate limiting
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
export function endpointRateLimit(options = {}) {
  return rateLimit({
    keyPrefix: 'rl:endpoint',
    ...options
  }, (req) => {
    return `${req.ip}:${req.method}:${req.path}`;
  });
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({
  max: 10,
  windowMs: 60000,
  keyPrefix: 'rl:auth'
});

export const voteRateLimit = rateLimit({
  max: 30,
  windowMs: 60000,
  keyPrefix: 'rl:vote'
});

export const apiRateLimit = rateLimit({
  max: 100,
  windowMs: 60000,
  keyPrefix: 'rl:api'
});

export function createRateLimiter() {
  logger.info('Rate limiter initialized');
}

// Default export for compatibility
export { rateLimit as rateLimiter };
