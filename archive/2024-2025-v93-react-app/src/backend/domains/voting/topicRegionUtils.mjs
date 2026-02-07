/**
 * Topic Region Utilities
 * Utility functions for managing topic-region associations
 * Extracted to break circular dependencies between votingEngine and voteValidator
 */

// Track which region a topic belongs to
const topicRegions = new Map();

/**
 * Get a topic's region
 * @param {string} topic - Topic ID
 * @returns {string} Region ID
 */
export function getTopicRegion(topic) {
  return topicRegions.get(topic) || 'global';
}

/**
 * Set a topic's region
 * @param {string} topic - Topic ID
 * @param {string} regionId - Region ID
 */
export function setTopicRegion(topic, regionId) {
  topicRegions.set(topic, regionId);
}

/**
 * Clear all topic regions (useful for tests)
 */
export function clearTopicRegions() {
  topicRegions.clear();
}

/**
 * Get all topic regions
 * @returns {Map} Map of topic -> region mappings
 */
export function getAllTopicRegions() {
  return new Map(topicRegions);
}

export default {
  getTopicRegion,
  setTopicRegion,
  clearTopicRegions,
  getAllTopicRegions
};
