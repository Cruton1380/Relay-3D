/**
 * @fileoverview Tests for Dictionary Indexer
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dictionaryIndexer from '../../../src/backend/dictionary/dictionaryIndexer.mjs';
import dictionaryTextParser from '../../../src/backend/dictionary/dictionaryTextParser.mjs';
import topicRowVoteManager from '../../../src/backend/channel-service/topicRowVoteManager.mjs';
import categorySystem from '../../../src/backend/dictionary/categorySystem.mjs';

// Mock dependencies
vi.mock('../../../src/backend/dictionary/dictionaryTextParser.mjs', () => ({
  default: {
    parseText: vi.fn(),
    initialize: vi.fn().mockResolvedValue(true),
    refresh: vi.fn(),
    initialized: true
  }
}));

vi.mock('../../../src/backend/channel-service/topicRowVoteManager.mjs', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(true),
    getAllTopicRows: vi.fn(),
    initialized: true
  }
}));

vi.mock('../../../src/backend/dictionary/categorySystem.mjs', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(true),
    initialized: true
  }
}));

// Create mocks for database-related functions
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('Dictionary Indexer', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset indexer state for each test
    dictionaryIndexer.initialized = true;
    dictionaryIndexer.isRunning = false;
    dictionaryIndexer.stats = {
      processedMessages: 0,
      processedPosts: 0,
      detectedTerms: 0,
      newTopicRows: 0,
      errors: 0
    };
    
    // Setup mock data
    topicRowVoteManager.getAllTopicRows.mockResolvedValue([
      { id: 'topic1', name: 'blockchain', channels: ['channel1'] },
      { id: 'topic2', name: 'artificial intelligence', channels: ['channel2'] }
    ]);
    
    // Mock database functions
    // Add mock implementation for any external database functions used by the indexer
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('initialize', () => {
    it('should initialize dependencies if not already initialized', async () => {
      // Reset initialized flags
      dictionaryIndexer.initialized = false;
      dictionaryTextParser.initialized = false;
      categorySystem.initialized = false;
      
      await dictionaryIndexer.initialize();
      
      expect(dictionaryTextParser.initialize).toHaveBeenCalled();
      expect(categorySystem.initialize).toHaveBeenCalled();
      expect(dictionaryIndexer.initialized).toBe(true);
    });
    
    it('should not initialize dependencies if already initialized', async () => {
      // Set initialized flags
      dictionaryIndexer.initialized = false;
      dictionaryTextParser.initialized = true;
      categorySystem.initialized = true;
      
      await dictionaryIndexer.initialize();
      
      expect(dictionaryTextParser.initialize).not.toHaveBeenCalled();
      expect(categorySystem.initialize).not.toHaveBeenCalled();
      expect(dictionaryIndexer.initialized).toBe(true);
    });
  });
  
  describe('runFullIndex', () => {
    it('should process all messages and posts', async () => {
      // Mock the internal methods that would be called during indexing
      vi.spyOn(dictionaryIndexer, 'indexMessages').mockResolvedValue({
        processedCount: 1000,
        detectedTerms: 250,
        newTopicRows: 15,
        errors: 2
      });
      
      vi.spyOn(dictionaryIndexer, 'indexPosts').mockResolvedValue({
        processedCount: 500,
        detectedTerms: 120,
        newTopicRows: 8,
        errors: 1
      });
      
      await dictionaryIndexer.runFullIndex();
      
      expect(dictionaryIndexer.indexMessages).toHaveBeenCalled();
      expect(dictionaryIndexer.indexPosts).toHaveBeenCalled();
      
      // Check that stats were updated correctly
      expect(dictionaryIndexer.stats.processedMessages).toBe(1000);
      expect(dictionaryIndexer.stats.processedPosts).toBe(500);
      expect(dictionaryIndexer.stats.detectedTerms).toBe(370); // 250 + 120
      expect(dictionaryIndexer.stats.newTopicRows).toBe(23); // 15 + 8
      expect(dictionaryIndexer.stats.errors).toBe(3); // 2 + 1
    });
    
    it('should prevent concurrent indexing operations', async () => {
      // Set the indexer as already running
      dictionaryIndexer.isRunning = true;
      
      // Mock internal methods to verify they are not called
      const indexMessagesSpy = vi.spyOn(dictionaryIndexer, 'indexMessages');
      
      // Try to run indexing while it's already running
      await expect(dictionaryIndexer.runFullIndex()).rejects.toThrow('Indexing is already running');
      
      // Verify that the internal methods were not called
      expect(indexMessagesSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('indexContent', () => {
    it('should parse text content and detect terms', async () => {
      dictionaryTextParser.parseText.mockResolvedValue({
        entities: [
          { term: 'blockchain', topicRowName: 'blockchain-topic' },
          { term: 'cryptocurrency', topicRowName: 'crypto-topic' }
        ],
        stats: { totalWords: 100, linkedTerms: 2 }
      });
      
      const result = await dictionaryIndexer.indexContent('This is a text about blockchain and cryptocurrency.');
      
      expect(dictionaryTextParser.parseText).toHaveBeenCalledWith(
        'This is a text about blockchain and cryptocurrency.',
        null,
        expect.any(Object)
      );
      
      expect(result.detectedTerms).toBe(2);
    });
  });
  
  describe('refreshDictionaryData', () => {
    it('should refresh the parser data', async () => {
      await dictionaryIndexer.refreshDictionaryData();
      
      expect(dictionaryTextParser.refresh).toHaveBeenCalled();
    });
  });
  
  describe('getIndexingStats', () => {
    it('should return current indexing statistics', () => {
      dictionaryIndexer.stats = {
        processedMessages: 1500,
        processedPosts: 800,
        detectedTerms: 450,
        newTopicRows: 30,
        errors: 5
      };
      
      const stats = dictionaryIndexer.getIndexingStats();
      
      expect(stats).toEqual({
        processedMessages: 1500,
        processedPosts: 800,
        detectedTerms: 450,
        newTopicRows: 30,
        errors: 5,
        isRunning: false
      });
    });
  });
});
