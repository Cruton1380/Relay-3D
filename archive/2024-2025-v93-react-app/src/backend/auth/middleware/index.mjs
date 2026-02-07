/**
 * @fileoverview Authentication Middleware
 * Provides Express middleware functions for authentication and authorization
 */
import logger from '../../utils/logging/logger.mjs';
import authService from '../core/authService.mjs';
import authPolicy, { AUTH_LEVELS, FACTORS } from '../policies/authPolicy.mjs';

const authLogger = logger.child({ module: 'auth-middleware' });

/**
 * Convert auth level string to numeric value for comparison
 * @param {string|number} level - Auth level
 * @returns {number} Numeric level
 */
function getLevelValue(level) {
  if (typeof level === 'number') return level;
  
  const levelMap = {
    [AUTH_LEVELS.BASIC]: 1,
    [AUTH_LEVELS.ELEVATED]: 2, 
    [AUTH_LEVELS.STRICT]: 3
  };
  
  return levelMap[level] || 1; // default to basic
}

/**
 * Authentication middleware that enforces policy requirements
 * @param {Object} options - Authentication options
 * @returns {Function} Express middleware
 */
export function authenticate(options = {}) {
  return async (req, res, next) => {
    try {
      // Extract options
      const { 
        requireLevel = AUTH_LEVELS.BASIC,
        requireBiometric = false,
        requireDeviceAttestation = false,
        optionalAuth = false
      } = options;
      
      // Get method and path for policy lookup
      const method = req.method;
      const path = req.route ? req.route.path : req.path;
      const routePattern = `${method}:${path}`;
      
      // Look up policy for this route
      const policyRequirements = authPolicy.getPolicyForRoute(routePattern);
        // If route has explicit policy, use it instead of options
      const effectiveRequireLevel = getLevelValue(policyRequirements?.level ?? requireLevel);
      const effectiveRequireBiometric = policyRequirements?.requiredFactors?.includes(FACTORS.BIOMETRIC) ?? requireBiometric;
      const effectiveRequireDeviceAttestation = policyRequirements?.requiredFactors?.includes(FACTORS.DEVICE_ATTESTATION) ?? requireDeviceAttestation;
      // Try to verify authentication
      try {
        const { authenticated, user, level, factors } = await authService.verifyAuthentication(req);
        
        // Validate authentication response structure
        if (!user || typeof level !== 'number' || !factors) {
          const error = new Error('Malformed authentication response');
          authLogger.error('Authentication service returned malformed response', {
            hasUser: !!user,
            levelType: typeof level,
            hasFactors: !!factors,
            path: req.path
          });
          return next(error);
        }
        
        // Check if authentication level is sufficient
        if (level < effectiveRequireLevel) {
          authLogger.warn('Insufficient authentication level', { 
            required: effectiveRequireLevel, 
            provided: level,
            userId: user.userId,
            path: req.path
          });
          
          return res.status(403).json({
            error: 'Insufficient authentication level',
            required: effectiveRequireLevel,
            current: level
          });
        }
        
        // Check if required factors are present
        if (effectiveRequireBiometric && !factors[FACTORS.BIOMETRIC]) {
          authLogger.warn('Biometric verification required', { 
            userId: user.userId,
            path: req.path
          });
          
          return res.status(403).json({
            error: 'Biometric verification required'
          });
        }
        
        if (effectiveRequireDeviceAttestation && !factors[FACTORS.DEVICE_ATTESTATION]) {
          authLogger.warn('Device attestation required', { 
            userId: user.userId,
            path: req.path
          });
          
          return res.status(403).json({
            error: 'Device attestation required'
          });
        }
        
        // If we get here, authentication is valid
        next();
      } catch (error) {
        // If authentication is optional, proceed without it
        if (optionalAuth) {
          req.isAuthenticated = false;
          next();
          return;
        }
        
        // Otherwise, return auth error
        authLogger.warn('Authentication failed', {
          error: error.message,
          path: req.path
        });
        
        res.status(401).json({
          error: 'Authentication required',
          message: error.message
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Authorization middleware
 * @param {string|Array} requiredRoles - Role(s) required for access
 * @returns {Function} Express middleware
 */
export function authorize(requiredRoles) {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    // Handle single role or array of roles
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has required role
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      authLogger.warn('Authorization failed - missing required role', { 
        userId: req.user.userId,
        requiredRoles: roles,
        userRoles
      });
      
      return res.status(403).json({
        error: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

// Convenience middlewares for specific authentication requirements
export const requireBasicAuth = () => authenticate({ requireLevel: AUTH_LEVELS.BASIC });
export const requireElevatedAuth = () => authenticate({ requireLevel: AUTH_LEVELS.ELEVATED });
export const requireStrictAuth = () => authenticate({ requireLevel: AUTH_LEVELS.STRICT });
export const requireBiometricVerification = () => authenticate({ requireBiometric: true });
export const requireDeviceAttestation = () => authenticate({ requireDeviceAttestation: true });
export const optionalAuth = () => authenticate({ optionalAuth: true });

// Export requireAuth as an alias for requireBasicAuth for backward compatibility
export const requireAuth = requireBasicAuth;

export default {
  authenticate,
  authorize,
  requireBasicAuth,
  requireElevatedAuth,
  requireStrictAuth,
  requireBiometricVerification,
  requireDeviceAttestation,
  optionalAuth,
  requireAuth
};
