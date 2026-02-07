//backend/routes/location.mjs
/**
 * Location API routes for Relay platform
 */

import express from 'express';
import { 
  updateUserLocation, 
  getAllRegions, 
  getUserLocation,
  checkVotingEligibility,
  getRegionParameters,
  submitRegionBoundary,
  getRegionBoundary,
  getCurrentUserRegion,
  submitGlobalBoundaryPreference,
  getGlobalBoundaryPreference,
  getConsensusBoundary
} from '../api/locationApi.mjs';
import { authenticate } from '../auth/middleware/index.mjs';
import { asyncHandler } from '../middleware/errorHandler.mjs';

const router = express.Router();

// Get all regions - doesn't require authentication
router.get('/regions', asyncHandler(getAllRegions));

// Get a user's location - requires authentication and must be the user or an admin
router.get('/user/:userId', authenticate(), asyncHandler(getUserLocation));

// Update user location - requires authentication
router.post('/update', authenticate(), asyncHandler(updateUserLocation));

// Check if a user can vote in a region
router.get('/voting-eligibility', authenticate(), asyncHandler(checkVotingEligibility));

// Get region parameters
router.get('/region/:regionId/parameters', asyncHandler(getRegionParameters));

// Get current user's region with boundary
router.get('/region/current', authenticate(), asyncHandler(getCurrentUserRegion));

// Submit a boundary for a region
router.post('/region/:regionId/boundary', authenticate(), asyncHandler(submitRegionBoundary));

// Get a region's boundary
router.get('/region/:regionId/boundary', asyncHandler(getRegionBoundary));

// Submit global boundary preference
router.post('/global-boundary', authenticate(), asyncHandler(submitGlobalBoundaryPreference));

// Get user's global boundary preference
router.get('/global-boundary', authenticate(), asyncHandler(getGlobalBoundaryPreference));
router.get('/global-boundary/:userId', authenticate(), asyncHandler(getGlobalBoundaryPreference));

// Get consensus boundary for a region
router.get('/consensus-boundary/:regionId', asyncHandler(getConsensusBoundary));

export default router;
