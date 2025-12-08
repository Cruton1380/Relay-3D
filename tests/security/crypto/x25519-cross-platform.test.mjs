/**
 * Cross-Platform Entropy and Browser Compatibility Test
 */

import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '@stablelib/x25519';

describe('Cross-Platform Compatibility', () => {
  describe('Entropy Source Validation', () => {    it('should have access to secure random source', async () => {
      // Check that we have access to crypto randomness
      if (typeof window !== 'undefined') {
        // Browser environment
        expect(window.crypto).toBeDefined();
        expect(window.crypto.getRandomValues).toBeDefined();
      } else {
        // Node.js environment  
        const crypto = await import('crypto');
        expect(crypto.default.randomBytes).toBeDefined();
      }
    });

    it('should generate high-entropy keys', () => {
      const samples = [];
      
      // Generate multiple keys and check for patterns
      for (let i = 0; i < 20; i++) {
        const keyPair = generateKeyPair();
        samples.push(keyPair.publicKey);
      }

      // Test statistical randomness properties
      const allBytes = samples.flat();
      const byteFrequencies = new Array(256).fill(0);
      
      allBytes.forEach(byte => byteFrequencies[byte]++);
      
      // Chi-square test for uniformity (simplified)
      const expected = allBytes.length / 256;
      const chiSquare = byteFrequencies.reduce((sum, observed) => {
        return sum + Math.pow(observed - expected, 2) / expected;
      }, 0);
      
      // Very basic check - more sophisticated tests would use proper statistical thresholds
      expect(chiSquare).toBeLessThan(allBytes.length * 2); // Loose bound for basic entropy check
    });

    it('should work consistently across different invocations', () => {
      // Test that the library works consistently
      const results = [];
      
      for (let i = 0; i < 10; i++) {
        try {
          const keyPair = generateKeyPair();
          expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
          expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
          expect(keyPair.publicKey.length).toBe(32);
          expect(keyPair.secretKey.length).toBe(32);
          results.push(true);
        } catch (error) {
          results.push(false);
        }
      }
      
      // All invocations should succeed
      expect(results.every(r => r === true)).toBe(true);
    });
  });
  describe('Browser Feature Detection', () => {
    it('should detect browser capabilities correctly', async () => {
      const isNode = typeof window === 'undefined';
      
      if (!isNode) {
        // Browser tests
        expect(typeof window).toBe('object');
        expect(window.crypto).toBeDefined();
        expect(typeof window.crypto.getRandomValues).toBe('function');
        expect(typeof window.crypto.subtle).toBe('object');
      } else {
        // Node.js tests
        expect(typeof global).toBe('object');
        const crypto = await import('crypto');
        expect(typeof crypto.default.randomBytes).toBe('function');
        expect(typeof crypto.default.webcrypto).toBe('object');
      }
    });
  });

  describe('Environment Consistency', () => {
    it('should produce compatible output across environments', () => {
      // Since we're using the same stablelib in both environments,
      // the output should be identical given the same inputs
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      // Basic structure validation
      expect(keyPair1).toHaveProperty('publicKey');
      expect(keyPair1).toHaveProperty('secretKey');
      expect(keyPair2).toHaveProperty('publicKey');
      expect(keyPair2).toHaveProperty('secretKey');
      
      // Type consistency
      expect(keyPair1.publicKey.constructor).toBe(keyPair2.publicKey.constructor);
      expect(keyPair1.secretKey.constructor).toBe(keyPair2.secretKey.constructor);
    });
  });
});






