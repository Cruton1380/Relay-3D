/**
 * Modal Context Provider
 * Centralizes modal management in the application
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const ModalContext = createContext();

// Modal component with overlay
const Modal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container ${className}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Provider component
export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});
  
  // Open a modal
  const openModal = useCallback((modalId, props = {}) => {
    setModals(prev => ({
      ...prev,
      [modalId]: {
        isOpen: true,
        props
      }
    }));
  }, []);
  
  // Close a modal
  const closeModal = useCallback((modalId) => {
    setModals(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        isOpen: false
      }
    }));
  }, []);
  
  // Check if a modal is open
  const isModalOpen = useCallback((modalId) => {
    return modals[modalId]?.isOpen || false;
  }, [modals]);
  
  // Get modal props
  const getModalProps = useCallback((modalId) => {
    return modals[modalId]?.props || {};
  }, [modals]);
  
  // Context value
  const contextValue = {
    openModal,
    closeModal,
    isModalOpen,
    getModalProps
  };
  
  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

// Modal component for displaying modal content
export const ModalRenderer = ({ id, className, children }) => {
  const { isModalOpen, closeModal, getModalProps } = useContext(ModalContext);
  
  return (
    <Modal
      isOpen={isModalOpen(id)}
      onClose={() => closeModal(id)}
      className={className}
    >
      {typeof children === 'function' 
        ? children(getModalProps(id)) 
        : children}
    </Modal>
  );
};

// Custom hook for using modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  
  return context;
};

export default ModalContext;
