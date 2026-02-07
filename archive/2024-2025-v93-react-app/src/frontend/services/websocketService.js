/**
 * WebSocket service for real-time communication
 */
import { getAuthToken } from '../auth/authService.js';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Map();
    this.pendingSubscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.baseUrl = 'ws://localhost:3002';
    this.connectionListeners = new Set();
    this.connectionState = 'disconnected'; // Add connection state
  }
  
  async connect(url = this.baseUrl) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    
    try {
      // Get auth token
      const token = await getAuthToken();
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      
      return new Promise((resolve, reject) => {
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionState = 'connected';
          
          // Notify connection listeners
          this.connectionListeners.forEach(listener => listener('connected'));
          
          // Resubscribe to pending subscriptions
          this.pendingSubscriptions.forEach((handler, channel) => {
            this.subscribe(channel, handler);
          });
          this.pendingSubscriptions.clear();
          
          resolve();
        };
        
        this.socket.onclose = () => {
          console.log('WebSocket closed');
          this.socket = null;
          this.isConnecting = false;
          this.connectionState = 'disconnected';
          
          // Notify connection listeners
          this.connectionListeners.forEach(listener => listener('disconnected'));
          
          this.handleReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.connectionState = 'error';
          
          // Notify connection listeners
          this.connectionListeners.forEach(listener => listener('error'));
          
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      });
    } catch (error) {
      this.isConnecting = false;
      this.connectionState = 'error';
      throw error;
    }
  }
  
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionState = 'failed';
      this.connectionListeners.forEach(listener => listener('failed'));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.connectionState = 'reconnecting';
    this.connectionListeners.forEach(listener => listener('reconnecting'));
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }
  
  isActive() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  getConnectionState() {
    return this.connectionState;
  }
  
  subscribe(channel, handler) {
    if (!this.isActive()) {
      // Store subscription for when connection is established
      this.pendingSubscriptions.set(channel, handler);
      return () => {
        this.pendingSubscriptions.delete(channel);
        this.messageHandlers.delete(channel);
      };
    }
    
    if (handler) {
      this.messageHandlers.set(channel, handler);
    }
    
    this.send({
      type: 'subscribe',
      channel
    });
    
    return () => {
      if (this.isActive()) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
      this.messageHandlers.delete(channel);
    };
  }
  
  send(message) {
    if (!this.isActive()) {
      console.warn('WebSocket not connected, message queued');
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }
  
  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type) || this.messageHandlers.get(message.channel);
    if (handler) {
      handler(message);
    }
  }
  
  // Add connection state listener
  onConnectionChange(listener) {
    this.connectionListeners.add(listener);
    // Immediately notify of current state
    listener(this.connectionState);
    return () => this.connectionListeners.delete(listener);
  }
  
  // Add event listener support
  on(event, handler) {
    this.messageHandlers.set(event, handler);
  }
  
  off(event) {
    this.messageHandlers.delete(event);
  }
}

// Create and export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;

