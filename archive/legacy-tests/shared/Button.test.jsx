/**
 * @vitest-environment jsdom
 */

/**
 * @fileoverview Tests for Button component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../../src/frontend/components/shared/Button.jsx';

describe('Button Component', () => {
  it('should render with default props', () => {
    // Arrange & Act
    const { container } = render(<Button>Click me</Button>);
    
    // Assert
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('btn');
  });
  
  it('should handle click events', () => {
    // Arrange
    const handleClick = vi.fn();
    const { container } = render(<Button onClick={handleClick}>Click me</Button>);
    
    // Act
    const button = container.querySelector('button');
    fireEvent.click(button);
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when disabled prop is true', () => {
    // Arrange & Act
    const { container } = render(<Button disabled>Click me</Button>);
    
    // Assert
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });
});












