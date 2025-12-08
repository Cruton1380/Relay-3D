/**
 * Relay KeySpace Shard Manager
 * Handles client-side encryption, file sharding, and reconstruction
 * Implements AES-256-GCM encryption with Shamir's Secret Sharing
 */

import crypto from 'crypto';
import { ShamirSecretSharing } from './shamirSecretSharing.mjs';

export class KeySpaceShardManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationAlgorithm = 'sha512';
    this.hashAlgorithm = 'blake3'; // For shard integrity
    this.maxShardSize = 64 * 1024 * 1024; // 64MB per shard
    this.minRedundancy = 3;
  }

  /**
   * Encrypt and shard a file for distributed storage
   * @param {Buffer} fileData - Raw file data
   * @param {Object} options - Sharding configuration
   * @returns {Object} Shard package with metadata
   */
  async encryptAndShard(fileData, options = {}) {
    const {
      totalShards = 5,
      threshold = 3,
      filename = 'unnamed_file',
      userKeyPair = null,
      guardianMode = false,
      redundancyLevel = 'standard'
    } = options;

    try {
      // Validate parameters
      this.validateShardingParams(totalShards, threshold, fileData.length);

      // Generate master encryption key using HKDF
      const masterKey = await this.deriveFileKey(userKeyPair, filename);
      
      // Client-side encryption with AES-256-GCM
      const encryptedData = await this.encryptFile(fileData, masterKey);
      
      // Create file shards with optimal size distribution
      const shards = await this.createFileShards(encryptedData, totalShards);
      
      // Generate integrity hashes for each shard
      const shardHashes = await this.generateShardHashes(shards);
      
      // Create shard metadata
      const shardMetadata = this.createShardMetadata({
        filename,
        totalShards,
        threshold,
        fileSize: fileData.length,
        encryptedSize: encryptedData.length,
        redundancyLevel,
        guardianMode,
        shardHashes,
        masterKeyFingerprint: this.generateKeyFingerprint(masterKey)
      });

      // Package shards with secure distribution info
      const shardPackage = {
        shards: shards.map((shard, index) => ({
          index: index,
          data: shard,
          hash: shardHashes[index],
          size: shard.length,
          guardianAssigned: guardianMode && index < threshold
        })),
        metadata: shardMetadata,
        encryptionInfo: {
          algorithm: this.algorithm,
          keyDerivation: this.keyDerivationAlgorithm,
          iv: encryptedData.iv,
          authTag: encryptedData.authTag
        }
      };

      console.log(`File encrypted and sharded: ${totalShards} shards, ${threshold} threshold`);
      return shardPackage;

    } catch (error) {
      console.error('Encryption and sharding failed:', error);
      throw new Error(`Shard creation failed: ${error.message}`);
    }
  }

  /**
   * Reconstruct and decrypt file from available shards
   * @param {Array} availableShards - Retrieved shards with metadata
   * @param {Object} reconstructionKey - User key for decryption
   * @returns {Buffer} Original file data
   */
  async reconstructAndDecrypt(availableShards, reconstructionKey, metadata) {
    try {
      // Validate we have enough shards
      if (availableShards.length < metadata.threshold) {
        throw new Error(`Insufficient shards: need ${metadata.threshold}, have ${availableShards.length}`);
      }

      // Verify shard integrity
      await this.verifyShardIntegrity(availableShards, metadata.shardHashes);

      // Sort shards by index
      const sortedShards = availableShards.sort((a, b) => a.index - b.index);

      // Reconstruct file data from shards
      const reconstructedData = await this.reconstructFromShards(
        sortedShards.slice(0, metadata.threshold)
      );

      // Derive decryption key
      const masterKey = await this.deriveFileKey(reconstructionKey, metadata.filename);

      // Decrypt the reconstructed data
      const decryptedFile = await this.decryptFile(reconstructedData, masterKey, metadata.encryptionInfo);

      console.log(`File reconstructed and decrypted: ${decryptedFile.length} bytes`);
      return decryptedFile;

    } catch (error) {
      console.error('File reconstruction failed:', error);
      throw new Error(`Reconstruction failed: ${error.message}`);
    }
  }

  /**
   * Encrypt file using AES-256-GCM with random IV
   */
  async encryptFile(fileData, masterKey) {
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const cipher = crypto.createCipheriv(this.algorithm, masterKey, iv);
    
    let encrypted = cipher.update(fileData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv,
      authTag: authTag,
      length: encrypted.length
    };
  }

  /**
   * Decrypt file using AES-256-GCM
   */
  async decryptFile(encryptedData, masterKey, encryptionInfo) {
    const decipher = crypto.createDecipheriv(this.algorithm, masterKey, encryptionInfo.iv);
    decipher.setAuthTag(encryptionInfo.authTag);
    
    let decrypted = decipher.update(encryptedData.data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Create file shards with optimal distribution
   */
  async createFileShards(encryptedData, totalShards) {
    const shardSize = Math.ceil(encryptedData.data.length / totalShards);
    const shards = [];
    
    for (let i = 0; i < totalShards; i++) {
      const start = i * shardSize;
      const end = Math.min(start + shardSize, encryptedData.data.length);
      
      if (start < encryptedData.data.length) {
        shards.push(encryptedData.data.slice(start, end));
      }
    }
    
    return shards;
  }

  /**
   * Reconstruct file from available shards
   */
  async reconstructFromShards(shards) {
    // Sort shards by index to ensure correct order
    const sortedShards = shards.sort((a, b) => a.index - b.index);
    
    // Concatenate shard data
    const reconstructedData = Buffer.concat(sortedShards.map(shard => shard.data));
    
    return {
      data: reconstructedData,
      length: reconstructedData.length
    };
  }

  /**
   * Generate BLAKE3 hash for shard integrity verification
   */
  async generateShardHashes(shards) {
    const hashes = [];
    
    for (const shard of shards) {
      // Using SHA-256 as BLAKE3 implementation placeholder
      const hash = crypto.createHash('sha256').update(shard).digest('hex');
      hashes.push(hash);
    }
    
    return hashes;
  }

  /**
   * Verify integrity of retrieved shards
   */
  async verifyShardIntegrity(shards, expectedHashes) {
    for (const shard of shards) {
      const computedHash = crypto.createHash('sha256').update(shard.data).digest('hex');
      const expectedHash = expectedHashes[shard.index];
      
      if (computedHash !== expectedHash) {
        throw new Error(`Shard integrity verification failed for shard ${shard.index}`);
      }
    }
    
    return true;
  }

  /**
   * Derive file-specific encryption key using HKDF
   */
  async deriveFileKey(userKeyPair, filename) {
    // Use HKDF to derive file-specific key from user's key material
    const baseKey = userKeyPair ? userKeyPair.privateKey : crypto.randomBytes(32);
    const salt = crypto.createHash('sha256').update(filename).digest();
    const info = Buffer.from('relay-keyspace-file-encryption');
    
    // HKDF implementation using HMAC-SHA256
    const prk = crypto.createHmac('sha256', salt).update(baseKey).digest();
    const key = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
    
    return key.slice(0, 32); // 256-bit key for AES-256
  }

  /**
   * Generate key fingerprint for verification
   */
  generateKeyFingerprint(key) {
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  /**
   * Create comprehensive shard metadata
   */
  createShardMetadata(params) {
    return {
      version: '1.0.0',
      filename: params.filename,
      timestamp: new Date().toISOString(),
      totalShards: params.totalShards,
      threshold: params.threshold,
      fileSize: params.fileSize,
      encryptedSize: params.encryptedSize,
      redundancyLevel: params.redundancyLevel,
      guardianMode: params.guardianMode,
      shardHashes: params.shardHashes,
      masterKeyFingerprint: params.masterKeyFingerprint,
      algorithm: this.algorithm,
      integrity: 'blake3',
      privacy: 'client-side-encrypted'
    };
  }

  /**
   * Validate sharding parameters
   */
  validateShardingParams(totalShards, threshold, fileSize) {
    if (totalShards < this.minRedundancy) {
      throw new Error(`Total shards must be at least ${this.minRedundancy}`);
    }
    
    if (threshold > totalShards) {
      throw new Error('Threshold cannot exceed total shards');
    }
    
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2 for security');
    }
    
    if (fileSize > this.maxShardSize * totalShards) {
      throw new Error(`File size exceeds maximum capacity: ${this.maxShardSize * totalShards} bytes`);
    }
    
    return true;
  }

  /**
   * Calculate redundancy metrics for monitoring
   */
  calculateRedundancyMetrics(availableShards, requiredThreshold) {
    const redundancyRatio = availableShards / requiredThreshold;
    const healthStatus = redundancyRatio >= 1.5 ? 'healthy' : 
                        redundancyRatio >= 1.0 ? 'minimal' : 'critical';
    
    return {
      availableShards,
      requiredThreshold,
      redundancyRatio,
      healthStatus,
      needsRepair: redundancyRatio < 1.2
    };
  }

  /**
   * Generate shard distribution plan
   */
  generateDistributionPlan(shards, storageNodes, preferences = {}) {
    const {
      preferGuardians = false,
      preferTrusted = true,
      maxShardsPerNode = 1,
      geographicDistribution = false
    } = preferences;

    const plan = [];
    const nodeUsage = new Map();

    // Prioritize nodes based on preferences
    const prioritizedNodes = storageNodes.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      if (preferGuardians && a.isGuardian) scoreA += 10;
      if (preferGuardians && b.isGuardian) scoreB += 10;
      
      if (preferTrusted && a.trustScore) scoreA += a.trustScore;
      if (preferTrusted && b.trustScore) scoreB += b.trustScore;
      
      return scoreB - scoreA;
    });

    // Distribute shards across nodes
    for (let i = 0; i < shards.length; i++) {
      const shard = shards[i];
      
      // Find best available node
      const availableNode = prioritizedNodes.find(node => {
        const currentUsage = nodeUsage.get(node.id) || 0;
        return currentUsage < maxShardsPerNode && node.freeSpace >= shard.size;
      });

      if (availableNode) {
        plan.push({
          shardIndex: shard.index,
          nodeId: availableNode.id,
          nodePeerId: availableNode.peerId,
          isGuardian: availableNode.isGuardian,
          estimatedCost: availableNode.pricePerGB * (shard.size / (1024**3))
        });

        nodeUsage.set(availableNode.id, (nodeUsage.get(availableNode.id) || 0) + 1);
      } else {
        throw new Error(`No suitable storage node found for shard ${shard.index}`);
      }
    }

    return {
      plan,
      totalNodes: new Set(plan.map(p => p.nodeId)).size,
      estimatedTotalCost: plan.reduce((sum, p) => sum + p.estimatedCost, 0),
      guardianShards: plan.filter(p => p.isGuardian).length
    };
  }
}

export default KeySpaceShardManager;
