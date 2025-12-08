/**
 * @fileoverview DAG Event Constructor - Builds and manages per-channel/user DAGs
 * Complements the gossip mesh by providing structured event ordering and consensus tracking
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const dagLogger = logger.child({ module: 'dag-event-constructor' });

/**
 * Represents a structured event in the DAG with consensus properties
 */
class DAGEvent {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.creator_id = data.creator_id;
    this.channel_id = data.channel_id;
    this.event_type = data.event_type; // 'vote', 'content', 'moderation', 'revocation'
    this.payload = data.payload;
    this.timestamp = data.timestamp || Date.now();
    
    // DAG structure
    this.parent_events = data.parent_events || []; // References to parent events
    this.children_events = new Set(); // Will be populated as children reference this event
    this.height = data.height || 0; // Depth in the DAG
    
    // Consensus tracking (Relay-specific)
    this.witness_signatures = new Map(); // userId -> signature (for transparency)
    this.revocation_status = data.revocation_status || 'active'; // 'active', 'revoked', 'disputed'
    this.consensus_round = data.consensus_round || null; // For ordering
    
    // Metadata
    this.proximity_region = data.proximity_region;
    this.signature = data.signature || null;
    this.hash = data.hash || this.calculateHash();
  }

  /**
   * Calculate cryptographic hash of the event
   */
  calculateHash() {
    const eventData = {
      id: this.id,
      creator_id: this.creator_id,
      channel_id: this.channel_id,
      event_type: this.event_type,
      payload: this.payload,
      timestamp: this.timestamp,
      parent_events: this.parent_events.sort(), // Sort for deterministic hash
      height: this.height
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex');
  }

  /**
   * Add a witness signature (for transparency and verification)
   */
  addWitnessSignature(witnessId, signature) {
    this.witness_signatures.set(witnessId, {
      signature,
      timestamp: Date.now()
    });
  }

  /**
   * Mark event as revoked (preserves transparency - doesn't delete)
   */
  markRevoked(reason, revokedBy) {
    this.revocation_status = 'revoked';
    this.revocation_metadata = {
      reason,
      revokedBy,
      revokedAt: Date.now()
    };
  }

  /**
   * Check if event can see another event (ancestor relationship)
   */
  canSee(otherEventId, eventDAG) {
    const visited = new Set();
    const queue = [...this.parent_events];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      if (currentId === otherEventId) return true;

      visited.add(currentId);
      const currentEvent = eventDAG.get(currentId);
      if (currentEvent) {
        queue.push(...currentEvent.parent_events);
      }
    }

    return false;
  }
}

/**
 * DAG Event Constructor - Manages structured event DAGs per channel/user
 */
class DAGEventConstructor extends EventEmitter {
  constructor() {
    super();
    this.eventDAG = new Map(); // eventId -> DAGEvent
    this.channelDAGs = new Map(); // channelId -> Set of event IDs
    this.userDAGs = new Map(); // userId -> Set of event IDs
    this.consensusRounds = new Map(); // round -> Set of event IDs
    this.pendingEvents = new Map(); // Events waiting for parent resolution
    
    // Configuration
    this.maxDAGDepth = 1000;
    this.consensusThreshold = 0.67; // 67% witness agreement
    this.maxPendingTime = 30000; // 30 seconds max pending
    
    this.startMaintenanceTimer();
    
    dagLogger.info('DAG Event Constructor initialized');
  }

  /**
   * Create a new DAG event
   */
  createEvent(creatorId, channelId, eventType, payload, parentEventIds = [], proximityRegion = null) {
    // Validate parent events exist
    const validParents = parentEventIds.filter(id => this.eventDAG.has(id));
    if (parentEventIds.length > 0 && validParents.length !== parentEventIds.length) {
      dagLogger.warn('Some parent events not found', { 
        requested: parentEventIds,
        found: validParents 
      });
    }

    // Calculate height (max parent height + 1)
    let height = 0;
    for (const parentId of validParents) {
      const parent = this.eventDAG.get(parentId);
      height = Math.max(height, parent.height + 1);
    }

    const event = new DAGEvent({
      creator_id: creatorId,
      channel_id: channelId,
      event_type: eventType,
      payload: payload,
      parent_events: validParents,
      height: height,
      proximity_region: proximityRegion
    });

    // Add to DAG
    this.eventDAG.set(event.id, event);

    // Update parent-child relationships
    for (const parentId of validParents) {
      const parent = this.eventDAG.get(parentId);
      if (parent) {
        parent.children_events.add(event.id);
      }
    }

    // Add to channel and user DAGs
    if (!this.channelDAGs.has(channelId)) {
      this.channelDAGs.set(channelId, new Set());
    }
    this.channelDAGs.get(channelId).add(event.id);

    if (!this.userDAGs.has(creatorId)) {
      this.userDAGs.set(creatorId, new Set());
    }
    this.userDAGs.get(creatorId).add(event.id);

    dagLogger.debug('Created DAG event', {
      eventId: event.id,
      creator: creatorId,
      channel: channelId,
      type: eventType,
      height: height,
      parents: validParents.length
    });

    this.emit('eventCreated', event);
    return event;
  }

  /**
   * Add an external event to the DAG (from gossip mesh)
   */
  addExternalEvent(eventData) {
    // Check if event already exists
    if (this.eventDAG.has(eventData.id)) {
      return this.eventDAG.get(eventData.id);
    }

    // Check if all parents are available
    const missingParents = eventData.parent_events?.filter(id => !this.eventDAG.has(id)) || [];
    
    if (missingParents.length > 0) {
      // Add to pending events
      this.pendingEvents.set(eventData.id, {
        eventData,
        missingParents,
        receivedAt: Date.now()
      });

      dagLogger.debug('Event added to pending (missing parents)', {
        eventId: eventData.id,
        missingParents
      });

      this.emit('eventPending', eventData.id, missingParents);
      return null;
    }

    // Create DAG event
    const event = new DAGEvent(eventData);
    this.eventDAG.set(event.id, event);

    // Update relationships
    this.updateEventRelationships(event);
    
    // Check if this resolves any pending events
    this.resolvePendingEvents(event.id);

    dagLogger.debug('Added external event to DAG', {
      eventId: event.id,
      creator: event.creator_id,
      height: event.height
    });

    this.emit('eventAdded', event);
    return event;
  }

  /**
   * Update parent-child relationships and DAG membership
   */
  updateEventRelationships(event) {
    // Update parent-child relationships
    for (const parentId of event.parent_events) {
      const parent = this.eventDAG.get(parentId);
      if (parent) {
        parent.children_events.add(event.id);
      }
    }

    // Add to channel and user DAGs
    if (event.channel_id) {
      if (!this.channelDAGs.has(event.channel_id)) {
        this.channelDAGs.set(event.channel_id, new Set());
      }
      this.channelDAGs.get(event.channel_id).add(event.id);
    }

    if (!this.userDAGs.has(event.creator_id)) {
      this.userDAGs.set(event.creator_id, new Set());
    }
    this.userDAGs.get(event.creator_id).add(event.id);
  }

  /**
   * Resolve pending events when missing parents arrive
   */
  resolvePendingEvents(newEventId) {
    const resolvedEvents = [];
    
    for (const [pendingId, pendingInfo] of this.pendingEvents.entries()) {
      const stillMissing = pendingInfo.missingParents.filter(id => !this.eventDAG.has(id));
      
      if (stillMissing.length === 0) {
        // All parents now available, create the event
        const event = new DAGEvent(pendingInfo.eventData);
        this.eventDAG.set(event.id, event);
        this.updateEventRelationships(event);
        
        resolvedEvents.push(event);
        this.pendingEvents.delete(pendingId);

        dagLogger.debug('Resolved pending event', { eventId: pendingId });
        this.emit('eventResolved', event);
      } else {
        // Update missing parents list
        pendingInfo.missingParents = stillMissing;
      }
    }

    // Recursively resolve any events that were waiting for the resolved events
    for (const resolvedEvent of resolvedEvents) {
      this.resolvePendingEvents(resolvedEvent.id);
    }
  }

  /**
   * Calculate consensus round for events (simplified Hashgraph-inspired ordering)
   */
  calculateConsensusRound(eventId) {
    const event = this.eventDAG.get(eventId);
    if (!event || event.consensus_round !== null) {
      return event?.consensus_round;
    }

    // Find strongly connected witnessed events
    const witnesses = this.findWitnessEvents(event);
    
    if (witnesses.size >= Math.ceil(this.getActiveParticipants() * this.consensusThreshold)) {
      // Assign consensus round
      const round = this.getNextConsensusRound();
      event.consensus_round = round;

      if (!this.consensusRounds.has(round)) {
        this.consensusRounds.set(round, new Set());
      }
      this.consensusRounds.get(round).add(eventId);

      dagLogger.debug('Event reached consensus', {
        eventId,
        round,
        witnesses: witnesses.size
      });

      this.emit('consensusReached', event, round);
      return round;
    }

    return null;
  }

  /**
   * Find witness events that can see this event
   */
  findWitnessEvents(event) {
    const witnesses = new Set();
    
    // Check all events in the channel for witness capability
    const channelEvents = this.channelDAGs.get(event.channel_id) || new Set();
    
    for (const eventId of channelEvents) {
      const candidateEvent = this.eventDAG.get(eventId);
      if (candidateEvent && 
          candidateEvent.timestamp > event.timestamp &&
          candidateEvent.canSee(event.id, this.eventDAG)) {
        witnesses.add(candidateEvent.creator_id);
      }
    }

    return witnesses;
  }

  /**
   * Get active participants count (for consensus threshold)
   */
  getActiveParticipants() {
    // Count unique creators in recent events (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentCreators = new Set();

    for (const event of this.eventDAG.values()) {
      if (event.timestamp > oneHourAgo) {
        recentCreators.add(event.creator_id);
      }
    }

    return Math.max(recentCreators.size, 3); // Minimum 3 for consensus
  }

  /**
   * Get next consensus round number
   */
  getNextConsensusRound() {
    return this.consensusRounds.size + 1;
  }

  /**
   * Get events in a specific channel
   */
  getChannelEvents(channelId, includeRevoked = false) {
    const eventIds = this.channelDAGs.get(channelId) || new Set();
    const events = Array.from(eventIds)
      .map(id => this.eventDAG.get(id))
      .filter(event => event && (includeRevoked || event.revocation_status === 'active'));

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get events by a specific user
   */
  getUserEvents(userId, includeRevoked = false) {
    const eventIds = this.userDAGs.get(userId) || new Set();
    const events = Array.from(eventIds)
      .map(id => this.eventDAG.get(id))
      .filter(event => event && (includeRevoked || event.revocation_status === 'active'));

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the full ancestry tree of an event
   */
  getEventAncestry(eventId) {
    const ancestry = new Map(); // height -> events at that height
    const visited = new Set();
    const queue = [eventId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;

      const event = this.eventDAG.get(currentId);
      if (!event) continue;

      visited.add(currentId);
      
      if (!ancestry.has(event.height)) {
        ancestry.set(event.height, []);
      }
      ancestry.get(event.height).push(event);

      // Add parents to queue
      for (const parentId of event.parent_events) {
        if (!visited.has(parentId)) {
          queue.push(parentId);
        }
      }
    }

    return ancestry;
  }

  /**
   * Prune old events and maintain DAG health
   */
  pruneDAG() {
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const eventsToRemove = [];

    // Find old events to remove
    for (const event of this.eventDAG.values()) {
      if (currentTime - event.timestamp > maxAge && event.height < this.maxDAGDepth) {
        eventsToRemove.push(event);
      }
    }

    // Remove old events
    for (const event of eventsToRemove) {
      this.removeEvent(event.id);
    }

    // Clean expired pending events
    for (const [pendingId, pendingInfo] of this.pendingEvents.entries()) {
      if (currentTime - pendingInfo.receivedAt > this.maxPendingTime) {
        this.pendingEvents.delete(pendingId);
        dagLogger.warn('Expired pending event', { eventId: pendingId });
      }
    }

    if (eventsToRemove.length > 0) {
      dagLogger.info('Pruned DAG events', { 
        removedCount: eventsToRemove.length,
        currentSize: this.eventDAG.size 
      });
    }
  }

  /**
   * Remove an event from the DAG
   */
  removeEvent(eventId) {
    const event = this.eventDAG.get(eventId);
    if (!event) return;

    // Remove from main DAG
    this.eventDAG.delete(eventId);

    // Remove from channel and user DAGs
    if (event.channel_id && this.channelDAGs.has(event.channel_id)) {
      this.channelDAGs.get(event.channel_id).delete(eventId);
    }
    
    if (this.userDAGs.has(event.creator_id)) {
      this.userDAGs.get(event.creator_id).delete(eventId);
    }

    // Remove from consensus rounds
    if (event.consensus_round && this.consensusRounds.has(event.consensus_round)) {
      this.consensusRounds.get(event.consensus_round).delete(eventId);
    }

    // Update parent-child relationships
    for (const parentId of event.parent_events) {
      const parent = this.eventDAG.get(parentId);
      if (parent) {
        parent.children_events.delete(eventId);
      }
    }
  }

  /**
   * Start maintenance timer
   */
  startMaintenanceTimer() {
    this.maintenanceTimer = setInterval(() => {
      this.pruneDAG();
    }, 60000); // Run every minute
  }

  /**
   * Export DAG state for analysis
   */
  exportDAG() {
    return {
      events: Array.from(this.eventDAG.values()),
      channelDAGs: Object.fromEntries(
        Array.from(this.channelDAGs.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      userDAGs: Object.fromEntries(
        Array.from(this.userDAGs.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      consensusRounds: Object.fromEntries(
        Array.from(this.consensusRounds.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      pendingEvents: Object.fromEntries(this.pendingEvents),
      exportedAt: Date.now(),
      stats: {
        totalEvents: this.eventDAG.size,
        totalChannels: this.channelDAGs.size,
        totalUsers: this.userDAGs.size,
        pendingCount: this.pendingEvents.size
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer);
    }

    this.eventDAG.clear();
    this.channelDAGs.clear();
    this.userDAGs.clear();
    this.consensusRounds.clear();
    this.pendingEvents.clear();
    this.removeAllListeners();

    dagLogger.info('DAG Event Constructor destroyed');
  }
}

export { DAGEvent, DAGEventConstructor };
