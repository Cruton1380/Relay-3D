/**
 * @fileoverview Session Manager - Performance Optimized
 * @description Handles user session creation, validation, and revocation with comprehensive performance enhancements
 * @version 2.1.0
 * @since 1.0.0
 */
import logger from '../../utils/logging/logger.mjs';
import { eventBus } from '../../event-bus/index.mjs';
import crypto from 'crypto';

const sessionLogger = logger.child({ module: 'session-manager' });

// Performance optimization configurations
const PERFORMANCE_CONFIG = {
  // Session cleanup and monitoring
  cleanupInterval: 3600000, // 1 hour
  maxSessions: 10000,       // Maximum sessions in memory
  batchSize: 100,           // Batch size for operations
  enableCleanup: true,      // Enable automatic cleanup
  
  // Performance monitoring
  enableMetrics: true,
  slowOperationThreshold: 50, // ms
  
  // Caching and optimization
  sessionIndexing: true,    // Enable user ID indexing for faster lookups
  compressionThreshold: 1000 // Compress large session data
};

// In-memory session store (would be replaced with Redis or similar in production)
const sessions = new Map();

// Performance optimizations: User ID to session IDs mapping for faster user operations
const userSessionIndex = new Map();

// Performance metrics
const metrics = {
  sessionCreations: 0,
  sessionDeletions: 0,
  sessionValidations: 0,
  userSessionLookups: 0,
  cleanupOperations: 0,
  privilegeRevocations: 0,
  sessionCleanups: 0,
  emergencyCleanups: 0,
  batchOperations: 0,
  averageOperationTime: 0,
  peakSessionCount: 0,
  startTime: Date.now()
};

class SessionManager {
  constructor() {
    // Subscribe to relevant events
    eventBus.on('user:logout', this.handleLogout.bind(this));
    eventBus.on('security:compromise', this.handleSecurityCompromise.bind(this));
    
    // Performance optimization: Initialize cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, PERFORMANCE_CONFIG.cleanupInterval);
    
    sessionLogger.info('Session manager initialized with performance optimizations', {
      maxSessions: PERFORMANCE_CONFIG.maxSessions,
      cleanupInterval: PERFORMANCE_CONFIG.cleanupInterval,
      enableMetrics: PERFORMANCE_CONFIG.enableMetrics
    });
  }
  
  /**
   * Update performance metrics
   * @private
   * @param {string} operation - Operation name
   * @param {number} startTime - Operation start time
   */
  updateMetrics(operation, startTime) {
    if (!PERFORMANCE_CONFIG.enableMetrics) return;
    
    const responseTime = Date.now() - startTime;
    
    // Update average operation time
    const totalOps = Object.values(metrics).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0);
    metrics.averageOperationTime = 
      (metrics.averageOperationTime * (totalOps - 1) + responseTime) / totalOps;
    
    // Log slow operations
    if (responseTime > PERFORMANCE_CONFIG.slowOperationThreshold) {
      sessionLogger.warn('Slow session operation detected', {
        operation,
        responseTime,
        threshold: PERFORMANCE_CONFIG.slowOperationThreshold
      });
    }
    
    // Update peak session count
    if (sessions.size > metrics.peakSessionCount) {
      metrics.peakSessionCount = sessions.size;
    }
  }
  
  /**
   * Add session to user index for performance optimization
   * @private
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  addToUserIndex(userId, sessionId) {
    if (!PERFORMANCE_CONFIG.sessionIndexing) return;
    
    if (!userSessionIndex.has(userId)) {
      userSessionIndex.set(userId, new Set());
    }
    userSessionIndex.get(userId).add(sessionId);
  }
  
  /**
   * Remove session from user index
   * @private
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  removeFromUserIndex(userId, sessionId) {
    if (!PERFORMANCE_CONFIG.sessionIndexing) return;
    
    const userSessions = userSessionIndex.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        userSessionIndex.delete(userId);
      }
    }
  }
  
  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return crypto.randomUUID();
  }
  
  /**
   * Create a new session with performance optimizations
   * @param {Object} userData User data
   * @param {Object} options Session options
   * @returns {Object} Session object
   */
  createSession(userData, options = {}) {
    const startTime = Date.now();
    
    // Performance check: Prevent memory exhaustion
    if (sessions.size >= PERFORMANCE_CONFIG.maxSessions) {
      sessionLogger.warn('Maximum session limit reached, performing emergency cleanup', {
        currentSessions: sessions.size,
        maxSessions: PERFORMANCE_CONFIG.maxSessions
      });
      this.emergencyCleanup();
    }
    
    const sessionId = this.generateSessionId();
    const expiresAt = Date.now() + (options.expiresIn || 3600000); // 1 hour default
    
    const session = {
      userId: userData.userId,
      publicKey: userData.publicKey,
      authLevel: options.authLevel || 1,
      factors: options.factors || {},
      createdAt: Date.now(),
      expiresAt,
      lastActivity: Date.now(),
      userAgent: options.userAgent,
      ip: options.ip
    };
    
    sessions.set(sessionId, session);
    
    // Performance optimization: Add to user index for faster user operations
    this.addToUserIndex(userData.userId, sessionId);
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.sessionCreations++;
      this.updateMetrics('createSession', startTime);
    }
    
    sessionLogger.info('Session created with performance tracking', { 
      sessionId, 
      userId: userData.userId,
      expiresAt: new Date(expiresAt).toISOString(),
      totalSessions: sessions.size,
      responseTime: Date.now() - startTime
    });
    
    return { sessionId, session };
  }
  
  /**
   * Check if a session is valid with performance optimization
   * @param {string} sessionId Session ID
   * @returns {boolean} Whether the session is valid
   */
  isSessionValid(sessionId) {
    const startTime = Date.now();
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      this.updateMetrics('isSessionValid', startTime);
      return false;
    }
    
    if (session.expiresAt < Date.now()) {
      // Remove expired session immediately for memory efficiency
      this.removeSession(sessionId);
      this.updateMetrics('isSessionValid', startTime);
      return false;
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.sessionValidations++;
      this.updateMetrics('isSessionValid', startTime);
    }
    
    return true;
  }
  
  /**
   * Get session data with performance optimization
   * @param {string} sessionId Session ID
   * @returns {Object|null} Session data or null if not found
   */
  getSession(sessionId) {
    const startTime = Date.now();
    
    if (!this.isSessionValid(sessionId)) {
      return null;
    }
    
    const session = sessions.get(sessionId);
    this.updateMetrics('getSession', startTime);
    
    return session;
  }
  
  /**
   * Update session data
   * @param {string} sessionId Session ID
   * @param {Object} updates Session updates
   * @returns {boolean} Whether the update was successful
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    const updatedSession = { ...session, ...updates, lastActivity: Date.now() };
    sessions.set(sessionId, updatedSession);
    
    return true;
  }
  
  /**
   * Record user activity to extend session
   * @param {string} sessionId Session ID
   * @returns {boolean} Whether the activity was recorded
   */
  recordActivity(sessionId) {
    return this.updateSession(sessionId, { lastActivity: Date.now() });
  }
  
  /**
   * Remove a session with performance optimization
   * @param {string} sessionId Session ID
   * @returns {boolean} Whether the session was removed
   */
  removeSession(sessionId) {
    const startTime = Date.now();
    const session = sessions.get(sessionId);
    
    if (!session) {
      this.updateMetrics('removeSession', startTime);
      return false;
    }
    
    sessions.delete(sessionId);
    
    // Performance optimization: Remove from user index
    this.removeFromUserIndex(session.userId, sessionId);
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.sessionDeletions++;
      this.updateMetrics('removeSession', startTime);
    }
    
    sessionLogger.info('Session removed with performance tracking', { 
      sessionId, 
      userId: session.userId,
      remainingSessions: sessions.size,
      responseTime: Date.now() - startTime
    });
    
    return true;
  }

  /**
   * Destroy a session (alias for removeSession with success object return)
   * @param {string} sessionId Session ID
   * @returns {Object} Result object with success status
   */
  destroySession(sessionId) {
    const result = this.removeSession(sessionId);
    return { success: result };
  }
  
  /**
   * Remove all sessions for a user with performance optimization
   * @param {string} userId User ID
   * @param {string} reason Reason for removal
   * @returns {number} Number of sessions removed
   */
  revokeUserSessions(userId, reason = 'user_initiated') {
    const startTime = Date.now();
    let count = 0;
    
    // Performance optimization: Use user index for faster lookup
    if (PERFORMANCE_CONFIG.sessionIndexing && userSessionIndex.has(userId)) {
      const userSessions = userSessionIndex.get(userId);
      
      for (const sessionId of userSessions) {
        if (sessions.has(sessionId)) {
          sessions.delete(sessionId);
          count++;
        }
      }
      
      // Clear the user index
      userSessionIndex.delete(userId);
    } else {
      // Fallback to full scan if indexing is disabled
      for (const [sessionId, session] of sessions.entries()) {
        if (session.userId === userId) {
          sessions.delete(sessionId);
          count++;
        }
      }
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.sessionDeletions += count;
      metrics.userSessionLookups++;
      this.updateMetrics('revokeUserSessions', startTime);
    }
    
    if (count > 0) {
      sessionLogger.info('User sessions revoked with performance tracking', { 
        userId, 
        count, 
        reason,
        responseTime: Date.now() - startTime,
        remainingSessions: sessions.size
      });
    }
    
    return count;
  }
  
  /**
   * Revoke elevated privileges for a user with performance optimization
   * @param {string} userId User ID
   * @returns {number} Number of sessions updated
   */
  revokeElevatedPrivileges(userId) {
    const startTime = Date.now();
    let count = 0;
    
    // Performance optimization: Use user index for faster lookup
    if (PERFORMANCE_CONFIG.sessionIndexing && userSessionIndex.has(userId)) {
      const userSessions = userSessionIndex.get(userId);
      
      for (const sessionId of userSessions) {
        const session = sessions.get(sessionId);
        if (session && session.authLevel > 1) {
          const updatedSession = { 
            ...session, 
            authLevel: 1,
            factors: { signature: true }, // Reset to basic factors
            lastActivity: Date.now()
          };
          
          sessions.set(sessionId, updatedSession);
          count++;
        }
      }
    } else {
      // Fallback to full scan if indexing is disabled
      for (const [sessionId, session] of sessions.entries()) {
        if (session.userId === userId && session.authLevel > 1) {
          const updatedSession = { 
            ...session, 
            authLevel: 1,
            factors: { signature: true }, // Reset to basic factors
            lastActivity: Date.now()
          };
          
          sessions.set(sessionId, updatedSession);
          count++;
        }
      }
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.privilegeRevocations++;
      this.updateMetrics('revokeElevatedPrivileges', startTime);
    }
    
    if (count > 0) {
      sessionLogger.info('Elevated privileges revoked with performance tracking', { 
        userId, 
        count,
        responseTime: Date.now() - startTime
      });
    }
    
    return count;
  }
  
  /**
   * Handle logout event
   * @param {Object} data Event data
   */
  handleLogout(data) {
    const { userId, sessionId } = data;
    
    if (sessionId) {
      this.removeSession(sessionId);
    } else if (userId) {
      this.revokeUserSessions(userId, 'logout');
    }
  }
  
  /**
   * Handle security compromise event
   * @param {Object} data Event data
   */
  handleSecurityCompromise(data) {
    const { userId, type } = data;
    
    if (userId) {
      this.revokeUserSessions(userId, `security_compromise_${type}`);
    }
  }
  
  /**
   * Clean up expired sessions with performance optimization
   */
  cleanupExpiredSessions() {
    const startTime = Date.now();
    const now = Date.now();
    let count = 0;
    
    // Batch delete for better performance
    const toDelete = [];
    
    for (const [sessionId, session] of sessions.entries()) {
      if (session.expiresAt < now) {
        toDelete.push({ sessionId, userId: session.userId });
      }
    }
    
    // Remove sessions and update user index
    for (const { sessionId, userId } of toDelete) {
      sessions.delete(sessionId);
      this.removeFromUserIndex(userId, sessionId);
      count++;
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.sessionCleanups++;
      metrics.sessionDeletions += count;
      this.updateMetrics('cleanupExpiredSessions', startTime);
    }
    
    if (count > 0) {
      sessionLogger.info('Expired sessions cleaned up with performance tracking', { 
        count,
        remainingSessions: sessions.size,
        responseTime: Date.now() - startTime
      });
    }
    
    return count;
  }
  
  /**
   * Emergency cleanup when memory limit is approached
   */
  emergencyCleanup() {
    const startTime = Date.now();
    const now = Date.now();
    let count = 0;
    
    // First pass: Remove expired sessions
    const expiredCount = this.cleanupExpiredSessions();
    count += expiredCount;
    
    // If still over limit, remove oldest sessions
    if (sessions.size > PERFORMANCE_CONFIG.maxSessionCount) {
      const sessionsArray = Array.from(sessions.entries());
      
      // Sort by last activity (oldest first)
      sessionsArray.sort((a, b) => a[1].lastActivity - b[1].lastActivity);
      
      const excessCount = sessions.size - Math.floor(PERFORMANCE_CONFIG.maxSessionCount * 0.8);
      
      for (let i = 0; i < excessCount && i < sessionsArray.length; i++) {
        const [sessionId, session] = sessionsArray[i];
        sessions.delete(sessionId);
        this.removeFromUserIndex(session.userId, sessionId);
        count++;
      }
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.emergencyCleanups++;
      metrics.sessionDeletions += (count - expiredCount);
      this.updateMetrics('emergencyCleanup', startTime);
    }
    
    sessionLogger.warn('Emergency cleanup performed', { 
      totalRemoved: count,
      expiredRemoved: expiredCount,
      forceRemoved: count - expiredCount,
      remainingSessions: sessions.size,
      responseTime: Date.now() - startTime
    });
    
    return count;
  }
  
  /**
   * Batch remove sessions for better performance
   * @param {Array} sessionIds Array of session IDs to remove
   * @returns {number} Number of sessions removed
   */
  batchRemoveSessions(sessionIds) {
    const startTime = Date.now();
    let count = 0;
    
    for (const sessionId of sessionIds) {
      const session = sessions.get(sessionId);
      if (session) {
        sessions.delete(sessionId);
        this.removeFromUserIndex(session.userId, sessionId);
        count++;
      }
    }
    
    // Update metrics
    if (PERFORMANCE_CONFIG.enableMetrics) {
      metrics.batchOperations++;
      metrics.sessionDeletions += count;
      this.updateMetrics('batchRemoveSessions', startTime);
    }
    
    if (count > 0) {
      sessionLogger.info('Batch session removal completed', { 
        requestedCount: sessionIds.length,
        removedCount: count,
        responseTime: Date.now() - startTime
      });
    }
    
    return count;
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...metrics,
      totalSessions: sessions.size,
      userIndexSize: userSessionIndex.size,
      memoryUsage: this.getMemoryEstimate(),
      uptime: Date.now() - metrics.startTime
    };
  }
  
  /**
   * Reset performance metrics
   */
  resetMetrics() {
    Object.keys(metrics).forEach(key => {
      if (typeof metrics[key] === 'number' && key !== 'startTime') {
        metrics[key] = 0;
      }
    });
    
    metrics.startTime = Date.now();
    
    sessionLogger.info('Performance metrics reset');
  }
  
  /**
   * Get estimated memory usage
   * @returns {number} Estimated memory usage in bytes
   */
  getMemoryEstimate() {
    // Rough estimate: each session ~1KB, user index entry ~100B
    const sessionMemory = sessions.size * 1024;
    const indexMemory = userSessionIndex.size * 100;
    
    return sessionMemory + indexMemory;
  }

  /**
   * Clear all sessions (for testing purposes)
   */
  clearAllSessions() {
    sessions.clear();
    userSessionIndex.clear();
    
    // Reset metrics for testing
    if (PERFORMANCE_CONFIG.enableMetrics) {
      this.resetMetrics();
    }
    
    sessionLogger.info('All sessions cleared');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Performance optimized cleanup intervals
if (PERFORMANCE_CONFIG.enableCleanup) {
  // Clean up expired sessions every 5 minutes
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, PERFORMANCE_CONFIG.cleanupInterval);
  
  // Emergency cleanup check every minute
  setInterval(() => {
    if (sessions.size > PERFORMANCE_CONFIG.maxSessionCount * 0.9) {
      sessionManager.emergencyCleanup();
    }
  }, 60000);
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  sessionLogger.info('Shutting down session manager gracefully');
  
  // Log final metrics
  if (PERFORMANCE_CONFIG.enableMetrics) {
    sessionLogger.info('Final performance metrics', sessionManager.getPerformanceMetrics());
  }
  
  // Clear all sessions for clean shutdown
  sessionManager.clearAllSessions();
});

export default sessionManager;
