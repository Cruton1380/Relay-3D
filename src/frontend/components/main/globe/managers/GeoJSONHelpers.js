/**
 * GeoJSON Helpers Module
 * Extracted from RegionManager.js - Phase 1.3
 * 
 * Utility functions for processing GeoJSON features and geometries
 */

/**
 * Extract feature name from GeoJSON feature properties
 * @param {Object} feature - GeoJSON feature
 * @param {string} layerType - Type of layer (countries, provinces, etc.)
 * @param {number} index - Fallback index for unnamed features
 * @returns {string} - Extracted feature name
 */
export function extractFeatureName(feature, layerType, index) {
  const properties = feature.properties || {};

  if (layerType === "countries") {
    return (
      properties.NAME ||
      properties.name ||
      properties.ADMIN ||
      properties.ADMIN_NAME ||
      properties.SOVEREIGNT ||
      properties.sovereignt ||
      properties.ADMIN0_NAME ||
      properties.admin0_name ||
      `Country ${index}`
    );
  } else if (layerType === "provinces" || layerType === "states") {
    return (
      properties.NAME ||
      properties.name ||
      properties.ADMIN ||
      properties.ADMIN_NAME ||
      properties.NAME_1 ||
      properties.name_1 ||
      properties.ADMIN1_NAME ||
      properties.admin1_name ||
      `State ${index}`
    );
  } else if (layerType === "cities") {
    return (
      properties.NAME ||
      properties.name ||
      properties.CITY ||
      properties.city ||
      `City ${index}`
    );
  } else if (layerType === "counties") {
    return (
      properties.NAME ||
      properties.name ||
      properties.NAME_2 ||
      properties.name_2 ||
      properties.ADMIN2_NAME ||
      properties.admin2_name ||
      `County ${index}`
    );
  } else {
    return (
      properties.NAME ||
      properties.name ||
      `Feature ${index}`
    );
  }
}

/**
 * Normalize longitude to [-180, 180] range
 * @param {number} lon - Longitude value
 * @returns {number} - Normalized longitude
 */
export function normalizeLongitude(lon) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

/**
 * Validate coordinate pair
 * @param {Array} coord - [longitude, latitude] pair
 * @returns {boolean} - True if valid
 */
export function isValidCoordinate(coord) {
  if (!Array.isArray(coord) || coord.length < 2) {
    return false;
  }
  
  const [lon, lat] = coord;
  
  // Check if values are numbers
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    return false;
  }
  
  // Check if values are finite
  if (!isFinite(lon) || !isFinite(lat)) {
    return false;
  }
  
  // Check latitude range [-90, 90]
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  // Longitude can be normalized, so we don't strictly reject out-of-range values
  // but we do check for extreme values
  if (Math.abs(lon) > 360) {
    return false;
  }
  
  return true;
}

/**
 * Create Cesium PolygonHierarchy from coordinates
 * @param {Array} coordinates - GeoJSON coordinates array
 * @param {string} geometryType - 'Polygon' or 'MultiPolygon'
 * @param {Object} Cesium - Cesium library reference
 * @returns {Object} - Cesium PolygonHierarchy
 */
export function createPolygonHierarchy(coordinates, geometryType, Cesium) {
  if (geometryType === 'Polygon') {
    // Polygon: coordinates[0] is the outer ring
    const outerRing = coordinates[0];
    const positions = outerRing
      .filter(coord => isValidCoordinate(coord))
      .map(coord => {
        const lon = normalizeLongitude(coord[0]);
        const lat = coord[1];
        return Cesium.Cartesian3.fromDegrees(lon, lat);
      });
    
    // Check for holes (inner rings)
    const holes = [];
    if (coordinates.length > 1) {
      for (let i = 1; i < coordinates.length; i++) {
        const hole = coordinates[i]
          .filter(coord => isValidCoordinate(coord))
          .map(coord => {
            const lon = normalizeLongitude(coord[0]);
            const lat = coord[1];
            return Cesium.Cartesian3.fromDegrees(lon, lat);
          });
        
        if (hole.length >= 3) {
          holes.push(new Cesium.PolygonHierarchy(hole));
        }
      }
    }
    
    return new Cesium.PolygonHierarchy(positions, holes);
    
  } else if (geometryType === 'MultiPolygon') {
    // MultiPolygon: Take the first polygon (largest usually)
    const firstPolygon = coordinates[0];
    const outerRing = firstPolygon[0];
    const positions = outerRing
      .filter(coord => isValidCoordinate(coord))
      .map(coord => {
        const lon = normalizeLongitude(coord[0]);
        const lat = coord[1];
        return Cesium.Cartesian3.fromDegrees(lon, lat);
      });
    
    return new Cesium.PolygonHierarchy(positions);
  }
  
  throw new Error(`Unsupported geometry type: ${geometryType}`);
}

/**
 * Count total features in GeoJSON
 * @param {Object} geoJson - GeoJSON object
 * @returns {number} - Number of features
 */
export function countFeatures(geoJson) {
  if (!geoJson || !geoJson.features) {
    return 0;
  }
  return geoJson.features.length;
}

/**
 * Filter features by geometry type
 * @param {Object} geoJson - GeoJSON object
 * @param {Array<string>} geometryTypes - Array of geometry types to include
 * @returns {Array} - Filtered features
 */
export function filterFeaturesByGeometry(geoJson, geometryTypes) {
  if (!geoJson || !geoJson.features) {
    return [];
  }
  
  return geoJson.features.filter(feature => {
    if (!feature.geometry || !feature.geometry.type) {
      return false;
    }
    return geometryTypes.includes(feature.geometry.type);
  });
}

/**
 * Get bounding box from coordinates
 * @param {Array} coordinates - Array of [lon, lat] pairs
 * @returns {Object} - Bounding box { minLon, maxLon, minLat, maxLat }
 */
export function getBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  
  coordinates.forEach(coord => {
    if (isValidCoordinate(coord)) {
      const lon = normalizeLongitude(coord[0]);
      const lat = coord[1];
      
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  });
  
  if (!isFinite(minLon)) {
    return null;
  }
  
  return { minLon, maxLon, minLat, maxLat };
}

/**
 * Calculate approximate area of a polygon (in square degrees)
 * @param {Array} coordinates - Polygon coordinates
 * @returns {number} - Approximate area
 */
export function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return 0;
  }
  
  // Use shoelace formula for approximate area
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n - 1; i++) {
    if (isValidCoordinate(coordinates[i]) && isValidCoordinate(coordinates[i + 1])) {
      const [x1, y1] = coordinates[i];
      const [x2, y2] = coordinates[i + 1];
      area += (x1 * y2) - (x2 * y1);
    }
  }
  
  return Math.abs(area / 2);
}

/**
 * Simplify coordinates by removing redundant points
 * @param {Array} coordinates - Array of coordinates
 * @param {number} tolerance - Tolerance for simplification
 * @returns {Array} - Simplified coordinates
 */
export function simplifyCoordinates(coordinates, tolerance = 0.01) {
  if (!coordinates || coordinates.length <= 2) {
    return coordinates;
  }
  
  const simplified = [coordinates[0]];
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const next = coordinates[i + 1];
    
    // Calculate distance from current point to line between prev and next
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const norm = Math.sqrt(dx * dx + dy * dy);
    
    if (norm > 0) {
      const dist = Math.abs((dy * curr[0] - dx * curr[1] + next[0] * prev[1] - next[1] * prev[0]) / norm);
      
      if (dist > tolerance) {
        simplified.push(curr);
      }
    }
  }
  
  simplified.push(coordinates[coordinates.length - 1]);
  
  return simplified;
}

export default {
  extractFeatureName,
  normalizeLongitude,
  isValidCoordinate,
  createPolygonHierarchy,
  countFeatures,
  filterFeaturesByGeometry,
  getBoundingBox,
  calculatePolygonArea,
  simplifyCoordinates
};

