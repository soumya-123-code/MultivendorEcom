import { api } from './client';
import {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductVariant,
  ProductReview,
  ProductFormData,
} from '../../types';

export interface ProductsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  category?: number;
  status?: string;
  is_featured?: boolean;
  vendor?: number;
}

export const productsApi = {
  // List products with pagination
  list: async (params?: ProductsQueryParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<{ data: PaginatedResponse<Product> } | PaginatedResponse<Product>>('/products/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get single product
  get: async (id: number): Promise<ApiResponse<Product>> => {
    return api.get<ApiResponse<Product>>(`/products/${id}/`);
  },

  // Create product
  create: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    return api.post<ApiResponse<Product>>('/products/', data);
  },

  // Update product
  update: async (id: number, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    return api.patch<ApiResponse<Product>>(`/products/${id}/`, data);
  },

  // Delete product
  delete: async (id: number): Promise<void> => {
    return api.delete(`/products/${id}/`);
  },

  // Publish product
  publish: async (id: number): Promise<ApiResponse<Product>> => {
    return api.post<ApiResponse<Product>>(`/products/${id}/publish/`);
  },

  // Unpublish product
  unpublish: async (id: number): Promise<ApiResponse<Product>> => {
    return api.post<ApiResponse<Product>>(`/products/${id}/unpublish/`);
  },

  // Get product reviews
  getReviews: async (productId: number, params?: { page?: number }): Promise<PaginatedResponse<ProductReview>> => {
    const response = await api.get<{ data: PaginatedResponse<ProductReview> } | PaginatedResponse<ProductReview>>(`/products/${productId}/reviews/`, params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Upload product images
  uploadImages: async (productId: number, files: File[]): Promise<ApiResponse<Product>> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });
    return api.upload<ApiResponse<Product>>(`/products/${productId}/images/`, formData);
  },

  // Variants
  variants: {
    list: async (productId: number): Promise<ApiResponse<ProductVariant[]>> => {
      return api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants/`);
    },
    create: async (productId: number, data: Partial<ProductVariant>): Promise<ApiResponse<ProductVariant>> => {
      return api.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants/`, data);
    },
    update: async (productId: number, variantId: number, data: Partial<ProductVariant>): Promise<ApiResponse<ProductVariant>> => {
      return api.patch<ApiResponse<ProductVariant>>(`/products/${productId}/variants/${variantId}/`, data);
    },
    delete: async (productId: number, variantId: number): Promise<void> => {
      return api.delete(`/products/${productId}/variants/${variantId}/`);
    },
  },
};

export default productsApi;
