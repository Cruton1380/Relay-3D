import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';

/**
 * System Dialog component
 * Provides specialized dialog types that match the legacy dialogManager functionality
 */
export const SystemDialog = ({ 
  type, 
  title, 
  message, 
  icon, 
  onConfirm, 
  onCancel, 
  onClose,
  validateFn,
  defaultValue = '',
  placeholder = '',
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [validationError, setValidationError] = useState(null);
  
  // Handle input validation for prompt dialogs
  const handleConfirm = () => {
    if (type === 'prompt' && validateFn) {
      const validationResult = validateFn(inputValue);
      if (validationResult !== true) {
        setValidationError(validationResult || 'Invalid input');
        return;
      }
    }
    
    if (onConfirm) {
      onConfirm(type === 'prompt' ? inputValue : undefined);
    }
  };
  
  // Render icon based on type or explicit icon
  const renderIcon = () => {
    let iconType = icon;
    
    if (!iconType) {
      switch (type) {
        case 'error': iconType = 'error'; break;
        case 'success': iconType = 'success'; break;
        case 'warning': iconType = 'warning'; break;
        case 'info': iconType = 'info'; break;
        default: return null;
      }
    }
    
    if (!iconType) return null;
    
    return (
      <div className={`dialog-icon dialog-icon-${iconType}`}>
        {iconType === 'error' && '❌'}
        {iconType === 'success' && '✅'}
        {iconType === 'warning' && '⚠️'}
        {iconType === 'info' && 'ℹ️'}
      </div>
    );
  };
  
  return (
    <div className="system-dialog">
      {renderIcon()}
      
      <h2 className="dialog-title">{title}</h2>
      <p className="dialog-message">{message}</p>
      
      {type === 'prompt' && (
        <>
          <input
            type="text"
            className="dialog-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
          />
          {validationError && (
            <div className="dialog-validation-error">{validationError}</div>
          )}
        </>
      )}
      
      <div className="dialog-buttons">
        {(type === 'confirm' || type === 'prompt') && (
          <button 
            className="dialog-button dialog-button-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        )}
        <button 
          className="dialog-button dialog-button-primary"
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};
