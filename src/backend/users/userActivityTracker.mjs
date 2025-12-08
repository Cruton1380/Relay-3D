//backend/users/userActivityTracker.mjs
/**
 * Tracks user activity for determining last known region
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { getUserRegion } from '../location/userLocation.mjs';
import userManager from './userManager.mjs';
import { userRepository } from '../database/userRepository.mjs';
import activityAnalysisService from '../activityAnalysis-service/index.mjs';

// Initialize logger
const activityLogger = logger.child({ module: 'user-activity' });

// Constants
const ACTIVITY_FILE = path.join(process.env.DATA_DIR || './data', 'user-activity.json');
const ACTIVE_THRESHOLD_DAYS = 30; // Consider users active if they've interacted within 30 days

// In-memory store of user activity
let userActivity = new Map();
let initialized = false;

/**
 * Initialize the activity tracker
 * @returns {Promise<void>}
 */
export async function initActivityTracker() {
  if (initialized) return;
  
  try {
    await loadActivityData();
    initialized = true;
    activityLogger.info('User activity tracker initialized');
    
    // Start cleanup timer for expired activity records
    setInterval(cleanupExpiredActivity, 24 * 60 * 60 * 1000); // Once per day
  } catch (error) {
    activityLogger.error('Failed to initialize user activity tracker', { error: error.message });
    throw error;
  }
}

/**
 * Load activity data from disk
 * @returns {Promise<void>}
 */
async function loadActivityData() {
  try {
    // Check if activity file exists
    await fs.access(ACTIVITY_FILE);
    
    // Load data
    const data = JSON.parse(await fs.readFile(ACTIVITY_FILE, 'utf8'));
    
    // Convert to Map
    userActivity = new Map(Object.entries(data));
    
    activityLogger.info(`Loaded activity data for ${userActivity.size} users`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      activityLogger.info('No existing activity data found, starting fresh');
      userActivity = new Map();
      await saveActivityData();
    } else {
      throw error;
    }
  }
}

/**
 * Save activity data to disk
 * @returns {Promise<void>}
 */
async function saveActivityData() {
  try {
    // Ensure directory exists
    const dir = path.dirname(ACTIVITY_FILE);
    await fs.mkdir(dir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') throw err;
    });
    
    // Convert Map to object for JSON serialization
    const data = Object.fromEntries(userActivity);
    
    // Save to file
    await fs.writeFile(ACTIVITY_FILE, JSON.stringify(data, null, 2));
    
    activityLogger.info(`Saved activity data for ${userActivity.size} users`);
  } catch (error) {
    activityLogger.error('Failed to save activity data', { error: error.message });
    throw error;
  }
}

/**
 * Record user activity and update last known region
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
export async function recordUserActivity(userId, action, metadata = {}) {
  if (!initialized) {
    await initActivityTracker();
  }
  
  try {
    // Get existing activity record or create new one
    const activityRecord = userActivity.get(userId) || {
      lastActive: 0,
      actions: [],
      ipAddresses: new Set(),
      regions: new Set()
    };
    
    // Update record
    activityRecord.lastActive = Date.now();
    
    // Add IP address if provided
    if (metadata.ipAddress) {
      activityRecord.ipAddresses.add(metadata.ipAddress);
    }
    
    // Add region if available and update UserManager
    if (metadata.region) {
      activityRecord.regions.add(metadata.region);
      
      // Update the user's last known region in UserManager
      await userManager.updateUserRegion(userId, metadata.region);
    }
    
    // Add action to history (keep last 100 actions)
    activityRecord.actions.unshift({
      action,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Trim action history
    if (activityRecord.actions.length > 100) {
      activityRecord.actions = activityRecord.actions.slice(0, 100);
    }
    
    // Convert Sets to Arrays for serialization
    const recordToSave = {
      ...activityRecord,
      ipAddresses: Array.from(activityRecord.ipAddresses),
      regions: Array.from(activityRecord.regions)
    };
    
    // Update in-memory store
    userActivity.set(userId, recordToSave);
    
    // Save periodically (not on every update)
    if (Math.random() < 0.1) { // 10% chance to save on each activity
      await saveActivityData();
    }
  } catch (error) {
    activityLogger.error('Failed to record user activity', { 
      error: error.message,
      userId,
      action
    });
  }
}

/**
 * Get users active in a specific region
 * @param {string} regionId - Region ID
 * @returns {Promise<Map>} Map of active user IDs to their activity data
 */
export async function getActiveUsersByRegion(regionId) {
  if (!initialized) {
    await initActivityTracker();
  }
  
  const activeUsers = new Map();
  const now = Date.now();
  const activeThreshold = now - (ACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  
  for (const [userId, activity] of userActivity.entries()) {
    // Check if user was active within threshold and is in the specified region
    if (activity.lastActive >= activeThreshold && 
        (activity.regions.includes(regionId) || activity.regions.indexOf(regionId) >= 0)) {
      activeUsers.set(userId, activity);
    }
  }
  
  activityLogger.info(`Found ${activeUsers.size} active users in region ${regionId}`);
  return activeUsers;
}

/**
 * Clean up expired activity records
 * @returns {Promise<void>}
 */
async function cleanupExpiredActivity() {
  try {
    const now = Date.now();
    const expireThreshold = now - (90 * 24 * 60 * 60 * 1000); // 90 days
    let expiredCount = 0;
    
    for (const [userId, activity] of userActivity.entries()) {
      if (activity.lastActive < expireThreshold) {
        userActivity.delete(userId);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      activityLogger.info(`Cleaned up ${expiredCount} expired activity records`);
      await saveActivityData();
    }
  } catch (error) {
    activityLogger.error('Error cleaning up expired activity', { error: error.message });
  }
}

export class UserActivityTracker {
  constructor() {
    this.activityBuffer = new Map();
    this.flushInterval = 5 * 60 * 1000; // 5 minutes
    this.setupPeriodicFlush();
  }
  
  setupPeriodicFlush() {
    setInterval(() => this.flushActivityData(), this.flushInterval);
  }
  
  async trackActivity(userId, activityType) {
    try {
      if (!this.activityBuffer.has(userId)) {
        this.activityBuffer.set(userId, []);
      }
      
      this.activityBuffer.get(userId).push({
        timestamp: Date.now(),
        type: activityType
      });
      
      // If buffer getting large for this user, flush immediately
      if (this.activityBuffer.get(userId).length > 50) {
        await this.flushUserActivity(userId);
      }
    } catch (error) {
      logger.error('Error tracking user activity', { userId, activityType, error });
    }
  }
  
  async flushActivityData() {
    const userIds = [...this.activityBuffer.keys()];
    
    for (const userId of userIds) {
      await this.flushUserActivity(userId);
    }
    
    // Trigger recalculation of activity metrics if needed
    if (userIds.length > 0) {
      activityAnalysisService.triggerRecalculation();
    }
  }
  
  async flushUserActivity(userId) {
    try {
      const activities = this.activityBuffer.get(userId) || [];
      if (activities.length === 0) return;
      
      const user = await userRepository.findById(userId);
      if (!user) {
        logger.warn('Attempted to track activity for non-existent user', { userId });
        this.activityBuffer.delete(userId);
        return;
      }
      
      // Initialize activity log if not present
      if (!user.activityLog) {
        user.activityLog = {
          daily: {},
          weekly: {},
          monthly: {},
          total: 0,
          lastUpdated: null
        };
      }
      
      // Update activity counts
      const now = new Date();
      const dayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekKey = this.getWeekKey(now);
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Initialize period counts if needed
      user.activityLog.daily[dayKey] = user.activityLog.daily[dayKey] || 0;
      user.activityLog.weekly[weekKey] = user.activityLog.weekly[weekKey] || 0;
      user.activityLog.monthly[monthKey] = user.activityLog.monthly[monthKey] || 0;
      
      // Update counts
      const activityCount = activities.length;
      user.activityLog.daily[dayKey] += activityCount;
      user.activityLog.weekly[weekKey] += activityCount;
      user.activityLog.monthly[monthKey] += activityCount;
      user.activityLog.total += activityCount;
      user.activityLog.lastUpdated = now.toISOString();
      
      // Calculate monthly count (for current month)
      user.activityLog.monthlyCount = user.activityLog.monthly[monthKey] || 0;
      
      // Prune old entries
      this.pruneOldActivityData(user.activityLog);
      
      // Save user
      await userRepository.update(userId, user);
      
      // Clear buffer for this user
      this.activityBuffer.delete(userId);
    } catch (error) {
      logger.error('Error flushing user activity', { userId, error });
    }
  }
  
  getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
    return d.toISOString().split('T')[0];
  }
  
  pruneOldActivityData(activityLog) {
    const now = new Date();
    
    // Keep only 30 days of daily data
    const cutoffDay = new Date(now);
    cutoffDay.setDate(cutoffDay.getDate() - 30);
    const cutoffDayKey = cutoffDay.toISOString().split('T')[0];
    
    // Keep only 12 weeks of weekly data
    const cutoffWeek = new Date(now);
    cutoffWeek.setDate(cutoffWeek.getDate() - 84); // 12 weeks
    const cutoffWeekKey = this.getWeekKey(cutoffWeek);
    
    // Keep only 12 months of monthly data
    const cutoffMonth = new Date(now);
    cutoffMonth.setMonth(cutoffMonth.getMonth() - 12);
    const cutoffMonthKey = `${cutoffMonth.getFullYear()}-${String(cutoffMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // Prune old data
    Object.keys(activityLog.daily).forEach(key => {
      if (key < cutoffDayKey) delete activityLog.daily[key];
    });
    
    Object.keys(activityLog.weekly).forEach(key => {
      if (key < cutoffWeekKey) delete activityLog.weekly[key];
    });
    
    Object.keys(activityLog.monthly).forEach(key => {
      if (key < cutoffMonthKey) delete activityLog.monthly[key];
    });
  }
  
  async getUserActivityLevel(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user || !user.activityLog) return null;
      
      return {
        isActive: activityAnalysisService.isUserActive(user),
        percentile: activityAnalysisService.getActivityPercentile(user.activityLog.monthlyCount),
        monthlyCount: user.activityLog.monthlyCount
      };
    } catch (error) {
      logger.error('Error getting user activity level', { userId, error });
      return null;
    }
  }
}

// Export API
export default {
  initActivityTracker,
  recordUserActivity,
  getActiveUsersByRegion
};
