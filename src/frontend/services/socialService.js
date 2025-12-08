/**
 * @fileoverview Social Service Frontend Integration
 * Provides API client for friend requests, social graph, and relationships
 */
import { EventEmitter } from 'events';

class SocialService extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = import.meta.env.VITE_SOCIAL_SERVICE_URL || 'http://localhost:3002';
    this.wsUrl = this.baseUrl.replace('http', 'ws');
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // State
    this.friends = new Set();
    this.friendRequests = new Map();
    this.blockedUsers = new Set();
    this.friendPresence = new Map();
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize service and establish WebSocket connection
   * @param {string} userId - Current user ID
   * @param {string} token - Authentication token
   */
  async initialize(userId, token) {
    this.currentUser = userId;
    this.token = token;
    
    try {
      await this.connectWebSocket();
      await this.loadInitialData();
      return true;
    } catch (error) {
      console.error('Failed to initialize Social Service:', error);
      return false;
    }
  }

  /**
   * Establish WebSocket connection
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to Social Service');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate immediately
          this.authenticate();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Failed to parse Social WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('Disconnected from Social Service');
          this.isConnected = false;
          this.isAuthenticated = false;
          this.emit('disconnected');
          
          // Attempt reconnection
          this.attemptReconnection();
        };
        
        this.ws.onerror = (error) => {
          console.error('Social Service WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'authenticated':
        this.isAuthenticated = data.success;
        this.emit('authenticated', data);
        break;
        
      case 'pending_requests':
        this.updateFriendRequests(data.requests);
        this.emit('friend_requests_updated', data.requests);
        break;
        
      case 'friend_request_received':
        this.addFriendRequest(data.request);
        this.emit('friend_request_received', data.request);
        break;
        
      case 'friend_request_accepted':
        this.handleFriendRequestAccepted(data);
        break;
        
      case 'friend_request_declined':
        this.handleFriendRequestDeclined(data);
        break;
        
      case 'friendship_established':
        this.addFriend(data.newFriend);
        this.emit('friendship_established', data);
        break;
        
      case 'friendship_removed':
        this.removeFriend(data.removedFriend);
        this.emit('friendship_removed', data);
        break;
        
      case 'friend_presence_update':
        this.updateFriendPresence(data);
        break;
        
      case 'error':
        console.error('Social Service error:', data.message);
        this.emit('error', data);
        break;
        
      default:
        console.warn('Unknown Social message type:', type);
    }
  }

  /**
   * Load initial social data
   */
  async loadInitialData() {
    try {
      // Load friends
      const friendsData = await this.getFriends(true);
      this.updateFriends(friendsData.friends);
      
      // Load pending friend requests
      const requestsData = await this.getFriendRequests();
      this.updateFriendRequests(requestsData.requests);
      
      // Load blocked users
      const blockedData = await this.getBlockedUsers();
      this.updateBlockedUsers(blockedData.users);
      
    } catch (error) {
      console.error('Failed to load initial social data:', error);
    }
  }

  /**
   * Authenticate with the service
   */
  authenticate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage('authenticate', {
        userId: this.currentUser,
        token: this.token
      });
    }
  }

  /**
   * Send WebSocket message
   */
  sendMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Attempt WebSocket reconnection
   */
  attemptReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`Attempting to reconnect to Social Service (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connectWebSocket().catch(error => {
          console.error('Social reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for Social Service');
      this.emit('connection_failed');
    }
  }

  // State Management Methods

  updateFriends(friends) {
    this.friends.clear();
    this.friendPresence.clear();
    
    for (const friend of friends) {
      this.friends.add(friend.userId);
      if (friend.presence) {
        this.friendPresence.set(friend.userId, friend.presence);
      }
    }
  }

  updateFriendRequests(requests) {
    this.friendRequests.clear();
    for (const request of requests) {
      this.friendRequests.set(request.id, request);
    }
  }

  updateBlockedUsers(users) {
    this.blockedUsers.clear();
    for (const user of users) {
      this.blockedUsers.add(user.userId);
    }
  }

  addFriend(userId) {
    this.friends.add(userId);
  }

  removeFriend(userId) {
    this.friends.delete(userId);
    this.friendPresence.delete(userId);
  }

  addFriendRequest(request) {
    this.friendRequests.set(request.id, request);
  }

  removeFriendRequest(requestId) {
    this.friendRequests.delete(requestId);
  }

  updateFriendPresence(data) {
    const { userId, status, lastSeen } = data;
    if (this.friends.has(userId)) {
      this.friendPresence.set(userId, { status, lastSeen });
      this.emit('friend_presence_changed', data);
    }
  }

  handleFriendRequestAccepted(data) {
    const { request, newFriend } = data;
    this.removeFriendRequest(request.id);
    this.addFriend(newFriend);
    this.emit('friend_request_accepted', data);
  }

  handleFriendRequestDeclined(data) {
    const { request } = data;
    this.removeFriendRequest(request.id);
    this.emit('friend_request_declined', data);
  }

  // API Methods

  /**
   * Send friend request
   */
  async sendFriendRequest(toUserId, message = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          fromUserId: this.currentUser,
          toUserId,
          message
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.emit('friend_request_sent', result.request);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friend-request/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          requestId,
          userId: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.removeFriendRequest(requestId);
        // Friend will be added via WebSocket notification
      }
      
      return result;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friend-request/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          requestId,
          userId: this.currentUser
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.removeFriendRequest(requestId);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      throw error;
    }
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(type = 'received') {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friend-requests/${this.currentUser}?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get friend requests:', error);
      throw error;
    }
  }

  /**
   * Get friends list
   */
  async getFriends(includePresence = false) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/${this.currentUser}?includePresence=${includePresence}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get friends:', error);
      throw error;
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(friendId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/${this.currentUser}/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.removeFriend(friendId);
        this.emit('friend_removed', { friendId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  /**
   * Get friendship status with another user
   */
  async getFriendshipStatus(targetId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friendship/status/${this.currentUser}/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get friendship status:', error);
      throw error;
    }
  }

  /**
   * Block user
   */
  async blockUser(targetId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.currentUser,
          targetId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.blockedUsers.add(targetId);
        this.friends.delete(targetId);
        this.emit('user_blocked', { targetId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(targetId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.currentUser,
          targetId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.blockedUsers.delete(targetId);
        this.emit('user_unblocked', { targetId });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/blocked/${this.currentUser}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      throw error;
    }
  }

  /**
   * Discover users (for friend suggestions)
   */
  async discoverUsers(options = {}) {
    try {
      const params = new URLSearchParams({
        proximity: options.proximity || false,
        mutualFriends: options.mutualFriends || true,
        limit: options.limit || 20
      });
      
      const response = await fetch(`${this.baseUrl}/api/social/discover/${this.currentUser}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to discover users:', error);
      throw error;
    }
  }

  /**
   * Get mutual friends with another user
   */
  async getMutualFriends(targetId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/mutual-friends/${this.currentUser}/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get mutual friends:', error);
      throw error;
    }
  }

  /**
   * Get social graph
   */
  async getSocialGraph(depth = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/graph/${this.currentUser}?depth=${depth}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get social graph:', error);
      throw error;
    }
  }

  /**
   * Search users by name or username
   */
  async searchUsers(query) {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: 20
      });
      
      const response = await fetch(`${this.baseUrl}/api/social/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Check if user is a friend
   */
  isFriend(userId) {
    return this.friends.has(userId);
  }

  /**
   * Check if user is blocked
   */
  isBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  /**
   * Get friend presence
   */
  getFriendPresence(userId) {
    return this.friendPresence.get(userId) || { status: 'offline', lastSeen: null };
  }

  /**
   * Get pending friend requests
   */
  getPendingRequests() {
    return Array.from(this.friendRequests.values());
  }

  /**
   * Get friends list
   */
  getFriendsList() {
    return Array.from(this.friends);
  }

  /**
   * Get blocked users list
   */
  getBlockedUsersList() {
    return Array.from(this.blockedUsers);
  }

  /**
   * Update presence status
   */
  updatePresence(status) {
    this.sendMessage('presence_update', { status });
  }

  /**
   * Disconnect from service
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      friendCount: this.friends.size,
      pendingRequests: this.friendRequests.size
    };
  }
}

export default SocialService;
