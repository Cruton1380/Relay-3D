// File: test/mocks/index.mjs

/**
 * @fileoverview Central export point for all mocks
 */
import { 
  createLoggerMock,
  createRepositoryMock,
  createEventBusMock,
  createAuthServiceMock,
  createSessionManagerMock,
  createConfigServiceMock
} from '../utils/mockFactory.mjs';

// Export mock factory functions
export {
  createLoggerMock,
  createRepositoryMock,
  createEventBusMock,
  createAuthServiceMock,
  createSessionManagerMock,
  createConfigServiceMock
};

// Common mock instances
export const mockLogger = createLoggerMock();
export const mockRepository = createRepositoryMock();
export const mockEventBus = createEventBusMock();
export const mockAuthService = createAuthServiceMock();
export const mockSessionManager = createSessionManagerMock();
export const mockConfigService = createConfigServiceMock();

// Mock module definitions
export const mockModules = {
  '../../utils/logging/logger.mjs': {
    default: mockLogger,
    child: vi.fn(() => mockLogger)
  },
  '../../event-bus/index.mjs': {
    eventBus: mockEventBus
  },
  '../../auth/core/authService.mjs': {
    default: mockAuthService
  },
  '../../auth/core/sessionManager.mjs': {
    default: mockSessionManager
  },
  '../../config-service/index.mjs': {
    default: mockConfigService
  }
};
