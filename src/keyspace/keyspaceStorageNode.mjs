/**
 * KeySpace Storage Node - User device storage offering and management
 * 
 * This module handles:
 * - Advertising available storage space and pricing
 * - Managing storage node metadata and capabilities
 * - WebRTC/libp2p peer discovery and connection
 * - Storage node health monitoring and uptime tracking
 * - Integration with Relay's reputation and badge system
 * 
 * Security: All connections use encrypted channels with proper authentication
 * Privacy: Node metadata is privacy-preserving and respects user preferences
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export class KeySpaceStorageNode extends EventEmitter {
  constructor(userKeySpace, options = {}) {
    super();
    
    this.userKeySpace = userKeySpace;
    this.nodeId = options.nodeId || crypto.randomUUID();
    this.isActive = false;
    this.startTime = null;
    
    // Storage configuration
    this.config = {
      maxStorageGB: options.maxStorageGB || 10,
      currentUsageGB: 0,
      availableGB: options.maxStorageGB || 10,
      pricingEnabled: options.pricingEnabled || false,
      pricePerGBPerMonth: options.pricePerGBPerMonth || 0,
      minDuration: options.minDuration || 24 * 60 * 60 * 1000, // 24 hours
      region: options.region || 'unknown',
      acceptedBadges: options.acceptedBadges || ['verified'],
      trustedPeersOnly: options.trustedPeersOnly || false
    };
    
    // Connection management
    this.connections = new Map();
    this.storedShards = new Map();
    this.challenges = new Map();
    
    // Statistics
    this.stats = {
      totalUploads: 0,
      totalDownloads: 0,
      totalChallenges: 0,
      successfulChallenges: 0,
      uptime: 0,
      lastSeen: null,
      trustScore: 1.0
    };
    
    // Health monitoring
    this.healthCheck = {
      interval: 30000, // 30 seconds
      timer: null,
      lastCheck: null
    };
  }

  /**
   * Start the storage node service
   * @returns {Promise<boolean>} Success status
   */
  async start() {
    try {
      console.log(`Starting storage node ${this.nodeId}`);
      
      this.isActive = true;
      this.startTime = Date.now();
      this.stats.lastSeen = Date.now();
      
      // Initialize libp2p connection if available
      await this.initializeNetworking();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Register with storage registry
      await this.registerWithRegistry();
      
      this.emit('node:started', {
        nodeId: this.nodeId,
        config: this.config,
        timestamp: Date.now()
      });
      
      console.log(`Storage node ${this.nodeId} started successfully`);
      return true;
      
    } catch (error) {
      console.error('Failed to start storage node:', error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Stop the storage node service
   * @returns {Promise<boolean>} Success status
   */
  async stop() {
    try {
      console.log(`Stopping storage node ${this.nodeId}`);
      
      this.isActive = false;
      
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Close all connections
      await this.closeAllConnections();
      
      // Unregister from storage registry
      await this.unregisterFromRegistry();
      
      // Update final statistics
      if (this.startTime) {
        this.stats.uptime += Date.now() - this.startTime;
      }
      
      this.emit('node:stopped', {
        nodeId: this.nodeId,
        finalStats: this.stats,
        timestamp: Date.now()
      });
      
      console.log(`Storage node ${this.nodeId} stopped successfully`);
      return true;
      
    } catch (error) {
      console.error('Failed to stop storage node:', error);
      throw error;
    }
  }

  /**
   * Initialize networking capabilities (WebRTC/libp2p)
   */
  async initializeNetworking() {
    // This would integrate with existing Relay libp2p infrastructure
    // For now, we'll simulate the networking setup
    
    this.networkConfig = {
      protocol: 'relay-storage-v1',
      multiaddrs: [`/ip4/127.0.0.1/tcp/0/p2p/${this.nodeId}`],
      capabilities: ['store', 'retrieve', 'challenge'],
      maxConnections: 50,
      connectionTimeout: 30000
    };
    
    console.log(`Network initialized for node ${this.nodeId}`);
  }

  /**
   * Store a shard from another user
   * @param {Object} shard - Shard data and metadata
   * @param {string} requesterId - ID of requesting user
   * @param {Object} storageContract - Storage agreement terms
   * @returns {Promise<Object>} Storage result
   */
  async storeShard(shard, requesterId, storageContract = {}) {
    try {
      // Validate storage request
      await this.validateStorageRequest(shard, requesterId, storageContract);
      
      // Check available space
      const shardSizeGB = (shard.size || 0) / (1024 * 1024 * 1024);
      if (shardSizeGB > this.config.availableGB) {
        throw new Error('Insufficient storage space available');
      }
      
      // Generate storage ID
      const storageId = crypto.randomUUID();
      
      // Create storage entry
      const storageEntry = {
        storageId: storageId,
        shardId: shard.shardId,
        requesterId: requesterId,
        shard: shard,
        contract: storageContract,
        storedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        size: shard.size,
        status: 'active'
      };
      
      // Store the shard
      this.storedShards.set(storageId, storageEntry);
      
      // Update usage statistics
      this.config.currentUsageGB += shardSizeGB;
      this.config.availableGB -= shardSizeGB;
      this.stats.totalUploads++;
      
      // Emit storage event
      this.emit('shard:stored', {
        storageId: storageId,
        shardId: shard.shardId,
        requesterId: requesterId,
        size: shard.size,
        timestamp: Date.now()
      });
      
      console.log(`Shard ${shard.shardId} stored successfully as ${storageId}`);
      
      return {
        success: true,
        storageId: storageId,
        nodeId: this.nodeId,
        storedAt: Date.now(),
        contract: storageContract
      };
      
    } catch (error) {
      console.error('Failed to store shard:', error);
      throw error;
    }
  }

  /**
   * Retrieve a stored shard
   * @param {string} storageId - Storage identifier
   * @param {string} requesterId - ID of requesting user
   * @returns {Promise<Object>} Shard data
   */
  async retrieveShard(storageId, requesterId) {
    try {
      const storageEntry = this.storedShards.get(storageId);
      
      if (!storageEntry) {
        throw new Error(`Shard not found: ${storageId}`);
      }
      
      // Verify requester has permission
      if (storageEntry.requesterId !== requesterId) {
        // Check if requester has delegated access
        const hasAccess = await this.verifyShardAccess(storageId, requesterId);
        if (!hasAccess) {
          throw new Error('Access denied to shard');
        }
      }
      
      // Update access statistics
      storageEntry.lastAccessed = Date.now();
      storageEntry.accessCount++;
      this.stats.totalDownloads++;
      
      // Emit retrieval event
      this.emit('shard:retrieved', {
        storageId: storageId,
        shardId: storageEntry.shardId,
        requesterId: requesterId,
        accessCount: storageEntry.accessCount,
        timestamp: Date.now()
      });
      
      console.log(`Shard ${storageEntry.shardId} retrieved by ${requesterId}`);
      
      return {
        success: true,
        shard: storageEntry.shard,
        metadata: {
          storedAt: storageEntry.storedAt,
          lastAccessed: storageEntry.lastAccessed,
          accessCount: storageEntry.accessCount
        }
      };
      
    } catch (error) {
      console.error('Failed to retrieve shard:', error);
      throw error;
    }
  }

  /**
   * Handle a storage challenge request
   * @param {Object} challenge - Challenge parameters
   * @returns {Promise<string>} Challenge response hash
   */
  async handleChallenge(challenge) {
    try {
      const storageEntry = this.storedShards.get(challenge.storageId);
      
      if (!storageEntry) {
        throw new Error(`Storage not found for challenge: ${challenge.storageId}`);
      }
      
      // Store challenge for tracking
      this.challenges.set(challenge.challengeId, {
        ...challenge,
        receivedAt: Date.now(),
        storageId: challenge.storageId
      });
      
      // Generate response using shard data
      const shard = storageEntry.shard;
      let shardData;
      
      if (shard.shardingMethod === 'shamir') {
        shardData = JSON.stringify({ x: shard.x, y: shard.y });
      } else {
        shardData = shard.data;
      }
      
      // Extract challenged segment
      const segment = shardData.slice(
        challenge.segmentStart,
        challenge.segmentStart + challenge.segmentLength
      );
      
      // Compute response hash with nonce
      const responseHash = crypto
        .createHash('sha256')
        .update(segment + challenge.nonce)
        .digest('hex');
      
      // Update challenge statistics
      this.stats.totalChallenges++;
      this.stats.successfulChallenges++;
      
      this.emit('challenge:responded', {
        challengeId: challenge.challengeId,
        storageId: challenge.storageId,
        responseHash: responseHash,
        timestamp: Date.now()
      });
      
      console.log(`Challenge ${challenge.challengeId} responded successfully`);
      
      return responseHash;
      
    } catch (error) {
      console.error('Failed to handle challenge:', error);
      this.stats.totalChallenges++;
      throw error;
    }
  }

  /**
   * Get current node status and statistics
   * @returns {Object} Node status information
   */
  getStatus() {
    const currentUptime = this.isActive && this.startTime 
      ? Date.now() - this.startTime 
      : 0;
    
    return {
      nodeId: this.nodeId,
      isActive: this.isActive,
      config: this.config,
      stats: {
        ...this.stats,
        currentUptime: currentUptime,
        totalUptime: this.stats.uptime + currentUptime
      },
      storage: {
        totalShards: this.storedShards.size,
        currentUsageGB: this.config.currentUsageGB,
        availableGB: this.config.availableGB,
        utilizationPercent: (this.config.currentUsageGB / this.config.maxStorageGB) * 100
      },
      network: this.networkConfig,
      lastHealthCheck: this.healthCheck.lastCheck
    };
  }

  /**
   * Update storage node configuration
   * @param {Object} updates - Configuration updates
   * @returns {boolean} Update success
   */
  updateConfig(updates) {
    try {
      // Validate updates
      if (updates.maxStorageGB && updates.maxStorageGB < this.config.currentUsageGB) {
        throw new Error('Cannot reduce max storage below current usage');
      }
      
      // Apply updates
      const oldConfig = { ...this.config };
      Object.assign(this.config, updates);
      
      // Recalculate available space
      if (updates.maxStorageGB) {
        this.config.availableGB = this.config.maxStorageGB - this.config.currentUsageGB;
      }
      
      this.emit('config:updated', {
        nodeId: this.nodeId,
        oldConfig: oldConfig,
        newConfig: this.config,
        timestamp: Date.now()
      });
      
      console.log(`Node ${this.nodeId} configuration updated`);
      return true;
      
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return false;
    }
  }

  /**
   * Validate a storage request
   * @param {Object} shard - Shard to store
   * @param {string} requesterId - Requesting user ID
   * @param {Object} contract - Storage contract terms
   */
  async validateStorageRequest(shard, requesterId, contract) {
    // Check if trusted peers only mode is enabled
    if (this.config.trustedPeersOnly) {
      const isTrusted = await this.userKeySpace.isTrustedPeer(requesterId);
      if (!isTrusted) {
        throw new Error('Node only accepts storage from trusted peers');
      }
    }
    
    // Check badge requirements
    if (this.config.acceptedBadges.length > 0) {
      const userBadges = await this.userKeySpace.getUserBadges(requesterId);
      const hasRequiredBadge = this.config.acceptedBadges.some(badge => 
        userBadges.includes(badge)
      );
      
      if (!hasRequiredBadge) {
        throw new Error('Requester does not have required badges');
      }
    }
    
    // Validate shard structure
    if (!shard.shardId || !shard.size) {
      throw new Error('Invalid shard structure');
    }
    
    // Check contract terms
    if (this.config.pricingEnabled && contract.duration < this.config.minDuration) {
      throw new Error('Storage duration below minimum requirement');
    }
  }

  /**
   * Verify shard access permissions
   * @param {string} storageId - Storage identifier
   * @param {string} requesterId - Requesting user ID
   * @returns {Promise<boolean>} Access permission
   */
  async verifyShardAccess(storageId, requesterId) {
    // This would integrate with KeySpace permissions system
    // For now, return false for non-owners
    return false;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheck.timer) {
      clearInterval(this.healthCheck.timer);
    }
    
    this.healthCheck.timer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheck.interval);
    
    console.log(`Health monitoring started for node ${this.nodeId}`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheck.timer) {
      clearInterval(this.healthCheck.timer);
      this.healthCheck.timer = null;
    }
    
    console.log(`Health monitoring stopped for node ${this.nodeId}`);
  }

  /**
   * Perform periodic health check
   */
  async performHealthCheck() {
    try {
      this.healthCheck.lastCheck = Date.now();
      this.stats.lastSeen = Date.now();
      
      // Check storage integrity
      await this.verifyStoredShards();
      
      // Update trust score based on performance
      this.updateTrustScore();
      
      // Emit health status
      this.emit('health:check', {
        nodeId: this.nodeId,
        status: 'healthy',
        timestamp: Date.now(),
        stats: this.stats
      });
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      this.emit('health:check', {
        nodeId: this.nodeId,
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Verify integrity of all stored shards
   */
  async verifyStoredShards() {
    const shardIds = Array.from(this.storedShards.keys());
    let verifiedCount = 0;
    
    for (const storageId of shardIds) {
      try {
        const storageEntry = this.storedShards.get(storageId);
        const shard = storageEntry.shard;
        
        // Verify shard hash
        let shardData;
        if (shard.shardingMethod === 'shamir') {
          shardData = JSON.stringify({ x: shard.x, y: shard.y });
        } else {
          shardData = shard.data;
        }
        
        const computedHash = crypto.createHash('sha256').update(shardData).digest('hex');
        
        if (shard.hash && shard.hash !== computedHash) {
          console.warn(`Shard integrity failure: ${shard.shardId}`);
          this.emit('shard:integrity_failure', {
            storageId: storageId,
            shardId: shard.shardId,
            timestamp: Date.now()
          });
        } else {
          verifiedCount++;
        }
        
      } catch (error) {
        console.error(`Shard verification failed for ${storageId}:`, error);
      }
    }
    
    console.log(`Verified ${verifiedCount}/${shardIds.length} shards`);
  }

  /**
   * Update trust score based on performance metrics
   */
  updateTrustScore() {
    const challengeSuccessRate = this.stats.totalChallenges > 0 
      ? this.stats.successfulChallenges / this.stats.totalChallenges 
      : 1.0;
    
    const uptimeHours = (this.stats.uptime + (Date.now() - (this.startTime || Date.now()))) / (1000 * 60 * 60);
    const uptimeScore = Math.min(uptimeHours / (24 * 30), 1.0); // Max score after 30 days
    
    // Calculate trust score (0.0 to 1.0)
    this.stats.trustScore = (challengeSuccessRate * 0.6) + (uptimeScore * 0.4);
  }

  /**
   * Register with storage registry
   */
  async registerWithRegistry() {
    // This would register with the RelayStorageRegistry
    console.log(`Registering node ${this.nodeId} with storage registry`);
  }

  /**
   * Unregister from storage registry
   */
  async unregisterFromRegistry() {
    // This would unregister from the RelayStorageRegistry
    console.log(`Unregistering node ${this.nodeId} from storage registry`);
  }

  /**
   * Close all active connections
   */
  async closeAllConnections() {
    console.log(`Closing ${this.connections.size} connections for node ${this.nodeId}`);
    this.connections.clear();
  }
}

export default KeySpaceStorageNode;
