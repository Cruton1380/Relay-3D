/**
 * @fileoverview Authentication Controller
 * Handles API endpoints for authentication operations
 */
import authService from '../core/authService.mjs';
import logger from '../../utils/logging/logger.mjs';
import validationUtils from '../../utils/validation/index.mjs';
import { loginSchema, refreshSchema } from '../utils/authSchemas.mjs';

// Create auth controller logger
const authLogger = logger.child({ module: 'auth-controller' });

class AuthController {
  /**
   * Handle login request with cryptographic signature
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      // Extract request data with validation
      const validationResult = validationUtils.validateSchema(req.body, loginSchema);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: validationResult.errors
        });
      }

      const { publicKey, signature, nonce, scheme } = req.body;
      
      // Collect metadata for authentication
      const metadata = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId
      };

      // Call service layer for business logic
      const authResult = await authService.authenticateWithSignature(
        publicKey,
        signature,
        nonce
      );

      // Set cookie with token for enhanced security
      res.cookie('auth_token', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Log successful login
      authLogger.info('User logged in successfully', {
        userId: authResult.user?.userId,
        authLevel: authResult.authLevel,
        factors: Object.keys(authResult.factors || {}).join(','),
        requestId: req.requestId
      });

      // Return success response (without sensitive data)
      return res.status(200).json({
        success: true,
        user: {
          userId: authResult.user?.userId,
          publicKey: authResult.user?.publicKey
        },
        authLevel: authResult.authLevel,
        factors: Object.keys(authResult.factors || {}),
        expiresIn: authResult.expiresIn
      });
    } catch (error) {
      // Log error
      authLogger.error('Login failed', {
        error: error.message,
        requestId: req.requestId
      });

      // Determine appropriate status code
      let statusCode = 500;
      if (error.message.includes('Invalid signature') || 
          error.message.includes('User not found')) {
        statusCode = 401;
      } else if (error.message.includes('Too many failed attempts')) {
        statusCode = 429;
      } else if (error.message.includes('Missing required')) {
        statusCode = 400;
      }

      // Return error response
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle logout request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const { sessionId } = req.user || {};
      
      if (sessionId) {
        await authService.logout(sessionId);
        
        // Log successful logout
        authLogger.info('User logged out successfully', {
          userId: req.user?.userId,
          sessionId,
          requestId: req.requestId
        });
      }
      
      // Clear the auth cookie
      res.clearCookie('auth_token');
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      // Log error
      authLogger.error('Logout failed', {
        error: error.message,
        userId: req.user?.userId,
        requestId: req.requestId
      });

      return res.status(500).json({
        success: false,
        error: 'Logout failed: ' + error.message
      });
    }
  }

  /**
   * Handle token refresh request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      // Extract request data with validation
      const validationResult = validationUtils.validateSchema(req.body, refreshSchema);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: validationResult.errors
        });
      }

      const { refreshToken } = req.body;
      
      // Call service layer for token refresh
      const refreshResult = await authService.refreshToken(refreshToken);
      
      // Set new cookie with refreshed token
      res.cookie('auth_token', refreshResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return res.status(200).json({
        success: true,
        expiresIn: refreshResult.expiresIn,
        authLevel: refreshResult.authLevel,
        factors: Object.keys(refreshResult.factors || {})
      });
    } catch (error) {
      // Log error
      authLogger.error('Token refresh failed', {
        error: error.message,
        requestId: req.requestId
      });

      // Determine appropriate status code
      const statusCode = error.message.includes('Invalid refresh token') ? 401 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle auth verification request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyAuth(req, res) {
    try {
      // Auth middleware has already validated the token and attached user data
      return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          userId: req.user?.userId,
          publicKey: req.user?.publicKey
        },
        authLevel: req.user?.authLevel,
        factors: req.user?.factors ? Object.keys(req.user.factors) : []
      });
    } catch (error) {
      authLogger.error('Auth verification failed', {
        error: error.message,
        requestId: req.requestId
      });

      return res.status(500).json({
        success: false,
        error: 'Authentication verification failed'
      });
    }
  }

  /**
   * Elevate authentication level with additional factors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async elevateAuth(req, res) {
    try {
      const { factor, factorData } = req.body;
      const { userId, sessionId } = req.user;
      
      if (!factor || !factorData) {
        return res.status(400).json({
          success: false,
          error: 'Missing factor information'
        });
      }

      // Call service to verify additional factor and elevate auth
      const elevationResult = await authService.elevateAuthentication(
        userId,
        sessionId,
        factor,
        factorData
      );
      
      // Set new cookie with elevated permissions
      res.cookie('auth_token', elevationResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return res.status(200).json({
        success: true,
        authLevel: elevationResult.authLevel,
        factors: Object.keys(elevationResult.factors || {})
      });
    } catch (error) {
      authLogger.error('Auth elevation failed', {
        error: error.message,
        userId: req.user?.userId,
        requestId: req.requestId
      });

      const statusCode = error.message.includes('Invalid factor') ? 401 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Create singleton instance
const authController = new AuthController();

export default authController;
