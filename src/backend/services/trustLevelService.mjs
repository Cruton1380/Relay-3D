/**
 * @fileoverview Trust Level Service - Manages user trust accrual over time
 */
import logger from '../utils/logging/logger.mjs';

const TRUST_TIERS = {
  PROBATIONARY: 'probationary',
  TRUSTED: 'trusted', 
  VERIFIED: 'verified',
  ANCHOR: 'anchor'
};

const TRUST_ACTIONS = {
  VOTE_CAST: 'vote_cast',
  PROXIMITY_VALIDATION: 'proximity_validation',
  HOTSPOT_CHECKIN: 'hotspot_checkin',
  FRIEND_VALIDATION: 'friend_validation',
  SCHEDULED_REVERIFICATION: 'scheduled_reverification',
  COMMUNITY_PARTICIPATION: 'community_participation'
};

const TRUST_SCORING = {
  [TRUST_ACTIONS.VOTE_CAST]: 5,
  [TRUST_ACTIONS.PROXIMITY_VALIDATION]: 10,
  [TRUST_ACTIONS.HOTSPOT_CHECKIN]: 15,
  [TRUST_ACTIONS.FRIEND_VALIDATION]: 8,
  [TRUST_ACTIONS.SCHEDULED_REVERIFICATION]: 10,
  [TRUST_ACTIONS.COMMUNITY_PARTICIPATION]: 3
};

const TRUST_THRESHOLDS = {
  [TRUST_TIERS.PROBATIONARY]: 0,
  [TRUST_TIERS.TRUSTED]: 100,
  [TRUST_TIERS.VERIFIED]: 300,
  [TRUST_TIERS.ANCHOR]: 600
};

const REVERIFICATION_INTERVALS = {
  [TRUST_TIERS.PROBATIONARY]: 30 * 24 * 60 * 60 * 1000, // 30 days
  [TRUST_TIERS.TRUSTED]: 90 * 24 * 60 * 60 * 1000, // 90 days
  [TRUST_TIERS.VERIFIED]: 180 * 24 * 60 * 60 * 1000, // 180 days
  [TRUST_TIERS.ANCHOR]: 365 * 24 * 60 * 60 * 1000 // 365 days
};

class TrustLevelService {
  constructor() {
    this.userTrustData = new Map(); // In production, this would be database-backed
  }

  /**
   * Initialize trust data for a new user
   */
  async initializeUserTrust(userId) {
    try {
      const trustData = {
        userId,
        trustScore: 0,
        trustTier: TRUST_TIERS.PROBATIONARY,
        createdAt: Date.now(),
        lastReverification: Date.now(),
        nextReverificationDue: Date.now() + REVERIFICATION_INTERVALS[TRUST_TIERS.PROBATIONARY],
        trustHistory: [],
        suspiciousEvents: [],
        proximityValidations: 0,
        communityConnections: 0
      };

      this.userTrustData.set(userId, trustData);
      
      logger.info('User trust initialized', { 
        userId, 
        tier: TRUST_TIERS.PROBATIONARY,
        nextReverification: new Date(trustData.nextReverificationDue)
      });

      return trustData;
    } catch (error) {
      logger.error('Error initializing user trust', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Record a trust-building action
   */
  async recordTrustAction(userId, actionType, context = {}) {
    try {
      let trustData = this.userTrustData.get(userId);
      if (!trustData) {
        trustData = await this.initializeUserTrust(userId);
      }

      const points = TRUST_SCORING[actionType] || 0;
      const previousScore = trustData.trustScore;
      const previousTier = trustData.trustTier;

      // Add points for the action
      trustData.trustScore += points;

      // Record the action in history
      trustData.trustHistory.push({
        action: actionType,
        points,
        timestamp: Date.now(),
        context
      });

      // Update specific counters
      if (actionType === TRUST_ACTIONS.PROXIMITY_VALIDATION) {
        trustData.proximityValidations++;
      }

      // Check for tier upgrade
      const newTier = this.calculateTrustTier(trustData.trustScore);
      if (newTier !== previousTier) {
        trustData.trustTier = newTier;
        trustData.nextReverificationDue = Date.now() + REVERIFICATION_INTERVALS[newTier];
        
        logger.info('User trust tier upgraded', {
          userId,
          previousTier,
          newTier,
          score: trustData.trustScore,
          nextReverification: new Date(trustData.nextReverificationDue)
        });
      }

      // Update the stored data
      this.userTrustData.set(userId, trustData);

      return {
        success: true,
        trustData: {
          score: trustData.trustScore,
          tier: trustData.trustTier,
          pointsEarned: points,
          tierUpgraded: newTier !== previousTier
        }
      };
    } catch (error) {
      logger.error('Error recording trust action', { error: error.message, userId, actionType });
      throw error;
    }
  }

  /**
   * Check if user needs reverification
   */
  async checkReverificationStatus(userId) {
    try {
      const trustData = this.userTrustData.get(userId);
      if (!trustData) {
        return { needsReverification: true, reason: 'No trust data found' };
      }

      const now = Date.now();
      const isDue = now >= trustData.nextReverificationDue;

      return {
        needsReverification: isDue,
        trustTier: trustData.trustTier,
        trustScore: trustData.trustScore,
        daysSinceLastReverification: Math.floor((now - trustData.lastReverification) / (24 * 60 * 60 * 1000)),
        daysUntilNextDue: Math.ceil((trustData.nextReverificationDue - now) / (24 * 60 * 60 * 1000)),
        reason: isDue ? 'Scheduled reverification due' : null
      };
    } catch (error) {
      logger.error('Error checking reverification status', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Complete scheduled reverification
   */
  async completeReverification(userId, verificationType = 'scheduled') {
    try {
      const trustData = this.userTrustData.get(userId);
      if (!trustData) {
        throw new Error('No trust data found for user');
      }

      // Update reverification timestamp
      trustData.lastReverification = Date.now();
      trustData.nextReverificationDue = Date.now() + REVERIFICATION_INTERVALS[trustData.trustTier];

      // Award trust points for completing reverification
      await this.recordTrustAction(userId, TRUST_ACTIONS.SCHEDULED_REVERIFICATION, {
        verificationType
      });

      logger.info('User reverification completed', {
        userId,
        trustTier: trustData.trustTier,
        nextDue: new Date(trustData.nextReverificationDue)
      });

      return {
        success: true,
        nextReverificationDue: trustData.nextReverificationDue,
        trustTier: trustData.trustTier
      };
    } catch (error) {
      logger.error('Error completing reverification', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Record suspicious event (for adaptive triggers)
   */
  async recordSuspiciousEvent(userId, eventType, severity, context = {}) {
    try {
      let trustData = this.userTrustData.get(userId);
      if (!trustData) {
        trustData = await this.initializeUserTrust(userId);
      }

      const suspiciousEvent = {
        type: eventType,
        severity, // 'low', 'medium', 'high'
        timestamp: Date.now(),
        context
      };

      trustData.suspiciousEvents.push(suspiciousEvent);

      // Keep only recent events (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      trustData.suspiciousEvents = trustData.suspiciousEvents.filter(
        event => event.timestamp > thirtyDaysAgo
      );

      this.userTrustData.set(userId, trustData);

      logger.warn('Suspicious event recorded', {
        userId,
        eventType,
        severity,
        recentEventsCount: trustData.suspiciousEvents.length
      });

      return suspiciousEvent;
    } catch (error) {
      logger.error('Error recording suspicious event', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user's trust summary
   */
  async getUserTrustSummary(userId) {
    try {
      const trustData = this.userTrustData.get(userId);
      if (!trustData) {
        return null;
      }

      const now = Date.now();
      const accountAge = Math.floor((now - trustData.createdAt) / (24 * 60 * 60 * 1000));
      const recentEvents = trustData.suspiciousEvents.filter(
        event => now - event.timestamp < (7 * 24 * 60 * 60 * 1000)
      );

      return {
        userId,
        trustScore: trustData.trustScore,
        trustTier: trustData.trustTier,
        accountAgeDays: accountAge,
        proximityValidations: trustData.proximityValidations,
        communityConnections: trustData.communityConnections,
        lastReverification: trustData.lastReverification,
        nextReverificationDue: trustData.nextReverificationDue,
        daysUntilReverification: Math.ceil((trustData.nextReverificationDue - now) / (24 * 60 * 60 * 1000)),
        recentSuspiciousEvents: recentEvents.length,
        totalTrustActions: trustData.trustHistory.length
      };
    } catch (error) {
      logger.error('Error getting user trust summary', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Calculate trust tier based on score
   */
  calculateTrustTier(score) {
    if (score >= TRUST_THRESHOLDS[TRUST_TIERS.ANCHOR]) {
      return TRUST_TIERS.ANCHOR;
    } else if (score >= TRUST_THRESHOLDS[TRUST_TIERS.VERIFIED]) {
      return TRUST_TIERS.VERIFIED;
    } else if (score >= TRUST_THRESHOLDS[TRUST_TIERS.TRUSTED]) {
      return TRUST_TIERS.TRUSTED;
    } else {
      return TRUST_TIERS.PROBATIONARY;
    }
  }

  /**
   * Get users requiring reverification
   */
  async getUsersRequiringReverification() {
    const now = Date.now();
    const usersNeedingReverification = [];

    for (const [userId, trustData] of this.userTrustData) {
      if (now >= trustData.nextReverificationDue) {
        usersNeedingReverification.push({
          userId,
          trustTier: trustData.trustTier,
          daysPastDue: Math.floor((now - trustData.nextReverificationDue) / (24 * 60 * 60 * 1000))
        });
      }
    }

    return usersNeedingReverification;
  }
}

export const trustLevelService = new TrustLevelService();
export { TRUST_TIERS, TRUST_ACTIONS };
export default trustLevelService;
