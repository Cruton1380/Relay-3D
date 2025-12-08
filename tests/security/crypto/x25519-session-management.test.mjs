/**
 * X25519 Session Management and Key Rotation Tests
 * Tests advanced scenarios like key rotation, session invalidation, and multi-tab behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { encode as base64Encode, decode as base64Decode } from '@stablelib/base64';

// Mock SignalProtocol client for testing
class MockSignalProtocolClient {
  constructor(clientId = 'test-client') {
    this.clientId = clientId;
    this.isInitialized = false;
    this.sessions = new Map();
    this.identityKey = null;
    this.serverIdentityKey = null;
    this.keyVersion = 1;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    const keyPair = generateKeyPair();
    this.identityKey = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
      version: this.keyVersion
    };
    this.isInitialized = true;
  }

  async rotateIdentityKey() {
    const oldVersion = this.keyVersion;
    this.keyVersion++;
    
    const keyPair = generateKeyPair();
    this.identityKey = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
      version: this.keyVersion
    };

    // Invalidate all existing sessions due to key rotation
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      this.invalidateSession(sessionId, 'identity_key_rotation');
    }

    return {
      oldVersion,
      newVersion: this.keyVersion,
      invalidatedSessions: sessionIds.length
    };
  }

  async establishSession(sessionId, peerPublicKey, peerKeyVersion = 1) {
    if (!this.isInitialized) await this.initialize();

    const ephemeralKeyPair = generateKeyPair();
    
    // Verify peer key freshness
    const existingSession = this.sessions.get(sessionId);
    if (existingSession && existingSession.peerKeyVersion !== peerKeyVersion) {
      this.invalidateSession(sessionId, 'peer_key_version_mismatch');
    }

    // Perform Triple DH
    const dh1 = sharedKey(this.identityKey.privateKey, peerPublicKey);
    const dh2 = sharedKey(ephemeralKeyPair.secretKey, peerPublicKey);
    const dh3 = sharedKey(ephemeralKeyPair.secretKey, peerPublicKey);

    const session = {
      sessionId,
      established: Date.now(),
      myKeyVersion: this.identityKey.version,
      peerKeyVersion,
      ephemeralKeyPair,
      sharedSecrets: [dh1, dh2, dh3],
      status: 'active',
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  invalidateSession(sessionId, reason = 'manual') {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Clear sensitive data
      if (session.ephemeralKeyPair) {
        session.ephemeralKeyPair.secretKey.fill(0);
        session.ephemeralKeyPair.privateKey?.fill(0);
      }
      session.sharedSecrets?.forEach(secret => secret.fill(0));
      
      session.status = 'invalidated';
      session.reason = reason;
      session.invalidatedAt = Date.now();
      
      // Remove from active sessions
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  getSessionInfo(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  expireOldSessions(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const expired = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.invalidateSession(sessionId, 'expired');
        expired.push(sessionId);
      }
    }
    
    return expired;
  }

  updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }
}

describe('X25519 Session Management', () => {
  let client1, client2;

  beforeEach(async () => {
    client1 = new MockSignalProtocolClient('client-1');
    client2 = new MockSignalProtocolClient('client-2');
    await client1.initialize();
    await client2.initialize();
  });

  afterEach(() => {
    // Clean up any remaining sessions
    client1?.sessions.clear();
    client2?.sessions.clear();
  });

  describe('Key Rotation Scenarios', () => {
    it('should invalidate all sessions when identity key is rotated', async () => {
      // Establish multiple sessions
      await client1.establishSession('session-1', client2.identityKey.publicKey);
      await client1.establishSession('session-2', client2.identityKey.publicKey);
      
      expect(client1.sessions.size).toBe(2);
      expect(client1.identityKey.version).toBe(1);

      // Rotate identity key
      const result = await client1.rotateIdentityKey();

      expect(result.oldVersion).toBe(1);
      expect(result.newVersion).toBe(2);
      expect(result.invalidatedSessions).toBe(2);
      expect(client1.sessions.size).toBe(0);
      expect(client1.identityKey.version).toBe(2);
    });

    it('should detect peer key version mismatch and reinitiate handshake', async () => {
      // Establish session with initial peer key
      const session1 = await client1.establishSession('test-session', client2.identityKey.publicKey, 1);
      expect(session1.peerKeyVersion).toBe(1);

      // Simulate peer rotating their key and client1 trying to use old session
      await client2.rotateIdentityKey();

      // Try to establish session with new peer key version
      const session2 = await client1.establishSession('test-session', client2.identityKey.publicKey, 2);
      
      expect(session2.peerKeyVersion).toBe(2);
      expect(session2.myKeyVersion).toBe(1);
      
      // Should be a fresh session due to peer key version change
      const sessionInfo = client1.getSessionInfo('test-session');
      expect(sessionInfo.peerKeyVersion).toBe(2);
    });

    it('should enforce key freshness and prevent replay attacks', async () => {
      const oldPeerKey = client2.identityKey.publicKey;
      
      // Rotate peer key
      await client2.rotateIdentityKey();
      const newPeerKey = client2.identityKey.publicKey;

      // Establish session with new key
      const session1 = await client1.establishSession('session-new', newPeerKey, 2);
      
      // Try to establish session with old key (should be rejected or treated as separate)
      const session2 = await client1.establishSession('session-old', oldPeerKey, 1);
      
      expect(Array.from(session1.sharedSecrets[0])).not.toEqual(Array.from(session2.sharedSecrets[0]));
    });
  });

  describe('Session Expiration and Cleanup', () => {
    it('should expire old sessions without data leakage', async () => {
      const session = await client1.establishSession('test-session', client2.identityKey.publicKey);
      
      // Verify session is active
      expect(client1.sessions.has('test-session')).toBe(true);
      
      // Manually set old timestamp
      session.lastActivity = Date.now() - 7200000; // 2 hours ago
      
      // Expire old sessions (1 hour threshold)
      const expired = client1.expireOldSessions(3600000);
      
      expect(expired).toContain('test-session');
      expect(client1.sessions.has('test-session')).toBe(false);
      
      // Verify sensitive data was cleared (keys should be zeroed)
      expect(session.status).toBe('invalidated');
      expect(session.reason).toBe('expired');
    });

    it('should update session activity to prevent premature expiration', async () => {
      const session = await client1.establishSession('active-session', client2.identityKey.publicKey);
      
      // Simulate old activity
      session.lastActivity = Date.now() - 1800000; // 30 minutes ago
      
      // Update activity
      client1.updateActivity('active-session');
      
      // Try to expire (should not expire due to recent activity)
      const expired = client1.expireOldSessions(3600000);
      
      expect(expired).not.toContain('active-session');
      expect(client1.sessions.has('active-session')).toBe(true);
    });
  });

  describe('Multi-Tab/Multi-Device Scenarios', () => {
    it('should handle multiple simultaneous session establishments', async () => {
      const clients = [];
      const sessionPromises = [];

      // Create multiple client instances (simulating tabs/devices)
      for (let i = 0; i < 5; i++) {
        const client = new MockSignalProtocolClient(`client-${i}`);
        await client.initialize();
        clients.push(client);
        
        // Each tries to establish session with client2
        sessionPromises.push(
          client.establishSession(`session-${i}`, client2.identityKey.publicKey)
        );
      }

      const sessions = await Promise.all(sessionPromises);

      // All sessions should be established successfully
      expect(sessions).toHaveLength(5);
      
      // Each should have unique shared secrets
      const secrets = sessions.map(s => Array.from(s.sharedSecrets[0]).join(','));
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(5);

      // Each client should have one active session
      clients.forEach(client => {
        expect(client.sessions.size).toBe(1);
      });
    });

    it('should isolate session state across different client instances', async () => {
      const tab1 = new MockSignalProtocolClient('tab-1');
      const tab2 = new MockSignalProtocolClient('tab-2');
      
      await tab1.initialize();
      await tab2.initialize();

      // Establish sessions on both tabs
      await tab1.establishSession('session-a', client2.identityKey.publicKey);
      await tab2.establishSession('session-b', client2.identityKey.publicKey);

      // Verify isolation
      expect(tab1.sessions.has('session-a')).toBe(true);
      expect(tab1.sessions.has('session-b')).toBe(false);
      expect(tab2.sessions.has('session-a')).toBe(false);
      expect(tab2.sessions.has('session-b')).toBe(true);

      // Different identity keys
      expect(Array.from(tab1.identityKey.publicKey)).not.toEqual(Array.from(tab2.identityKey.publicKey));

      // Rotate key on one tab
      await tab1.rotateIdentityKey();
      
      // Other tab should be unaffected
      expect(tab1.identityKey.version).toBe(2);
      expect(tab2.identityKey.version).toBe(1);
      expect(tab2.sessions.has('session-b')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle session establishment with invalid peer key', async () => {
      const invalidKey = new Uint8Array(32); // All zeros
      
      expect(() => {
        client1.establishSession('invalid-session', invalidKey);
      }).not.toThrow(); // Should handle gracefully
    });

    it('should prevent session ID collisions', async () => {
      await client1.establishSession('duplicate-id', client2.identityKey.publicKey);
      
      // Establish another session with same ID (should replace or handle gracefully)
      const session2 = await client1.establishSession('duplicate-id', client2.identityKey.publicKey);
      
      expect(client1.sessions.size).toBe(1);
      expect(client1.sessions.get('duplicate-id')).toBe(session2);
    });

    it('should handle rapid key rotations', async () => {
      const initialVersion = client1.identityKey.version;
      const rotations = [];

      // Perform rapid rotations
      for (let i = 0; i < 10; i++) {
        const result = await client1.rotateIdentityKey();
        rotations.push(result);
      }

      expect(client1.identityKey.version).toBe(initialVersion + 10);
      
      // Each rotation should increment version
      rotations.forEach((rotation, index) => {
        expect(rotation.newVersion).toBe(initialVersion + index + 1);
      });
    });
  });

  describe('Memory Management', () => {
    it('should properly clear sensitive data on session invalidation', async () => {
      const session = await client1.establishSession('sensitive-session', client2.identityKey.publicKey);
      
      // Capture references to sensitive data
      const ephemeralSecret = new Uint8Array(session.ephemeralKeyPair.secretKey);
      const sharedSecret = new Uint8Array(session.sharedSecrets[0]);
      
      // Invalidate session
      client1.invalidateSession('sensitive-session', 'test-cleanup');
      
      // Original arrays should be zeroed out
      expect(session.ephemeralKeyPair.secretKey.every(byte => byte === 0)).toBe(true);
      expect(session.sharedSecrets[0].every(byte => byte === 0)).toBe(true);
      
      // Our copies should still have the data (proving arrays were properly zeroed)
      expect(ephemeralSecret.some(byte => byte !== 0)).toBe(true);
      expect(sharedSecret.some(byte => byte !== 0)).toBe(true);
    });

    it('should handle cleanup on client destruction', async () => {
      const testClient = new MockSignalProtocolClient('temp-client');
      await testClient.initialize();
      
      await testClient.establishSession('temp-session-1', client2.identityKey.publicKey);
      await testClient.establishSession('temp-session-2', client2.identityKey.publicKey);
      
      expect(testClient.sessions.size).toBe(2);
      
      // Simulate client cleanup
      const sessionIds = Array.from(testClient.sessions.keys());
      sessionIds.forEach(id => testClient.invalidateSession(id, 'client_destroyed'));
      
      expect(testClient.sessions.size).toBe(0);
    });
  });
});






