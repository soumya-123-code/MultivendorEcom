# ERP E-Commerce API Documentation

## Base URL
```
/api/v1/
```

## Authentication
- **Method**: JWT (JSON Web Token) via OTP-based passwordless login
- **Token Types**: Access Token (15 min) + Refresh Token (7 days)
- **Header**: `Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints

### Base Path: `/api/v1/auth/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/request-otp/` | POST | Public | Request OTP for login |
| `/verify-otp/` | POST | Public | Verify OTP and get tokens |
| `/refresh/` | POST | Public | Refresh access token |
| `/logout/` | POST | Required | Logout and blacklist token |

#### POST `/api/v1/auth/request-otp/`
Request a 6-digit OTP sent to email. Rate limited: 5/minute.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp_valid_for": 300
  }
}
```

#### POST `/api/v1/auth/verify-otp/`
Verify OTP and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access": "eyJ...",
    "refresh": "eyJ...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

#### POST `/api/v1/auth/refresh/`
Get new access token using refresh token.

**Request Body:**
```json
{
  "refresh": "eyJ..."
}
```

#### POST `/api/v1/auth/logout/`
Blacklist refresh token to logout.

**Request Body:**
```json
{
  "refresh": "eyJ..."
}
```

---

## 2. User Management Endpoints

### Base Path: `/api/v1/users/`

### Current User

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/me/` | GET | Required | Get current user profile |
| `/me/` | PATCH | Required | Update current user |
| `/me/profile/` | GET | Required | Get extended profile |
| `/me/profile/` | PATCH | Required | Update extended profile |

### Admin User Management (Admin Only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Admin | List all users |
| `/` | POST | Admin | Create new user |
| `/{id}/` | GET | Admin | Get user details |
| `/{id}/` | PUT | Admin | Update user (full) |
| `/{id}/` | PATCH | Admin | Update user (partial) |
| `/{id}/` | DELETE | Admin | Delete user |
| `/{id}/change_role/` | POST | SuperAdmin | Change user role |
| `/{id}/activate/` | POST | Admin | Activate user |
| `/{id}/deactivate/` | POST | Admin | Deactivate user |

**Query Parameters:**
- `role` - Filter by role (admin, vendor, customer, delivery_agent)
- `is_active` - Filter by active status
- `is_verified` - Filter by verification status
- `search` - Search in email, first_name, last_name, phone
- `ordering` - Sort by: date_joined, email, role

---

## 3. Vendor Endpoints

### Base Path: `/api/v1/vendors/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Public | List approved vendors |
| `/` | POST | Required | Create vendor profile |
| `/{id}/` | GET | Public | Get vendor details |
| `/{id}/` | PUT | Vendor/Admin | Update vendor (full) |
| `/{id}/` | PATCH | Vendor/Admin | Update vendor (partial) |
| `/{id}/` | DELETE | Vendor/Admin | Delete vendor |
| `/me/` | GET | Vendor | Get own vendor profile |
| `/me/` | PATCH | Vendor | Update own vendor profile |
| `/{id}/stats/` | GET | Required | Get vendor statistics |
| `/{id}/approve/` | POST | Admin | Approve vendor |
| `/{id}/reject/` | POST | Admin | Reject vendor |
| `/{id}/suspend/` | POST | Admin | Suspend vendor |
| `/{id}/reactivate/` | POST | Admin | Reactivate vendor |

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, suspended)
- `city` - Filter by city
- `state` - Filter by state
- `search` - Search in store_name, business_name, city
- `ordering` - Sort by: created_at, store_name, rating

---

## 4. Supplier Endpoints

### Base Path: `/api/v1/vendors/suppliers/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List suppliers |
| `/` | POST | Vendor/Admin | Create supplier |
| `/{id}/` | GET | Vendor/Admin | Get supplier details |
| `/{id}/` | PUT | Vendor/Admin | Update supplier (full) |
| `/{id}/` | PATCH | Vendor/Admin | Update supplier (partial) |
| `/{id}/` | DELETE | Vendor/Admin | Delete supplier |

**Query Parameters:**
- `status` - Filter by status
- `search` - Search in name, contact_person, email
- `ordering` - Sort by: name, created_at

---

## 5. Customer Endpoints

### Base Path: `/api/v1/customers/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Admin | List all customers |
| `/` | POST | Admin | Create customer |
| `/{id}/` | GET | Admin | Get customer details |
| `/{id}/` | PUT | Admin | Update customer (full) |
| `/{id}/` | PATCH | Admin | Update customer (partial) |
| `/{id}/` | DELETE | Admin | Delete customer |
| `/me/` | GET | Required | Get own customer profile |

---

## 6. Customer Addresses

### Base Path: `/api/v1/customers/addresses/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Required | List user's addresses |
| `/` | POST | Required | Create new address |
| `/{id}/` | GET | Required | Get address details |
| `/{id}/` | PUT | Required | Update address (full) |
| `/{id}/` | PATCH | Required | Update address (partial) |
| `/{id}/` | DELETE | Required | Delete address |

**Address Fields:**
```json
{
  "address_type": "shipping|billing",
  "label": "Home|Office",
  "full_name": "John Doe",
  "phone": "+91XXXXXXXXXX",
  "address_line1": "123 Main St",
  "address_line2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "landmark": "Near Station",
  "is_default": true
}
```

---

## 7. Shopping Cart

### Base Path: `/api/v1/cart/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Required | Get current cart |
| `/` | POST | Required | Add item to cart |
| `/items/{item_id}/` | PATCH | Required | Update item quantity |
| `/items/{item_id}/` | DELETE | Required | Remove item from cart |

#### POST `/api/v1/cart/`
Add item to cart.

**Request Body:**
```json
{
  "product_id": 1,
  "variant_id": null,
  "quantity": 2
}
```

#### PATCH `/api/v1/cart/items/{item_id}/`
Update quantity (set to 0 to remove).

**Request Body:**
```json
{
  "quantity": 3
}
```

---

## 8. Wishlist

### Base Path: `/api/v1/customers/wishlist/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Required | List wishlist items |
| `/` | POST | Required | Add to wishlist |
| `/{id}/` | GET | Required | Get wishlist item |
| `/{id}/` | DELETE | Required | Remove from wishlist |
| `/add/` | POST | Required | Add product by ID |
| `/remove/` | DELETE | Required | Remove product by ID |

#### POST `/api/v1/customers/wishlist/add/`
```json
{
  "product_id": 1
}
```

---

## 9. Product Endpoints

### Base Path: `/api/v1/products/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Public | List active products |
| `/` | POST | Vendor/Admin | Create product |
| `/{id}/` | GET | Public | Get product details |
| `/{id}/` | PUT | Vendor/Admin | Update product (full) |
| `/{id}/` | PATCH | Vendor/Admin | Update product (partial) |
| `/{id}/` | DELETE | Vendor/Admin | Delete product |
| `/{id}/publish/` | POST | Vendor/Admin | Publish product |
| `/{id}/unpublish/` | POST | Vendor/Admin | Unpublish product |
| `/{id}/reviews/` | GET | Public | Get product reviews |

**Query Parameters:**
- `category` - Filter by category ID
- `status` - Filter by status (draft, published, archived)
- `is_featured` - Filter featured products
- `search` - Search in name, sku, description
- `ordering` - Sort by: created_at, name, selling_price, rating

**Product Fields:**
```json
{
  "name": "Product Name",
  "slug": "product-name",
  "sku": "PRD-001",
  "category": 1,
  "short_description": "Brief description",
  "description": "Full description",
  "base_price": "100.00",
  "selling_price": "89.99",
  "cost_price": "50.00",
  "tax_percentage": "18.00",
  "track_inventory": true,
  "allow_backorder": false,
  "low_stock_threshold": 10,
  "status": "draft|published|archived",
  "is_featured": false
}
```

---

## 10. Product Categories

### Base Path: `/api/v1/categories/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Public | List categories |
| `/` | POST | Vendor/Admin | Create category |
| `/{id}/` | GET | Public | Get category details |
| `/{id}/` | PUT | Vendor/Admin | Update category (full) |
| `/{id}/` | PATCH | Vendor/Admin | Update category (partial) |
| `/{id}/` | DELETE | Vendor/Admin | Delete category |
| `/tree/` | GET | Public | Get category tree |

**Query Parameters:**
- `parent` - Filter by parent category
- `is_featured` - Filter featured categories
- `level` - Filter by nesting level
- `search` - Search in name
- `ordering` - Sort by: display_order, name

---

## 11. Product Reviews

### Base Path: `/api/v1/products/reviews/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Public | List approved reviews |
| `/` | POST | Required | Create review |
| `/{id}/` | GET | Public | Get review details |
| `/{id}/` | PUT | Required | Update review (full) |
| `/{id}/` | PATCH | Required | Update review (partial) |
| `/{id}/` | DELETE | Required | Delete review |
| `/{id}/helpful/` | POST | Required | Mark as helpful |

**Query Parameters:**
- `product` - Filter by product ID
- `rating` - Filter by rating (1-5)
- `is_approved` - Filter by approval status
- `ordering` - Sort by: created_at, rating, helpful_count

**Review Fields:**
```json
{
  "product": 1,
  "order": 1,
  "rating": 5,
  "title": "Great product!",
  "review": "Detailed review text...",
  "images": []
}
```

---

## 12. Pending Implementations

The following endpoints are defined but not yet implemented:

| Path | Description |
|------|-------------|
| `/api/v1/inventory/` | Inventory management |
| `/api/v1/warehouses/` | Warehouse management |
| `/api/v1/purchase-orders/` | Purchase order management |
| `/api/v1/sales-orders/` | Sales order management |
| `/api/v1/payments/` | Payment processing |
| `/api/v1/notifications/` | Notification system |
| `/api/v1/deliveries/` | Delivery management |

---

## API Documentation UI

- **Swagger UI**: `/api/docs/`
- **ReDoc**: `/api/redoc/`
- **OpenAPI Schema**: `/api/schema/`

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Success Response Format

All success responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

## Pagination

Paginated responses include:

```json
{
  "count": 100,
  "next": "http://api/v1/resource/?page=2",
  "previous": null,
  "results": []
}
```

Default page size: 20 items

---

## Rate Limiting

- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour
- **OTP requests**: 5 requests/minute

---

## Permission Levels

| Level | Description |
|-------|-------------|
| Public | No authentication required |
| Required | Any authenticated user |
| Admin | Admin role required |
| SuperAdmin | Super admin role only |
| Vendor | User with vendor profile |
| Vendor/Admin | Either vendor or admin |
