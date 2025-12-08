/**
 * Encryption and decryption utilities
 */
import { randomBytes } from 'crypto';
import CryptoJS from 'crypto-js';
import { logger } from '../logging/logger.mjs';

/**
 * Generates a random encryption key
 * @param {number} length - Length of the key in bytes
 * @returns {string} Base64 encoded key
 */
export function generateEncryptionKey(length = 32) {
  return randomBytes(length).toString('base64');
}

/**
 * Encrypts data using AES encryption
 * @param {string|object} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data as string
 */
export function encryptData(data, key) {
  try {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : data;
    return CryptoJS.AES.encrypt(dataStr, key).toString();
  } catch (error) {
    logger.error('Error encrypting data', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts AES encrypted data
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Decryption key
 * @returns {string} Decrypted data
 */
export function decryptData(encryptedData, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    logger.error('Error decrypting data', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Decrypts and parses JSON data
 * @param {string} encryptedData - Encrypted JSON data
 * @param {string} key - Decryption key
 * @returns {object} Parsed object
 */
export function decryptJSON(encryptedData, key) {
  const decrypted = decryptData(encryptedData, key);
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error('Error parsing decrypted JSON', error);
    throw new Error('Invalid JSON format in decrypted data');
  }
}
