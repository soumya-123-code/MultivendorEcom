// @ts-nocheck 
import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// Color palette - Midnight Navy with Electric accents
const colors = {
  // Primary - Electric Indigo
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  // Secondary - Vibrant Cyan
  secondary: {
    main: '#22d3ee',
    light: '#67e8f9',
    dark: '#06b6d4',
    contrastText: '#0f0f23',
  },
  // Success - Emerald
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  // Warning - Amber
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#0f0f23',
  },
  // Error - Rose
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
  // Info - Sky
  info: {
    main: '#0ea5e9',
    light: '#38bdf8',
    dark: '#0284c7',
    contrastText: '#ffffff',
  },
  // Background tones
  background: {
    default: '#0f0f23',
    paper: '#1a1a2e',
    elevated: '#252542',
    surface: '#16162d',
  },
  // Text
  text: {
    primary: '#f4f4f5',
    secondary: '#a1a1aa',
    disabled: '#52525b',
  },
  // Divider
  divider: 'rgba(161, 161, 170, 0.12)',
  // Action
  action: {
    active: '#a1a1aa',
    hover: 'rgba(99, 102, 241, 0.08)',
    selected: 'rgba(99, 102, 241, 0.16)',
    disabled: 'rgba(161, 161, 170, 0.3)',
    disabledBackground: 'rgba(161, 161, 170, 0.12)',
  },
};

// Shared typography
const typography = {
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "Fira Code", monospace',
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.57,
  },
  button: {
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.02em',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.66,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    lineHeight: 2.5,
  },
};

// Component overrides
const getComponents = (mode: 'dark' | 'light'): ThemeOptions['components'] => ({
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        scrollBehavior: 'smooth',
      },
      body: {
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.primary.main} ${colors.background.paper}`,
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: colors.background.paper,
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(colors.primary.main, 0.5),
          borderRadius: '4px',
          '&:hover': {
            background: colors.primary.main,
          },
        },
      },
      '*::selection': {
        background: alpha(colors.primary.main, 0.3),
        color: colors.text.primary,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '10px 20px',
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
      contained: {
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
        '&:hover': {
          background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`,
        },
      },
      containedSecondary: {
        background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
        '&:hover': {
          background: `linear-gradient(135deg, ${colors.secondary.light} 0%, ${colors.secondary.main} 100%)`,
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
          background: alpha(colors.primary.main, 0.08),
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        background: colors.background.paper,
        border: `1px solid ${colors.divider}`,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px ${alpha(colors.primary.main, 0.1)}`,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      elevation2: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          background: colors.background.surface,
          '& fieldset': {
            borderColor: colors.divider,
            borderWidth: 1,
          },
          '&:hover fieldset': {
            borderColor: alpha(colors.primary.main, 0.5),
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary.main,
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.divider,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(colors.primary.main, 0.5),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.primary.main,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
      filled: {
        background: alpha(colors.primary.main, 0.15),
        color: colors.primary.light,
        '&:hover': {
          background: alpha(colors.primary.main, 0.25),
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${colors.divider}`,
        padding: '16px',
      },
      head: {
        fontWeight: 600,
        background: colors.background.surface,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.08em',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          background: alpha(colors.primary.main, 0.04),
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        background: colors.background.paper,
        borderRight: `1px solid ${colors.divider}`,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        background: alpha(colors.background.default, 0.8),
        backdropFilter: 'blur(20px)',
        boxShadow: 'none',
        borderBottom: `1px solid ${colors.divider}`,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        margin: '4px 8px',
        padding: '10px 16px',
        '&:hover': {
          background: alpha(colors.primary.main, 0.08),
        },
        '&.Mui-selected': {
          background: alpha(colors.primary.main, 0.15),
          '&:hover': {
            background: alpha(colors.primary.main, 0.2),
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '60%',
            borderRadius: '0 4px 4px 0',
            background: colors.primary.main,
          },
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        background: colors.background.elevated,
        color: colors.text.primary,
        fontSize: '0.75rem',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${colors.divider}`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        background: colors.background.paper,
        borderRadius: 16,
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.9rem',
        minWidth: 'auto',
        padding: '12px 16px',
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 600,
        fontSize: '0.7rem',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        background: alpha(colors.primary.main, 0.15),
      },
      bar: {
        borderRadius: 4,
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
        fontWeight: 600,
      },
    },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        '& .MuiDataGrid-cell': {
          borderBottom: `1px solid ${colors.divider}`,
        },
        '& .MuiDataGrid-columnHeaders': {
          background: colors.background.surface,
          borderBottom: `1px solid ${colors.divider}`,
        },
        '& .MuiDataGrid-row:hover': {
          background: alpha(colors.primary.main, 0.04),
        },
        '& .MuiDataGrid-row.Mui-selected': {
          background: alpha(colors.primary.main, 0.08),
          '&:hover': {
            background: alpha(colors.primary.main, 0.12),
          },
        },
      },
    },
  },
});

// Dark theme (default)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...colors,
  },
  typography,
  shape: {
    borderRadius: 12,
  },
  components: getComponents('dark'),
});

// Light theme option
const lightColors = {
  ...colors,
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
    elevated: '#f1f5f9',
    surface: '#f8fafc',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    disabled: '#94a3b8',
  },
  divider: 'rgba(15, 23, 42, 0.08)',
  action: {
    active: '#64748b',
    hover: 'rgba(99, 102, 241, 0.04)',
    selected: 'rgba(99, 102, 241, 0.08)',
    disabled: 'rgba(71, 85, 105, 0.3)',
    disabledBackground: 'rgba(71, 85, 105, 0.12)',
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...lightColors,
  },
  typography,
  shape: {
    borderRadius: 12,
  },
  components: getComponents('light'),
});

// Export default
export default darkTheme;

// Status colors helper
export const statusColors: Record<string, string> = {
  // Product status
  draft: '#94a3b8',
  active: '#10b981',
  inactive: '#f59e0b',
  archived: '#6b7280',
  // Vendor status
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  suspended: '#dc2626',
  // Order status
  confirmed: '#22d3ee',
  processing: '#6366f1',
  packed: '#8b5cf6',
  ready_for_pickup: '#a855f7',
  out_for_delivery: '#0ea5e9',
  delivered: '#10b981',
  delivery_failed: '#ef4444',
  return_requested: '#f97316',
  return_approved: '#eab308',
  return_rejected: '#dc2626',
  return_shipped: '#8b5cf6',
  return_received: '#06b6d4',
  refunded: '#22d3ee',
  completed: '#059669',
  cancelled: '#6b7280',
  // Stock status
  in_stock: '#10b981',
  low_stock: '#f59e0b',
  out_of_stock: '#ef4444',
  expired: '#dc2626',
  damaged: '#9333ea',
  // PO status
  pending_approval: '#f59e0b',
  sent: '#22d3ee',
  receiving: '#6366f1',
  partial_received: '#8b5cf6',
  received: '#10b981',
  complete: '#059669',
  returned: '#f97316',
  // Payment status
  failed: '#ef4444',
  partial: '#f59e0b',
};
