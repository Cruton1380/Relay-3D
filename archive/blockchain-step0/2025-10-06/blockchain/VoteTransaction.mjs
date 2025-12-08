/**
 * @fileoverview VoteTransaction - Blockchain vote transaction with forward compatibility
 * 
 * Includes signature algorithm tracking and hashgraph event ID placeholder
 * for future Phase 2 integration
 */

import crypto from 'crypto';

/**
 * VoteTransaction class
 * Represents a vote transaction on the blockchain with full audit trail
 */
export class VoteTransaction {
  constructor(voteData) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.voteData = voteData;
    
    // Signature data
    this.signature = null;
    this.publicKey = null;
    this.signatureAlgorithm = null; // 'ECDSA-P256', 'Ed25519', etc.
    
    // Future Phase 2: Blockchain ↔ Hashgraph integration
    this.hashgraphEventId = null; // Placeholder for unified ordering
    this.voteOrderId = null; // Global ordering across both systems
    
    // Blockchain metadata
    this.transactionHash = null; // Set after blockchain recording
    this.blockNumber = null; // Set when block is mined
    this.blockHash = null; // Set when block is mined
    
    // Privacy level applied during sanitization
    this.privacyLevel = voteData.privacyLevel || 'province';
  }

  /**
   * Sign the transaction
   * @param {string} signature - Cryptographic signature
   * @param {string} publicKey - Public key used for signing
   * @param {string} algorithm - Signature algorithm (default: 'ECDSA-P256')
   */
  sign(signature, publicKey, algorithm = 'ECDSA-P256') {
    this.signature = signature;
    this.publicKey = publicKey;
    this.signatureAlgorithm = algorithm;
  }

  /**
   * Set hashgraph event ID for unified ordering (Phase 2)
   * @param {string} eventId - Hashgraph event identifier
   * @param {number} orderIndex - Global ordering index
   */
  setHashgraphEvent(eventId, orderIndex) {
    this.hashgraphEventId = eventId;
    this.voteOrderId = orderIndex;
  }

  /**
   * Update blockchain confirmation data
   * @param {number} blockNumber - Block number where transaction was mined
   * @param {string} blockHash - Hash of the block
   */
  confirmInBlock(blockNumber, blockHash) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
  }

  /**
   * Convert to JSON for blockchain storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      voteData: this.voteData,
      signature: this.signature,
      publicKey: this.publicKey,
      signatureAlgorithm: this.signatureAlgorithm,
      hashgraphEventId: this.hashgraphEventId,
      voteOrderId: this.voteOrderId,
      privacyLevel: this.privacyLevel,
      transactionHash: this.transactionHash,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash
    };
  }

  /**
   * Validate transaction structure
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];

    if (!this.voteData) {
      errors.push('Vote data is required');
    }

    if (!this.signature || !this.publicKey) {
      errors.push('Transaction must be signed');
    }

    if (!this.signatureAlgorithm) {
      errors.push('Signature algorithm must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create VoteTransaction from stored JSON
   * @param {Object} json - Stored transaction data
   * @returns {VoteTransaction} Reconstructed transaction
   */
  static fromJSON(json) {
    const transaction = new VoteTransaction(json.voteData);
    transaction.id = json.id;
    transaction.timestamp = json.timestamp;
    transaction.signature = json.signature;
    transaction.publicKey = json.publicKey;
    transaction.signatureAlgorithm = json.signatureAlgorithm;
    transaction.hashgraphEventId = json.hashgraphEventId;
    transaction.voteOrderId = json.voteOrderId;
    transaction.privacyLevel = json.privacyLevel;
    transaction.transactionHash = json.transactionHash;
    transaction.blockNumber = json.blockNumber;
    transaction.blockHash = json.blockHash;
    return transaction;
  }
}
