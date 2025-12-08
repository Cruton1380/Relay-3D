// File: test/backend/routes/globalParameters.test.mjs

/**
 * @fileoverview Tests for global parameters routes
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock implementations for the API functions
const mockGetAllGlobalParameters = vi.fn();
const mockGetGlobalParameter = vi.fn();
const mockVoteOnGlobalParameter = vi.fn();
const mockGetGlobalParameterVotingStatus = vi.fn();

// Mock the API module
vi.mock('../../src/backend/api/globalParametersApi.mjs', () => ({
  getAllGlobalParameters: mockGetAllGlobalParameters,
  getGlobalParameter: mockGetGlobalParameter,
  voteOnGlobalParameter: mockVoteOnGlobalParameter,
  getGlobalParameterVotingStatus: mockGetGlobalParameterVotingStatus
}));

// Mock authentication middleware
const mockAuthenticate = vi.fn(() => (req, res, next) => {
  req.user = { userId: 'test-user-id', reliability: 1.0 };
  next();
});

vi.mock('../../src/backend/auth/middleware/index.mjs', () => ({
  authenticate: mockAuthenticate
}));

describe('Global Parameters Routes', () => {
  let app;
  let globalParametersRouter;  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset modules to ensure fresh imports
    await vi.resetModules();
    
    // Reset authentication mock
    mockAuthenticate.mockImplementation(() => (req, res, next) => {
      req.user = { userId: 'test-user-id', reliability: 1.0 };
      next();
    });
    
    // Reset mock implementations
    mockGetAllGlobalParameters.mockImplementation((req, res) => {
      res.json({ success: true, parameters: { testParam: 'testValue' } });
    });
    
    mockGetGlobalParameter.mockImplementation((req, res) => {
      res.json({ success: true, key: req.params.paramName, value: 'testValue' });
    });
    
    mockVoteOnGlobalParameter.mockImplementation((req, res) => {
      res.json({ success: true, message: 'Vote recorded' });
    });
    
    mockGetGlobalParameterVotingStatus.mockImplementation((req, res) => {
      res.json({ success: true, paramName: req.params.paramName, votes: 5, required: 10 });
    });

    // Import the router after mocks are set up
    const routerModule = await import('../../src/backend/routes/globalParameters.mjs');
    globalParametersRouter = routerModule.default;
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/global-parameters', globalParametersRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /', () => {
    it('should call getAllGlobalParameters handler', async () => {
      const response = await request(app)
        .get('/api/global-parameters/')
        .expect(200);

      expect(mockGetAllGlobalParameters).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        parameters: { testParam: 'testValue' }
      });
    });

    it('should handle errors from getAllGlobalParameters', async () => {
      mockGetAllGlobalParameters.mockImplementation((req, res) => {
        res.status(500).json({ success: false, error: 'Internal server error' });
      });

      const response = await request(app)
        .get('/api/global-parameters/')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /:paramName', () => {
    it('should call getGlobalParameter handler with correct parameter', async () => {
      const paramName = 'testParameter';
      
      const response = await request(app)
        .get(`/api/global-parameters/${paramName}`)
        .expect(200);

      expect(mockGetGlobalParameter).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        key: paramName,
        value: 'testValue'
      });
    });

    it('should handle parameter names with special characters', async () => {
      const paramName = 'voting.threshold';
      
      await request(app)
        .get(`/api/global-parameters/${paramName}`)
        .expect(200);

      expect(mockGetGlobalParameter).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from getGlobalParameter', async () => {
      mockGetGlobalParameter.mockImplementation((req, res) => {
        res.status(404).json({ success: false, error: 'Parameter not found' });
      });

      const response = await request(app)
        .get('/api/global-parameters/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Parameter not found'
      });
    });
  });

  describe('POST /vote', () => {
    it('should call voteOnGlobalParameter handler with authentication', async () => {
      const voteData = {
        paramName: 'testParam',
        value: 10
      };

      const response = await request(app)
        .post('/api/global-parameters/vote')
        .send(voteData)
        .expect(200);

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockVoteOnGlobalParameter).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        message: 'Vote recorded'
      });
    });    it('should require authentication for voting', async () => {
      // Need to set up authentication failure before importing router
      await vi.resetModules();
      
      // Mock authentication failure
      mockAuthenticate.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      // Re-import the router with failing auth mock
      const routerModule = await import('../../src/backend/routes/globalParameters.mjs');
      const authFailApp = express();
      authFailApp.use(express.json());
      authFailApp.use('/api/global-parameters', routerModule.default);

      const voteData = {
        paramName: 'testParam',
        value: 10
      };

      const response = await request(authFailApp)
        .post('/api/global-parameters/vote')
        .send(voteData)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Authentication required'
      });
      expect(mockVoteOnGlobalParameter).not.toHaveBeenCalled();
    });

    it('should handle voting errors', async () => {
      mockVoteOnGlobalParameter.mockImplementation((req, res) => {
        res.status(400).json({ success: false, error: 'Invalid vote data' });
      });

      const voteData = {
        paramName: 'testParam',
        value: 'invalid'
      };

      const response = await request(app)
        .post('/api/global-parameters/vote')
        .send(voteData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid vote data'
      });
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/global-parameters/vote')
        .expect(200); // Will still reach handler, but handler will validate

      expect(mockVoteOnGlobalParameter).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /:paramName/voting-status', () => {
    it('should call getGlobalParameterVotingStatus handler', async () => {
      const paramName = 'testParameter';
      
      const response = await request(app)
        .get(`/api/global-parameters/${paramName}/voting-status`)
        .expect(200);

      expect(mockGetGlobalParameterVotingStatus).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        paramName: paramName,
        votes: 5,
        required: 10
      });
    });

    it('should handle voting status errors', async () => {
      mockGetGlobalParameterVotingStatus.mockImplementation((req, res) => {
        res.status(404).json({ success: false, error: 'Parameter not found' });
      });

      const response = await request(app)
        .get('/api/global-parameters/nonexistent/voting-status')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Parameter not found'
      });
    });

    it('should handle complex parameter names in voting status', async () => {
      const paramName = 'complex.parameter.name';
      
      await request(app)
        .get(`/api/global-parameters/${paramName}/voting-status`)
        .expect(200);

      expect(mockGetGlobalParameterVotingStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route Integration', () => {
    it('should properly mount all routes', async () => {
      // Test that all routes are accessible
      const routes = [
        { method: 'GET', path: '/' },
        { method: 'GET', path: '/testParam' },
        { method: 'POST', path: '/vote' },
        { method: 'GET', path: '/testParam/voting-status' }
      ];

      for (const route of routes) {
        const request_method = route.method.toLowerCase();
        await request(app)[request_method](`/api/global-parameters${route.path}`)
          .send(route.method === 'POST' ? { paramName: 'test', value: 1 } : undefined);
      }

      // Verify all handlers were called
      expect(mockGetAllGlobalParameters).toHaveBeenCalledTimes(1);
      expect(mockGetGlobalParameter).toHaveBeenCalledTimes(1);
      expect(mockVoteOnGlobalParameter).toHaveBeenCalledTimes(1);
      expect(mockGetGlobalParameterVotingStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle middleware chain correctly', () => {
      // Verify authentication middleware is only applied to vote route
      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Router Configuration', () => {
    it('should export a valid Express router', () => {
      expect(globalParametersRouter).toBeDefined();
      expect(typeof globalParametersRouter).toBe('function');
      expect(globalParametersRouter.stack).toBeDefined();
      expect(globalParametersRouter.stack.length).toBeGreaterThan(0);
    });

    it('should have all expected routes registered', () => {
      const routes = globalParametersRouter.stack.map(layer => ({
        path: layer.route?.path,
        methods: layer.route?.methods
      })).filter(route => route.path);

      expect(routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/', methods: expect.objectContaining({ get: true }) }),
          expect.objectContaining({ path: '/:paramName', methods: expect.objectContaining({ get: true }) }),
          expect.objectContaining({ path: '/vote', methods: expect.objectContaining({ post: true }) }),
          expect.objectContaining({ path: '/:paramName/voting-status', methods: expect.objectContaining({ get: true }) })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      await request(app)
        .post('/api/global-parameters/vote')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      await request(app)
        .post('/api/global-parameters/vote')
        .send('test data')
        .expect(200); // Express will still parse it, handler will validate
    });
  });

  describe('Performance and Security', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/global-parameters/')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(mockGetAllGlobalParameters).toHaveBeenCalledTimes(5);
    });

    it('should properly validate route parameters', async () => {
      // Test with various parameter formats
      const testParams = ['simple', 'with.dots', 'with-dashes', 'with_underscores'];
      
      for (const param of testParams) {
        await request(app)
          .get(`/api/global-parameters/${param}`)
          .expect(200);
      }
      
      expect(mockGetGlobalParameter).toHaveBeenCalledTimes(testParams.length);
    });
  });
});






