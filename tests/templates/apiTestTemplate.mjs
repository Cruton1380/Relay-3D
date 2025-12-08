// File: test/templates/apiTestTemplate.mjs

/**
 * @fileoverview Template for API endpoint tests
 * 
 * This provides a standardized template for testing API endpoints.
 * Copy this template and customize it for specific API tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../utils/testHelpers.mjs';

/**
 * Template for API tests
 * @param {Object} apiModule - The API module to test
 * @param {string} apiName - The name of the API for test descriptions
 * @param {Array<Object>} endpoints - List of endpoint configurations to test
 * @returns {Function} - The test suite function
 */
export function createApiTest(apiModule, apiName, endpoints) {
  return () => {
    describe(`${apiName} API`, () => {
      // Setup and teardown
      beforeEach(() => {
        // Common setup before each test
        vi.clearAllMocks();
      });

      afterEach(() => {
        // Common cleanup after each test
        vi.restoreAllMocks();
      });

      // Test each endpoint
      endpoints.forEach(endpoint => {
        describe(`${endpoint.name}`, () => {
          it(`should ${endpoint.successDescription}`, async () => {
            // Arrange
            const req = createMockRequest(endpoint.requestProps);
            const res = createMockResponse();
            
            // Mock dependencies if needed
            if (endpoint.mocks) {
              endpoint.mocks.forEach(mock => {
                vi.spyOn(mock.object, mock.method)
                  .mockImplementation(mock.implementation || (() => mock.returnValue));
              });
            }
            
            // Act
            await apiModule[endpoint.method](req, res);
            
            // Assert
            endpoint.assertions.forEach(assertion => {
              if (assertion.type === 'called') {
                expect(res[assertion.method]).toHaveBeenCalledWith(...assertion.args);
              } else if (assertion.type === 'calledWith') {
                expect(res[assertion.method]).toHaveBeenCalledWith(
                  expect.objectContaining(assertion.object)
                );
              } else if (assertion.type === 'custom') {
                assertion.assert(res);
              }
            });
          });

          // Add error tests if configured
          if (endpoint.errorTests) {
            endpoint.errorTests.forEach(errorTest => {
              it(`should ${errorTest.description}`, async () => {
                // Arrange
                const req = createMockRequest(errorTest.requestProps);
                const res = createMockResponse();
                
                // Mock dependencies for error condition
                if (errorTest.mocks) {
                  errorTest.mocks.forEach(mock => {
                    vi.spyOn(mock.object, mock.method)
                      .mockImplementation(mock.implementation || 
                        (() => { throw new Error(mock.error || 'Test error'); }));
                  });
                }
                
                // Act
                await apiModule[endpoint.method](req, res);
                
                // Assert
                errorTest.assertions.forEach(assertion => {
                  if (assertion.type === 'called') {
                    expect(res[assertion.method]).toHaveBeenCalledWith(...assertion.args);
                  } else if (assertion.type === 'calledWith') {
                    expect(res[assertion.method]).toHaveBeenCalledWith(
                      expect.objectContaining(assertion.object)
                    );
                  } else if (assertion.type === 'custom') {
                    assertion.assert(res);
                  }
                });
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
 * import { createApiTest } from '../templates/apiTestTemplate.mjs';
 * import userApi from '../../backend/api/userApi.mjs';
 * 
 * const userApiTest = createApiTest(
 *   userApi,
 *   'User',
 *   [
 *     {
 *       name: 'getUser',
 *       method: 'getUser',
 *       successDescription: 'return user data when valid ID is provided',
 *       requestProps: {
 *         params: { id: '123' }
 *       },
 *       mocks: [
 *         {
 *           object: userService,
 *           method: 'findById',
 *           returnValue: { id: '123', name: 'Test User' }
 *         }
 *       ],
 *       assertions: [
 *         { type: 'called', method: 'status', args: [200] },
 *         { type: 'calledWith', method: 'json', object: { success: true } }
 *       ],
 *       errorTests: [
 *         {
 *           description: 'return 404 when user not found',
 *           requestProps: {
 *             params: { id: 'invalid' }
 *           },
 *           mocks: [
 *             {
 *               object: userService,
 *               method: 'findById',
 *               implementation: () => null
 *             }
 *           ],
 *           assertions: [
 *             { type: 'called', method: 'status', args: [404] },
 *             { type: 'calledWith', method: 'json', object: { success: false } }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * );
 * 
 * describe('User API Tests', userApiTest);
 */
