import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { requestOTP, verifyOTP, clearError, clearOTPState, selectAuthLoading, selectAuthError, selectOTPState, selectIsAuthenticated, selectUserRole } from '../../store/slices/authSlice';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const { sent: otpSent, email: otpEmail } = useAppSelector(selectOTPState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const paths: Record<string, string> = {
        super_admin: '/admin/dashboard', admin: '/admin/dashboard', vendor: '/vendor/dashboard',
        warehouse: '/warehouse/dashboard', staff: '/warehouse/dashboard', delivery_agent: '/delivery/dashboard',
      };
      navigate(paths[userRole] || '/', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(requestOTP(email));
    if (requestOTP.fulfilled.match(result)) setCountdown(60);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (otpEmail) await dispatch(verifyOTP({ email: otpEmail, otp }));
  };

  const handleBackToEmail = () => { dispatch(clearOTPState()); dispatch(clearError()); setOtp(''); };

  const handleResendOTP = async () => {
    if (countdown === 0 && otpEmail) {
      dispatch(clearError());
      const result = await dispatch(requestOTP(otpEmail));
      if (requestOTP.fulfilled.match(result)) setCountdown(60);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{otpSent ? 'Enter OTP' : 'Welcome Back'}</Typography>
        <Typography variant="body1" color="text.secondary">
          {otpSent ? `We've sent a 6-digit code to ${otpEmail}` : 'Sign in to your account using your email'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      {!otpSent ? (
        <Box component="form" onSubmit={handleRequestOTP}>
          <TextField fullWidth label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }} sx={{ mb: 3 }} />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading || !email} sx={{ py: 1.5 }}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifyOTP}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToEmail} sx={{ mb: 2 }}>Change email</Button>
          <TextField fullWidth label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus
            inputProps={{ maxLength: 6, style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 } }} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {countdown > 0 ? (
              <Typography variant="body2" color="text.secondary">Resend OTP in {countdown}s</Typography>
            ) : (
              <Button variant="text" onClick={handleResendOTP} disabled={isLoading}>Resend OTP</Button>
            )}
          </Box>
          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading || otp.length !== 6} sx={{ py: 1.5 }}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Sign In'}
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">By continuing, you agree to our Terms of Service and Privacy Policy</Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
