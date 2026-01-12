import { api } from './client';
import { ApiResponse, PaginatedResponse, Category } from '../../types';

export interface CategoriesQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  parent?: number | null;
  is_featured?: boolean;
  level?: number;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  image?: string | null;
  parent?: number | null;
  display_order?: number;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export const categoriesApi = {
  // List categories with pagination
  list: async (params?: CategoriesQueryParams): Promise<PaginatedResponse<Category>> => {
    const response = await api.get<{ data: PaginatedResponse<Category> } | PaginatedResponse<Category>>('/categories/', params as Record<string, unknown>);
    return 'data' in response ? response.data : response;
  },

  // Get category tree
  tree: async (): Promise<ApiResponse<Category[]>> => {
    return api.get<ApiResponse<Category[]>>('/categories/tree/');
  },

  // Get single category
  get: async (id: number): Promise<ApiResponse<Category>> => {
    return api.get<ApiResponse<Category>>(`/categories/${id}/`);
  },

  // Create category
  create: async (data: CategoryFormData): Promise<ApiResponse<Category>> => {
    return api.post<ApiResponse<Category>>('/categories/', data);
  },

  // Update category
  update: async (id: number, data: Partial<CategoryFormData>): Promise<ApiResponse<Category>> => {
    return api.patch<ApiResponse<Category>>(`/categories/${id}/`, data);
  },

  // Delete category
  delete: async (id: number): Promise<void> => {
    return api.delete(`/categories/${id}/`);
  },

  // Upload category image
  uploadImage: async (id: number, file: File): Promise<ApiResponse<Category>> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.upload<ApiResponse<Category>>(`/categories/${id}/image/`, formData);
  },
};

export default categoriesApi;
