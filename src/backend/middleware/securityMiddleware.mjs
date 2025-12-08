/**
 * @fileoverview Production Security Middleware
 * JWT authentication, rate limiting, input validation, and security headers
 */
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';

class SecurityMiddleware {
  constructor(databaseService) {
    this.db = databaseService;
    this.setupRateLimiters();
    this.activeTokens = new Set(); // In production, use Redis
    this.csrfSecrets = new Map(); // In production, use secure storage
  }

  setupRateLimiters() {
    // General API rate limiter
    this.generalLimiter = new RateLimiterMemory({
      points: 100, // Number of requests
      duration: 900, // Per 15 minutes
      blockDuration: 900, // Block for 15 minutes
    });

    // Password dance specific limiter (more restrictive)
    this.passwordDanceLimiter = new RateLimiterMemory({
      points: 5, // 5 attempts
      duration: 900, // Per 15 minutes
      blockDuration: 1800, // Block for 30 minutes
    });

    // Authentication limiter
    this.authLimiter = new RateLimiterMemory({
      points: 10, // 10 login attempts
      duration: 900, // Per 15 minutes
      blockDuration: 3600, // Block for 1 hour
    });
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-site" },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: "no-referrer" },
      xssFilter: true,
    });
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(limiterType = 'general') {
    return async (req, res, next) => {
      try {
        const key = req.ip;
        let limiter;

        switch (limiterType) {
          case 'password-dance':
            limiter = this.passwordDanceLimiter;
            break;
          case 'auth':
            limiter = this.authLimiter;
            break;
          default:
            limiter = this.generalLimiter;
        }

        await limiter.consume(key);
        next();
      } catch (rejRes) {
        const remainingPoints = rejRes.remainingPoints || 0;
        const resetTime = new Date(Date.now() + rejRes.msBeforeNext);

        // Log rate limit violation
        await this.db.logSecurityEvent(
          req.user?.userId || null,
          'rate_limit_exceeded',
          { 
            endpoint: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            remainingPoints,
            resetTime
          },
          'medium',
          req.ip
        );

        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again after ${Math.round(rejRes.msBeforeNext / 1000)} seconds.`,
          resetTime: resetTime.toISOString(),
          remainingAttempts: remainingPoints
        });
      }
    };
  }

  /**
   * JWT Authentication middleware
   */
  authenticateToken(required = true) {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
          if (required) {
            return res.status(401).json({
              error: 'Access token required',
              message: 'Please provide a valid authentication token'
            });
          }
          return next();
        }

        // Verify token is still active
        if (!this.activeTokens.has(token)) {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Token has been revoked or is invalid'
          });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = {
          userId: decoded.userId,
          trustLevel: decoded.trustLevel,
          verificationMethod: decoded.verificationMethod,
          tokenIssued: decoded.iat
        };

        // Log successful authentication
        await this.db.logSecurityEvent(
          decoded.userId,
          'token_authentication_success',
          { 
            endpoint: req.path,
            trustLevel: decoded.trustLevel,
            verificationMethod: decoded.verificationMethod
          },
          'low',
          req.ip
        );

        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token expired',
            message: 'Please log in again'
          });
        }

        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Token is malformed or invalid'
          });
        }

        logger.error('JWT authentication error', { error: error.message });
        
        res.status(500).json({
          error: 'Authentication error',
          message: 'Unable to authenticate request'
        });
      }
    };
  }

  /**
   * Trust level authorization
   */
  requireTrustLevel(minimumLevel) {
    const trustLevels = {
      'probationary': 0,
      'trusted': 1,
      'verified': 2,
      'anchor': 3
    };

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      const userLevel = trustLevels[req.user.trustLevel] || 0;
      const requiredLevel = trustLevels[minimumLevel] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: 'Insufficient trust level',
          message: `This action requires ${minimumLevel} trust level. Your current level: ${req.user.trustLevel}`,
          currentTrustLevel: req.user.trustLevel,
          requiredTrustLevel: minimumLevel
        });
      }

      next();
    };
  }

  /**
   * Input validation middleware
   */
  validateInput(validations) {
    return [
      ...validations,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Request data is invalid',
            details: errors.array().map(err => ({
              field: err.param,
              message: err.msg,
              value: err.value
            }))
          });
        }
        next();
      }
    ];
  }

  /**
   * CSRF Protection
   */
  csrfProtection() {
    return (req, res, next) => {
      if (req.method === 'GET') {
        // Generate and store CSRF token for GET requests
        const csrfToken = crypto.randomBytes(32).toString('hex');
        const sessionId = req.sessionID || req.ip; // Use session ID or IP as fallback
        
        this.csrfSecrets.set(sessionId, csrfToken);
        res.locals.csrfToken = csrfToken;
        
        return next();
      }

      // Validate CSRF token for state-changing requests
      const tokenFromHeader = req.headers['x-csrf-token'];
      const tokenFromBody = req.body._csrf;
      const sessionId = req.sessionID || req.ip;
      
      const expectedToken = this.csrfSecrets.get(sessionId);
      
      if (!expectedToken || (tokenFromHeader !== expectedToken && tokenFromBody !== expectedToken)) {
        return res.status(403).json({
          error: 'CSRF token mismatch',
          message: 'Invalid or missing CSRF token'
        });
      }

      next();
    };
  }

  /**
   * Password Dance Specific Validations
   */
  validatePasswordDanceEnrollment() {
    return this.validateInput([
      body('phrase')
        .isLength({ min: 10, max: 200 })
        .withMessage('Phrase must be between 10 and 200 characters')
        .matches(/^[a-zA-Z0-9\s\.,!?-]+$/)
        .withMessage('Phrase contains invalid characters'),
      body('gestureType')
        .isIn(['nod', 'smile', 'wink', 'eyebrow', 'turn'])
        .withMessage('Invalid gesture type'),
      body('audioData')
        .notEmpty()
        .withMessage('Audio data is required'),
      body('gestureData')
        .notEmpty()
        .withMessage('Gesture data is required')
    ]);
  }

  validatePasswordDanceChallenge() {
    return this.validateInput([
      body('phrase')
        .isLength({ min: 1, max: 200 })
        .withMessage('Phrase is required'),
      body('audioData')
        .notEmpty()
        .withMessage('Audio data is required'),
      body('gestureData')
        .notEmpty()
        .withMessage('Gesture data is required')
    ]);
  }

  /**
   * Anti-replay protection
   */
  antiReplay() {
    const requestHashes = new Set(); // In production, use Redis with TTL
    
    return (req, res, next) => {
      // Create hash of request content for replay detection
      const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        timestamp: Math.floor(Date.now() / 30000) // 30-second window
      });
      
      const requestHash = crypto.createHash('sha256').update(requestData).digest('hex');
      
      if (requestHashes.has(requestHash)) {
        return res.status(409).json({
          error: 'Duplicate request',
          message: 'This request has been processed recently'
        });
      }
      
      requestHashes.add(requestHash);
      
      // Clean up old hashes (in production, use Redis TTL)
      setTimeout(() => {
        requestHashes.delete(requestHash);
      }, 60000); // Remove after 1 minute
      
      next();
    };
  }

  /**
   * Biometric data sanitization
   */
  sanitizeBiometricData() {
    return (req, res, next) => {
      // Ensure biometric data doesn't contain malicious content
      if (req.body.audioData) {
        // Validate audio data format
        if (typeof req.body.audioData !== 'object' && typeof req.body.audioData !== 'string') {
          return res.status(400).json({
            error: 'Invalid audio data format'
          });
        }
      }

      if (req.body.gestureData) {
        // Validate gesture data format
        if (typeof req.body.gestureData !== 'object' && typeof req.body.gestureData !== 'string') {
          return res.status(400).json({
            error: 'Invalid gesture data format'
          });
        }
      }

      // Sanitize phrase input
      if (req.body.phrase) {
        req.body.phrase = req.body.phrase.trim().substring(0, 200);
      }

      next();
    };
  }

  /**
   * Generate secure session token
   */
  generateSecureToken(userId, trustLevel, verificationMethod = 'standard') {
    const payload = {
      userId,
      trustLevel,
      verificationMethod,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(), // Unique token ID
      iss: process.env.JWT_ISSUER || 'relay-platform'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '24h',
      algorithm: 'HS256'
    });

    // Store active token
    this.activeTokens.add(token);

    // Auto-cleanup expired tokens
    setTimeout(() => {
      this.activeTokens.delete(token);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return token;
  }

  /**
   * Revoke token
   */
  revokeToken(token) {
    this.activeTokens.delete(token);
    logger.info('Token revoked', { tokenPrefix: token?.substring(0, 10) });
  }

  /**
   * Security audit logging
   */
  auditLogger() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Log request
      const requestData = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        trustLevel: req.user?.trustLevel
      };

      // Override res.json to log responses
      const originalJson = res.json;
      res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Log security-relevant events
        if (req.path.includes('password-dance') || 
            req.path.includes('verification') ||
            req.path.includes('auth')) {
          
          logger.info('Security operation completed', {
            ...requestData,
            statusCode: res.statusCode,
            duration,
            success: res.statusCode < 400
          });
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Error handling with security considerations
   */
  securityErrorHandler() {
    return (error, req, res, next) => {
      // Log security errors
      logger.error('Security middleware error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId
      });

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: 'Internal security error',
          message: 'An error occurred while processing your request'
        });
      } else {
        res.status(500).json({
          error: 'Security middleware error',
          message: error.message,
          stack: error.stack
        });
      }
    };
  }
}

export default SecurityMiddleware;
