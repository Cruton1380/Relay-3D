// File: test/backend/auth/middleware.test.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
const mockLogger = {
  child: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

const mockAuthService = {
  verifyAuthentication: vi.fn()
};

const mockAuthPolicy = {
  getPolicyForRoute: vi.fn()
};

const mockAuthLevels = {
  BASIC: 1,
  ELEVATED: 2,
  STRICT: 3
};

const mockFactors = {
  BIOMETRIC: 'biometric',
  DEVICE_ATTESTATION: 'device_attestation'
};

// Setup mocks before importing module
vi.mock('../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

vi.mock('../src/backend/auth/core/authService.mjs', () => ({
  default: mockAuthService
}));

vi.mock('../src/backend/auth/policies/authPolicy.mjs', () => ({
  default: mockAuthPolicy,
  AUTH_LEVELS: mockAuthLevels,
  FACTORS: mockFactors
}));

// Now import the module under test
const middlewareModule = await import('../src/backend/auth/middleware/index.mjs');
const middleware = middlewareModule.default;
const { 
  authenticate, 
  authorize, 
  requireBasicAuth, 
  requireElevatedAuth, 
  requireStrictAuth,  requireBiometricVerification,
  requireDeviceAttestation,
  optionalAuth
} = middleware;

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock request, response, and next
    req = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
      headers: {},
      cookies: {},
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

  describe('authenticate', () => {
    it('should allow access when authentication is valid and sufficient', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.BASIC,
        factors: {}
      });
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate({ requireLevel: mockAuthLevels.BASIC });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(mockAuthService.verifyAuthentication).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should use policy requirements over options when policy exists', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.ELEVATED,
        factors: { [mockFactors.BIOMETRIC]: true }
      });
      
      mockAuthPolicy.getPolicyForRoute.mockReturnValue({
        level: mockAuthLevels.ELEVATED,
        requiredFactors: [mockFactors.BIOMETRIC]
      });
      
      const middleware = authenticate({ requireLevel: mockAuthLevels.BASIC });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(mockAuthPolicy.getPolicyForRoute).toHaveBeenCalledWith('GET:/api/test');
      expect(next).toHaveBeenCalled();
    });

    it('should reject when authentication level is insufficient', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.BASIC,
        factors: {}
      });
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate({ requireLevel: mockAuthLevels.ELEVATED });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient authentication level',
        required: mockAuthLevels.ELEVATED,
        current: mockAuthLevels.BASIC
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when biometric verification is required but missing', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.BASIC,
        factors: {}
      });
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate({ requireBiometric: true });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Biometric verification required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when device attestation is required but missing', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.BASIC,
        factors: {}
      });
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate({ requireDeviceAttestation: true });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device attestation required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed without auth when optional auth is enabled and auth fails', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockRejectedValue(new Error('No token'));
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate({ optionalAuth: true });
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(req.isAuthenticated).toBe(false);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when authentication fails and auth is required', async () => {
      // Arrange
      mockAuthService.verifyAuthentication.mockRejectedValue(new Error('Invalid token'));
      mockAuthPolicy.getPolicyForRoute.mockReturnValue(null);
      
      const middleware = authenticate();
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });    it('should handle middleware errors by calling next with error', async () => {
      // Arrange
      const error = new Error('Middleware error');
      mockAuthPolicy.getPolicyForRoute.mockImplementation(() => {
        throw error;
      });
      
      const middleware = authenticate();
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should use req.path when route.path is not available', async () => {
      // Arrange
      req.route = null;
      mockAuthService.verifyAuthentication.mockResolvedValue({
        authenticated: true,
        user: { userId: 'user123' },
        level: mockAuthLevels.BASIC,
        factors: {}
      });
      
      const middleware = authenticate();
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(mockAuthPolicy.getPolicyForRoute).toHaveBeenCalledWith('GET:/api/test');
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      // Arrange
      req.user = { userId: 'user123', roles: ['admin', 'user'] };
      const middleware = authorize('admin');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      // Arrange
      req.user = { userId: 'user123', roles: ['user'] };
      const middleware = authorize(['admin', 'user']);
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', () => {
      // Arrange
      const middleware = authorize('admin');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when user lacks required role', () => {
      // Arrange
      req.user = { userId: 'user123', roles: ['user'] };
      const middleware = authorize('admin');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You do not have permission to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle users with no roles array', () => {
      // Arrange
      req.user = { userId: 'user123' };
      const middleware = authorize('admin');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('convenience middlewares', () => {
    it('should create requireBasicAuth middleware', () => {
      // Act
      const middleware = requireBasicAuth();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create requireElevatedAuth middleware', () => {
      // Act
      const middleware = requireElevatedAuth();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create requireStrictAuth middleware', () => {
      // Act
      const middleware = requireStrictAuth();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create requireBiometricVerification middleware', () => {
      // Act
      const middleware = requireBiometricVerification();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create requireDeviceAttestation middleware', () => {
      // Act
      const middleware = requireDeviceAttestation();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create optionalAuth middleware', () => {
      // Act
      const middleware = optionalAuth();
      
      // Assert
      expect(typeof middleware).toBe('function');
    });
  });
});






