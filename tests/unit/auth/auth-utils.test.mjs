/**
 * @fileoverview Tests for AuthUtils
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger implementation
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => {
  const mockChildLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  };
  
  return {
    default: {
      child: vi.fn(() => mockChildLogger),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    }
  };
});

// Mock crypto with inline implementations
vi.mock('crypto', () => {
  const mockCrypto = {
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    })
  };
  
  return {
    default: mockCrypto,
    ...mockCrypto
  };
});

// Mock jsonwebtoken with inline implementations
vi.mock('jsonwebtoken', () => {
  const mockJwt = {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({
      userId: 'test-user-id',
      publicKey: 'test-public-key',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    }))
  };
  
  return {
    default: mockJwt,
    ...mockJwt
  };
});

// Import modules AFTER mocks are defined
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../../../src/backend/utils/logging/logger.mjs';
import {
  generateToken,
  verifyToken,
  verifyAuthToken,
  extractTokenFromRequest,
  generateAuthChallenge
} from '../../../src/backend/auth/utils/authUtils.mjs';

// Get the mocked logger for testing
const mockLogger = vi.mocked(logger);
const mockChildLogger = mockLogger.child();

describe('AuthUtils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset environment variables
    delete process.env.JWT_SECRET;
    
    // Setup default mock behaviors using vi.mocked()
    vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token');
    vi.mocked(jwt.verify).mockReturnValue({
      userId: 'test-user-id',
      publicKey: 'test-public-key',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    });
    
    // Setup crypto mock behaviors
    vi.mocked(crypto.randomUUID).mockReturnValue('test-uuid-123');
    vi.mocked(crypto.getRandomValues).mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a JWT token with user data', () => {
      // Arrange
      const userData = {
        userId: 'test-user-123',
        publicKey: 'test-public-key-data'
      };
      const authState = {
        authLevel: 2,
        factors: { signature: true, biometric: true },
        sessionId: 'test-session-123'
      };

      // Act
      const result = generateToken(userData, authState);

      // Assert
      expect(result).toBe('mock-jwt-token');
      expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          publicKey: 'test-public-key-data',
          authLevel: 2,
          factors: { signature: true, biometric: true },
          sessionId: 'test-session-123',
          iat: expect.any(Number),
          exp: expect.any(Number)
        }),
        'default-development-secret'
      );
    });

    it('should use default auth state when not provided', () => {
      // Arrange
      const userData = {
        userId: 'test-user-123',
        publicKey: 'test-public-key-data'
      };

      // Act
      generateToken(userData);

      // Assert
      expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          publicKey: 'test-public-key-data',
          authLevel: 1,
          factors: {},
          sessionId: 'test-uuid-123'
        }),
        'default-development-secret'
      );
    });

    it('should use JWT_SECRET from environment when available', () => {
      // Arrange
      process.env.JWT_SECRET = 'custom-secret-key';
      const userData = { userId: 'test-user', publicKey: 'test-key' };

      // Act
      generateToken(userData);

      // Assert
      expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(
        expect.any(Object),
        'custom-secret-key'
      );
    });

    it('should handle userData with id field instead of userId', () => {
      // Arrange
      const userData = {
        id: 'test-user-123',
        publicKey: 'test-public-key-data'
      };

      // Act
      generateToken(userData);

      // Assert
      expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123'
        }),
        expect.any(String)
      );
    });

    it('should throw error when userData is missing', () => {
      // Act & Assert
      expect(() => generateToken(null)).toThrow('User data is required');
      expect(() => generateToken(undefined)).toThrow('User data is required');
    });

    it('should log and rethrow JWT signing errors', () => {
      // Arrange
      const userData = { userId: 'test-user', publicKey: 'test-key' };
      const jwtError = new Error('JWT signing failed');
      vi.mocked(jwt.sign).mockImplementation(() => {
        throw jwtError;
      });
      
      // Act & Assert
      expect(() => generateToken(userData)).toThrow('JWT signing failed');
      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'Token generation failed',
        expect.objectContaining({
          error: 'JWT signing failed',
          stack: expect.any(String)
        })
      );
    });

    it('should set correct token expiration (24 hours)', () => {
      // Arrange
      const userData = { userId: 'test-user', publicKey: 'test-key' };
      const now = Math.floor(Date.now() / 1000);

      // Act
      generateToken(userData);

      // Assert
      const callArgs = vi.mocked(jwt.sign).mock.calls[0][0];
      expect(callArgs.exp).toBe(callArgs.iat + (24 * 60 * 60));
      expect(callArgs.iat).toBeCloseTo(now, 1);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid JWT token', () => {
      // Arrange
      const token = 'valid-jwt-token';
      const expectedPayload = {
        userId: 'test-user-id',
        publicKey: 'test-public-key',
        authLevel: 2
      };
      vi.mocked(jwt.verify).mockReturnValue(expectedPayload);

      // Act
      const result = verifyToken(token);

      // Assert
      expect(result).toEqual(expectedPayload);
      expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(token, 'default-development-secret');
    });

    it('should use JWT_SECRET from environment when available', () => {
      // Arrange
      process.env.JWT_SECRET = 'custom-verification-secret';
      const token = 'valid-jwt-token';

      // Act
      verifyToken(token);

      // Assert
      expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(token, 'custom-verification-secret');
    });

    it('should return null for invalid token', () => {
      // Arrange
      const token = 'invalid-jwt-token';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = verifyToken(token);

      // Assert
      expect(result).toBeNull();
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        { error: 'Invalid token' }
      );
    });

    it('should throw error for missing token', () => {
      // Act & Assert
      expect(() => verifyToken(null)).toThrow('No token provided');
      expect(() => verifyToken('')).toThrow('No token provided');
      expect(() => verifyToken(undefined)).toThrow('No token provided');
    });

    it('should handle expired token gracefully', () => {
      // Arrange
      const token = 'expired-jwt-token';
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw expiredError;
      });

      // Act
      const result = verifyToken(token);

      // Assert
      expect(result).toBeNull();
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        { error: 'jwt expired' }
      );
    });

    it('should handle malformed token gracefully', () => {
      // Arrange
      const token = 'malformed-jwt-token';
      const malformedError = new Error('jwt malformed');
      malformedError.name = 'JsonWebTokenError';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw malformedError;
      });

      // Act
      const result = verifyToken(token);

      // Assert
      expect(result).toBeNull();
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        { error: 'jwt malformed' }
      );
    });
  });

  describe('verifyAuthToken', () => {
    it('should be an alias for verifyToken', () => {
      // Arrange
      const token = 'test-token';
      const expectedPayload = { userId: 'test-user' };
      vi.mocked(jwt.verify).mockReturnValue(expectedPayload);

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toEqual(expectedPayload);
      expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(token, 'default-development-secret');
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer test-token-123'
        },
        cookies: {},
        query: {}
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBe('test-token-123');
    });

    it('should extract token from cookies', () => {
      // Arrange
      const req = {
        headers: {},
        cookies: {
          auth_token: 'cookie-token-456'
        },
        query: {}
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBe('cookie-token-456');
    });

    it('should extract token from query params', () => {
      // Arrange
      const req = {
        headers: {},
        cookies: {},
        query: {
          token: 'query-token-789'
        }
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBe('query-token-789');
    });

    it('should prioritize Authorization header over cookies', () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer header-token'
        },
        cookies: {
          auth_token: 'cookie-token'
        },
        query: {}
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBe('header-token');
    });

    it('should prioritize cookies over query params', () => {
      // Arrange
      const req = {
        headers: {},
        cookies: {
          auth_token: 'cookie-token'
        },
        query: {
          token: 'query-token'
        }
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBe('cookie-token');
    });

    it('should return null when no token is found', () => {
      // Arrange
      const req = {
        headers: {},
        cookies: {},
        query: {}
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'InvalidFormat token-123'
        },
        cookies: {},
        query: {}
      };

      // Act
      const result = extractTokenFromRequest(req);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle missing request properties gracefully', () => {
      // Arrange & Act & Assert
      expect(extractTokenFromRequest({ cookies: {}, query: {} })).toBeNull();
      expect(extractTokenFromRequest({ headers: {}, query: {} })).toBeNull();
      expect(extractTokenFromRequest({ headers: {}, cookies: {} })).toBeNull();
      expect(extractTokenFromRequest({})).toBeNull();
      expect(extractTokenFromRequest(null)).toBeNull();
    });
  });

  describe('generateAuthChallenge', () => {
    it('should generate challenge with default length', () => {
      // Act
      const challenge = generateAuthChallenge();

      // Assert
      expect(typeof challenge).toBe('string');
      expect(challenge).toMatch(/^[A-Za-z0-9]+$/);
      expect(challenge).toHaveLength(32);
    });

    it('should generate challenge with custom length', () => {
      // Act
      const challenge = generateAuthChallenge(64);

      // Assert
      expect(challenge).toHaveLength(64);
    });

    it('should generate different challenges on multiple calls', () => {
      // Arrange
      vi.mocked(crypto.getRandomValues)
        .mockImplementationOnce((array) => {
          for (let i = 0; i < array.length; i++) array[i] = i % 256;
          return array;
        })
        .mockImplementationOnce((array) => {
          for (let i = 0; i < array.length; i++) array[i] = (i + 128) % 256;
          return array;
        });

      // Act
      const challenge1 = generateAuthChallenge();
      const challenge2 = generateAuthChallenge();

      // Assert
      expect(challenge1).not.toEqual(challenge2);
    });

    it('should handle edge case lengths', () => {
      // Act & Assert
      expect(generateAuthChallenge(1)).toHaveLength(1);
      expect(generateAuthChallenge(0)).toHaveLength(0);
    });

    it('should use crypto.getRandomValues for randomness', () => {
      // Act
      generateAuthChallenge();

      // Assert
      expect(vi.mocked(crypto.getRandomValues)).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should only use alphanumeric characters', () => {
      // Act
      const challenge = generateAuthChallenge(100);

      // Assert
      expect(challenge).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete token lifecycle', () => {
      // Arrange
      const userData = {
        userId: 'integration-user',
        publicKey: 'integration-public-key'
      };
      const authState = {
        authLevel: 3,
        factors: { signature: true, biometric: true, deviceAttestation: true }
      };

      // Mock JWT to return the payload we pass in
      vi.mocked(jwt.sign).mockReturnValue('integration-token');
      vi.mocked(jwt.verify).mockImplementation((token, secret) => {
        if (token === 'integration-token') {
          return {
            userId: userData.userId,
            publicKey: userData.publicKey,
            authLevel: authState.authLevel,
            factors: authState.factors,
            sessionId: expect.any(String),
            iat: expect.any(Number),
            exp: expect.any(Number)
          };
        }
        throw new Error('Invalid token');
      });

      // Act - Generate token
      const token = generateToken(userData, authState);
      
      // Act - Verify token
      const verified = verifyToken(token);

      // Assert
      expect(token).toBe('integration-token');
      expect(verified.userId).toBe('integration-user');
      expect(verified.authLevel).toBe(3);
      expect(verified.factors).toEqual(authState.factors);
    });

    it('should handle token extraction and verification workflow', () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer workflow-token'
        },
        cookies: {},
        query: {}
      };

      vi.mocked(jwt.verify).mockReturnValue({
        userId: 'workflow-user',
        publicKey: 'workflow-key'
      });

      // Act
      const extractedToken = extractTokenFromRequest(mockReq);
      const verifiedPayload = verifyToken(extractedToken);

      // Assert
      expect(extractedToken).toBe('workflow-token');
      expect(verifiedPayload.userId).toBe('workflow-user');
    });
  });
});






