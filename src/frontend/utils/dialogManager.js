/**
 * Dialog Manager Utility
 * Provides programmatic API for working with dialogs and modals
 */
import { useModal } from '../context/ModalContext';
import { useCallback } from 'react';

// Dialog types
const DIALOG_TYPES = {
  ALERT: 'alert',
  CONFIRM: 'confirm',
  PROMPT: 'prompt',
  CUSTOM: 'custom'
};

/**
 * React hook for using dialog manager
 * @returns {Object} Dialog manager functions
 */
export function useDialogManager() {
  const { openModal, closeModal } = useModal();
  
  // Show alert dialog
  const showAlert = useCallback((message, options = {}) => {
    return new Promise(resolve => {
      openModal('systemDialog', {
        type: DIALOG_TYPES.ALERT,
        message,
        title: options.title || 'Alert',
        onClose: () => {
          resolve();
          closeModal('systemDialog');
        }
      });
    });
  }, [openModal, closeModal]);
  
  // Show confirmation dialog
  const showConfirm = useCallback((message, options = {}) => {
    return new Promise(resolve => {
      openModal('systemDialog', {
        type: DIALOG_TYPES.CONFIRM,
        message,
        title: options.title || 'Confirm',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          resolve(true);
          closeModal('systemDialog');
        },
        onCancel: () => {
          resolve(false);
          closeModal('systemDialog');
        }
      });
    });
  }, [openModal, closeModal]);
  
  // Show prompt dialog
  const showPrompt = useCallback((message, options = {}) => {
    return new Promise(resolve => {
      openModal('systemDialog', {
        type: DIALOG_TYPES.PROMPT,
        message,
        title: options.title || 'Input Required',
        defaultValue: options.defaultValue || '',
        placeholder: options.placeholder || '',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: (value) => {
          resolve(value);
          closeModal('systemDialog');
        },
        onCancel: () => {
          resolve(null);
          closeModal('systemDialog');
        }
      });
    });
  }, [openModal, closeModal]);
  
  // Show custom dialog
  const showCustomDialog = useCallback((dialogProps) => {
    return new Promise(resolve => {
      openModal('systemDialog', {
        type: DIALOG_TYPES.CUSTOM,
        ...dialogProps,
        onClose: (result) => {
          resolve(result);
          closeModal('systemDialog');
        }
      });
    });
  }, [openModal, closeModal]);
  
  return {
    showAlert,
    showConfirm,
    showPrompt,
    showCustomDialog,
    DIALOG_TYPES
  };
}

// System Dialog component for rendering different dialog types
export const SystemDialog = ({ type, message, title, onConfirm, onCancel, onClose, ...props }) => {
  switch (type) {
    case DIALOG_TYPES.ALERT:
      return (
        <div className="system-dialog alert-dialog">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="dialog-buttons">
            <button onClick={onClose}>OK</button>
          </div>
        </div>
      );
      
    case DIALOG_TYPES.CONFIRM:
      return (
        <div className="system-dialog confirm-dialog">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="dialog-buttons">
            <button onClick={() => onCancel()}>
              {props.cancelText || 'Cancel'}
            </button>
            <button 
              onClick={() => onConfirm()} 
              className="primary"
            >
              {props.confirmText || 'OK'}
            </button>
          </div>
        </div>
      );
      
    case DIALOG_TYPES.PROMPT:
      const [value, setValue] = React.useState(props.defaultValue || '');
      
      return (
        <div className="system-dialog prompt-dialog">
          <h3>{title}</h3>
          <p>{message}</p>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={props.placeholder || ''}
            className="prompt-input"
          />
          <div className="dialog-buttons">
            <button onClick={() => onCancel()}>
              {props.cancelText || 'Cancel'}
            </button>
            <button 
              onClick={() => onConfirm(value)} 
              className="primary"
            >
              {props.confirmText || 'OK'}
            </button>
          </div>
        </div>
      );
      
    case DIALOG_TYPES.CUSTOM:
      return props.render ? props.render({...props, onClose}) : null;
      
    default:
      return null;
  }
};

export default {
  useDialogManager,
  SystemDialog,
  DIALOG_TYPES
};
