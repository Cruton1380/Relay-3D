/**
 * @fileoverview Fork Detection and Resolution System
 * Identifies conflicting DAG events and implements human-centric resolution
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const forkLogger = logger.child({ module: 'fork-resolution' });

/**
 * Represents a detected fork in the DAG
 */
class Fork {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.channelId = data.channelId;
    this.conflictingEvents = data.conflictingEvents || []; // Array of event IDs
    this.detectedAt = data.detectedAt || Date.now();
    this.resolutionMethod = data.resolutionMethod || null;
    this.resolvedAt = data.resolvedAt || null;
    this.resolvedBy = data.resolvedBy || null;
    this.winningEvent = data.winningEvent || null;
    this.status = data.status || 'detected'; // 'detected', 'resolving', 'resolved'
    this.moderatorInput = data.moderatorInput || null;
    this.communityVotes = data.communityVotes || new Map();
    this.auditTrail = data.auditTrail || [];
  }

  addAuditEntry(action, actor, details) {
    this.auditTrail.push({
      timestamp: Date.now(),
      action,
      actor,
      details
    });
  }
}

/**
 * Fork Detection and Resolution System
 */
export class ForkDetectionSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.detectedForks = new Map(); // forkId -> Fork
    this.conflictingEvents = new Map(); // eventId -> forkId
    this.resolutionTimeout = options.resolutionTimeout || 300000; // 5 minutes
    this.timestampTolerance = options.timestampTolerance || 1000; // 1 second
    this.requireModeratorIntervention = options.requireModeratorIntervention || false;
    this.communityVoteThreshold = options.communityVoteThreshold || 0.6; // 60%
    
    this.startResolutionTimer();
    
    forkLogger.info('Fork Detection System initialized');
  }

  /**
   * Analyze DAG events for potential forks
   */
  analyzeEvents(eventDAG, newEventId) {
    const newEvent = eventDAG.get(newEventId);
    if (!newEvent) return;

    // Look for conflicting events in the same channel
    const channelEvents = this.getChannelEvents(eventDAG, newEvent.channel_id);
    const conflicts = this.detectConflicts(newEvent, channelEvents);

    if (conflicts.length > 0) {
      this.createFork(newEvent.channel_id, [newEventId, ...conflicts]);
    }
  }

  /**
   * Get all events in a specific channel
   */
  getChannelEvents(eventDAG, channelId) {
    const channelEvents = [];
    for (const [eventId, event] of eventDAG) {
      if (event.channel_id === channelId) {
        channelEvents.push({ eventId, event });
      }
    }
    return channelEvents;
  }

  /**
   * Detect conflicts between events
   */
  detectConflicts(newEvent, channelEvents) {
    const conflicts = [];

    for (const { eventId, event } of channelEvents) {
      if (this.areEventsConflicting(newEvent, event)) {
        conflicts.push(eventId);
      }
    }

    return conflicts;
  }

  /**
   * Determine if two events are conflicting
   */
  areEventsConflicting(event1, event2) {
    // Same creator with different content at similar time
    if (event1.creator_id === event2.creator_id && 
        event1.id !== event2.id &&
        Math.abs(event1.timestamp - event2.timestamp) <= this.timestampTolerance) {
      return true;
    }

    // Conflicting vote/decision events
    if (event1.event_type === 'vote' && event2.event_type === 'vote' &&
        event1.payload.target === event2.payload.target &&
        event1.payload.decision !== event2.payload.decision) {
      return true;
    }

    // Conflicting moderation actions
    if (event1.event_type === 'moderation' && event2.event_type === 'moderation' &&
        event1.payload.target === event2.payload.target &&
        event1.payload.action !== event2.payload.action) {
      return true;
    }

    return false;
  }

  /**
   * Create a new fork entry
   */
  createFork(channelId, conflictingEventIds) {
    // Check if fork already exists for these events
    for (const eventId of conflictingEventIds) {
      if (this.conflictingEvents.has(eventId)) {
        return; // Fork already detected
      }
    }

    const fork = new Fork({
      channelId,
      conflictingEvents: conflictingEventIds
    });

    this.detectedForks.set(fork.id, fork);
    
    // Mark events as conflicting
    for (const eventId of conflictingEventIds) {
      this.conflictingEvents.set(eventId, fork.id);
    }

    fork.addAuditEntry('fork_detected', 'system', {
      conflictingEvents: conflictingEventIds,
      channel: channelId
    });

    this.emit('forkDetected', fork);
    
    forkLogger.warn('Fork detected', {
      forkId: fork.id,
      channelId,
      conflictingEvents: conflictingEventIds
    });

    // Start resolution process
    this.initiateForkResolution(fork.id);
  }

  /**
   * Initiate fork resolution process
   */
  async initiateForkResolution(forkId) {
    const fork = this.detectedForks.get(forkId);
    if (!fork || fork.status !== 'detected') return;

    fork.status = 'resolving';
    fork.addAuditEntry('resolution_started', 'system', {});

    // Try automatic resolution first
    const automaticResolution = await this.attemptAutomaticResolution(fork);
    
    if (automaticResolution.resolved) {
      this.resolveFork(forkId, automaticResolution.winningEvent, 'automatic', 'system');
      return;
    }

    // Request human intervention if needed
    if (this.requireModeratorIntervention || automaticResolution.requiresIntervention) {
      this.requestModeratorIntervention(fork);
    } else {
      // Start community vote
      this.initiatePartnerVote(fork);
    }
  }

  /**
   * Attempt automatic resolution based on timestamps and other criteria
   */
  async attemptAutomaticResolution(fork) {
    const events = fork.conflictingEvents.map(eventId => {
      // In real implementation, get from DAG
      return { id: eventId, timestamp: Date.now(), creator_id: 'user' };
    });

    // Sort by timestamp (earliest wins)
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    // Check if there's a clear timestamp winner
    const timeDiff = events[1].timestamp - events[0].timestamp;
    if (timeDiff > this.timestampTolerance) {
      return {
        resolved: true,
        winningEvent: events[0].id,
        method: 'timestamp_priority'
      };
    }

    // Check for identical creators (potential replay attack)
    const uniqueCreators = new Set(events.map(e => e.creator_id));
    if (uniqueCreators.size === 1) {
      return {
        resolved: false,
        requiresIntervention: true,
        reason: 'same_creator_conflict'
      };
    }

    // No clear automatic resolution
    return {
      resolved: false,
      requiresIntervention: false,
      reason: 'ambiguous_conflict'
    };
  }

  /**
   * Request regional moderator intervention
   */
  requestModeratorIntervention(fork) {
    fork.addAuditEntry('moderator_intervention_requested', 'system', {
      reason: 'automatic_resolution_failed'
    });

    this.emit('moderatorInterventionRequired', {
      forkId: fork.id,
      channelId: fork.channelId,
      conflictingEvents: fork.conflictingEvents,
      requestedAt: Date.now()
    });

    forkLogger.info('Moderator intervention requested', {
      forkId: fork.id,
      channelId: fork.channelId
    });

    // Set timeout for moderator response
    setTimeout(() => {
      if (fork.status === 'resolving' && !fork.moderatorInput) {
        forkLogger.warn('Moderator intervention timeout', { forkId: fork.id });
        this.initiatePartnerVote(fork);
      }
    }, this.resolutionTimeout);
  }

  /**
   * Handle moderator input for fork resolution
   */
  handleModeratorInput(forkId, moderatorId, decision, reasoning) {
    const fork = this.detectedForks.get(forkId);
    if (!fork || fork.status !== 'resolving') return false;

    fork.moderatorInput = {
      moderatorId,
      decision, // eventId of chosen winner
      reasoning,
      timestamp: Date.now()
    };

    fork.addAuditEntry('moderator_input_received', moderatorId, {
      decision,
      reasoning
    });

    this.resolveFork(forkId, decision, 'moderator_decision', moderatorId);
    return true;
  }

  /**
   * Initiate community vote for fork resolution
   */
  initiatePartnerVote(fork) {
    fork.addAuditEntry('community_vote_started', 'system', {
      timeout: this.resolutionTimeout
    });

    this.emit('communityVoteRequired', {
      forkId: fork.id,
      channelId: fork.channelId,
      conflictingEvents: fork.conflictingEvents,
      votingDeadline: Date.now() + this.resolutionTimeout
    });

    forkLogger.info('Community vote initiated', {
      forkId: fork.id,
      channelId: fork.channelId
    });

    // Set timeout for vote completion
    setTimeout(() => {
      this.tallyCommunityVotes(fork.id);
    }, this.resolutionTimeout);
  }

  /**
   * Handle community vote submission
   */
  submitCommunityVote(forkId, voterId, chosenEventId, weight = 1) {
    const fork = this.detectedForks.get(forkId);
    if (!fork || fork.status !== 'resolving') return false;

    fork.communityVotes.set(voterId, {
      chosenEvent: chosenEventId,
      weight,
      timestamp: Date.now()
    });

    fork.addAuditEntry('community_vote_received', voterId, {
      chosenEvent: chosenEventId,
      weight
    });

    return true;
  }

  /**
   * Tally community votes and resolve fork
   */
  tallyCommunityVotes(forkId) {
    const fork = this.detectedForks.get(forkId);
    if (!fork || fork.status !== 'resolving') return;

    const voteTally = new Map(); // eventId -> total weight
    let totalVotes = 0;

    for (const [voterId, vote] of fork.communityVotes) {
      const currentTally = voteTally.get(vote.chosenEvent) || 0;
      voteTally.set(vote.chosenEvent, currentTally + vote.weight);
      totalVotes += vote.weight;
    }

    if (totalVotes === 0) {
      // No votes received, fall back to timestamp resolution
      forkLogger.warn('No community votes received, using timestamp fallback', { forkId });
      this.attemptAutomaticResolution(fork).then(result => {
        if (result.resolved) {
          this.resolveFork(forkId, result.winningEvent, 'timestamp_fallback', 'system');
        }
      });
      return;
    }

    // Find winner
    let winningEvent = null;
    let maxVotes = 0;
    
    for (const [eventId, votes] of voteTally) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningEvent = eventId;
      }
    }

    // Check if winner meets threshold
    const winningPercentage = maxVotes / totalVotes;
    if (winningPercentage >= this.communityVoteThreshold) {
      this.resolveFork(forkId, winningEvent, 'community_vote', 'community');
    } else {
      forkLogger.warn('Community vote inconclusive', { 
        forkId, 
        winningPercentage, 
        threshold: this.communityVoteThreshold 
      });
      
      // Request moderator intervention as fallback
      this.requestModeratorIntervention(fork);
    }
  }

  /**
   * Resolve a fork with the chosen winning event
   */
  resolveFork(forkId, winningEventId, resolutionMethod, resolvedBy) {
    const fork = this.detectedForks.get(forkId);
    if (!fork) return false;

    fork.status = 'resolved';
    fork.winningEvent = winningEventId;
    fork.resolutionMethod = resolutionMethod;
    fork.resolvedBy = resolvedBy;
    fork.resolvedAt = Date.now();

    fork.addAuditEntry('fork_resolved', resolvedBy, {
      winningEvent: winningEventId,
      method: resolutionMethod,
      losingEvents: fork.conflictingEvents.filter(id => id !== winningEventId)
    });

    // Mark losing events as revoked
    for (const eventId of fork.conflictingEvents) {
      if (eventId !== winningEventId) {
        this.emit('eventRevoked', {
          eventId,
          reason: 'fork_resolution',
          forkId,
          winningEvent: winningEventId
        });
      }
    }

    // Clear conflict markers
    for (const eventId of fork.conflictingEvents) {
      this.conflictingEvents.delete(eventId);
    }

    this.emit('forkResolved', {
      forkId,
      winningEvent: winningEventId,
      resolutionMethod,
      resolvedBy,
      auditTrail: fork.auditTrail
    });

    forkLogger.info('Fork resolved', {
      forkId,
      winningEvent: winningEventId,
      method: resolutionMethod,
      resolvedBy
    });

    return true;
  }

  /**
   * Get fork information
   */
  getFork(forkId) {
    return this.detectedForks.get(forkId);
  }

  /**
   * Get all active forks
   */
  getActiveForks() {
    return Array.from(this.detectedForks.values()).filter(
      fork => fork.status !== 'resolved'
    );
  }

  /**
   * Check if an event is part of an unresolved fork
   */
  isEventInFork(eventId) {
    return this.conflictingEvents.has(eventId);
  }

  /**
   * Get fork resolution audit trail
   */
  getForkAuditTrail(forkId) {
    const fork = this.detectedForks.get(forkId);
    return fork ? fork.auditTrail : null;
  }

  /**
   * Start resolution timer for timeout handling
   */
  startResolutionTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [forkId, fork] of this.detectedForks) {
        if (fork.status === 'resolving' && 
            now - fork.detectedAt > this.resolutionTimeout * 2) {
          forkLogger.warn('Fork resolution timeout exceeded', { forkId });
          
          // Force resolution using timestamp
          this.attemptAutomaticResolution(fork).then(result => {
            if (result.resolved) {
              this.resolveFork(forkId, result.winningEvent, 'timeout_fallback', 'system');
            }
          });
        }
      }
    }, 60000); // Check every minute
  }
}
