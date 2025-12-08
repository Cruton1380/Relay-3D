/**
 * Channel Discovery Service
 * 
 * Provides channel discovery, search, and management functionality
 * for finding and joining channels based on various criteria.
 */

import { apiGet, apiPost } from './apiClient.js';

class ChannelDiscoveryService {
  constructor() {
    this.isInitialized = false;
    this.discoveredChannels = new Map();
    this.joinedChannels = new Map();
    this.topicRows = new Map();
    this.proximityChannels = new Map();
    this.searchHistory = [];
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Channel Discovery Service...');
      
      // Load existing data from storage
      await this.loadStoredData();
      
      // Initialize with demo data if empty
      if (this.discoveredChannels.size === 0) {
        await this.initializeDemoData();
      }
      
      this.isInitialized = true;
      console.log('✅ Channel Discovery Service initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Channel Discovery Service initialization failed:', error);
      throw error;
    }
  }

  async loadStoredData() {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('channelDiscoveryData');
      if (stored) {
        const data = JSON.parse(stored);
        this.discoveredChannels = new Map(Object.entries(data.discoveredChannels || {}));
        this.joinedChannels = new Map(Object.entries(data.joinedChannels || {}));
        this.topicRows = new Map(Object.entries(data.topicRows || {}));
        this.proximityChannels = new Map(Object.entries(data.proximityChannels || {}));
        this.searchHistory = data.searchHistory || [];
      }
    } catch (error) {
      console.warn('Failed to load stored channel data:', error);
    }
  }

  async initializeDemoData() {
    // Initialize with demo channels
    const demoChannels = [
      {
        id: 'demo-channel-1',
        name: 'Tech Innovation Hub',
        description: 'Discussing latest technology trends and innovations',
        type: 'global',
        voteCount: 156,
        reliability: 0.92,
        activity: 'high',
        location: 'Global',
        topics: ['technology', 'innovation', 'startups']
      },
      {
        id: 'demo-channel-2',
        name: 'Local Community Forum',
        description: 'Local community discussions and events',
        type: 'proximity',
        voteCount: 89,
        reliability: 0.88,
        activity: 'medium',
        location: 'Local',
        topics: ['community', 'local', 'events']
      },
      {
        id: 'demo-channel-3',
        name: 'Environmental Action',
        description: 'Environmental protection and sustainability',
        type: 'regional',
        voteCount: 234,
        reliability: 0.95,
        activity: 'high',
        location: 'Regional',
        topics: ['environment', 'sustainability', 'climate']
      },
      {
        id: 'demo-channel-4',
        name: 'Creative Arts Collective',
        description: 'Artists and creators sharing their work',
        type: 'global',
        voteCount: 67,
        reliability: 0.85,
        activity: 'medium',
        location: 'Global',
        topics: ['art', 'creativity', 'culture']
      },
      {
        id: 'demo-channel-5',
        name: 'Health & Wellness',
        description: 'Health tips and wellness discussions',
        type: 'proximity',
        voteCount: 123,
        reliability: 0.90,
        activity: 'high',
        location: 'Local',
        topics: ['health', 'wellness', 'fitness']
      }
    ];

    // Add demo channels to discovered channels
    demoChannels.forEach(channel => {
      this.discoveredChannels.set(channel.id, {
        ...channel,
        discoveredAt: Date.now(),
        lastActivity: Date.now() - Math.random() * 86400000 // Random time within last 24h
      });
    });

    // Initialize topic rows
    const topics = ['technology', 'community', 'environment', 'art', 'health'];
    topics.forEach(topic => {
      this.topicRows.set(topic, {
        topic,
        channels: demoChannels.filter(ch => ch.topics.includes(topic)),
        voteCount: demoChannels.filter(ch => ch.topics.includes(topic))
          .reduce((sum, ch) => sum + ch.voteCount, 0)
      });
    });

    // Save demo data
    this.saveStoredData();
  }

  async discoverChannels(criteria = {}) {
    try {
      console.log('🔍 Discovering channels with criteria:', criteria);
      
      const {
        search = '',
        channelType = '',
        minVotes = 0,
        minReliability = 0,
        sortBy = 'activity',
        limit = 20
      } = criteria;

      // Filter discovered channels based on criteria
      let filteredChannels = Array.from(this.discoveredChannels.values());

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredChannels = filteredChannels.filter(channel =>
          channel.name.toLowerCase().includes(searchLower) ||
          channel.description.toLowerCase().includes(searchLower) ||
          channel.topics.some(topic => topic.toLowerCase().includes(searchLower))
        );
      }

      // Apply channel type filter
      if (channelType && channelType !== 'all') {
        filteredChannels = filteredChannels.filter(channel => channel.type === channelType);
      }

      // Apply vote count filter
      if (minVotes > 0) {
        filteredChannels = filteredChannels.filter(channel => channel.voteCount >= minVotes);
      }

      // Apply reliability filter
      if (minReliability > 0) {
        filteredChannels = filteredChannels.filter(channel => channel.reliability >= minReliability);
      }

      // Sort channels
      filteredChannels.sort((a, b) => {
        switch (sortBy) {
          case 'votes':
            return b.voteCount - a.voteCount;
          case 'reliability':
            return b.reliability - a.reliability;
          case 'alphabetical':
            return a.name.localeCompare(b.name);
          case 'activity':
          default:
            return b.lastActivity - a.lastActivity;
        }
      });

      // Apply limit
      filteredChannels = filteredChannels.slice(0, limit);

      // Add to search history
      this.searchHistory.push({
        criteria,
        results: filteredChannels.length,
        timestamp: Date.now()
      });

      // Keep only last 50 searches
      if (this.searchHistory.length > 50) {
        this.searchHistory = this.searchHistory.slice(-50);
      }

      console.log(`✅ Discovered ${filteredChannels.length} channels`);
      return {
        channels: filteredChannels,
        total: this.discoveredChannels.size,
        filtered: filteredChannels.length
      };

    } catch (error) {
      console.error('❌ Channel discovery failed:', error);
      throw error;
    }
  }

  async discoverGlobalChannels() {
    return this.discoverChannels({
      channelType: 'global',
      sortBy: 'votes',
      limit: 10
    });
  }

  async discoverProximityChannels() {
    return this.discoverChannels({
      channelType: 'proximity',
      sortBy: 'activity',
      limit: 10
    });
  }

  async joinChannel(channelId, joinData = {}) {
    try {
      console.log('🔗 Joining channel:', channelId);
      
      const channel = this.discoveredChannels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      // Add to joined channels
      this.joinedChannels.set(channelId, {
        ...channel,
        joinedAt: Date.now(),
        joinMethod: joinData.joinMethod || 'discovery',
        lastActivity: Date.now()
      });

      // Update channel activity
      channel.lastActivity = Date.now();
      this.discoveredChannels.set(channelId, channel);

      // Save data
      this.saveStoredData();

      console.log('✅ Successfully joined channel:', channelId);
      return {
        success: true,
        channelId,
        channel: this.joinedChannels.get(channelId)
      };

    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async leaveChannel(channelId) {
    try {
      console.log('🚪 Leaving channel:', channelId);
      
      this.joinedChannels.delete(channelId);
      this.saveStoredData();

      console.log('✅ Successfully left channel:', channelId);
      return { success: true, channelId };

    } catch (error) {
      console.error('❌ Failed to leave channel:', error);
      return { success: false, error: error.message };
    }
  }

  getJoinedChannels() {
    return Array.from(this.joinedChannels.values());
  }

  getTopicRows() {
    return Array.from(this.topicRows.values());
  }

  getProximityChannels() {
    return Array.from(this.proximityChannels.values());
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  async searchChannels(query, options = {}) {
    return this.discoverChannels({
      search: query,
      ...options
    });
  }

  async getChannelDetails(channelId) {
    const channel = this.discoveredChannels.get(channelId) || this.joinedChannels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    return channel;
  }

  async updateChannelActivity(channelId) {
    const channel = this.discoveredChannels.get(channelId);
    if (channel) {
      channel.lastActivity = Date.now();
      this.discoveredChannels.set(channelId, channel);
      this.saveStoredData();
    }
  }

  saveStoredData() {
    try {
      const data = {
        discoveredChannels: Object.fromEntries(this.discoveredChannels),
        joinedChannels: Object.fromEntries(this.joinedChannels),
        topicRows: Object.fromEntries(this.topicRows),
        proximityChannels: Object.fromEntries(this.proximityChannels),
        searchHistory: this.searchHistory
      };
      localStorage.setItem('channelDiscoveryData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save channel discovery data:', error);
    }
  }

  reset() {
    this.discoveredChannels.clear();
    this.joinedChannels.clear();
    this.topicRows.clear();
    this.proximityChannels.clear();
    this.searchHistory = [];
    localStorage.removeItem('channelDiscoveryData');
    this.isInitialized = false;
  }
}

// Export singleton instance
const channelDiscoveryService = new ChannelDiscoveryService();
export default channelDiscoveryService; 