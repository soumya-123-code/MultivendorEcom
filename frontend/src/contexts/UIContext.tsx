import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  notifications: NotificationItem[];
  globalLoading: boolean;
}

interface UIContextValue extends UIState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleDarkMode: () => void;
  setDarkMode: (darkMode: boolean) => void;
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    sidebarOpen: true,
    sidebarCollapsed: false,
    darkMode: localStorage.getItem('darkMode') === 'true',
    notifications: [],
    globalLoading: false,
  });

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const setSidebarOpen = (open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }));
  };

  const toggleSidebarCollapsed = () => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
  };

  const toggleDarkMode = () => {
    setState(prev => {
      const newDarkMode = !prev.darkMode;
      localStorage.setItem('darkMode', String(newDarkMode));
      return { ...prev, darkMode: newDarkMode };
    });
  };

  const setDarkMode = (darkMode: boolean) => {
    localStorage.setItem('darkMode', String(darkMode));
    setState(prev => ({ ...prev, darkMode }));
  };

  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
    };
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification],
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const setGlobalLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, globalLoading: loading }));
  };

  const value: UIContextValue = {
    ...state,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    toggleDarkMode,
    setDarkMode,
    addNotification,
    removeNotification,
    clearNotifications,
    setGlobalLoading,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
