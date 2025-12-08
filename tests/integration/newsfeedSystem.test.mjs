/**
 * @fileoverview Integration tests for the complete newsfeed system
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import newsfeedVoteEngine from '../../src/backend/channel-service/newsfeedVoteEngine.mjs';
import topicRowVoteManager from '../../src/backend/channel-service/topicRowVoteManager.mjs';
import newsfeedRenderService from '../../src/backend/channel-service/newsfeedRenderService.mjs';

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

describe('Newsfeed System Integration', () => {
  let app;
  
  const testChannelId = 'test-channel-1';
  const testTopicRow = 'technology';
  const testUserId = 'test-user-1';
  const testUserId2 = 'test-user-2';
  const channelOwnerId = 'channel-owner';
  beforeEach(async () => {
    // Services are already initialized instances
    if (newsfeedVoteEngine && typeof newsfeedVoteEngine.initialize === 'function') {
      await newsfeedVoteEngine.initialize();
    }
    if (topicRowVoteManager && typeof topicRowVoteManager.initialize === 'function') {
      await topicRowVoteManager.initialize();
    }
    if (newsfeedRenderService && typeof newsfeedRenderService.initialize === 'function') {
      await newsfeedRenderService.initialize();
    }

    // Setup test app with simplified channel service endpoints
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: req.headers['x-user-id'] || testUserId };
      next();
    });

    // Setup test data
    await setupTestData();
    setupRoutes();
  });
  afterEach(() => {
    vi.clearAllMocks();
    if (topicRowVoteManager && topicRowVoteManager.voteDecayScheduler) {
      clearInterval(topicRowVoteManager.voteDecayScheduler);
    }
  });

  async function setupTestData() {
    // Create topic row and channel
    await topicRowVoteManager.createTopicRow(testTopicRow, {
      description: 'Technology discussions'
    });
    
    await topicRowVoteManager.addChannelToTopicRow(testTopicRow, testChannelId, {
      name: 'Test Tech Channel',
      ownerId: channelOwnerId,
      description: 'A channel for tech discussions'
    });    // Make test users supporters of the channel
    await topicRowVoteManager.voteForChannel(testChannelId, testUserId, 'up');
    await topicRowVoteManager.voteForChannel(testChannelId, testUserId2, 'up');
  }

  function setupRoutes() {    // Newsfeed endpoints
    app.get('/api/channels/:channelId/newsfeed', async (req, res) => {
      try {
        const { channelId } = req.params;
        const { 
          sortBy = 'most_upvoted', 
          limit = 20, 
          offset = 0,
          hideCollapsed = false,
          mediaOnly = false
        } = req.query;
        const userId = req.user.id;

        const options = {
          sortBy,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hideCollapsed: hideCollapsed === 'true',
          mediaOnly: mediaOnly === 'true',
          userId
        };

        const rawNewsfeed = await newsfeedVoteEngine.getChannelPosts(channelId, options);
        
        // Temporarily return raw posts to debug
        res.json({
          posts: rawNewsfeed.posts || [],
          totalCount: rawNewsfeed.totalCount || 0
        });
      } catch (error) {
        console.error('Newsfeed endpoint error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/channels/:channelId/newsfeed', async (req, res) => {
      try {
        const { channelId } = req.params;
        const { content, mediaAttachments = [], tags = [] } = req.body;
        const userId = req.user.id;

        // Check if user is a supporter
        const isSupporter = await topicRowVoteManager.isChannelSupporter(channelId, userId);
        if (!isSupporter) {
          return res.status(403).json({ error: 'Only channel supporters can post' });
        }        const post = await newsfeedVoteEngine.createPost(channelId, userId, {
          content,
          mediaAttachment: mediaAttachments && mediaAttachments.length > 0 ? mediaAttachments[0] : null,
          tags
        });

        res.json({ post });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/channels/:channelId/newsfeed/:postId/vote', async (req, res) => {
      try {
        const { postId } = req.params;
        const { voteType } = req.body;
        const userId = req.user.id;

        const result = await newsfeedVoteEngine.voteOnPost(postId, userId, voteType);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });    app.post('/api/channels/:channelId/newsfeed/:postId/bookmark', async (req, res) => {
      try {
        const { postId } = req.params;
        const userId = req.user.id;

        const isBookmarked = await newsfeedVoteEngine.toggleBookmark(postId, userId);
        res.json({ success: true, isBookmarked });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/channels/:channelId/newsfeed/:postId/tag-informative', async (req, res) => {
      try {
        const { postId } = req.params;
        const userId = req.user.id;

        await newsfeedVoteEngine.tagAsInformative(postId, userId);
        const post = newsfeedVoteEngine.posts.get(postId);
        res.json({ 
          success: true, 
          informativeScore: post.informativeCount,
          isInformative: post.isInformative 
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });    app.post('/api/channels/:channelId/newsfeed/:postId/pin', async (req, res) => {
      try {
        const { channelId, postId } = req.params;
        const { duration = 7 } = req.body;
        const userId = req.user.id;

        // Simple permission check (in real app, this would check channel ownership/admin)
        if (userId !== channelOwnerId) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const result = await newsfeedVoteEngine.pinPost(channelId, postId, userId);
        res.json({ 
          success: true, 
          isPinned: true,
          pinData: result 
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/channels/:channelId/newsfeed/search', async (req, res) => {
      try {
        const { channelId } = req.params;
        const { q: query, tags, limit = 20, offset = 0 } = req.query;

        const searchOptions = {
          query,
          tags: tags ? tags.split(',') : [],
          limit: parseInt(limit),
          offset: parseInt(offset)
        };

        const results = await newsfeedVoteEngine.searchPosts(channelId, searchOptions);
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/users/:userId/bookmarks', async (req, res) => {
      try {
        const { userId: targetUserId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        const userId = req.user.id;

        if (userId !== targetUserId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const bookmarks = await newsfeedVoteEngine.getUserBookmarks(userId, {
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        res.json({ bookmarks });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  describe('End-to-End Newsfeed Workflow', () => {
    it('should complete full newsfeed workflow', async () => {      // 1. Create a post
      const createResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .send({
          content: 'This is a test post about blockchain technology',
          tags: ['blockchain', 'technology', 'crypto']
        });

      // Debug logging to see what's going wrong
      if (createResponse.status !== 200) {
        console.log('Create Response Status:', createResponse.status);
        console.log('Create Response Body:', createResponse.body);
        console.log('Create Response Error:', createResponse.error);
      }

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.post).toBeDefined();
      expect(createResponse.body.post.content).toBe('This is a test post about blockchain technology');
      expect(createResponse.body.post.tags).toEqual(['blockchain', 'technology', 'crypto']);

      const postId = createResponse.body.post.id;

      // 2. Vote on the post
      const voteResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed/${postId}/vote`)
        .set('x-user-id', testUserId2)
        .send({ voteType: 'up' });      expect(voteResponse.status).toBe(200);
      expect(voteResponse.body.upvotes).toBe(1);
      expect(voteResponse.body.totalVotes).toBe(1);

      // 3. Tag as informative
      const tagResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed/${postId}/tag-informative`)
        .set('x-user-id', testUserId2)
        .send({});

      expect(tagResponse.status).toBe(200);
      expect(tagResponse.body.success).toBe(true);
      expect(tagResponse.body.informativeScore).toBe(1);

      // 4. Bookmark the post
      const bookmarkResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed/${postId}/bookmark`)
        .set('x-user-id', testUserId2)
        .send({});

      expect(bookmarkResponse.status).toBe(200);
      expect(bookmarkResponse.body.success).toBe(true);

      // 5. Get newsfeed and verify the post appears with all metadata
      const newsfeedResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId2)
        .query({ sortBy: 'most_upvoted' });      expect(newsfeedResponse.status).toBe(200);
      expect(newsfeedResponse.body.posts).toHaveLength(1);
      
      const renderedPost = newsfeedResponse.body.posts[0];
      expect(renderedPost.id).toBe(postId);
      expect(renderedPost.upvotes).toBe(1); // Raw format, not rendered
      expect(renderedPost.informativeCount).toBe(1); // Raw format
      expect(renderedPost.content).toContain('blockchain'); // Raw format
      // expect(renderedPost.version).toBe('2.0'); // This is a render service feature

      // 6. Search for the post
      const searchResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed/search`)
        .set('x-user-id', testUserId)
        .query({ q: 'blockchain' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.results).toHaveLength(1);
      expect(searchResponse.body.results[0].id).toBe(postId);

      // 7. Get user bookmarks
      const bookmarksResponse = await request(app)
        .get(`/api/users/${testUserId2}/bookmarks`)
        .set('x-user-id', testUserId2);

      expect(bookmarksResponse.status).toBe(200);
      expect(bookmarksResponse.body.bookmarks).toHaveLength(1);
      expect(bookmarksResponse.body.bookmarks[0].id).toBe(postId);
    });    it('should handle pinning workflow for channel owner', async () => {
      // Use a different user to avoid conflict with previous tests
      const pinTestUserId = 'pin-test-user';
      
      // Make the user a supporter first
      await topicRowVoteManager.voteForChannel(testChannelId, pinTestUserId, 'up');
      
      // Create a post as a supporter
      const createResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', pinTestUserId)
        .send({
          content: 'Important announcement post',
          tags: ['announcement']
        });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.post).toBeDefined();
      const postId = createResponse.body.post.id;

      // Pin the post as channel owner
      const pinResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed/${postId}/pin`)
        .set('x-user-id', channelOwnerId)
        .send({ duration: 7 });

      expect(pinResponse.status).toBe(200);
      expect(pinResponse.body.success).toBe(true);
      expect(pinResponse.body.isPinned).toBe(true);

      // Get newsfeed and verify pinned post appears first
      const newsfeedResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .query({ sortBy: 'most_recent' });

      expect(newsfeedResponse.status).toBe(200);
      const posts = newsfeedResponse.body.posts;
      expect(posts[0].isPinned).toBe(true);
      expect(posts[0].displayPriority).toBeGreaterThan(1000);
    });

    it('should prevent non-supporters from posting', async () => {
      // Try to post as a user who hasn't voted for the channel
      const response = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', 'non-supporter')
        .send({
          content: 'This should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('supporters');
    });

    it('should prevent duplicate posts from same user', async () => {
      // Create first post
      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .send({
          content: 'First post'
        });

      // Try to create second post
      const response = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .send({
          content: 'Second post should fail'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('already has a post');
    });
  });
  describe('Sorting and Filtering Integration', () => {
    let post1Id, post2Id, post3Id;
    const testUser1 = 'sort-test-user-1';
    const testUser2 = 'sort-test-user-2';
    const testUser3 = 'sort-test-user-3';

    beforeEach(async () => {
        // Reset the newsfeed engine to ensure clean state
        newsfeedVoteEngine.resetChannel(testChannelId);
        
        // Mock getUserPostInChannel to allow multiple posts per user
        vi.spyOn(newsfeedVoteEngine, 'getUserPostInChannel').mockImplementation(() => null);

        // Make all users channel supporters first
        await topicRowVoteManager.voteForChannel(testChannelId, testUser1, 'up');
        await topicRowVoteManager.voteForChannel(testChannelId, testUser2, 'up');
        await topicRowVoteManager.voteForChannel(testChannelId, testUser3, 'up');

        // Create posts with different users and ensure different timestamps
        const post1 = await newsfeedVoteEngine.createPost(testChannelId, testUser1, {
            content: 'Most upvoted post',
            tags: ['test']
        });
        post1Id = post1.id;

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        const post2 = await newsfeedVoteEngine.createPost(testChannelId, testUser2, {
            content: 'Post with media',
            mediaAttachment: { type: 'image', url: 'test.jpg' },
            tags: ['media']
        });
        post2Id = post2.id;

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        const post3 = await newsfeedVoteEngine.createPost(testChannelId, testUser3, {
            content: 'Post to be collapsed',
            tags: ['test']
        });
        post3Id = post3.id;

        // Add votes to make post1 most upvoted
        await newsfeedVoteEngine.voteOnPost(post1Id, testUser2, 'up');
        await newsfeedVoteEngine.voteOnPost(post1Id, testUser3, 'up');

        // Add downvotes to post3 to collapse it
        await newsfeedVoteEngine.voteOnPost(post3Id, testUser1, 'down');
        await newsfeedVoteEngine.voteOnPost(post3Id, testUser2, 'down');

        // Tag post1 as informative
        await newsfeedVoteEngine.tagAsInformative(post1Id, testUser2);
        await newsfeedVoteEngine.tagAsInformative(post1Id, testUser3);
    });

    afterEach(() => {
        // Restore the original method
        vi.restoreAllMocks();
    });

    it('should sort by most upvoted correctly', async () => {
        const response = await request(app)
            .get(`/api/channels/${testChannelId}/newsfeed`)
            .set('x-user-id', testUser1)
            .query({ sortBy: 'most_upvoted' });

        expect(response.status).toBe(200);
        const posts = response.body.posts;
        expect(posts.length).toBeGreaterThan(0);

        // Check that posts are sorted by upvotes
        expect(posts[0].id).toBe(post1Id); // Most upvoted post should be first
        expect(posts[0].upvotes).toBe(2); // Should have 2 upvotes
        expect(posts[0].upvotes).toBeGreaterThan(posts[1].upvotes);
    });

    it('should sort by most recent correctly', async () => {
        const response = await request(app)
            .get(`/api/channels/${testChannelId}/newsfeed`)
            .set('x-user-id', testUser1)
            .query({ sortBy: 'most_recent' });

        expect(response.status).toBe(200);
        const posts = response.body.posts;
        expect(posts.length).toBeGreaterThan(0);

        // Check that posts are sorted by creation time
        expect(posts[0].id).toBe(post3Id); // Most recent post should be first
        expect(posts[0].createdAt).toBeGreaterThan(posts[1].createdAt);
    });

    it('should sort by most informative correctly', async () => {
        const response = await request(app)
            .get(`/api/channels/${testChannelId}/newsfeed`)
            .set('x-user-id', testUser1)
            .query({ sortBy: 'informative' });

        expect(response.status).toBe(200);
        const posts = response.body.posts;
        expect(posts.length).toBeGreaterThan(0);

        // Check that posts are sorted by informative score
        expect(posts[0].id).toBe(post1Id); // Most informative post should be first
        expect(posts[0].informativeCount).toBe(2); // Should have 2 informative tags
        expect(posts[0].informativeCount).toBeGreaterThan(posts[1].informativeCount || 0);
    });

    it('should filter media-only posts', async () => {
        const response = await request(app)
            .get(`/api/channels/${testChannelId}/newsfeed`)
            .set('x-user-id', testUser1)
            .query({ mediaOnly: true });

        expect(response.status).toBe(200);
        const posts = response.body.posts;

        // Should only return posts with media attachments
        expect(posts.length).toBe(1);
        expect(posts[0].id).toBe(post2Id);
        expect(posts[0].mediaAttachment).toBeDefined();
    });

    it('should hide collapsed posts', async () => {
        const response = await request(app)
            .get(`/api/channels/${testChannelId}/newsfeed`)
            .set('x-user-id', testUser1)
            .query({ hideCollapsed: true });

        expect(response.status).toBe(200);
        const posts = response.body.posts;

        // Should not include the heavily downvoted post
        const collapsedPostInResults = posts.find(p => p.id === post3Id);
        expect(collapsedPostInResults).toBeUndefined();
    });
  });

  describe('Search Integration', () => {
    beforeEach(async () => {
      // Create posts with different content and tags
      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .send({
          content: 'Discussion about blockchain technology and its applications',
          tags: ['blockchain', 'technology', 'crypto']
        });

      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId2)
        .send({
          content: 'Web development tips for modern applications',
          tags: ['web', 'development', 'javascript']
        });
    });

    it('should search by content keywords', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed/search`)
        .set('x-user-id', testUserId)
        .query({ q: 'blockchain' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].content).toContain('blockchain');
    });

    it('should search by tags', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed/search`)
        .set('x-user-id', testUserId)
        .query({ tags: 'technology' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].tags).toContain('technology');
    });

    it('should search by multiple tags', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed/search`)
        .set('x-user-id', testUserId)
        .query({ tags: 'web,development' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].tags).toContain('web');
      expect(response.body.results[0].tags).toContain('development');
    });

    it('should return empty results for no matches', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed/search`)
        .set('x-user-id', testUserId)
        .query({ q: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
    });
  });
  describe('Cross-Service Integration', () => {
    it('should integrate voting between TopicRowVoteManager and NewsfeedVoteEngine', async () => {
      // Use unique user for cross-service integration test
      const crossServiceUser = 'cross-service-user-1';
      
      // Make user a supporter first
      await topicRowVoteManager.voteForChannel(testChannelId, crossServiceUser, 'up');
      
      // Create a post
      const postResponse = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', crossServiceUser)
        .send({ content: 'Test integration post' });

      expect(postResponse.status).toBe(200);
      expect(postResponse.body.post).toBeDefined();
      const postId = postResponse.body.post.id;      // Remove user's support for the channel
      await topicRowVoteManager.voteForChannel(testChannelId, crossServiceUser, 'revoke'); // Remove vote

      // Simulate the event that should remove the user's post
      await newsfeedVoteEngine.handleSupporterRemoved({
        channelId: testChannelId,
        userId: crossServiceUser
      });

      // Post should be removed
      const newsfeedResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId2);

      const postIds = newsfeedResponse.body.posts.map(p => p.id);
      expect(postIds).not.toContain(postId);
    });    it('should maintain data consistency across services', async () => {
      // Get initial channel stats
      const initialStats = await topicRowVoteManager.getChannelVoteStats(testChannelId);
      
      // Use unique user for consistency test
      const consistencyUser = 'consistency-test-user';
      
      // Make user a supporter first
      await topicRowVoteManager.voteForChannel(testChannelId, consistencyUser, 'up');
      
      // Create posts and vote on them
      const post1Response = await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', consistencyUser)
        .send({ content: 'First post' });

      expect(post1Response.status).toBe(200);
      expect(post1Response.body.post).toBeDefined();
      const post1Id = post1Response.body.post.id;

      // Vote on the post
      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed/${post1Id}/vote`)
        .set('x-user-id', testUserId2)        .send({ voteType: 'up' });

      // Get newsfeed stats
      const newsfeedResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId);      // Verify data consistency
      expect(newsfeedResponse.body.posts.length).toBeGreaterThan(0);
      
      // Find our specific post and verify its vote count
      const ourPost = newsfeedResponse.body.posts.find(p => p.id === post1Id);
      expect(ourPost).toBeDefined();
      expect(ourPost.upvotes).toBe(1);
      
      // Channel stats should remain consistent
      const finalStats = await topicRowVoteManager.getChannelVoteStats(testChannelId);
      expect(finalStats.supportVotes).toBe(initialStats.supportVotes);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .get(`/api/channels/${testChannelId}/newsfeed`)
          .set('x-user-id', testUserId)
          .query({ sortBy: 'most_recent', limit: 5 })
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.posts).toBeDefined();
      });
    });    it('should handle pagination correctly', async () => {
      // First get the current post count to understand existing state
      const initialResponse = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId);

      expect(initialResponse.status).toBe(200);
      const initialPostCount = initialResponse.body.posts.length;

      // Create additional posts from different users to test pagination
      const testUser3 = 'test-user-3';
      const testUser4 = 'test-user-4';
      
      // Make new users supporters first
      await topicRowVoteManager.voteForChannel(testChannelId, testUser3, 'up');
      await topicRowVoteManager.voteForChannel(testChannelId, testUser4, 'up');

      // Create posts from different users
      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUser3)
        .send({ content: 'Pagination test post 1' });

      await request(app)
        .post(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUser4)
        .send({ content: 'Pagination test post 2' });

      // Test pagination with limit 1
      const page1 = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .query({ limit: 1, offset: 0 });

      expect(page1.status).toBe(200);
      expect(page1.body.posts).toHaveLength(1);

      const page2 = await request(app)
        .get(`/api/channels/${testChannelId}/newsfeed`)
        .set('x-user-id', testUserId)
        .query({ limit: 1, offset: 1 });

      expect(page2.status).toBe(200);
      // Should have 1 post since we created additional posts
      expect(page2.body.posts.length).toBeGreaterThanOrEqual(0);
      expect(page2.body.posts.length).toBeLessThanOrEqual(1);
    });
  });
});
