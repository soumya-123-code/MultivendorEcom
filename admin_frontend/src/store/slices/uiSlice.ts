import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  children?: NavItem[];
  expanded?: boolean;
  badge?: number;
}

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  themeMode: 'dark' | 'light';
  activeNav: string | null;
  expandedNavs: string[];
  pageTitle: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
}

const getStoredTheme = (): 'dark' | 'light' => {
  const stored = localStorage.getItem('theme_mode');
  return stored === 'light' ? 'light' : 'dark';
};

const initialState: UiState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  themeMode: getStoredTheme(),
  activeNav: null,
  expandedNavs: [],
  pageTitle: 'Dashboard',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme_mode', state.themeMode);
    },
    setThemeMode: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.themeMode = action.payload;
      localStorage.setItem('theme_mode', action.payload);
    },
    setActiveNav: (state, action: PayloadAction<string | null>) => {
      state.activeNav = action.payload;
    },
    toggleNavExpanded: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.expandedNavs.indexOf(id);
      if (index > -1) {
        state.expandedNavs.splice(index, 1);
      } else {
        state.expandedNavs.push(id);
      }
    },
    setExpandedNavs: (state, action: PayloadAction<string[]>) => {
      state.expandedNavs = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  toggleTheme,
  setThemeMode,
  setActiveNav,
  toggleNavExpanded,
  setExpandedNavs,
  setPageTitle,
  setBreadcrumbs,
} = uiSlice.actions;

export default uiSlice.reducer;
