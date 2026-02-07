/**
 * RELAY NETWORK - TWO-LEVEL RANKING SERVICE
 * Implements the corrected ranking system: Top-to-bottom channels, Left-to-right options
 */

class TwoLevelRankingService {
  constructor() {
    this.db = require('../database/connection');
    this.eventBus = require('../event-bus/eventBus');
    this.cache = require('../cache/redisCache');
    this.reliabilityService = require('../reliability-service/reliabilityScoreService');
  }

  /**
   * Get channels ranked top-to-bottom by total activity
   */
  async getChannelRankings(filterCriteria = {}) {
    try {
      const channels = await this.db.channels.findWithActivityMetrics(filterCriteria);
      
      // Calculate total activity for each channel
      const channelRankings = [];
      
      for (const channel of channels) {
        const topics = await this.db.topics.findByChannelId(channel.id);
        const totalVotes = topics.reduce((sum, topic) => sum + topic.totalVotes, 0);
        const totalParticipants = await this.getTotalUniqueParticipants(channel.id);
        const reliabilityScore = await this.getChannelReliabilityScore(channel.id);
        
        channelRankings.push({
          channelId: channel.id,
          channelName: channel.name,
          channelType: this.determineChannelType(channel.name),
          totalVotes: totalVotes,
          totalParticipants: totalParticipants,
          totalTopics: topics.length,
          activeTopics: topics.filter(t => t.status === 'active').length,
          reliabilityScore: reliabilityScore,
          lastActivity: Math.max(...topics.map(t => t.lastActivityAt)),
          activityScore: this.calculateActivityScore(totalVotes, totalParticipants, topics.length),
          topics: await this.getTopicRankingsForChannel(channel.id)
        });
      }
      
      // Sort channels top-to-bottom by activity score
      channelRankings.sort((a, b) => b.activityScore - a.activityScore);
      
      // Add position indicators
      channelRankings.forEach((channel, index) => {
        channel.position = index + 1;
      });
      
      return channelRankings;
    } catch (error) {
      console.error('Error getting channel rankings:', error);
      throw error;
    }
  }

  /**
   * Get topic rankings within a channel (left-to-right by individual votes)
   */
  async getTopicRankingsForChannel(channelId) {
    try {
      const topics = await this.db.topics.findByChannelId(channelId);
      const topicRankings = [];
      
      for (const topic of topics) {
        const candidates = await this.db.candidates.findByTopicId(topic.id);
        const reliabilityData = await this.reliabilityService.calculateTopicReliability(topic.id);
        
        // Sort candidates left-to-right by vote count
        const sortedCandidates = candidates.sort((a, b) => b.voteCount - a.voteCount);
        
        // Add position indicators for left-to-right ranking
        const candidatesWithPositions = sortedCandidates.map((candidate, index) => ({
          ...candidate,
          position: index + 1,
          positionLabel: `Position #${index + 1}`,
          votePercentage: (candidate.voteCount / topic.totalVotes) * 100,
          reliabilityScore: reliabilityData.candidates[candidate.id]?.averageReliability || 0,
          reliabilityClass: reliabilityData.candidates[candidate.id]?.reliabilityClass || 'unknown'
        }));
        
        topicRankings.push({
          topicId: topic.id,
          topicName: topic.name,
          totalVotes: topic.totalVotes,
          overallReliability: reliabilityData.overallTopic,
          status: topic.status,
          endTime: topic.endTime,
          candidates: candidatesWithPositions,
          suspiciousPatterns: reliabilityData.suspiciousPatterns || []
        });
      }
      
      return topicRankings;
    } catch (error) {
      console.error('Error getting topic rankings:', error);
      throw error;
    }
  }

  /**
   * Get formatted display data for mobile interface
   */
  async getMobileChannelDisplay(userLocation, filterCriteria = {}) {
    try {
      const channelRankings = await this.getChannelRankings(filterCriteria);
      
      // Format for mobile display (top-to-bottom by activity)
      const mobileDisplay = channelRankings.map(channel => {
        // Get top 2-3 candidates for preview (left-to-right)
        const topTopic = channel.topics.find(t => t.status === 'active') || channel.topics[0];
        const topCandidates = topTopic ? topTopic.candidates.slice(0, 3) : [];
        
        return {
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelType: channel.channelType,
          channelIcon: this.getChannelIcon(channel.channelType),
          totalVotes: this.formatVoteCount(channel.totalVotes),
          reliabilityScore: Math.round(channel.reliabilityScore),
          reliabilityClass: this.getReliabilityClass(channel.reliabilityScore),
          topicPreview: topTopic ? {
            topicName: topTopic.topicName,
            candidatePreview: topCandidates.map(c => c.name).join(' ← '),
            timeRemaining: this.formatTimeRemaining(topTopic.endTime),
            status: topTopic.status
          } : null,
          position: channel.position
        };
      });
      
      return mobileDisplay;
    } catch (error) {
      console.error('Error getting mobile channel display:', error);
      throw error;
    }
  }

  /**
   * Process new vote and update both level rankings
   */
  async processVoteAndUpdateRankings(voteData) {
    try {
      // 1. Record the vote
      const vote = await this.db.votes.create(voteData);
      
      // 2. Update candidate position within topic (left-to-right)
      await this.updateCandidateRankings(voteData.topicId);
      
      // 3. Update channel activity score (affects top-to-bottom ranking)
      await this.updateChannelActivityScore(voteData.channelId);
      
      // 4. Update real-time displays
      await this.broadcastRankingUpdates(voteData);
      
      return {
        voteRecorded: true,
        updatedCandidateRankings: await this.getCandidateRankings(voteData.topicId),
        updatedChannelPosition: await this.getChannelPosition(voteData.channelId)
      };
    } catch (error) {
      console.error('Error processing vote and updating rankings:', error);
      throw error;
    }
  }

  /**
   * Update candidate rankings within topic (left-to-right)
   */
  async updateCandidateRankings(topicId) {
    const candidates = await this.db.candidates.findByTopicId(topicId);
    
    // Sort by vote count (left-to-right: highest to lowest)
    candidates.sort((a, b) => b.voteCount - a.voteCount);
    
    // Update positions
    for (let i = 0; i < candidates.length; i++) {
      await this.db.candidates.updatePosition(candidates[i].id, i + 1);
    }
    
    return candidates;
  }

  /**
   * Update channel activity score (affects top-to-bottom ranking)
   */
  async updateChannelActivityScore(channelId) {
    const channel = await this.db.channels.findById(channelId);
    const topics = await this.db.topics.findByChannelId(channelId);
    const totalVotes = topics.reduce((sum, topic) => sum + topic.totalVotes, 0);
    const totalParticipants = await this.getTotalUniqueParticipants(channelId);
    
    const newActivityScore = this.calculateActivityScore(totalVotes, totalParticipants, topics.length);
    
    await this.db.channels.updateActivityScore(channelId, newActivityScore);
    
    return newActivityScore;
  }

  /**
   * Broadcast real-time ranking updates
   */
  async broadcastRankingUpdates(voteData) {
    // Broadcast candidate ranking update (left-to-right)
    const candidateRankings = await this.getCandidateRankings(voteData.topicId);
    await this.eventBus.emit('rankings:candidates:updated', {
      topicId: voteData.topicId,
      rankings: candidateRankings
    });
    
    // Broadcast channel ranking update (top-to-bottom)
    const channelRankings = await this.getChannelRankings();
    await this.eventBus.emit('rankings:channels:updated', {
      rankings: channelRankings
    });
  }

  /**
   * Determine channel type from name
   */
  determineChannelType(channelName) {
    if (channelName.startsWith('Global-')) return 'GLOBAL';
    
    const regionalPrefixes = ['NAW-', 'EUR-', 'ASIA-', 'AFRICA-', 'OCEANIA-'];
    for (const prefix of regionalPrefixes) {
      if (channelName.startsWith(prefix)) return 'REGIONAL';
    }
    
    return 'PROXIMITY';
  }

  /**
   * Get channel icon based on type
   */
  getChannelIcon(channelType) {
    const icons = {
      'GLOBAL': '🌍',
      'REGIONAL': '🏛️',
      'PROXIMITY': '📍'
    };
    return icons[channelType] || '📍';
  }

  /**
   * Calculate activity score for channel ranking
   */
  calculateActivityScore(totalVotes, totalParticipants, topicCount) {
    // Weighted score: votes (50%), participants (30%), topics (20%)
    const voteScore = totalVotes * 0.5;
    const participantScore = totalParticipants * 10 * 0.3; // 10x multiplier for participants
    const topicScore = topicCount * 100 * 0.2; // 100x multiplier for topics
    
    return Math.round(voteScore + participantScore + topicScore);
  }

  /**
   * Get total unique participants across all topics in channel
   */
  async getTotalUniqueParticipants(channelId) {
    const allVotes = await this.db.votes.findByChannelId(channelId);
    const uniqueVoters = new Set(allVotes.map(vote => vote.voterId));
    return uniqueVoters.size;
  }

  /**
   * Get channel reliability score (average of all topic reliabilities)
   */
  async getChannelReliabilityScore(channelId) {
    const topics = await this.db.topics.findByChannelId(channelId);
    
    if (topics.length === 0) return 0;
    
    let totalReliability = 0;
    let validTopics = 0;
    
    for (const topic of topics) {
      const reliabilityData = await this.reliabilityService.calculateTopicReliability(topic.id);
      if (reliabilityData.overallTopic > 0) {
        totalReliability += reliabilityData.overallTopic;
        validTopics++;
      }
    }
    
    return validTopics > 0 ? Math.round(totalReliability / validTopics) : 0;
  }

  /**
   * Get candidate rankings for specific topic
   */
  async getCandidateRankings(topicId) {
    const candidates = await this.db.candidates.findByTopicId(topicId);
    candidates.sort((a, b) => b.voteCount - a.voteCount);
    
    return candidates.map((candidate, index) => ({
      ...candidate,
      position: index + 1,
      positionLabel: `Position #${index + 1}`
    }));
  }

  /**
   * Get channel position in overall rankings
   */
  async getChannelPosition(channelId) {
    const channelRankings = await this.getChannelRankings();
    const channelIndex = channelRankings.findIndex(c => c.channelId === channelId);
    return channelIndex + 1;
  }

  /**
   * Format vote count for display
   */
  formatVoteCount(voteCount) {
    if (voteCount >= 1000000) {
      return `${(voteCount / 1000000).toFixed(1)}M`;
    } else if (voteCount >= 1000) {
      return `${(voteCount / 1000).toFixed(1)}k`;
    }
    return voteCount.toString();
  }

  /**
   * Format time remaining
   */
  formatTimeRemaining(endTime) {
    const now = Date.now();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return 'Ending soon';
  }

  /**
   * Get reliability class for styling
   */
  getReliabilityClass(reliabilityScore) {
    if (reliabilityScore >= 95) return 'excellent';
    if (reliabilityScore >= 85) return 'very-good';
    if (reliabilityScore >= 75) return 'good';
    if (reliabilityScore >= 60) return 'fair';
    return 'poor';
  }
}

module.exports = TwoLevelRankingService;
