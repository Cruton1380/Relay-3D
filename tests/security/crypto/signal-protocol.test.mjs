/**
 * Signal Protocol Integration Tests
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Signal Protocol Integration', () => {
  it('should generate x25519 keys successfully', () => {
    const keyPair = crypto.generateKeyPairSync('x25519');
    
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey).toBeDefined();
    expect(typeof keyPair.privateKey).toBe('object');
    expect(typeof keyPair.publicKey).toBe('object');
  });

  it('should perform Diffie-Hellman key exchange', () => {
    const keyPair1 = crypto.generateKeyPairSync('x25519');
    const keyPair2 = crypto.generateKeyPairSync('x25519');
    
    const sharedSecret1 = crypto.diffieHellman({
      privateKey: keyPair1.privateKey,
      publicKey: keyPair2.publicKey
    });
    
    const sharedSecret2 = crypto.diffieHellman({
      privateKey: keyPair2.privateKey,
      publicKey: keyPair1.publicKey
    });
    
    expect(sharedSecret1.length).toBeGreaterThan(0);
    expect(sharedSecret2.length).toBeGreaterThan(0);
    expect(sharedSecret1.equals(sharedSecret2)).toBe(true);
  });
  it('should import Signal Protocol module', async () => {
    await expect(
      import('../../../src/backend/services/signalProtocol.mjs')
    ).resolves.toBeDefined();
  });
});
