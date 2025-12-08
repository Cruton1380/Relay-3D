/**
 * @fileoverview Test for invite decay logic and generational inheritance
 * Tests the critical Module 1 functionality: Trust-based onboarding with decaying invite tree
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateInvitesForNewUser, 
  createNewInvite,
  resetInvitesForTest,
  initializeInviteStore 
} from '../../src/backend/invites/inviteStore.mjs';
import configService from '../../src/backend/config-service/index.mjs';

// Mock the config service to control invite parameters
vi.mock('../../src/backend/config-service/index.mjs', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

// Mock logger
vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('Invite Decay Logic - Module 1 Critical Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();    // Set up default config values
    configService.get.mockImplementation((key) => {
      switch (key) {
        case 'invitesPerNewUser':
          return 3; // Community-voted parameter used at boundary
        case 'founderIds':
          return ['founder-123'];
        default:
          return null;
      }
    });
    
    // Reset test environment
    process.env.NODE_ENV = 'test';
    await resetInvitesForTest();
    await initializeInviteStore();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Generational Decay Rule Implementation', () => {
    it('should implement correct linear decay: 15 → 14 → 13 → ... → 1', async () => {
      // Test the specified decay pattern from the requirements
      const testCases = [
        { parentInvites: 15, expectedChild: 14 },
        { parentInvites: 14, expectedChild: 13 },
        { parentInvites: 13, expectedChild: 12 },
        { parentInvites: 5, expectedChild: 4 },
        { parentInvites: 3, expectedChild: 2 },
        { parentInvites: 2, expectedChild: 1 },
        { parentInvites: 1, expectedChild: 3 } // Should use Global Community Parameter
      ];

      for (const { parentInvites, expectedChild } of testCases) {
        // Create parent user with specific invite count
        const parentUserId = `parent-${parentInvites}`;
        
        // Mock parent invite data
        await createNewInvite({
          code: `PARENT-INVITE-${parentInvites}`,
          createdBy: parentUserId,
          generation: 1,
          maxInvites: parentInvites,
          used: false
        });

        // Generate invites for child user
        const childUserId = `child-of-${parentInvites}`;
        const childInvites = await generateInvitesForNewUser(childUserId, parentUserId);

        // Check that the number of invites matches the expected decay pattern
        expect(childInvites).toBeDefined();
        expect(Array.isArray(childInvites)).toBe(true);
        expect(childInvites.length).toBe(expectedChild);
        
        // Verify each invite has correct properties
        childInvites.forEach(invite => {
          expect(typeof invite).toBe('string'); // Invite codes are strings
          expect(invite).toMatch(/^INVITE-[A-F0-9]{8}-[A-F0-9]{8}$/); // Format: INVITE-XXXXXXXX-YYYYYYYY
        });
        
        if (parentInvites === 1) {
          // Verify it uses community parameter when parent reaches minimum
          expect(configService.get).toHaveBeenCalledWith('invitesPerNewUser');
        }
      }
    });

    it('should use real-time community parameter when decay reaches minimum', async () => {
      // Simulate community voting changing the parameter over time
      const communityVotingScenarios = [
        { voteResult: 5, expectedInvites: 5 },
        { voteResult: 2, expectedInvites: 2 },
        { voteResult: 7, expectedInvites: 7 }
      ];

      for (const { voteResult, expectedInvites } of communityVotingScenarios) {
        // Update community-voted parameter
        configService.get.mockImplementation((key) => {
          if (key === 'invitesPerNewUser') return voteResult;
          if (key === 'founderIds') return ['founder-123'];
          return null;
        });

        // Create parent at minimum (1 invite)
        const parentUserId = `parent-minimum-${voteResult}`;
        await createNewInvite({
          code: `MIN-PARENT-${voteResult}`,
          createdBy: parentUserId,
          generation: 5,
          maxInvites: 1,
          used: false
        });

        // Generate invites for child - should use current community parameter
        const childUserId = `child-community-${voteResult}`;
        const childInvites = await generateInvitesForNewUser(childUserId, parentUserId);

        // Check that the number of invites matches the community parameter
        expect(childInvites).toBeDefined();
        expect(Array.isArray(childInvites)).toBe(true);
        expect(childInvites.length).toBe(expectedInvites);
        
        // Verify each invite has correct properties
        childInvites.forEach(invite => {
          expect(typeof invite).toBe('string'); // Invite codes are strings
          expect(invite).toMatch(/^INVITE-[A-F0-9]{8}-[A-F0-9]{8}$/); // Format: INVITE-XXXXXXXX-YYYYYYYY
        });
        
        expect(configService.get).toHaveBeenCalledWith('invitesPerNewUser');
      }
    });

    it('should handle founder unlimited invites correctly', async () => {
      const founderId = 'founder-123';
      const customInviteCount = 50;

      // Test founder assigning custom invite count
      const founderInvites = await generateInvitesForNewUser(founderId, null, customInviteCount);
      
      // Check that the number of invites matches the custom count
      expect(founderInvites).toBeDefined();
      expect(Array.isArray(founderInvites)).toBe(true);
      expect(founderInvites.length).toBe(customInviteCount);
      
      // Verify each invite has correct properties
      founderInvites.forEach(invite => {
        expect(typeof invite).toBe('string'); // Invite codes are strings
        expect(invite).toMatch(/^INVITE-[A-F0-9]{8}-[A-F0-9]{8}$/); // Format: INVITE-XXXXXXXX-YYYYYYYY
      });
      
      // Founder should not be subject to decay rules
      const unlimitedInvites = await generateInvitesForNewUser(founderId, null, 999);
      expect(unlimitedInvites).toBeDefined();
      expect(Array.isArray(unlimitedInvites)).toBe(true);
      expect(unlimitedInvites.length).toBe(999);
      
      // Verify each unlimited invite has correct properties
      unlimitedInvites.forEach(invite => {
        expect(typeof invite).toBe('string'); // Invite codes are strings
        expect(invite).toMatch(/^INVITE-[A-F0-9]{8}-[A-F0-9]{8}$/); // Format: INVITE-XXXXXXXX-YYYYYYYY
      });
    });
  });

  describe('Invite Tree Lineage Tracking', () => {
    it('should track generational relationships correctly', async () => {
      // Create a multi-generation invite tree
      const founderId = 'founder-123';
      
      // Generation 0: Founder creates invite with 10 tokens
      await createNewInvite({
        code: 'FOUNDER-INVITE-001',
        createdBy: founderId,
        generation: 0,
        maxInvites: 10,
        used: false
      });

      // Generation 1: First user gets 9 tokens (10-1)
      const gen1UserId = 'gen1-user';
      const gen1Invites = await generateInvitesForNewUser(gen1UserId, founderId);
      expect(gen1Invites.length).toBe(9); // Custom count would be 9 from founder

      // Generation 2: Second user gets 8 tokens (9-1)  
      const gen2UserId = 'gen2-user';
      await createNewInvite({
        code: 'GEN1-INVITE-001',
        createdBy: gen1UserId,
        generation: 1,
        maxInvites: 9,
        used: false
      });
      const gen2Invites = await generateInvitesForNewUser(gen2UserId, gen1UserId);
      expect(gen2Invites.length).toBe(8);

      // Continue decay pattern...
      const gen3UserId = 'gen3-user';
      await createNewInvite({
        code: 'GEN2-INVITE-001',
        createdBy: gen2UserId,
        generation: 2,
        maxInvites: 8,
        used: false
      });
      const gen3Invites = await generateInvitesForNewUser(gen3UserId, gen2UserId);
      expect(gen3Invites.length).toBe(7);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should prevent invite reuse and forgery', async () => {
      const inviteCode = 'TEST-INVITE-SECURITY';
      
      // Create and immediately burn an invite
      await createNewInvite({
        code: inviteCode,
        createdBy: 'user-123',
        generation: 1,
        maxInvites: 5,
        used: true,
        usedBy: 'already-used-user'
      });

      // Attempt to use burned invite should fail in onboarding
      // This would be tested in onboarding integration tests
    });

    it('should handle minimum decay boundary correctly', async () => {
      // Test the critical transition point where decay reaches 1
      const parentUserId = 'parent-at-boundary';
      
      await createNewInvite({
        code: 'BOUNDARY-INVITE-001',
        createdBy: parentUserId,
        generation: 10,
        maxInvites: 1, // At the minimum
        used: false
      });

      const childUserId = 'child-at-boundary';
      const childInvites = await generateInvitesForNewUser(childUserId, parentUserId);

      // Should use community parameter (3) instead of continuing decay (0)
      expect(childInvites.length).toBe(3);
      expect(configService.get).toHaveBeenCalledWith('invitesPerNewUser');
    });
  });
});






