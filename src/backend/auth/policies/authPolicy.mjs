// backend/auth/policies/authPolicy.mjs
import authService from '../core/authService.mjs';

/**
 * Authentication levels
 */
export const AUTH_LEVELS = {
  BASIC: 'basic',
  ELEVATED: 'elevated', 
  STRICT: 'strict'
};

/**
 * Authentication factors
 */
export const FACTORS = {
  PASSWORD: 'password',
  BIOMETRIC: 'biometric',
  DEVICE: 'device',
  DEVICE_ATTESTATION: 'device_attestation',
  MULTI_FACTOR: 'multi_factor'
};

/**
 * Auth Policy - Authentication middleware
 * 
 * Responsibilities:
 * - Authentication middleware
 * - Route protection and authorization rules
 * - Permission checking
 */
class AuthPolicy {
  /**
   * Middleware factory to verify user authentication
   * @param {string} level - Optional authentication level requirement
   * @returns {Function} Express middleware function
   */
  requireAuth(level = AUTH_LEVELS.BASIC) {
    return (req, res, next) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      return this.verifyToken(token, req, res, next);
    };
  }

  /**
   * Middleware factory to verify authentication if token is present, but allow
   * unauthenticated requests to proceed
   * @returns {Function} Express middleware function
   */
  optionalAuth() {
    return (req, res, next) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return next();
      }

      return this.verifyToken(token, req, res, next);
    };
  }

  /**
   * Extract token from request (cookie or Authorization header)
   */
  extractToken(req) {
    // Check for token in cookie first (preferred method)
    if (req.cookies && req.cookies.auth_token) {
      return req.cookies.auth_token;
    }
    
    // Fallback to Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  /**
   * Verify token and attach user to request
   */
  async verifyToken(token, req, res, next) {
    try {
      const result = await authService.validateToken(token);
      
      if (!result.valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      // Attach user and auth info to request for downstream handlers
      req.user = result.user;
      req.auth = {
        sessionId: result.sessionId,
        isAuthenticated: true
      };
      
      return next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new AuthPolicy();
