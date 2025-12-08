/**
 * @fileoverview Tests for Dictionary Search Service
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dictionarySearchService from '../../../src/backend/dictionary/dictionarySearchService.mjs';
import dictionaryTextParser from '../../../src/backend/dictionary/dictionaryTextParser.mjs';
import categorySystem from '../../../src/backend/dictionary/categorySystem.mjs';
import topicRowVoteManager from '../../../src/backend/channel-service/topicRowVoteManager.mjs';
import { eventBus } from '../../../src/backend/event-bus/index.mjs';

// Mock dependencies
vi.mock('../../../src/backend/dictionary/dictionaryTextParser.mjs', () => ({
  default: {
    getWordPhraseMap: vi.fn().mockReturnValue(new Map([
      ['blockchain', 'blockchain-topic'],
      ['cryptocurrency', 'cryptocurrency-topic'],
      ['bitcoin', 'bitcoin-topic'],
      ['ethereum', 'ethereum-topic'],
      ['artificial intelligence', 'ai-topic'],
      ['machine learning', 'ml-topic']
    ])),
    getSimilarTerms: vi.fn().mockImplementation((term) => {
      if (term === 'blockchain') {
        return ['cryptocurrency', 'bitcoin', 'ethereum'];
      }
      return [];
    }),
    getTermInformation: vi.fn().mockImplementation(async (term) => {
      const terms = {
        'blockchain': {
          term: 'blockchain',
          displayTerm: 'Blockchain',
          found: true,
          topicRowName: 'blockchain-topic',
          isPhrase: false,
          usageCount: 50,
          categories: [
            { category: { id: 'technology', name: 'Technology' }, votes: 10 },
            { category: { id: 'finance', name: 'Finance' }, votes: 5 }
          ],
          topChannels: []
        },
        'cryptocurrency': {
          term: 'cryptocurrency',
          displayTerm: 'Cryptocurrency',
          found: true,
          topicRowName: 'cryptocurrency-topic',
          isPhrase: false,
          usageCount: 40
        }
      };
      return terms[term.toLowerCase()] || {
        term: term.toLowerCase(),
        displayTerm: term,
        found: false,
        isPhrase: term.includes(' '),
        usageCount: 0
      };
    }),
    getTerm: vi.fn().mockImplementation(async (term) => {
      const terms = {
        'blockchain': {
          term: 'blockchain',
          displayTerm: 'Blockchain',
          topicRowName: 'blockchain-topic',
          isPhrase: false,
          usageCount: 50,
          categories: [
            { id: 'technology', name: 'Technology' },
            { id: 'finance', name: 'Finance' }
          ],
          definition: 'A distributed ledger technology'
        }
      };
      return terms[term.toLowerCase()] || null;
    }),
    getUserPreferences: vi.fn().mockReturnValue({ preferences: [] }),
    initialized: true
  }
}));

vi.mock('../../../src/backend/dictionary/categorySystem.mjs', () => ({
  default: {
    getCategoriesForTopicRow: vi.fn().mockImplementation((topicRowName) => {
      if (topicRowName === 'blockchain') {
        return {
          categories: [
            { category: { id: 'technology', name: 'Technology' }, votes: 10, percentage: 60 },
            { category: { id: 'finance', name: 'Finance' }, votes: 5, percentage: 40 }
          ]
        };
      }
      if (topicRowName === 'cryptocurrency') {
        return {
          categories: [
            { category: { id: 'finance', name: 'Finance' }, votes: 15, percentage: 70 },
            { category: { id: 'technology', name: 'Technology' }, votes: 8, percentage: 30 }
          ]
        };
      }
      return { categories: [] };
    }),
    getTopicRowCategories: vi.fn().mockImplementation((topicRowName) => {
      if (topicRowName === 'blockchain') {
        return {
          categories: [
            { category: { id: 'technology', name: 'Technology' }, votes: 10, percentage: 60 },
            { category: { id: 'finance', name: 'Finance' }, votes: 5, percentage: 40 }
          ]
        };
      }
      if (topicRowName === 'cryptocurrency') {
        return {
          categories: [
            { category: { id: 'finance', name: 'Finance' }, votes: 15, percentage: 70 },
            { category: { id: 'technology', name: 'Technology' }, votes: 8, percentage: 30 }
          ]
        };
      }
      return { categories: [] };
    }),
    getAllCategories: vi.fn().mockResolvedValue([
      { id: 'technology', name: 'Technology' },
      { id: 'finance', name: 'Finance' },
      { id: 'science', name: 'Science' }
    ]),
    getCategory: vi.fn().mockImplementation((id) => {
      const categories = {
        'technology': { id: 'technology', name: 'Technology' },
        'finance': { id: 'finance', name: 'Finance' },
        'science': { id: 'science', name: 'Science' }
      };
      return categories[id] || null;
    }),
    initialized: true
  }
}));

vi.mock('../../../src/backend/channel-service/topicRowVoteManager.mjs', () => ({
  default: {
    getTopicRow: vi.fn(),
    getTopChannelForTopicRow: vi.fn(),
    getAllTopicRows: vi.fn().mockResolvedValue([
      { id: 'blockchain-topic', name: 'blockchain', displayName: 'Blockchain', totalVotes: 100, lastActivity: Date.now(), metadata: { type: 'dictionary' } },
      { id: 'cryptocurrency-topic', name: 'cryptocurrency', displayName: 'Cryptocurrency', totalVotes: 80, lastActivity: Date.now(), metadata: { type: 'dictionary' } },
      { id: 'bitcoin-topic', name: 'bitcoin', displayName: 'Bitcoin', totalVotes: 75, lastActivity: Date.now(), metadata: { type: 'dictionary' } },
      { id: 'ethereum-topic', name: 'ethereum', displayName: 'Ethereum', totalVotes: 70, lastActivity: Date.now(), metadata: { type: 'dictionary' } },
      { id: 'ai-topic', name: 'artificial intelligence', displayName: 'Artificial Intelligence', totalVotes: 90, lastActivity: Date.now(), metadata: { type: 'dictionary', isPhrase: true } },
      { id: 'ml-topic', name: 'machine learning', displayName: 'Machine Learning', totalVotes: 85, lastActivity: Date.now(), metadata: { type: 'dictionary', isPhrase: true } }
    ]),
    getTopicRowRankings: vi.fn().mockResolvedValue([
      { channelId: 'channel-1', displayName: 'Channel 1', score: 100 },
      { channelId: 'channel-2', displayName: 'Channel 2', score: 90 }
    ]),
    initialized: true
  }
}));

vi.mock('../../../src/backend/event-bus/index.mjs', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn()
  }
}));

// Mock for NewsfeedVoteEngine
class MockNewsfeedVoteEngine {
  constructor() {
    this.initialized = false;
    this.posts = new Map();
    this.votes = new Map();
    this.userVoteHistory = new Map();
  }

  async initialize() {
    this.initialized = true;
    return Promise.resolve();
  }

  createPost() {
    return Promise.resolve({ id: 'mock-post-id', success: true });
  }

  getPost() {
    return Promise.resolve({ id: 'mock-post-id', content: 'Mock post content' });
  }

  getAllPosts() {
    return Promise.resolve([{ id: 'mock-post-id', content: 'Mock post content' }]);
  }

  getVotes() {
    return Promise.resolve(new Map());
  }
}

// Mock for TopicRowVoteManager
class MockTopicRowVoteManager {
  constructor() {
    this.initialized = false;
    this.topicRows = new Map();
    this.voteDecayScheduler = null;
  }

  async initialize() {
    this.initialized = true;
    return Promise.resolve();
  }

  getTopicRow(id) {
    return Promise.resolve({ 
      id, 
      name: id, 
      displayName: id.charAt(0).toUpperCase() + id.slice(1),
      channels: []
    });
  }

  getAllTopicRows() {
    return Promise.resolve([]);
  }
  
  getTopChannelForTopicRow() {
    return Promise.resolve({ id: 'mock-channel-id', name: 'Mock Channel' });
  }

  getTopicRowRankings() {
    return Promise.resolve([]);
  }
}

// Mock for NewsfeedRenderService
class MockNewsfeedRenderService {
  constructor() {
    this.initialized = false;
    this.renderCache = new Map();
  }

  initialize() {
    this.initialized = true;
    return Promise.resolve();
  }

  renderPost() {
    return { rendered: true, content: { formatted: 'Rendered content' } };
  }
}

describe('Dictionary Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset service state for each test
    dictionarySearchService.searchCache = new Map();
    dictionarySearchService.initialized = true;
    
    // Setup default mocks
    dictionaryTextParser.getWordPhraseMap.mockReturnValue(new Map([
      ['blockchain', 'blockchain-topic'],
      ['cryptocurrency', 'cryptocurrency-topic'],
      ['bitcoin', 'bitcoin-topic'],
      ['ethereum', 'ethereum-topic'],
      ['artificial intelligence', 'ai-topic'],
      ['machine learning', 'ml-topic']
    ]));
    
    categorySystem.getAllCategories.mockResolvedValue([
      { id: 'technology', name: 'Technology' },
      { id: 'finance', name: 'Finance' },
      { id: 'science', name: 'Science' }
    ]);
    
    topicRowVoteManager.getTopicRow.mockImplementation(async (id) => {
      const topics = {
        'blockchain-topic': { id: 'blockchain-topic', name: 'blockchain', channels: ['blockchain-channel-1'] },
        'cryptocurrency-topic': { id: 'cryptocurrency-topic', name: 'cryptocurrency', channels: ['crypto-channel-1'] },
        'bitcoin-topic': { id: 'bitcoin-topic', name: 'bitcoin', channels: ['bitcoin-channel-1'] },
        'ethereum-topic': { id: 'ethereum-topic', name: 'ethereum', channels: ['eth-channel-1'] },
        'ai-topic': { id: 'ai-topic', name: 'artificial intelligence', channels: ['ai-channel-1'] },
        'ml-topic': { id: 'ml-topic', name: 'machine learning', channels: ['ml-channel-1'] }
      };
      
      return topics[id] || null;
    });
    
    categorySystem.getCategoriesForTopicRow.mockImplementation(async (topicRowName) => {
      if (topicRowName === 'blockchain') {
        return [
          { id: 'technology', name: 'Technology', voteCount: 10 },
          { id: 'finance', name: 'Finance', voteCount: 5 }
        ];
      }
      if (topicRowName === 'artificial intelligence') {
        return [
          { id: 'technology', name: 'Technology', voteCount: 15 },
          { id: 'science', name: 'Science', voteCount: 8 }
        ];
      }
      return [];
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
    describe('searchDictionary', () => {
    it('should find terms matching the search query', async () => {
      const result = await dictionarySearchService.searchDictionary('blockchain', [], {});
      
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('blockchain');
      expect(result.results[0].topicRowName).toBe('blockchain');
    });
      it('should find partial matches', async () => {
      // Implement additional mock for this test
      topicRowVoteManager.getAllTopicRows.mockResolvedValueOnce([
        { id: 'cryptocurrency-topic', name: 'cryptocurrency', displayName: 'Cryptocurrency', totalVotes: 80, lastActivity: Date.now(), metadata: { type: 'dictionary' } }
      ]);
      
      const result = await dictionarySearchService.searchDictionary('crypto', [], {});
      
      expect(result).toBeDefined();
      expect(result.query).toBe('crypto');
    });    it('should filter by category when specified', async () => {
      // Setup mock implementation for this specific test
      categorySystem.getTopicRowCategories.mockImplementation((name) => {
        return {
          categories: [
            { category: { id: 'finance', name: 'Finance' }, votes: 5, percentage: 40 }
          ]
        };
      });
      
      topicRowVoteManager.getAllTopicRows.mockResolvedValueOnce([
        { id: 'blockchain-topic', name: 'blockchain', displayName: 'Blockchain', totalVotes: 100, metadata: { type: 'dictionary' } }
      ]);
      
      const result = await dictionarySearchService.searchDictionary('blockchain', ['finance'], {});
      
      // With our mock setup, should return a result with blockchain
      expect(result).toBeDefined();
      expect(result.query).toBe('blockchain');
    });
    
    it('should use cache for repeated searches', async () => {
      // First search should query data
      await dictionarySearchService.searchDictionary('ai', [], {});
      
      // Reset mocks to verify they aren't called again
      dictionaryTextParser.getWordPhraseMap.mockClear();
      
      // Second search should use cache
      await dictionarySearchService.searchDictionary('ai', [], {});
      
      expect(dictionaryTextParser.getWordPhraseMap).not.toHaveBeenCalled();
    });
  });
  describe('getTerm', () => {
    it('should return detailed information about a specific term', async () => {
      // Setup mock return values
      dictionaryTextParser.getTerm.mockResolvedValueOnce({
        term: 'blockchain',
        displayTerm: 'Blockchain',
        topicRowName: 'blockchain-topic',
        isPhrase: false,
        usageCount: 50,
        categories: [
          { id: 'technology', name: 'Technology' },
          { id: 'finance', name: 'Finance' }
        ],
        definition: 'A distributed ledger technology'
      });

      topicRowVoteManager.getTopChannelForTopicRow.mockResolvedValueOnce({
        id: 'blockchain-channel-1',
        name: 'Blockchain Technology',
        description: 'Distributed ledger technology'
      });
      
      const result = await dictionarySearchService.getTerm('blockchain', 'technology');
      
      expect(result).toBeDefined();
      expect(result.term).toBe('blockchain');
      expect(result.displayTerm).toBe('Blockchain');
      expect(result.topicRowName).toBe('blockchain-topic');
    });
    
    it('should return null for unknown terms', async () => {
      dictionaryTextParser.getTerm.mockResolvedValueOnce(null);
      const result = await dictionarySearchService.getTerm('nonexistent-term');
      expect(result).toBeNull();
    });
  });
  describe('getRelatedTerms', () => {
    it('should return semantically related terms', async () => {
      // Setup mocks for this test
      dictionaryTextParser.getSimilarTerms.mockImplementation((term) => {
        if (term === 'blockchain') {
          return ['cryptocurrency', 'bitcoin', 'ethereum'];
        }
        return [];
      });
      
      dictionaryTextParser.getTermInformation.mockResolvedValue({
        term: 'blockchain',
        displayTerm: 'Blockchain',
        found: true,
        topicRowName: 'blockchain-topic',
        isPhrase: false,
        usageCount: 50
      });
      
      const result = await dictionarySearchService.getRelatedTerms('blockchain');
      
      expect(result).toBeDefined();
      expect(result.term).toBe('blockchain');
      expect(result.found).toBe(true);
    });
  });
    describe('invalidateCache', () => {
    it('should clear specific terms from cache', async () => {
      // Clear the cache first
      dictionarySearchService.searchCache.clear();
      
      // Manually add an entry to the cache
      const mockCacheKey = dictionarySearchService.generateCacheKey('blockchain', [], { limit: 20, offset: 0 });
      dictionarySearchService.searchCache.set(mockCacheKey, {
        results: { query: 'blockchain', results: [] },
        timestamp: Date.now()
      });
      
      // Verify cache is populated
      expect(dictionarySearchService.searchCache.size).toBe(1);
      
      // Invalidate cache
      dictionarySearchService.invalidateRelatedSearches({ term: 'blockchain' });
      
      // Verify cache is cleared
      expect(dictionarySearchService.searchCache.size).toBe(0);
    });
  });
});
