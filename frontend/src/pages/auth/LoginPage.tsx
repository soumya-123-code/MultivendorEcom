import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts';

const ROLE_PATHS: Record<string, string> = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  vendor: '/vendor/dashboard',
  warehouse: '/warehouse/dashboard',
  staff: '/warehouse/dashboard',
  delivery_agent: '/delivery/dashboard',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestOTP, verifyOTP, clearError, clearOTPState, isLoading, error, otpSent, otpEmail, isAuthenticated, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const hasRedirected = useRef(false);

  // Redirect on successful auth - only once
  useEffect(() => {
    if (isAuthenticated && userRole && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate(ROLE_PATHS[userRole] || '/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await requestOTP(email);
      setCountdown(60);
    } catch {
      // Error handled by context
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!otpEmail) return;
    try {
      await verifyOTP(otpEmail, otp);
    } catch {
      // Error handled by context
    }
  };

  const handleBackToEmail = () => {
    clearOTPState();
    clearError();
    setOtp('');
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || !otpEmail) return;
    clearError();
    try {
      await requestOTP(otpEmail);
      setCountdown(60);
    } catch {
      // Error handled by context
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {otpSent ? 'Enter OTP' : 'Welcome Back'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {otpSent ? `We've sent a 6-digit code to ${otpEmail}` : 'Sign in to your account using your email'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {!otpSent ? (
        <Box component="form" onSubmit={handleRequestOTP}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || !email}
            sx={{ py: 1.5 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifyOTP}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToEmail} sx={{ mb: 2 }}>
            Change email
          </Button>
          <TextField
            fullWidth
            label="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
            inputProps={{
              maxLength: 6,
              style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 },
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {countdown > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Resend OTP in {countdown}s
              </Typography>
            ) : (
              <Button variant="text" onClick={handleResendOTP} disabled={isLoading}>
                Resend OTP
              </Button>
            )}
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || otp.length !== 6}
            sx={{ py: 1.5 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Sign In'}
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
