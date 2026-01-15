import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  alpha,
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.requestOTP(email);
      setSuccess('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data = await authAPI.verifyOTP(email, otp);
      if (data.data) data = data.data;

      if (!data.access || !data.refresh) {
        throw new Error('Invalid response format from server');
      }

      login(data.access, data.refresh, data.user);
      setSuccess('Login successful! Redirecting...');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Animated background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(30px, 30px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(80px)',
          animation: 'float2 10s ease-in-out infinite',
          '@keyframes float2': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-40px, -40px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '20%',
          width: '25%',
          height: '25%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(50px)',
          animation: 'float3 12s ease-in-out infinite',
          '@keyframes float3': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(20px, -30px) scale(1.1)' },
          },
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 4, sm: 6 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Logo and Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05) rotate(5deg)',
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '2rem',
                  color: 'white',
                }}
              >
                E
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {step === 'email'
                ? 'Sign in to your ERP dashboard'
                : 'Enter the OTP sent to your email'}
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                animation: 'shake 0.5s ease-in-out',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-5px)' },
                  '75%': { transform: 'translateX(5px)' },
                },
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {success}
            </Alert>
          )}

          {/* Step indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#6366f1',
                transition: 'all 0.3s ease-in-out',
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: step === 'otp' ? '#6366f1' : alpha('#6366f1', 0.2),
                transition: 'all 0.3s ease-in-out',
              }}
            />
          </Box>

          {step === 'email' ? (
            <Box component="form" onSubmit={handleRequestOTP}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#6366f1' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha('#6366f1', 0.02),
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !email}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                  },
                  '&:disabled': {
                    background: alpha('#6366f1', 0.5),
                    color: 'white',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Send OTP'
                )}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerifyOTP}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Enter OTP"
                name="otp"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type={showOtp ? 'text' : 'password'}
                inputProps={{
                  maxLength: 6,
                  style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6366f1' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOtp(!showOtp)}
                        edge="end"
                        sx={{ color: '#64748b' }}
                      >
                        {showOtp ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha('#6366f1', 0.02),
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !otp}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{
                  py: 1.5,
                  mb: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                  },
                  '&:disabled': {
                    background: alpha('#6366f1', 0.5),
                    color: 'white',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Verify & Login'
                )}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                sx={{
                  py: 1.5,
                  borderWidth: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: alpha('#6366f1', 0.05),
                  },
                }}
              >
                Back
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Footer info */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              Secure OTP-based authentication
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 3,
                mt: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  256-bit Encryption
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Secure Login
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Bottom branding */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 4,
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 500,
          }}
        >
          ERP System by MultivendorEcom
        </Typography>
      </Container>
    </Box>
  );
}
