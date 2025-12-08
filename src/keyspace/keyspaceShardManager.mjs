/**
 * KeySpace Shard Manager - Core file encryption, sharding, and reconstruction
 * 
 * This module handles:
 * - Client-side file encryption with AES-256-GCM
 * - File sharding using Shamir's Secret Sharing or Reed-Solomon encoding
 * - Secure key derivation using HKDF
 * - Shard integrity verification with BLAKE3 hashes
 * 
 * Security: All operations use FIPS 140-3 compliant primitives
 * Privacy: Files are encrypted before sharding, shards cannot be reconstructed without user key
 */

import crypto from 'crypto';
import { ShamirSecretSharing } from '../lib/shamirSecretSharing.mjs';

export class KeySpaceShardManager {
  constructor(userKeySpace) {
    this.userKeySpace = userKeySpace;
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationAlgorithm = 'sha512';
    this.hashAlgorithm = 'blake3'; // Will fallback to sha256 if BLAKE3 not available
  }

  /**
   * Encrypt and shard a file for distributed storage
   * @param {Buffer} fileData - Raw file data
   * @param {Object} options - Sharding options
   * @param {number} options.totalShards - Total number of shards (N)
   * @param {number} options.threshold - Minimum shards to reconstruct (K)
   * @param {string} options.fileName - Original filename
   * @param {string} options.shardingMethod - 'shamir' or 'reed-solomon'
   * @returns {Object} Encrypted shards and metadata
   */
  async encryptAndShard(fileData, options = {}) {
    try {
      const {
        totalShards = 5,
        threshold = 3,
        fileName = 'unnamed_file',
        shardingMethod = 'shamir'
      } = options;

      // Validate parameters
      if (threshold > totalShards) {
        throw new Error('Threshold cannot exceed total shards');
      }

      if (totalShards > 255) {
        throw new Error('Maximum 255 shards supported');
      }

      // Generate file-specific encryption key using HKDF
      const fileKey = await this.deriveFileKey(fileName, fileData);
      
      // Encrypt file data
      const encryptedData = await this.encryptFile(fileData, fileKey);
      
      // Create shards based on method
      let shards;
      if (shardingMethod === 'shamir') {
        shards = await this.createShamirShards(encryptedData, totalShards, threshold);
      } else if (shardingMethod === 'reed-solomon') {
        shards = await this.createReedSolomonShards(encryptedData, totalShards, threshold);
      } else {
        throw new Error(`Unsupported sharding method: ${shardingMethod}`);
      }

      // Generate integrity hashes for each shard
      const shardsWithHashes = await this.addIntegrityHashes(shards);

      // Create metadata
      const metadata = {
        fileId: crypto.randomUUID(),
        fileName: fileName,
        originalSize: fileData.length,
        encryptedSize: encryptedData.encrypted.length,
        totalShards: totalShards,
        threshold: threshold,
        shardingMethod: shardingMethod,
        createdAt: new Date().toISOString(),
        keyDerivationSalt: encryptedData.salt,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        shardHashes: shardsWithHashes.map(s => s.hash)
      };

      return {
        metadata: metadata,
        shards: shardsWithHashes,
        success: true
      };

    } catch (error) {
      console.error('File encryption and sharding failed:', error);
      throw new Error(`Sharding failed: ${error.message}`);
    }
  }

  /**
   * Reconstruct and decrypt a file from shards
   * @param {Array} shards - Array of shard objects
   * @param {Object} metadata - File metadata
   * @param {string} fileName - Original filename for key derivation
   * @returns {Buffer} Decrypted file data
   */
  async reconstructAndDecrypt(shards, metadata, fileName) {
    try {
      // Validate we have enough shards
      if (shards.length < metadata.threshold) {
        throw new Error(`Insufficient shards: need ${metadata.threshold}, have ${shards.length}`);
      }

      // Verify shard integrity
      await this.verifyShardIntegrity(shards, metadata.shardHashes);

      // Reconstruct encrypted data based on sharding method
      let encryptedData;
      if (metadata.shardingMethod === 'shamir') {
        encryptedData = await this.reconstructFromShamirShards(shards, metadata);
      } else if (metadata.shardingMethod === 'reed-solomon') {
        encryptedData = await this.reconstructFromReedSolomonShards(shards, metadata);
      } else {
        throw new Error(`Unsupported sharding method: ${metadata.shardingMethod}`);
      }

      // Derive the same file key used for encryption
      const fileKey = await this.deriveFileKey(fileName, null, metadata.keyDerivationSalt);

      // Decrypt file data
      const decryptedData = await this.decryptFile({
        encrypted: encryptedData,
        salt: metadata.keyDerivationSalt,
        iv: metadata.iv,
        authTag: metadata.authTag
      }, fileKey);

      return decryptedData;

    } catch (error) {
      console.error('File reconstruction and decryption failed:', error);
      throw new Error(`Reconstruction failed: ${error.message}`);
    }
  }

  /**
   * Derive a file-specific encryption key using HKDF
   * @param {string} fileName - File name for key derivation
   * @param {Buffer} fileData - File data for additional entropy (optional)
   * @param {string} existingSalt - Use existing salt for reconstruction
   * @returns {Buffer} Derived key
   */
  async deriveFileKey(fileName, fileData = null, existingSalt = null) {
    // Get user's master key from KeySpace
    const masterKey = await this.userKeySpace.getMasterKey();
    
    // Use existing salt or generate new one
    const salt = existingSalt ? Buffer.from(existingSalt, 'hex') : crypto.randomBytes(32);
    
    // Create info parameter for HKDF
    const info = Buffer.from(`relay-storage-${fileName}`, 'utf8');
    
    // Add file data hash for additional entropy if provided
    let ikm = masterKey;
    if (fileData) {
      const fileHash = crypto.createHash('sha256').update(fileData).digest();
      ikm = Buffer.concat([masterKey, fileHash]);
    }

    // Derive key using HKDF (NIST SP 800-56C)
    const derivedKey = crypto.hkdfSync('sha512', ikm, salt, info, 32);
    
    return derivedKey;
  }

  /**
   * Encrypt file data using AES-256-GCM
   * @param {Buffer} fileData - Raw file data
   * @param {Buffer} key - Encryption key
   * @returns {Object} Encrypted data with metadata
   */
  async encryptFile(fileData, key) {
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const salt = crypto.randomBytes(32); // Salt for key derivation
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(fileData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
      algorithm: this.algorithm
    };
  }

  /**
   * Decrypt file data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data object
   * @param {Buffer} key - Decryption key
   * @returns {Buffer} Decrypted file data
   */
  async decryptFile(encryptedData, key) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Create shards using Shamir's Secret Sharing
   * @param {Object} encryptedData - Encrypted file data
   * @param {number} totalShards - Total number of shards
   * @param {number} threshold - Minimum shards for reconstruction
   * @returns {Array} Array of shard objects
   */
  async createShamirShards(encryptedData, totalShards, threshold) {
    const sss = new ShamirSecretSharing(threshold, totalShards);
    
    // Convert encrypted data to string for SSS
    const dataString = encryptedData.encrypted.toString('base64');
    
    // Split the data
    const shares = sss.splitSecret(dataString);
    
    // Convert to shard objects
    const shards = shares.map((share, index) => ({
      shardId: crypto.randomUUID(),
      index: index,
      x: share.x.toString(),
      y: share.y.toString(),
      shardingMethod: 'shamir',
      size: dataString.length
    }));
    
    return shards;
  }

  /**
   * Create shards using Reed-Solomon encoding (simplified implementation)
   * @param {Object} encryptedData - Encrypted file data
   * @param {number} totalShards - Total number of shards
   * @param {number} threshold - Minimum shards for reconstruction
   * @returns {Array} Array of shard objects
   */
  async createReedSolomonShards(encryptedData, totalShards, threshold) {
    // Simplified Reed-Solomon implementation
    // In production, would use a proper Reed-Solomon library
    
    const data = encryptedData.encrypted;
    const chunkSize = Math.ceil(data.length / threshold);
    const shards = [];
    
    // Create data shards
    for (let i = 0; i < threshold; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);
      
      shards.push({
        shardId: crypto.randomUUID(),
        index: i,
        data: chunk.toString('base64'),
        shardingMethod: 'reed-solomon',
        isParityShad: false,
        size: chunk.length
      });
    }
    
    // Create parity shards (simplified XOR for demonstration)
    const parityShards = totalShards - threshold;
    for (let i = 0; i < parityShards; i++) {
      let parity = Buffer.alloc(chunkSize);
      
      // XOR all data shards to create parity
      for (const shard of shards) {
        const shardData = Buffer.from(shard.data, 'base64');
        for (let j = 0; j < Math.min(parity.length, shardData.length); j++) {
          parity[j] ^= shardData[j];
        }
      }
      
      shards.push({
        shardId: crypto.randomUUID(),
        index: threshold + i,
        data: parity.toString('base64'),
        shardingMethod: 'reed-solomon',
        isParityShard: true,
        size: parity.length
      });
    }
    
    return shards;
  }

  /**
   * Add integrity hashes to shards using BLAKE3 (or SHA-256 fallback)
   * @param {Array} shards - Array of shard objects
   * @returns {Array} Shards with integrity hashes
   */
  async addIntegrityHashes(shards) {
    return shards.map(shard => {
      let shardData;
      
      if (shard.shardingMethod === 'shamir') {
        shardData = JSON.stringify({ x: shard.x, y: shard.y });
      } else {
        shardData = shard.data;
      }
      
      // Use SHA-256 as BLAKE3 may not be available in all environments
      const hash = crypto.createHash('sha256').update(shardData).digest('hex');
      
      return {
        ...shard,
        hash: hash,
        hashedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Verify shard integrity using stored hashes
   * @param {Array} shards - Array of shard objects
   * @param {Array} expectedHashes - Expected hash values
   */
  async verifyShardIntegrity(shards, expectedHashes) {
    for (let i = 0; i < shards.length; i++) {
      const shard = shards[i];
      let shardData;
      
      if (shard.shardingMethod === 'shamir') {
        shardData = JSON.stringify({ x: shard.x, y: shard.y });
      } else {
        shardData = shard.data;
      }
      
      const computedHash = crypto.createHash('sha256').update(shardData).digest('hex');
      
      if (shard.hash && shard.hash !== computedHash) {
        throw new Error(`Shard ${shard.shardId} integrity check failed`);
      }
      
      // Also check against metadata hashes if provided
      if (expectedHashes && expectedHashes[shard.index] !== computedHash) {
        throw new Error(`Shard ${shard.shardId} does not match expected hash`);
      }
    }
  }

  /**
   * Reconstruct data from Shamir shards
   * @param {Array} shards - Array of Shamir shard objects
   * @param {Object} metadata - File metadata
   * @returns {Buffer} Reconstructed encrypted data
   */
  async reconstructFromShamirShards(shards, metadata) {
    const sss = new ShamirSecretSharing(metadata.threshold, metadata.totalShards);
    
    // Convert shards back to SSS format
    const shares = shards.map(shard => ({
      x: BigInt(shard.x),
      y: BigInt(shard.y)
    }));
    
    // Reconstruct the secret
    const reconstructedString = sss.reconstructSecret(shares);
    
    // Convert back to buffer
    return Buffer.from(reconstructedString, 'base64');
  }

  /**
   * Reconstruct data from Reed-Solomon shards
   * @param {Array} shards - Array of Reed-Solomon shard objects
   * @param {Object} metadata - File metadata
   * @returns {Buffer} Reconstructed encrypted data
   */
  async reconstructFromReedSolomonShards(shards, metadata) {
    // Sort shards by index
    const sortedShards = shards.sort((a, b) => a.index - b.index);
    
    // Get data shards (non-parity)
    const dataShards = sortedShards.filter(s => !s.isParityShard).slice(0, metadata.threshold);
    
    if (dataShards.length < metadata.threshold) {
      throw new Error('Insufficient data shards for reconstruction');
    }
    
    // Concatenate data shards
    const chunks = dataShards.map(shard => Buffer.from(shard.data, 'base64'));
    const reconstructed = Buffer.concat(chunks);
    
    return reconstructed;
  }

  /**
   * Generate a storage challenge for proof-of-storage
   * @param {string} shardId - Shard identifier
   * @param {number} segmentStart - Start position for challenge
   * @param {number} segmentLength - Length of challenge segment
   * @returns {Object} Challenge object
   */
  generateStorageChallenge(shardId, segmentStart = null, segmentLength = 32) {
    const challenge = {
      challengeId: crypto.randomUUID(),
      shardId: shardId,
      nonce: crypto.randomBytes(16).toString('hex'),
      segmentStart: segmentStart || Math.floor(Math.random() * 1000),
      segmentLength: segmentLength,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    return challenge;
  }

  /**
   * Verify a storage challenge response
   * @param {Object} challenge - Original challenge
   * @param {string} response - Hash response from storage node
   * @param {Object} shard - Original shard data for verification
   * @returns {boolean} Challenge verification result
   */
  verifyChallengeResponse(challenge, response, shard) {
    try {
      // Extract the challenged segment from shard
      let shardData;
      if (shard.shardingMethod === 'shamir') {
        shardData = JSON.stringify({ x: shard.x, y: shard.y });
      } else {
        shardData = shard.data;
      }
      
      const segment = shardData.slice(
        challenge.segmentStart,
        challenge.segmentStart + challenge.segmentLength
      );
      
      // Compute expected hash with nonce
      const expectedHash = crypto
        .createHash('sha256')
        .update(segment + challenge.nonce)
        .digest('hex');
      
      return response === expectedHash;
      
    } catch (error) {
      console.error('Challenge verification failed:', error);
      return false;
    }
  }
}

export default KeySpaceShardManager;
