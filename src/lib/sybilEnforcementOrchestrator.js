/**
 * SYBIL ENFORCEMENT ORCHESTRATOR
 * Main integration service that coordinates jury verdicts with account enforcement actions
 * Handles the complete flow from Sybil detection to account termination and appeal processes
 */

import JurySortitionEngine from './jurySortitionEngine.js';
import ReverificationFlowEngine from './reverificationFlow.js';
import JuryBadgeGenerator from './juryBadgeGenerator.js';
import JuryChainLogger from './juryChainLogger.js';
import TrustBurnEngine from './trustBurnEngine.js';
import AccountStatusManager from './accountStatusManager.js';
import EventEmitter from 'events';

class SybilEnforcementOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // Initialize all subsystems
    this.jurySortition = new JurySortitionEngine();
    this.reverification = new ReverificationFlowEngine();
    this.badgeGenerator = new JuryBadgeGenerator();
    this.chainLogger = new JuryChainLogger();
    this.trustBurn = new TrustBurnEngine();
    this.accountStatus = new AccountStatusManager();
    
    // Track active cases
    this.activeCases = new Map();
    this.enforcementHistory = new Map();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('[SYBIL_ENFORCEMENT] Orchestrator initialized');
  }

  /**
   * Set up event listeners between subsystems
   */
  setupEventListeners() {
    // Listen for jury verdict completion
    this.jurySortition.on('juryVerdictReached', this.handleJuryVerdict.bind(this));
    
    // Listen for reverification completion
    this.reverification.on('verificationCompleted', this.handleReverificationResult.bind(this));
    
    // Listen for enforcement actions
    this.accountStatus.on('enforcement_action', this.handleEnforcementAction.bind(this));
    
    // Listen for trust burn completion
    this.trustBurn.on('trust_burn_completed', this.handleTrustBurnCompletion.bind(this));
    
    console.log('[SYBIL_ENFORCEMENT] Event listeners configured');
  }

  /**
   * Main entry point: Process a suspected Sybil account
   */
  async processSybilCase(suspicionReport) {
    try {
      const caseId = `sybil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[SYBIL_ENFORCEMENT] Starting Sybil case: ${caseId}`);
      console.log(`[SYBIL_ENFORCEMENT] Flagged user: ${suspicionReport.userId}`);
      console.log(`[SYBIL_ENFORCEMENT] Suspicion reason: ${suspicionReport.reason}`);
      
      // Initialize case tracking
      const sybilCase = {
        caseId,
        userId: suspicionReport.userId,
        suspicionReport,
        status: 'initiated',
        startedAt: Date.now(),
        stages: {
          reverificationInitiated: false,
          jurySelectionCompleted: false,
          juryVerdictReached: false,
          enforcementActionTaken: false,
          appealProcessCreated: false
        },
        timeline: []
      };
      
      this.activeCases.set(caseId, sybilCase);
      
      // Record case initiation
      sybilCase.timeline.push({
        stage: 'case_initiated',
        timestamp: Date.now(),
        data: suspicionReport
      });
      
      // Step 1: Initiate reverification if needed
      if (suspicionReport.requiresReverification) {
        await this.initiateReverificationFlow(sybilCase);
      } else {
        // Skip directly to jury if reverification not needed
        await this.initiateJuryProcess(sybilCase);
      }
      
      return {
        success: true,
        caseId,
        status: sybilCase.status,
        nextStage: sybilCase.status === 'reverification_pending' ? 'reverification' : 'jury_selection'
      };
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error processing Sybil case:', error);
      throw new Error(`Sybil case processing failed: ${error.message}`);
    }
  }

  /**
   * Initiate reverification flow for suspected account
   */
  async initiateReverificationFlow(sybilCase) {
    try {
      console.log(`[SYBIL_ENFORCEMENT] Initiating reverification for case: ${sybilCase.caseId}`);
      
      const reverificationRequest = {
        userId: sybilCase.userId,
        caseId: sybilCase.caseId,
        type: sybilCase.suspicionReport.duplicateAccount ? 'duplicate_account' : 'single_account',
        reason: sybilCase.suspicionReport.reason,
        region: sybilCase.suspicionReport.region
      };
      
      const reverificationResult = await this.reverification.initiateReverification(reverificationRequest);
      
      if (reverificationResult.success) {
        sybilCase.status = 'reverification_pending';
        sybilCase.stages.reverificationInitiated = true;
        sybilCase.reverificationId = reverificationResult.verificationId;
          sybilCase.timeline.push({
          stage: 'reverification_initiated',
          timestamp: Date.now(),
          data: reverificationResult
        });
        
        console.log(`[SYBIL_ENFORCEMENT] Reverification initiated: ${reverificationResult.verificationId}`);
        
        // Simulate reverification completion for testing (in production this would be real user interaction)
        setTimeout(() => {
          this.reverification.simulateReverificationCompletion(
            reverificationResult.verificationId, 
            'verified' // Could be 'verified', 'failed', or 'duplicate_detected'
          );
        }, 200); // Short delay for testing
      } else {
        throw new Error(`Reverification initiation failed: ${reverificationResult.error}`);
      }
      
    } catch (error) {
      sybilCase.status = 'reverification_failed';
      sybilCase.timeline.push({
        stage: 'reverification_failed',
        timestamp: Date.now(),
        error: error.message
      });
      
      console.error(`[SYBIL_ENFORCEMENT] Reverification failed for case ${sybilCase.caseId}:`, error);
      throw error;
    }
  }

  /**
   * Handle reverification completion and proceed to jury
   */
  async handleReverificationResult(verificationEvent) {
    try {
      const sybilCase = this.findCaseByVerificationId(verificationEvent.verificationId);
      
      if (!sybilCase) {
        console.warn(`[SYBIL_ENFORCEMENT] No case found for verification: ${verificationEvent.verificationId}`);
        return;
      }
      
      console.log(`[SYBIL_ENFORCEMENT] Reverification completed for case: ${sybilCase.caseId}`);
      console.log(`[SYBIL_ENFORCEMENT] Verification result: ${verificationEvent.result}`);
      
      sybilCase.reverificationResult = verificationEvent;
      sybilCase.timeline.push({
        stage: 'reverification_completed',
        timestamp: Date.now(),
        data: verificationEvent
      });
      
      // Determine next action based on reverification result
      if (verificationEvent.result === 'verified') {
        // Account passed reverification - case should be dropped or downgraded
        sybilCase.status = 'cleared_by_reverification';
        
        console.log(`[SYBIL_ENFORCEMENT] Account cleared by reverification: ${sybilCase.userId}`);
        
        // Award badges to jurors for the reverification process
        await this.awardReverificationBadges(sybilCase);
        
      } else if (verificationEvent.result === 'duplicate_detected' || verificationEvent.result === 'failed') {
        // Account failed reverification - proceed to jury
        sybilCase.status = 'reverification_failed_proceeding_to_jury';
        
        // Enhanced suspicion based on reverification failure
        sybilCase.suspicionReport.reverificationFailure = true;
        sybilCase.suspicionReport.confidenceLevel = 'high';
        
        await this.initiateJuryProcess(sybilCase);
        
      } else {
        console.warn(`[SYBIL_ENFORCEMENT] Unexpected reverification result: ${verificationEvent.result}`);
      }
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error handling reverification result:', error);
    }
  }

  /**
   * Initiate jury selection and deliberation process
   */
  async initiateJuryProcess(sybilCase) {
    try {
      console.log(`[SYBIL_ENFORCEMENT] Initiating jury process for case: ${sybilCase.caseId}`);
      
      const juryRequest = {
        caseId: sybilCase.caseId,
        flaggedUserId: sybilCase.userId,
        suspicionReason: sybilCase.suspicionReport.reason,
        evidence: sybilCase.suspicionReport.evidence || [],
        reverificationResult: sybilCase.reverificationResult || null,
        urgencyLevel: sybilCase.suspicionReport.confidenceLevel || 'medium',
        region: sybilCase.suspicionReport.region
      };
      
      const juryResult = await this.jurySortition.selectAndConveneJury(juryRequest);
      
      if (juryResult.success) {
        sybilCase.status = 'jury_deliberating';
        sybilCase.stages.jurySelectionCompleted = true;
        sybilCase.juryId = juryResult.juryId;
        
        sybilCase.timeline.push({
          stage: 'jury_selection_completed',
          timestamp: Date.now(),
          data: juryResult
        });
        
        console.log(`[SYBIL_ENFORCEMENT] Jury selected: ${juryResult.juryId}`);
        console.log(`[SYBIL_ENFORCEMENT] Jury size: ${juryResult.jurySize}`);
      } else {
        throw new Error(`Jury selection failed: ${juryResult.error}`);
      }
      
    } catch (error) {
      sybilCase.status = 'jury_selection_failed';
      sybilCase.timeline.push({
        stage: 'jury_selection_failed',
        timestamp: Date.now(),
        error: error.message
      });
      
      console.error(`[SYBIL_ENFORCEMENT] Jury selection failed for case ${sybilCase.caseId}:`, error);
      throw error;
    }
  }

  /**
   * Handle jury verdict and trigger enforcement actions
   */
  async handleJuryVerdict(verdictEvent) {
    try {
      const sybilCase = this.findCaseByJuryId(verdictEvent.juryId);
      
      if (!sybilCase) {
        console.warn(`[SYBIL_ENFORCEMENT] No case found for jury: ${verdictEvent.juryId}`);
        return;
      }
      
      console.log(`[SYBIL_ENFORCEMENT] Jury verdict received for case: ${sybilCase.caseId}`);
      console.log(`[SYBIL_ENFORCEMENT] Verdict: ${verdictEvent.verdict}`);
      console.log(`[SYBIL_ENFORCEMENT] Consensus: ${verdictEvent.consensusLevel}`);
      
      sybilCase.status = 'jury_verdict_reached';
      sybilCase.stages.juryVerdictReached = true;
      sybilCase.juryVerdict = verdictEvent;
      
      sybilCase.timeline.push({
        stage: 'jury_verdict_reached',
        timestamp: Date.now(),
        data: verdictEvent
      });
      
      // Process verdict and apply enforcement actions
      await this.processVerdictEnforcement(sybilCase);
      
      // Award badges to jurors
      await this.awardJuryBadges(sybilCase);
      
      // Log to blockchain
      await this.logCaseToBlockchain(sybilCase);
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error handling jury verdict:', error);
    }
  }

  /**
   * Process jury verdict and apply appropriate enforcement actions
   */
  async processVerdictEnforcement(sybilCase) {
    try {
      console.log(`[SYBIL_ENFORCEMENT] Processing enforcement for case: ${sybilCase.caseId}`);
      
      const flaggedAccount = {
        userId: sybilCase.userId,
        suspicionReport: sybilCase.suspicionReport,
        reverificationResult: sybilCase.reverificationResult
      };
      
      // Apply trust burn and account enforcement through Trust Burn Engine
      const enforcementResult = await this.trustBurn.processJuryVerdict(sybilCase.juryVerdict, flaggedAccount);
      
      sybilCase.enforcementResult = enforcementResult;
      sybilCase.stages.enforcementActionTaken = true;
      
      if (enforcementResult.trustBurnApplied) {
        sybilCase.status = 'enforcement_completed';
        
        sybilCase.timeline.push({
          stage: 'enforcement_completed',
          timestamp: Date.now(),
          data: enforcementResult
        });
        
        console.log(`[SYBIL_ENFORCEMENT] Enforcement completed: ${enforcementResult.enforcementAction}`);
        console.log(`[SYBIL_ENFORCEMENT] Trust penalties: ${enforcementResult.penaltiesApplied}`);
        
        // Create appeal case if applicable
        if (enforcementResult.appealDeadline) {
          sybilCase.stages.appealProcessCreated = true;
          
          sybilCase.timeline.push({
            stage: 'appeal_process_created',
            timestamp: Date.now(),
            data: { appealDeadline: enforcementResult.appealDeadline }
          });
        }
        
      } else {
        sybilCase.status = 'no_enforcement_required';
        
        console.log(`[SYBIL_ENFORCEMENT] No enforcement required: ${enforcementResult.reason}`);
      }
      
      // Move case to completed cases
      this.enforcementHistory.set(sybilCase.caseId, sybilCase);
      this.activeCases.delete(sybilCase.caseId);
      
    } catch (error) {
      sybilCase.status = 'enforcement_failed';
      sybilCase.timeline.push({
        stage: 'enforcement_failed',
        timestamp: Date.now(),
        error: error.message
      });
      
      console.error(`[SYBIL_ENFORCEMENT] Enforcement failed for case ${sybilCase.caseId}:`, error);
      throw error;
    }
  }

  /**
   * Award badges to jurors for jury service
   */
  async awardJuryBadges(sybilCase) {
    try {
      if (!sybilCase.juryVerdict || !sybilCase.juryVerdict.jurors) {
        console.warn('[SYBIL_ENFORCEMENT] No juror information available for badge awards');
        return;
      }
      
      for (const juror of sybilCase.juryVerdict.jurors) {
        const juryParticipation = {
          jurorId: juror.id,
          caseId: sybilCase.caseId,
          caseType: 'sybil_verification',
          verdict: sybilCase.juryVerdict.verdict,
          consensusLevel: sybilCase.juryVerdict.consensusLevel,
          participationScore: juror.participationScore || 1.0,
          deliberationQuality: juror.deliberationQuality || 'standard'
        };
        
        await this.badgeGenerator.generateJuryBadge(juryParticipation);
      }
      
      console.log(`[SYBIL_ENFORCEMENT] Badges awarded to ${sybilCase.juryVerdict.jurors.length} jurors`);
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error awarding jury badges:', error);
    }
  }

  /**
   * Award badges for reverification process
   */
  async awardReverificationBadges(sybilCase) {
    try {
      // Award badges for successful reverification that cleared false positive
      if (sybilCase.reverificationResult && sybilCase.reverificationResult.result === 'verified') {
        // Implementation would award "False Positive Protector" badges
        console.log(`[SYBIL_ENFORCEMENT] Reverification badges would be awarded for case: ${sybilCase.caseId}`);
      }
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error awarding reverification badges:', error);
    }
  }

  /**
   * Log completed case to blockchain for transparency
   */
  async logCaseToBlockchain(sybilCase) {
    try {
      const blockchainRecord = {
        caseId: sybilCase.caseId,
        caseType: 'sybil_enforcement',
        verdict: sybilCase.juryVerdict.verdict,
        consensusLevel: sybilCase.juryVerdict.consensusLevel,
        enforcementAction: sybilCase.enforcementResult?.enforcementAction || 'none',
        completedAt: Date.now(),
        jurySize: sybilCase.juryVerdict.jurors?.length || 0
      };
      
      await this.chainLogger.logCaseCompletion(blockchainRecord);
      
      console.log(`[SYBIL_ENFORCEMENT] Case logged to blockchain: ${sybilCase.caseId}`);
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error logging case to blockchain:', error);
    }
  }

  /**
   * Find case by verification ID
   */
  findCaseByVerificationId(verificationId) {
    for (const sybilCase of this.activeCases.values()) {
      if (sybilCase.reverificationId === verificationId) {
        return sybilCase;
      }
    }
    return null;
  }

  /**
   * Find case by jury ID
   */
  findCaseByJuryId(juryId) {
    for (const sybilCase of this.activeCases.values()) {
      if (sybilCase.juryId === juryId) {
        return sybilCase;
      }
    }
    return null;
  }

  /**
   * Get case status
   */
  getCaseStatus(caseId) {
    return this.activeCases.get(caseId) || this.enforcementHistory.get(caseId) || null;
  }

  /**
   * Get all active cases
   */
  async getActiveCases() {
    const activeCasesList = Array.from(this.activeCases.values());
    return {
      cases: activeCasesList,
      count: activeCasesList.length,
      retrievedAt: Date.now()
    };
  }

  /**
   * Process an appeal
   */
  async processAppeal(appealData) {
    try {
      const { userId, caseId, appealReason, evidence } = appealData;
      
      console.log(`[SYBIL_ENFORCEMENT] Processing appeal for case: ${caseId}`);
      
      // Check if case exists
      const sybilCase = this.getCaseStatus(caseId);
      if (!sybilCase) {
        throw new Error(`Case ${caseId} not found`);
      }
      
      // Validate that the appeal is for the correct user
      if (sybilCase.userId !== userId) {
        throw new Error('Appeal user ID does not match case user ID');
      }
      
      // Check if case is in a state that allows appeals
      if (!['enforcement_action_taken', 'account_terminated', 'account_suspended'].includes(sybilCase.status)) {
        throw new Error(`Case ${caseId} is not in a state that allows appeals (current status: ${sybilCase.status})`);
      }
      
      // Create appeal record
      const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const appeal = {
        appealId,
        caseId,
        userId,
        appealReason,
        evidence,
        submittedAt: Date.now(),
        status: 'pending_review',
        reviewResult: null
      };
      
      // Add appeal to case
      if (!sybilCase.appeals) {
        sybilCase.appeals = [];
      }
      sybilCase.appeals.push(appeal);
      
      // Update case timeline
      sybilCase.timeline.push({
        stage: 'appeal_submitted',
        timestamp: Date.now(),
        data: appeal
      });
      
      // Update case status
      sybilCase.status = 'appeal_pending';
      sybilCase.stages.appealProcessCreated = true;
      
      // Process appeal through account status manager
      const appealResult = await this.accountStatus.processAppeal(userId, appeal);
      
      // Update appeal with result
      appeal.reviewResult = appealResult;
      appeal.status = appealResult.success ? 'approved' : 'denied';
      
      // Update case timeline with appeal result
      sybilCase.timeline.push({
        stage: 'appeal_processed',
        timestamp: Date.now(),
        data: appealResult
      });
      
      console.log(`[SYBIL_ENFORCEMENT] Appeal ${appealId} processed: ${appeal.status}`);
      
      return {
        success: true,
        appealId,
        status: appeal.status,
        reviewResult: appealResult
      };
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error processing appeal:', error);
      throw new Error(`Appeal processing failed: ${error.message}`);
    }
  }

  /**
   * Get enforcement history for a user
   */
  async getEnforcementHistory(userId) {
    try {
      // Get history from account status manager
      const accountHistory = await this.accountStatus.getAccountHistory(userId);
      
      // Get cases involving this user
      const userCases = [];
      
      // Check active cases
      for (const sybilCase of this.activeCases.values()) {
        if (sybilCase.userId === userId) {
          userCases.push({
            ...sybilCase,
            source: 'active'
          });
        }
      }
      
      // Check completed cases
      for (const sybilCase of this.enforcementHistory.values()) {
        if (sybilCase.userId === userId) {
          userCases.push({
            ...sybilCase,
            source: 'completed'
          });
        }
      }
      
      return {
        userId,
        accountHistory,
        cases: userCases,
        totalCases: userCases.length,
        retrievedAt: Date.now()
      };
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error getting enforcement history:', error);
      throw new Error(`Failed to get enforcement history: ${error.message}`);
    }
  }

  /**
   * Get account status for a user
   */
  async getAccountStatus(userId) {
    try {
      // Get current account status from account status manager
      const accountStatus = await this.accountStatus.getAccountStatus(userId);
      
      // Get any active cases for this user
      const activeCases = [];
      for (const sybilCase of this.activeCases.values()) {
        if (sybilCase.userId === userId) {
          activeCases.push({
            caseId: sybilCase.caseId,
            status: sybilCase.status,
            startedAt: sybilCase.startedAt
          });
        }
      }
      
      return {
        userId,
        accountStatus,
        activeCases,
        hasActiveCases: activeCases.length > 0,
        retrievedAt: Date.now()
      };
      
    } catch (error) {
      console.error('[SYBIL_ENFORCEMENT] Error getting account status:', error);
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  /**
   * Handle enforcement action events
   */
  async handleEnforcementAction(enforcementEvent) {
    console.log('[SYBIL_ENFORCEMENT] Enforcement action taken:', enforcementEvent);
    
    // Emit system-wide event for monitoring
    this.emit('sybil_enforcement_action', enforcementEvent);
  }

  /**
   * Handle trust burn completion events
   */
  async handleTrustBurnCompletion(trustBurnEvent) {
    console.log('[SYBIL_ENFORCEMENT] Trust burn completed:', trustBurnEvent);
    
    // Additional trust burn processing if needed
  }
}

export default SybilEnforcementOrchestrator;
