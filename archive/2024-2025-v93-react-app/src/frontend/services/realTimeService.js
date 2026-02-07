/**
 * @fileoverview Real-Time Service
 * Modernized real-time updates and live data streaming for Base Model 1
 * Integrates legacy WebSocket/SSE logic as clean, modular services
 */
import { apiPost } from './apiClient';

class RealTimeService {
  constructor() {
    this.isInitialized = false;
    this.connections = new Map(); // connectionType -> connection
    this.subscriptions = new Map(); // eventType -> array of handlers
    this.reconnectAttempts = new Map(); // connectionType -> attempts
    this.messageQueue = new Map(); // connectionType -> message queue
    this.connectionStatus = new Map(); // connectionType -> status
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.pingInterval = 30000; // 30 seconds
  }

  /**
   * Initialize real-time service
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Initialize WebSocket connection
      await this.initializeWebSocket();
      
      // Initialize SSE connections
      await this.initializeSSE();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection
   */
  async initializeWebSocket() {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus.set('websocket', 'connected');
        this.reconnectAttempts.set('websocket', 0);
        this.processMessageQueue('websocket');
      };
      
      ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus.set('websocket', 'disconnected');
        this.scheduleReconnect('websocket', ws);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus.set('websocket', 'error');
      };
      
      this.connections.set('websocket', ws);
      
      // Start ping interval
      this.startPingInterval(ws);
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  /**
   * Initialize Server-Sent Events connections
   */
  async initializeSSE() {
    try {
      const sseUrl = import.meta.env.VITE_SSE_URL || 'http://localhost:3002/api/realtime';
      const eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        console.log('SSE connected');
        this.connectionStatus.set('sse', 'connected');
      };
      
      eventSource.onmessage = (event) => {
        this.handleSSEMessage(event);
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.connectionStatus.set('sse', 'error');
      };
      
      this.connections.set('sse', eventSource);
      
    } catch (error) {
      console.error('Failed to initialize SSE:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(eventType, handler) {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType).push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(eventType, handler) {
    const handlers = this.subscriptions.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(message) {
    const ws = this.connections.get('websocket');
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.queueMessage('websocket', message);
    }
  }

  /**
   * Subscribe to specific data streams
   */
  subscribeToStream(streamType, params = {}) {
    const message = {
      type: 'subscribe',
      stream: streamType,
      params: params
    };
    
    this.sendMessage(message);
  }

  /**
   * Unsubscribe from specific data streams
   */
  unsubscribeFromStream(streamType) {
    const message = {
      type: 'unsubscribe',
      stream: streamType
    };
    
    this.sendMessage(message);
  }

  /**
   * Subscribe to vote updates
   */
  subscribeToVoteUpdates(topicId = null, candidateId = null) {
    this.subscribeToStream('vote_updates', {
      topicId: topicId,
      candidateId: candidateId
    });
  }

  /**
   * Subscribe to channel updates
   */
  subscribeToChannelUpdates(channelId = null) {
    this.subscribeToStream('channel_updates', {
      channelId: channelId
    });
  }

  /**
   * Subscribe to ranking updates
   */
  subscribeToRankingUpdates(topicRow = null) {
    this.subscribeToStream('ranking_updates', {
      topicRow: topicRow
    });
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeToPresenceUpdates(channelId = null) {
    this.subscribeToStream('presence_updates', {
      channelId: channelId
    });
  }

  /**
   * Subscribe to blockchain confirmations
   */
  subscribeToBlockchainUpdates() {
    this.subscribeToStream('blockchain_updates');
  }

  /**
   * Subscribe to AI agent updates
   */
  subscribeToAIUpdates(sessionId = null) {
    this.subscribeToStream('ai_updates', {
      sessionId: sessionId
    });
  }

  /**
   * Subscribe to system notifications
   */
  subscribeToSystemNotifications() {
    this.subscribeToStream('system_notifications');
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle SSE messages
   */
  handleSSEMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }

  /**
   * Process incoming messages
   */
  processMessage(message) {
    const { type, data, timestamp } = message;
    
    // Emit to all subscribers for this message type
    const handlers = this.subscriptions.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(data, timestamp);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
    
    // Handle specific message types
    switch (type) {
      case 'vote_update':
        this.handleVoteUpdate(data);
        break;
      case 'channel_update':
        this.handleChannelUpdate(data);
        break;
      case 'ranking_update':
        this.handleRankingUpdate(data);
        break;
      case 'presence_update':
        this.handlePresenceUpdate(data);
        break;
      case 'blockchain_confirmation':
        this.handleBlockchainConfirmation(data);
        break;
      case 'ai_update':
        this.handleAIUpdate(data);
        break;
      case 'system_notification':
        this.handleSystemNotification(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  /**
   * Handle vote updates
   */
  handleVoteUpdate(data) {
    const { topicId, candidateId, voteCount, voteChange, userVoted } = data;
    
    // Emit vote update event
    this.emit('vote_updated', {
      topicId,
      candidateId,
      voteCount,
      voteChange,
      userVoted,
      timestamp: Date.now()
    });
  }

  /**
   * Handle channel updates
   */
  handleChannelUpdate(data) {
    const { channelId, updateType, updateData } = data;
    
    // Emit channel update event
    this.emit('channel_updated', {
      channelId,
      updateType,
      updateData,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ranking updates
   */
  handleRankingUpdate(data) {
    const { topicRow, rankings, changes } = data;
    
    // Emit ranking update event
    this.emit('ranking_updated', {
      topicRow,
      rankings,
      changes,
      timestamp: Date.now()
    });
  }

  /**
   * Handle presence updates
   */
  handlePresenceUpdate(data) {
    const { channelId, users, action } = data;
    
    // Emit presence update event
    this.emit('presence_updated', {
      channelId,
      users,
      action,
      timestamp: Date.now()
    });
  }

  /**
   * Handle blockchain confirmations
   */
  handleBlockchainConfirmation(data) {
    const { transactionId, status, blockNumber } = data;
    
    // Emit blockchain confirmation event
    this.emit('blockchain_confirmed', {
      transactionId,
      status,
      blockNumber,
      timestamp: Date.now()
    });
  }

  /**
   * Handle AI updates
   */
  handleAIUpdate(data) {
    const { sessionId, agent, updateType, content } = data;
    
    // Emit AI update event
    this.emit('ai_updated', {
      sessionId,
      agent,
      updateType,
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Handle system notifications
   */
  handleSystemNotification(data) {
    const { notification, priority, category } = data;
    
    // Emit system notification event
    this.emit('system_notification', {
      notification,
      priority,
      category,
      timestamp: Date.now()
    });
  }

  /**
   * Handle errors
   */
  handleError(data) {
    const { error, code, message } = data;
    
    // Emit error event
    this.emit('error', {
      error,
      code,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Emit event to all listeners
   */
  emit(eventType, data) {
    const handlers = this.subscriptions.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }

  /**
   * Queue message for later sending
   */
  queueMessage(connectionType, message) {
    if (!this.messageQueue.has(connectionType)) {
      this.messageQueue.set(connectionType, []);
    }
    this.messageQueue.get(connectionType).push(message);
  }

  /**
   * Process queued messages
   */
  processMessageQueue(connectionType) {
    const queue = this.messageQueue.get(connectionType) || [];
    const connection = this.connections.get(connectionType);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      queue.forEach(message => {
        connection.send(JSON.stringify(message));
      });
      this.messageQueue.set(connectionType, []);
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect(connectionType, connection) {
    const attempts = this.reconnectAttempts.get(connectionType) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts.set(connectionType, attempts + 1);
        this.initializeWebSocket();
      }, this.reconnectDelay * (attempts + 1));
    } else {
      console.error(`Max reconnection attempts reached for ${connectionType}`);
      this.connectionStatus.set(connectionType, 'failed');
    }
  }

  /**
   * Start ping interval
   */
  startPingInterval(ws) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } else {
        clearInterval(interval);
      }
    }, this.pingInterval);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(connectionType = 'websocket') {
    return this.connectionStatus.get(connectionType) || 'disconnected';
  }

  /**
   * Check if connected
   */
  isConnected(connectionType = 'websocket') {
    return this.getConnectionStatus(connectionType) === 'connected';
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const stats = {};
    
    for (const [type, status] of this.connectionStatus.entries()) {
      stats[type] = {
        status: status,
        reconnectAttempts: this.reconnectAttempts.get(type) || 0,
        queuedMessages: (this.messageQueue.get(type) || []).length
      };
    }
    
    return stats;
  }

  /**
   * Force reconnect
   */
  async forceReconnect(connectionType = 'websocket') {
    try {
      const connection = this.connections.get(connectionType);
      if (connection) {
        connection.close();
      }
      
      this.reconnectAttempts.set(connectionType, 0);
      this.connectionStatus.set(connectionType, 'reconnecting');
      
      if (connectionType === 'websocket') {
        await this.initializeWebSocket();
      } else if (connectionType === 'sse') {
        await this.initializeSSE();
      }
    } catch (error) {
      console.error('Force reconnect failed:', error);
      this.connectionStatus.set(connectionType, 'error');
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Close all connections
    for (const [type, connection] of this.connections.entries()) {
      if (connection) {
        connection.close();
      }
    }
    
    // Clear all data structures
    this.connections.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
    this.messageQueue.clear();
    this.connectionStatus.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
const realTimeService = new RealTimeService();
export default realTimeService; 