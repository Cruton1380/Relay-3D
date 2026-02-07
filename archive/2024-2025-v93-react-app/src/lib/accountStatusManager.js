/**
 * ACCOUNT STATUS MANAGER
 * Handles account termination, suspension, and status management
 * Integrates with jury system for Sybil account detection and enforcement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AccountStatusManager extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadConfig();
    this.accountStatuses = new Map();
    this.suspensionHistory = new Map();
    this.terminationLog = new Map();
    this.appealCases = new Map();
    this.dataFile = join(__dirname, '../data/accountStatuses.json');
    this.loadAccountData();
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/jurySystem.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.jurySystem.accountManagement || this.getDefaultConfig();
    } catch (error) {
      console.warn('Failed to load account management config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      suspensionLevels: {
        warning: {
          duration: "3d",
          restrictions: ["reduced_voting_weight"],
          appealable: true
        },
        temporary: {
          duration: "14d", 
          restrictions: ["no_voting", "no_inviting", "reduced_visibility"],
          appealable: true
        },
        extended: {
          duration: "90d",
          restrictions: ["account_frozen", "no_platform_access"],
          appealable: true
        },
        permanent: {
          duration: "indefinite",
          restrictions: ["account_terminated", "data_retention_only"],
          appealable: true,
          appealWindow: "30d"
        }
      },
      terminationCriteria: {
        sybilConfirmationRequired: true,
        jurySupermajorityRequired: 0.8, // 80% agreement
        evidenceStandardRequired: "high",
        appealProcessMandatory: true
      },
      dataRetention: {
        suspendedAccountData: "180d", // Keep data for appeal purposes
        terminatedAccountData: "365d", // Legal compliance period
        anonymizeAfterTermination: true
      },
      appealProcess: {
        maxAppealsPerCase: 2,
        appealReviewWindow: "14d",
        requireNewEvidence: true,
        independentJuryRequired: true
      }
    };
  }

  /**
   * Load account status data from persistent storage
   */
  loadAccountData() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        
        // Restore Maps from JSON
        if (data.accountStatuses) {
          for (const [userId, status] of Object.entries(data.accountStatuses)) {
            this.accountStatuses.set(userId, status);
          }
        }
        
        if (data.suspensionHistory) {
          for (const [userId, history] of Object.entries(data.suspensionHistory)) {
            this.suspensionHistory.set(userId, history);
          }
        }
        
        if (data.terminationLog) {
          for (const [userId, termination] of Object.entries(data.terminationLog)) {
            this.terminationLog.set(userId, termination);
          }
        }
        
        if (data.appealCases) {
          for (const [caseId, appeal] of Object.entries(data.appealCases)) {
            this.appealCases.set(caseId, appeal);
          }
        }
        
        console.log('[ACCOUNT_STATUS] Account data loaded successfully');
      }
    } catch (error) {
      console.error('[ACCOUNT_STATUS] Error loading account data:', error);
    }
  }

  /**
   * Save account status data to persistent storage
   */
  async saveAccountData() {
    try {
      const data = {
        accountStatuses: Object.fromEntries(this.accountStatuses),
        suspensionHistory: Object.fromEntries(this.suspensionHistory),
        terminationLog: Object.fromEntries(this.terminationLog),
        appealCases: Object.fromEntries(this.appealCases),
        lastUpdated: Date.now()
      };
      
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log('[ACCOUNT_STATUS] Account data saved successfully');
    } catch (error) {
      console.error('[ACCOUNT_STATUS] Error saving account data:', error);
      throw error;
    }
  }
  /**
   * Process jury verdict for Sybil account termination
   */
  async processSybilVerdict(juryResult, flaggedAccount) {
    try {
      console.log(`[ACCOUNT_STATUS] Processing Sybil verdict for: ${flaggedAccount.userId}`);
      
      // Apply appropriate enforcement action based on verdict
      let enforcementResult;
      
      switch (juryResult.verdict) {
        case 'sybil_confirmed':
          // Validate jury verdict meets termination criteria for confirmed Sybil
          if (!this.validateTerminationCriteria(juryResult)) {
            console.log('[ACCOUNT_STATUS] Jury verdict does not meet termination criteria');
            return { 
              actionTaken: false, 
              reason: 'insufficient_evidence_or_consensus',
              verdict: juryResult.verdict,
              consensusLevel: juryResult.consensusLevel
            };
          }
          enforcementResult = await this.terminateAccount(flaggedAccount, juryResult);
          break;
          
        case 'suspicious_activity':
          // For suspicious activity, use lower threshold for suspension
          if (juryResult.consensusLevel < 0.6) {
            console.log('[ACCOUNT_STATUS] Insufficient consensus for suspension');
            return { 
              actionTaken: false, 
              reason: 'insufficient_consensus_for_suspension',
              verdict: juryResult.verdict,
              consensusLevel: juryResult.consensusLevel
            };
          }
          enforcementResult = await this.suspendAccount(flaggedAccount, 'extended', juryResult);
          break;
          
        case 'insufficient_evidence':
          // For warnings, any jury decision is acceptable
          enforcementResult = await this.issueWarning(flaggedAccount, juryResult);
          break;
          
        default:
          console.log('[ACCOUNT_STATUS] No action required for verdict:', juryResult.verdict);
          return { actionTaken: false, reason: 'no_action_required' };
      }
      
      // Save changes
      await this.saveAccountData();
      
      // Emit enforcement event
      this.emit('enforcement_action', {
        userId: flaggedAccount.userId,
        action: enforcementResult.action,
        juryResult,
        timestamp: Date.now()
      });
      
      return enforcementResult;
      
    } catch (error) {
      console.error('[ACCOUNT_STATUS] Error processing Sybil verdict:', error);
      throw error;
    }
  }

  /**
   * Validate if jury verdict meets account termination criteria
   */
  validateTerminationCriteria(juryResult) {
    const criteria = this.config.terminationCriteria;
    
    // Check if Sybil confirmation is required and present
    if (criteria.sybilConfirmationRequired && juryResult.verdict !== 'sybil_confirmed') {
      return false;
    }
    
    // Check supermajority requirement
    if (juryResult.consensusLevel < criteria.jurySupermajorityRequired) {
      console.log(`[ACCOUNT_STATUS] Insufficient consensus: ${juryResult.consensusLevel} < ${criteria.jurySupermajorityRequired}`);
      return false;
    }
    
    // Check evidence standard
    if (criteria.evidenceStandardRequired === 'high' && !juryResult.highConfidenceEvidence) {
      console.log('[ACCOUNT_STATUS] Evidence standard not met');
      return false;
    }
    
    return true;
  }

  /**
   * Terminate account permanently for confirmed Sybil behavior
   */
  async terminateAccount(account, juryResult) {
    const terminationId = crypto.randomUUID();
    const timestamp = Date.now();
    
    const termination = {
      terminationId,
      userId: account.userId,
      reason: 'sybil_confirmed',
      juryResult,
      timestamp,
      enforcedBy: 'jury_system',
      restrictions: this.config.suspensionLevels.permanent.restrictions,
      appealDeadline: timestamp + this.parseTimeWindow(this.config.suspensionLevels.permanent.appealWindow),
      dataRetentionUntil: timestamp + this.parseTimeWindow(this.config.dataRetention.terminatedAccountData),
      status: 'terminated'
    };
    
    // Update account status
    this.accountStatuses.set(account.userId, {
      status: 'terminated',
      terminationId,
      lastUpdated: timestamp,
      restrictions: termination.restrictions
    });
    
    // Log termination
    this.terminationLog.set(account.userId, termination);
    
    // Create mandatory appeal case
    if (this.config.terminationCriteria.appealProcessMandatory) {
      await this.createAppealCase(account.userId, terminationId, 'automatic');
    }
    
    console.log(`[ACCOUNT_STATUS] Account terminated: ${account.userId}`);
    
    return {
      actionTaken: true,
      action: 'account_terminated',
      terminationId,
      appealDeadline: termination.appealDeadline,
      restrictions: termination.restrictions
    };
  }

  /**
   * Suspend account with graduated penalties
   */
  async suspendAccount(account, suspensionLevel, juryResult) {
    const suspensionId = crypto.randomUUID();
    const timestamp = Date.now();
    const levelConfig = this.config.suspensionLevels[suspensionLevel];
    
    if (!levelConfig) {
      throw new Error(`Invalid suspension level: ${suspensionLevel}`);
    }
    
    const suspension = {
      suspensionId,
      userId: account.userId,
      level: suspensionLevel,
      reason: juryResult.verdict,
      juryResult,
      timestamp,
      duration: this.parseTimeWindow(levelConfig.duration),
      expiresAt: timestamp + this.parseTimeWindow(levelConfig.duration),
      restrictions: levelConfig.restrictions,
      appealable: levelConfig.appealable,
      status: 'active'
    };
    
    // Update account status
    this.accountStatuses.set(account.userId, {
      status: 'suspended',
      suspensionLevel,
      suspensionId,
      expiresAt: suspension.expiresAt,
      lastUpdated: timestamp,
      restrictions: suspension.restrictions
    });
    
    // Add to suspension history
    if (!this.suspensionHistory.has(account.userId)) {
      this.suspensionHistory.set(account.userId, []);
    }
    this.suspensionHistory.get(account.userId).push(suspension);
    
    console.log(`[ACCOUNT_STATUS] Account suspended (${suspensionLevel}): ${account.userId}`);
    
    return {
      actionTaken: true,
      action: 'account_suspended',
      suspensionLevel,
      suspensionId,
      expiresAt: suspension.expiresAt,
      restrictions: suspension.restrictions,
      appealable: suspension.appealable
    };
  }

  /**
   * Issue warning to account
   */
  async issueWarning(account, juryResult) {
    const warningId = crypto.randomUUID();
    const timestamp = Date.now();
    
    const warning = {
      warningId,
      userId: account.userId,
      reason: juryResult.verdict,
      juryResult,
      timestamp,
      level: 'warning',
      restrictions: this.config.suspensionLevels.warning.restrictions,
      status: 'active'
    };
    
    // Update account status
    this.accountStatuses.set(account.userId, {
      status: 'warned',
      warningId,
      lastUpdated: timestamp,
      restrictions: warning.restrictions
    });
    
    // Add to suspension history (warnings are tracked as level 0 suspensions)
    if (!this.suspensionHistory.has(account.userId)) {
      this.suspensionHistory.set(account.userId, []);
    }
    this.suspensionHistory.get(account.userId).push(warning);
    
    console.log(`[ACCOUNT_STATUS] Warning issued: ${account.userId}`);
    
    return {
      actionTaken: true,
      action: 'warning_issued',
      warningId,
      restrictions: warning.restrictions
    };
  }

  /**
   * Create appeal case for enforcement action
   */
  async createAppealCase(userId, enforcementId, appealType = 'user_initiated') {
    const appealId = crypto.randomUUID();
    const timestamp = Date.now();
    
    const appeal = {
      appealId,
      userId,
      enforcementId,
      appealType,
      status: 'pending',
      createdAt: timestamp,
      reviewDeadline: timestamp + this.parseTimeWindow(this.config.appealProcess.appealReviewWindow),
      requiresNewEvidence: this.config.appealProcess.requireNewEvidence,
      independentJuryRequired: this.config.appealProcess.independentJuryRequired,
      evidence: [],
      reviewHistory: []
    };
    
    this.appealCases.set(appealId, appeal);
    
    console.log(`[ACCOUNT_STATUS] Appeal case created: ${appealId} for user ${userId}`);
    
    return appealId;
  }

  /**
   * Get current account status
   */
  getAccountStatus(userId) {
    return this.accountStatuses.get(userId) || { 
      status: 'active', 
      lastUpdated: Date.now(),
      restrictions: []
    };
  }

  /**
   * Check if account is restricted from specific action
   */
  isActionRestricted(userId, action) {
    const status = this.getAccountStatus(userId);
    
    if (status.status === 'active') {
      return false;
    }
    
    return status.restrictions && status.restrictions.includes(action);
  }

  /**
   * Get account enforcement history
   */
  getEnforcementHistory(userId) {
    return {
      suspensions: this.suspensionHistory.get(userId) || [],
      termination: this.terminationLog.get(userId) || null,
      appeals: Array.from(this.appealCases.values()).filter(appeal => appeal.userId === userId)
    };
  }

  /**
   * Get comprehensive account history for a user
   */
  async getAccountHistory(userId) {
    try {
      const statusData = this.accountStatuses.get(userId);
      const suspensionData = this.suspensionHistory.get(userId) || [];
      const terminationData = this.terminationLog.get(userId);
      const appealData = this.appealCases.get(userId) || [];

      return {
        userId: userId,
        currentStatus: statusData || { status: 'active', created: Date.now() },
        suspensionHistory: suspensionData.map(suspension => ({
          type: suspension.type,
          reason: suspension.reason,
          startDate: new Date(suspension.startDate).toISOString(),
          endDate: suspension.endDate ? new Date(suspension.endDate).toISOString() : null,
          duration: suspension.duration,
          restrictions: suspension.restrictions,
          appealable: suspension.appealable,
          appealStatus: suspension.appealStatus || 'none'
        })),
        terminationHistory: terminationData ? [{
          reason: terminationData.reason,
          date: new Date(terminationData.date).toISOString(),
          permanent: terminationData.permanent,
          appealable: terminationData.appealable,
          appealStatus: terminationData.appealStatus || 'none'
        }] : [],
        appeals: appealData.map(appeal => ({
          appealId: appeal.appealId,
          type: appeal.type,
          reason: appeal.reason,
          status: appeal.status,
          submittedDate: new Date(appeal.submittedDate).toISOString(),
          resolvedDate: appeal.resolvedDate ? new Date(appeal.resolvedDate).toISOString() : null,
          outcome: appeal.outcome
        })),
        summary: {
          totalSuspensions: suspensionData.length,
          totalTerminations: terminationData ? 1 : 0,
          totalAppeals: appealData.length,
          currentlyActive: !statusData || statusData.status === 'active',
          riskLevel: this.calculateUserRiskLevel(userId)
        }
      };
    } catch (error) {
      console.error('[ACCOUNT_STATUS] Error getting account history:', error);
      throw new Error(`Failed to get account history: ${error.message}`);
    }
  }

  /**
   * Calculate user risk level based on history
   */
  calculateUserRiskLevel(userId) {
    const statusData = this.accountStatuses.get(userId);
    const suspensionData = this.suspensionHistory.get(userId) || [];
    const terminationData = this.terminationLog.get(userId);

    if (terminationData) {
      return 'critical';
    }

    if (statusData && statusData.status === 'suspended') {
      return 'high';
    }

    const recentSuspensions = suspensionData.filter(suspension => 
      Date.now() - suspension.startDate < (30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    if (recentSuspensions.length >= 3) {
      return 'high';
    } else if (recentSuspensions.length >= 1) {
      return 'medium';
    } else if (suspensionData.length > 0) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Clean up expired suspensions
   */
  async cleanupExpiredSuspensions() {
    const now = Date.now();
    let cleanupCount = 0;
    
    for (const [userId, status] of this.accountStatuses.entries()) {
      if (status.status === 'suspended' && status.expiresAt && status.expiresAt <= now) {
        // Suspension has expired, restore account to active status
        this.accountStatuses.set(userId, {
          status: 'active',
          lastUpdated: now,
          restrictions: [],
          previousSuspension: status
        });
        
        cleanupCount++;
        console.log(`[ACCOUNT_STATUS] Suspension expired for user: ${userId}`);
      }
    }
    
    if (cleanupCount > 0) {
      await this.saveAccountData();
      console.log(`[ACCOUNT_STATUS] Cleaned up ${cleanupCount} expired suspensions`);
    }
    
    return cleanupCount;
  }

  /**
   * Parse time window string to milliseconds
   */
  parseTimeWindow(timeStr) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };
    
    const match = timeStr.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Start periodic cleanup of expired suspensions
   */
  startPeriodicCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredSuspensions().catch(error => {
        console.error('[ACCOUNT_STATUS] Error during periodic cleanup:', error);
      });
    }, 60 * 60 * 1000);
    
    console.log('[ACCOUNT_STATUS] Periodic cleanup started');
  }
}

export default AccountStatusManager;
