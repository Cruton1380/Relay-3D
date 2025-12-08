/**
 * @fileoverview Tests for Blockchain Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger implementation
vi.mock('../../src/backend/utils/logging/logger.mjs', () => {
  const mockChildLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  };
  
  const mockLogger = {
    child: vi.fn(() => mockChildLogger),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  };
  
  return {
    default: mockLogger,
    logger: mockLogger,
    mockChildLogger,
    mockLogger
  };
});

// Mock event bus
vi.mock('../../src/backend/eventBus-service/index.mjs', () => ({
  eventBus: {
    emit: vi.fn()
  }
}));

// Mock errors utility
vi.mock('../../src/backend/utils/common/errors.mjs', () => ({
  createError: vi.fn((type, message, details) => {
    const error = new Error(message);
    error.type = type;
    error.details = details;
    return error;
  })
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    mkdir: vi.fn().mockResolvedValue()
  }
}));

// Import modules AFTER mocks are defined
import fs from 'fs/promises';
import { eventBus } from '../../src/backend/eventBus-service/index.mjs';
import { mockChildLogger } from '../../src/backend/utils/logging/logger.mjs';
import blockchain from '../../src/backend/blockchain-service/index.mjs';

describe('Blockchain Service', () => {
  beforeEach(async () => {
    // Set test environment for reduced mining difficulty
    process.env.NODE_ENV = 'test';
    vi.resetAllMocks();
    
    // Setup default fs mocks
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.appendFile).mockResolvedValue();
    vi.mocked(fs.mkdir).mockResolvedValue();
    
    // Reset blockchain state
    blockchain.chain = [];
    blockchain.pendingTransactions = [];
    blockchain.nonces = new Set();
    blockchain.isInitialized = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  describe('initialization', () => {
    it('should initialize blockchain with genesis block when no chain exists', async () => {
      // Act
      const result = await blockchain.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(blockchain.chain).toHaveLength(1);
      expect(blockchain.chain[0].index).toBe(0);
      expect(blockchain.chain[0].transactions[0].data).toBe('Genesis Block');
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith('blockchain:initialized', expect.any(Object));
      expect(mockChildLogger.info).toHaveBeenCalledWith('Created genesis block');
    });    it('should load existing blockchain from file', async () => {
      // Arrange
      const existingBlocks = [
        { 
          index: 0, 
          transactions: [{ type: 'genesis', data: 'Genesis Block' }], 
          hash: 'genesis-hash', 
          previousHash: '0', 
          timestamp: new Date().toISOString(), 
          nonce: 0 
        },
        { 
          index: 1, 
          transactions: [{ type: 'test', data: 'Block 1' }], 
          hash: 'block-1-hash', 
          previousHash: 'genesis-hash', 
          timestamp: new Date().toISOString(), 
          nonce: 123 
        }
      ];
      const chainData = existingBlocks.map(block => JSON.stringify(block)).join('\n');
      vi.mocked(fs.readFile).mockResolvedValueOnce(chainData);
      
      // Act
      const result = await blockchain.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(blockchain.chain).toHaveLength(2);
      expect(blockchain.chain[0].transactions[0].data).toBe('Genesis Block');
      expect(blockchain.chain[1].transactions[0].data).toBe('Block 1');
      expect(mockChildLogger.info).toHaveBeenCalledWith('Loaded 2 blocks from storage');
    });

    it('should load existing nonces to prevent replay attacks', async () => {
      // Arrange
      const nonces = [
        { value: 'nonce1', timestamp: Date.now() },
        { value: 'nonce2', timestamp: Date.now() }
      ];
      const nonceData = nonces.map(nonce => JSON.stringify(nonce)).join('\n');
      
      vi.mocked(fs.readFile)
        .mockRejectedValueOnce({ code: 'ENOENT' }) // Chain file doesn't exist
        .mockResolvedValueOnce(nonceData); // Nonce file exists
      
      // Act
      await blockchain.initialize();
      
      // Assert
      expect(blockchain.nonces.has('nonce1')).toBe(true);
      expect(blockchain.nonces.has('nonce2')).toBe(true);
      expect(mockChildLogger.info).toHaveBeenCalledWith('Loaded 2 nonces from storage');
    });    it('should handle initialization errors gracefully', async () => {
      // Arrange
      const error = new Error('File system error');
      vi.mocked(fs.readFile).mockRejectedValue(error);
      vi.mocked(fs.writeFile).mockRejectedValue(error);
      vi.mocked(fs.mkdir).mockRejectedValue(error);
      
      // Act & Assert
      await expect(blockchain.initialize()).rejects.toThrow('File system error');
      expect(mockChildLogger.error).toHaveBeenCalledWith('Failed to initialize blockchain', expect.any(Object));
    });
  });
  describe('addTransaction', () => {
    beforeEach(async () => {
      await blockchain.initialize();
    });

    it('should add valid transaction to pending transactions', async () => {
      // Arrange
      const type = 'vote';
      const data = { topic: 'test', choice: 'yes' };
      const nonce = 'unique-nonce';
      
      // Act
      const result = await blockchain.addTransaction(type, data, nonce);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(blockchain.pendingTransactions).toHaveLength(1);
      expect(blockchain.pendingTransactions[0].type).toBe(type);
      expect(blockchain.pendingTransactions[0].data).toEqual(data);
      expect(blockchain.nonces.has('unique-nonce')).toBe(true);
      expect(mockChildLogger.info).toHaveBeenCalledWith('Transaction added to pending', expect.any(Object));
    });

    it('should reject transaction with duplicate nonce', async () => {
      // Arrange
      const type = 'vote';
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      const nonce = 'same-nonce';
      
      // Act & Assert
      const result1 = await blockchain.addTransaction(type, data1, nonce);
      expect(result1.success).toBe(true);
      
      await expect(blockchain.addTransaction(type, data2, nonce))
        .rejects.toThrow('Nonce has already been used');
      
      expect(blockchain.pendingTransactions).toHaveLength(1);
    });

    it('should reject transaction with missing required fields', async () => {
      // Act & Assert
      await expect(blockchain.addTransaction(null, null))
        .rejects.toThrow('Transaction type and data are required');
      
      expect(blockchain.pendingTransactions).toHaveLength(0);
    });
  });  describe('mining', () => {
    beforeEach(async () => {
      await blockchain.initialize();
    });
    
    it('should mine a new block with pending transactions', async () => {
      // Arrange
      const type = 'vote';
      const data = { topic: 'test', choice: 'yes' };
      const nonce = 'unique-nonce';
      
      await blockchain.addTransaction(type, data, nonce);
      
      // Act
      const newBlock = await blockchain.mine();
      
      // Assert
      expect(newBlock).toBeDefined();
      expect(newBlock.index).toBe(1);
      expect(newBlock.transactions).toHaveLength(1);      expect(newBlock.transactions[0].type).toBe(type);
      expect(newBlock.transactions[0].data).toEqual(data);
      expect(newBlock.hash.startsWith('0')).toBe(true); // Difficulty check (reduced for tests)
      expect(blockchain.chain).toHaveLength(2);
      expect(blockchain.pendingTransactions).toHaveLength(0);
      expect(vi.mocked(fs.appendFile)).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith('blockchain:block:mined', expect.any(Object));
    }, 10000); // Increase timeout to 10 seconds for mining operations
    
    it('should not mine when no pending transactions', async () => {
      // Act & Assert
      await expect(blockchain.mine()).rejects.toThrow('No pending transactions to mine');
    });

    it('should handle mining errors gracefully', async () => {
      // Arrange
      await blockchain.addTransaction('test', { data: 'test' }, 'test-nonce');
      vi.mocked(fs.appendFile).mockRejectedValueOnce(new Error('Disk full'));
      
      // Act & Assert
      await expect(blockchain.mine()).rejects.toThrow('Disk full');
      expect(mockChildLogger.error).toHaveBeenCalled();
    }, 10000); // Increase timeout to 10 seconds for mining operations
  });
  describe('chain validation', () => {
    beforeEach(async () => {
      await blockchain.initialize();
    });    it('should validate a valid blockchain', async () => {
      // Arrange - Mine a few blocks
      await blockchain.addTransaction('test', { test: 'data1' }, 'nonce1');
      await blockchain.mine();
      
      await blockchain.addTransaction('test', { test: 'data2' }, 'nonce2');
      await blockchain.mine();
      
      // Act
      const validation = blockchain.validateChain();
      
      // Assert
      expect(validation.valid).toBe(true);
    }, 15000); // Increase timeout to 15 seconds for mining operations

    it('should detect invalid hash in blockchain', () => {
      // Arrange
      blockchain.chain.push({
        index: 1,
        transactions: [],
        timestamp: new Date().toISOString(),
        previousHash: blockchain.chain[0].hash,
        hash: 'invalid-hash',
        nonce: 0
      });
      
      // Act
      const validation = blockchain.validateChain();
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('invalid hash');
    });

    it('should detect broken chain links', () => {
      // Arrange
      const validBlock = {
        index: 1,
        transactions: [],
        timestamp: new Date().toISOString(),
        previousHash: 'wrong-previous-hash',
        nonce: 0
      };
      validBlock.hash = blockchain.calculateHash(validBlock);
      blockchain.chain.push(validBlock);
      
      // Act
      const validation = blockchain.validateChain();
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('invalid previous hash reference');
    });

    it('should return error for empty chain', () => {
      // Arrange
      blockchain.chain = [];
      
      // Act
      const validation = blockchain.validateChain();
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Empty chain');
    });
  });  describe('transaction queries', () => {
    beforeEach(async () => {
      await blockchain.initialize();
      
      // Add some test transactions and mine them
      await blockchain.addTransaction('vote', { topic: 'proposal-1', choice: 'yes' }, 'nonce1');
      await blockchain.addTransaction('invite', { inviteeId: 'user123' }, 'nonce2');
      await blockchain.addTransaction('vote', { topic: 'proposal-2', choice: 'no' }, 'nonce3');
      await blockchain.mine();
    }, 20000); // Increase timeout to 20 seconds for mining operations

    it('should find transactions by type', () => {
      // Act
      const voteTransactions = blockchain.findTransactionsByType('vote');
      const inviteTransactions = blockchain.findTransactionsByType('invite');
      
      // Assert
      expect(voteTransactions).toHaveLength(2);
      expect(voteTransactions[0].type).toBe('vote');
      expect(voteTransactions[1].type).toBe('vote');
      expect(inviteTransactions).toHaveLength(1);
      expect(inviteTransactions[0].type).toBe('invite');
    });

    it('should find transaction by ID', async () => {
      // Get the ID of a mined transaction
      const voteTransactions = blockchain.findTransactionsByType('vote');
      const transactionId = voteTransactions[0].id;
      
      // Act
      const transaction = blockchain.findTransactionById(transactionId);
      const nonExistent = blockchain.findTransactionById('non-existent');
      
      // Assert
      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(transactionId);
      expect(transaction.type).toBe('vote');
      expect(nonExistent).toBeNull();
    });

    it('should return empty array for non-existent transaction type', () => {
      // Act
      const result = blockchain.findTransactionsByType('non-existent-type');
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  describe('utility methods', () => {
    beforeEach(async () => {
      await blockchain.initialize();
    });

    it('should calculate hash consistently', () => {
      // Arrange
      const block = {
        index: 1,
        transactions: [{ id: 'test' }],
        timestamp: '2023-01-01T00:00:00.000Z',
        previousHash: 'prev-hash',
        nonce: 123
      };
      
      // Act
      const hash1 = blockchain.calculateHash(block);
      const hash2 = blockchain.calculateHash(block);
      
      // Assert
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should get latest block', async () => {
      // Arrange
      await blockchain.addTransaction('test', { test: 'data' }, 'nonce1');
      const newBlock = await blockchain.mine();
        // Act
      const latestBlock = blockchain.getLatestBlock();
      
      // Assert
      expect(latestBlock).toEqual(newBlock);
      expect(latestBlock.index).toBe(1);
    });

    it('should get blockchain statistics', async () => {
      // Arrange
      await blockchain.addTransaction('test', { test: 'data' }, 'nonce1');
      await blockchain.addTransaction('test', { test: 'data2' }, 'nonce2');
      await blockchain.mine();
      
      // Act
      const stats = blockchain.getStats();
      
      // Assert
      expect(stats.blocks).toBe(2); // Genesis + mined block
      expect(stats.pendingTransactions).toBe(0);
      expect(stats.nonces).toBe(2);
      expect(stats.lastBlockTimestamp).toBeDefined();
    }, 10000); // Add 10 second timeout for mining operation
  });
  describe('error handling', () => {
    it('should handle corrupted chain file gracefully', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValueOnce('invalid-json-data');
      
      // Act & Assert
      await expect(blockchain.initialize()).rejects.toThrow();
      expect(mockChildLogger.error).toHaveBeenCalled();
    });

    it('should handle missing data directory', async () => {
      // Arrange
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));
      
      // Act & Assert
      await expect(blockchain.initialize()).rejects.toThrow('Permission denied');
    });
  });
});






