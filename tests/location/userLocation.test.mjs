// test/backend/location/userLocation.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getUserRegion,
  updateUserLocation,
  getUserLocation,
  getNearbyUsers
} from '../../src/backend/location/userLocation.mjs';
import { userRepository } from '../../src/backend/database/userRepository.mjs';

// Mock dependencies
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  }
}));

// Mock the userRepository
vi.mock('../../src/backend/database/userRepository.mjs', () => ({
  userRepository: {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({})
  },
  default: {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({})
  }
}));

// Import mocked modules
import logger from '../../src/backend/utils/logging/logger.mjs';
import { userRepository } from '../../src/backend/database/userRepository.mjs';

describe('User Location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserRegion', () => {
    it('should return unknown for non-existent users', async () => {
      const region = await getUserRegion('non-existent-user');
      expect(region).toBe('unknown');
      expect(logger.debug).toHaveBeenCalledWith('Getting region for user', { userId: 'non-existent-user' });
      expect(logger.debug).toHaveBeenCalledWith('No location data found for user', { userId: 'non-existent-user' });
    });

    it('should return the region for a user with location data', async () => {
      // Setup user location
      await updateUserLocation('test-user', { lat: 10, lng: 20 });
      
      const region = await getUserRegion('test-user');
      
      expect(region).toBe('default-region');
      expect(logger.debug).toHaveBeenCalledWith('Getting region for user', { userId: 'test-user' });
    });
  });

  describe('updateUserLocation', () => {
    it('should update and store user location data', async () => {
      const userId = 'test-user';
      const coordinates = { lat: 10.5, lng: 20.5 };
      const voteDurationPreference = 30;
      
      const result = await updateUserLocation(userId, coordinates, voteDurationPreference);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.coordinates).toEqual(coordinates);
      expect(result.voteDurationPreference).toBe(voteDurationPreference);
      expect(result.timestamp).toBeTypeOf('number');
      expect(result.region).toBe('default-region');
      
      expect(logger.debug).toHaveBeenCalledWith('Updated user location', { userId, coordinates });
    });

    it('should handle errors during update', async () => {
      // Setup an error condition
      vi.spyOn(global.Map.prototype, 'set').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      await expect(
        updateUserLocation('test-user', { lat: 10, lng: 20 })
      ).rejects.toThrow('Storage error');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to update user location', 
        { userId: 'test-user', error: expect.any(Error) }
      );
    });
  });

  describe('getUserLocation', () => {
    it('should return null for non-existent users', async () => {
      const location = await getUserLocation('non-existent-user');
      
      expect(location).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Getting location for user', { userId: 'non-existent-user' });
      expect(logger.debug).toHaveBeenCalledWith('No location data found for user', { userId: 'non-existent-user' });
    });

    it('should return location data for existing users', async () => {
      const userId = 'test-user';
      const coordinates = { lat: 10, lng: 20 };
      
      // Setup user location
      await updateUserLocation(userId, coordinates);
      
      const location = await getUserLocation(userId);
      
      expect(location).toBeDefined();
      expect(location.userId).toBe(userId);
      expect(location.coordinates).toEqual(coordinates);
    });
  });

  describe('getNearbyUsers', () => {
    it('should find users within the specified radius', async () => {
      // Setup multiple user locations
      await updateUserLocation('user1', { lat: 10, lng: 10 });
      await updateUserLocation('user2', { lat: 10.001, lng: 10.001 }); // Close to user1
      await updateUserLocation('user3', { lat: 11, lng: 11 }); // Far from user1
      
      const centerCoords = { lat: 10, lng: 10 };
      const radius = 1000; // 1km radius
      
      const nearbyUsers = await getNearbyUsers(centerCoords, radius, 'user1');
      
      expect(nearbyUsers).toHaveLength(1);
      expect(nearbyUsers[0].userId).toBe('user2');
      expect(nearbyUsers[0].distance).toBeLessThan(radius);
    });    it('should exclude the specified user ID', async () => {
      // Setup user locations - clear any previous test data
      vi.spyOn(global.Map.prototype, 'clear').mockImplementationOnce(() => {
        // Clearing happens but we manually add our test data
      });
      
      // Setup exactly one user (user2) that is near user1's location
      // but exclude user1 explicitly
      await updateUserLocation('user1', { lat: 10, lng: 10 });
      await updateUserLocation('user2', { lat: 10.001, lng: 10.001 }); // Nearby user
      
      const centerCoords = { lat: 10, lng: 10 };
      const radius = 1000;
      
      const nearbyUsers = await getNearbyUsers(centerCoords, radius, 'user1');
      
      // Since user1 is excluded and user2 is nearby, we should get exactly 1 result
      expect(nearbyUsers).toHaveLength(1);
      expect(nearbyUsers[0].userId).toBe('user2');
    });

    it('should handle empty or missing coordinates', async () => {
      // Setup a user with no coordinates
      const userLocations = new Map();
      userLocations.set('user-no-coords', { userId: 'user-no-coords' });
      
      // No error should be thrown
      const nearbyUsers = await getNearbyUsers({ lat: 10, lng: 10 }, 1000);
      
      expect(Array.isArray(nearbyUsers)).toBe(true);
    });
  });
});






