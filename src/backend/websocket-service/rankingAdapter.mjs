/**
 * @fileoverview Ranking WebSocket Adapter - Manages real-time ranking updates
 * via WebSockets. Broadcasts ranking changes to subscribed clients.
 */
import websocketService from './index.mjs';
import { getRankings } from '../voting/votingEngine.mjs';
import { eventBus } from '../event-bus/index.mjs';
import configService from '../config-service/index.mjs';

const rankLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log,
  child: () => rankLogger
};

// Ranking-specific constants
const RANKING_TOPICS = {
  GLOBAL: 'global',
  REGIONAL: 'regional',
  PERSONAL: 'personal'
};

/**
 * Adapter for handling ranking-related WebSocket communications
 */
class RankingWebSocketAdapter {
  constructor() {
    this.requiresAuth = false; // Public rankings can be accessed without auth
    this.namespace = 'rankings';
    this.cachedRankings = new Map(); // category -> rankings data
    this.clientSubscriptions = new Map(); // connectionId -> Set of subscribed categories
    
    // Set up event listeners for ranking updates
    eventBus.on('rankings:update', this.handleRankingsUpdate.bind(this));
    
    rankLogger.info('Ranking WebSocket adapter initialized');
  }

  /**
   * Initialize the ranking WebSocket adapter
   */
  async initialize() {
    try {
      // Register this adapter with the websocket service
      websocketService.registerAdapter(this.namespace, this);
      
      this.initialized = true;
      rankLogger.info('Ranking WebSocket adapter registered');
      
      // Load initial rankings
      await this.loadInitialRankings();
    } catch (error) {
      rankLogger.error('Failed to initialize ranking WebSocket adapter', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Load initial rankings into cache
   * @private
   */
  async loadInitialRankings() {
    try {
      // Load global rankings
      this.cachedRankings.set(RANKING_TOPICS.GLOBAL, await getRankings(RANKING_TOPICS.GLOBAL));
      
      // Load regional rankings for each region
      const regions = configService.get('regions', []);
      for (const region of regions) {
        const regionKey = `${RANKING_TOPICS.REGIONAL}:${region.id}`;
        this.cachedRankings.set(regionKey, await getRankings(RANKING_TOPICS.REGIONAL, null, region.id));
      }
      
      rankLogger.info('Initial rankings loaded', { 
        categories: this.cachedRankings.size 
      });
    } catch (error) {
      rankLogger.error('Failed to load initial rankings', { 
        error: error.message 
      });
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
      
      // Send welcome message
      websocketService.sendToConnection(connection.id, {
        type: 'welcome',
        message: 'Connected to rankings service'
      });
      
      // Send initial rankings
      this.sendInitialRankings(connection.id);
      
      rankLogger.info(`Ranking client connected: ${connection.id}`);
      return true; // Accept the connection
    } catch (error) {
      rankLogger.error('Error handling ranking client connection', {
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
      // Handle different message types
      switch (message.type) {
        case 'getRankings':
          await this.handleGetRankings(connectionId, message.category, message.region, message.limit);
          break;
          
        case 'subscribe':
          this.handleSubscribeCategory(connectionId, message.category, message.region);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscribeCategory(connectionId, message.category, message.region);
          break;
          
        case 'ping':
          websocketService.sendToConnection(connectionId, {
            type: 'pong',
            timestamp: Date.now()
          });
          break;
          
        default:
          rankLogger.debug(`Unknown message type: ${message.type}`, {
            connectionId
          });
          
          websocketService.sendToConnection(connectionId, {
            type: 'error',
            error: 'Unknown message type',
            originalType: message.type
          });
      }
    } catch (error) {
      rankLogger.error('Error handling ranking message', {
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
      
      rankLogger.info(`Ranking client disconnected: ${connectionId}`, {
        code,
        reason
      });
    } catch (error) {
      rankLogger.error('Error handling ranking client disconnect', {
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
      
      rankLogger.info(`Ranking client reconnected: ${oldConnectionId} -> ${newConnectionId}`);
      
      // Send initial rankings
      this.sendInitialRankings(newConnectionId);
      
      return true;
    } catch (error) {
      rankLogger.error('Error handling ranking client reconnection', {
        oldConnectionId,
        newConnectionId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send initial rankings to a newly connected client
   * @param {string} connectionId - Connection identifier
   */
  sendInitialRankings(connectionId) {
    // Send global rankings by default
    const globalRankings = this.cachedRankings.get(RANKING_TOPICS.GLOBAL) || [];
    
    websocketService.sendToConnection(connectionId, {
      type: 'initialRankings',
      category: RANKING_TOPICS.GLOBAL,
      rankings: globalRankings
    });
  }

  /**
   * Handle getRankings message from client
   * @private
   * @param {string} connectionId - Connection identifier
   * @param {string} category - Ranking category
   * @param {string} region - Region identifier (optional)
   * @param {number} limit - Max number of rankings to return
   */
  async handleGetRankings(connectionId, category, region, limit = 20) {
    try {
      let rankings;
      const cacheKey = region ? `${category}:${region}` : category;
      
      // Try to get from cache first
      if (this.cachedRankings.has(cacheKey)) {
        rankings = this.cachedRankings.get(cacheKey);
      } else {
        // Otherwise fetch from service
        rankings = await getRankings(category, limit, region);
        // Cache the result
        this.cachedRankings.set(cacheKey, rankings);
      }
      
      // Respect limit parameter
      const limitedRankings = limit ? rankings.slice(0, limit) : rankings;
      
      websocketService.sendToConnection(connectionId, {
        type: 'rankings',
        category,
        region,
        rankings: limitedRankings
      });
    } catch (error) {
      rankLogger.error(`Error getting rankings for ${category}`, { 
        error: error.message,
        region
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'error',
        error: 'Failed to retrieve rankings'
      });
    }
  }

  /**
   * Handle subscribeCategory message from client
   * @private
   * @param {string} connectionId - Connection identifier
   * @param {string} category - Ranking category
   * @param {string} region - Region identifier (optional)
   */
  handleSubscribeCategory(connectionId, category, region) {
    // Get client subscriptions
    const subscriptions = this.clientSubscriptions.get(connectionId);
    if (!subscriptions) {
      this.clientSubscriptions.set(connectionId, new Set());
    }
    
    // Create a category-specific topic subscription
    const categoryTopic = region 
      ? `${category}:${region}` 
      : category;
      
    this.clientSubscriptions.get(connectionId).add(categoryTopic);
    
    // Send current rankings for this category
    this.handleGetRankings(connectionId, category, region);
    
    // Send subscription confirmation
    websocketService.sendToConnection(connectionId, {
      type: 'subscribed',
      category,
      region
    });
    
    rankLogger.debug(`Client ${connectionId} subscribed to rankings category: ${categoryTopic}`);
  }

  /**
   * Handle unsubscribeCategory message from client
   * @private
   * @param {string} connectionId - Connection identifier
   * @param {string} category - Ranking category
   * @param {string} region - Region identifier (optional)
   */
  handleUnsubscribeCategory(connectionId, category, region) {
    // Get client subscriptions
    const subscriptions = this.clientSubscriptions.get(connectionId);
    if (!subscriptions) {
      return;
    }
    
    // Create a category-specific topic
    const categoryTopic = region 
      ? `${category}:${region}` 
      : category;
      
    // Remove subscription
    subscriptions.delete(categoryTopic);
    
    // Send unsubscription confirmation
    websocketService.sendToConnection(connectionId, {
      type: 'unsubscribed',
      category,
      region
    });
    
    rankLogger.debug(`Client ${connectionId} unsubscribed from rankings category: ${categoryTopic}`);
  }

  /**
   * Handle rankings update event
   * @private
   * @param {Object} data - Rankings update data
   */
  handleRankingsUpdate(data) {
    const { category, region, rankings } = data;
    
    // Update cache
    const cacheKey = region ? `${category}:${region}` : category;
    this.cachedRankings.set(cacheKey, rankings);
    
    // Broadcast to all connections subscribed to this category
    for (const [connectionId, subscriptions] of this.clientSubscriptions.entries()) {
      if (subscriptions.has(cacheKey)) {
        websocketService.sendToConnection(connectionId, {
          type: 'rankingsUpdate',
          category,
          region,
          rankings
        });
      }
    }
    
    rankLogger.debug(`Broadcast rankings update for ${category}`, {
      region,
      itemCount: rankings.length
    });
  }

  /**
   * Broadcast rankings update to all subscribers
   * @param {string} category - Ranking category
   * @param {string} region - Region identifier (optional)
   * @param {Array} rankings - Rankings data
   */
  broadcastRankingsUpdate(category, rankings, region = null) {
    this.handleRankingsUpdate({ category, region, rankings });
  }

  /**
   * Shutdown the adapter
   */
  shutdown() {
    this.initialized = false;
    
    // Clear event listeners
    eventBus.off('rankings:update', this.handleRankingsUpdate);
    
    rankLogger.info('Ranking WebSocket adapter shut down');
  }
}

// Create and export singleton instance
const rankingAdapter = new RankingWebSocketAdapter();
export default rankingAdapter;
