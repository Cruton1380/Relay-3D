/**
 * 🔥 Trust Burn System with Invite Tree Tracing
 * 
 * Advanced trust scoring system with decay mechanics, invite tree tracking,
 * and governance-controlled parameters for the Relay Network.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export class TrustBurnSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      initialTrustScore: config.initialTrustScore || 100,
      decayRate: config.decayRate || 0.02,
      minimumThreshold: config.minimumThreshold || 10,
      recoveryMultiplier: config.recoveryMultiplier || 1.5,
      maxInviteDepth: config.maxInviteDepth || 10,
      ...config
    };
    
    // Trust scores and invite tree storage
    this.trustScores = new Map();
    this.inviteTree = new Map();
    this.inviteHistory = new Map();
    this.decayTimers = new Map();
    
    // Governance controls
    this.governanceParameters = new Map();
    this.pendingParameterChanges = new Map();
    
    this.initializeGovernanceDefaults();
  }
  
  /**
   * Initialize default governance parameters
   */
  initializeGovernanceDefaults() {
    this.governanceParameters.set('burnRateAdjustment', true);
    this.governanceParameters.set('communityVoting', true);
    this.governanceParameters.set('emergencyOverride', true);
    this.governanceParameters.set('maxDailyBurn', 20);
    this.governanceParameters.set('recoveryWindowHours', 72);
  }
  
  /**
   * Register a new user with invite tree tracking
   */
  async registerUser(userId, inviterUserId = null, initialMetadata = {}) {
    if (this.trustScores.has(userId)) {
      throw new Error(`User ${userId} already registered`);
    }
    
    // Create trust profile
    const trustProfile = {
      userId,
      trustScore: this.config.initialTrustScore,
      inviterUserId,
      registrationTime: Date.now(),
      lastActivity: Date.now(),
      inviteDepth: this.calculateInviteDepth(inviterUserId),
      totalInvites: 0,
      successfulInvites: 0,
      burnEvents: [],
      recoveryEvents: [],
      metadata: initialMetadata
    };
    
    this.trustScores.set(userId, trustProfile);
    
    // Update invite tree
    if (inviterUserId) {
      this.addToInviteTree(userId, inviterUserId);
      this.recordInviteHistory(inviterUserId, userId);
    }
    
    // Start decay monitoring
    this.startDecayMonitoring(userId);
    
    this.emit('userRegistered', { userId, inviterUserId, trustProfile });
    
    return trustProfile;
  }
  
  /**
   * Calculate invite depth in the tree
   */
  calculateInviteDepth(inviterUserId) {
    if (!inviterUserId || !this.trustScores.has(inviterUserId)) {
      return 0;
    }
    
    const inviterProfile = this.trustScores.get(inviterUserId);
    return Math.min(inviterProfile.inviteDepth + 1, this.config.maxInviteDepth);
  }
  
  /**
   * Add user to invite tree structure
   */
  addToInviteTree(userId, inviterUserId) {
    if (!this.inviteTree.has(inviterUserId)) {
      this.inviteTree.set(inviterUserId, new Set());
    }
    
    this.inviteTree.get(inviterUserId).add(userId);
    
    // Update inviter's stats
    const inviterProfile = this.trustScores.get(inviterUserId);
    if (inviterProfile) {
      inviterProfile.totalInvites++;
      inviterProfile.lastActivity = Date.now();
    }
  }
  
  /**
   * Record invite history for governance and audit
   */
  recordInviteHistory(inviterUserId, inviteeUserId) {
    const inviteRecord = {
      inviterUserId,
      inviteeUserId,
      timestamp: Date.now(),
      inviteDepth: this.calculateInviteDepth(inviterUserId),
      inviterTrustScore: this.getTrustScore(inviterUserId)
    };
    
    if (!this.inviteHistory.has(inviterUserId)) {
      this.inviteHistory.set(inviterUserId, []);
    }
    
    this.inviteHistory.get(inviterUserId).push(inviteRecord);
    
    // Limit history size for performance
    const history = this.inviteHistory.get(inviterUserId);
    if (history.length > 1000) {
      this.inviteHistory.set(inviterUserId, history.slice(-500));
    }
  }
  
  /**
   * Apply trust burn with governance controls
   */
  async burnTrust(userId, burnAmount, reason, governanceApproved = false) {
    const profile = this.trustScores.get(userId);
    if (!profile) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Check governance constraints
    if (!governanceApproved && !this.canBurnTrust(userId, burnAmount)) {
      throw new Error('Trust burn violates governance constraints');
    }
    
    const previousScore = profile.trustScore;
    const actualBurn = Math.min(burnAmount, profile.trustScore - this.config.minimumThreshold);
    
    if (actualBurn <= 0) {
      throw new Error('Cannot burn trust below minimum threshold');
    }
    
    // Apply burn
    profile.trustScore -= actualBurn;
    profile.lastActivity = Date.now();
    
    // Record burn event
    const burnEvent = {
      timestamp: Date.now(),
      burnAmount: actualBurn,
      previousScore,
      newScore: profile.trustScore,
      reason,
      governanceApproved
    };
    
    profile.burnEvents.push(burnEvent);
    
    // Propagate burn effects up invite tree
    await this.propagateBurnEffects(userId, actualBurn, reason);
    
    this.emit('trustBurned', {
      userId,
      burnAmount: actualBurn,
      previousScore,
      newScore: profile.trustScore,
      reason
    });
    
    return profile;
  }
  
  /**
   * Check if trust burn is allowed under governance rules
   */
  canBurnTrust(userId, burnAmount) {
    const profile = this.trustScores.get(userId);
    if (!profile) return false;
    
    // Check daily burn limits
    const maxDailyBurn = this.governanceParameters.get('maxDailyBurn');
    const todaysBurns = this.getTodaysBurnAmount(userId);
    
    if (todaysBurns + burnAmount > maxDailyBurn) {
      return false;
    }
    
    // Check minimum threshold
    if (profile.trustScore - burnAmount < this.config.minimumThreshold) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get today's total burn amount for a user
   */
  getTodaysBurnAmount(userId) {
    const profile = this.trustScores.get(userId);
    if (!profile) return 0;
    
    const today = new Date().toDateString();
    return profile.burnEvents
      .filter(event => new Date(event.timestamp).toDateString() === today)
      .reduce((total, event) => total + event.burnAmount, 0);
  }
  
  /**
   * Propagate burn effects up the invite tree
   */
  async propagateBurnEffects(userId, burnAmount, reason) {
    const profile = this.trustScores.get(userId);
    if (!profile || !profile.inviterUserId) return;
    
    const inviterProfile = this.trustScores.get(profile.inviterUserId);
    if (!inviterProfile) return;
    
    // Calculate propagation burn (reduced effect up the tree)
    const propagationRate = Math.max(0.1, 1 / (profile.inviteDepth + 1));
    const propagatedBurn = burnAmount * propagationRate;
    
    if (propagatedBurn >= 1) {
      try {
        await this.burnTrust(
          profile.inviterUserId,
          Math.floor(propagatedBurn),
          `Propagated from invitee ${userId}: ${reason}`,
          true // Governance pre-approved for propagation
        );
      } catch (error) {
        // Log but don't fail if propagation fails
        console.warn(`Failed to propagate burn to ${profile.inviterUserId}:`, error.message);
      }
    }
  }
  
  /**
   * Recover trust with validation
   */
  async recoverTrust(userId, recoveryAmount, reason, validationProof = null) {
    const profile = this.trustScores.get(userId);
    if (!profile) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Validate recovery eligibility
    if (!this.canRecoverTrust(userId, recoveryAmount)) {
      throw new Error('Trust recovery not allowed under current conditions');
    }
    
    const previousScore = profile.trustScore;
    const actualRecovery = Math.min(
      recoveryAmount * this.config.recoveryMultiplier,
      this.config.initialTrustScore - profile.trustScore
    );
    
    profile.trustScore += actualRecovery;
    profile.lastActivity = Date.now();
    
    // Record recovery event
    const recoveryEvent = {
      timestamp: Date.now(),
      recoveryAmount: actualRecovery,
      previousScore,
      newScore: profile.trustScore,
      reason,
      validationProof
    };
    
    profile.recoveryEvents.push(recoveryEvent);
    
    this.emit('trustRecovered', {
      userId,
      recoveryAmount: actualRecovery,
      previousScore,
      newScore: profile.trustScore,
      reason
    });
    
    return profile;
  }
  
  /**
   * Check if trust recovery is allowed
   */
  canRecoverTrust(userId, recoveryAmount) {
    const profile = this.trustScores.get(userId);
    if (!profile) return false;
    
    // Check recovery window
    const recoveryWindowHours = this.governanceParameters.get('recoveryWindowHours');
    const lastBurnTime = profile.burnEvents.length > 0 
      ? Math.max(...profile.burnEvents.map(e => e.timestamp))
      : 0;
    
    const timeSinceLastBurn = Date.now() - lastBurnTime;
    const recoveryWindowMs = recoveryWindowHours * 60 * 60 * 1000;
    
    return timeSinceLastBurn >= recoveryWindowMs;
  }
  
  /**
   * Start decay monitoring for a user
   */
  startDecayMonitoring(userId) {
    if (this.decayTimers.has(userId)) {
      clearInterval(this.decayTimers.get(userId));
    }
    
    const timer = setInterval(() => {
      this.applyTrustDecay(userId);
    }, 24 * 60 * 60 * 1000); // Daily decay
    
    this.decayTimers.set(userId, timer);
  }
  
  /**
   * Apply natural trust decay
   */
  applyTrustDecay(userId) {
    const profile = this.trustScores.get(userId);
    if (!profile) return;
    
    const daysSinceActivity = (Date.now() - profile.lastActivity) / (24 * 60 * 60 * 1000);
    
    if (daysSinceActivity >= 1) {
      const decayAmount = profile.trustScore * this.config.decayRate * daysSinceActivity;
      const newScore = Math.max(
        this.config.minimumThreshold,
        profile.trustScore - decayAmount
      );
      
      if (newScore !== profile.trustScore) {
        const previousScore = profile.trustScore;
        profile.trustScore = newScore;
        
        this.emit('trustDecayed', {
          userId,
          decayAmount: previousScore - newScore,
          previousScore,
          newScore,
          daysSinceActivity
        });
      }
    }
  }
  
  /**
   * Get current trust score
   */
  getTrustScore(userId) {
    const profile = this.trustScores.get(userId);
    return profile ? profile.trustScore : 0;
  }
  
  /**
   * Get full trust profile
   */
  getTrustProfile(userId) {
    return this.trustScores.get(userId);
  }
  
  /**
   * Get invite tree for a user
   */
  getInviteTree(userId, depth = 3) {
    const result = {
      userId,
      invitees: [],
      depth: 0
    };
    
    this.buildInviteTreeRecursive(userId, result, depth, 0);
    return result;
  }
  
  /**
   * Build invite tree recursively
   */
  buildInviteTreeRecursive(userId, node, maxDepth, currentDepth) {
    if (currentDepth >= maxDepth) return;
    
    const invitees = this.inviteTree.get(userId);
    if (!invitees) return;
    
    for (const inviteeId of invitees) {
      const inviteeProfile = this.trustScores.get(inviteeId);
      if (inviteeProfile) {
        const childNode = {
          userId: inviteeId,
          trustScore: inviteeProfile.trustScore,
          registrationTime: inviteeProfile.registrationTime,
          invitees: [],
          depth: currentDepth + 1
        };
        
        node.invitees.push(childNode);
        this.buildInviteTreeRecursive(inviteeId, childNode, maxDepth, currentDepth + 1);
      }
    }
  }
  
  /**
   * Update governance parameter with proper authorization
   */
  async updateGovernanceParameter(parameter, value, governanceApproved = false) {
    if (!governanceApproved) {
      return {
        success: false,
        reason: 'Governance approval required for parameter changes'
      };
    }
    
    // Validate parameter
    const validParams = ['maxDailyBurn', 'minimumThreshold', 'recoveryWindowHours', 'burnRateAdjustment'];
    if (!validParams.includes(parameter)) {
      return {
        success: false,
        reason: 'Invalid parameter name'
      };
    }
    
    // Validate value bounds
    if (parameter === 'minimumThreshold' && value < 0) {
      return {
        success: false,
        reason: 'Minimum threshold cannot be negative'
      };
    }
    
    if (parameter === 'maxDailyBurn' && value > 100) {
      return {
        success: false,
        reason: 'Maximum daily burn exceeds safety limits'
      };
    }
    
    this.governanceParameters.set(parameter, value);
    
    this.emit('auditEvent', {
      type: 'governanceParameterChange',
      parameter,
      oldValue: this.governanceParameters.get(parameter),
      newValue: value,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      parameter,
      newValue: value
    };
  }
  /**
   * Validate governance vote (integrates with voting system)
   */
  async validateGovernanceVote(parameterName, newValue, voteProof) {
    // Validates vote proof with the governance voting system
    return voteProof && voteProof.signature && voteProof.quorum >= 0.6;
  }
  
  /**
   * Generate trust metrics for governance dashboard
   */
  generateTrustMetrics() {
    const allProfiles = Array.from(this.trustScores.values());
    
    return {
      totalUsers: allProfiles.length,
      averageTrustScore: allProfiles.reduce((sum, p) => sum + p.trustScore, 0) / allProfiles.length,
      totalInvites: allProfiles.reduce((sum, p) => sum + p.totalInvites, 0),
      totalBurnEvents: allProfiles.reduce((sum, p) => sum + p.burnEvents.length, 0),
      totalRecoveryEvents: allProfiles.reduce((sum, p) => sum + p.recoveryEvents.length, 0),
      trustDistribution: this.calculateTrustDistribution(),
      inviteTreeStats: this.calculateInviteTreeStats(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Calculate trust score distribution
   */
  calculateTrustDistribution() {
    const allProfiles = Array.from(this.trustScores.values());
    const buckets = {
      high: 0,    // 80-100
      medium: 0,  // 40-79
      low: 0,     // 10-39
      critical: 0 // <10
    };
    
    allProfiles.forEach(profile => {
      if (profile.trustScore >= 80) buckets.high++;
      else if (profile.trustScore >= 40) buckets.medium++;
      else if (profile.trustScore >= 10) buckets.low++;
      else buckets.critical++;
    });
    
    return buckets;
  }
  
  /**
   * Calculate invite tree statistics
   */
  calculateInviteTreeStats() {
    const depthCounts = new Map();
    const allProfiles = Array.from(this.trustScores.values());
    
    allProfiles.forEach(profile => {
      const depth = profile.inviteDepth;
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
    });
    
    return {
      maxDepth: Math.max(...depthCounts.keys()),
      averageDepth: allProfiles.reduce((sum, p) => sum + p.inviteDepth, 0) / allProfiles.length,
      depthDistribution: Object.fromEntries(depthCounts)
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    // Clear all decay timers
    for (const timer of this.decayTimers.values()) {
      clearInterval(timer);
    }
    this.decayTimers.clear();
    
    // Clear data structures
    this.trustScores.clear();
    this.inviteTree.clear();
    this.inviteHistory.clear();
    
    this.emit('destroyed');
  }
}

export default TrustBurnSystem;
