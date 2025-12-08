/**
 * @fileoverview Newsfeed Vote Engine
 * Handles voting, scoring, and ranking for newsfeed posts
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';

const newsfeedLogger = logger.child({ module: 'newsfeed-vote-engine' });

class NewsfeedVoteEngine {
  constructor() {
    this.posts = new Map(); // Map(postId -> postData)
    this.votes = new Map(); // Map(postId -> Map(userId -> voteData))
    this.userVoteHistory = new Map(); // Map(userId -> Array of vote records)
    this.channelPosts = new Map(); // Map(channelId -> Array of postIds)
    this.userPosts = new Map(); // Map(userId -> Map(channelId -> postId))
    this.bookmarks = new Map(); // Map(userId -> Set(postIds))
    this.pinnedPosts = new Map(); // Map(channelId -> pinnedPostData)
    
    this.initialized = false;
  }

  /**
   * Initialize the newsfeed vote engine
   */
  async initialize() {
    try {
      await this.loadVoteData();
      this.setupEventHandlers();
      this.initialized = true;
      newsfeedLogger.info('Newsfeed Vote Engine initialized');
    } catch (error) {
      newsfeedLogger.error('Failed to initialize newsfeed vote engine', { error: error.message });
      throw error;
    }
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    const self = this;
    eventBus.on('user:vote-changed', (eventData) => self.handleUserVoteChange(eventData));
    eventBus.on('channel:supporter-removed', (eventData) => self.handleSupporterRemoved(eventData));
    eventBus.on('post:informative-tagged', (eventData) => self.handleInformativeTag(eventData));
  }

  /**
   * Create a newsfeed post
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID (must be a channel supporter)
   * @param {Object} postData - Post content and metadata
   */
  async createPost(channelId, userId, postData) {
    if (!this.initialized) {
      throw new Error('NewsfeedVoteEngine not initialized');
    }

    // Verify user is a channel supporter (voted for the channel)
    const isSupporter = await this.verifyChannelSupporter(channelId, userId);
    if (!isSupporter) {
      throw new Error('Only channel supporters can post to newsfeed');
    }

    // Check if user already has a post in this channel
    const existingPostId = this.getUserPostInChannel(userId, channelId);
    if (existingPostId) {
      throw new Error('User already has a post in this channel newsfeed');
    }

    const postId = `post_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const post = {
      id: postId,
      channelId,
      authorId: userId,
      content: postData.content,
      title: postData.title || '',
      type: postData.type || 'text',
      mediaAttachment: postData.mediaAttachment || null,
      tags: postData.tags || [],
      isInformative: false,
      informativeCount: 0,
      createdAt: Date.now(),
      lastModified: Date.now(),
      
      // Vote tracking
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      voteScore: 0,
      controversyScore: 0,
      
      // Engagement tracking
      viewCount: 0,
      shareCount: 0,
      bookmarkCount: 0,
      
      // Status
      isActive: true,
      isCollapsed: false,
      moderationFlags: []
    };

    // Store post
    this.posts.set(postId, post);
    this.votes.set(postId, new Map());
    
    // Update indexes
    if (!this.channelPosts.has(channelId)) {
      this.channelPosts.set(channelId, []);
    }
    this.channelPosts.get(channelId).push(postId);
    
    if (!this.userPosts.has(userId)) {
      this.userPosts.set(userId, new Map());
    }
    this.userPosts.get(userId).set(channelId, postId);

    newsfeedLogger.info('Created newsfeed post', { postId, channelId, userId });
    
    // Emit event for real-time updates
    eventBus.emit('newsfeed:post-created', { postId, channelId, userId, post });
    
    return post;
  }

  /**
   * Vote on a newsfeed post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {string} voteType - 'up' or 'down'
   */
  async voteOnPost(postId, userId, voteType) {
    if (!this.initialized) {
      throw new Error('NewsfeedVoteEngine not initialized');
    }

    if (!['up', 'down'].includes(voteType)) {
      throw new Error('Invalid vote type. Must be "up" or "down"');
    }

    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Verify user is a channel supporter
    const isSupporter = await this.verifyChannelSupporter(post.channelId, userId);
    if (!isSupporter) {
      throw new Error('Only channel supporters can vote on newsfeed posts');
    }

    // Check if user is voting on their own post
    if (post.authorId === userId) {
      throw new Error('Users cannot vote on their own posts');
    }

    const postVotes = this.votes.get(postId);
    const previousVote = postVotes.get(userId);

    // Record vote history
    const voteRecord = {
      postId,
      channelId: post.channelId,
      voteType,
      timestamp: Date.now(),
      previousVote: previousVote?.type || null
    };

    if (!this.userVoteHistory.has(userId)) {
      this.userVoteHistory.set(userId, []);
    }
    this.userVoteHistory.get(userId).push(voteRecord);

    // Update vote
    if (previousVote && previousVote.type === voteType) {
      // Remove vote (toggle off)
      postVotes.delete(userId);
      newsfeedLogger.info('Removed vote', { postId, userId, voteType });
    } else {
      // Add or change vote
      postVotes.set(userId, {
        type: voteType,
        timestamp: Date.now()
      });
      newsfeedLogger.info('Added/changed vote', { postId, userId, voteType, previousVote: previousVote?.type });
    }

    // Recalculate post scores
    this.updatePostScores(postId);

    // Emit event for real-time updates
    eventBus.emit('newsfeed:vote-updated', { postId, userId, voteType, post });

    return this.getPostVoteStats(postId);
  }

  /**
   * Tag a post as informative
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   */
  async tagAsInformative(postId, userId) {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Verify user is a channel supporter
    const isSupporter = await this.verifyChannelSupporter(post.channelId, userId);
    if (!isSupporter) {
      throw new Error('Only channel supporters can tag posts as informative');
    }

    post.informativeCount++;
    post.isInformative = post.informativeCount >= 3; // Require 3+ tags to mark as informative

    newsfeedLogger.info('Tagged post as informative', { postId, userId, count: post.informativeCount });
    
    eventBus.emit('post:informative-tagged', { postId, userId, post });
    
    return post;
  }

  /**
   * Update post if user changes/revokes their channel vote
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   */
  async handleUserVoteChange(eventData) {
    const { userId, channelId, newVoteType } = eventData;
    
    // If user revoked vote or changed vote, remove their newsfeed post
    if (!newVoteType || newVoteType === 'revoked') {
      const postId = this.getUserPostInChannel(userId, channelId);
      if (postId) {
        await this.removePost(postId, 'User vote revoked');
      }
    }
  }

  /**
   * Handle when a supporter is removed from a channel
   * @param {Object} eventData - Event data containing channelId and userId
   */
  async handleSupporterRemoved(eventData) {
    const { channelId, userId } = eventData;
    
    // Remove any posts by this user in the channel
    const postId = this.getUserPostInChannel(userId, channelId);
    if (postId) {
      await this.removePost(postId, 'User removed as channel supporter');
    }
    
    newsfeedLogger.info('Handled supporter removal', { channelId, userId });
  }

  /**
   * Handle when a post is tagged as informative
   * @param {Object} eventData - Event data containing postId and userId
   */
  async handleInformativeTag(eventData) {
    const { postId, userId } = eventData;
    
    const post = this.posts.get(postId);
    if (!post) {
      return;
    }

    // Add informative tag to post metadata
    if (!post.tags) {
      post.tags = [];
    }
    
    if (!post.tags.includes('informative')) {
      post.tags.push('informative');
      post.lastModified = Date.now();
      post.informativeTaggedBy = userId;
      
      newsfeedLogger.info('Post tagged as informative', { postId, userId });
    }
  }

  /**
   * Remove a post
   * @param {string} postId - Post ID
   * @param {string} reason - Reason for removal
   */
  async removePost(postId, reason = 'Manual removal') {
    const post = this.posts.get(postId);
    if (!post) {
      return false;
    }

    // Mark as inactive instead of deleting (for audit trail)
    post.isActive = false;
    post.removalReason = reason;
    post.removedAt = Date.now();

    // Remove from channel posts index
    const channelPosts = this.channelPosts.get(post.channelId);
    if (channelPosts) {
      const index = channelPosts.indexOf(postId);
      if (index > -1) {
        channelPosts.splice(index, 1);
      }
    }

    // Remove from user posts index
    const userChannelPosts = this.userPosts.get(post.authorId);
    if (userChannelPosts) {
      userChannelPosts.delete(post.channelId);
    }

    newsfeedLogger.info('Removed newsfeed post', { postId, reason });
    
    eventBus.emit('newsfeed:post-removed', { postId, post, reason });
    
    return true;
  }

  /**
   * Update post scores
   * @param {string} postId - Post ID
   */
  updatePostScores(postId) {
    const post = this.posts.get(postId);
    const votes = this.votes.get(postId);

    // Count votes
    let upvotes = 0;
    let downvotes = 0;
    for (const vote of votes.values()) {
      if (vote.type === 'up') upvotes++;
      else if (vote.type === 'down') downvotes++;
    }

    // Update post stats
    post.upvotes = upvotes;
    post.downvotes = downvotes;
    post.totalVotes = upvotes + downvotes;
    post.voteScore = upvotes - downvotes;

    // Calculate controversy score (high when votes are split)
    const total = upvotes + downvotes;
    if (total > 0) {
      const upvoteRatio = upvotes / total;
      post.controversyScore = 4 * upvoteRatio * (1 - upvoteRatio);
    } else {
      post.controversyScore = 0;
    }

    this.posts.set(postId, post);
  }

  /**
   * Get posts for a channel with sorting and filtering
   * @param {string} channelId - Channel ID
   * @param {Object} options - Sorting and filtering options
   */
  async getChannelPosts(channelId, options = {}) {
    if (!this.initialized) {
      throw new Error('NewsfeedVoteEngine not initialized');
    }

    const {
      sortBy = 'most_upvoted',
      limit = 20,
      offset = 0,
      hideCollapsed = false,
      mediaOnly = false,
      userId = null
    } = options;

    // Get all posts for channel
    const postIds = this.channelPosts.get(channelId) || [];
    let posts = postIds.map(id => {
      const post = this.posts.get(id);
      if (!post || !post.isActive) return null;

      // Get vote counts
      const votes = this.votes.get(id) || new Map();
      const upvotes = Array.from(votes.values()).filter(v => v.type === 'up').length;
      const downvotes = Array.from(votes.values()).filter(v => v.type === 'down').length;

      return {
        ...post,
        upvotes,
        downvotes,
        voteScore: upvotes - downvotes,
        controversyScore: Math.min(upvotes, downvotes),
        isCollapsed: downvotes > upvotes * 2 || post.isCollapsed
      };
    }).filter(Boolean);

    // Apply filters
    if (hideCollapsed) {
      posts = posts.filter(post => !post.isCollapsed);
    }
    if (mediaOnly) {
      posts = posts.filter(post => post.mediaAttachment);
    }

    // Apply sorting
    switch (sortBy) {
      case 'most_upvoted':
        posts.sort((a, b) => b.upvotes - a.upvotes || b.createdAt - a.createdAt);
        break;
      case 'most_recent':
      case 'newest':
        posts.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'controversial':
        posts.sort((a, b) => b.controversyScore - a.controversyScore || b.createdAt - a.createdAt);
        break;
      case 'informative':
        posts.sort((a, b) => b.informativeCount - a.informativeCount || b.createdAt - a.createdAt);
        break;
      default:
        posts.sort((a, b) => b.voteScore - a.voteScore || b.createdAt - a.createdAt);
    }

    // Handle pinned posts
    const pinnedPost = this.pinnedPosts.get(channelId);
    if (pinnedPost && !hideCollapsed) {
      const pinnedPostData = this.posts.get(pinnedPost.postId);
      if (pinnedPostData && pinnedPostData.isActive) {
        // Remove pinned post from current position
        posts = posts.filter(p => p.id !== pinnedPost.postId);
        
        // Add pinned post at the beginning with additional properties
        const votes = this.votes.get(pinnedPost.postId) || new Map();
        const upvotes = Array.from(votes.values()).filter(v => v.type === 'up').length;
        const downvotes = Array.from(votes.values()).filter(v => v.type === 'down').length;

        posts.unshift({
          ...pinnedPostData,
          upvotes,
          downvotes,
          voteScore: upvotes - downvotes,
          controversyScore: Math.min(upvotes, downvotes),
          isPinned: true,
          displayPriority: 2000,
          pinnedBy: pinnedPost.pinnedBy,
          pinnedAt: pinnedPost.pinnedAt,
          pinExpiresAt: pinnedPost.expiresAt
        });
      }
    }

    // Add user-specific data if userId provided
    if (userId) {
      posts = posts.map(post => ({
        ...post,
        userVote: this.votes.get(post.id)?.get(userId)?.type || null,
        isBookmarked: this.bookmarks.get(userId)?.has(post.id) || false
      }));
    }

    return {
      posts: posts.slice(offset, offset + limit),
      totalCount: posts.length
    };
  }

  /**
   * Search posts by content or tags
   * @param {Array} posts - Posts to search
   * @param {string} query - Search query
   */
  searchPosts(posts, query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return posts.filter(post => {
      const searchableText = [
        post.title || '',
        post.content || '',
        ...(post.tags || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Search posts in a channel
   * @param {string} channelId - Channel ID
   * @param {Object} searchOptions - Search options
   */
  async searchPosts(channelId, searchOptions = {}) {
    const { query, tags = [], limit = 20, offset = 0 } = searchOptions;
    
    const channelPostIds = this.channelPosts.get(channelId) || [];
    let posts = channelPostIds.map(id => this.posts.get(id)).filter(Boolean);

    // Filter by search query
    if (query) {
      posts = posts.filter(post => 
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by tags
    if (tags.length > 0) {
      posts = posts.filter(post => 
        tags.some(tag => post.tags.includes(tag))
      );
    }

    // Apply pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    
    return posts.slice(start, end);
  }

  /**
   * Get user bookmarks
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   */
  async getUserBookmarks(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const userBookmarks = this.bookmarks.get(userId);
    if (!userBookmarks) {
      return [];
    }

    const bookmarkedPostIds = Array.from(userBookmarks);
    const posts = bookmarkedPostIds
      .map(id => this.posts.get(id))
      .filter(Boolean);

    // Apply pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    
    return posts.slice(start, end);
  }

  /**
   * Apply filters to posts
   * @param {Array} posts - Posts to filter
   * @param {Object} filters - Filter criteria
   * @param {string} userId - Current user ID
   */
  applyFilters(posts, filters, userId) {
    let filtered = posts;

    // Media only filter
    if (filters.mediaOnly) {
      filtered = filtered.filter(post => post.mediaAttachment !== null);
    }

    // Hide low-ranked filter
    if (filters.hideLowRanked) {
      filtered = filtered.filter(post => post.voteScore >= -5);
    }

    // Hide collapsed filter
    if (filters.hideCollapsed) {
      filtered = filtered.filter(post => !post.isCollapsed);
    }

    // Show bookmarked only
    if (filters.bookmarkedOnly && userId) {
      const userBookmarks = this.bookmarks.get(userId) || new Set();
      filtered = filtered.filter(post => userBookmarks.has(post.id));
    }

    // Informative only filter
    if (filters.informativeOnly) {
      filtered = filtered.filter(post => post.isInformative);
    }

    return filtered;
  }

  /**
   * Sort posts by criteria
   * @param {Array} posts - Posts to sort
   * @param {string} sortBy - Sort criteria
   */
  sortPosts(posts, sortBy) {
    switch (sortBy) {
      case 'most_upvoted':
        return posts.sort((a, b) => b.voteScore - a.voteScore);
      
      case 'most_recent':
      case 'newest':
        return posts.sort((a, b) => b.createdAt - a.createdAt);
      
      case 'most_controversial':
      case 'controversial':
        return posts.sort((a, b) => b.controversyScore - a.controversyScore);
      
      case 'most_informative':
      case 'informative':
        return posts.sort((a, b) => {
          if (a.isInformative && !b.isInformative) return -1;
          if (!a.isInformative && b.isInformative) return 1;
          return b.informativeCount - a.informativeCount;
        });
      
      default:
        return posts.sort((a, b) => b.voteScore - a.voteScore);
    }
  }
  /**
   * Enrich posts with user-specific data and pinned status
   * @param {Array} posts - Posts to enrich
   * @param {string} userId - User ID
   */
  async enrichPostsWithUserData(posts, userId) {
    const userBookmarks = this.bookmarks.get(userId) || new Set();
    
    return posts.map(post => {
      // Check if this post is pinned in its channel
      const pinnedPost = this.pinnedPosts.get(post.channelId);
      const isPinned = pinnedPost && pinnedPost.postId === post.id;
      
      return {
        ...post,
        userVote: this.votes.get(post.id)?.get(userId)?.type || null,
        isBookmarked: userBookmarks.has(post.id),
        canEdit: post.authorId === userId,
        canVote: post.authorId !== userId,
        isPinned: isPinned || false,
        displayPriority: isPinned ? 2000 : post.voteScore // Higher priority for pinned posts
      };
    });
  }

  /**
   * Bookmark/unbookmark a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   */
  async toggleBookmark(postId, userId) {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (!this.bookmarks.has(userId)) {
      this.bookmarks.set(userId, new Set());
    }

    const userBookmarks = this.bookmarks.get(userId);
    const isBookmarked = userBookmarks.has(postId);

    if (isBookmarked) {
      userBookmarks.delete(postId);
      post.bookmarkCount = Math.max(0, post.bookmarkCount - 1);
    } else {
      userBookmarks.add(postId);
      post.bookmarkCount++;
    }

    newsfeedLogger.info('Toggled bookmark', { postId, userId, isBookmarked: !isBookmarked });
    
    return !isBookmarked;
  }

  /**
   * Pin a post to the top of the channel
   * @param {string} channelId - Channel ID
   * @param {string} postId - Post ID
   * @param {string} pinnedByUserId - User who pinned the post
   */
  async pinPost(channelId, postId, pinnedByUserId) {
    const post = this.posts.get(postId);
    if (!post || post.channelId !== channelId) {
      throw new Error('Post not found in channel');
    }

    // Check if there's already a pinned post
    const existingPin = this.pinnedPosts.get(channelId);
    if (existingPin) {
      // Unpin the existing post first
      await this.unpinPost(channelId);
    }

    const pinData = {
      postId,
      pinnedBy: pinnedByUserId,
      pinnedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.pinnedPosts.set(channelId, pinData);
    
    // Update the post object to include pinned status
    post.isPinned = true;
    post.pinnedBy = pinnedByUserId;
    post.pinnedAt = pinData.pinnedAt;
    post.pinExpiresAt = pinData.expiresAt;
    post.displayPriority = 2000;
    
    newsfeedLogger.info('Pinned post', { channelId, postId, pinnedBy: pinnedByUserId });
    
    eventBus.emit('newsfeed:post-pinned', { channelId, postId, pinData });
    
    return {
      success: true,
      isPinned: true,
      pinData
    };
  }

  /**
   * Unpin a post
   * @param {string} channelId - Channel ID
   */
  async unpinPost(channelId) {
    const pinData = this.pinnedPosts.get(channelId);
    if (!pinData) {
      return false;
    }

    this.pinnedPosts.delete(channelId);
    
    newsfeedLogger.info('Unpinned post', { channelId, postId: pinData.postId });
    
    eventBus.emit('newsfeed:post-unpinned', { channelId, postId: pinData.postId });
    
    return true;
  }

  /**
   * Get pinned post for a channel
   * @param {string} channelId - Channel ID
   */
  getPinnedPost(channelId) {
    const pinData = this.pinnedPosts.get(channelId);
    if (!pinData) {
      return null;
    }

    // Check if pin has expired
    if (Date.now() > pinData.expiresAt) {
      this.unpinPost(channelId);
      return null;
    }

    const post = this.posts.get(pinData.postId);
    if (!post || !post.isActive) {
      this.unpinPost(channelId);
      return null;
    }

    return {
      ...post,
      pinData
    };
  }

  /**
   * Helper methods
   */
  
  async verifyChannelSupporter(channelId, userId) {
    // This would integrate with the channel voting system
    // For now, return true (implement actual verification later)
    return true;
  }

  getUserPostInChannel(userId, channelId) {
    const userChannelPosts = this.userPosts.get(userId);
    return userChannelPosts ? userChannelPosts.get(channelId) : null;
  }

  getPostVoteStats(postId) {
    const post = this.posts.get(postId);
    if (!post) return null;

    return {
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      totalVotes: post.totalVotes,
      voteScore: post.voteScore,
      controversyScore: post.controversyScore
    };
  }

  async loadVoteData() {
    // Load from persistent storage if needed
    newsfeedLogger.info('Loaded newsfeed vote data (in-memory storage)');
  }

  async saveVoteData() {
    // Save to persistent storage if needed
    newsfeedLogger.info('Saved newsfeed vote data (in-memory storage)');
  }

  /**
   * Reset all data (for testing purposes)
   */
  reset() {
    this.posts.clear();
    this.votes.clear();
    this.userVoteHistory.clear();
    this.channelPosts.clear();
    this.userPosts.clear();
    this.bookmarks.clear();
    this.pinnedPosts.clear();
    newsfeedLogger.info('Reset newsfeed vote engine data');
  }

  /**
   * Reset data for a specific channel (for testing purposes)
   */
  resetChannel(channelId) {
    // Remove all posts for this channel
    const postIds = this.channelPosts.get(channelId) || [];
    postIds.forEach(postId => {
      this.posts.delete(postId);
      this.votes.delete(postId);
    });
    
    // Clear channel data
    this.channelPosts.delete(channelId);
    this.pinnedPosts.delete(channelId);
    
    // Clear user posts for this channel
    for (const [userId, userChannelPosts] of this.userPosts.entries()) {
      userChannelPosts.delete(channelId);
      if (userChannelPosts.size === 0) {
        this.userPosts.delete(userId);
      }
    }
    
    newsfeedLogger.info('Reset channel data', { channelId });
  }
}

export default new NewsfeedVoteEngine();
