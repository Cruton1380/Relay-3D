/**
 * @fileoverview Tests for Dictionary API Controller
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../../utils/testHelpers.mjs';

// Import the router and supporting modules
import dictionaryApiRouter from '../../../src/backend/api/dictionaryApiController.mjs';
import dictionaryTextParser from '../../../src/backend/dictionary/dictionaryTextParser.mjs';
import dictionarySearchService from '../../../src/backend/dictionary/dictionarySearchService.mjs';
import categorySystem from '../../../src/backend/dictionary/categorySystem.mjs';
import topicRowVoteManager from '../../../src/backend/channel-service/topicRowVoteManager.mjs';

// Mock dependencies
vi.mock('../../../src/backend/middleware/auth.mjs', () => ({
  default: {
    requireAuth: vi.fn((req, res, next) => {
      req.user = { id: 'test-user-id', role: 'user' };
      next();
    }),
    authenticate: vi.fn((req, res, next) => {
      req.user = { id: 'test-user-id', role: 'user' };
      next();
    }),
    optionalAuth: vi.fn((req, res, next) => next()),
    requireRole: vi.fn(() => (req, res, next) => next())
  }
}));

vi.mock('../../../src/backend/dictionary/dictionaryTextParser.mjs', () => ({
  default: {
    parseText: vi.fn(),
    getTermInformation: vi.fn(),
    getTerm: vi.fn(),
    setUserOverride: vi.fn(),
    initialized: true
  }
}));

vi.mock('../../../src/backend/dictionary/dictionarySearchService.mjs', () => ({
  default: {
    searchDictionary: vi.fn(),
    getTerm: vi.fn(),
    getRelatedTerms: vi.fn(),
    invalidateCache: vi.fn(),
    initialized: true
  }
}));

vi.mock('../../../src/backend/dictionary/categorySystem.mjs', () => ({
  default: {
    getAllCategories: vi.fn(),
    voteForCategory: vi.fn(),
    suggestCategoriesForTerm: vi.fn(),
    getCategoriesForTopicRow: vi.fn(),
    initialized: true
  }
}));

vi.mock('../../../src/backend/channel-service/topicRowVoteManager.mjs', () => ({
  default: {
    getTopicRow: vi.fn(),
    addChannelToTopicRow: vi.fn(),
    initialized: true
  }
}));

describe('Dictionary API Controller', () => {
  let mockReq;
  let mockRes;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock request and response
    mockReq = createMockRequest({
      user: { id: 'user1' },
      params: {},
      query: {},
      body: {}
    });
    
    mockRes = createMockResponse();
    
    // Setup default mocks
    dictionaryTextParser.parseText.mockResolvedValue({
      entities: [
        { term: 'blockchain', topicRowName: 'blockchain-topic', categories: ['technology', 'finance'] }
      ],
      stats: { totalWords: 10, linkedTerms: 1, density: 0.1 }
    });
    
    dictionarySearchService.searchDictionary.mockResolvedValue({
      terms: [
        { term: 'blockchain', topicRowId: 'blockchain-topic' },
        { term: 'cryptocurrency', topicRowId: 'crypto-topic' }
      ],
      categories: [
        { id: 'technology', name: 'Technology', count: 2 },
        { id: 'finance', name: 'Finance', count: 2 }
      ]
    });
    
    dictionarySearchService.getTerm.mockResolvedValue({
      term: 'blockchain',
      topicRowId: 'blockchain-topic',
      categories: [
        { id: 'technology', name: 'Technology', voteCount: 10 },
        { id: 'finance', name: 'Finance', voteCount: 5 }
      ],
      topChannelByCategory: {
        technology: { id: 'blockchain-tech-channel', name: 'Blockchain Tech' },
        finance: { id: 'blockchain-finance-channel', name: 'Blockchain Finance' }
      }
    });
    
    categorySystem.getAllCategories.mockResolvedValue([
      { id: 'technology', name: 'Technology' },
      { id: 'finance', name: 'Finance' },
      { id: 'science', name: 'Science' }
    ]);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('POST /api/dictionary/parse', () => {
    it('should parse text and identify dictionary terms', async () => {
      mockReq.body = {
        text: 'Blockchain technology is revolutionizing finance.',
        options: { maxDensity: 0.3 }
      };
      
      // Find the parse route handler
      const parseHandler = findRouteHandler(dictionaryApiRouter.stack, 'post', '/parse');
      expect(parseHandler).toBeDefined();
      
      // Call the handler directly
      await parseHandler(mockReq, mockRes);
      
      expect(dictionaryTextParser.parseText).toHaveBeenCalledWith(
        'Blockchain technology is revolutionizing finance.',
        'user1',
        { maxDensity: 0.3 }
      );
      
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(400);
    });
    
    it('should validate text input', async () => {
      mockReq.body = {
        // Missing text field
        options: { maxDensity: 0.3 }
      };
      
      const parseHandler = findRouteHandler(dictionaryApiRouter.stack, 'post', '/parse');
      await parseHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
  
  describe('GET /api/dictionary/search', () => {
    it('should search for dictionary terms', async () => {
      mockReq.query = {
        q: 'block',
        categories: 'technology,finance'
      };
      
      const searchHandler = findRouteHandler(dictionaryApiRouter.stack, 'get', '/search');
      expect(searchHandler).toBeDefined();
      
      await searchHandler(mockReq, mockRes);
      
      expect(dictionarySearchService.searchDictionary).toHaveBeenCalledWith(
        'block',
        ['technology', 'finance'],
        expect.any(Object)
      );
      
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/dictionary/term/:term', () => {
    it('should get details for a specific term', async () => {
      mockReq.params = {
        term: 'blockchain'
      };
      mockReq.query = {
        category: 'technology'
      };
      
      const termHandler = findRouteHandler(dictionaryApiRouter.stack, 'get', '/term/:term');
      expect(termHandler).toBeDefined();
      
      await termHandler(mockReq, mockRes);
      
      expect(dictionarySearchService.getTerm).toHaveBeenCalledWith(
        'blockchain',
        'technology'
      );
      
      expect(mockRes.json).toHaveBeenCalled();
    });
    
    it('should return 404 for unknown terms', async () => {
      mockReq.params = {
        term: 'nonexistent-term'
      };
      
      dictionarySearchService.getTerm.mockResolvedValue(null);
      
      const termHandler = findRouteHandler(dictionaryApiRouter.stack, 'get', '/term/:term');
      await termHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('GET /api/dictionary/related/:term', () => {
    it('should get related terms', async () => {
      mockReq.params = {
        term: 'blockchain'
      };
      
      dictionarySearchService.getRelatedTerms.mockResolvedValue([
        { term: 'cryptocurrency', topicRowId: 'crypto-topic' },
        { term: 'bitcoin', topicRowId: 'bitcoin-topic' }
      ]);
      
      const relatedHandler = findRouteHandler(dictionaryApiRouter.stack, 'get', '/related/:term');
      expect(relatedHandler).toBeDefined();
      
      await relatedHandler(mockReq, mockRes);
      
      expect(dictionarySearchService.getRelatedTerms).toHaveBeenCalledWith('blockchain');
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/dictionary/override', () => {
    it('should set user term override', async () => {
      mockReq.body = {
        term: 'blockchain',
        preferredTopicRow: 'blockchain-finance-topic'
      };
      
      const overrideHandler = findRouteHandler(dictionaryApiRouter.stack, 'post', '/override');
      expect(overrideHandler).toBeDefined();
      
      await overrideHandler(mockReq, mockRes);
      
      expect(dictionaryTextParser.setUserOverride).toHaveBeenCalledWith(
        'user1',
        'blockchain',
        'blockchain-finance-topic'
      );
      
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/dictionary/category', () => {
    it('should record vote for category', async () => {
      mockReq.body = {
        topicRowName: 'blockchain',
        categoryId: 'finance',
        voteType: 'upvote'
      };
      
      const categoryHandler = findRouteHandler(dictionaryApiRouter.stack, 'post', '/category');
      expect(categoryHandler).toBeDefined();
      
      await categoryHandler(mockReq, mockRes);
      
      expect(categorySystem.voteForCategory).toHaveBeenCalledWith(
        'blockchain',
        'user1',
        'finance',
        'upvote'
      );
      
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});

/**
 * Helper function to find a route handler in the router stack
 * @param {Array} stack - Router stack
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @returns {Function} - Route handler function
 */
function findRouteHandler(stack, method, path) {
  for (const layer of stack) {
    if (layer.route) {
      const match = layer.route.path === path && 
                    layer.route.methods[method.toLowerCase()];
      
      if (match) {
        // Return the last handler in the stack (after middleware)
        return layer.route.stack[layer.route.stack.length - 1].handle;
      }
    }
  }
  return null;
}
