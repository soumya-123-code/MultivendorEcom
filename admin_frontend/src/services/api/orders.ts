import { api } from './client';
import { ApiResponse, PaginatedResponse, SalesOrder, SalesOrderStatus } from '../../types';

export interface OrdersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: SalesOrderStatus;
  payment_status?: string;
  customer?: number;
  date_from?: string;
  date_to?: string;
}

export const ordersApi = {
  // List orders with pagination
  list: async (params?: OrdersQueryParams): Promise<PaginatedResponse<SalesOrder>> => {
    const response = await api.get<{ data: PaginatedResponse<SalesOrder> } | PaginatedResponse<SalesOrder>>('/sales-orders/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single order
  get: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}/`);
  },

  // Get order by order number
  getByNumber: async (orderNumber: string): Promise<ApiResponse<SalesOrder>> => {
    return api.get<ApiResponse<SalesOrder>>(`/sales-orders/by-number/${orderNumber}/`);
  },

  // Update order status
  updateStatus: async (id: number, status: SalesOrderStatus, notes?: string): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/status/`, { status, notes });
  },

  // Confirm order
  confirm: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/confirm/`);
  },

  // Cancel order
  cancel: async (id: number, reason: string): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel/`, { reason });
  },

  // Process order (move to processing)
  process: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/process/`);
  },

  // Mark as packed
  pack: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/pack/`);
  },

  // Mark ready for pickup
  readyForPickup: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/ready-for-pickup/`);
  },

  // Dispatch order
  dispatch: async (id: number, trackingNumber?: string): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/dispatch/`, { tracking_number: trackingNumber });
  },

  // Mark as delivered
  deliver: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/deliver/`);
  },

  // Mark delivery failed
  deliveryFailed: async (id: number, reason: string): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/delivery-failed/`, { reason });
  },

  // Add internal note
  addNote: async (id: number, note: string): Promise<ApiResponse<SalesOrder>> => {
    return api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/notes/`, { internal_notes: note });
  },

  // Get order status history
  getStatusHistory: async (id: number): Promise<ApiResponse<Array<{
    old_status: string | null;
    new_status: string;
    notes: string | null;
    changed_by: number | null;
    created_at: string;
  }>>> => {
    return api.get(`/sales-orders/${id}/status-history/`);
  },

  // Print invoice
  printInvoice: async (id: number): Promise<Blob> => {
    const response = await fetch(`/api/v1/sales-orders/${id}/invoice/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.blob();
  },
};

export default ordersApi;
