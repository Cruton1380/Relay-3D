/**
 * Relay KeySpace Storage Market - Shard Manager
 * Handles client-side encryption and microshard splitting using Shamir's Secret Sharing
 * Integrates with local file uploads and KeySpace interface
 */

import crypto from 'crypto';
import { ShamirSecretSharing } from '../../lib/shamirSecretSharing.mjs';
import { logger } from '../../lib/logger.mjs';

export class KeyspaceShardManager {
  constructor() {
    this.encryptionAlgorithm = 'aes-256-gcm';
    this.keyDerivationIterations = 100000;
    this.shardHashAlgorithm = 'blake3'; // Fallback to sha256 if blake3 not available
    this.maxShardSize = 1024 * 1024; // 1MB per shard
  }

  /**
   * Encrypt and shard a file using specified redundancy parameters
   * @param {Buffer} fileBuffer - The file data to encrypt and shard
   * @param {Object} options - Sharding options
   * @param {number} options.threshold - Minimum shards needed to reconstruct (M)
   * @param {number} options.totalShards - Total number of shards to create (N)
   * @param {string} options.userMasterKey - User's master encryption key
   * @param {Object} options.metadata - File metadata (name, size, type, etc.)
   * @returns {Object} Encrypted shards and reconstruction metadata
   */
  async encryptAndShard(fileBuffer, options = {}) {
    try {
      const {
        threshold = 3,
        totalShards = 5,
        userMasterKey,
        metadata = {}
      } = options;

      logger.info(`Starting encryption and sharding: ${threshold}-of-${totalShards}`);

      // Step 1: Generate unique file encryption key using HKDF
      const fileKey = await this.deriveFileKey(userMasterKey, metadata);
      
      // Step 2: Encrypt the file with AES-256-GCM
      const encryptedFile = await this.encryptFile(fileBuffer, fileKey);
      
      // Step 3: Prepare data for sharding (encrypted file + metadata)
      const shardableData = JSON.stringify({
        encryptedFile: encryptedFile.encrypted,
        iv: encryptedFile.iv,
        authTag: encryptedFile.authTag,
        metadata: {
          ...metadata,
          originalSize: fileBuffer.length,
          encryptedSize: encryptedFile.encrypted.length,
          timestamp: new Date().toISOString()
        }
      });

      // Step 4: Split into shards using Shamir's Secret Sharing
      const shards = await this.createShards(shardableData, threshold, totalShards);
      
      // Step 5: Generate shard metadata for storage and retrieval
      const shardMetadata = await this.generateShardMetadata(shards, {
        threshold,
        totalShards,
        fileHash: this.generateFileHash(fileBuffer),
        encryptionParams: {
          algorithm: this.encryptionAlgorithm,
          keyDerivation: 'hkdf-sha256'
        }
      });

      logger.info(`Successfully created ${shards.length} shards with ${threshold} threshold`);

      return {
        shards: shards,
        metadata: shardMetadata,
        reconstructionInfo: {
          threshold,
          totalShards,
          fileKey: fileKey.toString('hex'), // Store securely in user's KeySpace
          originalHash: this.generateFileHash(fileBuffer)
        }
      };

    } catch (error) {
      logger.error('Failed to encrypt and shard file:', error);
      throw new Error(`Shard creation failed: ${error.message}`);
    }
  }

  /**
   * Reconstruct and decrypt a file from shards
   * @param {Array} availableShards - Array of shard objects with data
   * @param {Object} reconstructionInfo - Metadata needed for reconstruction
   * @returns {Buffer} The original file data
   */
  async reconstructAndDecrypt(availableShards, reconstructionInfo) {
    try {
      const { threshold, fileKey, originalHash } = reconstructionInfo;

      if (availableShards.length < threshold) {
        throw new Error(`Insufficient shards: need ${threshold}, have ${availableShards.length}`);
      }

      logger.info(`Reconstructing file from ${availableShards.length} shards (need ${threshold})`);

      // Step 1: Validate shard integrity
      await this.validateShardIntegrity(availableShards);

      // Step 2: Reconstruct the encrypted file using Shamir's Secret Sharing
      const reconstructedData = await this.reconstructFromShards(
        availableShards.slice(0, threshold),
        threshold
      );

      // Step 3: Parse reconstructed data
      const parsedData = JSON.parse(reconstructedData);
      const { encryptedFile, iv, authTag, metadata } = parsedData;

      // Step 4: Decrypt the file
      const decryptedFile = await this.decryptFile({
        encrypted: encryptedFile,
        iv,
        authTag
      }, Buffer.from(fileKey, 'hex'));

      // Step 5: Verify file integrity
      const reconstructedHash = this.generateFileHash(decryptedFile);
      if (reconstructedHash !== originalHash) {
        throw new Error('File integrity verification failed');
      }

      logger.info('File successfully reconstructed and verified');

      return {
        fileData: decryptedFile,
        metadata: metadata,
        verification: {
          hashMatch: true,
          shardsUsed: availableShards.length,
          reconstructionTime: Date.now()
        }
      };

    } catch (error) {
      logger.error('Failed to reconstruct file:', error);
      throw new Error(`File reconstruction failed: ${error.message}`);
    }
  }

  /**
   * Derive a unique file encryption key using HKDF
   * @param {string} masterKey - User's master key
   * @param {Object} metadata - File metadata for key derivation context
   * @returns {Buffer} Derived file encryption key
   */
  async deriveFileKey(masterKey, metadata) {
    const salt = crypto.randomBytes(32);
    const info = Buffer.from(`relay-storage:${metadata.name || 'unknown'}:${Date.now()}`);
    
    // Use HKDF for key derivation (NIST SP 800-108 compliant)
    const key = crypto.hkdfSync('sha256', masterKey, salt, info, 32);
    
    return key;
  }

  /**
   * Encrypt file data using AES-256-GCM
   * @param {Buffer} fileData - File data to encrypt
   * @param {Buffer} key - Encryption key
   * @returns {Object} Encrypted data with IV and auth tag
   */
  async encryptFile(fileData, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
    
    let encrypted = cipher.update(fileData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt file data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data with IV and auth tag
   * @param {Buffer} key - Decryption key
   * @returns {Buffer} Decrypted file data
   */
  async decryptFile(encryptedData, key) {
    const { encrypted, iv, authTag } = encryptedData;
    
    const decipher = crypto.createDecipheriv(
      this.encryptionAlgorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Create shards using Shamir's Secret Sharing
   * @param {string} data - Data to shard (JSON string)
   * @param {number} threshold - Minimum shards needed
   * @param {number} totalShards - Total shards to create
   * @returns {Array} Array of shard objects
   */
  async createShards(data, threshold, totalShards) {
    const sss = new ShamirSecretSharing(threshold, totalShards);
    const shares = sss.splitSecret(data);
    
    const shards = shares.map((share, index) => ({
      id: crypto.randomUUID(),
      index: index + 1,
      x: share.x.toString(),
      y: share.y.toString(),
      hash: this.generateShardHash(share),
      size: JSON.stringify(share).length,
      createdAt: new Date().toISOString()
    }));
    
    return shards;
  }

  /**
   * Reconstruct data from shards using Shamir's Secret Sharing
   * @param {Array} shards - Array of shard objects
   * @param {number} threshold - Minimum shards needed
   * @returns {string} Reconstructed data
   */
  async reconstructFromShards(shards, threshold) {
    // Convert shards back to SSS format
    const shares = shards.map(shard => ({
      x: BigInt(shard.x),
      y: BigInt(shard.y)
    }));
    
    const sss = new ShamirSecretSharing(threshold, shards.length);
    return sss.reconstructSecret(shares);
  }

  /**
   * Generate metadata for shard storage and tracking
   * @param {Array} shards - Array of shards
   * @param {Object} params - Additional parameters
   * @returns {Object} Shard metadata
   */
  async generateShardMetadata(shards, params) {
    return {
      shardCount: shards.length,
      threshold: params.threshold,
      totalShards: params.totalShards,
      fileHash: params.fileHash,
      shardHashes: shards.map(shard => shard.hash),
      encryptionParams: params.encryptionParams,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Validate shard integrity before reconstruction
   * @param {Array} shards - Shards to validate
   */
  async validateShardIntegrity(shards) {
    for (const shard of shards) {
      const expectedHash = this.generateShardHash({
        x: BigInt(shard.x),
        y: BigInt(shard.y)
      });
      
      if (shard.hash !== expectedHash) {
        throw new Error(`Shard ${shard.id} integrity check failed`);
      }
    }
  }

  /**
   * Generate hash for a file
   * @param {Buffer} fileData - File data
   * @returns {string} File hash
   */
  generateFileHash(fileData) {
    return crypto.createHash('sha256').update(fileData).digest('hex');
  }

  /**
   * Generate hash for a shard
   * @param {Object} share - Share object with x and y coordinates
   * @returns {string} Shard hash
   */
  generateShardHash(share) {
    const shardString = `${share.x}:${share.y}`;
    return crypto.createHash('sha256').update(shardString).digest('hex');
  }

  /**
   * Calculate optimal shard parameters for file size and plan
   * @param {number} fileSize - File size in bytes
   * @param {string} planTier - Storage plan tier (basic, secure, vault)
   * @returns {Object} Optimal shard parameters
   */
  calculateOptimalSharding(fileSize, planTier = 'secure') {
    const planConfigs = {
      basic: { threshold: 2, totalShards: 3, maxFileSize: 100 * 1024 * 1024 }, // 100MB
      secure: { threshold: 3, totalShards: 5, maxFileSize: 1024 * 1024 * 1024 }, // 1GB
      vault: { threshold: 5, totalShards: 8, maxFileSize: 10 * 1024 * 1024 * 1024 } // 10GB
    };

    const config = planConfigs[planTier] || planConfigs.secure;

    if (fileSize > config.maxFileSize) {
      throw new Error(`File size ${fileSize} exceeds plan limit ${config.maxFileSize}`);
    }

    // Calculate number of chunks if file is large
    const chunks = Math.ceil(fileSize / this.maxShardSize);

    return {
      threshold: config.threshold,
      totalShards: config.totalShards,
      estimatedChunks: chunks,
      planTier: planTier,
      storageEfficiency: config.threshold / config.totalShards
    };
  }

  /**
   * Estimate storage and bandwidth costs
   * @param {number} fileSize - File size in bytes
   * @param {Object} shardingParams - Sharding parameters
   * @returns {Object} Cost estimation
   */
  estimateStorageCosts(fileSize, shardingParams) {
    const { totalShards, planTier } = shardingParams;
    
    // Base rates per GB per month (in cents)
    const baseRates = {
      basic: 50,   // $0.50/GB/month
      secure: 100, // $1.00/GB/month
      vault: 200   // $2.00/GB/month
    };

    const rate = baseRates[planTier] || baseRates.secure;
    const totalStorage = (fileSize * totalShards) / (1024 * 1024 * 1024); // GB
    const monthlyCost = totalStorage * rate;

    return {
      fileSize: fileSize,
      totalStorageGB: totalStorage,
      monthlyStorageCost: monthlyCost / 100, // Convert to dollars
      redundancyFactor: totalShards,
      costPerShard: monthlyCost / totalShards / 100,
      planTier: planTier
    };
  }
}

export default KeyspaceShardManager;
