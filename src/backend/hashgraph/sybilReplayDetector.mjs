/**
 * @fileoverview Sybil & Replay Detection - DAG-based pattern analysis for attack detection
 * Uses Hashgraph-inspired event analysis to detect Sybil attacks and replay attacks
 */

import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const detectorLogger = logger.child({ module: 'sybil-replay-detector' });

/**
 * Represents a detection pattern or alert
 */
class DetectionAlert {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.alert_type = data.alert_type; // 'sybil_cluster', 'replay_attack', 'coordination_pattern', 'timing_anomaly'
    this.severity = data.severity; // 'low', 'medium', 'high', 'critical'
    this.detected_at = data.detected_at || Date.now();
    this.confidence = data.confidence; // 0.0 - 1.0
    
    // Involved entities
    this.suspicious_users = new Set(data.suspicious_users || []);
    this.suspicious_events = new Set(data.suspicious_events || []);
    this.suspicious_patterns = data.suspicious_patterns || [];
    
    // Context
    this.channel_id = data.channel_id;
    this.proximity_region = data.proximity_region;
    this.evidence = data.evidence || {};
    this.metadata = data.metadata || {};
    
    // Investigation status
    this.status = data.status || 'pending'; // 'pending', 'investigating', 'confirmed', 'false_positive', 'resolved'
    this.investigated_by = data.investigated_by || null;
    this.investigation_notes = data.investigation_notes || [];
  }

  /**
   * Add investigation note
   */
  addInvestigationNote(investigatorId, note) {
    this.investigation_notes.push({
      investigator: investigatorId,
      note: note,
      timestamp: Date.now()
    });
  }

  /**
   * Update investigation status
   */
  updateStatus(status, investigatorId, reason) {
    this.status = status;
    this.investigated_by = investigatorId;
    this.addInvestigationNote(investigatorId, `Status changed to ${status}: ${reason}`);
  }
}

/**
 * Sybil & Replay Detector - Analyzes DAG patterns for attack detection
 */
class SybilReplayDetector extends EventEmitter {
  constructor() {
    super();
    this.detectionAlerts = new Map(); // alertId -> DetectionAlert
    this.userProfiles = new Map(); // userId -> behavior profile
    this.eventPatterns = new Map(); // pattern hash -> pattern info
    this.suspiciousClusters = new Map(); // clusterId -> user set
    this.recentEvents = new Map(); // eventId -> event data (rolling window)
    
    // Detection thresholds and configuration
    this.config = {
      // Sybil detection
      maxSimilarityThreshold: 0.85, // Behavioral similarity threshold
      minClusterSize: 3, // Minimum users in a suspicious cluster
      coordinationTimeWindow: 5000, // 5 seconds for coordination detection
      
      // Replay detection
      replayTimeWindow: 60000, // 1 minute window for replay detection
      maxEventRetention: 100000, // Maximum events to keep in memory
      
      // Pattern analysis
      minPatternOccurrences: 5, // Minimum occurrences to flag a pattern
      behaviorAnalysisWindow: 24 * 60 * 60 * 1000, // 24 hours
      
      // Alert thresholds
      highConfidenceThreshold: 0.8,
      mediumConfidenceThreshold: 0.6
    };
    
    this.startAnalysisTimer();
    
    detectorLogger.info('Sybil & Replay Detector initialized');
  }

  /**
   * Analyze a new event for potential attacks
   */
  analyzeEvent(event) {
    // Store event in recent events (for replay detection)
    this.recentEvents.set(event.id, {
      ...event,
      analyzed_at: Date.now()
    });

    // Update user behavior profile
    this.updateUserProfile(event.creator_id, event);

    // Check for various attack patterns
    this.checkReplayAttack(event);
    this.checkCoordinationPatterns(event);
    this.checkTimingAnomalies(event);
    
    // Analyze user behavior similarity (for Sybil detection)
    this.analyzeBehaviorSimilarity(event.creator_id);

    detectorLogger.debug('Analyzed event for attacks', {
      eventId: event.id,
      creator: event.creator_id,
      type: event.event_type
    });
  }

  /**
   * Update user behavior profile based on their actions
   */
  updateUserProfile(userId, event) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        user_id: userId,
        first_seen: Date.now(),
        event_count: 0,
        event_types: new Map(),
        timing_patterns: [],
        voting_patterns: new Map(),
        content_patterns: new Map(),
        proximity_regions: new Set(),
        interaction_graph: new Set(), // Users interacted with
        behavioral_fingerprint: {}
      });
    }

    const profile = this.userProfiles.get(userId);
    profile.event_count++;
    profile.last_seen = Date.now();

    // Track event types
    const eventType = event.event_type;
    profile.event_types.set(eventType, (profile.event_types.get(eventType) || 0) + 1);

    // Track timing patterns
    profile.timing_patterns.push(event.timestamp);
    if (profile.timing_patterns.length > 100) {
      profile.timing_patterns.shift(); // Keep only recent 100 events
    }

    // Track proximity regions
    if (event.proximity_region) {
      profile.proximity_regions.add(event.proximity_region);
    }

    // Track voting patterns (if it's a vote event)
    if (event.event_type === 'vote' && event.payload) {
      const voteOption = event.payload.option;
      profile.voting_patterns.set(voteOption, (profile.voting_patterns.get(voteOption) || 0) + 1);
    }

    // Track interaction patterns
    if (event.other_parent_id) {
      const otherEvent = this.recentEvents.get(event.other_parent_id);
      if (otherEvent && otherEvent.creator_id !== userId) {
        profile.interaction_graph.add(otherEvent.creator_id);
      }
    }

    // Update behavioral fingerprint
    this.updateBehavioralFingerprint(profile);
  }

  /**
   * Create behavioral fingerprint for similarity analysis
   */
  updateBehavioralFingerprint(profile) {
    const fingerprint = {
      event_frequency: this.calculateEventFrequency(profile.timing_patterns),
      event_type_distribution: this.normalizeDistribution(profile.event_types),
      voting_distribution: this.normalizeDistribution(profile.voting_patterns),
      activity_hours: this.calculateActivityHours(profile.timing_patterns),
      interaction_diversity: profile.interaction_graph.size,
      region_diversity: profile.proximity_regions.size
    };

    profile.behavioral_fingerprint = fingerprint;
  }

  /**
   * Calculate event frequency patterns
   */
  calculateEventFrequency(timingPatterns) {
    if (timingPatterns.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < timingPatterns.length; i++) {
      intervals.push(timingPatterns[i] - timingPatterns[i-1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return { avgInterval, variance };
  }

  /**
   * Normalize distribution for comparison
   */
  normalizeDistribution(distribution) {
    const total = Array.from(distribution.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return new Map();

    const normalized = new Map();
    for (const [key, value] of distribution.entries()) {
      normalized.set(key, value / total);
    }
    return normalized;
  }

  /**
   * Calculate active hours distribution
   */
  calculateActivityHours(timingPatterns) {
    const hourCounts = new Array(24).fill(0);
    
    for (const timestamp of timingPatterns) {
      const hour = new Date(timestamp).getHours();
      hourCounts[hour]++;
    }

    return hourCounts.map(count => count / timingPatterns.length);
  }

  /**
   * Check for replay attacks (duplicate or near-duplicate events)
   */
  checkReplayAttack(event) {
    const cutoffTime = Date.now() - this.config.replayTimeWindow;
    const suspiciousEvents = [];

    // Check for similar recent events
    for (const [existingId, existingEvent] of this.recentEvents.entries()) {
      if (existingEvent.timestamp < cutoffTime) continue;
      if (existingEvent.id === event.id) continue;

      // Check for potential replay
      const similarity = this.calculateEventSimilarity(event, existingEvent);
      if (similarity > 0.9) { // Very high similarity indicates potential replay
        suspiciousEvents.push({
          eventId: existingId,
          similarity: similarity
        });
      }
    }

    if (suspiciousEvents.length > 0) {
      this.createAlert('replay_attack', 'high', {
        suspicious_users: [event.creator_id],
        suspicious_events: [event.id, ...suspiciousEvents.map(e => e.eventId)],
        evidence: {
          original_event: event.id,
          similar_events: suspiciousEvents,
          time_window: this.config.replayTimeWindow
        },
        channel_id: event.channel_id,
        proximity_region: event.proximity_region
      });

      detectorLogger.warn('Potential replay attack detected', {
        eventId: event.id,
        creator: event.creator_id,
        similarEvents: suspiciousEvents.length
      });
    }
  }

  /**
   * Calculate similarity between two events
   */
  calculateEventSimilarity(event1, event2) {
    let similarity = 0;
    let factors = 0;

    // Compare event type
    if (event1.event_type === event2.event_type) {
      similarity += 0.3;
    }
    factors++;

    // Compare payload similarity
    if (event1.payload && event2.payload) {
      const payloadSimilarity = this.calculatePayloadSimilarity(event1.payload, event2.payload);
      similarity += payloadSimilarity * 0.4;
    }
    factors++;

    // Compare proximity region
    if (event1.proximity_region === event2.proximity_region) {
      similarity += 0.2;
    }
    factors++;

    // Compare timing (closer = more suspicious)
    const timeDiff = Math.abs(event1.timestamp - event2.timestamp);
    const timeSimilarity = Math.max(0, 1 - (timeDiff / this.config.replayTimeWindow));
    similarity += timeSimilarity * 0.1;
    factors++;

    return similarity / factors;
  }

  /**
   * Calculate payload similarity
   */
  calculatePayloadSimilarity(payload1, payload2) {
    const keys1 = Object.keys(payload1);
    const keys2 = Object.keys(payload2);
    const allKeys = new Set([...keys1, ...keys2]);

    let matchingKeys = 0;
    for (const key of allKeys) {
      if (payload1[key] === payload2[key]) {
        matchingKeys++;
      }
    }

    return matchingKeys / allKeys.size;
  }

  /**
   * Check for coordination patterns (synchronized behavior)
   */
  checkCoordinationPatterns(event) {
    const timeWindow = this.config.coordinationTimeWindow;
    const recentEvents = Array.from(this.recentEvents.values())
      .filter(e => Math.abs(e.timestamp - event.timestamp) <= timeWindow && e.id !== event.id);

    if (recentEvents.length < 2) return;

    // Group by event similarity
    const coordinatedGroups = new Map();
    for (const recentEvent of recentEvents) {
      const similarity = this.calculateEventSimilarity(event, recentEvent);
      if (similarity > 0.7) { // High similarity threshold for coordination
        const key = this.getCoordinationKey(event, recentEvent);
        if (!coordinatedGroups.has(key)) {
          coordinatedGroups.set(key, []);
        }
        coordinatedGroups.get(key).push(recentEvent);
      }
    }

    // Check for suspicious coordination
    for (const [key, coordinatedEvents] of coordinatedGroups.entries()) {
      if (coordinatedEvents.length >= 2) { // 3+ similar events in short time
        const suspiciousUsers = [event.creator_id, ...coordinatedEvents.map(e => e.creator_id)];
        const uniqueUsers = new Set(suspiciousUsers);

        if (uniqueUsers.size === suspiciousUsers.length) { // All different users
          this.createAlert('coordination_pattern', 'medium', {
            suspicious_users: Array.from(uniqueUsers),
            suspicious_events: [event.id, ...coordinatedEvents.map(e => e.id)],
            evidence: {
              coordination_window: timeWindow,
              pattern_key: key,
              event_count: coordinatedEvents.length + 1
            },
            channel_id: event.channel_id,
            proximity_region: event.proximity_region
          });

          detectorLogger.warn('Coordination pattern detected', {
            users: uniqueUsers.size,
            events: coordinatedEvents.length + 1,
            pattern: key
          });
        }
      }
    }
  }

  /**
   * Generate coordination key for pattern matching
   */
  getCoordinationKey(event1, event2) {
    return `${event1.event_type}_${event1.channel_id}_${JSON.stringify(event1.payload)}`;
  }

  /**
   * Check for timing anomalies
   */
  checkTimingAnomalies(event) {
    const profile = this.userProfiles.get(event.creator_id);
    if (!profile || profile.timing_patterns.length < 10) return;

    const frequency = profile.behavioral_fingerprint.event_frequency;
    if (!frequency) return;

    // Check if this event deviates significantly from normal timing
    const lastEventTime = profile.timing_patterns[profile.timing_patterns.length - 2];
    const currentInterval = event.timestamp - lastEventTime;
    
    const expectedInterval = frequency.avgInterval;
    const variance = frequency.variance;
    
    // Check for unusually fast succession (potential automation)
    if (currentInterval < expectedInterval - (2 * Math.sqrt(variance))) {
      this.createAlert('timing_anomaly', 'low', {
        suspicious_users: [event.creator_id],
        suspicious_events: [event.id],
        evidence: {
          current_interval: currentInterval,
          expected_interval: expectedInterval,
          variance: variance,
          anomaly_type: 'unusually_fast'
        },
        channel_id: event.channel_id,
        proximity_region: event.proximity_region
      });
    }
  }

  /**
   * Analyze behavioral similarity for Sybil detection
   */
  analyzeBehaviorSimilarity(userId) {
    const targetProfile = this.userProfiles.get(userId);
    if (!targetProfile || !targetProfile.behavioral_fingerprint) return;

    const similarUsers = [];

    // Compare with all other users
    for (const [otherUserId, otherProfile] of this.userProfiles.entries()) {
      if (otherUserId === userId || !otherProfile.behavioral_fingerprint) continue;

      const similarity = this.calculateBehavioralSimilarity(
        targetProfile.behavioral_fingerprint,
        otherProfile.behavioral_fingerprint
      );

      if (similarity > this.config.maxSimilarityThreshold) {
        similarUsers.push({
          userId: otherUserId,
          similarity: similarity
        });
      }
    }

    // Create Sybil cluster alert if enough similar users found
    if (similarUsers.length >= this.config.minClusterSize - 1) {
      const clusterUsers = [userId, ...similarUsers.map(u => u.userId)];
      
      this.createAlert('sybil_cluster', 'high', {
        suspicious_users: clusterUsers,
        evidence: {
          cluster_size: clusterUsers.length,
          similarity_scores: similarUsers,
          detection_method: 'behavioral_fingerprinting'
        }
      });

      detectorLogger.warn('Potential Sybil cluster detected', {
        clusterSize: clusterUsers.length,
        primaryUser: userId,
        avgSimilarity: similarUsers.reduce((sum, u) => sum + u.similarity, 0) / similarUsers.length
      });
    }
  }

  /**
   * Calculate behavioral similarity between two fingerprints
   */
  calculateBehavioralSimilarity(fingerprint1, fingerprint2) {
    let totalSimilarity = 0;
    let factors = 0;

    // Compare event type distributions
    const typesSimilarity = this.compareDistributions(
      fingerprint1.event_type_distribution,
      fingerprint2.event_type_distribution
    );
    totalSimilarity += typesSimilarity * 0.3;
    factors++;

    // Compare voting distributions
    const votingSimilarity = this.compareDistributions(
      fingerprint1.voting_distribution,
      fingerprint2.voting_distribution
    );
    totalSimilarity += votingSimilarity * 0.25;
    factors++;

    // Compare activity hours
    const hoursSimilarity = this.compareArrays(
      fingerprint1.activity_hours,
      fingerprint2.activity_hours
    );
    totalSimilarity += hoursSimilarity * 0.2;
    factors++;

    // Compare event frequency patterns
    if (fingerprint1.event_frequency && fingerprint2.event_frequency) {
      const freqSimilarity = this.compareFrequencyPatterns(
        fingerprint1.event_frequency,
        fingerprint2.event_frequency
      );
      totalSimilarity += freqSimilarity * 0.15;
      factors++;
    }

    // Compare diversity metrics
    const diversitySimilarity = this.compareDiversityMetrics(fingerprint1, fingerprint2);
    totalSimilarity += diversitySimilarity * 0.1;
    factors++;

    return factors > 0 ? totalSimilarity / factors : 0;
  }

  /**
   * Compare two distributions (Maps)
   */
  compareDistributions(dist1, dist2) {
    if (!dist1 || !dist2) return 0;

    const allKeys = new Set([...dist1.keys(), ...dist2.keys()]);
    let similarity = 0;

    for (const key of allKeys) {
      const val1 = dist1.get(key) || 0;
      const val2 = dist2.get(key) || 0;
      similarity += 1 - Math.abs(val1 - val2);
    }

    return similarity / allKeys.size;
  }

  /**
   * Compare two arrays (activity hours)
   */
  compareArrays(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return 0;

    let similarity = 0;
    for (let i = 0; i < arr1.length; i++) {
      similarity += 1 - Math.abs(arr1[i] - arr2[i]);
    }

    return similarity / arr1.length;
  }

  /**
   * Compare frequency patterns
   */
  compareFrequencyPatterns(freq1, freq2) {
    const intervalSim = 1 - Math.abs(freq1.avgInterval - freq2.avgInterval) / Math.max(freq1.avgInterval, freq2.avgInterval);
    const varianceSim = 1 - Math.abs(freq1.variance - freq2.variance) / Math.max(freq1.variance, freq2.variance);
    return (intervalSim + varianceSim) / 2;
  }

  /**
   * Compare diversity metrics
   */
  compareDiversityMetrics(fp1, fp2) {
    const interactionSim = 1 - Math.abs(fp1.interaction_diversity - fp2.interaction_diversity) / 
                          Math.max(fp1.interaction_diversity, fp2.interaction_diversity, 1);
    const regionSim = 1 - Math.abs(fp1.region_diversity - fp2.region_diversity) / 
                     Math.max(fp1.region_diversity, fp2.region_diversity, 1);
    return (interactionSim + regionSim) / 2;
  }

  /**
   * Create a detection alert
   */
  createAlert(alertType, severity, alertData) {
    const confidence = this.calculateConfidence(alertType, alertData);
    
    const alert = new DetectionAlert({
      alert_type: alertType,
      severity: severity,
      confidence: confidence,
      ...alertData
    });

    this.detectionAlerts.set(alert.id, alert);

    detectorLogger.info('Detection alert created', {
      alertId: alert.id,
      type: alertType,
      severity: severity,
      confidence: confidence
    });

    this.emit('alertCreated', alert);
    return alert;
  }

  /**
   * Calculate confidence score for an alert
   */
  calculateConfidence(alertType, alertData) {
    switch (alertType) {
      case 'replay_attack':
        const avgSimilarity = alertData.evidence.similar_events.reduce((sum, e) => sum + e.similarity, 0) / 
                             alertData.evidence.similar_events.length;
        return Math.min(avgSimilarity, 1.0);

      case 'sybil_cluster':
        const avgClusterSimilarity = alertData.evidence.similarity_scores.reduce((sum, u) => sum + u.similarity, 0) / 
                                    alertData.evidence.similarity_scores.length;
        return Math.min(avgClusterSimilarity, 1.0);

      case 'coordination_pattern':
        return Math.min(0.5 + (alertData.evidence.event_count / 10), 1.0);

      case 'timing_anomaly':
        return 0.3; // Low confidence for timing anomalies alone

      default:
        return 0.5;
    }
  }

  /**
   * Get alerts by various criteria
   */
  getAlerts(filters = {}) {
    let alerts = Array.from(this.detectionAlerts.values());

    if (filters.alertType) {
      alerts = alerts.filter(alert => alert.alert_type === filters.alertType);
    }

    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }

    if (filters.status) {
      alerts = alerts.filter(alert => alert.status === filters.status);
    }

    if (filters.userId) {
      alerts = alerts.filter(alert => alert.suspicious_users.has(filters.userId));
    }

    if (filters.channelId) {
      alerts = alerts.filter(alert => alert.channel_id === filters.channelId);
    }

    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      alerts = alerts.filter(alert => 
        alert.detected_at >= start && alert.detected_at <= end
      );
    }

    return alerts.sort((a, b) => b.detected_at - a.detected_at);
  }

  /**
   * Get user behavior analysis
   */
  getUserAnalysis(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return { exists: false };
    }

    const alerts = this.getAlerts({ userId });
    const riskScore = this.calculateUserRiskScore(userId);

    return {
      exists: true,
      profile: profile,
      riskScore: riskScore,
      alerts: alerts.length,
      recentAlerts: alerts.filter(a => Date.now() - a.detected_at < 24 * 60 * 60 * 1000).length
    };
  }

  /**
   * Calculate risk score for a user
   */
  calculateUserRiskScore(userId) {
    const alerts = this.getAlerts({ userId });
    let riskScore = 0;

    for (const alert of alerts) {
      const ageWeight = Math.max(0.1, 1 - (Date.now() - alert.detected_at) / (7 * 24 * 60 * 60 * 1000)); // Decay over week
      const severityWeight = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 }[alert.severity] || 0.5;
      const confidenceWeight = alert.confidence;

      riskScore += ageWeight * severityWeight * confidenceWeight;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Cleanup old events and maintain performance
   */
  cleanup() {
    const cutoffTime = Date.now() - this.config.behaviorAnalysisWindow;

    // Remove old events
    for (const [eventId, event] of this.recentEvents.entries()) {
      if (event.timestamp < cutoffTime) {
        this.recentEvents.delete(eventId);
      }
    }

    // Clean old alerts (keep for investigation)
    const alertCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    for (const [alertId, alert] of this.detectionAlerts.entries()) {
      if (alert.detected_at < alertCutoff && alert.status === 'resolved') {
        this.detectionAlerts.delete(alertId);
      }
    }

    // Trim user profiles
    for (const profile of this.userProfiles.values()) {
      profile.timing_patterns = profile.timing_patterns.filter(t => t > cutoffTime);
    }

    detectorLogger.debug('Cleanup completed', {
      remainingEvents: this.recentEvents.size,
      remainingAlerts: this.detectionAlerts.size,
      remainingProfiles: this.userProfiles.size
    });
  }

  /**
   * Start analysis timer
   */
  startAnalysisTimer() {
    this.analysisTimer = setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  /**
   * Export detection data for analysis
   */
  exportDetectionData() {
    return {
      alerts: Array.from(this.detectionAlerts.values()),
      userProfiles: Object.fromEntries(this.userProfiles),
      suspiciousClusters: Object.fromEntries(this.suspiciousClusters),
      config: this.config,
      exportedAt: Date.now(),
      stats: {
        totalAlerts: this.detectionAlerts.size,
        totalProfiles: this.userProfiles.size,
        recentEvents: this.recentEvents.size
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.detectionAlerts.clear();
    this.userProfiles.clear();
    this.eventPatterns.clear();
    this.suspiciousClusters.clear();
    this.recentEvents.clear();
    this.removeAllListeners();

    detectorLogger.info('Sybil & Replay Detector destroyed');
  }
}

export { DetectionAlert, SybilReplayDetector };
