/**
 * Blockchain State Module
 * 
 * This module provides the blockchain functionality for the voting system.
 * It creates and manages an immutable blockchain for storing vote records.
 */

import crypto from 'crypto';
import blockchainService from '../blockchain-service/index.mjs';

// Initialize the blockchain service
const blockchain = blockchainService;

/**
 * Create a new block with the given data
 * @param {Object} data - The data to store in the block
 * @returns {Promise<Object>} The created block
 */
export async function createBlock(data) {
  try {
    // Extract type from data or default to 'vote'
    const type = data.type || 'vote';
    
    // Generate a unique nonce for this transaction
    const nonce = crypto.randomUUID();
    
    // Add transaction to pending transactions
    await blockchain.addTransaction(type, data, nonce);
    
    // Mine a new block
    const block = await blockchain.mine();
    
    return block;
  } catch (error) {
    throw new Error(`Failed to create block: ${error.message}`);
  }
}

// Export the blockchain instance
export { blockchain };
export default blockchain;
