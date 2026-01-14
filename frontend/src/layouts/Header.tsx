import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Box, Menu, MenuItem, Avatar, Badge, Tooltip, Divider, ListItemIcon, Typography, useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon, MenuOpen as MenuOpenIcon, Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon, LightMode as LightModeIcon, Person as PersonIcon,
  Settings as SettingsIcon, Logout as LogoutIcon, Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth, useUI } from '../contexts';

interface HeaderProps { onMenuToggle?: () => void; }

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, sidebarCollapsed, toggleDarkMode, toggleSidebarCollapsed } = useUI();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/auth/login');
  };

  const handleToggleDarkMode = () => toggleDarkMode();
  const handleToggleSidebar = () => onMenuToggle ? onMenuToggle() : toggleSidebarCollapsed();

  const getProfilePath = () => {
    switch (user?.role) {
      case 'vendor': return '/vendor/profile';
      case 'delivery_agent': return '/delivery/profile';
      default: return '/admin/profile';
    }
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Toolbar>
        <IconButton edge="start" onClick={handleToggleSidebar} sx={{ mr: 2, color: 'text.primary' }}>
          {sidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Search"><IconButton sx={{ color: 'text.secondary' }}><SearchIcon /></IconButton></Tooltip>
        <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
          <IconButton onClick={handleToggleDarkMode} sx={{ color: 'text.secondary' }}>{darkMode ? <LightModeIcon /> : <DarkModeIcon />}</IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <IconButton onClick={(e) => setNotifAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={3} color="error"><NotificationsIcon /></Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }} src={user?.avatar?.url}>
              {user?.first_name?.[0] || user?.email[0].toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { width: 220, mt: 1 } }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" noWrap>{user?.first_name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate(getProfilePath()); }}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Profile</MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
        </Menu>
        <Menu anchorEl={notifAnchorEl} open={Boolean(notifAnchorEl)} onClose={() => setNotifAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { width: 320, maxHeight: 400, mt: 1 } }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>Mark all read</Typography>
          </Box>
          <Divider />
          <MenuItem><Box><Typography variant="body2">New order received</Typography><Typography variant="caption" color="text.secondary">2 minutes ago</Typography></Box></MenuItem>
          <MenuItem><Box><Typography variant="body2">Low stock alert: Product XYZ</Typography><Typography variant="caption" color="text.secondary">1 hour ago</Typography></Box></MenuItem>
          <Divider />
          <MenuItem sx={{ justifyContent: 'center' }}><Typography variant="body2" color="primary">View All Notifications</Typography></MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
