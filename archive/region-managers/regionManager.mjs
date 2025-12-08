/**
 * @fileoverview Region Manager - Handles geographic regions, boundaries and location-based operations
 */
import { logger } from '../utils/logging/logger.mjs';
import userRepository from '../database/userRepository.mjs';
import { validatePolygon } from '../utils/validation/validators.mjs';
import { createError } from '../utils/common/errors.mjs';
import * as turf from '@turf/turf';

const regionLogger = logger.child({ module: 'region-manager' });

/**
 * Region Manager - Manages geographic regions and boundaries
 * Handles region validation, user assignment, and boundary calculations
 */
class RegionManager {
  constructor() {
    this.regions = new Map();
    this.userRegions = new Map();
    this.loaded = false;
    
    regionLogger.info('Region manager initialized');
  }

  /**
   * Initialize the region manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loaded) {
      return;
    }
    
    try {
      // Load regions from storage
      const regions = await this.loadRegions();
      
      for (const region of regions) {
        this.regions.set(region.id, region);
      }
      
      this.loaded = true;
      regionLogger.info(`Loaded ${this.regions.size} regions`);
    } catch (error) {
      regionLogger.error('Failed to initialize region manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Load regions from storage
   * @returns {Promise<Array>} Array of region objects
   */
  async loadRegions() {
    // Load regions from data/regions.json
    const fs = await import('fs/promises');
    const path = await import('path');
    const regionsFile = path.join(process.cwd(), 'data', 'regions.json');
    try {
      const data = await fs.readFile(regionsFile, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.regions) {
        return Object.values(parsed.regions);
      }
      return [];
    } catch (error) {
      regionLogger.warn('Could not load regions from regions.json', { error: error.message });
      return [];
    }
  }

  /**
   * Validate a region submission
   * @param {Object} regionData - Region data to validate
   * @returns {Object} Validation result with errors if any
   */
  validateRegionSubmission(regionData) {
    if (!regionData) {
      return { valid: false, errors: ['No region data provided'] };
    }
    
    const errors = [];
    
    // Check required fields
    if (!regionData.name) {
      errors.push('Region name is required');
    }
    
    if (!regionData.boundaries || !Array.isArray(regionData.boundaries)) {
      errors.push('Region boundaries must be an array of coordinates');
    } else if (regionData.boundaries.length < 3) {
      errors.push('Region boundaries must have at least 3 points');
    } else {
      // Validate the polygon
      const polygonValidation = validatePolygon(regionData.boundaries);
      if (!polygonValidation.valid) {
        errors.push(...polygonValidation.errors);
      }
    }
    
    // Check for level validity
    if (regionData.level !== undefined) {
      if (typeof regionData.level !== 'number' || regionData.level < 1 || regionData.level > 5) {
        errors.push('Region level must be a number between 1 and 5');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : []
    };
  }

  /**
   * Submit a new region boundary
   * @param {Object} regionData - Region data to submit
   * @returns {Promise<Object>} Result of the submission
   */
  async submitRegionBoundary(regionData) {
    // Validate the region data
    const validation = this.validateRegionSubmission(regionData);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    try {
      // Create a new region
      const regionId = this.generateRegionId();
      
      const region = {
        id: regionId,
        name: regionData.name,
        boundaries: regionData.boundaries,
        level: regionData.level || 1,
        createdAt: new Date().toISOString()
      };
      
      // Store the region
      this.regions.set(regionId, region);
      
      // Persist to storage - implementation depends on your storage mechanism
      await this.saveRegion(region);
      
      regionLogger.info('New region boundary submitted', { regionId, name: region.name });
      
      return {
        success: true,
        regionId
      };
    } catch (error) {
      regionLogger.error('Failed to submit region boundary', { error: error.message });
      
      return {
        success: false,
        error: 'Failed to submit region boundary'
      };
    }
  }

  /**
   * Save a region to storage
   * @param {Object} region - Region to save
   * @returns {Promise<void>}
   */
  async saveRegion(region) {
    // Save region to data/regions.json
    const fs = await import('fs/promises');
    const path = await import('path');
    const regionsFile = path.join(process.cwd(), 'data', 'regions.json');
    let regionsData = { regions: {} };
    try {
      // Load existing regions
      try {
        const data = await fs.readFile(regionsFile, 'utf8');
        regionsData = JSON.parse(data);
      } catch (readErr) {
        regionLogger.warn('regions.json not found, creating new', { error: readErr.message });
      }
      // Add or update region
      regionsData.regions[region.id] = region;
      await fs.writeFile(regionsFile, JSON.stringify(regionsData, null, 2), 'utf8');
      regionLogger.info('Region saved to regions.json', { regionId: region.id });
    } catch (error) {
      regionLogger.error('Failed to save region', { error: error.message });
    }
  }

  /**
   * Generate a unique region ID
   * @returns {string} A unique region ID
   */
  generateRegionId() {
    return `region_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Check if a point is within any region
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @returns {boolean} True if the point is within any region
   */
  isPointInAnyRegion(coordinates) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    
    const point = turf.point(coordinates);
    
    for (const region of this.regions.values()) {
      if (this.isPointInRegion(coordinates, region)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a point is within a specific region
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @param {Object} region - Region object with boundaries
   * @returns {boolean} True if the point is within the region
   */
  isPointInRegion(coordinates, region) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    
    if (!region || !region.boundaries || !Array.isArray(region.boundaries)) {
      return false;
    }
    
    const point = turf.point(coordinates);
    const polygon = turf.polygon([region.boundaries]);
    
    return turf.booleanPointInPolygon(point, polygon);
  }

  /**
   * Check if a point is within a specific region by region ID
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @param {string} regionId - ID of the region to check
   * @returns {boolean} True if the point is within the region
   */
  pointInRegion(coordinates, regionId) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    
    const region = this.regions.get(regionId);
    if (!region) {
      return false;
    }
    
    const point = turf.point(coordinates);
    const polygon = turf.polygon([region.boundaries]);
    
    return turf.booleanPointInPolygon(point, polygon);
  }

  /**
   * Get the region for coordinates
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @returns {Object|null} Region object or null if not found
   */
  getRegionForCoordinates(coordinates) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return null;
    }
    
    for (const region of this.regions.values()) {
      if (this.isPointInRegion(coordinates, region)) {
        return region;
      }
    }
    
    return null;
  }

  /**
   * Get all regions
   * @returns {Array} Array of all regions
   */
  getAllRegions() {
    return Array.from(this.regions.values());
  }

  /**
   * Get a region by ID
   * @param {string} regionId - Region ID
   * @returns {Object|null} Region object or null if not found
   */
  getRegionById(regionId) {
    return this.regions.get(regionId) || null;
  }

  /**
   * Alias for getRegionById
   * @param {string} regionId - Region ID
   * @returns {Object|null} Region object or null if not found
   */
  getRegion(regionId) {
    return this.getRegionById(regionId);
  }

  /**
   * Delete a region
   * @param {string} regionId - Region ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteRegion(regionId) {
    if (!this.regions.has(regionId)) {
      return false;
    }
    
    this.regions.delete(regionId);
    
    // Implementation for persistent storage deletion goes here
    
    regionLogger.info('Region deleted', { regionId });
    
    return true;
  }

  /**
   * Assign a user to a region
   * @param {string} userId - User ID
   * @param {string} regionId - Region ID
   * @returns {Promise<boolean>} True if assigned successfully
   */
  async assignUserToRegion(userId, regionId) {
    if (!userId || !regionId) {
      return false;
    }
    
    // Check if region exists
    if (!this.regions.has(regionId)) {
      throw createError('NotFoundError', `Region not found: ${regionId}`);
    }
    
    // Update user-region mapping
    this.userRegions.set(userId, regionId);
    
    // Update user record in repository
    try {
      await userRepository.updateUser(userId, { regionId });
      
      regionLogger.info('User assigned to region', { userId, regionId });
      
      return true;
    } catch (error) {
      regionLogger.error('Failed to assign user to region', { 
        userId, 
        regionId, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Get a user's region
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Region object or null
   */
  async getUserRegion(userId) {
    if (!userId) {
      return null;
    }
    
    // Check in-memory cache first
    const regionId = this.userRegions.get(userId);
    
    if (regionId && this.regions.has(regionId)) {
      return this.regions.get(regionId);
    }
    
    // Check repository
    try {
      const user = await userRepository.findById(userId);
      
      if (user && user.regionId) {
        const region = this.regions.get(user.regionId);
        
        if (region) {
          // Update cache
          this.userRegions.set(userId, user.regionId);
          return region;
        }
      }
      
      return null;
    } catch (error) {
      regionLogger.error('Failed to get user region', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Find the region that contains a given point
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @returns {Promise<Object|null>} Region object or null if not found
   */
  async findRegionForPoint(coordinates) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return null;
    }
    
    await this.ensureInitialized();
    
    // Check each region to see if the point is contained within it
    for (const [regionId, region] of this.regions) {
      if (this.pointInRegion(coordinates, regionId)) {
        return region;
      }
    }
    
    return null;
  }

  /**
   * Ensure the region manager is initialized
   * @returns {Promise<void>}
   */
  async ensureInitialized() {
    if (!this.loaded) {
      await this.initialize();
    }
  }
}

// Export both the class and the singleton instance
export { RegionManager };

// Create singleton instance
const regionManager = new RegionManager();

export default regionManager;
export { regionManager };
