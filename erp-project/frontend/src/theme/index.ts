import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

const primaryColor = '#1976d2';
const secondaryColor = '#9c27b0';

const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 16px' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } },
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' }, styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTableHead: { styleOverrides: { root: { '& .MuiTableCell-root': { fontWeight: 600, backgroundColor: alpha(primaryColor, 0.08) } } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 8, '&.Mui-selected': { backgroundColor: alpha(primaryColor, 0.12) } } } },
  },
};

export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: { main: primaryColor, light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: secondaryColor, light: '#ba68c8', dark: '#7b1fa2' },
    success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
    warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
    error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
    info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#1a1a1a', secondary: '#666666' },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
});

export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
    secondary: { main: '#ce93d8', light: '#f3e5f5', dark: '#ab47bc' },
    success: { main: '#66bb6a' },
    warning: { main: '#ffa726' },
    error: { main: '#f44336' },
    info: { main: '#29b6f6' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)' },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
});

export const statusColors = {
  vendor: {
    pending: { bg: '#fff3e0', color: '#e65100' },
    approved: { bg: '#e8f5e9', color: '#2e7d32' },
    rejected: { bg: '#ffebee', color: '#c62828' },
    suspended: { bg: '#fce4ec', color: '#ad1457' },
    inactive: { bg: '#eeeeee', color: '#616161' },
  },
  order: {
    pending: { bg: '#fff3e0', color: '#e65100' },
    confirmed: { bg: '#e3f2fd', color: '#1565c0' },
    processing: { bg: '#e8f5e9', color: '#2e7d32' },
    packed: { bg: '#f3e5f5', color: '#7b1fa2' },
    ready_for_pickup: { bg: '#e0f2f1', color: '#00695c' },
    out_for_delivery: { bg: '#e1f5fe', color: '#0277bd' },
    delivered: { bg: '#c8e6c9', color: '#1b5e20' },
    cancelled: { bg: '#ffcdd2', color: '#c62828' },
    completed: { bg: '#c8e6c9', color: '#1b5e20' },
  },
  delivery: {
    assigned: { bg: '#e3f2fd', color: '#1565c0' },
    accepted: { bg: '#e8f5e9', color: '#2e7d32' },
    picked_up: { bg: '#f3e5f5', color: '#7b1fa2' },
    in_transit: { bg: '#e1f5fe', color: '#0277bd' },
    out_for_delivery: { bg: '#fff8e1', color: '#ff8f00' },
    delivered: { bg: '#c8e6c9', color: '#1b5e20' },
    failed: { bg: '#ffcdd2', color: '#c62828' },
    cancelled: { bg: '#ffcdd2', color: '#c62828' },
  },
  stock: {
    in_stock: { bg: '#c8e6c9', color: '#1b5e20' },
    low_stock: { bg: '#fff8e1', color: '#ff8f00' },
    out_of_stock: { bg: '#ffcdd2', color: '#c62828' },
  },
};

export const getStatusColor = (category: keyof typeof statusColors, status: string) => {
  const categoryColors = statusColors[category] as Record<string, { bg: string; color: string }>;
  return categoryColors[status] || { bg: '#eeeeee', color: '#616161' };
};

export default lightTheme;
