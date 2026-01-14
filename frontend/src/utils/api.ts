// Simple API utility - no interceptors, just plain fetch
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

// Clear session and redirect to login
const clearSessionAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Only redirect if not already on login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Refresh access token with singleton pattern
const refreshAccessToken = async (): Promise<string> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSessionAndRedirect();
    throw new Error('No refresh token available');
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is also invalid
        clearSessionAndRedirect();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      
      // If backend returns new refresh token, update it
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return data.access;
    } catch (error) {
      clearSessionAndRedirect();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Simple fetch wrapper with token refresh
export const api = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - token expired
    if (response.status === 401 && retryCount === 0) {
      console.log('Token expired, attempting refresh...');
      
      try {
        // Try to refresh the token
        await refreshAccessToken();
        console.log('Token refreshed successfully');
        
        // Retry the request with new token
        return api(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Session expired. Please login again.');
      }
    }

    // For non-JSON responses (like DELETE with no content)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || data.error?.message || data.message || 'Something went wrong';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    // Network error or other issues
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  requestOTP: (email: string) => 
    api('/auth/request-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOTP: async (email: string, otp: string) => {
    const response = await api('/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    
    // Handle nested response structure
    // Backend returns: { success: true, data: { access, refresh, user } }
    if (response.data) {
      return response.data;
    }
    
    // Or direct structure: { access, refresh, user }
    return response;
  },

  register: (data: any) =>
    api('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshToken: (refresh: string) =>
    api('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }),

  logout: () =>
    api('/auth/logout/', {
      method: 'POST',
    }),

  getProfile: () => api('/users/me/'),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/products/${query}`);
  },

  getOne: (id: number) => api(`/products/${id}/`),

  create: (data: any) =>
    api('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/products/${id}/`, {
      method: 'DELETE',
    }),

  getReviews: (id: number) => api(`/products/${id}/reviews/`),

  addReview: (id: number, data: any) =>
    api(`/products/${id}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api('/categories/'),
  
  getOne: (id: number) => api(`/categories/${id}/`),

  create: (data: any) =>
    api('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/categories/${id}/`, {
      method: 'DELETE',
    }),
};

// Warehouse APIs
export const warehouseAPI = {
  getAll: () => api('/warehouses/'),
  
  getOne: (id: number) => api(`/warehouses/${id}/`),

  create: (data: any) =>
    api('/warehouses/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/warehouses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/warehouses/${id}/`, {
      method: 'DELETE',
    }),

  getLocations: (id: number) => api(`/warehouses/${id}/locations/`),

  addLocation: (id: number, data: any) =>
    api(`/warehouses/${id}/locations/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: (id: number) => api(`/warehouses/${id}/stats/`),
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/inventory/${query}`);
  },

  getOne: (id: number) => api(`/inventory/${id}/`),

  create: (data: any) =>
    api('/inventory/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/inventory/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/inventory/${id}/`, {
      method: 'DELETE',
    }),

  adjust: (id: number, quantity: number, notes: string) =>
    api(`/inventory/${id}/adjust/`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes }),
    }),

  transfer: (id: number, data: any) =>
    api(`/inventory/${id}/transfer/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reserve: (id: number, data: any) =>
    api(`/inventory/${id}/reserve/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLowStock: () => api('/inventory/low-stock/'),
  
  getOutOfStock: () => api('/inventory/out-of-stock/'),
  
  getSummary: () => api('/inventory/summary/'),
};

// Sales Order APIs
export const salesOrderAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/sales-orders/${query}`);
  },

  getOne: (id: number) => api(`/sales-orders/${id}/`),

  create: (data: any) =>
    api('/sales-orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/sales-orders/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  confirm: (id: number) =>
    api(`/sales-orders/${id}/confirm/`, {
      method: 'POST',
    }),

  process: (id: number) =>
    api(`/sales-orders/${id}/process/`, {
      method: 'POST',
    }),

  pack: (id: number) =>
    api(`/sales-orders/${id}/pack/`, {
      method: 'POST',
    }),

  readyForPickup: (id: number) =>
    api(`/sales-orders/${id}/ready-for-pickup/`, {
      method: 'POST',
    }),

  cancel: (id: number, reason: string) =>
    api(`/sales-orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  assignDelivery: (id: number, agentId: number) =>
    api(`/sales-orders/${id}/assign-delivery/`, {
      method: 'POST',
      body: JSON.stringify({ delivery_agent_id: agentId }),
    }),

  getStatusLogs: (id: number) => api(`/sales-orders/${id}/status-logs/`),
};

// Purchase Order APIs
export const purchaseOrderAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/purchase-orders/${query}`);
  },

  getOne: (id: number) => api(`/purchase-orders/${id}/`),

  create: (data: any) =>
    api('/purchase-orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/purchase-orders/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submit: (id: number) =>
    api(`/purchase-orders/${id}/submit/`, {
      method: 'POST',
    }),

  approve: (id: number) =>
    api(`/purchase-orders/${id}/approve/`, {
      method: 'POST',
    }),

  reject: (id: number, reason: string) =>
    api(`/purchase-orders/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  send: (id: number) =>
    api(`/purchase-orders/${id}/send/`, {
      method: 'POST',
    }),

  receive: (id: number, data: any) =>
    api(`/purchase-orders/${id}/receive/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  complete: (id: number) =>
    api(`/purchase-orders/${id}/complete/`, {
      method: 'POST',
    }),

  cancel: (id: number, reason: string) =>
    api(`/purchase-orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getStatusLogs: (id: number) => api(`/purchase-orders/${id}/status-logs/`),
};

// Delivery Agent APIs
export const deliveryAgentAPI = {
  getAll: () => api('/delivery-agents/'),
  
  getOne: (id: number) => api(`/delivery-agents/${id}/`),

  create: (data: any) =>
    api('/delivery-agents/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/delivery-agents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  approve: (id: number) =>
    api(`/delivery-agents/${id}/approve/`, {
      method: 'POST',
    }),

  reject: (id: number) =>
    api(`/delivery-agents/${id}/reject/`, {
      method: 'POST',
    }),

  suspend: (id: number) =>
    api(`/delivery-agents/${id}/suspend/`, {
      method: 'POST',
    }),

  activate: (id: number) =>
    api(`/delivery-agents/${id}/activate/`, {
      method: 'POST',
    }),

  getAvailable: () => api('/delivery-agents/available/'),

  getMyProfile: () => api('/delivery-agents/me/'),

  updateMyProfile: (data: any) =>
    api('/delivery-agents/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  setAvailability: (available: boolean) =>
    api('/delivery-agents/me/availability/', {
      method: 'POST',
      body: JSON.stringify({ available }),
    }),

  getMyStats: () => api('/delivery-agents/me/stats/'),
};

// Delivery APIs
export const deliveryAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/deliveries/${query}`);
  },

  getOne: (id: number) => api(`/deliveries/${id}/`),

  getMy: () => api('/deliveries/my/'),

  accept: (id: number) =>
    api(`/deliveries/${id}/accept/`, {
      method: 'POST',
    }),

  reject: (id: number, reason: string) =>
    api(`/deliveries/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  pickup: (id: number) =>
    api(`/deliveries/${id}/pickup/`, {
      method: 'POST',
    }),

  inTransit: (id: number) =>
    api(`/deliveries/${id}/in-transit/`, {
      method: 'POST',
    }),

  outForDelivery: (id: number) =>
    api(`/deliveries/${id}/out-for-delivery/`, {
      method: 'POST',
    }),

  complete: (id: number, data: any) =>
    api(`/deliveries/${id}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fail: (id: number, reason: string) =>
    api(`/deliveries/${id}/fail/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  collectCOD: (id: number, amount: number) =>
    api(`/deliveries/${id}/collect-cod/`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  getStatusLogs: (id: number) => api(`/deliveries/${id}/status-logs/`),

  reassign: (id: number, agentId: number) =>
    api(`/deliveries/${id}/reassign/`, {
      method: 'POST',
      body: JSON.stringify({ new_agent_id: agentId }),
    }),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/notifications/${query}`);
  },

  getOne: (id: number) => api(`/notifications/${id}/`),

  markRead: (id: number) =>
    api(`/notifications/${id}/mark-read/`, {
      method: 'POST',
    }),

  markAllRead: () =>
    api('/notifications/mark-all-read/', {
      method: 'POST',
    }),

  getUnread: () => api('/notifications/unread/'),

  getCount: () => api('/notifications/count/'),

  delete: (id: number) =>
    api(`/notifications/${id}/`, {
      method: 'DELETE',
    }),

  clearAll: () =>
    api('/notifications/clear-all/', {
      method: 'DELETE',
    }),
};

// Payment APIs
export const paymentAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/payments/${query}`);
  },

  getOne: (id: number) => api(`/payments/${id}/`),

  initiate: (data: any) =>
    api('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirm: (id: number) =>
    api(`/payments/${id}/confirm/`, {
      method: 'POST',
    }),

  fail: (id: number) =>
    api(`/payments/${id}/fail/`, {
      method: 'POST',
    }),

  getSummary: () => api('/payments/summary/'),
};

// Refund APIs
export const refundAPI = {
  getAll: () => api('/payments/refunds/'),

  getOne: (id: number) => api(`/payments/refunds/${id}/`),

  request: (data: any) =>
    api('/payments/refunds/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  process: (id: number, status: 'approved' | 'rejected', notes?: string) =>
    api(`/payments/refunds/${id}/process/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),
};

// Customer APIs
export const customerAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/customers/${query}`);
  },

  getOne: (id: number) => api(`/customers/${id}/`),

  create: (data: any) =>
    api('/customers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/customers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/customers/${id}/`, {
      method: 'DELETE',
    }),
};

// Vendor APIs
export const vendorAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/${query}`);
  },

  getOne: (id: number) => api(`/vendors/${id}/`),

  create: (data: any) =>
    api('/vendors/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/vendors/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/vendors/${id}/`, {
      method: 'DELETE',
    }),
};

// Supplier APIs
export const supplierAPI = {
  getAll: () => api('/vendors/suppliers/'),

  getOne: (id: number) => api(`/vendors/suppliers/${id}/`),

  create: (data: any) =>
    api('/vendors/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/vendors/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/vendors/suppliers/${id}/`, {
      method: 'DELETE',
    }),
};

// User APIs
export const userAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/users/${query}`);
  },

  getOne: (id: number) => api(`/users/${id}/`),

  getMe: () => api('/users/me/'),

  updateMe: (data: any) =>
    api('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api('/users/me/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),
};
