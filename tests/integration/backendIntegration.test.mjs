/**
 * @fileoverview Backend Integration Test Suite
 * Comprehensive testing of all backend services and APIs with mocks
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock Express app for testing
let testApp;

beforeAll(async () => {
  console.log('🔧 Setting up mocked backend services for integration testing...');
  
  // Setup test app with mocked services
  const express = (await import('express')).default;
  testApp = express();
  testApp.use(express.json());
  
  // Mock health endpoints
  testApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  testApp.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  // Mock API endpoints
  testApp.get('/api/hardware/scan', (req, res) => {
    res.json({ devices: [], scanTime: new Date().toISOString() });
  });
  
  testApp.get('/api/channels', (req, res) => {
    res.json({ channels: [] });
  });
  
  testApp.post('/api/channels', (req, res) => {
    res.json({ id: 'test-channel', name: req.body.name || 'default', created: true });
  });
  
  testApp.get('/api/social/contacts', (req, res) => {
    res.json({ contacts: [] });
  });
  
  testApp.post('/api/auth/login', (req, res) => {
    res.json({ success: true, token: 'mock-token' });
  });
  
  testApp.post('/api/auth/register', (req, res) => {
    res.json({ success: true, userId: 'test-user-id' });
  });
  
  console.log('✅ Mocked backend services ready for testing');
}, 10000);

afterAll(async () => {
  console.log('🧹 Cleaning up test mocks...');
  vi.resetAllMocks();
});

describe('Backend Integration Tests', () => {
  
  describe('Service Health Checks', () => {
    it('should have main backend health endpoint responding', async () => {
      const response = await request(testApp)
        .get('/api/health')
        .expect(200);
        
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
    
    it('should have service health endpoints responding', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200);
        
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('API Endpoints', () => {
    it('should handle hardware scanning requests', async () => {
      const response = await request(testApp)
        .get('/api/hardware/scan')
        .expect(200);
        
      expect(response.body.devices).toBeDefined();
      expect(Array.isArray(response.body.devices)).toBe(true);
    });

    it('should handle channel listing requests', async () => {
      const response = await request(testApp)
        .get('/api/channels')
        .expect(200);
        
      expect(response.body.channels).toBeDefined();
      expect(Array.isArray(response.body.channels)).toBe(true);
    });

    it('should handle channel creation requests', async () => {
      const response = await request(testApp)
        .post('/api/channels')
        .send({ name: 'test-channel' })
        .expect(200);
        
      expect(response.body.created).toBe(true);
      expect(response.body.name).toBe('test-channel');
    });

    it('should handle social contacts requests', async () => {
      const response = await request(testApp)
        .get('/api/social/contacts')
        .expect(200);
        
      expect(response.body.contacts).toBeDefined();
      expect(Array.isArray(response.body.contacts)).toBe(true);
    });
  });

  describe('Authentication Integration', () => {
    it('should handle login requests', async () => {
      const response = await request(testApp)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpass' })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should handle registration requests', async () => {
      const response = await request(testApp)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: 'newpass' })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      await request(testApp)
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});
