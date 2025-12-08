// File: test/backend/routes/blockchain.test.mjs
// Comprehensive tests for backend/routes/blockchain.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockBlockchain = {
  chain: [
    { index: 0, timestamp: 1000000, hash: 'genesis123456789' },
    { index: 1, timestamp: 1000001, hash: 'block1123456789' }
  ],
  difficulty: 4,
  getLatestBlock: vi.fn(() => ({
    index: 1,
    timestamp: 1000001,
    hash: 'block1123456789'
  }))
};

const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
};

// Setup mocks
vi.mock('../../src/backend/state/blockchain.mjs', () => ({
  blockchain: mockBlockchain
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

describe('Blockchain Routes', () => {
  let app;
  let router;
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset mock blockchain state
    mockBlockchain.chain = [
      { index: 0, timestamp: 1000000, hash: 'genesis123456789' },
      { index: 1, timestamp: 1000001, hash: 'block1123456789' }
    ];
    mockBlockchain.difficulty = 4;
    mockBlockchain.getLatestBlock.mockReturnValue({
      index: 1,
      timestamp: 1000001,
      hash: 'block1123456789'
    });
    
    // Import router after mocks are set up
    const routerModule = await import('../../src/backend/routes/blockchain.mjs');
    router = routerModule.default;
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/blockchain', router);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /status', () => {
    it('should return blockchain status successfully', async () => {
      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);      expect(response.body).toEqual({
        success: true,
        status: {
          blockCount: 2,
          latestBlock: {
            index: 1,
            timestamp: 1000001,
            hash: 'block11234...'
          },
          difficulty: 4,
          healthy: true
        }
      });

      expect(mockBlockchain.getLatestBlock).toHaveBeenCalled();
    });

    it('should handle blockchain with single genesis block', async () => {
      mockBlockchain.chain = [{ index: 0, timestamp: 1000000, hash: 'genesis123456789' }];
      mockBlockchain.getLatestBlock.mockReturnValue({
        index: 0,
        timestamp: 1000000,
        hash: 'genesis123456789'
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);

      expect(response.body.status.blockCount).toBe(1);
      expect(response.body.status.latestBlock.index).toBe(0);
    });

    it('should handle empty blockchain gracefully', async () => {
      mockBlockchain.chain = [];
      mockBlockchain.getLatestBlock.mockReturnValue({
        index: -1,
        timestamp: 0,
        hash: 'empty'
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);

      expect(response.body.status.blockCount).toBe(0);
    });

    it('should truncate long hash values', async () => {
      const longHash = 'a'.repeat(100);
      mockBlockchain.getLatestBlock.mockReturnValue({
        index: 1,
        timestamp: 1000001,
        hash: longHash
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);

      expect(response.body.status.latestBlock.hash).toBe('aaaaaaaaaa...');
      expect(response.body.status.latestBlock.hash.length).toBe(13); // 10 chars + '...'
    });

    it('should handle blockchain errors gracefully', async () => {
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        throw new Error('Blockchain corrupted');
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to retrieve blockchain status'
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error retrieving blockchain status',
        { error: 'Blockchain corrupted' }
      );
    });

    it('should handle null latest block', async () => {
      mockBlockchain.getLatestBlock.mockReturnValue(null);

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should include difficulty in response', async () => {
      mockBlockchain.difficulty = 6;

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);

      expect(response.body.status.difficulty).toBe(6);
    });

    it('should always mark blockchain as healthy in success case', async () => {
      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(200);

      expect(response.body.status.healthy).toBe(true);
    });

    it('should handle undefined chain property', async () => {
      mockBlockchain.chain = undefined;

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing hash property gracefully', async () => {
      mockBlockchain.getLatestBlock.mockReturnValue({
        index: 1,
        timestamp: 1000001
        // Missing hash property
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Route Configuration', () => {
    it('should mount correctly on express app', () => {
      const testApp = express();
      expect(() => {
        testApp.use('/test', router);
      }).not.toThrow();
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/blockchain/non-existent')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should only accept GET requests for status endpoint', async () => {
      await request(app)
        .post('/api/blockchain/status')
        .expect(404);

      await request(app)
        .put('/api/blockchain/status')
        .expect(404);

      await request(app)
        .delete('/api/blockchain/status')
        .expect(404);
    });    it('should handle malformed requests gracefully', async () => {
      // Test with an invalid header that shouldn't affect GET requests
      const response = await request(app)
        .get('/api/blockchain/status')
        .set('X-Custom-Header', 'some-value')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle blockchain service unavailable', async () => {
      mockBlockchain.chain = null;
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle async errors properly', async () => {
      mockBlockchain.getLatestBlock.mockRejectedValue(new Error('Async error'));

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle timeout scenarios', async () => {
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        return new Promise(() => {
          // Never resolves - simulates timeout
          throw new Error('Request timeout');
        });
      });

      const response = await request(app)
        .get('/api/blockchain/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});






