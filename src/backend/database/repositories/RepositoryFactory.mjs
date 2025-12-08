// backend/database/repositories/RepositoryFactory.mjs

import { FileRepository } from './FileRepository.mjs';
import { MongoRepository } from './MongoRepository.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../../utils/common/errors.mjs';

const factoryLogger = logger.child({ module: 'repository-factory' });

/**
 * Repository Factory for creating appropriate repository instances
 * Based on environment configuration, returns either FileRepository or MongoRepository
 */
export class RepositoryFactory {
  static instances = new Map();
  
  /**
   * Get repository storage type from environment
   * @returns {string} Storage type ('file' or 'mongo')
   */
  static getStorageType() {
    return process.env.REPOSITORY_TYPE || 'file';
  }

  /**
   * Create or get existing repository instance
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Repository options
   * @returns {Repository} Repository instance
   */
  static getRepository(collectionName, options = {}) {
    const cacheKey = `${collectionName}_${this.getStorageType()}`;
    
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey);
    }

    const storageType = this.getStorageType();
    let repository;

    try {
      switch (storageType) {
        case 'file':
          repository = new FileRepository(collectionName, options);
          factoryLogger.info(`Created FileRepository for collection: ${collectionName}`);
          break;
          
        case 'mongo':
          repository = new MongoRepository(collectionName, options);
          factoryLogger.info(`Created MongoRepository for collection: ${collectionName}`);
          break;
          
        default:
          throw createError('validation', `Unsupported repository type: ${storageType}`);
      }

      this.instances.set(cacheKey, repository);
      return repository;
    } catch (error) {
      factoryLogger.error(`Failed to create repository for ${collectionName}`, {
        storageType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new repository instance (bypasses cache)
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Repository options
   * @param {string} forceType - Force specific repository type
   * @returns {Repository} Repository instance
   */
  static createRepository(collectionName, options = {}, forceType = null) {
    const storageType = forceType || this.getStorageType();

    try {
      switch (storageType) {
        case 'file':
          return new FileRepository(collectionName, options);
          
        case 'mongo':
          return new MongoRepository(collectionName, options);
          
        default:
          throw createError('validation', `Unsupported repository type: ${storageType}`);
      }
    } catch (error) {
      factoryLogger.error(`Failed to create repository for ${collectionName}`, {
        storageType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clear cached repository instances
   */
  static clearCache() {
    this.instances.clear();
    factoryLogger.info('Repository cache cleared');
  }

  /**
   * Get current storage configuration info
   * @returns {Object} Storage configuration
   */
  static getStorageInfo() {
    return {
      type: this.getStorageType(),
      cachedInstances: Array.from(this.instances.keys()),
      isMongoReady: this.getStorageType() === 'mongo' ? false : true, // MongoDB readiness check when implemented
      isFileReady: true
    };
  }

  /**
   * Initialize all repositories (useful for startup)
   * @param {Array<string>} collectionNames - Collection names to initialize
   * @returns {Promise<Object>} Initialization results
   */
  static async initializeRepositories(collectionNames = []) {
    const results = {};
    
    for (const collectionName of collectionNames) {
      try {
        const repository = this.getRepository(collectionName);
        await repository.initialize();
        results[collectionName] = { success: true };
        factoryLogger.info(`Initialized repository for ${collectionName}`);
      } catch (error) {
        results[collectionName] = { 
          success: false, 
          error: error.message 
        };
        factoryLogger.error(`Failed to initialize repository for ${collectionName}`, {
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Switch repository type (for testing or migration)
   * WARNING: This clears the cache and should be used carefully
   * @param {string} newType - New repository type ('file' or 'mongo')
   */
  static switchRepositoryType(newType) {
    if (!['file', 'mongo'].includes(newType)) {
      throw createError('validation', `Invalid repository type: ${newType}`);
    }

    process.env.REPOSITORY_TYPE = newType;
    this.clearCache();
    
    factoryLogger.warn(`Repository type switched to: ${newType}`);
  }
}

// Convenience function for getting repositories
export function getRepository(collectionName, options = {}) {
  return RepositoryFactory.getRepository(collectionName, options);
}

// Export factory as default
export default RepositoryFactory;
