/**
 * @fileoverview Phase 3 Integration Test
 * Validates the complete content voting system integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import contentVoting from '../../src/backend/channel-service/contentVoting.mjs';
import ChannelService from '../../src/backend/channel-service/index.mjs';

describe('Phase 3 Content Voting Integration', () => {
  let channelService;
  let testChannelId;
  let testUserId = 'integration-user-001';
  let testContentId = 'integration-content-001';

  beforeAll(async () => {
    // Initialize content voting service
    await contentVoting.initialize();
    
    // Initialize channel service
    channelService = new ChannelService();
    await channelService.initialize();
    
    testChannelId = 'integration-channel-001';
  });

  afterAll(async () => {
    await contentVoting.shutdown();
  });

  it('should handle complete content voting workflow', async () => {
    // Test 1: Cast initial upvote
    const upvoteResult = await contentVoting.castVote(testUserId, testContentId, 'upvote', testChannelId);
    
    expect(upvoteResult.success).toBe(true);
    expect(upvoteResult.voteScore).toBe(1);
    expect(upvoteResult.upvotes).toBe(1);
    expect(upvoteResult.downvotes).toBe(0);

    // Test 2: Get content votes
    const votes = await contentVoting.getContentVotes(testContentId);
    expect(votes.voteScore).toBe(1);
    expect(votes.upvotes).toBe(1);

    // Test 3: Change to downvote
    const downvoteResult = await contentVoting.castVote(testUserId, testContentId, 'downvote', testChannelId);
    expect(downvoteResult.voteScore).toBe(-1);
    expect(downvoteResult.upvotes).toBe(0);
    expect(downvoteResult.downvotes).toBe(1);

    // Test 4: Remove vote
    const removeResult = await contentVoting.castVote(testUserId, testContentId, 'remove', testChannelId);
    expect(removeResult.voteScore).toBe(0);
    expect(removeResult.upvotes).toBe(0);
    expect(removeResult.downvotes).toBe(0);

    console.log('✅ Phase 3 integration test completed successfully');
  });

  it('should handle trending content correctly', async () => {
    // Create multiple content pieces with votes
    const users = ['user-001', 'user-002', 'user-003'];
    const contentIds = ['trending-001', 'trending-002', 'trending-003'];

    // Cast votes on different content
    for (let i = 0; i < contentIds.length; i++) {
      for (let j = 0; j <= i; j++) {
        await contentVoting.castVote(users[j], contentIds[i], 'upvote', testChannelId);
      }
    }

    // Get trending content
    const trending = contentVoting.getTrendingContent(testChannelId, { limit: 5 });
    
    expect(trending.length).toBeGreaterThan(0);
    expect(trending[0].score).toBeGreaterThanOrEqual(trending[1]?.score || 0);

    console.log('✅ Trending content test completed successfully');
  });

  it('should handle content search correctly', async () => {
    // Create content with different scores
    await contentVoting.castVote('search-user-001', 'search-content-001', 'upvote', testChannelId);
    await contentVoting.castVote('search-user-002', 'search-content-002', 'downvote', testChannelId);

    // Search content by score
    const highScoreResults = contentVoting.searchContent({
      channelId: testChannelId,
      minScore: 1,
      sortBy: 'score'
    });

    const lowScoreResults = contentVoting.searchContent({
      channelId: testChannelId,
      maxScore: -1,
      sortBy: 'score'
    });

    expect(highScoreResults.length).toBeGreaterThan(0);
    expect(lowScoreResults.length).toBeGreaterThan(0);
    expect(highScoreResults[0].score).toBeGreaterThan(0);
    expect(lowScoreResults[0].score).toBeLessThan(0);

    console.log('✅ Content search test completed successfully');
  });

  it('should provide user vote statistics', async () => {
    const statsUserId = 'stats-user-001';
    const contentIds = ['stats-content-001', 'stats-content-002'];

    // Cast votes
    await contentVoting.castVote(statsUserId, contentIds[0], 'upvote', testChannelId);
    await contentVoting.castVote(statsUserId, contentIds[1], 'downvote', testChannelId);

    // Get user stats
    const stats = contentVoting.getUserVoteStats(statsUserId);

    expect(stats.given.upvotes).toBe(1);
    expect(stats.given.downvotes).toBe(1);
    expect(stats.given.total).toBe(2);
    expect(stats.contentVoted).toBe(2);

    console.log('✅ User vote statistics test completed successfully');
  });
});

console.log('✅ Phase 3 Integration Test loaded');






