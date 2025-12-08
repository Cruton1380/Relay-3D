/**
 * @fileoverview WebSocket adapter for handling user presence
 */
import BaseAdapter from './adapterBase.mjs';
import userManager from '../users/userManager.mjs';
import eventBus from '../event-bus/index.mjs';
import logger from '../utils/logging/logger.mjs';

class PresenceAdapter extends BaseAdapter {
  constructor() {
    super('presence');
    this.activeUsers = new Map();
    
    // Register for external events
    this.handleUserJoined = this.handleUserJoined.bind(this);
    this.handleUserLeft = this.handleUserLeft.bind(this);
  }

  initialize(wsService) {
    this.service = wsService;
    wsService.registerAdapter('presence', this);
    
    // Register for events from the event bus
    eventBus.on('user.joined', this.handleUserJoined);
    eventBus.on('user.left', this.handleUserLeft);
    
    logger.info('Presence adapter initialized');
    return this;
  }

  shutdown() {
    // Unregister event listeners
    eventBus.off('user.joined', this.handleUserJoined);
    eventBus.off('user.left', this.handleUserLeft);
    
    logger.info('Presence adapter shut down');
  }

  async handleMessage(client, message) {
    // Make sure we're authenticated
    if (!client.isAuthenticated) {
      this.service.sendToClient(client.id, {
        type: 'presence',
        action: 'error',
        data: { message: 'Authentication required' }
      });
      return;
    }

    // Handle the message based on action
    switch (message.action) {
      case 'update':
        await this.handlePresenceUpdate(client, message.data);
        break;
      case 'get':
        await this.handleGetPresence(client);
        break;
      default:
        this.service.sendToClient(client.id, {
          type: 'presence',
          action: 'error',
          data: { message: 'Unknown action' }
        });
    }
  }

  async handlePresenceUpdate(client, data) {
    try {
      const { status, location } = data;
      
      // Update user presence in the user manager
      await userManager.updateUserPresence(client.userId, { status, location });
      
      // Track in local map
      this.activeUsers.set(client.userId, { status, location });
      
      // Broadcast to other clients
      this.service.broadcast({
        type: 'presence',
        action: 'userUpdate',
        data: {
          userId: client.userId,
          status,
          location
        }
      });
      
      // Emit to event bus for other services
      eventBus.emit('presence.updated', { userId: client.userId, status, location });
      
      logger.debug(`User ${client.userId} updated presence: ${status}`);
    } catch (error) {
      logger.error(`Error updating presence for user ${client.userId}:`, error);
      this.service.sendToClient(client.id, {
        type: 'presence',
        action: 'error',
        data: { message: 'Failed to update presence' }
      });
    }
  }

  async handleGetPresence(client) {
    try {
      // Get all active users from the user manager
      const activeUsers = await userManager.getActiveUsers();
      
      this.service.sendToClient(client.id, {
        type: 'presence',
        action: 'userList',
        data: activeUsers
      });
      
      logger.debug(`Sent presence list to user ${client.userId}`);
    } catch (error) {
      logger.error(`Error getting presence for user ${client.userId}:`, error);
      this.service.sendToClient(client.id, {
        type: 'presence',
        action: 'error',
        data: { message: 'Failed to get presence information' }
      });
    }
  }

  onClientConnect(client) {
    logger.debug(`User ${client.userId} connected to presence service`);
    // Initial presence setup happens when client sends an update message
  }

  onClientDisconnect(client) {
    logger.debug(`User ${client.userId} disconnected from presence service`);
    
    // Update user to offline status
    userManager.updateUserPresence(client.userId, { status: 'offline' })
      .catch(err => logger.error(`Failed to update offline status for ${client.userId}:`, err));
    
    // Remove from active users map
    this.activeUsers.delete(client.userId);
    
    // Broadcast to other clients
    this.service.broadcast({
      type: 'presence',
      action: 'userUpdate',
      data: {
        userId: client.userId,
        status: 'offline'
      }
    });
    
    // Emit to event bus
    eventBus.emit('presence.updated', { userId: client.userId, status: 'offline' });
  }

  handleUserJoined(userData) {
    // This is called when a user joins from a different mechanism (not WebSocket)
    this.service.broadcast({
      type: 'presence',
      action: 'userUpdate',
      data: {
        userId: userData.userId,
        status: 'online'
      }
    });
  }

  handleUserLeft(userData) {
    // This is called when a user leaves from a different mechanism (not WebSocket)
    this.service.broadcast({
      type: 'presence',
      action: 'userUpdate',
      data: {
        userId: userData.userId,
        status: 'offline'
      }
    });
  }
}

export default new PresenceAdapter();
