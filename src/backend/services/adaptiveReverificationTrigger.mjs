/**
 * @fileoverview Adaptive Reverification Trigger - Only triggers on ≥2 high-risk events
 */
import logger from '../utils/logging/logger.mjs';
import { trustLevelService, TRUST_TIERS } from './trustLevelService.mjs';

const RISK_EVENTS = {
  UNKNOWN_DEVICE: 'unknown_device',
  UNUSUAL_LOCATION: 'unusual_location', 
  SUSPICIOUS_TIMING: 'suspicious_timing',
  HIGH_VALUE_ACTION: 'high_value_action',
  MULTIPLE_FAILED_ATTEMPTS: 'multiple_failed_attempts',
  VPN_DETECTED: 'vpn_detected',
  RAPID_LOCATION_CHANGE: 'rapid_location_change',
  CONCURRENT_SESSIONS: 'concurrent_sessions'
};

const RISK_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

const EVENT_WEIGHTS = {
  [RISK_EVENTS.UNKNOWN_DEVICE]: 3,
  [RISK_EVENTS.UNUSUAL_LOCATION]: 2,
  [RISK_EVENTS.SUSPICIOUS_TIMING]: 1,
  [RISK_EVENTS.HIGH_VALUE_ACTION]: 2,
  [RISK_EVENTS.MULTIPLE_FAILED_ATTEMPTS]: 3,
  [RISK_EVENTS.VPN_DETECTED]: 1,
  [RISK_EVENTS.RAPID_LOCATION_CHANGE]: 3,
  [RISK_EVENTS.CONCURRENT_SESSIONS]: 2
};

const ADAPTIVE_TRIGGER_THRESHOLD = 4; // Requires combination of events with total weight ≥4

class AdaptiveReverificationTrigger {
  constructor() {
    this.userRiskSessions = new Map(); // Track risk events per user session
    this.riskEventHistory = new Map(); // Historical risk events per user
  }

  /**
   * Evaluate if adaptive reverification should be triggered
   */
  async evaluateRiskEvents(userId, newEvent, context = {}) {
    try {
      // Get or create risk session for user
      let riskSession = this.userRiskSessions.get(userId);
      if (!riskSession) {
        riskSession = {
          userId,
          sessionStart: Date.now(),
          events: [],
          totalWeight: 0,
          triggered: false
        };
        this.userRiskSessions.set(userId, riskSession);
      }

      // Add new risk event
      const eventWeight = EVENT_WEIGHTS[newEvent.type] || 1;
      const riskEvent = {
        type: newEvent.type,
        severity: newEvent.severity || RISK_SEVERITIES.MEDIUM,
        weight: eventWeight,
        timestamp: Date.now(),
        context
      };

      riskSession.events.push(riskEvent);
      riskSession.totalWeight += eventWeight;

      // Record in user's historical risk events
      await trustLevelService.recordSuspiciousEvent(
        userId,
        newEvent.type,
        newEvent.severity,
        context
      );

      logger.info('Risk event recorded', {
        userId,
        eventType: newEvent.type,
        eventWeight,
        totalSessionWeight: riskSession.totalWeight,
        eventsInSession: riskSession.events.length
      });

      // Check if adaptive trigger threshold is met
      if (!riskSession.triggered && riskSession.totalWeight >= ADAPTIVE_TRIGGER_THRESHOLD) {
        return await this.triggerAdaptiveReverification(userId, riskSession);
      }

      return {
        triggerRequired: false,
        riskWeight: riskSession.totalWeight,
        threshold: ADAPTIVE_TRIGGER_THRESHOLD,
        events: riskSession.events.length
      };
    } catch (error) {
      logger.error('Error evaluating risk events', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Trigger adaptive reverification
   */
  async triggerAdaptiveReverification(userId, riskSession) {
    try {
      // Mark session as triggered to prevent multiple triggers
      riskSession.triggered = true;

      // Get user's trust summary
      const trustSummary = await trustLevelService.getUserTrustSummary(userId);
      
      // Determine verification level based on trust tier and risk severity
      const verificationLevel = this.determineVerificationLevel(
        trustSummary?.trustTier || TRUST_TIERS.PROBATIONARY,
        riskSession.totalWeight
      );

      // Generate verification requirements
      const requirements = this.generateAdaptiveRequirements(verificationLevel, riskSession);

      logger.warn('Adaptive reverification triggered', {
        userId,
        trustTier: trustSummary?.trustTier,
        riskWeight: riskSession.totalWeight,
        verificationLevel,
        triggerEvents: riskSession.events.map(e => e.type)
      });

      return {
        triggerRequired: true,
        verificationLevel,
        requirements,
        riskAnalysis: {
          totalWeight: riskSession.totalWeight,
          eventCount: riskSession.events.length,
          triggerEvents: riskSession.events,
          sessionDuration: Date.now() - riskSession.sessionStart
        }
      };
    } catch (error) {
      logger.error('Error triggering adaptive reverification', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Determine verification level based on trust tier and risk weight
   */
  determineVerificationLevel(trustTier, riskWeight) {
    // Higher trust users get lighter verification for same risk weight
    if (riskWeight >= 8) {
      return 'strong'; // Highest risk
    } else if (riskWeight >= 6) {
      return trustTier === TRUST_TIERS.ANCHOR ? 'light' : 'medium';
    } else if (riskWeight >= 4) {
      if (trustTier === TRUST_TIERS.ANCHOR || trustTier === TRUST_TIERS.VERIFIED) {
        return 'light';
      } else {
        return 'medium';
      }
    } else {
      return 'light';
    }
  }

  /**
   * Generate adaptive verification requirements
   */
  generateAdaptiveRequirements(verificationLevel, riskSession) {
    const baseRequirements = {
      light: {
        methods: ['biometric_ping'],
        description: 'Quick biometric verification required',
        estimatedMinutes: 1
      },
      medium: {
        methods: ['biometric_ping', 'device_attestation'],
        description: 'Biometric and device verification required', 
        estimatedMinutes: 3
      },
      strong: {
        methods: ['biometric_ping', 'device_attestation', 'security_challenge'],
        description: 'Enhanced security verification required',
        estimatedMinutes: 5
      }
    };

    const requirements = baseRequirements[verificationLevel];
    
    // Add context-specific requirements based on risk events
    const eventTypes = riskSession.events.map(e => e.type);
    
    if (eventTypes.includes(RISK_EVENTS.UNKNOWN_DEVICE)) {
      requirements.methods.push('device_registration');
      requirements.description += ' (New device detected)';
    }
    
    if (eventTypes.includes(RISK_EVENTS.UNUSUAL_LOCATION)) {
      requirements.methods.push('location_confirmation');
      requirements.description += ' (Unusual location detected)';
    }

    if (eventTypes.includes(RISK_EVENTS.HIGH_VALUE_ACTION)) {
      requirements.methods.push('action_confirmation');
      requirements.description += ' (High-value action requires confirmation)';
    }

    return {
      ...requirements,
      level: verificationLevel,
      triggerReason: 'Multiple risk factors detected',
      riskEvents: eventTypes
    };
  }

  /**
   * Check for specific risk patterns
   */
  async checkDeviceRisk(userId, deviceInfo, userAgent) {
    const events = [];

    // Check if device is known
    // (In real implementation, compare against stored device fingerprints)
    if (!deviceInfo.isKnownDevice) {
      events.push({
        type: RISK_EVENTS.UNKNOWN_DEVICE,
        severity: RISK_SEVERITIES.HIGH,
        context: { deviceFingerprint: deviceInfo.fingerprint }
      });
    }

    // Check for multiple concurrent sessions
    if (deviceInfo.concurrentSessions > 1) {
      events.push({
        type: RISK_EVENTS.CONCURRENT_SESSIONS,
        severity: RISK_SEVERITIES.MEDIUM,
        context: { sessionCount: deviceInfo.concurrentSessions }
      });
    }

    return events;
  }

  /**
   * Check for location-based risks
   */
  async checkLocationRisk(userId, locationData) {
    const events = [];

    // Check for unusual location
    // (In real implementation, compare against user's location history)
    if (locationData.isUnusualLocation) {
      events.push({
        type: RISK_EVENTS.UNUSUAL_LOCATION,
        severity: RISK_SEVERITIES.MEDIUM,
        context: { 
          location: locationData.city,
          country: locationData.country,
          distanceFromNormal: locationData.distanceKm 
        }
      });
    }

    // Check for rapid location changes
    if (locationData.rapidLocationChange) {
      events.push({
        type: RISK_EVENTS.RAPID_LOCATION_CHANGE,
        severity: RISK_SEVERITIES.HIGH,
        context: { 
          previousLocation: locationData.previousLocation,
          timeElapsed: locationData.timeElapsedMinutes
        }
      });
    }

    // Check for VPN usage
    if (locationData.vpnDetected) {
      events.push({
        type: RISK_EVENTS.VPN_DETECTED,
        severity: RISK_SEVERITIES.LOW,
        context: { vpnProvider: locationData.vpnProvider }
      });
    }

    return events;
  }

  /**
   * Check for behavioral risks
   */
  async checkBehavioralRisk(userId, actionData) {
    const events = [];

    // Check for high-value actions
    if (actionData.isHighValue) {
      events.push({
        type: RISK_EVENTS.HIGH_VALUE_ACTION,
        severity: RISK_SEVERITIES.MEDIUM,
        context: { 
          actionType: actionData.type,
          value: actionData.value 
        }
      });
    }

    // Check for suspicious timing
    if (actionData.isSuspiciousTiming) {
      events.push({
        type: RISK_EVENTS.SUSPICIOUS_TIMING,
        severity: RISK_SEVERITIES.LOW,
        context: { 
          timeOfDay: actionData.timeOfDay,
          isWeekend: actionData.isWeekend
        }
      });
    }

    // Check for multiple failed attempts
    if (actionData.failedAttempts >= 3) {
      events.push({
        type: RISK_EVENTS.MULTIPLE_FAILED_ATTEMPTS,
        severity: RISK_SEVERITIES.HIGH,
        context: { 
          failedAttempts: actionData.failedAttempts,
          timeWindow: actionData.timeWindowMinutes
        }
      });
    }

    return events;
  }

  /**
   * Complete adaptive reverification
   */
  async completeAdaptiveReverification(userId) {
    try {
      // Clear the risk session
      this.userRiskSessions.delete(userId);
      
      // Record successful completion
      await trustLevelService.recordTrustAction(
        userId,
        'adaptive_reverification_completed',
        { triggerReason: 'risk_threshold_exceeded' }
      );

      logger.info('Adaptive reverification completed', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Error completing adaptive reverification', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get current risk session for user
   */
  getRiskSession(userId) {
    return this.userRiskSessions.get(userId);
  }

  /**
   * Clean up old risk sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const sessionTimeout = 60 * 60 * 1000; // 1 hour

    for (const [userId, session] of this.userRiskSessions) {
      if (now - session.sessionStart > sessionTimeout) {
        this.userRiskSessions.delete(userId);
        logger.debug('Risk session cleaned up', { userId });
      }
    }
  }

  /**
   * Get adaptive trigger statistics
   */
  getAdaptiveTriggerStats() {
    const activeRiskSessions = this.userRiskSessions.size;
    const triggeredSessions = Array.from(this.userRiskSessions.values()).filter(
      session => session.triggered
    ).length;

    return {
      activeRiskSessions,
      triggeredSessions,
      threshold: ADAPTIVE_TRIGGER_THRESHOLD
    };
  }
}

export const adaptiveReverificationTrigger = new AdaptiveReverificationTrigger();
export { RISK_EVENTS, RISK_SEVERITIES };

// Clean up old sessions every hour
setInterval(() => {
  adaptiveReverificationTrigger.cleanupOldSessions();
}, 60 * 60 * 1000);

export default adaptiveReverificationTrigger;
