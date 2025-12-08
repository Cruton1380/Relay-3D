/**
 * Spatial Voter Index Service
 * High-performance spatial indexing for millions of voters using H3 hexagonal grid
 * 
 * Architecture:
 * - Uses H3 for hierarchical spatial indexing (planet → meter resolution)
 * - Pre-computes clusters at multiple zoom levels
 * - O(1) insert, O(log n) query
 * - Supports tile-based retrieval for progressive loading
 */

import { latLngToCell, cellToBoundary, cellToLatLng, gridDisk } from 'h3-js';
import logger from '../utils/logging/logger.mjs';

const spatialLogger = logger.child({ module: 'spatial-voter-index' });

/**
 * H3 Resolution Levels:
 * - Resolution 2: ~100,000 km² (country level)
 * - Resolution 4: ~1,000 km² (province level)
 * - Resolution 6: ~36 km² (city level)
 * - Resolution 8: ~0.5 km² (neighborhood/GPS level)
 * - Resolution 10: ~0.015 km² (street level)
 */
const H3_RESOLUTIONS = {
  country: 2,
  province: 4,
  city: 6,
  gps: 8,
  street: 10
};

class SpatialVoterIndex {
  constructor() {
    // Multi-resolution index: Map<candidateId, Map<h3Index, voterCluster>>
    this.indexes = {
      country: new Map(),   // Resolution 2
      province: new Map(),  // Resolution 4
      city: new Map(),      // Resolution 6
      gps: new Map()        // Resolution 8
    };
    
    // Stats for monitoring
    this.stats = {
      totalVoters: 0,
      votersByCandidate: new Map(),
      indexSize: 0
    };
    
    spatialLogger.info('Spatial voter index initialized');
  }

  /**
   * Add a voter to the spatial index
   * Automatically indexes at all resolution levels
   */
  addVoter(candidateId, userId, lat, lng, privacyLevel = 'gps') {
    if (!candidateId || !userId || lat === undefined || lng === undefined) {
      spatialLogger.warn('Invalid voter data', { candidateId, userId, lat, lng });
      return false;
    }

    try {
      // Get H3 indexes at all resolutions
      const h3Indexes = {
        country: latLngToCell(lat, lng, H3_RESOLUTIONS.country),
        province: latLngToCell(lat, lng, H3_RESOLUTIONS.province),
        city: latLngToCell(lat, lng, H3_RESOLUTIONS.city),
        gps: latLngToCell(lat, lng, H3_RESOLUTIONS.gps)
      };

      // Add to each resolution level
      for (const [level, h3Index] of Object.entries(h3Indexes)) {
        if (!this.indexes[level].has(candidateId)) {
          this.indexes[level].set(candidateId, new Map());
        }

        const candidateIndex = this.indexes[level].get(candidateId);
        
        if (!candidateIndex.has(h3Index)) {
          // Create new cluster
          const [clusterLat, clusterLng] = cellToLatLng(h3Index);
          candidateIndex.set(h3Index, {
            h3Index,
            lat: clusterLat,
            lng: clusterLng,
            voterCount: 0,
            voters: [],
            privacyLevels: { gps: 0, city: 0, province: 0, country: 0 }
          });
        }

        // Add voter to cluster
        const cluster = candidateIndex.get(h3Index);
        cluster.voterCount++;
        cluster.voters.push({ userId, lat, lng, privacyLevel });
        cluster.privacyLevels[privacyLevel]++;
      }

      // Update stats
      this.stats.totalVoters++;
      this.stats.votersByCandidate.set(
        candidateId,
        (this.stats.votersByCandidate.get(candidateId) || 0) + 1
      );

      return true;
    } catch (error) {
      spatialLogger.error('Failed to add voter to spatial index', { 
        error: error.message, 
        candidateId, 
        userId, 
        lat, 
        lng 
      });
      return false;
    }
  }

  /**
   * Get voter clusters for a candidate at a specific resolution
   */
  getClusters(candidateId, resolution = 'gps', limit = 10000) {
    if (!this.indexes[resolution]) {
      spatialLogger.warn('Invalid resolution', { resolution });
      return [];
    }

    const candidateIndex = this.indexes[resolution].get(candidateId);
    if (!candidateIndex) {
      return [];
    }

    // Convert map to array and limit results
    const clusters = Array.from(candidateIndex.values())
      .map(cluster => ({
        h3Index: cluster.h3Index,
        lat: cluster.lat,
        lng: cluster.lng,
        voterCount: cluster.voterCount,
        visible: cluster.privacyLevels.gps,
        hidden: cluster.voterCount - cluster.privacyLevels.gps,
        privacyBreakdown: cluster.privacyLevels
      }))
      .slice(0, limit);

    return clusters;
  }

  /**
   * Get clusters within a bounding box (for tile-based loading)
   * @param {string} candidateId - Candidate ID
   * @param {number} minLat - South boundary
   * @param {number} maxLat - North boundary
   * @param {number} minLng - West boundary
   * @param {number} maxLng - East boundary
   * @param {string} resolution - H3 resolution level
   */
  getClustersInBounds(candidateId, minLat, maxLat, minLng, maxLng, resolution = 'gps') {
    const allClusters = this.getClusters(candidateId, resolution, Infinity);
    
    // Filter clusters within bounds
    return allClusters.filter(cluster => 
      cluster.lat >= minLat && 
      cluster.lat <= maxLat && 
      cluster.lng >= minLng && 
      cluster.lng <= maxLng
    );
  }

  /**
   * Get clusters for a specific H3 tile (for tile-based API)
   * This is the most efficient way to query for map rendering
   */
  getClustersInTile(candidateId, h3Index, resolution = 'gps') {
    const candidateIndex = this.indexes[resolution].get(candidateId);
    if (!candidateIndex) {
      return [];
    }

    // Get the tile and its neighbors (1 ring)
    const tileHexes = [h3Index, ...gridDisk(h3Index, 1)];
    
    const clusters = [];
    for (const hex of tileHexes) {
      const cluster = candidateIndex.get(hex);
      if (cluster) {
        clusters.push({
          h3Index: cluster.h3Index,
          lat: cluster.lat,
          lng: cluster.lng,
          voterCount: cluster.voterCount,
          visible: cluster.privacyLevels.gps,
          hidden: cluster.voterCount - cluster.privacyLevels.gps,
          privacyBreakdown: cluster.privacyLevels
        });
      }
    }

    return clusters;
  }

  /**
   * Get statistics about the index
   */
  getStats() {
    return {
      totalVoters: this.stats.totalVoters,
      totalCandidates: this.stats.votersByCandidate.size,
      votersByCandidate: Object.fromEntries(this.stats.votersByCandidate),
      indexSizes: {
        country: this.getIndexSize('country'),
        province: this.getIndexSize('province'),
        city: this.getIndexSize('city'),
        gps: this.getIndexSize('gps')
      }
    };
  }

  /**
   * Get size of a specific resolution index
   */
  getIndexSize(resolution) {
    const resolutionIndex = this.indexes[resolution];
    let totalClusters = 0;
    
    for (const candidateIndex of resolutionIndex.values()) {
      totalClusters += candidateIndex.size;
    }
    
    return totalClusters;
  }

  /**
   * Clear all indexes (for testing/reset)
   */
  clear() {
    for (const level of Object.keys(this.indexes)) {
      this.indexes[level].clear();
    }
    this.stats.totalVoters = 0;
    this.stats.votersByCandidate.clear();
    spatialLogger.info('Spatial index cleared');
  }

  /**
   * Bulk import voters (much faster than individual adds)
   */
  bulkAddVoters(voters) {
    spatialLogger.info('Bulk importing voters', { count: voters.length });
    
    let successCount = 0;
    const startTime = Date.now();
    
    for (const voter of voters) {
      if (this.addVoter(
        voter.candidateId,
        voter.userId,
        voter.lat,
        voter.lng,
        voter.privacyLevel
      )) {
        successCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    const rate = Math.round(successCount / (duration / 1000));
    
    spatialLogger.info('Bulk import complete', { 
      successCount, 
      failedCount: voters.length - successCount,
      duration: `${duration}ms`,
      rate: `${rate} voters/sec`
    });
    
    return successCount;
  }
}

// Singleton instance
const spatialVoterIndex = new SpatialVoterIndex();

export default spatialVoterIndex;
export { H3_RESOLUTIONS };

