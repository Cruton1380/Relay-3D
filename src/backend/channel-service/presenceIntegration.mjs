/**
 * @fileoverview Channel Presence Integration Service
 * Bridges the PresenceAdapter with the Channel Service for real-time member status updates
 */
import eventBus from '../event-bus/index.mjs';
import logger from '../utils/logging/logger.mjs';

class ChannelPresenceIntegration {
  constructor() {
    this.channelService = null;
    this.isInitialized = false;
    
    // Bind methods
    this.handlePresenceUpdate = this.handlePresenceUpdate.bind(this);
  }

  /**
   * Initialize the integration with channel service
   * @param {Object} channelService - Channel service instance
   */
  initialize(channelService) {
    if (this.isInitialized) {
      logger.warn('Channel presence integration already initialized');
      return;
    }

    this.channelService = channelService;
    
    // Listen for presence events from the event bus
    eventBus.on('presence.updated', this.handlePresenceUpdate);
    
    this.isInitialized = true;
    logger.info('Channel presence integration initialized');
  }

  /**
   * Shutdown the integration
   */
  shutdown() {
    if (!this.isInitialized) return;

    eventBus.off('presence.updated', this.handlePresenceUpdate);
    
    this.channelService = null;
    this.isInitialized = false;
    logger.info('Channel presence integration shut down');
  }

  /**
   * Handle presence updates from the PresenceAdapter
   * @param {Object} data - Presence update data
   */
  handlePresenceUpdate(data) {
    if (!this.channelService || !this.isInitialized) return;

    const { userId, status, location } = data;
    
    try {
      // Get all channels where this user is a member
      const userChannelIds = this.channelService.userChannels.get(userId) || new Set();
      
      // Update presence for this user in all their channels
      for (const channelId of userChannelIds) {
        const members = this.channelService.channelMembers.get(channelId) || new Set();
        
        // Broadcast presence update to all members of this channel
        for (const memberId of members) {
          if (memberId !== userId) { // Don't send to self
            const memberWs = this.channelService.connections.get(memberId);
            if (memberWs && memberWs.readyState === 1) {
              this.channelService.sendWebSocketMessage(memberWs, 'presence_update', {
                channelId,
                userId,
                status,
                location,
                lastSeen: Date.now()
              });
            }
          }
        }
      }

      logger.debug(`Propagated presence update for user ${userId} to ${userChannelIds.size} channels`);
    } catch (error) {
      logger.error(`Failed to handle presence update for user ${userId}:`, error);
    }
  }

  /**
   * Manually trigger presence broadcast for a user in a specific channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} status - Presence status
   */
  broadcastPresenceToChannel(channelId, userId, status) {
    if (!this.channelService || !this.isInitialized) return;

    try {
      const members = this.channelService.channelMembers.get(channelId) || new Set();
      
      for (const memberId of members) {
        if (memberId !== userId) {
          const memberWs = this.channelService.connections.get(memberId);
          if (memberWs && memberWs.readyState === 1) {
            this.channelService.sendWebSocketMessage(memberWs, 'presence_update', {
              channelId,
              userId,
              status,
              lastSeen: Date.now()
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to broadcast presence to channel ${channelId}:`, error);
    }
  }

  /**
   * Get presence status for all members of a channel
   * @param {string} channelId - Channel ID
   * @returns {Map} Map of userId to presence status
   */
  getChannelMemberPresence(channelId) {
    if (!this.channelService || !this.isInitialized) return new Map();

    const presence = new Map();
    const members = this.channelService.channelMembers.get(channelId) || new Set();
    
    for (const memberId of members) {
      const userPresence = this.channelService.activeUsers.get(memberId);
      if (userPresence) {
        presence.set(memberId, {
          status: userPresence.status || 'offline',
          lastSeen: userPresence.lastSeen || Date.now()
        });
      } else {
        presence.set(memberId, {
          status: 'offline',
          lastSeen: null
        });
      }
    }
    
    return presence;
  }
}

export default new ChannelPresenceIntegration();
