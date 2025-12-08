/**
 * API Client
 * Centralized HTTP client for making API requests
 */

// FORCE the API base URL to port 3002
const API_BASE_URL = 'http://localhost:3002/api';
const DEFAULT_TIMEOUT = 10000;

// Add cache-busting parameter to prevent browser caching
const getCacheBustingUrl = (baseUrl) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}_t=${Date.now()}`;
};

/**
 * Get authentication token from storage
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Get CSRF token from storage
 */
function getCsrfToken() {
  return localStorage.getItem('csrfToken');
}

/**
 * Build headers for API requests
 */
function buildHeaders(customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Make HTTP GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function apiGet(endpoint, options = {}) {
  // Ensure endpoint starts with / if it's not a full URL
  const normalizedEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  const url = getCacheBustingUrl(baseUrl);
  
  console.log('API GET request to:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(options.headers),
    signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
    ...options
  });

  return handleResponse(response);
}

/**
 * Make HTTP POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function apiPost(endpoint, data = null, options = {}) {
  // Ensure endpoint starts with / if it's not a full URL
  const normalizedEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  const url = getCacheBustingUrl(baseUrl);
  
  console.log('API POST request to:', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(options.headers),
    body: data ? JSON.stringify(data) : null,
    signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
    ...options
  });

  return handleResponse(response);
}

/**
 * Make HTTP PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function apiPut(endpoint, data = null, options = {}) {
  // Ensure endpoint starts with / if it's not a full URL
  const normalizedEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders(options.headers),
    body: data ? JSON.stringify(data) : null,
    signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
    ...options
  });

  return handleResponse(response);
}

/**
 * Make HTTP DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function apiDelete(endpoint, options = {}) {
  // Ensure endpoint starts with / if it's not a full URL
  const normalizedEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(options.headers),
    signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
    ...options
  });

  return handleResponse(response);
}

/**
 * Make HTTP PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function apiPatch(endpoint, data = null, options = {}) {
  // Ensure endpoint starts with / if it's not a full URL
  const normalizedEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(options.headers),
    body: data ? JSON.stringify(data) : null,
    signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
    ...options
  });

  return handleResponse(response);
}

// Default export for convenience
export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch
};

