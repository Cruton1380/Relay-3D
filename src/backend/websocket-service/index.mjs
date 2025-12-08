/**
 * @fileoverview WebSocket Service - Real-time connection management
 * @module WebSocketService
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../utils/BaseService.mjs';
import logger from '../utils/logging/logger.mjs';
import { verifyAuthToken } from '../auth/utils/authUtils.mjs';
import rateLimiter from './rateLimiter.mjs';
import metricsAdapter from './metricsAdapter.mjs';
import messageEncryption from './messageEncryption.mjs';
import eventBus from '../eventBus-service/index.mjs';

// Constants for connection management
const MAX_CONNECTIONS_PER_IP = 50;
const MAX_CONNECTIONS_PER_USER = 10;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute
const PING_INTERVAL = 30000; // 30 seconds

/**
 * WebSocket Service - Manages real-time connections and message routing
 * @class WebSocketService
 * @extends BaseService
 */
class WebSocketService extends BaseService {
  /**
   * Creates an instance of WebSocketService
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super('WebSocketService');
    
    // Override logger if provided in options
    if (options.logger) {
      this.logger = options.logger;
    } else if (logger.child) {
      this.logger = logger.child({ module: 'websocket-service' });
    }
    
    /** @type {WebSocketServer} WebSocket server instance */
    this.wss = null;
    
    /** @type {Map<string, Object>} Connected clients */
    this.clients = new Map();
    
    /** @type {Map<string, Set<string>>} IP to client IDs mapping */
    this.ipConnections = new Map();
    
    /** @type {Map<string, Set<string>>} User ID to client IDs mapping */
    this.userConnections = new Map();
    
    /** @type {Map<string, Function>} Message handlers */
    this.messageHandlers = new Map();
    
    /** @type {Map<string, Object>} Service adapters */
    this.adapters = new Map();
    
    /** @type {NodeJS.Timeout} Cleanup interval */
    this.cleanupInterval = null;
    
    /** @type {NodeJS.Timeout} Ping interval */
    this.pingInterval = null;
    
    this.logger.info('WebSocketService: Initialized');
  }

  /**
   * Initialize the WebSocket service
   * @param {Object} server - HTTP server instance
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  async initialize(server) {
    try {
      this.logger.info('WebSocketService: Initializing...');
      
      if (!server) {
        throw new Error('HTTP server instance is required for WebSocket initialization');
      }
      
      this.wss = new WebSocketServer({ 
        server,
        clientTracking: true,
        maxPayload: 1024 * 1024, // 1MB max message size
        verifyClient: this.verifyClient.bind(this)
      });
      
      this.wss.on('connection', this.handleConnection.bind(this));
      
      // Initialize adapters
      await this.initializeAdapters();
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
      
      // Start ping interval
      this.pingInterval = setInterval(() => this.pingClients(), PING_INTERVAL);
      
      this.logger.info('WebSocketService: Initialized successfully');
      this.updateMetrics('activity');
      
    } catch (error) {
      this.handleError(error, 'initialization');
      throw error;
    }
  }

  /**
   * Initialize WebSocket adapters
   * @private
   * @returns {Promise<void>}
   */
  async initializeAdapters() {
    try {
      this.logger.debug('WebSocketService: Starting adapter initialization...');
      
      // Initialize rate limiter
      if (rateLimiter && typeof rateLimiter.initialize === 'function') {
        rateLimiter.initialize();
        this.logger.debug('WebSocketService: Rate limiter initialized');
      }
      
      // Register adapters
      if (metricsAdapter && typeof metricsAdapter.initialize === 'function') {
        metricsAdapter.initialize(this);
        this.adapters.set('metrics', metricsAdapter);
        this.logger.debug('WebSocketService: Metrics adapter initialized');
      }
      
      // Initialize Signal Protocol message encryption
      if (messageEncryption && typeof messageEncryption.initialize === 'function') {
        await messageEncryption.initialize();
        this.adapters.set('encryption', messageEncryption);
        this.logger.debug('WebSocketService: Signal Protocol encryption initialized');
      }
      
      this.logger.debug('WebSocketService: Adapter initialization complete. Adapters:', Array.from(this.adapters.keys()));
      
    } catch (error) {
      this.logger.warn('WebSocketService: Some adapters failed to initialize:', error);
    }
  }

  /**
   * Verify client connection
   * @param {Object} info - Connection info
   * @param {Function} callback - Callback function
   * @private
   */
  verifyClient(info, callback) {
    try {
      const token = new URL(info.req.url, 'ws://localhost').searchParams.get('token');
      
      if (!token) {
        this.logger.warn('Token verification failed', { error: 'No token provided' });
        callback(false, 401, 'Unauthorized');
        return;
      }
      
      // Handle demo tokens
      if (token.startsWith('demo-token-')) {
        const userId = token.split('demo-token-')[1];
        info.req.user = { id: userId, isDemo: true };
        callback(true);
        return;
      }
      
      // Verify regular tokens
      const user = verifyAuthToken(token);
      if (user) {
        info.req.user = user;
        callback(true);
      } else {
        callback(false, 401, 'Unauthorized');
      }
    } catch (error) {
      this.logger.error('Client verification failed:', error);
      callback(false, 401, 'Unauthorized');
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket instance
   * @param {Object} req - HTTP request object
   * @private
   */
  handleConnection(ws, req) {
    try {
      const clientId = uuidv4();
      const ip = req.socket.remoteAddress;
      const user = req.user;
      
      // Check IP connection limit
      if (!this.ipConnections.has(ip)) {
        this.ipConnections.set(ip, new Set());
      }
      if (this.ipConnections.get(ip).size >= MAX_CONNECTIONS_PER_IP) {
        this.logger.warn(`WebSocketService: Too many connections from IP ${ip}`);
        ws.close(1008, 'Too many connections from this IP');
        return;
      }
      
      // Check user connection limit
      if (user && user.id) {
        if (!this.userConnections.has(user.id)) {
          this.userConnections.set(user.id, new Set());
        }
        if (this.userConnections.get(user.id).size >= MAX_CONNECTIONS_PER_USER) {
          this.logger.warn(`WebSocketService: Too many connections for user ${user.id}`);
          ws.close(1008, 'Too many connections for this user');
          return;
        }
        this.userConnections.get(user.id).add(clientId);
      }
      
      // Store client info
      const client = {
        id: clientId,
        ws,
        isAuthenticated: true,
        userId: user.id,
        isDemo: user.isDemo || false,
        userAgent: req.headers['user-agent'] || 'unknown',
        remoteAddress: ip,
        connectedAt: Date.now(),
        lastPing: Date.now(),
        send: (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(typeof data === 'string' ? data : JSON.stringify(data));
          }
        }
      };
      
      this.clients.set(clientId, client);
      this.ipConnections.get(ip).add(clientId);
      this.updateMetrics('connections');
      
      // Set up message handlers
      ws.on('message', (data) => this.handleMessage(client, data));
      ws.on('close', () => this.handleDisconnect(client));
      ws.on('error', (error) => this.handleError(error, 'client', client));
      ws.on('pong', () => this.handlePong(client));
      
      // Send welcome message
      client.send({
        type: 'welcome',
        clientId,
        userId: user.id,
        isDemo: user.isDemo
      });
      
      // Emit connection event
      eventBus.emit('websocket.connect', {
        type: 'connect',
        client: {
          id: clientId,
          userId: user.id,
          isDemo: user.isDemo,
          remoteAddress: ip
        }
      });
      
      this.logger.debug(`WebSocketService: Client connected: ${clientId}`);
      
    } catch (error) {
      this.handleError(error, 'connection');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Internal Server Error');
      }
    }
  }

  /**
   * Handle client pong response
   * @param {Object} client - Client information
   * @private
   */
  handlePong(client) {
    if (this.clients.has(client.id)) {
      client.lastPing = Date.now();
    }
  }

  /**
   * Send ping to all clients
   * @private
   */
  pingClients() {
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.ping();
        } catch (error) {
          this.logger.error(`Error pinging client ${client.id}:`, error);
        }
      }
    }
  }

  /**
   * Clean up stale connections
   * @private
   */
  cleanup() {
    const now = Date.now();
    
    for (const [clientId, client] of this.clients.entries()) {
      // Close connections that haven't responded to ping
      if (now - client.lastPing > CONNECTION_TIMEOUT) {
        this.logger.warn(`WebSocketService: Client ${clientId} timed out`);
        client.ws.close(1001, 'Connection timed out');
        continue;
      }
      
      // Close connections in closing/closed state
      if (client.ws.readyState === WebSocket.CLOSING || client.ws.readyState === WebSocket.CLOSED) {
        this.handleDisconnect(client);
        continue;
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} client - Client information
   * @param {string|Buffer} message - Raw message data
   * @private
   */
  async handleMessage(client, message) {
    let parsedMessage;
    
    try {
      // Debug the raw message
      this.logger.debug(`WebSocketService: Raw message from client ${client.id}:`, {
        type: typeof message,
        isBuffer: Buffer.isBuffer(message),
        length: message.length,
        content: message.toString()
      });
      
      // Handle both string and Buffer messages
      const messageStr = typeof message === 'string' ? message : message.toString();
      parsedMessage = JSON.parse(messageStr);
      
      this.logger.info(`WebSocketService: Received message type: ${parsedMessage.type} from client ${client.id}`);
      this.logger.debug(`WebSocketService: Parsed message:`, parsedMessage);
      this.updateMetrics('messages_received');
      
      // Emit message event for metrics collection
      eventBus.emit('websocket.message', {
        type: 'message',
        client,
        data: { type: parsedMessage.type, timestamp: Date.now() }
      });
      
      // Check rate limits
      const rateCheck = rateLimiter.checkLimit(client, parsedMessage);
      if (!rateCheck.allowed) {
        this.sendToClient(client.id, {
          type: 'error',
          action: 'rateLimit',
          data: {
            message: rateCheck.message,
            resetAt: rateCheck.resetAt
          }
        });
        return;
      }
      
      // Handle authentication message
      if (parsedMessage.type === 'auth') {
        this.logger.info(`WebSocketService: Routing to auth handler for client ${client.id}`);
        await this.handleAuthentication(client, parsedMessage);
        return;
      }
      
      // Handle Signal Protocol handshake
      if (parsedMessage.type === 'signal-handshake') {
        await this.handleSignalProtocolHandshake(client, parsedMessage);
        return;
      }
      
      // Handle encrypted Signal Protocol messages
      if (parsedMessage.type === 'signal-encrypted') {
        await this.handleEncryptedMessage(client, parsedMessage);
        return;
      }
      
      // Require authentication for all other message types
      if (!client.isAuthenticated) {
        this.logger.warn(`WebSocketService: Message type ${parsedMessage.type} requires authentication for client ${client.id}`);
        this.sendToClient(client.id, {
          type: 'error',
          action: 'auth',
          data: { message: 'Authentication required' }
        });
        return;
      }
      
      // Route message to appropriate handler
      const handler = this.messageHandlers.get(parsedMessage.type);
      if (handler) {
        await handler(client, parsedMessage);
      } else {
        this.sendToClient(client.id, {
          type: 'error',
          action: 'unsupported',
          data: { message: `Unsupported message type: ${parsedMessage.type}` }
        });
      }
    } catch (error) {
      this.handleError(error, `handling message from client ${client.id}`);
      
      // Emit error event for metrics
      eventBus.emit('websocket.error', {
        type: 'error',
        client,
        data: { error: error.message }
      });
      
      this.sendToClient(client.id, {
        type: 'error',
        action: 'internal',
        data: { message: 'Internal server error' }
      });
    }
  }

  /**
   * Handle client authentication
   * @param {Object} client - Client information
   * @param {Object} message - Authentication message
   * @private
   */
  async handleAuthentication(client, message) {
    try {
      if (message.action !== 'authenticate' || !message.data?.token) {
        this.sendToClient(client.id, {
          type: 'auth',
          action: 'error',
          data: { message: 'Invalid authentication request' }
        });
        return;
      }
      
      const token = message.data.token;
      this.logger.info(`WebSocketService: Attempting auth for client ${client.id} with token: ${token}`);
      
      let userData;
      try {
        userData = await verifyAuthToken(token);
        this.logger.info(`WebSocketService: Auth result for client ${client.id}:`, userData);
      } catch (authError) {
        this.logger.error(`WebSocketService: Auth exception for client ${client.id}:`, authError);
        this.sendToClient(client.id, {
          type: 'auth',
          action: 'error',
          data: { message: 'Authentication failed' }
        });
        return;
      }
      
      if (!userData) {
        this.logger.warn(`WebSocketService: Auth failed for client ${client.id} - no user data returned`);
        this.sendToClient(client.id, {
          type: 'auth',
          action: 'error',
          data: { message: 'Invalid authentication token' }
        });
        return;
      }
      
      // Update client with authentication info
      client.isAuthenticated = true;
      client.userId = userData.userId || userData.id;
      client.userData = userData;
      client.authenticatedAt = Date.now();
      
      this.updateMetrics('authentications');
      this.logger.info(`WebSocketService: Client ${client.id} authenticated as user ${client.userId}`);
      
      // Notify client of successful authentication
      this.sendToClient(client.id, {
        type: 'auth',
        action: 'success',
        data: { userId: client.userId }
      });
      
      // Notify adapters about new authenticated client
      for (const [name, adapter] of this.adapters.entries()) {
        try {
          if (typeof adapter.onClientConnect === 'function') {
            await adapter.onClientConnect(client);
          }
        } catch (err) {
          this.logger.error(`WebSocketService: Error in adapter ${name} onClientConnect:`, err);
        }
      }
    } catch (error) {
      this.handleError(error, `authenticating client ${client.id}`);
      this.sendToClient(client.id, {
        type: 'auth',
        action: 'error',
        data: { message: 'Authentication failed' }
      });
    }
  }

  /**
   * Handle client disconnection
   * @param {Object} client - Client information
   * @private
   */
  handleDisconnect(client) {
    try {
      if (!this.clients.has(client.id)) return;
      
      // Remove from IP connections
      const ipSet = this.ipConnections.get(client.remoteAddress);
      if (ipSet) {
        ipSet.delete(client.id);
        if (ipSet.size === 0) {
          this.ipConnections.delete(client.remoteAddress);
        }
      }
      
      // Remove from user connections
      if (client.userId) {
        const userSet = this.userConnections.get(client.userId);
        if (userSet) {
          userSet.delete(client.id);
          if (userSet.size === 0) {
            this.userConnections.delete(client.userId);
          }
        }
      }
      
      // Remove client
      this.clients.delete(client.id);
      
      // Update metrics
      this.updateMetrics('disconnections');
      
      // Emit disconnect event
      eventBus.emit('websocket.disconnect', {
        type: 'disconnect',
        client,
        data: { timestamp: Date.now() }
      });
      
      this.logger.debug(`WebSocketService: Client disconnected: ${client.id}`);
      
    } catch (error) {
      this.handleError(error, 'handling disconnect');
    }
  }

  /**
   * Handle WebSocket client errors
   * @param {Object|Error} clientOrError - Client information or Error object
   * @param {Error|string} errorOrContext - Error that occurred or context string
   * @private
   */
  handleError(clientOrError, errorOrContext) {
    if (clientOrError instanceof Error) {
      // Called as handleError(error, context) - use parent class method
      return super.handleError(clientOrError, errorOrContext);
    } else {
      // Called as handleError(client, error) - handle WebSocket specific error
      const client = clientOrError;
      const error = errorOrContext;
      
      this.logger.error(`WebSocket error for client ${client.id}:`, error);
      this.updateMetrics('errors');
      
      // Emit error event for monitoring
      eventBus.emit('websocket.error', {
        type: 'error',
        client,
        data: { error: error.message, timestamp: Date.now() }
      });
    }
  }

  /**
   * Register a message handler for a specific message type
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   * @returns {WebSocketService} This instance for chaining
   */
  registerMessageHandler(type, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    this.messageHandlers.set(type, handler);
    this.logger.debug(`WebSocketService: Registered message handler for type: ${type}`);
    return this;
  }

  /**
   * Register an adapter for WebSocket functionality
   * @param {string} type - Adapter type
   * @param {Object} adapter - Adapter instance
   * @returns {WebSocketService} This instance for chaining
   */
  registerAdapter(type, adapter) {
    if (!adapter || typeof adapter !== 'object') {
      throw new Error('Adapter must be an object');
    }
    
    this.adapters.set(type, adapter);
    
    // Register adapter's message handler if available
    if (typeof adapter.handleMessage === 'function') {
      this.registerMessageHandler(type, (client, message) => adapter.handleMessage(client, message));
    }
    
    this.logger.info(`WebSocketService: Registered adapter: ${type}`);
    return this;
  }

  /**
   * Send a message to a specific client
   * @param {string} clientId - Client ID
   * @param {Object} data - Data to send
   * @returns {boolean} True if message was sent successfully
   */
  sendToClient(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
        this.updateMetrics('messages_sent');
        return true;
      }
      return false;
    } catch (error) {
      this.handleError(error, `sending message to client ${clientId}`);
      return false;
    }
  }

  /**
   * Send an encrypted message to a specific client using Signal Protocol
   * @param {string} clientId - Client ID
   * @param {Object} message - Message to encrypt and send
   * @returns {Promise<boolean>} True if message was sent successfully
   */
  async sendEncryptedToClient(clientId, message) {
    try {
      const client = this.clients.get(clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        this.logger.warn(`WebSocketService: Client ${clientId} not available for encrypted messaging`);
        return false;
      }

      // Check if client has Signal Protocol session
      if (!client.hasSignalProtocol) {
        this.logger.warn(`WebSocketService: Client ${clientId} does not have Signal Protocol session`);
        // Fall back to unencrypted message
        return this.sendToClient(clientId, message);
      }

      const encryptionAdapter = this.adapters.get('encryption');
      if (!encryptionAdapter) {
        this.logger.warn('WebSocketService: Encryption adapter not available, sending unencrypted');
        return this.sendToClient(clientId, message);
      }

      // Encrypt the message using Signal Protocol
      const encryptedMessage = await encryptionAdapter.encryptMessage(clientId, message);
      
      if (encryptedMessage.encrypted) {
        // Send encrypted message with Signal Protocol wrapper
        const signalMessage = {
          type: 'signal-encrypted',
          data: encryptedMessage.data
        };
        
        client.ws.send(JSON.stringify(signalMessage));
        this.updateMetrics('encrypted_messages_sent');
        
        this.logger.debug(`WebSocketService: Encrypted message sent to client ${clientId}`);
        return true;
      } else {
        // Encryption failed, fall back to unencrypted
        this.logger.warn(`WebSocketService: Encryption failed for client ${clientId}, sending unencrypted`);
        return this.sendToClient(clientId, message);
      }

    } catch (error) {
      this.handleError(error, `sending encrypted message to client ${clientId}`);
      // Fall back to unencrypted message on error
      return this.sendToClient(clientId, message);
    }
  }

  /**
   * Broadcast a message to all connected clients (with optional filter)
   * @param {Object} data - Data to broadcast
   * @param {Function} filter - Optional filter function
   * @returns {number} Number of clients that received the message
   */
  broadcast(data, filter = () => true) {
    try {
      const message = JSON.stringify(data);
      let count = 0;
      
      for (const client of this.clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN && filter(client)) {
          try {
            client.ws.send(message);
            count++;
          } catch (error) {
            this.logger.error(`WebSocketService: Error broadcasting to client ${client.id}:`, error);
          }
        }
      }
      
      this.updateMetrics('broadcasts_sent');
      this.logger.debug(`WebSocketService: Broadcast sent to ${count} clients`);
      return count;
    } catch (error) {
      this.handleError(error, 'broadcasting message');
      return 0;
    }
  }

  /**
   * Broadcast a message to all authenticated clients
   * @param {Object} data - Data to broadcast
   * @param {Function} filter - Optional additional filter function
   * @returns {number} Number of clients that received the message
   */
  broadcastToAuthenticated(data, filter = () => true) {
    return this.broadcast(data, client => client.isAuthenticated && filter(client));
  }

  /**
   * Get client information by ID
   * @param {string} clientId - Client ID
   * @returns {Object|undefined} Client object or undefined if not found
   */
  getClient(clientId) {
    return this.clients.get(clientId);
  }

  /**
   * Get all connected user IDs
   * @returns {string[]} Array of user IDs
   */
  getConnectedUserIds() {
    const userIds = new Set();
    for (const client of this.clients.values()) {
      if (client.isAuthenticated && client.userId) {
        userIds.add(client.userId);
      }
    }
    return Array.from(userIds);
  }

  /**
   * Start the WebSocket service
   * @returns {Promise<void>}
   * @throws {Error} If service start fails
   */
  async start() {
    try {
      if (this.isRunning()) {
        this.logger.warn('WebSocketService: Service is already running');
        return;
      }
      
      if (!this.wss) {
        throw new Error('WebSocket server not initialized. Call initialize() first.');
      }
      
      // Call parent class start method
      await super.start();
      
      this.logger.info('WebSocketService: Service started successfully');
      this.updateMetrics('service_starts');
      
    } catch (error) {
      this.handleError(error, 'starting service');
      throw error;
    }
  }

  /**
   * Stop the WebSocket service gracefully
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      if (!this.isRunning()) {
        this.logger.warn('WebSocketService: Service is not running');
        return;
      }
      
      this.logger.info('WebSocketService: Stopping service...');
      
      // Close all client connections gracefully
      const clientClosePromises = [];
      for (const client of this.clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN) {
          clientClosePromises.push(
            new Promise((resolve) => {
              client.ws.close(1001, 'Service shutting down');
              // Wait a bit for graceful close or force close
              setTimeout(resolve, 1000);
            })
          );
        }
      }
      
      // Wait for all clients to disconnect
      await Promise.all(clientClosePromises);
      this.clients.clear();
      
      // Close WebSocket server
      if (this.wss) {
        await new Promise((resolve) => {
          this.wss.close(() => {
            this.logger.info('WebSocketService: WebSocket server closed');
            resolve();
          });
        });
        this.wss = null;
      }
      
      // Shutdown adapters
      for (const [name, adapter] of this.adapters.entries()) {
        try {
          if (typeof adapter.shutdown === 'function') {
            await adapter.shutdown();
            this.logger.debug(`WebSocketService: Adapter ${name} shutdown completed`);
          }
        } catch (error) {
          this.logger.error(`WebSocketService: Error shutting down adapter ${name}:`, error);
        }
      }
      this.adapters.clear();
      
      // Call parent class stop method
      await super.stop();
      
      this.logger.info('WebSocketService: Service stopped successfully');
      this.updateMetrics('service_stops');
      
    } catch (error) {
      this.handleError(error, 'stopping service');
      throw error;
    }
  }

  /**
   * Get comprehensive health status of the WebSocket service
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    try {
      const connections = this.clients.size;
      const authenticatedConnections = Array.from(this.clients.values())
        .filter(c => c.isAuthenticated).length;
      
      const adapterHealth = {};
      for (const [name, adapter] of this.adapters.entries()) {
        adapterHealth[name] = {
          status: typeof adapter.getHealthStatus === 'function' 
            ? adapter.getHealthStatus().status 
            : 'unknown',
          initialized: true
        };
      }
      
      const isHealthy = this.wss && this.isRunning();
      
      return {
        service: this.serviceName,
        status: isHealthy ? 'healthy' : 'unhealthy',
        isRunning: this.isRunning(),
        uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
        connections: {
          total: connections,
          authenticated: authenticatedConnections,
          unauthenticated: connections - authenticatedConnections
        },
        adapters: adapterHealth,
        server: {
          status: this.wss ? 'running' : 'stopped'
        },
        lastCheck: Date.now(),
        metrics: this.metrics
      };
    } catch (error) {
      this.handleError(error, 'getting health status');
      return {
        service: this.serviceName,
        status: 'unhealthy',
        error: error.message,
        lastCheck: Date.now()
      };
    }
  }

  /**
   * Handle Signal Protocol handshake
   * @param {Object} client - Client information
   * @param {Object} message - Handshake message
   * @private
   */
  async handleSignalProtocolHandshake(client, message) {
    try {
      if (message.action !== 'initiate' || !message.data) {
        this.sendToClient(client.id, {
          type: 'signal-handshake',
          action: 'error',
          data: { message: 'Invalid handshake request' }
        });
        return;
      }

      // Require authentication before Signal Protocol handshake
      if (!client.isAuthenticated) {
        this.sendToClient(client.id, {
          type: 'signal-handshake',
          action: 'error',
          data: { message: 'Authentication required before Signal Protocol handshake' }
        });
        return;
      }

      const encryptionAdapter = this.adapters.get('encryption');
      if (!encryptionAdapter) {
        this.sendToClient(client.id, {
          type: 'signal-handshake',
          action: 'error',
          data: { message: 'Signal Protocol not available' }
        });
        return;
      }

      this.logger.debug(`WebSocketService: Initiating Signal Protocol handshake for client ${client.id}`);

      // Initialize Signal Protocol session
      const handshakeResult = await encryptionAdapter.initializeSignalSession(
        client.id, 
        message.data
      );

      if (handshakeResult.success) {
        // Mark client as having Signal Protocol session
        client.hasSignalProtocol = true;
        client.signalProtocolEstablishedAt = Date.now();

        this.logger.info(`WebSocketService: Signal Protocol session established for client ${client.id}`);
        this.logger.debug(`WebSocketService: Handshake result for client ${client.id}:`, handshakeResult);

        // Send handshake response to client
        this.sendToClient(client.id, {
          type: 'signal-handshake',
          action: 'complete',
          data: {
            serverIdentityKey: handshakeResult.serverIdentityKey,
            serverEphemeralKey: handshakeResult.serverEphemeralKey
          }
        });

        // Update metrics
        this.updateMetrics('signal_handshakes');

        // Emit Signal Protocol handshake event
        eventBus.emit('websocket.signal_handshake', {
          type: 'signal_handshake',
          client,
          data: { timestamp: Date.now() }
        });

      } else {
        this.logger.error(`WebSocketService: Signal Protocol handshake failed for client ${client.id}: ${handshakeResult.error}`);
        
        this.sendToClient(client.id, {
          type: 'signal-handshake',
          action: 'error',
          data: { message: 'Handshake failed' }
        });
      }

    } catch (error) {
      this.handleError(error, `Signal Protocol handshake for client ${client.id}`);
      this.sendToClient(client.id, {
        type: 'signal-handshake',
        action: 'error',
        data: { message: 'Internal server error during handshake' }
      });
    }
  }

  /**
   * Handle encrypted Signal Protocol messages
   * @param {Object} client - Client information
   * @param {Object} message - Encrypted message
   * @private
   */
  async handleEncryptedMessage(client, message) {
    try {
      // Require authentication and Signal Protocol session
      if (!client.isAuthenticated) {
        this.sendToClient(client.id, {
          type: 'error',
          action: 'auth',
          data: { message: 'Authentication required' }
        });
        return;
      }

      if (!client.hasSignalProtocol) {
        this.sendToClient(client.id, {
          type: 'error',
          action: 'signal',
          data: { message: 'Signal Protocol session required' }
        });
        return;
      }

      const encryptionAdapter = this.adapters.get('encryption');
      if (!encryptionAdapter) {
        this.sendToClient(client.id, {
          type: 'error',
          action: 'encryption',
          data: { message: 'Encryption service not available' }
        });
        return;
      }

      // Decrypt the message using Signal Protocol
      const decryptedMessage = await encryptionAdapter.decryptMessage(client.id, message.data);
      
      if (!decryptedMessage) {
        this.logger.error(`WebSocketService: Failed to decrypt message from client ${client.id}`);
        this.sendToClient(client.id, {
          type: 'error',
          action: 'decryption',
          data: { message: 'Failed to decrypt message' }
        });
        return;
      }

      this.logger.debug(`WebSocketService: Successfully decrypted message from client ${client.id}`);

      // Process the decrypted message as a normal message
      if (decryptedMessage.type) {
        const handler = this.messageHandlers.get(decryptedMessage.type);
        if (handler) {
          await handler(client, decryptedMessage);
        } else {
          this.sendEncryptedToClient(client.id, {
            type: 'error',
            action: 'unsupported',
            data: { message: `Unsupported message type: ${decryptedMessage.type}` }
          });
        }
      } else {
        this.sendEncryptedToClient(client.id, {
          type: 'error',
          action: 'invalid',
          data: { message: 'Invalid decrypted message format' }
        });
      }

    } catch (error) {
      this.handleError(error, `handling encrypted message from client ${client.id}`);
      this.sendToClient(client.id, {
        type: 'error',
        action: 'internal',
        data: { message: 'Internal server error processing encrypted message' }
      });
    }
  }
}

const webSocketService = new WebSocketService();

export default webSocketService;
export { webSocketService as WebSocketService };
