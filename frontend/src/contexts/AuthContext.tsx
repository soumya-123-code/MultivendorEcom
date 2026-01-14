import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api';

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
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearOTPState: () => void;
  setUser: (user: User) => void;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading to check stored session
    error: null,
    otpSent: false,
    otpEmail: null,
  });

  // Validate session on initial load
  useEffect(() => {
    const validateSession = async () => {
      // Check if we have a stored token
      if (!authApi.isAuthenticated()) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Try to get stored user first for faster initial render
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        setState(prev => ({
          ...prev,
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        }));
      }

      // Validate token by fetching current user from server
      try {
        const user = await authApi.getCurrentUser();
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
        }));
      } catch {
        // Token is invalid - clear and redirect will happen via ProtectedRoute
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
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
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
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
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const user = await authApi.getCurrentUser();
      setState(prev => ({
        ...prev,
        isLoading: false,
        user,
        isAuthenticated: true,
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors, clear state anyway
    }
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSent: false,
      otpEmail: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearOTPState = useCallback(() => {
    setState(prev => ({ ...prev, otpSent: false, otpEmail: null }));
  }, []);

  const setUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  }, []);

  const userRole: UserRole | null = state.user?.role || null;

  const value: AuthContextValue = {
    ...state,
    requestOTP,
    verifyOTP,
    fetchCurrentUser,
    logout,
    clearError,
    clearOTPState,
    setUser,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
