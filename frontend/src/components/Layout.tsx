import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Avatar,
  Divider,
  Tooltip,
  alpha,
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
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { notificationAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
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
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', color: '#6366f1' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products', color: '#8b5cf6' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories', color: '#a855f7' },
    { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses', color: '#d946ef' },
    { text: 'Inventory', icon: <AssignmentIcon />, path: '/inventory', color: '#ec4899' },
    { text: 'Sales Orders', icon: <ShoppingCartIcon />, path: '/sales-orders', color: '#10b981' },
    { text: 'Purchase Orders', icon: <LocalShippingIcon />, path: '/purchase-orders', color: '#14b8a6' },
    { text: 'Delivery Agents', icon: <DeliveryDiningIcon />, path: '/delivery-agents', color: '#06b6d4' },
    { text: 'Deliveries', icon: <LocalShippingIcon />, path: '/deliveries', color: '#0ea5e9' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers', color: '#3b82f6' },
    { text: 'Vendors', icon: <StoreIcon />, path: '/vendors', color: '#6366f1' },
    { text: 'Suppliers', icon: <StoreIcon />, path: '/suppliers', color: '#8b5cf6' },
    { text: 'Payments', icon: <PaymentIcon />, path: '/payments', color: '#f59e0b' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Beautiful Gradient AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{
              mr: 2,
              backgroundColor: alpha('#ffffff', 0.1),
              '&:hover': {
                backgroundColor: alpha('#ffffff', 0.2),
              },
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          {/* Logo/Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                E
              </Typography>
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.5px',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              ERP System
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={() => navigate('/notifications')}
                sx={{
                  backgroundColor: alpha('#ffffff', 0.1),
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.2),
                  },
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                      fontWeight: 600,
                    },
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton
                color="inherit"
                onClick={() => navigate('/profile')}
                sx={{
                  backgroundColor: alpha('#ffffff', 0.1),
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.2),
                  },
                }}
              >
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                sx={{
                  backgroundColor: alpha('#ffffff', 0.1),
                  '&:hover': {
                    backgroundColor: alpha('#ef4444', 0.3),
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Beautiful Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            background: '#ffffff',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />

        {/* User Profile Section */}
        <Box
          sx={{
            p: open ? 2.5 : 1.5,
            mt: 1,
            mx: open ? 2 : 1,
            mb: 1,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexDirection: open ? 'row' : 'column',
            }}
          >
            <Avatar
              sx={{
                width: open ? 48 : 40,
                height: open ? 48 : 40,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontWeight: 600,
                fontSize: open ? '1.1rem' : '0.9rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              {getUserInitials()}
            </Avatar>
            {open && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'Welcome'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email || 'user@example.com'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ mx: 2, my: 1 }} />

        {/* Navigation Menu */}
        <Box sx={{ overflow: 'auto', flex: 1, py: 1 }}>
          <List sx={{ px: 1 }}>
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={!open ? item.text : ''} placement="right" arrow>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        borderRadius: 2.5,
                        mx: 0.5,
                        px: open ? 2 : 2.5,
                        justifyContent: open ? 'initial' : 'center',
                        backgroundColor: active
                          ? alpha(item.color, 0.1)
                          : 'transparent',
                        border: active
                          ? `1px solid ${alpha(item.color, 0.2)}`
                          : '1px solid transparent',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: alpha(item.color, 0.08),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: active ? item.color : '#64748b',
                          transition: 'color 0.2s ease-in-out',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: active ? 600 : 500,
                            fontSize: '0.9rem',
                            color: active ? item.color : '#475569',
                          }}
                        />
                      )}
                      {active && open && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            boxShadow: `0 0 8px ${item.color}`,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Tooltip title={!open ? 'Settings' : ''} placement="right" arrow>
            <ListItemButton
              onClick={() => navigate('/profile')}
              sx={{
                borderRadius: 2.5,
                px: open ? 2 : 2.5,
                justifyContent: open ? 'initial' : 'center',
                backgroundColor: alpha('#64748b', 0.05),
                '&:hover': {
                  backgroundColor: alpha('#64748b', 0.1),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Settings"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    color: '#64748b',
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)`,
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          transition: 'width 0.3s ease-in-out, margin 0.3s ease-in-out',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
