/**
 * @fileoverview Transaction Queue for Batched Mining
 * Implements batching to reduce CPU usage and improve performance
 */
import EventEmitter from 'events';
import { logger } from '../utils/logging/logger.mjs';

const queueLogger = logger.child({ module: 'transaction-queue' });

class TransactionQueue extends EventEmitter {
  constructor({ maxTx = 10, maxAgeMs = 500, miningCallback }) {
    super();
    this.maxTx = maxTx;
    this.maxAgeMs = maxAgeMs;
    this.queue = [];
    this.timer = null;
    this.miningCallback = miningCallback;
    this.isProcessing = false;
    
    // Environment configuration
    this.allowAutoMining = process.env.ALLOW_AUTO_MINING !== 'false';
    this.forceMineOnDemand = process.env.FORCE_MINE_ON_DEMAND === 'true';
    
    queueLogger.info('TransactionQueue initialized', {
      maxTx: this.maxTx,
      maxAgeMs: this.maxAgeMs,
      allowAutoMining: this.allowAutoMining,
      forceMineOnDemand: this.forceMineOnDemand
    });
  }

  /**
   * Add a transaction to the queue
   * @param {Object} tx - Transaction object
   * @param {boolean} forceMine - Force immediate mining (requires FORCE_MINE_ON_DEMAND=true)
   */
  push(tx, forceMine = false) {
    if (!this.allowAutoMining && !forceMine) {
      queueLogger.warn('Auto mining disabled, transaction queued but not processed', {
        txId: tx.id,
        type: tx.type
      });
      this.queue.push(tx);
      return;
    }

    if (forceMine && !this.forceMineOnDemand) {
      queueLogger.warn('Force mining requested but not allowed', {
        txId: tx.id,
        type: tx.type
      });
      forceMine = false;
    }

    this.queue.push(tx);
    
    queueLogger.debug('Transaction added to queue', {
      txId: tx.id,
      type: tx.type,
      queueSize: this.queue.length,
      forceMine
    });

    // Check if we should flush immediately
    if (this.queue.length >= this.maxTx || forceMine) {
      this.flush();
      return;
    }

    // Set timer for batch processing
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxAgeMs);
    }
  }

  /**
   * Process all queued transactions
   */
  async flush() {
    if (this.isProcessing) {
      queueLogger.debug('Flush already in progress, skipping');
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      queueLogger.debug('No transactions to flush');
      return;
    }

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.queue.length);
    
    queueLogger.info('Processing transaction batch', {
      batchSize: batch.length,
      txTypes: batch.map(tx => tx.type)
    });

    try {
      await this.miningCallback(batch);
      
      queueLogger.info('Transaction batch processed successfully', {
        batchSize: batch.length
      });
      
      this.emit('mined', { count: batch.length });
    } catch (err) {
      queueLogger.error('Transaction batch processing failed', {
        error: err.message,
        stack: err.stack,
        batchSize: batch.length
      });
      
      // Re-queue failed transactions for retry
      this.queue.unshift(...batch);
      
      this.emit('error', { error: err, batch });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      hasTimer: !!this.timer,
      allowAutoMining: this.allowAutoMining,
      forceMineOnDemand: this.forceMineOnDemand,
      maxTx: this.maxTx,
      maxAgeMs: this.maxAgeMs
    };
  }

  /**
   * Force flush all pending transactions
   */
  async forceFlush() {
    queueLogger.info('Force flush requested');
    await this.flush();
  }

  /**
   * Clear all pending transactions
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    queueLogger.info('Transaction queue cleared', { clearedCount });
  }
}

export default TransactionQueue;
