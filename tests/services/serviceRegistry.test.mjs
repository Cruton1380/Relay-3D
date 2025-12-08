/**
 * @fileoverview Tests for Service Registry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger
vi.mock('../../src/backend/utils/logging/logger.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      child: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
      })),
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    },
    logger: {
      child: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
      })),
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    }
  };
});

// Import after mocks
import serviceRegistry from '../../src/backend/serviceRegistry-service/index.mjs';

describe('Service Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset registry state
    serviceRegistry.services.clear();
    serviceRegistry.dependencies.clear();
    serviceRegistry.initialized.clear();
    serviceRegistry.isInitializing = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('service registration', () => {
    it('should register a service without dependencies', () => {
      // Arrange
      const mockService = { name: 'testService' };
      
      // Act
      serviceRegistry.register('test', mockService);
      
      // Assert
      expect(serviceRegistry.has('test')).toBe(true);
      expect(serviceRegistry.get('test')).toBe(mockService);
    });

    it('should register a service with dependencies', () => {
      // Arrange
      const mockService = { name: 'testService' };
      const deps = ['dependency1', 'dependency2'];
      
      // Act
      serviceRegistry.register('test', mockService, deps);
      
      // Assert
      expect(serviceRegistry.has('test')).toBe(true);
      expect(serviceRegistry.dependencies.get('test')).toEqual(deps);
    });

    it('should throw error when registering duplicate service', () => {
      // Arrange
      const mockService = { name: 'testService' };
      serviceRegistry.register('test', mockService);
      
      // Act & Assert
      expect(() => {
        serviceRegistry.register('test', mockService);
      }).toThrow('Service test is already registered');
    });
  });

  describe('service retrieval', () => {
    it('should get registered service', () => {
      // Arrange
      const mockService = { name: 'testService' };
      serviceRegistry.register('test', mockService);
      
      // Act
      const result = serviceRegistry.get('test');
      
      // Assert
      expect(result).toBe(mockService);
    });

    it('should throw error when getting non-existent service', () => {
      // Act & Assert
      expect(() => {
        serviceRegistry.get('nonexistent');
      }).toThrow('Service nonexistent not found');
    });

    it('should check if service exists', () => {
      // Arrange
      const mockService = { name: 'testService' };
      serviceRegistry.register('test', mockService);
      
      // Act & Assert
      expect(serviceRegistry.has('test')).toBe(true);
      expect(serviceRegistry.has('nonexistent')).toBe(false);
    });
  });

  describe('service initialization', () => {
    it('should initialize services in dependency order', async () => {
      // Arrange
      const initOrder = [];
      const serviceA = {
        initialize: vi.fn().mockImplementation(() => initOrder.push('A'))
      };
      const serviceB = {
        initialize: vi.fn().mockImplementation(() => initOrder.push('B'))
      };
      const serviceC = {
        initialize: vi.fn().mockImplementation(() => initOrder.push('C'))
      };

      // C depends on B, B depends on A
      serviceRegistry.register('A', serviceA);
      serviceRegistry.register('B', serviceB, ['A']);
      serviceRegistry.register('C', serviceC, ['B']);
      
      // Act
      await serviceRegistry.initialize();
      
      // Assert
      expect(initOrder).toEqual(['A', 'B', 'C']);
      expect(serviceA.initialize).toHaveBeenCalled();
      expect(serviceB.initialize).toHaveBeenCalled();
      expect(serviceC.initialize).toHaveBeenCalled();
    });

    it('should not reinitialize already initialized services', async () => {
      // Arrange
      const service = {
        initialize: vi.fn()
      };
      serviceRegistry.register('test', service);
      
      // Act
      await serviceRegistry.initialize();
      await serviceRegistry.initialize();
      
      // Assert
      expect(service.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle services without initialize method', async () => {
      // Arrange
      const service = { name: 'testService' };
      serviceRegistry.register('test', service);
      
      // Act & Assert
      await expect(serviceRegistry.initialize()).resolves.not.toThrow();
    });

    it('should throw error for circular dependencies', () => {
      // Arrange
      const serviceA = { initialize: vi.fn() };
      const serviceB = { initialize: vi.fn() };
      
      serviceRegistry.register('A', serviceA, ['B']);
      serviceRegistry.register('B', serviceB, ['A']);
      
      // Act & Assert
      expect(() => serviceRegistry._calculateInitOrder())
        .toThrow('Circular dependency detected involving');
    });

    it('should throw error for missing dependencies', () => {
      // Arrange
      const service = { initialize: vi.fn() };
      serviceRegistry.register('test', service, ['nonexistent']);
      
      // Act & Assert
      expect(() => serviceRegistry._calculateInitOrder())
        .toThrow('Dependency nonexistent not found for service test');
    });
  });

  describe('service shutdown', () => {
    it('should shutdown services in reverse order', async () => {
      // Arrange
      const shutdownOrder = [];
      const serviceA = {
        initialize: vi.fn(),
        shutdown: vi.fn().mockImplementation(() => shutdownOrder.push('A'))
      };
      const serviceB = {
        initialize: vi.fn(),
        shutdown: vi.fn().mockImplementation(() => shutdownOrder.push('B'))
      };

      serviceRegistry.register('A', serviceA);
      serviceRegistry.register('B', serviceB, ['A']);
      await serviceRegistry.initialize();
      
      // Act
      await serviceRegistry.shutdown();
      
      // Assert
      expect(shutdownOrder).toEqual(['B', 'A']); // Reverse of init order
      expect(serviceA.shutdown).toHaveBeenCalled();
      expect(serviceB.shutdown).toHaveBeenCalled();
    });

    it('should handle services without shutdown method', async () => {
      // Arrange
      const service = { initialize: vi.fn() };
      serviceRegistry.register('test', service);
      await serviceRegistry.initialize();
      
      // Act & Assert
      await expect(serviceRegistry.shutdown()).resolves.not.toThrow();
    });

    it('should clear initialized services after shutdown', async () => {
      // Arrange
      const service = { initialize: vi.fn(), shutdown: vi.fn() };
      serviceRegistry.register('test', service);
      await serviceRegistry.initialize();
      
      // Act
      await serviceRegistry.shutdown();
      
      // Assert
      expect(serviceRegistry.initialized.size).toBe(0);
    });
  });
});






