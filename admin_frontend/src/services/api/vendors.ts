import { api } from './client';
import { ApiResponse, PaginatedResponse, Vendor, Supplier, VendorFormData } from '../../types';

export interface VendorsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: string;
  city?: string;
  state?: string;
}

export interface SuppliersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: string;
}

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  tax_id?: string;
  payment_terms?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export const vendorsApi = {
  // List vendors with pagination
  list: async (params?: VendorsQueryParams): Promise<PaginatedResponse<Vendor>> => {
    const response = await api.get<{ data: PaginatedResponse<Vendor> } | PaginatedResponse<Vendor>>('/vendors/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single vendor
  get: async (id: number): Promise<ApiResponse<Vendor>> => {
    return api.get<ApiResponse<Vendor>>(`/vendors/${id}/`);
  },

  // Get own vendor profile
  me: async (): Promise<ApiResponse<Vendor>> => {
    return api.get<ApiResponse<Vendor>>('/vendors/me/');
  },

  // Create vendor
  create: async (data: VendorFormData): Promise<ApiResponse<Vendor>> => {
    return api.post<ApiResponse<Vendor>>('/vendors/', data);
  },

  // Update vendor
  update: async (id: number, data: Partial<VendorFormData>): Promise<ApiResponse<Vendor>> => {
    return api.patch<ApiResponse<Vendor>>(`/vendors/${id}/`, data);
  },

  // Delete vendor
  delete: async (id: number): Promise<void> => {
    return api.delete(`/vendors/${id}/`);
  },

  // Get vendor stats
  stats: async (id: number): Promise<ApiResponse<Record<string, unknown>>> => {
    return api.get<ApiResponse<Record<string, unknown>>>(`/vendors/${id}/stats/`);
  },

  // Approve vendor
  approve: async (id: number): Promise<ApiResponse<Vendor>> => {
    return api.post<ApiResponse<Vendor>>(`/vendors/${id}/approve/`);
  },

  // Reject vendor
  reject: async (id: number, reason: string): Promise<ApiResponse<Vendor>> => {
    return api.post<ApiResponse<Vendor>>(`/vendors/${id}/reject/`, { reason });
  },

  // Suspend vendor
  suspend: async (id: number): Promise<ApiResponse<Vendor>> => {
    return api.post<ApiResponse<Vendor>>(`/vendors/${id}/suspend/`);
  },

  // Reactivate vendor
  reactivate: async (id: number): Promise<ApiResponse<Vendor>> => {
    return api.post<ApiResponse<Vendor>>(`/vendors/${id}/reactivate/`);
  },

  // Suppliers
  suppliers: {
    list: async (params?: SuppliersQueryParams): Promise<PaginatedResponse<Supplier>> => {
      const response = await api.get<{ data: PaginatedResponse<Supplier> } | PaginatedResponse<Supplier>>('/vendors/suppliers/', params as Record<string, unknown>);
      return 'data' in response ? response.data : response;
    },

    get: async (id: number): Promise<ApiResponse<Supplier>> => {
      return api.get<ApiResponse<Supplier>>(`/vendors/suppliers/${id}/`);
    },

    create: async (data: SupplierFormData): Promise<ApiResponse<Supplier>> => {
      return api.post<ApiResponse<Supplier>>('/vendors/suppliers/', data);
    },

    update: async (id: number, data: Partial<SupplierFormData>): Promise<ApiResponse<Supplier>> => {
      return api.patch<ApiResponse<Supplier>>(`/vendors/suppliers/${id}/`, data);
    },

    delete: async (id: number): Promise<void> => {
      return api.delete(`/vendors/suppliers/${id}/`);
    },
  },
};

export default vendorsApi;
