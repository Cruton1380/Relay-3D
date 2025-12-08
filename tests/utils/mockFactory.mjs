// File: test/utils/mockFactory.mjs

/**
 * @fileoverview Factory for creating test mocks
 * Provides consistent mock creation for common dependencies
 */
import { vi } from 'vitest';

/**
 * Creates a logger mock that can be used in place of the real logger
 * @returns {Object} Mocked logger with common methods
 */
export function createLoggerMock() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

/**
 * Creates a repository mock with common database methods
 * @returns {Object} Mocked repository
 */
export function createRepositoryMock() {
  return {
    findById: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    transaction: vi.fn(async (fn) => {
      return await fn();
    }),
  };
}

/**
 * Creates a mock for the event bus
 * @returns {Object} Mocked event bus
 */
export function createEventBusMock() {
  const handlers = {};
  
  return {
    emit: vi.fn((event, data) => {
      if (handlers[event]) {
        handlers[event].forEach(handler => handler(data));
      }
    }),
    on: vi.fn((event, handler) => {
      if (!handlers[event]) {
        handlers[event] = [];
      }
      handlers[event].push(handler);
    }),
    off: vi.fn((event, handler) => {
      if (!handlers[event]) return;
      handlers[event] = handlers[event].filter(h => h !== handler);
    }),
    once: vi.fn((event, handler) => {
      const onceHandler = (data) => {
        handler(data);
        this.off(event, onceHandler);
      };
      this.on(event, onceHandler);
    }),
    // Helper to trigger an event in tests
    triggerEvent: (event, data) => {
      if (handlers[event]) {
        handlers[event].forEach(handler => handler(data));
      }
    },
    // Helper to clear all handlers
    reset: () => {
      Object.keys(handlers).forEach(key => {
        handlers[key] = [];
      });
    },
  };
}

/**
 * Creates a mock for auth service
 * @returns {Object} Mocked auth service
 */
export function createAuthServiceMock() {
  return {
    createToken: vi.fn(),
    verifyToken: vi.fn(),
    authenticateWithSignature: vi.fn(),
    verifyAuthentication: vi.fn(),
    elevateAuthentication: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    extractTokenFromRequest: vi.fn(),
  };
}

/**
 * Creates a mock for session manager
 * @returns {Object} Mocked session manager
 */
export function createSessionManagerMock() {
  return {
    createSession: vi.fn(),
    getSession: vi.fn(),
    isSessionValid: vi.fn(),
    destroySession: vi.fn(),
    recordActivity: vi.fn(),
    revokeUserSessions: vi.fn(),
    revokeElevatedPrivileges: vi.fn(),
  };
}

/**
 * Creates a mock for config service
 * @returns {Object} Mocked config service
 */
export function createConfigServiceMock() {
  const configValues = new Map();
  
  return {
    get: vi.fn((key, defaultValue) => {
      return configValues.has(key) ? configValues.get(key) : defaultValue;
    }),
    set: vi.fn((key, value) => {
      configValues.set(key, value);
    }),
    has: vi.fn((key) => {
      return configValues.has(key);
    }),
    delete: vi.fn((key) => {
      configValues.delete(key);
    }),
    clear: vi.fn(() => {
      configValues.clear();
    }),
    // Helper to set up config for tests
    mockConfig: (key, value) => {
      configValues.set(key, value);
    },
  };
}
