import { api, tokenManager } from './client';
import { ApiResponse, LoginResponse, User } from '../../types';

export interface RequestOtpPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  data: {
    otp_valid_for: number;
  };
}

export const authApi = {
  // Request OTP
  requestOtp: async (payload: RequestOtpPayload): Promise<RequestOtpResponse> => {
    return api.post<RequestOtpResponse>('/auth/request-otp/', payload);
  },

  // Verify OTP and get tokens
  verifyOtp: async (payload: VerifyOtpPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/verify-otp/', payload);
    if (response.success && response.data) {
      tokenManager.setTokens(response.data.access, response.data.refresh);
    }
    return response;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    return api.post<{ access: string }>('/auth/refresh/', { refresh: refreshToken });
  },

  // Logout
  logout: async (): Promise<void> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Ignore logout errors
      }
    }
    tokenManager.clearTokens();
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return api.get<ApiResponse<User>>('/users/me/');
  },

  // Update current user
  updateCurrentUser: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return api.patch<ApiResponse<User>>('/users/me/', data);
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return tokenManager.isAuthenticated();
  },
};

export default authApi;
