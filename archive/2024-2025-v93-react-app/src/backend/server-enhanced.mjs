/**
 * Enhanced Server Startup
 * Includes validation, cache management, and health monitoring
 */

import express from 'express';
import cors from 'cors';
import logger from './utils/logging/logger.mjs';
import StartupValidator from './utils/startupValidator.mjs';
import CacheManager from './utils/cacheManager.mjs';
import HealthMonitor from './utils/healthMonitor.mjs';
import VotePersistence from './voting/votePersistence.mjs';

const serverLogger = logger.child({ module: 'enhanced-server' });

class EnhancedServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3002;
    this.validator = new StartupValidator();
    this.cacheManager = new CacheManager();
    this.healthMonitor = new HealthMonitor();
    this.votePersistence = new VotePersistence();
    this.isShuttingDown = false;
  }

  /**
   * Initialize server with enhanced error handling
   */
  async initialize() {
    try {
      serverLogger.info('Starting enhanced server initialization...');

      // Step 1: Clear caches if needed
      await this.handleCacheIssues();

      // Step 2: Run startup validation
      const validationPassed = await this.runStartupValidation();
      if (!validationPassed) {
        throw new Error('Startup validation failed');
      }

      // Step 3: Load persistent vote data
      await this.loadPersistentData();

      // Step 4: Setup middleware
      this.setupMiddleware();

      // Step 5: Setup routes
      await this.setupRoutes();

      // Step 6: Start health monitoring
      this.startHealthMonitoring();

      // Step 7: Setup graceful shutdown
      this.setupGracefulShutdown();

      serverLogger.info('Enhanced server initialization completed successfully');
      return true;

    } catch (error) {
      serverLogger.error('Enhanced server initialization failed:', error);
      return false;
    }
  }

  /**
   * Handle cache issues proactively
   */
  async handleCacheIssues() {
    try {
      // Check for cache integrity issues
      const cacheIssues = this.cacheManager.validateCacheIntegrity();
      
      if (cacheIssues.length > 0) {
        serverLogger.warn('Cache integrity issues detected, clearing caches', {
          issues: cacheIssues
        });
        
        await this.cacheManager.clearAllCaches();
        this.cacheManager.createFreshCaches();
      }
    } catch (error) {
      serverLogger.warn('Cache handling failed, continuing with startup:', error.message);
    }
  }

  /**
   * Run comprehensive startup validation
   */
  async runStartupValidation() {
    try {
      // Add custom validation checks
      this.validator.addCheck('vote-system-integrity', async () => {
        const { getTopicVoteTotals } = await import('./voting/votingEngine.mjs');
        const testTotals = getTopicVoteTotals('validation-test');
        
        if (typeof testTotals.totalVotes !== 'number') {
          throw new Error('Vote system not returning proper data structure');
        }
      }, true);

      this.validator.addCheck('blockchain-connectivity', async () => {
        const { blockchain } = await import('./state/state.mjs');
        await blockchain.initialize();
        
        if (!blockchain.chain || !Array.isArray(blockchain.chain)) {
          throw new Error('Blockchain not properly initialized');
        }
      }, true);

      // Run all validations
      const passed = await this.validator.runAllChecks();
      
      if (!passed) {
        serverLogger.error('Startup validation failed - server cannot start safely');
        return false;
      }

      serverLogger.info('All startup validations passed');
      return true;

    } catch (error) {
      serverLogger.error('Startup validation error:', error);
      return false;
    }
  }

  /**
   * Load persistent vote data
   */
  async loadPersistentData() {
    try {
      const voteData = await this.votePersistence.loadVoteData();
      
      // Initialize vote system with persistent data
      const { initializeVoteSystem } = await import('./voting/votingEngine.mjs');
      await initializeVoteSystem(voteData);
      
      // Start auto-save
      this.votePersistence.startAutoSave(() => {
        // This would get current vote data from the voting engine
        return voteData;
      });

      serverLogger.info('Persistent vote data loaded successfully');
    } catch (error) {
      serverLogger.warn('Failed to load persistent vote data, starting fresh:', error.message);
    }
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' })); // Increased limit for large candidate payloads
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      serverLogger.debug('Request received', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const healthStatus = this.healthMonitor.getHealthStatus();
      res.json(healthStatus);
    });
  }

  /**
   * Setup routes
   */
  async setupRoutes() {
    try {
      // Import and setup all route modules
      const voteRoutes = await import('./routes/vote.mjs');
      const channelRoutes = await import('./routes/channels.mjs');
      
      this.app.use('/api/vote', voteRoutes.default);
      this.app.use('/api/channels', channelRoutes.default);

      serverLogger.info('Routes setup completed');
    } catch (error) {
      serverLogger.error('Route setup failed:', error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthMonitor.start();
    serverLogger.info('Health monitoring started');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      serverLogger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop health monitoring
        this.healthMonitor.stop();

        // Save persistent data
        await this.votePersistence.forceSave(() => {
          // Get current vote data
          return {};
        });

        // Stop server
        if (this.server) {
          this.server.close(() => {
            serverLogger.info('Server closed successfully');
            process.exit(0);
          });
        }

      } catch (error) {
        serverLogger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Start the server
   */
  async start() {
    try {
      const initialized = await this.initialize();
      
      if (!initialized) {
        throw new Error('Server initialization failed');
      }

      this.server = this.app.listen(this.port, () => {
        serverLogger.info('Enhanced server started successfully', {
          port: this.port,
          environment: process.env.NODE_ENV || 'development'
        });
      });

      return true;

    } catch (error) {
      serverLogger.error('Failed to start enhanced server:', error);
      return false;
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EnhancedServer();
  server.start().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

export default EnhancedServer;
