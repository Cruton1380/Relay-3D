/**
 * Vote Reconciliation Service
 * 
 * Ensures perfect vote reconciliation across all clustering levels.
 * No vote count deviation, no candidate inconsistencies.
 */

import { VoteUtils } from '../utils/voteUtils.mjs';
import { ChannelUtils } from '../utils/channelUtils.mjs';

class VoteReconciliationService {
  constructor() {
    this.reconciliationLog = [];
    this.clusteringLevels = ['gps', 'city', 'province', 'country', 'region', 'global'];
  }

  /**
   * Reconcile all votes for a channel across all clustering levels
   */
  async reconcileChannelVotes(channelData) {
    console.log(`🔄 Starting vote reconciliation for channel: ${channelData.id}`);
    
    const reconciliationStart = Date.now();
    const reconciliationId = `reconcile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      // Validate input data
      this.validateChannelData(channelData);
      
      // Create hierarchical vote structure
      const voteHierarchy = this.buildVoteHierarchy(channelData.candidates);
      
      // Reconcile each clustering level
      const reconciledVotes = {};
      let totalOriginalVotes = 0;
      let totalReconciledVotes = 0;
      
      for (const level of this.clusteringLevels) {
        const levelResult = this.reconcileClusteringLevel(voteHierarchy, level);
        reconciledVotes[level] = levelResult;
        
        if (level === 'gps') {
          totalOriginalVotes = levelResult.totalVotes;
        }
        if (level === 'global') {
          totalReconciledVotes = levelResult.totalVotes;
        }
      }
      
      // Validate reconciliation integrity
      this.validateReconciliation(reconciledVotes, totalOriginalVotes, totalReconciledVotes);
      
      // Log reconciliation
      const reconciliationTime = Date.now() - reconciliationStart;
      this.logReconciliation(reconciliationId, channelData.id, reconciledVotes, reconciliationTime);
      
      console.log(`✅ Vote reconciliation completed in ${reconciliationTime}ms - Total votes maintained: ${totalOriginalVotes}`);
      
      return {
        reconciliationId,
        channelId: channelData.id,
        reconciledVotes,
        totalVotes: totalOriginalVotes,
        reconciliationTime,
        integrity: 'PERFECT'
      };
      
    } catch (error) {
      console.error(`❌ Vote reconciliation failed for channel ${channelData.id}:`, error);
      throw new Error(`Vote reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Build hierarchical vote structure from candidates
   */
  buildVoteHierarchy(candidates) {
    const hierarchy = {
      gps: new Map(),
      city: new Map(),
      province: new Map(),
      country: new Map(),
      region: new Map(),
      global: new Map()
    };

    for (const candidate of candidates) {
      // Validate candidate has complete clustering keys
      if (!candidate.clusterKeys) {
        throw new Error(`Candidate ${candidate.id} missing clustering keys`);
      }

      const votes = VoteUtils.getCandidateVoteCount(candidate);
      
      // Add to each clustering level
      for (const level of this.clusteringLevels) {
        const clusterKey = candidate.clusterKeys[level];
        if (!clusterKey) {
          throw new Error(`Candidate ${candidate.id} missing ${level} cluster key`);
        }

        if (!hierarchy[level].has(clusterKey)) {
          hierarchy[level].set(clusterKey, {
            candidates: [],
            totalVotes: 0,
            metadata: this.getClusterMetadata(candidate, level)
          });
        }

        const cluster = hierarchy[level].get(clusterKey);
        cluster.candidates.push(candidate);
        cluster.totalVotes += votes;
      }
    }

    return hierarchy;
  }

  /**
   * Reconcile votes for a specific clustering level
   */
  reconcileClusteringLevel(voteHierarchy, level) {
    console.log(`🔍 Reconciling ${level} level...`);
    
    const levelData = voteHierarchy[level];
    const clusters = [];
    let totalVotes = 0;
    let totalCandidates = 0;

    for (const [clusterKey, clusterData] of levelData) {
      // Validate cluster vote integrity
      const calculatedVotes = clusterData.candidates.reduce((sum, candidate) => {
        return sum + VoteUtils.getCandidateVoteCount(candidate);
      }, 0);

      if (calculatedVotes !== clusterData.totalVotes) {
        throw new Error(`Vote mismatch in ${level} cluster ${clusterKey}: calculated ${calculatedVotes}, stored ${clusterData.totalVotes}`);
      }

      // Create reconciled cluster
      const reconciledCluster = {
        clusterKey,
        level,
        candidateCount: clusterData.candidates.length,
        totalVotes: clusterData.totalVotes,
        candidates: this.sortCandidatesByVotes(clusterData.candidates),
        centroid: this.calculateClusterCentroid(clusterData.candidates, level),
        metadata: clusterData.metadata,
        reconciliationTimestamp: Date.now()
      };

      clusters.push(reconciledCluster);
      totalVotes += clusterData.totalVotes;
      totalCandidates += clusterData.candidates.length;
    }

    // Sort clusters by vote count for consistent ordering
    clusters.sort((a, b) => b.totalVotes - a.totalVotes);

    console.log(`✅ ${level} level: ${clusters.length} clusters, ${totalCandidates} candidates, ${totalVotes} votes`);

    return {
      level,
      clusters,
      clusterCount: clusters.length,
      totalCandidates,
      totalVotes,
      reconciliationComplete: true
    };
  }

  /**
   * Calculate centroid for cluster based on level
   */
  calculateClusterCentroid(candidates, level) {
    if (!candidates || candidates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    let totalLat = 0;
    let totalLng = 0;
    let validLocations = 0;

    for (const candidate of candidates) {
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        totalLat += candidate.location.lat;
        totalLng += candidate.location.lng;
        validLocations++;
      }
    }

    if (validLocations === 0) {
      console.warn(`⚠️ No valid locations found for ${level} cluster centroid calculation`);
      return { lat: 0, lng: 0 };
    }

    return {
      lat: totalLat / validLocations,
      lng: totalLng / validLocations,
      validLocations,
      totalCandidates: candidates.length
    };
  }

  /**
   * Get cluster metadata based on level
   */
  getClusterMetadata(candidate, level) {
    const metadata = {
      level,
      generatedAt: Date.now()
    };

    switch (level) {
      case 'gps':
        metadata.location = candidate.location;
        break;
      case 'city':
        metadata.city = candidate.city;
        metadata.province = candidate.province;
        metadata.country = candidate.country;
        break;
      case 'province':
        metadata.province = candidate.province;
        metadata.country = candidate.country;
        metadata.region = candidate.region;
        break;
      case 'country':
        metadata.country = candidate.country;
        metadata.countryCode = candidate.countryCode;
        metadata.region = candidate.region;
        break;
      case 'region':
        metadata.region = candidate.region;
        break;
      case 'global':
        metadata.scope = 'GLOBAL';
        break;
    }

    return metadata;
  }

  /**
   * Sort candidates by vote count (descending)
   */
  sortCandidatesByVotes(candidates) {
    return [...candidates].sort((a, b) => {
      const votesA = VoteUtils.getCandidateVoteCount(a);
      const votesB = VoteUtils.getCandidateVoteCount(b);
      return votesB - votesA;
    });
  }

  /**
   * Validate channel data
   */
  validateChannelData(channelData) {
    if (!channelData) {
      throw new Error('Channel data is required');
    }

    if (!channelData.id) {
      throw new Error('Channel ID is required');
    }

    if (!channelData.candidates || !Array.isArray(channelData.candidates)) {
      throw new Error('Channel candidates array is required');
    }

    if (channelData.candidates.length === 0) {
      throw new Error('Channel must have at least one candidate');
    }

    // Validate each candidate
    for (const candidate of channelData.candidates) {
      this.validateCandidate(candidate);
    }
  }

  /**
   * Validate individual candidate
   */
  validateCandidate(candidate) {
    if (!candidate.id) {
      throw new Error('Candidate ID is required');
    }

    if (!candidate.clusterKeys) {
      throw new Error(`Candidate ${candidate.id} missing cluster keys`);
    }

    // Validate all clustering keys exist
    for (const level of this.clusteringLevels) {
      if (!candidate.clusterKeys[level]) {
        throw new Error(`Candidate ${candidate.id} missing ${level} cluster key`);
      }
    }

    // Validate geographical data
    const requiredFields = ['city', 'province', 'country', 'region'];
    for (const field of requiredFields) {
      if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
        throw new Error(`Candidate ${candidate.id} has invalid ${field}: ${candidate[field]}`);
      }
    }

    // Validate location
    if (!candidate.location || typeof candidate.location.lat !== 'number' || typeof candidate.location.lng !== 'number') {
      throw new Error(`Candidate ${candidate.id} has invalid location data`);
    }

    // Validate vote data exists
    const votes = VoteUtils.getCandidateVoteCount(candidate);
    if (typeof votes !== 'number' || votes < 0) {
      throw new Error(`Candidate ${candidate.id} has invalid vote count: ${votes}`);
    }
  }

  /**
   * Validate reconciliation integrity
   */
  validateReconciliation(reconciledVotes, originalTotal, finalTotal) {
    // Check total vote conservation
    if (originalTotal !== finalTotal) {
      throw new Error(`Vote conservation failed: original ${originalTotal} ≠ final ${finalTotal}`);
    }

    // Check hierarchical consistency
    let previousLevelTotal = null;
    
    for (const level of this.clusteringLevels) {
      const levelData = reconciledVotes[level];
      
      if (!levelData || !levelData.reconciliationComplete) {
        throw new Error(`Reconciliation incomplete for level: ${level}`);
      }

      // All levels should have same total vote count
      if (previousLevelTotal !== null && levelData.totalVotes !== previousLevelTotal) {
        throw new Error(`Vote total mismatch between levels: ${levelData.totalVotes} ≠ ${previousLevelTotal}`);
      }
      
      previousLevelTotal = levelData.totalVotes;
    }

    console.log('✅ Reconciliation integrity validated - perfect vote conservation');
  }

  /**
   * Log reconciliation for audit trail
   */
  logReconciliation(reconciliationId, channelId, reconciledVotes, reconciliationTime) {
    const logEntry = {
      reconciliationId,
      channelId,
      timestamp: new Date().toISOString(),
      reconciliationTime,
      summary: {}
    };

    for (const level of this.clusteringLevels) {
      const levelData = reconciledVotes[level];
      logEntry.summary[level] = {
        clusters: levelData.clusterCount,
        candidates: levelData.totalCandidates,
        votes: levelData.totalVotes
      };
    }

    this.reconciliationLog.push(logEntry);

    // Keep only last 100 reconciliation logs
    if (this.reconciliationLog.length > 100) {
      this.reconciliationLog = this.reconciliationLog.slice(-100);
    }
  }

  /**
   * Get reconciliation statistics
   */
  getReconciliationStats() {
    return {
      totalReconciliations: this.reconciliationLog.length,
      recentReconciliations: this.reconciliationLog.slice(-10),
      averageReconciliationTime: this.reconciliationLog.length > 0 
        ? this.reconciliationLog.reduce((sum, log) => sum + log.reconciliationTime, 0) / this.reconciliationLog.length
        : 0
    };
  }

  /**
   * Generate cluster stacks for rendering
   */
  generateClusterStacks(reconciledVotes, targetLevel) {
    const levelData = reconciledVotes[targetLevel];
    if (!levelData) {
      throw new Error(`No reconciled data found for level: ${targetLevel}`);
    }

    const stacks = [];

    for (const cluster of levelData.clusters) {
      // Create 3D stack centered at cluster centroid
      const stackHeight = Math.min(cluster.candidateCount * 0.1, 2.0); // Max 2km stack height
      
      const stack = {
        id: `stack_${targetLevel}_${cluster.clusterKey}`,
        level: targetLevel,
        clusterKey: cluster.clusterKey,
        
        // Position at centroid
        position: {
          lat: cluster.centroid.lat,
          lng: cluster.centroid.lng,
          height: stackHeight / 2 // Center of stack
        },
        
        // Stack properties
        dimensions: {
          width: 0.05, // 50m width
          depth: 0.05, // 50m depth  
          height: stackHeight
        },
        
        // Vote data
        candidateCount: cluster.candidateCount,
        totalVotes: cluster.totalVotes,
        candidates: cluster.candidates,
        
        // Visual properties
        color: this.getStackColor(targetLevel, cluster.totalVotes),
        opacity: 0.8,
        
        // Metadata
        metadata: cluster.metadata,
        reconciliationTimestamp: cluster.reconciliationTimestamp
      };

      stacks.push(stack);
    }

    // Sort by vote count for consistent rendering
    stacks.sort((a, b) => b.totalVotes - a.totalVotes);
    
    console.log(`📦 Generated ${stacks.length} cluster stacks for ${targetLevel} level`);
    return stacks;
  }

  /**
   * Get color for stack based on level and votes
   */
  getStackColor(level, voteCount) {
    // Level-based base colors
    const levelColors = {
      gps: [255, 0, 0],     // Red
      city: [255, 165, 0],  // Orange  
      province: [255, 255, 0], // Yellow
      country: [0, 255, 0], // Green
      region: [0, 0, 255],  // Blue
      global: [128, 0, 128] // Purple
    };

    const baseColor = levelColors[level] || [128, 128, 128];
    
    // Adjust intensity based on vote count
    const intensity = Math.min(voteCount / 1000, 1.0); // Scale to 0-1
    
    return [
      Math.floor(baseColor[0] * (0.3 + 0.7 * intensity)),
      Math.floor(baseColor[1] * (0.3 + 0.7 * intensity)),
      Math.floor(baseColor[2] * (0.3 + 0.7 * intensity)),
      200 // Alpha
    ];
  }
}

// Export singleton instance
export const voteReconciliationService = new VoteReconciliationService();
export { VoteReconciliationService };