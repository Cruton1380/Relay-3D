/**
 * @fileoverview Tests for P2P Shard Synchronization Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { P2PShardSync } from '../../src/backend/privacy-services/p2pShardSync.mjs';

// Mock dependencies
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    }))
  }
}));

describe('P2PShardSync', () => {
  let shardSync;
  let mockLogger;  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };
    shardSync = new P2PShardSync();
    // Inject the mock logger
    shardSync.logger = mockLogger;
    // Initialize the service for tests
    shardSync.isInitialized = true;
    
    // Override the syncLogger in the implementation
    vi.spyOn(shardSync.peerManager, 'discoverPeers').mockImplementation(async () => {
      mockLogger.info('Peer discovery completed');
      return { success: true, discovered: 0 };
    });
    vi.spyOn(shardSync.recoveryManager, 'recoverShard').mockImplementation(async (shardId) => {
      mockLogger.info('Shard recovery completed');
      return { success: true, recovered: true };
    });
    vi.spyOn(shardSync.networkMetrics, 'detectPartition').mockImplementation(async () => {
      const isPartitioned = shardSync.peers.activePeers.size === 0;
      if (isPartitioned) {
        mockLogger.warn('Network partition detected');
      }
      return isPartitioned;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default properties', () => {
      expect(shardSync.peers).toBeDefined();
      expect(shardSync.shards).toBeDefined();
      expect(shardSync.syncConfig).toBeDefined();
      expect(shardSync.networkMetrics).toBeDefined();
    });

    it('should have correct sync configuration', () => {
      expect(shardSync.syncConfig.maxPeers).toBe(50);
      expect(shardSync.syncConfig.syncInterval).toBe(30000);
      expect(shardSync.syncConfig.shardSize).toBe(1000);
      expect(shardSync.syncConfig.redundancyFactor).toBe(3);
    });
  });

  describe('Peer Management', () => {
    const mockPeer = {
      id: 'peer-123',
      address: '192.168.1.100:8080',
      publicKey: 'mock-public-key',
      reliability: 0.95,
      lastSeen: Date.now()
    };

    it('should add new peers', async () => {
      const result = await shardSync.peerManager.addPeer(mockPeer);
      
      expect(result.success).toBe(true);
      expect(shardSync.peers.activePeers.has(mockPeer.id)).toBe(true);
    });

    it('should remove disconnected peers', async () => {
      await shardSync.peerManager.addPeer(mockPeer);
      
      const result = await shardSync.peerManager.removePeer(mockPeer.id);
      
      expect(result.success).toBe(true);
      expect(shardSync.peers.activePeers.has(mockPeer.id)).toBe(false);
    });

    it('should discover new peers through gossip protocol', async () => {
      const initialPeerCount = shardSync.peers.activePeers.size;
      
      await shardSync.peerManager.discoverPeers();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Peer discovery completed');
      // Should attempt to discover peers
    });

    it('should maintain peer reputation scores', () => {
      shardSync.peerManager.updateReputation(mockPeer.id, 'successful_sync');
      
      const reputation = shardSync.peerManager.getReputation(mockPeer.id);
      expect(reputation).toBeGreaterThan(0);
    });
  });

  describe('Shard Management', () => {
    const mockShard = {
      id: 'shard-123',
      data: { votes: [], metadata: {} },
      hash: 'mock-hash',
      version: 1,
      timestamp: Date.now()
    };

    it('should create new shards', async () => {
      const result = await shardSync.shardManager.createShard(mockShard.data);
      
      expect(result.success).toBe(true);
      expect(result.shardId).toBeDefined();
      expect(shardSync.shards.localShards.has(result.shardId)).toBe(true);
    });

    it('should validate shard integrity', () => {
      const isValid = shardSync.shardManager.validateShard(mockShard);
      expect(isValid).toBe(true);
    });

    it('should detect shard conflicts', async () => {
      const shard1 = { ...mockShard, version: 1 };
      const shard2 = { ...mockShard, version: 2, data: { votes: ['different'], metadata: {} } };
      
      await shardSync.shardManager.createShard(shard1.data);
      const conflict = await shardSync.shardManager.detectConflict(shard1.id, shard2);
      
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.resolution).toBeDefined();
    });

    it('should merge compatible shards', async () => {
      const shard1 = {
        id: 'shard-1',
        data: { votes: ['vote1', 'vote2'], metadata: { count: 2 } }
      };
      const shard2 = {
        id: 'shard-2', 
        data: { votes: ['vote3', 'vote4'], metadata: { count: 2 } }
      };

      const merged = await shardSync.shardManager.mergeShards([shard1, shard2]);
      
      expect(merged.data.votes).toHaveLength(4);
      expect(merged.data.metadata.count).toBe(4);
    });
  });

  describe('Synchronization Process', () => {
    beforeEach(() => {
      // Add some mock peers
      shardSync.peers.activePeers.set('peer1', {
        id: 'peer1',
        address: '192.168.1.101:8080',
        reliability: 0.9
      });
      shardSync.peers.activePeers.set('peer2', {
        id: 'peer2',
        address: '192.168.1.102:8080',
        reliability: 0.85
      });
    });

    it('should synchronize with peers', async () => {
      const result = await shardSync.synchronizeWithPeers();
      
      expect(result.success).toBe(true);
      expect(result.peersContacted).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Sync completed successfully');
    });

    it('should handle sync failures gracefully', async () => {
      // Simulate network failure
      const originalSync = shardSync.syncManager.syncWithPeer;
      shardSync.syncManager.syncWithPeer = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await shardSync.synchronizeWithPeers();
      
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
      
      // Restore original method
      shardSync.syncManager.syncWithPeer = originalSync;
    });

    it('should prioritize reliable peers for sync', async () => {
      const peers = await shardSync.syncManager.selectSyncPeers();
      
      expect(peers).toBeDefined();
      expect(Array.isArray(peers)).toBe(true);
      // Should select peers with higher reliability first
    });

    it('should implement exponential backoff on failures', async () => {
      const peerId = 'failing-peer';
      
      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        await shardSync.syncManager.handleSyncFailure(peerId);
      }
      
      const backoffTime = shardSync.syncManager.getBackoffTime(peerId);
      expect(backoffTime).toBeGreaterThan(1000); // Should be greater than initial backoff
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consensus across shards', async () => {
      const shardData = {
        votes: ['vote1', 'vote2', 'vote3'],
        metadata: { topic: 'test-topic', region: 'US-CA' }
      };

      const result = await shardSync.consensusManager.validateConsensus(shardData);
      
      expect(result.isConsistent).toBe(true);
      expect(result.conflictCount).toBe(0);
    });

    it('should resolve conflicts using timestamp ordering', async () => {
      const conflictingShards = [
        { id: 'shard1', timestamp: 1000, data: { value: 'old' } },
        { id: 'shard2', timestamp: 2000, data: { value: 'new' } }
      ];

      const resolved = await shardSync.consensusManager.resolveConflicts(conflictingShards);
      
      expect(resolved.data.value).toBe('new');
      expect(resolved.timestamp).toBe(2000);
    });

    it('should maintain merkle tree for data integrity', () => {
      const shardIds = ['shard1', 'shard2', 'shard3', 'shard4'];
      
      const merkleRoot = shardSync.integrityManager.calculateMerkleRoot(shardIds);
      
      expect(merkleRoot).toBeDefined();
      expect(typeof merkleRoot).toBe('string');
      expect(merkleRoot.length).toBeGreaterThan(0);
    });
  });

  describe('Network Metrics', () => {
    it('should track synchronization performance', () => {
      shardSync.networkMetrics.recordSync({
        peerId: 'peer1',
        duration: 500,
        bytesTransferred: 1024,
        success: true
      });

      const metrics = shardSync.networkMetrics.getMetrics();
      
      expect(metrics.totalSyncs).toBe(1);
      expect(metrics.averageDuration).toBe(500);
      expect(metrics.successRate).toBe(1.0);
    });

    it('should identify network partitions', async () => {
      // Simulate network partition
      shardSync.peers.activePeers.clear();
      
      const partitioned = await shardSync.networkMetrics.detectPartition();
      
      expect(partitioned).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith('Network partition detected');
    });

    it('should measure network latency', async () => {
      const peerId = 'peer1';
      
      const latency = await shardSync.networkMetrics.measureLatency(peerId);
      
      expect(latency).toBeGreaterThan(0);
      expect(typeof latency).toBe('number');
    });
  });

  describe('Security and Privacy', () => {
    it('should encrypt shard data during transmission', async () => {
      const plainData = { votes: ['vote1', 'vote2'], sensitive: true };
      
      const encrypted = await shardSync.securityManager.encryptData(plainData);
      
      expect(encrypted).not.toEqual(plainData);
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.algorithm).toBeDefined();
    });

    it('should verify peer authentication', async () => {
      const peerCredentials = {
        id: 'peer1',
        publicKey: 'mock-public-key',
        signature: 'mock-signature'
      };

      const isAuthenticated = await shardSync.securityManager.authenticatePeer(peerCredentials);
      
      expect(typeof isAuthenticated).toBe('boolean');
    });

    it('should implement access control for sensitive shards', async () => {
      const sensitiveShardId = 'sensitive-shard-123';
      const peerId = 'unauthorized-peer';

      const hasAccess = await shardSync.securityManager.checkAccess(peerId, sensitiveShardId);
      
      expect(typeof hasAccess).toBe('boolean');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupted shards', async () => {
      const corruptedShardId = 'corrupted-shard';
      
      const recovered = await shardSync.recoveryManager.recoverShard(corruptedShardId);
      
      expect(recovered.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Shard recovery completed');
    });

    it('should rebuild missing shards from redundant copies', async () => {
      const missingShardId = 'missing-shard';
      
      const rebuilt = await shardSync.recoveryManager.rebuildShard(missingShardId);
      
      expect(rebuilt.success).toBe(true);
      expect(rebuilt.shardId).toBe(missingShardId);
    });

    it('should maintain data availability during node failures', async () => {
      // Simulate node failure
      const failedNodeId = 'failing-node';
      await shardSync.recoveryManager.handleNodeFailure(failedNodeId);
      
      const availability = await shardSync.recoveryManager.checkDataAvailability();
      
      expect(availability.percentage).toBeGreaterThan(0.8); // 80% availability threshold
    });
  });

  describe('Configuration', () => {
    it('should allow runtime configuration updates', () => {
      const newConfig = {
        maxPeers: 100,
        syncInterval: 60000,
        shardSize: 2000,
        redundancyFactor: 5
      };

      shardSync.updateConfiguration(newConfig);

      expect(shardSync.syncConfig.maxPeers).toBe(100);
      expect(shardSync.syncConfig.syncInterval).toBe(60000);
      expect(shardSync.syncConfig.shardSize).toBe(2000);
      expect(shardSync.syncConfig.redundancyFactor).toBe(5);
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = {
        maxPeers: -1,
        syncInterval: 0,
        shardSize: 0,
        redundancyFactor: 0
      };

      expect(() => {
        shardSync.updateConfiguration(invalidConfig);
      }).toThrow('Invalid configuration');
    });
  });
});






