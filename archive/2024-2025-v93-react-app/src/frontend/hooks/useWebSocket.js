/**
 * @fileoverview WebSocket Hook for Real-time Relay Updates
 * Provides real-time connectivity for voting, channels, AI agents, and notifications
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30 seconds

export function useWebSocket() {
  const { isAuthenticated, getToken, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef(new Map());
  const pingIntervalRef = useRef(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      if (wsRef.current) {
        cleanup();
      }

      const token = await getToken();
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        cleanup();
        
        // Only attempt reconnect if we haven't reached max attempts
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, RECONNECT_DELAY);
        } else {
          setError('Failed to connect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle system messages
          if (message.type === 'welcome') {
            console.log('Received welcome message:', message);
          } else if (message.type === 'error') {
            setError(message.data?.message || 'Unknown error');
          }
          
          // Notify all handlers for this message type
          const handlers = messageHandlersRef.current.get(message.type) || [];
          handlers.forEach(handler => {
            try {
              handler(message.data);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect');
      
      // Schedule reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, RECONNECT_DELAY);
      }
    }
  }, [cleanup, getToken]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isAuthenticated, connect, cleanup]);

  const subscribe = useCallback((type, handler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, []);
    }
    messageHandlersRef.current.get(type).push(handler);
    
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  return {
    isConnected,
    error,
    lastMessage,
    subscribe,
    sendMessage
  };
}

export function useVoteUpdates() {
  const { subscribe } = useWebSocket();
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe('vote-updates', (data) => {
      setVotes(prevVotes => {
        // Update vote count for the specific topic
        if (data.type === 'vote_update') {
          return prevVotes.map(vote => {
            if (vote.topic === data.topic) {
              return { ...vote, count: data.voteCount };
            }
            return vote;
          });
        }
        return prevVotes;
      });
    });

    return unsubscribe;
  }, [subscribe]);

  return votes;
}

export function useNotificationUpdates() {
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe('notification', (data) => {
      setNotifications(prev => [...prev, data]);
    });

    return unsubscribe;
  }, [subscribe]);

  return notifications;
}

export function useAIAgentUpdates() {
  const { subscribe } = useWebSocket();
  const [agentUpdates, setAgentUpdates] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribe('ai_agent', (data) => {
      setAgentUpdates(data);
    });

    return unsubscribe;
  }, [subscribe]);

  return agentUpdates;
}

// Utility hooks for specific message types
export function usePresenceUpdates(handler) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe('presence:update', handler);
  }, [subscribe, handler]);
}

export function useChannelUpdates(handler) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe('channel:update', handler);
  }, [subscribe, handler]);
}

export default useWebSocket;
