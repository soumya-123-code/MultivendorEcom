import { api } from './client';
import { ApiResponse, PaginatedResponse, Customer, CustomerAddress } from '../../types';

export interface CustomersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export const customersApi = {
  // List customers with pagination
  list: async (params?: CustomersQueryParams): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<{ data: PaginatedResponse<Customer> } | PaginatedResponse<Customer>>('/customers/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single customer
  get: async (id: number): Promise<ApiResponse<Customer>> => {
    return api.get<ApiResponse<Customer>>(`/customers/${id}/`);
  },

  // Get own customer profile
  me: async (): Promise<ApiResponse<Customer>> => {
    return api.get<ApiResponse<Customer>>('/customers/me/');
  },

  // Create customer
  create: async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return api.post<ApiResponse<Customer>>('/customers/', data);
  },

  // Update customer
  update: async (id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return api.patch<ApiResponse<Customer>>(`/customers/${id}/`, data);
  },

  // Delete customer
  delete: async (id: number): Promise<void> => {
    return api.delete(`/customers/${id}/`);
  },

  // Get customer orders
  getOrders: async (id: number, params?: { page?: number }): Promise<PaginatedResponse<unknown>> => {
    return api.get(`/customers/${id}/orders/`, params as Record<string, unknown>);
  },

  // Addresses
  addresses: {
    list: async (): Promise<ApiResponse<CustomerAddress[]>> => {
      return api.get<ApiResponse<CustomerAddress[]>>('/customers/addresses/');
    },

    get: async (id: number): Promise<ApiResponse<CustomerAddress>> => {
      return api.get<ApiResponse<CustomerAddress>>(`/customers/addresses/${id}/`);
    },

    create: async (data: Omit<CustomerAddress, 'id' | 'customer'>): Promise<ApiResponse<CustomerAddress>> => {
      return api.post<ApiResponse<CustomerAddress>>('/customers/addresses/', data);
    },

    update: async (id: number, data: Partial<CustomerAddress>): Promise<ApiResponse<CustomerAddress>> => {
      return api.patch<ApiResponse<CustomerAddress>>(`/customers/addresses/${id}/`, data);
    },

    delete: async (id: number): Promise<void> => {
      return api.delete(`/customers/addresses/${id}/`);
    },

    setDefault: async (id: number): Promise<ApiResponse<CustomerAddress>> => {
      return api.post<ApiResponse<CustomerAddress>>(`/customers/addresses/${id}/set-default/`);
    },
  },

  // Wishlist
  wishlist: {
    list: async (): Promise<ApiResponse<Array<{ id: number; product: number; created_at: string }>>> => {
      return api.get('/customers/wishlist/');
    },

    add: async (productId: number): Promise<ApiResponse<{ id: number; product: number }>> => {
      return api.post('/customers/wishlist/add/', { product_id: productId });
    },

    remove: async (productId: number): Promise<void> => {
      return api.delete(`/customers/wishlist/remove/?product_id=${productId}`);
    },
  },
};

export default customersApi;
