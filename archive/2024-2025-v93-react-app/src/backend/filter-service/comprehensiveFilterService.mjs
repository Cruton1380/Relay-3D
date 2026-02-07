/**
 * RELAY NETWORK - COMPREHENSIVE FILTER SERVICE
 * Implements multi-level filtering system for Global/Regional/Channel/Topic levels
 */

class ComprehensiveFilterService {
  constructor() {
    this.db = require('../database/connection');
    this.cache = require('../cache/redisCache');
    this.searchEngine = require('../search/elasticSearch');
  }

  /**
   * Apply comprehensive filters across all network levels
   */
  async applyGlobalFilters(filterRequest) {
    try {
      const {
        textSearch,
        userTypes,
        channelTypes,
        reliabilityThreshold,
        activityStatus,
        geographicScope,
        timeRange,
        sortBy
      } = filterRequest;

      let results = {
        channels: [],
        topics: [],
        candidates: [],
        totalResults: 0,
        appliedFilters: filterRequest
      };

      // 1. Text search on row topic names
      if (textSearch) {
        results = await this.applyTextSearch(textSearch, results);
      }

      // 2. Filter by channel types (Global/Regional/Proximity)
      if (channelTypes) {
        results = await this.applyChannelTypeFilter(channelTypes, results);
      }

      // 3. Filter by user types (Active/Inactive/Local/Foreign)
      if (userTypes) {
        results = await this.applyUserTypeFilter(userTypes, results);
      }

      // 4. Apply reliability threshold
      if (reliabilityThreshold) {
        results = await this.applyReliabilityFilter(reliabilityThreshold, results);
      }

      // 5. Filter by activity status (Ongoing/Ended/Starting Soon)
      if (activityStatus) {
        results = await this.applyActivityFilter(activityStatus, results);
      }

      // 6. Apply geographic scope filtering
      if (geographicScope) {
        results = await this.applyGeographicFilter(geographicScope, results);
      }

      // 7. Apply time range filtering
      if (timeRange) {
        results = await this.applyTimeRangeFilter(timeRange, results);
      }

      // 8. Sort results based on criteria
      results = await this.applySorting(results, sortBy || 'totalActivity');

      // Cache results for performance
      const cacheKey = this.generateFilterCacheKey(filterRequest);
      await this.cache.set(cacheKey, results, 300); // 5 minute cache

      return results;
    } catch (error) {
      console.error('Error applying global filters:', error);
      throw error;
    }
  }

  /**
   * Text search on row topic names across entire network
   */
  async applyTextSearch(searchTerm, currentResults) {
    const searchResults = await this.searchEngine.search({
      index: 'relay-topics',
      body: {
        query: {
          multi_match: {
            query: searchTerm,
            fields: ['topicName^3', 'channelName^2', 'description'],
            fuzziness: 'AUTO',
            operator: 'and'
          }
        },
        highlight: {
          fields: {
            topicName: {},
            channelName: {},
            description: {}
          }
        }
      }
    });

    const matchingTopics = searchResults.body.hits.hits.map(hit => ({
      ...hit._source,
      searchScore: hit._score,
      highlights: hit.highlight
    }));

    currentResults.topics = matchingTopics;
    currentResults.totalResults = searchResults.body.hits.total.value;

    return currentResults;
  }

  /**
   * Filter by channel types (Global/Regional/Proximity)
   */
  async applyChannelTypeFilter(channelTypes, currentResults) {
    const allowedTypes = [];
    
    if (channelTypes.global) allowedTypes.push('GLOBAL');
    if (channelTypes.regional) allowedTypes.push('REGIONAL');
    if (channelTypes.proximity) allowedTypes.push('PROXIMITY');

    const filteredChannels = await this.db.channels.findByTypes(allowedTypes);
    const filteredTopics = currentResults.topics.filter(topic => 
      allowedTypes.includes(topic.channelType)
    );

    currentResults.channels = filteredChannels;
    currentResults.topics = filteredTopics;

    return currentResults;
  }

  /**
   * Filter by user types (Active/Inactive/Local/Foreign)
   */
  async applyUserTypeFilter(userTypes, currentResults) {
    const userFilters = {
      includeActive: userTypes.active,
      includeInactive: userTypes.inactive,
      includeLocal: userTypes.local,
      includeForeign: userTypes.foreign,
      includeVerified: userTypes.verified || true,
      includeUnverified: userTypes.unverified || false
    };

    // Filter topics based on user participation
    const filteredTopics = [];
    
    for (const topic of currentResults.topics) {
      const topicParticipants = await this.getTopicParticipants(topic.id);
      const filteredParticipants = this.filterParticipantsByType(topicParticipants, userFilters);
      
      if (filteredParticipants.length > 0) {
        topic.filteredParticipantCount = filteredParticipants.length;
        topic.totalParticipantCount = topicParticipants.length;
        filteredTopics.push(topic);
      }
    }

    currentResults.topics = filteredTopics;
    return currentResults;
  }

  /**
   * Apply reliability threshold filtering
   */
  async applyReliabilityFilter(threshold, currentResults) {
    const reliabilityService = require('./reliabilityScoreService');
    const filteredTopics = [];

    for (const topic of currentResults.topics) {
      const reliabilityData = await reliabilityService.calculateTopicReliability(topic.id);
      
      if (reliabilityData.overallTopic >= threshold) {
        topic.reliabilityScore = reliabilityData.overallTopic;
        topic.reliabilityClass = reliabilityService.getReliabilityClass(reliabilityData.overallTopic);
        filteredTopics.push(topic);
      }
    }

    currentResults.topics = filteredTopics;
    return currentResults;
  }

  /**
   * Filter by activity status (Ongoing/Ended/Starting Soon)
   */
  async applyActivityFilter(activityStatus, currentResults) {
    const now = Date.now();
    const filteredTopics = [];

    for (const topic of currentResults.topics) {
      let includeInResults = false;

      if (activityStatus.ongoing && topic.status === 'active' && topic.endTime > now) {
        includeInResults = true;
      }

      if (activityStatus.ended && topic.status === 'ended' && topic.endTime <= now) {
        includeInResults = true;
      }

      if (activityStatus.startingSoon && topic.status === 'scheduled' && 
          topic.startTime > now && topic.startTime <= (now + 7 * 24 * 60 * 60 * 1000)) {
        includeInResults = true;
      }

      if (includeInResults) {
        filteredTopics.push(topic);
      }
    }

    currentResults.topics = filteredTopics;
    return currentResults;
  }

  /**
   * Apply geographic scope filtering
   */
  async applyGeographicFilter(geographicScope, currentResults) {
    const filteredTopics = [];

    for (const topic of currentResults.topics) {
      let includeInResults = false;

      if (geographicScope.global && topic.scope === 'global') {
        includeInResults = true;
      }

      if (geographicScope.regional && topic.scope === 'regional') {
        if (!geographicScope.specificRegions || 
            geographicScope.specificRegions.includes(topic.regionId)) {
          includeInResults = true;
        }
      }

      if (geographicScope.proximity && topic.scope === 'proximity') {
        includeInResults = true;
      }

      if (includeInResults) {
        filteredTopics.push(topic);
      }
    }

    currentResults.topics = filteredTopics;
    return currentResults;
  }

  /**
   * Apply custom time range filtering
   */
  async applyTimeRangeFilter(timeRange, currentResults) {
    const { startDate, endDate } = timeRange;
    
    const filteredTopics = currentResults.topics.filter(topic => {
      const topicDate = new Date(topic.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return topicDate >= start && topicDate <= end;
    });

    currentResults.topics = filteredTopics;
    return currentResults;
  }

  /**
   * Sort filtered results by specified criteria
   */
  async applySorting(results, sortBy) {
    const sortingFunctions = {
      totalActivity: (a, b) => (b.totalVotes || 0) - (a.totalVotes || 0),
      reliability: (a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0),
      recentActivity: (a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0),
      alphabetical: (a, b) => (a.topicName || '').localeCompare(b.topicName || ''),
      endingSoon: (a, b) => (a.endTime || Infinity) - (b.endTime || Infinity),
      participantCount: (a, b) => (b.totalParticipantCount || 0) - (a.totalParticipantCount || 0)
    };

    if (sortingFunctions[sortBy]) {
      results.topics.sort(sortingFunctions[sortBy]);
      results.channels.sort(sortingFunctions[sortBy]);
    }

    return results;
  }

  /**
   * Channel-level specific filtering
   */
  async applyChannelFilters(channelId, filters) {
    const channel = await this.db.channels.findById(channelId);
    const topics = await this.db.topics.findByChannelId(channelId);

    const filteredTopics = [];

    for (const topic of topics) {
      // Apply all the same filters but scoped to this channel
      let includeInResults = true;

      // User type filtering
      if (filters.userTypes) {
        const participants = await this.getTopicParticipants(topic.id);
        const filteredParticipants = this.filterParticipantsByType(participants, filters.userTypes);
        if (filteredParticipants.length === 0) includeInResults = false;
      }

      // Reliability filtering
      if (filters.reliabilityThreshold) {
        const reliabilityService = require('./reliabilityScoreService');
        const reliabilityData = await reliabilityService.calculateTopicReliability(topic.id);
        if (reliabilityData.overallTopic < filters.reliabilityThreshold) includeInResults = false;
      }

      // Activity filtering
      if (filters.activityStatus) {
        const now = Date.now();
        let activityMatch = false;

        if (filters.activityStatus.ongoing && topic.status === 'active' && topic.endTime > now) {
          activityMatch = true;
        }
        if (filters.activityStatus.ended && topic.status === 'ended') {
          activityMatch = true;
        }
        if (filters.activityStatus.startingSoon && topic.status === 'scheduled') {
          activityMatch = true;
        }

        if (!activityMatch) includeInResults = false;
      }

      if (includeInResults) {
        filteredTopics.push(topic);
      }
    }

    return {
      channel: channel,
      topics: filteredTopics,
      appliedFilters: filters
    };
  }

  /**
   * Get participants for a topic
   */
  async getTopicParticipants(topicId) {
    const votes = await this.db.votes.findByTopicId(topicId);
    const uniqueVoterIds = [...new Set(votes.map(vote => vote.voterId))];
    
    const participants = [];
    for (const voterId of uniqueVoterIds) {
      const user = await this.db.users.findById(voterId);
      participants.push(user);
    }

    return participants;
  }

  /**
   * Filter participants by user type criteria
   */
  filterParticipantsByType(participants, userFilters) {
    return participants.filter(participant => {
      // Active/Inactive filtering
      if (userFilters.includeActive && participant.lastActiveAt > (Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        return true;
      }
      if (userFilters.includeInactive && participant.lastActiveAt <= (Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        return true;
      }

      // Local/Foreign filtering (would need geographic context)
      if (userFilters.includeLocal && participant.isLocal) {
        return true;
      }
      if (userFilters.includeForeign && !participant.isLocal) {
        return true;
      }

      // Verified/Unverified filtering
      if (userFilters.includeVerified && participant.proximityVerified) {
        return true;
      }
      if (userFilters.includeUnverified && !participant.proximityVerified) {
        return true;
      }

      return false;
    });
  }

  /**
   * Generate cache key for filter results
   */
  generateFilterCacheKey(filterRequest) {
    const keyComponents = [
      'filter',
      filterRequest.textSearch || '',
      JSON.stringify(filterRequest.userTypes || {}),
      JSON.stringify(filterRequest.channelTypes || {}),
      filterRequest.reliabilityThreshold || 0,
      JSON.stringify(filterRequest.activityStatus || {}),
      JSON.stringify(filterRequest.geographicScope || {}),
      filterRequest.sortBy || 'totalActivity'
    ];
    
    return keyComponents.join(':').replace(/[^a-zA-Z0-9:]/g, '_');
  }

  /**
   * Get filter statistics for UI display
   */
  async getFilterStatistics(filterRequest) {
    const results = await this.applyGlobalFilters(filterRequest);
    
    return {
      totalResults: results.totalResults,
      channelTypeBreakdown: this.calculateChannelTypeBreakdown(results.topics),
      reliabilityDistribution: this.calculateReliabilityDistribution(results.topics),
      activityStatusBreakdown: this.calculateActivityBreakdown(results.topics),
      averageParticipation: this.calculateAverageParticipation(results.topics)
    };
  }

  /**
   * Calculate channel type breakdown for statistics
   */
  calculateChannelTypeBreakdown(topics) {
    const breakdown = { GLOBAL: 0, REGIONAL: 0, PROXIMITY: 0 };
    
    topics.forEach(topic => {
      if (breakdown.hasOwnProperty(topic.channelType)) {
        breakdown[topic.channelType]++;
      }
    });

    return breakdown;
  }

  /**
   * Calculate reliability distribution for statistics
   */
  calculateReliabilityDistribution(topics) {
    const distribution = {
      excellent: 0, // 95-100%
      veryGood: 0,  // 85-94%
      good: 0,      // 75-84%
      fair: 0,      // 60-74%
      poor: 0       // <60%
    };

    topics.forEach(topic => {
      const reliability = topic.reliabilityScore || 0;
      if (reliability >= 95) distribution.excellent++;
      else if (reliability >= 85) distribution.veryGood++;
      else if (reliability >= 75) distribution.good++;
      else if (reliability >= 60) distribution.fair++;
      else distribution.poor++;
    });

    return distribution;
  }

  /**
   * Calculate activity status breakdown
   */
  calculateActivityBreakdown(topics) {
    const breakdown = { ongoing: 0, ended: 0, startingSoon: 0 };
    const now = Date.now();

    topics.forEach(topic => {
      if (topic.status === 'active' && topic.endTime > now) {
        breakdown.ongoing++;
      } else if (topic.status === 'ended') {
        breakdown.ended++;
      } else if (topic.status === 'scheduled') {
        breakdown.startingSoon++;
      }
    });

    return breakdown;
  }

  /**
   * Calculate average participation across filtered topics
   */
  calculateAverageParticipation(topics) {
    if (topics.length === 0) return 0;
    
    const totalParticipation = topics.reduce((sum, topic) => 
      sum + (topic.totalParticipantCount || 0), 0
    );
    
    return Math.round(totalParticipation / topics.length);
  }
}

module.exports = ComprehensiveFilterService;
