import { api } from './client';
import { ApiResponse, PaginatedResponse, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderFormData } from '../../types';

export interface PurchaseOrdersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: PurchaseOrderStatus;
  payment_status?: string;
  supplier?: number;
  warehouse?: number;
  date_from?: string;
  date_to?: string;
}

export const purchaseOrdersApi = {
  // List purchase orders with pagination
  list: async (params?: PurchaseOrdersQueryParams): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await api.get<{ data: PaginatedResponse<PurchaseOrder> } | PaginatedResponse<PurchaseOrder>>('/purchase-orders/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single purchase order
  get: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/`);
  },

  // Create purchase order
  create: async (data: PurchaseOrderFormData): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>('/purchase-orders/', data);
  },

  // Update purchase order
  update: async (id: number, data: Partial<PurchaseOrderFormData>): Promise<ApiResponse<PurchaseOrder>> => {
    return api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/`, data);
  },

  // Delete purchase order
  delete: async (id: number): Promise<void> => {
    return api.delete(`/purchase-orders/${id}/`);
  },

  // Submit for approval
  submitForApproval: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/submit/`);
  },

  // Approve purchase order
  approve: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve/`);
  },

  // Reject purchase order
  reject: async (id: number, reason: string): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/reject/`, { reason });
  },

  // Send to supplier
  send: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/send/`);
  },

  // Confirm from supplier
  confirm: async (id: number, expectedDate?: string): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/confirm/`, { expected_delivery_date: expectedDate });
  },

  // Start receiving
  startReceiving: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/start-receiving/`);
  },

  // Receive items
  receiveItems: async (id: number, items: Array<{ item_id: number; quantity_received: number }>): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive/`, { items });
  },

  // Complete purchase order
  complete: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/complete/`);
  },

  // Cancel purchase order
  cancel: async (id: number, reason: string): Promise<ApiResponse<PurchaseOrder>> => {
    return api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel/`, { reason });
  },

  // Get status history
  getStatusHistory: async (id: number): Promise<ApiResponse<Array<{
    old_status: string | null;
    new_status: string;
    notes: string | null;
    changed_by: number | null;
    created_at: string;
  }>>> => {
    return api.get(`/purchase-orders/${id}/status-history/`);
  },

  // Print PO
  print: async (id: number): Promise<Blob> => {
    const response = await fetch(`/api/v1/purchase-orders/${id}/print/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.blob();
  },

  // Generate next PO number
  getNextPoNumber: async (): Promise<ApiResponse<{ po_number: string }>> => {
    return api.get<ApiResponse<{ po_number: string }>>('/purchase-orders/next-number/');
  },
};

export default purchaseOrdersApi;
