// File: test/backend/api/healthApi.test.mjs

/**
 * @fileoverview Tests for health API endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHealth, getReadiness } from '../../src/backend/api/healthApi.mjs';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';

// Mock the websocketService
vi.mock('../../src/backend/websocket-service/index.mjs', () => ({
  default: {
    wss: { readyState: 1 },
    clients: { size: 5 },
    adapters: new Map()
  }
}));

describe('Health API', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('getHealth', () => {
    it('should return a 200 status with health information', async () => {
      // Act
      await getHealth(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          timestamp: expect.any(Number),
          services: expect.objectContaining({
            api: expect.any(Object),
            database: expect.any(Object)
          })
        })
      );
    });
  });
  
  describe('getReadiness', () => {
    it('should return a 200 status when system is ready', async () => {
      // Act
      await getReadiness(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          timestamp: expect.any(Number),
          checks: expect.any(Object)
        })
      );
    });
  });
});







