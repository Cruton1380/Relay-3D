/**
 * WebSocket Manager
 * Coordinates the unified WebSocket client with domain adapters
 */

import unifiedWebSocketClient, { ConnectionState } from './index.js';
import VoteAdapter from './adapters/VoteAdapter.js';
import PresenceAdapter from './adapters/PresenceAdapter.js';
import NotificationAdapter from './adapters/NotificationAdapter.js';

class WebSocketManager {
  constructor() {
    this.client = unifiedWebSocketClient;
    this.adapters = {
      vote: new VoteAdapter(),
      presence: new PresenceAdapter(),
      notification: new NotificationAdapter()
    };
    
    this.isInitialized = false;
    this.authToken = null;
    this.reconnectOnAuth = true;
    
    this.setupAdapters();
    this.setupClientEventHandlers();
  }
  
  /**
   * Initialize the WebSocket manager
   * @param {object} config - Configuration options
   */
  initialize(config = {}) {
    if (this.isInitialized) {
      console.log('[WebSocketManager] Already initialized');
      return;
    }
    
    const {
      reconnectOnAuth = true,
      autoCleanup = true,
      cleanupInterval = 60000 // 1 minute
    } = config;
    
    this.reconnectOnAuth = reconnectOnAuth;
    
    // Setup periodic cleanup if enabled
    if (autoCleanup) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, cleanupInterval);
    }
    
    this.isInitialized = true;
    console.log('[WebSocketManager] Initialized');
  }
  
  /**
   * Connect to WebSocket server
   * @param {string} token - Authentication token
   * @param {object} options - Connection options
   * @returns {Promise<boolean>} Connection success
   */
  async connect(token, options = {}) {
    const {
      url = this.getWebSocketUrl(),
      forceReconnect = false
    } = options;
    
    this.authToken = token;
    
    if (this.client.isConnected() && !forceReconnect) {
      console.log('[WebSocketManager] Already connected');
      return true;
    }
    
    try {
      const success = await this.client.connect(url, token);
      
      if (success) {
        console.log('[WebSocketManager] Connected successfully');
        this.onConnected();
      }
      
      return success;
    } catch (error) {
      console.error('[WebSocketManager] Connection failed:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.client.disconnect();
    this.authToken = null;
    this.onDisconnected();
    console.log('[WebSocketManager] Disconnected');
  }
  
  /**
   * Get vote adapter
   * @returns {VoteAdapter} Vote adapter instance
   */
  getVoteAdapter() {
    return this.adapters.vote;
  }
  
  /**
   * Get presence adapter
   * @returns {PresenceAdapter} Presence adapter instance
   */
  getPresenceAdapter() {
    return this.adapters.presence;
  }
  
  /**
   * Get notification adapter
   * @returns {NotificationAdapter} Notification adapter instance
   */
  getNotificationAdapter() {
    return this.adapters.notification;
  }
  
  /**
   * Get connection state
   * @returns {string} Current connection state
   */
  getState() {
    return this.client.getState();
  }
  
  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.client.isConnected();
  }
  
  /**
   * Send message through appropriate adapter
   * @param {string} domain - Domain name
   * @param {object} message - Message to send
   * @returns {boolean} Send success
   */
  sendMessage(domain, message) {
    const messageWithDomain = {
      ...message,
      domain
    };
    
    return this.client.send(messageWithDomain);
  }
  
  /**
   * Subscribe to topic
   * @param {string} topic - Topic name
   * @param {function} handler - Message handler
   */
  subscribe(topic, handler) {
    this.client.subscribe(topic, handler);
  }
  
  /**
   * Unsubscribe from topic
   * @param {string} topic - Topic name
   * @param {function} handler - Specific handler (optional)
   */
  unsubscribe(topic, handler = null) {
    this.client.unsubscribe(topic, handler);
  }
  
  /**
   * Handle user authentication change
   * @param {string|null} token - New auth token or null for logout
   */
  onAuthChange(token) {
    if (token) {
      this.authToken = token;
      
      if (this.reconnectOnAuth) {
        this.connect(token).catch(error => {
          console.error('[WebSocketManager] Failed to reconnect after auth:', error);
        });
      }
    } else {
      // User logged out
      this.authToken = null;
      this.clearAllState();
      
      if (this.isConnected()) {
        this.disconnect();
      }
    }
  }
  
  /**
   * Cleanup expired data and old connections
   */
  cleanup() {
    // Cleanup adapter states
    this.adapters.notification.cleanupExpired();
    this.adapters.presence.cleanupOldDevices();
    
    console.log('[WebSocketManager] Cleanup completed');
  }
  
  /**
   * Clear all adapter states
   */
  clearAllState() {
    Object.values(this.adapters).forEach(adapter => {
      if (typeof adapter.clearState === 'function') {
        adapter.clearState();
      }
    });
    
    console.log('[WebSocketManager] All adapter states cleared');
  }
  
  /**
   * Destroy the manager and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.disconnect();
    this.clearAllState();
    
    // Remove all listeners
    this.client.removeAllListeners();
    Object.values(this.adapters).forEach(adapter => {
      adapter.removeAllListeners();
    });
    
    this.isInitialized = false;
    console.log('[WebSocketManager] Destroyed');
  }
  
  // Private methods
  
  setupAdapters() {
    // Register adapters with the client
    Object.entries(this.adapters).forEach(([domain, adapter]) => {
      this.client.registerAdapter(domain, adapter);
    });
  }
  
  setupClientEventHandlers() {
    this.client.on('stateChange', ({ oldState, newState }) => {
      console.log(`[WebSocketManager] State changed: ${oldState} -> ${newState}`);
      
      if (newState === ConnectionState.CONNECTED) {
        this.onConnected();
      } else if (newState === ConnectionState.DISCONNECTED) {
        this.onDisconnected();
      }
    });
    
    this.client.on('authenticated', (message) => {
      console.log('[WebSocketManager] Authentication successful');
      this.onAuthenticated(message);
    });
    
    this.client.on('error', (error) => {
      console.error('[WebSocketManager] WebSocket error:', error);
    });
    
    this.client.on('maxReconnectAttemptsReached', () => {
      console.error('[WebSocketManager] Max reconnection attempts reached');
    });
  }
  
  onConnected() {
    // Perform any initialization tasks when connected
    console.log('[WebSocketManager] Connection established');
  }
  
  onDisconnected() {
    // Handle disconnection cleanup
    console.log('[WebSocketManager] Connection lost');
  }
  
  onAuthenticated(message) {
    // Handle successful authentication
    const { userId, permissions, channels } = message;
    console.log(`[WebSocketManager] Authenticated as user: ${userId}`);
    
    // Notify adapters of authentication
    Object.values(this.adapters).forEach(adapter => {
      if (typeof adapter.onAuthenticated === 'function') {
        adapter.onAuthenticated({ userId, permissions, channels });
      }
    });
  }
  
  getWebSocketUrl() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/websocket`;
  }
}

// Export singleton instance
export default new WebSocketManager();
