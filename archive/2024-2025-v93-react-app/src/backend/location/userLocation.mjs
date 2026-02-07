/**
 * User location management and tracking
 */
import logger from '../utils/logging/logger.mjs';

// User location storage - in a real app, this would be in a database
const userLocations = new Map();

/**
 * Get a user's current region
 * @param {string} userId - User identifier
 * @returns {Promise<string>} - User's current region
 */
export async function getUserRegion(userId) {
  logger.debug('Getting region for user', { userId });
  
  // Get user location from storage
  const userLocation = userLocations.get(userId);
  
  if (!userLocation) {
    logger.debug('No location data found for user', { userId });
    return 'unknown';
  }
  
  return userLocation.region || 'unknown';
}

/**
 * Update a user's location
 * @param {string} userId - User identifier
 * @param {Object} coordinates - Coordinates {lat, lng}
 * @param {number} voteDurationPreference - Vote duration preference (test API signature)
 * @returns {Promise<Object>} - Updated location data
 */
export async function updateUserLocation(userId, coordinates, voteDurationPreference) {
  try {
    const timestamp = Date.now();
    
    // Store updated location with timestamp
    const locationData = {
      userId,
      coordinates,
      voteDurationPreference,
      timestamp,
      region: 'default-region' // Simple default region assignment
    };
    
    userLocations.set(userId, locationData);
    
    logger.debug('Updated user location', { userId, coordinates });
    return locationData;
  } catch (error) {
    logger.error('Failed to update user location', { userId, error });
    throw error;
  }
}

/**
 * Get a user's current location
 * @param {string} userId - User identifier
 * @returns {Object|null} - User's location data or null if not found
 */
export async function getUserLocation(userId) {
  logger.debug('Getting location for user', { userId });
  
  const userLocation = userLocations.get(userId);
  
  if (!userLocation) {
    logger.debug('No location data found for user', { userId });
    return null;
  }
  
  return userLocation;
}

/**
 * Get nearby users within a radius
 * @param {Object} coordinates - Center coordinates {lat, lng}
 * @param {number} radius - Search radius in meters
 * @param {string} excludeUserId - User ID to exclude from results
 * @returns {Promise<Array>} - Array of nearby users
 */
export async function getNearbyUsers(coordinates, radius, excludeUserId) {
  logger.debug('Getting nearby users', { coordinates, radius, excludeUserId });
  
  const nearbyUsers = [];
  
  // Simple implementation - in real app would use spatial indexing
  for (const [userId, location] of userLocations.entries()) {
    if (userId === excludeUserId) continue;
    
    if (location.coordinates) {
      // Simple distance calculation (not accurate for large distances)
      const distance = Math.sqrt(
        Math.pow(location.coordinates.lat - coordinates.lat, 2) +
        Math.pow(location.coordinates.lng - coordinates.lng, 2)
      ) * 111000; // Rough conversion to meters
      
      if (distance <= radius) {
        nearbyUsers.push({
          userId,
          coordinates: location.coordinates,
          distance
        });
      }
    }
  }
  
  return nearbyUsers;
}

/**
 * Get active regions for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - Array of active regions
 */
export async function getActiveRegionsForUser(userId) {
  logger.debug('Getting active regions for user', { userId });
  
  const userLocation = userLocations.get(userId);
  
  if (!userLocation || !userLocation.region) {
    return [];
  }
  
  // Simple implementation - return the user's current region
  return [{
    regionId: userLocation.region,
    name: `Region ${userLocation.region}`,
    active: true
  }];
}

/**
 * Save all user locations to persistent storage
 * @returns {Promise<boolean>} - Success indicator
 */
export async function saveUserLocations() {
  try {
    // In a real implementation, this would save to a database or file
    logger.debug('Saving user locations', { count: userLocations.size });
    return true;
  } catch (error) {
    logger.error('Failed to save user locations', { error });
    return false;
  }
}

/**
 * Load user locations from persistent storage
 * @returns {Promise<boolean>} - Success indicator
 */
export async function loadUserLocations() {
  try {
    // In a real implementation, this would load from a database or file
    logger.debug('Loading user locations');
    return true;
  } catch (error) {
    logger.error('Failed to load user locations', { error });
    return false;
  }
}

/**
 * Initialize the user location manager
 * @returns {Promise<boolean>} - Success indicator
 */
export async function initUserLocationManager() {
  try {
    await loadUserLocations();
    logger.info('User location manager initialized');
    return true;
  } catch (error) {
    logger.error('Error during user location manager initialization', { error });
    return false;
  }
}

// Export a default object for compatibility with some imports
export default {
  getUserRegion,
  updateUserLocation,
  getUserLocation,
  getNearbyUsers,
  getActiveRegionsForUser,
  saveUserLocations,
  loadUserLocations,
  initUserLocationManager
};
