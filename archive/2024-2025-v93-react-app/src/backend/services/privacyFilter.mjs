/**
 * @fileoverview Privacy Filter Service
 * Sanitizes vote data before blockchain serialization to prevent GPS leaks
 */
import { logger } from '../utils/logging/logger.mjs';

const privacyLogger = logger.child({ module: 'privacy-filter' });

/**
 * Privacy levels supported by Relay
 */
export const PrivacyLevel = {
  GPS: 'gps',           // Full GPS coordinates visible
  CITY: 'city',         // Only city-level location
  PROVINCE: 'province', // Only province-level location (default)
  ANONYMOUS: 'anonymous' // No location data
};

/**
 * Sanitize vote data for blockchain storage
 * Removes sensitive location data based on user's privacy preference
 * 
 * @param {Object} voteData - Original vote data
 * @param {string} privacyLevel - User's privacy preference
 * @returns {Object} Sanitized vote data safe for blockchain
 */
export function sanitizeVoteForBlockchain(voteData, privacyLevel = PrivacyLevel.PROVINCE) {
  const sanitized = {
    voteId: voteData.voteId,
    userId: voteData.userId,
    topicId: voteData.topicId,
    candidateId: voteData.candidateId,
    voteType: voteData.voteType,
    timestamp: voteData.timestamp,
    reliability: voteData.reliability
  };

  // Apply privacy filtering to location data
  if (voteData.location) {
    sanitized.location = sanitizeLocation(voteData.location, privacyLevel);
  }

  privacyLogger.info('Vote data sanitized for blockchain', {
    voteId: voteData.voteId,
    privacyLevel,
    hasLocation: !!sanitized.location
  });

  return sanitized;
}

/**
 * Sanitize location data based on privacy level
 * @param {Object} location - Original location data
 * @param {string} privacyLevel - Privacy level
 * @returns {Object|null} Sanitized location or null if anonymous
 */
function sanitizeLocation(location, privacyLevel) {
  switch (privacyLevel) {
    case PrivacyLevel.ANONYMOUS:
      // Remove ALL location data
      privacyLogger.debug('Removing all location data (anonymous)');
      return null;

    case PrivacyLevel.PROVINCE:
      // Keep only province/state level
      privacyLogger.debug('Filtering to province level');
      return {
        country: location.country,
        countryCode: location.countryCode,
        province: location.province,
        provinceCode: location.provinceCode,
        privacyLevel: PrivacyLevel.PROVINCE,
        // Use province center coordinates (approximate)
        coordinates: location.publicLocation?.coordinates || null
      };

    case PrivacyLevel.CITY:
      // Keep city level (no GPS)
      privacyLogger.debug('Filtering to city level');
      return {
        country: location.country,
        countryCode: location.countryCode,
        province: location.province,
        provinceCode: location.provinceCode,
        city: location.city,
        cityCode: location.cityCode,
        privacyLevel: PrivacyLevel.CITY,
        // Use city center coordinates (approximate)
        coordinates: location.publicLocation?.coordinates || null
      };

    case PrivacyLevel.GPS:
      // Keep full GPS coordinates (user explicitly opted in)
      privacyLogger.debug('Preserving GPS coordinates (user opted in)');
      return {
        lat: location.lat,
        lng: location.lng,
        country: location.country,
        countryCode: location.countryCode,
        province: location.province,
        provinceCode: location.provinceCode,
        city: location.city,
        cityCode: location.cityCode,
        privacyLevel: PrivacyLevel.GPS,
        coordinates: [location.lng, location.lat] // GeoJSON format
      };

    default:
      // Default to province level if unknown
      privacyLogger.warn('Unknown privacy level, defaulting to province', { privacyLevel });
      return sanitizeLocation(location, PrivacyLevel.PROVINCE);
  }
}

/**
 * Create public location display for visualization
 * Used for voter map rendering (respects privacy)
 * 
 * @param {Object} location - Original location data
 * @param {string} privacyLevel - Privacy level
 * @returns {Object} Public location for display
 */
export function createPublicLocation(location, privacyLevel) {
  if (!location) return null;

  switch (privacyLevel) {
    case PrivacyLevel.ANONYMOUS:
      return {
        type: 'anonymous',
        displayName: 'Anonymous',
        coordinates: null
      };

    case PrivacyLevel.PROVINCE:
      return {
        type: 'province',
        displayName: `${location.province}, ${location.country}`,
        coordinates: location.publicLocation?.coordinates || null
      };

    case PrivacyLevel.CITY:
      return {
        type: 'city',
        displayName: `${location.city}, ${location.province}`,
        coordinates: location.publicLocation?.coordinates || null
      };

    case PrivacyLevel.GPS:
      return {
        type: 'point',
        displayName: `${location.city}, ${location.province}`,
        coordinates: [location.lng, location.lat]
      };

    default:
      return createPublicLocation(location, PrivacyLevel.PROVINCE);
  }
}

/**
 * Validate that sanitized data contains no raw GPS coordinates
 * @param {Object} sanitizedData - Data to validate
 * @param {string} privacyLevel - Expected privacy level
 * @returns {boolean} True if valid, false if GPS leak detected
 */
export function validateNoGPSLeak(sanitizedData, privacyLevel) {
  // GPS allowed only if user explicitly opted in
  if (privacyLevel === PrivacyLevel.GPS) {
    return true;
  }

  // Check for raw GPS coordinates
  const hasRawGPS = sanitizedData.location?.lat !== undefined 
                 || sanitizedData.location?.lng !== undefined;

  if (hasRawGPS) {
    privacyLogger.error('GPS LEAK DETECTED in sanitized data!', {
      privacyLevel,
      voteId: sanitizedData.voteId
    });
    return false;
  }

  return true;
}

export default {
  sanitizeVoteForBlockchain,
  createPublicLocation,
  validateNoGPSLeak,
  PrivacyLevel
};
