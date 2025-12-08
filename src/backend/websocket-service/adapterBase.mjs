/**
 * @fileoverview Base adapter for WebSocket services
 */
import logger from '../utils/logging/logger.mjs';

class BaseAdapter {
  /**
   * Create a new adapter
   * @param {string} name - Adapter name
   * @param {boolean} requiresAuth - Whether authentication is required
   */
  constructor(name, requiresAuth = true) {
    this.name = name;
    this.requiresAuth = requiresAuth;
    this.service = null;
  }

  /**
   * Initialize the adapter with the WebSocket service
   * @param {Object} service - WebSocket service instance
   * @returns {BaseAdapter} this instance for chaining
   */
  initialize(service) {
    this.service = service;
    service.registerAdapter(this.name, this);
    logger.info(`${this.name} adapter initialized and registered`);
    return this;
  }

  /**
   * Handle WebSocket message
   * @param {Object} client - Client object
   * @param {Object} message - Message object
   */
  handleMessage(client, message) {
    if (this.requiresAuth && !client.isAuthenticated) {
      this.service.sendToClient(client.id, {
        type: 'error',
        action: 'auth',
        data: { message: 'Authentication required' }
      });
      return;
    }
    
    // Override in subclass
    logger.warn(`handleMessage not implemented in ${this.name} adapter`);
  }

  /**
   * Handle client connection
   * @param {Object} client - Client object
   */
  onClientConnect(client) {
    // Override in subclass
    logger.debug(`Client ${client.id} connected to ${this.name} adapter`);
  }

  /**
   * Handle client disconnection
   * @param {Object} client - Client object
   */
  onClientDisconnect(client) {
    // Override in subclass
    logger.debug(`Client ${client.id} disconnected from ${this.name} adapter`);
  }

  /**
   * Clean up adapter resources
   */
  shutdown() {
    // Override in subclass if needed
    logger.info(`${this.name} adapter shut down`);
  }
}

export default BaseAdapter;
