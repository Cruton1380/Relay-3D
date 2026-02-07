/**
 * Vote WebSocket Adapter
 * Handles vote-related WebSocket messages and state management
 */

import EventEmitter from 'events';

class VoteAdapter extends EventEmitter {
  constructor() {
    super();
    this.voteState = {
      activeTopics: new Map(),
      userVotes: new Map(),
      results: new Map(),
      rankings: new Map()
    };
    this.debounceTimers = new Map();
  }
  
  /**
   * Handle incoming vote-related messages
   * @param {object} message - WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'vote_cast':
        this.handleVoteCast(message);
        break;
      case 'vote_update':
        this.handleVoteUpdate(message);
        break;
      case 'topic_created':
        this.handleTopicCreated(message);
        break;
      case 'topic_closed':
        this.handleTopicClosed(message);
        break;
      case 'ranking_update':
        this.handleRankingUpdate(message);
        break;
      case 'vote_results':
        this.handleVoteResults(message);
        break;
      default:
        console.warn(`[VoteAdapter] Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Cast a vote for a topic
   * @param {string} topicId - Topic identifier
   * @param {number} choice - Vote choice (0 or 1)
   * @param {string} signature - Cryptographic signature
   * @returns {object} Vote data for sending
   */
  castVote(topicId, choice, signature) {
    const voteData = {
      domain: 'vote',
      type: 'cast_vote',
      topicId,
      choice,
      signature,
      timestamp: Date.now()
    };
    
    // Update local state optimistically
    this.voteState.userVotes.set(topicId, {
      choice,
      signature,
      timestamp: voteData.timestamp,
      pending: true
    });
    
    this.emit('vote_cast_local', { topicId, choice, pending: true });
    
    return voteData;
  }
  
  /**
   * Subscribe to topic updates
   * @param {string} topicId - Topic to subscribe to
   * @returns {object} Subscription message
   */
  subscribeToTopic(topicId) {
    return {
      domain: 'vote',
      type: 'subscribe_topic',
      topicId
    };
  }
  
  /**
   * Unsubscribe from topic updates
   * @param {string} topicId - Topic to unsubscribe from
   * @returns {object} Unsubscription message
   */
  unsubscribeFromTopic(topicId) {
    return {
      domain: 'vote',
      type: 'unsubscribe_topic',
      topicId
    };
  }
  
  /**
   * Get current vote state for a topic
   * @param {string} topicId - Topic identifier
   * @returns {object|null} Vote state
   */
  getTopicState(topicId) {
    return this.voteState.activeTopics.get(topicId) || null;
  }
  
  /**
   * Get user's vote for a topic
   * @param {string} topicId - Topic identifier
   * @returns {object|null} User vote
   */
  getUserVote(topicId) {
    return this.voteState.userVotes.get(topicId) || null;
  }
  
  /**
   * Get vote results for a topic
   * @param {string} topicId - Topic identifier
   * @returns {object|null} Vote results
   */
  getResults(topicId) {
    return this.voteState.results.get(topicId) || null;
  }
  
  /**
   * Get ranking data for topics
   * @returns {Map} Topic rankings
   */
  getRankings() {
    return this.voteState.rankings;
  }
  
  // Private message handlers
  
  handleVoteCast(message) {
    const { topicId, userId, choice, signature, timestamp } = message;
    
    // Update local state if this is our vote
    if (message.isCurrentUser) {
      const existingVote = this.voteState.userVotes.get(topicId);
      if (existingVote) {
        existingVote.pending = false;
        existingVote.confirmed = true;
      }
    }
    
    this.emit('vote_cast_confirmed', {
      topicId,
      userId,
      choice,
      signature,
      timestamp,
      isCurrentUser: message.isCurrentUser
    });
  }
  
  handleVoteUpdate(message) {
    const { topicId, voteCount, distribution } = message;
    
    // Debounce rapid updates to prevent UI flickering
    this.debounceUpdate(topicId, () => {
      // Update topic state
      if (this.voteState.activeTopics.has(topicId)) {
        const topic = this.voteState.activeTopics.get(topicId);
        topic.voteCount = voteCount;
        topic.distribution = distribution;
        topic.lastUpdate = Date.now();
      }
      
      this.emit('vote_update', {
        topicId,
        voteCount,
        distribution,
        timestamp: Date.now()
      });
    }, 1000); // 1 second debounce as per requirements
  }
  
  handleTopicCreated(message) {
    const { topicId, title, description, creator, expiresAt } = message;
    
    this.voteState.activeTopics.set(topicId, {
      id: topicId,
      title,
      description,
      creator,
      expiresAt,
      voteCount: 0,
      distribution: { 0: 0, 1: 0 },
      createdAt: Date.now(),
      status: 'active'
    });
    
    this.emit('topic_created', {
      topicId,
      title,
      description,
      creator,
      expiresAt
    });
  }
  
  handleTopicClosed(message) {
    const { topicId, finalResults, winner } = message;
    
    if (this.voteState.activeTopics.has(topicId)) {
      const topic = this.voteState.activeTopics.get(topicId);
      topic.status = 'closed';
      topic.finalResults = finalResults;
      topic.winner = winner;
    }
    
    this.emit('topic_closed', {
      topicId,
      finalResults,
      winner
    });
  }
  
  handleRankingUpdate(message) {
    const { rankings, timestamp } = message;
    
    // Debounce ranking updates
    this.debounceUpdate('rankings', () => {
      this.voteState.rankings.clear();
      rankings.forEach((ranking, index) => {
        this.voteState.rankings.set(ranking.topicId, {
          ...ranking,
          position: index + 1
        });
      });
      
      this.emit('ranking_update', {
        rankings: Array.from(this.voteState.rankings.values()),
        timestamp
      });
    }, 2000); // 2 second debounce for rankings
  }
  
  handleVoteResults(message) {
    const { topicId, results, timestamp } = message;
    
    this.voteState.results.set(topicId, {
      ...results,
      timestamp
    });
    
    this.emit('vote_results', {
      topicId,
      results,
      timestamp
    });
  }
  
  debounceUpdate(key, callback, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }
  
  /**
   * Clear all state (useful for logout)
   */
  clearState() {
    this.voteState.activeTopics.clear();
    this.voteState.userVotes.clear();
    this.voteState.results.clear();
    this.voteState.rankings.clear();
    
    // Clear any pending debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.emit('state_cleared');
  }
}

export default VoteAdapter;
