// File: test/backend/api/biometricsApi.test.mjs

/**
 * @fileoverview Tests for biometric API endpoints
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as biometricsApi from '../../src/backend/api/biometricsApi.mjs';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';
import * as biometricVerifier from '../../src/backend/biometrics/biometricVerifier.mjs';
import * as featureExtractor from '../../src/backend/biometrics/faceAPIExtractor.mjs';
import * as authService from '../../src/backend/auth/core/authService.mjs';
import * as userIdentityService from '../../src/backend/security/userIdentityService.mjs';

// Module mocks
vi.mock('../../src/backend/biometrics/biometricVerifier.mjs', () => ({
  storeBiometricTemplate: vi.fn(),
  verifyBiometricMatch: vi.fn(),
  getBiometricTemplate: vi.fn()
}));

vi.mock('../../src/backend/biometrics/faceAPIExtractor.mjs', () => ({
  extractBiometricFeatures: vi.fn()
}));

vi.mock('../../src/backend/auth/core/authService.mjs', () => ({
  default: {
    addAuthFactor: vi.fn(),
    getAuthenticationStatus: vi.fn(),
    verifyFactorChain: vi.fn(),
    elevateAuthentication: vi.fn()
  },
  addAuthFactor: vi.fn(),
  getAuthenticationStatus: vi.fn(),
  verifyFactorChain: vi.fn(),
  elevateAuthentication: vi.fn()
}));

vi.mock('../../src/backend/security/userIdentityService.mjs', () => ({
  clearReverificationFlag: vi.fn(),
  checkReverificationNeeded: vi.fn()
}));

// Mock file system operations and other internals
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(),
    writeFile: vi.fn().mockResolvedValue(),
    access: vi.fn().mockResolvedValue(),
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
    open: vi.fn().mockResolvedValue({
      write: vi.fn().mockResolvedValue(),
      close: vi.fn().mockResolvedValue()
    }),
    unlink: vi.fn().mockResolvedValue()
  },
  mkdir: vi.fn().mockResolvedValue(),
  writeFile: vi.fn().mockResolvedValue(),
  access: vi.fn().mockResolvedValue(),
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
  open: vi.fn().mockResolvedValue({
    write: vi.fn().mockResolvedValue(),
    close: vi.fn().mockResolvedValue()
  }),
  unlink: vi.fn().mockResolvedValue()
}));

vi.mock('fs', () => ({
  default: {
    constants: {
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1
    }
  },
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
  }
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123')
}));

vi.mock('../../src/backend/eventBus-service/index.mjs', () => ({
  eventBus: {
    emit: vi.fn()
  }
}));

vi.mock('../../src/backend/middleware/errorHandler.mjs', () => ({
  asyncHandler: (fn) => fn // In tests, just return the function without wrapping
}));

describe('Biometrics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
  describe('enrollBiometric', () => {
    it('should successfully enroll biometric data', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          biometricData: 'sample-biometric-data',
          source: 'enrollment'
        },
        user: { id: 'user123' }
      });      const res = createMockResponse();
      
      // Mock implementation - return features that match what storeBiometricTemplate expects
      featureExtractor.extractBiometricFeatures.mockResolvedValue({
        featureHash: 'biometric-hash-123',
        metadata: { 
          captureTime: Date.now(),
          faceConfidence: 0.95,
          qualityScore: 0.8
        }
      });
      
      biometricVerifier.storeBiometricTemplate.mockResolvedValue(true);
      authService.default.addAuthFactor.mockResolvedValue(true);
      
      // Act
      await biometricsApi.enrollBiometric(req, res);
        // Assert
      expect(featureExtractor.extractBiometricFeatures).toHaveBeenCalledWith(expect.any(String));
      expect(biometricVerifier.storeBiometricTemplate).toHaveBeenCalledWith(
        'user123', 
        expect.objectContaining({
          featureHash: 'biometric-hash-123'
        }),
        expect.objectContaining({
          source: 'enrollment'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should return 400 when biometric data is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {},
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Act
      await biometricsApi.enrollBiometric(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('should return 500 when feature extraction fails', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          biometricData: 'sample-biometric-data',
          source: 'enrollment'
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementation for failure
      featureExtractor.extractBiometricFeatures.mockRejectedValue(new Error('Feature extraction failed'));
      
      // Act
      await biometricsApi.enrollBiometric(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });
  describe('verifyBiometric', () => {
    it('should successfully verify biometric data', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          biometricData: 'sample-biometric-data'
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementations
      featureExtractor.extractBiometricFeatures.mockResolvedValue({
        featureHash: 'biometric-hash-123',
        metadata: { 
          captureTime: Date.now(),
          faceConfidence: 0.95,
          qualityScore: 0.8
        }
      });
        authService.default.verifyFactorChain.mockResolvedValue({
        success: true,
        authState: { elevated: true }
      });
      
      authService.default.elevateAuthentication.mockResolvedValue(true);
      
      // Act
      await biometricsApi.verifyBiometric(req, res);
      
      // Assert
      expect(featureExtractor.extractBiometricFeatures).toHaveBeenCalledWith(expect.any(String));      expect(authService.default.verifyFactorChain).toHaveBeenCalled();
      expect(authService.default.elevateAuthentication).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Biometric verification successful'
      }));
    });
    
    it('should return failure when biometric data does not match', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          biometricData: 'sample-biometric-data'
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementations
      featureExtractor.extractBiometricFeatures.mockResolvedValue({
        featureHash: 'biometric-hash-123',
        metadata: { 
          captureTime: Date.now(),
          faceConfidence: 0.95,
          qualityScore: 0.8
        }
      });      authService.default.verifyFactorChain.mockResolvedValue({
        success: false,
        details: 'Biometric verification failed'
      });
      
      // Act
      await biometricsApi.verifyBiometric(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Biometric verification failed'
      }));
    });

    it('should return 400 when biometric data is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {},
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Act
      await biometricsApi.verifyBiometric(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });
  });

  describe('checkReverificationStatus', () => {
    it('should return true when reverification is needed', async () => {
      // Arrange
      const req = createMockRequest({
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementations
      userIdentityService.checkReverificationNeeded.mockResolvedValue(true);
      
      // Act
      await biometricsApi.checkReverificationStatus(req, res);
      
      // Assert
      expect(userIdentityService.checkReverificationNeeded).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reverificationNeeded: true
      }));
    });

    it('should return false when reverification is not needed', async () => {
      // Arrange
      const req = createMockRequest({
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementations
      userIdentityService.checkReverificationNeeded.mockResolvedValue(false);
      
      // Act
      await biometricsApi.checkReverificationStatus(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reverificationNeeded: false
      }));
    });
  });
});







