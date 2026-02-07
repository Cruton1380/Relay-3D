/**
 * @fileoverview Content Voting Service for Channel Content
 * Enhanced voting system for videos, audio, polls, events, and messages
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { notificationManager } from '../notifications/notificationManager.mjs';

const contentVotingLogger = logger.child({ module: 'content-voting' });

class ContentVotingService {
  constructor() {
    this.contentVotes = new Map(); // contentId -> Map(userId -> vote)
    this.contentScores = new Map(); // contentId -> { upvotes, downvotes, score, ranking }
    this.userVoteHistory = new Map(); // userId -> Set(contentIds)
    this.trendingContent = new Map(); // channelId -> Array(trending content)
    this.contentMetadata = new Map(); // contentId -> content metadata
    
    this.initialized = false;
  }

  /**
   * Initialize the content voting service
   */
  async initialize() {
    try {
      await this.loadVoteData();
      
      // Start trending content update timer
      this.trendingUpdateTimer = setInterval(() => {
        this.updateTrendingContent();
      }, 5 * 60 * 1000); // Update every 5 minutes
      
      this.initialized = true;
      contentVotingLogger.info('Content Voting Service initialized');
    } catch (error) {
      contentVotingLogger.error('Failed to initialize content voting service', { error: error.message });
      throw error;
    }
  }
  /**
   * Cast a vote on content
   * @param {string} userId - User ID
   * @param {string} contentId - Content ID
   * @param {string} voteType - 'upvote', 'downvote', or 'remove'
   * @param {string} channelId - Channel ID for context
   */
  async castVote(userId, contentId, voteType, channelId) {    if (!userId || !contentId || !voteType) {
      throw new Error('Missing required parameters: userId, contentId, and voteType are required');
    }

    if (!this.initialized) throw new Error('Content voting service not initialized');

    try {
      // Validate vote type
      if (!['upvote', 'downvote', 'remove'].includes(voteType)) {
        throw new Error('Invalid vote type. Must be "upvote", "downvote", or "remove"');
      }

      // Store minimal content metadata if not exists
      if (!this.contentMetadata.has(contentId)) {
        this.contentMetadata.set(contentId, {
          id: contentId,
          channelId: channelId,
          createdAt: Date.now()
        });
      }      // Get existing votes for this content
      if (!this.contentVotes.has(contentId)) {
        this.contentVotes.set(contentId, new Map());
      }
      const contentVoteMap = this.contentVotes.get(contentId);

      // Get existing vote before any modifications
      const existingVote = contentVoteMap.get(userId);
      let wasRemoved = false;

      // Handle remove vote type
      if (voteType === 'remove') {
        if (existingVote) {
          contentVoteMap.delete(userId);
          
          // Remove from user history
          const userHistory = this.userVoteHistory.get(userId) || new Set();
          userHistory.delete(contentId);
          if (userHistory.size === 0) {
            this.userVoteHistory.delete(userId);
          }

          wasRemoved = true;
          contentVotingLogger.info('Vote removed', { userId, contentId, previousVote: existingVote.voteType });
        }
      } else {
        // Check if user already voted
        if (existingVote && existingVote.voteType === voteType) {
          // Same vote - remove it (toggle off)
          contentVoteMap.delete(userId);
          
          // Remove from user history
          const userHistory = this.userVoteHistory.get(userId) || new Set();
          userHistory.delete(contentId);
          if (userHistory.size === 0) {
            this.userVoteHistory.delete(userId);
          }

          wasRemoved = true;
          contentVotingLogger.info('Vote removed', { userId, contentId, voteType });
        } else {
          // New vote or changing vote
          const vote = {
            userId,
            contentId,
            voteType,
            timestamp: Date.now(),
            channelId: channelId
          };

          contentVoteMap.set(userId, vote);
          
          // Update user history
          if (!this.userVoteHistory.has(userId)) {
            this.userVoteHistory.set(userId, new Set());
          }
          this.userVoteHistory.get(userId).add(contentId);

          contentVotingLogger.info('Vote cast', { userId, contentId, voteType, previousVote: existingVote?.voteType });
        }
      }      // Recalculate content score
      const updatedScore = this.calculateContentScore(contentId);

      // Update trending if significant vote change
      if (channelId) {
        this.updateChannelTrending(channelId);
      }

      // Get stored content metadata for author notification
      const contentMetadata = this.contentMetadata.get(contentId);
      
      // Notify content author if it's an upvote from someone else
      if (voteType === 'upvote' && !wasRemoved && contentMetadata && userId !== contentMetadata.authorId) {
        await this.notifyContentAuthor(contentMetadata.authorId, contentId, contentMetadata, userId);
      }      return {
        success: true,
        contentId,
        voteType,
        removed: wasRemoved,
        voteScore: updatedScore.score,
        ...updatedScore
      };
    } catch (error) {
      contentVotingLogger.error('Failed to cast vote', { 
        error: error.message, 
        userId, 
        contentId, 
        voteType 
      });
      throw error;
    }
  }
  /**
   * Get vote score and details for content
   * @param {string} contentId - Content ID
   * @returns {Object} Vote score details
   */
  getContentScore(contentId) {
    return this.calculateContentScore(contentId);
  }

  /**
   * Get content votes with voteScore property (alias for getContentScore)
   * @param {string} contentId - Content ID
   * @returns {Object} Vote details with voteScore
   */
  getContentVotes(contentId) {
    const scoreData = this.calculateContentScore(contentId);
    return {
      ...scoreData,
      voteScore: scoreData.score
    };
  }

  /**
   * Calculate content score based on votes
   * @param {string} contentId - Content ID
   * @returns {Object} Score details
   */
  calculateContentScore(contentId) {
    const votes = this.contentVotes.get(contentId) || new Map();
    
    let upvotes = 0;
    let downvotes = 0;
    
    for (const vote of votes.values()) {
      if (vote.voteType === 'upvote') {
        upvotes++;
      } else if (vote.voteType === 'downvote') {
        downvotes++;
      }
    }

    const totalVotes = upvotes + downvotes;
    const score = upvotes - downvotes;
    const ratio = totalVotes > 0 ? upvotes / totalVotes : 0;

    // Wilson score for better ranking
    const wilsonScore = this.calculateWilsonScore(upvotes, totalVotes);

    const scoreData = {
      upvotes,
      downvotes,
      totalVotes,
      score,
      ratio,
      wilsonScore,
      lastUpdated: Date.now()
    };

    this.contentScores.set(contentId, scoreData);
    return scoreData;
  }

  /**
   * Calculate Wilson score confidence interval for better ranking
   * @param {number} upvotes - Number of upvotes
   * @param {number} totalVotes - Total number of votes
   * @returns {number} Wilson score
   */
  calculateWilsonScore(upvotes, totalVotes) {
    if (totalVotes === 0) return 0;

    const z = 1.96; // 95% confidence
    const phat = upvotes / totalVotes;
    
    const wilson = (phat + z * z / (2 * totalVotes) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * totalVotes)) / totalVotes)) / (1 + z * z / totalVotes);
    
    return Math.max(0, wilson);
  }

  /**
   * Get user's vote for specific content
   * @param {string} userId - User ID
   * @param {string} contentId - Content ID
   * @returns {Object|null} User's vote or null
   */
  getUserVote(userId, contentId) {
    const contentVotes = this.contentVotes.get(contentId);
    return contentVotes ? contentVotes.get(userId) : null;
  }

  /**
   * Get trending content for a channel
   * @param {string} channelId - Channel ID
   * @param {Object} options - Filtering options
   * @returns {Array} Trending content list
   */
  getTrendingContent(channelId, options = {}) {
    const {
      limit = 20,
      timeWindow = 24 * 60 * 60 * 1000, // 24 hours
      contentType = null,
      minScore = 1
    } = options;

    const now = Date.now();
    const cutoffTime = now - timeWindow;
    
    // Get all content for this channel
    const channelContent = [];
    
    for (const [contentId, metadata] of this.contentMetadata) {
      if (metadata.channelId === channelId && metadata.createdAt >= cutoffTime) {
        if (contentType && metadata.type !== contentType) continue;
        
        const score = this.getContentScore(contentId);
        if (score.score >= minScore) {
          channelContent.push({
            ...metadata,
            ...score,
            contentId
          });
        }
      }
    }

    // Sort by Wilson score for better trending algorithm
    channelContent.sort((a, b) => {
      // Primary sort: Wilson score (accounts for confidence)
      const scoreDiff = b.wilsonScore - a.wilsonScore;
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
      
      // Secondary sort: Recent activity (for equal scores)
      return b.lastUpdated - a.lastUpdated;
    });

    return channelContent.slice(0, limit);
  }

  /**
   * Search content by vote score and other criteria
   * @param {Object} searchCriteria - Search criteria
   * @returns {Array} Search results
   */
  searchContent(searchCriteria) {
    const {
      channelId = null,
      contentType = null,
      minScore = null,
      maxScore = null,
      authorId = null,
      tags = [],
      timeRange = null,
      sortBy = 'score', // 'score', 'recent', 'votes', 'wilson'
      sortOrder = 'desc',
      limit = 50
    } = searchCriteria;

    let results = [];

    // Filter content
    for (const [contentId, metadata] of this.contentMetadata) {
      // Channel filter
      if (channelId && metadata.channelId !== channelId) continue;
      
      // Content type filter
      if (contentType && metadata.type !== contentType) continue;
      
      // Author filter
      if (authorId && metadata.authorId !== authorId) continue;
      
      // Time range filter
      if (timeRange) {
        const { startTime, endTime } = timeRange;
        if (startTime && metadata.createdAt < startTime) continue;
        if (endTime && metadata.createdAt > endTime) continue;
      }
      
      // Tags filter
      if (tags.length > 0) {
        const hasMatchingTag = tags.some(tag => 
          metadata.tags && metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) continue;
      }

      const score = this.getContentScore(contentId);
      
      // Score filters
      if (minScore !== null && score.score < minScore) continue;
      if (maxScore !== null && score.score > maxScore) continue;

      results.push({
        ...metadata,
        ...score,
        contentId
      });
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'score':
          comparison = b.score - a.score;
          break;
        case 'recent':
          comparison = b.createdAt - a.createdAt;
          break;
        case 'votes':
          comparison = b.totalVotes - a.totalVotes;
          break;
        case 'wilson':
          comparison = b.wilsonScore - a.wilsonScore;
          break;
        default:
          comparison = b.score - a.score;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return results.slice(0, limit);
  }

  /**
   * Get content ranking within a channel
   * @param {string} channelId - Channel ID
   * @param {string} contentType - Optional content type filter
   * @returns {Array} Ranked content list
   */
  getContentRanking(channelId, contentType = null) {
    const searchCriteria = {
      channelId,
      contentType,
      sortBy: 'wilson',
      limit: 100
    };
    
    const rankedContent = this.searchContent(searchCriteria);
    
    // Add ranking position
    return rankedContent.map((content, index) => ({
      ...content,
      rank: index + 1
    }));
  }

  /**
   * Update trending content for a channel
   * @param {string} channelId - Channel ID
   */
  updateChannelTrending(channelId) {
    try {
      const trending = this.getTrendingContent(channelId, {
        limit: 10,
        timeWindow: 6 * 60 * 60 * 1000 // 6 hours for trending
      });
      
      this.trendingContent.set(channelId, trending);
      
      contentVotingLogger.debug('Updated trending content', { 
        channelId, 
        trendingCount: trending.length 
      });
    } catch (error) {
      contentVotingLogger.error('Failed to update trending content', { 
        error: error.message, 
        channelId 
      });
    }
  }

  /**
   * Update all trending content
   */
  updateTrendingContent() {
    const channels = new Set();
    
    // Get all channels that have content
    for (const metadata of this.contentMetadata.values()) {
      if (metadata.channelId) {
        channels.add(metadata.channelId);
      }
    }
    
    // Update trending for each channel
    for (const channelId of channels) {
      this.updateChannelTrending(channelId);
    }
    
    contentVotingLogger.debug('Updated trending content for all channels', { 
      channelCount: channels.size 
    });
  }

  /**
   * Notify content author of upvote
   * @param {string} authorId - Content author ID
   * @param {string} contentId - Content ID
   * @param {Object} contentInfo - Content information
   * @param {string} voterId - User who voted
   */
  async notifyContentAuthor(authorId, contentId, contentInfo, voterId) {
    try {
      await notificationManager.createNotification({
        userId: authorId,
        type: 'content_upvote',
        title: 'Your content received an upvote!',
        message: `Someone liked your ${contentInfo.type}${contentInfo.title ? `: "${contentInfo.title}"` : ''}`,
        data: {
          contentId,
          contentType: contentInfo.type,
          channelId: contentInfo.channelId,
          voterId,
          timestamp: Date.now()
        },
        priority: 'low'
      });
    } catch (error) {
      contentVotingLogger.error('Failed to notify content author', { 
        error: error.message, 
        authorId, 
        contentId 
      });
    }
  }

  /**
   * Get vote statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} User vote statistics
   */
  getUserVoteStats(userId) {
    const userHistory = this.userVoteHistory.get(userId) || new Set();
    let upvotesGiven = 0;
    let downvotesGiven = 0;
    let upvotesReceived = 0;
    let downvotesReceived = 0;

    // Count votes given
    for (const contentId of userHistory) {
      const vote = this.getUserVote(userId, contentId);
      if (vote) {
        if (vote.voteType === 'upvote') upvotesGiven++;
        else if (vote.voteType === 'downvote') downvotesGiven++;
      }
    }

    // Count votes received on user's content
    for (const [contentId, metadata] of this.contentMetadata) {
      if (metadata.authorId === userId) {
        const votes = this.contentVotes.get(contentId) || new Map();
        for (const vote of votes.values()) {
          if (vote.voteType === 'upvote') upvotesReceived++;
          else if (vote.voteType === 'downvote') downvotesReceived++;
        }
      }
    }

    return {
      given: {
        upvotes: upvotesGiven,
        downvotes: downvotesGiven,
        total: upvotesGiven + downvotesGiven
      },
      received: {
        upvotes: upvotesReceived,
        downvotes: downvotesReceived,
        total: upvotesReceived + downvotesReceived,
        score: upvotesReceived - downvotesReceived
      },
      contentVoted: userHistory.size
    };
  }

  /**
   * Load vote data from storage
   */
  async loadVoteData() {
    // Implementation would load from persistent storage
    // For now, initialize empty data structures
    contentVotingLogger.info('Content vote data loaded', {
      contentVotes: this.contentVotes.size,
      contentScores: this.contentScores.size,
      userHistory: this.userVoteHistory.size
    });
  }

  /**
   * Save vote data to storage
   */
  async saveVoteData() {
    // Implementation would save to persistent storage
    contentVotingLogger.debug('Content vote data saved');
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getServiceStats() {
    return {
      totalContent: this.contentMetadata.size,
      totalVotes: Array.from(this.contentVotes.values()).reduce((sum, votes) => sum + votes.size, 0),
      activeVoters: this.userVoteHistory.size,
      channelsWithTrending: this.trendingContent.size,
      initialized: this.initialized
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    if (this.trendingUpdateTimer) {
      clearInterval(this.trendingUpdateTimer);
    }
    
    await this.saveVoteData();
    this.initialized = false;
    contentVotingLogger.info('Content Voting Service shut down');
  }

  /**
   * Clear all votes (for testing purposes)
   */
  async clearAllVotes() {
    this.contentVotes.clear();
    this.contentScores.clear();
    this.userVoteHistory.clear();
    this.trendingContent.clear();
    this.contentMetadata.clear();
    
    contentVotingLogger.info('All vote data cleared (testing mode)');
  }
}

export default new ContentVotingService();
