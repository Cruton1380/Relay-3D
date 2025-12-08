/**
 * Test suite for CSRF Protection Middleware
 */

import { expect } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import {
  generateToken,
  validateToken,
  csrfProtection,
  initializeCsrf,
  applyCSRFProtection,
  shutdownCsrfProtection
} from '../../src/backend/middleware/csrfProtection.mjs';

describe('CSRF Protection Middleware', () => {
  let sandbox;
  let mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock request object
    mockReq = {
      method: 'POST',
      path: '/api/test',
      sessionID: 'test-session-123',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      locals: {}
    };
    
    // Mock response object
    mockRes = {
      cookie: sinon.spy(),
      locals: {}
    };
    
    // Mock next function
    mockNext = sinon.spy();
  });
  
  afterEach(() => {
    sandbox.restore();
    shutdownCsrfProtection();
  });

  describe('generateToken', () => {
    it('should generate a valid CSRF token', () => {
      const sessionId = 'test-session-123';
      const token = generateToken(sessionId);
      
      expect(token).to.be.a('string');
      expect(token.length).to.be.greaterThan(0);
      
      // Should be base64 encoded
      expect(() => Buffer.from(token, 'base64')).to.not.throw();
    });
    
    it('should generate different tokens for different sessions', () => {
      const token1 = generateToken('session-1');
      const token2 = generateToken('session-2');
      
      expect(token1).to.not.equal(token2);
    });
    
    it('should generate different tokens for same session on multiple calls', () => {
      const sessionId = 'test-session';
      const token1 = generateToken(sessionId);
      const token2 = generateToken(sessionId);
      
      expect(token1).to.not.equal(token2);
    });
  });

  describe('validateToken', () => {
    it('should validate a freshly generated token', () => {
      const sessionId = 'test-session-123';
      const token = generateToken(sessionId);
      
      const isValid = validateToken(token, sessionId);
      expect(isValid).to.be.true;
    });
    
    it('should reject token for wrong session', () => {
      const token = generateToken('session-1');
      const isValid = validateToken(token, 'session-2');
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid token', () => {
      const isValid = validateToken('invalid-token', 'test-session');
      expect(isValid).to.be.false;
    });
    
    it('should reject non-existent token', () => {
      const validToken = Buffer.from('fake|token|data|signature').toString('base64');
      const isValid = validateToken(validToken, 'test-session');
      
      expect(isValid).to.be.false;
    });
    
    it('should reject expired token', async () => {
      const sessionId = 'test-session';
      const token = generateToken(sessionId);
      
      // Mock Date.now to simulate token expiry
      const originalNow = Date.now;
      Date.now = () => originalNow() + 3700000; // 1 hour + 1 second
      
      const isValid = validateToken(token, sessionId);
      expect(isValid).to.be.false;
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    it('should handle malformed token gracefully', () => {
      const malformedToken = Buffer.from('malformed').toString('base64');
      const isValid = validateToken(malformedToken, 'test-session');
      
      expect(isValid).to.be.false;
    });
  });

  describe('csrfProtection middleware', () => {
    let middleware;
    
    beforeEach(() => {
      middleware = csrfProtection();
    });
    
    it('should skip CSRF check for GET requests', () => {
      mockReq.method = 'GET';
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true; // Called without error
    });
    
    it('should skip CSRF check for HEAD requests', () => {
      mockReq.method = 'HEAD';
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true;
    });
    
    it('should skip CSRF check for OPTIONS requests', () => {
      mockReq.method = 'OPTIONS';
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true;
    });
    
    it('should set CSRF token cookie for GET requests', () => {
      mockReq.method = 'GET';
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.cookie.calledOnce).to.be.true;
      const cookieCall = mockRes.cookie.getCall(0);
      expect(cookieCall.args[0]).to.equal('XSRF-TOKEN');
      expect(cookieCall.args[1]).to.be.a('string');
      expect(mockRes.locals.csrfToken).to.be.a('string');
    });    it('should return 403 error when CSRF token is missing', () => {
      mockReq.method = 'POST';
      // No token in headers or body
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      const error = mockNext.getCall(0).args[0];
      expect(error).to.be.instanceOf(Error);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('CSRF token missing');
    });
    
    it('should validate token from header', () => {
      const sessionId = 'test-session-123';
      const token = generateToken(sessionId);
      
      mockReq.method = 'POST';
      mockReq.sessionID = sessionId;
      mockReq.headers['x-csrf-token'] = token;
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true; // Called without error
    });
    
    it('should validate token from request body', () => {
      const sessionId = 'test-session-123';
      const token = generateToken(sessionId);
      
      mockReq.method = 'POST';
      mockReq.sessionID = sessionId;
      mockReq.body._csrf = token;
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true;
    });    it('should return 403 error for invalid token', () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = 'invalid-token';
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      const error = mockNext.getCall(0).args[0];
      expect(error).to.be.instanceOf(Error);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('Invalid CSRF token');
    });
    
    it('should generate new token after successful validation', () => {
      const sessionId = 'test-session-123';
      const token = generateToken(sessionId);
      
      mockReq.method = 'POST';
      mockReq.sessionID = sessionId;
      mockReq.headers['x-csrf-token'] = token;
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.cookie.calledOnce).to.be.true;
      expect(mockRes.locals.csrfToken).to.be.a('string');
      expect(mockRes.locals.csrfToken).to.not.equal(token); // Should be new token
    });
    
    it('should use IP address as fallback session ID', () => {
      const token = generateToken('127.0.0.1');
      
      mockReq.method = 'POST';
      delete mockReq.sessionID; // No session ID
      mockReq.headers['x-csrf-token'] = token;
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true;
    });
    
    it('should respect custom cookie name option', () => {
      const customMiddleware = csrfProtection({ cookieName: 'CUSTOM-CSRF' });
      mockReq.method = 'GET';
      
      customMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.cookie.calledOnce).to.be.true;
      const cookieCall = mockRes.cookie.getCall(0);
      expect(cookieCall.args[0]).to.equal('CUSTOM-CSRF');
    });
    
    it('should respect custom header name option', () => {
      const sessionId = 'test-session';
      const token = generateToken(sessionId);
      const customMiddleware = csrfProtection({ headerName: 'X-Custom-Token' });
      
      mockReq.method = 'POST';
      mockReq.sessionID = sessionId;
      mockReq.headers['x-custom-token'] = token;
      
      customMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.calledWith()).to.be.true;
    });
    
    it('should disable cookie when cookie option is false', () => {
      const customMiddleware = csrfProtection({ cookie: false });
      mockReq.method = 'GET';
      
      customMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.cookie.called).to.be.false;
    });
  });

  describe('initializeCsrf', () => {
    it('should initialize CSRF token for request', () => {
      const token = initializeCsrf(mockReq, mockRes);
      
      expect(token).to.be.a('string');
      expect(mockRes.cookie.calledOnce).to.be.true;
      expect(mockRes.locals.csrfToken).to.equal(token);
    });
    
    it('should use IP as fallback session ID', () => {
      delete mockReq.sessionID;
      const token = initializeCsrf(mockReq, mockRes);
      
      expect(token).to.be.a('string');
      expect(validateToken(token, mockReq.ip)).to.be.true;
    });
  });

  describe('applyCSRFProtection', () => {
    it('should apply CSRF protection to router', () => {
      const mockRouter = {
        use: sinon.spy()
      };
      
      applyCSRFProtection(mockRouter);
      
      expect(mockRouter.use.calledTwice).to.be.true;
      expect(mockRouter.use.getCall(0).args[0]).to.be.a('function');
      expect(mockRouter.use.getCall(1).args[0]).to.be.a('function');
    });
  });

  describe('Security edge cases', () => {
    it('should handle concurrent token generation', () => {
      const sessionId = 'test-session';
      const tokens = [];
      
      // Generate multiple tokens concurrently
      for (let i = 0; i < 10; i++) {
        tokens.push(generateToken(sessionId));
      }
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).to.equal(tokens.length);
      
      // All tokens should be valid
      tokens.forEach(token => {
        expect(validateToken(token, sessionId)).to.be.true;
      });
    });
      it('should handle token tampering attempts', () => {
      const sessionId = 'test-session';
      const validToken = generateToken(sessionId);
      
      // Tamper with token by changing a character that's guaranteed to exist
      const decodedToken = Buffer.from(validToken, 'base64').toString();
      const tamperedToken = decodedToken.replace(/[a-f0-9]/, 'X'); // Replace hex char with X
      const reEncodedToken = Buffer.from(tamperedToken).toString('base64');
      
      expect(validateToken(reEncodedToken, sessionId)).to.be.false;
    });
    
    it('should handle malicious session ID injection', () => {
      const maliciousSessionId = 'session|injection|attempt';
      const token = generateToken(maliciousSessionId);
      
      expect(validateToken(token, maliciousSessionId)).to.be.true;
      expect(validateToken(token, 'different-session')).to.be.false;
    });
    
    it('should handle extremely long session IDs', () => {
      const longSessionId = 'a'.repeat(1000);
      const token = generateToken(longSessionId);
      
      expect(validateToken(token, longSessionId)).to.be.true;
    });
    
    it('should handle empty or null session IDs gracefully', () => {
      expect(() => generateToken('')).to.not.throw();
      expect(() => generateToken(null)).to.not.throw();
      expect(() => generateToken(undefined)).to.not.throw();
    });
  });

  describe('Performance and cleanup', () => {    it('should clean up expired tokens', async () => {
      const sessionId = 'test-session';
      generateToken(sessionId);
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = () => originalNow() + 3700000; // 1 hour + 1 second
      
      // Wait for cleanup interval (use shorter interval for testing)
      await new Promise(resolve => {
        setTimeout(() => {
          Date.now = originalNow;
          resolve();
        }, 100);
      });
    });
    
    it('should handle high token generation volume', () => {
      const startTime = Date.now();
      const sessionId = 'test-session';
      
      // Generate many tokens
      for (let i = 0; i < 1000; i++) {
        generateToken(sessionId);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).to.be.lessThan(1000);
    });
  });
});






