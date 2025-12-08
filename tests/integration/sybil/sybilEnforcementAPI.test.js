/**
 * SYBIL ENFORCEMENT API INTEGRATION TEST
 * Tests the full integration of Sybil Enforcement Orchestrator with the Trust API routes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the SybilEnforcementOrchestrator
vi.mock('../../../src/lib/sybilEnforcementOrchestrator.js', () => ({
  default: class SybilEnforcementOrchestrator {
    constructor() {
      this.cases = new Map();
      this.caseCounter = 1;
    }

    async processSybilCase(suspicionReport) {
      const caseId = `case_${this.caseCounter++}`;
      const caseData = {
        caseId,
        userId: suspicionReport.userId,
        status: suspicionReport.requiresReverification ? 'reverification_pending' : 'processed',
        reason: suspicionReport.reason,
        createdAt: Date.now(),
        ...suspicionReport
      };
      
      this.cases.set(caseId, caseData);
      
      return {
        caseId,
        status: caseData.status,
        userId: suspicionReport.userId,
        processingStarted: true
      };
    }

    async getCaseStatus(caseId) {
      return this.cases.get(caseId) || null;
    }

    async getActiveCases() {
      const cases = Array.from(this.cases.values());
      return {
        cases,
        count: cases.length,
        retrievedAt: Date.now()
      };
    }

    async processAppeal(appealData) {
      const caseData = this.cases.get(appealData.caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      caseData.appeal = {
        appealId: `appeal_${Date.now()}`,
        reason: appealData.appealReason,
        evidence: appealData.evidence,
        status: 'pending_review',
        submittedAt: appealData.submittedAt
      };

      this.cases.set(appealData.caseId, caseData);

      return {
        appealId: caseData.appeal.appealId,
        status: 'pending_review',
        caseId: appealData.caseId
      };
    }

    async getEnforcementHistory(userId) {
      const userCases = Array.from(this.cases.values()).filter(c => c.userId === userId);
      return {
        userId,
        cases: userCases,
        totalCases: userCases.length
      };
    }
  }
}));

// Mock other dependencies
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../src/backend/services/trustLevelService.mjs', () => ({
  trustLevelService: {
    getUserTrust: vi.fn(),
    updateTrust: vi.fn()
  }
}));

// Import trust routes after mocking
const { default: trustRoutes } = await import('../../../src/backend/routes/trust.mjs');

const app = express();
app.use(express.json());
app.use('/api/trust', trustRoutes);

describe('Sybil Enforcement API Integration', () => {
  let testCaseId;
  let testUserId;

  beforeEach(() => {
    testUserId = `test_user_${Date.now()}`;
  });

  afterEach(async () => {
    // Clean up any test data if needed
  });

  describe('POST /api/trust/sybil/process - Process Sybil Case', () => {
    it('should successfully initiate a Sybil case', async () => {
      const suspicionReport = {
        userId: testUserId,
        reason: 'Suspected duplicate account based on device fingerprinting',
        duplicateAccount: true,
        region: 'test-region',
        evidence: {
          deviceFingerprint: 'duplicate_detected',
          behaviorPattern: 'suspicious'
        },
        requiresReverification: true
      };

      const response = await request(app)
        .post('/api/trust/sybil/process')
        .send(suspicionReport)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caseId).toBeDefined();
      expect(response.body.data.status).toBe('reverification_pending');
      expect(response.body.message).toBe('Sybil case processing initiated');

      // Store case ID for other tests
      testCaseId = response.body.data.caseId;
    });

    it('should fail when required fields are missing', async () => {
      const incompleteReport = {
        reason: 'Missing userId'
      };

      const response = await request(app)
        .post('/api/trust/sybil/process')
        .send(incompleteReport)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('userId and reason are required');
    });
  });

  describe('GET /api/trust/sybil/case/:caseId - Get Case Status', () => {
    beforeEach(async () => {
      // Create a test case
      const suspicionReport = {
        userId: testUserId,
        reason: 'Test case for status checking',
        duplicateAccount: false,
        requiresReverification: false
      };

      const response = await request(app)
        .post('/api/trust/sybil/process')
        .send(suspicionReport);

      testCaseId = response.body.data.caseId;
    });

    it('should return case status for valid case ID', async () => {
      const response = await request(app)
        .get(`/api/trust/sybil/case/${testCaseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caseId).toBe(testCaseId);
      expect(response.body.data.userId).toBe(testUserId);
      expect(response.body.data.status).toBeDefined();
    });

    it('should return 404 for non-existent case ID', async () => {
      const response = await request(app)
        .get('/api/trust/sybil/case/non_existent_case')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Case not found');
    });
  });

  describe('POST /api/trust/sybil/appeal - Process Appeal', () => {
    beforeEach(async () => {
      // Create a case and simulate enforcement action
      const suspicionReport = {
        userId: testUserId,
        reason: 'Test case for appeal testing',
        duplicateAccount: false,
        requiresReverification: false
      };

      const response = await request(app)
        .post('/api/trust/sybil/process')
        .send(suspicionReport);

      testCaseId = response.body.data.caseId;
    });

    it('should process a valid appeal', async () => {
      const appealData = {
        userId: testUserId,
        caseId: testCaseId,
        appealReason: 'False positive detection',
        evidence: {
          type: 'identity_verification',
          documents: ['passport', 'utility_bill']
        }
      };

      const response = await request(app)
        .post('/api/trust/sybil/appeal')
        .send(appealData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appealId).toBeDefined();
      expect(response.body.data.status).toBe('pending_review');
      expect(response.body.message).toBe('Appeal submitted successfully');
    });

    it('should fail when required fields are missing', async () => {
      const incompleteAppeal = {
        appealReason: 'Missing userId and caseId'
      };

      const response = await request(app)
        .post('/api/trust/sybil/appeal')
        .send(incompleteAppeal)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('userId, caseId, and appealReason are required');
    });
  });

  describe('Integration Flow Test', () => {
    it('should complete a full enforcement flow', async () => {
      // Step 1: Report Sybil case
      const suspicionReport = {
        userId: testUserId,
        reason: 'Integration test - full flow',
        duplicateAccount: true,
        region: 'test-region',
        evidence: { test: 'evidence' },
        requiresReverification: true
      };

      const caseResponse = await request(app)
        .post('/api/trust/sybil/process')
        .send(suspicionReport)
        .expect(200);

      const { caseId } = caseResponse.body.data;

      // Step 2: Check case status
      const statusResponse = await request(app)
        .get(`/api/trust/sybil/case/${caseId}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.caseId).toBe(caseId);

      // Step 3: Submit appeal
      const appealData = {
        userId: testUserId,
        caseId: caseId,
        appealReason: 'Integration test appeal',
        evidence: { type: 'test_evidence' }
      };

      const appealResponse = await request(app)
        .post('/api/trust/sybil/appeal')
        .send(appealData)
        .expect(200);

      expect(appealResponse.body.success).toBe(true);
      expect(appealResponse.body.data.appealId).toBeDefined();

      // Step 4: Verify case status includes appeal
      const finalStatusResponse = await request(app)
        .get(`/api/trust/sybil/case/${caseId}`)
        .expect(200);

      expect(finalStatusResponse.body.data.appeal).toBeDefined();
      expect(finalStatusResponse.body.data.appeal.status).toBe('pending_review');
    });
  });
});
