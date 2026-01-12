import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider  } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { AuthProvider, UIProvider, useUI } from './contexts';
import { lightTheme, darkTheme } from './theme';
import { router } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

// Toast notifications component
const ToastNotifications: React.FC = () => {
  const { notifications, removeNotification } = useUI();

  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  const handleClose = (id: string) => {
    removeNotification(id);
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration || 5000}
          onClose={() => handleClose(notification.id)}
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
