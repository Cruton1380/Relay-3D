import api from './apiClient';
import websocketService from './websocketService';

const API_BASE_URL = '/api';

/**
 * Get analytics for a channel
 * @param {string} channelId - Channel to get analytics for
 * @returns {Promise<Object>} Channel analytics
 */
async function getChannelAnalytics(channelId) {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/channels/${channelId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch channel analytics');
    }

    // Subscribe to real-time analytics updates
    websocketService.subscribe(`analytics:${channelId}`);
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    throw error;
  }
}

export { getChannelAnalytics };

/**
 * Get vote trend analytics
 * @param {string} channelId - Channel to get vote trends for
 * @param {Object} options - Options for trend data
 * @param {string} options.timeframe - Time period (day/week/month/year)
 * @param {string} options.resolution - Data resolution (hour/day/week)
 * @returns {Promise<Object>} Vote trend data
 */
export async function getVoteTrends(channelId, options = {}) {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const response = await api.get(`/analytics/votes/${channelId}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get vote trends error:', error);
    throw error;
  }
}

/**
 * Get engagement analytics
 * @param {string} channelId - Channel to get engagement for
 * @param {Object} options - Options for engagement data
 * @param {string} options.timeframe - Time period (day/week/month/year)
 * @returns {Promise<Object>} Engagement data
 */
export async function getEngagementAnalytics(channelId, options = {}) {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const response = await api.get(`/analytics/engagement/${channelId}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    throw error;
  }
}

/**
 * Get user activity analytics
 * @param {string} channelId - Channel to get user activity for
 * @returns {Promise<Object>} User activity data
 */
export async function getUserActivityAnalytics(channelId) {
  try {
    const response = await api.get(`/analytics/users/${channelId}`);
    return response.data;
  } catch (error) {
    console.error('Get user activity analytics error:', error);
    throw error;
  }
}

/**
 * Get donation analytics
 * @param {string} channelId - Channel to get donation analytics for
 * @param {Object} options - Options for donation data
 * @param {string} options.timeframe - Time period (day/week/month/year)
 * @returns {Promise<Object>} Donation analytics
 */
export async function getDonationAnalytics(channelId, options = {}) {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const response = await api.get(`/analytics/donations/${channelId}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Get donation analytics error:', error);
    throw error;
  }
}

export default {
  getChannelAnalytics,
  getVoteTrends,
  getEngagementAnalytics,
  getUserActivityAnalytics,
  getDonationAnalytics
}; 