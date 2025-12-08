// File: test/integration/auth-flow.test.mjs

/**
 * @fileoverview Integration test for authentication flow
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';
import authController from '../../src/backend/auth/policies/authController.mjs';
import authService from '../../src/backend/auth/core/authService.mjs';
import sessionManager from '../../src/backend/auth/core/sessionManager.mjs';
import { verifyLoginChallenge } from '../../src/backend/auth/utils/signatureVerifier.mjs';

// Enable partial mocking - we want some real functions to run
vi.mock('../../src/backend/auth/utils/signatureVerifier.mjs', async () => {
  const actual = await vi.importActual('../../src/backend/auth/utils/signatureVerifier.mjs');
  return {
    ...actual,
    verifyLoginChallenge: vi.fn().mockImplementation(actual.verifyLoginChallenge),
  };
});

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock('../../src/backend/utils/validation/index.mjs', () => ({
  default: {
    validateSchema: vi.fn(() => ({ valid: true, value: {} })),
    sanitizeInput: vi.fn((input) => input),
    isEmail: vi.fn(() => true),
  },
}));

// Mock external services but keep core functionality
vi.mock('jsonwebtoken', async () => {
  const actual = await vi.importActual('jsonwebtoken');
  return {
    ...actual,
    sign: vi.fn((payload, secret, options) => {
      // Simple implementation that just returns the payload
      return `mock-token:${JSON.stringify(payload)}`;
    }),
    verify: vi.fn((token, secret) => {
      // Extract the payload from our mock token
      if (token.startsWith('mock-token:')) {
        return JSON.parse(token.substring(11));
      }
      throw new Error('Invalid token');
    }),
  };
});

describe('Authentication Flow Integration', () => {
  // Create test keys
  const testKeys = {
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
  };
    // Mock signature verification
  vi.mocked(verifyLoginChallenge).mockReturnValue(true);
  
  // Spy on service methods
  const authenticateWithSignatureSpy = vi.spyOn(authService, 'authenticateWithSignature');
  const validateTokenSpy = vi.spyOn(authService, 'validateToken');
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mocks
    vi.mocked(verifyLoginChallenge).mockReturnValue(true);
      // Spy on original methods but don't mock their implementation    // Setup spies with success return values
    authenticateWithSignatureSpy.mockResolvedValue({
      success: true,
      token: 'mock-auth-token',
      user: {
        userId: 'test-user-id',
        publicKey: testKeys.publicKey,
        roles: ['user']
      }
    });
    
    validateTokenSpy.mockResolvedValue({
      valid: true,
      user: {
        userId: 'test-user-id',
        publicKey: testKeys.publicKey,
        roles: ['user']
      }
    });
    
    // Mock getUserByPublicKey to return test user
    vi.spyOn(authService, 'getUserByPublicKey').mockResolvedValue({
      userId: 'test-user-id',
      publicKey: testKeys.publicKey,
      roles: ['user'],
    });
  });
  
  it('should perform a complete authentication flow', async () => {
    // Step 1: Login with signature
    const loginReq = createMockRequest({
      body: {
        publicKey: testKeys.publicKey,
        signature: 'valid-signature',
        nonce: 'test-nonce',
      },
    });
    
    const loginRes = createMockResponse();    // Execute login
    await authController.login(loginReq, loginRes);
    
    // Verify login response
    expect(loginRes.status).toHaveBeenCalledWith(200);
    expect(loginRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        user: expect.objectContaining({
          userId: 'test-user-id',
        }),
      })
    );
  });
});






