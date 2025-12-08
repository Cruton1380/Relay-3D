/**
 * Simple Shamir Secret Sharing Test
 * Tests the core SSS functionality without guardian recovery dependencies
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { ShamirSecretSharing } from '../../src/lib/shamirSecretSharing.mjs';

describe('Shamir Secret Sharing Core - Fixed', () => {
  let sss;
  
  beforeEach(() => {
    sss = new ShamirSecretSharing(3, 5); // 3 of 5 threshold
  });

  describe('Secret Splitting and Reconstruction', () => {    it('should split and reconstruct a secret correctly', () => {
      const originalSecret = crypto.randomBytes(20); // Use smaller secret for simple format
      
      // Split the secret
      const shares = sss.splitSecret(originalSecret);
      
      expect(shares).toHaveLength(5);
      expect(shares[0]).toHaveProperty('x');
      expect(shares[0]).toHaveProperty('y');
      expect(shares[0]).toHaveProperty('threshold', 3);
      expect(shares[0]).toHaveProperty('totalShares', 5);
      expect(shares[0]).toHaveProperty('secretLength', 20);
      
      // Reconstruct with threshold shares
      const selectedShares = shares.slice(0, 3);
      const reconstructedSecret = sss.reconstructSecret(selectedShares);
      
      expect(reconstructedSecret).toEqual(originalSecret);
    });

    it('should reconstruct with any combination of threshold shares', () => {
      const originalSecret = Buffer.from('test-secret-key-16!!', 'utf8'); // 20 bytes
      const shares = sss.splitSecret(originalSecret);
      
      // Test different combinations of 3 shares
      const combinations = [
        [0, 1, 2],
        [0, 2, 4], 
        [1, 3, 4],
        [0, 1, 4]
      ];
      
      for (const combo of combinations) {
        const selectedShares = combo.map(i => shares[i]);
        const reconstructed = sss.reconstructSecret(selectedShares);
        expect(reconstructed).toEqual(originalSecret);
      }
    });

    it('should produce different shares each time', () => {
      const secret = Buffer.from('consistent-secret-for-testing');
      
      const shares1 = sss.splitSecret(secret);
      const shares2 = sss.splitSecret(secret);
      
      // Y values should be different (different random polynomials)
      expect(shares1[0].y).not.toBe(shares2[0].y);
      
      // But both should reconstruct to same secret
      const reconstructed1 = sss.reconstructSecret(shares1.slice(0, 3));
      const reconstructed2 = sss.reconstructSecret(shares2.slice(0, 3));
      
      expect(reconstructed1).toEqual(secret);
      expect(reconstructed2).toEqual(secret);
    });

    it('should handle small secrets', () => {
      const secret = Buffer.from('test', 'utf8');
      const shares = sss.splitSecret(secret);
      const reconstructed = sss.reconstructSecret(shares.slice(0, 3));
      expect(reconstructed).toEqual(secret);
    });

    it('should handle large secrets', () => {
      const secret = crypto.randomBytes(64); // 512 bits
      const shares = sss.splitSecret(secret);
      const reconstructed = sss.reconstructSecret(shares.slice(0, 3));
      expect(reconstructed).toEqual(secret);
    });
  });
});
