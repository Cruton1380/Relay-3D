/**
 * @vitest-environment jsdom
 */
// test/frontend/components/shared/VoteResultsDisplay.test.jsx

import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';

// Mock apiClient BEFORE any React imports
vi.mock('../../src/frontend/services/apiClient.js', () => ({
  default: {
    get: vi.fn()
  }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoteResultsDisplay from '../../src/frontend/components/shared/VoteResultsDisplay.jsx';
import apiClient from '../../src/frontend/services/apiClient.js';

// Mock data that matches the component's expected structure
const mockResultsData = {
  topic: 'Test Topic',
  totalLocalVotes: 120,
  totalForeignVotes: 45,
  topChoices: [
    { 
      id: 1,
      text: 'Option A',
      localCount: 70,
      foreignCount: 25
    },
    { 
      id: 2,
      text: 'Option B', 
      localCount: 50,
      foreignCount: 20
    }
  ]
};

describe('VoteResultsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure apiClient.get is a mock function with default resolved value
    apiClient.get = vi.fn().mockResolvedValue({
      data: mockResultsData
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', async () => {
    // Setup apiClient mock to never resolve during this test
    apiClient.get.mockImplementationOnce(() => new Promise(() => {}));
    
    // Render component
    const { getByText } = render(<VoteResultsDisplay topic="Test Topic" />);
    
    // Assert loading state is shown
    expect(getByText('Loading vote results...')).toBeInTheDocument();
  });

  it('should fetch and display vote results', async () => {
    // Setup apiClient mock - return the data directly since component uses response.data
    apiClient.get.mockResolvedValueOnce({
      data: mockResultsData
    });
    
    const { container, getByRole, getAllByText } = render(<VoteResultsDisplay topic="Test Topic" />);

    await waitFor(() => {
      return !container.textContent.includes('Loading vote results...');
    }, { timeout: 10000 });
    
    // Just verify the basic structure renders correctly
    const title = getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('Vote Results for Test Topic');
    expect(getAllByText('Local Votes')).toHaveLength(2); // One in stats, one in legend
    expect(getAllByText('Foreign Votes')).toHaveLength(1); // One in stats
    expect(getByRole('checkbox')).toBeInTheDocument();
    expect(getByRole('main')).toBeInTheDocument();
    
    // Check that vote counts are displayed
    expect(getByRole('region', { name: 'Vote statistics' })).toBeInTheDocument();
    expect(getByRole('region', { name: 'Vote display options' })).toBeInTheDocument();
    expect(getByRole('region', { name: 'Vote results breakdown' })).toBeInTheDocument();
  });

  it('should toggle between showing local and all votes', async () => {
    // Setup apiClient mock - return the data directly since component uses response.data
    apiClient.get.mockResolvedValueOnce({
      data: mockResultsData
    });
    
    // Render component
    const { getByText, queryByText, getByRole, getAllByText } = render(<VoteResultsDisplay topic="Test Topic" />);

    // Wait for data to load
    await waitFor(() => {
      return !queryByText('Loading vote results...');
    });

    // Initially should show only local votes
    expect(getByText('Showing Local Votes Only')).toBeInTheDocument();
    expect(getAllByText('Local Votes')).toBeTruthy();
    expect(queryByText('Foreign Votes')).toBeTruthy();

    // Toggle to show all votes
    const toggleSwitch = getByRole('checkbox');
    fireEvent.click(toggleSwitch);

    // Should now show both local and foreign votes
    expect(getByText('Showing All Votes')).toBeInTheDocument();
    expect(getAllByText('Local Votes')).toBeTruthy();
    expect(getAllByText('Foreign Votes')).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    // Mock console.error to prevent test output pollution
    const originalError = console.error;
    console.error = vi.fn();
    
    // Setup apiClient mock to reject
    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    // Render component
    render(<VoteResultsDisplay topic="Test Topic" />);
    
    // Check that console.error was called
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    
    // Restore original console.error
    console.error = originalError;
  });
});












