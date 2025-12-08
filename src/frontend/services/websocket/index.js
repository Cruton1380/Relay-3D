/**
 * Unified WebSocket Client for Relay Platform
 * Provides centralized WebSocket management with adapter pattern for different domains
 */

import EventEmitter from 'events';
import SignalProtocolClient from '../signalProtocol.js';

/**
 * WebSocket connection states
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

/**
 * Unified WebSocket Client
 * Manages single connection with message routing to domain-specific adapters
 */
class UnifiedWebSocketClient extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.state = ConnectionState.DISCONNECTED;
    this.url = null;
    this.token = null;
    
    // Connection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
    
    // Message management
    this.messageQueue = [];
    this.adapters = new Map();
    this.subscriptions = new Map();
    
    // Heartbeat management
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.lastHeartbeat = null;
    
    // Signal Protocol for encryption
    this.signalProtocol = new SignalProtocolClient();
    this.sessionId = null;
    this.isSignalProtocolReady = false;
    
    this.setupEventHandlers();
  }
  
  /**
   * Register a domain adapter for handling specific message types
   * @param {string} domain - Domain name (e.g., 'vote', 'presence', 'notification')
   * @param {object} adapter - Adapter instance with handleMessage method
   */
  registerAdapter(domain, adapter) {
    this.adapters.set(domain, adapter);
    console.log(`[WebSocket] Registered adapter for domain: ${domain}`);
  }
  
  /**
   * Unregister a domain adapter
   * @param {string} domain - Domain name to unregister
   */
  unregisterAdapter(domain) {
    this.adapters.delete(domain);
    console.log(`[WebSocket] Unregistered adapter for domain: ${domain}`);
  }
  
  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket URL
   * @param {string} token - Authentication token
   * @returns {Promise<boolean>} Connection success
   */
  async connect(url, token) {
    if (this.state === ConnectionState.CONNECTED) {
      console.log('[WebSocket] Already connected');
      return true;
    }
    
    this.url = url;
    this.token = token;
    this.setState(ConnectionState.CONNECTING);
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          console.log('[WebSocket] Connected successfully');
          this.setState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.authenticate();
          this.startHeartbeat();
          this.processMessageQueue();
          resolve(true);
        };
        
        this.socket.onclose = (event) => {
          console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
          this.handleDisconnection();
        };
        
        this.socket.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          this.setState(ConnectionState.ERROR);
          this.emit('error', error);
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
        
      } catch (error) {
        console.error('[WebSocket] Failed to create connection:', error);
        this.setState(ConnectionState.ERROR);
        reject(error);
      }
    });
  }
    /**
   * Disconnect from WebSocket server
   */
  async disconnect() {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    // Clean up Signal Protocol session
    if (this.sessionId) {
      try {
        await this.signalProtocol.clearSession(this.sessionId);
        console.log('[WebSocket] Signal Protocol session cleaned up');
      } catch (error) {
        console.error('[WebSocket] Failed to clean up Signal Protocol session:', error);
      }
    }
    
    this.sessionId = null;
    this.isSignalProtocolReady = false;
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
    }
    
    this.setState(ConnectionState.DISCONNECTED);
    this.emit('disconnect');
  }
    /**
   * Send message to server
   * @param {object} message - Message to send
   * @param {boolean} forceUnencrypted - Force sending unencrypted (default: false)
   * @returns {boolean} Success status
   */
  async send(message, forceUnencrypted = false) {
    if (this.state !== ConnectionState.CONNECTED) {
      console.log('[WebSocket] Queueing message - not connected');
      this.messageQueue.push({ message, forceUnencrypted });
      return false;
    }
    
    try {
      let messageToSend = message;
      
      // Encrypt message if Signal Protocol is ready and not forced unencrypted
      if (this.isSignalProtocolReady && !forceUnencrypted && this.sessionId) {
        // Skip encryption for system messages
        const systemMessages = ['ping', 'pong', 'authenticate', 'signal_handshake_init', 'signal_encrypted_message'];
        if (!systemMessages.includes(message.type)) {
          try {
            const encryptedData = await this.signalProtocol.encrypt(
              this.sessionId,
              JSON.stringify(message)
            );
            
            messageToSend = {
              type: 'signal_encrypted_message',
              sessionId: this.sessionId,
              encryptedData: encryptedData
            };
            
            console.log('[WebSocket] Message encrypted for secure transmission');
          } catch (encryptionError) {
            console.error('[WebSocket] Failed to encrypt message, sending unencrypted:', encryptionError);
            // Fall back to unencrypted if encryption fails
          }
        }
      }
      
      const messageString = JSON.stringify(messageToSend);
      this.socket.send(messageString);
      console.log('[WebSocket] Message sent:', messageToSend.type || 'unknown');
      return true;
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Subscribe to topic-based messages
   * @param {string} topic - Topic to subscribe to
   * @param {function} handler - Message handler function
   */
  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic).add(handler);
    
    // Send subscription message to server
    this.send({
      type: 'subscribe',
      topic
    });
    
    console.log(`[WebSocket] Subscribed to topic: ${topic}`);
  }
  
  /**
   * Unsubscribe from topic-based messages
   * @param {string} topic - Topic to unsubscribe from
   * @param {function} handler - Specific handler to remove (optional)
   */
  unsubscribe(topic, handler = null) {
    if (!this.subscriptions.has(topic)) return;
    
    if (handler) {
      this.subscriptions.get(topic).delete(handler);
      if (this.subscriptions.get(topic).size === 0) {
        this.subscriptions.delete(topic);
      }
    } else {
      this.subscriptions.delete(topic);
    }
    
    // Send unsubscription message to server
    this.send({
      type: 'unsubscribe',
      topic
    });
    
    console.log(`[WebSocket] Unsubscribed from topic: ${topic}`);
  }
  
  /**
   * Get current connection state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }
    /**
   * Check if currently connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Check if Signal Protocol is ready for encrypted communication
   * @returns {boolean} Signal Protocol readiness status
   */
  isSignalProtocolReady() {
    return this.isSignalProtocolReady && this.sessionId !== null;
  }

  /**
   * Get current Signal Protocol session ID
   * @returns {string|null} Session ID
   */
  getSignalProtocolSessionId() {
    return this.sessionId;
  }

  /**
   * Reset Signal Protocol session (for testing or error recovery)
   */
  async resetSignalProtocolSession() {
    try {
      console.log('[WebSocket] Resetting Signal Protocol session...');
      
      if (this.sessionId) {
        // Clear existing session
        await this.signalProtocol.clearSession(this.sessionId);
      }
      
      this.sessionId = null;
      this.isSignalProtocolReady = false;
      
      // Re-initialize if connected
      if (this.isConnected()) {
        await this.initializeSignalProtocolSession();
      }
      
      console.log('[WebSocket] Signal Protocol session reset complete');
    } catch (error) {
      console.error('[WebSocket] Failed to reset Signal Protocol session:', error);
      throw error;
    }
  }
  
  // Private methods
  
  setupEventHandlers() {
    this.on('error', (error) => {
      console.error('[WebSocket] Error event:', error);
    });
    
    this.on('disconnect', () => {
      console.log('[WebSocket] Disconnect event');
      this.stopHeartbeat();
    });
  }
  
  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.emit('stateChange', { oldState, newState });
      console.log(`[WebSocket] State changed: ${oldState} -> ${newState}`);
    }
  }
    async authenticate() {
    if (this.token) {
      // Initialize Signal Protocol session for secure communication
      try {
        await this.initializeSignalProtocolSession();
        
        this.send({
          type: 'authenticate',
          token: this.token
        });
      } catch (error) {
        console.error('[WebSocket] Signal Protocol initialization failed:', error);
        // Fall back to regular authentication if Signal Protocol fails
        this.send({
          type: 'authenticate',
          token: this.token
        });
      }
    }
  }

  /**
   * Initialize Signal Protocol session with the server
   */
  async initializeSignalProtocolSession() {
    try {
      console.log('[WebSocket] Initializing Signal Protocol session...');
      
      // Generate identity key pair and pre-keys
      await this.signalProtocol.generateIdentityKeyPair();
      const preKeyBundle = await this.signalProtocol.generatePreKeyBundle();
      
      // Send handshake initiation to server
      this.send({
        type: 'signal_handshake_init',
        preKeyBundle: preKeyBundle,
        timestamp: Date.now()
      });
      
      console.log('[WebSocket] Signal Protocol handshake initiated');
    } catch (error) {
      console.error('[WebSocket] Failed to initialize Signal Protocol session:', error);
      throw error;
    }
  }

  /**
   * Handle Signal Protocol handshake response from server
   */
  async handleSignalProtocolHandshake(message) {
    try {
      if (message.type === 'signal_handshake_response') {
        console.log('[WebSocket] Processing Signal Protocol handshake response...');
        
        // Process server's pre-key bundle and establish session
        const serverPreKeyBundle = message.preKeyBundle;
        this.sessionId = message.sessionId;
        
        // Create session with server
        await this.signalProtocol.createSession(this.sessionId, serverPreKeyBundle);
        
        // Send handshake completion confirmation
        const confirmationPayload = {
          type: 'signal_handshake_complete',
          sessionId: this.sessionId,
          timestamp: Date.now()
        };
        
        // Encrypt the confirmation message
        const encryptedConfirmation = await this.signalProtocol.encrypt(
          this.sessionId,
          JSON.stringify(confirmationPayload)
        );
        
        this.send({
          type: 'signal_encrypted_message',
          sessionId: this.sessionId,
          encryptedData: encryptedConfirmation
        });
        
        this.isSignalProtocolReady = true;
        console.log('[WebSocket] Signal Protocol session established successfully');
        this.emit('signalProtocolReady', { sessionId: this.sessionId });
        
      } else if (message.type === 'signal_handshake_error') {
        console.error('[WebSocket] Signal Protocol handshake failed:', message.error);
        this.emit('signalProtocolError', message.error);
      }
    } catch (error) {
      console.error('[WebSocket] Signal Protocol handshake processing failed:', error);
      this.emit('signalProtocolError', error);
    }
  }
    async handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', message.type || 'unknown');
      
      // Handle Signal Protocol handshake messages first
      if (message.type === 'signal_handshake_response' || message.type === 'signal_handshake_error') {
        await this.handleSignalProtocolHandshake(message);
        return;
      }
      
      // Handle encrypted messages
      if (message.type === 'signal_encrypted_message') {
        await this.handleEncryptedMessage(message);
        return;
      }
      
      // Handle system messages
      if (message.type === 'heartbeat') {
        this.handleHeartbeat(message);
        return;
      }
      
      if (message.type === 'authenticated') {
        this.emit('authenticated', message);
        return;
      }
      
      // Route message to appropriate adapter
      if (message.domain && this.adapters.has(message.domain)) {
        this.adapters.get(message.domain).handleMessage(message);
      }
      
      // Handle topic-based subscriptions
      if (message.topic && this.subscriptions.has(message.topic)) {
        const handlers = this.subscriptions.get(message.topic);
        handlers.forEach(handler => handler(message));
      }
      
      // Emit general message event
      this.emit('message', message);
      
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
      this.emit('error', { type: 'parse_error', error });
    }
  }

  /**
   * Handle encrypted messages from server
   */
  async handleEncryptedMessage(message) {
    try {
      if (!this.isSignalProtocolReady || !message.sessionId || !message.encryptedData) {
        console.warn('[WebSocket] Received encrypted message but Signal Protocol not ready or invalid message format');
        return;
      }
      
      // Decrypt the message
      const decryptedText = await this.signalProtocol.decrypt(
        message.sessionId,
        message.encryptedData
      );
      
      // Parse decrypted message and handle it
      const decryptedMessage = JSON.parse(decryptedText);
      console.log('[WebSocket] Decrypted message:', decryptedMessage.type || 'unknown');
      
      // Route decrypted message to appropriate handler
      if (decryptedMessage.domain && this.adapters.has(decryptedMessage.domain)) {
        this.adapters.get(decryptedMessage.domain).handleMessage(decryptedMessage);
      }
      
      // Handle topic-based subscriptions for decrypted messages
      if (decryptedMessage.topic && this.subscriptions.has(decryptedMessage.topic)) {
        const handlers = this.subscriptions.get(decryptedMessage.topic);
        handlers.forEach(handler => handler(decryptedMessage));
      }
      
      // Emit decrypted message event
      this.emit('decryptedMessage', decryptedMessage);
      
    } catch (error) {
      console.error('[WebSocket] Failed to decrypt message:', error);
      this.emit('error', { type: 'decryption_error', error });
    }
  }
  
  handleDisconnection() {
    this.stopHeartbeat();
    this.setState(ConnectionState.DISCONNECTED);
    this.emit('disconnect');
    
    // Attempt reconnection if appropriate
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }
  
  attemptReconnection() {
    if (this.state === ConnectionState.RECONNECTING) return;
    
    this.setState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.url && this.token) {
        this.connect(this.url, this.token).catch(() => {
          // Reconnection failed, will be handled by onclose event
        });
      }
    }, delay);
  }
  
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
    async processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const queueItem = this.messageQueue.shift();
      
      // Handle both old format (direct message) and new format (object with message and encryption flag)
      if (queueItem && typeof queueItem === 'object') {
        if (queueItem.message) {
          // New format: { message, forceUnencrypted }
          await this.send(queueItem.message, queueItem.forceUnencrypted);
        } else {
          // Old format: direct message object
          await this.send(queueItem);
        }
      }
    }
  }
  
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
        this.lastHeartbeat = Date.now();
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout - connection may be dead');
          this.socket?.close();
        }, 5000);
      }
    }, 30000); // Send ping every 30 seconds
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
  
  handleHeartbeat(message) {
    if (message.type === 'pong') {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
    }
  }
}

// Export singleton instance
export default new UnifiedWebSocketClient();
