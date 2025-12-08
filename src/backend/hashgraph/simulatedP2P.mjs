/**
 * @fileoverview Phase 2: Simplified P2P Network Simulation
 * Mock implementation for libp2p DHT/NAT traversal validation
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Simple logger fallback for demo
const logger = {
    child: (meta) => ({
        info: (msg, data) => console.log(`[INFO] ${meta.module}: ${msg}`, data || ''),
        debug: (msg, data) => console.log(`[DEBUG] ${meta.module}: ${msg}`, data || ''),
        warn: (msg, data) => console.log(`[WARN] ${meta.module}: ${msg}`, data || ''),
        error: (msg, data) => console.log(`[ERROR] ${meta.module}: ${msg}`, data || '')
    })
};

const p2pLogger = logger.child({ module: 'p2p-simulation' });

/**
 * Simulated P2P Node with NAT Traversal
 * Mock implementation for Phase 2 validation
 */
export class SimulatedP2PNode extends EventEmitter {
    constructor(options = {}) {
        super();
        this.nodeId = options.nodeId || `p2p-node-${Date.now()}`;
        this.natType = options.natType || 'cone';
        this.behindNAT = options.behindNAT !== false;
        this.maxConnections = options.maxConnections || 50;
        
        this.connections = new Map();
        this.discoveredPeers = new Map();
        this.dhtEntries = new Map();
        
        this.stats = {
            totalConnections: 0,
            successfulNATTraversals: 0,
            relayConnections: 0,
            directConnections: 0,
            webRTCConnections: 0
        };
        
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        this.multiaddrs = this.generateMultiaddrs();
        
        p2pLogger.info('Simulated P2P node initialized', {
            nodeId: this.nodeId,
            natType: this.natType,
            behindNAT: this.behindNAT
        });
        
        return {
            peerId: this.nodeId,
            addresses: this.multiaddrs
        };
    }

    generateMultiaddrs() {
        const port = 9000 + Math.floor(Math.random() * 1000);
        const addresses = [
            `/ip4/127.0.0.1/tcp/${port}/p2p/${this.nodeId}`,
            `/ip4/192.168.1.${100 + Math.floor(Math.random() * 50)}/tcp/${port}/p2p/${this.nodeId}`
        ];
        
        if (!this.behindNAT) {
            addresses.push(`/ip4/203.0.113.${Math.floor(Math.random() * 255)}/tcp/${port}/p2p/${this.nodeId}`);
        }
        
        return addresses;
    }

    async connectToPeer(peerId, multiaddrs = []) {
        if (this.connections.has(peerId)) {
            return { success: true, method: 'existing' };
        }

        // Simulate connection attempt with NAT traversal
        const connectionMethod = this.simulateNATTraversal(peerId);
        
        if (connectionMethod.success) {
            this.connections.set(peerId, {
                peerId,
                method: connectionMethod.method,
                connectedAt: Date.now(),
                latency: Math.random() * 100 + 10 // 10-110ms
            });
            
            this.stats.totalConnections++;
            this.updateConnectionStats(connectionMethod.method);
            
            this.emit('peer:connect', { detail: peerId });
        }
        
        return connectionMethod;
    }

    simulateNATTraversal(peerId) {
        const random = Math.random();
        
        // Simulate different connection methods based on NAT type
        if (!this.behindNAT) {
            return { success: true, method: 'direct' };
        }
        
        switch (this.natType) {
            case 'open':
                return { success: true, method: 'direct' };
            case 'cone':
                if (random < 0.9) {
                    return { success: true, method: random < 0.6 ? 'hole-punching' : 'webrtc' };
                }
                return { success: true, method: 'relay' };
            case 'symmetric':
                if (random < 0.7) {
                    return { success: true, method: random < 0.4 ? 'webrtc' : 'relay' };
                }
                return { success: false, method: 'failed' };
            case 'restricted':
                if (random < 0.8) {
                    return { success: true, method: random < 0.3 ? 'hole-punching' : 'relay' };
                }
                return { success: false, method: 'failed' };
            default:
                return { success: random < 0.5, method: 'relay' };
        }
    }

    updateConnectionStats(method) {
        switch (method) {
            case 'direct':
                this.stats.directConnections++;
                break;
            case 'hole-punching':
                this.stats.successfulNATTraversals++;
                this.stats.directConnections++;
                break;
            case 'webrtc':
                this.stats.webRTCConnections++;
                this.stats.successfulNATTraversals++;
                break;
            case 'relay':
                this.stats.relayConnections++;
                break;
        }
    }

    async publishToDHT(key, value) {
        this.dhtEntries.set(key, {
            value,
            publishedAt: Date.now(),
            ttl: 3600000 // 1 hour
        });
        
        p2pLogger.debug('Published to DHT', { nodeId: this.nodeId, key });
        return true;
    }

    async getFromDHT(key) {
        const entry = this.dhtEntries.get(key);
        if (!entry) return null;
        
        // Check TTL
        if (Date.now() - entry.publishedAt > entry.ttl) {
            this.dhtEntries.delete(key);
            return null;
        }
        
        return entry.value;
    }

    getConnections() {
        return Array.from(this.connections.values());
    }

    getStats() {
        return {
            ...this.stats,
            connectedPeers: this.connections.size,
            dhtEntries: this.dhtEntries.size
        };
    }

    async shutdown() {
        this.connections.clear();
        this.discoveredPeers.clear();
        this.dhtEntries.clear();
        this.isInitialized = false;
        
        p2pLogger.info('Simulated P2P node shutdown', { nodeId: this.nodeId });
    }
}

export { SimulatedP2PNode as RelayLibp2pNode };
