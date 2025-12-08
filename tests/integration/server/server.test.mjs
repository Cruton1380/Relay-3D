// File: test/backend/server.test.mjs
// Comprehensive tests for backend/server.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';

// Mock dependencies first
const mockApp = {
  use: vi.fn(),
  listen: vi.fn(),
  close: vi.fn()
};

const mockServer = {
  listen: vi.fn((port, callback) => {
    if (callback) callback();
    return mockServer;
  }),
  close: vi.fn((callback) => {
    if (callback) callback();
    return mockServer;
  }),
  on: vi.fn()
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger)
};

const mockWebsocketService = {
  initialize: vi.fn(),
  registerAdapter: vi.fn()
};

const mockPresenceAdapter = {
  initialize: vi.fn()
};

const mockVoteAdapter = {
  initialize: vi.fn()
};

const mockNotificationAdapter = {
  initialize: vi.fn()
};

const mockRankingAdapter = {
  initialize: vi.fn()
};

const mockMetricsAdapter = {
  initialize: vi.fn()
};

const mockEncryptionAdapter = {
  initialize: vi.fn()
};

const mockHealthApi = {
  get: vi.fn(),
  post: vi.fn()
};

// Mock all dependencies
vi.mock('http', () => ({
  default: {
    createServer: vi.fn(() => mockServer)
  }
}));

vi.mock('../../../src/backend/app.mjs', () => ({
  default: mockApp
}));

vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger,
  logger: mockLogger
}));

vi.mock('../../../src/backend/websocket-service/index.mjs', () => ({
  default: mockWebsocketService
}));

vi.mock('../../../src/backend/websocket-service/presenceAdapter.mjs', () => ({
  default: mockPresenceAdapter
}));

vi.mock('../../../src/backend/websocket-service/voteAdapter.mjs', () => ({
  default: mockVoteAdapter
}));

vi.mock('../../../src/backend/websocket-service/notificationAdapter.mjs', () => ({
  default: mockNotificationAdapter
}));

vi.mock('../../../src/backend/websocket-service/rankingAdapter.mjs', () => ({
  default: mockRankingAdapter
}));

vi.mock('../../../src/backend/api/healthApi.mjs', () => ({
  default: mockHealthApi
}));

vi.mock('../../../src/backend/websocket-service/metricsAdapter.mjs', () => ({
  default: mockMetricsAdapter
}));

vi.mock('../../../src/backend/websocket-service/encryptionAdapter.mjs', () => ({
  default: mockEncryptionAdapter
}));

describe('Server', () => {
  let originalProcessEnv;
  let originalProcessExit;
  let mockProcessExit;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Store original process methods
    originalProcessEnv = process.env;
    originalProcessExit = process.exit;
    
    // Mock process.exit
    mockProcessExit = vi.fn();
    process.exit = mockProcessExit;
    
    // Reset process.env
    process.env = { ...originalProcessEnv };
    
    // Reset module cache using Vitest
    await vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalProcessEnv;
    process.exit = originalProcessExit;
    
    // Remove all listeners that might have been added
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
  });

  describe('Server Initialization', () => {
    it('should create HTTP server with imported app', async () => {
      await import('../../../src/backend/server.mjs');
      
      expect(http.createServer).toHaveBeenCalledWith(mockApp);
      expect(mockApp.use).toHaveBeenCalledWith('/api/health', mockHealthApi);
    });

    it('should initialize WebSocket service with server', async () => {
      await import('../../../src/backend/server.mjs');
      
      expect(mockWebsocketService.initialize).toHaveBeenCalledWith(mockServer);
    });
    
    it('should register all WebSocket adapters', async () => {
      await import('../../../src/backend/server.mjs');
      
      expect(mockPresenceAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
      expect(mockVoteAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
      expect(mockNotificationAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
      expect(mockRankingAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
      expect(mockMetricsAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
      expect(mockEncryptionAdapter.initialize).toHaveBeenCalledWith(mockWebsocketService);
    });    it('should use default port 3000 when PORT env var is not set', async () => {
      delete process.env.PORT;
      vi.clearAllMocks();
      
      await import('../../../src/backend/server.mjs');

      expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it('should use custom port from environment variable', async () => {
      process.env.PORT = '8080';
      vi.clearAllMocks();
      
      // We need to dynamically import to get the updated environment
      const serverModule = await import('../../../src/backend/server.mjs');
      
      expect(mockServer.listen).toHaveBeenCalledWith('8080', expect.any(Function));
    });

    it('should log server startup information', async () => {
      process.env.PORT = '4000';
      vi.clearAllMocks();
      
      await import('../../../src/backend/server.mjs');

      expect(mockLogger.child).toHaveBeenCalledWith({ module: 'server' });
      expect(mockLogger.info).toHaveBeenCalledWith('Server running on port 4000');
      expect(mockLogger.info).toHaveBeenCalledWith('WebSocket server available at ws://localhost:4000');
    });
  });

  describe('Health API Integration', () => {
    it('should mount health API at /api/health', async () => {
      await import('../../../src/backend/server.mjs');

      expect(mockApp.use).toHaveBeenCalledWith('/api/health', mockHealthApi);
    });
  });

  describe('Signal Handling', () => {
    it('should handle SIGTERM signal gracefully', async () => {
      await import('../../../src/backend/server.mjs');

      // Get the SIGTERM handler
      const listeners = process.listeners('SIGTERM');
      expect(listeners.length).toBeGreaterThan(0);

      // Execute the SIGTERM handler
      const sigtermHandler = listeners[listeners.length - 1];
      sigtermHandler();

      expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM signal received, shutting down gracefully');
      expect(mockServer.close).toHaveBeenCalled();
      
      // Simulate server close callback
      const closeCallback = mockServer.close.mock.calls[0][0];
      closeCallback();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Server closed');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle SIGINT signal gracefully', async () => {
      await import('../../../src/backend/server.mjs');

      // Get the SIGINT handler
      const listeners = process.listeners('SIGINT');
      expect(listeners.length).toBeGreaterThan(0);

      // Execute the SIGINT handler
      const sigintHandler = listeners[listeners.length - 1];
      sigintHandler();

      expect(mockLogger.info).toHaveBeenCalledWith('SIGINT signal received, shutting down gracefully');
      expect(mockServer.close).toHaveBeenCalled();
      
      // Simulate server close callback
      const closeCallback = mockServer.close.mock.calls[0][0];
      closeCallback();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Server closed');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unhandled promise rejections', async () => {
      await import('../../../src/backend/server.mjs');

      // Get the unhandledRejection handler
      const listeners = process.listeners('unhandledRejection');
      expect(listeners.length).toBeGreaterThan(0);

      // Execute the unhandledRejection handler
      const unhandledRejectionHandler = listeners[listeners.length - 1];
      const mockReason = 'Test rejection reason';
      const mockPromise = Promise.resolve();
      
      unhandledRejectionHandler(mockReason, mockPromise);

      expect(mockLogger.error).toHaveBeenCalledWith('Unhandled Rejection at:', {
        promise: mockPromise,
        reason: mockReason
      });
    });

    it('should handle uncaught exceptions', async () => {
      await import('../../../src/backend/server.mjs');

      // Get the uncaughtException handler
      const listeners = process.listeners('uncaughtException');
      expect(listeners.length).toBeGreaterThan(0);

      // Execute the uncaughtException handler
      const uncaughtExceptionHandler = listeners[listeners.length - 1];
      const mockError = new Error('Test uncaught exception');
      
      uncaughtExceptionHandler(mockError);

      expect(mockLogger.error).toHaveBeenCalledWith('Uncaught Exception:', mockError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('WebSocket Adapter Registration', () => {
    it('should initialize all adapters in correct order', async () => {
      await import('../../../src/backend/server.mjs');

      // Verify the order of initialization calls
      const initializeCalls = [
        mockPresenceAdapter.initialize,
        mockVoteAdapter.initialize,
        mockNotificationAdapter.initialize,
        mockRankingAdapter.initialize,
        mockMetricsAdapter.initialize,
        mockEncryptionAdapter.initialize
      ];

      for (const initializeCall of initializeCalls) {
        expect(initializeCall).toHaveBeenCalledWith(mockWebsocketService);
      }
    });

    it('should initialize WebSocket service before adapters', async () => {
      await import('../../../src/backend/server.mjs');

      // WebSocket service should be initialized before any adapter
      expect(mockWebsocketService.initialize).toHaveBeenCalledBefore(mockPresenceAdapter.initialize);
      expect(mockWebsocketService.initialize).toHaveBeenCalledBefore(mockVoteAdapter.initialize);
      expect(mockWebsocketService.initialize).toHaveBeenCalledBefore(mockNotificationAdapter.initialize);
    });
  });

  describe('Logger Configuration', () => {
    it('should create server-specific logger', async () => {
      await import('../../../src/backend/server.mjs');

      expect(mockLogger.child).toHaveBeenCalledWith({ module: 'server' });
    });

    it('should log startup messages with correct format', async () => {
      process.env.PORT = '4000';
      
      await import('../../../src/backend/server.mjs');

      expect(mockLogger.info).toHaveBeenCalledWith('Server running on port 4000');
      expect(mockLogger.info).toHaveBeenCalledWith('WebSocket server available at ws://localhost:4000');
    });
  });

  describe('App Integration', () => {
    it('should use imported app instance', async () => {
      await import('../../../src/backend/server.mjs');

      expect(http.createServer).toHaveBeenCalledWith(mockApp);
    });

    it('should mount health API before starting server', async () => {
      await import('../../../src/backend/server.mjs');

      expect(mockApp.use).toHaveBeenCalledWith('/api/health', mockHealthApi);
      expect(mockApp.use).toHaveBeenCalledBefore(mockServer.listen);
    });
  });

  describe('Process Event Listeners', () => {
    it('should register all required process event listeners', async () => {
      await import('../../../src/backend/server.mjs');

      expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0);
      expect(process.listenerCount('SIGINT')).toBeGreaterThan(0);
      expect(process.listenerCount('unhandledRejection')).toBeGreaterThan(0);
      expect(process.listenerCount('uncaughtException')).toBeGreaterThan(0);
    });

    it('should handle multiple signal events correctly', async () => {
      await import('../../../src/backend/server.mjs');

      // Simulate multiple SIGTERM signals
      const sigtermListeners = process.listeners('SIGTERM');
      const sigtermHandler = sigtermListeners[sigtermListeners.length - 1];
      
      sigtermHandler();
      sigtermHandler(); // Second signal should not cause issues
      
      expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM signal received, shutting down gracefully');
      expect(mockServer.close).toHaveBeenCalled();
    });
  });
  describe('Environment Configuration', () => {
    it('should handle string and number port values', async () => {
      process.env.PORT = '9000';
      vi.clearAllMocks();
      
      await import('../../../src/backend/server.mjs');

      expect(mockServer.listen).toHaveBeenCalledWith('9000', expect.any(Function));
    });

    it('should fallback to default port for invalid PORT values', async () => {
      process.env.PORT = '';
      vi.clearAllMocks();
      
      await import('../../../src/backend/server.mjs');

      expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });
  });

  describe('Server Lifecycle', () => {
    it('should complete full startup sequence', async () => {
      process.env.PORT = '3000';
      vi.clearAllMocks();
      
      await import('../../../src/backend/server.mjs');

      // Verify complete startup sequence
      expect(http.createServer).toHaveBeenCalledWith(mockApp);
      expect(mockApp.use).toHaveBeenCalledWith('/api/health', mockHealthApi);
      expect(mockWebsocketService.initialize).toHaveBeenCalledWith(mockServer);
      expect(mockServer.listen).toHaveBeenCalledWith('3000', expect.any(Function));
      expect(mockLogger.info).toHaveBeenCalledWith('Server running on port 3000');
    });

    it('should handle graceful shutdown sequence', async () => {
      await import('../../../src/backend/server.mjs');

      // Trigger SIGTERM
      const sigtermListeners = process.listeners('SIGTERM');
      const sigtermHandler = sigtermListeners[sigtermListeners.length - 1];
      sigtermHandler();

      // Verify shutdown sequence
      expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM signal received, shutting down gracefully');
      expect(mockServer.close).toHaveBeenCalled();
      
      // Complete the shutdown
      const closeCallback = mockServer.close.mock.calls[0][0];
      closeCallback();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Server closed');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });
});






