/**
 * Digital signature utilities
 */
import crypto from 'crypto';
// Import directly from logger.mjs to avoid circular dependencies
import logger from '../logging/logger.mjs';

/**
 * Verifies a signature using RSA
 * @param {string} data - Original data that was signed
 * @param {string} signature - Signature to verify
 * @param {string} publicKey - Public key in PEM format
 * @returns {boolean} True if signature is valid
 */
export function verifyRSASignature(data, signature, publicKey) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    logger.error('Error verifying RSA signature', error);
    return false;
  }
}

/**
 * Verifies a signature using Ed25519
 * @param {string} message - Original message that was signed
 * @param {string} signature - Base64-encoded signature
 * @param {string} publicKey - Base64-encoded public key
 * @returns {boolean} True if signature is valid
 */
export function verifyEd25519Signature(message, signature, publicKey) {
  try {
    const messageUint8 = new TextEncoder().encode(message);
    const signatureUint8 = decodeBase64(signature);
    const publicKeyUint8 = decodeBase64(publicKey);
    
    return tweetnacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKeyUint8
    );
  } catch (error) {
    logger.error('Error verifying Ed25519 signature', error);
    return false;
  }
}

/**
 * Creates an Ed25519 signature
 * @param {string} message - Message to sign
 * @param {string} secretKey - Base64-encoded secret key
 * @returns {string} Base64-encoded signature
 */
export function signEd25519(message, secretKey) {
  try {
    const messageUint8 = new TextEncoder().encode(message);
    const secretKeyUint8 = decodeBase64(secretKey);
    
    const signature = tweetnacl.sign.detached(messageUint8, secretKeyUint8);
    return encodeBase64(signature);
  } catch (error) {
    logger.error('Error creating Ed25519 signature', error);
    throw new Error('Failed to create signature');
  }
}

// Verify a digital signature
export function verifySignature(data, signature, publicKey) {
  try {
    // Create a verification object
    const verify = crypto.createVerify('SHA256');
    
    // Add the data to be verified
    verify.update(typeof data === 'string' ? data : JSON.stringify(data));
    
    // Verify the signature using the public key
    const isValid = verify.verify(publicKey, signature, 'base64');
    
    logger.debug(`Signature verification result: ${isValid}`);
    return isValid;
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return false;
  }
}

// Create a digital signature
export function createSignature(data, privateKey) {
  try {
    // Create a signing object
    const sign = crypto.createSign('SHA256');
    
    // Add the data to be signed
    sign.update(typeof data === 'string' ? data : JSON.stringify(data));
    
    // Sign the data using the private key
    const signature = sign.sign(privateKey, 'base64');
    
    logger.debug('Signature created successfully');
    return signature;
  } catch (error) {
    logger.error('Error creating signature:', error);
    throw new Error('Failed to create signature');
  }
}
