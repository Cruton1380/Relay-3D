import { useCallback } from 'react';
import { useModal } from '../context/ModalContext';
import { SystemDialog } from '../components/dialogs/SystemDialog';
import { PermissionDialog } from '../components/dialogs/PermissionDialog';

/**
 * Dialog Service Hook - provides programmatic dialog creation
 * Migrated from dialogManager.mjs functionality
 */
export function useDialogService() {
  const { openModal, closeModal } = useModal();
  
  // Show alert dialog
  const showAlert = useCallback((title, message, options = {}) => {
    return new Promise(resolve => {
      const modalId = `alert-${Date.now()}`;
      
      openModal(modalId, {
        content: (
          <SystemDialog
            type="alert"
            title={title}
            message={message}
            icon={options.icon}
            confirmText={options.confirmText || 'OK'}
            onConfirm={() => {
              closeModal(modalId);
              resolve();
            }}
          />
        ),
        onClose: () => resolve()
      });
    });
  }, [openModal, closeModal]);
  
  // Show confirm dialog
  const showConfirm = useCallback((title, message, options = {}) => {
    return new Promise(resolve => {
      const modalId = `confirm-${Date.now()}`;
      
      openModal(modalId, {
        content: (
          <SystemDialog
            type="confirm"
            title={title}
            message={message}
            icon={options.icon}
            confirmText={options.confirmText || 'OK'}
            cancelText={options.cancelText || 'Cancel'}
            onConfirm={() => {
              closeModal(modalId);
              resolve(true);
            }}
            onCancel={() => {
              closeModal(modalId);
              resolve(false);
            }}
          />
        ),
        onClose: () => resolve(false)
      });
    });
  }, [openModal, closeModal]);
  
  // Show prompt dialog
  const showPrompt = useCallback((title, message, options = {}) => {
    return new Promise(resolve => {
      const modalId = `prompt-${Date.now()}`;
      
      openModal(modalId, {
        content: (
          <SystemDialog
            type="prompt"
            title={title}
            message={message}
            icon={options.icon}
            defaultValue={options.defaultValue || ''}
            placeholder={options.placeholder || ''}
            validateFn={options.validateFn}
            confirmText={options.confirmText || 'OK'}
            cancelText={options.cancelText || 'Cancel'}
            onConfirm={(value) => {
              closeModal(modalId);
              resolve(value);
            }}
            onCancel={() => {
              closeModal(modalId);
              resolve(null);
            }}
          />
        ),
        onClose: () => resolve(null)
      });
    });
  }, [openModal, closeModal]);
  
  // Helper functions for common dialog types
  const showError = useCallback((title, message, options = {}) => 
    showAlert(title, message, { ...options, icon: 'error' }),
  [showAlert]);
    
  const showSuccess = useCallback((title, message, options = {}) => 
    showAlert(title, message, { ...options, icon: 'success' }),
  [showAlert]);
    
  const showWarning = useCallback((title, message, options = {}) => 
    showAlert(title, message, { ...options, icon: 'warning' }),
  [showAlert]);

  return {
    showAlert,
    showConfirm,
    showPrompt,
    showError,
    showSuccess,
    showWarning
  };
}

export default useDialogService;
