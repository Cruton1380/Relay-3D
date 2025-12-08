/**
 * Cryptographic hashing utilities
 */
import crypto from 'crypto';
import { stableStringify } from '../common/strings.mjs';

/**
 * Hash a string using SHA-256
 * @param {string} data - String to hash
 * @returns {string} Hex-encoded hash
 */
export function hashString(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash an object using SHA-256
 * Uses stableStringify to ensure consistent object serialization
 * @param {Object} obj - Object to hash
 * @returns {string} Hex-encoded hash
 */
export function hashObject(obj) {
  const str = stableStringify(obj);
  return hashString(str);
}

/**
 * Create a keyed HMAC from data
 * @param {string} data - Data to hash
 * @param {string} key - Secret key
 * @returns {string} Hex-encoded HMAC
 */
export function createHmac(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Generate a random hash
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex-encoded random hash
 */
export function randomHash(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a hash suitable for IDs
 * @returns {string} A UUID v4
 */
export function generateId() {
  return crypto.randomUUID();
}
