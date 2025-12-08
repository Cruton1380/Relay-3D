/**
 * Enhanced clustering cache system with multi-level caching
 */

import { DEBUG_CONFIG } from '../constants.js';

// Multi-level cache for clustering data
const clusterCache = {
  // Raw channel data by region/level
  channels: new Map(),
  
  // Computed cluster summaries by level and region
  summaries: new Map(),
  
  // Entity rendering cache by viewport
  entities: new Map(),
  
  // Cache metadata
  lastUpdate: 0,
  version: 1
};

const CACHE_DURATION = 60000; // 1 minute
const MAX_CACHE_SIZE = 1000; // Prevent memory bloat

export const clusterUtils = {
  
  /**
   * Get cached cluster data for a specific level and region
   */
  getCachedClusters(level, region = 'global') {
    const key = `${level}-${region}`;
    const cached = clusterCache.summaries.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      if (DEBUG_CONFIG.CLUSTERING) {
        console.log(`📦 Using cached clusters: ${key} (${cached.clusters.length} items)`);
      }
      return cached.clusters;
    }
    
    return null;
  },
  
  /**
   * Store cluster data in cache
   */
  setCachedClusters(level, region, clusters) {
    const key = `${level}-${region}`;
    
    // Limit cache size
    if (clusterCache.summaries.size >= MAX_CACHE_SIZE) {
      this.clearOldestEntries();
    }
    
    clusterCache.summaries.set(key, {
      clusters: clusters,
      timestamp: Date.now(),
      version: clusterCache.version
    });
    
    if (DEBUG_CONFIG.CLUSTERING) {
      console.log(`💾 Cached clusters: ${key} (${clusters.length} items)`);
    }
  },
  
  /**
   * Generate cluster summaries from channel data
   */
  generateClusterSummary(channels, level) {
    const clusters = new Map();
    
    channels.forEach(channel => {
      const clusterKey = this.getClusterKey(channel, level);
      
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, {
          id: clusterKey,
          level: level,
          channels: [],
          totalVotes: 0,
          location: this.getClusterLocation(channel, level),
          lastUpdate: Date.now()
        });
      }
      
      const cluster = clusters.get(clusterKey);
      cluster.channels.push(channel.id);
      cluster.totalVotes += (channel.votes || 0);
    });
    
    return Array.from(clusters.values());
  },
  
  /**
   * Get cluster key based on level and channel location
   */
  getClusterKey(channel, level) {
    const loc = channel.location || {};
    
    switch (level) {
      case 'gps':
        return `${loc.lat?.toFixed(4)}-${loc.lng?.toFixed(4)}`;
      
      case 'city':
        return this.getCityKey(loc.lat, loc.lng);
      
      case 'state':
        return this.getStateKey(loc.lat, loc.lng);
      
      case 'country':
        return this.getCountryKey(loc.lat, loc.lng);
      
      case 'continent':
        return this.getContinentKey(loc.lat, loc.lng);
      
      default:
        return 'global';
    }
  },
  
  /**
   * Get cluster location for display
   */
  getClusterLocation(channel, level) {
    const loc = channel.location || {};
    
    switch (level) {
      case 'gps':
        return { lat: loc.lat, lng: loc.lng, alt: loc.alt || 0 };
      
      case 'city':
        return this.getCityCenter(loc.lat, loc.lng);
      
      case 'state':
        return this.getStateCenter(loc.lat, loc.lng);
      
      case 'country':
        return this.getCountryCenter(loc.lat, loc.lng);
      
      case 'continent':
        return this.getContinentCenter(loc.lat, loc.lng);
      
      default:
        return { lat: 0, lng: 0, alt: 0 };
    }
  },
  
  /**
   * Simplified geographic clustering functions
   */
  getCityKey(lat, lng) {
    // Cluster by ~10km grid
    const gridSize = 0.1;
    return `city-${Math.floor(lat / gridSize) * gridSize}-${Math.floor(lng / gridSize) * gridSize}`;
  },
  
  getStateKey(lat, lng) {
    // Cluster by ~100km grid
    const gridSize = 1.0;
    return `state-${Math.floor(lat / gridSize) * gridSize}-${Math.floor(lng / gridSize) * gridSize}`;
  },
  
  getCountryKey(lat, lng) {
    // Cluster by ~500km grid
    const gridSize = 5.0;
    return `country-${Math.floor(lat / gridSize) * gridSize}-${Math.floor(lng / gridSize) * gridSize}`;
  },
  
  getContinentKey(lat, lng) {
    // Simple continent detection based on lat/lng
    if (lat > 70) return 'arctic';
    if (lat < -60) return 'antarctica';
    
    if (lng >= -170 && lng <= -30) {
      return lat > 15 ? 'north-america' : 'south-america';
    } else if (lng >= -30 && lng <= 60) {
      return lat > 35 ? 'europe' : 'africa';
    } else if (lng >= 60 && lng <= 180) {
      return lat > 10 ? 'asia' : 'oceania';
    }
    
    return 'unknown';
  },
  
  /**
   * Get center points for cluster levels
   */
  getCityCenter(lat, lng) {
    const gridSize = 0.1;
    return {
      lat: Math.floor(lat / gridSize) * gridSize + gridSize / 2,
      lng: Math.floor(lng / gridSize) * gridSize + gridSize / 2,
      alt: 50000 // 50km elevation for city clusters
    };
  },
  
  getStateCenter(lat, lng) {
    const gridSize = 1.0;
    return {
      lat: Math.floor(lat / gridSize) * gridSize + gridSize / 2,
      lng: Math.floor(lng / gridSize) * gridSize + gridSize / 2,
      alt: 200000 // 200km elevation for state clusters
    };
  },
  
  getCountryCenter(lat, lng) {
    const gridSize = 5.0;
    return {
      lat: Math.floor(lat / gridSize) * gridSize + gridSize / 2,
      lng: Math.floor(lng / gridSize) * gridSize + gridSize / 2,
      alt: 500000 // 500km elevation for country clusters
    };
  },
  
  getContinentCenter(lat, lng) {
    // Return approximate continent centers
    const continent = this.getContinentKey(lat, lng);
    
    const centers = {
      'north-america': { lat: 54, lng: -106, alt: 1000000 },
      'south-america': { lat: -8, lng: -55, alt: 1000000 },
      'europe': { lat: 54, lng: 15, alt: 1000000 },
      'africa': { lat: -8, lng: 20, alt: 1000000 },
      'asia': { lat: 29, lng: 100, alt: 1000000 },
      'oceania': { lat: -25, lng: 140, alt: 1000000 },
      'arctic': { lat: 85, lng: 0, alt: 1000000 },
      'antarctica': { lat: -85, lng: 0, alt: 1000000 }
    };
    
    return centers[continent] || { lat: 0, lng: 0, alt: 1000000 };
  },
  
  /**
   * Check if cache entry is still valid
   */
  isCacheValid(timestamp) {
    return (Date.now() - timestamp) < CACHE_DURATION;
  },
  
  /**
   * Clear oldest cache entries to prevent memory bloat
   */
  clearOldestEntries() {
    const entries = Array.from(clusterCache.summaries.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      clusterCache.summaries.delete(entries[i][0]);
    }
    
    if (DEBUG_CONFIG.CLUSTERING) {
      console.log(`🧹 Cleared ${toRemove} old cluster cache entries`);
    }
  },
  
  /**
   * Invalidate cache (force refresh)
   */
  invalidateCache() {
    clusterCache.summaries.clear();
    clusterCache.entities.clear();
    clusterCache.version++;
    clusterCache.lastUpdate = Date.now();
    
    if (DEBUG_CONFIG.CLUSTERING) {
      console.log('🔄 Cluster cache invalidated');
    }
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const summaryCount = clusterCache.summaries.size;
    const entityCount = clusterCache.entities.size;
    const cacheAge = Date.now() - clusterCache.lastUpdate;
    
    return {
      summaryCount,
      entityCount,
      totalCount: summaryCount + entityCount,
      cacheAge,
      version: clusterCache.version,
      memoryUsage: this.estimateMemoryUsage()
    };
  },
  
  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    const summarySize = clusterCache.summaries.size * 500; // ~500 bytes per summary
    const entitySize = clusterCache.entities.size * 200;   // ~200 bytes per entity
    return summarySize + entitySize;
  }
};
