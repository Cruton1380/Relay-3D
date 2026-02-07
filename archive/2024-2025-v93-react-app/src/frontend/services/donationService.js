import api from './apiClient';
import { signData } from './cryptoService';
import websocketService from './websocketService';

const API_BASE_URL = '/api';

/**
 * Submit a donation to a channel
 * @param {string} channelId - Channel to donate to
 * @param {number} amount - Amount to donate
 * @returns {Promise<Object>} Donation result
 */
async function submitDonation(channelId, amount) {
  try {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        channelId,
        amount
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit donation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting donation:', error);
    throw error;
  }
}

/**
 * Get donation history for a channel
 * @param {string} channelId - Channel to get donations for
 * @returns {Promise<Object>} Donation history
 */
export async function getDonationHistory(channelId) {
  try {
    const response = await api.get(`/donation/history/${channelId}`);
    return response.data;
  } catch (error) {
    console.error('Get donation history error:', error);
    throw error;
  }
}

/**
 * Get user's donation history
 * @returns {Promise<Object>} User's donation history
 */
export async function getUserDonations() {
  try {
    const response = await api.get('/donation/user');
    return response.data;
  } catch (error) {
    console.error('Get user donations error:', error);
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

export { submitDonation };

export default {
  getDonationHistory,
  getUserDonations
}; 