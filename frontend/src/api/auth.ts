import { api, tokenManager } from './client';
import type { User, OTPRequest, OTPVerify } from '../types';

// Response types for auth endpoints
interface OTPRequestResponse {
  otp_valid_for: number;
}

interface VerifyOTPResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authApi = {
  // Request OTP for login
  requestOTP: (data: OTPRequest): Promise<OTPRequestResponse> =>
    api.post<OTPRequestResponse>('/auth/request-otp/', data),

  // Verify OTP and get tokens
  verifyOTP: async (data: OTPVerify): Promise<{ user: User }> => {
    const response = await api.post<VerifyOTPResponse>('/auth/verify-otp/', data);
    // response is already flattened: { access, refresh, user }
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.setUser(response.user);
    }
    return { user: response.user };
  },

  // Refresh access token
  refreshToken: (): Promise<{ access: string }> =>
    api.post<{ access: string }>('/auth/refresh/', {
      refresh: tokenManager.getRefreshToken(),
    }),

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/', {
        refresh: tokenManager.getRefreshToken(),
      });
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Get current user
  getCurrentUser: (): Promise<User> => api.get<User>('/users/me/'),

  // Update current user
  updateCurrentUser: (data: Partial<User>): Promise<User> =>
    api.patch<User>('/users/me/', data),

  // Check if user is authenticated (has token in storage)
  isAuthenticated: (): boolean => tokenManager.isAuthenticated(),

  // Get stored user from localStorage
  getStoredUser: (): User | null => tokenManager.getUser(),
};

export default authApi;
