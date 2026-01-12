import { api } from './client';
import { ApiResponse, PaginatedResponse, Inventory, StockStatus } from '../../types';

export interface InventoryQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  product?: number;
  warehouse?: number;
  stock_status?: StockStatus;
  low_stock?: boolean;
  expiring_soon?: boolean;
}

export interface InventoryAdjustment {
  product: number;
  warehouse: number;
  variant?: number;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface InventoryTransfer {
  product: number;
  variant?: number;
  from_warehouse: number;
  to_warehouse: number;
  from_location?: number;
  to_location?: number;
  quantity: number;
  notes?: string;
}

export const inventoryApi = {
  // List inventory with pagination
  list: async (params?: InventoryQueryParams): Promise<PaginatedResponse<Inventory>> => {
    const response = await api.get<{ data: PaginatedResponse<Inventory> } | PaginatedResponse<Inventory>>('/inventory/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single inventory item
  get: async (id: number): Promise<ApiResponse<Inventory>> => {
    return api.get<ApiResponse<Inventory>>(`/inventory/${id}/`);
  },

  // Get stock for a product across all warehouses
  getProductStock: async (productId: number): Promise<ApiResponse<Inventory[]>> => {
    return api.get<ApiResponse<Inventory[]>>(`/inventory/product/${productId}/`);
  },

  // Get warehouse inventory
  getWarehouseInventory: async (warehouseId: number, params?: InventoryQueryParams): Promise<PaginatedResponse<Inventory>> => {
    const response = await api.get<{ data: PaginatedResponse<Inventory> } | PaginatedResponse<Inventory>>(`/inventory/warehouse/${warehouseId}/`, params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Adjust inventory
  adjust: async (data: InventoryAdjustment): Promise<ApiResponse<Inventory>> => {
    return api.post<ApiResponse<Inventory>>('/inventory/adjust/', data);
  },

  // Transfer inventory between warehouses
  transfer: async (data: InventoryTransfer): Promise<ApiResponse<{ from: Inventory; to: Inventory }>> => {
    return api.post<ApiResponse<{ from: Inventory; to: Inventory }>>('/inventory/transfer/', data);
  },

  // Get low stock items
  getLowStock: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Inventory>> => {
    const response = await api.get<{ data: PaginatedResponse<Inventory> } | PaginatedResponse<Inventory>>('/inventory/low-stock/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get out of stock items
  getOutOfStock: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Inventory>> => {
    const response = await api.get<{ data: PaginatedResponse<Inventory> } | PaginatedResponse<Inventory>>('/inventory/out-of-stock/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get expiring soon items
  getExpiringSoon: async (days?: number): Promise<ApiResponse<Inventory[]>> => {
    return api.get<ApiResponse<Inventory[]>>('/inventory/expiring-soon/', { days: days || 30 } as Record<string, unknown>);
  },

  // Get inventory logs
  getLogs: async (inventoryId: number, params?: { page?: number }): Promise<PaginatedResponse<{
    id: number;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reference_type: string;
    reference_id: number;
    notes: string;
    created_at: string;
  }>> => {
    const response = await api.get<PaginatedResponse<{
      id: number;
      movement_type: string;
      quantity: number;
      quantity_before: number;
      quantity_after: number;
      reference_type: string;
      reference_id: number;
      notes: string;
      created_at: string;
    }>>(`/inventory/${inventoryId}/logs/`, params as Record<string, unknown>);
    return response;
  },

  // Reserve inventory
  reserve: async (inventoryId: number, quantity: number, orderId?: number): Promise<ApiResponse<Inventory>> => {
    return api.post<ApiResponse<Inventory>>(`/inventory/${inventoryId}/reserve/`, { quantity, order_id: orderId });
  },

  // Unreserve inventory
  unreserve: async (inventoryId: number, quantity: number): Promise<ApiResponse<Inventory>> => {
    return api.post<ApiResponse<Inventory>>(`/inventory/${inventoryId}/unreserve/`, { quantity });
  },

  // Bulk update stock status
  bulkUpdateStatus: async (ids: number[], status: StockStatus): Promise<ApiResponse<Inventory[]>> => {
    return api.post<ApiResponse<Inventory[]>>('/inventory/bulk-status/', { ids, status });
  },

  // Get inventory summary
  getSummary: async (): Promise<ApiResponse<{
    total_items: number;
    total_quantity: number;
    total_value: string;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    by_warehouse: Array<{
      warehouse_id: number;
      warehouse_name: string;
      total_items: number;
      total_quantity: number;
    }>;
  }>> => {
    return api.get('/inventory/summary/');
  },
};

export default inventoryApi;
