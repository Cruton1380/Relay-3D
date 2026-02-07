// backend/database/repositories/FilterRepository.mjs

import { getRepository } from './RepositoryFactory.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../../utils/common/errors.mjs';

const filterLogger = logger.child({ module: 'filter-repository' });

/**
 * Filter Repository for managing community filters and votes
 */
export class FilterRepository {
  constructor() {
    this.filtersRepo = getRepository('community_filters');
    this.votesRepo = getRepository('filter_votes');
  }

  /**
   * Initialize both repositories
   */
  async initialize() {
    await Promise.all([
      this.filtersRepo.initialize(),
      this.votesRepo.initialize()
    ]);
  }

  /**
   * Get active community filters with vote counts
   * @returns {Promise<Object>} Filters with vote data
   */
  async getCommunityFiltersWithVotes() {
    try {
      // Get active filters
      const filtersResult = await this.filtersRepo.findAll({ status: 'active' });
      const filters = filtersResult.data || [];

      // Get vote counts for each filter
      const filterVotes = {};
      
      for (const filter of filters) {
        const votes = await this.votesRepo.aggregate([
          { $match: { filterId: filter.id } },
          {
            $group: {
              _id: '$voteType',
              count: { $sum: 1 }
            }
          }
        ]);

        filterVotes[filter.id] = {
          upvotes: votes.find(v => v._id === 'up')?.count || 0,
          downvotes: votes.find(v => v._id === 'down')?.count || 0
        };
      }

      return {
        filters: filters.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          criteria: f.criteria,
          createdBy: f.createdBy,
          createdAt: f.createdAt
        })),
        votes: filterVotes
      };
    } catch (error) {
      filterLogger.error('Failed to get community filters with votes', {
        error: error.message
      });
      throw createError('internal', 'Failed to fetch filters with votes');
    }
  }

  /**
   * Vote for a filter
   * @param {string} filterId - Filter ID
   * @param {string} userId - User ID
   * @param {string} voteType - Vote type ('up' or 'down')
   * @returns {Promise<Object>} Updated vote counts
   */
  async voteForFilter(filterId, userId, voteType) {
    if (!['up', 'down'].includes(voteType)) {
      throw createError('validation', 'Invalid vote type');
    }

    try {
      // Check if user already voted
      const existingVote = await this.votesRepo.findByField('userId', userId);
      const existingFilterVote = existingVote && existingVote.filterId === filterId ? existingVote : null;

      if (existingFilterVote) {
        // Update existing vote
        await this.votesRepo.update(existingFilterVote.id, {
          voteType,
          updatedAt: new Date()
        });
      } else {
        // Create new vote
        await this.votesRepo.create({
          filterId,
          userId,
          voteType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Return updated vote counts
      const votes = await this.votesRepo.aggregate([
        { $match: { filterId } },
        {
          $group: {
            _id: '$voteType',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        upvotes: votes.find(v => v._id === 'up')?.count || 0,
        downvotes: votes.find(v => v._id === 'down')?.count || 0
      };
    } catch (error) {
      filterLogger.error('Failed to vote for filter', {
        filterId,
        userId,
        voteType,
        error: error.message
      });
      throw createError('internal', 'Failed to process vote');
    }
  }

  /**
   * Create a new community filter
   * @param {Object} filterData - Filter data
   * @returns {Promise<Object>} Created filter
   */
  async createFilter(filterData) {
    const { name, description, criteria, createdBy } = filterData;

    if (!name || !criteria) {
      throw createError('validation', 'Name and criteria are required');
    }

    // Validate criteria JSON
    try {
      JSON.parse(criteria);
    } catch (e) {
      throw createError('validation', 'Invalid criteria JSON format');
    }

    try {
      const newFilter = {
        name,
        description: description || '',
        criteria,
        createdBy,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.filtersRepo.create(newFilter);
      
      return {
        id: result.id,
        ...newFilter
      };
    } catch (error) {
      filterLogger.error('Failed to create filter', {
        filterData,
        error: error.message
      });
      throw createError('internal', 'Failed to create filter');
    }
  }

  /**
   * Apply filters to data
   * @param {Array<string>} filterIds - Filter IDs to apply
   * @param {string} dataType - Data type to filter
   * @param {Object} baseRepo - Repository for the data type
   * @returns {Promise<Object>} Filtered data
   */
  async applyFilters(filterIds, dataType, baseRepo) {
    if (!filterIds || !Array.isArray(filterIds)) {
      throw createError('validation', 'Filter IDs must be an array');
    }

    try {
      // Fetch filter criteria
      const filters = [];
      for (const filterId of filterIds) {
        const filter = await this.filtersRepo.findById(filterId);
        if (filter && filter.status === 'active') {
          filters.push(filter);
        }
      }

      // Build combined query from all filters
      let query = {};
      
      for (const filter of filters) {
        const criteria = JSON.parse(filter.criteria);
        
        // Merge filter criteria into query
        Object.keys(criteria).forEach(key => {
          if (criteria[key].min !== undefined) {
            query[key] = { ...query[key], $gte: criteria[key].min };
          }
          if (criteria[key].max !== undefined) {
            query[key] = { ...query[key], $lte: criteria[key].max };
          }
          if (typeof criteria[key] === 'string' || Array.isArray(criteria[key])) {
            query[key] = criteria[key];
          }
        });
      }

      // Apply the combined query to the data
      const result = await baseRepo.findAll(query);
      const filteredData = result.data || [];

      return {
        filteredData,
        appliedFilters: filters.map(f => ({
          id: f.id,
          name: f.name
        })),
        totalCount: filteredData.length
      };
    } catch (error) {
      filterLogger.error('Failed to apply filters', {
        filterIds,
        dataType,
        error: error.message
      });
      throw createError('internal', 'Failed to apply filters');
    }
  }
}

// Create singleton instance
const filterRepository = new FilterRepository();
export default filterRepository;
