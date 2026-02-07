/**
 * Authentication Utilities
 * Common authentication-related helper functions
 */

// Import existing functionality from frontend/utils/authUtils.js
import { signMessage, verifyMessage } from '../../utils/authUtils.js';

// Re-export these functions
export { signMessage, verifyMessage };

/**
 * Get authentication level name
 * @param {number} level Authentication level
 * @returns {string} Authentication level name
 */
export function getAuthLevelName(level) {
  const levels = {
    0: 'None',
    1: 'Basic',
    2: 'Elevated',
    3: 'Strict'
  };
  
  return levels[level] || 'Unknown';
}

/**
 * Parse JWT token without verification
 * @param {string} token JWT token
 * @returns {Object|null} Parsed token payload or null
 */
export function parseJwt(token) {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param {string} token JWT token
 * @returns {boolean} Whether the token is expired
 */
export function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload) return true;
  
  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expiryTime;
}

/**
 * Format verification factors for display
 * @param {Object} factors Authentication factors
 * @returns {Array} Formatted factors
 */
export function formatAuthFactors(factors) {
  if (!factors) return [];
  
  const factorLabels = {
    signature: 'Cryptographic Signature',
    biometric: 'Biometric Verification',
    deviceAttestation: 'Device Attestation'
  };
  
  return Object.entries(factors)
    .filter(([_, verified]) => verified)
    .map(([factor, _]) => ({
      id: factor,
      label: factorLabels[factor] || factor
    }));
}
