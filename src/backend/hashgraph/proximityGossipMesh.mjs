/**
 * @fileoverview Proximity Gossip Mesh - Hashgraph-inspired gossip-about-gossip mechanism
 * Implements DAG-based event propagation for proximity channels while maintaining Relay's values
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const gossipLogger = logger.child({ module: 'proximity-gossip-mesh' });

/**
 * Represents a single event in the gossip DAG
 */
class GossipEvent {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.creator_id = data.creator_id;
    this.self_parent_id = data.self_parent_id || null; // Previous event from this user
    this.other_parent_id = data.other_parent_id || null; // Event received from another user
    this.timestamp = data.timestamp || Date.now();
    this.proximity_region_hash = data.proximity_region_hash;
    this.event_type = data.event_type; // 'vote', 'moderation', 'content', 'message'
    this.payload = data.payload;
    this.signature = data.signature || null;
    this.received_from = data.received_from || null; // Who we received this from (for gossip tracking)
    this.propagation_path = data.propagation_path || []; // Track gossip path
  }

  /**
   * Generate signature for the event
   * @param {string} privateKey - User's private key
   */
  sign(privateKey) {
    const eventData = {
      id: this.id,
      creator_id: this.creator_id,
      self_parent_id: this.self_parent_id,
      other_parent_id: this.other_parent_id,
      timestamp: this.timestamp,
      proximity_region_hash: this.proximity_region_hash,
      event_type: this.event_type,
      payload: this.payload
    };

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex');
    
    this.signature = crypto.createSign('SHA256')
      .update(hash)
      .sign(privateKey, 'hex');
    
    return this.signature;
  }

  /**
   * Verify event signature
   * @param {string} publicKey - Creator's public key
   */
  verify(publicKey) {
    if (!this.signature) return false;

    const eventData = {
      id: this.id,
      creator_id: this.creator_id,
      self_parent_id: this.self_parent_id,
      other_parent_id: this.other_parent_id,
      timestamp: this.timestamp,
      proximity_region_hash: this.proximity_region_hash,
      event_type: this.event_type,
      payload: this.payload
    };

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex');
    
    try {
      return crypto.createVerify('SHA256')
        .update(hash)
        .verify(publicKey, this.signature, 'hex');
    } catch (error) {
      gossipLogger.warn('Event signature verification failed', { 
        eventId: this.id, 
        error: error.message 
      });
      return false;
    }
  }
}

/**
 * Proximity Gossip Mesh for DAG-based event propagation
 */
class ProximityGossipMesh extends EventEmitter {
  constructor(userId, proximityRegionHash) {
    super();
    this.userId = userId;
    this.proximityRegionHash = proximityRegionHash;
    this.eventDAG = new Map(); // eventId -> GossipEvent
    this.userEvents = new Map(); // userId -> Array of event IDs (chronological)
    this.receivedEvents = new Set(); // Track what we've received to prevent loops
    this.connectedPeers = new Map(); // peerId -> connection info
    this.lastEventByUser = new Map(); // userId -> eventId (for self_parent tracking)
    this.pendingGossip = new Set(); // Events waiting to be gossiped
    
    // Configuration
    this.maxDAGSize = 10000; // Maximum events to keep in DAG
    this.gossipInterval = 500; // Milliseconds between gossip rounds
    this.maxPropagationHops = 10; // Maximum hops for event propagation
    
    this.startGossipTimer();
    
    gossipLogger.info('Proximity Gossip Mesh initialized', {
      userId: this.userId,
      proximityRegion: this.proximityRegionHash
    });
  }

  /**
   * Create a new event in the gossip DAG
   * @param {string} eventType - Type of event ('vote', 'moderation', 'content', 'message')
   * @param {Object} payload - Event payload
   * @param {string} otherParentId - Reference to another user's event (optional)
   */
  createEvent(eventType, payload, otherParentId = null) {
    const selfParentId = this.lastEventByUser.get(this.userId) || null;
    
    const event = new GossipEvent({
      creator_id: this.userId,
      self_parent_id: selfParentId,
      other_parent_id: otherParentId,
      proximity_region_hash: this.proximityRegionHash,
      event_type: eventType,
      payload: payload
    });

    // Store event in DAG
    this.eventDAG.set(event.id, event);
    this.lastEventByUser.set(this.userId, event.id);
    
    // Add to user's event history
    if (!this.userEvents.has(this.userId)) {
      this.userEvents.set(this.userId, []);
    }
    this.userEvents.get(this.userId).push(event.id);

    // Mark for gossip propagation
    this.pendingGossip.add(event.id);

    gossipLogger.debug('Created new event', {
      eventId: event.id,
      eventType,
      selfParent: selfParentId,
      otherParent: otherParentId
    });

    this.emit('eventCreated', event);
    return event;
  }

  /**
   * Receive an event from another peer
   * @param {GossipEvent} event - The received event
   * @param {string} fromPeerId - ID of the peer who sent this event
   */
  receiveEvent(event, fromPeerId) {
    // Check if we already have this event
    if (this.eventDAG.has(event.id) || this.receivedEvents.has(event.id)) {
      return false; // Already processed
    }

    // Verify event signature (if available)
    // In production, you'd verify against the creator's public key
    
    // Check propagation limits
    if (event.propagation_path.length >= this.maxPropagationHops) {
      gossipLogger.warn('Event exceeded propagation hop limit', { 
        eventId: event.id,
        hops: event.propagation_path.length 
      });
      return false;
    }

    // Update propagation path
    event.propagation_path.push({
      peerId: fromPeerId,
      timestamp: Date.now(),
      receiver: this.userId
    });
    
    event.received_from = fromPeerId;

    // Store event in DAG
    this.eventDAG.set(event.id, event);
    this.receivedEvents.add(event.id);

    // Add to creator's event history
    if (!this.userEvents.has(event.creator_id)) {
      this.userEvents.set(event.creator_id, []);
    }
    this.userEvents.get(event.creator_id).push(event.id);

    // Mark for further gossip (gossip-about-gossip)
    this.pendingGossip.add(event.id);

    gossipLogger.debug('Received event', {
      eventId: event.id,
      creator: event.creator_id,
      fromPeer: fromPeerId,
      hops: event.propagation_path.length
    });

    this.emit('eventReceived', event, fromPeerId);
    return true;
  }

  /**
   * Connect to a peer in the proximity region
   * @param {string} peerId - Peer ID
   * @param {Object} connectionInfo - Connection details (WebSocket, etc.)
   */
  connectPeer(peerId, connectionInfo) {
    this.connectedPeers.set(peerId, {
      ...connectionInfo,
      connectedAt: Date.now(),
      lastGossipAt: 0
    });

    gossipLogger.info('Connected to peer', { peerId, region: this.proximityRegionHash });
    this.emit('peerConnected', peerId);
  }

  /**
   * Disconnect from a peer
   * @param {string} peerId - Peer ID
   */
  disconnectPeer(peerId) {
    this.connectedPeers.delete(peerId);
    gossipLogger.info('Disconnected from peer', { peerId });
    this.emit('peerDisconnected', peerId);
  }

  /**
   * Start the gossip propagation timer
   */
  startGossipTimer() {
    this.gossipTimer = setInterval(() => {
      this.performGossipRound();
    }, this.gossipInterval);
  }

  /**
   * Perform a round of gossip propagation
   */
  performGossipRound() {
    if (this.pendingGossip.size === 0 || this.connectedPeers.size === 0) {
      return;
    }

    // Get events to gossip
    const eventsToGossip = Array.from(this.pendingGossip)
      .slice(0, 10) // Limit gossip batch size
      .map(eventId => this.eventDAG.get(eventId))
      .filter(event => event !== undefined);

    if (eventsToGossip.length === 0) {
      return;
    }

    // Select random subset of peers for gossip
    const peersToGossip = this.selectGossipPeers();
    
    for (const peerId of peersToGossip) {
      this.gossipToPeer(peerId, eventsToGossip);
    }

    // Clear pending gossip for these events
    eventsToGossip.forEach(event => {
      this.pendingGossip.delete(event.id);
    });
  }

  /**
   * Select peers for gossip round (random subset)
   */
  selectGossipPeers() {
    const allPeers = Array.from(this.connectedPeers.keys());
    const gossipCount = Math.min(3, allPeers.length); // Gossip to up to 3 peers
    
    // Random selection
    const selected = [];
    for (let i = 0; i < gossipCount; i++) {
      const randomIndex = Math.floor(Math.random() * allPeers.length);
      const peerId = allPeers.splice(randomIndex, 1)[0];
      selected.push(peerId);
    }
    
    return selected;
  }

  /**
   * Gossip events to a specific peer
   * @param {string} peerId - Target peer ID
   * @param {Array<GossipEvent>} events - Events to gossip
   */
  gossipToPeer(peerId, events) {
    const peerInfo = this.connectedPeers.get(peerId);
    if (!peerInfo) return;

    const gossipMessage = {
      type: 'gossip',
      events: events.map(event => ({
        ...event,
        propagation_path: [...event.propagation_path] // Clone to avoid mutation
      })),
      sender: this.userId,
      timestamp: Date.now()
    };

    // Update last gossip time
    peerInfo.lastGossipAt = Date.now();

    this.emit('gossipSent', peerId, gossipMessage);
    
    gossipLogger.debug('Gossiped events to peer', {
      peerId,
      eventCount: events.length,
      eventIds: events.map(e => e.id)
    });
  }

  /**
   * Get events from a specific user
   * @param {string} userId - User ID
   * @returns {Array<GossipEvent>} User's events
   */
  getUserEvents(userId) {
    const eventIds = this.userEvents.get(userId) || [];
    return eventIds.map(id => this.eventDAG.get(id)).filter(event => event !== undefined);
  }

  /**
   * Get the DAG ancestry for an event
   * @param {string} eventId - Event ID
   * @returns {Array<GossipEvent>} Ancestral events
   */
  getEventAncestry(eventId) {
    const ancestry = [];
    const visited = new Set();
    const queue = [eventId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      
      const event = this.eventDAG.get(currentId);
      if (!event) continue;

      visited.add(currentId);
      ancestry.push(event);

      // Add parent events to queue
      if (event.self_parent_id && !visited.has(event.self_parent_id)) {
        queue.push(event.self_parent_id);
      }
      if (event.other_parent_id && !visited.has(event.other_parent_id)) {
        queue.push(event.other_parent_id);
      }
    }

    return ancestry;
  }

  /**
   * Prune old events to maintain DAG size
   */
  pruneDAG() {
    if (this.eventDAG.size <= this.maxDAGSize) return;

    // Sort events by timestamp (oldest first)
    const allEvents = Array.from(this.eventDAG.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    const eventsToRemove = allEvents.slice(0, this.eventDAG.size - this.maxDAGSize);
    
    for (const event of eventsToRemove) {
      this.eventDAG.delete(event.id);
      this.receivedEvents.delete(event.id);
      
      // Remove from user events
      const userEventList = this.userEvents.get(event.creator_id);
      if (userEventList) {
        const index = userEventList.indexOf(event.id);
        if (index > -1) {
          userEventList.splice(index, 1);
        }
      }
    }

    gossipLogger.info('Pruned DAG', { 
      removedCount: eventsToRemove.length,
      currentSize: this.eventDAG.size 
    });
  }

  /**
   * Export DAG as JSON for analysis
   */
  exportDAG() {
    return {
      userId: this.userId,
      proximityRegion: this.proximityRegionHash,
      events: Array.from(this.eventDAG.values()),
      userEvents: Object.fromEntries(this.userEvents),
      connectedPeers: Array.from(this.connectedPeers.keys()),
      exportedAt: Date.now()
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.gossipTimer) {
      clearInterval(this.gossipTimer);
    }
    
    this.eventDAG.clear();
    this.userEvents.clear();
    this.receivedEvents.clear();
    this.connectedPeers.clear();
    this.removeAllListeners();
    
    gossipLogger.info('Proximity Gossip Mesh destroyed', { userId: this.userId });
  }
}

export { GossipEvent, ProximityGossipMesh };
