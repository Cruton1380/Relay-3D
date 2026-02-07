/**
 * CSRF protection middleware
 */

import crypto from 'crypto';
import { createError } from '../utils/common/errors.mjs';
import logger from '../utils/logging/logger.mjs';
import configService from '../config-service/index.mjs';

// Create CSRF logger
const csrfLogger = logger.child({ module: 'csrf-protection' });

// Get CSRF secret from config or environment
const CSRF_SECRET = configService.get('security.csrf');

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 3600000;

// Store for CSRF tokens
const tokenStore = new Map();

// Clean up expired tokens periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [token, data] of tokenStore.entries()) {
    if (data.expires <= now) {
      tokenStore.delete(token);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    csrfLogger.debug(`Cleaned up ${expiredCount} expired CSRF tokens`);
  }
}, 60000); // Every minute

// Add cleanup function
export function shutdownCsrfProtection() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
}

/**
 * Generate a CSRF token for a session
 * @param {string} sessionId - Session identifier
 * @returns {string} CSRF token
 */
export function generateToken(sessionId) {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Create a timestamp
  const timestamp = Date.now();
  
  // Create token parts
  const tokenParts = [randomBytes, timestamp, sessionId];
  
  // Create plaintext token
  const plainToken = tokenParts.join('|');
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(plainToken);
  const signature = hmac.digest('hex');
  
  // Combine parts to create final token
  const token = `${plainToken}|${signature}`;
  const encodedToken = Buffer.from(token).toString('base64');
  
  // Store token with expiry
  tokenStore.set(encodedToken, {
    sessionId,
    expires: timestamp + TOKEN_EXPIRY
  });
  
  return encodedToken;
}

/**
 * Validate a CSRF token
 * @param {string} token - CSRF token to validate
 * @param {string} sessionId - Session identifier
 * @returns {boolean} Whether the token is valid
 */
export function validateToken(token, sessionId) {
  try {
    // Check if token exists in store
    const storedToken = tokenStore.get(token);
    if (!storedToken) {
      csrfLogger.warn('CSRF token not found in store');
      return false;
    }
    
    // Check if token has expired
    if (storedToken.expires <= Date.now()) {
      csrfLogger.warn('CSRF token expired');
      tokenStore.delete(token);
      return false;
    }
    
    // Check if session ID matches
    if (storedToken.sessionId !== sessionId) {
      csrfLogger.warn('CSRF token session mismatch');
      return false;
    }
    
    // Decode token
    const decodedToken = Buffer.from(token, 'base64').toString();
    const parts = decodedToken.split('|');
    
    // Should have at least 4 parts: randomBytes, timestamp, sessionId (potentially with |), signature
    if (parts.length < 4) {
      csrfLogger.warn('CSRF token malformed - insufficient parts');
      return false;
    }
    
    const randomBytes = parts[0];
    const timestamp = parts[1];
    const signature = parts[parts.length - 1]; // Last part is always signature
    const tokenSessionId = parts.slice(2, -1).join('|'); // Everything between timestamp and signature
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update([randomBytes, timestamp, tokenSessionId].join('|'));
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      csrfLogger.warn('CSRF token signature mismatch');
      return false;
    }
    
    return true;
  } catch (error) {
    csrfLogger.error(`CSRF validation error: ${error.message}`);
    return false;
  }
}

/**
 * CSRF protection middleware
 * @param {Object} options - CSRF protection options
 * @returns {Function} Express middleware
 */
export function csrfProtection(options = {}) {
  const { 
    cookie = true, 
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    cookieName = 'XSRF-TOKEN',
    headerName = 'X-CSRF-Token',
    sessionKey = 'sessionID'
  } = options;
  
  return function csrfMiddleware(req, res, next) {
    // Skip CSRF check for ignored methods
    if (ignoreMethods.includes(req.method)) {
      // For GET requests, set a new CSRF token
      if (req.method === 'GET' && cookie) {
        const sessionId = req.sessionID || req[sessionKey] || req.ip;
        const token = generateToken(sessionId);
        
        // Set CSRF token cookie
        res.cookie(cookieName, token, {
          httpOnly: false, // Accessible from JavaScript
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        // Make token available to templates
        res.locals.csrfToken = token;
      }
      
      return next();
    }
    
    // Get session ID
    const sessionId = req.sessionID || req[sessionKey] || req.ip;
    
    // Get token from header or request body
    const token = req.headers[headerName.toLowerCase()] || req.body._csrf;
    
    if (!token) {
      csrfLogger.warn(`CSRF token missing in request: ${req.path}`);
      return next(createError('authorization', 'CSRF token missing'));
    }
    
    // Validate token
    if (!validateToken(token, sessionId)) {
      csrfLogger.warn(`Invalid CSRF token for ${req.path}`);
      return next(createError('authorization', 'Invalid CSRF token'));
    }
    
    // Generate a new token for the next request
    if (cookie) {
      const newToken = generateToken(sessionId);
      
      // Set new CSRF token cookie
      res.cookie(cookieName, newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Make token available to templates
      res.locals.csrfToken = newToken;
    }
    
    next();
  };
}

/**
 * Helper function to initialize CSRF for a request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export function initializeCsrf(req, res) {
  const sessionId = req.sessionID || req.ip;
  const token = generateToken(sessionId);
  
  // Set CSRF token cookie
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Make token available to templates
  res.locals.csrfToken = token;
  
  return token;
}

/**
 * Helper function to apply CSRF protection to a router
 * @param {Object} router - Express router
 * @param {Object} options - CSRF protection options
 */
export function applyCSRFProtection(router, options = {}) {
  router.use(csrfProtection(options));
  router.use((req, res, next) => {
    // Add CSRF token to all responses
    if (!res.locals.csrfToken) {
      const sessionId = req.sessionID || req.ip;
      res.locals.csrfToken = generateToken(sessionId);
    }
    next();
  });
}

export default csrfProtection;
