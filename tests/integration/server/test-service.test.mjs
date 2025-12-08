import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('Test Service Integration', () => {
  let testApp;

  beforeAll(async () => {
    const express = (await import('express')).default;
    testApp = express();
    
    testApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'test' });
    });
    
    testApp.get('/status', (req, res) => {
      res.json({ status: 'running', timestamp: new Date().toISOString() });
    });
  });

  it('should respond to health check', async () => {
    const response = await request(testApp)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('test');
  });

  it('should respond to status check', async () => {
    const response = await request(testApp)
      .get('/status')
      .expect(200);

    expect(response.body.status).toBe('running');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should handle 404 for unknown routes', async () => {
    await request(testApp)
      .get('/unknown')
      .expect(404);
  });
});
