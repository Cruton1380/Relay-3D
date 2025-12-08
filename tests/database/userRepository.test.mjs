// test/backend/database/userRepository.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BaseRepository } from '../../src/backend/database/baseRepository.mjs';
import { UserRepository } from '../../src/backend/database/userRepository.mjs';

// Mock dependencies
vi.mock('../../src/backend/database/baseRepository.mjs', () => ({
  BaseRepository: class MockBaseRepository {
    constructor(collectionName) {
      this.collectionName = collectionName;
      this.initialized = false;
      this.indexedFields = new Set();
      this.data = new Map();
      this.indices = new Map();
    }
    
    async ensureInitialized() {
      this.initialized = true;
    }
    
    async create(data) {
      return { id: 'test-id', ...data };
    }
    
    async findById(id) {
      return { id, publicKey: 'test-key' };
    }
    
    async findAll(filter, options = {}) {
      return { 
        data: [{ id: 'test-id', ...filter }],
        total: 1,
        page: options.page || 1,
        limit: options.limit || 10
      };
    }
    
    async update(id, data) {
      return { id, ...data };
    }
    
    async delete(id) {
      return true;
    }
  }
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => {
  const mockLogger = {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
  return {
    default: mockLogger,
    logger: mockLogger
  };
});

vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.statusCode = type === 'validation' ? 400 : 500;
    return error;
  })
}));

vi.mock('../../src/backend/services/configService.mjs', () => ({
  default: {
    getRegionParameters: vi.fn().mockResolvedValue({
      maxUsersPerRegion: 1000,
      userValidationEnabled: true
    })
  }
}));

// Import the dependencies
import { createError } from '../../src/backend/utils/common/errors.mjs';

describe('UserRepository', () => {
  let repository;
  
  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('Constructor', () => {
    it('should extend BaseRepository', () => {
      expect(repository).toBeInstanceOf(BaseRepository);
      expect(repository.collectionName).toBe('users');
    });

    it('should have indexed fields configured', () => {
      expect(repository.indexedFields.has('publicKey')).toBe(true);
      expect(repository.indexedFields.has('regionId')).toBe(true);
    });
  });

  describe('findByPublicKey()', () => {    it('should find user by public key', async () => {
      const publicKey = 'test-public-key';
      const expectedUser = { id: 'user-1', publicKey };
      
      // Mock the repository to simulate finding a user
      vi.spyOn(repository, 'ensureInitialized').mockResolvedValueOnce();
      
      // Mock the indices or data directly
      repository.indices = new Map();
      repository.indices.set('publicKey', new Map([
        [publicKey, expectedUser]
      ]));
      
      const result = await repository.findByPublicKey(publicKey);
      
      expect(result).toBeDefined();
      expect(result.publicKey).toBe(publicKey);
    });it('should throw error for missing public key', async () => {
      await expect(repository.findByPublicKey('')).rejects.toThrow('Public key is required');
      await expect(repository.findByPublicKey(null)).rejects.toThrow('Public key is required');
    });    it('should return null if user not found', async () => {
      // Mock to simulate user not found
      vi.spyOn(repository, 'ensureInitialized').mockResolvedValueOnce();
      repository.indices = new Map();
      repository.indices.set('publicKey', new Map());
      repository.data = new Map();
      
      const result = await repository.findByPublicKey('non-existent-key');
      
      expect(result).toBeNull();
    });    it('should handle search errors gracefully', async () => {
      // Mock ensureInitialized to throw an error
      vi.spyOn(repository, 'ensureInitialized').mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.findByPublicKey('test-key')).rejects.toThrow('Database error');
    });
  });

  describe('getUsersByRegion()', () => {
    it('should get users by region', async () => {
      const regionId = 'region-1';
      const expectedUsers = [
        { id: 'user-1', regionId },
        { id: 'user-2', regionId }
      ];
      
      const findAllSpy = vi.spyOn(repository, 'findAll').mockResolvedValueOnce({ data: expectedUsers });
      
      const result = await repository.getUsersByRegion(regionId);
      
      expect(result).toEqual(expectedUsers);
      expect(findAllSpy).toHaveBeenCalledWith({ regionId }, {});
    });

    it('should handle pagination options', async () => {
      const regionId = 'region-1';
      const options = { limit: 10, offset: 20 };
        const findAllSpy = vi.spyOn(repository, 'findAll').mockResolvedValueOnce({ data: [] });
      
      await repository.getUsersByRegion(regionId, options);
      
      expect(findAllSpy).toHaveBeenCalledWith({ regionId }, options);
    });

    it('should throw error for missing region ID', async () => {
      await expect(repository.getUsersByRegion('')).rejects.toThrow('Region ID is required');
    });
  });

  describe('createUser()', () => {
    it('should create user with required fields', async () => {
      const userData = {
        publicKey: 'test-public-key',
        regionId: 'region-1',
        username: 'testuser'
      };
      
      const createSpy = vi.spyOn(repository, 'create').mockResolvedValueOnce({
        id: 'user-1',
        ...userData,
        isActive: true,
        createdAt: expect.any(Number),
        lastActivityAt: expect.any(Number)
      });
      
      const result = await repository.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(createSpy).toHaveBeenCalled();
    });

    it('should throw error for missing required fields', async () => {
      await expect(repository.createUser({})).rejects.toThrow('Public key is required');
      
      await expect(repository.createUser({ 
        publicKey: 'test-key' 
      })).rejects.toThrow('Region ID is required');
    });

    it('should validate unique public key', async () => {
      const userData = {
        publicKey: 'existing-key',
        regionId: 'region-1',
        username: 'testuser'
      };
      
      // Mock existing user found
      const findByPublicKeySpy = vi.spyOn(repository, 'findByPublicKey')
        .mockResolvedValueOnce({ id: 'existing-user', publicKey: 'existing-key' });
      
      await expect(repository.createUser(userData)).rejects.toThrow('User with this public key already exists');
    });
  });

  describe('updateUser()', () => {
    it('should update user successfully', async () => {
      const userId = 'user-1';
      const updateData = { username: 'updated-username' };
      
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValueOnce({
        id: userId,
        ...updateData,
        updatedAt: expect.any(Number)
      });
      
      const result = await repository.updateUser(userId, updateData);
      
      expect(result).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(updateSpy).toHaveBeenCalledWith(userId, {
        ...updateData,
        updatedAt: expect.any(Number)
      });
    });

    it('should throw error for missing user ID', async () => {
      await expect(repository.updateUser('', {})).rejects.toThrow('User ID is required');
    });

    it('should prevent updating protected fields', async () => {
      const userId = 'user-1';
      const updateData = { 
        id: 'different-id',
        createdAt: Date.now(),
        username: 'valid-update'
      };
      
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValueOnce({
        id: userId,
        username: 'valid-update'
      });
      
      await repository.updateUser(userId, updateData);
      
      // Should not include protected fields
      expect(updateSpy).toHaveBeenCalledWith(userId, expect.not.objectContaining({
        id: 'different-id',
        createdAt: expect.any(Number)
      }));
    });
  });

  describe('deactivateUser()', () => {
    it('should deactivate user', async () => {
      const userId = 'user-1';
      
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValueOnce({
        id: userId,
        isActive: false,
        deactivatedAt: expect.any(Number)
      });
      
      const result = await repository.deactivateUser(userId);
      
      expect(result.isActive).toBe(false);
      expect(result.deactivatedAt).toBeDefined();      expect(updateSpy).toHaveBeenCalledWith(userId, {
        isActive: false,
        updatedAt: expect.any(Number),
        deactivatedAt: expect.any(Number)
      });
    });

    it('should throw error for missing user ID', async () => {
      await expect(repository.deactivateUser('')).rejects.toThrow('User ID is required');
    });
  });

  describe('reactivateUser()', () => {
    it('should reactivate user', async () => {
      const userId = 'user-1';
      
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValueOnce({
        id: userId,
        isActive: true,
        reactivatedAt: expect.any(Number)
      });
      
      const result = await repository.reactivateUser(userId);
      
      expect(result.isActive).toBe(true);
      expect(result.reactivatedAt).toBeDefined();
      expect(updateSpy).toHaveBeenCalledWith(userId, {
        isActive: true,
        reactivatedAt: expect.any(Number),
        deactivatedAt: null
      });
    });
  });

  describe('updateActivity()', () => {
    it('should update user activity timestamp', async () => {
      const userId = 'user-1';
      
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValueOnce({
        id: userId,
        lastActivityAt: expect.any(Number)
      });
      
      const result = await repository.updateActivity(userId);
      
      expect(result.lastActivityAt).toBeDefined();
      expect(updateSpy).toHaveBeenCalledWith(userId, {
        lastActivityAt: expect.any(Number)
      });
    });

    it('should handle update errors gracefully', async () => {
      const userId = 'user-1';
      
      const updateSpy = vi.spyOn(repository, 'update').mockRejectedValueOnce(new Error('Update failed'));
      
      const result = await repository.updateActivity(userId);
      
      expect(result).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate user data format', async () => {
      const invalidUserData = {
        publicKey: '', // empty
        regionId: 'region-1',
        username: 'test'
      };
      
      await expect(repository.createUser(invalidUserData)).rejects.toThrow('Public key is required');
    });

    it('should handle malformed user data', async () => {
      const malformedData = {
        publicKey: 123, // wrong type
        regionId: 'region-1'
      };
      
      await expect(repository.createUser(malformedData)).rejects.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work with repository events', async () => {
      const userData = {
        publicKey: 'test-key',
        regionId: 'region-1',
        username: 'testuser'
      };
      
      // Mock no existing user
      const findByPublicKeySpy = vi.spyOn(repository, 'findByPublicKey').mockResolvedValueOnce(null);
      const createSpy = vi.spyOn(repository, 'create').mockResolvedValueOnce({
        id: 'user-1',
        ...userData,
        isActive: true,
        createdAt: Date.now(),
        lastActivityAt: Date.now()
      });
      
      const result = await repository.createUser(userData);
      
      expect(result).toBeDefined();
      expect(findByPublicKeySpy).toHaveBeenCalledWith(userData.publicKey);
      expect(createSpy).toHaveBeenCalled();
    });
  });
});






