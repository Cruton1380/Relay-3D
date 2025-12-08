/**
 * P2P Service - Core entry point
 * Consolidates functionality from previous separate modules:
 * - p2pService.mjs
 * - advancedP2P.mjs
 * - dht.mjs
 */
import discovery from './discovery.mjs';
import dht from './dht.mjs';
import connection from './connection.mjs';
import protocol from './protocol.mjs';

class P2PService {
  constructor(config = {}) {
    this.discovery = discovery;
    this.dht = dht;
    this.connection = connection;
    this.protocol = protocol;
    
    this.initialize(config);
  }

  async initialize(config) {
    await this.discovery.initialize(config);
    await this.dht.initialize(config);
    await this.connection.initialize(config);
    await this.protocol.initialize(config);
    
    console.log('P2P Service initialized');
  }

  async start() {
    await this.discovery.start();
    await this.dht.start();
    await this.connection.start();
    await this.protocol.start();
    
    console.log('P2P Service started');
  }

  async stop() {
    await this.protocol.stop();
    await this.connection.stop();
    await this.dht.stop();
    await this.discovery.stop();
    
    console.log('P2P Service stopped');
  }

  // Add core P2P functionality methods here
  async findPeers(topic) {
    return this.discovery.findPeers(topic);
  }

  async storeDHTValue(key, value) {
    return this.dht.store(key, value);
  }

  async retrieveDHTValue(key) {
    return this.dht.retrieve(key);
  }

  async broadcast(message, topic) {
    return this.protocol.broadcast(message, topic);
  }

  async directMessage(peerId, message) {
    return this.protocol.sendTo(peerId, message);
  }
}

// Singleton instance
let instance = null;

export default {
  getInstance: (config) => {
    if (!instance) {
      instance = new P2PService(config);
    }
    return instance;
  }
};
