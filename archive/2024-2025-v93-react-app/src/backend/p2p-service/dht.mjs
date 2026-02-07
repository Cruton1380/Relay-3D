/**
 * Distributed Hash Table implementation
 * Migrated from previous network/dht.mjs
 */
import { createLibp2p } from 'libp2p';
import { createFromJSON } from '@libp2p/peer-id-factory';
import { KadDHT } from '@libp2p/kad-dht';
import logger from '../utils/logging/logger.mjs';

class DHTManager {
  constructor() {
    this.node = null;
    this.dht = null;
    this.isInitialized = false;
  }

  async initialize(config = {}) {
    if (this.isInitialized) return;
    
    try {
      // Create a new libp2p node
      this.node = await this._createNode(config);
      
      // Access the DHT
      this.dht = this.node.services.dht;
      
      this.isInitialized = true;
      logger.info('DHT module initialized');
    } catch (error) {
      logger.error('Failed to initialize DHT module', error);
      throw error;
    }
  }
  
  async _createNode(config) {
    // Implementation of libp2p node creation with DHT enabled
    // Moved from original dht.mjs
    const peerId = config.peerId || await createFromJSON(config.peerIdJson);
    
    return await createLibp2p({
      peerId,
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      services: {
        dht: new KadDHT()
      },
      // Additional configuration from the original dht.mjs
    });
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    await this.node.start();
    logger.info('DHT module started');
  }

  async stop() {
    if (this.node) {
      await this.node.stop();
      logger.info('DHT module stopped');
    }
  }

  async store(key, value) {
    if (!this.isInitialized) {
      throw new Error('DHT module not initialized');
    }
    
    // Convert strings to buffers if needed
    const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    const valueBuffer = typeof value === 'string' ? new TextEncoder().encode(value) : value;
    
    try {
      await this.dht.put(keyBuffer, valueBuffer);
      logger.debug(`Stored value for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to store value for key: ${key}`, error);
      throw error;
    }
  }

  async retrieve(key) {
    if (!this.isInitialized) {
      throw new Error('DHT module not initialized');
    }
    
    // Convert string to buffer if needed
    const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    
    try {
      const value = await this.dht.get(keyBuffer);
      logger.debug(`Retrieved value for key: ${key}`);
      
      // Convert buffer to string if it's a UTF-8 encoded string
      return typeof value === 'string' ? value : new TextDecoder().decode(value);
    } catch (error) {
      logger.error(`Failed to retrieve value for key: ${key}`, error);
      throw error;
    }
  }

  // Add other DHT-specific methods from the original dht.mjs
}

export default new DHTManager();
