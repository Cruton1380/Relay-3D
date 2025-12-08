/**
 * @fileoverview Social Service - Manages friend requests, social graph, and relationships
 * Handles friendship lifecycle, blocking, and social features integration
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class SocialService {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = process.env.SOCIAL_SERVICE_PORT || 4004;
    
    // Social graph storage
    this.friendships = new Map(); // userId -> Set(friendIds)
    this.friendRequests = new Map(); // Map of request objects
    this.blockedUsers = new Map(); // userId -> Set(blockedIds)
    this.socialProfiles = new Map(); // userId -> profile data
    
    // Connection management
    this.connections = new Map(); // userId -> WebSocket
    this.presenceStatus = new Map(); // userId -> presence data
    
    // File paths
    this.dataDir = path.join(process.cwd(), 'data', 'social');
    this.friendshipsFile = path.join(this.dataDir, 'friendships.json');
    this.requestsFile = path.join(this.dataDir, 'friend-requests.json');
    this.blockedFile = path.join(this.dataDir, 'blocked-users.json');
    this.profilesFile = path.join(this.dataDir, 'social-profiles.json');
    
    this.setupExpress();
    this.setupWebSocket();
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      console.log('Social Service initialized');
      return this;
    } catch (error) {
      console.error('Failed to initialize Social Service:', error);
      throw error;
    }
  }
  setupExpress() {
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', this.healthCheck.bind(this));

    // Friend request endpoints
    this.app.post('/api/social/friend-request', this.sendFriendRequest.bind(this));
    this.app.post('/api/social/friend-request/accept', this.acceptFriendRequest.bind(this));
    this.app.post('/api/social/friend-request/decline', this.declineFriendRequest.bind(this));
    this.app.get('/api/social/friend-requests/:userId', this.getFriendRequests.bind(this));
    
    // Friendship management
    this.app.get('/api/social/friends/:userId', this.getFriends.bind(this));
    this.app.delete('/api/social/friends/:userId/:friendId', this.removeFriend.bind(this));
    this.app.get('/api/social/friendship/status/:userId/:targetId', this.getFriendshipStatus.bind(this));
    
    // Blocking system
    this.app.post('/api/social/block', this.blockUser.bind(this));
    this.app.post('/api/social/unblock', this.unblockUser.bind(this));
    this.app.get('/api/social/blocked/:userId', this.getBlockedUsers.bind(this));
    
    // Social profiles
    this.app.get('/api/social/profile/:userId', this.getSocialProfile.bind(this));
    this.app.put('/api/social/profile/:userId', this.updateSocialProfile.bind(this));
    
    // Discovery and suggestions
    this.app.get('/api/social/discover/:userId', this.discoverUsers.bind(this));
    this.app.get('/api/social/suggestions/:userId', this.getFriendSuggestions.bind(this));
    this.app.get('/api/social/search', this.searchUsers.bind(this));
    
    // Social graph analytics
    this.app.get('/api/social/graph/:userId', this.getSocialGraph.bind(this));
    this.app.get('/api/social/mutual-friends/:userId/:targetId', this.getMutualFriends.bind(this));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('Social WebSocket message error:', error);
          this.sendWebSocketError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('Social WebSocket error:', error);
      });
    });
  }

  async handleWebSocketMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'authenticate':
        await this.authenticateUser(ws, data);
        break;
      case 'presence_update':
        await this.updatePresence(ws, data);
        break;
      case 'friend_activity':
        await this.broadcastFriendActivity(ws, data);
        break;
      default:
        this.sendWebSocketError(ws, `Unknown message type: ${type}`);
    }
  }

  async authenticateUser(ws, data) {
    const { userId, token } = data;
    
    try {      // Validate user credentials with auth service
      if (!userId || !token) {
        throw new Error('Missing credentials');
      }

      ws.userId = userId;
      this.connections.set(userId, ws);
      
      // Update presence
      this.presenceStatus.set(userId, {
        userId,
        status: 'online',
        lastSeen: Date.now()
      });

      this.sendWebSocketMessage(ws, 'authenticated', { success: true, userId });
      
      // Send pending friend requests
      const pendingRequests = await this.getPendingRequests(userId);
      this.sendWebSocketMessage(ws, 'pending_requests', { requests: pendingRequests });
      
      // Notify friends that user is online
      await this.notifyFriendsPresence(userId, 'online');
      
      console.log(`User ${userId} authenticated in Social Service`);
    } catch (error) {
      this.sendWebSocketError(ws, `Authentication failed: ${error.message}`);
    }
  }

  async sendFriendRequest(req, res) {
    try {
      const { fromUserId, toUserId, message = '' } = req.body;

      if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (fromUserId === toUserId) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
      }

      // Check if already friends
      const friends = this.friendships.get(fromUserId) || new Set();
      if (friends.has(toUserId)) {
        return res.status(400).json({ error: 'Already friends' });
      }

      // Check if blocked
      const blocked = this.blockedUsers.get(toUserId) || new Set();
      if (blocked.has(fromUserId)) {
        return res.status(400).json({ error: 'Cannot send request - user has blocked you' });
      }

      // Check for existing request
      const existingRequest = this.findExistingRequest(fromUserId, toUserId);
      if (existingRequest) {
        return res.status(400).json({ error: 'Friend request already exists' });
      }

      const requestId = crypto.randomUUID();
      const request = {
        id: requestId,
        fromUserId,
        toUserId,
        message,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.friendRequests.set(requestId, request);
      await this.saveRequests();

      // Notify target user via WebSocket
      const targetWs = this.connections.get(toUserId);
      if (targetWs && targetWs.readyState === 1) {
        this.sendWebSocketMessage(targetWs, 'friend_request_received', { request });
      }

      console.log(`Friend request sent from ${fromUserId} to ${toUserId}`);
      
      res.json({ success: true, request });
    } catch (error) {
      console.error('Failed to send friend request:', error);
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  }

  async acceptFriendRequest(req, res) {
    try {
      const { requestId, userId } = req.body;

      const request = this.friendRequests.get(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      if (request.toUserId !== userId) {
        return res.status(403).json({ error: 'Not authorized to accept this request' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not pending' });
      }

      // Create mutual friendship
      if (!this.friendships.has(request.fromUserId)) {
        this.friendships.set(request.fromUserId, new Set());
      }
      if (!this.friendships.has(request.toUserId)) {
        this.friendships.set(request.toUserId, new Set());
      }

      this.friendships.get(request.fromUserId).add(request.toUserId);
      this.friendships.get(request.toUserId).add(request.fromUserId);

      // Update request status
      request.status = 'accepted';
      request.updatedAt = Date.now();

      await this.saveFriendships();
      await this.saveRequests();

      // Notify both users
      const fromUserWs = this.connections.get(request.fromUserId);
      if (fromUserWs && fromUserWs.readyState === 1) {
        this.sendWebSocketMessage(fromUserWs, 'friend_request_accepted', {
          request,
          newFriend: request.toUserId
        });
      }

      const toUserWs = this.connections.get(request.toUserId);
      if (toUserWs && toUserWs.readyState === 1) {
        this.sendWebSocketMessage(toUserWs, 'friendship_established', {
          newFriend: request.fromUserId
        });
      }

      console.log(`Friend request ${requestId} accepted - ${request.fromUserId} and ${request.toUserId} are now friends`);
      
      res.json({ success: true, friendship: true });
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      res.status(500).json({ error: 'Failed to accept friend request' });
    }
  }

  async declineFriendRequest(req, res) {
    try {
      const { requestId, userId } = req.body;

      const request = this.friendRequests.get(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      if (request.toUserId !== userId) {
        return res.status(403).json({ error: 'Not authorized to decline this request' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not pending' });
      }

      // Update request status
      request.status = 'declined';
      request.updatedAt = Date.now();

      await this.saveRequests();

      // Notify sender
      const fromUserWs = this.connections.get(request.fromUserId);
      if (fromUserWs && fromUserWs.readyState === 1) {
        this.sendWebSocketMessage(fromUserWs, 'friend_request_declined', { request });
      }

      console.log(`Friend request ${requestId} declined`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      res.status(500).json({ error: 'Failed to decline friend request' });
    }
  }

  async getFriendRequests(req, res) {
    try {
      const { userId } = req.params;
      const { type = 'received' } = req.query; // 'received', 'sent', 'all'

      const requests = [];
      
      for (const request of this.friendRequests.values()) {
        if (type === 'received' && request.toUserId === userId && request.status === 'pending') {
          requests.push(request);
        } else if (type === 'sent' && request.fromUserId === userId) {
          requests.push(request);
        } else if (type === 'all' && (request.fromUserId === userId || request.toUserId === userId)) {
          requests.push(request);
        }
      }

      // Sort by creation date (newest first)
      requests.sort((a, b) => b.createdAt - a.createdAt);

      res.json({ requests });
    } catch (error) {
      console.error('Failed to get friend requests:', error);
      res.status(500).json({ error: 'Failed to get friend requests' });
    }
  }

  async getFriends(req, res) {
    try {
      const { userId } = req.params;
      const { includePresence = false } = req.query;

      const friends = this.friendships.get(userId) || new Set();
      const friendList = Array.from(friends);

      let result = friendList.map(friendId => ({ userId: friendId }));

      // Include presence information if requested
      if (includePresence === 'true') {
        result = friendList.map(friendId => {
          const presence = this.presenceStatus.get(friendId);
          return {
            userId: friendId,
            presence: presence || { status: 'offline', lastSeen: null }
          };
        });
      }

      res.json({ friends: result, count: friendList.length });
    } catch (error) {
      console.error('Failed to get friends:', error);
      res.status(500).json({ error: 'Failed to get friends' });
    }
  }

  async removeFriend(req, res) {
    try {
      const { userId, friendId } = req.params;

      const userFriends = this.friendships.get(userId) || new Set();
      const friendFriends = this.friendships.get(friendId) || new Set();

      if (!userFriends.has(friendId)) {
        return res.status(400).json({ error: 'Not friends' });
      }

      // Remove mutual friendship
      userFriends.delete(friendId);
      friendFriends.delete(userId);

      await this.saveFriendships();

      // Notify both users
      const userWs = this.connections.get(userId);
      if (userWs && userWs.readyState === 1) {
        this.sendWebSocketMessage(userWs, 'friendship_removed', { removedFriend: friendId });
      }

      const friendWs = this.connections.get(friendId);
      if (friendWs && friendWs.readyState === 1) {
        this.sendWebSocketMessage(friendWs, 'friendship_removed', { removedFriend: userId });
      }

      console.log(`Friendship removed between ${userId} and ${friendId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to remove friend:', error);
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  async getFriendshipStatus(req, res) {
    try {
      const { userId, targetId } = req.params;

      if (userId === targetId) {
        return res.json({ status: 'self' });
      }

      // Check if friends
      const friends = this.friendships.get(userId) || new Set();
      if (friends.has(targetId)) {
        return res.json({ status: 'friends' });
      }

      // Check if blocked
      const blocked = this.blockedUsers.get(userId) || new Set();
      if (blocked.has(targetId)) {
        return res.json({ status: 'blocked' });
      }

      const targetBlocked = this.blockedUsers.get(targetId) || new Set();
      if (targetBlocked.has(userId)) {
        return res.json({ status: 'blocked_by' });
      }

      // Check for pending request
      const existingRequest = this.findExistingRequest(userId, targetId);
      if (existingRequest) {
        if (existingRequest.fromUserId === userId) {
          return res.json({ status: 'request_sent', requestId: existingRequest.id });
        } else {
          return res.json({ status: 'request_received', requestId: existingRequest.id });
        }
      }

      res.json({ status: 'none' });
    } catch (error) {
      console.error('Failed to get friendship status:', error);
      res.status(500).json({ error: 'Failed to get friendship status' });
    }
  }

  async blockUser(req, res) {
    try {
      const { userId, targetId } = req.body;

      if (userId === targetId) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }

      // Remove existing friendship if any
      const userFriends = this.friendships.get(userId) || new Set();
      const targetFriends = this.friendships.get(targetId) || new Set();
      
      if (userFriends.has(targetId)) {
        userFriends.delete(targetId);
        targetFriends.delete(userId);
      }

      // Add to blocked list
      if (!this.blockedUsers.has(userId)) {
        this.blockedUsers.set(userId, new Set());
      }
      this.blockedUsers.get(userId).add(targetId);

      // Cancel any pending friend requests
      for (const [requestId, request] of this.friendRequests.entries()) {
        if ((request.fromUserId === userId && request.toUserId === targetId) ||
            (request.fromUserId === targetId && request.toUserId === userId)) {
          if (request.status === 'pending') {
            request.status = 'cancelled';
            request.updatedAt = Date.now();
          }
        }
      }

      await this.saveFriendships();
      await this.saveBlockedUsers();
      await this.saveRequests();

      console.log(`User ${userId} blocked ${targetId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to block user:', error);
      res.status(500).json({ error: 'Failed to block user' });
    }
  }

  async discoverUsers(req, res) {
    try {
      const { userId } = req.params;
      const { 
        proximity = false,
        mutualFriends = false,
        limit = 20 
      } = req.query;

      // This is a simplified discovery - in a real implementation,
      // you'd integrate with presence detection, location services, etc.
      
      const friends = this.friendships.get(userId) || new Set();
      const blocked = this.blockedUsers.get(userId) || new Set();
      
      let suggestions = [];

      // For now, suggest users who have mutual friends
      if (mutualFriends === 'true') {
        const mutualCandidates = new Set();
        
        for (const friendId of friends) {
          const friendsFriends = this.friendships.get(friendId) || new Set();
          for (const candidate of friendsFriends) {
            if (candidate !== userId && !friends.has(candidate) && !blocked.has(candidate)) {
              mutualCandidates.add(candidate);
            }
          }
        }
        
        suggestions = Array.from(mutualCandidates).slice(0, limit);
      }

      res.json({ users: suggestions, source: 'mutual_friends' });
    } catch (error) {
      console.error('Failed to discover users:', error);
      res.status(500).json({ error: 'Failed to discover users' });
    }
  }

  async getMutualFriends(req, res) {
    try {
      const { userId, targetId } = req.params;

      const userFriends = this.friendships.get(userId) || new Set();
      const targetFriends = this.friendships.get(targetId) || new Set();

      const mutualFriends = [];
      for (const friendId of userFriends) {
        if (targetFriends.has(friendId)) {
          mutualFriends.push(friendId);
        }
      }

      res.json({ mutualFriends, count: mutualFriends.length });
    } catch (error) {
      console.error('Failed to get mutual friends:', error);
      res.status(500).json({ error: 'Failed to get mutual friends' });
    }
  }

  async getSocialGraph(req, res) {
    try {
      const { userId } = req.params;
      const { depth = 1 } = req.query;

      const graph = this.buildSocialGraph(userId, parseInt(depth));
      
      res.json({ graph });
    } catch (error) {
      console.error('Failed to get social graph:', error);
      res.status(500).json({ error: 'Failed to get social graph' });
    }
  }

  // Helper methods
  findExistingRequest(userId1, userId2) {
    for (const request of this.friendRequests.values()) {
      if (request.status === 'pending') {
        if ((request.fromUserId === userId1 && request.toUserId === userId2) ||
            (request.fromUserId === userId2 && request.toUserId === userId1)) {
          return request;
        }
      }
    }
    return null;
  }

  async getPendingRequests(userId) {
    const requests = [];
    for (const request of this.friendRequests.values()) {
      if (request.toUserId === userId && request.status === 'pending') {
        requests.push(request);
      }
    }
    return requests;
  }

  buildSocialGraph(userId, depth) {
    const graph = { nodes: new Set(), edges: [] };
    const visited = new Set();
    
    const traverse = (currentId, currentDepth) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      
      visited.add(currentId);
      graph.nodes.add(currentId);
      
      const friends = this.friendships.get(currentId) || new Set();
      for (const friendId of friends) {
        graph.edges.push({ from: currentId, to: friendId });
        
        if (currentDepth < depth) {
          traverse(friendId, currentDepth + 1);
        }
      }
    };
    
    traverse(userId, 0);
    
    return {
      nodes: Array.from(graph.nodes),
      edges: graph.edges
    };
  }

  async notifyFriendsPresence(userId, status) {
    const friends = this.friendships.get(userId) || new Set();
    
    for (const friendId of friends) {
      const friendWs = this.connections.get(friendId);
      if (friendWs && friendWs.readyState === 1) {
        this.sendWebSocketMessage(friendWs, 'friend_presence_update', {
          userId,
          status,
          timestamp: Date.now()
        });
      }
    }
  }

  sendWebSocketMessage(ws, type, data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type, data }));
    }
  }

  sendWebSocketError(ws, message) {
    this.sendWebSocketMessage(ws, 'error', { message });
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      this.connections.delete(ws.userId);
      
      // Update presence
      this.presenceStatus.set(ws.userId, {
        userId: ws.userId,
        status: 'offline',
        lastSeen: Date.now()
      });
      
      // Notify friends
      this.notifyFriendsPresence(ws.userId, 'offline');
      
      console.log(`User ${ws.userId} disconnected from Social Service`);
    }
  }

  async loadData() {
    try {
      // Load friendships
      const friendshipsData = await fs.readFile(this.friendshipsFile, 'utf8').catch(() => '{}');
      const friendships = JSON.parse(friendshipsData);
      
      for (const [userId, friendList] of Object.entries(friendships)) {
        this.friendships.set(userId, new Set(friendList));
      }

      // Load friend requests
      const requestsData = await fs.readFile(this.requestsFile, 'utf8').catch(() => '{}');
      const requests = JSON.parse(requestsData);
      
      for (const [requestId, request] of Object.entries(requests)) {
        this.friendRequests.set(requestId, request);
      }

      // Load blocked users
      const blockedData = await fs.readFile(this.blockedFile, 'utf8').catch(() => '{}');
      const blocked = JSON.parse(blockedData);
      
      for (const [userId, blockedList] of Object.entries(blocked)) {
        this.blockedUsers.set(userId, new Set(blockedList));
      }

      console.log(`Loaded social data: ${this.friendships.size} users, ${this.friendRequests.size} requests`);
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  }

  async saveFriendships() {
    const friendshipsData = {};
    for (const [userId, friends] of this.friendships.entries()) {
      friendshipsData[userId] = Array.from(friends);
    }
    await fs.writeFile(this.friendshipsFile, JSON.stringify(friendshipsData, null, 2));
  }

  async saveRequests() {
    const requestsData = {};
    for (const [requestId, request] of this.friendRequests.entries()) {
      requestsData[requestId] = request;
    }
    await fs.writeFile(this.requestsFile, JSON.stringify(requestsData, null, 2));
  }

  async saveBlockedUsers() {
    const blockedData = {};
    for (const [userId, blocked] of this.blockedUsers.entries()) {
      blockedData[userId] = Array.from(blocked);
    }
    await fs.writeFile(this.blockedFile, JSON.stringify(blockedData, null, 2));
  }

  async healthCheck(req, res) {
    try {
      const status = {
        service: 'Social Service',
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '1.0.0',
        friendRequests: this.friendRequests.size,
        friendships: this.friendships.size,
        blockedUsers: this.blockedUsers.size,
        activeConnections: this.connections.size,
        socialProfiles: this.socialProfiles.size
      };

      res.json(status);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        service: 'Social Service',
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Social Service running on port ${this.port}`);
    });
  }
}

// Start service if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new SocialService();
  service.initialize().then(() => {
    service.start();
  }).catch(error => {
    console.error('Failed to start Social Service:', error);
    process.exit(1);
  });
}

export default SocialService;
