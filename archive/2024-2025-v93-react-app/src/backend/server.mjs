/**
 * @fileoverview Main server entry point
 */
import http from 'http';
import { app } from './app.mjs';  // Import the basic app without full initialization
import logger from './utils/logging/logger.mjs';
// import websocketService from './websocket-service/index.mjs'; // REMOVED: Polling replaces WebSocket
// import presenceAdapter from './websocket-service/presenceAdapter.mjs'; // REMOVED
// import voteAdapter from './websocket-service/voteAdapter.mjs'; // REMOVED
// import notificationAdapter from './websocket-service/notificationAdapter.mjs'; // REMOVED
// import rankingAdapter from './websocket-service/rankingAdapter.mjs'; // REMOVED
import healthApi from './api/healthApi.mjs';
// import metricsAdapter from './websocket-service/metricsAdapter.mjs'; // REMOVED
// import encryptionAdapter from './websocket-service/encryptionAdapter.mjs'; // REMOVED
import serviceRegistry from './serviceRegistry-service/index.mjs';
// import boundaryChannelService from './services/boundaryChannelService.mjs'; // TODO: Fix and re-enable
import { boundaryService } from './services/boundaryService.mjs';
import { initLocationService } from './services/userLocationService.mjs';
// import { BlockchainAnchoringSystem } from './hashgraph/blockchainAnchoringSystem.mjs'; // REMOVED: Git-native backend
// import blockchain from './blockchain-service/index.mjs'; // REMOVED: Git-native backend
import { getStorage } from './storage/index.mjs';
// P2P and microsharding imports moved to dynamic imports to handle missing dependencies gracefully

// Create server logger
const serverLogger = logger.child({ module: 'server' });

// Initialize Hashgraph Anchoring System (REMOVED - Git-native backend)
// let hashgraphAnchoring = null;

// Get port from environment and ensure it's the correct type
const PORT = process.env.PORT ? process.env.PORT : 3002;

// Add health API routes
app.use('/api/health', healthApi);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service with server instance (REMOVED - Polling replaces WebSocket)
// websocketService.initialize(server);

// Register WebSocket adapters (REMOVED - Polling replaces WebSocket)
const initializeAdapters = async () => {
  serverLogger.info('WebSocket adapters skipped - using query hook polling');
  // try {
  //   await Promise.all([
  //     presenceAdapter.initialize(websocketService),
  //     voteAdapter.initialize(websocketService),
  //     notificationAdapter.initialize(websocketService),
  //     rankingAdapter.initialize(websocketService),
  //     metricsAdapter.initialize(websocketService),
  //     encryptionAdapter.initialize(websocketService)
  //   ]);
  //   serverLogger.info('All WebSocket adapters initialized successfully');
  // } catch (error) {
  //   serverLogger.error('Failed to initialize WebSocket adapters:', error);
  //   throw error;
  // }
};

// Start server
const startServer = async () => {
  try {
    await initializeAdapters();
    
    // Initialize the boundary service
    await boundaryService.initialize();
    serverLogger.info('Boundary service initialized successfully');
    
    // Initialize the user location service
    await initLocationService();
    serverLogger.info('User location service initialized successfully');
    
    // Initialize voter storage system
    await getStorage();
    serverLogger.info('Voter storage system initialized successfully');
    
    // Initialize blockchain first (required for hashgraph anchoring) (REMOVED - Git-native backend)
    // await blockchain.initialize();
    serverLogger.info('Blockchain service skipped - using Git-native backend');
    
    // 🔗 INTEGRATION: Initialize P2P service for distributed storage (dynamic import)
    try {
      const { default: p2pService } = await import('./p2p-service/index.mjs');
      
      const p2pConfig = {
        port: process.env.P2P_PORT || 4002,
        bootstrap: process.env.P2P_BOOTSTRAP_NODES?.split(',').filter(Boolean) || [],
        enableDHT: true,
        enablePubSub: true
      };
      
      await p2pService.initialize(p2pConfig);
      await p2pService.start();
      
      // Make P2P service available globally
      app.locals.p2pService = p2pService;
      
      serverLogger.info('🔗 P2P service initialized successfully', {
        port: p2pConfig.port,
        bootstrapNodes: p2pConfig.bootstrap.length
      });
    } catch (error) {
      serverLogger.warn('⚠️ P2P service initialization failed (non-blocking)', { 
        error: error.message,
        note: 'Install libp2p packages to enable P2P features'
      });
      // Non-blocking: system continues without P2P
    }
    
    // 🔗 INTEGRATION: Initialize microsharding service for vote distribution (dynamic import)
    try {
      const { default: microshardingService } = await import('./microsharding-service/index.mjs');
      // Microsharding service is a singleton, just ensure it's available
      app.locals.microshardingService = microshardingService;
      serverLogger.info('🔗 Microsharding service initialized successfully');
    } catch (error) {
      serverLogger.warn('⚠️ Microsharding service initialization failed (non-blocking)', { 
        error: error.message,
        note: 'P2P service required for microsharding'
      });
    }
    
    // Initialize Hashgraph Anchoring System (REMOVED - Git-native backend)
    // hashgraphAnchoring = new BlockchainAnchoringSystem({
    //   blockchainProvider: blockchain,
    //   anchorInterval: 300000, // Anchor every 5 minutes (for active development)
    //   batchSize: 10,
    //   confirmationBlocks: 6,
    //   retryAttempts: 3
    // });
    
    // Make hashgraph anchoring available globally
    // app.locals.hashgraphAnchoring = hashgraphAnchoring;
    serverLogger.info('Hashgraph anchoring skipped - using Git-native backend');
    
    // Initialize the service registry after WebSocket is set up
    app.locals.serviceRegistry = serviceRegistry;
    await serviceRegistry.initialize();
    serverLogger.info('Application services initialized successfully');
    
    // Initialize boundary channel service to load existing channels and initialize votes (TODO: Fix imports)
    // await boundaryChannelService.initialize();
    serverLogger.info('Boundary channel service skipped - needs import fixes');
    
    server.listen(PORT, () => {
      serverLogger.info(`Server running on port ${PORT}`);
      serverLogger.info(`WebSocket server available at ws://localhost:${PORT}`);
    });

    // Handle server shutdown
    const gracefulShutdown = (signal) => {
      serverLogger.info(`${signal} signal received, shutting down gracefully`);
      server.close(() => {
        serverLogger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      serverLogger.error('Unhandled Rejection at:', {
        promise,
        reason
      });
    });

    process.on('uncaughtException', (error) => {
      serverLogger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    serverLogger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

