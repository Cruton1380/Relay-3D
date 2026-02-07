/**
 * KeySpace Storage Node
 * Manages local storage node functionality for Relay P2P storage market
 * Handles storage offers, pricing, capacity management, and peer communication
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class KeySpaceStorageNode extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.nodeId = options.nodeId || this.generateNodeId();
    this.peerId = options.peerId || null; // Set by libp2p integration
    this.storageDirectory = options.storageDirectory || './relay-storage';
    this.maxStorageGB = options.maxStorageGB || 10;
    this.pricePerGBPerMonth = options.pricePerGBPerMonth || 0; // 0 = free storage
    this.isGuardianNode = options.isGuardianNode || false;
    this.allowPublicStorage = options.allowPublicStorage !== false;
    this.trustedPeersOnly = options.trustedPeersOnly || false;
    
    // Node status
    this.isOnline = false;
    this.startTime = null;
    this.storageStats = {
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
      fileCount: 0,
      shardCount: 0
    };
    
    // Storage registry
    this.storedShards = new Map(); // shardId -> shard metadata
    this.accessLog = [];
    this.healthChecks = new Map(); // peerId -> last check timestamp
    
    // Pricing and payment tracking
    this.storageContracts = new Map(); // contractId -> contract details
    this.paymentMethods = {
      btc: options.btcAddress || null,
      xmr: options.xmrAddress || null,
      credits: true // Relay internal credits
    };
    
    // Security settings
    this.maxShardsPerPeer = options.maxShardsPerPeer || 100;
    this.requireIdentityBadge = options.requireIdentityBadge || false;
    this.allowedBadges = options.allowedBadges || ['verified', 'moderator', 'trusted'];
    
    this.initializeStorage();
  }

  /**
   * Initialize storage node and prepare storage directory
   */
  async initializeStorage() {
    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.storageDirectory, { recursive: true });
      
      // Create subdirectories for organization
      await fs.mkdir(path.join(this.storageDirectory, 'shards'), { recursive: true });
      await fs.mkdir(path.join(this.storageDirectory, 'metadata'), { recursive: true });
      await fs.mkdir(path.join(this.storageDirectory, 'contracts'), { recursive: true });
      
      // Load existing storage data
      await this.loadStorageData();
      
      // Update storage statistics
      await this.updateStorageStats();
      
      console.log(`Storage node ${this.nodeId} initialized`);
      console.log(`Storage directory: ${this.storageDirectory}`);
      console.log(`Max capacity: ${this.maxStorageGB} GB`);
      
    } catch (error) {
      console.error('Storage node initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start storage node and begin accepting storage requests
   */
  async startNode() {
    try {
      this.isOnline = true;
      this.startTime = new Date();
      
      // Start periodic health checks and maintenance
      this.startMaintenanceTasks();
      
      // Advertise storage availability
      await this.advertiseStorageOffer();
      
      console.log(`Storage node ${this.nodeId} started and online`);
      this.emit('nodeStarted', { nodeId: this.nodeId, timestamp: this.startTime });
      
    } catch (error) {
      console.error('Failed to start storage node:', error);
      this.isOnline = false;
      throw error;
    }
  }

  /**
   * Stop storage node gracefully
   */
  async stopNode() {
    try {
      this.isOnline = false;
      
      // Clear maintenance intervals
      if (this.maintenanceInterval) {
        clearInterval(this.maintenanceInterval);
      }
      
      // Save current state
      await this.saveStorageData();
      
      console.log(`Storage node ${this.nodeId} stopped`);
      this.emit('nodeStopped', { nodeId: this.nodeId, uptime: this.getUptime() });
      
    } catch (error) {
      console.error('Error stopping storage node:', error);
      throw error;
    }
  }

  /**
   * Store an encrypted shard from a client
   */
  async storeShard(shardData, shardMetadata, clientPeerId, contractTerms = {}) {
    try {
      // Validate storage request
      await this.validateStorageRequest(shardData, shardMetadata, clientPeerId, contractTerms);
      
      // Generate shard storage ID
      const shardId = this.generateShardId(shardMetadata);
      
      // Check if we already have this shard
      if (this.storedShards.has(shardId)) {
        throw new Error('Shard already exists on this node');
      }
      
      // Verify we have enough space
      if (this.storageStats.freeSpace < shardData.length) {
        throw new Error('Insufficient storage space');
      }
      
      // Store shard data to disk
      const shardPath = path.join(this.storageDirectory, 'shards', `${shardId}.shard`);
      await fs.writeFile(shardPath, shardData);
      
      // Store shard metadata
      const metadataPath = path.join(this.storageDirectory, 'metadata', `${shardId}.json`);
      const fullMetadata = {
        ...shardMetadata,
        shardId,
        clientPeerId,
        storedAt: new Date().toISOString(),
        storageNode: this.nodeId,
        size: shardData.length,
        hash: await this.calculateShardHash(shardData),
        contractTerms
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(fullMetadata, null, 2));
      
      // Update internal registry
      this.storedShards.set(shardId, fullMetadata);
      
      // Create storage contract if payment is involved
      if (contractTerms.pricePerGB > 0) {
        await this.createStorageContract(shardId, clientPeerId, contractTerms);
      }
      
      // Update storage statistics
      await this.updateStorageStats();
      
      // Log storage event
      this.logStorageEvent('shard_stored', {
        shardId,
        clientPeerId,
        size: shardData.length,
        isGuardian: this.isGuardianNode
      });
      
      console.log(`Shard ${shardId} stored successfully (${shardData.length} bytes)`);
      this.emit('shardStored', { shardId, clientPeerId, size: shardData.length });
      
      return {
        success: true,
        shardId,
        storageNode: this.nodeId,
        storedAt: fullMetadata.storedAt,
        hash: fullMetadata.hash
      };
      
    } catch (error) {
      console.error('Shard storage failed:', error);
      throw new Error(`Storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a stored shard for a client
   */
  async retrieveShard(shardId, clientPeerId, proofChallenge = null) {
    try {
      // Verify shard exists
      if (!this.storedShards.has(shardId)) {
        throw new Error('Shard not found on this node');
      }
      
      const shardMetadata = this.storedShards.get(shardId);
      
      // Verify client has access rights
      await this.verifyShardAccess(shardId, clientPeerId, shardMetadata);
      
      // Handle proof-of-storage challenge if provided
      if (proofChallenge) {
        const proofResponse = await this.generateStorageProof(shardId, proofChallenge);
        if (!proofResponse.valid) {
          throw new Error('Storage proof verification failed');
        }
      }
      
      // Read shard data from disk
      const shardPath = path.join(this.storageDirectory, 'shards', `${shardId}.shard`);
      const shardData = await fs.readFile(shardPath);
      
      // Verify data integrity
      const computedHash = await this.calculateShardHash(shardData);
      if (computedHash !== shardMetadata.hash) {
        throw new Error('Shard data integrity verification failed');
      }
      
      // Log retrieval event
      this.logStorageEvent('shard_retrieved', {
        shardId,
        clientPeerId,
        size: shardData.length
      });
      
      console.log(`Shard ${shardId} retrieved successfully`);
      this.emit('shardRetrieved', { shardId, clientPeerId, size: shardData.length });
      
      return {
        shardData,
        metadata: shardMetadata,
        hash: computedHash,
        retrievedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Shard retrieval failed:', error);
      throw new Error(`Retrieval failed: ${error.message}`);
    }
  }

  /**
   * Delete a stored shard
   */
  async deleteShard(shardId, clientPeerId) {
    try {
      if (!this.storedShards.has(shardId)) {
        throw new Error('Shard not found');
      }
      
      const shardMetadata = this.storedShards.get(shardId);
      
      // Verify deletion authority
      if (shardMetadata.clientPeerId !== clientPeerId && !this.isGuardianNode) {
        throw new Error('Unauthorized deletion request');
      }
      
      // Delete shard file
      const shardPath = path.join(this.storageDirectory, 'shards', `${shardId}.shard`);
      await fs.unlink(shardPath);
      
      // Delete metadata file
      const metadataPath = path.join(this.storageDirectory, 'metadata', `${shardId}.json`);
      await fs.unlink(metadataPath);
      
      // Remove from internal registry
      this.storedShards.delete(shardId);
      
      // Update storage statistics
      await this.updateStorageStats();
      
      // Log deletion event
      this.logStorageEvent('shard_deleted', {
        shardId,
        clientPeerId,
        size: shardMetadata.size
      });
      
      console.log(`Shard ${shardId} deleted successfully`);
      this.emit('shardDeleted', { shardId, clientPeerId });
      
      return { success: true, deletedAt: new Date().toISOString() };
      
    } catch (error) {
      console.error('Shard deletion failed:', error);
      throw new Error(`Deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate storage node advertisement for discovery
   */
  async generateStorageOffer() {
    await this.updateStorageStats();
    
    return {
      nodeId: this.nodeId,
      peerId: this.peerId,
      timestamp: new Date().toISOString(),
      
      // Capacity information
      storage: {
        totalCapacityGB: this.maxStorageGB,
        freeCapacityGB: this.storageStats.freeSpace / (1024**3),
        usedCapacityGB: this.storageStats.usedSpace / (1024**3),
        utilizationPercent: (this.storageStats.usedSpace / (this.maxStorageGB * 1024**3)) * 100
      },
      
      // Pricing information
      pricing: {
        pricePerGBPerMonth: this.pricePerGBPerMonth,
        currency: 'USD_equivalent',
        paymentMethods: this.paymentMethods,
        freeStorage: this.pricePerGBPerMonth === 0
      },
      
      // Node characteristics
      node: {
        isGuardianNode: this.isGuardianNode,
        allowPublicStorage: this.allowPublicStorage,
        trustedPeersOnly: this.trustedPeersOnly,
        requireIdentityBadge: this.requireIdentityBadge,
        allowedBadges: this.allowedBadges,
        maxShardsPerPeer: this.maxShardsPerPeer
      },
      
      // Performance metrics
      metrics: {
        uptime: this.getUptime(),
        isOnline: this.isOnline,
        totalShards: this.storageStats.shardCount,
        avgResponseTime: this.calculateAverageResponseTime(),
        reliabilityScore: this.calculateReliabilityScore()
      },
      
      // Network information
      network: {
        protocols: ['relay-storage-v1', 'webrtc', 'noise'],
        natTraversal: true,
        torSupport: true,
        regions: ['auto-detect'] // Will be filled by location service
      }
    };
  }

  /**
   * Validate incoming storage request
   */
  async validateStorageRequest(shardData, shardMetadata, clientPeerId, contractTerms) {
    // Check node capacity
    if (this.storageStats.freeSpace < shardData.length) {
      throw new Error('Insufficient storage capacity');
    }
    
    // Check peer limits
    const peerShardCount = this.getPeerShardCount(clientPeerId);
    if (peerShardCount >= this.maxShardsPerPeer) {
      throw new Error(`Peer shard limit exceeded: ${this.maxShardsPerPeer}`);
    }
    
    // Check if node is accepting public storage
    if (!this.allowPublicStorage && !this.isGuardianNode) {
      throw new Error('Node not accepting public storage requests');
    }
    
    // Validate shard metadata
    if (!shardMetadata || !shardMetadata.index !== undefined || !shardMetadata.hash) {
      throw new Error('Invalid shard metadata');
    }
    
    // Verify shard data integrity
    const computedHash = await this.calculateShardHash(shardData);
    if (computedHash !== shardMetadata.hash) {
      throw new Error('Shard data integrity verification failed');
    }
    
    return true;
  }

  /**
   * Verify client access to shard
   */
  async verifyShardAccess(shardId, clientPeerId, shardMetadata) {
    // Basic access: original client can always access
    if (shardMetadata.clientPeerId === clientPeerId) {
      return true;
    }
    
    // Guardian access: guardians can access shards they store
    if (this.isGuardianNode && shardMetadata.guardianAccess) {
      return true;
    }
    
    // Check if client has been granted access (for shared files)
    if (shardMetadata.authorizedPeers && shardMetadata.authorizedPeers.includes(clientPeerId)) {
      return true;
    }
    
    throw new Error('Unauthorized shard access');
  }

  /**
   * Generate storage proof for challenge-response verification
   */
  async generateStorageProof(shardId, challenge) {
    try {
      const shardPath = path.join(this.storageDirectory, 'shards', `${shardId}.shard`);
      const shardData = await fs.readFile(shardPath);
      
      // Generate proof based on challenge
      const proof = crypto.createHash('sha256')
        .update(shardData.slice(challenge.offset, challenge.offset + challenge.length))
        .update(challenge.nonce)
        .digest('hex');
      
      return {
        valid: true,
        proof,
        timestamp: new Date().toISOString(),
        challengeId: challenge.id
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate shard hash for integrity verification
   */
  async calculateShardHash(shardData) {
    return crypto.createHash('sha256').update(shardData).digest('hex');
  }

  /**
   * Generate unique shard ID
   */
  generateShardId(shardMetadata) {
    const content = `${shardMetadata.filename}-${shardMetadata.index}-${shardMetadata.hash}`;
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 32);
  }

  /**
   * Generate unique node ID
   */
  generateNodeId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Update storage statistics
   */
  async updateStorageStats() {
    try {
      let totalSize = 0;
      let fileCount = 0;
      
      // Calculate used space from stored shards
      for (const [shardId, metadata] of this.storedShards) {
        totalSize += metadata.size || 0;
        fileCount++;
      }
      
      this.storageStats = {
        totalSpace: this.maxStorageGB * 1024**3,
        usedSpace: totalSize,
        freeSpace: (this.maxStorageGB * 1024**3) - totalSize,
        fileCount: fileCount,
        shardCount: this.storedShards.size
      };
      
    } catch (error) {
      console.error('Failed to update storage stats:', error);
    }
  }

  /**
   * Load existing storage data on startup
   */
  async loadStorageData() {
    try {
      const metadataDir = path.join(this.storageDirectory, 'metadata');
      const metadataFiles = await fs.readdir(metadataDir);
      
      for (const file of metadataFiles) {
        if (file.endsWith('.json')) {
          const metadataPath = path.join(metadataDir, file);
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          this.storedShards.set(metadata.shardId, metadata);
        }
      }
      
      console.log(`Loaded ${this.storedShards.size} existing shards`);
      
    } catch (error) {
      console.log('No existing storage data found or failed to load:', error.message);
    }
  }

  /**
   * Save storage data to disk
   */
  async saveStorageData() {
    // Storage data is automatically saved with each shard operation
    // This method can be used for periodic backups or graceful shutdown
    console.log(`Storage data saved: ${this.storedShards.size} shards`);
  }

  /**
   * Start periodic maintenance tasks
   */
  startMaintenanceTasks() {
    this.maintenanceInterval = setInterval(async () => {
      try {
        await this.performMaintenanceTasks();
      } catch (error) {
        console.error('Maintenance task failed:', error);
      }
    }, 60000); // Run every minute
  }

  /**
   * Perform routine maintenance tasks
   */
  async performMaintenanceTasks() {
    // Update storage statistics
    await this.updateStorageStats();
    
    // Clean up expired contracts
    await this.cleanupExpiredContracts();
    
    // Verify shard integrity periodically
    await this.performIntegrityChecks();
    
    // Update storage offer advertisement
    if (this.isOnline) {
      await this.advertiseStorageOffer();
    }
  }

  /**
   * Advertise storage offer to network
   */
  async advertiseStorageOffer() {
    const offer = await this.generateStorageOffer();
    this.emit('storageOfferGenerated', offer);
    
    // This would integrate with libp2p pubsub for network advertisement
    console.log(`Storage offer advertised: ${offer.storage.freeCapacityGB.toFixed(2)} GB available`);
  }

  /**
   * Get node uptime in seconds
   */
  getUptime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Get number of shards stored for a specific peer
   */
  getPeerShardCount(peerId) {
    let count = 0;
    for (const [shardId, metadata] of this.storedShards) {
      if (metadata.clientPeerId === peerId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Calculate average response time (placeholder)
   */
  calculateAverageResponseTime() {
    // Would track actual response times in production
    return 150; // milliseconds
  }

  /**
   * Calculate reliability score based on uptime and performance
   */
  calculateReliabilityScore() {
    const uptime = this.getUptime();
    const uptimeHours = uptime / 3600;
    
    if (uptimeHours < 1) return 0.5;
    if (uptimeHours < 24) return 0.7;
    if (uptimeHours < 168) return 0.8; // 1 week
    return 0.95;
  }

  /**
   * Create storage contract for paid storage
   */
  async createStorageContract(shardId, clientPeerId, contractTerms) {
    const contractId = crypto.randomBytes(16).toString('hex');
    
    const contract = {
      contractId,
      shardId,
      clientPeerId,
      storageNode: this.nodeId,
      terms: contractTerms,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (contractTerms.durationDays * 24 * 60 * 60 * 1000)).toISOString(),
      status: 'active',
      paymentStatus: 'pending'
    };
    
    this.storageContracts.set(contractId, contract);
    
    // Save contract to disk
    const contractPath = path.join(this.storageDirectory, 'contracts', `${contractId}.json`);
    await fs.writeFile(contractPath, JSON.stringify(contract, null, 2));
    
    return contract;
  }

  /**
   * Clean up expired contracts
   */
  async cleanupExpiredContracts() {
    const now = new Date();
    
    for (const [contractId, contract] of this.storageContracts) {
      if (new Date(contract.expiresAt) < now) {
        // Contract expired - handle cleanup
        console.log(`Contract ${contractId} expired, cleaning up`);
        
        // Delete associated shard if payment wasn't received
        if (contract.paymentStatus !== 'paid') {
          try {
            await this.deleteShard(contract.shardId, contract.clientPeerId);
          } catch (error) {
            console.error(`Failed to delete expired shard ${contract.shardId}:`, error);
          }
        }
        
        this.storageContracts.delete(contractId);
        
        // Delete contract file
        const contractPath = path.join(this.storageDirectory, 'contracts', `${contractId}.json`);
        try {
          await fs.unlink(contractPath);
        } catch (error) {
          console.error(`Failed to delete contract file ${contractId}:`, error);
        }
      }
    }
  }

  /**
   * Perform periodic integrity checks on stored shards
   */
  async performIntegrityChecks() {
    // Check a subset of shards each maintenance cycle
    const shardsToCheck = Array.from(this.storedShards.keys()).slice(0, 5);
    
    for (const shardId of shardsToCheck) {
      try {
        const shardPath = path.join(this.storageDirectory, 'shards', `${shardId}.shard`);
        const shardData = await fs.readFile(shardPath);
        const computedHash = await this.calculateShardHash(shardData);
        const expectedHash = this.storedShards.get(shardId).hash;
        
        if (computedHash !== expectedHash) {
          console.error(`Integrity check failed for shard ${shardId}`);
          this.emit('integrityCheckFailed', { shardId, expectedHash, computedHash });
        }
      } catch (error) {
        console.error(`Integrity check error for shard ${shardId}:`, error);
      }
    }
  }

  /**
   * Log storage events for audit trail
   */
  logStorageEvent(eventType, eventData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      nodeId: this.nodeId,
      ...eventData
    };
    
    this.accessLog.push(logEntry);
    
    // Keep only last 1000 log entries
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
    
    // Emit event for external logging systems
    this.emit('storageEvent', logEntry);
  }

  /**
   * Get storage node statistics and health information
   */
  getNodeStatus() {
    return {
      nodeId: this.nodeId,
      peerId: this.peerId,
      isOnline: this.isOnline,
      uptime: this.getUptime(),
      storage: this.storageStats,
      contracts: {
        active: Array.from(this.storageContracts.values()).filter(c => c.status === 'active').length,
        total: this.storageContracts.size
      },
      recentEvents: this.accessLog.slice(-10),
      configuration: {
        maxStorageGB: this.maxStorageGB,
        pricePerGBPerMonth: this.pricePerGBPerMonth,
        isGuardianNode: this.isGuardianNode,
        allowPublicStorage: this.allowPublicStorage,
        trustedPeersOnly: this.trustedPeersOnly
      }
    };
  }
}

export default KeySpaceStorageNode;
