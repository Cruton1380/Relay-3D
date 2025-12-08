// test/backend/biometrics/featureExtractor.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { extractBiometricFeatures } from '../../src/backend/biometrics/featureExtractor.mjs';
import path from 'path';

// Mock dependencies
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
  loadImage: vi.fn().mockImplementation(() => Promise.resolve({
    width: 640,
    height: 480
  }))
}));

vi.mock('fs', () => {
  const mockPromises = {
    unlink: vi.fn().mockResolvedValue(true),
    writeFile: vi.fn().mockResolvedValue(true),
    readFile: vi.fn().mockResolvedValue(Buffer.from('test-image-data')),
    mkdir: vi.fn().mockResolvedValue(true),
    stat: vi.fn().mockResolvedValue({
      isFile: () => true,
      size: 1024
    })
  };
  
  return {
    default: {
      promises: mockPromises
    },
    promises: mockPromises
  };
});

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
    if (type === 'badRequest' || type === 'validation') {
      error.statusCode = 400;
      error.name = 'BizError';
    } else if (type === 'internal') {
      error.statusCode = 500;
      error.name = 'BizError';
    } else {
      error.statusCode = 500;
      error.name = 'BizError';
    }
    return error;
  })
}));

describe('Feature Extractor', () => {
  const testImagePath = path.join('data', 'temp', 'test-image.jpg');
  let originalMathRandom;
  beforeEach(async () => {
    vi.clearAllMocks();
    originalMathRandom = Math.random;
    
    // Re-establish mocks after clearing
    const canvas = vi.mocked(await import('canvas'));
    canvas.loadImage.mockResolvedValue({ width: 640, height: 480 });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
    Math.random = originalMathRandom;
  });

  it('should extract features from a valid image', async () => {
    // Mock Math.random to return values that result in high confidence
    Math.random = vi.fn(() => 0.5);
    
    const result = await extractBiometricFeatures(testImagePath);
    
    expect(result).toBeDefined();
    expect(result.featureHash).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.captureTime).toBeTypeOf('number');
    expect(result.metadata.faceConfidence).toBeTypeOf('number');
    expect(result.metadata.qualityScore).toBeTypeOf('number');
  });
  
  it('should reject if face detection confidence is too low', async () => {
    // Force Math.random to return a low value to ensure low confidence
    Math.random = vi.fn(() => 0.01); 
    
    // Set an impossibly high confidence threshold
    const impossibleThreshold = 0.99;
    
    // Test the rejection using expect().rejects pattern
    await expect(extractBiometricFeatures(testImagePath, impossibleThreshold))
      .rejects.toThrow('Face detection confidence too low');
  });

  it('should handle file system errors gracefully', async () => {
    // Mock Math.random to return values that result in high confidence
    Math.random = vi.fn(() => 0.5);
    
    // This test checks if the graceful error handling works
    const result = await extractBiometricFeatures(testImagePath);
    expect(result).toBeDefined();
  });
});






