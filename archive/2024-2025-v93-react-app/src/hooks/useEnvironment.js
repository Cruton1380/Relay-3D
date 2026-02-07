import { useState, useEffect } from 'react';

/**
 * Environment and user information hook for voting system
 * Provides user authentication, environment detection, and test mode support
 */
export function useEnvironment() {
  const [environment, setEnvironment] = useState({
    userId: 'demo-user-1',
    environment: 'development',
    isTestMode: true,
    isAuthenticated: false,
    userPublicKey: null,
    userRegion: 'unknown'
  });

  useEffect(() => {
    // In a real implementation, this would check for:
    // - User authentication status
    // - Environment variables
    // - User session data
    // - Biometric verification status
    
    const detectEnvironment = () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isTestMode = isDevelopment || process.env.REACT_APP_TEST_MODE === 'true';
      
      // Generate a demo public key for testing
      const demoPublicKey = 'demo-public-key-base-model-1-voting';

      setEnvironment({
        userId: 'demo-user-1',
        environment: isDevelopment ? 'development' : 'production',
        isTestMode,
        isAuthenticated: isTestMode, // Demo users are "authenticated" in test mode
        userPublicKey: demoPublicKey,
        userRegion: 'unknown'
      });
    };

    detectEnvironment();
  }, []);

  return environment;
} 