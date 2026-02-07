/**
 * @fileoverview Signature Verification Utility
 * Verifies cryptographic signatures for authentication
 */
import crypto from 'crypto';
import logger from '../../utils/logging/logger.mjs';

const verifierLogger = logger.child({ module: 'signature-verifier' });

/**
 * Verify a login challenge signature
 * @param {string} publicKey User's public key
 * @param {string} signature Base64-encoded signature
 * @param {string} nonce Challenge nonce that was signed
 * @param {string} scheme Signature scheme (ecdsa, ed25519, etc.)
 * @returns {boolean} Whether the signature is valid
 */
export function verifyLoginChallenge(publicKey, signature, nonce, scheme = 'ecdsa') {
  try {
    if (!publicKey || !signature || !nonce) {
      verifierLogger.warn('Missing required parameters for signature verification');
      return false;
    }
    
    let isValid = false;
    
    // Handle different signature schemes
    switch(scheme.toLowerCase()) {
      case 'ecdsa':
        isValid = verifyEcdsaSignature(publicKey, signature, nonce);
        break;
      case 'ed25519':
        isValid = verifyEd25519Signature(publicKey, signature, nonce);
        break;
      default:
        verifierLogger.error('Unsupported signature scheme', { scheme });
        return false;
    }
    
    if (isValid) {
      verifierLogger.info('Signature verification successful', { scheme });
    } else {
      verifierLogger.warn('Signature verification failed', { scheme });
    }
    
    return isValid;
  } catch (error) {
    verifierLogger.error('Error verifying signature', { 
      error: error.message,
      scheme
    });
    return false;
  }
}

/**
 * Verify an ECDSA signature
 * @param {string} publicKey User's public key (PEM format)
 * @param {string} signature Base64-encoded signature
 * @param {string} data Data that was signed
 * @returns {boolean} Whether the signature is valid
 */
function verifyEcdsaSignature(publicKey, signature, data) {
  try {
    // Handle different public key formats
    const key = publicKey.startsWith('-----BEGIN PUBLIC KEY-----')
      ? publicKey
      : `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    return verify.verify(key, signatureBuffer);
  } catch (error) {
    verifierLogger.error('ECDSA verification error', { error: error.message });
    return false;
  }
}

/**
 * Verify an Ed25519 signature
 * @param {string} publicKey User's public key (base64)
 * @param {string} signature Base64-encoded signature
 * @param {string} data Data that was signed
 * @returns {boolean} Whether the signature is valid
 */
function verifyEd25519Signature(publicKey, signature, data) {
  try {
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    const signatureBuffer = Buffer.from(signature, 'base64');
    const dataBuffer = Buffer.from(data);
    
    return crypto.verify(
      null,
      dataBuffer,
      {
        key: publicKeyBuffer,
        format: 'raw',
        type: 'ed25519'
      },
      signatureBuffer
    );
  } catch (error) {
    verifierLogger.error('Ed25519 verification error', { error: error.message });
    return false;
  }
}

/**
 * Generate a challenge nonce for authentication
 * @returns {string} Random nonce
 */
export function generateChallenge() {
  return crypto.randomBytes(32).toString('base64');
}

export default {
  verifyLoginChallenge,
  generateChallenge,
  verify: verifyLoginChallenge
};
