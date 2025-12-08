/**
 * @fileoverview Mock implementation of jsonwebtoken for testing
 * Provides a lightweight alternative to jsonwebtoken for development and testing
 */

/**
 * Mock JWT sign function
 * @param {Object} payload - JWT payload
 * @param {string} secretOrPrivateKey - Secret key (ignored in mock)
 * @param {Object} options - JWT options
 * @returns {string} Mock JWT token
 */
export function sign(payload, secretOrPrivateKey, options = {}) {
  const header = { typ: 'JWT', alg: 'HS256' };
  const mockPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: options.expiresIn ? Math.floor(Date.now() / 1000) + parseExpiry(options.expiresIn) : undefined
  };
  
  // Create a mock token (not cryptographically secure)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
  const mockSignature = Buffer.from('mock-signature-' + Date.now()).toString('base64url').slice(0, 43);
  
  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Mock JWT verify function
 * @param {string} token - JWT token to verify
 * @param {string} secretOrPublicKey - Secret key (ignored in mock)
 * @param {Object} options - Verification options
 * @returns {Object} Decoded payload
 */
export function verify(token, secretOrPublicKey, options = {}) {
  if (!token || typeof token !== 'string') {
    const error = new Error('jwt must be provided');
    error.name = 'JsonWebTokenError';
    throw error;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    throw error;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiration if present
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date(payload.exp * 1000);
      throw error;
    }
    
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw error;
    }
    const jwtError = new Error('invalid token');
    jwtError.name = 'JsonWebTokenError';
    throw jwtError;
  }
}

/**
 * Mock JWT decode function
 * @param {string} token - JWT token to decode
 * @param {Object} options - Decode options
 * @returns {Object|null} Decoded payload or null
 */
export function decode(token, options = {}) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    if (options.complete) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      return {
        header,
        payload,
        signature: parts[2]
      };
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Parse expiry time string to seconds
 * @param {string|number} expiresIn - Expiry time
 * @returns {number} Seconds
 */
function parseExpiry(expiresIn) {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  
  if (typeof expiresIn === 'string') {
    const timeMap = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'y': 31536000
    };
    
    const match = expiresIn.match(/^(\d+)([smhdwy]?)$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * (timeMap[unit] || 1);
    }
  }
  
  return 3600; // Default 1 hour
}

// Create mock errors
export class JsonWebTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JsonWebTokenError';
  }
}

export class TokenExpiredError extends Error {
  constructor(message, expiredAt) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

export class NotBeforeError extends Error {
  constructor(message, date) {
    super(message);
    this.name = 'NotBeforeError';
    this.date = date;
  }
}

// Default export for CommonJS compatibility
export default {
  sign,
  verify,
  decode,
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError
};
