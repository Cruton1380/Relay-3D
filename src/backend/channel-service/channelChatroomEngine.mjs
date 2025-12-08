/**
 * @fileoverview Enhanced Channel Chatroom Engine
 * Implements community-driven moderation with percentile-based filtering
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';
import chatUserVotingService from './chatUserVoting.mjs';
import dictionaryTextParser from '../dictionary/dictionaryTextParser.mjs';

const chatroomLogger = logger.child({ module: 'chatroom-engine' });

class ChannelChatroomEngine {
  constructor() {
    this.channels = new Map(); // Map(channelId -> chatroomData)
    this.messageStore = new Map(); // Map(messageId -> messageData)
    this.userSessions = new Map(); // Map(userId -> sessionData)
    this.typingIndicators = new Map(); // Map(channelId -> Set(userIds))
    
    this.initialized = false;
  }

  /**
   * Initialize the chatroom engine
   */
  async initialize() {
    try {
      await this.loadChatroomData();
      await chatUserVotingService.initialize();
      this.setupEventHandlers();
      this.initialized = true;
      chatroomLogger.info('Channel Chatroom Engine initialized');
    } catch (error) {
      chatroomLogger.error('Failed to initialize chatroom engine', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup event handlers for real-time updates
   */
  setupEventHandlers() {
    eventBus.on('chat:user-score-updated', this.handleUserScoreUpdate.bind(this));
    eventBus.on('chat:moderation-threshold-updated', this.handleModerationThresholdUpdate.bind(this));
    eventBus.on('user:activity-updated', this.handleUserActivityUpdate.bind(this));
  }

  /**
   * Create or get chatroom for a channel
   * @param {string} channelId - Channel ID
   * @param {Object} channelData - Channel metadata
   */
  async createChatroom(channelId, channelData) {
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId);
    }

    const chatroom = {
      id: channelId,
      name: channelData.name,
      channelType: channelData.channelType,
      created: Date.now(),
      activeUsers: new Set(),
      messages: [],
      messageCount: 0,
      settings: {
        moderationThreshold: 10, // Default 10th percentile
        filterThreshold: -10, // Default message filter threshold
        enableReactions: true,
        enableThreads: true,
        enableMediaSharing: true,
        maxMessageLength: 2000
      }
    };

    this.channels.set(channelId, chatroom);
    
    // Initialize moderation settings
    await chatUserVotingService.setChannelModerationThreshold(channelId, chatroom.settings.moderationThreshold);
    await chatUserVotingService.setChannelFilterThreshold(channelId, chatroom.settings.filterThreshold);

    chatroomLogger.info('Chatroom created', { channelId, name: channelData.name });
    return chatroom;
  }

  /**
   * Send message to chatroom with enhanced moderation and semantic linking
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} content - Message content
   * @param {string} messageType - Message type (text, media, etc.)
   * @param {Object} metadata - Additional message metadata
   */
  async sendMessage(channelId, userId, content, messageType = 'text', metadata = {}) {
    try {
      const chatroom = this.channels.get(channelId);
      if (!chatroom) {
        throw new Error('Chatroom not found');
      }

      // Check if user is muted
      const moderationStatus = chatUserVotingService.getUserModerationStatus(userId, channelId);
      if (moderationStatus.isMuted) {
        throw new Error('You are muted in this channel due to low community standing');
      }

      // Server-side semantic parsing for text messages
      let semanticData = null;
      if (messageType === 'text' && content && content.trim()) {
        try {
          // Parse text content and extract semantic entities
          semanticData = await dictionaryTextParser.parseText(content, userId, {
            maxDensity: 0.3,
            includePhraseTags: false, // We'll handle rendering client-side
            prioritizeImportant: true,
            respectLineBreaks: true
          });
          
          chatroomLogger.debug('Message semantic parsing completed', {
            channelId,
            messageLength: content.length,
            entitiesFound: semanticData.entities.length
          });
        } catch (error) {
          chatroomLogger.warn('Failed to parse message semantics', {
            error: error.message,
            channelId,
            userId: userId.substring(0, 8)
          });
          // Continue without semantic data if parsing fails
          semanticData = { text: content, entities: [] };
        }
      }

      // Create message
      const messageId = crypto.randomUUID();
      const message = {
        id: messageId,
        channelId,
        authorId: userId,
        content: content.trim(),
        messageType,
        timestamp: Date.now(),
        reactions: new Map(),
        replies: [],
        isEdited: false,
        isDeleted: false,
        metadata: {
          ...metadata,
          authorModerationStatus: moderationStatus,
          semanticData // Store parsed semantic entities
        }
      };

      // Store message
      this.messageStore.set(messageId, message);
      chatroom.messages.push(messageId);
      chatroom.messageCount++;

      // Update message visibility based on user score
      await chatUserVotingService.updateMessageVisibility(messageId, channelId, userId);

      // Prepare semantic links for legacy hook system
      if (semanticData && semanticData.entities.length > 0) {
        const semanticLinks = chatUserVotingService.prepareSemanticLinks(content, channelId);
        message.metadata.semanticLinks = semanticLinks;
      }

      // Broadcast message with semantic data
      eventBus.emit('chatroom:message-sent', {
        channelId,
        message: {
          ...message,
          author: {
            id: userId,
            score: moderationStatus.score,
            percentile: moderationStatus.percentile,
            badge: moderationStatus.badge,
            status: moderationStatus.status
          },
          // Include semantic data for client rendering
          semanticData: semanticData || { text: content, entities: [] }
        }
      });

      chatroomLogger.info('Message sent', {
        channelId,
        messageId,
        userId: userId.substring(0, 8),
        messageType,
        authorStatus: moderationStatus.status
      });

      return {
        success: true,
        messageId,
        message: {
          ...message,
          author: {
            id: userId,
            score: moderationStatus.score,
            percentile: moderationStatus.percentile,
            badge: moderationStatus.badge,
            status: moderationStatus.status
          }
        }
      };

    } catch (error) {
      chatroomLogger.error('Failed to send message', {
        error: error.message,
        channelId,
        userId: userId.substring(0, 8)
      });
      throw error;
    }
  }

  /**
   * Vote on a user's message or general behavior
   * @param {string} channelId - Channel ID
   * @param {string} voterId - User casting vote
   * @param {string} targetUserId - User being voted on
   * @param {string} voteType - 'upvote' or 'downvote'
   * @param {string} messageId - Optional specific message
   */
  async voteOnUser(channelId, voterId, targetUserId, voteType, messageId = null) {
    try {
      const result = await chatUserVotingService.voteOnUserEnhanced(
        voterId, 
        targetUserId, 
        channelId, 
        voteType, 
        messageId
      );

      // If voting on a specific message, update its visibility
      if (messageId) {
        const message = this.messageStore.get(messageId);
        if (message) {
          const targetStatus = chatUserVotingService.getUserModerationStatus(targetUserId, channelId);
          message.metadata.authorModerationStatus = targetStatus;
        }
      }

      // Broadcast vote result
      eventBus.emit('chatroom:vote-cast', {
        channelId,
        voterId,
        targetUserId,
        voteType,
        messageId,
        result
      });

      return result;

    } catch (error) {
      chatroomLogger.error('Failed to cast vote', {
        error: error.message,
        channelId,
        voterId: voterId.substring(0, 8),
        targetUserId: targetUserId.substring(0, 8),
        voteType
      });
      throw error;
    }
  }

  /**
   * Get enhanced chatroom messages with moderation data and semantic linking
   * @param {string} channelId - Channel ID
   * @param {Object} filters - Message filters
   * @param {number} limit - Message limit
   * @param {number} offset - Message offset
   */
  async getMessages(channelId, filters = {}, limit = 50, offset = 0) {
    try {
      const chatroom = this.channels.get(channelId);
      if (!chatroom) {
        throw new Error('Chatroom not found');
      }

      // Use enhanced search functionality
      const searchResult = await chatUserVotingService.searchChatroomMessages(channelId, {
        ...filters,
        limit,
        offset
      });

      // Get actual message data
      const messageIds = chatroom.messages.slice(-1000); // Get recent messages
      const messages = await Promise.all(
        messageIds
          .map(id => this.messageStore.get(id))
          .filter(Boolean)
          .slice(offset, offset + limit)
          .map(async (msg) => {
            const authorStatus = chatUserVotingService.getUserModerationStatus(msg.authorId, channelId);
            
            // Get or generate semantic data
            let semanticData = msg.metadata?.semanticData;
            
            // Progressive enhancement: parse older messages that don't have semantic data
            if (!semanticData && msg.messageType === 'text' && msg.content) {
              try {
                semanticData = await dictionaryTextParser.parseText(msg.content, msg.authorId, {
                  maxDensity: 0.2, // Lower density for background parsing
                  includePhraseTags: false,
                  prioritizeImportant: true,
                  respectLineBreaks: true
                });
                
                // Cache the parsed result
                if (!msg.metadata) msg.metadata = {};
                msg.metadata.semanticData = semanticData;
                
                chatroomLogger.debug('Background semantic parsing completed', {
                  messageId: msg.id.substring(0, 8),
                  entitiesFound: semanticData.entities.length
                });
              } catch (error) {
                chatroomLogger.warn('Background semantic parsing failed', {
                  error: error.message,
                  messageId: msg.id.substring(0, 8)
                });
                semanticData = { text: msg.content, entities: [] };
              }
            }

            return {
              ...msg,
              author: {
                id: msg.authorId,
                score: authorStatus.score,
                percentile: authorStatus.percentile,
                badge: authorStatus.badge,
                status: authorStatus.status,
                canDownvote: authorStatus.canDownvote
              },
              // Include semantic data for client rendering
              semanticData: semanticData || { text: msg.content, entities: [] }
            };
          })
      );

      return {
        messages,
        totalCount: messages.length,
        filterOptions: chatUserVotingService.getChannelFilterOptions(channelId),
        semanticStats: {
          totalParsed: messages.filter(m => m.semanticData?.entities?.length > 0).length,
          totalEntities: messages.reduce((sum, m) => sum + (m.semanticData?.entities?.length || 0), 0)
        }
      };

    } catch (error) {
      chatroomLogger.error('Failed to get messages', {
        error: error.message,
        channelId
      });
      throw error;
    }
  }

  /**
   * Join user to chatroom
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  async joinChatroom(channelId, userId) {
    const chatroom = this.channels.get(channelId);
    if (!chatroom) {
      throw new Error('Chatroom not found');
    }

    chatroom.activeUsers.add(userId);
    
    // Update user session
    this.userSessions.set(userId, {
      channelId,
      joinedAt: Date.now(),
      lastActivity: Date.now()
    });

    // Get user moderation status
    const moderationStatus = chatUserVotingService.getUserModerationStatus(userId, channelId);

    // Broadcast user joined
    eventBus.emit('chatroom:user-joined', {
      channelId,
      userId,
      moderationStatus,
      activeUserCount: chatroom.activeUsers.size
    });

    chatroomLogger.info('User joined chatroom', {
      channelId,
      userId: userId.substring(0, 8),
      status: moderationStatus.status
    });

    return {
      success: true,
      moderationStatus,
      activeUserCount: chatroom.activeUsers.size
    };
  }

  /**
   * Remove user from chatroom
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  async leaveChatroom(channelId, userId) {
    const chatroom = this.channels.get(channelId);
    if (!chatroom) {
      return { success: false, error: 'Chatroom not found' };
    }

    chatroom.activeUsers.delete(userId);
    this.userSessions.delete(userId);

    // Clear typing indicator
    const typingUsers = this.typingIndicators.get(channelId);
    if (typingUsers) {
      typingUsers.delete(userId);
    }

    // Broadcast user left
    eventBus.emit('chatroom:user-left', {
      channelId,
      userId,
      activeUserCount: chatroom.activeUsers.size
    });

    chatroomLogger.info('User left chatroom', {
      channelId,
      userId: userId.substring(0, 8)
    });

    return {
      success: true,
      activeUserCount: chatroom.activeUsers.size
    };
  }

  /**
   * Update channel moderation settings
   * @param {string} channelId - Channel ID
   * @param {Object} settings - New settings
   */
  async updateModerationSettings(channelId, settings) {
    const chatroom = this.channels.get(channelId);
    if (!chatroom) {
      throw new Error('Chatroom not found');
    }

    if (settings.moderationThreshold !== undefined) {
      await chatUserVotingService.setChannelModerationThreshold(channelId, settings.moderationThreshold);
      chatroom.settings.moderationThreshold = settings.moderationThreshold;
    }

    if (settings.filterThreshold !== undefined) {
      await chatUserVotingService.setChannelFilterThreshold(channelId, settings.filterThreshold);
      chatroom.settings.filterThreshold = settings.filterThreshold;
    }

    // Update other settings
    Object.assign(chatroom.settings, settings);

    chatroomLogger.info('Moderation settings updated', {
      channelId,
      settings
    });

    return { success: true, settings: chatroom.settings };
  }

  /**
   * Handle user score update events
   */
  handleUserScoreUpdate(data) {
    const { channelId, targetUserId } = data;
    
    // Update any cached user data
    const chatroom = this.channels.get(channelId);
    if (chatroom) {
      // Broadcast real-time score update
      eventBus.emit('chatroom:score-update', data);
    }
  }

  /**
   * Handle moderation threshold update events
   */
  handleModerationThresholdUpdate(data) {
    const { channelId, threshold } = data;
    
    const chatroom = this.channels.get(channelId);
    if (chatroom) {
      chatroom.settings.moderationThreshold = threshold;
      
      // Broadcast threshold update
      eventBus.emit('chatroom:threshold-update', data);
    }
  }

  /**
   * Handle user activity update events
   */
  handleUserActivityUpdate(data) {
    // Update user activity data for percentile calculations
    // This would integrate with the user activity tracking system
  }

  /**
   * Load chatroom data from storage
   */
  async loadChatroomData() {
    // In a real implementation, this would load from persistent storage
    chatroomLogger.info('Loading chatroom data from storage');
  }

  /**
   * Save chatroom data to storage
   */
  async saveChatroomData() {
    // In a real implementation, this would save to persistent storage
    chatroomLogger.info('Saving chatroom data to storage');
  }

  /**
   * Shutdown the chatroom engine
   */
  async shutdown() {
    await this.saveChatroomData();
    this.initialized = false;
    chatroomLogger.info('Channel Chatroom Engine shut down');
  }
}

// Create and export singleton instance
const channelChatroomEngine = new ChannelChatroomEngine();
export default channelChatroomEngine;
