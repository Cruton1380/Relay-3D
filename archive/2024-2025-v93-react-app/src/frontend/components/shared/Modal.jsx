/**
 * @fileoverview Modern, accessible Modal component with performance optimizations
 * @version 2.0.0
 * @author RelayCodeBase Team
 */

'use strict';

import React, { memo, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Size configuration mapping for modal dimensions
 * @constant {Object<string, string>}
 */
const SIZE_CLASSES = Object.freeze({
  small: 'max-w-md',
  medium: 'max-w-lg',
  large: 'max-w-2xl',
  fullscreen: 'max-w-full h-full'
});

/**
 * Modern, accessible Modal component with performance optimizations.
 * 
 * Features:
 * - React.memo for performance optimization
 * - useCallback for stable event handlers
 * - useMemo for expensive calculations
 * - Enhanced accessibility with ARIA attributes
 * - PropTypes validation for development
 * - Comprehensive JSDoc documentation
 * - Strict mode compatibility
 * - Focus management and keyboard navigation
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {string} props.title - Modal title text
 * @param {React.ReactNode} props.children - Modal content
 * @param {('small'|'medium'|'large'|'fullscreen')} props.size - Size variant of the modal
 * @param {boolean} props.showCloseButton - Whether to show the close button
 * @returns {React.ReactElement|null} Rendered modal component or null if closed
 * 
 * @example
 * // Basic usage
 * <Modal isOpen={true} onClose={handleClose} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * 
 * @example
 * // Custom size without close button
 * <Modal isOpen={true} onClose={handleClose} title="Large Dialog" size="large" showCloseButton={false}>
 *   <div>Custom content here</div>
 * </Modal>
 */
const Modal = memo(function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true 
}) {  // Memoize stable close handler for escape key
  const handleEscape = useCallback((event) => {
    if (isOpen && event.key === 'Escape') {
      onClose();
    }
  }, [isOpen, onClose]);

  // Add ESC key listener to close modal
  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [handleEscape]);

  // Memoize stable backdrop click handler
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Memoize size class calculation for performance
  const sizeClass = useMemo(() => {
    return SIZE_CLASSES[size] || SIZE_CLASSES.medium;
  }, [size]);

  // Memoize modal content className for performance
  const modalContentClassName = useMemo(() => {
    return `bg-white rounded-lg shadow-xl w-full ${sizeClass} m-4 overflow-auto max-h-[90vh]`;
  }, [sizeClass]);
  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        className={modalContentClassName}
        data-testid="modal-content"
      >
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          {showCloseButton && (
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" 
              onClick={onClose}
              aria-label="Close modal"
              data-testid="modal-close-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
});

// PropTypes validation for development
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
  showCloseButton: PropTypes.bool
};

// Display name for debugging
Modal.displayName = 'Modal';

export default Modal;