/**
 * Channel data utilities with enhanced caching and deduplication
 */

import { DEBUG_CONFIG } from '../constants.js';

// Multi-level cache system
const channelCache = {
  channels: new Map(),
  lastFetch: 0,
  isLoading: false
};

const CACHE_DURATION = 30000; // 30 seconds
const FETCH_COOLDOWN = 1000; // 1 second between fetches

export const channelUtils = {
  
  /**
   * Clear the channel cache (useful after creating/deleting channels)
   */
  clearCache() {
    channelCache.channels.clear();
    channelCache.lastFetch = 0;
    if (DEBUG_CONFIG.CHANNELS) {
      console.log('🧹 Channel cache cleared');
    }
  },
  
  /**
   * Fetch channels with smart caching and deduplication
   */
  async fetchChannels(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached data if fresh
    if (!forceRefresh && 
        channelCache.channels.size > 0 && 
        (now - channelCache.lastFetch) < CACHE_DURATION) {
      
      if (DEBUG_CONFIG.CHANNELS) {
        console.log(`📦 Using cached channels (${channelCache.channels.size} items)`);
      }
      return Array.from(channelCache.channels.values());
    }
    
    // Prevent multiple simultaneous fetches
    if (channelCache.isLoading) {
      if (DEBUG_CONFIG.CHANNELS) {
        console.log('⏳ Channel fetch already in progress, waiting...');
      }
      
      // Wait for current fetch to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!channelCache.isLoading) {
            clearInterval(checkInterval);
            resolve(Array.from(channelCache.channels.values()));
          }
        }, 100);
      });
    }
    
    // Respect fetch cooldown
    const timeSinceLastFetch = now - channelCache.lastFetch;
    if (timeSinceLastFetch < FETCH_COOLDOWN) {
      if (DEBUG_CONFIG.CHANNELS) {
        console.log(`⏱️ Fetch cooldown active (${FETCH_COOLDOWN - timeSinceLastFetch}ms remaining)`);
      }
      return Array.from(channelCache.channels.values());
    }
    
    channelCache.isLoading = true;
    
    try {
      if (DEBUG_CONFIG.CHANNELS) {
        console.log('📡 Fetching fresh channel data...');
      }
      
      // Use regular channels API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";
      const response = await fetch(`${apiBaseUrl}/api/channels`);
      if (!response.ok) {
        throw new Error(`Channel fetch failed: ${response.status} ${response.statusText}`);
      }
      const rawData = await response.json();
      if (DEBUG_CONFIG.CHANNELS) {
        console.log('📡 Using regular channels API');
      }
      
      const channels = Array.isArray(rawData) ? rawData : (rawData.channels || []);
      
      // Deduplicate and validate channels
      const deduplicatedChannels = this.deduplicateChannels(channels);
      
      // Update cache
      channelCache.channels.clear();
      deduplicatedChannels.forEach(channel => {
        channelCache.channels.set(channel.id, channel);
      });
      
      channelCache.lastFetch = now;
      
      if (DEBUG_CONFIG.CHANNELS) {
        console.log(`✅ Channel data updated: ${deduplicatedChannels.length} unique channels`);
      }
      
      return deduplicatedChannels;
      
    } catch (error) {
      console.error('❌ Channel fetch failed:', error);
      
      // Return cached data if available
      if (channelCache.channels.size > 0) {
        if (DEBUG_CONFIG.CHANNELS) {
          console.log('🔄 Falling back to cached channel data');
        }
        return Array.from(channelCache.channels.values());
      }
      
      return [];
    } finally {
      channelCache.isLoading = false;
    }
  },
  
  /**
   * Deduplicate channels by ID with merge strategy
   */
  deduplicateChannels(channels) {
    const uniqueChannels = new Map();
    
    channels.forEach((channel, index) => {
      if (!channel) return;
      
      // Generate a unique ID if missing
      const channelId = channel.id || `channel-${index}-${Date.now()}`;
      
      const existingChannel = uniqueChannels.get(channelId);
      
      if (!existingChannel) {
        // First occurrence - ensure channel has an ID
        const validatedChannel = this.validateChannel(channel);
        validatedChannel.id = channelId; // Ensure ID is set
        uniqueChannels.set(channelId, validatedChannel);
      } else {
        // Merge with existing (prefer newer data)
        const mergedChannel = this.mergeChannels(existingChannel, channel);
        mergedChannel.id = channelId; // Ensure ID is set
        uniqueChannels.set(channelId, mergedChannel);
      }
    });
    
    const result = Array.from(uniqueChannels.values());
    
    if (DEBUG_CONFIG.CHANNELS && channels.length !== result.length) {
      console.log(`🧹 Deduplicated channels: ${channels.length} → ${result.length}`);
    }
    
    return result;
  },
  
  /**
   * Validate and sanitize channel data
   */
  validateChannel(channel) {
    return {
      id: channel.id,
      name: channel.name || `Channel ${channel.id}`,
      description: channel.description || '',
      location: this.validateLocation(channel.location),
      candidates: channel.candidates || [], // Preserve candidates array
      metadata: channel.metadata || {},
      timestamp: channel.timestamp || Date.now(),
      votes: this.validateVotes(channel.votes),
      // Preserve any other fields that might be needed
      category: channel.category,
      type: channel.type,
      country: channel.country,
      region: channel.region,
      createdAt: channel.createdAt,
      coordinates: channel.coordinates
    };
  },
  
  /**
   * Validate location data
   */
  validateLocation(location) {
    if (!location) return { lat: 0, lng: 0, alt: 0 };
    
    return {
      lat: this.clampNumber(location.lat, -90, 90),
      lng: this.clampNumber(location.lng, -180, 180),
      alt: Math.max(0, location.alt || 0)
    };
  },
  
  /**
   * Validate vote data
   */
  validateVotes(votes) {
    if (typeof votes !== 'number') return 0;
    return Math.max(0, Math.floor(votes));
  },
  
  /**
   * Merge two channel objects (prefer newer data)
   */
  mergeChannels(existing, incoming) {
    const existingTime = existing.timestamp || 0;
    const incomingTime = incoming.timestamp || 0;
    
    // Use newer timestamp as source of truth
    const primary = incomingTime > existingTime ? incoming : existing;
    const secondary = incomingTime > existingTime ? existing : incoming;
    
    return {
      ...secondary,
      ...primary,
      // Always use the higher vote count
      votes: Math.max(existing.votes || 0, incoming.votes || 0)
    };
  },
  
  /**
   * Utility: Clamp number to range
   */
  clampNumber(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  },
  
  /**
   * Get single channel by ID
   */
  getChannel(channelId) {
    return channelCache.channels.get(channelId) || null;
  },
  
  /**
   * Update single channel in cache
   */
  updateChannel(channelId, updates) {
    const existing = channelCache.channels.get(channelId);
    if (existing) {
      const updated = { ...existing, ...updates, timestamp: Date.now() };
      channelCache.channels.set(channelId, this.validateChannel(updated));
      
      if (DEBUG_CONFIG.CHANNELS) {
        console.log(`📝 Channel updated: ${channelId}`);
      }
    }
  },
  
  /**
   * Clear cache
   */
  clearCache() {
    channelCache.channels.clear();
    channelCache.lastFetch = 0;
    channelCache.isLoading = false;
    
    if (DEBUG_CONFIG.CHANNELS) {
      console.log('🧹 Channel cache cleared');
    }
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cacheAge = Date.now() - channelCache.lastFetch;
    
    return {
      channelCount: channelCache.channels.size,
      cacheAge: cacheAge,
      isExpired: cacheAge > CACHE_DURATION,
      isLoading: channelCache.isLoading
    };
  }
};
