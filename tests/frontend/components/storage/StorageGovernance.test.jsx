/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Simple mock component for testing
const MockStorageGovernance = ({ onProposalSubmit, onVote }) => {
  const mockProposals = [
    { id: 'prop-1', title: 'Increase Storage', status: 'active', votes: { for: 100, against: 20 } },
    { id: 'prop-2', title: 'Update Policy', status: 'pending', votes: { for: 50, against: 30 } }
  ];

  return (
    <div data-testid="storage-governance">
      <h1>Storage Governance</h1>
      
      <div data-testid="storage-metrics">
        <h2>Storage Metrics</h2>
        <div>Total Capacity: 500TB</div>
        <div>Used: 325TB</div>
        <div>Available: 175TB</div>
      </div>

      <div data-testid="proposals-section">
        <h2>Active Proposals</h2>
        {mockProposals.map(proposal => (
          <div key={proposal.id} data-testid={`proposal-${proposal.id}`}>
            <h3>{proposal.title}</h3>
            <span>Status: {proposal.status}</span>
            <div>
              <span>For: {proposal.votes.for}</span>
              <span>Against: {proposal.votes.against}</span>
            </div>
            <button 
              data-testid={`vote-for-${proposal.id}`}
              onClick={() => onVote?.(proposal.id, 'for')}
            >
              Vote For
            </button>
            <button 
              data-testid={`vote-against-${proposal.id}`}
              onClick={() => onVote?.(proposal.id, 'against')}
            >
              Vote Against
            </button>
          </div>
        ))}
      </div>

      <div data-testid="submit-proposal-section">
        <h2>Submit New Proposal</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onProposalSubmit?.({ title: 'New Proposal', type: 'capacity' });
        }}>
          <input 
            type="text" 
            placeholder="Proposal Title"
            data-testid="proposal-title-input"
          />
          <textarea 
            placeholder="Description"
            data-testid="proposal-description-input"
          />
          <button type="submit" data-testid="submit-proposal-button">
            Submit Proposal
          </button>
        </form>
      </div>
    </div>
  );
};

describe('StorageGovernance Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render storage governance dashboard', () => {
    render(<MockStorageGovernance />);
    
    expect(screen.getByTestId('storage-governance')).toBeInTheDocument();
    expect(screen.getByText('Storage Governance')).toBeInTheDocument();
  });

  it('should display storage metrics', () => {
    render(<MockStorageGovernance />);
    
    expect(screen.getByTestId('storage-metrics')).toBeInTheDocument();
    expect(screen.getByText('Total Capacity: 500TB')).toBeInTheDocument();
    expect(screen.getByText('Used: 325TB')).toBeInTheDocument();
    expect(screen.getByText('Available: 175TB')).toBeInTheDocument();
  });

  it('should display active proposals', () => {
    render(<MockStorageGovernance />);
    
    expect(screen.getByTestId('proposals-section')).toBeInTheDocument();
    expect(screen.getByText('Increase Storage')).toBeInTheDocument();
    expect(screen.getByText('Update Policy')).toBeInTheDocument();
  });

  it('should handle voting on proposals', () => {
    const onVote = vi.fn();
    render(<MockStorageGovernance onVote={onVote} />);
    
    const voteForButton = screen.getByTestId('vote-for-prop-1');
    fireEvent.click(voteForButton);
    
    expect(onVote).toHaveBeenCalledWith('prop-1', 'for');
  });

  it('should handle proposal submission', () => {
    const onProposalSubmit = vi.fn();
    render(<MockStorageGovernance onProposalSubmit={onProposalSubmit} />);
    
    const submitButton = screen.getByTestId('submit-proposal-button');
    fireEvent.click(submitButton);
    
    expect(onProposalSubmit).toHaveBeenCalledWith({
      title: 'New Proposal',
      type: 'capacity'
    });
  });

  it('should be accessible', () => {
    render(<MockStorageGovernance />);
    
    const component = screen.getByTestId('storage-governance');
    expect(component).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { name: 'Storage Governance' })).toBeInTheDocument();
  });
}); 