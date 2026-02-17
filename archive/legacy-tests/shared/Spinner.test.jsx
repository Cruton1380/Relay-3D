/**
 * @vitest-environment jsdom
 */

// test/frontend/components/shared/Spinner.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import '@testing-library/jest-dom';
import Spinner from '../../src/frontend/components/shared/Spinner.jsx';

describe('Spinner', () => {
  it('should render with default values', () => {
    // Render component
    const { getByRole } = render(<Spinner />);
    
    // Assert that spinner is in document with default props
    const spinner = getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8 w-8'); // medium size
    expect(spinner).toHaveClass('border-blue-500'); // primary color
  });

  it('should apply small size class', () => {
    // Render component
    const { getByRole } = render(<Spinner size="small" />);
    
    // Assert that spinner has small size class
    const spinner = getByRole('status');
    expect(spinner).toHaveClass('h-4 w-4');
  });

  it('should apply large size class', () => {
    // Render component
    const { getByRole } = render(<Spinner size="large" />);
    
    // Assert that spinner has large size class
    const spinner = getByRole('status');
    expect(spinner).toHaveClass('h-12 w-12');
  });

  it('should apply different color class', () => {
    // Render component
    const { getByRole } = render(<Spinner color="secondary" />);
    
    // Assert that spinner has secondary color class
    const spinner = getByRole('status');
    expect(spinner).toHaveClass('border-gray-500');
  });

  it('should have sr-only text for accessibility', () => {
    // Render component
    const { getByText } = render(<Spinner />);
    
    // Assert that spinner has screen reader text
    const loadingText = getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveClass('sr-only');
  });
});












