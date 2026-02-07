//backend/users/userManager.mjs
/**
 * User manager for tracking valid users and their regions
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

// Initialize logger
const userLogger = logger.child({ module: 'user-manager' });

// Constants
const USERS_FILE = path.join(process.env.DATA_DIR || './data', 'users', 'users.json');

// In-memory store of user data
let users = new Map();
let usersByRegion = new Map();
let initialized = false;

/**
 * Initialize the user manager
 * @returns {Promise<void>}
 */
export async function initUserManager() {
  if (initialized) return;
  
  try {
    await loadUserData();
    initialized = true;
    userLogger.info('User manager initialized');
  } catch (error) {
    userLogger.error('Failed to initialize user manager', { error: error.message });
    throw error;
  }
}

/**
 * Load user data from disk
 * @returns {Promise<void>}
 */
async function loadUserData() {
  try {
    // Check if users file exists
    await fs.access(USERS_FILE);
    
    // Load data
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    
    // Convert to Map
    users = new Map(Object.entries(data));
    
    // Build region index
    rebuildRegionIndex();
    
    userLogger.info(`Loaded data for ${users.size} users`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      userLogger.info('No existing user data found, starting fresh');
      users = new Map();
      usersByRegion = new Map();
      await saveUserData();
    } else {
      throw error;
    }
  }
}

/**
 * Save user data to disk
 * @returns {Promise<void>}
 */
async function saveUserData() {
  try {
    // Ensure directory exists
    const dir = path.dirname(USERS_FILE);
    await fs.mkdir(dir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') throw err;
    });
    
    // Convert Map to object for JSON serialization
    const data = Object.fromEntries(users);
    
    // Save to file
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    userLogger.info(`Saved data for ${users.size} users`);
  } catch (error) {
    userLogger.error('Failed to save user data', { error: error.message });
    throw error;
  }
}

/**
 * Rebuild the index of users by region
 */
function rebuildRegionIndex() {
  usersByRegion = new Map();
  
  for (const [userId, userData] of users.entries()) {
    if (!userData.active || userData.votesRevoked) continue;
    
    const regionId = userData.lastRegion;
    if (!regionId) continue;
    
    if (!usersByRegion.has(regionId)) {
      usersByRegion.set(regionId, new Set());
    }
    
    usersByRegion.get(regionId).add(userId);
  }
}

/**
 * Update a user's region
 * @param {string} userId - User ID
 * @param {string} regionId - Region ID
 * @returns {Promise<void>}
 */
export async function updateUserRegion(userId, regionId) {
  if (!initialized) {
    await initUserManager();
  }
  
  try {
    // Get existing user or create new one
    const userData = users.get(userId) || {
      active: true,
      votesRevoked: false,
      created: Date.now()
    };
    
    // Update region
    userData.lastRegion = regionId;
    userData.lastRegionUpdate = Date.now();
    
    // Update in-memory store
    users.set(userId, userData);
    
    // Update region index
    rebuildRegionIndex();
    
    // Save data
    await saveUserData();
    
    userLogger.info(`Updated region for user ${userId} to ${regionId}`);
  } catch (error) {
    userLogger.error('Failed to update user region', { 
      error: error.message,
      userId,
      regionId
    });
    throw error;
  }
}

/**
 * Deactivate a user
 * @param {string} userId - User ID
 * @param {boolean} revokeVotes - Whether to revoke the user's votes
 * @returns {Promise<void>}
 */
export async function deactivateUser(userId, revokeVotes = false) {
  if (!initialized) {
    await initUserManager();
  }
  
  try {
    const userData = users.get(userId);
    if (!userData) {
      userLogger.warn(`Attempted to deactivate non-existent user ${userId}`);
      return;
    }
    
    userData.active = false;
    userData.deactivatedAt = Date.now();
    
    if (revokeVotes) {
      userData.votesRevoked = true;
    }
    
    users.set(userId, userData);
    
    // Update region index
    rebuildRegionIndex();
    
    // Save data
    await saveUserData();
    
    userLogger.info(`Deactivated user ${userId}`, { revokeVotes });
  } catch (error) {
    userLogger.error('Failed to deactivate user', { 
      error: error.message,
      userId
    });
    throw error;
  }
}

/**
 * Reactivate a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function reactivateUser(userId) {
  if (!initialized) {
    await initUserManager();
  }
  
  try {
    const userData = users.get(userId);
    if (!userData) {
      userLogger.warn(`Attempted to reactivate non-existent user ${userId}`);
      return;
    }
    
    userData.active = true;
    userData.reactivatedAt = Date.now();
    
    users.set(userId, userData);
    
    // Update region index
    rebuildRegionIndex();
    
    // Save data
    await saveUserData();
    
    userLogger.info(`Reactivated user ${userId}`);
  } catch (error) {
    userLogger.error('Failed to reactivate user', { 
      error: error.message,
      userId
    });
    throw error;
  }
}

/**
 * Get all valid users for a specific region
 * @param {string} regionId - Region ID
 * @returns {Promise<Set>} Set of valid user IDs
 */
export async function getValidUsersByRegion(regionId) {
  if (!initialized) {
    await initUserManager();
  }
  
  // Return a copy of the set of valid users for this region
  return new Set(usersByRegion.get(regionId) || []);
}

/**
 * Check if a user is valid (active and votes not revoked)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether the user is valid
 */
export async function isUserValid(userId) {
  if (!initialized) {
    await initUserManager();
  }
  
  const userData = users.get(userId);
  
  if (!userData) {
    return false;
  }
  
  return userData.active && !userData.votesRevoked;
}

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @returns {Promise<string>} User ID
 */
export async function createUser(userData) {
  if (!initialized) {
    await initUserManager();
  }
  
  try {
    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user record
    const userRecord = {
      active: true,
      votesRevoked: false,
      created: Date.now(),
      publicKey: userData.publicKey,
      biometricHash: userData.biometricHash,
      deviceAttestations: userData.deviceAttestations || [],
      inviteCode: userData.inviteCode,
      biometricStatus: 'pending',
      ...userData
    };
    
    // Store user
    users.set(userId, userRecord);
    
    // Update region index if region provided
    if (userData.lastRegion) {
      rebuildRegionIndex();
    }
    
    // Save data
    await saveUserData();
    
    userLogger.info(`Created new user ${userId}`);
    return userId;
  } catch (error) {
    userLogger.error('Failed to create user', { error: error.message });
    throw error;
  }
}

/**
 * Update user biometric status
 * @param {string} userId - User ID
 * @param {string} status - Biometric status
 * @returns {Promise<void>}
 */
export async function updateUserBiometricStatus(userId, status) {
  if (!initialized) {
    await initUserManager();
  }
  
  try {
    const userData = users.get(userId);
    if (!userData) {
      throw new Error(`User ${userId} not found`);
    }
    
    userData.biometricStatus = status;
    userData.biometricStatusUpdated = Date.now();
    
    users.set(userId, userData);
    
    // Save data
    await saveUserData();
    
    userLogger.info(`Updated biometric status for user ${userId} to ${status}`);
  } catch (error) {
    userLogger.error('Failed to update user biometric status', { 
      error: error.message,
      userId,
      status
    });
    throw error;
  }
}

// Export API
export default {
  initUserManager,
  updateUserRegion,
  deactivateUser,
  reactivateUser,
  getValidUsersByRegion,
  isUserValid,
  createUser,
  updateUserBiometricStatus
};
