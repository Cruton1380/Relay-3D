/**
 * General validation functions
 */
import logger from '../logging/logger.mjs';

/**
 * Validates if a string is a valid UUID v4
 * @param {string} uuid - String to validate
 * @returns {boolean} True if valid UUID v4
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid invite code format
 * @param {string} code - Invite code to validate
 * @returns {boolean} True if valid format
 */
export function isValidInviteFormat(code) {
  // Invite code format: XXXX-XXXX-XXXX (where X is alphanumeric)
  const inviteRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return inviteRegex.test(code);
}

/**
 * Validates if a public key is in the correct format
 * @param {string} publicKey - Public key to validate
 * @returns {boolean} True if valid format
 */
export function isValidPublicKey(publicKey) {
  try {
    // Check if the key is base64 encoded with valid length
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(publicKey)) return false;
    
    // Additional validation could be performed here
    return publicKey.length >= 32;
  } catch (error) {
    logger.error('Error validating public key', error);
    return false;
  }
}

/**
 * Validates if a timestamp is within a reasonable range
 * @param {number} timestamp - Timestamp to validate (in milliseconds)
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {boolean} True if timestamp is valid
 */
export function isValidTimestamp(timestamp, maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  return (
    typeof timestamp === 'number' &&
    timestamp > 0 &&
    timestamp <= now &&
    timestamp >= now - maxAgeMs
  );
}

/**
 * Validates if data is valid JSON
 * @param {string} jsonString - String to validate
 * @returns {boolean} True if valid JSON
 */
export function isValidJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates polygon geometry for geographic boundaries
 * @param {Object} polygon - GeoJSON polygon to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validatePolygon(polygon) {
  const errors = [];
  
  if (!polygon) {
    errors.push('Polygon is required');
    return { valid: false, errors };
  }
  
  if (typeof polygon !== 'object') {
    errors.push('Polygon must be an object');
    return { valid: false, errors };
  }
  
  // Check for GeoJSON structure
  if (polygon.type !== 'Polygon' && polygon.type !== 'Feature') {
    errors.push('Polygon must be GeoJSON Polygon or Feature type');
  }
  
  let coordinates;
  if (polygon.type === 'Feature') {
    if (!polygon.geometry || polygon.geometry.type !== 'Polygon') {
      errors.push('Feature must contain Polygon geometry');
      return { valid: false, errors };
    }
    coordinates = polygon.geometry.coordinates;
  } else {
    coordinates = polygon.coordinates;
  }
  
  if (!Array.isArray(coordinates)) {
    errors.push('Polygon coordinates must be an array');
    return { valid: false, errors };
  }
  
  if (coordinates.length === 0) {
    errors.push('Polygon must have at least one ring');
    return { valid: false, errors };
  }
  
  // Validate each ring
  coordinates.forEach((ring, ringIndex) => {
    if (!Array.isArray(ring)) {
      errors.push(`Ring ${ringIndex} must be an array`);
      return;
    }
    
    if (ring.length < 4) {
      errors.push(`Ring ${ringIndex} must have at least 4 coordinates`);
      return;
    }
    
    // Check if ring is closed (first and last coordinates are the same)
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (!Array.isArray(first) || !Array.isArray(last) || 
        first[0] !== last[0] || first[1] !== last[1]) {
      errors.push(`Ring ${ringIndex} must be closed (first and last coordinates must be the same)`);
    }
    
    // Validate each coordinate
    ring.forEach((coord, coordIndex) => {
      if (!Array.isArray(coord) || coord.length < 2) {
        errors.push(`Ring ${ringIndex}, coordinate ${coordIndex} must be an array with at least 2 elements`);
        return;
      }
      
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        errors.push(`Ring ${ringIndex}, coordinate ${coordIndex} must contain numeric longitude and latitude`);
        return;
      }
      
      // Check coordinate bounds
      if (lng < -180 || lng > 180) {
        errors.push(`Ring ${ringIndex}, coordinate ${coordIndex} longitude must be between -180 and 180`);
      }
      
      if (lat < -90 || lat > 90) {
        errors.push(`Ring ${ringIndex}, coordinate ${coordIndex} latitude must be between -90 and 90`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
