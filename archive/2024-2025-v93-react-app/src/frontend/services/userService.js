import api from './apiClient';
import { signData } from './cryptoService';

const API_BASE_URL = '/api';

/**
 * Get channel owner details
 * @param {string} ownerId - Owner ID to get details for
 * @returns {Promise<Object>} Owner details
 */
async function getChannelOwner(ownerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${ownerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

export { getChannelOwner };

/**
 * Get user profile
 * @param {string} userId - User ID to get profile for
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(userId) {
  try {
    const response = await api.get(`/user/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(profileData) {
  try {
    const message = {
      ...profileData,
      timestamp: Date.now(),
      nonce: generateNonce()
    };

    const signature = await signData(message);

    const response = await api.put('/user/profile', {
      ...message,
      signature
    });

    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Get user's channels
 * @param {Object} filters - Filter options
 * @param {string} filters.type - Filter by channel type
 * @param {string} filters.status - Filter by channel status
 * @returns {Promise<Object>} User's channels
 */
export async function getUserChannels(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/user/channels?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get user channels error:', error);
    throw error;
  }
}

/**
 * Get user's activity
 * @param {Object} filters - Filter options
 * @param {string} filters.type - Filter by activity type
 * @param {string} filters.timeframe - Filter by time period
 * @returns {Promise<Object>} User's activity
 */
export async function getUserActivity(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/user/activity?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get user activity error:', error);
    throw error;
  }
}

/**
 * Get user's verification status
 * @param {string} userId - User ID to check verification for
 * @returns {Promise<Object>} Verification status
 */
export async function getVerificationStatus(userId) {
  try {
    const response = await api.get(`/user/verification/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get verification status error:', error);
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

export default {
  getUserProfile,
  updateUserProfile,
  getUserChannels,
  getUserActivity,
  getVerificationStatus
}; 