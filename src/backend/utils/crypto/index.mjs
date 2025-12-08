/**
 * Exports all cryptographic utilities
 */

// Base64 encoding/decoding functions
export function encodeBase64(data) {
  return Buffer.from(data).toString('base64');
}

export function decodeBase64(data) {
  return Buffer.from(data, 'base64');
}

// Export all from the other crypto modules
// Don't import signatures here to avoid circular dependencies
export * from './encryption.mjs';
export * from './hashing.mjs';
