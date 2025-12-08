/**
 * @fileoverview Channel Service - Manages proximity, regional, and global channels
 * Handles channel creation, discovery, communication, and user interactions
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import GroupSignalProtocol from '../services/groupSignalProtocol.mjs';
import channelPresenceIntegration from './presenceIntegration.mjs';
import { notificationManager } from '../notifications/notificationManager.mjs';
import encounterHistory from './encounterHistory.mjs';
import contentVoting from './contentVoting.mjs';

// Enhanced message structure and reactions support
class ChannelService {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = process.env.CHANNEL_SERVICE_PORT || 4003;    // Channel storage
    this.channels = new Map(); // channelId -> channel data
    this.userChannels = new Map(); // userId -> Set(channelIds)
    this.channelMembers = new Map(); // channelId -> Set(userIds)
    this.channelMessages = new Map(); // channelId -> Array(messages)    this.channelFeeds = new Map(); // channelId -> Array(feed posts)    this.messages = new Map(); // channelId -> Array(messages) - for API endpoints
    this.feeds = new Map(); // channelId -> Array(feed posts) - for API endpoints
    this.encounters = new Map(); // userId -> Array(encounters) - for encounter history
    this.votes = new Map(); // contentKey -> {upvotes, downvotes, voters} - for content voting
    
    // Connection management
    this.connections = new Map(); // userId -> WebSocket
    this.activeUsers = new Map(); // userId -> user data with presence
    
    // File paths
    this.dataDir = path.join(process.cwd(), 'data', 'channels');
    this.channelsFile = path.join(this.dataDir, 'channels.json');
    this.messagesFile = path.join(this.dataDir, 'messages.json');
    this.feedsFile = path.join(this.dataDir, 'feeds.json');
    
    // Group encryption
    this.groupProtocol = null;
    
    // Add message reactions and threading storage
    this.messageReactions = new Map(); // messageId -> Map(emoji -> Set(userIds))
    this.messageThreads = new Map(); // parentMessageId -> Array(replyMessages)
    this.userProfiles = new Map(); // userId -> { displayName, avatar, publicKey }
    
    // File paths for new data
    this.reactionsFile = path.join(this.dataDir, 'reactions.json');
    this.threadsFile = path.join(this.dataDir, 'threads.json');
    this.profilesFile = path.join(this.dataDir, 'profiles.json');
    
    this.setupExpress();
    this.setupWebSocket();
  }  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      // Initialize group Signal Protocol
      this.groupProtocol = new GroupSignalProtocol();
      await this.groupProtocol.initialize();
        // Initialize presence integration
      channelPresenceIntegration.initialize(this);
      
      // Initialize encounter history
      await encounterHistory.initialize();
      
      // Initialize content voting
      await contentVoting.initialize();
      
      console.log('Channel Service initialized');
      return this;
    } catch (error) {
      console.error('Failed to initialize Channel Service:', error);
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
    this.app.get('/health', this.healthCheck.bind(this));    // Channel management endpoints    this.app.post('/api/channels/create', this.createChannel.bind(this));
    this.app.post('/api/channels/create-official', this.createOfficialProximityChannel.bind(this));
    this.app.post('/api/channels/:channelId/vote', this.voteForChannel.bind(this));
    this.app.get('/api/channels/discover', this.discoverChannels.bind(this));
    this.app.get('/api/topic-rows/:topicRow/rankings', this.getTopicRowRankings.bind(this));
    this.app.post('/api/channels/join', this.joinChannel.bind(this));
    this.app.post('/api/channels/leave', this.leaveChannel.bind(this));
    this.app.get('/api/channels/:channelId', this.getChannel.bind(this));
    this.app.put('/api/channels/:channelId', this.updateChannel.bind(this));
    this.app.delete('/api/channels/:channelId', this.deleteChannel.bind(this));
    
    // Communication endpoints
    this.app.get('/api/channels/:channelId/messages', this.getMessages.bind(this));
    this.app.post('/api/channels/:channelId/messages', this.sendMessage.bind(this));
    this.app.get('/api/channels/:channelId/feed', this.getFeed.bind(this));
    this.app.post('/api/channels/:channelId/feed', this.createFeedPost.bind(this));
      // Member management
    this.app.get('/api/channels/:channelId/members', this.getMembers.bind(this));
    this.app.post('/api/channels/:channelId/members', this.addMember.bind(this));
    this.app.delete('/api/channels/:channelId/members/:userId', this.removeMember.bind(this));
    this.app.post('/api/channels/:channelId/members/:userId/kick', this.kickMember.bind(this));
    this.app.post('/api/channels/:channelId/members/:userId/ban', this.banMember.bind(this));
    this.app.post('/api/channels/:channelId/members/:userId/promote', this.promoteMember.bind(this));
    this.app.post('/api/channels/:channelId/members/:userId/demote', this.demoteMember.bind(this));
    this.app.post('/api/channels/:channelId/transfer-ownership', this.transferOwnership.bind(this));
    
    // User channel overview
    this.app.get('/api/users/:userId/channels', this.getUserChannels.bind(this));
    
    // Message reactions endpoints
    this.app.post('/api/channels/:channelId/messages/:messageId/reactions', this.addReaction.bind(this));
    this.app.delete('/api/channels/:channelId/messages/:messageId/reactions/:emoji', this.removeReaction.bind(this));
    this.app.get('/api/channels/:channelId/messages/:messageId/reactions', this.getReactions.bind(this));
    
    // Message threading endpoints
    this.app.post('/api/channels/:channelId/messages/:messageId/replies', this.addReply.bind(this));
    this.app.get('/api/channels/:channelId/messages/:messageId/replies', this.getMessageReplies.bind(this));
      // Message search endpoint
    this.app.get('/api/channels/:channelId/search', this.searchMessages.bind(this));
    
    // Encounter history endpoints    this.app.get('/api/users/:userId/encounters', this.getUserEncounters.bind(this));
    this.app.get('/api/users/:userId/encounters/location', this.searchEncountersByLocation.bind(this));
    this.app.get('/api/channels/:channelId/encounters/stats', this.getChannelEncounterStats.bind(this));
    this.app.get('/api/channels/:channelId/read-only/:userId', this.getReadOnlyChannelAccess.bind(this));
    this.app.post('/api/encounters/record', this.recordEncounter.bind(this));
      // Content voting endpoints
    this.app.post('/api/channels/:channelId/content/:contentId/vote', this.voteOnContent.bind(this));
    this.app.get('/api/channels/:channelId/content/:contentId/votes', this.getContentVotes.bind(this));
    this.app.get('/api/channels/:channelId/trending', this.getTrendingContent.bind(this));
    this.app.get('/api/channels/:channelId/ranking', this.getContentRanking.bind(this));
    this.app.get('/api/content/search', this.searchContent.bind(this));
    this.app.get('/api/users/:userId/vote-stats', this.getUserVoteStats.bind(this));
    
    // Signal ownership validation
    this.app.post('/api/channels/:channelId/validate-ownership', this.validateMessageOwnership.bind(this));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendWebSocketError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async handleWebSocketMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'authenticate':
        await this.authenticateUser(ws, data);
        break;
      case 'channel_message':
        await this.handleChannelMessage(ws, data);
        break;
      case 'typing_indicator':
        await this.handleTypingIndicator(ws, data);
        break;
      case 'presence_update':
        await this.handlePresenceUpdate(ws, data);
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
      
      // Update user presence
      this.activeUsers.set(userId, {
        userId,
        lastSeen: Date.now(),
        status: 'online'
      });

      this.sendWebSocketMessage(ws, 'authenticated', { success: true, userId });
      
      // Send user's channels
      const userChannelIds = this.userChannels.get(userId) || new Set();
      const userChannels = Array.from(userChannelIds).map(id => this.channels.get(id)).filter(Boolean);
      
      this.sendWebSocketMessage(ws, 'user_channels', { channels: userChannels });
      
      console.log(`User ${userId} authenticated in Channel Service`);
    } catch (error) {
      this.sendWebSocketError(ws, `Authentication failed: ${error.message}`);
    }
  }

  // Enhanced message handling with smart notifications
  async handleChannelMessage(ws, data) {
    const { channelId, message, messageType = 'text', replyToId = null } = data;
    const userId = ws.userId;

    if (!userId) {
      this.sendWebSocketError(ws, 'Not authenticated');
      return;
    }

    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        this.sendWebSocketError(ws, 'Channel not found');
        return;
      }

      const members = this.channelMembers.get(channelId) || new Set();
      if (!members.has(userId)) {
        this.sendWebSocketError(ws, 'Not a member of this channel');
        return;
      }

      // Validate message ownership and prevent spoofing
      const ownershipValid = await this.validateSenderOwnership(userId, message);
      if (!ownershipValid) {
        this.sendWebSocketError(ws, 'Message ownership validation failed');
        return;
      }

      // Encrypt message using group Signal Protocol
      const encryptedMessage = await this.groupProtocol.encryptGroupMessage(
        channelId, userId, message
      );

      // Get user profile for display
      const userProfile = await this.getUserProfile(userId);

      const messageData = {
        id: crypto.randomUUID(),
        channelId,
        senderId: userId,
        senderName: userProfile.displayName || userId,
        senderAvatar: userProfile.avatar,
        type: messageType,
        content: message,
        encrypted: encryptedMessage,
        timestamp: Date.now(),
        edited: false,
        editedAt: null,
        replyToId: replyToId || null,
        reactions: new Map(),
        replyCount: 0,
        signature: await this.signMessage(userId, message)
      };

      // Store message
      if (!this.channelMessages.has(channelId)) {
        this.channelMessages.set(channelId, []);
      }
      this.channelMessages.get(channelId).push(messageData);

      // Handle threading if this is a reply
      if (replyToId) {
        if (!this.messageThreads.has(replyToId)) {
          this.messageThreads.set(replyToId, []);
        }
        this.messageThreads.get(replyToId).push(messageData);
        
        // Update parent message reply count
        const parentMessage = this.findMessageById(channelId, replyToId);
        if (parentMessage) {
          parentMessage.replyCount++;
        }
      }

      // Process smart notifications
      const membersArray = Array.from(members);
      await Promise.all([
        notificationManager.processMentions(channelId, messageData, membersArray),
        notificationManager.processKeywordAlerts(channelId, messageData, membersArray)
      ]);

      // Broadcast to all channel members
      for (const memberId of members) {
        const memberWs = this.connections.get(memberId);
        if (memberWs && memberWs.readyState === 1) {
          this.sendWebSocketMessage(memberWs, 'channel_message', messageData);
        }
      }

      await this.saveMessages();
      await this.saveThreads();
      
      console.log(`Enhanced message sent in channel ${channelId} by ${userId}`);
    } catch (error) {
      console.error('Failed to handle channel message:', error);
      this.sendWebSocketError(ws, 'Failed to send message');
    }
  }

  async loadData() {
    try {
      // Load existing data from persistent storage if needed
      // For now, just return - data will be stored in memory
      console.log('🔄 Channel service data loaded (in-memory storage)');
    } catch (error) {
      console.error('Error loading channel service data:', error);
      // Don't throw - allow service to start with empty data
    }
  }

  async saveData() {
    try {
      // Save data to persistent storage if needed
      // For now, just log - using in-memory storage
      console.log('💾 Channel service data saved (in-memory storage)');
    } catch (error) {
      console.error('Error saving channel service data:', error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'channel-service'
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ error: 'Service unhealthy' });
    }
  }
  /**
   * Create a new channel with topic row integration
   */
  async createChannel(req, res) {
    try {      const { 
        name, 
        description, 
        channelType = 'proximity', // proximity, regional, global
        topicRow, 
        location,
        isAnonymous = false,
        wifiSignal = null, // for proximity channels with signal control
        parameters = {} // governance parameters
      } = req.body;
      
      const ownerId = req.user?.id || 'anonymous';
      
      // Validate channel type
      if (!['proximity', 'regional', 'global'].includes(channelType)) {
        return res.status(400).json({ error: 'Invalid channel type. Must be proximity, regional, or global.' });
      }        // Validate topic row
      if (!topicRow || topicRow.trim().length === 0) {
        return res.status(400).json({ error: 'Topic row name is required for channel discovery.' });
      }
      
      // Set default parameters based on channel type
      const defaultParameters = {
        voteDuration: 7, // days required for stabilization
        voteDecayDuration: 30, // days before votes decay
        minimumQuorum: 100, // minimum votes for stabilization
        minimumUsers: 50, // minimum users for stabilization
        chatFilterThreshold: -10, // chat moderation threshold
        ...parameters
      };
      
      const channel = {
        id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        channelType,
        topicRow: topicRow.trim().toLowerCase(),
        location,
        ownerId: isAnonymous ? 'anonymous' : ownerId,
        createdAt: new Date().toISOString(),
        members: [ownerId],
        memberCount: 1,
        
        // Topic row competition data
        voteCount: 0,
        topicReliabilityScore: 0,
        rankingPosition: null, // will be calculated relative to other channels in topic row
          // Channel-specific features
        wifiSignal: channelType === 'proximity' ? wifiSignal : null,
        canResetViaSignal: channelType === 'proximity' && wifiSignal,
        isOfficialProximityChannel: false, // will be set to true if created after verified ownership reset
        migrationInfo: null, // will contain migration data if channel was migrated from proximity
        
        // Governance and parameters
        parameters: defaultParameters,
        governance: {
          leadership: channelType === 'proximity' ? 'owner' : 
                     channelType === 'regional' ? 'elected' : 'founder',
          electedOfficials: channelType === 'regional' ? [] : null,
          devTeam: channelType === 'proximity' ? [ownerId] : null
        },
        
        // Communication spaces
        newsfeed: [],
        chatroom: {
          messages: [],
          userScores: new Map(),
          activeUsers: new Set()
        },
        
        // Evolution tracking
        originalChannel: null, // for tracking proximity -> regional -> global evolution
        evolutionHistory: []
      };
      
      // Initialize topic row if it doesn't exist
      if (!this.topicRows) {
        this.topicRows = new Map(); // topicRow -> Array(channelIds)
      }
      
      if (!this.topicRows.has(channel.topicRow)) {
        this.topicRows.set(channel.topicRow, []);
      }
      
      // Add to topic row and calculate initial ranking
      this.topicRows.get(channel.topicRow).push(channel.id);
      channel.rankingPosition = this.topicRows.get(channel.topicRow).length;
      
      // Store channel
      this.channels.set(channel.id, channel);
      
      // Update user-channel mapping
      if (!this.userChannels.has(ownerId)) {
        this.userChannels.set(ownerId, new Set());
      }
      this.userChannels.get(ownerId).add(channel.id);
      
      // Save data
      await this.saveData();
      
      // Log channel creation
      console.log(`Channel created: ${channel.name} (${channel.channelType}) in topic row "${channel.topicRow}"`);
      
      res.status(201).json({
        ...channel,
        chatroom: {
          activeUsers: channel.chatroom.activeUsers.size,
          messageCount: channel.chatroom.messages.length
        }
      });
      
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(500).json({ error: 'Failed to create channel' });
    }
  }

  /**
   * Create an official proximity channel after verified hotspot ownership reset
   */
  async createOfficialProximityChannel(req, res) {
    try {
      const {
        name,
        description,
        topicRow,
        location,
        hotspotData,
        parameters = {}
      } = req.body;
      
      const ownerId = req.user?.id;
      
      if (!ownerId) {
        return res.status(401).json({ error: 'Authentication required for official channel creation' });
      }
      
      // Verify ownership through proximity ownership manager
      const ownershipManager = (await import('./proximityOwnershipManager.mjs')).default;
      const canCreate = await ownershipManager.canCreateOfficialProximityChannel(ownerId, hotspotData);
      
      if (!canCreate.canCreate) {
        return res.status(403).json({ 
          error: 'Not authorized to create official proximity channel',
          reason: canCreate.reason,
          requiresReset: canCreate.requiresReset
        });
      }
      
      // Set default parameters for official channels
      const officialParameters = {
        voteDuration: 7,
        voteDecayDuration: 30,
        minimumQuorum: 50, // Lower minimum for business channels
        minimumUsers: 25,
        chatFilterThreshold: -5, // More lenient for business environments
        ...parameters
      };
      
      const channel = {
        id: `official_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        channelType: 'proximity',
        topicRow: topicRow.trim().toLowerCase(),
        location,
        ownerId,
        createdAt: new Date().toISOString(),
        members: [ownerId],
        memberCount: 1,
        
        // Topic row competition data
        voteCount: 0,
        topicReliabilityScore: 0,
        rankingPosition: null,
        
        // Official channel features
        isOfficialProximityChannel: true,
        verifiedOwnership: {
          verifiedAt: new Date().toISOString(),
          hotspotId: this.generateHotspotId(hotspotData),
          ownershipMethod: 'physical_reset'
        },
        hotspotData: {
          bssid: hotspotData.bssid,
          currentName: hotspotData.name,
          location: hotspotData.location
        },
        wifiSignal: hotspotData,
        canResetViaSignal: true,
        
        // Enhanced official channel features
        officialChannelFeatures: {
          verificationBadge: true,
          enhancedDiscovery: true,
          businessFeatures: true,
          prioritySupport: true
        },
        
        // Governance
        parameters: officialParameters,
        governance: {
          leadership: 'owner',
          ownershipType: 'verified_physical'
        },
        
        // Channel communication
        chatroom: {
          messages: [],
          activeUsers: new Set(),
          moderationEnabled: true,
          filterThreshold: officialParameters.chatFilterThreshold
        },
        feed: {
          posts: [],
          allowedPosters: new Set([ownerId])
        }
      };
      
      // Store channel
      this.channels.set(channel.id, channel);
      this.channelMembers.set(channel.id, new Set([ownerId]));
      this.channelMessages.set(channel.id, []);
      this.channelFeeds.set(channel.id, []);
      
      // Update user-channel mapping
      if (!this.userChannels.has(ownerId)) {
        this.userChannels.set(ownerId, new Set());
      }
      this.userChannels.get(ownerId).add(channel.id);
      
      // Save data
      await this.saveData();
      
      console.log(`Official proximity channel created: ${channel.name} by verified owner ${ownerId}`);
      
      res.status(201).json({
        ...channel,
        chatroom: {
          activeUsers: channel.chatroom.activeUsers.size,
          messageCount: channel.chatroom.messages.length
        },
        isOfficial: true,
        verificationStatus: 'verified_owner'
      });
      
    } catch (error) {
      console.error('Error creating official proximity channel:', error);
      res.status(500).json({ error: 'Failed to create official proximity channel' });
    }
  }
  
  /**
   * Helper method to generate hotspot ID
   */
  generateHotspotId(hotspotData) {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${hotspotData.bssid}-${hotspotData.location.lat}-${hotspotData.location.lng}`)
      .digest('hex')
      .substring(0, 16);
  }
  
  /**
   * Discover channels based on location and other criteria
   */  /**
   * Discover channels with topic row organization and advanced filtering
   */
  async discoverChannels(req, res) {
    try {      const { 
        search = '', 
        topicRow = '', 
        channelType = '', 
        location = '', 
        radius = 1000, 
        minVotes = 0,
        minReliability = 0,
        limit = 20,
        sortBy = 'votes' // votes, reliability, activity
      } = req.query;
      
      let filteredChannels = Array.from(this.channels.values());
      
      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        filteredChannels = filteredChannels.filter(channel => 
          channel.name.toLowerCase().includes(searchLower) ||
          channel.description.toLowerCase().includes(searchLower) ||
          channel.topicRow.includes(searchLower)
        );
      }
        // Filter by topic row
      if (topicRow) {
        filteredChannels = filteredChannels.filter(channel => 
          channel.topicRow === topicRow.toLowerCase()
        );
      }
      
      // Filter by channel type
      if (channelType) {
        filteredChannels = filteredChannels.filter(channel => 
          channel.channelType === channelType
        );
      }
      
      // Filter by minimum votes
      if (minVotes > 0) {
        filteredChannels = filteredChannels.filter(channel => 
          channel.voteCount >= minVotes
        );
      }
      
      // Filter by minimum reliability
      if (minReliability > 0) {
        filteredChannels = filteredChannels.filter(channel => 
          channel.topicReliabilityScore >= minReliability
        );
      }
      
      // Sort channels
      switch (sortBy) {
        case 'votes':
          filteredChannels.sort((a, b) => b.voteCount - a.voteCount);
          break;
        case 'reliability':
          filteredChannels.sort((a, b) => b.topicReliabilityScore - a.topicReliabilityScore);
          break;
        case 'activity':
          // Sort by recent activity (mock implementation)
          filteredChannels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        default:
          filteredChannels.sort((a, b) => b.voteCount - a.voteCount);
      }
        // Organize by topic row if no specific topic row filter
      let organizedResults;
      if (!topicRow) {
        const topicRowGroups = new Map();
        
        filteredChannels.forEach(channel => {
          if (!topicRowGroups.has(channel.topicRow)) {
            topicRowGroups.set(channel.topicRow, []);
          }
          topicRowGroups.get(channel.topicRow).push(channel);
        });
        
        // Sort each topic row group by votes (left-to-right ranking)
        topicRowGroups.forEach(channels => {
          channels.sort((a, b) => b.voteCount - a.voteCount);
        });
        
        organizedResults = Array.from(topicRowGroups.entries()).map(([topic, channels]) => ({
          topicRow: topic,
          channels: channels.slice(0, limit).map(channel => ({
            id: channel.id,
            name: channel.name,
            description: channel.description,
            channelType: channel.channelType,
            voteCount: channel.voteCount,
            rankingPosition: channel.rankingPosition,
            topicReliabilityScore: channel.topicReliabilityScore,
            memberCount: channel.memberCount,
            location: channel.location,
            createdAt: channel.createdAt,
            canVote: true // TODO: Check if user already voted in this topic row
          }))
        }));
      } else {
        // Return channels in specific topic row with ranking
        organizedResults = filteredChannels.slice(0, limit).map(channel => ({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          channelType: channel.channelType,
          voteCount: channel.voteCount,
          rankingPosition: channel.rankingPosition,
          topicReliabilityScore: channel.topicReliabilityScore,
          memberCount: channel.memberCount,
          location: channel.location,
          createdAt: channel.createdAt,
          canVote: true // TODO: Check if user already voted in this topic row
        }));
      }
      
      res.json({ 
        results: organizedResults,
        total: filteredChannels.length,
        filters: {
          search,
          rowTopic,
          channelType,
          minVotes,
          minReliability,
          sortBy
        }
      });
      
    } catch (error) {
      console.error('Error discovering channels:', error);
      res.status(500).json({ error: 'Failed to discover channels' });
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(req, res) {
    try {
      const { channelId } = req.body;
      const userId = req.user?.id || 'anonymous';
      
      // Mock join logic
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (!channel.members.includes(userId)) {
        channel.members.push(userId);
        channel.memberCount = channel.members.length;
        this.channels.set(channelId, channel);
      }
      
      res.json({ message: 'Successfully joined channel', channel });
    } catch (error) {
      console.error('Error joining channel:', error);
      res.status(500).json({ error: 'Failed to join channel' });
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(req, res) {
    try {
      const { channelId } = req.body;
      const userId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      channel.members = channel.members.filter(id => id !== userId);
      channel.memberCount = channel.members.length;
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Successfully left channel' });
    } catch (error) {
      console.error('Error leaving channel:', error);
      res.status(500).json({ error: 'Failed to leave channel' });
    }
  }

  /**
   * Get channel details
   */
  async getChannel(req, res) {
    try {
      const { channelId } = req.params;
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('Error getting channel:', error);
      res.status(500).json({ error: 'Failed to get channel' });
    }
  }

  /**
   * Update channel details
   */
  async updateChannel(req, res) {
    try {
      const { channelId } = req.params;
      const updates = req.body;
      const userId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== userId) {
        return res.status(403).json({ error: 'Only channel owner can update channel' });
      }
      
      Object.assign(channel, updates, { updatedAt: new Date().toISOString() });
      this.channels.set(channelId, channel);
      
      res.json(channel);
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(500).json({ error: 'Failed to update channel' });
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(req, res) {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== userId) {
        return res.status(403).json({ error: 'Only channel owner can delete channel' });
      }
      
      this.channels.delete(channelId);
      
      res.json({ message: 'Channel deleted successfully' });
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ error: 'Failed to delete channel' });
    }
  }

  // Member management methods
  async getMembers(req, res) {
    try {
      const { channelId } = req.params;
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      // Mock member details
      const members = channel.members.map(id => ({
        id,
        username: `user_${id}`,
        role: id === channel.ownerId ? 'owner' : 'member',
        joinedAt: new Date().toISOString()
      }));
      
      res.json({ members });
    } catch (error) {
      console.error('Error getting members:', error);
      res.status(500).json({ error: 'Failed to get members' });
    }
  }

  async addMember(req, res) {
    try {
      const { channelId } = req.params;
      const { userId } = req.body;
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (!channel.members.includes(userId)) {
        channel.members.push(userId);
        channel.memberCount = channel.members.length;
        this.channels.set(channelId, channel);
      }
      
      res.json({ message: 'Member added successfully' });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  }

  async removeMember(req, res) {
    try {
      const { channelId, userId } = req.params;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId && requesterId !== userId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      channel.members = channel.members.filter(id => id !== userId);
      channel.memberCount = channel.members.length;
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }

  async kickMember(req, res) {
    try {
      const { channelId, userId } = req.params;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Only channel owner can kick members' });
      }
      
      channel.members = channel.members.filter(id => id !== userId);
      channel.memberCount = channel.members.length;
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Member kicked successfully' });
    } catch (error) {
      console.error('Error kicking member:', error);
      res.status(500).json({ error: 'Failed to kick member' });
    }
  }

  async banMember(req, res) {
    try {
      const { channelId, userId } = req.params;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Only channel owner can ban members' });
      }
      
      channel.members = channel.members.filter(id => id !== userId);
      channel.memberCount = channel.members.length;
      channel.bannedUsers = channel.bannedUsers || [];
      if (!channel.bannedUsers.includes(userId)) {
        channel.bannedUsers.push(userId);
      }
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Member banned successfully' });
    } catch (error) {
      console.error('Error banning member:', error);
      res.status(500).json({ error: 'Failed to ban member' });
    }
  }

  async promoteMember(req, res) {
    try {
      const { channelId, userId } = req.params;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Only channel owner can promote members' });
      }
      
      channel.moderators = channel.moderators || [];
      if (!channel.moderators.includes(userId)) {
        channel.moderators.push(userId);
      }
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Member promoted successfully' });
    } catch (error) {
      console.error('Error promoting member:', error);
      res.status(500).json({ error: 'Failed to promote member' });
    }
  }

  async demoteMember(req, res) {
    try {
      const { channelId, userId } = req.params;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Only channel owner can demote members' });
      }
      
      channel.moderators = channel.moderators || [];
      channel.moderators = channel.moderators.filter(id => id !== userId);
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Member demoted successfully' });
    } catch (error) {
      console.error('Error demoting member:', error);
      res.status(500).json({ error: 'Failed to demote member' });
    }
  }

  async transferOwnership(req, res) {
    try {
      const { channelId } = req.params;
      const { newOwnerId } = req.body;
      const requesterId = req.user?.id || 'anonymous';
      
      this.channels = this.channels || new Map();
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      if (channel.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Only current owner can transfer ownership' });
      }
      
      if (!channel.members.includes(newOwnerId)) {
        return res.status(400).json({ error: 'New owner must be a channel member' });
      }
      
      channel.ownerId = newOwnerId;
      this.channels.set(channelId, channel);
      
      res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
      console.error('Error transferring ownership:', error);
      res.status(500).json({ error: 'Failed to transfer ownership' });
    }
  }

  async getUserChannels(req, res) {
    try {
      const { userId } = req.params;
      
      this.channels = this.channels || new Map();
      const userChannels = [];
      
      for (const [channelId, channel] of this.channels.entries()) {
        if (channel.members.includes(userId)) {
          userChannels.push({
            id: channelId,
            name: channel.name,
            description: channel.description,
            memberCount: channel.memberCount,
            isOwner: channel.ownerId === userId,
            lastActivity: channel.updatedAt || channel.createdAt
          });
        }
      }
      
      res.json({ channels: userChannels });
    } catch (error) {
      console.error('Error getting user channels:', error);
      res.status(500).json({ error: 'Failed to get user channels' });
    }  }

  // Communication endpoints
  async getMessages(req, res) {
    try {
      const { channelId } = req.params;
      const { limit = 50, before } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify user is member of channel
      const channel = this.channels.get(channelId);
      if (!channel || !channel.members.has(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const messages = await this.getChannelMessages(channelId, { limit, before });
      res.json({ messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  async sendMessage(req, res) {
    try {
      const { channelId } = req.params;
      const { content, type = 'text', replyToId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Verify user is member of channel
      const channel = this.channels.get(channelId);
      if (!channel || !channel.members.has(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = await this.sendChannelMessage(channelId, userId, content, type, replyToId);
      res.json({ message });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async getFeed(req, res) {
    try {
      const { channelId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify user is member of channel
      const channel = this.channels.get(channelId);
      if (!channel || !channel.members.has(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const feed = await this.getChannelFeed(channelId, { limit, offset });
      res.json({ feed });
    } catch (error) {
      console.error('Error getting feed:', error);
      res.status(500).json({ error: 'Failed to get feed' });
    }
  }

  async createFeedPost(req, res) {
    try {
      const { channelId } = req.params;
      const { title, content, type = 'announcement' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify user has permission to post
      const channel = this.channels.get(channelId);
      if (!channel || !channel.members.has(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const post = await this.createChannelFeedPost(channelId, userId, { title, content, type });
      res.json({ post });
    } catch (error) {
      console.error('Error creating feed post:', error);
      res.status(500).json({ error: 'Failed to create feed post' });
    }
  }

  // Helper methods for communication
  async getChannelMessages(channelId, options = {}) {
    const { limit = 50, before } = options;
    const messages = this.messages.get(channelId) || [];
    
    let filteredMessages = messages;
    if (before) {
      const beforeIndex = messages.findIndex(m => m.id === before);
      if (beforeIndex > 0) {
        filteredMessages = messages.slice(0, beforeIndex);
      }
    }
    
    return filteredMessages.slice(-limit).reverse();
  }

  async sendChannelMessage(channelId, userId, content, type = 'text', replyToId = null) {
    const messageData = {
      id: crypto.randomUUID(),
      channelId,
      senderId: userId,
      type,
      content,
      timestamp: Date.now(),
      replyToId,
      reactions: new Map(),
      edited: false
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    
    this.messages.get(channelId).push(messageData);
    
    // Broadcast to channel members
    this.broadcastToChannel(channelId, {
      type: 'new_message',
      message: messageData
    });

    return messageData;
  }

  async getChannelFeed(channelId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const feed = this.feeds.get(channelId) || [];
    return feed.slice(offset, offset + limit);
  }

  async createChannelFeedPost(channelId, userId, postData) {
    const post = {
      id: crypto.randomUUID(),
      channelId,
      authorId: userId,
      ...postData,
      timestamp: Date.now(),
      likes: 0,
      comments: []
    };

    if (!this.feeds.has(channelId)) {
      this.feeds.set(channelId, []);
    }
    
    this.feeds.get(channelId).unshift(post);
    
    // Broadcast to channel members
    this.broadcastToChannel(channelId, {
      type: 'new_feed_post',
      post
    });

    return post;
  }

  // Message reaction methods
  async addReaction(req, res) {
    try {
      const { channelId, messageId } = req.params;
      const { emoji, userId } = req.body;
      
      if (!this.messages[channelId] || !this.messages[channelId][messageId]) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const message = this.messages[channelId][messageId];
      if (!message.reactions) {
        message.reactions = {};
      }
      
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }
      
      if (!message.reactions[emoji].includes(userId)) {
        message.reactions[emoji].push(userId);
      }
      
      res.json({ success: true, reactions: message.reactions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async removeReaction(req, res) {
    try {
      const { channelId, messageId, emoji } = req.params;
      const { userId } = req.body;
      
      if (!this.messages[channelId] || !this.messages[channelId][messageId]) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const message = this.messages[channelId][messageId];
      if (message.reactions && message.reactions[emoji]) {
        message.reactions[emoji] = message.reactions[emoji].filter(id => id !== userId);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      }
      
      res.json({ success: true, reactions: message.reactions || {} });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReactions(req, res) {
    try {
      const { channelId, messageId } = req.params;
      
      if (!this.messages[channelId] || !this.messages[channelId][messageId]) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const message = this.messages[channelId][messageId];
      res.json({ reactions: message.reactions || {} });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Message threading methods
  async addReply(req, res) {
    try {
      const { channelId, messageId } = req.params;
      const { content, userId } = req.body;
      
      if (!this.messages[channelId] || !this.messages[channelId][messageId]) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const message = this.messages[channelId][messageId];
      if (!message.replies) {
        message.replies = [];
      }
      
      const reply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        userId,
        timestamp: new Date().toISOString()
      };
      
      message.replies.push(reply);
      res.json({ success: true, reply });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMessageReplies(req, res) {
    try {
      const { channelId, messageId } = req.params;
      
      if (!this.messages[channelId] || !this.messages[channelId][messageId]) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const message = this.messages[channelId][messageId];
      res.json({ replies: message.replies || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchMessages(req, res) {
    try {
      const { channelId } = req.params;
      const { query, limit = 50 } = req.query;
      
      if (!this.messages[channelId]) {
        return res.json({ messages: [] });
      }
      
      const messages = Object.values(this.messages[channelId]);
      const filteredMessages = query 
        ? messages.filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
        : messages;
      
      const limitedMessages = filteredMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      res.json({ messages: limitedMessages });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Encounter history methods
  async getUserEncounters(req, res) {
    try {
      const { userId } = req.params;
      const encounters = this.encounters.get(userId) || [];
      res.json(encounters);
    } catch (error) {
      console.error('Error fetching user encounters:', error);
      res.status(500).json({ error: 'Failed to fetch encounters' });
    }
  }

  async searchEncountersByLocation(req, res) {
    try {
      const { userId } = req.params;
      const { lat, lng, radius = 1000 } = req.query;
      const userEncounters = this.encounters.get(userId) || [];
      
      // Simple distance-based filtering (stub implementation)
      const filteredEncounters = userEncounters.filter(encounter => {
        if (!encounter.location) return false;
        const distance = this.calculateDistance(
          { lat: parseFloat(lat), lng: parseFloat(lng) },
          encounter.location
        );
        return distance <= parseFloat(radius);
      });
      
      res.json(filteredEncounters);
    } catch (error) {
      console.error('Error searching encounters by location:', error);
      res.status(500).json({ error: 'Failed to search encounters' });
    }
  }

  async getChannelEncounterStats(req, res) {
    try {
      const { channelId } = req.params;
      const channel = this.channels.get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      const stats = {
        totalEncounters: 0,
        uniqueUsers: new Set(),
        lastEncounter: null
      };

      // Calculate stats from all encounters
      for (const [userId, encounters] of this.encounters.entries()) {
        const channelEncounters = encounters.filter(e => e.channelId === channelId);
        stats.totalEncounters += channelEncounters.length;
        if (channelEncounters.length > 0) {
          stats.uniqueUsers.add(userId);
          const latest = channelEncounters.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          if (!stats.lastEncounter || new Date(latest.timestamp) > new Date(stats.lastEncounter)) {
            stats.lastEncounter = latest.timestamp;
          }
        }
      }

      stats.uniqueUsers = stats.uniqueUsers.size;
      res.json(stats);
    } catch (error) {
      console.error('Error getting channel encounter stats:', error);
      res.status(500).json({ error: 'Failed to get encounter stats' });
    }
  }

  async getReadOnlyChannelAccess(req, res) {
    try {
      const { channelId, userId } = req.params;
      const channel = this.channels.get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Grant read-only access (stub implementation)
      const accessToken = `readonly-${channelId}-${userId}-${Date.now()}`;
      res.json({
        accessToken,
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    } catch (error) {
      console.error('Error getting read-only access:', error);
      res.status(500).json({ error: 'Failed to get read-only access' });
    }
  }

  // Encounter recording method
  async recordEncounter(req, res) {
    try {
      const { userId, targetUserId, location, signal, timestamp } = req.body;
      
      const encounter = {
        id: Date.now().toString(),
        userId,
        targetUserId,
        location,
        signal,
        timestamp: timestamp || new Date().toISOString()
      };

      if (!this.encounters.has(userId)) {
        this.encounters.set(userId, []);
      }
      this.encounters.get(userId).push(encounter);

      res.json({ success: true, encounter });
    } catch (error) {
      console.error('Error recording encounter:', error);
      res.status(500).json({ error: 'Failed to record encounter' });
    }
  }

  // Content voting methods
  async voteOnContent(req, res) {
    try {
      const { channelId, contentId } = req.params;
      const { userId, voteType } = req.body;

      if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ error: 'Invalid vote type' });
      }

      const voteKey = `${channelId}-${contentId}`;
      if (!this.votes.has(voteKey)) {
        this.votes.set(voteKey, { upvotes: 0, downvotes: 0, voters: new Set() });
      }

      const votes = this.votes.get(voteKey);
      
      // Remove previous vote if exists
      if (votes.voters.has(userId)) {
        // For simplicity, assume we track the vote type somewhere
        votes.upvotes = Math.max(0, votes.upvotes - 0.5);
        votes.downvotes = Math.max(0, votes.downvotes - 0.5);
      }

      // Add new vote
      if (voteType === 'upvote') {
        votes.upvotes++;
      } else {
        votes.downvotes++;
      }
      votes.voters.add(userId);

      res.json({ success: true, votes: { upvotes: votes.upvotes, downvotes: votes.downvotes } });
    } catch (error) {
      console.error('Error voting on content:', error);
      res.status(500).json({ error: 'Failed to vote on content' });
    }
  }

  async getContentVotes(req, res) {
    try {
      const { channelId, contentId } = req.params;
      const voteKey = `${channelId}-${contentId}`;
      
      const votes = this.votes.get(voteKey) || { upvotes: 0, downvotes: 0, voters: new Set() };
      
      res.json({
        upvotes: votes.upvotes,
        downvotes: votes.downvotes,
        total: votes.upvotes + votes.downvotes
      });
    } catch (error) {
      console.error('Error getting content votes:', error);
      res.status(500).json({ error: 'Failed to get content votes' });
    }
  }

  async getTrendingContent(req, res) {
    try {
      const { channelId } = req.params;
      const { timeWindow = '24h' } = req.query;

      // Mock trending content calculation
      const content = Array.from(this.votes.entries())
        .filter(([key]) => key.startsWith(channelId))
        .map(([key, votes]) => ({
          contentId: key.split('-')[1],
          score: votes.upvotes - votes.downvotes,
          engagement: votes.upvotes + votes.downvotes
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      res.json({ trending: content });
    } catch (error) {
      console.error('Error getting trending content:', error);
      res.status(500).json({ error: 'Failed to get trending content' });
    }
  }

  async getContentRanking(req, res) {
    try {
      const { channelId } = req.params;
      const { sortBy = 'wilson' } = req.query;

      const content = Array.from(this.votes.entries())
        .filter(([key]) => key.startsWith(channelId))
        .map(([key, votes]) => {
          const contentId = key.split('-')[1];
          const wilsonScore = this.calculateWilsonScore(votes.upvotes, votes.downvotes);
          
          return {
            contentId,
            upvotes: votes.upvotes,
            downvotes: votes.downvotes,
            wilsonScore,
            rawScore: votes.upvotes - votes.downvotes
          };
        })
        .sort((a, b) => {
          if (sortBy === 'wilson') return b.wilsonScore - a.wilsonScore;
          if (sortBy === 'raw') return b.rawScore - a.rawScore;
          return b.upvotes - a.upvotes;
        });

      res.json({ ranking: content });
    } catch (error) {
      console.error('Error getting content ranking:', error);
      res.status(500).json({ error: 'Failed to get content ranking' });
    }
  }

  async searchContent(req, res) {
    try {
      const { query, minScore, sortBy = 'relevance' } = req.query;

      // Mock content search
      const results = Array.from(this.votes.entries())
        .map(([key, votes]) => {
          const [channelId, contentId] = key.split('-');
          const score = votes.upvotes - votes.downvotes;
          
          return {
            channelId,
            contentId,
            score,
            wilsonScore: this.calculateWilsonScore(votes.upvotes, votes.downvotes)
          };
        })
        .filter(item => !minScore || item.score >= parseInt(minScore))
        .sort((a, b) => b.score - a.score);

      res.json({ results });
    } catch (error) {
      console.error('Error searching content:', error);
      res.status(500).json({ error: 'Failed to search content' });
    }
  }

  async getUserVoteStats(req, res) {
    try {
      const { userId } = req.params;

      // Mock user vote statistics
      let totalVotes = 0;
      let upvotesGiven = 0;
      let downvotesGiven = 0;

      for (const [, votes] of this.votes) {
        if (votes.voters.has(userId)) {
          totalVotes++;
          // For simplicity, assume equal distribution
          upvotesGiven += 0.5;
          downvotesGiven += 0.5;
        }
      }

      res.json({
        userId,
        totalVotes,
        upvotesGiven: Math.round(upvotesGiven),
        downvotesGiven: Math.round(downvotesGiven)
      });
    } catch (error) {
      console.error('Error getting user vote stats:', error);
      res.status(500).json({ error: 'Failed to get user vote stats' });
    }
  }

  async validateMessageOwnership(req, res) {
    try {
      const { channelId } = req.params;
      const { messageId, userId } = req.body;

      // Mock ownership validation
      const messages = this.messages.get(channelId) || [];
      const message = messages.find(m => m.id === messageId);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const isOwner = message.userId === userId;
      res.json({ isOwner, messageId, userId });
    } catch (error) {
      console.error('Error validating message ownership:', error);
      res.status(500).json({ error: 'Failed to validate message ownership' });
    }
  }

  /**
   * Vote for a channel in its topic row (one vote per user per topic row)
   */
  async voteForChannel(req, res) {
    try {
      const { channelId } = req.params;
      const { userId, voteTokens = 1 } = req.body;
      
      if (!userId || !channelId) {
        return res.status(400).json({ error: 'User ID and Channel ID are required' });
      }
      
      const channel = this.channels.get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      // Initialize voting structures if needed
      if (!this.channelVotes) {
        this.channelVotes = new Map(); // rowTopic -> Map(userId -> {channelId, voteCount, timestamp})
      }
        if (!this.userTopicRowVotes) {
        this.userTopicRowVotes = new Map(); // userId -> Map(topicRow -> channelId)
      }
      
      const topicRow = channel.topicRow;
      
      // Check if user already voted in this topic row
      if (!this.userTopicRowVotes.has(userId)) {
        this.userTopicRowVotes.set(userId, new Map());
      }
      
      const userVotes = this.userTopicRowVotes.get(userId);
      const previousVote = userVotes.get(topicRow);
      
      if (previousVote && previousVote !== channelId) {
        // User is switching votes within the topic row
        const previousChannel = this.channels.get(previousVote);
        if (previousChannel) {
          previousChannel.voteCount = Math.max(0, previousChannel.voteCount - 1);
        }
      } else if (previousVote === channelId) {
        return res.status(400).json({ error: 'User has already voted for this channel' });
      }
      
      // Record the vote
      userVotes.set(topicRow, channelId);
      channel.voteCount += voteTokens;
      
      if (!this.channelVotes.has(rowTopic)) {
        this.channelVotes.set(rowTopic, new Map());
      }
      
      this.channelVotes.get(rowTopic).set(userId, {
        channelId,
        voteCount: voteTokens,
        timestamp: Date.now()
      });
      
      // Update topic row rankings
      await this.updateTopicRowRankings(topicRow);
      
      // Save data
      await this.saveData();
      
      // Broadcast ranking update
      this.broadcastToRowTopic(rowTopic, {
        type: 'channel-vote-update',
        channelId,
        newVoteCount: channel.voteCount,
        rankings: await this.getTopicRowRankings(rowTopic)
      });
      
      res.json({
        success: true,
        channelId,
        newVoteCount: channel.voteCount,
        rankingPosition: channel.rankingPosition,
        previousVote: previousVote || null
      });
      
    } catch (error) {
      console.error('Error voting for channel:', error);
      res.status(500).json({ error: 'Failed to vote for channel' });
    }
  }

  /**
   * Update rankings for all channels in a topic row
   */  async updateTopicRowRankings(topicRow) {
    try {
      if (!this.topicRows.has(topicRow)) {
        return;      }
      
      const channelIds = this.topicRows.get(topicRow);
      const channelsWithVotes = channelIds
        .map(id => this.channels.get(id))
        .filter(Boolean)
        .sort((a, b) => b.voteCount - a.voteCount); // Sort by vote count, highest first
      
      // Update ranking positions (1 = leftmost/highest)
      channelsWithVotes.forEach((channel, index) => {
        channel.rankingPosition = index + 1;
      });
      
      // Update the topic row array with the new order
      this.topicRows.set(topicRow, channelsWithVotes.map(c => c.id));
      
    } catch (error) {
      console.error('Error updating topic row rankings:', error);
    }
  }
  /**
   * Get current rankings for a topic row
   */
  async getTopicRowRankings(topicRow) {
    try {
      if (!this.rowTopics.has(rowTopic)) {
        return [];
      }
      
      const channelIds = this.rowTopics.get(rowTopic);
      return channelIds
        .map(id => this.channels.get(id))
        .filter(Boolean)
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          voteCount: channel.voteCount,
          rankingPosition: channel.rankingPosition,
          channelType: channel.channelType,
          location: channel.location
        }));
        
    } catch (error) {
      console.error('Error getting topic row rankings:', error);
      return [];
    }
  }

  /**
   * Broadcast message to all users interested in a topic row
   */
  broadcastToRowTopic(rowTopic, message) {
    try {
      // Find all users who have voted in this topic row or are members of channels in it
      const interestedUsers = new Set();
      
      if (this.userRowTopicVotes) {
        for (const [userId, userVotes] of this.userRowTopicVotes) {
          if (userVotes.has(rowTopic)) {
            interestedUsers.add(userId);
          }
        }
      }
      
      // Add channel members
      if (this.rowTopics.has(rowTopic)) {
        for (const channelId of this.rowTopics.get(rowTopic)) {
          const channel = this.channels.get(channelId);
          if (channel) {
            channel.members.forEach(userId => interestedUsers.add(userId));
          }
        }
      }
      
      // Send to connected users
      for (const userId of interestedUsers) {
        const connection = this.connections.get(userId);
        if (connection && connection.readyState === 1) {
          connection.send(JSON.stringify(message));
        }
      }
      
    } catch (error) {
      console.error('Error broadcasting to topic row:', error);
    }
  }

  /**
   * Migrate proximity channel to regional channel (called during hotspot reset)
   */
  async migrateProximityToRegional(channelId, migrationData) {
    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      if (channel.channelType !== 'proximity') {
        throw new Error('Can only migrate proximity channels');
      }
      
      // Update channel to regional type
      const migratedChannel = {
        ...channel,
        channelType: 'regional',
        originalType: 'proximity',
        migrationInfo: {
          migrationId: migrationData.migrationId,
          migratedAt: migrationData.migratedAt,
          migrationReason: migrationData.migrationReason,
          originalHotspot: migrationData.locationData.originalHotspotName,
          preservedFromProximity: true
        },
        locationInfo: {
          ...migrationData.locationData,
          isFormerProximityChannel: true
        },
        proximityBinding: null, // Remove proximity binding
        regionalBinding: {
          region: migrationData.locationData.region || 'default',
          gpsReference: migrationData.locationData.gpsCoordinates,
          locationDescription: migrationData.locationData.locationDescription
        },
        wifiSignal: null, // Remove WiFi signal binding
        canResetViaSignal: false,
        migrationNotices: {
          memberNotificationSent: false,
          creatorNotificationSent: false
        }
      };
      
      // Update the channel
      this.channels.set(channelId, migratedChannel);
      
      // Notify all channel members about the migration
      await this.notifyChannelMembersOfMigration(channelId, migrationData);
      
      // Save the updated data
      await this.saveData();
      
      console.log(`Channel ${channelId} migrated from proximity to regional due to hotspot reset`);
      
      return migratedChannel;
      
    } catch (error) {
      console.error('Error migrating channel:', error);
      throw error;
    }
  }
  
  /**
   * Notify channel members about migration
   */
  async notifyChannelMembersOfMigration(channelId, migrationData) {
    try {
      const channel = this.channels.get(channelId);
      const members = this.channelMembers.get(channelId) || new Set();
      
      for (const memberId of members) {
        // Send notification to each member
        if (this.connections.has(memberId)) {
          const ws = this.connections.get(memberId);
          const notification = {
            type: 'channel_migrated',
            channelId,
            channelName: channel.name,
            migrationData,
            message: 'This proximity channel has been migrated to a regional channel due to hotspot ownership reset.',
            timestamp: new Date().toISOString()
          };
          
          try {
            ws.send(JSON.stringify(notification));
          } catch (wsError) {
            console.error('Failed to send migration notification to user:', memberId, wsError);
          }
        }
      }
      
      // Mark notifications as sent
      const updatedChannel = this.channels.get(channelId);
      if (updatedChannel && updatedChannel.migrationNotices) {
        updatedChannel.migrationNotices.memberNotificationSent = true;
        this.channels.set(channelId, updatedChannel);
      }
      
    } catch (error) {
      console.error('Error notifying channel members of migration:', error);
    }
  }
  
  /**
   * Get channels by hotspot ID (for proximity ownership reset service)
   */
  async getChannelsByHotspot(hotspotId) {
    try {
      const channels = Array.from(this.channels.values())
        .filter(channel => {
          return channel.channelType === 'proximity' && 
                 channel.hotspotData && 
                 this.generateHotspotId(channel.hotspotData) === hotspotId;
        });
      
      return channels;
    } catch (error) {
      console.error('Error getting channels by hotspot:', error);
      return [];
    }  }
  
  /**
   * Calculate Wilson score confidence interval for better ranking
   * @param {number} upvotes - Number of upvotes
   * @param {number} totalVotes - Total number of votes (upvotes + downvotes)
   * @returns {number} Wilson score
   */
  calculateWilsonScore(upvotes, totalVotes) {
    if (totalVotes === 0) return 0;

    const z = 1.96; // 95% confidence
    const phat = upvotes / totalVotes;
    
    const wilson = (phat + z * z / (2 * totalVotes) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * totalVotes)) / totalVotes)) / (1 + z * z / totalVotes);
    
    return Math.max(0, wilson);
  }
  
  /**
   * Update channel data (for migration and other updates)
   */
  async updateChannel(channelId, updatedData) {
    try {
      const existingChannel = this.channels.get(channelId);
      if (!existingChannel) {
        throw new Error('Channel not found');
      }
      
      const updatedChannel = {
        ...existingChannel,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      this.channels.set(channelId, updatedChannel);
      await this.saveData();
      
      return updatedChannel;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }
}

// Start service if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new ChannelService();
  service.initialize().then(() => {
    service.start();
  }).catch(error => {
    console.error('Failed to start Channel Service:', error);
    process.exit(1);
  });
}

export default ChannelService;
