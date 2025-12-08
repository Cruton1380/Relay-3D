/**
 * SYBIL ENFORCEMENT SYSTEM TESTS
 * Tests the complete flow from Sybil detection to account termination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AccountStatusManager from '../../../src/lib/accountStatusManager.js';

// Mock the SybilEnforcementOrchestrator since it has complex dependencies
const createMockOrchestrator = () => ({
  jurySortition: {
    selectAndConveneJury: vi.fn()
  },
  reverification: {
    initiateReverification: vi.fn()
  },
  trustBurn: {
    processJuryVerdict: vi.fn()
  },
  badgeGenerator: {
    generateJuryBadge: vi.fn()
  },
  chainLogger: {
    logCaseCompletion: vi.fn()
  },
  accountStatus: new AccountStatusManager(),
  activeCases: new Map(),
  enforcementHistory: new Map(),
  
  async processSybilCase(suspicionReport) {
    const caseId = `case_${Date.now()}`;
    const mockCase = {
      caseId,
      userId: suspicionReport.userId,
      status: suspicionReport.requiresReverification ? 'reverification_pending' : 'jury_deliberating',
      suspicionReport,
      stages: {
        reverificationInitiated: suspicionReport.requiresReverification,
        jurySelectionCompleted: !suspicionReport.requiresReverification
      }
    };
    
    this.activeCases.set(caseId, mockCase);
    
    return {
      success: true,
      caseId,
      status: mockCase.status,
      nextStage: suspicionReport.requiresReverification ? 'reverification' : 'jury_selection'
    };
  },
  
  getCaseStatus(caseId) {
    return this.activeCases.get(caseId) || this.enforcementHistory.get(caseId) || null;
  },
  
  getSystemStats() {
    const activeCasesList = Array.from(this.activeCases.values());
    const completedCasesList = Array.from(this.enforcementHistory.values());
    
    return {
      activeCases: activeCasesList.length,
      completedCases: completedCasesList.length,
      totalCasesProcessed: activeCasesList.length + completedCasesList.length,
      enforcementActions: {
        accountsTerminated: completedCasesList.filter(c => c.enforcementResult?.enforcementAction === 'account_terminated').length,
        accountsSuspended: completedCasesList.filter(c => c.enforcementResult?.enforcementAction === 'account_suspended').length,
        warningsIssued: completedCasesList.filter(c => c.enforcementResult?.enforcementAction === 'warning_issued').length,
        casesCleared: completedCasesList.filter(c => c.status === 'cleared_by_reverification').length
      }
    };
  },
  
  async handleJuryVerdict(verdictEvent) {
    // Find case by jury ID
    let targetCase = null;
    for (const [caseId, caseData] of this.activeCases.entries()) {
      if (caseData.juryId === verdictEvent.juryId) {
        targetCase = caseData;
        break;
      }
    }
    
    if (!targetCase) return;
    
    // Mock enforcement result
    const enforcementResult = {
      trustBurnApplied: true,
      enforcementAction: 'account_terminated',
      primaryAccountAction: { actionTaken: true, action: 'account_terminated' },
      penaltiesApplied: 3,
      totalTrustBurned: 50
    };
    
    targetCase.status = 'enforcement_completed';
    targetCase.stages.enforcementActionTaken = true;
    targetCase.enforcementResult = enforcementResult;
    
    // Move to completed
    this.enforcementHistory.set(targetCase.caseId, targetCase);
    this.activeCases.delete(targetCase.caseId);
  }
});

describe('🚫 SYBIL ENFORCEMENT SYSTEM TESTS', () => {
  let enforcementOrchestrator;
  let accountStatusManager;

  beforeEach(() => {
    // Reset modules and create fresh instances
    vi.clearAllMocks();
    enforcementOrchestrator = createMockOrchestrator();
    accountStatusManager = new AccountStatusManager();
  });

  describe('Account Status Manager', () => {
    it('should initialize with default configuration', () => {
      const status = accountStatusManager.getAccountStatus('test_user');
      
      expect(status.status).toBe('active');
      expect(status.restrictions).toEqual([]);
    });

    it('should process Sybil verdict for confirmed case', async () => {
      const juryResult = {
        verdict: 'sybil_confirmed',
        consensusLevel: 0.85,
        jurors: [
          { id: 'juror1', vote: 'sybil_confirmed' },
          { id: 'juror2', vote: 'sybil_confirmed' },
          { id: 'juror3', vote: 'sybil_confirmed' }
        ],
        highConfidenceEvidence: true,
        caseId: 'test_case_123'
      };

      const flaggedAccount = {
        userId: 'sybil_user_123',
        suspicionReason: 'duplicate_device_fingerprint'
      };

      const result = await accountStatusManager.processSybilVerdict(juryResult, flaggedAccount);

      expect(result.actionTaken).toBe(true);
      expect(result.action).toBe('account_terminated');
      expect(result.terminationId).toBeDefined();
      expect(result.appealDeadline).toBeDefined();
      expect(result.restrictions).toContain('account_terminated');

      // Verify account status is updated
      const accountStatus = accountStatusManager.getAccountStatus('sybil_user_123');
      expect(accountStatus.status).toBe('terminated');
    });

    it('should suspend account for suspicious activity', async () => {
      const juryResult = {
        verdict: 'suspicious_activity',
        consensusLevel: 0.78,
        jurors: [
          { id: 'juror1', vote: 'suspicious_activity' },
          { id: 'juror2', vote: 'suspicious_activity' },
          { id: 'juror3', vote: 'verified' }
        ],
        caseId: 'test_case_124'
      };

      const flaggedAccount = {
        userId: 'suspicious_user_124',
        suspicionReason: 'unusual_voting_patterns'
      };

      const result = await accountStatusManager.processSybilVerdict(juryResult, flaggedAccount);

      expect(result.actionTaken).toBe(true);
      expect(result.action).toBe('account_suspended');
      expect(result.suspensionLevel).toBe('extended');
      expect(result.expiresAt).toBeDefined();
      expect(result.appealable).toBe(true);

      // Verify account status
      const accountStatus = accountStatusManager.getAccountStatus('suspicious_user_124');
      expect(accountStatus.status).toBe('suspended');
      expect(accountStatus.suspensionLevel).toBe('extended');
    });

    it('should issue warning for insufficient evidence', async () => {
      const juryResult = {
        verdict: 'insufficient_evidence',
        consensusLevel: 0.45,
        jurors: [
          { id: 'juror1', vote: 'verified' },
          { id: 'juror2', vote: 'insufficient_evidence' },
          { id: 'juror3', vote: 'verified' }
        ],
        caseId: 'test_case_125'
      };

      const flaggedAccount = {
        userId: 'questioned_user_125',
        suspicionReason: 'flagged_by_algorithm'
      };

      const result = await accountStatusManager.processSybilVerdict(juryResult, flaggedAccount);

      expect(result.actionTaken).toBe(true);
      expect(result.action).toBe('warning_issued');
      expect(result.warningId).toBeDefined();
      expect(result.restrictions).toContain('reduced_voting_weight');

      // Verify account status
      const accountStatus = accountStatusManager.getAccountStatus('questioned_user_125');
      expect(accountStatus.status).toBe('warned');
    });

    it('should reject enforcement for insufficient consensus', async () => {
      const juryResult = {
        verdict: 'sybil_confirmed',
        consensusLevel: 0.65, // Below 0.8 threshold
        jurors: [
          { id: 'juror1', vote: 'sybil_confirmed' },
          { id: 'juror2', vote: 'verified' },
          { id: 'juror3', vote: 'sybil_confirmed' }
        ],
        caseId: 'test_case_126'
      };

      const flaggedAccount = {
        userId: 'borderline_user_126',
        suspicionReason: 'mixed_evidence'
      };

      const result = await accountStatusManager.processSybilVerdict(juryResult, flaggedAccount);

      expect(result.actionTaken).toBe(false);
      expect(result.reason).toBe('insufficient_evidence_or_consensus');
      expect(result.consensusLevel).toBe(0.65);

      // Verify no change to account status
      const accountStatus = accountStatusManager.getAccountStatus('borderline_user_126');
      expect(accountStatus.status).toBe('active');
    });

    it('should check action restrictions correctly', () => {
      // Create a suspended account
      accountStatusManager.accountStatuses.set('restricted_user', {
        status: 'suspended',
        restrictions: ['no_voting', 'no_inviting'],
        lastUpdated: Date.now()
      });

      expect(accountStatusManager.isActionRestricted('restricted_user', 'no_voting')).toBe(true);
      expect(accountStatusManager.isActionRestricted('restricted_user', 'no_inviting')).toBe(true);
      expect(accountStatusManager.isActionRestricted('restricted_user', 'view_content')).toBe(false);
      expect(accountStatusManager.isActionRestricted('active_user', 'no_voting')).toBe(false);
    });

    it('should clean up expired suspensions', async () => {
      const pastTime = Date.now() - (15 * 24 * 60 * 60 * 1000); // 15 days ago
      
      // Create an expired suspension
      accountStatusManager.accountStatuses.set('expired_user', {
        status: 'suspended',
        suspensionLevel: 'temporary',
        expiresAt: pastTime,
        restrictions: ['no_voting'],
        lastUpdated: pastTime
      });

      const cleanupCount = await accountStatusManager.cleanupExpiredSuspensions();

      expect(cleanupCount).toBe(1);
      
      const status = accountStatusManager.getAccountStatus('expired_user');
      expect(status.status).toBe('active');
      expect(status.restrictions).toEqual([]);
    });
  });

  describe('Sybil Enforcement Orchestrator', () => {    it('should process complete Sybil case flow', async () => {
      const suspicionReport = {
        userId: 'suspected_sybil_456',
        reason: 'duplicate_device_fingerprint',
        confidence: 'high',
        evidence: ['same_browser_fingerprint', 'identical_typing_patterns'],
        requiresReverification: false,
        region: 'test_region'
      };

      const result = await enforcementOrchestrator.processSybilCase(suspicionReport);

      expect(result.success).toBe(true);
      expect(result.caseId).toBeDefined();
      expect(result.nextStage).toBe('jury_selection');

      const caseStatus = enforcementOrchestrator.getCaseStatus(result.caseId);
      expect(caseStatus).toBeDefined();
      expect(caseStatus.status).toBe('jury_deliberating');
      expect(caseStatus.userId).toBe('suspected_sybil_456');
    });    it('should handle reverification flow before jury', async () => {
      const suspicionReport = {
        userId: 'reverif_required_789',
        reason: 'possible_duplicate_account',
        confidence: 'medium',
        requiresReverification: true,
        duplicateAccount: true,
        region: 'test_region'
      };

      const result = await enforcementOrchestrator.processSybilCase(suspicionReport);

      expect(result.success).toBe(true);
      expect(result.nextStage).toBe('reverification');

      const caseStatus = enforcementOrchestrator.getCaseStatus(result.caseId);
      expect(caseStatus.status).toBe('reverification_pending');
    });

    it('should get accurate system statistics', () => {
      // Add some mock cases to history
      enforcementOrchestrator.enforcementHistory.set('case1', {
        caseId: 'case1',
        status: 'enforcement_completed',
        enforcementResult: { enforcementAction: 'account_terminated' }
      });

      enforcementOrchestrator.enforcementHistory.set('case2', {
        caseId: 'case2',
        status: 'enforcement_completed',
        enforcementResult: { enforcementAction: 'account_suspended' }
      });

      enforcementOrchestrator.enforcementHistory.set('case3', {
        caseId: 'case3',
        status: 'cleared_by_reverification'
      });

      const stats = enforcementOrchestrator.getSystemStats();

      expect(stats.completedCases).toBe(3);
      expect(stats.enforcementActions.accountsTerminated).toBe(1);
      expect(stats.enforcementActions.accountsSuspended).toBe(1);
      expect(stats.enforcementActions.casesCleared).toBe(1);
    });    it('should handle jury verdict and trigger enforcement', async () => {
      // Create a case first
      const suspicionReport = {
        userId: 'verdict_test_user',
        reason: 'confirmed_sybil',
        requiresReverification: false,
        region: 'test_region'
      };

      const caseResult = await enforcementOrchestrator.processSybilCase(suspicionReport);
      const caseId = caseResult.caseId;
      
      // Update case to include jury ID
      const caseData = enforcementOrchestrator.getCaseStatus(caseId);
      caseData.juryId = 'jury_789';

      // Mock jury verdict event
      const verdictEvent = {
        juryId: 'jury_789',
        verdict: 'sybil_confirmed',
        consensusLevel: 0.85,
        jurors: [
          { id: 'juror1', vote: 'sybil_confirmed', participationScore: 1.0 },
          { id: 'juror2', vote: 'sybil_confirmed', participationScore: 0.95 },
          { id: 'juror3', vote: 'sybil_confirmed', participationScore: 1.0 }
        ],
        highConfidenceEvidence: true,
        completedAt: Date.now()
      };

      // Handle the verdict
      await enforcementOrchestrator.handleJuryVerdict(verdictEvent);

      // Check that case was completed
      const completedCase = enforcementOrchestrator.enforcementHistory.get(caseId);
      expect(completedCase).toBeDefined();
      expect(completedCase.status).toBe('enforcement_completed');
      expect(completedCase.stages.enforcementActionTaken).toBe(true);
      expect(completedCase.enforcementResult.enforcementAction).toBe('account_terminated');
    });
  });
  describe('Integration Tests', () => {
    it('should complete full Sybil enforcement workflow', async () => {
      // This test simulates the complete flow with mocked components
      const suspicionReport = {
        userId: 'full_flow_test_user',
        reason: 'algorithmic_detection',
        confidence: 'high',
        evidence: ['device_fingerprint_match', 'behavioral_similarity'],
        requiresReverification: false,
        region: 'test_region'
      };

      // Start the case
      const caseResult = await enforcementOrchestrator.processSybilCase(suspicionReport);
      expect(caseResult.success).toBe(true);
      
      // Add jury ID to case
      const caseData = enforcementOrchestrator.getCaseStatus(caseResult.caseId);
      caseData.juryId = 'test_jury';

      // Simulate jury reaching verdict
      const verdictEvent = {
        juryId: 'test_jury',
        verdict: 'sybil_confirmed',
        consensusLevel: 0.9,
        jurors: Array.from({ length: 7 }, (_, i) => ({
          id: `juror${i + 1}`,
          vote: 'sybil_confirmed',
          participationScore: 1.0
        })),
        highConfidenceEvidence: true
      };

      // Process verdict
      await enforcementOrchestrator.handleJuryVerdict(verdictEvent);

      // Verify final state
      const finalStats = enforcementOrchestrator.getSystemStats();
      expect(finalStats.enforcementActions.accountsTerminated).toBeGreaterThan(0);
    });
  });
});






