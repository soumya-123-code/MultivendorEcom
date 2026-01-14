import { api } from './client';
import type { ApiResponse, PaginatedResponse, Notification } from '@/types';

export const notificationsApi = {
  // List notifications
  list: (params?: { is_read?: boolean; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Notification>>(
      '/notifications/',
      params as Record<string, unknown>
    ),

  // Get unread count
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count/'),

  // Mark notification as read
  markAsRead: (id: number) =>
    api.post<ApiResponse<Notification>>(`/notifications/${id}/read/`),

  // Mark all as read
  markAllAsRead: () => api.post<ApiResponse<null>>('/notifications/read-all/'),

  // Delete notification
  delete: (id: number) => api.delete<ApiResponse<null>>(`/notifications/${id}/`),

  // Clear all notifications
  clearAll: () => api.delete<ApiResponse<null>>('/notifications/clear-all/'),
};

export default notificationsApi;
