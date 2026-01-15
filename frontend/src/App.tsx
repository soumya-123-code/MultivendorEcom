import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, alpha } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import ProductReviewsPage from './pages/ProductReviewsPage';
import CategoriesPage from './pages/CategoriesPage';
import WarehousesPage from './pages/WarehousesPage';
import InventoryPage from './pages/InventoryPage';
import InventoryLogsPage from './pages/InventoryLogsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import DeliveryAgentsPage from './pages/DeliveryAgentsPage';
import DeliveriesPage from './pages/DeliveriesPage';
import CustomersPage from './pages/CustomersPage';
import VendorsPage from './pages/VendorsPage';
import VendorStaffPage from './pages/VendorStaffPage';
import SuppliersPage from './pages/SuppliersPage';
import PaymentsPage from './pages/PaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import UsersPage from './pages/UsersPage';
import TokenManagementPage from './pages/TokenManagementPage';
import OTPRequestsPage from './pages/OTPRequestsPage';
import DeliveryProofsPage from './pages/DeliveryProofsPage';
import NotificationTemplatesPage from './pages/NotificationTemplatesPage';
import Layout from './components/Layout';
import ProductVariantsPage from "./pages/ProductVariantsPage";
import SettingsPage from './pages/SettingsPage';
import CouponsPage from './pages/CouponsPage';
import ReturnsPage from './pages/ReturnsPage';

/* ===========================
   🍅 TOMATO THEME
=========================== */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff4d4f',
      light: '#ff7875',
      dark: '#d9363e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff7a45',
      light: '#ffa940',
      dark: '#d46b08',
      contrastText: '#ffffff',
    },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#0ea5e9' },
    background: {
      default: '#fff5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    divider: '#fee2e2',
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: '"Inter","Roboto","Arial",sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff5f5',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        contained: {
          background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
          boxShadow: '0 8px 20px rgba(255,77,79,.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #d9363e 0%, #fa541c 100%)',
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 60%, #ffa940 100%)',
          boxShadow: '0px 8px 24px rgba(255,77,79,.35)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 12px 30px rgba(255,77,79,.08)',
          border: '1px solid #fee2e2',
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '6px 8px',
          '&:hover': {
            backgroundColor: alpha('#ff4d4f', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#ff4d4f', 0.16),
          },
        },
      },
    },

    // MuiDataGrid: {
    //   styleOverrides: {
    //     root: {
    //       borderRadius: 16,
    //       border: '1px solid #fee2e2',
    //       '& .MuiDataGrid-row:hover': {
    //         backgroundColor: alpha('#ff4d4f', 0.04),
    //       },
    //     },
    //   },
    // },
  },
});

/* ===========================
   Protected Route
=========================== */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ background: 'linear-gradient(135deg,#fff5f5,#ffe4e6)' }}
      >
        <CircularProgress size={48} sx={{ color: '#ff4d4f' }} />
      </Box>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/* ===========================
   Routes
=========================== */
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ background: 'linear-gradient(135deg,#fff5f5,#ffe4e6)' }}
      >
        <CircularProgress size={48} sx={{ color: '#ff4d4f' }} />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="product-variants" element={<ProductVariantsPage />} />
        <Route path="product-reviews" element={<ProductReviewsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory-logs" element={<InventoryLogsPage />} />
        <Route path="sales-orders" element={<SalesOrdersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="delivery-agents" element={<DeliveryAgentsPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="delivery-proofs" element={<DeliveryProofsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendor-staff" element={<VendorStaffPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="refunds" element={<PaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notification-templates" element={<NotificationTemplatesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="tokens" element={<TokenManagementPage />} />
        <Route path="otp-requests" element={<OTPRequestsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ===========================
   App
=========================== */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
