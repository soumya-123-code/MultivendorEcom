import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api';
import { AUTH_EVENTS } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otpEmail: string | null;
}

interface AuthContextValue extends AuthState {
  requestOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  clearOTPState: () => void;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  otpSent: false,
  otpEmail: null,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Handle session expiry from API client
  useEffect(() => {
    const handleSessionExpired = () => {
      setState({
        ...initialState,
        isLoading: false,
      });
    };

    window.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    return () => window.removeEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
  }, []);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!authApi.isAuthenticated()) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const storedUser = authApi.getStoredUser();

      if (storedUser) {
        setState(prev => ({
          ...prev,
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        }));

        // Background refresh (silent fail)
        try {
          const freshUser = await authApi.getCurrentUser();
          setState(prev => ({ ...prev, user: freshUser }));
        } catch {
          // Keep using stored user
        }
      } else {
        try {
          const user = await authApi.getCurrentUser();
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } catch {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      }
    };

    validateSession();
  }, []);

  const requestOTP = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.requestOTP({ email });
      setState(prev => ({
        ...prev,
        isLoading: false,
        otpSent: true,
        otpEmail: email,
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      }));
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user } = await authApi.verifyOTP({ email, otp });
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        user,
        otpSent: false,
        otpEmail: null,
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Invalid OTP',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setState({ ...initialState, isLoading: false });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearOTPState = useCallback(() => {
    setState(prev => ({ ...prev, otpSent: false, otpEmail: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    requestOTP,
    verifyOTP,
    logout,
    clearError,
    clearOTPState,
    userRole: state.user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
