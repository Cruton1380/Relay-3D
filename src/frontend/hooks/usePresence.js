import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import websocketService from '../services/websocketService';

export function usePresence() {
  const { isAuthenticated, user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState({});
  const [status, setStatus] = useState('online');
  
  // Initialize websocket listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Handle presence updates
    const handlePresenceUpdate = (data) => {
      if (data.users) {
        setOnlineUsers(data.users);
      }
    };
    
    // Handle individual user status changes
    const handleUserStatusChange = (data) => {
      if (data.userId && data.status) {
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            status: data.status,
            lastActive: data.timestamp
          }
        }));
      }
    };
    
    // Subscribe to presence events
    websocketService.on('presence:update', handlePresenceUpdate);
    websocketService.on('user:status', handleUserStatusChange);
    
    // Send initial presence
    websocketService.send('presence:join', {
      status: status
    });
    
    // Request current online users
    websocketService.send('presence:request');
    
    // Set up ping interval
    const pingInterval = setInterval(() => {
      websocketService.send('presence:ping', {
        status: status
      });
    }, 30000); // Every 30 seconds
    
    return () => {
      websocketService.off('presence:update', handlePresenceUpdate);
      websocketService.off('user:status', handleUserStatusChange);
      
      // Send leave message if still connected
      if (websocketService.isConnected) {
        websocketService.send('presence:leave');
      }
      
      clearInterval(pingInterval);
    };
  }, [isAuthenticated, user, status]);
  
  // Set user status
  const setUserStatus = useCallback((newStatus) => {
    setStatus(newStatus);
    
    if (isAuthenticated && websocketService.isConnected) {
      websocketService.send('presence:status', {
        status: newStatus
      });
    }
  }, [isAuthenticated]);
  
  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers[userId] && onlineUsers[userId].status !== 'offline';
  }, [onlineUsers]);
  
  // Get user status
  const getUserStatus = useCallback((userId) => {
    return onlineUsers[userId] ? onlineUsers[userId].status : 'offline';
  }, [onlineUsers]);
  
  // Get all online users
  const getOnlineUsers = useCallback(() => {
    return Object.entries(onlineUsers)
      .filter(([_, userData]) => userData.status !== 'offline')
      .map(([userId, userData]) => ({
        userId,
        ...userData
      }));
  }, [onlineUsers]);
  
  return {
    status,
    setUserStatus,
    isUserOnline,
    getUserStatus,
    getOnlineUsers,
    onlineUsers
  };
}

export default usePresence;
