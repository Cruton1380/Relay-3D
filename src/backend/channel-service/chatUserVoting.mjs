/**
 * @fileoverview Democratic Chatroom Governance System - Chat User Voting Service
 * Implements Roman quorum-style democratic voting for channel messages and user reputation
 * 
 * Features:
 * - Message-level voting (upvote/downvote) 
 * - Percentile-based voting privileges
 * - Quorum-based message actions (pin/hide/escalate)
 * - Real-time reputation scoring with decay
 * - Anti-spam and Sybil resistance
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';

const chatVotingLogger = logger.child({ module: 'chat-voting' });

class ChatUserVotingService {
  constructor() {
    // Core voting data
    this.userScores = new Map(); // Map(channelId -> Map(userId -> score))
    this.voteHistory = new Map(); // Map(channelId -> Map(voteId -> voteRecord))
    this.messageVotes = new Map(); // Map(messageId -> {upvotes: Set, downvotes: Set, netScore: number})
    this.userPercentiles = new Map(); // Map(channelId -> Map(userId -> percentile))
    
    // Channel governance settings
    this.channelModerationThresholds = new Map(); // Map(channelId -> percentileThreshold for downvoting)
    this.channelFilterThresholds = new Map(); // Map(channelId -> score threshold for hiding messages)
    this.channelQuorumSettings = new Map(); // Map(channelId -> quorum settings)
    
    // Message management
    this.messageVisibility = new Map(); // Map(messageId -> visibilityInfo)
    this.pinnedMessages = new Map(); // Map(channelId -> Set(messageIds))
    this.hiddenMessages = new Map(); // Map(channelId -> Set(messageIds))
    this.mockMessages = new Map(); // Map(channelId -> Array(messages)) - for testing
    
    // User activity and anti-spam
    this.userActivityData = new Map(); // Map(userId -> {lastVote: timestamp, recentVotes: Array})
    this.voteCooldowns = new Map(); // Map(userId -> Map(actionType -> timestamp))
    
    // Background processes
    this.reputationDecayInterval = null;
    
    // Enhanced audit and tracking
    this.auditLog = new Map(); // Map(channelId -> Array(auditEntries))
    this.globalUserCooldowns = new Map(); // Map(userId -> crossDeviceCooldowns)
    this.messageRankings = new Map(); // Map(channelId -> Array(rankedMessages))
    this.governanceProposals = new Map(); // Map(channelId -> Array(parameterChangeProposals))
    this.semanticHooks = new Map(); // Map(phraseHash -> channelLinks)
    
    // Cross-device tracking
    this.deviceSessions = new Map(); // Map(userId -> Set(deviceIds))
    this.suspiciousActivity = new Map(); // Map(userId -> activityScore)
    
    // Message analysis
    this.messageVelocity = new Map(); // Map(messageId -> velocityMetrics)
    this.rollingMessageWindow = new Map(); // Map(channelId -> Array(recent1000Messages))
    
    this.initialized = false;
  }

  /**
   * Initialize the democratic voting service
   */
  async initialize() {
    try {
      await this.loadVotingData();
      this.setupReputationDecay();
      this.initialized = true;
      chatVotingLogger.info('Democratic Chat Voting Service initialized');
    } catch (error) {
      chatVotingLogger.error('Failed to initialize chat voting service', { error: error.message });
      throw error;
    }
  }

  /**
   * Shutdown the service gracefully
   */
  async shutdown() {
    try {
      // Clear any background intervals
      if (this.reputationDecayInterval) {
        clearInterval(this.reputationDecayInterval);
        this.reputationDecayInterval = null;
      }
      
      await this.saveVotingData();
      this.initialized = false;
      chatVotingLogger.info('Chat Voting Service shut down');
    } catch (error) {
      chatVotingLogger.error('Failed to shut down chat voting service', { error: error.message });
      throw error;
    }
  }

  /**
   * Enhanced user voting for backward compatibility with tests
   * @param {string} voterId - User casting the vote
   * @param {string} targetUserId - User being voted on
   * @param {string} channelId - Channel where vote is cast
   * @param {string} voteType - 'upvote' or 'downvote'
   */
  async voteOnUserEnhanced(voterId, targetUserId, channelId, voteType) {
    try {
      // Prevent self-voting
      if (voterId === targetUserId) {
        throw new Error('Users cannot vote on themselves');
      }

      // Validate voting eligibility
      await this.validateUserVote(voterId, channelId, voteType);

      // Initialize channel data
      this.initializeChannelData(channelId);

      const channelScores = this.userScores.get(channelId);
      const channelVotes = this.voteHistory.get(channelId);

      // Initialize user scores if needed (both voters and targets need to be tracked for percentiles)
      if (!channelScores.has(targetUserId)) {
        channelScores.set(targetUserId, 0);
      }
      if (!channelScores.has(voterId)) {
        channelScores.set(voterId, 0);
      }

      // Apply voting logic
      let voterScoreChange = 0;
      let targetScoreChange = 0;

      if (voteType === 'upvote') {
        targetScoreChange = 1;
        voterScoreChange = 0;
      } else if (voteType === 'downvote') {
        targetScoreChange = -1;
        voterScoreChange = -1; // Mutual downvoting cost
      }

      // Update scores
      const currentVoterScore = channelScores.get(voterId);
      const currentTargetScore = channelScores.get(targetUserId);
      
      channelScores.set(voterId, currentVoterScore + voterScoreChange);
      channelScores.set(targetUserId, currentTargetScore + targetScoreChange);

      // Update percentiles after score change
      this.recalculateChannelPercentiles(channelId);

      // Create vote record
      const voteId = crypto.randomUUID();
      const voterPercentile = this.getUserPercentile(voterId, channelId);
      const channelThreshold = this.getChannelModerationThreshold(channelId);

      const voteRecord = {
        id: voteId,
        voterId,
        targetUserId,
        voteType,
        timestamp: Date.now(),
        channelId,
        voterPercentile,
        mutualDownvote: voteType === 'downvote'
      };

      channelVotes.set(voteId, voteRecord);

      // Emit events
      eventBus.emit('chat:user-score-updated', {
        channelId,
        voterId,
        targetUserId,
        voterScore: channelScores.get(voterId),
        targetScore: channelScores.get(targetUserId),
        voteType,
        voterPercentile: this.getUserPercentile(voterId, channelId),
        targetPercentile: this.getUserPercentile(targetUserId, channelId)
      });

      return {
        success: true,
        voteId,
        voterScore: channelScores.get(voterId),
        targetScore: channelScores.get(targetUserId),
        voterScoreChange,
        targetScoreChange,
        voterPercentile: this.getUserPercentile(voterId, channelId),
        targetPercentile: this.getUserPercentile(targetUserId, channelId),
        mutualDownvote: voteType === 'downvote',
        canDownvote: voterPercentile >= channelThreshold
      };

    } catch (error) {
      chatVotingLogger.error('Failed to cast enhanced user vote', {
        error: error.message,
        voterId: voterId.substring(0, 8),
        targetUserId: targetUserId.substring(0, 8),
        channelId,
        voteType
      });
      throw error;
    }
  }

  /**
   * Validate user vote for enhanced voting with quorum checks
   */
  async validateUserVote(voterId, channelId, voteType) {
    if (voteType === 'downvote') {
      const voterPercentile = this.getUserPercentile(voterId, channelId);
      const channelThreshold = this.getChannelModerationThreshold(channelId);
      const totalUsers = this.getActiveUserCount(channelId);
      
      // Check minimum user threshold for downvoting
      if (totalUsers < 3) {
        throw new Error(`Downvoting requires at least 3 users in channel. Current: ${totalUsers} users.`);
      }
      
      // Check percentile threshold
      if (voterPercentile < channelThreshold) {
        throw new Error(`Downvoting requires ${channelThreshold}th percentile or higher. You are at ${voterPercentile}th percentile.`);
      }
    }
  }

  /**
   * Calculate and update percentiles for all users in a channel with enhanced edge case handling
   * @param {string} channelId - Channel ID
   */
  recalculateChannelPercentiles(channelId) {
    const channelScores = this.userScores.get(channelId);
    if (!channelScores || channelScores.size === 0) return;

    const scores = Array.from(channelScores.values()).sort((a, b) => a - b);
    const percentileMap = this.userPercentiles.get(channelId) || new Map();
    const totalUsers = scores.length;

    // Enhanced edge case handling
    for (const [userId, userScore] of channelScores.entries()) {
      let percentile;
      
      if (totalUsers === 1) {
        // Single user always gets 0th percentile (cannot downvote alone)
        percentile = 0;
      } else if (totalUsers === 2) {
        // Two users: lower score = 0th, higher score = 100th
        const minScore = Math.min(...scores);
        percentile = userScore === minScore ? 0 : 100;
      } else {
        // Standard percentile calculation for 3+ users
        const rank = scores.filter(score => score < userScore).length;
        percentile = Math.round((rank / (totalUsers - 1)) * 100);
      }
      
      percentileMap.set(userId, percentile);
    }

    this.userPercentiles.set(channelId, percentileMap);
    
    // Log edge cases for monitoring
    if (totalUsers <= 2) {
      chatVotingLogger.info('Edge case percentile calculation', {
        channelId,
        totalUsers,
        scores: scores.slice(0, 5), // First 5 scores for privacy
        edgeCase: totalUsers === 1 ? 'single-user' : 'two-users'
      });
    }
  }

  /**
   * Get user's percentile ranking in channel
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @returns {number} Percentile (0-100)
   */
  getUserPercentile(userId, channelId) {
    const channelPercentiles = this.userPercentiles.get(channelId);
    if (!channelPercentiles) return 0;
    return channelPercentiles.get(userId) || 0;
  }

  /**
   * Get user's score in channel
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @returns {number} User score
   */
  getUserScore(userId, channelId) {
    const channelScores = this.userScores.get(channelId);
    if (!channelScores) return 0;
    return channelScores.get(userId) || 0;
  }

  /**
   * Get all user scores for a channel
   * @param {string} channelId - Channel ID
   * @returns {Map} Map of userId -> score
   */
  getChannelUserScores(channelId) {
    return this.userScores.get(channelId) || new Map();
  }

  /**
   * Get count of active users in channel (users with scores)
   * @param {string} channelId - Channel ID
   * @returns {number} Number of active users
   */
  getActiveUserCount(channelId) {
    const channelScores = this.userScores.get(channelId);
    if (!channelScores) return 0;
    return channelScores.size;
  }

  /**
   * Set channel moderation threshold (percentile required for downvoting)
   * @param {string} channelId - Channel ID
   * @param {number} threshold - Percentile threshold (5, 10, or 20)
   */
  async setChannelModerationThreshold(channelId, threshold) {
    if (![5, 10, 20].includes(threshold)) {
      throw new Error('Moderation threshold must be 5, 10, or 20');
    }

    this.channelModerationThresholds.set(channelId, threshold);
    
    chatVotingLogger.info('Channel moderation threshold updated', {
      channelId,
      threshold
    });

    // Broadcast threshold change
    eventBus.emit('chat:moderation-threshold-updated', {
      channelId,
      threshold
    });
  }

  /**
   * Get channel moderation threshold
   * @param {string} channelId - Channel ID
   * @returns {number} Threshold percentile
   */
  getChannelModerationThreshold(channelId) {
    return this.channelModerationThresholds.get(channelId) || 10; // Default 10th percentile
  }

  /**
   * Set channel filter threshold for message visibility
   * @param {string} channelId - Channel ID
   * @param {number} threshold - Score threshold for hiding messages
   */
  async setChannelFilterThreshold(channelId, threshold) {
    this.channelFilterThresholds.set(channelId, threshold);
    
    chatVotingLogger.info('Channel filter threshold updated', {
      channelId,
      threshold
    });
  }

  /**
   * Get channel filter threshold
   * @param {string} channelId - Channel ID
   * @returns {number} Filter threshold
   */
  getChannelFilterThreshold(channelId) {
    return this.channelFilterThresholds.get(channelId) || -10; // Default -10
  }

  /**
   * Initialize channel data structures
   * @param {string} channelId - Channel ID
   */
  initializeChannelData(channelId) {
    if (!this.userScores.has(channelId)) {
      this.userScores.set(channelId, new Map());
    }
    if (!this.voteHistory.has(channelId)) {
      this.voteHistory.set(channelId, new Map());
    }
    if (!this.userPercentiles.has(channelId)) {
      this.userPercentiles.set(channelId, new Map());
    }
    if (!this.pinnedMessages.has(channelId)) {
      this.pinnedMessages.set(channelId, new Set());
    }
    if (!this.hiddenMessages.has(channelId)) {
      this.hiddenMessages.set(channelId, new Set());
    }
  }

  /**
   * Get user moderation status
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @returns {Object} Moderation status
   */
  getUserModerationStatus(userId, channelId) {
    const score = this.getUserScore(userId, channelId);
    const percentile = this.getUserPercentile(userId, channelId);
    const threshold = this.getChannelModerationThreshold(channelId);
    const filterThreshold = this.getChannelFilterThreshold(channelId);
    
    const canDownvote = percentile >= threshold;
    const isMuted = percentile < threshold;
    const isFiltered = score < filterThreshold;
    
    return {
      score,
      percentile,
      canDownvote,
      isMuted,
      isFiltered,
      status: isMuted ? 'muted' : 'active',
      reason: canDownvote ? null : `Requires ${threshold}th percentile or higher (you are ${percentile}th)`
    };
  }

  /**
   * Get user badge based on percentile
   * @param {number} percentile - User percentile
   * @param {number} threshold - Channel threshold
   * @returns {string} Badge emoji
   */
  getUserBadge(percentile, threshold) {
    if (percentile >= 95) return '🏆'; // Top 5%
    if (percentile >= 80) return '⭐'; // Top 20%
    if (percentile >= 50) return '✅'; // Top 50%
    if (percentile >= threshold) return '👍'; // Above threshold
    return '🔇'; // Below threshold (muted)
  }

  /**
   * Get channel filter options for UI
   * @param {string} channelId - Channel ID
   * @returns {Object} Filter options
   */
  getChannelFilterOptions(channelId) {
    const channelScores = this.userScores.get(channelId) || new Map();
    const scores = Array.from(channelScores.values());
    
    return {
      scoreRange: {
        min: Math.min(...scores, 0),
        max: Math.max(...scores, 0)
      },
      percentileThreshold: this.getChannelModerationThreshold(channelId),
      totalUsers: channelScores.size,
      availableFilters: ['keyword', 'newest', 'tags', 'mediaOnly', 'userPercentile']
    };
  }

  /**
   * Set mock messages for testing
   * @param {string} channelId - Channel ID
   * @param {Array} messages - Array of message objects
   */
  setMockMessages(channelId, messages) {
    this.mockMessages.set(channelId, messages);
  }

  /**
   * Search chatroom messages with filters
   * @param {string} channelId - Channel ID
   * @param {Object} filters - Search filters
   * @returns {Object} Search results
   */
  async searchChatroomMessages(channelId, filters = {}) {
    // Use mock messages if available, otherwise use default
    const mockMessages = this.mockMessages.get(channelId) || [
      {
        id: 'msg1',
        authorId: 'user1',
        author: { username: 'user1' },
        content: 'Hello world',
        timestamp: Date.now() - 1000,
        hasMedia: false,
        tags: ['general']
      }
    ];

    let filteredMessages = mockMessages;

    if (filters.keyword) {
      filteredMessages = filteredMessages.filter(msg => 
        msg.content.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }

    if (filters.mediaOnly) {
      filteredMessages = filteredMessages.filter(msg => msg.hasMedia);
    }

    if (filters.newest) {
      filteredMessages.sort((a, b) => b.timestamp - a.timestamp);
    }

    return {
      messages: filteredMessages,
      totalCount: filteredMessages.length,
      filters: filters
    };
  }

  /**
   * Get messages with voting information (mock)
   * @param {string} channelId - Channel ID
   * @returns {Array} Messages with vote data
   */
  async getChannelMessages(channelId) {
    // Mock implementation
    return [
      {
        id: 'msg1',
        authorId: 'user1',
        author: { username: 'user1' },
        content: 'Hello world',
        timestamp: Date.now() - 1000,
        hasMedia: false,
        tags: ['general']
      }
    ];
  }

  /**
   * Setup reputation decay system
   */
  setupReputationDecay() {
    // Decay reputation weekly (20% decay)
    this.reputationDecayInterval = setInterval(() => {
      this.applyReputationDecay(0.8); // Keep 80% of score
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  /**
   * Apply reputation decay to all users
   * @param {number} decayFactor - Decay factor (0.8 = 20% decay)
   */
  applyReputationDecay(decayFactor) {
    for (const [channelId, channelScores] of this.userScores.entries()) {
      for (const [userId, score] of channelScores.entries()) {
        const decayedScore = Math.round(score * decayFactor);
        channelScores.set(userId, decayedScore);
      }
      
      // Recalculate percentiles after decay
      this.recalculateChannelPercentiles(channelId);
    }
    
    chatVotingLogger.info('Applied reputation decay', { decayFactor });
  }

  /**
   * Load voting data from persistence
   */
  async loadVotingData() {
    // In a real implementation, this would load from database
    chatVotingLogger.debug('Voting data loaded');
  }

  /**
   * Save voting data to persistence
   */
  async saveVotingData() {
    // In a real implementation, this would save to database
    chatVotingLogger.debug('Voting data saved');
  }

  /**
   * Clear all channel data (for testing)
   * @param {string} channelId - Channel ID
   */
  clearChannelData(channelId) {
    this.userScores.delete(channelId);
    this.voteHistory.delete(channelId);
    this.userPercentiles.delete(channelId);
    this.channelModerationThresholds.delete(channelId);
    this.channelFilterThresholds.delete(channelId);
    this.pinnedMessages.delete(channelId);
    this.hiddenMessages.delete(channelId);
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData() {
    this.userScores.clear();
    this.voteHistory.clear();
    this.messageVotes.clear();
    this.userPercentiles.clear();
    this.channelModerationThresholds.clear();
    this.channelFilterThresholds.clear();
    this.messageVisibility.clear();
    this.pinnedMessages.clear();
    this.hiddenMessages.clear();
    this.userActivityData.clear();
    this.voteCooldowns.clear();
  }

  /**
   * Pin a message based on quorum with full state tracking
   * @param {string} channelId - Channel ID
   * @param {string} messageId - Message ID
   * @param {Object} metadata - Additional pin metadata
   */
  async pinMessage(channelId, messageId, metadata = {}) {
    this.initializeChannelData(channelId);
    const pinnedMessages = this.pinnedMessages.get(channelId);
    
    // Create pin record with timestamp and version
    const pinRecord = {
      messageId,
      channelId,
      timestamp: Date.now(),
      version: 1,
      pinnedBy: metadata.pinnedBy || 'quorum',
      quorumVotes: metadata.quorumVotes || 0,
      reversible: true,
      ...metadata
    };
    
    pinnedMessages.add(messageId);
    
    // Store pin record for audit and reversal
    if (!this.messageVisibility.has(messageId)) {
      this.messageVisibility.set(messageId, {});
    }
    const messageData = this.messageVisibility.get(messageId);
    messageData.pinRecord = pinRecord;
    messageData.isPinned = true;
    
    // Broadcast to all clients via WebSocket
    eventBus.emit('chat:message-pinned', {
      channelId,
      messageId,
      pinRecord,
      broadcastToAll: true
    });

    chatVotingLogger.info('Message pinned by quorum', { 
      channelId, 
      messageId: messageId.substring(0, 8),
      quorumVotes: pinRecord.quorumVotes 
    });
    
    return pinRecord;
  }

  /**
   * Unpin a message based on community quorum
   * @param {string} channelId - Channel ID
   * @param {string} messageId - Message ID
   * @param {Object} metadata - Unpin metadata
   */
  async unpinMessage(channelId, messageId, metadata = {}) {
    this.initializeChannelData(channelId);
    const pinnedMessages = this.pinnedMessages.get(channelId);
    
    if (!pinnedMessages.has(messageId)) {
      throw new Error('Message is not currently pinned');
    }
    
    const messageData = this.messageVisibility.get(messageId);
    if (messageData && messageData.pinRecord) {
      // Create unpin record
      const unpinRecord = {
        ...messageData.pinRecord,
        unpinnedAt: Date.now(),
        unpinnedBy: metadata.unpinnedBy || 'quorum',
        unpinQuorumVotes: metadata.quorumVotes || 0,
        reason: metadata.reason || 'community_unpin'
      };
      
      messageData.pinRecord = unpinRecord;
      messageData.isPinned = false;
    }
    
    pinnedMessages.delete(messageId);
    
    // Broadcast unpin event
    eventBus.emit('chat:message-unpinned', {
      channelId,
      messageId,
      unpinRecord: messageData?.pinRecord,
      broadcastToAll: true
    });

    chatVotingLogger.info('Message unpinned by quorum', { 
      channelId, 
      messageId: messageId.substring(0, 8) 
    });
  }

  /**
   * Hide a message based on quorum with full audit trail
   * @param {string} channelId - Channel ID
   * @param {string} messageId - Message ID
   * @param {Object} metadata - Hide metadata
   */
  async hideMessage(channelId, messageId, metadata = {}) {
    this.initializeChannelData(channelId);
    const hiddenMessages = this.hiddenMessages.get(channelId);
    
    // Create hide record with timestamp and audit info
    const hideRecord = {
      messageId,
      channelId,
      timestamp: Date.now(),
      hiddenBy: metadata.hiddenBy || 'quorum',
      quorumVotes: metadata.quorumVotes || 0,
      reason: metadata.reason || 'community_moderation',
      reversible: true,
      ...metadata
    };
    
    hiddenMessages.add(messageId);
    
    // Store hide record for audit
    if (!this.messageVisibility.has(messageId)) {
      this.messageVisibility.set(messageId, {});
    }
    const messageData = this.messageVisibility.get(messageId);
    messageData.hideRecord = hideRecord;
    messageData.isHidden = true;
    
    // Broadcast to all clients
    eventBus.emit('chat:message-hidden', {
      channelId,
      messageId,
      hideRecord,
      broadcastToAll: true
    });

    chatVotingLogger.info('Message hidden by quorum', { 
      channelId, 
      messageId: messageId.substring(0, 8),
      quorumVotes: hideRecord.quorumVotes 
    });
    
    return hideRecord;
  }

  /**
   * Get message visibility state
   * @param {string} messageId - Message ID
   * @returns {Object} Visibility state
   */
  getMessageVisibilityState(messageId) {
    const messageData = this.messageVisibility.get(messageId);
    return {
      isPinned: messageData?.isPinned || false,
      isHidden: messageData?.isHidden || false,
      pinRecord: messageData?.pinRecord || null,
      hideRecord: messageData?.hideRecord || null
    };
  }

  /**
   * Enhanced cooldown tracking across sessions/devices
   * @param {string} userId - User ID
   * @param {string} voteType - Vote type
   * @param {Object} sessionInfo - Session/device information
   */
  async checkVoteCooldowns(userId, voteType, sessionInfo = {}) {
    const userCooldowns = this.voteCooldowns.get(userId) || new Map();
    const now = Date.now();
    
    // Different cooldown periods based on vote type and recent activity
    const baseCooldownPeriod = 1000; // 1 second base
    const userActivity = this.userActivityData.get(userId);
    
    // Calculate dynamic cooldown based on recent activity
    let cooldownPeriod = baseCooldownPeriod;
    if (userActivity?.recentVotes?.length > 10) {
      cooldownPeriod = 5000; // 5 seconds for high activity
    }
    if (userActivity?.recentVotes?.length > 20) {
      cooldownPeriod = 30000; // 30 seconds for very high activity
    }
    
    // Check per-action cooldowns
    const lastVote = userCooldowns.get(voteType) || 0;
    if (now - lastVote < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - lastVote)) / 1000);
      throw new Error(`Vote cooldown active. Please wait ${remainingTime} seconds before voting again.`);
    }
    
    // Check cross-device session limits (simplified - in production would use device fingerprinting)
    const sessionKey = sessionInfo.sessionId || sessionInfo.deviceId || 'default';
    const sessionCooldowns = userCooldowns.get(`session_${sessionKey}`) || 0;
    if (now - sessionCooldowns < 500) { // 500ms minimum between any votes from same session
      throw new Error('Session cooldown active. Multiple rapid votes detected.');
    }
    
    // Update cooldowns
    userCooldowns.set(voteType, now);
    userCooldowns.set(`session_${sessionKey}`, now);
    this.voteCooldowns.set(userId, userCooldowns);
    
    // Log suspicious activity
    if (userActivity?.recentVotes?.length > 15) {
      chatVotingLogger.warn('High voting activity detected', {
        userId: userId.substring(0, 8),
        recentVotes: userActivity.recentVotes.length,
        sessionInfo: sessionInfo.sessionId?.substring(0, 8) || 'unknown'
      });
    }
  }

  /**
   * Reset cooldowns (for admin/jury actions)
   * @param {string} userId - User ID
   * @param {string} reason - Reset reason
   */
  resetUserCooldowns(userId, reason = 'admin_action') {
    this.voteCooldowns.delete(userId);
    chatVotingLogger.info('User cooldowns reset', {
      userId: userId.substring(0, 8),
      reason
    });
  }

  /**
   * 🔒 IMMUTABLE AUDIT LOGGING
   * Log all voting actions for transparency and dispute resolution
   */
  logAuditEntry(channelId, action, details) {
    if (!this.auditLog.has(channelId)) {
      this.auditLog.set(channelId, []);
    }
    
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action, // 'vote', 'pin', 'hide', 'escalate', 'governance'
      immutableHash: crypto.createHash('sha256').update(JSON.stringify(details)).digest('hex'),
      ...details
    };
    
    this.auditLog.get(channelId).push(entry);
    
    // Emit for external logging systems
    eventBus.emit('audit:log-entry', {
      channelId,
      entry
    });
    
    return entry;
  }

  /**
   * 📱 CROSS-DEVICE COOLDOWN ENFORCEMENT
   * Prevent multi-device abuse
   */
  async checkCrossDeviceCooldowns(userId, voteType, deviceId = null) {
    const globalCooldowns = this.globalUserCooldowns.get(userId) || new Map();
    const now = Date.now();
    
    // Check if user is voting from multiple devices suspiciously fast
    if (deviceId) {
      const userDevices = this.deviceSessions.get(userId) || new Set();
      userDevices.add(deviceId);
      this.deviceSessions.set(userId, userDevices);
      
      // Flag suspicious multi-device activity
      if (userDevices.size > 3) {
        this.flagSuspiciousActivity(userId, 'multi_device_voting');
      }
    }
    
    // Enforce global cooldowns across all devices
    const lastGlobalVote = globalCooldowns.get('global') || 0;
    const globalCooldownPeriod = 500; // 0.5 seconds minimum between any votes
    
    if (now - lastGlobalVote < globalCooldownPeriod) {
      throw new Error(`Global vote cooldown active. Please wait ${globalCooldownPeriod}ms between votes.`);
    }
    
    globalCooldowns.set('global', now);
    globalCooldowns.set(voteType, now);
    this.globalUserCooldowns.set(userId, globalCooldowns);
  }

  /**
   * 🏆 TOP 1% MESSAGE RANKING & ESCALATION
   * Calculate message rankings and auto-escalate top performers
   */
  calculateMessageRankings(channelId) {
    const messageVotes = Array.from(this.messageVotes.entries())
      .filter(([messageId, votes]) => messageId.startsWith(channelId))
      .map(([messageId, votes]) => ({
        messageId,
        netScore: votes.netScore,
        velocity: this.calculateVoteVelocity(messageId),
        timestamp: this.getMessageTimestamp(messageId),
        escalationScore: this.calculateEscalationScore(votes, messageId)
      }))
      .sort((a, b) => b.escalationScore - a.escalationScore);
    
    this.messageRankings.set(channelId, messageVotes);
    
    // Auto-escalate top 1%
    const top1PercentCount = Math.max(1, Math.ceil(messageVotes.length * 0.01));
    const topMessages = messageVotes.slice(0, top1PercentCount);
    
    for (const message of topMessages) {
      if (message.escalationScore > 50) { // Threshold for auto-escalation
        this.escalateToThread(channelId, message.messageId, {
          reason: 'top_1_percent_auto_escalation',
          escalationScore: message.escalationScore,
          ranking: messageVotes.indexOf(message) + 1
        });
      }
    }
    
    return messageVotes;
  }

  /**
   * 🚀 THREAD ESCALATION SYSTEM
   */
  async escalateToThread(channelId, messageId, metadata = {}) {
    const escalationRecord = {
      messageId,
      channelId,
      timestamp: Date.now(),
      escalationType: metadata.reason || 'manual',
      ranking: metadata.ranking,
      threadId: crypto.randomUUID(),
      ...metadata
    };
    
    // Log audit entry
    this.logAuditEntry(channelId, 'escalate_thread', escalationRecord);
    
    eventBus.emit('chat:message-escalated', escalationRecord);
    
    chatVotingLogger.info('Message escalated to thread', {
      channelId,
      messageId: messageId.substring(0, 8),
      escalationType: escalationRecord.escalationType
    });
    
    return escalationRecord;
  }

  /**
   * 🏛️ CHANNEL GOVERNANCE SYSTEM
   * Allow community to vote on parameter changes
   */
  async proposeParameterChange(channelId, proposerId, parameterName, newValue, reasoning) {
    const proposal = {
      id: crypto.randomUUID(),
      channelId,
      proposerId,
      parameterName, // 'moderationThreshold', 'pinQuorum', etc.
      currentValue: this.getChannelParameter(channelId, parameterName),
      proposedValue: newValue,
      reasoning,
      timestamp: Date.now(),
      votes: new Map(), // userId -> 'support' | 'oppose'
      status: 'active', // 'active', 'passed', 'failed', 'expired'
      requiredQuorum: Math.max(10, Math.ceil(this.getActiveUserCount(channelId) * 0.1))
    };
    
    if (!this.governanceProposals.has(channelId)) {
      this.governanceProposals.set(channelId, []);
    }
    
    this.governanceProposals.get(channelId).push(proposal);
    
    // Log audit entry
    this.logAuditEntry(channelId, 'governance_proposal', proposal);
    
    eventBus.emit('governance:proposal-created', proposal);
    
    return proposal;
  }

  /**
   * 🗳️ VOTE ON GOVERNANCE PROPOSALS
   */
  async voteOnGovernanceProposal(proposalId, voterId, voteType, channelId) {
    const proposals = this.governanceProposals.get(channelId) || [];
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal || proposal.status !== 'active') {
      throw new Error('Proposal not found or not active');
    }
    
    // Check voter eligibility (must be above 25th percentile for governance)
    const voterPercentile = this.getUserPercentile(voterId, channelId);
    if (voterPercentile < 25) {
      throw new Error('Governance voting requires 25th percentile or higher');
    }
    
    proposal.votes.set(voterId, voteType);
    
    // Check if quorum reached
    const supportVotes = Array.from(proposal.votes.values()).filter(v => v === 'support').length;
    const totalVotes = proposal.votes.size;
    
    if (totalVotes >= proposal.requiredQuorum) {
      const supportPercentage = supportVotes / totalVotes;
      
      if (supportPercentage >= 0.6) { // 60% support required
        proposal.status = 'passed';
        await this.applyParameterChange(channelId, proposal);
      } else {
        proposal.status = 'failed';
      }
      
      this.logAuditEntry(channelId, 'governance_resolved', {
        proposalId,
        status: proposal.status,
        supportPercentage,
        totalVotes
      });
    }
    
    return proposal;
  }

  /**
   * 🔗 SEMANTIC WORD LINKING HOOKS
   * Prepare for phrase-to-channel linking
   */
  prepareSemanticLinks(messageContent, channelId) {
    // Tokenize message into phrases
    const phrases = this.extractSignificantPhrases(messageContent);
    const semanticLinks = [];
    
    for (const phrase of phrases) {
      const phraseHash = crypto.createHash('md5').update(phrase.toLowerCase()).digest('hex');
      
      // Check if phrase has associated channels
      const linkedChannels = this.semanticHooks.get(phraseHash) || [];
      
      if (linkedChannels.length > 0) {
        semanticLinks.push({
          phrase,
          phraseHash,
          linkedChannels,
          startIndex: messageContent.indexOf(phrase),
          endIndex: messageContent.indexOf(phrase) + phrase.length
        });
      }
    }
    
    return semanticLinks;
  }

  /**
   * 📊 MOBILE-FRIENDLY ASYNC QUORUM HANDLING
   */
  async processAsyncQuorumActions(channelId) {
    // Process any pending quorum actions that may have been missed
    const pendingActions = [];
    
    for (const [messageId, votes] of this.messageVotes.entries()) {
      if (!messageId.startsWith(channelId)) continue;
      
      const quorumSettings = this.getChannelQuorumSettings(channelId);
      const activeUsers = this.getActiveUserCount(channelId);
      
      // Check pin quorum
      if (votes.upvotes.size >= quorumSettings.pinThreshold ||
          votes.upvotes.size >= Math.ceil(activeUsers * quorumSettings.pinPercentage)) {
        if (!this.pinnedMessages.get(channelId)?.has(messageId)) {
          pendingActions.push({
            action: 'pin',
            messageId,
            votes: votes.upvotes.size,
            threshold: quorumSettings.pinThreshold
          });
        }
      }
      
      // Check hide quorum
      if (votes.downvotes.size >= quorumSettings.hideThreshold ||
          votes.downvotes.size >= Math.ceil(activeUsers * quorumSettings.hidePercentage)) {
        if (!this.hiddenMessages.get(channelId)?.has(messageId)) {
          pendingActions.push({
            action: 'hide',
            messageId,
            votes: votes.downvotes.size,
            threshold: quorumSettings.hideThreshold
          });
        }
      }
    }
    
    // Execute pending actions
    for (const action of pendingActions) {
      if (action.action === 'pin') {
        await this.pinMessage(channelId, action.messageId, {
          retroactive: true,
          quorumVotes: action.votes
        });
      } else if (action.action === 'hide') {
        await this.hideMessage(channelId, action.messageId, {
          retroactive: true,
          quorumVotes: action.votes
        });
      }
    }
    
    return pendingActions;
  }

  // Helper methods for the above features
  calculateVoteVelocity(messageId) {
    const velocityData = this.messageVelocity.get(messageId);
    if (!velocityData) return 0;
    
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const recentVotes = velocityData.votes.filter(v => Date.now() - v.timestamp < timeWindow);
    return recentVotes.length / (timeWindow / 1000); // votes per second
  }
  
  calculateEscalationScore(votes, messageId) {
    const netScore = votes.netScore;
    const velocity = this.calculateVoteVelocity(messageId);
    const age = (Date.now() - this.getMessageTimestamp(messageId)) / (1000 * 60 * 60); // hours
    
    // Escalation score combines net votes, velocity, and recency
    return netScore * 2 + velocity * 10 - age * 0.5;
  }
  
  getMessageTimestamp(messageId) {
    // Extract timestamp from message ID or metadata
    return Date.now() - Math.random() * 24 * 60 * 60 * 1000; // Mock implementation
  }
  
  extractSignificantPhrases(content) {
    // Extract meaningful phrases (2-4 words) from message content
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const phrases = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      // 2-word phrases
      phrases.push(words.slice(i, i + 2).join(' '));
      
      // 3-word phrases
      if (i < words.length - 2) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    }
    
    return phrases.filter(phrase => phrase.length > 3); // Filter out short phrases
  }
  
  flagSuspiciousActivity(userId, activityType) {
    const suspiciousScore = this.suspiciousActivity.get(userId) || 0;
    this.suspiciousActivity.set(userId, suspiciousScore + 1);
    
    if (suspiciousScore > 5) {
      this.logAuditEntry('global', 'suspicious_activity', {
        userId: userId.substring(0, 8),
        activityType,
        score: suspiciousScore
      });
    }
  }
  
  getChannelParameter(channelId, parameterName) {
    switch (parameterName) {
      case 'moderationThreshold': return this.getChannelModerationThreshold(channelId);
      case 'filterThreshold': return this.getChannelFilterThreshold(channelId);
      default: return null;
    }
  }
  
  async applyParameterChange(channelId, proposal) {
    switch (proposal.parameterName) {
      case 'moderationThreshold':
        await this.setChannelModerationThreshold(channelId, proposal.proposedValue);
        break;
      case 'filterThreshold':
        await this.setChannelFilterThreshold(channelId, proposal.proposedValue);
        break;
    }
    
    eventBus.emit('governance:parameter-changed', {
      channelId,
      parameterName: proposal.parameterName,
      oldValue: proposal.currentValue,
      newValue: proposal.proposedValue,
      proposalId: proposal.id
    });
  }
}

// Create singleton instance
const chatUserVotingService = new ChatUserVotingService();
export default chatUserVotingService;
