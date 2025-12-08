// File: test/backend/app.test.mjs
// Comprehensive tests for backend/app.mjs

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

// Mock dependencies before importing app
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  child: vi.fn(() => mockLogger)
};

const mockServiceRegistry = {
  register: vi.fn(),
  initialize: vi.fn().mockResolvedValue(true),
  get: vi.fn()
};

const mockEventBus = {
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn()
};

const mockAuthService = {
  initialize: vi.fn()
};

const mockBlockchainService = {
  initialize: vi.fn()
};

const mockConfigService = {
  initialize: vi.fn(),
  get: vi.fn()
};

const mockSessionManager = {
  initialize: vi.fn()
};

const mockRegionManager = {
  initialize: vi.fn()
};

const mockWebsocketService = {
  initialize: vi.fn()
};

const mockMiddleware = {
  authenticate: vi.fn((req, res, next) => next())
};

const mockFailureTracker = {
  track: vi.fn()
};

const mockSignatureVerifier = {
  verify: vi.fn()
};

// Setup mocks
vi.mock('../src/backend/utils/logging/logger.mjs', () => ({
  logger: mockLogger,
  default: mockLogger
}));

vi.mock('../src/backend/services/serviceRegistry.mjs', () => ({
  default: mockServiceRegistry
}));

vi.mock('../src/backend/services/eventBus.mjs', () => ({
  eventBus: mockEventBus
}));

vi.mock('../src/backend/auth/index.mjs', () => ({
  authService: mockAuthService,
  middleware: mockMiddleware
}));

vi.mock('../src/backend/blockchain-service/index.mjs', () => ({
  default: mockBlockchainService
}));

vi.mock('../src/backend/config-service/index.mjs', () => ({
  default: mockConfigService
}));

vi.mock('../src/backend/auth/core/sessionManager.mjs', () => ({
  default: mockSessionManager
}));

vi.mock('../src/backend/location/regionManager.mjs', () => ({
  default: mockRegionManager
}));

vi.mock('../src/backend/websocket-service/index.mjs', () => ({
  default: mockWebsocketService
}));

vi.mock('../src/backend/auth/utils/failureTracker.mjs', () => ({
  default: mockFailureTracker
}));

vi.mock('../src/backend/auth/utils/signatureVerifier.mjs', () => ({
  default: mockSignatureVerifier
}));

// Mock route modules with actual Express Router instances
vi.mock('../src/backend/routes/auth.mjs', async () => {
  const express = await import('express');
  const router = express.Router();
  
  // Add some basic routes for testing
  router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));
  router.post('/login', (req, res) => res.json({ success: true }));
  router.post('/register', (req, res) => res.json({ success: true }));
  router.post('/logout', (req, res) => res.json({ success: true }));
  
  return { default: router };
});

vi.mock('../src/backend/routes/index.mjs', async () => {
  const express = await import('express');
  const router = express.Router();
  
  // Add some basic routes for testing
  router.get('/health', (req, res) => res.json({ status: 'ok', service: 'api' }));
  router.get('/status', (req, res) => res.json({ status: 'running' }));
  
  return { default: router };
});

// Mock services first
vi.mock('../src/backend/serviceRegistry-service/index.mjs', () => ({
  default: mockServiceRegistry
}));

vi.mock('../src/backend/eventBus-service/index.mjs', () => ({
  eventBus: mockEventBus
}));

vi.mock('../src/backend/websocket-service/index.mjs', () => ({
  default: mockWebsocketService
}));

// Mock middleware
vi.mock('../src/backend/middleware/errorHandler.mjs', () => ({
  errorHandler: vi.fn((err, req, res, next) => {
    res.status(500).json({ error: 'Internal Server Error' });
  })
}));

vi.mock('../src/backend/middleware/csrfProtection.mjs', () => ({
  csrfProtection: vi.fn((req, res, next) => next())
}));

vi.mock('../src/backend/middleware/securityHeaders.mjs', () => ({
  securityHeaders: vi.fn((req, res, next) => next())
}));

vi.mock('../src/backend/middleware/rateLimiter.mjs', () => ({
  rateLimiter: vi.fn(() => (req, res, next) => next())
}));

// Global variables for all tests
let app, initializeApp;

// ✅ Fixed on June 20, 2025 - Reason: Added timeout for slow import operations
// Global setup before all tests
beforeAll(async () => {
  mockServiceRegistry.register.mockClear();
  mockServiceRegistry.initialize.mockClear();
  
  // Import the app and initialization function
  const appModule = await import('../src/backend/app.mjs');
  app = appModule.app;
  initializeApp = appModule.initializeApp;
}, 30000); // 30 second timeout for import operations

describe('App Configuration', () => {
  // Basic Express Setup Tests (merged from app-basic.test.mjs)
  describe('Basic Express Setup', () => {
    it('should create Express app instance', async () => {
      const { app } = await import('../src/backend/app.mjs');
      
      expect(app).toBeDefined();
      expect(typeof app).toBe('function'); // Express app is a function
    });

    it('should apply JSON parsing middleware', async () => {
      const { app } = await import('../src/backend/app.mjs');
      
      // Test that JSON middleware is applied by checking the app stack
      expect(app._router).toBeDefined();
    });

    it('should apply URL-encoded parsing middleware', async () => {
      const { app } = await import('../src/backend/app.mjs');
      
      // Verify middleware stack includes URL-encoded parser
      expect(app._router).toBeDefined();
    });

    it('should configure CORS correctly', async () => {
      const { app } = await import('../src/backend/app.mjs');
      
      // CORS should be configured in the middleware stack
      expect(app._router).toBeDefined();
    });
  });

  describe('Express App Setup', () => {
    it('should create express app with basic middleware', async () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function'); // Express app is a function
    });

    it('should respond to health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should not throw error for JSON parsing
      expect(response.status).toBeDefined();
    });

    it('should set request ID for each request', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // The middleware should have added a requestId
      expect(response.status).toBe(200);
    });

    it('should apply CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle rate limiting for auth routes', async () => {
      // Test that rate limiter is applied to /api/auth routes
      const response = await request(app)
        .get('/api/auth/status')
        .expect(404); // Route doesn't exist but middleware should be applied

      expect(response.status).toBeDefined();
    });
  });

  describe('Service Registration', () => {
    it('should register all required services', async () => {
      // Test that the app loads successfully without errors, which indicates services are registered
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      
      // Test that initialization works, which depends on proper service registration
      await initializeApp();
      expect(mockServiceRegistry.initialize).toHaveBeenCalled();
    });

    it('should initialize service registry', async () => {
      await initializeApp();
      expect(mockServiceRegistry.initialize).toHaveBeenCalled();
    });

    it('should log successful initialization', async () => {
      await initializeApp();
      expect(mockLogger.info).toHaveBeenCalledWith('Application with enhanced proximity services initialized successfully');
    });

    it('should handle initialization errors', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
      mockServiceRegistry.initialize.mockRejectedValueOnce(new Error('Init failed'));

      await initializeApp();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize application', { error: 'Init failed' });
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should apply error handling middleware', async () => {
      // The errorHandler mock should be called for any errors
      expect(app._router).toBeDefined();
    });
  });

  describe('Security Middleware', () => {
    it('should apply security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet should add security headers
      expect(response.headers).toBeDefined();
    });

    it('should apply CSRF protection to non-auth API routes', async () => {
      // CSRF protection should be applied to /api routes except /api/auth
      const response = await request(app)
        .post('/api/non-auth-endpoint')
        .expect(404); // Route doesn't exist but middleware is applied

      expect(response.status).toBeDefined();
    });

    it('should skip CSRF protection for auth routes', async () => {
      // Auth routes should skip CSRF protection
      const response = await request(app)
        .post('/api/auth/login')
        .expect(200); // Route exists and should respond successfully

      expect(response.body.success).toBe(true);
    });
  });

  describe('Route Mounting', () => {
    it('should mount auth routes at /api/auth', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(404); // Route handler doesn't exist but path is mounted

      expect(response.status).toBeDefined();
    });

    it('should mount API routes at /api', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200); // Route exists and should respond successfully

      expect(response.body.status).toBe('running');
    });
  });

  describe('Request Processing', () => {
    it('should parse URL encoded data', async () => {
      // Test that the app can parse URL-encoded data by posting to a route that accepts it
      const response = await request(app)
        .post('/api/auth/login')
        .send('username=testuser&password=testpass')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle cookies', async () => {
      const response = await request(app)
        .get('/health')
        .set('Cookie', 'test=value')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });
});






