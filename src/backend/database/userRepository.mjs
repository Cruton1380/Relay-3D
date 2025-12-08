import { BaseRepository } from './baseRepository.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import configService from '../config-service/index.mjs';

const userLogger = logger.child({ module: 'user-repository' });

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
    this.indexedFields = new Set(); // Initialize indexedFields as a Set
    this.indexedFields.add('publicKey');
    this.indexedFields.add('regionId');
  }
  
  /**
   * Find a user by public key
   * @param {string} publicKey - User's public key
   * @returns {Promise<Object|null>} User or null if not found
   */
  async findByPublicKey(publicKey) {
    if (!publicKey) {
      throw createError('validation', 'Public key is required');
    }
    
    await this.ensureInitialized();
    
    try {
      // Use index if available
      if (this.indices.has('publicKey')) {
        return this.indices.get('publicKey').get(publicKey) || null;
      }
      
      // Fallback to scanning all data
      for (const user of this.data.values()) {
        if (user.publicKey === publicKey) {
          return user;
        }
      }
      
      return null;
    } catch (error) {
      userLogger.error('Error finding user by public key', { 
        publicKey, 
        error: error.message 
      });
      throw createError('internal', 'Failed to find user by public key', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Get users by region
   * @param {string} regionId - Region ID
   * @param {Object} options - Query options (pagination, sorting, etc.)
   * @returns {Promise<Array>} List of users in the region
   */
  async getUsersByRegion(regionId, options = {}) {
    if (!regionId) {
      throw createError('validation', 'Region ID is required');
    }
    
    await this.ensureInitialized();
    
    try {
      const result = await this.findAll({ regionId }, options);
      return result.data;
    } catch (error) {
      userLogger.error('Error getting users by region', { 
        regionId, 
        error: error.message 
      });
      throw createError('internal', 'Failed to get users by region', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    // Validate required fields and data types
    if (!userData || !userData.publicKey) {
      throw createError('validation', 'Public key is required');
    }
    
    if (!userData.regionId) {
      throw createError('validation', 'Region ID is required');
    }
    
    // Validate data types
    if (typeof userData.publicKey !== 'string') {
      throw createError('validation', 'Public key must be a string');
    }
    
    if (typeof userData.regionId !== 'string') {
      throw createError('validation', 'Region ID must be a string');
    }
    
    // Check if user already exists
    const existingUser = await this.findByPublicKey(userData.publicKey);
    if (existingUser) {
      throw createError('validation', 'User with this public key already exists', { 
        code: 'USER_EXISTS', 
        statusCode: 409 
      });
    }
    
    try {
      // Add timestamps
      const now = Date.now();
      const user = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        isActive: true
      };
      
      return await this.create(user);
    } catch (error) {
      userLogger.error('Error creating user', { 
        publicKey: userData.publicKey, 
        error: error.message 
      });
      throw createError('internal', 'Failed to create user', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    if (!userId) {
      throw createError('validation', 'User ID is required');
    }
    
    try {
      // Find user first
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw createError('notFound', 'User not found', { 
          code: 'USER_NOT_FOUND' 
        });
      }
      
      // Filter out protected fields
      const protectedFields = new Set(['id', 'createdAt']);
      const filteredData = Object.keys(userData)
        .filter(key => !protectedFields.has(key))
        .reduce((obj, key) => {
          obj[key] = userData[key];
          return obj;
        }, {});
      
      // Add updated timestamp
      const updatedUser = {
        ...filteredData,
        updatedAt: Date.now()
      };
      
      return await this.update(userId, updatedUser);
    } catch (error) {
      // If it's already our error type, just rethrow it
      if (error.statusCode) {
        throw error;
      }
      
      userLogger.error('Error updating user', { 
        userId, 
        error: error.message 
      });
      throw createError('internal', 'Failed to update user', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Deactivate a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async deactivateUser(userId) {
    if (!userId) {
      throw createError('validation', 'User ID is required');
    }
    
    try {
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw createError('notFound', 'User not found', { 
          code: 'USER_NOT_FOUND' 
        });
      }
      
      return await this.update(userId, {
        isActive: false,
        updatedAt: Date.now(),
        deactivatedAt: Date.now()
      });
    } catch (error) {
      // If it's already our error type, just rethrow it
      if (error.statusCode) {
        throw error;
      }
      
      userLogger.error('Error deactivating user', { 
        userId, 
        error: error.message 
      });
      throw createError('internal', 'Failed to deactivate user', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Reactivate a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async reactivateUser(userId) {
    try {
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw createError('notFound', 'User not found', { 
          code: 'USER_NOT_FOUND' 
        });
      }
      
      return await this.update(userId, {
        isActive: true,
        reactivatedAt: Date.now(),
        deactivatedAt: null
      });
    } catch (error) {
      // If it's already our error type, just rethrow it
      if (error.statusCode) {
        throw error;
      }
      
      userLogger.error('Error reactivating user', { 
        userId, 
        error: error.message 
      });
      throw createError('internal', 'Failed to reactivate user', { 
        originalError: error.message 
      });
    }
  }
  
  /**
   * Update user activity timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async updateActivity(userId) {
    try {
      return await this.update(userId, {
        lastActivityAt: Date.now()
      });
    } catch (error) {
      userLogger.warn('Failed to update user activity', { 
        userId, 
        error: error.message 
      });
      // Don't throw here, just log the warning
      return null;
    }
  }
}

// Export both the class and the singleton instance
export { UserRepository };

// Create and export singleton instance as default
const userRepository = new UserRepository();
export default userRepository;
export { userRepository };
