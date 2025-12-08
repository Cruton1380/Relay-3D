/**
 * useEnvironment Hook
 * React hook for accessing and managing environment state
 */
import { useState, useEffect } from 'react';
import environmentManager from '../utils/environmentManager.js';

export const useEnvironment = () => {
  const [environmentState, setEnvironmentState] = useState(
    environmentManager.getEnvironmentState()
  );

  useEffect(() => {
    console.log('🔧 useEnvironment: Initial state:', environmentState);
    
    // Subscribe to environment changes
    const unsubscribe = environmentManager.addListener((newState) => {
      console.log('🔧 useEnvironment: State updated via listener:', newState);
      setEnvironmentState(newState);
    });
    
    // Listen for global environment events
    const handleEnvironmentChange = (event) => {
      const newState = environmentManager.getEnvironmentState();
      console.log('🔧 useEnvironment: State updated via event:', event.type, newState);
      setEnvironmentState(newState);
    };
    
    window.addEventListener('environmentChanged', handleEnvironmentChange);
    window.addEventListener('environmentReset', handleEnvironmentChange);
    
    return () => {
      unsubscribe();
      window.removeEventListener('environmentChanged', handleEnvironmentChange);
      window.removeEventListener('environmentReset', handleEnvironmentChange);
    };
  }, []);

  // Helper functions
  const toggleTestMode = () => {
    console.log('🔧 useEnvironment: toggleTestMode called');
    console.log('🔧 useEnvironment: Current state before toggle:', environmentState);
    environmentManager.toggleTestMode();
    const newState = environmentManager.getEnvironmentState();
    console.log('🔧 useEnvironment: State after toggle:', newState);
  };

  const updateSetting = (key, value) => {
    environmentManager.updateSetting(key, value);
  };

  const resetToProductionState = () => {
    environmentManager.resetToProductionState();
  };

  const generateDeterministicVotes = (candidateId, seed) => {
    return environmentManager.generateDeterministicVotes(candidateId, seed);
  };

  return {
    ...environmentState,
    toggleTestMode,
    updateSetting,
    resetToProductionState,
    generateDeterministicVotes
  };
};

export default useEnvironment;
