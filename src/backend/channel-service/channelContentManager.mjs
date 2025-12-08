/**
 * @fileoverview Channel Content Management & Voting System
 * Handles videos, audio, polls, events with voting and search functionality
 */

class ChannelContentManager {
  constructor() {
    this.channelContent = new Map(); // channelId -> Array of content items
    this.contentVotes = new Map(); // contentId -> Map(userId -> vote)
    this.userVoteHistory = new Map(); // userId -> Array of vote records
    this.contentSearchIndex = new Map(); // searchTerm -> Set of contentIds
    this.contentMetadata = new Map(); // contentId -> metadata
  }

  /**
   * Add content to a channel
   */
  async addContent(channelId, userId, contentData) {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const content = {
      id: contentId,
      channelId,
      creatorId: userId,
      type: contentData.type, // 'video', 'audio', 'poll', 'event', 'text', 'image'
      title: contentData.title,
      description: contentData.description,
      content: contentData.content, // URL, text, or embedded data
      metadata: {
        fileSize: contentData.fileSize,
        duration: contentData.duration,
        format: contentData.format,
        thumbnailUrl: contentData.thumbnailUrl,
        tags: contentData.tags || []
      },
      createdAt: Date.now(),
      lastModified: Date.now(),
      voteScore: 0,
      viewCount: 0,
      interactionCount: 0,
      isActive: true
    };

    // Add to channel content
    if (!this.channelContent.has(channelId)) {
      this.channelContent.set(channelId, []);
    }
    this.channelContent.get(channelId).push(content);

    // Initialize voting
    this.contentVotes.set(contentId, new Map());
    this.contentMetadata.set(contentId, content.metadata);

    // Index for search
    this.indexContentForSearch(contentId, content);

    console.log(`📄 Added ${content.type} content to channel ${channelId}: ${content.title}`);
    return content;
  }

  /**
   * Vote on content (Facebook-like voting)
   */
  async voteOnContent(contentId, userId, voteType) {
    if (!['up', 'down', 'love', 'like', 'dislike'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    if (!this.contentVotes.has(contentId)) {
      throw new Error('Content not found');
    }

    const contentVotes = this.contentVotes.get(contentId);
    const previousVote = contentVotes.get(userId);

    // Record vote history
    if (!this.userVoteHistory.has(userId)) {
      this.userVoteHistory.set(userId, []);
    }

    const voteRecord = {
      contentId,
      voteType,
      timestamp: Date.now(),
      previousVote
    };

    this.userVoteHistory.get(userId).push(voteRecord);

    // Update vote
    contentVotes.set(userId, {
      type: voteType,
      timestamp: Date.now()
    });

    // Update content vote score
    this.updateContentVoteScore(contentId);

    console.log(`👍 User ${userId} voted ${voteType} on content ${contentId}`);
    return this.getContentVoteStats(contentId);
  }

  /**
   * Remove vote from content
   */
  async removeVote(contentId, userId) {
    if (!this.contentVotes.has(contentId)) {
      throw new Error('Content not found');
    }

    const contentVotes = this.contentVotes.get(contentId);
    if (contentVotes.has(userId)) {
      contentVotes.delete(userId);
      this.updateContentVoteScore(contentId);
      
      console.log(`🚫 User ${userId} removed vote from content ${contentId}`);
    }

    return this.getContentVoteStats(contentId);
  }

  /**
   * Search content within channels
   */
  searchContent(query, options = {}) {
    const {
      channelIds = null,
      contentTypes = null,
      sortBy = 'relevance', // 'relevance', 'votes', 'recent', 'views'
      limit = 50
    } = options;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const matchingContentIds = new Set();

    // Find matching content
    for (const term of searchTerms) {
      if (this.contentSearchIndex.has(term)) {
        for (const contentId of this.contentSearchIndex.get(term)) {
          matchingContentIds.add(contentId);
        }
      }
    }

    // Get content details and apply filters
    let results = [];
    for (const contentId of matchingContentIds) {
      const content = this.getContentById(contentId);
      if (!content) continue;

      // Apply filters
      if (channelIds && !channelIds.includes(content.channelId)) continue;
      if (contentTypes && !contentTypes.includes(content.type)) continue;

      results.push({
        ...content,
        voteStats: this.getContentVoteStats(contentId),
        relevanceScore: this.calculateRelevanceScore(content, searchTerms)
      });
    }

    // Sort results
    results = this.sortSearchResults(results, sortBy);

    return {
      results: results.slice(0, limit),
      total: results.length,
      query,
      searchTerms
    };
  }

  /**
   * Get content with filters
   */
  getChannelContent(channelId, options = {}) {
    const {
      contentTypes = null,
      sortBy = 'recent',
      limit = 100,
      offset = 0
    } = options;

    if (!this.channelContent.has(channelId)) {
      return { content: [], total: 0 };
    }

    let content = this.channelContent.get(channelId).filter(c => c.isActive);

    // Apply content type filter
    if (contentTypes && contentTypes.length > 0) {
      content = content.filter(c => contentTypes.includes(c.type));
    }

    // Add vote statistics
    content = content.map(c => ({
      ...c,
      voteStats: this.getContentVoteStats(c.id)
    }));

    // Sort content
    content = this.sortContent(content, sortBy);

    // Apply pagination
    const paginatedContent = content.slice(offset, offset + limit);

    return {
      content: paginatedContent,
      total: content.length,
      offset,
      limit
    };
  }

  /**
   * Get voting statistics for content
   */
  getContentVoteStats(contentId) {
    if (!this.contentVotes.has(contentId)) {
      return { total: 0, breakdown: {}, userVotes: 0 };
    }

    const votes = this.contentVotes.get(contentId);
    const breakdown = {};
    
    for (const vote of votes.values()) {
      breakdown[vote.type] = (breakdown[vote.type] || 0) + 1;
    }

    return {
      total: votes.size,
      breakdown,
      userVotes: votes.size,
      score: this.calculateContentScore(breakdown)
    };
  }

  /**
   * Update content vote score
   */
  updateContentVoteScore(contentId) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const voteStats = this.getContentVoteStats(contentId);
    content.voteScore = voteStats.score;
    content.interactionCount = voteStats.total;
  }

  /**
   * Index content for search
   */
  indexContentForSearch(contentId, content) {
    const searchableText = [
      content.title,
      content.description,
      content.content,
      ...(content.metadata.tags || [])
    ].join(' ').toLowerCase();

    const terms = searchableText.split(/\s+/).filter(term => term.length > 2);

    for (const term of terms) {
      if (!this.contentSearchIndex.has(term)) {
        this.contentSearchIndex.set(term, new Set());
      }
      this.contentSearchIndex.get(term).add(contentId);
    }
  }

  /**
   * Calculate relevance score for search
   */
  calculateRelevanceScore(content, searchTerms) {
    let score = 0;
    const contentText = [content.title, content.description, content.content].join(' ').toLowerCase();

    for (const term of searchTerms) {
      const termCount = (contentText.match(new RegExp(term, 'g')) || []).length;
      score += termCount * (content.title.toLowerCase().includes(term) ? 2 : 1);
    }

    // Boost score based on vote score and recency
    score += content.voteScore * 0.1;
    score += Math.max(0, 1 - (Date.now() - content.createdAt) / (7 * 24 * 60 * 60 * 1000)) * 0.5;

    return score;
  }

  /**
   * Sort search results
   */
  sortSearchResults(results, sortBy) {
    switch (sortBy) {
      case 'votes':
        return results.sort((a, b) => b.voteScore - a.voteScore);
      case 'recent':
        return results.sort((a, b) => b.createdAt - a.createdAt);
      case 'views':
        return results.sort((a, b) => b.viewCount - a.viewCount);
      case 'relevance':
      default:
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  /**
   * Sort channel content
   */
  sortContent(content, sortBy) {
    switch (sortBy) {
      case 'votes':
        return content.sort((a, b) => b.voteScore - a.voteScore);
      case 'views':
        return content.sort((a, b) => b.viewCount - a.viewCount);
      case 'interactions':
        return content.sort((a, b) => b.interactionCount - a.interactionCount);
      case 'recent':
      default:
        return content.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  /**
   * Calculate content score from vote breakdown
   */
  calculateContentScore(breakdown) {
    const weights = {
      'love': 3,
      'like': 2,
      'up': 1,
      'down': -1,
      'dislike': -2
    };

    let score = 0;
    for (const [voteType, count] of Object.entries(breakdown)) {
      score += (weights[voteType] || 0) * count;
    }

    return score;
  }

  /**
   * Get content by ID
   */
  getContentById(contentId) {
    for (const contentArray of this.channelContent.values()) {
      const content = contentArray.find(c => c.id === contentId);
      if (content) return content;
    }
    return null;
  }

  /**
   * Record content view
   */
  recordView(contentId, userId) {
    const content = this.getContentById(contentId);
    if (content) {
      content.viewCount = (content.viewCount || 0) + 1;
      console.log(`👁️ User ${userId} viewed content ${contentId}`);
    }
  }

  /**
   * Get user's content interaction history
   */
  getUserContentHistory(userId) {
    return this.userVoteHistory.get(userId) || [];
  }
}

export default ChannelContentManager;
