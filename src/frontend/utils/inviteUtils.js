import { apiPost } from '../services/apiClient';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Verify an invite code
 * @param {string} inviteCode - The invite code to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyInviteCode(inviteCode) {
  try {
    // Hash the invite code before sending
    const inviteHash = bytesToHex(sha256(inviteCode));
    
    const result = await apiPost('/api/invite/verify', { 
      inviteHash 
    });
    
    return result;
  } catch (error) {
    console.error('Error verifying invite code:', error);
    throw error;
  }
}

/**
 * Burn an invite code during onboarding
 * @param {string} inviteCode - The invite code to burn
 * @param {Object} userData - User data for the new account
 * @returns {Promise<Object>} Result of burning the invite
 */
export async function burnInviteCode(inviteCode, userData) {
  try {
    // Hash the invite code before sending
    const inviteHash = bytesToHex(sha256(inviteCode));
    
    const result = await apiPost('/api/invite/burn', {
      inviteHash,
      userData
    });
    
    return result;
  } catch (error) {
    console.error('Error burning invite code:', error);
    throw error;
  }
}

/**
 * Generate new invite codes
 * @param {number} count - Number of invite codes to generate
 * @param {number} decayFactor - Decay factor for child invites (0-1)
 * @returns {Promise<Array>} Generated invite codes
 */
export async function generateInviteCodes(count = 1, decayFactor = 0.5) {
  try {
    const result = await apiPost('/api/invite/generate', {
      count,
      decayFactor
    });
    
    return result.inviteCodes;
  } catch (error) {
    console.error('Error generating invite codes:', error);
    throw error;
  }
}

/**
 * Get invite tree for visualization
 * @returns {Promise<Object>} Invite tree data
 */
export async function getInviteTree() {
  try {
    const result = await apiPost('/api/invite/tree');
    return result.tree;
  } catch (error) {
    console.error('Error fetching invite tree:', error);
    throw error;
  }
}

/**
 * Calculate the number of invites a new user should receive
 * @param {number} parentInvites - Number of invites the parent user has
 * @param {number} decayFactor - Decay factor (default 0.5)
 * @returns {number} Number of invites for the new user
 */
export function calculateChildInvites(parentInvites, decayFactor = 0.5) {
  // Calculate based on decay, but ensure it's at least 1
  const calculatedInvites = Math.floor(parentInvites * decayFactor);
  return Math.max(1, calculatedInvites);
}

export default {
  verifyInviteCode,
  burnInviteCode,
  generateInviteCodes,
  getInviteTree,
  calculateChildInvites
};
