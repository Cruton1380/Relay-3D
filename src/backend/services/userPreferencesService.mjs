// src/backend/services/userPreferencesService.mjs
/**
 * User Preferences Service
 * Manages user privacy preferences and settings
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

// Initialize logger
const prefsLogger = logger.child({ module: 'user-preferences' });

// Constants
const PREFERENCES_FILE = path.join(process.env.DATA_DIR || './data', 'users', 'preferences.json');
const DEFAULT_PRIVACY_LEVEL = 'province';
const VALID_PRIVACY_LEVELS = ['gps', 'city', 'province', 'anonymous'];

// In-memory store
let preferences = new Map();
let initialized = false;

/**
 * Initialize the preferences service
 * @returns {Promise<void>}
 */
export async function initPreferencesService() {
  if (initialized) return;
  
  try {
    await loadPreferences();
    initialized = true;
    prefsLogger.info('User preferences service initialized', { 
      preferencesCount: preferences.size 
    });
  } catch (error) {
    prefsLogger.error('Failed to initialize preferences service', { 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Load preferences from disk
 * @returns {Promise<void>}
 */
async function loadPreferences() {
  try {
    // Check if preferences file exists
    await fs.access(PREFERENCES_FILE);
    
    // Load data
    const data = JSON.parse(await fs.readFile(PREFERENCES_FILE, 'utf8'));
    
    // Convert to Map
    preferences = new Map(Object.entries(data));
    
    prefsLogger.info('Preferences loaded from disk', { 
      count: preferences.size 
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, start with empty preferences
      preferences = new Map();
      prefsLogger.info('No preferences file found, starting with empty preferences');
    } else {
      throw error;
    }
  }
}

/**
 * Save preferences to disk
 * @returns {Promise<void>}
 */
async function savePreferences() {
  try {
    // Convert Map to object
    const data = Object.fromEntries(preferences);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(PREFERENCES_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(PREFERENCES_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    prefsLogger.debug('Preferences saved to disk', { 
      count: preferences.size 
    });
  } catch (error) {
    prefsLogger.error('Failed to save preferences', { 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Get user's privacy level
 * @param {string} userId - User ID
 * @returns {Promise<string>} Privacy level ('gps'|'city'|'province'|'anonymous')
 */
export async function getUserPrivacyLevel(userId) {
  if (!initialized) {
    await initPreferencesService();
  }
  
  const userPrefs = preferences.get(userId);
  const privacyLevel = userPrefs?.privacyLevel || DEFAULT_PRIVACY_LEVEL;
  
  prefsLogger.debug('Retrieved privacy level', { 
    userId, 
    privacyLevel 
  });
  
  return privacyLevel;
}

/**
 * Set user's privacy level
 * @param {string} userId - User ID
 * @param {string} level - Privacy level ('gps'|'city'|'province'|'anonymous')
 * @returns {Promise<void>}
 */
export async function setUserPrivacyLevel(userId, level) {
  if (!initialized) {
    await initPreferencesService();
  }
  
  // Validate privacy level
  if (!VALID_PRIVACY_LEVELS.includes(level)) {
    throw new Error(`Invalid privacy level: ${level}. Must be one of: ${VALID_PRIVACY_LEVELS.join(', ')}`);
  }
  
  // Get existing preferences or create new
  const userPrefs = preferences.get(userId) || {};
  userPrefs.privacyLevel = level;
  
  // Update in-memory store
  preferences.set(userId, userPrefs);
  
  // Save to disk
  await savePreferences();
  
  prefsLogger.info('Privacy level updated', { 
    userId, 
    privacyLevel: level 
  });
}

/**
 * Get default privacy level
 * @returns {string} Default privacy level
 */
export function getDefaultPrivacyLevel() {
  return DEFAULT_PRIVACY_LEVEL;
}

/**
 * Get all valid privacy levels
 * @returns {string[]} Array of valid privacy levels
 */
export function getValidPrivacyLevels() {
  return [...VALID_PRIVACY_LEVELS];
}

/**
 * Get all user preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} User preferences object
 */
export async function getUserPreferences(userId) {
  if (!initialized) {
    await initPreferencesService();
  }
  
  const userPrefs = preferences.get(userId) || {
    privacyLevel: DEFAULT_PRIVACY_LEVEL
  };
  
  return { ...userPrefs };
}

/**
 * Update multiple user preferences
 * @param {string} userId - User ID
 * @param {object} updates - Preferences to update
 * @returns {Promise<void>}
 */
export async function updateUserPreferences(userId, updates) {
  if (!initialized) {
    await initPreferencesService();
  }
  
  // Validate privacy level if provided
  if (updates.privacyLevel && !VALID_PRIVACY_LEVELS.includes(updates.privacyLevel)) {
    throw new Error(`Invalid privacy level: ${updates.privacyLevel}`);
  }
  
  // Get existing preferences or create new
  const userPrefs = preferences.get(userId) || {};
  
  // Merge updates
  Object.assign(userPrefs, updates);
  
  // Update in-memory store
  preferences.set(userId, userPrefs);
  
  // Save to disk
  await savePreferences();
  
  prefsLogger.info('User preferences updated', { 
    userId, 
    updates: Object.keys(updates) 
  });
}

/**
 * Delete user preferences
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteUserPreferences(userId) {
  if (!initialized) {
    await initPreferencesService();
  }
  
  // Remove from in-memory store
  const existed = preferences.delete(userId);
  
  if (existed) {
    // Save to disk
    await savePreferences();
    
    prefsLogger.info('User preferences deleted', { userId });
  }
}

/**
 * Get preferences count
 * @returns {number} Number of users with preferences
 */
export function getPreferencesCount() {
  return preferences.size;
}

// Export for testing
export const _testing = {
  loadPreferences,
  savePreferences,
  getPreferencesMap: () => preferences
};
