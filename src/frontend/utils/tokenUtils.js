// frontend/utils/tokenUtils.js
/**
 * Parse a JWT token and return the payload
 * @param {string} token - JWT token to parse
 * @returns {Object|null} Parsed token payload or null if invalid
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} Whether the token is expired
 */
export function isTokenExpired(token) {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    const expirationTime = payload.exp * 1000;
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Get the stored authentication token
 * @returns {string|null} The stored token or null if not found
 */
export function getStoredToken() {
  return localStorage.getItem('authToken');
}

