//backend/services/microshardingService.mjs
/**
 * Microsharding Service - Implements data sharding for redundancy and distribution
 * Breaks data into small shards and distributes them across the network
 */

import crypto from 'crypto';
import { store, retrieve, remove, batchStore, batchRetrieve, scan } from '../p2p-service/dht.mjs';
import { ReedSolomon } from '../utils/common/erasureCoding.mjs';
import logger from '../utils/logging/logger.mjs';
import { encodeBase64 } from '../utils/crypto/index.mjs';

// Create a dedicated logger
const microshardLogger = logger.child({ module: 'microshard' });

// Constants
const DEFAULT_SHARD_SIZE = 4096; // 4KB per shard
const MIN_SHARDS = 3; // Minimum number of shards for redundancy
const DEFAULT_PARITY_RATIO = 0.5; // Ratio of parity shards to data shards

class MicroshardingService {
  constructor() {
    this.reedSolomon = new ReedSolomon();
    microshardLogger.info('Microsharding service initialized');
  }

  /**
   * Shard data and store in the DHT
   * @param {string} key - The logical key for the data
   * @param {string|Buffer} data - Data to shard and store
   * @param {Object} options - Sharding options
   * @returns {Promise<Object>} Sharding result with shard locations
   */
  async shardAndStore(key, data, options = {}) {
    try {
      // Convert data to buffer if it's a string
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      // Calculate optimal sharding strategy
      const shardSize = options.shardSize || DEFAULT_SHARD_SIZE;
      const totalShards = Math.max(MIN_SHARDS, Math.ceil(dataBuffer.length / shardSize));
      
      // Calculate parity shards based on redundancy requirements
      const redundancy = options.redundancy || 1;
      const dataShardCount = totalShards;
      const parityShardCount = Math.ceil(dataShardCount * DEFAULT_PARITY_RATIO * redundancy);
      
      microshardLogger.debug(`Sharding data for key ${key}`, {
        dataSize: dataBuffer.length,
        dataShards: dataShardCount,
        parityShards: parityShardCount
      });
      
      // Create metadata
      const metadata = {
        originalSize: dataBuffer.length,
        dataShards: dataShardCount,
        parityShards: parityShardCount,
        shardSize,
        timestamp: Date.now(),
        contentHash: this._hashData(dataBuffer)
      };
      
      // Create shards
      const shards = this._createShards(dataBuffer, shardSize, dataShardCount);
      
      // Add parity shards using Reed-Solomon
      const allShards = await this.reedSolomon.encode(shards, parityShardCount);
      
      // Store shards in DHT with unique shard keys
      const shardMap = {};
      const storePromises = [];
      
      for (let i = 0; i < allShards.length; i++) {
        const shardKey = `${key}.shard.${i}`;
        const shardData = allShards[i];
        
        // Store the shard with its position metadata
        const storePromise = store(shardKey, {
          data: encodeBase64(shardData),
          position: i,
          type: i < dataShardCount ? 'data' : 'parity',
          parentKey: key,
          timestamp: Date.now()
        });
        
        storePromises.push(storePromise.then(() => {
          shardMap[i] = shardKey;
          return { index: i, key: shardKey };
        }));
      }
      
      // Wait for all shards to be stored
      await Promise.all(storePromises);
      
      // Store metadata
      await store(`${key}.meta`, {
        ...metadata,
        shardMap
      });
      
      microshardLogger.info(`Successfully sharded and stored data for key ${key}`, {
        totalShards: allShards.length,
        dataShards: dataShardCount,
        parityShards: parityShardCount
      });
      
      return {
        success: true,
        key,
        shardCount: allShards.length,
        dataShards: dataShardCount,
        parityShards: parityShardCount,
        shardMap,
        metadata
      };
    } catch (error) {
      microshardLogger.error(`Error sharding data`, {
        error: error.message,
        key
      });
      throw error;
    }
  }

  /**
   * Retrieve and combine shards from the DHT
   * @param {string} key - The logical key for the data
   * @returns {Promise<Object>} Retrieved and combined data
   */
  async retrieveAndCombine(key) {
    try {
      // Retrieve metadata
      const metaResult = await retrieve(`${key}.meta`);
      
      if (!metaResult) {
        throw new Error(`Metadata not found for key ${key}`);
      }
      
      const metadata = metaResult.value;
      const { dataShards, parityShards, shardMap } = metadata;
      
      microshardLogger.debug(`Retrieving shards for key ${key}`, {
        dataShards,
        parityShards,
        totalShards: dataShards + parityShards
      });
      
      // Prepare keys for batch retrieval
      const shardKeys = Object.values(shardMap);
      
      // Retrieve shards
      const retrievedShards = await batchRetrieve(shardKeys);
      
      // Check if we have enough shards to reconstruct the data
      const availableShards = retrievedShards.filter(s => s !== null);
      
      if (availableShards.length < dataShards) {
        throw new Error(`Not enough shards available to reconstruct data. Need ${dataShards}, have ${availableShards.length}`);
      }
      
      // Organize shards by position
      const organizedShards = Array(dataShards + parityShards).fill(null);
      
      for (const shard of availableShards) {
        const position = shard.value.position;
        organizedShards[position] = decodeBase64(shard.value.data);
      }
      
      // Reconstruct missing shards if needed
      let finalShards = organizedShards;
      
      if (organizedShards.includes(null) && availableShards.length >= dataShards) {
        // We have enough shards to reconstruct but some are missing
        microshardLogger.debug(`Reconstructing ${organizedShards.filter(s => s === null).length} missing shards`);
        finalShards = await this.reedSolomon.decode(organizedShards, dataShards, parityShards);
      }
      
      // Combine data shards
      const dataOnlyShards = finalShards.slice(0, dataShards);
      const combinedData = this._combineShards(dataOnlyShards, metadata.originalSize);
      
      // Verify data integrity
      const dataHash = this._hashData(combinedData);
      
      if (dataHash !== metadata.contentHash) {
        microshardLogger.warn(`Data integrity check failed for key ${key}`);
        throw new Error('Data integrity check failed');
      }
      
      microshardLogger.info(`Successfully retrieved and combined data for key ${key}`, {
        availableShards: availableShards.length,
        requiredShards: dataShards,
        reconstructed: organizedShards.includes(null)
      });
      
      return {
        success: true,
        key,
        value: combinedData,
        metadata
      };
    } catch (error) {
      microshardLogger.error(`Error retrieving data`, {
        error: error.message,
        key
      });
      
      if (error.message.includes('not found') || error.message.includes('Not enough shards')) {
        const notFoundError = new Error(`Data not found for key ${key}`);
        notFoundError.code = 'NOT_FOUND';
        throw notFoundError;
      }
      
      throw error;
    }
  }

  /**
   * Remove all shards associated with a key
   * @param {string} key - The logical key for the data
   * @returns {Promise<boolean>} Success status
   */
  async removeShards(key) {
    try {
      // Retrieve metadata to get shard keys
      const metaResult = await retrieve(`${key}.meta`);
      
      if (!metaResult) {
        // If no metadata, assume already removed
        return true;
      }
      
      const { shardMap } = metaResult.value;
      
      // Collect all shard keys
      const shardKeys = Object.values(shardMap);
      
      // Remove all shards
      const removePromises = shardKeys.map(shardKey => remove(shardKey));
      
      // Also remove metadata
      removePromises.push(remove(`${key}.meta`));
      
      // Wait for all removes to complete
      await Promise.all(removePromises);
      
      microshardLogger.info(`Successfully removed all shards for key ${key}`, {
        shardCount: shardKeys.length
      });
      
      return true;
    } catch (error) {
      microshardLogger.error(`Error removing shards`, {
        error: error.message,
        key
      });
      throw error;
    }
  }

  /**
   * List all keys with a given prefix
   * @param {string} prefix - Key prefix to scan for
   * @returns {Promise<Array<string>>} List of keys
   */
  async listKeys(prefix) {
    try {
      // Scan the DHT for keys with this prefix
      const scanResult = await scan(`${prefix}`, '.meta');
      
      // Extract the actual logical keys by removing the metadata suffix
      const logicalKeys = scanResult.map(fullKey => {
        return fullKey.substring(0, fullKey.length - 5); // Remove '.meta'
      });
      
      return logicalKeys;
    } catch (error) {
      microshardLogger.error(`Error listing keys`, {
        error: error.message,
        prefix
      });
      throw error;
    }
  }

  /**
   * Split data into shards
   * @private
   * @param {Buffer} data - Data to shard
   * @param {number} shardSize - Size of each shard
   * @param {number} shardCount - Number of shards to create
   * @returns {Array<Buffer>} Array of data shards
   */
  _createShards(data, shardSize, shardCount) {
    const shards = [];
    
    for (let i = 0; i < shardCount; i++) {
      const start = i * shardSize;
      const end = Math.min(start + shardSize, data.length);
      
      if (start >= data.length) {
        // Add empty shard if we've gone past the data
        shards.push(Buffer.alloc(0));
      } else {
        shards.push(data.slice(start, end));
      }
    }
    
    return shards;
  }

  /**
   * Combine shards back into original data
   * @private
   * @param {Array<Buffer>} shards - Data shards to combine
   * @param {number} originalSize - Original data size
   * @returns {Buffer} Combined data
   */
  _combineShards(shards, originalSize) {
    // Create a buffer to hold the combined data
    const combined = Buffer.alloc(originalSize);
    let offset = 0;
    
    for (const shard of shards) {
      if (shard.length > 0) {
        shard.copy(combined, offset);
        offset += shard.length;
      }
    }
    
    return combined;
  }

  /**
   * Hash data for integrity verification
   * @private
   * @param {Buffer} data - Data to hash
   * @returns {string} Hash as hex string
   */
  _hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Create and export a singleton instance
const microshardingService = new MicroshardingService();

// Helper function to get the microsharder instance
export function getMicrosharder() {
  return microshardingService;
}

// Add method to delete shards if missing
async function deleteShards(shardIds) {
  try {
    for (const shardId of shardIds) {
      await remove(shardId);
    }
    return true;
  } catch (error) {
    microshardLogger.error('Failed to delete shards', { error: error.message });
    return false;
  }
}

export default microshardingService;
