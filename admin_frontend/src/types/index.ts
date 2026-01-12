// User & Authentication Types
export interface User {
  id: number;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar: ImageObject | null;
  is_active: boolean;
  is_staff: boolean;
  is_verified: boolean;
  last_login_ip: string | null;
  language: string;
  timezone: string;
  currency: string;
  date_joined: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'vendor' | 'customer' | 'delivery_agent';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

// Image Objects
export interface ImageObject {
  url: string;
  thumbnail?: string;
  alt?: string;
}

// Vendor Types
export interface Vendor {
  id: number;
  user: number;
  store_name: string;
  store_slug: string;
  store_logo: ImageObject | null;
  store_banner: ImageObject | null;
  description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_name: string | null;
  business_type: BusinessType | null;
  tax_id: string | null;
  registration_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_account_holder: string | null;
  status: VendorStatus;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  commission_rate: string;
  min_order_value: string;
  max_order_value: string | null;
  rating: string;
  total_products: number;
  total_orders: number;
  total_revenue: string;
  created_at: string;
  updated_at: string;
}

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';
export type BusinessType = 'individual' | 'company' | 'partnership';

// Supplier Types
export interface Supplier {
  id: number;
  vendor: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Customer Types
export interface Customer {
  id: number;
  user: User;
  loyalty_points: number;
  total_spent: string;
  total_orders: number;
  preferred_payment_method: string | null;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: number;
  customer: number;
  address_type: 'shipping' | 'billing' | 'both';
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
}

// Product Types
export interface Product {
  id: number;
  vendor: number;
  vendor_name?: string;
  category: number | null;
  category_name?: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  short_description: string | null;
  description: string | null;
  highlights: KeyValue[] | null;
  specifications: KeyValue[] | null;
  base_price: string;
  selling_price: string;
  cost_price: string | null;
  compare_at_price: string | null;
  tax_class: TaxClass;
  tax_percentage: string;
  hsn_code: string | null;
  weight: string | null;
  dimensions: Dimensions | null;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  images: ImageObject[] | null;
  videos: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  status: ProductStatus;
  is_featured: boolean;
  view_count: number;
  order_count: number;
  rating: string;
  review_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product: number;
  name: string;
  sku: string;
  barcode: string | null;
  attributes: Record<string, string>;
  price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  weight: string | null;
  dimensions: Dimensions | null;
  image: ImageObject | null;
  position: number;
}

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type TaxClass = 'standard' | 'reduced' | 'zero' | 'exempt';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface KeyValue {
  key: string;
  value: string;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: ImageObject | null;
  parent: number | null;
  level: number;
  path: string | null;
  display_order: number;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  vendor: number | null;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// Review Types
export interface ProductReview {
  id: number;
  product: number;
  customer: number;
  customer_name?: string;
  order: number | null;
  rating: number;
  title: string | null;
  review: string | null;
  images: ImageObject[] | null;
  is_approved: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// Cart Types
export interface Cart {
  id: number;
  customer: number | null;
  session_id: string | null;
  items: CartItem[];
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  coupon_code: string | null;
}

export interface CartItem {
  id: number;
  cart: number;
  product: number;
  product_name?: string;
  variant: number | null;
  quantity: number;
  unit_price: string;
  total_price: string;
}

// Order Types
export interface SalesOrder {
  id: number;
  vendor: number;
  vendor_name?: string;
  customer: number;
  customer_name?: string;
  order_number: string;
  order_date: string;
  order_source: OrderSource;
  status: SalesOrderStatus;
  shipping_address: CustomerAddress | null;
  billing_address: CustomerAddress | null;
  shipping_address_snapshot: Record<string, any> | null;
  billing_address_snapshot: Record<string, any> | null;
  discount_type: string | null;
  discount_value: string;
  coupon_code: string | null;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  total_amount: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  shipping_method: string | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  items: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: number;
  sales_order: number;
  product: number;
  variant: number | null;
  product_name: string;
  product_sku: string;
  product_image: ImageObject | null;
  quantity_ordered: number;
  quantity_shipped: number;
  quantity_delivered: number;
  quantity_cancelled: number;
  quantity_returned: number;
  unit_price: string;
  discount_type: string | null;
  discount_value: string;
  discount_amount: string;
  tax_percentage: string;
  tax_amount: string;
  subtotal: string;
  total: string;
  notes: string | null;
}

export type SalesOrderStatus = 
  | 'pending' | 'confirmed' | 'processing' | 'packed' 
  | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'delivery_failed'
  | 'return_requested' | 'return_approved' | 'return_rejected' | 'return_shipped'
  | 'return_received' | 'refunded' | 'completed' | 'cancelled';

export type OrderSource = 'web' | 'mobile' | 'admin' | 'api' | 'pos';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'partial';
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod' | 'wallet';

// Purchase Order Types
export interface PurchaseOrder {
  id: number;
  vendor: number;
  vendor_name?: string;
  supplier: number;
  supplier_name?: string;
  warehouse: number;
  warehouse_name?: string;
  po_number: string;
  po_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: PurchaseOrderStatus;
  payment_terms: string | null;
  payment_status: PaymentStatus;
  discount_type: DiscountType;
  discount_value: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  total_amount: string;
  paid_amount: string;
  notes: string | null;
  internal_notes: string | null;
  terms_and_conditions: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order: number;
  product: number;
  product_name?: string;
  variant: number | null;
  quantity_ordered: number;
  quantity_received: number;
  quantity_cancelled: number;
  quantity_returned: number;
  unit_price: string;
  selling_price: string | null;
  discount_type: string | null;
  discount_value: string;
  discount_amount: string;
  tax_percentage: string;
  tax_amount: string;
  subtotal: string;
  total: string;
  notes: string | null;
}

export type PurchaseOrderStatus = 
  | 'draft' | 'pending_approval' | 'approved' | 'rejected' 
  | 'sent' | 'confirmed' | 'receiving' | 'partial_received' 
  | 'received' | 'complete' | 'cancelled' | 'returned';

export type DiscountType = 'none' | 'percentage' | 'amount' | 'item_level';

// Inventory Types
export interface Inventory {
  id: number;
  product: number;
  product_name?: string;
  variant: number | null;
  warehouse: number;
  warehouse_name?: string;
  location: number | null;
  location_code?: string;
  vendor: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  batch_number: string | null;
  serial_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  buy_price: string | null;
  sell_price: string | null;
  mrp: string | null;
  stock_status: StockStatus;
  inward_type: InwardType;
  purchase_order: number | null;
  created_at: string;
  updated_at: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'damaged';
export type InwardType = 'purchase' | 'return' | 'transfer' | 'adjustment' | 'initial';

// Warehouse Types
export interface Warehouse {
  id: number;
  vendor: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  coordinates: { lat: number; lng: number } | null;
  manager: number | null;
  manager_name?: string;
  phone: string | null;
  email: string | null;
  size: 'small' | 'medium' | 'large' | 'xlarge' | null;
  total_capacity: number | null;
  used_capacity: number;
  warehouse_type: WarehouseType;
  status: 'active' | 'inactive' | 'maintenance';
  locations?: RackShelfLocation[];
  created_at: string;
  updated_at: string;
}

export interface RackShelfLocation {
  id: number;
  warehouse: number;
  name: string;
  code: string;
  floor: string | null;
  aisle: string | null;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
  capacity: number | null;
  location_code: string;
}

export type WarehouseType = 'owned' | 'leased' | 'third_party';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: any;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Dashboard Stats
export interface DashboardStats {
  total_revenue: string;
  total_orders: number;
  total_products: number;
  total_customers: number;
  pending_orders: number;
  low_stock_items: number;
  recent_orders: SalesOrder[];
  top_products: Product[];
  revenue_chart: ChartData[];
  orders_chart: ChartData[];
}

export interface ChartData {
  label: string;
  value: number;
}

// Form Types
export interface ProductFormData {
  name: string;
  sku: string;
  category: number | null;
  short_description?: string;
  description?: string;
  base_price: number;
  selling_price: number;
  cost_price?: number;
  tax_percentage: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  status: ProductStatus;
  is_featured: boolean;
  images?: File[];
}

export interface VendorFormData {
  store_name: string;
  store_slug: string;
  description?: string;
  business_email?: string;
  business_phone?: string;
  business_name?: string;
  business_type?: BusinessType;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  warehouse_type: WarehouseType;
}

export interface PurchaseOrderFormData {
  supplier: number;
  warehouse: number;
  po_date: string;
  expected_delivery_date?: string;
  payment_terms?: string;
  discount_type: DiscountType;
  discount_value: number;
  shipping_amount: number;
  notes?: string;
  items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
  product: number;
  variant?: number;
  quantity_ordered: number;
  unit_price: number;
  selling_price?: number;
  discount_type?: string;
  discount_value?: number;
  tax_percentage: number;
}
