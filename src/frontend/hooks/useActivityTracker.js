// frontend/hooks/useActivityTracker.js
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth.jsx';

/**
 * Hook to track user activity and update lastActivity timestamp
 * @param {number} inactivityTimeout - Timeout in ms before considering user inactive
 * @param {Function} onInactive - Callback to run when user becomes inactive
 */
export function useActivityTracker(inactivityTimeout = 30 * 60 * 1000, onInactive = () => {}) {
  const { isAuthenticated, updateActivity } = useAuth();
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      updateActivity();
      
      timeoutRef.current = setTimeout(() => {
        onInactive();
      }, inactivityTimeout);
    };
    
    // Events to track for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Initial activity tracking
    resetTimer();
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Clean up
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, inactivityTimeout, onInactive, updateActivity]);
}

export default useActivityTracker;

