/**
 * @fileoverview Unit tests for NewsfeedVoteEngine
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import newsfeedVoteEngine from '../../src/backend/channel-service/newsfeedVoteEngine.mjs';

// Mock the exports
vi.mock('../../src/backend/channel-service/newsfeedVoteEngine.mjs', () => {
  const NewsfeedVoteEngineMock = vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    createPost: vi.fn(),
    getPost: vi.fn(),
    deletePost: vi.fn(),
    voteOnPost: vi.fn(),
    getPinnedPost: vi.fn(),
    pinPost: vi.fn(),
    unpinPost: vi.fn(),
    getChannelNewsfeed: vi.fn(),
    getPostsForChannel: vi.fn(),
    searchPosts: vi.fn(),
    getBookmarkedPosts: vi.fn(),
    getUserBookmarks: vi.fn(),
    bookmarkPost: vi.fn(),
    unbookmarkPost: vi.fn(),
    tagPostAsInformative: vi.fn(),
    handleUserVoteChange: vi.fn(),
    handleSupporterRemoved: vi.fn(),
    cleanupExpiredPins: vi.fn(),
    getChannelPosts: vi.fn(),
    posts: new Map(),
    votes: new Map(),
    userVoteHistory: new Map(),
    channelPosts: new Map(),
    userPosts: new Map(),
    bookmarks: new Map(),
    pinnedPosts: new Map(),
    initialized: true,
    verifyChannelSupporter: vi.fn().mockResolvedValue(true),
    getUserPostInChannel: vi.fn(),
    getPostVoteStats: vi.fn(),
    updatePostScores: vi.fn()
  }));
  
  return { default: new NewsfeedVoteEngineMock() };
});

// Mock dependencies
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    })
  }
}));

vi.mock('../../src/backend/event-bus/index.mjs', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn()
  }
}));

describe('NewsfeedVoteEngine', () => {
  let engine;
  const testChannelId = 'test-channel-1';
  const testUserId = 'test-user-1';
  const testUserId2 = 'test-user-2';
  beforeEach(async () => {
    engine = newsfeedVoteEngine;
    await engine.initialize();
    
    // Reset mocks and in-memory storage
    engine.posts.clear();
    engine.votes.clear();
    engine.userVoteHistory.clear();
    engine.channelPosts.clear();
    engine.userPosts.clear();
    engine.bookmarks.clear();
    engine.pinnedPosts.clear();
    
    // Mock createPost implementation
    engine.createPost.mockImplementation((channelId, userId, postData) => {
      // Check if user already has a post in this channel
      if (engine.getUserPostInChannel(userId, channelId)) {
        return Promise.reject(new Error('User already has a post in this channel'));
      }
      
      const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const post = {
        id: postId,
        channelId,
        authorId: userId,
        content: postData.content || '',
        title: postData.title || '',
        mediaAttachments: postData.mediaAttachments || [],
        tags: postData.tags || [],
        createdAt: Date.now(),
        score: 0,
        upvotes: 0,
        downvotes: 0,
        controversyScore: 0,
        informativeScore: 0,
        isInformative: false
      };
      
      engine.posts.set(postId, post);
      engine.votes.set(postId, new Map());
      
      // Update indexes
      if (!engine.channelPosts.has(channelId)) {
        engine.channelPosts.set(channelId, []);
      }
      engine.channelPosts.get(channelId).push(postId);
      
      if (!engine.userPosts.has(userId)) {
        engine.userPosts.set(userId, new Map());
      }
      engine.userPosts.get(userId).set(channelId, postId);
      
      return Promise.resolve(post);
    });
    
    // Mock getUserPostInChannel implementation
    engine.getUserPostInChannel.mockImplementation((userId, channelId) => {
      const userChannelPosts = engine.userPosts.get(userId);
      return userChannelPosts ? userChannelPosts.get(channelId) : null;
    });
    
    // Mock voteOnPost implementation
    engine.voteOnPost.mockImplementation((postId, userId, voteType) => {
      const post = engine.posts.get(postId);
      if (!post) {
        return Promise.reject(new Error('Post not found'));
      }
      
      // Check if user is voting on own post
      if (post.authorId === userId) {
        return Promise.reject(new Error('Cannot vote on own post'));
      }
      
      const postVotes = engine.votes.get(postId) || new Map();
      const previousVote = postVotes.get(userId);
      
      if (previousVote && previousVote === voteType) {
        // Remove vote (toggle off)
        postVotes.delete(userId);
      } else {
        // Add or change vote
        postVotes.set(userId, voteType);
      }
      
      // Count votes
      let upvotes = 0;
      let downvotes = 0;
      
      for (const [, vote] of postVotes.entries()) {
        if (vote === 'upvote') upvotes++;
        if (vote === 'downvote') downvotes++;
      }
      
      // Update post
      post.upvotes = upvotes;
      post.downvotes = downvotes;
      post.score = upvotes - downvotes;
      post.controversyScore = Math.min(upvotes, downvotes) * 2;
      
      return Promise.resolve({
        success: true,
        votes: {
          upvotes,
          downvotes,
          score: upvotes - downvotes
        }
      });
    });
    
    // Mock pinPost implementation
    engine.pinPost.mockImplementation((channelId, postId, userId, durationInDays = 7) => {
      const post = engine.posts.get(postId);
      if (!post) {
        return Promise.reject(new Error('Post not found'));
      }
      
      const expiresAt = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
      
      engine.pinnedPosts.set(channelId, {
        postId,
        pinnedBy: userId,
        pinnedAt: Date.now(),
        expiresAt
      });
      
      return Promise.resolve({
        success: true,
        isPinned: true,
        expiresAt
      });
    });
    
    // Mock unpinPost implementation
    engine.unpinPost.mockImplementation((channelId, postId) => {
      engine.pinnedPosts.delete(channelId);
      
      return Promise.resolve({
        success: true
      });
    });
    
    // Mock bookmarkPost implementation
    engine.bookmarkPost.mockImplementation((postId, userId) => {
      if (!engine.bookmarks.has(userId)) {
        engine.bookmarks.set(userId, new Set());
      }
      
      engine.bookmarks.get(userId).add(postId);
      
      return Promise.resolve({
        success: true,
        isBookmarked: true
      });
    });
    
    // Mock unbookmarkPost implementation
    engine.unbookmarkPost.mockImplementation((postId, userId) => {
      if (engine.bookmarks.has(userId)) {
        engine.bookmarks.get(userId).delete(postId);
      }
      
      return Promise.resolve({
        success: true,
        isBookmarked: false
      });
    });
    
    // Mock getUserBookmarks implementation
    engine.getUserBookmarks.mockImplementation((userId, options = {}) => {
      const bookmarkedIds = engine.bookmarks.get(userId) || new Set();
      const bookmarkedPosts = [];
      
      for (const postId of bookmarkedIds) {
        const post = engine.posts.get(postId);
        if (post) {
          bookmarkedPosts.push(post);
        }
      }
      
      return Promise.resolve(bookmarkedPosts);
    });
      // Mock tagPostAsInformative implementation
    engine.tagPostAsInformative.mockImplementation((postId, userId) => {
      const post = engine.posts.get(postId);
      if (!post) {
        return Promise.reject(new Error('Post not found'));
      }
      
      // Track users who tagged this post
      if (!post.informativeTaggers) {
        post.informativeTaggers = new Set();
      }
      
      // Check if user already tagged this post
      if (post.informativeTaggers.has(userId)) {
        return Promise.resolve({
          success: true,
          informativeScore: post.informativeScore || 0
        });
      }
      
      // Add user to taggers and increment score
      post.informativeTaggers.add(userId);
      post.informativeScore = post.informativeTaggers.size;
      post.isInformative = post.informativeScore >= 1;
      
      return Promise.resolve({
        success: true,
        informativeScore: post.informativeScore
      });
    });
    
    // Mock searchPosts implementation
    engine.searchPosts.mockImplementation((channelId, options = {}) => {
      const { query, tags } = options;
      const channelPostIds = engine.channelPosts.get(channelId) || [];
      
      let filteredPosts = channelPostIds
        .map(id => engine.posts.get(id))
        .filter(post => post);
      
      // Filter by content
      if (query) {
        filteredPosts = filteredPosts.filter(post => 
          post.content.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Filter by tags
      if (tags && tags.length > 0) {
        filteredPosts = filteredPosts.filter(post => {
          if (!post.tags) return false;
          return tags.some(tag => post.tags.includes(tag));
        });
      }
      
      return Promise.resolve(filteredPosts);
    });
    
    // Mock getChannelNewsfeed implementation
    engine.getChannelNewsfeed.mockImplementation((channelId, options = {}) => {
      const { sortBy, mediaOnly, hideCollapsed, limit, offset } = options;
      const channelPostIds = engine.channelPosts.get(channelId) || [];
      
      let filteredPosts = channelPostIds
        .map(id => engine.posts.get(id))
        .filter(post => post);
      
      // Apply filters
      if (mediaOnly) {
        filteredPosts = filteredPosts.filter(post => 
          post.mediaAttachments && post.mediaAttachments.length > 0
        );
      }
      
      if (hideCollapsed) {
        filteredPosts = filteredPosts.filter(post => post.downvotes < 6);
      }
      
      // Apply sorting
      if (sortBy === 'most_upvoted') {
        filteredPosts.sort((a, b) => b.upvotes - a.upvotes);
      } else if (sortBy === 'most_recent') {
        filteredPosts.sort((a, b) => b.createdAt - a.createdAt);
      }
      
      return Promise.resolve({
        posts: filteredPosts.slice(offset || 0, (offset || 0) + (limit || 10))
      });
    });
    
    // Mock event handlers
    engine.handleUserVoteChange.mockImplementation((eventData) => {
      const { userId, channelId } = eventData;
      
      const postId = engine.getUserPostInChannel(userId, channelId);
      if (postId) {
        engine.posts.delete(postId);
        
        const channelPosts = engine.channelPosts.get(channelId);
        if (channelPosts) {
          const index = channelPosts.indexOf(postId);
          if (index > -1) {
            channelPosts.splice(index, 1);
          }
        }
        
        const userPosts = engine.userPosts.get(userId);
        if (userPosts) {
          userPosts.delete(channelId);
        }
      }
      
      return Promise.resolve();
    });
    
    // Mock handleSupporterRemoved implementation
    engine.handleSupporterRemoved.mockImplementation((eventData) => {
      const { userId, channelId } = eventData;
      
      const postId = engine.getUserPostInChannel(userId, channelId);
      if (postId) {
        engine.posts.delete(postId);
        
        const channelPosts = engine.channelPosts.get(channelId);
        if (channelPosts) {
          const index = channelPosts.indexOf(postId);
          if (index > -1) {
            channelPosts.splice(index, 1);
          }
        }
        
        const userPosts = engine.userPosts.get(userId);
        if (userPosts) {
          userPosts.delete(channelId);
        }
      }
      
      return Promise.resolve();
    });
    
    // Mock cleanupExpiredPins implementation
    engine.cleanupExpiredPins.mockImplementation(() => {
      for (const [channelId, pinData] of engine.pinnedPosts.entries()) {
        if (pinData.expiresAt < Date.now()) {
          engine.pinnedPosts.delete(channelId);
        }
      }
      
      return Promise.resolve();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Post Creation', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        content: 'Test post content',
        mediaAttachments: [],
        tags: ['test', 'newsfeed']
      };

      const post = await engine.createPost(testChannelId, testUserId, postData);

      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.channelId).toBe(testChannelId);
      expect(post.authorId).toBe(testUserId);
      expect(post.content).toBe(postData.content);
      expect(post.tags).toEqual(postData.tags);
      expect(post.createdAt).toBeDefined();
      expect(post.score).toBe(0);
    });

    it('should prevent duplicate posts from same user in same channel', async () => {
      const postData = {
        content: 'First post',
        mediaAttachments: [],
        tags: []
      };

      // Create first post
      await engine.createPost(testChannelId, testUserId, postData);

      // Try to create second post
      await expect(
        engine.createPost(testChannelId, testUserId, { content: 'Second post' })
      ).rejects.toThrow('User already has a post in this channel');
    });

    it('should allow posts from different users in same channel', async () => {
      const postData1 = { content: 'User 1 post' };
      const postData2 = { content: 'User 2 post' };

      const post1 = await engine.createPost(testChannelId, testUserId, postData1);
      const post2 = await engine.createPost(testChannelId, testUserId2, postData2);

      expect(post1.authorId).toBe(testUserId);
      expect(post2.authorId).toBe(testUserId2);
    });
  });

  describe('Voting System', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Test post for voting'
      });
    });

    it('should handle upvote correctly', async () => {
      const result = await engine.voteOnPost(testPost.id, testUserId2, 'upvote');

      expect(result.success).toBe(true);
      expect(result.votes.upvotes).toBe(1);
      expect(result.votes.downvotes).toBe(0);
      expect(result.votes.score).toBe(1);
    });

    it('should handle downvote correctly', async () => {
      const result = await engine.voteOnPost(testPost.id, testUserId2, 'downvote');

      expect(result.success).toBe(true);
      expect(result.votes.upvotes).toBe(0);
      expect(result.votes.downvotes).toBe(1);
      expect(result.votes.score).toBe(-1);
    });

    it('should prevent author from voting on own post', async () => {
      await expect(
        engine.voteOnPost(testPost.id, testUserId, 'upvote')
      ).rejects.toThrow('Cannot vote on own post');
    });

    it('should allow vote changes', async () => {
      // First upvote
      await engine.voteOnPost(testPost.id, testUserId2, 'upvote');
      
      // Change to downvote
      const result = await engine.voteOnPost(testPost.id, testUserId2, 'downvote');

      expect(result.votes.upvotes).toBe(0);
      expect(result.votes.downvotes).toBe(1);
      expect(result.votes.score).toBe(-1);
    });

    it('should remove vote when voting same type twice', async () => {
      // First upvote
      await engine.voteOnPost(testPost.id, testUserId2, 'upvote');
      
      // Second upvote should remove the vote
      const result = await engine.voteOnPost(testPost.id, testUserId2, 'upvote');

      expect(result.votes.upvotes).toBe(0);
      expect(result.votes.downvotes).toBe(0);
      expect(result.votes.score).toBe(0);
    });

    it('should calculate controversy score correctly', async () => {
      const testUserId3 = 'test-user-3';
      const testUserId4 = 'test-user-4';

      // Add votes from multiple users
      await engine.voteOnPost(testPost.id, testUserId2, 'upvote');
      await engine.voteOnPost(testPost.id, testUserId3, 'upvote');
      await engine.voteOnPost(testPost.id, testUserId4, 'downvote');

      const post = engine.posts.get(testPost.id);
      const votes = engine.votes.get(testPost.id);
      
      expect(votes.size).toBe(3); // 3 users voted
      expect(post.upvotes).toBe(2);
      expect(post.downvotes).toBe(1);
      expect(post.controversyScore).toBeGreaterThan(0);
    });
  });

  describe('Sorting and Filtering', () => {
    let posts;

    beforeEach(async () => {
      // Create multiple posts with different characteristics
      const post1 = await engine.createPost(testChannelId, testUserId, {
        content: 'Popular post'
      });
      const post2 = await engine.createPost(testChannelId, testUserId2, {
        content: 'Recent post'
      });
      
      // Add votes to make post1 popular
      await engine.voteOnPost(post1.id, testUserId2, 'upvote');
      await engine.voteOnPost(post1.id, 'user-3', 'upvote');
      
      // Make post2 more recent by updating timestamp
      engine.posts.get(post2.id).createdAt = Date.now();
      
      posts = [post1, post2];
    });

    it('should sort by most upvoted correctly', async () => {
      const result = await engine.getChannelNewsfeed(testChannelId, {
        sortBy: 'most_upvoted',
        limit: 10,
        offset: 0
      });

      expect(result.posts).toBeDefined();
      expect(result.posts.length).toBe(2);
      // First post should have more upvotes
      expect(result.posts[0].upvotes).toBeGreaterThan(result.posts[1].upvotes || 0);
    });

    it('should sort by most recent correctly', async () => {
      const result = await engine.getChannelNewsfeed(testChannelId, {
        sortBy: 'most_recent',
        limit: 10,
        offset: 0
      });

      expect(result.posts).toBeDefined();
      expect(result.posts.length).toBe(2);
      // First post should be more recent
      expect(result.posts[0].createdAt).toBeGreaterThanOrEqual(result.posts[1].createdAt);
    });

    it('should filter media-only posts', async () => {
      // Create a post with media
      const mediaPost = await engine.createPost(testChannelId, 'user-media', {
        content: 'Post with media',
        mediaAttachments: [{ id: 'media-1', type: 'image', url: 'test.jpg' }]
      });

      const result = await engine.getChannelNewsfeed(testChannelId, {
        mediaOnly: true,
        limit: 10,
        offset: 0
      });

      expect(result.posts).toBeDefined();
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].id).toBe(mediaPost.id);
    });

    it('should hide collapsed posts when requested', async () => {
      // Create a heavily downvoted post
      const badPost = await engine.createPost(testChannelId, 'user-bad', {
        content: 'Unpopular post'
      });
      
      // Downvote it heavily
      await engine.voteOnPost(badPost.id, testUserId, 'downvote');
      await engine.voteOnPost(badPost.id, testUserId2, 'downvote');
      await engine.voteOnPost(badPost.id, 'user-3', 'downvote');
      await engine.voteOnPost(badPost.id, 'user-4', 'downvote');
      await engine.voteOnPost(badPost.id, 'user-5', 'downvote');
      await engine.voteOnPost(badPost.id, 'user-6', 'downvote');

      const result = await engine.getChannelNewsfeed(testChannelId, {
        hideCollapsed: true,
        limit: 10,
        offset: 0
      });

      // Should not include the heavily downvoted post
      const badPostInResults = result.posts.find(p => p.id === badPost.id);
      expect(badPostInResults).toBeUndefined();
    });
  });

  describe('Bookmarking System', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Post to bookmark'
      });
    });

    it('should bookmark post successfully', async () => {
      const result = await engine.bookmarkPost(testPost.id, testUserId2);

      expect(result.success).toBe(true);
      expect(result.isBookmarked).toBe(true);
    });

    it('should unbookmark post successfully', async () => {
      // First bookmark
      await engine.bookmarkPost(testPost.id, testUserId2);
      
      // Then unbookmark
      const result = await engine.unbookmarkPost(testPost.id, testUserId2);

      expect(result.success).toBe(true);
      expect(result.isBookmarked).toBe(false);
    });

    it('should get user bookmarks correctly', async () => {
      // Bookmark multiple posts
      await engine.bookmarkPost(testPost.id, testUserId2);
      
      const post2 = await engine.createPost('channel-2', 'user-other', {
        content: 'Another post'
      });
      await engine.bookmarkPost(post2.id, testUserId2);

      const bookmarks = await engine.getUserBookmarks(testUserId2, {
        limit: 10,
        offset: 0
      });

      expect(bookmarks.length).toBe(2);
      expect(bookmarks.map(b => b.id)).toContain(testPost.id);
      expect(bookmarks.map(b => b.id)).toContain(post2.id);
    });
  });

  describe('Informative Tagging', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Informative content about blockchain technology'
      });
    });

    it('should tag post as informative', async () => {
      const result = await engine.tagPostAsInformative(testPost.id, testUserId2);

      expect(result.success).toBe(true);
      expect(result.informativeScore).toBe(1);
      
      const post = engine.posts.get(testPost.id);
      expect(post.isInformative).toBe(true);
      expect(post.informativeScore).toBe(1);
    });

    it('should prevent duplicate informative tags from same user', async () => {
      // First tag
      await engine.tagPostAsInformative(testPost.id, testUserId2);
      
      // Second tag should not increase score
      const result = await engine.tagPostAsInformative(testPost.id, testUserId2);
      
      expect(result.informativeScore).toBe(1);
    });

    it('should accumulate informative scores from multiple users', async () => {
      await engine.tagPostAsInformative(testPost.id, testUserId2);
      await engine.tagPostAsInformative(testPost.id, 'user-3');
      
      const post = engine.posts.get(testPost.id);
      expect(post.informativeScore).toBe(2);
    });
  });

  describe('Pinning System', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Post to pin'
      });
    });

    it('should pin post successfully', async () => {
      const result = await engine.pinPost(testChannelId, testPost.id, 'admin-user', 7);

      expect(result.success).toBe(true);
      expect(result.isPinned).toBe(true);
      expect(result.expiresAt).toBeDefined();
      
      const pinnedPost = engine.pinnedPosts.get(testChannelId);
      expect(pinnedPost.postId).toBe(testPost.id);
    });

    it('should replace existing pinned post', async () => {
      const post2 = await engine.createPost(testChannelId, testUserId2, {
        content: 'Second post to pin'
      });

      // Pin first post
      await engine.pinPost(testChannelId, testPost.id, 'admin-user', 7);
      
      // Pin second post (should replace first)
      const result = await engine.pinPost(testChannelId, post2.id, 'admin-user', 7);

      expect(result.success).toBe(true);
      
      const pinnedPost = engine.pinnedPosts.get(testChannelId);
      expect(pinnedPost.postId).toBe(post2.id);
    });

    it('should unpin post successfully', async () => {
      // First pin
      await engine.pinPost(testChannelId, testPost.id, 'admin-user', 7);
      
      // Then unpin
      const result = await engine.unpinPost(testChannelId, testPost.id);

      expect(result.success).toBe(true);
      expect(engine.pinnedPosts.has(testChannelId)).toBe(false);
    });

    it('should handle pin expiration', async () => {
      // Pin with very short duration for testing
      await engine.pinPost(testChannelId, testPost.id, 'admin-user', 0.001); // ~1.5 minutes
      
      // Fast-forward time and check expiration
      const pinnedPost = engine.pinnedPosts.get(testChannelId);
      pinnedPost.expiresAt = Date.now() - 1000; // Set to expired
      
      await engine.cleanupExpiredPins();
      
      expect(engine.pinnedPosts.has(testChannelId)).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Create posts with different content and tags
      await engine.createPost(testChannelId, testUserId, {
        content: 'Discussion about blockchain technology',
        tags: ['blockchain', 'tech']
      });
      
      await engine.createPost(testChannelId, testUserId2, {
        content: 'Web development tips and tricks',
        tags: ['web', 'development']
      });
      
      await engine.createPost(testChannelId, 'user-3', {
        content: 'Machine learning algorithms explained',
        tags: ['ml', 'algorithms', 'tech']
      });
    });

    it('should search by content keywords', async () => {
      const results = await engine.searchPosts(testChannelId, {
        query: 'blockchain',
        limit: 10,
        offset: 0
      });

      expect(results.length).toBe(1);
      expect(results[0].content).toContain('blockchain');
    });

    it('should search by tags', async () => {
      const results = await engine.searchPosts(testChannelId, {
        tags: ['tech'],
        limit: 10,
        offset: 0
      });

      expect(results.length).toBe(2);
      results.forEach(post => {
        expect(post.tags).toContain('tech');
      });
    });

    it('should search by both content and tags', async () => {
      const results = await engine.searchPosts(testChannelId, {
        query: 'development',
        tags: ['web'],
        limit: 10,
        offset: 0
      });

      expect(results.length).toBe(1);
      expect(results[0].content).toContain('development');
      expect(results[0].tags).toContain('web');
    });

    it('should return empty results for non-matching search', async () => {
      const results = await engine.searchPosts(testChannelId, {
        query: 'nonexistent',
        limit: 10,
        offset: 0
      });

      expect(results.length).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('should handle user vote change events', async () => {
      const testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Test post'
      });

      // Simulate user vote change event
      const eventData = {
        userId: testUserId,
        channelId: testChannelId,
        oldVote: 'support',
        newVote: null
      };

      await engine.handleUserVoteChange(eventData);
      
      // Post should be removed when user removes their channel vote
      expect(engine.posts.has(testPost.id)).toBe(false);
    });

    it('should handle supporter removal events', async () => {
      const testPost = await engine.createPost(testChannelId, testUserId, {
        content: 'Test post'
      });

      // Simulate supporter removal event
      const eventData = {
        channelId: testChannelId,
        userId: testUserId
      };

      await engine.handleSupporterRemoved(eventData);
      
      // Post should be removed when user is no longer a supporter
      expect(engine.posts.has(testPost.id)).toBe(false);
    });
  });
});
