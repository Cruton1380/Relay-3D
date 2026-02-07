// frontend/services/p2pService.js
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';

let node = null;

/**
 * Creates and initializes a libp2p node
 */
export async function createNode(options = {}) {
  const defaultOptions = {
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0/ws']
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: options.bootstrapList || [
          // Default bootstrap nodes
          '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
        ]
      })
    ]
  };
  
  // Merge default options with provided options
  const nodeOptions = { ...defaultOptions, ...options };
  
  // Create the node
  node = await createLibp2p(nodeOptions);
  
  // Start the node
  await node.start();
  
  return node;
}

/**
 * Get the current libp2p node instance
 */
export function getNode() {
  return node;
}

/**
 * Stop the current libp2p node
 */
export async function stopNode() {
  if (node) {
    await node.stop();
    node = null;
  }
}

export default {
  createNode,
  getNode,
  stopNode
};
