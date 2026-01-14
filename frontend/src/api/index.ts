// API Client
export { default as apiClient, api, tokenManager } from './client';

// API Services
export { default as authApi } from './auth';
export { default as usersApi } from './users';
export { default as vendorsApi, suppliersApi } from './vendors';
export { default as productsApi, categoriesApi } from './products';
export { default as warehousesApi } from './warehouses';
export { default as inventoryApi } from './inventory';
export { default as purchaseOrdersApi } from './purchaseOrders';
export { default as salesOrdersApi } from './salesOrders';
export { deliveryAgentsApi, deliveriesApi } from './delivery';
export { default as notificationsApi } from './notifications';

// Combined delivery API for easier imports
export const deliveryApi = {
  agents: {
    list: (params?: any) => import('./delivery').then(m => m.deliveryAgentsApi.list(params)),
    getById: (id: number) => import('./delivery').then(m => m.deliveryAgentsApi.getById(id)),
    approve: (id: number) => import('./delivery').then(m => m.deliveryAgentsApi.approve(id)),
    reject: (id: number, reason: string) => import('./delivery').then(m => m.deliveryAgentsApi.reject(id, reason)),
    suspend: (id: number) => import('./delivery').then(m => m.deliveryAgentsApi.suspend(id)),
    activate: (id: number) => import('./delivery').then(m => m.deliveryAgentsApi.activate(id)),
    updateAvailability: (isAvailable: boolean) => import('./delivery').then(m => m.deliveryAgentsApi.updateAvailability(isAvailable)),
    stats: () => import('./delivery').then(m => m.deliveryAgentsApi.getStats()),
  },
  deliveries: {
    list: (params?: any) => import('./delivery').then(m => m.deliveriesApi.list(params)),
    getById: (id: number) => import('./delivery').then(m => m.deliveriesApi.getById(id)),
    myDeliveries: (params?: any) => import('./delivery').then(m => m.deliveriesApi.getMyDeliveries(params)),
    accept: (id: number) => import('./delivery').then(m => m.deliveriesApi.accept(id)),
    reject: (id: number, reason: string) => import('./delivery').then(m => m.deliveriesApi.reject(id, reason)),
    pickup: (id: number) => import('./delivery').then(m => m.deliveriesApi.pickup(id)),
    inTransit: (id: number) => import('./delivery').then(m => m.deliveriesApi.inTransit(id)),
    outForDelivery: (id: number) => import('./delivery').then(m => m.deliveriesApi.outForDelivery(id)),
    complete: (id: number, proof: any) => import('./delivery').then(m => m.deliveriesApi.complete(id, proof)),
    fail: (id: number, reason: string) => import('./delivery').then(m => m.deliveriesApi.fail(id, reason)),
    collectCOD: (id: number, amount: number) => import('./delivery').then(m => m.deliveriesApi.collectCOD(id, amount)),
  },
};
