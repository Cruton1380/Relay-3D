/**
 * @fileoverview Phase 2: libp2p DHT Integration with NAT Traversal
 * Real-world peer discovery and adaptive routing for Relay Network
 */

import { createLibp2p } from 'libp2p';
import { kadDHT } from '@libp2p/kad-dht';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { webSockets } from '@libp2p/websockets';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { autoRelay } from '@libp2p/auto-relay';
import { dcutr } from '@libp2p/dcutr';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { bootstrap } from '@libp2p/bootstrap';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns';
import { tcp } from '@libp2p/tcp';
import { EventEmitter } from 'events';
import logger from '../utils/logging/logger.mjs';

const p2pLogger = logger.child({ module: 'libp2p-integration' });

/**
 * Advanced libp2p Node with DHT and NAT Traversal
 * Supports decentralized peer discovery and adaptive routing
 */
export class RelayLibp2pNode extends EventEmitter {
    constructor(options = {}) {
        super();        this.options = {
            nodeId: options.nodeId || `relay-node-${Date.now()}`,
            bootstrapPeers: options.bootstrapPeers || [
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZKMMAFHTF4QmutqmaTwHeDvGas7JSTV',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                '/ip4/147.75.77.187/tcp/4001/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'
            ],
            enableRelay: options.enableRelay !== false,
            enableWebRTC: options.enableWebRTC !== false,
            natTraversal: options.natTraversal !== false,
            holePunching: options.holePunching !== false,
            regionalRelays: options.regionalRelays || [],
            maxConnections: options.maxConnections || 50,
            autoRelayEnabled: options.autoRelayEnabled !== false,
            ...options
        };

        this.libp2p = null;
        this.dht = null;
        this.discoveredPeers = new Map();        this.connectionStats = {
            totalConnections: 0,
            successfulNATTraversals: 0,
            relayConnections: 0,
            directConnections: 0,
            webRTCConnections: 0,
            holePunchingAttempts: 0,
            holePunchingSuccesses: 0,
            natType: 'unknown'
        };

        this.networkTopology = {
            meshConnectivity: new Map(),
            regionalClusters: new Map(),
            bootstrapStatus: new Map()
        };        this.natTraversalMethods = [
            'hole-punching',
            'circuit-relay',
            'webrtc-direct',
            'upnp-mapping'
        ];
        
        this.natStrategy = {
            stun: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
            turn: [], // Add TURN servers for production
            relay: {
                enabled: true,
                maxRelays: 3,
                hopLimit: 3
            }
        };
    }

    /**
     * Initialize libp2p with full DHT and NAT traversal support
     */
    async initialize() {
        p2pLogger.info('Initializing libp2p with DHT and NAT traversal', {
            nodeId: this.options.nodeId,
            enableRelay: this.options.enableRelay,
            enableWebRTC: this.options.enableWebRTC
        });

        try {
            // Create comprehensive libp2p configuration
            this.libp2p = await createLibp2p({
                // Addresses to listen on
                addresses: {
                    listen: [
                        '/ip4/0.0.0.0/tcp/0/ws',
                        '/ip4/0.0.0.0/tcp/0',
                        ...(this.options.enableWebRTC ? ['/webrtc'] : [])
                    ]
                },                // Advanced transports with NAT traversal
                transports: [
                    tcp({
                        // Enable TCP hole punching
                        inboundConnectionThreshold: 500,
                        maxConnections: 1000
                    }),
                    webSockets({
                        // WebSocket transport for browser compatibility
                        filter: ['all']
                    }),
                    ...(this.options.enableWebRTC ? [
                        webRTC({
                            // WebRTC direct for P2P connections
                            rtcConfiguration: {
                                iceServers: this.natStrategy.stun.map(url => ({ urls: url }))
                            }
                        }),
                        webRTCDirect({
                            // Direct WebRTC without signaling server
                        })
                    ] : []),
                    ...(this.options.enableRelay ? [circuitRelayTransport({
                        discoverRelays: 3,
                        reservationCompletionTimeout: 10000,
                        // Enhanced relay configuration
                        hopTimeout: 30000,
                        stopTimeout: 30000
                    })] : [])
                ],

                // Stream multiplexing
                streamMuxers: [yamux()],

                // Connection encryption
                connectionEncryption: [noise()],

                // DHT for peer discovery and content routing
                dht: kadDHT({
                    // Enable server mode for helping other peers
                    serverMode: true,
                    // Number of parallel queries
                    queryConcurrency: 10,
                    // Timeout for individual queries
                    queryTimeout: 30000
                }),                // Core services
                services: {
                    identify: identify(),
                    ping: ping(),
                    pubsub: gossipsub({
                        enabled: true,
                        emitSelf: false,
                        allowPublishToZeroPeers: false,
                        // Enhanced gossip settings for relay network
                        scoreParams: {
                            topics: {
                                'relay-network-discovery': {
                                    topicWeight: 1,
                                    timeInMeshWeight: 0.01,
                                    timeInMeshQuantum: 1000
                                }
                            }
                        }
                    }),
                    
                    // Peer discovery services
                    bootstrap: bootstrap({
                        list: this.options.bootstrapPeers,
                        timeout: 10000,
                        tagName: 'bootstrap',
                        tagValue: 100,
                        tagTTL: 120000
                    }),

                    pubsubPeerDiscovery: pubsubPeerDiscovery({
                        interval: 10000,
                        topics: ['relay-network-discovery', 'relay-hashgraph-sync'],
                        listenOnly: false
                    }),

                    // Local network discovery
                    mdns: mdns({
                        interval: 20000,
                        serviceTag: 'relay-network'
                    }),

                    // Auto-relay for NAT traversal
                    ...(this.options.autoRelayEnabled ? {
                        autoRelay: autoRelay({
                            maxReservations: 3
                        })
                    } : {}),

                    // Hole punching for direct connections
                    ...(this.options.holePunching ? {
                        dcutr: dcutr()
                    } : {})
                },                // Enhanced connection manager for NAT environments
                connectionManager: {
                    maxConnections: this.options.maxConnections,
                    minConnections: 10,
                    autoDialInterval: 30000,
                    dialTimeout: 30000,
                    inboundConnectionThreshold: 15,
                    maxIncomingPendingConnections: 5,
                    // Enhanced settings for NAT traversal
                    maxDialsPerPeer: 3,
                    dialTimeout: 60000,
                    allowLimitedConnections: true,
                    deny: []
                },

                // Connection gater for security
                connectionGater: {
                    denyDialMultiaddr: async (multiaddr) => {
                        // Allow all connections for now, add filtering logic as needed
                        return false;
                    }
                },

                // Connection gating for security
                connectionGater: {
                    denyDialMultiaddr: async (multiaddr) => {
                        // Basic security filtering
                        const addr = multiaddr.toString();
                        if (addr.includes('127.0.0.1') || addr.includes('localhost')) {
                            return false; // Allow local connections in development
                        }
                        return false; // Allow all for now, add filtering logic here
                    }
                }
            });

            // Setup event handlers
            this.setupEventHandlers();

            // Start the node
            await this.libp2p.start();
            this.dht = this.libp2p.services.dht;

            // Get our peer ID
            const peerId = this.libp2p.peerId.toString();
            const multiaddrs = this.libp2p.getMultiaddrs();

            p2pLogger.info('libp2p node started successfully', {
                peerId,
                multiaddrs: multiaddrs.map(ma => ma.toString()),
                services: Object.keys(this.libp2p.services)
            });

            // Start peer discovery
            await this.startPeerDiscovery();

            this.emit('initialized', { peerId, multiaddrs });
            return { peerId, multiaddrs };

        } catch (error) {
            p2pLogger.error('Failed to initialize libp2p node', { error: error.message });
            throw error;
        }
    }

    /**
     * Setup event handlers for connection management and discovery
     */
    setupEventHandlers() {
        // Peer discovery events
        this.libp2p.addEventListener('peer:discovery', (event) => {
            const peerId = event.detail.id.toString();
            const multiaddrs = event.detail.multiaddrs;
            
            if (!this.discoveredPeers.has(peerId)) {
                this.discoveredPeers.set(peerId, {
                    peerId,
                    multiaddrs: multiaddrs.map(ma => ma.toString()),
                    discoveredAt: Date.now(),
                    connected: false
                });

                p2pLogger.debug('Discovered new peer', {
                    peerId,
                    multiaddrs: multiaddrs.map(ma => ma.toString())
                });

                this.emit('peer:discovered', { peerId, multiaddrs });
            }
        });

        // Connection events
        this.libp2p.addEventListener('peer:connect', (event) => {
            const peerId = event.detail.toString();
            this.connectionStats.totalConnections++;

            // Update discovered peer status
            if (this.discoveredPeers.has(peerId)) {
                this.discoveredPeers.get(peerId).connected = true;
                this.discoveredPeers.get(peerId).connectedAt = Date.now();
            }

            // Analyze connection type for NAT traversal stats
            this.analyzeConnectionType(peerId);

            p2pLogger.info('Peer connected', {
                peerId,
                totalConnections: this.connectionStats.totalConnections
            });

            this.emit('peer:connected', { peerId });
        });

        this.libp2p.addEventListener('peer:disconnect', (event) => {
            const peerId = event.detail.toString();
            this.connectionStats.totalConnections--;

            if (this.discoveredPeers.has(peerId)) {
                this.discoveredPeers.get(peerId).connected = false;
                this.discoveredPeers.get(peerId).disconnectedAt = Date.now();
            }

            p2pLogger.info('Peer disconnected', {
                peerId,
                totalConnections: this.connectionStats.totalConnections
            });

            this.emit('peer:disconnected', { peerId });
        });

        // DHT events
        this.libp2p.addEventListener('peer:identify', (event) => {
            const { peerId, connectionId, protocols, listenAddrs } = event.detail;
            
            p2pLogger.debug('Peer identified', {
                peerId: peerId.toString(),
                protocols,
                listenAddrs: listenAddrs.map(ma => ma.toString())
            });
        });
    }

    /**
     * Analyze connection type to track NAT traversal success
     */
    async analyzeConnectionType(peerId) {
        try {
            const connections = this.libp2p.getConnections(peerId);
            
            for (const connection of connections) {
                const remoteAddr = connection.remoteAddr.toString();
                
                if (remoteAddr.includes('/p2p-circuit/')) {
                    this.connectionStats.relayConnections++;
                } else if (remoteAddr.includes('/webrtc/')) {
                    this.connectionStats.webRTCConnections++;
                    this.connectionStats.successfulNATTraversals++;
                } else if (remoteAddr.includes('/tcp/') || remoteAddr.includes('/ws/')) {
                    this.connectionStats.directConnections++;
                    this.connectionStats.successfulNATTraversals++;
                }
            }
        } catch (error) {
            p2pLogger.warn('Failed to analyze connection type', { error: error.message });
        }
    }

    /**
     * Start comprehensive peer discovery
     */
    async startPeerDiscovery() {
        p2pLogger.info('Starting peer discovery process');

        try {
            // Bootstrap from known peers
            if (this.options.bootstrapPeers.length > 0) {
                p2pLogger.info('Connecting to bootstrap peers', {
                    count: this.options.bootstrapPeers.length
                });
            }

            // Start DHT random walk for peer discovery
            this.startDHTRandomWalk();

            // Advertise our presence in the DHT
            await this.advertiseInDHT();

            p2pLogger.info('Peer discovery started successfully');

        } catch (error) {
            p2pLogger.error('Failed to start peer discovery', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform DHT random walk for peer discovery
     */
    startDHTRandomWalk() {
        const performRandomWalk = async () => {
            try {
                // Query for random peer IDs to discover new peers
                const randomKey = new Uint8Array(32);
                crypto.getRandomValues(randomKey);
                
                const peers = this.dht.getClosestPeers(randomKey);
                let discoveredCount = 0;

                for await (const peer of peers) {
                    discoveredCount++;
                    if (discoveredCount >= 10) break; // Limit discovery per walk
                }

                p2pLogger.debug('DHT random walk completed', { discoveredCount });

            } catch (error) {
                p2pLogger.warn('DHT random walk failed', { error: error.message });
            }
        };

        // Perform random walk every 30 seconds
        setInterval(performRandomWalk, 30000);
        
        // Initial random walk
        setTimeout(performRandomWalk, 5000);
    }

    /**
     * Advertise our services in the DHT
     */
    async advertiseInDHT() {
        try {
            // Advertise as a Relay Network node
            const relayNetworkKey = '/relay-network/node/' + this.options.nodeId;
            const nodeInfo = {
                nodeId: this.options.nodeId,
                services: ['hashgraph-consensus', 'gossip-protocol', 'proximity-channels'],
                version: '2.0.0',
                capabilities: {
                    webRTC: this.options.enableWebRTC,
                    relay: this.options.enableRelay,
                    natTraversal: this.options.natTraversal
                },
                advertisedAt: Date.now()
            };

            await this.dht.put(
                new TextEncoder().encode(relayNetworkKey),
                new TextEncoder().encode(JSON.stringify(nodeInfo))
            );

            p2pLogger.info('Advertised node in DHT', {
                key: relayNetworkKey,
                nodeInfo
            });

        } catch (error) {
            p2pLogger.warn('Failed to advertise in DHT', { error: error.message });
        }
    }

    /**
     * Find Relay Network peers using DHT
     */
    async findRelayNetworkPeers(maxPeers = 50) {
        const foundPeers = [];
        
        try {
            // Search for other Relay Network nodes
            const searchKey = '/relay-network/node/';
            const searchBytes = new TextEncoder().encode(searchKey);

            // Query DHT for closest peers to our search key
            const closestPeers = this.dht.getClosestPeers(searchBytes);

            for await (const peer of closestPeers) {
                if (foundPeers.length >= maxPeers) break;

                try {
                    // Try to get node info from DHT
                    const nodeKey = searchKey + peer.toString();
                    const nodeInfoBytes = await this.dht.get(new TextEncoder().encode(nodeKey));
                    
                    if (nodeInfoBytes) {
                        const nodeInfo = JSON.parse(new TextDecoder().decode(nodeInfoBytes));
                        foundPeers.push({
                            peerId: peer.toString(),
                            nodeInfo,
                            foundAt: Date.now()
                        });
                    }
                } catch (error) {
                    // Skip this peer if we can't get its info
                    continue;
                }
            }

            p2pLogger.info('Found Relay Network peers via DHT', {
                count: foundPeers.length,
                maxPeers
            });

            return foundPeers;

        } catch (error) {
            p2pLogger.error('Failed to find Relay Network peers', { error: error.message });
            return [];
        }
    }

    /**
     * Connect to specific peer with NAT traversal
     */
    async connectToPeer(peerId, multiaddrs = []) {
        try {
            p2pLogger.info('Attempting to connect to peer', { peerId, multiaddrs });

            // Try direct connection first
            let connection = null;
            
            if (multiaddrs.length > 0) {
                for (const addr of multiaddrs) {
                    try {
                        connection = await this.libp2p.dial(addr);
                        if (connection) break;
                    } catch (error) {
                        p2pLogger.debug('Direct connection failed, trying next address', {
                            addr,
                            error: error.message
                        });
                    }
                }
            }

            // If direct connection failed, try via relay
            if (!connection && this.options.enableRelay) {
                try {
                    connection = await this.libp2p.dial(peerId);
                } catch (error) {
                    p2pLogger.debug('Relay connection also failed', { error: error.message });
                }
            }

            if (connection) {
                p2pLogger.info('Successfully connected to peer', {
                    peerId,
                    remoteAddr: connection.remoteAddr.toString()
                });
                return connection;
            } else {
                throw new Error('All connection attempts failed');
            }

        } catch (error) {
            p2pLogger.warn('Failed to connect to peer', {
                peerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get comprehensive network statistics
     */
    getNetworkStats() {
        const connections = this.libp2p.getConnections();
        const peers = this.libp2p.getPeers();

        const stats = {
            nodeId: this.options.nodeId,
            peerId: this.libp2p.peerId.toString(),
            multiaddrs: this.libp2p.getMultiaddrs().map(ma => ma.toString()),
            
            connections: {
                total: connections.length,
                active: connections.filter(c => c.status === 'open').length,
                pending: connections.filter(c => c.status === 'opening').length
            },
            
            peers: {
                discovered: this.discoveredPeers.size,
                connected: peers.length,
                relayConnections: this.connectionStats.relayConnections,
                directConnections: this.connectionStats.directConnections,
                webRTCConnections: this.connectionStats.webRTCConnections
            },
            
            natTraversal: {
                successfulTraversals: this.connectionStats.successfulNATTraversals,
                totalAttempts: this.connectionStats.totalConnections,
                successRate: this.connectionStats.totalConnections > 0 
                    ? (this.connectionStats.successfulNATTraversals / this.connectionStats.totalConnections * 100).toFixed(1) + '%'
                    : '0%'
            },

            dht: {
                enabled: this.dht !== null,
                mode: 'server', // Always in server mode for helping other peers
                routingTableSize: this.dht ? this.dht.routingTable.size : 0
            }
        };

        return stats;
    }

    /**
     * Shutdown the libp2p node gracefully
     */
    async shutdown() {
        try {
            p2pLogger.info('Shutting down libp2p node', {
                nodeId: this.options.nodeId
            });

            if (this.libp2p) {
                await this.libp2p.stop();
            }

            this.emit('shutdown');
            p2pLogger.info('libp2p node shutdown complete');

        } catch (error) {
            p2pLogger.error('Error during libp2p shutdown', { error: error.message });
            throw error;
        }
    }
}

export default RelayLibp2pNode;
