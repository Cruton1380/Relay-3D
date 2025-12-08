/**
 * @fileoverview Hashgraph Integration Example
 * Demonstrates how to use the integrated Hashgraph-inspired system in Relay Network
 */

import { HashgraphIntegrationController } from './hashgraphIntegrationController.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Example usage of the Hashgraph Integration System
 */
class HashgraphIntegrationExample {
  constructor() {
    this.controller = new HashgraphIntegrationController({
      enableGossip: true,
      enableDAGTracking: true,
      enableModerationAudit: true,
      enableSybilDetection: true
    });

    this.setupEventListeners();
  }

  /**
   * Set up event listeners to demonstrate system integration
   */
  setupEventListeners() {
    // Listen for processed actions
    this.controller.on('actionProcessed', (data) => {
      logger.info('Action processed through Hashgraph system', {
        eventId: data.dagEvent?.id,
        actionType: data.originalAction.type,
        userId: data.originalAction.userId
      });
    });

    // Listen for security alerts
    this.controller.on('securityAlert', (alert) => {
      logger.warn('Security alert from Hashgraph system', {
        alertType: alert.alert_type,
        severity: alert.severity,
        confidence: alert.confidence,
        suspiciousUsers: Array.from(alert.suspicious_users)
      });
    });

    // Listen for security response triggers
    this.controller.on('triggerSecurityResponse', (response) => {
      logger.warn('Security response triggered', {
        alertType: response.alertType,
        users: response.users,
        severity: response.severity
      });
    });
  }

  /**
   * Example: Process a vote action
   */
  async processVoteExample() {
    const voteAction = {
      type: 'vote',
      userId: 'user_123',
      channelId: 'channel_abc',
      proximityRegion: 'region_xyz',
      content: {
        proposalId: 'proposal_456',
        option: 'approve',
        timestamp: Date.now()
      },
      metadata: {
        device: 'mobile',
        location: { lat: 40.7128, lng: -74.0060 }
      }
    };

    try {
      const result = await this.controller.processUserAction(voteAction);
      logger.info('Vote processed successfully', result);
      return result;
    } catch (error) {
      logger.error('Error processing vote', { error: error.message });
      throw error;
    }
  }

  /**
   * Example: Process moderation action
   */
  async processModerationExample() {
    const moderationAction = {
      type: 'flag_content',
      userId: 'moderator_789',
      channelId: 'channel_abc',
      proximityRegion: 'region_xyz',
      content: {
        targetId: 'content_def',
        targetType: 'message'
      },
      metadata: {
        reason: 'inappropriate_content',
        evidence: ['screenshot_url'],
        severity: 'medium'
      }
    };

    try {
      const result = await this.controller.processUserAction(moderationAction);
      logger.info('Moderation action processed successfully', result);
      return result;
    } catch (error) {
      logger.error('Error processing moderation action', { error: error.message });
      throw error;
    }
  }

  /**
   * Example: Simulate coordinated voting pattern (will trigger Sybil detection)
   */
  async simulateCoordinatedVoting() {
    const baseAction = {
      type: 'vote',
      channelId: 'channel_abc',
      proximityRegion: 'region_xyz',
      content: {
        proposalId: 'proposal_789',
        option: 'approve'
      }
    };

    // Simulate multiple users voting with similar timing (suspicious pattern)
    const users = ['user_a', 'user_b', 'user_c', 'user_d'];
    const promises = users.map((userId, index) => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const action = {
              ...baseAction,
              userId,
              content: {
                ...baseAction.content,
                timestamp: Date.now()
              }
            };
            const result = await this.controller.processUserAction(action);
            resolve(result);
          } catch (error) {
            logger.error('Error in coordinated voting simulation', { userId, error: error.message });
            resolve(null);
          }
        }, index * 100); // 100ms apart - suspicious coordination
      });
    });

    const results = await Promise.all(promises);
    logger.info('Coordinated voting simulation completed', {
      processed: results.filter(r => r !== null).length,
      total: users.length
    });

    return results;
  }

  /**
   * Example: Submit an appeal for a moderation action
   */
  async submitAppealExample() {
    // First create a moderation action to appeal
    const moderationResult = await this.processModerationExample();
    
    // Simulate getting the audit trail to find the action
    const auditTrail = await this.controller.exportAuditTrail();
    const latestAction = auditTrail.actions[auditTrail.actions.length - 1];

    if (latestAction) {
      const appealData = {
        actionId: latestAction.action_id,
        appealingUserId: 'user_affected',
        reason: 'Content was taken out of context',
        evidence: ['context_screenshot.jpg', 'witness_statement.pdf']
      };

      if (this.controller.moderationAudit) {
        try {
          const appealId = this.controller.moderationAudit.submitAppeal(
            appealData.actionId,
            appealData.appealingUserId,
            appealData.reason,
            appealData.evidence
          );
          
          logger.info('Appeal submitted successfully', { appealId });
          return appealId;
        } catch (error) {
          logger.error('Error submitting appeal', { error: error.message });
          throw error;
        }
      }
    }

    throw new Error('No moderation action found to appeal');
  }

  /**
   * Example: Get system health analysis
   */
  async getSystemHealthExample() {
    try {
      const status = this.controller.getSystemStatus();
      const health = await this.controller.analyzeNetworkHealth();
      
      logger.info('System health analysis', { status, health });
      
      // Print recommendations
      if (health.recommendations.length > 0) {
        logger.warn('Health recommendations', {
          recommendations: health.recommendations
        });
      }

      return { status, health };
    } catch (error) {
      logger.error('Error getting system health', { error: error.message });
      throw error;
    }
  }

  /**
   * Example: Export audit data for compliance
   */
  async exportAuditExample() {
    try {
      const auditData = await this.controller.exportAuditTrail({
        includeDAG: true,
        timeRange: {
          start: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
          end: Date.now()
        }
      });

      logger.info('Audit data exported', {
        totalActions: auditData.totalActions,
        integrityCheck: auditData.integrityCheck
      });

      return auditData;
    } catch (error) {
      logger.error('Error exporting audit data', { error: error.message });
      throw error;
    }
  }

  /**
   * Example: Get user risk assessment
   */
  async getUserRiskExample(userId) {
    if (this.controller.sybilDetector) {
      try {
        const analysis = this.controller.sybilDetector.getUserAnalysis(userId);
        
        logger.info('User risk analysis', {
          userId,
          exists: analysis.exists,
          riskScore: analysis.riskScore,
          alertCount: analysis.alerts,
          recentAlerts: analysis.recentAlerts
        });

        return analysis;
      } catch (error) {
        logger.error('Error getting user risk analysis', { userId, error: error.message });
        throw error;
      }
    }

    throw new Error('Sybil detector not enabled');
  }

  /**
   * Run a comprehensive demo of all features
   */
  async runFullDemo() {
    logger.info('Starting Hashgraph Integration Demo');

    try {
      // 1. Process some normal actions
      logger.info('=== Processing Normal Actions ===');
      await this.processVoteExample();
      await this.processModerationExample();

      // 2. Simulate suspicious activity
      logger.info('=== Simulating Suspicious Activity ===');
      await this.simulateCoordinatedVoting();

      // Wait a bit for detection to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Check system health
      logger.info('=== Checking System Health ===');
      await this.getSystemHealthExample();

      // 4. Submit an appeal
      logger.info('=== Submitting Appeal ===');
      await this.submitAppealExample();

      // 5. Export audit data
      logger.info('=== Exporting Audit Data ===');
      await this.exportAuditExample();

      // 6. Get user risk assessment
      logger.info('=== User Risk Assessment ===');
      await this.getUserRiskExample('user_a'); // One of the coordinated voters

      logger.info('Hashgraph Integration Demo completed successfully');

    } catch (error) {
      logger.error('Demo failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async shutdown() {
    await this.controller.shutdown();
    logger.info('Hashgraph Integration Example shutdown complete');
  }
}

// Export for use in other modules
export { HashgraphIntegrationExample };

// If run directly, execute the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new HashgraphIntegrationExample();
  
  // Run the demo
  demo.runFullDemo()
    .then(() => {
      logger.info('Demo completed successfully');
      return demo.shutdown();
    })
    .catch((error) => {
      logger.error('Demo failed', { error: error.message });
      return demo.shutdown();
    })
    .finally(() => {
      process.exit(0);
    });
}
