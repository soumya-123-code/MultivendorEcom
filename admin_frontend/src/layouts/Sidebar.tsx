import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  ShoppingCart as OrdersIcon,
  Store as VendorsIcon,
  People as CustomersIcon,
  Warehouse as WarehouseIcon,
  Receipt as PurchaseIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  LocalShipping as DeliveryIcon,
  PersonOutline as UsersIcon,
  TrendingUp as AnalyticsIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks';
import { toggleNavExpanded, setActiveNav } from '../store/slices/uiSlice';

interface NavItem {
  id: string;
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'products',
    title: 'Products',
    icon: <InventoryIcon />,
    children: [
      { id: 'products-list', title: 'All Products', path: '/products', icon: <></> },
      { id: 'products-add', title: 'Add Product', path: '/products/new', icon: <></> },
      { id: 'categories', title: 'Categories', path: '/categories', icon: <></> },
    ],
  },
  {
    id: 'orders',
    title: 'Sales Orders',
    icon: <OrdersIcon />,
    children: [
      { id: 'orders-list', title: 'All Orders', path: '/orders', icon: <></> },
      { id: 'orders-pending', title: 'Pending', path: '/orders?status=pending', icon: <></> },
      { id: 'orders-processing', title: 'Processing', path: '/orders?status=processing', icon: <></> },
    ],
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    icon: <PurchaseIcon />,
    children: [
      { id: 'po-list', title: 'All POs', path: '/purchase-orders', icon: <></> },
      { id: 'po-create', title: 'Create PO', path: '/purchase-orders/new', icon: <></> },
      { id: 'suppliers', title: 'Suppliers', path: '/suppliers', icon: <></> },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <WarehouseIcon />,
    children: [
      { id: 'inventory-list', title: 'Stock Overview', path: '/inventory', icon: <></> },
      { id: 'warehouses', title: 'Warehouses', path: '/warehouses', icon: <></> },
      { id: 'low-stock', title: 'Low Stock Alerts', path: '/inventory?filter=low_stock', icon: <></> },
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    path: '/vendors',
    icon: <VendorsIcon />,
  },
  {
    id: 'customers',
    title: 'Customers',
    path: '/customers',
    icon: <CustomersIcon />,
  },
  {
    id: 'delivery',
    title: 'Delivery',
    path: '/delivery',
    icon: <DeliveryIcon />,
  },
  {
    id: 'users',
    title: 'Users',
    path: '/users',
    icon: <UsersIcon />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <AnalyticsIcon />,
    children: [
      { id: 'reports', title: 'Reports', path: '/reports', icon: <></> },
      { id: 'sales-analytics', title: 'Sales Analytics', path: '/analytics/sales', icon: <></> },
      { id: 'product-analytics', title: 'Product Analytics', path: '/analytics/products', icon: <></> },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { expandedNavs, activeNav } = useAppSelector((state) => state.ui);

  const isActive = (item: NavItem): boolean => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
    if (item.children) {
      return item.children.some((child) => isActive(child));
    }
    return false;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      dispatch(toggleNavExpanded(item.id));
    } else if (item.path) {
      dispatch(setActiveNav(item.id));
      navigate(item.path);
    }
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item);
    const expanded = expandedNavs.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const button = (
      <ListItemButton
        onClick={() => handleNavClick(item)}
        selected={active && !hasChildren}
        sx={{
          minHeight: 48,
          borderRadius: 2,
          mx: collapsed ? 0.5 : 1,
          my: 0.25,
          pl: collapsed ? 2 : depth > 0 ? 4 : 2,
          pr: 2,
          position: 'relative',
          '&.Mui-selected': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
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
              bgcolor: 'primary.main',
            },
          },
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {depth === 0 && (
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 0 : 40,
              color: active ? 'primary.main' : 'text.secondary',
              mr: collapsed ? 0 : 1,
            }}
          >
            {item.icon}
          </ListItemIcon>
        )}
        {!collapsed && (
          <>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: depth > 0 ? '0.875rem' : '0.9rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'primary.main' : 'text.primary',
              }}
            />
            {hasChildren && (
              <Box sx={{ color: 'text.secondary' }}>
                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </Box>
            )}
          </>
        )}
      </ListItemButton>
    );

    return (
      <React.Fragment key={item.id}>
        {collapsed && depth === 0 ? (
          <Tooltip title={item.title} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
        {hasChildren && !collapsed && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
          minHeight: 64,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '1.2rem',
          }}
        >
          E
        </Box>
        {!collapsed && (
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              ERP Commerce
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Dashboard
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List component="nav" disablePadding>
          {navItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* Bottom Section */}
      {!collapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Need help?
            </Typography>
            <Typography
              variant="body2"
              color="primary.main"
              fontWeight={600}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              View Documentation
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
