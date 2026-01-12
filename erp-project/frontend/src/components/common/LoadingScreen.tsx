import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps { message?: string; fullScreen?: boolean; }

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...', fullScreen = true }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: fullScreen ? '100vh' : '400px', gap: 2 }}>
    <CircularProgress size={48} thickness={4} />
    <Typography variant="body1" color="text.secondary">{message}</Typography>
  </Box>
);

export default LoadingScreen;
