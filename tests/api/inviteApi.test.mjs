// File: test/backend/api/inviteApi.test.mjs

/**
 * @fileoverview Tests for invite API endpoints
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as inviteApi from '../../src/backend/api/inviteApi.mjs';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';
import * as inviteStore from '../../src/backend/invites/inviteStore.mjs';

// Module mocks
vi.mock('../../src/backend/invites/inviteStore.mjs', () => ({
  getInvite: vi.fn(),
  burnInviteCode: vi.fn(),
  resetInvitesForTest: vi.fn(),
  validateInviteCode: vi.fn(),
  validateInvite: vi.fn(),
  generateInviteCode: vi.fn(),
  generateInvitesForNewUser: vi.fn(),
  initializeInviteStore: vi.fn(),
  isValidInviteFormat: vi.fn(),
  isInviteUsed: vi.fn(),
  createNewInvite: vi.fn(),
  listInvites: vi.fn()
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

// Mock crypto for invite code generation
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: (encoding) => encoding === 'hex' ? 'abcdef1234' : 'ABCDEF1234'
    }))
  },
  randomBytes: vi.fn(() => ({
    toString: (encoding) => encoding === 'hex' ? 'abcdef1234' : 'ABCDEF1234'
  }))
}));

describe('Invite API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
  describe('createInvite', () => {
    it('should create a new invite code successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: { createdBy: 'user123' },
        user: { id: 'user123', role: 'admin' }
      });
      const res = createMockResponse();
      
      const mockInvite = {
        code: 'ABCDEF1234',
        createdBy: 'user123',
        createdAt: expect.any(Number),
        used: false
      };
      
      // Mock generateInviteCode to return the expected code
      inviteStore.generateInviteCode.mockReturnValue('ABCDEF1234');
      
      // Mock implementation - return proper format with success and invite
      inviteStore.createNewInvite.mockResolvedValue({ 
        success: true, 
        invite: mockInvite 
      });
      
      // Act
      await inviteApi.createInvite(req, res);
      
      // Assert
      expect(inviteStore.generateInviteCode).toHaveBeenCalled();
      expect(inviteStore.createNewInvite).toHaveBeenCalledWith('ABCDEF1234', 'user123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        invite: expect.objectContaining({
          code: 'ABCDEF1234'
        })
      }));
    });

    it('should return 400 when createdBy is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {},
        user: { id: 'user123', role: 'admin' }
      });
      const res = createMockResponse();
      
      // Act
      await inviteApi.createInvite(req, res);
      
      // Assert
      expect(inviteStore.createNewInvite).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });

    it('should return 500 when invite creation fails', async () => {
      // Arrange
      const req = createMockRequest({
        body: { createdBy: 'user123' },
        user: { id: 'user123', role: 'admin' }
      });
      const res = createMockResponse();
      
      // Mock implementation for failure
      inviteStore.createNewInvite = vi.fn().mockRejectedValue(new Error('Database error'));
      
      // Act
      await inviteApi.createInvite(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });
  });

  describe('validateInviteCode', () => {
    it('should validate a valid invite code', async () => {
      // Arrange
      const req = createMockRequest({
        body: { code: 'ABCDEF1234' }
      });
      const res = createMockResponse();
      
      const mockInvite = {
        code: 'ABCDEF1234',
        createdBy: 'user123',
        createdAt: Date.now() - 3600000, // 1 hour ago
        used: false
      };
      
      // Mock implementation
      inviteStore.validateInvite = vi.fn().mockResolvedValue({ valid: true, invite: mockInvite });
      
      // Act
      await inviteApi.validateInviteCode(req, res);
      
      // Assert
      expect(inviteStore.validateInvite).toHaveBeenCalledWith('ABCDEF1234');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        valid: true,
        invite: expect.objectContaining({
          code: 'ABCDEF1234'
        })
      }));
    });

    it('should return invalid for an invalid invite code', async () => {
      // Arrange
      const req = createMockRequest({
        body: { code: 'INVALID' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      inviteStore.validateInvite = vi.fn().mockResolvedValue({ valid: false, reason: 'Invalid code' });
      
      // Act
      await inviteApi.validateInviteCode(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        valid: false,
        reason: 'Invalid code'
      }));
    });

    it('should return 400 when code is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {}
      });
      const res = createMockResponse();
      
      // Act
      await inviteApi.validateInviteCode(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });
  });

  describe('listInvites', () => {
    it('should return list of invites', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      const mockInvites = [
        {
          code: 'ABCDEF1234',
          createdBy: 'user123',
          createdAt: Date.now() - 3600000, // 1 hour ago
          used: false
        },
        {
          code: 'GHIJKL5678',
          createdBy: 'user456',
          createdAt: Date.now() - 7200000, // 2 hours ago
          used: true
        }
      ];
      
      // Mock implementation
      inviteStore.listInvites = vi.fn().mockResolvedValue(mockInvites);
      
      // Act
      await inviteApi.listInvites(req, res);
      
      // Assert
      expect(inviteStore.listInvites).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        invites: expect.arrayContaining([
          expect.objectContaining({ code: 'ABCDEF1234' }),
          expect.objectContaining({ code: 'GHIJKL5678' })
        ])
      }));
    });

    it('should return empty array when no invites exist', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Mock implementation
      inviteStore.listInvites = vi.fn().mockResolvedValue([]);
      
      // Act
      await inviteApi.listInvites(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        invites: []
      }));
    });

    it('should return 500 when listing invites fails', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Mock implementation for failure
      inviteStore.listInvites = vi.fn().mockRejectedValue(new Error('Database error'));
      
      // Act
      await inviteApi.listInvites(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });
  });

  describe('burnInvite', () => {
    it('should burn an invite successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: { 
          code: 'ABCDEF1234',
          userId: 'newUser789' 
        }
      });
      const res = createMockResponse();
      
      // Mock implementation
      inviteStore.burnInviteCode = vi.fn().mockResolvedValue(true);
      
      // Act
      await inviteApi.burnInvite(req, res);
      
      // Assert
      expect(inviteStore.burnInviteCode).toHaveBeenCalledWith('ABCDEF1234', 'newUser789');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should return 400 when required parameters are missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: { code: 'ABCDEF1234' } // Missing userId
      });
      const res = createMockResponse();
      
      // Act
      await inviteApi.burnInvite(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });

    it('should return 404 when invite does not exist', async () => {
      // Arrange
      const req = createMockRequest({
        body: { 
          code: 'NONEXISTENT',
          userId: 'newUser789' 
        }
      });
      const res = createMockResponse();
      
      // Mock implementation
      inviteStore.burnInviteCode = vi.fn().mockResolvedValue(false);
      
      // Act
      await inviteApi.burnInvite(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
    });
  });
});







