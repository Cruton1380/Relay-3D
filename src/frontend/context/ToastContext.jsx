import React, { createContext, useContext, useState, useCallback } from 'react';
import './ToastContext.css';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const toast = {
      id,
      message,
      type,
    };

    setToasts((currentToasts) => [...currentToasts, toast]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((currentToasts) => 
        currentToasts.filter((t) => t.id !== id)
      );
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) => 
      currentToasts.filter((t) => t.id !== id)
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
} 