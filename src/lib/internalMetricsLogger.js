/**
 * INTERNAL METRICS AND LOGGING MODULE
 * Secure audit trails and phantom tracking for Phase 1 Privacy Upgrade
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InternalMetricsLogger {
  constructor() {
    this.logDir = join(__dirname, '../logs/invite-privacy');
    this.ensureLogDirectory();
    
    this.streams = {
      audit: this.createLogStream('audit.log'),
      phantom: this.createLogStream('phantom.log'),
      mixing: this.createLogStream('mixing.log'),
      security: this.createLogStream('security.log')
    };
    
    this.metrics = {
      session: {
        startTime: Date.now(),
        totalInvites: 0,
        realInvites: 0,
        phantomInvites: 0,
        batchesProcessed: 0,
        privacyEvents: 0
      },
      
      phantom: {
        generated: 0,
        injected: 0,
        detected: 0,
        ratio: 0
      },
      
      mixing: {
        batchesCreated: 0,
        batchesCompleted: 0,
        averageBatchSize: 0,
        averageDelay: 0
      },
      
      security: {
        phantomAttempts: 0,
        suspiciousActivity: 0,
        rateLimitHits: 0
      }
    };
    
    console.log('[METRICS] Internal logging system initialized');
  }

  ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  createLogStream(filename) {
    const filepath = join(this.logDir, filename);
    return createWriteStream(filepath, { flags: 'a' });
  }

  /**
   * Log audit events with secure tracking
   */
  async logAuditEvent(event) {
    const auditEntry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      eventId: this.generateEventId(),
      ...event,
      checksum: this.generateChecksum(event)
    };

    this.writeToStream('audit', auditEntry);
    this.metrics.session.privacyEvents++;
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', auditEntry);
    }
  }

  /**
   * Log phantom invite events
   */
  async logPhantomEvent(phantomData) {
    const phantomEntry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      eventType: 'phantom_operation',
      phantomId: phantomData.id,
      operation: phantomData.operation || 'generated',
      batchId: phantomData.batchId,
      metadata: {
        prefix: phantomData._phantom?.phantomPrefix,
        seed: phantomData._phantom?.seed,
        generatedAt: phantomData._phantom?.generatedAt
      },
      securityFlags: phantomData._security,
      checksum: this.generateChecksum(phantomData)
    };

    this.writeToStream('phantom', phantomEntry);
    this.metrics.phantom.generated++;
    
    console.log('[PHANTOM]', {
      id: phantomEntry.phantomId,
      operation: phantomEntry.operation,
      batchId: phantomEntry.batchId
    });
  }

  /**
   * Log temporal mixing events
   */
  async logMixingEvent(mixingData) {
    const mixingEntry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      eventType: 'temporal_mixing',
      batchId: mixingData.batchId,
      operation: mixingData.operation, // 'created', 'processed', 'released'
      batchSize: mixingData.batchSize,
      realInvites: mixingData.realInvites,
      phantomInvites: mixingData.phantomInvites,
      processingTime: mixingData.processingTime,
      randomizationSeed: mixingData.randomizationSeed,
      checksum: this.generateChecksum(mixingData)
    };

    this.writeToStream('mixing', mixingEntry);
    
    if (mixingData.operation === 'created') {
      this.metrics.mixing.batchesCreated++;
    } else if (mixingData.operation === 'released') {
      this.metrics.mixing.batchesCompleted++;
      this.updateAverageBatchSize(mixingData.batchSize);
    }
    
    console.log('[MIXING]', {
      batchId: mixingEntry.batchId,
      operation: mixingEntry.operation,
      size: mixingEntry.batchSize
    });
  }

  /**
   * Log security events and violations
   */
  async logSecurityEvent(securityData) {
    const securityEntry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      eventType: 'security_event',
      severity: securityData.severity || 'info',
      event: securityData.event,
      userId: securityData.userId,
      details: securityData.details,
      ipAddress: securityData.ipAddress,
      userAgent: securityData.userAgent,
      sessionId: securityData.sessionId,
      checksum: this.generateChecksum(securityData)
    };

    this.writeToStream('security', securityEntry);
    
    if (securityData.severity === 'warning' || securityData.severity === 'error') {
      this.metrics.security.suspiciousActivity++;
    }
    
    console.log('[SECURITY]', {
      severity: securityEntry.severity,
      event: securityEntry.event,
      userId: securityEntry.userId
    });
  }

  /**
   * Write structured data to log stream
   */
  writeToStream(streamName, data) {
    const stream = this.streams[streamName];
    if (stream) {
      stream.write(JSON.stringify(data) + '\n');
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Generate checksum for data integrity
   */
  generateChecksum(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(dataString).digest('hex').substring(0, 16);
  }

  /**
   * Update running averages
   */
  updateAverageBatchSize(newSize) {
    const current = this.metrics.mixing.averageBatchSize;
    const count = this.metrics.mixing.batchesCompleted;
    this.metrics.mixing.averageBatchSize = ((current * (count - 1)) + newSize) / count;
  }

  /**
   * Get current metrics snapshot
   */
  getMetricsSnapshot() {
    return {
      ...this.metrics,
      session: {
        ...this.metrics.session,
        uptimeMs: Date.now() - this.metrics.session.startTime,
        uptimeFormatted: this.formatUptime(Date.now() - this.metrics.session.startTime)
      },
      
      computed: {
        phantomRatio: this.metrics.session.totalInvites > 0 ? 
          this.metrics.phantom.generated / this.metrics.session.totalInvites : 0,
        batchEfficiency: this.metrics.mixing.batchesCompleted > 0 ?
          this.metrics.mixing.averageBatchSize : 0,
        securityScore: this.calculateSecurityScore()
      }
    };
  }

  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  calculateSecurityScore() {
    const total = this.metrics.session.privacyEvents;
    const suspicious = this.metrics.security.suspiciousActivity;
    
    if (total === 0) return 100;
    
    const ratio = suspicious / total;
    return Math.max(0, Math.min(100, 100 - (ratio * 100)));
  }

  /**
   * Generate privacy analysis report
   */
  generatePrivacyReport() {
    const metrics = this.getMetricsSnapshot();
    
    return {
      summary: {
        totalInvites: metrics.session.totalInvites,
        realInvites: metrics.session.realInvites,
        phantomInvites: metrics.phantom.generated,
        privacyEnhancement: this.calculatePrivacyEnhancement(metrics)
      },
      
      temporalMixing: {
        batchesProcessed: metrics.mixing.batchesCompleted,
        averageBatchSize: metrics.mixing.averageBatchSize,
        correlationReduction: this.calculateCorrelationReduction(metrics)
      },
      
      phantomInjection: {
        phantomRatio: metrics.computed.phantomRatio,
        linkabilityReduction: this.calculateLinkabilityReduction(metrics),
        graphObfuscation: this.calculateGraphObfuscation(metrics)
      },
      
      security: {
        securityScore: metrics.computed.securityScore,
        suspiciousEvents: metrics.security.suspiciousActivity,
        phantomAttempts: metrics.security.phantomAttempts
      },
      
      recommendations: this.generateRecommendations(metrics)
    };
  }

  calculatePrivacyEnhancement(metrics) {
    const mixing = this.calculateCorrelationReduction(metrics);
    const phantom = this.calculateLinkabilityReduction(metrics);
    return (mixing + phantom) / 2;
  }

  calculateCorrelationReduction(metrics) {
    if (metrics.mixing.averageBatchSize <= 1) return 0;
    return Math.min(0.9, Math.log(metrics.mixing.averageBatchSize) / Math.log(50));
  }

  calculateLinkabilityReduction(metrics) {
    return Math.min(0.8, metrics.computed.phantomRatio * 3);
  }

  calculateGraphObfuscation(metrics) {
    const phantomRatio = metrics.computed.phantomRatio;
    const batchMixing = this.calculateCorrelationReduction(metrics);
    return phantomRatio * batchMixing * 2;
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.computed.phantomRatio < 0.05) {
      recommendations.push({
        type: 'phantom_ratio',
        message: 'Consider increasing phantom ratio for better privacy',
        current: metrics.computed.phantomRatio,
        suggested: 0.10
      });
    }
    
    if (metrics.mixing.averageBatchSize < 5) {
      recommendations.push({
        type: 'batch_size',
        message: 'Small batch sizes reduce mixing effectiveness',
        current: metrics.mixing.averageBatchSize,
        suggested: 'Increase batch window or wait for more users'
      });
    }
    
    if (metrics.computed.securityScore < 90) {
      recommendations.push({
        type: 'security',
        message: 'High number of suspicious events detected',
        current: metrics.computed.securityScore,
        action: 'Review security logs for potential attacks'
      });
    }
    
    return recommendations;
  }

  /**
   * Export logs for analysis (development only)
   */
  exportLogs(eventType = 'all', startTime = null, endTime = null) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Log export only available in development environment');
    }
    
    // In production, this would read and filter log files
    console.log('[METRICS] Log export requested:', { eventType, startTime, endTime });
    
    return {
      exported: true,
      eventType,
      timeRange: { startTime, endTime },
      location: this.logDir
    };
  }

  /**
   * Clean up resources
   */
  close() {
    Object.values(this.streams).forEach(stream => {
      if (stream && typeof stream.end === 'function') {
        stream.end();
      }
    });
    
    console.log('[METRICS] Internal logging system closed');
  }
}

export default InternalMetricsLogger;
export { InternalMetricsLogger };
