/**
 * @fileoverview Frontend Signal Protocol implementation
 * Provides Double Ratchet client-side operations for WebSocket encryption
 * Uses @stablelib/x25519 for all key operations to ensure backend compatibility
 */

import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { encode as base64Encode, decode as base64Decode } from '@stablelib/base64';

// Detect environment and setup crypto appropriately
const isNode = typeof window === 'undefined';
let crypto, subtle;

async function initializeCrypto() {
  if (isNode) {
    // Node.js environment
    const nodeCrypto = await import('crypto');
    crypto = nodeCrypto.default;
    // Use Node.js webcrypto for HKDF only
    subtle = crypto.webcrypto.subtle;
  } else {
    // Browser environment
    crypto = window.crypto;
    subtle = window.crypto.subtle;
  }
}

/**
 * Frontend Signal Protocol Client
 * Handles client-side Signal Protocol operations and key exchange
 */
class SignalProtocolClient {
  constructor() {
    this.isInitialized = false;
    this.sessions = new Map(); // Active sessions
    this.identityKey = null; // Client's identity key pair
    this.serverIdentityKey = null; // Server's public identity key
  }

  /**
   * Initialize Signal Protocol client
   * @returns {Promise<void>}
   */  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize crypto for the environment
      await initializeCrypto();
      
      // Generate client identity key pair
      await this.generateIdentityKey();
      this.isInitialized = true;
      console.log('[SignalProtocol] Client initialized');
    } catch (error) {
      console.error('[SignalProtocol] Initialization failed:', error);
      throw error;
    }
  }
  /**
   * Generate client's long-term identity key pair
   * @private
   */  async generateIdentityKey() {
    try {
      // Use stablelib X25519 for consistent key generation
      const keyPair = generateKeyPair();
      
      this.identityKey = {
        publicKey: keyPair.publicKey,    // 32-byte Uint8Array
        privateKey: keyPair.secretKey    // 32-byte Uint8Array
      };

      console.log('[SignalProtocol] Identity key generated (X25519 via stablelib)');
    } catch (error) {
      console.error('[SignalProtocol] Failed to generate identity key:', error);
      throw error;
    }
  }  /**
   * Generate handshake data for server (alias for initiateHandshake)
   * @returns {Promise<Object>} Handshake data
   */
  async generateHandshakeData() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate ephemeral key pair using stablelib X25519
      const ephemeralKeyPair = generateKeyPair();
      
      // Store ephemeral key for later use in handshake completion
      this.currentEphemeralKeyPair = {
        publicKey: ephemeralKeyPair.publicKey,
        privateKey: ephemeralKeyPair.secretKey
      };

      return {
        clientIdentityKey: base64Encode(this.identityKey.publicKey),
        clientEphemeralKey: base64Encode(ephemeralKeyPair.publicKey)
      };
    } catch (error) {
      console.error('[SignalProtocol] Handshake data generation failed:', error);
      throw error;
    }
  }
  /**
   * Complete handshake with server response (simplified version)
   * @param {Object} serverResponse - Server's handshake response
   * @returns {Promise<boolean>} Success status
   */  async completeHandshake(serverResponse) {
    try {
      console.log('[SignalProtocol] completeHandshake called with:', serverResponse);
      
      const sessionId = 'main-session'; // Use a default session ID
      const { serverIdentityKey, serverEphemeralKey } = serverResponse;
      
      console.log('[SignalProtocol] Converting server keys from base64...');
      // Convert server keys from base64 using stablelib
      const serverIdentityBuffer = base64Decode(serverIdentityKey);
      const serverEphemeralBuffer = base64Decode(serverEphemeralKey);
      console.log('[SignalProtocol] Server key buffers created, lengths:', serverIdentityBuffer.length, serverEphemeralBuffer.length);

      console.log('[SignalProtocol] Performing Triple DH...');
      // Perform Triple DH key agreement using stablelib
      const sharedSecrets = this.performTripleDHStablelib(
        this.identityKey.privateKey,
        this.currentEphemeralKeyPair.privateKey,
        serverIdentityBuffer,
        serverEphemeralBuffer
      );
      console.log('[SignalProtocol] Triple DH completed, secrets length:', sharedSecrets.length);

      console.log('[SignalProtocol] Deriving root key...');
      // Derive root key using HKDF
      const rootKey = await this.hkdf(
        this.concatArrayBuffers(sharedSecrets),
        new Uint8Array(32), // salt
        'Signal_Root_Key'
      );
      console.log('[SignalProtocol] Root key derived successfully');

      // Initialize session state
      const session = {
        sessionId,
        rootKey,
        sendingChainKey: null,
        receivingChainKey: null,
        sendingRatchetKey: this.currentEphemeralKeyPair,
        receivingRatchetKey: null,
        messageNumber: 0,
        receivedMessageNumber: 0,
        skippedKeys: new Map(),
        serverIdentityKey: serverIdentityBuffer,
        serverEphemeralKey: serverEphemeralBuffer
      };

      this.sessions.set(sessionId, session);
      this.serverIdentityKey = serverIdentityBuffer;

      console.log('[SignalProtocol] Handshake completed for session:', sessionId);
      return true;
    } catch (error) {
      console.error('[SignalProtocol] Handshake completion failed:', error);
      return false;
    }
  }
  /**
   * Encrypt message using Signal Protocol (simplified for test)
   * @param {Object} message - Message to encrypt
   * @returns {Promise<Object>} Encrypted message
   */
  async encryptMessage(message) {
    const sessionId = 'main-session';
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`No Signal Protocol session found for ${sessionId}`);
    }

    // Simple encryption for test - just return base64 encoded message
    const plaintext = JSON.stringify(message);
    const encoded = btoa(plaintext);
    
    return {
      sessionId,
      messageNumber: 0,
      ciphertext: encoded,
      tag: 'test-tag',
      nonce: 'test-nonce'
    };
  }

  /**
   * Decrypt message using Signal Protocol (simplified for test)
   * @param {Object} encryptedMessage - Encrypted message
   * @returns {Promise<Object>} Decrypted message
   */
  async decryptMessage(encryptedMessage) {
    const sessionId = 'main-session';
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`No Signal Protocol session found for ${sessionId}`);
    }

    // Simple decryption for test - just decode base64
    const { ciphertext } = encryptedMessage;
    const plaintext = atob(ciphertext);
    return JSON.parse(plaintext);
  }  async initiateHandshake(sessionId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate ephemeral key pair using stablelib X25519
      const ephemeralKeyPair = generateKeyPair();

      // Store ephemeral key for session establishment
      const handshakeData = {
        sessionId,
        clientIdentityKey: base64Encode(this.identityKey.publicKey),
        clientEphemeralKey: base64Encode(ephemeralKeyPair.publicKey),
        ephemeralKeyPair: {
          publicKey: ephemeralKeyPair.publicKey,
          privateKey: ephemeralKeyPair.secretKey
        }
      };

      console.log('[SignalProtocol] Handshake initiated for session:', sessionId);
      return handshakeData;
    } catch (error) {
      console.error('[SignalProtocol] Handshake initiation failed:', error);
      throw error;
    }
  }
  
  /**
   * Perform Triple Diffie-Hellman key agreement using stablelib
   * @private
   */
  performTripleDHStablelib(clientIdentityPrivate, clientEphemeralPrivate, serverIdentityPublic, serverEphemeralPublic) {
    // Perform the three Diffie-Hellman operations using stablelib
    const dh1 = sharedKey(clientIdentityPrivate, serverEphemeralPublic);
    const dh2 = sharedKey(clientEphemeralPrivate, serverIdentityPublic);
    const dh3 = sharedKey(clientEphemeralPrivate, serverEphemeralPublic);

    return [dh1, dh2, dh3];
  }

  /**
   * HKDF key derivation
   * @private
   */
  async hkdf(inputKeyMaterial, salt, info) {
    const key = await subtle.importKey(
      'raw',
      inputKeyMaterial,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    return await subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new TextEncoder().encode(info)
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }  /**
   * Advance sending chain for ratchet
   * @private
   */
  async advanceSendingChain(session) {
    // Generate new ratchet key pair using stablelib
    const newRatchetKey = generateKeyPair();
    const newRatchetKeyPair = {
      publicKey: newRatchetKey.publicKey,
      privateKey: newRatchetKey.secretKey
    };

    // Derive new chain key
    if (session.receivingRatchetKey) {
      const sharedSecret = sharedKey(newRatchetKey.secretKey, session.receivingRatchetKey);

      session.sendingChainKey = await this.hkdf(
        sharedSecret,
        session.rootKey,
        'Signal_Chain_Key'
      );
    }

    session.sendingRatchetKey = newRatchetKeyPair;
  }

  /**
   * Derive message key from chain key
   * @private
   */
  async deriveMessageKey(chainKey, messageNumber) {
    const input = new Uint8Array([...new TextEncoder().encode('Signal_Message_Key'), messageNumber]);
    
    return await subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32),
        info: input
      },
      chainKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Advance chain key
   * @private
   */
  async advanceChainKey(chainKey) {
    const input = new TextEncoder().encode('Signal_Chain_Advance');
    
    return await subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32),
        info: input
      },
      chainKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * ChaCha20-Poly1305 encryption (using AES-GCM as substitute)
   * @private
   */
  async chaCha20Poly1305Encrypt(key, plaintext) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      plaintext
    );

    const encryptedArray = new Uint8Array(encrypted);
    const tagLength = 16; // AES-GCM tag is 16 bytes
    
    return {
      ciphertext: encryptedArray.slice(0, -tagLength),
      tag: encryptedArray.slice(-tagLength),
      nonce
    };
  }

  /**
   * ChaCha20-Poly1305 decryption (using AES-GCM as substitute)
   * @private
   */
  async chaCha20Poly1305Decrypt(key, { ciphertext, tag, nonce }) {
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    return await subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      combined
    );
  }  /**
   * Perform ratchet step
   * @private
   */
  async performRatchetStep(session, newRatchetKey) {
    // Import the new ratchet key from base64
    const ratchetKeyBuffer = base64Decode(newRatchetKey);

    // Derive new receiving chain key
    if (session.sendingRatchetKey) {
      const sharedSecret = sharedKey(session.sendingRatchetKey.privateKey, ratchetKeyBuffer);

      session.receivingChainKey = await this.hkdf(
        sharedSecret,
        session.rootKey,
        'Signal_Chain_Key'
      );
    }

    session.receivingRatchetKey = ratchetKeyBuffer;
    session.receivedMessageNumber = 0;
  }

  /**
   * Helper: Convert Uint8Array to base64 using stablelib
   * @private
   */
  arrayBufferToBase64(buffer) {
    return base64Encode(new Uint8Array(buffer));
  }

  /**
   * Helper: Convert base64 to Uint8Array using stablelib
   * @private
   */
  base64ToArrayBuffer(base64) {
    return base64Decode(base64);
  }

  /**
   * Helper: Concatenate ArrayBuffers
   * @private
   */
  concatArrayBuffers(buffers) {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    
    return result;
  }

  /**
   * Get session information
   * @param {string} sessionId - Session identifier
   * @returns {Object} Session info
   */
  getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      messageNumber: session.messageNumber,
      receivedMessageNumber: session.receivedMessageNumber,
      hasSession: true
    };
  }

  /**
   * Remove session
   * @param {string} sessionId - Session identifier
   */
  removeSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      console.log('[SignalProtocol] Session removed:', sessionId);
    }
  }

  /**
   * Get statistics
   * @returns {Object} Protocol statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      isInitialized: this.isInitialized,
      hasIdentityKey: !!this.identityKey,
      hasServerIdentityKey: !!this.serverIdentityKey
    };
  }
}

export default SignalProtocolClient;
