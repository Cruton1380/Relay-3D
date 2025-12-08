import api from './apiClient';
import { signData } from './cryptoService';
import websocketService from './websocketService';

const API_BASE_URL = '/api';

/**
 * Submit a proposal for a channel
 * @param {string} channelId - Channel to submit proposal for
 * @param {Object} proposalData - Proposal data
 * @param {string} proposalData.title - Proposal title
 * @param {string} proposalData.description - Proposal description
 * @param {string} proposalData.type - Proposal type (upgrade/patch/feature)
 * @returns {Promise<Object>} Proposal submission result
 */
async function submitProposal(channelId, proposalData) {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        channelId,
        content: proposalData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit proposal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting proposal:', error);
    throw error;
  }
}

/**
 * Get proposals for a channel
 * @param {string} channelId - Channel to get proposals for
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status (pending/approved/rejected)
 * @param {string} filters.type - Filter by type (upgrade/patch/feature)
 * @returns {Promise<Object>} Channel proposals
 */
export async function getChannelProposals(channelId, filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/proposal/channel/${channelId}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get channel proposals error:', error);
    throw error;
  }
}

/**
 * Get user's proposals
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status (pending/approved/rejected)
 * @param {string} filters.type - Filter by type (upgrade/patch/feature)
 * @returns {Promise<Object>} User's proposals
 */
export async function getUserProposals(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/proposal/user?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get user proposals error:', error);
    throw error;
  }
}

/**
 * Vote on a proposal
 * @param {string} proposalId - Proposal to vote on
 * @param {boolean} approve - Whether to approve or reject
 * @returns {Promise<Object>} Vote result
 */
export async function voteOnProposal(proposalId, approve) {
  try {
    const message = {
      proposalId,
      vote: approve ? 'approve' : 'reject',
      timestamp: Date.now(),
      nonce: generateNonce()
    };

    const signature = await signData(message);

    const response = await api.post('/proposal/vote', {
      ...message,
      signature
    });

    return response.data;
  } catch (error) {
    console.error('Proposal vote error:', error);
    throw error;
  }
}

/**
 * Generate a random nonce
 * @returns {string} Random nonce
 */
function generateNonce() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export { submitProposal };

export default {
  getChannelProposals,
  getUserProposals,
  voteOnProposal
}; 