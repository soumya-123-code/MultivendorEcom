import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Vendor,
  VendorFilters,
  VendorFormData,
  VendorStats,
  Supplier,
  SupplierFormData,
} from '@/types';

export const vendorsApi = {
  // List vendors
  list: (params?: VendorFilters) =>
    api.get<PaginatedResponse<Vendor>>('/vendors/', params as Record<string, unknown>),

  // Get vendor by ID
  getById: (id: number) => api.get<ApiResponse<Vendor>>(`/vendors/${id}/`),

  // Create vendor profile
  create: (data: VendorFormData) => api.post<ApiResponse<Vendor>>('/vendors/', data),

  // Update vendor
  update: (id: number, data: Partial<VendorFormData>) =>
    api.patch<ApiResponse<Vendor>>(`/vendors/${id}/`, data),

  // Delete vendor
  delete: (id: number) => api.delete<ApiResponse<null>>(`/vendors/${id}/`),

  // Get own vendor profile (for vendor users)
  getMyProfile: () => api.get<ApiResponse<Vendor>>('/vendors/me/'),

  // Update own vendor profile
  updateMyProfile: (data: Partial<VendorFormData>) =>
    api.patch<ApiResponse<Vendor>>('/vendors/me/', data),

  // Get vendor statistics
  getStats: (id: number) => api.get<ApiResponse<VendorStats>>(`/vendors/${id}/stats/`),

  // Approve vendor (Admin only)
  approve: (id: number) => api.post<ApiResponse<Vendor>>(`/vendors/${id}/approve/`),

  // Reject vendor (Admin only)
  reject: (id: number, reason: string) =>
    api.post<ApiResponse<Vendor>>(`/vendors/${id}/reject/`, { reason }),

  // Suspend vendor (Admin only)
  suspend: (id: number) => api.post<ApiResponse<Vendor>>(`/vendors/${id}/suspend/`),

  // Reactivate vendor (Admin only)
  reactivate: (id: number) => api.post<ApiResponse<Vendor>>(`/vendors/${id}/reactivate/`),
};

// Supplier API
export const suppliersApi = {
  // List suppliers
  list: (params?: { status?: string; search?: string; ordering?: string }) =>
    api.get<PaginatedResponse<Supplier>>('/vendors/suppliers/', params as Record<string, unknown>),

  // Get supplier by ID
  getById: (id: number) => api.get<ApiResponse<Supplier>>(`/vendors/suppliers/${id}/`),

  // Create supplier
  create: (data: SupplierFormData) =>
    api.post<ApiResponse<Supplier>>('/vendors/suppliers/', data),

  // Update supplier
  update: (id: number, data: Partial<SupplierFormData>) =>
    api.patch<ApiResponse<Supplier>>(`/vendors/suppliers/${id}/`, data),

  // Delete supplier
  delete: (id: number) => api.delete<ApiResponse<null>>(`/vendors/suppliers/${id}/`),
};

export default vendorsApi;
