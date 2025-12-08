/**
 * @fileoverview Simple blockchain implementation for storing votes and other immutable records
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Mutex } from 'async-mutex';
import { logger } from '../utils/logging/logger.mjs';
import { eventBus } from '../eventBus-service/index.mjs';
import { createError } from '../utils/common/errors.mjs';

// Create a logger instance for blockchain
const blockchainLogger = logger.child({ module: 'blockchain' });

// 🔒 Mutex for thread-safe nonce checking
const nonceMutex = new Mutex();

// Configuration
const DIFFICULTY = 4; // Number of leading zeros required in hash
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const CHAIN_FILE = path.join(DATA_DIR, 'blockchain', 'chain.jsonl');
const NONCE_FILE = path.join(DATA_DIR, 'blockchain', 'nonces.jsonl');

/**
 * Blockchain implementation for immutable records
 */
class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.nonces = new Set();
    this.isInitialized = false;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.addTransaction = this.addTransaction.bind(this);
    this.mine = this.mine.bind(this);
    this.validateChain = this.validateChain.bind(this);
    
    blockchainLogger.info('Blockchain service created');
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
        const blocks = chainData.trim().split('\n').map(line => JSON.parse(line));
        this.chain = blocks;
        
        blockchainLogger.info(`Loaded ${this.chain.length} blocks from storage`);
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
        const nonces = nonceData.trim().split('\n').map(line => JSON.parse(line));
        
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
   * Add a transaction to pending transactions
   * @param {string} type - Transaction type
   * @param {Object} data - Transaction data
   * @param {string} nonce - Unique nonce for transaction
   * @returns {Object} Result with success flag and transaction ID
   */
  async addTransaction(type, data, nonce) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!type || !data) {
      throw createError('ValidationError', 'Transaction type and data are required');
    }
    
    // 🔒 THREAD-SAFE NONCE VALIDATION
    // Acquire mutex lock to prevent race conditions
    const release = await nonceMutex.acquire();
    
    try {
      // Validate nonce to prevent replay attacks
      if (nonce) {
        if (this.nonces.has(nonce)) {
          throw createError('ValidationError', 'Nonce has already been used');
        }
        
        // Add nonce to used nonces
        this.nonces.add(nonce);
        
        // Persist nonce
        const nonceEntry = { value: nonce, timestamp: Date.now() };
        await fs.appendFile(NONCE_FILE, JSON.stringify(nonceEntry) + '\n');
        
        blockchainLogger.debug('Nonce recorded', { nonce });
      }
      
      const transaction = {
        id: crypto.randomUUID(),
        type,
        data,
        timestamp: Date.now(),
        nonce
      };
      
      this.pendingTransactions.push(transaction);
      
      blockchainLogger.info('Transaction added to pending', { type, id: transaction.id });
      
      // Emit event
      eventBus.emit('blockchain:transaction:added', { transaction });
      
      return {
        success: true,
        transactionId: transaction.id
      };
      
    } finally {
      // Always release mutex, even if error occurs
      release();
    }
  }

  /**
   * Mine a new block with pending transactions
   * @returns {Promise<Object>} The newly mined block
   */
  async mine() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.pendingTransactions.length === 0) {
      throw createError('ValidationError', 'No pending transactions to mine');
    }
    
    const previousBlock = this.getLatestBlock();
    const newBlock = {
      index: previousBlock.index + 1,
      timestamp: new Date().toISOString(),
      transactions: [...this.pendingTransactions],
      previousHash: previousBlock.hash,
      nonce: 0
    };
    
    // Mine the block (find a hash with the required difficulty)
    const startTime = Date.now();
    blockchainLogger.info('Started mining block', { index: newBlock.index });
    
    let hash = '';
    while (!hash.startsWith('0'.repeat(DIFFICULTY))) {
      newBlock.nonce++;
      hash = this.calculateHash(newBlock);
    }
    
    newBlock.hash = hash;
    
    const miningTime = Date.now() - startTime;
    blockchainLogger.info('Block mined successfully', { 
      index: newBlock.index, 
      hash, 
      timeMs: miningTime,
      transactions: newBlock.transactions.length
    });
    
    // Add to chain
    this.chain.push(newBlock);
    
    // Persist block
    await fs.appendFile(CHAIN_FILE, JSON.stringify(newBlock) + '\n');
    
    // Clear pending transactions
    this.pendingTransactions = [];
    
    // Emit event
    eventBus.emit('blockchain:block:mined', { 
      block: newBlock, 
      miningTime 
    });
    
    return newBlock;
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
    return {
      blocks: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      nonces: this.nonces.size,
      lastBlockTimestamp: this.chain.length > 0 ? this.getLatestBlock().timestamp : null
    };
  }
}

// Create singleton instance
const blockchain = new Blockchain();

export default blockchain;
