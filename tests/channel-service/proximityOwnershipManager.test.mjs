/**
 * @fileoverview Test for Proximity Ownership Manager
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import proximityOwnershipManager from '../../src/backend/channel-service/proximityOwnershipManager.mjs';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
}));

describe('Proximity Ownership Manager', () => {
  const testUserId = 'test-user-123';
  const testChannelId = 'test-channel-456';
  
  beforeEach(async () => {
    // Reset the mock implementations
    vi.clearAllMocks();
    
    // Initialize with mocked filesystem
    await proximityOwnershipManager.initialize();
    
    // Reset the manager state
    proximityOwnershipManager.verifiedOwners = new Map();
    proximityOwnershipManager.pendingResets = new Map();
    
    // Set initialized flag to true
    proximityOwnershipManager.initialized = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Reset Claim Process', () => {
    it('should initiate a reset claim successfully', async () => {
      const signalData = {
        type: 'wifi',
        ssid: 'TestNetwork',
        bssid: '00:11:22:33:44:55',
        channel: 6
      };
      
      const result = await proximityOwnershipManager.initiateResetClaim(
        testUserId,
        testChannelId,
        signalData
      );
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Basic reset claim initiated');
      expect(proximityOwnershipManager.pendingResets.has(testChannelId)).toBe(true);
      
      const pendingReset = proximityOwnershipManager.pendingResets.get(testChannelId);
      expect(pendingReset.userId).toBe(testUserId);
      expect(pendingReset.channelId).toBe(testChannelId);
    });

    it('should prevent multiple reset claims from same user', async () => {
      // Setup an existing reset
      proximityOwnershipManager.pendingResets.set('existing-channel', {
        userId: testUserId,
        channelId: 'existing-channel',
        timestamp: Date.now(),
        originalSignature: {}
      });
      
      const result = await proximityOwnershipManager.initiateResetClaim(
        testUserId,
        testChannelId,
        { type: 'wifi', bssid: '00:11:22:33:44:55' }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already has a pending reset claim');
    });
    
    it('should verify disappearance correctly', () => {
      // Setup a pending reset
      proximityOwnershipManager.pendingResets.set(testChannelId, {
        userId: testUserId,
        timestamp: Date.now(),
        originalSignature: { type: 'wifi', bssid: '00:11:22:33:44:55' },
        channelId: testChannelId
      });
      
      const result = proximityOwnershipManager.verifyChannelDisappearance(testChannelId);
      
      expect(result).toBe(true);
      
      const pendingReset = proximityOwnershipManager.pendingResets.get(testChannelId);
      expect(pendingReset.disappeared).toBe(true);
      expect(pendingReset.disappearanceTime).toBeDefined();
    });
    
    it('should verify reappearance and complete ownership claim', async () => {
      const now = Date.now();
      
      // Setup a pending reset that has disappeared
      proximityOwnershipManager.pendingResets.set(testChannelId, {
        userId: testUserId,
        timestamp: now - 5000, // 5 seconds ago
        disappearanceTime: now - 3000, // 3 seconds ago
        disappeared: true,
        originalSignature: { 
          type: 'wifi',
          ssid: 'TestNetwork',
          bssid: '00:11:22:33:44:55',
          channel: 6
        },
        channelId: testChannelId
      });
      
      const signalData = {
        type: 'wifi',
        ssid: 'TestNetwork',
        bssid: '00:11:22:33:44:55',
        channel: 6
      };
      
      const result = await proximityOwnershipManager.verifyChannelReappearance(
        testChannelId,
        signalData
      );
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Channel ownership verified successfully');
      expect(result.isVerifiedOwner).toBe(true);
      
      // Should be marked as verified owner
      expect(proximityOwnershipManager.verifiedOwners.get(testChannelId)).toBe(testUserId);
      
      // Pending reset should be removed
      expect(proximityOwnershipManager.pendingResets.has(testChannelId)).toBe(false);
      
      // Verify file was saved
      expect(fs.writeFile).toHaveBeenCalled();
    });
    
    it('should fail reappearance verification if signatures mismatch', async () => {
      // Setup a pending reset that has disappeared
      proximityOwnershipManager.pendingResets.set(testChannelId, {
        userId: testUserId,
        timestamp: Date.now() - 5000,
        disappearanceTime: Date.now() - 3000,
        disappeared: true,
        originalSignature: { 
          type: 'wifi',
          ssid: 'OriginalNetwork',
          bssid: '00:11:22:33:44:55',
          channel: 6
        },
        channelId: testChannelId
      });
      
      // Different SSID from original
      const differentSignalData = {
        type: 'wifi',
        ssid: 'DifferentNetwork',
        bssid: '00:11:22:33:44:55',
        channel: 6
      };
      
      const result = await proximityOwnershipManager.verifyChannelReappearance(
        testChannelId,
        differentSignalData
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not match the original');
      
      // Should not be marked as verified owner
      expect(proximityOwnershipManager.verifiedOwners.has(testChannelId)).toBe(false);
    });
  });

  describe('Owner Verification', () => {
    it('should correctly identify verified owners', () => {
      // Setup a verified owner
      proximityOwnershipManager.verifiedOwners.set(testChannelId, testUserId);
      
      const isOwner = proximityOwnershipManager.isVerifiedOwner(testChannelId, testUserId);
      expect(isOwner).toBe(true);
      
      const isNotOwner = proximityOwnershipManager.isVerifiedOwner(testChannelId, 'other-user');
      expect(isNotOwner).toBe(false);
    });
    
    it('should return owned channels for a user', () => {
      // Setup multiple verified channels
      proximityOwnershipManager.verifiedOwners.set(testChannelId, testUserId);
      proximityOwnershipManager.verifiedOwners.set('channel-2', testUserId);
      proximityOwnershipManager.verifiedOwners.set('channel-3', 'other-user');
      
      const userChannels = proximityOwnershipManager.getUserOwnedChannels(testUserId);
      
      expect(userChannels).toHaveLength(2);
      expect(userChannels).toContain(testChannelId);
      expect(userChannels).toContain('channel-2');
      expect(userChannels).not.toContain('channel-3');
    });
  });
});






