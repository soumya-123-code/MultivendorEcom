import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Typography, useTheme } from '@mui/material';

const AuthLayout: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', p: 4,
      }}>
        <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>E</Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Multi-Vendor ERP</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>Streamline your business operations</Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            <Box><Typography variant="h4" sx={{ fontWeight: 700 }}>500+</Typography><Typography variant="body2" sx={{ opacity: 0.8 }}>Vendors</Typography></Box>
            <Box><Typography variant="h4" sx={{ fontWeight: 700 }}>10K+</Typography><Typography variant="body2" sx={{ opacity: 0.8 }}>Products</Typography></Box>
            <Box><Typography variant="h4" sx={{ fontWeight: 700 }}>50K+</Typography><Typography variant="body2" sx={{ opacity: 0.8 }}>Orders</Typography></Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <Container maxWidth="sm"><Outlet /></Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;
