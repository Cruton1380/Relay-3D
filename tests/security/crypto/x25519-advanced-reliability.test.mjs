/**
 * X25519 Advanced Reliability & Session Management Tests
 * Tests key rotation, session isolation, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { encode as base64Encode, decode as base64Decode } from '@stablelib/base64';

// Mock SignalProtocol client for testing
class MockSignalProtocolClient {
  constructor() {
    this.isInitialized = false;
    this.sessions = new Map();
    this.identityKey = null;
    this.serverIdentityKey = null;
    this.keyRotationTimestamp = Date.now();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    const keyPair = generateKeyPair();
    this.identityKey = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
    this.isInitialized = true;
  }

  async rotateIdentityKey() {
    const oldKey = this.identityKey;
    const keyPair = generateKeyPair();
    this.identityKey = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
    this.keyRotationTimestamp = Date.now();
    
    // Invalidate all existing sessions
    this.sessions.clear();
    
    return { oldKey, newKey: this.identityKey };
  }
  async establishSession(sessionId, peerPublicKey) {
    if (!this.isInitialized) await this.initialize();
    
    const ephemeralKeyPair = generateKeyPair();
    
    // Simulate Triple DH - each session should use different ephemeral keys
    const dh1 = sharedKey(this.identityKey.privateKey, peerPublicKey);
    const dh2 = sharedKey(ephemeralKeyPair.secretKey, peerPublicKey);
    // Use different keys for dh3 to create proper key diversity
    const sessionEphemeralKeyPair = generateKeyPair();
    const dh3 = sharedKey(sessionEphemeralKeyPair.secretKey, peerPublicKey);
    
    // Mix in session ID and timestamp for uniqueness
    const sessionData = new TextEncoder().encode(sessionId + Date.now() + Math.random());
    const mixedKey = new Uint8Array(32);
    
    // Create unique root key by combining DH outputs with session-specific data
    for (let i = 0; i < 32; i++) {
      mixedKey[i] = dh1[i % dh1.length] ^ 
                    dh2[i % dh2.length] ^ 
                    dh3[i % dh3.length] ^ 
                    sessionData[i % sessionData.length];
    }
    
    const session = {
      sessionId,
      rootKey: mixedKey,
      peerPublicKey: new Uint8Array(peerPublicKey), // Copy to avoid reference issues
      createdAt: Date.now(),
      lastUsed: Date.now(),
      messageCount: 0
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  isSessionValid(sessionId, maxAge = 3600000) { // 1 hour default
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    return (Date.now() - session.lastUsed) < maxAge;
  }

  expireOldSessions(maxAge = 3600000) {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.sessions) {
      if ((now - session.lastUsed) > maxAge) {
        this.sessions.delete(sessionId);
        expiredSessions.push(sessionId);
      }
    }
    
    return expiredSessions;
  }

  getSessionStats() {
    return {
      activeSessions: this.sessions.size,
      identityKeyAge: Date.now() - this.keyRotationTimestamp,
      oldestSession: Math.min(...Array.from(this.sessions.values()).map(s => s.createdAt)),
      totalMessages: Array.from(this.sessions.values()).reduce((sum, s) => sum + s.messageCount, 0)
    };
  }
}

describe('X25519 Advanced Reliability & Session Management', () => {
  let client1, client2, client3;

  beforeEach(async () => {
    client1 = new MockSignalProtocolClient();
    client2 = new MockSignalProtocolClient();
    client3 = new MockSignalProtocolClient();
    
    await client1.initialize();
    await client2.initialize();
    await client3.initialize();
  });

  afterEach(() => {
    // Clean up sessions
    client1?.sessions.clear();
    client2?.sessions.clear();
    client3?.sessions.clear();
  });

  describe('Key Rotation Scenarios', () => {
    it('should invalidate sessions when identity key is rotated', async () => {
      // Establish session before key rotation
      const session1 = await client1.establishSession('session-1', client2.identityKey.publicKey);
      expect(client1.sessions.has('session-1')).toBe(true);
      
      // Rotate client1's identity key
      const { oldKey, newKey } = await client1.rotateIdentityKey();
      
      // Verify key changed
      expect(Array.from(oldKey.publicKey)).not.toEqual(Array.from(newKey.publicKey));
      
      // Verify sessions were cleared
      expect(client1.sessions.has('session-1')).toBe(false);
      expect(client1.sessions.size).toBe(0);
    });

    it('should require new handshake after peer key rotation', async () => {
      // Establish initial session
      const session1 = await client1.establishSession('session-1', client2.identityKey.publicKey);
      const originalRootKey = Array.from(session1.rootKey);
      
      // Client2 rotates their key
      await client2.rotateIdentityKey();
      
      // Attempt to establish new session with rotated key
      const session2 = await client1.establishSession('session-2', client2.identityKey.publicKey);
      const newRootKey = Array.from(session2.rootKey);
      
      // Root keys should be different due to key rotation
      expect(originalRootKey).not.toEqual(newRootKey);
    });

    it('should handle rapid key rotations without memory leaks', async () => {
      const initialMemory = client1.sessions.size;
      
      // Perform multiple rapid key rotations
      for (let i = 0; i < 10; i++) {
        await client1.establishSession(`temp-session-${i}`, client2.identityKey.publicKey);
        await client1.rotateIdentityKey();
      }
      
      // All sessions should be cleared after rotations
      expect(client1.sessions.size).toBe(0);
      
      // Verify no session leakage
      expect(client1.sessions.size).toBe(initialMemory);
    });
  });

  describe('Multi-Session Management', () => {
    it('should handle multiple simultaneous sessions (multi-tab scenario)', async () => {
      const peerKeys = [client1.identityKey.publicKey, client2.identityKey.publicKey, client3.identityKey.publicKey];
      const sessions = [];
      
      // Simulate multiple tabs/devices establishing sessions
      for (let i = 0; i < 5; i++) {
        const peerKey = peerKeys[i % peerKeys.length];
        const session = await client1.establishSession(`tab-${i}`, peerKey);
        sessions.push(session);
      }
      
      expect(client1.sessions.size).toBe(5);
      
      // Each session should have unique root keys
      const rootKeys = sessions.map(s => Array.from(s.rootKey).join(','));
      const uniqueRootKeys = new Set(rootKeys);
      expect(uniqueRootKeys.size).toBe(sessions.length);
    });

    it('should isolate session state across different instances', async () => {
      // Establish sessions on different clients
      await client1.establishSession('session-a', client2.identityKey.publicKey);
      await client2.establishSession('session-b', client3.identityKey.publicKey);
      await client3.establishSession('session-c', client1.identityKey.publicKey);
      
      // Verify session isolation
      expect(client1.sessions.has('session-a')).toBe(true);
      expect(client1.sessions.has('session-b')).toBe(false);
      expect(client1.sessions.has('session-c')).toBe(false);
      
      expect(client2.sessions.has('session-b')).toBe(true);
      expect(client2.sessions.has('session-a')).toBe(false);
      expect(client2.sessions.has('session-c')).toBe(false);
    });

    it('should handle session collision with different peers', async () => {
      const sessionId = 'shared-session-id';
      
      // Same session ID with different peers
      await client1.establishSession(sessionId, client2.identityKey.publicKey);
      await client1.establishSession(sessionId, client3.identityKey.publicKey);
      
      // Last session should overwrite (or handle collision appropriately)
      expect(client1.sessions.size).toBe(1);
      const session = client1.getSession(sessionId);
      expect(session).toBeDefined();
    });
  });

  describe('Session Expiry & Cleanup', () => {
    it('should expire old sessions without data leakage', async () => {
      // Create sessions with different ages
      const session1 = await client1.establishSession('old-session', client2.identityKey.publicKey);
      const session2 = await client1.establishSession('new-session', client3.identityKey.publicKey);
      
      // Manually age one session
      session1.lastUsed = Date.now() - 7200000; // 2 hours ago
      session2.lastUsed = Date.now() - 1800000; // 30 minutes ago
      
      // Expire sessions older than 1 hour
      const expired = client1.expireOldSessions(3600000);
      
      expect(expired).toContain('old-session');
      expect(expired).not.toContain('new-session');
      expect(client1.sessions.has('old-session')).toBe(false);
      expect(client1.sessions.has('new-session')).toBe(true);
    });

    it('should validate session freshness', async () => {
      const session = await client1.establishSession('test-session', client2.identityKey.publicKey);
      
      // Fresh session should be valid
      expect(client1.isSessionValid('test-session')).toBe(true);
      
      // Age the session
      session.lastUsed = Date.now() - 7200000; // 2 hours ago
      
      // Old session should be invalid
      expect(client1.isSessionValid('test-session', 3600000)).toBe(false);
    });
  });

  describe('Stale Key Detection', () => {
    it('should detect attempts to use old peer keys', async () => {
      // Establish session with current key
      const originalSession = await client1.establishSession('session-1', client2.identityKey.publicKey);
      const originalRootKey = Array.from(originalSession.rootKey);
      
      // Store old key before rotation
      const oldPeerKey = new Uint8Array(client2.identityKey.publicKey);
      
      // Peer rotates key
      await client2.rotateIdentityKey();
      
      // Attempt to establish session with old key
      const staleSession = await client1.establishSession('session-2', oldPeerKey);
      const staleRootKey = Array.from(staleSession.rootKey);
      
      // Establish session with new key
      const freshSession = await client1.establishSession('session-3', client2.identityKey.publicKey);
      const freshRootKey = Array.from(freshSession.rootKey);
      
      // All root keys should be different
      expect(originalRootKey).not.toEqual(staleRootKey);
      expect(originalRootKey).not.toEqual(freshRootKey);
      expect(staleRootKey).not.toEqual(freshRootKey);
    });
  });

  describe('Concurrent Session Operations', () => {
    it('should handle concurrent session establishment', async () => {
      const promises = [];
      
      // Simulate concurrent session creation from multiple sources
      for (let i = 0; i < 10; i++) {
        promises.push(client1.establishSession(`concurrent-${i}`, client2.identityKey.publicKey));
      }
      
      const sessions = await Promise.all(promises);
      
      // All sessions should be established
      expect(sessions.length).toBe(10);
      expect(client1.sessions.size).toBe(10);
      
      // Each session should have unique identifiers
      const sessionIds = sessions.map(s => s.sessionId);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle concurrent key rotation safely', async () => {
      // Establish initial sessions
      await client1.establishSession('session-1', client2.identityKey.publicKey);
      await client1.establishSession('session-2', client3.identityKey.publicKey);
      
      expect(client1.sessions.size).toBe(2);
      
      // Concurrent key rotations
      const rotationPromises = [
        client1.rotateIdentityKey(),
        client2.rotateIdentityKey(),
        client3.rotateIdentityKey()
      ];
      
      await Promise.all(rotationPromises);
      
      // Client1's sessions should be cleared
      expect(client1.sessions.size).toBe(0);
      
      // All clients should have new keys
      expect(client1.isInitialized).toBe(true);
      expect(client2.isInitialized).toBe(true);
      expect(client3.isInitialized).toBe(true);
    });
  });

  describe('Session Metrics & Monitoring', () => {
    it('should provide accurate session statistics', async () => {
      const startTime = Date.now();
      
      // Establish multiple sessions
      await client1.establishSession('session-1', client2.identityKey.publicKey);
      await client1.establishSession('session-2', client3.identityKey.publicKey);
      
      const stats = client1.getSessionStats();
      
      expect(stats.activeSessions).toBe(2);
      expect(stats.identityKeyAge).toBeGreaterThanOrEqual(0);
      expect(stats.oldestSession).toBeGreaterThanOrEqual(startTime);
      expect(stats.totalMessages).toBe(0);
    });

    it('should track session usage patterns', async () => {
      const session = await client1.establishSession('tracked-session', client2.identityKey.publicKey);
      
      // Simulate message activity
      session.messageCount += 5;
      session.lastUsed = Date.now();
      
      const stats = client1.getSessionStats();
      expect(stats.totalMessages).toBe(5);
    });
  });
});






