import { BaseRepository } from './baseRepository.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';

const voteLogger = logger.child({ module: 'vote-repository' });

class VoteRepository extends BaseRepository {
  constructor() {
    super('votes');
    this.indexedFields = new Set();
    this.indexedFields.add('userId');
    this.indexedFields.add('topic');
    this.indexedFields.add('regionId');
  }

  /**
   * Find votes by user ID
   * @param {string} userId - User's ID
   * @returns {Promise<Array>} Array of votes
   */
  async findByUserId(userId) {
    if (!userId) {
      throw createError('validation', 'User ID is required');
    }

    await this.ensureInitialized();

    try {
      if (this.indices.has('userId')) {
        return Array.from(this.indices.get('userId').get(userId) || []);
      }

      // Fallback to scan
      return this.data.filter(vote => vote.userId === userId);
    } catch (error) {
      voteLogger.error('Error finding votes by user ID:', error);
      throw createError('database', 'Failed to find votes by user ID');
    }
  }

  /**
   * Find votes by topic
   * @param {string} topic - Topic name
   * @returns {Promise<Array>} Array of votes
   */
  async findByTopic(topic) {
    if (!topic) {
      throw createError('validation', 'Topic is required');
    }

    await this.ensureInitialized();

    try {
      if (this.indices.has('topic')) {
        return Array.from(this.indices.get('topic').get(topic) || []);
      }

      // Fallback to scan
      return this.data.filter(vote => vote.topic === topic);
    } catch (error) {
      voteLogger.error('Error finding votes by topic:', error);
      throw createError('database', 'Failed to find votes by topic');
    }
  }

  /**
   * Find votes by region ID
   * @param {string} regionId - Region ID
   * @returns {Promise<Array>} Array of votes
   */
  async findByRegionId(regionId) {
    if (!regionId) {
      throw createError('validation', 'Region ID is required');
    }

    await this.ensureInitialized();

    try {
      if (this.indices.has('regionId')) {
        return Array.from(this.indices.get('regionId').get(regionId) || []);
      }

      // Fallback to scan
      return this.data.filter(vote => vote.regionId === regionId);
    } catch (error) {
      voteLogger.error('Error finding votes by region ID:', error);
      throw createError('database', 'Failed to find votes by region ID');
    }
  }

  /**
   * Find a specific vote by user and topic
   * @param {string} userId - User's ID
   * @param {string} topic - Topic name
   * @returns {Promise<Object|null>} Vote or null if not found
   */
  async findByUserAndTopic(userId, topic) {
    if (!userId || !topic) {
      throw createError('validation', 'User ID and topic are required');
    }

    await this.ensureInitialized();

    try {
      return this.data.find(vote => vote.userId === userId && vote.topic === topic) || null;
    } catch (error) {
      voteLogger.error('Error finding vote by user and topic:', error);
      throw createError('database', 'Failed to find vote by user and topic');
    }
  }

  /**
   * Store a new vote
   * @param {Object} voteData - Vote data
   * @returns {Promise<Object>} Stored vote
   */
  async create(voteData) {
    if (!voteData.userId || !voteData.topic || !voteData.choice) {
      throw createError('validation', 'User ID, topic, and choice are required');
    }

    await this.ensureInitialized();

    try {
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const vote = {
        id: voteId,
        userId: voteData.userId,
        topic: voteData.topic,
        choice: voteData.choice,
        voteType: voteData.voteType || 'standard',
        regionId: voteData.regionId,
        timestamp: voteData.timestamp || Date.now(),
        signature: voteData.signature,
        metadata: voteData.metadata || {}
      };

      // Check for duplicate vote
      const existingVote = await this.findByUserAndTopic(vote.userId, vote.topic);
      if (existingVote) {
        throw createError('validation', 'User has already voted on this topic');
      }

      // Store the vote
      await this.save(vote);
      
      voteLogger.info(`Vote stored: ${voteId} for user ${vote.userId} on topic ${vote.topic}`);
      return vote;
    } catch (error) {
      voteLogger.error('Error creating vote:', error);
      throw createError('database', 'Failed to create vote');
    }
  }

  /**
   * Update an existing vote
   * @param {string} voteId - Vote ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated vote
   */
  async update(voteId, updateData) {
    if (!voteId) {
      throw createError('validation', 'Vote ID is required');
    }

    await this.ensureInitialized();

    try {
      const existingVote = await this.findById(voteId);
      if (!existingVote) {
        throw createError('not_found', 'Vote not found');
      }

      const updatedVote = {
        ...existingVote,
        ...updateData,
        updatedAt: Date.now()
      };

      await this.save(updatedVote);
      
      voteLogger.info(`Vote updated: ${voteId}`);
      return updatedVote;
    } catch (error) {
      voteLogger.error('Error updating vote:', error);
      throw createError('database', 'Failed to update vote');
    }
  }

  /**
   * Delete a vote
   * @param {string} voteId - Vote ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(voteId) {
    if (!voteId) {
      throw createError('validation', 'Vote ID is required');
    }

    await this.ensureInitialized();

    try {
      const result = await this.remove(voteId);
      
      if (result) {
        voteLogger.info(`Vote deleted: ${voteId}`);
      }
      
      return result;
    } catch (error) {
      voteLogger.error('Error deleting vote:', error);
      throw createError('database', 'Failed to delete vote');
    }
  }

  /**
   * Get vote statistics for a topic
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Vote statistics
   */
  async getTopicStatistics(topic) {
    if (!topic) {
      throw createError('validation', 'Topic is required');
    }

    try {
      const votes = await this.findByTopic(topic);
      
      const stats = {
        totalVotes: votes.length,
        choices: {},
        voteTypes: {},
        regions: {}
      };

      votes.forEach(vote => {
        // Count choices
        stats.choices[vote.choice] = (stats.choices[vote.choice] || 0) + 1;
        
        // Count vote types
        stats.voteTypes[vote.voteType] = (stats.voteTypes[vote.voteType] || 0) + 1;
        
        // Count regions
        if (vote.regionId) {
          stats.regions[vote.regionId] = (stats.regions[vote.regionId] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      voteLogger.error('Error getting topic statistics:', error);
      throw createError('database', 'Failed to get topic statistics');
    }
  }
}

// Create and export singleton instance
const voteRepository = new VoteRepository();

export { voteRepository };
export default voteRepository;
