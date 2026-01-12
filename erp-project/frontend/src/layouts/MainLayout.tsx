import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUI } from '../contexts';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } = useUI();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleMenuToggle = () => {
    if (isMobile) setSidebarOpen(!sidebarOpen);
    else toggleSidebarCollapsed();
  };

  const drawerWidth = isMobile ? DRAWER_WIDTH : (sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuToggle={handleMenuToggle} />
      <Sidebar open={isMobile ? sidebarOpen : true} collapsed={isMobile ? false : sidebarCollapsed} onClose={handleSidebarClose} variant={isMobile ? 'temporary' : 'permanent'} />
      <Box component="main" sx={{
        flexGrow: 1, minHeight: '100vh', pt: '64px', pl: isMobile ? 0 : `${drawerWidth}px`,
        transition: theme.transitions.create(['padding-left'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }),
      }}>
        <Box sx={{ p: 3, minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default' }}><Outlet /></Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
