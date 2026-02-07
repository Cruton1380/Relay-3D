/**
 * Client-side service for encrypted WebSocket communication
 */
import websocketService from './websocketService.js';

class EncryptionService {
  constructor() {
    this.isInitialized = false;
    this.serverPublicKey = null;
    this.sessionKey = null;
    this.pendingMessages = [];
    
    // Bind methods
    this.handleEncryptionMessages = this.handleEncryptionMessages.bind(this);
    
    // Register message handler
    websocketService.on('encryption', this.handleEncryptionMessages);
  }
  
  /**
   * Initialize encryption
   * @returns {Promise} Resolves when encryption is ready
   */
  async initialize() {
    if (this.isInitialized) {
      return Promise.resolve();
    }
    
    // Request server's public key
    websocketService.send({
      type: 'encryption',
      action: 'getPublicKey'
    });
    
    // Return promise that resolves when encryption is ready
    return new Promise((resolve, reject) => {
      this.initPromise = { resolve, reject };
      
      // Set timeout
      this.initTimeout = setTimeout(() => {
        if (this.initPromise) {
          this.initPromise.reject(new Error('Encryption setup timed out'));
          this.initPromise = null;
        }
      }, 10000);
    });
  }
  
  /**
   * Handle encryption-related WebSocket messages
   * @param {Object} message - Message received
   */
  handleEncryptionMessages(message) {
    switch (message.action) {
      case 'publicKey':
        this.handlePublicKey(message.data);
        break;
      
      case 'keyExchangeResult':
        this.handleKeyExchangeResult(message.data);
        break;
      
      case 'encryptedMessage':
        this.handleEncryptedMessage(message.data);
        break;
      
      case 'error':
        console.error('Encryption error:', message.data.message);
        break;
    }
  }
  
  /**
   * Handle server's public key response
   * @param {Object} data - Public key data
   */
  async handlePublicKey(data) {
    try {
      this.serverPublicKey = data.key;
      
      // Generate client's session key
      const sessionKey = await this.generateSessionKey();
      
      // Encrypt session key with server's public key
      const encryptedKey = await this.encryptWithPublicKey(sessionKey);
      
      // Send encrypted session key to server
      websocketService.send({
        type: 'encryption',
        action: 'keyExchange',
        data: {
          encryptedKey
        }
      });
    } catch (error) {
      console.error('Error in key exchange:', error);
      if (this.initPromise) {
        this.initPromise.reject(error);
        this.initPromise = null;
        clearTimeout(this.initTimeout);
      }
    }
  }
  
  /**
   * Handle key exchange result
   * @param {Object} data - Key exchange result
   */
  async handleKeyExchangeResult(data) {
    if (data.success) {
      this.isInitialized = true;
      
      // Process any pending messages
      while (this.pendingMessages.length > 0) {
        const pendingMessage = this.pendingMessages.shift();
        await this.sendEncrypted(pendingMessage);
      }
      
      // Resolve initialization promise
      if (this.initPromise) {
        this.initPromise.resolve();
        this.initPromise = null;
        clearTimeout(this.initTimeout);
      }
    } else {
      console.error('Key exchange failed:', data.message);
      if (this.initPromise) {
        this.initPromise.reject(new Error(data.message));
        this.initPromise = null;
        clearTimeout(this.initTimeout);
      }
    }
  }
  
  /**
   * Handle encrypted message from server
   * @param {Object} data - Encrypted message data
   */
  async handleEncryptedMessage(data) {
    try {
      const decrypted = await this.decrypt(data);
      const message = JSON.parse(decrypted);
      
      // Dispatch message to appropriate handler
      websocketService._triggerEvent(message.type, message);
    } catch (error) {
      console.error('Error decrypting message:', error);
    }
  }
  
  /**
   * Send an encrypted message
   * @param {Object} message - Message to encrypt and send
   */
  async sendEncrypted(message) {
    if (!this.isInitialized) {
      // Queue message if encryption not yet initialized
      this.pendingMessages.push(message);
      await this.initialize();
      return;
    }
    
    try {
      const encrypted = await this.encrypt(JSON.stringify(message));
      
      websocketService.send({
        type: 'encryption',
        action: 'encryptedMessage',
        data: encrypted
      });
    } catch (error) {
      console.error('Error sending encrypted message:', error);
    }
  }
  
  /**
   * Generate a random session key
   * @returns {ArrayBuffer} Random session key
   */
  async generateSessionKey() {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export key to raw format
    this.sessionKey = key;
    return await window.crypto.subtle.exportKey('raw', key);
  }
  
  /**
   * Encrypt data with server's public key
   * @param {ArrayBuffer} data - Data to encrypt
   * @returns {string} Base64-encoded encrypted data
   */
  async encryptWithPublicKey(data) {
    // Convert PEM to CryptoKey
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = this.serverPublicKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = window.atob(pemContents);
    const derBuffer = new Uint8Array(binaryDer.length);
    
    for (let i = 0; i < binaryDer.length; i++) {
      derBuffer[i] = binaryDer.charCodeAt(i);
    }
    
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      derBuffer,
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' }
      },
      false,
      ['encrypt']
    );
    
    // Encrypt session key
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      data
    );
    
    // Convert to base64
    return btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted)));
  }
  
  /**
   * Encrypt data with session key
   * @param {string} data - Data to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  async encrypt(data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128
      },
      this.sessionKey,
      new TextEncoder().encode(data)
    );
    
    // In AES-GCM, the auth tag is appended to the ciphertext
    const ciphertext = encrypted.slice(0, encrypted.byteLength - 16);
    const tag = encrypted.slice(encrypted.byteLength - 16);
    
    return {
      iv: btoa(String.fromCharCode.apply(null, iv)),
      ciphertext: btoa(String.fromCharCode.apply(null, new Uint8Array(ciphertext))),
      tag: btoa(String.fromCharCode.apply(null, new Uint8Array(tag)))
    };
  }
  
  /**
   * Decrypt data with session key
   * @param {Object} data - Encrypted data with IV and auth tag
   * @returns {string} Decrypted data
   */
  async decrypt(data) {
    const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(data.tag), c => c.charCodeAt(0));
    
    // Combine ciphertext and tag
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128
      },
      this.sessionKey,
      combined
    );
    
    return new TextDecoder().decode(decrypted);
  }
}

export default new EncryptionService();
