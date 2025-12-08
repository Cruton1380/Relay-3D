/**
 * RELAY NETWORK - RELIABILITY SCORING SERVICE
 * Implements the comprehensive reliability scoring system for candidates and topics
 */

class ReliabilityScoreService {
  constructor() {
    this.db = require('../database/connection');
    this.eventBus = require('../event-bus/eventBus');
    this.cache = require('../cache/redisCache');
  }

  /**
   * Calculate reliability score for individual candidates and overall topic
   */
  async calculateTopicReliability(topicId) {
    try {
      const topic = await this.db.topics.findById(topicId);
      const candidates = await this.db.candidates.findByTopicId(topicId);
      const allVoters = await this.getAllTopicVoters(topicId);

      const reliabilityData = {
        topicId: topicId,
        candidates: {},
        overallTopic: 0,
        totalVoters: allVoters.length,
        totalRatingVoters: 0,
        lastUpdated: Date.now()
      };

      // Calculate individual candidate reliability scores
      for (const candidate of candidates) {
        const candidateRatings = await this.getCandidateReliabilityRatings(candidate.id);
        const weightedAverage = this.calculateWeightedReliabilityAverage(candidateRatings);
        
        reliabilityData.candidates[candidate.id] = {
          candidateName: candidate.name,
          averageReliability: weightedAverage,
          totalRaters: candidateRatings.length,
          voteCount: candidate.voteCount,
          votePercentage: (candidate.voteCount / topic.totalVotes) * 100,
          position: candidate.currentPosition,
          reliabilityClass: this.getReliabilityClass(weightedAverage)
        };
      }

      // Calculate overall topic reliability (weighted by all participant votes)
      const topicRatings = await this.getTopicReliabilityRatings(topicId);
      reliabilityData.overallTopic = this.calculateWeightedReliabilityAverage(topicRatings);
      reliabilityData.totalRatingVoters = topicRatings.length;

      // Detect suspicious patterns (like C11 example: high votes + low reliability)
      reliabilityData.suspiciousPatterns = await this.detectSuspiciousPatterns(reliabilityData);

      // Cache for real-time access
      await this.cache.set(`reliability:${topicId}`, reliabilityData, 300); // 5 minute cache

      return reliabilityData;
    } catch (error) {
      console.error('Error calculating topic reliability:', error);
      throw error;
    }
  }

  /**
   * Submit reliability rating for candidate or overall topic
   */
  async submitReliabilityRating(voterId, topicId, targetId, reliabilityScore, targetType = 'candidate') {
    try {
      // Verify voter participated in this topic (voted for ANY candidate)
      const voterParticipated = await this.checkVoterParticipation(voterId, topicId);
      if (!voterParticipated) {
        throw new Error("Only voters who participated in this topic can rate reliability");
      }

      // Validate reliability score (0-100)
      if (reliabilityScore < 0 || reliabilityScore > 100) {
        throw new Error("Reliability score must be between 0 and 100");
      }

      const reliabilityRating = {
        id: this.generateRatingId(),
        voterId: voterId,
        topicId: topicId,
        targetId: targetId, // candidateId or null for topic rating
        targetType: targetType, // 'candidate' or 'topic'
        reliabilityScore: reliabilityScore,
        timestamp: Date.now(),
        voterWeight: await this.calculateVoterWeight(voterId, topicId)
      };

      // Store reliability rating
      await this.db.reliabilityRatings.create(reliabilityRating);

      // Update real-time reliability display
      await this.updateReliabilityDisplay(topicId);

      // Broadcast update to connected clients
      await this.eventBus.emit('reliability:updated', {
        topicId: topicId,
        targetId: targetId,
        targetType: targetType,
        newReliability: await this.getUpdatedReliability(targetId, targetType)
      });

      return reliabilityRating;
    } catch (error) {
      console.error('Error submitting reliability rating:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious voting patterns through reliability analysis
   */
  async detectSuspiciousPatterns(reliabilityData) {
    const suspiciousPatterns = [];

    // Pattern 1: High vote count + Low reliability (your C11 example)
    const highVoteLowReliability = Object.values(reliabilityData.candidates).filter(candidate => 
      candidate.voteCount > 100000 && candidate.averageReliability < 50
    );

    if (highVoteLowReliability.length > 0) {
      suspiciousPatterns.push({
        type: "vote_manipulation",
        description: "High vote count with low community reliability rating",
        candidates: highVoteLowReliability,
        severity: "high",
        recommendedAction: "Community review recommended"
      });
    }

    // Pattern 2: Reliability score outliers
    const allReliabilities = Object.values(reliabilityData.candidates).map(c => c.averageReliability);
    const reliabilityMean = allReliabilities.reduce((sum, r) => sum + r, 0) / allReliabilities.length;
    const reliabilityStdDev = this.calculateStandardDeviation(allReliabilities, reliabilityMean);

    const reliabilityOutliers = Object.values(reliabilityData.candidates).filter(candidate =>
      Math.abs(candidate.averageReliability - reliabilityMean) > (2 * reliabilityStdDev)
    );

    if (reliabilityOutliers.length > 0) {
      suspiciousPatterns.push({
        type: "reliability_outlier",
        description: "Candidates with unusual reliability scores",
        candidates: reliabilityOutliers,
        severity: "medium"
      });
    }

    // Pattern 3: Vote distribution vs reliability mismatch
    const distributionMismatches = this.detectDistributionMismatches(reliabilityData);
    if (distributionMismatches.length > 0) {
      suspiciousPatterns.push({
        type: "distribution_mismatch",
        description: "Vote distribution doesn't match reliability expectations",
        candidates: distributionMismatches,
        severity: "medium"
      });
    }

    return suspiciousPatterns;
  }

  /**
   * Calculate weighted average for reliability scores
   */
  calculateWeightedReliabilityAverage(ratings) {
    if (!ratings || ratings.length === 0) return 0;

    const totalWeight = ratings.reduce((sum, rating) => sum + rating.voterWeight, 0);
    const weightedSum = ratings.reduce((sum, rating) => 
      sum + (rating.reliabilityScore * rating.voterWeight), 0
    );

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  /**
   * Get reliability class for UI styling
   */
  getReliabilityClass(reliabilityScore) {
    if (reliabilityScore >= 95) return 'excellent';
    if (reliabilityScore >= 85) return 'very-good';
    if (reliabilityScore >= 75) return 'good';
    if (reliabilityScore >= 60) return 'fair';
    if (reliabilityScore >= 40) return 'poor';
    return 'very-poor';
  }

  /**
   * Check if voter participated in topic (voted for any candidate)
   */
  async checkVoterParticipation(voterId, topicId) {
    const voterVotes = await this.db.votes.findByVoterAndTopic(voterId, topicId);
    return voterVotes.length > 0;
  }

  /**
   * Get all voters who participated in any candidate in this topic
   */
  async getAllTopicVoters(topicId) {
    const allVotes = await this.db.votes.findByTopicId(topicId);
    const uniqueVoters = [...new Set(allVotes.map(vote => vote.voterId))];
    return uniqueVoters;
  }

  /**
   * Get reliability ratings for specific candidate
   */
  async getCandidateReliabilityRatings(candidateId) {
    return await this.db.reliabilityRatings.findByTargetId(candidateId, 'candidate');
  }

  /**
   * Get reliability ratings for overall topic
   */
  async getTopicReliabilityRatings(topicId) {
    return await this.db.reliabilityRatings.findByTopicId(topicId, 'topic');
  }

  /**
   * Calculate voter weight based on engagement and proximity verification
   */
  async calculateVoterWeight(voterId, topicId) {
    const voter = await this.db.users.findById(voterId);
    const engagement = await this.db.engagement.getVoterEngagement(voterId, topicId);
    
    let weight = 1.0;
    
    // Proximity verification bonus
    if (voter.proximityVerified) weight += 0.5;
    
    // Active participation bonus
    if (engagement.recentVotes > 5) weight += 0.3;
    
    // Channel member bonus
    if (engagement.isChannelMember) weight += 0.2;
    
    return Math.min(weight, 2.0); // Cap at 2x weight
  }

  /**
   * Update real-time reliability display
   */
  async updateReliabilityDisplay(topicId) {
    const updatedReliability = await this.calculateTopicReliability(topicId);
    
    // Broadcast to all connected clients viewing this topic
    await this.eventBus.emit('reliability:display:update', {
      topicId: topicId,
      reliabilityData: updatedReliability
    });
    
    return updatedReliability;
  }

  /**
   * Generate unique rating ID
   */
  generateRatingId() {
    return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate standard deviation for outlier detection
   */
  calculateStandardDeviation(values, mean) {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Detect distribution mismatches between votes and reliability
   */
  detectDistributionMismatches(reliabilityData) {
    const mismatches = [];
    const candidates = Object.values(reliabilityData.candidates);
    
    candidates.forEach(candidate => {
      // High vote percentage but low reliability
      if (candidate.votePercentage > 15 && candidate.averageReliability < 60) {
        mismatches.push({
          ...candidate,
          mismatchType: "high_votes_low_reliability",
          severity: candidate.averageReliability < 30 ? "high" : "medium"
        });
      }
      
      // Very low vote percentage but very high reliability (potential underdog)
      if (candidate.votePercentage < 2 && candidate.averageReliability > 90) {
        mismatches.push({
          ...candidate,
          mismatchType: "low_votes_high_reliability",
          severity: "low",
          note: "Potential quality underdog candidate"
        });
      }
    });
    
    return mismatches;
  }
}

module.exports = ReliabilityScoreService;
