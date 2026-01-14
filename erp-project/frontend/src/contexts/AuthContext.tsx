import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi, tokenManager } from '../api';

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

const getStoredAuth = () => {
  const user = tokenManager.getUser();
  const access = tokenManager.getAccessToken();

  if (user && access) {
    return {
      isAuthenticated: true,
      user,
      isLoading: false,
    };
  }

  return {
    isAuthenticated: false,
    user: null,
    isLoading: false,
  };
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: authApi.getStoredUser(),
    isAuthenticated: authApi.isAuthenticated(),
    isLoading: true, // ✅ Start with loading true
    error: null,
    otpSent: false,
    otpEmail: null,
  });

  // ✅ Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          await fetchCurrentUser();
        }
      } catch {
        // Not authenticated
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);


  useEffect(() => {
  const handler = () => logout();
  window.addEventListener("auth-logout", handler);
  return () => window.removeEventListener("auth-logout", handler);
}, []);


  const requestOTP = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.requestOTP({ email });
      setState(prev => ({
        ...prev,
        isLoading: false,
        otpSent: true,
        otpEmail: email,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to send OTP',
      }));
      throw error;
    }
  };

const verifyOTP = async (email: string, otp: string) => {
  setState(prev => ({ ...prev, isLoading: true, error: null }));

  try {
    const response = await authApi.verifyOTP({ email, otp });
console.log(response,"response_-")
    if ( !response?.user) {
      throw new Error("Invalid login response");
    }

    const { user } = response;

    setState(prev => ({
      ...prev,
      isLoading: false,
      isAuthenticated: true,
      user,
      otpSent: false,
      otpEmail: null,
    }));
  } catch (error: any) {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: error.message || 'Invalid OTP',
    }));
    throw error;
  }
};


  const fetchCurrentUser = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // ✅ getCurrentUser returns {data: user} - api.get unwraps it
      const user = await authApi.getCurrentUser();
      setState((prev:any) => ({
        ...prev,
        isLoading: false,
        user,
        isAuthenticated: true,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSent: false,
      otpEmail: null,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearOTPState = () => {
    setState(prev => ({ ...prev, otpSent: false, otpEmail: null }));
  };

  const setUser = (user: User) => {
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  };

  // ✅ Computed derived state - updates when user changes
  const userRole: UserRole | null = state.user?.role || null;

  const value: AuthContextValue = {
    ...state,
    userRole, // ✅ This will trigger re-renders when user changes
    requestOTP,
    verifyOTP,
    fetchCurrentUser,
    logout,
    clearError,
    clearOTPState,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
