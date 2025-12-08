/**
 * @fileoverview Activity Analysis Service - Analyzes user activity patterns
 * @module ActivityAnalysisService
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

import { BaseService } from '../utils/BaseService.mjs';
import { userRepository } from '../database/userRepository.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Activity Analysis Service - Manages user activity metrics and patterns
 * @class ActivityAnalysisService
 * @extends BaseService
 */
export class ActivityAnalysisService extends BaseService {
  /**
   * Creates an instance of ActivityAnalysisService
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super('ActivityAnalysisService', {
      logger: logger.child({ module: 'activity-analysis-service' }),
      ...options
    });
    
    /** @type {Object} Activity metrics cache */
    this.activityCache = {
      lastCalculated: null,
      averageMonthlyActivity: 0,
      standardDeviation: 0,
      activityPercentiles: {},
      recalculationNeeded: true
    };
    
    /** @type {number} Cache duration in milliseconds */
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    this.logger.info('ActivityAnalysisService: Initialized');
  }

  /**
   * Initialize the activity analysis service
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  async initialize() {
    try {
      this.logger.info('ActivityAnalysisService: Initializing...');
      
      // Pre-calculate activity metrics if needed
      await this.getActivityMetrics();
      
      this.logger.info('ActivityAnalysisService: Initialized successfully');
      this.updateMetrics('activity');
      
    } catch (error) {
      this.handleError(error, 'initialization');
    }
  }

  /**
   * Get activity metrics (public interface)
   * @returns {Promise<Object>} Activity metrics
   */
  async getActivityMetrics() {
    try {
      this.updateMetrics('request');
      
      if (this.shouldRecalculate()) {
        await this.calculateActivityMetrics();
      }
      
      return this.activityCache;
    } catch (error) {
      this.handleError(error, 'getting activity metrics');
    }
  }

  /**
   * Check if activity metrics need recalculation
   * @private
   * @returns {boolean} True if recalculation is needed
   */
  shouldRecalculate() {
    return (
      this.activityCache.recalculationNeeded ||
      !this.activityCache.lastCalculated ||
      Date.now() - this.activityCache.lastCalculated > this.CACHE_DURATION
    );
  }

  /**
   * Calculate activity metrics with error handling
   * @private
   * @returns {Promise<void>}
   */
  async calculateActivityMetrics() {
    try {
      this.logger.info('ActivityAnalysisService: Calculating activity metrics...');
      
      const users = await userRepository.getAllUsers();
      const monthlyActivities = users.map(user => this.getMonthlyActivity(user));
      
      // Calculate average
      const average = monthlyActivities.reduce((sum, val) => sum + val, 0) / monthlyActivities.length;
      
      // Calculate standard deviation
      const squaredDiffs = monthlyActivities.map(value => Math.pow(value - average, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate percentiles
      const sortedActivities = [...monthlyActivities].sort((a, b) => a - b);
      const percentiles = {};
      
      [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(percentile => {
        const index = Math.floor(sortedActivities.length * (percentile / 100));
        percentiles[percentile] = sortedActivities[index];
      });
      
      this.activityCache = {
        lastCalculated: Date.now(),
        averageMonthlyActivity: average,
        standardDeviation: stdDev,
        activityPercentiles: percentiles,
        recalculationNeeded: false
      };
      
      this.logger.info('ActivityAnalysisService: Activity metrics calculated', { 
        average, 
        standardDeviation: stdDev, 
        userCount: users.length 
      });
      
    } catch (error) {
      this.updateMetrics('error');
      this.handleError(error, 'calculating activity metrics');
    }
  }
  
  /**
   * Get monthly activity for a user
   * @private
   * @param {Object} user - User object
   * @returns {number} Monthly activity score
   */
  getMonthlyActivity(user) {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    if (!user.activityHistory) {
      return 0;
    }
    
    return user.activityHistory
      .filter(activity => activity.timestamp > thirtyDaysAgo)
      .reduce((sum, activity) => sum + (activity.weight || 1), 0);
  }

  /**
   * Get user activity score
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User activity analysis
   */
  async getUserActivityScore(userId) {
    try {
      this.updateMetrics('request');
      
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      const userActivity = this.getMonthlyActivity(user);
      const metrics = await this.getActivityMetrics();
      
      // Calculate percentile ranking
      let percentile = 0;
      for (const [p, value] of Object.entries(metrics.activityPercentiles)) {
        if (userActivity >= value) {
          percentile = parseInt(p);
        }
      }
      
      return {
        userId,
        monthlyActivity: userActivity,
        percentile,
        relativeToAverage: userActivity / metrics.averageMonthlyActivity,
        isAboveAverage: userActivity > metrics.averageMonthlyActivity,
        standardDeviations: (userActivity - metrics.averageMonthlyActivity) / metrics.standardDeviation
      };
    } catch (error) {
      this.handleError(error, 'getting user activity score');
    }
  }

  /**
   * Perform health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Check if cache is valid
      const cacheAge = this.activityCache.lastCalculated 
        ? Date.now() - this.activityCache.lastCalculated 
        : null;
      
      // Check database connectivity
      await userRepository.getAllUsers();
      
      return {
        status: 'healthy',
        cacheStatus: {
          lastCalculated: this.activityCache.lastCalculated,
          cacheAge,
          needsRecalculation: this.shouldRecalculate()
        },
        metrics: {
          averageActivity: this.activityCache.averageMonthlyActivity,
          standardDeviation: this.activityCache.standardDeviation
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        cacheStatus: {
          lastCalculated: this.activityCache.lastCalculated,
          needsRecalculation: this.shouldRecalculate()
        }
      };
    }
  }

  /**
   * Shutdown cleanup
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('ActivityAnalysisService: Shutting down...');
    
    try {
      // Clear cache to prevent memory leaks
      this.activityCache = {
        lastCalculated: null,
        averageMonthlyActivity: 0,
        standardDeviation: 0,
        activityPercentiles: {},
        recalculationNeeded: true
      };
      
      this.logger.info('ActivityAnalysisService: Shutdown complete');
    } catch (error) {
      this.logger.error('ActivityAnalysisService: Error during shutdown:', error);
      throw error;
    }
  }
}

/**
 * Create and export service instance
 */
const activityAnalysisService = new ActivityAnalysisService();
export default activityAnalysisService;
