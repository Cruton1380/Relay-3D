// Move from frontend/hooks/useSessionSync.js
import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';

/**
 * Hook to synchronize session state across browser tabs
 * @returns {Object} Session synchronization utilities
 */
export function useSessionSync() {
  const { isAuthenticated, logout } = useAuth();
  const [syncState, setSyncState] = useState('idle');
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleStorageChange = (event) => {
      // Handle auth state changes from other tabs
      if (event.key === 'auth_logout' && event.newValue) {
        // Another tab triggered logout
        logout({ reason: 'tab_sync', silent: true });
        setSyncState('sync_logout');
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, logout]);
  
  // Function to broadcast logout to other tabs
  const broadcastLogout = () => {
    localStorage.setItem('auth_logout', Date.now().toString());
    // Clear immediately so future changes trigger again
    setTimeout(() => localStorage.removeItem('auth_logout'), 100);
  };
  
  return {
    syncState,
    broadcastLogout
  };
}
