// File: test/backend/routes/invite.test.mjs

/**
 * @fileoverview Tests for invite routes
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock implementations for the API functions
const mockCreateInvite = vi.fn();
const mockVerifyInvite = vi.fn();
const mockBurnInvite = vi.fn();

// Mock the invite store functions
const mockGetInvite = vi.fn();
const mockResetInvitesForTest = vi.fn();

// Mock logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

// Setup mocks
vi.mock('../../src/backend/api/inviteApi.mjs', () => ({
  createInvite: mockCreateInvite,
  verifyInvite: mockVerifyInvite,
  burnInvite: mockBurnInvite
}));

vi.mock('../../src/backend/invites/inviteStore.mjs', () => ({
  getInvite: mockGetInvite,
  resetInvitesForTest: mockResetInvitesForTest
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

describe('Invite Routes', () => {
  let app;
  let inviteRouter;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockCreateInvite.mockImplementation((req, res) => {
      res.json({ 
        success: true, 
        inviteCode: 'test-invite-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    });
    
    mockVerifyInvite.mockImplementation((req, res) => {
      res.json({ 
        success: true, 
        valid: true,
        invite: {
          code: req.body.code,
          used: false,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });
    });
    
    mockBurnInvite.mockImplementation((req, res) => {
      res.json({ 
        success: true, 
        message: 'Invite marked as used'
      });
    });

    mockGetInvite.mockReturnValue({
      used: false,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });    // Import the router after mocks are set up
    const routerModule = await import('../../src/backend/routes/invite.mjs');
    inviteRouter = routerModule.default;
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/invites', inviteRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /create', () => {
    it('should call createInvite handler', async () => {
      const createData = {
        maxUses: 1,
        expiryHours: 24
      };

      const response = await request(app)
        .post('/api/invites/create')
        .send(createData)
        .expect(200);

      expect(mockCreateInvite).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        inviteCode: 'test-invite-123',
        expiresAt: expect.any(String)
      });
    });

    it('should handle create invite errors', async () => {
      mockCreateInvite.mockImplementation((req, res) => {
        res.status(400).json({ success: false, error: 'Invalid invite parameters' });
      });

      const response = await request(app)
        .post('/api/invites/create')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid invite parameters'
      });
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/invites/create')
        .expect(200); // Will still reach handler

      expect(mockCreateInvite).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /verify', () => {
    it('should call verifyInvite handler with invite code', async () => {
      const verifyData = {
        code: 'test-invite-123'
      };

      const response = await request(app)
        .post('/api/invites/verify')
        .send(verifyData)
        .expect(200);

      expect(mockVerifyInvite).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        valid: true,
        invite: expect.objectContaining({
          code: 'test-invite-123',
          used: false
        })
      });
    });

    it('should handle invalid invite codes', async () => {
      mockVerifyInvite.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          valid: false,
          error: 'Invite code not found' 
        });
      });

      const response = await request(app)
        .post('/api/invites/verify')
        .send({ code: 'invalid-code' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        valid: false,
        error: 'Invite code not found'
      });
    });

    it('should handle missing invite code', async () => {
      const response = await request(app)
        .post('/api/invites/verify')
        .send({})
        .expect(200); // Will still reach handler, handler will validate

      expect(mockVerifyInvite).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /burn', () => {
    it('should call burnInvite handler', async () => {
      const burnData = {
        code: 'test-invite-123'
      };

      const response = await request(app)
        .post('/api/invites/burn')
        .send(burnData)
        .expect(200);

      expect(mockBurnInvite).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        message: 'Invite marked as used'
      });
    });

    it('should handle burn errors', async () => {
      mockBurnInvite.mockImplementation((req, res) => {
        res.status(404).json({ success: false, error: 'Invite not found or already used' });
      });

      const response = await request(app)
        .post('/api/invites/burn')
        .send({ code: 'nonexistent-code' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Invite not found or already used'
      });
    });

    it('should handle already used invites', async () => {
      mockBurnInvite.mockImplementation((req, res) => {
        res.status(400).json({ success: false, error: 'Invite already used' });
      });

      const response = await request(app)
        .post('/api/invites/burn')
        .send({ code: 'used-invite' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invite already used'
      });
    });
  });

  describe('GET /:code', () => {
    it('should return invite details for valid code', async () => {
      const inviteCode = 'test-invite-123';
      
      const response = await request(app)
        .get(`/api/invites/${inviteCode}`)
        .expect(200);

      expect(mockGetInvite).toHaveBeenCalledWith(inviteCode);
      expect(response.body).toEqual({
        success: true,
        invite: {
          code: inviteCode,
          used: false,
          expiry: expect.any(String)
        }
      });
    });

    it('should handle invite not found', async () => {
      mockGetInvite.mockReturnValue(null);

      const response = await request(app)
        .get('/api/invites/nonexistent-code')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Invite code not found'
      });
    });

    it('should handle store errors', async () => {
      mockGetInvite.mockImplementation(() => {
        throw new Error('Store connection failed');
      });

      const response = await request(app)
        .get('/api/invites/test-code')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to get invite details'
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting invite', {
        error: 'Store connection failed'
      });
    });

    it('should handle special characters in invite code', async () => {
      const specialCode = 'invite-with-special-chars_123';
      
      await request(app)
        .get(`/api/invites/${specialCode}`)
        .expect(200);

      expect(mockGetInvite).toHaveBeenCalledWith(specialCode);
    });
  });

  describe('POST /reset (test environment only)', () => {
    beforeEach(() => {
      // Set test environment
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      // Clean up environment
      delete process.env.NODE_ENV;
    });

    it('should call resetInvitesForTest in test environment', async () => {
      const response = await request(app)
        .post('/api/invites/reset')
        .expect(200);

      expect(mockResetInvitesForTest).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        message: 'Invite store reset to initial test state'
      });
    });
  });

  describe('Router Configuration', () => {
    it('should export a valid Express router', () => {
      expect(inviteRouter).toBeDefined();
      expect(typeof inviteRouter).toBe('function');
      expect(inviteRouter.stack).toBeDefined();
    });

    it('should have all expected routes registered', () => {
      const routes = inviteRouter.stack.map(layer => ({
        path: layer.route?.path,
        methods: layer.route?.methods
      })).filter(route => route.path);

      expect(routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/create', methods: expect.objectContaining({ post: true }) }),
          expect.objectContaining({ path: '/verify', methods: expect.objectContaining({ post: true }) }),
          expect.objectContaining({ path: '/burn', methods: expect.objectContaining({ post: true }) }),
          expect.objectContaining({ path: '/:code', methods: expect.objectContaining({ get: true }) })
        ])
      );
    });
  });

  describe('Route Integration', () => {
    it('should properly mount all routes', async () => {
      // Test that all routes are accessible
      const routes = [
        { method: 'POST', path: '/create' },
        { method: 'POST', path: '/verify' },
        { method: 'POST', path: '/burn' },
        { method: 'GET', path: '/test-code' }
      ];

      for (const route of routes) {
        const request_method = route.method.toLowerCase();
        await request(app)[request_method](`/api/invites${route.path}`)
          .send(route.method === 'POST' ? { code: 'test' } : undefined);
      }

      // Verify all handlers were called
      expect(mockCreateInvite).toHaveBeenCalledTimes(1);
      expect(mockVerifyInvite).toHaveBeenCalledTimes(1);
      expect(mockBurnInvite).toHaveBeenCalledTimes(1);
      expect(mockGetInvite).toHaveBeenCalledTimes(1);
    });

    it('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/invites/non-existent-route')
        .expect(200); // This will match the /:code route
      
      // Test truly non-existent path
      await request(app)
        .put('/api/invites/update') // PUT method not defined
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      await request(app)
        .post('/api/invites/create')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      await request(app)
        .post('/api/invites/verify')
        .send('test data')
        .expect(200); // Express will still parse it, handler will validate
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/invites/test-code')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(mockGetInvite).toHaveBeenCalledTimes(5);
    });
  });
});






