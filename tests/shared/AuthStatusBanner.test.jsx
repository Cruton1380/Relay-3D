/**
 * @vitest-environment jsdom
 */

// test/frontend/components/shared/AuthStatusBanner.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AuthStatusBanner from '../../src/frontend/components/shared/AuthStatusBanner.jsx';
import { useAuth } from '../../src/frontend/hooks/useAuth.jsx';

// Mock the useAuth hook
vi.mock('../../src/frontend/auth/context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

describe('AuthStatusBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when user is not authenticated', () => {
    // Setup mock
    useAuth.mockReturnValue({
      isAuthenticated: false,
      authLevel: 'none',
      user: null
    });
    
    // Render component
    const { container } = render(<AuthStatusBanner />);
    
    // Assert that nothing was rendered
    expect(container.firstChild).toBeNull();
  });
  it('should render auth level and user when authenticated', () => {
    // Setup mock
    useAuth.mockReturnValue({
      isAuthenticated: true,
      authLevel: 'basic',
      user: 'testuser'
    });
    
    // Render component
    const { getByText } = render(<AuthStatusBanner />);
      // Assert expected content
    expect(getByText(/Basic Authentication/)).toBeInTheDocument();
    expect(getByText(/User:/)).toBeInTheDocument();
    expect(getByText('testuser')).toBeInTheDocument();
  });
  it('should render elevated authentication level', () => {
    // Setup mock
    useAuth.mockReturnValue({
      isAuthenticated: true,
      authLevel: 'elevated',
      user: 'testuser'
    });
    
    // Render component
    const { getByText } = render(<AuthStatusBanner />);
      // Assert expected content
    expect(getByText(/Elevated Authentication/)).toBeInTheDocument();
  });
  it('should render strict authentication level', () => {
    // Setup mock
    useAuth.mockReturnValue({
      isAuthenticated: true,
      authLevel: 'strict',
      user: 'testuser'
    });
    
    // Render component
    const { getByText } = render(<AuthStatusBanner />);
      // Assert expected content
    expect(getByText(/Strict Authentication/)).toBeInTheDocument();
  });
  it('should handle unknown authentication level', () => {
    // Setup mock with invalid auth level
    useAuth.mockReturnValue({
      isAuthenticated: true,
      authLevel: 'unknown-level',
      user: 'testuser'
    });
    
    // Render component
    const { getByText } = render(<AuthStatusBanner />);
      // Assert expected content
    expect(getByText(/Unknown Level/)).toBeInTheDocument();
  });
});












