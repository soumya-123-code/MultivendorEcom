import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Email, ArrowForward, ArrowBack, Pin } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { requestOtp, verifyOtp, clearError } from '../../store/slices/authSlice';

type Step = 'email' | 'otp';

interface EmailForm {
  email: string;
}

interface OtpForm {
  otp: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const emailForm = useForm<EmailForm>({ defaultValues: { email: '' } });
  const otpForm = useForm<OtpForm>({ defaultValues: { otp: '' } });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (data: EmailForm) => {
    dispatch(clearError());
    const result = await dispatch(requestOtp(data.email));
    if (requestOtp.fulfilled.match(result)) {
      setEmail(data.email);
      setStep('otp');
      setCountdown(300); // 5 minutes
    }
  };

  const handleOtpSubmit = async (data: OtpForm) => {
    dispatch(clearError());
    await dispatch(verifyOtp({ email, otp: data.otp }));
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    dispatch(clearError());
    const result = await dispatch(requestOtp(email));
    if (requestOtp.fulfilled.match(result)) {
      setCountdown(300);
      otpForm.reset();
    }
  };

  const handleBack = () => {
    setStep('email');
    dispatch(clearError());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 440,
            width: '100%',
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: 'white',
                  fontSize: '1.75rem',
                  mb: 2,
                }}
              >
                E
              </Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {step === 'email'
                  ? 'Enter your email to receive a login code'
                  : `Enter the code sent to ${email}`}
              </Typography>
            </Box>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      {...emailForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Invalid email address',
                        },
                      })}
                      error={!!emailForm.formState.errors.email}
                      helperText={emailForm.formState.errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      size="large"
                      disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
                      sx={{ py: 1.5 }}
                    >
                      {isLoading ? 'Sending...' : 'Continue'}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
                    <TextField
                      fullWidth
                      label="Verification Code"
                      {...otpForm.register('otp', {
                        required: 'OTP is required',
                        minLength: { value: 6, message: 'OTP must be 6 digits' },
                        maxLength: { value: 6, message: 'OTP must be 6 digits' },
                      })}
                      error={!!otpForm.formState.errors.otp}
                      helperText={otpForm.formState.errors.otp?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Pin sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        maxLength: 6,
                        style: { letterSpacing: '0.5em', fontWeight: 600 },
                      }}
                      sx={{ mb: 2 }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{ color: 'text.secondary' }}
                      >
                        Change email
                      </Button>
                      <Button
                        size="small"
                        onClick={handleResendOtp}
                        disabled={countdown > 0 || isLoading}
                        sx={{ color: countdown > 0 ? 'text.secondary' : 'primary.main' }}
                      >
                        {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend code'}
                      </Button>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      size="large"
                      disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
                      sx={{ py: 1.5 }}
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Login'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Secure OTP Login
              </Typography>
            </Divider>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center' }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
