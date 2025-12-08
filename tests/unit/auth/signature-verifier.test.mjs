// File: test/backend/auth/signatureVerifier.test.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger implementation
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => {
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
  
  return {
    default: mockLogger,
    mockChildLogger,
    mockLogger
  };
});

vi.mock('crypto', () => {
  const mockCrypto = {
    createVerify: vi.fn(),
    verify: vi.fn(),
    randomBytes: vi.fn()
  };
  
  return {
    default: mockCrypto,
    ...mockCrypto
  };
});

// Now import the module under test
import crypto from 'crypto';
import logger, { mockChildLogger } from '../../../src/backend/utils/logging/logger.mjs';
const signatureVerifierModule = await import('../../../src/backend/auth/utils/signatureVerifier.mjs');
const signatureVerifier = signatureVerifierModule.default;

describe('SignatureVerifier Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Ensure logger.child returns our mock consistently
    vi.mocked(logger.child).mockReturnValue(mockChildLogger);
    
    // Setup default crypto mock behaviors
    const mockVerify = {
      update: vi.fn(),
      verify: vi.fn(() => true)
    };
    vi.mocked(crypto.createVerify).mockReturnValue(mockVerify);
    vi.mocked(crypto.verify).mockReturnValue(true);
    vi.mocked(crypto.randomBytes).mockReturnValue(Buffer.from('test-random-bytes'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyLoginChallenge', () => {
    it('should verify valid ECDSA signature successfully', () => {
      // Arrange
      const publicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----';
      const signature = 'dGVzdC1zaWduYXR1cmU='; // base64 encoded "test-signature"
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(true);
      expect(vi.mocked(crypto).createVerify).toHaveBeenCalledWith('SHA256');
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Signature verification successful',
        { scheme: 'ecdsa' }
      );
    });

    it('should verify valid Ed25519 signature successfully', () => {
      // Arrange
      const publicKey = 'dGVzdC1wdWJsaWMta2V5'; // base64 encoded
      const signature = 'dGVzdC1zaWduYXR1cmU='; // base64 encoded
      const nonce = 'test-nonce';
      const scheme = 'ed25519';
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(true);
      expect(vi.mocked(crypto).verify).toHaveBeenCalledWith(
        null,
        expect.any(Buffer),
        expect.objectContaining({
          key: expect.any(Buffer),
          format: 'raw',
          type: 'ed25519'
        }),
        expect.any(Buffer)
      );
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Signature verification successful',
        { scheme: 'ed25519' }
      );
    });

    it('should return false for missing parameters', () => {
      // Act & Assert
      expect(signatureVerifier.verifyLoginChallenge(null, 'signature', 'nonce')).toBe(false);
      expect(signatureVerifier.verifyLoginChallenge('publicKey', null, 'nonce')).toBe(false);
      expect(signatureVerifier.verifyLoginChallenge('publicKey', 'signature', null)).toBe(false);
      
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Missing required parameters for signature verification'
      );
    });

    it('should return false for unsupported signature scheme', () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'test-signature';
      const nonce = 'test-nonce';
      const scheme = 'rsa'; // unsupported
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);
      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'Unsupported signature scheme',
        { scheme: 'rsa' }
      );
    });

    it('should handle ECDSA verification failure', () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'invalid-signature';
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      // Mock verification to return false
      const mockVerify = {
        update: vi.fn(),
        verify: vi.fn(() => false)
      };
      vi.mocked(crypto).createVerify.mockReturnValue(mockVerify);
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Signature verification failed',
        { scheme: 'ecdsa' }
      );
    });

    it('should handle Ed25519 verification failure', () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'invalid-signature';
      const nonce = 'test-nonce';
      const scheme = 'ed25519';
      
      vi.mocked(crypto).verify.mockReturnValue(false);
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Signature verification failed',
        { scheme: 'ed25519' }
      );
    });

    it('should handle verification errors gracefully', () => {
      // Arrange
      const publicKey = 'test-public-key';
      const signature = 'test-signature';
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      vi.mocked(crypto).createVerify.mockImplementation(() => {
        throw new Error('Crypto error');
      });
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'ECDSA verification error',
        expect.objectContaining({
          error: 'Crypto error'
        })
      );
    });

    it('should format ECDSA public key correctly when missing headers', () => {
      // Arrange
      const publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...'; // without PEM headers
      const signature = 'dGVzdC1zaWduYXR1cmU=';
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      const mockVerify = {
        update: vi.fn(),
        verify: vi.fn((key, signatureBuffer) => {
          // Verify the key was formatted correctly
          expect(key).toContain('-----BEGIN PUBLIC KEY-----');
          expect(key).toContain('-----END PUBLIC KEY-----');
          return true;
        })
      };
      vi.mocked(crypto).createVerify.mockReturnValue(mockVerify);
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(true);
      expect(mockVerify.verify).toHaveBeenCalled();
    });

    it('should use ECDSA scheme by default', () => {
      // Arrange
      const publicKey = '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----';
      const signature = 'dGVzdC1zaWduYXR1cmU=';
      const nonce = 'test-nonce';
      // No scheme parameter provided
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce);
      
      // Assert
      expect(result).toBe(true);
      expect(vi.mocked(crypto).createVerify).toHaveBeenCalledWith('SHA256');
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Signature verification successful',
        { scheme: 'ecdsa' }
      );
    });
  });

  describe('generateChallenge', () => {
    it('should generate a random challenge nonce', () => {
      // Arrange
      const mockBuffer = Buffer.from('random-bytes-32-chars-long-test');
      vi.mocked(crypto).randomBytes.mockReturnValue(mockBuffer);
      
      // Act
      const challenge = signatureVerifier.generateChallenge();
      
      // Assert
      expect(challenge).toBe(mockBuffer.toString('base64'));
      expect(vi.mocked(crypto).randomBytes).toHaveBeenCalledWith(32);
    });

    it('should generate different challenges on multiple calls', () => {
      // Arrange
      vi.mocked(crypto).randomBytes
        .mockReturnValueOnce(Buffer.from('first-random-bytes'))
        .mockReturnValueOnce(Buffer.from('second-random-bytes'));
      
      // Act
      const challenge1 = signatureVerifier.generateChallenge();
      const challenge2 = signatureVerifier.generateChallenge();
      
      // Assert
      expect(challenge1).not.toBe(challenge2);
      expect(vi.mocked(crypto).randomBytes).toHaveBeenCalledTimes(2);
    });
  });

  describe('verify method (alias)', () => {
    it('should be an alias for verifyLoginChallenge', () => {
      // Arrange
      const publicKey = '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----';
      const signature = 'dGVzdC1zaWduYXR1cmU=';
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      // Act
      const result = signatureVerifier.verify(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(true);
      expect(vi.mocked(crypto).createVerify).toHaveBeenCalledWith('SHA256');
    });
  });

  describe('error handling for ECDSA verification', () => {
    it('should handle ECDSA verification crypto errors', () => {
      // Arrange
      const publicKey = 'invalid-key-format';
      const signature = 'dGVzdC1zaWduYXR1cmU=';
      const nonce = 'test-nonce';
      const scheme = 'ecdsa';
      
      const mockVerify = {
        update: vi.fn(),
        verify: vi.fn(() => {
          throw new Error('Invalid key format');
        })
      };
      vi.mocked(crypto).createVerify.mockReturnValue(mockVerify);
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'ECDSA verification error',
        expect.objectContaining({
          error: 'Invalid key format'
        })
      );
    });
  });

  describe('error handling for Ed25519 verification', () => {
    it('should handle Ed25519 verification crypto errors', () => {
      // Arrange
      const publicKey = 'invalid-base64-key';
      const signature = 'invalid-base64-signature';
      const nonce = 'test-nonce';
      const scheme = 'ed25519';
      
      vi.mocked(crypto).verify.mockImplementation(() => {
        throw new Error('Invalid base64 encoding');
      });
      
      // Act
      const result = signatureVerifier.verifyLoginChallenge(publicKey, signature, nonce, scheme);
      
      // Assert
      expect(result).toBe(false);      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'Ed25519 verification error',
        expect.objectContaining({
          error: 'Invalid base64 encoding'
        })
      );
    });
  });
});






