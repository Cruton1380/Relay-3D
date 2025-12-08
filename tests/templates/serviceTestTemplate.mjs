// File: test/templates/serviceTestTemplate.mjs

/**
 * @fileoverview Template for Service tests
 * 
 * This provides a standardized template for testing service modules.
 * Copy this template and customize it for specific service tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Template for service tests
 * @param {Object} serviceModule - The service module to test
 * @param {string} serviceName - The name of the service for test descriptions
 * @param {Array<Object>} methods - List of method configurations to test
 * @returns {Function} - The test suite function
 */
export function createServiceTest(serviceModule, serviceName, methods) {
  return () => {
    describe(`${serviceName} Service`, () => {
      // Setup and teardown
      beforeEach(() => {
        // Common setup before each test
        vi.clearAllMocks();
      });

      afterEach(() => {
        // Common cleanup after each test
        vi.restoreAllMocks();
      });

      // Test each method
      methods.forEach(method => {
        describe(`${method.name}`, () => {
          it(`should ${method.successDescription}`, async () => {
            // Arrange
            const args = method.args || [];
            
            // Mock dependencies if needed
            if (method.mocks) {
              method.mocks.forEach(mock => {
                vi.spyOn(mock.object, mock.method)
                  .mockImplementation(mock.implementation || (() => mock.returnValue));
              });
            }
            
            // Act
            const result = await serviceModule[method.name](...args);
            
            // Assert
            if (method.expectedResult) {
              if (typeof method.expectedResult === 'function') {
                method.expectedResult(result);
              } else {
                expect(result).toEqual(method.expectedResult);
              }
            }
            
            // Check if mocks were called as expected
            if (method.verifyMocks) {
              method.verifyMocks.forEach(verification => {
                if (verification.type === 'called') {
                  expect(verification.object[verification.method]).toHaveBeenCalled();
                } else if (verification.type === 'calledWith') {
                  expect(verification.object[verification.method])
                    .toHaveBeenCalledWith(...verification.args);
                } else if (verification.type === 'calledTimes') {
                  expect(verification.object[verification.method])
                    .toHaveBeenCalledTimes(verification.times);
                }
              });
            }
          });

          // Add error tests if configured
          if (method.errorTests) {
            method.errorTests.forEach(errorTest => {
              it(`should ${errorTest.description}`, async () => {
                // Arrange
                const args = errorTest.args || [];
                
                // Mock dependencies for error condition
                if (errorTest.mocks) {
                  errorTest.mocks.forEach(mock => {
                    vi.spyOn(mock.object, mock.method)
                      .mockImplementation(mock.implementation || 
                        (() => { throw new Error(mock.error || 'Test error'); }));
                  });
                }
                
                // Act & Assert
                if (errorTest.expectedError) {
                  await expect(serviceModule[method.name](...args))
                    .rejects.toThrow(errorTest.expectedError);
                } else {
                  await expect(serviceModule[method.name](...args)).rejects.toThrow();
                }
                
                // Check if mocks were called as expected in error case
                if (errorTest.verifyMocks) {
                  errorTest.verifyMocks.forEach(verification => {
                    if (verification.type === 'called') {
                      expect(verification.object[verification.method]).toHaveBeenCalled();
                    } else if (verification.type === 'calledWith') {
                      expect(verification.object[verification.method])
                        .toHaveBeenCalledWith(...verification.args);
                    } else if (verification.type === 'calledTimes') {
                      expect(verification.object[verification.method])
                        .toHaveBeenCalledTimes(verification.times);
                    } else if (verification.type === 'notCalled') {
                      expect(verification.object[verification.method]).not.toHaveBeenCalled();
                    }
                  });
                }
              });
            });
          }
        });
      });
    });
  };
}

/**
 * Example usage:
 * 
 * import { createServiceTest } from '../templates/serviceTestTemplate.mjs';
 * import userService from '../../backend/services/userService.mjs';
 * import userRepository from '../../backend/database/userRepository.mjs';
 * 
 * const userServiceTest = createServiceTest(
 *   userService,
 *   'User',
 *   [
 *     {
 *       name: 'findById',
 *       successDescription: 'return user when valid ID is provided',
 *       args: ['123'],
 *       mocks: [
 *         {
 *           object: userRepository,
 *           method: 'findById',
 *           returnValue: { id: '123', name: 'Test User' }
 *         }
 *       ],
 *       expectedResult: { id: '123', name: 'Test User' },
 *       verifyMocks: [
 *         { 
 *           type: 'calledWith',
 *           object: userRepository,
 *           method: 'findById',
 *           args: ['123']
 *         }
 *       ],
 *       errorTests: [
 *         {
 *           description: 'throw error when user not found',
 *           args: ['invalid'],
 *           mocks: [
 *             {
 *               object: userRepository,
 *               method: 'findById',
 *               returnValue: null
 *             }
 *           ],
 *           expectedError: 'User not found'
 *         }
 *       ]
 *     }
 *   ]
 * );
 * 
 * describe('User Service Tests', userServiceTest);
 */
