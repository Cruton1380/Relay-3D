/**
 * TRUST BURN MECHANISM
 * Implements inviter penalty system for Sybil account detection
 * Includes appeal processes and graduated penalty scales
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import EventEmitter from 'events';
// Import Account Status Manager for termination actions
import AccountStatusManager from './accountStatusManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TrustBurnEngine extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadTrustBurnConfig();
    this.inviteConnections = new Map();
    this.penaltyHistory = new Map();
    this.appealCases = new Map();
    // Initialize Account Status Manager
    this.accountStatusManager = new AccountStatusManager();
  }

  loadTrustBurnConfig() {
    try {
      const configPath = join(__dirname, '../config/jurySystem.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.jurySystem.trustBurn || this.getDefaultTrustBurnConfig();
    } catch (error) {
      console.warn('Failed to load trust burn config, using defaults');
      return this.getDefaultTrustBurnConfig();
    }
  }

  getDefaultTrustBurnConfig() {
    return {
      enabled: true,
      penaltyTiers: {
        firstOffense: {
          trustPenalty: 10,
          suspensionDays: 7,
          appealWindow: "14d"
        },
        secondOffense: {
          trustPenalty: 25,
          suspensionDays: 30,
          appealWindow: "30d"
        },
        thirdOffense: {
          trustPenalty: 50,
          suspensionDays: 90,
          appealWindow: "60d"
        },
        chronicOffender: {
          trustPenalty: 100,
          suspensionDays: 365,
          appealWindow: "90d"
        }
      },
      juryRequirements: {
        minimumSupermajority: 0.75, // 75% agreement required
        minimumJurySize: 7,
        requiredConfidence: 0.85
      },
      inviteTreeDepth: 3, // How many levels up to penalize
      inviteTreeDecay: 0.5, // Penalty reduction per level
      appealTokenCost: 50, // Trust tokens required to file appeal
      communityVotingEnabled: true
    };
  }

  /**
   * Process jury verdict and apply trust burns if Sybil confirmed
   */
  async processJuryVerdict(juryResult, flaggedAccount) {
    try {
      console.log(`[TRUST_BURN] Processing jury verdict for account: ${flaggedAccount.userId}`);
      
      // Validate jury supermajority requirement
      if (!await this.validateSupermajority(juryResult)) {
        console.log('[TRUST_BURN] Insufficient supermajority for trust burn');
        return { trustBurnApplied: false, reason: 'insufficient_supermajority' };
      }
      
      // Only proceed if jury confirmed Sybil behavior
      if (juryResult.verdict !== 'sybil_confirmed') {
        console.log('[TRUST_BURN] No Sybil confirmation, no trust burn applied');
        return { trustBurnApplied: false, reason: 'no_sybil_confirmation' };
      }
        // Process account termination/suspension through Account Status Manager
      const enforcementResult = await this.accountStatusManager.processSybilVerdict(juryResult, flaggedAccount);
      
      if (!enforcementResult.actionTaken) {
        console.log('[TRUST_BURN] No enforcement action taken by Account Status Manager');
        return { 
          trustBurnApplied: false, 
          reason: enforcementResult.reason,
          enforcementResult 
        };
      }
      
      // Get invite tree for trust penalties on inviters
      const inviteTree = await this.getInviteTree(flaggedAccount.userId);
      
      let penaltyResults = [];
      let appealOpportunities = [];
      
      if (inviteTree && inviteTree.length > 0) {
        // Calculate and apply penalties to invite tree
        penaltyResults = await this.applyTrustPenalties(inviteTree, juryResult);
        
        // Create appeal opportunities
        appealOpportunities = await this.createAppealOpportunities(penaltyResults, juryResult);
        
        console.log(`[TRUST_BURN] Trust penalties applied to ${penaltyResults.length} accounts in invite tree`);
      } else {
        console.log('[TRUST_BURN] No invite tree found, no trust penalties applied to inviters');
      }
      
      console.log(`[TRUST_BURN] Complete enforcement: ${enforcementResult.action} for ${flaggedAccount.userId}`);
      
      return {
        trustBurnApplied: true,
        enforcementAction: enforcementResult.action,        primaryAccountAction: enforcementResult,
        penaltiesApplied: penaltyResults.length,
        totalTrustBurned: penaltyResults.reduce((sum, p) => sum + p.trustPenalty, 0),
        appealOpportunities: appealOpportunities.length,
        appealDeadline: enforcementResult.appealDeadline || Date.now() + this.parseTimeWindow(this.config.penaltyTiers.firstOffense.appealWindow)
      };
      
      // Emit trust burn completion event
      this.emit('trust_burn_completed', {
        juryResult,
        flaggedAccount,
        enforcementResult: finalResult,
        timestamp: Date.now()
      });
      
      return finalResult;
      
    } catch (error) {
      console.error('[TRUST_BURN] Error processing jury verdict:', error);
      throw new Error(`Trust burn processing failed: ${error.message}`);
    }
  }

  /**
   * Validate jury supermajority meets requirements
   */
  async validateSupermajority(juryResult) {
    const { votes, jurySize, confidence } = juryResult;
    
    // Check minimum jury size
    if (jurySize < this.config.juryRequirements.minimumJurySize) {
      return false;
    }
    
    // Check supermajority threshold
    const sybilVotes = votes.filter(v => v.verdict === 'sybil_confirmed').length;
    const agreement = sybilVotes / jurySize;
    
    if (agreement < this.config.juryRequirements.minimumSupermajority) {
      return false;
    }
    
    // Check confidence threshold
    if (confidence < this.config.juryRequirements.requiredConfidence) {
      return false;
    }
    
    return true;
  }

  /**
   * Get invite tree for trust burn application
   */
  async getInviteTree(userId) {
    // Check cache first
    if (this.inviteTreeCache.has(userId)) {
      const cached = this.inviteTreeCache.get(userId);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.tree;
      }
    }
    
    // Mock implementation - would query actual invite database
    const tree = [];
    let currentUserId = userId;
    
    for (let level = 0; level < this.config.inviteTreeDepth; level++) {
      const inviter = await this.getInviter(currentUserId);
      if (!inviter) break;
      
      tree.push({
        userId: inviter.userId,
        level: level + 1,
        inviteDate: inviter.inviteDate,
        trustScore: inviter.trustScore,
        previousOffenses: await this.getPreviousOffenses(inviter.userId)
      });
      
      currentUserId = inviter.userId;
    }
    
    // Cache result
    this.inviteTreeCache.set(userId, {
      tree,
      timestamp: Date.now()
    });
    
    return tree;
  }

  /**
   * Apply graduated trust penalties to invite tree
   */
  async applyTrustPenalties(inviteTree, juryResult) {
    const penalties = [];
    
    for (const inviter of inviteTree) {
      // Calculate penalty based on level and previous offenses
      const basePenalty = this.calculateBasePenalty(inviter.previousOffenses);
      const levelDecay = Math.pow(this.config.inviteTreeDecay, inviter.level - 1);
      const finalPenalty = Math.floor(basePenalty * levelDecay);
      
      if (finalPenalty > 0) {
        const penalty = {
          userId: inviter.userId,
          trustPenalty: finalPenalty,
          level: inviter.level,
          reason: 'sybil_invite_penalty',
          juryCase: juryResult.caseId,
          appealEligible: true,
          appealDeadline: Date.now() + this.parseTimeWindow(this.getPenaltyTier(inviter.previousOffenses).appealWindow),
          appliedAt: Date.now()
        };
        
        // Apply penalty (mock - would update actual trust scores)
        await this.applyTrustPenalty(penalty);
        penalties.push(penalty);
        
        console.log(`[TRUST_BURN] Applied penalty: ${finalPenalty} trust to ${inviter.userId} (level ${inviter.level})`);
      }
    }
    
    return penalties;
  }

  /**
   * Calculate base penalty based on offense history
   */
  calculateBasePenalty(previousOffenses) {
    const offenseCount = previousOffenses.length;
    
    if (offenseCount === 0) {
      return this.config.penaltyTiers.firstOffense.trustPenalty;
    } else if (offenseCount === 1) {
      return this.config.penaltyTiers.secondOffense.trustPenalty;
    } else if (offenseCount === 2) {
      return this.config.penaltyTiers.thirdOffense.trustPenalty;
    } else {
      return this.config.penaltyTiers.chronicOffender.trustPenalty;
    }
  }

  /**
   * Create appeal opportunities for penalized users
   */
  async createAppealOpportunities(penalties, juryResult) {
    for (const penalty of penalties) {
      const appealCase = {
        appealId: crypto.randomBytes(16).toString('hex'),
        originalPenalty: penalty,
        originalJuryCase: juryResult.caseId,
        appealWindow: {
          start: Date.now(),
          end: penalty.appealDeadline
        },
        status: 'open',
        evidence: [],
        counterarguments: [],
        appealTokensRequired: this.config.appealTokenCost,
        communityVotingEnabled: this.config.communityVotingEnabled
      };
      
      this.appealCases.set(appealCase.appealId, appealCase);
      
      // Notify user of appeal opportunity
      await this.notifyAppealOpportunity(penalty.userId, appealCase);
    }
  }

  /**
   * Process appeal submission
   */
  async processAppeal(appealId, evidence, appealTokens) {
    const appealCase = this.appealCases.get(appealId);
    
    if (!appealCase) {
      throw new Error('Appeal case not found');
    }
    
    if (appealCase.status !== 'open') {
      throw new Error('Appeal window closed');
    }
    
    if (Date.now() > appealCase.appealWindow.end) {
      throw new Error('Appeal deadline passed');
    }
    
    if (appealTokens < appealCase.appealTokensRequired) {
      throw new Error('Insufficient appeal tokens');
    }
    
    // Process appeal evidence
    appealCase.evidence.push({
      submittedAt: Date.now(),
      evidence,
      appealTokensSpent: appealTokens
    });
    
    appealCase.status = 'under_review';
    
    // Initiate community voting if enabled
    if (appealCase.communityVotingEnabled) {
      await this.initiateAppealVoting(appealCase);
    }
    
    return {
      appealSubmitted: true,
      appealId,
      reviewProcess: appealCase.communityVotingEnabled ? 'community_voting' : 'jury_review'
    };
  }

  /**
   * Reverse trust burn if appeal successful
   */
  async reverseTrustBurn(appealId, reverseReason) {
    const appealCase = this.appealCases.get(appealId);
    
    if (!appealCase) {
      throw new Error('Appeal case not found');
    }
    
    const penalty = appealCase.originalPenalty;
    
    // Restore trust points
    await this.restoreTrustPoints(penalty.userId, penalty.trustPenalty);
    
    // Mark penalty as reversed
    penalty.reversed = true;
    penalty.reverseReason = reverseReason;
    penalty.reversedAt = Date.now();
    
    appealCase.status = 'successful';
    
    console.log(`[TRUST_BURN] Reversed penalty: ${penalty.trustPenalty} trust restored to ${penalty.userId}`);
    
    return {
      trustRestored: penalty.trustPenalty,
      reverseReason,
      reversedAt: penalty.reversedAt
    };
  }

  // Helper methods (mock implementations)
  
  async getInviter(userId) {
    // Mock - would query actual invite database
    return {
      userId: `inviter_${userId}`,
      inviteDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
      trustScore: 75 + Math.random() * 25
    };
  }

  async getPreviousOffenses(userId) {
    // Mock - would query offense history
    return [];
  }

  getPenaltyTier(previousOffenses) {
    const count = previousOffenses.length;
    if (count === 0) return this.config.penaltyTiers.firstOffense;
    if (count === 1) return this.config.penaltyTiers.secondOffense;
    if (count === 2) return this.config.penaltyTiers.thirdOffense;
    return this.config.penaltyTiers.chronicOffender;
  }

  async applyTrustPenalty(penalty) {
    // Mock - would update actual user trust scores
    console.log(`[TRUST_BURN] Mock: Applied ${penalty.trustPenalty} trust penalty to ${penalty.userId}`);
  }

  async restoreTrustPoints(userId, amount) {
    // Mock - would restore actual trust points
    console.log(`[TRUST_BURN] Mock: Restored ${amount} trust points to ${userId}`);
  }

  async notifyAppealOpportunity(userId, appealCase) {
    // Mock - would send actual notification
    console.log(`[TRUST_BURN] Mock: Notified ${userId} of appeal opportunity ${appealCase.appealId}`);
  }

  async initiateAppealVoting(appealCase) {
    // Mock - would start community voting process
    console.log(`[TRUST_BURN] Mock: Initiated appeal voting for ${appealCase.appealId}`);
  }

  parseTimeWindow(timeStr) {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return value;
    }
  }
}

export default TrustBurnEngine;
