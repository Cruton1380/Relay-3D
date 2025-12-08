/**
 * @fileoverview Blockchain Sync Service
 * Keeps authoritativeVoteLedger synchronized with blockchain confirmations
 */
import { eventBus } from '../eventBus-service/index.mjs';
import { logger } from '../utils/logging/logger.mjs';
import auditService from './auditService.mjs';

const syncLogger = logger.child({ module: 'blockchain-sync' });

class BlockchainSyncService {
  constructor() {
    this.voteLedger = null; // Will be injected by votingEngine
    this.isListening = false;
  }

  /**
   * Initialize sync service with vote ledger reference
   * @param {Map} authoritativeVoteLedger - Reference to vote ledger
   */
  initialize(authoritativeVoteLedger) {
    if (this.isListening) {
      syncLogger.warn('Blockchain sync already initialized');
      return;
    }

    this.voteLedger = authoritativeVoteLedger;
    this.setupEventListeners();
    this.isListening = true;

    syncLogger.info('Blockchain sync service initialized');
  }

  /**
   * Set up event listeners for blockchain events
   */
  setupEventListeners() {
    // Listen for block mining events
    eventBus.on('blockchain:block:mined', this.handleBlockMined.bind(this));
    
    // Listen for transaction addition (pending state)
    eventBus.on('blockchain:transaction:added', this.handleTransactionAdded.bind(this));
    
    syncLogger.info('Event listeners registered for blockchain sync');
  }

  /**
   * Handle block mined event
   * Updates vote status from 'pending' to 'confirmed'
   * @param {Object} data - Event data
   */
  async handleBlockMined(data) {
    const { block, miningTime } = data;
    
    syncLogger.info('Block mined, syncing votes', {
      blockNumber: block.index,
      transactionCount: block.transactions.length,
      miningTime
    });

    // Update each vote transaction in this block
    for (const transaction of block.transactions) {
      if (transaction.type === 'vote') {
        await this.confirmVoteTransaction(transaction, block);
      }
    }
  }

  /**
   * Handle transaction added event (pending state)
   * @param {Object} data - Event data
   */
  handleTransactionAdded(data) {
    const { transaction } = data;
    
    if (transaction.type === 'vote') {
      syncLogger.debug('Vote transaction pending', {
        voteId: transaction.data?.voteId,
        transactionId: transaction.id
      });
    }
  }

  /**
   * Confirm a vote transaction after block mining
   * @param {Object} transaction - Vote transaction
   * @param {Object} block - Block containing the transaction
   */
  async confirmVoteTransaction(transaction, block) {
    const voteData = transaction.data;
    
    if (!voteData || !voteData.userId || !voteData.topicId) {
      syncLogger.warn('Invalid vote transaction data', { transaction });
      return;
    }

    try {
      // Update vote in ledger
      const userVotes = this.voteLedger.get(voteData.userId);
      
      if (userVotes && userVotes.has(voteData.topicId)) {
        const vote = userVotes.get(voteData.topicId);
        
        // Update blockchain status
        vote.blockNumber = block.index;
        vote.blockHash = block.hash;
        vote.status = 'confirmed';
        vote.confirmations = 1; // Will increment with subsequent blocks
        
        syncLogger.info('Vote confirmed on blockchain', {
          userId: voteData.userId,
          topicId: voteData.topicId,
          voteId: voteData.voteId,
          blockNumber: block.index
        });

        // Update audit log
        await auditService.updateVoteConfirmation(
          voteData.voteId,
          block.index,
          block.hash
        );
      } else {
        syncLogger.warn('Vote not found in ledger for confirmation', {
          userId: voteData.userId,
          topicId: voteData.topicId
        });
      }
    } catch (error) {
      syncLogger.error('Error confirming vote transaction', {
        error: error.message,
        voteId: voteData.voteId
      });
    }
  }

  /**
   * Update confirmation counts as new blocks are added
   * @param {number} currentBlockHeight - Current blockchain height
   */
  updateConfirmationCounts(currentBlockHeight) {
    if (!this.voteLedger) return;

    let updatedCount = 0;

    // Iterate through all votes and update confirmations
    for (const [userId, userVotes] of this.voteLedger.entries()) {
      for (const [topicId, vote] of userVotes.entries()) {
        if (vote.status === 'confirmed' && vote.blockNumber) {
          const newConfirmations = currentBlockHeight - vote.blockNumber + 1;
          
          if (newConfirmations !== vote.confirmations) {
            vote.confirmations = newConfirmations;
            updatedCount++;
          }
        }
      }
    }

    if (updatedCount > 0) {
      syncLogger.debug('Updated confirmation counts', {
        votesUpdated: updatedCount,
        currentHeight: currentBlockHeight
      });
    }
  }

  /**
   * Stop listening to blockchain events
   */
  shutdown() {
    eventBus.off('blockchain:block:mined', this.handleBlockMined);
    eventBus.off('blockchain:transaction:added', this.handleTransactionAdded);
    
    this.isListening = false;
    syncLogger.info('Blockchain sync service shut down');
  }
}

// Export singleton instance
export const blockchainSyncService = new BlockchainSyncService();
export default blockchainSyncService;
