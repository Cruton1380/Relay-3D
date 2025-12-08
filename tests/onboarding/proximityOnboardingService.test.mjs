/**
 * @fileoverview Test for Proximity Onboarding Service
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import proximityOnboardingService from '../../src/backend/onboarding/proximityOnboardingService.mjs';
import * as inviteStore from '../../src/backend/invites/inviteStore.mjs';
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

vi.mock('../../src/backend/invites/inviteStore.mjs', () => ({
  generateInviteCode: vi.fn().mockReturnValue('INVITE-ABCD-1234'),
  createInvite: vi.fn().mockResolvedValue({ code: 'INVITE-ABCD-1234' }),
}));

describe('Proximity Onboarding Service', () => {
  const testFounderId = 'founder-123';
  const testInviteeId = 'invitee-456';
  
  beforeEach(async () => {
    // Reset the mock implementations
    vi.clearAllMocks();
    
    // Initialize with mocked filesystem
    await proximityOnboardingService.initialize();
    
    // Reset the service state
    proximityOnboardingService.activeSessions = new Map();
    proximityOnboardingService.founderSessions = new Map();
    proximityOnboardingService.deviceSignatures = new Map();
    
    // Set initialized flag to true
    proximityOnboardingService.initialized = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Onboarding Session Management', () => {
    it('should initialize a new onboarding session', async () => {
      const result = await proximityOnboardingService.initiateOnboarding(
        testFounderId,
        2,
        { testParam: 'value' }
      );
      
      expect(result.sessionId).toBeDefined();
      expect(result.onboardingCode).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      
      // Service state should be updated
      expect(proximityOnboardingService.activeSessions.size).toBe(1);
      expect(proximityOnboardingService.founderSessions.has(testFounderId)).toBe(true);
      
      // Check session details
      const session = proximityOnboardingService.activeSessions.get(result.sessionId);
      expect(session.founderId).toBe(testFounderId);
      expect(session.inviteTokenCount).toBe(2);
      expect(session.parameters).toEqual({ testParam: 'value' });
      expect(session.status).toBe('initiated');
      
      // Verify file was saved
      expect(fs.writeFile).toHaveBeenCalled();
    });
    
    it('should register an invitee device', async () => {
      // Create a session first
      const sessionResult = await proximityOnboardingService.initiateOnboarding(testFounderId);
      const sessionId = sessionResult.sessionId;
      
      const deviceData = {
        type: 'bluetooth',
        name: 'Test Device',
        address: '00:11:22:33:44:55'
      };
      
      const result = await proximityOnboardingService.registerInviteeDevice(
        sessionId,
        deviceData
      );
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = proximityOnboardingService.activeSessions.get(sessionId);
      expect(session.deviceSignature).toBeDefined();
      expect(session.deviceData).toEqual(deviceData);
      expect(session.status).toBe('awaiting_discovery');
      
      // Device signature should be indexed
      const deviceSignature = proximityOnboardingService.createDeviceSignature(deviceData);
      expect(proximityOnboardingService.deviceSignatures.get(deviceSignature)).toBe(sessionId);
      
      // Verify file was saved
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
  
  describe('Discovery Process', () => {
    it('should discover an invitee by proximity', async () => {
      // Create a session
      const sessionResult = await proximityOnboardingService.initiateOnboarding(testFounderId);
      const sessionId = sessionResult.sessionId;
      
      // Register an invitee device
      const deviceData = {
        type: 'bluetooth',
        name: 'Test Device',
        address: '00:11:22:33:44:55'
      };
      
      await proximityOnboardingService.registerInviteeDevice(sessionId, deviceData);
      
      // Simulate discovery
      const result = await proximityOnboardingService.discoverInvitee(
        testFounderId,
        deviceData
      );
      
      expect(result.found).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.onboardingCode).toBeDefined();
      
      // Check session was updated
      const session = proximityOnboardingService.activeSessions.get(sessionId);
      expect(session.inviteeFound).toBe(true);
      expect(session.steps.proximityVerified).toBe(true);
      expect(session.status).toBe('proximity_verified');
    });
    
    it('should not discover devices from other founders', async () => {
      // Create a session
      const sessionResult = await proximityOnboardingService.initiateOnboarding(testFounderId);
      const sessionId = sessionResult.sessionId;
      
      // Register an invitee device
      const deviceData = {
        type: 'bluetooth',
        name: 'Test Device',
        address: '00:11:22:33:44:55'
      };
      
      await proximityOnboardingService.registerInviteeDevice(sessionId, deviceData);
      
      // Try to discover with different founder
      const result = await proximityOnboardingService.discoverInvitee(
        'different-founder',
        deviceData
      );
      
      expect(result.found).toBe(false);
    });
  });
  
  describe('Bundle Transfer & Invite Generation', () => {
    let sessionId;
    
    beforeEach(async () => {
      // Setup a session with verified proximity
      const sessionResult = await proximityOnboardingService.initiateOnboarding(testFounderId, 2);
      sessionId = sessionResult.sessionId;
      
      const deviceData = {
        type: 'bluetooth',
        name: 'Test Device',
        address: '00:11:22:33:44:55'
      };
      
      await proximityOnboardingService.registerInviteeDevice(sessionId, deviceData);
      await proximityOnboardingService.discoverInvitee(testFounderId, deviceData);
    });
    
    it('should transfer system bundle to invitee', async () => {
      const bundleData = {
        version: '1.0.0',
        modules: ['core', 'voting', 'channels'],
        size: '25MB'
      };
      
      const result = await proximityOnboardingService.transferSystemBundle(
        sessionId,
        bundleData
      );
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = proximityOnboardingService.activeSessions.get(sessionId);
      expect(session.bundleData).toEqual(bundleData);
      expect(session.steps.bundleTransferred).toBe(true);
      expect(session.status).toBe('bundle_transferred');
    });
    
    it('should generate invite tokens', async () => {
      // Transfer bundle first
      await proximityOnboardingService.transferSystemBundle(
        sessionId,
        { version: '1.0.0' }
      );
      
      // Generate tokens
      const result = await proximityOnboardingService.generateInviteTokens(
        sessionId,
        testInviteeId
      );
      
      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBe(2); // We specified 2 tokens earlier
      
      // Check if inviteStore was called
      expect(inviteStore.createInvite).toHaveBeenCalledTimes(2);
      
      // Check session was updated
      const session = proximityOnboardingService.activeSessions.get(sessionId);
      expect(session.inviteeId).toBe(testInviteeId);
      expect(session.steps.inviteTokenGenerated).toBe(true);
      expect(session.status).toBe('invite_generated');
    });
    
    it('should complete the onboarding process', async () => {
      // Transfer bundle first
      await proximityOnboardingService.transferSystemBundle(
        sessionId,
        { version: '1.0.0' }
      );
      
      // Generate tokens
      await proximityOnboardingService.generateInviteTokens(
        sessionId,
        testInviteeId
      );
      
      // Complete onboarding
      const result = await proximityOnboardingService.completeOnboarding(sessionId);
      
      expect(result.success).toBe(true);
      
      // Check session was updated
      const session = proximityOnboardingService.activeSessions.get(sessionId);
      expect(session.steps.completed).toBe(true);
      expect(session.status).toBe('completed');
    });
  });
});






