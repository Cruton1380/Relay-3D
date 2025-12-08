// backend/database/interfaces/RepositoryInterface.mjs

/**
 * Repository Interface defining standard CRUD operations
 * This interface ensures consistency between different storage implementations
 */
export class RepositoryInterface {
  /**
   * Initialize the repository
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('Not implemented: initialize()');
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} Created entity
   */
  async create(data) {
    throw new Error('Not implemented: create()');
  }

  /**
   * Find an entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Found entity or null
   */
  async findById(id) {
    throw new Error('Not implemented: findById()');
  }

  /**
   * Find an entity by specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Promise<Object|null>} Found entity or null
   */
  async findByField(field, value) {
    throw new Error('Not implemented: findByField()');
  }

  /**
   * Find multiple entities by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (pagination, sorting, etc.)
   * @returns {Promise<Object>} Result with data and pagination info
   */
  async findAll(criteria = {}, options = {}) {
    throw new Error('Not implemented: findAll()');
  }

  /**
   * Update an entity
   * @param {string} id - Entity ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated entity
   */
  async update(id, data) {
    throw new Error('Not implemented: update()');
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    throw new Error('Not implemented: delete()');
  }

  /**
   * Count entities by criteria
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Count of matching entities
   */
  async count(criteria = {}) {
    throw new Error('Not implemented: count()');
  }

  /**
   * Check if an entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Existence status
   */
  async exists(id) {
    throw new Error('Not implemented: exists()');
  }

  /**
   * Perform aggregation operations
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    throw new Error('Not implemented: aggregate()');
  }

  /**
   * Execute a transaction
   * @param {Function} transactionFn - Function to execute within transaction
   * @returns {Promise<any>} Transaction result
   */
  async transaction(transactionFn) {
    throw new Error('Not implemented: transaction()');
  }

  /**
   * Get collection/table name
   * @returns {string} Collection name
   */
  getCollectionName() {
    throw new Error('Not implemented: getCollectionName()');
  }
}

export default RepositoryInterface;
