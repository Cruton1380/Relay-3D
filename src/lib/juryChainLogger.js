/**
 * JURY CHAIN LOGGER
 * Immutable blockchain logging for jury decisions, selections, and badge issuance
 * Ensures tamper-proof audit trails while preserving privacy
 */

import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class JuryChainLogger extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadConfig();
    this.chainData = this.loadChainData();
    this.transactionQueue = [];
    this.blockHeight = this.chainData.blocks.length;
    this.pendingTransactions = new Map();
    this.hashValidator = new HashValidator();
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/jurySystem.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.jurySystem.security;
    } catch (error) {
      console.warn('Failed to load chain logger config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      blockchainAuditTrail: true,
      antiManipulation: true,
      biasDetection: true,
      encryptedCommunication: true
    };
  }

  loadChainData() {
    try {
      const chainPath = join(__dirname, '../data/jury_chain.json');
      if (existsSync(chainPath)) {
        return JSON.parse(readFileSync(chainPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load existing chain data, creating new chain');
    }
    
    // Initialize genesis block
    return this.createGenesisChain();
  }

  createGenesisChain() {
    const genesisBlock = {
      blockHeight: 0,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: Date.now(),
      transactions: [],
      merkleRoot: this.calculateMerkleRoot([]),
      nonce: 0,
      hash: null
    };
    
    genesisBlock.hash = this.calculateBlockHash(genesisBlock);
    
    return {
      chainId: 'relay_jury_system_v1',
      version: '1.0.0',
      genesisTimestamp: Date.now(),
      blocks: [genesisBlock],
      totalTransactions: 0,
      lastBlockTime: Date.now()
    };
  }

  /**
   * Log jury sortition selection with immutable record
   */
  async logJurySelection(selectionData) {
    try {
      console.log(`[CHAIN_LOGGER] Logging jury selection: ${selectionData.sortitionId}`);
      
      const transaction = {
        type: 'jury_selection',
        transactionId: this.generateTransactionId('selection', selectionData.sortitionId),
        timestamp: Date.now(),
        data: {
          sortitionId: selectionData.sortitionId,
          caseId: selectionData.caseId,
          jurorCount: selectionData.jurorCount,
          selectionTimestamp: selectionData.selectionTimestamp,
          sortitionRatio: selectionData.sortitionRatio,
          
          // Privacy-preserving hashes
          jurorHashes: selectionData.jurorHashes,
          caseHash: this.hashCaseId(selectionData.caseId),
          
          // Selection metadata
          trustScoreDistribution: selectionData.trustScoreDistribution,
          geographicDistribution: selectionData.geographicDistribution,
          
          // Verification data
          selectionAlgorithmVersion: '1.0',
          biasScore: selectionData.biasScore || 0,
          eligibilityChecksCompleted: true
        },
        signature: await this.signTransaction(selectionData)
      };
      
      await this.submitTransaction(transaction);
      
      return {
        success: true,
        transactionId: transaction.transactionId,
        blockHeight: this.blockHeight,
        timestamp: transaction.timestamp
      };
      
    } catch (error) {
      console.error('[CHAIN_LOGGER] Error logging jury selection:', error);
      throw new Error(`Failed to log jury selection: ${error.message}`);
    }
  }

  /**
   * Log jury deliberation and voting with encrypted content
   */
  async logJuryDeliberation(deliberationData) {
    try {
      console.log(`[CHAIN_LOGGER] Logging jury deliberation: ${deliberationData.caseId}`);
      
      const transaction = {
        type: 'jury_deliberation',
        transactionId: this.generateTransactionId('deliberation', deliberationData.caseId),
        timestamp: Date.now(),
        data: {
          caseId: deliberationData.caseId,
          deliberationId: deliberationData.deliberationId,
          
          // Aggregated deliberation metrics (privacy-preserving)
          participationMetrics: {
            totalMessages: deliberationData.totalMessages,
            uniqueParticipants: deliberationData.uniqueParticipants,
            deliberationDuration: deliberationData.deliberationDuration,
            consensusReached: deliberationData.consensusReached
          },
          
          // Encrypted deliberation summary
          encryptedSummary: await this.encryptDeliberationSummary(deliberationData.summary),
          
          // Vote summary (anonymized)
          votesSummary: {
            noAction: deliberationData.votes.no_action || 0,
            reverify: deliberationData.votes.reverify || 0,
            escalate: deliberationData.votes.escalate || 0,
            totalVotes: deliberationData.totalVotes,
            outcome: deliberationData.outcome
          },
          
          // Verification
          deliberationHash: this.hashDeliberationContent(deliberationData),
          jurorParticipationHashes: deliberationData.jurorHashes
        },
        signature: await this.signTransaction(deliberationData)
      };
      
      await this.submitTransaction(transaction);
      
      return {
        success: true,
        transactionId: transaction.transactionId,
        blockHeight: this.blockHeight,
        timestamp: transaction.timestamp
      };
      
    } catch (error) {
      console.error('[CHAIN_LOGGER] Error logging deliberation:', error);
      throw new Error(`Failed to log jury deliberation: ${error.message}`);
    }
  }

  /**
   * Log reverification attempts and results
   */
  async logReverification(reverificationData) {
    try {
      console.log(`[CHAIN_LOGGER] Logging reverification: ${reverificationData.verificationId}`);
      
      const transaction = {
        type: 'reverification',
        transactionId: this.generateTransactionId('reverification', reverificationData.verificationId),
        timestamp: Date.now(),
        data: {
          verificationId: reverificationData.verificationId,
          caseId: reverificationData.caseId,
          verificationType: reverificationData.type, // 'single_account' or 'duplicate_detection'
          
          // Privacy-preserving user hashes
          userHashes: reverificationData.userIds.map(id => this.hashUserId(id)),
          
          // Verification process data
          initiationTimestamp: reverificationData.initiationTimestamp,
          completionTimestamp: reverificationData.completionTimestamp,
          verificationResult: reverificationData.result,
          
          // Location verification (anonymized)
          locationVerifications: reverificationData.locations.map(loc => ({
            locationHash: this.hashLocation(loc),
            verificationSuccess: loc.success,
            timestamp: loc.timestamp,
            proximityProofHash: this.hashProximityProof(loc.proof)
          })),
          
          // Duplicate detection results (if applicable)
          duplicateAnalysis: reverificationData.duplicateAnalysis ? {
            likelyDuplicate: reverificationData.duplicateAnalysis.likelyDuplicate,
            confidence: reverificationData.duplicateAnalysis.confidence,
            timingAnalysisHash: this.hashTimingAnalysis(reverificationData.duplicateAnalysis)
          } : null,
          
          // Verification integrity
          challengeResponseHash: this.hashChallengeResponse(reverificationData.challenges),
          cryptographicProofHash: this.hashCryptographicProof(reverificationData.proofs)
        },
        signature: await this.signTransaction(reverificationData)
      };
      
      await this.submitTransaction(transaction);
      
      return {
        success: true,
        transactionId: transaction.transactionId,
        blockHeight: this.blockHeight,
        timestamp: transaction.timestamp
      };
      
    } catch (error) {
      console.error('[CHAIN_LOGGER] Error logging reverification:', error);
      throw new Error(`Failed to log reverification: ${error.message}`);
    }
  }

  /**
   * Log civic badge issuance with full verification chain
   */
  async logBadgeIssuance(badgeData) {
    try {
      console.log(`[CHAIN_LOGGER] Logging badge issuance: ${badgeData.badgeId}`);
      
      const transaction = {
        type: 'badge_issuance',
        transactionId: this.generateTransactionId('badge', badgeData.badgeId),
        timestamp: Date.now(),
        data: {
          badgeId: badgeData.badgeId,
          badgeType: badgeData.badgeType,
          
          // Privacy-preserving identifiers
          jurorHash: this.hashUserId(badgeData.jurorId),
          caseHash: this.hashCaseId(badgeData.caseId),
          
          // Badge metadata
          badgeMetadata: {
            category: badgeData.metadata.category,
            rarity: badgeData.metadata.rarity,
            points: badgeData.metadata.points,
            issuedAt: badgeData.issuedAt,
            version: badgeData.version
          },
          
          // Case context (anonymized)
          caseContext: {
            caseType: badgeData.metadata.caseDetails.caseType,
            region: badgeData.metadata.caseDetails.region,
            outcome: badgeData.metadata.caseDetails.outcome,
            consensusReached: badgeData.metadata.caseDetails.consensusReached
          },
          
          // Participation verification
          participationProofs: {
            eligibilityProofHash: this.hashEligibilityProof(badgeData.eligibilityProof),
            deliberationProofHash: this.hashDeliberationProof(badgeData.deliberationProof),
            voteProofHash: this.hashVoteProof(badgeData.voteProof)
          },
          
          // Cryptographic verification
          contentHash: badgeData.cryptographicProof.contentHash,
          issuanceProof: badgeData.cryptographicProof.issuanceProof,
          verificationSignature: badgeData.cryptographicProof.verificationSignature,
          
          // Gratitude message (if present)
          hasGratitudeMessage: badgeData.gratitude?.hasMessage || false,
          gratitudeMessageHash: badgeData.gratitude?.messageHash || null
        },
        signature: await this.signTransaction(badgeData)
      };
      
      await this.submitTransaction(transaction);
      
      return {
        success: true,
        transactionId: transaction.transactionId,
        blockHeight: this.blockHeight,
        timestamp: transaction.timestamp,
        badgeHash: transaction.data.contentHash
      };
      
    } catch (error) {
      console.error('[CHAIN_LOGGER] Error logging badge issuance:', error);
      throw new Error(`Failed to log badge issuance: ${error.message}`);
    }
  }

  /**
   * Submit transaction to blockchain queue
   */
  async submitTransaction(transaction) {
    // Validate transaction structure
    await this.validateTransaction(transaction);
    
    // Add to transaction queue
    this.transactionQueue.push(transaction);
    this.pendingTransactions.set(transaction.transactionId, transaction);
    
    // Mine block if queue is full or time threshold reached
    if (this.shouldMineBlock()) {
      await this.mineBlock();
    }
    
    this.emit('transactionSubmitted', {
      transactionId: transaction.transactionId,
      type: transaction.type,
      timestamp: transaction.timestamp
    });
  }

  /**
   * Mine new block with pending transactions
   */
  async mineBlock() {
    if (this.transactionQueue.length === 0) {
      return;
    }
    
    console.log(`[CHAIN_LOGGER] Mining block with ${this.transactionQueue.length} transactions`);
    
    const previousBlock = this.chainData.blocks[this.chainData.blocks.length - 1];
    
    const newBlock = {
      blockHeight: this.blockHeight + 1,
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      transactions: [...this.transactionQueue],
      merkleRoot: this.calculateMerkleRoot(this.transactionQueue),
      nonce: 0,
      hash: null
    };
    
    // Calculate block hash
    newBlock.hash = this.calculateBlockHash(newBlock);
    
    // Add block to chain
    this.chainData.blocks.push(newBlock);
    this.chainData.totalTransactions += newBlock.transactions.length;
    this.chainData.lastBlockTime = newBlock.timestamp;
    this.blockHeight = newBlock.blockHeight;
    
    // Clear transaction queue
    this.transactionQueue = [];
    
    // Remove from pending
    newBlock.transactions.forEach(tx => {
      this.pendingTransactions.delete(tx.transactionId);
    });
    
    // Persist chain data
    await this.persistChainData();
    
    this.emit('blockMined', {
      blockHeight: newBlock.blockHeight,
      transactionCount: newBlock.transactions.length,
      blockHash: newBlock.hash,
      timestamp: newBlock.timestamp
    });
    
    console.log(`[CHAIN_LOGGER] Block ${newBlock.blockHeight} mined with hash: ${newBlock.hash.substring(0, 16)}...`);
  }

  /**
   * Verify blockchain integrity and transaction validity
   */
  async verifyChainIntegrity() {
    console.log('[CHAIN_LOGGER] Verifying blockchain integrity...');
    
    let isValid = true;
    const errors = [];
    
    // Verify each block
    for (let i = 1; i < this.chainData.blocks.length; i++) {
      const currentBlock = this.chainData.blocks[i];
      const previousBlock = this.chainData.blocks[i - 1];
      
      // Check previous hash reference
      if (currentBlock.previousHash !== previousBlock.hash) {
        isValid = false;
        errors.push(`Block ${i} has invalid previous hash reference`);
      }
      
      // Verify block hash
      const calculatedHash = this.calculateBlockHash(currentBlock);
      if (currentBlock.hash !== calculatedHash) {
        isValid = false;
        errors.push(`Block ${i} has invalid hash`);
      }
      
      // Verify merkle root
      const calculatedMerkleRoot = this.calculateMerkleRoot(currentBlock.transactions);
      if (currentBlock.merkleRoot !== calculatedMerkleRoot) {
        isValid = false;
        errors.push(`Block ${i} has invalid merkle root`);
      }
      
      // Verify individual transactions
      for (const transaction of currentBlock.transactions) {
        const transactionValid = await this.validateTransaction(transaction);
        if (!transactionValid) {
          isValid = false;
          errors.push(`Block ${i} contains invalid transaction: ${transaction.transactionId}`);
        }
      }
    }
    
    const result = {
      isValid,
      errors,
      totalBlocks: this.chainData.blocks.length,
      totalTransactions: this.chainData.totalTransactions,
      chainId: this.chainData.chainId,
      verifiedAt: Date.now()
    };
    
    console.log(`[CHAIN_LOGGER] Chain integrity verification: ${isValid ? 'VALID' : 'INVALID'}`);
    if (!isValid) {
      console.error('[CHAIN_LOGGER] Chain integrity errors:', errors);
    }
    
    return result;
  }

  /**
   * Query transactions by type, case, or timeframe
   */
  async queryTransactions(queryParams) {
    const { type, caseId, jurorId, timeframe, limit = 100 } = queryParams;
    
    let transactions = [];
    
    // Collect all transactions from all blocks
    for (const block of this.chainData.blocks) {
      transactions.push(...block.transactions.map(tx => ({
        ...tx,
        blockHeight: block.blockHeight,
        blockHash: block.hash,
        blockTimestamp: block.timestamp
      })));
    }
    
    // Apply filters
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    
    if (caseId) {
      const caseHash = this.hashCaseId(caseId);
      transactions = transactions.filter(tx => 
        tx.data.caseId === caseId || tx.data.caseHash === caseHash
      );
    }
    
    if (jurorId) {
      const jurorHash = this.hashUserId(jurorId);
      transactions = transactions.filter(tx => 
        tx.data.jurorHashes?.includes(jurorHash) || tx.data.jurorHash === jurorHash
      );
    }
    
    if (timeframe) {
      const { start, end } = timeframe;
      transactions = transactions.filter(tx => 
        tx.timestamp >= start && tx.timestamp <= end
      );
    }
    
    // Sort by timestamp (newest first) and limit results
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      transactions: transactions.slice(0, limit),
      totalFound: transactions.length,
      queryParams,
      queriedAt: Date.now()
    };
  }

  // Helper methods for hashing and validation
  
  generateTransactionId(type, identifier) {
    const data = `${type}_${identifier}_${Date.now()}_${randomBytes(8).toString('hex')}`;
    return createHash('sha256').update(data).digest('hex');
  }

  calculateBlockHash(block) {
    const blockData = {
      blockHeight: block.blockHeight,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      nonce: block.nonce
    };
    
    return createHash('sha256').update(JSON.stringify(blockData)).digest('hex');
  }

  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) {
      return createHash('sha256').update('').digest('hex');
    }
    
    const txHashes = transactions.map(tx => 
      createHash('sha256').update(JSON.stringify(tx)).digest('hex')
    );
    
    return this.buildMerkleTree(txHashes);
  }

  buildMerkleTree(hashes) {
    if (hashes.length === 1) {
      return hashes[0];
    }
    
    const newLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left; // Duplicate last hash if odd number
      const combined = createHash('sha256').update(left + right).digest('hex');
      newLevel.push(combined);
    }
    
    return this.buildMerkleTree(newLevel);
  }

  shouldMineBlock() {
    const maxTransactionsPerBlock = 100;
    const maxBlockTime = 5 * 60 * 1000; // 5 minutes
    
    return this.transactionQueue.length >= maxTransactionsPerBlock ||
           (this.transactionQueue.length > 0 && 
            Date.now() - this.chainData.lastBlockTime > maxBlockTime);
  }

  async validateTransaction(transaction) {
    // Basic structure validation
    if (!transaction.type || !transaction.transactionId || !transaction.timestamp || !transaction.data) {
      return false;
    }
    
    // Type-specific validation
    switch (transaction.type) {
      case 'jury_selection':
        return this.validateJurySelectionTransaction(transaction);
      case 'jury_deliberation':
        return this.validateDeliberationTransaction(transaction);
      case 'reverification':
        return this.validateReverificationTransaction(transaction);
      case 'badge_issuance':
        return this.validateBadgeTransaction(transaction);
      default:
        return false;
    }
  }

  validateJurySelectionTransaction(transaction) {
    const data = transaction.data;
    return !!(data.sortitionId && data.caseId && data.jurorCount && data.jurorHashes);
  }

  validateDeliberationTransaction(transaction) {
    const data = transaction.data;
    return !!(data.caseId && data.deliberationId && data.votesSummary);
  }

  validateReverificationTransaction(transaction) {
    const data = transaction.data;
    return !!(data.verificationId && data.caseId && data.userHashes);
  }

  validateBadgeTransaction(transaction) {
    const data = transaction.data;
    return !!(data.badgeId && data.badgeType && data.jurorHash && data.contentHash);
  }

  async signTransaction(data) {
    // Mock transaction signing - would use proper cryptographic signatures in production
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(`signature_${dataString}`).digest('hex');
  }

  async encryptDeliberationSummary(summary) {
    // Mock encryption - would use proper encryption in production
    return {
      encrypted: btoa(JSON.stringify(summary)),
      algorithm: 'AES-256-GCM',
      keyId: 'deliberation_key_v1'
    };
  }

  async persistChainData() {
    try {
      const chainPath = join(__dirname, '../data/jury_chain.json');
      writeFileSync(chainPath, JSON.stringify(this.chainData, null, 2));
    } catch (error) {
      console.error('[CHAIN_LOGGER] Failed to persist chain data:', error);
    }
  }

  // Privacy-preserving hash functions
  
  hashCaseId(caseId) {
    return createHash('sha256').update(`case_${caseId}`).digest('hex');
  }

  hashUserId(userId) {
    return createHash('sha256').update(`user_${userId}`).digest('hex');
  }

  hashDeliberationContent(data) {
    return createHash('sha256').update(JSON.stringify(data.summary)).digest('hex');
  }

  hashLocation(location) {
    return createHash('sha256').update(`${location.lat}_${location.lng}`).digest('hex');
  }

  hashProximityProof(proof) {
    return createHash('sha256').update(JSON.stringify(proof)).digest('hex');
  }

  hashTimingAnalysis(analysis) {
    return createHash('sha256').update(JSON.stringify(analysis)).digest('hex');
  }

  hashChallengeResponse(challenges) {
    return createHash('sha256').update(JSON.stringify(challenges)).digest('hex');
  }

  hashCryptographicProof(proofs) {
    return createHash('sha256').update(JSON.stringify(proofs)).digest('hex');
  }

  hashEligibilityProof(proof) {
    return createHash('sha256').update(JSON.stringify(proof)).digest('hex');
  }

  hashDeliberationProof(proof) {
    return createHash('sha256').update(JSON.stringify(proof)).digest('hex');
  }

  hashVoteProof(proof) {
    return createHash('sha256').update(JSON.stringify(proof)).digest('hex');
  }
}

/**
 * Hash Validator for blockchain integrity
 */
class HashValidator {
  validateHash(hash, expectedPattern = /^[a-f0-9]{64}$/) {
    return expectedPattern.test(hash);
  }

  validateHashChain(blocks) {
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].previousHash !== blocks[i - 1].hash) {
        return false;
      }
    }
    return true;
  }
}

export default JuryChainLogger;
