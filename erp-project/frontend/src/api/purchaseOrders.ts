import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseOrderFormData,
  POStatus,
} from '@/types';

interface POFilters {
  status?: POStatus;
  supplier?: number;
  warehouse?: number;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const purchaseOrdersApi = {
  // List purchase orders
  list: (params?: POFilters) =>
    api.get<PaginatedResponse<PurchaseOrder>>(
      '/purchase-orders/',
      params as Record<string, unknown>
    ),

  // Get purchase order by ID
  getById: (id: number) => api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/`),

  // Create purchase order
  create: (data: PurchaseOrderFormData) =>
    api.post<ApiResponse<PurchaseOrder>>('/purchase-orders/', data),

  // Update purchase order
  update: (id: number, data: Partial<PurchaseOrderFormData>) =>
    api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/`, data),

  // Delete purchase order
  delete: (id: number) => api.delete<ApiResponse<null>>(`/purchase-orders/${id}/`),

  // Submit for approval
  submitForApproval: (id: number) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/submit/`),

  // Approve purchase order (Admin only)
  approve: (id: number) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve/`),

  // Reject purchase order (Admin only)
  reject: (id: number, reason: string) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/reject/`, { reason }),

  // Send to supplier
  send: (id: number) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/send/`),

  // Mark as confirmed
  confirm: (id: number) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/confirm/`),

  // Receive items
  receive: (
    id: number,
    items: Array<{ item_id: number; quantity_received: number; notes?: string }>
  ) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive/`, { items }),

  // Complete purchase order
  complete: (id: number) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/complete/`),

  // Cancel purchase order
  cancel: (id: number, reason: string) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel/`, { reason }),

  // Get status logs
  getStatusLogs: (id: number) =>
    api.get<ApiResponse<unknown[]>>(`/purchase-orders/${id}/status-logs/`),

  // Add item to purchase order
  addItem: (poId: number, data: { product: number; quantity_ordered: number; unit_price: number }) =>
    api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${poId}/items/`, data),

  // Update item
  updateItem: (poId: number, itemId: number, data: Partial<{ quantity_ordered: number; unit_price: number }>) =>
    api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${poId}/items/${itemId}/`, data),

  // Remove item
  removeItem: (poId: number, itemId: number) =>
    api.delete<ApiResponse<null>>(`/purchase-orders/${poId}/items/${itemId}/`),
};

export default purchaseOrdersApi;
