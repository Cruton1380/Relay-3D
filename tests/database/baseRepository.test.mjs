// test/backend/database/baseRepository.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BaseRepository } from '../../src/backend/database/baseRepository.mjs';
import { EventEmitter } from 'events';

// Mock dependencies
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
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
  }
}));

vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message, details) => {
    const error = new Error(message);
    error.statusCode = type === 'validation' ? 400 : 500;
    error.errorCode = type.toUpperCase() + '_ERROR';
    return error;
  })
}));

vi.mock('../../src/backend/utils/storage/index.mjs', () => ({
  storageFactory: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn()
  }))
}));

vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
}));

// Import mocked modules
import logger from '../../src/backend/utils/logging/logger.mjs';
import { createError } from '../../src/backend/utils/common/errors.mjs';
import { storageFactory } from '../../src/backend/utils/storage/index.mjs';

describe('BaseRepository', () => {
  let repository;
  let mockStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStorage = {
      initialize: vi.fn().mockResolvedValue(true),
      create: vi.fn().mockResolvedValue({ id: 'test-id', data: 'test' }),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn().mockResolvedValue(false)
    };
    
    storageFactory.mockReturnValue(mockStorage);
    
    repository = new BaseRepository('test-collection');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository with correct properties', () => {
      expect(repository).toBeInstanceOf(EventEmitter);
      expect(repository.collectionName).toBe('test-collection');
      expect(repository.initialized).toBe(false);
      expect(storageFactory).toHaveBeenCalledWith('test-collection', {});
    });

    it('should create repository with options', () => {
      const options = { storage: { type: 'memory' } };
      const repoWithOptions = new BaseRepository('test-collection', options);
      
      expect(repoWithOptions.options).toEqual(options);
      expect(storageFactory).toHaveBeenCalledWith('test-collection', options.storage);
    });
  });

  describe('initialize()', () => {
    it('should initialize storage successfully', async () => {
      await repository.initialize();
      
      expect(mockStorage.initialize).toHaveBeenCalled();
      expect(repository.initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      repository.initialized = true;
      
      await repository.initialize();
      
      expect(mockStorage.initialize).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Storage initialization failed');
      mockStorage.initialize.mockRejectedValueOnce(error);
      
      await expect(repository.initialize()).rejects.toThrow('Repository initialization failed');
      expect(createError).toHaveBeenCalledWith('internal', 'Repository initialization failed: Storage initialization failed');
    });
  });

  describe('ensureInitialized()', () => {
    it('should call initialize if not initialized', async () => {
      const initializeSpy = vi.spyOn(repository, 'initialize');
      
      await repository.ensureInitialized();
      
      expect(initializeSpy).toHaveBeenCalled();
      expect(repository.initialized).toBe(true);
    });

    it('should not call initialize if already initialized', async () => {
      repository.initialized = true;
      const initializeSpy = vi.spyOn(repository, 'initialize');
      
      await repository.ensureInitialized();
      
      expect(initializeSpy).not.toHaveBeenCalled();
    });
  });

  describe('create()', () => {
    beforeEach(async () => {
      await repository.initialize();
    });

    it('should create item successfully', async () => {
      const data = { name: 'test item' };
      const expectedData = { ...data, id: 'test-uuid-123' };
      
      mockStorage.findById.mockResolvedValueOnce(null);
      mockStorage.create.mockResolvedValueOnce(expectedData);
      
      const result = await repository.create(data);
      
      expect(result).toEqual(expectedData);
      expect(mockStorage.create).toHaveBeenCalledWith(expectedData);
    });

    it('should generate UUID if no id provided', async () => {
      const data = { name: 'test item' };
      
      mockStorage.findById.mockResolvedValueOnce(null);
      
      await repository.create(data);
      
      expect(data.id).toBe('test-uuid-123');
    });

    it('should use provided id', async () => {
      const data = { id: 'custom-id', name: 'test item' };
      
      mockStorage.findById.mockResolvedValueOnce(null);
      
      await repository.create(data);
      
      expect(mockStorage.create).toHaveBeenCalledWith(data);
    });

    it('should throw error if item already exists', async () => {
      const data = { id: 'existing-id', name: 'test item' };
      
      mockStorage.findById.mockResolvedValueOnce({ id: 'existing-id' });
      
      await expect(repository.create(data)).rejects.toThrow('Item with id existing-id already exists');
    });

    it('should emit created event', async () => {
      const data = { name: 'test item' };
      const eventSpy = vi.fn();
      
      repository.on('created', eventSpy);
      mockStorage.findById.mockResolvedValueOnce(null);
      
      await repository.create(data);
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining(data));
    });
  });

  describe('findById()', () => {
    beforeEach(async () => {
      await repository.initialize();
    });

    it('should find item by id', async () => {
      const item = { id: 'test-id', name: 'test item' };
      mockStorage.findById.mockResolvedValueOnce(item);
      
      const result = await repository.findById('test-id');
      
      expect(result).toEqual(item);
      expect(mockStorage.findById).toHaveBeenCalledWith('test-id');
    });

    it('should return null if item not found', async () => {
      mockStorage.findById.mockResolvedValueOnce(null);
      
      const result = await repository.findById('non-existent');
      
      expect(result).toBeNull();
    });    it('should handle empty id', async () => {
      mockStorage.findById.mockResolvedValueOnce(null);
      
      const result = await repository.findById('');
      expect(result).toBeNull();
    });    it('should handle storage errors', async () => {
      mockStorage.findById.mockRejectedValueOnce(new Error('Storage error'));

      await expect(repository.findById('test-id')).rejects.toThrow('Failed to find item by ID');
    });
  });

  describe('findAll()', () => {
    beforeEach(async () => {
      await repository.initialize();
    });

    it('should find all items', async () => {
      const items = [
        { id: '1', name: 'item1' },
        { id: '2', name: 'item2' }
      ];
      mockStorage.findAll.mockResolvedValueOnce(items);
      
      const result = await repository.findAll();
        expect(result).toEqual(items);
      expect(mockStorage.findAll).toHaveBeenCalledWith({}, {});
    });

    it('should find items with filter', async () => {
      const filter = { name: 'test' };
      const items = [{ id: '1', name: 'test' }];
      mockStorage.findAll.mockResolvedValueOnce(items);
      
      const result = await repository.findAll(filter);
        expect(result).toEqual(items);
      expect(mockStorage.findAll).toHaveBeenCalledWith(filter, {});
    });

    it('should handle storage errors', async () => {
      mockStorage.findAll.mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(repository.findAll()).rejects.toThrow('Failed to find items in');
    });
  });

  describe('update()', () => {
    beforeEach(async () => {
      await repository.initialize();
    });

    it('should update item successfully', async () => {
      const id = 'test-id';
      const updateData = { name: 'updated name' };
      const updatedItem = { id, ...updateData };
      
      mockStorage.findById.mockResolvedValueOnce({ id, name: 'old name' });
      mockStorage.update.mockResolvedValueOnce(updatedItem);
      
      const result = await repository.update(id, updateData);
        expect(result).toEqual(updatedItem);
      expect(mockStorage.update).toHaveBeenCalledWith(id, updatedItem);
    });

    it('should throw error if item not found', async () => {
      mockStorage.findById.mockResolvedValueOnce(null);
      
      await expect(repository.update('non-existent', {})).rejects.toThrow('not found in');
    });

    it('should emit updated event', async () => {
      const id = 'test-id';
      const updateData = { name: 'updated name' };
      const eventSpy = vi.fn();
      
      repository.on('updated', eventSpy);
      mockStorage.findById.mockResolvedValueOnce({ id });
      mockStorage.update.mockResolvedValueOnce({ id, ...updateData });
      
      await repository.update(id, updateData);
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ id }));
    });
  });

  describe('delete()', () => {
    beforeEach(async () => {
      await repository.initialize();
    });

    it('should delete item successfully', async () => {
      const id = 'test-id';
      const item = { id, name: 'test item' };
      
      mockStorage.findById.mockResolvedValueOnce(item);
      mockStorage.delete.mockResolvedValueOnce(true);
      
      const result = await repository.delete(id);
      
      expect(result).toBe(true);
      expect(mockStorage.delete).toHaveBeenCalledWith(id);
    });

    it('should throw error if item not found', async () => {
      mockStorage.findById.mockResolvedValueOnce(null);
      
      await expect(repository.delete('non-existent')).rejects.toThrow('not found in');
    });

    it('should emit deleted event', async () => {
      const id = 'test-id';
      const item = { id, name: 'test item' };
      const eventSpy = vi.fn();
      
      repository.on('deleted', eventSpy);
      mockStorage.findById.mockResolvedValueOnce(item);
      mockStorage.delete.mockResolvedValueOnce(true);
      
      await repository.delete(id);
      
      expect(eventSpy).toHaveBeenCalledWith(id);
    });
  });
  describe('Error Handling', () => {
    it('should handle initialization requirement', async () => {
      repository.initialized = false;
      const initializeSpy = vi.spyOn(repository, 'ensureInitialized');
      
      await repository.findById('test-id');
      
      expect(initializeSpy).toHaveBeenCalled();
    });

    it('should handle generic storage errors', async () => {
      await repository.initialize();
      mockStorage.findById.mockRejectedValueOnce(new Error('Generic storage error'));
      
      await expect(repository.findById('test-id')).rejects.toThrow('Failed to find item by ID');
    });
  });
});






