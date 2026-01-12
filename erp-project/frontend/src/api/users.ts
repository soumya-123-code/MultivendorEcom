import { api } from './client';
import type { ApiResponse, PaginatedResponse, User, UserFilters, UserRole } from '@/types';

export const usersApi = {
  // List all users (Admin only)
  list: (params?: UserFilters) =>
    api.get<PaginatedResponse<User>>('/users/', params as Record<string, unknown>),

  // Get user by ID
  getById: (id: number) => api.get<ApiResponse<User>>(`/users/${id}/`),

  // Create user
  create: (data: Partial<User> & { email: string; role: UserRole }) =>
    api.post<ApiResponse<User>>('/users/', data),

  // Update user
  update: (id: number, data: Partial<User>) =>
    api.patch<ApiResponse<User>>(`/users/${id}/`, data),

  // Delete user
  delete: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}/`),

  // Change user role (SuperAdmin only)
  changeRole: (id: number, role: UserRole) =>
    api.post<ApiResponse<User>>(`/users/${id}/change_role/`, { role }),

  // Activate user
  activate: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/activate/`),

  // Deactivate user
  deactivate: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/deactivate/`),

  // Get current user profile
  getProfile: () => api.get<ApiResponse<User>>('/users/me/profile/'),

  // Update current user profile
  updateProfile: (data: Partial<User>) =>
    api.patch<ApiResponse<User>>('/users/me/profile/', data),
};

export default usersApi;
