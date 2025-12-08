/**
 * Data Service
 * Handles switching between test and production data sources
 */
import environmentManager from '../utils/environmentManager.js';
import { getAuthToken } from '../auth/authService.js';
import { mockDevService } from './mockDevService.js';

class DataService {
  constructor() {
    this.testData = null;
    this.productionData = null;
    this.reloadInProgress = false;
    this.backendUnavailable = false;
    this.loadTestData();
    
    // Listen for environment changes to reload test data
    this.setupEnvironmentListener();
  }

  // Setup listener for environment changes
  setupEnvironmentListener() {
    const handleEnvironmentChange = async () => {
      // Prevent multiple rapid reloads
      if (this.reloadInProgress) {
        return;
      }
      this.reloadInProgress = true;
      
      // Reload test data when environment changes
      await this.loadTestData();
      
      // Mark reload as complete
      this.reloadInProgress = false;
      
      // Emit a data updated event to refresh UI components
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { type: 'environmentChanged' }
      }));
    };

    // Listen for environment manager changes
    environmentManager.addListener(handleEnvironmentChange);
    
    // Listen for global environment events
    window.addEventListener('environmentChanged', handleEnvironmentChange);
    window.addEventListener('environmentReset', handleEnvironmentChange);
  }

  // Load test data from backend API with better error handling
  async loadTestData() {
    try {
      // Check if we should even try the backend
      if (this.backendUnavailable) {
        console.log('DataService: Backend known to be unavailable, using mock data');
        await this.useMockData();
        return;
      }

      // Try backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('/api/dev/test-data', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          this.testData = {
            channels: data.channels || [],
            // Add other test data sources here
          };
          this.backendUnavailable = false;
          console.log('DataService: Successfully loaded test data from backend');
        } else {
          console.warn('DataService: Backend returned error status:', response.status);
          this.backendUnavailable = true;
          await this.useMockData();
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('DataService: Backend request timed out');
        } else {
          console.warn('DataService: Backend fetch failed:', fetchError.message);
        }
        this.backendUnavailable = true;
        await this.useMockData();
      }
      
      // Only apply deterministic vote counts if enabled AND we're using mock data
      if (environmentManager.getEnvironmentState().settings.deterministicVotes && this.backendUnavailable) {
        this.applyDeterministicVotes();
      }
    } catch (error) {
      console.warn('Could not load test data:', error);
      await this.useMockData();
    }
  }

  // Use mock data when backend is unavailable
  async useMockData() {
    this.backendUnavailable = true;
    
    // Activate mock service
    mockDevService.activate();
    
    const mockData = await mockDevService.getTestData();
    if (mockData && mockData.channels) {
      this.testData = {
        channels: mockData.channels,
      };
      console.log('DataService: Using mock data - backend unavailable', mockData.channels.length, 'channels loaded');
    } else {
      this.testData = { channels: [] };
      console.warn('DataService: Mock data service returned no channels');
    }
  }

  // Apply deterministic vote counts to test data
  applyDeterministicVotes() {
    if (!this.testData?.channels) return;

    this.testData.channels.forEach(channel => {
      if (channel.candidates) {
        channel.candidates.forEach(candidate => {
          // Generate deterministic vote count based on candidate ID
          candidate.votes = environmentManager.generateDeterministicVotes(candidate.id);
        });
        
        // Update total votes
        channel.totalVotes = channel.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
      }
    });
  }

  // Get channels data based on current environment
  async getChannels() {
    // Always get fresh environment state for each call
    const environmentState = environmentManager.getEnvironmentState();
    
    // In production mode or when test data is disabled, return production data
    if (!environmentState.shouldShowTestData) {
      return this.getProductionChannels();
    }
    
    // In test mode, return test data
    return this.getTestChannels();
  }

  // Get production channels from API
  async getProductionChannels() {
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.productionData = data;
      return data;
    } catch (error) {
      console.error('Error fetching production channels:', error);
      
      // Try mock data if backend is unavailable
      if (this.backendUnavailable || error.message.includes('Failed to fetch')) {
        const mockData = await mockDevService.getChannels();
        if (mockData && mockData.success && Array.isArray(mockData.channels)) {
          console.log('DataService: Using mock production channels - backend unavailable');
          return mockData.channels;
        }
      }
      
      // Return empty data as last resort
      return [];
    }
  }

  // Get test channels
  getTestChannels() {
    if (!this.testData?.channels) {
      return [];
    }

    // Return test data as-is without adding extra labels
    const testChannels = this.testData.channels.map(channel => ({
      ...channel,
      isTestData: true,
      candidates: channel.candidates?.map(candidate => ({
        ...candidate,
        isTestData: true
      })) || []
    }));
    
    return testChannels;
  }

  // Get specific channel by ID
  async getChannel(channelId) {
    const channels = await this.getChannels();
    return channels.find(channel => channel.id === channelId);
  }

  // Clear all vote data (for testing)
  async clearAllVotes() {
    const environmentState = environmentManager.getEnvironmentState();
    
    if (environmentState.shouldShowTestData) {
      // Reset test data votes
      this.resetTestVotes();
    } else {
      // Call production API to clear votes
      await this.clearProductionVotes();
    }
  }

  // Reset test data votes to deterministic values
  resetTestVotes() {
    if (this.testData?.channels) {
      this.applyDeterministicVotes();
      
      // Emit event for components to refresh
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { type: 'votesCleared' }
      }));
    }
  }

  // Clear production votes via API
  async clearProductionVotes() {
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/dev/clear-votes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Emit event for components to refresh
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { type: 'votesCleared' }
      }));
      
      return await response.json();
    } catch (error) {
      console.error('Error clearing production votes:', error);
      throw error;
    }
  }

  // Check if we have any data to show
  async hasData() {
    const channels = await this.getChannels();
    return channels.length > 0;
  }

  // Get data source indicator for UI
  getDataSourceInfo() {
    const environmentState = environmentManager.getEnvironmentState();
    
    if (environmentState.shouldShowTestData) {
      return {
        source: 'test',
        label: 'Test Data',
        description: 'Showing mock data for development and testing'
      };
    } else {
      return {
        source: 'production',
        label: 'Live Data',
        description: 'Showing real user-generated content'
      };
    }
  }

  // Force refresh test data from mock service (when new channels are added)
  async refreshTestData() {
    console.log('DataService: Force refreshing test data from mock service');
    await this.useMockData();
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
