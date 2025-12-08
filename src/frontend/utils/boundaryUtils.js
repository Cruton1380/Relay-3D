/**
 * @fileoverview Boundary-specific utilities for boundary channel panels
 * Handles area calculations, geometry processing, and preview generation
 * 
 * @version 1.0
 * @date October 17, 2025
 */

/**
 * Calculate area from GeoJSON polygon in km²
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {number} Area in km²
 */
export const calculateArea = (geometry) => {
  if (!geometry?.coordinates?.[0]) return 0;
  
  // Simple polygon area estimation (spherical earth)
  const coords = geometry.coordinates[0];
  let area = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    area += (lng2 - lng1) * (lat2 + lat1);
  }
  
  // Convert to km² (rough approximation)
  const km2 = Math.abs(area * 111.32 * 111.32 / 2);
  return Math.round(km2);
};

/**
 * Format area with delta comparison
 * @param {Object} candidate - Candidate with area data
 * @param {Object} officialCandidate - Official/baseline candidate
 * @returns {string} Formatted area string
 */
export const formatAreaDelta = (candidate, officialCandidate) => {
  // Use areaChange data if available (from editor calculation)
  if (candidate.areaChange) {
    const { proposedArea, deltaArea, deltaPercent } = candidate.areaChange;
    const sign = deltaArea >= 0 ? '+' : '';
    
    return deltaArea !== 0
      ? `${proposedArea.toLocaleString()} km² (${sign}${deltaArea.toLocaleString()} km², ${sign}${deltaPercent.toFixed(2)}%)`
      : `${proposedArea.toLocaleString()} km²`;
  }
  
  // Fallback to calculation
  const candidateArea = calculateArea(candidate.location?.geometry);
  const officialArea = calculateArea(officialCandidate?.location?.geometry);
  
  if (!officialArea) return `${candidateArea.toLocaleString()} km²`;
  
  const delta = candidateArea - officialArea;
  const deltaPercent = ((delta / officialArea) * 100).toFixed(2);
  
  if (delta === 0) return `${candidateArea.toLocaleString()} km²`;
  
  const sign = delta > 0 ? '+' : '';
  return `${candidateArea.toLocaleString()} km² (${sign}${deltaPercent}%)`;
};

/**
 * Get node count from geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {number} Number of nodes
 */
export const getNodeCount = (geometry) => {
  return geometry?.coordinates?.[0]?.length || 0;
};

/**
 * Calculate bounds from geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Object|null} Bounds {minLng, maxLng, minLat, maxLat, center}
 */
export const calculateBounds = (geometry) => {
  if (!geometry?.coordinates?.[0]) return null;
  
  const coords = geometry.coordinates[0];
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  coords.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  return {
    minLng,
    maxLng,
    minLat,
    maxLat,
    center: {
      lng: (minLng + maxLng) / 2,
      lat: (minLat + maxLat) / 2
    },
    lngRange: maxLng - minLng,
    latRange: maxLat - minLat,
    maxRange: Math.max(maxLng - minLng, maxLat - minLat)
  };
};

/**
 * Zoom camera to boundary geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @param {Object} cesiumViewer - Cesium viewer instance
 * @param {number} minHeight - Minimum camera height in meters
 */
export const zoomToBoundary = (geometry, cesiumViewer = window.cesiumViewer, minHeight = 50000) => {
  if (!cesiumViewer || !window.Cesium) return;
  
  const bounds = calculateBounds(geometry);
  if (!bounds) return;
  
  const { center, maxRange } = bounds;
  const height = Math.max(maxRange * 200000, minHeight);
  
  cesiumViewer.camera.flyTo({
    destination: window.Cesium.Cartesian3.fromDegrees(
      center.lng,
      center.lat,
      height
    ),
    duration: 1.5,
    orientation: {
      heading: window.Cesium.Math.toRadians(0),
      pitch: window.Cesium.Math.toRadians(-45),
      roll: 0.0
    }
  });
};

/**
 * Generate preview bounds for boundary difference
 * @param {Object} candidate - Candidate boundary
 * @param {Object} officialCandidate - Official boundary
 * @returns {Object|null} Preview bounds
 */
export const getPreviewBounds = (candidate, officialCandidate) => {
  const candidateBounds = calculateBounds(candidate.location?.geometry);
  const officialBounds = calculateBounds(officialCandidate?.location?.geometry);
  
  if (!candidateBounds || !officialBounds) return candidateBounds;
  
  // Calculate combined bounds for both geometries
  const combinedBounds = {
    minLng: Math.min(candidateBounds.minLng, officialBounds.minLng),
    maxLng: Math.max(candidateBounds.maxLng, officialBounds.maxLng),
    minLat: Math.min(candidateBounds.minLat, officialBounds.minLat),
    maxLat: Math.max(candidateBounds.maxLat, officialBounds.maxLat)
  };
  
  combinedBounds.center = {
    lng: (combinedBounds.minLng + combinedBounds.maxLng) / 2,
    lat: (combinedBounds.minLat + combinedBounds.maxLat) / 2
  };
  
  combinedBounds.lngRange = combinedBounds.maxLng - combinedBounds.minLng;
  combinedBounds.latRange = combinedBounds.maxLat - combinedBounds.minLat;
  combinedBounds.maxRange = Math.max(combinedBounds.lngRange, combinedBounds.latRange);
  
  return combinedBounds;
};

/**
 * Create boundary description with statistics
 * @param {Object} candidate - Candidate object
 * @param {Object} officialCandidate - Official candidate
 * @returns {string} Formatted description
 */
export const createBoundaryDescription = (candidate, officialCandidate) => {
  // Return just the description - metadata is shown separately in renderMetadata
  const description = candidate.description || 'No description provided';
  return description;
};

export default {
  calculateArea,
  formatAreaDelta,
  getNodeCount,
  calculateBounds,
  zoomToBoundary,
  getPreviewBounds,
  createBoundaryDescription
};
