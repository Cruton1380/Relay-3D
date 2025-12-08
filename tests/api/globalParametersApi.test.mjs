// File: test/backend/api/globalParametersApi.test.mjs

/**
 * @fileoverview Tests for global parameters API endpoints
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as globalParametersApi from '../../src/backend/api/globalParametersApi.mjs';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';
import configService from '../../src/backend/config-service/index.mjs';

// Module mocks
vi.mock('../../src/backend/config-service/index.mjs', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn()
  }
}));

vi.mock('../../src/backend/utils/logging/logger.mjs', () => {
  const mockLogger = {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  };
  return {
    default: mockLogger,
    logger: mockLogger
  };
});

// Mock global parameter manager
const globalParameterManager = {
  getAllParameters: vi.fn(),
  getParameter: vi.fn(),
  setParameter: vi.fn(),
  validateParameter: vi.fn(),
  voteOnParameter: vi.fn(),
  getVotingStatus: vi.fn()
};

global.globalParameterManager = globalParameterManager;

describe('Global Parameters API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllGlobalParameters', () => {
    it('should return all global parameters', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      const mockParameters = {
        voteThreshold: 10,
        userActivityTimeout: 3600,
        maxInvitesPerUser: 5
      };
      
      // Mock implementation
      globalParameterManager.getAllParameters.mockReturnValue(mockParameters);
      
      // Act
      await globalParametersApi.getAllGlobalParameters(req, res);
      
      // Assert
      expect(globalParameterManager.getAllParameters).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        parameters: mockParameters
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Mock implementation for failure
      globalParameterManager.getAllParameters.mockImplementation(() => {
        throw new Error('Failed to get parameters');
      });
      
      // Act
      await globalParametersApi.getAllGlobalParameters(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });

  describe('getGlobalParameter', () => {
    it('should return a specific global parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { key: 'voteThreshold' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      globalParameterManager.getParameter.mockReturnValue(10);
      
      // Act
      await globalParametersApi.getGlobalParameter(req, res);
      
      // Assert
      expect(globalParameterManager.getParameter).toHaveBeenCalledWith('voteThreshold');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        key: 'voteThreshold',
        value: 10
      });
    });

    it('should return 404 when parameter does not exist', async () => {
      // Arrange
      const req = createMockRequest({
        params: { key: 'nonExistentKey' }
      });
      const res = createMockResponse();
      
      // Mock implementation
      globalParameterManager.getParameter.mockReturnValue(null);
      
      // Act
      await globalParametersApi.getGlobalParameter(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('not found')
      }));
    });
  });

  describe('updateGlobalParameter', () => {
    it('should update a global parameter successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { key: 'voteThreshold' },
        body: { value: 15 }
      });
      const res = createMockResponse();
      
      // Mock implementations
      globalParameterManager.validateParameter.mockReturnValue(true);
      globalParameterManager.setParameter.mockReturnValue(true);
      
      // Act
      await globalParametersApi.updateGlobalParameter(req, res);
      
      // Assert
      expect(globalParameterManager.validateParameter).toHaveBeenCalledWith('voteThreshold', 15);
      expect(globalParameterManager.setParameter).toHaveBeenCalledWith('voteThreshold', 15);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        key: 'voteThreshold',
        value: 15
      });
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      const req = createMockRequest({
        params: { key: 'voteThreshold' },
        body: { value: -5 } // Invalid value
      });
      const res = createMockResponse();
      
      // Mock implementation for validation failure
      globalParameterManager.validateParameter.mockReturnValue(false);
      
      // Act
      await globalParametersApi.updateGlobalParameter(req, res);
      
      // Assert
      expect(globalParameterManager.validateParameter).toHaveBeenCalledWith('voteThreshold', -5);
      expect(globalParameterManager.setParameter).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });

    it('should return 404 when parameter does not exist', async () => {
      // Arrange
      const req = createMockRequest({
        params: { key: 'nonExistentKey' },
        body: { value: 15 }
      });
      const res = createMockResponse();
      
      // Mock implementation
      globalParameterManager.validateParameter.mockImplementation(() => {
        throw new Error('Parameter not found');
      });
      
      // Act
      await globalParametersApi.updateGlobalParameter(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });
});







