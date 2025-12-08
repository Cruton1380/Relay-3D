/**
 * @fileoverview Test for Invitee Initialization Service
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import inviteeInitializationService from '../../src/backend/onboarding/inviteeInitializationService.mjs';
import biometricVerifier from '../../src/backend/biometrics/biometricVerifier.mjs';
import biometricTemplateStore from '../../src/backend/biometrics/biometricTemplateStore.mjs';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
}));

vi.mock('../../src/backend/biometrics/biometricVerifier.mjs', () => {
  const mockFindSimilarBiometricHash = vi.fn().mockResolvedValue(null);
  const mockAssessBiometricQuality = vi.fn().mockResolvedValue({
    acceptable: true,
    score: 0.9,
    issues: []
  });
  const mockStoreBiometricTemplate = vi.fn().mockResolvedValue(undefined);

  return {
    findSimilarBiometricHash: mockFindSimilarBiometricHash,
    assessBiometricQuality: mockAssessBiometricQuality,
    storeBiometricTemplate: mockStoreBiometricTemplate,
    default: {
      findSimilarBiometricHash: mockFindSimilarBiometricHash,
      assessBiometricQuality: mockAssessBiometricQuality,
      storeBiometricTemplate: mockStoreBiometricTemplate,
    }
  };
});

vi.mock('../../src/backend/biometrics/biometricTemplateStore.mjs', () => {
  const mockStoreTemplate = vi.fn().mockResolvedValue(true);
  
  return {
    storeTemplate: mockStoreTemplate,
    default: {
      storeTemplate: mockStoreTemplate,
    }
  };
});

describe('Invitee Initialization Service', () => {
  const testUserId = 'user-123';
  const testOnboardingSessionId = 'onboarding-456';
  const testInviteToken = 'INVITE-ABCD-1234';
  
  beforeEach(async () => {
    // Reset the mock implementations
    vi.clearAllMocks();
    
    // Reset mock implementations to defaults
    biometricVerifier.findSimilarBiometricHash.mockResolvedValue(null);
    biometricVerifier.assessBiometricQuality.mockResolvedValue({
      acceptable: true,
      score: 0.9,
      issues: []
    });
    biometricTemplateStore.storeTemplate.mockResolvedValue(undefined);
    
    // Initialize with mocked filesystem
    await inviteeInitializationService.initialize();
    
    // Reset the service state
    inviteeInitializationService.activeSessions = new Map();
    inviteeInitializationService.userSessions = new Map();
    
    // Set initialized flag to true
    inviteeInitializationService.initialized = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Service Operations', () => {
    it('should have required service methods', () => {
      expect(inviteeInitializationService.initialize).toBeDefined();
      expect(inviteeInitializationService.startInitializationSession).toBeDefined();
      expect(inviteeInitializationService.processBiometricSetup).toBeDefined();
      expect(inviteeInitializationService.getSessionStatus).toBeDefined();
    });

    it('should initialize service successfully', async () => {
      expect(inviteeInitializationService.initialized).toBe(true);
    });
  });

  describe('Initialization Session Management', () => {
    it('should start a new initialization session', async () => {
      const result = await inviteeInitializationService.startInitializationSession(
        testUserId,
        testOnboardingSessionId,
        testInviteToken
      );
      
      expect(result.sessionId).toBeDefined();
      expect(result.status).toBe('started');
      
      // Service state should be updated
      expect(inviteeInitializationService.activeSessions.size).toBe(1);
      expect(inviteeInitializationService.userSessions.has(testUserId)).toBe(true);
      
      // Check session details
      const sessionId = result.sessionId;
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.userId).toBe(testUserId);
      expect(session.onboardingSessionId).toBe(testOnboardingSessionId);
      expect(session.inviteToken).toBe(testInviteToken);
      
      // Verify file was saved
      expect(fs.writeFile).toHaveBeenCalled();
    });
    
    it('should not create duplicate sessions for a user', async () => {
      // Create first session
      const firstResult = await inviteeInitializationService.startInitializationSession(
        testUserId,
        testOnboardingSessionId,
        testInviteToken
      );
      
      // Try to create another session
      const secondResult = await inviteeInitializationService.startInitializationSession(
        testUserId,
        'different-onboarding-id',
        'DIFFERENT-TOKEN'
      );
      
      expect(secondResult.sessionId).toBe(firstResult.sessionId);
      expect(secondResult.message).toContain('already has an active initialization session');
      
      // Service state should only have one session
      expect(inviteeInitializationService.activeSessions.size).toBe(1);
    });
  });
  
  describe('Biometric Setup', () => {
    let sessionId;
    
    beforeEach(async () => {
      // Create a session first
      const result = await inviteeInitializationService.startInitializationSession(
        testUserId,
        testOnboardingSessionId,
        testInviteToken
      );
      sessionId = result.sessionId;
    });
    
    it('should process biometric setup successfully', async () => {
      const biometricHash = 'test-biometric-data';
      
      const result = await inviteeInitializationService.processBiometricSetup(
        sessionId,
        biometricHash
      );
      
      expect(result.success).toBe(true);
      
      // Check if biometricVerifier was called
      expect(biometricVerifier.findSimilarBiometricHash).toHaveBeenCalledWith(biometricHash);
      expect(biometricVerifier.assessBiometricQuality).toHaveBeenCalledWith(biometricHash);
      
      // Check if biometricTemplateStore was called
      expect(biometricTemplateStore.storeTemplate).toHaveBeenCalledWith(testUserId, biometricHash);
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.steps.biometricSetup).toBe(true);
      expect(session.biometricVerified).toBe(true);
      expect(session.status).toBe('biometric_verified');
    });
    
    it('should detect duplicate biometrics', async () => {
      // Mock finding a similar biometric hash
      biometricVerifier.findSimilarBiometricHash.mockResolvedValueOnce('existing-user');
      
      const result = await inviteeInitializationService.processBiometricSetup(
        sessionId,
        'test-biometric-data'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('DUPLICATE_BIOMETRIC');
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.status).toBe('biometric_duplicate');
    });
    
    it('should reject low quality biometrics', async () => {
      // Mock low quality assessment
      biometricVerifier.assessBiometricQuality.mockResolvedValueOnce({
        acceptable: false,
        score: 0.3,
        issues: ['Low quality image']
      });
      
      const result = await inviteeInitializationService.processBiometricSetup(
        sessionId,
        'test-biometric-data'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('LOW_QUALITY_BIOMETRIC');
      expect(result.retryAllowed).toBe(true);
    });
  });
  
  describe('Initialization Flow Steps', () => {
    let sessionId;
    
    beforeEach(async () => {
      // Create and prepare a session with verified biometrics
      const result = await inviteeInitializationService.startInitializationSession(
        testUserId,
        testOnboardingSessionId,
        testInviteToken
      );
      sessionId = result.sessionId;
     
      // Complete biometric setup first
      await inviteeInitializationService.processBiometricSetup(
        sessionId,
        'test-biometric-data'
      );
    });
    
    it('should load global parameters', async () => {
      const parameters = {
        voteThreshold: 0.75,
        channelTTL: 86400,
        maxVotesPerUser: 10
      };
      
      const result = await inviteeInitializationService.loadGlobalParameters(
        sessionId,
        parameters
      );
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.globalParameters).toEqual(parameters);
      expect(session.steps.globalParamsLoaded).toBe(true);
      expect(session.status).toBe('parameters_loaded');
    });
    
    it('should verify invite token', async () => {
      // Load parameters first
      await inviteeInitializationService.loadGlobalParameters(
        sessionId,
        { testParam: 'value' }
      );
      
      const result = await inviteeInitializationService.verifyInviteToken(
        sessionId,
        testInviteToken // Use the same token we initialized with
      );
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.verifiedToken).toBe(testInviteToken);
      expect(session.steps.inviteTokenVerified).toBe(true);
      expect(session.status).toBe('token_verified');
    });
    
    it('should reject mismatched invite tokens', async () => {
      // Load parameters first
      await inviteeInitializationService.loadGlobalParameters(
        sessionId,
        { testParam: 'value' }
      );
      
      const result = await inviteeInitializationService.verifyInviteToken(
        sessionId,
        'WRONG-TOKEN'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_INVITE_CODE');
    });
    
    it('should initialize device state', async () => {
      // Complete previous steps
      await inviteeInitializationService.loadGlobalParameters(sessionId, {});
      await inviteeInitializationService.verifyInviteToken(sessionId, testInviteToken);
      
      const deviceState = {
        deviceId: 'device-789',
        platform: 'desktop',
        features: ['camera', 'microphone']
      };
      
      const result = await inviteeInitializationService.initializeDeviceState(
        sessionId,
        deviceState
      );
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.deviceState).toEqual(deviceState);
      expect(session.steps.deviceStateInitialized).toBe(true);
      expect(session.status).toBe('device_initialized');
    });
    
    it('should complete the initialization process', async () => {
      // Complete all previous steps
      await inviteeInitializationService.loadGlobalParameters(sessionId, {});
      await inviteeInitializationService.verifyInviteToken(sessionId, testInviteToken);
      await inviteeInitializationService.initializeDeviceState(sessionId, {});
      
      const result = await inviteeInitializationService.completeInitialization(sessionId);
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = inviteeInitializationService.activeSessions.get(sessionId);
      expect(session.steps.completed).toBe(true);
      expect(session.status).toBe('completed');
    });
  });
});






