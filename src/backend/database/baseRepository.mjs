import { EventEmitter } from 'events';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import { storageFactory } from '../utils/storage/index.mjs';
import crypto from 'crypto';

const repoLogger = logger.child({ module: 'base-repository' });

/**
 * Base Repository class for all data access
 */
export class BaseRepository extends EventEmitter {
  /**
   * Create a new repository
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Repository options
   */
  constructor(collectionName, options = {}) {
    super();
    this.collectionName = collectionName;
    this.options = options;
    this.storage = storageFactory(collectionName, options.storage || {});
    this.initialized = false;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.create = this.create.bind(this);
    this.findById = this.findById.bind(this);
    this.findAll = this.findAll.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * Initialize the repository
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.storage.initialize();
      this.initialized = true;
      repoLogger.info(`Repository ${this.collectionName} initialized`);
      
      return true;
    } catch (error) {
      repoLogger.error(`Failed to initialize repository ${this.collectionName}`, { 
        error: error.message 
      });
      
      throw createError('internal', `Repository initialization failed: ${error.message}`);
    }
  }
  
  /**
   * Ensure repository is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Created item
   */
  async create(data) {
    await this.ensureInitialized();
    
    try {
      if (!data.id) {
        data.id = crypto.randomUUID();
      }
      
      // Check if item already exists
      const existingItem = await this.storage.findById(data.id);
      if (existingItem) {
        throw createError('validation', `Item with id ${data.id} already exists in ${this.collectionName}`);
      }
      
      // Store the item
      await this.storage.create(data);
      
      // Emit event
      this.emit('created', data);
      
      return data;
    } catch (error) {
      if (error.statusCode) throw error;
      
      repoLogger.error(`Failed to create item in ${this.collectionName}`, {
        error: error.message
      });
      
      throw createError('internal', `Failed to create item in ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Find an item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} Found item or null
   */
  async findById(id) {
    await this.ensureInitialized();
    
    try {
      return await this.storage.findById(id);
    } catch (error) {
      repoLogger.error(`Failed to find item by ID in ${this.collectionName}`, {
        id,
        error: error.message
      });
      
      throw createError('internal', 'Failed to find item by ID', {
        originalError: error.message
      });
    }
  }
  
  /**
   * Find items by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Result with data and pagination
   */
  async findAll(criteria = {}, options = {}) {
    await this.ensureInitialized();
    
    try {
      return await this.storage.findAll(criteria, options);
    } catch (error) {
      repoLogger.error(`Failed to find items in ${this.collectionName}`, {
        criteria,
        options,
        error: error.message
      });
      
      throw createError('internal', `Failed to find items in ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Update an item
   * @param {string} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated item
   */
  async update(id, data) {
    await this.ensureInitialized();
    
    try {
      const existingItem = await this.storage.findById(id);
      if (!existingItem) {
        throw createError('notFound', `Item with id ${id} not found in ${this.collectionName}`);
      }
      
      // Create updated item (preserve id)
      const updatedItem = {
        ...existingItem,
        ...data,
        id
      };
      
      // Store the updated item
      await this.storage.update(id, updatedItem);
      
      // Emit event
      this.emit('updated', updatedItem);
      
      return updatedItem;
    } catch (error) {
      if (error.statusCode) throw error;
      
      repoLogger.error(`Failed to update item in ${this.collectionName}`, {
        id,
        error: error.message
      });
      
      throw createError('internal', `Failed to update item in ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Delete an item
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    await this.ensureInitialized();
    
    try {
      const existingItem = await this.storage.findById(id);
      if (!existingItem) {
        throw createError('notFound', `Item with id ${id} not found in ${this.collectionName}`);
      }
      
      // Remove from storage
      await this.storage.delete(id);
      
      // Emit event
      this.emit('deleted', id);
      
      return true;
    } catch (error) {
      if (error.statusCode) throw error;
      
      repoLogger.error(`Failed to delete item in ${this.collectionName}`, {
        id,
        error: error.message
      });
      
      throw createError('internal', `Failed to delete item in ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Begin a transaction
   */
  beginTransaction() {
    this.storage.beginTransaction();
    return this;
  }
  
  /**
   * Commit a transaction
   * @returns {Promise<boolean>} Success status
   */
  async commitTransaction() {
    try {
      await this.storage.commitTransaction();
      return true;
    } catch (error) {
      repoLogger.error(`Failed to commit transaction for ${this.collectionName}`, {
        error: error.message
      });
      
      throw createError('internal', `Failed to commit transaction for ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Rollback a transaction
   * @returns {Promise<boolean>} Success status
   */
  async rollbackTransaction() {
    try {
      await this.storage.rollbackTransaction();
      return true;
    } catch (error) {
      repoLogger.error(`Failed to rollback transaction for ${this.collectionName}`, {
        error: error.message
      });
      
      throw createError('internal', `Failed to rollback transaction for ${this.collectionName}`, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Execute a function within a transaction
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} Function result
   */
  async withTransaction(fn) {
    const wasInTransaction = this.storage.isInTransaction;
    
    if (!wasInTransaction) {
      this.beginTransaction();
    }
    
    try {
      const result = await fn(this);
      
      if (!wasInTransaction) {
        await this.commitTransaction();
      }
      
      return result;
    } catch (error) {
      if (!wasInTransaction) {
        await this.rollbackTransaction();
      }
      
      throw error;
    }
  }
}
