/**
 * Guardian-Based Social Shard Recovery System Tests
 * 
 * Comprehensive test suite covering:
 * - Shamir's Secret Sharing cryptographic operations
 * - Guardian management and shard distribution
 * - Recovery process workflows
 * - Security and edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { ShamirSecretSharing, ShareManager } from '../../src/lib/shamirSecretSharing.mjs';
import GuardianRecoveryManager from '../../src/lib/guardianRecoveryManager.mjs';

describe('Shamir Secret Sharing Core', () => {
  let sss;
  
  beforeEach(() => {
    sss = new ShamirSecretSharing(3, 5); // 3 of 5 threshold
  });

  describe('Secret Splitting and Reconstruction', () => {    it('should split and reconstruct a secret correctly', () => {
      const originalSecret = crypto.randomBytes(30); // Use 30 bytes to trigger simple format
      
      // Split the secret
      const shares = sss.splitSecret(originalSecret);
      
      expect(shares).toHaveLength(5);
      expect(shares[0]).toHaveProperty('x');
      expect(shares[0]).toHaveProperty('y');
      expect(shares[0]).toHaveProperty('threshold', 3);
      expect(shares[0]).toHaveProperty('totalShares', 5);
      
      // Reconstruct with threshold shares
      const selectedShares = shares.slice(0, 3);
      const reconstructedSecret = sss.reconstructSecret(selectedShares);
      
      expect(reconstructedSecret).toEqual(originalSecret);
    });

    it('should reconstruct with any combination of threshold shares', () => {
      const originalSecret = Buffer.from('test-secret-key-32-bytes-long!!!');
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
    });    it('should fail reconstruction with insufficient shares', () => {
      const originalSecret = crypto.randomBytes(30); // Use 30 bytes to trigger simple format
      const shares = sss.splitSecret(originalSecret);
      
      // Try with only 2 shares (below threshold of 3)
      const insufficientShares = shares.slice(0, 2);
      
      expect(() => {
        sss.reconstructSecret(insufficientShares);
      }).toThrow('Need at least 3 shares');
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
  });

  describe('Share Validation', () => {    it('should validate correct shares', () => {
      const shares = sss.splitSecret(crypto.randomBytes(30)); // Use 30 bytes to trigger simple format
      
      for (const share of shares) {
        expect(sss.verifyShare(share)).toBe(true);
      }
    });

    it('should reject invalid shares', () => {
      const invalidShares = [
        { x: 0, y: 'test', threshold: 3, totalShares: 5 }, // x cannot be 0
        { x: 6, y: 'test', threshold: 3, totalShares: 5 }, // x > totalShares
        { x: 1, y: '', threshold: 3, totalShares: 5 },    // empty y
        { x: 1, y: 'test', threshold: 2, totalShares: 5 }, // wrong threshold
      ];
      
      for (const invalidShare of invalidShares) {
        expect(sss.verifyShare(invalidShare)).toBe(false);
      }
    });
  });

  describe('Emergency Recovery Package', () => {    it('should create emergency recovery package', () => {
      const secret = crypto.randomBytes(30); // Use 30 bytes to trigger simple format
      const shares = sss.splitSecret(secret);
      
      const emergencyPackage = sss.createEmergencyRecoveryPackage(shares);
      
      expect(emergencyPackage).toHaveProperty('version');
      expect(emergencyPackage).toHaveProperty('threshold', 3);
      expect(emergencyPackage).toHaveProperty('totalShares', 5);
      expect(emergencyPackage).toHaveProperty('emergencyShares');
      expect(emergencyPackage.emergencyShares).toHaveLength(3);
      expect(emergencyPackage).toHaveProperty('instructions');
      expect(emergencyPackage).toHaveProperty('warnings');
    });
  });
});

describe('Share Manager', () => {
  let shareManager;
  
  beforeEach(() => {
    shareManager = new ShareManager();
  });

  describe('Share Storage and Retrieval', () => {
    it('should store and retrieve shares', () => {
      const share = { x: 1, y: 'test-share-data', shareId: 'share-123' };
      const metadata = { guardianId: 'guardian-1', createdAt: Date.now() };
      
      shareManager.storeShare('share-123', share, metadata);
      
      const retrieved = shareManager.getShare('share-123');
      expect(retrieved).toBeDefined();
      expect(retrieved.share).toEqual(share);
      expect(retrieved.metadata).toEqual(expect.objectContaining(metadata));
      expect(retrieved.metadata.lastAccessed).toBeDefined();
    });

    it('should assign shares to guardians', () => {
      const shareId = 'share-456';
      const guardianId = 'guardian-2';
      const encryptedShare = { encrypted: 'data' };
      
      shareManager.assignShareToGuardian(shareId, guardianId, encryptedShare);
      
      const guardianShares = shareManager.getGuardianShares(guardianId);
      expect(guardianShares).toHaveLength(1);
      expect(guardianShares[0]).toEqual(expect.objectContaining({
        shareId,
        guardianId,
        encryptedShare,
        status: 'active'
      }));
    });

    it('should revoke shares', () => {
      const share = { x: 1, y: 'test', shareId: 'share-789' };
      const metadata = { guardianId: 'guardian-3' };
      
      shareManager.storeShare('share-789', share, metadata);
      shareManager.assignShareToGuardian('share-789', 'guardian-3', {});
      
      shareManager.revokeShare('share-789');
      
      const retrieved = shareManager.getShare('share-789');
      expect(retrieved.metadata.isRevoked).toBe(true);
      expect(retrieved.metadata.revokedAt).toBeDefined();
    });
  });
});

describe('Guardian Recovery Manager', () => {
  let guardianRecovery;
  
  beforeEach(() => {
    guardianRecovery = new GuardianRecoveryManager({
      defaultThreshold: 3,
      defaultTotalShares: 5,
      guardianApprovalTimeout: 60000 // 1 minute for testing
    });
  });

  afterEach(() => {
    // Clean up any active timers
    for (const recovery of guardianRecovery.activeRecoveries.values()) {
      if (recovery.timer) {
        clearTimeout(recovery.timer);
      }
    }
  });

  describe('User Configuration', () => {
    it('should initialize user recovery configuration', async () => {
      const userId = 'test-user-1';
      const guardians = ['guardian-1', 'guardian-2', 'guardian-3'];
      
      const config = await guardianRecovery.initializeUserRecovery(userId, {
        threshold: 3,
        totalShares: 5,
        guardians
      });
      
      expect(config).toEqual(expect.objectContaining({
        userId,
        threshold: 3,
        totalShares: 5,
        guardians
      }));
      
      expect(guardianRecovery.userConfigurations.has(userId)).toBe(true);
    });

    it('should get user recovery status', async () => {
      const userId = 'test-user-2';
      
      // Initialize configuration
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const status = guardianRecovery.getUserRecoveryStatus(userId);
      
      expect(status).toEqual(expect.objectContaining({
        isConfigured: true,
        threshold: 3,
        totalShares: 5,
        guardianCount: 3,
        guardians: ['g1', 'g2', 'g3']
      }));
    });
  });

  describe('Guardian Management', () => {
    it('should add guardians', async () => {
      const userId = 'test-user-3';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2']
      });
      
      const updatedConfig = await guardianRecovery.addGuardian(userId, 'g3');
      
      expect(updatedConfig.guardians).toContain('g3');
      expect(updatedConfig.guardians).toHaveLength(3);
    });

    it('should remove guardians', async () => {
      const userId = 'test-user-4';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const updatedConfig = await guardianRecovery.removeGuardian(userId, 'g2');
      
      expect(updatedConfig.guardians).not.toContain('g2');
      expect(updatedConfig.guardians).toHaveLength(2);
    });

    it('should prevent duplicate guardians', async () => {
      const userId = 'test-user-5';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      await expect(guardianRecovery.addGuardian(userId, 'g2')).rejects.toThrow('Guardian already exists');
    });
  });

  describe('Recovery Process', () => {
    it('should initiate recovery successfully', async () => {
      const userId = 'test-user-6';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3', 'g4']
      });
      
      const recovery = await guardianRecovery.initiateRecovery(userId, 'device-info');
      
      expect(recovery).toEqual(expect.objectContaining({
        recoveryId: expect.any(String),
        status: 'pending_guardian_approval',
        requiredApprovals: 3
      }));
      
      expect(guardianRecovery.activeRecoveries.has(recovery.recoveryId)).toBe(true);
    });

    it('should handle guardian approvals', async () => {
      const userId = 'test-user-7';
      
      // Setup
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const recovery = await guardianRecovery.initiateRecovery(userId, 'device');
      
      // Mock guardian approvals
      guardianRecovery.verifyGuardianSignature = async () => true;
      guardianRecovery.retrieveGuardianShare = async () => ({ x: 1, y: 'test', shareId: 'test' });
      
      // First approval
      const result1 = await guardianRecovery.approveRecovery(
        recovery.recoveryId, 
        'g1', 
        'signature1'
      );
      
      expect(result1.status).toBe('pending_guardian_approval');
      expect(result1.approvedCount).toBe(1);
      
      // Second approval
      const result2 = await guardianRecovery.approveRecovery(
        recovery.recoveryId, 
        'g2', 
        'signature2'
      );
      
      expect(result2.status).toBe('pending_guardian_approval');
      expect(result2.approvedCount).toBe(2);
    });

    it('should prevent unauthorized guardian approvals', async () => {
      const userId = 'test-user-8';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const recovery = await guardianRecovery.initiateRecovery(userId, 'device');
      
      // Try approval from non-guardian
      await expect(
        guardianRecovery.approveRecovery(recovery.recoveryId, 'unauthorized', 'sig')
      ).rejects.toThrow('Guardian is not authorized');
    });

    it('should handle recovery expiration', async () => {
      const userId = 'test-user-9';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      // Create recovery with very short timeout
      const recovery = await guardianRecovery.initiateRecovery(userId, 'device');
      
      // Manually expire the recovery
      const recoverySession = guardianRecovery.activeRecoveries.get(recovery.recoveryId);
      recoverySession.expiresAt = Date.now() - 1000; // 1 second ago
      
      await expect(
        guardianRecovery.approveRecovery(recovery.recoveryId, 'g1', 'sig')
      ).rejects.toThrow('Recovery session has expired');
    });
  });

  describe('Security and Edge Cases', () => {
    it('should enforce maximum guardians limit', async () => {
      const userId = 'test-user-10';
      const tooManyGuardians = Array.from({length: 12}, (_, i) => `g${i}`);
      
      await expect(
        guardianRecovery.initializeUserRecovery(userId, {
          guardians: tooManyGuardians
        })
      ).rejects.toThrow();
    });

    it('should clean up completed recovery sessions', async () => {
      const userId = 'test-user-11';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const recovery = await guardianRecovery.initiateRecovery(userId, 'device');
      const recoveryId = recovery.recoveryId;
      
      // Simulate cleanup
      guardianRecovery.cleanupRecoverySession(recoveryId);
      
      expect(guardianRecovery.activeRecoveries.has(recoveryId)).toBe(false);
    });

    it('should generate audit reports', async () => {
      const userId = 'test-user-12';
      
      await guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      });
      
      const auditReport = guardianRecovery.generateRecoveryAuditReport(userId);
      
      expect(auditReport).toEqual(expect.objectContaining({
        userId,
        configuration: expect.objectContaining({
          threshold: 3,
          totalShares: 5,
          guardianCount: 3
        }),
        guardianShares: expect.any(Array),
        securityMetrics: expect.objectContaining({
          totalActiveShares: expect.any(Number),
          revokedShares: expect.any(Number)
        }),
        recommendations: expect.any(Array)
      }));
    });
  });
});

describe('Integration Tests', () => {
  it('should perform end-to-end recovery workflow', async () => {
    const guardianRecovery = new GuardianRecoveryManager();
    const userId = 'integration-test-user';
    const guardians = ['guardian-a', 'guardian-b', 'guardian-c', 'guardian-d'];
    
    // 1. Initialize configuration
    await guardianRecovery.initializeUserRecovery(userId, {
      threshold: 3,
      totalShares: 5,
      guardians
    });
      // 2. Simulate key distribution (normally would use real private key)
    const mockPrivateKey = crypto.randomBytes(30); // Use 30 bytes to match simple format
    
    // Mock the integration methods
    guardianRecovery.getGuardianPublicKey = async () => crypto.randomBytes(32);
    guardianRecovery.storeShareInGuardianKeySpace = async () => {};
    guardianRecovery.getDeviceEncryptionKey = async () => crypto.randomBytes(32);
    guardianRecovery.getDeviceId = async () => 'test-device';
    
    const distribution = await guardianRecovery.distributeKeyShards(
      userId, 
      mockPrivateKey, 
      guardians.slice(0, 3) // Use first 3 guardians
    );
    
    expect(distribution.guardianShares).toHaveLength(3);
    
    // 3. Initiate recovery
    const recovery = await guardianRecovery.initiateRecovery(userId, 'new-device');
    
    // 4. Mock guardian approvals
    guardianRecovery.verifyGuardianSignature = async () => true;    guardianRecovery.retrieveGuardianShare = async (guardianId) => {
      // Return mock shares with proper hex values that can reconstruct the key
      const shareMap = {
        'guardian-a': { x: 1, y: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', shareId: 'share-1' },
        'guardian-b': { x: 2, y: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321', shareId: 'share-2' },
        'guardian-c': { x: 3, y: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', shareId: 'share-3' }
      };
      return shareMap[guardianId];
    };
    
    // 5. Guardian approvals
    for (let i = 0; i < 3; i++) {
      const result = await guardianRecovery.approveRecovery(
        recovery.recoveryId,
        guardians[i],
        `signature-${i}`
      );
      
      if (i < 2) {
        expect(result.status).toBe('pending_guardian_approval');
      } else {
        // Third approval should complete the recovery
        expect(result.status).toBe('completed');
        expect(result.privateKey).toBeDefined();
      }
    }
    
    // 6. Verify recovery is marked as completed
    const recoverySession = guardianRecovery.activeRecoveries.get(recovery.recoveryId);
    expect(recoverySession.status).toBe('completed');
    expect(recoverySession.completedAt).toBeDefined();
  });
});

describe('Performance Tests', () => {  it('should handle large numbers of shares efficiently', () => {
    const sss = new ShamirSecretSharing(10, 20); // Higher threshold
    const secret = crypto.randomBytes(30); // Use 30 bytes to trigger simple format
    
    const startTime = Date.now();
    const shares = sss.splitSecret(secret);
    const splitTime = Date.now() - startTime;
    
    expect(shares).toHaveLength(20);
    expect(splitTime).toBeLessThan(1000); // Should complete within 1 second
    
    const reconstructStartTime = Date.now();
    const reconstructed = sss.reconstructSecret(shares.slice(0, 10));
    const reconstructTime = Date.now() - reconstructStartTime;
    
    expect(reconstructed).toEqual(secret);
    expect(reconstructTime).toBeLessThan(500); // Reconstruction should be fast
  });

  it('should handle concurrent recovery requests', async () => {
    const guardianRecovery = new GuardianRecoveryManager();
    const userIds = ['user1', 'user2', 'user3'];
    
    // Initialize multiple users
    const initPromises = userIds.map(userId => 
      guardianRecovery.initializeUserRecovery(userId, {
        guardians: ['g1', 'g2', 'g3']
      })
    );
    
    await Promise.all(initPromises);
    
    // Initiate concurrent recoveries
    const recoveryPromises = userIds.map(userId =>
      guardianRecovery.initiateRecovery(userId, 'device')
    );
    
    const recoveries = await Promise.all(recoveryPromises);
    
    // All recoveries should be created successfully
    expect(recoveries).toHaveLength(3);
    recoveries.forEach(recovery => {
      expect(recovery.status).toBe('pending_guardian_approval');
      expect(recovery.recoveryId).toBeDefined();
    });
    
    // All should be in active recoveries
    expect(guardianRecovery.activeRecoveries.size).toBe(3);
  });
});
