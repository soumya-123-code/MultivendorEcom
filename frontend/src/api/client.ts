// Base API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'erp_access_token';
const REFRESH_TOKEN_KEY = 'erp_refresh_token';
const USER_KEY = 'erp_user';

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  isAuthenticated: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  setUser: (user: unknown): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

// Simple fetch wrapper with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = tokenManager.getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      // Handle 401 - try refresh token
      if (response.status === 401) {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              const newAccessToken = data.data?.access || data.access;
              tokenManager.setTokens(newAccessToken, refreshToken);
              
              // Retry original request with new token
              headers.Authorization = `Bearer ${newAccessToken}`;
              const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers,
              });
              
              if (!retryResponse.ok) {
                throw new Error('Request failed after token refresh');
              }
              return retryResponse;
            }
          } catch (refreshError) {
            tokenManager.clearTokens();
            window.location.href = '/auth/login';
            throw new Error('Session expired. Please login again.');
          }
        } else {
          tokenManager.clearTokens();
          window.location.href = '/auth/login';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      // Extract error message from response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = 
        errorData.error?.message || 
        errorData.message || 
        `Request failed with status ${response.status}`;
      
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

// Generic request wrapper - same interface as before
export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchWithAuth(`${url}${queryString}`);
    const data = await response.json();
    return data.data || data;
  },

  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    return result.data || result;
  },

  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    return result.data || result;
  },

  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    return result.data || result;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data.data || data;
  },

  // For file uploads
  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const token = tokenManager.getAccessToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      body: formData,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = 
        errorData.error?.message || 
        errorData.message || 
        `Upload failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.data || data;
  },
};

export default api;