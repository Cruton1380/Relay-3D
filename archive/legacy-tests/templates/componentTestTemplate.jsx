// File: test/templates/componentTestTemplate.jsx

/**
 * @fileoverview Template for React component tests
 * 
 * This provides a standardized template for testing React components.
 * Copy this template and customize it for specific component tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Template for component tests
 * @param {React.Component} Component - The component to test
 * @param {string} componentName - The name of the component for test descriptions
 * @param {Array<Object>} testCases - List of test cases for the component
 * @param {Function} [wrapper] - Optional wrapper component (e.g., for Context providers)
 * @returns {Function} - The test suite function
 */
export function createComponentTest(Component, componentName, testCases, wrapper) {
  return () => {
    describe(`${componentName} Component`, () => {
      // Setup and teardown
      beforeEach(() => {
        vi.clearAllMocks();
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      // Helper to render with wrapper if provided
      const renderComponent = (props = {}) => {
        if (wrapper) {
          const Wrapper = wrapper;
          return render(
            <Wrapper>
              <Component {...props} />
            </Wrapper>
          );
        }
        return render(<Component {...props} />);
      };

      // Run each test case
      testCases.forEach(testCase => {
        it(`should ${testCase.description}`, async () => {
          // Mock any dependencies
          if (testCase.mocks) {
            testCase.mocks.forEach(mock => {
              if (mock.module) {
                vi.spyOn(mock.module, mock.method)
                  .mockImplementation(mock.implementation || (() => mock.returnValue));
              } else {
                vi.mock(mock.path, () => ({
                  __esModule: true,
                  default: mock.implementation || (() => mock.returnValue),
                  [mock.exportName]: mock.implementation || (() => mock.returnValue)
                }));
              }
            });
          }

          // Render the component
          renderComponent(testCase.props);

          // Perform any interactions
          if (testCase.interactions) {
            for (const interaction of testCase.interactions) {
              if (interaction.type === 'click') {
                const element = screen.getByText(interaction.target) || 
                               screen.getByRole(interaction.target) || 
                               screen.getByTestId(interaction.target);
                await userEvent.click(element);
              } else if (interaction.type === 'type') {
                const element = screen.getByLabelText(interaction.target) || 
                               screen.getByPlaceholderText(interaction.target) ||
                               screen.getByTestId(interaction.target);
                await userEvent.type(element, interaction.value);
              } else if (interaction.type === 'select') {
                const element = screen.getByRole('combobox', { name: interaction.target }) ||
                               screen.getByTestId(interaction.target);
                await userEvent.selectOptions(element, interaction.value);
              }
              
              // Wait if specified
              if (interaction.wait) {
                await waitFor(() => {
                  // Custom wait condition
                  if (typeof interaction.wait === 'function') {
                    interaction.wait();
                  }
                });
              }
            }
          }

          // Run assertions
          if (testCase.assertions) {
            for (const assertion of testCase.assertions) {
              if (assertion.type === 'text') {
                expect(screen.getByText(assertion.value)).toBeInTheDocument();
              } else if (assertion.type === 'attribute') {
                const element = screen.getByTestId(assertion.element) || 
                               screen.getByText(assertion.element);
                expect(element).toHaveAttribute(assertion.attribute, assertion.value);
              } else if (assertion.type === 'notPresent') {
                expect(screen.queryByText(assertion.value)).not.toBeInTheDocument();
              } else if (assertion.type === 'called') {
                expect(assertion.mock.module[assertion.mock.method]).toHaveBeenCalled();
              } else if (assertion.type === 'calledWith') {
                expect(assertion.mock.module[assertion.mock.method])
                  .toHaveBeenCalledWith(...assertion.args);
              } else if (assertion.type === 'custom') {
                assertion.assert();
              }
            }
          }
        });
      });
    });
  };
}

/**
 * Example usage:
 * 
 * import { createComponentTest } from '../templates/componentTestTemplate.jsx';
 * import Button from '../../frontend/components/Button.jsx';
 * 
 * const buttonTest = createComponentTest(
 *   Button,
 *   'Button',
 *   [
 *     {
 *       description: 'render with default props',
 *       props: { children: 'Click me' },
 *       assertions: [
 *         { type: 'text', value: 'Click me' },
 *         { type: 'attribute', element: 'Click me', attribute: 'class', value: 'btn' }
 *       ]
 *     },
 *     {
 *       description: 'handle click events',
 *       props: { 
 *         children: 'Click me',
 *         onClick: vi.fn()
 *       },
 *       interactions: [
 *         { type: 'click', target: 'Click me' }
 *       ],
 *       assertions: [
 *         { 
 *           type: 'called', 
 *           mock: { 
 *             module: { onClick: vi.fn() }, 
 *             method: 'onClick' 
 *           } 
 *         }
 *       ]
 *     }
 *   ]
 * );
 * 
 * describe('Button Component Tests', buttonTest);
 */
