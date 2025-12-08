/**
 * Test blockchain integration with group onboarding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import GroupOnboardingService from '../../../src/backend/onboarding/groupOnboardingService.mjs';
import blockchainUserService from '../../../src/backend/blockchain-service/blockchainUserService.mjs';

describe('Blockchain Integration Tests', () => {
  // Mock service registry with blockchain integration
  const mockServiceRegistry = {
    get: (name) => {
      if (name === 'proximityOnboardingService') {
        return { 
          getFounderTokenCount: async (userId) => 50,
          processProximityOnboarding: async (data) => ({
            success: true,
            publicKey: 'mock-public-key-' + data.newUserId,
            biometricHash: 'mock-biometric-' + data.newUserId
          })
        };
      }
      return null;
    }
  };

  beforeEach(async () => {
    await blockchainUserService.initialize();
  });
  it('should integrate group onboarding with blockchain registration', async () => {
    const service = new GroupOnboardingService(mockServiceRegistry);
    
    const initialStats = blockchainUserService.getBlockchainStats();
      // Create group session (organizer already registered)
    const session = await service.createGroupSession('alice-organizer', {
      maxParticipants: 3,
      requireApproval: false
    });
      expect(session.id).toBeDefined();
    expect(session.organizerCurrentTokens).toBeGreaterThan(0);
      // Simulate participants joining first before starting session
    const participants = ['bob-user', 'charlie-user', 'diana-user'];
    
    // Add all participants to the session first
    for (const participantId of participants) {
      await service.addParticipantsToGroup(session.id, [{
        id: participantId,
        email: `${participantId}@example.com`
      }]);
    }
    
    // ✅ Fixed on 2025-06-20 - Reason: start session after adding participants 
    // Session should already be in 'created' state and allow adding participants
    // Now start the session with sufficient participants
    await service.startGroupSession(session.id);
    
    // Verify session status after starting
    const sessionStatus = service.getGroupSessionStatus(session.id);
    console.log('Session status after starting:', sessionStatus.status);
      // Process each participant for onboarding
    for (let i = 0; i < participants.length; i++) {
      const participantId = participants[i];
      
      // Small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate proximity confirmation
      const mockSession = service.groupSessions.get(session.id);
      const participant = mockSession.participants.get(participantId);
      participant.proximityConfirmed = true;
      participant.proximityConfirmedAt = Date.now() + (i * 1000);
      
      // Simulate proximity data
      mockSession.proximityData.set(participantId, {
        confidence: 0.9,
        withinRange: true,
        lastUpdate: Date.now()
      });
      
      // Process onboarding (this will register on blockchain)
      await service.onboardParticipant(session.id, participantId);
      
      const tokens = service.calculateGroupTokens(mockSession, participantId);
      expect(tokens).toBeGreaterThan(0);
      
      // Verify blockchain registration
      const userExists = await blockchainUserService.verifyUserExists(`mock-public-key-${participantId}`);
      expect(userExists.exists).toBe(true);
      
      // Check token count on blockchain
      const blockchainTokens = await blockchainUserService.getUserTokenCount(participantId);
      expect(blockchainTokens).toBeGreaterThan(0);
    }
    
    const finalStats = blockchainUserService.getBlockchainStats();
    expect(finalStats.registeredUsers).toBeGreaterThan(initialStats.registeredUsers);
  });
});
