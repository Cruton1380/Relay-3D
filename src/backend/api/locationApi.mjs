//backend/api/locationApi.mjs
import logger from '../utils/logging/logger.mjs';
import userLocationManager from '../location/userLocation.mjs';
// import regionManager from '../location/regionManager.mjs'; // Archived - using unifiedBoundaryService
import unifiedBoundaryService from '../services/unifiedBoundaryService.mjs';

// Temporary stub for regionManager until full migration is complete
const regionManager = {
  getAllRegions: () => [],
  getRegion: () => null,
  getRegionById: () => null,
  createRegion: () => null,
  updateRegion: () => null,
  submitBoundaryVote: () => ({ success: false, message: 'Not implemented' }),
  storeUserGlobalBoundaryPreference: () => ({ success: false, message: 'Not implemented' }),
  applyGlobalBoundaryToRegion: () => ({ success: false, message: 'Not implemented' }),
  submitGlobalRegionMap: () => ({ success: false, message: 'Not implemented' }),
  userBoundaryPreferences: new Map(),
  activeRegions: new Map(),
  regions: new Map()
};
import { createError } from '../utils/common/errors.mjs';
import { getTopicRegion } from '../voting/topicRegionUtils.mjs';
import Joi from 'joi';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.mjs';
import { asyncHandler } from '../middleware/errorHandler.mjs';

// Create location-specific logger
const locationAPILogger = logger.child({ module: 'location-api' });

// Validation schemas
const coordinatesSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

const updateLocationSchema = Joi.object({
  coordinates: coordinatesSchema.required(),
  voteDurationPreference: Joi.number().integer().min(1).max(90).optional()
});

const regionIdParam = Joi.object({
  regionId: Joi.string().required()
});

const userIdParam = Joi.object({
  userId: Joi.string().required()
});

const votingEligibilityQuery = Joi.object({
  regionId: Joi.string().required(),
  topicId: Joi.string().optional()
});

const boundarySchema = Joi.object({
  type: Joi.string().valid('Feature', 'FeatureCollection').required(),
  geometry: Joi.alternatives().conditional('type', {
    is: 'Feature',
    then: Joi.object({
      type: Joi.string().valid('Polygon', 'MultiPolygon').required(),
      coordinates: Joi.array().required()
    }).required(),
    otherwise: Joi.optional()
  }),
  features: Joi.alternatives().conditional('type', {
    is: 'FeatureCollection',
    then: Joi.array().items(Joi.object({
      type: Joi.string().valid('Feature').required(),
      geometry: Joi.object({
        type: Joi.string().valid('Polygon', 'MultiPolygon').required(),
        coordinates: Joi.array().required()
      }).required()
    })).required(),
    otherwise: Joi.optional()
  })
});

const globalBoundarySchema = Joi.object({
  boundary: boundarySchema.required()
});

/**
 * Update a user's location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 /**
 * Update user location handler
 */
const updateUserLocationHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.userId; // Support both formats
  const { coordinates, voteDurationPreference } = req.body;
  
  // Validate coordinates when called directly (bypasses middleware validation)
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates'
    });
  }
  
  if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates range'
    });
  }
  
  try {
    // Update the user's location - match test API signature
    const result = await userLocationManager.updateUserLocation(
      userId,
      coordinates,
      voteDurationPreference
    );
    
    locationAPILogger.info(`Updated location for user ${userId}`, { 
      coordinates: `${coordinates.lat},${coordinates.lng}`
    });
    
    return res.status(200).json({
      success: true,
      location: {
        userId: userId,
        coordinates: coordinates,
        lastUpdated: Date.now()
      }
    });
  } catch (error) {
    locationAPILogger.error(`Failed to update location for user ${userId}`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update user location endpoint (with middleware)
 */
const updateUserLocationArray = [
  validateBody(updateLocationSchema),
  updateUserLocationHandler
];

// Export as both middleware array and direct function
export const updateUserLocation = updateUserLocationHandler;
export const updateUserLocationMiddleware = updateUserLocationArray;

/**
 * Get all regions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRegions = asyncHandler(async (req, res) => {
  const regions = regionManager.getAllRegions();
  
  return res.json({
    success: true,
    regions
  });
});

/**
 * Get user location handler
 */
const getUserLocationHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // Make this safer, handling null req.user for tests
  const requestingUserId = req.user ? (req.user.id || req.user.userId) : null;
  
  // Check if requesting user is authorized - only if req.user exists
  if (req.user && requestingUserId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to access this user\'s location'
    });
  }
  
  try {
    // Make sure to await and pass the userId param
    const location = await userLocationManager.getUserLocation(userId);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'User location not found'
      });
    }
    
    // Get the region details (if regionId exists)
    const region = location.regionId ? regionManager.getRegion(location.regionId) : null;
    
    return res.status(200).json({
      success: true,
      location,
      region
    });
  } catch (error) {
    console.error('Error getting user location:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user location'
    });
  }
});

/**
 * Get a user's current location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserLocationArray = [
  validateParams(userIdParam),
  getUserLocationHandler
];

// Export as both middleware array and direct function
export const getUserLocation = getUserLocationHandler;
export const getUserLocationMiddleware = getUserLocationArray;

/**
 * Check if a user can vote in a specific region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkVotingEligibility = [
  validateQuery(votingEligibilityQuery),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { regionId, topicId } = req.query;
    
    // Get user's current location
    const location = userLocationManager.getUserLocation(userId);
    
    if (!location) {
      throw createError('notFound', 'User location not found');
    }
    
    // Check if user is in the specified region
    const canVote = location.regionId === regionId;
    
    // Get region voting parameters
    const region = regionManager.getRegion(regionId);
    
    if (!region) {
      throw createError('notFound', 'Region not found');
    }
    
    // Get topic region if topicId is provided
    let topicRegion = null;
    if (topicId) {
      topicRegion = getTopicRegion(topicId);
    }
    
    return res.json({
      success: true,
      canVote,
      region,
      userRegion: location.regionId,
      topicRegion
    });
  })
];

/**
 * Get region parameters for voting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRegionParameters = [
  validateParams(regionIdParam),
  asyncHandler(async (req, res) => {
    const { regionId } = req.params;
    
    const region = regionManager.getRegion(regionId);
    
    if (!region) {
      throw createError('notFound', 'Region not found');
    }
    
    return res.json({
      success: true,
      regionId,
      parameters: region.parameters
    });
  })
];

/**
 * Submit a boundary definition for a region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitRegionBoundary = [
  validateParams(regionIdParam),
  validateBody(boundarySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { regionId } = req.params;
    const boundary = req.body;
    
    // Submit the global boundary preference which applies to the user's current region
    const result = await regionManager.submitBoundaryVote(userId, regionId, boundary);
    
    return res.status(200).json({
      success: true,
      message: 'Boundary submitted successfully',
      regionId
    });
  })
];

/**
 * Get the current boundary for a region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRegionBoundary = [
  validateParams(regionIdParam),
  asyncHandler(async (req, res) => {
    const { regionId } = req.params;
    
    const region = regionManager.getRegion(regionId);
    
    if (!region) {
      throw createError('notFound', 'Region not found');
    }
    
    return res.json({
      success: true,
      regionId,
      boundary: region.boundary
    });
  })
];

/**
 * Get the current user's region with boundary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCurrentUserRegion = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  
  // Get user's location
  const userLocation = userLocationManager.getUserLocation(userId);
  
  if (!userLocation) {
    throw createError('notFound', 'User location not found');
  }
  
  // Get region details
  const region = regionManager.getRegion(userLocation.regionId);
  
  if (!region) {
    throw createError('notFound', 'Region not found');
  }
  
  return res.json({
    success: true,
    userLocation,
    region,
    boundary: region.boundary,
    votingParameters: region.votingParameters,
    reliabilityThreshold: region.reliabilityThreshold
  });
});

/**
 * Submit a global boundary preference
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitGlobalBoundaryPreference = [
  validateBody(globalBoundarySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { boundary } = req.body;
    
    // Store global preference
    const result = await regionManager.storeUserGlobalBoundaryPreference(userId, boundary);
    
    if (!result) {
      throw createError('internal', 'Failed to store global boundary preference');
    }
    
    // Apply to user's current region
    const currentLocation = userLocationManager.getUserLocation(userId);
    
    if (currentLocation?.regionId) {
      await regionManager.applyGlobalBoundaryToRegion(userId, currentLocation.regionId);
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Global boundary preference stored and applied'
    });
  })
];

/**
 * Get a user's global boundary preference
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGlobalBoundaryPreference = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.userId;
  
  // Get preference
  const preference = regionManager.userBoundaryPreferences?.get(userId);
  
  if (!preference) {
    throw createError('notFound', 'No global boundary preference found', { code: 'NOT_FOUND' });
  }
  
  return res.status(200).json({
    success: true,
    preference: preference.boundary
  });
});

/**
 * Get the consensus boundary for a region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getConsensusBoundary = [
  validateParams(regionIdParam),
  asyncHandler(async (req, res) => {
    const { regionId } = req.params;
    
    // Get region
    const region = regionManager.getRegion(regionId);
    
    if (!region) {
      throw createError('notFound', 'Region not found');
    }
    
    return res.status(200).json({
      success: true,
      regionId,
      boundary: region.consensusBoundary,
      updatedAt: region.boundaryUpdatedAt || null
    });
  })
];

/**
 * Submit a user's global region map
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitGlobalRegionMap = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { globalBoundaryMap } = req.body;
  
  if (!globalBoundaryMap || typeof globalBoundaryMap !== 'object') {
    throw createError('validation', 'Invalid global boundary map');
  }
  
  // Submit the global region map
  await regionManager.submitGlobalRegionMap(userId, globalBoundaryMap);
  
  // Get the user's active region
  const activeRegionId = regionManager.activeRegions.get(userId);
  
  return res.status(200).json({
    success: true,
    message: 'Global region map submitted successfully',
    affectedRegion: activeRegionId
  });
});

/**
 * Get the current global region map consensus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGlobalRegionMapConsensus = asyncHandler(async (req, res) => {
  // Build the global consensus map
  const consensusMap = {};
  
  for (const [regionId, region] of regionManager.regions.entries()) {
    consensusMap[regionId] = {
      id: regionId,
      name: region.name,
      boundary: region.consensusBoundary,
      updatedAt: region.boundaryUpdatedAt
    };
  }
  
  return res.status(200).json({
    success: true,
    regions: consensusMap
  });
});

/**
 * Get nearby users handler
 */
const getNearbyUsersHandler = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 1000 } = req.query;
  const userId = req.user.id || req.user.userId;
  
  // Validate coordinates when called directly
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  
  if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates'
    });
  }
  
  const coordinates = { lat: parsedLat, lng: parsedLng };
  const searchRadius = parseInt(radius);
  
  try {
    const nearbyUsers = await userLocationManager.getNearbyUsers(
      coordinates,
      searchRadius,
      userId
    );
    
    return res.status(200).json({
      success: true,
      users: nearbyUsers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get nearby users
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
const getNearbyUsersArray = [
  validateQuery(Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().positive().default(1000)
  })),
  getNearbyUsersHandler
];

// Export as both middleware array and direct function
export const getNearbyUsers = getNearbyUsersHandler;
export const getNearbyUsersMiddleware = getNearbyUsersArray;

/**
 * Get all regions (alias for getAllRegions)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRegions = getAllRegions;

/**
 * Get region by ID handler
 */
const getRegionByIdHandler = asyncHandler(async (req, res) => {
  const { regionId } = req.params;
  
  const region = regionManager.getRegionById(regionId);
  
  if (!region) {
    return res.status(404).json({
      success: false,
      error: 'Region not found'
    });
  }
  
  return res.json({
    success: true,
    region
  });
});

/**
 * Get region by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRegionByIdArray = [
  validateParams(regionIdParam),
  getRegionByIdHandler
];

// Export as both middleware array and direct function
export const getRegionById = getRegionByIdHandler;
export const getRegionByIdMiddleware = getRegionByIdArray;

/**
 * Create region handler
 */
const createRegionHandler = asyncHandler(async (req, res) => {
  const { name, bounds, properties } = req.body;
  
  // Validate required fields when called directly
  if (!name || !bounds) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name and bounds'
    });
  }
  
  const regionData = {
    name,
    bounds,
    properties: properties || {}
  };
  
  try {
    const region = regionManager.createRegion(regionData);
    
    if (!region) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create region'
      });
    }
    
    return res.status(201).json({
      success: true,
      region
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create new region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRegionArray = [
  validateBody(Joi.object({
    name: Joi.string().required(),
    bounds: Joi.array().items(Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    })).min(3).required(),
    properties: Joi.object().optional()
  })),
  createRegionHandler
];

// Export as both middleware array and direct function
export const createRegion = createRegionHandler;
export const createRegionMiddleware = createRegionArray;

/**
 * Update region handler
 */
const updateRegionHandler = asyncHandler(async (req, res) => {
  const { regionId } = req.params;
  const updateData = req.body;
  
  const region = regionManager.updateRegion(regionId, updateData);
  
  if (!region) {
    return res.status(404).json({
      success: false,
      error: 'Region not found'
    });
  }
  
  return res.json({
    success: true,
    region
  });
});

/**
 * Update region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateRegionArray = [
  validateParams(regionIdParam),
  validateBody(Joi.object({
    name: Joi.string().optional(),
    bounds: Joi.array().items(Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    })).min(3).optional(),
    properties: Joi.object().optional()
  })),
  updateRegionHandler
];

// Export as both middleware array and direct function
export const updateRegion = updateRegionHandler;
export const updateRegionMiddleware = updateRegionArray;

/**
 * Get user's active regions handler
 */
const getUserActiveRegionsHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const regions = await userLocationManager.getActiveRegionsForUser(userId);
  
  if (!regions || regions.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No active regions found for user'
    });
  }
  
  return res.json({
    success: true,
    regions
  });
});

/**
 * Get user's active regions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserActiveRegionsArray = [
  validateParams(userIdParam),
  getUserActiveRegionsHandler
];

// Export as both middleware array and direct function
export const getUserActiveRegions = getUserActiveRegionsHandler;
export const getUserActiveRegionsMiddleware = getUserActiveRegionsArray;



