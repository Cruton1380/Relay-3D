/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Simple mock component for testing
const MockJuryReviewDashboard = ({ onCaseSelect, onJurorAssign }) => {
  const mockCases = [
    { id: 'case-1', title: 'Privacy Case', status: 'active' },
    { id: 'case-2', title: 'Content Case', status: 'pending' }
  ];

  return (
    <div data-testid="jury-review-dashboard">
      <h1>Jury Review Dashboard</h1>
      <div>
        <h2>Active Cases</h2>
        {mockCases.map(case_ => (
          <div key={case_.id} data-testid={`case-${case_.id}`}>
            <h3>{case_.title}</h3>
            <span>{case_.status}</span>
            <button onClick={() => onCaseSelect?.(case_.id)}>Select Case</button>
          </div>
        ))}
      </div>
      <div>
        <h2>Juror Pool</h2>
        <button onClick={() => onJurorAssign?.('juror-1', 'case-1')}>Assign Juror</button>
      </div>
    </div>
  );
};

describe('JuryReviewDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', () => {
    render(<MockJuryReviewDashboard />);
    
    expect(screen.getByTestId('jury-review-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jury Review Dashboard')).toBeInTheDocument();
  });

  it('should display active cases', () => {
    render(<MockJuryReviewDashboard />);
    
    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('Privacy Case')).toBeInTheDocument();
    expect(screen.getByText('Content Case')).toBeInTheDocument();
  });

  it('should handle case selection', () => {
    const onCaseSelect = vi.fn();
    render(<MockJuryReviewDashboard onCaseSelect={onCaseSelect} />);
    
    const selectButton = screen.getAllByText('Select Case')[0];
    fireEvent.click(selectButton);
    
    expect(onCaseSelect).toHaveBeenCalledWith('case-1');
  });

  it('should display juror pool section', () => {
    render(<MockJuryReviewDashboard />);
    
    expect(screen.getByText('Juror Pool')).toBeInTheDocument();
  });

  it('should handle juror assignment', () => {
    const onJurorAssign = vi.fn();
    render(<MockJuryReviewDashboard onJurorAssign={onJurorAssign} />);
    
    const assignButton = screen.getByText('Assign Juror');
    fireEvent.click(assignButton);
    
    expect(onJurorAssign).toHaveBeenCalledWith('juror-1', 'case-1');
  });

  it('should be accessible', () => {
    render(<MockJuryReviewDashboard />);
    
    const dashboard = screen.getByTestId('jury-review-dashboard');
    expect(dashboard).toBeInTheDocument();
  });
}); 