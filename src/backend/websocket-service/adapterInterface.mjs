/**
 * @fileoverview Defines the standard interface for WebSocket adapters
 */

/**
 * Standard interface that all WebSocket adapters should implement
 * @interface
 */
export class WebSocketAdapterInterface {
  /**
   * Initialize the adapter with the websocket service
   * @param {Object} service - WebSocket service instance
   */
  initialize(service) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle incoming message for this adapter
   * @param {string} clientId - Client identifier
   * @param {Object} message - Parsed message object
   */
  onMessage(clientId, message) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle new client connection
   * @param {string} clientId - Client identifier
   * @param {Object} metadata - Connection metadata
   */
  onConnect(clientId, metadata) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle client authentication
   * @param {string} clientId - Client identifier
   * @param {Object} user - User data from authentication
   */
  onAuthenticated(clientId, user) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle client subscription to this adapter's topic
   * @param {string} clientId - Client identifier
   * @param {string} userId - User identifier
   */
  onSubscribe(clientId, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle client unsubscription from this adapter's topic
   * @param {string} clientId - Client identifier
   * @param {string} userId - User identifier
   */
  onUnsubscribe(clientId, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle client disconnection
   * @param {string} clientId - Client identifier
   */
  onDisconnect(clientId) {
    throw new Error('Method not implemented');
  }

  /**
   * Handle WebSocket errors for this adapter
   * @param {string} clientId - Client identifier
   * @param {Error} error - Error object
   */
  onError(clientId, error) {
    throw new Error('Method not implemented');
  }
}

export default WebSocketAdapterInterface;
