/**
 * Signature and hash utilities for blockchain vote transactions
 * 
 * This module provides cryptographic functions for vote verification:
 * - createVoteHash: Creates a SHA-256 hash of vote data
 * - verifySignature: Delegates to utils/crypto/signatures.mjs for actual verification
 */

import crypto from 'crypto';
import { verifySignature as verifySignatureUtil, createSignature as createSignatureUtil } from '../utils/crypto/signatures.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Creates a SHA-256 hash of vote data for signature verification
 * @param {Object} voteData - Vote data object to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function createVoteHash(voteData) {
  try {
    // Create a consistent string representation of the vote data
    const voteString = JSON.stringify(voteData, Object.keys(voteData).sort());
    
    // Create SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(voteString);
    const voteHash = hash.digest('hex');
    
    logger.debug(`Vote hash created: ${voteHash.substring(0, 16)}...`);
    return voteHash;
  } catch (error) {
    logger.error('Error creating vote hash:', error);
    throw new Error('Failed to create vote hash');
  }
}

/**
 * Verifies a digital signature on vote data
 * Delegates to the existing signature utility
 * @param {string} publicKey - Public key in PEM format
 * @param {string} signature - Base64-encoded signature
 * @param {string} voteHash - Hash of the vote data
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(publicKey, signature, voteHash) {
  try {
    // Delegate to existing utility function
    return verifySignatureUtil(voteHash, signature, publicKey);
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Creates a digital signature on vote data
 * Delegates to the existing signature utility
 * @param {string} privateKey - Private key in PEM format
 * @param {string} voteHash - Hash of the vote data
 * @returns {string} Base64-encoded signature
 */
export function createSignature(privateKey, voteHash) {
  try {
    // Delegate to existing utility function
    return createSignatureUtil(voteHash, privateKey);
  } catch (error) {
    logger.error('Error creating signature:', error);
    throw new Error('Failed to create signature');
  }
}

export default {
  createVoteHash,
  verifySignature,
  createSignature
};
