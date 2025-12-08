/**
 * @fileoverview DAG Event Construction - Lightweight DAG for tracking user events and message flow
 * Implements event ancestry tracking, message flow analysis, and spam/Sybil detection
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const dagLogger = logger.child({ module: 'dag-event-construction' });

/**
 * Represents a node in the event DAG
 */
class DAGNode {
  constructor(event) {
    this.event = event;
    this.children = new Set(); // Events that reference this as parent
    this.parents = new Set(); // Parent events (self_parent, other_parent)
    this.depth = 0; // Distance from genesis events
    this.processed = false;
    this.metadata = {
      createdAt: Date.now(),
      propagationCount: 0,
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now()
    };
  }

  addChild(childEvent) {
    this.children.add(childEvent.id);
    this.metadata.propagationCount++;
  }

  addParent(parentEvent) {
    this.parents.add(parentEvent.id);
  }
}

/**
 * Channel-specific DAG for event tracking and analysis
 */
class ChannelEventDAG extends EventEmitter {
  constructor(channelId, channelType = 'proximity') {
    super();
    this.channelId = channelId;
    this.channelType = channelType; // 'proximity', 'regional', 'global'
    this.nodes = new Map(); // eventId -> DAGNode
    this.userTimelines = new Map(); // userId -> Array of eventIds (chronological)
    this.genesisEvents = new Set(); // Events with no parents
    this.eventIndex = new Map(); // Index for fast lookups
    
    // Analysis data
    this.messageFlowPatterns = new Map(); // userId -> flow patterns
    this.suspiciousPatterns = new Set(); // Flagged event patterns
    this.propagationMetrics = new Map(); // eventId -> propagation stats
    
    // Configuration
    this.maxDepth = 1000; // Maximum DAG depth
    this.analysisWindow = 24 * 60 * 60 * 1000; // 24 hours for analysis
    this.suspicionThresholds = {
      maxEventsPerMinute: 10,
      maxSimilarPayloads: 5,
      maxRepeatedPatterns: 3
    };

    this.startAnalysisTimer();
    
    dagLogger.info('Channel Event DAG initialized', {
      channelId: this.channelId,
      channelType: this.channelType
    });
  }

  /**
   * Add an event to the DAG
   * @param {GossipEvent} event - Event to add
   */
  addEvent(event) {
    if (this.nodes.has(event.id)) {
      // Update existing node metadata
      const node = this.nodes.get(event.id);
      node.metadata.lastSeenAt = Date.now();
      node.metadata.propagationCount++;
      return node;
    }

    const node = new DAGNode(event);
    this.nodes.set(event.id, node);

    // Build parent-child relationships
    this.linkEventToParents(node);

    // Update user timeline
    this.updateUserTimeline(event.creator_id, event.id);

    // Index event for analysis
    this.indexEvent(event);

    // Calculate node depth
    this.calculateNodeDepth(node);

    // Check for genesis event
    if (node.parents.size === 0) {
      this.genesisEvents.add(event.id);
    }

    dagLogger.debug('Added event to DAG', {
      eventId: event.id,
      creator: event.creator_id,
      eventType: event.event_type,
      parents: Array.from(node.parents),
      depth: node.depth
    });

    this.emit('eventAdded', event, node);
    return node;
  }

  /**
   * Link event to its parent events
   * @param {DAGNode} node - Node to link
   */
  linkEventToParents(node) {
    const event = node.event;

    // Link to self parent
    if (event.self_parent_id) {
      const selfParent = this.nodes.get(event.self_parent_id);
      if (selfParent) {
        node.addParent(selfParent.event);
        selfParent.addChild(event);
      }
    }

    // Link to other parent
    if (event.other_parent_id) {
      const otherParent = this.nodes.get(event.other_parent_id);
      if (otherParent) {
        node.addParent(otherParent.event);
        otherParent.addChild(event);
      }
    }
  }

  /**
   * Update user's chronological timeline
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   */
  updateUserTimeline(userId, eventId) {
    if (!this.userTimelines.has(userId)) {
      this.userTimelines.set(userId, []);
    }

    const timeline = this.userTimelines.get(userId);
    timeline.push(eventId);

    // Keep timeline sorted by timestamp
    timeline.sort((a, b) => {
      const eventA = this.nodes.get(a)?.event;
      const eventB = this.nodes.get(b)?.event;
      return (eventA?.timestamp || 0) - (eventB?.timestamp || 0);
    });
  }

  /**
   * Index event for fast analysis lookups
   * @param {GossipEvent} event - Event to index
   */
  indexEvent(event) {
    // Index by event type
    const typeKey = `type:${event.event_type}`;
    if (!this.eventIndex.has(typeKey)) {
      this.eventIndex.set(typeKey, new Set());
    }
    this.eventIndex.get(typeKey).add(event.id);

    // Index by creator
    const creatorKey = `creator:${event.creator_id}`;
    if (!this.eventIndex.has(creatorKey)) {
      this.eventIndex.set(creatorKey, new Set());
    }
    this.eventIndex.get(creatorKey).add(event.id);

    // Index by timestamp range (hourly buckets)
    const hour = Math.floor(event.timestamp / (60 * 60 * 1000));
    const timeKey = `hour:${hour}`;
    if (!this.eventIndex.has(timeKey)) {
      this.eventIndex.set(timeKey, new Set());
    }
    this.eventIndex.get(timeKey).add(event.id);
  }

  /**
   * Calculate and set node depth from genesis events
   * @param {DAGNode} node - Node to calculate depth for
   */
  calculateNodeDepth(node) {
    if (node.parents.size === 0) {
      node.depth = 0;
      return;
    }

    let maxParentDepth = -1;
    for (const parentId of node.parents) {
      const parentNode = this.nodes.get(parentId);
      if (parentNode) {
        maxParentDepth = Math.max(maxParentDepth, parentNode.depth);
      }
    }

    node.depth = maxParentDepth + 1;
  }

  /**
   * Get events by user ID
   * @param {string} userId - User ID
   * @returns {Array<GossipEvent>} User's events in chronological order
   */
  getUserEvents(userId) {
    const timeline = this.userTimelines.get(userId) || [];
    return timeline.map(eventId => this.nodes.get(eventId)?.event).filter(Boolean);
  }

  /**
   * Get events by type
   * @param {string} eventType - Event type to filter by
   * @returns {Array<GossipEvent>} Events of the specified type
   */
  getEventsByType(eventType) {
    const eventIds = this.eventIndex.get(`type:${eventType}`) || new Set();
    return Array.from(eventIds).map(eventId => this.nodes.get(eventId)?.event).filter(Boolean);
  }

  /**
   * Get events in time range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array<GossipEvent>} Events in time range
   */
  getEventsInTimeRange(startTime, endTime) {
    const events = [];
    const startHour = Math.floor(startTime / (60 * 60 * 1000));
    const endHour = Math.floor(endTime / (60 * 60 * 1000));

    for (let hour = startHour; hour <= endHour; hour++) {
      const eventIds = this.eventIndex.get(`hour:${hour}`) || new Set();
      for (const eventId of eventIds) {
        const event = this.nodes.get(eventId)?.event;
        if (event && event.timestamp >= startTime && event.timestamp <= endTime) {
          events.push(event);
        }
      }
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Trace message flow between users
   * @param {string} startEventId - Starting event ID
   * @param {number} maxDepth - Maximum depth to trace
   * @returns {Object} Message flow trace
   */
  traceMessageFlow(startEventId, maxDepth = 10) {
    const trace = {
      startEvent: startEventId,
      flow: [],
      users: new Set(),
      totalHops: 0
    };

    const visited = new Set();
    const queue = [{ eventId: startEventId, depth: 0 }];

    while (queue.length > 0) {
      const { eventId, depth } = queue.shift();
      
      if (visited.has(eventId) || depth >= maxDepth) continue;
      visited.add(eventId);

      const node = this.nodes.get(eventId);
      if (!node) continue;

      const event = node.event;
      trace.flow.push({
        eventId: event.id,
        creator: event.creator_id,
        timestamp: event.timestamp,
        eventType: event.event_type,
        depth: depth,
        parents: Array.from(node.parents),
        children: Array.from(node.children)
      });

      trace.users.add(event.creator_id);
      trace.totalHops = Math.max(trace.totalHops, depth);

      // Add children to queue
      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push({ eventId: childId, depth: depth + 1 });
        }
      }
    }

    trace.users = Array.from(trace.users);
    return trace;
  }

  /**
   * Detect suspicious patterns in user behavior
   * @param {string} userId - User ID to analyze
   * @returns {Object} Suspicious pattern analysis
   */
  detectSuspiciousPatterns(userId) {
    const userEvents = this.getUserEvents(userId);
    const analysis = {
      userId: userId,
      suspicious: false,
      patterns: [],
      metrics: {
        eventCount: userEvents.length,
        timeSpan: 0,
        eventsPerMinute: 0
      }
    };

    if (userEvents.length === 0) return analysis;

    // Calculate time metrics
    const firstEvent = userEvents[0];
    const lastEvent = userEvents[userEvents.length - 1];
    analysis.metrics.timeSpan = lastEvent.timestamp - firstEvent.timestamp;
    analysis.metrics.eventsPerMinute = (userEvents.length / (analysis.metrics.timeSpan / 60000)) || 0;

    // Check for high frequency posting
    if (analysis.metrics.eventsPerMinute > this.suspicionThresholds.maxEventsPerMinute) {
      analysis.suspicious = true;
      analysis.patterns.push({
        type: 'high_frequency',
        severity: 'high',
        details: `${analysis.metrics.eventsPerMinute.toFixed(2)} events per minute`
      });
    }

    // Check for repeated payload patterns
    const payloadHashes = new Map();
    for (const event of userEvents) {
      const payloadHash = crypto.createHash('md5').update(JSON.stringify(event.payload)).digest('hex');
      payloadHashes.set(payloadHash, (payloadHashes.get(payloadHash) || 0) + 1);
    }

    for (const [hash, count] of payloadHashes) {
      if (count > this.suspicionThresholds.maxSimilarPayloads) {
        analysis.suspicious = true;
        analysis.patterns.push({
          type: 'repeated_payloads',
          severity: 'medium',
          details: `${count} events with identical payload`
        });
      }
    }

    // Check for unusual timing patterns
    const timingGaps = [];
    for (let i = 1; i < userEvents.length; i++) {
      const gap = userEvents[i].timestamp - userEvents[i - 1].timestamp;
      timingGaps.push(gap);
    }

    if (timingGaps.length > 5) {
      const avgGap = timingGaps.reduce((a, b) => a + b, 0) / timingGaps.length;
      const uniformGaps = timingGaps.filter(gap => Math.abs(gap - avgGap) < 1000).length;
      
      if (uniformGaps / timingGaps.length > 0.8) {
        analysis.suspicious = true;
        analysis.patterns.push({
          type: 'uniform_timing',
          severity: 'medium',
          details: `${((uniformGaps / timingGaps.length) * 100).toFixed(1)}% uniform timing`
        });
      }
    }

    return analysis;
  }

  /**
   * Detect delayed message replays
   * @param {number} lookbackHours - Hours to look back for comparison
   * @returns {Array} Detected replay events
   */
  detectDelayedReplays(lookbackHours = 24) {
    const now = Date.now();
    const lookbackTime = now - (lookbackHours * 60 * 60 * 1000);
    const recentEvents = this.getEventsInTimeRange(lookbackTime, now);
    
    const replays = [];
    const payloadMap = new Map(); // payloadHash -> first occurrence

    for (const event of recentEvents) {
      const payloadHash = crypto.createHash('md5').update(JSON.stringify(event.payload)).digest('hex');
      
      if (payloadMap.has(payloadHash)) {
        const firstOccurrence = payloadMap.get(payloadHash);
        const timeDiff = event.timestamp - firstOccurrence.timestamp;
        
        // Consider it a replay if same payload appears from different user or after significant delay
        if (event.creator_id !== firstOccurrence.creator_id || timeDiff > 60000) {
          replays.push({
            replayEvent: event,
            originalEvent: firstOccurrence,
            timeDiff: timeDiff,
            suspicionLevel: event.creator_id !== firstOccurrence.creator_id ? 'high' : 'medium'
          });
        }
      } else {
        payloadMap.set(payloadHash, event);
      }
    }

    return replays;
  }

  /**
   * Start periodic analysis timer
   */
  startAnalysisTimer() {
    this.analysisTimer = setInterval(() => {
      this.performPeriodicAnalysis();
    }, 10 * 60 * 1000); // Run every 10 minutes
  }

  /**
   * Perform periodic analysis of patterns and cleanup
   */
  performPeriodicAnalysis() {
    dagLogger.debug('Starting periodic DAG analysis', { 
      channelId: this.channelId,
      nodeCount: this.nodes.size 
    });

    // Analyze recent user patterns
    const recentUsers = new Set();
    const recentEvents = this.getEventsInTimeRange(Date.now() - this.analysisWindow, Date.now());
    recentEvents.forEach(event => recentUsers.add(event.creator_id));

    for (const userId of recentUsers) {
      const analysis = this.detectSuspiciousPatterns(userId);
      if (analysis.suspicious) {
        this.suspiciousPatterns.add(userId);
        this.emit('suspiciousPattern', analysis);
      }
    }

    // Detect delayed replays
    const replays = this.detectDelayedReplays();
    if (replays.length > 0) {
      this.emit('delayedReplays', replays);
    }

    // Cleanup old events if DAG is too large
    this.pruneOldEvents();
  }

  /**
   * Prune old events to maintain performance
   */
  pruneOldEvents() {
    if (this.nodes.size <= this.maxDepth) return;

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Keep 7 days
    const eventsToRemove = [];

    for (const [eventId, node] of this.nodes) {
      if (node.event.timestamp < cutoffTime) {
        eventsToRemove.push(eventId);
      }
    }

    for (const eventId of eventsToRemove) {
      this.removeEvent(eventId);
    }

    if (eventsToRemove.length > 0) {
      dagLogger.info('Pruned old events from DAG', {
        channelId: this.channelId,
        removedCount: eventsToRemove.length,
        remainingCount: this.nodes.size
      });
    }
  }

  /**
   * Remove an event from the DAG
   * @param {string} eventId - Event ID to remove
   */
  removeEvent(eventId) {
    const node = this.nodes.get(eventId);
    if (!node) return;

    // Remove from user timeline
    const timeline = this.userTimelines.get(node.event.creator_id);
    if (timeline) {
      const index = timeline.indexOf(eventId);
      if (index > -1) {
        timeline.splice(index, 1);
      }
    }

    // Remove from indices
    for (const [key, eventSet] of this.eventIndex) {
      eventSet.delete(eventId);
    }

    // Remove from genesis events
    this.genesisEvents.delete(eventId);

    // Update parent-child relationships
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        childNode.parents.delete(eventId);
      }
    }

    for (const parentId of node.parents) {
      const parentNode = this.nodes.get(parentId);
      if (parentNode) {
        parentNode.children.delete(eventId);
      }
    }

    // Remove the node
    this.nodes.delete(eventId);
  }

  /**
   * Export DAG for visualization or analysis
   * @param {string} format - Export format ('json', 'graphviz')
   * @returns {string} Exported DAG
   */
  exportDAG(format = 'json') {
    if (format === 'graphviz') {
      return this.exportGraphviz();
    }

    return JSON.stringify({
      channelId: this.channelId,
      channelType: this.channelType,
      nodeCount: this.nodes.size,
      userCount: this.userTimelines.size,
      genesisEvents: Array.from(this.genesisEvents),
      nodes: Array.from(this.nodes.values()).map(node => ({
        eventId: node.event.id,
        creator: node.event.creator_id,
        eventType: node.event.event_type,
        timestamp: node.event.timestamp,
        parents: Array.from(node.parents),
        children: Array.from(node.children),
        depth: node.depth,
        metadata: node.metadata
      })),
      suspiciousPatterns: Array.from(this.suspiciousPatterns),
      exportedAt: Date.now()
    }, null, 2);
  }

  /**
   * Export DAG in Graphviz DOT format
   * @returns {string} Graphviz DOT representation
   */
  exportGraphviz() {
    let dot = `digraph "${this.channelId}" {\n`;
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    for (const [eventId, node] of this.nodes) {
      const event = node.event;
      const label = `${event.creator_id}\\n${event.event_type}\\n${new Date(event.timestamp).toISOString().substr(11, 8)}`;
      const color = this.suspiciousPatterns.has(event.creator_id) ? 'red' : 'lightblue';
      dot += `  "${eventId}" [label="${label}", fillcolor=${color}, style=filled];\n`;
    }

    dot += '\n';

    // Add edges
    for (const [eventId, node] of this.nodes) {
      for (const parentId of node.parents) {
        dot += `  "${parentId}" -> "${eventId}";\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Get DAG statistics
   * @returns {Object} DAG statistics
   */
  getStatistics() {
    const stats = {
      channelId: this.channelId,
      channelType: this.channelType,
      totalEvents: this.nodes.size,
      totalUsers: this.userTimelines.size,
      genesisEventCount: this.genesisEvents.size,
      suspiciousUserCount: this.suspiciousPatterns.size,
      maxDepth: 0,
      eventTypes: new Map(),
      averageChildren: 0,
      timespan: { start: null, end: null }
    };

    let totalChildren = 0;
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const node of this.nodes.values()) {
      stats.maxDepth = Math.max(stats.maxDepth, node.depth);
      totalChildren += node.children.size;
      
      // Count event types
      const eventType = node.event.event_type;
      stats.eventTypes.set(eventType, (stats.eventTypes.get(eventType) || 0) + 1);
      
      // Track timespan
      minTime = Math.min(minTime, node.event.timestamp);
      maxTime = Math.max(maxTime, node.event.timestamp);
    }

    stats.averageChildren = this.nodes.size > 0 ? totalChildren / this.nodes.size : 0;
    stats.timespan.start = minTime !== Infinity ? minTime : null;
    stats.timespan.end = maxTime !== -Infinity ? maxTime : null;
    stats.eventTypes = Object.fromEntries(stats.eventTypes);

    return stats;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.nodes.clear();
    this.userTimelines.clear();
    this.genesisEvents.clear();
    this.eventIndex.clear();
    this.messageFlowPatterns.clear();
    this.suspiciousPatterns.clear();
    this.propagationMetrics.clear();
    this.removeAllListeners();

    dagLogger.info('Channel Event DAG destroyed', { channelId: this.channelId });
  }
}

export { DAGNode, ChannelEventDAG };
