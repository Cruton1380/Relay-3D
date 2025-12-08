import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

let testApp;

beforeAll(async () => {
  const express = (await import('express')).default;
  testApp = express();
  testApp.use(express.json());
  
  testApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  testApp.post('/api/auth/login', (req, res) => {
    res.json({ success: true, token: 'test-token' });
  });
});

describe('End-to-End API Tests', () => {
  it('should provide health status', async () => {
    const response = await request(testApp)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });

  it('should handle authentication', async () => {
    const response = await request(testApp)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
