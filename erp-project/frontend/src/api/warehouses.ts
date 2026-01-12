import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Warehouse,
  WarehouseFormData,
  WarehouseStats,
  RackShelfLocation,
} from '@/types';

interface WarehouseFilters {
  status?: string;
  warehouse_type?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const warehousesApi = {
  // List warehouses
  list: (params?: WarehouseFilters) =>
    api.get<PaginatedResponse<Warehouse>>('/warehouses/', params as Record<string, unknown>),

  // Get warehouse by ID
  getById: (id: number) => api.get<ApiResponse<Warehouse>>(`/warehouses/${id}/`),

  // Create warehouse
  create: (data: WarehouseFormData) =>
    api.post<ApiResponse<Warehouse>>('/warehouses/', data),

  // Update warehouse
  update: (id: number, data: Partial<WarehouseFormData>) =>
    api.patch<ApiResponse<Warehouse>>(`/warehouses/${id}/`, data),

  // Delete warehouse
  delete: (id: number) => api.delete<ApiResponse<null>>(`/warehouses/${id}/`),

  // Get warehouse statistics
  getStats: (id: number) => api.get<ApiResponse<WarehouseStats>>(`/warehouses/${id}/stats/`),

  // Locations
  locations: {
    // List locations in warehouse
    list: (warehouseId: number) =>
      api.get<ApiResponse<RackShelfLocation[]>>(`/warehouses/${warehouseId}/locations/`),

    // Create location
    create: (warehouseId: number, data: Partial<RackShelfLocation>) =>
      api.post<ApiResponse<RackShelfLocation>>(
        `/warehouses/${warehouseId}/locations/`,
        data
      ),

    // Update location
    update: (warehouseId: number, locationId: number, data: Partial<RackShelfLocation>) =>
      api.patch<ApiResponse<RackShelfLocation>>(
        `/warehouses/${warehouseId}/locations/${locationId}/`,
        data
      ),

    // Delete location
    delete: (warehouseId: number, locationId: number) =>
      api.delete<ApiResponse<null>>(`/warehouses/${warehouseId}/locations/${locationId}/`),
  },
};

export default warehousesApi;
