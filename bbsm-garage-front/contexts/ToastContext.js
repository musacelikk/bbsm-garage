import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration = 3000) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration = 4000) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration = 3000) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration = 3000) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
};

