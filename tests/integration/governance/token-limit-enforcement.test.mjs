/**
 * Test script for token limit enforcement in group onboarding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import GroupOnboardingService from '../../../src/backend/onboarding/groupOnboardingService.mjs';

// Mock service registry with specific token counts
const mockServiceRegistry = {
    get: (name) => {
        if (name === 'proximityOnboardingService') {
            return { 
                getFounderTokenCount: async (userId) => {
                    const tokenCounts = {
                        'charlie': 3,
                        'alice': 10,
                        'bob': 5
                    };
                    return tokenCounts[userId] || 50;
                }
            };
        }
        return null;
    }
};

describe('Token Limit Enforcement', () => {
    let service;

    beforeEach(() => {
        service = new GroupOnboardingService(mockServiceRegistry);
    });

    it('should enforce token limits for Charlie (3 tokens)', async () => {
        // Create session for Charlie
        const charlieSession = await service.createGroupSession('charlie');
        expect(charlieSession.config.maxSize).toBe(3);
        expect(charlieSession.organizerCurrentTokens).toBe(3);
        
        // Try to add 3 participants (should work)
        const participants3 = [
            { id: 'user1', name: 'User 1', email: 'user1@test.com' },
            { id: 'user2', name: 'User 2', email: 'user2@test.com' },
            { id: 'user3', name: 'User 3', email: 'user3@test.com' }
        ];
        
        const results3 = await service.addParticipantsToGroup(charlieSession.id, participants3);
        const successCount = results3.filter(r => r.success).length;
        expect(successCount).toBe(3);
    });    it('should reject excess participants beyond token limit', async () => {
        // Create session for Charlie  
        const charlieSession = await service.createGroupSession('charlie');
        
        // Try to add 4 participants (should fail because Charlie only has 3 tokens)
        const participants4 = [
            { id: 'user1', name: 'User 1', email: 'user1@test.com' },
            { id: 'user2', name: 'User 2', email: 'user2@test.com' },
            { id: 'user3', name: 'User 3', email: 'user3@test.com' },
            { id: 'user4', name: 'User 4', email: 'user4@test.com' }
        ];
        
        await expect(
            service.addParticipantsToGroup(charlieSession.id, participants4)
        ).rejects.toThrow(/Organizer has insufficient tokens/i);
    });

    it('should handle Alice with 10 tokens correctly', async () => {
        const aliceSession = await service.createGroupSession('alice');
        expect(aliceSession.config.maxSize).toBe(10);
        expect(aliceSession.organizerCurrentTokens).toBe(10);
    });

    it('should handle Bob with 5 tokens correctly', async () => {
        const bobSession = await service.createGroupSession('bob');
        expect(bobSession.config.maxSize).toBe(5);
        expect(bobSession.organizerCurrentTokens).toBe(5);
    });
});
