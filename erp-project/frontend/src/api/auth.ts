import { api, tokenManager } from './client';
import type { ApiResponse, LoginResponse, User, OTPRequest, OTPVerify } from '@/types';

export const authApi = {
  // Request OTP for login
  requestOTP: (data: OTPRequest) =>
    api.post<ApiResponse<{ otp_valid_for: number }>>('/auth/request-otp/', data),

  // Verify OTP and get tokens
verifyOTP: async (data: OTPVerify) => {
  const response = await api.post<LoginResponse>('/auth/verify-otp/', data);

  if (response.success && response.data) {
    tokenManager.setTokens(response.data.access, response.data.refresh);
    tokenManager.setUser(response.data.user);
  }

  return response;
}
,

  // Refresh access token
  refreshToken: () =>
    api.post<ApiResponse<{ access: string }>>('/auth/refresh/', {
      refresh: tokenManager.getRefreshToken(),
    }),

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout/', {
        refresh: tokenManager.getRefreshToken(),
      });
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Get current user
  getCurrentUser: () => api.get<ApiResponse<User>>('/users/me/'),

  // Update current user
  updateCurrentUser: (data: Partial<User>) =>
    api.patch<ApiResponse<User>>('/users/me/', data),

  // Check if user is authenticated
  isAuthenticated: () => tokenManager.isAuthenticated(),

  // Get stored user
  getStoredUser: () => tokenManager.getUser(),

  
};

export default authApi;
