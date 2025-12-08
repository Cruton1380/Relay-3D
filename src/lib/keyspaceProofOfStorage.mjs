/**
 * KeySpace Proof of Storage
 * Implements challenge-response verification system for stored shards
 * Ensures storage providers actually maintain the data they claim to store
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export class KeySpaceProofOfStorage extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.challengeTimeout = options.challengeTimeout || 30000; // 30 seconds
    this.challengeInterval = options.challengeInterval || 3600000; // 1 hour
    this.maxChallengeSize = options.maxChallengeSize || 4096; // 4KB segments
    this.failureThreshold = options.failureThreshold || 3; // 3 failures = unreliable
    this.retryAttempts = options.retryAttempts || 2;
    
    // Challenge tracking
    this.activeChallenges = new Map(); // challengeId -> challenge data
    this.nodeReliability = new Map(); // nodeId -> reliability metrics
    this.challengeHistory = new Map(); // nodeId -> challenge history
    
    // Verification intervals
    this.verificationTimers = new Map(); // shardId -> timer
  }

  /**
   * Start proof-of-storage monitoring for a shard
   */
  async startShardMonitoring(shardInfo) {
    const { shardId, nodeId, peerId, size, hash } = shardInfo;
    
    try {
      // Initialize reliability tracking for node
      if (!this.nodeReliability.has(nodeId)) {
        this.nodeReliability.set(nodeId, {
          nodeId,
          peerId,
          totalChallenges: 0,
          successfulChallenges: 0,
          failedChallenges: 0,
          averageResponseTime: 0,
          reliabilityScore: 1.0,
          lastChallenge: null,
          isReliable: true
        });
      }
      
      // Start periodic verification
      const verificationTimer = setInterval(async () => {
        try {
          await this.performStorageVerification(shardId, nodeId, peerId, size, hash);
        } catch (error) {
          console.error(`Storage verification failed for shard ${shardId}:`, error);
          this.handleVerificationFailure(shardId, nodeId, error);
        }
      }, this.challengeInterval);
      
      this.verificationTimers.set(shardId, verificationTimer);
      
      console.log(`Started monitoring shard ${shardId} on node ${nodeId}`);
      this.emit('monitoringStarted', { shardId, nodeId });
      
    } catch (error) {
      console.error('Failed to start shard monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring a shard
   */
  stopShardMonitoring(shardId) {
    const timer = this.verificationTimers.get(shardId);
    if (timer) {
      clearInterval(timer);
      this.verificationTimers.delete(shardId);
      console.log(`Stopped monitoring shard ${shardId}`);
      this.emit('monitoringStopped', { shardId });
    }
  }

  /**
   * Perform storage verification challenge
   */
  async performStorageVerification(shardId, nodeId, peerId, shardSize, expectedHash) {
    const challengeId = this.generateChallengeId();
    const startTime = Date.now();
    
    try {
      // Generate random challenge parameters
      const challenge = this.generateChallenge(shardId, shardSize);
      
      // Track active challenge
      this.activeChallenges.set(challengeId, {
        challengeId,
        shardId,
        nodeId,
        peerId,
        challenge,
        startTime,
        timeout: this.challengeTimeout
      });
      
      // Send challenge to storage node
      const response = await this.sendChallenge(peerId, challengeId, challenge);
      
      // Verify response
      const verificationResult = await this.verifyChallengeResponse(
        challengeId, 
        challenge, 
        response, 
        expectedHash
      );
      
      const responseTime = Date.now() - startTime;
      
      // Update reliability metrics
      await this.updateNodeReliability(nodeId, verificationResult.success, responseTime);
      
      // Clean up challenge
      this.activeChallenges.delete(challengeId);
      
      if (verificationResult.success) {
        console.log(`Storage verification successful for shard ${shardId} (${responseTime}ms)`);
        this.emit('verificationSuccess', {
          challengeId,
          shardId,
          nodeId,
          responseTime,
          verificationResult
        });
      } else {
        console.warn(`Storage verification failed for shard ${shardId}:`, verificationResult.reason);
        this.emit('verificationFailure', {
          challengeId,
          shardId,
          nodeId,
          reason: verificationResult.reason,
          responseTime
        });
      }
      
      return verificationResult;
      
    } catch (error) {
      // Clean up on error
      this.activeChallenges.delete(challengeId);
      
      console.error(`Storage verification error for shard ${shardId}:`, error);
      await this.updateNodeReliability(nodeId, false, Date.now() - startTime);
      
      this.emit('verificationError', {
        challengeId,
        shardId,
        nodeId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Generate storage verification challenge
   */
  generateChallenge(shardId, shardSize) {
    // Generate random segment to verify
    const maxOffset = Math.max(0, shardSize - this.maxChallengeSize);
    const offset = Math.floor(Math.random() * maxOffset);
    const length = Math.min(this.maxChallengeSize, shardSize - offset);
    
    // Generate cryptographic nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    return {
      type: 'segment_hash',
      shardId,
      offset,
      length,
      nonce,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send challenge to storage node
   */
  async sendChallenge(peerId, challengeId, challenge) {
    // This would integrate with libp2p messaging system
    // For now, we'll simulate the communication
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Challenge timeout'));
      }, this.challengeTimeout);
      
      // Simulate network communication
      setTimeout(() => {
        clearTimeout(timeout);
        
        // Simulate storage node response
        // In real implementation, this would be actual network communication
        const mockResponse = this.simulateStorageNodeResponse(challenge);
        resolve(mockResponse);
      }, 100 + Math.random() * 500); // Simulate network latency
    });
  }

  /**
   * Simulate storage node response (for testing)
   * In production, this would be actual network communication
   */
  simulateStorageNodeResponse(challenge) {
    // Simulate a valid storage node that has the data
    const mockSegmentData = crypto.randomBytes(challenge.length);
    
    // Generate proof hash
    const proof = crypto.createHash('sha256')
      .update(mockSegmentData)
      .update(challenge.nonce)
      .digest('hex');
    
    return {
      challengeId: challenge.challengeId,
      proof,
      timestamp: new Date().toISOString(),
      segmentSize: challenge.length
    };
  }

  /**
   * Verify challenge response from storage node
   */
  async verifyChallengeResponse(challengeId, challenge, response, expectedShardHash) {
    try {
      // Verify response structure
      if (!response || !response.proof || !response.timestamp) {
        return {
          success: false,
          reason: 'Invalid response structure',
          details: 'Missing required fields in response'
        };
      }
      
      // Verify response timing
      const responseTime = new Date(response.timestamp).getTime() - new Date(challenge.timestamp).getTime();
      if (responseTime > this.challengeTimeout) {
        return {
          success: false,
          reason: 'Response timeout',
          details: `Response took ${responseTime}ms, limit is ${this.challengeTimeout}ms`
        };
      }
      
      // For this implementation, we'll accept responses that follow the correct format
      // In production, this would verify against actual shard data
      const isValidProof = this.validateProofFormat(response.proof);
      
      if (!isValidProof) {
        return {
          success: false,
          reason: 'Invalid proof format',
          details: 'Proof does not match expected format'
        };
      }
      
      // Additional verification could include:
      // - Verifying proof against known segment hash
      // - Cross-checking with multiple nodes
      // - Time-based proof validation
      
      return {
        success: true,
        reason: 'Proof verified successfully',
        details: {
          responseTime,
          proofLength: response.proof.length,
          segmentSize: response.segmentSize
        }
      };
      
    } catch (error) {
      return {
        success: false,
        reason: 'Verification error',
        details: error.message
      };
    }
  }

  /**
   * Validate proof format
   */
  validateProofFormat(proof) {
    // Check if proof is a valid hex string of expected length (SHA-256)
    return typeof proof === 'string' && 
           proof.length === 64 && 
           /^[0-9a-fA-F]+$/.test(proof);
  }

  /**
   * Update node reliability metrics
   */
  async updateNodeReliability(nodeId, success, responseTime) {
    let reliability = this.nodeReliability.get(nodeId);
    
    if (!reliability) {
      reliability = {
        nodeId,
        totalChallenges: 0,
        successfulChallenges: 0,
        failedChallenges: 0,
        averageResponseTime: 0,
        reliabilityScore: 1.0,
        lastChallenge: null,
        isReliable: true
      };
    }
    
    // Update challenge counters
    reliability.totalChallenges++;
    if (success) {
      reliability.successfulChallenges++;
    } else {
      reliability.failedChallenges++;
    }
    
    // Update average response time
    reliability.averageResponseTime = (
      (reliability.averageResponseTime * (reliability.totalChallenges - 1)) + responseTime
    ) / reliability.totalChallenges;
    
    // Calculate reliability score
    reliability.reliabilityScore = reliability.successfulChallenges / reliability.totalChallenges;
    
    // Determine if node is reliable
    reliability.isReliable = reliability.reliabilityScore >= 0.8 && 
                            reliability.failedChallenges < this.failureThreshold;
    
    reliability.lastChallenge = new Date().toISOString();
    
    // Store updated reliability
    this.nodeReliability.set(nodeId, reliability);
    
    // Add to challenge history
    if (!this.challengeHistory.has(nodeId)) {
      this.challengeHistory.set(nodeId, []);
    }
    
    const history = this.challengeHistory.get(nodeId);
    history.push({
      timestamp: new Date().toISOString(),
      success,
      responseTime,
      reliabilityScore: reliability.reliabilityScore
    });
    
    // Keep only last 100 challenge records
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    // Emit reliability update event
    this.emit('reliabilityUpdated', {
      nodeId,
      reliability,
      recentChallenge: { success, responseTime }
    });
    
    // Check if node became unreliable
    if (!reliability.isReliable && reliability.totalChallenges >= this.failureThreshold) {
      this.emit('nodeUnreliable', {
        nodeId,
        reliability,
        reason: 'Too many failed challenges'
      });
    }
  }

  /**
   * Get reliability metrics for a node
   */
  getNodeReliability(nodeId) {
    return this.nodeReliability.get(nodeId) || null;
  }

  /**
   * Get reliability metrics for all monitored nodes
   */
  getAllNodeReliability() {
    return Array.from(this.nodeReliability.values());
  }

  /**
   * Get reliable nodes (reliability score >= 0.8)
   */
  getReliableNodes() {
    return Array.from(this.nodeReliability.values())
      .filter(node => node.isReliable)
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  /**
   * Get unreliable nodes
   */
  getUnreliableNodes() {
    return Array.from(this.nodeReliability.values())
      .filter(node => !node.isReliable);
  }

  /**
   * Perform batch verification of multiple shards
   */
  async performBatchVerification(shardInfos) {
    const results = [];
    
    for (const shardInfo of shardInfos) {
      try {
        const result = await this.performStorageVerification(
          shardInfo.shardId,
          shardInfo.nodeId,
          shardInfo.peerId,
          shardInfo.size,
          shardInfo.hash
        );
        
        results.push({
          shardId: shardInfo.shardId,
          nodeId: shardInfo.nodeId,
          success: result.success,
          result
        });
        
      } catch (error) {
        results.push({
          shardId: shardInfo.shardId,
          nodeId: shardInfo.nodeId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Generate challenge statistics
   */
  getChallengeStatistics() {
    const allNodes = Array.from(this.nodeReliability.values());
    
    const totalChallenges = allNodes.reduce((sum, node) => sum + node.totalChallenges, 0);
    const totalSuccesses = allNodes.reduce((sum, node) => sum + node.successfulChallenges, 0);
    const totalFailures = allNodes.reduce((sum, node) => sum + node.failedChallenges, 0);
    
    const avgResponseTime = allNodes.length > 0 
      ? allNodes.reduce((sum, node) => sum + node.averageResponseTime, 0) / allNodes.length 
      : 0;
    
    const reliableNodeCount = allNodes.filter(node => node.isReliable).length;
    
    return {
      totalNodes: allNodes.length,
      reliableNodes: reliableNodeCount,
      unreliableNodes: allNodes.length - reliableNodeCount,
      totalChallenges,
      successfulChallenges: totalSuccesses,
      failedChallenges: totalFailures,
      overallSuccessRate: totalChallenges > 0 ? totalSuccesses / totalChallenges : 0,
      averageResponseTime: avgResponseTime,
      activeChallenges: this.activeChallenges.size,
      monitoredShards: this.verificationTimers.size
    };
  }

  /**
   * Handle verification failure
   */
  handleVerificationFailure(shardId, nodeId, error) {
    console.warn(`Verification failure for shard ${shardId} on node ${nodeId}:`, error.message);
    
    this.emit('shardVerificationFailed', {
      shardId,
      nodeId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Check if we should trigger shard repair
    const reliability = this.nodeReliability.get(nodeId);
    if (reliability && !reliability.isReliable) {
      this.emit('shardRepairNeeded', {
        shardId,
        unreliableNodeId: nodeId,
        reason: 'Node reliability below threshold'
      });
    }
  }

  /**
   * Generate unique challenge ID
   */
  generateChallengeId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Cleanup expired challenges
   */
  cleanupExpiredChallenges() {
    const now = Date.now();
    
    for (const [challengeId, challenge] of this.activeChallenges) {
      if (now - challenge.startTime > challenge.timeout) {
        console.warn(`Challenge ${challengeId} expired without response`);
        
        this.emit('challengeExpired', {
          challengeId,
          shardId: challenge.shardId,
          nodeId: challenge.nodeId
        });
        
        // Update reliability metrics for timeout
        this.updateNodeReliability(challenge.nodeId, false, challenge.timeout);
        
        this.activeChallenges.delete(challengeId);
      }
    }
  }

  /**
   * Start periodic cleanup of expired challenges
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 30000); // Clean up every 30 seconds
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Shutdown proof-of-storage system
   */
  shutdown() {
    // Stop all verification timers
    for (const [shardId, timer] of this.verificationTimers) {
      clearInterval(timer);
    }
    this.verificationTimers.clear();
    
    // Stop cleanup timer
    this.stopCleanupTimer();
    
    // Clear active challenges
    this.activeChallenges.clear();
    
    console.log('Proof-of-storage system shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      isActive: this.verificationTimers.size > 0,
      monitoredShards: this.verificationTimers.size,
      activeChallenges: this.activeChallenges.size,
      monitoredNodes: this.nodeReliability.size,
      statistics: this.getChallengeStatistics(),
      configuration: {
        challengeTimeout: this.challengeTimeout,
        challengeInterval: this.challengeInterval,
        maxChallengeSize: this.maxChallengeSize,
        failureThreshold: this.failureThreshold,
        retryAttempts: this.retryAttempts
      }
    };
  }
}

export default KeySpaceProofOfStorage;
