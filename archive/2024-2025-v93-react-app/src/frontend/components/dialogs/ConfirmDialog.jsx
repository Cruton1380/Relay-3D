/**
 * @fileoverview Confirm Dialog Component
 * Reusable confirmation dialog for user actions
 */
import React from 'react';
import { Button } from '../shared/index.js';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary', // 'primary', 'secondary', 'danger'
  icon
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  const renderIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'danger':
        return (
          <svg viewBox="0 0 24 24" className="dialog-icon danger">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        );
      case 'primary':
        return (
          <svg viewBox="0 0 24 24" className="dialog-icon primary">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="dialog-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
    }
  };

  return (
    <div 
      className="confirm-dialog-overlay" 
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`confirm-dialog ${variant}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-header">
          {renderIcon()}
          <h3 className="dialog-title">{title}</h3>
        </div>

        <div className="dialog-content">
          {typeof message === 'string' ? (
            <p className="dialog-message">{message}</p>
          ) : (
            <div className="dialog-message">{message}</div>
          )}
        </div>

        <div className="dialog-actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            autoFocus={variant !== 'danger'}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            autoFocus={variant === 'danger'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
