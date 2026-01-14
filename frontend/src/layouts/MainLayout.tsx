import React, { useMemo } from 'react';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  const handleSidebarClose = () => setSidebarOpen(false);

  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      toggleSidebarCollapsed();
    }
  };

  // Memoize drawer width to prevent recalculation
  const drawerWidth = useMemo(() => {
    if (isMobile) return 0;
    return sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  }, [isMobile, sidebarCollapsed]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuToggle={handleMenuToggle} />
      <Sidebar
        open={isMobile ? sidebarOpen : true}
        collapsed={isMobile ? false : sidebarCollapsed}
        onClose={handleSidebarClose}
        variant={isMobile ? 'temporary' : 'permanent'}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: '64px',
          ml: `${drawerWidth}px`,
          transition: 'margin-left 200ms ease-in-out',
        }}
      >
        <Box sx={{ p: 3, minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
