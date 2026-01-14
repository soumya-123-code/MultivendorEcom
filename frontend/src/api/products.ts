import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductFilters,
  ProductFormData,
  ProductVariant,
  Category,
} from '@/types';

export const productsApi = {
  // List products
  list: (params?: ProductFilters) =>
    api.get<PaginatedResponse<Product>>('/products/', params as Record<string, unknown>),

  // Get product by ID
  getById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}/`),

  // Create product
  create: (data: ProductFormData) => api.post<ApiResponse<Product>>('/products/', data),

  // Update product
  update: (id: number, data: Partial<ProductFormData>) =>
    api.patch<ApiResponse<Product>>(`/products/${id}/`, data),

  // Delete product
  delete: (id: number) => api.delete<ApiResponse<null>>(`/products/${id}/`),

  // Publish product
  publish: (id: number) => api.post<ApiResponse<Product>>(`/products/${id}/publish/`),

  // Unpublish product
  unpublish: (id: number) => api.post<ApiResponse<Product>>(`/products/${id}/unpublish/`),

  // Get product reviews
  getReviews: (id: number) =>
    api.get<PaginatedResponse<unknown>>(`/products/${id}/reviews/`),

  // Variants
  variants: {
    list: (productId: number) =>
      api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants/`),

    create: (productId: number, data: Partial<ProductVariant>) =>
      api.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants/`, data),

    update: (productId: number, variantId: number, data: Partial<ProductVariant>) =>
      api.patch<ApiResponse<ProductVariant>>(
        `/products/${productId}/variants/${variantId}/`,
        data
      ),

    delete: (productId: number, variantId: number) =>
      api.delete<ApiResponse<null>>(`/products/${productId}/variants/${variantId}/`),
  },
};

// Categories API
export const categoriesApi = {
  // List categories
  list: (params?: { parent?: number; is_featured?: boolean; search?: string }) =>
    api.get<PaginatedResponse<Category>>('/categories/', params as Record<string, unknown>),

  // Get category tree
  getTree: () => api.get<ApiResponse<Category[]>>('/categories/tree/'),

  // Get category by ID
  getById: (id: number) => api.get<ApiResponse<Category>>(`/categories/${id}/`),

  // Create category
  create: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/categories/', data),

  // Update category
  update: (id: number, data: Partial<Category>) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}/`, data),

  // Delete category
  delete: (id: number) => api.delete<ApiResponse<null>>(`/categories/${id}/`),
};

export default productsApi;
