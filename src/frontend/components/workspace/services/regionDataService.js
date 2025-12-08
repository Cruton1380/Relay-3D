/**
 * Region Data Service
 * Provides client-side access to region data and video node information
 */

import { apiGet, apiPost } from "./apiClient.js";

class RegionDataService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get region data for a specific region
   * @param {string} regionId - The region identifier
   * @returns {Promise<Object>} Region data with video node information
   */
  async getRegionData(regionId) {
    const cacheKey = `region-${regionId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await apiGet(`/api/video-nodes/region/${regionId}`);

      if (response.success) {
        const data = response.data;

        // Cache the result
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });

        return data;
      }

      throw new Error(response.message || "Failed to fetch region data");
    } catch (error) {
      console.error("Error fetching region data:", error);
      throw error;
    }
  }

  /**
   * Get multiple regions data
   * @param {string[]} regionIds - Array of region identifiers
   * @returns {Promise<Object[]>} Array of region data
   */
  async getMultipleRegions(regionIds) {
    const promises = regionIds.map((id) => this.getRegionData(id));
    return Promise.all(promises);
  }

  /**
   * Get all video nodes in a region
   * @param {string} regionId - The region identifier
   * @returns {Promise<Object[]>} Array of video nodes
   */
  async getVideoNodes(regionId) {
    const regionData = await this.getRegionData(regionId);

    return {
      activeVideo: regionData.activeVideo,
      pendingVideos: regionData.pendingVideos || [],
      totalVideos: regionData.totalVideos || 0,
    };
  }

  /**
   * Get region statistics
   * @param {string} regionId - The region identifier
   * @returns {Promise<Object>} Region statistics
   */
  async getRegionStats(regionId) {
    const regionData = await this.getRegionData(regionId);

    return {
      regionId,
      status: regionData.status,
      totalVideos: regionData.totalVideos || 0,
      votes: regionData.votes || 0,
      hasActiveVideo: Boolean(regionData.activeVideo),
      pendingCount: regionData.pendingVideos?.length || 0,
    };
  }

  /**
   * Vote on a video in a region
   * @param {string} regionId - The region identifier
   * @param {string} videoId - The video identifier
   * @returns {Promise<Object>} Vote result
   */
  async voteOnVideo(regionId, videoId) {
    try {
      const response = await apiPost(
        `/api/video-nodes/vote/${regionId}/${videoId}`,
      );

      if (response.success) {
        // Clear cache for this region to get fresh data
        this.clearRegionCache(regionId);
        return response.data;
      }

      throw new Error(response.message || "Failed to vote");
    } catch (error) {
      console.error("Error voting on video:", error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific region
   * @param {string} regionId - The region identifier
   */
  clearRegionCache(regionId) {
    const cacheKey = `region-${regionId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get cached region data without making API call
   * @param {string} regionId - The region identifier
   * @returns {Object|null} Cached data or null if not cached
   */
  getCachedRegionData(regionId) {
    const cacheKey = `region-${regionId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    return null;
  }

  /**
   * Get region status summary
   * @param {string[]} regionIds - Array of region identifiers
   * @returns {Promise<Object>} Summary of region statuses
   */
  async getRegionStatusSummary(regionIds) {
    const regions = await this.getMultipleRegions(regionIds);

    const summary = {
      total: regions.length,
      active: 0,
      pending: 0,
      empty: 0,
      totalVideos: 0,
      totalVotes: 0,
    };

    regions.forEach((region) => {
      summary.totalVideos += region.totalVideos || 0;
      summary.totalVotes += region.votes || 0;

      switch (region.status) {
        case "active":
          summary.active++;
          break;
        case "pending":
          summary.pending++;
          break;
        case "empty":
          summary.empty++;
          break;
      }
    });

    return summary;
  }
}

// Export singleton instance
const regionDataService = new RegionDataService();
export default regionDataService;
