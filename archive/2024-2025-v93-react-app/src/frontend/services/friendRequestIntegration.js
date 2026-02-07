/**
 * @fileoverview Friend Request Integration Service
 * Handles friend requests from channel interactions and public areas
 */

class FriendRequestIntegration {
  constructor(socialService = null, channelService = null) {
    this.socialService = socialService || {
      sendFriendRequest: async (userId, message) => ({ success: true, requestId: 'test-' + Date.now() })
    };
    this.channelService = channelService || {
      getChannel: async (channelId) => ({ id: channelId, name: 'Test Channel' })
    };
    this.pendingChannelRequests = new Map(); // channelId -> userId -> request
  }

  /**
   * Send friend request from channel context
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Target user ID
   * @param {string} channelId - Channel context
   * @param {string} message - Optional message
   */
  async sendFriendRequestFromChannel(fromUserId, toUserId, channelId, message = '') {
    try {
      // Verify both users are in the channel
      const channelMembers = await this.channelService.getChannelMembers(channelId);
      const fromUserInChannel = channelMembers.some(m => m.userId === fromUserId);
      const toUserInChannel = channelMembers.some(m => m.userId === toUserId);

      if (!fromUserInChannel || !toUserInChannel) {
        throw new Error('Both users must be in the channel to send friend requests');
      }

      // Get channel info for context
      const channelInfo = await this.channelService.getChannel(channelId);
      const contextMessage = `${message}\n\nSent from channel: ${channelInfo.name}`;

      // Send the friend request with channel context
      const result = await this.socialService.sendFriendRequest(toUserId, contextMessage);
      
      if (result.success) {
        // Store channel context for this request
        if (!this.pendingChannelRequests.has(channelId)) {
          this.pendingChannelRequests.set(channelId, new Map());
        }
        this.pendingChannelRequests.get(channelId).set(toUserId, {
          requestId: result.request.id,
          fromUserId,
          toUserId,
          channelId,
          channelName: channelInfo.name,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send friend request from channel:', error);
      throw error;
    }
  }

  /**
   * Send friend request from public area (no mutual channel)
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Target user ID
   * @param {string} context - Public area context (e.g., 'proximity_scan', 'qr_code')
   * @param {string} message - Optional message
   */
  async sendFriendRequestFromPublic(fromUserId, toUserId, context, message = '') {
    try {
      // Check if users have any proximity or encounter history
      let contextMessage = message;
      
      if (context === 'proximity_scan') {
        contextMessage = `${message}\n\nSent via proximity detection`;
      } else if (context === 'qr_code') {
        contextMessage = `${message}\n\nSent via QR code scan`;
      } else if (context === 'user_search') {
        contextMessage = `${message}\n\nFound via user search`;
      }

      // Check privacy settings before sending
      const privacySettings = await this.getUserPrivacySettings(toUserId);
      if (privacySettings && !privacySettings.allowPublicFriendRequests) {
        throw new Error('User does not accept friend requests from unknown users');
      }

      // Send the friend request with public context
      return await this.socialService.sendFriendRequest(toUserId, contextMessage);
    } catch (error) {
      console.error('Failed to send friend request from public area:', error);
      throw error;
    }
  }

  /**
   * Get user privacy settings
   * @param {string} userId - User ID
   */
  async getUserPrivacySettings(userId) {
    try {
      // This would typically fetch from user service
      // For now, return default settings
      return {
        allowPublicFriendRequests: true,
        allowChannelFriendRequests: true,
        allowProximityFriendRequests: true,
        requireMutualChannels: false
      };
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return null;
    }
  }

  /**
   * Check if friend request is allowed between users
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Target user ID
   * @param {string} context - Request context
   */
  async canSendFriendRequest(fromUserId, toUserId, context = 'general') {
    try {
      // Check if already friends
      const friendship = await this.socialService.getFriendshipStatus(toUserId);
      if (friendship.status === 'friends') {
        return { allowed: false, reason: 'Already friends' };
      }

      // Check if request already pending
      if (friendship.status === 'pending') {
        return { allowed: false, reason: 'Friend request already pending' };
      }

      // Check if user is blocked
      if (friendship.status === 'blocked') {
        return { allowed: false, reason: 'User has blocked you' };
      }

      // Check privacy settings
      const privacySettings = await this.getUserPrivacySettings(toUserId);
      if (!privacySettings) {
        return { allowed: true, reason: 'Default privacy settings allow requests' };
      }

      switch (context) {
        case 'channel':
          return { 
            allowed: privacySettings.allowChannelFriendRequests, 
            reason: privacySettings.allowChannelFriendRequests ? 'Allowed' : 'User disabled channel friend requests' 
          };
        case 'proximity':
          return { 
            allowed: privacySettings.allowProximityFriendRequests, 
            reason: privacySettings.allowProximityFriendRequests ? 'Allowed' : 'User disabled proximity friend requests' 
          };
        case 'public':
          return { 
            allowed: privacySettings.allowPublicFriendRequests, 
            reason: privacySettings.allowPublicFriendRequests ? 'Allowed' : 'User disabled public friend requests' 
          };
        default:
          return { allowed: true, reason: 'Default allowed' };
      }
    } catch (error) {
      console.error('Failed to check friend request permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Handle friend request acceptance with channel context
   * @param {string} requestId - Request ID
   */
  async handleFriendRequestAccepted(requestId) {
    // Find and clean up channel context if exists
    for (const [channelId, channelRequests] of this.pendingChannelRequests.entries()) {
      for (const [userId, request] of channelRequests.entries()) {
        if (request.requestId === requestId) {
          // Remove from pending
          channelRequests.delete(userId);
          if (channelRequests.size === 0) {
            this.pendingChannelRequests.delete(channelId);
          }
          
          // Could send notification to channel about new friendship
          this.notifyChannelAboutFriendship(channelId, request.fromUserId, request.toUserId);
          break;
        }
      }
    }
  }

  /**
   * Notify channel members about new friendship (optional)
   * @param {string} channelId - Channel ID
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   */
  async notifyChannelAboutFriendship(channelId, user1Id, user2Id) {
    try {
      // This could send a subtle notification to the channel
      // For privacy, this should be opt-in
      console.log(`New friendship formed in channel ${channelId}: ${user1Id} and ${user2Id}`);
    } catch (error) {
      console.error('Failed to notify channel about friendship:', error);
    }
  }

  /**
   * Get friend request context information
   * @param {string} requestId - Request ID
   */
  getRequestContext(requestId) {
    for (const [channelId, channelRequests] of this.pendingChannelRequests.entries()) {
      for (const request of channelRequests.values()) {
        if (request.requestId === requestId) {
          return {
            type: 'channel',
            channelId,
            channelName: request.channelName
          };
        }
      }
    }
    return { type: 'public' };
  }

  /**
   * General friend request method (for test compatibility)
   * @param {Object} requestData - Request data
   * @returns {Promise<Object>} Request result
   */
  async sendFriendRequest(requestData) {
    const { targetUserId, fromUserId, message, context } = requestData;
    
    if (context === 'channel') {
      return await this.sendFriendRequestFromChannel(
        fromUserId, 
        targetUserId, 
        requestData.channelId, 
        message
      );
    } else {
      return await this.sendFriendRequestFromPublic(
        fromUserId, 
        targetUserId, 
        context || 'general', 
        message
      );
    }
  }
}

export default new FriendRequestIntegration();
