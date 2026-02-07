/**
 * Frontend Authentication Service
 * Handles token management and authentication state
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// For development/testing, use a mock token
const MOCK_TOKEN = 'test-auth-token-123';
const MOCK_USER = {
  id: 'test-user-123',
  publicKey: 'test-public-key',
  authLevel: 1
};

/**
 * Get the current authentication token
 * @returns {Promise<string>} The authentication token
 */
export async function getAuthToken() {
  // Always return a valid demo token for local/demo use
  return 'demo-token-demoUser';
}

/**
 * Get the current user data
 * @returns {Promise<Object>} The user data
 */
export async function getCurrentUser() {
  // For development, return mock user
  // In production, this would retrieve from localStorage and validate
  return MOCK_USER;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated() {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Store authentication data
 * @param {Object} authData - Authentication data including token and user info
 */
export async function storeAuthData(authData) {
  localStorage.setItem(TOKEN_KEY, authData.token);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
}

/**
 * Clear authentication data
 */
export async function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export default {
  getAuthToken,
  getCurrentUser,
  isAuthenticated,
  storeAuthData,
  clearAuthData
}; 