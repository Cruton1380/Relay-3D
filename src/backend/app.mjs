/**
 * @fileoverview Main application setup
 */
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.mjs';
import { csrfProtection } from './middleware/csrfProtection.mjs';
import { securityHeaders } from './middleware/securityHeaders.mjs';
import { rateLimiter } from './middleware/rateLimiter.mjs';

// Import route modules - MINIMAL SET FOR GLOBE SYSTEM
import authRoutes from './routes/auth.mjs';
import apiRoutes from './routes/index.mjs';
// import proximityModulesApi from './routes/proximityModulesApi.mjs'; // DISABLED
// import enhancedProximityApi from './routes/enhancedProximityApi.mjs'; // DISABLED
import dictionaryApiController from './api/dictionaryApiController.mjs';
import healthApi from './api/healthApi.mjs';
// import founderModeRoutes from './routes/founderMode.mjs'; // DISABLED
import channelsRoutes from './routes/channels.mjs'; // ESSENTIAL FOR GLOBE
import devRoutes from './routes/devRoutes.mjs';
import devCenterRoutes from './routes/devCenter.mjs';
// import chatroomRoutes from './routes/chatroom.mjs'; // DISABLED

// Import Stage 1: Democratic Geographic System
import boundaryProposalsAPI from './api/boundaryProposalsAPI.mjs';
import boundaryChannelsAPI from './api/boundaryChannelsAPI.mjs';

// Import Optimized Clustering System
import optimizedChannelsAPI from './api/optimizedChannelsAPI.mjs';

// Import Unified Boundary System
import boundaryAPI from './api/boundaryAPI.mjs';
import { boundaryService } from './services/boundaryService.mjs';

// Import GeoBoundaries Proxy API
import geoboundariesProxyAPI from './api/geoboundariesProxyAPI.mjs';

// Import Category System
import categoriesRoutes from './routes/categories.mjs';

// Import User Preferences (Phase 1: Location Tracking)
import userPreferencesRoutes from './routes/userPreferences.mjs';
import voterVisualizationRoutes from './routes/voterVisualization.mjs';
import mockVoterLoaderRoutes from './routes/mockVoterLoader.mjs';
import voterTileAPIRoutes from './routes/voterTileAPI.mjs'; // High-performance tile-based API
import voterStorageAPIRoutes from './routes/voterStorageAPI.mjs'; // New storage-based API
import { initLocationService } from './services/userLocationService.mjs';

// Create express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' })); // Increased limit for large candidate payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CORS Configuration with strict origin validation for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3002']; // Default dev origins

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, enforce strict origin checking
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy: Origin ${origin} is not allowed. Configure ALLOWED_ORIGINS environment variable.`;
        return callback(new Error(msg), false);
      }
    }
    
    // In development, allow all origins but log them
    if (process.env.NODE_ENV !== 'production' && allowedOrigins.indexOf(origin) === -1) {
      console.warn(`⚠️ CORS: Allowing unconfigured origin in dev mode: ${origin}`);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Transaction-Hash', 'X-Block-Number'], // Expose blockchain headers
  maxAge: 86400 // 24 hours preflight cache
}));

app.use(securityHeaders);

// Add request ID to each request
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// Apply rate limiting to auth routes
app.use('/api/auth', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
}));

// Apply CSRF protection except for authentication routes (temporarily disabled for development)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  // csrfProtection(req, res, next); // Temporarily disabled
  next();
});

// Mount routes - MINIMAL SET FOR GLOBE SYSTEM
app.use('/api/auth', authRoutes);
// app.use('/api/proximity', proximityModulesApi); // DISABLED
// app.use('/api/proximity-enhanced', enhancedProximityApi); // DISABLED
app.use('/api/dictionary', dictionaryApiController);
app.use('/api/health', healthApi);
// app.use('/api/founder-mode', founderModeRoutes); // DISABLED
app.use('/api/channels', channelsRoutes); // ESSENTIAL FOR GLOBE
// app.use('/api/chatroom', chatroomRoutes); // DISABLED
app.use('/api/dev', devRoutes); // Development routes
app.use('/api/dev-center', devCenterRoutes); // Development center
app.use('/api', apiRoutes);

// Stage 1: Democratic Geographic System - Boundary Proposals API
app.use('/api/boundary-proposals', boundaryProposalsAPI);
app.use('/api/boundary-channels', boundaryChannelsAPI);

// Optimized Clustering System API
app.use('/api/optimized-channels', optimizedChannelsAPI);

// Unified Boundary System API
app.use('/api/boundaries', boundaryAPI);

// GeoBoundaries Proxy API (to avoid CORS issues)
app.use('/api/geoboundaries-proxy', geoboundariesProxyAPI);

// Category System API
app.use('/api/categories', categoriesRoutes);

// Phase 1: Location Tracking - User Preferences API
app.use('/api/user/preferences', userPreferencesRoutes);

// Phase 2: Voter Visualization API
app.use('/api/visualization', voterVisualizationRoutes);

// Phase 3: High-Performance Tile-Based Voter API (NEW - Scalable to millions)
app.use('/api/voters/tiles', voterTileAPIRoutes);

// Phase 4: Storage-Based Voter API (NEW - Bbox queries with spatial indexing)
app.use('/api/voters', voterStorageAPIRoutes);

// Mock Voter Loader API (Development Only)
app.use('/api/mock-voters', mockVoterLoaderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

export default app;

import { logger } from './utils/logging/logger.mjs';
import serviceRegistry from './serviceRegistry-service/index.mjs';

// Import services
import { authService } from './auth/index.mjs';
// import blockchainService from './blockchain-service/index.mjs'; // REMOVED: Git-native backend
import configService from './config-service/index.mjs';
import { eventBus } from './eventBus-service/index.mjs';
// import regionManager from './location/regionManager.mjs'; // Archived - using unifiedBoundaryService
import sessionManager from './auth/core/sessionManager.mjs';
// import websocketService from './websocket-service/index.mjs'; // REMOVED: Polling replaces WebSocket

// Register services with dependencies
serviceRegistry.register('configService', configService, []);
serviceRegistry.register('eventBus', eventBus, ['configService']);
serviceRegistry.register('sessionManager', sessionManager, ['configService']);
// serviceRegistry.register('regionManager', regionManager, ['configService']); // Archived - using unifiedBoundaryService
// serviceRegistry.register('blockchain', blockchainService, ['configService', 'eventBus']); // REMOVED: Git-native backend
serviceRegistry.register('authService', authService, ['configService', 'eventBus', 'sessionManager']);
// serviceRegistry.register('voteService', voteService, ['configService', 'eventBus', 'blockchain', 'regionManager']);
// websocketService is initialized manually in server.mjs, not through service registry (NOW REMOVED)

// Register dictionary services
import categorySystem from './dictionary/categorySystem.mjs';
import dictionaryTextParser from './dictionary/dictionaryTextParser.mjs';
import dictionarySearchService from './dictionary/dictionarySearchService.mjs';

serviceRegistry.register('categorySystem', categorySystem, ['configService', 'eventBus']);
serviceRegistry.register('dictionaryTextParser', dictionaryTextParser, ['configService', 'eventBus']);
serviceRegistry.register('dictionarySearchService', dictionarySearchService, ['configService', 'eventBus', 'categorySystem', 'dictionaryTextParser']);

// Register proximity modules - DISABLED FOR MINIMAL GLOBE SYSTEM
// import proximityEncounterManager from './channel-service/proximityEncounterManager.mjs';
// import proximityOwnershipManager from './channel-service/proximityOwnershipManager.mjs';
// import proximityOnboardingService from './onboarding/proximityOnboardingService.mjs';
// import inviteeInitializationService from './onboarding/inviteeInitializationService.mjs';
// Import enhanced proximity services - DISABLED FOR MINIMAL GLOBE SYSTEM
// import MultiFactorProximityService from './channel-service/multiFactorProximityService.mjs';
// import DelayedVerificationService from './channel-service/delayedVerificationService.mjs';
// import GroupOnboardingService from './onboarding/groupOnboardingService.mjs';
// import MobileOptimizationService from './channel-service/mobileOptimizationService.mjs';
// import blockchainUserService from './blockchain-service/blockchainUserService.mjs'; // REMOVED: Git-native backend

// Import new production services as singletons
import regionalElectionService from './services/regionalElectionService.mjs';
import globalCommissionService from './services/globalCommissionService.mjs';
import regionalMultiSigService from './services/regionalMultiSigService.mjs';
import microshardingManager from './services/microshardingManager.mjs';

// DISABLED FOR MINIMAL GLOBE SYSTEM
// serviceRegistry.register('proximityEncounterManager', proximityEncounterManager, ['configService', 'eventBus']);
// serviceRegistry.register('proximityOwnershipManager', proximityOwnershipManager, ['configService', 'eventBus']);
// serviceRegistry.register('proximityOnboardingService', proximityOnboardingService, ['configService', 'eventBus', 'authService']);
// serviceRegistry.register('inviteeInitializationService', inviteeInitializationService, ['configService', 'eventBus', 'authService']);

// Register blockchain user service
serviceRegistry.register('blockchainUserService', blockchainUserService, []);

// Register new production services - DISABLED FOR MINIMAL GLOBE SYSTEM
// serviceRegistry.register('regionalElectionService', regionalElectionService, ['configService', 'eventBus', 'regionManager']);
// serviceRegistry.register('globalCommissionService', globalCommissionService, ['configService', 'eventBus', 'blockchain']);
// serviceRegistry.register('regionalMultiSigService', regionalMultiSigService, ['configService', 'eventBus', 'authService']);
// serviceRegistry.register('microshardingManager', microshardingManager, ['configService', 'eventBus', 'blockchain']);

// Register enhanced proximity services - DISABLED FOR MINIMAL GLOBE SYSTEM
// serviceRegistry.register('multiFactorProximityService', new MultiFactorProximityService(), ['configService']);
// serviceRegistry.register('delayedVerificationService', new DelayedVerificationService(), ['configService']);
// groupOnboardingService will be registered in initializeApp() function
// serviceRegistry.register('mobileOptimizationService', new MobileOptimizationService(), ['configService']);

// Register the group onboarding service (will be initialized later in server) - DISABLED
// const groupOnboardingService = new GroupOnboardingService(serviceRegistry);
// serviceRegistry.register('groupOnboardingService', groupOnboardingService, []);

// Register founder mode service
import { founderModeService } from './services/founderModeService.mjs';
serviceRegistry.register('founderModeService', founderModeService, ['configService']);

export { app };

import { middleware } from './auth/index.mjs';
const { authenticate } = middleware;

import failureTracker from './auth/utils/failureTracker.mjs';
import signatureVerifier from './auth/utils/signatureVerifier.mjs';
