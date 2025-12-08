// File: test/backend/auth/authController.test.mjs

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
  authenticateWithSignature: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  elevateAuthentication: vi.fn()
};

const mockValidationUtils = {
  validateSchema: vi.fn()
};

const mockAuthSchemas = {
  loginSchema: { type: 'object' },
  refreshSchema: { type: 'object' }
};

// Setup mocks before importing module
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

vi.mock('../../../src/backend/auth/core/authService.mjs', () => ({
  default: mockAuthService
}));

vi.mock('../../../src/backend/utils/validation/index.mjs', () => ({
  default: mockValidationUtils
}));

vi.mock('../../../src/backend/auth/utils/authSchemas.mjs', () => mockAuthSchemas);

// Now import the module under test
const authControllerModule = await import('../../../src/backend/auth/policies/authController.mjs');
const authController = authControllerModule.default;

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock request and response
    req = {
      body: {},
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      requestId: 'req-123',
      user: null
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should successfully authenticate user with valid signature', async () => {
      // Arrange
      req.body = {
        publicKey: 'test-public-key',
        signature: 'test-signature',
        nonce: 'test-nonce',
        scheme: 'ed25519'
      };
      
      mockValidationUtils.validateSchema.mockReturnValue({
        valid: true,
        errors: []
      });
      
      mockAuthService.authenticateWithSignature.mockResolvedValue({
        token: 'auth-token-123',
        user: { userId: 'user123', publicKey: 'test-public-key' },
        authLevel: 1,
        factors: { password: true },
        expiresIn: 86400
      });
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(mockValidationUtils.validateSchema).toHaveBeenCalledWith(req.body, mockAuthSchemas.loginSchema);
      expect(mockAuthService.authenticateWithSignature).toHaveBeenCalledWith(
        'test-public-key',
        'test-signature',
        'test-nonce'
      );
      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'auth-token-123', {
        httpOnly: true,
        secure: false, // NODE_ENV not set to production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: {
          userId: 'user123',
          publicKey: 'test-public-key'
        },
        authLevel: 1,
        factors: ['password'],
        expiresIn: 86400
      });
    });

    it('should return 400 for invalid request parameters', async () => {
      // Arrange
      mockValidationUtils.validateSchema.mockReturnValue({
        valid: false,
        errors: ['Missing required field: publicKey']
      });
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid request parameters',
        details: ['Missing required field: publicKey']
      });
    });

    it('should return 401 for invalid signature', async () => {
      // Arrange
      req.body = { publicKey: 'test-key', signature: 'invalid-sig', nonce: 'nonce' };
      mockValidationUtils.validateSchema.mockReturnValue({ valid: true });
      mockAuthService.authenticateWithSignature.mockRejectedValue(
        new Error('Invalid signature')
      );
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid signature'
      });
    });

    it('should return 429 for too many failed attempts', async () => {
      // Arrange
      req.body = { publicKey: 'test-key', signature: 'sig', nonce: 'nonce' };
      mockValidationUtils.validateSchema.mockReturnValue({ valid: true });
      mockAuthService.authenticateWithSignature.mockRejectedValue(
        new Error('Too many failed attempts')
      );
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many failed attempts'
      });
    });

    it('should use secure cookie in production environment', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      req.body = { publicKey: 'key', signature: 'sig', nonce: 'nonce' };
      mockValidationUtils.validateSchema.mockReturnValue({ valid: true });
      mockAuthService.authenticateWithSignature.mockResolvedValue({
        token: 'token',
        user: { userId: 'user123' },
        authLevel: 1,
        factors: {},
        expiresIn: 86400
      });
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'token', 
        expect.objectContaining({ secure: true })
      );
      
      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logout', () => {
    it('should successfully logout user with valid session', async () => {
      // Arrange
      req.user = { userId: 'user123', sessionId: 'session123' };
      mockAuthService.logout.mockResolvedValue();
      
      // Act
      await authController.logout(req, res);
      
      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith('session123');
      expect(res.clearCookie).toHaveBeenCalledWith('auth_token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout without session gracefully', async () => {
      // Arrange
      req.user = null;
      
      // Act
      await authController.logout(req, res);
      
      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('auth_token');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 when logout service fails', async () => {
      // Arrange
      req.user = { userId: 'user123', sessionId: 'session123' };
      mockAuthService.logout.mockRejectedValue(new Error('Database error'));
      
      // Act
      await authController.logout(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Logout failed: Database error'
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      // Arrange
      req.body = { refreshToken: 'valid-refresh-token' };
      mockValidationUtils.validateSchema.mockReturnValue({ valid: true });
      mockAuthService.refreshToken.mockResolvedValue({
        token: 'new-auth-token',
        expiresIn: 86400,
        authLevel: 1,
        factors: { password: true }
      });
      
      // Act
      await authController.refreshToken(req, res);
      
      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'new-auth-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        expiresIn: 86400,
        authLevel: 1,
        factors: ['password']
      });
    });

    it('should return 400 for invalid request parameters', async () => {
      // Arrange
      mockValidationUtils.validateSchema.mockReturnValue({
        valid: false,
        errors: ['Missing refreshToken']
      });
      
      // Act
      await authController.refreshToken(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid request parameters',
        details: ['Missing refreshToken']
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      req.body = { refreshToken: 'invalid-token' };
      mockValidationUtils.validateSchema.mockReturnValue({ valid: true });
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));
      
      // Act
      await authController.refreshToken(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid refresh token'
      });
    });
  });

  describe('verifyAuth', () => {
    it('should return authenticated user info', async () => {
      // Arrange
      req.user = {
        userId: 'user123',
        publicKey: 'test-public-key',
        authLevel: 2,
        factors: { password: true, biometric: true }
      };
      
      // Act
      await authController.verifyAuth(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        authenticated: true,
        user: {
          userId: 'user123',
          publicKey: 'test-public-key'
        },
        authLevel: 2,
        factors: ['password', 'biometric']
      });
    });

    it('should handle missing factors gracefully', async () => {
      // Arrange
      req.user = {
        userId: 'user123',
        publicKey: 'test-public-key',
        authLevel: 1,
        factors: null
      };
      
      // Act
      await authController.verifyAuth(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          factors: []
        })
      );
    });
  });

  describe('elevateAuth', () => {
    it('should successfully elevate authentication with valid factor', async () => {
      // Arrange
      req.body = { factor: 'biometric', factorData: 'biometric-hash' };
      req.user = { userId: 'user123', sessionId: 'session123' };
      
      mockAuthService.elevateAuthentication.mockResolvedValue({
        token: 'elevated-token',
        authLevel: 2,
        factors: { password: true, biometric: true }
      });
      
      // Act
      await authController.elevateAuth(req, res);
      
      // Assert
      expect(mockAuthService.elevateAuthentication).toHaveBeenCalledWith(
        'user123',
        'session123',
        'biometric',
        'biometric-hash'
      );
      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'elevated-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        authLevel: 2,
        factors: ['password', 'biometric']
      });
    });

    it('should return 400 for missing factor information', async () => {
      // Arrange
      req.body = { factor: 'biometric' }; // Missing factorData
      req.user = { userId: 'user123', sessionId: 'session123' };
      
      // Act
      await authController.elevateAuth(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing factor information'
      });
    });

    it('should return 401 for invalid factor', async () => {
      // Arrange
      req.body = { factor: 'biometric', factorData: 'invalid-data' };
      req.user = { userId: 'user123', sessionId: 'session123' };
      
      mockAuthService.elevateAuthentication.mockRejectedValue(new Error('Invalid factor'));
      
      // Act
      await authController.elevateAuth(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid factor'
      });
    });
  });
});






