/**
 * @fileoverview Proximity Channel Encounter Manager
 * Manages real-time proximity channel encounters and access control
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class ProximityEncounterManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'proximity');
    this.encountersFile = path.join(this.dataDir, 'active-encounters.json');
    
    // In-memory storage for fast access
    this.activeEncounters = new Map(); // userId -> Map(channelId -> encounter)
    this.proximityChannels = new Map(); // channelId -> channel state
    this.readOnlyAccess = new Map(); // userId -> Set(channelIds)
    
    this.initialized = false;
  }

  /**
   * Initialize the encounter manager
   */
  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      this.initialized = true;
      console.log('✅ Proximity Encounter Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize proximity encounter manager:', error.message);
      throw error;
    }
  }

  /**
   * Load data from disk
   */
  async loadData() {
    try {
      const data = await fs.readFile(this.encountersFile, 'utf8');
      const parsed = JSON.parse(data);
      
      // Restore Maps from serialized data
      this.activeEncounters = new Map();
      if (parsed.activeEncounters) {
        for (const [userId, encounters] of Object.entries(parsed.activeEncounters)) {
          this.activeEncounters.set(userId, new Map(Object.entries(encounters)));
        }
      }
      
      this.readOnlyAccess = new Map();
      if (parsed.readOnlyAccess) {
        for (const [userId, channelIds] of Object.entries(parsed.readOnlyAccess)) {
          this.readOnlyAccess.set(userId, new Set(channelIds));
        }
      }
    } catch (error) {
      // File doesn't exist yet, start fresh
      console.log('🆕 Starting with fresh proximity encounter data');
    }
  }

  /**
   * Save data to disk
   */
  async saveData() {
    try {
      const data = {
        activeEncounters: {},
        readOnlyAccess: {},
        lastSaved: Date.now()
      };
      
      // Convert Maps to plain objects for JSON serialization
      for (const [userId, encounters] of this.activeEncounters) {
        data.activeEncounters[userId] = Object.fromEntries(encounters);
      }
      
      for (const [userId, channelIds] of this.readOnlyAccess) {
        data.readOnlyAccess[userId] = Array.from(channelIds);
      }
      
      await fs.writeFile(this.encountersFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save proximity encounter data:', error.message);
    }
  }

  /**
   * Record a new proximity channel encounter
   */
  recordEncounter(userId, channelId, signalData) {
    if (!this.initialized) throw new Error('Manager not initialized');
    
    const timestamp = Date.now();
    
    // Initialize user encounters if needed
    if (!this.activeEncounters.has(userId)) {
      this.activeEncounters.set(userId, new Map());
    }
    
    const userEncounters = this.activeEncounters.get(userId);
    
    const encounter = {
      channelId,
      channelName: signalData.name || signalData.ssid || channelId,
      channelType: signalData.type || 'WiFi',
      signalStrength: signalData.signal || signalData.rssi,
      category: signalData.category || 'General',
      firstEncounter: userEncounters.has(channelId) ? 
        userEncounters.get(channelId).firstEncounter : timestamp,
      lastSeen: timestamp,
      encounterCount: userEncounters.has(channelId) ? 
        userEncounters.get(channelId).encounterCount + 1 : 1,
      isActive: true,
      location: signalData.location || null
    };
    
    userEncounters.set(channelId, encounter);
    
    // Auto-save every 10 encounters
    if (this.getTotalEncounterCount() % 10 === 0) {
      this.saveData();
    }
    
    console.log(`📍 Recorded proximity encounter: User ${userId} → Channel ${channelId}`);
    return encounter;
  }

  /**
   * Mark encounter as ended (user left proximity)
   */
  endEncounter(userId, channelId) {
    if (!this.activeEncounters.has(userId)) return false;
    
    const userEncounters = this.activeEncounters.get(userId);
    if (!userEncounters.has(channelId)) return false;
    
    const encounter = userEncounters.get(channelId);
    encounter.isActive = false;
    encounter.lastSeen = Date.now();
    
    // Move to read-only access
    if (!this.readOnlyAccess.has(userId)) {
      this.readOnlyAccess.set(userId, new Set());
    }
    this.readOnlyAccess.get(userId).add(channelId);
    
    // Remove from active encounters
    userEncounters.delete(channelId);
    
    console.log(`🔚 Ended proximity encounter: User ${userId} → Channel ${channelId}`);
    return true;
  }

  /**
   * Get user's complete encounter history
   */
  getUserEncounterHistory(userId, options = {}) {
    const activeEncounters = this.activeEncounters.get(userId) || new Map();
    const readOnlyChannels = this.readOnlyAccess.get(userId) || new Set();
    
    const history = {
      active: Array.from(activeEncounters.values()),
      historical: Array.from(readOnlyChannels),
      totalEncounters: activeEncounters.size + readOnlyChannels.size
    };
    
    if (options.includeStats) {
      history.stats = this.calculateUserStats(userId);
    }
    
    return history;
  }

  /**
   * Check if user can access channel (read-only or active)
   */
  canAccessChannel(userId, channelId) {
    // Check active encounters
    if (this.activeEncounters.has(userId)) {
      if (this.activeEncounters.get(userId).has(channelId)) {
        return { canAccess: true, accessType: 'active' };
      }
    }
    
    // Check read-only access
    if (this.readOnlyAccess.has(userId)) {
      if (this.readOnlyAccess.get(userId).has(channelId)) {
        return { canAccess: true, accessType: 'readonly' };
      }
    }
    
    return { canAccess: false, accessType: 'none' };
  }

  /**
   * Get channels user has encountered but is no longer in proximity of
   */
  getHistoricalChannels(userId) {
    const readOnlyChannels = this.readOnlyAccess.get(userId) || new Set();
    return Array.from(readOnlyChannels);
  }

  /**
   * Calculate user statistics
   */
  calculateUserStats(userId) {
    const activeEncounters = this.activeEncounters.get(userId) || new Map();
    const readOnlyChannels = this.readOnlyAccess.get(userId) || new Set();
    
    let totalEncounterTime = 0;
    let strongestSignal = 0;
    const categories = new Map();
    
    for (const encounter of activeEncounters.values()) {
      const duration = Date.now() - encounter.firstEncounter;
      totalEncounterTime += duration;
      
      if (encounter.signalStrength > strongestSignal) {
        strongestSignal = encounter.signalStrength;
      }
      
      const category = encounter.category;
      categories.set(category, (categories.get(category) || 0) + 1);
    }
    
    return {
      totalActiveChannels: activeEncounters.size,
      totalHistoricalChannels: readOnlyChannels.size,
      totalEncounterTime,
      averageEncounterTime: activeEncounters.size > 0 ? totalEncounterTime / activeEncounters.size : 0,
      strongestSignal,
      categoriesEncountered: Object.fromEntries(categories)
    };
  }

  /**
   * Get total encounter count across all users
   */
  getTotalEncounterCount() {
    let total = 0;
    for (const userEncounters of this.activeEncounters.values()) {
      total += userEncounters.size;
    }
    return total;
  }

  /**
   * Get all active channels with user counts
   */
  getActiveChannels() {
    const channels = new Map();
    
    for (const [userId, userEncounters] of this.activeEncounters) {
      for (const [channelId, encounter] of userEncounters) {
        if (!channels.has(channelId)) {
          channels.set(channelId, {
            channelId,
            channelName: encounter.channelName,
            channelType: encounter.channelType,
            category: encounter.category,
            activeUsers: new Set(),
            averageSignalStrength: 0
          });
        }
        
        const channel = channels.get(channelId);
        channel.activeUsers.add(userId);
      }
    }
    
    // Convert Sets to counts and calculate averages
    const result = [];
    for (const channel of channels.values()) {
      result.push({
        ...channel,
        activeUserCount: channel.activeUsers.size,
        activeUsers: Array.from(channel.activeUsers)
      });
    }
    
    return result;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    await this.saveData();
    this.initialized = false;
    console.log('🛑 Proximity Encounter Manager shut down');
  }
}

export default ProximityEncounterManager;
