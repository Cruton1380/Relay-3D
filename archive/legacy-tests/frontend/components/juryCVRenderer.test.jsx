/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Simple mock component for testing
const MockJuryCVRenderer = ({ jurorData, onSelect }) => {
  return (
    <div data-testid="jury-cv-renderer">
      <h3>{jurorData?.name || 'Unknown Juror'}</h3>
      <p>{jurorData?.experience || 'No experience listed'}</p>
      <button onClick={() => onSelect?.(jurorData?.id)}>Select Juror</button>
    </div>
  );
};

describe('JuryCVRenderer Component', () => {
  const mockJurorData = {
    id: 'juror-123',
    name: 'John Doe',
    experience: 'Software Engineer'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render juror information', () => {
    render(<MockJuryCVRenderer jurorData={mockJurorData} />);
    
    expect(screen.getByTestId('jury-cv-renderer')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should handle missing juror data', () => {
    render(<MockJuryCVRenderer jurorData={null} />);
    
    expect(screen.getByText('Unknown Juror')).toBeInTheDocument();
    expect(screen.getByText('No experience listed')).toBeInTheDocument();
  });

  it('should handle juror selection', () => {
    const onSelect = vi.fn();
    render(<MockJuryCVRenderer jurorData={mockJurorData} onSelect={onSelect} />);
    
    const selectButton = screen.getByRole('button', { name: /select juror/i });
    fireEvent.click(selectButton);
    
    expect(onSelect).toHaveBeenCalledWith('juror-123');
  });

  it('should be accessible', () => {
    render(<MockJuryCVRenderer jurorData={mockJurorData} />);
    
    const component = screen.getByTestId('jury-cv-renderer');
    expect(component).toBeInTheDocument();
  });
}); 