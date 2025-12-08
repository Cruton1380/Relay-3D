// File: test/backend/routes/location.test.mjs
// Comprehensive tests for backend/routes/location.mjs

/**
 * @fileoverview Tests for location route endpoints
 * Tests all 12 location route endpoints with comprehensive error handling, validation, and integration scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockLocationApi = {
  updateUserLocation: vi.fn(),
  getAllRegions: vi.fn(),
  getUserLocation: vi.fn(),
  checkVotingEligibility: vi.fn(),
  getRegionParameters: vi.fn(),
  submitRegionBoundary: vi.fn(),
  getRegionBoundary: vi.fn(),
  getCurrentUserRegion: vi.fn(),
  submitGlobalBoundaryPreference: vi.fn(),
  getGlobalBoundaryPreference: vi.fn(),
  getConsensusBoundary: vi.fn()
};

// Create a spy for middleware execution tracking
const mockAuthMiddleware = vi.fn((req, res, next) => {
  // Simulate authentication by adding user to request
  req.user = { 
    id: 'test-user',
    userId: 'test-user',
    publicKey: 'test-public-key',
    role: 'user'
  };
  next();
});

const mockAuthenticate = vi.fn(() => {
  return mockAuthMiddleware;
});

const mockLogger = {
  child: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
};

// Mock modules BEFORE any imports
vi.mock('../../src/backend/api/locationApi.mjs', () => mockLocationApi);

vi.mock('../../src/backend/auth/middleware/index.mjs', () => ({
  authenticate: mockAuthenticate
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

// Mock error handling middleware
vi.mock('../../src/backend/middleware/errorHandler.mjs', () => ({
  asyncHandler: vi.fn((fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  })
}));

describe('Location Routes', () => {
  let app;
  let locationRouter;
    beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset modules to ensure fresh imports with mocks
    await vi.resetModules();
    
    // Create fresh app instance
    app = express();
    
    // Reset mock implementations
    Object.keys(mockLocationApi).forEach(key => {
      mockLocationApi[key].mockImplementation((req, res) => {
        res.status(200).json({ success: true, endpoint: key });
      });
    });
      // Reset the authenticate mock
    mockAuthenticate.mockImplementation(() => {
      return mockAuthMiddleware;
    });
    
    // Clear middleware spy calls
    mockAuthMiddleware.mockClear();
    
    // Setup Express app with middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Import and mount the router after modules are reset
    const { default: router } = await import('../../src/backend/routes/location.mjs');
    app.use('/api/location', router);
    locationRouter = router;
    
    // Add error handling
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ 
        success: false, 
        error: err.message || 'Internal server error' 
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Router Structure', () => {
    it('should export a valid Express router', () => {
      expect(locationRouter).toBeDefined();
      expect(typeof locationRouter).toBe('function');
      expect(locationRouter.stack).toBeDefined();
    });

    it('should have all expected routes registered', () => {
      const routes = locationRouter.stack.map(layer => ({
        path: layer.route?.path,
        methods: layer.route?.methods
      })).filter(route => route.path);

      const expectedPaths = [
        '/regions',
        '/user/:userId', 
        '/update',
        '/voting-eligibility',
        '/region/:regionId/parameters',
        '/region/current',
        '/region/:regionId/boundary',
        '/global-boundary',
        '/global-boundary/:userId',
        '/consensus-boundary/:regionId'
      ];

      expectedPaths.forEach(path => {
        expect(routes.some(route => route.path === path)).toBe(true);
      });
    });

    it('should have correct HTTP methods for each route', () => {
      const routes = locationRouter.stack.map(layer => ({
        path: layer.route?.path,
        methods: Object.keys(layer.route?.methods || {})
      })).filter(route => route.path);

      // Check specific method requirements
      const getRoutes = routes.filter(r => r.methods.includes('get'));
      const postRoutes = routes.filter(r => r.methods.includes('post'));

      expect(getRoutes.length).toBeGreaterThan(0);
      expect(postRoutes.length).toBeGreaterThan(0);
    });
  });

  describe('GET /regions - Get All Regions', () => {
    it('should get all regions without authentication', async () => {
      mockLocationApi.getAllRegions.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          regions: [
            { id: 'region1', name: 'Test Region 1' },
            { id: 'region2', name: 'Test Region 2' }
          ]
        });
      });

      const response = await request(app)
        .get('/api/location/regions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.regions).toHaveLength(2);
      expect(mockLocationApi.getAllRegions).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when getting regions', async () => {
      mockLocationApi.getAllRegions.mockImplementation((req, res) => {
        res.status(500).json({ success: false, error: 'Database error' });
      });

      const response = await request(app)
        .get('/api/location/regions')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });

    it('should return empty array when no regions exist', async () => {
      mockLocationApi.getAllRegions.mockImplementation((req, res) => {
        res.json({ success: true, regions: [] });
      });

      const response = await request(app)
        .get('/api/location/regions')
        .expect(200);

      expect(response.body.regions).toEqual([]);
    });
  });

  describe('GET /user/:userId - Get User Location', () => {
    it('should get user location with authentication', async () => {
      mockLocationApi.getUserLocation.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          location: {
            userId: 'test-user',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            lastUpdated: Date.now()
          }
        });
      });

      const response = await request(app)
        .get('/api/location/user/test-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.userId).toBe('test-user');
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.getUserLocation).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when user location not found', async () => {
      mockLocationApi.getUserLocation.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'User location not found' 
        });
      });

      const response = await request(app)
        .get('/api/location/user/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User location not found');
    });

    it('should handle missing userId parameter', async () => {
      const response = await request(app)
        .get('/api/location/user/')
        .expect(404); // Express router will return 404 for missing parameter
    });

    it('should handle authorization errors', async () => {
      mockLocationApi.getUserLocation.mockImplementation((req, res) => {
        res.status(403).json({ 
          success: false, 
          error: 'Unauthorized to access this user\'s location' 
        });
      });

      const response = await request(app)
        .get('/api/location/user/other-user')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('POST /update - Update User Location', () => {
    it('should update user location with valid data', async () => {
      mockLocationApi.updateUserLocation.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          location: {
            userId: 'test-user',
            coordinates: req.body.coordinates,
            lastUpdated: Date.now()
          }
        });
      });

      const locationData = {
        coordinates: { lat: 37.7749, lng: -122.4194 },
        voteDurationPreference: 30
      };

      const response = await request(app)
        .post('/api/location/update')
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.coordinates).toEqual(locationData.coordinates);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.updateUserLocation).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid coordinates', async () => {
      mockLocationApi.updateUserLocation.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid coordinates' 
        });
      });

      const invalidData = {
        coordinates: { lat: 100, lng: -200 } // Invalid range
      };

      const response = await request(app)
        .post('/api/location/update')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });    it('should require authentication', async () => {
      // Need to set up authentication failure before importing router
      await vi.resetModules();
      
      // Mock authentication failure
      mockAuthenticate.mockImplementation(() => (req, res) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      // Re-import the router with failing auth mock
      const { default: router } = await import('../../src/backend/routes/location.mjs');
      const authFailApp = express();
      authFailApp.use(express.json());
      authFailApp.use('/api/location', router);

      const response = await request(authFailApp)
        .post('/api/location/update')
        .send({ coordinates: { lat: 37.7749, lng: -122.4194 } })
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should handle missing request body', async () => {
      mockLocationApi.updateUserLocation.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'Missing coordinates' 
        });
      });

      const response = await request(app)
        .post('/api/location/update')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle server errors during update', async () => {
      mockLocationApi.updateUserLocation.mockImplementation((req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to update location' 
        });
      });

      const response = await request(app)
        .post('/api/location/update')
        .send({ coordinates: { lat: 37.7749, lng: -122.4194 } })
        .expect(500);

      expect(response.body.error).toBe('Failed to update location');
    });
  });

  describe('GET /voting-eligibility - Check Voting Eligibility', () => {
    it('should check voting eligibility with valid parameters', async () => {
      mockLocationApi.checkVotingEligibility.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          canVote: true,
          region: { id: 'region1', name: 'Test Region' },
          userRegion: 'region1'
        });
      });

      const response = await request(app)
        .get('/api/location/voting-eligibility')
        .query({ regionId: 'region1', topicId: 'topic1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.canVote).toBe(true);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.checkVotingEligibility).toHaveBeenCalledTimes(1);
    });

    it('should handle user not eligible to vote', async () => {
      mockLocationApi.checkVotingEligibility.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          canVote: false,
          region: { id: 'region2', name: 'Other Region' },
          userRegion: 'region1'
        });
      });

      const response = await request(app)
        .get('/api/location/voting-eligibility')
        .query({ regionId: 'region2' })
        .expect(200);

      expect(response.body.canVote).toBe(false);
    });

    it('should require regionId parameter', async () => {
      mockLocationApi.checkVotingEligibility.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'regionId is required' 
        });
      });

      const response = await request(app)
        .get('/api/location/voting-eligibility')
        .expect(400);

      expect(response.body.error).toContain('regionId');
    });

    it('should handle missing user location', async () => {
      mockLocationApi.checkVotingEligibility.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'User location not found' 
        });
      });

      const response = await request(app)
        .get('/api/location/voting-eligibility')
        .query({ regionId: 'region1' })
        .expect(404);

      expect(response.body.error).toBe('User location not found');
    });
  });

  describe('GET /region/:regionId/parameters - Get Region Parameters', () => {
    it('should get region parameters', async () => {
      mockLocationApi.getRegionParameters.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          parameters: {
            regionId: 'region1',
            votingDuration: 30,
            quorumThreshold: 0.5
          }
        });
      });

      const response = await request(app)
        .get('/api/location/region/region1/parameters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parameters.regionId).toBe('region1');
      expect(mockLocationApi.getRegionParameters).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent region', async () => {
      mockLocationApi.getRegionParameters.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'Region not found' 
        });
      });

      const response = await request(app)
        .get('/api/location/region/nonexistent/parameters')
        .expect(404);

      expect(response.body.error).toBe('Region not found');
    });
  });

  describe('GET /region/current - Get Current User Region', () => {
    it('should get current user region with authentication', async () => {
      mockLocationApi.getCurrentUserRegion.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          userLocation: {
            userId: 'test-user',
            regionId: 'region1'
          },
          region: { id: 'region1', name: 'Test Region' }
        });
      });

      const response = await request(app)
        .get('/api/location/region/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.region.id).toBe('region1');
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.getCurrentUserRegion).toHaveBeenCalledTimes(1);
    });

    it('should handle user with no region', async () => {
      mockLocationApi.getCurrentUserRegion.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'User location not found' 
        });
      });

      const response = await request(app)
        .get('/api/location/region/current')
        .expect(404);

      expect(response.body.error).toBe('User location not found');
    });
  });

  describe('POST /region/:regionId/boundary - Submit Region Boundary', () => {
    it('should submit region boundary with authentication', async () => {
      mockLocationApi.submitRegionBoundary.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          message: 'Boundary submitted successfully',
          regionId: 'region1'
        });
      });

      const boundaryData = {
        boundary: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }
      };

      const response = await request(app)
        .post('/api/location/region/region1/boundary')
        .send(boundaryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.regionId).toBe('region1');
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.submitRegionBoundary).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid boundary data', async () => {
      mockLocationApi.submitRegionBoundary.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid boundary format' 
        });
      });

      const response = await request(app)
        .post('/api/location/region/region1/boundary')
        .send({ boundary: 'invalid' })
        .expect(400);

      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('GET /region/:regionId/boundary - Get Region Boundary', () => {
    it('should get region boundary without authentication', async () => {
      mockLocationApi.getRegionBoundary.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          regionId: 'region1',
          boundary: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        });
      });

      const response = await request(app)
        .get('/api/location/region/region1/boundary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.regionId).toBe('region1');
      expect(response.body.boundary).toBeDefined();
      expect(mockLocationApi.getRegionBoundary).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent region boundary', async () => {
      mockLocationApi.getRegionBoundary.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'Region not found' 
        });
      });

      const response = await request(app)
        .get('/api/location/region/nonexistent/boundary')
        .expect(404);

      expect(response.body.error).toBe('Region not found');
    });
  });

  describe('POST /global-boundary - Submit Global Boundary Preference', () => {
    it('should submit global boundary preference with authentication', async () => {
      mockLocationApi.submitGlobalBoundaryPreference.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          message: 'Global boundary preference stored and applied'
        });
      });

      const boundaryData = {
        boundary: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
          }
        }
      };

      const response = await request(app)
        .post('/api/location/global-boundary')
        .send(boundaryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.submitGlobalBoundaryPreference).toHaveBeenCalledTimes(1);
    });    it('should require authentication for global boundary', async () => {
      // Need to set up authentication failure before importing router
      await vi.resetModules();
      
      // Mock authentication failure
      mockAuthenticate.mockImplementation(() => (req, res) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      // Re-import the router with failing auth mock
      const { default: router } = await import('../../src/backend/routes/location.mjs');
      const authFailApp = express();
      authFailApp.use(express.json());
      authFailApp.use('/api/location', router);

      const response = await request(authFailApp)
        .post('/api/location/global-boundary')
        .send({ boundary: {} })
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('GET /global-boundary - Get Global Boundary Preference', () => {
    it('should get current user global boundary preference', async () => {
      mockLocationApi.getGlobalBoundaryPreference.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          preference: {
            boundary: {
              type: 'Polygon',
              coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
            },
            lastUpdated: Date.now()
          }
        });
      });

      const response = await request(app)
        .get('/api/location/global-boundary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.preference.boundary).toBeDefined();
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.getGlobalBoundaryPreference).toHaveBeenCalledTimes(1);
    });

    it('should handle no preference found', async () => {
      mockLocationApi.getGlobalBoundaryPreference.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'No global boundary preference found' 
        });
      });

      const response = await request(app)
        .get('/api/location/global-boundary')
        .expect(404);

      expect(response.body.error).toContain('No global boundary preference');
    });
  });

  describe('GET /global-boundary/:userId - Get User Global Boundary Preference', () => {
    it('should get specific user global boundary preference', async () => {
      mockLocationApi.getGlobalBoundaryPreference.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          userId: 'other-user',
          preference: {
            boundary: { type: 'Polygon', coordinates: [] },
            lastUpdated: Date.now()
          }
        });
      });

      const response = await request(app)
        .get('/api/location/global-boundary/other-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('other-user');
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockLocationApi.getGlobalBoundaryPreference).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /consensus-boundary/:regionId - Get Consensus Boundary', () => {
    it('should get consensus boundary for region', async () => {
      mockLocationApi.getConsensusBoundary.mockImplementation((req, res) => {
        res.json({ 
          success: true, 
          regionId: 'region1',
          consensusBoundary: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          },
          consensus: 0.85
        });
      });

      const response = await request(app)
        .get('/api/location/consensus-boundary/region1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.regionId).toBe('region1');
      expect(response.body.consensusBoundary).toBeDefined();
      expect(response.body.consensus).toBe(0.85);
      expect(mockLocationApi.getConsensusBoundary).toHaveBeenCalledTimes(1);
    });

    it('should handle region with no consensus', async () => {
      mockLocationApi.getConsensusBoundary.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'No consensus boundary found for region' 
        });
      });

      const response = await request(app)
        .get('/api/location/consensus-boundary/region1')
        .expect(404);

      expect(response.body.error).toContain('No consensus boundary');
    });
  });
  describe('Authentication Middleware Integration', () => {
    it('should apply authentication to protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/user/test-user' },
        { method: 'post', path: '/update' },
        { method: 'get', path: '/voting-eligibility' },
        { method: 'get', path: '/region/current' },
        { method: 'post', path: '/region/region1/boundary' },
        { method: 'post', path: '/global-boundary' },
        { method: 'get', path: '/global-boundary' },
        { method: 'get', path: '/global-boundary/test-user' }
      ];

      for (const route of protectedRoutes) {
        mockAuthMiddleware.mockClear();
        
        const req = request(app)[route.method](`/api/location${route.path}`);
        if (route.method === 'post') {
          req.send({ test: 'data' });
        }
        
        await req;
        expect(mockAuthMiddleware).toHaveBeenCalled();
      }
    });

    it('should allow public access to unprotected routes', async () => {
      const publicRoutes = [
        { method: 'get', path: '/regions' },
        { method: 'get', path: '/region/region1/parameters' },
        { method: 'get', path: '/region/region1/boundary' },
        { method: 'get', path: '/consensus-boundary/region1' }
      ];

      // Mock authenticate to not be called for these routes
      const originalAuthenticate = mockAuthenticate;
      mockAuthenticate.mockImplementation(() => {
        throw new Error('Authentication should not be called for public routes');
      });

      for (const route of publicRoutes) {
        await request(app)[route.method](`/api/location${route.path}`)
          .expect(200);
      }

      // Restore original mock
      mockAuthenticate.mockImplementation(originalAuthenticate);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/location/update')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing route parameters', async () => {
      await request(app)
        .get('/api/location/region//parameters')
        .expect(404);
    });    it('should handle server errors gracefully', async () => {
      mockLocationApi.getAllRegions.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/location/regions')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database connection failed');
    });

    it('should handle async errors in route handlers', async () => {
      mockLocationApi.updateUserLocation.mockImplementation(async (req, res) => {
        throw new Error('Async operation failed');
      });

      const response = await request(app)
        .post('/api/location/update')
        .send({ coordinates: { lat: 0, lng: 0 } })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Request/Response Data Flow', () => {
    it('should pass request parameters correctly to API functions', async () => {
      let capturedReq;
      mockLocationApi.getUserLocation.mockImplementation((req, res) => {
        capturedReq = req;
        res.json({ success: true });
      });

      await request(app)
        .get('/api/location/user/test-user-123')
        .expect(200);

      expect(capturedReq.params.userId).toBe('test-user-123');
    });

    it('should pass request body correctly to API functions', async () => {
      let capturedReq;
      mockLocationApi.updateUserLocation.mockImplementation((req, res) => {
        capturedReq = req;
        res.json({ success: true });
      });

      const testData = { coordinates: { lat: 45.0, lng: -90.0 } };
      await request(app)
        .post('/api/location/update')
        .send(testData)
        .expect(200);

      expect(capturedReq.body.coordinates).toEqual(testData.coordinates);
    });

    it('should pass query parameters correctly to API functions', async () => {
      let capturedReq;
      mockLocationApi.checkVotingEligibility.mockImplementation((req, res) => {
        capturedReq = req;
        res.json({ success: true });
      });

      await request(app)
        .get('/api/location/voting-eligibility')
        .query({ regionId: 'test-region', topicId: 'test-topic' })
        .expect(200);

      expect(capturedReq.query.regionId).toBe('test-region');
      expect(capturedReq.query.topicId).toBe('test-topic');
    });

    it('should preserve user context from authentication', async () => {
      let capturedReq;
      mockLocationApi.getCurrentUserRegion.mockImplementation((req, res) => {
        capturedReq = req;
        res.json({ success: true });
      });

      await request(app)
        .get('/api/location/region/current')
        .expect(200);

      expect(capturedReq.user).toBeDefined();
      expect(capturedReq.user.id).toBe('test-user');
    });
  });

  describe('Route Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      mockLocationApi.getAllRegions.mockImplementation((req, res) => {
        setTimeout(() => res.json({ success: true }), 10);
      });

      const requests = Array(5).fill().map(() => 
        request(app).get('/api/location/regions')
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(mockLocationApi.getAllRegions).toHaveBeenCalledTimes(5);
    });

    it('should handle large request bodies efficiently', async () => {
      mockLocationApi.submitRegionBoundary.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const largeBoundary = {
        boundary: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [Array(1000).fill([0, 0])] // Large coordinate array
          }
        }
      };

      const response = await request(app)
        .post('/api/location/region/region1/boundary')
        .send(largeBoundary)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Integration with Express Router', () => {
    it('should properly mount on Express application', () => {
      const testApp = express();
      expect(() => {
        testApp.use('/test', locationRouter);
      }).not.toThrow();
    });

    it('should handle middleware chaining correctly', async () => {
      const testApp = express();
      testApp.use('/api/location', (req, res, next) => {
        req.testMiddleware = true;
        next();
      });
      testApp.use('/api/location', locationRouter);

      let capturedReq;
      mockLocationApi.getAllRegions.mockImplementation((req, res) => {
        capturedReq = req;
        res.json({ success: true });
      });

      await request(testApp)
        .get('/api/location/regions')
        .expect(200);

      expect(capturedReq.testMiddleware).toBe(true);
    });

    it('should handle route precedence correctly', async () => {
      // Test that more specific routes are matched before general ones
      await request(app)
        .get('/api/location/region/current')
        .expect(200);

      expect(mockLocationApi.getCurrentUserRegion).toHaveBeenCalled();
      expect(mockLocationApi.getRegionParameters).not.toHaveBeenCalled();
    });
  });
});






