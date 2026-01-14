import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Inventory,
  InventoryLog,
  InventoryFilters,
  InventoryAdjustmentFormData,
} from '@/types';

export const inventoryApi = {
  // List inventory items
  list: (params?: any) =>
    api.get<PaginatedResponse<any>>('/inventory/', params as any),

  // Get inventory item by ID
  getById: (id: number) => api.get<ApiResponse<Inventory>>(`/inventory/${id}/`),

  // Create inventory item
  create: (data: Partial<Inventory>) =>
    api.post<ApiResponse<Inventory>>('/inventory/', data),

  // Update inventory item
  update: (id: number, data: Partial<Inventory>) =>
    api.patch<ApiResponse<Inventory>>(`/inventory/${id}/`, data),

  // Delete inventory item
  delete: (id: number) => api.delete<ApiResponse<null>>(`/inventory/${id}/`),

  // Adjust inventory (add/remove stock)
  adjust: (data: InventoryAdjustmentFormData) =>
    api.post<ApiResponse<Inventory>>('/inventory/adjust/', data),

  // Transfer inventory between warehouses
  transfer: (data: {
    from_inventory: number;
    to_warehouse: number;
    quantity: number;
    notes?: string;
  }) => api.post<ApiResponse<Inventory>>('/inventory/transfer/', data),

  // Get inventory by product
  getByProduct: (productId: number) =>
    api.get<ApiResponse<Inventory[]>>(`/inventory/product/${productId}/`),

  // Get inventory by warehouse
  getByWarehouse: (warehouseId: number) =>
    api.get<PaginatedResponse<Inventory>>(`/inventory/warehouse/${warehouseId}/`),

  // Get low stock items
  getLowStock: () => api.get<PaginatedResponse<Inventory>>('/inventory/low-stock/'),

  // Get out of stock items
  getOutOfStock: () => api.get<PaginatedResponse<Inventory>>('/inventory/out-of-stock/'),

  // Logs
  logs: {
    // List inventory logs
    list: (params?: {
      inventory?: number;
      product?: number;
      warehouse?: number;
      movement_type?: string;
      page?: number;
      page_size?: number;
    }) =>
      api.get<PaginatedResponse<InventoryLog>>(
        '/inventory/logs/',
        params as Record<string, unknown>
      ),

    // Get log by ID
    getById: (id: number) => api.get<ApiResponse<InventoryLog>>(`/inventory/logs/${id}/`),
  },
};

export default inventoryApi;
