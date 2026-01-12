import { api } from './client';
import { ApiResponse, PaginatedResponse, Warehouse, RackShelfLocation, WarehouseFormData } from '../../types';

export interface WarehousesQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  warehouse_type?: string;
  city?: string;
}

export interface LocationFormData {
  name: string;
  code: string;
  floor?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  capacity?: number;
}

export const warehousesApi = {
  // List warehouses with pagination
  list: async (params?: WarehousesQueryParams): Promise<PaginatedResponse<Warehouse>> => {
    const response = await api.get<{ data: PaginatedResponse<Warehouse> } | PaginatedResponse<Warehouse>>('/warehouses/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single warehouse
  get: async (id: number): Promise<ApiResponse<Warehouse>> => {
    return api.get<ApiResponse<Warehouse>>(`/warehouses/${id}/`);
  },

  // Create warehouse
  create: async (data: WarehouseFormData): Promise<ApiResponse<Warehouse>> => {
    return api.post<ApiResponse<Warehouse>>('/warehouses/', data);
  },

  // Update warehouse
  update: async (id: number, data: Partial<WarehouseFormData>): Promise<ApiResponse<Warehouse>> => {
    return api.patch<ApiResponse<Warehouse>>(`/warehouses/${id}/`, data);
  },

  // Delete warehouse
  delete: async (id: number): Promise<void> => {
    return api.delete(`/warehouses/${id}/`);
  },

  // Activate warehouse
  activate: async (id: number): Promise<ApiResponse<Warehouse>> => {
    return api.post<ApiResponse<Warehouse>>(`/warehouses/${id}/activate/`);
  },

  // Deactivate warehouse
  deactivate: async (id: number): Promise<ApiResponse<Warehouse>> => {
    return api.post<ApiResponse<Warehouse>>(`/warehouses/${id}/deactivate/`);
  },

  // Set maintenance mode
  setMaintenance: async (id: number): Promise<ApiResponse<Warehouse>> => {
    return api.post<ApiResponse<Warehouse>>(`/warehouses/${id}/maintenance/`);
  },

  // Get warehouse stats
  stats: async (id: number): Promise<ApiResponse<{
    total_items: number;
    total_quantity: number;
    capacity_used: number;
    capacity_total: number;
    utilization_percentage: number;
    top_products: Array<{ product_id: number; product_name: string; quantity: number }>;
    stock_by_status: Record<string, number>;
  }>> => {
    return api.get(`/warehouses/${id}/stats/`);
  },

  // Locations
  locations: {
    list: async (warehouseId: number): Promise<ApiResponse<RackShelfLocation[]>> => {
      return api.get<ApiResponse<RackShelfLocation[]>>(`/warehouses/${warehouseId}/locations/`);
    },

    get: async (warehouseId: number, locationId: number): Promise<ApiResponse<RackShelfLocation>> => {
      return api.get<ApiResponse<RackShelfLocation>>(`/warehouses/${warehouseId}/locations/${locationId}/`);
    },

    create: async (warehouseId: number, data: LocationFormData): Promise<ApiResponse<RackShelfLocation>> => {
      return api.post<ApiResponse<RackShelfLocation>>(`/warehouses/${warehouseId}/locations/`, data);
    },

    update: async (warehouseId: number, locationId: number, data: Partial<LocationFormData>): Promise<ApiResponse<RackShelfLocation>> => {
      return api.patch<ApiResponse<RackShelfLocation>>(`/warehouses/${warehouseId}/locations/${locationId}/`, data);
    },

    delete: async (warehouseId: number, locationId: number): Promise<void> => {
      return api.delete(`/warehouses/${warehouseId}/locations/${locationId}/`);
    },

    // Get location inventory
    getInventory: async (warehouseId: number, locationId: number): Promise<ApiResponse<Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      reserved: number;
    }>>> => {
      return api.get(`/warehouses/${warehouseId}/locations/${locationId}/inventory/`);
    },
  },
};

export default warehousesApi;
