/**
 * @fileoverview Network Partition Handler for Hashgraph DAG
 * Detects network splits, maintains local consensus, and reconciles on reconnection
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const partitionLogger = logger.child({ module: 'network-partition' });

/**
 * Represents a network partition state
 */
class PartitionState {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.startTime = data.startTime || Date.now();
    this.endTime = data.endTime || null;
    this.isolatedPeers = new Set(data.isolatedPeers || []);
    this.localConsensus = new Map(); // eventId -> local consensus state
    this.pendingEvents = new Map(); // eventId -> event data
    this.lastKnownGlobalState = data.lastKnownGlobalState || null;
    this.partitionType = data.partitionType || 'unknown'; // 'regional', 'peer', 'global'
  }
}

/**
 * Network Partition Handler
 */
export class NetworkPartitionHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.currentPartition = null;
    this.partitionHistory = new Map(); // partitionId -> PartitionState
    this.connectedPeers = new Set();
    this.lastHeartbeat = new Map(); // peerId -> timestamp
    this.offlineBuffer = new Map(); // eventId -> buffered event
    
    // Configuration
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
    this.partitionThreshold = options.partitionThreshold || 60000; // 1 minute without peers
    this.maxOfflineBuffer = options.maxOfflineBuffer || 1000;
    this.reconciliationTimeout = options.reconciliationTimeout || 300000; // 5 minutes
    
    this.startHeartbeatMonitoring();
    
    partitionLogger.info('Network Partition Handler initialized');
  }

  /**
   * Start monitoring peer heartbeats
   */
  startHeartbeatMonitoring() {
    setInterval(() => {
      this.checkNetworkHealth();
    }, this.heartbeatInterval);
  }

  /**
   * Register a peer heartbeat
   */
  registerPeerHeartbeat(peerId) {
    this.lastHeartbeat.set(peerId, Date.now());
    this.connectedPeers.add(peerId);
    
    // If we were in a partition, check if we should exit
    if (this.currentPartition) {
      this.checkPartitionRecovery();
    }
  }

  /**
   * Check network health and detect partitions
   */
  checkNetworkHealth() {
    const now = Date.now();
    const activePeers = new Set();
    
    // Check which peers are still active
    for (const [peerId, lastSeen] of this.lastHeartbeat) {
      if (now - lastSeen <= this.partitionThreshold) {
        activePeers.add(peerId);
      } else {
        this.connectedPeers.delete(peerId);
        this.lastHeartbeat.delete(peerId);
      }
    }

    this.connectedPeers = activePeers;

    // Detect partition
    if (this.connectedPeers.size === 0 && !this.currentPartition) {
      this.detectPartition('global');
    } else if (this.connectedPeers.size < 3 && this.connectedPeers.size > 0 && !this.currentPartition) {
      this.detectPartition('regional');
    }
  }

  /**
   * Detect and handle network partition
   */
  detectPartition(partitionType) {
    this.currentPartition = new PartitionState({
      partitionType,
      isolatedPeers: Array.from(this.connectedPeers)
    });

    this.partitionHistory.set(this.currentPartition.id, this.currentPartition);

    partitionLogger.warn('Network partition detected', {
      partitionId: this.currentPartition.id,
      type: partitionType,
      connectedPeers: this.connectedPeers.size,
      isolatedPeers: Array.from(this.connectedPeers)
    });

    // Enter offline mode
    this.enterOfflineMode();

    this.emit('partitionDetected', {
      partitionId: this.currentPartition.id,
      type: partitionType,
      connectedPeers: Array.from(this.connectedPeers)
    });
  }

  /**
   * Enter offline mode with local consensus
   */
  enterOfflineMode() {
    partitionLogger.info('Entering offline mode with local consensus', {
      partitionId: this.currentPartition.id
    });

    // Store current global state as baseline
    this.currentPartition.lastKnownGlobalState = {
      timestamp: Date.now(),
      dagSnapshot: this.createDAGSnapshot(),
      peerStates: new Map(this.lastHeartbeat)
    };

    this.emit('offlineModeActivated', {
      partitionId: this.currentPartition.id,
      lastKnownState: this.currentPartition.lastKnownGlobalState
    });
  }

  /**
   * Create a snapshot of the current DAG state
   */
  createDAGSnapshot() {
    // This would integrate with the actual DAG constructor
    return {
      timestamp: Date.now(),
      eventCount: this.offlineBuffer.size,
      lastEventId: null,
      consensusRounds: []
    };
  }

  /**
   * Handle event creation during partition
   */
  handlePartitionedEvent(event) {
    if (!this.currentPartition) {
      return false; // Not in partition
    }

    // Buffer event for later synchronization
    this.offlineBuffer.set(event.id, {
      ...event,
      partitionId: this.currentPartition.id,
      localTimestamp: Date.now(),
      localConsensus: 'pending'
    });

    // Apply local consensus logic
    this.applyLocalConsensus(event);

    partitionLogger.debug('Event buffered during partition', {
      eventId: event.id,
      partitionId: this.currentPartition.id,
      bufferSize: this.offlineBuffer.size
    });

    // Trim buffer if too large
    if (this.offlineBuffer.size > this.maxOfflineBuffer) {
      this.trimOfflineBuffer();
    }

    return true;
  }

  /**
   * Apply local consensus during partition
   */
  applyLocalConsensus(event) {
    // Simple local consensus: accept events from known peers
    if (this.currentPartition.isolatedPeers.has(event.creator_id)) {
      this.currentPartition.localConsensus.set(event.id, {
        status: 'accepted',
        timestamp: Date.now(),
        reason: 'known_peer'
      });
    } else {
      this.currentPartition.localConsensus.set(event.id, {
        status: 'pending',
        timestamp: Date.now(),
        reason: 'unknown_peer'
      });
    }
  }

  /**
   * Trim offline buffer to maintain memory limits
   */
  trimOfflineBuffer() {
    const events = Array.from(this.offlineBuffer.entries());
    events.sort((a, b) => a[1].localTimestamp - b[1].localTimestamp);
    
    // Keep only the most recent events
    const toKeep = events.slice(-this.maxOfflineBuffer);
    this.offlineBuffer.clear();
    
    for (const [eventId, event] of toKeep) {
      this.offlineBuffer.set(eventId, event);
    }

    partitionLogger.info('Offline buffer trimmed', {
      kept: toKeep.length,
      removed: events.length - toKeep.length
    });
  }

  /**
   * Check if partition is recovering
   */
  checkPartitionRecovery() {
    if (!this.currentPartition) return;

    // Consider partition recovered if we have sufficient peers
    const minPeersForRecovery = this.currentPartition.partitionType === 'global' ? 1 : 3;
    
    if (this.connectedPeers.size >= minPeersForRecovery) {
      this.initiatePartitionRecovery();
    }
  }

  /**
   * Initiate partition recovery and DAG reconciliation
   */
  async initiatePartitionRecovery() {
    if (!this.currentPartition) return;

    partitionLogger.info('Initiating partition recovery', {
      partitionId: this.currentPartition.id,
      connectedPeers: this.connectedPeers.size,
      bufferedEvents: this.offlineBuffer.size
    });

    this.currentPartition.endTime = Date.now();

    // Start DAG reconciliation
    const reconciliationResult = await this.reconcileDAGs();

    // Exit partition state
    this.exitPartition(reconciliationResult);
  }

  /**
   * Reconcile DAGs after partition recovery
   */
  async reconcileDAGs() {
    const reconciliation = {
      startTime: Date.now(),
      conflictsDetected: [],
      eventsAccepted: [],
      eventsRejected: [],
      mergeStrategy: 'ancestry_timestamp'
    };

    partitionLogger.info('Starting DAG reconciliation', {
      partitionId: this.currentPartition.id,
      bufferedEvents: this.offlineBuffer.size
    });

    // Request peer states for comparison
    const peerStates = await this.requestPeerStates();
    
    // Analyze buffered events against peer states
    for (const [eventId, bufferedEvent] of this.offlineBuffer) {
      const reconciliationDecision = await this.reconcileEvent(bufferedEvent, peerStates);
      
      if (reconciliationDecision.accepted) {
        reconciliation.eventsAccepted.push({
          eventId,
          reason: reconciliationDecision.reason,
          timestamp: bufferedEvent.localTimestamp
        });
      } else {
        reconciliation.eventsRejected.push({
          eventId,
          reason: reconciliationDecision.reason,
          conflictsWith: reconciliationDecision.conflictingEvents
        });
        
        if (reconciliationDecision.isConflict) {
          reconciliation.conflictsDetected.push({
            localEvent: eventId,
            conflictingEvents: reconciliationDecision.conflictingEvents,
            resolutionMethod: reconciliationDecision.resolutionMethod
          });
        }
      }
    }

    reconciliation.endTime = Date.now();
    reconciliation.duration = reconciliation.endTime - reconciliation.startTime;

    partitionLogger.info('DAG reconciliation completed', {
      partitionId: this.currentPartition.id,
      duration: reconciliation.duration,
      accepted: reconciliation.eventsAccepted.length,
      rejected: reconciliation.eventsRejected.length,
      conflicts: reconciliation.conflictsDetected.length
    });

    return reconciliation;
  }

  /**
   * Request current states from connected peers
   */
  async requestPeerStates() {
    const peerStates = new Map();
    
    for (const peerId of this.connectedPeers) {
      try {
        // This would use the transport layer to request peer state
        const state = await this.requestPeerState(peerId);
        peerStates.set(peerId, state);
      } catch (error) {
        partitionLogger.warn('Failed to get peer state', { peerId, error: error.message });
      }
    }

    return peerStates;
  }

  /**
   * Request state from a specific peer
   */
  async requestPeerState(peerId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Peer state request timeout'));
      }, 10000);

      // Emit request and wait for response
      this.emit('requestPeerState', peerId, (state) => {
        clearTimeout(timeout);
        resolve(state);
      });
    });
  }

  /**
   * Reconcile a single event against peer states
   */
  async reconcileEvent(bufferedEvent, peerStates) {
    // Check if any peer has a conflicting event
    for (const [peerId, peerState] of peerStates) {
      const conflict = this.findEventConflict(bufferedEvent, peerState);
      
      if (conflict) {
        // Resolve conflict using ancestry and timestamp
        const resolution = this.resolveEventConflict(bufferedEvent, conflict);
        
        return {
          accepted: resolution.winner === bufferedEvent.id,
          reason: resolution.reason,
          isConflict: true,
          conflictingEvents: [conflict.eventId],
          resolutionMethod: resolution.method
        };
      }
    }

    // No conflicts found, accept the event
    return {
      accepted: true,
      reason: 'no_conflicts',
      isConflict: false
    };
  }

  /**
   * Find conflicts between buffered event and peer state
   */
  findEventConflict(bufferedEvent, peerState) {
    // Check for events with same creator and similar timestamp
    for (const peerEvent of peerState.events || []) {
      if (peerEvent.creator_id === bufferedEvent.creator_id &&
          Math.abs(peerEvent.timestamp - bufferedEvent.timestamp) < 5000 && // 5 second tolerance
          peerEvent.id !== bufferedEvent.id) {
        
        return {
          eventId: peerEvent.id,
          event: peerEvent,
          peerId: peerState.peerId
        };
      }
    }

    return null;
  }

  /**
   * Resolve conflict between local and remote events
   */
  resolveEventConflict(localEvent, remoteConflict) {
    // Resolution strategy: ancestry first, then timestamp
    
    // Check ancestry (if we have parent information)
    if (localEvent.parent_events && remoteConflict.event.parent_events) {
      const ancestryComparison = this.compareAncestry(
        localEvent.parent_events, 
        remoteConflict.event.parent_events
      );
      
      if (ancestryComparison.hasWinner) {
        return {
          winner: ancestryComparison.winner,
          reason: `ancestry_precedence: ${ancestryComparison.reason}`,
          method: 'ancestry'
        };
      }
    }

    // Fall back to timestamp comparison
    if (localEvent.timestamp < remoteConflict.event.timestamp) {
      return {
        winner: localEvent.id,
        reason: 'earlier_timestamp',
        method: 'timestamp'
      };
    } else if (localEvent.timestamp > remoteConflict.event.timestamp) {
      return {
        winner: remoteConflict.eventId,
        reason: 'earlier_timestamp',
        method: 'timestamp'
      };
    }

    // Tie-breaker: lexicographic event ID comparison
    return {
      winner: localEvent.id < remoteConflict.eventId ? localEvent.id : remoteConflict.eventId,
      reason: 'lexicographic_tiebreak',
      method: 'tiebreak'
    };
  }

  /**
   * Compare ancestry between events
   */
  compareAncestry(localParents, remoteParents) {
    // Simple ancestry comparison - more sophisticated logic would trace full DAG
    const localSet = new Set(localParents);
    const remoteSet = new Set(remoteParents);
    
    // Check if one is ancestor of the other
    const localIsAncestor = remoteParents.some(p => localSet.has(p));
    const remoteIsAncestor = localParents.some(p => remoteSet.has(p));
    
    if (localIsAncestor && !remoteIsAncestor) {
      return {
        hasWinner: true,
        winner: 'local',
        reason: 'local_is_ancestor'
      };
    }
    
    if (remoteIsAncestor && !localIsAncestor) {
      return {
        hasWinner: true,
        winner: 'remote',
        reason: 'remote_is_ancestor'
      };
    }
    
    return {
      hasWinner: false,
      reason: 'no_clear_ancestry'
    };
  }

  /**
   * Exit partition state and resume normal operation
   */
  exitPartition(reconciliationResult) {
    if (!this.currentPartition) return;

    partitionLogger.info('Exiting partition state', {
      partitionId: this.currentPartition.id,
      duration: Date.now() - this.currentPartition.startTime,
      reconciliation: {
        accepted: reconciliationResult.eventsAccepted.length,
        rejected: reconciliationResult.eventsRejected.length,
        conflicts: reconciliationResult.conflictsDetected.length
      }
    });

    // Clear offline buffer
    this.offlineBuffer.clear();

    // Store partition in history
    const completedPartition = this.currentPartition;
    completedPartition.reconciliationResult = reconciliationResult;
    
    this.currentPartition = null;

    this.emit('partitionRecovered', {
      partitionId: completedPartition.id,
      duration: completedPartition.endTime - completedPartition.startTime,
      reconciliation: reconciliationResult
    });
  }

  /**
   * Get current partition state
   */
  getCurrentPartition() {
    return this.currentPartition;
  }

  /**
   * Check if currently in a partition
   */
  isInPartition() {
    return this.currentPartition !== null;
  }

  /**
   * Get partition history
   */
  getPartitionHistory() {
    return Array.from(this.partitionHistory.values());
  }

  /**
   * Get offline buffer status
   */
  getOfflineBufferStatus() {
    return {
      size: this.offlineBuffer.size,
      maxSize: this.maxOfflineBuffer,
      events: Array.from(this.offlineBuffer.keys())
    };
  }

  /**
   * Force partition recovery (for testing or manual intervention)
   */
  forcePartitionRecovery() {
    if (this.currentPartition) {
      this.initiatePartitionRecovery();
    }
  }
}
