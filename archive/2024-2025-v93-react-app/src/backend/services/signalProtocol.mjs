/**
 * @fileoverview Signal Protocol implementation with Double Ratchet algorithm
 * Provides forward secrecy and post-compromise security for WebSocket messages
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { randomBytes as randomBytesStable } from '@stablelib/random';
import logger from '../utils/logging/logger.mjs';

class SignalProtocol {
  constructor() {
    // Signal Protocol configuration
    this.keyLength = 32; // 256 bits for all keys
    this.nonceLength = 12; // 96 bits for ChaCha20-Poly1305
    this.maxSkip = 1000; // Maximum number of message keys to skip
    
    // File paths for persistent storage
    this.keysFilePath = path.join(process.cwd(), 'data', 'security', 'signal-keys.json');
    this.sessionsFilePath = path.join(process.cwd(), 'data', 'security', 'signal-sessions.json');
    
    // In-memory stores
    this.identityKeys = new Map(); // Long-term identity keys
    this.sessions = new Map(); // Active ratchet sessions
    this.skippedKeys = new Map(); // Skipped message keys
    
    // Server's identity key pair
    this.serverIdentityKey = null;
  }

  async initialize() {
    try {
      // Load or generate server identity key
      await this.loadOrGenerateServerIdentity();
      
      // Load existing sessions and keys
      await this.loadStoredData();
      
      logger.info('Signal Protocol initialized with Double Ratchet');
      return this;
    } catch (error) {
      logger.error('Failed to initialize Signal Protocol:', error);
      throw error;
    }
  }
  /**
   * Generate or load server's long-term identity key pair
   */
  async loadOrGenerateServerIdentity() {
    try {
      const data = await fs.readFile(this.keysFilePath, 'utf8');
      const keys = JSON.parse(data);
        if (keys.serverIdentity) {
        // Import X25519 keys from stored raw bytes
        const privateKeyBuffer = Buffer.from(keys.serverIdentity.privateKey, 'base64');
        const publicKeyBuffer = Buffer.from(keys.serverIdentity.publicKey, 'base64');
        
        this.serverIdentityKey = {
          privateKey: new Uint8Array(privateKeyBuffer),
          publicKey: new Uint8Array(publicKeyBuffer)
        };
        logger.info('Loaded existing server identity key (X25519)');
      } else {
        throw new Error('No server identity key found');
      }} catch (error) {      // Generate new identity key pair using X25519
      const keyPair = generateKeyPair();
      
      this.serverIdentityKey = {
        privateKey: keyPair.secretKey,
        publicKey: keyPair.publicKey
      };
      
      await this.saveServerIdentity();
      logger.info('Generated new server identity key (X25519)');
    }
  }  /**
   * Save server identity key to persistent storage
   */
  async saveServerIdentity() {
    try {
      // Store X25519 keys as base64-encoded raw bytes
      const keysData = {
        serverIdentity: {
          privateKey: Buffer.from(this.serverIdentityKey.privateKey).toString('base64'),
          publicKey: Buffer.from(this.serverIdentityKey.publicKey).toString('base64')
        }
      };

      // Ensure data directory exists
      const dataDir = path.dirname(this.keysFilePath);
      await fs.mkdir(dataDir, { recursive: true });

      await fs.writeFile(this.keysFilePath, JSON.stringify(keysData, null, 2));
      logger.info('Server identity key saved (X25519)');
    } catch (error) {
      logger.error('Failed to save server identity key:', error);
      throw error;
    }
  }

  /**
   * Load stored sessions and keys
   */
  async loadStoredData() {
    try {
      // Load sessions
      const sessionsData = await fs.readFile(this.sessionsFilePath, 'utf8');
      const sessions = JSON.parse(sessionsData);
      
      for (const [clientId, sessionData] of Object.entries(sessions)) {
        this.sessions.set(clientId, this.deserializeSession(sessionData));
      }
      
      logger.info(`Loaded ${this.sessions.size} Signal Protocol sessions`);
    } catch (error) {
      // No existing sessions file, start fresh
      await fs.writeFile(this.sessionsFilePath, '{}');
    }
  }

  /**
   * Initialize a new Signal Protocol session with a client
   * @param {string} clientId - Client identifier
   * @param {Buffer} clientIdentityKey - Client's identity public key
   * @param {Buffer} clientEphemeralKey - Client's ephemeral public key
   * @returns {Object} Session initialization response
   */  async initializeSession(clientId, clientIdentityKey, clientEphemeralKey) {
    try {      
      // Generate server's ephemeral key pair using X25519
      const serverEphemeral = generateKeyPair();

      // Perform Triple Diffie-Hellman (3DH) key agreement with X25519
      const sharedSecrets = this.tripleKeyAgreementX25519(
        this.serverIdentityKey,
        serverEphemeral,
        clientIdentityKey,
        clientEphemeralKey
      );

      // Derive root key using HKDF
      const rootKey = this.hkdf(
        Buffer.concat(sharedSecrets),
        Buffer.alloc(32), // Salt
        'Signal_Root_Key'
      );

      // Initialize Double Ratchet state
      const session = {
        rootKey,
        sendingChainKey: null,
        receivingChainKey: null,
        sendingRatchetKey: serverEphemeral,
        receivingRatchetKey: null,
        previousSendingChainLength: 0,
        messageNumber: 0,
        receivedMessageNumber: 0,
        skippedKeys: new Map()
      };

      // Store session
      this.sessions.set(clientId, session);
      await this.saveSession(clientId, session);

      logger.info(`Initialized Signal Protocol session for client ${clientId}`);      
      return {
        success: true,
        serverIdentityKey: Buffer.from(this.serverIdentityKey.publicKey).toString('base64'),
        serverEphemeralKey: Buffer.from(serverEphemeral.publicKey).toString('base64')
      };
    } catch (error) {
      logger.error(`Failed to initialize session for client ${clientId}:`, error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Perform Triple Diffie-Hellman key agreement using X25519
   * @param {Object} serverIdentity - Server's identity key pair (X25519)
   * @param {Object} serverEphemeral - Server's ephemeral key pair (X25519)
   * @param {Buffer|Uint8Array} clientIdentityKey - Client's identity public key (32 bytes)
   * @param {Buffer|Uint8Array} clientEphemeralKey - Client's ephemeral public key (32 bytes)
   * @returns {Array<Buffer>} Array of shared secrets
   */  tripleKeyAgreementX25519(serverIdentity, serverEphemeral, clientIdentityKey, clientEphemeralKey) {
    // Convert to Uint8Array if needed
    const clientIdentityKeyArray = clientIdentityKey instanceof Uint8Array ? 
      clientIdentityKey : new Uint8Array(Buffer.from(clientIdentityKey, 'base64'));
    const clientEphemeralKeyArray = clientEphemeralKey instanceof Uint8Array ? 
      clientEphemeralKey : new Uint8Array(Buffer.from(clientEphemeralKey, 'base64'));

    // Get the correct private keys based on key structure
    // serverIdentity (loaded) has .privateKey, serverEphemeral (generated) has .secretKey
    const serverIdentityPrivateKey = serverIdentity.privateKey || serverIdentity.secretKey;
    const serverEphemeralPrivateKey = serverEphemeral.secretKey || serverEphemeral.privateKey;

    // Perform the three Diffie-Hellman operations
    const dh1 = sharedKey(serverIdentityPrivateKey, clientEphemeralKeyArray);
    const dh2 = sharedKey(serverEphemeralPrivateKey, clientIdentityKeyArray);
    const dh3 = sharedKey(serverEphemeralPrivateKey, clientEphemeralKeyArray);

    return [Buffer.from(dh1), Buffer.from(dh2), Buffer.from(dh3)];
  }

  /**
   * HKDF key derivation function
   * @param {Buffer} inputKeyMaterial - Input key material
   * @param {Buffer} salt - Salt value
   * @param {string} info - Context information
   * @param {number} length - Output length in bytes
   * @returns {Buffer} Derived key
   */
  hkdf(inputKeyMaterial, salt, info, length = 32) {
    // Extract phase
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(inputKeyMaterial);
    const prk = hmac.digest();

    // Expand phase
    const infoBuffer = Buffer.from(info, 'utf8');
    const okm = crypto.createHmac('sha256', prk);
    okm.update(infoBuffer);
    okm.update(Buffer.from([1])); // Counter
    
    return okm.digest().slice(0, length);
  }

  /**
   * Encrypt a message using Signal Protocol Double Ratchet
   * @param {string} clientId - Client identifier
   * @param {string|Object} message - Message to encrypt
   * @returns {Object} Encrypted message with ratchet state
   */
  async encryptMessage(clientId, message) {
    const session = this.sessions.get(clientId);
    if (!session) {
      throw new Error(`No Signal Protocol session found for client ${clientId}`);
    }

    try {
      // Advance sending chain if needed
      if (!session.sendingChainKey) {
        await this.advanceRatchet(session);
      }

      // Derive message key from chain key
      const messageKey = this.deriveMessageKey(session.sendingChainKey);
      
      // Advance chain key
      session.sendingChainKey = this.advanceChainKey(session.sendingChainKey);
      session.messageNumber++;

      // Encrypt message using ChaCha20-Poly1305
      const plaintext = typeof message === 'string' ? message : JSON.stringify(message);
      const nonce = crypto.randomBytes(this.nonceLength);
      
      const cipher = crypto.createCipher('chacha20-poly1305', messageKey);
      cipher.setAAD(nonce);
      
      let ciphertext = cipher.update(plaintext, 'utf8');
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      const authTag = cipher.getAuthTag();      const encryptedMessage = {
        header: {
          ratchetKey: Buffer.from(session.sendingRatchetKey.publicKey).toString('base64'),
          previousChainLength: session.previousSendingChainLength,
          messageNumber: session.messageNumber - 1
        },
        nonce: nonce.toString('base64'),
        ciphertext: ciphertext.toString('base64'),
        authTag: authTag.toString('base64')
      };

      // Save updated session
      await this.saveSession(clientId, session);

      logger.debug(`Encrypted message for client ${clientId} with Double Ratchet`);
      return encryptedMessage;
    } catch (error) {
      logger.error(`Failed to encrypt message for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Decrypt a message using Signal Protocol Double Ratchet
   * @param {string} clientId - Client identifier
   * @param {Object} encryptedMessage - Encrypted message
   * @returns {string} Decrypted message
   */
  async decryptMessage(clientId, encryptedMessage) {
    const session = this.sessions.get(clientId);
    if (!session) {
      throw new Error(`No Signal Protocol session found for client ${clientId}`);
    }

    try {
      const { header, nonce, ciphertext, authTag } = encryptedMessage;

      // Check if we need to advance the receiving ratchet
      if (!session.receivingRatchetKey || 
          !session.receivingRatchetKey.equals(header.ratchetKey)) {
        await this.advanceReceivingRatchet(session, header.ratchetKey, header.previousChainLength);
      }

      // Try to get the message key
      let messageKey;
      if (header.messageNumber === session.receivedMessageNumber) {
        // Next expected message
        messageKey = this.deriveMessageKey(session.receivingChainKey);
        session.receivingChainKey = this.advanceChainKey(session.receivingChainKey);
        session.receivedMessageNumber++;
      } else if (header.messageNumber < session.receivedMessageNumber) {
        // Out of order message - check skipped keys
        const keyId = `${clientId}:${header.messageNumber}`;
        messageKey = this.skippedKeys.get(keyId);
        if (!messageKey) {
          throw new Error('Message key not found for out-of-order message');
        }
        this.skippedKeys.delete(keyId);
      } else {
        // Future message - skip intermediate keys
        messageKey = await this.skipMessageKeys(
          session, 
          clientId, 
          header.messageNumber
        );
      }

      // Decrypt message
      const decipher = crypto.createDecipher('chacha20-poly1305', messageKey);
      decipher.setAAD(Buffer.from(nonce, 'base64'));
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      
      let decrypted = decipher.update(Buffer.from(ciphertext, 'base64'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Save updated session
      await this.saveSession(clientId, session);

      logger.debug(`Decrypted message from client ${clientId} with Double Ratchet`);
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error(`Failed to decrypt message from client ${clientId}:`, error);
      throw error;
    }
  }
  /**
   * Advance the Double Ratchet (generate new ephemeral key pair)
   * @param {Object} session - Session state
   */  
  async advanceRatchet(session) {    
    // Generate new X25519 ephemeral key pair
    const newRatchetKey = generateKeyPair();

    // Derive new root key and sending chain key
    if (session.receivingRatchetKey) {
      const dh = sharedKey(newRatchetKey.secretKey, session.receivingRatchetKey);

      const [newRootKey, newChainKey] = this.kdfRatchet(session.rootKey, Buffer.from(dh));
      session.rootKey = newRootKey;
      session.sendingChainKey = newChainKey;
    }

    session.previousSendingChainLength = session.messageNumber;
    session.sendingRatchetKey = newRatchetKey;
    session.messageNumber = 0;
  }
  /**
   * Advance the receiving ratchet
   * @param {Object} session - Session state
   * @param {Buffer|Uint8Array} newRatchetKey - New ratchet public key (32 bytes X25519)
   * @param {number} chainLength - Previous chain length
   */
  async advanceReceivingRatchet(session, newRatchetKey, chainLength) {
    // Convert to Uint8Array if needed
    const newRatchetKeyArray = newRatchetKey instanceof Uint8Array ? 
      newRatchetKey : new Uint8Array(Buffer.from(newRatchetKey, 'base64'));

    // Perform DH with new ratchet key
    const dh = sharedKey(session.sendingRatchetKey.secretKey, newRatchetKeyArray);

    const [newRootKey, newChainKey] = this.kdfRatchet(session.rootKey, Buffer.from(dh));
    session.rootKey = newRootKey;
    session.receivingChainKey = newChainKey;
    session.receivingRatchetKey = newRatchetKeyArray;
    session.receivedMessageNumber = 0;
  }

  /**
   * KDF for ratchet advancement
   * @param {Buffer} rootKey - Current root key
   * @param {Buffer} dhOutput - Diffie-Hellman output
   * @returns {Array<Buffer>} [newRootKey, chainKey]
   */
  kdfRatchet(rootKey, dhOutput) {
    const input = Buffer.concat([rootKey, dhOutput]);
    const newRootKey = this.hkdf(input, Buffer.alloc(32), 'Signal_Root', 32);
    const chainKey = this.hkdf(input, Buffer.alloc(32), 'Signal_Chain', 32);
    return [newRootKey, chainKey];
  }

  /**
   * Derive message key from chain key
   * @param {Buffer} chainKey - Current chain key
   * @returns {Buffer} Message key
   */
  deriveMessageKey(chainKey) {
    return this.hkdf(chainKey, Buffer.alloc(32), 'Signal_Message', 32);
  }

  /**
   * Advance chain key
   * @param {Buffer} chainKey - Current chain key
   * @returns {Buffer} Next chain key
   */
  advanceChainKey(chainKey) {
    const hmac = crypto.createHmac('sha256', chainKey);
    hmac.update(Buffer.from([2])); // Chain key advancement constant
    return hmac.digest();
  }

  /**
   * Skip message keys for out-of-order messages
   * @param {Object} session - Session state
   * @param {string} clientId - Client identifier
   * @param {number} targetMessageNumber - Target message number
   * @returns {Buffer} Message key for target message
   */
  async skipMessageKeys(session, clientId, targetMessageNumber) {
    if (targetMessageNumber - session.receivedMessageNumber > this.maxSkip) {
      throw new Error('Too many skipped messages');
    }

    let messageKey;
    while (session.receivedMessageNumber < targetMessageNumber) {
      messageKey = this.deriveMessageKey(session.receivingChainKey);
      
      // Store skipped key
      const keyId = `${clientId}:${session.receivedMessageNumber}`;
      this.skippedKeys.set(keyId, messageKey);
      
      session.receivingChainKey = this.advanceChainKey(session.receivingChainKey);
      session.receivedMessageNumber++;
    }

    return messageKey;
  }

  /**
   * Save session to persistent storage
   * @param {string} clientId - Client identifier
   * @param {Object} session - Session state
   */
  async saveSession(clientId, session) {
    try {
      const sessionsData = await fs.readFile(this.sessionsFilePath, 'utf8').catch(() => '{}');
      const sessions = JSON.parse(sessionsData);
      
      sessions[clientId] = this.serializeSession(session);
      
      await fs.writeFile(this.sessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      logger.error('Failed to save Signal Protocol session:', error);
    }
  }
  /**
   * Serialize session for storage
   * @param {Object} session - Session state
   * @returns {Object} Serialized session
   */
  serializeSession(session) {
    return {
      rootKey: session.rootKey.toString('base64'),
      sendingChainKey: session.sendingChainKey?.toString('base64'),
      receivingChainKey: session.receivingChainKey?.toString('base64'),
      sendingRatchetKey: {
        secretKey: Buffer.from(session.sendingRatchetKey.secretKey).toString('base64'),
        publicKey: Buffer.from(session.sendingRatchetKey.publicKey).toString('base64')
      },
      receivingRatchetKey: session.receivingRatchetKey ? 
        Buffer.from(session.receivingRatchetKey).toString('base64') : null,
      previousSendingChainLength: session.previousSendingChainLength,
      messageNumber: session.messageNumber,
      receivedMessageNumber: session.receivedMessageNumber
    };
  }
  /**
   * Deserialize session from storage
   * @param {Object} data - Serialized session data
   * @returns {Object} Session state
   */
  deserializeSession(data) {
    return {
      rootKey: Buffer.from(data.rootKey, 'base64'),
      sendingChainKey: data.sendingChainKey ? Buffer.from(data.sendingChainKey, 'base64') : null,
      receivingChainKey: data.receivingChainKey ? Buffer.from(data.receivingChainKey, 'base64') : null,
      sendingRatchetKey: {
        secretKey: new Uint8Array(Buffer.from(data.sendingRatchetKey.secretKey, 'base64')),
        publicKey: new Uint8Array(Buffer.from(data.sendingRatchetKey.publicKey, 'base64'))
      },
      receivingRatchetKey: data.receivingRatchetKey ? 
        new Uint8Array(Buffer.from(data.receivingRatchetKey, 'base64')) : null,
      previousSendingChainLength: data.previousSendingChainLength,
      messageNumber: data.messageNumber,
      receivedMessageNumber: data.receivedMessageNumber,
      skippedKeys: new Map()
    };
  }  /**
   * Get server's public identity key
   * @returns {Buffer} Public identity key (32 bytes X25519)
   */
  getServerIdentityKey() {
    return Buffer.from(this.serverIdentityKey.publicKey);
  }

  /**
   * Clean up expired sessions and skipped keys
   */
  async cleanup() {
    // Remove old skipped keys (older than 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    for (const [keyId, timestamp] of this.skippedKeys.entries()) {
      if (timestamp < cutoff) {
        this.skippedKeys.delete(keyId);
      }
    }
    
    logger.debug('Signal Protocol cleanup completed');
  }
}

export default SignalProtocol;
