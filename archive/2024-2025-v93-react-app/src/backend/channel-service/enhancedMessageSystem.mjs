/**
 * @fileoverview Enhanced Message System with Reactions, Threading & Rich Content
 * WhatsApp-like functionality with emoji reactions, replies, and file sharing
 */

class EnhancedMessageSystem {
  constructor() {
    this.messages = new Map(); // messageId -> message data
    this.messageReactions = new Map(); // messageId -> Map(userId -> reaction)
    this.messageThreads = new Map(); // parentMessageId -> Array of reply messageIds
    this.messageSearchIndex = new Map(); // channelId -> search index
    this.messageDeliveryStatus = new Map(); // messageId -> delivery status
    this.userTypingStatus = new Map(); // channelId -> Map(userId -> typing data)
    this.fileAttachments = new Map(); // messageId -> file metadata
    
    // Democratic voting system
    this.messageVotes = new Map(); // messageId -> {upvotes: Set, downvotes: Set, netScore: number}
    this.messageVisibilityRank = new Map(); // messageId -> calculated visibility rank
    this.pinnedMessages = new Map(); // channelId -> Set(messageIds)
    this.hiddenMessages = new Map(); // channelId -> Set(messageIds)
    this.messageQuorumActions = new Map(); // messageId -> Array of triggered actions
    this.messageSemanticLinks = new Map(); // messageId -> Map(word -> topicRowId)
  }

  /**
   * Send enhanced message with rich content support
   */
  async sendMessage(channelId, userId, messageData) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = {
      id: messageId,
      channelId,
      senderId: userId,
      content: messageData.content,
      type: messageData.type || 'text', // 'text', 'image', 'video', 'audio', 'file', 'voice'
      replyToId: messageData.replyToId || null,
      isEdit: false,
      editHistory: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      deliveryStatus: 'sent',
      readReceipts: new Map(), // userId -> timestamp
      reactions: new Map(), // userId -> reaction emoji
      threadReplies: 0,
      attachments: messageData.attachments || [],
      mentions: messageData.mentions || [],
      isDeleted: false,
      isForwarded: messageData.isForwarded || false,
      forwardedFrom: messageData.forwardedFrom || null
    };

    // Handle file attachments
    if (messageData.attachments && messageData.attachments.length > 0) {
      await this.processAttachments(messageId, messageData.attachments);
    }

    // Handle threading
    if (messageData.replyToId) {
      await this.addToThread(messageData.replyToId, messageId);
    }

    // Store message
    this.messages.set(messageId, message);

    // Initialize democratic voting for this message
    this.messageVotes.set(messageId, {
      upvotes: new Set(),
      downvotes: new Set(),
      netScore: 0,
      authorId: userId,
      channelId: channelId,
      visibilityRank: 0,
      quorumTriggered: false,
      semanticWords: this.extractSemanticWords(messageData.content)
    });

    // Initialize delivery tracking
    this.messageDeliveryStatus.set(messageId, {
      sent: Date.now(),
      delivered: null,
      read: null,
      deliveredTo: new Set(),
      readBy: new Set()
    });

    // Initialize reactions
    this.messageReactions.set(messageId, new Map());

    // Index for search
    this.indexMessageForSearch(messageId, message);

    console.log(`💬 Message sent: ${userId} in ${channelId} (${message.type})`);
    return message;
  }

  /**
   * Add emoji reaction to message
   */
  async addReaction(messageId, userId, emoji) {
    if (!this.messages.has(messageId)) {
      throw new Error('Message not found');
    }

    if (!this.messageReactions.has(messageId)) {
      this.messageReactions.set(messageId, new Map());
    }

    const reactions = this.messageReactions.get(messageId);
    const previousReaction = reactions.get(userId);

    // Update reaction
    reactions.set(userId, {
      emoji,
      timestamp: Date.now(),
      previousEmoji: previousReaction?.emoji || null
    });

    // Update message reaction count
    const message = this.messages.get(messageId);
    message.reactions = reactions;

    console.log(`😀 User ${userId} reacted ${emoji} to message ${messageId}`);
    return this.getMessageReactionStats(messageId);
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId) {
    if (!this.messageReactions.has(messageId)) {
      return;
    }

    const reactions = this.messageReactions.get(messageId);
    if (reactions.has(userId)) {
      reactions.delete(userId);
      
      const message = this.messages.get(messageId);
      message.reactions = reactions;
      
      console.log(`🚫 User ${userId} removed reaction from message ${messageId}`);
    }

    return this.getMessageReactionStats(messageId);
  }

  /**
   * Edit message content
   */
  async editMessage(messageId, userId, newContent) {
    if (!this.messages.has(messageId)) {
      throw new Error('Message not found');
    }

    const message = this.messages.get(messageId);
    
    // Check if user can edit (must be sender and within edit window)
    if (message.senderId !== userId) {
      throw new Error('Only message sender can edit');
    }

    const editWindow = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.createdAt > editWindow) {
      throw new Error('Edit window expired');
    }

    // Store edit history
    message.editHistory.push({
      previousContent: message.content,
      editedAt: Date.now(),
      editReason: 'user_edit'
    });

    // Update content
    message.content = newContent;
    message.lastModified = Date.now();
    message.isEdit = true;

    // Re-index for search
    this.indexMessageForSearch(messageId, message);

    console.log(`✏️ Message ${messageId} edited by ${userId}`);
    return message;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId, userId, deleteType = 'soft') {
    if (!this.messages.has(messageId)) {
      throw new Error('Message not found');
    }

    const message = this.messages.get(messageId);
    
    // Check permissions
    if (message.senderId !== userId) {
      throw new Error('Only message sender can delete');
    }

    if (deleteType === 'soft') {
      message.isDeleted = true;
      message.content = '[Message deleted]';
      message.lastModified = Date.now();
    } else {
      // Hard delete - remove completely
      this.messages.delete(messageId);
      this.messageReactions.delete(messageId);
      this.messageDeliveryStatus.delete(messageId);
    }

    console.log(`🗑️ Message ${messageId} ${deleteType} deleted by ${userId}`);
    return { success: true, deleteType };
  }

  /**
   * Search messages in channel with advanced filtering
   */
  async searchMessages(channelId, query, options = {}) {
    const {
      messageTypes = null,
      senderId = null,
      dateRange = null,
      hasAttachments = null,
      hasReactions = null,
      limit = 50,
      offset = 0
    } = options;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    let matchingMessages = [];

    // Find all messages in channel
    for (const message of this.messages.values()) {
      if (message.channelId !== channelId || message.isDeleted) continue;

      // Apply filters
      if (messageTypes && !messageTypes.includes(message.type)) continue;
      if (senderId && message.senderId !== senderId) continue;
      if (hasAttachments !== null && (message.attachments.length > 0) !== hasAttachments) continue;
      if (hasReactions !== null && (message.reactions.size > 0) !== hasReactions) continue;

      // Date range filter
      if (dateRange) {
        if (dateRange.start && message.createdAt < dateRange.start) continue;
        if (dateRange.end && message.createdAt > dateRange.end) continue;
      }

      // Text search
      if (searchTerms.length > 0) {
        const messageText = message.content.toLowerCase();
        const matchCount = searchTerms.filter(term => messageText.includes(term)).length;
        if (matchCount === 0) continue;

        message.searchRelevance = matchCount / searchTerms.length;
      } else {
        message.searchRelevance = 1;
      }

      matchingMessages.push(message);
    }

    // Sort by relevance and recency
    matchingMessages.sort((a, b) => {
      const relevanceDiff = (b.searchRelevance || 0) - (a.searchRelevance || 0);
      if (relevanceDiff !== 0) return relevanceDiff;
      return b.createdAt - a.createdAt;
    });

    // Apply pagination
    const paginatedMessages = matchingMessages.slice(offset, offset + limit);

    return {
      messages: paginatedMessages,
      total: matchingMessages.length,
      query,
      offset,
      limit
    };
  }

  /**
   * Get message thread (replies)
   */
  getMessageThread(parentMessageId) {
    if (!this.messageThreads.has(parentMessageId)) {
      return { parentMessage: null, replies: [] };
    }

    const parentMessage = this.messages.get(parentMessageId);
    const replyIds = this.messageThreads.get(parentMessageId);
    const replies = replyIds
      .map(id => this.messages.get(id))
      .filter(msg => msg && !msg.isDeleted)
      .sort((a, b) => a.createdAt - b.createdAt);

    return {
      parentMessage,
      replies,
      totalReplies: replies.length
    };
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId, userId) {
    if (!this.messageDeliveryStatus.has(messageId)) return;

    const status = this.messageDeliveryStatus.get(messageId);
    status.deliveredTo.add(userId);
    
    if (!status.delivered) {
      status.delivered = Date.now();
    }

    console.log(`📬 Message ${messageId} delivered to ${userId}`);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, userId) {
    if (!this.messageDeliveryStatus.has(messageId)) return;

    const status = this.messageDeliveryStatus.get(messageId);
    status.readBy.add(userId);
    
    if (!status.read) {
      status.read = Date.now();
    }

    // Update read receipt on message
    const message = this.messages.get(messageId);
    if (message) {
      message.readReceipts.set(userId, Date.now());
    }

    console.log(`👁️ Message ${messageId} read by ${userId}`);
  }

  /**
   * Set user typing status
   */
  setTypingStatus(channelId, userId, isTyping) {
    if (!this.userTypingStatus.has(channelId)) {
      this.userTypingStatus.set(channelId, new Map());
    }

    const channelTyping = this.userTypingStatus.get(channelId);
    
    if (isTyping) {
      channelTyping.set(userId, {
        startedAt: Date.now(),
        lastUpdate: Date.now()
      });
    } else {
      channelTyping.delete(userId);
    }

    // Auto-cleanup typing status after 10 seconds
    setTimeout(() => {
      if (channelTyping.has(userId)) {
        const typingData = channelTyping.get(userId);
        if (Date.now() - typingData.lastUpdate > 10000) {
          channelTyping.delete(userId);
        }
      }
    }, 10000);
  }

  /**
   * Get users currently typing in channel
   */
  getTypingUsers(channelId) {
    if (!this.userTypingStatus.has(channelId)) {
      return [];
    }

    const channelTyping = this.userTypingStatus.get(channelId);
    const typingUsers = [];
    const now = Date.now();

    for (const [userId, typingData] of channelTyping) {
      // Only include if typing activity is recent (within 10 seconds)
      if (now - typingData.lastUpdate < 10000) {
        typingUsers.push({
          userId,
          startedAt: typingData.startedAt,
          duration: now - typingData.startedAt
        });
      }
    }

    return typingUsers;
  }

  /**
   * Process file attachments
   */
  async processAttachments(messageId, attachments) {
    const processedAttachments = [];

    for (const attachment of attachments) {
      const processed = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageId,
        type: attachment.type, // 'image', 'video', 'audio', 'document'
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        url: attachment.url,
        thumbnailUrl: attachment.thumbnailUrl,
        metadata: {
          width: attachment.width,
          height: attachment.height,
          duration: attachment.duration,
          uploadedAt: Date.now()
        }
      };

      processedAttachments.push(processed);
    }

    this.fileAttachments.set(messageId, processedAttachments);
    return processedAttachments;
  }

  /**
   * Add message to thread
   */
  async addToThread(parentMessageId, replyMessageId) {
    if (!this.messageThreads.has(parentMessageId)) {
      this.messageThreads.set(parentMessageId, []);
    }

    this.messageThreads.get(parentMessageId).push(replyMessageId);

    // Update parent message reply count
    const parentMessage = this.messages.get(parentMessageId);
    if (parentMessage) {
      parentMessage.threadReplies = this.messageThreads.get(parentMessageId).length;
    }
  }

  /**
   * Get message reaction statistics
   */
  getMessageReactionStats(messageId) {
    if (!this.messageReactions.has(messageId)) {
      return { total: 0, breakdown: {} };
    }

    const reactions = this.messageReactions.get(messageId);
    const breakdown = {};

    for (const reaction of reactions.values()) {
      breakdown[reaction.emoji] = (breakdown[reaction.emoji] || 0) + 1;
    }

    return {
      total: reactions.size,
      breakdown,
      recentReactions: Array.from(reactions.entries())
        .map(([userId, reaction]) => ({ userId, ...reaction }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
    };
  }

  /**
   * Index message for search
   */
  indexMessageForSearch(messageId, message) {
    const searchText = [
      message.content,
      ...message.mentions.map(m => m.username || m.userId),
      ...message.attachments.map(a => a.fileName || '')
    ].join(' ').toLowerCase();

    // Store in channel-specific search index
    const channelId = message.channelId;
    if (!this.messageSearchIndex.has(channelId)) {
      this.messageSearchIndex.set(channelId, new Map());
    }

    this.messageSearchIndex.get(channelId).set(messageId, searchText);
  }

  /**
   * Extract semantic words from message content for topic linking
   * @param {string} content - Message content
   * @returns {Array} Array of meaningful words/phrases
   */
  extractSemanticWords(content) {
    if (!content || typeof content !== 'string') return [];
    
    // Remove common words and extract meaningful terms
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 2 && !stopWords.has(word)) // Filter meaningful words
      .slice(0, 10); // Limit to top 10 words
    
    return words;
  }

  /**
   * Calculate message visibility rank based on votes, author reputation, and time decay
   * @param {string} messageId - Message ID
   * @param {number} authorPercentile - Author's percentile in channel
   * @returns {number} Visibility rank (higher = more visible)
   */
  calculateMessageVisibilityRank(messageId, authorPercentile = 50) {
    const messageVotes = this.messageVotes.get(messageId);
    const message = this.messages.get(messageId);
    
    if (!messageVotes || !message) return 0;
    
    const timeDecayFactor = this.calculateTimeDecay(message.createdAt);
    const authorReliabilityBonus = Math.log10(authorPercentile + 1) / 2; // 0-1 bonus
    const voteScore = messageVotes.netScore;
    
    // Combined ranking formula
    const visibilityRank = (voteScore * 10) + (authorReliabilityBonus * 5) + (timeDecayFactor * 3);
    
    this.messageVisibilityRank.set(messageId, visibilityRank);
    return visibilityRank;
  }

  /**
   * Calculate time decay factor for message ranking
   * @param {number} createdAt - Message creation timestamp
   * @returns {number} Time decay factor (0-1, where 1 is newest)
   */
  calculateTimeDecay(createdAt) {
    const now = Date.now();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);
    
    // Exponential decay over 24 hours
    return Math.exp(-ageInHours / 24);
  }

  /**
   * Get messages sorted by visibility rank for channel
   * @param {string} channelId - Channel ID
   * @returns {Array} Sorted messages by visibility
   */
  getMessagesByVisibilityRank(channelId) {
    const channelMessages = [];
    
    for (const message of this.messages.values()) {
      if (message.channelId === channelId && !message.isDeleted) {
        const hiddenMessages = this.hiddenMessages.get(channelId) || new Set();
        
        // Skip hidden messages unless user has permission
        if (!hiddenMessages.has(message.id)) {
          channelMessages.push({
            ...message,
            visibilityRank: this.messageVisibilityRank.get(message.id) || 0,
            votes: this.messageVotes.get(message.id)
          });
        }
      }
    }
    
    // Sort by visibility rank (highest first)
    return channelMessages.sort((a, b) => b.visibilityRank - a.visibilityRank);
  }

  /**
   * Pin message via quorum voting
   * @param {string} channelId - Channel ID
   * @param {string} messageId - Message ID
   * @param {string} reason - Reason for pinning
   */
  pinMessageByQuorum(channelId, messageId, reason = 'community_vote') {
    if (!this.pinnedMessages.has(channelId)) {
      this.pinnedMessages.set(channelId, new Set());
    }
    
    const pinnedMessages = this.pinnedMessages.get(channelId);
    pinnedMessages.add(messageId);
    
    // Add to quorum actions log
    const actionLog = this.messageQuorumActions.get(messageId) || [];
    actionLog.push({
      action: 'pinned',
      timestamp: Date.now(),
      reason: reason,
      triggeredBy: 'quorum'
    });
    this.messageQuorumActions.set(messageId, actionLog);
    
    return true;
  }

  /**
   * Hide message via quorum voting
   * @param {string} channelId - Channel ID
   * @param {string} messageId - Message ID
   * @param {string} reason - Reason for hiding
   */
  hideMessageByQuorum(channelId, messageId, reason = 'community_downvote') {
    if (!this.hiddenMessages.has(channelId)) {
      this.hiddenMessages.set(channelId, new Set());
    }
    
    const hiddenMessages = this.hiddenMessages.get(channelId);
    hiddenMessages.add(messageId);
    
    // Add to quorum actions log
    const actionLog = this.messageQuorumActions.get(messageId) || [];
    actionLog.push({
      action: 'hidden',
      timestamp: Date.now(),
      reason: reason,
      triggeredBy: 'quorum'
    });
    this.messageQuorumActions.set(messageId, actionLog);
    
    return true;
  }

  /**
   * Get channel message statistics
   */
  getChannelMessageStats(channelId) {
    let totalMessages = 0;
    let totalReactions = 0;
    let totalThreads = 0;
    let messageTypes = {};

    for (const message of this.messages.values()) {
      if (message.channelId !== channelId || message.isDeleted) continue;

      totalMessages++;
      totalReactions += message.reactions.size;
      
      if (this.messageThreads.has(message.id)) {
        totalThreads++;
      }

      messageTypes[message.type] = (messageTypes[message.type] || 0) + 1;
    }

    return {
      totalMessages,
      totalReactions,
      totalThreads,
      messageTypes,
      channelId
    };
  }
}

export default EnhancedMessageSystem;
