// src/backend/services/userLocationService.mjs
/**
 * User Location Service
 * Single source of truth for user locations
 * All votes reference this location (reconciliation on update)
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

const locationLogger = logger.child({ module: 'user-location' });

// File path for persistent storage
const LOCATION_FILE = path.join(process.env.DATA_DIR || './data', 'users', 'locations.json');

// In-memory storage: userId -> location data
const userLocations = new Map();
let initialized = false;

/**
 * Initialize the location service
 */
export async function initLocationService() {
  if (initialized) return;
  
  try {
    await loadLocations();
    initialized = true;
    locationLogger.info('User location service initialized', {
      userCount: userLocations.size
    });
  } catch (error) {
    locationLogger.error('Failed to initialize location service', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Load locations from disk
 */
async function loadLocations() {
  try {
    await fs.access(LOCATION_FILE);
    const data = JSON.parse(await fs.readFile(LOCATION_FILE, 'utf8'));
    
    // Convert to Map
    for (const [userId, location] of Object.entries(data)) {
      userLocations.set(userId, location);
    }
    
    locationLogger.info('Locations loaded from disk', {
      count: userLocations.size
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      locationLogger.info('No location file found, starting fresh');
    } else {
      throw error;
    }
  }
}

/**
 * Save locations to disk
 */
async function saveLocations() {
  try {
    const data = Object.fromEntries(userLocations);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(LOCATION_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(LOCATION_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    locationLogger.debug('Locations saved to disk');
  } catch (error) {
    locationLogger.error('Failed to save locations', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Get user's current location
 * @param {string} userId - User ID
 * @returns {Object|null} Location data or null if not set
 */
export function getUserLocation(userId) {
  if (!initialized) {
    throw new Error('Location service not initialized');
  }
  
  return userLocations.get(userId) || null;
}

/**
 * Update user's location (GPS-verified only)
 * This reconciles ALL votes for this user to new location
 * 
 * @param {string} userId - User ID
 * @param {Object} location - Location data
 * @param {number} location.lat - Latitude
 * @param {number} location.lng - Longitude
 * @param {string} location.country - Country name
 * @param {string} location.countryCode - ISO country code
 * @param {string} location.province - Province/state name
 * @param {string} location.provinceCode - Province code
 * @param {string} location.city - City name
 * @param {string} location.cityCode - City code
 * @param {string} verificationMethod - Must be 'gps' for live location
 * @returns {Promise<Object>} Update result with reconciliation info
 */
export async function updateUserLocation(userId, location, verificationMethod = 'gps') {
  if (!initialized) {
    await initLocationService();
  }
  
  // CRITICAL: Only accept GPS-verified locations
  if (verificationMethod !== 'gps') {
    throw new Error('Only GPS-verified locations are accepted. User must be physically present.');
  }
  
  // Validate coordinates
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Invalid coordinates: lat and lng must be numbers');
  }
  
  if (location.lat < -90 || location.lat > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  
  if (location.lng < -180 || location.lng > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }
  
  const previousLocation = userLocations.get(userId);
  
  // Store new location
  const locationData = {
    lat: location.lat,
    lng: location.lng,
    country: location.country,
    countryCode: location.countryCode,
    province: location.province,
    provinceCode: location.provinceCode,
    city: location.city,
    cityCode: location.cityCode,
    lastVerified: Date.now(),
    verificationMethod: 'gps',
    accuracy: location.accuracy || null
  };
  
  userLocations.set(userId, locationData);
  
  // Save to disk
  await saveLocations();
  
  // Reconcile all votes for this user
  const reconciliationResult = await reconcileUserVotes(userId, locationData, previousLocation);
  
  locationLogger.info('User location updated', {
    userId,
    newLocation: `${location.city}, ${location.province}, ${location.country}`,
    previousLocation: previousLocation ? `${previousLocation.city}, ${previousLocation.province}` : 'none',
    votesReconciled: reconciliationResult.votesUpdated
  });
  
  return {
    success: true,
    location: locationData,
    reconciliation: reconciliationResult
  };
}

/**
 * Reconcile all votes for a user to their new location
 * Called automatically when user location changes
 * 
 * NOTE: This function currently logs the reconciliation need.
 * Actual vote reconciliation happens when votes are loaded dynamically via getVoteWithLocation()
 * 
 * @param {string} userId - User ID
 * @param {Object} newLocation - New location data
 * @param {Object|null} previousLocation - Previous location (if any)
 * @returns {Promise<Object>} Reconciliation statistics
 */
async function reconcileUserVotes(userId, newLocation, previousLocation) {
  locationLogger.info('User location changed - votes will reflect new location on next query', {
    userId,
    previousLocation: previousLocation ? `${previousLocation.city}, ${previousLocation.province}` : 'none',
    newLocation: `${newLocation.city}, ${newLocation.province}`
  });
  
  return {
    votesFound: 0,
    votesUpdated: 0,
    message: 'Location updated - votes will dynamically reflect new location'
  };
  
  // TODO: Future enhancement - actively notify vote system of location change
  // For now, votes get location dynamically via getVoteWithLocation()
}

/**
 * Get all users with their locations
 * Used for visualization
 * 
 * @returns {Array} Array of {userId, location}
 */
export function getAllUserLocations() {
  if (!initialized) {
    throw new Error('Location service not initialized');
  }
  
  return Array.from(userLocations.entries()).map(([userId, location]) => ({
    userId,
    location
  }));
}

/**
 * Get vote with current user location
 * Dynamically adds location from user's current location
 * 
 * NOTE: This function requires access to vote ledger which is not currently exported.
 * For now, vote locations are handled by the vote API directly.
 * 
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @returns {Object|null} Vote with current location
 */
export function getVoteWithLocation(userId, topicId) {
  const location = getUserLocation(userId);
  
  return {
    location,  // Current user location
    locationReference: 'current'  // Indicates this is a reference, not stored data
  };
}

/**
 * Determine if user is local or foreign for a vote
 * 
 * @param {string} userId - User ID
 * @param {string} targetRegion - Target region code (country, province, or city)
 * @param {string} level - Level to check ('country', 'province', or 'city')
 * @returns {Object} Status with isLocal flag and details
 */
export function getUserVotingStatus(userId, targetRegion, level = 'province') {
  const location = getUserLocation(userId);
  
  if (!location) {
    return {
      isLocal: false,
      status: 'unknown',
      reason: 'No location set for user'
    };
  }
  
  let isLocal = false;
  let regionCode = null;
  
  switch (level) {
    case 'country':
      regionCode = location.countryCode;
      isLocal = regionCode === targetRegion;
      break;
    case 'province':
      regionCode = location.provinceCode;
      isLocal = regionCode === targetRegion;
      break;
    case 'city':
      regionCode = location.cityCode;
      isLocal = regionCode === targetRegion;
      break;
    default:
      throw new Error(`Invalid level: ${level}`);
  }
  
  return {
    isLocal,
    status: isLocal ? 'local' : 'foreign',
    userRegion: regionCode,
    targetRegion,
    level,
    location: {
      city: location.city,
      province: location.province,
      country: location.country
    }
  };
}

/**
 * Get statistics about user locations
 * 
 * @returns {Object} Statistics
 */
export function getLocationStats() {
  const stats = {
    totalUsers: userLocations.size,
    byCountry: {},
    byProvince: {},
    byCity: {}
  };
  
  for (const location of userLocations.values()) {
    // Count by country
    stats.byCountry[location.countryCode] = (stats.byCountry[location.countryCode] || 0) + 1;
    
    // Count by province
    const provinceKey = `${location.countryCode}-${location.provinceCode}`;
    stats.byProvince[provinceKey] = (stats.byProvince[provinceKey] || 0) + 1;
    
    // Count by city
    const cityKey = `${provinceKey}-${location.cityCode}`;
    stats.byCity[cityKey] = (stats.byCity[cityKey] || 0) + 1;
  }
  
  return stats;
}

/**
 * Set mock user location (for testing/demo purposes only)
 * Bypasses GPS verification and directly sets location
 * @param {string} userId - User ID
 * @param {Object} location - Location data
 */
export function setMockUserLocation(userId, location) {
  if (!initialized) {
    // Initialize synchronously for mock data
    userLocations.set(userId, location);
  } else {
    userLocations.set(userId, {
      ...location,
      isMockData: true,
      lastVerified: Date.now()
    });
  }
}

export default {
  initLocationService,
  getUserLocation,
  updateUserLocation,
  getAllUserLocations,
  getVoteWithLocation,
  getUserVotingStatus,
  getLocationStats,
  setMockUserLocation
};
