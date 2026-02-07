import { useEffect, useState } from 'react';
import { signData } from '../services/keyManagerService.js';
import { useAuth } from '../hooks/useAuth.jsx';

class VoteSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  /**
   * Connect to the WebSocket server
   * @param {string} token - Authentication token
   * @returns {Promise<boolean>} Connection success
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const url = `${protocol}//${host}/api/vote-socket`;
        
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          console.log('Vote WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate the connection
          this.send({
            type: 'authenticate',
            token
          });
          
          // Process any queued messages
          this.processQueue();
          
          resolve(true);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log('Vote WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(token), delay);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('Vote WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  /**
   * Send a message through the WebSocket
   * @param {Object} message - Message to send
   * @returns {boolean} Whether the message was sent
   */
  send(message) {
    if (!message) return false;
    
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    
    // If not connected, queue the message
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }
  
  /**
   * Process queued messages
   */
  processQueue() {
    if (this.messageQueue.length === 0 || !this.isConnected) return;
    
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of queue) {
      this.send(message);
    }
  }
  
  /**
   * Handle incoming messages
   * @param {Object} message - Received message
   */
  handleMessage(message) {
    if (!message || !message.type) return;
    
    // Notify listeners for this message type
    const listeners = this.listeners.get(message.type) || [];
    
    for (const listener of listeners) {
      try {
        listener(message);
      } catch (error) {
        console.error(`Error in listener for ${message.type}:`, error);
      }
    }
    
    // Notify global listeners
    const globalListeners = this.listeners.get('*') || [];
    
    for (const listener of globalListeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in global listener:', error);
      }
    }
  }
  
  /**
   * Add a message listener
   * @param {string} type - Message type to listen for (or '*' for all)
   * @param {Function} callback - Callback function
   * @returns {Function} Function to remove the listener
   */
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type).push(callback);
    
    // Return function to remove listener
    return () => {
      const listeners = this.listeners.get(type) || [];
      const index = listeners.indexOf(callback);
      
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Submit a vote via WebSocket
   * @param {Object} voteData - Vote data
   * @returns {Promise<boolean>} Vote submission success
   */
  async submitVote(voteData) {
    try {
      // Sign the vote data
      const signature = await signData('default', {
        ...voteData,
        timestamp: Date.now()
      });
      
      // Send vote message
      this.send({
        type: 'vote',
        data: voteData,
        signature
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to vote updates for a specific topic
   * @param {string} topicId - Topic ID
   */
  subscribeToTopic(topicId) {
    this.send({
      type: 'subscribe',
      topicId
    });
  }
  
  /**
   * Unsubscribe from vote updates for a specific topic
   * @param {string} topicId - Topic ID
   */
  unsubscribeFromTopic(topicId) {
    this.send({
      type: 'unsubscribe',
      topicId
    });
  }
}

// Create singleton instance
const voteSocketService = new VoteSocketService();

/**
 * React hook for using the vote socket
 * @returns {Object} Vote socket hooks and methods
 */
export function useVoteSocket() {
  const { user, isAuthenticated, authToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [voteResults, setVoteResults] = useState({});
  
  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && authToken) {
      voteSocketService.connect(authToken)
        .then(() => setIsConnected(true))
        .catch(error => console.error('Failed to connect to vote socket:', error));
      
      // Add vote result listener
      const removeListener = voteSocketService.addListener('voteResults', (message) => {
        if (message.data && message.data.topicId) {
          setVoteResults(prev => ({
            ...prev,
            [message.data.topicId]: message.data
          }));
        }
      });
      
      return () => {
        removeListener();
        voteSocketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, authToken]);
  
  /**
   * Submit a vote
   * @param {string} topicId - Topic ID
   * @param {string} optionId - Selected option ID
   * @param {number} weight - Vote weight (optional)
   * @returns {Promise<boolean>} Vote submission success
   */
  const submitVote = async (topicId, optionId, weight = 1) => {
    if (!isConnected || !isAuthenticated) {
      return false;
    }
    
    return voteSocketService.submitVote({
      topicId,
      optionId,
      weight,
      userId: user.id,
      regionId: user.regionId
    });
  };
  
  /**
   * Subscribe to vote updates for a topic
   * @param {string} topicId - Topic ID
   */
  const subscribeToTopic = (topicId) => {
    if (isConnected) {
      voteSocketService.subscribeToTopic(topicId);
    }
  };
  
  /**
   * Unsubscribe from vote updates for a topic
   * @param {string} topicId - Topic ID
   */
  const unsubscribeFromTopic = (topicId) => {
    if (isConnected) {
      voteSocketService.unsubscribeFromTopic(topicId);
    }
  };
  
  return {
    isConnected,
    voteResults,
    submitVote,
    subscribeToTopic,
    unsubscribeFromTopic
  };
}

export default voteSocketService;
