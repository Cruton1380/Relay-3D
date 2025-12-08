/**
 * @fileoverview Notification WebSocket Adapter - Manages real-time notifications
 * via WebSockets. Handles user-specific notifications and system announcements.
 */
import websocketService from './index.mjs';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';
import { getUserNotifications } from '../notifications/notificationManager.mjs';

const notifLogger = logger.child({ module: 'notification-websocket-adapter' });

/**
 * Adapter for handling notification-related WebSocket communications
 */
class NotificationWebSocketAdapter {
  constructor() {
    this.requiresAuth = true; // Notifications require authentication
    this.namespace = 'notifications';
    this.clientSubscriptions = new Map(); // connectionId -> Set of subscribed topics
    
    // Set up event listeners
    eventBus.on('notification:new', this.handleNewNotification.bind(this));
    eventBus.on('notification:system', this.handleSystemNotification.bind(this));
    
    notifLogger.info('Notification WebSocket adapter initialized');
  }

  /**
   * Initialize the notification WebSocket adapter
   */
  async initialize() {
    try {
      // Register this adapter with the websocket service
      websocketService.registerAdapter(this.namespace, this);
      
      this.initialized = true;
      notifLogger.info('Notification WebSocket adapter registered');
    } catch (error) {
      notifLogger.error('Failed to initialize notification WebSocket adapter', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {Object} connection - Connection object
   * @param {http.IncomingMessage} req - HTTP request
   * @returns {Promise<boolean>} Whether the connection was accepted
   */
  async onConnect(connection, req) {
    try {
      // Initialize client subscription tracking
      this.clientSubscriptions.set(connection.id, new Set());
      
      // Extract auth token from query if present
      const parsedUrl = new URL(req.url, 'http://localhost');
      const token = parsedUrl.searchParams.get('token');
      
      // If token is provided, authenticate immediately
      if (token) {
        const authResult = await websocketService.authenticateConnection(connection.id, token);
        
        if (authResult.success) {
          notifLogger.info(`Client ${connection.id} authenticated on connect`);
          
          // Send welcome message
          websocketService.sendToConnection(connection.id, {
            type: 'welcome',
            authenticated: true,
            userId: authResult.userId
          });
          
          // Send any pending notifications
          await this.sendPendingNotifications(connection.id, authResult.userId);
        } else {
          // Still accept connection, but notify about auth failure
          websocketService.sendToConnection(connection.id, {
            type: 'auth_required',
            message: 'Authentication required for notifications'
          });
        }
      } else {
        // Send welcome but indicate auth is required
        websocketService.sendToConnection(connection.id, {
          type: 'auth_required',
          message: 'Authentication required for notifications'
        });
      }
      
      notifLogger.info(`Notification client connected: ${connection.id}`);
      return true; // Accept the connection
    } catch (error) {
      notifLogger.error('Error handling notification client connection', {
        connectionId: connection.id,
        error: error.message
      });
      return false; // Reject the connection
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} connectionId - Client connection ID
   * @param {Object} message - Parsed message object
   */
  async onMessage(connectionId, message) {
    try {
      const connection = websocketService.connections.get(connectionId);
      if (!connection) {
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthenticate(connectionId, message);
          break;
          
        case 'get_notifications':
          await this.handleGetNotifications(connectionId, message);
          break;
          
        case 'mark_read':
          await this.handleMarkRead(connectionId, message);
          break;
          
        case 'ping':
          websocketService.sendToConnection(connectionId, {
            type: 'pong',
            timestamp: Date.now()
          });
          break;
          
        default:
          notifLogger.debug(`Unknown message type: ${message.type}`, {
            connectionId
          });
          
          websocketService.sendToConnection(connectionId, {
            type: 'error',
            error: 'Unknown message type',
            originalType: message.type
          });
      }
    } catch (error) {
      notifLogger.error('Error handling notification message', {
        connectionId,
        error: error.message
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'error',
        error: 'Error processing message'
      });
    }
  }

  /**
   * Handle client disconnection
   * @param {string} connectionId - Client connection ID
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  async onDisconnect(connectionId, code, reason) {
    try {
      // Clean up client subscriptions
      this.clientSubscriptions.delete(connectionId);
      
      notifLogger.info(`Notification client disconnected: ${connectionId}`, {
        code,
        reason
      });
    } catch (error) {
      notifLogger.error('Error handling notification client disconnect', {
        connectionId,
        error: error.message
      });
    }
  }

  /**
   * Handle client reconnection
   * @param {string} oldConnectionId - Old connection ID
   * @param {string} newConnectionId - New connection ID
   * @returns {Promise<boolean>} Whether the reconnection was successful
   */
  async onReconnect(oldConnectionId, newConnectionId) {
    try {
      // Transfer subscriptions
      const oldSubscriptions = this.clientSubscriptions.get(oldConnectionId);
      if (oldSubscriptions) {
        this.clientSubscriptions.set(newConnectionId, new Set(oldSubscriptions));
      }
      
      // Clean up old subscriptions
      this.clientSubscriptions.delete(oldConnectionId);
      
      notifLogger.info(`Notification client reconnected: ${oldConnectionId} -> ${newConnectionId}`);
      
      // Check if user is authenticated
      const connection = websocketService.connections.get(newConnectionId);
      if (connection && connection.authenticated) {
        // Send pending notifications
        await this.sendPendingNotifications(newConnectionId, connection.userId);
      }
      
      return true;
    } catch (error) {
      notifLogger.error('Error handling notification client reconnection', {
        oldConnectionId,
        newConnectionId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Handle authentication message
   * @param {string} connectionId - Client connection ID
   * @param {Object} message - Message data
   */
  async handleAuthenticate(connectionId, message) {
    try {
      const { token } = message;
      
      if (!token) {
        return websocketService.sendToConnection(connectionId, {
          type: 'auth_error',
          error: 'Token is required'
        });
      }
      
      const authResult = await websocketService.authenticateConnection(connectionId, token);
      
      if (authResult.success) {
        websocketService.sendToConnection(connectionId, {
          type: 'auth_success',
          userId: authResult.userId
        });
        
        // Send pending notifications after authentication
        await this.sendPendingNotifications(connectionId, authResult.userId);
      } else {
        websocketService.sendToConnection(connectionId, {
          type: 'auth_error',
          error: authResult.reason || 'Authentication failed'
        });
      }
    } catch (error) {
      notifLogger.error('Error handling authentication', {
        connectionId,
        error: error.message
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'auth_error',
        error: 'Internal authentication error'
      });
    }
  }

  /**
   * Handle get_notifications message
   * @param {string} connectionId - Client connection ID
   * @param {Object} message - Message data
   */
  async handleGetNotifications(connectionId, message) {
    try {
      const connection = websocketService.connections.get(connectionId);
      
      // Check authentication
      if (!connection || !connection.authenticated) {
        return websocketService.sendToConnection(connectionId, {
          type: 'error',
          error: 'Authentication required to get notifications'
        });
      }
      
      const { limit = 20, offset = 0 } = message;
      
      // Get notifications for user
      const notifications = await getUserNotifications(connection.userId, {
        limit,
        offset
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'notifications',
        notifications,
        total: notifications.total || notifications.length,
        unread: notifications.unread || 0
      });
    } catch (error) {
      notifLogger.error('Error handling get_notifications', {
        connectionId,
        error: error.message
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'error',
        error: 'Failed to get notifications'
      });
    }
  }

  /**
   * Handle mark_read message
   * @param {string} connectionId - Client connection ID
   * @param {Object} message - Message data
   */
  async handleMarkRead(connectionId, message) {
    // Implementation depends on your notification system
    // This is a placeholder
  }

  /**
   * Send pending notifications to a client
   * @param {string} connectionId - Client connection ID
   * @param {string} userId - User ID
   */
  async sendPendingNotifications(connectionId, userId) {
    try {
      // Get unread notifications
      const notifications = await getUserNotifications(userId, {
        unreadOnly: true,
        limit: 10
      });
      
      if (notifications.length > 0) {
        websocketService.sendToConnection(connectionId, {
          type: 'pending_notifications',
          notifications,
          total: notifications.total || notifications.length
        });
      }
    } catch (error) {
      notifLogger.error('Error sending pending notifications', {
        connectionId,
        userId,
        error: error.message
      });
    }
  }

  /**
   * Handle new notification event
   * @param {Object} data - Notification data
   */
  handleNewNotification(data) {
    try {
      const { userId, notification } = data;
      
      // Find connections for this user
      for (const [connectionId, connection] of websocketService.connections.entries()) {
        if (connection.authenticated && connection.userId === userId) {
          websocketService.sendToConnection(connectionId, {
            type: 'notification',
            notification
          });
        }
      }
    } catch (error) {
      notifLogger.error('Error handling new notification event', {
        error: error.message
      });
    }
  }

  /**
   * Handle system notification event
   * @param {Object} data - Notification data
   */
  handleSystemNotification(data) {
    try {
      const { notification, audience } = data;
      
      // Broadcast to all authenticated users or specific audience
      for (const [connectionId, connection] of websocketService.connections.entries()) {
        if (connection.authenticated) {
          if (!audience || audience === 'all' || 
              (audience === 'admin' && connection.authLevel === 'admin')) {
            websocketService.sendToConnection(connectionId, {
              type: 'system_notification',
              notification
            });
          }
        }
      }
    } catch (error) {
      notifLogger.error('Error handling system notification event', {
        error: error.message
      });
    }
  }

  /**
   * Shutdown the adapter
   */
  shutdown() {
    this.initialized = false;
    
    // Clear event listeners
    eventBus.off('notification:new', this.handleNewNotification);
    eventBus.off('notification:system', this.handleSystemNotification);
    
    notifLogger.info('Notification WebSocket adapter shut down');
  }
}

// Create and export singleton instance
const notificationAdapter = new NotificationWebSocketAdapter();
export default notificationAdapter;
