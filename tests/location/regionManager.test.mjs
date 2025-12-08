// test/backend/location/regionManager.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RegionManager } from '../../src/backend/location/regionManager.mjs';

// Mock dependencies
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }))
  }
}));

vi.mock('../../src/backend/database/userRepository.mjs', () => ({
  default: {
    getUsersByRegion: vi.fn(),
    updateUser: vi.fn()
  }
}));

vi.mock('../../src/backend/utils/validation/validators.mjs', () => ({
  validatePolygon: vi.fn()
}));

vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.statusCode = type === 'validation' ? 400 : 500;
    return error;
  })
}));

vi.mock('@turf/turf', () => ({
  polygon: vi.fn(),
  point: vi.fn(),
  booleanPointInPolygon: vi.fn(),
  area: vi.fn(),
  centroid: vi.fn(),
  distance: vi.fn()
}));

// Import mocked modules to use in tests
import { validatePolygon } from '../../src/backend/utils/validation/validators.mjs';
import userRepository from '../../src/backend/database/userRepository.mjs';
import * as turf from '@turf/turf';

describe('RegionManager', () => {
  let regionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    regionManager = new RegionManager();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty regions', () => {
      expect(regionManager.regions).toBeInstanceOf(Map);
      expect(regionManager.regions.size).toBe(0);
      expect(regionManager.userRegions).toBeInstanceOf(Map);
      expect(regionManager.loaded).toBe(false);
    });

    it('should load regions during initialization', async () => {
      // Mock loadRegions to return test data
      const testRegions = [
        { id: 'region-1', name: 'Test Region 1', boundaries: [[0,0], [1,0], [1,1], [0,1], [0,0]] },
        { id: 'region-2', name: 'Test Region 2', boundaries: [[2,2], [3,2], [3,3], [2,3], [2,2]] }
      ];
      
      vi.spyOn(regionManager, 'loadRegions').mockResolvedValueOnce(testRegions);
      
      await regionManager.initialize();
      
      expect(regionManager.loaded).toBe(true);
      expect(regionManager.regions.size).toBe(2);
      expect(regionManager.regions.get('region-1')).toEqual(testRegions[0]);
    });
    
    it('should not reinitialize if already loaded', async () => {
      regionManager.loaded = true;
      const loadRegionsSpy = vi.spyOn(regionManager, 'loadRegions');
      
      await regionManager.initialize();
      
      expect(loadRegionsSpy).not.toHaveBeenCalled();
    });
    
    it('should handle initialization errors', async () => {
      vi.spyOn(regionManager, 'loadRegions').mockRejectedValueOnce(new Error('Load failed'));
      
      await expect(regionManager.initialize()).rejects.toThrow('Load failed');
      expect(regionManager.loaded).toBe(false);
    });
  });
  
  describe('validateRegionSubmission', () => {
    it('should validate a valid region', () => {
      const validRegion = {
        name: 'Test Region',
        boundaries: [[0,0], [1,0], [1,1], [0,1], [0,0]],
        level: 3
      };
      
      validatePolygon.mockReturnValueOnce({ valid: true, errors: [] });
      
      const result = regionManager.validateRegionSubmission(validRegion);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid region data', () => {
      const invalidRegion = {
        // Missing name
        boundaries: [[0,0], [1,0]], // Too few points
        level: 10 // Invalid level
      };
      
      const result = regionManager.validateRegionSubmission(invalidRegion);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Region name is required');
      expect(result.errors).toContain('Region boundaries must have at least 3 points');
      expect(result.errors).toContain('Region level must be a number between 1 and 5');
    });
    
    it('should handle null or undefined input', () => {
      expect(regionManager.validateRegionSubmission(null).valid).toBe(false);
      expect(regionManager.validateRegionSubmission(undefined).valid).toBe(false);
    });
  });
  
  describe('pointInRegion', () => {
    it('should check if a point is in a region', () => {
      // Setup
      const regionId = 'region-1';
      const point = [1, 1];
      const region = { 
        id: regionId, 
        name: 'Test Region', 
        boundaries: [[0,0], [2,0], [2,2], [0,2], [0,0]]
      };
      
      regionManager.regions.set(regionId, region);
      turf.booleanPointInPolygon.mockReturnValueOnce(true);
      
      // Act
      const result = regionManager.pointInRegion(point, regionId);
      
      // Assert
      expect(result).toBe(true);
      expect(turf.point).toHaveBeenCalledWith([1, 1]);
      expect(turf.polygon).toHaveBeenCalledWith([region.boundaries]);
      expect(turf.booleanPointInPolygon).toHaveBeenCalled();
    });
    
    it('should return false for invalid regions', () => {
      expect(regionManager.pointInRegion([1, 1], 'non-existent-region')).toBe(false);
    });
  });
  
  describe('findRegionForPoint', () => {
    it('should find the correct region for a given point', async () => {
      // Setup
      const point = [1, 1];
      const regions = [
        { id: 'region-1', name: 'Region 1', boundaries: [[0,0], [2,0], [2,2], [0,2], [0,0]] },
        { id: 'region-2', name: 'Region 2', boundaries: [[3,3], [4,3], [4,4], [3,4], [3,3]] }
      ];
      
      regionManager.regions.set('region-1', regions[0]);
      regionManager.regions.set('region-2', regions[1]);
      
      // Mock point in region for first region only
      vi.spyOn(regionManager, 'pointInRegion')
        .mockImplementation((pt, regionId) => regionId === 'region-1');
        
      // Act
      const foundRegion = await regionManager.findRegionForPoint(point);
      
      // Assert
      expect(foundRegion).toEqual(regions[0]);
    });
    
    it('should return null if no region contains the point', async () => {
      const point = [5, 5]; // Outside all regions
      vi.spyOn(regionManager, 'pointInRegion').mockReturnValue(false);
      
      const foundRegion = await regionManager.findRegionForPoint(point);
      
      expect(foundRegion).toBeNull();
    });
  });
});






