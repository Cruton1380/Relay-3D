// test/backend/biometrics/feature-extractor-confidence-only.test.mjs
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractBiometricFeatures } from '../../src/backend/biometrics/featureExtractor.mjs';
import path from 'path';

// Mock dependencies with stable implementations
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    width: 640, 
    height: 480,
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(640 * 480 * 4).fill(128),
        width: 640, 
        height: 480
      }))
    }))
  })),
  loadImage: vi.fn(() => Promise.resolve({ width: 640, height: 480 }))
}));

vi.mock('fs', () => {
  const mockPromises = {
    unlink: vi.fn().mockResolvedValue(true),
    readFile: vi.fn().mockResolvedValue(Buffer.from('test-image-data'))
  };
  return { promises: mockPromises, default: { promises: mockPromises } };
});

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: { child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })) }
}));

vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.name = 'BizError';
    error.statusCode = type === 'validation' ? 400 : 500;
    return error;
  })
}));

describe('Feature Extractor Confidence Test', () => {
  const testImagePath = path.join('data', 'temp', 'test-image.jpg');
  let originalMathRandom;
  
  beforeEach(() => {
    vi.clearAllMocks();
    originalMathRandom = Math.random;
  });
  
  afterEach(() => {
    Math.random = originalMathRandom;
  });

  it('should succeed with high confidence values', async () => {
    // Mock Math.random to always return high values that result in high confidence
    Math.random = vi.fn(() => 0.9);
    
    const result = await extractBiometricFeatures(testImagePath, 0.6);
    expect(result).toBeDefined();
    expect(result.featureHash).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.faceConfidence).toBeGreaterThan(0.6);
  });
  
  it('should throw error when confidence is too low', async () => {
    // Strategy: Use a very high threshold that will be impossible to meet
    // Even with good mocking, base confidence is 0.85 + Math.random() * 0.13
    // With Math.random() = 1, max confidence is 0.98
    // So use threshold of 0.99 to guarantee failure
    Math.random = vi.fn(() => 0.0); // This gives minimum confidence
    
    await expect(extractBiometricFeatures(testImagePath, 0.99))
      .rejects
      .toThrow('Face detection confidence too low');
  });
});






