/**
 * Vote Service
 * Handles vote submission, tracking, and retrieval
 */
import websocketService from './websocketService';
import { getAuthToken } from '../auth/authService.js';
import environmentManager from '../utils/environmentManager.js';

// Define API base URL
const API_BASE_URL = 'http://localhost:3002';

// Define the VoteService class
class VoteService {
  constructor() {
    this.isInitialized = false;
    this.connectionState = 'disconnected';
    this.voteCache = new Map();
    this.connectionListeners = new Set();
    this.voteUpdateListeners = new Set();
    this.initializationPromise = null;
    
    // Listen for environment changes
    environmentManager.addListener((state) => {
      // Environment changed - vote service will adapt automatically
    });
  }

  // Initialize the vote service
  async initializeVoteService() {
    // If already initialized, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized successfully, return true
    if (this.isInitialized && this.connectionState === 'connected') {
      return true;
    }

    console.log('Initializing vote service...');
    
    // Create a new initialization promise
    this.initializationPromise = (async () => {
      try {
        // Initialize WebSocket connection first
        await this.initializeWebSocket();

        // Test backend connection with timeout
        console.log('Testing backend connection...');
        await Promise.race([
          this.testBackendConnection(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);

        this.isInitialized = true;
        this.connectionState = 'connected';
        this.notifyConnectionListeners();
        console.log('Vote service initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize vote service:', error);
        this.connectionState = 'error';
        this.notifyConnectionListeners();
        this.initializationPromise = null; // Allow retry
        throw error; // Propagate error to caller
      }
    })();

    return this.initializationPromise;
  }

  // Test the backend connection
  async testBackendConnection() {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/vote/test`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.status || data.status !== 'connected') {
        throw new Error('Invalid response from vote service');
      }
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Vote service is not available');
      }
      throw error;
    }
  }

  // Initialize WebSocket connection
  async initializeWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // Set initial state
        this.connectionState = 'connecting';
        this.notifyConnectionListeners();

        // Add connection state listener
        websocketService.onConnectionChange((state) => {
          this.connectionState = state;
          this.notifyConnectionListeners();
        });

        // Add vote update listener
        websocketService.on('vote_update', (data) => {
          this.handleVoteUpdate(data);
        });

        // Check if already connected
        if (websocketService.getConnectionState() === 'connected') {
          this.connectionState = 'connected';
          this.notifyConnectionListeners();
          resolve();
        } else {
          // Wait for connection
          const unsubscribe = websocketService.onConnectionChange((state) => {
            if (state === 'connected') {
              unsubscribe();
              resolve();
            } else if (state === 'error' || state === 'failed') {
              unsubscribe();
              reject(new Error('WebSocket connection failed'));
            }
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get current connection state
  getConnectionState() {
    return this.connectionState;
  }

  // Add connection state listener
  addConnectionListener(listener) {
    this.connectionListeners.add(listener);
    // Immediately notify of current state
    listener(this.connectionState);
    return () => this.connectionListeners.delete(listener);
  }

  // Notify all connection listeners
  notifyConnectionListeners() {
    this.connectionListeners.forEach(listener => listener(this.connectionState));
  }

  // Handle vote update
  handleVoteUpdate(data) {
    if (!data || typeof data.id === 'undefined' || typeof data.votes === 'undefined') {
      console.error('Invalid vote update data:', data);
      return;
    }
    this.voteCache.set(data.id, data.votes);
    this.voteUpdateListeners.forEach(listener => listener(data));
  }

  // Add vote update listener
  addVoteUpdateListener(listener) {
    this.voteUpdateListeners.add(listener);
    return () => this.voteUpdateListeners.delete(listener);
  }

  // Submit a vote
  async submitVote(id, value) {
    if (!this.isInitialized || this.connectionState !== 'connected') {
      try {
        await this.initializeVoteService();
      } catch (error) {
        throw new Error('Cannot submit vote: Vote service is not connected');
      }
    }

    try {
      const token = await getAuthToken();
      const requestBody = { id, value };
      console.log('Submitting vote with data:', requestBody);
      console.log('Request URL:', `${API_BASE_URL}/api/vote`);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await fetch(`${API_BASE_URL}/api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit vote');
      }
      this.handleVoteUpdate(data);
      return data;
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }

  // Original submit vote implementation
  async _submitVote(candidateId, vote) {
    if (!this.isInitialized || this.connectionState !== 'connected') {
      try {
        await this.initializeVoteService();
      } catch (error) {
        throw new Error('Cannot submit vote: Vote service is not connected');
      }
    }

    try {
      const token = await getAuthToken();
      const requestBody = { id, value };
      console.log('Submitting vote (test mode) with data:', requestBody);
      console.log('Request URL:', `${API_BASE_URL}/api/vote`);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      // Simulate network latency if enabled
      if (this.testSettings.simulateNetworkLatency) {
        await new Promise(resolve => setTimeout(resolve, this.testSettings.networkLatency));
      }

      const response = await fetch(`${API_BASE_URL}/api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit vote');
      }
      this.handleVoteUpdate(data);
      return data;
    } catch (error) {
      console.error('Failed to submit vote (test mode):', error);
      throw error;
    }
  }

  // Get cached vote count
  getVoteCount(id) {
    return this.voteCache.get(id) || 0;
  }

  // Fetch all vote counts from backend
  async getAllVoteCounts() {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/vote`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Assume data is an object mapping vote IDs to counts
      return data;
    } catch (error) {
      console.error('Failed to fetch all vote counts:', error);
      return {};
    }
  }

  // Test Functions for Development Mode
  
  // Clear all test votes for a channel
  async clearTestVotes(channelId) {
    try {
      const token = await getAuthToken();
      const url = channelId 
        ? `${API_BASE_URL}/api/dev/clear-votes/${channelId}` 
        : `${API_BASE_URL}/api/dev/clear-votes`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to clear test votes:', error);
      throw error;
    }
  }
  
  // Generate random test votes for a channel
  async generateTestVotes(channelId) {
    try {
      const token = await getAuthToken();
      const url = channelId 
        ? `${API_BASE_URL}/api/dev/generate-votes/${channelId}` 
        : `${API_BASE_URL}/api/dev/generate-votes`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: 50, // Default number of votes to generate
          distribution: 'random' // or 'weighted', 'normal', etc.
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to generate test votes:', error);
      throw error;
    }
  }
  
  // Mock vote submission for testing without backend
  async mockVoteSubmission(candidateId, vote) {
    console.log(`Mock vote submission: ${candidateId}, vote: ${vote}`);
    
    const environmentState = environmentManager.getEnvironmentState();
    
    // Simulate network delay if enabled
    if (environmentState.settings.simulateNetworkLatency) {
      await new Promise(resolve => 
        setTimeout(resolve, environmentState.settings.networkLatency || 200)
      );
    }
    
    // Create mock response
    const mockResponse = {
      success: true,
      candidateId,
      vote,
      timestamp: new Date().toISOString()
    };
    
    // Simulate vote update
    this.handleVoteUpdate(mockResponse);
    
    return mockResponse;
  }
  
  // Override submitVote to use mock functionality in test mode
  async submitVote(candidateId, vote) {
    const environmentState = environmentManager.getEnvironmentState();
    
    // If test mode is enabled and test voting is on, use mock vote submission
    if (environmentState.shouldEnableTestVoting) {
      return this.mockVoteSubmission(candidateId, vote);
    }
    
    // Otherwise use the real implementation
    return this._submitVote(candidateId, vote);
  }
}

// Create and export a singleton instance
const voteService = new VoteService();
export default voteService;
