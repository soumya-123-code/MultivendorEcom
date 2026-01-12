import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks';
import { fetchCurrentUser } from './store/slices/authSlice';
import { darkTheme, lightTheme } from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Common Components
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Products
import ProductsListPage from './pages/products/ProductsListPage';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// App content with theme
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { themeMode } = useAppSelector((state) => state.ui);
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Fetch current user on app load if authenticated
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Products */}
              <Route path="products" element={<ProductsListPage />} />
              <Route path="products/new" element={<div>Create Product (Coming Soon)</div>} />
              <Route path="products/:id" element={<div>Product Detail (Coming Soon)</div>} />
              <Route path="products/:id/edit" element={<div>Edit Product (Coming Soon)</div>} />

              {/* Categories */}
              <Route path="categories" element={<div>Categories (Coming Soon)</div>} />

              {/* Orders */}
              <Route path="orders" element={<div>Orders (Coming Soon)</div>} />
              <Route path="orders/:id" element={<div>Order Detail (Coming Soon)</div>} />

              {/* Purchase Orders */}
              <Route path="purchase-orders" element={<div>Purchase Orders (Coming Soon)</div>} />
              <Route path="purchase-orders/new" element={<div>Create PO (Coming Soon)</div>} />
              <Route path="purchase-orders/:id" element={<div>PO Detail (Coming Soon)</div>} />

              {/* Inventory */}
              <Route path="inventory" element={<div>Inventory (Coming Soon)</div>} />

              {/* Warehouses */}
              <Route path="warehouses" element={<div>Warehouses (Coming Soon)</div>} />
              <Route path="warehouses/:id" element={<div>Warehouse Detail (Coming Soon)</div>} />

              {/* Vendors */}
              <Route path="vendors" element={<div>Vendors (Coming Soon)</div>} />
              <Route path="vendors/:id" element={<div>Vendor Detail (Coming Soon)</div>} />

              {/* Suppliers */}
              <Route path="suppliers" element={<div>Suppliers (Coming Soon)</div>} />

              {/* Customers */}
              <Route path="customers" element={<div>Customers (Coming Soon)</div>} />
              <Route path="customers/:id" element={<div>Customer Detail (Coming Soon)</div>} />

              {/* Delivery */}
              <Route path="delivery" element={<div>Delivery Agents (Coming Soon)</div>} />

              {/* Users */}
              <Route path="users" element={<div>Users (Coming Soon)</div>} />

              {/* Analytics */}
              <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
              <Route path="analytics/sales" element={<div>Sales Analytics (Coming Soon)</div>} />
              <Route path="analytics/products" element={<div>Product Analytics (Coming Soon)</div>} />

              {/* Settings */}
              <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
              <Route path="profile" element={<div>Profile (Coming Soon)</div>} />

              {/* 404 */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Route>

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

// Main App with providers
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
