// File: test/backend/api/locationApi.test.mjs

/**
 * @fileoverview Tests for location API endpoints
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as locationApi from '../../src/backend/api/locationApi.mjs';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';
import userLocationManager from '../../src/backend/location/userLocation.mjs';
import regionManager from '../../src/backend/location/regionManager.mjs';
import { getTopicRegion } from '../../src/backend/voting/votingEngine.mjs';

// Module mocks
vi.mock('../../src/backend/location/userLocation.mjs', () => ({
  default: {
    updateUserLocation: vi.fn(),
    getUserLocation: vi.fn(),
    getNearbyUsers: vi.fn(),
    getActiveRegionsForUser: vi.fn()
  }
}));

vi.mock('../../src/backend/location/regionManager.mjs', () => ({
  default: {
    getRegionById: vi.fn(),
    getAllRegions: vi.fn(),
    createRegion: vi.fn(),
    updateRegion: vi.fn(),
    deleteRegion: vi.fn()
  }
}));

vi.mock('../../src/backend/voting/votingEngine.mjs', () => ({
  getTopicRegion: vi.fn()
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('Location API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('updateUserLocation', () => {
    it('should update user location successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          coordinates: {
            lat: 37.7749,
            lng: -122.4194
          },
          voteDurationPreference: 30
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      userLocationManager.updateUserLocation.mockResolvedValue({
        userId: 'user123',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        lastUpdated: expect.any(Number)
      });
      
      // Act
      await locationApi.updateUserLocation(req, res);
      
      // Assert
      expect(userLocationManager.updateUserLocation).toHaveBeenCalledWith(
        'user123',
        { lat: 37.7749, lng: -122.4194 },
        30
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        location: expect.objectContaining({
          userId: 'user123',
          coordinates: expect.objectContaining({
            lat: 37.7749,
            lng: -122.4194
          })
        })
      }));
    });

    it('should return 400 for invalid location data', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          coordinates: {
            lat: 100, // Invalid latitude (> 90)
            lng: -122.4194
          }
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Act
      await locationApi.updateUserLocation(req, res);
      
      // Assert
      expect(userLocationManager.updateUserLocation).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });

    it('should return 500 when location update fails', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          coordinates: {
            lat: 37.7749,
            lng: -122.4194
          }
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementation for failure
      userLocationManager.updateUserLocation.mockRejectedValue(new Error('Update failed'));
      
      // Act
      await locationApi.updateUserLocation(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });

  describe('getUserLocation', () => {
    it('should return user location', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user123' }
      });
      const res = createMockResponse();
      
      const mockLocation = {
        userId: 'user123',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        lastUpdated: Date.now()
      };
      
      // Mock implementation
      userLocationManager.getUserLocation.mockResolvedValue(mockLocation);
      
      // Act
      await locationApi.getUserLocation(req, res);
      
      // Assert
      expect(userLocationManager.getUserLocation).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        location: mockLocation
      }));
    });

    it('should return 404 when user location is not found', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'nonexistent' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      userLocationManager.getUserLocation.mockResolvedValue(null);
      
      // Act
      await locationApi.getUserLocation(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringMatching(/not found/i)
      }));
    });
  });

  describe('getNearbyUsers', () => {
    it('should return nearby users', async () => {
      // Arrange
      const req = createMockRequest({
        query: {
          lat: '37.7749',
          lng: '-122.4194',
          radius: '10'
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      const mockNearbyUsers = [
        {
          userId: 'user456',
          coordinates: { lat: 37.775, lng: -122.420 },
          distance: 0.5
        },
        {
          userId: 'user789',
          coordinates: { lat: 37.773, lng: -122.417 },
          distance: 1.2
        }
      ];
      
      // Mock implementation
      userLocationManager.getNearbyUsers.mockResolvedValue(mockNearbyUsers);
      
      // Act
      await locationApi.getNearbyUsers(req, res);
      
      // Assert
      expect(userLocationManager.getNearbyUsers).toHaveBeenCalledWith(
        { lat: 37.7749, lng: -122.4194 },
        10,
        'user123'
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        users: mockNearbyUsers
      }));
    });

    it('should return 400 for missing or invalid parameters', async () => {
      // Arrange
      const req = createMockRequest({
        query: {
          lng: '-122.4194',
          // Missing lat
          radius: '10'
        },
        user: { id: 'user123' }
      });
      const res = createMockResponse();
      
      // Act
      await locationApi.getNearbyUsers(req, res);
      
      // Assert
      expect(userLocationManager.getNearbyUsers).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });

  describe('getRegions', () => {
    it('should return all regions', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      const mockRegions = [
        {
          id: 'region1',
          name: 'Downtown',
          bounds: [
            { lat: 37.78, lng: -122.43 },
            { lat: 37.77, lng: -122.43 },
            { lat: 37.77, lng: -122.41 },
            { lat: 37.78, lng: -122.41 }
          ]
        },
        {
          id: 'region2',
          name: 'Marina',
          bounds: [
            { lat: 37.81, lng: -122.44 },
            { lat: 37.80, lng: -122.44 },
            { lat: 37.80, lng: -122.42 },
            { lat: 37.81, lng: -122.42 }
          ]
        }
      ];
      
      // Mock implementation
      regionManager.getAllRegions.mockReturnValue(mockRegions);
      
      // Act
      await locationApi.getRegions(req, res);
      
      // Assert
      expect(regionManager.getAllRegions).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        regions: mockRegions
      }));
    });
  });

  describe('getRegionById', () => {
    it('should return a specific region', async () => {
      // Arrange
      const req = createMockRequest({
        params: { regionId: 'region1' }
      });
      const res = createMockResponse();
      
      const mockRegion = {
        id: 'region1',
        name: 'Downtown',
        bounds: [
          { lat: 37.78, lng: -122.43 },
          { lat: 37.77, lng: -122.43 },
          { lat: 37.77, lng: -122.41 },
          { lat: 37.78, lng: -122.41 }
        ]
      };
      
      // Mock implementation
      regionManager.getRegionById.mockReturnValue(mockRegion);
      
      // Act
      await locationApi.getRegionById(req, res);
      
      // Assert
      expect(regionManager.getRegionById).toHaveBeenCalledWith('region1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        region: mockRegion
      }));
    });

    it('should return 404 when region is not found', async () => {
      // Arrange
      const req = createMockRequest({
        params: { regionId: 'nonexistent' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      regionManager.getRegionById.mockReturnValue(null);
      
      // Act
      await locationApi.getRegionById(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringMatching(/not found/i)
      }));
    });
  });

  describe('createRegion', () => {
    it('should create a new region', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'New Region',
          bounds: [
            { lat: 38.78, lng: -123.43 },
            { lat: 38.77, lng: -123.43 },
            { lat: 38.77, lng: -123.41 },
            { lat: 38.78, lng: -123.41 }
          ],
          properties: {
            voteWeight: 1.5,
            active: true
          }
        }
      });
      const res = createMockResponse();
      
      const mockRegion = {
        id: 'newRegionId',
        name: 'New Region',
        bounds: [
          { lat: 38.78, lng: -123.43 },
          { lat: 38.77, lng: -123.43 },
          { lat: 38.77, lng: -123.41 },
          { lat: 38.78, lng: -123.41 }
        ],
        properties: {
          voteWeight: 1.5,
          active: true
        }
      };
      
      // Mock implementation
      regionManager.createRegion.mockReturnValue(mockRegion);
      
      // Act
      await locationApi.createRegion(req, res);
      
      // Assert
      expect(regionManager.createRegion).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Region',
        bounds: expect.any(Array),
        properties: expect.objectContaining({
          voteWeight: 1.5,
          active: true
        })
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        region: mockRegion
      }));
    });

    it('should return 400 for invalid region data', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'New Region',
          // Missing bounds
          properties: {
            voteWeight: 1.5,
            active: true
          }
        }
      });
      const res = createMockResponse();
      
      // Act
      await locationApi.createRegion(req, res);
      
      // Assert
      expect(regionManager.createRegion).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });

  describe('updateRegion', () => {
    it('should update a region', async () => {
      // Arrange
      const req = createMockRequest({
        params: { regionId: 'region1' },
        body: {
          name: 'Updated Region',
          properties: {
            voteWeight: 2.0,
            active: true
          }
        }
      });
      const res = createMockResponse();
      
      const mockUpdatedRegion = {
        id: 'region1',
        name: 'Updated Region',
        bounds: [
          { lat: 37.78, lng: -122.43 },
          { lat: 37.77, lng: -122.43 },
          { lat: 37.77, lng: -122.41 },
          { lat: 37.78, lng: -122.41 }
        ],
        properties: {
          voteWeight: 2.0,
          active: true
        }
      };
      
      // Mock implementation
      regionManager.updateRegion.mockReturnValue(mockUpdatedRegion);
      
      // Act
      await locationApi.updateRegion(req, res);
      
      // Assert
      expect(regionManager.updateRegion).toHaveBeenCalledWith(
        'region1',
        expect.objectContaining({
          name: 'Updated Region',
          properties: expect.objectContaining({
            voteWeight: 2.0,
            active: true
          })
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        region: mockUpdatedRegion
      }));
    });

    it('should return 404 when region does not exist', async () => {
      // Arrange
      const req = createMockRequest({
        params: { regionId: 'nonexistent' },
        body: {
          name: 'Updated Region',
          properties: {
            voteWeight: 2.0,
            active: true
          }
        }
      });
      const res = createMockResponse();
      
      // Mock implementation
      regionManager.updateRegion.mockReturnValue(null);
      
      // Act
      await locationApi.updateRegion(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringMatching(/not found/i)
      }));
    });
  });

  describe('getUserActiveRegions', () => {
    it('should return active regions for user', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user123' }
      });
      const res = createMockResponse();
      
      const mockRegions = [
        {
          id: 'region1',
          name: 'Downtown',
          eligibility: 'active'
        },
        {
          id: 'region2',
          name: 'Marina',
          eligibility: 'pending'
        }
      ];
      
      // Mock implementation
      userLocationManager.getActiveRegionsForUser.mockResolvedValue(mockRegions);
      
      // Act
      await locationApi.getUserActiveRegions(req, res);
      
      // Assert
      expect(userLocationManager.getActiveRegionsForUser).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        regions: mockRegions
      }));
    });

    it('should return 404 when user has no regions', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user123' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      userLocationManager.getActiveRegionsForUser.mockResolvedValue([]);
      
      // Act
      await locationApi.getUserActiveRegions(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringMatching(/no active regions/i)
      }));
    });
  });
});







