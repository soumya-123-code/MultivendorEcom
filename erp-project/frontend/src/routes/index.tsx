import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';
import ProtectedRoute from './ProtectedRoute';
import LoadingScreen from '../components/common/LoadingScreen';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UsersList = lazy(() => import('../pages/admin/users/UsersList'));
const UserDetail = lazy(() => import('../pages/admin/users/UserDetail'));
const VendorsList = lazy(() => import('../pages/admin/vendors/VendorsList'));
const ProductsList = lazy(() => import('../pages/admin/products/ProductsList'));
const ProductForm = lazy(() => import('../pages/admin/products/ProductForm'));
const SalesOrdersList = lazy(() => import('../pages/admin/orders/SalesOrdersList'));
const SalesOrderDetail = lazy(() => import('../pages/admin/orders/SalesOrderDetail'));
const InventoryList = lazy(() => import('../pages/admin/inventory/InventoryList'));
const WarehousesList = lazy(() => import('../pages/admin/warehouses/WarehousesList'));
const PurchaseOrdersList = lazy(() => import('../pages/admin/purchase-orders/PurchaseOrdersList'));
const PurchaseOrderDetail = lazy(() => import('../pages/admin/purchase-orders/PurchaseOrderDetail'));
const DeliveryAgentsList = lazy(() => import('../pages/admin/delivery-agents/DeliveryAgentsList'));
const CategoriesList = lazy(() => import('../pages/admin/categories/CategoriesList'));

// Vendor Pages
const VendorDashboard = lazy(() => import('../pages/vendor/VendorDashboard'));
const VendorProductsList = lazy(() => import('../pages/vendor/products/ProductsList'));
const VendorInventoryList = lazy(() => import('../pages/vendor/inventory/InventoryList'));
const VendorSalesOrdersList = lazy(() => import('../pages/vendor/orders/SalesOrdersList'));
const VendorPurchaseOrdersList = lazy(() => import('../pages/vendor/purchase-orders/PurchaseOrdersList'));
const VendorWarehousesList = lazy(() => import('../pages/vendor/warehouses/WarehousesList'));
const SuppliersList = lazy(() => import('../pages/vendor/suppliers/SuppliersList'));

// Warehouse Pages
const WarehouseDashboard = lazy(() => import('../pages/warehouse/WarehouseDashboard'));
const StockOverview = lazy(() => import('../pages/warehouse/stock/StockOverview'));
const InboundOperations = lazy(() => import('../pages/warehouse/inbound/InboundOperations'));
const OutboundOperations = lazy(() => import('../pages/warehouse/outbound/OutboundOperations'));

// Delivery Pages
const DeliveryDashboard = lazy(() => import('../pages/delivery/DeliveryDashboard'));
const AssignedDeliveries = lazy(() => import('../pages/delivery/assigned/AssignedDeliveries'));
const DeliveryHistory = lazy(() => import('../pages/delivery/history/DeliveryHistory'));

// Suspense wrapper
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

// Placeholder component for pages not yet created
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: 24 }}>
    <h1>{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  // Auth Routes
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
    ],
  },
  // Admin Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
      { path: 'users', element: <SuspenseWrapper><UsersList /></SuspenseWrapper> },
      { path: 'users/:id', element: <SuspenseWrapper><UserDetail /></SuspenseWrapper> },
      { path: 'vendors', element: <SuspenseWrapper><VendorsList /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><ProductsList /></SuspenseWrapper> },
      { path: 'products/new', element: <SuspenseWrapper><ProductForm /></SuspenseWrapper> },
      { path: 'products/:id', element: <SuspenseWrapper><ProductForm /></SuspenseWrapper> },
      { path: 'categories', element: <SuspenseWrapper><CategoriesList /></SuspenseWrapper> },
      { path: 'warehouses', element: <SuspenseWrapper><WarehousesList /></SuspenseWrapper> },
      { path: 'inventory', element: <SuspenseWrapper><InventoryList /></SuspenseWrapper> },
      { path: 'purchase-orders', element: <SuspenseWrapper><PurchaseOrdersList /></SuspenseWrapper> },
      { path: 'purchase-orders/:id', element: <SuspenseWrapper><PurchaseOrderDetail /></SuspenseWrapper> },
      { path: 'sales-orders', element: <SuspenseWrapper><SalesOrdersList /></SuspenseWrapper> },
      { path: 'sales-orders/:id', element: <SuspenseWrapper><SalesOrderDetail /></SuspenseWrapper> },
      { path: 'delivery-agents', element: <SuspenseWrapper><DeliveryAgentsList /></SuspenseWrapper> },
      { path: 'notifications', element: <PlaceholderPage title="Notifications" /> },
      { path: 'reports', element: <PlaceholderPage title="Reports" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
      { path: 'profile', element: <PlaceholderPage title="Profile" /> },
    ],
  },
  // Vendor Routes
  {
    path: '/vendor',
    element: (
      <ProtectedRoute allowedRoles={['vendor']}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrapper><VendorDashboard /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><VendorProductsList /></SuspenseWrapper> },
      { path: 'products/new', element: <PlaceholderPage title="Add Product" /> },
      { path: 'products/:id', element: <PlaceholderPage title="Edit Product" /> },
      { path: 'categories', element: <PlaceholderPage title="Categories" /> },
      { path: 'inventory', element: <SuspenseWrapper><VendorInventoryList /></SuspenseWrapper> },
      { path: 'suppliers', element: <SuspenseWrapper><SuppliersList /></SuspenseWrapper> },
      { path: 'warehouses', element: <SuspenseWrapper><VendorWarehousesList /></SuspenseWrapper> },
      { path: 'purchase-orders', element: <SuspenseWrapper><VendorPurchaseOrdersList /></SuspenseWrapper> },
      { path: 'sales-orders', element: <SuspenseWrapper><VendorSalesOrdersList /></SuspenseWrapper> },
      { path: 'reports', element: <PlaceholderPage title="Reports" /> },
      { path: 'profile', element: <PlaceholderPage title="Vendor Profile" /> },
    ],
  },
  // Warehouse Routes
  {
    path: '/warehouse',
    element: (
      <ProtectedRoute allowedRoles={['warehouse', 'staff']}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrapper><WarehouseDashboard /></SuspenseWrapper> },
      { path: 'stock', element: <SuspenseWrapper><StockOverview /></SuspenseWrapper> },
      { path: 'inbound', element: <SuspenseWrapper><InboundOperations /></SuspenseWrapper> },
      { path: 'outbound', element: <SuspenseWrapper><OutboundOperations /></SuspenseWrapper> },
      { path: 'adjustments', element: <PlaceholderPage title="Stock Adjustments" /> },
      { path: 'locations', element: <PlaceholderPage title="Warehouse Locations" /> },
      { path: 'reports', element: <PlaceholderPage title="Warehouse Reports" /> },
    ],
  },
  // Delivery Agent Routes
  {
    path: '/delivery',
    element: (
      <ProtectedRoute allowedRoles={['delivery_agent']}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrapper><DeliveryDashboard /></SuspenseWrapper> },
      { path: 'assigned', element: <SuspenseWrapper><AssignedDeliveries /></SuspenseWrapper> },
      { path: 'in-progress', element: <PlaceholderPage title="In Progress" /> },
      { path: 'completed', element: <PlaceholderPage title="Completed Deliveries" /> },
      { path: 'history', element: <SuspenseWrapper><DeliveryHistory /></SuspenseWrapper> },
      { path: 'profile', element: <PlaceholderPage title="My Profile" /> },
    ],
  },
  // 404 - Catch all
  {
    path: '*',
    element: (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    ),
  },
]);

export default router;
