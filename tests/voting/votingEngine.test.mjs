// test/backend/voting/votingEngine.test.mjs

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  processVote, 
  getVoteResults,
  getVoteStatus,
  getUserVote,
  getVoteTallies,
  revokeVote,
  resetVotes,
  getFilteredVoteResults,
  getVoteResultsWithFilters,
  processVoteHandler,
  getTopicStatus
} from '../../src/backend/voting/votingEngine.mjs';
import { getTopicRegion, setTopicRegion } from '../../src/backend/voting/topicRegionUtils.mjs';

// Mock dependencies
vi.mock('../../src/backend/voting/voteVerifier.mjs', () => ({
  verifyVote: vi.fn(),
  isReplay: vi.fn(),
  markReplay: vi.fn()
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => {
  const mockLogger = {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
  return {
    default: mockLogger,
    logger: mockLogger,
    logAction: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
    logWarn: vi.fn(),
    logDebug: vi.fn(),
    blockchainLogger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  };
});

// Mock event bus
vi.mock('../../src/backend/eventBus-service/index.mjs', () => ({
  eventBus: {
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    removeListener: vi.fn()
  }
}));

vi.mock('../../src/backend/state/state.mjs', () => ({
  voteCounts: {},
  userVotes: new Map(),
  appendToJSONLFile: vi.fn(),
  blockchain: {
    initialize: vi.fn().mockResolvedValue(true),
    addTransaction: vi.fn().mockResolvedValue({ id: 'test-transaction' }),
    mine: vi.fn().mockResolvedValue({ hash: '000000hash' }),
    getTransactionById: vi.fn().mockResolvedValue({ id: 'test-transaction', data: {} })
  }
}));

vi.mock('../../src/backend/location/userLocation.mjs', () => ({
  getUserRegion: vi.fn()
}));

vi.mock('../../src/backend/config-service/index.mjs', () => ({
  default: {
    getRegionParameters: vi.fn()
  },
  getRegionParameters: vi.fn()
}));

vi.mock('../../src/backend/websocket-service/index.mjs', () => ({
  default: {
    broadcastToTopic: vi.fn(),
    notifyClients: vi.fn(),
    isRunning: vi.fn(() => false),
    start: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('../../src/backend/voting/voteProcessor.mjs', () => ({
  default: {
    processVoteData: vi.fn(),
    validateVote: vi.fn()
  }
}));

vi.mock('../../src/backend/activityAnalysis-service/index.mjs', () => ({
  default: {
    analyzeVotingPattern: vi.fn(),
    detectAnomalies: vi.fn()
  }
}));

// Mock blockchain service
vi.mock('../../src/backend/blockchain-service/index.mjs', () => {
  const mockBlockchainService = {
    initialize: vi.fn().mockResolvedValue(true),
    addTransaction: vi.fn().mockResolvedValue({ id: 'test-transaction' }),
    mine: vi.fn().mockResolvedValue({ hash: '000000hash' }),
    getTransactionById: vi.fn().mockResolvedValue({ id: 'test-transaction', data: {} }),
    chain: [],
    pendingTransactions: [],
    nonces: new Set(),
    isInitialized: true,
    validateChain: vi.fn().mockReturnValue({ valid: true }),
    calculateHash: vi.fn().mockReturnValue('000000hash'),
    createGenesisBlock: vi.fn().mockReturnValue({
      index: 0,
      timestamp: 1622548800000,
      transactions: [],
      previousHash: '0',
      nonce: 0,
      hash: '000000hash'
    })
  };
  return {
    default: mockBlockchainService,
    blockchain: mockBlockchainService,
    Blockchain: function() { return mockBlockchainService; }
  };
});

// Mock fs/promises for blockchain operations
vi.mock('fs/promises', () => {
  const mockReadFile = vi.fn().mockImplementation((path) => {
    if (path.includes('chain.jsonl')) {
      // Ensure we return a properly formatted string that can be trimmed
      return Promise.resolve('{"index":0,"timestamp":1622548800000,"transactions":[],"previousHash":"0","nonce":0,"hash":"000000hash"}\n');
    }
    if (path.includes('nonces.jsonl')) {
      return Promise.resolve('{"value":"test1"}\n{"value":"test2"}\n');
    }
    return Promise.resolve('{}');
  });

  const mockFsPromises = {
    readFile: mockReadFile,
    appendFile: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(true),
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true })
  };
  
  return {
    ...mockFsPromises,
    default: mockFsPromises
  };
});

// Import mocked modules
import { getUserRegion } from '../../src/backend/location/userLocation.mjs';
import { getRegionParameters } from '../../src/backend/config-service/index.mjs';
import websocketService from '../../src/backend/websocket-service/index.mjs';
import { voteCounts, userVotes } from '../../src/backend/state/state.mjs';

describe('Voting Engine', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset state
    Object.keys(voteCounts).forEach(key => delete voteCounts[key]);
    userVotes.clear();
    
    // Setup default mock implementations
    getUserRegion.mockResolvedValue('region1');
    getRegionParameters.mockResolvedValue({
      voteThreshold: 10,
      stabilityThreshold: 5000, // 5 seconds
      maxVotesPerUser: 100
    });
    websocketService.broadcastToTopic.mockResolvedValue();
    websocketService.notifyClients.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Topic Region Management', () => {
    it('should set and get topic regions correctly', () => {
      setTopicRegion('topic1', 'region1');
      expect(getTopicRegion('topic1')).toBe('region1');
    });

    it('should return "global" for unset topics', () => {
      expect(getTopicRegion('unknown-topic')).toBe('global');
    });

    it('should overwrite existing topic regions', () => {
      setTopicRegion('topic1', 'region1');
      setTopicRegion('topic1', 'region2');
      expect(getTopicRegion('topic1')).toBe('region2');
    });
  });

  describe('Vote Processing', () => {
    it('should process a local vote correctly', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = 'option1';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      const result = await processVote(publicKey, topic, voteType, choice);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(true);
      expect(result.message).toBe('Vote recorded successfully');
    });

    it('should process a foreign vote correctly', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = 'option1';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region2');

      const result = await processVote(publicKey, topic, voteType, choice);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(false);
      expect(result.message).toBe('Vote recorded successfully');
    });

    it('should handle empty choice values', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = '';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      const result = await processVote(publicKey, topic, voteType, choice);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(true);
      expect(result.message).toBe('Vote recorded successfully');
    });

    it('should handle invalid reliability scores', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = 'option1';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Set up invalid reliability score
      const result = await processVote(publicKey, topic, voteType, choice, -1);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(true);
      expect(result.message).toBe('Vote recorded successfully');
      expect(result.reliability).toBe(0); // Should clamp to 0
    });

    it('should handle errors gracefully', async () => {
      getUserRegion.mockRejectedValue(new Error('Region lookup failed'));

      await expect(processVote('user123', 'topic1', 'rank', 'option1')).rejects.toThrow('Region lookup failed');
    });
  });

  describe('Vote Results and Status', () => {
    beforeEach(() => {
      // Setup test data
      voteCounts['topic1'] = {
        local: {
          rank: {
            'option1': 10,
            'option2': 5,
            'option3': 3
          }
        },
        foreign: {
          rank: {
            'option1': 2,
            'option2': 8,
            'option3': 1
          }
        },
        active: true,
        createdAt: Date.now(),
        totalVotes: 29,
        status: {
          active: true,
          lastUpdated: Date.now()
        }
      };
    });

    it('should return vote results correctly', () => {
      const results = getVoteResults('topic1');
      expect(results).toBeDefined();
      expect(results.local).toBeDefined();
      expect(results.foreign).toBeDefined();
    });

    it('should return vote status correctly', async () => {
      const topic = 'test-topic';
      const voteType = 'up';
      const choice = 'option1';

      // Set up topic region to ensure votes are classified as local
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Add some votes
      await processVote('user1', topic, voteType, choice);
      await processVote('user2', topic, voteType, choice);

      const status = getVoteStatus(topic);
      expect(status).toBeDefined();
      expect(status).toEqual({
        active: true,
        totalVotes: 2,
        localVotes: 2,
        foreignVotes: 0,
        lastVoteTime: expect.any(Number)
      });
    });

    it('should return vote tallies', () => {
      const tallies = getVoteTallies('topic1');
      expect(tallies).toBeDefined();
    });

    it('should return all tallies when no specific topic provided', () => {
      const tallies = getVoteTallies();
      expect(tallies).toBeDefined();
    });

    it('should handle non-existent topics', () => {
      const results = getVoteResults('nonexistent');
      expect(results).toBeDefined();
    });
  });

  describe('Vote Management', () => {
    it('should revoke votes correctly', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      
      // First vote
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');
      await processVote(publicKey, topic, 'rank', 'option1');
      
      // Verify vote exists
      const userVote = getUserVote(publicKey, topic);
      expect(userVote).toBeDefined();
      expect(userVote.choice).toBe('option1');
      
      // Revoke vote
      await revokeVote(publicKey, topic);
      
      // Verify vote is revoked
      const revokedVote = getUserVote(publicKey, topic);
      expect(revokedVote).toBeNull();
    });

    it('should reset all votes', () => {
      // Add some votes first
      voteCounts['topic1'] = { local: { rank: { option1: 5 } }, foreign: {} };
      userVotes.set('user123', { topic1: { choice: 'option1' } });
      
      resetVotes();
      
      // Verify everything is cleared
      expect(Object.keys(voteCounts)).toHaveLength(0);
      expect(userVotes.size).toBe(0);
    });

    it('should get user vote correctly', () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      
      userVotes.set(publicKey, {
        [topic]: { voteType: 'rank', choice: 'option1', category: 'local' }
      });
      
      const userVote = getUserVote(publicKey, topic);
      expect(userVote).toBeDefined();
      expect(userVote.choice).toBe('option1');
    });

    it('should return null for non-existent user votes', () => {
      const userVote = getUserVote('nonexistent', 'topic1');
      expect(userVote).toBeNull();
    });
  });

  describe('Filtered Vote Results', () => {
    beforeEach(() => {
      voteCounts['topic1'] = {
        local: {
          rank: {
            'option1': 10,
            'option2': 5,
            'option3': 3
          }
        },
        foreign: {
          rank: {
            'option1': 2,
            'option2': 8,
            'option3': 1
          }
        },
        active: true,
        createdAt: Date.now(),
        totalVotes: 29
      };
    });

    it('should get filtered vote results', async () => {
      const results = await getFilteredVoteResults('topic1', {
        includeLocal: true,
        includeForeign: false
      });
      
      expect(results).toBeDefined();
    });

    it('should get paginated vote results with filters', async () => {
      // Mock the implementation for getVoteResultsWithFilters
      const mockData = {
        data: [{ choice: 'option1', votes: 10 }],
        pagination: { page: 1, pageSize: 10, total: 1 },
        filters: { voteType: 'rank' }
      };
      
      // Run the test
      const results = await getVoteResultsWithFilters('topic1', 1, 10, {
        voteType: 'rank'
      });
      
      // Use a custom matcher for this test
      expect(results).toBeDefined();
      // We'll use hasOwnProperty directly since toHaveProperty is giving issues
      expect(Object.prototype.hasOwnProperty.call(results, 'data')).toBe(true);
      expect(results).toHaveProperty('pagination');
    });

    it('should handle invalid page parameters', async () => {
      const results = await getVoteResultsWithFilters('topic1', -1, 0);
      
      expect(results).toBeDefined();
    });
  });

  describe('Vote Handler', () => {
    it('should process vote data correctly', async () => {
      const voteData = {
        publicKey: 'user123',
        topic: 'topic1',
        voteType: 'rank',
        choice: 'option1',
        reliability: 1.0
      };
      
      setTopicRegion('topic1', 'region1');
      getUserRegion.mockResolvedValue('region1');
      
      const result = await processVoteHandler(voteData);
      
      expect(result).toBeDefined();
    });

    it('should handle invalid vote data', async () => {
      const invalidVoteData = {
        publicKey: null,
        topic: 'topic1',
        voteType: 'rank',
        choice: 'option1'
      };
      
      await expect(processVoteHandler(invalidVoteData)).rejects.toThrow();
    });
  });

  describe('Topic Status', () => {
    it('should return correct topic status', async () => {
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = 'option1';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Add some votes
      await processVote('user1', topic, voteType, choice);
      await processVote('user2', topic, voteType, choice);

      const status = getTopicStatus(topic);
      expect(status).toBeDefined();
      expect(status).toEqual({
        active: true,
        totalVotes: 2,
        localVotes: 2,
        foreignVotes: 0,
        lastVoteTime: expect.any(Number),
        region: 'region1'
      });
    });

    it('should handle non-existent topics', () => {
      const status = getVoteStatus('nonexistent');
      
      expect(status).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      await expect(processVote(null, 'topic1', 'rank', 'option1')).rejects.toThrow();
      await expect(processVote('user123', null, 'rank', 'option1')).rejects.toThrow();
      await expect(processVote('user123', 'topic1', null, 'option1')).rejects.toThrow();
    });

    it('should handle empty choice values', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = '';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      const result = await processVote(publicKey, topic, voteType, choice);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(true);
      expect(result.message).toBe('Vote recorded successfully');
    });

    it('should handle invalid reliability scores', async () => {
      const publicKey = 'user123';
      const topic = 'topic1';
      const voteType = 'rank';
      const choice = 'option1';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Set up invalid reliability score
      const result = await processVote(publicKey, topic, voteType, choice, -1);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isLocalVote).toBe(true);
      expect(result.message).toBe('Vote recorded successfully');
      expect(result.reliability).toBe(0); // Should clamp to 0
    });

    it('should handle concurrent vote processing', async () => {
      setTopicRegion('topic1', 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Simulate concurrent votes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(processVote(`user${i}`, 'topic1', 'rank', 'option1'));
      }

      await Promise.all(promises);

      // Should handle all votes correctly
      expect(voteCounts['topic1'].local.rank.option1).toBe(10);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle a complete voting workflow', async () => {
      const topic = 'topic1';
      const voteType = 'rank';
      
      setTopicRegion(topic, 'region1');
      getUserRegion.mockResolvedValue('region1');

      // Multiple users vote
      const votes = [
        { user: 'user1', choice: 'option1' },
        { user: 'user2', choice: 'option2' },
        { user: 'user3', choice: 'option2' }
      ];

      for (const vote of votes) {
        const result = await processVote(vote.user, topic, voteType, vote.choice);
        expect(result.success).toBe(true);
      }

      // Check vote status
      const status = getVoteStatus(topic);
      expect(status).toBeDefined();
      expect(status).toEqual({
        active: true,
        totalVotes: 3,
        localVotes: 3,
        foreignVotes: 0,
        lastVoteTime: expect.any(Number)
      });

      // Check vote counts
      const results = getVoteResults(topic);
      expect(results).toBeDefined();
      expect(results.local[voteType]).toEqual({
        option1: 1,
        option2: 2
      });
    });
  });
});






