import { api } from './client';
import { ApiResponse, PaginatedResponse, User, UserRole } from '../../types';

export interface UsersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  role?: UserRole;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserFormData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  is_active?: boolean;
}

export const usersApi = {
  // List users with pagination
  list: async (params?: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get<{ data: PaginatedResponse<User> } | PaginatedResponse<User>>('/users/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single user
  get: async (id: number): Promise<ApiResponse<User>> => {
    return api.get<ApiResponse<User>>(`/users/${id}/`);
  },

  // Get current user
  me: async (): Promise<ApiResponse<User>> => {
    return api.get<ApiResponse<User>>('/users/me/');
  },

  // Update current user
  updateMe: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return api.patch<ApiResponse<User>>('/users/me/', data);
  },

  // Create user
  create: async (data: UserFormData): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>('/users/', data);
  },

  // Update user
  update: async (id: number, data: Partial<UserFormData>): Promise<ApiResponse<User>> => {
    return api.patch<ApiResponse<User>>(`/users/${id}/`, data);
  },

  // Delete user
  delete: async (id: number): Promise<void> => {
    return api.delete(`/users/${id}/`);
  },

  // Change user role
  changeRole: async (id: number, role: UserRole): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>(`/users/${id}/change_role/`, { role });
  },

  // Activate user
  activate: async (id: number): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>(`/users/${id}/activate/`);
  },

  // Deactivate user
  deactivate: async (id: number): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>(`/users/${id}/deactivate/`);
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload<ApiResponse<User>>('/users/me/avatar/', formData);
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<{
    user: User;
    preferences: Record<string, unknown>;
  }>> => {
    return api.get('/users/me/profile/');
  },

  // Update user profile
  updateProfile: async (data: Record<string, unknown>): Promise<ApiResponse<{
    user: User;
    preferences: Record<string, unknown>;
  }>> => {
    return api.patch('/users/me/profile/', data);
  },
};

export default usersApi;
