/**
 * @fileoverview Unified blockchain implementation for storing votes and other immutable records
 * Consolidated from dual blockchain system (Step 0 + blockchain-service)
 * Features: Mutex-protected nonces, VoteTransaction support, event-driven sync
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Mutex } from 'async-mutex';
import { logger } from '../utils/logging/logger.mjs';
import { eventBus } from '../eventBus-service/index.mjs';
import { createError } from '../utils/common/errors.mjs';
import TransactionQueue from './transactionQueue.mjs';
import { VoteTransaction } from './voteTransaction.mjs';

// Create a logger instance for blockchain
const blockchainLogger = logger.child({ module: 'blockchain' });

// 🔒 MUTEX FOR THREAD-SAFE NONCE VALIDATION (Step 0 Feature)
const nonceMutex = new Mutex();

// Configuration
const DIFFICULTY = process.env.NODE_ENV === 'production' ? 4 : 1; // Reduced difficulty for development
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const CHAIN_FILE = path.join(DATA_DIR, 'blockchain', 'chain.jsonl');
const NONCE_FILE = path.join(DATA_DIR, 'blockchain', 'nonces.jsonl');

// Transaction batching configuration
const MAX_BATCH_SIZE = parseInt(process.env.MAX_BATCH_SIZE) || 10;
const MAX_BATCH_AGE_MS = parseInt(process.env.MAX_BATCH_AGE_MS) || 500;

/**
 * Blockchain implementation for immutable records
 */
class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.nonces = new Set();
    this.isInitialized = false;
    
    // Initialize transaction queue
    this.transactionQueue = new TransactionQueue({
      maxTx: MAX_BATCH_SIZE,
      maxAgeMs: MAX_BATCH_AGE_MS,
      miningCallback: this.mineBatch.bind(this)
    });
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.addTransaction = this.addTransaction.bind(this);
    this.mine = this.mine.bind(this);
    this.mineBatch = this.mineBatch.bind(this);
    this.validateChain = this.validateChain.bind(this);
    
    blockchainLogger.info('Blockchain service created', {
      maxBatchSize: MAX_BATCH_SIZE,
      maxBatchAgeMs: MAX_BATCH_AGE_MS
    });
  }

  /**
   * Initialize the blockchain by loading existing chain and nonces
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Ensure data directory exists
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      // Load chain from file if it exists
      try {
        const chainData = await fs.readFile(CHAIN_FILE, 'utf8');
        
        // Handle empty file case
        if (!chainData.trim()) {
          this.chain = [];
          blockchainLogger.info('Blockchain file is empty, starting with empty chain');
        } else {
          const blocks = chainData.trim().split('\n').map(line => JSON.parse(line));
          this.chain = blocks;
          blockchainLogger.info(`Loaded ${this.chain.length} blocks from storage`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          blockchainLogger.error('Error loading blockchain', { error: error.message });
          throw error;
        }
        
        // File doesn't exist, create genesis block
        const genesisBlock = this.createGenesisBlock();
        this.chain.push(genesisBlock);
        
        // Save genesis block
        await fs.writeFile(CHAIN_FILE, JSON.stringify(genesisBlock) + '\n');
        
        blockchainLogger.info('Created genesis block');
      }
      
      // Load used nonces to prevent replay attacks
      try {
        const nonceData = await fs.readFile(NONCE_FILE, 'utf8');
        const nonces = nonceData.trim().split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => JSON.parse(line));
        
        for (const nonce of nonces) {
          this.nonces.add(nonce.value);
        }
        
        blockchainLogger.info(`Loaded ${this.nonces.size} nonces from storage`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          blockchainLogger.error('Error loading nonces', { error: error.message });
          throw error;
        }
        
        blockchainLogger.info('No existing nonces found');
      }
      
      this.isInitialized = true;
      
      // Emit initialization event
      eventBus.emit('blockchain:initialized', { 
        blockCount: this.chain.length,
        nonceCount: this.nonces.size
      });
      
      return true;
    } catch (error) {
      blockchainLogger.error('Failed to initialize blockchain', { error: error.message });
      throw error;
    }
  }

  /**
   * Create the genesis block
   * @returns {Object} Genesis block
   */
  createGenesisBlock() {
    return {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [{ type: 'genesis', data: 'Genesis Block' }],
      previousHash: '0',
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      nonce: 0
    };
  }

  /**
   * Get the latest block in the chain
   * @returns {Object} Latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a transaction to the queue for batched processing
   * @param {string} type - Transaction type
   * @param {Object} data - Transaction data
   * @param {string} nonce - Unique nonce for transaction
   * @param {boolean} forceMine - Force immediate mining
   * @returns {Object} Result with success flag and transaction ID
   */
  async addTransaction(type, data, nonce, forceMine = false) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!type || !data) {
      throw createError('validation', 'Transaction type and data are required');
    }
    
    // 🔒 MUTEX-PROTECTED NONCE VALIDATION (Step 0 Critical Fix)
    // Prevents race condition where two concurrent transactions could use the same nonce
    if (nonce) {
      const release = await nonceMutex.acquire();
      try {
        if (this.nonces.has(nonce)) {
          throw createError('validation', 'Nonce has already been used');
        }
        
        // Add nonce to used nonces
        this.nonces.add(nonce);
        
        // Persist nonce
        const nonceEntry = { value: nonce, timestamp: Date.now() };
        await fs.appendFile(NONCE_FILE, JSON.stringify(nonceEntry) + '\n');
        
        blockchainLogger.debug('Nonce recorded (thread-safe)', { nonce: nonce.substring(0, 10) + '...' });
      } finally {
        // Always release mutex, even on error
        release();
      }
    }
    
    const transaction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      nonce
    };
    
    // Add to pending transactions for immediate availability
    this.pendingTransactions.push(transaction);
    
    blockchainLogger.info('Transaction added to queue', { 
      type, 
      id: transaction.id, 
      forceMine,
      queueSize: this.transactionQueue.getStatus().queueSize
    });
    
    // Emit event
    eventBus.emit('blockchain:transaction:added', { transaction });
    
    // Add to transaction queue for batched mining
    this.transactionQueue.push(transaction, forceMine);
    
    return {
      success: true,
      transactionId: transaction.id
    };
  }

  /**
   * Mine a new block with a batch of transactions
   * @param {Array} transactions - Array of transactions to mine
   * @returns {Promise<Object>} The newly mined block
   */
  async mineBatch(transactions) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!transactions || transactions.length === 0) {
      blockchainLogger.warn('No transactions provided for batch mining');
      return null;
    }
    
    try {
      const previousBlock = this.getLatestBlock();
      const newBlock = {
        index: previousBlock ? previousBlock.index + 1 : 0,
        timestamp: new Date().toISOString(),
        transactions: [...transactions],
        previousHash: previousBlock ? previousBlock.hash : '0',
        nonce: 0
      };
      
      // Mine the block (find a hash with the required difficulty)
      const startTime = Date.now();
      blockchainLogger.info('Started batch mining block', { 
        index: newBlock.index,
        transactionCount: transactions.length,
        txTypes: transactions.map(tx => tx.type)
      });
      
      let hash = '';
      while (!hash.startsWith('0'.repeat(DIFFICULTY))) {
        newBlock.nonce++;
        hash = this.calculateHash(newBlock);
        
        // Yield CPU every 10000 iterations to prevent blocking
        if (newBlock.nonce % 10000 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      
      newBlock.hash = hash;
      
      const miningTime = Date.now() - startTime;
      blockchainLogger.info('Batch block mined successfully', { 
        index: newBlock.index, 
        hash, 
        timeMs: miningTime,
        transactions: newBlock.transactions.length,
        avgTimePerTx: Math.round(miningTime / transactions.length)
      });
      
      // Add to chain
      this.chain.push(newBlock);
      
      // Persist block
      await fs.appendFile(CHAIN_FILE, JSON.stringify(newBlock) + '\n');
      
      // Remove mined transactions from pending
      const minedTxIds = new Set(transactions.map(tx => tx.id));
      this.pendingTransactions = this.pendingTransactions.filter(tx => !minedTxIds.has(tx.id));
      
      // Emit event
      eventBus.emit('blockchain:block:mined', { 
        block: newBlock, 
        miningTime,
        batchSize: transactions.length
      });
      
      return newBlock;
    } catch (error) {
      blockchainLogger.error('Batch mining failed', { 
        error: error.message,
        stack: error.stack,
        transactionCount: transactions.length
      });
      throw error;
    }
  }

  /**
   * Mine a new block with pending transactions (legacy method for compatibility)
   * @returns {Promise<Object>} The newly mined block
   */
  async mine() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.pendingTransactions.length === 0) {
      throw createError('validation', 'No pending transactions to mine');
    }
    
    // Use batch mining for consistency
    const transactions = [...this.pendingTransactions];
    return await this.mineBatch(transactions);
  }

  /**
   * Calculate hash for a block
   * @param {Object} block - Block to hash
   * @returns {string} Block hash
   */
  calculateHash(block) {
    const blockString = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  /**
   * Validate the integrity of the blockchain
   * @returns {Object} Validation result
   */
  validateChain() {
    if (this.chain.length === 0) {
      return { valid: false, error: 'Empty chain' };
    }
    
    // Check each block
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Validate hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return { 
          valid: false, 
          error: `Block ${currentBlock.index} has invalid hash` 
        };
      }
      
      // Validate previous hash reference
      if (currentBlock.previousHash !== previousBlock.hash) {
        return { 
          valid: false, 
          error: `Block ${currentBlock.index} has invalid previous hash reference` 
        };
      }
      
      // Validate hash meets difficulty requirement
      if (!currentBlock.hash.startsWith('0'.repeat(DIFFICULTY))) {
        return { 
          valid: false, 
          error: `Block ${currentBlock.index} hash doesn't meet difficulty requirement` 
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * Find transactions by type
   * @param {string} type - Transaction type to search for
   * @returns {Array} Matching transactions
   */
  findTransactionsByType(type) {
    if (!type) {
      return [];
    }
    
    const transactions = [];
    
    // Search through all blocks
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.type === type) {
          transactions.push({
            ...transaction,
            blockIndex: block.index,
            blockHash: block.hash
          });
        }
      }
    }
    
    return transactions;
  }

  /**
   * Find a transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|null} Transaction or null if not found
   */
  findTransactionById(id) {
    if (!id) {
      return null;
    }
    
    // Search through all blocks
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.id === id) {
          return {
            ...transaction,
            blockIndex: block.index,
            blockHash: block.hash
          };
        }
      }
    }
    
    // Check pending transactions
    for (const transaction of this.pendingTransactions) {
      if (transaction.id === id) {
        return {
          ...transaction,
          pending: true
        };
      }
    }
    
    return null;
  }

  /**
   * Get chain stats
   * @returns {Object} Chain statistics
   */
  getStats() {
    const queueStatus = this.transactionQueue.getStatus();
    return {
      blocks: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      queuedTransactions: queueStatus.queueSize,
      nonces: this.nonces.size,
      lastBlockTimestamp: this.chain.length > 0 ? this.getLatestBlock().timestamp : null,
      lastBlockHash: this.chain.length > 0 ? this.getLatestBlock().hash : null,
      queueStatus: queueStatus,
      batchingConfig: {
        maxBatchSize: MAX_BATCH_SIZE,
        maxBatchAgeMs: MAX_BATCH_AGE_MS
      }
    };
  }

  /**
   * Get blockchain debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const latestBlock = this.getLatestBlock();
    const queueStatus = this.transactionQueue.getStatus();
    
    return {
      implementation: 'src/backend/blockchain-service/index.mjs',
      version: '1.0.0',
      isInitialized: this.isInitialized,
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      queuedTransactions: queueStatus.queueSize,
      lastBlockHash: latestBlock ? latestBlock.hash : null,
      lastBlockTimestamp: latestBlock ? latestBlock.timestamp : null,
      lastBlockIndex: latestBlock ? latestBlock.index : -1,
      noncesUsed: this.nonces.size,
      queueStatus: queueStatus,
      batchingConfig: {
        maxBatchSize: MAX_BATCH_SIZE,
        maxBatchAgeMs: MAX_BATCH_AGE_MS,
        allowAutoMining: process.env.ALLOW_AUTO_MINING !== 'false',
        forceMineOnDemand: process.env.FORCE_MINE_ON_DEMAND === 'true'
      },
      difficulty: DIFFICULTY,
      dataFiles: {
        chainFile: CHAIN_FILE,
        nonceFile: NONCE_FILE
      }
    };
  }

  /**
   * Force flush all pending transactions
   * @returns {Promise<Object>} Result of forced flush
   */
  async forceFlush() {
    blockchainLogger.info('Force flush requested');
    await this.transactionQueue.forceFlush();
    return { success: true, message: 'Force flush completed' };
  }
}

// Create singleton instance
const blockchain = new Blockchain();

export default blockchain;
export { VoteTransaction };
