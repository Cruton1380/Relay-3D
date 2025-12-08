/**
 * @fileoverview Tests for Category System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => {
  const mock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })
  };
  return { default: mock, appLogger: mock };
});

vi.mock('../../../src/event-bus/index.mjs', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn()
  }
}));

import categorySystem from '../../../src/backend/dictionary/categorySystem.mjs';
import { eventBus } from '../../../src/event-bus/index.mjs';

describe('Category System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset category system state for each test
    categorySystem.categories = new Map();
    categorySystem.topicRowCategories = new Map();
    categorySystem.userCategoryVotes = new Map();
    categorySystem.categoryHierarchy = new Map();
    categorySystem.initialized = true;
    
    // Setup test data
    categorySystem.categories.set('general', {
      id: 'general',
      name: 'General',
      description: 'General purpose category'
    });
    
    categorySystem.categories.set('technology', {
      id: 'technology',
      name: 'Technology',
      description: 'Technology related terms'
    });
    
    categorySystem.categories.set('science', {
      id: 'science',
      name: 'Science',
      description: 'Scientific terms and concepts'
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('createCategory', () => {
    it('should create a new category', async () => {
      const result = await categorySystem.createCategory(
        'politics',
        'Political terms and concepts',
        null, // No parent category
        { region: 'global' }
      );
      
      expect(result).toBeDefined();
      expect(result.name).toBe('politics');
      expect(result.description).toBe('Political terms and concepts');
      expect(categorySystem.categories.get(result.id)).toBeDefined();
    });
    
    it('should create a category with parent-child relationship', async () => {
      const result = await categorySystem.createCategory(
        'artificial-intelligence',
        'AI terms and concepts',
        'technology', // Parent category
        { }
      );
      
      expect(result).toBeDefined();
      expect(result.parentCategoryId).toBe('technology');
      
      // Check hierarchy is updated
      const children = categorySystem.categoryHierarchy.get('technology');
      expect(children).toBeDefined();
      expect(children.has(result.id)).toBe(true);
    });
  });
  
  describe('getCategoriesForTopicRow', () => {
    it('should return categories with vote counts for a topic row', async () => {
      // Setup topic row categories
      const topicRowName = 'artificial-intelligence';
      const categoryVotes = new Map();
      categoryVotes.set('technology', 10);
      categoryVotes.set('science', 5);
      categorySystem.topicRowCategories.set(topicRowName, categoryVotes);
      
      const result = await categorySystem.getCategoriesForTopicRow(topicRowName);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('technology');
      expect(result[0].voteCount).toBe(10);
      expect(result[1].id).toBe('science');
      expect(result[1].voteCount).toBe(5);
    });
    
    it('should return empty array for unknown topic row', async () => {
      const result = await categorySystem.getCategoriesForTopicRow('unknown-topic');
      expect(result).toHaveLength(0);
    });
  });
  
  describe('voteForCategory', () => {
    it('should record user vote for a category', async () => {
      const topicRowName = 'blockchain';
      const userId = 'user1';
      const categoryId = 'technology';
      
      await categorySystem.voteForCategory(topicRowName, userId, categoryId);
      
      // Should have recorded user vote
      const userVotes = categorySystem.userCategoryVotes.get(topicRowName);
      expect(userVotes).toBeDefined();
      
      const userCategoryVotes = userVotes.get(userId);
      expect(userCategoryVotes).toBeDefined();
      expect(userCategoryVotes.get(categoryId)).toBe('upvote');
      
      // Should have updated category vote counts
      const categoryVotes = categorySystem.topicRowCategories.get(topicRowName);
      expect(categoryVotes).toBeDefined();
      expect(categoryVotes.get(categoryId)).toBe(1);
    });
    
    it('should allow users to change their vote', async () => {
      const topicRowName = 'virtual-reality';
      const userId = 'user1';
      
      // First vote for technology
      await categorySystem.voteForCategory(topicRowName, userId, 'technology');
      
      // Now change vote to science
      await categorySystem.voteForCategory(topicRowName, userId, 'science');
      
      // Check user vote was updated
      const userVotes = categorySystem.userCategoryVotes.get(topicRowName);
      const userCategoryVotes = userVotes.get(userId);
      
      expect(userCategoryVotes.get('technology')).toBeUndefined();
      expect(userCategoryVotes.get('science')).toBe('upvote');
      
      // Check vote counts updated
      const categoryVotes = categorySystem.topicRowCategories.get(topicRowName);
      expect(categoryVotes.get('technology')).toBe(0);
      expect(categoryVotes.get('science')).toBe(1);
    });
  });
  
  describe('suggestCategoriesForTerm', () => {
    it('should suggest relevant categories based on term', async () => {
      // We're mocking this functionality, but testing the interface
      const term = 'machine learning';
      const result = await categorySystem.suggestCategoriesForTerm(term);
      
      // It should at least return something
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('handleTopicRowCreated', () => {
    it('should suggest initial categories for new topic row', async () => {
      const suggestSpy = vi.spyOn(categorySystem, 'suggestCategoriesForTerm')
                           .mockResolvedValue(['technology', 'science']);
      
      await categorySystem.handleTopicRowCreated({
        topicRowName: 'neural-network',
        creatorUserId: 'user1'
      });
      
      expect(suggestSpy).toHaveBeenCalledWith('neural-network');
      
      // Should have initialized category votes
      const categoryVotes = categorySystem.topicRowCategories.get('neural-network');
      expect(categoryVotes).toBeDefined();
      expect(categoryVotes.get('technology')).toBe(1); // Initial vote
      expect(categoryVotes.get('science')).toBe(1); // Initial vote
    });
  });
});
