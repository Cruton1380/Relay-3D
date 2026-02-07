// src/backend/routes/voterVisualization.mjs
/**
 * Voter Visualization API
 * Provides voter location data for 3D globe visualization
 * with privacy-aware clustering
 */

import express from 'express';
import { getUsersWithVotesForTopic, getUsersWithVotesForCandidate } from '../domains/voting/votingEngine.mjs';
import { getUserLocation, getUserVotingStatus } from '../services/userLocationService.mjs';
import { getUserPrivacyLevel } from '../services/userPreferencesService.mjs';
import { PrivacyLevel } from '../services/privacyFilter.mjs';
import logger from '../utils/logging/logger.mjs';
// TEMPORARILY DISABLED: Boundary service was causing hangs
// import * as turf from '@turf/turf';
// import { boundaryService } from '../services/boundaryService.mjs';

const router = express.Router();
const vizLogger = logger.child({ module: 'voter-visualization' });

// Centroid cache for performance
const centroidCache = new Map();

/**
 * Get centroid coordinates for a city
 * @param {string} countryCode - ISO3 country code
 * @param {string} provinceCode - Province code
 * @param {string} cityCode - City code
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getCityCentroid(countryCode, provinceCode, cityCode) {
  const cacheKey = `city-${countryCode}-${provinceCode}-${cityCode}`;
  
  if (centroidCache.has(cacheKey)) {
    return centroidCache.get(cacheKey);
  }
  
  // TEMPORARY: Skip boundary service calls entirely to avoid hangs
  // Use simple random coordinates for visualization testing
  const fallbackCoords = {
    lat: (Math.random() * 180) - 90,  // Random latitude between -90 and 90
    lng: (Math.random() * 360) - 180  // Random longitude between -180 and 180
  };
  
  vizLogger.debug('Using fallback coords for city', { countryCode, provinceCode, cityCode, coords: fallbackCoords });
  centroidCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}

/**
 * Get centroid coordinates for a county
 * @param {string} countryCode - ISO3 country code
 * @param {string} provinceCode - Province code
 * @param {string} countyCode - County code
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getCountyCentroid(countryCode, provinceCode, countyCode) {
  const cacheKey = `county-${countryCode}-${provinceCode}-${countyCode}`;
  
  if (centroidCache.has(cacheKey)) {
    return centroidCache.get(cacheKey);
  }
  
  // TEMPORARY: Skip boundary service calls entirely to avoid hangs
  // Use simple random coordinates for visualization testing
  const fallbackCoords = {
    lat: (Math.random() * 180) - 90,  // Random latitude between -90 and 90
    lng: (Math.random() * 360) - 180  // Random longitude between -180 and 180
  };
  
  vizLogger.debug('Using fallback coords for county', { countryCode, provinceCode, countyCode, coords: fallbackCoords });
  centroidCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}

/**
 * Get centroid coordinates for a province
 * @param {string} countryCode - ISO3 country code
 * @param {string} provinceCode - Province code
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getProvinceCentroid(countryCode, provinceCode) {
  const cacheKey = `province-${countryCode}-${provinceCode}`;
  
  if (centroidCache.has(cacheKey)) {
    return centroidCache.get(cacheKey);
  }
  
  // TEMPORARY: Skip boundary service calls entirely to avoid hangs
  // Use simple random coordinates for visualization testing
  const fallbackCoords = {
    lat: (Math.random() * 180) - 90,  // Random latitude between -90 and 90
    lng: (Math.random() * 360) - 180  // Random longitude between -180 and 180
  };
  
  vizLogger.debug('Using fallback coords for province', { countryCode, provinceCode, coords: fallbackCoords });
  centroidCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}

/**
 * Get centroid coordinates for a country
 * @param {string} countryCode - ISO3 country code
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getCountryCentroid(countryCode) {
  const cacheKey = `country-${countryCode}`;
  
  if (centroidCache.has(cacheKey)) {
    return centroidCache.get(cacheKey);
  }
  
  // TEMPORARY: Skip boundary service calls entirely to avoid hangs
  // Use simple random coordinates for visualization testing
  const fallbackCoords = {
    lat: (Math.random() * 180) - 90,  // Random latitude between -90 and 90
    lng: (Math.random() * 360) - 180  // Random longitude between -180 and 180
  };
  
  vizLogger.debug('Using fallback coords for country', { countryCode, coords: fallbackCoords });
  centroidCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}

/**
 * GET /api/visualization/voters/:topicId
 * Get all voters for a topic with their locations (privacy-filtered)
 * 
 * Returns voters grouped by location with privacy clustering
 */
/**
 * GET /api/visualization/voters/:topicId
 * Get all voters for a topic with their locations (privacy-filtered)
 * 
 * Returns voters grouped by location with privacy clustering
 */
router.get('/voters/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { privacyMode = 'respect' } = req.query; // 'respect' | 'aggregate'
    
    vizLogger.info('Voter visualization requested', { topicId, privacyMode });
    
    // Get all voters for this topic
    const votersWithVotes = getUsersWithVotesForTopic(topicId);
    
    vizLogger.info('Raw voters retrieved', { count: votersWithVotes.length });
    
    // Collect voters with location and privacy data
    const voters = [];
    
    for (const { userId, vote } of votersWithVotes) {
      // Get user's current location
      const location = getUserLocation(userId);
      if (!location) {
        vizLogger.debug('User has no location', { userId });
        continue;
      }
      
      // Get user's privacy level
      const privacyLevel = await getUserPrivacyLevel(userId).catch(() => 'province');
      
      // Skip anonymous users
      if (privacyLevel === 'anonymous') {
        continue;
      }
      
      // Determine if user is local or foreign for this topic
      const votingStatus = getUserVotingStatus(userId, location.provinceCode, 'province');
      
      voters.push({
        userId,
        candidateId: vote.candidateId,
        voteType: vote.voteType || 'FOR',
        timestamp: vote.timestamp,
        location,
        privacyLevel,
        votingStatus,
        locationVerified: location.verificationMethod === 'gps',
        lastLocationUpdate: location.lastVerified
      });
    }
    
    vizLogger.info('Voters collected with locations', {
      topicId,
      totalVoters: voters.length
    });
    
    // Apply privacy-aware clustering
    const clusteredVoters = clusterVotersByPrivacy(voters);
    
    res.json({
      success: true,
      topicId,
      voterCount: voters.length,
      clusterCount: clusteredVoters.length,
      voters: clusteredVoters
    });
  } catch (error) {
    vizLogger.error('Failed to get voter visualization', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/voters/:topicId/candidate/:candidateId?level=province
 * Get voters for a specific candidate with boundary-based clustering
 * Query params: level = 'gps' | 'city' | 'county' | 'province' | 'country' (default: 'province')
 */
router.get('/voters/:topicId/candidate/:candidateId', async (req, res) => {
  try {
    const { topicId, candidateId } = req.params;
    const { level = 'province' } = req.query;
    
    // Validate level parameter
    const validLevels = ['gps', 'city', 'county', 'province', 'country'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Invalid level parameter. Must be one of: ${validLevels.join(', ')}`
      });
    }
    
    vizLogger.info('Candidate voter visualization requested', { topicId, candidateId, level });
    
    // Get voters from the actual voting system
    const votersWithVotes = getUsersWithVotesForCandidate(topicId, candidateId);
    
    if (!votersWithVotes || votersWithVotes.length === 0) {
      // No voters found - return empty clusters
      vizLogger.info('No voters found for candidate', { topicId, candidateId });
      return res.json({
      success: true,
      topicId,
      candidateId,
        level,
        clusters: { visible: [], hidden: [] },
        totalVoters: 0,
        visibleVoters: 0,
        hiddenVoters: 0,
        hiddenBreakdown: {}
      });
    }
    
    // Build voter objects with proper data granularity structure
    const voters = [];
    for (const { userId, vote } of votersWithVotes) {
      const location = getUserLocation(userId);
      if (!location) {
        vizLogger.debug('Voter has no location', { userId });
        continue;
      }
      
      // Get user's data granularity preference
      const dataGranularity = await getUserPrivacyLevel(userId).catch(() => 'province');
      
      // Build voter object based on what data they provided
      const voter = {
        userId,
        dataGranularity,
        vote: {
          candidateId: vote.candidateId,
          timestamp: vote.timestamp
        }
      };
      
      // Add location data based on granularity
      switch (dataGranularity) {
      case 'gps':
          voter.gps = { lat: location.lat, lng: location.lng };
          voter.city = location.city;
          voter.cityCode = location.cityCode;
          voter.county = location.county;
          voter.countyCode = location.countyCode;
          voter.province = location.province;
          voter.provinceCode = location.provinceCode;
          voter.country = location.country;
          voter.countryCode = location.countryCode;
        break;
      case 'city':
          voter.gps = null;
          voter.city = location.city;
          voter.cityCode = location.cityCode;
          voter.county = location.county;
          voter.countyCode = location.countyCode;
          voter.province = location.province;
          voter.provinceCode = location.provinceCode;
          voter.country = location.country;
          voter.countryCode = location.countryCode;
        break;
      case 'county':
          voter.gps = null;
          voter.city = null;
          voter.cityCode = null;
          voter.county = location.county;
          voter.countyCode = location.countyCode;
          voter.province = location.province;
          voter.provinceCode = location.provinceCode;
          voter.country = location.country;
          voter.countryCode = location.countryCode;
          break;
      case 'province':
          voter.gps = null;
          voter.city = null;
          voter.cityCode = null;
          voter.county = null;
          voter.countyCode = null;
          voter.province = location.province;
          voter.provinceCode = location.provinceCode;
          voter.country = location.country;
          voter.countryCode = location.countryCode;
          break;
        case 'country':
          voter.gps = null;
          voter.city = null;
          voter.cityCode = null;
          voter.county = null;
          voter.countyCode = null;
          voter.province = null;
          voter.provinceCode = null;
          voter.country = location.country;
          voter.countryCode = location.countryCode;
          break;
      default:
          // Anonymous or unknown - skip
          continue;
      }
      
      voters.push(voter);
    }
    
    vizLogger.info('Processing voters for clustering', { 
      totalVoters: voters.length, 
      level,
      candidateId 
    });
    
    // Use new clustering algorithm with visible/hidden separation
    const { visible, hidden } = await clusterVotersByLevel(voters, level);
    
    const visibleVoters = visible.reduce((sum, c) => sum + c.voterCount, 0);
    const hiddenVoters = hidden.reduce((sum, c) => sum + c.voterCount, 0);
    
    // Calculate breakdown of hidden voters by granularity
    const hiddenBreakdown = {};
    hidden.forEach(cluster => {
      cluster.voters.forEach(voter => {
        const granularity = voter.dataGranularity || 'unknown';
        hiddenBreakdown[granularity] = (hiddenBreakdown[granularity] || 0) + 1;
      });
    });
    
    vizLogger.info('Clustering complete', {
      visible: visible.length,
      hidden: hidden.length,
      visibleVoters,
      hiddenVoters
    });
    
    res.json({
      success: true,
      topicId,
      candidateId,
      level,
      clusters: { visible, hidden },
      totalVoters: voters.length,
      visibleVoters,
      hiddenVoters,
      hiddenBreakdown
    });
  } catch (error) {
    vizLogger.error('Failed to get candidate voter visualization', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================
// BOUNDARY-BASED CLUSTERING WITH VISIBLE/HIDDEN TOWERS
// ============================

/**
 * Check if voter has data at the selected level
 * @param {Object} voter - Voter object with dataGranularity
 * @param {string} selectedLevel - 'gps' | 'city' | 'province' | 'country'
 * @returns {boolean}
 */
function hasDataAtLevel(voter, selectedLevel) {
  switch (selectedLevel) {
    case 'gps':
      return voter.gps !== null && voter.gps !== undefined;
    case 'city':
      return voter.city !== null && voter.city !== undefined;
    case 'county':
      return voter.county !== null && voter.county !== undefined;
    case 'province':
      return voter.province !== null && voter.province !== undefined;
    case 'country':
      return voter.country !== null && voter.country !== undefined;
    default:
      return false;
  }
}

/**
 * Get parent level for hidden clustering
 * @param {string} selectedLevel - 'gps' | 'city' | 'county' | 'province' | 'country'
 * @returns {string}
 */
function getParentLevel(selectedLevel) {
  switch (selectedLevel) {
    case 'gps':
      return 'city';
    case 'city':
      return 'county';
    case 'county':
      return 'province';
    case 'province':
      return 'country';
    case 'country':
      return 'country'; // Country is the top level
    default:
      return 'country';
  }
}

/**
 * Get cluster key for visible clusters
 * @param {Object} voter
 * @param {string} level
 * @returns {string}
 */
function getClusterKey(voter, level) {
  switch (level) {
    case 'gps':
      return `gps-${voter.gps.lat.toFixed(6)}-${voter.gps.lng.toFixed(6)}`;
    case 'city':
      return `city-${voter.countryCode}-${voter.provinceCode}-${voter.cityCode}`;
    case 'county':
      return `county-${voter.countryCode}-${voter.provinceCode}-${voter.countyCode || voter.cityCode}`;
    case 'province':
      return `province-${voter.countryCode}-${voter.provinceCode}`;
    case 'country':
      return `country-${voter.countryCode}`;
    default:
      return `unknown-${voter.countryCode}`;
  }
}

/**
 * Get hidden cluster key for voters without data at selected level
 * @param {Object} voter
 * @param {string} parentLevel
 * @returns {string}
 */
function getHiddenClusterKey(voter, parentLevel) {
  return `hidden-${getClusterKey(voter, parentLevel)}`;
}

/**
 * Get location name for display
 * @param {Object} voter
 * @param {string} level
 * @returns {string}
 */
function getLocationName(voter, level) {
  switch (level) {
    case 'gps':
      return voter.city ? `${voter.city}, ${voter.province}` : voter.province || voter.country;
    case 'city':
      return voter.city ? `${voter.city}, ${voter.province}` : voter.province || voter.country;
    case 'county':
      return voter.county ? `${voter.county}, ${voter.province}` : voter.province || voter.country;
    case 'province':
      return voter.province ? `${voter.province}, ${voter.country}` : voter.country;
    case 'country':
      return voter.country || 'Unknown';
    default:
      return 'Unknown';
  }
}

/**
 * Get coordinates for cluster at selected level using centroid calculation
 * @param {Object} voter
 * @param {string} level
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getClusterCoords(voter, level) {
  try {
    switch (level) {
      case 'gps':
        // For GPS, use exact coordinates
        if (voter.gps) {
          return { lat: voter.gps.lat, lng: voter.gps.lng };
        }
        // Fallback to city if no GPS
        return getCityCentroid(voter.countryCode, voter.provinceCode, voter.cityCode);
        
      case 'city':
        // Use city centroid
        return getCityCentroid(voter.countryCode, voter.provinceCode, voter.cityCode);
        
      case 'county':
        // Use county centroid (fallback to city if county not available)
        if (voter.countyCode) {
          return getCountyCentroid(voter.countryCode, voter.provinceCode, voter.countyCode);
        }
        return getCityCentroid(voter.countryCode, voter.provinceCode, voter.cityCode);
        
      case 'province':
        // Use province centroid
        return getProvinceCentroid(voter.countryCode, voter.provinceCode);
        
      case 'country':
        // Use country centroid
        return getCountryCentroid(voter.countryCode);
        
      default:
        vizLogger.warn('Unknown level for cluster coords', { level });
        return { lat: 0, lng: 0 };
    }
  } catch (error) {
    vizLogger.error('Failed to get cluster coords', { level, error: error.message });
    return { lat: 0, lng: 0 };
  }
}

/**
 * Get coordinates for hidden cluster at parent level
 * @param {Object} voter
 * @param {string} parentLevel
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getParentCenterCoords(voter, parentLevel) {
  return getClusterCoords(voter, parentLevel);
}

/**
 * Add vote count to cluster
 * @param {Object} cluster
 * @returns {Object}
 */
function addVoteCount(cluster) {
  return {
    ...cluster,
    voterCount: cluster.voters.length
  };
}

/**
 * Cluster voters by selected aggregation level with visible/hidden separation
 * @param {Array} voters - Array of voter objects with dataGranularity
 * @param {string} selectedLevel - 'gps' | 'city' | 'province' | 'country'
 * @returns {Promise<{visible: Array, hidden: Array}>}
 */
async function clusterVotersByLevel(voters, selectedLevel = 'province') {
  const visibleClusters = new Map();
  const hiddenClusters = new Map();
  
  for (const voter of voters) {
    const hasData = hasDataAtLevel(voter, selectedLevel);
    
    if (hasData) {
      // VISIBLE: Voter has data at this level
      const clusterKey = getClusterKey(voter, selectedLevel);
      const coords = await getClusterCoords(voter, selectedLevel);
      
      if (!visibleClusters.has(clusterKey)) {
        visibleClusters.set(clusterKey, {
          clusterKey,
          lat: coords.lat,
          lng: coords.lng,
          locationName: getLocationName(voter, selectedLevel),
          level: selectedLevel,
          isVisible: true,
          voters: [],
          votesByCandidate: {}
        });
      }
      
      const cluster = visibleClusters.get(clusterKey);
      cluster.voters.push(voter);
      cluster.votesByCandidate[voter.vote.candidateId] = 
        (cluster.votesByCandidate[voter.vote.candidateId] || 0) + 1;
      
    } else {
      // HIDDEN: Voter lacks data at this level - show at parent center
      const parentLevel = getParentLevel(selectedLevel);
      const hiddenKey = getHiddenClusterKey(voter, parentLevel);
      const coords = await getParentCenterCoords(voter, parentLevel);
      
      if (!hiddenClusters.has(hiddenKey)) {
        hiddenClusters.set(hiddenKey, {
          clusterKey: hiddenKey,
          lat: coords.lat,
          lng: coords.lng,
          locationName: getLocationName(voter, parentLevel),
          level: parentLevel,
          privacyReason: `${voter.dataGranularity}-level data only`,
          isHidden: true,
          voters: [],
          votesByCandidate: {}
        });
      }
      
      const cluster = hiddenClusters.get(hiddenKey);
      cluster.voters.push(voter);
      cluster.votesByCandidate[voter.vote.candidateId] = 
        (cluster.votesByCandidate[voter.vote.candidateId] || 0) + 1;
    }
  }
  
  return {
    visible: Array.from(visibleClusters.values()).map(addVoteCount),
    hidden: Array.from(hiddenClusters.values()).map(addVoteCount)
  };
}

/**
 * OLD FUNCTION - kept for backward compatibility, redirects to new function
 * @deprecated Use clusterVotersByLevel instead
 */
function clusterVotersByPrivacy(voters) {
  // Default to province-level clustering for backward compatibility
  return clusterVotersByLevel(voters, 'province').then(result => {
    // Merge visible and hidden for old API
    return [...result.visible, ...result.hidden];
  });
}

export default router;

