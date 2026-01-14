import React, { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { AuthProvider, UIProvider, useUI } from './contexts';
import { lightTheme, darkTheme } from './theme';
import { router } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

// Toast notifications component - fixed to prevent timer accumulation
const ToastNotifications: React.FC = () => {
  const { notifications, removeNotification } = useUI();
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    // Set up timers for new notifications
    notifications.forEach((notification) => {
      if (!timersRef.current[notification.id]) {
        timersRef.current[notification.id] = setTimeout(() => {
          removeNotification(notification.id);
          delete timersRef.current[notification.id];
        }, notification.duration || 5000);
      }
    });

    // Clean up timers for removed notifications
    const currentIds = new Set(notifications.map(n => n.id));
    Object.keys(timersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });
  }, [notifications, removeNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleClose = (id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    removeNotification(id);
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ top: `${(index * 60) + 24}px !important` }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Theme wrapper component
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode } = useUI();
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <ToastNotifications />
    </ThemeProvider>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <ThemeWrapper>
            <RouterProvider router={router} />
          </ThemeWrapper>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
