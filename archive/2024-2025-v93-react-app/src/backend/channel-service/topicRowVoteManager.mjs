/**
 * @fileoverview Topic Row Vote Manager
 * Manages voting and ranking within topic rows for channels
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';

const topicRowLogger = logger.child({ module: 'topic-row-vote-manager' });

class TopicRowVoteManager {
  constructor() {
    this.topicRows = new Map(); // Map(topicRowName -> topicRowData)
    this.channelVotes = new Map(); // Map(channelId -> Map(userId -> voteData))
    this.userVoteHistory = new Map(); // Map(userId -> Array of vote records)
    this.channelRankings = new Map(); // Map(topicRowName -> Array of ranked channelIds)
    this.voteDecayScheduler = null;
    
    this.initialized = false;
  }

  /**
   * Initialize the topic row vote manager
   */
  async initialize() {
    try {
      await this.loadTopicRowData();
      this.setupEventHandlers();
      this.startVoteDecayScheduler();
      this.initialized = true;
      topicRowLogger.info('Topic Row Vote Manager initialized');
    } catch (error) {
      topicRowLogger.error('Failed to initialize topic row vote manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    eventBus.on('channel:created', this.handleChannelCreated.bind(this));
    eventBus.on('channel:updated', this.handleChannelUpdated.bind(this));
    eventBus.on('newsfeed:post-created', this.handleNewsfeedActivity.bind(this));
  }

  /**
   * Start vote decay scheduler (runs daily)
   */
  startVoteDecayScheduler() {
    // Run decay check every 24 hours
    this.voteDecayScheduler = setInterval(() => {
      this.processVoteDecay();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Create or get topic row
   * @param {string} topicRowName - Topic row name
   * @param {Object} metadata - Optional metadata
   */
  async createTopicRow(topicRowName, metadata = {}) {
    const normalizedName = topicRowName.toLowerCase().trim();
    
    if (this.topicRows.has(normalizedName)) {
      return this.topicRows.get(normalizedName);
    }

    const topicRow = {
      name: normalizedName,
      displayName: topicRowName.trim(),
      createdAt: Date.now(),
      channels: new Set(),
      totalVotes: 0,
      activeChannels: 0,
      lastActivity: Date.now(),
      metadata: {
        description: metadata.description || '',
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        ...metadata
      }
    };

    this.topicRows.set(normalizedName, topicRow);
    this.channelRankings.set(normalizedName, []);

    topicRowLogger.info('Created topic row', { topicRowName: normalizedName });
    
    eventBus.emit('topic-row:created', { topicRowName: normalizedName, topicRow });
    
    return topicRow;
  }

  /**
   * Add channel to topic row
   * @param {string} topicRowName - Topic row name
   * @param {string} channelId - Channel ID
   * @param {Object} channelData - Channel metadata
   */
  async addChannelToTopicRow(topicRowName, channelId, channelData) {
    const normalizedName = topicRowName.toLowerCase().trim();
    
    // Create topic row if it doesn't exist
    const topicRow = await this.createTopicRow(normalizedName);
    
    // Add channel to topic row
    topicRow.channels.add(channelId);
    topicRow.activeChannels = topicRow.channels.size;
    topicRow.lastActivity = Date.now();

    // Initialize vote tracking for channel
    this.channelVotes.set(channelId, new Map());

    // Add to ranking (initially at bottom)
    const rankings = this.channelRankings.get(normalizedName);
    if (!rankings.includes(channelId)) {
      rankings.push(channelId);
    }

    topicRowLogger.info('Added channel to topic row', { topicRowName: normalizedName, channelId });
    
    eventBus.emit('topic-row:channel-added', { topicRowName: normalizedName, channelId, channelData });
    
    return topicRow;
  }

  /**
   * Vote for a channel in a topic row
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} voteType - 'up', 'down', or 'revoke'
   */
  async voteForChannel(channelId, userId, voteType) {
    if (!this.initialized) {
      throw new Error('TopicRowVoteManager not initialized');
    }

    if (!['up', 'down', 'revoke'].includes(voteType)) {
      throw new Error('Invalid vote type. Must be "up", "down", or "revoke"');
    }

    const channelVotes = this.channelVotes.get(channelId);
    if (!channelVotes) {
      throw new Error('Channel not found in topic row system');
    }

    const previousVote = channelVotes.get(userId);
    
    // Record vote history
    const voteRecord = {
      channelId,
      voteType,
      timestamp: Date.now(),
      previousVote: previousVote?.type || null
    };

    if (!this.userVoteHistory.has(userId)) {
      this.userVoteHistory.set(userId, []);
    }
    this.userVoteHistory.get(userId).push(voteRecord);

    // Update vote
    if (voteType === 'revoke' || (previousVote && previousVote.type === voteType)) {
      // Remove vote
      channelVotes.delete(userId);
      topicRowLogger.info('Removed channel vote', { channelId, userId, previousVote: previousVote?.type });
      
      // Emit event for newsfeed system (user no longer supporter)
      eventBus.emit('channel:supporter-removed', { channelId, userId });
    } else {
      // Add or change vote
      channelVotes.set(userId, {
        type: voteType,
        timestamp: Date.now(),
        lastDecay: Date.now()
      });
      topicRowLogger.info('Added/changed channel vote', { channelId, userId, voteType, previousVote: previousVote?.type });
      
      // Emit event for newsfeed system
      eventBus.emit('user:vote-changed', { channelId, userId, newVoteType: voteType, previousVote: previousVote?.type });
    }

    // Update channel ranking
    await this.updateChannelRanking(channelId);

    return this.getChannelVoteStats(channelId);
  }

  /**
   * Update channel ranking within its topic row
   * @param {string} channelId - Channel ID
   */
  async updateChannelRanking(channelId) {
    // Find which topic row this channel belongs to
    let topicRowName = null;
    for (const [name, topicRow] of this.topicRows.entries()) {
      if (topicRow.channels.has(channelId)) {
        topicRowName = name;
        break;
      }
    }

    if (!topicRowName) {
      topicRowLogger.warn('Channel not found in any topic row', { channelId });
      return;
    }

    const rankings = this.channelRankings.get(topicRowName);
    const topicRow = this.topicRows.get(topicRowName);

    // Calculate scores for all channels in this topic row
    const channelScores = [];
    
    for (const cId of topicRow.channels) {
      const score = this.calculateChannelScore(cId);
      channelScores.push({ channelId: cId, score });
    }

    // Sort by score (highest first)
    channelScores.sort((a, b) => b.score - a.score);

    // Update rankings
    this.channelRankings.set(topicRowName, channelScores.map(item => item.channelId));

    topicRowLogger.debug('Updated channel rankings', { 
      topicRowName, 
      rankings: channelScores.map(item => ({ id: item.channelId, score: item.score }))
    });

    eventBus.emit('topic-row:rankings-updated', { topicRowName, rankings: channelScores });
  }

  /**
   * Calculate channel score for ranking
   * @param {string} channelId - Channel ID
   */
  calculateChannelScore(channelId) {
    const channelVotes = this.channelVotes.get(channelId);
    if (!channelVotes) return 0;

    let upvotes = 0;
    let downvotes = 0;
    let totalDecayedWeight = 0;

    const now = Date.now();
    const decayPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (const vote of channelVotes.values()) {
      // Calculate decay factor (votes decay over 30 days)
      const age = now - vote.timestamp;
      const decayFactor = Math.max(0, 1 - (age / decayPeriod));
      
      if (vote.type === 'up') {
        upvotes += decayFactor;
      } else if (vote.type === 'down') {
        downvotes += decayFactor;
      }
      
      totalDecayedWeight += decayFactor;
    }

    // Wilson score confidence interval for better ranking
    const n = totalDecayedWeight;
    if (n === 0) return 0;

    const p = upvotes / n;
    const z = 1.96; // 95% confidence
    
    const score = (p + z*z/(2*n) - z * Math.sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n);
    
    return Math.max(0, score) * 1000; // Scale for readability
  }

  /**
   * Get ranked channels for a topic row
   * @param {string} topicRowName - Topic row name
   * @param {Object} options - Query options
   */
  async getTopicRowRankings(topicRowName, options = {}) {
    const { limit = 20, offset = 0, includeStats = false } = options;
    
    const normalizedName = topicRowName.toLowerCase().trim();
    const rankings = this.channelRankings.get(normalizedName) || [];
    
    // Apply pagination
    const totalCount = rankings.length;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    const result = {
      topicRow: normalizedName,
      channels: paginatedRankings,
      totalCount,
      hasMore: offset + limit < totalCount
    };

    if (includeStats) {
      result.channelsWithStats = paginatedRankings.map((channelId, index) => ({
        channelId,
        rank: offset + index + 1,
        score: this.calculateChannelScore(channelId),
        voteStats: this.getChannelVoteStats(channelId)
      }));
    }

    return result;
  }

  /**
   * Get all topic rows with basic stats
   */
  async getAllTopicRows(options = {}) {
    const { sortBy = 'activity', limit = 50, offset = 0 } = options;
    
    let topicRowList = Array.from(this.topicRows.values());

    // Sort topic rows
    switch (sortBy) {
      case 'activity':
        topicRowList.sort((a, b) => b.lastActivity - a.lastActivity);
        break;
      case 'channels':
        topicRowList.sort((a, b) => b.activeChannels - a.activeChannels);
        break;
      case 'votes':
        topicRowList.sort((a, b) => b.totalVotes - a.totalVotes);
        break;
      case 'alphabetical':
        topicRowList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
    }

    // Apply pagination
    const totalCount = topicRowList.length;
    topicRowList = topicRowList.slice(offset, offset + limit);

    return {
      topicRows: topicRowList,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Search topic rows
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async searchTopicRows(query, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    let results = Array.from(this.topicRows.values()).filter(topicRow => {
      const searchableText = [
        topicRow.displayName,
        topicRow.metadata.description || '',
        ...(topicRow.metadata.tags || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    // Sort by relevance (number of matching terms)
    results.sort((a, b) => {
      const scoreA = this.calculateSearchRelevance(a, searchTerms);
      const scoreB = this.calculateSearchRelevance(b, searchTerms);
      return scoreB - scoreA;
    });

    // Apply pagination
    const totalCount = results.length;
    results = results.slice(offset, offset + limit);

    return {
      topicRows: results,
      totalCount,
      hasMore: offset + limit < totalCount,
      query
    };
  }

  /**
   * Calculate search relevance score
   * @param {Object} topicRow - Topic row data
   * @param {Array} searchTerms - Search terms
   */
  calculateSearchRelevance(topicRow, searchTerms) {
    let score = 0;
    const searchableText = [
      topicRow.displayName,
      topicRow.metadata.description || '',
      ...(topicRow.metadata.tags || [])
    ].join(' ').toLowerCase();

    for (const term of searchTerms) {
      // Exact match in name gets highest score
      if (topicRow.displayName.toLowerCase().includes(term)) {
        score += 10;
      }
      // Match in description gets medium score
      else if (topicRow.metadata.description?.toLowerCase().includes(term)) {
        score += 5;
      }
      // Match in tags gets lower score
      else if (topicRow.metadata.tags?.some(tag => tag.toLowerCase().includes(term))) {
        score += 3;
      }
      // Any other match gets minimal score
      else if (searchableText.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Process vote decay (called daily)
   */
  async processVoteDecay() {
    const now = Date.now();
    const decayPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    let decayedVotes = 0;
    
    for (const [channelId, channelVotes] of this.channelVotes.entries()) {
      const votesToRemove = [];
      
      for (const [userId, vote] of channelVotes.entries()) {
        const age = now - vote.timestamp;
        
        // Remove votes older than decay period
        if (age > decayPeriod) {
          votesToRemove.push(userId);
        }
      }
      
      // Remove decayed votes
      for (const userId of votesToRemove) {
        channelVotes.delete(userId);
        decayedVotes++;
        
        // Emit event for newsfeed system
        eventBus.emit('channel:supporter-removed', { channelId, userId, reason: 'vote_decay' });
      }
      
      // Update ranking if votes were removed
      if (votesToRemove.length > 0) {
        await this.updateChannelRanking(channelId);
      }
    }
    
    if (decayedVotes > 0) {
      topicRowLogger.info('Processed vote decay', { decayedVotes });
    }
  }

  /**
   * Get channel vote statistics
   * @param {string} channelId - Channel ID
   */
  getChannelVoteStats(channelId) {
    const channelVotes = this.channelVotes.get(channelId);
    if (!channelVotes) return null;

    let upvotes = 0;
    let downvotes = 0;

    for (const vote of channelVotes.values()) {
      if (vote.type === 'up') {
        upvotes++;
      } else if (vote.type === 'down') {
        downvotes++;
      }
    }

    return {
      upvotes,
      downvotes,
      totalVotes: upvotes + downvotes,
      score: this.calculateChannelScore(channelId),
      supporterCount: upvotes // Number of users who can post to newsfeed
    };
  }

  /**
   * Get user vote history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  getUserVoteHistory(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const history = this.userVoteHistory.get(userId) || [];
    const totalCount = history.length;
    
    // Sort by timestamp (most recent first)
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    const paginatedHistory = sortedHistory.slice(offset, offset + limit);

    return {
      history: paginatedHistory,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Event handlers
   */
  
  async handleChannelCreated(eventData) {
    const { channelId, channelData } = eventData;
    
    if (channelData.topicRow) {
      await this.addChannelToTopicRow(channelData.topicRow, channelId, channelData);
    }
  }

  async handleChannelUpdated(eventData) {
    const { channelId, channelData, changes } = eventData;
    
    if (changes.topicRow) {
      // Handle topic row change (would need to move channel between topic rows)
      topicRowLogger.info('Channel topic row changed', { channelId, oldTopicRow: changes.topicRow.old, newTopicRow: changes.topicRow.new });
    }
  }

  async handleNewsfeedActivity(eventData) {
    const { channelId } = eventData;
    
    // Update topic row activity timestamp
    for (const [name, topicRow] of this.topicRows.entries()) {
      if (topicRow.channels.has(channelId)) {
        topicRow.lastActivity = Date.now();
        break;
      }
    }
  }

  /**
   * Data persistence
   */
  
  async loadTopicRowData() {
    // Load from persistent storage if needed
    topicRowLogger.info('Loaded topic row data (in-memory storage)');
  }

  async saveTopicRowData() {
    // Save to persistent storage if needed
    topicRowLogger.info('Saved topic row data (in-memory storage)');
  }

  /**
   * Cleanup
   */
  
  async shutdown() {
    if (this.voteDecayScheduler) {
      clearInterval(this.voteDecayScheduler);
    }
    
    await this.saveTopicRowData();
    topicRowLogger.info('Topic Row Vote Manager shutdown');
  }

  /**
   * Check if a user is a supporter (voted 'up') for a channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @returns {boolean} True if user has voted 'up' for the channel
   */
  isChannelSupporter(channelId, userId) {
    const channelVotes = this.channelVotes.get(channelId);
    if (!channelVotes) return false;
    
    const userVote = channelVotes.get(userId);
    return userVote && userVote.type === 'up';
  }
}

export default new TopicRowVoteManager();
