/**
 * X25519 Edge Cases and Security Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { encode as base64Encode, decode as base64Decode } from '@stablelib/base64';
import { randomBytes } from '@stablelib/random';

// We'll test the cryptographic primitives directly for edge cases
// SignalProtocol class testing will be done in integration tests

describe('X25519 Edge Cases and Security', () => {
  describe('Malformed Key Handling', () => {
    it('should handle invalid public key lengths gracefully', () => {
      const validKeyPair = generateKeyPair();
      
      // Test with various invalid key lengths
      const invalidKeys = [
        new Uint8Array(31), // Too short
        new Uint8Array(33), // Too long
        new Uint8Array(0),  // Empty
        new Uint8Array(64), // Double length
      ];

      invalidKeys.forEach(invalidKey => {
        expect(() => {
          sharedKey(validKeyPair.secretKey, invalidKey);
        }).toThrow();
      });
    });
  });

  describe('Base64 Error Handling', () => {
    it('should handle malformed base64 gracefully', () => {
      const invalidChars = [
        'not-base64!@#',  // Invalid characters
        'hello world',    // Spaces not allowed
      ];

      invalidChars.forEach(malformedKey => {
        expect(() => {
          base64Decode(malformedKey);
        }).toThrow();
      });
      
      // Test that valid base64 decodes correctly
      const validKey = base64Encode(new Uint8Array(32));
      const decoded = base64Decode(validKey);
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(decoded.length).toBe(32);
    });
  });

  describe('Key Generation Randomness', () => {
    it('should generate unique keys each time', () => {
      const keys = [];
      const publicKeys = new Set();
      const privateKeys = new Set();

      // Generate 50 key pairs  
      for (let i = 0; i < 50; i++) {
        const keyPair = generateKeyPair();
        keys.push(keyPair);
        
        publicKeys.add(Array.from(keyPair.publicKey).join(','));
        privateKeys.add(Array.from(keyPair.secretKey).join(','));
      }

      // All keys should be unique
      expect(publicKeys.size).toBe(50);
      expect(privateKeys.size).toBe(50);

      // Check for basic entropy in first few bytes
      const firstBytes = keys.map(k => k.publicKey[0]);
      const uniqueFirstBytes = new Set(firstBytes);
      expect(uniqueFirstBytes.size).toBeGreaterThan(5); // Should have reasonable distribution
    });
  });

  describe('Key Security Properties', () => {
    it('should ensure private keys are never equal to public keys', () => {
      for (let i = 0; i < 10; i++) {
        const keyPair = generateKeyPair();
        
        // Convert to hex for comparison
        const pubHex = Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
        const privHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
        
        expect(pubHex).not.toBe(privHex);
      }
    });

    it('should ensure shared secrets are deterministic but unique', () => {
      const alice = generateKeyPair();
      const bob1 = generateKeyPair();
      const bob2 = generateKeyPair();

      // Same key pairs should produce same secret
      const secret1a = sharedKey(alice.secretKey, bob1.publicKey);
      const secret1b = sharedKey(alice.secretKey, bob1.publicKey);
      expect(Array.from(secret1a)).toEqual(Array.from(secret1b));

      // Different key pairs should produce different secrets
      const secret2 = sharedKey(alice.secretKey, bob2.publicKey);
      expect(Array.from(secret1a)).not.toEqual(Array.from(secret2));
    });

    it('should validate key randomness', () => {
      const keys = [];
      const publicKeys = new Set();
      const privateKeys = new Set();

      // Generate 100 key pairs
      for (let i = 0; i < 100; i++) {
        const keyPair = generateKeyPair();
        keys.push(keyPair);
        
        publicKeys.add(Array.from(keyPair.publicKey).join(','));
        privateKeys.add(Array.from(keyPair.secretKey).join(','));
      }

      // All keys should be unique
      expect(publicKeys.size).toBe(100);
      expect(privateKeys.size).toBe(100);
      
      // Check for basic entropy in first few bytes
      const firstBytes = keys.map(k => k.publicKey[0]);
      const uniqueFirstBytes = new Set(firstBytes);
      expect(uniqueFirstBytes.size).toBeGreaterThan(5); // Should have reasonable distribution
    });
  });

  describe('Error Handling', () => {
    it('should not leak sensitive data in error messages', () => {
      const keyPair = generateKeyPair();
      const keyHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
      const keyBase64 = base64Encode(keyPair.secretKey);

      try {
        // Force an error with invalid parameters
        sharedKey(new Uint8Array(31), keyPair.publicKey); // Invalid private key length
      } catch (error) {
        const errorStr = error.toString().toLowerCase();
        
        // Error message should not contain raw key material
        expect(errorStr).not.toContain(keyHex.toLowerCase());
        expect(errorStr).not.toContain(keyBase64.toLowerCase());
      }
    });
  });
  describe('Stress Testing & Abuse Scenarios', () => {
    it('should handle 100+ rapid key exchanges without degradation', async () => {
      const iterations = 100; // Reduced for faster testing
      const latencies = [];
      let errors = 0;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const start = performance.now();
          const aliceKeypair = generateKeyPair();
          const bobKeypair = generateKeyPair();
          const sharedSecret1 = sharedKey(aliceKeypair.secretKey, bobKeypair.publicKey);
          const sharedSecret2 = sharedKey(bobKeypair.secretKey, aliceKeypair.publicKey);
          
          const end = performance.now();
          latencies.push(end - start);
          
          expect(sharedSecret1).toEqual(sharedSecret2);
          expect(sharedSecret1.length).toBe(32);
        } catch (error) {
          errors++;
        }
      }
      
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(errors).toBe(0);
      expect(avgLatency).toBeLessThan(50); // Should be very fast
    });

    it('should handle rapid-fire key generation without memory leaks', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Generate many keypairs rapidly
      for (let i = 0; i < 1000; i++) {
        const keypair = generateKeyPair();
        expect(keypair.publicKey.length).toBe(32);
        expect(keypair.secretKey.length).toBe(32);
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      // Memory should not have grown excessively
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      if (initialMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });    it('should handle weak or predictable keys gracefully', () => {
      // Test all-zero key (weak key) - @stablelib/x25519 handles this gracefully
      const zeroKey = new Uint8Array(32);
      const validKeypair = generateKeyPair();
      
      // Zero key should produce a result, but we can detect it's weak
      const zeroSecret = sharedKey(zeroKey, validKeypair.publicKey);
      expect(zeroSecret).toBeInstanceOf(Uint8Array);
      expect(zeroSecret.length).toBe(32);
      
      // Test all-ones key (weak key)
      const onesKey = new Uint8Array(32).fill(255);
      const onesSecret = sharedKey(onesKey, validKeypair.publicKey);
      expect(onesSecret).toBeInstanceOf(Uint8Array);
      expect(onesSecret.length).toBe(32);
      
      // Weak keys should produce different secrets (they shouldn't be identical)
      expect(Array.from(zeroSecret)).not.toEqual(Array.from(onesSecret));
    });

    it('should handle concurrent key operations safely', async () => {
      const promises = [];
      
      // Launch multiple concurrent key operations
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise((resolve) => {
            const keypair1 = generateKeyPair();
            const keypair2 = generateKeyPair();
            const secret = sharedKey(keypair1.secretKey, keypair2.publicKey);
            resolve(secret);
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      // All operations should complete successfully
      expect(results.length).toBe(100);
      results.forEach(secret => {
        expect(secret).toBeInstanceOf(Uint8Array);
        expect(secret.length).toBe(32);
      });
      
      // All secrets should be different (extremely high probability)
      const uniqueSecrets = new Set(results.map(s => Array.from(s).join(',')));
      expect(uniqueSecrets.size).toBe(100);
    });
  });
});






