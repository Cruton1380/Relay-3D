/**
 * Optimized Channels Frontend Service
 * 
 * Provides frontend interface to optimized clustering API.
 * Handles fetching and processing optimized channel data.
 */

class OptimizedChannelsService {
  constructor() {
    this.cache = new Map();
    this.apiBaseUrl = '/api/optimized-channels';
  }

  /**
   * Fetch optimized channels from API
   */
  async fetchOptimizedChannels(count = 5) {
    console.log(`🌐 Fetching ${count} optimized channels from API...`);
    
    try {
      const response = await fetch(`${this.apiBaseUrl}?count=${count}&validate=true`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API returned error: ${data.error}`);
      }
      
      console.log(`✅ Successfully fetched ${data.channels.length} optimized channels`);
      console.log(`📊 Total candidates: ${data.metadata.totalCandidates}`);
      console.log(`🗳️ Total votes: ${data.metadata.totalVotes}`);
      
      return data.channels;
      
    } catch (error) {
      console.error('❌ Failed to fetch optimized channels:', error);
      throw error;
    }
  }

  /**
   * Fetch demo data
   */
  async fetchDemoData() {
    console.log('🎯 Fetching optimized demo data...');
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/demo`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API returned error: ${data.error}`);
      }
      
      console.log('✅ Successfully fetched demo data');
      console.log(`📊 Demo info: ${data.demoInfo.description}`);
      
      return [data.channel]; // Return as array to match channel format
      
    } catch (error) {
      console.error('❌ Failed to fetch demo data:', error);
      throw error;
    }
  }

  /**
   * Check if optimized clustering is available
   */
  async isOptimizedClusteringAvailable() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/stats`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get clustering information for a channel
   */
  async getChannelClustering(channelId, level = 'all') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${channelId}/clustering?level=${level}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.clustering;
      
    } catch (error) {
      console.error(`❌ Failed to get clustering for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Validate channel data has optimized structure
   */
  validateOptimizedChannel(channel) {
    if (!channel) {
      return false;
    }

    // Check if channel has optimized metadata
    if (channel.type === 'optimized-production' || 
        channel.type === 'optimized-demo' ||
        channel.productionMetadata?.clusteringOptimized) {
      
      // Validate candidates have clustering keys
      if (!channel.candidates || !Array.isArray(channel.candidates)) {
        return false;
      }

      for (const candidate of channel.candidates) {
        if (!candidate.clusterKeys) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Generate cluster groups from optimized candidate data
   */
  generateClustersFromOptimizedData(channel, level) {
    console.log(`🎯 Generating clusters for optimized channel: ${channel.name} at ${level} level`);
    
    const clusterGroups = new Map();
    
    if (!this.validateOptimizedChannel(channel)) {
      console.warn('⚠️ Channel is not optimized, cannot generate clusters');
      return clusterGroups;
    }
    
    for (const candidate of channel.candidates) {
      // Use the candidate's pre-computed clustering keys
      let clusterId = 'UNKNOWN';
      let clusterName = 'Unknown';
      
      if (candidate.clusterKeys && candidate.clusterKeys[level]) {
        clusterId = candidate.clusterKeys[level];
        
        // Generate appropriate cluster name based on level
        switch (level) {
          case 'gps':
            clusterName = `GPS-${candidate.id}`;
            break;
          case 'city':
            clusterName = candidate.city || clusterId;
            break;
          case 'province':
            clusterName = candidate.province ? `${candidate.province}, ${candidate.country}` : candidate.country;
            break;
          case 'country':
            clusterName = candidate.country || clusterId;
            break;
          case 'region':
            clusterName = candidate.region || clusterId;
            break;
          case 'global':
            clusterName = 'Global';
            break;
          default:
            clusterName = clusterId;
        }
      } else {
        console.warn(`⚠️ Candidate ${candidate.id} missing clustering keys for level ${level}`);
        continue;
      }
      
      // Create or update cluster group
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, {
          clusterId: clusterId,
          clusterName: clusterName,
          level: level,
          countryName: candidate.country,
          countryCode: candidate.countryCode,
          continent: candidate.continent,
          region: candidate.region,
          province: candidate.province,
          city: candidate.city,
          candidates: [],
          channels: new Set(),
          locations: [],
          centroid: null,
          centroidType: 'optimized',
          totalVotes: 0
        });
      }
      
      const clusterGroup = clusterGroups.get(clusterId);
      clusterGroup.candidates.push(candidate);
      clusterGroup.channels.add(channel.id);
      clusterGroup.totalVotes += candidate.votes || 0;
      
      // Add location for centroid calculation
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        clusterGroup.locations.push([candidate.location.lng, candidate.location.lat]);
      }
    }
    
    // Calculate centroids for each cluster group
    for (const [clusterId, group] of clusterGroups) {
      if (group.locations.length > 0) {
        const totalLng = group.locations.reduce((sum, loc) => sum + loc[0], 0);
        const totalLat = group.locations.reduce((sum, loc) => sum + loc[1], 0);
        group.centroid = [
          totalLng / group.locations.length,
          totalLat / group.locations.length
        ];
      } else {
        group.centroid = [0, 0];
      }
      
      console.log(`🎯 Optimized Cluster: ${group.clusterName} - ${group.candidates.length} candidates, ${group.totalVotes} votes, centroid: [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}]`);
    }
    
    return clusterGroups;
  }
}

// Export singleton instance
const optimizedChannelsService = new OptimizedChannelsService();
export default optimizedChannelsService;