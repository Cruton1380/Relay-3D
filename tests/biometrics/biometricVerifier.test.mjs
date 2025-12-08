// test/backend/biometrics/biometricVerifier.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  findSimilarBiometricHash,
  assessBiometricQuality,
  storeBiometricTemplate
} from '../../src/backend/biometrics/biometricVerifier.mjs';

// Mock dependencies
vi.mock('../../src/backend/biometrics/biometricTemplateStore.mjs', () => ({
  default: {
    findSimilarTemplates: vi.fn(),
    addTemplate: vi.fn(),
    getTemplateByUserId: vi.fn(),
    deleteTemplate: vi.fn()
  }
}));

vi.mock('../../src/backend/biometrics/featureExtractor.mjs', () => ({
  extractBiometricFeatures: vi.fn()
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }))
  }
}));

vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.statusCode = type === 'validation' ? 400 : 500;
    return error;
  })
}));

// Import mocked modules to use in tests
import biometricTemplateStore from '../../src/backend/biometrics/biometricTemplateStore.mjs';
import { extractBiometricFeatures } from '../../src/backend/biometrics/featureExtractor.mjs';

describe('Biometric Verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('findSimilarBiometricHash', () => {
    it('should find a similar hash when available', async () => {
      // Arrange
      const testFeatures = { featureHash: 'feature-hash-123', metadata: {} };
      const similarTemplates = [{ userId: 'user123', similarity: 0.92 }];
      
      extractBiometricFeatures.mockResolvedValueOnce(testFeatures);
      biometricTemplateStore.findSimilarTemplates.mockResolvedValueOnce(similarTemplates);
      
      // Act
      const result = await findSimilarBiometricHash('biometric-hash-123');
      
      // Assert
      expect(result).toBe('user123');
      expect(extractBiometricFeatures).toHaveBeenCalledWith('biometric-hash-123');
      expect(biometricTemplateStore.findSimilarTemplates).toHaveBeenCalledWith(
        testFeatures, 
        0.85 // default threshold
      );
    });
    
    it('should return null when no similar hash is found', async () => {
      // Arrange
      extractBiometricFeatures.mockResolvedValueOnce({ featureHash: 'feature-hash-123', metadata: {} });
      biometricTemplateStore.findSimilarTemplates.mockResolvedValueOnce([]);
      
      // Act
      const result = await findSimilarBiometricHash('biometric-hash-123');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle errors during processing', async () => {
      // Arrange
      extractBiometricFeatures.mockRejectedValueOnce(new Error('Feature extraction failed'));
      
      // Act & Assert
      await expect(findSimilarBiometricHash('biometric-hash-123'))
        .rejects.toThrow('Biometric comparison failed');
    });
  });
    describe('assessBiometricQuality', () => {
    it('should return acceptable quality for good biometrics', async () => {
      // Arrange
      extractBiometricFeatures.mockResolvedValueOnce({
        metadata: { qualityScore: 0.8 }
      });
      
      // No need to mock any private function as the result is directly returned from the metadata
      
      // Act
      const result = await assessBiometricQuality('biometric-hash-123');
      
      // Assert
      expect(result.acceptable).toBe(true);
      expect(result.score).toBe(0.8);
      expect(result.issues).toBeUndefined();
    });
    
    it('should report issues for poor quality biometrics', async () => {
      // Arrange
      extractBiometricFeatures.mockResolvedValueOnce({
        metadata: { qualityScore: 0.4 }
      });
      
      // Mock the private calculateQualityScore function
      vi.spyOn(global, 'calculateQualityScore').mockReturnValueOnce(0.4);
      
      // Act
      const result = await assessBiometricQuality('biometric-hash-123');
      
      // Assert
      expect(result.acceptable).toBe(false);
      expect(result.score).toBe(0.4);
      expect(result.issues).toContain('Low quality biometric features');
    });
  });
  
  describe('storeBiometricTemplate', () => {
    it('should store a biometric template successfully', async () => {
      // Arrange
      const userId = 'user123';
      const biometricHash = 'biometric-hash-123';
      const features = { featureHash: 'feature-hash-123', metadata: {} };
      
      extractBiometricFeatures.mockResolvedValueOnce(features);
      biometricTemplateStore.addTemplate.mockResolvedValueOnce(true);
      
      // Act
      await storeBiometricTemplate(userId, biometricHash);
      
      // Assert
      expect(biometricTemplateStore.addTemplate).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        features,
        hash: biometricHash
      }));
    });
    
    it('should handle storage errors gracefully', async () => {
      // Arrange
      extractBiometricFeatures.mockResolvedValueOnce({});
      biometricTemplateStore.addTemplate.mockRejectedValueOnce(new Error('Storage error'));
      
      // Act & Assert
      await expect(storeBiometricTemplate('user123', 'biometric-hash-123'))
        .rejects.toThrow('Failed to store biometric template');
    });
  });
});






