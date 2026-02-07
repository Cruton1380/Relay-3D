/**
 * useEnvironment Hook for Base Model 1
 * Provides environment-specific configuration and utilities
 */

import { useState, useEffect } from 'react';

const useEnvironment = () => {
  const [environment, setEnvironment] = useState({
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTestMode: false,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
    wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3002',
    features: {
      sybilDefense: true,
      channelDiscovery: true,
      enhancedWindowManagement: true,
      realTimeVoting: true,
      blockchainVerification: true
    }
  });

  useEffect(() => {
    // Detect test mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('test') === 'true' || 
                      urlParams.get('mode') === 'test' ||
                      localStorage.getItem('testMode') === 'true';
    
    setEnvironment(prev => ({
      ...prev,
      isTestMode
    }));

    // Store test mode preference
    if (isTestMode) {
      localStorage.setItem('testMode', 'true');
    }
  }, []);

  // Toggle test mode
  const toggleTestMode = () => {
    const newTestMode = !environment.isTestMode;
    setEnvironment(prev => ({
      ...prev,
      isTestMode: newTestMode
    }));
    
    localStorage.setItem('testMode', newTestMode.toString());
    
    // Reload page to apply test mode changes
    window.location.reload();
  };

  // Get feature flag
  const getFeature = (featureName) => {
    return environment.features[featureName] || false;
  };

  // Set feature flag
  const setFeature = (featureName, enabled) => {
    setEnvironment(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: enabled
      }
    }));
  };

  // Get API URL for specific endpoint
  const getApiUrl = (endpoint) => {
    const baseUrl = environment.apiBaseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  };

  // Get WebSocket URL for specific endpoint
  const getWsUrl = (endpoint) => {
    const baseUrl = environment.wsBaseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  };

  // Check if running in development mode
  const isDevelopment = environment.isDevelopment;

  // Check if running in production mode
  const isProduction = environment.isProduction;

  // Check if test mode is enabled
  const isTestMode = environment.isTestMode;

  return {
    // Environment state
    environment,
    isDevelopment,
    isProduction,
    isTestMode,
    
    // Feature management
    getFeature,
    setFeature,
    
    // URL helpers
    getApiUrl,
    getWsUrl,
    
    // Actions
    toggleTestMode,
    
    // Convenience properties
    features: environment.features,
    apiBaseUrl: environment.apiBaseUrl,
    wsBaseUrl: environment.wsBaseUrl
  };
};

export { useEnvironment }; 