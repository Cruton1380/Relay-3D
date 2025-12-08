// test/backend/database/dbManager.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageProvider, FileStorageProvider } from '../../src/backend/database/dbManager.mjs';

// Mock dependencies
vi.mock('fs/promises', () => {
  const mockedFsPromises = {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(true)
  };
  return {
    ...mockedFsPromises,
    default: mockedFsPromises
  };
});

vi.mock('path', () => {
  const mockedPath = {
    join: vi.fn((...args) => args.join('/')),
    dirname: vi.fn(path => path.split('/').slice(0, -1).join('/'))
  };
  return {
    ...mockedPath,
    default: mockedPath
  };
});

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
  },
  logger: {
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
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.statusCode = type === 'validation' ? 400 : 500;
    return error;
  })
}));

vi.mock('../../src/backend/config-service/index.mjs', () => ({
  default: {
    get: vi.fn(() => 'data') // Return 'data' for data.dir
  }
}));

// Import mocked modules
import fs from 'fs/promises';
import path from 'path';
import logger from '../../src/backend/utils/logging/logger.mjs';
import { createError } from '../../src/backend/utils/common/errors.mjs';

describe('Database Manager', () => {
  describe('StorageProvider', () => {
    let provider;
    
    beforeEach(() => {
      provider = new StorageProvider();
    });
    
    it('should throw Not implemented errors for all methods', async () => {
      await expect(provider.initialize()).rejects.toThrow('Not implemented');
      await expect(provider.get('id')).rejects.toThrow('Not implemented');
      await expect(provider.getAll()).rejects.toThrow('Not implemented');
      await expect(provider.create({})).rejects.toThrow('Not implemented');
      await expect(provider.update('id', {})).rejects.toThrow('Not implemented');
      await expect(provider.delete('id')).rejects.toThrow('Not implemented');
      await expect(provider.beginTransaction()).rejects.toThrow('Not implemented');
      await expect(provider.commitTransaction()).rejects.toThrow('Not implemented');
      await expect(provider.rollbackTransaction()).rejects.toThrow('Not implemented');
    });
  });
  
  describe('FileStorageProvider', () => {
    let provider;
    
    beforeEach(() => {
      vi.clearAllMocks();
      provider = new FileStorageProvider('test-collection');
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    describe('initialize', () => {
      it('should create data directory and load data', async () => {
        // Arrange
        fs.readFile.mockResolvedValueOnce(JSON.stringify({ 
          "item1": { id: "item1", name: "Test Item 1" },
          "item2": { id: "item2", name: "Test Item 2" }
        }));
        
        // Act
        await provider.initialize();
        
        // Assert
        expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('test-collection.json'), 'utf8');
        expect(provider.initialized).toBe(true);
        expect(provider.data.size).toBe(2);
        expect(provider.data.get('item1')).toEqual({ id: 'item1', name: 'Test Item 1' });
      });
      
      it('should handle missing data file by creating empty collection', async () => {
        // Arrange - Mock file not found error
        const fileNotFoundError = new Error('File not found');
        fileNotFoundError.code = 'ENOENT';
        fs.readFile.mockRejectedValueOnce(fileNotFoundError);
        
        // Act
        await provider.initialize();
        
        // Assert
        expect(provider.initialized).toBe(true);
        expect(provider.data.size).toBe(0);
      });
      
      it('should not reinitialize if already initialized', async () => {
        // Arrange
        provider.initialized = true;
        
        // Act
        await provider.initialize();
        
        // Assert
        expect(fs.readFile).not.toHaveBeenCalled();
      });
      
      it('should handle data directory creation errors', async () => {
        // Arrange
        fs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));
        
        // Act & Assert
        await expect(provider.initialize()).rejects.toThrow('Failed to create data directory');
        expect(createError).toHaveBeenCalledWith('internal', 'Failed to create data directory', expect.any(Object));
      });
      
      it('should handle data loading errors', async () => {
        // Arrange - Mock corrupted JSON
        fs.readFile.mockResolvedValueOnce('{ this is not valid json }');
        
        // Act & Assert
        await expect(provider.initialize()).rejects.toThrow('Failed to initialize storage');
      });
    });
    
    describe('CRUD operations', () => {
      beforeEach(async () => {
        // Setup initialized provider with test data
        provider.initialized = true;
        provider.data = new Map([
          ['item1', { id: 'item1', name: 'Test Item 1' }],
          ['item2', { id: 'item2', name: 'Test Item 2' }]
        ]);
      });
      
      it('should get item by id', async () => {
        const item = await provider.get('item1');
        expect(item).toEqual({ id: 'item1', name: 'Test Item 1' });
      });
      
      it('should return null for non-existent item', async () => {
        const item = await provider.get('non-existent');
        expect(item).toBeNull();
      });
      
      it('should create a new item', async () => {
        const newItem = { id: 'item3', name: 'Test Item 3' };
        
        await provider.create(newItem);
        
        expect(provider.data.get('item3')).toEqual(newItem);
        expect(fs.writeFile).toHaveBeenCalled();
      });
      
      it('should update an existing item', async () => {
        const updatedItem = { id: 'item1', name: 'Updated Item' };
        
        await provider.update('item1', updatedItem);
        
        expect(provider.data.get('item1')).toEqual(updatedItem);
        expect(fs.writeFile).toHaveBeenCalled();
      });
      
      it('should delete an item', async () => {
        await provider.delete('item1');
        
        expect(provider.data.has('item1')).toBe(false);
        expect(fs.writeFile).toHaveBeenCalled();
      });
      
      it('should get all items', async () => {
        const allItems = await provider.getAll();
        
        expect(allItems).toHaveLength(2);
        expect(allItems).toEqual(expect.arrayContaining([
          { id: 'item1', name: 'Test Item 1' },
          { id: 'item2', name: 'Test Item 2' }
        ]));
      });
    });
  });
});






