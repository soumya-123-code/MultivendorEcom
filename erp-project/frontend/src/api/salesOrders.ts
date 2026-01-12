import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  SalesOrder,
  OrderFilters,
  SOStatus,
} from '@/types';

export const salesOrdersApi = {
  // List sales orders
  list: (params?: OrderFilters) =>
    api.get<PaginatedResponse<SalesOrder>>(
      '/sales-orders/',
      params as Record<string, unknown>
    ),

  // Get sales order by ID
  getById: (id: number) => api.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}/`),

  // Create sales order (Admin)
  create: (data: Partial<SalesOrder>) =>
    api.post<ApiResponse<SalesOrder>>('/sales-orders/', data),

  // Update sales order
  update: (id: number, data: Partial<SalesOrder>) =>
    api.patch<ApiResponse<SalesOrder>>(`/sales-orders/${id}/`, data),

  // Confirm order
  confirm: (id: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/confirm/`),

  // Start processing
  process: (id: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/process/`),

  // Mark as packed
  pack: (id: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/pack/`),

  // Mark ready for pickup
  readyForPickup: (id: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/ready-for-pickup/`),

  // Cancel order
  cancel: (id: number, reason: string) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel/`, { reason }),

  // Get status logs
  getStatusLogs: (id: number) =>
    api.get<ApiResponse<unknown[]>>(`/sales-orders/${id}/status-logs/`),

  // Update status
  updateStatus: (id: number, status: SOStatus, notes?: string) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/update-status/`, {
      status,
      notes,
    }),

  // Process return request
  approveReturn: (id: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/approve-return/`),

  rejectReturn: (id: number, reason: string) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/reject-return/`, { reason }),

  // Assign delivery agent
  assignDelivery: (id: number, agentId: number) =>
    api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/assign-delivery/`, {
      agent_id: agentId,
    }),
};

export default salesOrdersApi;
