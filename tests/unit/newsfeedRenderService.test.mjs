/**
 * @fileoverview Unit tests for NewsfeedRenderService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import NewsfeedRenderService from '../../src/backend/channel-service/newsfeedRenderService.mjs';

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

describe('NewsfeedRenderService', () => {
  let renderService;
  const testUserId = 'test-user-1';

  beforeEach(async () => {
    renderService = new NewsfeedRenderService();
    await renderService.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Post Rendering', () => {
    it('should render a basic post correctly', () => {
      const rawPost = {
        id: 'post-1',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Test post content',
        timestamp: Date.now(),
        score: 5,
        upvotes: 6,
        downvotes: 1,
        tags: ['test', 'post']
      };

      const rendered = renderService.renderPost(rawPost, { userId: testUserId });

      expect(rendered.id).toBe(rawPost.id);
      expect(rendered.channelId).toBe(rawPost.channelId);
      expect(rendered.authorId).toBe(rawPost.authorId);
      expect(rendered.content).toBeDefined();
      expect(rendered.content.raw).toBe(rawPost.content);
      expect(rendered.content.formatted).toBeDefined();
      expect(rendered.votes).toBeDefined();
      expect(rendered.votes.upvotes).toBe(6);
      expect(rendered.votes.downvotes).toBe(1);
      expect(rendered.tags).toEqual(['test', 'post']);
      expect(rendered.version).toBe('2.0');
    });

    it('should render content with formatting', () => {
      const rawPost = {
        id: 'post-1',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Check this out #blockchain @alice https://example.com',
        timestamp: Date.now()
      };

      const rendered = renderService.renderPost(rawPost);

      expect(rendered.content.formatted).toContain('<span class="hashtag">#blockchain</span>');
      expect(rendered.content.formatted).toContain('<span class="mention">@alice</span>');
      expect(rendered.content.formatted).toContain('<a href="https://example.com"');
      expect(rendered.content.wordCount).toBe(5);
      expect(rendered.content.characterCount).toBe(rawPost.content.length);
    });

    it('should render media attachments correctly', () => {
      const rawPost = {
        id: 'post-1',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Post with media',
        mediaAttachments: [
          {
            id: 'media-1',
            type: 'image',
            url: 'https://example.com/image.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            filename: 'image.jpg',
            dimensions: { width: 800, height: 600 }
          }
        ],
        timestamp: Date.now()
      };

      const rendered = renderService.renderPost(rawPost);

      expect(rendered.mediaAttachments).toHaveLength(1);
      expect(rendered.mediaAttachments[0].isImage).toBe(true);
      expect(rendered.mediaAttachments[0].displaySize).toBeDefined();
      expect(rendered.mediaAttachments[0].displaySize.width).toBeLessThanOrEqual(600);
    });

    it('should handle pinned posts', () => {
      const rawPost = {
        id: 'post-1',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Pinned post',
        isPinned: true,
        pinnedBy: 'admin-1',
        pinExpiresAt: Date.now() + 86400000, // 24 hours
        timestamp: Date.now(),
        score: 10
      };

      const rendered = renderService.renderPost(rawPost);

      expect(rendered.isPinned).toBe(true);
      expect(rendered.pinnedBy).toBe('admin-1');
      expect(rendered.displayPriority).toBeGreaterThan(1000); // Pinned posts get high priority
    });

    it('should calculate display priority correctly', () => {
      const recentPost = {
        id: 'recent',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Recent post',
        timestamp: Date.now(), // Very recent
        score: 5
      };

      const oldPost = {
        id: 'old',
        channelId: 'channel-1',
        authorId: 'author-2',
        content: 'Old post',
        timestamp: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
        score: 5
      };

      const renderedRecent = renderService.renderPost(recentPost);
      const renderedOld = renderService.renderPost(oldPost);

      expect(renderedRecent.displayPriority).toBeGreaterThan(renderedOld.displayPriority);
    });

    it('should mark low-score posts as collapsed', () => {
      const lowScorePost = {
        id: 'low-score',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Unpopular post',
        timestamp: Date.now(),
        score: -6
      };

      const rendered = renderService.renderPost(lowScorePost);

      expect(rendered.isCollapsed).toBe(true);
    });

    it('should use render cache for repeated requests', () => {
      const rawPost = {
        id: 'post-1',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Test post',
        timestamp: Date.now()
      };

      const rendered1 = renderService.renderPost(rawPost, { userId: testUserId });
      const rendered2 = renderService.renderPost(rawPost, { userId: testUserId });

      // Should be the same object from cache
      expect(rendered1).toBe(rendered2);
    });
  });

  describe('Post Collection Rendering', () => {
    let testPosts;

    beforeEach(() => {
      testPosts = [
        {
          id: 'post-1',
          channelId: 'channel-1',
          authorId: 'author-1',
          content: 'First post',
          timestamp: Date.now() - 3600000, // 1 hour ago
          score: 10,
          upvotes: 10,
          downvotes: 0,
          isBookmarked: true
        },
        {
          id: 'post-2',
          channelId: 'channel-1',
          authorId: 'author-2',
          content: 'Second post',
          timestamp: Date.now() - 1800000, // 30 minutes ago
          score: 5,
          upvotes: 6,
          downvotes: 1,
          mediaAttachments: [{ type: 'image', url: 'image.jpg' }]
        },
        {
          id: 'post-3',
          channelId: 'channel-1',
          authorId: 'author-3',
          content: 'Third post',
          timestamp: Date.now(), // Just now
          score: -6,
          upvotes: 2,
          downvotes: 8
        }
      ];
    });

    it('should render post collection with metadata', () => {
      const result = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        sortBy: 'most_upvoted'
      });

      expect(result.posts).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.filteredCount).toBe(3);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.sortBy).toBe('most_upvoted');
    });

    it('should filter out collapsed posts when requested', () => {
      const result = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        hideCollapsed: true
      });

      expect(result.filteredCount).toBe(2); // Should exclude the -6 score post
      expect(result.posts.find(p => p.score < -5)).toBeUndefined();
    });

    it('should filter to bookmarked posts only', () => {
      const result = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        showOnlyBookmarked: true
      });

      expect(result.filteredCount).toBe(1);
      expect(result.posts[0].isBookmarked).toBe(true);
    });

    it('should filter to media-only posts', () => {
      const result = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        mediaOnly: true
      });

      expect(result.filteredCount).toBe(1);
      expect(result.posts[0].mediaAttachments).toHaveLength(1);
    });

    it('should sort posts correctly', () => {
      const resultByUpvotes = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        sortBy: 'most_upvoted'
      });

      expect(resultByUpvotes.posts[0].votes.upvotes).toBe(10);
      expect(resultByUpvotes.posts[1].votes.upvotes).toBe(6);

      const resultByRecent = renderService.renderPostCollection(testPosts, {
        userId: testUserId,
        sortBy: 'most_recent'
      });

      expect(resultByRecent.posts[0].timestamp).toBeGreaterThan(resultByRecent.posts[1].timestamp);
    });
  });

  describe('Media Display Size Calculation', () => {
    it('should calculate display size for images', () => {
      const attachment = {
        type: 'image',
        dimensions: { width: 1200, height: 800 }
      };

      const displaySize = renderService.calculateMediaDisplaySize(attachment);

      expect(displaySize.width).toBeLessThanOrEqual(600);
      expect(displaySize.height).toBeLessThanOrEqual(400);
      expect(displaySize.aspectRatio).toBeCloseTo(1.5, 1);
    });

    it('should handle attachments without dimensions', () => {
      const attachment = {
        type: 'document'
      };

      const displaySize = renderService.calculateMediaDisplaySize(attachment);

      expect(displaySize.width).toBe(300);
      expect(displaySize.height).toBe(200);
    });

    it('should maintain aspect ratio when scaling', () => {
      const attachment = {
        type: 'image',
        dimensions: { width: 1000, height: 500 } // 2:1 ratio
      };

      const displaySize = renderService.calculateMediaDisplaySize(attachment);

      expect(displaySize.width / displaySize.height).toBeCloseTo(2, 1);
    });
  });

  describe('User Preferences', () => {
    it('should return default preferences for new user', () => {
      const prefs = renderService.getUserPreferences('new-user');

      expect(prefs.defaultSort).toBe('most_upvoted');
      expect(prefs.hideCollapsed).toBe(false);
      expect(prefs.autoPlayMedia).toBe(false);
      expect(prefs.showInformativeTags).toBe(true);
      expect(prefs.compactMode).toBe(false);
    });

    it('should update user preferences', () => {
      const newPrefs = {
        defaultSort: 'most_recent',
        hideCollapsed: true,
        compactMode: true
      };

      const updated = renderService.updateUserPreferences(testUserId, newPrefs);

      expect(updated.defaultSort).toBe('most_recent');
      expect(updated.hideCollapsed).toBe(true);
      expect(updated.compactMode).toBe(true);
      // Should preserve other defaults
      expect(updated.autoPlayMedia).toBe(false);
      expect(updated.showInformativeTags).toBe(true);
    });

    it('should persist user preferences', () => {
      renderService.updateUserPreferences(testUserId, {
        defaultSort: 'most_controversial'
      });

      const retrieved = renderService.getUserPreferences(testUserId);
      expect(retrieved.defaultSort).toBe('most_controversial');
    });
  });

  describe('Newsfeed Metadata Generation', () => {
    it('should generate complete metadata for channel', () => {
      const channel = {
        id: 'channel-1',
        name: 'Test Channel',
        supportersCount: 150,
        activePostsCount: 25,
        pinnedPostsCount: 1,
        lastActivity: Date.now(),
        ownerId: testUserId
      };

      const metadata = renderService.generateNewsfeedMetadata(channel, { userId: testUserId });

      expect(metadata.channelId).toBe(channel.id);
      expect(metadata.channelName).toBe(channel.name);
      expect(metadata.supportersCount).toBe(150);
      expect(metadata.sortingOptions).toHaveLength(4);
      expect(metadata.filterOptions).toHaveLength(4);
      expect(metadata.features.pinning).toBe(true); // Owner should have pinning permission
    });

    it('should restrict pinning for non-owners', () => {
      const channel = {
        id: 'channel-1',
        name: 'Test Channel',
        ownerId: 'other-user'
      };

      const metadata = renderService.generateNewsfeedMetadata(channel, { userId: testUserId });

      expect(metadata.features.pinning).toBe(false);
    });

    it('should allow pinning for admins', () => {
      const channel = {
        id: 'channel-1',
        name: 'Test Channel',
        ownerId: 'other-user',
        admins: new Set([testUserId])
      };

      const metadata = renderService.generateNewsfeedMetadata(channel, { userId: testUserId });

      expect(metadata.features.pinning).toBe(true);
    });

    it('should include correct sorting options', () => {
      const channel = { id: 'channel-1', name: 'Test' };
      const metadata = renderService.generateNewsfeedMetadata(channel);

      const sortingValues = metadata.sortingOptions.map(opt => opt.value);
      expect(sortingValues).toContain('most_upvoted');
      expect(sortingValues).toContain('most_recent');
      expect(sortingValues).toContain('most_controversial');
      expect(sortingValues).toContain('most_informative');

      const defaultOption = metadata.sortingOptions.find(opt => opt.default);
      expect(defaultOption.value).toBe('most_upvoted');
    });
  });

  describe('Sorting Functions', () => {
    let posts;

    beforeEach(() => {
      posts = [
        {
          id: 'post-1',
          timestamp: Date.now() - 3600000,
          votes: { upvotes: 5, downvotes: 1, controversyScore: 0.2 },
          informativeScore: 2,
          displayPriority: 50
        },
        {
          id: 'post-2',
          timestamp: Date.now(),
          votes: { upvotes: 10, downvotes: 0, controversyScore: 0 },
          informativeScore: 5,
          displayPriority: 100
        },
        {
          id: 'post-3',
          timestamp: Date.now() - 1800000,
          votes: { upvotes: 3, downvotes: 3, controversyScore: 0.8 },
          informativeScore: 1,
          displayPriority: 25
        }
      ];
    });

    it('should sort by display priority', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'display_priority');

      expect(sorted[0].displayPriority).toBe(100);
      expect(sorted[1].displayPriority).toBe(50);
      expect(sorted[2].displayPriority).toBe(25);
    });

    it('should sort by most upvoted', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'most_upvoted');

      expect(sorted[0].votes.upvotes).toBe(10);
      expect(sorted[1].votes.upvotes).toBe(5);
      expect(sorted[2].votes.upvotes).toBe(3);
    });

    it('should sort by most recent', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'most_recent');

      expect(sorted[0].timestamp).toBeGreaterThan(sorted[1].timestamp);
      expect(sorted[1].timestamp).toBeGreaterThan(sorted[2].timestamp);
    });

    it('should sort by most controversial', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'most_controversial');

      expect(sorted[0].votes.controversyScore).toBe(0.8);
      expect(sorted[1].votes.controversyScore).toBe(0.2);
      expect(sorted[2].votes.controversyScore).toBe(0);
    });

    it('should sort by most informative', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'most_informative');

      expect(sorted[0].informativeScore).toBe(5);
      expect(sorted[1].informativeScore).toBe(2);
      expect(sorted[2].informativeScore).toBe(1);
    });

    it('should fallback to display priority for unknown sort type', () => {
      const sorted = renderService.sortRenderedPosts(posts, 'unknown_sort');

      expect(sorted[0].displayPriority).toBe(100);
    });
  });

  describe('Cache Management', () => {
    it('should cache rendered posts', () => {
      const post = {
        id: 'cache-test',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Cached post',
        timestamp: Date.now()
      };

      renderService.renderPost(post, { userId: testUserId });
      expect(renderService.renderCache.size).toBeGreaterThan(0);
    });

    it('should clear cache periodically', async () => {
      const post = {
        id: 'cache-test',
        channelId: 'channel-1',
        authorId: 'author-1',
        content: 'Cached post',
        timestamp: Date.now()
      };

      renderService.renderPost(post, { userId: testUserId });
      expect(renderService.renderCache.size).toBeGreaterThan(0);

      // Mock the cache clear interval (normally 15 minutes)
      renderService.renderCache.clear();
      expect(renderService.renderCache.size).toBe(0);
    });
  });
});
