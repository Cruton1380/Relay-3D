// File: test/backend/auth/authService.test.mjs

/**
 * @fileoverview Tests for the auth service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies at the top level first
const mockSessionManager = {
  createSession: vi.fn(),
  getSession: vi.fn(),
  deleteSession: vi.fn(),
  destroySession: vi.fn(),
  extendSession: vi.fn()
};

const mockSignatureVerifier = {
  verify: vi.fn()
};

const mockFailureTracker = {
  isLocked: vi.fn(),
  recordFailure: vi.fn(),
  clearFailures: vi.fn()
};

const mockAuthUtils = {
  generateToken: vi.fn(),
  verifyToken: vi.fn()
};

const mockChildLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

const mockLogger = {
  child: vi.fn(() => mockChildLogger),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

// Setup module mocks
vi.mock('../../../src/backend/auth/core/sessionManager.mjs', () => ({
  default: mockSessionManager
}));

vi.mock('../../../src/backend/auth/utils/signatureVerifier.mjs', () => ({
  default: mockSignatureVerifier
}));

vi.mock('../../../src/backend/auth/utils/failureTracker.mjs', () => ({
  default: mockFailureTracker
}));

vi.mock('../../../src/backend/auth/utils/authUtils.mjs', () => mockAuthUtils);

vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

vi.mock('../../../src/backend/event-bus/index.mjs', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn()
  }
}));

// Now import the module under test
const authService = await import('../../../src/backend/auth/core/authService.mjs');

describe('Auth Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Set up default mock behaviors
    mockSessionManager.createSession.mockReturnValue({ sessionId: 'test-session' });    mockSessionManager.getSession.mockReturnValue({ 
      user: { userId: 'test-user' },
      isExpired: () => false
    });
    mockSessionManager.deleteSession.mockReturnValue(true);
    mockSessionManager.destroySession.mockReturnValue({ success: true });
    
    mockSignatureVerifier.verify.mockReturnValue(true);
    
    mockFailureTracker.isLocked.mockReturnValue(false);
    mockFailureTracker.recordFailure.mockReturnValue(undefined);
    mockFailureTracker.clearFailures.mockReturnValue(undefined);
    
    mockAuthUtils.generateToken.mockReturnValue('mock-token');
    mockAuthUtils.verifyToken.mockReturnValue({ userId: 'test-user', sessionId: 'test-session' });
  });

  describe('authenticateWithSignature', () => {
    it('should authenticate with valid signature', async () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'valid-signature';
      const challenge = 'test-challenge';
      
      // Act
      const result = await authService.default.authenticateWithSignature(publicKey, signature, challenge);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(result.user).toBeDefined();
    });
    
    it('should fail authentication with invalid signature', async () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'invalid-signature';
      const challenge = 'test-challenge';
      
      // Mock signature verification to fail
      mockSignatureVerifier.verify.mockReturnValue(false);
      
      // Act
      const result = await authService.default.authenticateWithSignature(publicKey, signature, challenge);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });
  });
  
  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      // Arrange
      const token = 'valid-token';
      
      // Act
      const result = await authService.default.validateToken(token);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });
    
    it('should reject an invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      
      // Mock token verification to fail
      mockAuthUtils.verifyToken.mockReturnValue(null);
      
      // Act
      const result = await authService.default.validateToken(token);
      
      // Assert
      expect(result.valid).toBe(false);
    });
  });
  
  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const sessionId = 'test-session';
      
      // Act
      const result = await authService.default.logout(sessionId);
        // Assert
      expect(result.success).toBe(true);
      expect(mockSessionManager.destroySession).toHaveBeenCalledWith(sessionId);
    });
  });
});






