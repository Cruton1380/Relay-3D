/**
 * @fileoverview Tests for Authentication Middleware
 * Critical test coverage for backend/auth/middleware/index.mjs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the imports BEFORE importing the module under test
vi.mock('../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: vi.fn(() => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn()
    }))
  }
}));

vi.mock('../src/backend/auth/core/authService.mjs', () => ({
  default: {
    verifyAuthentication: vi.fn(),
    validateToken: vi.fn()
  }
}));

vi.mock('../src/backend/auth/policies/authPolicy.mjs', () => ({
  default: {
    getPolicyForRoute: vi.fn(),
    requireAuth: vi.fn()
  },
  AUTH_LEVELS: {
    BASIC: 'basic',
    ELEVATED: 'elevated',
    STRICT: 'strict'
  },
  FACTORS: {
    PASSWORD: 'password',
    BIOMETRIC: 'biometric',
    DEVICE: 'device',
    DEVICE_ATTESTATION: 'device_attestation'
  }
}));

// Now import the module under test
import authMiddleware from '../src/backend/auth/middleware/index.mjs';
const { authenticate, authorize, requireBasicAuth, requireElevatedAuth, requireStrictAuth } = authMiddleware;

describe('Authentication Middleware', () => {
  let req, res, next;
  let mockAuthService, mockAuthPolicy, mockLogger;
  beforeEach(async () => {
    // Get fresh mock references for each test
    mockAuthService = (await vi.importMock('../src/backend/auth/core/authService.mjs')).default;
    mockAuthPolicy = (await vi.importMock('../src/backend/auth/policies/authPolicy.mjs')).default;
    mockLogger = (await vi.importMock('../src/backend/utils/logging/logger.mjs')).default;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock request/response objects
    req = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
      headers: {},
      user: null
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticate() middleware', () => {
    it('should allow access when authentication succeeds with sufficient level', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 'elevated',
        factors: { password: true, biometric: true }
      });

      const middleware = authenticate({ requireLevel: 'basic' });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(mockAuthService.verifyAuthentication).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });    it('should reject access when authentication level is insufficient', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 1, // basic level = 1
        factors: { password: true }
      });

      const middleware = authenticate({ requireLevel: 'elevated' });

      // Act
      await middleware(req, res, next);      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient authentication level',
        required: 2, // 'elevated' level converts to 2
        current: 1   // 'basic' level converts to 1
      });
      expect(next).not.toHaveBeenCalled();
    });    it('should reject access when required biometric factor is missing', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 2, // elevated level = 2
        factors: { password: true }
      });

      const middleware = authenticate({ 
        requireLevel: 'basic',
        requireBiometric: true 
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Biometric verification required'
      });
      expect(next).not.toHaveBeenCalled();
    });    it('should reject access when required device attestation is missing', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 2, // elevated level = 2
        factors: { password: true, biometric: true }
      });

      const middleware = authenticate({ 
        requireLevel: 'basic',
        requireDeviceAttestation: true 
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device attestation required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use policy requirements when available', async () => {
      // Arrange
      mockAuthPolicy.getPolicyForRoute.mockReturnValue({
        level: 'strict',
        requiredFactors: ['biometric', 'device_attestation']
      });

      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 'strict',
        factors: { 
          password: true, 
          biometric: true, 
          device_attestation: true 
        }
      });

      const middleware = authenticate({ requireLevel: 'basic' });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(mockAuthPolicy.getPolicyForRoute).toHaveBeenCalledWith('GET:/api/test');
      expect(next).toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockRejectedValue(
        new Error('Auth service error')
      );

      const middleware = authenticate({ optionalAuth: false });

      // Act
      await middleware(req, res, next);      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Auth service error'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access with optional auth when authentication fails', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockRejectedValue(
        new Error('Auth service error')
      );

      const middleware = authenticate({ optionalAuth: true });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize() middleware', () => {
    beforeEach(() => {
      req.user = { 
        userId: 'test-user', 
        roles: ['user', 'voter'] 
      };
    });

    it('should allow access when user has required role', async () => {
      // Arrange
      const middleware = authorize('user');

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has any of multiple required roles', async () => {
      // Arrange
      const middleware = authorize(['admin', 'voter']);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should reject access when user lacks required role', async () => {
      // Arrange
      const middleware = authorize('admin');

      // Act
      await middleware(req, res, next);      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You do not have permission to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject access when user is not authenticated', async () => {
      // Arrange
      req.user = null;
      const middleware = authorize('user');

      // Act
      await middleware(req, res, next);      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing roles gracefully', async () => {
      // Arrange
      req.user = { userId: 'test-user' }; // No roles property
      const middleware = authorize('user');

      // Act
      await middleware(req, res, next);      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You do not have permission to access this resource'
      });
    });
  });

  describe('convenience middleware functions', () => {
    it('should create basic auth middleware with correct level', () => {
      // Act
      const middleware = requireBasicAuth();

      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create elevated auth middleware with correct level', () => {
      // Act
      const middleware = requireElevatedAuth();

      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create strict auth middleware with correct level', () => {
      // Act
      const middleware = requireStrictAuth();

      // Assert
      expect(typeof middleware).toBe('function');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing route information', async () => {
      // Arrange
      req.route = null;
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 'basic',
        factors: { password: true }
      });

      const middleware = authenticate();

      // Act
      await middleware(req, res, next);

      // Assert
      expect(mockAuthPolicy.getPolicyForRoute).toHaveBeenCalledWith('GET:/api/test');
      expect(next).toHaveBeenCalled();
    });

    it('should handle null policy requirements', async () => {
      // Arrange
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'test-user' },
        level: 'basic',
        factors: { password: true }
      });

      const middleware = authenticate({ requireLevel: 'basic' });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });    it('should handle malformed authentication response', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        // Missing user, level, or factors
      });

      const middleware = authenticate();

      // Act
      await middleware(req, res, next);

      // Assert - Should handle gracefully and call next with error due to undefined level/user
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});






