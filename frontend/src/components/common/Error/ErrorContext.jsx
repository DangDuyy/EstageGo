// =====================================================
// ErrorContext.jsx - Quản lý lỗi toàn app
// =====================================================
import React, { createContext, useContext, useState } from 'react';
import { ErrorDialog } from './ErrorDialog';

// eslint-disable-next-line react-refresh/only-export-components
export const ErrorContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = (errorData) => {
    setError({
      message: errorData.message || 'Có lỗi xảy ra',
      title: errorData.title || 'Lỗi',
      type: errorData.type || 'error', // error, warning, info, success
      action: errorData.action || null,
      statusCode: errorData.statusCode || null,
    });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
      {error && <ErrorDialog error={error} onClose={clearError} />}
    </ErrorContext.Provider>
  );
};