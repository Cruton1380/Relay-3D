/**
 * @fileoverview WebSocket adapter for handling encrypted communication
 */
import BaseAdapter from './adapterBase.mjs';
import messageEncryption from './messageEncryption.mjs';
import logger from '../utils/logging/logger.mjs';

class EncryptionAdapter extends BaseAdapter {
  constructor() {
    // Set requiresAuth to false to allow encryption setup before auth
    super('encryption', false);
  }

  initialize(wsService) {
    super.initialize(wsService);
    
    // Initialize encryption service
    messageEncryption.initialize();
    
    logger.info('Encryption adapter initialized');
    return this;
  }
  async handleMessage(client, message) {
    switch (message.action) {
      case 'getPublicKey':
        this.handlePublicKeyRequest(client);
        break;
      
      case 'keyExchange':
        this.handleKeyExchange(client, message.data);
        break;
      
      case 'encryptedMessage':
        this.handleEncryptedMessage(client, message.data);
        break;
      
      case 'initiate':
        if (message.type === 'signal-handshake') {
          await this.handleSignalHandshake(client, message.data);
        }
        break;
      
      default:
        this.service.sendToClient(client.id, {
          type: 'encryption',
          action: 'error',
          data: { message: 'Unknown encryption action' }
        });
    }
  }

  handlePublicKeyRequest(client) {
    // Send server's public key to client
    this.service.sendToClient(client.id, {
      type: 'encryption',
      action: 'publicKey',
      data: { key: messageEncryption.getPublicKey() }
    });
    
    logger.debug(`Sent public key to client ${client.id}`);
  }

  handleKeyExchange(client, keyData) {
    // Process key exchange from client
    const result = messageEncryption.processKeyExchange(client.id, keyData);
    
    this.service.sendToClient(client.id, {
      type: 'encryption',
      action: 'keyExchangeResult',
      data: result
    });
    
    if (result.success) {
      // Add encryption capability to client object
      client.hasEncryption = true;
      logger.info(`Established encrypted channel with client ${client.id}`);
    }
  }
  handleEncryptedMessage(client, encryptedData) {
    // Decrypt the message
    const decrypted = messageEncryption.decryptMessage(client.id, encryptedData);
    
    if (!decrypted) {
      this.service.sendToClient(client.id, {
        type: 'encryption',
        action: 'error',
        data: { message: 'Failed to decrypt message' }
      });
      return;
    }
    
    // Parse the inner message
    try {
      const innerMessage = JSON.parse(decrypted);
      
      // Process the decrypted message as if it were a normal message
      // This allows end-to-end encryption for any message type
      this.service.handleMessage(client, JSON.stringify(innerMessage));
      
      logger.debug(`Processed encrypted message from client ${client.id}`);
    } catch (error) {
      logger.error(`Error processing decrypted message from ${client.id}:`, error);
      this.service.sendToClient(client.id, {
        type: 'encryption',
        action: 'error',
        data: { message: 'Invalid message format after decryption' }
      });
    }
  }

  /**
   * Initialize Signal Protocol session with client
   * @param {string} clientId - Client identifier
   * @param {Object} handshakeData - Client handshake data
   * @returns {Object} Handshake response
   */
  async initializeSignalSession(clientId, handshakeData) {
    try {
      return await messageEncryption.initializeSignalSession(clientId, handshakeData);
    } catch (error) {
      logger.error(`Signal session initialization failed for client ${clientId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Encrypt a message using Signal Protocol
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message to encrypt
   * @returns {Object} Encrypted message
   */
  async encryptMessage(clientId, message) {
    try {
      return await messageEncryption.encryptMessage(clientId, message);
    } catch (error) {
      logger.error(`Message encryption failed for client ${clientId}:`, error);
      return {
        encrypted: false,
        error: error.message
      };
    }
  }

  /**
   * Decrypt a message using Signal Protocol
   * @param {string} clientId - Client identifier
   * @param {Object} encryptedData - Encrypted message data
   * @returns {Object} Decrypted message
   */
  async decryptMessage(clientId, encryptedData) {
    try {
      return await messageEncryption.decryptMessage(clientId, encryptedData);
    } catch (error) {
      logger.error(`Message decryption failed for client ${clientId}:`, error);
      return null;
    }
  }
  onClientDisconnect(client) {
    // Clean up encryption session when client disconnects
    messageEncryption.removeClientKey(client.id);
    logger.debug(`Removed encryption session for disconnected client ${client.id}`);
  }

  /**
   * Remove client's Signal Protocol session
   * @param {string} clientId - Client identifier
   */
  async removeClientSession(clientId) {
    try {
      // Clean up Signal Protocol session
      if (messageEncryption.signalProtocol) {
        await messageEncryption.signalProtocol.removeSession(clientId);
      }
      // Also clean up any other client keys
      messageEncryption.removeClientKey(clientId);
      logger.debug(`Signal Protocol session removed for client ${clientId}`);
    } catch (error) {
      logger.error(`Error removing Signal Protocol session for client ${clientId}:`, error);
    }
  }

  /**
   * Utility method to send an encrypted message to a client
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message to encrypt and send
   * @returns {boolean} Whether the message was sent successfully
   */
  sendEncrypted(clientId, message) {
    if (!messageEncryption.hasClientSession(clientId)) {
      logger.warn(`Cannot send encrypted message: No encryption session for client ${clientId}`);
      return false;
    }
    
    const encrypted = messageEncryption.encryptMessage(clientId, message);
    
    if (!encrypted.encrypted) {
      logger.warn(`Failed to encrypt message for client ${clientId}`);
      return false;
    }
    
    return this.service.sendToClient(clientId, {
      type: 'encryption',
      action: 'encryptedMessage',
      data: encrypted.data
    });
  }
}

export default new EncryptionAdapter();
