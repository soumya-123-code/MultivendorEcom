import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Category as CategoryIcon,
  Warehouse as WarehouseIcon,
  Assignment as AssignmentIcon,
  DeliveryDining as DeliveryDiningIcon,
} from '@mui/icons-material';
import { notificationAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Get unread notifications count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const data = await notificationAPI.getCount();
        setUnreadCount(data.unread_count || 0);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses' },
    { text: 'Inventory', icon: <AssignmentIcon />, path: '/inventory' },
    { text: 'Sales Orders', icon: <ShoppingCartIcon />, path: '/sales-orders' },
    { text: 'Purchase Orders', icon: <LocalShippingIcon />, path: '/purchase-orders' },
    { text: 'Delivery Agents', icon: <DeliveryDiningIcon />, path: '/delivery-agents' },
    { text: 'Deliveries', icon: <LocalShippingIcon />, path: '/deliveries' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Vendors', icon: <StoreIcon />, path: '/vendors' },
    { text: 'Suppliers', icon: <StoreIcon />, path: '/suppliers' },
    { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ERP System {user && `- ${user.email}`}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { sm: open ? 0 : `-${drawerWidth}px` },
          transition: 'margin 0.3s',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
