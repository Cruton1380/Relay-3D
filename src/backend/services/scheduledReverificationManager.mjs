/**
 * @fileoverview Scheduled Reverification Manager - Handles periodic verification cycles
 */
import logger from '../utils/logging/logger.mjs';
import { trustLevelService, TRUST_TIERS } from './trustLevelService.mjs';

const REVERIFICATION_TYPES = {
  LIGHT_PERIODIC: 'light_periodic',
  STANDARD_PERIODIC: 'standard_periodic', 
  ENHANCED_PERIODIC: 'enhanced_periodic',
  HOTSPOT_REQUIRED: 'hotspot_required'
};

const VERIFICATION_REQUIREMENTS = {
  [TRUST_TIERS.PROBATIONARY]: {
    type: REVERIFICATION_TYPES.HOTSPOT_REQUIRED,
    methods: ['hotspot_checkin', 'biometric_ping'],
    description: 'Physical hotspot check-in required for probationary users'
  },
  [TRUST_TIERS.TRUSTED]: {
    type: REVERIFICATION_TYPES.LIGHT_PERIODIC,
    methods: ['biometric_ping', 'device_attestation'],
    description: 'Light biometric verification'
  },
  [TRUST_TIERS.VERIFIED]: {
    type: REVERIFICATION_TYPES.STANDARD_PERIODIC,
    methods: ['biometric_ping', 'device_attestation', 'optional_gesture'],
    description: 'Standard verification with optional gesture'
  },
  [TRUST_TIERS.ANCHOR]: {
    type: REVERIFICATION_TYPES.ENHANCED_PERIODIC,
    methods: ['biometric_ping', 'device_attestation', 'community_validation'],
    description: 'Enhanced verification maintaining anchor status'
  }
};

class ScheduledReverificationManager {
  constructor() {
    this.pendingReverifications = new Map();
    this.reverificationHistory = new Map();
    this.gracePeriodHours = 48; // 48-hour grace period for missed reverifications
  }

  /**
   * Check all users for due reverifications
   */
  async checkDueReverifications() {
    try {
      const usersNeedingReverification = await trustLevelService.getUsersRequiringReverification();
      const results = [];

      for (const user of usersNeedingReverification) {
        const requirements = await this.generateReverificationRequirements(user.userId, user.trustTier);
        
        // Create or update pending reverification
        this.pendingReverifications.set(user.userId, {
          userId: user.userId,
          trustTier: user.trustTier,
          requirements,
          dueDate: Date.now() - (user.daysPastDue * 24 * 60 * 60 * 1000),
          gracePeriodExpires: Date.now() + (this.gracePeriodHours * 60 * 60 * 1000),
          notificationsSent: 0,
          lastNotification: null
        });

        results.push({
          userId: user.userId,
          trustTier: user.trustTier,
          daysPastDue: user.daysPastDue,
          requirements
        });
      }

      logger.info('Reverification check completed', {
        totalUsers: usersNeedingReverification.length,
        newPending: results.length
      });

      return results;
    } catch (error) {
      logger.error('Error checking due reverifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate reverification requirements based on trust tier
   */
  async generateReverificationRequirements(userId, trustTier) {
    try {
      const baseRequirements = VERIFICATION_REQUIREMENTS[trustTier];
      if (!baseRequirements) {
        throw new Error(`No requirements defined for trust tier: ${trustTier}`);
      }

      // Get user's trust summary for context
      const trustSummary = await trustLevelService.getUserTrustSummary(userId);
      
      const requirements = {
        type: baseRequirements.type,
        description: baseRequirements.description,
        methods: [...baseRequirements.methods],
        estimatedTimeMinutes: this.estimateCompletionTime(baseRequirements.type),
        canComplete: {
          remotely: baseRequirements.type !== REVERIFICATION_TYPES.HOTSPOT_REQUIRED,
          requiresHotspot: baseRequirements.type === REVERIFICATION_TYPES.HOTSPOT_REQUIRED
        },
        context: {
          trustTier,
          accountAgeDays: trustSummary?.accountAgeDays || 0,
          recentSuspiciousEvents: trustSummary?.recentSuspiciousEvents || 0
        }
      };

      // Modify requirements based on user history
      if (trustSummary?.recentSuspiciousEvents > 0) {
        requirements.methods.push('additional_validation');
        requirements.description += ' (Additional validation required due to recent activity)';
      }

      return requirements;
    } catch (error) {
      logger.error('Error generating reverification requirements', { error: error.message, userId, trustTier });
      throw error;
    }
  }

  /**
   * Initiate reverification process for user
   */
  async initiateReverification(userId) {
    try {
      const pending = this.pendingReverifications.get(userId);
      if (!pending) {
        throw new Error('No pending reverification found for user');
      }

      // Create reverification session
      const sessionId = this.generateSessionId();
      const session = {
        sessionId,
        userId,
        requirements: pending.requirements,
        status: 'initiated',
        startTime: Date.now(),
        completedMethods: [],
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24-hour completion window
      };

      // Store session
      this.reverificationHistory.set(sessionId, session);

      logger.info('Reverification initiated', {
        sessionId,
        userId,
        requirementsType: pending.requirements.type,
        methods: pending.requirements.methods
      });

      return {
        success: true,
        sessionId,
        requirements: pending.requirements,
        expiresAt: session.expiresAt
      };
    } catch (error) {
      logger.error('Error initiating reverification', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Complete a reverification method
   */
  async completeReverificationMethod(sessionId, method, result) {
    try {
      const session = this.reverificationHistory.get(sessionId);
      if (!session) {
        throw new Error('Invalid reverification session');
      }

      if (Date.now() > session.expiresAt) {
        throw new Error('Reverification session expired');
      }

      // Validate the method result
      const isValid = await this.validateMethodResult(method, result, session);
      if (!isValid) {
        throw new Error(`${method} validation failed`);
      }

      // Record completed method
      session.completedMethods.push({
        method,
        completedAt: Date.now(),
        result
      });

      // Check if all required methods are completed
      const requiredMethods = session.requirements.methods.filter(m => !m.startsWith('optional_'));
      const completedRequiredMethods = session.completedMethods.filter(c => 
        requiredMethods.includes(c.method)
      );

      const isComplete = completedRequiredMethods.length >= requiredMethods.length;

      if (isComplete) {
        // Complete the reverification
        session.status = 'completed';
        session.completedAt = Date.now();

        // Update user's trust data
        await trustLevelService.completeReverification(session.userId, session.requirements.type);

        // Remove from pending
        this.pendingReverifications.delete(session.userId);

        logger.info('Reverification completed', {
          sessionId,
          userId: session.userId,
          duration: Date.now() - session.startTime,
          methodsCompleted: session.completedMethods.length
        });

        return {
          success: true,
          reverificationComplete: true,
          session: {
            completedMethods: session.completedMethods,
            duration: Date.now() - session.startTime
          }
        };
      }

      // Return next required method
      const nextMethod = requiredMethods.find(method => 
        !session.completedMethods.some(c => c.method === method)
      );

      return {
        success: true,
        reverificationComplete: false,
        nextMethod,
        progress: {
          completed: completedRequiredMethods.length,
          total: requiredMethods.length
        }
      };
    } catch (error) {
      logger.error('Error completing reverification method', { error: error.message, sessionId, method });
      throw error;
    }
  }

  /**
   * Validate method result
   */
  async validateMethodResult(method, result, session) {
    switch (method) {
      case 'biometric_ping':
        return result.biometricHash && result.biometricHash.length > 10;
      
      case 'device_attestation':
        return result.deviceFingerprint && result.attestationValid;
      
      case 'hotspot_checkin':
        return result.sessionId && result.hotspotVerified;
      
      case 'optional_gesture':
        return true; // Optional methods always pass
      
      case 'community_validation':
        return result.validatorId && result.validationConfirmed;
      
      case 'additional_validation':
        return result.additionalDataProvided;
      
      default:
        logger.warn('Unknown verification method', { method });
        return false;
    }
  }

  /**
   * Get pending reverification for user
   */
  async getPendingReverification(userId) {
    const pending = this.pendingReverifications.get(userId);
    if (!pending) {
      return null;
    }

    const now = Date.now();
    const gracePeriodRemaining = Math.max(0, pending.gracePeriodExpires - now);
    const daysPastDue = Math.floor((now - pending.dueDate) / (24 * 60 * 60 * 1000));

    return {
      ...pending,
      daysPastDue,
      gracePeriodRemainingHours: Math.floor(gracePeriodRemaining / (60 * 60 * 1000)),
      isInGracePeriod: gracePeriodRemaining > 0
    };
  }

  /**
   * Send reverification reminders
   */
  async sendReverificationReminders() {
    try {
      const reminders = [];
      const now = Date.now();

      for (const [userId, pending] of this.pendingReverifications) {
        const daysSinceLastNotification = pending.lastNotification ? 
          Math.floor((now - pending.lastNotification) / (24 * 60 * 60 * 1000)) : 999;

        // Send reminder if no notification sent recently
        if (daysSinceLastNotification >= 3) { // Every 3 days
          pending.notificationsSent++;
          pending.lastNotification = now;

          reminders.push({
            userId,
            trustTier: pending.trustTier,
            requirementsType: pending.requirements.type,
            gracePeriodRemainingHours: Math.floor((pending.gracePeriodExpires - now) / (60 * 60 * 1000))
          });
        }
      }

      logger.info('Reverification reminders sent', { count: reminders.length });
      return reminders;
    } catch (error) {
      logger.error('Error sending reverification reminders', { error: error.message });
      throw error;
    }
  }

  /**
   * Estimate completion time for reverification type
   */
  estimateCompletionTime(type) {
    switch (type) {
      case REVERIFICATION_TYPES.LIGHT_PERIODIC:
        return 2; // 2 minutes
      case REVERIFICATION_TYPES.STANDARD_PERIODIC:
        return 5; // 5 minutes
      case REVERIFICATION_TYPES.ENHANCED_PERIODIC:
        return 10; // 10 minutes
      case REVERIFICATION_TYPES.HOTSPOT_REQUIRED:
        return 15; // 15 minutes (including travel time)
      default:
        return 5;
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return 'reverify_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get reverification statistics
   */
  async getReverificationStats() {
    const pendingCount = this.pendingReverifications.size;
    const completedToday = Array.from(this.reverificationHistory.values()).filter(
      session => session.status === 'completed' && 
      Date.now() - session.completedAt < (24 * 60 * 60 * 1000)
    ).length;

    const overdue = Array.from(this.pendingReverifications.values()).filter(
      pending => Date.now() > pending.gracePeriodExpires
    ).length;

    return {
      pendingReverifications: pendingCount,
      completedToday,
      overdue,
      activeGracePeriod: pendingCount - overdue
    };
  }
}

export const scheduledReverificationManager = new ScheduledReverificationManager();
export { REVERIFICATION_TYPES };

// Run daily check for due reverifications
setInterval(async () => {
  try {
    await scheduledReverificationManager.checkDueReverifications();
    await scheduledReverificationManager.sendReverificationReminders();
  } catch (error) {
    logger.error('Error in scheduled reverification check', { error: error.message });
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours

export default scheduledReverificationManager;
