/**
 * @fileoverview Signal Protocol encryption for WebSocket messages
 * Provides forward secrecy and post-compromise security using Double Ratchet
 */
import SignalProtocol from '../services/signalProtocol.mjs';
import logger from '../utils/logging/logger.mjs';

class MessageEncryption {
  constructor() {
    // Signal Protocol instance
    this.signalProtocol = null;
  }

  async initialize() {
    try {
      // Initialize Signal Protocol
      this.signalProtocol = new SignalProtocol();
      await this.signalProtocol.initialize();
      
      logger.info('WebSocket message encryption initialized with Signal Protocol');
      return this;
    } catch (error) {
      logger.error('Failed to initialize Signal Protocol:', error);
      throw error;
    }
  }

  /**
   * Get server's public identity key for Signal Protocol handshake
   * @returns {Buffer} Server's public identity key
   */
  getServerIdentityKey() {
    if (!this.signalProtocol) {
      throw new Error('Signal Protocol not initialized');
    }
    return this.signalProtocol.getServerIdentityKey();
  }

  /**
   * Initialize Signal Protocol session with client
   * @param {string} clientId - Client identifier
   * @param {Object} handshakeData - Client handshake data
   * @returns {Object} Handshake response
   */
  async initializeSignalSession(clientId, handshakeData) {
    try {
      const { clientIdentityKey, clientEphemeralKey } = handshakeData;
      
      const result = await this.signalProtocol.initializeSession(
        clientId,
        Buffer.from(clientIdentityKey, 'base64'),
        Buffer.from(clientEphemeralKey, 'base64')
      );

      if (result.success) {
        logger.debug(`Signal Protocol session established for client ${clientId}`);
        return {
          success: true,
          serverIdentityKey: result.serverIdentityKey.toString('base64'),
          serverEphemeralKey: result.serverEphemeralKey.toString('base64')
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error(`Signal session initialization failed for client ${clientId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Encrypt a message using Signal Protocol Double Ratchet
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message to encrypt
   * @returns {Object} Encrypted message with Signal Protocol
   */
  async encryptMessage(clientId, message) {
    try {
      if (!this.signalProtocol) {
        throw new Error('Signal Protocol not initialized');
      }

      const encryptedMessage = await this.signalProtocol.encryptMessage(clientId, message);
      
      return {
        encrypted: true,
        protocol: 'signal',
        data: encryptedMessage
      };
    } catch (error) {
      logger.error(`Failed to encrypt message for client ${clientId}:`, error);
      
      // Return unencrypted as fallback (should not happen in production)
      return {
        encrypted: false,
        error: error.message,
        message
      };
    }
  }

  /**
   * Decrypt a message using Signal Protocol Double Ratchet
   * @param {string} clientId - Client identifier
   * @param {Object} encryptedMessage - Encrypted message
   * @returns {Object} Decrypted message
   */
  async decryptMessage(clientId, encryptedMessage) {
    try {
      if (!this.signalProtocol) {
        throw new Error('Signal Protocol not initialized');
      }

      // Check if this is a Signal Protocol message
      if (encryptedMessage.protocol === 'signal') {
        const decryptedText = await this.signalProtocol.decryptMessage(
          clientId, 
          encryptedMessage.data
        );
        
        try {
          // Try to parse as JSON
          return JSON.parse(decryptedText);
        } catch {
          // Return as plain text
          return decryptedText;
        }
      }
      
      // Legacy message format - should not occur with Signal Protocol
      logger.warn(`Received non-Signal message from client ${clientId}`);
      return null;
    } catch (error) {
      logger.error(`Failed to decrypt message from client ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Remove Signal Protocol session for a client
   * @param {string} clientId - Client identifier
   */
  async removeClientSession(clientId) {
    try {
      if (this.signalProtocol) {
        // Note: Signal Protocol sessions are persistent and don't need explicit removal
        // But we could implement session cleanup if needed
        logger.debug(`Signal Protocol session cleanup requested for client ${clientId}`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup session for client ${clientId}:`, error);
    }
  }

  /**
   * Check if a client has an established Signal Protocol session
   * @param {string} clientId - Client identifier
   * @returns {boolean} Whether client has a Signal Protocol session
   */
  hasClientSession(clientId) {
    if (!this.signalProtocol) {
      return false;
    }
    // Check if we have a session for this client
    return this.signalProtocol.sessions.has(clientId);
  }

  /**
   * Get Signal Protocol statistics
   * @returns {Object} Protocol statistics
   */
  getStats() {
    if (!this.signalProtocol) {
      return { sessions: 0, skippedKeys: 0 };
    }
    
    return {
      sessions: this.signalProtocol.sessions.size,
      skippedKeys: this.signalProtocol.skippedKeys.size,
      protocol: 'Signal Protocol with Double Ratchet'
    };
  }

  /**
   * Perform periodic cleanup of old sessions and keys
   */
  async performCleanup() {
    if (this.signalProtocol) {
      await this.signalProtocol.cleanup();
    }
  }
}

export default new MessageEncryption();
