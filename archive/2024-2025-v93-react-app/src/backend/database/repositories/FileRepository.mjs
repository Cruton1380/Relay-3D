// backend/database/repositories/FileRepository.mjs

import { BaseRepository } from '../baseRepository.mjs';
import { RepositoryInterface } from '../interfaces/RepositoryInterface.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../../utils/common/errors.mjs';

const fileLogger = logger.child({ module: 'file-repository' });

/**
 * File-based Repository Implementation
 * Extends BaseRepository and implements RepositoryInterface for consistency
 * Uses the existing sophisticated file storage system
 */
export class FileRepository extends BaseRepository {
  constructor(collectionName, options = {}) {
    super(collectionName, options);
    fileLogger.info(`FileRepository created for collection: ${collectionName}`);
  }

  /**
   * Find an entity by specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Promise<Object|null>} Found entity or null
   */
  async findByField(field, value) {
    await this.ensureInitialized();
    
    try {
      // Use the existing findAll method with criteria
      const result = await this.findAll({ [field]: value });
      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      fileLogger.error(`Failed to find entity by field in ${this.collectionName}`, {
        field,
        value,
        error: error.message
      });
      throw createError('internal', `Failed to find entity by field: ${error.message}`);
    }
  }

  /**
   * Count entities by criteria
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Count of matching entities
   */
  async count(criteria = {}) {
    await this.ensureInitialized();
    
    try {
      const result = await this.findAll(criteria);
      return result.data ? result.data.length : 0;
    } catch (error) {
      fileLogger.error(`Failed to count entities in ${this.collectionName}`, {
        criteria,
        error: error.message
      });
      throw createError('internal', `Failed to count entities: ${error.message}`);
    }
  }

  /**
   * Check if an entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Existence status
   */
  async exists(id) {
    await this.ensureInitialized();
    
    try {
      const entity = await this.findById(id);
      return entity !== null;
    } catch (error) {
      fileLogger.error(`Failed to check entity existence in ${this.collectionName}`, {
        id,
        error: error.message
      });
      throw createError('internal', `Failed to check entity existence: ${error.message}`);
    }
  }

  /**
   * Perform aggregation operations (simplified for file storage)
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    await this.ensureInitialized();
    
    try {
      // Simplified aggregation for file storage
      // This is a basic implementation that can be extended
      let result = await this.findAll();
      let data = result.data || [];

      for (const stage of pipeline) {
        if (stage.$match) {
          data = data.filter(item => {
            return Object.entries(stage.$match).every(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                // Handle operators like $gte, $lte, $in, etc.
                if (value.$gte !== undefined) return item[key] >= value.$gte;
                if (value.$lte !== undefined) return item[key] <= value.$lte;
                if (value.$gt !== undefined) return item[key] > value.$gt;
                if (value.$lt !== undefined) return item[key] < value.$lt;
                if (value.$in !== undefined) return value.$in.includes(item[key]);
                if (value.$ne !== undefined) return item[key] !== value.$ne;
                return false;
              }
              return item[key] === value;
            });
          });
        }
        
        if (stage.$group) {
          const groups = new Map();
          const groupKey = stage.$group._id;
          
          data.forEach(item => {
            const key = groupKey === null ? 'all' : (typeof groupKey === 'string' ? item[groupKey.substring(1)] : groupKey);
            
            if (!groups.has(key)) {
              groups.set(key, { _id: key });
            }
            
            const group = groups.get(key);
            
            // Handle aggregation operators
            Object.entries(stage.$group).forEach(([field, operation]) => {
              if (field === '_id') return;
              
              if (operation.$sum !== undefined) {
                if (operation.$sum === 1) {
                  group[field] = (group[field] || 0) + 1;
                } else if (typeof operation.$sum === 'string' && operation.$sum.startsWith('$')) {
                  const fieldName = operation.$sum.substring(1);
                  group[field] = (group[field] || 0) + (item[fieldName] || 0);
                }
              }
              
              if (operation.$avg !== undefined && typeof operation.$avg === 'string' && operation.$avg.startsWith('$')) {
                const fieldName = operation.$avg.substring(1);
                if (!group[`${field}_sum`]) group[`${field}_sum`] = 0;
                if (!group[`${field}_count`]) group[`${field}_count`] = 0;
                group[`${field}_sum`] += item[fieldName] || 0;
                group[`${field}_count`]++;
                group[field] = group[`${field}_sum`] / group[`${field}_count`];
              }
            });
          });
          
          data = Array.from(groups.values());
        }
        
        if (stage.$sort) {
          const sortFields = Object.entries(stage.$sort);
          data.sort((a, b) => {
            for (const [field, direction] of sortFields) {
              const aVal = a[field];
              const bVal = b[field];
              if (aVal < bVal) return direction === 1 ? -1 : 1;
              if (aVal > bVal) return direction === 1 ? 1 : -1;
            }
            return 0;
          });
        }
        
        if (stage.$limit) {
          data = data.slice(0, stage.$limit);
        }
        
        if (stage.$skip) {
          data = data.slice(stage.$skip);
        }
      }

      return data;
    } catch (error) {
      fileLogger.error(`Failed to perform aggregation in ${this.collectionName}`, {
        pipeline,
        error: error.message
      });
      throw createError('internal', `Failed to perform aggregation: ${error.message}`);
    }
  }

  /**
   * Execute a transaction (file storage doesn't support true transactions, but provides consistency)
   * @param {Function} transactionFn - Function to execute within transaction
   * @returns {Promise<any>} Transaction result
   */
  async transaction(transactionFn) {
    try {
      // Use the BaseRepository's withTransaction method
      return await this.withTransaction(transactionFn);
    } catch (error) {
      fileLogger.error(`Failed to execute transaction in ${this.collectionName}`, {
        error: error.message
      });
      throw createError('internal', `Failed to execute transaction: ${error.message}`);
    }
  }

  /**
   * Get collection name
   * @returns {string} Collection name
   */
  getCollectionName() {
    return this.collectionName;
  }
}

export default FileRepository;
