/**
 * @vitest-environment jsdom
 */

// test/frontend/components/shared/Modal.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import Modal from '../../src/frontend/components/shared/Modal.jsx';

describe('Modal', () => {
  it('should not render when closed', () => {
    // Render component with isOpen set to false
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    // Assert that nothing was rendered
    expect(container.firstChild).toBeNull();
  });
  it('should render when open', () => {
    // Render component with isOpen set to true
    const { getByTestId, getByText } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    // Assert that modal was rendered
    expect(getByTestId('modal-backdrop')).toBeInTheDocument();
    expect(getByTestId('modal-content')).toBeInTheDocument();
    expect(getByText('Test Modal')).toBeInTheDocument();
    expect(getByText('Modal content')).toBeInTheDocument();
  });
  it('should call onClose when backdrop is clicked', () => {
    // Setup mock function
    const onCloseMock = vi.fn();
    
    // Render component
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    // Click backdrop
    fireEvent.click(getByTestId('modal-backdrop'));
    
    // Assert that onClose was called
    expect(onCloseMock).toHaveBeenCalled();
  });
    it('should call onClose when close button is clicked', () => {
    // Setup mock function
    const onCloseMock = vi.fn();
    
    // Render component
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    // Click close button
    fireEvent.click(getByTestId('modal-close-button'));
    
    // Assert that onClose was called
    expect(onCloseMock).toHaveBeenCalled();
  });
  it('should not show close button when showCloseButton is false', () => {
    // Render component with showCloseButton set to false
    const { queryByTestId } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    );
    
    // Assert that close button is not rendered
    expect(queryByTestId('modal-close-button')).not.toBeInTheDocument();
  });
  it('should apply different size classes', () => {
    const { rerender, getByTestId } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="small">
        <p>Modal content</p>
      </Modal>
    );
    
    // Assert that small size class is applied
    expect(getByTestId('modal-content')).toHaveClass('max-w-md');
    
    // Rerender with large size
    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="large">
        <p>Modal content</p>
      </Modal>
    );
    
    // Assert that large size class is applied
    expect(getByTestId('modal-content')).toHaveClass('max-w-2xl');
  });
  it('should call onClose on escape key press', () => {
    // Setup mock function
    const onCloseMock = vi.fn();
    
    // Render component
    render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    // Simulate escape key press
    fireEvent.keyDown(window, { key: 'Escape' });
    
    // Assert that onClose was called
    expect(onCloseMock).toHaveBeenCalled();
  });
});












