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
  
  const headers: any = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

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

// Product Variant APIs
export const productVariantAPI = {
  getAll: (productId?: number) => {
    if (productId) return api(`/products/variants/?product=${productId}`);
    return api('/products/variants/');
  },
  
  create: (productId: number, data: any) =>
    api('/products/variants/', {
      method: 'POST',
      body: JSON.stringify({ ...data, product: productId }),
    }),

  update: (productId: number, id: number, data: any) =>
    api(`/products/variants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (productId: number, id: number) =>
    api(`/products/variants/${id}/`, {
      method: 'DELETE',
    }),
};

// Product Image APIs
export const productImageAPI = {
  getAll: (productId: number) => api(`/products/${productId}/images/`),
  
  create: (productId: number, formData: FormData) =>
    api(`/products/${productId}/images/`, {
      method: 'POST',
      body: formData, // FormData handles Content-Type automatically
      headers: {}, // Let browser set boundary
    }),

  delete: (productId: number, id: number) =>
    api(`/products/${productId}/images/${id}/`, {
      method: 'DELETE',
    }),
    
  setPrimary: (productId: number, id: number) =>
    api(`/products/${productId}/images/${id}/set-primary/`, {
      method: 'POST',
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

  updateLocation: (id: number, data: any) =>
    api(`/warehouses/locations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteLocation: (id: number) =>
    api(`/warehouses/locations/${id}/`, {
      method: 'DELETE',
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
  
  getLogs: (id: number) => api(`/inventory/${id}/logs/`),
};

// Inventory Log APIs (Global)
export const inventoryLogAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/inventory/logs/${query}`);
  },
  getOne: (id: number) => api(`/inventory/logs/${id}/`),
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

  getProofs: (id: number) => api(`/deliveries/${id}/proofs/`),
};

// Delivery Proof APIs (Admin/Vendor View)
export const deliveryProofAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/delivery-proofs/${query}`);
  },
  getOne: (id: number) => api(`/delivery-proofs/${id}/`),
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
    
  // Admin only
  send: (data: any) =>
    api('/notifications/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  broadcast: (data: any) =>
    api('/notifications/broadcast/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Notification Template APIs
export const notificationTemplateAPI = {
  getAll: () => api('/notifications/templates/'),
  
  getOne: (id: number) => api(`/notifications/templates/${id}/`),
  
  create: (data: any) =>
    api('/notifications/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id: number, data: any) =>
    api(`/notifications/templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (id: number) =>
    api(`/notifications/templates/${id}/`, {
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

  process: (id: number, action: 'approve' | 'reject', notes?: string) =>
    api(`/payments/refunds/${id}/process/`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
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

  approve: (id: number) =>
    api(`/vendors/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    }),

  reject: (id: number, reason: string) =>
    api(`/vendors/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', reason }),
    }),

  suspend: (id: number) =>
    api(`/vendors/${id}/suspend/`, {
      method: 'POST',
    }),

  reactivate: (id: number) =>
    api(`/vendors/${id}/reactivate/`, {
      method: 'POST',
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

  create: (data: any) => api('/users/', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: number, data: any) => api(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  delete: (id: number) => api(`/users/${id}/`, { method: 'DELETE' }),

  getMe: () => api('/users/me/'),

  updateMe: (data: any) =>
    api('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getProfile: () => api('/users/me/profile/'),

  updateProfile: (data: any) =>
    api('/users/me/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api('/users/me/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  activate: (id: number) =>
    api(`/users/${id}/activate/`, {
      method: 'POST',
    }),

  deactivate: (id: number) =>
    api(`/users/${id}/deactivate/`, {
      method: 'POST',
    }),
};

// Activity Log APIs
export const activityLogAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/activity-logs/${query}`);
  },

  getOne: (id: number) => api(`/activity-logs/${id}/`),

  getByUser: (userId: number) => api(`/activity-logs/?user=${userId}`),
};

// OTP Request APIs
export const otpRequestAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/otp-requests/${query}`);
  },

  getOne: (id: number) => api(`/otp-requests/${id}/`),
};

// Customer Address APIs
export const customerAddressAPI = {
  getAll: (customerId: number) => api(`/customers/${customerId}/addresses/`),

  create: (customerId: number, data: any) =>
    api(`/customers/${customerId}/addresses/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (customerId: number, addressId: number, data: any) =>
    api(`/customers/${customerId}/addresses/${addressId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (customerId: number, addressId: number) =>
    api(`/customers/${customerId}/addresses/${addressId}/`, {
      method: 'DELETE',
    }),

  setDefault: (customerId: number, addressId: number) =>
    api(`/customers/${customerId}/addresses/${addressId}/set-default/`, {
      method: 'POST',
    }),
};

// Wishlist APIs
export const wishlistAPI = {
  getAll: (customerId: number) => api(`/customers/${customerId}/wishlist/`),

  add: (customerId: number, productId: number) =>
    api(`/customers/${customerId}/wishlist/`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),

  remove: (customerId: number, itemId: number) =>
    api(`/customers/${customerId}/wishlist/${itemId}/`, {
      method: 'DELETE',
    }),

  getMyWishlist: () => api('/customers/me/wishlist/'),

  addToMyWishlist: (productId: number) =>
    api('/customers/me/wishlist/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),
};

// Cart APIs
export const cartAPI = {
  get: () => api('/cart/'),

  addItem: (productId: number, quantity: number, variantId?: number) =>
    api('/cart/items/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity, variant_id: variantId }),
    }),

  updateItem: (itemId: number, quantity: number) =>
    api(`/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId: number) =>
    api(`/cart/items/${itemId}/`, {
      method: 'DELETE',
    }),

  clear: () =>
    api('/cart/clear/', {
      method: 'POST',
    }),
};

// Product Variant APIs
export const productVariantAPI = {
  getAll: (productId: number) => api(`/products/${productId}/variants/`),

  create: (productId: number, data: any) =>
    api(`/products/${productId}/variants/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (productId: number, variantId: number, data: any) =>
    api(`/products/${productId}/variants/${variantId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (productId: number, variantId: number) =>
    api(`/products/${productId}/variants/${variantId}/`, {
      method: 'DELETE',
    }),
};

// Product Image APIs
export const productImageAPI = {
  getAll: (productId: number) => api(`/products/${productId}/images/`),

  upload: async (productId: number, file: File, isPrimary: boolean = false) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_primary', String(isPrimary));

    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:8000/api/v1/products/${productId}/images/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },

  delete: (productId: number, imageId: number) =>
    api(`/products/${productId}/images/${imageId}/`, {
      method: 'DELETE',
    }),

  setPrimary: (productId: number, imageId: number) =>
    api(`/products/${productId}/images/${imageId}/set-primary/`, {
      method: 'POST',
    }),
};

// Product Review APIs
export const productReviewAPI = {
  getAll: (productId: number) => api(`/products/${productId}/reviews/`),

  create: (productId: number, data: any) =>
    api(`/products/${productId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (productId: number, reviewId: number, data: any) =>
    api(`/products/${productId}/reviews/${reviewId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (productId: number, reviewId: number) =>
    api(`/products/${productId}/reviews/${reviewId}/`, {
      method: 'DELETE',
    }),

  approve: (productId: number, reviewId: number) =>
    api(`/products/${productId}/reviews/${reviewId}/approve/`, {
      method: 'POST',
    }),
};

// Inventory Log APIs
export const inventoryLogAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/inventory-logs/${query}`);
  },

  getByInventory: (inventoryId: number) => api(`/inventory/${inventoryId}/logs/`),
};

// Warehouse Location APIs
export const warehouseLocationAPI = {
  getAll: (warehouseId: number) => api(`/warehouses/${warehouseId}/locations/`),

  create: (warehouseId: number, data: any) =>
    api(`/warehouses/${warehouseId}/locations/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (warehouseId: number, locationId: number, data: any) =>
    api(`/warehouses/${warehouseId}/locations/${locationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (warehouseId: number, locationId: number) =>
    api(`/warehouses/${warehouseId}/locations/${locationId}/`, {
      method: 'DELETE',
    }),
};

// Notification Template APIs
export const notificationTemplateAPI = {
  getAll: () => api('/notifications/templates/'),

  getOne: (id: number) => api(`/notifications/templates/${id}/`),

  create: (data: any) =>
    api('/notifications/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/notifications/templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/notifications/templates/${id}/`, {
      method: 'DELETE',
    }),
};

// Send Notification APIs
export const sendNotificationAPI = {
  send: (data: any) =>
    api('/notifications/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  broadcast: (data: any) =>
    api('/notifications/broadcast/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Vendor Staff APIs
export const vendorStaffAPI = {
  getAll: (vendorId: number) => api(`/vendors/${vendorId}/staff/`),

  create: (vendorId: number, data: any) =>
    api(`/vendors/${vendorId}/staff/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (vendorId: number, staffId: number, data: any) =>
    api(`/vendors/${vendorId}/staff/${staffId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (vendorId: number, staffId: number) =>
    api(`/vendors/${vendorId}/staff/${staffId}/`, {
      method: 'DELETE',
    }),
};

// Vendor actions
export const vendorActionsAPI = {
  approve: (id: number) =>
    api(`/vendors/${id}/approve/`, {
      method: 'POST',
    }),

  reject: (id: number, reason?: string) =>
    api(`/vendors/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  suspend: (id: number, reason?: string) =>
    api(`/vendors/${id}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  reactivate: (id: number) =>
    api(`/vendors/${id}/reactivate/`, {
      method: 'POST',
    }),

  getStats: (id: number) => api(`/vendors/${id}/stats/`),
};

// Sales Order Item APIs
export const salesOrderItemAPI = {
  getAll: (orderId: number) => api(`/sales-orders/${orderId}/items/`),

  create: (orderId: number, data: any) =>
    api(`/sales-orders/${orderId}/items/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (orderId: number, itemId: number, data: any) =>
    api(`/sales-orders/${orderId}/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (orderId: number, itemId: number) =>
    api(`/sales-orders/${orderId}/items/${itemId}/`, {
      method: 'DELETE',
    }),
};

// Purchase Order Item APIs
export const purchaseOrderItemAPI = {
  getAll: (orderId: number) => api(`/purchase-orders/${orderId}/items/`),

  create: (orderId: number, data: any) =>
    api(`/purchase-orders/${orderId}/items/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (orderId: number, itemId: number, data: any) =>
    api(`/purchase-orders/${orderId}/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (orderId: number, itemId: number) =>
    api(`/purchase-orders/${orderId}/items/${itemId}/`, {
      method: 'DELETE',
    }),
};

// Delivery Proof APIs
export const deliveryProofAPI = {
  get: (deliveryId: number) => api(`/deliveries/${deliveryId}/proof/`),

  upload: async (deliveryId: number, data: { otp?: string; signature?: File; notes?: string }) => {
    if (data.signature) {
      const formData = new FormData();
      if (data.otp) formData.append('otp', data.otp);
      formData.append('signature', data.signature);
      if (data.notes) formData.append('notes', data.notes);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/deliveries/${deliveryId}/proof/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return response.json();
    }
    return api(`/deliveries/${deliveryId}/proof/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Token Management APIs
export const tokenAPI = {
  getOutstanding: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/auth/tokens/outstanding/${query}`);
  },

  getBlacklisted: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/auth/tokens/blacklisted/${query}`);
  },

  blacklist: (tokenId: number) =>
    api(`/auth/tokens/${tokenId}/blacklist/`, {
      method: 'POST',
    }),

  blacklistAll: (userId: number) =>
    api(`/auth/tokens/blacklist-all/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
};

// Vendor Order APIs (Multi-vendor order splits)
export const vendorOrderAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/sales-orders/vendor-orders/${query}`);
  },

  getOne: (id: number) => api(`/sales-orders/vendor-orders/${id}/`),

  confirm: (id: number) =>
    api(`/sales-orders/vendor-orders/${id}/confirm/`, {
      method: 'POST',
    }),

  process: (id: number) =>
    api(`/sales-orders/vendor-orders/${id}/process/`, {
      method: 'POST',
    }),

  pack: (id: number) =>
    api(`/sales-orders/vendor-orders/${id}/pack/`, {
      method: 'POST',
    }),

  ship: (id: number) =>
    api(`/sales-orders/vendor-orders/${id}/ship/`, {
      method: 'POST',
    }),

  deliver: (id: number) =>
    api(`/sales-orders/vendor-orders/${id}/deliver/`, {
      method: 'POST',
    }),

  getStats: () => api('/sales-orders/vendor-orders/stats/'),
};

// Return Request APIs
export const returnRequestAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/sales-orders/returns/${query}`);
  },

  getOne: (id: number) => api(`/sales-orders/returns/${id}/`),

  create: (data: any) =>
    api('/sales-orders/returns/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: number) =>
    api(`/sales-orders/returns/${id}/approve/`, {
      method: 'POST',
    }),

  reject: (id: number, reason: string) =>
    api(`/sales-orders/returns/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  schedulePickup: (id: number, data: { pickup_date: string; agent_id?: number }) =>
    api(`/sales-orders/returns/${id}/schedule_pickup/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completePickup: (id: number) =>
    api(`/sales-orders/returns/${id}/complete_pickup/`, {
      method: 'POST',
    }),

  receive: (id: number) =>
    api(`/sales-orders/returns/${id}/receive/`, {
      method: 'POST',
    }),

  inspect: (id: number, data: { result: string; notes?: string }) =>
    api(`/sales-orders/returns/${id}/inspect/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  initiateRefund: (id: number, data?: { refund_method?: string }) =>
    api(`/sales-orders/returns/${id}/initiate_refund/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  getStats: () => api('/sales-orders/returns/stats/'),
};

// Coupon APIs
export const couponAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/sales-orders/coupons/${query}`);
  },

  getOne: (id: number) => api(`/sales-orders/coupons/${id}/`),

  create: (data: any) =>
    api('/sales-orders/coupons/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/sales-orders/coupons/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/sales-orders/coupons/${id}/`, {
      method: 'DELETE',
    }),

  validate: (code: string, cartTotal: number) =>
    api('/sales-orders/coupons/validate/', {
      method: 'POST',
      body: JSON.stringify({ code, cart_total: cartTotal }),
    }),

  activate: (id: number) =>
    api(`/sales-orders/coupons/${id}/activate/`, {
      method: 'POST',
    }),

  deactivate: (id: number) =>
    api(`/sales-orders/coupons/${id}/deactivate/`, {
      method: 'POST',
    }),

  getUsage: (id: number) => api(`/sales-orders/coupons/${id}/usage/`),

  getStats: () => api('/sales-orders/coupons/stats/'),
};

// Vendor Settlement APIs
export const vendorSettlementAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/settlements/${query}`);
  },

  getOne: (id: number) => api(`/vendors/settlements/${id}/`),

  generate: (data: { vendor_id: number; period_start: string; period_end: string }) =>
    api('/vendors/settlements/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: number) =>
    api(`/vendors/settlements/${id}/approve/`, {
      method: 'POST',
    }),

  processPayment: (id: number, data: { payment_method?: string; transaction_id?: string }) =>
    api(`/vendors/settlements/${id}/process_payment/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: () => api('/vendors/settlements/stats/'),
};

// Vendor Payout APIs
export const vendorPayoutAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/payouts/${query}`);
  },

  getOne: (id: number) => api(`/vendors/payouts/${id}/`),
};

// Vendor Ledger APIs
export const vendorLedgerAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/ledger/${query}`);
  },
};

// Commission Record APIs
export const commissionAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/commissions/${query}`);
  },
};

// Brand APIs
export const brandAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/products/brands/${query}`);
  },

  getOne: (id: number) => api(`/products/brands/${id}/`),

  create: (data: any) =>
    api('/products/brands/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/products/brands/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/products/brands/${id}/`, {
      method: 'DELETE',
    }),

  verify: (id: number) =>
    api(`/products/brands/${id}/verify/`, {
      method: 'POST',
    }),

  feature: (id: number) =>
    api(`/products/brands/${id}/feature/`, {
      method: 'POST',
    }),

  getProducts: (id: number) => api(`/products/brands/${id}/products/`),
};

// Category Attribute APIs
export const categoryAttributeAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/products/attributes/${query}`);
  },

  getOne: (id: number) => api(`/products/attributes/${id}/`),

  create: (data: any) =>
    api('/products/attributes/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/products/attributes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/products/attributes/${id}/`, {
      method: 'DELETE',
    }),

  getByCategory: (categoryId: number) =>
    api(`/products/attributes/by_category/?category_id=${categoryId}`),

  getFilters: (categoryId: number) =>
    api(`/products/attributes/filters/?category_id=${categoryId}`),
};

// Product Attribute Value APIs
export const productAttributeValueAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/products/attribute-values/${query}`);
  },

  create: (data: any) =>
    api('/products/attribute-values/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/products/attribute-values/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/products/attribute-values/${id}/`, {
      method: 'DELETE',
    }),

  bulkCreate: (productId: number, values: any[]) =>
    api('/products/attribute-values/bulk_create/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, values }),
    }),
};

// Activity Log APIs
export const activityLogAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/activity-logs/${query}`);
  },
  getOne: (id: number) => api(`/activity-logs/${id}/`),
};

// Token Management APIs
export const tokenAPI = {
  getOutstanding: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/tokens/outstanding/${query}`);
  },
  getBlacklisted: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/tokens/blacklisted/${query}`);
  },
  blacklist: (refreshToken: string) => 
    api('/tokens/blacklisted/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken })
    }),

  deleteBlacklisted: (id: number) => 
    api(`/tokens/blacklisted/${id}/`, {
        method: 'DELETE',
    }),
};

// OTP Request APIs
export const otpRequestAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/auth/otp-requests/${query}`);
  },
  getOne: (id: number) => api(`/auth/otp-requests/${id}/`),
};

// Review APIs
export const reviewAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/products/reviews/${query}`);
  },
  getOne: (id: number) => api(`/products/reviews/${id}/`),
  create: (data: any) =>
    api('/products/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    api(`/products/reviews/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api(`/products/reviews/${id}/`, {
      method: 'DELETE',
    }),
  approve: (id: number) =>
    api(`/products/reviews/${id}/approve/`, {
      method: 'POST',
    }),
};

// Vendor Staff APIs
export const vendorStaffAPI = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api(`/vendors/staff/${query}`);
  },
  getOne: (id: number) => api(`/vendors/staff/${id}/`),
  create: (data: any) =>
    api('/vendors/staff/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    api(`/vendors/staff/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api(`/vendors/staff/${id}/`, {
      method: 'DELETE',
    }),
};

export const settingsAPI = {
  store: {
    getAll: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return api(`/settings/store/${query}`);
    },
    getActive: () => api('/settings/store/active/'),
    update: (id: number, data: any) => api(`/settings/store/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    create: (data: any) => api('/settings/store/', { method: 'POST', body: JSON.stringify(data) }),
  },
  currencies: {
    getAll: () => api('/settings/currencies/'),
    getOne: (id: number) => api(`/settings/currencies/${id}/`),
    create: (data: any) => api('/settings/currencies/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/settings/currencies/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/settings/currencies/${id}/`, { method: 'DELETE' }),
  },
  locations: {
    getAll: () => api('/settings/locations/'),
    create: (data: any) => api('/settings/locations/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/settings/locations/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/settings/locations/${id}/`, { method: 'DELETE' }),
  },
  shipping: {
    getAll: () => api('/settings/shipping/'),
    create: (data: any) => api('/settings/shipping/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/settings/shipping/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/settings/shipping/${id}/`, { method: 'DELETE' }),
    calculate: (payload: { cart_total: number; country?: string; weight?: number }) =>
      api('/settings/shipping/calculate/', { method: 'POST', body: JSON.stringify(payload) }),
  },
  tax: {
    getAll: () => api('/settings/tax/'),
    create: (data: any) => api('/settings/tax/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/settings/tax/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/settings/tax/${id}/`, { method: 'DELETE' }),
    calculate: (payload: { subtotal: number; country?: string; state?: string }) =>
      api('/settings/tax/calculate/', { method: 'POST', body: JSON.stringify(payload) }),
  },
  checkout: {
    getActive: () => api('/settings/checkout/active/'),
    update: (id: number, data: any) => api(`/settings/checkout/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  invoice: {
    getActive: () => api('/settings/invoice/active/'),
    update: (id: number, data: any) => api(`/settings/invoice/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  returnPolicies: {
    getAll: () => api('/settings/return-policies/'),
    create: (data: any) => api('/settings/return-policies/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/settings/return-policies/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/settings/return-policies/${id}/`, { method: 'DELETE' }),
  },
};

export const offersAPI = {
  coupons: {
    getAll: () => api('/offers/coupons/'),
    getOne: (id: number) => api(`/offers/coupons/${id}/`),
    create: (data: any) => api('/offers/coupons/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => api(`/offers/coupons/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => api(`/offers/coupons/${id}/`, { method: 'DELETE' }),
    validate: (payload: { code: string; cart_total: number }) =>
      api('/offers/coupons/validate/', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

export const returnsAPI = {
  getAll: () => api('/returns/returns/'),
  getOne: (id: number) => api(`/returns/returns/${id}/`),
  create: (data: any) => api('/returns/returns/', { method: 'POST', body: JSON.stringify(data) }),
};
