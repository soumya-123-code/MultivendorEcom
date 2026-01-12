import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  darkMode: localStorage.getItem('darkMode') === 'true',
  notifications: [],
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => { state.sidebarOpen = action.payload; },
    toggleSidebarCollapsed: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => { state.sidebarCollapsed = action.payload; },
    toggleDarkMode: (state) => { state.darkMode = !state.darkMode; localStorage.setItem('darkMode', String(state.darkMode)); },
    setDarkMode: (state, action: PayloadAction<boolean>) => { state.darkMode = action.payload; localStorage.setItem('darkMode', String(action.payload)); },
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id'>>) => {
      state.notifications.push({ ...action.payload, id: Date.now().toString() });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => { state.notifications = []; },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => { state.globalLoading = action.payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen, toggleSidebarCollapsed, setSidebarCollapsed,
  toggleDarkMode, setDarkMode, addNotification, removeNotification, clearNotifications, setGlobalLoading,
} = uiSlice.actions;

export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectDarkMode = (state: { ui: UIState }) => state.ui.darkMode;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;

export default uiSlice.reducer;
