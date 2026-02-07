/**
 * @fileoverview Encounter History System
 * Tracks proximity channel encounters and provides read-only access to past channels
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

const encounterLogger = logger.child({ module: 'encounter-history' });

class EncounterHistoryService {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'encounters');
    this.encountersFile = path.join(this.dataDir, 'encounters.json');
    this.userEncountersFile = path.join(this.dataDir, 'user-encounters.json');
    this.channelArchiveFile = path.join(this.dataDir, 'archived-channels.json');
    
    // In-memory storage for fast access
    this.encounters = new Map(); // encounterId -> encounter data
    this.userEncounters = new Map(); // userId -> Set(encounterIds)
    this.channelEncounters = new Map(); // channelId -> Set(encounterIds)
    this.archivedChannels = new Map(); // channelId -> archived channel data
    
    // Configuration
    this.maxEncounterAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    this.cleanupInterval = 6 * 60 * 60 * 1000; // 6 hours cleanup interval
    
    this.initialized = false;
  }

  /**
   * Initialize the encounter history service
   */
  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      // Start cleanup timer
      this.cleanupTimer = setInterval(() => {
        this.cleanupOldEncounters();
      }, this.cleanupInterval);
      
      this.initialized = true;
      encounterLogger.info('Encounter History Service initialized');
    } catch (error) {
      encounterLogger.error('Failed to initialize encounter history service', { error: error.message });
      throw error;
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    await this.saveData();
    this.initialized = false;
    encounterLogger.info('Encounter History Service shut down');
  }

  /**
   * Record a new channel encounter
   * @param {string} userId - User ID
   * @param {string} channelId - Channel ID
   * @param {Object} channelData - Channel information
   * @param {Object} location - User location during encounter
   * @param {number} duration - How long user was in channel (ms)
   * @param {Object} interaction - Interaction summary (messages sent, reactions, etc.)
   */
  async recordEncounter(userId, channelId, channelData, location, duration = 0, interaction = {}) {
    if (!this.initialized) throw new Error('Encounter history service not initialized');

    try {
      const encounterId = crypto.randomUUID();
      const timestamp = Date.now();
      
      const encounter = {
        id: encounterId,
        userId,
        channelId,
        channelName: channelData.name,
        channelType: channelData.type || 'proximity',
        channelDescription: channelData.description,
        location: {
          latitude: location.lat || location.latitude,
          longitude: location.lon || location.longitude,
          accuracy: location.accuracy || null
        },
        timestamp,
        duration,
        interaction: {
          messagesSent: interaction.messagesSent || 0,
          messagesReceived: interaction.messagesReceived || 0,
          reactionsGiven: interaction.reactionsGiven || 0,
          reactionsReceived: interaction.reactionsReceived || 0,
          repliesSent: interaction.repliesSent || 0,
          repliesReceived: interaction.repliesReceived || 0,
          ...interaction
        },
        metadata: {
          memberCount: channelData.memberCount || 0,
          isOfficial: channelData.isOfficial || false,
          signalStrength: channelData.signalStrength || null,
          distance: channelData.distance || null
        }
      };

      // Store encounter
      this.encounters.set(encounterId, encounter);
      
      // Update user encounters index
      if (!this.userEncounters.has(userId)) {
        this.userEncounters.set(userId, new Set());
      }
      this.userEncounters.get(userId).add(encounterId);
      
      // Update channel encounters index
      if (!this.channelEncounters.has(channelId)) {
        this.channelEncounters.set(channelId, new Set());
      }
      this.channelEncounters.get(channelId).add(encounterId);

      encounterLogger.info('Encounter recorded', {
        encounterId,
        userId,
        channelId,
        channelName: channelData.name,
        duration
      });

      // Archive channel data for future read-only access
      await this.archiveChannelData(channelId, channelData);

      // Save data periodically
      if (this.encounters.size % 10 === 0) {
        await this.saveData();
      }

      return encounter;
    } catch (error) {
      encounterLogger.error('Failed to record encounter', { error: error.message, userId, channelId });
      throw error;
    }
  }

  /**
   * Archive channel data for read-only access
   * @param {string} channelId - Channel ID
   * @param {Object} channelData - Channel data to archive
   */
  async archiveChannelData(channelId, channelData) {
    try {
      const existingArchive = this.archivedChannels.get(channelId);
      
      const archivedChannel = {
        id: channelId,
        name: channelData.name,
        description: channelData.description,
        type: channelData.type,
        createdAt: channelData.createdAt,
        creatorId: channelData.creatorId,
        isOfficial: channelData.isOfficial || false,
        lastActive: Date.now(),
        memberCount: channelData.memberCount || 0,
        totalEncounters: existingArchive ? existingArchive.totalEncounters + 1 : 1,
        firstEncounter: existingArchive ? existingArchive.firstEncounter : Date.now(),
        lastEncounter: Date.now(),
        status: 'archived'
      };

      this.archivedChannels.set(channelId, archivedChannel);
      
      encounterLogger.debug('Channel archived', { channelId, name: channelData.name });
    } catch (error) {
      encounterLogger.error('Failed to archive channel data', { error: error.message, channelId });
    }
  }

  /**
   * Get user's encounter history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of encounters
   */
  getUserEncounters(userId, options = {}) {
    if (!this.initialized) throw new Error('Encounter history service not initialized');

    const {
      limit = 50,
      offset = 0,
      startDate = null,
      endDate = null,
      channelType = null,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    try {
      const userEncounterIds = this.userEncounters.get(userId) || new Set();
      let encounters = Array.from(userEncounterIds)
        .map(id => this.encounters.get(id))
        .filter(Boolean);

      // Apply filters
      if (startDate) {
        encounters = encounters.filter(e => e.timestamp >= startDate);
      }
      if (endDate) {
        encounters = encounters.filter(e => e.timestamp <= endDate);
      }
      if (channelType) {
        encounters = encounters.filter(e => e.channelType === channelType);
      }

      // Sort encounters
      encounters.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Apply pagination
      const paginatedEncounters = encounters.slice(offset, offset + limit);

      return {
        encounters: paginatedEncounters,
        total: encounters.length,
        hasMore: offset + limit < encounters.length
      };
    } catch (error) {
      encounterLogger.error('Failed to get user encounters', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get channel encounter statistics
   * @param {string} channelId - Channel ID
   * @returns {Object} Channel encounter stats
   */
  getChannelEncounterStats(channelId) {
    if (!this.initialized) throw new Error('Encounter history service not initialized');

    try {
      const channelEncounterIds = this.channelEncounters.get(channelId) || new Set();
      const encounters = Array.from(channelEncounterIds)
        .map(id => this.encounters.get(id))
        .filter(Boolean);

      if (encounters.length === 0) {
        return {
          channelId,
          totalEncounters: 0,
          uniqueUsers: 0,
          averageDuration: 0,
          totalDuration: 0,
          firstEncounter: null,
          lastEncounter: null,
          popularTimes: [],
          interactionStats: {
            totalMessages: 0,
            totalReactions: 0,
            totalReplies: 0
          }
        };
      }

      const uniqueUsers = new Set(encounters.map(e => e.userId)).size;
      const totalDuration = encounters.reduce((sum, e) => sum + e.duration, 0);
      const averageDuration = totalDuration / encounters.length;

      // Calculate popular times (hour of day distribution)
      const hourCounts = new Array(24).fill(0);
      encounters.forEach(e => {
        const hour = new Date(e.timestamp).getHours();
        hourCounts[hour]++;
      });

      const popularTimes = hourCounts.map((count, hour) => ({ hour, count }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      // Calculate interaction statistics
      const interactionStats = encounters.reduce((stats, e) => ({
        totalMessages: stats.totalMessages + e.interaction.messagesSent + e.interaction.messagesReceived,
        totalReactions: stats.totalReactions + e.interaction.reactionsGiven + e.interaction.reactionsReceived,
        totalReplies: stats.totalReplies + e.interaction.repliesSent + e.interaction.repliesReceived
      }), { totalMessages: 0, totalReactions: 0, totalReplies: 0 });

      return {
        channelId,
        totalEncounters: encounters.length,
        uniqueUsers,
        averageDuration: Math.round(averageDuration),
        totalDuration,
        firstEncounter: Math.min(...encounters.map(e => e.timestamp)),
        lastEncounter: Math.max(...encounters.map(e => e.timestamp)),
        popularTimes: popularTimes.slice(0, 5), // Top 5 popular hours
        interactionStats
      };
    } catch (error) {
      encounterLogger.error('Failed to get channel encounter stats', { error: error.message, channelId });
      throw error;
    }
  }

  /**
   * Get read-only access to archived channel
   * @param {string} userId - User ID requesting access
   * @param {string} channelId - Channel ID
   * @returns {Object} Read-only channel access data
   */
  async getReadOnlyChannelAccess(userId, channelId) {
    if (!this.initialized) throw new Error('Encounter history service not initialized');

    try {
      // Check if user has encountered this channel
      const userEncounterIds = this.userEncounters.get(userId) || new Set();
      const hasEncountered = Array.from(userEncounterIds)
        .some(id => {
          const encounter = this.encounters.get(id);
          return encounter && encounter.channelId === channelId;
        });

      if (!hasEncountered) {
        throw new Error('No encounter history found for this channel');
      }

      const archivedChannel = this.archivedChannels.get(channelId);
      if (!archivedChannel) {
        throw new Error('Channel archive not found');
      }

      // Get user's encounters with this channel
      const userChannelEncounters = Array.from(userEncounterIds)
        .map(id => this.encounters.get(id))
        .filter(e => e && e.channelId === channelId)
        .sort((a, b) => b.timestamp - a.timestamp);

      return {
        channel: archivedChannel,
        readOnly: true,
        userEncounters: userChannelEncounters,
        accessGranted: Date.now(),
        permissions: {
          canRead: true,
          canWrite: false,
          canReact: false,
          canReply: false,
          canJoin: false
        },
        stats: this.getChannelEncounterStats(channelId)
      };
    } catch (error) {
      encounterLogger.error('Failed to get read-only channel access', { 
        error: error.message, 
        userId, 
        channelId 
      });
      throw error;
    }
  }

  /**
   * Search encounters by location
   * @param {string} userId - User ID
   * @param {Object} location - Search location {lat, lon}
   * @param {number} radius - Search radius in meters
   * @param {Object} options - Additional options
   * @returns {Array} Encounters within radius
   */
  searchEncountersByLocation(userId, location, radius = 1000, options = {}) {
    if (!this.initialized) throw new Error('Encounter history service not initialized');

    try {
      const { limit = 20, channelType = null } = options;
      const userEncounterIds = this.userEncounters.get(userId) || new Set();
      
      let encounters = Array.from(userEncounterIds)
        .map(id => this.encounters.get(id))
        .filter(Boolean);

      // Filter by channel type if specified
      if (channelType) {
        encounters = encounters.filter(e => e.channelType === channelType);
      }

      // Filter by distance
      const nearbyEncounters = encounters.filter(encounter => {
        if (!encounter.location || !encounter.location.latitude || !encounter.location.longitude) {
          return false;
        }

        const distance = this.calculateDistance(
          location,
          {
            lat: encounter.location.latitude,
            lon: encounter.location.longitude
          }
        );

        return distance <= radius;
      }).map(encounter => ({
        ...encounter,
        distance: this.calculateDistance(
          location,
          {
            lat: encounter.location.latitude,
            lon: encounter.location.longitude
          }
        )
      }));

      // Sort by distance and apply limit
      return nearbyEncounters
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
    } catch (error) {
      encounterLogger.error('Failed to search encounters by location', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Calculate distance between two locations using Haversine formula
   * @param {Object} loc1 - {lat, lon}
   * @param {Object} loc2 - {lat, lon}
   * @returns {number} Distance in meters
   */  calculateDistance(loc1, loc2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.lat || loc1.latitude) * Math.PI / 180;
    const φ2 = (loc2.lat || loc2.latitude) * Math.PI / 180;
    const Δφ = ((loc2.lat || loc2.latitude) - (loc1.lat || loc1.latitude)) * Math.PI / 180;
    const Δλ = ((loc2.lon || loc2.longitude) - (loc1.lon || loc1.longitude)) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Clean up old encounters
   */
  async cleanupOldEncounters() {
    if (!this.initialized) return;

    try {
      const cutoffTime = Date.now() - this.maxEncounterAge;
      let removedCount = 0;

      for (const [encounterId, encounter] of this.encounters) {
        if (encounter.timestamp < cutoffTime) {
          // Remove from main storage
          this.encounters.delete(encounterId);
          
          // Remove from user index
          const userEncounters = this.userEncounters.get(encounter.userId);
          if (userEncounters) {
            userEncounters.delete(encounterId);
            if (userEncounters.size === 0) {
              this.userEncounters.delete(encounter.userId);
            }
          }
          
          // Remove from channel index
          const channelEncounters = this.channelEncounters.get(encounter.channelId);
          if (channelEncounters) {
            channelEncounters.delete(encounterId);
            if (channelEncounters.size === 0) {
              this.channelEncounters.delete(encounter.channelId);
            }
          }
          
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await this.saveData();
        encounterLogger.info('Cleaned up old encounters', { removedCount });
      }
    } catch (error) {
      encounterLogger.error('Failed to cleanup old encounters', { error: error.message });
    }
  }

  /**
   * Load data from files
   */
  async loadData() {
    try {
      // Load encounters
      const encountersData = await fs.readFile(this.encountersFile, 'utf8').catch(() => '{}');
      const encounters = JSON.parse(encountersData);
      
      for (const [id, data] of Object.entries(encounters)) {
        this.encounters.set(id, data);
      }

      // Load user encounters index
      const userEncountersData = await fs.readFile(this.userEncountersFile, 'utf8').catch(() => '{}');
      const userEncounters = JSON.parse(userEncountersData);
      
      for (const [userId, encounterIds] of Object.entries(userEncounters)) {
        this.userEncounters.set(userId, new Set(encounterIds));
      }

      // Rebuild channel encounters index
      for (const encounter of this.encounters.values()) {
        if (!this.channelEncounters.has(encounter.channelId)) {
          this.channelEncounters.set(encounter.channelId, new Set());
        }
        this.channelEncounters.get(encounter.channelId).add(encounter.id);
      }

      // Load archived channels
      const archivedData = await fs.readFile(this.channelArchiveFile, 'utf8').catch(() => '{}');
      const archived = JSON.parse(archivedData);
      
      for (const [id, data] of Object.entries(archived)) {
        this.archivedChannels.set(id, data);
      }

      encounterLogger.info('Encounter history data loaded', {
        encounters: this.encounters.size,
        users: this.userEncounters.size,
        archivedChannels: this.archivedChannels.size
      });
    } catch (error) {
      encounterLogger.error('Failed to load encounter history data', { error: error.message });
      throw error;
    }
  }

  /**
   * Save data to files
   */
  async saveData() {
    try {
      // Save encounters
      const encountersObj = Object.fromEntries(this.encounters);
      await fs.writeFile(this.encountersFile, JSON.stringify(encountersObj, null, 2));

      // Save user encounters index
      const userEncountersObj = {};
      for (const [userId, encounterIds] of this.userEncounters) {
        userEncountersObj[userId] = Array.from(encounterIds);
      }
      await fs.writeFile(this.userEncountersFile, JSON.stringify(userEncountersObj, null, 2));

      // Save archived channels
      const archivedObj = Object.fromEntries(this.archivedChannels);
      await fs.writeFile(this.channelArchiveFile, JSON.stringify(archivedObj, null, 2));

      encounterLogger.debug('Encounter history data saved');
    } catch (error) {
      encounterLogger.error('Failed to save encounter history data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getServiceStats() {
    return {
      totalEncounters: this.encounters.size,
      totalUsers: this.userEncounters.size,
      totalChannels: this.channelEncounters.size,
      archivedChannels: this.archivedChannels.size,
      initialized: this.initialized,
      maxEncounterAge: this.maxEncounterAge,
      cleanupInterval: this.cleanupInterval
    };
  }
}

export default new EncounterHistoryService();
