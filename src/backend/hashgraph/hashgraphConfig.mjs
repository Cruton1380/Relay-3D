/**
 * @fileoverview Hashgraph Integration Configuration
 * Central configuration for all Hashgraph-inspired features in Relay Network
 */

export const HashgraphConfig = {
  // Global settings
  global: {
    enabled: true,
    logLevel: 'info',
    maxMemoryUsage: '500MB',
    performanceMode: 'balanced' // 'performance', 'balanced', 'memory'
  },

  // Proximity Gossip Mesh configuration
  gossipMesh: {
    enabled: true,
    maxConnections: 50,
    gossipInterval: 500, // milliseconds
    maxEventAge: 3600000, // 1 hour in milliseconds
    maxDAGSize: 10000,
    maxPropagationHops: 10,
    
    // Performance settings
    batchSize: 10, // Events per gossip round
    maxPeersPerRound: 3,
    connectionTimeout: 5000,
    
    // Security settings
    requireSignatures: true,
    maxEventSize: 1048576, // 1MB
    rateLimitPerPeer: 100 // Events per minute per peer
  },

  // DAG Event Constructor configuration
  dagConstructor: {
    enabled: true,
    maxDAGDepth: 1000,
    maxPendingTime: 30000, // 30 seconds
    consensusThreshold: 0.67, // 67% for consensus
    maxEventRetention: 100000,
    
    // Pruning settings
    pruneInterval: 60000, // 1 minute
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keepCriticalEvents: true,
    
    // Performance settings
    batchProcessing: true,
    maxBatchSize: 100,
    processingDelay: 100 // milliseconds
  },

  // Moderation Audit DAG configuration
  moderationAudit: {
    enabled: true,
    maxAuditRetention: 365 * 24 * 60 * 60 * 1000, // 1 year
    requireWitnesses: true,
    minWitnessCount: 2,
    
    // Appeal settings
    maxAppealTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoAssignReviewer: true,
    requireEvidenceForAppeals: true,
    
    // Archive settings
    archiveOldActions: true,
    archiveAfterDays: 90,
    compressionEnabled: true,
    
    // Security settings
    cryptographicSigning: true,
    tamperDetection: true,
    integrityCheckInterval: 24 * 60 * 60 * 1000 // Daily
  },

  // Sybil & Replay Detector configuration
  sybilDetector: {
    enabled: true,
    
    // Sybil detection thresholds
    maxSimilarityThreshold: 0.85,
    minClusterSize: 3,
    coordinationTimeWindow: 5000, // 5 seconds
    
    // Replay detection
    replayTimeWindow: 60000, // 1 minute
    replaySimilarityThreshold: 0.9,
    
    // Pattern analysis
    minPatternOccurrences: 5,
    behaviorAnalysisWindow: 24 * 60 * 60 * 1000, // 24 hours
    
    // Alert thresholds
    highConfidenceThreshold: 0.8,
    mediumConfidenceThreshold: 0.6,
    lowConfidenceThreshold: 0.3,
    
    // Performance settings
    analysisInterval: 60000, // 1 minute
    maxProfilesInMemory: 10000,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    
    // Response settings
    autoResponse: {
      enabled: true,
      criticalAlertThreshold: 0.9,
      autoSuspendUsers: false, // Set to true for automatic suspensions
      notifyModerators: true
    }
  },

  // Integration settings
  integration: {
    // Background task intervals
    gossipPruneInterval: 24 * 60 * 60 * 1000, // 24 hours
    dagOptimizationInterval: 6 * 60 * 60 * 1000, // 6 hours
    auditMaintenanceInterval: 24 * 60 * 60 * 1000, // 24 hours
    sybilCleanupInterval: 60 * 60 * 1000, // 1 hour
    
    // Event processing
    eventProcessingDelay: 100, // milliseconds
    maxConcurrentProcessing: 10,
    queueMaxSize: 1000,
    
    // Health monitoring
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    performanceMetrics: true,
    alertOnPerformanceIssues: true,
    
    // Failover settings
    enableFailover: true,
    gracefulDegradation: true,
    fallbackToBasicMode: true
  },

  // Regional settings (for Relay's proximity-based features)
  regional: {
    // Different regions may have different settings
    default: {
      gossipRadius: 10, // kilometers
      maxPeersPerRegion: 20,
      regionSpecificModeration: true
    },
    
    // High-density regions (cities)
    highDensity: {
      gossipRadius: 2, // kilometers  
      maxPeersPerRegion: 50,
      regionSpecificModeration: true,
      enhancedSybilDetection: true
    },
    
    // Low-density regions (rural)
    lowDensity: {
      gossipRadius: 50, // kilometers
      maxPeersPerRegion: 10,
      regionSpecificModeration: false,
      relaxedThresholds: true
    }
  },

  // Security and privacy settings
  security: {
    // Cryptographic settings
    encryptionAlgorithm: 'AES-256-GCM',
    hashingAlgorithm: 'SHA-256',
    signatureAlgorithm: 'ECDSA',
    keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    
    // Privacy protection
    anonymizeOldData: true,
    anonymizeAfterDays: 90,
    saltUserIds: true,
    redactSensitiveInfo: true,
    
    // Rate limiting
    rateLimiting: {
      enabled: true,
      maxActionsPerMinute: 60,
      maxActionsPerHour: 1000,
      burstAllowance: 10
    }
  },

  // Monitoring and observability
  monitoring: {
    // Metrics collection
    collectMetrics: true,
    metricsInterval: 60000, // 1 minute
    retainMetricsFor: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Logging
    structuredLogging: true,
    logSamplingRate: 0.1, // 10% of events for performance
    logSensitiveData: false,
    
    // Alerting
    alerting: {
      enabled: true,
      performanceThresholds: {
        maxProcessingTime: 1000, // milliseconds
        maxMemoryUsage: 80, // percentage
        maxErrorRate: 5 // percentage
      },
      securityThresholds: {
        maxSybilAlerts: 10, // per hour
        maxFailedAuth: 100, // per hour
        suspiciousPatterns: 5 // per hour
      }
    }
  },

  // Development and testing settings
  development: {
    enableDebugMode: false,
    verboseLogging: false,
    simulationMode: false,
    skipCryptographicVerification: false,
    
    // Testing helpers
    mockDataGeneration: false,
    deterministicBehavior: false,
    fastTimeouts: false
  }
};

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(environment = 'production') {
  const envOverrides = {
    development: {
      global: {
        logLevel: 'debug',
        performanceMode: 'memory'
      },
      development: {
        enableDebugMode: true,
        verboseLogging: true,
        fastTimeouts: true
      },
      security: {
        anonymizeOldData: false,
        redactSensitiveInfo: false
      }
    },
    
    testing: {
      global: {
        logLevel: 'warn',
        performanceMode: 'memory'
      },
      development: {
        simulationMode: true,
        deterministicBehavior: true,
        mockDataGeneration: true
      },
      integration: {
        healthCheckInterval: 1000, // 1 second for tests
        gossipPruneInterval: 10000 // 10 seconds for tests
      }
    },
    
    staging: {
      global: {
        logLevel: 'info',
        performanceMode: 'balanced'
      },
      monitoring: {
        logSamplingRate: 0.5 // 50% sampling in staging
      }
    },
    
    production: {
      global: {
        logLevel: 'warn',
        performanceMode: 'performance'
      },
      monitoring: {
        logSamplingRate: 0.01 // 1% sampling in production
      },
      security: {
        anonymizeOldData: true,
        redactSensitiveInfo: true
      }
    }
  };

  // Deep merge base config with environment overrides
  const config = JSON.parse(JSON.stringify(HashgraphConfig));
  const overrides = envOverrides[environment] || {};
  
  return deepMerge(config, overrides);
}

/**
 * Deep merge utility function
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];

  // Check required fields
  if (!config.global) {
    errors.push('Missing global configuration');
  }

  // Check numerical constraints
  if (config.gossipMesh?.gossipInterval < 100) {
    errors.push('Gossip interval too low (minimum 100ms)');
  }

  if (config.dagConstructor?.consensusThreshold > 1 || config.dagConstructor?.consensusThreshold < 0) {
    errors.push('Consensus threshold must be between 0 and 1');
  }

  // Check security settings
  if (config.moderationAudit?.requireWitnesses && config.moderationAudit?.minWitnessCount < 1) {
    errors.push('Minimum witness count must be at least 1 when witnesses are required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default HashgraphConfig;
