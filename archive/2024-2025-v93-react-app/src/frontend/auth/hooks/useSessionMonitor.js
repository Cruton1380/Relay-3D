// Move from frontend/hooks/useSessionMonitor.js
import { useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import sessionManager from '../../services/sessionManager.js';

/**
 * Hook to monitor user session activity and prevent timeouts
 * @param {Object} options Configuration options
 * @returns {Object} Session monitoring utilities
 */
export function useSessionMonitor(options = {}) {
  const { 
    interval = 60000, // 1 minute default 
    activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']
  } = options;
  
  const { isAuthenticated, updateActivity } = useAuth();

  const checkSessionStatus = useCallback(async () => {
    try {
      return await sessionManager.checkSessionStatus();
    } catch (error) {
      console.error('Session status check failed:', error);
      return false;
    }
  }, []);

  const showReauthenticationIfNeeded = useCallback(async () => {
    const isValid = await checkSessionStatus();
    if (!isValid && isAuthenticated) {
      // Could trigger a reauthentication modal here
      console.log('Session invalid, reauthentication needed');
    }
    return isValid;
  }, [checkSessionStatus, isAuthenticated]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Set up activity tracking
    const handleActivity = () => {
      updateActivity();
    };
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Set up interval for periodic updates even without activity
    const intervalId = setInterval(handleActivity, interval);
    
    // Clean up
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [isAuthenticated, updateActivity, interval, activityEvents]);
  
  return {
    isMonitoring: isAuthenticated,
    checkSessionStatus,
    showReauthenticationIfNeeded
  };
}
