//backend/services/userService.mjs
/**
 * User Service - Manages user accounts and profiles
 * Stub implementation to support the invite system
 */
import logger from '../utils/logging/logger.mjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';

// File to store users
const USERS_FILE = getDataFilePath('users/users.json');

// In-memory user store
let userStore = {};
let initialized = false;

// Logger
const userLogger = logger.child({ module: 'user-service' });

/**
 * Initialize user store
 */
async function initUserStore() {
  if (initialized) return true;
  
  try {
    // Ensure data directory exists
    const dir = path.dirname(USERS_FILE);
    try {
      await fs.access(dir, { constants: fs.constants.F_OK });
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Load existing users from file
    try {
      await fs.access(USERS_FILE, { constants: fs.constants.F_OK });
      const data = await fs.readFile(USERS_FILE, 'utf8');
      userStore = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty store
      userStore = {};
      await fs.writeFile(USERS_FILE, JSON.stringify(userStore, null, 2));
    }
    
    initialized = true;
    return true;
  } catch (error) {
    userLogger.error('Failed to initialize user store', { error: error.message });
    return false;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<string|null>} User ID or null on failure
 */
async function createUser(userData = {}) {
  try {
    await initUserStore();
    
    const userId = userData.id || uuidv4();
    
    userStore[userId] = {
      id: userId,
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    // Save to file
    await fs.writeFile(USERS_FILE, JSON.stringify(userStore, null, 2));
    
    userLogger.info('Created user', { userId });
    return userId;
  } catch (error) {
    userLogger.error('Failed to create user', { error: error.message });
    return null;
  }
}

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUser(userId) {
  try {
    await initUserStore();
    return userStore[userId] || null;
  } catch (error) {
    userLogger.error('Failed to get user', { error: error.message, userId });
    return null;
  }
}

/**
 * Update a user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
async function updateUser(userId, updates = {}) {
  try {
    await initUserStore();
    
    if (!userStore[userId]) {
      return false;
    }
    
    userStore[userId] = {
      ...userStore[userId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Save to file
    await fs.writeFile(USERS_FILE, JSON.stringify(userStore, null, 2));
    
    userLogger.info('Updated user', { userId });
    return true;
  } catch (error) {
    userLogger.error('Failed to update user', { error: error.message, userId });
    return false;
  }
}

// Initialize on module load
initUserStore().catch(error => {
  userLogger.error('Failed to initialize user store on module load', { error: error.message });
});

export default {
  createUser,
  getUser,
  updateUser
};
