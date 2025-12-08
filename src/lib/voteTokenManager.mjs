/**
 * @fileoverview Vote Token Management System
 * 
 * Implements two-phase voting system:
 * - Phase 1: New users earn vote tokens through engagement (20 initial + earning)
 * - Phase 2: Trusted users get unlimited voting with only channel decay rules
 * 
 * Separate from invite token system which uses generational decay for security.
 */

import { EventEmitter } from 'events';
import logger from '../backend/utils/logging/logger.mjs';

const voteTokenLogger = logger.child({ module: 'vote-token-manager' });

export class VoteTokenManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // New user starting allocation
      initialVoteTokens: 20,
      
      // Token earning rates (no caps - motivation rewarded)
      friendAddedBonus: 5,
      channelJoinedBonus: 3,
      dailyEngagementBonus: 2,
      biometricVerificationBonus: 5,
      guardianSetupBonus: 5,
      
      // Invite success bonus (separate from invite tokens)
      inviteSuccessMin: 2,
      inviteSuccessMax: 10,
      
      // Graduation to unlimited voting
      trustedUserRequirements: {
        trustScore: 75,
        channelsJoined: 3,
        daysInSystem: 7,
        biometricVerified: true,
        guardianSetup: true
      },
      
      // Flagged user restrictions
      flaggedUserVoteLimit: 10,
      
      ...options
    };
    
    // User vote token storage
    this.userVoteTokens = new Map();
    this.userPhases = new Map();
    this.dailyEngagement = new Map();
    this.flaggedUsers = new Set();
  }

  /**
   * Initialize new user with starting vote tokens
   */
  async initializeNewUser(userId) {
    this.userVoteTokens.set(userId, this.config.initialVoteTokens);
    this.userPhases.set(userId, 'new_user');
    this.dailyEngagement.set(userId, new Set());
    
    voteTokenLogger.info('New user initialized with vote tokens', {
      userId,
      initialTokens: this.config.initialVoteTokens
    });
    
    this.emit('user.initialized', { userId, initialTokens: this.config.initialVoteTokens });
    
    return this.config.initialVoteTokens;
  }

  /**
   * Award tokens for adding a new friend
   */
  async awardFriendAddedBonus(userId, friendId) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const bonus = this.config.friendAddedBonus;
    await this.addVoteTokens(userId, bonus, 'friend_added', { friendId });
    
    return bonus;
  }

  /**
   * Award tokens for joining a channel
   */
  async awardChannelJoinedBonus(userId, channelId) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const bonus = this.config.channelJoinedBonus;
    await this.addVoteTokens(userId, bonus, 'channel_joined', { channelId });
    
    return bonus;
  }

  /**
   * Award daily engagement bonus (once per day)
   */
  async awardDailyEngagementBonus(userId, activityType) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const today = new Date().toDateString();
    const userEngagement = this.dailyEngagement.get(userId) || new Set();
    
    if (userEngagement.has(today)) {
      return 0; // Already awarded today
    }
    
    userEngagement.add(today);
    this.dailyEngagement.set(userId, userEngagement);
    
    const bonus = this.config.dailyEngagementBonus;
    await this.addVoteTokens(userId, bonus, 'daily_engagement', { activityType, date: today });
    
    return bonus;
  }

  /**
   * Award bonus for completing biometric verification
   */
  async awardBiometricVerificationBonus(userId) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const bonus = this.config.biometricVerificationBonus;
    await this.addVoteTokens(userId, bonus, 'biometric_verification');
    
    return bonus;
  }

  /**
   * Award bonus for setting up guardian recovery
   */
  async awardGuardianSetupBonus(userId) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const bonus = this.config.guardianSetupBonus;
    await this.addVoteTokens(userId, bonus, 'guardian_setup');
    
    return bonus;
  }

  /**
   * Award random bonus for successful invite (2-10 tokens)
   * This is separate from invite tokens - it's a vote token reward
   */
  async awardInviteSuccessBonus(userId, invitedUserId) {
    if (this.getUserPhase(userId) !== 'new_user') return 0;
    
    const bonus = Math.floor(Math.random() * 
      (this.config.inviteSuccessMax - this.config.inviteSuccessMin + 1)) + 
      this.config.inviteSuccessMin;
    
    await this.addVoteTokens(userId, bonus, 'invite_success', { invitedUserId, randomBonus: bonus });
    
    return bonus;
  }

  /**
   * Add vote tokens to user account
   */
  async addVoteTokens(userId, amount, reason, metadata = {}) {
    const currentTokens = this.userVoteTokens.get(userId) || 0;
    const newTotal = currentTokens + amount;
    
    this.userVoteTokens.set(userId, newTotal);
    
    voteTokenLogger.info('Vote tokens awarded', {
      userId,
      amount,
      reason,
      previousTotal: currentTokens,
      newTotal,
      metadata
    });
    
    this.emit('tokens.awarded', {
      userId,
      amount,
      reason,
      newTotal,
      metadata
    });
    
    // Check if user should graduate to trusted status
    await this.checkGraduationEligibility(userId);
    
    return newTotal;
  }

  /**
   * Spend vote tokens for voting
   */
  async spendVoteTokens(userId, amount, proposalId, channelId) {
    const phase = this.getUserPhase(userId);
    
    // Flagged users have limited voting
    if (this.flaggedUsers.has(userId)) {
      const currentTokens = this.userVoteTokens.get(userId) || 0;
      if (currentTokens < amount || currentTokens <= 0) {
        throw new Error('Insufficient vote tokens - account flagged');
      }
      
      this.userVoteTokens.set(userId, currentTokens - amount);
      return currentTokens - amount;
    }
    
    // Trusted users have unlimited voting
    if (phase === 'trusted_user') {
      voteTokenLogger.debug('Trusted user voting (unlimited)', { userId, proposalId, channelId });
      return Infinity; // No token deduction
    }
    
    // New users spend from their earned tokens
    const currentTokens = this.userVoteTokens.get(userId) || 0;
    if (currentTokens < amount) {
      throw new Error('Insufficient vote tokens');
    }
    
    const newTotal = currentTokens - amount;
    this.userVoteTokens.set(userId, newTotal);
    
    voteTokenLogger.info('Vote tokens spent', {
      userId,
      amount,
      proposalId,
      channelId,
      remainingTokens: newTotal
    });
    
    return newTotal;
  }
  /**
   * Check if user can vote (has tokens or is trusted)
   */
  async canUserVote(userId) {
    const phase = this.getUserPhase(userId);
    
    // Trusted users can always vote
    if (phase === 'trusted_user') {
      return true;
    }
      // Auto-initialize new users with starting tokens for testing
    if (!this.userVoteTokens.has(userId)) {
      const startingTokens = this.config.initialVoteTokens;
      this.userVoteTokens.set(userId, startingTokens);
      voteTokenLogger.info(`Auto-initialized user ${userId} with ${startingTokens} tokens`);
    }
    
    // Flagged users have limited voting
    if (this.flaggedUsers.has(userId)) {
      const currentTokens = this.userVoteTokens.get(userId) || 0;
      return currentTokens > 0 && currentTokens <= this.config.flaggedUserVoteLimit;
    }
    
    // New users need tokens
    const currentTokens = this.userVoteTokens.get(userId) || 0;
    return currentTokens > 0;
  }
  
  /**
   * Consume a vote token for a user
   */
  async consumeVoteToken(userId, voteContext = {}) {
    const phase = this.getUserPhase(userId);
    
    // Trusted users don't consume tokens
    if (phase === 'trusted_user') {
      voteTokenLogger.debug(`Trusted user ${userId} voted without consuming token`, voteContext);
      return true;
    }
    
    // Check if user has tokens
    const currentTokens = this.userVoteTokens.get(userId) || 0;
    if (currentTokens <= 0) {
      voteTokenLogger.warn(`User ${userId} attempted to vote without tokens`);
      return false;
    }
    
    // Consume one token
    this.userVoteTokens.set(userId, currentTokens - 1);
    
    voteTokenLogger.info(`Vote token consumed for user ${userId}`, {
      remainingTokens: currentTokens - 1,
      voteContext
    });
    
    this.emit('tokenConsumed', {
      userId,
      remainingTokens: currentTokens - 1,
      voteContext
    });
    
    return true;
  }

  /**
   * Check if user should graduate to trusted status
   */
  async checkGraduationEligibility(userId) {
    if (this.getUserPhase(userId) !== 'new_user') return false;
    
    // This would integrate with trust system, user service, etc.
    // For now, simplified check
    const requirements = this.config.trustedUserRequirements;
    const userMetrics = await this.getUserMetrics(userId);
    
    const eligible = (
      userMetrics.trustScore >= requirements.trustScore &&
      userMetrics.channelsJoined >= requirements.channelsJoined &&
      userMetrics.daysInSystem >= requirements.daysInSystem &&
      userMetrics.biometricVerified === requirements.biometricVerified &&
      userMetrics.guardianSetup === requirements.guardianSetup
    );
    
    if (eligible) {
      await this.graduateToTrustedUser(userId);
      return true;
    }
    
    return false;
  }

  /**
   * Graduate user to trusted status with unlimited voting
   */
  async graduateToTrustedUser(userId) {
    this.userPhases.set(userId, 'trusted_user');
    
    voteTokenLogger.info('User graduated to trusted status', {
      userId,
      finalTokenBalance: this.userVoteTokens.get(userId)
    });
    
    this.emit('user.graduated', {
      userId,
      previousPhase: 'new_user',
      newPhase: 'trusted_user',
      unlimitedVoting: true
    });
  }

  /**
   * Flag user for suspicious activity
   */
  async flagUser(userId, reason, metadata = {}) {
    this.flaggedUsers.add(userId);
    
    // Reset to limited voting
    this.userVoteTokens.set(userId, this.config.flaggedUserVoteLimit);
    
    voteTokenLogger.warn('User flagged for suspicious activity', {
      userId,
      reason,
      voteLimit: this.config.flaggedUserVoteLimit,
      metadata
    });
    
    this.emit('user.flagged', {
      userId,
      reason,
      voteLimit: this.config.flaggedUserVoteLimit,
      metadata
    });
  }

  /**
   * Restore user from flagged status
   */
  async restoreUser(userId, reason) {
    this.flaggedUsers.delete(userId);
    
    // Check if they should be trusted or new user
    const previousPhase = this.userPhases.get(userId) || 'new_user';
    if (previousPhase === 'trusted_user') {
      // Restore unlimited voting
      this.userPhases.set(userId, 'trusted_user');
    } else {
      // Restore to normal new user earning
      this.userVoteTokens.set(userId, this.config.initialVoteTokens);
    }
    
    voteTokenLogger.info('User restored from flagged status', {
      userId,
      reason,
      restoredPhase: this.userPhases.get(userId)
    });
    
    this.emit('user.restored', { userId, reason });
  }

  /**
   * Get user's current vote capacity
   */
  getUserVoteCapacity(userId) {
    if (this.flaggedUsers.has(userId)) {
      return {
        capacity: this.userVoteTokens.get(userId) || 0,
        type: 'flagged_limited',
        unlimited: false
      };
    }
    
    const phase = this.getUserPhase(userId);
    if (phase === 'trusted_user') {
      return {
        capacity: Infinity,
        type: 'trusted_unlimited',
        unlimited: true
      };
    }
    
    return {
      capacity: this.userVoteTokens.get(userId) || 0,
      type: 'new_user_earning',
      unlimited: false
    };
  }

  /**
   * Get user phase
   */
  getUserPhase(userId) {
    return this.userPhases.get(userId) || 'new_user';
  }

  /**
   * Mock user metrics (would integrate with real systems)
   */
  async getUserMetrics(userId) {
    // This would integrate with actual user service, trust system, etc.
    return {
      trustScore: 80, // Mock
      channelsJoined: 5, // Mock
      daysInSystem: 10, // Mock
      biometricVerified: true, // Mock
      guardianSetup: true // Mock
    };
  }

  /**
   * Record daily engagement activity
   */
  async recordEngagementActivity(userId, activityType, metadata = {}) {
    // Award daily engagement bonus
    const bonus = await this.awardDailyEngagementBonus(userId, activityType);
    
    // Record the activity for pattern analysis
    voteTokenLogger.debug('User engagement recorded', {
      userId,
      activityType,
      bonusAwarded: bonus,
      metadata
    });
    
    return bonus;
  }

  /**
   * Get user vote token summary
   */
  getUserSummary(userId) {
    const phase = this.getUserPhase(userId);
    const capacity = this.getUserVoteCapacity(userId);
    const flagged = this.flaggedUsers.has(userId);
    
    return {
      userId,
      phase,
      flagged,
      currentTokens: this.userVoteTokens.get(userId) || 0,
      capacity: capacity.capacity,
      unlimited: capacity.unlimited,
      canEarnTokens: phase === 'new_user' && !flagged
    };
  }
}

// Export an instance for immediate use
const voteTokenManager = new VoteTokenManager();
export default voteTokenManager;
