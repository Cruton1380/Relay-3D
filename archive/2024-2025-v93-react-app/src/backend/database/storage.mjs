import fs from 'fs/promises';
import path from 'path';
import { constants } from 'fs';
import logger from '../utils/logging/logger.mjs';
import { EventEmitter } from 'events';

const storageLogger = logger.child({ module: 'storage' });

/**
 * Base Storage interface
 * All storage implementations should extend this class
 */
export class BaseStorage extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
  }
  
  async initialize() {
    throw new Error('Not implemented');
  }
  
  async get(key) {
    throw new Error('Not implemented');
  }
  
  async set(key, value) {
    throw new Error('Not implemented');
  }
  
  async delete(key) {
    throw new Error('Not implemented');
  }
  
  async has(key) {
    throw new Error('Not implemented');
  }
  
  async getAll() {
    throw new Error('Not implemented');
  }
  
  async clear() {
    throw new Error('Not implemented');
  }
}

/**
 * File system storage implementation
 */
export class FileStorage extends BaseStorage {
  constructor(options = {}) {
    super(options);
    this.filePath = options.filePath || path.join(config.paths.data, 'data.json');
    this.data = new Map();
    this.pendingWrite = null;
    this.writeDelay = options.writeDelay || 100;
    this.initialized = false;
  }
  
  /**
   * Initialize storage
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await this.ensureDir();
      
      try {
        // Try to read the file
        this.data = await this._readFile(this.filePath);
        storageLogger.debug(`Loaded data from ${this.filePath}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create empty data
          this.data = {};
          storageLogger.debug(`Created new data store for ${this.name}`);
          await this._writeFile(this.filePath, this.data);
        } else {
          throw error;
        }
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      storageLogger.error(`Failed to initialize storage: ${error.message}`, { 
        name: this.name, 
        type: this.type,
        stack: error.stack
      });
      throw new APIError(`Failed to initialize storage: ${error.message}`, 500, 'STORAGE_ERROR');
    }
  }
  
  /**
   * Ensure the storage directory exists
   * @returns {Promise<void>}
   */
  async ensureDir() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      storageLogger.error(`Failed to create directory: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a value by key
   * @param {string} key - Key to retrieve
   * @returns {Promise<any>} Retrieved value or null
   */
  async get(key) {
    if (!this.initialized) await this.initialize();
    
    return this.data[key];
  }
  
  /**
   * Set a value by key
   * @param {string} key - Key to set
   * @param {any} value - Value to store
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value) {
    if (!this.initialized) await this.initialize();
    
    this.data[key] = value;
    return true;
  }
  
  /**
   * Delete a key
   * @param {string} key - Key to delete
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.initialized) await this.initialize();
    
    if (!(key in this.data)) return false;
    
    delete this.data[key];
    await this._writeFile(this.filePath, this.data);
    
    return true;
  }
  
  /**
   * Check if a key exists
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} Existence status
   */
  async has(key) {
    if (!this.initialized) await this.initialize();
    
    return key in this.data;
  }
  
  /**
   * Get all data
   * @returns {Promise<Object>} All stored data
   */
  async getAll() {
    if (!this.initialized) await this.initialize();
    
    return { ...this.data };
  }
  
  /**
   * Clear all data
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    if (!this.initialized) await this.initialize();
    
    this.data = {};
    await this._writeFile(this.filePath, this.data);
    return true;
  }
  
  /**
   * Helper method to read a file
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File contents
   * @private
   */
  async _readFile(filePath) {
    try {
      await fs.access(filePath, constants.R_OK);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      storageLogger.error(`Failed to read file: ${error.message}`, { path: filePath });
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
  
  /**
   * Helper method to write a file
   * @param {string} filePath - Path to file
   * @param {Object} data - Data to write
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _writeFile(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      storageLogger.error(`Failed to write file: ${error.message}`, { path: filePath });
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }
}

/**
 * Create a storage factory
 * @returns {Function} Storage factory function
 */
export function createStorageFactory() {
  const storageInstances = new Map();
  
  /**
   * Get or create a storage instance
   * @param {string} name - Storage name
   * @param {Object} options - Storage options
   * @returns {Storage} Storage instance
   */
  return function getStorage(name, options = {}) {
    if (storageInstances.has(name)) {
      return storageInstances.get(name);
    }
    
    const type = options.type || 'file';
    let storage;
    
    switch (type) {
      case 'file':
        storage = new FileStorage({
          ...options,
          filePath: options.filePath || path.join(config.paths.data, `${name}.json`)
        });
        break;
        
      // Add other storage types as needed
        
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
    
    storageInstances.set(name, storage);
    return storage;
  };
}

// Export a singleton factory
export const storageFactory = createStorageFactory();

// Export all components in a default object
export default {
  BaseStorage,
  FileStorage,
  storageFactory,
  createStorageFactory
};
