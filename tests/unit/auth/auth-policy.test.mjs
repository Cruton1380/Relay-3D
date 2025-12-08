// File: test/backend/auth/authPolicy.test.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
const mockAuthService = {
  validateToken: vi.fn()
};

// Setup mocks before importing module
vi.mock('../../../src/backend/auth/core/authService.mjs', () => ({
  default: mockAuthService
}));

// Now import the module under test
const authPolicyModule = await import('../../../src/backend/auth/policies/authPolicy.mjs');
const authPolicy = authPolicyModule.default;
const { AUTH_LEVELS, FACTORS } = authPolicyModule;

describe('AuthPolicy', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock request, response, and next
    req = {
      headers: {},
      cookies: {},
      user: null,
      auth: null
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

  describe('AUTH_LEVELS constants', () => {
    it('should export correct auth levels', () => {
      expect(AUTH_LEVELS).toEqual({
        BASIC: 'basic',
        ELEVATED: 'elevated',
        STRICT: 'strict'
      });
    });
  });

  describe('FACTORS constants', () => {    it('should export correct auth factors', () => {
      expect(FACTORS).toEqual({
        PASSWORD: 'password',
        BIOMETRIC: 'biometric',
        DEVICE: 'device',
        DEVICE_ATTESTATION: 'device_attestation',
        MULTI_FACTOR: 'multi_factor'
      });
    });
  });

  describe('extractToken', () => {
    it('should extract token from cookies (preferred)', () => {
      // Arrange
      req.cookies = { auth_token: 'cookie-token-123' };
      req.headers.authorization = 'Bearer header-token-456';
      
      // Act
      const token = authPolicy.extractToken(req);
      
      // Assert
      expect(token).toBe('cookie-token-123');
    });

    it('should extract token from Authorization header when no cookie', () => {
      // Arrange
      req.headers.authorization = 'Bearer header-token-456';
      
      // Act
      const token = authPolicy.extractToken(req);
      
      // Assert
      expect(token).toBe('header-token-456');
    });

    it('should return null when no token found', () => {
      // Act
      const token = authPolicy.extractToken(req);
      
      // Assert
      expect(token).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      // Arrange
      req.headers.authorization = 'Basic user:pass';
      
      // Act
      const token = authPolicy.extractToken(req);
      
      // Assert
      expect(token).toBeNull();
    });

    it('should handle missing cookies gracefully', () => {
      // Arrange
      req.cookies = null;
      req.headers.authorization = 'Bearer token-123';
      
      // Act
      const token = authPolicy.extractToken(req);
      
      // Assert
      expect(token).toBe('token-123');
    });
  });

  describe('requireAuth', () => {    it('should proceed when valid token is provided', async () => {
      // Arrange
      req.cookies = { auth_token: 'valid-token' };
      mockAuthService.validateToken.mockResolvedValue({
        valid: true,
        user: { userId: 'user123', publicKey: 'pubkey123' },
        sessionId: 'session123'
      });
      
      // Act
      const middleware = authPolicy.requireAuth();
      await middleware(req, res, next);
      
      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({ userId: 'user123', publicKey: 'pubkey123' });
      expect(req.auth).toEqual({
        sessionId: 'session123',
        isAuthenticated: true
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', () => {
      // Act
      const middleware = authPolicy.requireAuth();
      middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      req.cookies = { auth_token: 'invalid-token' };
      mockAuthService.validateToken.mockResolvedValue({
        valid: false
      });
      
      // Act
      const middleware = authPolicy.requireAuth();
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });    it('should return 500 when token validation throws error', async () => {
      // Arrange
      req.cookies = { auth_token: 'problematic-token' };
      mockAuthService.validateToken.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      const middleware = authPolicy.requireAuth();
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith('Token verification error:', expect.any(Error));
      expect(next).not.toHaveBeenCalled();
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
  describe('optionalAuth', () => {
    it('should proceed without auth when no token is provided', () => {
      // Act
      const middleware = authPolicy.optionalAuth();
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('should authenticate when valid token is provided', async () => {
      // Arrange
      req.cookies = { auth_token: 'valid-token' };
      mockAuthService.validateToken.mockResolvedValue({
        valid: true,
        user: { userId: 'user123' },
        sessionId: 'session123'
      });
      
      // Act
      const middleware = authPolicy.optionalAuth();
      await middleware(req, res, next);
      
      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({ userId: 'user123' });
      expect(req.auth).toEqual({
        sessionId: 'session123',
        isAuthenticated: true
      });
      expect(next).toHaveBeenCalled();
    });    it('should return 401 when token is invalid (same as requireAuth)', async () => {
      // Arrange
      req.cookies = { auth_token: 'invalid-token' };
      mockAuthService.validateToken.mockResolvedValue({
        valid: false
      });
      
      // Act
      const middleware = authPolicy.optionalAuth();
      await middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should attach user and auth info to request when token is valid', async () => {
      // Arrange
      const token = 'valid-token';
      mockAuthService.validateToken.mockResolvedValue({
        valid: true,
        user: { userId: 'user123', email: 'test@example.com' },
        sessionId: 'session123'
      });
      
      // Act
      await authPolicy.verifyToken(token, req, res, next);
      
      // Assert
      expect(req.user).toEqual({ userId: 'user123', email: 'test@example.com' });
      expect(req.auth).toEqual({
        sessionId: 'session123',
        isAuthenticated: true
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when token validation result is invalid', async () => {
      // Arrange
      const token = 'invalid-token';
      mockAuthService.validateToken.mockResolvedValue({
        valid: false
      });
      
      // Act
      await authPolicy.verifyToken(token, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(req.user).toBeNull();
      expect(req.auth).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 and log error when validation throws', async () => {
      // Arrange
      const token = 'problematic-token';
      const error = new Error('Service unavailable');
      mockAuthService.validateToken.mockRejectedValue(error);
      
      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await authPolicy.verifyToken(token, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith('Token verification error:', error);
      expect(next).not.toHaveBeenCalled();
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});






