// API Client
export { default as apiClient, api, tokenManager } from './client';

// API Services
export { authApi } from './auth';
export { productsApi } from './products';
export { categoriesApi } from './categories';
export { vendorsApi } from './vendors';
export { ordersApi } from './orders';
export { purchaseOrdersApi } from './purchaseOrders';
export { inventoryApi } from './inventory';
export { warehousesApi } from './warehouses';
export { usersApi } from './users';
export { customersApi } from './customers';

// Re-export types
export type { RequestOtpPayload, VerifyOtpPayload, RequestOtpResponse } from './auth';
export type { ProductsQueryParams } from './products';
export type { CategoriesQueryParams, CategoryFormData } from './categories';
export type { VendorsQueryParams, SuppliersQueryParams, SupplierFormData } from './vendors';
export type { OrdersQueryParams } from './orders';
export type { PurchaseOrdersQueryParams } from './purchaseOrders';
export type { InventoryQueryParams, InventoryAdjustment, InventoryTransfer } from './inventory';
export type { WarehousesQueryParams, LocationFormData } from './warehouses';
export type { UsersQueryParams, UserFormData } from './users';
export type { CustomersQueryParams } from './customers';
