/**
 * Environment Configuration
 * Manages test vs production data separation and environment state
 */
import { mockDevService } from '../services/mockDevService.js';

class EnvironmentManager {
  constructor() {
    this.isTestMode = this.getStoredTestMode();
    this.listeners = new Set();
    this.backendUnavailable = false;
    
    // Initialize from localStorage with proper defaults for each setting
    this.settings = {
      showTestData: this.getStoredSetting('showTestData', false), // Default OFF for production safety, but persist user choice
      enableTestVoting: this.getStoredSetting('enableTestVoting', false),
      deterministicVotes: this.getStoredSetting('deterministicVotes', true) // true by default
    };

    // Bind methods
    this.toggleTestMode = this.toggleTestMode.bind(this);
    this.updateSetting = this.updateSetting.bind(this);
    this.isProduction = this.isProduction.bind(this);
    this.shouldShowTestData = this.shouldShowTestData.bind(this);
    
    // Initialize backend sync (don't await to avoid blocking constructor)
    this.syncWithBackend().catch(err => 
      console.warn('Failed to sync with backend on initialization:', err)
    );
    
    // Notify any early listeners after a brief delay to ensure they're registered
    setTimeout(() => {
      this.notifyListeners();
    }, 0);
  }

  // Get stored test mode state (default false for production)
  getStoredTestMode() {
    const stored = localStorage.getItem('relay_test_mode');
    // Always default to false to ensure production mode by default
    // Only enable if explicitly stored as true
    return stored ? JSON.parse(stored) : false;
  }

  // Get stored setting with default fallback
  getStoredSetting(key, defaultValue) {
    const storageKey = `relay_${key}`;
    const stored = localStorage.getItem(storageKey);
    const value = stored ? JSON.parse(stored) : defaultValue;
    return value;
  }

  // Check if we're in production environment
  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  // Check if we should show test data
  shouldShowTestData() {
    // Never show test data in production unless explicitly enabled
    if (this.isProduction() && !this.settings.showTestData) {
      return false;
    }
    
    return this.isTestMode && this.settings.showTestData;
  }

  // Check if test voting is enabled
  shouldEnableTestVoting() {
    return this.isTestMode && this.settings.enableTestVoting;
  }

  // Check if test UI elements should be shown
  shouldShowTestUI() {
    return this.isTestMode && this.settings.enableTestUI;
  }

  // Sync environment state with backend
  async syncWithBackend() {
    try {
      const environmentState = {
        testMode: this.isTestMode,
        testData: this.settings.showTestData,
        testVoting: this.settings.enableTestVoting,
        deterministicVotes: this.settings.deterministicVotes
      };

      const response = await fetch('/api/dev/set-environment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ environment: environmentState })
      });

      if (!response.ok) {
        console.warn('Failed to sync environment state with backend:', response.status);
        this.backendUnavailable = true;
        // Use mock service as fallback
        await this.useMockEnvironment(environmentState);
      } else {
        console.log('Environment state synced with backend successfully');
        this.backendUnavailable = false;
      }
    } catch (error) {
      console.warn('Could not sync with backend:', error);
      this.backendUnavailable = true;
      // Use mock service as fallback
      await this.useMockEnvironment(environmentState);
    }
  }

  // Use mock environment when backend is unavailable
  async useMockEnvironment(environmentState) {
    const result = await mockDevService.setEnvironment(environmentState);
    if (result) {
      console.log('Environment state synced with mock service');
    }
  }

  // Toggle test mode on/off
  async toggleTestMode() {
    const oldValue = this.isTestMode;
    this.isTestMode = !this.isTestMode;
    console.log('🔧 EnvironmentManager: toggleTestMode from', oldValue, 'to', this.isTestMode);
    
    localStorage.setItem('relay_test_mode', JSON.stringify(this.isTestMode));
    
    // Don't automatically enable test data - let user choose
    // Test mode just opens the panel, test data is a separate choice
    
    // Sync with backend
    await this.syncWithBackend();
    
    console.log('🔧 EnvironmentManager: State after toggle:', this.getEnvironmentState());
    
    // Notify listeners
    this.notifyListeners();
    
    // Emit global environment change event
    window.dispatchEvent(new CustomEvent('environmentChanged', {
      detail: { key: 'testMode', value: this.isTestMode, oldValue }
    }));
    
    return this.isTestMode;
  }

  // Update a specific setting
  async updateSetting(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    console.log('🔧 EnvironmentManager: updateSetting', key, 'from', oldValue, 'to', value);
    
    const storageKey = `relay_${key}`;
    const storageValue = JSON.stringify(value);
    localStorage.setItem(storageKey, storageValue);
    
    // Sync with backend
    await this.syncWithBackend();
    
    console.log('🔧 EnvironmentManager: State after setting update:', this.getEnvironmentState());
    
    // Notify listeners with updated state
    this.notifyListeners();
    
    // Emit global environment change event
    window.dispatchEvent(new CustomEvent('environmentChanged', {
      detail: { key, value, oldValue }
    }));
    
    return value;
  }

  // Get current environment state
  getEnvironmentState() {
    return {
      isTestMode: this.isTestMode,
      isProduction: this.isProduction(),
      shouldShowTestData: this.shouldShowTestData(),
      shouldEnableTestVoting: this.shouldEnableTestVoting(),
      shouldShowTestUI: this.shouldShowTestUI(),
      settings: { ...this.settings }
    };
  }

  // Add listener for environment changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of environment changes
  notifyListeners() {
    const state = this.getEnvironmentState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in environment listener:', error);
      }
    });
  }

  // Clear all test data and reset to production state
  resetToProductionState() {
    this.isTestMode = false;
    this.settings = {
      showTestData: false,
      enableTestVoting: false,
      deterministicVotes: true
    };
    
    // Clear localStorage
    const keys = [
      'relay_test_mode', 'relay_showTestData', 'relay_enableTestVoting',
      'relay_deterministicVotes'
    ];
    keys.forEach(key => localStorage.removeItem(key));
    
    this.notifyListeners();
    
    // Emit reset event
    window.dispatchEvent(new CustomEvent('environmentReset'));
  }

  // Generate deterministic test data (seeded randomness)
  generateDeterministicVotes(candidateId, seed = 12345) {
    if (!this.settings.deterministicVotes) {
      return Math.floor(Math.random() * 10000);
    }
    
    // Simple seeded random number generator
    let seedValue = seed + candidateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    return Math.floor(random() * 10000);
  }
}

// Create singleton instance
const environmentManager = new EnvironmentManager();

// Export for use in components
export default environmentManager;

// Helper functions for easy access
export const isTestMode = () => environmentManager.isTestMode;
export const isProduction = () => environmentManager.isProduction();
export const shouldShowTestData = () => environmentManager.shouldShowTestData();
export const shouldEnableTestVoting = () => environmentManager.shouldEnableTestVoting();
export const shouldShowTestUI = () => environmentManager.shouldShowTestUI();
