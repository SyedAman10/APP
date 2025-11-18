import { useState } from 'react';

interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export function useLMN8Alert() {
  const [alert, setAlert] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (options: AlertOptions) => {
    setAlert({
      ...options,
      visible: true,
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const showError = (message: string, title: string = 'Error') => {
    showAlert({ title, message, type: 'error' });
  };

  const showSuccess = (message: string, title: string = 'Success') => {
    showAlert({ title, message, type: 'success' });
  };

  const showWarning = (message: string, title: string = 'Warning') => {
    showAlert({ title, message, type: 'warning' });
  };

  const showInfo = (message: string, title: string = 'Info') => {
    showAlert({ title, message, type: 'info' });
  };

  return {
    alert,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
