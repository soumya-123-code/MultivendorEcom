import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, useTheme, alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Store as StoreIcon,
  Inventory as InventoryIcon, ShoppingCart as OrdersIcon, LocalShipping as DeliveryIcon,
  Warehouse as WarehouseIcon, Category as CategoryIcon, Assessment as ReportsIcon,
  Settings as SettingsIcon, Receipt as PurchaseIcon, LocalMall as ProductsIcon,
  Notifications as NotificationsIcon, Person as ProfileIcon, Business as SuppliersIcon,
  Input as InboundIcon, Output as OutboundIcon, SwapHoriz as AdjustmentsIcon,
  CheckCircle as CompletedIcon, History as HistoryIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../store';
import { selectUser } from '../store/slices/authSlice';
import { UserRole } from '../types';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

interface NavItem { title: string; path: string; icon: React.ReactNode; }

const getNavItems = (role: UserRole | null): NavItem[] => {
  const adminNav: NavItem[] = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { title: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
    { title: 'Vendors', path: '/admin/vendors', icon: <StoreIcon /> },
    { title: 'Products', path: '/admin/products', icon: <ProductsIcon /> },
    { title: 'Categories', path: '/admin/categories', icon: <CategoryIcon /> },
    { title: 'Warehouses', path: '/admin/warehouses', icon: <WarehouseIcon /> },
    { title: 'Inventory', path: '/admin/inventory', icon: <InventoryIcon /> },
    { title: 'Purchase Orders', path: '/admin/purchase-orders', icon: <PurchaseIcon /> },
    { title: 'Sales Orders', path: '/admin/sales-orders', icon: <OrdersIcon /> },
    { title: 'Delivery Agents', path: '/admin/delivery-agents', icon: <DeliveryIcon /> },
    { title: 'Notifications', path: '/admin/notifications', icon: <NotificationsIcon /> },
    { title: 'Reports', path: '/admin/reports', icon: <ReportsIcon /> },
    { title: 'Settings', path: '/admin/settings', icon: <SettingsIcon /> },
  ];
  const vendorNav: NavItem[] = [
    { title: 'Dashboard', path: '/vendor/dashboard', icon: <DashboardIcon /> },
    { title: 'Products', path: '/vendor/products', icon: <ProductsIcon /> },
    { title: 'Categories', path: '/vendor/categories', icon: <CategoryIcon /> },
    { title: 'Inventory', path: '/vendor/inventory', icon: <InventoryIcon /> },
    { title: 'Suppliers', path: '/vendor/suppliers', icon: <SuppliersIcon /> },
    { title: 'Warehouses', path: '/vendor/warehouses', icon: <WarehouseIcon /> },
    { title: 'Purchase Orders', path: '/vendor/purchase-orders', icon: <PurchaseIcon /> },
    { title: 'Sales Orders', path: '/vendor/sales-orders', icon: <OrdersIcon /> },
    { title: 'Reports', path: '/vendor/reports', icon: <ReportsIcon /> },
    { title: 'Profile', path: '/vendor/profile', icon: <ProfileIcon /> },
  ];
  const warehouseNav: NavItem[] = [
    { title: 'Dashboard', path: '/warehouse/dashboard', icon: <DashboardIcon /> },
    { title: 'Stock Overview', path: '/warehouse/stock', icon: <InventoryIcon /> },
    { title: 'Inbound', path: '/warehouse/inbound', icon: <InboundIcon /> },
    { title: 'Outbound', path: '/warehouse/outbound', icon: <OutboundIcon /> },
    { title: 'Adjustments', path: '/warehouse/adjustments', icon: <AdjustmentsIcon /> },
    { title: 'Locations', path: '/warehouse/locations', icon: <WarehouseIcon /> },
    { title: 'Reports', path: '/warehouse/reports', icon: <ReportsIcon /> },
  ];
  const deliveryNav: NavItem[] = [
    { title: 'Dashboard', path: '/delivery/dashboard', icon: <DashboardIcon /> },
    { title: 'Assigned', path: '/delivery/assigned', icon: <DeliveryIcon /> },
    { title: 'In Progress', path: '/delivery/in-progress', icon: <DeliveryIcon /> },
    { title: 'Completed', path: '/delivery/completed', icon: <CompletedIcon /> },
    { title: 'History', path: '/delivery/history', icon: <HistoryIcon /> },
    { title: 'Profile', path: '/delivery/profile', icon: <ProfileIcon /> },
  ];

  switch (role) {
    case 'super_admin': case 'admin': return adminNav;
    case 'vendor': return vendorNav;
    case 'warehouse': case 'staff': return warehouseNav;
    case 'delivery_agent': return deliveryNav;
    default: return [];
  }
};

interface SidebarProps { open: boolean; collapsed: boolean; onClose?: () => void; variant?: 'permanent' | 'temporary'; }

const Sidebar: React.FC<SidebarProps> = ({ open, collapsed, onClose, variant = 'permanent' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const navItems = getNavItems(user?.role || null);
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const getRoleLabel = (role: UserRole | undefined) => {
    const labels: Record<UserRole, string> = {
      super_admin: 'Super Admin', admin: 'Administrator', staff: 'Staff', vendor: 'Vendor',
      customer: 'Customer', delivery_agent: 'Delivery Agent', warehouse: 'Warehouse',
    };
    return role ? labels[role] : '';
  };

  return (
    <Drawer variant={variant} open={open} onClose={onClose} sx={{
      width: drawerWidth, flexShrink: 0,
      '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }) },
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 64, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>E</Typography>
          </Box>
          {!collapsed && <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 700 }}>ERP System</Typography>}
        </Box>
        {!collapsed && user && (
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>{user.first_name?.[0] || user.email[0].toUpperCase()}</Avatar>
              <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
                <Typography variant="subtitle2" noWrap>{user.first_name || user.email.split('@')[0]}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{getRoleLabel(user.role)}</Typography>
              </Box>
            </Box>
          </Box>
        )}
        <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
          <List component="nav">
            {navItems.map((item) => (
              <ListItem key={item.title} disablePadding sx={{ px: 1 }}>
                <ListItemButton onClick={() => { navigate(item.path); if (variant === 'temporary') onClose?.(); }} selected={isActive(item.path)}
                  sx={{ borderRadius: 2, mb: 0.5, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1 : 2, minHeight: 44,
                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.12), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } } }}>
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: isActive(item.path) ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
                  {!collapsed && <ListItemText primary={item.title} primaryTypographyProps={{ variant: 'body2', fontWeight: isActive(item.path) ? 600 : 400 }} />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
