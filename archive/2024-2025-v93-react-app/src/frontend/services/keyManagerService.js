/**
 * @fileoverview Consolidated Key Management Service
 * 
 * This service handles all cryptographic key operations including:
 * - Key generation, storage, and retrieval
 * - Key rotation and backup
 * - Signing and verification
 * - Secure storage with browser crypto APIs
 */

import cryptoService from './cryptoService.js';

// Constants
const KEY_STORAGE_PREFIX = 'relay_keys_';
const CURRENT_KEY_VERSION = 1;
const AUTH_KEY_TYPE = 'auth';
const VOTE_KEY_TYPE = 'vote';

/**
 * Generate a new keypair for the user
 * @param {string} userId - The user identifier
 * @param {string} keyType - Key type (auth|vote)
 * @returns {Promise<{publicKey: string, privateKey: string}>} Generated keypair
 */
export async function generateKeyPair(userId, keyType = AUTH_KEY_TYPE) {
  try {    // Generate keypair using WebCrypto API with Ed25519
    const keyPair = await window.crypto.subtle.generateKey(
      "Ed25519",
      true,
      ["sign", "verify"]
    );

    // Export keys to storable format
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Convert to base64 for storage
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
    const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

    // Store the keypair securely
    await storeKeys(userId, { publicKey, privateKey }, keyType);

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Failed to generate keypair:', error);
    throw new Error('Key generation failed');
  }
}

/**
 * Store keys securely
 * @param {string} userId - The user identifier
 * @param {Object} keyPair - The keypair to store
 * @param {string} keyType - Key type (auth|vote)
 * @returns {Promise<boolean>} Success indicator
 */
export async function storeKeys(userId, keyPair, keyType = AUTH_KEY_TYPE) {
  try {
    const storageKey = `${KEY_STORAGE_PREFIX}${userId}_${keyType}`;
    const encryptedPrivateKey = await cryptoService.encryptData(
      keyPair.privateKey,
      userId
    );
    
    const keyData = {
      publicKey: keyPair.publicKey,
      encryptedPrivateKey,
      version: CURRENT_KEY_VERSION,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(keyData));
    return true;
  } catch (error) {
    console.error('Failed to store keys:', error);
    throw new Error('Key storage failed');
  }
}

/**
 * Retrieve keys for a user
 * @param {string} userId - The user identifier
 * @param {string} keyType - Key type (auth|vote)
 * @returns {Promise<{publicKey: string, privateKey: string}>} The retrieved keypair
 */
export async function getKeys(userId, keyType = AUTH_KEY_TYPE) {
  try {
    const storageKey = `${KEY_STORAGE_PREFIX}${userId}_${keyType}`;
    const keyDataString = localStorage.getItem(storageKey);
    
    if (!keyDataString) {
      throw new Error('No keys found for this user');
    }
    
    const keyData = JSON.parse(keyDataString);
    const privateKey = await cryptoService.decryptData(
      keyData.encryptedPrivateKey,
      userId
    );
    
    return {
      publicKey: keyData.publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Failed to retrieve keys:', error);
    throw new Error('Key retrieval failed');
  }
}

/**
 * Sign data with the user's private key
 * @param {string} userId - The user identifier
 * @param {*} data - Data to sign
 * @param {string} keyType - Key type (auth|vote)
 * @returns {Promise<string>} Signature
 */
export async function signData(userId, data, keyType = AUTH_KEY_TYPE) {
  try {
    // Get the user's keys
    const { privateKey } = await getKeys(userId, keyType);
    
    // Convert private key from base64 to ArrayBuffer
    const privateKeyBuffer = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));
      // Import the private key
    const importedPrivateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      "Ed25519",
      false,
      ["sign"]
    );
    
    // Convert data to ArrayBuffer
    const dataBuffer = new TextEncoder().encode(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
      // Sign the data
    const signatureBuffer = await window.crypto.subtle.sign(
      "Ed25519",
      importedPrivateKey,
      dataBuffer
    );
    
    // Convert signature to base64
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  } catch (error) {
    console.error('Failed to sign data:', error);
    throw new Error('Signing failed');
  }
}

/**
 * Verify a signature
 * @param {string} publicKey - The public key to verify with
 * @param {*} data - The original data
 * @param {string} signature - The signature to verify
 * @returns {Promise<boolean>} Verification result
 */
export async function verifySignature(publicKey, data, signature) {
  try {
    // Convert public key from base64 to ArrayBuffer
    const publicKeyBuffer = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));
      // Import the public key
    const importedPublicKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      "Ed25519",
      false,
      ["verify"]
    );
    
    // Convert data to ArrayBuffer
    const dataBuffer = new TextEncoder().encode(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
    
    // Convert signature from base64 to ArrayBuffer
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      // Verify the signature
    return await window.crypto.subtle.verify(
      "Ed25519",
      importedPublicKey,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    console.error('Failed to verify signature:', error);
    return false;
  }
}

/**
 * Export keys for backup purposes
 * @param {string} userId - The user identifier
 * @param {string} password - Password to encrypt the export
 * @returns {Promise<string>} Encrypted key export
 */
export async function exportKeys(userId, password) {
  try {
    const authKeys = await getKeys(userId, AUTH_KEY_TYPE);
    const voteKeys = await getKeys(userId, VOTE_KEY_TYPE);
    
    const exportData = {
      authKeys,
      voteKeys,
      userId,
      exportDate: new Date().toISOString()
    };
    
    // Encrypt the export with the provided password
    const encryptedExport = await cryptoService.encryptData(
      JSON.stringify(exportData),
      password
    );
    
    return encryptedExport;
  } catch (error) {
    console.error('Failed to export keys:', error);
    throw new Error('Key export failed');
  }
}

/**
 * Import keys from a backup
 * @param {string} encryptedExport - The encrypted key export
 * @param {string} password - Password to decrypt the export
 * @returns {Promise<{userId: string}>} The imported user ID
 */
export async function importKeys(encryptedExport, password) {
  try {
    // Decrypt the export with the provided password
    const exportDataString = await cryptoService.decryptData(
      encryptedExport,
      password
    );
    
    const exportData = JSON.parse(exportDataString);
    
    // Store the imported keys
    await storeKeys(exportData.userId, exportData.authKeys, AUTH_KEY_TYPE);
    await storeKeys(exportData.userId, exportData.voteKeys, VOTE_KEY_TYPE);
    
    return { userId: exportData.userId };
  } catch (error) {
    console.error('Failed to import keys:', error);
    throw new Error('Key import failed');
  }
}

/**
 * Check if keys exist for a user
 * @param {string} userId - The user identifier
 * @param {string} keyType - Key type (auth|vote)
 * @returns {boolean} Whether keys exist
 */
export function hasKeys(userId, keyType = AUTH_KEY_TYPE) {
  const storageKey = `${KEY_STORAGE_PREFIX}${userId}_${keyType}`;
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Rotate keys for a user
 * @param {string} userId - The user identifier
 * @param {string} keyType - Key type (auth|vote)
 * @returns {Promise<{publicKey: string}>} The new public key
 */
export async function rotateKeys(userId, keyType = AUTH_KEY_TYPE) {
  try {
    // Back up old keys with timestamp
    const oldKeys = await getKeys(userId, keyType);
    const timestamp = Date.now();
    localStorage.setItem(
      `${KEY_STORAGE_PREFIX}${userId}_${keyType}_backup_${timestamp}`,
      JSON.stringify(oldKeys)
    );
    
    // Generate new keys
    const newKeys = await generateKeyPair(userId, keyType);
    return { publicKey: newKeys.publicKey };
  } catch (error) {
    console.error('Failed to rotate keys:', error);
    throw new Error('Key rotation failed');
  }
}

// Export default object with all functions for backwards compatibility
export default {
  generateKeyPair,
  storeKeys,
  getKeys,
  signData,
  verifySignature,
  exportKeys,
  importKeys,
  hasKeys,
  rotateKeys
};
