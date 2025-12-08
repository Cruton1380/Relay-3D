/**
 * @fileoverview Audit Service
 * Modernized audit trail and history system for Base Model 1
 * Integrates legacy audit logic as clean, modular services
 */
import { apiPost } from './apiClient';

class AuditService {
  constructor() {
    this.isInitialized = false;
    this.auditLogs = new Map(); // logType -> log entries
    this.userActivity = new Map(); // userId -> activity entries
    this.blockchainRecords = new Map(); // transactionId -> record
    this.auditFilters = new Map(); // filterType -> filter settings
  }

  /**
   * Initialize audit service
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load user audit preferences
      await this.loadAuditPreferences();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audit service:', error);
      throw error;
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId, options = {}) {
    try {
      const response = await apiPost('/api/audit/user-activity', {
        userId: userId,
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        activityTypes: options.activityTypes || [],
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      return {
        activities: response.activities || [],
        totalCount: response.totalCount || 0,
        summary: response.summary || {}
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  /**
   * Get channel audit log
   */
  async getChannelAuditLog(channelId, options = {}) {
    try {
      const response = await apiPost('/api/audit/channel-log', {
        channelId: channelId,
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        eventTypes: options.eventTypes || [],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return {
        events: response.events || [],
        totalCount: response.totalCount || 0,
        channelInfo: response.channelInfo || {}
      };
    } catch (error) {
      console.error('Failed to get channel audit log:', error);
      throw error;
    }
  }

  /**
   * Get voting audit trail
   */
  async getVotingAuditTrail(topicId = null, options = {}) {
    try {
      const response = await apiPost('/api/audit/voting-trail', {
        topicId: topicId,
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        userId: options.userId || null,
        voteTypes: options.voteTypes || [],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return {
        votes: response.votes || [],
        totalCount: response.totalCount || 0,
        statistics: response.statistics || {}
      };
    } catch (error) {
      console.error('Failed to get voting audit trail:', error);
      throw error;
    }
  }

  /**
   * Get blockchain records
   */
  async getBlockchainRecords(options = {}) {
    try {
      const response = await apiPost('/api/audit/blockchain-records', {
        startBlock: options.startBlock || null,
        endBlock: options.endBlock || null,
        transactionTypes: options.transactionTypes || [],
        userId: options.userId || null,
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      return {
        records: response.records || [],
        totalCount: response.totalCount || 0,
        blockchainInfo: response.blockchainInfo || {}
      };
    } catch (error) {
      console.error('Failed to get blockchain records:', error);
      throw error;
    }
  }

  /**
   * Get moderation audit log
   */
  async getModerationAuditLog(options = {}) {
    try {
      const response = await apiPost('/api/audit/moderation-log', {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        moderatorId: options.moderatorId || null,
        actionTypes: options.actionTypes || [],
        severity: options.severity || null,
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return {
        actions: response.actions || [],
        totalCount: response.totalCount || 0,
        statistics: response.statistics || {}
      };
    } catch (error) {
      console.error('Failed to get moderation audit log:', error);
      throw error;
    }
  }

  /**
   * Get security audit log
   */
  async getSecurityAuditLog(options = {}) {
    try {
      const response = await apiPost('/api/audit/security-log', {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        userId: options.userId || null,
        eventTypes: options.eventTypes || [],
        riskLevel: options.riskLevel || null,
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return {
        events: response.events || [],
        totalCount: response.totalCount || 0,
        riskSummary: response.riskSummary || {}
      };
    } catch (error) {
      console.error('Failed to get security audit log:', error);
      throw error;
    }
  }

  /**
   * Get system audit log
   */
  async getSystemAuditLog(options = {}) {
    try {
      const response = await apiPost('/api/audit/system-log', {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        logLevel: options.logLevel || null,
        modules: options.modules || [],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return {
        logs: response.logs || [],
        totalCount: response.totalCount || 0,
        systemInfo: response.systemInfo || {}
      };
    } catch (error) {
      console.error('Failed to get system audit log:', error);
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(query, options = {}) {
    try {
      const response = await apiPost('/api/audit/search', {
        query: query,
        logTypes: options.logTypes || [],
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        userId: options.userId || null,
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      return {
        results: response.results || [],
        totalCount: response.totalCount || 0,
        searchTime: response.searchTime || 0
      };
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit data
   */
  async exportAuditData(logType, options = {}) {
    try {
      const response = await apiPost('/api/audit/export', {
        logType: logType,
        format: options.format || 'json',
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        filters: options.filters || {}
      });

      return {
        downloadUrl: response.downloadUrl,
        fileSize: response.fileSize,
        recordCount: response.recordCount,
        expiresAt: response.expiresAt
      };
    } catch (error) {
      console.error('Failed to export audit data:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(options = {}) {
    try {
      const response = await apiPost('/api/audit/statistics', {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        userId: options.userId || null,
        includeDetails: options.includeDetails || false
      });

      return {
        overview: response.overview || {},
        byType: response.byType || {},
        byUser: response.byUser || {},
        trends: response.trends || {},
        details: response.details || {}
      };
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw error;
    }
  }

  /**
   * Verify audit record integrity
   */
  async verifyAuditRecord(recordId, recordType) {
    try {
      const response = await apiPost('/api/audit/verify', {
        recordId: recordId,
        recordType: recordType
      });

      return {
        verified: response.verified || false,
        integrity: response.integrity || 'unknown',
        blockchainAnchor: response.blockchainAnchor || null,
        verificationDetails: response.verificationDetails || {}
      };
    } catch (error) {
      console.error('Failed to verify audit record:', error);
      throw error;
    }
  }

  /**
   * Get audit record details
   */
  async getAuditRecordDetails(recordId, recordType) {
    try {
      const response = await apiPost('/api/audit/record-details', {
        recordId: recordId,
        recordType: recordType
      });

      return {
        record: response.record || null,
        relatedRecords: response.relatedRecords || [],
        metadata: response.metadata || {},
        verification: response.verification || {}
      };
    } catch (error) {
      console.error('Failed to get audit record details:', error);
      throw error;
    }
  }

  /**
   * Create audit filter
   */
  createFilter(filterType, filterSettings) {
    const filter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: filterType,
      settings: filterSettings,
      createdAt: Date.now()
    };

    this.auditFilters.set(filter.id, filter);
    return filter;
  }

  /**
   * Apply audit filter
   */
  applyFilter(filterId, data) {
    const filter = this.auditFilters.get(filterId);
    if (!filter) return data;

    switch (filter.type) {
      case 'date_range':
        return this.filterByDateRange(data, filter.settings);
      case 'user_filter':
        return this.filterByUser(data, filter.settings);
      case 'event_type':
        return this.filterByEventType(data, filter.settings);
      case 'severity':
        return this.filterBySeverity(data, filter.settings);
      default:
        return data;
    }
  }

  /**
   * Filter by date range
   */
  filterByDateRange(data, settings) {
    const { startDate, endDate } = settings;
    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate)) return false;
      return true;
    });
  }

  /**
   * Filter by user
   */
  filterByUser(data, settings) {
    const { userId, includeAnonymous } = settings;
    return data.filter(item => {
      if (item.userId === userId) return true;
      if (includeAnonymous && !item.userId) return true;
      return false;
    });
  }

  /**
   * Filter by event type
   */
  filterByEventType(data, settings) {
    const { eventTypes } = settings;
    return data.filter(item => eventTypes.includes(item.eventType || item.type));
  }

  /**
   * Filter by severity
   */
  filterBySeverity(data, settings) {
    const { minSeverity } = settings;
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return data.filter(item => {
      const itemSeverity = severityLevels[item.severity || item.riskLevel] || 0;
      return itemSeverity >= severityLevels[minSeverity];
    });
  }

  /**
   * Format audit entry for display
   */
  formatAuditEntry(entry) {
    return {
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      formattedTime: new Date(entry.timestamp).toLocaleString(),
      type: entry.eventType || entry.type,
      description: this.getEventDescription(entry),
      severity: entry.severity || entry.riskLevel || 'info',
      user: entry.userId ? `User ${entry.userId}` : 'System',
      details: entry.details || entry.data || {},
      metadata: entry.metadata || {}
    };
  }

  /**
   * Get event description
   */
  getEventDescription(entry) {
    const eventType = entry.eventType || entry.type;
    const descriptions = {
      'user_login': 'User logged in',
      'user_logout': 'User logged out',
      'vote_cast': 'Vote cast',
      'channel_join': 'User joined channel',
      'channel_leave': 'User left channel',
      'content_post': 'Content posted',
      'content_delete': 'Content deleted',
      'moderation_action': 'Moderation action taken',
      'security_alert': 'Security alert triggered',
      'blockchain_transaction': 'Blockchain transaction recorded',
      'system_error': 'System error occurred',
      'permission_change': 'Permission changed'
    };

    return descriptions[eventType] || `Event: ${eventType}`;
  }

  /**
   * Get audit entry icon
   */
  getAuditEntryIcon(entry) {
    const eventType = entry.eventType || entry.type;
    const icons = {
      'user_login': 'fas fa-sign-in-alt',
      'user_logout': 'fas fa-sign-out-alt',
      'vote_cast': 'fas fa-vote-yea',
      'channel_join': 'fas fa-user-plus',
      'channel_leave': 'fas fa-user-minus',
      'content_post': 'fas fa-plus',
      'content_delete': 'fas fa-trash',
      'moderation_action': 'fas fa-gavel',
      'security_alert': 'fas fa-shield-alt',
      'blockchain_transaction': 'fas fa-link',
      'system_error': 'fas fa-exclamation-triangle',
      'permission_change': 'fas fa-key'
    };

    return icons[eventType] || 'fas fa-info-circle';
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity) {
    const colors = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'critical': 'text-red-600',
      'info': 'text-blue-600'
    };

    return colors[severity] || colors.info;
  }

  /**
   * Load audit preferences
   */
  async loadAuditPreferences() {
    try {
      const response = await apiPost('/api/audit/preferences');
      this.preferences = response.preferences || {};
    } catch (error) {
      console.warn('Failed to load audit preferences:', error);
      this.preferences = {};
    }
  }

  /**
   * Update audit preferences
   */
  async updateAuditPreferences(newPreferences) {
    try {
      const response = await apiPost('/api/audit/preferences', {
        preferences: newPreferences
      });
      this.preferences = { ...this.preferences, ...newPreferences };
      return response.success;
    } catch (error) {
      console.error('Failed to update audit preferences:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.auditLogs.clear();
    this.userActivity.clear();
    this.blockchainRecords.clear();
    this.auditFilters.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
const auditService = new AuditService();
export default auditService; 