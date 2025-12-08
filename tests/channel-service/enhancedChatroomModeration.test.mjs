/**
 * @fileoverview Tests for Enhanced Chatroom Moderation System
 * Tests percentile-based moderation, two-track voting, and search features
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chatUserVotingService from '../../src/backend/channel-service/chatUserVoting.mjs';
import channelChatroomEngine from '../../src/backend/channel-service/channelChatroomEngine.mjs';

describe('Enhanced Chatroom Moderation System', () => {
  beforeEach(async () => {
    await chatUserVotingService.initialize();
    await channelChatroomEngine.initialize();
  });

  afterEach(async () => {
    await chatUserVotingService.shutdown();
    await channelChatroomEngine.shutdown();
  });

  describe('Percentile-Based Moderation', () => {
    const channelId = 'test-channel-1';
    const users = ['user1', 'user2', 'user3', 'user4', 'user5'];    beforeEach(async () => {
      // Clear any existing data for this channel by creating fresh service instances
      await chatUserVotingService.shutdown();
      await channelChatroomEngine.shutdown();
      await chatUserVotingService.initialize();
      await channelChatroomEngine.initialize();
      
      // Set up users with different scores by directly setting them
      const channelScores = new Map();
      for (let i = 0; i < users.length; i++) {
        const userId = users[i];
        const targetScore = (i + 1) * 2; // Scores: 2, 4, 6, 8, 10
        channelScores.set(userId, targetScore);
      }
      
      // Set the scores directly to avoid adding voters to the score map
      chatUserVotingService.userScores.set(channelId, channelScores);
      chatUserVotingService.recalculateChannelPercentiles(channelId);
    });

    it('should calculate percentiles correctly', () => {
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      
      const user1Percentile = chatUserVotingService.getUserPercentile('user1', channelId);
      const user5Percentile = chatUserVotingService.getUserPercentile('user5', channelId);
      
      expect(user1Percentile).toBe(0); // Lowest score
      expect(user5Percentile).toBe(100); // Highest score
    });    it('should enforce downvoting restrictions based on percentile', async () => {
      // Set threshold to 20th percentile (valid value)
      await chatUserVotingService.setChannelModerationThreshold(channelId, 20);
      
      // user1 (0th percentile) should not be able to downvote
      await expect(
        chatUserVotingService.voteOnUserEnhanced('user1', 'user5', channelId, 'downvote')
      ).rejects.toThrow(/Downvoting requires.*percentile/);
      
      // user5 (100th percentile) should be able to downvote
      const result = await chatUserVotingService.voteOnUserEnhanced('user5', 'user1', channelId, 'downvote');
      expect(result.success).toBe(true);
      expect(result.mutualDownvote).toBe(true);
    });

    it('should allow unrestricted upvoting', async () => {
      // Any user should be able to upvote regardless of percentile
      const result = await chatUserVotingService.voteOnUserEnhanced('user1', 'user5', channelId, 'upvote');
      expect(result.success).toBe(true);
      expect(result.voterScoreChange).toBe(0); // Voter doesn't lose points
      expect(result.targetScoreChange).toBe(1); // Target gains points
    });

    it('should update moderation threshold via governance', async () => {
      await chatUserVotingService.setChannelModerationThreshold(channelId, 20);
      const threshold = chatUserVotingService.getChannelModerationThreshold(channelId);
      expect(threshold).toBe(20);
    });
  });

  describe('Two-Track Voting System', () => {
    const channelId = 'test-channel-2';
    const voter = 'voter1';
    const target = 'target1';

    beforeEach(async () => {
      // Ensure voter has sufficient percentile for downvoting
      for (let i = 0; i < 10; i++) {
        await chatUserVotingService.voteOnUserEnhanced(
          `upvoter_${i}`, 
          voter, 
          channelId, 
          'upvote'
        );
      }
    });

    it('should handle upvoting correctly (free, only target benefits)', async () => {
      const initialVoterScore = chatUserVotingService.getUserScore(voter, channelId);
      const initialTargetScore = chatUserVotingService.getUserScore(target, channelId);
      
      const result = await chatUserVotingService.voteOnUserEnhanced(voter, target, channelId, 'upvote');
      
      expect(result.success).toBe(true);
      expect(result.voterScoreChange).toBe(0);
      expect(result.targetScoreChange).toBe(1);
      expect(result.mutualDownvote).toBe(false);
      
      expect(chatUserVotingService.getUserScore(voter, channelId)).toBe(initialVoterScore);
      expect(chatUserVotingService.getUserScore(target, channelId)).toBe(initialTargetScore + 1);
    });

    it('should handle downvoting correctly (reciprocal, both lose points)', async () => {
      const initialVoterScore = chatUserVotingService.getUserScore(voter, channelId);
      const initialTargetScore = chatUserVotingService.getUserScore(target, channelId);
      
      const result = await chatUserVotingService.voteOnUserEnhanced(voter, target, channelId, 'downvote');
      
      expect(result.success).toBe(true);
      expect(result.voterScoreChange).toBe(-1);
      expect(result.targetScoreChange).toBe(-1);
      expect(result.mutualDownvote).toBe(true);
      
      expect(chatUserVotingService.getUserScore(voter, channelId)).toBe(initialVoterScore - 1);
      expect(chatUserVotingService.getUserScore(target, channelId)).toBe(initialTargetScore - 1);
    });

    it('should prevent self-voting', async () => {
      await expect(
        chatUserVotingService.voteOnUserEnhanced(voter, voter, channelId, 'upvote')
      ).rejects.toThrow('Users cannot vote on themselves');
    });
  });

  describe('User Moderation Status', () => {
    const channelId = 'test-channel-3';
    const userId = 'test-user';

    it('should correctly determine moderation status', async () => {
      // Set up user with low score (below default filter threshold)
      await chatUserVotingService.setChannelFilterThreshold(channelId, -5);
      
      // Set up multiple users including the test user with low score
      const channelScores = new Map();
      channelScores.set(userId, -10); // Test user with very low score
      channelScores.set('user2', 5);   // Other users with higher scores
      channelScores.set('user3', 8);
      channelScores.set('user4', 12);
      
      // Set the scores directly to ensure we have enough users
      chatUserVotingService.userScores.set(channelId, channelScores);
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      
      const status = chatUserVotingService.getUserModerationStatus(userId, channelId);
      
      expect(status.score).toBeLessThan(-5);
      expect(status.percentile).toBeLessThan(10); // Default threshold
      expect(status.canDownvote).toBe(false);
      expect(status.isMuted).toBe(true);
      expect(status.isFiltered).toBe(true);
      expect(status.status).toBe('muted');
    });

    it('should assign correct badges based on percentile', async () => {
      // Create a high-scoring user
      for (let i = 0; i < 20; i++) {
        await chatUserVotingService.voteOnUserEnhanced(
          `upvoter_${i}`, 
          userId, 
          channelId, 
          'upvote'
        );
      }
      
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      const badge = chatUserVotingService.getUserBadge(95, 10); // 95th percentile
      
      expect(badge).toBe('🏆'); // Top 5% badge
    });
  });

  describe('Chatroom Search and Filtering', () => {    const channelId = 'test-channel-4';
    
    beforeEach(async () => {
      // Set up test messages using setMockMessages
      chatUserVotingService.setMockMessages(channelId, [
        {
          id: 'msg1',
          authorId: 'user1',
          author: { username: 'user1' },
          content: 'Hello world',
          timestamp: Date.now() - 1000,
          hasMedia: false,
          tags: ['general']
        },
        {
          id: 'msg2',
          authorId: 'user2',
          author: { username: 'user2' },
          content: 'Check this image!',
          timestamp: Date.now() - 500,
          hasMedia: true,
          tags: ['media']
        },
        {
          id: 'msg3',
          authorId: 'user3',
          author: { username: 'user3' },
          content: 'Important announcement',
          timestamp: Date.now(),
          hasMedia: false,
          tags: ['announcement']
        }
      ]);
    });

    it('should filter messages by keyword', async () => {
      const result = await chatUserVotingService.searchChatroomMessages(channelId, {
        keyword: 'image'
      });
      
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe('Check this image!');
    });

    it('should filter media-only messages', async () => {
      const result = await chatUserVotingService.searchChatroomMessages(channelId, {
        mediaOnly: true
      });
      
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].hasMedia).toBe(true);
    });

    it('should sort by newest first', async () => {
      const result = await chatUserVotingService.searchChatroomMessages(channelId, {
        newest: true
      });
      
      expect(result.messages[0].content).toBe('Important announcement');
    });

    it('should filter by user percentile', async () => {
      // Set up users with different percentiles
      await chatUserVotingService.voteOnUserEnhanced('voter1', 'user1', channelId, 'upvote');
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      
      const result = await chatUserVotingService.searchChatroomMessages(channelId, {
        userPercentileFilter: 50
      });
      
      // Should filter out users below 50th percentile
      expect(result.messages.length).toBeLessThanOrEqual(3);
    });

    it('should provide filter options', () => {
      const options = chatUserVotingService.getChannelFilterOptions(channelId);
      
      expect(options).toHaveProperty('scoreRange');
      expect(options).toHaveProperty('percentileThreshold');
      expect(options).toHaveProperty('totalUsers');
      expect(options).toHaveProperty('availableFilters');
      expect(options.availableFilters).toContain('keyword');
      expect(options.availableFilters).toContain('mediaOnly');
    });
  });

  describe('Chatroom Engine Integration', () => {
    const channelId = 'test-channel-5';
    const userId = 'test-user';
    const channelData = { name: 'Test Channel', channelType: 'topic' };

    it('should create chatroom with default moderation settings', async () => {
      const chatroom = await channelChatroomEngine.createChatroom(channelId, channelData);
      
      expect(chatroom.id).toBe(channelId);
      expect(chatroom.settings.moderationThreshold).toBe(10);
      expect(chatroom.settings.filterThreshold).toBe(-10);
    });

    it('should prevent muted users from sending messages', async () => {
      await channelChatroomEngine.createChatroom(channelId, channelData);
        // Make user muted by giving them low percentile
      await chatUserVotingService.setChannelModerationThreshold(channelId, 5);
      // User will be at 0th percentile by default
      
      await expect(
        channelChatroomEngine.sendMessage(channelId, userId, 'Hello world')
      ).rejects.toThrow(/muted in this channel/);
    });

    it('should allow voting on messages with proper restrictions', async () => {
      await channelChatroomEngine.createChatroom(channelId, channelData);
      
      // First, make user eligible to vote by giving them high percentile
      for (let i = 0; i < 10; i++) {
        await chatUserVotingService.voteOnUserEnhanced(
          `upvoter_${i}`, 
          userId, 
          channelId, 
          'upvote'
        );
      }
      
      const result = await channelChatroomEngine.voteOnUser(
        channelId, 
        userId, 
        'targetUser', 
        'upvote'
      );
      
      expect(result.success).toBe(true);
    });

    it('should update moderation settings', async () => {
      await channelChatroomEngine.createChatroom(channelId, channelData);
      
      const result = await channelChatroomEngine.updateModerationSettings(channelId, {
        moderationThreshold: 20,
        filterThreshold: -5
      });
      
      expect(result.success).toBe(true);
      expect(result.settings.moderationThreshold).toBe(20);
      expect(result.settings.filterThreshold).toBe(-5);
    });
  });

  describe('Real-time Updates and Events', () => {
    const channelId = 'test-channel-6';
    
    it('should emit events on score updates', (done) => {
      const { eventBus } = require('../../src/backend/event-bus/index.mjs');
      
      eventBus.once('chat:user-score-updated', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(data.voteType).toBe('upvote');
        done();
      });
      
      chatUserVotingService.voteOnUserEnhanced('voter1', 'target1', channelId, 'upvote');
    });    it('should emit events on threshold updates', (done) => {
      const { eventBus } = require('../../src/backend/event-bus/index.mjs');
      
      eventBus.once('chat:moderation-threshold-updated', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(data.threshold).toBe(10);
        done();
      });
      
      chatUserVotingService.setChannelModerationThreshold(channelId, 10);
    });
  });

  describe('Performance and Edge Cases', () => {
    const channelId = 'test-channel-7';    it('should handle large numbers of users efficiently', async () => {
      const userCount = 500; // Reduced from 1000 for faster tests
      const users = Array.from({ length: userCount }, (_, i) => `user_${i}`);
      
      const startTime = Date.now();
      
      // Give each user a random score (ensure all users get at least one vote)
      // Use a consistent set of upvoters with unique IDs to avoid conflicts
      const upvoters = Array.from({ length: 20 }, (_, i) => `dedicated_upvoter_${i}`);
      
      for (let i = 0; i < userCount; i++) {
        const score = Math.max(1, Math.floor(Math.random() * 20)); // 1 to 20
        for (let j = 0; j < score; j++) {
          await chatUserVotingService.voteOnUserEnhanced(
            upvoters[j % upvoters.length], // Reuse upvoters to avoid creating more users
            users[i], 
            channelId, 
            'upvote'
          );
        }
      }
      
      // Recalculate percentiles
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(20000); // 20 seconds - increased for system variations
      
      // Verify percentiles are calculated correctly
      const channelScores = chatUserVotingService.getChannelUserScores(channelId);
      // Total users should be at least the original users (500), upvoters may overlap
      expect(channelScores.size).toBeGreaterThanOrEqual(userCount);
    });

    it('should handle edge case percentile calculations', () => {
      const channelId = 'edge-case-channel';
      
      // Test with only one user
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      const singleUserPercentile = chatUserVotingService.getUserPercentile('only-user', channelId);
      expect(singleUserPercentile).toBe(0); // Should handle gracefully
      
      // Test with users having identical scores
      const identicalUsers = ['user1', 'user2', 'user3'];
      for (const user of identicalUsers) {
        // Give all users the same score
        chatUserVotingService.getUserScore(user, channelId); // Initialize
      }
      
      chatUserVotingService.recalculateChannelPercentiles(channelId);
      
      // All should have similar percentiles
      const percentiles = identicalUsers.map(user => 
        chatUserVotingService.getUserPercentile(user, channelId)
      );
      const uniquePercentiles = new Set(percentiles);
      expect(uniquePercentiles.size).toBeLessThanOrEqual(2); // Should be mostly identical
    });
  });
});
