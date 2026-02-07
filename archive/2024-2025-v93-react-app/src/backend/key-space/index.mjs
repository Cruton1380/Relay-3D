//backend/services/keySpaceService.mjs
/**
 * KeySpaceService - A distributed key-value store built on top of the DHT
 * Provides high-level abstractions for storing and retrieving data with sharding support
 */
import crypto from 'crypto';
import { store, retrieve, remove } from '../p2p-service/dht.mjs';
import logger from '../utils/logging/logger.mjs';
import { getMicrosharder } from '../microsharding-service/index.mjs';
import { encryptData } from '../utils/crypto/encryption.mjs';

// Create a dedicated logger
const keySpaceLogger = logger.child({ module: 'keyspace' });

// Constants
const DEFAULT_REDUNDANCY = 3; // Default redundancy factor for user data
const MAX_VALUE_SIZE = 1024 * 1024; // 1MB max size per value
const KEYSPACE_PREFIX = 'ks:'; // Prefix for keyspace keys in DHT
const ENCRYPTION_ENABLED = process.env.KEYSPACE_ENCRYPTION === 'true' || false;

/**
 * Encode data to base64
 * @param {string|object|Buffer} data - Data to encode
 * @returns {string} Base64 encoded string
 */
function encodeBase64(data) {
  if (typeof data === 'object' && !(data instanceof Buffer)) {
    data = JSON.stringify(data);
  }
  return Buffer.from(data).toString('base64');
}

/**
 * Decode base64 data
 * @param {string} base64String - Base64 encoded string
 * @param {boolean} parseJson - Whether to parse as JSON
 * @returns {string|object|Buffer} Decoded data
 */
function decodeBase64(base64String, parseJson = false) {
  const decoded = Buffer.from(base64String, 'base64').toString('utf8');
  if (parseJson) {
    try {
      return JSON.parse(decoded);
    } catch (error) {
      keySpaceLogger.warn('Failed to parse JSON from decoded data', { error: error.message });
      return decoded;
    }
  }
  return decoded;
}

class KeySpaceService {
  constructor() {
    this.encryptionKey = process.env.KEYSPACE_ENCRYPTION_KEY || null;
    keySpaceLogger.info('KeySpaceService initialized', { 
      encryptionEnabled: ENCRYPTION_ENABLED 
    });
  }

  /**
   * Generate a unique key with prefix
   * @param {string} namespace - Namespace for the key
   * @param {string} key - Key name
   * @returns {string} Prefixed key
   */
  generateKey(namespace, key) {
    return `${KEYSPACE_PREFIX}${namespace}:${key}`;
  }

  /**
   * Store a value in the keyspace
   * @param {string} namespace - Namespace for the key
   * @param {string} key - Key name
   * @param {*} value - Value to store
   * @param {Object} options - Storage options
   * @returns {Promise<boolean>} Success status
   */
  async set(namespace, key, value, options = {}) {
    const { 
      redundancy = DEFAULT_REDUNDANCY,
      ttl = null,
      encrypt = ENCRYPTION_ENABLED
    } = options;

    const fullKey = this.generateKey(namespace, key);

    try {
      // Serialize if needed
      let serializedValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);

      // Encrypt if enabled
      if (encrypt && this.encryptionKey) {
        serializedValue = encryptData(serializedValue, this.encryptionKey);
      }

      // Encode to base64
      const encodedValue = encodeBase64(serializedValue);

      // Check if value exceeds size limit
      if (encodedValue.length > MAX_VALUE_SIZE) {
        keySpaceLogger.debug(`Value size (${encodedValue.length}) exceeds limit, using microsharding`, { 
          key: fullKey,
          size: encodedValue.length
        });
        
        // Use microsharding for large values
        const microsharder = getMicrosharder();
        const shardingResult = await microsharder.shardAndDistributeData(encodedValue, {
          replicationFactor: redundancy,
          keyPrefix: `${fullKey}:shard:`
        });

        // Store sharding metadata
        const metadata = {
          type: 'sharded',
          shards: shardingResult.shardIds,
          totalSize: encodedValue.length,
          dataId: shardingResult.dataId
        };

        return await store(fullKey, JSON.stringify(metadata), { redundancy });
      } else {
        // Store directly for small values
        return await store(fullKey, encodedValue, { 
          redundancy,
          ttl 
        });
      }
    } catch (error) {
      keySpaceLogger.error(`Failed to set ${fullKey}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve a value from the keyspace
   * @param {string} namespace - Namespace for the key
   * @param {string} key - Key name
   * @param {Object} options - Retrieval options
   * @returns {Promise<*>} Retrieved value
   */
  async get(namespace, key, options = {}) {
    const {
      decrypt = ENCRYPTION_ENABLED,
      parseJson = true
    } = options;

    const fullKey = this.generateKey(namespace, key);

    try {
      // Retrieve from DHT
      const result = await retrieve(fullKey);
      
      if (!result) {
        return null;
      }

      // Check if this is sharded data
      let data;
      try {
        const metadata = JSON.parse(result);
        if (metadata.type === 'sharded') {
          // Reconstruct from shards
          const microsharder = getMicrosharder();
          data = await microsharder.retrieveAndReconstructData(metadata.dataId);
          
          if (!data) {
            keySpaceLogger.error(`Failed to reconstruct sharded data for ${fullKey}`);
            return null;
          }
        }
      } catch (e) {
        // Not JSON or not sharded data
        data = result;
      }

      // If still not set, use the direct result
      if (!data) {
        data = result;
      }

      // Decode from base64
      let decodedValue = decodeBase64(data, false);

      // Decrypt if needed
      if (decrypt && this.encryptionKey) {
        try {
          decodedValue = decryptData(decodedValue, this.encryptionKey);
        } catch (decryptError) {
          keySpaceLogger.error(`Failed to decrypt value for ${fullKey}`, { 
            error: decryptError.message 
          });
          return null;
        }
      }

      // Parse JSON if needed
      if (parseJson) {
        try {
          return JSON.parse(decodedValue);
        } catch (parseError) {
          keySpaceLogger.debug(`Value for ${fullKey} is not JSON, returning as string`);
          return decodedValue;
        }
      }

      return decodedValue;
    } catch (error) {
      keySpaceLogger.error(`Failed to get ${fullKey}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Delete a value from the keyspace
   * @param {string} namespace - Namespace for the key
   * @param {string} key - Key name
   * @returns {Promise<boolean>} Success status
   */
  async delete(namespace, key) {
    const fullKey = this.generateKey(namespace, key);

    try {
      // Check if this is sharded data
      const result = await retrieve(fullKey);
      
      if (result) {
        try {
          const metadata = JSON.parse(result);
          if (metadata.type === 'sharded') {
            // Delete all shards
            const microsharder = getMicrosharder();
            await microsharder.deleteShards(metadata.shards);
          }
        } catch (e) {
          // Not JSON or not sharded data, continue with normal delete
        }
      }

      // Delete the main key
      return await remove(fullKey);
    } catch (error) {
      keySpaceLogger.error(`Failed to delete ${fullKey}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Check if a key exists in the keyspace
   * @param {string} namespace - Namespace for the key
   * @param {string} key - Key name
   * @returns {Promise<boolean>} Whether the key exists
   */
  async exists(namespace, key) {
    const fullKey = this.generateKey(namespace, key);
    
    try {
      const result = await retrieve(fullKey);
      return result !== null && result !== undefined;
    } catch (error) {
      keySpaceLogger.error(`Failed to check existence of ${fullKey}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Store multiple key-value pairs atomically
   * @param {string} namespace - Namespace for the keys
   * @param {Object} entries - Key-value pairs to store
   * @param {Object} options - Storage options
   * @returns {Promise<boolean>} Success status
   */
  async multiSet(namespace, entries, options = {}) {
    if (!entries || typeof entries !== 'object') {
      throw new Error('Entries must be an object with key-value pairs');
    }

    const results = [];
    for (const [key, value] of Object.entries(entries)) {
      results.push(this.set(namespace, key, value, options));
    }

    try {
      await Promise.all(results);
      return true;
    } catch (error) {
      keySpaceLogger.error(`Failed in multiSet operation for namespace ${namespace}`, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Retrieve multiple values by keys
   * @param {string} namespace - Namespace for the keys
   * @param {Array<string>} keys - Keys to retrieve
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async multiGet(namespace, keys, options = {}) {
    if (!Array.isArray(keys)) {
      throw new Error('Keys must be an array of strings');
    }

    const promises = keys.map(key => this.get(namespace, key, options));
    
    try {
      const results = await Promise.all(promises);
      
      // Create result object
      const resultObj = {};
      keys.forEach((key, index) => {
        resultObj[key] = results[index];
      });
      
      return resultObj;
    } catch (error) {
      keySpaceLogger.error(`Failed in multiGet operation for namespace ${namespace}`, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Set encryption key for the keyspace
   * @param {string} key - Encryption key
   */
  setEncryptionKey(key) {
    this.encryptionKey = key;
    keySpaceLogger.info('Encryption key updated');
  }

  /**
   * Generate a secure random key for a namespace
   * @param {string} namespace - Namespace for the key
   * @returns {string} Generated key
   */
  generateRandomKey(namespace) {
    const randomKey = crypto.randomBytes(16).toString('hex');
    return this.generateKey(namespace, randomKey);
  }
}

// Create and export a singleton instance
const keySpaceService = new KeySpaceService();
export default keySpaceService;

// Helper function to get the keyspace service instance
export function getKeySpaceService() {
  return keySpaceService;
}
