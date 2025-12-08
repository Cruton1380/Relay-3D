// backend/database/repositories/TutorialRepository.mjs

import { getRepository } from './RepositoryFactory.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../../utils/common/errors.mjs';

const tutorialLogger = logger.child({ module: 'tutorial-repository' });

/**
 * Tutorial Repository for managing user tutorial data and analytics
 */
export class TutorialRepository {
  constructor() {
    this.tutorialsRepo = getRepository('user_tutorials');
    this.analyticsRepo = getRepository('tutorial_analytics');
    this.interactionsRepo = getRepository('tutorial_interactions');
  }

  /**
   * Initialize all repositories
   */
  async initialize() {
    await Promise.all([
      this.tutorialsRepo.initialize(),
      this.analyticsRepo.initialize(),
      this.interactionsRepo.initialize()
    ]);
  }

  /**
   * Get user tutorial status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Tutorial status
   */
  async getUserTutorialStatus(userId) {
    try {
      const tutorialRecord = await this.tutorialsRepo.findByField('userId', userId);

      return {
        hasSeenTutorial: !!tutorialRecord?.completedAt,
        completedAt: tutorialRecord?.completedAt,
        interactionData: tutorialRecord?.interactionData || {}
      };
    } catch (error) {
      tutorialLogger.error('Failed to get tutorial status', {
        userId,
        error: error.message
      });
      throw createError('internal', 'Failed to get tutorial status');
    }
  }

  /**
   * Mark tutorial as complete
   * @param {string} userId - User ID
   * @param {Date} completedAt - Completion timestamp
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<Object>} Success status
   */
  async completeTutorial(userId, completedAt, interactionData) {
    try {
      // Update or create tutorial record
      const existingRecord = await this.tutorialsRepo.findByField('userId', userId);
      
      const tutorialData = {
        userId,
        completedAt: new Date(completedAt),
        interactionData,
        updatedAt: new Date()
      };

      if (existingRecord) {
        await this.tutorialsRepo.update(existingRecord.id, tutorialData);
      } else {
        await this.tutorialsRepo.create(tutorialData);
      }

      // Log tutorial completion for analytics
      await this.analyticsRepo.create({
        userId,
        completedAt: new Date(completedAt),
        interactionData,
        totalSteps: Object.keys(interactionData).length,
        createdAt: new Date()
      });

      return { success: true };
    } catch (error) {
      tutorialLogger.error('Failed to mark tutorial as complete', {
        userId,
        error: error.message
      });
      throw createError('internal', 'Failed to complete tutorial');
    }
  }

  /**
   * Get tutorial analytics
   * @param {Object} userContext - User context for authorization
   * @returns {Promise<Object>} Analytics data
   */
  async getTutorialAnalytics(userContext) {
    // Check admin access
    if (userContext.authLevel !== 'admin' && userContext.authLevel !== 'superuser') {
      throw createError('forbidden', 'Admin access required');
    }

    try {
      // Get total users count (this would need a users repository)
      const usersRepo = getRepository('users');
      const totalUsers = await usersRepo.count();

      // Get completed tutorials count
      const completedTutorials = await this.tutorialsRepo.count({
        completedAt: { $ne: null }
      });

      // Get step-by-step analytics (simplified for file storage)
      const analyticsData = await this.analyticsRepo.findAll();
      const allAnalytics = analyticsData.data || [];

      // Process step analytics
      const stepAnalytics = new Map();
      
      allAnalytics.forEach(record => {
        if (record.interactionData) {
          Object.entries(record.interactionData).forEach(([stepKey, stepData]) => {
            if (!stepAnalytics.has(stepKey)) {
              stepAnalytics.set(stepKey, {
                _id: stepKey,
                totalTime: 0,
                count: 0,
                skipCount: 0
              });
            }
            
            const stats = stepAnalytics.get(stepKey);
            stats.count++;
            stats.totalTime += stepData.timeSpent || 0;
            if (stepData.skip_tutorial) {
              stats.skipCount++;
            }
          });
        }
      });

      const stepAnalyticsArray = Array.from(stepAnalytics.values()).map(stats => ({
        _id: stats._id,
        averageTimeSpent: stats.count > 0 ? stats.totalTime / stats.count : 0,
        completionRate: stats.count,
        skipRate: stats.skipCount
      }));

      // Get recent completions
      const recentCompletions = allAnalytics
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 50)
        .map(r => ({
          userId: r.userId,
          completedAt: r.completedAt,
          totalSteps: r.totalSteps
        }));

      return {
        overview: {
          totalUsers,
          completedTutorials,
          completionRate: totalUsers > 0 ? (completedTutorials / totalUsers) * 100 : 0
        },
        stepAnalytics: stepAnalyticsArray,
        recentCompletions
      };
    } catch (error) {
      tutorialLogger.error('Failed to get tutorial analytics', {
        error: error.message
      });
      throw createError('internal', 'Failed to get analytics');
    }
  }

  /**
   * Log tutorial interaction
   * @param {string} userId - User ID
   * @param {string} stepId - Step ID
   * @param {string} action - Action performed
   * @param {Object} data - Interaction data
   * @returns {Promise<Object>} Success status
   */
  async logInteraction(userId, stepId, action, data) {
    try {
      await this.interactionsRepo.create({
        userId,
        stepId,
        action,
        data,
        timestamp: new Date()
      });

      return { success: true };
    } catch (error) {
      tutorialLogger.error('Failed to log tutorial interaction', {
        userId,
        stepId,
        action,
        error: error.message
      });
      throw createError('internal', 'Failed to log interaction');
    }
  }
}

// Create singleton instance
const tutorialRepository = new TutorialRepository();
export default tutorialRepository;
