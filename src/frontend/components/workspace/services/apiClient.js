/**
 * API Client Service for Base Model 1
 * Provides normalized API communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

// Normalize endpoint by ensuring it starts with a slash
const normalizeEndpoint = (endpoint) => {
  if (!endpoint.startsWith("/")) {
    return `/${endpoint}`;
  }
  return endpoint;
};

// Generic API request function
const apiRequest = async (method, endpoint, data = null, options = {}) => {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, options.timeout || 60000); // Default 60 second timeout

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`🌐 API ${method} ${url}`, data ? { 
      dataSize: data ? JSON.stringify(data).length : 0,
      candidateCount: data?.candidates?.length || 0,
      channelName: data?.name,
      timeout: options.timeout || 60000
    } : "");

    const startTime = Date.now();
    const response = await fetch(url, config);
    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);

    console.log(`⏱️ API ${method} ${url} completed in ${responseTime}ms - Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ API ${method} ${url} success:`, result);

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`⏰ API ${method} ${url} timed out after ${options.timeout || 60000}ms`);
      throw new Error(`Request timed out after ${options.timeout || 60000}ms`);
    }
    
    console.error(`❌ API ${method} ${url} failed:`, error);
    throw error;
  }
};

// GET request
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest("GET", endpoint, null, options);
};

// POST request
export const apiPost = async (endpoint, data = {}, options = {}) => {
  return apiRequest("POST", endpoint, data, options);
};

// PUT request
export const apiPut = async (endpoint, data = {}, options = {}) => {
  return apiRequest("PUT", endpoint, data, options);
};

// DELETE request
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest("DELETE", endpoint, null, options);
};

// PATCH request
export const apiPatch = async (endpoint, data = {}, options = {}) => {
  return apiRequest("PATCH", endpoint, data, options);
};

// WebSocket connection helper
export const createWebSocketConnection = (endpoint) => {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:3002";
  const wsUrl = `${wsBaseUrl}${normalizedEndpoint}`;

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("🔌 WebSocket connected:", wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", data);
      } catch (error) {
        console.log("📨 WebSocket raw message:", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected:", wsUrl);
    };

    return ws;
  } catch (error) {
    console.error("❌ Failed to create WebSocket connection:", error);
    return null;
  }
};

// Vote-specific API functions
export const voteAPI = {
  // Submit a vote to blockchain
  submitVote: async (voteData) => {
    return apiPost("/api/vote/submit", voteData);
  },

  // Submit vote using alternative endpoint
  submitVoteAlt: async (voteData) => {
    return apiPost("/api/vote/submitVote", voteData);
  },

  // Revoke a vote
  revokeVote: async (revokeData) => {
    return apiPost("/api/vote/revokeVote", revokeData);
  },

  // Demo vote (fallback)
  submitDemoVote: async (voteData) => {
    return apiPost("/api/vote/demo", voteData);
  },

  // Get vote counts for a channel
  getVoteCounts: async (channelId) => {
    return apiGet(`/api/vote-counts/channel/${channelId}`);
  },

  // Get vote count for a specific candidate
  getCandidateVoteCount: async (channelId, candidateId) => {
    return apiGet(`/api/vote-counts/candidate/${channelId}/${candidateId}`);
  },

  // Get total unique voters for a channel
  getChannelTotalVoters: async (channelId) => {
    return apiGet(`/api/vote-counts/channel/${channelId}/total-voters`);
  },

  // Get user's votes
  getUserVotes: async (userId) => {
    return apiGet(`/api/vote/user/${userId}`);
  },

  // Verify vote on blockchain
  verifyVote: async (voteId) => {
    return apiGet(`/api/vote/verify/${voteId}`);
  },

  // Production blockchain endpoints
  getNetworkState: async () => {
    return apiGet("/api/vote/network/state");
  },

  getTransactionStatus: async (transactionId) => {
    return apiGet(`/api/vote/transaction/${transactionId}`);
  },

  getProductionVoteCount: async (topic, choice) => {
    return apiGet(`/api/vote/counts/production/${topic}/${choice}`);
  },
};

// Channel-specific API functions
export const channelAPI = {
  // Get all channels
  getChannels: async () => {
    return apiGet("/api/channels");
  },

  // Get channel by ID
  getChannel: async (channelId) => {
    return apiGet(`/api/channels/${channelId}`);
  },

  // Create new channel
  createChannel: async (channelData) => {
    // Use longer timeout for large payloads (433+ candidates)
    const timeout = channelData.candidates && channelData.candidates.length > 100 ? 120000 : 60000;
    return apiPost("/api/channels", channelData, { timeout });
  },

  // Update channel
  updateChannel: async (channelId, channelData) => {
    return apiPut(`/api/channels/${channelId}`, channelData);
  },

  // Delete channel
  deleteChannel: async (channelId) => {
    return apiDelete(`/api/channels/${channelId}`);
  },

  // Delete all channels (clears both blockchain and dev-center channels)
  clearAllChannels: async () => {
    // First clear blockchain channels
    const blockchainResult = await apiDelete("/api/channels");
    // Then clear dev-center test files
    const devCenterResult = await apiDelete("/api/dev-center/channels");
    return {
      success: true,
      blockchain: blockchainResult,
      devCenter: devCenterResult,
      totalDeleted: (blockchainResult.deleted || 0) + (devCenterResult.deleted || 0)
    };
  },
};

// User-specific API functions
export const userAPI = {
  // Get user profile
  getProfile: async (userId) => {
    return apiGet(`/users/${userId}`);
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    return apiPut(`/users/${userId}`, profileData);
  },

  // Get user's channels
  getUserChannels: async (userId) => {
    return apiGet(`/users/${userId}/channels`);
  },
};

// System status API functions
export const systemAPI = {
  // Get system status
  getStatus: async () => {
    return apiGet("/status");
  },

  // Get system metrics
  getMetrics: async () => {
    return apiGet("/metrics");
  },

  // Health check
  healthCheck: async () => {
    return apiGet("/health");
  },
};

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
  createWebSocketConnection,
  voteAPI,
  channelAPI,
  userAPI,
  systemAPI,
};
