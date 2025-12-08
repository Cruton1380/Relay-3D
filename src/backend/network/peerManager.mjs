//backend/network/peerManager.mjs
/**
 * Peer manager for distributed verification network
 */
import { createLibp2p } from 'libp2p';
import { WebSockets } from '@libp2p/websockets';
import { Noise } from '@chainsafe/libp2p-noise';
import { Mplex } from '@libp2p/mplex';
import { createFromJSON } from '@libp2p/peer-id-factory';
import logger from '../utils/logging/logger.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize logger
const peerLogger = logger.child({ module: 'peer-manager' });

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PEER_ID_FILE = path.join(process.env.DATA_DIR || './data', 'peer-id.json');

// P2P node instance
let node = null;
let peerId = null;
let connectedPeers = new Map();
let isInitialized = false;

/**
 * Initialize the peer manager
 * @returns {Promise<Object>} Initialized peer manager
 */
export async function initPeerManager() {
  if (isInitialized) return { node, peerId, isInitialized };
  
  try {
    // Load or create peer ID
    peerId = await loadOrCreatePeerId();
    
    // Create libp2p node
    node = await createLibp2p({
      peerId,
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0/ws']
      },
      transports: [
        new WebSockets()
      ],
      connectionEncryption: [
        new Noise()
      ],
      streamMuxers: [
        new Mplex()
      ]
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Start node
    await node.start();
    
    const nodeAddresses = node.getMultiaddrs().map(addr => addr.toString());
    peerLogger.info(`Peer node started with ID: ${peerId.toString()}`, { addresses: nodeAddresses });
    
    isInitialized = true;
    
    // Start peer discovery
    discoverPeers();
    
    return { node, peerId, isInitialized };
  } catch (error) {
    peerLogger.error('Failed to initialize peer manager', { error: error.message });
    throw error;
  }
}

/**
 * Load existing peer ID or create a new one
 * @returns {Promise<PeerId>} Peer ID
 */
async function loadOrCreatePeerId() {
  try {
    // Check if peer ID file exists
    await fs.access(PEER_ID_FILE);
    
    // Load peer ID from file
    const peerIdJson = JSON.parse(await fs.readFile(PEER_ID_FILE, 'utf8'));
    const loadedPeerId = await createFromJSON(peerIdJson);
    
    peerLogger.info('Loaded existing peer ID');
    return loadedPeerId;
  } catch (error) {
    // Create a new peer ID if file doesn't exist or is invalid
    peerLogger.info('Creating new peer ID');
    
    // Ensure directory exists
    const dir = path.dirname(PEER_ID_FILE);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (mkdirError) {
      // Ignore if directory already exists
    }
    
    // Create new peer ID
    const newPeerId = await createPeerId();
    
    // Save to file
    await fs.writeFile(PEER_ID_FILE, JSON.stringify(newPeerId.toJSON(), null, 2));
    
    return newPeerId;
  }
}

/**
 * Create a new peer ID
 * @returns {Promise<PeerId>} New peer ID
 */
async function createPeerId() {
  const { createEd25519PeerId } = await import('@libp2p/peer-id-factory');
  return createEd25519PeerId();
}

/**
 * Set up event listeners for the P2P node
 */
function setupEventListeners() {
  // Connection events
  node.addEventListener('peer:connect', (evt) => {
    const remotePeerId = evt.detail.remotePeer.toString();
    connectedPeers.set(remotePeerId, {
      connectedAt: Date.now(),
      lastSeen: Date.now()
    });
    
    peerLogger.info(`Connected to peer: ${remotePeerId}`);
  });
  
  node.addEventListener('peer:disconnect', (evt) => {
    const remotePeerId = evt.detail.remotePeer.toString();
    connectedPeers.delete(remotePeerId);
    
    peerLogger.info(`Disconnected from peer: ${remotePeerId}`);
  });
  
  // Error events
  node.addEventListener('error', (evt) => {
    peerLogger.error('Peer node error', { error: evt.detail.toString() });
  });
}

/**
 * Discover and connect to peers in the network
 */
async function discoverPeers() {
  try {
    // Connect to bootstrap peers
    const bootstrapPeers = process.env.BOOTSTRAP_PEERS ? 
      process.env.BOOTSTRAP_PEERS.split(',') : [];
    
    if (bootstrapPeers.length > 0) {
      peerLogger.info(`Connecting to ${bootstrapPeers.length} bootstrap peers`);
      
      for (const addr of bootstrapPeers) {
        try {
          await node.dial(addr);
          peerLogger.info(`Connected to bootstrap peer: ${addr}`);
        } catch (error) {
          peerLogger.warn(`Failed to connect to bootstrap peer: ${addr}`, { error: error.message });
        }
      }
    }
    
    // Set up periodic peer discovery
    setInterval(async () => {
      try {
        // Refresh connected peers
        const now = Date.now();
        
        // Log current peer connections
        peerLogger.info(`Connected to ${connectedPeers.size} peers`);
        
        // Prune stale connections (inactive for more than 10 minutes)
        for (const [peerId, info] of connectedPeers.entries()) {
          if (now - info.lastSeen > 10 * 60 * 1000) {
            peerLogger.info(`Pruning stale connection to peer: ${peerId}`);
            connectedPeers.delete(peerId);
          }
        }
      } catch (error) {
        peerLogger.error('Error in peer discovery loop', { error: error.message });
      }
    }, 60 * 1000); // Run every minute
  } catch (error) {
    peerLogger.error('Peer discovery error', { error: error.message });
  }
}

/**
 * Get information about connected peers
 * @returns {Object} Peer statistics
 */
export function getPeerInfo() {
  return {
    isInitialized,
    peerId: peerId ? peerId.toString() : null,
    connectedPeers: connectedPeers.size,
    peers: Array.from(connectedPeers.keys())
  };
}

/**
 * Connect to a specific peer
 * @param {string} multiaddr - Multiaddress of the peer to connect to
 * @returns {Promise<boolean>} Whether connection was successful
 */
export async function connectToPeer(multiaddr) {
  if (!isInitialized) {
    await initPeerManager();
  }
  
  try {
    await node.dial(multiaddr);
    peerLogger.info(`Connected to peer: ${multiaddr}`);
    return true;
  } catch (error) {
    peerLogger.error(`Failed to connect to peer: ${multiaddr}`, { error: error.message });
    return false;
  }
}

/**
 * Broadcast a message to all connected peers
 * @param {string} topic - Message topic
 * @param {Object} data - Message data
 * @returns {Promise<number>} Number of peers the message was sent to
 */
export async function broadcastToPeers(topic, data) {
  if (!isInitialized) {
    await initPeerManager();
  }
  
  const message = Buffer.from(JSON.stringify({ topic, data, timestamp: Date.now() }));
  let sentCount = 0;
  
  try {
    for (const connection of node.getConnections()) {
      try {
        // Send message to each connected peer
        const { stream } = await connection.newStream('/relay/broadcast/1.0.0');
        await stream.sink([message]);
        await stream.close();
        sentCount++;
      } catch (error) {
        peerLogger.warn(`Failed to send message to peer: ${connection.remotePeer.toString()}`, { error: error.message });
      }
    }
    
    peerLogger.info(`Broadcast message sent to ${sentCount} peers`, { topic });
    return sentCount;
  } catch (error) {
    peerLogger.error('Failed to broadcast message to peers', { error: error.message, topic });
    return sentCount;
  }
}

/**
 * Stop the peer manager
 * @returns {Promise<void>}
 */
export async function stopPeerManager() {
  if (!isInitialized || !node) {
    return;
  }
  
  try {
    await node.stop();
    isInitialized = false;
    peerLogger.info('Peer manager stopped');
  } catch (error) {
    peerLogger.error('Error stopping peer manager', { error: error.message });
  }
}

// Export the API as a default object
export default {
  initPeerManager,
  getPeerInfo,
  connectToPeer,
  broadcastToPeers,
  stopPeerManager
};
