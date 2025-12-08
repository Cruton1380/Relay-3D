/**
 * @fileoverview User Engagement Tracker
 * 
 * Tracks all user activities for vote token earning and trust calculation.
 * Integrates with vote token manager to award tokens for growth activities.
 */

import { EventEmitter } from 'events';
import logger from '../backend/utils/logging/logger.mjs';

const engagementLogger = logger.child({ module: 'engagement-tracker' });

export class EngagementTracker extends EventEmitter {
  constructor(voteTokenManager, options = {}) {
    super();
    
    this.voteTokenManager = voteTokenManager;
    this.config = {
      // Activity types that count for daily engagement
      engagementActivities: [
        'vote_cast',
        'channel_message',
        'channel_discovery',
        'friend_interaction',
        'comment_posted',
        'proposal_created'
      ],
      ...options
    };
    
    // Activity tracking
    this.userActivities = new Map();
    this.channelDiscoveries = new Map();
    this.friendInteractions = new Map();
  }

  /**
   * Record friend addition - awards vote tokens
   */
  async recordFriendAdded(userId, friendId, metadata = {}) {
    // Award vote tokens for new friend
    const tokensAwarded = await this.voteTokenManager.awardFriendAddedBonus(userId, friendId);
    
    // Track for pattern analysis
    if (!this.friendInteractions.has(userId)) {
      this.friendInteractions.set(userId, []);
    }
    
    this.friendInteractions.get(userId).push({
      type: 'friend_added',
      friendId,
      timestamp: Date.now(),
      tokensAwarded,
      metadata
    });
    
    engagementLogger.info('Friend added', {
      userId,
      friendId,
      tokensAwarded,
      metadata
    });
    
    this.emit('friend.added', { userId, friendId, tokensAwarded });
    
    return tokensAwarded;
  }

  /**
   * Record channel joined - awards vote tokens
   */
  async recordChannelJoined(userId, channelId, discoveryMethod, metadata = {}) {
    // Award vote tokens for joining channel
    const tokensAwarded = await this.voteTokenManager.awardChannelJoinedBonus(userId, channelId);
    
    // Track channel discovery patterns
    if (!this.channelDiscoveries.has(userId)) {
      this.channelDiscoveries.set(userId, []);
    }
    
    this.channelDiscoveries.get(userId).push({
      channelId,
      discoveryMethod, // 'proximity', 'invite', 'search', 'recommendation'
      timestamp: Date.now(),
      tokensAwarded,
      metadata
    });
    
    // Record daily engagement
    await this.recordDailyEngagement(userId, 'channel_joined', { channelId, discoveryMethod });
    
    engagementLogger.info('Channel joined', {
      userId,
      channelId,
      discoveryMethod,
      tokensAwarded,
      metadata
    });
    
    this.emit('channel.joined', { userId, channelId, tokensAwarded, discoveryMethod });
    
    return tokensAwarded;
  }

  /**
   * Record successful invite - awards random vote token bonus
   */
  async recordSuccessfulInvite(inviterId, invitedUserId, metadata = {}) {
    // Award random vote token bonus (2-10 tokens)
    const tokensAwarded = await this.voteTokenManager.awardInviteSuccessBonus(inviterId, invitedUserId);
    
    engagementLogger.info('Successful invite rewarded', {
      inviterId,
      invitedUserId,
      tokensAwarded,
      metadata
    });
    
    this.emit('invite.successful', { inviterId, invitedUserId, tokensAwarded });
    
    return tokensAwarded;
  }

  /**
   * Record biometric verification completion
   */
  async recordBiometricVerification(userId, verificationType, metadata = {}) {
    // Award vote tokens for completing verification
    const tokensAwarded = await this.voteTokenManager.awardBiometricVerificationBonus(userId);
    
    await this.recordDailyEngagement(userId, 'biometric_verification', { verificationType });
    
    engagementLogger.info('Biometric verification completed', {
      userId,
      verificationType,
      tokensAwarded,
      metadata
    });
    
    this.emit('biometric.verified', { userId, verificationType, tokensAwarded });
    
    return tokensAwarded;
  }

  /**
   * Record guardian setup completion
   */
  async recordGuardianSetup(userId, guardianCount, metadata = {}) {
    // Award vote tokens for guardian setup
    const tokensAwarded = await this.voteTokenManager.awardGuardianSetupBonus(userId);
    
    await this.recordDailyEngagement(userId, 'guardian_setup', { guardianCount });
    
    engagementLogger.info('Guardian setup completed', {
      userId,
      guardianCount,
      tokensAwarded,
      metadata
    });
    
    this.emit('guardian.setup', { userId, guardianCount, tokensAwarded });
    
    return tokensAwarded;
  }

  /**
   * Record vote cast
   */
  async recordVoteCast(userId, proposalId, channelId, voteValue, metadata = {}) {
    // Record daily engagement (no vote tokens for voting itself)
    await this.recordDailyEngagement(userId, 'vote_cast', { proposalId, channelId, voteValue });
    
    engagementLogger.debug('Vote cast recorded', {
      userId,
      proposalId,
      channelId,
      voteValue,
      metadata
    });
    
    this.emit('vote.cast', { userId, proposalId, channelId, voteValue });
  }

  /**
   * Record channel message/comment
   */
  async recordChannelMessage(userId, channelId, messageType, metadata = {}) {
    // Record daily engagement
    await this.recordDailyEngagement(userId, 'channel_message', { channelId, messageType });
    
    engagementLogger.debug('Channel message recorded', {
      userId,
      channelId,
      messageType,
      metadata
    });
    
    this.emit('message.posted', { userId, channelId, messageType });
  }

  /**
   * Record proximity-based channel discovery
   */
  async recordProximityDiscovery(userId, channelId, proximityData, metadata = {}) {
    // This counts as channel discovery and daily engagement
    await this.recordChannelJoined(userId, channelId, 'proximity', { proximityData, ...metadata });
    
    engagementLogger.info('Proximity channel discovery', {
      userId,
      channelId,
      proximityData,
      metadata
    });
    
    this.emit('discovery.proximity', { userId, channelId, proximityData });
  }

  /**
   * Record daily engagement activity (awards bonus once per day)
   */
  async recordDailyEngagement(userId, activityType, metadata = {}) {
    if (!this.config.engagementActivities.includes(activityType)) {
      return 0;
    }
    
    // Track activity
    if (!this.userActivities.has(userId)) {
      this.userActivities.set(userId, []);
    }
    
    this.userActivities.get(userId).push({
      type: activityType,
      timestamp: Date.now(),
      metadata
    });
    
    // Award daily engagement bonus through vote token manager
    const tokensAwarded = await this.voteTokenManager.recordEngagementActivity(userId, activityType, metadata);
    
    if (tokensAwarded > 0) {
      engagementLogger.debug('Daily engagement bonus awarded', {
        userId,
        activityType,
        tokensAwarded,
        metadata
      });
    }
    
    return tokensAwarded;
  }

  /**
   * Track user activity - alias for recordDailyEngagement
   * @param {string} userId - The user ID
   * @param {string} activityType - Type of activity
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<number>} - Tokens awarded
   */
  async trackActivity(userId, activityType, metadata = {}) {
    return await this.recordDailyEngagement(userId, activityType, metadata);
  }

  /**
   * Get user engagement summary
   */
  getUserEngagementSummary(userId) {
    const activities = this.userActivities.get(userId) || [];
    const channelDiscoveries = this.channelDiscoveries.get(userId) || [];
    const friendInteractions = this.friendInteractions.get(userId) || [];
    
    // Calculate engagement metrics
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentActivities = activities.filter(a => a.timestamp > weekAgo.getTime());
    const recentDiscoveries = channelDiscoveries.filter(d => d.timestamp > weekAgo.getTime());
    const recentFriends = friendInteractions.filter(f => f.timestamp > weekAgo.getTime());
    
    return {
      userId,
      totalActivities: activities.length,
      weeklyActivities: recentActivities.length,
      channelsJoined: channelDiscoveries.length,
      recentChannelsJoined: recentDiscoveries.length,
      friendsAdded: friendInteractions.length,
      recentFriendsAdded: recentFriends.length,
      activityTypes: [...new Set(activities.map(a => a.type))],
      lastActivity: Math.max(...activities.map(a => a.timestamp), 0),
      voteTokenSummary: this.voteTokenManager.getUserSummary(userId)
    };
  }

  /**
   * Get user activity patterns for anomaly detection
   */
  getUserActivityPatterns(userId) {
    const activities = this.userActivities.get(userId) || [];
    const channelDiscoveries = this.channelDiscoveries.get(userId) || [];
    const friendInteractions = this.friendInteractions.get(userId) || [];
    
    // Analyze patterns
    const timingPatterns = this.analyzeTimingPatterns(activities);
    const discoveryPatterns = this.analyzeDiscoveryPatterns(channelDiscoveries);
    const socialPatterns = this.analyzeSocialPatterns(friendInteractions);
    
    return {
      userId,
      timing: timingPatterns,
      discovery: discoveryPatterns,
      social: socialPatterns,
      anomalyIndicators: this.detectAnomalyIndicators(timingPatterns, discoveryPatterns, socialPatterns)
    };
  }

  /**
   * Analyze timing patterns for human-like behavior
   */
  analyzeTimingPatterns(activities) {
    if (activities.length < 2) return { insufficient_data: true };
    
    const intervals = [];
    for (let i = 1; i < activities.length; i++) {
      intervals.push(activities[i].timestamp - activities[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return {
      averageInterval: avgInterval,
      variance: variance,
      tooRegular: variance < 1000, // Less than 1 second variance might be bot-like
      tooFast: avgInterval < 5000,  // Less than 5 seconds average might be automated
      activityCount: activities.length
    };
  }

  /**
   * Analyze channel discovery patterns
   */
  analyzeDiscoveryPatterns(discoveries) {
    const methods = discoveries.map(d => d.discoveryMethod);
    const methodCounts = {};
    
    methods.forEach(method => {
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    
    return {
      totalDiscoveries: discoveries.length,
      discoveryMethods: methodCounts,
      diverseDiscovery: Object.keys(methodCounts).length > 1,
      proximityRatio: (methodCounts.proximity || 0) / discoveries.length
    };
  }

  /**
   * Analyze social interaction patterns
   */
  analyzeSocialPatterns(friendInteractions) {
    return {
      totalFriends: friendInteractions.length,
      additionRate: friendInteractions.length / Math.max(1, (Date.now() - Math.min(...friendInteractions.map(f => f.timestamp))) / (24 * 60 * 60 * 1000)),
      recentAdditions: friendInteractions.filter(f => f.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
    };
  }

  /**
   * Detect anomaly indicators in user patterns
   */
  detectAnomalyIndicators(timingPatterns, discoveryPatterns, socialPatterns) {
    const indicators = [];
    
    if (timingPatterns.tooRegular) {
      indicators.push('regular_timing_pattern');
    }
    
    if (timingPatterns.tooFast) {
      indicators.push('rapid_activity_pattern');
    }
    
    if (socialPatterns.additionRate > 10) { // More than 10 friends per day
      indicators.push('excessive_friend_additions');
    }
    
    if (discoveryPatterns.totalDiscoveries > 20 && !discoveryPatterns.diverseDiscovery) {
      indicators.push('monotone_discovery_pattern');
    }
    
    return {
      indicators,
      riskLevel: indicators.length > 2 ? 'high' : indicators.length > 0 ? 'medium' : 'low'
    };
  }
}

export default EngagementTracker;

// Export an instance for immediate use
import voteTokenManager from './voteTokenManager.mjs';
const engagementTracker = new EngagementTracker(voteTokenManager);
export { engagementTracker };