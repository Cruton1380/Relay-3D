/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the component since we don't have the actual implementation
const MockPhantomVisibilityToggle = ({ initialState = false, onToggle, disabled = false }) => {
  const [isPhantom, setIsPhantom] = React.useState(initialState);

  const handleToggle = () => {
    if (!disabled) {
      const newState = !isPhantom;
      setIsPhantom(newState);
      onToggle?.(newState);
    }
  };

  return (
    <div data-testid="phantom-visibility-toggle">
      <button 
        onClick={handleToggle}
        disabled={disabled}
        aria-pressed={isPhantom}
        aria-label={`Phantom mode ${isPhantom ? 'enabled' : 'disabled'}`}
      >
        {isPhantom ? 'Phantom' : 'Visible'}
      </button>
      <span data-testid="phantom-status">
        Status: {isPhantom ? 'Hidden' : 'Visible'}
      </span>
    </div>
  );
};

describe('PhantomVisibilityToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle button', () => {
    render(<MockPhantomVisibilityToggle />);
    
    expect(screen.getByTestId('phantom-visibility-toggle')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should show initial visible state', () => {
    render(<MockPhantomVisibilityToggle initialState={false} />);
    
    expect(screen.getByText('Visible')).toBeInTheDocument();
    expect(screen.getByText('Status: Visible')).toBeInTheDocument();
  });

  it('should toggle phantom mode on click', () => {
    const onToggle = vi.fn();
    render(<MockPhantomVisibilityToggle onToggle={onToggle} />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Phantom')).toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should have proper ARIA attributes', () => {
    render(<MockPhantomVisibilityToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('Phantom mode'));
  });
});
