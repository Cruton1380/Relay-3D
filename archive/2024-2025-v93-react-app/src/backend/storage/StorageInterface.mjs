/**
 * Storage Interface for Voter Data
 * 
 * Provides a consistent API for different storage backends:
 * - InMemoryStorage: Fast, dev-friendly, limited to ~100k voters
 * - RedisStorage: Fast, persistent, good for 100k-1M voters
 * - PostgresStorage: Scalable, spatial indexing, handles millions
 * 
 * All implementations must support:
 * - Spatial queries (bounding box)
 * - Pagination
 * - Efficient lookups
 */

export class StorageInterface {
  /**
   * Initialize storage connection
   * @param {Object} config - Storage-specific configuration
   */
  async init(config = {}) {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Close storage connection and cleanup
   */
  async close() {
    throw new Error('close() must be implemented by subclass');
  }

  /**
   * Insert single voter
   * @param {Object} voter - Voter data
   * @param {string} voter.userId - Unique user ID
   * @param {string} voter.candidateId - Candidate ID
   * @param {string} voter.channelId - Channel/topic ID
   * @param {string} voter.privacyLevel - 'gps', 'city', 'province', 'anonymous'
   * @param {Object} voter.location - Location data
   * @param {number} voter.location.lat - Latitude
   * @param {number} voter.location.lng - Longitude
   * @param {string} [voter.location.city] - City name
   * @param {string} [voter.location.province] - Province/state
   * @param {string} [voter.location.country] - Country name
   * @returns {Promise<boolean>} Success status
   */
  async insertVoter(voter) {
    throw new Error('insertVoter() must be implemented by subclass');
  }

  /**
   * Bulk insert voters (optimized)
   * @param {Array<Object>} voters - Array of voter objects
   * @returns {Promise<number>} Number of voters inserted
   */
  async insertVoters(voters) {
    throw new Error('insertVoters() must be implemented by subclass');
  }

  /**
   * Get voters within bounding box
   * @param {Object} query
   * @param {string} query.candidateId - Candidate ID
   * @param {Object} query.bbox - Bounding box {minLat, maxLat, minLng, maxLng}
   * @param {number} [query.limit=1000] - Max results
   * @param {number} [query.offset=0] - Pagination offset
   * @param {string} [query.privacyLevel] - Filter by privacy level
   * @returns {Promise<Array<Object>>} Array of voters
   */
  async getVotersByBBox(query) {
    throw new Error('getVotersByBBox() must be implemented by subclass');
  }

  /**
   * Get voter by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Voter data or null
   */
  async getVoterById(userId) {
    throw new Error('getVoterById() must be implemented by subclass');
  }

  /**
   * Count voters matching criteria
   * @param {Object} query
   * @param {string} [query.candidateId] - Candidate ID
   * @param {string} [query.channelId] - Channel ID
   * @param {string} [query.privacyLevel] - Privacy level
   * @param {Object} [query.bbox] - Bounding box
   * @returns {Promise<number>} Count of matching voters
   */
  async count(query = {}) {
    throw new Error('count() must be implemented by subclass');
  }

  /**
   * Stream voters by bounding box (for large datasets)
   * @param {Object} query - Same as getVotersByBBox
   * @param {Function} callback - Called for each batch: callback(voters)
   * @param {number} [batchSize=1000] - Batch size
   * @returns {Promise<number>} Total voters streamed
   */
  async streamByBBox(query, callback, batchSize = 1000) {
    throw new Error('streamByBBox() must be implemented by subclass');
  }

  /**
   * Delete voter by user ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteVoter(userId) {
    throw new Error('deleteVoter() must be implemented by subclass');
  }

  /**
   * Clear all voters (for testing)
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    throw new Error('clear() must be implemented by subclass');
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Stats {totalVoters, memoryUsage, etc}
   */
  async getStats() {
    throw new Error('getStats() must be implemented by subclass');
  }
}

