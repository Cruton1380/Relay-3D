/**
 * @fileoverview Channel Service Frontend Integration
 * Provides API client and WebSocket connection for channel functionality
 */
import { EventEmitter } from '../utils/EventEmitter';
import api from './apiClient';
import { signData } from './cryptoService';
import websocketService from './websocketService';

class ChannelService extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = import.meta.env.VITE_CHANNEL_SERVICE_URL || 'http://localhost:3002';
    this.wsUrl = this.baseUrl.replace('http', 'ws');
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // State
    this.channels = new Map();
    this.userChannels = new Set();
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize service and establish WebSocket connection
   * @param {string} userId - Current user ID
   * @param {string} token - Authentication token
   */
  async initialize(userId, token) {
    this.currentUser = userId;
    this.token = token;
    
    try {
      await this.connectWebSocket();
      return true;
    } catch (error) {
      console.error('Failed to initialize Channel Service:', error);
      return false;
    }
  }

  /**
   * Establish WebSocket connection
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to Channel Service');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate immediately
          this.authenticate();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('Disconnected from Channel Service');
          this.isConnected = false;
          this.isAuthenticated = false;
          this.emit('disconnected');
          
          // Attempt reconnection
          this.attemptReconnection();
        };
        
        this.ws.onerror = (error) => {
          console.error('Channel Service WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'authenticated':
        this.isAuthenticated = data.success;
        this.emit('authenticated', data);
        break;
        
      case 'user_channels':
        this.updateUserChannels(data.channels);
        this.emit('channels_updated', data.channels);
        break;
        
      case 'channel_message':
        this.handleChannelMessage(data);
        break;
        
      case 'typing_indicator':
        this.emit('typing_indicator', data);
        break;
        
      case 'presence_update':
        this.emit('presence_update', data);
        break;
        
      case 'member_joined':
        this.emit('member_joined', data);
        break;
        
      case 'member_left':
        this.emit('member_left', data);
        break;
        
      case 'error':
        console.error('Channel Service error:', data.message);
        this.emit('error', data);
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Handle incoming channel message
   */
  handleChannelMessage(messageData) {
    const { channelId } = messageData;
    
    // Update channel's last activity
    if (this.channels.has(channelId)) {
      const channel = this.channels.get(channelId);
      channel.lastActivity = messageData.timestamp;
    }
    
    this.emit('channel_message', messageData);
    this.emit(`channel_message_${channelId}`, messageData);
  }

  /**
   * Update user channels cache
   */
  updateUserChannels(channels) {
    this.channels.clear();
    this.userChannels.clear();
    
    for (const channel of channels) {
      this.channels.set(channel.id, channel);
      this.userChannels.add(channel.id);
    }
  }

  /**
   * Authenticate with the service
   */
  authenticate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage('authenticate', {
        userId: this.currentUser,
        token: this.token
      });
    }
  }

  /**
   * Send WebSocket message
   */
  sendMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Attempt WebSocket reconnection
   */
  attemptReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`Attempting to reconnect to Channel Service (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connectWebSocket().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for Channel Service');
      this.emit('connection_failed');
    }
  }

  // API Methods

  /**
   * Create a new channel
   */
  async createChannel(channelData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          ...channelData,
          creatorId: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add to local cache
        this.channels.set(result.channel.id, result.channel);
        this.userChannels.add(result.channel.id);
        this.emit('channel_created', result.channel);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  /**
   * Discover channels based on criteria
   */
  async discoverChannels(criteria = {}) {
    try {
      const params = new URLSearchParams({
        userId: this.currentUser,
        ...criteria
      });
      
      const response = await fetch(`${this.baseUrl}/api/channels/discover?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const result = await response.json();
      return result.channels || [];
    } catch (error) {
      console.error('Failed to discover channels:', error);
      throw error;
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join channel');
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          channelId,
          userId: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local cache
        this.channels.delete(channelId);
        this.userChannels.delete(channelId);
        this.emit('channel_left', { channelId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    }
  }

  /**
   * Get channel details
   */
  async getChannel(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const result = await response.json();
      
      if (result.channel) {
        // Update cache
        this.channels.set(channelId, result.channel);
      }
      
      return result.channel;
    } catch (error) {
      console.error('Failed to get channel:', error);
      throw error;
    }
  }

  /**
   * Get channel messages
   */
  async getChannelMessages(channelId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        before: options.before || '',
        after: options.after || ''
      });
      
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const result = await response.json();
      return result.messages || [];
    } catch (error) {
      console.error('Failed to get channel messages:', error);
      throw error;
    }
  }

  /**
   * Send message to channel
   */
  async sendChannelMessage(channelId, message, messageType = 'text') {
    try {
      // Send via WebSocket for real-time delivery
      this.sendMessage('channel_message', {
        channelId,
        message,
        messageType
      });
      
      // Also send via HTTP for reliability
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          message,
          messageType,
          senderId: this.currentUser
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to send channel message:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(channelId, isTyping) {
    this.sendMessage('typing_indicator', {
      channelId,
      isTyping
    });
  }

  /**
   * Update presence status
   */
  updatePresence(status) {
    this.sendMessage('presence_update', { status });
  }

  /**
   * Get user's channels
   */
  getUserChannels() {
    return Array.from(this.userChannels).map(id => this.channels.get(id)).filter(Boolean);
  }

  /**
   * Check if user is member of channel
   */
  isMemberOf(channelId) {
    return this.userChannels.has(channelId);
  }

  // Member Management API Methods

  /**
   * Get channel members
   */
  async getChannelMembers(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const result = await response.json();
      return result.members || [];
    } catch (error) {
      console.error('Failed to get channel members:', error);
      throw error;
    }
  }

  /**
   * Add member to channel
   */
  async addMember(channelId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          addedBy: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_added', { channelId, userId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  }

  /**
   * Remove member from channel
   */
  async removeMember(channelId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          removedBy: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_removed', { channelId, userId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Kick member from channel
   */
  async kickMember(channelId, userId, reason = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          kickedBy: this.currentUser,
          reason
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_kicked', { channelId, userId, reason });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to kick member:', error);
      throw error;
    }
  }

  /**
   * Ban member from channel
   */
  async banMember(channelId, userId, reason = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          bannedBy: this.currentUser,
          reason
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_banned', { channelId, userId, reason });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to ban member:', error);
      throw error;
    }
  }

  /**
   * Promote member to moderator
   */
  async promoteMember(channelId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          promotedBy: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_promoted', { channelId, userId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to promote member:', error);
      throw error;
    }
  }

  /**
   * Demote member from moderator
   */
  async demoteMember(channelId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/members/${userId}/demote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          demotedBy: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('member_demoted', { channelId, userId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to demote member:', error);
      throw error;
    }
  }

  /**
   * Transfer channel ownership
   */
  async transferOwnership(channelId, newOwnerId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          newOwnerId,
          currentOwnerId: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('ownership_transferred', { channelId, newOwnerId, oldOwnerId: this.currentUser });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
      throw error;
    }
  }

  /**
   * Disconnect from service
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      channelCount: this.userChannels.size
    };
  }

  /**
   * Add reaction to message
   */
  async addReaction(channelId, messageId, emoji) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          emoji,
          userId: this.userId
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add reaction');
      }

      return result.reaction;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(channelId, messageId, emoji) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages/${messageId}/reactions/${emoji}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.userId
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove reaction');
      }

      return true;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Get message reactions
   */
  async getMessageReactions(channelId, messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages/${messageId}/reactions`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get reactions');
      }

      return result.reactions;
    } catch (error) {
      console.error('Failed to get reactions:', error);
      throw error;
    }
  }

  /**
   * Reply to message
   */
  async replyToMessage(channelId, messageId, message, messageType = 'text') {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages/${messageId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          message,
          messageType,
          userId: this.userId
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send reply');
      }

      return result.reply;
    } catch (error) {
      console.error('Failed to reply to message:', error);
      throw error;
    }
  }

  /**
   * Get message replies
   */
  async getMessageReplies(channelId, messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages/${messageId}/replies`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get replies');
      }

      return result.replies;
    } catch (error) {
      console.error('Failed to get replies:', error);
      throw error;
    }
  }

  /**
   * Search messages in channel
   */
  async searchMessages(channelId, query, options = {}) {
    try {
      const params = new URLSearchParams({
        query: query || '',
        userId: this.userId,
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to search messages');
      }

      return {
        messages: result.messages,
        total: result.total,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  }

  /**
   * Validate message ownership
   */
  async validateMessageOwnership(channelId, message, signature) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/validate-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          message,
          signature,
          userId: this.userId
        })
      });

      const result = await response.json();
      return result.valid || false;
    } catch (error) {
      console.error('Failed to validate message ownership:', error);
      return false;
    }
  }

  // Encounter History API Methods

  /**
   * Get user's encounter history
   */
  async getEncounterHistory(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        offset: options.offset || 0,
        ...options
      });

      const response = await fetch(`${this.baseUrl}/api/users/${this.currentUser}/encounters?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get encounter history:', error);
      throw error;
    }
  }

  /**
   * Search encounters by location
   */
  async searchEncountersByLocation(location, radius = 1000, options = {}) {
    try {
      const params = new URLSearchParams({
        lat: location.lat,
        lon: location.lon,
        radius,
        limit: options.limit || 20,
        channelType: options.channelType || ''
      });

      const response = await fetch(`${this.baseUrl}/api/users/${this.currentUser}/encounters/location?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to search encounters by location:', error);
      throw error;
    }
  }

  /**
   * Get read-only access to archived channel
   */
  async getReadOnlyChannelAccess(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/read-only/${this.currentUser}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get read-only channel access:', error);
      throw error;
    }
  }

  /**
   * Get channel encounter statistics
   */
  async getChannelEncounterStats(channelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/encounters/stats`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get channel encounter stats:', error);
      throw error;
    }
  }

  /**
   * Manually record an encounter
   */
  async recordEncounter(channelId, location, duration = 0, interaction = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/encounters/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.currentUser,
          channelId,
          location,
          duration,
          interaction
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to record encounter:', error);
      throw error;
    }
  }

  // Content Voting Methods

  /**
   * Cast a vote on content (message or feed post)
   * @param {string} channelId - Channel ID
   * @param {string} contentId - Content ID (message or post ID)
   * @param {string} voteType - 'upvote', 'downvote', or 'remove'
   */
  async voteOnContent(channelId, contentId, voteType) {
    try {
      const response = await fetch(`${this.baseUrl}/api/channels/${channelId}/content/${contentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.currentUser,
          voteType
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error('Failed to vote on content:', error);
      throw error;
    }
  }
}

// Create default instance
const channelService = new ChannelService();

// Helper functions
async function joinChannel(channelId) {
  try {
    const response = await fetch(`${channelService.baseUrl}/api/channels/${channelId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to join channel');
    }

    return await response.json();
  } catch (error) {
    console.error('Error joining channel:', error);
    throw error;
  }
}

async function followChannel(channelId) {
  try {
    const response = await fetch(`${channelService.baseUrl}/api/channels/${channelId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to follow channel');
    }

    return await response.json();
  } catch (error) {
    console.error('Error following channel:', error);
    throw error;
  }
}

// Export default instance and helper functions
export { channelService as default, joinChannel, followChannel };